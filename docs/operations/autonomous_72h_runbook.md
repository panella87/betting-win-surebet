# Autonomous 72-hour implementation runbook

## Selected campaign

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
controller=run-autonomous-implementation.sh
current_task=BWS-590
safe_local_terminal_gate=BWS-599
canonical_duration=72h
max_cycles=200
cycle_timeout=2h
```

The controller starts with the first dependency-ready `PENDING` row and continues across validated cycles while safe local work remains. A cycle may complete quickly; the campaign must not declare goal complete while another dependency-ready task through `BWS-599` is pending.

Launch from `~/app_testing/betting-win-surebet` under Node 20. Point `BETTING_WIN_REPO_PATH` to the existing read-only checkout. Do not clone, reset or clean betting-win.

Set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1` for this campaign. The task file provides an exact protected allowlist for `BWS-587` through `BWS-589`; the controller rejects all other protected changes. Do not manually broaden the list.

Bounded repo-owned loopback child processes may be used only by task-required tests and must be uniquely identified, attached and cleaned up. Pre-existing services and sessions are never mutated.

Inspect `continue_status.txt`, final summaries, validation evidence and the binding CSV. Use owning-controller `--force-unlock` only when fresh evidence proves an abandoned or blocking lock.
