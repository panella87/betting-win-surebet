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
real upstream evaluation = blocked until paper-controller pinned-bundle shell hardening lands and Federico provides the pinned betting-win contract/export interface
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

Activate the repo Node runtime before package installation, validation, or long root controllers:

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
npm install
npm run validate
```

Useful commands:

```bash
./start.sh
./check_progress.sh
./watch_progress.sh --once
./open_log.sh
./update_git.sh --help
./pull_artifacts_and_zip_codebase.sh --help
./zip_codebase.sh
./zip_codebase.sh --artifacts-only
./run-autonomous-implementation.sh --check-only --model cli-default --fallback-model none
./run-autonomous-bugfix.sh --check-only --model cli-default --fallback-model none
./run-paper-evaluation.sh --check-only --model cli-default --fallback-model none
node cli.js local-report --bundle tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json --output artifacts/local-paper-reports/smoke.report.json
```

Compatibility wrappers under `commands/run-sure-*` still exist for old muscle memory, including `commands/run-sure-paper-mode-autonomous.sh`, but the canonical daily entrypoints are the root scripts above.

`start.sh` is intentionally a validation wrapper, not a daemon launcher. This repo has no long-running service under the current private paper-only gate.

## Hard boundary

The repository must fail closed if it contains provider SDK/client imports, provider URLs, wallet/signer/order/transaction paths, direct `betting-win` database access, `core.*` migrations, manually vendored generated contracts, malformed autonomous cycle status, nonzero Codex exit, or failed post-cycle validation.

Federico asked for the maximum safe local implementation possible, and the retained SURE-002A local backlog in `docs/015_local_engine_implementation_backlog.md` is now exhausted. Do not invent more local engine work. The next product step requires Federico's pinned `betting-win` contract/export interface. Before using a real pinned bundle, the next repo-local tooling step is paper-controller pinned-bundle shell-command hardening. Because that task is explicit automation maintenance touching a protected root controller, launch it with `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`; otherwise autonomous runs should repair only concrete repo-local validation/tooling defects or stop with `AUTONOMOUS_GOAL_COMPLETE=yes`.


## Private paper-mode continuation

The SURE-002B private paper-mode intake backlog is now complete for repo-local work:

```text
SURE-002B_PRIVATE_PAPER_MODE_INTAKE
run-paper-evaluation.sh
commands/run-pinned-interface-smoke.sh compatibility_one_shot_only
docs/017_private_paper_mode_implementation_backlog.md
docs/018_private_paper_mode_runbook.md
```

This phase is still private and paper-only. It accepts only repo-local JSON bundles, writes only under `artifacts/private-paper-mode/`, and keeps `accepted=false`. The freeze gate is: `npm run validate` passes, local fixture smoke passes, and real upstream evaluation still requires Federico's pinned bundle. Provider connections, execution, public reports, profitability claims, and live-readiness claims remain prohibited.

The repo-local private paper-mode backlog is complete. The known current follow-up before using a real `SUREBET_PINNED_BUNDLE` is paper-controller pinned-bundle shell-command hardening: the docs must not treat real pinned-bundle evaluation as ready until the controller quotes operator-provided bundle paths fail-closed. This is an automation-maintenance task and requires the protected-file exception in the implementation command. Generic autonomous feature runs should still stop with `AUTONOMOUS_GOAL_COMPLETE=yes` unless a concrete repo-local validation/tooling defect is confirmed.

## Standard automation commands

Canonical helper commands:

```bash
./zip_codebase.sh
./pull_artifacts_and_zip_codebase.sh
./update_git.sh --status
./update_git.sh --acp
```

Canonical root controller commands, after activating Node 20 in the parent shell:

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
AUTOMATION_ALLOW_PROTECTED_CHANGES=1 ./run-autonomous-implementation.sh --duration 72h --model cli-default --fallback-model none
./run-paper-evaluation.sh --duration 72h --interval 5m --adaptive --keep-monitoring-when-ready --model cli-default --fallback-model none
./run-autonomous-bugfix.sh --duration 72h --model cli-default --fallback-model none --handover-autonomous-implementation
```

`run-paper-evaluation.sh` replaces any `run-paper-evaluation-12h.sh` naming. It is
configured for repo-local private fixture evaluation. Its pinned-bundle
branch is reserved until the known shell-command quoting and strict pinned-bundle boolean hardening lands. It must not be
used as real upstream acceptance evidence until Federico provides the pinned
`betting-win` bundle. All `run-*` scripts write root `artifacts.zip` before exit.
Protected automation files are documented under `docs/automation/` and must not be
changed by normal autonomous work.


## Automation helper standardization

```text
helper_standardization_wave=approved_subset_plus_all_three_root_controllers
update_git_pull=git_pull_ff_only_autostash
zip_codebase_artifacts_only=supported
pull_artifacts_remote_artifact_override=supported
progress_helpers=current_artifact_layout
shared_telegram_helper=.automation/lib/telegram_notify.sh
run_autonomous_implementation=standardized_with_canonical_flags_and_telegram
run_autonomous_bugfix=standardized_audit_handoff_with_telegram
run_paper_evaluation_standardization=standardized_with_telegram_no_service_private_fixture_pinned_bundle
```


Runtime automation policy:

```text
source_manifest_runtime_locks_and_handoffs=ignored
source_manifest_source_owned_automation_helpers=tracked
paper_controller_final_summary_exit_status=real_process_exit_status
```

Controller runtime locks and handoff files under `.automation/` are ignored by the source manifest and Git, but source-owned `.automation` helpers remain tracked and validated.
