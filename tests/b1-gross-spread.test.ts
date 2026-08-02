import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateB1GrossSpread,
  parseB1DecimalOddsMicro,
} from '../src/opportunity/b1-gross-spread.js';

test('B1 gross spread uses conservative fixed-point implied probability arithmetic', () => {
  const result = calculateB1GrossSpread(Object.freeze([
    {
      selectionEquivalenceKey: 'event-001:moneyline:home',
      outcomeName: 'Home',
      outcomeSide: 'home',
      venueOrBookmakerId: 'venue-a',
      decimalOdds: '2.10',
    },
    {
      selectionEquivalenceKey: 'event-001:moneyline:away',
      outcomeName: 'Away',
      outcomeSide: 'away',
      venueOrBookmakerId: 'venue-b',
      decimalOdds: '2.10',
    },
  ]));

  assert.equal(result.ok, true);
  assert.equal(result.value.grossSpreadKind, 'gross_only');
  assert.equal(result.value.impliedProbabilityPpmSum, 952382n);
  assert.equal(result.value.grossSpreadPpm, 47618n);
  assert.equal(Object.isFrozen(result.value.quoteContributions), true);
});

test('B1 gross spread blocks non-positive gross opportunities', () => {
  const result = calculateB1GrossSpread(Object.freeze([
    {
      selectionEquivalenceKey: 'event-001:moneyline:home',
      outcomeName: 'Home',
      outcomeSide: 'home',
      venueOrBookmakerId: 'venue-a',
      decimalOdds: '1.90',
    },
    {
      selectionEquivalenceKey: 'event-001:moneyline:away',
      outcomeName: 'Away',
      outcomeSide: 'away',
      venueOrBookmakerId: 'venue-b',
      decimalOdds: '1.90',
    },
  ]));

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_GROSS_SPREAD_NOT_POSITIVE',
      message: 'B1 gross derivation requires the selected terminal outcome odds to sum below one implied probability.',
      evidenceRequired: 'Cross-venue terminal outcome quotes with positive gross spread before net economics.',
    },
  ]);
});

test('B1 decimal odds parser rejects unsupported precision instead of rounding', () => {
  const result = parseB1DecimalOddsMicro('2.1234567');

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_DECIMAL_ODDS_PRECISION_UNSUPPORTED',
      message: 'B1 gross spread requires decimal odds precision no finer than six decimal places.',
      evidenceRequired: 'B1 decimal_odds with at most six fractional digits.',
    },
  ]);
});
