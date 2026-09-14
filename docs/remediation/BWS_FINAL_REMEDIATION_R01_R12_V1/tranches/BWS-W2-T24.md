
# BWS-W2-T24 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W2-T24
CAMPAIGN_ORDER: 24
STAGE: S3
PRIMARY_OWNER: R06
SECONDARY_REVIEWERS: R01, R03, R07, R11, R12
ISSUE_IDS: BWS118-R06-015, BWS118-R06-016
SEVERITY_COUNTS: {"P1": 2}
DEPENDENCIES: T21, T23
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen review/finding baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; active campaign authority is pinned by activation/immutable-authority.sha256; exact current numbered archive or checkout, extracted-tree digest, Git identity, source paths, hashes, and modes must be captured in an external audit or admission receipt and reverified before editing; repository documentation does not self-attest a rolling numbered ZIP
CURRENT_SOURCE_PATH_CANDIDATES: packages/bootstrap/src/operations/operator-lifecycle.ts, packages/bootstrap/src/operations/private-paper-scheduler-service.ts, packages/bootstrap/src/operations/private-paper-worker-service.ts, packages/bootstrap/src/operations/upstream-convergence-service.ts
SYMBOLS_TO_REVERIFY: 7 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: packages/bootstrap/src/operations/operator-lifecycle.ts, packages/bootstrap/src/operations/private-paper-scheduler-service.ts, packages/bootstrap/src/operations/private-paper-worker-service.ts, packages/bootstrap/src/operations/upstream-convergence-service.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites `- BWS-W2-T21`
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 10 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 10 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 1 classified records below
CONCURRENCY_OR_CRASH_TESTS: 2 classified records below
ENVIRONMENT_PROOF: {"NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED": 10}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: - Unexpected exception writes terminal failed/unknown state and evidence
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": false, "bws_710": false, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W2-T25 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `packages/bootstrap/src/operations/operator-lifecycle.ts` | present=yes | sha256=704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/private-paper-scheduler-service.ts` | present=yes | sha256=876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/private-paper-worker-service.ts` | present=yes | sha256=1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/upstream-convergence-service.ts` | present=yes | sha256=937ad8b789002504b674351c04e2179ba2800e17deea1d5e17aa0dd31786d5a8 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS118-R06-015 | `packages/bootstrap/src/operations/upstream-convergence-service.ts` | symbol=runBwsUpstreamConvergenceService | reviewed_line_range=301-414 | reviewed_sha256=937ad8b789002504b674351c04e2179ba2800e17deea1d5e17aa0dd31786d5a8
- BWS118-R06-015 | `packages/bootstrap/src/operations/private-paper-scheduler-service.ts` | symbol=runBwsPrivatePaperSchedulerService | reviewed_line_range=305-421 | reviewed_sha256=876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967
- BWS118-R06-015 | `packages/bootstrap/src/operations/private-paper-worker-service.ts` | symbol=runBwsPrivatePaperWorkerService | reviewed_line_range=317-451 | reviewed_sha256=1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36
- BWS118-R06-016 | `packages/bootstrap/src/operations/upstream-convergence-service.ts` | symbol=writeEvidenceRecord / resolveEvidenceFilePath | reviewed_line_range=873-900 | reviewed_sha256=937ad8b789002504b674351c04e2179ba2800e17deea1d5e17aa0dd31786d5a8
- BWS118-R06-016 | `packages/bootstrap/src/operations/private-paper-scheduler-service.ts` | symbol=writeEvidenceRecord / resolveEvidenceFilePath | reviewed_line_range=895-921 | reviewed_sha256=876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967
- BWS118-R06-016 | `packages/bootstrap/src/operations/private-paper-worker-service.ts` | symbol=writeEvidenceRecord / resolveEvidenceFilePath | reviewed_line_range=954-972 | reviewed_sha256=1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36
- BWS118-R06-016 | `packages/bootstrap/src/operations/operator-lifecycle.ts` | symbol=writeLifecycleEvidence / resolveLifecycleEvidenceFilePath | reviewed_line_range=913-927 | reviewed_sha256=704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS118-R06-015 — Unexpected pass failures exit without a terminal service state or failure evidence

- Severity: `P1`
- Current behavior: The rejection escapes. Signal listeners are disposed, but the durable state remains lifecycleState=running and no failure/stop evidence is written.
- Expected behavior: The service must transition to failed/unknown with timestamp, error class, current pass, process generation, and terminal evidence before returning/rethrowing; status must not report running.
- Invariant: The service must transition to failed/unknown with timestamp, error class, current pass, process generation, and terminal evidence before returning/rethrowing; status must not report running.
- Root cause: Only expected result variants are modeled; unexpected exceptions are treated as process errors without durable lifecycle finalization.
- Trigger: Reject the pass promise after service_started and pass-start state are written.
- Minimal fix boundary: Add failed/unknown terminal states and a top-level catch/finally that records sanitized failure evidence and state exactly once, while preserving the original error and any ambiguous in-flight operation identity.
- Regression risks:
- Failure finalization itself can fail and needs a bounded fallback record
- Do not misclassify a timed-out but still-running pass as safely failed

