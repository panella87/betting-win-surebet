import test from 'node:test';
import assert from 'node:assert/strict';
import { readLocalBettingWinExportBundle } from '../src/adapters/betting-win-local-bundle-reader.js';
import { parseBettingWinResourceRecords } from '../src/contracts/betting-win-resource-records.js';
import { assembleStandardBinaryCompleteSet } from '../src/scenarios/complete-set.js';
import {
  buildStandardBinaryScenarioCashflowMatrix,
  type ScenarioCashflowLegTerms,
  type ScenarioCashflowMatrix,
  validateScenarioCashflowMatrix,
} from '../src/scenarios/scenario-cashflow.js';

const REPO_ROOT = process.cwd();

test('scenario cash-flow matrix rejects empty input', () => {
  assert.equal(validateScenarioCashflowMatrix([]).ok, false);
});

test('scenario cash-flow matrix accepts non-negative fixed-point rows', () => {
  const result = validateScenarioCashflowMatrix([
    { scenarioId: 'yes_wins', legId: 'leg-yes', stakeMinor: 100n, payoutMinor: 110n, feeMinor: 1n, costMinor: 0n },
    { scenarioId: 'no_wins', legId: 'leg-yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 1n, costMinor: 0n },
  ]);
  assert.equal(result.ok, true);
});

test('scenario cash-flow matrix rejects malformed row shape before field access', () => {
  const result = validateScenarioCashflowMatrix([
    null,
  ] as unknown as ScenarioCashflowMatrix['rows']);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'SCENARIO_CASHFLOW_ROW_INVALID',
      message: 'Scenario cash-flow rows must be structured objects.',
      evidenceRequired: 'Structured scenario cash-flow rows.',
    },
  ]);
});

test('scenario cash-flow matrix rejects malformed row identities before coverage comparison', () => {
  for (const field of ['scenarioId', 'legId'] as const) {
    for (const malformedValue of ['', 100, null, undefined]) {
      const malformedRow = {
        scenarioId: 'yes_wins',
        legId: 'leg-yes',
        stakeMinor: 100n,
        payoutMinor: 110n,
        feeMinor: 1n,
        costMinor: 0n,
        [field]: malformedValue,
      };
      const result = validateScenarioCashflowMatrix([
        malformedRow,
        { scenarioId: 'no_wins', legId: 'leg-yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 1n, costMinor: 0n },
      ] as unknown as ScenarioCashflowMatrix['rows']);

      assert.equal(result.ok, false);
      assert.deepEqual(result.blockers, [
        {
          code: 'SCENARIO_CASHFLOW_IDENTITY_INVALID',
          message: 'Scenario cash-flow rows require non-empty scenario and leg identities.',
          evidenceRequired: 'Non-empty scenarioId and legId values for every cash-flow row.',
        },
      ]);
    }
  }
});

test('scenario cash-flow matrix rejects malformed fixed-point row values before comparisons', () => {
  for (const field of ['stakeMinor', 'payoutMinor', 'feeMinor', 'costMinor'] as const) {
    for (const malformedValue of [100, '100', null, undefined]) {
      const malformedRow = {
        scenarioId: 'yes_wins',
        legId: 'leg-yes',
        stakeMinor: 100n,
        payoutMinor: 110n,
        feeMinor: 1n,
        costMinor: 0n,
        [field]: malformedValue,
      };
      const result = validateScenarioCashflowMatrix([
        malformedRow,
        { scenarioId: 'no_wins', legId: 'leg-yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 1n, costMinor: 0n },
      ] as unknown as ScenarioCashflowMatrix['rows']);

      assert.equal(result.ok, false);
      assert.deepEqual(result.blockers, [
        {
          code: 'SCENARIO_CASHFLOW_VALUE_INVALID',
          message: 'Cash-flow values must be bigint fixed-point amounts.',
          evidenceRequired: 'Bigint fixed-point rows for stake, payout, fee and cost.',
        },
      ]);
    }
  }
});

test('scenario cash-flow matrix rejects omitted standard-binary terminal scenarios', () => {
  const result = validateScenarioCashflowMatrix([
    { scenarioId: 'yes_wins', legId: 'leg-yes', stakeMinor: 100n, payoutMinor: 110n, feeMinor: 1n, costMinor: 0n },
    { scenarioId: 'yes_wins', legId: 'leg-no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 1n, costMinor: 0n },
  ]);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'SCENARIO_CASHFLOW_SCENARIOS_INCOMPLETE',
      message: 'Scenario cash-flow builder requires every standard-binary terminal scenario.',
      evidenceRequired: 'Complete YES-wins and NO-wins scenario coverage.',
    },
  ]);
});

