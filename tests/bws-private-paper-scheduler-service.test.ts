import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  accepted,
  blocked,
  getBwsPrivatePaperSchedulerServiceStatus,
  resolveBwsPrivatePaperSchedulerServiceConfig,
  runBwsPrivatePaperSchedulerService,
  runBwsPrivatePaperSchedulerServiceCli,
  type BwsPrivatePaperSchedulerManagedProcess,
  type BwsPrivatePaperSchedulerProcessRuntime,
  type BwsPrivatePaperSchedulerServiceConfig,
  type BwsPrivatePaperSchedulerServiceCounters,
  type BwsPrivatePaperSchedulerServiceEnvironment,
  type BwsPrivatePaperSchedulerSignalRegistrar,
  type BwsPrivatePaperApiSchedulerConfig,
} from '../packages/bootstrap/src/index.js';
import type { BwsUpstreamApiConvergenceConfig } from '../packages/bootstrap/src/operations/upstream-api-convergence.js';
import type { BettingWinUpstreamLock } from '../packages/upstream/src/index.js';

const TEST_TIMESTAMP = '2026-07-16T08:00:00.000Z';
const SOURCE_MANIFEST_TIMESTAMP = '2026-07-16T08:00:00Z';

test('private-paper scheduler service persists scheduled and skipped passes, then reports a running status snapshot', async () => {
  const fixture = createServiceFixture();
  try {
    const config = createSchedulerServiceConfig(fixture.repositoryRoot);
    const runtime = createFakeProcessRuntime();
    const now = createNowSequence([
      '2026-07-16T08:00:00.000Z',
      '2026-07-16T08:00:01.000Z',
      '2026-07-16T08:00:02.000Z',
      '2026-07-16T08:00:03.000Z',
      '2026-07-16T08:00:04.000Z',
      '2026-07-16T08:00:05.000Z',
      '2026-07-16T08:00:06.000Z',
      '2026-07-16T08:00:07.000Z',
      '2026-07-16T08:00:08.000Z',
    ]);
    const passOutcomes = [
      accepted(createScheduledPassResult()),
      accepted(createSkippedPassResult()),
    ];

    const runPromise = runBwsPrivatePaperSchedulerService({
      config,
      jobs: {
        summarizeQueue: () => createQueueSummary(0),
      },
      maxPasses: 2,
      now,
      processRuntime: runtime.runtime,
      repositoryRoot: fixture.repositoryRoot,
      runSchedulerPass: async () => {
        const next = passOutcomes.shift();
        assert.notEqual(next, undefined);
        return next!;
      },
      runtimeStateDirectory: fixture.runtimeStateDirectory,
      sleep: async () => undefined,
    });

    const status = getBwsPrivatePaperSchedulerServiceStatus({
      config,
      now: () => '2026-07-16T08:00:03.500Z',
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
      blockedCount: 0,
      consecutiveNonSuccessCount: 0,
      duplicateSuppressedCount: 0,
      failureCount: 0,
      scheduledCount: 1,
      skippedCount: 1,
      totalPassCount: 2,
    } satisfies BwsPrivatePaperSchedulerServiceCounters);
    assert.equal(result.lastPass?.outcome, 'skipped');

    const persisted = readStateFile(fixture.runtimeStateDirectory);
    assert.equal(persisted.runtime.counters.scheduledCount, 1);
    assert.equal(persisted.runtime.counters.skippedCount, 1);
    assert.equal(persisted.runtime.lifecycleState, 'stopped');
    assert.equal(readdirSync(join(fixture.runtimeStateDirectory, 'evidence')).length >= 4, true);
    assert.equal(hasTemporaryStateFile(fixture.runtimeStateDirectory), false);
  } finally {
    fixture.dispose();
  }
});

