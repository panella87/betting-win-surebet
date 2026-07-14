import { accepted, blocked, type BoundaryResult } from '../contracts/local-types.js';

export interface FeeCostModel {
  readonly feeBps: number;
  readonly fixedCostMinor: bigint;
}

export function normalizeFeeCostModel(model: FeeCostModel): BoundaryResult<FeeCostModel> {
  if (!Number.isInteger(model.feeBps) || model.feeBps < 0) {
    return blocked('FEE_BPS_INVALID', 'Fee basis points must be a non-negative integer.', 'Outcome-specific fee model.');
  }
  if (model.fixedCostMinor < 0n) {
    return blocked('FIXED_COST_INVALID', 'Fixed costs must be non-negative fixed-point amounts.', 'Outcome-specific cost model.');
  }
  return accepted(Object.freeze({ ...model }));
}
