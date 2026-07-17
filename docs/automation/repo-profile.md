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

## Root controllers

```text
run-autonomous-implementation.sh  source-fix handoff only
run-autonomous-bugfix.sh          standalone audit
run-bugfix-autopilot.sh           broad unattended audit and repair
run-paper-evaluation.sh           fixture evaluator plus runtime-evidence mode after BWS-588
run-paper-autopilot.sh            selected BWS-600 runtime-evidence parent
```

The current product has long-running API convergence, scheduler and worker services, managed loopback cockpit serving, a validated full-stack lifecycle owner, database lifecycle operations, observability, root-wrapper integration, runtime-evidence paper automation, release packaging, upgrade/recovery proof, soak/failure injection, external preflight, and final local acceptance. The active gate is BWS-600 runtime evidence.
