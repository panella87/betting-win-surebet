
# BWS-W1-T02 implementation packet

> Documentation status: `PROPOSED_NOT_ACTIVE` for T39 and `NOT_ADMITTED` for all tranches. This packet does not authorize source mutation.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W1-T02
CAMPAIGN_ORDER: 14
STAGE: S3
PRIMARY_OWNER: R01
SECONDARY_REVIEWERS: R03, R10, R11
ISSUE_IDS: BWS116-R01-001, BWS116-R01-002
SEVERITY_COUNTS: {"P1": 2}
DEPENDENCIES: T40
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; exact 771-member archive inventory; independently computed inventory digest=b81ff807e4c230bff96fe1fa58f73a2d4bac803ebd7fa58b843cdcb83499f7f0
CURRENT_SOURCE_PATH_CANDIDATES: packages/upstream/src/upstream/betting-win-upstream-lock.ts
SYMBOLS_TO_REVERIFY: 2 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: packages/upstream/src/upstream/betting-win-upstream-lock.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites `["Literal Git object-read contract"]`
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 5 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 4 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 2 classified records below
CONCURRENCY_OR_CRASH_TESTS: 1 classified records below
ENVIRONMENT_PROOF: {"AS_DECLARED_BY_OWNING_REVIEW": 1, "NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE": 4}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: ["One literal commit/tree snapshot owns every derived field", "Replacement objects and concurrent ref movement cannot alter lock content"]
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": true, "bws_710": true, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W1-T03 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `packages/upstream/src/upstream/betting-win-upstream-lock.ts` | present=yes | sha256=8c0badbfc3dc776eb71e01e1a76280debab30c64739274b06d1ce7343382a6c2 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS116-R01-001 | `packages/upstream/src/upstream/betting-win-upstream-lock.ts` | symbol=generateBettingWinUpstreamLock | reviewed_line_range=L102-L103 | reviewed_sha256=8c0badbfc3dc776eb71e01e1a76280debab30c64739274b06d1ce7343382a6c2
- BWS116-R01-002 | `packages/upstream/src/upstream/betting-win-upstream-lock.ts` | symbol=generateBettingWinUpstreamLock | reviewed_line_range=L102-L103 | reviewed_sha256=8c0badbfc3dc776eb71e01e1a76280debab30c64739274b06d1ce7343382a6c2

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS116-R01-001 — Committed-HEAD lock derivation honors repository-local Git replacement objects

- Severity: `P1`
- Current behavior: The lock path does not force replacement objects off. Git can therefore report the original HEAD object name while dereferencing a replacement commit/tree for later content-oriented commands, producing a lock that is not portable proof of the named commit.
- Expected behavior: A committed-source lock must describe the literal object graph named by the advertised commit ID, independent of repository-local replacement refs.
- Invariant: A committed-source lock must describe the literal object graph named by the advertised commit ID, independent of repository-local replacement refs.
- Root cause: The trust model treats Git's default revision resolver as a literal object reader, but default resolution includes mutable repository-local replacement refs.
- Trigger: The lock implementation resolves HEAD/tree/content with ordinary Git plumbing commands while replacement-object processing remains enabled.
- Minimal fix boundary: In the upstream-lock command runner only, disable replacement-object interpretation for every identity/content operation and verify that commit, tree, and blob reads all originate from the literal advertised objects. Preserve the existing lock schema unless a compatibility version is deliberately introduced.
- Regression risks:
- Git-version differences in replacement behavior
- Accidental rejection of legitimate worktrees or alternates
- Lock-schema compatibility

### BWS116-R01-002 — Upstream lock is assembled from multiple unconstrained HEAD observations rather than one pinned object graph

- Severity: `P1`
- Current behavior: The lock is composed across multiple observations. A concurrent branch update can mix identity from one revision with tree/content/fingerprint evidence from another, and the final record does not prove atomicity of the source view.
- Expected behavior: All lock fields must be derived from one explicitly pinned commit/tree snapshot, or generation must fail when the repository moves.
- Invariant: All lock fields must be derived from one explicitly pinned commit/tree snapshot, or generation must fail when the repository moves.
- Root cause: The implementation pins a branch name operationally, not a single object graph used as the sole input to every derived field.
- Trigger: HEAD, tree, tracked-file fingerprint, package/workspace data, or capabilities are resolved by separate Git/filesystem operations without first pinning and reusing one immutable commit object and without a final same-object check.
- Minimal fix boundary: Resolve one literal commit object once, derive tree and every committed file from that object ID, and fail if any required filesystem-derived datum cannot be read from the same commit. Add a final guard only as defense in depth, not as the primary snapshot mechanism.
- Regression risks:
- Changing accepted worktree behavior
- Performance on large tracked trees
- Windows path/case behavior


