import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePinnedBettingWinBundleIntake } from '../src/adapters/betting-win-pinned-bundle-intake.js';
import { runDeterministicStandardBinaryBacktest } from '../src/backtest/standard-binary-backtest.js';
import {
  createBacktestStrategyLedgerEntry,
  createPrivatePaperStrategyLedgerEntry,
  hashSurebetStrategyReport,
  validateBacktestStrategyLedgerEntry,
  validatePrivatePaperStrategyLedgerEntry,
  validateSurebetStrategyLedgerEntry,
} from '../src/strategy/strategy-ledger.js';
import {
  runBoundedPrivatePaperRuntimeCycle,
  type PrivatePaperRuntimeRequest,
} from '../src/runtime/private-paper-runtime.js';
import type { BettingWinUpstreamLock } from '../packages/upstream/src/upstream/betting-win-upstream-lock.js';

const REPO_ROOT = process.cwd();
const TEST_TIMESTAMP = '2026-07-14T10:00:00.000Z';
const SOLVER_READY_BUNDLE = 'tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json';

test('strategy ledger builds deterministic accepted local evidence for equivalent backtest runs', () => {
  const intake = validatePinnedBettingWinBundleIntake(SOLVER_READY_BUNDLE, REPO_ROOT);
  assert.equal(intake.ok, true);

  const firstRun = runDeterministicStandardBinaryBacktest({
    bundle: intake.value.bundle,
    records: intake.value.records,
    executionPlans: [sampleExecutionPlan()],
  });
  const secondRun = runDeterministicStandardBinaryBacktest({
    bundle: intake.value.bundle,
    records: [...intake.value.records].reverse(),
    executionPlans: [sampleExecutionPlan()],
  });

  assert.equal(firstRun.ok, true);
  assert.equal(secondRun.ok, true);

  const firstEntry = createBacktestStrategyLedgerEntry({
    upstreamLock: sampleUpstreamLock(),
    run: firstRun.value,
  });
  const secondEntry = createBacktestStrategyLedgerEntry({
    upstreamLock: sampleUpstreamLock(),
    run: secondRun.value,
  });

  assert.equal(firstEntry.ok, true);
  assert.equal(secondEntry.ok, true);
  assert.equal(firstEntry.value.acceptanceState, 'accepted_local_evidence');
  assert.equal(firstEntry.value.settlementState, 'reconciled');
  assert.equal(firstEntry.value.blockerCount, 0);
  assert.equal(firstEntry.value.report.candidates[0]?.finalOutcome, 'yes');
  assert.equal(validateBacktestStrategyLedgerEntry(firstEntry.value, firstRun.value, sampleUpstreamLock()).ok, true);
  assert.deepEqual(secondEntry.value, firstEntry.value);
});

