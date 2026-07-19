# 012 - Operator runbook

## Current runtime-evidence campaign

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-600
safe_local_terminal_gate=BWS-599
selected_controller=run-autonomous-implementation.sh
```

1. Use Node 20.
2. Keep `~/app_testing/betting-win-surebet` as the working repository.
3. Set `BETTING_WIN_REPO_PATH` to the existing read-only `~/app_testing/betting-win` checkout. Do not clone or mutate it.
4. Keep the private BWS `.env` configured with `POSTGRES_ADDRESS`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`; remove `DB_URL` and `DB_URL_TEST`. The wrapper owns the accepted betting-win read-only API defaults and uses the standard `BWS_PRIVATE_PAPER_SCHEDULE_PATH` under `runtime/operator-inputs/` unless explicitly overridden. Explicit shell values win; the runtime wrapper fills only missing approved non-policy keys from `.env` and enforces API mode, paper mode, provider-disabled operation, and execution-disabled operation. It never substitutes a fixture schedule.
5. Launch the canonical seven-day paper autopilot without `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`. It owns 72-hour paper and implementation children and invokes implementation only for a validated source-fix handoff.
6. Treat missing or incompatible betting-win API evidence as a precise BWS-600 runtime blocker. There is no export fallback.
7. Inspect the newest retained machine-readable artifacts and ledger, not elapsed time alone.

## Runtime safety

The implementation may launch bounded, uniquely identified, loopback-only child processes inside tests. Tests must keep them attached and clean them up. Do not stop, replace, detach or kill any pre-existing user service or session.

## After local completion

`BWS-599` is validated. First complete the `BWS-600` upstream API preflight source fix with `run-autonomous-implementation.sh`; then use the `BWS-593` preflight and accepted betting-win API configuration as the input boundary for `run-paper-autopilot.sh` at `BWS-600`.

`BWS-600` remains private paper. `BWS-900` remains separately parked execution.
