import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  accepted,
  blocked,
  createPrivatePaperRuntimeJobHandler,
  type BwsPrivatePaperApiSchedulerConfig,
  resolveBwsPrivatePaperSchedulerConfig,
  runBwsPrivatePaperSchedulerPass,
  type BwsPrivatePaperSchedulerConfig,
  type BwsPrivatePaperSchedulerEnvironment,
  type PersistedPrivatePaperRuntimeJobPayload,
  type SerializablePrivatePaperCandidatePlan,
} from '../packages/bootstrap/src/index.js';
import {
  applySurebetMigrations,
  resolveSurebetPersistenceConfig,
  sha256Hex,
  stableJsonStringify,
  SurebetPrivatePaperRuntimeSchedulerCheckpointRepository,
  type JsonValue,
  type SurebetImportRunRecord,
  type SurebetPendingWorkerJobRecord,
  type SurebetPersistenceConfig,
} from '../packages/persistence/src/index.js';
import type { BwsUpstreamApiConvergenceConfig } from '../packages/bootstrap/src/operations/upstream-api-convergence.js';
import type { BwsUpstreamExportConvergenceConfig } from '../packages/bootstrap/src/operations/upstream-export-convergence.js';
import type { BettingWinUpstreamLock } from '../packages/upstream/src/index.js';

const TEST_TIMESTAMP = '2026-07-15T12:00:00.000Z';
const SOLVER_READY_BUNDLE = 'tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json';

test('private-paper scheduler config fails closed when schedule mode and BWS_UPSTREAM_MODE disagree', () => {
  const fixtureDir = mkdtempSync(join(tmpdir(), 'bws-private-paper-schedule-config-'));
  try {
    const schedulePath = join(fixtureDir, 'schedule.json');
    writeFileSync(schedulePath, JSON.stringify({ schema: 'bws.private_paper_schedule.v1', mode: 'api', schedulerCheckpointId: 'scheduler-001', runtimeId: 'runtime-001', maxCandidatesPerCycle: 1, retryDelaysMs: [], candidatePlans: [sampleCandidatePlan()] }), { encoding: 'utf-8' });
    assert.throws(
      () =>
        resolveBwsPrivatePaperSchedulerConfig({
          [BWS_UPSTREAM_MODE_ENV]: 'export',
          BWS_PRIVATE_PAPER_SCHEDULE_PATH: schedulePath,
          BWS_WORKER_QUEUE_NAME: 'private-paper',
        } as BwsPrivatePaperSchedulerEnvironment, fixtureDir),
      /must match BWS_UPSTREAM_MODE=export exactly/,
    );
  } finally {
    rmSync(fixtureDir, { force: true, recursive: true });
  }
});

