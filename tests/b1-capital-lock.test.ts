import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateB1CapitalLockCharge,
} from '../src/economics/b1-capital-lock.js';

test('B1 capital lock reports deterministic locked capital and cost', () => {
  const result = calculateB1CapitalLockCharge(10_000n, 50n, 10n, Object.freeze({
    lockDurationMs: 86_400_000n,
    annualizedCostBps: 1_000n,
    capitalBufferBps: 100n,
  }));

  assert.equal(result.ok, true);
  assert.equal(result.value.capitalLockedMinor, 10_161n);
  assert.equal(result.value.capitalLockCostMinor, 3n);
  assert.equal(Object.isFrozen(result.value), true);
});

test('B1 capital lock blocks missing explicit policy', () => {
  const result = calculateB1CapitalLockCharge(10_000n, 50n, 10n, undefined as never);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_CAPITAL_LOCK_POLICY_MISSING',
      message: 'B1 net economics requires an explicit capital lock policy.',
      evidenceRequired: 'Explicit B1 capital lock policy.',
    },
  ]);
});

test('B1 capital lock blocks negative carrying-cost inputs', () => {
  const result = calculateB1CapitalLockCharge(10_000n, -1n, 10n, Object.freeze({
    lockDurationMs: 86_400_000n,
    annualizedCostBps: 1_000n,
    capitalBufferBps: 100n,
  }));

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_CAPITAL_LOCK_COST_INPUT_INVALID',
      message: 'B1 capital lock requires non-negative fee and quote-age penalty inputs.',
      evidenceRequired: 'Non-negative B1 fee and quote-age penalty totals.',
    },
  ]);
});
