# Paper autopilot controller

`run-paper-autopilot.sh` is the parent workflow for post-implementation runtime/database convergence:

```text
paper evaluation -> runtime evidence -> implementation handoff -> paper re-evaluation
```

It was not selected for the initial `BWS_FULL_PLATFORM_IMPLEMENTATION_V1` build. Safe local tasks through `BWS-510` are now validated, so it is the active controller for post-implementation runtime/database convergence. It is also selected when a retained bugfix campaign explicitly requests runtime evidence.

The parent keeps one final Telegram notification and suppresses child notifications. It preserves strict lock, child identity, handoff, source-fingerprint, and finalization behavior.

Child terminal state is delivered through a strict atomic `child_terminal_result.env` side channel. `child_output.log` remains unrestricted human/Codex output; repeated machine-like lines inside prompts, diffs, or summaries cannot be mistaken for the child result. A missing, malformed, mismatched, or wrong-exit side channel stops with `PAPER_AUTOPILOT_BLOCKED_CHILD_RESULT` before any handoff is consumed.

The seven-day parent and 72-hour child durations are maximum budgets, not mandatory idle time. A bounded source handoff may complete quickly, after which the parent must continue to paper re-evaluation. It stops early only on an accepted terminal paper result, an explicit external/runtime evidence gate, a validated blocker, repeated-handoff protection, or exhausted budget.

Current retained fixture behavior may classify missing required bundle evidence as `PAPER_AUTOPILOT_BLOCKED_ON_PINNED_BUNDLE`. That is truthful runtime-evidence routing and does not reopen the completed safe-local implementation queue.
