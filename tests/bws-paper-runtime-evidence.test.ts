import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  createBwsPaperRuntimeEvidence,
} from '../packages/bootstrap/src/operations/paper-runtime-evidence.js';
import type { BwsDiagnosticsBundleResult } from '../packages/bootstrap/src/operations/observability.js';
import type {
  BwsOperatorLifecycleCommandResult,
  BwsOperatorLifecycleManagedProcess,
} from '../packages/bootstrap/src/operations/operator-lifecycle.js';
import type { CreateBwsPaperRuntimeHandoffResult } from '../packages/bootstrap/src/operations/paper-runtime-handoff.js';

function createManagedProcess(): BwsOperatorLifecycleManagedProcess {
  return Object.freeze({
    command: Object.freeze(['node', 'dist/packages/bootstrap/src/cli/bws-read-only-api.js']),
    commandCwd: '/tmp/repo',
    entryPointPath: '/tmp/repo/dist/packages/bootstrap/src/cli/bws-read-only-api.js',
    kind: 'api_runtime',
    lifecycleToken: 'runtime-1',
    pid: 1234,
    processName: 'bws-read-only-api',
    procStartTicks: '123',
    roles: Object.freeze(['cockpit', 'api'] as const),
    startedAt: '2026-07-16T00:00:00.000Z',
  });
}

function createLifecycleStatus(
  outcome: BwsOperatorLifecycleCommandResult['outcome'],
): BwsOperatorLifecycleCommandResult {
  return Object.freeze({
    command: 'status',
    configuration: Object.freeze({
      api: Object.freeze({
        bindHost: '127.0.0.1',
        port: 4210,
      }),
      persistence: Object.freeze({
        database: 'surebet_test',
        host: '127.0.0.1',
        password: '[redacted]',
        port: 5432,
        user: 'surebet',
      }),
      policy: Object.freeze({
        executionEnabled: false,
        providerConnections: 'disabled',
        runtimeMode: 'paper',
      }),
      processDefinitions: Object.freeze([]),
      upstream: Object.freeze({
        commitSha: 'commit',
        contractAlias: 'betting-win-strategy-export.v1',
        contractSchema: 'betting-win.strategy-export.v1',
        gitTreeSha: 'tree',
        lockPath: 'config/betting-win.upstream.lock.json',
        repository: 'betting-win',
        repositoryPath: '/tmp/betting-win',
        sourceView: 'git_objects',
        surebetProfile: 'surebet_standard_binary_v0',
        trackedTreeListingSha256: 'tracked',
        verifiedAt: '2026-07-16T00:00:00.000Z',
      }),
      worker: Object.freeze({
        leaseDurationMs: 1000,
        queueName: 'surebet.private-paper',
        workerId: 'worker-1',
      }),
    }),
    evidenceFile: 'runtime/lifecycle/status.json',
    generatedAt: '2026-07-16T00:00:00.000Z',
    health: Object.freeze({
      body: Object.freeze({
        health: Object.freeze({
          status: outcome === 'running' ? 'healthy' : 'blocked',
        }),
      }),
      ok: outcome === 'running',
      statusCode: outcome === 'running' ? 200 : 503,
      url: 'http://127.0.0.1:4210/health',
    }),
    outcome,
    process: createManagedProcess(),
    processes: Object.freeze([]),
    readiness: Object.freeze({
      body: Object.freeze({
        readiness: Object.freeze({
          status: outcome === 'running' ? 'ready' : 'blocked',
        }),
      }),
      ok: outcome === 'running',
      statusCode: outcome === 'running' ? 200 : 503,
      url: 'http://127.0.0.1:4210/readiness',
    }),
    runtimeId: 'runtime-1',
    service: 'full_stack',
    sourceFingerprints: Object.freeze({
      packageVersion: '0.1.0-bws-full-platform',
      sourceManifestGeneratedAt: '2026-07-16T00:00:00.000Z',
      sourceManifestOverlay: 'none',
      sourceManifestSha256: 'source',
      upstreamCommitSha: 'commit',
      upstreamGitTreeSha: 'tree',
      upstreamTrackedTreeListingSha256: 'tracked',
    }),
    stack: Object.freeze({
      blockers: Object.freeze([]),
      components: Object.freeze({
        api: outcome === 'running' ? 'ready' : 'degraded',
        cockpit: outcome === 'running' ? 'ready' : 'degraded',
        private_paper_scheduler: outcome === 'running' ? 'ready' : 'degraded',
        private_paper_worker: outcome === 'running' ? 'ready' : 'degraded',
        upstream_convergence: outcome === 'running' ? 'ready' : 'degraded',
      }),
      healthStatus: outcome === 'running' ? 'healthy' : 'degraded',
      readinessStatus: outcome === 'running' ? 'ready' : 'degraded',
      roles: Object.freeze([]),
      shutdownOrder: Object.freeze(['private_paper_scheduler', 'private_paper_worker', 'upstream_convergence', 'cockpit', 'api'] as const),
    }),
    stateFile: 'runtime/bws-operator-lifecycle/state.json',
  });
}

