# 012 - Operator runbook

## Current implementation campaign

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-592
safe_local_terminal_gate=BWS-599
selected_controller=run-autonomous-implementation.sh
```

1. Use Node 20.
2. Keep `~/app_testing/betting-win-surebet` as the working repository.
3. Set `BETTING_WIN_REPO_PATH` to the existing read-only `~/app_testing/betting-win` checkout. Do not clone or mutate it.
4. Keep the private BWS `.env` configured for PostgreSQL and loopback runtime tests. `DB_URL_TEST` or a complete `SUREBET_TEST_*` tuple must reference an existing role with `CREATEDB` for disposable proof.
5. Launch the canonical 72-hour implementation controller without `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`. The active task disallows protected automation changes and the controller enforces that fail-closed policy.
6. Continue through every dependency-ready row to `BWS-599`. Do not route to paper autopilot while source tasks remain.
7. Inspect the newest retained machine-readable artifacts and ledger, not elapsed time alone.

## Runtime safety

The implementation may launch bounded, uniquely identified, loopback-only child processes inside tests. Tests must keep them attached and clean them up. Do not stop, replace, detach or kill any pre-existing user service or session.

## After local completion

After `BWS-599` is validated, use the `BWS-593` preflight to create an operator-reviewed `bws.external_runtime_campaign.v1` manifest. Only then may the router select `run-paper-autopilot.sh` for `BWS-600`.

`BWS-600` remains private paper. `BWS-900` remains separately parked execution.
