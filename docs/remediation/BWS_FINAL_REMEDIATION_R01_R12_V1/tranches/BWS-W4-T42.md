
# BWS-W4-T42 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W4-T42
CAMPAIGN_ORDER: 46
STAGE: S7
PRIMARY_OWNER: R11
SECONDARY_REVIEWERS: R01, R02, R03, R04, R06, R07, R10, R12
ISSUE_IDS: BWS121-R11-007, BWS121-R11-008, BWS121-R11-009
SEVERITY_COUNTS: {"P1": 3}
DEPENDENCIES: T39, T41
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen review/finding baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; active campaign authority is pinned by activation/immutable-authority.sha256; exact current numbered archive or checkout, extracted-tree digest, Git identity, source paths, hashes, and modes must be captured in an external audit or admission receipt and reverified before editing; repository documentation does not self-attest a rolling numbered ZIP
CURRENT_SOURCE_PATH_CANDIDATES: cli.js, package.json, scripts/validate_contract_boundary.py, scripts/validate_fixture_integrity.py, scripts/validate_no_execution_paths.py, scripts/validate_no_provider_connections.py, tests/boundary-validator-workspace-scope.test.ts, tests/fixtures/b1-local-contract/valid-b1-multi-venue-markets.json, tests/fixtures/local-only-export-bundles/valid-resource-export.json, tests/fixtures/private-paper-mode-smoke/accepted-local-bundle.json, tests/validate-fixture-integrity.test.ts
SYMBOLS_TO_REVERIFY: 14 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: cli.js, package.json
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
FOCUSED_TESTS: 15 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 15 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 5 classified records below
CONCURRENCY_OR_CRASH_TESTS: 0 classified records below
ENVIRONMENT_PROOF: {"AS_SPECIFIED_BY_REVIEW": 15}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: Repository-wide structural boundary analysis and complete fixture authority.
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": true, "bws_710": true, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W4-T43 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `cli.js` | present=yes | sha256=acd4aa4ba64dbcacbc891ffe1af22699d9a240f16d3411ac3ea6998048d63349 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `package.json` | present=yes | sha256=b1b69ffa6d0b974c3b3ba55f3ec1acffb21e512c3a862e2a7b2d6b5139e5eac0 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `scripts/validate_contract_boundary.py` | present=yes | sha256=8d8b4d559a000517e766b14f93b76379c2027dbe269f87f56167be4a5d2bb174 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `scripts/validate_fixture_integrity.py` | present=yes | sha256=fc4eb4e0ccf040ee399659e17ce9983d61d3b16f01de4ea9ebe44da37dbbf5bb | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `scripts/validate_no_execution_paths.py` | present=yes | sha256=da689d340d84cecbf8e5a7b3056fd233820e65187de312f48268806f196dd65b | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `scripts/validate_no_provider_connections.py` | present=yes | sha256=e2afd91309af1ce80d0f0c8cd91f4aff944a1408f3443167c80ddb6476f0a003 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `tests/boundary-validator-workspace-scope.test.ts` | present=yes | sha256=3ff1bbd46c2eca6e5bc44cd6d86063d3b16c270e80d1018f7e1a3a811a8c8718 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `tests/fixtures/b1-local-contract/valid-b1-multi-venue-markets.json` | present=yes | sha256=df0b5190ca30be3c921c4b37869752feb138faa98565b0a9e333ec7e62da63d7 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `tests/fixtures/local-only-export-bundles/valid-resource-export.json` | present=yes | sha256=7bf48c2a6461f28e75a80c7cb8d3057715fb7ffea3dc00e50705b814c6bee16d | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `tests/fixtures/private-paper-mode-smoke/accepted-local-bundle.json` | present=yes | sha256=623ccae2fd5ab78124445d1d3eaceddd829c161472bbfd0ab4e8297739941be4 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `tests/validate-fixture-integrity.test.ts` | present=yes | sha256=35364ca01695419750c3558aeff96ed24b59931bd542bd7497de572d6f9b46c1 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS121-R11-007 | `scripts/validate_no_provider_connections.py` | symbol=SCAN_ROOTS | reviewed_line_range=8-10; 27-39; 49-65 | reviewed_sha256=e2afd91309af1ce80d0f0c8cd91f4aff944a1408f3443167c80ddb6476f0a003
- BWS121-R11-007 | `scripts/validate_no_execution_paths.py` | symbol=SCAN_ROOTS | reviewed_line_range=7-10; 18-30; 58-64 | reviewed_sha256=da689d340d84cecbf8e5a7b3056fd233820e65187de312f48268806f196dd65b
- BWS121-R11-007 | `scripts/validate_contract_boundary.py` | symbol=SCAN_INPUTS | reviewed_line_range=7-14; 23-35; 47-55 | reviewed_sha256=8d8b4d559a000517e766b14f93b76379c2027dbe269f87f56167be4a5d2bb174
- BWS121-R11-007 | `tests/boundary-validator-workspace-scope.test.ts` | symbol=boundary scope fixtures | reviewed_line_range=10-104 | reviewed_sha256=3ff1bbd46c2eca6e5bc44cd6d86063d3b16c270e80d1018f7e1a3a811a8c8718
- BWS121-R11-007 | `package.json` | symbol=validate:boundary | reviewed_line_range=25 | reviewed_sha256=b1b69ffa6d0b974c3b3ba55f3ec1acffb21e512c3a862e2a7b2d6b5139e5eac0
- BWS121-R11-008 | `scripts/validate_no_provider_connections.py` | symbol=PATTERNS | reviewed_line_range=41-47 | reviewed_sha256=e2afd91309af1ce80d0f0c8cd91f4aff944a1408f3443167c80ddb6476f0a003
- BWS121-R11-008 | `scripts/validate_no_execution_paths.py` | symbol=WORKSPACE_PATTERNS | reviewed_line_range=43-50 | reviewed_sha256=da689d340d84cecbf8e5a7b3056fd233820e65187de312f48268806f196dd65b
- BWS121-R11-008 | `tests/boundary-validator-workspace-scope.test.ts` | symbol=root executable fixtures | reviewed_line_range=48-103 | reviewed_sha256=3ff1bbd46c2eca6e5bc44cd6d86063d3b16c270e80d1018f7e1a3a811a8c8718
- BWS121-R11-008 | `cli.js` | symbol=root executable entrypoint | reviewed_line_range=1-113 | reviewed_sha256=acd4aa4ba64dbcacbc891ffe1af22699d9a240f16d3411ac3ea6998048d63349
- BWS121-R11-009 | `scripts/validate_fixture_integrity.py` | symbol=fixture scope | reviewed_line_range=8-15; 36-78 | reviewed_sha256=fc4eb4e0ccf040ee399659e17ce9983d61d3b16f01de4ea9ebe44da37dbbf5bb
- BWS121-R11-009 | `tests/validate-fixture-integrity.test.ts` | symbol=makeFixture and two tests | reviewed_line_range=12-53 | reviewed_sha256=35364ca01695419750c3558aeff96ed24b59931bd542bd7497de572d6f9b46c1
- BWS121-R11-009 | `tests/fixtures/b1-local-contract/valid-b1-multi-venue-markets.json` | symbol=substantive B1 fixture | reviewed_line_range=1-104 | reviewed_sha256=df0b5190ca30be3c921c4b37869752feb138faa98565b0a9e333ec7e62da63d7
- BWS121-R11-009 | `tests/fixtures/private-paper-mode-smoke/accepted-local-bundle.json` | symbol=accepted private-paper fixture | reviewed_line_range=1-71 | reviewed_sha256=623ccae2fd5ab78124445d1d3eaceddd829c161472bbfd0ab4e8297739941be4
- BWS121-R11-009 | `tests/fixtures/local-only-export-bundles/valid-resource-export.json` | symbol=valid resource fixture | reviewed_line_range=1-16 | reviewed_sha256=7bf48c2a6461f28e75a80c7cb8d3057715fb7ffea3dc00e50705b814c6bee16d

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS121-R11-007 — Boundary validators omit active root executables, commands, scripts, and database migrations from their scan authority

