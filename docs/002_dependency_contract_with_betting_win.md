# 002 — Dependency contract with betting-win

This repo depends on `betting-win` for canonical truth. The dependency must be explicit,
pinned, read-only, and reproducible.

```text
provider_truth_owner=betting-win
canonical_history_owner=betting-win
strategy_state_owner=betting-win-surebet
predictive_strategy_owner=betting-win-betting
```

## Accepted dependency forms

- A pinned generated contract package.
- A pinned export bundle with manifest hash.
- A read-only query response fixture exported by `betting-win`.

## Required pinned inputs

- Contract package version.
- Export bundle path and manifest hash.
- Canonical market identity shape.
- Rule profile shape.
- Quote/depth shape.
- Settlement replay shape.
- Paper ledger shape.

## Forbidden dependency forms

- Direct `betting-win` PostgreSQL access.
- `core.*` migrations or schema ownership.
- Provider credentials or provider API calls.
- Manually vendored generated contracts without a pinned source manifest.

SURE-002A/SURE-002B repo-local work is complete. The next non-local step is a real pinned import contract or export/query interface from `betting-win`. This repo consumes that interface for surebet strategy, backtest, and paper-mode work only; it does not duplicate provider adapters or canonical history.
