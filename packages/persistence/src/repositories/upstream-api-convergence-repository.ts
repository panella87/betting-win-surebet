import { SurebetPersistenceError } from '../errors.js';
import { executePsqlCommand, queryPsqlJsonRows, quoteSqlLiteral, stableJsonStringify, toJsonLiteral } from '../psql.js';
import type { JsonValue, SurebetPersistenceConfig } from '../types.js';

const ISO_UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const READ_ONLY_QUERY_RESOURCES = ['identity', 'rules', 'quotes', 'settlement'] as const;

export type SurebetUpstreamApiConvergenceResource = (typeof READ_ONLY_QUERY_RESOURCES)[number];

export interface SurebetUpstreamApiResponseProvenance {
  readonly commitSha: string;
  readonly repository: string;
  readonly resource: SurebetUpstreamApiConvergenceResource;
  readonly responseReceivedAt: string;
  readonly sourceView: string;
  readonly verifiedAt: string;
}

export interface SurebetPendingUpstreamApiConvergenceCheckpointRecord {
  readonly checkpointId: string;
  readonly mode: 'api';
  readonly upstreamLockRecordId: string;
  readonly apiBaseUrl: string;
  readonly contractVersion: string;
  readonly pageSize: number;
  readonly maxPagesPerResource: number;
  readonly retryLimit: number;
  readonly retryBackoffMs: number;
  readonly timeoutMs: number;
  readonly currentCycleNumber: number;
  readonly currentResource: SurebetUpstreamApiConvergenceResource;
  readonly currentResourcePageCount: number;
  readonly nextCursor?: string;
  readonly lastImportRunId?: string;
  readonly lastResponseProvenance?: SurebetUpstreamApiResponseProvenance;
  readonly completedCycleCount: number;
  readonly lastCompletedCycleAt?: string;
}

export interface SurebetAdvanceUpstreamApiConvergenceCheckpointRecord {
  readonly checkpointId: string;
  readonly expectedCurrentCycleNumber: number;
  readonly expectedCurrentResource: SurebetUpstreamApiConvergenceResource;
  readonly expectedCurrentResourcePageCount: number;
  readonly expectedNextCursor?: string;
  readonly currentCycleNumber: number;
  readonly currentResource: SurebetUpstreamApiConvergenceResource;
  readonly currentResourcePageCount: number;
  readonly nextCursor?: string;
  readonly lastImportRunId: string;
  readonly lastResponseProvenance: SurebetUpstreamApiResponseProvenance;
  readonly completedCycleCount: number;
  readonly lastCompletedCycleAt?: string;
}

export interface SurebetUpstreamApiConvergenceCheckpointRecord extends SurebetPendingUpstreamApiConvergenceCheckpointRecord {
  readonly insertedAt: string;
  readonly updatedAt: string;
}

interface UpstreamApiCheckpointRow extends Omit<
  SurebetUpstreamApiConvergenceCheckpointRecord,
  'lastCompletedCycleAt' | 'lastImportRunId' | 'lastResponseProvenance' | 'nextCursor'
> {
  readonly lastCompletedCycleAt?: string | null;
  readonly lastImportRunId?: string | null;
  readonly lastResponseProvenance?: JsonValue | null;
  readonly nextCursor?: string | null;
}

export class SurebetUpstreamApiConvergenceRepository {
  readonly #config: SurebetPersistenceConfig;

  constructor(config: SurebetPersistenceConfig) {
    this.#config = config;
  }

