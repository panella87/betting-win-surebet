import type { IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';
import type { BwsOperationalStatusSnapshot } from '../operations/service-runtime.js';
import type {
  BwsPinnedStrategyExportQueryRequest,
  BwsReadOnlyQueryResponse,
  BwsReadOnlyQueryService,
  BwsStrategyLedgerQueryRequest,
} from './bws-read-only-query-service.js';

const JSON_CONTENT_TYPE = 'application/json; charset=utf-8';

const HEALTH_PATH = '/health';
const STRATEGY_LEDGER_PATH = '/api/read-only/strategy-ledger';
const PINNED_STRATEGY_EXPORTS_PATH = '/api/read-only/pinned-strategy-exports';
const READINESS_PATH = '/readiness';
const OPERATIONAL_STATUS_UNAVAILABLE = {
  error: {
    code: 'BWS_OPERATIONAL_STATUS_UNAVAILABLE',
    evidenceRequired: 'An explicit BWS health/readiness status snapshot sourced from the closed local runtime.',
    message: 'BWS health/readiness status is unavailable, so the local runtime remains blocked.',
  },
  ok: false,
} satisfies ErrorBody;

const STRATEGY_LEDGER_QUERY_KEYS = new Set([
  'acceptanceState',
  'cursor',
  'expand',
  'pageSize',
  'pinnedStrategyExportRecordId',
  'reportId',
  'runFingerprintSha256',
  'runKind',
  'runReferenceId',
  'sourceKind',
  'sourceManifestHash',
  'upstreamLockRecordId',
]);

const PINNED_STRATEGY_EXPORT_QUERY_KEYS = new Set([
  'cursor',
  'endpointId',
  'expand',
  'exportId',
  'importRunId',
  'pageSize',
  'providerId',
  'sourceSha256',
  'upstreamLockRecordId',
]);

interface ErrorBody {
  readonly error: {
    readonly code: string;
    readonly evidenceRequired?: string;
    readonly message: string;
  };
  readonly ok: false;
}

export interface BwsReadOnlyQueryHttpHandlerOptions {
  readonly getOperationalStatusSnapshot?: () => BwsOperationalStatusSnapshot;
}

export function createBwsReadOnlyQueryHttpHandler(
  service: BwsReadOnlyQueryService,
  options: BwsReadOnlyQueryHttpHandlerOptions = {},
): (request: IncomingMessage, response: ServerResponse<IncomingMessage>) => Promise<void> {
  return async (request, response) => {
    applySecurityHeaders(response);

    if (request.method !== 'GET') {
      response.setHeader('allow', 'GET');
      writeJson(response, 405, {
        error: {
          code: 'BWS_QUERY_METHOD_NOT_ALLOWED',
          message: 'BWS read-only query API accepts only GET requests.',
        },
        ok: false,
      } satisfies ErrorBody);
      return;
    }

    const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
    const pathname = trimTrailingSlash(requestUrl.pathname);

    try {
      if (pathname === HEALTH_PATH) {
        const snapshot = options.getOperationalStatusSnapshot?.();
        if (snapshot === undefined) {
          writeJson(response, 503, OPERATIONAL_STATUS_UNAVAILABLE);
          return;
        }
        writeJson(response, snapshot.health.status === 'healthy' ? 200 : 503, {
          generatedAt: snapshot.generatedAt,
          health: snapshot.health,
          ok: snapshot.health.status === 'healthy',
        });
        return;
      }

      if (pathname === READINESS_PATH) {
        const snapshot = options.getOperationalStatusSnapshot?.();
        if (snapshot === undefined) {
          writeJson(response, 503, OPERATIONAL_STATUS_UNAVAILABLE);
          return;
        }
        writeJson(response, snapshot.readiness.status === 'ready' ? 200 : 503, {
          generatedAt: snapshot.generatedAt,
          observability: snapshot.observability,
          ok: snapshot.readiness.status === 'ready',
          readiness: snapshot.readiness,
        });
        return;
      }

      if (pathname === STRATEGY_LEDGER_PATH) {
        const requestBody = parseStrategyLedgerRequest(requestUrl);
        const result = service.queryStrategyLedger(requestBody);
        if (!result.ok) {
          writeBlockedResponse(response, result.blockers[0]);
          return;
        }
        writeJson(response, 200, result.value);
        return;
      }

      if (pathname === PINNED_STRATEGY_EXPORTS_PATH) {
        const requestBody = parsePinnedStrategyExportRequest(requestUrl);
        const result = service.queryPinnedStrategyExports(requestBody);
        if (!result.ok) {
          writeBlockedResponse(response, result.blockers[0]);
          return;
        }
        writeJson(response, 200, result.value);
        return;
      }

      writeJson(response, 404, {
        error: {
          code: 'BWS_QUERY_PATH_NOT_FOUND',
          message: 'BWS read-only query API path was not found.',
        },
        ok: false,
      } satisfies ErrorBody);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      writeJson(response, 400, {
        error: {
          code: 'BWS_QUERY_REQUEST_INVALID',
          message,
        },
        ok: false,
      } satisfies ErrorBody);
    }
  };
}

function parseStrategyLedgerRequest(url: URL): BwsStrategyLedgerQueryRequest {
  assertAllowedQueryKeys(url, STRATEGY_LEDGER_QUERY_KEYS);
  const cursor = getSingleValue(url, 'cursor');
  const expand = getSingleValue(url, 'expand');
  const acceptanceState = getSingleValue(url, 'acceptanceState');
  const pinnedStrategyExportRecordId = getSingleValue(url, 'pinnedStrategyExportRecordId');
  const reportId = getSingleValue(url, 'reportId');
  const runFingerprintSha256 = getSingleValue(url, 'runFingerprintSha256');
  const runKind = getSingleValue(url, 'runKind');
  const runReferenceId = getSingleValue(url, 'runReferenceId');
  const sourceKind = getSingleValue(url, 'sourceKind');
  const sourceManifestHash = getSingleValue(url, 'sourceManifestHash');
  const upstreamLockRecordId = getSingleValue(url, 'upstreamLockRecordId');
  return Object.freeze({
    ...(cursor === undefined ? {} : { cursor }),
    ...(expand === undefined ? {} : { expand }),
    filters: Object.freeze({
      ...(acceptanceState === undefined ? {} : { acceptanceState }),
      ...(pinnedStrategyExportRecordId === undefined ? {} : { pinnedStrategyExportRecordId }),
      ...(reportId === undefined ? {} : { reportId }),
      ...(runFingerprintSha256 === undefined ? {} : { runFingerprintSha256 }),
      ...(runKind === undefined ? {} : { runKind }),
      ...(runReferenceId === undefined ? {} : { runReferenceId }),
      ...(sourceKind === undefined ? {} : { sourceKind }),
      ...(sourceManifestHash === undefined ? {} : { sourceManifestHash }),
      ...(upstreamLockRecordId === undefined ? {} : { upstreamLockRecordId }),
    }),
    pageSize: requirePositiveIntegerParam(url, 'pageSize'),
  });
}

function parsePinnedStrategyExportRequest(url: URL): BwsPinnedStrategyExportQueryRequest {
  assertAllowedQueryKeys(url, PINNED_STRATEGY_EXPORT_QUERY_KEYS);
  const cursor = getSingleValue(url, 'cursor');
  const expand = getSingleValue(url, 'expand');
  const endpointId = getSingleValue(url, 'endpointId');
  const exportId = getSingleValue(url, 'exportId');
  const importRunId = getSingleValue(url, 'importRunId');
  const providerId = getSingleValue(url, 'providerId');
  const sourceSha256 = getSingleValue(url, 'sourceSha256');
  const upstreamLockRecordId = getSingleValue(url, 'upstreamLockRecordId');
  return Object.freeze({
    ...(cursor === undefined ? {} : { cursor }),
    ...(expand === undefined ? {} : { expand }),
    filters: Object.freeze({
      ...(endpointId === undefined ? {} : { endpointId }),
      ...(exportId === undefined ? {} : { exportId }),
      ...(importRunId === undefined ? {} : { importRunId }),
      ...(providerId === undefined ? {} : { providerId }),
      ...(sourceSha256 === undefined ? {} : { sourceSha256 }),
      ...(upstreamLockRecordId === undefined ? {} : { upstreamLockRecordId }),
    }),
    pageSize: requirePositiveIntegerParam(url, 'pageSize'),
  });
}

function assertAllowedQueryKeys(url: URL, allowedKeys: ReadonlySet<string>): void {
  for (const key of new Set(url.searchParams.keys())) {
    if (!allowedKeys.has(key)) {
      throw new Error(`BWS read-only query parameter ${key} is not supported.`);
    }
  }
}

function getSingleValue(url: URL, key: string): string | undefined {
  const values = url.searchParams.getAll(key);
  if (values.length === 0) {
    return undefined;
  }
  if (values.length > 1) {
    throw new Error(`BWS read-only query parameter ${key} must appear at most once.`);
  }
  const value = values[0];
  if (value === undefined || value.trim().length === 0) {
    throw new Error(`BWS read-only query parameter ${key} must be non-empty when provided.`);
  }
  return value.trim();
}

function requirePositiveIntegerParam(url: URL, key: string): number {
  const value = getSingleValue(url, key);
  if (value === undefined || !/^\d+$/.test(value)) {
    throw new Error(`BWS read-only query parameter ${key} must be a base-10 positive integer.`);
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`BWS read-only query parameter ${key} must be a positive integer.`);
  }
  return parsed;
}

