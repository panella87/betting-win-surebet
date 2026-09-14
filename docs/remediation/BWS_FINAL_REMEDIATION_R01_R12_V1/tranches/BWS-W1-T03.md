
# BWS-W1-T03 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W1-T03
CAMPAIGN_ORDER: 15
STAGE: S3
PRIMARY_OWNER: R01
SECONDARY_REVIEWERS: R02, R03, R07, R11, R12
ISSUE_IDS: BWS116-R01-003, BWS116-R01-004, BWS116-R01-005, BWS116-R01-010
SEVERITY_COUNTS: {"P1": 4}
DEPENDENCIES: T02
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen review/finding baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; active campaign authority is pinned by activation/immutable-authority.sha256; exact current numbered archive or checkout, extracted-tree digest, Git identity, source paths, hashes, and modes must be captured in an external audit or admission receipt and reverified before editing; repository documentation does not self-attest a rolling numbered ZIP
CURRENT_SOURCE_PATH_CANDIDATES: packages/bootstrap/src/adapters/betting-win-query-client.ts, packages/bootstrap/src/operations/external-runtime-preflight.ts, packages/bootstrap/src/operations/upstream-api-convergence.ts
SYMBOLS_TO_REVERIFY: 4 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: packages/bootstrap/src/adapters/betting-win-query-client.ts, packages/bootstrap/src/operations/external-runtime-preflight.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites `["T02", "Canonical request/body receipt and temporal authority decision"]`
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 14 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 2 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 3 classified records below
CONCURRENCY_OR_CRASH_TESTS: 5 classified records below
ENVIRONMENT_PROOF: {"AS_DECLARED_BY_OWNING_REVIEW": 1, "NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE": 13}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: ["Exact contract and page bytes form an ordered immutable cycle receipt", "Downstream consumes the exact converged record set", "All source/receive/verify/import/consume clocks remain distinct and bounded"]
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": true, "bws_710": true, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W1-T04 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `packages/bootstrap/src/adapters/betting-win-query-client.ts` | present=yes | sha256=7b50ba9a6c6e0dd5486bdca723a6f6c605bd7609151e062fe72ee36100d307ae | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/external-runtime-preflight.ts` | present=yes | sha256=724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/upstream-api-convergence.ts` | present=yes | sha256=4f066cc40d08e6ad4748866073c0a14683bd8b7066cb9f41c87f239e28ae5a63 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS116-R01-003 | `packages/bootstrap/src/operations/upstream-api-convergence.ts` | symbol=resolveBwsUpstreamApiConvergenceConfig | reviewed_line_range=L151-L244 | reviewed_sha256=4f066cc40d08e6ad4748866073c0a14683bd8b7066cb9f41c87f239e28ae5a63
- BWS116-R01-004 | `packages/bootstrap/src/adapters/betting-win-query-client.ts` | symbol=describeReadOnlyQueryApiClientBoundary | reviewed_line_range=L181-L183 | reviewed_sha256=7b50ba9a6c6e0dd5486bdca723a6f6c605bd7609151e062fe72ee36100d307ae
- BWS116-R01-005 | `packages/bootstrap/src/operations/upstream-api-convergence.ts` | symbol=resolveBwsUpstreamApiConvergenceConfig | reviewed_line_range=L151-L244 | reviewed_sha256=4f066cc40d08e6ad4748866073c0a14683bd8b7066cb9f41c87f239e28ae5a63
- BWS116-R01-010 | `packages/bootstrap/src/operations/external-runtime-preflight.ts` | symbol=createBwsExternalRuntimeCampaignManifest | reviewed_line_range=L248-L433 | reviewed_sha256=724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS116-R01-003 — API convergence records completion metadata but not the exact records later consumed

- Severity: `P1`
- Current behavior: The cycle's durable representation does not retain or content-address the complete page records. Downstream work can therefore evaluate a different live response while attributing readiness/provenance to the earlier completed cycle.
- Expected behavior: The records evaluated downstream must be the exact byte- or record-set snapshot whose pagination and convergence checks completed, or the later query must create and validate a new cycle.
- Invariant: The records evaluated downstream must be the exact byte- or record-set snapshot whose pagination and convergence checks completed, or the later query must create and validate a new cycle.
- Root cause: Convergence is modeled as a status/checkpoint observation rather than as ownership of an immutable data snapshot.
- Trigger: Convergence persists counts/cursors/currentness metadata and the downstream runtime subsequently issues a fresh API query instead of consuming an immutable page/record set bound to that cycle.
- Minimal fix boundary: At the R01 boundary, bind a cycle to exact response/page hashes and an immutable record manifest (or persist the records transactionally), and require downstream consumers to reference that cycle identity. Hand generic transaction/fencing mechanics to R03.
- Regression risks:
- Storage growth
- Migration compatibility
- Worker handoff schema changes
- Duplicate retention

