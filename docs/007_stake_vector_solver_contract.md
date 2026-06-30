# 007 — Stake-vector solver contract

The stake-vector solver is intentionally blocked in SURE-001.

Future implementation must use fixed-point integer amounts and must include:

- Minimum/maximum stake constraints.
- Capacity constraints.
- Rounding rules.
- Outcome-specific fees and costs.
- Worst-case residual exposure.
- A no-profitability-claim report format.

A solver result is not accepted without quote freshness, capacity evidence, leg completion
simulation, and settlement replay.
