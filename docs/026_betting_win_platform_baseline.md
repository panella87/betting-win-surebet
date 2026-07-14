# 026 - Inspected betting-win platform baseline

Source archive SHA-256:

```text
9a9eee490918ff69182acdaa302d216859a5009b0943adb41e56171c1ee9ef8f
```

Verified root package/runtime:

```text
name=betting-win
version=0.48.0
node=20.x
workspaces=packages/*,apps/*
```

Verified compatibility packages include contracts, foundation, identity, paper-ledger, provider-collection, provider-generation, query-service, quotes, rules, and source-lineage. Verified application surfaces are `apps/api`, `apps/web`, and `apps/workers`.

Verified downstream family:

```text
schema=betting-win.strategy-export.v1
alias=betting-win-strategy-export.v1
profile=surebet_standard_binary_v0
export_kind=pinned_provider_history_bundle
proof_profile=downstream_pinned_provider_history_consumption_proof_v1
read_only_functions=exportHistoricalBundle,getHistoricalQuotes,getProviderGenerations,inspectSourceLineage
```

Machine-readable limitations:

```text
archive_has_no_git_commit_metadata
baseline_is_design_evidence_not_runtime_lock
accepted_continuous_live_read_only_input_is_not_proven_for_all_providers
```
