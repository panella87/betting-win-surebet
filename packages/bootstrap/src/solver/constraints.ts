import { accepted, blocked, type BoundaryResult, type CapacityConstraint } from '../contracts/local-types.js';

export function validateCapacityConstraint(constraint: CapacityConstraint): BoundaryResult<CapacityConstraint> {
  if (constraint.minStakeMinor < 0n || constraint.maxStakeMinor < 0n) {
    return blocked('CAPACITY_CONSTRAINT_NEGATIVE', 'Capacity constraints must be non-negative.', 'Non-negative capacity constraint.');
  }
  if (constraint.minStakeMinor > constraint.maxStakeMinor) {
    return blocked('CAPACITY_CONSTRAINT_INVERTED', 'Minimum stake cannot exceed maximum capacity.', 'Consistent capacity constraint.');
  }
  return accepted(Object.freeze({ ...constraint }));
}
