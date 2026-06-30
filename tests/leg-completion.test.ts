import test from 'node:test';
import assert from 'node:assert/strict';
import { legCompletionSimulationStatus } from '../src/simulation/leg-completion.js';

test('leg completion simulation is blocked in SURE-001', () => {
  assert.equal(legCompletionSimulationStatus().ok, false);
});