  create(
    record: SurebetPendingUpstreamApiConvergenceCheckpointRecord,
  ): SurebetUpstreamApiConvergenceCheckpointRecord {
    validatePendingRecord(record);
    const existing = this.get(record.checkpointId);
    if (existing !== undefined) {
      if (stableJsonStringify(toComparableRecord(existing)) !== stableJsonStringify(toComparablePendingRecord(record))) {
        throw new SurebetPersistenceError(
          'SUREBET_UPSTREAM_API_CONVERGENCE_CONFLICT',
          `Surebet upstream API convergence checkpoint ${record.checkpointId} already exists with different content.`,
        );
      }
      return existing;
    }

    executePsqlCommand(
      this.#config,
      `
INSERT INTO surebet.upstream_api_convergence_checkpoints (
  checkpoint_id,
  mode,
  upstream_lock_record_id,
  api_base_url,
  contract_version,
  page_size,
  max_pages_per_resource,
  retry_limit,
  retry_backoff_ms,
  timeout_ms,
  current_cycle_number,
  current_resource,
  current_resource_page_count,
  next_cursor,
  last_import_run_id,
  last_response_provenance_json,
  completed_cycle_count,
  last_completed_cycle_at
)
VALUES (
  ${quoteSqlLiteral(record.checkpointId)},
  ${quoteSqlLiteral(record.mode)},
  ${quoteSqlLiteral(record.upstreamLockRecordId)},
  ${quoteSqlLiteral(record.apiBaseUrl)},
  ${quoteSqlLiteral(record.contractVersion)},
  ${record.pageSize},
  ${record.maxPagesPerResource},
  ${record.retryLimit},
  ${record.retryBackoffMs},
  ${record.timeoutMs},
  ${record.currentCycleNumber},
  ${quoteSqlLiteral(record.currentResource)},
  ${record.currentResourcePageCount},
  ${toNullableSqlLiteral(record.nextCursor)},
  ${toNullableSqlLiteral(record.lastImportRunId)},
  ${toNullableJsonLiteral(record.lastResponseProvenance as JsonValue | undefined)},
  ${record.completedCycleCount},
  ${toNullableTimestampSqlLiteral(record.lastCompletedCycleAt)}
);
`,
    );

    const persisted = this.get(record.checkpointId);
    if (persisted === undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_UPSTREAM_API_CONVERGENCE_INSERT_MISSING',
        `Surebet upstream API convergence checkpoint ${record.checkpointId} was not persisted.`,
      );
    }
    return persisted;
  }

  advance(
    record: SurebetAdvanceUpstreamApiConvergenceCheckpointRecord,
  ): SurebetUpstreamApiConvergenceCheckpointRecord {
    validateAdvanceRecord(record);
    const existing = this.get(record.checkpointId);
    if (existing === undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_UPSTREAM_API_CONVERGENCE_NOT_FOUND',
        `Surebet upstream API convergence checkpoint ${record.checkpointId} does not exist.`,
      );
    }
    if (
      existing.currentCycleNumber !== record.expectedCurrentCycleNumber
      || existing.currentResource !== record.expectedCurrentResource
      || existing.currentResourcePageCount !== record.expectedCurrentResourcePageCount
      || existing.nextCursor !== record.expectedNextCursor
    ) {
      throw new SurebetPersistenceError(
        'SUREBET_UPSTREAM_API_CONVERGENCE_CURSOR_CONFLICT',
        `Surebet upstream API convergence checkpoint ${record.checkpointId} current cycle state did not match the expected cursor state.`,
      );
    }

    executePsqlCommand(
      this.#config,
      `
UPDATE surebet.upstream_api_convergence_checkpoints
SET
  current_cycle_number = ${record.currentCycleNumber},
  current_resource = ${quoteSqlLiteral(record.currentResource)},
  current_resource_page_count = ${record.currentResourcePageCount},
  next_cursor = ${toNullableSqlLiteral(record.nextCursor)},
  last_import_run_id = ${quoteSqlLiteral(record.lastImportRunId)},
  last_response_provenance_json = ${toJsonLiteral(record.lastResponseProvenance as unknown as JsonValue)},
  completed_cycle_count = ${record.completedCycleCount},
  last_completed_cycle_at = ${toNullableTimestampSqlLiteral(record.lastCompletedCycleAt)},
  updated_at = CURRENT_TIMESTAMP
WHERE checkpoint_id = ${quoteSqlLiteral(record.checkpointId)};
`,
    );

    const persisted = this.get(record.checkpointId);
    if (persisted === undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_UPSTREAM_API_CONVERGENCE_UPDATE_MISSING',
        `Surebet upstream API convergence checkpoint ${record.checkpointId} disappeared after advance.`,
      );
    }
    return persisted;
  }

  get(checkpointId: string): SurebetUpstreamApiConvergenceCheckpointRecord | undefined {
    const rows = queryPsqlJsonRows<UpstreamApiCheckpointRow>(
      this.#config,
      `
SELECT row_to_json(t)::text
FROM (
  SELECT
    checkpoint_id AS "checkpointId",
    mode,
    upstream_lock_record_id AS "upstreamLockRecordId",
    api_base_url AS "apiBaseUrl",
    contract_version AS "contractVersion",
    page_size AS "pageSize",
    max_pages_per_resource AS "maxPagesPerResource",
    retry_limit AS "retryLimit",
    retry_backoff_ms AS "retryBackoffMs",
    timeout_ms AS "timeoutMs",
    current_cycle_number AS "currentCycleNumber",
    current_resource AS "currentResource",
    current_resource_page_count AS "currentResourcePageCount",
    next_cursor AS "nextCursor",
    last_import_run_id AS "lastImportRunId",
    last_response_provenance_json AS "lastResponseProvenance",
    completed_cycle_count AS "completedCycleCount",
    CASE
      WHEN last_completed_cycle_at IS NULL THEN NULL
      ELSE to_char(last_completed_cycle_at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"')
    END AS "lastCompletedCycleAt",
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') AS "insertedAt",
    to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') AS "updatedAt"
  FROM surebet.upstream_api_convergence_checkpoints
  WHERE checkpoint_id = ${quoteSqlLiteral(requireNonEmptyString(checkpointId, 'checkpointId'))}
) AS t;
`,
    );
    const row = rows[0];
    return row === undefined ? undefined : normalizeRow(row);
  }
}

