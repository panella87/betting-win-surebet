import { SurebetPersistenceError } from '../errors.js';
import { executePsqlCommand, queryPsqlJsonRows, quoteSqlLiteral, stableJsonStringify } from '../psql.js';
import type { JsonValue, SurebetPersistenceConfig } from '../types.js';

const ISO_UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const SHA256_REGEX = /^[0-9a-f]{64}$/;

export interface SurebetPrivatePaperRuntimeSchedulerCheckpointRecord {
  readonly schedulerCheckpointId: string;
  readonly mode: 'api' | 'export';
  readonly runtimeId: string;
  readonly queueName: string;
  readonly upstreamCheckpointId: string;
  readonly upstreamLockRecordId: string;
  readonly configSha256: string;
  readonly lastScheduledApiCycleNumber?: number;
  readonly lastScheduledJobId?: string;
  readonly lastScheduledSourceId?: string;
  readonly lastScheduledAt?: string;
  readonly insertedAt: string;
  readonly updatedAt: string;
}

export interface SurebetPendingPrivatePaperRuntimeSchedulerCheckpointRecord {
  readonly schedulerCheckpointId: string;
  readonly mode: 'api' | 'export';
  readonly runtimeId: string;
  readonly queueName: string;
  readonly upstreamCheckpointId: string;
  readonly upstreamLockRecordId: string;
  readonly configSha256: string;
}

export interface SurebetAdvancePrivatePaperRuntimeSchedulerCheckpointRecord {
  readonly schedulerCheckpointId: string;
  readonly expectedLastScheduledApiCycleNumber?: number;
  readonly lastScheduledApiCycleNumber: number;
  readonly lastScheduledJobId: string;
  readonly lastScheduledSourceId: string;
  readonly lastScheduledAt: string;
}

export interface SurebetPrivatePaperRuntimeSchedulerCheckpointListFilters {
  readonly queueName?: string;
  readonly runtimeId?: string;
  readonly schedulerCheckpointId?: string;
  readonly upstreamCheckpointId?: string;
  readonly upstreamLockRecordId?: string;
}

export interface SurebetPrivatePaperRuntimeSchedulerCheckpointListRequest {
  readonly filters: SurebetPrivatePaperRuntimeSchedulerCheckpointListFilters;
  readonly limit: number;
}

interface RawSchedulerCheckpointRow extends Omit<
  SurebetPrivatePaperRuntimeSchedulerCheckpointRecord,
  'lastScheduledApiCycleNumber' | 'lastScheduledAt' | 'lastScheduledJobId' | 'lastScheduledSourceId'
> {
  readonly lastScheduledApiCycleNumber: number | null;
  readonly lastScheduledAt: string | null;
  readonly lastScheduledJobId: string | null;
  readonly lastScheduledSourceId: string | null;
}

export class SurebetPrivatePaperRuntimeSchedulerCheckpointRepository {
  readonly #config: SurebetPersistenceConfig;

  constructor(config: SurebetPersistenceConfig) {
    this.#config = config;
  }

  create(
    record: SurebetPendingPrivatePaperRuntimeSchedulerCheckpointRecord,
  ): SurebetPrivatePaperRuntimeSchedulerCheckpointRecord {
    validatePendingRecord(record);
    const existing = this.get(record.schedulerCheckpointId);
    if (existing !== undefined) {
      if (stableJsonStringify(toComparableRecord(existing)) !== stableJsonStringify(toComparablePendingRecord(record))) {
        throw new SurebetPersistenceError(
          'SUREBET_PRIVATE_PAPER_SCHEDULER_CHECKPOINT_CONFLICT',
          `Surebet private-paper scheduler checkpoint ${record.schedulerCheckpointId} already exists with different immutable content.`,
        );
      }
      return existing;
    }

    executePsqlCommand(
      this.#config,
      `
INSERT INTO surebet.private_paper_runtime_scheduler_checkpoints (
  scheduler_checkpoint_id,
  mode,
  runtime_id,
  queue_name,
  upstream_checkpoint_id,
  upstream_lock_record_id,
  config_sha256,
  last_scheduled_api_cycle_number,
  last_scheduled_job_id,
  last_scheduled_source_id,
  last_scheduled_at
)
VALUES (
  ${quoteSqlLiteral(record.schedulerCheckpointId)},
  ${quoteSqlLiteral(record.mode)},
  ${quoteSqlLiteral(record.runtimeId)},
  ${quoteSqlLiteral(record.queueName)},
  ${quoteSqlLiteral(record.upstreamCheckpointId)},
  ${quoteSqlLiteral(record.upstreamLockRecordId)},
  ${quoteSqlLiteral(record.configSha256)},
  NULL,
  NULL,
  NULL,
  NULL
);
`,
    );

    return this.require(record.schedulerCheckpointId);
  }

