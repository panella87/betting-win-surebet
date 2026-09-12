# BWS120-R08 substantive review report

## Executive verdict

- Repository: `betting-win-surebet`.
- Reviewed archive: `betting-win-surebet120(2).zip`.
- Actual archive SHA-256: `d4565c05ecfe63f5d5511f224a20ff20fb82bfc75b23203c94d7d3e98a8c21bb`.
- Archive members reconciled: `695` regular files.
- Package identity: `betting-win-surebet@0.1.0-bws-full-platform`.
- Canonical runtime: `Node 20.20.2`; available runtime: `Node v22.16.0`, supplementary only.
- Archive safety: no duplicate paths, unsafe paths, symlinks, or special entries.
- Executable compatibility: `BWS120` differs from `betting-win-surebet118(1).zip` by 38 added documentation files and 2 edited documentation files only. There are no non-documentation byte differences.
- Confirmed findings: `12` total, comprising `2 P0`, `9 P1`, and `1 P2`.
- Release/deployment verdict: **blocked**. Backup publication, migration target binding, restore-proof truth, retention atomicity, and reference preservation are not yet sufficient for accepted recovery evidence.
- BWS-600 remains `BLOCKED_EXTERNAL_RUNTIME_EVIDENCE`; this review does not start or authorize BWS-600, BWS-710, or BWS-900.

## Safety boundary and excluded cybersecurity content

This review stayed within defensive, read-only operational assurance. It did not develop exploits, construct attack chains, test credential abuse, contact providers, probe networks, or execute destructive path or database scenarios. Permission-bypass, encryption-key, and offensive filesystem-race analysis were excluded. The two P0 findings are reported only as fail-closed operational risks involving wrong-path deletion and wrong-database migration.

No source, test, migration, documentation, configuration, manifest, archive, service, provider, account, credential, signer, or persistent database was modified or contacted.

## Archive and executable-compatibility verdict

`betting-win-surebet120(2).zip` is structurally safe and extraction-complete. Its SHA-256 is `d4565c05ecfe63f5d5511f224a20ff20fb82bfc75b23203c94d7d3e98a8c21bb`. The prior accepted review baseline `betting-win-surebet118(1).zip` has SHA-256 `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`. Mechanical member comparison produced:

- Added: 38 files, all under `docs/reviews/BWS118/wave-02/`.
- Changed: `docs/000_documentation_index.md` and `docs/reviews/README.md`.
- Removed: 0 files.
- Non-documentation differences: 0.

Therefore all executable conclusions from R01 through R06 remain applicable. The new Wave 02 review tree is evidence, not executable routing authority.

## Ownership and inherited-authority reconciliation

R08 owns operational migration orchestration, backup/restore lifecycle, retention plan/apply parity, reference safety, interruption recovery, and wrong-target protection. It does not reassign R03 persistence semantics or R06 process lifecycle.

- All 17 confirmed `BWS116-R03-*` findings were checked. None was duplicated as a new root cause.
- `BWS116-R03-013` remains the authority for import-run retention versus convergence references. R08-012 covers different child/provenance rows and blocked-cycle reconstruction.
- `BWS116-R03-005` remains the authority for missing psql timeout/cancellation. R08 does not duplicate it.
- R06 remains owner of process topology, restart, drain, timeout, and child ownership. R08-007 concerns false recovery evidence, not the lifecycle implementation itself.
- `KNOWN_BASELINE_MANIFEST_DRIFT` remains an R11 handoff only.

## Database-lifecycle architecture

### Migration status

`getBwsDatabaseMigrationStatus` resolves configuration, queries live database identity, loads tracked migrations, reads the applied ledger, evaluates checksum/schema compatibility, and reports drain requirements. The status receipt records PostgreSQL version fields but does not evaluate them.

### Backup

`createBwsDatabaseBackup` builds a temporary directory, queries migration status, runs a schema-only custom-format `pg_dump`, queries table counts, writes a manifest and SHA-256 list, and renames the temporary directory into the requested output path. Snapshot coordination and safe replacement publication are incomplete.

### Restore verification

`verifyBwsDatabaseRestore` verifies bundle checksums, creates a disposable database, restores with ownership and privilege suppression, checks broad migration compatibility, compares manifest-listed row counts, runs two in-process read-only API smoke sequences, emits a restore receipt, and drops the disposable database in `finally`. The receipt does not prove the complete recovery contract.

### Retention

Retention supports six scopes: import runs, scheduler checkpoints, upstream API checkpoints, upstream export checkpoints, worker checkpoints, and worker dead letters. Planning and deletion are separate psql invocations. The fingerprint binds the candidate payload but not the target database or generation.

### Downstream consumers

Release upgrade, external runtime preflight, and final local acceptance consume database-lifecycle receipts. These consumers propagate several overclaims, particularly the unconditional restart boolean and manifest-only restore receipt binding.

## Confirmed findings summary

| ID | Severity | Title | Release | BWS-600 |
|---|---:|---|:---:|:---:|
| `BWS120-R08-001` | P0 | Backup overwrite can recursively remove an unrelated pre-existing directory | Yes | Yes |
| `BWS120-R08-002` | P0 | Release-upgrade apply can migrate a different database than the reviewed plan | Yes | Yes |
| `BWS120-R08-003` | P1 | Backup manifest metadata and row counts are not captured from the pg_dump snapshot | Yes | Yes |
| `BWS120-R08-004` | P1 | Backup replacement deletes the previous verified backup before the new publication commits | Yes | Yes |
| `BWS120-R08-005` | P1 | Migration status reports compatibility without evaluating PostgreSQL server-version compatibility | Yes | Yes |
| `BWS120-R08-006` | P1 | Restore verification does not bind manifest semantics to the exact restored database state | Yes | Yes |
| `BWS120-R08-007` | P1 | Restore verification hard-codes restart success after two loopback API smoke runs | Yes | Yes |
| `BWS120-R08-008` | P1 | Restore verification receipt is not bound to the exact dump bytes it claims to verify | Yes | Yes |
| `BWS120-R08-009` | P2 | Interrupted restore verification can leave untracked disposable databases | Yes | Yes |
| `BWS120-R08-010` | P1 | Retention plan fingerprints omit target database and schema-generation identity | Yes | Yes |
| `BWS120-R08-011` | P1 | Retention planning and deletion are separate transactions and partial prune is detected only after commit | Yes | Yes |
| `BWS120-R08-012` | P1 | Retention can prune provenance rows still required by retained blocked or terminal parent state | Yes | Yes |

