import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  compareB1MarketOutcomeSetEquivalence,
  compareB1MarketEquivalence,
} from '../src/identity/b1-market-equivalence.js';
import {
  compareB1SelectionEquivalence,
} from '../src/identity/b1-selection-equivalence.js';
import {
  createB1VenuePairKey,
} from '../src/identity/b1-venue-pair-key.js';
import {
  parseBettingWinB1DeterministicFixture,
} from '../src/contracts/betting-win-b1-resource-records.js';
import type { B1MultiVenueMarketRow } from '../src/contracts/b1-local-types.js';

const FIXTURE_PATH = 'tests/fixtures/b1-local-contract/valid-b1-multi-venue-markets.json';

function fixtureRows(): readonly B1MultiVenueMarketRow[] {
  const raw = JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8')) as unknown;
  const parsed = parseBettingWinB1DeterministicFixture(raw);
  assert.equal(parsed.ok, true);
  return parsed.value.rows;
}

function fixturePair(): [B1MultiVenueMarketRow, B1MultiVenueMarketRow] {
  const rows = fixtureRows();
  const first = rows[0];
  const second = rows[1];
  assert.ok(first);
  assert.ok(second);
  return [first, second];
}

function cloneRow(row: B1MultiVenueMarketRow, overrides: Partial<B1MultiVenueMarketRow>): B1MultiVenueMarketRow {
  return Object.freeze({
    ...row,
    ...overrides,
  });
}

test('B1 market equivalence accepts same market and selection across distinct venues', () => {
  const [first, second] = fixturePair();

  const result = compareB1MarketEquivalence(first, second);

  assert.equal(result.ok, true);
  assert.equal(result.value.marketEquivalenceKey, 'event-001:moneyline:full-game');
  assert.equal(result.value.selection.selectionEquivalenceKey, 'event-001:moneyline:home');
  assert.equal(result.value.venuePair.key, 'venue-a::venue-b');
  assert.equal(result.value.currency, 'USD');
  assert.equal(result.value.voidRuleId, 'void-rule-a');
});

test('B1 selection equivalence rejects different terminal outcome evidence', () => {
  const [first, second] = fixturePair();
  const mismatched = cloneRow(second, {
    selectionEquivalenceKey: 'event-001:moneyline:away',
    outcomeSide: 'away',
  });

  const result = compareB1SelectionEquivalence(first, mismatched);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SELECTION_EQUIVALENCE_MISSING',
      message: 'B1 rows do not share an accepted selection equivalence key.',
      evidenceRequired: 'Matching B1 selection_equivalence_key values.',
    },
  ]);
});

test('B1 market equivalence fails closed on market type mismatch', () => {
  const [first, second] = fixturePair();
  const mismatched = cloneRow(second, { marketType: 'spread' });

  const result = compareB1MarketEquivalence(first, mismatched);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_MARKET_TYPE_MISMATCH',
      message: 'B1 rows must share the same market type before quote comparison.',
      evidenceRequired: 'Matching B1 market_type values.',
    },
  ]);
});

test('B1 market equivalence fails closed on canonical event mismatch', () => {
  const [first, second] = fixturePair();
  const mismatched = cloneRow(second, { canonicalEventId: 'event-002' });

  const result = compareB1MarketEquivalence(first, mismatched);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_MARKET_EQUIVALENCE_MISSING',
      message: 'B1 rows must share the same canonical event before quote comparison.',
      evidenceRequired: 'Matching B1 canonical_event_id values or accepted event equivalence evidence.',
    },
  ]);
});

test('B1 market equivalence fails closed on currency mismatch', () => {
  const [first, second] = fixturePair();
  const mismatched = cloneRow(second, { currency: 'USDC' });

  const result = compareB1MarketEquivalence(first, mismatched);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_CURRENCY_MISMATCH',
      message: 'B1 rows must share the same currency before quote comparison.',
      evidenceRequired: 'Matching B1 currency values.',
    },
  ]);
});

test('B1 market equivalence fails closed on void rule mismatch', () => {
  const [first, second] = fixturePair();
  const mismatched = cloneRow(second, { voidRuleId: 'void-rule-b' });

  const result = compareB1MarketEquivalence(first, mismatched);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_VOID_RULE_MISMATCH',
      message: 'B1 rows must share the same void rule before quote comparison.',
      evidenceRequired: 'Matching B1 void_rule_id values.',
    },
  ]);
});

test('B1 venue pair key fails closed on same venue comparison', () => {
  const [first, second] = fixturePair();
  const sameVenue = cloneRow(second, { venueOrBookmakerId: first.venueOrBookmakerId });

  const result = createB1VenuePairKey(first, sameVenue);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_VENUE_PAIR_SAME_VENUE',
      message: 'B1 venue pair comparison requires two distinct venues.',
      evidenceRequired: 'Two distinct venue_or_bookmaker_id values.',
    },
  ]);
});

test('B1 outcome-set equivalence accepts every terminal outcome across two venues', () => {
  const [homeA, homeB] = fixturePair();
  const awayA = cloneRow(homeA, {
    canonicalSelectionId: 'selection-away-a',
    selectionEquivalenceKey: 'event-001:moneyline:away',
    outcomeName: 'Away',
    outcomeSide: 'away',
  });
  const awayB = cloneRow(homeB, {
    canonicalSelectionId: 'selection-away-b',
    selectionEquivalenceKey: 'event-001:moneyline:away',
    outcomeName: 'Away',
    outcomeSide: 'away',
  });

  const result = compareB1MarketOutcomeSetEquivalence([homeA, awayA], [homeB, awayB]);

  assert.equal(result.ok, true);
  assert.equal(result.value.marketEquivalenceKey, 'event-001:moneyline:full-game');
  assert.equal(result.value.terminalOutcomeCount, 2);
  assert.equal(Object.isFrozen(result.value.selections), true);
  assert.deepEqual(
    result.value.selections.map((selection) => selection.selectionEquivalenceKey),
    ['event-001:moneyline:home', 'event-001:moneyline:away'],
  );
});

test('B1 outcome-set equivalence fails closed on missing terminal outcome', () => {
  const [homeA, homeB] = fixturePair();
  const awayA = cloneRow(homeA, {
    canonicalSelectionId: 'selection-away-a',
    selectionEquivalenceKey: 'event-001:moneyline:away',
    outcomeName: 'Away',
    outcomeSide: 'away',
  });

  const result = compareB1MarketOutcomeSetEquivalence([homeA, awayA], [homeB]);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_OUTCOME_SET_INCOMPLETE',
      message: 'B1 market outcome sets must have the same terminal outcome cardinality.',
      evidenceRequired: 'Matching complete terminal outcome sets for both B1 venues.',
    },
  ]);
});

test('B1 outcome-set equivalence fails closed on duplicate terminal outcome evidence', () => {
  const [homeA, homeB] = fixturePair();
  const duplicateHomeA = cloneRow(homeA, { canonicalSelectionId: 'selection-home-duplicate' });

  const result = compareB1MarketOutcomeSetEquivalence([homeA, duplicateHomeA], [homeB, homeB]);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_OUTCOME_SET_INCOMPLETE',
      message: 'B1 market outcome sets must not contain duplicate terminal outcome evidence.',
      evidenceRequired: 'One row per selection_equivalence_key for each venue.',
    },
  ]);
});
