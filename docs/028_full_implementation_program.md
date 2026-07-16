# 028 - Full implementation program

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-581
safe_local_terminal_gate=BWS-599
external_runtime_gate=BWS-600
execution_gate=BWS-900
```

Objective: implement every safe local component required for a private operator-runnable continuous private-paper and surebet backtest application on betting-win.

The validated program includes the TypeScript workspace migration and bounded continuous private-paper component foundation. `BWS-100` through `BWS-580` are validated foundations. They do not finish the operator service because convergence, scheduler and worker commands are one-shot; the managed lifecycle owns only the API; root wrappers are disconnected; paper controllers remain no-service; and database operations, release, recovery and soak acceptance remain incomplete.

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
