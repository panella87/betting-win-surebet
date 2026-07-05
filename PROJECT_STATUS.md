# PROJECT_STATUS

```text
repo=betting-win-surebet
status=SURE-002B_PRIVATE_PAPER_MODE_INTAKE
runtime=paper_only
repo_role=surebet_strategy_execution_repo
strategy_family=surebet_complete_set_only
provider_truth_owner=betting-win
canonical_history_owner=betting-win
predictive_strategy_owner=betting-win-betting
backtesting_owner=betting-win-surebet
paper_mode_owner=betting-win-surebet
future_live_decision_owner=betting-win-surebet_after_explicit_gate
account_policy=separate_from_betting-win-betting
provider_connections=prohibited
execution=prohibited
first_lane=polymarket_standard_binary_complete_set_v0
current_task=SURE-002B_PRIVATE_PAPER_MODE_INTAKE
next_task=wait_for_federico_pinned_betting_win_contract_export_interface_before_real_upstream_evaluation
```

Current state:

- The repo is the dedicated surebet / complete-set strategy repository under the accepted three-repo architecture.
- Current implementation remains private paper-only and live execution remains disabled until a separate explicit gate.
- It owns surebet strategy logic, backtesting, private paper mode, reports, and future gated live surebet execution decisions.
- It does not own provider truth.
- It does not connect to SX, Azuro, Polymarket, Limitless, or any future provider.
- It does not implement wallets, signers, token approvals, orders, cancellations, redemptions, cashouts, transactions, live collectors, public signals, or profitability claims.
- It consumes only stable contracts/exports/read-only evidence from `betting-win` after those interfaces exist.
- It uses a separate account and bankroll from `betting-win-betting`; no shared-capital coordinator exists here.

Authoritative active docs:

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

Validation command:

```bash
npm run validate
```

Local `.env` policy: allowed in the working folder only because `.gitignore` explicitly ignores it; archive validators still reject `.env` inside generated codebase/source handoff archives.


## Launcher hardening

The autonomous launcher uses `scripts/load-node-runtime.sh` and logs Node/NPM runtime checks before validation. `.env` may exist locally when ignored by `.gitignore`; it must not be archived or committed.

## Packaging helpers

`zip_codebase.sh` creates a local clean codebase archive. `pull_artifacts_and_zip_codebase.sh` downloads remote `artifacts.zip` when present and delegates codebase packaging to `zip_codebase.sh`. Both helpers exclude `.env`, dependencies, build output, logs, and generated archives.

## Controller status contract

The autonomous controller must fail closed on malformed cycle status, nonzero Codex exit, or failed post-cycle validation. It must not treat unknown `continue_status.txt` content as `CONTINUE_REQUIRED=yes`.

## SURE-001 artifact quality hardening

Required autonomous cycle artifacts are audit evidence. Missing, placeholder, or empty required report files fail closed before cycle status is accepted. `SOURCE_MANIFEST.json` is validated against the current source tree during `npm run validate`.

## Local implementation backlog

The repo-local SURE-001 hardening backlog and the safe SURE-002A local implementation backlog are now exhausted. The repo has local-only deterministic interface contracts, fixture readers, scenario math, stake-vector math, completion/residual simulation, settlement replay consumption, private paper reporting, and an offline fixture-to-artifact report path.

Real upstream evaluation remains blocked pending Federico's pinned `betting-win` contract/export interface. Autonomous cycles should now write `AUTONOMOUS_GOAL_COMPLETE=yes` unless a repo-local validation/tooling defect reopens safe local work.


## Local safety bugfix hardening

The local fixture pipeline now blocks symlink/realpath export escapes, unsupported runtime query resources, unresolved or mixed quote currencies, missing settlement replay evidence, and stale quote evidence before private opportunity reports are emitted. Partial-fill status now points to the implemented local completion/residual modules while real upstream acceptance remains blocked pending Federico's pinned `betting-win` interface.


## Private paper-mode intake backlog

Federico asked for the maximum safe implementation possible up to private paper mode. The repo-local private paper-mode backlog is now complete:

```text
current_task=SURE-002B_PRIVATE_PAPER_MODE_INTAKE
mode=private_paper_only
provider_connections=prohibited
execution=prohibited
input=repo-local JSON bundles only
output=artifacts/private-paper-mode/*.report.json
```

`docs/017_private_paper_mode_implementation_backlog.md` is now a completed implementation ledger after SURE-001 and SURE-002A completion. `docs/018_private_paper_mode_runbook.md` captures the freeze gate: `npm run validate` passes, local fixture smoke passes, and real upstream evaluation still requires Federico's repo-local pinned `betting-win` bundle.

Use:

```bash
bash commands/run-sure-paper-mode-autonomous.sh
```

only if a concrete repo-local validation/tooling defect reopens safe work. Use `commands/run-pinned-interface-smoke.sh` only when Federico provides a repo-local pinned `betting-win` export bundle.


## Legacy surebet import archive

Surebet-specific legacy material imported from the original `betting-win` repo has been rehomed under dedicated legacy archive paths and is not active authority.

```text
legacy_surebet_import_status=imported_and_rehomed
source_import_path_removed=yes
active_authority=no
```

The active authority remains the three-repo surebet boundary docs.

## Standard automation status

```text
automation_contract=standard_root_scripts_v1
implementation_controller=run-autonomous-implementation.sh
paper_controller=run-paper-evaluation.sh
bugfix_controller=run-autonomous-bugfix.sh
paper_supported=repo_local_private_fixture_only
paper_real_upstream=blocked_until_federico_pinned_betting_win_interface
lock_dir=.automation/locks
root_artifacts_zip=required_before_run_script_exit
stop_autonomous_run_helper=removed
```

`run-paper-evaluation.sh` is now the canonical paper supervisor. It replaces the
old `run-paper-evaluation-12h.sh` naming and should be used only for local private
fixture paper evaluation in this repo state. The private paper-mode backlog remains
complete; real upstream evaluation still requires Federico's pinned bundle.


## Automation helper standardization

```text
update_git_pull=git_pull_ff_only_autostash
zip_codebase_artifacts_only=supported
pull_artifacts_remote_artifact_override=supported
progress_helpers=current_artifact_layout
shared_telegram_helper=.automation/lib/telegram_notify.sh
run_controllers=unchanged_in_this_wave
```
