
# BWS-W1-T09 implementation packet

> Documentation status: `PROPOSED_NOT_ACTIVE` for T39 and `NOT_ADMITTED` for all tranches. This packet does not authorize source mutation.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W1-T09
CAMPAIGN_ORDER: 6
STAGE: S1
PRIMARY_OWNER: R03
SECONDARY_REVIEWERS: R06, R08, R09, R11
ISSUE_IDS: BWS116-R03-002, BWS116-R03-003, BWS116-R03-004
SEVERITY_COUNTS: {"P1": 2, "P2": 1}
DEPENDENCIES: T01
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; exact 771-member archive inventory; independently computed inventory digest=b81ff807e4c230bff96fe1fa58f73a2d4bac803ebd7fa58b843cdcb83499f7f0
CURRENT_SOURCE_PATH_CANDIDATES: docs/037_database_backup_retention_and_recovery.md, packages/bootstrap/src/operations/database-lifecycle.ts, packages/persistence/src/migrations.ts
SYMBOLS_TO_REVERIFY: 7 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: docs/037_database_backup_retention_and_recovery.md, packages/bootstrap/src/operations/database-lifecycle.ts, packages/persistence/src/migrations.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites `["T01"]`
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 10 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 0 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 1 classified records below
CONCURRENCY_OR_CRASH_TESTS: 2 classified records below
ENVIRONMENT_PROOF: {"DISPOSABLE_POSTGRESQL_AND_NODE20": 10}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: ["Status is read-only", "Unknown applied rows fail closed or satisfy explicit compatibility", "One migrator owns transitions"]
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": false, "bws_710": false, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W3-T30 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `docs/037_database_backup_retention_and_recovery.md` | present=yes | sha256=6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/database-lifecycle.ts` | present=yes | sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/persistence/src/migrations.ts` | present=yes | sha256=2ae8d8e9d9cdb6c08003371083c2065dd803ad5d82258f5be3166a17da01f57b | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS116-R03-002 | `packages/persistence/src/migrations.ts` | symbol=listAppliedSurebetMigrations | reviewed_line_range=92-110 | reviewed_sha256=2ae8d8e9d9cdb6c08003371083c2065dd803ad5d82258f5be3166a17da01f57b
- BWS116-R03-002 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=getBwsDatabaseMigrationStatus | reviewed_line_range=262-308 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS116-R03-002 | `docs/037_database_backup_retention_and_recovery.md` | symbol=Migration status contract | reviewed_line_range=9-19 | reviewed_sha256=6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10
- BWS116-R03-003 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=buildMigrationChecksumMismatches | reviewed_line_range=1054-1075 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS116-R03-003 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=getBwsDatabaseMigrationStatus | reviewed_line_range=278-305 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS116-R03-003 | `packages/persistence/src/migrations.ts` | symbol=applySurebetMigrations | reviewed_line_range=45-84 | reviewed_sha256=2ae8d8e9d9cdb6c08003371083c2065dd803ad5d82258f5be3166a17da01f57b
- BWS116-R03-004 | `packages/persistence/src/migrations.ts` | symbol=applySurebetMigrations | reviewed_line_range=41-84 | reviewed_sha256=2ae8d8e9d9cdb6c08003371083c2065dd803ad5d82258f5be3166a17da01f57b

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS116-R03-002 — The migration-status read path creates schema objects before reporting status

- Severity: `P1`
- Current behavior: The status path runs bootstrap DDL first, so an empty database is changed before status is calculated.
- Expected behavior: Status must report schema and ledger absence without creating either object.
- Invariant: Status must report schema and ledger absence without creating either object.
- Root cause: Bootstrap creation was shared between apply and inspect paths instead of separating read-only catalog inspection from migration initialization.
- Trigger: Run the migration-status operation.
- Minimal fix boundary: Make status query pg_catalog/information_schema first and report absent objects. Keep MIGRATION_BOOTSTRAP_SQL exclusively in the explicit apply path.
- Regression risks:
- Existing automation that accidentally relies on status to initialize the ledger will fail and must call the explicit migration command

### BWS116-R03-003 — Unknown applied migration rows are ignored and can be reported as compatible

