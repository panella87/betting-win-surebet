import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBwsReadOnlyQueryService,
  type BwsReadOnlyQueryDependencies,
} from '../src/api/bws-read-only-query-service.js';

const TEST_TIMESTAMP = '2026-08-02T10:30:00.000Z';

test('BWS-810 B1 read-only API exposes research-only backtest reporting', () => {
  const service = createBwsReadOnlyQueryService({
    ...createStubDependencies(),
    b1BacktestRuns: Object.freeze({
      get() {
        return sampleRun();
      },
      list() {
        return Object.freeze([sampleRun()]);
      },
      listCandidates() {
        return Object.freeze([
          Object.freeze({
            blockers: Object.freeze([]),
            candidate: Object.freeze({ candidateId: 'candidate-b1-api-001' }),
            candidateId: 'candidate-b1-api-001',
            candidateSnapshotId: 'run-b1-api-001:candidate-b1-api-001',
            insertedAt: TEST_TIMESTAMP,
            runId: 'run-b1-api-001',
            stage: 'accepted',
            status: 'accepted',
          }),
        ]);
      },
      listSimulationResults() {
        return Object.freeze([
          Object.freeze({
            blockers: Object.freeze([]),
            candidateId: 'candidate-b1-api-001',
            falsePositive: false,
            insertedAt: TEST_TIMESTAMP,
            result: Object.freeze({ reportOnly: true }),
            runId: 'run-b1-api-001',
            simulationKind: 'false_positive',
            simulationResultId: 'run-b1-api-001:candidate-b1-api-001:false_positive',
            status: 'accepted',
          }),
        ]);
      },
    }),
  } satisfies BwsReadOnlyQueryDependencies, {
    generatedAt: () => TEST_TIMESTAMP,
    maxPageSize: 25,
  });
  assert.equal(service.ok, true);

  const response = service.value.queryB1BacktestRuns({
    expand: 'reporting',
    filters: Object.freeze({ runId: 'run-b1-api-001' }),
    pageSize: 1,
  });
  assert.equal(response.ok, true);
  assert.equal(response.value.resource, 'b1_backtest_runs');
  assert.equal(response.value.page.items[0]?.policy.runtimeEvidence, false);
  assert.equal(response.value.page.items[0]?.policy.execution, 'forbidden');
  assert.equal(response.value.page.items[0]?.policy.publicSignals, 'forbidden');
  assert.equal(response.value.page.items[0]?.run.liveReadiness, 'not_authorized_bws_900_parked');
  assert.equal(response.value.page.items[0]?.run.upstreamReadiness, 'blocked_until_betting_win_b1_multi_venue_markets_v1');
});

function createStubDependencies(): BwsReadOnlyQueryDependencies {
  const fail = () => {
    throw new Error('stub should not be called by BWS-810 B1 API test');
  };
  return Object.freeze({
    b1BacktestRuns: Object.freeze({
      get: fail,
      list: fail,
      listCandidates: fail,
      listSimulationResults: fail,
    }),
    importRuns: Object.freeze({ get: fail }),
    pinnedStrategyExports: Object.freeze({ get: fail, list: fail }),
    privatePaperSchedulerCheckpoints: Object.freeze({ list: fail }),
    strategyLedger: Object.freeze({ list: fail }),
    upstreamApiCheckpoints: Object.freeze({ get: fail }),
    upstreamLocks: Object.freeze({ get: fail }),
    workerJobs: Object.freeze({
      get: fail,
      getDeadLetter: fail,
      listCheckpoints: fail,
    }),
  }) as BwsReadOnlyQueryDependencies;
}

function sampleRun() {
  return Object.freeze({
    executable: false,
    fixtureKind: 'deterministic_b1_multi_venue_fixture' as const,
    insertedAt: TEST_TIMESTAMP,
    liveReadiness: 'not_authorized_bws_900_parked' as const,
    metrics: Object.freeze({ candidateCount: 1 }),
    observedAt: TEST_TIMESTAMP,
    offlineFalsificationStatus: 'B1_OFFLINE_RESEARCH_CANDIDATES_OBSERVED' as const,
    report: Object.freeze({ reportKind: 'deterministic_b1_cross_venue_backtest_report' }),
    runHash: '1'.repeat(64),
    runId: 'run-b1-api-001',
    runKind: 'deterministic_b1_cross_venue_offline_backtest' as const,
    runtimeEvidence: false,
    sourceManifestHash: '2'.repeat(64),
    upstreamLockFingerprint: '3'.repeat(64),
    upstreamReadiness: 'blocked_until_betting_win_b1_multi_venue_markets_v1' as const,
  });
}
