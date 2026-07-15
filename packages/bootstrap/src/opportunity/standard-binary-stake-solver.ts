import { accepted, blocked, type BoundaryResult } from '../contracts/local-types.js';
import { toCapacityConstraint } from '../quotes/quote-capacity.js';
import { checkQuoteFreshness } from '../quotes/quote-freshness.js';
import type { StandardBinaryCompleteSet } from '../scenarios/complete-set.js';
import { buildStandardBinaryScenarioCashflowMatrix, type ScenarioCashflowLegTerms } from '../scenarios/scenario-cashflow.js';
import {
  solveStandardBinaryStakeVector,
  type StakeVectorInputContract,
  type StakeVectorRoundingConstraint,
  type StakeVectorSolution,
} from '../solver/stake-vector.js';

export const STANDARD_BINARY_QUOTE_PRICE_SCALE_MINOR = 1_000_000n;
export const DEFAULT_STANDARD_BINARY_MAX_QUOTE_AGE_MS = 60_000;

export interface StandardBinaryStakeVectorSolveOptions {
  readonly observedNowMs: number;
  readonly maxQuoteAgeMs?: number;
}

export function buildStandardBinaryStakeVectorInput(
  completeSet: StandardBinaryCompleteSet,
  options: StandardBinaryStakeVectorSolveOptions,
): BoundaryResult<StakeVectorInputContract> {
  const maxQuoteAgeMs = options.maxQuoteAgeMs ?? DEFAULT_STANDARD_BINARY_MAX_QUOTE_AGE_MS;
  const freshness = validateCompleteSetQuoteFreshness(completeSet, options.observedNowMs, maxQuoteAgeMs);
  if (!freshness.ok) {
    return freshness;
  }

  const legTerms = deriveScenarioCashflowLegTerms(completeSet);
  if (!legTerms.ok) {
    return legTerms;
  }

  const matrix = buildStandardBinaryScenarioCashflowMatrix(completeSet, legTerms.value);
  if (!matrix.ok) {
    return matrix;
  }

  const capacityConstraints = deriveCapacityConstraints(completeSet);
  if (!capacityConstraints.ok) {
    return capacityConstraints;
  }

  const roundingConstraints = deriveRoundingConstraints(completeSet);
  if (!roundingConstraints.ok) {
    return roundingConstraints;
  }

  return accepted(
    Object.freeze({
      matrix: matrix.value,
      capacityConstraints: capacityConstraints.value,
      roundingConstraints: roundingConstraints.value,
    }),
  );
}

export function solveStandardBinaryCompleteSetStakeVector(
  completeSet: StandardBinaryCompleteSet,
  options: StandardBinaryStakeVectorSolveOptions,
): BoundaryResult<StakeVectorSolution> {
  const input = buildStandardBinaryStakeVectorInput(completeSet, options);
  if (!input.ok) {
    return input;
  }
  return solveStandardBinaryStakeVector(input.value);
}

function validateCompleteSetQuoteFreshness(
  completeSet: StandardBinaryCompleteSet,
  observedNowMs: number,
  maxQuoteAgeMs: number,
): BoundaryResult<undefined> {
  const quotes = Object.freeze([completeSet.quotesByOutcome.yes, completeSet.quotesByOutcome.no]);
  for (const quoteRecord of quotes) {
    const freshness = checkQuoteFreshness(quoteRecord.evidence, observedNowMs, maxQuoteAgeMs);
    if (!freshness.ok) {
      return freshness;
    }
  }

  return accepted(undefined);
}

function deriveScenarioCashflowLegTerms(
  completeSet: StandardBinaryCompleteSet,
): BoundaryResult<readonly ScenarioCashflowLegTerms[]> {
  const terms: ScenarioCashflowLegTerms[] = [];
  for (const leg of completeSet.legs) {
    const quoteRecord = completeSet.quotesByOutcome[leg.outcome];
    if (!quoteRecord) {
      return blocked(
        'STANDARD_BINARY_SOLVER_QUOTE_MISSING',
        'Stake solving requires quote evidence for every complete-set leg.',
        'Validated YES and NO quote records for the complete-set.',
      );
    }
    if (quoteRecord.minStakeMinor <= 0n) {
      return blocked(
        'LOCAL_REPORT_MIN_STAKE_INVALID',
        'Local paper reporting requires positive minStakeMinor values for every complete-set leg.',
        'Positive local quote minStakeMinor values.',
      );
    }

    terms.push(
      Object.freeze({
        legId: leg.legId,
        stakeMinor: quoteRecord.minStakeMinor,
        payoutMinor:
          quoteRecord.minStakeMinor
          + (quoteRecord.minStakeMinor * quoteRecord.evidence.priceMinor) / STANDARD_BINARY_QUOTE_PRICE_SCALE_MINOR,
      }),
    );
  }

  return accepted(Object.freeze(terms));
}

function deriveCapacityConstraints(
  completeSet: StandardBinaryCompleteSet,
): BoundaryResult<
  readonly {
    readonly legId: string;
    readonly minStakeMinor: bigint;
    readonly maxStakeMinor: bigint;
  }[]
> {
  const constraints: {
    readonly legId: string;
    readonly minStakeMinor: bigint;
    readonly maxStakeMinor: bigint;
  }[] = [];
  for (const leg of completeSet.legs) {
    const quoteRecord = completeSet.quotesByOutcome[leg.outcome];
    if (!quoteRecord) {
      return blocked(
        'STANDARD_BINARY_SOLVER_QUOTE_MISSING',
        'Stake solving requires quote evidence for every complete-set leg.',
        'Validated YES and NO quote records for the complete-set.',
      );
    }
    if (quoteRecord.minStakeMinor <= 0n) {
      return blocked(
        'LOCAL_REPORT_MIN_STAKE_INVALID',
        'Local paper reporting requires positive minStakeMinor values for every complete-set leg.',
        'Positive local quote minStakeMinor values.',
      );
    }

    const capacityConstraint = toCapacityConstraint(leg.legId, quoteRecord.evidence, quoteRecord.minStakeMinor);
    if (!capacityConstraint.ok) {
      return capacityConstraint;
    }

    constraints.push(
      Object.freeze({
        legId: leg.legId,
        minStakeMinor: quoteRecord.minStakeMinor,
        maxStakeMinor: capacityConstraint.value.maxStakeMinor,
      }),
    );
  }

  return accepted(Object.freeze(constraints));
}

function deriveRoundingConstraints(
  completeSet: StandardBinaryCompleteSet,
): BoundaryResult<readonly StakeVectorRoundingConstraint[]> {
  const constraints: StakeVectorRoundingConstraint[] = [];
  for (const leg of completeSet.legs) {
    const quoteRecord = completeSet.quotesByOutcome[leg.outcome];
    if (!quoteRecord) {
      return blocked(
        'STANDARD_BINARY_SOLVER_QUOTE_MISSING',
        'Stake solving requires quote evidence for every complete-set leg.',
        'Validated YES and NO quote records for the complete-set.',
      );
    }
    if (quoteRecord.minStakeMinor <= 0n) {
      return blocked(
        'LOCAL_REPORT_ROUNDING_STEP_INVALID',
        'Local paper reporting requires a positive rounding step for every complete-set leg.',
        'Positive local quote minStakeMinor values for each complete-set leg.',
      );
    }

    constraints.push(
      Object.freeze({
        legId: leg.legId,
        stepMinor: quoteRecord.minStakeMinor,
      }),
    );
  }

  return accepted(Object.freeze(constraints));
}
