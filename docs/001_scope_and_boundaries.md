# 001 - Scope and boundaries

BWS is the surebet strategy application in the three-repository `betting-win` ecosystem.

```text
repo_role=surebet_strategy_application
upstream_platform=betting-win
provider_truth_owner=betting-win
canonical_history_owner=betting-win
provider_mechanics_library_owner=betting-win
strategy_state_owner=betting-win-surebet
predictive_strategy_owner=betting-win-betting
safe_local_terminal_gate=BWS-599
external_runtime_gate=BWS-600
b1_runtime_resource_gate=BWS-710
execution_gate=BWS-900
```

## BWS ownership

BWS owns upstream compatibility enforcement, `surebet.*`, cross-provider market equivalence, opportunity and rejection evidence, fixed-point stake-vector solving, leg coordination, residual exposure, settlement replay, backtests, private-paper state, BWS workers, BWS read-only API, BWS cockpit, BWS lifecycle, database operations, observability, release/recovery, and private runtime evidence.

BWS also owns every strategy decision and, only after a separately authorized `BWS-900` implementation, the downstream execution loop, account selection, credentials, signer injection, bankroll policy, provider receipt persistence, and hedge or abort policy.

## Upstream ownership

`betting-win` owns provider collection, raw evidence, provider generations, normalization, canonical identity, canonical history, provider rules and finality, read-only platform APIs, immutable exports, and the strategy-free `@betting-win/execution-sdk` package.

BWS must not copy provider adapters, call provider URLs directly, own canonical provider history, migrate or write betting-win `core.*`, host a betting-win write proxy, or silently translate an incompatible upstream response.

## Current authorization

Safe-local implementation is validated through `BWS-599`; dependency-ready local B1 work is validated through `BWS-820`. `BWS-600` remains blocked because the inspected betting-win source does not authorize the downstream runtime API handoff expected by BWS. `BWS-710` remains blocked because the B1 schema exists only as a declared/sample-validated upstream contract, not an accepted runtime resource. `BWS-900` remains parked, and the upstream SDK still fails closed for real provider writes.
