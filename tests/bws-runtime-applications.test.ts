import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  BWS_API_PORT_ENV,
  BWS_UPSTREAM_LOCK_PATH_ENV,
  BWS_WORKER_ID_ENV,
  BWS_WORKER_LEASE_DURATION_MS_ENV,
  BWS_WORKER_QUEUE_NAME_ENV,
  SUREBET_EXECUTION_ENABLED_ENV,
  SUREBET_PROVIDER_CONNECTIONS_ENV,
  SUREBET_RUNTIME_MODE_ENV,
  accepted,
  resolveBwsServiceRuntimeConfig,
  runBwsPrivatePaperWorkerCli,
  runBwsReadOnlyApiCli,
  startBwsReadOnlyApiApplication,
  runBwsWorkerApplication,
  type BoundedWorkerPassResult,
  type BwsProcessDefinition,
  type BwsReadOnlyQueryService,
  type BwsRuntimeLogEvent,
  type BwsRuntimeSignalRegistrar,
  type BwsServiceRuntimeConfig,
  type BwsServiceRuntimeEnvironment,
} from '../packages/bootstrap/src/index.js';
import {
  type BettingWinUpstreamLock,
} from '../packages/upstream/src/index.js';

const TEST_TIMESTAMP = '2026-07-15T09:15:00.000Z';