  get(schedulerCheckpointId: string): SurebetPrivatePaperRuntimeSchedulerCheckpointRecord | undefined {
    const rows = queryPsqlJsonRows<RawSchedulerCheckpointRow>(
      this.#config,
      `
SELECT row_to_json(t)::text
FROM (
  SELECT
    scheduler_checkpoint_id AS "schedulerCheckpointId",
    mode,
    runtime_id AS "runtimeId",
    queue_name AS "queueName",
    upstream_checkpoint_id AS "upstreamCheckpointId",
    upstream_lock_record_id AS "upstreamLockRecordId",
    config_sha256 AS "configSha256",
    last_scheduled_api_cycle_number AS "lastScheduledApiCycleNumber",
    last_scheduled_job_id AS "lastScheduledJobId",
    last_scheduled_source_id AS "lastScheduledSourceId",
    CASE
      WHEN last_scheduled_at IS NULL THEN NULL
      ELSE to_char(last_scheduled_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    END AS "lastScheduledAt",
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt",
    to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt"
  FROM surebet.private_paper_runtime_scheduler_checkpoints
  WHERE scheduler_checkpoint_id = ${quoteSqlLiteral(requireNonEmptyString(schedulerCheckpointId, 'schedulerCheckpointId'))}
) AS t;
`,
    );
    const row = rows[0];
    if (row === undefined) {
      return undefined;
    }
    return normalizeRow(row);
  }

  list(
    request: SurebetPrivatePaperRuntimeSchedulerCheckpointListRequest,
  ): readonly SurebetPrivatePaperRuntimeSchedulerCheckpointRecord[] {
    const validated = validateListRequest(request);
    const whereClauses = toListWhereClauses(validated.filters);
    return Object.freeze(
      queryPsqlJsonRows<RawSchedulerCheckpointRow>(
        this.#config,
        `
SELECT row_to_json(t)::text
FROM (
  SELECT
    scheduler_checkpoint_id AS "schedulerCheckpointId",
    mode,
    runtime_id AS "runtimeId",
    queue_name AS "queueName",
    upstream_checkpoint_id AS "upstreamCheckpointId",
    upstream_lock_record_id AS "upstreamLockRecordId",
    config_sha256 AS "configSha256",
    last_scheduled_api_cycle_number AS "lastScheduledApiCycleNumber",
    last_scheduled_job_id AS "lastScheduledJobId",
    last_scheduled_source_id AS "lastScheduledSourceId",
    CASE
      WHEN last_scheduled_at IS NULL THEN NULL
      ELSE to_char(last_scheduled_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    END AS "lastScheduledAt",
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt",
    to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt"
  FROM surebet.private_paper_runtime_scheduler_checkpoints
  ${whereClauses.length === 0 ? '' : `WHERE ${whereClauses.join('\n    AND ')}`}
  ORDER BY
    COALESCE(last_scheduled_at, inserted_at) DESC,
    scheduler_checkpoint_id ASC
  LIMIT ${validated.limit}
) AS t;
`,
      )
        .map((row) => normalizeRow(row))
        .filter((row): row is SurebetPrivatePaperRuntimeSchedulerCheckpointRecord => row !== undefined),
    );
  }

