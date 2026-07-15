import { SurebetPersistenceError } from '../errors.js';
import { executePsqlCommand, queryPsqlJsonRows, quoteSqlLiteral, stableJsonStringify, toJsonLiteral } from '../psql.js';
import type { JsonValue, SurebetPersistenceConfig } from '../types.js';

const ISO_UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export interface SurebetPendingImportRunRecord {
  readonly importRunId: string;
  readonly upstreamLockRecordId: string;
  readonly sourceKind: string;
  readonly sourceLocator: string;
  readonly requestedAt: string;
  readonly startedAt: string;
  readonly metadata: JsonValue;
}

export interface SurebetFinalizeImportRunRecord {
  readonly importRunId: string;
  readonly outcome: 'succeeded' | 'failed';
  readonly completedAt: string;
  readonly importedRecordCount: number;
  readonly failureCode?: string;
  readonly failureDetails?: JsonValue;
}

export interface SurebetImportRunRecord {
  readonly importRunId: string;
  readonly upstreamLockRecordId: string;
  readonly sourceKind: string;
  readonly sourceLocator: string;
  readonly requestedAt: string;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly outcome: 'running' | 'succeeded' | 'failed';
  readonly importedRecordCount?: number;
  readonly failureCode?: string;
  readonly failureDetails?: JsonValue;
  readonly metadata: JsonValue;
  readonly insertedAt: string;
  readonly updatedAt: string;
}

interface RawSurebetImportRunRecord extends Omit<
  SurebetImportRunRecord,
  'completedAt' | 'failureCode' | 'failureDetails' | 'importedRecordCount'
> {
  readonly completedAt?: string | null;
  readonly failureCode?: string | null;
  readonly failureDetails?: JsonValue | null;
  readonly importedRecordCount?: number | null;
}

export class SurebetImportRunRepository {
  readonly #config: SurebetPersistenceConfig;

  constructor(config: SurebetPersistenceConfig) {
    this.#config = config;
  }

  create(record: SurebetPendingImportRunRecord): SurebetImportRunRecord {
    validatePendingRecord(record);
    const existing = this.get(record.importRunId);
    if (existing !== undefined) {
      if (stableJsonStringify(toComparableImportRun(existing)) !== stableJsonStringify(toComparablePendingRecord(record))) {
        throw new SurebetPersistenceError(
          'SUREBET_IMPORT_RUN_CONFLICT',
          `Surebet import run ${record.importRunId} already exists with different content.`,
        );
      }
      return existing;
    }

    executePsqlCommand(
      this.#config,
      `
INSERT INTO surebet.import_runs (
  import_run_id,
  upstream_lock_record_id,
  source_kind,
  source_locator,
  requested_at,
  started_at,
  completed_at,
  outcome,
  imported_record_count,
  failure_code,
  failure_details_json,
  import_metadata_json
)
VALUES (
  ${quoteSqlLiteral(record.importRunId)},
  ${quoteSqlLiteral(record.upstreamLockRecordId)},
  ${quoteSqlLiteral(record.sourceKind)},
  ${quoteSqlLiteral(record.sourceLocator)},
  ${quoteSqlLiteral(record.requestedAt)}::timestamptz,
  ${quoteSqlLiteral(record.startedAt)}::timestamptz,
  NULL,
  'running',
  NULL,
  NULL,
  NULL,
  ${toJsonLiteral(record.metadata)}
);
`,
    );

    const persisted = this.get(record.importRunId);
    if (persisted === undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_IMPORT_RUN_INSERT_MISSING',
        `Surebet import run ${record.importRunId} was not persisted.`,
      );
    }
    return persisted;
  }

  finalize(record: SurebetFinalizeImportRunRecord): SurebetImportRunRecord {
    validateFinalizeRecord(record);
    const existing = this.get(record.importRunId);
    if (existing === undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_IMPORT_RUN_NOT_FOUND',
        `Surebet import run ${record.importRunId} does not exist.`,
      );
    }
    if (existing.outcome === 'running') {
      executePsqlCommand(
        this.#config,
        `
UPDATE surebet.import_runs
SET
  completed_at = ${quoteSqlLiteral(record.completedAt)}::timestamptz,
  outcome = ${quoteSqlLiteral(record.outcome)},
  imported_record_count = ${record.importedRecordCount},
  failure_code = ${toNullableSqlLiteral(record.failureCode)},
  failure_details_json = ${toNullableJsonLiteral(record.failureDetails)},
  updated_at = CURRENT_TIMESTAMP
WHERE import_run_id = ${quoteSqlLiteral(record.importRunId)};
`,
      );
      const persisted = this.get(record.importRunId);
      if (persisted === undefined) {
        throw new SurebetPersistenceError(
          'SUREBET_IMPORT_RUN_UPDATE_MISSING',
          `Surebet import run ${record.importRunId} disappeared after finalization.`,
        );
      }
      return persisted;
    }

    if (stableJsonStringify(toComparableImportRun(existing)) !== stableJsonStringify(toComparableFinalizedRecord(existing, record))) {
      throw new SurebetPersistenceError(
        'SUREBET_IMPORT_RUN_FINALIZATION_CONFLICT',
        `Surebet import run ${record.importRunId} was already finalized with different content.`,
      );
    }
    return existing;
  }

  get(importRunId: string): SurebetImportRunRecord | undefined {
    const rows = queryPsqlJsonRows<RawSurebetImportRunRecord>(
      this.#config,
      `
SELECT row_to_json(t)::text
FROM (
  SELECT
    import_run_id AS "importRunId",
    upstream_lock_record_id AS "upstreamLockRecordId",
    source_kind AS "sourceKind",
    source_locator AS "sourceLocator",
    to_char(requested_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "requestedAt",
    to_char(started_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "startedAt",
    CASE
      WHEN completed_at IS NULL THEN NULL
      ELSE to_char(completed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    END AS "completedAt",
    outcome,
    imported_record_count AS "importedRecordCount",
    failure_code AS "failureCode",
    failure_details_json AS "failureDetails",
    import_metadata_json AS metadata,
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt",
    to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt"
  FROM surebet.import_runs
  WHERE import_run_id = ${quoteSqlLiteral(requireNonEmptyString(importRunId, 'importRunId'))}
) AS t;
`,
    );
    const record = rows[0];
    return record === undefined ? undefined : normalizeImportRunRecord(record);
  }
}

