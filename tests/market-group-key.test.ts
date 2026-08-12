import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMarketGroupKey } from '../src/identity/market-group-key.js';
import { sampleLeg } from './helpers.js';

test('market group key is stable across leg sequence', () => {
  const first = buildMarketGroupKey([sampleLeg('yes'), sampleLeg('no')]);
  const second = buildMarketGroupKey([sampleLeg('no'), sampleLeg('yes')]);
  assert.equal(first, second);
  assert.equal(first, JSON.stringify([[
    'event-001',
    'market-001',
    'generation-001',
    'rules-001',
    'result-source-001',
    'finality-001',
    'standard_binary_terminal_scenarios_v0',
  ]]));
});

test('market group key preserves distinct upstream identity strings', () => {
  const withSpace = buildMarketGroupKey([
    {
      ...sampleLeg('yes'),
      market: {
        ...sampleLeg('yes').market,
        canonicalEventId: 'event 001',
      },
    },
  ]);
  const withUnderscore = buildMarketGroupKey([
    {
      ...sampleLeg('yes'),
      market: {
        ...sampleLeg('yes').market,
        canonicalEventId: 'event_001',
      },
    },
  ]);
  const withUppercase = buildMarketGroupKey([
    {
      ...sampleLeg('yes'),
      market: {
        ...sampleLeg('yes').market,
        canonicalEventId: 'Event-001',
      },
    },
  ]);
  const withLowercase = buildMarketGroupKey([sampleLeg('yes')]);

  assert.notEqual(withSpace, withUnderscore);
  assert.notEqual(withUppercase, withLowercase);
});

test('market group key encodes tuple parts without delimiter collisions', () => {
  const splitDelimiter = buildMarketGroupKey([
    {
      ...sampleLeg('yes'),
      market: {
        ...sampleLeg('yes').market,
        canonicalEventId: 'event|001',
        canonicalMarketId: 'market::001',
      },
    },
  ]);
  const shiftedDelimiter = buildMarketGroupKey([
    {
      ...sampleLeg('yes'),
      market: {
        ...sampleLeg('yes').market,
        canonicalEventId: 'event',
        canonicalMarketId: '001|market::001',
      },
    },
  ]);

  assert.notEqual(splitDelimiter, shiftedDelimiter);
});
