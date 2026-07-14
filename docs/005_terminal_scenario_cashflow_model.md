# 005 - Terminal scenario cash-flow model

For every candidate, BWS constructs the complete terminal scenario set and computes integer cash flows per leg and scenario after price, fees, denomination, rounding, void/refund, and settlement rules.

No opportunity is accepted when terminal coverage is incomplete, a payoff is ambiguous, currencies differ without an explicit approved conversion contract, or a rule/finality reference is missing.

The model uses fixed-point integer units only. It is part of `BWS-200` through `BWS-220` and must preserve deterministic bootstrap behavior during migration.
