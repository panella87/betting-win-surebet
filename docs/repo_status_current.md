# Current Repository Status

## Active B1 binding state

The active source implementation route is now `BWS-700` for `BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1`. This is an explicit operator-approved research/offline authority based on the OpenAlex B1 blueprint. It does not supersede the accepted BWS full-platform foundation and does not complete the external `BWS-600` runtime-evidence gate.

```text
b1_authority=opened
b1_queue=backlog/bws_b1_cross_venue_implementation.csv
b1_map=backlog/bws_b1_cross_venue_map.csv
b1_controller=run-autonomous-implementation.sh
b1_real_upstream_intake=BWS-710_BLOCKED_UNTIL_BETTING_WIN_CONTRACT
b1_execution=prohibited
b1_public_signals=prohibited
b1_profitability_claims=prohibited
```


```text
repo=betting-win-surebet
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
parent_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
status=B1_IMPLEMENTATION_READY
repo_role=surebet_strategy_application
upstream_platform=betting-win
current_task=BWS-700
current_task_status=READY_FOR_IMPLEMENTATION
active_implementation_queue=backlog/bws_b1_cross_venue_implementation.csv
active_implementation_map=backlog/bws_b1_cross_venue_map.csv
selected_controller=run-autonomous-implementation.sh
safe_local_terminal_gate=BWS-599
external_runtime_gate=BWS-600
bws600_status=RUNTIME_EVIDENCE_READY
bws600_current_task=BWS-600
bws600_current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
provider_truth_owner=betting-win
canonical_history_owner=betting-win
strategy_state_owner=betting-win-surebet
account_policy=separate_from_betting-win-betting
execution_gate=closed
BWS-900=parked
```

## Binding state

`BWS-100` through `BWS-599` are validated. The earlier autonomous cycles closed `BWS-580`, `BWS-581` and the foundation, domain, persistence, upstream-lock, API, cockpit, long-running service, lifecycle, database, observability, root-wrapper and paper-automation layers through `BWS-589`; later cycles closed deterministic private release packaging, upgrade/rollback/recovery, soak/failure injection, exact-mode external runtime preflight and final local acceptance through `BWS-599`.

The safe-local implementation program is complete through `BWS-599`. The bounded source-fix tranche for the later `BWS-600` runtime-evidence campaign is present. It prevents BWS from treating its own API on `127.0.0.1:4312` as upstream `betting-win` evidence and fails fast before the 72-hour evidence window when the upstream `betting-win` read-only API is unavailable. The current selected source route is the `BWS-700` B1 implementation queue; the BWS-600 API runtime-evidence campaign remains externally gated:

```text
start.sh=validated_product_owned_lifecycle_start
stop.sh=validated_product_owned_lifecycle_stop
progress/log helpers=validated_automation_and_runtime_state
paper evaluation=runtime_evidence_mode_validated
paper autopilot=runtime_evidence_parent_validated
database backup/restore/retention=validated_product_commands_present
release packaging=validated
upgrade/recovery=validated
soak/failure injection=validated
external preflight=validated
final acceptance=validated
```

The active binding queue is `backlog/bws_b1_cross_venue_implementation.csv`; the active implementation map is `backlog/bws_b1_cross_venue_map.csv`. The full-platform queue `backlog/bws_full_implementation.csv` and map `backlog/bws_remaining_safe_local_map.csv` are validated carry-forward history through `BWS-599`. `BWS-600` remains an external operator-approved runtime-evidence gate, but it is not the selected controller route while `BWS-700` is active.

Documentation slimming is complete for the active operator map: `docs/000_documentation_index.md` is the compact routing entry point, stale completion snapshots were removed, and BWS-599 carry-forward contracts plus legacy research archives remain retained.

## Validated upstream facts

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

`BWS-100` verifies the existing betting-win checkout's committed `HEAD` read-only. Uncommitted upstream state is excluded from the pin; BWS must not clone, clean, reset, commit or modify that checkout.

## Existing source

The validated source under `packages/bootstrap`, `packages/persistence`, `packages/upstream`, `apps/web` and compatibility `src/` shims includes the domain engine, `surebet.*` persistence, immutable export intake, API-only convergence passes, a long-running explicit-mode upstream convergence service, typed read-only client, bounded private-paper runtime, strategy ledger, read-only API, bounded workers, cockpit, managed loopback cockpit serving, runtime configuration, loopback acceptance, complete full-stack lifecycle evidence and runtime handoff packaging.

## Gate state

```text
BWS-581=VALIDATED_LONG_RUNNING_UPSTREAM_SERVICE
BWS-582=VALIDATED_LONG_RUNNING_SCHEDULER_WORKER_SERVICES
BWS-583=VALIDATED_MANAGED_COCKPIT_AND_FULL_STACK_CONVERGENCE
BWS-584=VALIDATED_COMPLETE_PRODUCT_LIFECYCLE
BWS-585=VALIDATED_DATABASE_BACKUP_RETENTION_RESTORE
BWS-586=VALIDATED_OBSERVABILITY_DIAGNOSTICS_EVIDENCE
BWS-587=VALIDATED_ROOT_WRAPPER_INTEGRATION
BWS-588=VALIDATED_SERVICE_OWNED_PAPER_EVALUATION
BWS-589=VALIDATED_RUNTIME_EVIDENCE_PAPER_AUTOPILOT
BWS-590=VALIDATED_RELEASE_DEPLOYMENT
BWS-591=VALIDATED_UPGRADE_ROLLBACK_RECOVERY
BWS-592=VALIDATED_SOAK_FAILURE_INJECTION
BWS-593=VALIDATED_EXTERNAL_RUNTIME_PREFLIGHT
BWS-599=VALIDATED_FINAL_LOCAL_ACCEPTANCE
BWS-600=BLOCKED_EXTERNAL_ACCEPTED_RUNTIME
BWS-900=PARKED_EXECUTION
```