function writeDiagnosticsBundle(
  repositoryRoot: string,
  bundleName: string,
  sample: Readonly<{
    readonly apiStatus: 'blocked' | 'ready';
    readonly cockpitStatus: 'blocked' | 'ready';
    readonly databaseStatus: 'compatible' | 'incompatible';
    readonly healthStatus: 'blocked' | 'healthy';
    readonly readinessStatus: 'blocked' | 'ready';
    readonly runtimeLifecycleState: string;
    readonly schedulerLifecycleState: string;
    readonly upstreamLifecycleState: string;
    readonly workerLifecycleState: string;
  }>,
): { readonly bundleDirectory: string; readonly bundleManifestFile: string } {
  const directory = join(repositoryRoot, 'runtime', 'bws-observability', 'diagnostics', bundleName);
  mkdirSync(directory, { recursive: true });
  const manifestFile = join(directory, 'diagnostics.json');
  writeFileSync(
    manifestFile,
    `${JSON.stringify({
      generatedAt: '2026-07-16T00:00:00.000Z',
      health: {
        status: sample.healthStatus,
      },
      metrics: {
        api: {
          status: sample.apiStatus,
        },
        cockpit: {
          status: sample.cockpitStatus,
        },
        database: {
          status: sample.databaseStatus,
        },
        runtime: {
          lifecycleState: sample.runtimeLifecycleState,
        },
        scheduler: {
          lifecycleState: sample.schedulerLifecycleState,
        },
        upstream: {
          lifecycleState: sample.upstreamLifecycleState,
        },
        worker: {
          lifecycleState: sample.workerLifecycleState,
        },
      },
      readiness: {
        status: sample.readinessStatus,
      },
      schema: 'bws.diagnostics_bundle.v1',
    }, null, 2)}\n`,
    'utf-8',
  );
  return {
    bundleDirectory: directory.replace(`${repositoryRoot}/`, ''),
    bundleManifestFile: manifestFile.replace(`${repositoryRoot}/`, ''),
  };
}

function createDiagnosticsBundleResult(
  repositoryRoot: string,
  bundleName: string,
  sample: Readonly<{
    readonly apiStatus: 'blocked' | 'ready';
    readonly cockpitStatus: 'blocked' | 'ready';
    readonly databaseStatus: 'compatible' | 'incompatible';
    readonly healthStatus: 'blocked' | 'healthy';
    readonly readinessStatus: 'blocked' | 'ready';
    readonly runtimeLifecycleState: string;
    readonly schedulerLifecycleState: string;
    readonly upstreamLifecycleState: string;
    readonly workerLifecycleState: string;
  }>,
): BwsDiagnosticsBundleResult {
  const bundle = writeDiagnosticsBundle(repositoryRoot, bundleName, sample);
  return Object.freeze({
    ...bundle,
    generatedAt: '2026-07-16T00:00:00.000Z',
    manifestSha256: 'manifest-sha',
    schema: 'bws.diagnostics_bundle.v1' as const,
  });
}