function trimTrailingSlash(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

function applySecurityHeaders(response: ServerResponse<IncomingMessage>): void {
  response.setHeader('cache-control', 'no-store');
  response.setHeader('content-security-policy', "default-src 'none'; frame-ancestors 'none'");
  response.setHeader('permissions-policy', 'camera=(), geolocation=(), microphone=()');
  response.setHeader('referrer-policy', 'no-referrer');
  response.setHeader('x-content-type-options', 'nosniff');
  response.setHeader('x-frame-options', 'DENY');
}

function writeBlockedResponse(
  response: ServerResponse<IncomingMessage>,
  blocker: { readonly code: string; readonly evidenceRequired: string; readonly message: string } | undefined,
): void {
  if (blocker === undefined) {
    writeJson(response, 400, {
      error: {
        code: 'BWS_QUERY_BLOCKED',
        message: 'BWS read-only query request was blocked.',
      },
      ok: false,
    } satisfies ErrorBody);
    return;
  }
  writeJson(response, 400, {
    error: {
      code: blocker.code,
      evidenceRequired: blocker.evidenceRequired,
      message: blocker.message,
    },
    ok: false,
  } satisfies ErrorBody);
}

function writeJson(
  response: ServerResponse<IncomingMessage>,
  statusCode: number,
  body: unknown,
): void {
  const payload = `${JSON.stringify(body)}\n`;
  response.statusCode = statusCode;
  response.setHeader('content-type', JSON_CONTENT_TYPE);
  response.end(payload);
}
