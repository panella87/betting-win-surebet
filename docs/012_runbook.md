# 012 - Implementation and operator runbook

## Continuous runtime build

1. Use Node 20.
2. Ensure `BETTING_WIN_REPO_PATH` points to the existing readable betting-win Git checkout. BWS reads committed `HEAD` only and must not clone, clean, reset or modify it.
3. Keep the validated PostgreSQL URLs private in `.env`.
4. Start `run-autonomous-implementation.sh` with the canonical 72-hour, 200-cycle campaign.
5. The controller begins at `BWS-520` and continues through every dependency-ready safe local task up to `BWS-580`.
6. Inspect the newest `artifacts/autonomous_implementation_*` evidence, not process exit or elapsed time alone.

`BWS-510` loopback acceptance remains validated. The current queue operationalizes that source into executable continuous services and does not repeat the original build.

## Failure handling

Stop with `BLOCKED=yes` only for a concrete unrecoverable repository state or exact missing external evidence. Preserve locks and artifacts. Use owning-controller `--force-unlock` only with evidence; never delete locks or kill processes manually.

## Post-runtime implementation

After `BWS-580`, inspect the runtime handoff and controller integration before selecting `run-paper-autopilot.sh` for `BWS-600`. `BWS-600` still requires accepted operator-approved continuous betting-win read-only input.