## Confirmed findings

### BWS120-R08-001 - Backup overwrite can recursively remove an unrelated pre-existing directory

    **Classification:** CONFIRMED_FINDING
    **Severity:** P0
    **Confidence:** HIGH
    **Primary owner:** R08
    **Secondary sectors:** R09, R10, R11
    **Blocks:** release, deployment, BWS-600 evidence, later execution

    **Preconditions**

    - The operator invokes the backup command with the explicit overwrite flag.
- The selected output path already exists and is outside only the two specifically rejected transient directories.

    **Trigger**

    Backup publication reaches the overwrite branch for an existing path.

    **Expected behavior**

    Overwrite must be confined to a dedicated backup destination and must never recursively remove unrelated operator data.

    **Current behavior**

    The path guard excludes only repository runtime directories. Any other existing path is recursively removed before the staged backup is renamed into place.

    **Impact**

    A misdirected but explicitly requested backup can cause irreversible deletion outside the backup domain. This is an operational destructive-path defect and is release blocking.

    **Exact evidence**

    - `packages/bootstrap/src/operations/database-lifecycle.ts` `createBwsDatabaseBackup` lines `311-373`, SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. The overwrite branch calls recursive removal on the resolved output path before publication.
- `packages/bootstrap/src/operations/database-lifecycle.ts` `requireOutputPath` lines `1395-1409`, SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. The path predicate rejects only runtime and runtime-state and does not confine output to an approved backup root or generated leaf.
- `packages/bootstrap/src/cli/bws-database-lifecycle.ts` `runBwsDatabaseLifecycleCli backup` lines `25-32`, SHA-256 `4e6da6bfca8e7c622ccd04e66d3789b4f4eaf490f93fd8265bfa458d3c22b06a`. The public CLI exposes the overwrite branch through --allow-overwrite.
- `docs/037_database_backup_retention_and_recovery.md` `Backup contract` lines `21-31`, SHA-256 `6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10`. The authority requires an explicit safe overwrite flag and atomic publication.

    **Independent evidence and reproduction status**

    The inert static predicate harness confirmed that the production path validator accepts non-transient paths without executing any deletion.
    Reproduction status: `CONFIRMED_BY_STATIC_TRACE_AND_INERT_NON_DESTRUCTIVE_HARNESS`.

    **Transaction or state-machine analysis**

    The staged backup becomes authoritative only after publication, but existing content is destroyed before the new publication transition is committed.

    **Root cause**

    Output authorization is represented as a negative denylist instead of a positively bound backup root and exact destination identity.

    **Minimal fix boundary**

    Confine backup output to an operator-selected approved backup root, require a backup-specific destination leaf, reject unrelated existing directories, and preserve the prior verified backup until replacement publication is committed.

    **Required tests**

      - Reject an overwrite target outside the approved backup root.
  - Reject an existing unrelated directory even when overwrite intent is present.
  - Prove a failed replacement leaves the previous verified backup intact.
  - Prove normal publication remains atomic inside the approved root.

    **Regression risks**

      - Existing workflows that use arbitrary output directories will become invalid and need an explicit approved backup root.

    **Aliases or dependencies:** BWS116-R03-HO-002

    **Explicitly unchanged areas**

      - pg_dump schema selection
  - backup checksum format
  - provider and execution boundaries

### BWS120-R08-002 - Release-upgrade apply can migrate a different database than the reviewed plan

    **Classification:** CONFIRMED_FINDING
    **Severity:** P0
    **Confidence:** HIGH
    **Primary owner:** R08
    **Secondary sectors:** R09, R10, R11
    **Blocks:** release, deployment, BWS-600 evidence, later execution

    **Preconditions**

    - A ready upgrade plan has been produced.
- The environment file or effective PostgreSQL tuple changes before apply, or the live migration ledger changes after planning.

    **Trigger**

    The apply path re-reads the mutable environment and reaches migration application.

    **Expected behavior**

    Apply must re-prove the exact environment bytes, target database identity, migration ledger, and release binding recorded by the plan before any drain or migration effect.

    **Current behavior**

    Planning fingerprints the environment file and database identity, but apply only checks the caller-supplied plan fingerprint, re-reads the environment, resolves a fresh database configuration, and applies migrations without comparing that target or ledger to the plan.

    **Impact**

    A valid plan can authorize migration effects against a different database or changed ledger. The mismatch can create irreversible schema or data effects on the wrong target.

    **Exact evidence**

    - `packages/bootstrap/src/operations/release-upgrade.ts` `createBwsReleaseUpgradePlan` lines `385-443`, SHA-256 `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`. The plan records the database identity and environment file hash.
- `packages/bootstrap/src/operations/release-upgrade.ts` `applyBwsReleaseUpgrade` lines `519-535`, SHA-256 `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`. Apply accepts the stored plan, then re-reads the mutable environment without rechecking its hash or database identity.
- `packages/bootstrap/src/operations/release-upgrade.ts` `applyBwsReleaseUpgrade migration phase` lines `631-645`, SHA-256 `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`. Migrations are applied through the freshly resolved configuration without a live target parity gate.
- `docs/039_release_deployment_and_upgrade_contract.md` `Upgrade contract` lines `33-49`, SHA-256 `62bffb897f6ec26c58782fa097e31d0e4c2a7c9e3f9f2bd9a8b4da1c9d3f3ad5`. The authority requires current/target identity, migration compatibility, backup proof, and fail-closed migration behavior.

    **Independent evidence and reproduction status**

    The inert source harness confirmed that the apply path contains no environment-fingerprint or live database-identity comparison before applyMigrations.
    Reproduction status: `CONFIRMED_BY_STATIC_STATE_MACHINE_TRACE_AND_INERT_SOURCE_HARNESS`.

    **Transaction or state-machine analysis**

    The plan/apply state machine binds the decision to one target at planning time but discards that target binding at the effectful transition.

    **Root cause**

    The plan fingerprint is treated as sufficient authorization even though effectful configuration is re-resolved from mutable inputs at apply time.

    **Minimal fix boundary**

    Before draining or applying migrations, re-hash the environment, resolve and query the live database identity and ledger, compare every plan-bound field, and abort on any difference. The apply path must use the revalidated immutable target tuple for all subsequent steps.

    **Required tests**

      - Change the environment file database between plan and apply and require a pre-effect failure.
  - Change host or socket target while keeping the same database name and require failure.
  - Change the live applied-migration ledger between plan and apply and require failure.
  - Prove no lifecycle drain or migration callback occurs before target parity succeeds.

    **Regression risks**

      - Long-lived plans will become stale by design when configuration or database state changes.

    **Aliases or dependencies:** BWS116-R03-HO-002, BWS116-R03-004, BWS118-R06-001

    **Explicitly unchanged areas**

      - release inventory verification
  - migration SQL semantics owned by R03
  - service lifecycle internals owned by R06

