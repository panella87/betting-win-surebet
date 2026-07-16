CREATE TABLE IF NOT EXISTS surebet.upstream_api_convergence_checkpoints (
  checkpoint_id text PRIMARY KEY,
  mode text NOT NULL CHECK (mode = 'api'),
  upstream_lock_record_id text NOT NULL REFERENCES surebet.upstream_locks (lock_record_id),
  api_base_url text NOT NULL,
  contract_version text NOT NULL,
  page_size bigint NOT NULL CHECK (page_size >= 1),
  max_pages_per_resource bigint NOT NULL CHECK (max_pages_per_resource >= 1),
  retry_limit bigint NOT NULL CHECK (retry_limit >= 0),
  retry_backoff_ms bigint NOT NULL CHECK (retry_backoff_ms >= 1),
  timeout_ms bigint NOT NULL CHECK (timeout_ms >= 1),
  current_cycle_number bigint NOT NULL CHECK (current_cycle_number >= 1),
  current_resource text NOT NULL CHECK (current_resource IN ('identity', 'rules', 'quotes', 'settlement')),
  current_resource_page_count bigint NOT NULL CHECK (current_resource_page_count >= 0),
  next_cursor text,
  last_import_run_id text REFERENCES surebet.import_runs (import_run_id),
  last_response_provenance_json jsonb,
  completed_cycle_count bigint NOT NULL CHECK (completed_cycle_count >= 0),
  last_completed_cycle_at timestamptz,
  inserted_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (current_cycle_number = completed_cycle_count + 1),
  CHECK (current_resource_page_count <= max_pages_per_resource),
  CHECK (
    (current_resource_page_count = 0 AND next_cursor IS NULL)
    OR current_resource_page_count >= 1
  )
);

CREATE INDEX IF NOT EXISTS upstream_api_convergence_lock_idx
  ON surebet.upstream_api_convergence_checkpoints (upstream_lock_record_id, checkpoint_id);
