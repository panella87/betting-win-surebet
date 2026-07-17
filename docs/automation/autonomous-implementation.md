# Autonomous implementation rules: betting-win-surebet

`run-autonomous-implementation.sh` is selected for `BWS_FULL_PLATFORM_IMPLEMENTATION_V1`.

Authority comes from `docs/automation/current-implementation-task.md`, `backlog/bws_full_implementation.csv` and the supporting `backlog/bws_remaining_safe_local_map.csv`. There is no `--task` flag. A separate `--prompt-file` is unnecessary.

The final safe local task was `BWS-599`. It is now validated, so no dependency-ready safe local `PENDING` row remains.

`BWS-100` through `BWS-589` are validated carry-forward foundations, and `BWS-590` adds deterministic release packaging on top of them. These are not authorization for a no-op goal-complete result.

The previously preferred `BWS-592 -> BWS-593` tranche is now validated. The remaining safe sequence is:

```text
BWS-599             final clean-room acceptance (validated)
```

Allowed work includes deterministic release packaging, platform and private configuration preflight, user-service templates, non-mutating install verification, exact-version upgrade/rollback/recovery, multi-hour loopback soak, bounded failure injection, external campaign-manifest generation and final integrated acceptance.

Forbidden work includes direct provider clients/URLs/credentials, betting-win `core.*` writes, modifying the betting-win checkout, execution paths, public signals and profitability claims.

Use `CONTINUE_REQUIRED=yes` until every safe row through `BWS-599` is validated. Use `AUTONOMOUS_GOAL_COMPLETE=yes` only after `BWS-599` is validated. `BWS-600` may remain blocked and `BWS-900` parked.

Canonical campaign settings include:

```text
--duration 72h
--max-cycles 200
--cycle-timeout 6h
--validation-timeout 45m
--model cli-default
--fallback-model none
```

The longer cycle timeout allows the required `BWS-592` two-hour soak proof plus setup, recovery and cleanup. Shorter tasks may complete earlier and must advance to the next ready row.

## Protected automation policy

Task-file automation maintenance is disabled for the active queue.

The protected integration phase is complete. The active task source sets:

```text
automation_maintenance_allowed=no
allowed_protected_files=none
```

Do not set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`. Missing or disabled authorization must fail closed, and no autonomous cycle may broaden it.

The check-only must fail contract remains binding. Standalone implementation sends its final Telegram result. A parent suppresses the child notification and sends the final campaign notification.
