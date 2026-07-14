# 018 - BWS private paper runbook

```text
paper_mode_owner=betting-win-surebet
account_policy=separate_from_betting-win-betting
current_stage=implementation_before_runtime
```

## Before BWS-510

Use the implementation controller, not paper autopilot, to build the platform. The current paper controller may run retained local fixtures for regression checks, but that is not final runtime evidence.

## After BWS-510

Paper mode selects exactly one explicit upstream mode:

```text
export  immutable pinned betting-win export
api     typed read-only betting-win query/API
```

Evidence includes upstream lock, source fingerprints, BWS config, quote freshness/depth, opportunity decisions, reservations, completions, residual exposure, settlement reconciliation, worker checkpoints, health/readiness, and immutable artifacts.

## Continuous runtime gate

`BWS-600` remains blocked until accepted betting-win continuous read-only runtime evidence and operator configuration exist. Loopback or fixture success cannot remove this blocker.

## Prohibited

No direct provider connection, provider account mutation, wallet, signer, order, public signal, profitability claim, or real-money execution is allowed by this runbook.