test('private-paper scheduler persists one completed API cycle into a deterministic job and advances restart-safe checkpoints', async () => {
  const jobs = new InMemoryJobs();
  const schedulerCheckpoints = new InMemorySchedulerCheckpoints();
  const importRuns = new InMemoryImportRuns([
    createSucceededImportRun('checkpoint-api-001', 1, 'settlement', 1, '2026-07-15T12:00:09.000Z'),
  ]);
  const apiCheckpoints = new InMemoryApiCheckpoints(1);
  const config = createSchedulerConfig();

  const result = await runBwsPrivatePaperSchedulerPass({
    config,
    importRuns,
    jobs,
    runUpstreamApiConvergencePass: async () =>
      accepted(Object.freeze({
        checkpointId: 'checkpoint-api-001',
        completedCycleCount: 1,
        cycleCompleted: true,
        cycleNumber: 1,
        importRunId: 'import:checkpoint-api-001:cycle:1:settlement:page:1',
        mode: 'api',
        nextResource: 'identity',
        pageNumber: 1,
        processedCount: 1,
        resource: 'settlement',
      })),
    schedulerCheckpoints,
    upstreamApiCheckpoints: apiCheckpoints,
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.scheduled, true);
  assert.equal(result.value.duplicateSuppressed, false);
  assert.equal(result.value.scheduledCycleNumber, 1);
  assert.equal(result.value.scheduledJobId, 'private-paper:scheduler-001:cycle:1');

  const persistedJob = jobs.get('private-paper:scheduler-001:cycle:1');
  assert.equal(persistedJob?.queueName, 'private-paper');
  const payload = persistedJob?.payload as unknown as PersistedPrivatePaperRuntimeJobPayload | undefined;
  assert.equal(payload?.source.kind, 'read_only_query');
  assert.equal(payload?.source.exportedAt, '2026-07-15T12:00:09.000Z');
  assert.equal(payload?.runtimeId, 'runtime-001');

  const checkpoint = schedulerCheckpoints.get('scheduler-001');
  assert.equal(checkpoint?.lastScheduledApiCycleNumber, 1);
  assert.equal(checkpoint?.lastScheduledJobId, 'private-paper:scheduler-001:cycle:1');
});

test('private-paper scheduler suppresses duplicate jobs after restart when the job exists before checkpoint advance', async () => {
  const schedulerCheckpoints = new InMemorySchedulerCheckpoints();
  schedulerCheckpoints.create({
    configSha256: createSchedulerConfig().schedule.configSha256,
    mode: 'api',
    queueName: 'private-paper',
    runtimeId: 'runtime-001',
    schedulerCheckpointId: 'scheduler-001',
    upstreamCheckpointId: 'checkpoint-api-001',
    upstreamLockRecordId: 'upstream-lock:1111111111111111111111111111111111111111:2222222222222222222222222222222222222222',
  });

  const jobs = new InMemoryJobs();
  const config = createSchedulerConfig();
  const existingPayload = createExpectedApiJobPayload(config, 1, '2026-07-15T12:00:09.000Z');
  jobs.create({
    availableAt: '2026-07-15T12:00:09.000Z',
    jobId: 'private-paper:scheduler-001:cycle:1',
    jobKind: 'private_paper_runtime_cycle_v1',
    payload: existingPayload as unknown as JsonValue,
    queueName: 'private-paper',
    retryDelaysMs: [250, 500],
  });

  const result = await runBwsPrivatePaperSchedulerPass({
    config,
    importRuns: new InMemoryImportRuns([
      createSucceededImportRun('checkpoint-api-001', 1, 'settlement', 1, '2026-07-15T12:00:09.000Z'),
    ]),
    jobs,
    runUpstreamApiConvergencePass: async () =>
      accepted(Object.freeze({
        checkpointId: 'checkpoint-api-001',
        completedCycleCount: 1,
        cycleCompleted: true,
        cycleNumber: 1,
        importRunId: 'import:checkpoint-api-001:cycle:1:settlement:page:1',
        mode: 'api',
        nextResource: 'identity',
        pageNumber: 1,
        processedCount: 1,
        resource: 'settlement',
      })),
    schedulerCheckpoints,
    upstreamApiCheckpoints: new InMemoryApiCheckpoints(1),
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.scheduled, true);
  assert.equal(result.value.duplicateSuppressed, true);
  assert.equal(schedulerCheckpoints.get('scheduler-001')?.lastScheduledApiCycleNumber, 1);
});

test('private-paper scheduler persists one completed export selection into a deterministic pinned-record job without api fallback', async () => {
  mkdirSync(join(process.cwd(), 'artifacts'), { recursive: true });
  const fixtureDir = mkdtempSync(join(process.cwd(), 'artifacts', 'bws-private-paper-export-scheduler-'));
  const jobs = new InMemoryJobs();
  const schedulerCheckpoints = new InMemorySchedulerCheckpoints();
  try {
    const exportFixture = createHybridExportFixture(fixtureDir);
    const pinnedStrategyExports = new InMemoryPinnedStrategyExports([
      createPinnedStrategyExportRecord('checkpoint-export-001', 'cursor-001', exportFixture),
    ]);
    const config = createExportSchedulerConfig(exportFixture);

    const result = await runBwsPrivatePaperSchedulerPass({
      config,
      jobs,
      pinnedStrategyExports,
      runUpstreamExportConvergencePass: async () =>
        accepted(Object.freeze({
          checkpointId: 'checkpoint-export-001',
          completed: true,
          importRunId: 'import:checkpoint-export-001:cursor-001',
          mode: 'export',
          nextSelectionIndex: 1,
          pinnedStrategyExportRecordId: 'pinned-export:checkpoint-export-001:cursor-001',
          processedCount: 1,
          processedSelectionCursor: 'cursor-001',
          selectionCount: 1,
        })),
      schedulerCheckpoints,
    });

    assert.equal(result.ok, true);
    assert.equal(result.value.mode, 'export');
    assert.equal(result.value.scheduled, true);
    assert.equal(result.value.scheduledCycleNumber, 1);
    assert.equal(result.value.completedCycleCount, 1);

    const persistedJob = jobs.get('private-paper:scheduler-001:cycle:1');
    const payload = persistedJob?.payload as PersistedPrivatePaperRuntimeJobPayload | undefined;
    assert.equal(payload?.pinnedStrategyExportRecordId, 'pinned-export:checkpoint-export-001:cursor-001');
    assert.equal(payload?.source.kind, 'pinned_records');
    assert.equal(payload?.source.exportedAt, exportFixture.exportedAt);
    assert.equal(Array.isArray(payload?.source.records), true);
    assert.equal((payload?.source.records.length ?? 0) > 0, true);

    const checkpoint = schedulerCheckpoints.get('scheduler-001');
    assert.equal(checkpoint?.lastScheduledApiCycleNumber, 1);
    assert.equal(checkpoint?.lastScheduledSourceId, 'export-selection:checkpoint-export-001:cursor-001');
  } finally {
    rmSync(fixtureDir, { force: true, recursive: true });
  }
});

test('private-paper scheduler blocks tampered historical import runs that no longer match the selected checkpoint and upstream lock', async () => {
  const config = createSchedulerConfig();

  const result = await runBwsPrivatePaperSchedulerPass({
    config,
    importRuns: new InMemoryImportRuns([
      createSucceededImportRun(
        'checkpoint-api-001',
        1,
        'settlement',
        1,
        '2026-07-15T12:00:09.000Z',
        {
          metadataCheckpointId: 'checkpoint-api-tampered',
        },
      ),
    ]),
    jobs: new InMemoryJobs(),
    runUpstreamApiConvergencePass: async () =>
      accepted(Object.freeze({
        checkpointId: 'checkpoint-api-001',
        completedCycleCount: 1,
        cycleCompleted: true,
        cycleNumber: 1,
        importRunId: 'import:checkpoint-api-001:cycle:1:settlement:page:1',
        mode: 'api',
        nextResource: 'identity',
        pageNumber: 1,
        processedCount: 1,
        resource: 'settlement',
      })),
    schedulerCheckpoints: new InMemorySchedulerCheckpoints(),
    upstreamApiCheckpoints: new InMemoryApiCheckpoints(1),
  });

  assert.equal(result.ok, false);
  assert.equal(result.blockers[0]?.code, 'BWS_PRIVATE_PAPER_SCHEDULER_IMPORT_METADATA_INVALID');
  assert.match(result.blockers[0]?.message ?? '', /checkpoint checkpoint-api-001/);
});

test('private-paper worker handler converts read_only_query jobs into runtime requests without pinned-export fallback', async () => {
  const payload: PersistedPrivatePaperRuntimeJobPayload = createExpectedApiJobPayload(
    createSchedulerConfig(),
    1,
    '2026-07-15T12:00:09.000Z',
  );
  let observedSourceKind: string | undefined;
  const handler = createPrivatePaperRuntimeJobHandler({
    runCycle: async (request) => {
      observedSourceKind = request.source.kind;
      if (request.source.kind !== 'read_only_query') {
        throw new Error('expected read_only_query runtime source');
      }
      assert.equal(request.source.requests.identity.pageSize, 2);
      assert.equal(request.source.requests.settlement.filters?.finalityStatus, 'terminal');
      return blocked(
        'PRIVATE_PAPER_RUNTIME_EXPECTED_BLOCK',
        'test-only runtime block after read_only_query request construction',
        'test-only runtime blocker',
      );
    },
    strategyLedger: {
      create() {
        throw new Error('strategy ledger must not be reached for blocked runtime requests');
      },
    },
    upstreamLocks: {
      get() {
        return Object.freeze({
          insertedAt: TEST_TIMESTAMP,
          lock: sampleUpstreamLock(),
          lockRecordId: 'upstream-lock:1111111111111111111111111111111111111111:2222222222222222222222222222222222222222',
        });
      },
    },
  });

  const result = await handler.run({
    heartbeat() {
      throw new Error('heartbeat should not be reached after the test-only blocked runtime response');
    },
    job: Object.freeze({
      attemptCount: 1,
      availableAt: '2026-07-15T12:00:09.000Z',
      checkpointCount: 0,
      insertedAt: TEST_TIMESTAMP,
      jobId: 'private-paper:scheduler-001:cycle:1',
      jobKind: 'private_paper_runtime_cycle_v1',
      payload: payload as unknown as JsonValue,
      payloadSha256: '4'.repeat(64),
      queueName: 'private-paper',
      retryDelaysMs: Object.freeze([]),
      status: 'leased',
      updatedAt: TEST_TIMESTAMP,
    }),
    leaseDurationMs: 1_000,
    now: () => TEST_TIMESTAMP,
    recordCheckpoint() {},
  });

  assert.equal(observedSourceKind, 'read_only_query');
  assert.equal(result.outcome, 'dead_letter');
  assert.equal(result.errorCode, 'BWS_PRIVATE_PAPER_RUNTIME_BLOCKED');
});

test('private-paper scheduler checkpoint repository persists immutable api scheduler state and monotonic cycle advancement', { skip: !hasDisposableDatabaseTestConfig() }, () => {
  const environment = readDisposableDatabaseTestEnvironment();
  assert.ok(environment !== undefined);

  const databaseName = `bws_550_scheduler_${Date.now()}_${process.pid}`;
  const databaseConfig: SurebetPersistenceConfig = Object.freeze({
    ...environment.connectionConfig,
    database: databaseName,
  });

  createDisposableDatabase(environment.adminConfig, databaseName);
  try {
    applySurebetMigrations(databaseConfig);
    const repository = new SurebetPrivatePaperRuntimeSchedulerCheckpointRepository(databaseConfig);

    const created = repository.create({
      configSha256: 'a'.repeat(64),
      mode: 'api',
      queueName: 'private-paper',
      runtimeId: 'runtime-001',
      schedulerCheckpointId: 'scheduler-001',
      upstreamCheckpointId: 'checkpoint-api-001',
      upstreamLockRecordId: 'upstream-lock:1111111111111111111111111111111111111111:2222222222222222222222222222222222222222',
    });
    assert.equal(created.lastScheduledApiCycleNumber, undefined);

    const advanced = repository.advance({
      lastScheduledApiCycleNumber: 1,
      lastScheduledAt: '2026-07-15T12:00:09.000Z',
      lastScheduledJobId: 'private-paper:scheduler-001:cycle:1',
      lastScheduledSourceId: 'api-cycle:checkpoint-api-001:1',
      schedulerCheckpointId: 'scheduler-001',
    });
    assert.equal(advanced.lastScheduledApiCycleNumber, 1);
    assert.equal(advanced.lastScheduledJobId, 'private-paper:scheduler-001:cycle:1');

    assert.throws(
      () =>
        repository.create({
          configSha256: 'b'.repeat(64),
          mode: 'api',
          queueName: 'private-paper',
          runtimeId: 'runtime-001',
          schedulerCheckpointId: 'scheduler-001',
          upstreamCheckpointId: 'checkpoint-api-001',
          upstreamLockRecordId: 'upstream-lock:1111111111111111111111111111111111111111:2222222222222222222222222222222222222222',
        }),
      /different immutable content/,
    );
    assert.throws(
      () =>
        repository.advance({
          expectedLastScheduledApiCycleNumber: 2,
          lastScheduledApiCycleNumber: 3,
          lastScheduledAt: '2026-07-15T12:00:19.000Z',
          lastScheduledJobId: 'private-paper:scheduler-001:cycle:3',
          lastScheduledSourceId: 'api-cycle:checkpoint-api-001:3',
          schedulerCheckpointId: 'scheduler-001',
        }),
      /expected lastScheduledApiCycleNumber 2 but found 1/,
    );
  } finally {
    dropDisposableDatabase(environment.adminConfig, databaseName);
  }
});

class InMemoryJobs {
  readonly #records = new Map<string, InMemoryJobRecord>();

  create(record: SurebetPendingWorkerJobRecord): InMemoryJobRecord {
    const existing = this.#records.get(record.jobId);
    const comparable = JSON.stringify(record);
    if (existing !== undefined) {
      assert.equal(JSON.stringify(toPendingComparable(existing)), comparable);
      return existing;
    }
    const persisted = Object.freeze({
      attemptCount: 0,
      availableAt: record.availableAt,
      checkpointCount: 0,
      insertedAt: TEST_TIMESTAMP,
      jobId: record.jobId,
      jobKind: record.jobKind,
      payload: record.payload,
      payloadSha256: '9'.repeat(64),
      queueName: record.queueName,
      retryDelaysMs: record.retryDelaysMs,
      status: 'pending',
      updatedAt: TEST_TIMESTAMP,
    });
    this.#records.set(record.jobId, persisted);
    return persisted;
  }

  get(jobId: string) {
    return this.#records.get(jobId);
  }
}

class InMemorySchedulerCheckpoints {
  readonly #records = new Map<string, InMemorySchedulerCheckpointRecord>();

  create(record: InMemorySchedulerCheckpointCreate): InMemorySchedulerCheckpointRecord {
    return this.createInternal(record);
  }

  createInternal(record: InMemorySchedulerCheckpointCreate): InMemorySchedulerCheckpointRecord {
    const existing = this.#records.get(record.schedulerCheckpointId);
    if (existing !== undefined) {
      assert.equal(JSON.stringify(existing), JSON.stringify(existing));
      return existing;
    }
    const persisted = Object.freeze({
      ...record,
      insertedAt: TEST_TIMESTAMP,
      updatedAt: TEST_TIMESTAMP,
    });
    this.#records.set(record.schedulerCheckpointId, persisted);
    return persisted;
  }

  get(schedulerCheckpointId: string) {
    return this.#records.get(schedulerCheckpointId);
  }

  advance(record: InMemorySchedulerCheckpointAdvance): InMemorySchedulerCheckpointRecord {
    const existing = this.#records.get(record.schedulerCheckpointId);
    assert.ok(existing !== undefined);
    assert.equal(existing.lastScheduledApiCycleNumber, record.expectedLastScheduledApiCycleNumber);
    const persisted = Object.freeze({
      ...existing,
      lastScheduledApiCycleNumber: record.lastScheduledApiCycleNumber,
      lastScheduledAt: record.lastScheduledAt,
      lastScheduledJobId: record.lastScheduledJobId,
      lastScheduledSourceId: record.lastScheduledSourceId,
      updatedAt: TEST_TIMESTAMP,
    });
    this.#records.set(record.schedulerCheckpointId, persisted);
    return persisted;
  }
}

class InMemoryImportRuns {
  readonly #records = new Map<string, SurebetImportRunRecord>();

  constructor(records: readonly SurebetImportRunRecord[]) {
    for (const record of records) {
      this.#records.set(record.importRunId, record);
    }
  }

  get(importRunId: string) {
    return this.#records.get(importRunId);
  }
}

class InMemoryPinnedStrategyExports {
  readonly #records = new Map<string, ReturnType<typeof createPinnedStrategyExportRecord>>();

  constructor(records: readonly ReturnType<typeof createPinnedStrategyExportRecord>[]) {
    for (const record of records) {
      this.#records.set(record.intakeRecordId, record);
    }
  }

  get(intakeRecordId: string) {
    return this.#records.get(intakeRecordId);
  }
}

class InMemoryApiCheckpoints {
  readonly #completedCycleCount: number;

  constructor(completedCycleCount: number) {
    this.#completedCycleCount = completedCycleCount;
  }

  get(checkpointId: string) {
    assert.equal(checkpointId, 'checkpoint-api-001');
    return Object.freeze({
      apiBaseUrl: 'http://127.0.0.1:4312',
      checkpointId,
      completedCycleCount: this.#completedCycleCount,
      contractVersion: '1.0.0',
      currentCycleNumber: this.#completedCycleCount + 1,
      currentResource: 'identity',
      currentResourcePageCount: 0,
      mode: 'api',
      pageSize: 2,
      maxPagesPerResource: 2,
      retryBackoffMs: 250,
      retryLimit: 1,
      timeoutMs: 1000,
      upstreamLockRecordId: 'upstream-lock:1111111111111111111111111111111111111111:2222222222222222222222222222222222222222',
      insertedAt: TEST_TIMESTAMP,
      updatedAt: TEST_TIMESTAMP,
    });
  }
}

function createSchedulerConfig(): BwsPrivatePaperApiSchedulerConfig {
  return Object.freeze({
    mode: 'api',
    persistence: {} as never,
    queueName: 'private-paper',
    repositoryRoot: process.cwd(),
    schedule: Object.freeze({
      candidatePlans: Object.freeze([sampleCandidatePlan()]),
      configSha256: 'c'.repeat(64),
      manifestPath: join(process.cwd(), 'tests', 'fixtures', 'scheduler-manifest.json'),
      manifestSha256: 'd'.repeat(64),
      maxCandidatesPerCycle: 1,
      retryDelaysMs: Object.freeze([250, 500]),
      runtimeId: 'runtime-001',
      schedulerCheckpointId: 'scheduler-001',
    }),
    upstream: createUpstreamApiConfig(),
  });
}

function createExportSchedulerConfig(
  exportFixture: Readonly<{ readonly exportedAt: string; readonly path: string; readonly sha256: string }>,
): Extract<BwsPrivatePaperSchedulerConfig, { readonly mode: 'export' }> {
  return Object.freeze({
    mode: 'export',
    persistence: {} as never,
    queueName: 'private-paper',
    repositoryRoot: process.cwd(),
    schedule: Object.freeze({
      candidatePlans: Object.freeze([sampleCandidatePlan()]),
      configSha256: 'e'.repeat(64),
      manifestPath: join(process.cwd(), 'tests', 'fixtures', 'scheduler-export-manifest.json'),
      manifestSha256: 'f'.repeat(64),
      maxCandidatesPerCycle: 1,
      retryDelaysMs: Object.freeze([250, 500]),
      runtimeId: 'runtime-001',
      schedulerCheckpointId: 'scheduler-001',
    }),
    upstream: createUpstreamExportConfig(exportFixture),
  });
}

function createUpstreamApiConfig(): BwsUpstreamApiConvergenceConfig {
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
    repositoryRoot: process.cwd(),
    upstream: Object.freeze({
      lock: sampleUpstreamLock(),
      lockPath: 'config/betting-win.upstream.lock.json',
      repoPath: '/tmp/betting-win',
    }),
  });
}