test('private-paper scheduler service records backpressure skips, preserves blocker counters across restart, and resumes scheduling', async () => {
  const fixture = createServiceFixture();
  try {
    const config = createSchedulerServiceConfig(fixture.repositoryRoot);
    const firstRuntime = createFakeProcessRuntime();
    const secondRuntime = createFakeProcessRuntime(42002);

    const firstResult = await runBwsPrivatePaperSchedulerService({
      config,
      jobs: {
        summarizeQueue: () => createQueueSummary(2),
      },
      maxPasses: 1,
      now: createNowSequence([
        '2026-07-16T08:10:00.000Z',
        '2026-07-16T08:10:01.000Z',
        '2026-07-16T08:10:02.000Z',
        '2026-07-16T08:10:03.000Z',
      ]),
      processRuntime: firstRuntime.runtime,
      repositoryRoot: fixture.repositoryRoot,
      runSchedulerPass: async () => blocked(
        'UNREACHABLE',
        'runSchedulerPass must not be reached while backpressure is active',
        'No scheduler pass when outstanding queue depth already exceeds the configured bound.',
      ),
      runtimeStateDirectory: fixture.runtimeStateDirectory,
      sleep: async () => undefined,
    });
    assert.equal(firstResult.lastPass?.outcome, 'skipped');
    assert.equal(firstResult.lastPass?.skipReason, 'backpressure');
    assert.equal(firstResult.counters.skippedCount, 1);

    firstRuntime.markMissing();

    const secondResult = await runBwsPrivatePaperSchedulerService({
      config,
      jobs: {
        summarizeQueue: () => createQueueSummary(0),
      },
      maxPasses: 2,
      now: createNowSequence([
        '2026-07-16T08:11:00.000Z',
        '2026-07-16T08:11:01.000Z',
        '2026-07-16T08:11:02.000Z',
        '2026-07-16T08:11:03.000Z',
      ]),
      processRuntime: secondRuntime.runtime,
      repositoryRoot: fixture.repositoryRoot,
      runSchedulerPass: async () => accepted(createScheduledPassResult()),
      runtimeStateDirectory: fixture.runtimeStateDirectory,
      sleep: async () => undefined,
    });
    assert.equal(secondResult.counters.skippedCount, 1);
    assert.equal(secondResult.counters.scheduledCount, 1);
    assert.equal(secondResult.counters.totalPassCount, 2);
    assert.equal(secondResult.lastPass?.passNumber, 2);
  } finally {
    fixture.dispose();
  }
});

test('private-paper scheduler service fails closed on overlap and stops cleanly after SIGTERM', async () => {
  const fixture = createServiceFixture();
  try {
    const config = createSchedulerServiceConfig(fixture.repositoryRoot);
    const runtime = createFakeProcessRuntime();
    const signals = createSignalCapture();
    let releasePass: (() => void) | undefined;

    const runPromise = runBwsPrivatePaperSchedulerService({
      config,
      jobs: {
        summarizeQueue: () => createQueueSummary(0),
      },
      now: createNowSequence([
        '2026-07-16T08:20:00.000Z',
        '2026-07-16T08:20:01.000Z',
        '2026-07-16T08:20:02.000Z',
        '2026-07-16T08:20:03.000Z',
        '2026-07-16T08:20:04.000Z',
      ]),
      processRuntime: runtime.runtime,
      repositoryRoot: fixture.repositoryRoot,
      runSchedulerPass: async () =>
        await new Promise((resolve) => {
          releasePass = () => {
            resolve(accepted(createScheduledPassResult()));
          };
        }),
      runtimeStateDirectory: fixture.runtimeStateDirectory,
      signalRegistrar: signals.registrar,
      sleep: async () => undefined,
    });

    await assert.rejects(
      () =>
        runBwsPrivatePaperSchedulerService({
          config,
          jobs: {
            summarizeQueue: () => createQueueSummary(0),
          },
          maxPasses: 1,
          now: () => '2026-07-16T08:20:01.500Z',
          processRuntime: runtime.runtime,
          repositoryRoot: fixture.repositoryRoot,
          runSchedulerPass: async () => accepted(createSkippedPassResult()),
          runtimeStateDirectory: fixture.runtimeStateDirectory,
          sleep: async () => undefined,
        }),
      /already running/,
    );

    signals.require('SIGTERM')();
    releasePass?.();

    const result = await runPromise;
    assert.equal(result.outcome, 'signal_stopped');
    assert.equal(result.lastSignal, 'SIGTERM');
    assert.equal(result.lastPass?.outcome, 'scheduled');
  } finally {
    fixture.dispose();
  }
});

