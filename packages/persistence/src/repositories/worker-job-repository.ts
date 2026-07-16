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

const ISO_UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const SHA256_REGEX = /^[0-9a-f]{64}$/;
const MAX_LEASE_DURATION_MS = 300_000;
const MAX_RETRY_DELAYS = 32;

export type SurebetWorkerJobStatus =
  | 'pending'
  | 'leased'
  | 'retry_wait'
  | 'succeeded'
  | 'dead_lettered';

export interface SurebetPendingWorkerJobRecord {
  readonly jobId: string;
  readonly queueName: string;
  readonly jobKind: string;
  readonly payload: JsonValue;
  readonly retryDelaysMs: readonly number[];
  readonly availableAt: string;
}

export interface SurebetWorkerJobRecord {
  readonly jobId: string;
  readonly queueName: string;
  readonly jobKind: string;
  readonly status: SurebetWorkerJobStatus;
  readonly payloadSha256: string;
  readonly payload: JsonValue;
  readonly retryDelaysMs: readonly number[];
  readonly attemptCount: number;
  readonly checkpointCount: number;
  readonly availableAt: string;
  readonly claimedAt?: string;
  readonly completedAt?: string;
  readonly leaseOwner?: string;
  readonly leaseToken?: string;
  readonly leaseDurationMs?: number;
  readonly leaseExpiresAt?: string;
  readonly lastHeartbeatAt?: string;
  readonly lastCheckpointId?: string;
  readonly lastCheckpointSha256?: string;
  readonly lastCheckpoint?: JsonValue;
  readonly lastCheckpointAt?: string;
  readonly lastErrorCode?: string;
  readonly lastErrorDetails?: JsonValue;
  readonly successResult?: JsonValue;
  readonly deadLetteredAt?: string;
  readonly insertedAt: string;
  readonly updatedAt: string;
}

export interface SurebetWorkerJobCheckpointRecord {
  readonly jobId: string;
  readonly checkpointId: string;
  readonly workerId: string;
  readonly leaseToken: string;
  readonly attemptCount: number;
  readonly checkpointSha256: string;
  readonly checkpoint: JsonValue;
  readonly recordedAt: string;
  readonly insertedAt: string;
}

export interface SurebetWorkerJobDeadLetterRecord {
  readonly jobId: string;
  readonly queueName: string;
  readonly jobKind: string;
  readonly deadLetterReasonCode: string;
  readonly deadLetterReasonDetails: JsonValue;
  readonly finalAttemptCount: number;
  readonly finalWorkerId: string;
  readonly finalLeaseToken: string;
  readonly checkpointCount: number;
  readonly insertedAt: string;
}

export interface SurebetWorkerQueueSummary {
  readonly queueName: string;
  readonly pendingCount: number;
  readonly leasedCount: number;
  readonly retryWaitCount: number;
  readonly succeededCount: number;
  readonly deadLetteredCount: number;
  readonly outstandingCount: number;
}

export interface SurebetWorkerJobClaimRequest {
  readonly queueName: string;
  readonly workerId: string;
  readonly leaseToken: string;
  readonly claimedAt: string;
  readonly leaseDurationMs: number;
}

export interface SurebetWorkerJobCheckpointRequest {
  readonly jobId: string;
  readonly checkpointId: string;
  readonly workerId: string;
  readonly leaseToken: string;
  readonly checkpoint: JsonValue;
  readonly recordedAt: string;
}

export interface SurebetWorkerJobCheckpointListOptions {
  readonly limit?: number;
  readonly newestFirst?: boolean;
}

export interface SurebetWorkerJobHeartbeatRequest {
  readonly jobId: string;
  readonly workerId: string;
  readonly leaseToken: string;
  readonly heartbeatAt: string;
  readonly leaseDurationMs: number;
}

export interface SurebetWorkerJobCompletionRequest {
  readonly jobId: string;
  readonly workerId: string;
  readonly leaseToken: string;
  readonly completedAt: string;
  readonly successResult: JsonValue;
}

export interface SurebetWorkerJobFailureRequest {
  readonly jobId: string;
  readonly workerId: string;
  readonly leaseToken: string;
  readonly failedAt: string;
  readonly errorCode: string;
  readonly errorDetails: JsonValue;
}

interface WorkerJobRow {
  readonly jobId: string;
  readonly queueName: string;
  readonly jobKind: string;
  readonly status: SurebetWorkerJobStatus;
  readonly payloadSha256: string;
  readonly payload: JsonValue;
  readonly retryDelaysMs: readonly number[];
  readonly attemptCount: number;
  readonly checkpointCount: number;
  readonly availableAt: string;
  readonly claimedAt: string | null;
  readonly completedAt: string | null;
  readonly leaseOwner: string | null;
  readonly leaseToken: string | null;
  readonly leaseDurationMs: number | null;
  readonly leaseExpiresAt: string | null;
  readonly lastHeartbeatAt: string | null;
  readonly lastCheckpointId: string | null;
  readonly lastCheckpointSha256: string | null;
  readonly lastCheckpoint: JsonValue | null;
  readonly lastCheckpointAt: string | null;
  readonly lastErrorCode: string | null;
  readonly lastErrorDetails: JsonValue | null;
  readonly successResult: JsonValue | null;
  readonly deadLetteredAt: string | null;
  readonly insertedAt: string;
  readonly updatedAt: string;
}

interface WorkerJobCheckpointRow {
  readonly jobId: string;
  readonly checkpointId: string;
  readonly workerId: string;
  readonly leaseToken: string;
  readonly attemptCount: number;
  readonly checkpointSha256: string;
  readonly checkpoint: JsonValue;
  readonly recordedAt: string;
  readonly insertedAt: string;
}

interface WorkerJobDeadLetterRow {
  readonly jobId: string;
  readonly queueName: string;
  readonly jobKind: string;
  readonly deadLetterReasonCode: string;
  readonly deadLetterReasonDetails: JsonValue;
  readonly finalAttemptCount: number;
  readonly finalWorkerId: string;
  readonly finalLeaseToken: string;
  readonly checkpointCount: number;
  readonly insertedAt: string;
}

interface WorkerJobMutationRow {
  readonly jobId: string;
}

interface WorkerJobQueueSummaryRow {
  readonly queueName: string;
  readonly pendingCount: number;
  readonly leasedCount: number;
  readonly retryWaitCount: number;
  readonly succeededCount: number;
  readonly deadLetteredCount: number;
}

