import { accepted, blocked, type BoundaryResult, type CapacityConstraint, type QuoteDepthEvidence } from '../contracts/local-types.js';

export function toCapacityConstraint(legId: string, evidence: QuoteDepthEvidence): BoundaryResult<CapacityConstraint> {
  if (evidence.availableSizeMinor <= 0n) {
    return blocked('CAPACITY_EVIDENCE_MISSING', 'Positive retained quote/depth capacity is required.', 'betting-win quote/depth evidence.');
  }
  return accepted({ legId, minStakeMinor: 1n, maxStakeMinor: evidence.availableSizeMinor });
}
