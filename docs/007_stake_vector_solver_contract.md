# 007 - Stake-vector solver contract

The solver receives an approved terminal-scenario cash-flow matrix plus quote/depth/fee/rounding constraints. It returns a deterministic fixed-point stake vector or a typed infeasibility result.

Requirements:

- no floating-point money;
- bounded integer arithmetic with overflow checks;
- complete terminal-scenario coverage;
- per-leg min/max/increment/depth constraints;
- fees and costs included before acceptance;
- deterministic tie-breaking;
- no NaN, Infinity, silent clipping, or optimistic missing values.

`BWS-220` owns the integrated solver proof.
