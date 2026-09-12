
# BWS-W4-T43 implementation packet

> Documentation status: `PROPOSED_NOT_ACTIVE` for T39 and `NOT_ADMITTED` for all tranches. This packet does not authorize source mutation.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W4-T43
CAMPAIGN_ORDER: 47
STAGE: S7
PRIMARY_OWNER: R11
SECONDARY_REVIEWERS: R01, R02, R03, R04, R05, R06, R07, R08, R09, R12
ISSUE_IDS: BWS121-R11-010
SEVERITY_COUNTS: {"P1": 1}
DEPENDENCIES: T40, T41, T42, T01, T02, T03, T04, T05, T06, T07, T08, T09, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19, T20, T21, T22, T23, T24, T25, T26, T27, T28, T29, T30, T31, T32, T33, T34, T35, T36, T37, T38, T39, T44, T45, T46, T47
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; exact 771-member archive inventory; independently computed inventory digest=b81ff807e4c230bff96fe1fa58f73a2d4bac803ebd7fa58b843cdcb83499f7f0
CURRENT_SOURCE_PATH_CANDIDATES: docs/reviews/BWS120/wave-03/cumulative-consolidated-ledger.json, docs/reviews/BWS120/wave-03/test-evidence-matrix.json, package.json
SYMBOLS_TO_REVERIFY: 3 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: package.json
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
FOCUSED_TESTS: 6 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 6 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 1 classified records below
CONCURRENCY_OR_CRASH_TESTS: 1 classified records below
ENVIRONMENT_PROOF: {"AS_SPECIFIED_BY_REVIEW": 6}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: Machine-enforced closure from every stable finding to source postimages, executed tests, and environment receipts.
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": true, "bws_710": true, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: no next tranche; proceed only to final campaign acceptance
```

## Current source-path candidates

- `docs/reviews/BWS120/wave-03/cumulative-consolidated-ledger.json` | present=yes | sha256=dc47a624e242f859daed6b256a27cc93f343fcd7b74a630e2e6cc75015c8a894 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `docs/reviews/BWS120/wave-03/test-evidence-matrix.json` | present=yes | sha256=5cecb3239f7993eaf16864216923e5238bbeedab88ffb9b26ccb83033864b272 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `package.json` | present=yes | sha256=b1b69ffa6d0b974c3b3ba55f3ec1acffb21e512c3a862e2a7b2d6b5139e5eac0 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS121-R11-010 | `package.json` | symbol=validation graph | reviewed_line_range=15-32; 64-70 | reviewed_sha256=b1b69ffa6d0b974c3b3ba55f3ec1acffb21e512c3a862e2a7b2d6b5139e5eac0
- BWS121-R11-010 | `docs/reviews/BWS120/wave-03/cumulative-consolidated-ledger.json` | symbol=confirmed findings and summary | reviewed_line_range=1-14007 | reviewed_sha256=dc47a624e242f859daed6b256a27cc93f343fcd7b74a630e2e6cc75015c8a894
- BWS121-R11-010 | `docs/reviews/BWS120/wave-03/test-evidence-matrix.json` | symbol=records | reviewed_line_range=1-8498 | reviewed_sha256=5cecb3239f7993eaf16864216923e5238bbeedab88ffb9b26ccb83033864b272

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS121-R11-010 — Aggregate validation has no machine-enforced closure from 137 inherited findings to 723 required tests and production entrypoints

- Severity: `P1`
- Current behavior: No non-review package, script, test, source, or automation path references the cumulative ledger or test-evidence matrix. Current gates can only test historical expectations, not closure of the 137-review backlog.
- Expected behavior: Release acceptance must prove that every blocking finding is either fixed and covered by named tests at production entrypoints or explicitly retained as an accepted hold. The gate must reject unresolved or unmapped ledger records.
- Invariant: Release acceptance must prove that every blocking finding is either fixed and covered by named tests at production entrypoints or explicitly retained as an accepted hold. The gate must reject unresolved or unmapped ledger records.
- Root cause: The historical validation graph has no defect-ledger closure model, no finding-to-test receipt, and no production-entrypoint coverage requirement tied to review authority.
- Trigger: Run existing static validators or, after repairing only the manifest, run the historical aggregate gate without adding finding-specific closure evidence.
- Minimal fix boundary: After implementation findings are resolved, add a generated but reviewed closure manifest mapping each stable finding ID to source postimages, tests, runtime/environment class, and acceptance receipt. Make unresolved blockers fail the release gate. Keep review documentation non-executable until an authorized integration tranche lands the closure contract.
- Regression risks:
- Do not let mutable review prose become direct controller routing authority.
- Closure generation must preserve stable inherited IDs and avoid duplicating application roots.


## Allowed edit boundary

- Candidate path set: `docs/reviews/BWS120/wave-03/cumulative-consolidated-ledger.json`, `docs/reviews/BWS120/wave-03/test-evidence-matrix.json`, `package.json`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

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

- Dependency terminal receipts: T40, T41, T42, T01, T02, T03, T04, T05, T06, T07, T08, T09, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19, T20, T21, T22, T23, T24, T25, T26, T27, T28, T29, T30, T31, T32, T33, T34, T35, T36, T37, T38, T39, T44, T45, T46, T47.
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

- `BWS121-R11-REQ-042` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-010 | requirement=All 137 IDs must be mapped exactly once or intentionally shared by root cause
- `BWS121-R11-REQ-043` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-010 | requirement=Unresolved blocking finding fails release
- `BWS121-R11-REQ-044` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-010 | requirement=Test exists but was not executed fails acceptance
- `BWS121-R11-REQ-045` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-010 | requirement=Unit-only test fails when production entrypoint is required
- `BWS121-R11-REQ-046` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-010 | requirement=Stale test/source hash fails closure
- `BWS121-R11-REQ-047` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-010 | requirement=Accepted external blocker remains non-promotable

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS121-R11-REQ-042` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-010 | requirement=All 137 IDs must be mapped exactly once or intentionally shared by root cause
- `BWS121-R11-REQ-043` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-010 | requirement=Unresolved blocking finding fails release
- `BWS121-R11-REQ-044` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-010 | requirement=Test exists but was not executed fails acceptance
- `BWS121-R11-REQ-045` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-010 | requirement=Unit-only test fails when production entrypoint is required
- `BWS121-R11-REQ-046` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-010 | requirement=Stale test/source hash fails closure
- `BWS121-R11-REQ-047` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-010 | requirement=Accepted external blocker remains non-promotable

## Negative and adversarial tests

- `BWS121-R11-REQ-046` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-010 | requirement=Stale test/source hash fails closure

## Concurrency, cancellation, crash, and restart tests

- `BWS121-R11-REQ-046` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-010 | requirement=Stale test/source hash fails closure

## Environment proof

- AS_SPECIFIED_BY_REVIEW: 6 requirements

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

Acceptance authority: Machine-enforced closure from every stable finding to source postimages, executed tests, and environment receipts.

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

No remediation tranche follows T43. Only final campaign-result validation and separately authorized hold decisions may follow.
