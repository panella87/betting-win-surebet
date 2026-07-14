import type { BettingWinUpstreamLock } from '../../../upstream/src/upstream/betting-win-upstream-lock.js';
import { SurebetPersistenceError } from '../errors.js';
import {
  executePsqlCommand,
  queryPsqlJsonRows,
  quoteSqlLiteral,
  sha256Hex,
  stableJsonStringify,
  toJsonLiteral,
} from '../psql.js';
import type { JsonValue, SurebetPersistenceConfig } from '../types.js';

export interface SurebetUpstreamLockRecord {
  readonly lockRecordId: string;
  readonly lock: BettingWinUpstreamLock;
  readonly insertedAt: string;
}

interface UpstreamLockRow {
  readonly lockRecordId: string;
  readonly lock: BettingWinUpstreamLock;
  readonly insertedAt: string;
}

export class SurebetUpstreamLockRepository {
  readonly #config: SurebetPersistenceConfig;

  constructor(config: SurebetPersistenceConfig) {
    this.#config = config;
  }

  put(record: { readonly lockRecordId: string; readonly lock: BettingWinUpstreamLock }): SurebetUpstreamLockRecord {
    const lockRecordId = requireNonEmptyString(record.lockRecordId, 'lockRecordId');
    const lockJson = stableJsonStringify(record.lock as unknown as JsonValue);
    const lockFingerprintSha256 = sha256Hex(stableJsonStringify(toStableFingerprintPayload(record.lock)));
    const existing = this.get(lockRecordId);
    if (existing !== undefined) {
      if (stableJsonStringify(existing.lock as unknown as JsonValue) !== lockJson) {
        throw new SurebetPersistenceError(
          'SUREBET_UPSTREAM_LOCK_CONFLICT',
          `Surebet upstream lock record ${lockRecordId} already exists with different content.`,
        );
      }
      return existing;
    }

    const existingByFingerprint = this.getByFingerprint(lockFingerprintSha256);
    if (existingByFingerprint !== undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_UPSTREAM_LOCK_FINGERPRINT_CONFLICT',
        `Surebet upstream lock fingerprint already exists under record ${existingByFingerprint.lockRecordId}.`,
      );
    }

    executePsqlCommand(
      this.#config,
      `
INSERT INTO surebet.upstream_locks (
  lock_record_id,
  lock_fingerprint_sha256,
  repository,
  commit_sha,
  git_tree_sha,
  tracked_tree_listing_sha256,
  verified_at,
  lock_json
)
VALUES (
  ${quoteSqlLiteral(lockRecordId)},
  ${quoteSqlLiteral(lockFingerprintSha256)},
  ${quoteSqlLiteral(record.lock.repository)},
  ${quoteSqlLiteral(record.lock.commitSha)},
  ${quoteSqlLiteral(record.lock.gitTreeSha)},
  ${quoteSqlLiteral(record.lock.trackedTreeListingSha256)},
  ${quoteSqlLiteral(record.lock.verifiedAt)}::timestamptz,
  ${toJsonLiteral(record.lock as unknown as JsonValue)}
);
`,
    );

    const persisted = this.get(lockRecordId);
    if (persisted === undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_UPSTREAM_LOCK_INSERT_MISSING',
        `Surebet upstream lock record ${lockRecordId} was not persisted.`,
      );
    }
    return persisted;
  }

  get(lockRecordId: string): SurebetUpstreamLockRecord | undefined {
    const rows = queryPsqlJsonRows<UpstreamLockRow>(
      this.#config,
      `
SELECT row_to_json(t)::text
FROM (
  SELECT
    lock_record_id AS "lockRecordId",
    lock_json AS "lock",
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt"
  FROM surebet.upstream_locks
  WHERE lock_record_id = ${quoteSqlLiteral(requireNonEmptyString(lockRecordId, 'lockRecordId'))}
) AS t;
`,
    );
    return rows[0];
  }

  getByFingerprint(lockFingerprintSha256: string): SurebetUpstreamLockRecord | undefined {
    const rows = queryPsqlJsonRows<UpstreamLockRow>(
      this.#config,
      `
SELECT row_to_json(t)::text
FROM (
  SELECT
    lock_record_id AS "lockRecordId",
    lock_json AS "lock",
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt"
  FROM surebet.upstream_locks
  WHERE lock_fingerprint_sha256 = ${quoteSqlLiteral(lockFingerprintSha256)}
) AS t;
`,
    );
    return rows[0];
  }
}

function toStableFingerprintPayload(lock: BettingWinUpstreamLock): JsonValue {
  return Object.freeze({
    capabilities: lock.capabilities,
    commitSha: lock.commitSha,
    contractAlias: lock.contractAlias,
    contractSchema: lock.contractSchema,
    gitTreeSha: lock.gitTreeSha,
    packageVersion: lock.packageVersion,
    packageVersions: lock.packageVersions as JsonValue,
    repository: lock.repository,
    repositoryPath: lock.repositoryPath,
    schema: lock.schema,
    sourceFingerprintAlgorithm: lock.sourceFingerprintAlgorithm,
    sourceView: lock.sourceView,
    surebetProfile: lock.surebetProfile,
    trackedTreeListingSha256: lock.trackedTreeListingSha256,
  });
}

function requireNonEmptyString(value: string, field: string): string {
  if (value.trim().length === 0) {
    throw new SurebetPersistenceError(
      'SUREBET_UPSTREAM_LOCK_INVALID',
      `Surebet upstream lock requires a non-empty ${field}.`,
    );
  }
  return value.trim();
}