### BWS120-R08-003 - Backup manifest metadata and row counts are not captured from the pg_dump snapshot

    **Classification:** CONFIRMED_FINDING
    **Severity:** P1
    **Confidence:** HIGH
    **Primary owner:** R08
    **Secondary sectors:** R03, R09, R11
    **Blocks:** release, deployment, BWS-600 evidence, later execution

    **Preconditions**

    - The database changes while backup creation is in progress.

    **Trigger**

    Migration status is queried before pg_dump and table counts are queried after pg_dump using independent sessions.

    **Expected behavior**

    The dump, migration ledger, source identity, and table counts must describe one transactionally consistent database snapshot.

    **Current behavior**

    Migration status, pg_dump, and row counts are three independent observations with no shared snapshot or write exclusion.

    **Impact**

    The manifest can describe rows or a migration ledger that are absent from the dump, or omit rows present in it. Restore verification can then reject a sound dump or accept misleading metadata.

    **Exact evidence**

    - `packages/bootstrap/src/operations/database-lifecycle.ts` `createBwsDatabaseBackup` lines `331-357`, SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. Migration status precedes pg_dump, while row counts follow it, and no exported snapshot identifier is shared.
- `packages/persistence/src/psql.ts` `queryPsqlJsonRows and runPsql` lines `77-91,191-208`, SHA-256 `86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343`. Each metadata query starts an independent psql process/session.
- `docs/037_database_backup_retention_and_recovery.md` `Backup and restore contract` lines `21-40`, SHA-256 `6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10`. The authority requires machine-readable, restorable backup proof with row-count and invariant validation.

    **Independent evidence and reproduction status**

    The inert harness confirmed the three production calls are structurally separate and there is no snapshot token flow.
    Reproduction status: `CONFIRMED_BY_STATIC_TRANSACTION_TRACE; DYNAMIC_CONCURRENT_POSTGRESQL_PROOF_UNAVAILABLE`.

    **Transaction or state-machine analysis**

    The backup transitions through pre-dump metadata, dump, and post-dump metadata without one database snapshot boundary.

    **Root cause**

    Backup metadata is assembled around pg_dump rather than from the same exported or locked snapshot.

    **Minimal fix boundary**

    Capture dump and metadata from one database snapshot or an equivalent write-quiesced boundary, record the snapshot identity, and bind all manifest values to it.

    **Required tests**

      - Mutate rows concurrently during backup and prove dump and manifest counts remain consistent.
  - Apply a migration concurrently and prove backup either blocks or records one exact ledger.
  - Restore the produced backup and require exact manifest parity.

    **Regression risks**

      - Snapshot coordination may require PostgreSQL-specific session ownership and can increase backup duration.

    **Aliases or dependencies:** BWS116-R03-004, BWS116-R03-HO-002

    **Explicitly unchanged areas**

      - surebet-only dump scope
  - checksum generation
  - retention behavior

### BWS120-R08-004 - Backup replacement deletes the previous verified backup before the new publication commits

    **Classification:** CONFIRMED_FINDING
    **Severity:** P1
    **Confidence:** HIGH
    **Primary owner:** R08
    **Secondary sectors:** R09, R11, R24
    **Blocks:** release, deployment, BWS-600 evidence, later execution

    **Preconditions**

    - A prior verified backup exists at the selected destination.
- Overwrite intent is present.

    **Trigger**

    The replacement branch removes the old directory and is interrupted or fails before rename completes.

    **Expected behavior**

    The old verified backup must remain recoverable until the replacement has been durably published.

    **Current behavior**

    The old directory is recursively removed before renameSync publishes the staged directory. The catch block cleans only the staging directory.

    **Impact**

    A publication failure or process interruption in the replacement window can leave neither the old verified backup nor the new published backup.

    **Exact evidence**

    - `packages/bootstrap/src/operations/database-lifecycle.ts` `createBwsDatabaseBackup` lines `322-385`, SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. The previous output is removed at lines 370-372 before the publication rename at line 373.
- `docs/037_database_backup_retention_and_recovery.md` `Backup and recovery contract` lines `21-31,56-58`, SHA-256 `6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10`. The authority requires atomic publication and interrupted-backup recovery evidence.

    **Independent evidence and reproduction status**

    Static transition ordering proves the loss window. No destructive interruption was executed.
    Reproduction status: `CONFIRMED_BY_STATIC_PUBLICATION_ORDER_TRACE`.

    **Transaction or state-machine analysis**

    The replacement state machine has a gap between retiring the current backup and committing the next backup, with no rollback pointer or recovery journal.

    **Root cause**

    Replacement is implemented as delete-then-rename rather than versioned publication or an atomic commit that preserves the predecessor.

    **Minimal fix boundary**

    Publish to a new immutable version, durably validate it, switch an authoritative pointer atomically, and retire the predecessor only after commit. Add bounded reconciliation for abandoned staging directories.

    **Required tests**

      - Inject failure after staging and before publication and prove the predecessor remains valid.
  - Inject failure after pointer switch and prove one complete version remains authoritative.
  - Reconcile abandoned staging directories without touching unrelated paths.

    **Regression risks**

      - Versioned publication requires explicit retention for old backup versions and additional disk headroom.

    **Aliases or dependencies:** BWS116-R03-HO-002

    **Explicitly unchanged areas**

      - dump contents
  - source database identity format
  - restore target behavior

### BWS120-R08-005 - Migration status reports compatibility without evaluating PostgreSQL server-version compatibility

    **Classification:** CONFIRMED_FINDING
    **Severity:** P1
    **Confidence:** HIGH
    **Primary owner:** R08
    **Secondary sectors:** R03, R09, R11
    **Blocks:** release, deployment, BWS-600 evidence, later execution

    **Preconditions**

    - The target PostgreSQL server version is unsupported or outside the accepted compatibility policy.

    **Trigger**

    Migration status is evaluated.

    **Expected behavior**

    Compatibility must include an explicit supported server-version policy and reject unknown or unsupported versions.

    **Current behavior**

    The server version and numeric version are recorded, but compatibility reasons are derived only from checksum mismatches and schema existence.

    **Impact**

    Migration, backup, restore, upgrade, and acceptance gates can classify an unsupported PostgreSQL target as compatible.

    **Exact evidence**

    - `packages/bootstrap/src/operations/database-lifecycle.ts` `getBwsDatabaseMigrationStatus` lines `262-308`, SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. Compatibility reasons do not inspect database.serverVersion or serverVersionNum.