- Severity: `P1`
- Current behavior: The scanners silently ignore major active surfaces. A root controller containing a provider URL and execution identifier plus a surebet migration containing CREATE TABLE core... all passed the respective validators.
- Expected behavior: Boundary proof must enumerate every executable, configuration, deployment, command, shell, and migration surface from the archive/build graph and fail on any unclassified path.
- Invariant: Boundary proof must enumerate every executable, configuration, deployment, command, shell, and migration surface from the archive/build graph and fail on any unclassified path.
- Root cause: Hard-coded positive scan-root lists are incomplete and there is no archive-to-scanner coverage reconciliation.
- Trigger: Run npm run validate:boundary or the affected Python scripts.
- Minimal fix boundary: Generate or maintain one explicit executable-surface inventory covering root scripts, commands, scripts, deployment, database/migrations, packages, apps, src, package scripts, and relevant configuration. Fail when a new executable-class path is not classified. Preserve narrow explicit exclusions.
- Regression risks:
- Avoid scanning review prose as executable code.
- Keep false-positive exceptions explicit, path-and-rule-specific, and reviewed.

### BWS121-R11-008 — Regex boundary checks are bypassed by trivial source-level string or identifier composition inside scanned files

- Severity: `P1`
- Current behavior: Fragmented provider URL and createOrderClient strings in scanned cli.js pass both validators.
- Expected behavior: Safety boundaries must be enforced architecturally and through dependency/capability allowlists plus executable negative tests; lexical regex may be defense-in-depth only.
- Invariant: Safety boundaries must be enforced architecturally and through dependency/capability allowlists plus executable negative tests; lexical regex may be defense-in-depth only.
- Root cause: The assurance boundary equates regular-expression token matches with semantic absence of capability.
- Trigger: Run the no-provider and no-execution validators.
- Minimal fix boundary: Use dependency/import graph allowlists, typed capability boundaries, package/dependency audits, and inert runtime tests that prove injected transports only. Retain regexes as supplemental diagnostics, not acceptance authority.
- Regression risks:
- AST analysis must cover JavaScript, TypeScript, shell, JSON package scripts, and generated entrypoints appropriately.
- Avoid claiming formal semantic proof from any single static analyzer.

