import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  SurebetImportRunRepository,
  SurebetPinnedStrategyExportRepository,
  SurebetStrategyLedgerRepository,
  SurebetUpstreamLockRepository,
  SurebetWorkerJobRepository,
  applySurebetMigrations,
  resolveSurebetPersistenceConfig,
  type SurebetPersistenceConfig,
} from '../packages/persistence/src/index.js';
import { validatePinnedBettingWinBundleIntake } from '../src/adapters/betting-win-pinned-bundle-intake.js';
import { runBoundedWorkerPass } from '../src/workers/bounded-job-worker.js';
import {
  createPrivatePaperRuntimeJobHandler,
  type PersistedPrivatePaperRuntimeJobPayload,
} from '../src/workers/private-paper-runtime-jobs.js';
import type { BettingWinResourceRecord } from '../src/contracts/betting-win-resource-records.js';
import type { BettingWinUpstreamLock } from '../packages/upstream/src/upstream/betting-win-upstream-lock.js';
import type { JsonValue } from '../packages/persistence/src/types.js';

const REPO_ROOT = process.cwd();
const TEST_TIMESTAMP = '2026-07-14T10:00:00.000Z';
const SOLVER_READY_BUNDLE = 'tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json';

test('worker job repository enforces bounded leases, immutable checkpoints, retries, and dead letters', { skip: !hasDisposableDatabaseTestConfig() }, () => {
  const testEnvironment = readDisposableDatabaseTestEnvironment();
  assert.ok(testEnvironment !== undefined);

  const databaseName = `bws_410_repo_${Date.now()}_${process.pid}`;
  const adminConfig = testEnvironment.adminConfig;
  const databaseConfig: SurebetPersistenceConfig = Object.freeze({
    ...testEnvironment.connectionConfig,
    database: databaseName,
  });

  createDisposableDatabase(adminConfig, databaseName);
  try {
    applySurebetMigrations(databaseConfig);
    const jobs = new SurebetWorkerJobRepository(databaseConfig);

    const created = jobs.create({
      availableAt: TEST_TIMESTAMP,
      jobId: 'job-001',
      jobKind: 'private_paper_runtime_cycle_v1',
      payload: Object.freeze({ schema: 'test-job' }),
      queueName: 'private-paper',
      retryDelaysMs: Object.freeze([250]),
    });
    assert.equal(created.status, 'pending');

    const leased = jobs.claimNext({
      claimedAt: TEST_TIMESTAMP,
      leaseDurationMs: 1_000,
      leaseToken: 'lease-001',
      queueName: 'private-paper',
      workerId: 'worker-001',
    });
    assert.equal(leased?.status, 'leased');
    assert.equal(leased?.attemptCount, 1);

    const checkpoint = jobs.recordCheckpoint({
      checkpoint: Object.freeze({ checkpointStage: 'validated' }),
      checkpointId: 'attempt-1-validated',
      jobId: 'job-001',
      leaseToken: 'lease-001',
      recordedAt: '2026-07-14T10:00:00.200Z',
      workerId: 'worker-001',
    });
    assert.equal(checkpoint.checkpointId, 'attempt-1-validated');
    assert.equal(
      jobs.recordCheckpoint({
        checkpoint: Object.freeze({ checkpointStage: 'validated' }),
        checkpointId: 'attempt-1-validated',
        jobId: 'job-001',
        leaseToken: 'lease-001',
        recordedAt: '2026-07-14T10:00:00.200Z',
        workerId: 'worker-001',
      }).checkpointId,
      'attempt-1-validated',
    );
    assert.equal(jobs.listCheckpoints('job-001').length, 1);
    assert.throws(
      () =>
        jobs.recordCheckpoint({
          checkpoint: Object.freeze({ checkpointStage: 'ambiguous' }),
          checkpointId: 'attempt-1-ambiguous',
          jobId: 'job-001',
          leaseToken: 'lease-999',
          recordedAt: '2026-07-14T10:00:00.250Z',
          workerId: 'worker-999',
        }),
      (error: unknown) =>
        error instanceof Error
        && 'code' in error
        && error.code === 'SUREBET_WORKER_JOB_LEASE_OWNERSHIP_CONFLICT',
    );

    const heartbeated = jobs.heartbeatLease({
      heartbeatAt: '2026-07-14T10:00:00.500Z',
      jobId: 'job-001',
      leaseDurationMs: 1_500,
      leaseToken: 'lease-001',
      workerId: 'worker-001',
    });
    assert.equal(heartbeated.leaseExpiresAt, '2026-07-14T10:00:02.000Z');

    const waiting = jobs.fail({
      errorCode: 'RETRYABLE_FAILURE',
      errorDetails: Object.freeze({ attempt: 1 }),
      failedAt: '2026-07-14T10:00:00.700Z',
      jobId: 'job-001',
      leaseToken: 'lease-001',
      workerId: 'worker-001',
    });
    assert.equal(waiting.status, 'retry_wait');
    assert.equal(waiting.availableAt, '2026-07-14T10:00:00.950Z');
    assert.equal(
      jobs.claimNext({
        claimedAt: '2026-07-14T10:00:00.900Z',
        leaseDurationMs: 1_000,
        leaseToken: 'lease-too-early',
        queueName: 'private-paper',
        workerId: 'worker-001',
      }),
      undefined,
    );

    const secondLease = jobs.claimNext({
      claimedAt: '2026-07-14T10:00:00.950Z',
      leaseDurationMs: 1_000,
      leaseToken: 'lease-002',
      queueName: 'private-paper',
      workerId: 'worker-001',
    });
    assert.equal(secondLease?.attemptCount, 2);
    const deadLettered = jobs.fail({
      errorCode: 'FINAL_FAILURE',
      errorDetails: Object.freeze({ attempt: 2 }),
      failedAt: '2026-07-14T10:00:01.100Z',
      jobId: 'job-001',
      leaseToken: 'lease-002',
      workerId: 'worker-001',
    });
    assert.equal(deadLettered.status, 'dead_lettered');
    assert.equal(jobs.getDeadLetter('job-001')?.deadLetterReasonCode, 'FINAL_FAILURE');
    assert.throws(
      () =>
        jobs.heartbeatLease({
          heartbeatAt: '2026-07-14T10:00:01.200Z',
          jobId: 'job-001',
          leaseDurationMs: 1_000,
          leaseToken: 'lease-002',
          workerId: 'worker-001',
        }),
      (error: unknown) =>
        error instanceof Error
        && 'code' in error
        && error.code === 'SUREBET_WORKER_JOB_DEAD_LETTER_IMMUTABLE',
    );

    jobs.create({
      availableAt: TEST_TIMESTAMP,
      jobId: 'job-002',
      jobKind: 'private_paper_runtime_cycle_v1',
      payload: Object.freeze({ schema: 'test-job-2' }),
      queueName: 'private-paper',
      retryDelaysMs: Object.freeze([]),
    });
    jobs.claimNext({
      claimedAt: TEST_TIMESTAMP,
      leaseDurationMs: 500,
      leaseToken: 'lease-003',
      queueName: 'private-paper',
      workerId: 'worker-expired',
    });
    const reaped = jobs.reapExpiredLeases('2026-07-14T10:00:00.600Z');
    assert.equal(reaped.length, 1);
    assert.equal(reaped[0]?.jobId, 'job-002');
    assert.equal(jobs.getDeadLetter('job-002')?.deadLetterReasonCode, 'SUREBET_WORKER_JOB_LEASE_EXPIRED');

    jobs.create({
      availableAt: TEST_TIMESTAMP,
      jobId: 'job-003',
      jobKind: 'private_paper_runtime_cycle_v1',
      payload: Object.freeze({ schema: 'test-job-3' }),
      queueName: 'private-paper',
      retryDelaysMs: Object.freeze([]),
    });
    const renewableLease = jobs.claimNext({
      claimedAt: TEST_TIMESTAMP,
      leaseDurationMs: 500,
      leaseToken: 'lease-004',
      queueName: 'private-paper',
      workerId: 'worker-renewed',
    });
    assert.equal(renewableLease?.leaseExpiresAt, '2026-07-14T10:00:00.500Z');
    jobs.heartbeatLease({
      heartbeatAt: '2026-07-14T10:00:00.300Z',
      jobId: 'job-003',
      leaseDurationMs: 1_500,
      leaseToken: 'lease-004',
      workerId: 'worker-renewed',
    });
    assert.equal(
      jobs.deadLetterExpiredLease(
        renewableLease!,
        '2026-07-14T10:00:00.600Z',
        Object.freeze({ reason: 'stale-reaper-observation' }),
      ),
      undefined,
    );
    assert.equal(jobs.requireJob('job-003').status, 'leased');
    assert.equal(jobs.getDeadLetter('job-003'), undefined);

    jobs.create({
      availableAt: TEST_TIMESTAMP,
      jobId: 'job-004',
      jobKind: 'private_paper_runtime_cycle_v1',
      payload: Object.freeze({ schema: 'test-job-4' }),
      queueName: 'private-paper',
      retryDelaysMs: Object.freeze([]),
    });
    const expiredOwnedLease = jobs.claimNext({
      claimedAt: TEST_TIMESTAMP,
      leaseDurationMs: 500,
      leaseToken: 'lease-005',
      queueName: 'private-paper',
      workerId: 'worker-expired-owned',
    });
    assert.throws(
      () =>
        jobs.deadLetterOwnedJob(
          expiredOwnedLease!,
          '2026-07-14T10:00:00.600Z',
          'OWNED_DEAD_LETTER_EXPIRED',
          Object.freeze({ reason: 'lease-expired-before-dead-letter' }),
        ),
      (error: unknown) =>
        error instanceof Error
        && 'code' in error
        && error.code === 'SUREBET_WORKER_JOB_LEASE_EXPIRED',
    );
    assert.equal(jobs.requireJob('job-004').status, 'leased');
    assert.equal(jobs.getDeadLetter('job-004'), undefined);
  } finally {
    dropDisposableDatabase(adminConfig, databaseName);
  }
});

