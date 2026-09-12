
# BWS-W3-T31 implementation packet

> Documentation status: `PROPOSED_NOT_ACTIVE` for T39 and `NOT_ADMITTED` for all tranches. This packet does not authorize source mutation.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W3-T31
CAMPAIGN_ORDER: 8
STAGE: S1
PRIMARY_OWNER: R08
SECONDARY_REVIEWERS: R03, R06, R07, R09, R10, R11, R24
ISSUE_IDS: BWS120-R08-002, BWS120-R08-005, BWS120-R08-006, BWS120-R08-007, BWS120-R08-008, BWS120-R08-009
SEVERITY_COUNTS: {"P0": 1, "P1": 4, "P2": 1}
DEPENDENCIES: T01, T09, T30, T37, T38
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; exact 771-member archive inventory; independently computed inventory digest=b81ff807e4c230bff96fe1fa58f73a2d4bac803ebd7fa58b843cdcb83499f7f0
CURRENT_SOURCE_PATH_CANDIDATES: docs/037_database_backup_retention_and_recovery.md, docs/039_release_deployment_and_upgrade_contract.md, docs/043_upgrade_rollback_recovery_implementation_blueprint.md, packages/bootstrap/src/operations/database-lifecycle.ts, packages/bootstrap/src/operations/external-runtime-preflight.ts, packages/bootstrap/src/operations/final-local-acceptance.ts, packages/bootstrap/src/operations/release-upgrade.ts
SYMBOLS_TO_REVERIFY: 23 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: docs/037_database_backup_retention_and_recovery.md, packages/bootstrap/src/operations/database-lifecycle.ts, packages/bootstrap/src/operations/external-runtime-preflight.ts, packages/bootstrap/src/operations/final-local-acceptance.ts, packages/bootstrap/src/operations/release-upgrade.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites ``R03 migration authority; exact database identity; bounded cleanup registry``
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 22 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 22 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 9 classified records below
CONCURRENCY_OR_CRASH_TESTS: 4 classified records below
ENVIRONMENT_PROOF: {"NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION": 22}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: apply revalidates plan target and ledger; server version evaluated; receipt binds exact dump and restored semantics; restart proof authoritative; orphan cleanup recoverable
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": false, "bws_710": false, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W4-T40 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `docs/037_database_backup_retention_and_recovery.md` | present=yes | sha256=6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `docs/039_release_deployment_and_upgrade_contract.md` | present=yes | sha256=62bffb897f6ec26c58782fa097e31d0e4c2a7c9e3f9f2bd9a8b4da1c9d3f3ad5 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `docs/043_upgrade_rollback_recovery_implementation_blueprint.md` | present=yes | sha256=46513efa6bd4be9b897a26dae42431a8c0b5438f3f9c44f2a42af70a4dc811a3 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/database-lifecycle.ts` | present=yes | sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/external-runtime-preflight.ts` | present=yes | sha256=724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/final-local-acceptance.ts` | present=yes | sha256=1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/release-upgrade.ts` | present=yes | sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS120-R08-002 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=createBwsReleaseUpgradePlan | reviewed_line_range=385-443 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R08-002 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=applyBwsReleaseUpgrade | reviewed_line_range=519-535 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R08-002 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=applyBwsReleaseUpgrade migration phase | reviewed_line_range=631-645 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R08-002 | `docs/039_release_deployment_and_upgrade_contract.md` | symbol=Upgrade contract | reviewed_line_range=33-49 | reviewed_sha256=62bffb897f6ec26c58782fa097e31d0e4c2a7c9e3f9f2bd9a8b4da1c9d3f3ad5
- BWS120-R08-005 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=getBwsDatabaseMigrationStatus | reviewed_line_range=262-308 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS120-R08-005 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=queryDatabaseIdentity | reviewed_line_range=1158-1187 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS120-R08-005 | `docs/037_database_backup_retention_and_recovery.md` | symbol=Migration status contract | reviewed_line_range=9-19 | reviewed_sha256=6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10
- BWS120-R08-006 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=readAndValidateBackupManifest | reviewed_line_range=1004-1018 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS120-R08-006 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=verifyBwsDatabaseRestore | reviewed_line_range=389-458 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS120-R08-006 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=assertRowCountsMatch | reviewed_line_range=1323-1336 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS120-R08-006 | `docs/037_database_backup_retention_and_recovery.md` | symbol=Restore verification contract | reviewed_line_range=33-42 | reviewed_sha256=6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10
- BWS120-R08-007 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=verifyBwsDatabaseRestore | reviewed_line_range=431-458 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS120-R08-007 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=verifyReadOnlyApiQueries | reviewed_line_range=1228-1300 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS120-R08-007 | `packages/bootstrap/src/operations/external-runtime-preflight.ts` | symbol=validateBackupEvidence | reviewed_line_range=504-527 | reviewed_sha256=724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427
- BWS120-R08-007 | `packages/bootstrap/src/operations/final-local-acceptance.ts` | symbol=createBwsFinalLocalAcceptanceRecoveryResult | reviewed_line_range=535-613 | reviewed_sha256=1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5
- BWS120-R08-007 | `docs/037_database_backup_retention_and_recovery.md` | symbol=Restore verification contract | reviewed_line_range=33-42 | reviewed_sha256=6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10
- BWS120-R08-008 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=BwsVerifyDatabaseRestoreResult | reviewed_line_range=183-195 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS120-R08-008 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=verifyBwsDatabaseRestore return | reviewed_line_range=446-458 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS120-R08-008 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=verifyBackupEvidence | reviewed_line_range=1293-1338 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R08-008 | `docs/043_upgrade_rollback_recovery_implementation_blueprint.md` | symbol=Required contracts | reviewed_line_range=18-39 | reviewed_sha256=46513efa6bd4be9b897a26dae42431a8c0b5438f3f9c44f2a42af70a4dc811a3
- BWS120-R08-009 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=verifyBwsDatabaseRestore | reviewed_line_range=389-461 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS120-R08-009 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=buildDisposableRestoreDatabaseName and create/drop | reviewed_line_range=1338-1393 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- BWS120-R08-009 | `docs/037_database_backup_retention_and_recovery.md` | symbol=Recovery contract | reviewed_line_range=33-42,56-58 | reviewed_sha256=6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS120-R08-002 — Release-upgrade apply can migrate a different database than the reviewed plan

