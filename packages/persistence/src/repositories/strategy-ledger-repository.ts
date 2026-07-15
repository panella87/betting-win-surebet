import type { SurebetStrategyLedgerEntry } from '../../../bootstrap/src/strategy/strategy-ledger.js';
import { validateSurebetStrategyLedgerEntry } from '../../../bootstrap/src/strategy/strategy-ledger.js';
import { SurebetPersistenceError } from '../errors.js';
import { executePsqlCommand, queryPsqlJsonRows, quoteSqlLiteral, stableJsonStringify, toJsonLiteral } from '../psql.js';
import type { JsonValue, SurebetPersistenceConfig } from '../types.js';

const SHA256_REGEX = /^[0-9a-f]{64}$/;

export interface SurebetPendingStrategyLedgerRecord {
  readonly upstreamLockRecordId: string;
  readonly pinnedStrategyExportRecordId?: string;
  readonly entry: SurebetStrategyLedgerEntry;
}

export interface SurebetStrategyLedgerRecord {
  readonly ledgerEntryId: string;
  readonly upstreamLockRecordId: string;
  readonly pinnedStrategyExportRecordId?: string;
  readonly entry: SurebetStrategyLedgerEntry;
  readonly insertedAt: string;
}

export interface SurebetStrategyLedgerListFilters {
  readonly acceptanceState: SurebetStrategyLedgerEntry['acceptanceState'];
  readonly pinnedStrategyExportRecordId?: string;
  readonly reportId?: string;
  readonly runFingerprintSha256?: string;
  readonly runKind?: SurebetStrategyLedgerEntry['runKind'];
  readonly runReferenceId?: string;
  readonly sourceKind?: SurebetStrategyLedgerEntry['sourceKind'];
  readonly sourceManifestHash?: string;
  readonly upstreamLockRecordId?: string;
}

export interface SurebetStrategyLedgerListRequest {
  readonly afterLedgerEntryId?: string;
  readonly filters: SurebetStrategyLedgerListFilters;
  readonly limit: number;
}

interface StrategyLedgerRow {
  readonly ledgerEntryId: string;
  readonly upstreamLockRecordId: string;
  readonly pinnedStrategyExportRecordId: string | null;
  readonly entry: SurebetStrategyLedgerEntry;
  readonly insertedAt: string;
}

export class SurebetStrategyLedgerRepository {
  readonly #config: SurebetPersistenceConfig;

  constructor(config: SurebetPersistenceConfig) {
    this.#config = config;
  }

