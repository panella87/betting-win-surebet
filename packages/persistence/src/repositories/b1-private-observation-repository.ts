import { SurebetPersistenceError } from '../errors.js';
import { executePsqlCommand, queryPsqlJsonRows, quoteSqlLiteral, stableJsonStringify, toJsonLiteral } from '../psql.js';
import type { JsonValue, SurebetPersistenceConfig } from '../types.js';

const ISO_UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export type SurebetB1PrivateObservationStatus = 'started' | 'completed' | 'blocked';

export interface SurebetB1PrivateObservationCycleRecord {
  readonly observationCycleId: string;
  readonly runtimeId: string;
  readonly queueName: string;
  readonly workerJobId?: string;
  readonly upstreamCheckpointId: string;
  readonly backtestRunId?: string;
  readonly status: SurebetB1PrivateObservationStatus;
  readonly cycleStartedAt: string;
  readonly cycleCompletedAt?: string;
  readonly evidence: JsonValue;
  readonly blockerCode?: string;
  readonly blockerDetails?: JsonValue;
  readonly runtimeEvidence: false;
  readonly executable: false;
  readonly insertedAt: string;
  readonly updatedAt: string;
}

export interface SurebetB1PrivateObservationCycleCreateRecord {
  readonly observationCycleId: string;
  readonly runtimeId: string;
  readonly queueName: string;
  readonly workerJobId?: string;
  readonly upstreamCheckpointId: string;
  readonly cycleStartedAt: string;
  readonly evidence: JsonValue;
  readonly runtimeEvidence: false;
  readonly executable: false;
}

export interface SurebetB1PrivateObservationCycleCompleteRecord {
  readonly observationCycleId: string;
  readonly backtestRunId: string;
  readonly cycleCompletedAt: string;
  readonly evidence: JsonValue;
}

export interface SurebetB1PrivateObservationCycleBlockRecord {
  readonly observationCycleId: string;
  readonly cycleCompletedAt: string;
  readonly blockerCode: string;
  readonly blockerDetails: JsonValue;
  readonly evidence: JsonValue;
}

interface RawB1PrivateObservationCycleRow extends Omit<
  SurebetB1PrivateObservationCycleRecord,
  'workerJobId' | 'backtestRunId' | 'cycleCompletedAt' | 'blockerCode' | 'blockerDetails'
> {
  readonly workerJobId: string | null;
  readonly backtestRunId: string | null;
  readonly cycleCompletedAt: string | null;
  readonly blockerCode: string | null;
  readonly blockerDetails: JsonValue | null;
}

export class SurebetB1PrivateObservationRepository {
  readonly #config: SurebetPersistenceConfig;

  constructor(config: SurebetPersistenceConfig) {
    this.#config = config;
  }

  create(record: SurebetB1PrivateObservationCycleCreateRecord): SurebetB1PrivateObservationCycleRecord {
    validateCreateRecord(record);
    const existing = this.get(record.observationCycleId);
    if (existing !== undefined) {
      if (stableJsonStringify(toComparableStartedRecord(existing)) !== stableJsonStringify(toComparableCreateRecord(record))) {
        throw new SurebetPersistenceError(
          'SUREBET_B1_PRIVATE_OBSERVATION_CONFLICT',
          `B1 private observation cycle ${record.observationCycleId} already exists with different immutable content.`,
        );
      }
      return existing;
    }

    executePsqlCommand(
      this.#config,
      `
INSERT INTO surebet.b1_private_observation_cycles (
  observation_cycle_id,
  runtime_id,
  queue_name,
  worker_job_id,
  upstream_checkpoint_id,
  status,
  cycle_started_at,
  evidence_json,
  runtime_evidence,
  executable
)
VALUES (
  ${quoteSqlLiteral(record.observationCycleId)},
  ${quoteSqlLiteral(record.runtimeId)},
  ${quoteSqlLiteral(record.queueName)},
  ${optionalText(record.workerJobId)},
  ${quoteSqlLiteral(record.upstreamCheckpointId)},
  'started',
  ${quoteSqlLiteral(record.cycleStartedAt)}::timestamptz,
  ${toJsonLiteral(record.evidence)},
  false,
  false
);
`,
    );

    return this.require(record.observationCycleId);
  }

