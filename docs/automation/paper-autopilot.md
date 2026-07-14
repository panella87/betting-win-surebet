# Paper autopilot controller

`run-paper-autopilot.sh` is the parent workflow for post-implementation runtime/database convergence:

```text
paper evaluation -> runtime evidence -> implementation handoff -> paper re-evaluation
```

It is not selected for the initial `BWS_FULL_PLATFORM_IMPLEMENTATION_V1` build. Start it only after safe local tasks through `BWS-510` are validated or when a retained bugfix campaign explicitly requests runtime evidence.

The parent keeps one final Telegram notification and suppresses child notifications. It preserves strict lock, child identity, handoff, source-fingerprint, and finalization behavior.

Current retained fixture behavior may classify missing required bundle evidence as `PAPER_AUTOPILOT_BLOCKED_ON_PINNED_BUNDLE`. That does not replace the product implementation queue.
