# PROJECT_STATUS

## Active B1 implementation status

The operator has explicitly opened `BWS-700` as a research/offline implementation authority for B1 cross-venue arbitrage falsification. This does not mark `BWS-600` runtime evidence complete and does not authorize execution. The next controller is `run-autonomous-implementation.sh` against `docs/automation/current-implementation-task.md` and the B1 backlog.

The expected implementation outcome is as much dependency-ready B1 source, persistence, API, cockpit and validation work as can be completed safely. The real upstream B1 API intake remains blocked on `betting-win.b1_multi_venue_markets.v1`.


```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
parent_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
status=B1_IMPLEMENTATION_READY
repo_role=surebet_strategy_application
current_task=BWS-700
current_task_status=READY_FOR_IMPLEMENTATION
active_implementation_queue=backlog/bws_b1_cross_venue_implementation.csv
safe_local_completion_gate=BWS-599
external_runtime_gate=BWS-600
bws600_status=RUNTIME_EVIDENCE_READY
bws600_current_task=BWS-600
bws600_current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
selected_controller=run-autonomous-implementation.sh
bws600_selected_controller=run-paper-autopilot.sh
execution_gate=closed
```


## Three-repo ownership carry-forward markers

```text
repo_role=surebet_strategy_application
provider_truth_owner=betting-win
canonical_history_owner=betting-win
strategy_state_owner=betting-win-surebet
backtesting_owner=betting-win-surebet
paper_mode_owner=betting-win-surebet
future_live_decision_owner=betting-win-surebet_after_explicit_gate
account_policy=separate_from_betting-win-betting
```

These markers preserve the accepted three-repo boundary while the new BWS-700 B1 research/offline queue is active.

## Validated

- Exact committed-HEAD upstream lock and compatibility proof.
- Workspace packages, `surebet.*` persistence, immutable intake and typed read-only client.
- Identity, opportunity, solver, completion/exposure, settlement, backtest and private-paper engines.
- Read-only API, bounded workers, operator cockpit, API-only convergence and loopback acceptance.
- Long-running convergence, scheduler and worker services with complete product-owned lifecycle ownership.
- Database backup/restore/retention, structured observability, diagnostics and evidence indexing.
- Root lifecycle/progress/log wrappers, service-owned paper evaluation and runtime-evidence paper autopilot.
- Hardened controller infrastructure with atomic child results, truthful lock finalization and parent-only Telegram routing.

## Validated safe local work

```text
BWS-590=VALIDATED_RELEASE_DEPLOYMENT
BWS-591=VALIDATED_UPGRADE_ROLLBACK_RECOVERY
BWS-592=VALIDATED_SOAK_FAILURE_INJECTION
BWS-593=VALIDATED_EXTERNAL_RUNTIME_PREFLIGHT
BWS-599=VALIDATED_FINAL_LOCAL_ACCEPTANCE
```

The short documentation map is `docs/000_documentation_index.md`. Detailed dependency history remains in `backlog/bws_remaining_safe_local_map.csv` and the retained implementation blueprints are `docs/042` through `docs/046`.

## Blocked or parked

- `BWS-600` now requires accepted operator-approved continuous read-only betting-win runtime evidence. The source-side fail-fast upstream API preflight is present and prevents BWS from treating its local API as upstream evidence.
- `BWS-900` requires separate execution authorization and remains parked.

## Controller selection

The active controller and helper surface are the standardized repo scripts documented in `docs/automation/README.md`. Obsolete helpers such as `run-paper-evaluation-12h.sh` and `stop-autonomous-run.sh` must remain absent.

```text
selected_controller=run-autonomous-implementation.sh
selected_task=BWS-700
implementation_queue=backlog/bws_b1_cross_venue_implementation.csv
paper_autopilot_selected=not_selected_while_bws700_queue_is_active
bws600_paper_autopilot_route=available_after_operator_approved_upstream_api_and_no_binding_implementation_queue
bugfix_autopilot_selected=no
force_unlock_required=no_evidence
automation_maintenance_allowed=no
```

## Automation filesystem safety

```text
repository_temp_sessions=.automation/tmp/sessions
free_byte_preflight=required
free_inode_preflight=required
per_run_inode_budget=required
watchdog=enabled
cleanup_command=cleanup_automation_temp_inode_residue.sh
next_controller=run-autonomous-implementation.sh
```
## API-only upstream transport

The BWS runtime consumes betting-win only through its accepted read-only API. `BWS_UPSTREAM_MODE` and the file-export runtime selector are removed. Missing API readiness is a runtime-evidence blocker; there is no automatic file fallback. The root runtime wrapper enforces paper mode, provider-disabled operation, and execution-disabled operation, uses explicit process values before selective `.env` fill, derives internal PostgreSQL settings from the canonical `POSTGRES_*` tuple, uses repo-owned defaults for internal runtime settings, and scrubs retired export and pinned-bundle runtime inputs. It does not invent private-paper manifest content.
