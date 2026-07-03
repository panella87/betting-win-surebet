# betting-win-surebet

Dedicated surebet / complete-set strategy repository. Current implementation is private paper-only; future live surebet execution decisions are gated and disabled until a separate explicit authorization.

This repository consumes stable contracts, exports, read-only query outputs, and generic paper evidence from `betting-win`. It does not connect to providers, does not execute orders, does not use wallets or signers, and does not make profitability claims under the current gate.

## Three-repo role

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

`betting-win-surebet` owns surebet strategy logic, backtesting, private paper mode, reports, and future gated surebet execution decisions. It does not own provider adapters, canonical history, provider settlement truth, predictive/value-betting models, or shared capital coordination.

Initial lane:

```text
polymarket_standard_binary_complete_set_v0
same-venue Polymarket standard-binary complete-set paper arbitrage
provider_connection=prohibited
execution=prohibited
```

Current status:

```text
SURE-002A local interface and engine bootstrap = complete for local fixtures
SURE-001 hardening = complete
SURE-002B private paper-mode intake/reporting backlog = complete for repo-local work
local deterministic contracts, fixture readers, paper math, simulation state machines, settlement replay consumption, private reports, and offline fixture-to-artifact reporting = implemented
real upstream evaluation = blocked until Federico provides the pinned betting-win contract/export interface
```


## Legacy surebet research archive

```text
legacy_surebet_import_status=imported_and_rehomed
source_import_path_removed=yes
active_authority=no
```

Historical surebet material imported from the original `betting-win` repo is retained under `docs/legacy/surebet-research/`, `research/imported-from-betting-win/legacy/surebet/`, `schemas/imported-from-betting-win/legacy/surebet/`, and `templates/imported-from-betting-win/legacy/surebet/`. The stale temporary path `docs/imported-from-betting-win/` must remain absent.

## Source of truth

Read these first:

1. `AGENTS.md`
2. `docs/MASTER_PLAN.md`
3. `docs/repo_status_current.md`
4. `docs/001_scope_and_boundaries.md`
5. `docs/002_dependency_contract_with_betting_win.md`
6. `docs/019_three_repo_surebet_strategy_boundary.md`
7. `docs/020_strategy_data_and_state_ownership.md`
8. `docs/021_backtest_paper_live_mode_roadmap.md`
9. `docs/022_separate_account_policy.md`
10. `docs/012_runbook.md`
11. `docs/operations/autonomous_72h_runbook.md`

Current code and current retained evidence beat stale documentation.

## Install and validate

```bash
npm install
npm run validate
```

Useful wrappers:

```bash
./start.sh
./check_progress.sh
./watch_progress.sh --once
./open_log.sh
./update_git.sh --help
./pull_artifacts_and_zip_codebase.sh --help
./zip_codebase.sh
./run-autonomous-implementation.sh --check-only
bash commands/run-sure-local-engine-autonomous.sh
node cli.js local-report --bundle tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json --output artifacts/local-paper-reports/smoke.report.json
```

`start.sh` is intentionally a validation wrapper, not a daemon launcher. This repo has no long-running service under the current private paper-only gate.

## Hard boundary

The repository must fail closed if it contains provider SDK/client imports, provider URLs, wallet/signer/order/transaction paths, direct `betting-win` database access, `core.*` migrations, manually vendored generated contracts, malformed autonomous cycle status, nonzero Codex exit, or failed post-cycle validation.

Federico asked for the maximum safe local implementation possible, and the retained SURE-002A local backlog in `docs/015_local_engine_implementation_backlog.md` is now exhausted. Do not invent more local engine work. The next real implementation step requires Federico's pinned `betting-win` contract/export interface; until then, autonomous runs should either repair a concrete repo-local validation/tooling defect or stop with `AUTONOMOUS_GOAL_COMPLETE=yes`.


## Private paper-mode continuation

The SURE-002B private paper-mode intake backlog is now complete for repo-local work:

```text
SURE-002B_PRIVATE_PAPER_MODE_INTAKE
commands/run-sure-paper-mode-autonomous.sh
commands/run-pinned-interface-smoke.sh
docs/017_private_paper_mode_implementation_backlog.md
docs/018_private_paper_mode_runbook.md
```

This phase is still private and paper-only. It accepts only repo-local JSON bundles, writes only under `artifacts/private-paper-mode/`, and keeps `accepted=false`. The freeze gate is: `npm run validate` passes, local fixture smoke passes, and real upstream evaluation still requires Federico's pinned bundle. Provider connections, execution, public reports, profitability claims, and live-readiness claims remain prohibited. Until Federico provides the pinned bundle, autonomous runs should stop with `AUTONOMOUS_GOAL_COMPLETE=yes` unless a concrete repo-local validation/tooling defect is confirmed.

The repo-local private paper-mode backlog is complete.
