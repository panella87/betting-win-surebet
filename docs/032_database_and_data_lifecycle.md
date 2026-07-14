# 032 - Database and data lifecycle

BWS owns the `surebet.*` schema.

Minimum domains:

```text
upstream_locks and import_runs
upstream_snapshot_records and provenance references
opportunity_runs, candidates, rejections
stake_vectors and scenario_cashflows
completion_groups, leg_states, residual_exposure
backtest_runs and artifacts
paper_runs, reservations, completions, metrics
settlement_replays and reconciliations
worker_checkpoints and dead_letters
```

Requirements:

- append-only/versioned evidence where correction matters;
- fixed-point integer units;
- upstream reference keys without cross-schema writes;
- deterministic idempotency keys;
- optimistic conflict handling;
- bounded retention and export;
- disposable PostgreSQL migration proof;
- no destructive production migration in autonomous runs.
