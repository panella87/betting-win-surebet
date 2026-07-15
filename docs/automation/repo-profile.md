# Repo profile: betting-win-surebet

```text
repo_role=surebet_strategy_application
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
upstream_platform=betting-win
current_task=BWS-510
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
run-autonomous-implementation.sh  completed safe local build; runtime-handoff implementation only
run-autonomous-bugfix.sh          standalone audit
run-bugfix-autopilot.sh           broad unattended audit and repair
run-paper-evaluation.sh           retained standalone fixture/paper evaluator
run-paper-autopilot.sh            selected post-implementation runtime convergence parent
```

The safe local BWS service stack is validated through `BWS-510`. Paper autopilot now owns runtime/database convergence while preserving the no-service, no-provider, no-execution boundary; accepted continuous betting-win runtime evidence is still required for `BWS-600`.
