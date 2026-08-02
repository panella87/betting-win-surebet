CREATE TABLE IF NOT EXISTS surebet.b1_upstream_convergence_checkpoints (
  checkpoint_id text PRIMARY KEY,
  contract_schema text NOT NULL CHECK (contract_schema = 'betting-win.b1_multi_venue_markets.v1'),
  contract_alias text NOT NULL CHECK (contract_alias = 'betting-win-b1-multi-venue-markets.v1'),
  mode text NOT NULL CHECK (mode IN ('fixture_offline', 'blocked_upstream_contract_absent')),
  upstream_readiness text NOT NULL CHECK (
    upstream_readiness = 'blocked_until_betting_win_b1_multi_venue_markets_v1'
  ),
  upstream_lock_fingerprint text NOT NULL CHECK (upstream_lock_fingerprint ~ '^[0-9a-f]{64}$'),
  source_manifest_hash text NOT NULL CHECK (source_manifest_hash ~ '^[0-9a-f]{64}$'),
  last_seen_export_id text,
  last_seen_snapshot_time_utc timestamptz,
  imported_row_count bigint NOT NULL CHECK (imported_row_count >= 0),
  blocker_code text NOT NULL,
  blocker_details_json jsonb NOT NULL,
  runtime_evidence boolean NOT NULL CHECK (runtime_evidence = false),
  inserted_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS b1_upstream_convergence_checkpoints_updated_idx
  ON surebet.b1_upstream_convergence_checkpoints (updated_at, checkpoint_id);
