# ADR-0001 - Repository boundary and no direct provider connections

## Status

Accepted and retained as a permanent integration boundary.

## Decision

BWS is a downstream application on betting-win. It consumes exact contracts, immutable historical exports, and an explicitly accepted typed read-only API. It does not implement or copy provider adapters, direct provider SDK clients, provider URLs, or provider credentials.

The upstream data service remains GET-only. A future authorized BWS executor may consume the strategy-free `@betting-win/execution-sdk` library inside the BWS process, but this does not authorize direct provider implementation in BWS or a betting-win write service.

## Consequences

Provider truth, canonical history, provider generations, and shared provider mechanics remain in betting-win. BWS owns surebet decisions and derived state. Current runtime must fail closed until the cross-repository data API contract is accepted. Future SDK use requires BWS-900, a separate package lock, downstream-owned credentials/signers/transports, and no copied mechanics.