### BWS121-R11-009 — Fixture-integrity gate ignores all twelve substantive strategy and runtime fixture files

- Severity: `P1`
- Current behavior: The archive contains 17 fixture files. Five reserved/placeholder files are within the validator model; twelve substantive JSON fixtures are completely ignored. Replacing representative accepted/valid fixtures with invalid JSON still yields validator success.
- Expected behavior: Every substantive fixture must be inventoried, parseable, schema-valid where applicable, purpose-classified, and bound to tests that reject impossible enrichment or acceptance authority.
- Invariant: Every substantive fixture must be inventoried, parseable, schema-valid where applicable, purpose-classified, and bound to tests that reject impossible enrichment or acceptance authority.
- Root cause: The fixture validator is a narrow historical-placeholder policy check but is named and wired as repository-wide fixture integrity.
- Trigger: Run scripts/validate_fixture_integrity.py or npm run validate:boundary.
- Minimal fix boundary: Create an exact fixture manifest with path, purpose, schema/profile, allowed enrichment, and consumer tests. Validate all twelve substantive fixtures and keep the reserved-empty/placeholder rules as a separate check.
- Regression risks:
- Do not convert local deterministic fixtures into runtime/provider evidence.
- Preserve intentionally malformed negative fixtures with explicit expected-invalid classification.


## Allowed edit boundary

