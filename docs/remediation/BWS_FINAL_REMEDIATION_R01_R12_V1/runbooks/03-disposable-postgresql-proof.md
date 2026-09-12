
# Disposable PostgreSQL proof

## Scope

T01, T09-T13, T19, T30-T32, T34, and dependent acceptance requiring PostgreSQL semantics.

## Prerequisites

- operator-provisioned disposable PostgreSQL instance
- connection configured through a protected `PGSERVICE` entry, not a password-bearing argv
- explicit teardown owner

## Safety boundary

- Run only after the relevant tranche is explicitly admitted.
- Ordinary diagnostic commands are bounded to 120 seconds.
- Commands are Linux/WSL compatible, repository-local where possible, and return control to the invoking shell.
- No command starts a current autonomous controller, deploys, migrates a persistent database, controls an unrelated service, exposes a secret in argv, or accesses `betting-win`.
- Disposable or managed environment actions are explicitly operator-run and are not executed by this documentation task.

## Procedure

1. Verify the target is the disposable proof instance and not a persistent/operator database.
2. Capture server version, database identity, role identity, schema inventory, and transaction settings.
3. Apply only the admitted disposable proof setup.
4. Run mapped tests and failure cases under Node v20.20.2 where applicable.
5. Capture database evidence and verify teardown/cleanup.

## Bounded diagnostic example

```bash
(
  set -Eeuo pipefail
  test "${BWS_DISPOSABLE_DB_CONFIRMED:-no}" = "yes"
  export PGSERVICE="${BWS_PG_SERVICE:?BWS_PG_SERVICE is required}"
  timeout 120s psql --no-psqlrc --set=ON_ERROR_STOP=1 --tuples-only --no-align --command="select current_database(), current_user, current_setting('server_version');"
  timeout 120s psql --no-psqlrc --set=ON_ERROR_STOP=1 --tuples-only --no-align --command="select nspname from pg_namespace order by nspname;"
)
```


## External/managed action boundary

Creation, migration, destructive fixtures, restore, and teardown are operator-run only in the explicitly confirmed disposable environment.

## Receipt output

Record the exact consumed source/config/process/test/environment generations, command or operator action identity, start/end clocks, result, evidence digests, cleanup result, unresolved blockers, retained holds, owner/reviewer, and parent/previous receipt digests. A listed but unexecuted procedure is not proof.
