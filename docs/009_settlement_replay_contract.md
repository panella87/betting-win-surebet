# 009 — Settlement replay contract

`betting-win-surebet` must not infer settlement finality. It consumes accepted settlement
and finality replay outputs from `betting-win`.

Current local-only settlement replay consumption must require:

- Canonical market identity.
- Rule profile version.
- Terminal result state.
- Finality timestamp.
- Finality authority id.
- Replay manifest hash.
- Replay acceptance status.

In SURE-002A, the replay consumer may map an accepted local fixture outcome to a validated
terminal scenario for deterministic paper-only analysis. It must still fail closed on
missing finality authority, missing replay manifest hash, or mismatched complete-set context,
and it must not infer finality beyond the accepted replay fixture.
