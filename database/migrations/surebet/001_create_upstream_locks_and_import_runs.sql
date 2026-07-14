CREATE TABLE IF NOT EXISTS surebet.upstream_locks (
  lock_record_id text PRIMARY KEY,
  lock_fingerprint_sha256 text NOT NULL UNIQUE CHECK (lock_fingerprint_sha256 ~ '^[0-9a-f]{64}$'),
  repository text NOT NULL,
  commit_sha text NOT NULL CHECK (commit_sha ~ '^[0-9a-f]{40}$'),
  git_tree_sha text NOT NULL CHECK (git_tree_sha ~ '^[0-9a-f]{40}$'),
  tracked_tree_listing_sha256 text NOT NULL CHECK (tracked_tree_listing_sha256 ~ '^[0-9a-f]{64}$'),
  verified_at timestamptz NOT NULL,
  lock_json jsonb NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS upstream_locks_commit_sha_idx
  ON surebet.upstream_locks (commit_sha);

CREATE TABLE IF NOT EXISTS surebet.import_runs (
  import_run_id text PRIMARY KEY,
  upstream_lock_record_id text NOT NULL REFERENCES surebet.upstream_locks (lock_record_id),
  source_kind text NOT NULL,
  source_locator text NOT NULL,
  requested_at timestamptz NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  outcome text NOT NULL CHECK (outcome IN ('running', 'succeeded', 'failed')),
  imported_record_count bigint CHECK (imported_record_count IS NULL OR imported_record_count >= 0),
  failure_code text,
  failure_details_json jsonb,
  import_metadata_json jsonb NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (outcome = 'running' AND completed_at IS NULL AND imported_record_count IS NULL AND failure_code IS NULL AND failure_details_json IS NULL)
    OR (outcome = 'succeeded' AND completed_at IS NOT NULL AND imported_record_count IS NOT NULL AND failure_code IS NULL AND failure_details_json IS NULL)
    OR (outcome = 'failed' AND completed_at IS NOT NULL AND imported_record_count IS NOT NULL AND failure_code IS NOT NULL AND failure_details_json IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS import_runs_upstream_lock_record_id_idx
  ON surebet.import_runs (upstream_lock_record_id);