  create(record: SurebetPendingStrategyLedgerRecord): SurebetStrategyLedgerRecord {
    validatePendingRecord(record);
    const existing = this.get(record.entry.ledgerEntryId);
    if (existing !== undefined) {
      if (stableJsonStringify(toComparableRecord(existing)) !== stableJsonStringify(toComparablePendingRecord(record))) {
        throw new SurebetPersistenceError(
          'SUREBET_STRATEGY_LEDGER_CONFLICT',
          `Surebet strategy ledger entry ${record.entry.ledgerEntryId} already exists with different content.`,
        );
      }
      return existing;
    }

    const existingByRunFingerprint = this.getByRunFingerprintSha256(record.entry.runFingerprintSha256);
    if (existingByRunFingerprint !== undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_STRATEGY_LEDGER_DUPLICATE_RUN_FINGERPRINT',
        `Surebet strategy ledger run fingerprint ${record.entry.runFingerprintSha256} already exists under entry ${existingByRunFingerprint.ledgerEntryId}.`,
      );
    }
    const existingByReportSha = this.getByReportSha256(record.entry.reportSha256);
    if (existingByReportSha !== undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_STRATEGY_LEDGER_DUPLICATE_REPORT_SHA256',
        `Surebet strategy ledger report SHA-256 ${record.entry.reportSha256} already exists under entry ${existingByReportSha.ledgerEntryId}.`,
      );
    }

    executePsqlCommand(
      this.#config,
      `
INSERT INTO surebet.strategy_ledger_entries (
  ledger_entry_id,
  upstream_lock_record_id,
  pinned_strategy_export_record_id,
  run_kind,
  run_reference_id,
  source_kind,
  source_manifest_hash,
  run_fingerprint_sha256,
  report_kind,
  report_id,
  report_sha256,
  acceptance_state,
  settlement_state,
  privacy,
  profitability_state,
  public_distribution_state,
  live_state,
  candidate_count,
  blocked_candidate_count,
  blocker_count,
  entry_json
)
VALUES (
  ${quoteSqlLiteral(record.entry.ledgerEntryId)},
  ${quoteSqlLiteral(record.upstreamLockRecordId)},
  ${toNullableSqlLiteral(record.pinnedStrategyExportRecordId)},
  ${quoteSqlLiteral(record.entry.runKind)},
  ${quoteSqlLiteral(record.entry.runReferenceId)},
  ${quoteSqlLiteral(record.entry.sourceKind)},
  ${quoteSqlLiteral(record.entry.sourceManifestHash)},
  ${quoteSqlLiteral(record.entry.runFingerprintSha256)},
  ${quoteSqlLiteral(record.entry.reportKind)},
  ${quoteSqlLiteral(record.entry.reportId)},
  ${quoteSqlLiteral(record.entry.reportSha256)},
  ${quoteSqlLiteral(record.entry.acceptanceState)},
  ${quoteSqlLiteral(record.entry.settlementState)},
  ${quoteSqlLiteral(record.entry.privacy)},
  ${quoteSqlLiteral(record.entry.profitabilityState)},
  ${quoteSqlLiteral(record.entry.publicDistributionState)},
  ${quoteSqlLiteral(record.entry.liveState)},
  ${record.entry.candidateCount},
  ${record.entry.blockedCandidateCount},
  ${record.entry.blockerCount},
  ${toJsonLiteral(record.entry as unknown as JsonValue)}
);
`,
    );

    const persisted = this.get(record.entry.ledgerEntryId);
    if (persisted === undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_STRATEGY_LEDGER_INSERT_MISSING',
        `Surebet strategy ledger entry ${record.entry.ledgerEntryId} was not persisted.`,
      );
    }
    return persisted;
  }

  get(ledgerEntryId: string): SurebetStrategyLedgerRecord | undefined {
    const rows = queryPsqlJsonRows<StrategyLedgerRow>(
      this.#config,
      `
SELECT row_to_json(t)::text
FROM (
  SELECT
    ledger_entry_id AS "ledgerEntryId",
    upstream_lock_record_id AS "upstreamLockRecordId",
    pinned_strategy_export_record_id AS "pinnedStrategyExportRecordId",
    entry_json AS entry,
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt"
  FROM surebet.strategy_ledger_entries
  WHERE ledger_entry_id = ${quoteSqlLiteral(requireNonEmptyString(ledgerEntryId, 'ledgerEntryId'))}
) AS t;
`,
    );
    return normalizeRow(rows[0]);
  }

  getByRunFingerprintSha256(runFingerprintSha256: string): SurebetStrategyLedgerRecord | undefined {
    const rows = queryPsqlJsonRows<StrategyLedgerRow>(
      this.#config,
      `
SELECT row_to_json(t)::text
FROM (
  SELECT
    ledger_entry_id AS "ledgerEntryId",
    upstream_lock_record_id AS "upstreamLockRecordId",
    pinned_strategy_export_record_id AS "pinnedStrategyExportRecordId",
    entry_json AS entry,
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt"
  FROM surebet.strategy_ledger_entries
  WHERE run_fingerprint_sha256 = ${quoteSqlLiteral(requireSha256(runFingerprintSha256, 'runFingerprintSha256'))}
) AS t;
`,
    );
    return normalizeRow(rows[0]);
  }

  getByReportSha256(reportSha256: string): SurebetStrategyLedgerRecord | undefined {
    const rows = queryPsqlJsonRows<StrategyLedgerRow>(
      this.#config,
      `
SELECT row_to_json(t)::text
FROM (
  SELECT
    ledger_entry_id AS "ledgerEntryId",
    upstream_lock_record_id AS "upstreamLockRecordId",
    pinned_strategy_export_record_id AS "pinnedStrategyExportRecordId",
    entry_json AS entry,
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt"
  FROM surebet.strategy_ledger_entries
  WHERE report_sha256 = ${quoteSqlLiteral(requireSha256(reportSha256, 'reportSha256'))}
) AS t;
`,
    );
    return normalizeRow(rows[0]);
  }

  list(request: SurebetStrategyLedgerListRequest): readonly SurebetStrategyLedgerRecord[] {
    const validated = validateListRequest(request);
    const whereClauses = toListWhereClauses(validated);
    const rows = queryPsqlJsonRows<StrategyLedgerRow>(
      this.#config,
      `
SELECT row_to_json(t)::text
FROM (
  SELECT
    ledger_entry_id AS "ledgerEntryId",
    upstream_lock_record_id AS "upstreamLockRecordId",
    pinned_strategy_export_record_id AS "pinnedStrategyExportRecordId",
    entry_json AS entry,
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt"
  FROM surebet.strategy_ledger_entries
  ${whereClauses.length === 0 ? '' : `WHERE ${whereClauses.join('\n    AND ')}`}
  ORDER BY ledger_entry_id ASC
  LIMIT ${validated.limit}
) AS t;
`,
    );
    return Object.freeze(
      rows
        .map((row) => normalizeRow(row))
        .filter((row): row is SurebetStrategyLedgerRecord => row !== undefined),
    );
  }
}

