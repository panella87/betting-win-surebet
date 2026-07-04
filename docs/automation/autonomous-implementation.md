# Autonomous implementation rules: betting-win-surebet

`run-autonomous-implementation.sh` is for bounded implementation work. Default
duration is 72h. It has no `--task` flag; use `--prompt-file` or
`docs/automation/current-implementation-task.md`.

For the current repo state, normal autonomous implementation should not open new
feature work. Do not invent additional local backlog work. The repo-local backlogs are complete. The completed ledgers are:

```text
docs/014_sure_001_remaining_hardening_backlog.md
docs/015_local_engine_implementation_backlog.md
docs/017_private_paper_mode_implementation_backlog.md
```

The controller may only:

```text
repair a concrete repo-local validation/tooling defect
repair documentation drift that contradicts the current safety gate
repair deterministic local fixture/private paper-mode bugs
stop with AUTONOMOUS_GOAL_COMPLETE=yes when no safe defect exists
```

It must not connect to providers, read live upstream services, implement execution,
add predictive/value-betting scope, share bankroll/account state with
`betting-win-betting`, or mark real upstream evaluation ready without Federico's
pinned `betting-win` bundle.

Before finishing each cycle, validation must include the configured repo command
from `automation.config.sh`, currently `npm run validate`.

Protected automation files must not change unless the explicit task is automation
maintenance.