- Candidate path set: `cli.js`, `package.json`, `scripts/validate_contract_boundary.py`, `scripts/validate_fixture_integrity.py`, `scripts/validate_no_execution_paths.py`, `scripts/validate_no_provider_connections.py`, `tests/boundary-validator-workspace-scope.test.ts`, `tests/fixtures/b1-local-contract/valid-b1-multi-venue-markets.json`, `tests/fixtures/local-only-export-bundles/valid-resource-export.json`, `tests/fixtures/private-paper-mode-smoke/accepted-local-bundle.json`, `tests/validate-fixture-integrity.test.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `cli.js` | participating tranches=T38, T42 | predecessor postimage required
- `package.json` | participating tranches=T21, T38, T40, T41, T42, T43 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- All adversarial mutations were confined to disposable copies outside the extracted review tree.
- Execution, public signals, profitability claims, live writes, and financial operations remain prohibited and unchanged.
- No persistent database was contacted or mutated; no service, controller, scheduler, worker, or automation process was started.
- No provider, external API, account, credential, signer, wallet, deployed service, or betting-win checkout was contacted.
- No source, test, fixture, migration, schema, configuration, documentation, manifest, or archive member was modified.
- all betting-win source, checkout, documentation, service, database, and runtime
- betting-win; live execution; current BWS-600/BWS-710/BWS-900 holds
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T39, T41.
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

- `BWS121-R11-REQ-027` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-007 | requirement=Forbidden token in every active root controller
- `BWS121-R11-REQ-028` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-007 | requirement=Forbidden provider URL in commands and general scripts
- `BWS121-R11-REQ-029` | category=persistence_or_migration | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-007 | requirement=Cross-schema DDL in every migration file
- `BWS121-R11-REQ-030` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-007 | requirement=New executable path not present in scan inventory must fail
- `BWS121-R11-REQ-031` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-007 | requirement=Coverage test reconciles scanner path set to archive classifications
- `BWS121-R11-REQ-032` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-008 | requirement=Fragmented URL and identifier cases
- `BWS121-R11-REQ-033` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-008 | requirement=Aliased import and computed-property cases
- `BWS121-R11-REQ-034` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-008 | requirement=Dynamic import built from fragments
- `BWS121-R11-REQ-035` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-008 | requirement=Benign text false-positive tests
- `BWS121-R11-REQ-036` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-008 | requirement=No-network runtime test for public entrypoints
- `BWS121-R11-REQ-037` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-009 | requirement=Invalid JSON for every substantive fixture
- `BWS121-R11-REQ-038` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-009 | requirement=Missing/extra fixture path reconciliation
- `BWS121-R11-REQ-039` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-009 | requirement=Schema-invalid and enriched-impossible fixture negatives
- `BWS121-R11-REQ-040` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-009 | requirement=Consumer test proves exact native/local shape rather than helper-generated expectation
- `BWS121-R11-REQ-041` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-009 | requirement=Fixture digest change requires explicit review

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS121-R11-REQ-027` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-007 | requirement=Forbidden token in every active root controller
- `BWS121-R11-REQ-028` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-007 | requirement=Forbidden provider URL in commands and general scripts
- `BWS121-R11-REQ-029` | category=persistence_or_migration | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-007 | requirement=Cross-schema DDL in every migration file
- `BWS121-R11-REQ-030` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-007 | requirement=New executable path not present in scan inventory must fail
- `BWS121-R11-REQ-031` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-007 | requirement=Coverage test reconciles scanner path set to archive classifications
- `BWS121-R11-REQ-032` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-008 | requirement=Fragmented URL and identifier cases
- `BWS121-R11-REQ-033` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-008 | requirement=Aliased import and computed-property cases
- `BWS121-R11-REQ-034` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-008 | requirement=Dynamic import built from fragments
- `BWS121-R11-REQ-035` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-008 | requirement=Benign text false-positive tests
- `BWS121-R11-REQ-036` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-008 | requirement=No-network runtime test for public entrypoints
- `BWS121-R11-REQ-037` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-009 | requirement=Invalid JSON for every substantive fixture
- `BWS121-R11-REQ-038` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-009 | requirement=Missing/extra fixture path reconciliation
- `BWS121-R11-REQ-039` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-009 | requirement=Schema-invalid and enriched-impossible fixture negatives
- `BWS121-R11-REQ-040` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-009 | requirement=Consumer test proves exact native/local shape rather than helper-generated expectation
- `BWS121-R11-REQ-041` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-009 | requirement=Fixture digest change requires explicit review

## Negative and adversarial tests

- `BWS121-R11-REQ-030` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-007 | requirement=New executable path not present in scan inventory must fail
- `BWS121-R11-REQ-031` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-007 | requirement=Coverage test reconciles scanner path set to archive classifications
- `BWS121-R11-REQ-037` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-009 | requirement=Invalid JSON for every substantive fixture
- `BWS121-R11-REQ-038` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-009 | requirement=Missing/extra fixture path reconciliation
- `BWS121-R11-REQ-039` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-009 | requirement=Schema-invalid and enriched-impossible fixture negatives

## Concurrency, cancellation, crash, and restart tests

- No separately classified record

## Environment proof

- AS_SPECIFIED_BY_REVIEW: 15 requirements

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

Acceptance authority: Repository-wide structural boundary analysis and complete fixture authority.

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W4-T43` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
