import { SurebetPersistenceError } from '../errors.js';
import { executePsqlCommand, queryPsqlJsonRows, quoteSqlLiteral, stableJsonStringify, toJsonLiteral } from '../psql.js';
import type { JsonValue, SurebetPersistenceConfig } from '../types.js';

const ISO_UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const SHA256_REGEX = /^[0-9a-f]{64}$/;

export interface SurebetPendingPinnedStrategyExportRecord {
  readonly intakeRecordId: string;
  readonly importRunId: string;
  readonly upstreamLockRecordId: string;
  readonly sourceSha256: string;
  readonly sourceLocator: string;
  readonly contractSchema: 'betting-win.strategy-export.v1';
  readonly contractAlias: 'betting-win-strategy-export.v1';
  readonly surebetProfile: 'surebet_standard_binary_v0';
  readonly exportId: string;
  readonly exportKind: 'pinned_provider_history_bundle';
  readonly exportProfile: 'provider_history_fixture_bundle_v1' | 'provider_history_store_backed_fixture_bundle_v1';
  readonly exportedAt: string;
  readonly providerId: string;
  readonly endpointId: string;
  readonly payloadSha256: string;
  readonly providerGenerationIds: readonly string[];
  readonly sourceLineageRecordIds: readonly string[];
  readonly normalizedEvidenceIds: readonly string[];
  readonly importedAt: string;
}

export interface SurebetPinnedStrategyExportRecord extends SurebetPendingPinnedStrategyExportRecord {
  readonly insertedAt: string;
}

export interface SurebetPinnedStrategyExportListFilters {
  readonly endpointId?: string;
  readonly exportId?: string;
  readonly importRunId?: string;
  readonly providerId?: string;
  readonly sourceSha256?: string;
  readonly upstreamLockRecordId?: string;
}

export interface SurebetPinnedStrategyExportListRequest {
  readonly afterIntakeRecordId?: string;
  readonly filters: SurebetPinnedStrategyExportListFilters;
  readonly limit: number;
}

export class SurebetPinnedStrategyExportRepository {
  readonly #config: SurebetPersistenceConfig;

  constructor(config: SurebetPersistenceConfig) {
    this.#config = config;
  }

