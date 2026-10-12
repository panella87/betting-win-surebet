# 026 - Inspected betting-win platform baselines

> **Historical and current source-audit evidence.** Neither uploaded archive is the runtime lock. Current runtime compatibility authority is generated from the operator-provided betting-win checkout's committed `HEAD` into `config/betting-win.upstream.lock.json`.

## Original historical baseline

```text
document_status=HISTORICAL_INSPECTED_BASELINE
active_runtime_lock_authority=no
current_runtime_transport=api_only
archive_sha256=9a9eee490918ff69182acdaa302d216859a5009b0943adb41e56171c1ee9ef8f
name=betting-win
version=0.48.0
node=20.x
workspaces=packages/*,apps/*
```

That baseline established `betting-win.strategy-export.v1`, alias `betting-win-strategy-export.v1`, profile `surebet_standard_binary_v0`, pinned provider-history exports, downstream consumption proofs, and read-only functions such as `exportHistoricalBundle`, `getHistoricalQuotes`, `getProviderGenerations`, and `inspectSourceLineage`.

## Ecosystem reconciliation snapshot

```text
ecosystem_alignment_wave=73
source_archive=betting-win218(3).zip
source_archive_sha256=7b2c3a48bbc4cba95bcace384bb20892916a5958e6477d49651c983b16d11dc2
package_version=0.48.0
node=20.x
apps=@betting-win/api,@betting-win/web,@betting-win/workers
packages=@betting-win/contracts,@betting-win/evidence-import,@betting-win/execution-sdk,@betting-win/foundation,@betting-win/identity,@betting-win/jobs,@betting-win/paper-ledger,@betting-win/provider-collection,@betting-win/provider-generation,@betting-win/query-service,@betting-win/quotes,@betting-win/rules,@betting-win/source-lineage
```

The newer source confirms the full provider-data architecture, large GET-only `/dashboard/*` operator API, PostgreSQL-shaped runtime, the declared `betting-win.b1_multi_venue_markets.v1` schema target, and the partial installable `@betting-win/execution-sdk` package.

It also confirms the unresolved integration facts:

```text
downstream_runtime_api_handoff_allowed=no
provider_to_postgres_to_api_real_acceptance=incomplete
b1_runtime_resource=not_accepted
execution_sdk=partial_fail_closed
real_provider_writes=not_authorized
```

## Latest read-only reconciliation snapshot

```text
audit_date=2026-10-12
source_archive=betting-win299.zip
source_archive_sha256=3ce855567a954c63f7dfbd61b208ef962f7cd4eac1f4a1dd2551685f205e464a
regular_files=2762
package_version=0.48.0
node=20.x
self_reported_git_head=334950bea22a8778362f0efa78fca09b3c0582ed
self_reported_git_tree=4b609c2b889d141c653a555fc0550dfe2f884543
archive_git_metadata=absent
```

Observed source capabilities and limits:

```text
foundation_query_paths_present=/query/identity-entities,/query/rule-profiles,/query/normalized-records
default_operator_server_command=npm run api:serve-read-only
default_operator_server_entrypoint=apps/api/dist/server.js
default_operator_server_routes=/health,/dashboard/*
contract_negotiation_endpoint=/contract_absent
downstream_runtime_api_handoff_allowed=no
real_operational_system_status=not_ready
provider_to_postgres_to_api_real_acceptance=incomplete
b1_schema=declared_and_sample_validated
b1_full_readiness_claimed=no
b1_runtime_resource=not_accepted
execution_sdk=source_complete_typed_held
downstream_runtime_integration_complete=no
real_provider_writes=not_authorized
```

The route-name overlap is relevant future integration evidence, but it is not an accepted wire contract. The archive does not authorize source merging, provider access, BWS-600, BWS-710, or BWS-900.

## Machine-readable limitations

```text
archive_has_no_git_commit_metadata
archive_has_no_source_manifest
baseline_is_design_evidence_not_runtime_lock
accepted_continuous_live_read_only_input_is_not_proven_for_all_providers
source_snapshot_does_not_authorize_bws600
source_snapshot_does_not_authorize_bws710
source_snapshot_does_not_authorize_bws900
```

Canonical current interpretation is in `docs/002_dependency_contract_with_betting_win.md`; pin mechanics are in `docs/030_upstream_compatibility_and_pin_contract.md`.