test('private-paper scheduler service CLI help stays explicit and config rejects missing service settings', async () => {
  const fixture = createServiceFixture();
  try {
    const help = captureStream();
    assert.equal(await runBwsPrivatePaperSchedulerServiceCli(['--help'], fixture.repositoryRoot, help.stream), 0);
    assert.match(help.read(), /<run\|status>/);
    assert.match(help.read(), /BWS_PRIVATE_PAPER_SCHEDULER_INTERVAL_MS/);
    assert.match(help.read(), /queue backpressure/);

    assert.throws(
      () =>
        resolveBwsPrivatePaperSchedulerServiceConfig(
          {
            BWS_PRIVATE_PAPER_SCHEDULER_INTERVAL_MS: '',
          } as BwsPrivatePaperSchedulerServiceEnvironment,
          fixture.repositoryRoot,
        ),
      /BWS_PRIVATE_PAPER_SCHEDULER_INTERVAL_MS must be a non-empty string/,
    );
  } finally {
    fixture.dispose();
  }
});

function createServiceFixture(): {
  readonly dispose: () => void;
  readonly repositoryRoot: string;
  readonly runtimeStateDirectory: string;
} {
  const root = mkdtempSync(join(tmpdir(), 'bws-private-paper-scheduler-service-'));
  const repositoryRoot = join(root, 'betting-win-surebet');
  const runtimeStateDirectory = join(repositoryRoot, 'runtime-state');
  mkdirSync(repositoryRoot, { recursive: true });
  writeFileSync(
    join(repositoryRoot, 'package.json'),
    `${JSON.stringify({ name: 'bws-private-paper-scheduler-service-fixture', version: '0.0.0-test' }, null, 2)}\n`,
    'utf-8',
  );
  writeFileSync(
    join(repositoryRoot, 'SOURCE_MANIFEST.json'),
    `${JSON.stringify({
      schema: 'betting-win-surebet-source-manifest-v1',
      generated: SOURCE_MANIFEST_TIMESTAMP,
      overlay: 'bws-private-paper-scheduler-service-test',
      files: [],
    }, null, 2)}\n`,
    'utf-8',
  );

  return Object.freeze({
    dispose() {
      rmSync(root, { recursive: true, force: true });
    },
    repositoryRoot,
    runtimeStateDirectory,
  });
}

function createSchedulerServiceConfig(repositoryRoot: string): BwsPrivatePaperSchedulerServiceConfig {
  const passConfig: BwsPrivatePaperApiSchedulerConfig = Object.freeze({
    mode: 'api',
    persistence: {} as never,
    queueName: 'private-paper',
    repositoryRoot,
    schedule: Object.freeze({
      candidatePlans: Object.freeze([]),
      configSha256: 'a'.repeat(64),
      manifestPath: join(repositoryRoot, 'config', 'schedule.json'),
      manifestSha256: 'b'.repeat(64),
      maxCandidatesPerCycle: 1,
      retryDelaysMs: Object.freeze([250, 500]),
      runtimeId: 'runtime-001',
      schedulerCheckpointId: 'scheduler-001',
    }),
    upstream: createUpstreamApiConfig(repositoryRoot),
  });
  return Object.freeze({
    intervalMs: 25,
    maxQueueDepth: 2,
    maxRetryBackoffMs: 100,
    passConfig,
    passTimeoutMs: 10,
    repositoryRoot,
    retryBackoffMs: 20,
  });
}

function createUpstreamApiConfig(repositoryRoot: string): BwsUpstreamApiConvergenceConfig {
  return Object.freeze({
    checkpointId: 'checkpoint-api-001',
    mode: 'api',
    persistence: {} as never,
    query: Object.freeze({
      baseUrl: 'http://127.0.0.1:4312',
      contractVersion: '1.0.0',
      maxPagesPerResource: 2,
      pageSize: 2,
      retryBackoffMs: 250,
      retryLimit: 1,
      timeoutMs: 1_000,
    }),
    repositoryRoot,
    upstream: Object.freeze({
      lock: sampleUpstreamLock(repositoryRoot),
      lockPath: 'config/betting-win.upstream.lock.json',
      repoPath: join(repositoryRoot, '..', 'betting-win'),
    }),
  });
}

