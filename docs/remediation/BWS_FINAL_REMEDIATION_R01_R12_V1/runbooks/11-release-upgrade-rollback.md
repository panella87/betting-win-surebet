
# Release/upgrade/rollback proof

## Scope

T33, T34, T36 and release/deployment hold decisions.

## Prerequisites

- accepted source/config/process/evidence generations
- immutable release plan
- exclusive upgrade owner
- verified rollback checkpoint

## Safety boundary

- Run only after the relevant tranche is explicitly admitted.
- Ordinary diagnostic commands are bounded to 120 seconds.
- Commands are Linux/WSL compatible, repository-local where possible, and return control to the invoking shell.
- No command starts a current autonomous controller, deploys, migrates a persistent database, controls an unrelated service, exposes a secret in argv, or accesses `betting-win`.
- Disposable or managed environment actions are explicitly operator-run and are not executed by this documentation task.

## Procedure

1. Independently inspect archive/member set and runtime compatibility.
2. Recompute the plan immediately before apply in the disposable target.
3. Bind every input, target, checkpoint byte set, and lifecycle owner.
4. Prove a partial target is fenced before prior target restart.
5. Prove rollback restores the exact accepted predecessor and retain release/deployment holds absent separate decisions.

## Bounded diagnostic example

```bash
(
  set -Eeuo pipefail
  archive="${BWS_RELEASE_ARCHIVE:?BWS_RELEASE_ARCHIVE is required}"
  test -f "$archive" && test ! -L "$archive"
  timeout 120s sha256sum "$archive"
  timeout 120s python3 -c 'import pathlib,sys,zipfile; p=pathlib.Path(sys.argv[1]); z=zipfile.ZipFile(p); n=z.namelist(); assert len(n)==len(set(n)); assert all(not x.startswith("/") and ".." not in pathlib.PurePosixPath(x).parts for x in n); print("members="+str(len(n)))' "$archive"
)
```


## External/managed action boundary

No release apply, deployment, upgrade, or rollback action is executed by this documentation task or diagnostic command.

## Receipt output

Record the exact consumed source/config/process/test/environment generations, command or operator action identity, start/end clocks, result, evidence digests, cleanup result, unresolved blockers, retained holds, owner/reviewer, and parent/previous receipt digests. A listed but unexecuted procedure is not proof.
