import { SurebetPersistenceError } from '../errors.js';
import { executePsqlCommand, queryPsqlJsonRows, quoteSqlLiteral, stableJsonStringify, toJsonLiteral } from '../psql.js';
import type { JsonValue, SurebetPersistenceConfig } from '../types.js';

const ISO_UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const SHA256_REGEX = /^[0-9a-f]{64}$/;
const B1_CONTRACT_SCHEMA = 'betting-win.b1_multi_venue_markets.v1';
const B1_CONTRACT_ALIAS = 'betting-win-b1-multi-venue-markets.v1';
const B1_UPSTREAM_READINESS = 'blocked_until_betting_win_b1_multi_venue_markets_v1';

export type SurebetB1UpstreamConvergenceMode = 'fixture_offline' | 'blocked_upstream_contract_absent';

export interface SurebetB1UpstreamConvergenceCheckpointRecord {
  readonly checkpointId: string;
  readonly contractSchema: typeof B1_CONTRACT_SCHEMA;
  readonly contractAlias: typeof B1_CONTRACT_ALIAS;
  readonly mode: SurebetB1UpstreamConvergenceMode;
  readonly upstreamReadiness: typeof B1_UPSTREAM_READINESS;
  readonly upstreamLockFingerprint: string;
  readonly sourceManifestHash: string;
  readonly lastSeenExportId?: string;
  readonly lastSeenSnapshotTimeUtc?: string;
  readonly importedRowCount: number;
  readonly blockerCode: string;
  readonly blockerDetails: JsonValue;
  readonly runtimeEvidence: false;
  readonly insertedAt: string;
  readonly updatedAt: string;
}

export interface SurebetPendingB1UpstreamConvergenceCheckpointRecord {
  readonly checkpointId: string;
  readonly mode: SurebetB1UpstreamConvergenceMode;
  readonly upstreamLockFingerprint: string;
  readonly sourceManifestHash: string;
  readonly lastSeenExportId?: string;
  readonly lastSeenSnapshotTimeUtc?: string;
  readonly importedRowCount: number;
  readonly blockerCode: string;
  readonly blockerDetails: JsonValue;
  readonly runtimeEvidence: false;
}

interface RawB1UpstreamConvergenceCheckpointRow extends Omit<
  SurebetB1UpstreamConvergenceCheckpointRecord,
  'lastSeenExportId' | 'lastSeenSnapshotTimeUtc'
> {
  readonly lastSeenExportId: string | null;
  readonly lastSeenSnapshotTimeUtc: string | null;
}

export class SurebetB1UpstreamConvergenceRepository {
  readonly #config: SurebetPersistenceConfig;

  constructor(config: SurebetPersistenceConfig) {
    this.#config = config;
  }

  create(
    record: SurebetPendingB1UpstreamConvergenceCheckpointRecord,
  ): SurebetB1UpstreamConvergenceCheckpointRecord {
    const validated = validatePendingRecord(record);
    const existing = this.get(validated.checkpointId);
    if (existing !== undefined) {
      if (stableJsonStringify(toComparableRecord(existing)) !== stableJsonStringify(toComparablePendingRecord(validated))) {
        throw new SurebetPersistenceError(
          'SUREBET_B1_UPSTREAM_CHECKPOINT_CONFLICT',
          `B1 upstream convergence checkpoint ${validated.checkpointId} already exists with different immutable content.`,
        );
      }
      return existing;
    }

    executePsqlCommand(
      this.#config,
      `
INSERT INTO surebet.b1_upstream_convergence_checkpoints (
  checkpoint_id,
  contract_schema,
  contract_alias,
  mode,
  upstream_readiness,
  upstream_lock_fingerprint,
  source_manifest_hash,
  last_seen_export_id,
  last_seen_snapshot_time_utc,
  imported_row_count,
  blocker_code,
  blocker_details_json,
  runtime_evidence
)
VALUES (
  ${quoteSqlLiteral(validated.checkpointId)},
  ${quoteSqlLiteral(B1_CONTRACT_SCHEMA)},
  ${quoteSqlLiteral(B1_CONTRACT_ALIAS)},
  ${quoteSqlLiteral(validated.mode)},
  ${quoteSqlLiteral(B1_UPSTREAM_READINESS)},
  ${quoteSqlLiteral(validated.upstreamLockFingerprint)},
  ${quoteSqlLiteral(validated.sourceManifestHash)},
  ${optionalText(validated.lastSeenExportId)},
  ${optionalTimestamp(validated.lastSeenSnapshotTimeUtc)},
  ${validated.importedRowCount},
  ${quoteSqlLiteral(validated.blockerCode)},
  ${toJsonLiteral(validated.blockerDetails)},
  false
);
`,
    );

    return this.require(validated.checkpointId);
  }

