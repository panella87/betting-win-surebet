import test from 'node:test';
import assert from 'node:assert/strict';
import { settlementReplayStatus } from '../src/simulation/settlement-replay.js';

test('settlement replay is blocked until upstream replay bundle exists', () => {
  assert.equal(settlementReplayStatus().ok, false);
});
