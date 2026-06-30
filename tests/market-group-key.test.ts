import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMarketGroupKey } from '../src/identity/market-group-key.js';
import { sampleLeg } from './helpers.js';

test('market group key is stable across leg sequence', () => {
  const first = buildMarketGroupKey([sampleLeg('yes'), sampleLeg('no')]);
  const second = buildMarketGroupKey([sampleLeg('no'), sampleLeg('yes')]);
  assert.equal(first, second);
  assert.match(first, /event-001/);
});
