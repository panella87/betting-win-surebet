# 005 — Terminal scenario cash-flow model

A paper surebet requires complete terminal-scenario payoff coverage. Reciprocal odds alone
are only a candidate signal and never acceptance evidence.

For the first lane, the minimum terminal states are:

```text
yes_wins
no_wins
```

Void, correction, cancellation, or incomplete finality must block acceptance until the
upstream `betting-win` settlement replay contract explicitly models them.

The cash-flow model must include stake amount, payout amount, fees, costs, and residual
exposure per terminal scenario.
