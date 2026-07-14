# 012 - Implementation and operator runbook

## Initial build

1. Apply and validate the rebaseline overlay under Node 20.
2. Ensure the server has a readable betting-win Git checkout. BWS reads only its committed `HEAD`; no clone, temporary worktree, cleanup, or reset is required.
3. Export `BETTING_WIN_REPO_PATH` explicitly.
4. Start `run-autonomous-implementation.sh` with canonical duration and model flags.
5. Inspect the newest `artifacts/autonomous_implementation_*` evidence, not process exit alone.

The implementation controller reads `docs/automation/current-implementation-task.md` and `backlog/bws_full_implementation.csv`. It continues while safe dependency-ready work remains through `BWS-510`.

## Failure handling

Stop with `BLOCKED=yes` only for a concrete unrecoverable repo state or exact missing external evidence. Preserve locks and artifacts. Use owning-controller `--force-unlock` only with evidence; never delete locks or kill processes manually.

## Post-implementation

Use `run-paper-autopilot.sh` for runtime/database convergence only after `BWS-510`, or when a retained bugfix campaign explicitly requests runtime evidence. `BWS-600` still requires accepted continuous betting-win runtime input.
