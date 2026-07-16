import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  accepted,
  blocked,
  getBwsPrivatePaperWorkerServiceStatus,
  resolveBwsPrivatePaperWorkerServiceConfig,
  runBwsPrivatePaperWorkerService,
  runBwsPrivatePaperWorkerServiceCli,
  type BwsPrivatePaperWorkerManagedProcess,
  type BwsPrivatePaperWorkerProcessRuntime,
  type BwsPrivatePaperWorkerServiceConfig,
  type BwsPrivatePaperWorkerServiceCounters,
  type BwsPrivatePaperWorkerServiceEnvironment,
  type BwsPrivatePaperWorkerSignalRegistrar,
  type BoundedWorkerPassResult,
  type BwsServiceRuntimeConfig,
} from '../packages/bootstrap/src/index.js';
import type { BettingWinUpstreamLock } from '../packages/upstream/src/index.js';

const TEST_TIMESTAMP = '2026-07-16T09:00:00.000Z';
const SOURCE_MANIFEST_TIMESTAMP = '2026-07-16T09:00:00Z';

test('private-paper worker service persists processed and idle passes, then reports a running status snapshot', async () => {
  const fixture = createServiceFixture();
  try {
    const config = createWorkerServiceConfig(fixture.repositoryRoot);
    const runtime = createFakeProcessRuntime();
    const now = createNowSequence([
      '2026-07-16T09:00:00.000Z',
      '2026-07-16T09:00:01.000Z',
      '2026-07-16T09:00:02.000Z',
      '2026-07-16T09:00:03.000Z',
      '2026-07-16T09:00:04.000Z',
      '2026-07-16T09:00:05.000Z',
      '2026-07-16T09:00:06.000Z',
      '2026-07-16T09:00:07.000Z',
      '2026-07-16T09:00:08.000Z',
    ]);
    const passOutcomes = [
      accepted(createWorkerPassResult(1, { completedCount: 1, leaseRenewalCount: 2 })),
      accepted(createWorkerPassResult(0)),
    ];

    const runPromise = runBwsPrivatePaperWorkerService({
      applyMigrations: () => Object.freeze({ applied: Object.freeze([]), skipped: Object.freeze([]) }),
      config,
      createJobHandler: () => ({
        async run() {
          throw new Error('stub handler must not be reached when runWorkerPass is injected');
        },
      }),
      jobs: createWorkerJobRepositoryStub(),
      maxPasses: 2,
      now,
      processRuntime: runtime.runtime,
      repositoryRoot: fixture.repositoryRoot,
      runWorkerPass: async () => {
        const next = passOutcomes.shift();
        assert.notEqual(next, undefined);
        return next!;
      },
      runtimeStateDirectory: fixture.runtimeStateDirectory,
      sleep: async () => undefined,
    });

    const status = getBwsPrivatePaperWorkerServiceStatus({
      config,
      now: () => '2026-07-16T09:00:03.500Z',
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
      claimedCount: 1,
      completedCount: 1,
      consecutiveNonSuccessCount: 0,
      deadLetterCount: 0,
      expiredLeaseDeadLetterCount: 0,
      failureCount: 0,
      idlePassCount: 1,
      leaseRenewalCount: 2,
      processedPassCount: 1,
      retryCount: 0,
      totalPassCount: 2,
    } satisfies BwsPrivatePaperWorkerServiceCounters);
    assert.equal(result.lastPass?.outcome, 'idle');

    const persisted = readStateFile(fixture.runtimeStateDirectory);
    assert.equal(persisted.runtime.counters.processedPassCount, 1);
    assert.equal(persisted.runtime.counters.idlePassCount, 1);
    assert.equal(persisted.runtime.lifecycleState, 'stopped');
    assert.equal(readdirSync(join(fixture.runtimeStateDirectory, 'evidence')).length >= 4, true);
    assert.equal(hasTemporaryStateFile(fixture.runtimeStateDirectory), false);
  } finally {
    fixture.dispose();
  }
});