test('private-paper worker handler uses the bounded worker clock for invalid payload dead letters', async () => {
  const handler = createPrivatePaperRuntimeJobHandler({
    strategyLedger: {
      create: () => {
        throw new Error('strategy ledger must not be reached for invalid payload jobs');
      },
    },
    upstreamLocks: {
      get: () => {
        throw new Error('upstream lock lookup must not be reached for invalid payload jobs');
      },
    },
  });
  const now = createDeterministicClock('2026-07-14T10:04:00.000Z');

  const result = await handler.run({
    job: Object.freeze({
      attemptCount: 1,
      availableAt: TEST_TIMESTAMP,
      checkpointCount: 0,
      insertedAt: TEST_TIMESTAMP,
      jobId: 'private-paper-invalid-handler-001',
      jobKind: 'private_paper_runtime_cycle_v1',
      payload: Object.freeze({
        schema: 'bws.private_paper_runtime_job.invalid',
      }),
      payloadSha256: '7'.repeat(64),
      queueName: 'private-paper',
      retryDelaysMs: Object.freeze([]),
      status: 'leased',
      updatedAt: TEST_TIMESTAMP,
    }),
    leaseDurationMs: 2_000,
    now,
    heartbeat: () => {
      throw new Error('heartbeat must not be reached for invalid payload jobs');
    },
    recordCheckpoint: () => {
      throw new Error('checkpoints must not be recorded for invalid payload jobs');
    },
  });

  assert.equal(result.outcome, 'dead_letter');
  assert.equal(result.failedAt, '2026-07-14T10:04:00.000Z');
  assert.equal(result.errorCode, 'BWS_PRIVATE_PAPER_JOB_SCHEMA_INVALID');
  assert.deepEqual(result.errorDetails, Object.freeze({
    evidenceRequired: 'A bws.private_paper_runtime_job.v1 payload for the private-paper worker job.',
    receivedSchema: 'bws.private_paper_runtime_job.invalid',
  }));
});

