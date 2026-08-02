# 048 - B1 upstream contract with betting-win

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
contract_schema=betting-win.b1_multi_venue_markets.v1
contract_alias=betting-win-b1-multi-venue-markets.v1
consumer_repo=betting-win-surebet
producer_repo=betting-win
transport=read_only_api_only_for_runtime
runtime_file_export_fallback=prohibited
current_real_intake_status=BLOCKED_UPSTREAM_CONTRACT_ABSENT
```

## Required upstream resource

BWS cannot truthfully perform full B1 runtime/backtest evidence until `betting-win` exposes an accepted read-only B1 multi-venue market resource. The resource must carry enough identity, quote, rule and provenance data to reject false arbitrage before gross spread calculation.

Minimum row fields:

```text
export_id
export_schema_version
source_commit
source_run_id
created_at_utc
data_window_start_utc
data_window_end_utc
canonical_event_id
canonical_market_id
canonical_selection_id
market_equivalence_key
selection_equivalence_key
sport
league
season
event_start_time_utc
market_type
period
line_value
outcome_name
outcome_side
provider_id
venue_or_bookmaker_id
venue_type
snapshot_time_utc
retrieved_at_utc
quote_age_ms
decimal_odds
price_minor_or_probability_minor
available_size_minor
currency
market_status
settlement_rule_version
settlement_compatibility_flag
void_rule_id
source_lineage_id
raw_payload_hash
quality_flags
```

Minimum manifest fields:

```text
contract_schema
contract_alias
surebet_profile
source_manifest_hash
upstream_lock_fingerprint
provider_generation_ids
source_lineage_record_ids
normalized_evidence_ids
retention_policy
license_scope
known_coverage_gaps
```

## BWS rejection rules

```text
missing_contract_version=block
missing_market_equivalence_key=block
missing_selection_equivalence_key=block
unknown_settlement_compatibility=block
unknown_void_rule_for_compared_markets=block
missing_quote_timestamp=block
missing_venue_or_bookmaker_id=block
missing_provider_lineage=block
unknown_currency=block
non_deterministic_pagination=block
runtime_file_export_fallback=block
local_bws_api_as_upstream=block
provider_credentials_in_bws=block
```

## BWS implementation boundary

BWS may implement local parsers, immutable imported snapshots and derived `surebet.*` evidence. BWS must not create the upstream canonical truth itself, query provider APIs, write `betting-win` data stores, clone/mutate `betting-win`, or silently replace the real contract with fixture data.

## Runtime gate

Until the upstream contract exists and is accepted, B1 outcomes must be explicit blockers such as:

```text
B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT
B1_BLOCKED_UPSTREAM_CONTRACT_ABSENT
B1_BLOCKED_UPSTREAM_API_UNAVAILABLE
```

## Execution invariant

```text
BWS-900=parked
execution=prohibited
```