test('private-paper worker service preserves blocker counters across restart and resumes processing', async () => {
  const fixture = createServiceFixture();
  try {
    const config = createWorkerServiceConfig(fixture.repositoryRoot);
    const firstRuntime = createFakeProcessRuntime();
    const secondRuntime = createFakeProcessRuntime(43002);

    const firstResult = await runBwsPrivatePaperWorkerService({
      applyMigrations: () => Object.freeze({ applied: Object.freeze([]), skipped: Object.freeze([]) }),
      config,
      createJobHandler: () => ({
        async run() {
          throw new Error('stub handler must not be reached when runWorkerPass is injected');
        },
      }),
      jobs: createWorkerJobRepositoryStub(),
      maxPasses: 1,
      now: createNowSequence([
        '2026-07-16T09:10:00.000Z',
        '2026-07-16T09:10:01.000Z',
        '2026-07-16T09:10:02.000Z',
        '2026-07-16T09:10:03.000Z',
      ]),
      processRuntime: firstRuntime.runtime,
      repositoryRoot: fixture.repositoryRoot,
      runWorkerPass: async () => blocked(
        'BWS_WORKER_CONFIGURATION_BLOCKED',
        'blocked',
        'A valid bounded worker configuration.',
      ),
      runtimeStateDirectory: fixture.runtimeStateDirectory,
      sleep: async () => undefined,
    });
    assert.equal(firstResult.lastPass?.outcome, 'blocked');
    assert.equal(firstResult.counters.blockedCount, 1);

    firstRuntime.markMissing();

    const secondResult = await runBwsPrivatePaperWorkerService({
      applyMigrations: () => Object.freeze({ applied: Object.freeze([]), skipped: Object.freeze([]) }),
      config,
      createJobHandler: () => ({
        async run() {
          throw new Error('stub handler must not be reached when runWorkerPass is injected');
        },
      }),
      jobs: createWorkerJobRepositoryStub(),
      maxPasses: 2,
      now: createNowSequence([
        '2026-07-16T09:11:00.000Z',
        '2026-07-16T09:11:01.000Z',
        '2026-07-16T09:11:02.000Z',
        '2026-07-16T09:11:03.000Z',
      ]),
      processRuntime: secondRuntime.runtime,
      repositoryRoot: fixture.repositoryRoot,
      runWorkerPass: async () => accepted(createWorkerPassResult(1, { completedCount: 1 })),
      runtimeStateDirectory: fixture.runtimeStateDirectory,
      sleep: async () => undefined,
    });
    assert.equal(secondResult.counters.blockedCount, 1);
    assert.equal(secondResult.counters.processedPassCount, 1);
    assert.equal(secondResult.counters.totalPassCount, 2);
    assert.equal(secondResult.lastPass?.passNumber, 2);
  } finally {
    fixture.dispose();
  }
});

