
# BWS-W3-T32 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W3-T32
CAMPAIGN_ORDER: 41
STAGE: S6
PRIMARY_OWNER: R08
SECONDARY_REVIEWERS: R03, R05, R07, R10, R11
ISSUE_IDS: BWS120-R08-010, BWS120-R08-011, BWS120-R08-012
SEVERITY_COUNTS: {"P1": 3}
DEPENDENCIES: T10, T13, T31
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen review/finding baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; active campaign authority is pinned by activation/immutable-authority.sha256; exact current numbered archive or checkout, extracted-tree digest, Git identity, source paths, hashes, and modes must be captured in an external audit or admission receipt and reverified before editing; repository documentation does not self-attest a rolling numbered ZIP
CURRENT_SOURCE_PATH_CANDIDATES: database/migrations/surebet/004_create_worker_jobs.sql, database/migrations/surebet/006_create_upstream_api_convergence_checkpoints.sql, database/migrations/surebet/007_create_private_paper_runtime_scheduler_checkpoints.sql, docs/037_database_backup_retention_and_recovery.md, packages/bootstrap/src/api/bws-read-only-query-service.ts, packages/bootstrap/src/cli/bws-database-lifecycle.ts, packages/bootstrap/src/operations/database-lifecycle.ts, packages/persistence/src/psql.ts
SYMBOLS_TO_REVERIFY: 15 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: database/migrations/surebet/004_create_worker_jobs.sql, database/migrations/surebet/006_create_upstream_api_convergence_checkpoints.sql, docs/037_database_backup_retention_and_recovery.md, packages/bootstrap/src/api/bws-read-only-query-service.ts, packages/bootstrap/src/cli/bws-database-lifecycle.ts, packages/bootstrap/src/operations/database-lifecycle.ts, packages/persistence/src/psql.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites ``exact database/schema generation identity; reference ownership map``
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 11 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 11 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 3 classified records below
CONCURRENCY_OR_CRASH_TESTS: 1 classified records below
ENVIRONMENT_PROOF: {"NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION": 11}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: plan bound to target; plan/apply one transaction or fenced protocol; partial prune impossible; blocked/terminal provenance retained
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": false, "bws_710": false, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W3-T34 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `database/migrations/surebet/004_create_worker_jobs.sql` | present=yes | sha256=9756445dbfbdac6226413098d1253527578d9420543287842c30d034df162b9c | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `database/migrations/surebet/006_create_upstream_api_convergence_checkpoints.sql` | present=yes | sha256=3d5ac1c0f2d89aac08acb057668b87b2e9116f274ff78020568dc82522f270f7 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `database/migrations/surebet/007_create_private_paper_runtime_scheduler_checkpoints.sql` | present=yes | sha256=b0ec918132e247f3265145787e3bf9b30320ae2c415937c0578d373e5ec8be57 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `docs/037_database_backup_retention_and_recovery.md` | present=yes | sha256=6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` | present=yes | sha256=896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/cli/bws-database-lifecycle.ts` | present=yes | sha256=4e6da6bfca8e7c622ccd04e66d3789b4f4eaf490f93fd8265bfa458d3c22b06a | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/database-lifecycle.ts` | present=yes | sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/persistence/src/psql.ts` | present=yes | sha256=86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS120-R08-010 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=BwsDatabaseRetentionPlan interfaces | reviewed_line_range=202-237 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS120-R08-010 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=plan/applyBwsDatabaseRetention | reviewed_line_range=464-535 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS120-R08-010 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=computeRetentionPlanFingerprint | reviewed_line_range=980-1001 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS120-R08-010 | `packages/bootstrap/src/cli/bws-database-lifecycle.ts` | symbol=retention-plan and retention-apply | reviewed_line_range=42-73 | reviewed_sha256=4e6da6bfca8e7c622ccd04e66d3789b4f4eaf490f93fd8265bfa458d3c22b06a
- BWS120-R08-011 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=plan/applyBwsDatabaseRetention | reviewed_line_range=464-535 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS120-R08-011 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=buildRetentionDeleteSql | reviewed_line_range=854-952 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS120-R08-011 | `packages/persistence/src/psql.ts` | symbol=queryPsqlJsonRows and runPsql | reviewed_line_range=77-91,191-208 | reviewed_sha256=86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343
- BWS120-R08-011 | `docs/037_database_backup_retention_and_recovery.md` | symbol=Retention and recovery contract | reviewed_line_range=44-58 | reviewed_sha256=6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10
- BWS120-R08-012 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=buildRetentionPlanQuery | reviewed_line_range=600-808 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS120-R08-012 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=buildRetentionDeleteSql | reviewed_line_range=854-952 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS120-R08-012 | `packages/bootstrap/src/api/bws-read-only-query-service.ts` | symbol=buildPrivatePaperRuntimeCycleItem | reviewed_line_range=853-1007 | reviewed_sha256=896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424
- BWS120-R08-012 | `database/migrations/surebet/004_create_worker_jobs.sql` | symbol=worker_jobs/checkpoints/dead_letters | reviewed_line_range=1-153 | reviewed_sha256=9756445dbfbdac6226413098d1253527578d9420543287842c30d034df162b9c
- BWS120-R08-012 | `database/migrations/surebet/006_create_upstream_api_convergence_checkpoints.sql` | symbol=upstream_api_convergence_checkpoints | reviewed_line_range=1-31 | reviewed_sha256=3d5ac1c0f2d89aac08acb057668b87b2e9116f274ff78020568dc82522f270f7
- BWS120-R08-012 | `database/migrations/surebet/007_create_private_paper_runtime_scheduler_checkpoints.sql` | symbol=private_paper_runtime_scheduler_checkpoints | reviewed_line_range=1-25 | reviewed_sha256=b0ec918132e247f3265145787e3bf9b30320ae2c415937c0578d373e5ec8be57
- BWS120-R08-012 | `docs/037_database_backup_retention_and_recovery.md` | symbol=Retention contract | reviewed_line_range=44-54 | reviewed_sha256=6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS120-R08-010 — Retention plan fingerprints omit target database and schema-generation identity

