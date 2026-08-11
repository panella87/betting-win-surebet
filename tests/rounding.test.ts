import test from 'node:test';
import assert from 'node:assert/strict';
import { toMinorUnits } from '../src/solver/rounding.js';

test('fixed-point conversion pads to scale', () => {
  const result = toMinorUnits('12.34', 6);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value, 12_340_000n);
});

test('fixed-point conversion rejects excessive precision', () => {
  assert.equal(toMinorUnits('1.123', 2).ok, false);
});

test('fixed-point conversion rejects invalid scale values deterministically', () => {
  for (const scale of [Number.NaN, 2.5, -1, 19, Number.MAX_SAFE_INTEGER, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    const result = toMinorUnits('1.2', scale);
    assert.equal(result.ok, false);
    assert.deepEqual(result.blockers, [
      {
        code: 'FIXED_POINT_SCALE_INVALID',
        message: 'Scale must be a finite non-negative integer.',
        evidenceRequired: 'Finite non-negative fixed-point scale.',
      },
    ]);
  }
});
