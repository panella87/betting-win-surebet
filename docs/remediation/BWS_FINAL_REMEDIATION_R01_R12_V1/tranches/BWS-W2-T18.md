
# BWS-W2-T18 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W2-T18
CAMPAIGN_ORDER: 36
STAGE: S5
PRIMARY_OWNER: R05
SECONDARY_REVIEWERS: R01, R02, R03, R06, R07, R10, R11, R24
ISSUE_IDS: BWS118-R05-001, BWS118-R05-006, BWS118-R05-009
SEVERITY_COUNTS: {"P1": 2, "P2": 1}
DEPENDENCIES: T03, T26
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen review/finding baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; active campaign authority is pinned by activation/immutable-authority.sha256; exact current numbered archive or checkout, extracted-tree digest, Git identity, source paths, hashes, and modes must be captured in an external audit or admission receipt and reverified before editing; repository documentation does not self-attest a rolling numbered ZIP
CURRENT_SOURCE_PATH_CANDIDATES: apps/web/src/api/client.ts, packages/bootstrap/src/api/bws-read-only-query-http.ts, packages/bootstrap/src/api/bws-read-only-query-service.ts
SYMBOLS_TO_REVERIFY: 7 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: apps/web/src/api/client.ts, packages/bootstrap/src/api/bws-read-only-query-http.ts, packages/bootstrap/src/api/bws-read-only-query-service.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites `- BWS-W1-T03`
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 11 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 11 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 1 classified records below
CONCURRENCY_OR_CRASH_TESTS: 0 classified records below
ENVIRONMENT_PROOF: {"NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED": 11}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: - Validation/policy/not-found/conflict/unavailable/timeout/internal errors distinct
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": false, "bws_710": false, "deployment": false, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W2-T19 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `apps/web/src/api/client.ts` | present=yes | sha256=8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/api/bws-read-only-query-http.ts` | present=yes | sha256=fc644a168e07d1afa63d84fa85582cda9c37994b2b4d66ea7366c1f442c7ac17 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` | present=yes | sha256=896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS118-R05-001 | `packages/bootstrap/src/api/bws-read-only-query-http.ts` | symbol=createBwsReadOnlyQueryHttpHandler query dispatch and catch | reviewed_line_range=157-217 | reviewed_sha256=fc644a168e07d1afa63d84fa85582cda9c37994b2b4d66ea7366c1f442c7ac17
- BWS118-R05-001 | `packages/bootstrap/src/api/bws-read-only-query-http.ts` | symbol=writeBlockedResponse | reviewed_line_range=380-401 | reviewed_sha256=fc644a168e07d1afa63d84fa85582cda9c37994b2b4d66ea7366c1f442c7ac17
- BWS118-R05-006 | `packages/bootstrap/src/api/bws-read-only-query-service.ts` | symbol=BwsReadOnlyQueryPage / BwsReadOnlyQueryResponse | reviewed_line_range=97-115 | reviewed_sha256=896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424
- BWS118-R05-006 | `apps/web/src/api/client.ts` | symbol=assertReadOnlyQueryResponse | reviewed_line_range=692-762 | reviewed_sha256=8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97
- BWS118-R05-006 | `apps/web/src/api/client.ts` | symbol=response-versus-request item-loop assertions | reviewed_line_range=980-1144 | reviewed_sha256=8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97
- BWS118-R05-009 | `packages/bootstrap/src/api/bws-read-only-query-service.ts` | symbol=describeBwsReadOnlyQueryServiceBoundary / boundary construction | reviewed_line_range=345-366 | reviewed_sha256=896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424
- BWS118-R05-009 | `apps/web/src/api/client.ts` | symbol=assertReadOnlyQueryResponse boundary validation | reviewed_line_range=707-717 | reviewed_sha256=8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS118-R05-001 — The HTTP boundary collapses validation, policy, persistence, and internal failures into HTTP 400 and returns raw exception text

