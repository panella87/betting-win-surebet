import {
  accepted,
  blocked,
  type BoundaryResult,
} from '../contracts/local-types.js';
import {
  B1_DECIMAL_ODDS_SCALE_MICRO,
  B1_IMPLIED_PROBABILITY_SCALE_PPM,
} from '../opportunity/b1-gross-spread.js';
import type {
  B1AcceptedGrossOpportunityCandidate,
  B1GrossOpportunityCandidate,
} from '../opportunity/b1-cross-venue-derivation.js';
import type { B1SynchronizedQuoteRow } from '../quotes/b1-quote-synchronization.js';
import {
  calculateB1CapitalLockCharge,
  type B1CapitalLockCharge,
  type B1CapitalLockPolicy,
} from './b1-capital-lock.js';
import {
  calculateB1FeeCharge,
  type B1FeeCharge,
  type B1FeeMatrix,
} from './b1-fee-matrix.js';
import {
  calculateB1QuoteAgePenalty,
  type B1QuoteAgePenalty,
  type B1QuoteAgePenaltyPolicy,
} from './b1-lateness-penalty.js';

export interface B1StakeAssumption {
  readonly selectionEquivalenceKey: string;
  readonly stakeMinor: bigint;
}

export interface B1NetEconomicsPolicy {
  readonly stakeAssumptions: readonly B1StakeAssumption[];
  readonly feeMatrix: B1FeeMatrix;
  readonly quoteAgePenaltyPolicy: B1QuoteAgePenaltyPolicy;
  readonly capitalLockPolicy: B1CapitalLockPolicy;
}

export interface B1NetQuoteEconomics {
  readonly selectionEquivalenceKey: string;
  readonly outcomeName: string;
  readonly outcomeSide: string;
  readonly venueOrBookmakerId: string;
  readonly stakeMinor: bigint;
  readonly decimalOddsMicro: bigint;
  readonly payoutIfWonMinor: bigint;
  readonly feeCharge: B1FeeCharge;
  readonly quoteAgePenalty: B1QuoteAgePenalty;
}

export interface B1NetScenarioCashflow {
  readonly selectionEquivalenceKey: string;
  readonly outcomeName: string;
  readonly payoutMinor: bigint;
  readonly netMinor: bigint;
}

export interface B1AcceptedNetOpportunityCandidate {
  readonly ok: true;
  readonly candidateId: string;
  readonly netOpportunityKind: 'deterministic_net_cross_venue_candidate';
  readonly grossCandidate: B1AcceptedGrossOpportunityCandidate;
  readonly quoteEconomics: readonly B1NetQuoteEconomics[];
  readonly scenarioCashflows: readonly B1NetScenarioCashflow[];
  readonly totalStakeMinor: bigint;
  readonly totalFeeMinor: bigint;
  readonly totalQuoteAgePenaltyMinor: bigint;
  readonly capitalLock: B1CapitalLockCharge;
  readonly worstCaseNetMinor: bigint;
  readonly netSpreadPpm: bigint;
  readonly grossSpreadPpm: bigint;
  readonly executable: false;
  readonly liveReadiness: 'not_authorized_bws_900_parked';
}

