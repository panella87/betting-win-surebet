# Repo profile: betting-win-surebet

```text
repo_role=surebet_strategy_application
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
upstream_platform=betting-win
current_task=BWS-600
safe_local_terminal_gate=BWS-599
node_runtime=20
package_manager=npm
language=typescript
persistence=postgresql_surebet_schema
provider_connections=prohibited
execution=prohibited
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
```

## Root controllers

```text
run-autonomous-implementation.sh  72h default, source-fix handoff only, docs/current-task driven
run-autonomous-bugfix.sh          72h default, standalone read-only audit and handoff
run-bugfix-autopilot.sh           seven-day broad unattended audit and repair parent
run-paper-evaluation.sh           72h default, fixture evaluator plus runtime-evidence mode after BWS-588
run-paper-autopilot.sh            seven-day selected BWS-600 runtime-evidence parent after upstream API preflight source fix
```

The current product has long-running API convergence, scheduler and worker services, managed loopback cockpit serving, a validated full-stack lifecycle owner, database lifecycle operations, observability, root-wrapper integration, runtime-evidence paper automation, release packaging, upgrade/recovery proof, soak/failure injection, external preflight, final local acceptance, and the BWS-600 upstream API preflight source fix. The active gate is external runtime evidence against an operator-approved betting-win read-only API.
