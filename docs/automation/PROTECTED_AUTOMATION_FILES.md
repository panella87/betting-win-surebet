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

For the current task-file campaign, all of the following are required:

```text
AUTOMATION_ALLOW_PROTECTED_CHANGES=1
automation_maintenance_allowed=yes
allowed_protected_files=<one exact comma-separated list>
```

`AUTOMATION_ALLOW_PROTECTED_CHANGES=1` is not blanket permission. The implementation controller rejects missing, duplicate, malformed, empty or out-of-list authorization. It snapshots every protected path before the campaign and blocks a cycle if any changed protected path is outside the exact list.

The current exact list is documented in `docs/automation/current-implementation-task.md` and `docs/036_root_wrappers_and_paper_automation_integration.md`. It does not include `run-autonomous-implementation.sh`, bugfix controllers, `update_git.sh`, packaging helpers, controller hardening, Telegram code or any unrelated automation file.

Do not broaden the list inside an autonomous cycle. Do not edit an authorized file before the active dependency-ready task requires it.

Executable command lists remain in `automation.config.sh`, `tools/required_executable_paths.js` and `scripts/validate_executable_bits.py`.