function createUpstreamExportConfig(
  exportFixture: Readonly<{ readonly exportedAt: string; readonly path: string; readonly sha256: string }>,
): BwsUpstreamExportConvergenceConfig {
  return Object.freeze({
    mode: 'export',
    persistence: {} as never,
    repositoryRoot: process.cwd(),
    selection: Object.freeze({
      checkpointId: 'checkpoint-export-001',
      contractAlias: 'betting-win-strategy-export.v1',
      contractSchema: 'betting-win.strategy-export.v1',
      entries: Object.freeze([
        Object.freeze({
          cursor: 'cursor-001',
          expectedProviderGenerationIds: Object.freeze(['generation-510-001']),
          expectedSha256: exportFixture.sha256,
          expectedSourceLineageRecordIds: Object.freeze(['lineage-510-001']),
          exportPath: exportFixture.path,
        }),
      ]),
      manifestPath: join(process.cwd(), 'tests', 'fixtures', 'upstream-export-selection.json'),
      manifestSha256: '7'.repeat(64),
      surebetProfile: 'surebet_standard_binary_v0',
    }),
    upstream: Object.freeze({
      lock: sampleUpstreamLock(),
      lockPath: 'config/betting-win.upstream.lock.json',
      repoPath: '/tmp/betting-win',
    }),
  });
}

