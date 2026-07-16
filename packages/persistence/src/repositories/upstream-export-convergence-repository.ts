import { SurebetPersistenceError } from '../errors.js';
import { executePsqlCommand, queryPsqlJsonRows, quoteSqlLiteral, stableJsonStringify } from '../psql.js';
import type { JsonValue, SurebetPersistenceConfig } from '../types.js';

const ISO_UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const SHA256_REGEX = /^[0-9a-f]{64}$/;

export interface SurebetPendingUpstreamExportConvergenceCheckpointRecord {
  readonly checkpointId: string;
  readonly mode: 'export';
  readonly upstreamLockRecordId: string;
  readonly selectionManifestLocator: string;
  readonly selectionManifestSha256: string;
  readonly contractSchema: 'betting-win.strategy-export.v1';
  readonly contractAlias: 'betting-win-strategy-export.v1';
  readonly surebetProfile: 'surebet_standard_binary_v0';
  readonly selectionCount: number;
  readonly nextSelectionIndex: number;
  readonly lastSelectionCursor?: string;
  readonly lastImportRunId?: string;
  readonly lastPinnedStrategyExportRecordId?: string;
  readonly lastSourceSha256?: string;
  readonly completedAt?: string;
}

export interface SurebetAdvanceUpstreamExportConvergenceCheckpointRecord {
  readonly checkpointId: string;
  readonly expectedNextSelectionIndex: number;
  readonly nextSelectionIndex: number;
  readonly lastSelectionCursor: string;
  readonly lastImportRunId: string;
  readonly lastPinnedStrategyExportRecordId: string;
  readonly lastSourceSha256: string;
  readonly completedAt?: string;
}

export interface SurebetUpstreamExportConvergenceCheckpointRecord
  extends SurebetPendingUpstreamExportConvergenceCheckpointRecord {
  readonly insertedAt: string;
  readonly updatedAt: string;
}

export class SurebetUpstreamExportConvergenceRepository {
  readonly #config: SurebetPersistenceConfig;

  constructor(config: SurebetPersistenceConfig) {
    this.#config = config;
  }

