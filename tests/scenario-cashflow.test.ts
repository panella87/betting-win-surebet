import test from 'node:test';
import assert from 'node:assert/strict';
import { validateScenarioCashflowMatrix } from '../src/scenarios/scenario-cashflow.js';

test('scenario cash-flow matrix rejects empty input', () => {
  assert.equal(validateScenarioCashflowMatrix([]).ok, false);
});

test('scenario cash-flow matrix accepts non-negative fixed-point rows', () => {
  const result = validateScenarioCashflowMatrix([{ scenarioId: 'yes_wins', legId: 'leg-yes', stakeMinor: 100n, payoutMinor: 110n, feeMinor: 1n, costMinor: 0n }]);
  assert.equal(result.ok, true);
});
