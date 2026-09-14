
# BWS-W4-T37 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W4-T37
CAMPAIGN_ORDER: 2
STAGE: S1
PRIMARY_OWNER: R10
SECONDARY_REVIEWERS: R03, R06, R07, R08, R09, R11
ISSUE_IDS: BWS121-R10-001, BWS121-R10-002, BWS121-R10-003, BWS121-R10-008
SEVERITY_COUNTS: {"P1": 4}
DEPENDENCIES: T39
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen review/finding baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; active campaign authority is pinned by activation/immutable-authority.sha256; exact current numbered archive or checkout, extracted-tree digest, Git identity, source paths, hashes, and modes must be captured in an external audit or admission receipt and reverified before editing; repository documentation does not self-attest a rolling numbered ZIP
CURRENT_SOURCE_PATH_CANDIDATES: packages/bootstrap/src/operations/database-lifecycle.ts, packages/bootstrap/src/operations/operator-lifecycle.ts, packages/persistence/src/psql.ts, scripts/bws-root-wrapper-runtime.mjs, scripts/validate_bws_loopback_acceptance.mjs
SYMBOLS_TO_REVERIFY: 8 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: packages/bootstrap/src/operations/database-lifecycle.ts, packages/bootstrap/src/operations/operator-lifecycle.ts, packages/persistence/src/psql.ts, scripts/bws-root-wrapper-runtime.mjs
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites `all upstream tranches referenced by the affected findings; current-source re-verification before implementation`
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 16 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 16 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 6 classified records below
CONCURRENCY_OR_CRASH_TESTS: 0 classified records below
ENVIRONMENT_PROOF: {"AS_SPECIFIED_BY_REVIEW": 16}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: Bounded effective configuration, explicit source precedence, blank-value preservation, and scrubbed libpq authority.
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": true, "bws_710": true, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W4-T38 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `packages/bootstrap/src/operations/database-lifecycle.ts` | present=yes | sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/operator-lifecycle.ts` | present=yes | sha256=704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/persistence/src/psql.ts` | present=yes | sha256=86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `scripts/bws-root-wrapper-runtime.mjs` | present=yes | sha256=1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `scripts/validate_bws_loopback_acceptance.mjs` | present=yes | sha256=1624933a115da5e14c687b95913d7de272bfddf528039fb90acdb502087d1c50 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS121-R10-001 | `scripts/bws-root-wrapper-runtime.mjs` | symbol=resolveRuntimeEnvironment / runCommand | reviewed_line_range=L227-L259; L670-L675 | reviewed_sha256=1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8
- BWS121-R10-001 | `packages/bootstrap/src/operations/operator-lifecycle.ts` | symbol=createLifecycleContext | reviewed_line_range=L351-L369 | reviewed_sha256=704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- BWS121-R10-001 | `scripts/validate_bws_loopback_acceptance.mjs` | symbol=resolveEnvironment | reviewed_line_range=L87-L97 | reviewed_sha256=1624933a115da5e14c687b95913d7de272bfddf528039fb90acdb502087d1c50
- BWS121-R10-002 | `scripts/bws-root-wrapper-runtime.mjs` | symbol=resolveCanonicalPostgresEnvironment | reviewed_line_range=L270-L299 | reviewed_sha256=1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8
- BWS121-R10-002 | `scripts/validate_bws_loopback_acceptance.mjs` | symbol=readPostgresEnvironment | reviewed_line_range=L145-L169 | reviewed_sha256=1624933a115da5e14c687b95913d7de272bfddf528039fb90acdb502087d1c50
- BWS121-R10-003 | `scripts/bws-root-wrapper-runtime.mjs` | symbol=resolveRuntimeEnvironment / readSelectedEnvFile / readProcessValue | reviewed_line_range=L227-L245; L683-L734 | reviewed_sha256=1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8
- BWS121-R10-008 | `packages/persistence/src/psql.ts` | symbol=runPsql | reviewed_line_range=L191-L217 | reviewed_sha256=86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343
- BWS121-R10-008 | `packages/bootstrap/src/operations/database-lifecycle.ts` | symbol=runUtilityCommand | reviewed_line_range=L1412-L1435 | reviewed_sha256=b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS121-R10-001 — Managed runtime children inherit the entire ambient process environment instead of a bounded effective configuration

