# 002 — Dependency contract with betting-win

This repo depends on `betting-win` for canonical truth. The dependency must be explicit,
pinned, read-only, and reproducible.

## Accepted dependency forms

- A pinned generated contract package.
- A pinned export bundle with manifest hash.
- A read-only query response fixture exported by `betting-win`.

## Required future inputs

- Contract package version.
- Export bundle path and manifest hash.
- Canonical market identity shape.
- Rule profile shape.
- Quote/depth shape.
- Settlement replay shape.
- Paper ledger shape.

## Forbidden dependency forms

- Direct `betting-win` PostgreSQL access.
- `core.*` migrations or schema ownership.
- Provider credentials or provider API calls.
- Manually vendored generated contracts without a pinned source manifest.

SURE-002 should replace the current blocked stubs with a real pinned import contract.