export class SurebetWorkerJobRepository {
  readonly #config: SurebetPersistenceConfig;

  constructor(config: SurebetPersistenceConfig) {
    this.#config = config;
  }

  create(record: SurebetPendingWorkerJobRecord): SurebetWorkerJobRecord {
    const validated = validatePendingRecord(record);
    const existing = this.get(validated.jobId);
    if (existing !== undefined) {
      if (stableJsonStringify(toComparableCreate(existing)) !== stableJsonStringify(toComparablePendingRecord(validated))) {
        throw new SurebetPersistenceError(
          'SUREBET_WORKER_JOB_CONFLICT',
          `Surebet worker job ${validated.jobId} already exists with different immutable content.`,
        );
      }
      return existing;
    }

    executePsqlCommand(
      this.#config,
      `
INSERT INTO surebet.worker_jobs (
  job_id,
  queue_name,
  job_kind,
  status,
  payload_sha256,
  payload_json,
  retry_delays_ms_json,
  attempt_count,
  checkpoint_count,
  available_at
)
VALUES (
  ${quoteSqlLiteral(validated.jobId)},
  ${quoteSqlLiteral(validated.queueName)},
  ${quoteSqlLiteral(validated.jobKind)},
  'pending',
  ${quoteSqlLiteral(validated.payloadSha256)},
  ${toJsonLiteral(validated.payload)},
  ${toJsonLiteral(validated.retryDelaysMs as unknown as JsonValue)},
  0,
  0,
  ${quoteSqlLiteral(validated.availableAt)}::timestamptz
);
`,
    );

    const persisted = this.get(validated.jobId);
    if (persisted === undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_WORKER_JOB_INSERT_MISSING',
        `Surebet worker job ${validated.jobId} was not persisted.`,
      );
    }
    return persisted;
  }

  get(jobId: string): SurebetWorkerJobRecord | undefined {
    const rows = queryPsqlJsonRows<WorkerJobRow>(
      this.#config,
      `
SELECT row_to_json(t)::text
FROM (
  SELECT
    job_id AS "jobId",
    queue_name AS "queueName",
    job_kind AS "jobKind",
    status,
    payload_sha256 AS "payloadSha256",
    payload_json AS payload,
    retry_delays_ms_json AS "retryDelaysMs",
    attempt_count AS "attemptCount",
    checkpoint_count AS "checkpointCount",
    to_char(available_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "availableAt",
    CASE
      WHEN claimed_at IS NULL THEN NULL
      ELSE to_char(claimed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    END AS "claimedAt",
    CASE
      WHEN completed_at IS NULL THEN NULL
      ELSE to_char(completed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    END AS "completedAt",
    lease_owner AS "leaseOwner",
    lease_token AS "leaseToken",
    lease_duration_ms AS "leaseDurationMs",
    CASE
      WHEN lease_expires_at IS NULL THEN NULL
      ELSE to_char(lease_expires_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    END AS "leaseExpiresAt",
    CASE
      WHEN last_heartbeat_at IS NULL THEN NULL
      ELSE to_char(last_heartbeat_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    END AS "lastHeartbeatAt",
    last_checkpoint_id AS "lastCheckpointId",
    last_checkpoint_sha256 AS "lastCheckpointSha256",
    last_checkpoint_json AS "lastCheckpoint",
    CASE
      WHEN last_checkpoint_at IS NULL THEN NULL
      ELSE to_char(last_checkpoint_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    END AS "lastCheckpointAt",
    last_error_code AS "lastErrorCode",
    last_error_details_json AS "lastErrorDetails",
    success_result_json AS "successResult",
    CASE
      WHEN dead_lettered_at IS NULL THEN NULL
      ELSE to_char(dead_lettered_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    END AS "deadLetteredAt",
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt",
    to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt"
  FROM surebet.worker_jobs
  WHERE job_id = ${quoteSqlLiteral(requireNonEmptyString(jobId, 'jobId'))}
) AS t;
`,
    );
    return normalizeJobRow(rows[0]);
  }

  summarizeQueue(queueName: string): SurebetWorkerQueueSummary {
    const validatedQueueName = requireNonEmptyString(queueName, 'queueName');
    const rows = queryPsqlJsonRows<WorkerJobQueueSummaryRow>(
      this.#config,
      `
SELECT row_to_json(t)::text
FROM (
  SELECT
    ${quoteSqlLiteral(validatedQueueName)} AS "queueName",
    COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) AS "pendingCount",
    COALESCE(SUM(CASE WHEN status = 'leased' THEN 1 ELSE 0 END), 0) AS "leasedCount",
    COALESCE(SUM(CASE WHEN status = 'retry_wait' THEN 1 ELSE 0 END), 0) AS "retryWaitCount",
    COALESCE(SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END), 0) AS "succeededCount",
    COALESCE(SUM(CASE WHEN status = 'dead_lettered' THEN 1 ELSE 0 END), 0) AS "deadLetteredCount"
  FROM surebet.worker_jobs
  WHERE queue_name = ${quoteSqlLiteral(validatedQueueName)}
) AS t;
`,
    );
    return normalizeQueueSummaryRow(rows[0], validatedQueueName);
  }

  claimNext(request: SurebetWorkerJobClaimRequest): SurebetWorkerJobRecord | undefined {
    const validated = validateClaimRequest(request);
    const rows = queryPsqlJsonRows<WorkerJobRow>(
      this.#config,
      `
WITH candidate AS (
  SELECT job_id
  FROM surebet.worker_jobs
  WHERE queue_name = ${quoteSqlLiteral(validated.queueName)}
    AND status IN ('pending', 'retry_wait')
    AND available_at <= ${quoteSqlLiteral(validated.claimedAt)}::timestamptz
  ORDER BY available_at ASC, job_id ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1
),
updated AS (
  UPDATE surebet.worker_jobs AS jobs
  SET
    status = 'leased',
    attempt_count = jobs.attempt_count + 1,
    claimed_at = ${quoteSqlLiteral(validated.claimedAt)}::timestamptz,
    lease_owner = ${quoteSqlLiteral(validated.workerId)},
    lease_token = ${quoteSqlLiteral(validated.leaseToken)},
    lease_duration_ms = ${validated.leaseDurationMs},
    lease_expires_at = ${quoteSqlLiteral(validated.leaseExpiresAt)}::timestamptz,
    last_heartbeat_at = ${quoteSqlLiteral(validated.claimedAt)}::timestamptz,
    updated_at = CURRENT_TIMESTAMP
  FROM candidate
  WHERE jobs.job_id = candidate.job_id
  RETURNING
    jobs.job_id AS "jobId",
    jobs.queue_name AS "queueName",
    jobs.job_kind AS "jobKind",
    jobs.status,
    jobs.payload_sha256 AS "payloadSha256",
    jobs.payload_json AS payload,
    jobs.retry_delays_ms_json AS "retryDelaysMs",
    jobs.attempt_count AS "attemptCount",
    jobs.checkpoint_count AS "checkpointCount",
    to_char(jobs.available_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "availableAt",
    CASE
      WHEN jobs.claimed_at IS NULL THEN NULL
      ELSE to_char(jobs.claimed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    END AS "claimedAt",
    CASE
      WHEN jobs.completed_at IS NULL THEN NULL
      ELSE to_char(jobs.completed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    END AS "completedAt",
    jobs.lease_owner AS "leaseOwner",
    jobs.lease_token AS "leaseToken",
    jobs.lease_duration_ms AS "leaseDurationMs",
    CASE
      WHEN jobs.lease_expires_at IS NULL THEN NULL
      ELSE to_char(jobs.lease_expires_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    END AS "leaseExpiresAt",
    CASE
      WHEN jobs.last_heartbeat_at IS NULL THEN NULL
      ELSE to_char(jobs.last_heartbeat_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    END AS "lastHeartbeatAt",
    jobs.last_checkpoint_id AS "lastCheckpointId",
    jobs.last_checkpoint_sha256 AS "lastCheckpointSha256",
    jobs.last_checkpoint_json AS "lastCheckpoint",
    CASE
      WHEN jobs.last_checkpoint_at IS NULL THEN NULL
      ELSE to_char(jobs.last_checkpoint_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    END AS "lastCheckpointAt",
    jobs.last_error_code AS "lastErrorCode",
    jobs.last_error_details_json AS "lastErrorDetails",
    jobs.success_result_json AS "successResult",
    CASE
      WHEN jobs.dead_lettered_at IS NULL THEN NULL
      ELSE to_char(jobs.dead_lettered_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    END AS "deadLetteredAt",
    to_char(jobs.inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt",
    to_char(jobs.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt"
)
SELECT row_to_json(updated)::text
FROM updated;
`,
    );
    return normalizeJobRow(rows[0]);
  }

  heartbeatLease(request: SurebetWorkerJobHeartbeatRequest): SurebetWorkerJobRecord {
    const validated = validateHeartbeatRequest(request);
    const job = this.requireOwnedActiveLease(
      validated.jobId,
      validated.workerId,
      validated.leaseToken,
      validated.heartbeatAt,
    );
    if (job.status !== 'leased') {
      throw invalidJobMutation('SUREBET_WORKER_JOB_LEASE_INVALID', job.jobId, 'Only leased jobs may heartbeat their lease.');
    }

    executePsqlCommand(
      this.#config,
      `
UPDATE surebet.worker_jobs
SET
  lease_duration_ms = ${validated.leaseDurationMs},
  lease_expires_at = ${quoteSqlLiteral(validated.leaseExpiresAt)}::timestamptz,
  last_heartbeat_at = ${quoteSqlLiteral(validated.heartbeatAt)}::timestamptz,
  updated_at = CURRENT_TIMESTAMP
WHERE job_id = ${quoteSqlLiteral(validated.jobId)};
`,
    );
    return this.requireJob(validated.jobId);
  }

  recordCheckpoint(request: SurebetWorkerJobCheckpointRequest): SurebetWorkerJobCheckpointRecord {
    const validated = validateCheckpointRequest(request);
    const checkpointSha256 = sha256Hex(stableJsonStringify(validated.checkpoint));
    const existing = this.getCheckpoint(validated.jobId, validated.checkpointId);
    if (existing !== undefined) {
      if (stableJsonStringify(toComparableCheckpoint(existing)) !== stableJsonStringify({
        attemptCount: existing.attemptCount,
        checkpoint: validated.checkpoint,
        checkpointId: validated.checkpointId,
        checkpointSha256,
        jobId: validated.jobId,
        leaseToken: validated.leaseToken,
        recordedAt: validated.recordedAt,
        workerId: validated.workerId,
      } satisfies JsonValue)) {
        throw new SurebetPersistenceError(
          'SUREBET_WORKER_JOB_CHECKPOINT_CONFLICT',
          `Surebet worker job checkpoint ${validated.jobId}:${validated.checkpointId} already exists with different content.`,
        );
      }
      return existing;
    }

    const job = this.requireOwnedActiveLease(
      validated.jobId,
      validated.workerId,
      validated.leaseToken,
      validated.recordedAt,
    );
    if (job.status !== 'leased') {
      throw invalidJobMutation(
        'SUREBET_WORKER_JOB_CHECKPOINT_INVALID',
        job.jobId,
        'Only leased jobs may record checkpoints.',
      );
    }

    executePsqlCommand(
      this.#config,
      `
INSERT INTO surebet.worker_job_checkpoints (
  job_id,
  checkpoint_id,
  worker_id,
  lease_token,
  attempt_count,
  checkpoint_sha256,
  checkpoint_json,
  recorded_at
)
VALUES (
  ${quoteSqlLiteral(validated.jobId)},
  ${quoteSqlLiteral(validated.checkpointId)},
  ${quoteSqlLiteral(validated.workerId)},
  ${quoteSqlLiteral(validated.leaseToken)},
  ${job.attemptCount},
  ${quoteSqlLiteral(checkpointSha256)},
  ${toJsonLiteral(validated.checkpoint)},
  ${quoteSqlLiteral(validated.recordedAt)}::timestamptz
);

UPDATE surebet.worker_jobs
SET
  checkpoint_count = checkpoint_count + 1,
  last_checkpoint_id = ${quoteSqlLiteral(validated.checkpointId)},
  last_checkpoint_sha256 = ${quoteSqlLiteral(checkpointSha256)},
  last_checkpoint_json = ${toJsonLiteral(validated.checkpoint)},
  last_checkpoint_at = ${quoteSqlLiteral(validated.recordedAt)}::timestamptz,
  updated_at = CURRENT_TIMESTAMP
WHERE job_id = ${quoteSqlLiteral(validated.jobId)};
`,
    );

    const persisted = this.getCheckpoint(validated.jobId, validated.checkpointId);
    if (persisted === undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_WORKER_JOB_CHECKPOINT_INSERT_MISSING',
        `Surebet worker job checkpoint ${validated.jobId}:${validated.checkpointId} was not persisted.`,
      );
    }
    return persisted;
  }

  getCheckpoint(jobId: string, checkpointId: string): SurebetWorkerJobCheckpointRecord | undefined {
    const rows = queryPsqlJsonRows<WorkerJobCheckpointRow>(
      this.#config,
      `
SELECT row_to_json(t)::text
FROM (
  SELECT
    job_id AS "jobId",
    checkpoint_id AS "checkpointId",
    worker_id AS "workerId",
    lease_token AS "leaseToken",
    attempt_count AS "attemptCount",
    checkpoint_sha256 AS "checkpointSha256",
    checkpoint_json AS checkpoint,
    to_char(recorded_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "recordedAt",
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt"
  FROM surebet.worker_job_checkpoints
  WHERE job_id = ${quoteSqlLiteral(requireNonEmptyString(jobId, 'jobId'))}
    AND checkpoint_id = ${quoteSqlLiteral(requireNonEmptyString(checkpointId, 'checkpointId'))}
) AS t;
`,
    );
    return normalizeCheckpointRow(rows[0]);
  }

  listCheckpoints(
    jobId: string,
    options: SurebetWorkerJobCheckpointListOptions = {},
  ): readonly SurebetWorkerJobCheckpointRecord[] {
    const validatedJobId = requireNonEmptyString(jobId, 'jobId');
    const limitClause = options.limit === undefined
      ? ''
      : `LIMIT ${requirePositiveIntegerValue(options.limit, 'limit')}`;
    const orderDirection = options.newestFirst === true ? 'DESC' : 'ASC';
    return Object.freeze(
      queryPsqlJsonRows<WorkerJobCheckpointRow>(
        this.#config,
        `
SELECT row_to_json(t)::text
FROM (
  SELECT
    job_id AS "jobId",
    checkpoint_id AS "checkpointId",
    worker_id AS "workerId",
    lease_token AS "leaseToken",
    attempt_count AS "attemptCount",
    checkpoint_sha256 AS "checkpointSha256",
    checkpoint_json AS checkpoint,
    to_char(recorded_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "recordedAt",
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt"
  FROM surebet.worker_job_checkpoints
  WHERE job_id = ${quoteSqlLiteral(validatedJobId)}
  ORDER BY recorded_at ${orderDirection}, checkpoint_id ${orderDirection}
  ${limitClause}
) AS t;
`,
      ).map((row) => normalizeCheckpointRow(row))
        .filter((row): row is SurebetWorkerJobCheckpointRecord => row !== undefined),
    );
  }

  complete(request: SurebetWorkerJobCompletionRequest): SurebetWorkerJobRecord {
    const validated = validateCompletionRequest(request);
    const existing = this.requireJob(validated.jobId);
    if (existing.status === 'succeeded') {
      if (stableJsonStringify(toComparableCompletion(existing)) !== stableJsonStringify({
        completedAt: validated.completedAt,
        jobId: validated.jobId,
        successResult: validated.successResult,
      } satisfies JsonValue)) {
        throw new SurebetPersistenceError(
          'SUREBET_WORKER_JOB_COMPLETION_CONFLICT',
          `Surebet worker job ${validated.jobId} was already completed with different content.`,
        );
      }
      return existing;
    }

    const job = this.requireOwnedActiveLease(
      validated.jobId,
      validated.workerId,
      validated.leaseToken,
      validated.completedAt,
    );
    if (job.status !== 'leased') {
      throw invalidJobMutation('SUREBET_WORKER_JOB_COMPLETION_INVALID', job.jobId, 'Only leased jobs may complete.');
    }

    executePsqlCommand(
      this.#config,
      `
UPDATE surebet.worker_jobs
SET
  status = 'succeeded',
  completed_at = ${quoteSqlLiteral(validated.completedAt)}::timestamptz,
  lease_owner = NULL,
  lease_token = NULL,
  lease_duration_ms = NULL,
  lease_expires_at = NULL,
  last_heartbeat_at = NULL,
  success_result_json = ${toJsonLiteral(validated.successResult)},
  updated_at = CURRENT_TIMESTAMP
WHERE job_id = ${quoteSqlLiteral(validated.jobId)};
`,
    );
    return this.requireJob(validated.jobId);
  }

  fail(request: SurebetWorkerJobFailureRequest): SurebetWorkerJobRecord {
    const validated = validateFailureRequest(request);
    const job = this.requireOwnedActiveLease(
      validated.jobId,
      validated.workerId,
      validated.leaseToken,
      validated.failedAt,
    );
    if (job.status !== 'leased') {
      throw invalidJobMutation('SUREBET_WORKER_JOB_FAILURE_INVALID', job.jobId, 'Only leased jobs may fail.');
    }

    const retryDelayMs = job.retryDelaysMs[job.attemptCount - 1];
    if (retryDelayMs !== undefined) {
      const nextAvailableAt = addMilliseconds(validated.failedAt, retryDelayMs);
      executePsqlCommand(
        this.#config,
        `
UPDATE surebet.worker_jobs
SET
  status = 'retry_wait',
  available_at = ${quoteSqlLiteral(nextAvailableAt)}::timestamptz,
  lease_owner = NULL,
  lease_token = NULL,
  lease_duration_ms = NULL,
  lease_expires_at = NULL,
  last_heartbeat_at = NULL,
  last_error_code = ${quoteSqlLiteral(validated.errorCode)},
  last_error_details_json = ${toJsonLiteral(validated.errorDetails)},
  updated_at = CURRENT_TIMESTAMP
WHERE job_id = ${quoteSqlLiteral(validated.jobId)};
`,
      );
      return this.requireJob(validated.jobId);
    }

    return this.deadLetterOwnedJob(job, validated.failedAt, validated.errorCode, validated.errorDetails);
  }

  getDeadLetter(jobId: string): SurebetWorkerJobDeadLetterRecord | undefined {
    const rows = queryPsqlJsonRows<WorkerJobDeadLetterRow>(
      this.#config,
      `
SELECT row_to_json(t)::text
FROM (
  SELECT
    job_id AS "jobId",
    queue_name AS "queueName",
    job_kind AS "jobKind",
    dead_letter_reason_code AS "deadLetterReasonCode",
    dead_letter_reason_details_json AS "deadLetterReasonDetails",
    final_attempt_count AS "finalAttemptCount",
    final_worker_id AS "finalWorkerId",
    final_lease_token AS "finalLeaseToken",
    checkpoint_count AS "checkpointCount",
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt"
  FROM surebet.worker_job_dead_letters
  WHERE job_id = ${quoteSqlLiteral(requireNonEmptyString(jobId, 'jobId'))}
) AS t;
`,
    );
    return normalizeDeadLetterRow(rows[0]);
  }

  listDeadLetters(queueName?: string): readonly SurebetWorkerJobDeadLetterRecord[] {
    const whereClause = queueName === undefined
      ? ''
      : `WHERE queue_name = ${quoteSqlLiteral(requireNonEmptyString(queueName, 'queueName'))}`;
    return Object.freeze(
      queryPsqlJsonRows<WorkerJobDeadLetterRow>(
        this.#config,
        `
SELECT row_to_json(t)::text
FROM (
  SELECT
    job_id AS "jobId",
    queue_name AS "queueName",
    job_kind AS "jobKind",
    dead_letter_reason_code AS "deadLetterReasonCode",
    dead_letter_reason_details_json AS "deadLetterReasonDetails",
    final_attempt_count AS "finalAttemptCount",
    final_worker_id AS "finalWorkerId",
    final_lease_token AS "finalLeaseToken",
    checkpoint_count AS "checkpointCount",
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt"
  FROM surebet.worker_job_dead_letters
  ${whereClause}
  ORDER BY inserted_at ASC, job_id ASC
) AS t;
`,
      ).map((row) => normalizeDeadLetterRow(row))
        .filter((row): row is SurebetWorkerJobDeadLetterRecord => row !== undefined),
    );
  }

  reapExpiredLeases(reapedAt: string): readonly SurebetWorkerJobRecord[] {
    requireIsoTimestamp(reapedAt, 'reapedAt');
    const jobs = Object.freeze(
      queryPsqlJsonRows<WorkerJobRow>(
        this.#config,
        `
SELECT row_to_json(t)::text
FROM (
  SELECT
    job_id AS "jobId",
    queue_name AS "queueName",
    job_kind AS "jobKind",
    status,
    payload_sha256 AS "payloadSha256",
    payload_json AS payload,
    retry_delays_ms_json AS "retryDelaysMs",
    attempt_count AS "attemptCount",
    checkpoint_count AS "checkpointCount",
    to_char(available_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "availableAt",
    CASE
      WHEN claimed_at IS NULL THEN NULL
      ELSE to_char(claimed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    END AS "claimedAt",
    CASE
      WHEN completed_at IS NULL THEN NULL
      ELSE to_char(completed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    END AS "completedAt",
    lease_owner AS "leaseOwner",
    lease_token AS "leaseToken",
    lease_duration_ms AS "leaseDurationMs",
    CASE
      WHEN lease_expires_at IS NULL THEN NULL
      ELSE to_char(lease_expires_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    END AS "leaseExpiresAt",
    CASE
      WHEN last_heartbeat_at IS NULL THEN NULL
      ELSE to_char(last_heartbeat_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    END AS "lastHeartbeatAt",
    last_checkpoint_id AS "lastCheckpointId",
    last_checkpoint_sha256 AS "lastCheckpointSha256",
    last_checkpoint_json AS "lastCheckpoint",
    CASE
      WHEN last_checkpoint_at IS NULL THEN NULL
      ELSE to_char(last_checkpoint_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    END AS "lastCheckpointAt",
    last_error_code AS "lastErrorCode",
    last_error_details_json AS "lastErrorDetails",
    success_result_json AS "successResult",
    CASE
      WHEN dead_lettered_at IS NULL THEN NULL
      ELSE to_char(dead_lettered_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    END AS "deadLetteredAt",
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt",
    to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt"
  FROM surebet.worker_jobs
  WHERE status = 'leased'
    AND lease_expires_at <= ${quoteSqlLiteral(reapedAt)}::timestamptz
  ORDER BY lease_expires_at ASC, job_id ASC
) AS t;
`,
      ).map((row) => normalizeJobRow(row))
        .filter((row): row is SurebetWorkerJobRecord => row !== undefined),
    );

    const deadLettered: SurebetWorkerJobRecord[] = [];
    for (const job of jobs) {
      const deadLetteredJob = this.deadLetterExpiredLease(
        job,
        reapedAt,
        Object.freeze({
          evidenceRequired: 'A fresh worker claim with a bounded active lease.',
          ...(job.leaseExpiresAt === undefined ? {} : { expiredAt: job.leaseExpiresAt }),
          ...(job.leaseOwner === undefined ? {} : { workerId: job.leaseOwner }),
        }),
      );
      if (deadLetteredJob !== undefined) {
        deadLettered.push(deadLetteredJob);
      }
    }
    return Object.freeze(deadLettered);
  }

  requireJob(jobId: string): SurebetWorkerJobRecord {
    const job = this.get(jobId);
    if (job === undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_WORKER_JOB_NOT_FOUND',
        `Surebet worker job ${jobId} does not exist.`,
      );
    }
    return job;
  }

  requireOwnedActiveLease(
    jobId: string,
    workerId: string,
    leaseToken: string,
    observedAt: string,
  ): SurebetWorkerJobRecord {
    const job = this.requireJob(jobId);
    if (job.status === 'dead_lettered') {
      throw invalidJobMutation(
        'SUREBET_WORKER_JOB_DEAD_LETTER_IMMUTABLE',
        job.jobId,
        'Dead-lettered jobs are immutable and may not be claimed, checkpointed, or mutated.',
      );
    }
    if (job.leaseOwner !== workerId || job.leaseToken !== leaseToken) {
      throw invalidJobMutation(
        'SUREBET_WORKER_JOB_LEASE_OWNERSHIP_CONFLICT',
        job.jobId,
        'Worker job mutation requires the exact current lease owner and lease token.',
      );
    }
    if (job.leaseExpiresAt === undefined) {
      throw invalidJobMutation(
        'SUREBET_WORKER_JOB_LEASE_INVALID',
        job.jobId,
        'Worker job mutation requires an active bounded lease.',
      );
    }
    if (Date.parse(job.leaseExpiresAt) < Date.parse(observedAt)) {
      throw invalidJobMutation(
        'SUREBET_WORKER_JOB_LEASE_EXPIRED',
        job.jobId,
        'Worker job mutation requires the lease to remain active at the observed timestamp.',
      );
    }
    return job;
  }

  deadLetterOwnedJob(
    job: SurebetWorkerJobRecord,
    failedAt: string,
    errorCode: string,
    errorDetails: JsonValue,
  ): SurebetWorkerJobRecord {
    if (job.leaseOwner === undefined || job.leaseToken === undefined) {
      throw invalidJobMutation(
        'SUREBET_WORKER_JOB_LEASE_INVALID',
        job.jobId,
        'Owned dead-letter transitions require a current worker lease.',
      );
    }
    const current = this.requireOwnedActiveLease(
      job.jobId,
      job.leaseOwner,
      job.leaseToken,
      requireIsoTimestamp(failedAt, 'failedAt'),
    );

    const rows = queryPsqlJsonRows<WorkerJobMutationRow>(
      this.#config,
      `
WITH updated AS (
  UPDATE surebet.worker_jobs
  SET
    status = 'dead_lettered',
    lease_owner = NULL,
    lease_token = NULL,
    lease_duration_ms = NULL,
    lease_expires_at = NULL,
    last_heartbeat_at = NULL,
    last_error_code = ${quoteSqlLiteral(errorCode)},
    last_error_details_json = ${toJsonLiteral(errorDetails)},
    dead_lettered_at = ${quoteSqlLiteral(failedAt)}::timestamptz,
    updated_at = CURRENT_TIMESTAMP
  WHERE job_id = ${quoteSqlLiteral(current.jobId)}
    AND status = 'leased'
    AND lease_owner = ${quoteSqlLiteral(current.leaseOwner!)}
    AND lease_token = ${quoteSqlLiteral(current.leaseToken!)}
  RETURNING
    job_id AS "jobId"
),
inserted AS (
  INSERT INTO surebet.worker_job_dead_letters (
    job_id,
    queue_name,
    job_kind,
    dead_letter_reason_code,
    dead_letter_reason_details_json,
    final_attempt_count,
    final_worker_id,
    final_lease_token,
    checkpoint_count
  )
  SELECT
    ${quoteSqlLiteral(current.jobId)},
    ${quoteSqlLiteral(current.queueName)},
    ${quoteSqlLiteral(current.jobKind)},
    ${quoteSqlLiteral(errorCode)},
    ${toJsonLiteral(errorDetails)},
    ${current.attemptCount},
    ${quoteSqlLiteral(current.leaseOwner!)},
    ${quoteSqlLiteral(current.leaseToken!)},
    ${current.checkpointCount}
  FROM updated
  RETURNING
    job_id AS "jobId"
)
SELECT row_to_json(inserted)::text
FROM inserted;
`,
    );
    if (rows.length === 0) {
      throw invalidJobMutation(
        'SUREBET_WORKER_JOB_LEASE_OWNERSHIP_CONFLICT',
        current.jobId,
        'Owned dead-letter transitions require the exact current active lease.',
      );
    }
    return this.requireJob(current.jobId);
  }

  deadLetterExpiredLease(
    job: SurebetWorkerJobRecord,
    failedAt: string,
    errorDetails: JsonValue,
  ): SurebetWorkerJobRecord | undefined {
    if (job.leaseOwner === undefined || job.leaseToken === undefined) {
      throw invalidJobMutation(
        'SUREBET_WORKER_JOB_LEASE_INVALID',
        job.jobId,
        'Expired-lease dead-letter transitions require an observed owned lease.',
      );
    }
    const errorCode = 'SUREBET_WORKER_JOB_LEASE_EXPIRED';
    const observedFailedAt = requireIsoTimestamp(failedAt, 'failedAt');
    const rows = queryPsqlJsonRows<WorkerJobMutationRow>(
      this.#config,
      `
WITH updated AS (
  UPDATE surebet.worker_jobs
  SET
    status = 'dead_lettered',
    lease_owner = NULL,
    lease_token = NULL,
    lease_duration_ms = NULL,
    lease_expires_at = NULL,
    last_heartbeat_at = NULL,
    last_error_code = ${quoteSqlLiteral(errorCode)},
    last_error_details_json = ${toJsonLiteral(errorDetails)},
    dead_lettered_at = ${quoteSqlLiteral(observedFailedAt)}::timestamptz,
    updated_at = CURRENT_TIMESTAMP
  WHERE job_id = ${quoteSqlLiteral(job.jobId)}
    AND status = 'leased'
    AND lease_owner = ${quoteSqlLiteral(job.leaseOwner)}
    AND lease_token = ${quoteSqlLiteral(job.leaseToken)}
    AND lease_expires_at IS NOT NULL
    AND lease_expires_at <= ${quoteSqlLiteral(observedFailedAt)}::timestamptz
  RETURNING
    job_id AS "jobId"
),
inserted AS (
  INSERT INTO surebet.worker_job_dead_letters (
    job_id,
    queue_name,
    job_kind,
    dead_letter_reason_code,
    dead_letter_reason_details_json,
    final_attempt_count,
    final_worker_id,
    final_lease_token,
    checkpoint_count
  )
  SELECT
    ${quoteSqlLiteral(job.jobId)},
    ${quoteSqlLiteral(job.queueName)},
    ${quoteSqlLiteral(job.jobKind)},
    ${quoteSqlLiteral(errorCode)},
    ${toJsonLiteral(errorDetails)},
    ${job.attemptCount},
    ${quoteSqlLiteral(job.leaseOwner)},
    ${quoteSqlLiteral(job.leaseToken)},
    ${job.checkpointCount}
  FROM updated
  RETURNING
    job_id AS "jobId"
)
SELECT row_to_json(inserted)::text
FROM inserted;
`,
    );
    if (rows.length === 0) {
      return undefined;
    }
    return this.requireJob(job.jobId);
  }
}

