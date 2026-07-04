# Autonomous 72h Runbook

## Preflight

```bash
cd ~/app_testing/betting-win-surebet
npm install
npm run validate
./run-autonomous-implementation.sh --check-only
```

## Start default model run

```bash
cd ~/app_testing/betting-win-surebet && PYTHONDONTWRITEBYTECODE=1 bash run-autonomous-implementation.sh --duration 72h --cycle-timeout 2h --validation-timeout 20m
```

Do not add a model flag unless Federico explicitly asks. Do not use autonomous runs to invent provider integrations, predictive/value-betting work, shared account coordination, or live execution. Surebet backtest/paper/live-gate changes must follow `docs/019_three_repo_surebet_strategy_boundary.md`.

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

Use `commands/run-sure-001-autonomous.sh` or call `bash run-autonomous-implementation.sh` directly. The launcher intentionally does not source `nvm.sh` and does not call the NVM shell function; it uses the current PATH Node if it matches `.nvmrc` major, or an already-installed direct Node binary under `$NVM_DIR/versions/node/.../bin`. This avoids WSL/Bash startup failures before controller logging.

## Launcher runtime note

The repo launcher must not source `nvm.sh` directly. `scripts/load-node-runtime.sh` selects the installed `.nvmrc` runtime from `$NVM_DIR/versions/node/v<version>/bin` and then performs an explicit Node major-version check. This keeps startup visible and avoids NVM shell-context failures before the controller log is created.

## Standardized automation commands

Use canonical root scripts:

```bash
./run-autonomous-implementation.sh --check-only
./run-autonomous-implementation.sh --duration 72h
./run-autonomous-bugfix.sh --duration 72h
./run-paper-evaluation.sh --duration 72h --adaptive
```

`run-paper-evaluation.sh` replaces `run-paper-evaluation-12h.sh`. There is no
`stop-autonomous-run.sh`; use each controller's `--status` and `--force-unlock`
only when needed. All `run-*` scripts create root `artifacts.zip` before exit.