test('read-only API application starts on loopback, serves readiness, and shuts down cleanly before restart', async () => {
  const fixture = createRuntimeFixture();
  try {
    const config = resolveBwsServiceRuntimeConfig(fixture.environment, fixture.repositoryRoot);
    const queryService = createQueryServiceStub();
    const firstLogger = createLogCapture();
    const firstSignals = createSignalCapture();
    const metricsSnapshot = Object.freeze({
      api: Object.freeze({
        requestMetrics: Object.freeze({
          api: Object.freeze({ errorCount: 0, requestCount: 0, responseBytes: 0, totalDurationMs: 0 }),
          cockpit: Object.freeze({ errorCount: 0, requestCount: 0, responseBytes: 0, totalDurationMs: 0 }),
          health: Object.freeze({ errorCount: 0, requestCount: 0, responseBytes: 0, totalDurationMs: 0 }),
          metrics: Object.freeze({ errorCount: 0, requestCount: 0, responseBytes: 0, totalDurationMs: 0 }),
          readiness: Object.freeze({ errorCount: 0, requestCount: 0, responseBytes: 0, totalDurationMs: 0 }),
        }),
        runtimeId: 'runtime-001',
        status: 'ready',
      }),
      cockpit: Object.freeze({
        assetFingerprint: 'f'.repeat(64),
        requestMetrics: Object.freeze({ errorCount: 0, requestCount: 0, responseBytes: 0, totalDurationMs: 0 }),
        status: 'ready',
      }),
      database: Object.freeze({
        connectivity: 'available',
        pendingMigrationCount: 0,
        status: 'compatible',
      }),
      evidence: Object.freeze({
        entryCount: 0,
      }),
      generatedAt: TEST_TIMESTAMP,
      runtime: Object.freeze({
        lifecycleState: 'running',
        runtimeId: 'runtime-001',
      }),
      scheduler: Object.freeze({
        lifecycleState: 'running',
      }),
      schema: 'bws.metrics_snapshot.v1',
      sourceFingerprint: 'a'.repeat(64),
      upstream: Object.freeze({
        lifecycleState: 'running',
        mode: 'api',
      }),
      worker: Object.freeze({
        lifecycleState: 'running',
      }),
    });
    let firstMigrations = 0;

    const firstApplication = await startBwsReadOnlyApiApplication({
      applyMigrations() {
        firstMigrations += 1;
        return Object.freeze({ applied: Object.freeze([]), skipped: Object.freeze([]) });
      },
      cockpitProcessDefinition: createCockpitProcessDefinition(config),
      config,
      logger: firstLogger.logger,
      metricsSnapshotFactory: () => metricsSnapshot,
      queryService,
      repositoryRoot: fixture.repositoryRoot,
      signalRegistrar: firstSignals.registrar,
    });

    try {
      const baseUrl = `http://127.0.0.1:${config.api.port}`;
      const healthResponse = await fetch(`${baseUrl}/health`);
      assert.equal(healthResponse.status, 200);
      const healthBody = await healthResponse.json() as {
        readonly health: {
          readonly status: string;
        };
        readonly ok: boolean;
      };
      assert.equal(healthBody.ok, true);
      assert.equal(healthBody.health.status, 'healthy');

      const readinessResponse = await fetch(`${baseUrl}/readiness`);
      assert.equal(readinessResponse.status, 200);
      const readinessBody = await readinessResponse.json() as {
        readonly observability: {
          readonly cockpit: {
            readonly apiBaseUrl?: string;
            readonly assetFingerprint?: string;
            readonly buildDirectory: string;
            readonly status: string;
          };
          readonly configuration: {
            readonly persistence: {
              readonly password?: string;
            };
          };
        };
        readonly readiness: {
          readonly components: {
            readonly cockpit: string;
          };
          readonly status: string;
        };
      };
      assert.equal(readinessBody.readiness.status, 'ready');
      assert.equal(readinessBody.readiness.components.cockpit, 'ready');
      assert.equal(readinessBody.observability.configuration.persistence.password, '[redacted]');
      assert.equal(readinessBody.observability.cockpit.apiBaseUrl, baseUrl);
      assert.equal(readinessBody.observability.cockpit.buildDirectory, 'dist/apps/web');
      assert.match(readinessBody.observability.cockpit.assetFingerprint ?? '', /^[0-9a-f]{64}$/);

      const metricsResponse = await fetch(`${baseUrl}/metrics`);
      assert.equal(metricsResponse.status, 200);
      const metricsBody = await metricsResponse.json() as {
        readonly api: {
          readonly runtimeId: string;
          readonly status: string;
        };
        readonly schema: string;
        readonly upstream: {
          readonly mode?: string;
        };
      };
      assert.equal(metricsBody.schema, 'bws.metrics_snapshot.v1');
      assert.equal(metricsBody.api.runtimeId, 'runtime-001');
      assert.equal(metricsBody.api.status, 'ready');
      assert.equal(metricsBody.upstream.mode, 'api');

      const cockpitResponse = await fetch(`${baseUrl}/`);
      assert.equal(cockpitResponse.status, 200);
      assert.equal(cockpitResponse.headers.get('content-type'), 'text/html; charset=utf-8');
      assert.match(await cockpitResponse.text(), /BWS Operator Cockpit/);

      const routeResponse = await fetch(`${baseUrl}/paper-runs`);
      assert.equal(routeResponse.status, 200);
      assert.match(await routeResponse.text(), /assets\/app\.js/);

      const assetResponse = await fetch(`${baseUrl}/assets/app.js`);
      assert.equal(assetResponse.status, 200);
      assert.equal(assetResponse.headers.get('content-type'), 'text/javascript; charset=utf-8');
      assert.match(await assetResponse.text(), /BWS managed cockpit asset/);

      assert.equal(firstMigrations, 1);
      assert.equal(firstApplication.processIdentity.processName, 'bws-read-only-api');
      assert.deepEqual(
        firstLogger.events.map((event) => event.event),
        ['api_started'],
      );

      firstSignals.require('SIGTERM')();
      await firstApplication.closed;
      await firstApplication.close();
      assert.deepEqual(
        firstLogger.events.map((event) => event.event),
        ['api_started', 'api_shutdown_requested', 'api_shutdown_completed'],
      );
    } finally {
      await firstApplication.close();
    }

    const secondSignals = createSignalCapture();
    const secondApplication = await startBwsReadOnlyApiApplication({
      applyMigrations() {
        return Object.freeze({ applied: Object.freeze([]), skipped: Object.freeze([]) });
      },
      cockpitProcessDefinition: createCockpitProcessDefinition(config),
      config,
      metricsSnapshotFactory: () => metricsSnapshot,
      queryService,
      repositoryRoot: fixture.repositoryRoot,
      signalRegistrar: secondSignals.registrar,
    });
    try {
      assert.equal(secondApplication.server.listening, true);
      assert.notEqual(secondApplication.server.address(), null);
    } finally {
      await secondApplication.close();
      await secondApplication.closed;
    }
  } finally {
    fixture.dispose();
  }
});