function normalizeJobRow(row: WorkerJobRow | undefined): SurebetWorkerJobRecord | undefined {
  if (row === undefined) {
    return undefined;
  }
  return Object.freeze({
    jobId: row.jobId,
    queueName: row.queueName,
    jobKind: row.jobKind,
    status: row.status,
    payloadSha256: row.payloadSha256,
    payload: row.payload,
    retryDelaysMs: Object.freeze(validateRetryDelayArray(row.retryDelaysMs, 'retryDelaysMs')),
    attemptCount: requireSafeInteger(row.attemptCount, 'attemptCount'),
    checkpointCount: requireSafeInteger(row.checkpointCount, 'checkpointCount'),
    availableAt: row.availableAt,
    ...(row.claimedAt === null ? {} : { claimedAt: row.claimedAt }),
    ...(row.completedAt === null ? {} : { completedAt: row.completedAt }),
    ...(row.leaseOwner === null ? {} : { leaseOwner: row.leaseOwner }),
    ...(row.leaseToken === null ? {} : { leaseToken: row.leaseToken }),
    ...(row.leaseDurationMs === null ? {} : { leaseDurationMs: requireSafeInteger(row.leaseDurationMs, 'leaseDurationMs') }),
    ...(row.leaseExpiresAt === null ? {} : { leaseExpiresAt: row.leaseExpiresAt }),
    ...(row.lastHeartbeatAt === null ? {} : { lastHeartbeatAt: row.lastHeartbeatAt }),
    ...(row.lastCheckpointId === null ? {} : { lastCheckpointId: row.lastCheckpointId }),
    ...(row.lastCheckpointSha256 === null ? {} : { lastCheckpointSha256: row.lastCheckpointSha256 }),
    ...(row.lastCheckpoint === null ? {} : { lastCheckpoint: row.lastCheckpoint }),
    ...(row.lastCheckpointAt === null ? {} : { lastCheckpointAt: row.lastCheckpointAt }),
    ...(row.lastErrorCode === null ? {} : { lastErrorCode: row.lastErrorCode }),
    ...(row.lastErrorDetails === null ? {} : { lastErrorDetails: row.lastErrorDetails }),
    ...(row.successResult === null ? {} : { successResult: row.successResult }),
    ...(row.deadLetteredAt === null ? {} : { deadLetteredAt: row.deadLetteredAt }),
    insertedAt: row.insertedAt,
    updatedAt: row.updatedAt,
  });
}

