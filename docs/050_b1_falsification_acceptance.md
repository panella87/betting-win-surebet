# 050 - B1 falsification acceptance and kill criteria

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
research_target=B1_CROSS_VENUE_ARBITRAGE_OFFLINE_FALSIFICATION
live_execution_gate=always_fail_until_BWS-900
private_observation_gate=requires_offline_acceptance
```

## Research target

```text
sports=soccer,nba,mlb
markets=moneyline,spread,totals
time_window_days=730
minimum_markets_compared=50000
minimum_unique_events=8000
minimum_venue_pairs=3
reruns_required=3
```

If the upstream dataset cannot meet coverage, the result must be a truthful lower-coverage blocker, not an accepted falsification pass.

## Metrics

```text
markets_compared
unique_events
venue_pairs
candidate_count
gross_positive_count
net_positive_count
fillable_candidate_count
candidate_to_fill_conversion_rate
false_positive_rate
mean_gross_spread_bps
mean_net_spread_bps
worst_case_net_minor
capital_utilization
drawdown_under_rejected_leg_events
settlement_mismatch_block_count
quote_staleness_block_count
capacity_block_count
limit_block_count
fee_block_count
```

## Acceptance gates

Data gate:

```text
minimum_730_day_window_or_explicit_blocker=yes
minimum_50000_markets_compared=yes
minimum_8000_unique_events=yes
minimum_3_venue_pairs=yes
soccer_nba_mlb_present_or_truthful_blocker=yes
moneyline_spread_totals_present_or_truthful_blocker=yes
```

Identity gate:

```text
market_equivalence_key_present_for_every_compared_market=yes
selection_equivalence_covers_every_terminal_outcome=yes
settlement_compatibility_flag_explicit=yes
void_rule_id_explicit_where_relevant=yes
ambiguous_identity_rows_accepted=no
```

Net economics gate:

```text
gross_edge_survives_fees=yes
capacity_caps_applied=yes
stake_rounding_applied=yes
capital_lock_reported=yes
worst_case_net_positive_or_threshold_positive=yes
```

Fillability gate:

```text
candidate_to_fill_conversion_survives_conservative_rejection_timeout=yes
partial_fill_residual_exposure_within_limit=yes
rejected_leg_drawdown_within_limit=yes
```

## Kill criteria

```text
B1_FALSIFIED_NET_EDGE_DISAPPEARED
B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT
B1_BLOCKED_SETTLEMENT_COMPATIBILITY
B1_BLOCKED_FILLABILITY_EVIDENCE
B1_BLOCKED_CAPACITY_OR_LIMITS
B1_KILLED_QUOTE_STALENESS_EXPLAINS_GROSS_EDGE
B1_KILLED_FALSE_POSITIVE_RATE_TOO_HIGH
B1_KILLED_CAPITAL_LOCK_UNACCEPTABLE
```

## Live gate

```text
live_execution=not_authorized
BWS-900=parked
bet_button=forbidden
order_button=forbidden
account_balance_prompt=forbidden
copy_trade_output=forbidden
public_signal_output=forbidden
profitability_or_expected_income_claim=forbidden
```
