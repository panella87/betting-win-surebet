# ADR-0005 - BWS is built on the betting-win platform

Date: 2026-07-13

## Status

Accepted.

## Context

The original BWS bootstrap was documented as a fixture-only sidecar waiting for an unspecified interface. betting-win 0.48.0 now contains a concrete downstream export family, package boundaries, provider-history exports, consumption proofs, read-only query/API surfaces, and mature application patterns.

## Decision

BWS remains a separate repository but becomes a complete downstream application built on betting-win. It consumes exact contracts, immutable exports, and read-only API/client surfaces. It does not copy provider adapters, write betting-win `core.*`, or connect directly to providers.

BWS owns `surebet.*`, opportunity/solver logic, backtests, paper state, API, workers, web UI, and future explicitly gated execution decisions.

## Consequences

- Historical local-complete stop conditions are superseded.
- A dependency-ordered implementation program is active.
- An exact upstream lock is mandatory.
- Continuous paper requires accepted betting-win runtime evidence.
- Real-money execution remains separately gated.