function normalizeRow(row: UpstreamApiCheckpointRow): SurebetUpstreamApiConvergenceCheckpointRecord {
  return Object.freeze({
    apiBaseUrl: row.apiBaseUrl,
    checkpointId: row.checkpointId,
    completedCycleCount: requireSafeInteger(row.completedCycleCount, 'completedCycleCount', { minimum: 0 }),
    contractVersion: requireNonEmptyString(row.contractVersion, 'contractVersion'),
    currentCycleNumber: requireSafeInteger(row.currentCycleNumber, 'currentCycleNumber', { minimum: 1 }),
    currentResource: requireResource(row.currentResource, 'currentResource'),
    currentResourcePageCount: requireSafeInteger(row.currentResourcePageCount, 'currentResourcePageCount', { minimum: 0 }),
    insertedAt: requireIsoTimestamp(row.insertedAt, 'insertedAt'),
    ...(row.lastCompletedCycleAt === null || row.lastCompletedCycleAt === undefined
      ? {}
      : { lastCompletedCycleAt: requireIsoTimestamp(row.lastCompletedCycleAt, 'lastCompletedCycleAt') }),
    ...(row.lastImportRunId === null || row.lastImportRunId === undefined
      ? {}
      : { lastImportRunId: requireNonEmptyString(row.lastImportRunId, 'lastImportRunId') }),
    ...(row.lastResponseProvenance === null || row.lastResponseProvenance === undefined
      ? {}
      : { lastResponseProvenance: validateResponseProvenance(row.lastResponseProvenance) }),
    maxPagesPerResource: requireSafeInteger(row.maxPagesPerResource, 'maxPagesPerResource', { minimum: 1 }),
    mode: requireMode(row.mode),
    ...(row.nextCursor === null || row.nextCursor === undefined
      ? {}
      : { nextCursor: requireNonEmptyString(row.nextCursor, 'nextCursor') }),
    pageSize: requireSafeInteger(row.pageSize, 'pageSize', { minimum: 1 }),
    retryBackoffMs: requireSafeInteger(row.retryBackoffMs, 'retryBackoffMs', { minimum: 1 }),
    retryLimit: requireSafeInteger(row.retryLimit, 'retryLimit', { minimum: 0 }),
    timeoutMs: requireSafeInteger(row.timeoutMs, 'timeoutMs', { minimum: 1 }),
    updatedAt: requireIsoTimestamp(row.updatedAt, 'updatedAt'),
    upstreamLockRecordId: requireNonEmptyString(row.upstreamLockRecordId, 'upstreamLockRecordId'),
  });
}

