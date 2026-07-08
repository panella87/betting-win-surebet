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
`run-autonomous-bugfix.sh`, and `run-paper-evaluation.sh` for one final
HTML-formatted completion notification per run. It supports
`TELEGRAM_NOTIFY_DRY_RUN=1` for local formatting checks without contacting
Telegram.

This repo has no service-owned paper lifecycle. `run-paper-evaluation.sh` is the
standard no-service private paper controller: it validates source, runs a private
fixture smoke, writes local artifacts, and never starts/stops services or calls
providers. It now shell-quotes operator-provided `SUREBET_PINNED_BUNDLE` paths
before `bash -lc` execution and validates `SUREBET_REQUIRE_PINNED_BUNDLE` as
strict `0` or `1`.


Telegram status note: surebet's private-fixture-only status `PAPER_EVALUATION_READY_PRIVATE_FIXTURE_ONLY_BLOCKED_ON_PINNED_BUNDLE` is rendered as blocked rather than success, because real upstream paper evaluation still requires Federico's pinned `betting-win` bundle.
