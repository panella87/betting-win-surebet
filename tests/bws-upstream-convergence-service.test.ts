import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  BWS_UPSTREAM_API_BASE_URL_ENV,
  BWS_UPSTREAM_API_CHECKPOINT_ID_ENV,
  BWS_UPSTREAM_API_CONTRACT_VERSION_ENV,
  BWS_UPSTREAM_API_MAX_PAGES_PER_RESOURCE_ENV,
  BWS_UPSTREAM_API_PAGE_SIZE_ENV,
  BWS_UPSTREAM_API_RETRY_BACKOFF_MS_ENV,
  BWS_UPSTREAM_API_RETRY_LIMIT_ENV,
  BWS_UPSTREAM_API_TIMEOUT_MS_ENV,
  BWS_UPSTREAM_CONVERGENCE_INTERVAL_MS_ENV,
  BWS_UPSTREAM_CONVERGENCE_MAX_BACKOFF_MS_ENV,
  BWS_UPSTREAM_CONVERGENCE_PASS_TIMEOUT_MS_ENV,
  BWS_UPSTREAM_CONVERGENCE_RETRY_BACKOFF_MS_ENV,
  BWS_UPSTREAM_EXPORT_SELECTION_PATH_ENV,
  BWS_UPSTREAM_MODE_ENV,
  accepted,
  getBwsUpstreamConvergenceServiceStatus,
  resolveBwsUpstreamConvergenceServiceConfig,
  runBwsUpstreamConvergenceService,
  runBwsUpstreamConvergenceServiceCli,
  type BwsUpstreamApiConvergenceConfig,
  type BwsUpstreamConvergenceManagedProcess,
  type BwsUpstreamConvergenceProcessRuntime,
  type BwsUpstreamConvergenceServiceConfig,
  type BwsUpstreamConvergenceServiceCounters,
  type BwsUpstreamConvergenceServiceEnvironment,
  type BwsUpstreamExportConvergenceConfig,
  type BwsUpstreamConvergenceSignalRegistrar,
} from '../packages/bootstrap/src/index.js';
const TEST_TIMESTAMP = '2026-07-16T07:30:00.000Z';
const SOURCE_MANIFEST_TIMESTAMP = '2026-07-16T07:30:00Z';
const UPSTREAM_LOCK_SCHEMA = readFileSync(
  join(process.cwd(), 'schemas', 'betting-win-upstream-lock.v1.schema.json'),
  'utf-8',
);