function validatePendingRecord(record: SurebetPendingUpstreamApiConvergenceCheckpointRecord): void {
  requireNonEmptyString(record.checkpointId, 'checkpointId');
  requireMode(record.mode);
  requireNonEmptyString(record.upstreamLockRecordId, 'upstreamLockRecordId');
  requireNonEmptyString(record.apiBaseUrl, 'apiBaseUrl');
  requireNonEmptyString(record.contractVersion, 'contractVersion');
  requireSafeInteger(record.pageSize, 'pageSize', { minimum: 1 });
  requireSafeInteger(record.maxPagesPerResource, 'maxPagesPerResource', { minimum: 1 });
  requireSafeInteger(record.retryLimit, 'retryLimit', { minimum: 0 });
  requireSafeInteger(record.retryBackoffMs, 'retryBackoffMs', { minimum: 1 });
  requireSafeInteger(record.timeoutMs, 'timeoutMs', { minimum: 1 });
  requireSafeInteger(record.currentCycleNumber, 'currentCycleNumber', { minimum: 1 });
  requireResource(record.currentResource, 'currentResource');
  requireSafeInteger(record.currentResourcePageCount, 'currentResourcePageCount', {
    maximum: record.maxPagesPerResource,
    minimum: 0,
  });
  if (record.currentResourcePageCount === 0 && record.nextCursor !== undefined) {
    throw new SurebetPersistenceError(
      'SUREBET_UPSTREAM_API_CONVERGENCE_INVALID',
      'Surebet upstream API convergence checkpoints must not include nextCursor before the next page request is within a started resource.',
    );
  }
  if (record.nextCursor !== undefined) {
    requireNonEmptyString(record.nextCursor, 'nextCursor');
  }
  if (record.lastImportRunId !== undefined) {
    requireNonEmptyString(record.lastImportRunId, 'lastImportRunId');
  }
  if (record.lastResponseProvenance !== undefined) {
    validateResponseProvenance(record.lastResponseProvenance);
  }
  requireSafeInteger(record.completedCycleCount, 'completedCycleCount', { minimum: 0 });
  if (record.currentCycleNumber !== record.completedCycleCount + 1) {
    throw new SurebetPersistenceError(
      'SUREBET_UPSTREAM_API_CONVERGENCE_INVALID',
      'Surebet upstream API convergence checkpoints require currentCycleNumber to equal completedCycleCount + 1.',
    );
  }
  if (record.lastCompletedCycleAt !== undefined) {
    requireIsoTimestamp(record.lastCompletedCycleAt, 'lastCompletedCycleAt');
  }
}

function validateAdvanceRecord(record: SurebetAdvanceUpstreamApiConvergenceCheckpointRecord): void {
  requireNonEmptyString(record.checkpointId, 'checkpointId');
  requireSafeInteger(record.expectedCurrentCycleNumber, 'expectedCurrentCycleNumber', { minimum: 1 });
  requireResource(record.expectedCurrentResource, 'expectedCurrentResource');
  requireSafeInteger(record.expectedCurrentResourcePageCount, 'expectedCurrentResourcePageCount', { minimum: 0 });
  if (record.expectedNextCursor !== undefined) {
    requireNonEmptyString(record.expectedNextCursor, 'expectedNextCursor');
  }
  validatePendingRecord({
    apiBaseUrl: 'persisted',
    checkpointId: record.checkpointId,
    completedCycleCount: record.completedCycleCount,
    contractVersion: 'persisted',
    currentCycleNumber: record.currentCycleNumber,
    currentResource: record.currentResource,
    currentResourcePageCount: record.currentResourcePageCount,
    lastImportRunId: record.lastImportRunId,
    lastResponseProvenance: record.lastResponseProvenance,
    maxPagesPerResource: record.currentResourcePageCount === 0 ? 1 : record.currentResourcePageCount,
    mode: 'api',
    pageSize: 1,
    retryBackoffMs: 1,
    retryLimit: 0,
    timeoutMs: 1,
    upstreamLockRecordId: 'persisted',
    ...(record.lastCompletedCycleAt === undefined ? {} : { lastCompletedCycleAt: record.lastCompletedCycleAt }),
    ...(record.nextCursor === undefined ? {} : { nextCursor: record.nextCursor }),
  });
}

function validateResponseProvenance(value: unknown): SurebetUpstreamApiResponseProvenance {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new SurebetPersistenceError(
      'SUREBET_UPSTREAM_API_CONVERGENCE_INVALID',
      'Surebet upstream API convergence checkpoints require object-shaped lastResponseProvenance.',
    );
  }
  const record = value as Record<string, unknown>;
  const commitSha = requireNonEmptyString(record.commitSha, 'lastResponseProvenance.commitSha');
  const repository = requireNonEmptyString(record.repository, 'lastResponseProvenance.repository');
  const resource = requireResource(record.resource, 'lastResponseProvenance.resource');
  const responseReceivedAt = requireIsoTimestamp(record.responseReceivedAt, 'lastResponseProvenance.responseReceivedAt');
  const sourceView = requireNonEmptyString(record.sourceView, 'lastResponseProvenance.sourceView');
  const verifiedAt = requireIsoTimestamp(record.verifiedAt, 'lastResponseProvenance.verifiedAt');
  return Object.freeze({
    commitSha,
    repository,
    resource,
    responseReceivedAt,
    sourceView,
    verifiedAt,
  });
}

