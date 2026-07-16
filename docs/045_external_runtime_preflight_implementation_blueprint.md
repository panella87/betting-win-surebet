# 045 - External runtime preflight and campaign-manifest implementation blueprint

```text
parent_task=BWS-593
cohesive_tranche=soak_and_preflight
status=WAITING_FOR_BWS_592
output_schema=bws.external_runtime_campaign.v1
```

## Goal

Implement a fail-closed, check-only preflight that validates exactly one operator-selected read-only upstream mode and generates the immutable manifest required to start `BWS-600`. Local implementation and tests must not contact providers or start the external campaign.

## Exactly-one-mode input

### Export mode

Require explicit:

```text
immutable export path
expected file SHA-256
contract schema and alias
surebet profile
provider generation ids
source-lineage ids
expected upstream-lock record
```

Reject directories, mutable discovery, missing hashes, unsupported profiles and any fallback to fixtures or API.

### API mode

Require explicit:

```text
operator-approved read-only base URL
contract version
page size and maximum pages
request timeout
retry count and backoff
expected upstream-lock record
```

Reject provider URLs, provider credentials, non-read-only capabilities, public BWS binding, unbounded pagination and fallback to export or fixtures.

## Private configuration validation

Validate presence and compatibility, never values, for:

- BWS PostgreSQL connection and migration status;
- private-paper runtime mode;
- provider connections disabled;
- execution disabled;
- loopback API and cockpit configuration;
- release semantic fingerprint and install-verification result;
- upstream-lock fingerprint;
- recent backup and restore-verification evidence;
- accepted `BWS-592` soak evidence;
- evidence/log storage capacity and retention class.

Duplicate keys, partial tuples, ambiguous host/socket selection and secret-bearing output fail closed.

## Campaign manifest

`bws.external_runtime_campaign.v1` must include:

```text
manifest schema and semantic fingerprint
selected mode and normalized non-secret settings
release and source fingerprints
exact upstream lock and expected input evidence
BWS database identity without credentials
loopback service endpoints
paper-autopilot campaign limits
backup, restore and soak evidence references
runtime/evidence directories
closed provider and execution policy
created-at timestamp separated from deterministic semantic fingerprint
```

The manifest must be canonicalized and checksum-addressed. It must not contain passwords, tokens, complete credential URLs, environment-file contents or provider credentials.

## Check-only guarantee

Preflight may inspect local files, Git objects, release manifests, database metadata through the configured BWS role and an operator-approved read-only API contract endpoint only when explicitly requested. The default check-only path must start no service, launch no paper campaign and mutate no database.

Local tests use immutable export fixtures and a loopback read-only API server. Fixture success proves the preflight implementation only and cannot validate `BWS-600`.

## Acceptance

Required success proof:

- deterministic export-mode manifest;
- deterministic API-mode manifest against loopback fixtures;
- exact release, lock, backup and soak evidence binding;
- check-only no-start and no-mutation proof;
- redaction scan over stdout, logs and manifest.

Required failure proof includes every missing, duplicate, stale, mismatched, public, fallback, provider-enabled or execution-enabled input.

## Unchanged areas

`BWS-600` remains `BLOCKED` until an operator supplies accepted read-only runtime input and retained external campaign evidence after `BWS-599`.
