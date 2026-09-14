
# BWS-W1-T13 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W1-T13
CAMPAIGN_ORDER: 28
STAGE: S4
PRIMARY_OWNER: R03
SECONDARY_REVIEWERS: R01, R05, R06, R07, R08, R11
ISSUE_IDS: BWS116-R03-012, BWS116-R03-013
SEVERITY_COUNTS: {"P1": 1, "P2": 1}
DEPENDENCIES: T03, T10, T31
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen review/finding baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; active campaign authority is pinned by activation/immutable-authority.sha256; exact current numbered archive or checkout, extracted-tree digest, Git identity, source paths, hashes, and modes must be captured in an external audit or admission receipt and reverified before editing; repository documentation does not self-attest a rolling numbered ZIP
CURRENT_SOURCE_PATH_CANDIDATES: database/migrations/surebet/005_create_upstream_export_convergence_checkpoints.sql, database/migrations/surebet/006_create_upstream_api_convergence_checkpoints.sql, docs/037_database_backup_retention_and_recovery.md, packages/bootstrap/src/operations/database-lifecycle.ts, packages/persistence/src/repositories/b1-backtest-run-repository.ts, packages/persistence/src/repositories/worker-job-repository.ts
SYMBOLS_TO_REVERIFY: 6 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: database/migrations/surebet/006_create_upstream_api_convergence_checkpoints.sql, docs/037_database_backup_retention_and_recovery.md, packages/bootstrap/src/operations/database-lifecycle.ts, packages/persistence/src/repositories/b1-backtest-run-repository.ts, packages/persistence/src/repositories/worker-job-repository.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites `["T03", "T10"]`
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 8 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 0 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 0 classified records below
CONCURRENCY_OR_CRASH_TESTS: 2 classified records below
ENVIRONMENT_PROOF: {"DISPOSABLE_POSTGRESQL_AND_NODE20": 8}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: ["All reads are explicitly bounded and stably ordered", "Retention preserves or explicitly blocks every accepted reference"]
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": false, "bws_710": false, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W2-T14 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `database/migrations/surebet/005_create_upstream_export_convergence_checkpoints.sql` | present=yes | sha256=8d3c09c06b61e4fb1774879c51467381b70bbe6f46c86c660345c63667089e3c | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `database/migrations/surebet/006_create_upstream_api_convergence_checkpoints.sql` | present=yes | sha256=3d5ac1c0f2d89aac08acb057668b87b2e9116f274ff78020568dc82522f270f7 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `docs/037_database_backup_retention_and_recovery.md` | present=yes | sha256=6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/database-lifecycle.ts` | present=yes | sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/persistence/src/repositories/b1-backtest-run-repository.ts` | present=yes | sha256=fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/persistence/src/repositories/worker-job-repository.ts` | present=yes | sha256=263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS116-R03-012 | `packages/persistence/src/repositories/worker-job-repository.ts` | symbol=listCheckpoints / listDeadLetters / reapExpiredLeases | reviewed_line_range=573-607; 720-830 | reviewed_sha256=263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e
- BWS116-R03-012 | `packages/persistence/src/repositories/b1-backtest-run-repository.ts` | symbol=listCandidates / listSimulationResults | reviewed_line_range=285-341 | reviewed_sha256=fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04
- BWS116-R03-013 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=buildRetentionPlanQuery / buildRetentionDeleteSql | reviewed_line_range=568-598; 854-875 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS116-R03-013 | `database/migrations/surebet/005_create_upstream_export_convergence_checkpoints.sql` | symbol=surebet.upstream_export_convergence_checkpoints.last_import_run_id | reviewed_line_range=1-39 | reviewed_sha256=8d3c09c06b61e4fb1774879c51467381b70bbe6f46c86c660345c63667089e3c
- BWS116-R03-013 | `database/migrations/surebet/006_create_upstream_api_convergence_checkpoints.sql` | symbol=surebet.upstream_api_convergence_checkpoints.last_import_run_id | reviewed_line_range=1-28 | reviewed_sha256=3d5ac1c0f2d89aac08acb057668b87b2e9116f274ff78020568dc82522f270f7
- BWS116-R03-013 | `docs/037_database_backup_retention_and_recovery.md` | symbol=Retention contract | reviewed_line_range=44-54 | reviewed_sha256=6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS116-R03-012 — Checkpoint, dead-letter, B1 child-row, and expired-lease reads are unbounded

