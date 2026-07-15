# 001 - Scope and boundaries

BWS is the surebet strategy application built on top of betting-win.

```text
repo_role=surebet_strategy_application
canonical_history_owner=betting-win
provider_truth_owner=betting-win
strategy_state_owner=betting-win-surebet
predictive_strategy_owner=betting-win-betting
```

BWS owns upstream compatibility, `surebet.*`, opportunity derivation, scenario cash flows, stake vectors, completion/exposure simulation, surebet backtests, private paper state, reports, BWS API/workers/UI, and future explicitly gated execution decisions.

BWS does not own provider adapters, raw provider truth, canonical history, provider identity/rule normalization, or betting-win `core.*` migrations. It consumes exact contracts, immutable exports, and read-only API/client surfaces.

Current authorization reaches executable loopback/read-only continuous private-paper implementation through `BWS-580`. `BWS-600` remains blocked on accepted continuous betting-win runtime evidence. `BWS-900` remains parked.
