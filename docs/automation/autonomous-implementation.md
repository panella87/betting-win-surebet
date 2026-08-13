# Autonomous implementation rules: betting-win-surebet

## Completed BWS-700 authority and future implementation use

The implementation controller is not currently selected. Dependency-ready B1 work is complete through BWS-820, the broad bugfix campaign is accepted, BWS-600 remains externally gated, and BWS-900 remains parked. Use this controller only for a future reviewed source handoff or after BWS-710 is unblocked by an accepted `betting-win.b1_multi_venue_markets.v1` contract.


```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
parent_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-600
selected_controller=run-paper-autopilot.sh
active_implementation_queue=none
completed_b1_queue=backlog/bws_b1_cross_venue_implementation.csv
completed_b1_map=backlog/bws_b1_cross_venue_map.csv
bws700_completion_status=DEPENDENCY_READY_LOCAL_IMPLEMENTATION_COMPLETE
b1_dependency_ready_local_rows=VALIDATED_THROUGH_BWS-820
bws710_status=BLOCKED_ACCEPTED_BETTING_WIN_B1_MULTI_VENUE_API_REQUIRED
safe_local_terminal_gate=BWS-599
bws600_current_task=BWS-600
bws600_selected_controller=run-paper-autopilot.sh
```

`run-autonomous-implementation.sh` defaults to a 72-hour ceiling and is driven by repository docs, `docs/automation/current-implementation-task.md`, validated handoffs, and the active queue `backlog/bws_b1_cross_venue_implementation.csv`. The historical `backlog/bws_full_implementation.csv` and `backlog/bws_remaining_safe_local_map.csv` stay as carry-forward context. There is no `--task` flag. A separate `--prompt-file` is not part of normal operator routing.

`BWS-100` through `BWS-589` are validated carry-forward foundations inside the wider complete safe-local program through `BWS-599`.

The safe-local implementation queue is complete through `BWS-599`, and the BWS-700 dependency-ready local queue is validated through `BWS-820`. Use this controller only for future reviewed source-fix handoffs or unblocked BWS-710 intake; do not reopen the completed safe-local or BWS-700 dependency-ready queues.

```text
BWS-100..BWS-580  platform foundation through integrated bounded runtime (validated)
BWS-581..BWS-589  long-running services, lifecycle, evidence and paper automation (validated)
BWS-590..BWS-593  release, recovery, soak and external preflight (validated)
BWS-599           final clean-room acceptance (validated)
BWS-600           external runtime evidence, selected parent run-paper-autopilot.sh
BWS-900           separately authorized execution
```

Forbidden work includes direct provider clients/URLs/credentials, betting-win `core.*` writes, modifying the betting-win checkout, execution paths, public signals and profitability claims.

For any future implementation queue, use `CONTINUE_REQUIRED=yes` while dependency-ready work remains and `AUTONOMOUS_GOAL_COMPLETE=yes` only when the authorized queue is validated or truthfully blocked. The current BWS-700 dependency-ready local queue is already validated through BWS-820.

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

## Controller-managed source-manifest refresh

A bounded implementation handoff may name only the product and test files needed for a source fix. `CHANGELOG.md` remains an operator/reviewer concern unless the task names it, but `SOURCE_MANIFEST.json` is repository validation metadata and must never remain stale after a source-changing cycle.

The implementation controller therefore:

```text
1. captures the cycle source fingerprint before Codex;
2. enforces the exact protected-file policy after Codex;
3. when the source fingerprint changed, runs scripts/regenerate_source_manifest.py;
4. immediately runs scripts/validate_source_manifest.py;
5. captures the cycle diff and starts controller-managed validation only after reconciliation passes.
```

A failed manifest refresh blocks the cycle. The controller does not use this mechanism to authorize unrelated files, hide validation failures, or weaken the bugfix parent's mandatory same-area re-audit.
