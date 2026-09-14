
# BWS-W2-T21 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W2-T21
CAMPAIGN_ORDER: 21
STAGE: S3
PRIMARY_OWNER: R06
SECONDARY_REVIEWERS: R03, R09, R10, R11, R12, R23
ISSUE_IDS: BWS118-R06-001, BWS118-R06-003, BWS118-R06-004, BWS118-R06-005
SEVERITY_COUNTS: {"P1": 4}
DEPENDENCIES: T09, T10, T40
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen review/finding baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; active campaign authority is pinned by activation/immutable-authority.sha256; exact current numbered archive or checkout, extracted-tree digest, Git identity, source paths, hashes, and modes must be captured in an external audit or admission receipt and reverified before editing; repository documentation does not self-attest a rolling numbered ZIP
CURRENT_SOURCE_PATH_CANDIDATES: docs/035_continuous_service_supervisor_contract.md, package.json, packages/bootstrap/src/operations/operator-lifecycle.ts, packages/bootstrap/src/operations/private-paper-scheduler-service.ts, packages/bootstrap/src/operations/private-paper-worker-service.ts, packages/bootstrap/src/operations/upstream-convergence-service.ts, scripts/bws-root-wrapper-runtime.mjs
SYMBOLS_TO_REVERIFY: 12 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: docs/035_continuous_service_supervisor_contract.md, package.json, packages/bootstrap/src/operations/operator-lifecycle.ts, packages/bootstrap/src/operations/private-paper-scheduler-service.ts, packages/bootstrap/src/operations/private-paper-worker-service.ts, packages/bootstrap/src/operations/upstream-convergence-service.ts, scripts/bws-root-wrapper-runtime.mjs
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites `- BWS-W1-T09`
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 20 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 20 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 1 classified records below
CONCURRENCY_OR_CRASH_TESTS: 11 classified records below
ENVIRONMENT_PROOF: {"NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED": 20}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: - One atomic owner before side effects
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": false, "bws_710": false, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W2-T22 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `docs/035_continuous_service_supervisor_contract.md` | present=yes | sha256=cae4ce541c65848974de8c4568e72b6d2d3d151d9f2c3eaf52cb50e6777c8505 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `package.json` | present=yes | sha256=b1b69ffa6d0b974c3b3ba55f3ec1acffb21e512c3a862e2a7b2d6b5139e5eac0 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/operator-lifecycle.ts` | present=yes | sha256=704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/private-paper-scheduler-service.ts` | present=yes | sha256=876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/private-paper-worker-service.ts` | present=yes | sha256=1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/upstream-convergence-service.ts` | present=yes | sha256=937ad8b789002504b674351c04e2179ba2800e17deea1d5e17aa0dd31786d5a8 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `scripts/bws-root-wrapper-runtime.mjs` | present=yes | sha256=1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS118-R06-001 | `packages/bootstrap/src/operations/operator-lifecycle.ts` | symbol=startManagedBwsOperatorStack / writeLifecycleState | reviewed_line_range=240-264; 903-910 | reviewed_sha256=704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- BWS118-R06-001 | `packages/bootstrap/src/operations/upstream-convergence-service.ts` | symbol=runBwsUpstreamConvergenceService / writeServiceState | reviewed_line_range=301-327; 863-870 | reviewed_sha256=937ad8b789002504b674351c04e2179ba2800e17deea1d5e17aa0dd31786d5a8
- BWS118-R06-001 | `packages/bootstrap/src/operations/private-paper-scheduler-service.ts` | symbol=runBwsPrivatePaperSchedulerService / writeServiceState | reviewed_line_range=305-331; 885-892 | reviewed_sha256=876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967
- BWS118-R06-001 | `packages/bootstrap/src/operations/private-paper-worker-service.ts` | symbol=runBwsPrivatePaperWorkerService / writeServiceState | reviewed_line_range=317-345; 936-943 | reviewed_sha256=1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36
- BWS118-R06-003 | `packages/bootstrap/src/operations/operator-lifecycle.ts` | symbol=createLifecycleContext / collectSourceFingerprints / assertion functions | reviewed_line_range=351-397; 498-510; 823-850; 1249-1267 | reviewed_sha256=704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- BWS118-R06-003 | `package.json` | symbol=build and runtime scripts | reviewed_line_range=15-18; 33-47 | reviewed_sha256=b1b69ffa6d0b974c3b3ba55f3ec1acffb21e512c3a862e2a7b2d6b5139e5eac0
- BWS118-R06-003 | `scripts/bws-root-wrapper-runtime.mjs` | symbol=prepareRuntimeBuild / runLifecycleStart | reviewed_line_range=137-165 | reviewed_sha256=1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8
- BWS118-R06-003 | `docs/035_continuous_service_supervisor_contract.md` | symbol=BWS-584 required behavior | reviewed_line_range=87-103 | reviewed_sha256=cae4ce541c65848974de8c4568e72b6d2d3d151d9f2c3eaf52cb50e6777c8505
- BWS118-R06-004 | `packages/bootstrap/src/operations/operator-lifecycle.ts` | symbol=spawnAndPersistLifecycleState | reviewed_line_range=446-523 | reviewed_sha256=704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- BWS118-R06-004 | `packages/bootstrap/src/operations/operator-lifecycle.ts` | symbol=spawnManagedLifecycleProcess | reviewed_line_range=1094-1125 | reviewed_sha256=704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- BWS118-R06-005 | `packages/bootstrap/src/operations/operator-lifecycle.ts` | symbol=startManagedBwsOperatorStack / cleanupManagedProcesses | reviewed_line_range=246-260; 740-749 | reviewed_sha256=704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- BWS118-R06-005 | `packages/bootstrap/src/operations/operator-lifecycle.ts` | symbol=shutdownManagedProcesses | reviewed_line_range=752-771 | reviewed_sha256=704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS118-R06-001 — Lifecycle ownership is a non-atomic state-file check-and-overwrite

