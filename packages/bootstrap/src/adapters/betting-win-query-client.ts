import type { BettingWinUpstreamLock } from '../../../upstream/src/upstream/betting-win-upstream-lock.js';
import { accepted, blocked, type BoundaryResult } from '../contracts/local-types.js';

const READ_ONLY_QUERY_RESOURCES = ['identity', 'rules', 'quotes', 'settlement'] as const;
const ISO_8601_UTC_MILLISECONDS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const GIT_SHA_PATTERN = /^[0-9a-f]{40}$/;
const RETRYABLE_HTTP_STATUSES = new Set([408, 429, 502, 503, 504]);
const READ_ONLY_QUERY_API_CLIENT_PHASE = 'BWS-140';

const RESOURCE_ENDPOINT_PATHS = Object.freeze({
  identity: '/query/identity-entities',
  rules: '/query/rule-profiles',
  quotes: '/query/normalized-records',
  settlement: '/query/normalized-records',
} satisfies Record<ReadOnlyQueryResource, string>);

type ReadOnlyQueryResource = (typeof READ_ONLY_QUERY_RESOURCES)[number];

export interface ReadOnlyQueryContractRequest {
  readonly contractVersion: string;
  readonly resource: ReadOnlyQueryResource;
  readonly cursor?: string;
}

export interface ReadOnlyQueryClientConfig {
  readonly baseUrl: string;
  readonly contractVersion: string;
  readonly fetchImplementation: ReadOnlyQueryFetchLike;
  readonly maxPageSize: number;
  readonly retryBackoffMs: number;
  readonly retryLimit: number;
  readonly timeoutMs: number;
  readonly upstreamLock: BettingWinUpstreamLock;
}

export interface ReadOnlyQueryFetchResponse {
  readonly headers: ReadOnlyQueryHeadersLike;
  readonly ok: boolean;
  readonly status: number;
  text(): Promise<string>;
}

export interface ReadOnlyQueryHeadersLike {
  get(name: string): string | null;
}

export type ReadOnlyQueryFetchLike = (
  input: string,
  init: Readonly<{
    headers: Readonly<Record<string, string>>;
    method: 'GET';
    signal: AbortSignal;
  }>,
) => Promise<ReadOnlyQueryFetchResponse>;

export interface ReadOnlyQueryResponseProvenance {
  readonly commitSha: string;
  readonly repository: string;
  readonly responseReceivedAt: string;
  readonly sourceView: BettingWinUpstreamLock['sourceView'];
  readonly verifiedAt: string;
}

export interface IdentityReadOnlyQueryFilters {
  readonly canonicalId?: string;
  readonly entityType?: string;
  readonly provider?: string;
  readonly providerEntityId?: string;
}

export interface RulesReadOnlyQueryFilters {
  readonly marketFamilyKey?: string;
  readonly outcomeStructureKey?: string;
  readonly provider?: string;
  readonly ruleProfileId?: string;
  readonly sportId?: string;
}

export interface QuotesReadOnlyQueryFilters {
  readonly marketId?: string;
  readonly normalizedKind?: string;
  readonly provider?: string;
  readonly providerGenerationId?: string;
  readonly sourceLineageRecordId?: string;
  readonly viewpoint?: string;
}

export interface SettlementReadOnlyQueryFilters {
  readonly finalityStatus?: string;
  readonly marketId?: string;
  readonly provider?: string;
  readonly providerGenerationId?: string;
  readonly sourceLineageRecordId?: string;
  readonly terminalState?: string;
}

export type ReadOnlyQueryFiltersByResource = {
  readonly identity: IdentityReadOnlyQueryFilters;
  readonly quotes: QuotesReadOnlyQueryFilters;
  readonly rules: RulesReadOnlyQueryFilters;
  readonly settlement: SettlementReadOnlyQueryFilters;
};

export interface ReadOnlyQueryPageRequest<TResource extends ReadOnlyQueryResource> {
  readonly cursor?: string;
  readonly filters?: ReadOnlyQueryFiltersByResource[TResource];
  readonly pageSize: number;
  readonly resource: TResource;
}

export interface IdentityReadOnlyQueryItem {
  readonly canonicalId: string;
  readonly entityType: string;
  readonly providerReferences?: readonly Readonly<Record<string, unknown>>[];
}

export interface RulesReadOnlyQueryItem {
  readonly resultSource?: Readonly<Record<string, unknown>>;
  readonly ruleProfile?: Readonly<Record<string, unknown>>;
}

