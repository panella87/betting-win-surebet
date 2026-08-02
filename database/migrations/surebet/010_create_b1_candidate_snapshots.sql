CREATE TABLE IF NOT EXISTS surebet.b1_candidate_snapshots (
  candidate_snapshot_id text PRIMARY KEY,
  run_id text NOT NULL REFERENCES surebet.b1_backtest_runs (run_id),
  candidate_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('accepted', 'blocked')),
  stage text NOT NULL CHECK (
    stage IN ('gross', 'stake_vector', 'net_economics', 'fillability', 'settlement', 'accepted')
  ),
  market_equivalence_key text,
  venue_pair_key text,
  gross_spread_ppm bigint,
  net_spread_ppm bigint,
  worst_case_net_minor bigint,
  blockers_json jsonb NOT NULL,
  candidate_json jsonb NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (run_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS b1_candidate_snapshots_run_idx
  ON surebet.b1_candidate_snapshots (run_id, status, stage, candidate_id);