- `packages/bootstrap/src/operations/database-lifecycle.ts` `queryDatabaseIdentity` lines `1158-1187`, SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. Server version data is collected but remains informational.
- `docs/037_database_backup_retention_and_recovery.md` `Migration status contract` lines `9-19`, SHA-256 `6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10`. The contract explicitly requires database/server-version compatibility.

    **Independent evidence and reproduction status**

    Direct source comparison between the collected identity fields and compatibility-reason construction confirms the missing decision branch.
    Reproduction status: `CONFIRMED_BY_STATIC_DECISION_TRACE; MULTI_VERSION_POSTGRESQL_MATRIX_UNAVAILABLE`.

    **Transaction or state-machine analysis**

    All downstream gates inherit a compatible status that lacks one required compatibility dimension.

    **Root cause**

    Server version is modeled as evidence but not as an authority input to compatibility.

    **Minimal fix boundary**

    Define the accepted PostgreSQL version range, validate numeric version fail closed, include the decision in status evidence, and require the same version binding at plan/apply and restore verification.

    **Required tests**

      - Supported major/minor version is compatible.
  - Unsupported, malformed, and unknown numeric versions are incompatible.
  - Upgrade apply rejects server-version drift after planning.

    **Regression risks**

      - Existing environments outside the newly explicit support range will become blocked until formally accepted.

    **Aliases or dependencies:** BWS116-R03-HO-002

    **Explicitly unchanged areas**

      - migration checksums
  - schema existence check
  - migration ordering

### BWS120-R08-006 - Restore verification does not bind manifest semantics to the exact restored database state

    **Classification:** CONFIRMED_FINDING
    **Severity:** P1
    **Confidence:** HIGH
    **Primary owner:** R08
    **Secondary sectors:** R03, R09, R11
    **Blocks:** release, deployment, BWS-600 evidence, later execution

    **Preconditions**

    - A checksummed backup bundle contains a malformed, incomplete, or mismatched manifest relative to its dump.

    **Trigger**

    Restore verification reads the manifest and validates the restored database.

    **Expected behavior**

    The manifest must be fully schema validated and the restored database must match its exact database identity, migration ledger, complete table set, row counts, and invariants.

    **Current behavior**

    Manifest validation checks only the schema tag and that rowCounts is an array. Restore requires general migration compatibility and no pending migrations but does not compare the manifest ledger or source identity to the restored state. Row-count comparison checks only manifest-listed tables and ignores unexpected restored tables.

    **Impact**

    A self-consistent checksum file can still certify a semantically mismatched manifest/dump pair or incomplete restored-state proof.

    **Exact evidence**

    - `packages/bootstrap/src/operations/database-lifecycle.ts` `readAndValidateBackupManifest` lines `1004-1018`, SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. The parsed object is cast after two shallow checks.
- `packages/bootstrap/src/operations/database-lifecycle.ts` `verifyBwsDatabaseRestore` lines `389-458`, SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. Restored migration status and row counts are collected, but exact manifest-to-restored ledger and identity parity is not asserted.
- `packages/bootstrap/src/operations/database-lifecycle.ts` `assertRowCountsMatch` lines `1323-1336`, SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. The comparison iterates expected rows only and does not reject extra restored tables.
- `docs/037_database_backup_retention_and_recovery.md` `Restore verification contract` lines `33-42`, SHA-256 `6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10`. The contract requires migrations, row counts, checksums, invariants, and read-only API proof.

    **Independent evidence and reproduction status**

    Static field-flow tracing confirmed that manifest.database and manifest.migrationLedger do not participate in restored-state equality checks.
    Reproduction status: `CONFIRMED_BY_STATIC_DATAFLOW_TRACE; POSTGRESQL_RESTORE_MATRIX_UNAVAILABLE`.

    **Transaction or state-machine analysis**

    Checksum verification authenticates the supplied files as a bundle but the semantic proof does not establish that the manifest truth and restored dump truth are the same state.

    **Root cause**

    The restore verifier treats a typed interface assertion as full validation and uses partial parity checks instead of one canonical restored-state comparison.

    **Minimal fix boundary**

    Apply strict runtime schema validation, record the exact dump/checksum identity, compare exact migration ledger and source/restore identity fields, compare complete expected and actual table sets, and execute explicit invariants.

    **Required tests**

      - Reject missing, extra, wrong-type, malformed, and duplicate manifest fields.
  - Reject manifest/dump migration-ledger mismatch.
  - Reject missing and unexpected surebet tables.
  - Reject source identity mismatch and invariant failure despite matching row counts.

    **Regression risks**

      - Older manifests that were accepted through structural casting may become invalid.

    **Aliases or dependencies:** BWS116-R03-003, BWS116-R03-HO-002

    **Explicitly unchanged areas**

      - checksum algorithm
  - disposable database selection
  - API query semantics owned by R05

### BWS120-R08-007 - Restore verification hard-codes restart success after two loopback API smoke runs

    **Classification:** CONFIRMED_FINDING
    **Severity:** P1
    **Confidence:** HIGH
    **Primary owner:** R08
    **Secondary sectors:** R06, R07, R09, R11
    **Blocks:** release, deployment, BWS-600 evidence, later execution

    **Preconditions**

    - Restore, migration, and basic read-only API queries succeed.

    **Trigger**

    verifyBwsDatabaseRestore returns its receipt.

    **Expected behavior**

    Restart proof must represent actual database, scheduler, worker, and service restart/recovery behavior or remain explicitly unproven.

    **Current behavior**

    The verifier starts and closes two in-process loopback API servers, performs three small read queries per run, then returns serverRestartsVerified=true unconditionally. Downstream preflight and final acceptance trust that boolean.

    **Impact**

    Restore evidence can become green without scheduler/worker restart, durable checkpoint recovery, process replacement, or database restart proof.

    **Exact evidence**

    - `packages/bootstrap/src/operations/database-lifecycle.ts` `verifyBwsDatabaseRestore` lines `431-458`, SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. The restart field is assigned true after two calls to the API smoke helper.
