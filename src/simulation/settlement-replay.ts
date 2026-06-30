import { blocked, type BlockedResult } from '../contracts/local-types.js';

export function settlementReplayStatus(): BlockedResult {
  return blocked('SETTLEMENTREPLAYSTATUS_BLOCKED_UNTIL_SURE_006', 'This module is intentionally not implemented in SURE-001.', 'SURE-006 implementation approval and pinned upstream evidence.');
}
