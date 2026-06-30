import test from 'node:test';
import assert from 'node:assert/strict';
import { stakeVectorSolverStatus } from '../src/solver/stake-vector.js';

test('stake-vector solving is blocked in SURE-001', () => {
  const result = stakeVectorSolverStatus({ matrixHash: 'm', capacityHash: 'c', feeCostHash: 'f' });
  assert.equal(result.ok, false);
  assert.equal(result.blockers[0]?.code, 'STAKE_VECTOR_SOLVER_BLOCKED_UNTIL_SURE_004');
});
