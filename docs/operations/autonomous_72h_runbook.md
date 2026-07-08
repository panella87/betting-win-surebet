# Autonomous 72h Runbook

## Preflight

```bash
cd ~/app_testing/betting-win-surebet
. "$HOME/.nvm/nvm.sh" && nvm use 20
npm install
npm run validate
./run-autonomous-implementation.sh --check-only --model cli-default --fallback-model none
```

## Start default model run

```bash
cd ~/app_testing/betting-win-surebet && . "$HOME/.nvm/nvm.sh" && nvm use 20 && PYTHONDONTWRITEBYTECODE=1 bash run-autonomous-implementation.sh --duration 72h --model cli-default --fallback-model none --cycle-timeout 2h --validation-timeout 20m
```

Prefix the implementation command with `AUTOMATION_ALLOW_PROTECTED_CHANGES=1` only for explicit approved automation-maintenance tasks touching protected root controllers. Omit that environment variable for normal source implementation.

Use `--model cli-default --fallback-model none` unless Federico explicitly asks for another model. Do not use autonomous runs to invent provider integrations, predictive/value-betting work, shared account coordination, or live execution. Surebet backtest/paper/live-gate changes must follow `docs/019_three_repo_surebet_strategy_boundary.md`.

## Observe progress

```bash
./check_progress.sh
./watch_progress.sh --once
./open_log.sh
```

## Pull artifacts and codebase

Configure `.env` with `SSH_HOST`, `SSH_USER`, `SSH_PASSWORD`, and `REMOTE_REPO=/home/dev/app_testing/betting-win-surebet`, then run:

```bash
./pull_artifacts_and_zip_codebase.sh
```

For a local codebase archive only, without SSH/artifact pull:

```bash
./zip_codebase.sh
```

The helpers number files using the highest existing local suffix, including browser duplicate names like `betting-win-surebet1(2).zip`, to avoid recreating stale lower-numbered archives.


## Launcher note

Use the root controller directly after activating Node in the parent shell. Compatibility wrappers under `commands/` still exist, but the daily entrypoint is `bash ./run-autonomous-implementation.sh`.

## Launcher runtime note

Root controllers inherit the active Node runtime from the parent shell and never source `nvm.sh` themselves. Compatibility wrappers under `commands/` may still use `scripts/load-node-runtime.sh`; that helper also must not source `nvm.sh` directly. This keeps startup visible and avoids NVM shell-context failures before the controller log is created.

## Standardized automation commands

Use canonical root scripts:

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
./run-autonomous-implementation.sh --check-only --model cli-default --fallback-model none
./run-autonomous-implementation.sh --duration 72h --model cli-default --fallback-model none
./run-autonomous-bugfix.sh --duration 72h --model cli-default --fallback-model none --handover-autonomous-implementation
./run-paper-evaluation.sh --duration 72h --interval 5m --adaptive --keep-monitoring-when-ready --model cli-default --fallback-model none
```

`run-paper-evaluation.sh` replaces `run-paper-evaluation-12h.sh`. There is no
`stop-autonomous-run.sh`; use each controller's `--status` and `--force-unlock`
only when needed. All `run-*` scripts create root `artifacts.zip` before exit.