## Allowed edit boundary

- Candidate path set: `packages/upstream/src/upstream/betting-win-upstream-lock.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `packages/upstream/src/upstream/betting-win-upstream-lock.ts` | participating tranches=T02, T41 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- B1 resource semantics
- BWS API intake
- Convergence persistence
- External runtime HTTP contract
- all betting-win source, checkout, documentation, service, database, and runtime
- betting-win checkout and source
- betting-win source
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T40.
- Review prerequisites: ["Literal Git object-read contract"].
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

- `BWS116-R01-001-TEST-01` | category=identity_or_determinism | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-001 | requirement=Production-entrypoint test with a disposable repository containing a replacement commit and replacement blob; lock generation must reject or produce the literal original graph.
- `BWS116-R01-001-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-001 | requirement=Control test proving ordinary committed HEAD, worktree, and bare-repository forms remain accepted as intended.
- `BWS116-R01-002-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-002 | requirement=Instrumented disposable-repository test that advances the branch between each Git subprocess and proves either stable old/new lock output or fail-closed behavior, never a mixed record.
- `BWS116-R01-002-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-002 | requirement=Test uncommitted and untracked changes remain excluded without reading mutable worktree files.
- `BWS116-R01-TG-001` | category=concurrency_or_fencing | environment=AS_DECLARED_BY_OWNING_REVIEW | production_entrypoint=yes | status=CONFIRMED_TEST_GAP | issues=BWS116-R01-001, BWS116-R01-002, BWS116-R01-003, BWS116-R01-004, BWS116-R01-005, BWS116-R01-006, BWS116-R01-007, BWS116-R01-008, BWS116-R01-009, BWS116-R01-010 | requirement=Focused tests do not adversarially exercise the full production entrypoint for identity drift and lifecycle races

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS116-R01-001-TEST-01` | category=identity_or_determinism | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-001 | requirement=Production-entrypoint test with a disposable repository containing a replacement commit and replacement blob; lock generation must reject or produce the literal original graph.
- `BWS116-R01-001-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-001 | requirement=Control test proving ordinary committed HEAD, worktree, and bare-repository forms remain accepted as intended.
- `BWS116-R01-002-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-002 | requirement=Instrumented disposable-repository test that advances the branch between each Git subprocess and proves either stable old/new lock output or fail-closed behavior, never a mixed record.
- `BWS116-R01-TG-001` | category=concurrency_or_fencing | environment=AS_DECLARED_BY_OWNING_REVIEW | production_entrypoint=yes | status=CONFIRMED_TEST_GAP | issues=BWS116-R01-001, BWS116-R01-002, BWS116-R01-003, BWS116-R01-004, BWS116-R01-005, BWS116-R01-006, BWS116-R01-007, BWS116-R01-008, BWS116-R01-009, BWS116-R01-010 | requirement=Focused tests do not adversarially exercise the full production entrypoint for identity drift and lifecycle races

## Negative and adversarial tests

- `BWS116-R01-001-TEST-01` | category=identity_or_determinism | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-001 | requirement=Production-entrypoint test with a disposable repository containing a replacement commit and replacement blob; lock generation must reject or produce the literal original graph.
- `BWS116-R01-002-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-002 | requirement=Instrumented disposable-repository test that advances the branch between each Git subprocess and proves either stable old/new lock output or fail-closed behavior, never a mixed record.

## Concurrency, cancellation, crash, and restart tests

- `BWS116-R01-TG-001` | category=concurrency_or_fencing | environment=AS_DECLARED_BY_OWNING_REVIEW | production_entrypoint=yes | status=CONFIRMED_TEST_GAP | issues=BWS116-R01-001, BWS116-R01-002, BWS116-R01-003, BWS116-R01-004, BWS116-R01-005, BWS116-R01-006, BWS116-R01-007, BWS116-R01-008, BWS116-R01-009, BWS116-R01-010 | requirement=Focused tests do not adversarially exercise the full production entrypoint for identity drift and lifecycle races

## Environment proof

- AS_DECLARED_BY_OWNING_REVIEW: 1 requirements
- NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE: 4 requirements

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

Acceptance authority: ["One literal commit/tree snapshot owns every derived field", "Replacement objects and concurrent ref movement cannot alter lock content"]

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W1-T03` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
