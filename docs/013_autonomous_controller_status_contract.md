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

For `BWS_FULL_PLATFORM_IMPLEMENTATION_V1`, use `CONTINUE_REQUIRED=yes` while a dependency-ready safe task through `BWS-599` remains. Use `AUTONOMOUS_GOAL_COMPLETE=yes` only when every safe local task is `VALIDATED`. Historical SURE completion is not an active stop condition.
