# Protected automation files

These files define the repo automation contract and must not be changed during
normal autonomous implementation, paper evaluation, or bugfix runs:

```text
zip_codebase.sh
pull_artifacts_and_zip_codebase.sh
update_git.sh
run-autonomous-implementation.sh
run-paper-evaluation.sh
run-autonomous-bugfix.sh
automation.config.sh
.automation/lib/run_common.sh
docs/automation/PROTECTED_AUTOMATION_FILES.md
```

Changing protected files is allowed only when the explicit task is automation
maintenance or repo standardization.

Repo-specific operating rules live in:

```text
docs/automation/repo-profile.md
docs/automation/autonomous-implementation.md
docs/automation/paper-evaluation.md
docs/automation/autonomous-bugfix.md
docs/automation/current-implementation-task.md
```

Executable command lists live in `automation.config.sh`, not in free-form markdown.
