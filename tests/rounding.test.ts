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
