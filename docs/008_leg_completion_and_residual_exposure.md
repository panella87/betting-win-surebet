# 008 — Leg completion and residual exposure

A paper candidate must not assume every leg completes. Future phases must model partial
completion and bounded residual exposure.

Required states:

```text
leg_open
leg_reserved
leg_filled
leg_failed
leg_stale
leg_settlement_pending
group_complete
group_incomplete
manual_kill
```

`src/simulation/leg-completion.ts` now implements the local paper completion state machine from SURE-005. Residual exposure remains a separate follow-up slice.
