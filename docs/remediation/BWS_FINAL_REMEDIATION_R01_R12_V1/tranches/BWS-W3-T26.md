
# BWS-W3-T26 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W3-T26
CAMPAIGN_ORDER: 4
STAGE: S1
PRIMARY_OWNER: R07
SECONDARY_REVIEWERS: R10, R11, R12
ISSUE_IDS: BWS120-R07-001, BWS120-R07-002
SEVERITY_COUNTS: {"P0": 2}
DEPENDENCIES: T38
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen review/finding baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; active campaign authority is pinned by activation/immutable-authority.sha256; exact current numbered archive or checkout, extracted-tree digest, Git identity, source paths, hashes, and modes must be captured in an external audit or admission receipt and reverified before editing; repository documentation does not self-attest a rolling numbered ZIP
CURRENT_SOURCE_PATH_CANDIDATES: packages/bootstrap/src/operations/observability.ts, tests/bws-observability.test.ts
SYMBOLS_TO_REVERIFY: 8 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: packages/bootstrap/src/operations/observability.ts, tests/bws-observability.test.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites ``approved repository-owned log root; closed recursive redaction policy``
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 11 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 11 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 8 classified records below
CONCURRENCY_OR_CRASH_TESTS: 0 classified records below
ENVIRONMENT_PROOF: {"NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION": 11}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: no out-of-repo write/rotation; all credential-bearing keys and value shapes redacted before persistence
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": true, "bws_710": false, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W1-T01 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `packages/bootstrap/src/operations/observability.ts` | present=yes | sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `tests/bws-observability.test.ts` | present=yes | sha256=b1f86186bd8cc389a620c6ef53b60b83e2b8c3ef3dd7e0dc635ca6e9f5fda6c5 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS120-R07-001 | `packages/bootstrap/src/operations/observability.ts` | symbol=createBwsStructuredLogger | reviewed_line_range=L268-L331 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-001 | `packages/bootstrap/src/operations/observability.ts` | symbol=rotateLogFileIfNeeded | reviewed_line_range=L783-L803 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-001 | `packages/bootstrap/src/operations/observability.ts` | symbol=None | reviewed_line_range=L268-L331 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-002 | `packages/bootstrap/src/operations/observability.ts` | symbol=SENSITIVE_KEY_PATTERN | reviewed_line_range=L50-L51 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-002 | `packages/bootstrap/src/operations/observability.ts` | symbol=sanitizeJsonValue | reviewed_line_range=L805-L837 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-002 | `tests/bws-observability.test.ts` | symbol=structured observability logs rotate and redact sensitive fields | reviewed_line_range=L16-L66 | reviewed_sha256=b1f86186bd8cc389a620c6ef53b60b83e2b8c3ef3dd7e0dc635ca6e9f5fda6c5
- BWS120-R07-002 | `packages/bootstrap/src/operations/observability.ts` | symbol=SENSITIVE_KEY_PATTERN / sanitizeJsonValue | reviewed_line_range=L50-L51; L805-L837 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-002 | `packages/bootstrap/src/operations/observability.ts` | symbol=None | reviewed_line_range=L50-L51; L805-L837 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS120-R07-001 — Configurable structured-log paths escape the repository and can rotate or append to out-of-bound files

- Severity: `P0`
- Current behavior: path.resolve(repositoryRoot, configuredValue) accepts an absolute value as-is and normalizes traversal outside the repository. mkdirSync, renameSync, and appendFileSync then operate there without a boundary check.
- Expected behavior: All managed observability output must be confined to a canonical repo-owned runtime directory, reject absolute/traversal paths, and reject every existing symlink segment before creating, rotating, or appending files.
- Invariant: All managed observability output must be confined to a canonical repo-owned runtime directory, reject absolute/traversal paths, and reject every existing symlink segment before creating, rotating, or appending files.
- Root cause: The logger treats an operator-controlled filesystem location as a generic resolved path rather than a confined repository resource.
- Trigger: Supply an absolute path or traversal path outside the repository, then emit a structured event for a role such as api.
- Minimal fix boundary: Confine the effective log directory under one explicit repo-owned root; reject absolute paths, traversal, and existing symlink segments before mkdir, rotation, and append. Keep the public logger API and valid relative paths unchanged.
- Regression risks:
- Over-confinement could reject legitimate test temp directories; tests should allow an explicit already-confined repositoryRoot fixture rather than a global fallback.

### BWS120-R07-002 — Structured-log redaction misses Authorization, Cookie, API-key, header, and value-shaped secrets

