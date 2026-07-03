# 020 — Strategy data and state ownership

This repo owns surebet-specific derived state. It does not own canonical provider history.

## Data this repo may own

`betting-win-surebet` may store or generate:

- strategy configuration for the surebet lane;
- pinned upstream export references and manifest hashes;
- local fixture bundles used for contract tests;
- immutable backtest input manifests;
- surebet candidate reports;
- stake-vector solver inputs and outputs;
- capacity and rounding decisions;
- residual-exposure reports;
- settlement replay interpretations tied to a candidate;
- private paper-mode reports and batch summaries;
- future gated live decision logs after explicit authorization.

## Data this repo must not own

This repo must not create a canonical provider-history database. The following remain in `betting-win`:

- sports and competitions;
- teams, players, participants, events, markets, and outcomes;
- provider market IDs and provider generations;
- source lineage and retained raw evidence;
- quote, depth, trade, refund, void, settlement, and finality history;
- provider-rule semantics and finality authority;
- shared query/export contracts.

## Pinned snapshots are allowed

For reproducibility, this repo may keep immutable pinned export snapshots or derived artifact hashes produced by `betting-win`. That is not canonical history ownership.

Correct:

```text
backtests/run-001/input_manifest_hash.json
artifacts/private-paper-mode/run-001/batch-summary.json
```

Incorrect:

```text
polymarket_quotes_history table
sx_events table
azuro_settlements table
```

## Separate from predictive betting

Predictive/value-betting datasets, model features, labels, calibration reports, and CLV analysis belong in `betting-win-betting`. If a surebet report needs upstream quote or settlement evidence, it must receive that evidence through `betting-win`, not through the predictive repo.

