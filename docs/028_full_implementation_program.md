# 028 - Full implementation program

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
```

Objective: implement every safe local component required for a production-shaped surebet backtest and private-paper application on betting-win.

The program starts at `BWS-100` and reaches safe local completion at `BWS-510`. It covers upstream pinning, workspace migration, `surebet.*` persistence, exact export/API intake, opportunity/solver/simulation/settlement integration, backtests, paper runtime, API, workers, web UI, operations, and loopback acceptance.

The implementation controller selects the first dependency-ready `PENDING` row, implements a bounded coherent slice, validates, updates evidence, and continues.

It must not modify the betting-win checkout, copy provider adapters, invent upstream contracts/commits, use direct provider endpoints/credentials, write betting-win `core.*`, add execution paths, silently fall back between upstream modes, or mark tasks validated without proof.

`BWS-600` and `BWS-900` remain external/authorization gates.
