CREATE TABLE IF NOT EXISTS surebet.b1_simulation_results (
  simulation_result_id text PRIMARY KEY,
  run_id text NOT NULL REFERENCES surebet.b1_backtest_runs (run_id),
  candidate_id text NOT NULL,
  simulation_kind text NOT NULL CHECK (
    simulation_kind IN ('fill_rejection_timeout', 'residual_exposure', 'settlement_replay', 'false_positive')
  ),
  status text NOT NULL CHECK (status IN ('accepted', 'blocked')),
  result_json jsonb NOT NULL,
  blockers_json jsonb NOT NULL,
  false_positive boolean,
  residual_exposure_minor bigint,
  settled_net_minor bigint,
  inserted_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (run_id, candidate_id, simulation_kind)
);

CREATE INDEX IF NOT EXISTS b1_simulation_results_run_idx
  ON surebet.b1_simulation_results (run_id, simulation_kind, status, candidate_id);
