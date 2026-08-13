# 013 - Autonomous controller status contract

Each implementation cycle writes exactly one non-empty `continue_status.txt` line:

```text
AUTONOMOUS_GOAL_COMPLETE=yes
CONTINUE_REQUIRED=yes
BLOCKED=yes
```

Malformed, missing, combined, or unknown values fail closed.

`request_flags.txt` remains a strict two-line contract:

```text
SERVICE_REFRESH_REQUIRED=no
RUNTIME_EVIDENCE_REQUIRED=no
```

Required reports must be present and non-placeholder. Codex nonzero exit, timeout, or failed post-cycle `npm run validate` blocks status acceptance.

For a task that explicitly opens an implementation queue, use `CONTINUE_REQUIRED=yes` while another dependency-ready safe task remains. Use `AUTONOMOUS_GOAL_COMPLETE=yes` only when that authorized queue is validated or truthfully blocked. Historical SURE completion is not an active stop condition.

The current repository task opens no implementation queue: `BWS-100` through `BWS-599` and dependency-ready BWS-700 rows through `BWS-820` are complete, and `run-paper-autopilot.sh` is selected for the externally gated `BWS-600` runtime-evidence phase. This status contract is carry-forward implementation behavior, not current routing authority.
