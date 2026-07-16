# 028 - Full implementation program

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-590
safe_local_terminal_gate=BWS-599
external_runtime_gate=BWS-600
execution_gate=BWS-900
```

Objective: implement every safe local component required for a private operator-runnable continuous private-paper and surebet backtest application on betting-win.

The validated program includes the TypeScript workspace migration and bounded continuous private-paper component foundation. `BWS-100` through `BWS-588` are validated foundations. `BWS-580` closed the loopback runtime handoff milestone, `BWS-581` closed long-running explicit-mode upstream convergence, `BWS-582` closed long-running scheduler and worker service loops, `BWS-583` closed managed loopback cockpit serving and typed API/UI convergence, `BWS-584` closed complete product-owned lifecycle ownership, `BWS-585` closed safe product-owned database lifecycle, retention, backup and restore verification, `BWS-586` closed structured observability, diagnostics and evidence indexing, `BWS-587` closed protected root lifecycle/progress/log wrapper integration, and `BWS-588` closed standalone service-owned paper runtime evidence. They do not finish the operator service because paper autopilot, release, recovery and soak acceptance remain incomplete.

The remaining program is specified in:

- `docs/034_remaining_operator_runtime_implementation_program.md`
- `docs/035_continuous_service_supervisor_contract.md`
- `docs/036_root_wrappers_and_paper_automation_integration.md`
- `docs/037_database_backup_retention_and_recovery.md`
- `docs/038_observability_metrics_and_evidence_contract.md`
- `docs/039_release_deployment_and_upgrade_contract.md`
- `docs/040_soak_failure_injection_and_operator_acceptance.md`
- `docs/041_external_runtime_preflight_and_bws600_campaign.md`

The implementation controller selects the first dependency-ready `PENDING` row, implements a bounded coherent slice, validates, updates evidence/ledger and continues through `BWS-599`.

It must not modify the betting-win checkout, copy provider adapters, invent upstream contracts/commits, use direct provider endpoints/credentials, write betting-win `core.*`, add execution paths, silently fall back between upstream modes or mark tasks validated without proof.

`BWS-600` remains external and `BWS-900` remains separately authorized.
