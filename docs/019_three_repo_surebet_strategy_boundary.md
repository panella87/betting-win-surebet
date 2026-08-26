# 019 - Three-repo surebet strategy boundary

```text
betting-win           = shared provider/data/history platform
betting-win-betting   = predictive/value-betting strategy and execution repo
betting-win-surebet   = surebet/complete-set strategy application repo
```

BWS is built on top of betting-win through exact source/package contracts, immutable exports for historical reproducibility, and an accepted typed read-only API for current runtime truth. It does not duplicate or bypass provider truth. The current inspected repositories do not yet share that accepted runtime wire contract.

```text
provider_truth_owner=betting-win
canonical_history_owner=betting-win
provider_mechanics_library_owner=betting-win
strategy_state_owner=betting-win-surebet
future_live_decision_owner=betting-win-surebet_after_explicit_gate
account_policy=separate_from_betting-win-betting
```

The betting-win HTTP service remains GET-only. Shared provider execution mechanics belong in `@betting-win/execution-sdk`, which runs inside a downstream executor and does not move strategy, account, credential, bankroll, or recovery ownership upstream.

The downstream strategy repos keep separate accounts, bankrolls, strategy state, order/position state, and execution decisions. betting-win remains strategy-neutral. BWS cannot consume the SDK or execute until BWS-900 is separately authorized and the SDK capability/package gates pass.
