
# systemd and process-ownership proof

## Scope

T21-T25, T34-T35, and T44-T47 as mapped by the architecture.

## Prerequisites

- disposable user-session or isolated process harness
- exact admitted executable/process generation
- no control of unrelated services

## Safety boundary

- Run only after the relevant tranche is explicitly admitted.
- Ordinary diagnostic commands are bounded to 120 seconds.
- Commands are Linux/WSL compatible, repository-local where possible, and return control to the invoking shell.
- No command starts a current autonomous controller, deploys, migrates a persistent database, controls an unrelated service, exposes a secret in argv, or accesses `betting-win`.
- Disposable or managed environment actions are explicitly operator-run and are not executed by this documentation task.

## Procedure

1. Inspect unit definition and resolved executable without starting it.
2. Capture owner, PID, process group, cgroup, executable digest, environment-generation digest, and fencing epoch.
3. Prove every child is registered before side effects and terminality includes descendants.
4. Prove stale takeover requires child/process proof and monotonic fencing.
5. Record all observations without broad process termination.

## Bounded diagnostic example

```bash
(
  set -Eeuo pipefail
  unit="${BWS_PROOF_UNIT:?BWS_PROOF_UNIT is required}"
  timeout 120s systemctl --user show "$unit" --property=Id,LoadState,ActiveState,SubState,FragmentPath,ExecStart,MainPID,ControlGroup
  timeout 120s systemctl --user cat "$unit"
)
```


## External/managed action boundary

Starting, stopping, or restarting a proof unit is a separately authorized disposable-environment action and is not performed by this documentation package.

## Receipt output

Record the exact consumed source/config/process/test/environment generations, command or operator action identity, start/end clocks, result, evidence digests, cleanup result, unresolved blockers, retained holds, owner/reviewer, and parent/previous receipt digests. A listed but unexecuted procedure is not proof.
