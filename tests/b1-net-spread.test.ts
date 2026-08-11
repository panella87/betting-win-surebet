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
import {
  calculateB1FeeCharge,
} from '../src/economics/b1-fee-matrix.js';
import {
  calculateB1QuoteAgePenalty,
} from '../src/economics/b1-lateness-penalty.js';

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

test('B1 net economics rejects malformed candidate and stake assumption containers without throwing', () => {
  const malformedCandidate = evaluateB1NetEconomics(null as never, netPolicy());
  assert.equal(malformedCandidate.ok, false);
  assert.equal(malformedCandidate.blockers[0]?.code, 'B1_NET_GROSS_CANDIDATE_INVALID');

  const malformedCandidateArray = evaluateB1NetEconomics([] as never, netPolicy());
  assert.equal(malformedCandidateArray.ok, false);
  assert.equal(malformedCandidateArray.blockers[0]?.code, 'B1_NET_GROSS_CANDIDATE_INVALID');

  const malformedPolicy = evaluateB1NetEconomics(acceptedGrossCandidate(), null as never);
  assert.equal(malformedPolicy.ok, false);
  assert.equal(malformedPolicy.blockers[0]?.code, 'B1_NET_POLICY_MISSING');

  const malformedPolicyArray = evaluateB1NetEconomics(acceptedGrossCandidate(), [] as never);
  assert.equal(malformedPolicyArray.ok, false);
  assert.equal(malformedPolicyArray.blockers[0]?.code, 'B1_NET_POLICY_MISSING');

  const malformedCandidateOutcome = evaluateB1NetEconomics({ ok: null } as never, netPolicy());
  assert.equal(malformedCandidateOutcome.ok, false);
  assert.equal(malformedCandidateOutcome.blockers[0]?.code, 'B1_NET_GROSS_CANDIDATE_INVALID');

  const malformedStakeAssumption = evaluateB1NetEconomics(acceptedGrossCandidate(), netPolicy({
    stakeAssumptions: Object.freeze([null]) as never,
  }));
  assert.equal(malformedStakeAssumption.ok, false);
  assert.equal(malformedStakeAssumption.blockers[0]?.code, 'B1_NET_STAKE_INVALID');

  const malformedStakeAssumptionArray = evaluateB1NetEconomics(acceptedGrossCandidate(), netPolicy({
    stakeAssumptions: Object.freeze([[]]) as never,
  }));
  assert.equal(malformedStakeAssumptionArray.ok, false);
  assert.equal(malformedStakeAssumptionArray.blockers[0]?.code, 'B1_NET_STAKE_INVALID');

  const acceptedCandidate = acceptedGrossCandidate();
  const malformedSelectedQuotesContainer = evaluateB1NetEconomics(Object.freeze({
    ...acceptedCandidate,
    selectedQuotes: null,
  }) as never, netPolicy());
  assert.equal(malformedSelectedQuotesContainer.ok, false);
  assert.equal(malformedSelectedQuotesContainer.blockers[0]?.code, 'B1_NET_GROSS_CANDIDATE_INVALID');

  const emptySelectedQuotes = evaluateB1NetEconomics(Object.freeze({
    ...acceptedCandidate,
    selectedQuotes: Object.freeze([]),
  }) as never, netPolicy());
  assert.equal(emptySelectedQuotes.ok, false);
  assert.equal(emptySelectedQuotes.blockers[0]?.code, 'B1_NET_GROSS_CANDIDATE_INVALID');

  const selectedQuote = acceptedCandidate.selectedQuotes[0];
  assert.ok(selectedQuote);
  const malformedSelectedQuote = evaluateB1NetEconomics(Object.freeze({
    ...acceptedCandidate,
    selectedQuotes: Object.freeze([
      Object.freeze({
        ...selectedQuote,
        outcomeName: 100,
      }),
    ]),
  }) as never, netPolicy());
  assert.equal(malformedSelectedQuote.ok, false);
  assert.equal(malformedSelectedQuote.blockers[0]?.code, 'B1_NET_GROSS_CANDIDATE_INVALID');

  const malformedSelectedQuoteArray = evaluateB1NetEconomics(Object.freeze({
    ...acceptedCandidate,
    selectedQuotes: Object.freeze([[]]),
  }) as never, netPolicy());
  assert.equal(malformedSelectedQuoteArray.ok, false);
  assert.equal(malformedSelectedQuoteArray.blockers[0]?.code, 'B1_NET_GROSS_CANDIDATE_INVALID');

  const malformedSelectedQuoteUndefined = evaluateB1NetEconomics(Object.freeze({
    ...acceptedCandidate,
    selectedQuotes: Object.freeze([undefined]),
  }) as never, netPolicy());
  assert.equal(malformedSelectedQuoteUndefined.ok, false);
  assert.equal(malformedSelectedQuoteUndefined.blockers[0]?.code, 'B1_NET_GROSS_CANDIDATE_INVALID');

  const synchronizedQuotePair = acceptedCandidate.synchronizedQuotePairs[0];
  assert.ok(synchronizedQuotePair);
  const malformedSynchronizedQuoteContainer = evaluateB1NetEconomics(Object.freeze({
    ...acceptedCandidate,
    synchronizedQuotePairs: Object.freeze([null]),
  }) as never, netPolicy());
  assert.equal(malformedSynchronizedQuoteContainer.ok, false);
  assert.equal(malformedSynchronizedQuoteContainer.blockers[0]?.code, 'B1_NET_GROSS_CANDIDATE_INVALID');

  const malformedSynchronizedQuoteArray = evaluateB1NetEconomics(Object.freeze({
    ...acceptedCandidate,
    synchronizedQuotePairs: Object.freeze([[]]),
  }) as never, netPolicy());
  assert.equal(malformedSynchronizedQuoteArray.ok, false);
  assert.equal(malformedSynchronizedQuoteArray.blockers[0]?.code, 'B1_NET_GROSS_CANDIDATE_INVALID');

  const malformedSynchronizedQuoteUndefined = evaluateB1NetEconomics(Object.freeze({
    ...acceptedCandidate,
    synchronizedQuotePairs: Object.freeze([undefined]),
  }) as never, netPolicy());
  assert.equal(malformedSynchronizedQuoteUndefined.ok, false);
  assert.equal(malformedSynchronizedQuoteUndefined.blockers[0]?.code, 'B1_NET_GROSS_CANDIDATE_INVALID');

  const emptySynchronizedQuotes = evaluateB1NetEconomics(Object.freeze({
    ...acceptedCandidate,
    synchronizedQuotePairs: Object.freeze([]),
  }) as never, netPolicy());
  assert.equal(emptySynchronizedQuotes.ok, false);
  assert.equal(emptySynchronizedQuotes.blockers[0]?.code, 'B1_NET_GROSS_CANDIDATE_INVALID');

  const malformedSynchronizedQuote = evaluateB1NetEconomics(Object.freeze({
    ...acceptedCandidate,
    synchronizedQuotePairs: Object.freeze([
      Object.freeze({
        ...synchronizedQuotePair,
        first: Object.freeze({
          ...synchronizedQuotePair.first,
          quoteAgeMs: '100',
        }),
      }),
    ]),
  }) as never, netPolicy());
  assert.equal(malformedSynchronizedQuote.ok, false);
  assert.equal(malformedSynchronizedQuote.blockers[0]?.code, 'B1_NET_GROSS_CANDIDATE_INVALID');

  const malformedSynchronizedQuoteRow = evaluateB1NetEconomics(Object.freeze({
    ...acceptedCandidate,
    synchronizedQuotePairs: Object.freeze([
      Object.freeze({
        ...synchronizedQuotePair,
        first: Object.freeze({
          ...synchronizedQuotePair.first,
          row: null,
        }),
      }),
    ]),
  }) as never, netPolicy());
  assert.equal(malformedSynchronizedQuoteRow.ok, false);
  assert.equal(malformedSynchronizedQuoteRow.blockers[0]?.code, 'B1_NET_GROSS_CANDIDATE_INVALID');

  const malformedFeePolicy = evaluateB1NetEconomics(acceptedGrossCandidate(), netPolicy({
    feeMatrix: null,
  } as never));
  assert.equal(malformedFeePolicy.ok, false);
  assert.equal(malformedFeePolicy.blockers[0]?.code, 'B1_FEE_MATRIX_MISSING');

  const malformedQuoteAgePolicy = evaluateB1NetEconomics(acceptedGrossCandidate(), netPolicy({
    quoteAgePenaltyPolicy: null,
  } as never));
  assert.equal(malformedQuoteAgePolicy.ok, false);
  assert.equal(malformedQuoteAgePolicy.blockers[0]?.code, 'B1_QUOTE_AGE_PENALTY_POLICY_MISSING');

  const malformedCapitalLockPolicy = evaluateB1NetEconomics(acceptedGrossCandidate(), netPolicy({
    capitalLockPolicy: null,
  } as never));
  assert.equal(malformedCapitalLockPolicy.ok, false);
  assert.equal(malformedCapitalLockPolicy.blockers[0]?.code, 'B1_CAPITAL_LOCK_POLICY_MISSING');
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

test('B1 net economics helpers block malformed direct bigint inputs without throwing', () => {
  const malformedStakeFee = calculateB1FeeCharge(
    netPolicy().feeMatrix,
    'venue-a',
    'event-001:moneyline:home',
    undefined as never,
  );
  assert.equal(malformedStakeFee.ok, false);
  assert.equal(malformedStakeFee.blockers[0]?.code, 'B1_STAKE_NOT_POSITIVE');

  const malformedEntryFee = calculateB1FeeCharge(
    Object.freeze({
      entries: Object.freeze([
        Object.freeze({
          venueOrBookmakerId: 'venue-a',
          selectionEquivalenceKey: 'event-001:moneyline:home',
          feeBps: undefined,
          fixedFeeMinor: 0n,
        }),
      ]),
    }) as never,
    'venue-a',
    'event-001:moneyline:home',
    10_000n,
  );
  assert.equal(malformedEntryFee.ok, false);
  assert.equal(malformedEntryFee.blockers[0]?.code, 'B1_FEE_BPS_INVALID');

  const malformedQuoteAge = calculateB1QuoteAgePenalty(
    undefined as never,
    10_000n,
    netPolicy().quoteAgePenaltyPolicy,
  );
  assert.equal(malformedQuoteAge.ok, false);
  assert.equal(malformedQuoteAge.blockers[0]?.code, 'B1_QUOTE_AGE_INVALID');
});

test('B1 fee calculation blocks malformed direct key inputs without throwing', () => {
  const malformedVenueFee = calculateB1FeeCharge(
    netPolicy().feeMatrix,
    undefined as never,
    'event-001:moneyline:home',
    10_000n,
  );
  assert.equal(malformedVenueFee.ok, false);
  assert.deepEqual(malformedVenueFee.blockers, [
    {
      code: 'B1_FEE_VENUE_MISSING',
      message: 'B1 fee calculation requires an explicit venue for every selected quote.',
      evidenceRequired: 'B1 selected quote venue_or_bookmaker_id.',
    },
  ]);

  const malformedSelectionFee = calculateB1FeeCharge(
    netPolicy().feeMatrix,
    'venue-a',
    undefined as never,
    10_000n,
  );
  assert.equal(malformedSelectionFee.ok, false);
  assert.deepEqual(malformedSelectionFee.blockers, [
    {
      code: 'B1_FEE_SELECTION_MISSING',
      message: 'B1 fee calculation requires selection equivalence evidence for every selected quote.',
      evidenceRequired: 'B1 selected quote selection_equivalence_key.',
    },
  ]);
});

test('B1 fee matrix normalization blocks malformed entry key inputs without throwing', () => {
  const malformedEntryVenueFee = calculateB1FeeCharge(
    Object.freeze({
      entries: Object.freeze([
        Object.freeze({
          venueOrBookmakerId: undefined,
          selectionEquivalenceKey: 'event-001:moneyline:home',
          feeBps: 10n,
          fixedFeeMinor: 0n,
        }),
      ]),
    }) as never,
    'venue-a',
    'event-001:moneyline:home',
    10_000n,
  );
  assert.equal(malformedEntryVenueFee.ok, false);
  assert.equal(malformedEntryVenueFee.blockers[0]?.code, 'B1_FEE_MATRIX_ENTRY_KEY_INVALID');

  const malformedEntrySelectionFee = calculateB1FeeCharge(
    Object.freeze({
      entries: Object.freeze([
        Object.freeze({
          venueOrBookmakerId: 'venue-a',
          selectionEquivalenceKey: undefined,
          feeBps: 10n,
          fixedFeeMinor: 0n,
        }),
      ]),
    }) as never,
    'venue-a',
    'event-001:moneyline:home',
    10_000n,
  );
  assert.equal(malformedEntrySelectionFee.ok, false);
  assert.equal(malformedEntrySelectionFee.blockers[0]?.code, 'B1_FEE_MATRIX_ENTRY_KEY_INVALID');
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
