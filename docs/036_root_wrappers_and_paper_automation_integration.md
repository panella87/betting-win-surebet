# 036 - Root wrappers and paper automation integration

## Scope

This contract defines `BWS-587` through `BWS-589`. These tasks intentionally modify a small exact subset of protected automation files after the product-owned full-stack lifecycle is validated.

## Exact protected-file authorization

The active implementation campaign may modify only these protected files:

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

No other protected file is authorized. The implementation controller must enforce this exact list for task-file campaigns. `AUTOMATION_ALLOW_PROTECTED_CHANGES=1` is an enabling gate, not blanket permission.

## BWS-587: root lifecycle wrappers

`start.sh` must:

- validate active Node 20 and required commands;
- load only explicitly selected repo-local configuration without printing secrets;
- build or verify build output deterministically;
- invoke the product-owned full-stack lifecycle start command;
- return machine-readable service state and evidence paths;
- fail if a different configuration owns the existing stack;
- never stop, replace or detach an existing unrelated process.

`stop.sh` must:

- invoke the product-owned exact-owner stop command;
- use recorded process identity and ordered shutdown;
- be idempotent when already stopped;
- never kill by name, pattern or port.

`check_progress.sh`, `watch_progress.sh` and `open_log.sh` must:

- support both automation artifacts and product runtime state;
- expose full-stack service roles, health/readiness, queue state and latest evidence;
- remain read-only;
- redact secrets;
- keep existing automation-run inspection behavior.

## BWS-588: standalone paper evaluation

The evaluator must support an explicit runtime-evidence mode in addition to any retained local fixture mode.

Runtime-evidence mode must:

- select exactly one upstream mode;
- start the full stack only when it owns no active stack, otherwise attach only after exact identity/config verification;
- run a bounded observation window with an explicit interval and maximum duration;
- collect lifecycle, convergence, scheduler, worker, API, cockpit, database and evidence-index state;
- produce a strict machine-readable result and implementation handoff for source defects;
- stop only the stack instance it started;
- preserve the stack and return a blocker when ownership is ambiguous;
- never classify fixture success as `BWS-600` evidence.

## BWS-589: paper autopilot

The parent must implement:

```text
full-stack runtime evaluation
-> source defect handoff
-> bounded implementation
-> exact full-stack restart or refresh
-> runtime re-evaluation
```

Required properties:

- atomic child terminal-result side channel;
- parent-only Telegram notification;
- exact parent and child lock ownership;
- no parsing machine state from human logs;
- validated runtime handoff and source fingerprints;
- resume after source fixes without losing the selected upstream mode or evidence campaign directory;
- repeat guards based on semantic defect fingerprints;
- no `paper_service_lifecycle=none` result in runtime-evidence mode;
- final artifacts archive refreshed after lock classification.