  complete(record: SurebetB1PrivateObservationCycleCompleteRecord): SurebetB1PrivateObservationCycleRecord {
    validateCompleteRecord(record);
    const existing = this.require(record.observationCycleId);
    if (existing.status !== 'started') {
      throw new SurebetPersistenceError(
        'SUREBET_B1_PRIVATE_OBSERVATION_NOT_STARTED',
        `B1 private observation cycle ${record.observationCycleId} must be started before completion.`,
      );
    }
    executePsqlCommand(
      this.#config,
      `
UPDATE surebet.b1_private_observation_cycles
SET
  backtest_run_id = ${quoteSqlLiteral(record.backtestRunId)},
  status = 'completed',
  cycle_completed_at = ${quoteSqlLiteral(record.cycleCompletedAt)}::timestamptz,
  evidence_json = ${toJsonLiteral(record.evidence)},
  updated_at = CURRENT_TIMESTAMP
WHERE observation_cycle_id = ${quoteSqlLiteral(record.observationCycleId)};
`,
    );
    return this.require(record.observationCycleId);
  }

  block(record: SurebetB1PrivateObservationCycleBlockRecord): SurebetB1PrivateObservationCycleRecord {
    validateBlockRecord(record);
    const existing = this.require(record.observationCycleId);
    if (existing.status !== 'started') {
      throw new SurebetPersistenceError(
        'SUREBET_B1_PRIVATE_OBSERVATION_NOT_STARTED',
        `B1 private observation cycle ${record.observationCycleId} must be started before blocking.`,
      );
    }
    executePsqlCommand(
      this.#config,
      `
UPDATE surebet.b1_private_observation_cycles
SET
  status = 'blocked',
  cycle_completed_at = ${quoteSqlLiteral(record.cycleCompletedAt)}::timestamptz,
  evidence_json = ${toJsonLiteral(record.evidence)},
  blocker_code = ${quoteSqlLiteral(record.blockerCode)},
  blocker_details_json = ${toJsonLiteral(record.blockerDetails)},
  updated_at = CURRENT_TIMESTAMP
WHERE observation_cycle_id = ${quoteSqlLiteral(record.observationCycleId)};
`,
    );
    return this.require(record.observationCycleId);
  }

  get(observationCycleId: string): SurebetB1PrivateObservationCycleRecord | undefined {
    const rows = queryPsqlJsonRows<RawB1PrivateObservationCycleRow>(
      this.#config,
      `
SELECT row_to_json(t)::text
FROM (
  SELECT
    observation_cycle_id AS "observationCycleId",
    runtime_id AS "runtimeId",
    queue_name AS "queueName",
    worker_job_id AS "workerJobId",
    upstream_checkpoint_id AS "upstreamCheckpointId",
    backtest_run_id AS "backtestRunId",
    status,
    to_char(cycle_started_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "cycleStartedAt",
    CASE
      WHEN cycle_completed_at IS NULL THEN NULL
      ELSE to_char(cycle_completed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    END AS "cycleCompletedAt",
    evidence_json AS evidence,
    blocker_code AS "blockerCode",
    blocker_details_json AS "blockerDetails",
    runtime_evidence AS "runtimeEvidence",
    executable,
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt",
    to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt"
  FROM surebet.b1_private_observation_cycles
  WHERE observation_cycle_id = ${quoteSqlLiteral(requireNonEmptyString(observationCycleId, 'observationCycleId'))}
) AS t;
`,
    );
    const row = rows[0];
    if (row === undefined) {
      return undefined;
    }
    return normalizeRow(row);
  }

  require(observationCycleId: string): SurebetB1PrivateObservationCycleRecord {
    const record = this.get(observationCycleId);
    if (record === undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_B1_PRIVATE_OBSERVATION_NOT_FOUND',
        `B1 private observation cycle ${observationCycleId} does not exist.`,
      );
    }
    return record;
  }
}