function normalizeRow(row: StrategyLedgerRow | undefined): SurebetStrategyLedgerRecord | undefined {
  if (row === undefined) {
    return undefined;
  }
  const normalized = row.pinnedStrategyExportRecordId === null
    ? {
        ledgerEntryId: row.ledgerEntryId,
        upstreamLockRecordId: row.upstreamLockRecordId,
        entry: row.entry,
        insertedAt: row.insertedAt,
      }
    : {
        ledgerEntryId: row.ledgerEntryId,
        upstreamLockRecordId: row.upstreamLockRecordId,
        pinnedStrategyExportRecordId: row.pinnedStrategyExportRecordId,
        entry: row.entry,
        insertedAt: row.insertedAt,
      };
  return Object.freeze(normalized);
}

function validatePendingRecord(record: SurebetPendingStrategyLedgerRecord): void {
  requireNonEmptyString(record.upstreamLockRecordId, 'upstreamLockRecordId');
  if (record.entry.sourceKind === 'read_only_query') {
    if (record.pinnedStrategyExportRecordId !== undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_STRATEGY_LEDGER_INVALID',
        'Surebet read-only-query strategy ledger entries must not reference a pinned strategy export record.',
      );
    }
  } else {
    requireNonEmptyString(record.pinnedStrategyExportRecordId, 'pinnedStrategyExportRecordId');
  }
  const validation = validateSurebetStrategyLedgerEntry(record.entry);
  if (!validation.ok) {
    const firstBlocker = validation.blockers[0];
    throw new SurebetPersistenceError(
      'SUREBET_STRATEGY_LEDGER_INVALID',
      firstBlocker === undefined
        ? 'Surebet strategy ledger entry validation failed.'
        : `${firstBlocker.code}: ${firstBlocker.message}`,
    );
  }
}

function requireNonEmptyString(value: string | undefined, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new SurebetPersistenceError(
      'SUREBET_STRATEGY_LEDGER_INVALID',
      `Surebet strategy ledger requires a non-empty ${field}.`,
    );
  }
  return value.trim();
}

function requireSha256(value: string, field: string): string {
  if (!SHA256_REGEX.test(value)) {
    throw new SurebetPersistenceError(
      'SUREBET_STRATEGY_LEDGER_INVALID',
      `Surebet strategy ledger requires ${field} to be a 64-character lower-case SHA-256 value.`,
    );
  }
  return value;
}

function validateListRequest(request: SurebetStrategyLedgerListRequest): Readonly<SurebetStrategyLedgerListRequest> {
  const limit = requirePositiveInteger(request.limit, 'limit');
  const filters = validateListFilters(request.filters);
  const afterLedgerEntryId = request.afterLedgerEntryId === undefined
    ? undefined
    : requireNonEmptyString(request.afterLedgerEntryId, 'afterLedgerEntryId');
  return Object.freeze({
    ...(afterLedgerEntryId === undefined ? {} : { afterLedgerEntryId }),
    filters,
    limit,
  });
}