export interface NormalizedReadOnlyQueryItem {
  readonly normalizedEvidence?: Readonly<Record<string, unknown>>;
  readonly normalizedRejection?: Readonly<Record<string, unknown>>;
  readonly recordType: string;
}

export type ReadOnlyQueryItemsByResource = {
  readonly identity: IdentityReadOnlyQueryItem;
  readonly quotes: NormalizedReadOnlyQueryItem;
  readonly rules: RulesReadOnlyQueryItem;
  readonly settlement: NormalizedReadOnlyQueryItem;
};

export interface ReadOnlyQueryPage<TResource extends ReadOnlyQueryResource> {
  readonly items: readonly ReadOnlyQueryItemsByResource[TResource][];
  readonly nextCursor?: string;
  readonly pageSize: number;
  readonly returnedCount: number;
}

export interface ReadOnlyQueryResponseEnvelope<TResource extends ReadOnlyQueryResource> {
  readonly contractAlias: BettingWinUpstreamLock['contractAlias'];
  readonly contractSchema: BettingWinUpstreamLock['contractSchema'];
  readonly contractVersion: string;
  readonly page: ReadOnlyQueryPage<TResource>;
  readonly provenance: ReadOnlyQueryResponseProvenance;
  readonly resource: TResource;
  readonly surebetProfile: BettingWinUpstreamLock['surebetProfile'];
}

export interface ReadOnlyQueryApiClient {
  readonly config: Readonly<ReadOnlyQueryClientConfig>;
  queryIdentity(
    request: Omit<ReadOnlyQueryPageRequest<'identity'>, 'resource'>,
  ): Promise<BoundaryResult<ReadOnlyQueryResponseEnvelope<'identity'>>>;
  queryQuotes(
    request: Omit<ReadOnlyQueryPageRequest<'quotes'>, 'resource'>,
  ): Promise<BoundaryResult<ReadOnlyQueryResponseEnvelope<'quotes'>>>;
  queryRules(
    request: Omit<ReadOnlyQueryPageRequest<'rules'>, 'resource'>,
  ): Promise<BoundaryResult<ReadOnlyQueryResponseEnvelope<'rules'>>>;
  querySettlement(
    request: Omit<ReadOnlyQueryPageRequest<'settlement'>, 'resource'>,
  ): Promise<BoundaryResult<ReadOnlyQueryResponseEnvelope<'settlement'>>>;
}

export function describeReadOnlyQueryApiClientBoundary(): string {
  return `@betting-win-surebet/bootstrap:${READ_ONLY_QUERY_API_CLIENT_PHASE}`;
}

export function buildReadOnlyQueryContractRequest(request: ReadOnlyQueryContractRequest): BoundaryResult<ReadOnlyQueryContractRequest> {
  if (request.contractVersion.trim().length === 0) {
    return blocked(
      'QUERY_CONTRACT_NOT_PINNED',
      'A pinned betting-win read-only query contract is required before BWS-140.',
      'Pinned betting-win query contract version.',
    );
  }
  if (!isReadOnlyQueryResource(request.resource)) {
    return blocked(
      'QUERY_RESOURCE_UNSUPPORTED',
      'Read-only query contract resource must be one of identity, rules, quotes, or settlement.',
      'Supported pinned betting-win read-only query resource.',
    );
  }
  if (request.cursor !== undefined && request.cursor.trim().length === 0) {
    return blocked(
      'QUERY_CURSOR_INVALID',
      'Read-only query cursor must be a non-empty string when provided.',
      'Pagination cursor from a prior read-only query response.',
    );
  }
  return accepted(
    Object.freeze({
      contractVersion: request.contractVersion.trim(),
      resource: request.resource,
      ...(request.cursor === undefined ? {} : { cursor: request.cursor.trim() }),
    }),
  );
}

