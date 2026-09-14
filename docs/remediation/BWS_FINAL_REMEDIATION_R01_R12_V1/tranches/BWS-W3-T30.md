
# BWS-W3-T30 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W3-T30
CAMPAIGN_ORDER: 7
STAGE: S1
PRIMARY_OWNER: R08
SECONDARY_REVIEWERS: R03, R09, R10, R11, R24
ISSUE_IDS: BWS120-R08-001, BWS120-R08-003, BWS120-R08-004
SEVERITY_COUNTS: {"P0": 1, "P1": 2}
DEPENDENCIES: T38
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen review/finding baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; active campaign authority is pinned by activation/immutable-authority.sha256; exact current numbered archive or checkout, extracted-tree digest, Git identity, source paths, hashes, and modes must be captured in an external audit or admission receipt and reverified before editing; repository documentation does not self-attest a rolling numbered ZIP
CURRENT_SOURCE_PATH_CANDIDATES: docs/037_database_backup_retention_and_recovery.md, packages/bootstrap/src/cli/bws-database-lifecycle.ts, packages/bootstrap/src/operations/database-lifecycle.ts, packages/persistence/src/psql.ts
SYMBOLS_TO_REVERIFY: 9 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: docs/037_database_backup_retention_and_recovery.md, packages/bootstrap/src/cli/bws-database-lifecycle.ts, packages/bootstrap/src/operations/database-lifecycle.ts, packages/persistence/src/psql.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites ``approved backup root; snapshot-consistent metadata contract``
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 10 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 10 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 3 classified records below
CONCURRENCY_OR_CRASH_TESTS: 2 classified records below
ENVIRONMENT_PROOF: {"NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION": 10}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: no unrelated recursive deletion; dump and manifest from one snapshot; previous verified backup retained until atomic commit
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": false, "bws_710": false, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W3-T31 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `docs/037_database_backup_retention_and_recovery.md` | present=yes | sha256=6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/cli/bws-database-lifecycle.ts` | present=yes | sha256=4e6da6bfca8e7c622ccd04e66d3789b4f4eaf490f93fd8265bfa458d3c22b06a | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/database-lifecycle.ts` | present=yes | sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/persistence/src/psql.ts` | present=yes | sha256=86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS120-R08-001 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=createBwsDatabaseBackup | reviewed_line_range=311-373 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS120-R08-001 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=requireOutputPath | reviewed_line_range=1395-1409 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS120-R08-001 | `packages/bootstrap/src/cli/bws-database-lifecycle.ts` | symbol=runBwsDatabaseLifecycleCli backup | reviewed_line_range=25-32 | reviewed_sha256=4e6da6bfca8e7c622ccd04e66d3789b4f4eaf490f93fd8265bfa458d3c22b06a
- BWS120-R08-001 | `docs/037_database_backup_retention_and_recovery.md` | symbol=Backup contract | reviewed_line_range=21-31 | reviewed_sha256=6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10
- BWS120-R08-003 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=createBwsDatabaseBackup | reviewed_line_range=331-357 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS120-R08-003 | `packages/persistence/src/psql.ts` | symbol=queryPsqlJsonRows and runPsql | reviewed_line_range=77-91,191-208 | reviewed_sha256=86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343
- BWS120-R08-003 | `docs/037_database_backup_retention_and_recovery.md` | symbol=Backup and restore contract | reviewed_line_range=21-40 | reviewed_sha256=6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10
- BWS120-R08-004 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=createBwsDatabaseBackup | reviewed_line_range=322-385 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS120-R08-004 | `docs/037_database_backup_retention_and_recovery.md` | symbol=Backup and recovery contract | reviewed_line_range=21-31,56-58 | reviewed_sha256=6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS120-R08-001 — Backup overwrite can recursively remove an unrelated pre-existing directory

- Severity: `P0`
- Current behavior: The path guard excludes only repository runtime directories. Any other existing path is recursively removed before the staged backup is renamed into place.
- Expected behavior: Overwrite must be confined to a dedicated backup destination and must never recursively remove unrelated operator data.
- Invariant: Overwrite must be confined to a dedicated backup destination and must never recursively remove unrelated operator data.
- Root cause: Output authorization is represented as a negative denylist instead of a positively bound backup root and exact destination identity.
- Trigger: Backup publication reaches the overwrite branch for an existing path.
- Minimal fix boundary: Confine backup output to an operator-selected approved backup root, require a backup-specific destination leaf, reject unrelated existing directories, and preserve the prior verified backup until replacement publication is committed.
- Regression risks:
- Existing workflows that use arbitrary output directories will become invalid and need an explicit approved backup root.

### BWS120-R08-003 — Backup manifest metadata and row counts are not captured from the pg_dump snapshot

- Severity: `P1`
- Current behavior: Migration status, pg_dump, and row counts are three independent observations with no shared snapshot or write exclusion.
- Expected behavior: The dump, migration ledger, source identity, and table counts must describe one transactionally consistent database snapshot.
- Invariant: The dump, migration ledger, source identity, and table counts must describe one transactionally consistent database snapshot.
- Root cause: Backup metadata is assembled around pg_dump rather than from the same exported or locked snapshot.
- Trigger: Migration status is queried before pg_dump and table counts are queried after pg_dump using independent sessions.
- Minimal fix boundary: Capture dump and metadata from one database snapshot or an equivalent write-quiesced boundary, record the snapshot identity, and bind all manifest values to it.
- Regression risks:
- Snapshot coordination may require PostgreSQL-specific session ownership and can increase backup duration.