function writeEvidenceIndex(repositoryRoot: string): void {
  const evidenceDirectory = join(repositoryRoot, 'runtime', 'bws-observability', 'evidence-index');
  mkdirSync(evidenceDirectory, { recursive: true });
  writeFileSync(
    join(evidenceDirectory, 'index.jsonl'),
    `${JSON.stringify({
      artifactSchema: 'bws.operator_lifecycle_evidence.v2',
      createdAt: '2026-07-16T00:00:00.000Z',
      path: 'runtime/lifecycle/status.json',
      retentionClass: 'lifecycle',
      runtimeId: 'runtime-1',
      schema: 'bws.evidence_index_entry.v1',
      sha256: 'sha',
      sourceFingerprint: 'source',
    })}\n`,
    'utf-8',
  );
  writeFileSync(
    join(evidenceDirectory, 'latest.json'),
    `${JSON.stringify({
      entryCount: 1,
      lastCreatedAt: '2026-07-16T00:00:00.000Z',
      lastRuntimeId: 'runtime-1',
      recentEntries: [],
      schema: 'bws.evidence_index_summary.v1',
    }, null, 2)}\n`,
    'utf-8',
  );
}

function createTestRepositoryRoot(t: TestContext): string {
  const root = mkdtempSync(join(tmpdir(), 'bws-paper-runtime-evidence-'));
  t.after(() => {
    rmSync(root, {
      force: true,
      maxRetries: 3,
      recursive: true,
      retryDelay: 100,
    });
  });
  mkdirSync(join(root, 'runtime'), { recursive: true });
  writeEvidenceIndex(root);
  return root;
}

function configureUpstreamApiPreflightEnvironment(
  t: TestContext,
  values: Readonly<{
    readonly apiBaseUrl: string;
    readonly apiPort?: string;
    readonly contractVersion?: string;
    readonly lockPath?: string;
    readonly timeoutMs?: string;
  }>,
): void {
  const previous = Object.freeze({
    BWS_API_PORT: process.env.BWS_API_PORT,
    BWS_UPSTREAM_API_BASE_URL: process.env.BWS_UPSTREAM_API_BASE_URL,
    BWS_UPSTREAM_API_CONTRACT_VERSION: process.env.BWS_UPSTREAM_API_CONTRACT_VERSION,
    BWS_UPSTREAM_API_TIMEOUT_MS: process.env.BWS_UPSTREAM_API_TIMEOUT_MS,
    BWS_UPSTREAM_LOCK_PATH: process.env.BWS_UPSTREAM_LOCK_PATH,
    BWS_UPSTREAM_MODE: process.env.BWS_UPSTREAM_MODE,
  });
  t.after(() => {
    restoreEnvironmentValue('BWS_API_PORT', previous.BWS_API_PORT);
    restoreEnvironmentValue('BWS_UPSTREAM_API_BASE_URL', previous.BWS_UPSTREAM_API_BASE_URL);
    restoreEnvironmentValue('BWS_UPSTREAM_API_CONTRACT_VERSION', previous.BWS_UPSTREAM_API_CONTRACT_VERSION);
    restoreEnvironmentValue('BWS_UPSTREAM_API_TIMEOUT_MS', previous.BWS_UPSTREAM_API_TIMEOUT_MS);
    restoreEnvironmentValue('BWS_UPSTREAM_LOCK_PATH', previous.BWS_UPSTREAM_LOCK_PATH);
    restoreEnvironmentValue('BWS_UPSTREAM_MODE', previous.BWS_UPSTREAM_MODE);
  });
  process.env.BWS_API_PORT = values.apiPort ?? '4312';
  process.env.BWS_UPSTREAM_API_BASE_URL = values.apiBaseUrl;
  process.env.BWS_UPSTREAM_API_CONTRACT_VERSION = values.contractVersion ?? '1.0.0';
  process.env.BWS_UPSTREAM_API_TIMEOUT_MS = values.timeoutMs ?? '1000';
  process.env.BWS_UPSTREAM_LOCK_PATH = values.lockPath ?? 'config/betting-win.upstream.lock.json';
  process.env.BWS_UPSTREAM_MODE = 'api';
}

function restoreEnvironmentValue(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}

async function createLoopbackUpstreamApiFixture(
  t: TestContext,
  handler: (path: string, response: import('node:http').ServerResponse) => void,
): Promise<string> {
  const server = createServer((request, response) => {
    response.setHeader('content-type', 'application/json');
    handler(request.url ?? '/', response);
  });
  server.listen(0, '127.0.0.1');
  await new Promise<void>((resolvePromise) => server.once('listening', resolvePromise));
  t.after(async () => {
    await new Promise<void>((resolvePromise, rejectPromise) => {
      server.close((error) => {
        if (error === undefined) {
          resolvePromise();
          return;
        }
        rejectPromise(error);
      });
    });
  });
  const port = (server.address() as AddressInfo).port;
  return `http://127.0.0.1:${String(port)}`;
}