- Severity: `P1`
- Current behavior: Both processes can observe no live state, both can migrate or spawn/run, and the last rename wins. The overwritten state no longer identifies every active process.
- Expected behavior: Exactly one process must acquire an atomic, generation-bound ownership claim before migrations, child creation, service work, or evidence publication; all contenders must return an idempotent already-owned outcome.
- Invariant: Exactly one process must acquire an atomic, generation-bound ownership claim before migrations, child creation, service work, or evidence publication; all contenders must return an idempotent already-owned outcome.
- Root cause: A mutable JSON state file is used as both observation and ownership authority without an atomic reservation primitive.
- Trigger: Launch two lifecycle or standalone service starts concurrently.
- Minimal fix boundary: Add one repository-scoped atomic ownership primitive before any side effect, bind it to a monotonically unique runtime generation and process token, make start idempotent under contention, and release it only after verified shutdown. Apply the same primitive to standalone loops or prohibit independent ownership while the stack owner is active.
- Regression risks:
- Existing stale-state recovery must distinguish abandoned claims from slow initialization
- Standalone operation and full-stack operation must not acquire independent incompatible owners

### BWS118-R06-003 — Active processes are not bound to an immutable executable generation and status or stop commands rebuild dist

- Severity: `P1`
- Current behavior: Only repositoryRoot and a config fingerprint are enforced. Recorded source fingerprints are not asserted. Several status/stop wrappers clean and rebuild dist before managing the active generation.
- Expected behavior: Every managed process must remain bound to the exact immutable bytes it started from. Status and stop must inspect that recorded generation without mutating or replacing executable files.
- Invariant: Every managed process must remain bound to the exact immutable bytes it started from. Status and stop must inspect that recorded generation without mutating or replacing executable files.
- Root cause: Descriptive source metadata is not part of the enforced lifecycle identity, and wrapper commands conflate build/deploy with read-only management.
- Trigger: Change/rebuild dist after start or invoke a status/stop script that runs npm build.
- Minimal fix boundary: Record a canonical executable/package digest or release-directory identity at start, assert it on status/stop/evidence, run active services from immutable release directories, and remove builds from status/stop paths. Treat generation mismatch as explicit degraded/blocked ownership, not a reason to abandon stop authority.
- Regression risks:
- Strict generation binding needs an explicit emergency-stop path that still proves process ownership
- Historical runtime evidence must retain its original generation rather than being rewritten

### BWS118-R06-004 — Partial startup can orphan the just-spawned detached child before it enters rollback ownership