- Severity: `P2`
- Current behavior: Every service blocker is emitted as HTTP 400 using only blockers[0]. A single broad catch also maps unexpected exceptions to HTTP 400/BWS_QUERY_REQUEST_INVALID and returns Error.message verbatim.
- Expected behavior: Request-validation failures, domain-policy holds, not-found results, dependency outages, and unexpected internal faults must retain distinct status classes and sanitized envelopes; all relevant blockers must remain available to operators without exposing internals.
- Invariant: Request-validation failures, domain-policy holds, not-found results, dependency outages, and unexpected internal faults must retain distinct status classes and sanitized envelopes; all relevant blockers must remain available to operators without exposing internals.
- Root cause: The HTTP adapter has one catch-all request error path and no typed translation layer from query/domain/repository errors to a stable public error taxonomy.
- Trigger: Trigger a repository exception, service availability failure, malformed persisted row, or a blocked result with more than one diagnostic.
- Minimal fix boundary: Change only the R05 HTTP/error-envelope boundary: classify malformed input, policy hold, not found, conflict, unavailable dependency, timeout, and internal failure; sanitize internal exceptions; preserve a bounded blocker list or diagnostic identifier. Do not alter repository transaction semantics.
- Regression risks:
- Status-code changes can affect cockpit copy and operator retry behavior.
- Sanitization must retain enough stable diagnostic identity for support.
- Do not convert accepted holds into transient infrastructure failures.

### BWS118-R05-006 — Successful response envelopes omit the exact query, filter, sort, and snapshot scope, so empty wrong-scope pages pass client validation vacuously

- Severity: `P1`
- Current behavior: The envelope contains only boundary strings, generatedAt, resource, items, pageSize, returnedCount, and optional cursor. The client verifies scope by iterating returned items; an empty array makes every scope check pass.
- Expected behavior: Every page must carry or cryptographically bind the exact normalized query/filter/sort/expand contract, page size, cursor lineage, snapshot/high-watermark, and response completeness. The client must compare this receipt before interpreting items.
- Invariant: Every page must carry or cryptographically bind the exact normalized query/filter/sort/expand contract, page size, cursor lineage, snapshot/high-watermark, and response completeness. The client must compare this receipt before interpreting items.
- Root cause: Scope integrity is inferred from row contents instead of being an explicit page-level contract.
- Trigger: Request one scope but return an empty successful page generated for another filter/sort/page scope.
- Minimal fix boundary: Extend the R05 response envelope with a versioned normalized-request receipt/digest, canonical order, snapshot identity, and completeness status; validate it before item parsing. Use R01 page/record receipt concepts as dependencies without duplicating upstream intake defects.
- Regression risks:
- Envelope changes require web/client compatibility versioning.
- Do not trust a caller-supplied echoed request without server binding.
- Canonical filter serialization must not inherit locale-dependent ordering.

### BWS118-R05-009 — The cockpit accepts arbitrary non-empty service and upstream-client boundary identifiers instead of exact compatible versions

- Severity: `P1`
- Current behavior: Only automaticFallback is checked exactly. Both boundary identifiers are accepted as any non-empty string.
- Expected behavior: The web client must require an explicit supported boundary/version pair and reject unknown, future, historical, or mixed contracts before reading items.
- Invariant: The web client must require an explicit supported boundary/version pair and reject unknown, future, historical, or mixed contracts before reading items.
- Root cause: Boundary strings are treated as diagnostics rather than negotiated compatibility constraints.
- Trigger: Return arbitrary-old-or-incompatible-service and arbitrary-client as the two boundary strings.
- Minimal fix boundary: Define the exact supported R05 boundary versions in one shared contract, validate both identifiers before page parsing, and require an explicit version bump/migration for incompatible response changes.
- Regression risks:
- Tight validation can break older deployed cockpits; use explicit compatibility policy.
- Do not silently accept a list of versions without semantic tests.
- Shared generation belongs to R11 if generated output is introduced.


## Allowed edit boundary