  create(record: SurebetPendingPinnedStrategyExportRecord): SurebetPinnedStrategyExportRecord {
    validatePendingRecord(record);
    const existing = this.get(record.intakeRecordId);
    if (existing !== undefined) {
      if (stableJsonStringify(toComparableRecord(existing)) !== stableJsonStringify(toComparablePendingRecord(record))) {
        throw new SurebetPersistenceError(
          'SUREBET_PINNED_STRATEGY_EXPORT_CONFLICT',
          `Surebet pinned strategy export ${record.intakeRecordId} already exists with different content.`,
        );
      }
      return existing;
    }

    const existingBySourceSha = this.getBySourceSha256(record.sourceSha256);
    if (existingBySourceSha !== undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_PINNED_STRATEGY_EXPORT_DUPLICATE_SHA256',
        `Surebet pinned strategy export SHA-256 ${record.sourceSha256} already exists under intake ${existingBySourceSha.intakeRecordId}.`,
      );
    }
    const existingByExportId = this.getByExportId(record.exportId);
    if (existingByExportId !== undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_PINNED_STRATEGY_EXPORT_DUPLICATE_EXPORT_ID',
        `Surebet pinned strategy export ${record.exportId} already exists under intake ${existingByExportId.intakeRecordId}.`,
      );
    }

    executePsqlCommand(
      this.#config,
      `
INSERT INTO surebet.pinned_strategy_exports (
  intake_record_id,
  import_run_id,
  upstream_lock_record_id,
  source_sha256,
  source_locator,
  contract_schema,
  contract_alias,
  surebet_profile,
  export_id,
  export_kind,
  export_profile,
  exported_at,
  provider_id,
  endpoint_id,
  payload_sha256,
  provider_generation_ids_json,
  source_lineage_record_ids_json,
  normalized_evidence_ids_json,
  imported_at
)
VALUES (
  ${quoteSqlLiteral(record.intakeRecordId)},
  ${quoteSqlLiteral(record.importRunId)},
  ${quoteSqlLiteral(record.upstreamLockRecordId)},
  ${quoteSqlLiteral(record.sourceSha256)},
  ${quoteSqlLiteral(record.sourceLocator)},
  ${quoteSqlLiteral(record.contractSchema)},
  ${quoteSqlLiteral(record.contractAlias)},
  ${quoteSqlLiteral(record.surebetProfile)},
  ${quoteSqlLiteral(record.exportId)},
  ${quoteSqlLiteral(record.exportKind)},
  ${quoteSqlLiteral(record.exportProfile)},
  ${quoteSqlLiteral(record.exportedAt)}::timestamptz,
  ${quoteSqlLiteral(record.providerId)},
  ${quoteSqlLiteral(record.endpointId)},
  ${quoteSqlLiteral(record.payloadSha256)},
  ${toJsonLiteral(record.providerGenerationIds as unknown as JsonValue)},
  ${toJsonLiteral(record.sourceLineageRecordIds as unknown as JsonValue)},
  ${toJsonLiteral(record.normalizedEvidenceIds as unknown as JsonValue)},
  ${quoteSqlLiteral(record.importedAt)}::timestamptz
);
`,
    );

    const persisted = this.get(record.intakeRecordId);
    if (persisted === undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_PINNED_STRATEGY_EXPORT_INSERT_MISSING',
        `Surebet pinned strategy export ${record.intakeRecordId} was not persisted.`,
      );
    }
    return persisted;
  }

  get(intakeRecordId: string): SurebetPinnedStrategyExportRecord | undefined {
    const rows = queryPsqlJsonRows<SurebetPinnedStrategyExportRecord>(
      this.#config,
      `
SELECT row_to_json(t)::text
FROM (
  SELECT
    intake_record_id AS "intakeRecordId",
    import_run_id AS "importRunId",
    upstream_lock_record_id AS "upstreamLockRecordId",
    source_sha256 AS "sourceSha256",
    source_locator AS "sourceLocator",
    contract_schema AS "contractSchema",
    contract_alias AS "contractAlias",
    surebet_profile AS "surebetProfile",
    export_id AS "exportId",
    export_kind AS "exportKind",
    export_profile AS "exportProfile",
    to_char(exported_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "exportedAt",
    provider_id AS "providerId",
    endpoint_id AS "endpointId",
    payload_sha256 AS "payloadSha256",
    provider_generation_ids_json AS "providerGenerationIds",
    source_lineage_record_ids_json AS "sourceLineageRecordIds",
    normalized_evidence_ids_json AS "normalizedEvidenceIds",
    to_char(imported_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "importedAt",
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt"
  FROM surebet.pinned_strategy_exports
  WHERE intake_record_id = ${quoteSqlLiteral(requireNonEmptyString(intakeRecordId, 'intakeRecordId'))}
) AS t;
`,
    );
    return rows[0];
  }

  getBySourceSha256(sourceSha256: string): SurebetPinnedStrategyExportRecord | undefined {
    const rows = queryPsqlJsonRows<SurebetPinnedStrategyExportRecord>(
      this.#config,
      `
SELECT row_to_json(t)::text
FROM (
  SELECT
    intake_record_id AS "intakeRecordId",
    import_run_id AS "importRunId",
    upstream_lock_record_id AS "upstreamLockRecordId",
    source_sha256 AS "sourceSha256",
    source_locator AS "sourceLocator",
    contract_schema AS "contractSchema",
    contract_alias AS "contractAlias",
    surebet_profile AS "surebetProfile",
    export_id AS "exportId",
    export_kind AS "exportKind",
    export_profile AS "exportProfile",
    to_char(exported_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "exportedAt",
    provider_id AS "providerId",
    endpoint_id AS "endpointId",
    payload_sha256 AS "payloadSha256",
    provider_generation_ids_json AS "providerGenerationIds",
    source_lineage_record_ids_json AS "sourceLineageRecordIds",
    normalized_evidence_ids_json AS "normalizedEvidenceIds",
    to_char(imported_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "importedAt",
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt"
  FROM surebet.pinned_strategy_exports
  WHERE source_sha256 = ${quoteSqlLiteral(requireSha256(sourceSha256, 'sourceSha256'))}
) AS t;
`,
    );
    return rows[0];
  }

  getByExportId(exportId: string): SurebetPinnedStrategyExportRecord | undefined {
    const rows = queryPsqlJsonRows<SurebetPinnedStrategyExportRecord>(
      this.#config,
      `
SELECT row_to_json(t)::text
FROM (
  SELECT
    intake_record_id AS "intakeRecordId",
    import_run_id AS "importRunId",
    upstream_lock_record_id AS "upstreamLockRecordId",
    source_sha256 AS "sourceSha256",
    source_locator AS "sourceLocator",
    contract_schema AS "contractSchema",
    contract_alias AS "contractAlias",
    surebet_profile AS "surebetProfile",
    export_id AS "exportId",
    export_kind AS "exportKind",
    export_profile AS "exportProfile",
    to_char(exported_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "exportedAt",
    provider_id AS "providerId",
    endpoint_id AS "endpointId",
    payload_sha256 AS "payloadSha256",
    provider_generation_ids_json AS "providerGenerationIds",
    source_lineage_record_ids_json AS "sourceLineageRecordIds",
    normalized_evidence_ids_json AS "normalizedEvidenceIds",
    to_char(imported_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "importedAt",
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt"
  FROM surebet.pinned_strategy_exports
  WHERE export_id = ${quoteSqlLiteral(requireNonEmptyString(exportId, 'exportId'))}
) AS t;
`,
    );
    return rows[0];
  }

  list(request: SurebetPinnedStrategyExportListRequest): readonly SurebetPinnedStrategyExportRecord[] {
    const validated = validateListRequest(request);
    const whereClauses = toListWhereClauses(validated);
    return Object.freeze(
      queryPsqlJsonRows<SurebetPinnedStrategyExportRecord>(
        this.#config,
        `
SELECT row_to_json(t)::text
FROM (
  SELECT
    intake_record_id AS "intakeRecordId",
    import_run_id AS "importRunId",
    upstream_lock_record_id AS "upstreamLockRecordId",
    source_sha256 AS "sourceSha256",
    source_locator AS "sourceLocator",
    contract_schema AS "contractSchema",
    contract_alias AS "contractAlias",
    surebet_profile AS "surebetProfile",
    export_id AS "exportId",
    export_kind AS "exportKind",
    export_profile AS "exportProfile",
    to_char(exported_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "exportedAt",
    provider_id AS "providerId",
    endpoint_id AS "endpointId",
    payload_sha256 AS "payloadSha256",
    provider_generation_ids_json AS "providerGenerationIds",
    source_lineage_record_ids_json AS "sourceLineageRecordIds",
    normalized_evidence_ids_json AS "normalizedEvidenceIds",
    to_char(imported_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "importedAt",
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt"
  FROM surebet.pinned_strategy_exports
  ${whereClauses.length === 0 ? '' : `WHERE ${whereClauses.join('\n    AND ')}`}
  ORDER BY intake_record_id ASC
  LIMIT ${validated.limit}
) AS t;
`,
      ),
    );
  }
}

