# 020 - Strategy data and state ownership

This repo owns surebet-specific derived state under `surebet.*`: upstream locks/imports, candidate/rejection evidence, scenario cash flows, stake vectors, completion/exposure, backtests, paper runs, settlement reconciliation, and worker checkpoints.

This repo must not create a canonical provider-history database and must not migrate or write betting-win `core.*`. Upstream records are referenced by canonical IDs/provenance or retained as immutable reproducibility snapshots.

Retention, correction, and replay rules are defined in `docs/032_database_and_data_lifecycle.md`.
