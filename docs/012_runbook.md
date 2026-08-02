# 012 - Operator runbook

## Current BWS-700 campaign and carry-forward BWS-600 runtime runbook

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
parent_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-700
safe_local_terminal_gate=BWS-599
selected_controller=run-autonomous-implementation.sh
bws600_current_task=BWS-600
bws600_selected_controller=run-paper-autopilot.sh
```

1. Use Node 20.
2. Keep `~/app_testing/betting-win-surebet` as the working repository.
3. Set `BETTING_WIN_REPO_PATH` to the existing read-only `~/app_testing/betting-win` checkout. Do not clone or mutate it.
4. Keep the private BWS `.env` configured with `POSTGRES_ADDRESS`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`; remove `DB_URL` and `DB_URL_TEST`. The wrapper owns the accepted betting-win read-only API defaults and uses the standard `BWS_PRIVATE_PAPER_SCHEDULE_PATH` under `runtime/operator-inputs/` unless explicitly overridden. Explicit shell values win; the runtime wrapper fills only missing approved non-policy keys from `.env` and enforces API mode, paper mode, provider-disabled operation, and execution-disabled operation. It never substitutes a fixture schedule.
5. For the active BWS-700 queue, launch `run-autonomous-implementation.sh` without `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`. Use the canonical seven-day paper autopilot later only for BWS-600 after the operator-approved upstream API is available and no binding implementation queue remains.
6. Treat missing or incompatible betting-win API evidence as a precise BWS-600 runtime blocker. For B1, treat the missing `betting-win.b1_multi_venue_markets.v1` API as a BWS-710 blocker while still allowing dependency-ready local offline implementation. There is no export fallback.
7. Inspect the newest retained machine-readable artifacts and ledger, not elapsed time alone.

## Runtime safety

The implementation may launch bounded, uniquely identified, loopback-only child processes inside tests. Tests must keep them attached and clean them up. Do not stop, replace, detach or kill any pre-existing user service or session.

## After local completion

`BWS-599` is validated. Use the `BWS-593` preflight and accepted betting-win API configuration as the input boundary for `run-paper-autopilot.sh` at `BWS-600`. The upstream API preflight source fix is already present and must fail fast if the betting-win read-only API is unavailable or points at the local BWS API.

`BWS-600` remains private paper. `BWS-900` remains separately parked execution.