- Severity: `P0`
- Current behavior: Planning fingerprints the environment file and database identity, but apply only checks the caller-supplied plan fingerprint, re-reads the environment, resolves a fresh database configuration, and applies migrations without comparing that target or ledger to the plan.
- Expected behavior: Apply must re-prove the exact environment bytes, target database identity, migration ledger, and release binding recorded by the plan before any drain or migration effect.
- Invariant: Apply must re-prove the exact environment bytes, target database identity, migration ledger, and release binding recorded by the plan before any drain or migration effect.
- Root cause: The plan fingerprint is treated as sufficient authorization even though effectful configuration is re-resolved from mutable inputs at apply time.
- Trigger: The apply path re-reads the mutable environment and reaches migration application.
- Minimal fix boundary: Before draining or applying migrations, re-hash the environment, resolve and query the live database identity and ledger, compare every plan-bound field, and abort on any difference. The apply path must use the revalidated immutable target tuple for all subsequent steps.
- Regression risks:
- Long-lived plans will become stale by design when configuration or database state changes.

### BWS120-R08-005 — Migration status reports compatibility without evaluating PostgreSQL server-version compatibility

- Severity: `P1`
- Current behavior: The server version and numeric version are recorded, but compatibility reasons are derived only from checksum mismatches and schema existence.
- Expected behavior: Compatibility must include an explicit supported server-version policy and reject unknown or unsupported versions.
- Invariant: Compatibility must include an explicit supported server-version policy and reject unknown or unsupported versions.
- Root cause: Server version is modeled as evidence but not as an authority input to compatibility.
- Trigger: Migration status is evaluated.
- Minimal fix boundary: Define the accepted PostgreSQL version range, validate numeric version fail closed, include the decision in status evidence, and require the same version binding at plan/apply and restore verification.
- Regression risks:
- Existing environments outside the newly explicit support range will become blocked until formally accepted.

### BWS120-R08-006 — Restore verification does not bind manifest semantics to the exact restored database state

