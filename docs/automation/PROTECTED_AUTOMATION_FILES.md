# Protected automation files

These files define repository automation or operator lifecycle contracts and are read-only during ordinary product, paper and bug-audit cycles:

```text
update_git.sh
zip_codebase.sh
pull_artifacts_and_zip_codebase.sh
check_progress.sh
watch_progress.sh
open_log.sh
start.sh
stop.sh
run-autonomous-implementation.sh
run-paper-evaluation.sh
run-autonomous-bugfix.sh
run-paper-autopilot.sh
run-bugfix-autopilot.sh
automation.config.sh
.automation/lib/run_common.sh
.automation/lib/controller_hardening_v2.sh
.automation/lib/telegram_notify.sh
docs/automation/PROTECTED_AUTOMATION_FILES.md
```

## Exact authorization contract

Protected changes are permitted only when an explicit handoff or the active task source provides exact authorization.

When authorization is active, all of the following are required:

```text
AUTOMATION_ALLOW_PROTECTED_CHANGES=1
automation_maintenance_allowed=yes
allowed_protected_files=<one exact comma-separated list>
```

`AUTOMATION_ALLOW_PROTECTED_CHANGES=1` is not blanket permission. The implementation controller rejects missing, duplicate, malformed, empty or out-of-list authorization. It snapshots every protected path and blocks a cycle if any changed protected path is outside the exact list.

## Historical BWS-587 through BWS-589 authorization

The reviewed integration phase required:

```text
start.sh
stop.sh
check_progress.sh
watch_progress.sh
open_log.sh
run-autonomous-implementation.sh
run-paper-evaluation.sh
run-paper-autopilot.sh
automation.config.sh
.automation/lib/run_common.sh
docs/automation/PROTECTED_AUTOMATION_FILES.md
```

`run-autonomous-implementation.sh` was required so a runtime-evidence paper handoff could preserve selected upstream mode and campaign identity through the implementation return handoff.

## Current task state

The integration phase is complete. `docs/automation/current-implementation-task.md` now contains:

```text
automation_maintenance_allowed=no
allowed_protected_files=none
```

Do not set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1` for `BWS-590` through `BWS-599`. Do not broaden authorization from inside an autonomous cycle.

Executable command lists remain in `automation.config.sh`, `tools/required_executable_paths.js` and `scripts/validate_executable_bits.py`.
