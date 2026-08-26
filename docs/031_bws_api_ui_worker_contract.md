# 031 - BWS API, UI and worker contract

The BWS API exposes strategy-owned read models only. It may reference betting-win IDs and provenance but must not proxy provider operations or reproduce the betting-win provider-data dashboard.

Resources include upstream locks/import/convergence checkpoints, opportunity/blocker evidence, stake/completion/exposure state, backtests, private-paper cycles, settlement reconciliation, jobs/checkpoints/dead letters, lifecycle, health, readiness, metrics, and evidence indexes.

The operator cockpit uses typed BWS API contracts and explicit mock or API modes during development. Managed runtime must use explicit loopback BWS API mode, serve deterministic built assets, and reject mock mode.

Workers are bounded, checkpointed, idempotent, and restart-safe. `BWS-582` adds continuous claim/drain loops, bounded concurrency, lease renewal, and backpressure. `BWS-583` serves the cockpit. `BWS-584` owns the BWS stack lifecycle. `BWS-599` provides final integrated proof.

The upstream betting-win API is a separate read-only service. BWS lifecycle does not own it. The current BWS query routes and envelope are not yet accepted against the inspected betting-win server, so BWS readiness must remain blocked rather than proxying `/dashboard/*` or inventing translation.

A future BWS-900 executor may import `@betting-win/execution-sdk` directly inside the downstream execution process. The BWS read-only API must not expose submit/cancel/close/redeem routes, transport credentials, signer access, or provider-native write payloads.

No provider connection, public signal, or execution path is currently authorized.
