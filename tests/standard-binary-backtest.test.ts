import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePinnedBettingWinBundleIntake } from '../src/adapters/betting-win-pinned-bundle-intake.js';
import { runDeterministicStandardBinaryBacktest } from '../src/backtest/standard-binary-backtest.js';

const REPO_ROOT = process.cwd();
const SOLVER_READY_BUNDLE = 'tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json';

test('deterministic standard-binary backtest reconciles a pinned resource export and keeps the run hash stable across record ordering', () => {
  const intake = validatePinnedBettingWinBundleIntake(SOLVER_READY_BUNDLE, REPO_ROOT);
  assert.equal(intake.ok, true);

  const executionPlans = [
      {
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
    },
  ];

  const firstRun = runDeterministicStandardBinaryBacktest({
    bundle: intake.value.bundle,
    records: intake.value.records,
    executionPlans,
  });
  assert.equal(firstRun.ok, true);
  assert.match(firstRun.value.runHash, /^[0-9a-f]{64}$/);
  assert.equal(firstRun.value.acceptedCandidateCount, 1);
  assert.equal(firstRun.value.blockedCandidateCount, 0);

  const acceptedCandidate = firstRun.value.candidateResults[0];
  assert.equal(acceptedCandidate?.ok, true);
  if (acceptedCandidate?.ok !== true) {
    throw new Error('Expected accepted backtest candidate result.');
  }
  assert.equal(acceptedCandidate.candidateId, 'market-002');
  assert.equal(acceptedCandidate.completionGroupState, 'group_complete');
  assert.equal(acceptedCandidate.settlement.finalOutcome, 'yes');
  assert.equal(acceptedCandidate.settlement.scenarioId, 'yes_wins');
  assert.equal(acceptedCandidate.settledNetMinor, 5n);
  assert.deepEqual(acceptedCandidate.filledLegIds, ['market-002:no', 'market-002:yes']);
  assert.deepEqual(acceptedCandidate.excludedLegIds, []);

  const secondRun = runDeterministicStandardBinaryBacktest({
    bundle: intake.value.bundle,
    records: [...intake.value.records].reverse(),
    executionPlans,
  });
  assert.equal(secondRun.ok, true);
  assert.equal(secondRun.value.runHash, firstRun.value.runHash);
  assert.deepEqual(secondRun.value, firstRun.value);
});