- Severity: `P1`
- Current behavior: The root wrapper begins with `{ ...process.env }`, the lifecycle context spreads `process.env` again, and loopback acceptance does the same. Selective `.env` loading therefore does not make child configuration selective: every ambient variable remains available to npm builds and managed children.
- Expected behavior: A safety-critical wrapper must construct an explicit child environment from approved keys plus a minimal documented operating-system runtime set, reject or scrub behavior-changing ambient variables, and bind the resulting effective configuration to evidence.
- Invariant: A safety-critical wrapper must construct an explicit child environment from approved keys plus a minimal documented operating-system runtime set, reject or scrub behavior-changing ambient variables, and bind the resulting effective configuration to evidence.
- Root cause: The implementation applies an allowlist only to values read from `.env`, while treating the complete parent process environment as trusted configuration and secret context.
- Trigger: Start, stop, build, observe, or validate the managed runtime while those variables are present in the parent process environment.
- Minimal fix boundary: Introduce one repository-owned effective-environment builder per child class. Start from a documented allowlist, add only required platform variables, explicitly reject or remove Node/proxy/Git/libpq control variables unless owned by that child, and emit a secret-safe digest of the exact effective configuration. Keep the fixed paper/provider/execution invariants unchanged.
- Regression risks:
- Over-scrubbing PATH, HOME, locale, temporary-directory, or certificate variables required by Node/npm/PostgreSQL.
- Divergence between start, stop, status, acceptance, and test environment builders.

### BWS121-R10-002 — The root runtime wrapper assembles one PostgreSQL tuple from mixed process and .env sources

- Severity: `P1`
- Current behavior: The root wrapper resolves each POSTGRES_* key independently using `process ?? file`, creating a hybrid tuple. The loopback-acceptance validator instead chooses the process source atomically whenever any process field exists and rejects a partial tuple.
- Expected behavior: The PostgreSQL connection tuple must be atomic: exactly one complete source must win, partial process tuples must fail closed, and validation and runtime startup must resolve the same values.
- Invariant: The PostgreSQL connection tuple must be atomic: exactly one complete source must win, partial process tuples must fail closed, and validation and runtime startup must resolve the same values.
- Root cause: No single typed effective-configuration resolver owns PostgreSQL source selection across wrappers and validators.
- Trigger: Run the root lifecycle or paper-evidence wrapper with a partial process tuple.
- Minimal fix boundary: Centralize canonical POSTGRES_* resolution. Reject partial tuples in every source, select one complete source using one documented precedence rule, preserve source metadata in a protected receipt, and reuse the resolver in lifecycle, acceptance, release, and validation entrypoints.
- Regression risks:
- Breaking operators that currently rely on mixed-source tuples.
- Accidentally exposing the password in the source receipt.

### BWS121-R10-003 — Explicit blank runtime values are converted to absence and silently replaced by file values or defaults

- Severity: `P1`
- Current behavior: `readProcessValue` trims and returns undefined for blank values. The resolver then fills from `.env` or a repository default. A quoted empty file value is accepted by the parser and then also appears absent to the defaulting pass.
- Expected behavior: Missing and explicit blank must remain distinct. A present blank value for a typed runtime field must fail validation rather than silently activate another source or a built-in default.
- Invariant: Missing and explicit blank must remain distinct. A present blank value for a typed runtime field must fail validation rather than silently activate another source or a built-in default.
- Root cause: The resolver uses absence as both “not supplied” and “supplied but invalid,” erasing source and validity state before typed validation.
- Trigger: Resolve the root runtime environment.
- Minimal fix boundary: Parse each source into explicit states (`missing`, `present_valid`, `present_blank`, `present_invalid`). Fail on blank/invalid values in the highest-precedence source and apply defaults only to genuinely missing fields.
- Regression risks:
- Some existing shell profiles may contain blank optional variables and begin failing.
- Optional fields need a deliberate unset mechanism distinct from an empty string.

### BWS121-R10-008 — PostgreSQL subprocesses inherit ambient libpq control variables

