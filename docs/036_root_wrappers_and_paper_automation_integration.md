# 036 - Root wrappers and paper automation integration

> **Completed historical protected-file authorization.** BWS-587 through BWS-589 are validated. This document preserves the exact allowlist and acceptance contract used during that closed phase; it does not authorize current protected automation changes. Current authority is `docs/automation/current-implementation-task.md`, where `automation_maintenance_allowed=no`, `allowed_protected_files=none`, and `run-paper-autopilot.sh` is selected for BWS-600.

```text
historical_tasks=BWS-587..BWS-589
historical_status=VALIDATED_COMPLETE
current_automation_maintenance_allowed=no
current_allowed_protected_files=none
current_selected_controller=run-paper-autopilot.sh
current_runtime_upstream_mode=api_only
```

## Historical scope

This contract defined `BWS-587` through `BWS-589`. Those tasks intentionally modified a small exact subset of protected automation files after the product-owned full-stack lifecycle was validated.

## Historical exact protected-file authorization

During the completed BWS-587 through BWS-589 campaign, the reviewed authorization allowed only these protected files:

```text
start.sh
stop.sh
check_progress.sh
watch_progress.sh
open_log.sh
run-autonomous-implementation.sh
run-paper-evaluation.sh
run-paper-autopilot.sh
automation.config.sh
.automation/lib/run_common.sh
docs/automation/PROTECTED_AUTOMATION_FILES.md
```

No other protected file was authorized. During that campaign, the implementation controller enforced this exact list. `AUTOMATION_ALLOW_PROTECTED_CHANGES=1` was an enabling gate, not blanket permission. The authorization is now closed.

## BWS-587: root lifecycle wrappers

The accepted contract required `start.sh` to:

- validate active Node 20 and required commands;
- load only explicitly selected repo-local configuration without printing secrets;
- build or verify build output deterministically;
- invoke the product-owned full-stack lifecycle start command;
- return machine-readable service state and evidence paths;
- fail if a different configuration owned the existing stack;
- never stop, replace, or detach an existing unrelated process.

The accepted contract required `stop.sh` to:

- invoke the product-owned exact-owner stop command;
- use recorded process identity and ordered shutdown;
- be idempotent when already stopped;
- never kill by name, pattern, or port.

The accepted contract required `check_progress.sh`, `watch_progress.sh`, and `open_log.sh` to:

- support both automation artifacts and product runtime state;
- expose full-stack service roles, health/readiness, queue state, and latest evidence;
- remain read-only;
- redact secrets;
- keep existing automation-run inspection behavior.

## BWS-588: standalone paper evaluation

The completed evaluator design supported an explicit runtime-evidence mode in addition to retained local compatibility checks. At the time of implementation, the historical contract described exactly one selected upstream mode. The current managed BWS runtime is API-only; export, fixture, and pinned-bundle paths are non-runtime compatibility inputs and cannot validate `BWS-600`.

Runtime-evidence mode was required to:

- select exactly one upstream mode under the historical implementation contract; current runtime fixes that mode to API;
- start the full stack only when it owned no active stack, otherwise attach only after exact identity and configuration verification;
- run a bounded observation window with an explicit interval and maximum duration;
- collect lifecycle, convergence, scheduler, worker, API, cockpit, database, and evidence-index state;
- produce a strict machine-readable result and implementation handoff for source defects;
- stop only the stack instance it started;
- preserve the stack and return a blocker when ownership was ambiguous;
- never classify fixture success as `BWS-600` evidence.

## BWS-589: paper autopilot

The parent implemented:

```text
full-stack runtime evaluation
-> source defect handoff
-> bounded implementation
-> exact full-stack restart or refresh
-> runtime re-evaluation
```

Required properties were:

- atomic child terminal-result side channel;
- parent-only Telegram notification;
- exact parent and child lock ownership;
- no parsing machine state from human logs;
- validated runtime handoff and source fingerprints;
- resume after source fixes without losing the evidence campaign directory;
- repeat guards based on semantic defect fingerprints;
- no `paper_service_lifecycle=none` result in runtime-evidence mode;
- final artifacts archive refreshed after lock classification.

## Closure state

`BWS-587`, `BWS-588`, and `BWS-589` are validated. The reviewed `BWS-589` return-handoff implementation required `run-autonomous-implementation.sh` in the historical exact allowlist. The current task has `automation_maintenance_allowed=no` and `allowed_protected_files=none`.