test('scenario cash-flow builder creates deterministic rows for both terminal scenarios', () => {
  const completeSet = loadCompleteSet();
  const result = buildStandardBinaryScenarioCashflowMatrix(completeSet, [
    { legId: 'market-001:yes', stakeMinor: 1000000n, payoutMinor: 1510000n },
    { legId: 'market-001:no', stakeMinor: 1000000n, payoutMinor: 1490000n },
  ]);

  assert.equal(result.ok, true);
  assert.equal(Object.isFrozen(result.value.rows), true);
  assert.deepEqual(result.value.rows, [
    {
      scenarioId: 'yes_wins',
      legId: 'market-001:yes',
      stakeMinor: 1000000n,
      payoutMinor: 1510000n,
      feeMinor: 25n,
      costMinor: 0n,
    },
    {
      scenarioId: 'yes_wins',
      legId: 'market-001:no',
      stakeMinor: 1000000n,
      payoutMinor: 0n,
      feeMinor: 20n,
      costMinor: 5n,
    },
    {
      scenarioId: 'no_wins',
      legId: 'market-001:yes',
      stakeMinor: 1000000n,
      payoutMinor: 0n,
      feeMinor: 25n,
      costMinor: 0n,
    },
    {
      scenarioId: 'no_wins',
      legId: 'market-001:no',
      stakeMinor: 1000000n,
      payoutMinor: 1490000n,
      feeMinor: 20n,
      costMinor: 5n,
    },
  ]);
});

test('scenario cash-flow builder rejects incomplete scenario coverage before row construction', () => {
  const completeSet = loadCompleteSet();
  const result = buildStandardBinaryScenarioCashflowMatrix(
    {
      ...completeSet,
      scenarioIds: ['yes_wins'],
    },
    [
      { legId: 'market-001:yes', stakeMinor: 1000000n, payoutMinor: 1510000n },
      { legId: 'market-001:no', stakeMinor: 1000000n, payoutMinor: 1490000n },
    ],
  );

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'SCENARIO_CASHFLOW_SCENARIOS_INCOMPLETE',
      message: 'Scenario cash-flow builder requires every standard-binary terminal scenario.',
      evidenceRequired: 'Complete YES-wins and NO-wins scenario coverage.',
    },
  ]);
});