function validateListFilters(filters: SurebetStrategyLedgerListFilters): Readonly<SurebetStrategyLedgerListFilters> {
  if (filters.acceptanceState !== 'accepted_local_evidence' && filters.acceptanceState !== 'blocked') {
    throw new SurebetPersistenceError(
      'SUREBET_STRATEGY_LEDGER_INVALID',
      'Surebet strategy ledger list requires acceptanceState accepted_local_evidence or blocked.',
    );
  }

  const normalized: SurebetStrategyLedgerListFilters = {
    acceptanceState: filters.acceptanceState,
  };

  if (filters.pinnedStrategyExportRecordId !== undefined) {
    Object.assign(normalized, {
      pinnedStrategyExportRecordId: requireNonEmptyString(
        filters.pinnedStrategyExportRecordId,
        'pinnedStrategyExportRecordId',
      ),
    });
  }
  if (filters.reportId !== undefined) {
    Object.assign(normalized, { reportId: requireNonEmptyString(filters.reportId, 'reportId') });
  }
  if (filters.runFingerprintSha256 !== undefined) {
    Object.assign(normalized, {
      runFingerprintSha256: requireSha256(filters.runFingerprintSha256, 'runFingerprintSha256'),
    });
  }
  if (
    filters.runKind !== undefined
    && filters.runKind !== 'deterministic_standard_binary_backtest'
    && filters.runKind !== 'private_paper_runtime_cycle'
  ) {
    throw new SurebetPersistenceError(
      'SUREBET_STRATEGY_LEDGER_INVALID',
      'Surebet strategy ledger list requires a supported runKind filter when provided.',
    );
  }
  if (filters.runKind !== undefined) {
    Object.assign(normalized, { runKind: filters.runKind });
  }
  if (filters.runReferenceId !== undefined) {
    Object.assign(normalized, { runReferenceId: requireNonEmptyString(filters.runReferenceId, 'runReferenceId') });
  }
  if (
    filters.sourceKind !== undefined
    && filters.sourceKind !== 'resource_export'
    && filters.sourceKind !== 'pinned_records'
    && filters.sourceKind !== 'read_only_query'
  ) {
    throw new SurebetPersistenceError(
      'SUREBET_STRATEGY_LEDGER_INVALID',
      'Surebet strategy ledger list requires a supported sourceKind filter when provided.',
    );
  }
  if (filters.sourceKind !== undefined) {
    Object.assign(normalized, { sourceKind: filters.sourceKind });
  }
  if (filters.sourceManifestHash !== undefined) {
    Object.assign(normalized, {
      sourceManifestHash: requireSha256(filters.sourceManifestHash, 'sourceManifestHash'),
    });
  }
  if (filters.upstreamLockRecordId !== undefined) {
    Object.assign(normalized, {
      upstreamLockRecordId: requireNonEmptyString(filters.upstreamLockRecordId, 'upstreamLockRecordId'),
    });
  }

  return Object.freeze(normalized);
}

function toListWhereClauses(request: Readonly<SurebetStrategyLedgerListRequest>): readonly string[] {
  const clauses = [
    `acceptance_state = ${quoteSqlLiteral(request.filters.acceptanceState)}`,
  ];
  if (request.filters.pinnedStrategyExportRecordId !== undefined) {
    clauses.push(`pinned_strategy_export_record_id = ${quoteSqlLiteral(request.filters.pinnedStrategyExportRecordId)}`);
  }
  if (request.filters.reportId !== undefined) {
    clauses.push(`report_id = ${quoteSqlLiteral(request.filters.reportId)}`);
  }
  if (request.filters.runFingerprintSha256 !== undefined) {
    clauses.push(`run_fingerprint_sha256 = ${quoteSqlLiteral(request.filters.runFingerprintSha256)}`);
  }
  if (request.filters.runKind !== undefined) {
    clauses.push(`run_kind = ${quoteSqlLiteral(request.filters.runKind)}`);
  }
  if (request.filters.runReferenceId !== undefined) {
    clauses.push(`run_reference_id = ${quoteSqlLiteral(request.filters.runReferenceId)}`);
  }
  if (request.filters.sourceKind !== undefined) {
    clauses.push(`source_kind = ${quoteSqlLiteral(request.filters.sourceKind)}`);
  }
  if (request.filters.sourceManifestHash !== undefined) {
    clauses.push(`source_manifest_hash = ${quoteSqlLiteral(request.filters.sourceManifestHash)}`);
  }
  if (request.filters.upstreamLockRecordId !== undefined) {
    clauses.push(`upstream_lock_record_id = ${quoteSqlLiteral(request.filters.upstreamLockRecordId)}`);
  }
  if (request.afterLedgerEntryId !== undefined) {
    clauses.push(`ledger_entry_id > ${quoteSqlLiteral(request.afterLedgerEntryId)}`);
  }
  return Object.freeze(clauses);
}

function requirePositiveInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new SurebetPersistenceError(
      'SUREBET_STRATEGY_LEDGER_INVALID',
      `Surebet strategy ledger requires ${field} to be a positive integer.`,
    );
  }
  return value;
}

function toNullableSqlLiteral(value: string | undefined): string {
  return value === undefined ? 'NULL' : quoteSqlLiteral(value);
}

function toComparableRecord(record: SurebetStrategyLedgerRecord): JsonValue {
  return Object.freeze({
    entry: record.entry as unknown as JsonValue,
    ledgerEntryId: record.ledgerEntryId,
    pinnedStrategyExportRecordId: record.pinnedStrategyExportRecordId ?? null,
    upstreamLockRecordId: record.upstreamLockRecordId,
  });
}

function toComparablePendingRecord(record: SurebetPendingStrategyLedgerRecord): JsonValue {
  return Object.freeze({
    entry: record.entry as unknown as JsonValue,
    ledgerEntryId: record.entry.ledgerEntryId,
    pinnedStrategyExportRecordId: record.pinnedStrategyExportRecordId ?? null,
    upstreamLockRecordId: record.upstreamLockRecordId,
  });
}