test('read-only API application fails closed when the managed cockpit build is missing or targets the wrong API base URL', async () => {
  const fixture = createRuntimeFixture();
  try {
    const config = resolveBwsServiceRuntimeConfig(fixture.environment, fixture.repositoryRoot);
    const queryService = createQueryServiceStub();

    rmSync(join(fixture.repositoryRoot, 'dist'), { force: true, recursive: true });
    await assert.rejects(
      () => startBwsReadOnlyApiApplication({
        applyMigrations() {
          return Object.freeze({ applied: Object.freeze([]), skipped: Object.freeze([]) });
        },
        cockpitProcessDefinition: createCockpitProcessDefinition(config),
        config,
        queryService,
        repositoryRoot: fixture.repositoryRoot,
      }),
      /Managed cockpit build directory is missing/,
    );

    createManagedCockpitBuild(fixture.repositoryRoot, 'http://127.0.0.1:9999');
    await assert.rejects(
      () => startBwsReadOnlyApiApplication({
        applyMigrations() {
          return Object.freeze({ applied: Object.freeze([]), skipped: Object.freeze([]) });
        },
        cockpitProcessDefinition: createCockpitProcessDefinition(config),
        config,
        queryService,
        repositoryRoot: fixture.repositoryRoot,
      }),
      /Managed cockpit build targets http:\/\/127\.0\.0\.1:9999 but the runtime serves http:\/\/127\.0\.0\.1:4312/,
    );
  } finally {
    fixture.dispose();
  }
});

test('worker application executes one bounded pass, records process identity, and preserves signal intent across restart', async () => {
  const fixture = createRuntimeFixture();
  try {
    const config = resolveBwsServiceRuntimeConfig(fixture.environment, fixture.repositoryRoot);
    const events = createLogCapture();
    const signals = createSignalCapture();
    const passResults: BoundedWorkerPassResult[] = [
      createWorkerPassResult(config, 1),
      createWorkerPassResult(config, 0),
    ];
    const handler = Object.freeze({
      async run() {
        throw new Error('worker handler must not be executed in the entrypoint wiring test');
      },
    });
    let handlerCreations = 0;
    const passInvocations: Array<{
      readonly queueName: string;
      readonly workerId: string;
      readonly maxJobs: number;
      readonly handlerKinds: readonly string[];
    }> = [];

    const firstRun = await runBwsWorkerApplication({
      applyMigrations() {
        return Object.freeze({ applied: Object.freeze([]), skipped: Object.freeze([]) });
      },
      config,
      createJobHandler() {
        handlerCreations += 1;
        return handler;
      },
      jobs: createWorkerJobsStub(),
      logger: events.logger,
      repositoryRoot: fixture.repositoryRoot,
      runWorkerPass: async (request) => {
        passInvocations.push(
          Object.freeze({
            handlerKinds: Object.freeze(Object.keys(request.handlers)),
            maxJobs: request.maxJobs,
            queueName: request.queueName,
            workerId: request.workerId,
          }),
        );
        signals.require('SIGINT')();
        return accepted(passResults.shift()!);
      },
      signalRegistrar: signals.registrar,
      strategyLedger: Object.freeze({
        create() {
          throw new Error('strategy ledger must not be reached in the entrypoint wiring test');
        },
      }),
      upstreamLocks: Object.freeze({
        get() {
          throw new Error('upstream locks must not be reached in the entrypoint wiring test');
        },
      }),
    });

    assert.equal(firstRun.processIdentity.processName, 'bws-private-paper-worker');
    assert.equal(firstRun.shutdownSignal, 'SIGINT');
    assert.equal(firstRun.passResult.completedCount, 1);
    assert.equal(handlerCreations, 1);
    assert.deepEqual(passInvocations[0], {
      handlerKinds: ['private_paper_runtime_cycle_v1'],
      maxJobs: 128,
      queueName: config.worker.queueName,
      workerId: config.worker.workerId,
    });

    const secondRun = await runBwsWorkerApplication({
      applyMigrations() {
        return Object.freeze({ applied: Object.freeze([]), skipped: Object.freeze([]) });
      },
      config,
      createJobHandler() {
        return handler;
      },
      jobs: createWorkerJobsStub(),
      repositoryRoot: fixture.repositoryRoot,
      runWorkerPass: async () => accepted(passResults.shift()!),
      signalRegistrar: createSignalCapture().registrar,
      strategyLedger: Object.freeze({
        create() {
          throw new Error('strategy ledger must not be reached in the entrypoint wiring test');
        },
      }),
      upstreamLocks: Object.freeze({
        get() {
          throw new Error('upstream locks must not be reached in the entrypoint wiring test');
        },
      }),
    });

    assert.equal(secondRun.passResult.completedCount, 0);
    assert.deepEqual(
      events.events.map((event) => event.event),
      ['worker_started', 'worker_shutdown_requested', 'worker_completed'],
    );
  } finally {
    fixture.dispose();
  }
});