export function createReadOnlyQueryApiClient(config: ReadOnlyQueryClientConfig): BoundaryResult<ReadOnlyQueryApiClient> {
  const validatedConfig = validateClientConfig(config);
  if (!validatedConfig.ok) {
    return validatedConfig;
  }

  const clientConfig = validatedConfig.value;
  const client: ReadOnlyQueryApiClient = {
    config: clientConfig,
    queryIdentity(request: Omit<ReadOnlyQueryPageRequest<'identity'>, 'resource'>) {
      return executeReadOnlyQuery(clientConfig, { ...request, resource: 'identity' });
    },
    queryQuotes(request: Omit<ReadOnlyQueryPageRequest<'quotes'>, 'resource'>) {
      return executeReadOnlyQuery(clientConfig, { ...request, resource: 'quotes' });
    },
    queryRules(request: Omit<ReadOnlyQueryPageRequest<'rules'>, 'resource'>) {
      return executeReadOnlyQuery(clientConfig, { ...request, resource: 'rules' });
    },
    querySettlement(request: Omit<ReadOnlyQueryPageRequest<'settlement'>, 'resource'>) {
      return executeReadOnlyQuery(clientConfig, { ...request, resource: 'settlement' });
    },
  };
  return accepted(Object.freeze(client));
}

async function executeReadOnlyQuery<TResource extends ReadOnlyQueryResource>(
  config: Readonly<ReadOnlyQueryClientConfig>,
  request: ReadOnlyQueryPageRequest<TResource>,
): Promise<BoundaryResult<ReadOnlyQueryResponseEnvelope<TResource>>> {
  const requestValidation = validatePageRequest(config, request);
  if (!requestValidation.ok) {
    return requestValidation;
  }

  const validatedRequest = requestValidation.value;
  const targetUrl = buildReadOnlyQueryUrl(config.baseUrl, validatedRequest);
  const headers = buildReadOnlyQueryHeaders(config, validatedRequest.resource);
  const responseResult = await fetchWithRetry(config, targetUrl, headers);
  if (!responseResult.ok) {
    return responseResult;
  }

  return parseReadOnlyQueryResponse(config, validatedRequest, responseResult.value);
}

function validateClientConfig(config: ReadOnlyQueryClientConfig): BoundaryResult<Readonly<ReadOnlyQueryClientConfig>> {
  const contractRequest = buildReadOnlyQueryContractRequest({
    contractVersion: config.contractVersion,
    resource: 'identity',
  });
  if (!contractRequest.ok) {
    return contractRequest;
  }
  if (config.fetchImplementation === undefined || typeof config.fetchImplementation !== 'function') {
    return blocked(
      'QUERY_FETCH_IMPLEMENTATION_MISSING',
      'Read-only query client requires an explicit fetch implementation.',
      'Fetch implementation bound to the read-only betting-win API.',
    );
  }
  const baseUrlResult = validateReadOnlyBaseUrl(config.baseUrl);
  if (!baseUrlResult.ok) {
    return baseUrlResult;
  }
  const timeoutMs = validatePositiveInteger(config.timeoutMs, 'QUERY_TIMEOUT_INVALID', 'Read-only query timeout must be a positive integer in milliseconds.');
  if (!timeoutMs.ok) {
    return timeoutMs;
  }
  const retryLimit = validateNonNegativeInteger(config.retryLimit, 'QUERY_RETRY_LIMIT_INVALID', 'Read-only query retry limit must be a non-negative integer.');
  if (!retryLimit.ok) {
    return retryLimit;
  }
  const retryBackoffMs = validatePositiveInteger(
    config.retryBackoffMs,
    'QUERY_RETRY_BACKOFF_INVALID',
    'Read-only query retry backoff must be a positive integer in milliseconds.',
  );
  if (!retryBackoffMs.ok) {
    return retryBackoffMs;
  }
  const maxPageSize = validatePositiveInteger(
    config.maxPageSize,
    'QUERY_PAGE_SIZE_LIMIT_INVALID',
    'Read-only query max page size must be a positive integer.',
  );
  if (!maxPageSize.ok) {
    return maxPageSize;
  }
  if (!isUpstreamLockCompatible(config.upstreamLock)) {
    return blocked(
      'QUERY_UPSTREAM_LOCK_INCOMPATIBLE',
      'Read-only query client requires a validated betting-win upstream lock for the canonical downstream contract family.',
      'Validated BWS-100 betting-win upstream lock for betting-win.strategy-export.v1.',
    );
  }
  return accepted(
    Object.freeze({
      baseUrl: baseUrlResult.value,
      contractVersion: contractRequest.value.contractVersion,
      fetchImplementation: config.fetchImplementation,
      maxPageSize: maxPageSize.value,
      retryBackoffMs: retryBackoffMs.value,
      retryLimit: retryLimit.value,
      timeoutMs: timeoutMs.value,
      upstreamLock: config.upstreamLock,
    }),
  );
}

