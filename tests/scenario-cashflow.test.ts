import test from 'node:test';
import assert from 'node:assert/strict';
import { readLocalBettingWinExportBundle } from '../src/adapters/betting-win-local-bundle-reader.js';
import { parseBettingWinResourceRecords } from '../src/contracts/betting-win-resource-records.js';
import { assembleStandardBinaryCompleteSet } from '../src/scenarios/complete-set.js';
import {
  buildStandardBinaryScenarioCashflowMatrix,
  validateScenarioCashflowMatrix,
} from '../src/scenarios/scenario-cashflow.js';

const REPO_ROOT = process.cwd();

test('scenario cash-flow matrix rejects empty input', () => {
  assert.equal(validateScenarioCashflowMatrix([]).ok, false);
});

test('scenario cash-flow matrix accepts non-negative fixed-point rows', () => {
  const result = validateScenarioCashflowMatrix([
    { scenarioId: 'yes_wins', legId: 'leg-yes', stakeMinor: 100n, payoutMinor: 110n, feeMinor: 1n, costMinor: 0n },
  ]);
  assert.equal(result.ok, true);
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
