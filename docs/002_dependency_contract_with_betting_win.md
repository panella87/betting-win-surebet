# 002 - Dependency contract with betting-win

```text
repo_role=surebet_strategy_application
upstream_platform=betting-win
provider_truth_owner=betting-win
canonical_history_owner=betting-win
strategy_state_owner=betting-win-surebet
```

The operator runtime uses the typed betting-win read-only API only. Workspace inspection and immutable export parsing remain deterministic development, fixture, and backtest compatibility surfaces; they are not selectable runtime transports.

There is no automatic fallback from API runtime to a workspace, export, fixture, or mock input.

Canonical family:

```text
schema=betting-win.strategy-export.v1
alias=betting-win-strategy-export.v1
profile=surebet_standard_binary_v0
```

Pinned exports bind source commit or source-manifest hash, provider generation, canonical IDs, rule/finality references, time range, files, and SHA-256. API mode negotiates the expected contract and applies bounded pagination, timeout, and retry behavior.

BWS may persist immutable upstream snapshots and derived `surebet.*` state. It must not mutate upstream data or treat a snapshot as canonical provider history.
