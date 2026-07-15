# Paper autopilot controller

`run-paper-autopilot.sh` is the parent workflow for post-implementation runtime/database convergence:

```text
paper evaluation -> runtime evidence -> implementation handoff -> paper re-evaluation
```

It was not selected for the initial `BWS_FULL_PLATFORM_IMPLEMENTATION_V1` build. Safe local tasks through `BWS-510` are now validated, so it is the active controller for post-implementation runtime/database convergence. It is also selected when a retained bugfix campaign explicitly requests runtime evidence.

The parent keeps one final Telegram notification and suppresses child notifications. It preserves strict lock, child identity, handoff, source-fingerprint, and finalization behavior.

Current retained fixture behavior may classify missing required bundle evidence as `PAPER_AUTOPILOT_BLOCKED_ON_PINNED_BUNDLE`. That is truthful runtime-evidence routing and does not reopen the completed safe-local implementation queue.