function normalizeCheckpointRow(
  row: WorkerJobCheckpointRow | undefined,
): SurebetWorkerJobCheckpointRecord | undefined {
  if (row === undefined) {
    return undefined;
  }
  return Object.freeze({
    jobId: row.jobId,
    checkpointId: row.checkpointId,
    workerId: row.workerId,
    leaseToken: row.leaseToken,
    attemptCount: requireSafeInteger(row.attemptCount, 'attemptCount'),
    checkpointSha256: row.checkpointSha256,
    checkpoint: row.checkpoint,
    recordedAt: row.recordedAt,
    insertedAt: row.insertedAt,
  });
}

function normalizeDeadLetterRow(
  row: WorkerJobDeadLetterRow | undefined,
): SurebetWorkerJobDeadLetterRecord | undefined {
  if (row === undefined) {
    return undefined;
  }
  return Object.freeze({
    jobId: row.jobId,
    queueName: row.queueName,
    jobKind: row.jobKind,
    deadLetterReasonCode: row.deadLetterReasonCode,
    deadLetterReasonDetails: row.deadLetterReasonDetails,
    finalAttemptCount: requireSafeInteger(row.finalAttemptCount, 'finalAttemptCount'),
    finalWorkerId: row.finalWorkerId,
    finalLeaseToken: row.finalLeaseToken,
    checkpointCount: requireSafeInteger(row.checkpointCount, 'checkpointCount'),
    insertedAt: row.insertedAt,
  });
}