export function evaluateB1NetEconomics(
  candidate: B1GrossOpportunityCandidate,
  policy: B1NetEconomicsPolicy,
): BoundaryResult<B1AcceptedNetOpportunityCandidate> {
  if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) {
    return blocked(
      'B1_NET_GROSS_CANDIDATE_INVALID',
      'B1 net economics requires a structured gross candidate input.',
      'Structured B1 gross opportunity candidate.',
    );
  }
  if (typeof candidate.ok !== 'boolean') {
    return blocked(
      'B1_NET_GROSS_CANDIDATE_INVALID',
      'B1 net economics requires a typed gross candidate outcome.',
      'Structured B1 gross opportunity candidate with ok status.',
    );
  }
  if (candidate.ok !== true) {
    return blocked(
      'B1_NET_REQUIRES_ACCEPTED_GROSS_CANDIDATE',
      'B1 net economics requires an accepted gross-only candidate before net evaluation.',
      'Accepted B1 deterministic gross cross-venue candidate.',
    );
  }
  const candidateShape = validateAcceptedB1GrossCandidateShape(candidate);
  if (!candidateShape.ok) {
    return candidateShape;
  }
  const stakeAssumptions = normalizeB1StakeAssumptions(policy);
  if (!stakeAssumptions.ok) {
    return stakeAssumptions;
  }

  const quoteEconomics: B1NetQuoteEconomics[] = [];
  let totalStakeMinor = 0n;
  let totalFeeMinor = 0n;
  let totalQuoteAgePenaltyMinor = 0n;

  for (const quote of candidate.selectedQuotes) {
    const stakeMinor = stakeAssumptions.value.get(quote.selectionEquivalenceKey);
    if (stakeMinor === undefined) {
      return blocked(
        'B1_NET_STAKE_MISSING',
        'B1 net economics requires an explicit stake assumption for every selected terminal outcome.',
        'B1 stake assumption keyed by selection_equivalence_key.',
      );
    }

    const synchronizedQuote = findSelectedSynchronizedQuote(candidate, quote.selectionEquivalenceKey, quote.venueOrBookmakerId);
    if (!synchronizedQuote.ok) {
      return synchronizedQuote;
    }

    const feeCharge = calculateB1FeeCharge(
      policy.feeMatrix,
      quote.venueOrBookmakerId,
      quote.selectionEquivalenceKey,
      stakeMinor,
    );
    if (!feeCharge.ok) {
      return feeCharge;
    }

    const quoteAgePenalty = calculateB1QuoteAgePenalty(
      synchronizedQuote.value.quoteAgeMs,
      stakeMinor,
      policy.quoteAgePenaltyPolicy,
    );
    if (!quoteAgePenalty.ok) {
      return quoteAgePenalty;
    }

    totalStakeMinor += stakeMinor;
    totalFeeMinor += feeCharge.value.feeMinor;
    totalQuoteAgePenaltyMinor += quoteAgePenalty.value.penaltyMinor;
    quoteEconomics.push(Object.freeze({
      selectionEquivalenceKey: quote.selectionEquivalenceKey,
      outcomeName: quote.outcomeName,
      outcomeSide: quote.outcomeSide,
      venueOrBookmakerId: quote.venueOrBookmakerId,
      stakeMinor,
      decimalOddsMicro: quote.decimalOddsMicro,
      payoutIfWonMinor: (stakeMinor * quote.decimalOddsMicro) / B1_DECIMAL_ODDS_SCALE_MICRO,
      feeCharge: feeCharge.value,
      quoteAgePenalty: quoteAgePenalty.value,
    }));
  }

  const capitalLock = calculateB1CapitalLockCharge(
    totalStakeMinor,
    totalFeeMinor,
    totalQuoteAgePenaltyMinor,
    policy.capitalLockPolicy,
  );
  if (!capitalLock.ok) {
    return capitalLock;
  }

  const scenarioCashflows = quoteEconomics.map((quote) => Object.freeze({
    selectionEquivalenceKey: quote.selectionEquivalenceKey,
    outcomeName: quote.outcomeName,
    payoutMinor: quote.payoutIfWonMinor,
    netMinor: quote.payoutIfWonMinor
      - totalStakeMinor
      - totalFeeMinor
      - totalQuoteAgePenaltyMinor
      - capitalLock.value.capitalLockCostMinor,
  }));
  const worstCaseNetMinor = minimumNetMinor(scenarioCashflows);
  if (worstCaseNetMinor <= 0n) {
    return blocked(
      'B1_NET_SPREAD_NOT_POSITIVE',
      'B1 net economics requires positive worst-case net after fees, quote-age penalties and capital lock.',
      'Positive B1 worst-case net in minor units after all explicit costs.',
    );
  }

  return accepted(Object.freeze({
    ok: true,
    candidateId: candidate.candidateId,
    netOpportunityKind: 'deterministic_net_cross_venue_candidate',
    grossCandidate: candidate,
    quoteEconomics: Object.freeze(quoteEconomics),
    scenarioCashflows: Object.freeze(scenarioCashflows),
    totalStakeMinor,
    totalFeeMinor,
    totalQuoteAgePenaltyMinor,
    capitalLock: capitalLock.value,
    worstCaseNetMinor,
    netSpreadPpm: (worstCaseNetMinor * B1_IMPLIED_PROBABILITY_SCALE_PPM) / capitalLock.value.capitalLockedMinor,
    grossSpreadPpm: candidate.grossSpreadPpm,
    executable: false,
    liveReadiness: 'not_authorized_bws_900_parked',
  }));
}

function normalizeB1StakeAssumptions(policy: B1NetEconomicsPolicy): BoundaryResult<ReadonlyMap<string, bigint>> {
  if (typeof policy !== 'object' || policy === null || Array.isArray(policy) || !Array.isArray(policy.stakeAssumptions)) {
    return blocked(
      'B1_NET_POLICY_MISSING',
      'B1 net economics requires an explicit policy with stake assumptions.',
      'Explicit B1 net economics policy.',
    );
  }
  if (policy.stakeAssumptions.length === 0) {
    return blocked(
      'B1_NET_STAKES_EMPTY',
      'B1 net economics requires at least one explicit stake assumption.',
      'B1 stake assumptions keyed by selection_equivalence_key.',
    );
  }

  const stakes = new Map<string, bigint>();
  for (const assumption of policy.stakeAssumptions) {
    if (
      typeof assumption !== 'object'
      || assumption === null
      || Array.isArray(assumption)
      || typeof assumption.selectionEquivalenceKey !== 'string'
      || typeof assumption.stakeMinor !== 'bigint'
    ) {
      return blocked(
        'B1_NET_STAKE_INVALID',
        'B1 net stake assumptions require structured selection and bigint stake fields.',
        'Structured B1 stake assumptions with bigint minor-unit stakes.',
      );
    }
    if (assumption.selectionEquivalenceKey.length === 0) {
      return blocked(
        'B1_NET_STAKE_SELECTION_MISSING',
        'B1 net stake assumptions require selection equivalence keys.',
        'B1 stake assumption selection_equivalence_key.',
      );
    }
    if (assumption.stakeMinor <= 0n) {
      return blocked(
        'B1_STAKE_NOT_POSITIVE',
        'B1 net stake assumptions must be positive minor units.',
        'Positive B1 stake assumption in minor units.',
      );
    }
    if (stakes.has(assumption.selectionEquivalenceKey)) {
      return blocked(
        'B1_NET_STAKE_DUPLICATE',
        'B1 net economics requires one stake assumption per terminal outcome.',
        'Unique B1 stake assumptions keyed by selection_equivalence_key.',
      );
    }
    stakes.set(assumption.selectionEquivalenceKey, assumption.stakeMinor);
  }

  return accepted(stakes);
}