### BWS118-R06-016 — Millisecond evidence filenames collide across legitimate lifecycle events and can crash the service

- Severity: `P1`
- Current behavior: The second legitimate event targets the same path and throws. State may already have advanced before evidence publication fails.
- Expected behavior: Evidence identity must include a collision-resistant runtime generation and monotonic event sequence/UUID, with atomic no-overwrite publication and deterministic index linkage.
- Invariant: Evidence identity must include a collision-resistant runtime generation and monotonic event sequence/UUID, with atomic no-overwrite publication and deterministic index linkage.
- Root cause: Wall-clock millisecond plus low-cardinality fields is used as a uniqueness key rather than a timestamp attribute.
- Trigger: Run startup and a fast pass, or two status commands, with the same generatedAt millisecond.
- Minimal fix boundary: Add runtimeId plus a monotonic event counter or UUID to evidence IDs, use atomic create, update an append/index record only after durable artifact publication, and define recovery when state exists without its evidence event.
- Regression risks:
- Changing filenames affects evidence indexes, retention, and downstream handoffs
- Sequence allocation must itself be concurrency-safe


## Allowed edit boundary

- Candidate path set: `packages/bootstrap/src/operations/operator-lifecycle.ts`, `packages/bootstrap/src/operations/private-paper-scheduler-service.ts`, `packages/bootstrap/src/operations/private-paper-worker-service.ts`, `packages/bootstrap/src/operations/upstream-convergence-service.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `packages/bootstrap/src/operations/operator-lifecycle.ts` | participating tranches=T21, T22, T23, T24, T25, T37 | predecessor postimage required
- `packages/bootstrap/src/operations/private-paper-scheduler-service.ts` | participating tranches=T11, T21, T23, T24 | predecessor postimage required
- `packages/bootstrap/src/operations/private-paper-worker-service.ts` | participating tranches=T11, T21, T23, T24 | predecessor postimage required
- `packages/bootstrap/src/operations/upstream-convergence-service.ts` | participating tranches=T21, T23, T24 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- - No runtime evidence marked accepted by docs
- Existing no-overwrite check is an intentional safeguard against silent artifact replacement
- Expected BoundaryResult blocker/retry outcomes remain unchanged
- No persistent state outside the disposable harness was written
- No repository evidence was written
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T21, T23.
- Review prerequisites: - BWS-W2-T21.
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

- `BWS118-R06-015-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-015 | requirement=Rejected pass promise
- `BWS118-R06-015-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-015 | requirement=State write failure after pass
- `BWS118-R06-015-TEST-03` | category=evidence_or_artifact | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-015 | requirement=Evidence/logger failure after state write
- `BWS118-R06-015-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-015 | requirement=Exception during classification
- `BWS118-R06-015-TEST-05` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-015 | requirement=Restart/status from failed and unknown states
- `BWS118-R06-016-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-016 | requirement=Fixed clock startup plus pass completion
- `BWS118-R06-016-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-016 | requirement=Concurrent status commands
- `BWS118-R06-016-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-016 | requirement=Multiple blocked/retry passes in one millisecond
- `BWS118-R06-016-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-016 | requirement=Clock regression
- `BWS118-R06-016-TEST-05` | category=evidence_or_artifact | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-016 | requirement=State/evidence write failure reconciliation

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS118-R06-015-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-015 | requirement=Rejected pass promise
- `BWS118-R06-015-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-015 | requirement=State write failure after pass
- `BWS118-R06-015-TEST-03` | category=evidence_or_artifact | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-015 | requirement=Evidence/logger failure after state write
- `BWS118-R06-015-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-015 | requirement=Exception during classification
- `BWS118-R06-015-TEST-05` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-015 | requirement=Restart/status from failed and unknown states
- `BWS118-R06-016-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-016 | requirement=Fixed clock startup plus pass completion
- `BWS118-R06-016-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-016 | requirement=Concurrent status commands
- `BWS118-R06-016-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-016 | requirement=Multiple blocked/retry passes in one millisecond
- `BWS118-R06-016-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-016 | requirement=Clock regression
- `BWS118-R06-016-TEST-05` | category=evidence_or_artifact | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-016 | requirement=State/evidence write failure reconciliation

## Negative and adversarial tests

- `BWS118-R06-015-TEST-05` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-015 | requirement=Restart/status from failed and unknown states

## Concurrency, cancellation, crash, and restart tests

- `BWS118-R06-015-TEST-05` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-015 | requirement=Restart/status from failed and unknown states
- `BWS118-R06-016-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-016 | requirement=Concurrent status commands

## Environment proof

- NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED: 10 requirements

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

Acceptance authority: - Unexpected exception writes terminal failed/unknown state and evidence

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W2-T25` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