  create(
    record: SurebetPendingUpstreamExportConvergenceCheckpointRecord,
  ): SurebetUpstreamExportConvergenceCheckpointRecord {
    validatePendingRecord(record);
    const existing = this.get(record.checkpointId);
    if (existing !== undefined) {
      if (stableJsonStringify(toComparableRecord(existing)) !== stableJsonStringify(toComparablePendingRecord(record))) {
        throw new SurebetPersistenceError(
          'SUREBET_UPSTREAM_EXPORT_CONVERGENCE_CONFLICT',
          `Surebet upstream export convergence checkpoint ${record.checkpointId} already exists with different content.`,
        );
      }
      return existing;
    }

    executePsqlCommand(
      this.#config,
      `
INSERT INTO surebet.upstream_export_convergence_checkpoints (
  checkpoint_id,
  mode,
  upstream_lock_record_id,
  selection_manifest_locator,
  selection_manifest_sha256,
  contract_schema,
  contract_alias,
  surebet_profile,
  selection_count,
  next_selection_index,
  last_selection_cursor,
  last_import_run_id,
  last_pinned_strategy_export_record_id,
  last_source_sha256,
  completed_at
)
VALUES (
  ${quoteSqlLiteral(record.checkpointId)},
  ${quoteSqlLiteral(record.mode)},
  ${quoteSqlLiteral(record.upstreamLockRecordId)},
  ${quoteSqlLiteral(record.selectionManifestLocator)},
  ${quoteSqlLiteral(record.selectionManifestSha256)},
  ${quoteSqlLiteral(record.contractSchema)},
  ${quoteSqlLiteral(record.contractAlias)},
  ${quoteSqlLiteral(record.surebetProfile)},
  ${record.selectionCount},
  ${record.nextSelectionIndex},
  ${toNullableSqlLiteral(record.lastSelectionCursor)},
  ${toNullableSqlLiteral(record.lastImportRunId)},
  ${toNullableSqlLiteral(record.lastPinnedStrategyExportRecordId)},
  ${toNullableSqlLiteral(record.lastSourceSha256)},
  ${toNullableTimestampSqlLiteral(record.completedAt)}
);
`,
    );

    const persisted = this.get(record.checkpointId);
    if (persisted === undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_UPSTREAM_EXPORT_CONVERGENCE_INSERT_MISSING',
        `Surebet upstream export convergence checkpoint ${record.checkpointId} was not persisted.`,
      );
    }
    return persisted;
  }

  advance(
    record: SurebetAdvanceUpstreamExportConvergenceCheckpointRecord,
  ): SurebetUpstreamExportConvergenceCheckpointRecord {
    validateAdvanceRecord(record);
    const existing = this.get(record.checkpointId);
    if (existing === undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_UPSTREAM_EXPORT_CONVERGENCE_NOT_FOUND',
        `Surebet upstream export convergence checkpoint ${record.checkpointId} does not exist.`,
      );
    }
    if (existing.nextSelectionIndex !== record.expectedNextSelectionIndex) {
      throw new SurebetPersistenceError(
        'SUREBET_UPSTREAM_EXPORT_CONVERGENCE_CURSOR_CONFLICT',
        `Surebet upstream export convergence checkpoint ${record.checkpointId} expected nextSelectionIndex ${record.expectedNextSelectionIndex} but found ${existing.nextSelectionIndex}.`,
      );
    }
    if (record.nextSelectionIndex > existing.selectionCount) {
      throw new SurebetPersistenceError(
        'SUREBET_UPSTREAM_EXPORT_CONVERGENCE_CURSOR_INVALID',
        `Surebet upstream export convergence checkpoint ${record.checkpointId} nextSelectionIndex exceeds selectionCount.`,
      );
    }

    executePsqlCommand(
      this.#config,
      `
UPDATE surebet.upstream_export_convergence_checkpoints
SET
  next_selection_index = ${record.nextSelectionIndex},
  last_selection_cursor = ${quoteSqlLiteral(record.lastSelectionCursor)},
  last_import_run_id = ${quoteSqlLiteral(record.lastImportRunId)},
  last_pinned_strategy_export_record_id = ${quoteSqlLiteral(record.lastPinnedStrategyExportRecordId)},
  last_source_sha256 = ${quoteSqlLiteral(record.lastSourceSha256)},
  completed_at = ${toNullableTimestampSqlLiteral(record.completedAt)},
  updated_at = CURRENT_TIMESTAMP
WHERE checkpoint_id = ${quoteSqlLiteral(record.checkpointId)};
`,
    );

    const persisted = this.get(record.checkpointId);
    if (persisted === undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_UPSTREAM_EXPORT_CONVERGENCE_UPDATE_MISSING',
        `Surebet upstream export convergence checkpoint ${record.checkpointId} disappeared after advance.`,
      );
    }
    return persisted;
  }

  get(checkpointId: string): SurebetUpstreamExportConvergenceCheckpointRecord | undefined {
    const rows = queryPsqlJsonRows<SurebetUpstreamExportConvergenceCheckpointRecord>(
      this.#config,
      `
SELECT row_to_json(t)::text
FROM (
  SELECT
    checkpoint_id AS "checkpointId",
    mode,
    upstream_lock_record_id AS "upstreamLockRecordId",
    selection_manifest_locator AS "selectionManifestLocator",
    selection_manifest_sha256 AS "selectionManifestSha256",
    contract_schema AS "contractSchema",
    contract_alias AS "contractAlias",
    surebet_profile AS "surebetProfile",
    selection_count AS "selectionCount",
    next_selection_index AS "nextSelectionIndex",
    last_selection_cursor AS "lastSelectionCursor",
    last_import_run_id AS "lastImportRunId",
    last_pinned_strategy_export_record_id AS "lastPinnedStrategyExportRecordId",
    last_source_sha256 AS "lastSourceSha256",
    CASE
      WHEN completed_at IS NULL THEN NULL
      ELSE to_char(completed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    END AS "completedAt",
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt",
    to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt"
  FROM surebet.upstream_export_convergence_checkpoints
  WHERE checkpoint_id = ${quoteSqlLiteral(requireNonEmptyString(checkpointId, 'checkpointId'))}
) AS t;
`,
    );
    return rows[0];
  }
}

