# 034 - Remaining operator runtime implementation program

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-581
safe_local_terminal_gate=BWS-599
external_runtime_gate=BWS-600
execution_gate=BWS-900
```

## Why the program continues

`BWS-580` validated a substantial closed-stack test surface, bounded convergence passes, an API-only lifecycle owner and a machine-readable runtime handoff. It did not finish the operator-runnable application.

The current source still has these concrete local gaps:

```text
upstream convergence commands=one bounded pass
scheduler command=one bounded pass
worker command=one bounded pass
product lifecycle=read-only API process only
cockpit=buildable but not served by the managed runtime
start.sh=install_and_validate_only
stop.sh=no_long_running_service
check/watch/open_log=automation artifacts only
paper evaluation=single_pass_no_service
paper autopilot=paper_service_lifecycle=none
database retention/backup/restore=not implemented as product commands
release/upgrade/recovery/soak acceptance=not implemented
```

These are source and automation implementation gaps. They are not external evidence blockers. `BWS-600` remains external only after the local queue through `BWS-599` is validated.

## Binding queue

The machine-readable authority is `backlog/bws_full_implementation.csv`. Select the first `PENDING` row whose internal dependencies are `VALIDATED`.

### Runtime service construction

- `BWS-581`: real long-running explicit-mode upstream convergence service.
- `BWS-582`: long-running scheduler and worker loops with lease, backpressure and graceful-drain semantics.
- `BWS-583`: loopback cockpit serving and full typed API/UI convergence.
- `BWS-584`: complete product-owned lifecycle for API, convergence, scheduler, worker and cockpit processes.

### Operations and evidence

- `BWS-585`: database migration status, retention, backup and disposable restore verification.
- `BWS-586`: structured logs, metrics, diagnostics, evidence index and bounded retention.
- `BWS-587`: exact protected root wrapper integration for lifecycle, status, progress and logs.

### Paper automation

- `BWS-588`: standalone service-owned continuous paper evaluation.
- `BWS-589`: paper autopilot lifecycle and runtime handoff integration.

### Release and resilience

- `BWS-590`: reproducible release/deployment packaging and user-service templates.
- `BWS-591`: upgrade, rollback and disaster-recovery proof.
- `BWS-592`: bounded long-running soak and failure-injection acceptance.
- `BWS-593`: accepted-runtime preflight and `BWS-600` campaign manifest.
- `BWS-599`: integrated operator/runtime/automation/recovery acceptance.

## Continuation contract

```text
CONTINUE_REQUIRED=yes
  while any dependency-ready row through BWS-599 is PENDING

AUTONOMOUS_GOAL_COMPLETE=yes
  only after BWS-581 through BWS-599 are VALIDATED

BLOCKED=yes
  only for a concrete unrecoverable repository state or exact missing external evidence
```

A short cycle is not a campaign completion. Completing one bounded slice must advance to the next dependency-ready row while time and cycle budget remain.

## Safety boundary

```text
betting_win_checkout=read_only
provider_connections=prohibited
provider_credentials=prohibited
direct_betting_win_core_writes=prohibited
execution=prohibited
public_signals=prohibited
profitability_claims=prohibited
automatic_upstream_mode_fallback=prohibited
floating_point_money=prohibited
pre_existing_service_mutation=prohibited
```

Bounded repo-owned test child processes are allowed when required for lifecycle or recovery proof. They must be uniquely identified, loopback-only, cleaned up by the test that created them and must never replace, detach, stop or kill an unrelated session or service.