- Severity: `P1`
- Current behavior: The fingerprint includes only scope, cutoff, maxRows, and candidates. The plan and apply receipts expose no database identity or migration/release generation.
- Expected behavior: A destructive retention authorization must bind one exact database, server/cluster identity, schema generation, migration ledger, and candidate snapshot.
- Invariant: A destructive retention authorization must bind one exact database, server/cluster identity, schema generation, migration ledger, and candidate snapshot.
- Root cause: Retention identity is modeled as a candidate-set digest rather than an operation intent bound to one target generation.
- Trigger: A fingerprint generated for one target is supplied to retention apply against another target with the same candidate payload.
- Minimal fix boundary: Include exact live database identity, accepted server/cluster identifier, migration-ledger fingerprint, schema/release generation, and candidate snapshot transaction identity in the plan and apply receipt. Re-prove all fields before deletion.
- Regression risks:
- Retention plans will become intentionally non-portable and short-lived.

### BWS120-R08-011 — Retention planning and deletion are separate transactions and partial prune is detected only after commit

- Severity: `P1`
- Current behavior: Candidate and total counts use separate psql sessions. Apply calls plan again, then performs deletion in another session using only primary keys. A count mismatch is raised after the DELETE statement has committed.
- Expected behavior: Candidate selection, reference checks, fingerprint verification, and deletion must execute atomically with eligibility predicates reasserted at mutation time. Any mismatch must roll back all deletions.
- Invariant: Candidate selection, reference checks, fingerprint verification, and deletion must execute atomically with eligibility predicates reasserted at mutation time. Any mismatch must roll back all deletions.
- Root cause: Retention is composed from independent command invocations rather than one database transaction with mutation-time predicates and rollback.
- Trigger: Retention apply re-plans, then executes a key-only DELETE through a later psql session.
- Minimal fix boundary: Execute target validation, candidate selection, reference checks, exact count, and DELETE in one explicit transaction at an accepted isolation level. Reassert every eligibility predicate in the DELETE and roll back on any mismatch.
- Regression risks:
- Longer transactions can increase lock duration and require bounded batches.

### BWS120-R08-012 — Retention can prune provenance rows still required by retained blocked or terminal parent state

- Severity: `P1`
- Current behavior: Candidate queries protect accepted ledger rows but not retained blocked/dead-lettered parent states. Worker jobs retain last-checkpoint fields without a foreign key to checkpoint rows, scheduler checkpoints retain upstream checkpoint IDs as unqualified text, and the API requires those child/provenance rows to reconstruct blocked cycles.
- Expected behavior: All provenance required to reconstruct any retained parent, terminal blocked cycle, active investigation, or API-visible state must remain referenced and undeletable.
- Invariant: All provenance required to reconstruct any retained parent, terminal blocked cycle, active investigation, or API-visible state must remain referenced and undeletable.
- Root cause: The retention authority map is incomplete and is not derived from the full persisted/API reference graph for all terminal states.
- Trigger: Retention selects old worker checkpoints, dead letters, scheduler checkpoints, or upstream API checkpoints using only accepted-ledger protection and then deletes by key.
- Minimal fix boundary: Define one canonical retention reference graph covering success, blocked, dead-lettered, investigation, settlement, and active runtime states. Encode protective foreign keys or mutation-time NOT EXISTS checks and require post-plan reference parity before deletion.
- Regression risks:
- More evidence will be retained; storage budgets and higher-level artifact retention need recalculation.


## Allowed edit boundary