test('upstream convergence service persists success and no-change passes, then reports a running status snapshot', async () => {
  const fixture = createServiceFixture();
  try {
    const config = createExportServiceConfig(fixture.repositoryRoot, fixture.upstreamRoot);
    const runtime = createFakeProcessRuntime();
    const signals = createSignalCapture();
    const now = createNowSequence([
      '2026-07-16T07:30:00.000Z',
      '2026-07-16T07:30:01.000Z',
      '2026-07-16T07:30:02.000Z',
      '2026-07-16T07:30:03.000Z',
      '2026-07-16T07:30:04.000Z',
      '2026-07-16T07:30:05.000Z',
      '2026-07-16T07:30:06.000Z',
      '2026-07-16T07:30:07.000Z',
      '2026-07-16T07:30:08.000Z',
      '2026-07-16T07:30:09.000Z',
    ]);
    const passOutcomes = [
      accepted({
        checkpointId: 'checkpoint-001',
        completed: false,
        mode: 'export' as const,
        nextSelectionIndex: 1,
        processedCount: 1 as const,
        processedSelectionCursor: 'cursor-001',
        selectionCount: 2,
      }),
      accepted({
        checkpointId: 'checkpoint-001',
        completed: true,
        mode: 'export' as const,
        nextSelectionIndex: 2,
        processedCount: 0 as const,
        selectionCount: 2,
      }),
    ];

    const runPromise = runBwsUpstreamConvergenceService({
      config,
      maxPasses: 2,
      now,
      processRuntime: runtime.runtime,
      repositoryRoot: fixture.repositoryRoot,
      runExportPass() {
        const next = passOutcomes.shift();
        assert.notEqual(next, undefined);
        return next!;
      },
      runtimeStateDirectory: fixture.runtimeStateDirectory,
      signalRegistrar: signals.registrar,
      sleep: async () => undefined,
    });

    const status = getBwsUpstreamConvergenceServiceStatus({
      config,
      now: () => '2026-07-16T07:30:05.500Z',
      processRuntime: runtime.runtime,
      repositoryRoot: fixture.repositoryRoot,
      runtimeStateDirectory: fixture.runtimeStateDirectory,
    });
    assert.equal(status.command, 'status');
    assert.equal(status.outcome, 'running');
    assert.equal('pid' in status.process, true);

    const result = await runPromise;
    assert.equal(result.outcome, 'max_passes_reached');
    assert.deepEqual(result.counters, {
      blockerCount: 0,
      consecutiveNonSuccessCount: 0,
      failureCount: 0,
      noChangeCount: 1,
      successCount: 1,
      totalPassCount: 2,
    } satisfies BwsUpstreamConvergenceServiceCounters);
    assert.equal(result.lastPass?.outcome, 'no_change');

    const persisted = readStateFile(fixture.runtimeStateDirectory);
    assert.equal(persisted.runtime.counters.successCount, 1);
    assert.equal(persisted.runtime.counters.noChangeCount, 1);
    assert.equal(persisted.runtime.lifecycleState, 'stopped');
    assert.equal(readdirSync(join(fixture.runtimeStateDirectory, 'evidence')).length >= 4, true);
    assert.equal(hasTemporaryStateFile(fixture.runtimeStateDirectory), false);
  } finally {
    fixture.dispose();
  }
});

test('upstream convergence service persists blocker state, applies retry backoff, and resumes counters after restart', async () => {
  const fixture = createServiceFixture();
  try {
    const config = createApiServiceConfig(fixture.repositoryRoot, fixture.upstreamRoot);
    const firstRuntime = createFakeProcessRuntime();
    const secondRuntime = createFakeProcessRuntime(31002);

    const firstResult = await runBwsUpstreamConvergenceService({
      config,
      maxPasses: 1,
      now: createNowSequence([
        '2026-07-16T07:40:00.000Z',
        '2026-07-16T07:40:01.000Z',
        '2026-07-16T07:40:02.000Z',
        '2026-07-16T07:40:03.000Z',
        '2026-07-16T07:40:04.000Z',
      ]),
      processRuntime: firstRuntime.runtime,
      repositoryRoot: fixture.repositoryRoot,
      runApiPass: async () => ({
        ok: false,
        blockers: [
          {
            code: 'BWS_UPSTREAM_API_CONFIGURATION_MUTATED',
            evidenceRequired: 'An unchanged configuration.',
            message: 'configuration mutated',
          },
        ],
      }),
      runtimeStateDirectory: fixture.runtimeStateDirectory,
      sleep: async () => undefined,
    });
    assert.equal(firstResult.lastPass?.outcome, 'blocked');
    assert.equal(firstResult.counters.blockerCount, 1);
    assert.equal(firstResult.nextAttemptAt, undefined);

    firstRuntime.markMissing();

    const secondResult = await runBwsUpstreamConvergenceService({
      config,
      maxPasses: 2,
      now: createNowSequence([
        '2026-07-16T07:41:00.000Z',
        '2026-07-16T07:41:01.000Z',
        '2026-07-16T07:41:02.000Z',
        '2026-07-16T07:41:03.000Z',
        '2026-07-16T07:41:04.000Z',
      ]),
      processRuntime: secondRuntime.runtime,
      repositoryRoot: fixture.repositoryRoot,
      runApiPass: async () =>
        accepted({
          checkpointId: 'checkpoint-api-001',
          completedCycleCount: 1,
          cycleCompleted: true,
          cycleNumber: 1,
          importRunId: 'import-run-001',
          mode: 'api' as const,
          nextResource: 'identity',
          pageNumber: 1,
          processedCount: 2,
          resource: 'settlement',
        }),
      runtimeStateDirectory: fixture.runtimeStateDirectory,
      sleep: async () => undefined,
    });
    assert.equal(secondResult.counters.blockerCount, 1);
    assert.equal(secondResult.counters.successCount, 1);
    assert.equal(secondResult.counters.totalPassCount, 2);
    assert.equal(secondResult.lastPass?.passNumber, 2);
  } finally {
    fixture.dispose();
  }
});

