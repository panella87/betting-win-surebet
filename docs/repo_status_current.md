# Current Repository Status

```text
repo=betting-win-surebet
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
status=IMPLEMENTATION_READY
repo_role=surebet_strategy_application
upstream_platform=betting-win
current_task=BWS-520
current_task_status=PENDING
safe_local_terminal_gate=BWS-580
provider_truth_owner=betting-win
canonical_history_owner=betting-win
strategy_state_owner=betting-win-surebet
account_policy=separate_from_betting-win-betting
execution_gate=closed
```

## Binding state

`BWS-100` through `BWS-510` are validated. The previous completion classification was premature for an operator-runnable continuous runtime: the repository contains tested runtime libraries and loopback acceptance, but the root lifecycle still starts no API or worker service and paper evaluation remains single-pass fixture/pinned-bundle only.

The binding queue is `backlog/bws_full_implementation.csv`. `BWS-520` is the first dependency-ready `PENDING` task. Safe local runtime implementation continues through `BWS-580`; `BWS-600` remains the separate external accepted-runtime evidence gate.

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

`BWS-100` verifies the existing betting-win checkout's committed `HEAD` read-only. Uncommitted upstream state is excluded from the pin; BWS must not clone, clean, reset, commit or otherwise modify that checkout.

## Existing source

The validated source under `packages/bootstrap`, `packages/persistence`, `packages/upstream`, `apps/web`, and compatibility `src/` shims already includes the domain engine, `surebet.*` persistence, immutable export intake, typed read-only query client, bounded private-paper runtime, strategy ledger, read-only HTTP handlers, bounded workers, cockpit, runtime configuration and loopback acceptance. It lacks the executable continuous runtime, explicit export/API convergence loops, persistent scheduler, operator lifecycle and integrated long-run evidence required by `BWS-520` through `BWS-580`.

## Implementation queue

```text
BWS-100..BWS-510=VALIDATED
BWS-520=PENDING_EXECUTABLE_API_AND_WORKER
BWS-530=PENDING_CONTINUOUS_EXPORT_CONVERGENCE
BWS-540=PENDING_CONTINUOUS_API_CONVERGENCE
BWS-550=PENDING_CONTINUOUS_SCHEDULER_AND_WORKERS
BWS-560=PENDING_OPERATOR_LIFECYCLE_AND_EVIDENCE
BWS-570=PENDING_RUNTIME_API_COCKPIT_CONVERGENCE
BWS-580=PENDING_CLOSED_STACK_CONTINUOUS_RUNTIME_ACCEPTANCE
BWS-600=BLOCKED_ON_ACCEPTED_BETTING_WIN_RUNTIME
BWS-900=PARKED
```

```text
selected_controller=run-autonomous-implementation.sh
selected_task_source=docs/automation/current-implementation-task.md
force_unlock=no_evidence
paper_autopilot=not_selected_until_bws_580_validation_and_runtime_controller_review
```

## Safety

Direct provider connections, provider credentials, betting-win `core.*` writes, public signals, profitability claims and execution paths remain prohibited. Runtime work must stay loopback-only, private, explicit-mode and fail closed.

## Standard automation status

```text
run_autonomous_implementation=standardized_and_selected_for_continuous_runtime_build
run_autonomous_bugfix=standardized_standalone_audit
run_paper_evaluation=retained_no_service_fixture_evaluator
run_paper_autopilot=standardized_parent_not_selected_while_runtime_source_queue_remains
run_bugfix_autopilot=standardized_parent_for_broad_audit_and_repair
autopilot_child_telegram=disabled
autopilot_parent_telegram=final_only
standalone_controller_telegram=enabled_by_default
```

`docs/imported-from-betting-win/` must remain absent. Historical research stays under dedicated legacy archive paths.
