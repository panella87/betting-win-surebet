# ADR-0005 - BWS is built on the betting-win platform

Date: 2026-07-13
Updated: 2026-08-26

## Status

Accepted and implemented through the validated safe-local gate `BWS-599`; dependency-ready B1 local work is validated through `BWS-820`. External data-plane and execution-plane integration remain gated.

## Context

The original BWS bootstrap was a fixture-only sidecar waiting for an unspecified interface. Betting-win 0.48.0 supplies provider collection, raw evidence, normalization, canonical identity/history, PostgreSQL-shaped persistence, a GET-only platform API, immutable exports, and a partial installable execution SDK.

A new source reconciliation against `betting-win218(3).zip` confirms that the architecture is concrete, but it also proves that current cross-repository runtime acceptance is incomplete:

```text
betting_win_downstream_runtime_api_handoff_allowed=no
betting_win_operator_api_route_family=/dashboard/*
bws_expected_contract_probe=/contract
bws_expected_query_route_family=/query/*
bws600_wire_contract=not_accepted
b1_runtime_resource=not_accepted
execution_sdk=partial_fail_closed
```

## Decision

BWS remains a separate complete downstream application built on betting-win. It consumes exact immutable historical inputs and, for current runtime, only an explicitly accepted read-only API. It does not copy provider adapters, write betting-win `core.*`, directly read betting-win PostgreSQL, or connect to providers.

BWS owns `surebet.*`, market equivalence, opportunity and solver logic, backtests, paper state, API, workers, web UI, lifecycle, and future explicitly gated execution decisions.

Betting-win owns the strategy-free `@betting-win/execution-sdk`. After BWS-900 authorization, the SDK may run inside BWS with downstream-injected accounts, credentials, signers, transport, risk, and kill switches. Betting-win remains GET-only and does not execute on behalf of BWS.

## Consequences

- `BWS-100` through `BWS-599` remain validated and closed.
- The B1 dependency-ready local queue remains closed through BWS-820.
- An exact committed-HEAD upstream data lock remains mandatory.
- The data lock does not prove runtime wire compatibility or provider-to-PostgreSQL-to-API acceptance.
- BWS-600 remains blocked until the downstream API handoff is explicitly accepted.
- BWS-710 remains blocked until the B1 schema becomes an accepted runtime resource/API contract.
- BWS-900 remains parked; real SDK write methods are not authorized.
- A future SDK integration requires a distinct package artifact lock and isolated cross-repo consumer proof.