test('runtime CLIs publish explicit help and runtime applications fail fast on execution or provider misconfiguration', async () => {
  const apiHelp = captureStream();
  const workerHelp = captureStream();
  assert.equal(await runBwsReadOnlyApiCli(['--help'], process.cwd(), apiHelp.stream), 0);
  assert.match(apiHelp.read(), /loopback-only BWS read-only API/);
  assert.match(apiHelp.read(), /SUREBET_PROVIDER_CONNECTIONS=disabled/);

  assert.equal(await runBwsPrivatePaperWorkerCli(['--help'], process.cwd(), workerHelp.stream), 0);
  assert.match(workerHelp.read(), /bounded surebet private-paper worker pass/);
  assert.match(workerHelp.read(), /BWS_WORKER_QUEUE_NAME/);

  await assert.rejects(
    () =>
      startBwsReadOnlyApiApplication({
        cockpitProcessDefinition: invalidTestProcessDefinition(),
        environment: {
          [SUREBET_EXECUTION_ENABLED_ENV]: 'true',
          [SUREBET_PROVIDER_CONNECTIONS_ENV]: 'disabled',
          [SUREBET_RUNTIME_MODE_ENV]: 'paper',
        } as BwsServiceRuntimeEnvironment,
      }),
    /SUREBET_EXECUTION_ENABLED must be exactly false/,
  );

  await assert.rejects(
    () =>
      runBwsWorkerApplication({
        environment: {
          [SUREBET_EXECUTION_ENABLED_ENV]: 'false',
          [SUREBET_PROVIDER_CONNECTIONS_ENV]: 'enabled',
          [SUREBET_RUNTIME_MODE_ENV]: 'paper',
        } as BwsServiceRuntimeEnvironment,
      }),
    /SUREBET_PROVIDER_CONNECTIONS must be exactly disabled/,
  );
});

function createQueryServiceStub(): BwsReadOnlyQueryService {
  return Object.freeze({
    boundary: Object.freeze({
      automaticFallback: 'forbidden',
      bwsReadOnlyQueryServiceBoundary: '@betting-win-surebet/bootstrap:BWS-400',
      upstreamReadOnlyQueryClientBoundary: '@betting-win-surebet/bootstrap:BWS-140',
    }),
    queryPrivatePaperRuntimeCycles() {
      throw new Error('private-paper runtime cycle queries are outside this test scope');
    },
    queryPinnedStrategyExports() {
      throw new Error('pinned strategy export queries are outside this test scope');
    },
    queryStrategyLedger() {
      throw new Error('strategy ledger queries are outside this test scope');
    },
  });
}

function createCockpitProcessDefinition(config: BwsServiceRuntimeConfig): BwsProcessDefinition {
  return Object.freeze({
    automaticFallback: 'forbidden',
    boundary: '@betting-win-surebet/web:BWS_OPERATOR_COCKPIT_R1',
    execution: 'disabled',
    exposure: 'loopback_only',
    networkBindings: Object.freeze([
      Object.freeze({
        exposure: 'loopback_only',
        host: '127.0.0.1' as const,
        port: config.api.port,
        protocol: 'http' as const,
        purpose: 'operator_cockpit' as const,
      }),
    ]),
    notes: Object.freeze([
      `Reads the loopback-safe BWS API through http://127.0.0.1:${config.api.port}.`,
      'Cockpit never enables provider connections, execution, or silent fallback.',
    ]),
    processName: 'bws-operator-cockpit',
    providerConnections: 'disabled',
    requiredEnvironmentKeys: Object.freeze(['BWS_OPERATOR_COCKPIT_DATA_MODE', 'BWS_OPERATOR_COCKPIT_API_BASE_URL']),
    role: 'cockpit',
  });
}