function normalizeQueueSummaryRow(
  row: WorkerJobQueueSummaryRow | undefined,
  queueName: string,
): SurebetWorkerQueueSummary {
  if (row === undefined) {
    return Object.freeze({
      deadLetteredCount: 0,
      leasedCount: 0,
      outstandingCount: 0,
      pendingCount: 0,
      queueName,
      retryWaitCount: 0,
      succeededCount: 0,
    });
  }
  const pendingCount = requireSafeInteger(row.pendingCount, 'pendingCount');
  const leasedCount = requireSafeInteger(row.leasedCount, 'leasedCount');
  const retryWaitCount = requireSafeInteger(row.retryWaitCount, 'retryWaitCount');
  const succeededCount = requireSafeInteger(row.succeededCount, 'succeededCount');
  const deadLetteredCount = requireSafeInteger(row.deadLetteredCount, 'deadLetteredCount');
  return Object.freeze({
    deadLetteredCount,
    leasedCount,
    outstandingCount: pendingCount + leasedCount + retryWaitCount,
    pendingCount,
    queueName: row.queueName,
    retryWaitCount,
    succeededCount,
  });
}

function validatePendingRecord(
  record: SurebetPendingWorkerJobRecord,
): SurebetPendingWorkerJobRecord & { readonly payloadSha256: string } {
  const jobId = requireNonEmptyString(record.jobId, 'jobId');
  const queueName = requireNonEmptyString(record.queueName, 'queueName');
  const jobKind = requireNonEmptyString(record.jobKind, 'jobKind');
  requireIsoTimestamp(record.availableAt, 'availableAt');
  const retryDelaysMs = Object.freeze(validateRetryDelayArray(record.retryDelaysMs, 'retryDelaysMs'));
  const payloadSha256 = sha256Hex(stableJsonStringify(record.payload));
  return Object.freeze({
    availableAt: record.availableAt,
    jobId,
    jobKind,
    payload: record.payload,
    payloadSha256,
    queueName,
    retryDelaysMs,
  });
}