- `packages/bootstrap/src/operations/database-lifecycle.ts` `verifyReadOnlyApiQueries` lines `1228-1300`, SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. The helper creates an in-process loopback HTTP server and performs only three pageSize=1 reads.
- `packages/bootstrap/src/operations/external-runtime-preflight.ts` `validateBackupEvidence` lines `504-527`, SHA-256 `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427`. External preflight accepts the boolean as required restart proof.
- `packages/bootstrap/src/operations/final-local-acceptance.ts` `createBwsFinalLocalAcceptanceRecoveryResult` lines `535-613`, SHA-256 `1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5`. Final local acceptance also treats the boolean as sufficient recovery evidence.
- `docs/037_database_backup_retention_and_recovery.md` `Restore verification contract` lines `33-42`, SHA-256 `6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10`. The authority requires representative scheduler, worker, and restart checks.

    **Independent evidence and reproduction status**

    The inert harness confirmed that the restart flag has no conditional evidence branch after the smoke-query sequence.
    Reproduction status: `CONFIRMED_BY_STATIC_CONTROL_FLOW_TRACE`.

    **Transaction or state-machine analysis**

    The evidence state machine conflates two successful API construction cycles with successful restart and durable recovery of the managed runtime.

    **Root cause**

    A broad acceptance claim is represented by an unconditional boolean rather than typed evidence for each required recovery component.

    **Minimal fix boundary**

    Replace the boolean with explicit, hashed database-restart, scheduler-recovery, worker-recovery, service-restart, and API-read evidence. Require each consumer to validate the detailed receipt and preserve held states when any component is unavailable.

    **Required tests**

      - Database/API smoke passes but scheduler recovery fails and receipt remains blocked.
  - Worker restart loses checkpoint and receipt remains blocked.
  - Service restart evidence is absent or stale and preflight rejects it.
  - All component receipts are bound to the same restored database and source generation.

    **Regression risks**

      - Existing restore receipts containing only serverRestartsVerified will no longer satisfy acceptance.

    **Aliases or dependencies:** BWS118-R06-007, BWS118-R06-008, BWS116-R03-HO-002

    **Explicitly unchanged areas**

      - read-only API query correctness
  - generic service lifecycle implementation
  - provider/runtime external holds

### BWS120-R08-008 - Restore verification receipt is not bound to the exact dump bytes it claims to verify

    **Classification:** CONFIRMED_FINDING
    **Severity:** P1
    **Confidence:** HIGH
    **Primary owner:** R08
    **Secondary sectors:** R07, R09, R11, R24
    **Blocks:** release, deployment, BWS-600 evidence, later execution

    **Preconditions**

    - A restore receipt exists for one dump.
- A different dump is later placed beside the same manifest with a matching updated checksum file.

    **Trigger**

    Release upgrade validates current bundle checksums and compares the old receipt only to the current manifest.

    **Expected behavior**

    A restore receipt must be valid only for the exact dump, manifest, checksum file, and source database snapshot that were restored.

    **Current behavior**

    The receipt includes the manifest but no dump or checksum-file digest. Release verification checks current file checksums, then compares only the receipt manifest fingerprint to the current manifest.

    **Impact**

    A stale restore receipt can be reused for different dump bytes when the manifest remains unchanged, so upgrade and acceptance gates can rely on restore proof for a bundle that was never restored.

    **Exact evidence**

    - `packages/bootstrap/src/operations/database-lifecycle.ts` `BwsVerifyDatabaseRestoreResult` lines `183-195`, SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. The receipt has no dumpSha256, checksum-manifest digest, or complete backup bundle identity.
- `packages/bootstrap/src/operations/database-lifecycle.ts` `verifyBwsDatabaseRestore return` lines `446-458`, SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. The returned receipt binds the manifest object but not the dump bytes.
- `packages/bootstrap/src/operations/release-upgrade.ts` `verifyBackupEvidence` lines `1293-1338`, SHA-256 `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`. Current dump checksums are verified separately, while receipt parity is checked only through backupManifest.
- `docs/043_upgrade_rollback_recovery_implementation_blueprint.md` `Required contracts` lines `18-39`, SHA-256 `46513efa6bd4be9b897a26dae42431a8c0b5438f3f9c44f2a42af70a4dc811a3`. Upgrade evidence is required to bind exact evidence paths and SHA-256 values.

    **Independent evidence and reproduction status**

    The inert harness produced two distinct dump digests, 5eaf819e... and d619da04..., that share one manifest identity under the current receipt comparison model.
    Reproduction status: `CONFIRMED_BY_STATIC_ARTIFACT_BINDING_TRACE_AND_INERT_DIGEST_HARNESS`.

    **Transaction or state-machine analysis**

    Restore verification and later backup verification are separate transactions without one immutable bundle identifier carried across both.

    **Root cause**

    The restore receipt models semantic manifest identity but omits content identity for the dump and checksum manifest.

    **Minimal fix boundary**

    Add one canonical backup-bundle identity containing dump SHA-256, manifest SHA-256, checksum-file SHA-256, source snapshot identity, and schema. Persist it in the restore receipt and require exact equality in every consumer.

    **Required tests**

      - Change only dump bytes and checksum file after restore; upgrade verification must reject the stale receipt.
  - Change only manifest bytes; reject.
  - Change checksum-file bytes without changing referenced digests; reject.
  - Accept only an exact bundle identity produced by the restore run.

    **Regression risks**

      - All existing restore receipts lacking bundle identity must be regenerated.

    **Aliases or dependencies:** BWS116-R03-HO-002

    **Explicitly unchanged areas**

      - SHA-256 algorithm
  - release package identity
  - database row-count semantics

### BWS120-R08-009 - Interrupted restore verification can leave untracked disposable databases

    **Classification:** CONFIRMED_FINDING
    **Severity:** P2
    **Confidence:** HIGH
    **Primary owner:** R08
    **Secondary sectors:** R09, R10, R11
    **Blocks:** release, deployment, BWS-600 evidence, later execution

    **Preconditions**

    - The disposable database has been created.
- The process terminates without executing JavaScript finally cleanup.

    **Trigger**

    Process interruption occurs during restore or verification.

    **Expected behavior**

    Every disposable database must have durable ownership metadata and bounded recovery that can identify and safely remove only abandoned review-owned targets.

    **Current behavior**

    Cleanup exists only in an in-process finally block. The database name is derived from timestamp and PID, and there is no durable registry, owner token, startup reconciliation, or verified leak enumeration.

    **Impact**

    Interrupted verification can leave databases that consume storage, collide with later runs, or create ambiguous cleanup decisions.

    **Exact evidence**

    - `packages/bootstrap/src/operations/database-lifecycle.ts` `verifyBwsDatabaseRestore` lines `389-461`, SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. Database creation precedes verification and cleanup depends on the same process reaching finally.
