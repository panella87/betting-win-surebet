# 002 - Canonical betting-win ecosystem integration contract

```text
document_role=CANONICAL_BETTING_WIN_ECOSYSTEM_INTEGRATION_CONTRACT
ecosystem_alignment_wave=73
repo_role=surebet_strategy_application
upstream_platform=betting-win
provider_truth_owner=betting-win
canonical_history_owner=betting-win
provider_mechanics_library_owner=betting-win
strategy_state_owner=betting-win-surebet
runtime_data_transport=read_only_api_only
historical_replay_transport=immutable_exports
execution_library=@betting-win/execution-sdk
execution_library_runtime_owner=downstream_process
```

## Inspected upstream source

This integration audit inspected the uploaded `betting-win` 0.48.0 source archive with SHA-256:

```text
betting_win_source_audit_archive=betting-win218(3).zip
betting_win_source_audit_sha256=7b2c3a48bbc4cba95bcace384bb20892916a5958e6477d49651c983b16d11dc2
betting_win_source_audit_package_version=0.48.0
betting_win_source_audit_node=20.x
betting_win_source_audit_git_metadata=absent
betting_win_source_audit_role=architecture_and_compatibility_evidence_not_runtime_lock
```

The current source contains `apps/api`, `apps/web`, `apps/workers`, the provider/data packages, and `@betting-win/execution-sdk`. Runtime identity still comes from the operator-provided betting-win checkout's committed `HEAD`, not from this archive.

## Three-repository ownership

```text
betting-win           provider data, canonical truth, read-only platform API, immutable exports, shared execution SDK
betting-win-betting   predictive/value-betting decisions, bankroll, accounts, execution loop
betting-win-surebet   arbitrage decisions, stake vectors, leg coordination, bankroll, accounts, execution loop
```

The two downstream repositories remain independent. They do not share bankroll, account state, risk state, positions, or recovery decisions.

## Data plane

The operator runtime uses the typed betting-win read-only API only. Workspace inspection and immutable export parsing remain deterministic development, fixture, migration, replay, and backtest compatibility surfaces; they are not selectable runtime transports.

There is no automatic fallback from API runtime to a workspace, export, fixture, mock, dataset file, or local BWS listener.

Historical/reproducible family:

```text
schema=betting-win.strategy-export.v1
alias=betting-win-strategy-export.v1
profile=surebet_standard_binary_v0
```

Pinned exports bind source commit or source-manifest hash, provider generation, canonical IDs, rules/finality, time range, files, and SHA-256. They are historical truth, not current runtime truth.

## Current runtime API compatibility result

The inspected betting-win source implements a large GET-only operator API under `/dashboard/*`. It also contains foundation/query application contracts for identity, rules, and normalized records. However, the repository explicitly records:

```text
upstream_downstream_runtime_api_handoff_allowed=no
upstream_operator_server_route_family=/dashboard/*
upstream_contract_negotiation_endpoint=not_found
bws_required_contract_probe=/contract
bws_required_query_routes=/query/identity-entities,/query/rule-profiles,/query/normalized-records
bws_required_response_envelope=contractVersion,contractSchema,contractAlias,surebetProfile,resource,provenance,page
current_cross_repo_runtime_wire_status=NOT_ACCEPTED_NOT_COMPATIBLE
```

The current BWS client must not be pointed at the upstream dashboard server and treated as integrated. The route family, contract negotiation, response envelope, and exact committed-HEAD provenance contract are not accepted as one deployable cross-repository interface.

The platform-side resolution must be one of these explicit reviewed outcomes:

1. `betting-win` publishes and accepts a versioned downstream read-only handoff facade matching the BWS contract; or
2. a cross-repository decision changes the BWS client and preflight to an explicitly versioned accepted betting-win API contract.

No adapter may infer fields, silently transform incompatible pages, or declare runtime readiness from endpoint similarity.

## BWS-600 gate

`BWS-600` may start only when all of the following are true:

```text
betting_win_committed_head_lock=valid
betting_win_downstream_runtime_api_handoff=accepted
betting_win_contract_probe=implemented_and_versioned
betting_win_query_resources=compatible
betting_win_response_provenance=compatible
provider_to_postgres_to_api_parity=accepted_for_bounded_real_capture
private_bws_postgres=available
private_bws_schedule=operator_approved
paper_policy=provider_disabled_execution_false
```

Until then, `run-paper-autopilot.sh` is the selected future parent but is launch-blocked by external integration evidence.

## B1 data contract

The upstream source declares and sample-validates `betting-win.b1_multi_venue_markets.v1`. That proves a schema target exists. It does not prove an accepted live/runtime resource, multi-venue completeness, provider parity, or downstream API authorization.

```text
bws710_schema_definition_status=DECLARED_STUB_AND_SAMPLE_VALIDATED
bws710_runtime_resource_status=NOT_ACCEPTED_NOT_AUTHORIZED
bws710_current_status=BLOCKED_ACCEPTED_BETTING_WIN_B1_MULTI_VENUE_API_REQUIRED
```

The legacy blocker code `B1_BLOCKED_UPSTREAM_CONTRACT_ABSENT` is retained for compatibility and means that the accepted runtime contract/resource is absent, not that the schema name is missing from upstream source.

## Execution plane

`betting-win` owns the strategy-free provider mechanics library `@betting-win/execution-sdk`; it does not expose an execution HTTP service. The SDK runs inside the downstream executor process.

The inspected package is npm-packable and exposes canonical contracts, client/preflight, provider capabilities, risk/kill-switch contracts, execution intents/results, reconciliation classifications, testing surfaces, and SX OBv3 non-writing mechanics. Its client methods currently return fail-closed blocked results for submit, cancel, close, redeem, order, position, balance, and reconciliation operations. Real provider writes remain unauthorized.

BWS currently has no dependency on `@betting-win/execution-sdk`. Integration belongs only to separately authorized `BWS-900` work and must use a distinct SDK package/version/integrity lock. It must not reuse the data-plane lock and must not copy provider mechanics into BWS.

## Execution ownership after a future gate

`betting-win` SDK owns provider-native request construction, capability checks, signing payload contracts, fixed-point conversions, typed provider responses/errors, idempotency/retry classifications, reconciliation primitives, and secret redaction.

BWS owns opportunity approval, stake sizing, account selection, credentials and signer custody, live authorization, kill-switch policy, execution scheduling, order/position persistence, partial-fill handling, residual exposure, hedge/abort policy, and settlement reconciliation.

## Deployment and lifecycle

BWS may read an already running operator-approved betting-win service. BWS automation must not start, stop, restart, mutate, clean, reset, commit, or deploy the betting-win repository or service. BWS lifecycle scripts own only BWS processes and BWS PostgreSQL state.

## Locks and compatibility

The generated, gitignored `config/betting-win.upstream.lock.json` is the data-plane committed-HEAD compatibility lock produced from the operator-provided betting-win checkout. A future execution integration requires a separate package artifact lock containing at least SDK package name, semantic version, package tarball SHA-256, export-map fingerprint, Node requirement, consumer proof, provider capability set, and live-write authorization state.

## Prohibited shortcuts

```text
direct_provider_connection=prohibited
provider_credentials_in_bws_source_or_artifacts=prohibited
betting_win_database_direct_read=prohibited
betting_win_database_write=prohibited
betting_win_service_write_api=prohibited
silent_api_shape_translation=prohibited
api_to_export_fallback=prohibited
fixture_as_runtime_evidence=prohibited
sdk_live_write_assumption=prohibited
execution_before_bws900=prohibited
```