function invalidTestProcessDefinition(): BwsProcessDefinition {
  return Object.freeze({
    automaticFallback: 'forbidden',
    boundary: '@betting-win-surebet/web:BWS_OPERATOR_COCKPIT_R1',
    execution: 'disabled',
    exposure: 'browser_only',
    networkBindings: Object.freeze([]),
    notes: Object.freeze([]),
    processName: 'bws-operator-cockpit',
    providerConnections: 'disabled',
    requiredEnvironmentKeys: Object.freeze([]),
    role: 'cockpit',
  });
}

function createSignalCapture(): {
  readonly registrar: BwsRuntimeSignalRegistrar;
  require(signal: 'SIGINT' | 'SIGTERM'): () => void;
} {
  const handlers = new Map<'SIGINT' | 'SIGTERM', () => void>();
  return Object.freeze({
    registrar: Object.freeze({
      register(signal: 'SIGINT' | 'SIGTERM', handler: () => void) {
        handlers.set(signal, handler);
        return () => {
          handlers.delete(signal);
        };
      },
    }),
    require(signal) {
      const handler = handlers.get(signal);
      assert.notEqual(handler, undefined);
      return handler!;
    },
  });
}

function createLogCapture(): {
  readonly events: BwsRuntimeLogEvent[];
  readonly logger: {
    write(event: BwsRuntimeLogEvent): void;
  };
} {
  const events: BwsRuntimeLogEvent[] = [];
  return Object.freeze({
    events,
    logger: Object.freeze({
      write(event: BwsRuntimeLogEvent) {
        events.push(event);
      },
    }),
  });
}

function createWorkerJobsStub() {
  return Object.freeze({
    claimNext() {
      throw new Error('worker jobs repository must not be reached in the entrypoint wiring test');
    },
    complete() {
      throw new Error('worker jobs repository must not be reached in the entrypoint wiring test');
    },
    deadLetterOwnedJob() {
      throw new Error('worker jobs repository must not be reached in the entrypoint wiring test');
    },
    fail() {
      throw new Error('worker jobs repository must not be reached in the entrypoint wiring test');
    },
    heartbeatLease() {
      throw new Error('worker jobs repository must not be reached in the entrypoint wiring test');
    },
    recordCheckpoint() {
      throw new Error('worker jobs repository must not be reached in the entrypoint wiring test');
    },
    reapExpiredLeases() {
      throw new Error('worker jobs repository must not be reached in the entrypoint wiring test');
    },
  });
}

function createWorkerPassResult(config: BwsServiceRuntimeConfig, completedCount: number): BoundedWorkerPassResult {
  return Object.freeze({
    claimedCount: completedCount,
    completedCount,
    deadLetterCount: 0,
    drained: false,
    expiredLeaseDeadLetterCount: 0,
    finishedAt: '2026-07-15T09:15:00.500Z',
    leaseRenewalCount: 0,
    processedJobs: Object.freeze([]),
    queueName: config.worker.queueName,
    retryCount: 0,
    startedAt: TEST_TIMESTAMP,
    workerId: config.worker.workerId,
  });
}

function captureStream(): {
  readonly stream: NodeJS.WriteStream;
  read(): string;
} {
  let text = '';
  return Object.freeze({
    read() {
      return text;
    },
    stream: {
      write(chunk: string | Uint8Array) {
        text += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf-8');
        return true;
      },
    } as NodeJS.WriteStream,
  });
}