function validateReadOnlyBaseUrl(baseUrl: string): BoundaryResult<string> {
  if (typeof baseUrl !== 'string' || baseUrl.trim().length === 0) {
    return blocked(
      'QUERY_BASE_URL_MISSING',
      'Read-only query API mode requires an explicit betting-win base URL.',
      'Explicit read-only betting-win API base URL.',
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    return blocked(
      'QUERY_BASE_URL_INVALID',
      'Read-only query base URL must be a valid absolute URL.',
      'Valid read-only betting-win API base URL.',
    );
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return blocked(
      'QUERY_BASE_URL_PROTOCOL_INVALID',
      'Read-only query base URL must use http or https.',
      'HTTP or HTTPS read-only betting-win API base URL.',
    );
  }
  if (parsed.username.length > 0 || parsed.password.length > 0) {
    return blocked(
      'QUERY_BASE_URL_CREDENTIALS_FORBIDDEN',
      'Read-only query base URL must not embed credentials.',
      'Credential-free read-only betting-win API base URL.',
    );
  }
  if (parsed.search.length > 0 || parsed.hash.length > 0) {
    return blocked(
      'QUERY_BASE_URL_COMPONENTS_INVALID',
      'Read-only query base URL must not include query or fragment components.',
      'Clean read-only betting-win API base URL.',
    );
  }

  return accepted(parsed.toString().replace(/\/+$/, ''));
}

function validatePageRequest<TResource extends ReadOnlyQueryResource>(
  config: Readonly<ReadOnlyQueryClientConfig>,
  request: ReadOnlyQueryPageRequest<TResource>,
): BoundaryResult<Readonly<ReadOnlyQueryPageRequest<TResource>>> {
  const contractRequest = buildReadOnlyQueryContractRequest({
    contractVersion: config.contractVersion,
    resource: request.resource,
    ...(request.cursor === undefined ? {} : { cursor: request.cursor }),
  });
  if (!contractRequest.ok) {
    return contractRequest;
  }
  const pageSize = validatePositiveInteger(
    request.pageSize,
    'QUERY_PAGE_SIZE_INVALID',
    'Read-only query page size must be a positive integer.',
  );
  if (!pageSize.ok) {
    return pageSize;
  }
  if (pageSize.value > config.maxPageSize) {
    return blocked(
      'QUERY_PAGE_SIZE_EXCEEDED',
      `Read-only query page size must not exceed ${config.maxPageSize}.`,
      'Page size within the configured read-only query bound.',
    );
  }
  const filtersResult = validateResourceFilters(request.resource, request.filters);
  if (!filtersResult.ok) {
    return filtersResult;
  }
  return accepted(
    Object.freeze({
      resource: request.resource,
      pageSize: pageSize.value,
      ...(contractRequest.value.cursor === undefined ? {} : { cursor: contractRequest.value.cursor }),
      ...(filtersResult.value === undefined ? {} : { filters: filtersResult.value }),
    } as ReadOnlyQueryPageRequest<TResource>),
  );
}

function validateResourceFilters<TResource extends ReadOnlyQueryResource>(
  resource: TResource,
  filters: ReadOnlyQueryFiltersByResource[TResource] | undefined,
): BoundaryResult<ReadOnlyQueryFiltersByResource[TResource] | undefined> {
  if (filters === undefined) {
    return accepted(undefined);
  }
  if (typeof filters !== 'object' || filters === null || Array.isArray(filters)) {
    return blocked(
      'QUERY_FILTERS_INVALID',
      'Read-only query filters must be an object when provided.',
      'Typed read-only query filter object.',
    );
  }
  for (const [key, value] of Object.entries(filters)) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return blocked(
        'QUERY_FILTER_VALUE_INVALID',
        `Read-only query filter ${key} must be a non-empty string.`,
        `Typed read-only query filter value for ${resource}.`,
      );
    }
  }
  return accepted(Object.freeze({ ...filters }));
}

function buildReadOnlyQueryUrl<TResource extends ReadOnlyQueryResource>(
  baseUrl: string,
  request: Readonly<ReadOnlyQueryPageRequest<TResource>>,
): string {
  const url = new URL(RESOURCE_ENDPOINT_PATHS[request.resource], `${baseUrl}/`);
  url.searchParams.set('pageSize', String(request.pageSize));
  if (request.cursor !== undefined) {
    url.searchParams.set('cursor', request.cursor);
  }
  for (const [key, value] of Object.entries(request.filters ?? {})) {
    url.searchParams.set(key, value);
  }
  for (const expand of getRequiredExpansions(request.resource)) {
    url.searchParams.append('expand', expand);
  }
  if (request.resource === 'quotes') {
    url.searchParams.set('recordFamily', 'quotes');
  }
  if (request.resource === 'settlement') {
    url.searchParams.set('recordFamily', 'settlement');
  }
  return url.toString();
}