function validatePendingRecord(record: SurebetPendingImportRunRecord): void {
  requireNonEmptyString(record.importRunId, 'importRunId');
  requireNonEmptyString(record.upstreamLockRecordId, 'upstreamLockRecordId');
  requireNonEmptyString(record.sourceKind, 'sourceKind');
  requireNonEmptyString(record.sourceLocator, 'sourceLocator');
  requireIsoTimestamp(record.requestedAt, 'requestedAt');
  requireIsoTimestamp(record.startedAt, 'startedAt');
  stableJsonStringify(record.metadata);
}

function validateFinalizeRecord(record: SurebetFinalizeImportRunRecord): void {
  requireNonEmptyString(record.importRunId, 'importRunId');
  requireIsoTimestamp(record.completedAt, 'completedAt');
  if (!Number.isSafeInteger(record.importedRecordCount) || record.importedRecordCount < 0) {
    throw new SurebetPersistenceError(
      'SUREBET_IMPORT_RUN_INVALID',
      'Surebet import run finalization requires a non-negative integer importedRecordCount.',
    );
  }
  if (record.outcome === 'failed') {
    requireNonEmptyString(record.failureCode, 'failureCode');
    if (record.failureDetails === undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_IMPORT_RUN_INVALID',
        'Surebet failed import run finalization requires failureDetails.',
      );
    }
    stableJsonStringify(record.failureDetails);
    return;
  }
  if (record.failureCode !== undefined || record.failureDetails !== undefined) {
    throw new SurebetPersistenceError(
      'SUREBET_IMPORT_RUN_INVALID',
      'Surebet succeeded import run finalization must not carry failure details.',
    );
  }
}

function requireNonEmptyString(value: string | undefined, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new SurebetPersistenceError(
      'SUREBET_IMPORT_RUN_INVALID',
      `Surebet import run requires a non-empty ${field}.`,
    );
  }
  return value.trim();
}

function requireIsoTimestamp(value: string, field: string): void {
  if (!ISO_UTC_TIMESTAMP.test(value)) {
    throw new SurebetPersistenceError(
      'SUREBET_IMPORT_RUN_INVALID',
      `Surebet import run requires ${field} to be an ISO-8601 UTC timestamp.`,
    );
  }
}

function toNullableSqlLiteral(value: string | undefined): string {
  return value === undefined ? 'NULL' : quoteSqlLiteral(value);
}

function toNullableJsonLiteral(value: JsonValue | undefined): string {
  return value === undefined ? 'NULL' : toJsonLiteral(value);
}

function toComparableImportRun(record: SurebetImportRunRecord): JsonValue {
  return Object.freeze({
    completedAt: record.completedAt ?? null,
    failureCode: record.failureCode ?? null,
    failureDetails: record.failureDetails ?? null,
    importRunId: record.importRunId,
    importedRecordCount: record.importedRecordCount ?? null,
    metadata: record.metadata,
    outcome: record.outcome,
    requestedAt: record.requestedAt,
    sourceKind: record.sourceKind,
    sourceLocator: record.sourceLocator,
    startedAt: record.startedAt,
    upstreamLockRecordId: record.upstreamLockRecordId,
  });
}

function toComparablePendingRecord(record: SurebetPendingImportRunRecord): JsonValue {
  return Object.freeze({
    completedAt: null,
    failureCode: null,
    failureDetails: null,
    importRunId: record.importRunId,
    importedRecordCount: null,
    metadata: record.metadata,
    outcome: 'running',
    requestedAt: record.requestedAt,
    sourceKind: record.sourceKind,
    sourceLocator: record.sourceLocator,
    startedAt: record.startedAt,
    upstreamLockRecordId: record.upstreamLockRecordId,
  });
}

function toComparableFinalizedRecord(
  existing: SurebetImportRunRecord,
  record: SurebetFinalizeImportRunRecord,
): JsonValue {
  return Object.freeze({
    completedAt: record.completedAt,
    failureCode: record.failureCode ?? null,
    failureDetails: record.failureDetails ?? null,
    importRunId: existing.importRunId,
    importedRecordCount: record.importedRecordCount,
    metadata: existing.metadata,
    outcome: record.outcome,
    requestedAt: existing.requestedAt,
    sourceKind: existing.sourceKind,
    sourceLocator: existing.sourceLocator,
    startedAt: existing.startedAt,
    upstreamLockRecordId: existing.upstreamLockRecordId,
  });
}

function normalizeImportRunRecord(record: RawSurebetImportRunRecord): SurebetImportRunRecord {
  const {
    completedAt,
    failureCode,
    failureDetails,
    importedRecordCount,
    ...requiredFields
  } = record;
  return Object.freeze({
    ...requiredFields,
    ...(completedAt == null ? {} : { completedAt }),
    ...(failureCode == null ? {} : { failureCode }),
    ...(failureDetails == null ? {} : { failureDetails }),
    ...(importedRecordCount == null ? {} : { importedRecordCount }),
  });
}
