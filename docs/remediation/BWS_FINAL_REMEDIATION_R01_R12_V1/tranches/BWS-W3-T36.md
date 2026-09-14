
# BWS-W3-T36 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W3-T36
CAMPAIGN_ORDER: 44
STAGE: S6
PRIMARY_OWNER: R09
SECONDARY_REVIEWERS: R01, R03, R07, R08, R10, R11, R24
ISSUE_IDS: BWS120-R09-018, BWS120-R09-019, BWS120-R09-020, BWS120-R09-021
SEVERITY_COUNTS: {"P1": 4}
DEPENDENCIES: T27, T28, T29, T30, T31, T32, T33, T34, T35, T37
EXTERNAL_ACCEPTANCE_PENDING: yes
CURRENT_SOURCE_AUTHORITY: frozen review/finding baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; active campaign authority is pinned by activation/immutable-authority.sha256; exact current numbered archive or checkout, extracted-tree digest, Git identity, source paths, hashes, and modes must be captured in an external audit or admission receipt and reverified before editing; repository documentation does not self-attest a rolling numbered ZIP
CURRENT_SOURCE_PATH_CANDIDATES: packages/bootstrap/src/operations/external-runtime-preflight.ts, packages/bootstrap/src/operations/final-local-acceptance.ts, tests/bws-final-local-acceptance.test.ts
SYMBOLS_TO_REVERIFY: 10 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: packages/bootstrap/src/operations/external-runtime-preflight.ts, packages/bootstrap/src/operations/final-local-acceptance.ts, tests/bws-final-local-acceptance.test.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites ``T27-T35``
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 22 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 22 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 4 classified records below
CONCURRENCY_OR_CRASH_TESTS: 2 classified records below
ENVIRONMENT_PROOF: {"NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION": 22}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: preflight consumes canonical result and validation; environment bytes in identity; all recovery artifacts share generation/content graph; archive digest independently recomputed and component paths immutable
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED, SOURCE_COMPLETE_EXTERNAL_PENDING
BLOCKS: {"bws_600": false, "bws_710": false, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W4-T41 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `packages/bootstrap/src/operations/external-runtime-preflight.ts` | present=yes | sha256=724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/final-local-acceptance.ts` | present=yes | sha256=1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `tests/bws-final-local-acceptance.test.ts` | present=yes | sha256=c2ca8b6bfb9fb49cc387c781844440de074932533cd97acddaa60679281c6b2d | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS120-R09-018 | `packages/bootstrap/src/operations/external-runtime-preflight.ts` | symbol=createBwsExternalRuntimeCampaignManifest | reviewed_line_range=260-267 | reviewed_sha256=724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427
- BWS120-R09-018 | `packages/bootstrap/src/operations/external-runtime-preflight.ts` | symbol=validateSoakEvidence | reviewed_line_range=529-585 | reviewed_sha256=724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427
- BWS120-R09-018 | `packages/bootstrap/src/operations/external-runtime-preflight.ts` | symbol=readSoakStateFile / readSoakCheckpointFile | reviewed_line_range=803-824 | reviewed_sha256=724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427
- BWS120-R09-018 | `packages/bootstrap/src/operations/external-runtime-preflight.ts` | symbol=createBwsExternalRuntimeCampaignManifest / validateSoakEvidence / readSoakCheckpointFile | reviewed_line_range=260-267; 529-585; 803-824 | reviewed_sha256=724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427
- BWS120-R09-019 | `packages/bootstrap/src/operations/external-runtime-preflight.ts` | symbol=environment read and manifest descriptor | reviewed_line_range=267-280; 332-407 | reviewed_sha256=724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427
- BWS120-R09-019 | `packages/bootstrap/src/operations/external-runtime-preflight.ts` | symbol=createBwsExternalRuntimeCampaignManifest semantic fingerprint descriptor | reviewed_line_range=267-280; 332-407 | reviewed_sha256=724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427
- BWS120-R09-020 | `packages/bootstrap/src/operations/final-local-acceptance.ts` | symbol=createBwsFinalLocalAcceptanceRecoveryResult | reviewed_line_range=534-657 | reviewed_sha256=1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5
- BWS120-R09-020 | `tests/bws-final-local-acceptance.test.ts` | symbol=final recovery evidence focused test | reviewed_line_range=211-238 | reviewed_sha256=c2ca8b6bfb9fb49cc387c781844440de074932533cd97acddaa60679281c6b2d
- BWS120-R09-021 | `packages/bootstrap/src/operations/final-local-acceptance.ts` | symbol=createBwsFinalLocalAcceptanceManifest | reviewed_line_range=694-830 | reviewed_sha256=1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5
- BWS120-R09-021 | `tests/bws-final-local-acceptance.test.ts` | symbol=final acceptance manifest focused test | reviewed_line_range=240-287 | reviewed_sha256=c2ca8b6bfb9fb49cc387c781844440de074932533cd97acddaa60679281c6b2d

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS120-R09-018 — External preflight promotes schema-shaped soak state without consuming the soak result or validation verdict

- Severity: `P1`
- Current behavior: The preflight can pass without any result or validation artifact and without verifying the checkpoint fingerprint/chain.
- Expected behavior: Promotion must require the exact successful soak result and validator output, bind their hashes and campaign fingerprint, and independently verify critical terminal invariants.
- Invariant: Promotion must require the exact successful soak result and validator output, bind their hashes and campaign fingerprint, and independently verify critical terminal invariants.
- Root cause: The promotion gate reimplements a weak subset of soak checks instead of consuming the canonical validated terminal receipt.
- Trigger: Create the external runtime campaign manifest.
- Minimal fix boundary: Require exact soak manifest/result/validation hashes, validation.ok=true, full campaign fingerprint parity, terminal checkpoint chain verification, and all failure/observation/cleanup gates before external campaign creation.
- Regression risks:
- Avoid circular trust: external preflight should still verify essential bindings rather than trusting one boolean alone.
- R07 owns evidence artifact publication and hash identity.

### BWS120-R09-019 — External campaign identity omits the environment file bytes

- Severity: `P1`
- Current behavior: Changing file bytes at the same path can leave the semantic fingerprint unchanged.
- Expected behavior: Campaign identity must bind the exact effective configuration used by the lifecycle, persistence, and upstream clients, without exposing secrets.
- Invariant: Campaign identity must bind the exact effective configuration used by the lifecycle, persistence, and upstream clients, without exposing secrets.
- Root cause: The campaign descriptor records a mutable path and partial projections rather than an immutable effective-configuration receipt.
- Trigger: Reuse the external campaign manifest or compare identities before/after mutation.
- Minimal fix boundary: Generate a restricted, secret-safe canonical configuration receipt that covers every effective value and source/precedence decision, bind its digest into the manifest, and revalidate it at campaign start.
- Regression risks:
- Configuration digest artifacts must have restrictive permissions and must not reveal low-entropy secrets.
- R10 owns repository-wide precedence and secret handling.

### BWS120-R09-020 — Final recovery evidence combines unrelated schema-shaped artifacts without common byte or generation binding

- Severity: `P1`
- Current behavior: Unrelated evidence can be combined; later byte replacement at the same path does not change the result semantic fingerprint.
- Expected behavior: Every artifact must be byte-hashed and relationally bound to one release pair, plan, database identity, backup, runtime generation, and exercise run.
- Invariant: Every artifact must be byte-hashed and relationally bound to one release pair, plan, database identity, backup, runtime generation, and exercise run.
- Root cause: The composition step validates local shape/status but not cross-artifact provenance or immutable bytes.
- Trigger: Create the final recovery result.
- Minimal fix boundary: Bind each component hash and evidence identity into a versioned recovery graph; require exact common plan/release/database/backup/runtime/exercise identifiers and recompute all hashes at composition.
- Regression risks:
- Existing artifacts may lack common IDs and need to remain historical/non-promotable.
- Do not duplicate R08 backup/restore correctness; verify its receipts and relationships here.

### BWS120-R09-021 — Final acceptance trusts a caller-supplied archive digest and mutable component paths

- Severity: `P1`
- Current behavior: No archive is opened; arbitrary digest text is accepted. Component byte hashes are absent from the semantic fingerprint, and a false/missing soak-validation verdict can pass if its artifact digest field matches.
- Expected behavior: Final acceptance must hash the actual immutable archive, hash every component artifact, require each validator verdict including soakValidation.ok=true, and commit one immutable acceptance bundle.
- Invariant: Final acceptance must hash the actual immutable archive, hash every component artifact, require each validator verdict including soakValidation.ok=true, and commit one immutable acceptance bundle.
- Root cause: The final manifest is a caller-composed summary rather than an independently verified immutable acceptance transaction.
- Trigger: Create the final local acceptance manifest.
- Minimal fix boundary: Require an actual archive path, recompute its SHA-256, enumerate and hash every component, verify every explicit ok/status field, bind a common generation/exercise graph, publish into an immutable directory, and atomically commit one final receipt.
- Regression risks:
- Final bundle production must preserve prior accepted bundles and avoid path-only mutable pointers.
- R07/R24 publication mechanics require explicit coordination.


## Allowed edit boundary

- Candidate path set: `packages/bootstrap/src/operations/external-runtime-preflight.ts`, `packages/bootstrap/src/operations/final-local-acceptance.ts`, `tests/bws-final-local-acceptance.test.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `packages/bootstrap/src/operations/external-runtime-preflight.ts` | participating tranches=T03, T04, T27, T29, T31, T33, T36 | predecessor postimage required
- `packages/bootstrap/src/operations/final-local-acceptance.ts` | participating tranches=T29, T31, T35, T36 | predecessor postimage required
- `tests/bws-final-local-acceptance.test.ts` | participating tranches=T29, T36 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- Execution, public signals, and live financial operations remain disabled and out of scope.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T27, T28, T29, T30, T31, T32, T33, T34, T35, T37.
- Review prerequisites: `T27-T35`.
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

- `BWS120-R09-018-TEST-01` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-018 | requirement=missing soak result
- `BWS120-R09-018-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-018 | requirement=validation.ok=false
- `BWS120-R09-018-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-018 | requirement=tampered checkpoint fingerprint
- `BWS120-R09-018-TEST-04` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-018 | requirement=missing required failure recovery
- `BWS120-R09-018-TEST-05` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-018 | requirement=result/manifest mismatch
- `BWS120-R09-018-TEST-06` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-018 | requirement=artifact archive digest mismatch
- `BWS120-R09-019-TEST-01` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-019 | requirement=database name/host/user change
- `BWS120-R09-019-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-019 | requirement=upstream URL/checkpoint change
- `BWS120-R09-019-TEST-03` | category=cancellation_or_timeout | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-019 | requirement=timeout/retry change
- `BWS120-R09-019-TEST-04` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-019 | requirement=secret-only change with protected digest
- `BWS120-R09-019-TEST-05` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-019 | requirement=environment path symlink/replacement after preflight
- `BWS120-R09-020-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-020 | requirement=mix successful result from plan A with failed result from plan B
- `BWS120-R09-020-TEST-02` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-020 | requirement=different database backup/restore
- `BWS120-R09-020-TEST-03` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-020 | requirement=artifact replacement after read
- `BWS120-R09-020-TEST-04` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-020 | requirement=different target release fingerprints
- `BWS120-R09-020-TEST-05` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-020 | requirement=retention plan from unrelated backup
- `BWS120-R09-021-TEST-01` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-021 | requirement=wrong archive bytes with claimed digest
- `BWS120-R09-021-TEST-02` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-021 | requirement=nonexistent archive
- `BWS120-R09-021-TEST-03` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-021 | requirement=soakValidation.ok=false
- `BWS120-R09-021-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-021 | requirement=component mutation after finalization
- `BWS120-R09-021-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-021 | requirement=component from different campaign
- `BWS120-R09-021-TEST-06` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-021 | requirement=atomic final-bundle publication failure

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS120-R09-018-TEST-01` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-018 | requirement=missing soak result
- `BWS120-R09-018-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-018 | requirement=validation.ok=false
- `BWS120-R09-018-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-018 | requirement=tampered checkpoint fingerprint
- `BWS120-R09-018-TEST-04` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-018 | requirement=missing required failure recovery
- `BWS120-R09-018-TEST-05` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-018 | requirement=result/manifest mismatch
- `BWS120-R09-018-TEST-06` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-018 | requirement=artifact archive digest mismatch
- `BWS120-R09-019-TEST-01` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-019 | requirement=database name/host/user change
- `BWS120-R09-019-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-019 | requirement=upstream URL/checkpoint change
- `BWS120-R09-019-TEST-03` | category=cancellation_or_timeout | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-019 | requirement=timeout/retry change
- `BWS120-R09-019-TEST-04` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-019 | requirement=secret-only change with protected digest
- `BWS120-R09-019-TEST-05` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-019 | requirement=environment path symlink/replacement after preflight
- `BWS120-R09-020-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-020 | requirement=mix successful result from plan A with failed result from plan B
- `BWS120-R09-020-TEST-02` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-020 | requirement=different database backup/restore
- `BWS120-R09-020-TEST-03` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-020 | requirement=artifact replacement after read
- `BWS120-R09-020-TEST-04` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-020 | requirement=different target release fingerprints
- `BWS120-R09-020-TEST-05` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-020 | requirement=retention plan from unrelated backup
- `BWS120-R09-021-TEST-01` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-021 | requirement=wrong archive bytes with claimed digest
- `BWS120-R09-021-TEST-02` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-021 | requirement=nonexistent archive
- `BWS120-R09-021-TEST-03` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-021 | requirement=soakValidation.ok=false
- `BWS120-R09-021-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-021 | requirement=component mutation after finalization
- `BWS120-R09-021-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-021 | requirement=component from different campaign
- `BWS120-R09-021-TEST-06` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-021 | requirement=atomic final-bundle publication failure

## Negative and adversarial tests

- `BWS120-R09-018-TEST-05` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-018 | requirement=result/manifest mismatch
- `BWS120-R09-018-TEST-06` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-018 | requirement=artifact archive digest mismatch
- `BWS120-R09-019-TEST-04` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-019 | requirement=secret-only change with protected digest
- `BWS120-R09-019-TEST-05` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-019 | requirement=environment path symlink/replacement after preflight

## Concurrency, cancellation, crash, and restart tests

- `BWS120-R09-018-TEST-04` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-018 | requirement=missing required failure recovery
- `BWS120-R09-019-TEST-03` | category=cancellation_or_timeout | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-019 | requirement=timeout/retry change

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

Acceptance authority: preflight consumes canonical result and validation; environment bytes in identity; all recovery artifacts share generation/content graph; archive digest independently recomputed and component paths immutable

Allowed terminal states: `ACCEPTED`, `BLOCKED`, `SOURCE_COMPLETE_EXTERNAL_PENDING`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W4-T41` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
