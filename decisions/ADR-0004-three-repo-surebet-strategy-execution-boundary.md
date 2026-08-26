# ADR-0004 - Three-repo surebet strategy boundary

## Status

Accepted.

## Decision

```text
betting-win           provider/data/history platform and strategy-free execution SDK owner
betting-win-betting   predictive/value-betting strategy and execution repo
betting-win-surebet   surebet/complete-set strategy application and future executor repo
```

BWS owns surebet logic, backtests, private paper state, and future explicitly gated execution decisions. betting-win owns provider truth/history and shared provider mechanics. The downstream repos use separate accounts and separate bankrolls.

The betting-win HTTP service is read-only. Provider execution mechanics are delivered as `@betting-win/execution-sdk` library code that runs inside each downstream executor. The SDK does not own strategy, accounts, credentials, bankroll, live authorization, positions, or hedge/recovery policy.

## Consequences

No provider duplication, no predictive strategy work in BWS, no shared-capital coordinator, no betting-win write API, and no live execution without a separate explicit BWS-900 gate. An SDK package existing upstream is not execution authorization.
