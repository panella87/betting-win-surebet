import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeFeeCostModel } from '../src/quotes/fee-cost-model.js';

test('fee cost model rejects malformed containers without throwing', () => {
  for (const model of [undefined, null, [], 'model']) {
    assert.doesNotThrow(() => {
      const result = normalizeFeeCostModel(model as never);

      assert.equal(result.ok, false);
      assert.deepEqual(result.blockers, [
        {
          code: 'FEE_COST_MODEL_INVALID',
          message: 'Fee and cost model must be a structured object.',
          evidenceRequired: 'Structured outcome-specific fee and cost model.',
        },
      ]);
    });
  }
});

test('fee cost model rejects missing and non-bigint fixed costs', () => {
  for (const fixedCostMinor of [undefined, 0, '0', null]) {
    const result = normalizeFeeCostModel({
      feeBps: 0,
      fixedCostMinor,
    } as never);

    assert.equal(result.ok, false);
    assert.deepEqual(result.blockers, [
      {
        code: 'FIXED_COST_INVALID',
        message: 'Fixed costs must be non-negative fixed-point amounts.',
        evidenceRequired: 'Outcome-specific cost model.',
      },
    ]);
  }
});