function getRequiredExpansions(resource: ReadOnlyQueryResource): readonly string[] {
  switch (resource) {
    case 'identity':
      return ['providerReferences'];
    case 'rules':
      return ['resultSource'];
    case 'quotes':
    case 'settlement':
      return ['generationResolution', 'sourceLineageRecord'];
  }
}

function buildReadOnlyQueryHeaders(
  config: Readonly<ReadOnlyQueryClientConfig>,
  resource: ReadOnlyQueryResource,
): Readonly<Record<string, string>> {
  return Object.freeze({
    accept: 'application/json',
    'x-betting-win-contract-alias': config.upstreamLock.contractAlias,
    'x-betting-win-contract-schema': config.upstreamLock.contractSchema,
    'x-betting-win-contract-version': config.contractVersion,
    'x-betting-win-query-resource': resource,
    'x-betting-win-surebet-profile': config.upstreamLock.surebetProfile,
  });
}

async function fetchWithRetry(
  config: Readonly<ReadOnlyQueryClientConfig>,
  targetUrl: string,
  headers: Readonly<Record<string, string>>,
): Promise<BoundaryResult<ReadOnlyQueryFetchResponse>> {
  for (let attempt = 0; attempt <= config.retryLimit; attempt += 1) {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), config.timeoutMs);
    try {
      const response = await config.fetchImplementation(targetUrl, {
        headers,
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutHandle);
      if (response.ok) {
        return accepted(response);
      }
      if (RETRYABLE_HTTP_STATUSES.has(response.status) && attempt < config.retryLimit) {
        await sleep(config.retryBackoffMs);
        continue;
      }
      return blocked(
        'QUERY_HTTP_STATUS_INVALID',
        `Read-only query request failed with HTTP status ${response.status}.`,
        'Read-only betting-win API response with an accepted success status.',
      );
    } catch (error) {
      clearTimeout(timeoutHandle);
      const isAbort = error instanceof Error && error.name === 'AbortError';
      if ((isAbort || attempt < config.retryLimit) && attempt < config.retryLimit) {
        await sleep(config.retryBackoffMs);
        continue;
      }
      if (isAbort) {
        return blocked(
          'QUERY_TIMEOUT',
          `Read-only query request exceeded the configured timeout of ${config.timeoutMs}ms.`,
          'Faster read-only betting-win API response or a larger explicit timeout.',
        );
      }
      const message = error instanceof Error ? error.message : 'unknown error';
      return blocked(
        'QUERY_FETCH_FAILED',
        `Read-only query request failed before a valid response was received: ${message}.`,
        'Reachable read-only betting-win API endpoint.',
      );
    }
  }

  return blocked(
    'QUERY_RETRY_EXHAUSTED',
    'Read-only query request exhausted the configured retry budget.',
    'Stable read-only betting-win API availability within the configured retry budget.',
  );
}

async function parseReadOnlyQueryResponse<TResource extends ReadOnlyQueryResource>(
  config: Readonly<ReadOnlyQueryClientConfig>,
  request: Readonly<ReadOnlyQueryPageRequest<TResource>>,
  response: ReadOnlyQueryFetchResponse,
): Promise<BoundaryResult<ReadOnlyQueryResponseEnvelope<TResource>>> {
  const contentType = response.headers.get('content-type');
  if (contentType === null || !contentType.toLowerCase().includes('application/json')) {
    return blocked(
      'QUERY_RESPONSE_CONTENT_TYPE_INVALID',
      'Read-only query response must be JSON.',
      'JSON response from the read-only betting-win API.',
    );
  }

  const bodyText = await response.text();
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(bodyText);
  } catch {
    return blocked(
      'QUERY_RESPONSE_JSON_INVALID',
      'Read-only query response body must be valid JSON.',
      'Valid JSON response from the read-only betting-win API.',
    );
  }

  return validateQueryResponseEnvelope(config, request, parsedBody);
}

