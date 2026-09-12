
# Database-role and schema-confinement proof

## Scope

Migration, persistence, restore, retention, and lifecycle tranches that require surebet schema/role confinement.

## Prerequisites

- accepted disposable PostgreSQL proof lane
- restricted proof role
- exact admitted migration/test bytes

## Safety boundary

- Run only after the relevant tranche is explicitly admitted.
- Ordinary diagnostic commands are bounded to 120 seconds.
- Commands are Linux/WSL compatible, repository-local where possible, and return control to the invoking shell.
- No command starts a current autonomous controller, deploys, migrates a persistent database, controls an unrelated service, exposes a secret in argv, or accesses `betting-win`.
- Disposable or managed environment actions are explicitly operator-run and are not executed by this documentation task.

## Procedure

1. Prove the role can perform only reviewed `surebet.*` actions.
2. Attempt negative writes outside the allowed schema and require denial.
3. Verify status operations are read-only and unknown migration rows fail closed.
4. Bind database target, role, schema generation, and migration lineage in receipts.
5. Reject superuser/owner success as confinement evidence.

## Bounded diagnostic example

```bash
(
  set -Eeuo pipefail
  test "${BWS_DISPOSABLE_DB_CONFIRMED:-no}" = "yes"
  export PGSERVICE="${BWS_RESTRICTED_PG_SERVICE:?BWS_RESTRICTED_PG_SERVICE is required}"
  timeout 120s psql --no-psqlrc --set=ON_ERROR_STOP=1 --tuples-only --no-align --command="select current_user, current_database();"
  timeout 120s psql --no-psqlrc --set=ON_ERROR_STOP=1 --tuples-only --no-align --command="select has_schema_privilege(current_user, 'surebet', 'USAGE');"
)
```


## External/managed action boundary

Negative mutation probes must be executed only against the disposable database and recorded as expected denials.

## Receipt output

Record the exact consumed source/config/process/test/environment generations, command or operator action identity, start/end clocks, result, evidence digests, cleanup result, unresolved blockers, retained holds, owner/reviewer, and parent/previous receipt digests. A listed but unexecuted procedure is not proof.
