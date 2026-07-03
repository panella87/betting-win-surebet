# Surebet mathematics and execution corrections after Prompt 26

## Fixed-odds N-outcome allocation

For mutually exclusive and collectively exhaustive outcomes with executable decimal odds `o_i`:

```text
S = sum(1 / o_i)
surebet iff S < 1
stake_i = B * (1 / o_i) / S
gross_return = B / S
profit = B * (1 / S - 1)
```

This is a continuous, pre-cost solution. The guarantee exists only after venue-specific stake increments, minimums, maximums, taxes, commissions and actual fills are applied.

## Bookmaker back plus exchange lay

Let:

```text
B      bookmaker back stake
O_back bookmaker decimal odds
L      exchange lay stake
O_lay  exchange decimal lay odds
c      exchange commission on positive lay winnings
```

Outcome cash flows:

```text
selection wins:  B*(O_back - 1) - L*(O_lay - 1)
selection loses: -B + L*(1 - c)
```

Equalizing the outcomes gives:

```text
L = B * O_back / (O_lay - c)
```

and:

```text
profit = B * (O_back*(1-c)/(O_lay-c) - 1)
```

The opportunity is positive only if:

```text
O_back*(1-c) > O_lay-c
```

Do not convert lay odds using a generic effective-odds shortcut and then apply the reciprocal-sum test.

## Canonical implementation rule for future paper simulation

For every candidate portfolio, construct an outcome-by-leg cash-flow matrix and require:

```text
minimum(net_cashflow_by_outcome) > 0
```

after:

- exact accepted stake;
- commission basis;
- turnover or winnings tax;
- FX/token conversion;
- gas and slippage;
- stake increments and rounding;
- void/partial-settlement scenarios;
- partial fills and rejected legs.

No displayed price is executable evidence without size and timestamp provenance.