- `packages/bootstrap/src/operations/database-lifecycle.ts` `buildDisposableRestoreDatabaseName and create/drop` lines `1338-1393`, SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. Ownership is encoded only in a timestamp/PID name and no durable registry is written.
- `docs/037_database_backup_retention_and_recovery.md` `Recovery contract` lines `33-42,56-58`, SHA-256 `6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10`. The authority requires unique disposable databases and interrupted-restore recovery evidence.

    **Independent evidence and reproduction status**

    The inert harness confirmed deterministic name reuse for the same timestamp and PID. No database was created or dropped.
    Reproduction status: `CONFIRMED_BY_STATIC_INTERRUPTION_TRACE; PROCESS_KILL_AND_POSTGRESQL_PROOF_UNAVAILABLE`.

    **Transaction or state-machine analysis**

    The durable resource outlives the process, but its ownership state is not durable. The cleanup transition therefore disappears with the process.

    **Root cause**

    Disposable-resource ownership is process-local rather than persisted and reconciled.

    **Minimal fix boundary**

    Use a strong unique owner token, persist a restore-run registry before creation, tag the database with that run identity, and provide a bounded reconciler that proves ownership before cleanup.

    **Required tests**

      - Terminate verification after create and prove the next bounded reconciliation discovers only the abandoned owned database.
  - Run two verifications with equal injected time and prove unique database identities.
  - Prove reconciliation does not remove non-owned databases.

    **Regression risks**

      - Recovery introduces durable bookkeeping that must itself be retained and reconciled.

    **Aliases or dependencies:** BWS116-R03-HO-002

    **Explicitly unchanged areas**

      - normal finally cleanup
  - restore SQL flags
  - active project database prohibition

### BWS120-R08-010 - Retention plan fingerprints omit target database and schema-generation identity

    **Classification:** CONFIRMED_FINDING
    **Severity:** P1
    **Confidence:** HIGH
    **Primary owner:** R08
    **Secondary sectors:** R10, R11
    **Blocks:** release, deployment, BWS-600 evidence, later execution

    **Preconditions**

    - Two databases or generations expose the same scope, cutoff, maxRows, candidate keys, and recorded timestamps.

    **Trigger**

    A fingerprint generated for one target is supplied to retention apply against another target with the same candidate payload.

    **Expected behavior**

    A destructive retention authorization must bind one exact database, server/cluster identity, schema generation, migration ledger, and candidate snapshot.

    **Current behavior**

    The fingerprint includes only scope, cutoff, maxRows, and candidates. The plan and apply receipts expose no database identity or migration/release generation.

    **Impact**

    A valid plan fingerprint is portable across targets with matching candidate payloads and can authorize pruning on the wrong database.

    **Exact evidence**

    - `packages/bootstrap/src/operations/database-lifecycle.ts` `BwsDatabaseRetentionPlan interfaces` lines `202-237`, SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. Plan and apply records contain no database identity or generation fields.
- `packages/bootstrap/src/operations/database-lifecycle.ts` `plan/applyBwsDatabaseRetention` lines `464-535`, SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. Apply re-plans using current configuration and compares only the portable fingerprint.
- `packages/bootstrap/src/operations/database-lifecycle.ts` `computeRetentionPlanFingerprint` lines `980-1001`, SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. Fingerprint payload contains only candidates, cutoff, maxRows, and scope.
- `packages/bootstrap/src/cli/bws-database-lifecycle.ts` `retention-plan and retention-apply` lines `42-73`, SHA-256 `4e6da6bfca8e7c622ccd04e66d3789b4f4eaf490f93fd8265bfa458d3c22b06a`. The public commands exchange only the portable fingerprint and request fields.

    **Independent evidence and reproduction status**

    The inert harness computed the same fingerprint without any target identity input.
    Reproduction status: `CONFIRMED_BY_STATIC_FINGERPRINT_TRACE_AND_INERT_CANONICALIZATION_HARNESS`.

    **Transaction or state-machine analysis**

    Plan authorization is detached from the database state transition it is intended to authorize.

    **Root cause**

    Retention identity is modeled as a candidate-set digest rather than an operation intent bound to one target generation.

    **Minimal fix boundary**

    Include exact live database identity, accepted server/cluster identifier, migration-ledger fingerprint, schema/release generation, and candidate snapshot transaction identity in the plan and apply receipt. Re-prove all fields before deletion.

    **Required tests**

      - Generate identical candidates on two disposable databases and reject cross-target fingerprint reuse.
  - Change migration ledger after planning and reject apply.
  - Change database host/socket identity while keeping database name and reject apply.

    **Regression risks**

      - Retention plans will become intentionally non-portable and short-lived.

    **Aliases or dependencies:** BWS116-R03-HO-002

    **Explicitly unchanged areas**

      - candidate ordering
  - cutoff parsing
  - scope list

### BWS120-R08-011 - Retention planning and deletion are separate transactions and partial prune is detected only after commit

    **Classification:** CONFIRMED_FINDING
    **Severity:** P1
    **Confidence:** HIGH
    **Primary owner:** R08
    **Secondary sectors:** R03, R11
    **Blocks:** release, deployment, BWS-600 evidence, later execution

    **Preconditions**

    - Candidate eligibility or references change between the plan queries and deletion, or only a subset of keys remains deletable.

    **Trigger**

    Retention apply re-plans, then executes a key-only DELETE through a later psql session.

    **Expected behavior**

    Candidate selection, reference checks, fingerprint verification, and deletion must execute atomically with eligibility predicates reasserted at mutation time. Any mismatch must roll back all deletions.

    **Current behavior**

    Candidate and total counts use separate psql sessions. Apply calls plan again, then performs deletion in another session using only primary keys. A count mismatch is raised after the DELETE statement has committed.

    **Impact**

    Rows can be deleted after becoming referenced, and a partial deletion can be reported as an error even though irreversible pruning already occurred.

    **Exact evidence**

    - `packages/bootstrap/src/operations/database-lifecycle.ts` `plan/applyBwsDatabaseRetention` lines `464-535`, SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. Planning, total count, and deletion are separate query calls; the mismatch check occurs after the deletion result returns.
