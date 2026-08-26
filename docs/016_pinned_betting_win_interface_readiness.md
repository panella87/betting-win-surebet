# 016 - Betting-win compatibility readiness

```text
provider_truth_owner=betting-win
surebet_strategy_owner=betting-win-surebet
predictive_strategy_owner=betting-win-betting
provider_mechanics_library_owner=betting-win
```

The upstream interface is no longer hypothetical. The inspected betting-win 0.48.0 source contains the historical export family, read-only data platform, B1 schema target, and a partial installable execution SDK:

```text
betting-win.strategy-export.v1
betting-win-strategy-export.v1
surebet_standard_binary_v0
pinned_provider_history_bundle
downstream_pinned_provider_history_consumption_proof_v1
betting-win.b1_multi_venue_markets.v1
@betting-win/execution-sdk
```

`BWS-100` is validated. It verifies the existing server checkout's committed `HEAD`, generates an exact upstream data-plane lock, proves package/capability compatibility from Git objects, proves committed `HEAD` remains unchanged during verification, and fails closed on mismatch. The uploaded archive remains design and compatibility evidence only because it has no Git metadata.

What is not ready is the deployable cross-repository runtime handoff. The betting-win repository records `DOWNSTREAM_RUNTIME_API_HANDOFF_ALLOWED=no`; its operator server exposes `/dashboard/*`, while BWS expects `/contract` plus `/query/*` resources and a different exact provenance envelope. BWS-600 therefore remains blocked even if both repositories build independently.

The B1 schema is declared, but the accepted multi-venue runtime resource is not. The SDK package exists, but real write methods remain fail-closed and BWS does not consume it. Those facts must be represented as distinct gates rather than collapsed into one generic upstream-ready claim.
