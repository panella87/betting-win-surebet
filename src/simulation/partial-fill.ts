import { blocked, type BlockedResult } from '../contracts/local-types.js';

export function partialFillModelStatus(): BlockedResult {
  return blocked('PARTIALFILLMODELSTATUS_BLOCKED_UNTIL_SURE_005', 'This module is intentionally not implemented in SURE-001.', 'SURE-005 implementation approval and pinned upstream evidence.');
}
