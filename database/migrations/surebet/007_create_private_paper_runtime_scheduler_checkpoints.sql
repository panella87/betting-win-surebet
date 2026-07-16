CREATE TABLE IF NOT EXISTS surebet.private_paper_runtime_scheduler_checkpoints (
  scheduler_checkpoint_id text PRIMARY KEY,
  mode text NOT NULL CHECK (mode IN ('api')),
  runtime_id text NOT NULL,
  queue_name text NOT NULL,
  upstream_checkpoint_id text NOT NULL,
  upstream_lock_record_id text NOT NULL,
  config_sha256 text NOT NULL CHECK (config_sha256 ~ '^[0-9a-f]{64}$'),
  last_scheduled_api_cycle_number bigint CHECK (
    last_scheduled_api_cycle_number IS NULL
    OR last_scheduled_api_cycle_number >= 1
  ),
  last_scheduled_job_id text,
  last_scheduled_source_id text,
  last_scheduled_at timestamptz,
  inserted_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (last_scheduled_job_id IS NULL AND last_scheduled_source_id IS NULL AND last_scheduled_at IS NULL)
    OR (last_scheduled_job_id IS NOT NULL AND last_scheduled_source_id IS NOT NULL AND last_scheduled_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS private_paper_runtime_scheduler_checkpoints_queue_idx
  ON surebet.private_paper_runtime_scheduler_checkpoints (queue_name, upstream_checkpoint_id, scheduler_checkpoint_id);
