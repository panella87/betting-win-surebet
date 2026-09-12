
# BWS-W1-T01 implementation packet

> Documentation status: `PROPOSED_NOT_ACTIVE` for T39 and `NOT_ADMITTED` for all tranches. This packet does not authorize source mutation.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W1-T01
CAMPAIGN_ORDER: 5
STAGE: S1
PRIMARY_OWNER: R03
SECONDARY_REVIEWERS: R08, R10, R11
ISSUE_IDS: BWS116-R03-001
SEVERITY_COUNTS: {"P0": 1}
DEPENDENCIES: none
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; exact 771-member archive inventory; independently computed inventory digest=b81ff807e4c230bff96fe1fa58f73a2d4bac803ebd7fa58b843cdcb83499f7f0
CURRENT_SOURCE_PATH_CANDIDATES: packages/persistence/src/migrations.ts, packages/persistence/src/psql.ts
SYMBOLS_TO_REVERIFY: 3 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: packages/persistence/src/migrations.ts, packages/persistence/src/psql.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites `["Repository-confined migration authority decision", "Disposable PostgreSQL role proof"]`
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 5 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 0 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 0 classified records below
CONCURRENCY_OR_CRASH_TESTS: 0 classified records below
ENVIRONMENT_PROOF: {"DISPOSABLE_POSTGRESQL_AND_NODE20": 5}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: ["Only realpath-confined repository migrations accepted", "Database role cannot mutate outside surebet.*", "All unrecognized executable SQL families fail closed"]
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": false, "bws_710": false, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W1-T09 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `packages/persistence/src/migrations.ts` | present=yes | sha256=2ae8d8e9d9cdb6c08003371083c2065dd803ad5d82258f5be3166a17da01f57b | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/persistence/src/psql.ts` | present=yes | sha256=86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS116-R03-001 | `packages/persistence/src/psql.ts` | symbol=loadSurebetMigrationFiles | reviewed_line_range=94-153 | reviewed_sha256=86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343
- BWS116-R03-001 | `packages/persistence/src/psql.ts` | symbol=SUREBET_MIGRATION_TARGET_PATTERNS / assertSurebetOnlyMigrationSql | reviewed_line_range=14-43; 219-265 | reviewed_sha256=86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343
- BWS116-R03-001 | `packages/persistence/src/migrations.ts` | symbol=applySurebetMigrations | reviewed_line_range=41-90 | reviewed_sha256=2ae8d8e9d9cdb6c08003371083c2065dd803ad5d82258f5be3166a17da01f57b

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS116-R03-001 — Migration discovery can escape the repository and the SQL scope scanner admits cross-schema executable DDL

- Severity: `P0`
- Current behavior: Absolute and ../ migration directories are accepted. Cross-schema CREATE FUNCTION and dynamic DO SQL are accepted by the scanner. applySurebetMigrations would submit those bytes to psql.
- Expected behavior: Migration bytes must come only from the realpath-confined repository database/migrations/surebet directory, and database-level authority must make writes outside surebet.* impossible.
- Invariant: Migration bytes must come only from the realpath-confined repository database/migrations/surebet directory, and database-level authority must make writes outside surebet.* impossible.
- Root cause: Migration authority is enforced by incomplete lexical matching and caller-selected filesystem paths rather than a fixed, realpath-confined source plus a database role restricted to surebet.*.
- Trigger: Load an absolute or traversal-resolved migration directory containing CREATE FUNCTION public.*, or a DO block that dynamically creates a public object, then pass the returned migrations to the normal application path.
- Minimal fix boundary: Confine the migration directory by realpath against the repository root, reject symlink and traversal escapes, remove ordinary caller override from production entrypoints, replace the incomplete regex as the security boundary, and require a database role whose privileges cannot create or mutate objects outside surebet.*.
- Regression risks:
- Legitimate future migration syntax may require an explicit reviewed allowlist update
- Tightening the database role can expose undocumented cross-schema assumptions


## Allowed edit boundary

- Candidate path set: `packages/persistence/src/migrations.ts`, `packages/persistence/src/psql.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `packages/persistence/src/migrations.ts` | participating tranches=T01, T09 | predecessor postimage required
- `packages/persistence/src/psql.ts` | participating tranches=T01, T11, T30, T32, T37 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- Current 12 migration bytes unless separately reviewed
- No migration was applied
- No runtime migration execution during review
- The 12 migration files in the frozen archive remain byte-unchanged and presently reference surebet.* objects only
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: none.
- Review prerequisites: ["Repository-confined migration authority decision", "Disposable PostgreSQL role proof"].
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

- `BWS116-R03-001-TEST-01` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-001 | requirement=Absolute-path and ../ traversal rejection
- `BWS116-R03-001-TEST-02` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-001 | requirement=Symlink escape rejection
- `BWS116-R03-001-TEST-03` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-001 | requirement=CREATE FUNCTION/PROCEDURE/TRIGGER/TYPE/EXTENSION and GRANT/REVOKE rejection
- `BWS116-R03-001-TEST-04` | category=persistence_or_migration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-001 | requirement=DO and dynamic SQL rejection
- `BWS116-R03-001-TEST-05` | category=persistence_or_migration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-001 | requirement=Disposable PostgreSQL proof that the migration role cannot write outside surebet.*

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- none mapped; focused environment proof remains required

## Negative and adversarial tests

- No separately classified record; admission must still test failure branches stated by each finding

## Concurrency, cancellation, crash, and restart tests

- No separately classified record

## Environment proof

- DISPOSABLE_POSTGRESQL_AND_NODE20: 5 requirements

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

Acceptance authority: ["Only realpath-confined repository migrations accepted", "Database role cannot mutate outside surebet.*", "All unrecognized executable SQL families fail closed"]

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W1-T09` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
