# Current Repository Status

```text
repo=betting-win-surebet
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
status=IMPLEMENTATION_READY
repo_role=surebet_strategy_application
upstream_platform=betting-win
current_task=BWS-100
current_task_status=PENDING
safe_local_terminal_gate=BWS-510
provider_truth_owner=betting-win
canonical_history_owner=betting-win
strategy_state_owner=betting-win-surebet
account_policy=separate_from_betting-win-betting
execution_gate=closed
```

## Binding state

The old local-fixture-complete stop state is superseded. The repo contains a deterministic bootstrap, not the complete BWS platform. The supplied betting-win repo provides concrete upstream contracts and application patterns, so a substantial safe local implementation queue exists.

The binding queue is `backlog/bws_full_implementation.csv`. The first dependency-ready task is `BWS-100`.

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

The archive has no Git commit metadata and no BW source manifest. `BWS-100` must verify the actual server checkout read-only and generate the exact runtime lock.

## Existing source

The current `src/` tree supplies bootstrap behavior for local bundle parsing, identity/rule prechecks, terminal cash flows, quote capacity/fees/freshness, fixed-point stake vectors, partial completion, residual exposure, settlement replay, and private report assembly. Compatibility tests must preserve it during migration.

## Implementation queue

Safe local work remains through `BWS-510`. Historical SURE-002A and SURE-002B completion does not stop the active program.

```text
selected_controller=run-autonomous-implementation.sh
selected_task_source=docs/automation/current-implementation-task.md
force_unlock=no_evidence
paper_autopilot=not_selected_until_local_platform_complete
```

## Safety

Direct provider connections, provider credentials, betting-win `core.*` writes, public signals, profitability claims, and execution paths remain prohibited. A typed read-only betting-win client and exact upstream compatibility tooling are required and allowed.

## Standard automation status

```text
run_autonomous_implementation=standardized_and_selected
run_autonomous_bugfix=standardized_standalone_audit
run_paper_evaluation=retained_fixture_evaluator_not_initial_router
run_paper_autopilot=standardized_parent_for_post_implementation_runtime_convergence
run_bugfix_autopilot=standardized_parent_for_broad_audit_and_repair
autopilot_child_telegram=disabled
autopilot_parent_telegram=final_only
standalone_controller_telegram=enabled_by_default
```

`docs/imported-from-betting-win/` must remain absent. Historical research stays under dedicated legacy archive paths.