### BWS116-R01-004 — Accepted API records are not cryptographically bound to exact response bytes, route, query, contract, generation, and page

- Severity: `P1`
- Current behavior: The boundary retains selected parsed fields and timestamps but lacks a response-byte digest and complete request/page binding. Equivalent parsed objects, altered extra fields, route drift, or page substitution cannot be distinguished later.
- Expected behavior: Every accepted page must have immutable receive provenance covering exact bytes, URL origin and path, canonical query, contract/profile, upstream commit/generation, page/cursor, and receive time.
- Invariant: Every accepted page must have immutable receive provenance covering exact bytes, URL origin and path, canonical query, contract/profile, upstream commit/generation, page/cursor, and receive time.
- Root cause: Provenance is represented as descriptive metadata instead of a cryptographic receipt over the actual request/response exchange.
- Trigger: The client emits normalized records/envelope metadata without an immutable digest over the received body and complete request identity, and persistence accepts those fields as provenance.
- Minimal fix boundary: Extend the R01 API receipt and convergence cycle to include canonical request identity and exact-body hashes for contract and pages. Persist and validate the ordered receipt chain; delegate transaction atomicity to R03 and artifact publication to R07.
- Regression risks:
- Schema migration
- Canonicalization mistakes if hashes are taken after parsing
- Sensitive header leakage; headers must be allowlisted

### BWS116-R01-005 — Pagination does not bind every page to one immutable contract, profile, generation, and query identity

- Severity: `P1`
- Current behavior: The page loop can accept structurally valid pages whose identity-bearing metadata differs or is absent, allowing one logical convergence cycle to mix generations or route interpretations.
- Expected behavior: Page 2 and later must be rejected unless their contract version, profile, upstream commit/generation, resource, canonical query, and lineage exactly match page 1 and the negotiated contract receipt.
- Invariant: Page 2 and later must be rejected unless their contract version, profile, upstream commit/generation, resource, canonical query, and lineage exactly match page 1 and the negotiated contract receipt.
- Root cause: Contract negotiation and page traversal are modeled as adjacent checks rather than one state machine with an invariant identity tuple.
- Trigger: The client validates contract/resource shape per response but the convergence loop carries forward only the cursor and does not enforce one immutable negotiation/identity tuple across all pages.
- Minimal fix boundary: Create a cycle identity from the negotiated contract and first accepted query, require exact equality for every page, and include that tuple in the immutable page receipt chain.
- Regression risks:
- Compatibility with envelopes that currently omit identity fields
- Cursor semantics across upstream upgrades

### BWS116-R01-010 — Source, receive, verification, import, and consumption times are not jointly enforced as distinct currentness evidence

- Severity: `P1`
- Current behavior: Recent receipt can make retained/stale data appear current, while future timestamps can reduce calculated age. The resulting provenance cannot distinguish a fresh response containing old state from genuinely current upstream state.
- Expected behavior: Currentness must be a fail-closed predicate over explicitly typed clocks with bounded skew, maximum source age, receive age, and consumption age; missing or future source time must remain unknown/rejected where required.
- Invariant: Currentness must be a fail-closed predicate over explicitly typed clocks with bounded skew, maximum source age, receive age, and consumption age; missing or future source time must remain unknown/rejected where required.
- Root cause: Currentness is represented as a scalar age/status instead of a typed temporal evidence model.
- Trigger: Acceptance/currentness checks rely on one timestamp or derived age and do not preserve/enforce source event time, upstream snapshot time, local receive time, verification time, import time, and downstream consumption time separately.
- Minimal fix boundary: Preserve all clock domains explicitly, prohibit blank/default collapse, apply bounded skew and age rules at preflight and consumption, and bind the values to immutable page receipts.
- Regression risks:
- Clock-source availability
- Compatibility with historical/replay inputs
- Time-zone/string parsing


## Allowed edit boundary

