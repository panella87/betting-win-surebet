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
managed cockpit build and `validate:web` preserve dist/apps/web/src Node modules while replacing static assets
serialized compiled test files
```

A prior controller run, retained `artifacts/` tree, generated upstream lock, or stale `dist/` output must never be required for `npm run validate` to pass.
