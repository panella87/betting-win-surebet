# 027 - Validated BWS architecture

```text
architecture_status=VALIDATED_SAFE_LOCAL_PLATFORM
current_task=BWS-600
active_implementation_queue=none
selected_controller=run-paper-autopilot.sh
runtime_upstream_mode=api_only
```

## Workspace

The repository uses Node 20, npm workspaces, TypeScript, PostgreSQL, bounded workers, and a React/Vite operator cockpit. It remains a downstream surebet application with separate package names, persistence, and strategy ownership.

## Applications and runtime entrypoints

The only application workspace is `apps/web`, which contains the operator cockpit. The read-only BWS API, upstream convergence, scheduler, worker, lifecycle, diagnostics, paper handoff, release, recovery, soak, and preflight entrypoints are compiled CLI/service surfaces under `packages/bootstrap/src/cli`, `packages/bootstrap/src/api`, `packages/bootstrap/src/operations`, and `packages/bootstrap/src/workers`.

There are no separate `apps/api` or `apps/workers` workspaces in the current repository. Documentation and future changes must describe the consolidated implementation rather than inventing absent application directories.

## Packages

- `packages/bootstrap`: contracts, adapters, identity, opportunities, quotes/economics, solvers/scenarios, simulation/settlement, backtests, reporting, runtime, API, workers, operations, and CLI composition.
- `packages/persistence`: `surebet.*` repositories and database mappings.
- `packages/upstream`: exact read-only betting-win checkout lock and upstream compatibility proof.
- `apps/web`: typed, loopback-oriented operator cockpit.
- `src/`: retained compatibility shims that mirror validated behavior while callers migrate to workspace exports.

## Persistence

Only `surebet.*` migrations under `database/migrations/surebet` belong here. Upstream provider records are immutable references or snapshots, not re-authored canonical truth. Direct betting-win database reads and all betting-win writes remain prohibited.

## Current runtime boundary

Managed runtime transport is API-only. Historical export and pinned-bundle parsers may remain for deterministic fixture and backtest compatibility, but no operator-selectable export fallback exists. The current external gate is `BWS-600`; `BWS-900` execution remains parked.

## Future architecture changes

Remove compatibility shims, split workspaces, or introduce new runtime applications only through a separately reviewed task with focused migration proof, full validation, updated source evidence, and unchanged no-provider/no-execution boundaries.
