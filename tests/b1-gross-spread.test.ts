import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildB1GrossQuoteContribution,
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

test('B1 gross spread rejects malformed top-level quote containers without throwing', () => {
  const malformedInputs = calculateB1GrossSpread(null as never);
  assert.equal(malformedInputs.ok, false);
  assert.deepEqual(malformedInputs.blockers, [
    {
      code: 'B1_GROSS_QUOTE_INPUTS_INVALID',
      message: 'B1 gross spread requires quote inputs as an array.',
      evidenceRequired: 'Array of structured B1 terminal outcome quotes.',
    },
  ]);

  const malformedQuote = buildB1GrossQuoteContribution(null as never);
  assert.equal(malformedQuote.ok, false);
  assert.deepEqual(malformedQuote.blockers, [
    {
      code: 'B1_GROSS_QUOTE_INVALID',
      message: 'B1 gross spread requires structured quote inputs with string identity and odds fields.',
      evidenceRequired: 'Structured B1 quote input fields.',
    },
  ]);

  const malformedQuoteInArray = calculateB1GrossSpread(Object.freeze([
    null,
    {
      selectionEquivalenceKey: 'event-001:moneyline:away',
      outcomeName: 'Away',
      outcomeSide: 'away',
      venueOrBookmakerId: 'venue-b',
      decimalOdds: '2.10',
    },
  ] as never));
  assert.equal(malformedQuoteInArray.ok, false);
  assert.equal(malformedQuoteInArray.blockers[0]?.code, 'B1_GROSS_QUOTE_INVALID');

  for (const malformedEntry of [undefined, {}, []]) {
    const malformedEntryResult = calculateB1GrossSpread(Object.freeze([
      malformedEntry,
      {
        selectionEquivalenceKey: 'event-001:moneyline:away',
        outcomeName: 'Away',
        outcomeSide: 'away',
        venueOrBookmakerId: 'venue-b',
        decimalOdds: '2.10',
      },
    ] as never));
    assert.equal(malformedEntryResult.ok, false);
    assert.equal(malformedEntryResult.blockers[0]?.code, 'B1_GROSS_QUOTE_INVALID');
  }
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
