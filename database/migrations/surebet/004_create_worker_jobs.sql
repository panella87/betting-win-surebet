CREATE TABLE IF NOT EXISTS surebet.worker_jobs (
  job_id text PRIMARY KEY,
  queue_name text NOT NULL,
  job_kind text NOT NULL,
  status text NOT NULL CHECK (
    status IN (
      'pending',
      'leased',
      'retry_wait',
      'succeeded',
      'dead_lettered'
    )
  ),
  payload_sha256 text NOT NULL CHECK (payload_sha256 ~ '^[0-9a-f]{64}$'),
  payload_json jsonb NOT NULL,
  retry_delays_ms_json jsonb NOT NULL,
  attempt_count bigint NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  checkpoint_count bigint NOT NULL DEFAULT 0 CHECK (checkpoint_count >= 0),
  available_at timestamptz NOT NULL,
  claimed_at timestamptz,
  completed_at timestamptz,
  lease_owner text,
  lease_token text,
  lease_duration_ms bigint CHECK (lease_duration_ms IS NULL OR lease_duration_ms >= 1),
  lease_expires_at timestamptz,
  last_heartbeat_at timestamptz,
  last_checkpoint_id text,
  last_checkpoint_sha256 text CHECK (
    last_checkpoint_sha256 IS NULL
    OR last_checkpoint_sha256 ~ '^[0-9a-f]{64}$'
  ),
  last_checkpoint_json jsonb,
  last_checkpoint_at timestamptz,
  last_error_code text,
  last_error_details_json jsonb,
  success_result_json jsonb,
  dead_lettered_at timestamptz,
  inserted_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (status = 'pending'
      AND attempt_count = 0
      AND claimed_at IS NULL
      AND completed_at IS NULL
      AND lease_owner IS NULL
      AND lease_token IS NULL
      AND lease_duration_ms IS NULL
      AND lease_expires_at IS NULL
      AND last_heartbeat_at IS NULL
      AND success_result_json IS NULL
      AND dead_lettered_at IS NULL)
    OR (status = 'leased'
      AND attempt_count >= 1
      AND claimed_at IS NOT NULL
      AND completed_at IS NULL
      AND lease_owner IS NOT NULL
      AND lease_token IS NOT NULL
      AND lease_duration_ms IS NOT NULL
      AND lease_expires_at IS NOT NULL
      AND last_heartbeat_at IS NOT NULL
      AND success_result_json IS NULL
      AND dead_lettered_at IS NULL)
    OR (status = 'retry_wait'
      AND attempt_count >= 1
      AND claimed_at IS NOT NULL
      AND completed_at IS NULL
      AND lease_owner IS NULL
      AND lease_token IS NULL
      AND lease_duration_ms IS NULL
      AND lease_expires_at IS NULL
      AND last_heartbeat_at IS NULL
      AND last_error_code IS NOT NULL
      AND last_error_details_json IS NOT NULL
      AND success_result_json IS NULL
      AND dead_lettered_at IS NULL)
    OR (status = 'succeeded'
      AND attempt_count >= 1
      AND claimed_at IS NOT NULL
      AND completed_at IS NOT NULL
      AND lease_owner IS NULL
      AND lease_token IS NULL
      AND lease_duration_ms IS NULL
      AND lease_expires_at IS NULL
      AND last_heartbeat_at IS NULL
      AND success_result_json IS NOT NULL
      AND dead_lettered_at IS NULL)
    OR (status = 'dead_lettered'
      AND attempt_count >= 1
      AND claimed_at IS NOT NULL
      AND completed_at IS NULL
      AND lease_owner IS NULL
      AND lease_token IS NULL
      AND lease_duration_ms IS NULL
      AND lease_expires_at IS NULL
      AND last_heartbeat_at IS NULL
      AND last_error_code IS NOT NULL
      AND last_error_details_json IS NOT NULL
      AND success_result_json IS NULL
      AND dead_lettered_at IS NOT NULL)
  ),
  CHECK (
    (last_checkpoint_id IS NULL
      AND last_checkpoint_sha256 IS NULL
      AND last_checkpoint_json IS NULL
      AND last_checkpoint_at IS NULL)
    OR (last_checkpoint_id IS NOT NULL
      AND last_checkpoint_sha256 IS NOT NULL
      AND last_checkpoint_json IS NOT NULL
      AND last_checkpoint_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS worker_jobs_lease_token_idx
  ON surebet.worker_jobs (lease_token)
  WHERE lease_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS worker_jobs_claim_idx
  ON surebet.worker_jobs (queue_name, status, available_at, job_id);

CREATE INDEX IF NOT EXISTS worker_jobs_dead_letter_idx
  ON surebet.worker_jobs (status, dead_lettered_at, job_id);

CREATE TABLE IF NOT EXISTS surebet.worker_job_checkpoints (
  job_id text NOT NULL REFERENCES surebet.worker_jobs (job_id),
  checkpoint_id text NOT NULL,
  worker_id text NOT NULL,
  lease_token text NOT NULL,
  attempt_count bigint NOT NULL CHECK (attempt_count >= 1),
  checkpoint_sha256 text NOT NULL CHECK (checkpoint_sha256 ~ '^[0-9a-f]{64}$'),
  checkpoint_json jsonb NOT NULL,
  recorded_at timestamptz NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (job_id, checkpoint_id)
);

CREATE INDEX IF NOT EXISTS worker_job_checkpoints_job_recorded_idx
  ON surebet.worker_job_checkpoints (job_id, recorded_at, checkpoint_id);

CREATE TABLE IF NOT EXISTS surebet.worker_job_dead_letters (
  job_id text PRIMARY KEY REFERENCES surebet.worker_jobs (job_id),
  queue_name text NOT NULL,
  job_kind text NOT NULL,
  dead_letter_reason_code text NOT NULL,
  dead_letter_reason_details_json jsonb NOT NULL,
  final_attempt_count bigint NOT NULL CHECK (final_attempt_count >= 1),
  final_worker_id text NOT NULL,
  final_lease_token text NOT NULL,
  checkpoint_count bigint NOT NULL CHECK (checkpoint_count >= 0),
  inserted_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS worker_job_dead_letters_queue_idx
  ON surebet.worker_job_dead_letters (queue_name, inserted_at, job_id);
