import {
  accepted,
  blocked,
  type BoundaryResult,
} from '../contracts/local-types.js';

const B1_CAPITAL_LOCK_YEAR_MS = 365n * 24n * 60n * 60n * 1_000n;

export interface B1CapitalLockPolicy {
  readonly lockDurationMs: bigint;
  readonly annualizedCostBps: bigint;
  readonly capitalBufferBps: bigint;
}

export interface B1CapitalLockCharge {
  readonly stakeMinor: bigint;
  readonly feeMinor: bigint;
  readonly quoteAgePenaltyMinor: bigint;
  readonly capitalLockedMinor: bigint;
  readonly lockDurationMs: bigint;
  readonly annualizedCostBps: bigint;
  readonly capitalBufferBps: bigint;
  readonly capitalLockCostMinor: bigint;
}

export function calculateB1CapitalLockCharge(
  stakeMinor: bigint,
  feeMinor: bigint,
  quoteAgePenaltyMinor: bigint,
  policy: B1CapitalLockPolicy,
): BoundaryResult<B1CapitalLockCharge> {
  const normalizedPolicy = normalizeB1CapitalLockPolicy(policy);
  if (!normalizedPolicy.ok) {
    return normalizedPolicy;
  }
  if (stakeMinor <= 0n) {
    return blocked(
      'B1_CAPITAL_LOCK_STAKE_INVALID',
      'B1 capital lock requires positive total stake.',
      'Positive B1 total stake in minor units.',
    );
  }
  if (feeMinor < 0n || quoteAgePenaltyMinor < 0n) {
    return blocked(
      'B1_CAPITAL_LOCK_COST_INPUT_INVALID',
      'B1 capital lock requires non-negative fee and quote-age penalty inputs.',
      'Non-negative B1 fee and quote-age penalty totals.',
    );
  }

  const lockedBeforeBufferMinor = stakeMinor + feeMinor + quoteAgePenaltyMinor;
  const bufferMinor = ceilDiv(lockedBeforeBufferMinor * normalizedPolicy.value.capitalBufferBps, 10_000n);
  const capitalLockedMinor = lockedBeforeBufferMinor + bufferMinor;
  const capitalLockCostMinor = ceilDiv(
    capitalLockedMinor * normalizedPolicy.value.lockDurationMs * normalizedPolicy.value.annualizedCostBps,
    B1_CAPITAL_LOCK_YEAR_MS * 10_000n,
  );

  return accepted(Object.freeze({
    stakeMinor,
    feeMinor,
    quoteAgePenaltyMinor,
    capitalLockedMinor,
    lockDurationMs: normalizedPolicy.value.lockDurationMs,
    annualizedCostBps: normalizedPolicy.value.annualizedCostBps,
    capitalBufferBps: normalizedPolicy.value.capitalBufferBps,
    capitalLockCostMinor,
  }));
}

export function normalizeB1CapitalLockPolicy(
  policy: B1CapitalLockPolicy,
): BoundaryResult<B1CapitalLockPolicy> {
  if (typeof policy !== 'object' || policy === null) {
    return blocked(
      'B1_CAPITAL_LOCK_POLICY_MISSING',
      'B1 net economics requires an explicit capital lock policy.',
      'Explicit B1 capital lock policy.',
    );
  }
  if (typeof policy.lockDurationMs !== 'bigint' || policy.lockDurationMs < 0n) {
    return blocked(
      'B1_CAPITAL_LOCK_DURATION_INVALID',
      'B1 capital lock duration must be non-negative milliseconds.',
      'Non-negative B1 capital lock duration.',
    );
  }
  if (typeof policy.annualizedCostBps !== 'bigint' || policy.annualizedCostBps < 0n) {
    return blocked(
      'B1_CAPITAL_LOCK_BPS_INVALID',
      'B1 annualized capital lock cost must be non-negative basis points.',
      'Non-negative B1 annualized capital lock cost basis points.',
    );
  }
  if (typeof policy.capitalBufferBps !== 'bigint' || policy.capitalBufferBps < 0n) {
    return blocked(
      'B1_CAPITAL_BUFFER_BPS_INVALID',
      'B1 capital buffer must be non-negative basis points.',
      'Non-negative B1 capital buffer basis points.',
    );
  }

  return accepted(Object.freeze({
    lockDurationMs: policy.lockDurationMs,
    annualizedCostBps: policy.annualizedCostBps,
    capitalBufferBps: policy.capitalBufferBps,
  }));
}

function ceilDiv(numerator: bigint, denominator: bigint): bigint {
  const quotient = numerator / denominator;
  if (numerator % denominator === 0n) {
    return quotient;
  }
  return quotient + 1n;
}
