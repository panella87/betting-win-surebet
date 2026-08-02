CREATE TABLE IF NOT EXISTS surebet.b1_backtest_runs (
  run_id text PRIMARY KEY,
  upstream_checkpoint_id text REFERENCES surebet.b1_upstream_convergence_checkpoints (checkpoint_id),
  run_kind text NOT NULL CHECK (run_kind = 'deterministic_b1_cross_venue_offline_backtest'),
  run_hash text NOT NULL CHECK (run_hash ~ '^[0-9a-f]{64}$'),
  source_manifest_hash text NOT NULL CHECK (source_manifest_hash ~ '^[0-9a-f]{64}$'),
  upstream_lock_fingerprint text NOT NULL CHECK (upstream_lock_fingerprint ~ '^[0-9a-f]{64}$'),
  fixture_kind text NOT NULL CHECK (fixture_kind = 'deterministic_b1_multi_venue_fixture'),
  runtime_evidence boolean NOT NULL CHECK (runtime_evidence = false),
  upstream_readiness text NOT NULL CHECK (
    upstream_readiness = 'blocked_until_betting_win_b1_multi_venue_markets_v1'
  ),
  offline_falsification_status text NOT NULL CHECK (
    offline_falsification_status IN (
      'B1_OFFLINE_RESEARCH_CANDIDATES_OBSERVED',
      'B1_FALSIFIED_NET_EDGE_DISAPPEARED',
      'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT'
    )
  ),
  metrics_json jsonb NOT NULL,
  report_json jsonb NOT NULL,
  executable boolean NOT NULL CHECK (executable = false),
  live_readiness text NOT NULL CHECK (live_readiness = 'not_authorized_bws_900_parked'),
  observed_at timestamptz NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS b1_backtest_runs_run_hash_idx
  ON surebet.b1_backtest_runs (run_hash);

CREATE INDEX IF NOT EXISTS b1_backtest_runs_observed_idx
  ON surebet.b1_backtest_runs (observed_at, run_id);
