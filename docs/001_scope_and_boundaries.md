# 001 - Scope and boundaries

BWS is the surebet strategy application built on `betting-win`.

```text
repo_role=surebet_strategy_application
canonical_history_owner=betting-win
provider_truth_owner=betting-win
strategy_state_owner=betting-win-surebet
predictive_strategy_owner=betting-win-betting
safe_local_terminal_gate=BWS-599
external_runtime_gate=BWS-600
execution_gate=BWS-900
```

BWS owns upstream compatibility, `surebet.*`, opportunity and scenario logic, fixed-point solving, completion/exposure, settlement, backtests, private paper, API/workers/cockpit, full-stack lifecycle, database operations, observability, release/recovery and private runtime evidence.

BWS does not own provider adapters, raw provider truth, canonical history, provider identity/rule normalization or betting-win `core.*`. It consumes exact contracts, immutable exports and typed read-only API surfaces.

Current authorization permits loopback/read-only implementation and evidence through `BWS-599`. `BWS-600` remains blocked on accepted operator-approved runtime evidence. `BWS-900` remains parked.