function createRuntimeHandoffResult(repositoryRoot: string): CreateBwsPaperRuntimeHandoffResult {
  return Object.freeze({
    archive: Object.freeze({
      archiveFile: 'artifacts/bws-paper-runtime-handoff/source.tar.gz',
      sha256: 'archive-sha',
      sizeBytes: 12,
    }),
    generatedAt: '2026-07-16T00:00:01.000Z',
    handoff: Object.freeze({
      automation: Object.freeze({
        integrationStatus: 'pending_protected_controller_review',
        machineReadableFormat: 'json',
        nextGate: 'BWS-600',
      }),
      closedBoundary: Object.freeze({
        automaticFallback: 'forbidden',
        execution: 'disabled',
        providerConnections: 'disabled',
        runtimeMode: 'paper',
      }),
      currentTask: 'BWS-580',
      generatedAt: '2026-07-16T00:00:01.000Z',
      packaging: Object.freeze({
        sourceHandoffArchive: Object.freeze({
          archiveFile: 'artifacts/bws-paper-runtime-handoff/source.tar.gz',
          sha256: 'archive-sha',
          sizeBytes: 12,
        }),
      }),
      process: createManagedProcess(),
      program: 'BWS_FULL_PLATFORM_IMPLEMENTATION_V1',
      repository: Object.freeze({
        name: 'betting-win-surebet',
        root: repositoryRoot,
      }),
      runtime: Object.freeze({
        command: 'status',
        configuration: createLifecycleStatus('running').configuration,
        evidenceFile: 'runtime/lifecycle/status.json',
        health: createLifecycleStatus('running').health,
        outcome: 'running',
        readiness: createLifecycleStatus('running').readiness,
        service: 'full_stack',
        stateFile: 'runtime/bws-operator-lifecycle/state.json',
      }),
      safeLocalTerminalGate: 'BWS-580',
      schema: 'bws.paper_runtime_handoff.v1',
      sourceFingerprints: createLifecycleStatus('running').sourceFingerprints,
    }),
    handoffFile: 'runtime/bws-paper-runtime-handoff/handoff.json',
    latestHandoffFile: 'runtime/bws-paper-runtime-handoff/latest.json',
  });
}

test('paper runtime evidence starts an owned stack, records ready observations, and stops only the stack it started', async (t) => {
  const repositoryRoot = createTestRepositoryRoot(t);
  const upstreamApiBaseUrl = await createLoopbackUpstreamApiFixture(t, (path, response) => {
    if (path === '/contract') {
      response.end(JSON.stringify({ contractVersion: '1.0.0' }));
      return;
    }
    response.statusCode = 404;
    response.end(JSON.stringify({ error: 'not_found' }));
  });
  configureUpstreamApiPreflightEnvironment(t, { apiBaseUrl: upstreamApiBaseUrl });
  const observedCalls: string[] = [];
  let statusCallCount = 0;
  const result = await createBwsPaperRuntimeEvidence({
    collectDiagnostics: async ({ repositoryRoot: root }) => {
      observedCalls.push('diagnostics');
      return createDiagnosticsBundleResult(root, 'bundle-ready', {
        apiStatus: 'ready',
        cockpitStatus: 'ready',
        databaseStatus: 'compatible',
        healthStatus: 'healthy',
        readinessStatus: 'ready',
        runtimeLifecycleState: 'running',
        schedulerLifecycleState: 'running',
        upstreamLifecycleState: 'running',
        workerLifecycleState: 'running',
      });
    },
    createRuntimeHandoff: async () => createRuntimeHandoffResult(repositoryRoot),
    getLifecycleStatus: async () => {
      statusCallCount += 1;
      if (statusCallCount === 1) {
        observedCalls.push('status:not_running');
        return createLifecycleStatus('not_running');
      }
      observedCalls.push('status:running');
      return createLifecycleStatus('running');
    },
    intervalMs: 1000,
    maxDurationMs: 2000,
    now: (() => {
      const values = [
        '2026-07-16T00:00:00.000Z',
        '2026-07-16T00:00:01.000Z',
        '2026-07-16T00:00:02.000Z',
      ];
      let index = 0;
      return () => values[Math.min(index++, values.length - 1)]!;
    })(),
    repositoryRoot,
    sleep: async () => undefined,
    startLifecycle: async () => {
      observedCalls.push('start');
      return {
        ...createLifecycleStatus('running'),
        command: 'start',
        outcome: 'started',
      };
    },
    stopLifecycle: async () => {
      observedCalls.push('stop');
      return {
        ...createLifecycleStatus('running'),
        command: 'stop',
        outcome: 'stopped',
      };
    },
  });

  assert.equal(result.finalStatus, 'PAPER_EVALUATION_READY_RUNTIME_EVIDENCE_LOCAL_ONLY');
  assert.equal(result.stackOwnership, 'started');
  assert.equal(result.stackStopDisposition, 'stopped_started_stack');
  assert.equal(result.upstreamApiPreflight?.outcome, 'passed');
  assert.equal(result.upstreamApiPreflight?.probePath, '/contract');
  assert.equal(result.observation.sampleCount, 1);
  assert.equal(result.observation.samples[0]?.runtimeLifecycleState, 'running');
  assert.equal(result.latestRuntimeHandoffFile, 'runtime/bws-paper-runtime-handoff/handoff.json');
  assert.deepEqual(observedCalls, ['status:not_running', 'start', 'status:running', 'diagnostics', 'stop']);
});

