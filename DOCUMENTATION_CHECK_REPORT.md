# Documentation check report — betting-win-surebet three-repo boundary

Date: 2026-07-03

Source checked: `betting-win-surebet9(3).zip`

## Result

The repo was already clean from a safety perspective: no provider-history docs, predictive/value-betting docs, or imported legacy tree needed to be removed from this repo.

The remaining documentation issue was scope wording. Active docs described the repo mostly as a private paper-only skeleton. That is correct for the current gate, but incomplete for the accepted three-repo target architecture.

This overlay rebaselines active docs to:

```text
betting-win-surebet = surebet/complete-set strategy and execution repo
current_gate = private paper-only, no providers, no live execution
provider_truth_owner = betting-win
predictive_strategy_owner = betting-win-betting
account_policy = separate_from_betting-win-betting
backtesting_owner = betting-win-surebet
paper_mode_owner = betting-win-surebet
future_live_decision_owner = betting-win-surebet_after_explicit_gate
```

## Files updated

- README.md
- AGENTS.md
- PROJECT_STATUS.md
- STARTER_PACK.md
- CHANGELOG.md
- package.json
- package-lock.json
- SOURCE_MANIFEST.json
- docs/MASTER_PLAN.md
- docs/repo_status_current.md
- docs/001_scope_and_boundaries.md
- docs/002_dependency_contract_with_betting_win.md
- docs/003_surebet_family_decision.md
- docs/004_market_identity_and_rule_equivalence.md
- docs/005_terminal_scenario_cashflow_model.md
- docs/006_quote_depth_capacity_requirements.md
- docs/010_paper_evaluation_and_kill_criteria.md
- docs/011_validation_matrix.md
- docs/012_runbook.md
- docs/016_pinned_betting_win_interface_readiness.md
- docs/018_private_paper_mode_runbook.md
- docs/autonomous_loop_contract.md
- docs/operations/autonomous_72h_runbook.md
- docs/operations/service_run.md
- decisions/ADR-0001-repo-boundary-and-no-provider-connections.md
- decisions/ADR-0003-paper-only-no-execution.md
- scripts/validate_repo.py
- tests/validate-repo-contract.test.ts
- tests/validation-matrix-contract.test.ts

## Files added

- docs/019_three_repo_surebet_strategy_boundary.md
- docs/020_strategy_data_and_state_ownership.md
- docs/021_backtest_paper_live_mode_roadmap.md
- docs/022_separate_account_policy.md
- docs/023_legacy_betting_win_surebet_import_manifest.md
- decisions/ADR-0004-three-repo-surebet-strategy-execution-boundary.md
- scripts/validate_three_repo_surebet_boundary.py
- tests/three-repo-surebet-boundary.test.ts

## Delete/move decision

No `rm` or `mv` is required for this repo in this wave.

There is no local `docs/imported-from-betting-win` tree to delete. Surebet-specific legacy material from `betting-win` should be imported later only after all three repo documentation passes are complete and the old `betting-win` validator/path references are safe.