test('scenario cash-flow builder rejects malformed leg-term values before row construction', () => {
  const completeSet = loadCompleteSet();

  const malformedShape = buildStandardBinaryScenarioCashflowMatrix(completeSet, [
    null,
    { legId: 'market-001:no', stakeMinor: 1000000n, payoutMinor: 1490000n },
  ] as unknown as readonly ScenarioCashflowLegTerms[]);
  assert.equal(malformedShape.ok, false);
  assert.deepEqual(malformedShape.blockers, [
    {
      code: 'SCENARIO_CASHFLOW_LEG_TERMS_INVALID',
      message: 'Scenario cash-flow terms must be structured objects.',
      evidenceRequired: 'Structured stake and payout terms for each complete-set leg.',
    },
  ]);

  const malformedLegId = buildStandardBinaryScenarioCashflowMatrix(completeSet, [
    { legId: 100, stakeMinor: 1000000n, payoutMinor: 1510000n },
    { legId: 'market-001:no', stakeMinor: 1000000n, payoutMinor: 1490000n },
  ] as unknown as readonly ScenarioCashflowLegTerms[]);
  assert.equal(malformedLegId.ok, false);
  assert.deepEqual(malformedLegId.blockers, [
    {
      code: 'SCENARIO_CASHFLOW_LEG_TERMS_INVALID',
      message: 'Scenario cash-flow terms require non-empty leg identities.',
      evidenceRequired: 'Non-empty legId values for each complete-set leg term.',
    },
  ]);

  const malformedStake = buildStandardBinaryScenarioCashflowMatrix(completeSet, [
    { legId: 'market-001:yes', stakeMinor: 1000000, payoutMinor: 1510000n },
    { legId: 'market-001:no', stakeMinor: 1000000n, payoutMinor: 1490000n },
  ] as unknown as readonly ScenarioCashflowLegTerms[]);
  assert.equal(malformedStake.ok, false);
  assert.deepEqual(malformedStake.blockers, [
    {
      code: 'SCENARIO_CASHFLOW_STAKE_INVALID',
      message: 'Scenario cash-flow stakes must be bigint fixed-point amounts.',
      evidenceRequired: 'Bigint fixed-point stake amounts for each complete-set leg.',
    },
  ]);

  const malformedPayout = buildStandardBinaryScenarioCashflowMatrix(completeSet, [
    { legId: 'market-001:yes', stakeMinor: 1000000n, payoutMinor: '1510000' },
    { legId: 'market-001:no', stakeMinor: 1000000n, payoutMinor: 1490000n },
  ] as unknown as readonly ScenarioCashflowLegTerms[]);
  assert.equal(malformedPayout.ok, false);
  assert.deepEqual(malformedPayout.blockers, [
    {
      code: 'SCENARIO_CASHFLOW_PAYOUT_INVALID',
      message: 'Scenario cash-flow payouts must be bigint fixed-point amounts.',
      evidenceRequired: 'Bigint fixed-point payout amounts for each complete-set leg.',
    },
  ]);
});

test('scenario cash-flow builder rejects missing and negative leg terms', () => {
  const completeSet = loadCompleteSet();

  const missingTerms = buildStandardBinaryScenarioCashflowMatrix(completeSet, [
    { legId: 'market-001:yes', stakeMinor: 1000000n, payoutMinor: 1510000n },
  ]);
  assert.equal(missingTerms.ok, false);
  assert.deepEqual(missingTerms.blockers, [
    {
      code: 'SCENARIO_CASHFLOW_TERMS_INCOMPLETE',
      message: 'Scenario cash-flow builder requires one stake and payout pair for every complete-set leg.',
      evidenceRequired: 'One deterministic stake and payout pair for each complete-set leg.',
    },
  ]);

  const negativePayout = buildStandardBinaryScenarioCashflowMatrix(completeSet, [
    { legId: 'market-001:yes', stakeMinor: 1000000n, payoutMinor: -1n },
    { legId: 'market-001:no', stakeMinor: 1000000n, payoutMinor: 1490000n },
  ]);
  assert.equal(negativePayout.ok, false);
  assert.deepEqual(negativePayout.blockers, [
    {
      code: 'SCENARIO_CASHFLOW_PAYOUT_NEGATIVE',
      message: 'Scenario cash-flow payouts must be non-negative fixed-point amounts.',
      evidenceRequired: 'Non-negative fixed-point payout amounts for each complete-set leg.',
    },
  ]);
});

function loadCompleteSet() {
  const bundle = readLocalBettingWinExportBundle(
    'tests/fixtures/local-only-export-bundles/valid-resource-records-export.json',
    REPO_ROOT,
  );
  assert.equal(bundle.ok, true);

  const records = parseBettingWinResourceRecords(bundle.value.records);
  assert.equal(records.ok, true);

  const completeSet = assembleStandardBinaryCompleteSet([
    ...records.value,
    {
      recordType: 'quotes' as const,
      canonicalMarketId: 'market-001',
      outcome: 'no' as const,
      quoteSourceManifestHash: 'e'.repeat(64),
      minStakeMinor: 1000n,
      feeMinor: 20n,
      costMinor: 5n,
      evidence: {
        evidenceId: 'quote-002',
        observedAt: '2026-07-01T00:00:02.000Z',
        priceMinor: 490000n,
        availableSizeMinor: 1200000n,
        currency: 'USDC' as const,
      },
    },
  ]);
  assert.equal(completeSet.ok, true);

  return completeSet.value;
}
