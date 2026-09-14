# PROJECT_STATUS

## Current program

```text
program=BWS_FINAL_REMEDIATION_R01_R12_V1
status=ACTIVE_REMEDIATION
activation_snapshot=betting-win-surebet123.zip
activation_snapshot_sha256=e8d632fbb3bc7b45b4f2366d3fac33187fdc21fc0c2a7e6e36fb4b2890f9c4a9
current_repository_snapshot=betting-win-surebet125.zip
current_repository_sha256=72a8262a5f94d144bb930cc9fb2778eed672d2a97a252f49b07f7b979b47224f
current_repository_regular_files=995
current_admitted_tranche=BWS-W4-T39
current_campaign_order=1
current_stage=S1
current_tranche_state=ADMITTED_NOT_YET_PROVEN
canonical_node=v20.20.2
existing_controller_allowed_before_s2=no
post_s2_controller=run-autonomous-implementation.sh
```

The 47-tranche remediation campaign covers 173 confirmed findings. T39 is first and dependency-free. It owns the nested-secret, archive-policy, Git-config, SSH-identity, and first-use trust correction boundary in the repository packaging and Git helper scripts. No remediation source implementation or acceptance receipt is present in the BWS125 ZIP.

The exact active routing authority is the activation package under `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/`. `docs/repo_status_current.md` and `docs/automation/current-implementation-task.md` are immutable inputs to that package; their first sections are current. Their later BWS-600 sections are validator-retained historical compatibility text.

## Holds and safety

```text
BWS-600=BLOCKED
BWS-710=BLOCKED
BWS-900=PARKED_NOT_AUTHORIZED
release=BLOCKED
deployment=BLOCKED
live_execution=PROHIBITED
betting_win_access_or_mutation=PROHIBITED
```

The current campaign does not authorize provider access, external repository access, live execution, release, deployment, or production promotion.

## Repository role

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

## Current documentation ownership

- `docs/000_documentation_index.md`: canonical navigation and classification policy.
- `docs/documentation-inventory.json`: exhaustive document inventory and classification.
- `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/`: active campaign authority.
- `docs/automation/README.md`: executable automation command contract.
- `docs/002_dependency_contract_with_betting_win.md`: cross-repository boundary.
- `docs/MASTER_PLAN.md`: stage roadmap and completion model.

## Source-manifest state

`SOURCE_MANIFEST.json` remains stale and is not current authority. Against BWS125, the validator input set contains 994 non-self files while the manifest contains 617 entries: 377 paths are missing, 47 shared paths mismatch, and 0 manifest-only paths remain in this documentation postimage; the BWS125 audit preimage had 38 mismatches. T40 owns replacement with exact current-tree and exact Node `20.20.2` enforcement. This documentation audit does not regenerate or weaken it.

## Known source-contract residual

`schemas/bws-release-manifest.v1.schema.json` does not parse as JSON because the current file ends before the outer object is closed. It is an executable schema/source defect, not a documentation edit boundary. It cannot be cited as current schema-valid evidence and requires explicit implementation ownership reconciliation before correction.

## Historical validation lineage

`BWS_FULL_PLATFORM_IMPLEMENTATION_V1` retains validated gates `BWS-592`, `BWS-593`, and `BWS-599`.

## Historical platform status retained for validator compatibility

The following exact block is the completed B1 and BWS-600 route immediately before remediation activation. It is not current routing.

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
parent_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
status=B1_DEPENDENCY_READY_LOCAL_IMPLEMENTATION_COMPLETE
current_task=BWS-600
current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
active_implementation_queue=none
bws600_current_task=BWS-600
safe_local_completion_gate=BWS-599
selected_controller=run-paper-autopilot.sh
selected_task=BWS-600
paper_autopilot_selected=selected_after_bws700_dependency_ready_queue_complete
bws600_status=RUNTIME_EVIDENCE_READY
bws600_campaign_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
execution_gate=closed
```

`bws600_status=RUNTIME_EVIDENCE_READY` records source capability only. It never proved campaign completion.

## Historical validated foundation

BWS-100 through BWS-599 and dependency-ready local B1 work through BWS-820 remain accepted carry-forward behavior and regression authority. The broad bugfix campaign was completed and accepted across eight areas. Those facts are historical foundations, not the currently selected work route.

The compact documentation map is `docs/000_documentation_index.md`.