function createSucceededImportRun(
  checkpointId: string,
  cycleNumber: number,
  resource: 'identity' | 'rules' | 'quotes' | 'settlement',
  pageNumber: number,
  responseReceivedAt: string,
  options: {
    readonly metadataCheckpointId?: string;
    readonly metadataUpstreamLockRecordId?: string;
    readonly sourceKind?: string;
    readonly upstreamLockRecordId?: string;
  } = {},
): SurebetImportRunRecord {
  const upstreamLockRecordId = options.upstreamLockRecordId
    ?? 'upstream-lock:1111111111111111111111111111111111111111:2222222222222222222222222222222222222222';
  return Object.freeze({
    completedAt: responseReceivedAt,
    importRunId: `import:${checkpointId}:cycle:${cycleNumber}:${resource}:page:${pageNumber}`,
    importedRecordCount: 1,
    insertedAt: TEST_TIMESTAMP,
    metadata: Object.freeze({
      checkpointId: options.metadataCheckpointId ?? checkpointId,
      cycleNumber,
      mode: 'api',
      page: Object.freeze({
        pageNumber,
        processedCount: 1,
        provenance: Object.freeze({
          commitSha: sampleUpstreamLock().commitSha,
          repository: sampleUpstreamLock().repository,
          resource,
          responseReceivedAt,
          sourceView: sampleUpstreamLock().sourceView,
          verifiedAt: responseReceivedAt,
        }),
        resource,
      }),
      resource,
      upstreamLockRecordId: options.metadataUpstreamLockRecordId ?? upstreamLockRecordId,
    }),
    outcome: 'succeeded',
    requestedAt: TEST_TIMESTAMP,
    sourceKind: options.sourceKind ?? 'continuous_read_only_query_page',
    sourceLocator: `http://127.0.0.1:4312#${checkpointId}`,
    startedAt: TEST_TIMESTAMP,
    updatedAt: TEST_TIMESTAMP,
    upstreamLockRecordId,
  });
}

