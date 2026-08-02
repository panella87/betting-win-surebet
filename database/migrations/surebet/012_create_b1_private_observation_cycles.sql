CREATE TABLE IF NOT EXISTS surebet.b1_private_observation_cycles (
  observation_cycle_id text PRIMARY KEY,
  runtime_id text NOT NULL,
  queue_name text NOT NULL,
  worker_job_id text,
  upstream_checkpoint_id text NOT NULL REFERENCES surebet.b1_upstream_convergence_checkpoints (checkpoint_id),
  backtest_run_id text REFERENCES surebet.b1_backtest_runs (run_id),
  status text NOT NULL CHECK (status IN ('started', 'completed', 'blocked')),
  cycle_started_at timestamptz NOT NULL,
  cycle_completed_at timestamptz,
  evidence_json jsonb NOT NULL,
  blocker_code text,
  blocker_details_json jsonb,
  runtime_evidence boolean NOT NULL CHECK (runtime_evidence = false),
  executable boolean NOT NULL CHECK (executable = false),
  inserted_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (status = 'started'
      AND backtest_run_id IS NULL
      AND cycle_completed_at IS NULL
      AND blocker_code IS NULL
      AND blocker_details_json IS NULL)
    OR (status = 'completed'
      AND backtest_run_id IS NOT NULL
      AND cycle_completed_at IS NOT NULL
      AND blocker_code IS NULL
      AND blocker_details_json IS NULL)
    OR (status = 'blocked'
      AND cycle_completed_at IS NOT NULL
      AND blocker_code IS NOT NULL
      AND blocker_details_json IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS b1_private_observation_cycles_runtime_idx
  ON surebet.b1_private_observation_cycles (runtime_id, cycle_started_at, observation_cycle_id);