- Severity: `P1`
- Current behavior: The unknown row is ignored. If all known checksums match and the schema exists, status is compatible and apply proceeds with the current file set.
- Expected behavior: A frozen binary must classify a divergent or newer migration lineage explicitly and fail closed unless a reviewed forward-compatibility rule proves it safe.
- Invariant: A frozen binary must classify a divergent or newer migration lineage explicitly and fail closed unless a reviewed forward-compatibility rule proves it safe.
- Root cause: The migration ledger is treated as a cache of known rows rather than authoritative schema lineage requiring explicit forward/backward compatibility.
- Trigger: Run migration status or apply from this archive.
- Minimal fix boundary: Add unknownApplied entries to the status contract, make compatibility fail closed by default, and permit forward compatibility only through an explicit reviewed compatibility range or schema capability proof.
- Regression risks:
- A strict set check can block intentional rolling upgrades unless compatibility policy is made explicit

### BWS116-R03-004 — Concurrent migration applications are not serialized around ledger observation and insertion

- Severity: `P2`
- Current behavior: Both callers can classify the migration as absent. One commits; the other can fail on the ledger primary key or on future non-idempotent DDL even though the database reached the desired state.
- Expected behavior: Exactly one migrator should own the schema transition; peers should wait and then observe the committed ledger.
- Invariant: Exactly one migrator should own the schema transition; peers should wait and then observe the committed ledger.
- Root cause: Migration application assumes a single caller but the service/lifecycle architecture does not encode that assumption in PostgreSQL.
- Trigger: Both processes read the same pre-application ledger and attempt the same migration transaction.
- Minimal fix boundary: Acquire a repository-specific PostgreSQL advisory lock before bootstrap/ledger inspection, re-read under the lock, apply in deterministic order, and release only after the ledger row is durable.
- Regression risks:
- Lock-key collisions must be avoided
- Long migrations need an explicit bounded lock-wait policy


## Allowed edit boundary

- Candidate path set: `docs/037_database_backup_retention_and_recovery.md`, `packages/bootstrap/src/operations/database-lifecycle.ts`, `packages/persistence/src/migrations.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `docs/037_database_backup_retention_and_recovery.md` | participating tranches=T09, T13, T30, T31, T32 | predecessor postimage required
- `packages/bootstrap/src/operations/database-lifecycle.ts` | participating tranches=T09, T13, T30, T31, T32, T37 | predecessor postimage required
- `packages/persistence/src/migrations.ts` | participating tranches=T01, T09 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- Backup and restore command semantics are not changed by this finding
- Backup/restore implementation except dependencies
- Current migrations use CREATE TABLE/INDEX IF NOT EXISTS
- Each individual supplied migration remains wrapped in BEGIN/COMMIT
- Explicit migration application remains allowed
- Known migration checksum checking remains valid
- No claim is made that the current target database contains an unknown row
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T01.
- Review prerequisites: ["T01"].
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

- `BWS116-R03-002-TEST-01` | category=persistence_or_migration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-002 | requirement=Status against an empty disposable database leaves schema/table counts unchanged
- `BWS116-R03-002-TEST-02` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-002 | requirement=Status under a read-only role reports absence rather than failing or mutating
- `BWS116-R03-002-TEST-03` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-002 | requirement=Repeated status is observationally idempotent
- `BWS116-R03-003-TEST-01` | category=persistence_or_migration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-003 | requirement=Ledger with one unknown applied migration is incompatible
- `BWS116-R03-003-TEST-02` | category=persistence_or_migration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-003 | requirement=Renamed migration and same-SQL/different-name cases
- `BWS116-R03-003-TEST-03` | category=persistence_or_migration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-003 | requirement=Older binary against newer schema
- `BWS116-R03-003-TEST-04` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-003 | requirement=Exact known set remains compatible
- `BWS116-R03-004-TEST-01` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-004 | requirement=Two concurrent migrators against a disposable database
- `BWS116-R03-004-TEST-02` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-004 | requirement=Second migrator waits and returns skipped rather than failing
- `BWS116-R03-004-TEST-03` | category=restart_or_recovery | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-004 | requirement=Crash while holding the lock and subsequent recovery

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- none mapped; focused environment proof remains required

## Negative and adversarial tests

- `BWS116-R03-003-TEST-01` | category=persistence_or_migration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-003 | requirement=Ledger with one unknown applied migration is incompatible

## Concurrency, cancellation, crash, and restart tests

- `BWS116-R03-004-TEST-01` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-004 | requirement=Two concurrent migrators against a disposable database
- `BWS116-R03-004-TEST-03` | category=restart_or_recovery | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-004 | requirement=Crash while holding the lock and subsequent recovery

## Environment proof

- DISPOSABLE_POSTGRESQL_AND_NODE20: 10 requirements

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

Acceptance authority: ["Status is read-only", "Unknown applied rows fail closed or satisfy explicit compatibility", "One migrator owns transitions"]

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W3-T30` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
