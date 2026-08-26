# 027 - Validated BWS architecture

```text
architecture_status=VALIDATED_SAFE_LOCAL_PLATFORM
current_task=BWS-600
active_implementation_queue=none
selected_controller=run-paper-autopilot.sh
runtime_upstream_mode=api_only
current_cross_repo_wire_status=NOT_ACCEPTED_NOT_COMPATIBLE
execution_sdk_integration_status=NOT_PRESENT_BWS900_PARKED
```

## Three-repository topology

```text
providers
  -> betting-win collectors, raw evidence, normalization, identity, PostgreSQL
  -> betting-win GET-only data API and immutable exports
  -> betting-win-surebet strategy, solver, private paper, BWS state

future only after BWS-900:
betting-win-surebet decision and account context
  -> @betting-win/execution-sdk inside BWS process
  -> provider-native operation through BWS-owned transport and credentials
```

## BWS workspace

The repository uses Node 20, npm workspaces, TypeScript, PostgreSQL, bounded workers, and a React/Vite operator cockpit. It remains a downstream surebet application with separate package names, persistence, and strategy ownership.

The only application workspace is `apps/web`. The read-only BWS API, upstream convergence, scheduler, worker, lifecycle, diagnostics, paper handoff, release, recovery, soak, and preflight entrypoints are under `packages/bootstrap`. Persistence is under `packages/persistence`; committed-HEAD compatibility logic is under `packages/upstream`; `src/` retains compatibility shims.

There are no separate `apps/api` or `apps/workers` workspaces in BWS. Do not confuse the upstream betting-win application topology with the downstream BWS topology.

## Data boundary

Only `surebet.*` migrations belong here. BWS must not read or write betting-win PostgreSQL directly. Managed runtime transport is API-only; immutable exports remain historical/replay inputs.

The current betting-win operator server and current BWS client are not yet one accepted wire contract. BWS expects `/contract`, `/query/identity-entities`, `/query/rule-profiles`, and `/query/normalized-records` with an exact contract/provenance envelope. The inspected betting-win operator server exposes `/dashboard/*` and records the downstream runtime handoff as not allowed.

## B1 boundary

Local B1 deterministic implementation is complete through BWS-820. The upstream schema target exists, but no accepted multi-venue runtime resource or handoff is authorized. BWS-710 remains blocked.

## Future execution boundary

`@betting-win/execution-sdk` belongs to betting-win and runs inside downstream processes. BWS must add it only through separately authorized BWS-900 work, a separate SDK artifact lock, isolated consumer proof, and explicit live-safety gates. Provider mechanics must not be reimplemented in BWS, and betting-win must not become a write service.

## Future architecture changes

Any route/envelope adaptation, B1 runtime integration, SDK dependency, shim removal, workspace split, or new runtime application requires a reviewed task, focused migration proof, full validation, updated source evidence, and unchanged no-provider/no-execution boundaries.
