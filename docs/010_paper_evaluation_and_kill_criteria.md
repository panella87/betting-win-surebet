# 010 — Paper evaluation and kill criteria

The repo produces private paper reports only.

A candidate must be killed or blocked when any required evidence is missing, stale,
ambiguous, unverifiable, or outside the first lane.

Reports must avoid public signal language, execution-readiness language, and profitability
claims. Private paper mode and future surebet backtesting belong in this repo; live execution remains blocked until a separate explicit gate. They should state blockers and required upstream evidence.

## Canonical paper supervisor

`run-paper-evaluation.sh` is the canonical paper supervisor. In the current repo
state it is configured for local private fixture smoke and writes private
artifacts under `artifacts/private-paper-mode/`. The pinned-bundle branch is
available only when Federico provides a repo-local pinned `betting-win` bundle; the paper controller preflights the pinned path before run creation, executes known report commands as direct argv, and strictly validates the pinned-bundle requirement flag. It does not start or stop services and does not
call `run-autonomous-bugfix.sh` as an integrated repair path. When source work is
needed, it writes a paper-mode-to-autonomous-implementation handoff for the root
implementation controller.

Adaptive and interval flags are accepted for workflow compatibility. Because this
repo has no service lifecycle, the current controller completes a no-service
single-cycle private fixture or pinned-bundle check instead of running a long
service-monitoring loop. The flags must not change commands, add provider access,
or weaken kill criteria.
