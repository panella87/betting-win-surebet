# API-only upstream runtime contract

```text
runtime_upstream_mode=api_only
file_export_runtime_fallback=prohibited
fixture_runtime_fallback=prohibited
local_bws_api_as_upstream=prohibited
cross_repo_wire_contract=current_not_accepted
```

The managed BWS runtime may consume an operator-approved, authorized, contract-compatible betting-win read-only API only. It does not expose an upstream mode selector and does not fall back to file exports, pinned bundles, fixtures, mocks, dataset files, workspace inspection, or the local BWS API.

## Required BWS contract

Current BWS source requires:

```text
probe=/contract
queries=/query/identity-entities,/query/rule-profiles,/query/normalized-records
response_envelope=contractVersion,contractSchema,contractAlias,surebetProfile,resource,provenance,page
provenance=exact_committed_head_lock
```

## Inspected betting-win status

The latest read-only source audit is `betting-win299.zip` with SHA-256 `3ce855567a954c63f7dfbd61b208ef962f7cd4eac1f4a1dd2551685f205e464a`.

The source foundation API defines the three BWS query path names, but the default operator runtime remains different:

```text
foundation_source_query_paths=/query/identity-entities,/query/rule-profiles,/query/normalized-records
default_server_command=npm run api:serve-read-only
default_server_entrypoint=apps/api/dist/server.js
default_server_routes=/health,/dashboard/*
contract_probe=/contract_absent
foundation_response_shape=schemaVersion,phase,query,pageSize,returnedCount,nextCursor,items
bws_response_shape=contractVersion,contractSchema,contractAlias,surebetProfile,resource,provenance,page
downstream_runtime_api_handoff_allowed=no
```

Therefore route-name overlap or an available betting-win HTTP process is not sufficient. `BWS-600` remains blocked until an explicit versioned handoff is accepted and real provider-to-PostgreSQL-to-API parity is retained.

## Resolution rule

Resolve the mismatch through an explicit cross-repository contract change. Either betting-win exposes the accepted downstream facade or a reviewed BWS source task adopts an accepted betting-win contract. No automatic route translation, field inference, dashboard scraping, or fallback is allowed.

## B1 and execution

`betting-win.b1_multi_venue_markets.v1` is declared and sample-validated, while upstream explicitly does not claim B1 full readiness. It is not an accepted runtime resource. `@betting-win/execution-sdk` is a separate typed-held package surface, downstream integration is incomplete, and real provider writes remain unauthorized. Neither belongs to BWS-600. BWS-710 and BWS-900 remain blocked or parked respectively.

## Required fail-fast wording

An unavailable or incompatible betting-win API is a fail-fast blocker before BWS enters a long runtime-evidence observation window. The local BWS listener at `127.0.0.1:8803` is not upstream evidence and cannot satisfy the betting-win preflight.
