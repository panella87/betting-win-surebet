import { accepted, blocked, type BoundaryResult, type CapacityConstraint, type QuoteDepthEvidence } from '../contracts/local-types.js';

export function toCapacityConstraint(
  legId: string,
  evidence: QuoteDepthEvidence,
  minStakeMinor: bigint,
): BoundaryResult<CapacityConstraint> {
  if (!isNonEmptyString(legId)) {
    return blocked(
      'CAPACITY_LEG_ID_INVALID',
      'Capacity derivation requires a non-empty leg identity.',
      'Non-empty local leg id for each quote/depth capacity constraint.',
    );
  }
  if (!isRecord(evidence) || typeof evidence.availableSizeMinor !== 'bigint') {
    return blocked(
      'CAPACITY_EVIDENCE_INVALID',
      'Capacity derivation requires bigint retained quote/depth capacity.',
      'Bigint availableSizeMinor from betting-win quote/depth evidence.',
    );
  }
  if (typeof minStakeMinor !== 'bigint') {
    return blocked(
      'CAPACITY_MIN_STAKE_INVALID',
      'Capacity derivation requires a positive minimum stake for every leg.',
      'Positive local minimum stake for each quote/depth leg.',
    );
  }
  if (evidence.availableSizeMinor <= 0n) {
    return blocked('CAPACITY_EVIDENCE_MISSING', 'Positive retained quote/depth capacity is required.', 'betting-win quote/depth evidence.');
  }
  if (minStakeMinor <= 0n) {
    return blocked(
      'CAPACITY_MIN_STAKE_INVALID',
      'Capacity derivation requires a positive minimum stake for every leg.',
      'Positive local minimum stake for each quote/depth leg.',
    );
  }
  if (evidence.availableSizeMinor < minStakeMinor) {
    return blocked(
      'CAPACITY_EVIDENCE_BELOW_MIN_STAKE',
      'Retained quote/depth capacity must cover the minimum stake for each complete-set leg.',
      'betting-win quote/depth evidence with available size at or above the local minimum stake.',
    );
  }
  return accepted({ legId, minStakeMinor, maxStakeMinor: evidence.availableSizeMinor });
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}
