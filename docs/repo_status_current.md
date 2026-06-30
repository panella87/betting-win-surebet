# Current Repository Status

```text
repo=betting-win-surebet
current_task=SURE-001
current_task_status=in_progress
next_allowed_task=SURE-001 hardening only
provider_connections=prohibited
execution=prohibited
runtime_service=none
```

## Active queue

- [x] Establish skeleton files from the handoff.
- [x] Add no-provider/no-execution/no-direct-DB validators.
- [x] Add empty typed stubs and fixture directories.
- [x] Add master plan and current-status docs.
- [x] Add adapted Git, artifact, validation, progress, and autonomous shell helpers.
- [ ] Wait for Federico to provide the pinned `betting-win` contract/export interface before SURE-002.

## Current safe work

Only SURE-001 hardening is allowed: docs, tooling, validators, typed stubs, fixture directory structure, and private run/report shape stubs.

## Blocked work

The following remain blocked: opportunity solving, stake-vector solving, leg-completion simulation, settlement replay implementation, provider integration, live execution, public reporting, and profitability claims.

## Operational command

```bash
cd ~/app_testing/betting-win-surebet && PYTHONDONTWRITEBYTECODE=1 bash run-autonomous-implementation.sh --duration 72h --cycle-timeout 2h --validation-timeout 20m
```


```text
local_env_policy=ignored_local_only
archive_env_policy=forbidden
```

A repo-root `.env` may exist locally for helper configuration if Git ignores it. It must not be included in source handoff archives or codebase zips.
