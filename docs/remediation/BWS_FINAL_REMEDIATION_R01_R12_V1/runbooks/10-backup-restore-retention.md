
# Backup/restore/retention proof

## Scope

T30-T32 and dependent upgrade/recovery acceptance.

## Prerequisites

- approved backup root
- disposable restore target
- exact database/source generation
- reference ownership map

## Safety boundary

- Run only after the relevant tranche is explicitly admitted.
- Ordinary diagnostic commands are bounded to 120 seconds.
- Commands are Linux/WSL compatible, repository-local where possible, and return control to the invoking shell.
- No command starts a current autonomous controller, deploys, migrates a persistent database, controls an unrelated service, exposes a secret in argv, or accesses `betting-win`.
- Disposable or managed environment actions are explicitly operator-run and are not executed by this documentation task.

## Procedure

1. Inspect backup, dump, and manifest bytes and bind one snapshot identity.
2. Verify the previous accepted backup remains until atomic commit.
3. Restore only into the disposable target and revalidate target/ledger before migration.
4. Verify restored semantics, restart convergence, and recoverable orphan cleanup.
5. Run retention planning and apply only under a fenced disposable proof; preserve all accepted references.

## Bounded diagnostic example

```bash
(
  set -Eeuo pipefail
  backup="${BWS_BACKUP_FILE:?BWS_BACKUP_FILE is required}"
  manifest="${BWS_BACKUP_MANIFEST:?BWS_BACKUP_MANIFEST is required}"
  test -f "$backup" && test ! -L "$backup"
  test -f "$manifest" && test ! -L "$manifest"
  timeout 120s sha256sum "$backup" "$manifest"
  timeout 120s stat -c 'mode=%a size=%s path=%n' "$backup" "$manifest"
)
```


## External/managed action boundary

Restore, retention apply, and cleanup are operator-run only against the explicitly confirmed disposable target.

## Receipt output

Record the exact consumed source/config/process/test/environment generations, command or operator action identity, start/end clocks, result, evidence digests, cleanup result, unresolved blockers, retained holds, owner/reviewer, and parent/previous receipt digests. A listed but unexecuted procedure is not proof.
