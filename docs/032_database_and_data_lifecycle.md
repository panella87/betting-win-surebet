# 032 - Database and data lifecycle

BWS owns only the `surebet.*` schema.

Core domains include upstream locks/imports/convergence, opportunities and blockers, stake and exposure state, backtests, private-paper cycles, settlement reconciliation, jobs/checkpoints/dead letters, lifecycle evidence and retention indexes.

Requirements:

- append-only or versioned correction evidence;
- fixed-point integer units;
- upstream references without cross-schema writes;
- deterministic idempotency keys;
- optimistic conflict handling;
- bounded retention with preserved accepted references;
- disposable PostgreSQL migration and restore proof;
- no destructive production migration or restore in autonomous runs.

## Disposable acceptance configuration

Canonical tests accept exactly one deterministic shape:

```text
complete SUREBET_TEST_* tuple
or
canonical POSTGRES_* settings from process environment or repo-local .env
```

A partial tuple is rejected and never mixed with `POSTGRES_*` settings. The selected PostgreSQL role behind `POSTGRES_USER` must already have `CREATEDB` for disposable validation databases. Tests create uniquely named disposable databases and drop only those databases after proof.

## Validated operations

`BWS-585` validates migration status, BWS-owned backup manifests, disposable restore verification, and fingerprinted retention plans. `BWS-591` validates use of verified backup evidence during upgrade, rollback, and disaster-recovery proof. `BWS-599` closes the integrated safe-local database acceptance chain.

`BWS-600` still requires retained evidence from the private BWS PostgreSQL configuration while consuming the operator-approved betting-win read-only API. No runtime or autonomous command may read the betting-win database directly or restore over an active project database.