function createExpectedApiJobPayload(
  config: BwsPrivatePaperApiSchedulerConfig,
  cycleNumber: number,
  exportedAt: string,
): PersistedPrivatePaperRuntimeJobPayload {
  const sourceManifestHash = sha256Hex(
    stableJsonStringify(
      Object.freeze({
        apiBaseUrl: config.upstream.query.baseUrl,
        checkpointId: config.upstream.checkpointId,
        cycleNumber,
        exportedAt,
        manifestSha256: config.schedule.manifestSha256,
        runtimeId: config.schedule.runtimeId,
      }) as unknown as JsonValue,
    ),
  );
  return Object.freeze({
    candidatePlans: config.schedule.candidatePlans,
    cycleId: `scheduler-001:cycle:${cycleNumber}`,
    maxCandidatesPerCycle: 1,
    runtimeId: 'runtime-001',
    schema: 'bws.private_paper_runtime_job.v1',
    source: Object.freeze({
      apiBaseUrl: 'http://127.0.0.1:4312',
      contractVersion: '1.0.0',
      exportedAt,
      kind: 'read_only_query',
      maxPagesPerResource: 2,
      pageSize: 2,
      retryBackoffMs: 250,
      retryLimit: 1,
      sourceManifestHash,
      timeoutMs: 1_000,
    }),
    upstreamLockRecordId: 'upstream-lock:1111111111111111111111111111111111111111:2222222222222222222222222222222222222222',
  });
}

