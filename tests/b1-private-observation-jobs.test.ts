import test from 'node:test';
import assert from 'node:assert/strict';
import { accepted, blocked } from '../packages/bootstrap/src/contracts/local-types.js';
import {
  createB1PrivateObservationJobHandler,
  type B1PrivateObservationJobHandlerDependencies,
} from '../packages/bootstrap/src/workers/b1-private-observation-jobs.js';
import type { B1CrossVenueBacktestRun } from '../packages/bootstrap/src/backtest/b1-cross-venue-backtest.js';
import type { BoundedWorkerJobHandlerContext } from '../packages/bootstrap/src/workers/bounded-job-worker.js';
import type { SurebetWorkerJobRecord } from '../packages/persistence/src/repositories/worker-job-repository.js';
import type { JsonValue } from '../packages/persistence/src/types.js';

const NOW = '2026-08-02T10:00:00.000Z';

test('B1 private observation worker dead-letters invalid payload schemas without persistence calls', async () => {
  const dependencies = createDependencies();
  const handler = createB1PrivateObservationJobHandler(dependencies);
  const result = await handler.run(createContext(Object.freeze({ schema: 'wrong-schema' })));
  assert.equal(result.outcome, 'dead_letter');
  assert.equal(result.errorCode, 'B1_PRIVATE_OBSERVATION_JOB_SCHEMA_INVALID');
  assert.equal(dependencies.calls.length, 0);
});

test('B1 private observation worker rejects fixture runtime-evidence claims', async () => {
  const dependencies = createDependencies();
  const handler = createB1PrivateObservationJobHandler(dependencies);
  const result = await handler.run(createContext(createPayload({ runtimeEvidence: true })));
  assert.equal(result.outcome, 'dead_letter');
  assert.equal(result.errorCode, 'B1_PRIVATE_OBSERVATION_RUNTIME_EVIDENCE_FORBIDDEN');
  assert.equal(dependencies.calls.length, 0);
});

test('B1 private observation worker dead-letters malformed nested fixture input before persistence calls', async () => {
  for (const input of [
    Object.freeze({ plans: Object.freeze([]), quotePolicy: Object.freeze({}) }),
    Object.freeze({ fixture: null, plans: Object.freeze([]), quotePolicy: Object.freeze({}) }),
    Object.freeze({ fixture: Object.freeze([]), plans: Object.freeze([]), quotePolicy: Object.freeze({}) }),
    Object.freeze({ fixture: 'not-a-fixture', plans: Object.freeze([]), quotePolicy: Object.freeze({}) }),
  ] as const) {
    const dependencies = createDependencies();
    const handler = createB1PrivateObservationJobHandler(dependencies);
    const payload = Object.freeze({
      ...(createPayload() as Record<string, JsonValue>),
      input,
    });
    const result = await handler.run(createContext(payload));
    assert.equal(result.outcome, 'dead_letter');
    assert.equal(result.errorCode, 'B1_PRIVATE_OBSERVATION_FIXTURE_INVALID');
    assert.equal(dependencies.calls.length, 0);
  }
});

test('B1 private observation worker dead-letters malformed observedAt before persistence calls', async () => {
  const dependencies = createDependencies();
  const handler = createB1PrivateObservationJobHandler(dependencies);
  const payload = Object.freeze({
    ...(createPayload() as Record<string, JsonValue>),
    observedAt: 'not-an-iso-timestamp',
  });
  const result = await handler.run(createContext(payload));
  assert.equal(result.outcome, 'dead_letter');
  assert.equal(result.errorCode, 'B1_PRIVATE_OBSERVATION_OBSERVED_AT_INVALID');
  assert.equal(dependencies.calls.length, 0);
});

