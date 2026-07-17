# 018 - BWS private paper runbook

```text
paper_mode_owner=betting-win-surebet
account_policy=separate_from_betting-win-betting
current_stage=external_runtime_evidence
current_task=BWS-600
safe_local_terminal_gate=BWS-599
external_runtime_gate=BWS-600
runtime_upstream_mode=api_only
automatic_file_fallback=prohibited
```

## Validated foundation

`BWS-310` validates bounded private-paper domain behavior, `BWS-510` validates integrated loopback behavior, `BWS-582` validates long-running scheduler and worker services, and `BWS-520` through `BWS-584` validate executable components, bounded convergence/scheduling, managed loopback cockpit serving, a complete product-owned lifecycle owner and runtime handoff.

## Current runtime evidence

`BWS-585` through `BWS-599` are validated. The active private-paper gate is `BWS-600`, using only the typed operator-approved betting-win read-only API.

The operator does not select an upstream mode. Runtime transport is fixed to API, and there is no export, fixture, mock, or file fallback.

## Evidence

Evidence includes upstream lock, source/release fingerprints, selected mode, convergence and scheduler checkpoints, worker jobs/checkpoints/dead letters, strategy ledger, lifecycle ownership, database state, health/readiness/metrics, cockpit probes, backups/restores, failure injections and immutable artifact indexes.

## External gate

`BWS-600` remains blocked until `BWS-599` is validated and an operator-approved read-only input plus accepted campaign manifest exist. Loopback or fixture success cannot satisfy this gate.

## Prohibited

No direct provider connection, provider credentials, account mutation, wallet, signer, order, public signal, profitability claim or real-money execution is authorized.
