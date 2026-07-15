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
## Disposable acceptance configuration

`BWS-510` accepts exactly one deterministic PostgreSQL test configuration shape:

```text
complete SUREBET_TEST_* tuple
or
DB_URL_TEST from the process environment or repo-local .env
```

A partial `SUREBET_TEST_*` tuple is rejected and is never mixed with `DB_URL_TEST`.
`DB_URL_TEST` must be an explicit PostgreSQL URL with user, host, port, and one
maintenance database. The selected role must already have `CREATEDB`; the acceptance
proof creates a uniquely named disposable database, runs the integrated migration and
loopback checks, and drops that database afterward. Credentials are passed only to child
processes and are not printed in validation output.