function validatePendingRecord(record: SurebetPendingPinnedStrategyExportRecord): void {
  requireNonEmptyString(record.intakeRecordId, 'intakeRecordId');
  requireNonEmptyString(record.importRunId, 'importRunId');
  requireNonEmptyString(record.upstreamLockRecordId, 'upstreamLockRecordId');
  requireSha256(record.sourceSha256, 'sourceSha256');
  requireNonEmptyString(record.sourceLocator, 'sourceLocator');
  if (record.contractSchema !== 'betting-win.strategy-export.v1') {
    throw new SurebetPersistenceError(
      'SUREBET_PINNED_STRATEGY_EXPORT_INVALID',
      'Surebet pinned strategy export requires contractSchema betting-win.strategy-export.v1.',
    );
  }
  if (record.contractAlias !== 'betting-win-strategy-export.v1') {
    throw new SurebetPersistenceError(
      'SUREBET_PINNED_STRATEGY_EXPORT_INVALID',
      'Surebet pinned strategy export requires contractAlias betting-win-strategy-export.v1.',
    );
  }
  if (record.surebetProfile !== 'surebet_standard_binary_v0') {
    throw new SurebetPersistenceError(
      'SUREBET_PINNED_STRATEGY_EXPORT_INVALID',
      'Surebet pinned strategy export requires surebetProfile surebet_standard_binary_v0.',
    );
  }
  requireNonEmptyString(record.exportId, 'exportId');
  if (record.exportKind !== 'pinned_provider_history_bundle') {
    throw new SurebetPersistenceError(
      'SUREBET_PINNED_STRATEGY_EXPORT_INVALID',
      'Surebet pinned strategy export requires exportKind pinned_provider_history_bundle.',
    );
  }
  if (
    record.exportProfile !== 'provider_history_fixture_bundle_v1'
    && record.exportProfile !== 'provider_history_store_backed_fixture_bundle_v1'
  ) {
    throw new SurebetPersistenceError(
      'SUREBET_PINNED_STRATEGY_EXPORT_INVALID',
      'Surebet pinned strategy export requires a supported exportProfile.',
    );
  }
  requireIsoTimestamp(record.exportedAt, 'exportedAt');
  requireNonEmptyString(record.providerId, 'providerId');
  requireNonEmptyString(record.endpointId, 'endpointId');
  requireSha256(record.payloadSha256, 'payloadSha256');
  requireStringArray(record.providerGenerationIds, 'providerGenerationIds', { allowEmpty: false });
  requireStringArray(record.sourceLineageRecordIds, 'sourceLineageRecordIds', { allowEmpty: false });
  requireStringArray(record.normalizedEvidenceIds, 'normalizedEvidenceIds', { allowEmpty: true });
  requireIsoTimestamp(record.importedAt, 'importedAt');
}

