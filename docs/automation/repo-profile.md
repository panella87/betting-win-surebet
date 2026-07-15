# Repo profile: betting-win-surebet

```text
repo_role=surebet_strategy_application
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
upstream_platform=betting-win
current_task=BWS-520
safe_local_terminal_gate=BWS-580
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
run-autonomous-implementation.sh  selected for BWS-520 through BWS-580
run-autonomous-bugfix.sh          standalone audit
run-bugfix-autopilot.sh           broad unattended audit and repair
run-paper-evaluation.sh           retained no-service fixture/pinned-bundle evaluator
run-paper-autopilot.sh            not selected until continuous runtime source work is validated
```

The repository has validated runtime libraries and loopback acceptance through `BWS-510`, but not an executable continuous service lifecycle. `BWS-520` through `BWS-580` build that surface. `BWS-600` remains the external accepted-runtime evidence gate.
