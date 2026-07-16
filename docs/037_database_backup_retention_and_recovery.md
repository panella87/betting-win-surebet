# 037 - Database backup, retention and recovery contract

## Scope

This contract defines `BWS-585` and contributes to `BWS-591`.

BWS owns only the `surebet.*` schema. All maintenance commands must fail closed outside that ownership boundary.

## Migration status

Provide a machine-readable command that reports:

- current migration ledger and checksums;
- pending migrations;
- schema ownership validation;
- database/server version compatibility;
- whether the service must be stopped or drained before applying changes.

No migration may run implicitly when a dry-run or status command is requested.

## Backup

Backup behavior must:

- require an explicit output path outside transient runtime directories;
- include only BWS-owned schema/data and required metadata;
- record source database identity without exposing credentials;
- write through a temporary file and publish atomically;
- produce SHA-256 and a machine-readable manifest;
- reject overwrite unless an explicit safe flag is provided;
- support operator-owned encryption without inventing or storing keys.

## Restore verification

Restore proof must:

- create a uniquely named disposable database;
- restore the backup into that database;
- validate migrations, row counts, checksums, invariants and read-only API queries;
- run representative scheduler/worker/restart checks;
- drop only the disposable database after proof;
- never restore over an active project database in autonomous mode.

## Retention and pruning

Implement bounded retention for high-volume runtime evidence:

- import-run pages;
- worker checkpoints and dead letters;
- scheduler and convergence checkpoints;
- runtime lifecycle evidence;
- logs and generated artifacts.

Retention must preserve references required by strategy-ledger, settlement, accepted runtime cycles and active investigations. The default command is dry-run. An apply command requires explicit scope, cutoff, maximum rows and a generated plan fingerprint.

## Recovery

Recovery evidence must cover interrupted backup, interrupted restore, checksum mismatch, incompatible migration, unavailable database, partial prune and service restart after database recovery.