test('bounded worker pass dead-letters invalid private-paper payloads with worker-clock timestamps', { skip: !hasDisposableDatabaseTestConfig() }, async () => {
  const testEnvironment = readDisposableDatabaseTestEnvironment();
  assert.ok(testEnvironment !== undefined);

  const databaseName = `bws_410_invalid_payload_${Date.now()}_${process.pid}`;
  const adminConfig = testEnvironment.adminConfig;
  const databaseConfig: SurebetPersistenceConfig = Object.freeze({
    ...testEnvironment.connectionConfig,
    database: databaseName,
  });

  createDisposableDatabase(adminConfig, databaseName);
  try {
    applySurebetMigrations(databaseConfig);
    const jobs = new SurebetWorkerJobRepository(databaseConfig);

    jobs.create({
      availableAt: TEST_TIMESTAMP,
      jobId: 'private-paper-job-invalid-001',
      jobKind: 'private_paper_runtime_cycle_v1',
      payload: Object.freeze({
        schema: 'bws.private_paper_runtime_job.invalid',
      }),
      queueName: 'private-paper',
      retryDelaysMs: Object.freeze([]),
    });

    const now = createDeterministicClock('2026-07-14T10:05:00.000Z');
    const result = await runBoundedWorkerPass({
      handlers: Object.freeze({
        private_paper_runtime_cycle_v1: createPrivatePaperRuntimeJobHandler({
          strategyLedger: {
            create: () => {
              throw new Error('strategy ledger must not be reached for invalid payload jobs');
            },
          },
          upstreamLocks: {
            get: () => {
              throw new Error('upstream lock lookup must not be reached for invalid payload jobs');
            },
          },
        }),
      }),
      jobs,
      leaseDurationMs: 2_000,
      maxJobs: 1,
      now,
      queueName: 'private-paper',
      workerId: 'worker-410-invalid',
    });

    assert.equal(result.ok, true);
    assert.equal(result.value.claimedCount, 1);
    assert.equal(result.value.completedCount, 0);
    assert.equal(result.value.retryCount, 0);
    assert.equal(result.value.deadLetterCount, 1);

    const persistedJob = jobs.requireJob('private-paper-job-invalid-001');
    assert.equal(persistedJob.status, 'dead_lettered');
    assert.equal(persistedJob.deadLetteredAt, '2026-07-14T10:05:00.002Z');
    assert.equal(persistedJob.lastErrorCode, 'BWS_PRIVATE_PAPER_JOB_SCHEMA_INVALID');
    assert.deepEqual(persistedJob.lastErrorDetails, Object.freeze({
      evidenceRequired: 'A bws.private_paper_runtime_job.v1 payload for the private-paper worker job.',
      receivedSchema: 'bws.private_paper_runtime_job.invalid',
    }));

    const deadLetter = jobs.getDeadLetter('private-paper-job-invalid-001');
    assert.equal(deadLetter?.deadLetterReasonCode, 'BWS_PRIVATE_PAPER_JOB_SCHEMA_INVALID');
    assert.equal(deadLetter?.finalWorkerId, 'worker-410-invalid');
  } finally {
    dropDisposableDatabase(adminConfig, databaseName);
  }
});

