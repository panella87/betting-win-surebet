import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import {
  SurebetImportRunRepository,
  SurebetPinnedStrategyExportRepository,
  SurebetPrivatePaperRuntimeSchedulerCheckpointRepository,
  SurebetStrategyLedgerRepository,
  SurebetUpstreamApiConvergenceRepository,
  SurebetUpstreamLockRepository,
  SurebetWorkerJobRepository,
  applySurebetMigrations,
  resolveSurebetPersistenceConfig,
  type JsonValue,
  type SurebetPersistenceConfig,
} from '../packages/persistence/src/index.js';
import {
  createBwsReadOnlyQueryService,
  type BwsReadOnlyQueryDependencies,
} from '../src/api/bws-read-only-query-service.js';
import { createBwsReadOnlyQueryHttpHandler } from '../src/api/bws-read-only-query-http.js';
import { validatePinnedBettingWinBundleIntake } from '../src/adapters/betting-win-pinned-bundle-intake.js';
import {
  runDeterministicStandardBinaryBacktest,
  type StandardBinaryBacktestExecutionPlan,
} from '../src/backtest/standard-binary-backtest.js';
import { createBacktestStrategyLedgerEntry } from '../src/strategy/strategy-ledger.js';
import type { BettingWinUpstreamLock } from '../packages/upstream/src/upstream/betting-win-upstream-lock.js';
import { createMockBwsOperatorCockpitSnapshot } from '../apps/web/src/api/mock-data.js';

const REPO_ROOT = process.cwd();
const SOLVER_READY_BUNDLE = 'tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json';
const TEST_TIMESTAMP = '2026-07-15T08:45:00.000Z';

test('BWS read-only query service fails closed on missing provenance expansion, unbounded filters, and page overflow', () => {
  const service = createBwsReadOnlyQueryService(createStubDependencies(), {
    generatedAt: () => TEST_TIMESTAMP,
    maxPageSize: 50,
  });
  assert.equal(service.ok, true);

  const missingExpansion = service.value.queryStrategyLedger({
    filters: {
      acceptanceState: 'blocked',
      runKind: 'private_paper_runtime_cycle',
    },
    pageSize: 1,
  });
  assert.equal(missingExpansion.ok, false);
  assert.equal(missingExpansion.blockers[0]?.code, 'BWS_QUERY_EXPANSION_REQUIRED');

  const unboundedFilters = service.value.queryStrategyLedger({
    expand: 'provenance',
    filters: {
      acceptanceState: 'blocked',
    },
    pageSize: 1,
  });
  assert.equal(unboundedFilters.ok, false);
  assert.equal(unboundedFilters.blockers[0]?.code, 'BWS_QUERY_FILTERS_UNBOUNDED');

  const pageOverflow = service.value.queryPinnedStrategyExports({
    expand: 'provenance',
    filters: {
      exportId: 'provider-history-export.fixture-001.20260715t084500000z.fixture',
    },
    pageSize: 51,
  });
  assert.equal(pageOverflow.ok, false);
  assert.equal(pageOverflow.blockers[0]?.code, 'BWS_QUERY_PAGE_SIZE_EXCEEDED');
});

test('BWS read-only query service fails closed on missing private-paper runtime cycle acceptance scope', () => {
  const service = createBwsReadOnlyQueryService(createStubDependencies(), {
    generatedAt: () => TEST_TIMESTAMP,
    maxPageSize: 50,
  });
  assert.equal(service.ok, true);

  const missingAcceptanceState = service.value.queryPrivatePaperRuntimeCycles({
    expand: 'provenance',
    filters: Object.freeze({}),
    pageSize: 1,
  });
  assert.equal(missingAcceptanceState.ok, false);
  assert.equal(missingAcceptanceState.blockers[0]?.code, 'BWS_QUERY_ACCEPTANCE_STATE_REQUIRED');
});