test('deterministic standard-binary backtest keeps the run hash stable when cross-leg completion events share a timestamp', () => {
  const intake = validatePinnedBettingWinBundleIntake(SOLVER_READY_BUNDLE, REPO_ROOT);
  assert.equal(intake.ok, true);

  const orderedExecutionPlan = {
    canonicalMarketId: 'market-002',
    decisionTimestamp: '2026-07-01T00:00:02.500Z',
    maxQuoteAgeMs: 2_000,
    manualKill: false,
    completionEvents: [
      { legId: 'market-002:yes', type: 'reserve' as const, stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.600Z' },
      { legId: 'market-002:no', type: 'reserve' as const, stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.600Z' },
      { legId: 'market-002:yes', type: 'fill' as const, stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.800Z' },
      { legId: 'market-002:no', type: 'fill' as const, stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.800Z' },
    ],
  };
  const [orderedYesReserve, orderedNoReserve, orderedYesFill, orderedNoFill] = orderedExecutionPlan.completionEvents;

  const reorderedExecutionPlan = {
    ...orderedExecutionPlan,
    completionEvents: [
      orderedNoReserve!,
      orderedYesReserve!,
      orderedNoFill!,
      orderedYesFill!,
    ],
  };

  const firstRun = runDeterministicStandardBinaryBacktest({
    bundle: intake.value.bundle,
    records: intake.value.records,
    executionPlans: [orderedExecutionPlan],
  });
  const secondRun = runDeterministicStandardBinaryBacktest({
    bundle: intake.value.bundle,
    records: intake.value.records,
    executionPlans: [reorderedExecutionPlan],
  });

  assert.equal(firstRun.ok, true);
  assert.equal(secondRun.ok, true);
  assert.equal(secondRun.value.runHash, firstRun.value.runHash);
  assert.deepEqual(secondRun.value, firstRun.value);
});

test('deterministic standard-binary backtest binds the run hash to canonical source-record provenance', () => {
  const intake = validatePinnedBettingWinBundleIntake(SOLVER_READY_BUNDLE, REPO_ROOT);
  assert.equal(intake.ok, true);

  const executionPlans = [
    {
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
    },
  ];

  const baselineRun = runDeterministicStandardBinaryBacktest({
    bundle: intake.value.bundle,
    records: intake.value.records,
    executionPlans,
  });
  assert.equal(baselineRun.ok, true);

  const provenanceAdjustedBundle = {
    ...intake.value.bundle,
    records: intake.value.bundle.records.map((record) => adjustRawYesQuoteManifest(record, '1'.repeat(64))),
  };
  const provenanceAdjustedRecords = intake.value.records.map((record) =>
    record.recordType === 'quotes' && record.outcome === 'yes'
      ? { ...record, quoteSourceManifestHash: '1'.repeat(64) }
      : record,
  );

  const provenanceAdjustedRun = runDeterministicStandardBinaryBacktest({
    bundle: provenanceAdjustedBundle,
    records: provenanceAdjustedRecords,
    executionPlans,
  });
  assert.equal(provenanceAdjustedRun.ok, true);
  assert.notEqual(provenanceAdjustedRun.value.runHash, baselineRun.value.runHash);
  assert.deepEqual(provenanceAdjustedRun.value.candidateResults, baselineRun.value.candidateResults);
});

test('deterministic standard-binary backtest rejects parsed records that do not match the pinned bundle provenance', () => {
  const intake = validatePinnedBettingWinBundleIntake(SOLVER_READY_BUNDLE, REPO_ROOT);
  assert.equal(intake.ok, true);

  const mismatchedRecords = intake.value.records.map((record) =>
    record.recordType === 'quotes' && record.outcome === 'yes'
      ? { ...record, quoteSourceManifestHash: '1'.repeat(64) }
      : record,
  );

  const result = runDeterministicStandardBinaryBacktest({
    bundle: intake.value.bundle,
    records: mismatchedRecords,
    executionPlans: [
      {
        canonicalMarketId: 'market-002',
        decisionTimestamp: '2026-07-01T00:00:02.500Z',
        maxQuoteAgeMs: 2_000,
        manualKill: false,
        completionEvents: [
          { legId: 'market-002:yes', type: 'fill' as const, stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.800Z' },
          { legId: 'market-002:no', type: 'fill' as const, stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.900Z' },
        ],
      },
    ],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'BACKTEST_SOURCE_RECORDS_PROVENANCE_MISMATCH',
      message: 'Deterministic standard-binary backtesting requires the parsed record set to match the pinned bundle records exactly.',
      evidenceRequired: 'Parsed betting-win resource records canonically matching the pinned bundle contents.',
    },
  ]);
});

function adjustRawYesQuoteManifest(record: unknown, quoteSourceManifestHash: string): unknown {
  if (typeof record !== 'object' || record === null) {
    return record;
  }
  const candidate = record as Record<string, unknown>;
  if (candidate.recordType !== 'quotes' || candidate.outcome !== 'yes') {
    return record;
  }
  return { ...candidate, quoteSourceManifestHash };
}

test('deterministic standard-binary backtest rejects unsupported bundle kinds', () => {
  const intake = validatePinnedBettingWinBundleIntake(SOLVER_READY_BUNDLE, REPO_ROOT);
  assert.equal(intake.ok, true);

  const result = runDeterministicStandardBinaryBacktest({
    bundle: {
      ...intake.value.bundle,
      bundleKind: 'read_only_query_export',
    },
    records: intake.value.records,
    executionPlans: [
      {
        canonicalMarketId: 'market-002',
        decisionTimestamp: '2026-07-01T00:00:02.500Z',
        maxQuoteAgeMs: 1_000,
        manualKill: false,
        completionEvents: [
          { legId: 'market-002:yes', type: 'fill' as const, stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.800Z' },
        ],
      },
    ],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'BACKTEST_EXPORT_KIND_UNSUPPORTED',
      message: 'Deterministic standard-binary backtesting currently supports only resource_export bundles.',
      evidenceRequired: 'Pinned betting-win resource_export bundle for deterministic backtesting.',
    },
  ]);
});

test('deterministic standard-binary backtest rejects ambiguous per-leg completion event timestamp ties', () => {
  const intake = validatePinnedBettingWinBundleIntake(SOLVER_READY_BUNDLE, REPO_ROOT);
  assert.equal(intake.ok, true);

  const result = runDeterministicStandardBinaryBacktest({
    bundle: intake.value.bundle,
    records: intake.value.records,
    executionPlans: [
      {
        canonicalMarketId: 'market-002',
        decisionTimestamp: '2026-07-01T00:00:02.500Z',
        maxQuoteAgeMs: 2_000,
        manualKill: false,
        completionEvents: [
          { legId: 'market-002:yes', type: 'reserve' as const, stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.600Z' },
          { legId: 'market-002:yes', type: 'fill' as const, stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.600Z' },
          { legId: 'market-002:no', type: 'fill' as const, stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.900Z' },
        ],
      },
    ],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'BACKTEST_COMPLETION_EVENT_ORDER_AMBIGUOUS',
      message:
        'Deterministic standard-binary backtesting requires an unambiguous per-leg ordering for completion events when timestamps tie.',
      evidenceRequired: 'Completion replay events with distinct per-leg timestamps or an explicit per-leg sequence.',
    },
  ]);
});

test('deterministic standard-binary backtest fails closed on settlement look-ahead leakage', () => {
  const intake = validatePinnedBettingWinBundleIntake(SOLVER_READY_BUNDLE, REPO_ROOT);
  assert.equal(intake.ok, true);

  const result = runDeterministicStandardBinaryBacktest({
    bundle: intake.value.bundle,
    records: intake.value.records,
    executionPlans: [
      {
        canonicalMarketId: 'market-002',
        decisionTimestamp: '2026-07-01T00:05:00.000Z',
        maxQuoteAgeMs: 600_000,
        manualKill: false,
        completionEvents: [
          { legId: 'market-002:yes', type: 'fill' as const, stakeMinor: 100n, occurredAt: '2026-07-01T00:05:01.000Z' },
        ],
      },
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.acceptedCandidateCount, 0);
  assert.equal(result.value.blockedCandidateCount, 1);
  assert.deepEqual(result.value.candidateResults, [
    {
      ok: false,
      candidateId: 'market-002',
      canonicalMarketId: 'market-002',
      blockers: [
        {
          code: 'BACKTEST_LOOKAHEAD_SETTLEMENT_REPLAY',
          message: 'Deterministic standard-binary backtesting rejects settlement replay evidence available at or before the decision timestamp.',
          evidenceRequired: 'Pinned betting-win settlement replay evidence strictly after the backtest decision timestamp.',
        },
      ],
    },
  ]);
});

test('deterministic standard-binary backtest preserves settlement replay authority conflicts inside the candidate result', () => {
  const intake = validatePinnedBettingWinBundleIntake(SOLVER_READY_BUNDLE, REPO_ROOT);
  assert.equal(intake.ok, true);

  const acceptedSettlement = intake.value.records.find((record) => record.recordType === 'settlement');
  assert.notEqual(acceptedSettlement, undefined);
  if (acceptedSettlement === undefined || acceptedSettlement.recordType !== 'settlement') {
    throw new Error('Expected pinned test fixture settlement record.');
  }

  const mismatchedRecords = [
    ...intake.value.records,
    {
      ...acceptedSettlement,
      replayManifestHash: '8'.repeat(64),
      replayAcceptedAt: '2026-07-01T00:06:00.000Z',
      finalityAuthorityId: 'authority-mismatch',
    },
  ];
  const mismatchedBundle = {
    ...intake.value.bundle,
    records: [
      ...intake.value.bundle.records,
      {
        ...acceptedSettlement,
        replayManifestHash: '8'.repeat(64),
        replayAcceptedAt: '2026-07-01T00:06:00.000Z',
        finalityAuthorityId: 'authority-mismatch',
      },
    ],
  };

  const result = runDeterministicStandardBinaryBacktest({
    bundle: mismatchedBundle,
    records: mismatchedRecords,
    executionPlans: [
      {
        canonicalMarketId: 'market-002',
        decisionTimestamp: '2026-07-01T00:00:02.500Z',
        maxQuoteAgeMs: 2_000,
        manualKill: false,
        completionEvents: [
          { legId: 'market-002:yes', type: 'fill' as const, stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.800Z' },
          { legId: 'market-002:no', type: 'fill' as const, stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.900Z' },
        ],
      },
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.acceptedCandidateCount, 0);
  assert.equal(result.value.blockedCandidateCount, 1);
  assert.deepEqual(result.value.candidateResults, [
    {
      ok: false,
      candidateId: 'market-002',
      canonicalMarketId: 'market-002',
      blockers: [
        {
          code: 'SETTLEMENT_REPLAY_FINALITY_AUTHORITY_MISMATCH',
          message: 'Settlement replay consumption requires one finality authority across accepted replay corrections.',
          evidenceRequired: 'Accepted settlement replay records from one finality authority for the complete-set.',
        },
      ],
    },
  ]);
});
