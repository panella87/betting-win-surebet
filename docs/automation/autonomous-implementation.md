# Autonomous implementation rules: betting-win-surebet

## Active BWS-700 authority

The implementation controller is now selected for B1 offline falsification work. It must implement dependency-ready queue rows from `backlog/bws_b1_cross_venue_implementation.csv`, preserve `BWS-100` through `BWS-599`, keep `BWS-600` externally gated, and keep `BWS-900` parked. Real upstream B1 API intake remains blocked until `betting-win.b1_multi_venue_markets.v1` exists.


```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
parent_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-700
selected_controller=run-autonomous-implementation.sh
active_implementation_queue=backlog/bws_b1_cross_venue_implementation.csv
safe_local_terminal_gate=BWS-599
bws600_current_task=BWS-600
bws600_selected_controller=run-paper-autopilot.sh
```

`run-autonomous-implementation.sh` defaults to a 72-hour ceiling and is driven by repository docs, `docs/automation/current-implementation-task.md`, validated handoffs, and the active queue `backlog/bws_b1_cross_venue_implementation.csv`. The historical `backlog/bws_full_implementation.csv` and `backlog/bws_remaining_safe_local_map.csv` stay as carry-forward context. There is no `--task` flag. A separate `--prompt-file` is not part of normal operator routing.

`BWS-100` through `BWS-589` are validated carry-forward foundations inside the wider complete safe-local program through `BWS-599`.

The safe-local implementation queue is complete through `BWS-599`. The active dependency-ready implementation work is now the BWS-700 B1 queue opened by `docs/automation/current-implementation-task.md`. Use this controller for that queue and for future reviewed source-fix handoffs; do not reopen the completed safe-local queue.

```text
BWS-100..BWS-580  platform foundation through integrated bounded runtime (validated)
BWS-581..BWS-589  long-running services, lifecycle, evidence and paper automation (validated)
BWS-590..BWS-593  release, recovery, soak and external preflight (validated)
BWS-599           final clean-room acceptance (validated)
BWS-600           external runtime evidence, selected parent run-paper-autopilot.sh
BWS-900           separately authorized execution
```

Forbidden work includes direct provider clients/URLs/credentials, betting-win `core.*` writes, modifying the betting-win checkout, execution paths, public signals and profitability claims.

For the active BWS-700 implementation queue, use `CONTINUE_REQUIRED=yes` while dependency-ready B1 work remains and `AUTONOMOUS_GOAL_COMPLETE=yes` only when the authorized queue is validated or truthfully blocked. Do not use a no-op goal-complete result to bypass B1 backlog work or a source-fix handoff.

Canonical standalone campaign settings include:

```text
--duration 72h
--max-cycles 200
--cycle-timeout 6h
--validation-timeout 45m
--model cli-default
--fallback-model none
```

## Protected automation policy

Task-file automation maintenance is disabled for the current state.

```text
automation_maintenance_allowed=no
allowed_protected_files=none
```

Do not set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`. Missing or disabled authorization must fail closed, and no autonomous cycle may broaden it.

The check-only must fail contract remains binding. Standalone implementation sends its final Telegram result. A parent suppresses the child notification and sends the final campaign notification.
