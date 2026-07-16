# Repo automation contract: betting-win-surebet

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-581
current_task_status=PENDING
selected_controller=run-autonomous-implementation.sh
safe_local_terminal_gate=BWS-599
```

`BWS-100` through `BWS-580` are validated carry-forward foundations. They do not finish the operator application: the current runtime still uses one-shot convergence, scheduler and worker commands, an API-only lifecycle owner, unserved cockpit assets, disconnected root lifecycle wrappers and no-service paper controllers.

The binding queue continues through `BWS-599`. The detailed contracts are `docs/034_remaining_operator_runtime_implementation_program.md` through `docs/041_external_runtime_preflight_and_bws600_campaign.md`.

`BETTING_WIN_REPO_PATH` remains a read-only pointer to the existing betting-win checkout. BWS reads committed `HEAD` through Git objects and must not clone, clean, reset or modify that checkout.

## Controller selection

```text
run-autonomous-implementation.sh  selected for BWS-581 through BWS-599
run-autonomous-bugfix.sh          standalone audit only
run-bugfix-autopilot.sh           broad audit and automatic repair after implementation
run-paper-evaluation.sh           retained no-service evaluator until BWS-588
run-paper-autopilot.sh            not selected until BWS-589 and BWS-599 are validated
```

Do not use paper autopilot as a workaround for missing product lifecycle implementation.

## Exact protected-file policy

The current task file authorizes only the exact protected subset needed by `BWS-587` through `BWS-589`:

```text
start.sh
stop.sh
check_progress.sh
watch_progress.sh
open_log.sh
run-paper-evaluation.sh
run-paper-autopilot.sh
automation.config.sh
.automation/lib/run_common.sh
docs/automation/PROTECTED_AUTOMATION_FILES.md
```

The server campaign must set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`, but that environment value is only an enabling gate. `run-autonomous-implementation.sh` also requires the unique task-file markers `automation_maintenance_allowed=yes` and `allowed_protected_files=...`, and rejects any protected change outside the list. A blanket manual override is disabled.

Do not edit protected files before the dependency-ready row requires them.

## Process-test boundary

Autonomous cycles may not mutate pre-existing services or user sessions. Bounded repo-owned loopback child processes are permitted only for task-required lifecycle, crash, restart, shutdown or recovery tests. They must use unique identities and ports, remain attached to the test and be cleaned up by the command that created them.

## Notifications and child results

Parent autopilots launch children with `TELEGRAM_NOTIFY=0` and emit one final parent notification. Standalone controllers retain their own final notification. Parent/child terminal state uses the atomic child-result side channel, never streamed human output.

## Evidence packaging

All root controllers archive the complete `artifacts/` directory with fast standard ZIP compression and refresh the current final summary after lock classification. Repo-local temporary files are used instead of relying on writable `/tmp`.

For status, inspect machine-readable retained evidence. Do not infer success from elapsed time or exit code alone.