  advance(
    record: SurebetAdvancePrivatePaperRuntimeSchedulerCheckpointRecord,
  ): SurebetPrivatePaperRuntimeSchedulerCheckpointRecord {
    validateAdvanceRecord(record);
    const existing = this.require(record.schedulerCheckpointId);
    if (existing.mode !== 'api' && existing.mode !== 'export') {
      throw new SurebetPersistenceError(
        'SUREBET_PRIVATE_PAPER_SCHEDULER_CHECKPOINT_INVALID',
        `Surebet private-paper scheduler checkpoint ${record.schedulerCheckpointId} must remain in an explicit supported mode.`,
      );
    }
    if (existing.lastScheduledApiCycleNumber !== record.expectedLastScheduledApiCycleNumber) {
      throw new SurebetPersistenceError(
        'SUREBET_PRIVATE_PAPER_SCHEDULER_CHECKPOINT_STALE',
        `Surebet private-paper scheduler checkpoint ${record.schedulerCheckpointId} expected lastScheduledApiCycleNumber ${record.expectedLastScheduledApiCycleNumber ?? 'null'} but found ${existing.lastScheduledApiCycleNumber ?? 'null'}.`,
      );
    }
    if (
      existing.lastScheduledApiCycleNumber !== undefined
      && record.lastScheduledApiCycleNumber <= existing.lastScheduledApiCycleNumber
    ) {
      throw new SurebetPersistenceError(
        'SUREBET_PRIVATE_PAPER_SCHEDULER_CHECKPOINT_INVALID',
        `Surebet private-paper scheduler checkpoint ${record.schedulerCheckpointId} requires a strictly increasing scheduled sequence number.`,
      );
    }

    executePsqlCommand(
      this.#config,
      `
UPDATE surebet.private_paper_runtime_scheduler_checkpoints
SET
  last_scheduled_api_cycle_number = ${record.lastScheduledApiCycleNumber},
  last_scheduled_job_id = ${quoteSqlLiteral(record.lastScheduledJobId)},
  last_scheduled_source_id = ${quoteSqlLiteral(record.lastScheduledSourceId)},
  last_scheduled_at = ${quoteSqlLiteral(record.lastScheduledAt)}::timestamptz,
  updated_at = CURRENT_TIMESTAMP
WHERE scheduler_checkpoint_id = ${quoteSqlLiteral(record.schedulerCheckpointId)};
`,
    );

    return this.require(record.schedulerCheckpointId);
  }

  require(schedulerCheckpointId: string): SurebetPrivatePaperRuntimeSchedulerCheckpointRecord {
    const record = this.get(schedulerCheckpointId);
    if (record === undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_PRIVATE_PAPER_SCHEDULER_CHECKPOINT_NOT_FOUND',
        `Surebet private-paper scheduler checkpoint ${schedulerCheckpointId} does not exist.`,
      );
    }
    return record;
  }
}

function validatePendingRecord(record: SurebetPendingPrivatePaperRuntimeSchedulerCheckpointRecord): void {
  requireNonEmptyString(record.schedulerCheckpointId, 'schedulerCheckpointId');
  requireNonEmptyString(record.runtimeId, 'runtimeId');
  requireNonEmptyString(record.queueName, 'queueName');
  requireNonEmptyString(record.upstreamCheckpointId, 'upstreamCheckpointId');
  requireNonEmptyString(record.upstreamLockRecordId, 'upstreamLockRecordId');
  requireSha256(record.configSha256, 'configSha256');
  if (record.mode !== 'api' && record.mode !== 'export') {
    throw new SurebetPersistenceError(
      'SUREBET_PRIVATE_PAPER_SCHEDULER_CHECKPOINT_INVALID',
      'Surebet private-paper scheduler checkpoints require mode=api or mode=export.',
    );
  }
}

