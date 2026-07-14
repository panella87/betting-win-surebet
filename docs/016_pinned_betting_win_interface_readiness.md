# 016 - Betting-win compatibility readiness

```text
provider_truth_owner=betting-win
surebet_strategy_owner=betting-win-surebet
predictive_strategy_owner=betting-win-betting
```

The upstream interface is no longer hypothetical. The inspected betting-win 0.48.0 source contains:

```text
betting-win.strategy-export.v1
betting-win-strategy-export.v1
surebet_standard_binary_v0
pinned_provider_history_bundle
downstream_pinned_provider_history_consumption_proof_v1
exportHistoricalBundle
getHistoricalQuotes
getProviderGenerations
inspectSourceLineage
```

The remaining first requirement is `BWS-100`: verify the existing server checkout's committed `HEAD`, generate an exact upstream lock, prove package/capability compatibility from Git objects, prove committed `HEAD` remains unchanged during verification, and fail closed on mismatch. The uploaded archive is design evidence only because it has no Git metadata. No clone or temporary worktree is required.
