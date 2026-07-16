# Current product routing

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-590
safe_local_terminal_gate=BWS-599
selected_controller=run-autonomous-implementation.sh
```

`BWS-100` through `BWS-589` are validated. The active queue now builds release/deployment tooling, recovery tooling, soak proof and final local acceptance through `BWS-599`.

# `.automation/`

Repo-local controller support for `betting-win-surebet`.

Active shared helpers:

```text
.automation/lib/run_common.sh
.automation/lib/controller_hardening_v2.sh
.automation/lib/telegram_notify.sh
```

`run_common.sh` provides locking, validation, Codex execution, artifact packaging, cycle artifact checks and source fingerprints. The controller hardening layer provides atomic parent locks, verified child process groups, mtime heartbeats, TERM-first cleanup, atomic child terminal results and strict parent/child identity validation.

All five root controllers archive the complete `artifacts/` tree using fast standard ZIP compression. Final summaries are refreshed after lock classification so downloaded archives contain authoritative release fields.

Parent autopilots pass `TELEGRAM_NOTIFY=0` to children and send one final parent message. Standalone controllers notify by default.

## Current exact maintenance gate

The remaining program intentionally includes root-wrapper and paper-controller integration. `run-autonomous-implementation.sh` now accepts task-file maintenance only when:

```text
AUTOMATION_ALLOW_PROTECTED_CHANGES=1
automation_maintenance_allowed=yes
allowed_protected_files=<exact list>
```

A blanket manual protected-file override is disabled. Any changed protected file outside the task list blocks the cycle.

## Current paper limitation

`run-paper-evaluation.sh` and `run-paper-autopilot.sh` now expose the validated runtime-evidence local lifecycle from `BWS-588` and `BWS-589`. They do not replace the remaining release, recovery, soak, or final-acceptance queue.
