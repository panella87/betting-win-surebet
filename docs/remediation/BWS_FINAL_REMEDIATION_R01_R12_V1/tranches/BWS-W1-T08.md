
# BWS-W1-T08 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W1-T08
CAMPAIGN_ORDER: 31
STAGE: S4
PRIMARY_OWNER: R02
SECONDARY_REVIEWERS: R04, R07, R11
ISSUE_IDS: BWS116-R02-006, BWS116-R02-012
SEVERITY_COUNTS: {"P1": 2}
DEPENDENCIES: T06, T07
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen review/finding baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; active campaign authority is pinned by activation/immutable-authority.sha256; exact current numbered archive or checkout, extracted-tree digest, Git identity, source paths, hashes, and modes must be captured in an external audit or admission receipt and reverified before editing; repository documentation does not self-attest a rolling numbered ZIP
CURRENT_SOURCE_PATH_CANDIDATES: packages/bootstrap/src/scenarios/scenario-cashflow.ts, packages/bootstrap/src/solver/b1-generalized-stake-vector.ts, packages/bootstrap/src/solver/stake-vector.ts
SYMBOLS_TO_REVERIFY: 7 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: packages/bootstrap/src/solver/b1-generalized-stake-vector.ts, packages/bootstrap/src/solver/stake-vector.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites `["T06", "T07"]`
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 9 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 0 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 3 classified records below
CONCURRENCY_OR_CRASH_TESTS: 0 classified records below
ENVIRONMENT_PROOF: {"NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE": 9}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: ["Solver finds every feasible bounded vector or returns a proven reason", "Scenario matrices are complete and rectangular"]
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": false, "bws_710": false, "deployment": false, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W2-T15 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `packages/bootstrap/src/scenarios/scenario-cashflow.ts` | present=yes | sha256=11c1608a8d1cb5341f6125b9a30af4afd7c22aac64e228545636446b38476228 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` | present=yes | sha256=822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/solver/stake-vector.ts` | present=yes | sha256=d5022b515bbac8672ed337933887276d590424c89b75c3e5acd290f3a5561029 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS116-R02-006 | `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` | symbol=solveB1GeneralizedStakeVector target search | reviewed_line_range=147-225 | reviewed_sha256=822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0
- BWS116-R02-006 | `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` | symbol=initialTargetPayout / maxTargetPayout | reviewed_line_range=349-380 | reviewed_sha256=822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0
- BWS116-R02-006 | `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` | symbol=buildStakesForTargetPayout | reviewed_line_range=382-445 | reviewed_sha256=822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0
- BWS116-R02-006 | `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` | symbol=calculateScenarioNets | reviewed_line_range=447-469 | reviewed_sha256=822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0
- BWS116-R02-012 | `packages/bootstrap/src/scenarios/scenario-cashflow.ts` | symbol=validateScenarioCashflowMatrix | reviewed_line_range=15-62 | reviewed_sha256=11c1608a8d1cb5341f6125b9a30af4afd7c22aac64e228545636446b38476228
- BWS116-R02-012 | `packages/bootstrap/src/scenarios/scenario-cashflow.ts` | symbol=validateScenarioCoverage | reviewed_line_range=218-240 | reviewed_sha256=11c1608a8d1cb5341f6125b9a30af4afd7c22aac64e228545636446b38476228
- BWS116-R02-012 | `packages/bootstrap/src/solver/stake-vector.ts` | symbol=solver post-validation shape checks | reviewed_line_range=73-88 | reviewed_sha256=d5022b515bbac8672ed337933887276d590424c89b75c3e5acd290f3a5561029

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS116-R02-006 — B1 generalized solver can reject feasible two-way and three-way integer stake vectors