test('B1 private observation worker persists deterministic offline results', async () => {
  const dependencies = createDependencies();
  const handler = createB1PrivateObservationJobHandler(dependencies);
  const result = await handler.run(createContext(createPayload()));
  assert.equal(result.outcome, 'completed');
  assert.deepEqual(dependencies.calls, ['observation.create', 'backtestRuns.create', 'observation.complete']);
  assert.equal((result.successResult as { readonly runtimeEvidence: false }).runtimeEvidence, false);
  assert.equal((result.successResult as { readonly liveReadiness: string }).liveReadiness, 'not_authorized_bws_900_parked');
});

test('B1 private observation worker records blocked offline backtests in the observation ledger', async () => {
  const dependencies = createDependencies({
    runBacktest: () =>
      blocked(
        'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT',
        'B1 offline observation requires sufficient deterministic fixture rows.',
        'Pinned B1 deterministic fixture rows.',
      ),
  });
  const handler = createB1PrivateObservationJobHandler(dependencies);
  const result = await handler.run(createContext(createPayload()));
  assert.equal(result.outcome, 'dead_letter');
  assert.equal(result.errorCode, 'B1_PRIVATE_OBSERVATION_BACKTEST_BLOCKED');
  assert.deepEqual(dependencies.calls, ['observation.create', 'observation.block']);
});

function createDependencies(
  overrides: Partial<B1PrivateObservationJobHandlerDependencies> = {},
): B1PrivateObservationJobHandlerDependencies & { readonly calls: string[] } {
  const calls: string[] = [];
  return {
    backtestRuns: {
      create: (record) => {
        calls.push('backtestRuns.create');
        return Object.freeze({
          executable: false,
          fixtureKind: record.run.report.fixtureKind,
          insertedAt: NOW,
          liveReadiness: record.run.liveReadiness,
          metrics: Object.freeze({}) as JsonValue,
          observedAt: record.observedAt,
          offlineFalsificationStatus: record.run.report.offlineFalsificationStatus,
          report: Object.freeze({}) as JsonValue,
          runHash: record.run.report.runHash,
          runId: record.runId,
          runKind: record.run.runKind,
          runtimeEvidence: false,
          sourceManifestHash: record.run.report.sourceManifestHash,
          upstreamLockFingerprint: record.run.report.upstreamLockFingerprint,
          upstreamReadiness: record.run.report.upstreamReadiness,
        });
      },
    },
    calls,
    observations: {
      block: (record) => {
        calls.push('observation.block');
        return Object.freeze({
          blockerCode: record.blockerCode,
          blockerDetails: record.blockerDetails,
          cycleCompletedAt: record.cycleCompletedAt,
          cycleStartedAt: NOW,
          evidence: record.evidence,
          executable: false,
          insertedAt: NOW,
          observationCycleId: record.observationCycleId,
          queueName: 'b1-private-observation',
          runtimeEvidence: false,
          runtimeId: 'runtime-b1',
          status: 'blocked',
          updatedAt: NOW,
          upstreamCheckpointId: 'checkpoint-b1',
        });
      },
      complete: (record) => {
        calls.push('observation.complete');
        return Object.freeze({
          backtestRunId: record.backtestRunId,
          cycleCompletedAt: record.cycleCompletedAt,
          cycleStartedAt: NOW,
          evidence: record.evidence,
          executable: false,
          insertedAt: NOW,
          observationCycleId: record.observationCycleId,
          queueName: 'b1-private-observation',
          runtimeEvidence: false,
          runtimeId: 'runtime-b1',
          status: 'completed',
          updatedAt: NOW,
          upstreamCheckpointId: 'checkpoint-b1',
        });
      },
      create: (record) => {
        calls.push('observation.create');
        return Object.freeze({
          cycleStartedAt: record.cycleStartedAt,
          evidence: record.evidence,
          executable: false,
          insertedAt: NOW,
          observationCycleId: record.observationCycleId,
          queueName: record.queueName,
          runtimeEvidence: false,
          runtimeId: record.runtimeId,
          status: 'started',
          updatedAt: NOW,
          upstreamCheckpointId: record.upstreamCheckpointId,
          ...(record.workerJobId === undefined ? {} : { workerJobId: record.workerJobId }),
        });
      },
    },
    runBacktest: () => accepted(sampleRun() as unknown as B1CrossVenueBacktestRun),
    ...overrides,
  };
}