## Protected automation authorization

The reviewed `BWS-587` through `BWS-589` integration phase is complete. The current `BWS-700` B1 implementation task authorizes no protected automation changes.

```text
automation_maintenance_allowed=no
allowed_protected_files=none
```

Do not set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`. Any protected change is a blocker unless a new external overlay first updates the binding task source.

## Routing

```text
selected_controller=run-autonomous-implementation.sh
selected_task_source=docs/automation/current-implementation-task.md
active_implementation_queue=backlog/bws_b1_cross_venue_implementation.csv
force_unlock=no_evidence
paper_autopilot=not_selected_while_bws700_queue_is_active
bws600_paper_autopilot=available_after_upstream_api_preflight_and_no_binding_implementation_queue
```

## Safety

Direct provider connections, provider credentials, betting-win `core.*` writes, public signals, profitability claims and execution paths remain prohibited. Runtime work must stay private, loopback-only where BWS owns listeners, explicit-mode and fail closed.

## Standard automation status

```text
run_autonomous_implementation=standardized_selected_for_bws700_b1_implementation
run_autonomous_bugfix=standardized_standalone_audit
run_bugfix_autopilot=standardized_parent_for_broad_audit_and_repair
run_paper_evaluation=fixture_and_runtime_evidence_validated_bws_588
run_paper_autopilot=available_for_bws600_after_upstream_api_preflight
bws600_run_autonomous_implementation=standardized_not_selected_no_known_implementation_queue
bws600_run_paper_autopilot=selected_for_bws600_runtime_evidence_after_upstream_api_preflight
standalone_controller_telegram=enabled_by_default
autopilot_child_telegram=disabled
autopilot_parent_telegram=final_only
task_file_exact_protected_allowlist=enabled
```

## Temporary-file and inode-safety state

```text
temp_inode_safety=repository_scoped_guard_enabled
managed_temp_base=.automation/tmp
confirmed_direct_leak=tests/bws-paper-runtime-evidence.test.ts
confirmed_direct_leak_status=fixed_with_node_test_teardown
startup_byte_and_inode_preflight=enabled
runtime_capacity_watchdog=enabled
stale_marker_owned_session_recovery=enabled
post_overlay_controller=run-autonomous-implementation.sh
paper_runtime_env_loader=selective_root_wrapper_env
paper_runtime_env_precedence=explicit_process_then_dotenv_fill
paper_runtime_schedule=operator_approved_repo_local_manifest
paper_runtime_policy=enforced_api_paper_provider_disabled_execution_false
paper_runtime_retired_inputs=export_selectors_and_pinned_bundle_scrubbed
paper_runtime_start_gate=api_health_observable_readiness_observed
paper_runtime_evidence_command_timeout=duration_plus_300s
source_fingerprint_runtime_exclusion=enabled
runtime_evidence_failure_stage=bounded_redacted
paper_runtime_build=wrapper_rebuilds_typescript_and_cockpit_before_evidence
lifecycle_start_child_stdio_diagnostics=enabled
paper_runtime_startup_child_logs=bounded_redacted
```

The safe-local product implementation remains accepted. The root runtime wrapper now treats API transport, paper mode, provider-disabled operation, and execution-disabled operation as controller-owned invariants; private `.env` values provide the canonical `POSTGRES_ADDRESS`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` tuple while repo-owned runtime defaults cover internal intervals, worker identity, API transport, cockpit mode, upstream lock path, and the standard private-paper schedule path. Explicit shell values can override approved non-policy settings; legacy URL-style database variables are rejected. The root wrapper rebuilds the TypeScript runtime and managed cockpit assets immediately before paper-runtime-evidence collection so runtime startup does not rely on stale validation output. Runtime-evidence preflights the upstream betting-win read-only API before starting or attaching the BWS stack, rejects the local BWS API on `127.0.0.1:4312` and loopback aliases as upstream evidence, and retains bounded non-secret blocker evidence when unavailable. Runtime-evidence start records a managed stack once the BWS API health endpoint is observable; blocked readiness is measured inside the evidence window instead of aborting startup. If BWS API health never becomes observable, lifecycle startup now retains bounded per-child stdout/stderr log files and reports redacted log tails with the last health/readiness probes. The runtime-evidence managed-command timeout follows the requested evidence duration plus a fixed 300-second margin. That BWS-600 route is carry-forward only while the active BWS-700 implementation queue is binding; the repository temp/inode guard remains a mandatory startup preflight.
## API-only upstream transport

The BWS runtime consumes betting-win only through its accepted read-only API. `BWS_UPSTREAM_MODE` and the file-export runtime selector are removed. Missing upstream API readiness must fail fast before the long BWS runtime-evidence window; there is no automatic file fallback. The BWS local API on `127.0.0.1:4312` is not upstream evidence and cannot satisfy the betting-win API preflight.