- Candidate path set: `packages/bootstrap/src/adapters/betting-win-query-client.ts`, `packages/bootstrap/src/operations/external-runtime-preflight.ts`, `packages/bootstrap/src/operations/upstream-api-convergence.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `packages/bootstrap/src/adapters/betting-win-query-client.ts` | participating tranches=T03, T05 | predecessor postimage required
- `packages/bootstrap/src/operations/external-runtime-preflight.ts` | participating tranches=T03, T04, T27, T29, T31, T33, T36 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- External betting-win source
- External source code
- Provider credentials
- Public BWS API projection
- R02 cross-provider matching
- R02 formulas
- R02 opportunity mathematics
- R02 quote/economic semantics
- R02 solver
- R05 public API
- Replay/export historical acceptance when explicitly typed historical
- all betting-win source, checkout, documentation, service, database, and runtime
- betting-win deployment policy
- betting-win implementation
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T02.
- Review prerequisites: ["T02", "Canonical request/body receipt and temporal authority decision"].
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

- `BWS116-R01-003-TEST-01` | category=upstream_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-003 | requirement=Production-path test where the fake external API changes after convergence; downstream must consume the first immutable cycle or explicitly start a second cycle.
- `BWS116-R01-003-TEST-02` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-003 | requirement=Crash/restart test proving cycle identity and exact page set survive process restart.
- `BWS116-R01-003-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-003 | requirement=Correction/deletion test proving no record can disappear between convergence proof and consumption.
- `BWS116-R01-004-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-004 | requirement=Two bodies with identical required fields but different extra bytes must produce distinct receipts.
- `BWS116-R01-004-TEST-02` | category=upstream_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-004 | requirement=Route/query/profile/generation/page substitutions must fail convergence even when record arrays match.
- `BWS116-R01-004-TEST-03` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-004 | requirement=Restart must preserve and revalidate the ordered page receipt chain.
- `BWS116-R01-005-TEST-01` | category=upstream_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-005 | requirement=Page-2 contract/profile/generation/commit/resource drift cases must fail without advancing the durable cursor.
- `BWS116-R01-005-TEST-02` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-005 | requirement=Reordered and replayed pages must converge deterministically only when the ordered receipt chain is identical.
- `BWS116-R01-010-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-010 | requirement=Fresh receive + stale source
- `BWS116-R01-010-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-010 | requirement=Future source time
- `BWS116-R01-010-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-010 | requirement=Missing source time
- `BWS116-R01-010-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-010 | requirement=Boundary skew
- `BWS116-R01-010-TEST-05` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-010 | requirement=Restart/consumption after evidence expiry
- `BWS116-R01-TG-001` | category=concurrency_or_fencing | environment=AS_DECLARED_BY_OWNING_REVIEW | production_entrypoint=yes | status=CONFIRMED_TEST_GAP | issues=BWS116-R01-001, BWS116-R01-002, BWS116-R01-003, BWS116-R01-004, BWS116-R01-005, BWS116-R01-006, BWS116-R01-007, BWS116-R01-008, BWS116-R01-009, BWS116-R01-010 | requirement=Focused tests do not adversarially exercise the full production entrypoint for identity drift and lifecycle races

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS116-R01-003-TEST-01` | category=upstream_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-003 | requirement=Production-path test where the fake external API changes after convergence; downstream must consume the first immutable cycle or explicitly start a second cycle.
- `BWS116-R01-TG-001` | category=concurrency_or_fencing | environment=AS_DECLARED_BY_OWNING_REVIEW | production_entrypoint=yes | status=CONFIRMED_TEST_GAP | issues=BWS116-R01-001, BWS116-R01-002, BWS116-R01-003, BWS116-R01-004, BWS116-R01-005, BWS116-R01-006, BWS116-R01-007, BWS116-R01-008, BWS116-R01-009, BWS116-R01-010 | requirement=Focused tests do not adversarially exercise the full production entrypoint for identity drift and lifecycle races

## Negative and adversarial tests

- `BWS116-R01-004-TEST-02` | category=upstream_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-004 | requirement=Route/query/profile/generation/page substitutions must fail convergence even when record arrays match.
- `BWS116-R01-005-TEST-01` | category=upstream_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-005 | requirement=Page-2 contract/profile/generation/commit/resource drift cases must fail without advancing the durable cursor.
- `BWS116-R01-010-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-010 | requirement=Fresh receive + stale source

## Concurrency, cancellation, crash, and restart tests

- `BWS116-R01-003-TEST-02` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-003 | requirement=Crash/restart test proving cycle identity and exact page set survive process restart.
- `BWS116-R01-004-TEST-03` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-004 | requirement=Restart must preserve and revalidate the ordered page receipt chain.
- `BWS116-R01-005-TEST-02` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-005 | requirement=Reordered and replayed pages must converge deterministically only when the ordered receipt chain is identical.
- `BWS116-R01-010-TEST-05` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-010 | requirement=Restart/consumption after evidence expiry
- `BWS116-R01-TG-001` | category=concurrency_or_fencing | environment=AS_DECLARED_BY_OWNING_REVIEW | production_entrypoint=yes | status=CONFIRMED_TEST_GAP | issues=BWS116-R01-001, BWS116-R01-002, BWS116-R01-003, BWS116-R01-004, BWS116-R01-005, BWS116-R01-006, BWS116-R01-007, BWS116-R01-008, BWS116-R01-009, BWS116-R01-010 | requirement=Focused tests do not adversarially exercise the full production entrypoint for identity drift and lifecycle races

## Environment proof

- AS_DECLARED_BY_OWNING_REVIEW: 1 requirements
- NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE: 13 requirements

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

Acceptance authority: ["Exact contract and page bytes form an ordered immutable cycle receipt", "Downstream consumes the exact converged record set", "All source/receive/verify/import/consume clocks remain distinct and bounded"]

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W1-T04` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