- Severity: `P1`
- Current behavior: The catch block cleans only startedProcesses. The current detached child is omitted until after verification succeeds, so it can survive with no state-file record.
- Expected behavior: The child must enter rollback ownership atomically with creation, and startup failure must either terminate and verify it or retain an explicit ambiguous ownership record.
- Invariant: The child must enter rollback ownership atomically with creation, and startup failure must either terminate and verify it or retain an explicit ambiguous ownership record.
- Root cause: Rollback ownership is established after a fallible verification phase rather than immediately after successful spawn.
- Trigger: Cause /proc verification, command validation, repository read, timeout, evidence/logging, or parent interruption between spawn and startedProcesses.push.
- Minimal fix boundary: Create an immediate provisional process record, keep the ChildProcess owned until verification completes, persist initializing/ambiguous ownership before detachment, and make rollback record any child whose exit cannot be verified.
- Regression risks:
- Persisting provisional state must not let status classify unverified children as ready
- Detachment timing changes can affect operator shell behavior

### BWS118-R06-005 — Stale-state recovery deletes ownership and starts replacements even when cleanup failed

- Severity: `P1`
- Current behavior: cleanupManagedProcesses swallows the error; start then deletes state and launches a fresh stack.
- Expected behavior: Recovery must preserve ambiguous ownership and refuse replacement until every prior owner is verified absent or transferred under a fenced generation.
- Invariant: Recovery must preserve ambiguous ownership and refuse replacement until every prior owner is verified absent or transferred under a fenced generation.
- Root cause: Recovery prioritizes replacement progress over preservation of ambiguous ownership.
- Trigger: Call start against partial state where shutdownManagedProcesses throws.
- Minimal fix boundary: Return a cleanup result per PID, retain state and evidence for any ambiguous/live owner, prohibit replacement without a fenced takeover, and provide an explicit operator-reviewed recovery action for irreconcilable ownership.
- Regression risks:
- A stricter block may require an emergency operator workflow
- Do not erase evidence needed to diagnose old generations


## Allowed edit boundary

- Candidate path set: `docs/035_continuous_service_supervisor_contract.md`, `package.json`, `packages/bootstrap/src/operations/operator-lifecycle.ts`, `packages/bootstrap/src/operations/private-paper-scheduler-service.ts`, `packages/bootstrap/src/operations/private-paper-worker-service.ts`, `packages/bootstrap/src/operations/upstream-convergence-service.ts`, `scripts/bws-root-wrapper-runtime.mjs`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `docs/035_continuous_service_supervisor_contract.md` | participating tranches=T10, T21, T23 | predecessor postimage required
- `package.json` | participating tranches=T21, T38, T40, T41, T42, T43 | predecessor postimage required
- `packages/bootstrap/src/operations/operator-lifecycle.ts` | participating tranches=T21, T22, T23, T24, T25, T37 | predecessor postimage required
- `packages/bootstrap/src/operations/private-paper-scheduler-service.ts` | participating tranches=T11, T21, T23, T24 | predecessor postimage required
- `packages/bootstrap/src/operations/private-paper-worker-service.ts` | participating tranches=T11, T21, T23, T24 | predecessor postimage required
- `packages/bootstrap/src/operations/upstream-convergence-service.ts` | participating tranches=T21, T23, T24 | predecessor postimage required
- `scripts/bws-root-wrapper-runtime.mjs` | participating tranches=T21, T22, T23, T25, T37, T38 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- - No active service control during review
- Child command tokens and /proc verification logic remain unchanged
- Current repositoryRoot and configuration checks remain valid subordinate safeguards
- Current temp-file rename behavior remains useful for write atomicity after ownership is fixed
- No generated output was rebuilt in the reviewed source tree
- No process or controller was started during review
- No process was spawned in the review
- No stale state was mutated during review
- Normal already-running detection remains unchanged
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T09, T10, T40.
- Review prerequisites: - BWS-W1-T09.
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

