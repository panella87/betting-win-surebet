# Repo automation contract: betting-win-surebet

This repository uses the standardized root automation command surface:

```bash
./zip_codebase.sh
./pull_artifacts_and_zip_codebase.sh
./update_git.sh
./run-autonomous-implementation.sh
./run-paper-evaluation.sh
./run-autonomous-bugfix.sh
```

The root shell files and `.automation/lib/run_common.sh` are protected automation
machinery. Normal implementation, paper evaluation, and bugfix runs must not
change them.

`zip_codebase.sh` creates the next numbered repo-root archive, includes untracked
non-ignored files by default, excludes existing archives/secrets/generated output,
and does not write a manifest.

`pull_artifacts_and_zip_codebase.sh` is intentionally dumb and does not use
`automation.config.sh`. On the laptop it pulls server-side root `artifacts.zip` as
the next local `artifactsN.zip`, then calls local `./zip_codebase.sh`.

`update_git.sh` supports `--status`, `--pull`, `--push`, `--clone`,
`--add-commit-push`, and shorthand `--acp`. It keeps `GITHUB_TOKEN` support for
GitHub HTTPS remotes.

`run-autonomous-implementation.sh` handles bounded implementation tasks and reads
its task from `--prompt-file` or `docs/automation/current-implementation-task.md`.
The current repo-local backlogs are complete, so it should fix only concrete safe
defects or stop with `AUTONOMOUS_GOAL_COMPLETE=yes`.

`run-paper-evaluation.sh` supervises repo-local private paper mode over fake/local
fixtures, collects evidence, calls `run-autonomous-bugfix.sh` on bugs, waits
between cycles, and resumes. Real upstream paper evaluation remains blocked until
Federico provides the pinned `betting-win` bundle.

`run-autonomous-bugfix.sh` always combines reactive artifact evidence and proactive
paper-mode bug audit in one run.

All `run-*` scripts create root `./artifacts.zip` before stopping.
