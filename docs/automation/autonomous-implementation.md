# Autonomous implementation rules: betting-win-surebet

## Current use

`run-autonomous-implementation.sh` is prohibited as a remediation driver before the complete S2 gate is accepted. After S2, the active remediation launcher may invoke it for exactly one admitted tranche at a time using the immutable task file and exact protected-file policy.

```text
active_program=BWS_FINAL_REMEDIATION_R01_R12_V1
pre_s2_controller_use=prohibited
post_s2_controller=run-autonomous-implementation.sh
one_admitted_tranche_per_invocation=yes
```

The controller default remains 72 hours. The active launcher may repeat a 72-hour attempt only while the same tranche remains admitted, the controller returns the documented continuation code, and the global 28-day window remains.

Canonical options used by the active launcher are:

```text
--model cli-default
--fallback-model none
--cycle-timeout 2h
--validation-timeout 20m
--max-cycles 200
--prompt-file <exact immutable tranche task>
```

There is no `--task` option. Outside the active launcher, normal implementation authority comes from repository current-task documents or a validated handoff. `--handover-paper-mode` and `--handover-bugfix-audit` are for exact direct handoffs only.

## Completion and failure

Each cycle must preserve exact source ownership and emit an unambiguous terminal result. `check-only must fail` when prerequisites are unavailable. `AUTONOMOUS_GOAL_COMPLETE=yes` is accepted only after source, focused validation, repository validation, and required receipts pass. Unknown states, source drift, invalid task authority, or validation failure block the run.

## Protected automation policy

Protected paths are immutable during ordinary cycles. Exact task-file authorization is required for any exception. `AUTOMATION_ALLOW_PROTECTED_CHANGES=1` without a matching exact task allowlist is rejected.

## Retained ledger references

`backlog/bws_full_implementation.csv` and `backlog/bws_remaining_safe_local_map.csv` preserve completed platform traceability. BWS-100` through `BWS-589` are validated carry-forward foundations, with BWS-590 and BWS-599 retained as completed gates.

## Historical full-platform continuity

The completed platform program `BWS_FULL_PLATFORM_IMPLEMENTATION_V1` retains validated behavior through `BWS-590` and `BWS-599`. Its CSV ledgers are historical traceability, not the current queue.

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
current_task=BWS-600
selected_controller=run-paper-autopilot.sh
active_implementation_queue=none
bws600_current_task=BWS-600
bws600_selected_controller=run-paper-autopilot.sh
```

That block is validator-retained pre-remediation history. It must not override the active program above.