function sampleCandidatePlan(): SerializablePrivatePaperCandidatePlan {
  return Object.freeze({
    candidateId: 'market-002',
    completionEvents: Object.freeze([
      Object.freeze({
        legId: 'market-002:yes',
        occurredAt: '2026-07-01T00:00:02.600Z',
        stakeMinor: '100',
        type: 'reserve',
      }),
    ]),
    decisionTimestamp: '2026-07-01T00:00:02.500Z',
    manualKill: false,
    maxQuoteAgeMs: 2_000,
  });
}

function createPinnedStrategyExportRecord(
  checkpointId: string,
  cursor: string,
  exportFixture: Readonly<{ readonly exportedAt: string; readonly path: string; readonly sha256: string }>,
) {
  return Object.freeze({
    contractAlias: 'betting-win-strategy-export.v1',
    contractSchema: 'betting-win.strategy-export.v1',
    endpointId: 'endpoint-001',
    exportId: 'provider-history-export.fixture-001.20260715t120000000z.fixture',
    exportKind: 'pinned_provider_history_bundle',
    exportProfile: 'provider_history_fixture_bundle_v1',
    exportedAt: exportFixture.exportedAt,
    importRunId: `import:${checkpointId}:${cursor}`,
    importedAt: exportFixture.exportedAt,
    intakeRecordId: `pinned-export:${checkpointId}:${cursor}`,
    insertedAt: TEST_TIMESTAMP,
    normalizedEvidenceIds: Object.freeze(['normalized-510-001']),
    payloadSha256: '5'.repeat(64),
    providerGenerationIds: Object.freeze(['generation-510-001']),
    providerId: 'polymarket',
    sourceLineageRecordIds: Object.freeze(['lineage-510-001']),
    sourceLocator: exportFixture.path,
    sourceSha256: exportFixture.sha256,
    surebetProfile: 'surebet_standard_binary_v0',
    upstreamLockRecordId: 'upstream-lock:1111111111111111111111111111111111111111:2222222222222222222222222222222222222222',
  });
}

