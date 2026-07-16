# Repo profile: betting-win-surebet

```text
repo_role=surebet_strategy_application
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
upstream_platform=betting-win
current_task=BWS-592
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
run-autonomous-implementation.sh  selected for remaining local build
run-autonomous-bugfix.sh          standalone audit
run-bugfix-autopilot.sh           broad unattended audit and repair
run-paper-evaluation.sh           fixture evaluator plus runtime-evidence mode after BWS-588
run-paper-autopilot.sh            validated runtime-evidence lifecycle integration at BWS-589
```

The current product now has long-running explicit-mode upstream convergence, long-running scheduler and worker services, managed loopback cockpit serving, a validated full-stack lifecycle owner, validated product-owned database lifecycle operations, validated protected root wrapper integration, validated runtime-evidence paper automation, validated release packaging and validated upgrade/recovery proof. The active queue now implements soak, external preflight and final local acceptance.
