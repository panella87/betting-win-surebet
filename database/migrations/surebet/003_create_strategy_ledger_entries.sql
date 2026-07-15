CREATE TABLE IF NOT EXISTS surebet.strategy_ledger_entries (
  ledger_entry_id text PRIMARY KEY,
  upstream_lock_record_id text NOT NULL REFERENCES surebet.upstream_locks (lock_record_id),
  pinned_strategy_export_record_id text REFERENCES surebet.pinned_strategy_exports (intake_record_id),
  run_kind text NOT NULL CHECK (
    run_kind IN (
      'deterministic_standard_binary_backtest',
      'private_paper_runtime_cycle'
    )
  ),
  run_reference_id text NOT NULL,
  source_kind text NOT NULL CHECK (
    source_kind IN (
      'resource_export',
      'pinned_records',
      'read_only_query'
    )
  ),
  source_manifest_hash text NOT NULL CHECK (source_manifest_hash ~ '^[0-9a-f]{64}$'),
  run_fingerprint_sha256 text NOT NULL UNIQUE CHECK (run_fingerprint_sha256 ~ '^[0-9a-f]{64}$'),
  report_kind text NOT NULL CHECK (report_kind = 'surebet_strategy_report_v1'),
  report_id text NOT NULL UNIQUE,
  report_sha256 text NOT NULL UNIQUE CHECK (report_sha256 ~ '^[0-9a-f]{64}$'),
  acceptance_state text NOT NULL CHECK (
    acceptance_state IN (
      'blocked',
      'accepted_local_evidence'
    )
  ),
  settlement_state text NOT NULL CHECK (
    settlement_state IN (
      'blocked',
      'reconciled'
    )
  ),
  privacy text NOT NULL CHECK (privacy = 'private_only'),
  profitability_state text NOT NULL CHECK (profitability_state = 'not_reported'),
  public_distribution_state text NOT NULL CHECK (public_distribution_state = 'withheld'),
  live_state text NOT NULL CHECK (live_state = 'not_claimed'),
  candidate_count bigint NOT NULL CHECK (candidate_count >= 1),
  blocked_candidate_count bigint NOT NULL CHECK (blocked_candidate_count >= 0),
  blocker_count bigint NOT NULL CHECK (blocker_count >= 0),
  entry_json jsonb NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (blocked_candidate_count <= candidate_count),
  CHECK (
    (source_kind = 'read_only_query' AND pinned_strategy_export_record_id IS NULL)
    OR (source_kind IN ('resource_export', 'pinned_records') AND pinned_strategy_export_record_id IS NOT NULL)
  ),
  CHECK (
    (acceptance_state = 'accepted_local_evidence' AND settlement_state = 'reconciled')
    OR (acceptance_state = 'blocked' AND settlement_state = 'blocked')
  )
);

CREATE INDEX IF NOT EXISTS strategy_ledger_entries_upstream_lock_record_id_idx
  ON surebet.strategy_ledger_entries (upstream_lock_record_id);

CREATE INDEX IF NOT EXISTS strategy_ledger_entries_acceptance_state_idx
  ON surebet.strategy_ledger_entries (acceptance_state);
