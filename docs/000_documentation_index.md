# Documentation index

```text
documentation_index_status=active
documentation_slimming_phase=complete
documentation_inventory=docs/documentation-inventory.json
documentation_inventory_count=531
canonical_active=29
supporting_active=273
historical=223
superseded=6
duplicate=0
obsolete=0
current_program=BWS_FINAL_REMEDIATION_R01_R12_V1
current_program_state=ACTIVE
current_admitted_tranche=BWS-W4-T39
current_source_identity_policy=external_audit_or_admission_receipt_required
repository_documentation_self_attests_current_archive=no
```

## Current authority

The active implementation authority is `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/`. Current work begins with T39 and follows the exact 47-tranche dependency order. S1 and S2 use direct bounded implementation sessions; existing root controllers are prohibited until the entire S2 gate is accepted.

The immutable files `docs/repo_status_current.md` and `docs/automation/current-implementation-task.md` begin with active-remediation sections and are included in `activation/immutable-authority.sha256`. Their later BWS-600 blocks are retained only for existing validator compatibility. Those later blocks do not select current work.

## Canonical ownership

| Topic | Canonical owner |
|---|---|
| Repository introduction and boundaries | `README.md` |
| Agent rules and source-of-truth order | `AGENTS.md` |
| High-level current state | `PROJECT_STATUS.md` |
| Operator starting point | `STARTER_PACK.md` |
| Complete document classification | `docs/documentation-inventory.json` |
| Detailed current status | first active section of `docs/repo_status_current.md` plus active admission |
| Current implementation task | active plan/task plus first active section of `docs/automation/current-implementation-task.md` |
| Program roadmap | `docs/MASTER_PLAN.md` |
| Automation commands and options | `docs/automation/README.md` |
| Protected automation policy | `docs/automation/PROTECTED_AUTOMATION_FILES.md` |
| Cross-repository boundary | `docs/002_dependency_contract_with_betting_win.md` |
| Remediation architecture and receipts | `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/` |
| Active unattended operator command | `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/server-runbook.md` |
| Completed implementation ledgers | `backlog/README.md` and retained CSVs |
| Review evidence | `docs/reviews/` |

No other document owns the current controller or task selection. Supporting runbooks and historical programs must defer to this table.


## Current documentation-audit residuals

- `SOURCE_MANIFEST.json` is intentionally stale until T40. The latest documented audit observation found 994 non-self files versus 617 manifest entries, with 377 missing paths, 47 mismatches, and no manifest-only paths. Recompute those counts at admission; they are not current-source authority.
- `schemas/bws-release-manifest.v1.schema.json` is not valid JSON in the current source tree. This audit records the defect but does not alter executable schemas or assign an unreviewed implementation owner. The file is not acceptance evidence until an admitted implementation cycle repairs and proves it.

## Current remediation package

- `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/README.md`
- `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/program-authority.md`
- `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/campaign-order.md`
- `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/dependency-graph.md`
- `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/ownership-and-shared-paths.md`
- `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/hold-register.md`
- `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/completion-criteria.md`
- `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/README.md`
- `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/unattended-plan.json`
- `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/tasks/`

The original `s0/proposed-*` records are classified `superseded`. They remain audit history and do not override the active admission.

## Active supporting contracts

The numbered product contracts `docs/001` through `docs/052` remain available according to their inventory classification. Current architecture and safety ownership is concentrated in:

- `docs/001_scope_and_boundaries.md`
- `docs/002_dependency_contract_with_betting_win.md`
- `docs/011_validation_matrix.md`
- `docs/018_private_paper_mode_runbook.md`
- `docs/019_three_repo_surebet_strategy_boundary.md`
- `docs/027_bws_target_architecture.md`
- `docs/035_continuous_service_supervisor_contract.md`
- `docs/037_database_backup_retention_and_recovery.md`
- `docs/038_observability_metrics_and_evidence_contract.md`
- `docs/039_release_deployment_and_upgrade_contract.md`
- `docs/040_soak_failure_injection_and_operator_acceptance.md`
- `docs/041_external_runtime_preflight_and_bws600_campaign.md`
- `docs/048_b1_upstream_contract.md`
- `docs/049_b1_market_equivalence.md`
- `docs/050_b1_falsification_acceptance.md`

These documents define behavior and holds but do not select current work.

## Historical and superseded records

Retained review reports, completed blueprints, completed queue maps, change history, legacy research, and proposed admission records preserve audit, decision, migration, or incident value. They are non-routing and are classified individually in `docs/documentation-inventory.json`.

`docs/013_autonomous_controller_status_contract.md` is a superseded path-compatibility pointer. `docs/automation/POST_OVERLAY_CLEANUP.md` is a validator-required superseded compatibility record. Neither owns a current procedure.

## Removed stale snapshots

The prior slimming phase remains complete. These obsolete snapshots must remain absent:

```text
DOCUMENTATION_CHECK_REPORT.md
docs/014_sure_001_remaining_hardening_backlog.md
docs/015_local_engine_implementation_backlog.md
docs/017_private_paper_mode_implementation_backlog.md
docs/023_legacy_betting_win_surebet_import_manifest.md
docs/024_three_repo_documentation_completion_status.md
docs/025_research_archive_completion_status.md
```

Their useful content was incorporated into surviving canonical or historical documents. Historical bootstrap identity remains recorded as:

```text
status=SUPERSEDED_BOOTSTRAP_LEDGER
legacy_stage=SURE-001
legacy_stage=SURE-002A_LOCAL_INTERFACE_AND_ENGINE_BOOTSTRAP
legacy_stage=SURE-002B_PRIVATE_PAPER_MODE_INTAKE
```

Those stages were bootstrap, not the complete application, and do not constitute the final BWS paper platform.

## Legacy implementation-stage traceability

The superseded bootstrap ledgers preserve these validated stage identifiers for audit and validator continuity:

```text
BWS-110
BWS-200
BWS-240
BWS-300
BWS-310
BWS-320
BWS-410
BWS-500
BWS-510
BWS-520
BWS-580
BWS-600
```

They remain historical task identities and do not reopen an implementation queue.

## Historical platform compatibility markers

The following exact block exists only because current executable validators still assert the pre-remediation route. It is not current routing authority.

```text
active_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
current_task=BWS-600
active_implementation_queue=none
selected_controller=run-paper-autopilot.sh
safe_local_terminal_gate=BWS-599
BWS-600=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
```

`docs/041_external_runtime_preflight_and_bws600_campaign.md` remains the supporting external hold contract. BWS-600, BWS-710, BWS-900, release, deployment, and live execution remain blocked or parked.

## Legacy research archive

The archive under `docs/legacy/surebet-research/` and imported research roots is historical only.

```text
archive_is_active_product_authority=no
```

It may preserve decision provenance but cannot route implementation or satisfy runtime evidence.
