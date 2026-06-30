import { blocked, type BlockedResult } from '../contracts/local-types.js';

export interface StakeVectorInputContract {
  readonly matrixHash: string;
  readonly capacityHash: string;
  readonly feeCostHash: string;
}

export function stakeVectorSolverStatus(_input: StakeVectorInputContract): BlockedResult {
  return blocked('STAKE_VECTOR_SOLVER_BLOCKED_UNTIL_SURE_004', 'Stake-vector solving is intentionally not implemented in SURE-001.', 'Pinned betting-win exports plus SURE-004 implementation approval.');
}
