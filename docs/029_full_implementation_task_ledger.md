# 029 - Full implementation task ledger

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
safe_local_terminal_gate=BWS-599
external_runtime_gate=BWS-600
```

Binding machine-readable ledger: `backlog/bws_full_implementation.csv`.

## Selection rule

Select the first row whose status is `PENDING` and whose internal task dependencies are all `VALIDATED`. External dependency tokens are not satisfied without explicit retained evidence.

## Update rule

A row becomes `VALIDATED` only when implementation exists, focused success/failure proof passes, stateful restart/idempotency/cleanup/recovery proof passes where applicable, `npm run validate` passes, evidence/status is updated and no ownership or safety boundary is weakened.

A row becomes `BLOCKED` only after all safe local work in that row is exhausted and exact external evidence is named. `PARKED` requires an explicit policy decision.

## Current selection

```text
current_task=BWS-590
current_task_status=PENDING
reason=the repository now has validated runtime-evidence paper autopilot lifecycle ownership, and release/deployment packaging is the next dependency-ready local gap
```

## Remaining sequence

```text
BWS-581..BWS-584  continuous service and lifecycle
BWS-586           observability and evidence operations (validated)
BWS-587..BWS-589  protected wrapper and paper automation integration (validated)
BWS-590..BWS-593  release, recovery, soak and external preflight
BWS-599           final local acceptance
BWS-600           external accepted-runtime evidence
BWS-900           parked execution
```

## Protected task-file authorization

The active task includes:

```text
automation_maintenance_allowed=yes
allowed_protected_files=start.sh,stop.sh,check_progress.sh,watch_progress.sh,open_log.sh,run-paper-evaluation.sh,run-paper-autopilot.sh,automation.config.sh,.automation/lib/run_common.sh,docs/automation/PROTECTED_AUTOMATION_FILES.md
```

The implementation controller must reject any protected change outside this exact list.