  get(checkpointId: string): SurebetB1UpstreamConvergenceCheckpointRecord | undefined {
    const rows = queryPsqlJsonRows<RawB1UpstreamConvergenceCheckpointRow>(
      this.#config,
      `
SELECT row_to_json(t)::text
FROM (
  SELECT
    checkpoint_id AS "checkpointId",
    contract_schema AS "contractSchema",
    contract_alias AS "contractAlias",
    mode,
    upstream_readiness AS "upstreamReadiness",
    upstream_lock_fingerprint AS "upstreamLockFingerprint",
    source_manifest_hash AS "sourceManifestHash",
    last_seen_export_id AS "lastSeenExportId",
    CASE
      WHEN last_seen_snapshot_time_utc IS NULL THEN NULL
      ELSE to_char(last_seen_snapshot_time_utc AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    END AS "lastSeenSnapshotTimeUtc",
    imported_row_count AS "importedRowCount",
    blocker_code AS "blockerCode",
    blocker_details_json AS "blockerDetails",
    runtime_evidence AS "runtimeEvidence",
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt",
    to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt"
  FROM surebet.b1_upstream_convergence_checkpoints
  WHERE checkpoint_id = ${quoteSqlLiteral(requireNonEmptyString(checkpointId, 'checkpointId'))}
) AS t;
`,
    );
    const row = rows[0];
    if (row === undefined) {
      return undefined;
    }
    return normalizeRow(row);
  }

  require(checkpointId: string): SurebetB1UpstreamConvergenceCheckpointRecord {
    const record = this.get(checkpointId);
    if (record === undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_B1_UPSTREAM_CHECKPOINT_NOT_FOUND',
        `B1 upstream convergence checkpoint ${checkpointId} does not exist.`,
      );
    }
    return record;
  }
}

function validatePendingRecord(
  record: SurebetPendingB1UpstreamConvergenceCheckpointRecord,
): Readonly<SurebetPendingB1UpstreamConvergenceCheckpointRecord> {
  requireNonEmptyString(record.checkpointId, 'checkpointId');
  if (record.mode !== 'fixture_offline' && record.mode !== 'blocked_upstream_contract_absent') {
    throw new SurebetPersistenceError(
      'SUREBET_B1_UPSTREAM_CHECKPOINT_MODE_INVALID',
      'B1 upstream convergence checkpoints require an explicit offline or blocked mode.',
    );
  }
  requireSha256(record.upstreamLockFingerprint, 'upstreamLockFingerprint');
  requireSha256(record.sourceManifestHash, 'sourceManifestHash');
  requireNonNegativeInteger(record.importedRowCount, 'importedRowCount');
  requireNonEmptyString(record.blockerCode, 'blockerCode');
  if (record.lastSeenExportId !== undefined) {
    requireNonEmptyString(record.lastSeenExportId, 'lastSeenExportId');
  }
  if (record.lastSeenSnapshotTimeUtc !== undefined) {
    requireIsoTimestamp(record.lastSeenSnapshotTimeUtc, 'lastSeenSnapshotTimeUtc');
  }
  if (record.runtimeEvidence !== false) {
    throw new SurebetPersistenceError(
      'SUREBET_B1_RUNTIME_EVIDENCE_FORBIDDEN',
      'B1 local persistence records must not claim runtime evidence.',
    );
  }
  return Object.freeze({ ...record });
}

