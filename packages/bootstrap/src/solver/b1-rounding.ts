import {
  accepted,
  blocked,
  type BoundaryResult,
} from '../contracts/local-types.js';

export interface B1RoundedStake {
  readonly rawStakeMinor: bigint;
  readonly roundedStakeMinor: bigint;
  readonly roundingLossMinor: bigint;
  readonly stepMinor: bigint;
}

export function roundUpB1StakeMinor(rawStakeMinor: bigint, stepMinor: bigint): BoundaryResult<B1RoundedStake> {
  if (typeof rawStakeMinor !== 'bigint' || rawStakeMinor <= 0n) {
    return blocked(
      'B1_STAKE_NOT_POSITIVE',
      'B1 stake rounding requires positive integer minor-unit stake input.',
      'Positive B1 stake in integer minor units.',
    );
  }
  if (typeof stepMinor !== 'bigint' || stepMinor <= 0n) {
    return blocked(
      'B1_STAKE_VECTOR_ROUNDING_STEP_INVALID',
      'B1 stake-vector solving requires a positive stake rounding step.',
      'Positive B1 stake rounding step in integer minor units.',
    );
  }
  const roundedStakeMinor = roundUpToMultiple(rawStakeMinor, stepMinor);
  return accepted(Object.freeze({
    rawStakeMinor,
    roundedStakeMinor,
    roundingLossMinor: roundedStakeMinor - rawStakeMinor,
    stepMinor,
  }));
}

export function ceilDivB1(numerator: bigint, denominator: bigint): bigint {
  const quotient = numerator / denominator;
  if (numerator % denominator === 0n) {
    return quotient;
  }
  return quotient + 1n;
}

function roundUpToMultiple(value: bigint, step: bigint): bigint {
  return ceilDivB1(value, step) * step;
}
