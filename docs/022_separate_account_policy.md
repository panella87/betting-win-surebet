# 022 — Separate account policy

`betting-win-surebet` and `betting-win-betting` use separate accounts and separate bankrolls.

## Policy

```text
account_policy=separate_from_betting-win-betting
shared_bankroll_with_betting-win-betting=no
shared_capital_coordinator=absent
betting-win_account_coordination=not_owned_here
```

`betting-win` must not coordinate capital between the two downstream strategy repos. It may expose provider truth, balances, read-only account state, or future mechanical provider functions only if explicitly authorized, but it must not decide which strategy receives capital.

## Consequences

`betting-win-surebet` must not assume that funds, positions, paper balances, or risk limits from `betting-win-betting` are available.

`betting-win-betting` must not read surebet paper state or live decision logs as a source of bankroll authority.

If future live execution is authorized, this repo must be configured with its own account identity, bankroll limits, risk limits, and kill criteria. Any shared-capital design would require a new cross-repo architecture decision and is out of scope for this repo.