function validateClaimRequest(
  request: SurebetWorkerJobClaimRequest,
): SurebetWorkerJobClaimRequest & { readonly leaseExpiresAt: string } {
  const queueName = requireNonEmptyString(request.queueName, 'queueName');
  const workerId = requireNonEmptyString(request.workerId, 'workerId');
  const leaseToken = requireNonEmptyString(request.leaseToken, 'leaseToken');
  requireIsoTimestamp(request.claimedAt, 'claimedAt');
  const leaseDurationMs = requireBoundedPositiveInteger(request.leaseDurationMs, 'leaseDurationMs');
  return Object.freeze({
    claimedAt: request.claimedAt,
    leaseDurationMs,
    leaseExpiresAt: addMilliseconds(request.claimedAt, leaseDurationMs),
    leaseToken,
    queueName,
    workerId,
  });
}

function validateHeartbeatRequest(
  request: SurebetWorkerJobHeartbeatRequest,
): SurebetWorkerJobHeartbeatRequest & { readonly leaseExpiresAt: string } {
  const jobId = requireNonEmptyString(request.jobId, 'jobId');
  const workerId = requireNonEmptyString(request.workerId, 'workerId');
  const leaseToken = requireNonEmptyString(request.leaseToken, 'leaseToken');
  requireIsoTimestamp(request.heartbeatAt, 'heartbeatAt');
  const leaseDurationMs = requireBoundedPositiveInteger(request.leaseDurationMs, 'leaseDurationMs');
  return Object.freeze({
    heartbeatAt: request.heartbeatAt,
    jobId,
    leaseDurationMs,
    leaseExpiresAt: addMilliseconds(request.heartbeatAt, leaseDurationMs),
    leaseToken,
    workerId,
  });
}

