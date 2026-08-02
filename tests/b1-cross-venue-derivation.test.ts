import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  parseBettingWinB1DeterministicFixture,
} from '../src/contracts/betting-win-b1-resource-records.js';
import type { B1MultiVenueMarketRow } from '../src/contracts/b1-local-types.js';
import {
  deriveB1CrossVenueGrossOpportunityCandidates,
  type B1GrossOpportunityCandidate,
} from '../src/opportunity/b1-cross-venue-derivation.js';
import type { B1QuoteSynchronizationPolicy } from '../src/quotes/b1-quote-synchronization.js';

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

function quotePolicy(): B1QuoteSynchronizationPolicy {
  return Object.freeze({
    comparisonTimeUtc: '2026-07-01T00:00:02.250Z',
    maxQuoteAgeMs: 1500n,
    maxRetrievalLagMs: 1000n,
    maxComparisonWindowMs: 500n,
    requireOpenMarketStatus: true,
  });
}

function twoOutcomeGrossRows(): readonly B1MultiVenueMarketRow[] {
  const [homeA, homeB] = fixturePair();
  const normalizedHomeB = cloneRow(homeB, { decimalOdds: '2.00' });
  const awayA = cloneRow(homeA, {
    canonicalSelectionId: 'selection-away-a',
    selectionEquivalenceKey: 'event-001:moneyline:away',
    outcomeName: 'Away',
    outcomeSide: 'away',
    decimalOdds: '1.85',
  });
  const awayB = cloneRow(homeB, {
    canonicalSelectionId: 'selection-away-b',
    selectionEquivalenceKey: 'event-001:moneyline:away',
    outcomeName: 'Away',
    outcomeSide: 'away',
    decimalOdds: '2.10',
  });
  return Object.freeze([awayB, homeA, normalizedHomeB, awayA]);
}

test('B1 cross-venue derivation emits deterministic gross-only candidates', () => {
  const rows = twoOutcomeGrossRows();

  const first = deriveB1CrossVenueGrossOpportunityCandidates(rows, quotePolicy());
  const second = deriveB1CrossVenueGrossOpportunityCandidates([...rows].reverse(), quotePolicy());

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(summarizeCandidates(first.value), summarizeCandidates(second.value));
  assert.deepEqual(summarizeCandidates(first.value), [
    {
      ok: true,
      candidateId: 'event-001:moneyline:full-game|venue-a::venue-b',
      venuePairKey: 'venue-a::venue-b',
      grossSpreadPpm: 47618n,
      impliedProbabilityPpmSum: 952382n,
      selectedVenues: ['venue-b', 'venue-a'],
      blockerCodes: [],
    },
  ]);

  const candidate = first.value[0];
  assert.ok(candidate);
  assert.equal(candidate.ok, true);
  assert.equal(candidate.grossOpportunityKind, 'deterministic_gross_cross_venue_candidate');
  assert.equal(candidate.terminalOutcomeCount, 2);
  assert.equal(candidate.maxComparisonWindowMs, 500n);
  assert.equal(Object.hasOwn(candidate, 'netSpreadPpm'), false);
  assert.equal(Object.hasOwn(candidate, 'fillable'), false);
  assert.equal(Object.hasOwn(candidate, 'profitable'), false);
  assert.equal(Object.hasOwn(candidate, 'executable'), false);
});

test('B1 cross-venue derivation blocks incomplete terminal outcome sets', () => {
  const [homeA, homeB] = fixturePair();

  const result = deriveB1CrossVenueGrossOpportunityCandidates([homeA, homeB, cloneRow(homeA, {
    canonicalSelectionId: 'selection-away-a',
    selectionEquivalenceKey: 'event-001:moneyline:away',
    outcomeName: 'Away',
    outcomeSide: 'away',
    decimalOdds: '2.10',
  })], quotePolicy());

  assert.equal(result.ok, true);
  assert.equal(result.value.length, 1);
  const candidate = result.value[0];
  assert.ok(candidate);
  assert.equal(candidate.ok, false);
  assert.deepEqual(candidate.blockers, [
    {
      code: 'B1_OUTCOME_SET_INCOMPLETE',
      message: 'B1 market outcome sets must have the same terminal outcome cardinality.',
      evidenceRequired: 'Matching complete terminal outcome sets for both B1 venues.',
    },
  ]);
});

test('B1 cross-venue derivation preserves non-positive gross spread as a blocker', () => {
  const rows = twoOutcomeGrossRows().map((row) => {
    if (row.selectionEquivalenceKey === 'event-001:moneyline:away') {
      return cloneRow(row, { decimalOdds: '1.70' });
    }
    return row;
  });

  const result = deriveB1CrossVenueGrossOpportunityCandidates(rows, quotePolicy());

  assert.equal(result.ok, true);
  const candidate = result.value[0];
  assert.ok(candidate);
  assert.equal(candidate.ok, false);
  assert.deepEqual(candidate.blockers, [
    {
      code: 'B1_GROSS_SPREAD_NOT_POSITIVE',
      message: 'B1 gross derivation requires the selected terminal outcome odds to sum below one implied probability.',
      evidenceRequired: 'Cross-venue terminal outcome quotes with positive gross spread before net economics.',
    },
  ]);
});

function summarizeCandidates(
  candidates: readonly B1GrossOpportunityCandidate[],
): readonly {
  readonly ok: boolean;
  readonly candidateId: string;
  readonly venuePairKey: string;
  readonly grossSpreadPpm: bigint | undefined;
  readonly impliedProbabilityPpmSum: bigint | undefined;
  readonly selectedVenues: readonly string[];
  readonly blockerCodes: readonly string[];
}[] {
  return candidates.map((candidate) => candidate.ok
    ? {
        ok: true,
        candidateId: candidate.candidateId,
        venuePairKey: candidate.venuePairKey,
        grossSpreadPpm: candidate.grossSpreadPpm,
        impliedProbabilityPpmSum: candidate.impliedProbabilityPpmSum,
        selectedVenues: Object.freeze(candidate.selectedQuotes.map((quote) => quote.venueOrBookmakerId)),
        blockerCodes: Object.freeze([]),
      }
    : {
        ok: false,
        candidateId: candidate.candidateId,
        venuePairKey: candidate.venuePairKey,
        grossSpreadPpm: undefined,
        impliedProbabilityPpmSum: undefined,
        selectedVenues: Object.freeze([]),
        blockerCodes: Object.freeze(candidate.blockers.map((blocker) => blocker.code)),
      });
}