- Severity: `P1`
- Current behavior: Both helpers pass `process.env` wholesale and only optionally overwrite PGPASSWORD. Explicit `-d/-U/-p/-h` arguments bind the main target tuple, but other authentication, TLS, service, and session controls remain ambient.
- Expected behavior: Database subprocesses must receive a minimal explicit environment consistent with the validated persistence tuple and security policy; unsupported ambient libpq controls must be removed or explicitly validated and receipt-bound.
- Invariant: Database subprocesses must receive a minimal explicit environment consistent with the validated persistence tuple and security policy; unsupported ambient libpq controls must be removed or explicitly validated and receipt-bound.
- Root cause: Persistence configuration validates explicit fields but subprocess construction does not make those fields the complete authority for libpq behavior.
- Trigger: Run migrations, repository SQL, backup, restore, or database lifecycle utilities.
- Minimal fix boundary: Construct a minimal subprocess environment; set only deliberate locale/PATH/temp variables plus the approved password transport; reject or explicitly map each supported PG* variable; bind the resulting policy to database and release evidence.
- Regression risks:
- Removing certificate or Kerberos variables may break legitimate deployments unless explicitly modeled.
- PATH/locale/temp variables still need a constrained cross-platform policy.


## Allowed edit boundary

- Candidate path set: `packages/bootstrap/src/operations/database-lifecycle.ts`, `packages/bootstrap/src/operations/operator-lifecycle.ts`, `packages/persistence/src/psql.ts`, `scripts/bws-root-wrapper-runtime.mjs`, `scripts/validate_bws_loopback_acceptance.mjs`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `packages/bootstrap/src/operations/database-lifecycle.ts` | participating tranches=T09, T13, T30, T31, T32, T37 | predecessor postimage required
- `packages/bootstrap/src/operations/operator-lifecycle.ts` | participating tranches=T21, T22, T23, T24, T25, T37 | predecessor postimage required
- `packages/persistence/src/psql.ts` | participating tranches=T01, T11, T30, T32, T37 | predecessor postimage required
- `scripts/bws-root-wrapper-runtime.mjs` | participating tranches=T21, T22, T23, T25, T37, T38 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- BWS-600 remains BLOCKED_EXTERNAL_RUNTIME_EVIDENCE, BWS-710 remains blocked on an accepted upstream runtime resource, and BWS-900 remains parked.
- No controller, scheduler, worker, API, lifecycle service, release apply, database command, Git pull, Git push, or live operation was started.
- No provider, external API, deployed service, account, credential, wallet, signer, or persistent database was contacted.
- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- all betting-win source, checkout, documentation, service, database, and runtime
- betting-win; live execution; current BWS-600/BWS-710/BWS-900 holds
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T39.
- Review prerequisites: all upstream tranches referenced by the affected findings; current-source re-verification before implementation.
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

