# 045 - External runtime preflight and campaign-manifest implementation blueprint

> **Completed historical implementation blueprint.** `BWS-593` is validated. This file remains acceptance and recovery history, not current controller routing. Current authority is `docs/automation/current-implementation-task.md`; the selected route is `run-paper-autopilot.sh` for the externally gated API-only BWS-600 campaign.

```text
parent_task=BWS-593
cohesive_tranche=soak_and_preflight
status=VALIDATED
routing_status=HISTORICAL_COMPLETED_BLUEPRINT
output_schema=bws.external_runtime_campaign.v1
historical_input_contract=export_or_api
current_runtime_upstream_mode=api_only
```

## Historical goal

The completed task implemented a fail-closed, check-only preflight that validated exactly one operator-selected read-only upstream input and generated the immutable manifest required to start `BWS-600`. Local implementation and tests could not contact providers or start the external campaign.

The historical implementation accepted export and API input shapes for deterministic local compatibility proof. The current BWS-600 runtime boundary has since retired export mode: only an operator-approved, authorized, contract-compatible betting-win downstream read-only API handoff with accepted real-provider parity may satisfy the campaign gate.

## Historical Exactly-one-mode input

### Export mode, retained compatibility only

The historical implementation required explicit:

```text
immutable export path
expected file SHA-256
contract schema and alias
surebet profile
provider generation ids
source-lineage ids
expected upstream-lock record
```

It rejected directories, mutable discovery, missing hashes, unsupported profiles, and fallback to fixtures or API. This export path is retained for historical deterministic acceptance and parser/migration compatibility only; it is not a current BWS-600 runtime input.

### API mode, current runtime contract

The implementation required explicit:

```text
operator-approved read-only base URL
contract version
page size and maximum pages
request timeout
retry count and backoff
expected upstream-lock record
```

It rejected provider URLs, provider credentials, non-read-only capabilities, public BWS binding, unbounded pagination, and fallback to export or fixtures. The current runtime also rejects the local BWS API as upstream betting-win evidence.

## Private configuration validation

The preflight validates presence and compatibility, never secret values, for:

- BWS PostgreSQL connection and migration status;
- private-paper runtime mode;
- provider connections disabled;
- execution disabled;
- loopback API and cockpit configuration;
- release semantic fingerprint and install-verification result;
- upstream-lock fingerprint;
- recent backup and restore-verification evidence;
- accepted `BWS-592` soak evidence;
- evidence and log storage capacity and retention class.

Duplicate keys, partial tuples, ambiguous host or socket selection, and secret-bearing output fail closed.

## Campaign manifest

`bws.external_runtime_campaign.v1` binds:

```text
manifest schema and semantic fingerprint
selected input and normalized non-secret settings
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

The manifest is canonicalized and checksum-addressed. It must not contain passwords, tokens, complete credential URLs, environment-file contents, or provider credentials. For the current BWS-600 route, the selected input must be API.

## Check-only guarantee

Preflight may inspect local files, Git objects, release manifests, database metadata through the configured BWS role, and an operator-approved read-only API contract endpoint only when explicitly requested. The default check-only path starts no service, launches no paper campaign, and mutates no database.

Local tests historically used immutable export fixtures and a loopback read-only API server. Fixture success proves the preflight implementation only and cannot validate `BWS-600`.

## Historical acceptance

Required success proof included:

- deterministic export-mode manifest for retained compatibility;
- deterministic API-mode manifest against loopback fixtures;
- exact release, lock, backup, and soak evidence binding;
- check-only no-start and no-mutation proof;
- redaction scan over stdout, logs, and manifest.

Required failure proof included every missing, duplicate, stale, mismatched, public, fallback, provider-enabled, or execution-enabled input. Current runtime acceptance additionally rejects export-mode campaign manifests.

## Unchanged areas

`BWS-600` remains `BLOCKED` until an operator supplies the accepted running read-only betting-win API, private BWS configuration, and retained external campaign evidence after validated `BWS-599`.