test('strategy ledger blocks kill-triggered private paper cycles without making a live claim', async () => {
  const intake = validatePinnedBettingWinBundleIntake(SOLVER_READY_BUNDLE, REPO_ROOT);
  assert.equal(intake.ok, true);

  const cycle = await runBoundedPrivatePaperRuntimeCycle({
    runtimeId: 'runtime-kill-001',
    cycleId: 'cycle-kill-001',
    maxCandidatesPerCycle: 1,
    upstreamLock: sampleUpstreamLock(),
    source: {
      kind: 'pinned_records',
      sourceBundleKind: 'resource_export',
      exportedAt: intake.value.bundle.exportedAt,
      sourceManifestHash: intake.value.bundle.reference.manifestHash,
      records: intake.value.records,
    },
    candidatePlans: [
      {
        candidateId: 'market-002',
        decisionTimestamp: '2026-07-01T00:00:02.500Z',
        maxQuoteAgeMs: 2_000,
        manualKill: false,
        residualExposureFloorMinor: 0n,
        completionEvents: [
          { legId: 'market-002:yes', type: 'reserve', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.600Z' },
          { legId: 'market-002:yes', type: 'fill', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.700Z' },
        ],
      },
    ],
  } satisfies PrivatePaperRuntimeRequest);

  assert.equal(cycle.ok, true);
  const entry = createPrivatePaperStrategyLedgerEntry({
    upstreamLock: sampleUpstreamLock(),
    cycle: cycle.value,
  });

  assert.equal(entry.ok, true);
  assert.equal(entry.value.acceptanceState, 'blocked');
  assert.equal(entry.value.settlementState, 'blocked');
  assert.equal(entry.value.report.stopReason, 'kill_triggered');
  assert.equal(entry.value.liveState, 'not_claimed');
  assert.equal(validatePrivatePaperStrategyLedgerEntry(entry.value, cycle.value, sampleUpstreamLock()).ok, true);
});

test('strategy ledger validator rejects run-derived evidence that no longer matches the backtest provenance', () => {
  const intake = validatePinnedBettingWinBundleIntake(SOLVER_READY_BUNDLE, REPO_ROOT);
  assert.equal(intake.ok, true);

  const run = runDeterministicStandardBinaryBacktest({
    bundle: intake.value.bundle,
    records: intake.value.records,
    executionPlans: [sampleExecutionPlan()],
  });
  assert.equal(run.ok, true);

  const entry = createBacktestStrategyLedgerEntry({
    upstreamLock: sampleUpstreamLock(),
    run: run.value,
  });
  assert.equal(entry.ok, true);

  const mutated = {
    ...entry.value,
    sourceManifestHash: 'e'.repeat(64),
    report: {
      ...entry.value.report,
      sourceManifestHash: 'e'.repeat(64),
    },
  };

  const validation = validateBacktestStrategyLedgerEntry(
    {
      ...mutated,
      reportSha256: hashSurebetStrategyReport(mutated.report),
    },
    run.value,
    sampleUpstreamLock(),
  );

  assert.equal(validation.ok, false);
  assert.deepEqual(validation.blockers, [
    {
      code: 'BACKTEST_STRATEGY_LEDGER_MISMATCH',
      message:
        'Surebet strategy ledger evidence must remain byte-for-byte deterministic for the same run provenance and upstream lock.',
      evidenceRequired:
        'Deterministic strategy ledger evidence whose canonical serialization matches the expected run-derived payload.',
    },
  ]);
});

test('strategy ledger validator rejects forbidden language even when the report hash is recomputed', () => {
  const intake = validatePinnedBettingWinBundleIntake(SOLVER_READY_BUNDLE, REPO_ROOT);
  assert.equal(intake.ok, true);

  const run = runDeterministicStandardBinaryBacktest({
    bundle: intake.value.bundle,
    records: intake.value.records,
    executionPlans: [sampleExecutionPlan()],
  });
  assert.equal(run.ok, true);

  const entry = createBacktestStrategyLedgerEntry({
    upstreamLock: sampleUpstreamLock(),
    run: run.value,
  });
  assert.equal(entry.ok, true);

  const forbiddenReport = {
    ...entry.value.report,
    candidates: [
      {
        ...entry.value.report.candidates[0]!,
        candidateId: 'signal-candidate-001',
      },
    ],
  };
  const forbiddenEntry = {
    ...entry.value,
    reportSha256: hashSurebetStrategyReport(forbiddenReport),
    report: forbiddenReport,
  };

  const validation = validateSurebetStrategyLedgerEntry(forbiddenEntry);
  assert.equal(validation.ok, false);
  assert.deepEqual(validation.blockers, [
    {
      code: 'STRATEGY_LEDGER_FORBIDDEN_LANGUAGE',
      message:
        'Surebet strategy ledger reports must not contain profitability, execution, readiness, or signal language.',
      evidenceRequired:
        'Private strategy reports without forbidden profitability, execution, readiness, or signal language.',
    },
  ]);
});

test('strategy ledger validator rejects unsupported mutable report fields even when the report hash is recomputed', () => {
  const intake = validatePinnedBettingWinBundleIntake(SOLVER_READY_BUNDLE, REPO_ROOT);
  assert.equal(intake.ok, true);

  const run = runDeterministicStandardBinaryBacktest({
    bundle: intake.value.bundle,
    records: intake.value.records,
    executionPlans: [sampleExecutionPlan()],
  });
  assert.equal(run.ok, true);

  const entry = createBacktestStrategyLedgerEntry({
    upstreamLock: sampleUpstreamLock(),
    run: run.value,
  });
  assert.equal(entry.ok, true);

  const mutableReport = {
    ...entry.value.report,
    mutableEvidenceNonce: 'nonce-001',
  };
  const mutableEntry = {
    ...entry.value,
    reportSha256: hashSurebetStrategyReport(mutableReport as typeof entry.value.report),
    report: mutableReport as typeof entry.value.report,
  };

  const validation = validateSurebetStrategyLedgerEntry(mutableEntry);
  assert.equal(validation.ok, false);
  assert.deepEqual(validation.blockers, [
    {
      code: 'STRATEGY_LEDGER_REPORT_FIELDS_UNSUPPORTED',
      message:
        'Surebet strategy ledger reports must reject unsupported fields to keep report evidence immutable.',
      evidenceRequired:
        'A strategy report payload containing only the supported deterministic fields.',
    },
  ]);
});

test('strategy ledger validator rejects ambiguous blocked candidate acceptance state summaries', () => {
  const intake = validatePinnedBettingWinBundleIntake(SOLVER_READY_BUNDLE, REPO_ROOT);
  assert.equal(intake.ok, true);

  const run = runDeterministicStandardBinaryBacktest({
    bundle: intake.value.bundle,
    records: intake.value.records,
    executionPlans: [sampleExecutionPlan()],
  });
  assert.equal(run.ok, true);

  const entry = createBacktestStrategyLedgerEntry({
    upstreamLock: sampleUpstreamLock(),
    run: run.value,
  });
  assert.equal(entry.ok, true);

  const ambiguousCandidate = {
    candidateId: entry.value.report.candidates[0]!.candidateId,
    canonicalMarketId: entry.value.report.candidates[0]!.canonicalMarketId,
    resultState: 'blocked' as const,
    blockerCodes: [],
    blockerCount: 0,
  };
  const ambiguousReport = {
    ...entry.value.report,
    acceptanceState: 'blocked' as const,
    settlementState: 'blocked' as const,
    blockedCandidateCount: 1,
    blockerCount: 0,
    candidates: [ambiguousCandidate],
  };
  const ambiguousEntry = {
    ...entry.value,
    acceptanceState: 'blocked' as const,
    settlementState: 'blocked' as const,
    blockedCandidateCount: 1,
    blockerCount: 0,
    reportSha256: hashSurebetStrategyReport(ambiguousReport),
    report: ambiguousReport,
  };

  const validation = validateSurebetStrategyLedgerEntry(ambiguousEntry);
  assert.equal(validation.ok, false);
  assert.deepEqual(validation.blockers, [
    {
      code: 'STRATEGY_LEDGER_CANDIDATE_ACCEPTANCE_STATE_INVALID',
      message:
        'Surebet strategy ledger blocked candidate summaries must carry explicit blocker codes and no accepted-settlement fields.',
      evidenceRequired:
        'Blocked candidate summaries with blocker codes only, without accepted settlement evidence fields.',
    },
  ]);
});

function sampleExecutionPlan() {
  return {
    canonicalMarketId: 'market-002',
    decisionTimestamp: '2026-07-01T00:00:02.500Z',
    maxQuoteAgeMs: 2_000,
    manualKill: false,
    completionEvents: [
      { legId: 'market-002:yes', type: 'reserve' as const, stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.600Z' },
      { legId: 'market-002:no', type: 'reserve' as const, stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.700Z' },
      { legId: 'market-002:yes', type: 'fill' as const, stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.800Z' },
      { legId: 'market-002:no', type: 'fill' as const, stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.900Z' },
    ],
  };
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