test('paper runtime evidence preserves an attached stack when exact identity and configuration already match', async (t) => {
  const repositoryRoot = createTestRepositoryRoot(t);
  const upstreamApiBaseUrl = await createLoopbackUpstreamApiFixture(t, (path, response) => {
    if (path === '/contract') {
      response.end(JSON.stringify({ version: '1.0.0' }));
      return;
    }
    response.statusCode = 404;
    response.end(JSON.stringify({ error: 'not_found' }));
  });
  configureUpstreamApiPreflightEnvironment(t, { apiBaseUrl: upstreamApiBaseUrl });
  let statusCalls = 0;
  const result = await createBwsPaperRuntimeEvidence({
    collectDiagnostics: async ({ repositoryRoot: root }) => createDiagnosticsBundleResult(root, 'bundle-attached', {
      apiStatus: 'ready',
      cockpitStatus: 'ready',
      databaseStatus: 'compatible',
      healthStatus: 'healthy',
      readinessStatus: 'ready',
      runtimeLifecycleState: 'running',
      schedulerLifecycleState: 'running',
      upstreamLifecycleState: 'running',
      workerLifecycleState: 'running',
    }),
    createRuntimeHandoff: async () => createRuntimeHandoffResult(repositoryRoot),
    getLifecycleStatus: async () => {
      statusCalls += 1;
      return createLifecycleStatus('running');
    },
    intervalMs: 1000,
    maxDurationMs: 2000,
    repositoryRoot,
    sleep: async () => undefined,
    startLifecycle: async () => {
      throw new Error('start should not be called');
    },
    stopLifecycle: async () => {
      throw new Error('stop should not be called');
    },
  });

  assert.equal(result.finalStatus, 'PAPER_EVALUATION_READY_RUNTIME_EVIDENCE_LOCAL_ONLY');
  assert.equal(result.stackOwnership, 'attached');
  assert.equal(result.stackStopDisposition, 'attached_stack_preserved');
  assert.equal(result.upstreamApiPreflight?.outcome, 'passed');
  assert.equal(statusCalls, 2);
});

