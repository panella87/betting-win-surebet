# 027 - BWS target architecture

## Workspace

Node 20, npm workspaces, TypeScript, PostgreSQL, and bounded workers. BWS may follow mature betting-win operational patterns while retaining separate package names, persistence, and strategy ownership.

## Applications

- `apps/api`: read-only BWS HTTP API.
- `apps/web`: operator cockpit for opportunities, evidence, backtests, paper runs, exposure, settlement, and blockers.
- `apps/workers`: bounded upstream intake, opportunity evaluation, backtest, and paper jobs.

## Packages

- `packages/upstream`: exact betting-win lock, export intake, API client.
- `packages/contracts`: BWS domain/persistence contracts.
- `packages/opportunity`: equivalence and complete-set derivation.
- `packages/solver`: fixed-point capacity/fee/rounding/stake logic.
- `packages/simulation`: completion and exposure state machines.
- `packages/settlement`: replay and reconciliation.
- `packages/backtest`: deterministic historical evaluation.
- `packages/paper`: private paper ledger and metrics.
- `packages/query-service`: bounded read models.
- `packages/jobs`: checkpoints, leases, retries, dead letters.

## Persistence

Only `surebet.*` migrations under `database/migrations/surebet` belong here. Upstream provider records are immutable references/snapshots, not re-authored canonical truth.

## Compatibility migration

The current `src/` modules are the behavior baseline. Keep their tests until workspace parity is proven. Remove compatibility wrappers only in a separate validated task.
