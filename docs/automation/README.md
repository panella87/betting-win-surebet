# Repo automation contract: betting-win-surebet

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-592
current_task_status=PENDING
selected_controller=run-autonomous-implementation.sh
safe_local_terminal_gate=BWS-599
```

`BWS-100` through `BWS-589` are validated carry-forward foundations. The runtime has full product lifecycle ownership, database lifecycle, observability, root wrappers, service-owned paper evaluation and runtime-evidence paper autopilot.

The remaining queue is soak, external preflight and final clean-room acceptance through `BWS-599`. Detailed contracts are `docs/039` through `docs/046`; the dependency-ordered subtask map is `backlog/bws_remaining_safe_local_map.csv`.

`BETTING_WIN_REPO_PATH` remains a read-only pointer to the existing betting-win checkout. BWS reads committed `HEAD` through Git objects and must not clone, clean, reset or modify that checkout.

## Controller selection

```text
run-autonomous-implementation.sh  selected for BWS-592 through BWS-599
run-autonomous-bugfix.sh          standalone audit only
run-bugfix-autopilot.sh           broad audit and automatic repair after implementation
run-paper-evaluation.sh           fixture evaluator plus validated runtime-evidence mode
run-paper-autopilot.sh            validated runtime-evidence parent for BWS-599/BWS-600 campaigns
```

Do not use paper autopilot as a workaround for remaining local implementation.

## Exact protected-file policy

The historical `BWS-587` through `BWS-589` phase used an exact reviewed allowlist that included `run-autonomous-implementation.sh` for runtime-evidence return handoffs.

The current task source contains:

```text
automation_maintenance_allowed=no
allowed_protected_files=none
```

Do not set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`. Any protected automation change blocks the cycle unless an external overlay first updates the binding task source. The blanket manual override is disabled.

## Process-test boundary

Autonomous cycles may not mutate pre-existing services or user sessions. Bounded repo-owned loopback child processes are permitted only for task-required lifecycle, crash, restart, shutdown, recovery or soak tests. They must use unique identities and ports, remain attached to the test and be cleaned up by the command that created them.

## Notifications and child results

Parent autopilots launch children with `TELEGRAM_NOTIFY=0` and emit one final parent notification. Standalone controllers retain their own final notification. Parent/child terminal state uses the atomic child-result side channel, never streamed human output.

## Evidence packaging

All root controllers archive the complete `artifacts/` directory with fast standard ZIP compression and refresh the current final summary after lock classification. Repo-local temporary files are used instead of relying on writable `/tmp`.

For status, inspect machine-readable retained evidence. Do not infer success from elapsed time or exit code alone.