test('upstream convergence service fails closed on overlap, records timeout failures, and stops cleanly after SIGTERM', async () => {
  const fixture = createServiceFixture();
  try {
    const config = createExportServiceConfig(fixture.repositoryRoot, fixture.upstreamRoot);
    const runtime = createFakeProcessRuntime();
    const overlapSignals = createSignalCapture();
    let releaseFirstPass: (() => void) | undefined;

    const overlapPromise = runBwsUpstreamConvergenceService({
      config,
      now: createNowSequence([
        '2026-07-16T07:50:00.000Z',
        '2026-07-16T07:50:01.000Z',
        '2026-07-16T07:50:02.000Z',
        '2026-07-16T07:50:03.000Z',
        '2026-07-16T07:50:04.000Z',
        '2026-07-16T07:50:05.000Z',
      ]),
      processRuntime: runtime.runtime,
      repositoryRoot: fixture.repositoryRoot,
      runExportPass() {
        return new Promise((resolve) => {
          releaseFirstPass = () => {
            resolve(
              accepted({
                checkpointId: 'checkpoint-001',
                completed: true,
                mode: 'export' as const,
                nextSelectionIndex: 1,
                processedCount: 0 as const,
                selectionCount: 1,
              }),
            );
          };
        });
      },
      runtimeStateDirectory: fixture.runtimeStateDirectory,
      signalRegistrar: overlapSignals.registrar,
      sleep: async () => undefined,
    });
    const statusWhileRunning = getBwsUpstreamConvergenceServiceStatus({
      config,
      now: () => '2026-07-16T07:50:01.250Z',
      processRuntime: runtime.runtime,
      repositoryRoot: fixture.repositoryRoot,
      runtimeStateDirectory: fixture.runtimeStateDirectory,
    });
    assert.equal(statusWhileRunning.outcome, 'running');
    await assert.rejects(
      () =>
        runBwsUpstreamConvergenceService({
          config,
          maxPasses: 1,
          now: () => '2026-07-16T07:50:01.500Z',
          processRuntime: runtime.runtime,
          repositoryRoot: fixture.repositoryRoot,
          runExportPass() {
            return accepted({
              checkpointId: 'checkpoint-001',
              completed: true,
              mode: 'export' as const,
              nextSelectionIndex: 1,
              processedCount: 0 as const,
              selectionCount: 1,
            });
          },
          runtimeStateDirectory: fixture.runtimeStateDirectory,
          sleep: async () => undefined,
        }),
      /already running/,
    );
    overlapSignals.require('SIGTERM')();
    assert.notEqual(releaseFirstPass, undefined);
    releaseFirstPass!();
    await overlapPromise;

    runtime.markMissing();

    const timeoutSignals = createSignalCapture();
    let timeoutRegistrar: BwsUpstreamConvergenceSignalRegistrar | undefined;
    timeoutRegistrar = timeoutSignals.registrar;
    const timeoutPromise = runBwsUpstreamConvergenceService({
      config,
      now: createNowSequence([
        '2026-07-16T07:51:00.000Z',
        '2026-07-16T07:51:01.000Z',
        '2026-07-16T07:51:02.000Z',
        '2026-07-16T07:51:03.000Z',
        '2026-07-16T07:51:04.000Z',
        '2026-07-16T07:51:05.000Z',
      ]),
      processRuntime: createFakeProcessRuntime(33001).runtime,
      repositoryRoot: fixture.repositoryRoot,
      runExportPass() {
        return new Promise((resolve) => {
          setTimeout(() => {
            timeoutSignals.require('SIGTERM')();
            resolve(
              accepted({
                checkpointId: 'checkpoint-001',
                completed: true,
                mode: 'export' as const,
                nextSelectionIndex: 1,
                processedCount: 1 as const,
                processedSelectionCursor: 'cursor-timeout',
                selectionCount: 1,
              }),
            );
          }, 25);
        });
      },
      runtimeStateDirectory: fixture.runtimeStateDirectory,
      signalRegistrar: timeoutRegistrar,
      sleep: async () => undefined,
    });

    const timeoutResult = await timeoutPromise;
    assert.equal(timeoutResult.outcome, 'signal_stopped');
    assert.equal(timeoutResult.lastPass?.outcome, 'failure');
    assert.equal(timeoutResult.lastPass?.timedOut, true);
    assert.equal(timeoutResult.lastSignal, 'SIGTERM');
  } finally {
    fixture.dispose();
  }
});

