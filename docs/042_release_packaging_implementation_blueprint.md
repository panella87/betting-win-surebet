# 042 - Release packaging implementation blueprint

```text
parent_task=BWS-590
cohesive_tranche=release_and_recovery
status=PENDING
```

## Goal

Produce a reproducible private BWS release that can be verified from a fresh extraction without starting services, modifying a database, installing a user service or exposing secrets.

The largest safe cohesive `BWS-590` tranche includes the release manifest, deterministic archive builder, platform preflight, private environment template, user-service templates, install verification and immutable evidence. Do not split these into isolated placeholders when they can be completed and validated together.

## Required source surfaces

Prefer the existing bootstrap operations and CLI structure. New files should remain under the established boundaries, for example:

```text
packages/bootstrap/src/operations/release-packaging.ts
packages/bootstrap/src/cli/bws-release-packaging.ts
src/operations/release-packaging.ts
src/cli/bws-release-packaging.ts
schemas/bws-release-manifest.v1.schema.json
deployment/systemd-user/
config/bws.private.env.template
```

Exact names may follow existing repository patterns, but the implementation must not create a parallel framework or bypass `packages/bootstrap`.

## Release identity

The machine-readable release manifest must include:

```text
schema and release version
release id and semantic fingerprint
created-at timestamp separated from deterministic content fingerprint
source manifest SHA-256
package-lock SHA-256
Node major requirement
PostgreSQL compatibility requirement
exact betting-win upstream lock record and fingerprint
built server file inventory and SHA-256 values
built cockpit asset metadata and SHA-256 values
migration inventory and checksums
required executable paths and modes
private runtime policy markers
archive inventory and checksum
```

Timestamps must not make the semantic release fingerprint non-deterministic. Two builds from identical source and dependency lock state must produce the same content manifest and file checksums.

## Archive boundary

The release package must include only source-owned or built runtime inputs required by BWS. It must exclude:

```text
.env and credentials
runtime state and PID files
artifacts and historical controller output
databases, backups and restored data
node_modules caches
Git metadata
provider credentials or direct provider clients
execution configuration that enables mutation
```

Publication must use a temporary path and atomic rename. Existing output is not overwritten without an explicit safe option.

## Platform and private configuration preflight

Preflight must validate without printing secret values:

- Node 20 and npm availability;
- PostgreSQL client/server compatibility required by the release;
- required commands and executable modes;
- canonical release directory and writable operator-selected state/evidence paths;
- private environment-file presence and required key presence;
- loopback API and cockpit configuration;
- `SUREBET_RUNTIME_MODE=private_paper`, provider connections disabled and execution disabled;
- exact upstream-lock and selected-mode requirements;
- disk space sufficient for release, evidence and backup policy.

Partial or ambiguous configuration fails closed. Complete URLs, passwords, tokens and environment values are never emitted.

## User-service templates

Provide non-privileged templates only. Autonomous validation must not install, enable, disable or restart user services.

Templates must:

- reference the exact release directory;
- reference an operator-owned private `EnvironmentFile` path;
- call only the product-owned lifecycle start/status/stop surfaces;
- keep API and cockpit loopback-only;
- use explicit state, log and evidence paths;
- preserve manual-stop semantics and avoid restart after an intentional stop;
- avoid broad process matching, shell replacement and root privileges.

## Non-mutating install verification

Install verification must operate on an extracted release and prove:

- manifest/schema validity and checksum parity;
- required files and executable modes;
- Node/PostgreSQL compatibility;
- cockpit build metadata and API-base consistency;
- migration inventory consistency without applying migrations;
- user-service template substitution and forbidden-command scans;
- private policy markers and no provider/execution access;
- no dependency on the original source checkout.

It must not start services, alter a database, write outside an explicit temporary verification directory or require secrets.

## Acceptance matrix

Required success proof:

1. Build two releases from identical source and compare semantic fingerprints and inventories.
2. Extract into a clean temporary directory and run install verification.
3. Verify service templates against the extracted release path and a synthetic private environment-file path.
4. Verify the release references the exact committed-HEAD upstream lock.
5. Publish release manifest, archive checksum and verification result into the evidence index.

Required failure proof:

```text
source manifest mismatch
package-lock mismatch
missing or altered build output
cockpit asset mismatch
migration checksum mismatch
missing Node or PostgreSQL compatibility
partial private configuration
secret-bearing manifest or output
public bind or mock cockpit mode
provider or execution enablement
archive overwrite without explicit authorization
```

## Validation

At minimum:

```text
npm run typecheck
focused release and template tests
fresh extraction install verification
secret-output scan
archive inventory and checksum parity
npm run validate
```

## Unchanged areas

Do not modify the betting-win checkout, provider adapters, execution boundaries, existing controller packaging, persistent project databases or active user services.