test('bounded worker pass runs a persisted private-paper job into immutable strategy ledger evidence', { skip: !hasDisposableDatabaseTestConfig() }, async () => {
  const testEnvironment = readDisposableDatabaseTestEnvironment();
  assert.ok(testEnvironment !== undefined);

  const databaseName = `bws_410_worker_${Date.now()}_${process.pid}`;
  const adminConfig = testEnvironment.adminConfig;
  const databaseConfig: SurebetPersistenceConfig = Object.freeze({
    ...testEnvironment.connectionConfig,
    database: databaseName,
  });

  createDisposableDatabase(adminConfig, databaseName);
  try {
    applySurebetMigrations(databaseConfig);
    const upstreamLocks = new SurebetUpstreamLockRepository(databaseConfig);
    const importRuns = new SurebetImportRunRepository(databaseConfig);
    const pinnedExports = new SurebetPinnedStrategyExportRepository(databaseConfig);
    const strategyLedger = new SurebetStrategyLedgerRepository(databaseConfig);
    const jobs = new SurebetWorkerJobRepository(databaseConfig);

    const lockRecord = upstreamLocks.put({
      lock: sampleUpstreamLock(),
      lockRecordId: 'lock-410-001',
    });
    importRuns.create({
      importRunId: 'import-410-001',
      metadata: Object.freeze({ expectedSchema: 'betting-win.strategy-export.v1' }),
      requestedAt: TEST_TIMESTAMP,
      sourceKind: 'workspace_export_bundle',
      sourceLocator: '/tmp/export.json',
      startedAt: TEST_TIMESTAMP,
      upstreamLockRecordId: lockRecord.lockRecordId,
    });
    importRuns.finalize({
      completedAt: '2026-07-14T10:02:00.000Z',
      importRunId: 'import-410-001',
      importedRecordCount: 7,
      outcome: 'succeeded',
    });
    const pinnedExport = pinnedExports.create({
      contractAlias: 'betting-win-strategy-export.v1',
      contractSchema: 'betting-win.strategy-export.v1',
      endpointId: 'endpoint-410-001',
      exportId: 'provider-history-export.fixture-410.20260714t100000000z.fixture',
      exportKind: 'pinned_provider_history_bundle',
      exportProfile: 'provider_history_fixture_bundle_v1',
      exportedAt: '2026-07-01T00:00:03.000Z',
      importRunId: 'import-410-001',
      importedAt: TEST_TIMESTAMP,
      intakeRecordId: 'intake-410-001',
      normalizedEvidenceIds: ['normalized-410-001'],
      payloadSha256: '6'.repeat(64),
      providerGenerationIds: ['generation-410-001'],
      providerId: 'polymarket',
      sourceLineageRecordIds: ['record-410-001'],
      sourceLocator: '/tmp/pinned-export-410.json',
      sourceSha256: '5'.repeat(64),
      surebetProfile: 'surebet_standard_binary_v0',
      upstreamLockRecordId: lockRecord.lockRecordId,
    });

    const intake = validatePinnedBettingWinBundleIntake(SOLVER_READY_BUNDLE, REPO_ROOT);
    assert.equal(intake.ok, true);

    const payload: PersistedPrivatePaperRuntimeJobPayload = {
      candidatePlans: [
        {
          candidateId: 'market-002',
          completionEvents: [
            { legId: 'market-002:yes', occurredAt: '2026-07-01T00:00:02.600Z', stakeMinor: '100', type: 'reserve' },
            { legId: 'market-002:no', occurredAt: '2026-07-01T00:00:02.700Z', stakeMinor: '100', type: 'reserve' },
            { legId: 'market-002:yes', occurredAt: '2026-07-01T00:00:02.800Z', stakeMinor: '100', type: 'fill' },
            { legId: 'market-002:no', occurredAt: '2026-07-01T00:00:02.900Z', stakeMinor: '100', type: 'fill' },
          ],
          decisionTimestamp: '2026-07-01T00:00:02.500Z',
          manualKill: false,
          maxQuoteAgeMs: 2_000,
        },
      ],
      cycleId: 'cycle-410-001',
      maxCandidatesPerCycle: 1,
      pinnedStrategyExportRecordId: pinnedExport.intakeRecordId,
      runtimeId: 'runtime-410-001',
      schema: 'bws.private_paper_runtime_job.v1',
      source: {
        exportedAt: intake.value.bundle.exportedAt,
        kind: 'pinned_records',
        records: serializeRecords(intake.value.records),
        sourceBundleKind: 'resource_export',
        sourceManifestHash: intake.value.bundle.reference.manifestHash,
      },
      upstreamLockRecordId: lockRecord.lockRecordId,
    };
    jobs.create({
      availableAt: TEST_TIMESTAMP,
      jobId: 'private-paper-job-001',
      jobKind: 'private_paper_runtime_cycle_v1',
      payload: payload as unknown as JsonValue,
      queueName: 'private-paper',
      retryDelaysMs: Object.freeze([]),
    });

    const now = createDeterministicClock('2026-07-14T10:00:00.000Z');
    const result = await runBoundedWorkerPass({
      handlers: Object.freeze({
        private_paper_runtime_cycle_v1: createPrivatePaperRuntimeJobHandler({
          strategyLedger,
          upstreamLocks,
        }),
      }),
      jobs,
      leaseDurationMs: 2_000,
      maxJobs: 1,
      now,
      queueName: 'private-paper',
      workerId: 'worker-410-001',
    });

    assert.equal(result.ok, true);
    assert.equal(result.value.claimedCount, 1);
    assert.equal(result.value.completedCount, 1);
    assert.equal(result.value.deadLetterCount, 0);

    const persistedJob = jobs.requireJob('private-paper-job-001');
    assert.equal(persistedJob.status, 'succeeded');
    assert.equal(persistedJob.checkpointCount, 3);
    assert.equal(jobs.listCheckpoints('private-paper-job-001').length, 3);

    const successResult = persistedJob.successResult;
    const successResultRecord = successResult !== undefined
      && successResult !== null
      && typeof successResult === 'object'
      && !Array.isArray(successResult)
      ? successResult as { readonly [key: string]: JsonValue }
      : undefined;
    const ledgerEntryId = typeof successResultRecord?.ledgerEntryId === 'string'
      ? successResultRecord.ledgerEntryId
      : undefined;
    assert.equal(typeof ledgerEntryId, 'string');
    const persistedLedger = strategyLedger.get(ledgerEntryId as string);
    assert.equal(persistedLedger?.entry.acceptanceState, 'accepted_local_evidence');
    assert.equal(persistedLedger?.entry.runKind, 'private_paper_runtime_cycle');
    assert.equal(persistedLedger?.pinnedStrategyExportRecordId, pinnedExport.intakeRecordId);
  } finally {
    dropDisposableDatabase(adminConfig, databaseName);
  }
});

