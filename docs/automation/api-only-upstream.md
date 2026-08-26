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

The current upstream operator server exposes GET-only `/dashboard/*` routes and records `DOWNSTREAM_RUNTIME_API_HANDOFF_ALLOWED=no`. Foundation/query contracts exist in source, but the inspected server does not expose an accepted `/contract` negotiation endpoint or the exact BWS response envelope.

Therefore an available betting-win HTTP process is not sufficient. `BWS-600` remains blocked until an explicit versioned downstream handoff is accepted and real provider-to-PostgreSQL-to-API parity is retained.

## Resolution rule

Resolve the mismatch through an explicit cross-repository contract change. Either betting-win exposes the accepted downstream facade or a reviewed BWS source task adopts an accepted betting-win contract. No automatic route translation, field inference, dashboard scraping, or fallback is allowed.

## B1 and execution

`betting-win.b1_multi_venue_markets.v1` is declared/sample-validated but not an accepted runtime resource. `@betting-win/execution-sdk` is a separate partial fail-closed package and is not part of BWS-600. BWS-710 and BWS-900 remain blocked/parked respectively.

## Required fail-fast wording

An unavailable or incompatible betting-win API is a fail-fast blocker before BWS enters a long runtime-evidence observation window. The local BWS listener at `127.0.0.1:4312` is not upstream evidence and cannot satisfy the betting-win preflight.
