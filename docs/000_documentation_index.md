# 000 - Documentation index

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
parent_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
documentation_index_status=active
documentation_slimming_phase=complete
documentation_curation_wave=73
documentation_inventory_count=107
canonical_active_count=16
supporting_active_count=62
historical_count=28
superseded_count=1
duplicate_count=0
obsolete_count=0
current_task=BWS-600
active_implementation_queue=none
broad_bugfix_campaign_status=COMPLETED_AND_ACCEPTED
broad_bugfix_areas_closed=8_of_8
completed_b1_queue=backlog/bws_b1_cross_venue_implementation.csv
completed_b1_map=backlog/bws_b1_cross_venue_map.csv
bws700_completion_status=DEPENDENCY_READY_LOCAL_IMPLEMENTATION_COMPLETE
b1_dependency_ready_local_rows=VALIDATED_THROUGH_BWS-820
bws710_status=BLOCKED_ACCEPTED_BETTING_WIN_B1_MULTI_VENUE_API_REQUIRED
current_external_gate=BWS-600
safe_local_terminal_gate=BWS-599
execution_gate=BWS-900
```

This file is the complete documentation inventory and ownership map. It classifies every Markdown document retained in the repository, including repo-local Graphify tooling documentation. Current commands and status must not be inferred from historical blueprints, research checkpoints, or compatibility entry points.

## Wave 73 ecosystem integration authority

`docs/002_dependency_contract_with_betting_win.md` is the sole canonical owner of the cross-repository data-plane, B1-resource, execution-SDK, lifecycle, lock, and readiness boundary. Other active documents summarize or apply that contract and must not independently redefine upstream routes, response envelopes, package ownership, or readiness.

```text
betting_win_source_audit=betting-win218(3).zip
betting_win_source_audit_sha256=7b2c3a48bbc4cba95bcace384bb20892916a5958e6477d49651c983b16d11dc2
bws600_wire_contract=not_accepted
bws710_runtime_resource=not_accepted
bws900_execution=parked
```

## Ownership rules

- `docs/002_dependency_contract_with_betting_win.md` owns the canonical cross-repository ecosystem contract.
- `docs/automation/current-implementation-task.md` owns current task and controller routing.
- `docs/repo_status_current.md` owns the detailed current operational state.
- `PROJECT_STATUS.md` is the concise operator-facing status mirror.
- `docs/automation/README.md` owns the standardized automation command surface.
- `docs/autonomous_loop_contract.md` owns implementation-cycle status and request-flag semantics.
- `docs/041_external_runtime_preflight_and_bws600_campaign.md` owns the BWS-600 external evidence gate.
- `docs/047` through `docs/051` own the accepted B1 program, upstream, equivalence, acceptance, and implementation map.
- Historical and superseded files retain audit, decision, migration, recovery, or validation value but own no current route.

## Read first

1. `AGENTS.md` - repository authority, safety boundaries, and source-of-truth order.
2. `docs/002_dependency_contract_with_betting_win.md` - canonical betting-win ecosystem integration contract.
3. `docs/automation/current-implementation-task.md` - current BWS-600 route and protected-file policy.
4. `docs/repo_status_current.md` - detailed operational state and blocker.
5. `PROJECT_STATUS.md` - concise status mirror.
6. `docs/automation/README.md` - canonical automation command surface.
7. `docs/041_external_runtime_preflight_and_bws600_campaign.md` - BWS-600 preflight and campaign gate.
8. `docs/047_b1_cross_venue_offline_falsification_program.md` through `docs/051_b1_implementation_map.md` - completed dependency-ready B1 authority.
9. `docs/automation/api-only-upstream.md` - binding API-only runtime transport contract.

## Current route

```text
current_task=BWS-600
current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
active_implementation_queue=none
bws600_current_task=BWS-600
bws600_current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
safe_local_terminal_gate=BWS-599
selected_controller=run-paper-autopilot.sh
BWS-900=parked
```

`BWS-100` through `BWS-599` are validated. The BWS-700 dependency-ready local queue is validated through `BWS-820`; the B1 schema name exists upstream, but `BWS-710` remains blocked until betting-win exposes and authorizes an accepted runtime resource and API handoff. BWS-600 runtime evidence is still blocked on an accepted cross-repository API wire contract, provider-to-PostgreSQL-to-API parity, and private campaign inputs. Fixtures and retained export compatibility inputs are not runtime evidence.

## Complete documentation classification

### Canonical active

```text
AGENTS.md
PROJECT_STATUS.md
README.md
STARTER_PACK.md
docs/000_documentation_index.md
docs/002_dependency_contract_with_betting_win.md
docs/041_external_runtime_preflight_and_bws600_campaign.md
docs/047_b1_cross_venue_offline_falsification_program.md
docs/048_b1_upstream_contract.md
docs/049_b1_market_equivalence.md
docs/050_b1_falsification_acceptance.md
docs/051_b1_implementation_map.md
docs/MASTER_PLAN.md
docs/automation/README.md
docs/automation/current-implementation-task.md
docs/repo_status_current.md
```

These files own current purpose, status, task routing, automation, BWS-600, or B1 authority.

### Supporting active

```text
.automation/README.md
.codex/skills/graphify/SKILL.md
.codex/skills/graphify/references/add-watch.md
.codex/skills/graphify/references/exports.md
.codex/skills/graphify/references/extraction-spec.md
.codex/skills/graphify/references/github-and-merge.md
.codex/skills/graphify/references/hooks.md
.codex/skills/graphify/references/query.md
.codex/skills/graphify/references/transcribe.md
.codex/skills/graphify/references/update.md
CHANGELOG.md
backlog/README.md
decisions/ADR-0001-repo-boundary-and-no-provider-connections.md
decisions/ADR-0002-first-lane-polymarket-standard-binary-complete-set.md
decisions/ADR-0003-paper-only-no-execution.md
decisions/ADR-0004-three-repo-surebet-strategy-execution-boundary.md
decisions/ADR-0005-bws-built-on-betting-win-platform.md
decisions/ADR-0006-full-stack-runtime-and-automation-boundary.md
docs/001_scope_and_boundaries.md
docs/003_surebet_family_decision.md
docs/004_market_identity_and_rule_equivalence.md
docs/005_terminal_scenario_cashflow_model.md
docs/006_quote_depth_capacity_requirements.md
docs/007_stake_vector_solver_contract.md
docs/008_leg_completion_and_residual_exposure.md
docs/009_settlement_replay_contract.md
docs/010_paper_evaluation_and_kill_criteria.md
docs/011_validation_matrix.md
docs/012_runbook.md
docs/016_pinned_betting_win_interface_readiness.md
docs/018_private_paper_mode_runbook.md
docs/019_three_repo_surebet_strategy_boundary.md
docs/020_strategy_data_and_state_ownership.md
docs/021_backtest_paper_live_mode_roadmap.md
docs/022_separate_account_policy.md
docs/026_betting_win_platform_baseline.md
docs/027_bws_target_architecture.md
docs/030_upstream_compatibility_and_pin_contract.md
docs/031_bws_api_ui_worker_contract.md
docs/032_database_and_data_lifecycle.md
docs/035_continuous_service_supervisor_contract.md
docs/037_database_backup_retention_and_recovery.md
docs/038_observability_metrics_and_evidence_contract.md
docs/039_release_deployment_and_upgrade_contract.md
docs/040_soak_failure_injection_and_operator_acceptance.md
docs/052_b1_future_strategy_stubs.md
docs/automation/POST_OVERLAY_CLEANUP.md
docs/automation/PROTECTED_AUTOMATION_FILES.md
docs/automation/SSH_KEY_SETUP.md
docs/automation/api-only-upstream.md
docs/automation/artifact-retention-and-cleanup.md
docs/automation/autonomous-bugfix.md
docs/automation/autonomous-implementation.md
docs/automation/bugfix-autopilot.md
docs/automation/paper-autopilot.md
docs/automation/paper-evaluation.md
docs/automation/repo-profile.md
docs/automation/repository-temp-inode-safety.md
docs/automation/telegram-notifications.md
docs/autonomous_loop_contract.md
docs/operations/autonomous_72h_runbook.md
docs/operations/service_run.md
```

These files provide still-binding architecture, safety, validation, setup, automation, operator, decision, or tooling support. `.automation/README.md` mirrors required controller markers but is not routing authority. `.codex/skills/graphify/` is external tooling documentation and does not own product behavior.

### Historical

```text
docs/028_full_implementation_program.md
docs/029_full_implementation_task_ledger.md
docs/033_continuous_private_paper_runtime_program.md
docs/034_remaining_operator_runtime_implementation_program.md
docs/036_root_wrappers_and_paper_automation_integration.md
docs/042_release_packaging_implementation_blueprint.md
docs/043_upgrade_rollback_recovery_implementation_blueprint.md
docs/044_soak_failure_injection_implementation_blueprint.md
docs/045_external_runtime_preflight_implementation_blueprint.md
docs/046_final_local_acceptance_implementation_blueprint.md
docs/legacy/surebet-research/105_polymarket_complete_set_paper_experiment_gate_after_prompt28.md
docs/legacy/surebet-research/90_stage25_prompt26_surebet_academic_review_and_next_steps.md
docs/legacy/surebet-research/91_surebet_math_and_execution_corrections_after_prompt26.md
docs/legacy/surebet-research/92_surebet_operational_research_plan_after_prompt26.md
docs/legacy/surebet-research/98_stage27_reference_bot_repository_audit_and_next_steps.md
docs/legacy/surebet-research/99_surebet_system_design_lessons_from_reference_bots.md
docs/legacy/surebet-research/README.md
research/imported-from-betting-win/legacy/surebet/README.md
research/imported-from-betting-win/legacy/surebet/academic/openalex/surebet/2026-06-18_prompt_26_result_surebet_academic_review.md
research/imported-from-betting-win/legacy/surebet/academic/openalex/surebet/2026-06-18_stage25_prompt26_reviewed_assessment.md
research/imported-from-betting-win/legacy/surebet/academic/openalex/surebet/README.md
research/imported-from-betting-win/legacy/surebet/bots/2026-06-18_stage27_reference_bot_repository_audit.md
research/imported-from-betting-win/legacy/surebet/bots/README.md
research/imported-from-betting-win/legacy/surebet/synthesis/2026-06-18_prompt_28_result_academic_strategy_provider_reference_bot_synthesis.md
research/imported-from-betting-win/legacy/surebet/synthesis/2026-06-18_stage28_reviewed_assessment.md
schemas/imported-from-betting-win/legacy/surebet/README.md
templates/imported-from-betting-win/legacy/surebet/README.md
templates/imported-from-betting-win/legacy/surebet/surebet_market_identity_and_cashflow_review_template.md
```

These files retain decision, implementation, acceptance, recovery, research, migration, or provenance value. Historical next-step language is classified as completed context and cannot route current work.

### Superseded compatibility pointer

```text
docs/013_autonomous_controller_status_contract.md
```

`docs/013_autonomous_controller_status_contract.md` is retained because the path is part of repository inventory and historical references. Its duplicate procedure was removed; it now points to `docs/autonomous_loop_contract.md`.

### Duplicate or obsolete documents

None remain in the reviewed tree. No cleanup command is required. Candidate removals were retained only when they have unique audit or recovery value, are referenced by validators, or provide repo-local tooling instructions. Their ownership is now explicit.

## Historical bootstrap summary

The old SURE bootstrap ledgers are retained here as compact provenance, not as active routing files.

```text
status=SUPERSEDED_BOOTSTRAP_LEDGER
active_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
legacy_stage=SURE-001
legacy_stage=SURE-002A_LOCAL_INTERFACE_AND_ENGINE_BOOTSTRAP
legacy_stage=SURE-002B_PRIVATE_PAPER_MODE_INTAKE
```

`SURE-001` established strict cycle artifacts, source-manifest validation, archive hygiene, shell safety, and fail-closed controller behavior. Those controls survive as regression contracts under the current automation validators.

`SURE-002A_LOCAL_INTERFACE_AND_ENGINE_BOOTSTRAP` proved deterministic bundle parsing, stake-vector math, completion and residual simulation, settlement replay consumption, and private report assembly. It was a bootstrap, not the complete application. Its behavior is incorporated into `BWS-110`, `BWS-200` through `BWS-240`, `BWS-300`, and `BWS-310`.

`SURE-002B_PRIVATE_PAPER_MODE_INTAKE` proved fixture-only intake, private report artifacts, and the controller smoke path. Those facts do not constitute the final BWS paper platform. The full platform is represented by `BWS-310`, `BWS-320`, `BWS-410`, `BWS-500`, `BWS-510`, `BWS-520`, `BWS-580`, validated work through `BWS-599`, and the externally gated `BWS-600` campaign.

## Retained implementation history

The completed historical authorities are `docs/028`, `docs/029`, `docs/033`, `docs/034`, `docs/036`, and implementation blueprints `docs/042` through `docs/046`. They preserve exact acceptance and recovery context but cannot reopen an implementation queue, export runtime selector, or protected-file authorization.

The current managed runtime is API-only. Historical export parser, convergence, release, preflight, and clean-room cases are retained non-runtime compatibility evidence.

## Archive and research material

Historical surebet research imported from betting-win remains under:

```text
docs/legacy/surebet-research/
research/imported-from-betting-win/legacy/surebet/
schemas/imported-from-betting-win/legacy/surebet/
templates/imported-from-betting-win/legacy/surebet/
```

These files are not active product authority. Stage 27 and Prompt 28 work is complete; old “next step” headings are historical sequence notes, not commands.

```text
archive_is_active_product_authority=no
```

## Removed documents

The following stale snapshots and superseded bootstrap ledgers remain intentionally absent. Their useful facts are merged into current status, this index, retained validators, and historical summaries.

```text
DOCUMENTATION_CHECK_REPORT.md
docs/014_sure_001_remaining_hardening_backlog.md
docs/015_local_engine_implementation_backlog.md
docs/017_private_paper_mode_implementation_backlog.md
docs/023_legacy_betting_win_surebet_import_manifest.md
docs/024_three_repo_documentation_completion_status.md
docs/025_research_archive_completion_status.md
```

## Completion state

Documentation slimming and full ownership classification are complete for the current tree. The repository contains no unclassified, duplicate, or obsolete Markdown file after this curation pass. Future removals must preserve unique evidence and pass the existing validation contracts; historical documents must not be deleted merely because they are non-routing.
