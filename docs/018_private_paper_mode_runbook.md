# 018 - BWS private paper runbook

```text
paper_mode_owner=betting-win-surebet
account_policy=separate_from_betting-win-betting
current_stage=continuous_runtime_implementation
current_task=BWS-580
safe_local_terminal_gate=BWS-580
```

## Validated foundation

`BWS-310` proves bounded private-paper domain behavior and `BWS-510` proves integrated loopback behavior. Those proofs remain binding.

## Safe local completion

`run-autonomous-implementation.sh` validated `BWS-520` through `BWS-580`, creating executable API/worker applications, explicit export and API convergence, persisted scheduling, operator lifecycle, runtime/API/cockpit convergence, integrated continuous-runtime acceptance, and the strict machine-readable runtime handoff.

Paper mode must select exactly one explicit upstream mode:

```text
export  immutable pinned betting-win export
api     typed read-only betting-win query/API
```

There is no automatic fallback between modes, fixtures or local mocks.

## Evidence

Evidence includes upstream lock, source fingerprints, BWS config, selected mode, intake checkpoints, quote freshness/depth, opportunity decisions, reservations, completions, residual exposure, settlement reconciliation, worker checkpoints, process identity, health/readiness and immutable artifacts.

## Continuous runtime gate

`BWS-600` remains blocked because accepted operator-approved betting-win continuous read-only runtime evidence and configuration do not yet exist. Loopback or fixture success cannot remove this external gate.

## Prohibited

No direct provider connection, provider account mutation, wallet, signer, order, public signal, profitability claim or real-money execution is allowed by this runbook.
