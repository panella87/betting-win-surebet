# 029 - Full implementation task ledger

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
safe_local_terminal_gate=BWS-599
external_runtime_gate=BWS-600
```

Binding machine-readable ledger: `backlog/bws_full_implementation.csv`.

Supporting subtask map: `backlog/bws_remaining_safe_local_map.csv`.

## Selection rule

Select the first row whose status is `PENDING` and whose internal task dependencies are all `VALIDATED`. External dependency tokens are not satisfied without explicit retained evidence.

Within a selected row, use the supporting map to implement the largest safe cohesive tranche. The supporting map cannot change parent task order, dependencies or validation status.

## Update rule

A row becomes `VALIDATED` only when implementation exists, focused success/failure proof passes, stateful restart/idempotency/cleanup/recovery proof passes where applicable, `npm run validate` passes, evidence/status is updated and no ownership or safety boundary is weakened.

A row becomes `BLOCKED` only after all safe local work in that row is exhausted and exact external evidence is named. `PARKED` requires an explicit policy decision.

## Current selection

```text
current_task=BWS-590
current_task_status=PENDING
reason=BWS-589 runtime-evidence paper autopilot is validated and reproducible release packaging is the next dependency-ready local gap
```

## Remaining sequence

```text
BWS-590..BWS-591  release, deployment, upgrade, rollback and recovery
BWS-592..BWS-593  multi-hour soak, failure injection and external preflight
BWS-599           integrated clean-room final local acceptance
BWS-600           external accepted-runtime evidence
BWS-900           parked execution
```

## Protected task-file authorization

The historical `BWS-587` through `BWS-589` integration required an exact reviewed protected subset, including `run-autonomous-implementation.sh` for runtime-evidence return handoffs. That phase is closed.

The active task contains:

```text
automation_maintenance_allowed=no
allowed_protected_files=none
```

The implementation controller must block any protected automation change during `BWS-590` through `BWS-599` unless a new external overlay first updates the binding task source.
