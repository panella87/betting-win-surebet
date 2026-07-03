# ADR-0001 — Repo boundary and no provider connections

Superseding note: ADR-0004 is now the accepted three-repo surebet strategy boundary. This ADR remains the current no-direct-provider safety gate.


## Status

Accepted.

## Decision

`betting-win-surebet` is a downstream consumer of `betting-win` contracts and exports. It
must not implement provider connections, provider credentials, provider SDK imports, or
provider adapters.

## Consequences

All provider truth remains upstream in `betting-win`. This repo can only analyze pinned
read-only evidence once the interface is provided.
