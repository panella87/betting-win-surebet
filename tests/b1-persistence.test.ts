import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SurebetB1BacktestRunRepository,
  SurebetB1PrivateObservationRepository,
  SurebetB1UpstreamConvergenceRepository,
  loadSurebetMigrationFiles,
  type SurebetPersistenceConfig,
} from '../packages/persistence/src/index.js';

const REPO_ROOT = process.cwd();
const SAMPLE_CONFIG: SurebetPersistenceConfig = Object.freeze({
  database: 'not_used_by_fail_fast_tests',
  host: '127.0.0.1',
  port: 5432,
  user: 'surebet',
});

test('BWS-800 B1 persistence migrations are present and surebet-scoped', () => {
  const migrations = loadSurebetMigrationFiles(REPO_ROOT);
  const migrationNames = migrations.map((migration) => migration.migrationName);
  assert.deepEqual(
    migrationNames.slice(-5),
    [
      '008_create_b1_upstream_convergence_checkpoints.sql',
      '009_create_b1_backtest_runs.sql',
      '010_create_b1_candidate_snapshots.sql',
      '011_create_b1_simulation_results.sql',
      '012_create_b1_private_observation_cycles.sql',
    ],
  );
  for (const migration of migrations.slice(-5)) {
    assert.match(migration.sql, /surebet\.b1_/);
    assert.match(migration.sha256, /^[0-9a-f]{64}$/);
  }
});

test('B1 upstream convergence repository rejects runtime evidence claims before persistence', () => {
  const repository = new SurebetB1UpstreamConvergenceRepository(SAMPLE_CONFIG);
  assert.throws(
    () =>
      repository.create({
        blockerCode: 'B1_BLOCKED_UPSTREAM_CONTRACT_ABSENT',
        blockerDetails: Object.freeze({ evidenceRequired: 'accepted betting-win B1 API' }),
        checkpointId: 'checkpoint-invalid-runtime-evidence',
        importedRowCount: 0,
        mode: 'blocked_upstream_contract_absent',
        runtimeEvidence: true,
        sourceManifestHash: '1'.repeat(64),
        upstreamLockFingerprint: '2'.repeat(64),
      } as unknown as Parameters<typeof repository.create>[0]),
    (error: unknown) =>
      error instanceof Error
      && 'code' in error
      && error.code === 'SUREBET_B1_RUNTIME_EVIDENCE_FORBIDDEN',
  );
});

test('B1 backtest run repository rejects execution readiness before persistence', () => {
  const repository = new SurebetB1BacktestRunRepository(SAMPLE_CONFIG);
  assert.throws(
    () =>
      repository.create({
        observedAt: '2026-08-02T10:00:00.000Z',
        run: {
          candidateResults: [],
          executable: true,
          liveReadiness: 'not_authorized_bws_900_parked',
          report: {
            candidateSummaries: [],
            executable: false,
            falsePositiveReport: { ok: true, value: { falsePositiveCount: 0, falsePositiveRateBps: 0n, observationCount: 1, reportKind: 'deterministic_b1_false_positive_report' } },
            fixtureKind: 'deterministic_b1_multi_venue_fixture',
            liveReadiness: 'not_authorized_bws_900_parked',
            metrics: sampleMetrics(),
            offlineFalsificationStatus: 'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT',
            reportKind: 'deterministic_b1_cross_venue_backtest_report',
            runHash: '3'.repeat(64),
            runtimeEvidence: false,
            sourceManifestHash: '4'.repeat(64),
            upstreamLockFingerprint: '5'.repeat(64),
            upstreamReadiness: 'blocked_until_betting_win_b1_multi_venue_markets_v1',
          },
          runKind: 'deterministic_b1_cross_venue_offline_backtest',
        },
        runId: 'run-invalid-executable',
      } as unknown as Parameters<typeof repository.create>[0]),
    (error: unknown) =>
      error instanceof Error
      && 'code' in error
      && error.code === 'SUREBET_B1_EXECUTION_FORBIDDEN',
  );
});

