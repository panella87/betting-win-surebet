CREATE TABLE IF NOT EXISTS surebet.upstream_export_convergence_checkpoints (
  checkpoint_id text PRIMARY KEY,
  mode text NOT NULL CHECK (mode = 'export'),
  upstream_lock_record_id text NOT NULL REFERENCES surebet.upstream_locks (lock_record_id),
  selection_manifest_locator text NOT NULL,
  selection_manifest_sha256 text NOT NULL CHECK (selection_manifest_sha256 ~ '^[0-9a-f]{64}$'),
  contract_schema text NOT NULL CHECK (contract_schema = 'betting-win.strategy-export.v1'),
  contract_alias text NOT NULL CHECK (contract_alias = 'betting-win-strategy-export.v1'),
  surebet_profile text NOT NULL CHECK (surebet_profile = 'surebet_standard_binary_v0'),
  selection_count bigint NOT NULL CHECK (selection_count >= 1),
  next_selection_index bigint NOT NULL CHECK (next_selection_index >= 0),
  last_selection_cursor text,
  last_import_run_id text,
  last_pinned_strategy_export_record_id text REFERENCES surebet.pinned_strategy_exports (intake_record_id),
  last_source_sha256 text CHECK (
    last_source_sha256 IS NULL
    OR last_source_sha256 ~ '^[0-9a-f]{64}$'
  ),
  completed_at timestamptz,
  inserted_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (next_selection_index <= selection_count),
  CHECK (
    (next_selection_index = 0
      AND last_selection_cursor IS NULL
      AND last_import_run_id IS NULL
      AND last_pinned_strategy_export_record_id IS NULL
      AND last_source_sha256 IS NULL)
    OR (next_selection_index >= 1
      AND last_selection_cursor IS NOT NULL
      AND last_import_run_id IS NOT NULL
      AND last_pinned_strategy_export_record_id IS NOT NULL
      AND last_source_sha256 IS NOT NULL)
  ),
  CHECK (
    (next_selection_index < selection_count AND completed_at IS NULL)
    OR (next_selection_index = selection_count AND completed_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS upstream_export_convergence_lock_idx
  ON surebet.upstream_export_convergence_checkpoints (upstream_lock_record_id, checkpoint_id);