function validateAdvanceRecord(record: SurebetAdvancePrivatePaperRuntimeSchedulerCheckpointRecord): void {
  requireNonEmptyString(record.schedulerCheckpointId, 'schedulerCheckpointId');
  requireNonEmptyString(record.lastScheduledJobId, 'lastScheduledJobId');
  requireNonEmptyString(record.lastScheduledSourceId, 'lastScheduledSourceId');
  requireIsoTimestamp(record.lastScheduledAt, 'lastScheduledAt');
  requirePositiveInteger(record.lastScheduledApiCycleNumber, 'lastScheduledApiCycleNumber');
  if (record.expectedLastScheduledApiCycleNumber !== undefined) {
    requirePositiveInteger(record.expectedLastScheduledApiCycleNumber, 'expectedLastScheduledApiCycleNumber');
  }
}

function validateListRequest(
  request: SurebetPrivatePaperRuntimeSchedulerCheckpointListRequest,
): Readonly<SurebetPrivatePaperRuntimeSchedulerCheckpointListRequest> {
  return Object.freeze({
    filters: validateListFilters(request.filters),
    limit: requirePositiveIntegerValue(request.limit, 'limit'),
  });
}

function validateListFilters(
  filters: SurebetPrivatePaperRuntimeSchedulerCheckpointListFilters,
): Readonly<SurebetPrivatePaperRuntimeSchedulerCheckpointListFilters> {
  const normalized: {
    queueName?: string;
    runtimeId?: string;
    schedulerCheckpointId?: string;
    upstreamCheckpointId?: string;
    upstreamLockRecordId?: string;
  } = {};
  if (filters.queueName !== undefined) {
    normalized.queueName = requireNonEmptyString(filters.queueName, 'queueName');
  }
  if (filters.runtimeId !== undefined) {
    normalized.runtimeId = requireNonEmptyString(filters.runtimeId, 'runtimeId');
  }
  if (filters.schedulerCheckpointId !== undefined) {
    normalized.schedulerCheckpointId = requireNonEmptyString(filters.schedulerCheckpointId, 'schedulerCheckpointId');
  }
  if (filters.upstreamCheckpointId !== undefined) {
    normalized.upstreamCheckpointId = requireNonEmptyString(filters.upstreamCheckpointId, 'upstreamCheckpointId');
  }
  if (filters.upstreamLockRecordId !== undefined) {
    normalized.upstreamLockRecordId = requireNonEmptyString(filters.upstreamLockRecordId, 'upstreamLockRecordId');
  }
  return Object.freeze(normalized);
}

function toListWhereClauses(
  filters: Readonly<SurebetPrivatePaperRuntimeSchedulerCheckpointListFilters>,
): readonly string[] {
  const clauses: string[] = [];
  if (filters.queueName !== undefined) {
    clauses.push(`queue_name = ${quoteSqlLiteral(filters.queueName)}`);
  }
  if (filters.runtimeId !== undefined) {
    clauses.push(`runtime_id = ${quoteSqlLiteral(filters.runtimeId)}`);
  }
  if (filters.schedulerCheckpointId !== undefined) {
    clauses.push(`scheduler_checkpoint_id = ${quoteSqlLiteral(filters.schedulerCheckpointId)}`);
  }
  if (filters.upstreamCheckpointId !== undefined) {
    clauses.push(`upstream_checkpoint_id = ${quoteSqlLiteral(filters.upstreamCheckpointId)}`);
  }
  if (filters.upstreamLockRecordId !== undefined) {
    clauses.push(`upstream_lock_record_id = ${quoteSqlLiteral(filters.upstreamLockRecordId)}`);
  }
  return Object.freeze(clauses);
}

function requireNonEmptyString(value: string | undefined, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new SurebetPersistenceError(
      'SUREBET_PRIVATE_PAPER_SCHEDULER_CHECKPOINT_INVALID',
      `Surebet private-paper scheduler checkpoints require a non-empty ${field}.`,
    );
  }
  return value.trim();
}