function toComparableRecord(record: SurebetUpstreamApiConvergenceCheckpointRecord): JsonValue {
  return Object.freeze({
    apiBaseUrl: record.apiBaseUrl,
    checkpointId: record.checkpointId,
    completedCycleCount: record.completedCycleCount,
    contractVersion: record.contractVersion,
    currentCycleNumber: record.currentCycleNumber,
    currentResource: record.currentResource,
    currentResourcePageCount: record.currentResourcePageCount,
    ...(record.lastCompletedCycleAt === undefined ? {} : { lastCompletedCycleAt: record.lastCompletedCycleAt }),
    ...(record.lastImportRunId === undefined ? {} : { lastImportRunId: record.lastImportRunId }),
    ...(record.lastResponseProvenance === undefined ? {} : { lastResponseProvenance: record.lastResponseProvenance as unknown as JsonValue }),
    maxPagesPerResource: record.maxPagesPerResource,
    mode: record.mode,
    ...(record.nextCursor === undefined ? {} : { nextCursor: record.nextCursor }),
    pageSize: record.pageSize,
    retryBackoffMs: record.retryBackoffMs,
    retryLimit: record.retryLimit,
    timeoutMs: record.timeoutMs,
    upstreamLockRecordId: record.upstreamLockRecordId,
  });
}

function toComparablePendingRecord(record: SurebetPendingUpstreamApiConvergenceCheckpointRecord): JsonValue {
  return toComparableRecord(record as SurebetUpstreamApiConvergenceCheckpointRecord);
}

function requireMode(value: unknown): 'api' {
  if (value !== 'api') {
    throw new SurebetPersistenceError(
      'SUREBET_UPSTREAM_API_CONVERGENCE_INVALID',
      'Surebet upstream API convergence checkpoints require mode=api.',
    );
  }
  return 'api';
}

function requireResource(value: unknown, field: string): SurebetUpstreamApiConvergenceResource {
  if (typeof value !== 'string' || !(READ_ONLY_QUERY_RESOURCES as readonly string[]).includes(value)) {
    throw new SurebetPersistenceError(
      'SUREBET_UPSTREAM_API_CONVERGENCE_INVALID',
      `Surebet upstream API convergence checkpoints require ${field} to be one of ${READ_ONLY_QUERY_RESOURCES.join(', ')}.`,
    );
  }
  return value as SurebetUpstreamApiConvergenceResource;
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new SurebetPersistenceError(
      'SUREBET_UPSTREAM_API_CONVERGENCE_INVALID',
      `Surebet upstream API convergence checkpoints require a non-empty ${field}.`,
    );
  }
  return value.trim();
}

function requireIsoTimestamp(value: unknown, field: string): string {
  if (typeof value !== 'string' || !ISO_UTC_TIMESTAMP.test(value)) {
    throw new SurebetPersistenceError(
      'SUREBET_UPSTREAM_API_CONVERGENCE_INVALID',
      `Surebet upstream API convergence checkpoints require ${field} to be an ISO-8601 UTC timestamp.`,
    );
  }
  return value;
}

function requireSafeInteger(
  value: unknown,
  field: string,
  options: Readonly<{ readonly minimum: number; readonly maximum?: number }>,
): number {
  if (
    typeof value !== 'number'
    || !Number.isSafeInteger(value)
    || value < options.minimum
    || (options.maximum !== undefined && value > options.maximum)
  ) {
    throw new SurebetPersistenceError(
      'SUREBET_UPSTREAM_API_CONVERGENCE_INVALID',
      `Surebet upstream API convergence checkpoints require ${field} to be an integer between ${options.minimum} and ${options.maximum ?? 'Infinity'}.`,
    );
  }
  return value;
}

function toNullableSqlLiteral(value: string | undefined): string {
  return value === undefined ? 'NULL' : quoteSqlLiteral(value);
}

function toNullableJsonLiteral(value: JsonValue | undefined): string {
  return value === undefined ? 'NULL' : toJsonLiteral(value);
}

function toNullableTimestampSqlLiteral(value: string | undefined): string {
  return value === undefined ? 'NULL' : `${quoteSqlLiteral(value)}::timestamptz`;
}
