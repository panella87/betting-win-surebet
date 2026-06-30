# 008 — Leg completion and residual exposure

A paper candidate must not assume every leg completes. Future phases must model partial
completion and bounded residual exposure.

Required states for future implementation:

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

SURE-001 contains blocked stubs only.
