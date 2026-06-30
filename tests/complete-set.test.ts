import test from 'node:test';
import assert from 'node:assert/strict';
import { validateStandardBinaryCompleteSet } from '../src/scenarios/complete-set.js';
import { sampleLeg } from './helpers.js';

test('standard binary complete set requires yes and no legs', () => {
  assert.equal(validateStandardBinaryCompleteSet([sampleLeg('yes'), sampleLeg('no')]).ok, true);
  assert.equal(validateStandardBinaryCompleteSet([sampleLeg('yes')]).ok, false);
});
