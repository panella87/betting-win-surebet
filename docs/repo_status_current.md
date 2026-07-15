# Current Repository Status

```text
repo=betting-win-surebet
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
status=SAFE_LOCAL_COMPLETE
repo_role=surebet_strategy_application
upstream_platform=betting-win
current_task=BWS-510
current_task_status=VALIDATED
safe_local_terminal_gate=BWS-510
provider_truth_owner=betting-win
canonical_history_owner=betting-win
strategy_state_owner=betting-win-surebet
account_policy=separate_from_betting-win-betting
execution_gate=closed
```

## Binding state

The old local-fixture-complete stop state is superseded. The repo now contains the validated safe local BWS platform through the BWS-510 terminal gate. Continuous private-paper runtime against an accepted betting-win deployment remains externally blocked at BWS-600.

The binding queue is `backlog/bws_full_implementation.csv`. `BWS-100`, `BWS-110`, `BWS-120`, `BWS-130`, `BWS-140`, `BWS-200`, `BWS-210`, `BWS-220`, `BWS-230`, `BWS-240`, `BWS-300`, `BWS-310`, `BWS-320`, `BWS-400`, `BWS-410`, `BWS-420`, `BWS-500`, and `BWS-510` are validated. `BWS-600` remains blocked on accepted betting-win continuous read-only runtime evidence.

## Verified upstream facts

```text
upstream_archive_sha256=9a9eee490918ff69182acdaa302d216859a5009b0943adb41e56171c1ee9ef8f
upstream_package_version=0.48.0
strategy_export_schema=betting-win.strategy-export.v1
strategy_export_alias=betting-win-strategy-export.v1
surebet_profile=surebet_standard_binary_v0
provider_history_export_kind=pinned_provider_history_bundle
downstream_consumption_proof=present
read_only_query_api=present
api_web_workers=present
```

The archive has no Git commit metadata and no BW source manifest. `BWS-100` verifies the existing server checkout's committed `HEAD` read-only and generates the exact runtime lock. Dirty or untracked working-tree state is excluded from the pin; BWS must not clone, clean, reset, or otherwise modify the upstream checkout.

## Existing source

The bootstrap behavior now lives under `packages/bootstrap` and `packages/upstream`, `apps/web` now provides the validated operator cockpit surface, and `src/` remains as compatibility shims for local bundle parsing, identity/rule prechecks, terminal cash flows, quote capacity/fees/freshness, fixed-point stake vectors, partial completion, residual exposure, settlement replay, reporting, and upstream lock tooling.

## Implementation queue

Safe local implementation is complete through `BWS-510`. `BWS-600` remains blocked on accepted betting-win continuous read-only runtime evidence. Historical SURE-002A and SURE-002B completion does not stop the active program.

```text
selected_controller=run-paper-autopilot.sh
selected_task_source=docs/012_runbook.md
force_unlock=no_evidence
paper_autopilot=selected_after_bws_510_validation
```

## Safety

Direct provider connections, provider credentials, betting-win `core.*` writes, public signals, profitability claims, and execution paths remain prohibited. A typed read-only betting-win client and exact upstream compatibility tooling are required and allowed.

## Standard automation status

```text
run_autonomous_implementation=standardized_safe_local_goal_complete
run_autonomous_bugfix=standardized_standalone_audit
run_paper_evaluation=retained_fixture_evaluator_not_initial_router
run_paper_autopilot=standardized_and_selected_for_post_implementation_runtime_convergence
run_bugfix_autopilot=standardized_parent_for_broad_audit_and_repair
autopilot_child_telegram=disabled
autopilot_parent_telegram=final_only
standalone_controller_telegram=enabled_by_default
```

`docs/imported-from-betting-win/` must remain absent. Historical research stays under dedicated legacy archive paths.
