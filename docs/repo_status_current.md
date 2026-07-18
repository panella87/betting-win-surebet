# Current Repository Status

```text
repo=betting-win-surebet
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
status=RUNTIME_EVIDENCE_READY
repo_role=surebet_strategy_application
upstream_platform=betting-win
current_task=BWS-600
current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
safe_local_terminal_gate=BWS-599
provider_truth_owner=betting-win
canonical_history_owner=betting-win
strategy_state_owner=betting-win-surebet
account_policy=separate_from_betting-win-betting
execution_gate=closed
```

## Binding state

`BWS-100` through `BWS-593` are validated. The previous autonomous campaign truthfully closed `BWS-580`, the latest autonomous campaign closed `BWS-581` by adding a long-running explicit-mode upstream convergence service with durable state, overlap defense, signal-aware shutdown and machine-readable evidence, the follow-on cycle closed `BWS-582` by adding long-running scheduler and worker services with restart-safe state, queue backpressure, lease renewal and graceful drain behavior, the next cycle closed `BWS-583` by serving the built cockpit on loopback through the managed runtime with explicit API-mode build verification, independent readiness reporting and failure-closed asset validation, the following cycle closed `BWS-584` by expanding product-owned lifecycle control to the complete BWS stack with exact multi-role ownership, ordered shutdown, crash recovery and `/proc` identity verification, the next cycle closed `BWS-585` by adding product-owned migration status, backup, restore-verification and bounded retention commands with disposable PostgreSQL proof, the following cycle closed `BWS-586` by adding structured role logs, loopback metrics, read-only diagnostics bundles and an append-only evidence index, the next cycle closed `BWS-587` by wiring the protected root wrappers to the product-owned lifecycle, runtime summary, and structured runtime logs, the following cycle closed `BWS-588` by upgrading paper evaluation to an explicit runtime-evidence controller with exact stack ownership checks and bounded local-only evidence collection, the next cycle closed `BWS-589` by promoting paper autopilot into a runtime-evidence parent that preserves selected upstream mode, runtime campaign identity and source-fix re-evaluation state through atomic child-result handoffs, the following cycle closed `BWS-590` by adding deterministic private release packaging, Node 20 and PostgreSQL preflight, secret-safe environment templating, non-privileged user-service templates and non-mutating install verification with tamper rejection, the following cycle closed `BWS-591` by adding deterministic upgrade planning, checkpointed apply/recovery, rollback-decision classification and disposable restore-bound recovery proof, and the latest cycle closed `BWS-592` plus `BWS-593` by adding deterministic managed-runtime soak evidence, bounded failure injection, cleanup verification, exact-mode runtime preflight, and the external campaign-manifest generator.

The safe-local implementation program is complete through `BWS-599`. No additional local product tranche is currently binding. The remaining application boundary is the externally gated `BWS-600` API runtime-evidence campaign:

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

The binding queue is `backlog/bws_full_implementation.csv`; the supporting detailed map is `backlog/bws_remaining_safe_local_map.csv`. `BWS-599` is validated and no dependency-ready safe-local `PENDING` row remains. `BWS-600` is the active external operator-approved runtime-evidence gate.

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

## Remaining queue

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

The reviewed `BWS-587` through `BWS-589` integration phase is complete. The current release, recovery, soak, preflight and final-acceptance queue authorizes no protected automation changes.

```text
automation_maintenance_allowed=no
allowed_protected_files=none
```

Do not set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`. Any protected change is a blocker unless a new external overlay first updates the binding task source.

## Routing

```text
selected_controller=run-paper-autopilot.sh
selected_task_source=docs/041_external_runtime_preflight_and_bws600_campaign.md
force_unlock=no_evidence
paper_autopilot=selected_for_bws_600_runtime_evidence
```

## Safety

Direct provider connections, provider credentials, betting-win `core.*` writes, public signals, profitability claims and execution paths remain prohibited. Runtime work must stay private, loopback-only where BWS owns listeners, explicit-mode and fail closed.

## Standard automation status

```text
run_autonomous_implementation=standardized_not_selected_no_known_implementation_queue
run_autonomous_bugfix=standardized_standalone_audit
run_bugfix_autopilot=standardized_parent_for_broad_audit_and_repair
run_paper_evaluation=fixture_and_runtime_evidence_validated_bws_588
run_paper_autopilot=standardized_and_selected_for_bws_600_runtime_evidence
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
post_overlay_controller=run-paper-autopilot.sh
paper_runtime_env_loader=selective_root_wrapper_env
paper_runtime_env_precedence=explicit_process_then_dotenv_fill
paper_runtime_schedule=operator_approved_repo_local_manifest
paper_runtime_policy=enforced_api_paper_provider_disabled_execution_false
paper_runtime_retired_inputs=export_selectors_and_pinned_bundle_scrubbed
paper_runtime_start_gate=api_health_observable_readiness_observed
paper_runtime_evidence_command_timeout=duration_plus_300s
source_fingerprint_runtime_exclusion=enabled
runtime_evidence_failure_stage=bounded_redacted
```

The safe-local product implementation remains accepted. The root runtime wrapper now treats API transport, paper mode, provider-disabled operation, and execution-disabled operation as controller-owned invariants; private `.env` values only fill missing non-policy configuration and cannot override an explicit shell value. It also passes the explicit operator-approved repo-local private-paper schedule path; it does not invent a fixture or fallback schedule. Runtime-evidence start records a managed stack once the API health endpoint is observable; blocked readiness is measured inside the evidence window instead of aborting startup. The runtime-evidence managed-command timeout follows the requested evidence duration plus a fixed 300-second margin. The next normal route is the BWS-600 runtime-evidence parent; the repository temp/inode guard remains a mandatory startup preflight.
## API-only upstream transport

The BWS runtime consumes betting-win only through its accepted read-only API. `BWS_UPSTREAM_MODE` and the file-export runtime selector are removed. Missing API readiness is a runtime-evidence blocker; there is no automatic file fallback.