- Severity: `P1`
- Current behavior: Manifest validation checks only the schema tag and that rowCounts is an array. Restore requires general migration compatibility and no pending migrations but does not compare the manifest ledger or source identity to the restored state. Row-count comparison checks only manifest-listed tables and ignores unexpected restored tables.
- Expected behavior: The manifest must be fully schema validated and the restored database must match its exact database identity, migration ledger, complete table set, row counts, and invariants.
- Invariant: The manifest must be fully schema validated and the restored database must match its exact database identity, migration ledger, complete table set, row counts, and invariants.
- Root cause: The restore verifier treats a typed interface assertion as full validation and uses partial parity checks instead of one canonical restored-state comparison.
- Trigger: Restore verification reads the manifest and validates the restored database.
- Minimal fix boundary: Apply strict runtime schema validation, record the exact dump/checksum identity, compare exact migration ledger and source/restore identity fields, compare complete expected and actual table sets, and execute explicit invariants.
- Regression risks:
- Older manifests that were accepted through structural casting may become invalid.

### BWS120-R08-007 — Restore verification hard-codes restart success after two loopback API smoke runs

- Severity: `P1`
- Current behavior: The verifier starts and closes two in-process loopback API servers, performs three small read queries per run, then returns serverRestartsVerified=true unconditionally. Downstream preflight and final acceptance trust that boolean.
- Expected behavior: Restart proof must represent actual database, scheduler, worker, and service restart/recovery behavior or remain explicitly unproven.
- Invariant: Restart proof must represent actual database, scheduler, worker, and service restart/recovery behavior or remain explicitly unproven.
- Root cause: A broad acceptance claim is represented by an unconditional boolean rather than typed evidence for each required recovery component.
- Trigger: verifyBwsDatabaseRestore returns its receipt.
- Minimal fix boundary: Replace the boolean with explicit, hashed database-restart, scheduler-recovery, worker-recovery, service-restart, and API-read evidence. Require each consumer to validate the detailed receipt and preserve held states when any component is unavailable.
- Regression risks:
- Existing restore receipts containing only serverRestartsVerified will no longer satisfy acceptance.

### BWS120-R08-008 — Restore verification receipt is not bound to the exact dump bytes it claims to verify

- Severity: `P1`
- Current behavior: The receipt includes the manifest but no dump or checksum-file digest. Release verification checks current file checksums, then compares only the receipt manifest fingerprint to the current manifest.
- Expected behavior: A restore receipt must be valid only for the exact dump, manifest, checksum file, and source database snapshot that were restored.
- Invariant: A restore receipt must be valid only for the exact dump, manifest, checksum file, and source database snapshot that were restored.
- Root cause: The restore receipt models semantic manifest identity but omits content identity for the dump and checksum manifest.
- Trigger: Release upgrade validates current bundle checksums and compares the old receipt only to the current manifest.
- Minimal fix boundary: Add one canonical backup-bundle identity containing dump SHA-256, manifest SHA-256, checksum-file SHA-256, source snapshot identity, and schema. Persist it in the restore receipt and require exact equality in every consumer.
- Regression risks:
- All existing restore receipts lacking bundle identity must be regenerated.

### BWS120-R08-009 — Interrupted restore verification can leave untracked disposable databases

- Severity: `P2`
- Current behavior: Cleanup exists only in an in-process finally block. The database name is derived from timestamp and PID, and there is no durable registry, owner token, startup reconciliation, or verified leak enumeration.
- Expected behavior: Every disposable database must have durable ownership metadata and bounded recovery that can identify and safely remove only abandoned review-owned targets.
- Invariant: Every disposable database must have durable ownership metadata and bounded recovery that can identify and safely remove only abandoned review-owned targets.
- Root cause: Disposable-resource ownership is process-local rather than persisted and reconciled.
- Trigger: Process interruption occurs during restore or verification.
- Minimal fix boundary: Use a strong unique owner token, persist a restore-run registry before creation, tag the database with that run identity, and provide a bounded reconciler that proves ownership before cleanup.
- Regression risks:
- Recovery introduces durable bookkeeping that must itself be retained and reconciled.


## Allowed edit boundary

