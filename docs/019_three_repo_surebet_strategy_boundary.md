# 019 — Three-repo surebet strategy boundary

This is the controlling surebet-side boundary for the accepted three-repo architecture.

```text
betting-win           = shared provider/data/history platform
betting-win-betting   = predictive/value-betting strategy and execution repo
betting-win-surebet   = surebet/complete-set strategy and execution repo
```

## Repository authority

`betting-win-surebet` owns surebet-specific strategy interpretation and local strategy state:

- surebet and complete-set family selection;
- terminal scenario coverage checks;
- market-identity and rule-equivalence acceptance checks consumed from `betting-win`;
- quote freshness, capacity, rounding, fee, and cost constraints;
- stake-vector solving for the surebet family;
- leg-completion simulation and residual-exposure analysis;
- settlement replay consumption for surebet reports;
- strategy backtesting over pinned `betting-win` exports;
- private paper-mode reports and paper state;
- future gated live surebet execution decisions after a separate explicit authorization.

## What remains upstream

`betting-win` owns provider truth and canonical history. This repo must not duplicate:

- provider adapters;
- provider credentials or provider clients;
- canonical sport, competition, event, market, participant, or outcome history;
- provider generations and capabilities;
- quote, depth, trade, refund, void, settlement, or finality normalization;
- raw retained evidence and source lineage;
- direct `core.*` database schema ownership.

This repo consumes provider truth through pinned exports, read-only query outputs, generated contracts, or fixture bundles supplied from `betting-win`.

## What remains outside this repo

`betting-win-betting` owns predictive/value-betting strategies, feature datasets, labels, models, calibration, CLV, and directional betting reports.

`betting-win-surebet` must not implement predictive models, directional/value-betting signals, feature engineering for model training, calibration, or CLV reporting.

## Current gate versus target role

Current gate:

```text
mode=private_paper_only
provider_connections=prohibited
execution=prohibited
real_upstream_evaluation=blocked_until_federico_pinned_betting_win_interface
```

Target role:

```text
repo_role=surebet_strategy_execution_repo
strategy_family=surebet_complete_set_only
backtesting_owner=betting-win-surebet
paper_mode_owner=betting-win-surebet
future_live_decision_owner=betting-win-surebet_after_explicit_gate
```

The current prohibition on live execution is a safety gate, not a statement that this repo can never own future surebet execution decisions. Future live use requires a separate ADR, explicit operator approval, account configuration, risk gates, provider-mechanical execution integration through the shared provider layer, and new validators.

## Boundary sentence

`betting-win` knows what providers, markets, quotes, and settlements mean. `betting-win-surebet` decides whether a normalized complete-set candidate exists and how the surebet strategy would size, simulate, backtest, paper-trade, and later gate execution decisions.

