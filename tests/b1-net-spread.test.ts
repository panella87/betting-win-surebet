import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  parseBettingWinB1DeterministicFixture,
} from '../src/contracts/betting-win-b1-resource-records.js';
import type { B1MultiVenueMarketRow } from '../src/contracts/b1-local-types.js';
import {
  deriveB1CrossVenueGrossOpportunityCandidates,
} from '../src/opportunity/b1-cross-venue-derivation.js';
import {
  evaluateB1NetEconomics,
  type B1NetEconomicsPolicy,
} from '../src/economics/b1-net-spread.js';

const FIXTURE_PATH = 'tests/fixtures/b1-local-contract/valid-b1-multi-venue-markets.json';

function fixtureRows(): readonly B1MultiVenueMarketRow[] {
  const raw = JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8')) as unknown;
  const parsed = parseBettingWinB1DeterministicFixture(raw);
  assert.equal(parsed.ok, true);
  return parsed.value.rows;
}

function cloneRow(row: B1MultiVenueMarketRow, overrides: Partial<B1MultiVenueMarketRow>): B1MultiVenueMarketRow {
  return Object.freeze({
    ...row,
    ...overrides,
  });
}

function twoOutcomeGrossRows(): readonly B1MultiVenueMarketRow[] {
  const rows = fixtureRows();
  const homeA = rows[0];
  const homeB = rows[1];
  assert.ok(homeA);
  assert.ok(homeB);
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

function acceptedGrossCandidate() {
  const result = deriveB1CrossVenueGrossOpportunityCandidates(twoOutcomeGrossRows(), Object.freeze({
    comparisonTimeUtc: '2026-07-01T00:00:02.250Z',
    maxQuoteAgeMs: 1500n,
    maxRetrievalLagMs: 1000n,
    maxComparisonWindowMs: 500n,
    requireOpenMarketStatus: true,
  }));
  assert.equal(result.ok, true);
  const candidate = result.value[0];
  assert.ok(candidate);
  assert.equal(candidate.ok, true);
  return candidate;
}

function netPolicy(overrides: Partial<B1NetEconomicsPolicy> = {}): B1NetEconomicsPolicy {
  return Object.freeze({
    stakeAssumptions: Object.freeze([
      Object.freeze({ selectionEquivalenceKey: 'event-001:moneyline:away', stakeMinor: 10_000n }),
      Object.freeze({ selectionEquivalenceKey: 'event-001:moneyline:home', stakeMinor: 10_000n }),
    ]),
    feeMatrix: Object.freeze({
      entries: Object.freeze([
        Object.freeze({
          venueOrBookmakerId: 'venue-a',
          selectionEquivalenceKey: 'event-001:moneyline:home',
          feeBps: 10n,
          fixedFeeMinor: 0n,
        }),
        Object.freeze({
          venueOrBookmakerId: 'venue-b',
          selectionEquivalenceKey: 'event-001:moneyline:away',
          feeBps: 10n,
          fixedFeeMinor: 0n,
        }),
      ]),
    }),
    quoteAgePenaltyPolicy: Object.freeze({
      maxAcceptedQuoteAgeMs: 1500n,
      penaltyBpsPerSecond: 0n,
      fixedPenaltyMinor: 5n,
    }),
    capitalLockPolicy: Object.freeze({
      lockDurationMs: 86_400_000n,
      annualizedCostBps: 1_000n,
      capitalBufferBps: 0n,
    }),
    ...overrides,
  });
}

test('B1 net economics accepts only positive worst-case net after explicit fees, age penalties and capital lock', () => {
  const result = evaluateB1NetEconomics(acceptedGrossCandidate(), netPolicy());

  assert.equal(result.ok, true);
  assert.equal(result.value.netOpportunityKind, 'deterministic_net_cross_venue_candidate');
  assert.equal(result.value.totalStakeMinor, 20_000n);
  assert.equal(result.value.totalFeeMinor, 20n);
  assert.equal(result.value.totalQuoteAgePenaltyMinor, 10n);
  assert.equal(result.value.capitalLock.capitalLockedMinor, 20_030n);
  assert.equal(result.value.capitalLock.capitalLockCostMinor, 6n);
  assert.equal(result.value.worstCaseNetMinor, 964n);
  assert.equal(result.value.netSpreadPpm, 48_127n);
  assert.equal(result.value.executable, false);
  assert.equal(result.value.liveReadiness, 'not_authorized_bws_900_parked');
});

test('B1 net economics blocks missing fee matrix entries instead of defaulting to zero', () => {
  const result = evaluateB1NetEconomics(acceptedGrossCandidate(), netPolicy({
    feeMatrix: Object.freeze({
      entries: Object.freeze([
        Object.freeze({
          venueOrBookmakerId: 'venue-a',
          selectionEquivalenceKey: 'event-001:moneyline:home',
          feeBps: 10n,
          fixedFeeMinor: 0n,
        }),
      ]),
    }),
  }));

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_FEE_MATRIX_ENTRY_MISSING',
      message: 'B1 net economics requires exactly one explicit fee entry for every selected venue and terminal outcome.',
      evidenceRequired: 'B1 fee matrix entry keyed by venue_or_bookmaker_id and selection_equivalence_key.',
    },
  ]);
});

test('B1 net economics blocks quote-age policy breaches', () => {
  const result = evaluateB1NetEconomics(acceptedGrossCandidate(), netPolicy({
    quoteAgePenaltyPolicy: Object.freeze({
      maxAcceptedQuoteAgeMs: 500n,
      penaltyBpsPerSecond: 0n,
      fixedPenaltyMinor: 0n,
    }),
  }));

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_QUOTE_AGE_PENALTY_LIMIT_EXCEEDED',
      message: 'B1 net economics blocks quotes older than the explicit quote-age penalty policy allows.',
      evidenceRequired: 'B1 quote age at or below maxAcceptedQuoteAgeMs.',
    },
  ]);
});

test('B1 net economics rejects missing bigint quote-age policy fields', () => {
  const result = evaluateB1NetEconomics(acceptedGrossCandidate(), netPolicy({
    quoteAgePenaltyPolicy: Object.freeze({
      maxAcceptedQuoteAgeMs: undefined,
      penaltyBpsPerSecond: 0n,
      fixedPenaltyMinor: 0n,
    }) as never,
  }));

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_QUOTE_AGE_PENALTY_LIMIT_INVALID',
      message: 'B1 quote-age penalty policy requires a non-negative quote-age limit.',
      evidenceRequired: 'Non-negative B1 max accepted quote age.',
    },
  ]);
});

test('B1 net economics blocks non-positive worst-case net after costs', () => {
  const result = evaluateB1NetEconomics(acceptedGrossCandidate(), netPolicy({
    feeMatrix: Object.freeze({
      entries: Object.freeze([
        Object.freeze({
          venueOrBookmakerId: 'venue-a',
          selectionEquivalenceKey: 'event-001:moneyline:home',
          feeBps: 5_000n,
          fixedFeeMinor: 0n,
        }),
        Object.freeze({
          venueOrBookmakerId: 'venue-b',
          selectionEquivalenceKey: 'event-001:moneyline:away',
          feeBps: 5_000n,
          fixedFeeMinor: 0n,
        }),
      ]),
    }),
  }));

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_NET_SPREAD_NOT_POSITIVE',
      message: 'B1 net economics requires positive worst-case net after fees, quote-age penalties and capital lock.',
      evidenceRequired: 'Positive B1 worst-case net in minor units after all explicit costs.',
    },
  ]);
});
