# 009 — Settlement replay contract

`betting-win-surebet` must not infer settlement finality. It consumes accepted settlement
and finality replay outputs from `betting-win`.

Required future inputs:

- Canonical market identity.
- Rule profile version.
- Terminal result state.
- Finality timestamp.
- Replay manifest hash.
- Replay acceptance status.

Without accepted upstream replay, the candidate remains blocked.