function toComparableRecord(record: SurebetPinnedStrategyExportRecord): JsonValue {
  return Object.freeze({
    intakeRecordId: record.intakeRecordId,
    importRunId: record.importRunId,
    upstreamLockRecordId: record.upstreamLockRecordId,
    sourceSha256: record.sourceSha256,
    sourceLocator: record.sourceLocator,
    contractSchema: record.contractSchema,
    contractAlias: record.contractAlias,
    surebetProfile: record.surebetProfile,
    exportId: record.exportId,
    exportKind: record.exportKind,
    exportProfile: record.exportProfile,
    exportedAt: record.exportedAt,
    providerId: record.providerId,
    endpointId: record.endpointId,
    payloadSha256: record.payloadSha256,
    providerGenerationIds: record.providerGenerationIds as unknown as JsonValue,
    sourceLineageRecordIds: record.sourceLineageRecordIds as unknown as JsonValue,
    normalizedEvidenceIds: record.normalizedEvidenceIds as unknown as JsonValue,
    importedAt: record.importedAt,
  });
}

function toComparablePendingRecord(record: SurebetPendingPinnedStrategyExportRecord): JsonValue {
  return Object.freeze({
    intakeRecordId: record.intakeRecordId,
    importRunId: record.importRunId,
    upstreamLockRecordId: record.upstreamLockRecordId,
    sourceSha256: record.sourceSha256,
    sourceLocator: record.sourceLocator,
    contractSchema: record.contractSchema,
    contractAlias: record.contractAlias,
    surebetProfile: record.surebetProfile,
    exportId: record.exportId,
    exportKind: record.exportKind,
    exportProfile: record.exportProfile,
    exportedAt: record.exportedAt,
    providerId: record.providerId,
    endpointId: record.endpointId,
    payloadSha256: record.payloadSha256,
    providerGenerationIds: record.providerGenerationIds as unknown as JsonValue,
    sourceLineageRecordIds: record.sourceLineageRecordIds as unknown as JsonValue,
    normalizedEvidenceIds: record.normalizedEvidenceIds as unknown as JsonValue,
    importedAt: record.importedAt,
  });
}

function requireNonEmptyString(value: string | undefined, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new SurebetPersistenceError(
      'SUREBET_PINNED_STRATEGY_EXPORT_INVALID',
      `Surebet pinned strategy export requires a non-empty ${field}.`,
    );
  }
  return value.trim();
}

function requireIsoTimestamp(value: string, field: string): void {
  if (!ISO_UTC_TIMESTAMP.test(value)) {
    throw new SurebetPersistenceError(
      'SUREBET_PINNED_STRATEGY_EXPORT_INVALID',
      `Surebet pinned strategy export requires ${field} to be an ISO-8601 UTC timestamp.`,
    );
  }
}

function requireSha256(value: string, field: string): string {
  const normalized = requireNonEmptyString(value, field).toLowerCase();
  if (!SHA256_REGEX.test(normalized)) {
    throw new SurebetPersistenceError(
      'SUREBET_PINNED_STRATEGY_EXPORT_INVALID',
      `Surebet pinned strategy export requires ${field} to be 64 hexadecimal characters.`,
    );
  }
  return normalized;
}

