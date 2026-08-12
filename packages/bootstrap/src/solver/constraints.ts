import { accepted, blocked, type BoundaryResult, type CapacityConstraint } from '../contracts/local-types.js';

export function validateCapacityConstraint(constraint: CapacityConstraint): BoundaryResult<CapacityConstraint> {
  if (typeof constraint !== 'object' || constraint === null || Array.isArray(constraint)) {
    return blocked('CAPACITY_CONSTRAINT_INVALID', 'Capacity constraints must use bigint minor-unit values.', 'Bigint min/max capacity constraint.');
  }
  if (typeof constraint.minStakeMinor !== 'bigint' || typeof constraint.maxStakeMinor !== 'bigint') {
    return blocked('CAPACITY_CONSTRAINT_INVALID', 'Capacity constraints must use bigint minor-unit values.', 'Bigint min/max capacity constraint.');
  }
  if (constraint.minStakeMinor <= 0n || constraint.maxStakeMinor <= 0n) {
    return blocked('CAPACITY_CONSTRAINT_NON_POSITIVE', 'Capacity constraints must be positive.', 'Positive min/max capacity constraint.');
  }
  if (constraint.minStakeMinor > constraint.maxStakeMinor) {
    return blocked('CAPACITY_CONSTRAINT_INVERTED', 'Minimum stake cannot exceed maximum capacity.', 'Consistent capacity constraint.');
  }
  return accepted(Object.freeze({ ...constraint }));
}