- `BWS118-R06-001-TEST-01` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-001 | requirement=Two OS processes starting the full stack concurrently
- `BWS118-R06-001-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-001 | requirement=Concurrent standalone loop starts
- `BWS118-R06-001-TEST-03` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-001 | requirement=Crash after claim but before state publication
- `BWS118-R06-001-TEST-04` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-001 | requirement=Stale claim takeover with a fencing generation
- `BWS118-R06-001-TEST-05` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-001 | requirement=Stop/status after a losing contender has spawned work
- `BWS118-R06-003-TEST-01` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-003 | requirement=Start generation A then change source and query status
- `BWS118-R06-003-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-003 | requirement=Start generation A then rebuild dist and stop
- `BWS118-R06-003-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-003 | requirement=Package version unchanged but executable bytes changed
- `BWS118-R06-003-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-003 | requirement=Source-manifest drift and repaired manifest transitions
- `BWS118-R06-003-TEST-05` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-003 | requirement=Immutable release-directory start/status/stop
- `BWS118-R06-004-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-004 | requirement=Verification failure after successful spawn
- `BWS118-R06-004-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-004 | requirement=Parent SIGTERM during each startup stage
- `BWS118-R06-004-TEST-03` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-004 | requirement=Child starts slowly but survives timeout
- `BWS118-R06-004-TEST-04` | category=evidence_or_artifact | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-004 | requirement=Logging or evidence failure after spawn
- `BWS118-R06-004-TEST-05` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-004 | requirement=Restart after provisional/ambiguous ownership
- `BWS118-R06-005-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-005 | requirement=First child ignores SIGTERM
- `BWS118-R06-005-TEST-02` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-005 | requirement=Later child remains live after an earlier timeout
- `BWS118-R06-005-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-005 | requirement=Mixed missing/running process set
- `BWS118-R06-005-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-005 | requirement=Cleanup throws from process signal or /proc read
- `BWS118-R06-005-TEST-05` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-005 | requirement=Recovery retry after partial termination

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS118-R06-001-TEST-01` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-001 | requirement=Two OS processes starting the full stack concurrently
- `BWS118-R06-001-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-001 | requirement=Concurrent standalone loop starts
- `BWS118-R06-001-TEST-03` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-001 | requirement=Crash after claim but before state publication
- `BWS118-R06-001-TEST-04` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-001 | requirement=Stale claim takeover with a fencing generation
- `BWS118-R06-001-TEST-05` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-001 | requirement=Stop/status after a losing contender has spawned work
- `BWS118-R06-003-TEST-01` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-003 | requirement=Start generation A then change source and query status
- `BWS118-R06-003-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-003 | requirement=Start generation A then rebuild dist and stop
- `BWS118-R06-003-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-003 | requirement=Package version unchanged but executable bytes changed
- `BWS118-R06-003-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-003 | requirement=Source-manifest drift and repaired manifest transitions
- `BWS118-R06-003-TEST-05` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-003 | requirement=Immutable release-directory start/status/stop
- `BWS118-R06-004-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-004 | requirement=Verification failure after successful spawn
- `BWS118-R06-004-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-004 | requirement=Parent SIGTERM during each startup stage
- `BWS118-R06-004-TEST-03` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-004 | requirement=Child starts slowly but survives timeout
- `BWS118-R06-004-TEST-04` | category=evidence_or_artifact | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-004 | requirement=Logging or evidence failure after spawn
- `BWS118-R06-004-TEST-05` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-004 | requirement=Restart after provisional/ambiguous ownership
- `BWS118-R06-005-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-005 | requirement=First child ignores SIGTERM
- `BWS118-R06-005-TEST-02` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-005 | requirement=Later child remains live after an earlier timeout
- `BWS118-R06-005-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-005 | requirement=Mixed missing/running process set
- `BWS118-R06-005-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-005 | requirement=Cleanup throws from process signal or /proc read
- `BWS118-R06-005-TEST-05` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-005 | requirement=Recovery retry after partial termination

## Negative and adversarial tests

- `BWS118-R06-001-TEST-04` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-001 | requirement=Stale claim takeover with a fencing generation

## Concurrency, cancellation, crash, and restart tests

- `BWS118-R06-001-TEST-01` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-001 | requirement=Two OS processes starting the full stack concurrently
- `BWS118-R06-001-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-001 | requirement=Concurrent standalone loop starts
- `BWS118-R06-001-TEST-03` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-001 | requirement=Crash after claim but before state publication
- `BWS118-R06-001-TEST-04` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-001 | requirement=Stale claim takeover with a fencing generation
- `BWS118-R06-003-TEST-01` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-003 | requirement=Start generation A then change source and query status
- `BWS118-R06-003-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-003 | requirement=Start generation A then rebuild dist and stop
- `BWS118-R06-003-TEST-05` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-003 | requirement=Immutable release-directory start/status/stop
- `BWS118-R06-004-TEST-03` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-004 | requirement=Child starts slowly but survives timeout
- `BWS118-R06-004-TEST-05` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-004 | requirement=Restart after provisional/ambiguous ownership
- `BWS118-R06-005-TEST-02` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-005 | requirement=Later child remains live after an earlier timeout
- `BWS118-R06-005-TEST-05` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-005 | requirement=Recovery retry after partial termination

## Environment proof

- NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED: 20 requirements

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

Acceptance authority: - One atomic owner before side effects

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W2-T22` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