- `BWS121-R10-REQ-001` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-001 | requirement=Ambient unrelated token and credential variables are absent from build and managed child environments.
- `BWS121-R10-REQ-002` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-001 | requirement=NODE_OPTIONS/NODE_PATH and proxy variables are rejected or stripped according to an explicit policy.
- `BWS121-R10-REQ-003` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-001 | requirement=Required PATH, HOME, locale, and approved BWS variables remain available.
- `BWS121-R10-REQ-004` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-001 | requirement=The configuration receipt changes when any approved effective value or source changes and never contains plaintext secrets.
- `BWS121-R10-REQ-005` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-002 | requirement=Complete process tuple wins as one unit.
- `BWS121-R10-REQ-006` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-002 | requirement=Complete `.env` tuple is accepted only when no process tuple key is present.
- `BWS121-R10-REQ-007` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-002 | requirement=Every partial process and partial file tuple fails before build, database, or lifecycle work.
- `BWS121-R10-REQ-008` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-002 | requirement=Root wrapper and loopback-acceptance validator produce byte-equivalent effective tuples for the same inputs.
- `BWS121-R10-REQ-009` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-003 | requirement=Whitespace-only process value rejects.
- `BWS121-R10-REQ-010` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-003 | requirement=Quoted empty `.env` value rejects.
- `BWS121-R10-REQ-011` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-003 | requirement=Zero and false-like strings remain valid or invalid according to each field type rather than generic truthiness.
- `BWS121-R10-REQ-012` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-003 | requirement=Source-state metadata is present in the effective configuration receipt.
- `BWS121-R10-REQ-030` | category=persistence_or_migration | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-008 | requirement=Ambient PGOPTIONS, PGSERVICE, PGPASSFILE, PGSSLMODE, and PGSSLROOTCERT are rejected or absent in a fake psql child.
- `BWS121-R10-REQ-031` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-008 | requirement=Explicit approved password transport remains available without argv leakage.
- `BWS121-R10-REQ-032` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-008 | requirement=Backup, restore, migration, and repository paths share one environment builder.
- `BWS121-R10-REQ-033` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-008 | requirement=Disposable PostgreSQL test verifies intended TLS/session/target behavior under canonical Node 20.

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS121-R10-REQ-001` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-001 | requirement=Ambient unrelated token and credential variables are absent from build and managed child environments.
- `BWS121-R10-REQ-002` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-001 | requirement=NODE_OPTIONS/NODE_PATH and proxy variables are rejected or stripped according to an explicit policy.
- `BWS121-R10-REQ-003` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-001 | requirement=Required PATH, HOME, locale, and approved BWS variables remain available.
- `BWS121-R10-REQ-004` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-001 | requirement=The configuration receipt changes when any approved effective value or source changes and never contains plaintext secrets.
- `BWS121-R10-REQ-005` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-002 | requirement=Complete process tuple wins as one unit.
- `BWS121-R10-REQ-006` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-002 | requirement=Complete `.env` tuple is accepted only when no process tuple key is present.
- `BWS121-R10-REQ-007` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-002 | requirement=Every partial process and partial file tuple fails before build, database, or lifecycle work.
- `BWS121-R10-REQ-008` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-002 | requirement=Root wrapper and loopback-acceptance validator produce byte-equivalent effective tuples for the same inputs.
- `BWS121-R10-REQ-009` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-003 | requirement=Whitespace-only process value rejects.
- `BWS121-R10-REQ-010` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-003 | requirement=Quoted empty `.env` value rejects.
- `BWS121-R10-REQ-011` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-003 | requirement=Zero and false-like strings remain valid or invalid according to each field type rather than generic truthiness.
- `BWS121-R10-REQ-012` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-003 | requirement=Source-state metadata is present in the effective configuration receipt.
- `BWS121-R10-REQ-030` | category=persistence_or_migration | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-008 | requirement=Ambient PGOPTIONS, PGSERVICE, PGPASSFILE, PGSSLMODE, and PGSSLROOTCERT are rejected or absent in a fake psql child.
- `BWS121-R10-REQ-031` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-008 | requirement=Explicit approved password transport remains available without argv leakage.
- `BWS121-R10-REQ-032` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-008 | requirement=Backup, restore, migration, and repository paths share one environment builder.
- `BWS121-R10-REQ-033` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-008 | requirement=Disposable PostgreSQL test verifies intended TLS/session/target behavior under canonical Node 20.

## Negative and adversarial tests

- `BWS121-R10-REQ-001` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-001 | requirement=Ambient unrelated token and credential variables are absent from build and managed child environments.
- `BWS121-R10-REQ-002` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-001 | requirement=NODE_OPTIONS/NODE_PATH and proxy variables are rejected or stripped according to an explicit policy.
- `BWS121-R10-REQ-003` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-001 | requirement=Required PATH, HOME, locale, and approved BWS variables remain available.
- `BWS121-R10-REQ-004` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-001 | requirement=The configuration receipt changes when any approved effective value or source changes and never contains plaintext secrets.
- `BWS121-R10-REQ-011` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-003 | requirement=Zero and false-like strings remain valid or invalid according to each field type rather than generic truthiness.
- `BWS121-R10-REQ-032` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-008 | requirement=Backup, restore, migration, and repository paths share one environment builder.

## Concurrency, cancellation, crash, and restart tests

- No separately classified record

## Environment proof

- AS_SPECIFIED_BY_REVIEW: 16 requirements

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

Acceptance authority: Bounded effective configuration, explicit source precedence, blank-value preservation, and scrubbed libpq authority.

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W4-T38` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