- Candidate path set: `apps/web/src/api/client.ts`, `packages/bootstrap/src/api/bws-read-only-query-http.ts`, `packages/bootstrap/src/api/bws-read-only-query-service.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `apps/web/src/api/client.ts` | participating tranches=T18, T19, T20 | predecessor postimage required
- `packages/bootstrap/src/api/bws-read-only-query-http.ts` | participating tranches=T18, T22, T23 | predecessor postimage required
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` | participating tranches=T18, T19, T32 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- - GET-only route set
- API route set
- BWS query mathematics
- Browser loopback confinement
- Database transaction isolation
- Domain filter semantics
- GET-only route set
- Repository SQL and transaction behavior
- Underlying record validation
- Upstream intake provenance root causes
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T03, T26.
- Review prerequisites: - BWS-W1-T03.
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

- `BWS118-R05-001-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-001 | requirement=Production-handler tests for 400/404/409/422/503/504/500 distinctions using inert typed failures.
- `BWS118-R05-001-TEST-02` | category=persistence_or_migration | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-001 | requirement=Test that raw SQL, filesystem, connection, and stack detail never appears in the response.
- `BWS118-R05-001-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-001 | requirement=Test that multiple blockers are retained deterministically or referenced by a stable diagnostic ID.
- `BWS118-R05-001-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-001 | requirement=Client test proving non-2xx classes remain distinguishable from an empty successful page.
- `BWS118-R05-006-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-006 | requirement=Wrong-scope empty-page rejection test.
- `BWS118-R05-006-TEST-02` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-006 | requirement=Wrong expand/pageSize/sort/cursor-lineage rejection tests.
- `BWS118-R05-006-TEST-03` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-006 | requirement=Property test that every emitted response receipt equals the service-normalized request.
- `BWS118-R05-006-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-006 | requirement=Compatibility/version test for changed query semantics.
- `BWS118-R05-009-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-009 | requirement=Known-current pair acceptance test.
- `BWS118-R05-009-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-009 | requirement=Unknown older/newer/mixed boundary rejection tests.
- `BWS118-R05-009-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-009 | requirement=Package/build test proving server and web consume one generated/shared boundary authority rather than duplicated literals.

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS118-R05-001-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-001 | requirement=Production-handler tests for 400/404/409/422/503/504/500 distinctions using inert typed failures.
- `BWS118-R05-001-TEST-02` | category=persistence_or_migration | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-001 | requirement=Test that raw SQL, filesystem, connection, and stack detail never appears in the response.
- `BWS118-R05-001-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-001 | requirement=Test that multiple blockers are retained deterministically or referenced by a stable diagnostic ID.
- `BWS118-R05-001-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-001 | requirement=Client test proving non-2xx classes remain distinguishable from an empty successful page.
- `BWS118-R05-006-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-006 | requirement=Wrong-scope empty-page rejection test.
- `BWS118-R05-006-TEST-02` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-006 | requirement=Wrong expand/pageSize/sort/cursor-lineage rejection tests.
- `BWS118-R05-006-TEST-03` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-006 | requirement=Property test that every emitted response receipt equals the service-normalized request.
- `BWS118-R05-006-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-006 | requirement=Compatibility/version test for changed query semantics.
- `BWS118-R05-009-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-009 | requirement=Known-current pair acceptance test.
- `BWS118-R05-009-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-009 | requirement=Unknown older/newer/mixed boundary rejection tests.
- `BWS118-R05-009-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-009 | requirement=Package/build test proving server and web consume one generated/shared boundary authority rather than duplicated literals.

## Negative and adversarial tests

- `BWS118-R05-009-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-009 | requirement=Unknown older/newer/mixed boundary rejection tests.

## Concurrency, cancellation, crash, and restart tests

- No separately classified record

## Environment proof

- NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED: 11 requirements

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

Acceptance authority: - Validation/policy/not-found/conflict/unavailable/timeout/internal errors distinct

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W2-T19` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
