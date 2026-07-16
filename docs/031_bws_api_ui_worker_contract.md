# 031 - BWS API, UI and worker contract

The BWS API exposes strategy-owned read models only. It may reference betting-win IDs and provenance but must not proxy provider operations.

Resources include upstream locks, import/convergence checkpoints, opportunity and blocker evidence, stake/completion/exposure state, backtests, private-paper runtime cycles, settlement reconciliation, jobs/checkpoints/dead letters, lifecycle, health, readiness, metrics and evidence indexes.

The operator cockpit uses typed API contracts and explicit mock or API modes during development. Managed runtime must use explicit loopback API mode, serve deterministic built assets and reject mock mode.

Workers are bounded, checkpointed, idempotent and restart-safe. `BWS-582` adds continuous claim/drain loops, bounded concurrency, lease renewal and backpressure. `BWS-583` serves the cockpit. `BWS-584` owns the complete stack lifecycle. `BWS-599` provides final integrated proof.

No provider connection, public signal or execution path is authorized.
