# 029 - Full implementation task ledger

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
safe_local_terminal_gate=BWS-510
```

Binding machine-readable ledger: `backlog/bws_full_implementation.csv`.

## Selection rule

Select the first row whose status is `PENDING` and whose internal task dependencies are all `VALIDATED`. External dependency tokens are not satisfied without explicit evidence.

## Update rule

A row becomes `VALIDATED` only when implementation exists, focused success/failure proof passes, stateful restart/idempotency/cleanup proof passes where applicable, `npm run validate` passes, evidence/status is updated, and no ownership or safety boundary is weakened.

A row becomes `BLOCKED` only after all safe local work in that row is exhausted and exact external evidence is named. `PARKED` requires an explicit policy decision.

## Current selection

```text
current_task=BWS-510
current_task_status=PENDING
reason=BWS-500 configuration, security, observability, and process definitions are validated; BWS-510 is now the first dependency-ready PENDING row
```
