import test from 'node:test';
import assert from 'node:assert/strict';
import { FIRST_LANE_SPEC } from '../src/contracts/local-types.js';
import { toBettingWinReference } from '../src/contracts/betting-win-contract-imports.js';

test('first lane is paper-only with direct provider connection prohibited', () => {
  assert.equal(FIRST_LANE_SPEC.laneId, 'polymarket_standard_binary_complete_set_v0');
  assert.equal(FIRST_LANE_SPEC.mode, 'paper_only');
  assert.equal(FIRST_LANE_SPEC.providerConnection, 'prohibited');
});

test('contract metadata must come from betting-win with a manifest hash', () => {
  const result = toBettingWinReference({ packageName: '@internal/betting-win-contracts', version: '0.0.0-test', schemaVersion: 'fixture', manifestHash: 'a'.repeat(64), generatedBy: 'betting-win' });
  assert.equal(result.ok, true);
});
