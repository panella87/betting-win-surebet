# 007 — Stake-vector solver contract

SURE-004 may solve a local paper-only standard-binary stake vector from validated terminal
scenario cash-flow rows.

The local solver contract must:

- Use fixed-point integer amounts only.
- Require exactly two complete-set legs and two terminal scenarios.
- Enforce one local min/max capacity constraint and one local rounding step per leg.
- Keep per-leg stake, fee, and cost terms consistent across terminal scenarios.
- Output blockers instead of acceptance when capacity, rounding, or payoff terms cannot
  cover both standard-binary terminal scenarios.
- Avoid profitability or execution-readiness claims.

A solver result is not accepted without quote freshness, capacity evidence, leg completion
simulation, and settlement replay.