function createRuntimeFixture(): {
  readonly dispose: () => void;
  readonly environment: BwsServiceRuntimeEnvironment;
  readonly repositoryRoot: string;
} {
  const root = mkdtempSync(join(tmpdir(), 'bws-runtime-applications-'));
  const repositoryRoot = join(root, 'betting-win-surebet');
  const upstreamRoot = join(root, 'betting-win');
  mkdirSync(join(repositoryRoot, 'config'), { recursive: true });
  mkdirSync(upstreamRoot, { recursive: true });
  writeFileSync(
    join(repositoryRoot, 'config', 'betting-win.upstream.lock.json'),
    `${JSON.stringify(sampleUpstreamLock(upstreamRoot), null, 2)}\n`,
    'utf-8',
  );
  createManagedCockpitBuild(repositoryRoot, 'http://127.0.0.1:4312');
  return {
    dispose: () => rmSync(root, { force: true, recursive: true }),
    environment: Object.freeze({
      BETTING_WIN_REPO_PATH: upstreamRoot,
      [BWS_API_PORT_ENV]: '4312',
      [BWS_UPSTREAM_LOCK_PATH_ENV]: 'config/betting-win.upstream.lock.json',
      [BWS_WORKER_ID_ENV]: 'worker-bws-520',
      [BWS_WORKER_LEASE_DURATION_MS_ENV]: '30000',
      [BWS_WORKER_QUEUE_NAME_ENV]: 'private-paper',
      [SUREBET_EXECUTION_ENABLED_ENV]: 'false',
      [SUREBET_PROVIDER_CONNECTIONS_ENV]: 'disabled',
      [SUREBET_RUNTIME_MODE_ENV]: 'paper',
      SUREBET_PG_DATABASE: 'surebet_local',
      SUREBET_PG_HOST: '127.0.0.1',
      SUREBET_PG_PASSWORD: 'super-secret-password',
      SUREBET_PG_PORT: '5432',
      SUREBET_PG_USER: 'surebet_user',
    }),
    repositoryRoot,
  };
}

function createManagedCockpitBuild(repositoryRoot: string, apiBaseUrl: string): void {
  mkdirSync(join(repositoryRoot, 'dist', 'apps', 'web', 'assets'), { recursive: true });
  writeFileSync(
    join(repositoryRoot, 'dist', 'apps', 'web', 'index.html'),
    [
      '<!doctype html>',
      '<html lang="en">',
      '  <head><meta charset="UTF-8" /><title>BWS Operator Cockpit</title></head>',
      '  <body>',
      '    <div id="root">BWS Operator Cockpit</div>',
      '    <script type="module" src="/assets/app.js"></script>',
      '  </body>',
      '</html>',
    ].join('\n'),
    'utf-8',
  );
  writeFileSync(
    join(repositoryRoot, 'dist', 'apps', 'web', 'assets', 'app.js'),
    `console.log(${JSON.stringify(`BWS managed cockpit asset for ${apiBaseUrl}`)});\n`,
    'utf-8',
  );
  writeFileSync(
    join(repositoryRoot, 'dist', 'apps', 'web', 'bws-cockpit-build.json'),
    `${JSON.stringify({
      apiBaseUrl,
      dataMode: 'api',
      schema: 'bws.operator_cockpit_build.v1',
    }, null, 2)}\n`,
    'utf-8',
  );
}

function sampleUpstreamLock(repositoryPath: string): BettingWinUpstreamLock {
  return Object.freeze({
    capabilities: Object.freeze([
      'exportHistoricalBundle',
      'getHistoricalQuotes',
      'getProviderGenerations',
      'inspectSourceLineage',
    ]),
    commitSha: '1'.repeat(40),
    contractAlias: 'betting-win-strategy-export.v1',
    contractSchema: 'betting-win.strategy-export.v1',
    gitTreeSha: '2'.repeat(40),
    packageVersion: '0.48.0',
    packageVersions: Object.freeze({
      '@betting-win/provider-collection': '0.48.0',
    }),
    repository: 'betting-win',
    repositoryPath,
    schema: 'betting-win-surebet-upstream-lock-v1',
    sourceFingerprintAlgorithm: 'sha256_git_ls_tree_r_full_tree_head_v1',
    sourceView: 'committed_git_head',
    surebetProfile: 'surebet_standard_binary_v0',
    trackedTreeListingSha256: '3'.repeat(64),
    verifiedAt: TEST_TIMESTAMP,
  });
}
