# 019 - Three-repo surebet strategy boundary

```text
betting-win           = shared provider/data/history platform
betting-win-betting   = predictive/value-betting strategy and execution repo
betting-win-surebet   = surebet/complete-set strategy application repo
```

BWS is built on top of betting-win through exact contracts, immutable exports, and read-only query/API surfaces. It does not duplicate or bypass provider truth.

```text
provider_truth_owner=betting-win
canonical_history_owner=betting-win
strategy_state_owner=betting-win-surebet
future_live_decision_owner=betting-win-surebet_after_explicit_gate
account_policy=separate_from_betting-win-betting
```

The downstream strategy repos keep separate accounts, bankrolls, strategy state, and execution decisions. betting-win remains strategy-neutral.