function validatePendingRecord(record: SurebetPendingUpstreamExportConvergenceCheckpointRecord): void {
  requireNonEmptyString(record.checkpointId, 'checkpointId');
  if (record.mode !== 'export') {
    throw new SurebetPersistenceError(
      'SUREBET_UPSTREAM_EXPORT_CONVERGENCE_INVALID',
      'Surebet upstream export convergence checkpoints require mode=export.',
    );
  }
  requireNonEmptyString(record.upstreamLockRecordId, 'upstreamLockRecordId');
  requireNonEmptyString(record.selectionManifestLocator, 'selectionManifestLocator');
  requireSha256(record.selectionManifestSha256, 'selectionManifestSha256');
  if (record.contractSchema !== 'betting-win.strategy-export.v1') {
    throw new SurebetPersistenceError(
      'SUREBET_UPSTREAM_EXPORT_CONVERGENCE_INVALID',
      'Surebet upstream export convergence checkpoints require contractSchema betting-win.strategy-export.v1.',
    );
  }
  if (record.contractAlias !== 'betting-win-strategy-export.v1') {
    throw new SurebetPersistenceError(
      'SUREBET_UPSTREAM_EXPORT_CONVERGENCE_INVALID',
      'Surebet upstream export convergence checkpoints require contractAlias betting-win-strategy-export.v1.',
    );
  }
  if (record.surebetProfile !== 'surebet_standard_binary_v0') {
    throw new SurebetPersistenceError(
      'SUREBET_UPSTREAM_EXPORT_CONVERGENCE_INVALID',
      'Surebet upstream export convergence checkpoints require surebetProfile surebet_standard_binary_v0.',
    );
  }
  requireSafeInteger(record.selectionCount, 'selectionCount', { minimum: 1 });
  requireSafeInteger(record.nextSelectionIndex, 'nextSelectionIndex', { minimum: 0, maximum: record.selectionCount });
  validateCursorState(record);
}

function validateAdvanceRecord(record: SurebetAdvanceUpstreamExportConvergenceCheckpointRecord): void {
  requireNonEmptyString(record.checkpointId, 'checkpointId');
  requireSafeInteger(record.expectedNextSelectionIndex, 'expectedNextSelectionIndex', { minimum: 0 });
  requireSafeInteger(record.nextSelectionIndex, 'nextSelectionIndex', { minimum: 1 });
  if (record.nextSelectionIndex <= record.expectedNextSelectionIndex) {
    throw new SurebetPersistenceError(
      'SUREBET_UPSTREAM_EXPORT_CONVERGENCE_INVALID',
      'Surebet upstream export convergence advance must move nextSelectionIndex forward.',
    );
  }
  requireNonEmptyString(record.lastSelectionCursor, 'lastSelectionCursor');
  requireNonEmptyString(record.lastImportRunId, 'lastImportRunId');
  requireNonEmptyString(record.lastPinnedStrategyExportRecordId, 'lastPinnedStrategyExportRecordId');
  requireSha256(record.lastSourceSha256, 'lastSourceSha256');
  if (record.completedAt !== undefined) {
    requireIsoTimestamp(record.completedAt, 'completedAt');
  }
}

function validateCursorState(record: {
  readonly nextSelectionIndex: number;
  readonly selectionCount: number;
  readonly lastSelectionCursor?: string;
  readonly lastImportRunId?: string;
  readonly lastPinnedStrategyExportRecordId?: string;
  readonly lastSourceSha256?: string;
  readonly completedAt?: string;
}): void {
  const hasCursorState = record.lastSelectionCursor !== undefined
    || record.lastImportRunId !== undefined
    || record.lastPinnedStrategyExportRecordId !== undefined
    || record.lastSourceSha256 !== undefined;
  if (record.nextSelectionIndex === 0) {
    if (hasCursorState) {
      throw new SurebetPersistenceError(
        'SUREBET_UPSTREAM_EXPORT_CONVERGENCE_INVALID',
        'Surebet upstream export convergence checkpoints must not include cursor state before the first selection is processed.',
      );
    }
  } else {
    requireNonEmptyString(record.lastSelectionCursor, 'lastSelectionCursor');
    requireNonEmptyString(record.lastImportRunId, 'lastImportRunId');
    requireNonEmptyString(record.lastPinnedStrategyExportRecordId, 'lastPinnedStrategyExportRecordId');
    requireSha256(record.lastSourceSha256, 'lastSourceSha256');
  }
  if (record.nextSelectionIndex === record.selectionCount) {
    requireIsoTimestamp(record.completedAt, 'completedAt');
    return;
  }
  if (record.completedAt !== undefined) {
    throw new SurebetPersistenceError(
      'SUREBET_UPSTREAM_EXPORT_CONVERGENCE_INVALID',
      'Surebet upstream export convergence checkpoints must not set completedAt before the final selection is processed.',
    );
  }
}

function requireNonEmptyString(value: string | undefined, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new SurebetPersistenceError(
      'SUREBET_UPSTREAM_EXPORT_CONVERGENCE_INVALID',
      `Surebet upstream export convergence checkpoints require a non-empty ${field}.`,
    );
  }
  return value.trim();
}

