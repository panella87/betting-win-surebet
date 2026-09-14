# Repo profile: betting-win-surebet

## Current profile

```text
repo=betting-win-surebet
repo_role=surebet_strategy_application
active_program=BWS_FINAL_REMEDIATION_R01_R12_V1
activation_state=ACTIVE
current_admitted_tranche=BWS-W4-T39
current_stage=S1
canonical_node=v20.20.2
pre_s2_existing_controllers=prohibited
post_s2_controller=run-autonomous-implementation.sh
```

## Ecosystem profile

```text
betting_win_role=provider_truth_canonical_history_read_only_api_execution_sdk_owner
betting_win_api_handoff=current_not_authorized
betting_win_b1_runtime_resource=not_accepted
bws_runtime_data_client=current_not_wire_compatible
bws_execution_sdk_dependency=absent
betting_win_access_or_mutation=prohibited
```

## Standard helper scripts

```text
update_git.sh
zip_codebase.sh
pull_artifacts_and_zip_codebase.sh
check_progress.sh
watch_progress.sh
open_log.sh
```

Verified behavior:

```text
zip_codebase.sh=numbered_repo_root_zip_no_manifest_includes_untracked_non_ignored
pull_artifacts_and_zip_codebase.sh=pulls_root_artifacts_zip_then_calls_local_zip_codebase_no_automation_config
update_git.sh_acp=add_commit_push_shorthand_preserves_github_token_support
run_paper_evaluation_12h=absent_obsolete
stop_autonomous_run=absent_obsolete
paper_evaluation_artifacts_zip=artifacts.zip
paper_evaluation_operator_interval_range=5m..60m
paper_evaluation_script_explicit_interval_clamp=not_enforced_by_current_protected_script
```

## Root controllers

```text
run-autonomous-implementation.sh  72h default, active only post-S2 through the remediation launcher
run-autonomous-bugfix.sh          72h default standalone read-only audit and handoff
run-bugfix-autopilot.sh           seven-day broad audit/repair parent
run-paper-evaluation.sh           72h default standalone paper evaluator
run-paper-autopilot.sh            seven-day paper/evidence parent
```

## Retained pre-remediation profile

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
parent_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-600
current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
selected_controller=run-paper-autopilot.sh
active_implementation_queue=none
safe_local_terminal_gate=BWS-599
bws600_current_task=BWS-600
bws600_selected_controller=run-paper-autopilot.sh
```

The BWS-700 dependency-ready local implementation route is validated through BWS-820. This retained block is historical validator compatibility, not current routing.

```text
run-autonomous-implementation.sh  72h default, future reviewed source handoff or unblocked BWS-710 only
```
