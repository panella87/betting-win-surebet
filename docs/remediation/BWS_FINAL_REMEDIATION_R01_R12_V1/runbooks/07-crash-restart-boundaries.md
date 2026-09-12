
# Crash/restart boundary testing

## Scope

T03, T05, T10-T17, T21, T23-T24, T27, T31-T35, T45-T47.

## Prerequisites

- disposable process/database/filesystem harness
- accepted pre-crash checkpoint contract
- owned child/process inventory

## Safety boundary

- Run only after the relevant tranche is explicitly admitted.
- Ordinary diagnostic commands are bounded to 120 seconds.
- Commands are Linux/WSL compatible, repository-local where possible, and return control to the invoking shell.
- No command starts a current autonomous controller, deploys, migrates a persistent database, controls an unrelated service, exposes a secret in argv, or accesses `betting-win`.
- Disposable or managed environment actions are explicitly operator-run and are not executed by this documentation task.

## Procedure

1. Capture a stable pre-crash generation and all durable checkpoints.
2. Inject one specifically owned failure boundary at a time.
3. Restart through the production entrypoint with the same immutable parents.
4. Prove convergence, no late writes, no duplicate side effects, correct fencing, and cumulative history.
5. Record cleanup and unresolved ambiguity as BLOCKED.

## Bounded diagnostic example

```bash
(
  set -Eeuo pipefail
  test "${BWS_DISPOSABLE_CRASH_HARNESS_CONFIRMED:-no}" = "yes"
  checkpoint="${BWS_CHECKPOINT_FILE:?BWS_CHECKPOINT_FILE is required}"
  test -f "$checkpoint" && test ! -L "$checkpoint"
  timeout 120s sha256sum "$checkpoint"
  timeout 120s python3 -c 'import json,os,pathlib; p=pathlib.Path(os.environ["BWS_CHECKPOINT_FILE"]); o=json.loads(p.read_text()); print({"checkpoint_keys":sorted(o),"bytes":p.stat().st_size})'
)
```


## External/managed action boundary

Failure injection and restart are operator-run in the disposable harness only; no broad process-kill command is prescribed.

## Receipt output

Record the exact consumed source/config/process/test/environment generations, command or operator action identity, start/end clocks, result, evidence digests, cleanup result, unresolved blockers, retained holds, owner/reviewer, and parent/previous receipt digests. A listed but unexecuted procedure is not proof.
