# 020 - Strategy data and state ownership

This repo owns surebet-specific derived state under `surebet.*`: upstream locks/imports, candidate/rejection evidence, scenario cash flows, stake vectors, completion/exposure, backtests, paper runs, settlement reconciliation, execution intents and receipts after a future gate, and worker checkpoints.

BWS must not create a canonical provider-history database and must not migrate or write betting-win `core.*`. Upstream records are referenced by canonical IDs/provenance or retained as immutable reproducibility snapshots.

`betting-win` owns raw/normalized provider truth, canonical identity/history, provider rules/finality, and provider-generation evidence. `@betting-win/execution-sdk` may construct provider-native operations, but downstream-owned credentials, signers, account selection, order/position ledgers, and hedge/recovery state remain in BWS.

The BWS runtime may not read the betting-win PostgreSQL database directly. It may consume only an accepted read-only downstream API contract; current BWS-600 launch remains blocked because that contract is not yet accepted. Retention, correction, and replay rules are defined in `docs/032_database_and_data_lifecycle.md`.
