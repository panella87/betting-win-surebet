# Current implementation task

Repository: `betting-win-surebet`.

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-600
current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
active_implementation_queue=none
safe_local_terminal_gate=BWS-599
external_runtime_gate=BWS-600
post_overlay_controller=run-paper-autopilot.sh
```

## Campaign objective

No local source implementation queue is currently binding.

The safe-local product queue through `BWS-599` remains validated. The bounded `BWS-600_UPSTREAM_API_PREFLIGHT_SOURCE_FIX` is present in source: BWS now preflights the upstream `betting-win` read-only API before it starts or attaches to the BWS managed stack for `paper-runtime-evidence`.

The next binding work is the external `BWS-600` runtime-evidence campaign. It may run only after the operator starts and approves the real `betting-win` read-only API. BWS must not start, stop, clone, reset, clean, commit, or otherwise mutate the `betting-win` checkout or service.

```text
bws600_source_fix=BWS-600_UPSTREAM_API_PREFLIGHT_SOURCE_FIX_PRESENT
betting_win_api_preflight_required=before_bws_runtime_evidence_window
bws_local_api_4312_does_not_satisfy_upstream_preflight=true
run_paper_autopilot_after_source_fix=true
selected_controller=run-paper-autopilot.sh
```

`127.0.0.1:4312`, `localhost:4312`, and other loopback aliases for the configured BWS local API are BWS listeners only. They must never be accepted as proof that the upstream `betting-win` API is available.

## Required reading

1. `AGENTS.md`
2. `docs/repo_status_current.md`
3. `docs/automation/README.md`
4. `docs/034_remaining_operator_runtime_implementation_program.md`
5. `docs/automation/api-only-upstream.md`
6. `docs/automation/paper-autopilot.md`
7. `docs/041_external_runtime_preflight_and_bws600_campaign.md`
8. `backlog/bws_full_implementation.csv`
9. `backlog/bws_remaining_safe_local_map.csv`
10. `docs/042_release_packaging_implementation_blueprint.md`
11. `docs/043_upgrade_rollback_recovery_implementation_blueprint.md`
12. `docs/044_soak_failure_injection_implementation_blueprint.md`
13. `docs/045_external_runtime_preflight_implementation_blueprint.md`
14. `docs/046_final_local_acceptance_implementation_blueprint.md`

The validated service, database, observability, wrapper and paper-controller contracts in `docs/035` through `docs/041` remain binding carry-forward requirements.

## Verified carry-forward state

`BWS-100` through `BWS-599` are validated, including `BWS-592` soak/failure injection, `BWS-593` external runtime preflight, and `BWS-599` final local acceptance. Preserve their contracts. Do not reimplement or weaken validated functionality merely to create work.

`BWS-600` remains externally gated. The source-side fail-fast preflight now improves evidence when the required upstream `betting-win` read-only API is unavailable, malformed, incompatible, non-loopback, credential-bearing, or pointed at the local BWS API.

## Remaining sequence

```text
BWS-600_UPSTREAM_API_PREFLIGHT_SOURCE_FIX  source implementation present and maintained
BWS-600_RUNTIME_EVIDENCE                  run paper autopilot after the operator starts/approves the betting-win read-only API
BWS-900                                   parked until separate execution authorization
```

## Protected automation authorization

The protected wrapper and paper-controller integration tasks are complete. No protected automation edit is authorized by the current state.

```text
automation_maintenance_allowed=no
allowed_protected_files=none
```

Rules:

- Do not set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1` for this campaign.
- Do not edit protected automation files unless a later external overlay explicitly changes this task source and names the exact allowlist.
- Do not broaden authorization from inside an autonomous cycle.

## Controller selection

```text
selected_controller=run-paper-autopilot.sh
force_unlock_required=no
campaign_duration=7d
paper_child_duration=72h
implementation_child_duration=72h
```

Paper autopilot remains the parent because it owns the `paper -> runtime evidence -> source issue -> implementation -> paper` loop. If the new upstream API preflight finds the real `betting-win` API absent or incompatible, the run must fail fast with retained bounded non-secret evidence, not spend 72 hours collecting BWS-only degraded evidence.

## External runtime gate

The operator must provide the real upstream API availability. BWS may probe it through the approved read-only API URL. BWS must not start, stop, or mutate the upstream service.

Required runtime boundary:

```text
BETTING_WIN_REPO_PATH=existing_read_only_checkout
betting_win_checkout_mutation=prohibited
betting_win_service_start_by_bws=prohibited
betting_win_service_stop_by_bws=prohibited
bws_local_api_port_4312=not_upstream_api_evidence
provider_connections=prohibited
provider_credentials=prohibited
direct_betting_win_core_writes=prohibited
direct_betting_win_database_reads=prohibited
execution=prohibited
public_signals=prohibited
profitability_claims=prohibited
automatic_upstream_mode_fallback=prohibited
file_export_fallback=prohibited
secret_output=prohibited
pre_existing_service_mutation=prohibited
```

Do not clone the betting-win checkout. Do not invent a contract, endpoint, acceptance result or external runtime evidence.

## API-only upstream transport

The BWS runtime consumes betting-win only through its accepted read-only API. `BWS_UPSTREAM_MODE` and the file-export runtime selector are removed. Missing upstream API readiness must fail fast before the long BWS runtime-evidence window; there is no automatic file fallback.
