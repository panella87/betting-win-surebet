# 010 — Paper evaluation and kill criteria

The repo produces private paper reports only.

A candidate must be killed or blocked when any required evidence is missing, stale,
ambiguous, unverifiable, or outside the first lane.

Reports must avoid public signal language, execution-readiness language, and profitability
claims. Private paper mode and future surebet backtesting belong in this repo; live execution remains blocked until a separate explicit gate. They should state blockers and required upstream evidence.

## Canonical paper supervisor

`run-paper-evaluation.sh` is the canonical paper supervisor. In the current repo
state it is configured for local private fixture smoke only and writes private
artifacts under `artifacts/private-paper-mode/`. It may invoke
`run-autonomous-bugfix.sh` when logs contain crash/error evidence, then resume.

Adaptive mode may choose only the wait interval between cycles, clamped to 5..60
minutes. It must not change commands, add provider access, or weaken kill criteria.