test('upstream convergence service CLI help stays explicit and config rejects fallback-missing service settings', async () => {
  const fixture = createServiceFixture();
  try {
    const help = captureStream();
    assert.equal(await runBwsUpstreamConvergenceServiceCli(['--help'], fixture.repositoryRoot, help.stream), 0);
    assert.match(help.read(), /<run\|status>/);
    assert.match(help.read(), /BWS_UPSTREAM_CONVERGENCE_INTERVAL_MS/);
    assert.match(help.read(), /SIGINT or SIGTERM/);

    await assert.rejects(
      async () => {
        resolveBwsUpstreamConvergenceServiceConfig(
          {
            ...fixture.createExportEnvironment(),
            [BWS_UPSTREAM_CONVERGENCE_INTERVAL_MS_ENV]: '',
          },
          fixture.repositoryRoot,
        );
      },
      /BWS_UPSTREAM_CONVERGENCE_INTERVAL_MS must be a non-empty string/,
    );
  } finally {
    fixture.dispose();
  }
});

function createServiceFixture(): {
  readonly createApiEnvironment: () => BwsUpstreamConvergenceServiceEnvironment;
  readonly createExportEnvironment: () => BwsUpstreamConvergenceServiceEnvironment;
  readonly dispose: () => void;
  readonly repositoryRoot: string;
  readonly runtimeStateDirectory: string;
  readonly upstreamRoot: string;
} {
  const root = mkdtempSync(join(tmpdir(), 'bws-upstream-service-'));
  const repositoryRoot = join(root, 'betting-win-surebet');
  const upstreamRoot = join(root, 'betting-win');
  const runtimeStateDirectory = join(repositoryRoot, 'runtime-state');
  mkdirSync(repositoryRoot, { recursive: true });
  mkdirSync(upstreamRoot, { recursive: true });
  mkdirSync(join(repositoryRoot, 'config'), { recursive: true });
  mkdirSync(join(repositoryRoot, 'schemas'), { recursive: true });
  writeFileSync(
    join(repositoryRoot, 'package.json'),
    `${JSON.stringify({ name: 'bws-upstream-service-fixture', version: '0.0.0-test' }, null, 2)}\n`,
    'utf-8',
  );
  writeFileSync(
    join(repositoryRoot, 'SOURCE_MANIFEST.json'),
    `${JSON.stringify({
      schema: 'betting-win-surebet-source-manifest-v1',
      generated: SOURCE_MANIFEST_TIMESTAMP,
      overlay: 'bws-upstream-service-test',
      files: [],
    }, null, 2)}\n`,
    'utf-8',
  );
  writeFileSync(
    join(repositoryRoot, 'schemas', 'betting-win-upstream-lock.v1.schema.json'),
    UPSTREAM_LOCK_SCHEMA,
    'utf-8',
  );
  writeFileSync(
    join(repositoryRoot, 'config', 'betting-win.upstream.lock.json'),
    `${JSON.stringify(sampleUpstreamLock(upstreamRoot), null, 2)}\n`,
    'utf-8',
  );
  const exportManifestPath = join(repositoryRoot, 'config', 'selection.json');
  writeFileSync(
    exportManifestPath,
    `${JSON.stringify({
      schema: 'bws.upstream_export_selection.v1',
      mode: 'export',
      checkpointId: 'checkpoint-001',
      contractSchema: 'betting-win.strategy-export.v1',
      contractAlias: 'betting-win-strategy-export.v1',
      surebetProfile: 'surebet_standard_binary_v0',
      exports: [
        {
          cursor: 'cursor-001',
          exportPath: join(repositoryRoot, 'artifacts', 'selection-export-001.json'),
          expectedSha256: 'a'.repeat(64),
          expectedProviderGenerationIds: ['generation-001'],
          expectedSourceLineageRecordIds: ['lineage-001'],
        },
      ],
    }, null, 2)}\n`,
    'utf-8',
  );
  mkdirSync(join(repositoryRoot, 'artifacts'), { recursive: true });
  writeFileSync(
    join(repositoryRoot, 'artifacts', 'selection-export-001.json'),
    JSON.stringify({
      schema: 'betting-win.strategy-export.v1',
      contractAlias: 'betting-win-strategy-export.v1',
      surebetProfile: 'surebet_standard_binary_v0',
      providerGenerationIds: ['generation-001'],
      sourceLineageRecordIds: ['lineage-001'],
      exportId: 'export-001',
    }),
    'utf-8',
  );

  const baseEnvironment: BwsUpstreamConvergenceServiceEnvironment = Object.freeze({
    BETTING_WIN_REPO_PATH: upstreamRoot,
    BWS_UPSTREAM_LOCK_PATH: 'config/betting-win.upstream.lock.json',
    [BWS_UPSTREAM_CONVERGENCE_INTERVAL_MS_ENV]: '25',
    [BWS_UPSTREAM_CONVERGENCE_MAX_BACKOFF_MS_ENV]: '100',
    [BWS_UPSTREAM_CONVERGENCE_PASS_TIMEOUT_MS_ENV]: '10',
    [BWS_UPSTREAM_CONVERGENCE_RETRY_BACKOFF_MS_ENV]: '20',
    SUREBET_EXECUTION_ENABLED: 'false',
    SUREBET_PG_DATABASE: 'surebet_test',
    SUREBET_PG_HOST: '127.0.0.1',
    SUREBET_PG_PORT: '5432',
    SUREBET_PG_USER: 'surebet',
    SUREBET_PROVIDER_CONNECTIONS: 'disabled',
    SUREBET_RUNTIME_MODE: 'paper',
  });

  return Object.freeze({
    createApiEnvironment() {
      return Object.freeze({
        ...baseEnvironment,
        [BWS_UPSTREAM_MODE_ENV]: 'api',
        [BWS_UPSTREAM_API_BASE_URL_ENV]: 'http://127.0.0.1:4312',
        [BWS_UPSTREAM_API_CHECKPOINT_ID_ENV]: 'checkpoint-api-001',
        [BWS_UPSTREAM_API_CONTRACT_VERSION_ENV]: '1.0.0',
        [BWS_UPSTREAM_API_MAX_PAGES_PER_RESOURCE_ENV]: '2',
        [BWS_UPSTREAM_API_PAGE_SIZE_ENV]: '10',
        [BWS_UPSTREAM_API_RETRY_BACKOFF_MS_ENV]: '5',
        [BWS_UPSTREAM_API_RETRY_LIMIT_ENV]: '1',
        [BWS_UPSTREAM_API_TIMEOUT_MS_ENV]: '25',
      });
    },
    createExportEnvironment() {
      return Object.freeze({
        ...baseEnvironment,
        [BWS_UPSTREAM_MODE_ENV]: 'export',
        [BWS_UPSTREAM_EXPORT_SELECTION_PATH_ENV]: 'config/selection.json',
      });
    },
    dispose() {
      rmSync(root, { recursive: true, force: true });
    },
    repositoryRoot,
    runtimeStateDirectory,
    upstreamRoot,
  });
}

