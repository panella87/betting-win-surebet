# 021 - Backtest, paper and live roadmap

Backtesting belongs in this repo for surebet strategies. Backtests and private-paper strategy state belong in BWS and consume exact betting-win exports for historical reproducibility or an accepted typed read-only API for current runtime truth.

```text
BWS-300  deterministic backtest
BWS-310  bounded private paper
BWS-510  integrated local acceptance
BWS-520..BWS-580  executable bounded runtime components
BWS-581..BWS-599  continuous operator stack, automation, recovery and final acceptance
BWS-600 accepted continuous read-only runtime evidence, using operator-approved input
BWS-710 accepted B1 multi-venue runtime resource and API handoff
BWS-900 separately authorized execution
```

Current BWS-600 cannot begin credibly until betting-win accepts the downstream API wire contract and provider-to-PostgreSQL-to-API parity. The presence of `/dashboard/*`, foundation query contracts, or a schema name alone does not satisfy that gate.

A future BWS-900 implementation may consume `@betting-win/execution-sdk` for provider mechanics, but BWS remains responsible for opportunity decisions, stake sizing, accounts, credentials, signers, bankroll, kill switches, execution scheduling, partial-leg policy, receipts, positions, and recovery.

No backtest, fixture, paper, soak, SDK package, or mocked transport result implies profitability or execution readiness. Live execution remains prohibited until `BWS-900` receives separate explicit authorization and governance.