function createScheduledPassResult() {
  return Object.freeze({
    completedCycleCount: 1,
    duplicateSuppressed: false,
    lastScheduledApiCycleNumber: 1,
    mode: 'api' as const,
    queueName: 'private-paper',
    runtimeId: 'runtime-001',
    scheduled: true,
    scheduledCycleNumber: 1,
    scheduledJobId: 'private-paper:scheduler-001:cycle:1',
    schedulerCheckpointId: 'scheduler-001',
    upstreamPass: Object.freeze({
      checkpointId: 'checkpoint-api-001',
      completedCycleCount: 1,
      cycleCompleted: true,
      cycleNumber: 1,
      importRunId: 'import:checkpoint-api-001:cycle:1:settlement:page:1',
      mode: 'api' as const,
      nextResource: 'identity' as const,
      pageNumber: 1,
      processedCount: 1,
      resource: 'settlement' as const,
    }),
  });
}

function createSkippedPassResult() {
  return Object.freeze({
    completedCycleCount: 1,
    lastScheduledApiCycleNumber: 1,
    mode: 'api' as const,
    queueName: 'private-paper',
    runtimeId: 'runtime-001',
    scheduled: false,
    schedulerCheckpointId: 'scheduler-001',
    upstreamPass: Object.freeze({
      checkpointId: 'checkpoint-api-001',
      completedCycleCount: 1,
      cycleCompleted: false,
      cycleNumber: 2,
      importRunId: 'import:checkpoint-api-001:cycle:2:identity:page:1',
      mode: 'api' as const,
      nextResource: 'rules' as const,
      pageNumber: 1,
      processedCount: 0,
      resource: 'identity' as const,
    }),
  });
}

function createQueueSummary(outstandingCount: number) {
  return Object.freeze({
    deadLetteredCount: 0,
    leasedCount: outstandingCount,
    outstandingCount,
    pendingCount: 0,
    queueName: 'private-paper',
    retryWaitCount: 0,
    succeededCount: 0,
  });
}

function createFakeProcessRuntime(
  pid: number = 42001,
): Readonly<{
  readonly markMissing: () => void;
  readonly runtime: BwsPrivatePaperSchedulerProcessRuntime;
}> {
  let alive = true;
  const command = Object.freeze(['/usr/bin/node', 'dist/packages/bootstrap/src/cli/bws-private-paper-scheduler-service.js', 'run']);
  const processRecord: BwsPrivatePaperSchedulerManagedProcess = Object.freeze({
    command,
    commandCwd: '/virtual/repo',
    entryPointPath: '/virtual/repo/dist/packages/bootstrap/src/cli/bws-private-paper-scheduler-service.js',
    pid,
    procStartTicks: `ticks-${pid}`,
    processName: 'bws-private-paper-scheduler-service',
    startedAt: TEST_TIMESTAMP,
  });
  return Object.freeze({
    markMissing() {
      alive = false;
    },
    runtime: Object.freeze({
      createProcessRecord(input: Readonly<{
        readonly commandCwd: string;
        readonly entryPointPath: string;
        readonly processName: 'bws-private-paper-scheduler-service';
        readonly startedAt: string;
      }>) {
        return Object.freeze({
          ...processRecord,
          commandCwd: input.commandCwd,
          entryPointPath: input.entryPointPath,
          startedAt: input.startedAt,
        });
      },
      inspectProcess(record: BwsPrivatePaperSchedulerManagedProcess) {
        return alive && record.pid === pid ? 'running' : 'missing';
      },
    }),
  });
}

function createSignalCapture(): Readonly<{
  readonly registrar: BwsPrivatePaperSchedulerSignalRegistrar;
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
    readonly counters: BwsPrivatePaperSchedulerServiceCounters;
    readonly lifecycleState: string;
  };
} {
  return JSON.parse(readFileSync(join(runtimeStateDirectory, 'state.json'), 'utf-8')) as {
    readonly runtime: {
      readonly counters: BwsPrivatePaperSchedulerServiceCounters;
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

function sampleUpstreamLock(repositoryRoot: string): BettingWinUpstreamLock {
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
    repositoryPath: join(repositoryRoot, '..', 'betting-win'),
    schema: 'betting-win-surebet-upstream-lock-v1',
    sourceFingerprintAlgorithm: 'sha256_git_ls_tree_r_full_tree_head_v1',
    sourceView: 'committed_git_head',
    surebetProfile: 'surebet_standard_binary_v0',
    trackedTreeListingSha256: '3'.repeat(64),
    verifiedAt: TEST_TIMESTAMP,
  });
}