- Candidate path set: `database/migrations/surebet/004_create_worker_jobs.sql`, `database/migrations/surebet/006_create_upstream_api_convergence_checkpoints.sql`, `database/migrations/surebet/007_create_private_paper_runtime_scheduler_checkpoints.sql`, `docs/037_database_backup_retention_and_recovery.md`, `packages/bootstrap/src/api/bws-read-only-query-service.ts`, `packages/bootstrap/src/cli/bws-database-lifecycle.ts`, `packages/bootstrap/src/operations/database-lifecycle.ts`, `packages/persistence/src/psql.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `database/migrations/surebet/004_create_worker_jobs.sql` | participating tranches=T10, T32 | predecessor postimage required
- `database/migrations/surebet/006_create_upstream_api_convergence_checkpoints.sql` | participating tranches=T13, T32 | predecessor postimage required
- `docs/037_database_backup_retention_and_recovery.md` | participating tranches=T09, T13, T30, T31, T32 | predecessor postimage required
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` | participating tranches=T18, T19, T32 | predecessor postimage required
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

- API projection formatting
- all betting-win source, checkout, documentation, service, database, and runtime
- candidate ordering
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds
- cutoff parsing
- generic psql timeout defect owned by BWS116-R03-005
- import-run convergence reference root cause owned by BWS116-R03-013
- pure candidate ordering
- retention scope taxonomy
- scope list
- strategy acceptance semantics

## Prerequisites

- Dependency terminal receipts: T10, T13, T31.
- Review prerequisites: `exact database/schema generation identity; reference ownership map`.
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

- `BWS120-R08-010-TEST-01` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-010 | requirement=Generate identical candidates on two disposable databases and reject cross-target fingerprint reuse.
- `BWS120-R08-010-TEST-02` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-010 | requirement=Change migration ledger after planning and reject apply.
- `BWS120-R08-010-TEST-03` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-010 | requirement=Change database host/socket identity while keeping database name and reject apply.
- `BWS120-R08-011-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-011 | requirement=Insert a new reference between planning and apply and prove no row is deleted.
- `BWS120-R08-011-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-011 | requirement=Delete or alter one candidate before apply and prove the whole transaction rolls back.
- `BWS120-R08-011-TEST-03` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-011 | requirement=Run concurrent applies with the same plan and prove at most one commits with truthful receipts.
- `BWS120-R08-011-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-011 | requirement=Force an error after the first internal mutation and prove zero committed deletions.
- `BWS120-R08-012-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-012 | requirement=Retain a dead-lettered blocked cycle and prove its dead-letter and required checkpoints are not candidates.
- `BWS120-R08-012-TEST-02` | category=api_or_projection | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-012 | requirement=Retain a scheduler checkpoint and prove its upstream API checkpoint cannot be pruned.
- `BWS120-R08-012-TEST-03` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-012 | requirement=Exercise all six retention scopes against success, blocked, active-investigation, and unreferenced fixtures.
- `BWS120-R08-012-TEST-04` | category=api_or_projection | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-012 | requirement=Prove API reconstruction remains identical before and after allowed pruning.

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS120-R08-010-TEST-01` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-010 | requirement=Generate identical candidates on two disposable databases and reject cross-target fingerprint reuse.
- `BWS120-R08-010-TEST-02` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-010 | requirement=Change migration ledger after planning and reject apply.
- `BWS120-R08-010-TEST-03` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-010 | requirement=Change database host/socket identity while keeping database name and reject apply.
- `BWS120-R08-011-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-011 | requirement=Insert a new reference between planning and apply and prove no row is deleted.
- `BWS120-R08-011-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-011 | requirement=Delete or alter one candidate before apply and prove the whole transaction rolls back.
- `BWS120-R08-011-TEST-03` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-011 | requirement=Run concurrent applies with the same plan and prove at most one commits with truthful receipts.
- `BWS120-R08-011-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-011 | requirement=Force an error after the first internal mutation and prove zero committed deletions.
- `BWS120-R08-012-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-012 | requirement=Retain a dead-lettered blocked cycle and prove its dead-letter and required checkpoints are not candidates.
- `BWS120-R08-012-TEST-02` | category=api_or_projection | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-012 | requirement=Retain a scheduler checkpoint and prove its upstream API checkpoint cannot be pruned.
- `BWS120-R08-012-TEST-03` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-012 | requirement=Exercise all six retention scopes against success, blocked, active-investigation, and unreferenced fixtures.
- `BWS120-R08-012-TEST-04` | category=api_or_projection | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-012 | requirement=Prove API reconstruction remains identical before and after allowed pruning.

## Negative and adversarial tests

- `BWS120-R08-010-TEST-01` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-010 | requirement=Generate identical candidates on two disposable databases and reject cross-target fingerprint reuse.
- `BWS120-R08-010-TEST-02` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-010 | requirement=Change migration ledger after planning and reject apply.
- `BWS120-R08-010-TEST-03` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-010 | requirement=Change database host/socket identity while keeping database name and reject apply.

## Concurrency, cancellation, crash, and restart tests

- `BWS120-R08-011-TEST-03` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-011 | requirement=Run concurrent applies with the same plan and prove at most one commits with truthful receipts.

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

Acceptance authority: plan bound to target; plan/apply one transaction or fenced protocol; partial prune impossible; blocked/terminal provenance retained

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W3-T34` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