function requireStringArray(
  value: readonly string[],
  field: string,
  options: Readonly<{ allowEmpty: boolean }>,
): void {
  if (!Array.isArray(value) || (!options.allowEmpty && value.length === 0)) {
    throw new SurebetPersistenceError(
      'SUREBET_PINNED_STRATEGY_EXPORT_INVALID',
      `Surebet pinned strategy export requires ${field} to be ${options.allowEmpty ? 'an array' : 'a non-empty array'}.`,
    );
  }
  const normalized: string[] = [];
  for (const entry of value) {
    normalized.push(requireNonEmptyString(entry, `${field}[]`));
  }
  if (new Set(normalized).size !== normalized.length) {
    throw new SurebetPersistenceError(
      'SUREBET_PINNED_STRATEGY_EXPORT_INVALID',
      `Surebet pinned strategy export requires ${field} to contain unique ids.`,
    );
  }
}

function validateListRequest(
  request: SurebetPinnedStrategyExportListRequest,
): Readonly<SurebetPinnedStrategyExportListRequest> {
  const limit = requirePositiveInteger(request.limit, 'limit');
  const filters = validateListFilters(request.filters);
  const afterIntakeRecordId = request.afterIntakeRecordId === undefined
    ? undefined
    : requireNonEmptyString(request.afterIntakeRecordId, 'afterIntakeRecordId');
  return Object.freeze({
    ...(afterIntakeRecordId === undefined ? {} : { afterIntakeRecordId }),
    filters,
    limit,
  });
}

function validateListFilters(
  filters: SurebetPinnedStrategyExportListFilters,
): Readonly<SurebetPinnedStrategyExportListFilters> {
  const normalized: SurebetPinnedStrategyExportListFilters = {};
  if (filters.endpointId !== undefined) {
    Object.assign(normalized, { endpointId: requireNonEmptyString(filters.endpointId, 'endpointId') });
  }
  if (filters.exportId !== undefined) {
    Object.assign(normalized, { exportId: requireNonEmptyString(filters.exportId, 'exportId') });
  }
  if (filters.importRunId !== undefined) {
    Object.assign(normalized, { importRunId: requireNonEmptyString(filters.importRunId, 'importRunId') });
  }
  if (filters.providerId !== undefined) {
    Object.assign(normalized, { providerId: requireNonEmptyString(filters.providerId, 'providerId') });
  }
  if (filters.sourceSha256 !== undefined) {
    Object.assign(normalized, { sourceSha256: requireSha256(filters.sourceSha256, 'sourceSha256') });
  }
  if (filters.upstreamLockRecordId !== undefined) {
    Object.assign(normalized, {
      upstreamLockRecordId: requireNonEmptyString(filters.upstreamLockRecordId, 'upstreamLockRecordId'),
    });
  }
  return Object.freeze(normalized);
}

function toListWhereClauses(
  request: Readonly<SurebetPinnedStrategyExportListRequest>,
): readonly string[] {
  const clauses: string[] = [];
  if (request.filters.endpointId !== undefined) {
    clauses.push(`endpoint_id = ${quoteSqlLiteral(request.filters.endpointId)}`);
  }
  if (request.filters.exportId !== undefined) {
    clauses.push(`export_id = ${quoteSqlLiteral(request.filters.exportId)}`);
  }
  if (request.filters.importRunId !== undefined) {
    clauses.push(`import_run_id = ${quoteSqlLiteral(request.filters.importRunId)}`);
  }
  if (request.filters.providerId !== undefined) {
    clauses.push(`provider_id = ${quoteSqlLiteral(request.filters.providerId)}`);
  }
  if (request.filters.sourceSha256 !== undefined) {
    clauses.push(`source_sha256 = ${quoteSqlLiteral(request.filters.sourceSha256)}`);
  }
  if (request.filters.upstreamLockRecordId !== undefined) {
    clauses.push(`upstream_lock_record_id = ${quoteSqlLiteral(request.filters.upstreamLockRecordId)}`);
  }
  if (request.afterIntakeRecordId !== undefined) {
    clauses.push(`intake_record_id > ${quoteSqlLiteral(request.afterIntakeRecordId)}`);
  }
  return Object.freeze(clauses);
}

function requirePositiveInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new SurebetPersistenceError(
      'SUREBET_PINNED_STRATEGY_EXPORT_INVALID',
      `Surebet pinned strategy export requires ${field} to be a positive integer.`,
    );
  }
  return value;
}
