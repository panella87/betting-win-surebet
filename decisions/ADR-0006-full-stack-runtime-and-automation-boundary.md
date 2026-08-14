# ADR-0006: Full-stack runtime and automation boundary

## Status

Accepted and implemented through `BWS-599`. Retained as historical decision and acceptance context, not current routing authority.

## Context

At the time of this decision, `BWS-580` had validated bounded runtime components and an API lifecycle owner, while root wrappers and paper controllers still represented a no-service phase. Treating that checkpoint as the final local implementation boundary would have left the application non-operational for unattended continuous private paper.

## Decision

The accepted decision was that the safe local terminal gate moves to `BWS-599`.

Product-owned source implements continuous convergence, scheduler, worker, API, cockpit, full-stack lifecycle, database operations, observability, release, and recovery. Protected root wrappers and paper controllers were integrated only after the product lifecycle was validated and only through an exact protected-file allowlist. That reviewed authorization is now closed.

`BWS-600` remains the external operator-approved runtime-evidence gate. `BWS-900` remains the separate execution authorization gate.

## Consequences

- One-shot commands remain available for diagnostics but do not define the final runtime.
- Root scripts delegate to product-owned lifecycle commands rather than implementing process ownership independently.
- Paper automation consumes machine-readable runtime evidence rather than fixture-only status.
- Current managed runtime transport is API-only; retained export/parser code is non-runtime compatibility evidence.
- No provider or execution boundary is weakened.