test('paper runtime evidence fails fast when the upstream API is unavailable before lifecycle ownership is touched', async (t) => {
  const repositoryRoot = createTestRepositoryRoot(t);
  const unavailablePort = await (async () => {
    const server = createServer((_request, response) => {
      response.end('unused');
    });
    server.listen(0, '127.0.0.1');
    await new Promise<void>((resolvePromise) => server.once('listening', resolvePromise));
    const port = (server.address() as AddressInfo).port;
    await new Promise<void>((resolvePromise, rejectPromise) => {
      server.close((error) => {
        if (error === undefined) {
          resolvePromise();
          return;
        }
        rejectPromise(error);
      });
    });
    return port;
  })();
  configureUpstreamApiPreflightEnvironment(t, {
    apiBaseUrl: `http://127.0.0.1:${String(unavailablePort)}`,
  });
  let lifecycleTouched = false;

  const result = await createBwsPaperRuntimeEvidence({
    getLifecycleStatus: async () => {
      lifecycleTouched = true;
      return createLifecycleStatus('running');
    },
    intervalMs: 1000,
    maxDurationMs: 2000,
    repositoryRoot,
    startLifecycle: async () => {
      lifecycleTouched = true;
      throw new Error('start should not be called');
    },
  });

  assert.equal(result.finalStatus, 'PAPER_EVALUATION_BLOCKED_RUNTIME_EVIDENCE_COLLECTION_FAILED');
  assert.equal(result.stopReason, 'betting_win_api_unavailable');
  assert.equal(result.collectionFailure?.stage, 'upstream_api_preflight');
  assert.equal(result.upstreamApiPreflight?.blockerCode, 'PAPER_EVALUATION_BLOCKED_BETTING_WIN_API_UNAVAILABLE');
  assert.equal(result.upstreamApiPreflight?.failureClass, 'network_error');
  assert.equal(result.upstreamApiPreflight?.outcome, 'blocked');
  assert.equal(result.observation.sampleCount, 0);
  assert.equal(lifecycleTouched, false);
});

test('paper runtime evidence rejects malformed, credential-bearing, non-loopback, and local-BWS upstream API URLs before lifecycle attach or start', async (t) => {
  const repositoryRoot = createTestRepositoryRoot(t);
  const cases = [
    {
      apiBaseUrl: 'http://user:password@127.0.0.1:4301',
      expectedFailureClass: 'invalid_url',
      expectedMessage: /must not include embedded credentials/i,
    },
    {
      apiBaseUrl: 'https://upstream.invalid',
      expectedFailureClass: 'invalid_url',
      expectedMessage: /explicit loopback host/i,
    },
    {
      apiBaseUrl: 'not-a-url',
      expectedFailureClass: 'invalid_url',
      expectedMessage: /must be an absolute URL/i,
    },
    {
      apiBaseUrl: 'http://127.0.0.1:4312',
      expectedFailureClass: 'bws_local_api_conflict',
      expectedMessage: /must not target the local BWS API/i,
    },
    {
      apiBaseUrl: 'http://localhost:4312',
      expectedFailureClass: 'bws_local_api_conflict',
      expectedMessage: /must not target the local BWS API/i,
    },
  ] as const;

  for (const testCase of cases) {
    configureUpstreamApiPreflightEnvironment(t, { apiBaseUrl: testCase.apiBaseUrl, apiPort: '4312' });
    let lifecycleTouched = false;
    const result = await createBwsPaperRuntimeEvidence({
      getLifecycleStatus: async () => {
        lifecycleTouched = true;
        return createLifecycleStatus('running');
      },
      intervalMs: 1000,
      maxDurationMs: 2000,
      repositoryRoot,
    });

    assert.equal(result.finalStatus, 'PAPER_EVALUATION_BLOCKED_RUNTIME_EVIDENCE_COLLECTION_FAILED');
    assert.equal(result.collectionFailure?.stage, 'upstream_api_preflight');
    assert.equal(result.stopReason, 'betting_win_api_unavailable');
    assert.equal(result.upstreamApiPreflight?.failureClass, testCase.expectedFailureClass);
    assert.match(result.upstreamApiPreflight?.errorMessage ?? '', testCase.expectedMessage);
    assert.equal(lifecycleTouched, false);
  }
});

test('paper runtime evidence preserves the stack when ownership is ambiguous', async (t) => {
  const repositoryRoot = createTestRepositoryRoot(t);
  const upstreamApiBaseUrl = await createLoopbackUpstreamApiFixture(t, (path, response) => {
    if (path === '/contract') {
      response.end(JSON.stringify({ contractVersion: '1.0.0' }));
      return;
    }
    response.statusCode = 404;
    response.end(JSON.stringify({ error: 'not_found' }));
  });
  configureUpstreamApiPreflightEnvironment(t, { apiBaseUrl: upstreamApiBaseUrl });
  const result = await createBwsPaperRuntimeEvidence({
    getLifecycleStatus: async () => {
      throw new Error(
        'Lifecycle command configuration fingerprint does not match the recorded managed process configuration.',
      );
    },
    intervalMs: 1000,
    maxDurationMs: 2000,
    repositoryRoot,
  });

  assert.equal(result.finalStatus, 'PAPER_EVALUATION_BLOCKED_RUNTIME_OWNERSHIP_AMBIGUOUS');
  assert.equal(result.stackOwnership, 'ambiguous_preserved');
  assert.equal(result.observation.sampleCount, 0);
});