- Severity: `P2`
- Current behavior: Several methods issue no LIMIT. The reaper loads all expired jobs and then creates N additional psql sessions.
- Expected behavior: Persistence APIs must require bounded page sizes and stable cursors; maintenance transitions must process bounded batches atomically.
- Invariant: Persistence APIs must require bounded page sizes and stable cursors; maintenance transitions must process bounded batches atomically.
- Root cause: Boundedness is enforced at selected service loops but omitted from repository contracts and maintenance queries.
- Trigger: A list/read/reaper call runs with default options or on a large B1 run.
- Minimal fix boundary: Require explicit positive limits and stable keyset cursors; add a bounded bulk expired-lease CTE with SKIP LOCKED/RETURNING; page B1 children and dead letters.
- Regression risks:
- Pagination changes API consumers and evidence aggregation
- Bulk reaping must preserve per-job dead-letter evidence

### BWS116-R03-013 — Import-run retention ignores convergence references, causing either deletion failure or dangling durable identity

- Severity: `P1`
- Current behavior: The candidate query does not inspect convergence tables. API checkpoint references make DELETE fail through the FK; export checkpoint references allow DELETE and leave last_import_run_id dangling.
- Expected behavior: The plan must exclude every retained reference and revalidate atomically before deletion; equivalent references must have consistent foreign-key semantics.
- Invariant: The plan must exclude every retained reference and revalidate atomically before deletion; equivalent references must have consistent foreign-key semantics.
- Root cause: Retention ownership and schema reference ownership were designed independently without one authoritative dependency graph.
- Trigger: Generate and apply an import_runs retention plan containing that run.
- Minimal fix boundary: Add consistent FKs or explicit immutable-reference tables, anti-join all retained references during planning, recheck in the delete transaction, and classify protected/skipped rows instead of failing the whole plan.
- Regression risks:
- Adding a foreign key requires cleanup of any existing dangling values
- Retention throughput may fall without supporting indexes


## Allowed edit boundary

- Candidate path set: `database/migrations/surebet/005_create_upstream_export_convergence_checkpoints.sql`, `database/migrations/surebet/006_create_upstream_api_convergence_checkpoints.sql`, `docs/037_database_backup_retention_and_recovery.md`, `packages/bootstrap/src/operations/database-lifecycle.ts`, `packages/persistence/src/repositories/b1-backtest-run-repository.ts`, `packages/persistence/src/repositories/worker-job-repository.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `database/migrations/surebet/006_create_upstream_api_convergence_checkpoints.sql` | participating tranches=T13, T32 | predecessor postimage required
- `docs/037_database_backup_retention_and_recovery.md` | participating tranches=T09, T13, T30, T31, T32 | predecessor postimage required
- `packages/bootstrap/src/operations/database-lifecycle.ts` | participating tranches=T09, T13, T30, T31, T32, T37 | predecessor postimage required
- `packages/persistence/src/repositories/b1-backtest-run-repository.ts` | participating tranches=T12, T13, T20 | predecessor postimage required
- `packages/persistence/src/repositories/worker-job-repository.ts` | participating tranches=T10, T13 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- Current accepted evidence is not deleted
- Individual query ordering is deterministic where ORDER BY is present
- Operational backup/restore command ownership remains R08
- Pinned export protection remains valid
- Worker claim maxJobs remains bounded
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T03, T10, T31.
- Review prerequisites: ["T03", "T10"].
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

- `BWS116-R03-012-TEST-01` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-012 | requirement=Large-cardinality query plans use indexes and fixed limits
- `BWS116-R03-012-TEST-02` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-012 | requirement=Reaper handles at most batchSize and is repeatable
- `BWS116-R03-012-TEST-03` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-012 | requirement=Stable keyset ordering under concurrent inserts
- `BWS116-R03-012-TEST-04` | category=persistence_or_migration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-012 | requirement=psql output remains below configured maximum
- `BWS116-R03-013-TEST-01` | category=upstream_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-013 | requirement=API-referenced import is excluded
- `BWS116-R03-013-TEST-02` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-013 | requirement=Export-referenced import is excluded
- `BWS116-R03-013-TEST-03` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-013 | requirement=Concurrent new reference between plan and apply is preserved
- `BWS116-R03-013-TEST-04` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-013 | requirement=Plan/apply deletedCount and protectedCount reconcile

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- none mapped; focused environment proof remains required

## Negative and adversarial tests

- No separately classified record; admission must still test failure branches stated by each finding

## Concurrency, cancellation, crash, and restart tests

- `BWS116-R03-012-TEST-03` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-012 | requirement=Stable keyset ordering under concurrent inserts
- `BWS116-R03-013-TEST-03` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-013 | requirement=Concurrent new reference between plan and apply is preserved

## Environment proof

- DISPOSABLE_POSTGRESQL_AND_NODE20: 8 requirements

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

Acceptance authority: ["All reads are explicitly bounded and stably ordered", "Retention preserves or explicitly blocks every accepted reference"]

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W2-T14` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