function validateAcceptedB1GrossCandidateShape(
  candidate: B1AcceptedGrossOpportunityCandidate,
): BoundaryResult<undefined> {
  if (
    typeof candidate.candidateId !== 'string'
    || typeof candidate.grossSpreadPpm !== 'bigint'
    || !Array.isArray(candidate.selectedQuotes)
    || !Array.isArray(candidate.synchronizedQuotePairs)
  ) {
    return blocked(
      'B1_NET_GROSS_CANDIDATE_INVALID',
      'B1 net economics requires an accepted gross candidate with selected quote evidence.',
      'Accepted B1 gross candidate with selected quotes and synchronized quote pairs.',
    );
  }
  if (candidate.selectedQuotes.length === 0 || candidate.synchronizedQuotePairs.length === 0) {
    return blocked(
      'B1_NET_GROSS_CANDIDATE_INVALID',
      'B1 net economics requires non-empty selected quote and synchronization evidence.',
      'Accepted B1 gross candidate with non-empty selected quotes and synchronized quote pairs.',
    );
  }
  for (const quote of candidate.selectedQuotes) {
    if (
      typeof quote !== 'object'
      || quote === null
      || Array.isArray(quote)
      || typeof quote.selectionEquivalenceKey !== 'string'
      || typeof quote.outcomeName !== 'string'
      || typeof quote.outcomeSide !== 'string'
      || typeof quote.venueOrBookmakerId !== 'string'
      || typeof quote.decimalOddsMicro !== 'bigint'
    ) {
      return blocked(
        'B1_NET_GROSS_CANDIDATE_INVALID',
        'B1 net economics requires structured selected gross quote evidence.',
        'Accepted B1 gross candidate with structured selected quotes.',
      );
    }
  }
  for (const pair of candidate.synchronizedQuotePairs) {
    if (
      typeof pair !== 'object'
      || pair === null
      || Array.isArray(pair)
      || typeof pair.first !== 'object'
      || pair.first === null
      || Array.isArray(pair.first)
      || typeof pair.second !== 'object'
      || pair.second === null
      || Array.isArray(pair.second)
      || typeof pair.first.row !== 'object'
      || pair.first.row === null
      || Array.isArray(pair.first.row)
      || typeof pair.second.row !== 'object'
      || pair.second.row === null
      || Array.isArray(pair.second.row)
      || typeof pair.first.row.selectionEquivalenceKey !== 'string'
      || typeof pair.first.row.venueOrBookmakerId !== 'string'
      || typeof pair.first.quoteAgeMs !== 'bigint'
      || typeof pair.second.row.selectionEquivalenceKey !== 'string'
      || typeof pair.second.row.venueOrBookmakerId !== 'string'
      || typeof pair.second.quoteAgeMs !== 'bigint'
    ) {
      return blocked(
        'B1_NET_GROSS_CANDIDATE_INVALID',
        'B1 net economics requires structured synchronized quote pair evidence.',
        'Accepted B1 gross candidate with structured synchronized quote pairs.',
      );
    }
  }
  return accepted(undefined);
}

function findSelectedSynchronizedQuote(
  candidate: B1AcceptedGrossOpportunityCandidate,
  selectionEquivalenceKey: string,
  venueOrBookmakerId: string,
): BoundaryResult<B1SynchronizedQuoteRow> {
  for (const pair of candidate.synchronizedQuotePairs) {
    for (const synchronizedQuote of [pair.first, pair.second]) {
      if (
        synchronizedQuote.row.selectionEquivalenceKey === selectionEquivalenceKey
        && synchronizedQuote.row.venueOrBookmakerId === venueOrBookmakerId
      ) {
        return accepted(synchronizedQuote);
      }
    }
  }
  return blocked(
    'B1_NET_SELECTED_QUOTE_SYNC_MISSING',
    'B1 net economics requires synchronized quote evidence for every selected gross quote.',
    'B1 synchronized quote row matching selected venue and terminal outcome.',
  );
}

function minimumNetMinor(rows: readonly B1NetScenarioCashflow[]): bigint {
  const first = rows[0];
  if (first === undefined) {
    throw new Error('B1 net economics requires at least one scenario cashflow row.');
  }
  let minimum = first.netMinor;
  for (const row of rows.slice(1)) {
    if (row.netMinor < minimum) {
      minimum = row.netMinor;
    }
  }
  return minimum;
}
