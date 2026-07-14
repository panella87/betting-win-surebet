# 002 - Dependency contract with betting-win

```text
repo_role=surebet_strategy_application
upstream_platform=betting-win
provider_truth_owner=betting-win
canonical_history_owner=betting-win
strategy_state_owner=betting-win-surebet
```

A process selects exactly one explicit upstream mode:

```text
workspace  development-time read-only compatibility inspection
export     immutable pinned betting-win.strategy-export.v1 input
api        typed read-only betting-win query/API input
```

There is no automatic fallback. Each mode has distinct required configuration and validation.

Canonical family:

```text
schema=betting-win.strategy-export.v1
alias=betting-win-strategy-export.v1
profile=surebet_standard_binary_v0
```

Pinned exports bind source commit or source-manifest hash, provider generation, canonical IDs, rule/finality references, time range, files, and SHA-256. API mode negotiates the expected contract and applies bounded pagination, timeout, and retry behavior.

BWS may persist immutable upstream snapshots and derived `surebet.*` state. It must not mutate upstream data or treat a snapshot as canonical provider history.
