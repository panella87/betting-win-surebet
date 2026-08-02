# Current implementation task

Repository: `betting-win-surebet`.

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
parent_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-700
current_task_status=READY_FOR_IMPLEMENTATION
active_implementation_queue=backlog/bws_b1_cross_venue_implementation.csv
active_implementation_map=backlog/bws_b1_cross_venue_map.csv
selected_controller=run-autonomous-implementation.sh
post_overlay_controller=run-autonomous-implementation.sh
safe_local_terminal_gate=BWS-599
external_runtime_gate=BWS-600
execution_gate=BWS-900_PARKED
operator_approval=explicit_2026_08_02
```

## Campaign objective

Open and implement as much as safely possible from the B1 cross-venue offline falsification program. The controller should start from the documented `BWS-700` queue and continue through the largest dependency-ready cohesive tranche without touching live execution, provider integrations, `betting-win` source state, or protected automation.

The implementation is research/offline/private-paper only. It must build deterministic B1 contracts, equivalence checks, quote synchronization, gross/net spread logic, generalized stake vectors, fill/rejection/timeout simulation, settlement false-positive analysis, offline falsification reports, private read-only API/cockpit surfaces and acceptance/kill criteria where dependencies allow.

The real upstream intake task, `BWS-710`, remains blocked until `betting-win` exposes an accepted read-only `betting-win.b1_multi_venue_markets.v1` resource. The controller may implement local contract skeletons and deterministic fixtures, but fixtures must never be treated as upstream runtime evidence or live readiness.

## Required reading

1. `AGENTS.md`
2. `README.md`
3. `docs/repo_status_current.md`
4. `docs/000_documentation_index.md`
5. `docs/047_b1_cross_venue_offline_falsification_program.md`
6. `docs/048_b1_upstream_contract.md`
7. `docs/049_b1_market_equivalence.md`
8. `docs/050_b1_falsification_acceptance.md`
9. `docs/051_b1_implementation_map.md`
10. `docs/052_b1_future_strategy_stubs.md`
11. `backlog/bws_b1_cross_venue_implementation.csv`
12. `backlog/bws_b1_cross_venue_map.csv`
13. `docs/041_external_runtime_preflight_and_bws600_campaign.md`
14. `backlog/bws_full_implementation.csv`
15. `backlog/bws_remaining_safe_local_map.csv`
16. `docs/034_remaining_operator_runtime_implementation_program.md`
17. `docs/042_release_packaging_implementation_blueprint.md`
18. `docs/043_upgrade_rollback_recovery_implementation_blueprint.md`
19. `docs/044_soak_failure_injection_implementation_blueprint.md`
20. `docs/045_external_runtime_preflight_implementation_blueprint.md`
21. `docs/046_final_local_acceptance_implementation_blueprint.md`

## Verified carry-forward state

Validated safe-local terminal markers retained for existing BWS full-platform validators:

```text
BWS-592=VALIDATED_SOAK_FAILURE_INJECTION
BWS-593=VALIDATED_EXTERNAL_RUNTIME_PREFLIGHT
BWS-599=VALIDATED_FINAL_LOCAL_ACCEPTANCE
```

`BWS-100` through `BWS-599` are validated and must not be reopened. The same-venue standard-binary complete-set platform, API-only upstream runtime contract, private paper runtime, persistence, read-only API, cockpit, observability, release/recovery/soak/final-acceptance and source-manifest discipline are carry-forward foundations.

`BWS-600` remains an external runtime-evidence gate for the accepted platform. It is not the B1 authority and must not be represented as complete unless the operator supplies accepted runtime evidence from a real `betting-win` read-only API.

Carry-forward BWS-600 markers for validators and routing context:

```text
bws600_current_task=BWS-600
bws600_current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
bws600_active_implementation_queue=none
bws600_selected_controller=run-paper-autopilot.sh
bws600_safe_local_terminal_gate=BWS-599
betting_win_api_preflight_required=before_bws_runtime_evidence_window
run_paper_autopilot_after_source_fix=true
selected_task_source=docs/041_external_runtime_preflight_and_bws600_campaign.md
backlog/bws_full_implementation.csv
backlog/bws_remaining_safe_local_map.csv
```


BWS-600 runtime-evidence carry-forward environment marker for existing validators and operator routing:

```text
BETTING_WIN_REPO_PATH=existing_read_only_checkout
bws600_BETTING_WIN_REPO_PATH_required=yes
```

## Dependency rules

```text
BWS-700=authority_docs_validators_queue
BWS-705=local_contract_skeleton_allowed
BWS-710=blocked_until_accepted_betting_win_b1_multi_venue_api
BWS-720_through_BWS-790=offline_deterministic_design_allowed_after_local_contract_skeleton
BWS-800_through_BWS-820=private_reporting_and_evidence_allowed_without_execution
BWS-830=parked_future_F_design_stub_only
BWS-840=parked_future_C_G_design_stubs_only
```

## Protected automation authorization

No protected automation edit is authorized by this B1 implementation task.

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
selected_controller=run-autonomous-implementation.sh
force_unlock_required=no
campaign_duration=72h
recommended_cycle_timeout=6h
validation_timeout=45m
```

Use the parent implementation controller only. Do not invent `--task` or `--prompt-file`. The task authority is this file plus the B1 docs and backlog files.

## Safety

```text
provider_connections=prohibited
provider_credentials=prohibited
raw_provider_ingestion=prohibited
betting_win_checkout_mutation=prohibited
betting_win_core_writes=prohibited
direct_betting_win_database_reads=prohibited
file_export_runtime_fallback=prohibited
fixture_runtime_fallback=prohibited
execution=prohibited
public_signals=prohibited
profitability_claims=prohibited
BWS-900=parked
```

Do not clone the betting-win checkout. Do not invent an upstream B1 contract, endpoint, acceptance result or external runtime evidence. If the real upstream B1 API is absent, implement dependency-ready offline surfaces and record the remaining blocker truthfully.
# BWS-600 carry-forward runtime boundary markers

```text
betting_win_service_start_by_bws=prohibited
betting_win_service_stop_by_bws=prohibited
bws_local_api_port_4312=not_upstream_api_evidence
direct_betting_win_core_writes=prohibited
direct_betting_win_database_reads=prohibited
automatic_upstream_mode_fallback=prohibited
secret_output=prohibited
pre_existing_service_mutation=prohibited
```
# Upstream lock carry-forward proof markers

```text
prove the betting-win committed HEAD remains unchanged
no placeholder fields
no clone or temporary worktree
```
