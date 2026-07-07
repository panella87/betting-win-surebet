# Protected automation files

These files define the repo automation contract and must not be changed during
normal autonomous implementation, paper evaluation, or bugfix runs:

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
automation.config.sh
.automation/lib/run_common.sh
.automation/lib/telegram_notify.sh
docs/automation/PROTECTED_AUTOMATION_FILES.md
```

Changing protected files is allowed only when the explicit task is automation
maintenance or repo standardization. For such tasks, launch the implementation
controller with `AUTOMATION_ALLOW_PROTECTED_CHANGES=1` and keep the change
bounded to the named automation files required by the task. Do not set this
environment variable for normal app/source implementation, paper evaluation, or
bug-audit runs.

Executable command lists live in `automation.config.sh`,
`tools/required_executable_paths.js`, and `scripts/validate_executable_bits.py`.
