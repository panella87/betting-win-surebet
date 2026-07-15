import { accepted, blocked, type BoundaryResult, type CapacityConstraint, type QuoteDepthEvidence } from '../contracts/local-types.js';

export function toCapacityConstraint(
  legId: string,
  evidence: QuoteDepthEvidence,
  minStakeMinor: bigint,
): BoundaryResult<CapacityConstraint> {
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
