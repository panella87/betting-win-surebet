# 022 - Separate account policy

```text
account_policy=separate_from_betting-win-betting
shared_bankroll_with_betting-win-betting=no
betting-win_account_coordination=not_owned_here
```

BWS does not share strategy bankroll, reservations, risk state, or execution decisions with `betting-win-betting`. Any future execution-account design requires a separate BWS authorization package. betting-win remains provider/data infrastructure and does not coordinate downstream bankrolls.