function serializeRecords(records: readonly BettingWinResourceRecord[]): readonly JsonValue[] {
  return Object.freeze(
    records.map((record) => {
      switch (record.recordType) {
        case 'identity':
          return Object.freeze({ ...record }) as JsonValue;
        case 'rules':
          return Object.freeze({ ...record }) as JsonValue;
        case 'quotes':
          return Object.freeze({
            availableSizeMinor: record.evidence.availableSizeMinor.toString(),
            canonicalMarketId: record.canonicalMarketId,
            costMinor: record.costMinor.toString(),
            currency: record.evidence.currency,
            evidenceId: record.evidence.evidenceId,
            feeMinor: record.feeMinor.toString(),
            minStakeMinor: record.minStakeMinor.toString(),
            observedAt: record.evidence.observedAt,
            outcome: record.outcome,
            priceMinor: record.evidence.priceMinor.toString(),
            quoteSourceManifestHash: record.quoteSourceManifestHash,
            recordType: 'quotes',
          }) as JsonValue;
        case 'settlement':
          return Object.freeze({ ...record }) as JsonValue;
      }
    }),
  );
}

function createDeterministicClock(start: string): () => string {
  const startedAt = Date.parse(start);
  let offset = 0;
  return () => {
    const next = new Date(startedAt + offset).toISOString();
    offset += 1;
    return next;
  };
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