### BWS120-R08-004 — Backup replacement deletes the previous verified backup before the new publication commits

- Severity: `P1`
- Current behavior: The old directory is recursively removed before renameSync publishes the staged directory. The catch block cleans only the staging directory.
- Expected behavior: The old verified backup must remain recoverable until the replacement has been durably published.
- Invariant: The old verified backup must remain recoverable until the replacement has been durably published.
- Root cause: Replacement is implemented as delete-then-rename rather than versioned publication or an atomic commit that preserves the predecessor.
- Trigger: The replacement branch removes the old directory and is interrupted or fails before rename completes.
- Minimal fix boundary: Publish to a new immutable version, durably validate it, switch an authoritative pointer atomically, and retire the predecessor only after commit. Add bounded reconciliation for abandoned staging directories.
- Regression risks:
- Versioned publication requires explicit retention for old backup versions and additional disk headroom.


## Allowed edit boundary

- Candidate path set: `docs/037_database_backup_retention_and_recovery.md`, `packages/bootstrap/src/cli/bws-database-lifecycle.ts`, `packages/bootstrap/src/operations/database-lifecycle.ts`, `packages/persistence/src/psql.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `docs/037_database_backup_retention_and_recovery.md` | participating tranches=T09, T13, T30, T31, T32 | predecessor postimage required
- `packages/bootstrap/src/cli/bws-database-lifecycle.ts` | participating tranches=T30, T32, T38 | predecessor postimage required
- `packages/bootstrap/src/operations/database-lifecycle.ts` | participating tranches=T09, T13, T30, T31, T32, T37 | predecessor postimage required
- `packages/persistence/src/psql.ts` | participating tranches=T01, T11, T30, T32, T37 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- all betting-win source, checkout, documentation, service, database, and runtime
- backup checksum format
- checksum generation
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds
- dump contents
- pg_dump schema selection
- provider and execution boundaries
- restore target behavior
- retention behavior
- source database identity format
- surebet-only dump scope

## Prerequisites

- Dependency terminal receipts: T38.
- Review prerequisites: `approved backup root; snapshot-consistent metadata contract`.
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

- `BWS120-R08-001-TEST-01` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-001 | requirement=Reject an overwrite target outside the approved backup root.
- `BWS120-R08-001-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-001 | requirement=Reject an existing unrelated directory even when overwrite intent is present.
- `BWS120-R08-001-TEST-03` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-001 | requirement=Prove a failed replacement leaves the previous verified backup intact.
- `BWS120-R08-001-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-001 | requirement=Prove normal publication remains atomic inside the approved root.
- `BWS120-R08-003-TEST-01` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-003 | requirement=Mutate rows concurrently during backup and prove dump and manifest counts remain consistent.
- `BWS120-R08-003-TEST-02` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-003 | requirement=Apply a migration concurrently and prove backup either blocks or records one exact ledger.
- `BWS120-R08-003-TEST-03` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-003 | requirement=Restore the produced backup and require exact manifest parity.
- `BWS120-R08-004-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-004 | requirement=Inject failure after staging and before publication and prove the predecessor remains valid.
- `BWS120-R08-004-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-004 | requirement=Inject failure after pointer switch and prove one complete version remains authoritative.
- `BWS120-R08-004-TEST-03` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-004 | requirement=Reconcile abandoned staging directories without touching unrelated paths.

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS120-R08-001-TEST-01` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-001 | requirement=Reject an overwrite target outside the approved backup root.
- `BWS120-R08-001-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-001 | requirement=Reject an existing unrelated directory even when overwrite intent is present.
- `BWS120-R08-001-TEST-03` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-001 | requirement=Prove a failed replacement leaves the previous verified backup intact.
- `BWS120-R08-001-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-001 | requirement=Prove normal publication remains atomic inside the approved root.
- `BWS120-R08-003-TEST-01` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-003 | requirement=Mutate rows concurrently during backup and prove dump and manifest counts remain consistent.
- `BWS120-R08-003-TEST-02` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-003 | requirement=Apply a migration concurrently and prove backup either blocks or records one exact ledger.
- `BWS120-R08-003-TEST-03` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-003 | requirement=Restore the produced backup and require exact manifest parity.
- `BWS120-R08-004-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-004 | requirement=Inject failure after staging and before publication and prove the predecessor remains valid.
- `BWS120-R08-004-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-004 | requirement=Inject failure after pointer switch and prove one complete version remains authoritative.
- `BWS120-R08-004-TEST-03` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-004 | requirement=Reconcile abandoned staging directories without touching unrelated paths.

## Negative and adversarial tests

- `BWS120-R08-001-TEST-01` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-001 | requirement=Reject an overwrite target outside the approved backup root.
- `BWS120-R08-001-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-001 | requirement=Reject an existing unrelated directory even when overwrite intent is present.
- `BWS120-R08-004-TEST-03` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-004 | requirement=Reconcile abandoned staging directories without touching unrelated paths.

## Concurrency, cancellation, crash, and restart tests

- `BWS120-R08-003-TEST-01` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-003 | requirement=Mutate rows concurrently during backup and prove dump and manifest counts remain consistent.
- `BWS120-R08-003-TEST-02` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-003 | requirement=Apply a migration concurrently and prove backup either blocks or records one exact ledger.

## Environment proof

- NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION: 10 requirements

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

Acceptance authority: no unrelated recursive deletion; dump and manifest from one snapshot; previous verified backup retained until atomic commit

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W3-T31` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