test('BWS read-only query service skips unsupported non-api scheduler checkpoints instead of breaking runtime-cycle queries', () => {
  const service = createBwsReadOnlyQueryService({
    ...createStubDependencies(),
    privatePaperSchedulerCheckpoints: Object.freeze({
      list() {
        return Object.freeze([
          Object.freeze({
            configSha256: 'a'.repeat(64),
            insertedAt: TEST_TIMESTAMP,
            mode: 'export' as const,
            queueName: 'private-paper',
            runtimeId: 'runtime-export-001',
            schedulerCheckpointId: 'scheduler-export-001',
            updatedAt: TEST_TIMESTAMP,
            upstreamCheckpointId: 'checkpoint-export-001',
            upstreamLockRecordId: 'lock-export-001',
            lastScheduledApiCycleNumber: 1,
            lastScheduledAt: TEST_TIMESTAMP,
            lastScheduledJobId: 'private-paper:scheduler-export-001:cycle:1',
            lastScheduledSourceId: 'export-selection:checkpoint-export-001:cursor-001',
          }),
        ]);
      },
    }),
  } satisfies BwsReadOnlyQueryDependencies, {
    generatedAt: () => TEST_TIMESTAMP,
    maxPageSize: 50,
  });
  assert.equal(service.ok, true);

  const response = service.value.queryPrivatePaperRuntimeCycles({
    expand: 'provenance',
    filters: Object.freeze({
      acceptanceState: 'accepted_local_evidence',
    }),
    pageSize: 5,
  });
  assert.equal(response.ok, true);
  assert.equal(response.value.page.returnedCount, 0);
});