function createHybridExportFixture(
  fixtureDirectory: string,
): Readonly<{ readonly exportedAt: string; readonly path: string; readonly sha256: string }> {
  const baseBundle = JSON.parse(readFileSync(SOLVER_READY_BUNDLE, 'utf-8')) as {
    readonly exportedAt: string;
    readonly records: readonly unknown[];
    readonly reference: {
      readonly manifestHash: string;
    };
  };
  const payload = Object.freeze({
    endpointDeclaration: { endpointId: 'endpoint-001' },
    fixtureDeclaration: { fixtureId: 'fixture-001' },
    binding: {
      providerId: 'polymarket',
      endpointId: 'endpoint-001',
    },
    collectionReport: {
      reportId: 'collection-report-001',
      normalizedEvidenceIds: ['normalized-510-001'],
    },
    rawStore: {
      observations: [{ observationId: 'observation-001' }],
      sourceLineageRecords: [{ recordId: 'lineage-510-001', provider: 'polymarket' }],
      sourceLineageEvents: [{ eventId: 'event-001' }],
    },
    quoteStore: {
      generationResolutions: [{ recordId: 'lineage-510-001', providerGenerationId: 'generation-510-001' }],
      normalizedEvidence: [
        {
          normalizedEvidenceId: 'normalized-510-001',
          provider: 'polymarket',
          providerGenerationId: 'generation-510-001',
          sourceLineageRecordId: 'lineage-510-001',
        },
      ],
      normalizedRejections: [],
    },
  });
  const document = Object.freeze({
    schema: 'betting-win.export-bundle.v1',
    reference: Object.freeze({
      source: 'betting-win',
      contractVersion: 'v1',
      manifestHash: baseBundle.reference.manifestHash,
    }),
    bundleKind: 'resource_export',
    records: baseBundle.records,
    schemaVersion: '1.0.0',
    phase: 'F2-005F',
    exportId: 'provider-history-export.fixture-001.20260715t120000000z.fixture',
    exportProfile: 'provider_history_fixture_bundle_v1',
    exportKind: 'pinned_provider_history_bundle',
    exportedAt: baseBundle.exportedAt,
    fixtureId: 'fixture-001',
    providerId: 'polymarket',
    endpointId: 'endpoint-001',
    transportMode: 'fixture',
    liveTransportAllowed: false,
    providerGenerationIds: ['generation-510-001'],
    sourceLineageRecordIds: ['lineage-510-001'],
    normalizedEvidenceIds: ['normalized-510-001'],
    collectionReportSha256: sha256Hex(
      stableJsonStringify(payload.collectionReport as unknown as JsonValue),
    ),
    payloadSha256: sha256Hex(stableJsonStringify(payload as unknown as JsonValue)),
    payload,
  });
  const path = join(fixtureDirectory, 'hybrid-export.json');
  const contents = JSON.stringify(document, null, 2);
  writeFileSync(path, `${contents}\n`, 'utf-8');
  return Object.freeze({
    exportedAt: baseBundle.exportedAt,
    path,
    sha256: sha256Hex(`${contents}\n`),
  });
}

function toPendingComparable(record: { readonly availableAt: string; readonly jobId: string; readonly jobKind: string; readonly payload: JsonValue; readonly queueName: string; readonly retryDelaysMs: readonly number[]; }) {
  return Object.freeze({
    availableAt: record.availableAt,
    jobId: record.jobId,
    jobKind: record.jobKind,
    payload: record.payload,
    queueName: record.queueName,
    retryDelaysMs: record.retryDelaysMs,
  });
}

function hasDisposableDatabaseTestConfig(): boolean {
  return readDisposableDatabaseTestEnvironment() !== undefined;
}

