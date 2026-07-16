# Repo profile: betting-win-surebet

```text
repo_role=surebet_strategy_application
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
upstream_platform=betting-win
current_task=BWS-581
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
run-paper-evaluation.sh           retained no-service evaluator until BWS-588
run-paper-autopilot.sh            pending full lifecycle integration at BWS-589
```

The current product has bounded runtime commands and an API-only lifecycle owner. The active queue builds a real full-stack service, then integrates the exact protected root wrappers and paper controllers.
