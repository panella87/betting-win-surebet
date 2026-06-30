import { accepted, blocked, type BoundaryResult } from '../contracts/local-types.js';

export interface ReadOnlyQueryContractRequest {
  readonly contractVersion: string;
  readonly resource: 'identity' | 'rules' | 'quotes' | 'settlement';
  readonly cursor?: string;
}

export function buildReadOnlyQueryContractRequest(request: ReadOnlyQueryContractRequest): BoundaryResult<ReadOnlyQueryContractRequest> {
  if (request.contractVersion.trim().length === 0) {
    return blocked('QUERY_CONTRACT_NOT_PINNED', 'A pinned betting-win read-only query contract is required before SURE-002.', 'Pinned betting-win query contract version.');
  }
  return accepted(Object.freeze({ ...request }));
}