function createFakeProcessRuntime(
  pid: number = 31001,
): Readonly<{
  readonly markMissing: () => void;
  readonly runtime: BwsUpstreamConvergenceProcessRuntime;
}> {
  let alive = true;
  const command = Object.freeze(['/usr/bin/node', 'dist/packages/bootstrap/src/cli/bws-upstream-convergence-service.js', 'run']);
  const processRecord: BwsUpstreamConvergenceManagedProcess = Object.freeze({
    command,
    commandCwd: '/virtual/repo',
    entryPointPath: '/virtual/repo/dist/packages/bootstrap/src/cli/bws-upstream-convergence-service.js',
    pid,
    procStartTicks: `ticks-${pid}`,
    processName: 'bws-upstream-convergence-service',
    startedAt: '2026-07-16T07:30:00.000Z',
  });
  return Object.freeze({
    markMissing() {
      alive = false;
    },
    runtime: Object.freeze({
      createProcessRecord(input: Readonly<{
        readonly commandCwd: string;
        readonly entryPointPath: string;
        readonly processName: 'bws-upstream-convergence-service';
        readonly startedAt: string;
      }>) {
        return Object.freeze({
          ...processRecord,
          commandCwd: input.commandCwd,
          entryPointPath: input.entryPointPath,
          startedAt: input.startedAt,
        });
      },
      inspectProcess(record: BwsUpstreamConvergenceManagedProcess) {
        return alive && record.pid === pid ? 'running' : 'missing';
      },
    }),
  });
}