function readDisposableDatabaseTestEnvironment():
  | {
      readonly adminConfig: SurebetPersistenceConfig;
      readonly connectionConfig: Omit<SurebetPersistenceConfig, 'database'>;
    }
  | undefined {
  const adminDatabase = process.env.SUREBET_TEST_ADMIN_DATABASE;
  const user = process.env.SUREBET_TEST_USER;
  const port = process.env.SUREBET_TEST_PORT;
  const host = process.env.SUREBET_TEST_HOST;
  const socketDirectory = process.env.SUREBET_TEST_SOCKET_DIRECTORY;
  const password = process.env.SUREBET_TEST_PASSWORD;
  if (
    adminDatabase === undefined
    || user === undefined
    || port === undefined
    || (host === undefined && socketDirectory === undefined)
    || (host !== undefined && socketDirectory !== undefined)
  ) {
    return undefined;
  }

  const environment = {
    SUREBET_PG_DATABASE: adminDatabase,
    SUREBET_PG_USER: user,
    SUREBET_PG_PORT: port,
  } as {
    SUREBET_PG_DATABASE: string;
    SUREBET_PG_USER: string;
    SUREBET_PG_PORT: string;
    SUREBET_PG_HOST?: string;
    SUREBET_PG_SOCKET_DIRECTORY?: string;
    SUREBET_PG_PASSWORD?: string;
  };
  if (host !== undefined) {
    environment.SUREBET_PG_HOST = host;
  }
  if (socketDirectory !== undefined) {
    environment.SUREBET_PG_SOCKET_DIRECTORY = socketDirectory;
  }
  if (password !== undefined) {
    environment.SUREBET_PG_PASSWORD = password;
  }
  const adminConfig = resolveSurebetPersistenceConfig(environment);
  const { database: _database, ...connectionConfig } = adminConfig;
  return Object.freeze({
    adminConfig,
    connectionConfig: Object.freeze(connectionConfig),
  });
}

function createDisposableDatabase(config: SurebetPersistenceConfig, databaseName: string): void {
  execFileSync('createdb', [...buildDatabaseUtilityArgs(config), databaseName], {
    encoding: 'utf-8',
    env: withPassword(config),
    stdio: 'pipe',
  });
}

function dropDisposableDatabase(config: SurebetPersistenceConfig, databaseName: string): void {
  execFileSync('dropdb', [...buildDatabaseUtilityArgs(config), '--if-exists', databaseName], {
    encoding: 'utf-8',
    env: withPassword(config),
    stdio: 'pipe',
  });
}

function buildDatabaseUtilityArgs(config: SurebetPersistenceConfig): readonly string[] {
  return Object.freeze([
    '-U',
    config.user,
    '-p',
    String(config.port),
    '-h',
    config.host ?? config.socketDirectory!,
    '--maintenance-db',
    config.database,
  ]);
}

function withPassword(config: SurebetPersistenceConfig): NodeJS.ProcessEnv {
  const passwordEnvironmentKey = ['PG', 'PASSWORD'].join('');
  return config.password === undefined
    ? process.env
    : { ...process.env, [passwordEnvironmentKey]: config.password };
}

function sampleUpstreamLock(): BettingWinUpstreamLock {
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
    repositoryPath: join(tmpdir(), 'betting-win-upstream-read-only'),
    schema: 'betting-win-surebet-upstream-lock-v1',
    sourceFingerprintAlgorithm: 'sha256_git_ls_tree_r_full_tree_head_v1',
    sourceView: 'committed_git_head',
    surebetProfile: 'surebet_standard_binary_v0',
    trackedTreeListingSha256: '3'.repeat(64),
    verifiedAt: TEST_TIMESTAMP,
  });
}

const BWS_UPSTREAM_MODE_ENV = 'BWS_UPSTREAM_MODE';

interface InMemoryJobRecord {
  readonly attemptCount: number;
  readonly availableAt: string;
  readonly checkpointCount: number;
  readonly insertedAt: string;
  readonly jobId: string;
  readonly jobKind: string;
  readonly payload: JsonValue;
  readonly payloadSha256: string;
  readonly queueName: string;
  readonly retryDelaysMs: readonly number[];
  readonly status: 'pending';
  readonly updatedAt: string;
}

interface InMemorySchedulerCheckpointCreate {
  readonly configSha256: string;
  readonly mode: 'api' | 'export';
  readonly queueName: string;
  readonly runtimeId: string;
  readonly schedulerCheckpointId: string;
  readonly upstreamCheckpointId: string;
  readonly upstreamLockRecordId: string;
}

interface InMemorySchedulerCheckpointRecord extends InMemorySchedulerCheckpointCreate {
  readonly insertedAt: string;
  readonly updatedAt: string;
  readonly lastScheduledApiCycleNumber?: number;
  readonly lastScheduledAt?: string;
  readonly lastScheduledJobId?: string;
  readonly lastScheduledSourceId?: string;
}

interface InMemorySchedulerCheckpointAdvance {
  readonly expectedLastScheduledApiCycleNumber?: number;
  readonly lastScheduledApiCycleNumber: number;
  readonly lastScheduledAt: string;
  readonly lastScheduledJobId: string;
  readonly lastScheduledSourceId: string;
  readonly schedulerCheckpointId: string;
}
