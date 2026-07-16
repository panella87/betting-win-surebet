# Autonomous 72-hour implementation runbook

## Selected campaign

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
controller=run-autonomous-implementation.sh
current_task=BWS-580
safe_local_terminal_gate=BWS-580
canonical_duration=72h
max_cycles=200
```

Activate Node 20 in the same shell, pull the BWS repo, verify a readable betting-win checkout at `BETTING_WIN_REPO_PATH`, and launch the root implementation controller. Do not invent task or prompt flags.

The controller completed cumulative safe implementation from `BWS-520` through `BWS-580`, validating and updating the dependency ledger after each coherent slice.

Do not run paper autopilot until the `BWS-580` runtime handoff review is complete and accepted `BWS-600` inputs exist. Do not enable protected automation changes unless a later explicit automation-maintenance task identifies an exact allowlist.

Inspect retained artifacts and machine status. Preserve a verified lock on unsafe finalization. Do not kill or delete locks manually.