- Severity: `P0`
- Current behavior: Those keys do not match the source pattern, and non-URL strings are returned unchanged. The structured log is then retained and included in diagnostics.
- Expected behavior: Secret-bearing keys and recognizable credential values must be redacted recursively before any file write, rotation, diagnostic collection, or artifact packaging.
- Invariant: Secret-bearing keys and recognizable credential values must be redacted recursively before any file write, rotation, diagnostic collection, or artifact packaging.
- Root cause: Redaction is based on an incomplete immediate-key allow/deny regex and URL-origin coercion, not a closed recursive secret policy.
- Trigger: Log details such as {Authorization:"Bearer ..."}, {Cookie:"session=..."}, {apiKey:"..."}, or {headers:{authorization:"..."}}.
- Minimal fix boundary: Centralize redaction in a shared closed policy covering authorization/cookie/header/API-key aliases and credential-shaped values. Apply it before log serialization and diagnostics inclusion; do not expose raw values in error paths.
- Regression risks:
- Aggressive value-shape redaction can hide benign evidence identifiers; use explicit categories and preserve nonsecret hashes/IDs.


## Allowed edit boundary

- Candidate path set: `packages/bootstrap/src/operations/observability.ts`, `tests/bws-observability.test.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `packages/bootstrap/src/operations/observability.ts` | participating tranches=T22, T26, T27, T28 | predecessor postimage required
- `tests/bws-observability.test.ts` | participating tranches=T26, T28 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- Log record schema
- Nonsecret event codes
- all betting-win source, checkout, documentation, service, database, and runtime
- bounded URL-origin behavior
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds
- provider/execution disabled policy
- role names
- rotation size/count semantics for valid paths
- runtime process lifecycle
- source fingerprints

## Prerequisites

- Dependency terminal receipts: T38.
- Review prerequisites: `approved repository-owned log root; closed recursive redaction policy`.
- Exact BWS122 lineage or an explicitly accepted descendant source generation.
- Current protected authority, holds, runtime class, proof environments, rollback root, and exact test bindings.
- Exactly one admitted source-mutating tranche and no controller use before full S2 acceptance.

## Current-source reverification procedure

1. Capture activation-time Git HEAD/branch/upstream/dirty state and the exact source-generation identity.
2. Hash and mode-check every candidate path; compare finding-pinned symbols and reviewed behavior to current code.
3. Trace every caller and production entrypoint needed to establish the current behavior and unchanged boundary.
4. Classify each finding as reverified, moved, already resolved, contradicted, or blocked. Only reverified findings may proceed.
5. Reconcile any moved symbol, new path, dependency, owner, test, or environment need through explicit admission authority. Do not infer permission.
6. Capture a schema-valid current-source-reverification receipt before the first write.

## Implementation task breakdown

1. Freeze exact preimages, modes, shared-path predecessor postimages, and rollback material.
2. Resolve all contract/policy questions stated by the finding records; reject silent defaults.
3. Implement only the smallest coherent boundary that restores the stated invariants.
4. Add or update only explicitly admitted proof paths needed for mapped requirements.
5. Run every focused and production-entrypoint requirement in its mapped environment under exact runtime authority.
6. Run negative/adversarial and concurrency/crash proof where classified.
7. Verify unchanged authorities, non-admitted paths, holds, and source-generation lineage.
8. Emit postimage, test, environment, and tranche-result receipts; otherwise rollback or remain `BLOCKED`.

## Fail-closed and no-fallback requirements

- Missing, blank, null, unknown, malformed, stale, conflicting, wrong-generation, wrong-runtime, or unexecuted evidence is failure.
- No fixture, mock, local export, placeholder, declaration, status string, marker, synthesized schedule, caller assertion, or Node 22 result substitutes for required proof.
- No path, owner, dependency, environment, external authority, or hold decision is inferred.
- `SOURCE_COMPLETE_EXTERNAL_PENDING` is available only where the campaign map marks external acceptance pending and never promotes a hold.

## Focused tests

- `BWS120-R07-001-TEST-01` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-001 | requirement=Absolute-path rejection
- `BWS120-R07-001-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-001 | requirement=../ traversal rejection
- `BWS120-R07-001-TEST-03` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-001 | requirement=existing and intermediate symlink rejection
- `BWS120-R07-001-TEST-04` | category=api_or_projection | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-001 | requirement=outside-directory api.jsonl collision/rotation rejection
- `BWS120-R07-001-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-001 | requirement=valid repo-relative log rotation
- `BWS120-R07-002-TEST-01` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-002 | requirement=Authorization/Bearer redaction
- `BWS120-R07-002-TEST-02` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-002 | requirement=Cookie and Set-Cookie redaction
- `BWS120-R07-002-TEST-03` | category=api_or_projection | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-002 | requirement=apiKey/x-api-key redaction
- `BWS120-R07-002-TEST-04` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-002 | requirement=nested headers redaction
- `BWS120-R07-002-TEST-05` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-002 | requirement=Basic auth/PEM/connection-string value redaction
- `BWS120-R07-002-TEST-06` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-002 | requirement=negative tests for benign tokens such as event identifiers

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS120-R07-001-TEST-01` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-001 | requirement=Absolute-path rejection
- `BWS120-R07-001-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-001 | requirement=../ traversal rejection
- `BWS120-R07-001-TEST-03` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-001 | requirement=existing and intermediate symlink rejection
- `BWS120-R07-001-TEST-04` | category=api_or_projection | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-001 | requirement=outside-directory api.jsonl collision/rotation rejection
- `BWS120-R07-001-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-001 | requirement=valid repo-relative log rotation
- `BWS120-R07-002-TEST-01` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-002 | requirement=Authorization/Bearer redaction
- `BWS120-R07-002-TEST-02` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-002 | requirement=Cookie and Set-Cookie redaction
- `BWS120-R07-002-TEST-03` | category=api_or_projection | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-002 | requirement=apiKey/x-api-key redaction
- `BWS120-R07-002-TEST-04` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-002 | requirement=nested headers redaction
- `BWS120-R07-002-TEST-05` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-002 | requirement=Basic auth/PEM/connection-string value redaction
- `BWS120-R07-002-TEST-06` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-002 | requirement=negative tests for benign tokens such as event identifiers