test('paper runtime evidence returns a bounded blocker when the observation window never reaches readiness', async (t) => {
  const repositoryRoot = createTestRepositoryRoot(t);
  const upstreamApiBaseUrl = await createLoopbackUpstreamApiFixture(t, (path, response) => {
    if (path === '/contract') {
      response.end(JSON.stringify({ contractVersion: '1.0.0' }));
      return;
    }
    response.statusCode = 404;
    response.end(JSON.stringify({ error: 'not_found' }));
  });
  configureUpstreamApiPreflightEnvironment(t, { apiBaseUrl: upstreamApiBaseUrl });
  const result = await createBwsPaperRuntimeEvidence({
    collectDiagnostics: async ({ repositoryRoot: root }) => createDiagnosticsBundleResult(root, 'bundle-blocked', {
      apiStatus: 'blocked',
      cockpitStatus: 'blocked',
      databaseStatus: 'compatible',
      healthStatus: 'blocked',
      readinessStatus: 'blocked',
      runtimeLifecycleState: 'running',
      schedulerLifecycleState: 'running',
      upstreamLifecycleState: 'running',
      workerLifecycleState: 'running',
    }),
    getLifecycleStatus: async () => createLifecycleStatus('running'),
    intervalMs: 1000,
    maxDurationMs: 1000,
    now: (() => {
      const values = [
        '2026-07-16T00:00:00.000Z',
        '2026-07-16T00:00:01.000Z',
      ];
      let index = 0;
      return () => values[Math.min(index++, values.length - 1)]!;
    })(),
    repositoryRoot,
    sleep: async () => undefined,
  });

  assert.equal(result.finalStatus, 'PAPER_EVALUATION_BLOCKED_RUNTIME_OBSERVATION_NOT_READY');
  assert.equal(result.observation.sampleCount, 1);
  assert.equal(result.observation.samples[0]?.apiStatus, 'blocked');
});


test('paper runtime evidence retains a bounded redacted collection-failure stage', async (t) => {
  const repositoryRoot = createTestRepositoryRoot(t);
  const upstreamApiBaseUrl = await createLoopbackUpstreamApiFixture(t, (path, response) => {
    if (path === '/contract') {
      response.end(JSON.stringify({ contractVersion: '1.0.0' }));
      return;
    }
    response.statusCode = 404;
    response.end(JSON.stringify({ error: 'not_found' }));
  });
  configureUpstreamApiPreflightEnvironment(t, { apiBaseUrl: upstreamApiBaseUrl });
  const databaseUri = `${['post', 'gresql'].join('')}://user:database-secret@127.0.0.1:5432/db`;
  const result = await createBwsPaperRuntimeEvidence({
    collectDiagnostics: async () => {
      throw new Error(
        `diagnostics password=prefix:super-secret ${databaseUri} Bearer bearer-secret failed\nnext-line`,
      );
    },
    getLifecycleStatus: async () => createLifecycleStatus('running'),
    intervalMs: 1000,
    maxDurationMs: 2000,
    repositoryRoot,
  });

  assert.equal(result.finalStatus, 'PAPER_EVALUATION_BLOCKED_RUNTIME_EVIDENCE_COLLECTION_FAILED');
  assert.equal(result.collectionFailure?.stage, 'diagnostics_collection');
  assert.equal(result.collectionFailure?.errorName, 'Error');
  assert.match(
    result.collectionFailure?.message ?? '',
    /password=\[redacted\].+\[redacted\]@127\.0\.0\.1:5432\/db Bearer \[redacted\] failed next-line/,
  );
  assert.doesNotMatch(result.collectionFailure?.message ?? '', /prefix|super-secret|database-secret|bearer-secret/);
});
