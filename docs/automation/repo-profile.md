# Repo profile: betting-win-surebet

`betting-win-surebet` is the dedicated surebet / complete-set strategy repository.
It owns surebet strategy logic, backtesting, private paper mode, private reports,
and future gated surebet execution decisions only after a separate explicit gate.

```text
repo_role=surebet_strategy_execution_repo
strategy_family=surebet_complete_set_only
provider_truth_owner=betting-win
canonical_history_owner=betting-win
predictive_strategy_owner=betting-win-betting
backtesting_owner=betting-win-surebet
paper_mode_owner=betting-win-surebet
future_live_decision_owner=betting-win-surebet_after_explicit_gate
account_policy=separate_from_betting-win-betting
```

Current state:

```text
current_task=SURE-002B_PRIVATE_PAPER_MODE_INTAKE
current_task_status=repo_local_private_paper_mode_baseline_complete_full_blueprint_blocked_on_pinned_interface
mode=private_paper_only
provider_connections=prohibited
execution=prohibited
public_signals=prohibited
profitability_claims=prohibited
real_upstream_evaluation=blocked_until_federico_pinned_betting_win_interface
```

The repo-local SURE-001, SURE-002A, and SURE-002B backlogs are exhausted. Do not
invent more local engine or private paper-mode work from stale backlog wording.
The next real non-local step requires Federico's pinned `betting-win` contract or
export bundle.

Primary validation:

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
npm run validate
```

Important safe local paper command:

```bash
node cli.js local-report \
  --bundle tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json \
  --output artifacts/private-paper-mode/fixture-smoke.report.json
```

Hard bans: provider SDKs/URLs, provider API credentials, wallets, signers, order
creation, cancellation, cashout, redemption, token approvals, transaction paths,
direct `betting-win` database access, public signal publishing, profitability
claims, and live/execution-readiness claims.


## Standard helper scripts

`update_git.sh`, `zip_codebase.sh --artifacts-only`, `pull_artifacts_and_zip_codebase.sh`, `watch_progress.sh`, `check_progress.sh`, `open_log.sh`, `start.sh`, `stop.sh`, and `.automation/lib/telegram_notify.sh` are standardized. `run-autonomous-implementation.sh`, `run-autonomous-bugfix.sh`, `run-paper-evaluation.sh`, and `run-paper-autopilot.sh` are standardized with canonical flags and Telegram final notifications. `run-paper-evaluation.sh` is a no-service private fixture/pinned-bundle paper controller for this repo.


## Paper autopilot profile

run_paper_autopilot=standardized_no_service_parent_supervisor

The autopilot has `paper_service_lifecycle=none` and `PAPER_SERVICE_SUPPORTED=0`. It never starts/stops services and never calls providers or direct betting-win DB reads.
