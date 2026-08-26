# 011 - Validation matrix

| Gate | Failure prevented |
|---|---|
| `npm run typecheck` | Invalid TypeScript contracts or package boundaries |
| `npm test` | Broken domain, adapter, controller, or regression behavior after generating the exact committed-HEAD upstream lock and creating repo-local ignored test artifacts |
| `npm run validate:repo` | Missing authority files, scripts, tests, package commands, or conflict markers |
| `npm run validate:boundary` | Provider imports/URLs, direct DB/core ownership violations, execution paths, or fixture corruption |
| `npm run validate:ops` | Master-plan, controller, task-ledger, upstream-baseline, source-manifest, and automation drift |
| `npm run validate:implementation-program` | Missing or inconsistent BWS task IDs, dependencies, statuses, and current task |
| `npm run validate:loopback-acceptance` | Silent skips or missing disposable-PostgreSQL/upstream configuration for the DB-backed BWS-510 proof |
| `npm run validate:upstream-boundary` | Invented betting-win capabilities, unpinned modes, fallback semantics, or malformed upstream lock schema |
| `scripts/validate_three_repo_surebet_boundary.py` | Three-repo ownership drift, provider duplication, or legacy import regression |
| `scripts/validate_source_manifest.py` | Stale or incomplete source inventory |

## Cross-repository integration gates

| Gate | Required proof |
|---|---|
| Source snapshot audit | Exact archive SHA-256, package/workspace inventory, source limitations, and no claim that an archive is the runtime lock |
| Committed-HEAD data lock | `BETTING_WIN_REPO_PATH`, exact Git `HEAD`, tree/listing fingerprints, contract/profile capabilities, and no checkout mutation |
| Downstream API handoff | An accepted versioned contract endpoint, compatible query routes, response envelope, pagination, provenance, and GET-only enforcement |
| Provider-to-PostgreSQL-to-API parity | The same bounded real provider observation is preserved, normalized, persisted, and returned without silent fallback |
| BWS-600 preflight | The external betting-win API is not the BWS listener, exact contract negotiation succeeds, private PostgreSQL/schedule exist, and paper/no-provider/no-execution policy is enforced |
| B1 upstream gate | `betting-win.b1_multi_venue_markets.v1` is an accepted runtime resource, not only a schema/sample fixture |
| Execution SDK package gate | Separate-repo installation, deterministic package SHA-256, stable exports/types, no unavailable workspace dependency, and fail-closed defaults |
| BWS-900 execution gate | Separate authorization, SDK capability acceptance, downstream account/signer/risk/kill-switch/idempotency proof, and no betting-win write service |

Required contract tests include:

```text
tests/full-implementation-program-contract.test.ts
tests/betting-win-upstream-contract.test.ts
tests/three-repo-surebet-boundary.test.ts
tests/autonomous-continuation-contract.test.ts
tests/validate-repo-contract.test.ts
tests/validate-source-manifest.test.ts
```

Stateful rows require disposable PostgreSQL proof, restart/idempotency tests, and cleanup verification. API/UI/worker rows require loopback integration and bounded failure tests. Placeholder evidence cannot satisfy a gate.

Clean-checkout validation requirements:

```text
root TypeScript build first
exact betting-win committed-HEAD lock generated and verified before tests
repo-local artifacts directory created explicitly by the test bootstrap
managed cockpit build and validate:web preserve dist/apps/web/src Node modules while replacing static assets
serialized compiled test files
```

A prior controller run, retained `artifacts/` tree, generated upstream lock, or stale `dist/` output must never be required for `npm run validate` to pass. Cross-repository API or SDK readiness must not be simulated solely by BWS-local fixtures.