- `packages/bootstrap/src/operations/database-lifecycle.ts` `buildRetentionDeleteSql` lines `854-952`, SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. Deletion predicates match candidate keys only and do not reassert cutoff, rank, terminal state, or reference safety.
- `packages/persistence/src/psql.ts` `queryPsqlJsonRows and runPsql` lines `77-91,191-208`, SHA-256 `86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343`. Each call executes in a separate psql process and transaction.
- `docs/037_database_backup_retention_and_recovery.md` `Retention and recovery contract` lines `44-58`, SHA-256 `6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10`. The authority requires reference preservation and partial-prune recovery.

    **Independent evidence and reproduction status**

    The inert harness confirmed distinct plan and delete call sites. No database mutation was performed.
    Reproduction status: `CONFIRMED_BY_STATIC_TRANSACTION_TRACE; CONCURRENT_POSTGRESQL_PROOF_UNAVAILABLE`.

    **Transaction or state-machine analysis**

    The authorization snapshot and effect are not one serializable transition. Post-effect validation cannot restore rows if the transition was partial or stale.

    **Root cause**

    Retention is composed from independent command invocations rather than one database transaction with mutation-time predicates and rollback.

    **Minimal fix boundary**

    Execute target validation, candidate selection, reference checks, exact count, and DELETE in one explicit transaction at an accepted isolation level. Reassert every eligibility predicate in the DELETE and roll back on any mismatch.

    **Required tests**

      - Insert a new reference between planning and apply and prove no row is deleted.
  - Delete or alter one candidate before apply and prove the whole transaction rolls back.
  - Run concurrent applies with the same plan and prove at most one commits with truthful receipts.
  - Force an error after the first internal mutation and prove zero committed deletions.

    **Regression risks**

      - Longer transactions can increase lock duration and require bounded batches.

    **Aliases or dependencies:** BWS116-R03-007, BWS116-R03-HO-002

    **Explicitly unchanged areas**

      - pure candidate ordering
  - retention scope taxonomy
  - generic psql timeout defect owned by BWS116-R03-005

### BWS120-R08-012 - Retention can prune provenance rows still required by retained blocked or terminal parent state

    **Classification:** CONFIRMED_FINDING
    **Severity:** P1
    **Confidence:** HIGH
    **Primary owner:** R08
    **Secondary sectors:** R03, R05, R07, R11
    **Blocks:** release, deployment, BWS-600 evidence, later execution

    **Preconditions**

    - A retained worker job, scheduler checkpoint, or blocked runtime cycle is older than the cutoff.
- No accepted_local_evidence strategy-ledger row exists for that blocked or dead-lettered cycle.

    **Trigger**

    Retention selects old worker checkpoints, dead letters, scheduler checkpoints, or upstream API checkpoints using only accepted-ledger protection and then deletes by key.

    **Expected behavior**

    All provenance required to reconstruct any retained parent, terminal blocked cycle, active investigation, or API-visible state must remain referenced and undeletable.

    **Current behavior**

    Candidate queries protect accepted ledger rows but not retained blocked/dead-lettered parent states. Worker jobs retain last-checkpoint fields without a foreign key to checkpoint rows, scheduler checkpoints retain upstream checkpoint IDs as unqualified text, and the API requires those child/provenance rows to reconstruct blocked cycles.

    **Impact**

    Retention can leave retained jobs or scheduler state whose required checkpoint, dead-letter, or upstream provenance is gone. The read-only API then reports provenance-missing or dead-letter-missing blockers for previously reconstructable cycles.

    **Exact evidence**

    - `packages/bootstrap/src/operations/database-lifecycle.ts` `buildRetentionPlanQuery` lines `600-808`, SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. Checkpoint and dead-letter protection is based on accepted strategy-ledger rows, excluding blocked/dead-lettered cycles that intentionally lack such rows.
- `packages/bootstrap/src/operations/database-lifecycle.ts` `buildRetentionDeleteSql` lines `854-952`, SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. Deletion removes child rows by key without checking retained parents or current API reconstruction requirements.
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `buildPrivatePaperRuntimeCycleItem` lines `853-1007`, SHA-256 `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`. Runtime cycle reconstruction requires scheduler, upstream API checkpoint, worker job, dead-letter, and recent checkpoint provenance.
- `database/migrations/surebet/004_create_worker_jobs.sql` `worker_jobs/checkpoints/dead_letters` lines `1-153`, SHA-256 `9756445dbfbdac6226413098d1253527578d9420543287842c30d034df162b9c`. Parent jobs retain checkpoint identity fields; child rows reference the parent, but parent fields do not preserve the child row through a reverse foreign key.
- `database/migrations/surebet/006_create_upstream_api_convergence_checkpoints.sql` `upstream_api_convergence_checkpoints` lines `1-31`, SHA-256 `3d5ac1c0f2d89aac08acb057668b87b2e9116f274ff78020568dc82522f270f7`. The upstream checkpoint can be referenced by later scheduler state.
- `database/migrations/surebet/007_create_private_paper_runtime_scheduler_checkpoints.sql` `private_paper_runtime_scheduler_checkpoints` lines `1-25`, SHA-256 `b0ec918132e247f3265145787e3bf9b30320ae2c415937c0578d373e5ec8be57`. upstream_checkpoint_id is retained as text without a foreign-key protection edge.
- `docs/037_database_backup_retention_and_recovery.md` `Retention contract` lines `44-54`, SHA-256 `6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10`. Retention must preserve accepted runtime cycles and active investigations; blocked terminal evidence is also required by current API semantics.

    **Independent evidence and reproduction status**

    Static join analysis proves that a dead-lettered blocked cycle has no accepted ledger row, can therefore qualify for child-row deletion, while the API still requires its dead-letter and checkpoint records.
    Reproduction status: `CONFIRMED_BY_STATIC_REFERENCE_GRAPH_AND_QUERY_TRACE; POSTGRESQL_MUTATION_PROOF_UNAVAILABLE`.

    **Transaction or state-machine analysis**

    Retention treats accepted success evidence as the only durable-reference authority, but terminal blocked state is also retained and reconstructable. The child deletion transition breaks that parent state.

    **Root cause**

    The retention authority map is incomplete and is not derived from the full persisted/API reference graph for all terminal states.

    **Minimal fix boundary**

    Define one canonical retention reference graph covering success, blocked, dead-lettered, investigation, settlement, and active runtime states. Encode protective foreign keys or mutation-time NOT EXISTS checks and require post-plan reference parity before deletion.

    **Required tests**

      - Retain a dead-lettered blocked cycle and prove its dead-letter and required checkpoints are not candidates.
  - Retain a scheduler checkpoint and prove its upstream API checkpoint cannot be pruned.
  - Exercise all six retention scopes against success, blocked, active-investigation, and unreferenced fixtures.
  - Prove API reconstruction remains identical before and after allowed pruning.

    **Regression risks**

      - More evidence will be retained; storage budgets and higher-level artifact retention need recalculation.

    **Aliases or dependencies:** BWS116-R03-013 (import-run manifestation remains inherited and is not duplicated), BWS116-R03-HO-002

    **Explicitly unchanged areas**

      - import-run convergence reference root cause owned by BWS116-R03-013
  - API projection formatting
  - strategy acceptance semantics