function validateQueryResponseEnvelope<TResource extends ReadOnlyQueryResource>(
  config: Readonly<ReadOnlyQueryClientConfig>,
  request: Readonly<ReadOnlyQueryPageRequest<TResource>>,
  responseBody: unknown,
): BoundaryResult<ReadOnlyQueryResponseEnvelope<TResource>> {
  const envelope = asRecord(responseBody);
  if (envelope === undefined) {
    return blocked(
      'QUERY_RESPONSE_OBJECT_INVALID',
      'Read-only query response must be a JSON object.',
      'Object-shaped read-only betting-win API response.',
    );
  }

  if (envelope['contractVersion'] !== config.contractVersion) {
    return blocked(
      'QUERY_CONTRACT_NEGOTIATION_FAILED',
      'Read-only query response contract version did not match the pinned request contract.',
      'Matching betting-win read-only query contract version.',
    );
  }
  if (envelope['contractSchema'] !== config.upstreamLock.contractSchema) {
    return blocked(
      'QUERY_CONTRACT_SCHEMA_MISMATCH',
      'Read-only query response contract schema did not match the pinned upstream contract.',
      'Matching betting-win.strategy-export.v1 read-only query contract.',
    );
  }
  if (envelope['contractAlias'] !== config.upstreamLock.contractAlias) {
    return blocked(
      'QUERY_CONTRACT_ALIAS_MISMATCH',
      'Read-only query response contract alias did not match the canonical upstream alias.',
      'Matching betting-win-strategy-export.v1 read-only query contract alias.',
    );
  }
  if (envelope['surebetProfile'] !== config.upstreamLock.surebetProfile) {
    return blocked(
      'QUERY_CONTRACT_PROFILE_MISMATCH',
      'Read-only query response surebet profile did not match the pinned upstream profile.',
      'Matching surebet_standard_binary_v0 read-only query contract profile.',
    );
  }
  if (envelope['resource'] !== request.resource) {
    return blocked(
      'QUERY_RESOURCE_INCOMPATIBLE',
      'Read-only query response resource did not match the requested resource.',
      'Matching read-only betting-win query resource.',
    );
  }

  const provenance = validateQueryProvenance(config.upstreamLock, envelope['provenance']);
  if (!provenance.ok) {
    return provenance;
  }
  const page = validateQueryPage(request.resource, config.maxPageSize, envelope['page']);
  if (!page.ok) {
    return page;
  }

  return accepted(
    Object.freeze({
      contractAlias: config.upstreamLock.contractAlias,
      contractSchema: config.upstreamLock.contractSchema,
      contractVersion: config.contractVersion,
      page: page.value,
      provenance: provenance.value,
      resource: request.resource,
      surebetProfile: config.upstreamLock.surebetProfile,
    }),
  );
}

function validateQueryProvenance(
  upstreamLock: BettingWinUpstreamLock,
  provenanceValue: unknown,
): BoundaryResult<ReadOnlyQueryResponseProvenance> {
  const provenance = asRecord(provenanceValue);
  if (provenance === undefined) {
    return blocked(
      'QUERY_PROVENANCE_MISSING',
      'Read-only query response provenance is required.',
      'Response provenance bound to the verified betting-win upstream lock.',
    );
  }
  const repository = requireStringField(provenance['repository']);
  const commitSha = requireStringField(provenance['commitSha']);
  const sourceView = requireStringField(provenance['sourceView']);
  const verifiedAt = requireStringField(provenance['verifiedAt']);
  const responseReceivedAt = requireStringField(provenance['responseReceivedAt']);
  if (
    repository === undefined
    || commitSha === undefined
    || sourceView === undefined
    || verifiedAt === undefined
    || responseReceivedAt === undefined
  ) {
    return blocked(
      'QUERY_PROVENANCE_INVALID',
      'Read-only query provenance must include repository, commit, source view, and timestamps.',
      'Complete response provenance bound to betting-win committed HEAD.',
    );
  }
  if (repository !== upstreamLock.repository || commitSha !== upstreamLock.commitSha || sourceView !== upstreamLock.sourceView) {
    return blocked(
      'QUERY_PROVENANCE_MISMATCH',
      'Read-only query provenance did not match the pinned betting-win upstream lock.',
      'Response provenance that matches the validated betting-win committed HEAD.',
    );
  }
  if (!GIT_SHA_PATTERN.test(commitSha) || !ISO_8601_UTC_MILLISECONDS.test(verifiedAt) || !ISO_8601_UTC_MILLISECONDS.test(responseReceivedAt)) {
    return blocked(
      'QUERY_PROVENANCE_FORMAT_INVALID',
      'Read-only query provenance fields must use canonical Git SHA and ISO-8601 UTC formats.',
      'Canonical response provenance formats.',
    );
  }

  return accepted(
    Object.freeze({
      commitSha,
      repository,
      responseReceivedAt,
      sourceView: upstreamLock.sourceView,
      verifiedAt,
    }),
  );
}

