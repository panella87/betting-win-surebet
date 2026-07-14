# ADR-0001 - Repository boundary and no direct provider connections

## Status

Accepted and retained as a permanent integration boundary.

## Decision

BWS is a downstream application on betting-win. It consumes exact contracts, immutable exports, and typed read-only query/API surfaces. It does not implement or copy provider adapters, direct provider SDK clients, provider credentials, or provider URLs.

## Consequences

Provider truth and canonical history remain in betting-win. BWS owns only surebet-specific derived state and references upstream evidence by exact provenance.