test('private-paper worker service fails closed on overlap and drains cleanly after SIGTERM', async () => {
  const fixture = createServiceFixture();
  try {
    const config = createWorkerServiceConfig(fixture.repositoryRoot);
    const runtime = createFakeProcessRuntime();
    const signals = createSignalCapture();
    let releasePass: (() => void) | undefined;

    const runPromise = runBwsPrivatePaperWorkerService({
      applyMigrations: () => Object.freeze({ applied: Object.freeze([]), skipped: Object.freeze([]) }),
      config,
      createJobHandler: () => ({
        async run() {
          throw new Error('stub handler must not be reached when runWorkerPass is injected');
        },
      }),
      jobs: createWorkerJobRepositoryStub(),
      now: createNowSequence([
        '2026-07-16T09:20:00.000Z',
        '2026-07-16T09:20:01.000Z',
        '2026-07-16T09:20:02.000Z',
        '2026-07-16T09:20:03.000Z',
        '2026-07-16T09:20:04.000Z',
      ]),
      processRuntime: runtime.runtime,
      repositoryRoot: fixture.repositoryRoot,
      runWorkerPass: async (request) =>
        await new Promise((resolve) => {
          releasePass = () => {
            resolve(accepted(createWorkerPassResult(1, { completedCount: 1, drained: request.shouldDrain?.() === true })));
          };
        }),
      runtimeStateDirectory: fixture.runtimeStateDirectory,
      signalRegistrar: signals.registrar,
      sleep: async () => undefined,
    });

    await assert.rejects(
      () =>
        runBwsPrivatePaperWorkerService({
          applyMigrations: () => Object.freeze({ applied: Object.freeze([]), skipped: Object.freeze([]) }),
          config,
          createJobHandler: () => ({
            async run() {
              throw new Error('stub handler must not be reached when runWorkerPass is injected');
            },
          }),
          jobs: createWorkerJobRepositoryStub(),
          maxPasses: 1,
          now: () => '2026-07-16T09:20:01.500Z',
          processRuntime: runtime.runtime,
          repositoryRoot: fixture.repositoryRoot,
          runWorkerPass: async () => accepted(createWorkerPassResult(0)),
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
    assert.equal(result.lastPass?.drained, true);
  } finally {
    fixture.dispose();
  }
});

test('private-paper worker service CLI help stays explicit and config rejects missing service settings', async () => {
  const fixture = createServiceFixture();
  try {
    const help = captureStream();
    assert.equal(await runBwsPrivatePaperWorkerServiceCli(['--help'], fixture.repositoryRoot, help.stream), 0);
    assert.match(help.read(), /<run\|status>/);
    assert.match(help.read(), /BWS_PRIVATE_PAPER_WORKER_INTERVAL_MS/);
    assert.match(help.read(), /renews active leases/);

    assert.throws(
      () =>
        resolveBwsPrivatePaperWorkerServiceConfig(
          {
            BWS_PRIVATE_PAPER_WORKER_INTERVAL_MS: '',
          } as BwsPrivatePaperWorkerServiceEnvironment,
          fixture.repositoryRoot,
        ),
      /BWS_PRIVATE_PAPER_WORKER_INTERVAL_MS must be a non-empty string/,
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
  const root = mkdtempSync(join(tmpdir(), 'bws-private-paper-worker-service-'));
  const repositoryRoot = join(root, 'betting-win-surebet');
  const runtimeStateDirectory = join(repositoryRoot, 'runtime-state');
  mkdirSync(repositoryRoot, { recursive: true });
  writeFileSync(
    join(repositoryRoot, 'package.json'),
    `${JSON.stringify({ name: 'bws-private-paper-worker-service-fixture', version: '0.0.0-test' }, null, 2)}\n`,
    'utf-8',
  );
  writeFileSync(
    join(repositoryRoot, 'SOURCE_MANIFEST.json'),
    `${JSON.stringify({
      schema: 'betting-win-surebet-source-manifest-v1',
      generated: SOURCE_MANIFEST_TIMESTAMP,
      overlay: 'bws-private-paper-worker-service-test',
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

function createWorkerServiceConfig(repositoryRoot: string): BwsPrivatePaperWorkerServiceConfig {
  return Object.freeze({
    intervalMs: 25,
    maxJobsPerPass: 2,
    maxRetryBackoffMs: 100,
    passTimeoutMs: 10,
    repositoryRoot,
    retryBackoffMs: 20,
    runtimeConfig: createRuntimeConfig(repositoryRoot),
  });
}

function createRuntimeConfig(repositoryRoot: string): BwsServiceRuntimeConfig {
  return Object.freeze({
    api: Object.freeze({
      bindHost: '127.0.0.1',
      port: 4312,
    }),
    persistence: {} as never,
    policy: Object.freeze({
      executionEnabled: false as const,
      providerConnections: 'disabled' as const,
      runtimeMode: 'paper' as const,
    }),
    processDefinitions: Object.freeze([]),
    upstream: Object.freeze({
      lock: sampleUpstreamLock(repositoryRoot),
      lockPath: 'config/betting-win.upstream.lock.json',
      repoPath: join(repositoryRoot, '..', 'betting-win'),
    }),
    worker: Object.freeze({
      leaseDurationMs: 1_000,
      queueName: 'private-paper',
      workerId: 'worker-001',
    }),
  });
}

function createWorkerPassResult(
  claimedCount: number,
  overrides: Partial<Omit<BoundedWorkerPassResult, 'claimedCount' | 'finishedAt' | 'processedJobs' | 'queueName' | 'startedAt' | 'workerId'>> = {},
): BoundedWorkerPassResult {
  return Object.freeze({
    claimedCount,
    completedCount: overrides.completedCount ?? 0,
    deadLetterCount: overrides.deadLetterCount ?? 0,
    drained: overrides.drained ?? false,
    expiredLeaseDeadLetterCount: overrides.expiredLeaseDeadLetterCount ?? 0,
    finishedAt: '2026-07-16T09:00:00.500Z',
    leaseRenewalCount: overrides.leaseRenewalCount ?? 0,
    processedJobs: Object.freeze([]),
    queueName: 'private-paper',
    retryCount: overrides.retryCount ?? 0,
    startedAt: '2026-07-16T09:00:00.000Z',
    workerId: 'worker-001',
  });
}

function createWorkerJobRepositoryStub() {
  return {
    claimNext() {
      return undefined;
    },
    complete() {
      throw new Error('complete must not be reached when runWorkerPass is injected');
    },
    deadLetterOwnedJob() {
      throw new Error('deadLetterOwnedJob must not be reached when runWorkerPass is injected');
    },
    fail() {
      throw new Error('fail must not be reached when runWorkerPass is injected');
    },
    heartbeatLease() {
      throw new Error('heartbeatLease must not be reached when runWorkerPass is injected');
    },
    recordCheckpoint() {
      throw new Error('recordCheckpoint must not be reached when runWorkerPass is injected');
    },
    reapExpiredLeases() {
      return Object.freeze([]);
    },
  };
}

function createFakeProcessRuntime(
  pid: number = 43001,
): Readonly<{
  readonly markMissing: () => void;
  readonly runtime: BwsPrivatePaperWorkerProcessRuntime;
}> {
  let alive = true;
  const command = Object.freeze(['/usr/bin/node', 'dist/packages/bootstrap/src/cli/bws-private-paper-worker-service.js', 'run']);
  const processRecord: BwsPrivatePaperWorkerManagedProcess = Object.freeze({
    command,
    commandCwd: '/virtual/repo',
    entryPointPath: '/virtual/repo/dist/packages/bootstrap/src/cli/bws-private-paper-worker-service.js',
    pid,
    procStartTicks: `ticks-${pid}`,
    processName: 'bws-private-paper-worker-service',
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
        readonly processName: 'bws-private-paper-worker-service';
        readonly startedAt: string;
      }>) {
        return Object.freeze({
          ...processRecord,
          commandCwd: input.commandCwd,
          entryPointPath: input.entryPointPath,
          startedAt: input.startedAt,
        });
      },
      inspectProcess(record: BwsPrivatePaperWorkerManagedProcess) {
        return alive && record.pid === pid ? 'running' : 'missing';
      },
    }),
  });
}

function createSignalCapture(): Readonly<{
  readonly registrar: BwsPrivatePaperWorkerSignalRegistrar;
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
    readonly counters: BwsPrivatePaperWorkerServiceCounters;
    readonly lifecycleState: string;
  };
} {
  return JSON.parse(readFileSync(join(runtimeStateDirectory, 'state.json'), 'utf-8')) as {
    readonly runtime: {
      readonly counters: BwsPrivatePaperWorkerServiceCounters;
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
