# Repo profile: betting-win-surebet

```text
repo_role=surebet_strategy_application
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
upstream_platform=betting-win
current_task=BWS-120
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
run-autonomous-implementation.sh  selected for current full build
run-autonomous-bugfix.sh          standalone audit
run-bugfix-autopilot.sh           broad unattended audit and repair
run-paper-evaluation.sh           retained standalone fixture/paper evaluator
run-paper-autopilot.sh            post-implementation runtime convergence parent
```

The paper scripts retain no-service fixture behavior until product tasks implement the final BWS service stack. That transitional limitation does not block autonomous product implementation.