## Negative and adversarial tests

- `BWS120-R07-001-TEST-01` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-001 | requirement=Absolute-path rejection
- `BWS120-R07-001-TEST-03` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-001 | requirement=existing and intermediate symlink rejection
- `BWS120-R07-001-TEST-04` | category=api_or_projection | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-001 | requirement=outside-directory api.jsonl collision/rotation rejection
- `BWS120-R07-002-TEST-01` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-002 | requirement=Authorization/Bearer redaction
- `BWS120-R07-002-TEST-02` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-002 | requirement=Cookie and Set-Cookie redaction
- `BWS120-R07-002-TEST-04` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-002 | requirement=nested headers redaction
- `BWS120-R07-002-TEST-05` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-002 | requirement=Basic auth/PEM/connection-string value redaction
- `BWS120-R07-002-TEST-06` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-002 | requirement=negative tests for benign tokens such as event identifiers

## Concurrency, cancellation, crash, and restart tests

- No separately classified record

## Environment proof

- NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION: 11 requirements

Node-based proof must report `node --version` exactly `v20.20.2`. Non-Node proof must identify its language/runtime and cannot use Node 22 output as acceptance. Disposable/controlled environments must be identified, isolated, and cleaned; real services or production state are never implied.

## Rollback and recovery plan

- Stop additional transaction-owned writes without terminating unrelated processes.
- Restore replacements from exact preimage bytes and modes; remove only admitted additions.
- Remove only empty directories created by the transaction.
- Re-hash all restored and protected paths; preserve unrelated dirty worktree content.
- Record failed restoration as `ROLLBACK_RESTORE_FAILED` and leave the tranche `BLOCKED`.
- A partial or ambiguous postimage cannot be inherited by the next tranche.

## Receipt requirements

### Preimage

- program_id and tranche_id
- campaign_order and stage
- repository identity and exact source_generation
- created_at with declared clock authority
- owner and reviewer identity
- previous_receipt_sha256 and parent_receipt_sha256 where applicable
- unresolved blockers and retained holds
- candidate paths with sha256, mode, size, and existence
- Git HEAD/upstream/dirty fields captured at activation or explicitly unavailable
- source-manifest stale-state classification

### Postimage

- program_id and tranche_id
- campaign_order and stage
- repository identity and exact source_generation
- created_at with declared clock authority
- owner and reviewer identity
- previous_receipt_sha256 and parent_receipt_sha256 where applicable
- unresolved blockers and retained holds
- exact changed paths, actions, sha256, mode, and size
- preimage-to-postimage relation
- unchanged-path proof and rollback material identity

### Test

- program_id and tranche_id
- campaign_order and stage
- repository identity and exact source_generation
- created_at with declared clock authority
- owner and reviewer identity
- previous_receipt_sha256 and parent_receipt_sha256 where applicable
- unresolved blockers and retained holds
- exact command, bounded timeout, exit status, stdout/stderr digests
- Node/runtime identity
- production-entrypoint flag and evidence path

### Environment

- program_id and tranche_id
- campaign_order and stage
- repository identity and exact source_generation
- created_at with declared clock authority
- owner and reviewer identity
- previous_receipt_sha256 and parent_receipt_sha256 where applicable
- unresolved blockers and retained holds
- proof lane and disposable/target identity
- generation IDs consumed
- result, evidence digests, cleanup result, and external-pending classification

## Acceptance

Acceptance authority: no out-of-repo write/rotation; all credential-bearing keys and value shapes redacted before persistence

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W1-T01` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