function validateCreateRecord(record: SurebetB1PrivateObservationCycleCreateRecord): void {
  requireNonEmptyString(record.observationCycleId, 'observationCycleId');
  requireNonEmptyString(record.runtimeId, 'runtimeId');
  requireNonEmptyString(record.queueName, 'queueName');
  requireNonEmptyString(record.upstreamCheckpointId, 'upstreamCheckpointId');
  requireIsoTimestamp(record.cycleStartedAt, 'cycleStartedAt');
  if (record.workerJobId !== undefined) {
    requireNonEmptyString(record.workerJobId, 'workerJobId');
  }
  if (record.runtimeEvidence !== false || record.executable !== false) {
    throw new SurebetPersistenceError(
      'SUREBET_B1_PRIVATE_OBSERVATION_POLICY_INVALID',
      'B1 private observation cycles require runtimeEvidence=false and executable=false.',
    );
  }
}

function validateCompleteRecord(record: SurebetB1PrivateObservationCycleCompleteRecord): void {
  requireNonEmptyString(record.observationCycleId, 'observationCycleId');
  requireNonEmptyString(record.backtestRunId, 'backtestRunId');
  requireIsoTimestamp(record.cycleCompletedAt, 'cycleCompletedAt');
}

function validateBlockRecord(record: SurebetB1PrivateObservationCycleBlockRecord): void {
  requireNonEmptyString(record.observationCycleId, 'observationCycleId');
  requireNonEmptyString(record.blockerCode, 'blockerCode');
  requireIsoTimestamp(record.cycleCompletedAt, 'cycleCompletedAt');
}

function normalizeRow(row: RawB1PrivateObservationCycleRow): SurebetB1PrivateObservationCycleRecord {
  const {
    backtestRunId,
    blockerCode,
    blockerDetails,
    cycleCompletedAt,
    workerJobId,
    ...required
  } = row;
  return Object.freeze({
    ...required,
    ...(workerJobId === null ? {} : { workerJobId }),
    ...(backtestRunId === null ? {} : { backtestRunId }),
    ...(cycleCompletedAt === null ? {} : { cycleCompletedAt }),
    ...(blockerCode === null ? {} : { blockerCode }),
    ...(blockerDetails === null ? {} : { blockerDetails }),
  });
}

function toComparableStartedRecord(record: SurebetB1PrivateObservationCycleRecord): JsonValue {
  return toComparableCreateRecord({
    cycleStartedAt: record.cycleStartedAt,
    evidence: record.evidence,
    executable: record.executable,
    observationCycleId: record.observationCycleId,
    queueName: record.queueName,
    runtimeEvidence: record.runtimeEvidence,
    runtimeId: record.runtimeId,
    upstreamCheckpointId: record.upstreamCheckpointId,
    ...(record.workerJobId === undefined ? {} : { workerJobId: record.workerJobId }),
  });
}

function toComparableCreateRecord(record: SurebetB1PrivateObservationCycleCreateRecord): JsonValue {
  return Object.freeze({
    cycleStartedAt: record.cycleStartedAt,
    evidence: record.evidence,
    executable: record.executable,
    observationCycleId: record.observationCycleId,
    queueName: record.queueName,
    runtimeEvidence: record.runtimeEvidence,
    runtimeId: record.runtimeId,
    upstreamCheckpointId: record.upstreamCheckpointId,
    workerJobId: record.workerJobId,
  }) as JsonValue;
}

function optionalText(value: string | undefined): string {
  if (value === undefined) {
    return 'NULL';
  }
  return quoteSqlLiteral(value);
}

function requireNonEmptyString(value: string, name: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new SurebetPersistenceError(
      'SUREBET_B1_REQUIRED_FIELD_MISSING',
      `B1 private observation field ${name} must be a non-empty string.`,
    );
  }
  return value;
}

function requireIsoTimestamp(value: string, name: string): void {
  requireNonEmptyString(value, name);
  if (!ISO_UTC_TIMESTAMP.test(value)) {
    throw new SurebetPersistenceError(
      'SUREBET_B1_TIMESTAMP_INVALID',
      `B1 private observation field ${name} must be an ISO-8601 UTC timestamp.`,
    );
  }
}
