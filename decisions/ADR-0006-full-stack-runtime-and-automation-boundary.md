# ADR-0006: Full-stack runtime and automation boundary

## Status

Accepted for implementation planning.

## Context

`BWS-580` validated bounded runtime components and an API-only lifecycle owner, but root wrappers and paper controllers still represented a no-service phase. Treating that state as the final local implementation boundary would leave the application non-operational for unattended continuous private paper.

## Decision

The safe local terminal gate moves to `BWS-599`.

Product-owned source implements continuous convergence, scheduler, worker, API, cockpit, full-stack lifecycle, database operations, observability, release and recovery. Protected root wrappers and paper controllers are integrated only after the product lifecycle is validated and only through an exact protected-file allowlist.

`BWS-600` remains the external operator-approved runtime evidence gate. `BWS-900` remains the separate execution authorization gate.

## Consequences

- One-shot commands remain available for diagnostics but no longer define the final runtime.
- Root scripts delegate to product-owned lifecycle commands rather than implementing process ownership independently.
- Paper automation consumes machine-readable runtime evidence rather than fixture-only status.
- No provider or execution boundary is weakened.