function requireSha256(value: string, field: string): void {
  if (!SHA256_REGEX.test(value)) {
    throw new SurebetPersistenceError(
      'SUREBET_PRIVATE_PAPER_SCHEDULER_CHECKPOINT_INVALID',
      `Surebet private-paper scheduler checkpoints require ${field} to be 64 lowercase hexadecimal characters.`,
    );
  }
}

function requireIsoTimestamp(value: string, field: string): void {
  if (!ISO_UTC_TIMESTAMP.test(value)) {
    throw new SurebetPersistenceError(
      'SUREBET_PRIVATE_PAPER_SCHEDULER_CHECKPOINT_INVALID',
      `Surebet private-paper scheduler checkpoints require ${field} to be an ISO-8601 UTC timestamp.`,
    );
  }
}

function requirePositiveInteger(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new SurebetPersistenceError(
      'SUREBET_PRIVATE_PAPER_SCHEDULER_CHECKPOINT_INVALID',
      `Surebet private-paper scheduler checkpoints require ${field} to be a positive integer.`,
    );
  }
}

function requirePositiveIntegerValue(value: number, field: string): number {
  requirePositiveInteger(value, field);
  return value;
}

function normalizeRow(row: RawSchedulerCheckpointRow): SurebetPrivatePaperRuntimeSchedulerCheckpointRecord {
  return Object.freeze({
    configSha256: row.configSha256,
    insertedAt: row.insertedAt,
    mode: row.mode === 'export' ? 'export' : 'api',
    queueName: row.queueName,
    runtimeId: row.runtimeId,
    schedulerCheckpointId: row.schedulerCheckpointId,
    updatedAt: row.updatedAt,
    upstreamCheckpointId: row.upstreamCheckpointId,
    upstreamLockRecordId: row.upstreamLockRecordId,
    ...(row.lastScheduledApiCycleNumber === null ? {} : { lastScheduledApiCycleNumber: row.lastScheduledApiCycleNumber }),
    ...(row.lastScheduledAt === null ? {} : { lastScheduledAt: row.lastScheduledAt }),
    ...(row.lastScheduledJobId === null ? {} : { lastScheduledJobId: row.lastScheduledJobId }),
    ...(row.lastScheduledSourceId === null ? {} : { lastScheduledSourceId: row.lastScheduledSourceId }),
  });
}

function toComparableRecord(record: SurebetPrivatePaperRuntimeSchedulerCheckpointRecord): JsonValue {
  return Object.freeze({
    configSha256: record.configSha256,
    lastScheduledApiCycleNumber: record.lastScheduledApiCycleNumber ?? null,
    lastScheduledAt: record.lastScheduledAt ?? null,
    lastScheduledJobId: record.lastScheduledJobId ?? null,
    lastScheduledSourceId: record.lastScheduledSourceId ?? null,
    mode: record.mode,
    queueName: record.queueName,
    runtimeId: record.runtimeId,
    schedulerCheckpointId: record.schedulerCheckpointId,
    upstreamCheckpointId: record.upstreamCheckpointId,
    upstreamLockRecordId: record.upstreamLockRecordId,
  });
}

function toComparablePendingRecord(
  record: SurebetPendingPrivatePaperRuntimeSchedulerCheckpointRecord,
): JsonValue {
  return Object.freeze({
    configSha256: record.configSha256,
    lastScheduledApiCycleNumber: null,
    lastScheduledAt: null,
    lastScheduledJobId: null,
    lastScheduledSourceId: null,
    mode: record.mode,
    queueName: record.queueName,
    runtimeId: record.runtimeId,
    schedulerCheckpointId: record.schedulerCheckpointId,
    upstreamCheckpointId: record.upstreamCheckpointId,
    upstreamLockRecordId: record.upstreamLockRecordId,
  });
}
