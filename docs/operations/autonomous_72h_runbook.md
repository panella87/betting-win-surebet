# Autonomous 72-hour implementation runbook

## Current and carry-forward implementation campaign

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
parent_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
controller=run-autonomous-implementation.sh
current_task=BWS-600
active_implementation_queue=none
completed_b1_queue=backlog/bws_b1_cross_venue_implementation.csv
completed_b1_map=backlog/bws_b1_cross_venue_map.csv
bws700_completion_status=DEPENDENCY_READY_LOCAL_IMPLEMENTATION_COMPLETE
b1_dependency_ready_local_rows=VALIDATED_THROUGH_BWS-820
bws710_status=BLOCKED_ACCEPTED_BETTING_WIN_B1_MULTI_VENUE_API_REQUIRED
safe_local_terminal_gate=BWS-599
canonical_duration=72h
max_cycles=200
cycle_timeout=6h
validation_timeout=45m
```

This runbook is now carry-forward for future reviewed implementation/source-fix handoffs. The BWS-700 dependency-ready local queue is complete through BWS-820, BWS-710 remains externally blocked, and the selected controller has returned to the BWS-600 `run-paper-autopilot.sh` runtime-evidence parent after upstream API readiness.

Launch from `~/app_testing/betting-win-surebet` under Node 20. Point `BETTING_WIN_REPO_PATH` to the existing read-only checkout when a task requires upstream-lock proof. Do not clone, reset or clean betting-win.

The protected integration phase is complete. Do not set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`; the active task authorizes no protected automation changes.

The six-hour cycle ceiling supports the required two-hour `BWS-592` soak with setup, recovery and cleanup. It remains a ceiling, not a minimum for release or recovery tasks.

Bounded repo-owned loopback child processes may be used only by task-required tests and must be uniquely identified, attached and cleaned up. Pre-existing services and sessions are never mutated.

Inspect `continue_status.txt`, final summaries, validation evidence and the binding CSV. Use owning-controller `--force-unlock` only when fresh evidence proves an abandoned or blocking lock.
