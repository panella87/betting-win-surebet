import { accepted, blocked, type BoundaryResult, type ScenarioCashflowRow } from '../contracts/local-types.js';

export interface ScenarioCashflowMatrix {
  readonly rows: readonly ScenarioCashflowRow[];
}

export function validateScenarioCashflowMatrix(rows: readonly ScenarioCashflowRow[]): BoundaryResult<ScenarioCashflowMatrix> {
  if (rows.length === 0) {
    return blocked('SCENARIO_CASHFLOW_EMPTY', 'Scenario cash-flow rows are required.', 'Complete scenario cash-flow matrix.');
  }
  for (const row of rows) {
    if (row.stakeMinor < 0n || row.payoutMinor < 0n || row.feeMinor < 0n || row.costMinor < 0n) {
      return blocked('SCENARIO_CASHFLOW_NEGATIVE_VALUE', 'Cash-flow values must be non-negative fixed-point amounts.', 'Non-negative fixed-point rows.');
    }
  }
  return accepted({ rows: Object.freeze([...rows]) });
}
