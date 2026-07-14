# ADR-0004 - Three-repo surebet strategy boundary

## Status

Accepted.

## Decision

```text
betting-win           provider/data/history platform
betting-win-betting   predictive/value-betting strategy repo
betting-win-surebet   surebet/complete-set strategy application repo
```

BWS owns surebet logic, backtests, private paper state, and future explicitly gated execution decisions. betting-win owns provider truth/history. The downstream repos use separate accounts and separate bankrolls.

## Consequences

No provider duplication, no predictive strategy work in BWS, no shared-capital coordinator, and no live execution without a separate explicit gate.
