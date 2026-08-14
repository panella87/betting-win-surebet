# ADR-0005 - BWS is built on the betting-win platform

Date: 2026-07-13

## Status

Accepted and implemented through the validated safe-local gate `BWS-599`; dependency-ready B1 local work is validated through `BWS-820`.

## Context

The original BWS bootstrap was documented as a fixture-only sidecar waiting for an unspecified interface. The inspected betting-win 0.48.0 baseline supplied a concrete downstream export family, package boundaries, provider-history exports, consumption proofs, read-only query/API surfaces, and mature application patterns. That baseline remains historical design evidence; the current runtime lock is generated from the operator-provided betting-win checkout's committed `HEAD`.

## Decision

BWS remains a separate repository but is a complete downstream application built on betting-win. It consumes exact contracts, immutable compatibility inputs, and read-only API/client surfaces. It does not copy provider adapters, write betting-win `core.*`, or connect directly to providers.

BWS owns `surebet.*`, opportunity and solver logic, backtests, paper state, API, workers, web UI, and future explicitly gated execution decisions.

## Consequences

- Historical local-complete stop conditions are superseded.
- The dependency-ordered safe-local implementation program completed through `BWS-599`; no implementation queue is active now.
- An exact committed-HEAD upstream lock is mandatory.
- Continuous private paper remains blocked on accepted operator-approved betting-win runtime evidence at `BWS-600`.
- Real-money execution remains separately gated at `BWS-900`.
