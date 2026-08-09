# 000 - Documentation index

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
parent_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
documentation_index_status=active
documentation_slimming_phase=complete
current_task=BWS-600
active_implementation_queue=none
completed_b1_queue=backlog/bws_b1_cross_venue_implementation.csv
completed_b1_map=backlog/bws_b1_cross_venue_map.csv
bws700_completion_status=DEPENDENCY_READY_LOCAL_IMPLEMENTATION_COMPLETE
b1_dependency_ready_local_rows=VALIDATED_THROUGH_BWS-820
bws710_status=BLOCKED_ACCEPTED_BETTING_WIN_B1_MULTI_VENUE_API_REQUIRED
current_external_gate=BWS-600
safe_local_terminal_gate=BWS-599
execution_gate=BWS-900
```

This is the short map for the BWS documentation set. Use it before opening older detailed blueprints.

## Read first

1. `AGENTS.md` - repository authority, safety boundaries and source-of-truth order.
2. `docs/repo_status_current.md` - current operational state and controller routing.
3. `docs/automation/current-implementation-task.md` - active BWS-600 runtime-evidence routing authority after BWS-700 local completion.
4. `docs/047_b1_cross_venue_offline_falsification_program.md` - B1 program authority.
5. `docs/048_b1_upstream_contract.md` - B1 upstream contract gate.
6. `backlog/bws_b1_cross_venue_implementation.csv` - active B1 implementation queue.
7. `backlog/bws_b1_cross_venue_map.csv` - active B1 implementation map.
8. `docs/automation/api-only-upstream.md` - binding upstream transport contract.
9. `docs/041_external_runtime_preflight_and_bws600_campaign.md` - carry-forward BWS-600 runtime-evidence gate.


## Active B1 implementation authority

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
parent_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-600
current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
active_implementation_queue=none
bws600_current_task=BWS-600
bws600_current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
safe_local_terminal_gate=BWS-599
BWS-900=parked
```

Read these B1 documents before starting or auditing the implementation controller:

```text
docs/047_b1_cross_venue_offline_falsification_program.md
docs/048_b1_upstream_contract.md
docs/049_b1_market_equivalence.md
docs/050_b1_falsification_acceptance.md
docs/051_b1_implementation_map.md
docs/052_b1_future_strategy_stubs.md
backlog/bws_b1_cross_venue_implementation.csv
backlog/bws_b1_cross_venue_map.csv
```

The B1 authority is offline/private-paper only. `BWS-710` remains blocked until `betting-win` exposes an accepted read-only `betting-win.b1_multi_venue_markets.v1` resource. `BWS-600` remains the external runtime-evidence gate for the accepted same-venue platform, and `BWS-900` remains parked.

## Active operating docs

```text
README.md
PROJECT_STATUS.md
STARTER_PACK.md
docs/012_runbook.md
docs/018_private_paper_mode_runbook.md
docs/automation/README.md
docs/automation/paper-autopilot.md
docs/automation/repository-temp-inode-safety.md
docs/automation/artifact-retention-and-cleanup.md
docs/operations/autonomous_72h_runbook.md
docs/operations/service_run.md
```


## Removed bootstrap snapshots

The following completed bootstrap snapshots are intentionally removed from the active repository tree. Their contracts are represented by current validators, ledgers and implementation history.

```text
removed=
  docs/014_sure_001_remaining_hardening_backlog.md
  docs/015_local_engine_implementation_backlog.md
  docs/017_private_paper_mode_implementation_backlog.md
```

## Historical bootstrap summary

The old SURE bootstrap ledgers are retained here as compact provenance, not as active routing files.

```text
status=SUPERSEDED_BOOTSTRAP_LEDGER
active_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
legacy_stage=SURE-001
legacy_stage=SURE-002A_LOCAL_INTERFACE_AND_ENGINE_BOOTSTRAP
legacy_stage=SURE-002B_PRIVATE_PAPER_MODE_INTAKE
```

`SURE-001` established strict cycle artifacts, source-manifest validation, archive hygiene, shell safety and fail-closed controller behavior. Those controls survive as regression contracts under the current automation validators.

`SURE-002A_LOCAL_INTERFACE_AND_ENGINE_BOOTSTRAP` proved deterministic bundle parsing, stake-vector math, completion and residual simulation, settlement replay consumption and private report assembly. It was a bootstrap, not the complete application. Its behavior is incorporated into `BWS-110`, `BWS-200` through `BWS-240`, `BWS-300` and `BWS-310`.

`SURE-002B_PRIVATE_PAPER_MODE_INTAKE` proved fixture-only intake, private report artifacts and the controller smoke path. Those facts do not constitute the final BWS paper platform. The full paper platform is represented by `BWS-310`, `BWS-320`, `BWS-410`, `BWS-500`, `BWS-510`, `BWS-520`, `BWS-580` and the externally gated `BWS-600` runtime-evidence campaign.

## Still-binding implementation history

The safe-local product queue is complete through `BWS-599`. The following docs are retained because validators, regression tests, or operator recovery flows still rely on them:

```text
docs/028_full_implementation_program.md
docs/029_full_implementation_task_ledger.md
docs/030_upstream_compatibility_and_pin_contract.md
docs/033_continuous_private_paper_runtime_program.md
docs/034_remaining_operator_runtime_implementation_program.md
docs/035_continuous_service_supervisor_contract.md
docs/036_root_wrappers_and_paper_automation_integration.md
docs/037_database_backup_retention_and_recovery.md
docs/038_observability_metrics_and_evidence_contract.md
docs/039_release_deployment_and_upgrade_contract.md
docs/040_soak_failure_injection_and_operator_acceptance.md
docs/041_external_runtime_preflight_and_bws600_campaign.md
docs/042_release_packaging_implementation_blueprint.md
docs/043_upgrade_rollback_recovery_implementation_blueprint.md
docs/044_soak_failure_injection_implementation_blueprint.md
docs/045_external_runtime_preflight_implementation_blueprint.md
docs/046_final_local_acceptance_implementation_blueprint.md
```

## Archive and research material

Historical surebet research imported from `betting-win` remains under:

```text
docs/legacy/surebet-research/
research/imported-from-betting-win/legacy/surebet/
schemas/imported-from-betting-win/legacy/surebet/
templates/imported-from-betting-win/legacy/surebet/
```

These files are not active product authority. They remain retained evidence for provenance and regression context.

```text
archive_is_active_product_authority=no
```

## Removed in phase 1

The following stale completion snapshots were removed because their current facts are now covered by this index, `docs/repo_status_current.md`, the retained archive manifests, and `docs/legacy/surebet-research/README.md`:

```text
DOCUMENTATION_CHECK_REPORT.md
docs/024_three_repo_documentation_completion_status.md
docs/025_research_archive_completion_status.md
```

## Removed in phase 2

The following superseded bootstrap ledgers were merged into the compact historical summary above:

```text
docs/014_sure_001_remaining_hardening_backlog.md
docs/015_local_engine_implementation_backlog.md
docs/017_private_paper_mode_implementation_backlog.md
```

## Completion state

Documentation slimming is complete for the active operator map. Further compaction of `docs/026` through `docs/046` requires explicit operator approval because those documents preserve implementation contracts, acceptance history, recovery procedures, and the externally gated `BWS-600` runtime-evidence boundary.


## Removed completion-only migration snapshots

The following documents were completion records, not active contracts. Their information is represented by current ownership, archive and status documents.

```text
removed=
  docs/023_legacy_betting_win_surebet_import_manifest.md
  docs/024_three_repo_documentation_completion_status.md
  docs/025_research_archive_completion_status.md
```