- Candidate path set: `docs/037_database_backup_retention_and_recovery.md`, `docs/039_release_deployment_and_upgrade_contract.md`, `docs/043_upgrade_rollback_recovery_implementation_blueprint.md`, `packages/bootstrap/src/operations/database-lifecycle.ts`, `packages/bootstrap/src/operations/external-runtime-preflight.ts`, `packages/bootstrap/src/operations/final-local-acceptance.ts`, `packages/bootstrap/src/operations/release-upgrade.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `docs/037_database_backup_retention_and_recovery.md` | participating tranches=T09, T13, T30, T31, T32 | predecessor postimage required
- `packages/bootstrap/src/operations/database-lifecycle.ts` | participating tranches=T09, T13, T30, T31, T32, T37 | predecessor postimage required
- `packages/bootstrap/src/operations/external-runtime-preflight.ts` | participating tranches=T03, T04, T27, T29, T31, T33, T36 | predecessor postimage required
- `packages/bootstrap/src/operations/final-local-acceptance.ts` | participating tranches=T29, T31, T35, T36 | predecessor postimage required
- `packages/bootstrap/src/operations/release-upgrade.ts` | participating tranches=T31, T33, T34 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- API query semantics owned by R05
- SHA-256 algorithm
- active project database prohibition
- all betting-win source, checkout, documentation, service, database, and runtime
- checksum algorithm
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds
- database row-count semantics
- disposable database selection
- generic service lifecycle implementation
- migration SQL semantics owned by R03
- migration checksums
- migration ordering
- normal finally cleanup
- provider/runtime external holds
- read-only API query correctness
- release inventory verification
- release package identity
- restore SQL flags
- schema existence check
- service lifecycle internals owned by R06

## Prerequisites

- Dependency terminal receipts: T01, T09, T30, T37, T38.
- Review prerequisites: `R03 migration authority; exact database identity; bounded cleanup registry`.
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

- `BWS120-R08-002-TEST-01` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-002 | requirement=Change the environment file database between plan and apply and require a pre-effect failure.
- `BWS120-R08-002-TEST-02` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-002 | requirement=Change host or socket target while keeping the same database name and require failure.
- `BWS120-R08-002-TEST-03` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-002 | requirement=Change the live applied-migration ledger between plan and apply and require failure.
- `BWS120-R08-002-TEST-04` | category=cancellation_or_timeout | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-002 | requirement=Prove no lifecycle drain or migration callback occurs before target parity succeeds.
- `BWS120-R08-005-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-005 | requirement=Supported major/minor version is compatible.
- `BWS120-R08-005-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-005 | requirement=Unsupported, malformed, and unknown numeric versions are incompatible.
- `BWS120-R08-005-TEST-03` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-005 | requirement=Upgrade apply rejects server-version drift after planning.
- `BWS120-R08-006-TEST-01` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-006 | requirement=Reject missing, extra, wrong-type, malformed, and duplicate manifest fields.
- `BWS120-R08-006-TEST-02` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-006 | requirement=Reject manifest/dump migration-ledger mismatch.
- `BWS120-R08-006-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-006 | requirement=Reject missing and unexpected surebet tables.
- `BWS120-R08-006-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-006 | requirement=Reject source identity mismatch and invariant failure despite matching row counts.
- `BWS120-R08-007-TEST-01` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-007 | requirement=Database/API smoke passes but scheduler recovery fails and receipt remains blocked.
- `BWS120-R08-007-TEST-02` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-007 | requirement=Worker restart loses checkpoint and receipt remains blocked.
- `BWS120-R08-007-TEST-03` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-007 | requirement=Service restart evidence is absent or stale and preflight rejects it.
- `BWS120-R08-007-TEST-04` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-007 | requirement=All component receipts are bound to the same restored database and source generation.
- `BWS120-R08-008-TEST-01` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-008 | requirement=Change only dump bytes and checksum file after restore; upgrade verification must reject the stale receipt.
- `BWS120-R08-008-TEST-02` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-008 | requirement=Change only manifest bytes; reject.
- `BWS120-R08-008-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-008 | requirement=Change checksum-file bytes without changing referenced digests; reject.
- `BWS120-R08-008-TEST-04` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-008 | requirement=Accept only an exact bundle identity produced by the restore run.
- `BWS120-R08-009-TEST-01` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-009 | requirement=Terminate verification after create and prove the next bounded reconciliation discovers only the abandoned owned database.
- `BWS120-R08-009-TEST-02` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-009 | requirement=Run two verifications with equal injected time and prove unique database identities.
- `BWS120-R08-009-TEST-03` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-009 | requirement=Prove reconciliation does not remove non-owned databases.

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS120-R08-002-TEST-01` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-002 | requirement=Change the environment file database between plan and apply and require a pre-effect failure.
- `BWS120-R08-002-TEST-02` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-002 | requirement=Change host or socket target while keeping the same database name and require failure.
- `BWS120-R08-002-TEST-03` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-002 | requirement=Change the live applied-migration ledger between plan and apply and require failure.
- `BWS120-R08-002-TEST-04` | category=cancellation_or_timeout | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-002 | requirement=Prove no lifecycle drain or migration callback occurs before target parity succeeds.
- `BWS120-R08-005-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-005 | requirement=Supported major/minor version is compatible.
- `BWS120-R08-005-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-005 | requirement=Unsupported, malformed, and unknown numeric versions are incompatible.
- `BWS120-R08-005-TEST-03` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-005 | requirement=Upgrade apply rejects server-version drift after planning.
- `BWS120-R08-006-TEST-01` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-006 | requirement=Reject missing, extra, wrong-type, malformed, and duplicate manifest fields.
- `BWS120-R08-006-TEST-02` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-006 | requirement=Reject manifest/dump migration-ledger mismatch.
- `BWS120-R08-006-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-006 | requirement=Reject missing and unexpected surebet tables.
- `BWS120-R08-006-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-006 | requirement=Reject source identity mismatch and invariant failure despite matching row counts.
- `BWS120-R08-007-TEST-01` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-007 | requirement=Database/API smoke passes but scheduler recovery fails and receipt remains blocked.
- `BWS120-R08-007-TEST-02` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-007 | requirement=Worker restart loses checkpoint and receipt remains blocked.
- `BWS120-R08-007-TEST-03` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-007 | requirement=Service restart evidence is absent or stale and preflight rejects it.
- `BWS120-R08-007-TEST-04` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-007 | requirement=All component receipts are bound to the same restored database and source generation.
- `BWS120-R08-008-TEST-01` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-008 | requirement=Change only dump bytes and checksum file after restore; upgrade verification must reject the stale receipt.
- `BWS120-R08-008-TEST-02` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-008 | requirement=Change only manifest bytes; reject.
- `BWS120-R08-008-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-008 | requirement=Change checksum-file bytes without changing referenced digests; reject.
- `BWS120-R08-008-TEST-04` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-008 | requirement=Accept only an exact bundle identity produced by the restore run.
- `BWS120-R08-009-TEST-01` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-009 | requirement=Terminate verification after create and prove the next bounded reconciliation discovers only the abandoned owned database.
- `BWS120-R08-009-TEST-02` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-009 | requirement=Run two verifications with equal injected time and prove unique database identities.
- `BWS120-R08-009-TEST-03` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-009 | requirement=Prove reconciliation does not remove non-owned databases.