- Severity: `P1`
- Current behavior: The algorithm searches a single common target payout and rounds every leg up to reach it. If one leg cannot reach that common target it returns CAPACITY_EXHAUSTED without exploring feasible unequal-payout vectors.
- Expected behavior: The solver must return any deterministic feasible integer vector satisfying min/max/step and target worst-case net, even when terminal payouts are unequal.
- Invariant: The solver must return any deterministic feasible integer vector satisfying min/max/step and target worst-case net, even when terminal payouts are unequal.
- Root cause: Common-target-payout construction is used as if it were a complete feasibility search, but it is only one sufficient family of vectors.
- Trigger: Two-way: odds [1.5,4.0], caps [(1,2,1),(1,1,1)], target worst-case 0. Three-way: odds [2.5,2.5,6.0], caps [(1,2,1),(1,2,1),(1,1,1)], target 0.
- Minimal fix boundary: Replace or augment the R02 search with a complete bounded integer feasibility/optimization method for the declared two- and three-leg domains. Preserve deterministic objective and explicit search bounds.
- Regression risks:
- A complete search may cost more; bounds and failure typing must remain explicit.
- Changing objective/tie-breaking can alter historical fixtures and reports.

### BWS116-R02-012 — Standard scenario cash-flow validator accepts incomplete and non-rectangular matrices

- Severity: `P1`
- Current behavior: The exported validator checks row shape and distinct scenario IDs only. It does not check leg cardinality, unique scenario-leg cells, or every leg in every scenario. The solver adds one later leg-count check, but the validator itself returns accepted.
- Expected behavior: A matrix validator must prove the full scenario-by-leg rectangle, stable stake/cost terms, unique cells, and complete terminal winner coverage.
- Invariant: A matrix validator must prove the full scenario-by-leg rectangle, stable stake/cost terms, unique cells, and complete terminal winner coverage.
- Root cause: Scenario coverage is validated independently of leg coverage and matrix rectangularity.
- Trigger: Pass two rows, one for each scenario, both using the same leg ID.
- Minimal fix boundary: Strengthen the R02 matrix validator to require unique scenario-leg cells, the complete leg set in every scenario, stable leg terms, and one coherent winner. Keep lifecycle simulation semantics in R04.
- Regression risks:
- Stricter validation may expose malformed retained fixtures.
- Do not duplicate B1-specific matrix logic inconsistently.


## Allowed edit boundary

- Candidate path set: `packages/bootstrap/src/scenarios/scenario-cashflow.ts`, `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts`, `packages/bootstrap/src/solver/stake-vector.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` | participating tranches=T06, T07, T08 | predecessor postimage required
- `packages/bootstrap/src/solver/stake-vector.ts` | participating tranches=T07, T08 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- B1 matrix validator, which already checks rectangularity more strongly
- Capacity evidence integration finding BWS116-R02-005
- Live execution remains parked
- Persistence
- Persistence and runtime orchestration
- Scenario payout formula
- Standard complete-set assembly
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T06, T07.
- Review prerequisites: ["T06", "T07"].
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

- `BWS116-R02-006-TEST-01` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-006 | requirement=Brute-force oracle comparison over small domains for 2-way and 3-way cases.
- `BWS116-R02-006-TEST-02` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-006 | requirement=Unequal payout feasibility cases.
- `BWS116-R02-006-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-006 | requirement=Positive target-net, one-unit residual, tight cap, and non-unit step cases.
- `BWS116-R02-006-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-006 | requirement=Metamorphic scaling and permutation tests.
- `BWS116-R02-006-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-006 | requirement=Proof that returned vectors satisfy all constraints.
- `BWS116-R02-012-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-012 | requirement=One-leg/two-scenario rejection.
- `BWS116-R02-012-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-012 | requirement=Duplicate cell and missing cell tests.
- `BWS116-R02-012-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-012 | requirement=Extra leg/scenario rejection.
- `BWS116-R02-012-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-012 | requirement=Permutation and rectangularity property tests.

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- none mapped; focused environment proof remains required

## Negative and adversarial tests

- `BWS116-R02-006-TEST-01` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-006 | requirement=Brute-force oracle comparison over small domains for 2-way and 3-way cases.
- `BWS116-R02-006-TEST-02` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-006 | requirement=Unequal payout feasibility cases.
- `BWS116-R02-012-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-012 | requirement=Duplicate cell and missing cell tests.

## Concurrency, cancellation, crash, and restart tests

- No separately classified record

## Environment proof

- NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE: 9 requirements

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

Acceptance authority: ["Solver finds every feasible bounded vector or returns a proven reason", "Scenario matrices are complete and rectangular"]

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W2-T15` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