function createSignalCapture(): Readonly<{
  readonly registrar: BwsUpstreamConvergenceSignalRegistrar;
  readonly require: (signal: 'SIGINT' | 'SIGTERM') => () => void;
}> {
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

function createNowSequence(values: readonly string[]): () => string {
  let index = 0;
  return () => {
    const value = values[index] ?? values[values.length - 1];
    index += 1;
    return value!;
  };
}

function readStateFile(runtimeStateDirectory: string): {
  readonly runtime: {
    readonly counters: BwsUpstreamConvergenceServiceCounters;
    readonly lifecycleState: string;
  };
} {
  return JSON.parse(readFileSync(join(runtimeStateDirectory, 'state.json'), 'utf-8')) as {
    readonly runtime: {
      readonly counters: BwsUpstreamConvergenceServiceCounters;
      readonly lifecycleState: string;
    };
  };
}

function hasTemporaryStateFile(runtimeStateDirectory: string): boolean {
  return readdirSync(runtimeStateDirectory).some((entry) => entry.includes('.tmp'));
}

function captureStream(): Readonly<{
  readonly read: () => string;
  readonly stream: NodeJS.WriteStream;
}> {
  const chunks: string[] = [];
  const stream = {
    write(chunk: string) {
      chunks.push(chunk);
      return true;
    },
  } as unknown as NodeJS.WriteStream;
  return Object.freeze({
    read() {
      return chunks.join('');
    },
    stream,
  });
}

function createExportServiceConfig(
  repositoryRoot: string,
  upstreamRoot: string,
): BwsUpstreamConvergenceServiceConfig {
  const manifestPath = join(repositoryRoot, 'config', 'selection.json');
  const manifestSha256 = createHash('sha256').update(readFileSync(manifestPath, 'utf-8')).digest('hex');
  const passConfig: BwsUpstreamExportConvergenceConfig = Object.freeze({
    mode: 'export',
    persistence: Object.freeze({
      database: 'surebet_test',
      host: '127.0.0.1',
      port: 5432,
      user: 'surebet',
    }),
    repositoryRoot,
    selection: Object.freeze({
      checkpointId: 'checkpoint-001',
      contractAlias: 'betting-win-strategy-export.v1',
      contractSchema: 'betting-win.strategy-export.v1',
      entries: Object.freeze([
        Object.freeze({
          cursor: 'cursor-001',
          expectedProviderGenerationIds: Object.freeze(['generation-001']),
          expectedSha256: 'a'.repeat(64),
          expectedSourceLineageRecordIds: Object.freeze(['lineage-001']),
          exportPath: join(repositoryRoot, 'artifacts', 'selection-export-001.json'),
        }),
      ]),
      manifestPath,
      manifestSha256,
      surebetProfile: 'surebet_standard_binary_v0',
    }),
    upstream: Object.freeze({
      lock: sampleUpstreamLock(upstreamRoot) as unknown as BwsUpstreamExportConvergenceConfig['upstream']['lock'],
      lockPath: join(repositoryRoot, 'config', 'betting-win.upstream.lock.json'),
      repoPath: upstreamRoot,
    }),
  });
  return Object.freeze({
    intervalMs: 25,
    maxRetryBackoffMs: 100,
    mode: 'export',
    passConfig,
    passTimeoutMs: 10,
    repositoryRoot,
    retryBackoffMs: 20,
  });
}

function createApiServiceConfig(
  repositoryRoot: string,
  upstreamRoot: string,
): BwsUpstreamConvergenceServiceConfig {
  const passConfig: BwsUpstreamApiConvergenceConfig = Object.freeze({
    checkpointId: 'checkpoint-api-001',
    mode: 'api',
    persistence: Object.freeze({
      database: 'surebet_test',
      host: '127.0.0.1',
      port: 5432,
      user: 'surebet',
    }),
    query: Object.freeze({
      baseUrl: 'http://127.0.0.1:4312',
      contractVersion: '1.0.0',
      maxPagesPerResource: 2,
      pageSize: 10,
      retryBackoffMs: 5,
      retryLimit: 1,
      timeoutMs: 25,
    }),
    repositoryRoot,
    upstream: Object.freeze({
      lock: sampleUpstreamLock(upstreamRoot) as unknown as BwsUpstreamApiConvergenceConfig['upstream']['lock'],
      lockPath: join(repositoryRoot, 'config', 'betting-win.upstream.lock.json'),
      repoPath: upstreamRoot,
    }),
  });
  return Object.freeze({
    intervalMs: 25,
    maxRetryBackoffMs: 100,
    mode: 'api',
    passConfig,
    passTimeoutMs: 10,
    repositoryRoot,
    retryBackoffMs: 20,
  });
}

function sampleUpstreamLock(upstreamRoot: string): Record<string, unknown> {
  return Object.freeze({
    schema: 'betting-win-surebet-upstream-lock-v1',
    repository: 'betting-win',
    repositoryPath: upstreamRoot,
    sourceView: 'committed_git_head',
    commitSha: '0123456789abcdef0123456789abcdef01234567',
    gitTreeSha: '89abcdef0123456789abcdef0123456789abcdef',
    trackedTreeListingSha256: 'a'.repeat(64),
    sourceFingerprintAlgorithm: 'sha256_git_ls_tree_r_full_tree_head_v1',
    packageVersion: '0.48.0',
    packageVersions: Object.freeze({
      '@betting-win/provider-collection': '0.48.0',
    }),
    contractSchema: 'betting-win.strategy-export.v1',
    contractAlias: 'betting-win-strategy-export.v1',
    surebetProfile: 'surebet_standard_binary_v0',
    capabilities: Object.freeze(['getHistoricalQuotes']),
    verifiedAt: TEST_TIMESTAMP,
  });
}
