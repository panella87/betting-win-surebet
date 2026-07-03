# 024 — Three-repo documentation completion status

Date: 2026-07-03

```text
cross_repo_documentation_status=complete
repo_role=surebet_complete_set_strategy_execution_repo
provider_truth_owner=betting-win
predictive_strategy_owner=betting-win-betting
account_policy=separate_from_betting-win-betting
legacy_surebet_import_status=complete
rm_required=no
mv_required=no
```

## Result

The active documentation boundary is aligned across all three repositories. `betting-win-surebet` is the surebet/complete-set strategy repo. It owns surebet strategy definitions, backtesting, paper mode, private reports, and future explicitly gated live surebet execution decisions.

`betting-win` owns provider adapters, provider truth, canonical history, rule/settlement semantics, and stable export/query contracts. This repo must not duplicate provider integrations or canonical provider history.

`betting-win-betting` owns predictive/value-betting strategy work and uses a separate account and bankroll.

## Legacy import status

Surebet legacy material imported from the original `betting-win` repo has been rehomed into:

```text
docs/legacy/surebet-research/
research/imported-from-betting-win/legacy/surebet/
schemas/imported-from-betting-win/legacy/surebet/
templates/imported-from-betting-win/legacy/surebet/
```

The staging path remains forbidden:

```text
docs/imported-from-betting-win/
```

No cleanup command is pending in this repo.