function validateQueryPage<TResource extends ReadOnlyQueryResource>(
  resource: TResource,
  maxPageSize: number,
  pageValue: unknown,
): BoundaryResult<ReadOnlyQueryPage<TResource>> {
  const page = asRecord(pageValue);
  if (page === undefined) {
    return blocked(
      'QUERY_PAGE_INVALID',
      'Read-only query response page must be an object.',
      'Object-shaped paginated read-only query response page.',
    );
  }
  const pageSize = requireIntegerField(page['pageSize']);
  const returnedCount = requireIntegerField(page['returnedCount']);
  const rawNextCursor = page['nextCursor'];
  const items = Array.isArray(page['items']) ? page['items'] : undefined;
  if (pageSize === undefined || returnedCount === undefined || items === undefined) {
    return blocked(
      'QUERY_PAGE_FIELDS_INVALID',
      'Read-only query page must include pageSize, returnedCount, and items.',
      'Complete paginated read-only query response page.',
    );
  }
  if (pageSize <= 0 || pageSize > maxPageSize || returnedCount < 0 || returnedCount !== items.length || items.length > pageSize) {
    return blocked(
      'QUERY_PAGINATION_INVALID',
      'Read-only query pagination fields were inconsistent with the configured bounds.',
      'Consistent page size, returned count, and cursor metadata.',
    );
  }
  if (rawNextCursor !== undefined && (typeof rawNextCursor !== 'string' || rawNextCursor.length === 0)) {
    return blocked(
      'QUERY_CURSOR_INVALID',
      'Read-only query nextCursor must be a non-empty string when present.',
      'Valid pagination cursor from the read-only betting-win API.',
    );
  }

  const validatedItems: ReadOnlyQueryItemsByResource[TResource][] = [];
  for (const item of items) {
    const validatedItem = validateQueryItem(resource, item);
    if (!validatedItem.ok) {
      return validatedItem;
    }
    validatedItems.push(validatedItem.value);
  }

  return accepted(
    Object.freeze({
      items: Object.freeze(validatedItems),
      ...(rawNextCursor === undefined ? {} : { nextCursor: rawNextCursor }),
      pageSize,
      returnedCount,
    }),
  );
}

function validateQueryItem<TResource extends ReadOnlyQueryResource>(
  resource: TResource,
  itemValue: unknown,
): BoundaryResult<ReadOnlyQueryItemsByResource[TResource]> {
  const item = asRecord(itemValue);
  if (item === undefined) {
    return blocked(
      'QUERY_ITEM_INVALID',
      'Read-only query items must be objects.',
      'Object-shaped read-only query response item.',
    );
  }

  switch (resource) {
    case 'identity':
      return validateIdentityItem(item) as BoundaryResult<ReadOnlyQueryItemsByResource[TResource]>;
    case 'rules':
      return validateRulesItem(item) as BoundaryResult<ReadOnlyQueryItemsByResource[TResource]>;
    case 'quotes':
    case 'settlement':
      return validateNormalizedItem(item) as BoundaryResult<ReadOnlyQueryItemsByResource[TResource]>;
  }
}

function validateIdentityItem(item: Readonly<Record<string, unknown>>): BoundaryResult<IdentityReadOnlyQueryItem> {
  const canonicalId = requireStringField(item['canonicalId']);
  const entityType = requireStringField(item['entityType']);
  const providerReferences = item['providerReferences'];
  if (canonicalId === undefined || entityType === undefined || !Array.isArray(providerReferences) || providerReferences.length === 0) {
    return blocked(
      'QUERY_PROVENANCE_INVALID',
      'Identity query items must include canonical id, entity type, and provider references for provenance.',
      'Identity query item with provider reference provenance.',
    );
  }
  for (const providerReference of providerReferences) {
    const referenceRecord = asRecord(providerReference);
    if (referenceRecord === undefined || requireStringField(referenceRecord['sourceLineageRecordId']) === undefined) {
      return blocked(
        'QUERY_PROVENANCE_INVALID',
        'Identity query provider references must include source lineage record ids.',
        'Identity provider reference provenance.',
      );
    }
  }
  return accepted(
    Object.freeze({
      canonicalId,
      entityType,
      providerReferences: Object.freeze(providerReferences.map((value) => Object.freeze({ ...(value as Record<string, unknown>) }))),
    }),
  );
}

