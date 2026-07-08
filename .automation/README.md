# `.automation/`

Repo-local automation support files for `betting-win-surebet`.

Active shared helpers:

```text
.automation/lib/run_common.sh
.automation/lib/telegram_notify.sh
```

`run_common.sh` is used by the long controllers for locking, validation, Codex
execution, artifact packaging, fail-closed cycle status parsing, and required
cycle artifact checks.

`telegram_notify.sh` is wired into `run-autonomous-implementation.sh`,
`run-autonomous-bugfix.sh`, and `run-paper-evaluation.sh` for one final completion
notification per run.

This repo has no service-owned paper lifecycle. `run-paper-evaluation.sh` is the
standard no-service private paper controller: it validates source, runs a private
fixture smoke, writes local artifacts, and never starts/stops services or calls
providers. The paper-controller pinned-bundle shell-command quoting and strict pinned-bundle boolean validation hardening has landed. Use real `SUREBET_PINNED_BUNDLE` input only when Federico provides a repo-local pinned `betting-win` export bundle; it is still private paper evidence, not live readiness.


## Paper autopilot runtime state

`run-paper-autopilot.sh` writes parent-supervisor artifacts under `artifacts/paper_autopilot_*`. Runtime locks and handoff files remain generated state and are not source authority.
