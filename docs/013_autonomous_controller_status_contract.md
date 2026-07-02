# 013 — Autonomous controller status contract

This document records the post-wave audit finding from the SURE-001 hardening loop.

The controller must treat `continue_status.txt` as a strict machine contract. A cycle may write exactly one non-empty line and that line must be one of:

```text
AUTONOMOUS_GOAL_COMPLETE=yes
CONTINUE_REQUIRED=yes
BLOCKED=yes
```

A combined line such as `AUTONOMOUS_GOAL_COMPLETE=yes CONTINUE_REQUIRED=yes BLOCKED=yes`, an empty file, a missing file, or any unknown value is invalid and must stop the controller with `BLOCKED=yes`.

The controller must also treat `request_flags.txt` as a strict machine contract. A cycle may write exactly two lines and they must be:

```text
SERVICE_REFRESH_REQUIRED=no
RUNTIME_EVIDENCE_REQUIRED=no
```

Any missing file, extra line, reordered value, or unknown request flag is invalid and must stop the controller with `BLOCKED=yes` before any `continue_status.txt` value can be accepted.

The controller must also treat required cycle reports as audit evidence, not optional decoration. Missing, placeholder, or empty required report files are invalid and must stop the controller with `BLOCKED=yes` before any `request_flags.txt` or `continue_status.txt` value can be accepted. `git_diff.patch` may be empty only when there is genuinely no source diff.

The controller must also fail closed when the Codex process exits nonzero. It must not continue merely because repo validation still passes after a failed or timed-out cycle.

The post-cycle `npm run validate` gate must pass before any cycle status can be accepted, including `AUTONOMOUS_GOAL_COMPLETE=yes`.

This is SURE-001 controller hardening only. It does not authorize SURE-002, provider integration, execution paths, solver implementation, or direct `betting-win` database access.