function normalizeRow(
  row: RawB1UpstreamConvergenceCheckpointRow,
): SurebetB1UpstreamConvergenceCheckpointRecord {
  const { lastSeenExportId, lastSeenSnapshotTimeUtc, ...required } = row;
  return Object.freeze({
    ...required,
    ...(lastSeenExportId === null ? {} : { lastSeenExportId }),
    ...(lastSeenSnapshotTimeUtc === null ? {} : { lastSeenSnapshotTimeUtc }),
  });
}

function toComparableRecord(record: SurebetB1UpstreamConvergenceCheckpointRecord): JsonValue {
  const comparable: SurebetPendingB1UpstreamConvergenceCheckpointRecord = {
    blockerCode: record.blockerCode,
    blockerDetails: record.blockerDetails,
    checkpointId: record.checkpointId,
    importedRowCount: record.importedRowCount,
    mode: record.mode,
    runtimeEvidence: record.runtimeEvidence,
    sourceManifestHash: record.sourceManifestHash,
    upstreamLockFingerprint: record.upstreamLockFingerprint,
  };
  const withOptionals: SurebetPendingB1UpstreamConvergenceCheckpointRecord = {
    ...comparable,
    ...(record.lastSeenExportId === undefined ? {} : { lastSeenExportId: record.lastSeenExportId }),
    ...(record.lastSeenSnapshotTimeUtc === undefined ? {} : { lastSeenSnapshotTimeUtc: record.lastSeenSnapshotTimeUtc }),
  };
  return toComparablePendingRecord(withOptionals);
}

function toComparablePendingRecord(record: SurebetPendingB1UpstreamConvergenceCheckpointRecord): JsonValue {
  return Object.freeze({
    blockerCode: record.blockerCode,
    blockerDetails: record.blockerDetails,
    checkpointId: record.checkpointId,
    importedRowCount: record.importedRowCount,
    lastSeenExportId: record.lastSeenExportId,
    lastSeenSnapshotTimeUtc: record.lastSeenSnapshotTimeUtc,
    mode: record.mode,
    runtimeEvidence: record.runtimeEvidence,
    sourceManifestHash: record.sourceManifestHash,
    upstreamLockFingerprint: record.upstreamLockFingerprint,
  }) as JsonValue;
}

function optionalText(value: string | undefined): string {
  if (value === undefined) {
    return 'NULL';
  }
  return quoteSqlLiteral(value);
}

function optionalTimestamp(value: string | undefined): string {
  if (value === undefined) {
    return 'NULL';
  }
  return `${quoteSqlLiteral(value)}::timestamptz`;
}

function requireNonEmptyString(value: string, name: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new SurebetPersistenceError(
      'SUREBET_B1_REQUIRED_FIELD_MISSING',
      `B1 persistence field ${name} must be a non-empty string.`,
    );
  }
  return value;
}

function requireSha256(value: string, name: string): void {
  requireNonEmptyString(value, name);
  if (!SHA256_REGEX.test(value)) {
    throw new SurebetPersistenceError(
      'SUREBET_B1_SHA256_INVALID',
      `B1 persistence field ${name} must be a SHA-256 hex string.`,
    );
  }
}

function requireIsoTimestamp(value: string, name: string): void {
  requireNonEmptyString(value, name);
  if (!ISO_UTC_TIMESTAMP.test(value)) {
    throw new SurebetPersistenceError(
      'SUREBET_B1_TIMESTAMP_INVALID',
      `B1 persistence field ${name} must be an ISO-8601 UTC timestamp.`,
    );
  }
}

function requireNonNegativeInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new SurebetPersistenceError(
      'SUREBET_B1_INTEGER_INVALID',
      `B1 persistence field ${name} must be a non-negative integer.`,
    );
  }
}
