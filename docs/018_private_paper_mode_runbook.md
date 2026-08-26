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

`BWS-310` validates bounded private-paper domain behavior, `BWS-510` validates integrated loopback behavior, `BWS-582` validates long-running scheduler and worker services, and `BWS-520` through `BWS-584` validate executable components, bounded convergence and scheduling, managed loopback cockpit serving, a complete product-owned lifecycle owner, and runtime handoff.

## Cross-repository input contract

The accepted input is not any reachable betting-win HTTP service. Current BWS source requires `/contract` and `/query/*` with a pinned response/provenance envelope; the inspected betting-win operator server exposes `/dashboard/*` and records downstream runtime handoff as not allowed. Canonical detail is in `docs/002_dependency_contract_with_betting_win.md`.

## Current runtime evidence

`BWS-585` through `BWS-599` are validated. The active private-paper gate is `BWS-600`, using only an authorized, typed, contract-compatible betting-win downstream read-only API handoff.

The operator does not select an upstream mode. Runtime transport is fixed to API, and there is no export, fixture, mock, or file fallback. The supported root runtime path also fixes the policy to `paper`, provider connections disabled, and execution disabled. These invariants do not depend on private `.env` completeness. The operator must still provide the repo-local private-paper manifest content under the standard `runtime/operator-inputs/bws.private-paper-schedule.json` path or explicitly override `BWS_PRIVATE_PAPER_SCHEDULE_PATH`; the wrapper does not manufacture campaign plans. PostgreSQL runtime input is the canonical `POSTGRES_ADDRESS`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` tuple; `DB_URL` and `DB_URL_TEST` are retired.

## Evidence

Evidence includes upstream lock, source and release fingerprints, API transport, convergence and scheduler checkpoints, worker jobs, checkpoints and dead letters, strategy ledger, lifecycle ownership, database state, health/readiness/metrics, cockpit probes, backups/restores, failure injections, and immutable artifact indexes.

## External gate

`BWS-599` is validated. `BWS-600` remains blocked until an operator-approved and contract-compatible betting-win downstream API handoff, provider-to-PostgreSQL-to-API parity, compatible private BWS configuration, accepted campaign manifest, and retained external campaign evidence exist. Loopback, fixture, export, mock, local-BWS API, or synthesized-schedule success cannot satisfy this gate.

## Prohibited

No direct provider connection, provider credentials, account mutation, wallet, signer, order, public signal, profitability claim, or real-money execution is authorized.