test('B1 backtest run repository rejects forged report markers before persistence', () => {
  const repository = new SurebetB1BacktestRunRepository(SAMPLE_CONFIG);
  for (const [reportOverrides, code] of [
    [{ reportKind: 'unexpected_report' }, 'SUREBET_B1_BACKTEST_REPORT_KIND_INVALID'],
    [{ fixtureKind: 'live_fixture_claim' }, 'SUREBET_B1_FIXTURE_KIND_INVALID'],
    [{ upstreamReadiness: 'ready' }, 'SUREBET_B1_UPSTREAM_READINESS_FORBIDDEN'],
  ] as const) {
    assert.throws(
      () =>
        repository.create({
          observedAt: '2026-08-02T10:00:00.000Z',
          run: {
            ...sampleBacktestRun(),
            report: {
              ...sampleBacktestRun().report,
              ...reportOverrides,
            },
          },
          runId: `run-invalid-${code}`,
        } as unknown as Parameters<typeof repository.create>[0]),
      (error: unknown) =>
        error instanceof Error
        && 'code' in error
        && error.code === code,
    );
  }
});

test('B1 private observation repository rejects executable cycles before persistence', () => {
  const repository = new SurebetB1PrivateObservationRepository(SAMPLE_CONFIG);
  assert.throws(
    () =>
      repository.create({
        cycleStartedAt: '2026-08-02T10:00:00.000Z',
        evidence: Object.freeze({ fixtureKind: 'deterministic_b1_multi_venue_fixture' }),
        executable: true,
        observationCycleId: 'observation-invalid-executable',
        queueName: 'b1-private-observation',
        runtimeEvidence: false,
        runtimeId: 'runtime-b1',
        upstreamCheckpointId: 'checkpoint-b1',
      } as unknown as Parameters<typeof repository.create>[0]),
    (error: unknown) =>
      error instanceof Error
      && 'code' in error
      && error.code === 'SUREBET_B1_PRIVATE_OBSERVATION_POLICY_INVALID',
  );
});

function sampleMetrics() {
  return Object.freeze({
    candidateCount: 0,
    candidateToFillConversionRate: 0,
    capacityBlockCount: 0,
    falsePositiveRate: Object.freeze({ falsePositiveRateBps: 0n, status: 'accepted' as const }),
    feeBlockCount: 0,
    fillableCandidateCount: 0,
    grossPositiveCount: 0,
    limitBlockCount: 0,
    marketsCompared: 0,
    meanGrossSpreadBps: 0n,
    meanNetSpreadBps: 0n,
    netPositiveCount: 0,
    quoteStalenessBlockCount: 0,
    settlementMismatchBlockCount: 0,
    uniqueEvents: 0,
    venuePairs: 0,
    worstCaseNetMinor: 0n,
  });
}

function sampleBacktestRun() {
  return Object.freeze({
    candidateResults: [],
    executable: false,
    liveReadiness: 'not_authorized_bws_900_parked' as const,
    report: Object.freeze({
      candidateSummaries: [],
      executable: false as const,
      falsePositiveReport: Object.freeze({
        ok: true as const,
        value: Object.freeze({
          falsePositiveCount: 0,
          falsePositiveRateBps: 0n,
          observationCount: 1,
          reportKind: 'deterministic_b1_false_positive_report' as const,
        }),
      }),
      fixtureKind: 'deterministic_b1_multi_venue_fixture' as const,
      liveReadiness: 'not_authorized_bws_900_parked' as const,
      metrics: sampleMetrics(),
      offlineFalsificationStatus: 'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT' as const,
      reportKind: 'deterministic_b1_cross_venue_backtest_report' as const,
      runHash: '3'.repeat(64),
      runtimeEvidence: false as const,
      sourceManifestHash: '4'.repeat(64),
      upstreamLockFingerprint: '5'.repeat(64),
      upstreamReadiness: 'blocked_until_betting_win_b1_multi_venue_markets_v1' as const,
    }),
    runKind: 'deterministic_b1_cross_venue_offline_backtest' as const,
  });
}
