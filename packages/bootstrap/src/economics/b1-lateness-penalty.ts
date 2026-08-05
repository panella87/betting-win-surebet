import {
  accepted,
  blocked,
  type BoundaryResult,
} from '../contracts/local-types.js';

export interface B1QuoteAgePenaltyPolicy {
  readonly maxAcceptedQuoteAgeMs: bigint;
  readonly penaltyBpsPerSecond: bigint;
  readonly fixedPenaltyMinor: bigint;
}

export interface B1QuoteAgePenalty {
  readonly quoteAgeMs: bigint;
  readonly stakeMinor: bigint;
  readonly maxAcceptedQuoteAgeMs: bigint;
  readonly penaltyBpsPerSecond: bigint;
  readonly fixedPenaltyMinor: bigint;
  readonly penaltyMinor: bigint;
}

export function calculateB1QuoteAgePenalty(
  quoteAgeMs: bigint,
  stakeMinor: bigint,
  policy: B1QuoteAgePenaltyPolicy,
): BoundaryResult<B1QuoteAgePenalty> {
  const normalizedPolicy = normalizeB1QuoteAgePenaltyPolicy(policy);
  if (!normalizedPolicy.ok) {
    return normalizedPolicy;
  }
  if (quoteAgeMs < 0n) {
    return blocked(
      'B1_QUOTE_AGE_INVALID',
      'B1 quote-age penalty requires non-negative quote age.',
      'Non-negative B1 quote_age_ms evidence.',
    );
  }
  if (stakeMinor <= 0n) {
    return blocked(
      'B1_STAKE_NOT_POSITIVE',
      'B1 quote-age penalty requires a positive stake assumption.',
      'Positive B1 stake in minor units.',
    );
  }
  if (quoteAgeMs > normalizedPolicy.value.maxAcceptedQuoteAgeMs) {
    return blocked(
      'B1_QUOTE_AGE_PENALTY_LIMIT_EXCEEDED',
      'B1 net economics blocks quotes older than the explicit quote-age penalty policy allows.',
      'B1 quote age at or below maxAcceptedQuoteAgeMs.',
    );
  }

  const variablePenaltyMinor = ceilDiv(
    stakeMinor * quoteAgeMs * normalizedPolicy.value.penaltyBpsPerSecond,
    1_000n * 10_000n,
  );
  return accepted(Object.freeze({
    quoteAgeMs,
    stakeMinor,
    maxAcceptedQuoteAgeMs: normalizedPolicy.value.maxAcceptedQuoteAgeMs,
    penaltyBpsPerSecond: normalizedPolicy.value.penaltyBpsPerSecond,
    fixedPenaltyMinor: normalizedPolicy.value.fixedPenaltyMinor,
    penaltyMinor: variablePenaltyMinor + normalizedPolicy.value.fixedPenaltyMinor,
  }));
}

export function normalizeB1QuoteAgePenaltyPolicy(
  policy: B1QuoteAgePenaltyPolicy,
): BoundaryResult<B1QuoteAgePenaltyPolicy> {
  if (typeof policy !== 'object' || policy === null) {
    return blocked(
      'B1_QUOTE_AGE_PENALTY_POLICY_MISSING',
      'B1 net economics requires an explicit quote-age penalty policy.',
      'Explicit B1 quote-age penalty policy.',
    );
  }
  if (typeof policy.maxAcceptedQuoteAgeMs !== 'bigint' || policy.maxAcceptedQuoteAgeMs < 0n) {
    return blocked(
      'B1_QUOTE_AGE_PENALTY_LIMIT_INVALID',
      'B1 quote-age penalty policy requires a non-negative quote-age limit.',
      'Non-negative B1 max accepted quote age.',
    );
  }
  if (typeof policy.penaltyBpsPerSecond !== 'bigint' || policy.penaltyBpsPerSecond < 0n) {
    return blocked(
      'B1_QUOTE_AGE_PENALTY_BPS_INVALID',
      'B1 quote-age penalty basis points must be non-negative integer units.',
      'Non-negative B1 quote-age penalty basis points per second.',
    );
  }
  if (typeof policy.fixedPenaltyMinor !== 'bigint' || policy.fixedPenaltyMinor < 0n) {
    return blocked(
      'B1_QUOTE_AGE_FIXED_PENALTY_INVALID',
      'B1 quote-age fixed penalty must be non-negative minor units.',
      'Non-negative B1 fixed quote-age penalty in minor units.',
    );
  }

  return accepted(Object.freeze({
    maxAcceptedQuoteAgeMs: policy.maxAcceptedQuoteAgeMs,
    penaltyBpsPerSecond: policy.penaltyBpsPerSecond,
    fixedPenaltyMinor: policy.fixedPenaltyMinor,
  }));
}

function ceilDiv(numerator: bigint, denominator: bigint): bigint {
  const quotient = numerator / denominator;
  if (numerator % denominator === 0n) {
    return quotient;
  }
  return quotient + 1n;
}
