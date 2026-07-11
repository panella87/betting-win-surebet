# Repo automation contract: betting-win-surebet

This repository uses the standardized root automation helper surface:

```bash
./update_git.sh
./zip_codebase.sh
./zip_codebase.sh --artifacts-only
./pull_artifacts_and_zip_codebase.sh
./run-autonomous-implementation.sh
./run-autonomous-bugfix.sh
./run-bugfix-autopilot.sh
./run-paper-evaluation.sh
./run-paper-autopilot.sh
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

Protected automation files are read-only during normal implementation, paper evaluation, and bug-audit runs. Use `AUTOMATION_ALLOW_PROTECTED_CHANGES=1` only when Federico explicitly approves bounded automation maintenance that touches protected files.

`run-autonomous-implementation.sh`, `run-autonomous-bugfix.sh`,
`run-paper-evaluation.sh`, and `run-paper-autopilot.sh` are standardized with canonical flags, fail-closed
status/artifact checks, root artifacts refresh, and
`.automation/lib/telegram_notify.sh` final notifications. See `docs/automation/telegram-notifications.md` for the HTML-card contract and dry-run test mode. The paper controller is
adapted for this no-service repo: it runs private fixture smoke and never starts
or stops services. The pinned-bundle branch may be used only after Federico provides a repo-local pinned bundle; the paper controller preflights that path before run creation, executes known report commands as direct argv, verifies source immutability, and strictly validates `SUREBET_REQUIRE_PINNED_BUNDLE`.

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
`artifacts/paper_evaluation_*`, and `artifacts/paper_autopilot_*`. `watch_progress.sh --base-url` is accepted for
workflow compatibility, but this repo has no service, so local artifacts are the
source of truth.

`start.sh` validates the repo and does not start a daemon. `stop.sh` intentionally
stops nothing because `betting-win-surebet` has no long-running service in the
current private paper-only phase.

`.automation/lib/telegram_notify.sh` reads `TELEGRAM_BOT_TOKEN` and
`TELEGRAM_CHAT_ID` from environment first, then `.env`, sends one final message
only, never prints the token, and does not fail a controller if delivery fails.
Disable it with `TELEGRAM_NOTIFY=0`.

Boundaries remain active: no provider connections, no provider SDKs/URLs, no
wallets/signers/orders, no direct `betting-win` DB access, no public reports, no
profitability claims, and no execution-readiness claims.


## Paper autopilot

`run-paper-autopilot.sh` is the canonical unattended no-service parent supervisor for this repo. It is a protected automation file. Manual `run-paper-evaluation.sh` remains available for direct private fixture or pinned-bundle checks, but unattended paper/implementation handoff workflows should use the autopilot.


## Verified controller handoffs

`.automation/lib/controller_hardening_v2.sh` is protected shared infrastructure for strict handoff parsing, semantic fingerprints, source-tree fingerprints, child-result validation, verified child termination, and bounded archives. `run-autonomous-implementation.sh` consumes both paper and bugfix handoffs; `run-paper-autopilot.sh` requires explicit machine-readable child results and uses `--max-rounds 0` by default.


## Bugfix autopilot

`run-bugfix-autopilot.sh` is the unattended bounded source-audit campaign parent. It calls only `run-autonomous-bugfix.sh` and `run-autonomous-implementation.sh --handover-bugfix-audit`, requires a clean re-audit of the same campaign area after each implementation, and never calls paper evaluation or service lifecycle commands.
