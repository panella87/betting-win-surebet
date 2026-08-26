# 048 - B1 upstream contract with betting-win

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
contract_schema=betting-win.b1_multi_venue_markets.v1
contract_alias=betting-win-b1-multi-venue-markets.v1
transport=read_only_api_only_for_runtime
runtime_file_export_fallback=prohibited
current_schema_definition_status=DECLARED_STUB_AND_SAMPLE_VALIDATED
current_runtime_resource_status=NOT_ACCEPTED_NOT_AUTHORIZED
current_real_intake_status=BLOCKED_UPSTREAM_CONTRACT_ABSENT
legacy_blocker_semantics=ACCEPTED_RUNTIME_CONTRACT_ABSENT_NOT_SCHEMA_NAME_ABSENT
```

## Source reconciliation

The inspected betting-win source contains the B1 schema name, validator, sample contract, and research/task references. This is useful contract design evidence. It does not prove that the running betting-win API exposes a complete multi-venue resource, that real provider observations cover the required venues/markets, or that downstream runtime handoff is authorized.

## Required upstream resource

BWS cannot truthfully perform full B1 runtime/backtest evidence until betting-win exposes an accepted read-only B1 multi-venue market resource. It must include enough identity, quote, rule, depth/fillability, settlement, freshness, generation, and provenance data to reject false arbitrage before gross-spread calculation.

Required row-level fields include at least:

```text
contract_schema
contract_alias
contract_version
canonical_event_id
canonical_market_id
canonical_outcome_set
sport
competition
participants_and_roles
scheduled_start
market_family
period
line_or_handicap
venue_provider_id
venue_provider_generation_id
provider_native_market_id
provider_native_outcome_id
bid_or_back_price
ask_or_lay_price_when_supported
available_size_or_depth_reference
source_timestamp
received_timestamp
freshness_class
rule_profile_id
settlement_profile_id
finality_profile_id
raw_evidence_reference
source_lineage_reference
upstream_lock_fingerprint
```

The API must provide deterministic pagination, exact version negotiation, compatible provenance, and complete market/outcome grouping across venues. Missing venue, outcome, rule, finality, or freshness evidence is a blocker, not a zero value.

## Current BWS parser boundary

BWS may keep deterministic local types, fixtures, parsers, equivalence logic, economics, solvers, simulations, persistence, read-only reporting, and kill criteria. Fixtures remain `runtimeEvidence=false` and cannot satisfy BWS-710.

The BWS query client and betting-win operator server also require an accepted cross-repository route/envelope contract. A B1 resource is not usable merely because the schema exists in upstream source.

## BWS rejection rules

```text
missing_contract_version=block
unsupported_contract_version=block
missing_canonical_identity=block
market_equivalence_unproven=block
selection_equivalence_unproven=block
outcome_set_incomplete=block
rule_or_settlement_compatibility_unknown=block
provider_generation_unknown=block
quote_stale=block
depth_or_fillability_unknown=block
source_lineage_missing=block
upstream_lock_mismatch=block
runtime_file_export_fallback=block
local_bws_api_as_upstream=block
fixture_as_runtime_evidence=block
```

## BWS implementation boundary

BWS may implement local parsers, immutable imported snapshots, and derived `surebet.*` evidence. BWS must not create upstream canonical truth, query provider APIs, write betting-win data stores, clone/mutate betting-win, scrape the dashboard API, or silently replace the real contract with fixture data.

## Runtime gate and blocker compatibility

Until the accepted runtime resource and API handoff exist, B1 outcomes must be explicit blockers such as:

```text
B1_BLOCKED_UPSTREAM_CONTRACT_ABSENT
B1_BLOCKED_UPSTREAM_API_UNAVAILABLE
B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT
B1_BLOCKED_MARKET_EQUIVALENCE_UNPROVEN
```

`B1_BLOCKED_UPSTREAM_CONTRACT_ABSENT` is retained for code/test compatibility and means accepted runtime contract/resource absent. It does not claim the schema identifier is absent from the betting-win source tree.

## Execution invariant

```text
BWS-900=parked
execution=prohibited
provider_connections=prohibited
provider_credentials=prohibited
public_signals=prohibited
profitability_claims=prohibited
```
