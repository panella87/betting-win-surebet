# 028 - Full implementation program

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-590
safe_local_terminal_gate=BWS-599
external_runtime_gate=BWS-600
execution_gate=BWS-900
```

Objective: implement every safe local component required for a private operator-runnable continuous private-paper and surebet backtest application on betting-win.

`BWS-100` through `BWS-589` are validated foundations. `BWS-580` closed the integrated bounded runtime handoff, and `BWS-581` through `BWS-589` closed the continuous service, lifecycle, operations and paper-automation layers. They include exact upstream pinning, the validated workspace migration, domain and persistence layers, immutable export and typed API intake, long-running convergence, scheduler and worker services, read-only API and cockpit, complete product lifecycle, database lifecycle, observability, root wrappers, service-owned paper evaluation and runtime-evidence paper autopilot.

The remaining program is:

```text
BWS-590  reproducible release and deployment packaging
BWS-591  exact-version upgrade, rollback and disaster recovery
BWS-592  retained multi-hour soak and bounded failure injection
BWS-593  accepted-runtime preflight and campaign manifest
BWS-599  integrated clean-room final local acceptance
```

Binding and supporting authority:

- `backlog/bws_full_implementation.csv`
- `backlog/bws_remaining_safe_local_map.csv`
- `docs/034_remaining_operator_runtime_implementation_program.md`
- `docs/039_release_deployment_and_upgrade_contract.md`
- `docs/040_soak_failure_injection_and_operator_acceptance.md`
- `docs/041_external_runtime_preflight_and_bws600_campaign.md`
- `docs/042_release_packaging_implementation_blueprint.md`
- `docs/043_upgrade_rollback_recovery_implementation_blueprint.md`
- `docs/044_soak_failure_injection_implementation_blueprint.md`
- `docs/045_external_runtime_preflight_implementation_blueprint.md`
- `docs/046_final_local_acceptance_implementation_blueprint.md`

The implementation controller selects the first dependency-ready `PENDING` row, implements the largest safe cohesive tranche, validates each parent row separately, updates evidence/ledger and continues through `BWS-599`.

It must not modify the betting-win checkout, copy provider adapters, invent upstream contracts/commits, use direct provider endpoints/credentials, write betting-win `core.*`, add execution paths, silently fall back between upstream modes or mark tasks validated without proof.

The protected wrapper and paper-controller integration phase is complete. Current `BWS-590` through `BWS-599` implementation authorizes no protected automation changes.

`BWS-600` remains external and `BWS-900` remains separately authorized.
