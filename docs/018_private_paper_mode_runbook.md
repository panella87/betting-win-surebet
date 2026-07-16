# 018 - BWS private paper runbook

```text
paper_mode_owner=betting-win-surebet
account_policy=separate_from_betting-win-betting
current_stage=operator_runtime_implementation
current_task=BWS-592
safe_local_terminal_gate=BWS-599
external_runtime_gate=BWS-600
```

## Validated foundation

`BWS-310` validates bounded private-paper domain behavior, `BWS-510` validates integrated loopback behavior, `BWS-582` validates long-running scheduler and worker services, and `BWS-520` through `BWS-584` validate executable components, bounded convergence/scheduling, managed loopback cockpit serving, a complete product-owned lifecycle owner and runtime handoff.

## Remaining implementation

`BWS-585` through `BWS-599` continue converting those components into a continuous operator-owned stack with complete lifecycle ownership, observability, protected wrapper integration, service-owned paper evaluation, paper autopilot, release/recovery tooling, soak proof and final local acceptance after `BWS-583` closed managed cockpit serving.

Private paper selects exactly one explicit upstream mode:

```text
export  immutable pinned betting-win export
api     typed operator-approved read-only betting-win query/API
```

There is no automatic fallback to another mode, fixture or mock.

## Evidence

Evidence includes upstream lock, source/release fingerprints, selected mode, convergence and scheduler checkpoints, worker jobs/checkpoints/dead letters, strategy ledger, lifecycle ownership, database state, health/readiness/metrics, cockpit probes, backups/restores, failure injections and immutable artifact indexes.

## External gate

`BWS-600` remains blocked until `BWS-599` is validated and an operator-approved read-only input plus accepted campaign manifest exist. Loopback or fixture success cannot satisfy this gate.

## Prohibited

No direct provider connection, provider credentials, account mutation, wallet, signer, order, public signal, profitability claim or real-money execution is authorized.
