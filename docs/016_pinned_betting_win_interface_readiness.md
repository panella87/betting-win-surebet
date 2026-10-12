# 016 - Betting-win compatibility readiness

```text
provider_truth_owner=betting-win
surebet_strategy_owner=betting-win-surebet
predictive_strategy_owner=betting-win-betting
provider_mechanics_library_owner=betting-win
latest_read_only_audit_archive=betting-win299.zip
latest_read_only_audit_sha256=3ce855567a954c63f7dfbd61b208ef962f7cd4eac1f4a1dd2551685f205e464a
latest_read_only_audit_regular_files=2762
```

The upstream interface is no longer hypothetical. The inspected betting-win 0.48.0 source contains the historical export family, provider and PostgreSQL substrate, foundation query contracts, the large dashboard API, the B1 schema target, and `@betting-win/execution-sdk`:

```text
betting-win.strategy-export.v1
betting-win-strategy-export.v1
surebet_standard_binary_v0
pinned_provider_history_bundle
downstream_pinned_provider_history_consumption_proof_v1
betting-win.b1_multi_venue_markets.v1
@betting-win/execution-sdk
```

`BWS-100` is validated. It verifies an operator checkout's committed `HEAD`, generates an exact upstream data-plane lock, proves package and capability compatibility from Git objects, proves committed `HEAD` remains unchanged during verification, and fails closed on mismatch. The uploaded archive remains design and compatibility evidence only because it has no Git metadata.

## Current compatibility result

The newer source contains `/query/identity-entities`, `/query/rule-profiles`, and `/query/normalized-records` in its foundation OpenAPI and application code. This does not make the runtime handoff ready:

- `api:serve-read-only` launches the dashboard server, which exposes `/health` and `/dashboard/*`;
- no accepted `/contract` negotiation endpoint exists;
- the foundation page response shape is not the exact BWS contract envelope;
- the upstream repository still records `DOWNSTREAM_RUNTIME_API_HANDOFF_ALLOWED=no`;
- real provider-to-PostgreSQL-to-API parity is not accepted.

BWS-600 therefore remains blocked even though both repositories contain related query abstractions.

The B1 schema is sample-validated, but the upstream repository still states `B1_FULL_READINESS_NOT_CLAIMED=yes`; there is no accepted complete multi-venue runtime resource. BWS-710 remains blocked.

The execution SDK has expanded substantially and is described upstream as source-complete at a typed-held boundary, but downstream integration and real provider writes remain unauthorized. BWS does not consume it, and BWS-900 remains parked.