## Hypotheses and external blockers

### Hypotheses

- `BWS120-R08-HYP-001`: The current database identity may be insufficient to distinguish replacement clusters that expose the same connection tuple. This requires an accepted deployment identity policy before confirmation.
- `BWS120-R08-HYP-002`: `COUNT(*)::int` can become unavailable at extreme cardinality. This was not dynamically reproduced.

### Environment and external blockers

- `BWS120-R08-ENV-001`: Canonical Node 20.20.2 was unavailable. Node 22.16.0 evidence is supplementary.
- `BWS120-R08-ENV-002`: PostgreSQL utilities and a safe disposable PostgreSQL server were unavailable.
- `BWS120-R08-ENV-003`: Clean TypeScript compilation and focused Node tests could not run without installing absent dependencies.
- `BWS120-R08-EXT-001`: Accepted BWS-600 and BWS-710 external runtime inputs remain unavailable and held.

## Intentional safeguards

- `pg_dump` is explicitly constrained to `--schema=surebet`.
- Backup checksums are verified before a disposable database is created.
- Restore uses a disposable database with `--no-owner` and `--no-privileges`.
- Retention apply requires explicit scope, cutoff, maximum rows, and a plan fingerprint.
- Repository validators for no-provider and no-execution boundaries passed.

## Rejected suspicions

- Restore verification does not directly target the active project database.
- Backup content checksums are present and verified.
- Retention apply cannot be invoked through the reviewed CLI without a plan fingerprint.
- PostgreSQL utilities are invoked through `execFileSync` argument arrays, not a command shell. The inherited missing-timeout defect remains separate.

## Cross-area handoffs

- **R03:** Preserve all `BWS116-R03-001` through `BWS116-R03-017` identities. R08 depends on their migration, psql, transaction, bounded-read, and reference semantics.
- **R06:** Generic restart, drain, shutdown, and child-process ownership remain R06-owned. R08 requires truthful typed evidence from those paths.
- **R07:** Immutable publication and indexing of backup, restore, and retention receipts remains R07-owned.
- **R09:** The current `backup_interruption` soak case is an artifact-marker exercise, and cleanup reports zero leaked databases without enumeration. Real bounded failure injection belongs to R09.
- **R10:** CLI/environment precedence, approved backup roots, encryption/permission policy, and secret handling remain R10-owned and were not expanded into cybersecurity findings here.
- **R11:** Aggregate assurance, focused-test false greens, and `KNOWN_BASELINE_MANIFEST_DRIFT` remain R11-owned.

## Test gaps

- `BWS120-R08-TG-001` (P1): No safe-root or predecessor-preservation test for backup overwrite.
- `BWS120-R08-TG-002` (P1): No concurrent-write test proving dump and manifest share one snapshot.
- `BWS120-R08-TG-003` (P0): No plan/apply environment or database-target drift test.
- `BWS120-R08-TG-004` (P1): No strict malformed-manifest, exact-ledger, or exact-table-set restore test.
- `BWS120-R08-TG-005` (P1): No real scheduler, worker, database, and service restart recovery proof.
- `BWS120-R08-TG-006` (P1): No stale restore receipt versus changed dump test.
- `BWS120-R08-TG-007` (P2): No interrupted-process orphaned disposable database reconciliation test.
- `BWS120-R08-TG-008` (P1): No cross-database retention fingerprint reuse test.
- `BWS120-R08-TG-009` (P1): No concurrent reference change, partial delete, or double-apply transaction test.
- `BWS120-R08-TG-010` (P1): Only import_runs retention is integration-tested; the other five scopes and blocked-cycle graph are unproved.
- `BWS120-R08-TG-011` (P1): No supported and unsupported PostgreSQL server-version compatibility matrix.

The only PostgreSQL integration test in `tests/bws-database-lifecycle.test.ts` is skipped unless both configuration and utilities are present. It exercises only the `import_runs` retention scope. `tests/bws-release-upgrade.test.ts` creates synthetic restore evidence with empty API checks and sets `serverRestartsVerified: true`, so it cannot prove the production recovery contract.

## Prioritized review-only remediation order

1. Close destructive target authority first: `BWS120-R08-001` and `BWS120-R08-002`.
2. Establish one immutable backup transaction and publication identity: `BWS120-R08-003`, `-004`, and `-008`.
3. Make migration and restore evidence truthful and exact: `BWS120-R08-005`, `-006`, `-007`, and `-009`.
4. Bind retention to one target transaction and complete reference graph: `BWS120-R08-010`, `-011`, and `-012`.
5. Re-run focused and full validation under Node 20.20.2 with a disposable PostgreSQL environment.
6. Only after those source fixes, execute R09 failure-injection proof and R07/R11 evidence and assurance closure.

This order is research guidance only. No implementation, overlay, controller command, or server command is included.

## Explicit unchanged areas

- No application source, tests, migrations, documentation, configuration, manifests, or archives were edited.
- No dependency was installed or updated.
- No service, controller, worker, scheduler, API server, or automation parent was started.
- No provider, upstream API, account, credential, signer, external database, or persistent BWS database was contacted.
- No `betting-win` checkout was accessed or modified.
- No live operation, order, settlement, payment, withdrawal, or public signal was constructed.
- R01 upstream semantics, R02 mathematics, R03 durable source semantics, R04 simulation, R05 API/cockpit, and R06 lifecycle remain under their inherited owners.

## Completion and limitations

- Coverage reconciles exactly `695` archive members.
- Every R08 primary production path, material consumer, focused test, authority document, and inherited R03/R06 overlap was statically traced.
- The source tree remained byte-identical to its initial extracted inventory.
- Static validators passed except the known stale source manifest. TypeScript compilation was unavailable because dependencies were absent.
- PostgreSQL-specific transaction, interruption, and recovery behavior remains dynamically unexecuted and is explicitly recorded in validation.
