# Autonomous implementation rules: betting-win-surebet

`run-autonomous-implementation.sh` is selected for `BWS_FULL_PLATFORM_IMPLEMENTATION_V1`.

Authority comes from `docs/automation/current-implementation-task.md` and `backlog/bws_full_implementation.csv`. There is no `--task` flag. A separate `--prompt-file` is unnecessary.

The current first task is `BWS-581`. The controller must continue through the first dependency-ready `PENDING` rows until `BWS-599` is validated, the scheduling budget or cycle ceiling is reached, or a concrete blocker is proven.

Historical SURE-001/SURE-002A/SURE-002B files are bootstrap ledgers only. `BWS-100` through `BWS-580` are validated carry-forward foundations, not authorization for a no-op goal-complete result.

Allowed work includes continuous loopback services, scheduler/worker loops, cockpit serving, full-stack lifecycle, database backup/restore/retention, logs/metrics/diagnostics, release and recovery tooling, root wrapper integration, paper-controller integration, soak acceptance and external-runtime preflight.

The binding sequence includes `BWS-581` continuous convergence, `BWS-587` root wrapper integration, `BWS-589` paper autopilot lifecycle, and terminal local acceptance at `BWS-599`.

Forbidden work includes direct provider clients/URLs/credentials, betting-win `core.*` writes, modifying the betting-win checkout, execution paths, public signals and profitability claims.

Use `CONTINUE_REQUIRED=yes` until every safe row through `BWS-599` is validated. Use `AUTONOMOUS_GOAL_COMPLETE=yes` only after `BWS-599` is validated. `BWS-600` may remain blocked and `BWS-900` parked.

Canonical flags include:

```text
--model cli-default
--fallback-model none
--cycle-timeout 2h
--validation-timeout 20m
--max-cycles 200
```

## Exact task-file protected authorization

The controller supports task-file automation maintenance only when all conditions hold:

1. `AUTOMATION_ALLOW_PROTECTED_CHANGES=1` is set.
2. The task file contains `automation_maintenance_allowed=yes`.
3. The task file contains one exact `allowed_protected_files=...` list.
4. Every changed protected file is in that list.

Missing, duplicate, malformed, broadened or out-of-list authorization fails closed. This is not a blanket override.

The check-only must fail contract remains binding. Standalone implementation sends its final Telegram result. A parent suppresses the child notification and sends the final campaign notification.
