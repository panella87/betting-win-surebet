# Polymarket complete-set paper experiment gate after Prompt 28

## Decision

Surebet remains auxiliary. The only selected surebet-family experiment is:

```text
family = same-venue complete-set arbitrage
provider = Polymarket
protocol = CLOB V2
collateral = pUSD
market_scope = standard binary only
negative_risk = excluded
execution = prohibited
paper_simulation = held
```

## Why it survives

This family uses one venue, one collateral generation, one market identity and one resolution source. It avoids cross-venue rule equivalence, cross-venue clocks and bookmaker/exchange commission translation.

It does not provide pair atomicity. Each leg must be simulated separately and group status is authoritative.

## Required evidence before capture

- Current standard-market resolution adapter/subgraph and verified contract records.
- Current negative-risk classifier and explicit exclusion proof.
- Current fee and collateral-version evidence.
- Full level-by-level CLOB depth for both complementary tokens.
- Sequence/cursor/reseed semantics.
- Private persistent-history terms.
- Resolution correction/finality rules.

## Candidate invariant

For equal complete-set quantity `q`:

```text
minimum_scenario_net_cashflow(q)
= minimum over all terminal scenarios of
  [redeem_or_recover_value(q)
   - yes_leg_cost(q)
   - no_leg_cost(q)
   - fees(q)
   - gas_or_settlement_reserve(q)
   - latency_slippage_reserve(q)
   - completion_failure_reserve(q)]
```

The candidate is rejected unless this value is positive and every leg has full admissible depth.

## Group completion states

```text
candidate
identity_verified
rules_verified
quotes_verified
capacity_sufficient
paper_armed
partially_completed | fully_hedged
settled_simulated | settlement_mismatch
```

No leg-level success may override an incomplete group.

## Held conditions

- Prompt 25 source acquisition is incomplete.
- No bounded public capture has been accepted.
- The observation window, paper size and completion-failure assumptions are not frozen.
- The 95% completion threshold is provisional.

No implementation or execution prompt may be generated from this branch.