test('BWS read-only query HTTP handler applies security headers and returns fail-closed validation errors', async () => {
  const service = createBwsReadOnlyQueryService(createStubDependencies(), {
    generatedAt: () => TEST_TIMESTAMP,
    maxPageSize: 50,
  });
  assert.equal(service.ok, true);

  const server = createServer(createBwsReadOnlyQueryHttpHandler(service.value));
  await listen(server);
  try {
    const response = await fetch(
      `http://127.0.0.1:${getServerPort(server)}/api/read-only/strategy-ledger?acceptanceState=blocked&runKind=private_paper_runtime_cycle&pageSize=1`,
    );
    assert.equal(response.status, 400);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');

    const body = await response.json() as {
      readonly error: {
        readonly code: string;
      };
      readonly ok: boolean;
    };
    assert.equal(body.ok, false);
    assert.equal(body.error.code, 'BWS_QUERY_EXPANSION_REQUIRED');
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('BWS read-only query HTTP API returns immutable strategy-ledger and pinned-export provenance over surebet persistence', { skip: !hasDisposableDatabaseTestConfig() }, async () => {
  const database = createDisposableDatabaseContext();
  const lockRepository = new SurebetUpstreamLockRepository(database.databaseConfig);
  const importRunRepository = new SurebetImportRunRepository(database.databaseConfig);
  const pinnedRepository = new SurebetPinnedStrategyExportRepository(database.databaseConfig);
  const schedulerCheckpointRepository = new SurebetPrivatePaperRuntimeSchedulerCheckpointRepository(database.databaseConfig);
  const strategyLedgerRepository = new SurebetStrategyLedgerRepository(database.databaseConfig);
  const upstreamApiCheckpointRepository = new SurebetUpstreamApiConvergenceRepository(database.databaseConfig);
  const workerJobRepository = new SurebetWorkerJobRepository(database.databaseConfig);

  try {
    applySurebetMigrations(database.databaseConfig);
    const lockRecord = lockRepository.put({
      lockRecordId: 'lock-bws-400-001',
      lock: sampleUpstreamLock(),
    });

    importRunRepository.create({
      importRunId: 'import-bws-400-001',
      upstreamLockRecordId: lockRecord.lockRecordId,
      sourceKind: 'workspace_export_bundle',
      sourceLocator: '/tmp/bws-400/export.json',
      requestedAt: TEST_TIMESTAMP,
      startedAt: TEST_TIMESTAMP,
      metadata: Object.freeze({
        contractSchema: 'betting-win.strategy-export.v1',
      }),
    });
    importRunRepository.finalize({
      completedAt: '2026-07-15T08:46:00.000Z',
      importedRecordCount: 4,
      importRunId: 'import-bws-400-001',
      outcome: 'succeeded',
    });

    const intake = validatePinnedBettingWinBundleIntake(SOLVER_READY_BUNDLE, REPO_ROOT);
    assert.equal(intake.ok, true);
    const pinnedExport = pinnedRepository.create({
      intakeRecordId: 'intake-bws-400-001',
      importRunId: 'import-bws-400-001',
      upstreamLockRecordId: lockRecord.lockRecordId,
      sourceSha256: '4'.repeat(64),
      sourceLocator: '/tmp/bws-400/pinned-export.json',
      contractSchema: 'betting-win.strategy-export.v1',
      contractAlias: 'betting-win-strategy-export.v1',
      surebetProfile: 'surebet_standard_binary_v0',
      exportId: 'provider-history-export.fixture-001.20260715t084500000z.fixture',
      exportKind: 'pinned_provider_history_bundle',
      exportProfile: 'provider_history_fixture_bundle_v1',
      exportedAt: TEST_TIMESTAMP,
      providerId: 'polymarket',
      endpointId: 'endpoint-001',
      payloadSha256: '5'.repeat(64),
      providerGenerationIds: ['generation-id-001'],
      sourceLineageRecordIds: ['record-001'],
      normalizedEvidenceIds: ['normalized-001'],
      importedAt: TEST_TIMESTAMP,
    });

    const backtest = runDeterministicStandardBinaryBacktest({
      bundle: intake.value.bundle,
      records: intake.value.records,
      executionPlans: [sampleExecutionPlan()],
    });
    assert.equal(backtest.ok, true);

    const ledgerEntry = createBacktestStrategyLedgerEntry({
      upstreamLock: sampleUpstreamLock(),
      run: backtest.value,
    });
    assert.equal(ledgerEntry.ok, true);

    strategyLedgerRepository.create({
      entry: ledgerEntry.value,
      pinnedStrategyExportRecordId: pinnedExport.intakeRecordId,
      upstreamLockRecordId: lockRecord.lockRecordId,
    });

    const service = createBwsReadOnlyQueryService({
      importRuns: importRunRepository,
      pinnedStrategyExports: pinnedRepository,
      privatePaperSchedulerCheckpoints: schedulerCheckpointRepository,
      strategyLedger: strategyLedgerRepository,
      upstreamApiCheckpoints: upstreamApiCheckpointRepository,
      upstreamLocks: lockRepository,
      workerJobs: workerJobRepository,
    } satisfies BwsReadOnlyQueryDependencies, {
      generatedAt: () => TEST_TIMESTAMP,
      maxPageSize: 25,
    });
    assert.equal(service.ok, true);

    const server = createServer(createBwsReadOnlyQueryHttpHandler(service.value));
    await listen(server);
    try {
      const baseUrl = `http://127.0.0.1:${getServerPort(server)}`;

      const strategyLedgerResponse = await fetch(
        `${baseUrl}/api/read-only/strategy-ledger?expand=provenance&pageSize=1&acceptanceState=accepted_local_evidence&runKind=deterministic_standard_binary_backtest`,
      );
      assert.equal(strategyLedgerResponse.status, 200);
      const strategyLedgerBody = await strategyLedgerResponse.json() as {
        readonly boundary: {
          readonly automaticFallback: string;
        };
        readonly page: {
          readonly items: ReadonlyArray<{
            readonly entry: {
              readonly acceptanceState: string;
            };
            readonly provenance: {
              readonly importRun: {
                readonly outcome: string;
              };
              readonly pinnedStrategyExport: {
                readonly intakeRecordId: string;
              };
              readonly upstreamLock: {
                readonly commitSha: string;
              };
            };
          }>;
          readonly returnedCount: number;
        };
        readonly resource: string;
      };
      assert.equal(strategyLedgerBody.resource, 'strategy_ledger_entries');
      assert.equal(strategyLedgerBody.boundary.automaticFallback, 'forbidden');
      assert.equal(strategyLedgerBody.page.returnedCount, 1);
      assert.equal(strategyLedgerBody.page.items[0]?.entry.acceptanceState, 'accepted_local_evidence');
      assert.equal(strategyLedgerBody.page.items[0]?.provenance.pinnedStrategyExport.intakeRecordId, pinnedExport.intakeRecordId);
      assert.equal(strategyLedgerBody.page.items[0]?.provenance.importRun.outcome, 'succeeded');
      assert.equal(strategyLedgerBody.page.items[0]?.provenance.upstreamLock.commitSha, sampleUpstreamLock().commitSha);

      const pinnedResponse = await fetch(
        `${baseUrl}/api/read-only/pinned-strategy-exports?expand=provenance&pageSize=1&exportId=${encodeURIComponent(pinnedExport.exportId)}`,
      );
      assert.equal(pinnedResponse.status, 200);
      const pinnedBody = await pinnedResponse.json() as {
        readonly page: {
          readonly items: ReadonlyArray<{
            readonly provenance: {
              readonly importRun: {
                readonly importRunId: string;
              };
              readonly upstreamLock: {
                readonly gitTreeSha: string;
              };
            };
            readonly record: {
              readonly exportId: string;
            };
          }>;
          readonly returnedCount: number;
        };
        readonly resource: string;
      };
      assert.equal(pinnedBody.resource, 'pinned_strategy_exports');
      assert.equal(pinnedBody.page.returnedCount, 1);
      assert.equal(pinnedBody.page.items[0]?.record.exportId, pinnedExport.exportId);
      assert.equal(pinnedBody.page.items[0]?.provenance.importRun.importRunId, 'import-bws-400-001');
      assert.equal(pinnedBody.page.items[0]?.provenance.upstreamLock.gitTreeSha, sampleUpstreamLock().gitTreeSha);
    } finally {
      server.close();
      await once(server, 'close');
    }
  } finally {
    dropDisposableDatabase(database.adminConfig, database.databaseName);
  }
});

test('BWS read-only query HTTP API returns bounded private-paper runtime cycle convergence from persisted scheduler, worker, and dead-letter state', { skip: !hasDisposableDatabaseTestConfig() }, async () => {
  const database = createDisposableDatabaseContext();
  const lockRepository = new SurebetUpstreamLockRepository(database.databaseConfig);
  const importRunRepository = new SurebetImportRunRepository(database.databaseConfig);
  const schedulerCheckpointRepository = new SurebetPrivatePaperRuntimeSchedulerCheckpointRepository(database.databaseConfig);
  const strategyLedgerRepository = new SurebetStrategyLedgerRepository(database.databaseConfig);
  const upstreamApiCheckpointRepository = new SurebetUpstreamApiConvergenceRepository(database.databaseConfig);
  const workerJobRepository = new SurebetWorkerJobRepository(database.databaseConfig);

  try {
    applySurebetMigrations(database.databaseConfig);
    const lockRecord = lockRepository.put({
      lockRecordId: 'lock-bws-570-001',
      lock: sampleUpstreamLock(),
    });

    upstreamApiCheckpointRepository.create({
      apiBaseUrl: 'http://127.0.0.1:4312',
      checkpointId: 'checkpoint-api-001',
      completedCycleCount: 2,
      contractVersion: 'v1',
      currentCycleNumber: 3,
      currentResource: 'identity',
      currentResourcePageCount: 0,
      lastCompletedCycleAt: '2026-07-15T08:50:00.000Z',
      lastImportRunId: 'import:checkpoint-api-001:cycle:2:settlement:page:1',
      lastResponseProvenance: Object.freeze({
        commitSha: sampleUpstreamLock().commitSha,
        repository: 'betting-win',
        resource: 'settlement',
        responseReceivedAt: '2026-07-15T08:50:00.000Z',
        sourceView: 'committed_git_head',
        verifiedAt: TEST_TIMESTAMP,
      }),
      maxPagesPerResource: 4,
      mode: 'api',
      pageSize: 2,
      retryBackoffMs: 250,
      retryLimit: 1,
      timeoutMs: 1000,
      upstreamLockRecordId: lockRecord.lockRecordId,
    });

    schedulerCheckpointRepository.create({
      configSha256: 'a'.repeat(64),
      mode: 'api',
      queueName: 'private-paper',
      runtimeId: 'runtime-001',
      schedulerCheckpointId: 'scheduler-001',
      upstreamCheckpointId: 'checkpoint-api-001',
      upstreamLockRecordId: lockRecord.lockRecordId,
    });
    schedulerCheckpointRepository.advance({
      lastScheduledApiCycleNumber: 2,
      lastScheduledAt: '2026-07-15T08:50:00.000Z',
      lastScheduledJobId: 'private-paper:scheduler-001:cycle:2',
      lastScheduledSourceId: 'api-cycle:checkpoint-api-001:2',
      schedulerCheckpointId: 'scheduler-001',
    });

    for (const [cycleNumber, receivedAt] of [[1, '2026-07-15T08:47:00.000Z'], [2, '2026-07-15T08:50:00.000Z']] as const) {
      importRunRepository.create({
        importRunId: `import:checkpoint-api-001:cycle:${cycleNumber}:settlement:page:1`,
        metadata: Object.freeze({
          checkpointId: 'checkpoint-api-001',
          contractVersion: 'v1',
          cycleNumber,
          mode: 'api',
          page: Object.freeze({
            pageNumber: 1,
            provenance: Object.freeze({
              responseReceivedAt: receivedAt,
            }),
            resource: 'settlement',
          }),
          upstreamLockRecordId: lockRecord.lockRecordId,
        }),
        requestedAt: receivedAt,
        sourceKind: 'continuous_read_only_query_page',
        sourceLocator: `http://127.0.0.1:4312#checkpoint-api-001:cycle:${cycleNumber}:settlement:page:1`,
        startedAt: receivedAt,
        upstreamLockRecordId: lockRecord.lockRecordId,
      });
      importRunRepository.finalize({
        completedAt: receivedAt,
        importedRecordCount: 4,
        importRunId: `import:checkpoint-api-001:cycle:${cycleNumber}:settlement:page:1`,
        outcome: 'succeeded',
      });
    }

    const mockSnapshot = createMockBwsOperatorCockpitSnapshot();
    strategyLedgerRepository.create({
      entry: mockSnapshot.acceptedPaperRuns.page.items[0]!.entry,
      upstreamLockRecordId: lockRecord.lockRecordId,
    });

    workerJobRepository.create({
      availableAt: '2026-07-15T08:47:00.000Z',
      jobId: 'private-paper:scheduler-001:cycle:1',
      jobKind: 'private_paper_runtime_cycle_v1',
      payload: createRuntimeCycleJobPayload(lockRecord.lockRecordId, 'runtime-001', 'scheduler-001:cycle:1', 'd'.repeat(64)),
      queueName: 'private-paper',
      retryDelaysMs: [250],
    });
    workerJobRepository.claimNext({
      claimedAt: '2026-07-15T08:47:05.000Z',
      leaseDurationMs: 1000,
      leaseToken: 'lease-accepted-1',
      queueName: 'private-paper',
      workerId: 'worker-001',
    });
    workerJobRepository.recordCheckpoint({
      checkpoint: Object.freeze({ checkpointStage: 'payload_validated' }),
      checkpointId: 'attempt-1-payload-validated',
      jobId: 'private-paper:scheduler-001:cycle:1',
      leaseToken: 'lease-accepted-1',
      recordedAt: '2026-07-15T08:47:06.000Z',
      workerId: 'worker-001',
    });
    workerJobRepository.fail({
      errorCode: 'TRANSIENT_RUNTIME_FAILURE',
      errorDetails: Object.freeze({ message: 'retry once' }),
      failedAt: '2026-07-15T08:47:07.000Z',
      jobId: 'private-paper:scheduler-001:cycle:1',
      leaseToken: 'lease-accepted-1',
      workerId: 'worker-001',
    });
    workerJobRepository.claimNext({
      claimedAt: '2026-07-15T08:47:08.000Z',
      leaseDurationMs: 1000,
      leaseToken: 'lease-accepted-2',
      queueName: 'private-paper',
      workerId: 'worker-001',
    });
    workerJobRepository.recordCheckpoint({
      checkpoint: Object.freeze({ checkpointStage: 'runtime_cycle_completed' }),
      checkpointId: 'attempt-2-runtime-cycle',
      jobId: 'private-paper:scheduler-001:cycle:1',
      leaseToken: 'lease-accepted-2',
      recordedAt: '2026-07-15T08:47:09.000Z',
      workerId: 'worker-001',
    });
    workerJobRepository.recordCheckpoint({
      checkpoint: Object.freeze({ checkpointStage: 'strategy_ledger_persisted' }),
      checkpointId: 'attempt-2-strategy-ledger',
      jobId: 'private-paper:scheduler-001:cycle:1',
      leaseToken: 'lease-accepted-2',
      recordedAt: '2026-07-15T08:47:10.000Z',
      workerId: 'worker-001',
    });
    workerJobRepository.complete({
      completedAt: '2026-07-15T08:47:11.000Z',
      jobId: 'private-paper:scheduler-001:cycle:1',
      leaseToken: 'lease-accepted-2',
      successResult: Object.freeze({ acceptanceState: 'accepted_local_evidence' }),
      workerId: 'worker-001',
    });

    workerJobRepository.create({
      availableAt: '2026-07-15T08:50:00.000Z',
      jobId: 'private-paper:scheduler-001:cycle:2',
      jobKind: 'private_paper_runtime_cycle_v1',
      payload: createRuntimeCycleJobPayload(lockRecord.lockRecordId, 'runtime-001', 'scheduler-001:cycle:2', '8'.repeat(64)),
      queueName: 'private-paper',
      retryDelaysMs: [250],
    });
    workerJobRepository.claimNext({
      claimedAt: '2026-07-15T08:50:05.000Z',
      leaseDurationMs: 1000,
      leaseToken: 'lease-blocked-1',
      queueName: 'private-paper',
      workerId: 'worker-001',
    });
    workerJobRepository.fail({
      errorCode: 'TRANSIENT_RUNTIME_FAILURE',
      errorDetails: Object.freeze({ message: 'retry once' }),
      failedAt: '2026-07-15T08:50:06.000Z',
      jobId: 'private-paper:scheduler-001:cycle:2',
      leaseToken: 'lease-blocked-1',
      workerId: 'worker-001',
    });
    workerJobRepository.claimNext({
      claimedAt: '2026-07-15T08:50:07.000Z',
      leaseDurationMs: 1000,
      leaseToken: 'lease-blocked-2',
      queueName: 'private-paper',
      workerId: 'worker-001',
    });
    workerJobRepository.recordCheckpoint({
      checkpoint: Object.freeze({ checkpointStage: 'runtime_cycle_completed', blockerCode: 'BWS_PRIVATE_PAPER_RUNTIME_BLOCKED' }),
      checkpointId: 'attempt-2-runtime-blocked',
      jobId: 'private-paper:scheduler-001:cycle:2',
      leaseToken: 'lease-blocked-2',
      recordedAt: '2026-07-15T08:50:08.000Z',
      workerId: 'worker-001',
    });
    workerJobRepository.fail({
      errorCode: 'BWS_PRIVATE_PAPER_RUNTIME_BLOCKED',
      errorDetails: Object.freeze({ blockers: [{ code: 'QUOTE_EVIDENCE_STALE' }] }),
      failedAt: '2026-07-15T08:50:09.000Z',
      jobId: 'private-paper:scheduler-001:cycle:2',
      leaseToken: 'lease-blocked-2',
      workerId: 'worker-001',
    });

    const service = createBwsReadOnlyQueryService({
      importRuns: importRunRepository,
      pinnedStrategyExports: new SurebetPinnedStrategyExportRepository(database.databaseConfig),
      privatePaperSchedulerCheckpoints: schedulerCheckpointRepository,
      strategyLedger: strategyLedgerRepository,
      upstreamApiCheckpoints: upstreamApiCheckpointRepository,
      upstreamLocks: lockRepository,
      workerJobs: workerJobRepository,
    } satisfies BwsReadOnlyQueryDependencies, {
      generatedAt: () => TEST_TIMESTAMP,
      maxPageSize: 25,
    });
    assert.equal(service.ok, true);

    const server = createServer(createBwsReadOnlyQueryHttpHandler(service.value));
    await listen(server);
    try {
      const baseUrl = `http://127.0.0.1:${getServerPort(server)}`;

      const acceptedResponse = await fetch(
        `${baseUrl}/api/read-only/private-paper-runtime-cycles?expand=provenance&pageSize=2&acceptanceState=accepted_local_evidence`,
      );
      assert.equal(acceptedResponse.status, 200);
      const acceptedBody = await acceptedResponse.json() as {
        readonly page: {
          readonly items: ReadonlyArray<{
            readonly acceptanceState: string;
            readonly job: {
              readonly attemptCount: number;
            };
            readonly recentCheckpoints: ReadonlyArray<unknown>;
            readonly strategyLedger?: {
              readonly entry: {
                readonly runReferenceId: string;
              };
            };
          }>;
          readonly returnedCount: number;
        };
      };
      assert.equal(acceptedBody.page.returnedCount, 1);
      assert.equal(acceptedBody.page.items[0]?.acceptanceState, 'accepted_local_evidence');
      assert.equal(acceptedBody.page.items[0]?.job.attemptCount, 2);
      assert.equal(acceptedBody.page.items[0]?.recentCheckpoints.length, 3);
      assert.equal(acceptedBody.page.items[0]?.strategyLedger?.entry.runReferenceId, 'runtime-001:scheduler-001:cycle:1');

      const blockedResponse = await fetch(
        `${baseUrl}/api/read-only/private-paper-runtime-cycles?expand=provenance&pageSize=2&acceptanceState=blocked`,
      );
      assert.equal(blockedResponse.status, 200);
      const blockedBody = await blockedResponse.json() as {
        readonly page: {
          readonly items: ReadonlyArray<{
            readonly acceptanceState: string;
            readonly blockedReasonCode?: string;
            readonly deadLetter?: {
              readonly deadLetterReasonCode: string;
            };
            readonly recentCheckpoints: ReadonlyArray<unknown>;
          }>;
          readonly returnedCount: number;
        };
      };
      assert.equal(blockedBody.page.returnedCount, 1);
      assert.equal(blockedBody.page.items[0]?.acceptanceState, 'blocked');
      assert.equal(blockedBody.page.items[0]?.blockedReasonCode, 'BWS_PRIVATE_PAPER_RUNTIME_BLOCKED');
      assert.equal(blockedBody.page.items[0]?.deadLetter?.deadLetterReasonCode, 'BWS_PRIVATE_PAPER_RUNTIME_BLOCKED');
      assert.equal(blockedBody.page.items[0]?.recentCheckpoints.length, 1);
    } finally {
      server.close();
      await once(server, 'close');
    }
  } finally {
    dropDisposableDatabase(database.adminConfig, database.databaseName);
  }
});

function createStubDependencies(): BwsReadOnlyQueryDependencies {
  const fail = () => {
    throw new Error('stub should not be called for fail-closed validation tests');
  };
  return Object.freeze({
    importRuns: Object.freeze({
      get: fail,
    }),
    pinnedStrategyExports: Object.freeze({
      get: fail,
      list: fail,
    }),
    privatePaperSchedulerCheckpoints: Object.freeze({
      list: fail,
    }),
    strategyLedger: Object.freeze({
      list: fail,
    }),
    upstreamApiCheckpoints: Object.freeze({
      get: fail,
    }),
    upstreamLocks: Object.freeze({
      get: fail,
    }),
    workerJobs: Object.freeze({
      get: fail,
      getDeadLetter: fail,
      listCheckpoints: fail,
    }),
  }) as BwsReadOnlyQueryDependencies;
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

function createDisposableDatabaseContext(): {
  readonly adminConfig: SurebetPersistenceConfig;
  readonly databaseConfig: SurebetPersistenceConfig;
  readonly databaseName: string;
} {
  const environment = readDisposableDatabaseTestEnvironment();
  assert.ok(environment !== undefined);
  const databaseName = `bws_400_${Date.now()}_${process.pid}`;
  createDisposableDatabase(environment.adminConfig, databaseName);
  return Object.freeze({
    adminConfig: environment.adminConfig,
    databaseConfig: Object.freeze({
      ...environment.connectionConfig,
      database: databaseName,
    }),
    databaseName,
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

function createRuntimeCycleJobPayload(
  upstreamLockRecordId: string,
  runtimeId: string,
  cycleId: string,
  sourceManifestHash: string,
): JsonValue {
  return Object.freeze({
    candidatePlans: Object.freeze([]),
    cycleId,
    maxCandidatesPerCycle: 1,
    runtimeId,
    schema: 'bws.private_paper_runtime_job.v1',
    source: Object.freeze({
      apiBaseUrl: 'http://127.0.0.1:4312',
      contractVersion: 'v1',
      exportedAt: TEST_TIMESTAMP,
      kind: 'read_only_query',
      maxPagesPerResource: 4,
      pageSize: 2,
      retryBackoffMs: 250,
      retryLimit: 1,
      sourceManifestHash,
      timeoutMs: 1000,
    }),
    upstreamLockRecordId,
  });
}

function sampleExecutionPlan() {
  return Object.freeze({
    canonicalMarketId: 'market-002',
    decisionTimestamp: '2026-07-01T00:00:02.500Z',
    maxQuoteAgeMs: 2_000,
    manualKill: false,
    completionEvents: Object.freeze([
      { legId: 'market-002:yes', type: 'reserve', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.600Z' },
      { legId: 'market-002:no', type: 'reserve', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.700Z' },
      { legId: 'market-002:yes', type: 'fill', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.800Z' },
      { legId: 'market-002:no', type: 'fill', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.900Z' },
    ]),
  } satisfies StandardBinaryBacktestExecutionPlan);
}

function sampleUpstreamLock(): BettingWinUpstreamLock {
  return Object.freeze({
    schema: 'betting-win-surebet-upstream-lock-v1',
    repository: 'betting-win',
    repositoryPath: '/tmp/betting-win',
    commitSha: '1'.repeat(40),
    gitTreeSha: '2'.repeat(40),
    sourceView: 'committed_git_head',
    packageVersion: '0.48.0',
    trackedTreeListingSha256: '3'.repeat(64),
    sourceFingerprintAlgorithm: 'sha256_git_ls_tree_r_full_tree_head_v1',
    contractSchema: 'betting-win.strategy-export.v1',
    contractAlias: 'betting-win-strategy-export.v1',
    surebetProfile: 'surebet_standard_binary_v0',
    verifiedAt: TEST_TIMESTAMP,
    packageVersions: Object.freeze({
      '@betting-win/provider-collection': '0.48.0',
    }),
    capabilities: Object.freeze([
      'exportHistoricalBundle',
      'getHistoricalQuotes',
      'getProviderGenerations',
      'inspectSourceLineage',
    ]),
  });
}

async function listen(server: ReturnType<typeof createServer>): Promise<void> {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
}

function getServerPort(server: ReturnType<typeof createServer>): number {
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, 'object');
  return (address as AddressInfo).port;
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
