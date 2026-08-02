# Repo profile: betting-win-surebet

```text
repo=betting-win-surebet
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
parent_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
repo_role=surebet_strategy_application
current_task=BWS-600
current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
selected_controller=run-paper-autopilot.sh
active_implementation_queue=none
completed_b1_queue=backlog/bws_b1_cross_venue_implementation.csv
completed_b1_map=backlog/bws_b1_cross_venue_map.csv
bws700_completion_status=DEPENDENCY_READY_LOCAL_IMPLEMENTATION_COMPLETE
b1_dependency_ready_local_rows=VALIDATED_THROUGH_BWS-820
bws710_status=BLOCKED_ACCEPTED_BETTING_WIN_B1_MULTI_VENUE_API_REQUIRED
safe_local_terminal_gate=BWS-599
bws600_current_task=BWS-600
bws600_selected_controller=run-paper-autopilot.sh
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



Verified helper behavior:

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
run-autonomous-implementation.sh  72h default, future reviewed source handoff or unblocked BWS-710 only
run-autonomous-bugfix.sh          72h default, standalone read-only audit and handoff
run-bugfix-autopilot.sh           seven-day broad unattended audit and repair parent
run-paper-evaluation.sh           72h default, fixture evaluator plus runtime-evidence mode after BWS-588
run-paper-autopilot.sh            seven-day BWS-600 runtime-evidence parent selected after BWS-700 local completion and upstream API readiness
```

The current product has long-running API convergence, scheduler and worker services, managed loopback cockpit serving, a validated full-stack lifecycle owner, database lifecycle operations, observability, root-wrapper integration, runtime-evidence paper automation, release packaging, upgrade/recovery proof, soak/failure injection, external preflight, final local acceptance, and the BWS-600 upstream API preflight source fix. The BWS-700 dependency-ready local implementation route is validated through BWS-820; external BWS-600 runtime evidence remains a carry-forward gate against an operator-approved betting-win read-only API.
