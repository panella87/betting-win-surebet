import { accepted, blocked, type BoundaryResult } from '../contracts/local-types.js';

const READ_ONLY_QUERY_RESOURCES = ['identity', 'rules', 'quotes', 'settlement'] as const;

type ReadOnlyQueryResource = (typeof READ_ONLY_QUERY_RESOURCES)[number];

export interface ReadOnlyQueryContractRequest {
  readonly contractVersion: string;
  readonly resource: ReadOnlyQueryResource;
  readonly cursor?: string;
}

export function buildReadOnlyQueryContractRequest(request: ReadOnlyQueryContractRequest): BoundaryResult<ReadOnlyQueryContractRequest> {
  if (request.contractVersion.trim().length === 0) {
    return blocked('QUERY_CONTRACT_NOT_PINNED', 'A pinned betting-win read-only query contract is required before SURE-002.', 'Pinned betting-win query contract version.');
  }
  if (!isReadOnlyQueryResource(request.resource)) {
    return blocked(
      'QUERY_RESOURCE_UNSUPPORTED',
      'Read-only query contract resource must be one of identity, rules, quotes, or settlement.',
      'Supported pinned betting-win read-only query resource.',
    );
  }
  return accepted(Object.freeze({ ...request }));
}

function isReadOnlyQueryResource(value: unknown): value is ReadOnlyQueryResource {
  return typeof value === 'string' && (READ_ONLY_QUERY_RESOURCES as readonly string[]).includes(value);
}
