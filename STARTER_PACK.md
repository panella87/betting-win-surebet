# betting-win-surebet starter pack

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
repo_role=surebet_strategy_application
upstream_platform=betting-win
current_task=BWS-592
safe_local_terminal_gate=BWS-599
current_live_execution_gate=closed
```

Read:

1. `AGENTS.md`
2. `docs/repo_status_current.md`
3. `docs/MASTER_PLAN.md`
4. `docs/028_full_implementation_program.md`
5. `docs/029_full_implementation_task_ledger.md`
6. `backlog/bws_full_implementation.csv`
7. `backlog/bws_remaining_safe_local_map.csv`
8. `docs/034_remaining_operator_runtime_implementation_program.md`
9. `docs/042_release_packaging_implementation_blueprint.md`
10. `docs/043_upgrade_rollback_recovery_implementation_blueprint.md`
11. `docs/044_soak_failure_injection_implementation_blueprint.md`
12. `docs/045_external_runtime_preflight_implementation_blueprint.md`
13. `docs/046_final_local_acceptance_implementation_blueprint.md`
14. `docs/automation/current-implementation-task.md`

Use `run-autonomous-implementation.sh` for `BWS-592` through `BWS-599`. The protected integration phase is complete, so the current campaign does not set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`.

Route to paper autopilot only after blueprint reconciliation proves no safe local implementation row remains, or for the later accepted `BWS-600` runtime campaign.
