# Master Plan — betting-win-surebet

## Goal

Build a private, deterministic, paper-only downstream surebet / complete-set research repo that consumes canonical identity, rules, quote/depth evidence, settlement evidence, and generic paper infrastructure from `betting-win`.

This repo must never become the provider/evidence platform and must never become an executor.

## Current stage

```text
stage=SURE-001
status=skeleton and boundary controls only
provider_connections=prohibited
execution=prohibited
solver_implementation=blocked
pinned_betting_win_interface=missing
```

## First lane

```text
lane_id=polymarket_standard_binary_complete_set_v0
venue=polymarket
family=same_venue_complete_set
mode=paper_only
provider_connection=prohibited
execution=prohibited
identity_source=betting-win canonical identity
rules_source=betting-win rule profiles and settlement replay
quotes_source=betting-win retained quote/depth evidence or read-only export
settlement_source=betting-win settlement/finality replay
```

## Non-negotiable blockers before real implementation

Real surebet logic remains blocked until all of the following are available and pinned:

1. `betting-win` generated contract or export package version.
2. Canonical market identity shape.
3. Rule profile and result-source/finality shape.
4. Quote/depth/capacity evidence shape.
5. Settlement replay shape.
6. Generic paper ledger/capacity/reservation primitives.
7. Fixture bundle or read-only query/export interface for tests.

Until then, this repo may only contain docs, validators, stubs, empty fixture folders, and operational wrappers.

## SURE phases

### SURE-001 — Skeleton and hard boundary

Objective: create the repo skeleton, docs, ADRs, TypeScript stubs, tests, operational shell helpers, and fail-closed validators.

Required behavior:

```text
no provider SDK imports
no provider URLs
no wallet/signer/order/transaction paths
no direct betting-win PostgreSQL access
no core.* migrations
no manually vendored generated betting-win contracts
no solver implementation
```

Acceptance:

```bash
npm run validate
./run-autonomous-implementation.sh --check-only
```

### SURE-002 — Dependency contract with betting-win

Define exactly how this repo consumes `betting-win` outputs: contract package version, export bundle path, read-only query shape, canonical identity shape, rule profile shape, quote/depth shape, settlement replay shape, and paper ledger shape.

### SURE-003 — Market group and terminal scenario model

Represent one complete-set candidate group and its terminal scenarios from fixtures only.

### SURE-004 — Stake-vector solver

Compute paper stake vectors from a complete scenario cash-flow matrix and capacities.

### SURE-005 — Leg completion and residual exposure simulator

Simulate partial completion without assuming every leg fills.

### SURE-006 — Settlement replay

Replay accepted `betting-win` settlement/finality fixture data through surebet cash flows. This repo must not infer finality itself.

### SURE-007 — Private paper report

Produce deterministic private reports for candidates, blockers, residual exposure, and paper outcomes. Reports must avoid public signal language, profitability claims, and execution readiness claims.

## Autonomous implementation rules

The autonomous controller may work only on the first safe unchecked SURE phase. In SURE-001 it may improve docs/tooling/validators/stubs only.

It must not connect to providers, create execution modules, add wallet/signer/order dependencies, read or mutate `betting-win` databases, copy provider adapters from another repo, claim readiness based on reciprocal odds only, or mark later phases complete without pinned upstream evidence.

## Definition of done for this overlay

```bash
npm install
npm run validate
./run-autonomous-implementation.sh --check-only
./pull_artifacts_and_zip_codebase.sh --help
./zip_codebase.sh
./update_git.sh --help
```
