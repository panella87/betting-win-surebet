# ADR-0004 — Three-repo surebet strategy execution boundary

## Status

Accepted.

## Context

The ecosystem now has three repositories with distinct responsibilities:

```text
betting-win           = provider/data/history platform
betting-win-betting   = predictive/value-betting strategy repo
betting-win-surebet   = surebet/complete-set strategy repo
```

Earlier `betting-win-surebet` docs correctly prohibited live execution for the starter and private paper phases, but some wording was too narrow and could be read as saying this repo can never become the surebet execution-decision repo.

## Decision

`betting-win-surebet` is the dedicated repo for surebet strategy logic, backtesting, private paper mode, and future gated live surebet execution decisions.

The current implementation remains private paper-only. Provider connections, provider adapters, wallets, signers, orders, public reports, profitability claims, and live-readiness claims remain prohibited until a separate explicit live gate replaces the current paper-only gate.

`betting-win` remains the source of provider truth, canonical history, normalization, retained evidence, and shared query/export contracts.

`betting-win-betting` remains the predictive/value-betting strategy repo.

The two downstream strategy repos use separate accounts and separate bankrolls.

## Consequences

- Surebet-specific backtesting and paper mode belong here.
- Canonical sport/competition/event/market/provider history does not belong here.
- Predictive/value-betting feature/model/CLV work does not belong here.
- Future live surebet decision loops require a new ADR, new validators, and explicit operator approval.
- No shared-capital coordinator is introduced by this repo.

## Superseded interpretation

ADR-0003 remains the current paper-only safety gate. It should not be interpreted as a permanent claim that this repo can never own future surebet execution decisions after explicit authorization.

