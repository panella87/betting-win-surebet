# Autonomous 72-hour implementation runbook

## Selected campaign

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
controller=run-autonomous-implementation.sh
current_task=BWS-100
canonical_duration=72h
```

Activate Node 20 in the same shell, pull the BWS repo, verify a readable betting-win checkout at `BETTING_WIN_REPO_PATH`, and launch the root implementation controller. Do not invent task/prompt flags.

The controller must maximize cumulative safe implementation through `BWS-510`, validating and updating the dependency ledger after each coherent slice.

Do not run paper autopilot as the initial build. Do not enable protected automation changes unless an explicit automation-maintenance task exists.

Inspect retained artifacts and machine status. Preserve a verified lock on unsafe finalization. Do not kill/delete locks manually.