function requireSha256(value: string | undefined, field: string): string {
  const normalized = requireNonEmptyString(value, field);
  if (!SHA256_REGEX.test(normalized)) {
    throw new SurebetPersistenceError(
      'SUREBET_UPSTREAM_EXPORT_CONVERGENCE_INVALID',
      `Surebet upstream export convergence checkpoints require ${field} to be 64 lowercase hexadecimal characters.`,
    );
  }
  return normalized;
}

function requireIsoTimestamp(value: string | undefined, field: string): string {
  const normalized = requireNonEmptyString(value, field);
  if (!ISO_UTC_TIMESTAMP.test(normalized)) {
    throw new SurebetPersistenceError(
      'SUREBET_UPSTREAM_EXPORT_CONVERGENCE_INVALID',
      `Surebet upstream export convergence checkpoints require ${field} to be an ISO-8601 UTC timestamp.`,
    );
  }
  return normalized;
}

function requireSafeInteger(
  value: number,
  field: string,
  options: { readonly minimum: number; readonly maximum?: number },
): number {
  if (!Number.isSafeInteger(value) || value < options.minimum || (options.maximum !== undefined && value > options.maximum)) {
    throw new SurebetPersistenceError(
      'SUREBET_UPSTREAM_EXPORT_CONVERGENCE_INVALID',
      `Surebet upstream export convergence checkpoints require ${field} to be an integer between ${options.minimum} and ${options.maximum ?? 'Infinity'}.`,
    );
  }
  return value;
}

function toNullableSqlLiteral(value: string | undefined): string {
  return value === undefined ? 'NULL' : quoteSqlLiteral(value);
}

function toNullableTimestampSqlLiteral(value: string | undefined): string {
  return value === undefined ? 'NULL' : `${quoteSqlLiteral(value)}::timestamptz`;
}

function toComparablePendingRecord(record: SurebetPendingUpstreamExportConvergenceCheckpointRecord): JsonValue {
  return Object.freeze({
    checkpointId: record.checkpointId,
    contractAlias: record.contractAlias,
    contractSchema: record.contractSchema,
    mode: record.mode,
    nextSelectionIndex: record.nextSelectionIndex,
    selectionCount: record.selectionCount,
    selectionManifestLocator: record.selectionManifestLocator,
    selectionManifestSha256: record.selectionManifestSha256,
    surebetProfile: record.surebetProfile,
    upstreamLockRecordId: record.upstreamLockRecordId,
    ...(record.completedAt === undefined ? {} : { completedAt: record.completedAt }),
    ...(record.lastImportRunId === undefined ? {} : { lastImportRunId: record.lastImportRunId }),
    ...(record.lastPinnedStrategyExportRecordId === undefined
      ? {}
      : { lastPinnedStrategyExportRecordId: record.lastPinnedStrategyExportRecordId }),
    ...(record.lastSelectionCursor === undefined ? {} : { lastSelectionCursor: record.lastSelectionCursor }),
    ...(record.lastSourceSha256 === undefined ? {} : { lastSourceSha256: record.lastSourceSha256 }),
  });
}

function toComparableRecord(record: SurebetUpstreamExportConvergenceCheckpointRecord): JsonValue {
  return Object.freeze({
    checkpointId: record.checkpointId,
    contractAlias: record.contractAlias,
    contractSchema: record.contractSchema,
    mode: record.mode,
    nextSelectionIndex: record.nextSelectionIndex,
    selectionCount: record.selectionCount,
    selectionManifestLocator: record.selectionManifestLocator,
    selectionManifestSha256: record.selectionManifestSha256,
    surebetProfile: record.surebetProfile,
    upstreamLockRecordId: record.upstreamLockRecordId,
    ...(record.completedAt === undefined ? {} : { completedAt: record.completedAt }),
    ...(record.lastImportRunId === undefined ? {} : { lastImportRunId: record.lastImportRunId }),
    ...(record.lastPinnedStrategyExportRecordId === undefined
      ? {}
      : { lastPinnedStrategyExportRecordId: record.lastPinnedStrategyExportRecordId }),
    ...(record.lastSelectionCursor === undefined ? {} : { lastSelectionCursor: record.lastSelectionCursor }),
    ...(record.lastSourceSha256 === undefined ? {} : { lastSourceSha256: record.lastSourceSha256 }),
  });
}
