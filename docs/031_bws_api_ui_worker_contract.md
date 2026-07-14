# 031 - BWS API, UI, and worker contract

The BWS API exposes strategy-owned read models only. It may reference betting-win IDs/provenance but must not proxy private provider operations.

Initial resources:

```text
upstream compatibility and locks
import runs and snapshots
opportunity candidates and rejections
stake vectors and capacity
completion and residual exposure
backtest runs and metrics
paper runs, reservations, reconciliation
settlement replay state
worker checkpoints and dead letters
health, readiness, blockers
```

The operator cockpit uses typed API contracts and separate mock/API modes during implementation. Workers are bounded, checkpointed, idempotent, and restart-safe. Process definitions remain loopback/read-only until `BWS-600` is authorized.
