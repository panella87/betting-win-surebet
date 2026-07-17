# Autonomous 72-hour implementation runbook

## Completed safe-local campaign

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
controller=run-autonomous-implementation.sh
current_task=BWS-599_VALIDATED
safe_local_terminal_gate=BWS-599
canonical_duration=72h
max_cycles=200
cycle_timeout=6h
validation_timeout=45m
```

This campaign is retained as the completed BWS-599 implementation runbook. No dependency-ready safe-local `PENDING` row remains; the selected controller is now `run-paper-autopilot.sh` for BWS-600.

Launch from `~/app_testing/betting-win-surebet` under Node 20. Point `BETTING_WIN_REPO_PATH` to the existing read-only checkout. Do not clone, reset or clean betting-win.

The protected integration phase is complete. Do not set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`; the active task authorizes no protected automation changes.

The six-hour cycle ceiling supports the required two-hour `BWS-592` soak with setup, recovery and cleanup. It remains a ceiling, not a minimum for release or recovery tasks.

Bounded repo-owned loopback child processes may be used only by task-required tests and must be uniquely identified, attached and cleaned up. Pre-existing services and sessions are never mutated.

Inspect `continue_status.txt`, final summaries, validation evidence and the binding CSV. Use owning-controller `--force-unlock` only when fresh evidence proves an abandoned or blocking lock.