function validateRulesItem(item: Readonly<Record<string, unknown>>): BoundaryResult<RulesReadOnlyQueryItem> {
  const ruleProfile = asRecord(item['ruleProfile']);
  const resultSource = asRecord(item['resultSource']);
  if (ruleProfile === undefined || requireStringField(ruleProfile['ruleProfileId']) === undefined) {
    return blocked(
      'QUERY_RULES_ITEM_INVALID',
      'Rules query items must include a ruleProfile with ruleProfileId.',
      'Rule profile query item from the read-only betting-win API.',
    );
  }
  if (resultSource === undefined || requireStringField(resultSource['resultSourceId']) === undefined) {
    return blocked(
      'QUERY_PROVENANCE_INVALID',
      'Rules query items must include resultSource provenance.',
      'Rule profile result source provenance.',
    );
  }
  return accepted(
    Object.freeze({
      resultSource: Object.freeze({ ...resultSource }),
      ruleProfile: Object.freeze({ ...ruleProfile }),
    }),
  );
}

function validateNormalizedItem(item: Readonly<Record<string, unknown>>): BoundaryResult<NormalizedReadOnlyQueryItem> {
  const recordType = requireStringField(item['recordType']);
  if (recordType !== 'evidence' && recordType !== 'rejection') {
    return blocked(
      'QUERY_NORMALIZED_RECORD_INVALID',
      'Normalized read-only query items must declare recordType evidence or rejection.',
      'Normalized record item from the read-only betting-win API.',
    );
  }
  if (recordType === 'evidence') {
    const normalizedEvidence = asRecord(item['normalizedEvidence']);
    if (normalizedEvidence === undefined || requireStringField(normalizedEvidence['sourceLineageRecordId']) === undefined) {
      return blocked(
        'QUERY_PROVENANCE_INVALID',
        'Normalized evidence items must include source lineage record provenance.',
        'Normalized evidence provenance from the read-only betting-win API.',
      );
    }
    return accepted(
      Object.freeze({
        normalizedEvidence: Object.freeze({ ...normalizedEvidence }),
        recordType,
      }),
    );
  }
  const normalizedRejection = asRecord(item['normalizedRejection']);
  if (normalizedRejection === undefined || requireStringField(normalizedRejection['sourceLineageRecordId']) === undefined) {
    return blocked(
      'QUERY_PROVENANCE_INVALID',
      'Normalized rejection items must include source lineage record provenance.',
      'Normalized rejection provenance from the read-only betting-win API.',
    );
  }
  return accepted(
    Object.freeze({
      normalizedRejection: Object.freeze({ ...normalizedRejection }),
      recordType,
    }),
  );
}

function isUpstreamLockCompatible(lock: BettingWinUpstreamLock): boolean {
  return lock.contractSchema === 'betting-win.strategy-export.v1'
    && lock.contractAlias === 'betting-win-strategy-export.v1'
    && lock.surebetProfile === 'surebet_standard_binary_v0'
    && lock.sourceView === 'committed_git_head';
}

function validatePositiveInteger(value: number, code: string, message: string): BoundaryResult<number> {
  if (!Number.isInteger(value) || value <= 0) {
    return blocked(code, message, 'Explicit positive integer configuration.');
  }
  return accepted(value);
}

function validateNonNegativeInteger(value: number, code: string, message: string): BoundaryResult<number> {
  if (!Number.isInteger(value) || value < 0) {
    return blocked(code, message, 'Explicit non-negative integer configuration.');
  }
  return accepted(value);
}

function requireStringField(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function requireIntegerField(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) ? value : undefined;
}

function asRecord(value: unknown): Readonly<Record<string, unknown>> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Readonly<Record<string, unknown>>
    : undefined;
}

function isReadOnlyQueryResource(value: unknown): value is ReadOnlyQueryResource {
  return typeof value === 'string' && (READ_ONLY_QUERY_RESOURCES as readonly string[]).includes(value);
}

function sleep(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}
