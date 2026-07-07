# Repo automation contract: betting-win-surebet

This repository uses the standardized root automation helper surface:

```bash
./update_git.sh
./zip_codebase.sh
./zip_codebase.sh --artifacts-only
./pull_artifacts_and_zip_codebase.sh
./run-autonomous-implementation.sh
./run-autonomous-bugfix.sh
./run-paper-evaluation.sh
./watch_progress.sh --once --fast
./check_progress.sh
./open_log.sh
./start.sh
./stop.sh
```

The root `run-*` controllers are the canonical daily entrypoints. Historical `commands/run-sure-*` wrappers remain for compatibility only.

The root `run-*` controllers inherit the active Node runtime from the parent shell.
Before launching long controllers, activate the repo runtime explicitly:

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
```

Protected automation files are read-only during normal implementation, paper evaluation, and bug-audit runs. When the explicit task is automation maintenance, such as the current paper-controller pinned-bundle hardening, run the implementation controller with `AUTOMATION_ALLOW_PROTECTED_CHANGES=1` and keep the exception limited to the named automation files.

`run-autonomous-implementation.sh`, `run-autonomous-bugfix.sh`, and
`run-paper-evaluation.sh` are standardized with canonical flags, fail-closed
status/artifact checks, root artifacts refresh, and
`.automation/lib/telegram_notify.sh` final notifications. The paper controller is
adapted for this no-service repo: it runs private fixture smoke and never starts
or stops services. The pinned-bundle branch exists but must not be used with a
real `SUREBET_PINNED_BUNDLE` until the known shell-command quoting and strict
`SUREBET_REQUIRE_PINNED_BUNDLE` validation hardening lands.

`update_git.sh` defaults to `--pull` and uses `git pull --ff-only --autostash`. It
supports `--acp` as shorthand for add/commit/push, reads `GITHUB_TOKEN` from the
environment first and then `.env`, uses temporary `GIT_ASKPASS` for GitHub HTTPS
auth, and does not reset, clean, or auto-resolve conflicts.

`zip_codebase.sh` creates the next numbered codebase zip from tracked files plus
untracked non-ignored files. It excludes secrets, archives, artifacts, logs,
dependencies, build output, databases, temp/cache folders, and runtime evidence.
It preserves real source folders such as `src/reports/`.

`zip_codebase.sh --artifacts-only` creates the next numbered `artifactsN.zip` from
`./artifacts/` only, while still excluding nested archives, secrets, DB files,
locks, temp/cache files, and private keys.

`pull_artifacts_and_zip_codebase.sh` reads `SSH_HOST`, `SSH_USER`, `SSH_PASSWORD`,
and `REMOTE_REPO` from environment or `.env`, supports optional `REMOTE_ARTIFACT`,
downloads remote artifacts without mutating the server, then calls `bash
./zip_codebase.sh`. It has no `automation.config.sh` dependency and no default
remote host.

`check_progress.sh`, `watch_progress.sh`, and `open_log.sh` are read-only artifact
viewers for `artifacts/autonomous_implementation_*`, `artifacts/autonomous_bugfix_*`,
and `artifacts/paper_evaluation_*`. `watch_progress.sh --base-url` is accepted for
workflow compatibility, but this repo has no service, so local artifacts are the
source of truth.

`start.sh` validates the repo and does not start a daemon. `stop.sh` intentionally
stops nothing because `betting-win-surebet` has no long-running service in the
current private paper-only phase.

`.automation/lib/telegram_notify.sh` reads `TELEGRAM_BOT_TOKEN` and
`TELEGRAM_CHAT_ID` from environment first, then `.env`, sends one final
HTML-formatted message only, never prints the token, and does not fail a
controller if delivery fails. Disable it with `TELEGRAM_NOTIFY=0`. Use
`TELEGRAM_NOTIFY_DRY_RUN=1` for local formatting checks; see
`docs/automation/telegram-notifications.md`.

Boundaries remain active: no provider connections, no provider SDKs/URLs, no
wallets/signers/orders, no direct `betting-win` DB access, no public reports, no
profitability claims, and no execution-readiness claims.


Telegram status note: the shared helper uses Hyperliquid's pretty HTML card format, adapted for this repo so `PAPER_EVALUATION_READY_PRIVATE_FIXTURE_ONLY_BLOCKED_ON_PINNED_BUNDLE` is shown as blocked instead of full success.
