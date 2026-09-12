
# Managed long-soak proof

## Scope

T35 before T36.

## Prerequisites

- accepted managed runner
- fault-specific adapters
- owned resource inventory
- restart-safe checkpoint
- operator-approved duration and target

## Safety boundary

- Run only after the relevant tranche is explicitly admitted.
- Ordinary diagnostic commands are bounded to 120 seconds.
- Commands are Linux/WSL compatible, repository-local where possible, and return control to the invoking shell.
- No command starts a current autonomous controller, deploys, migrates a persistent database, controls an unrelated service, exposes a secret in argv, or accesses `betting-win`.
- Disposable or managed environment actions are explicitly operator-run and are not executed by this documentation task.

## Procedure

1. Record immutable runner, target, source/config/process generations, duration, thresholds, and fault matrix.
2. Run each distinct fault through the production path; no synthetic or shortened pass substitutes.
3. Persist cumulative progress/checkpoints and prove resume does not reset history.
4. Measure readiness, progress, resources, cleanup, and all terminal conditions.
5. Issue the environment receipt only after the operator-run duration completes and all evidence is retained.

## Bounded diagnostic example

```bash
(
  set -Eeuo pipefail
  plan="${BWS_SOAK_PLAN:?BWS_SOAK_PLAN is required}"
  test -f "$plan" && test ! -L "$plan"
  timeout 120s sha256sum "$plan"
  timeout 120s python3 -c 'import json,pathlib,sys; o=json.loads(pathlib.Path(sys.argv[1]).read_text()); [(_ for _ in ()).throw(AssertionError(k)) for k in ("duration","target","faults","thresholds","source_generation_id") if k not in o]; print("SOAK_PLAN_STATIC_VALIDATION_ONLY")' "$plan"
)
```


## External/managed action boundary

The long-duration soak is operator-run and is not started, shortened, simulated, or declared passed by this documentation task.

## Receipt output

Record the exact consumed source/config/process/test/environment generations, command or operator action identity, start/end clocks, result, evidence digests, cleanup result, unresolved blockers, retained holds, owner/reviewer, and parent/previous receipt digests. A listed but unexecuted procedure is not proof.