function validateCheckpointRequest(
  request: SurebetWorkerJobCheckpointRequest,
): SurebetWorkerJobCheckpointRequest {
  return Object.freeze({
    checkpoint: request.checkpoint,
    checkpointId: requireNonEmptyString(request.checkpointId, 'checkpointId'),
    jobId: requireNonEmptyString(request.jobId, 'jobId'),
    leaseToken: requireNonEmptyString(request.leaseToken, 'leaseToken'),
    recordedAt: requireIsoTimestamp(request.recordedAt, 'recordedAt'),
    workerId: requireNonEmptyString(request.workerId, 'workerId'),
  });
}

function validateCompletionRequest(
  request: SurebetWorkerJobCompletionRequest,
): SurebetWorkerJobCompletionRequest {
  return Object.freeze({
    completedAt: requireIsoTimestamp(request.completedAt, 'completedAt'),
    jobId: requireNonEmptyString(request.jobId, 'jobId'),
    leaseToken: requireNonEmptyString(request.leaseToken, 'leaseToken'),
    successResult: request.successResult,
    workerId: requireNonEmptyString(request.workerId, 'workerId'),
  });
}

function validateFailureRequest(
  request: SurebetWorkerJobFailureRequest,
): SurebetWorkerJobFailureRequest {
  return Object.freeze({
    errorCode: requireNonEmptyString(request.errorCode, 'errorCode'),
    errorDetails: request.errorDetails,
    failedAt: requireIsoTimestamp(request.failedAt, 'failedAt'),
    jobId: requireNonEmptyString(request.jobId, 'jobId'),
    leaseToken: requireNonEmptyString(request.leaseToken, 'leaseToken'),
    workerId: requireNonEmptyString(request.workerId, 'workerId'),
  });
}

