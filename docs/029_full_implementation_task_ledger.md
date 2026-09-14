# 029 - Full implementation task ledger

> **Completed historical authority.** This document preserves the implementation selection and acceptance rules that closed BWS-100 through BWS-599. It is non-routing. Current authority is the activated R01-R12 remediation package, with T39 admitted and all existing root controllers prohibited until S2 is accepted.

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
historical_ledger_status=VALIDATED_COMPLETE
safe_local_terminal_gate=BWS-599
external_runtime_gate=BWS-600
```

Binding historical machine-readable ledger: `backlog/bws_full_implementation.csv`.

Supporting historical subtask map: `backlog/bws_remaining_safe_local_map.csv`.

## Historical selection rule

The completed controller selected the first row whose status was `PENDING` and whose internal task dependencies were all `VALIDATED`. External dependency tokens were never satisfied without explicit retained evidence.

Within a selected row, the supporting map defined the largest safe cohesive tranche. The map could not change parent task order, dependencies, or validation status.

## Historical update rule

A row became `VALIDATED` only when implementation existed, focused success and failure proof passed, stateful restart, idempotency, cleanup, and recovery proof passed where applicable, `npm run validate` passed, evidence and status were updated, and no ownership or safety boundary was weakened.

A row became `BLOCKED` only after all safe local work in that row was exhausted and exact external evidence was named. `PARKED` required an explicit policy decision.

## Final historical selection

```text
current_task=BWS-599
current_task_status=VALIDATED
reason=BWS-599 final clean-room acceptance is validated; no dependency-ready safe local gap remains before the external BWS-600 gate
```

The `current_task=BWS-599` marker above is the final state of this closed historical ledger, not the current repository task.

## Completed sequence and external gates

```text
BWS-591           release upgrade, rollback and recovery (validated)
BWS-592           multi-hour soak and failure injection (validated)
BWS-593           external runtime preflight and campaign manifest (validated)
BWS-599           integrated clean-room final local acceptance (validated)
BWS-600           external accepted-runtime evidence (current blocked gate)
BWS-900           parked execution
```

## Protected task-file authorization

The historical `BWS-587` through `BWS-589` integration required an exact reviewed protected subset, including `run-autonomous-implementation.sh` for runtime-evidence return handoffs. That phase is closed.

The current protected state is:

```text
automation_maintenance_allowed=no
allowed_protected_files=none
```

Any future protected automation change requires a new external overlay that first updates the binding task source. This historical ledger cannot authorize it.