function createContext(payload: JsonValue): BoundedWorkerJobHandlerContext {
  return {
    heartbeat: () => sampleJob(payload),
    job: sampleJob(payload),
    leaseDurationMs: 1_000,
    now: () => NOW,
    recordCheckpoint: () => undefined,
  };
}

function sampleJob(payload: JsonValue): SurebetWorkerJobRecord {
  return Object.freeze({
    attemptCount: 1,
    availableAt: NOW,
    checkpointCount: 0,
    insertedAt: NOW,
    jobId: 'job-b1-001',
    jobKind: 'b1_private_observation_cycle_v1',
    payload,
    payloadSha256: '1'.repeat(64),
    queueName: 'b1-private-observation',
    retryDelaysMs: [],
    status: 'leased',
    updatedAt: NOW,
  });
}

function createPayload(
  fixtureOverrides: Readonly<Record<string, JsonValue>> = {},
): JsonValue {
  return Object.freeze({
    backtestRunId: 'b1-backtest-run-001',
    input: Object.freeze({
      fixture: Object.freeze({
        fixtureKind: 'deterministic_b1_multi_venue_fixture',
        manifest: Object.freeze({
          sourceManifestHash: '4'.repeat(64),
          upstreamLockFingerprint: '5'.repeat(64),
        }),
        rows: [],
        runtimeEvidence: false,
        upstreamReadiness: 'blocked_until_betting_win_b1_multi_venue_markets_v1',
        ...fixtureOverrides,
      }),
      plans: [],
      quotePolicy: Object.freeze({}),
    }),
    observationCycleId: 'b1-observation-001',
    observedAt: NOW,
    runtimeId: 'runtime-b1',
    schema: 'bws.b1_private_observation_job.v1',
    upstreamCheckpointId: 'checkpoint-b1',
  });
}

function sampleRun() {
  return Object.freeze({
    candidateResults: [],
    executable: false,
    liveReadiness: 'not_authorized_bws_900_parked' as const,
    report: Object.freeze({
      candidateSummaries: [],
      executable: false,
      falsePositiveReport: accepted(Object.freeze({
        falsePositiveCount: 0,
        falsePositiveRateBps: 0n,
        observationCount: 1,
        reportKind: 'deterministic_b1_false_positive_report' as const,
      })),
      fixtureKind: 'deterministic_b1_multi_venue_fixture' as const,
      liveReadiness: 'not_authorized_bws_900_parked' as const,
      metrics: Object.freeze({
        candidateCount: 1,
        capacityBlockCount: 0,
        falsePositiveRate: Object.freeze({ falsePositiveRateBps: 0n, status: 'accepted' as const }),
        feeBlockCount: 0,
        fillableCandidateCount: 0,
        grossPositiveCount: 0,
        limitBlockCount: 0,
        marketsCompared: 1,
        meanGrossSpreadBps: 0n,
        meanNetSpreadBps: 0n,
        netPositiveCount: 0,
        quoteStalenessBlockCount: 0,
        settlementMismatchBlockCount: 0,
        uniqueEvents: 1,
        venuePairs: 1,
        worstCaseNetMinor: 0n,
      }),
      offlineFalsificationStatus: 'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT' as const,
      reportKind: 'deterministic_b1_cross_venue_backtest_report' as const,
      runHash: '3'.repeat(64),
      runtimeEvidence: false,
      sourceManifestHash: '4'.repeat(64),
      upstreamLockFingerprint: '5'.repeat(64),
      upstreamReadiness: 'blocked_until_betting_win_b1_multi_venue_markets_v1' as const,
    }),
    runKind: 'deterministic_b1_cross_venue_offline_backtest' as const,
  });
}