function requireNonEmptyString(value: string | undefined, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new SurebetPersistenceError(
      'SUREBET_WORKER_JOB_INVALID',
      `Surebet worker jobs require a non-empty ${field}.`,
    );
  }
  return value.trim();
}

function requireIsoTimestamp(value: string, field: string): string {
  if (!ISO_UTC_TIMESTAMP.test(value)) {
    throw new SurebetPersistenceError(
      'SUREBET_WORKER_JOB_INVALID',
      `Surebet worker jobs require ${field} to be an ISO-8601 UTC timestamp.`,
    );
  }
  return value;
}

function requirePositiveIntegerValue(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new SurebetPersistenceError(
      'SUREBET_WORKER_JOB_INVALID',
      `Surebet worker jobs require ${field} to be a positive integer.`,
    );
  }
  return value;
}

function requireBoundedPositiveInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > MAX_LEASE_DURATION_MS) {
    throw new SurebetPersistenceError(
      'SUREBET_WORKER_JOB_INVALID',
      `Surebet worker jobs require ${field} to be a positive safe integer no greater than ${MAX_LEASE_DURATION_MS}.`,
    );
  }
  return value;
}

function validateRetryDelayArray(value: readonly number[], field: string): readonly number[] {
  if (!Array.isArray(value)) {
    throw new SurebetPersistenceError(
      'SUREBET_WORKER_JOB_INVALID',
      `Surebet worker jobs require ${field} to be an array of bounded non-negative retry delays.`,
    );
  }
  if (value.length > MAX_RETRY_DELAYS) {
    throw new SurebetPersistenceError(
      'SUREBET_WORKER_JOB_INVALID',
      `Surebet worker jobs require ${field} to contain no more than ${MAX_RETRY_DELAYS} retry delays.`,
    );
  }
  return Object.freeze(
    value.map((entry) => {
      if (!Number.isSafeInteger(entry) || entry < 0 || entry > MAX_LEASE_DURATION_MS) {
        throw new SurebetPersistenceError(
          'SUREBET_WORKER_JOB_INVALID',
          `Surebet worker jobs require every ${field} entry to be a bounded non-negative safe integer.`,
        );
      }
      return entry;
    }),
  );
}

function requireSafeInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new SurebetPersistenceError(
      'SUREBET_WORKER_JOB_INVALID',
      `Surebet worker jobs require ${field} to remain a non-negative safe integer.`,
    );
  }
  return value;
}

function addMilliseconds(timestamp: string, milliseconds: number): string {
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) {
    throw new SurebetPersistenceError(
      'SUREBET_WORKER_JOB_INVALID',
      `Surebet worker jobs require a parseable ISO timestamp, received ${timestamp}.`,
    );
  }
  return new Date(parsed + milliseconds).toISOString();
}

function invalidJobMutation(code: string, jobId: string, message: string): SurebetPersistenceError {
  return new SurebetPersistenceError(code, `${message} Job=${jobId}.`);
}

function toComparablePendingRecord(
  record: SurebetPendingWorkerJobRecord & { readonly payloadSha256: string },
): JsonValue {
  return Object.freeze({
    availableAt: record.availableAt,
    jobId: record.jobId,
    jobKind: record.jobKind,
    payload: record.payload,
    payloadSha256: record.payloadSha256,
    queueName: record.queueName,
    retryDelaysMs: record.retryDelaysMs as unknown as JsonValue,
  });
}

function toComparableCreate(record: SurebetWorkerJobRecord): JsonValue {
  return Object.freeze({
    availableAt: record.availableAt,
    jobId: record.jobId,
    jobKind: record.jobKind,
    payload: record.payload,
    payloadSha256: record.payloadSha256,
    queueName: record.queueName,
    retryDelaysMs: record.retryDelaysMs as unknown as JsonValue,
  });
}

function toComparableCheckpoint(record: SurebetWorkerJobCheckpointRecord): JsonValue {
  return Object.freeze({
    attemptCount: record.attemptCount,
    checkpoint: record.checkpoint,
    checkpointId: record.checkpointId,
    checkpointSha256: record.checkpointSha256,
    jobId: record.jobId,
    leaseToken: record.leaseToken,
    recordedAt: record.recordedAt,
    workerId: record.workerId,
  });
}

function toComparableCompletion(record: SurebetWorkerJobRecord): JsonValue {
  return Object.freeze({
    completedAt: record.completedAt ?? null,
    jobId: record.jobId,
    successResult: record.successResult ?? null,
  });
}