## Negative and adversarial tests

- `BWS120-R08-005-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-005 | requirement=Unsupported, malformed, and unknown numeric versions are incompatible.
- `BWS120-R08-006-TEST-01` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-006 | requirement=Reject missing, extra, wrong-type, malformed, and duplicate manifest fields.
- `BWS120-R08-006-TEST-02` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-006 | requirement=Reject manifest/dump migration-ledger mismatch.
- `BWS120-R08-006-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-006 | requirement=Reject missing and unexpected surebet tables.
- `BWS120-R08-006-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-006 | requirement=Reject source identity mismatch and invariant failure despite matching row counts.
- `BWS120-R08-007-TEST-03` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-007 | requirement=Service restart evidence is absent or stale and preflight rejects it.
- `BWS120-R08-008-TEST-01` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-008 | requirement=Change only dump bytes and checksum file after restore; upgrade verification must reject the stale receipt.
- `BWS120-R08-008-TEST-02` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-008 | requirement=Change only manifest bytes; reject.
- `BWS120-R08-008-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-008 | requirement=Change checksum-file bytes without changing referenced digests; reject.

## Concurrency, cancellation, crash, and restart tests

- `BWS120-R08-002-TEST-04` | category=cancellation_or_timeout | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-002 | requirement=Prove no lifecycle drain or migration callback occurs before target parity succeeds.
- `BWS120-R08-007-TEST-01` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-007 | requirement=Database/API smoke passes but scheduler recovery fails and receipt remains blocked.
- `BWS120-R08-007-TEST-02` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-007 | requirement=Worker restart loses checkpoint and receipt remains blocked.
- `BWS120-R08-007-TEST-03` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R08-007 | requirement=Service restart evidence is absent or stale and preflight rejects it.

## Environment proof

- NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION: 22 requirements

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

Acceptance authority: apply revalidates plan target and ledger; server version evaluated; receipt binds exact dump and restored semantics; restart proof authoritative; orphan cleanup recoverable

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W4-T40` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
