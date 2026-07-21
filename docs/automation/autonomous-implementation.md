# Autonomous implementation rules: betting-win-surebet

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-600
safe_local_terminal_gate=BWS-599
selected_controller=run-paper-autopilot.sh
```

`run-autonomous-implementation.sh` defaults to a 72-hour ceiling and is driven by repository docs, `docs/automation/current-implementation-task.md`, validated handoffs, `backlog/bws_full_implementation.csv`, and `backlog/bws_remaining_safe_local_map.csv`. There is no `--task` flag. A separate `--prompt-file` is not part of normal operator routing.

`BWS-100` through `BWS-589` are validated carry-forward foundations inside the wider complete safe-local program through `BWS-599`.

The safe-local implementation queue is complete through `BWS-599`. No dependency-ready safe-local `PENDING` row remains. Use this controller only for a future reviewed source-fix handoff, an explicitly reopened validated queue row, or a standalone task authorized by current repo evidence.

```text
BWS-100..BWS-580  platform foundation through integrated bounded runtime (validated)
BWS-581..BWS-589  long-running services, lifecycle, evidence and paper automation (validated)
BWS-590..BWS-593  release, recovery, soak and external preflight (validated)
BWS-599           final clean-room acceptance (validated)
BWS-600           external runtime evidence, selected parent run-paper-autopilot.sh
BWS-900           separately authorized execution
```

Forbidden work includes direct provider clients/URLs/credentials, betting-win `core.*` writes, modifying the betting-win checkout, execution paths, public signals and profitability claims.

If a future implementation queue is active, use `CONTINUE_REQUIRED=yes` while dependency-ready work remains and `AUTONOMOUS_GOAL_COMPLETE=yes` only when the authorized queue is validated. Do not use a no-op goal-complete result to bypass a source-fix handoff.

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
