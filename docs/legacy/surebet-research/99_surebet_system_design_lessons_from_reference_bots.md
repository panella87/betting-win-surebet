# Surebet system-design lessons from reference bots

## Strategy taxonomy

### Cross-venue surebet

Different venues quote legs that together cover every terminal outcome. The core object is a scenario-payoff matrix, not a list of odds.

### Same-venue complete-set arbitrage

Complementary outcome tokens can sometimes be acquired below their common redeemable collateral. This branch requires current collateral, split/merge/redeem, fee and market-generation semantics.

### Back/lay arbitrage

Back stake, lay stake, lay liability and exchange commission must be modeled as outcome-specific cash flows.

### Synthetic equivalence

Two different contracts may replicate the same payoff vector, but only after rule, result-source and terminal-scenario equivalence is proven.

### Not surebet

- smart order routing;
- maker/iceberg quoting;
- copy trading;
- value betting based on model probability.

These may share data infrastructure but require separate performance and risk logic.

## Correct opportunity pipeline

```text
raw provider objects
→ generation-aware normalization
→ event identity candidate graph
→ reviewed/verified event identity
→ exact market-contract identity
→ terminal-scenario payoff matrix
→ executable quote/depth evidence
→ fee and cost cash-flow transforms
→ stake vector optimization
→ quote freshness and capacity checks
→ paper leg-completion simulation
→ residual exposure calculation
→ fully hedged paper status
→ settlement replay
```

## Candidate mathematics

For an opportunity with terminal scenarios `s` and legs `l`:

```text
net_cashflow(s) = sum_l leg_cashflow(l, s)
                  - fixed_costs
                  - variable_fees(s)
                  - currency_haircuts
                  - conservative_rounding_reserve
```

The theoretical margin is:

```text
min_s net_cashflow(s) / total_committed_capital
```

The paper-executable margin further subtracts:

```text
completion_failure_reserve
latency_slippage_reserve
settlement_disagreement_reserve
```

Every scenario must remain above the experiment threshold. A positive reciprocal-odds shortcut is only a candidate prefilter.

## Completion risk

There is no general cross-venue transaction atomicity. Even batch endpoints normally submit multiple independent orders. Therefore a paper simulator needs:

- leg ordering policy;
- quote reservation assumptions;
- independent and correlated rejection probability;
- accepted and filled quantity evidence;
- partial-fill states;
- residual exposure value under current book depth;
- compensation/unwind cost;
- time-to-complete distribution;
- stale-quote invalidation.

An opportunity becomes `paper_fully_hedged` only after all required leg quantities are simulated as completed against admissible evidence.

## Required fail-closed behavior

Reject the candidate when:

- any event or rule identity field is unknown;
- any required terminal scenario is uncovered;
- any leg is price-only when executable size is required;
- total full-size depth is insufficient;
- a quote exceeds its freshness budget;
- a fee or collateral generation is unknown;
- rounding changes the minimum scenario below threshold;
- a provider response is ambiguous about fill status;
- result sources or void rules differ;
- the residual-loss bound exceeds the opportunity margin.

## Paper-module role

Surebet remains an auxiliary module with three immediate research uses:

1. market-identity and settlement-rule QA;
2. stale-price and cross-provider disagreement detection;
3. opportunity-frequency measurement under conservative paper assumptions.

It is not approved as an execution strategy.
