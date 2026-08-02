# 049 - B1 market equivalence and quote comparison contract

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
identity_gate=fail_closed_before_quote_comparison
quote_comparison=bounded_synchronized_window_only
market_shapes_first=two_way_moneyline_without_draw,spread,totals,standard_binary
market_shapes_later=three_way_moneyline_with_draw
```

## Required equivalence gates

BWS must refuse to compare prices unless all required identity and rule evidence is present.

```text
same_canonical_event_or_accepted_event_equivalence_key=satisfied
same_market_type=satisfied
same_period=satisfied
same_line_value_for_spread_totals=satisfied
same_outcome_set_cardinality=satisfied
selection_equivalence_for_every_terminal_outcome=satisfied
settlement_compatibility=explicit
void_rule_compatibility=explicit
currency=same_or_blocked
start_time_tolerance=upstream_approved
```

Blocker codes:

```text
B1_MARKET_EQUIVALENCE_MISSING
B1_SELECTION_EQUIVALENCE_MISSING
B1_MARKET_TYPE_MISMATCH
B1_PERIOD_MISMATCH
B1_LINE_VALUE_MISMATCH
B1_SETTLEMENT_COMPATIBILITY_UNKNOWN
B1_VOID_RULE_MISMATCH
B1_OUTCOME_SET_INCOMPLETE
B1_CURRENCY_MISMATCH
```

## Quote synchronization

B1 must not compare arbitrary latest quotes. Every comparison must use a bounded synchronization window and keep quote age separate from retrieval age.

```text
snapshot_time_utc=upstream_observed_market_time
retrieved_at_utc=bws_or_upstream_retrieval_time
quote_age_ms=comparison_time_minus_snapshot_time
retrieval_lag_ms=retrieved_at_minus_snapshot_time
comparison_window_ms=max_allowed_distance_between_venue_quotes
```

Fail-fast quote rules:

```text
negative_age=block
future_timestamp=block
quote_age_above_threshold=block
retrieval_lag_above_threshold=block
missing_capacity=block_unless_explicit_conservative_proxy_configured
missing_venue_limit=block_unless_lowest_conservative_cap_configured
unsupported_currency=block
```

## Candidate grouping

```text
B1CanonicalMarketCluster=canonical_event_plus_market_equivalence
B1VenuePairKey=ordered_deterministic_venue_pair_or_cluster
B1MarketPair=market_equivalence_key_plus_venue_pair
B1SelectionPair=terminal_outcome_plus_venue_selection
```

Gross candidates are raw deterministic opportunities only. They must not be shown as executable or profitable without net economics, capacity, freshness, fillability and settlement evidence.

## Execution invariant

```text
BWS-900=parked
execution=prohibited
```
