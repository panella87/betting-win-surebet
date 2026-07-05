# Repo automation contract: betting-win-surebet

This repository uses the standardized root automation helper surface:

```bash
./update_git.sh
./zip_codebase.sh
./zip_codebase.sh --artifacts-only
./pull_artifacts_and_zip_codebase.sh
./watch_progress.sh --once --fast
./check_progress.sh
./open_log.sh
./start.sh
./stop.sh
```

The three long root `run-*` controllers still exist, but they are intentionally out
of scope for this helper-standardization wave.

Root operator scripts inherit the active Node runtime from the parent shell. Before
launching long controllers, activate the repo runtime explicitly:

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
```

`update_git.sh` defaults to `--pull` and uses `git pull --ff-only --autostash`. It
uses temporary `GIT_ASKPASS` for GitHub HTTPS auth and does not reset, clean, or
auto-resolve conflicts.

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
./zip_codebase.sh`. It has no `automation.config.sh` dependency.

`check_progress.sh`, `watch_progress.sh`, and `open_log.sh` are read-only artifact
viewers for `artifacts/autonomous_implementation_*`, `artifacts/autonomous_bugfix_*`,
and `artifacts/paper_evaluation_*`. `watch_progress.sh --base-url` is accepted for
workflow compatibility, but this repo has no service, so local artifacts are the
source of truth.

`start.sh` validates the repo and does not start a daemon. `stop.sh` intentionally
stops nothing because `betting-win-surebet` has no long-running service in the
current private paper-only phase.

`.automation/lib/telegram_notify.sh` is installed as the shared completion notifier
for future controller wiring. It reads `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`
from environment first, then `.env`, sends one final message only, never prints the
token, and does not fail a controller if delivery fails. Disable it with
`TELEGRAM_NOTIFY=0`.

Boundaries remain active: no provider connections, no provider SDKs/URLs, no
wallets/signers/orders, no direct `betting-win` DB access, no public reports, no
profitability claims, and no execution-readiness claims.
