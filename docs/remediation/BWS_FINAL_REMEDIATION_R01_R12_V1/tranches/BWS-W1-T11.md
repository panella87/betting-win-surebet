
# BWS-W1-T11 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W1-T11
CAMPAIGN_ORDER: 20
STAGE: S3
PRIMARY_OWNER: R03
SECONDARY_REVIEWERS: R06, R08, R10, R11
ISSUE_IDS: BWS116-R03-005, BWS116-R03-011
SEVERITY_COUNTS: {"P1": 1, "P2": 1}
DEPENDENCIES: T10, T37
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen review/finding baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; active campaign authority is pinned by activation/immutable-authority.sha256; exact current numbered archive or checkout, extracted-tree digest, Git identity, source paths, hashes, and modes must be captured in an external audit or admission receipt and reverified before editing; repository documentation does not self-attest a rolling numbered ZIP
CURRENT_SOURCE_PATH_CANDIDATES: packages/bootstrap/src/operations/private-paper-scheduler-service.ts, packages/bootstrap/src/operations/private-paper-worker-service.ts, packages/bootstrap/src/workers/bounded-job-worker.ts, packages/persistence/src/psql.ts
SYMBOLS_TO_REVERIFY: 4 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: packages/bootstrap/src/operations/private-paper-scheduler-service.ts, packages/bootstrap/src/operations/private-paper-worker-service.ts, packages/bootstrap/src/workers/bounded-job-worker.ts, packages/persistence/src/psql.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites `["Explicit command and service deadline policy", "T10 lifecycle ownership"]`
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 8 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 2 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 0 classified records below
CONCURRENCY_OR_CRASH_TESTS: 5 classified records below
ENVIRONMENT_PROOF: {"DISPOSABLE_POSTGRESQL_AND_NODE20": 8}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: ["psql operations have bounded timeout/output and classified cancellation", "Service shutdown prevents late durable writes"]
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": false, "bws_710": false, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W2-T21 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `packages/bootstrap/src/operations/private-paper-scheduler-service.ts` | present=yes | sha256=876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/private-paper-worker-service.ts` | present=yes | sha256=1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/workers/bounded-job-worker.ts` | present=yes | sha256=3f319fc5ad09636121698b36817f1762c4431dffb775535a2d62e3289b111dd7 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/persistence/src/psql.ts` | present=yes | sha256=86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS116-R03-005 | `packages/persistence/src/psql.ts` | symbol=runPsql | reviewed_line_range=191-217 | reviewed_sha256=86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343
- BWS116-R03-011 | `packages/bootstrap/src/workers/bounded-job-worker.ts` | symbol=RunBoundedWorkerPassRequest / runHandlerWithLeaseRenewal | reviewed_line_range=59-77; 313-347 | reviewed_sha256=3f319fc5ad09636121698b36817f1762c4431dffb775535a2d62e3289b111dd7
- BWS116-R03-011 | `packages/bootstrap/src/operations/private-paper-worker-service.ts` | symbol=worker pass execution / raceWithTimeout | reviewed_line_range=379-395; 552-574 | reviewed_sha256=1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36
- BWS116-R03-011 | `packages/bootstrap/src/operations/private-paper-scheduler-service.ts` | symbol=executePass / raceWithTimeout | reviewed_line_range=505-514; 531-553 | reviewed_sha256=876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS116-R03-005 — psql subprocesses have no explicit timeout or cancellation boundary

- Severity: `P2`
- Current behavior: The Node process blocks synchronously until psql exits. Service pass timeouts cannot interrupt this child.
- Expected behavior: Every database subprocess must have a bounded command budget, classified timeout, deterministic cleanup, and cancellation propagation from service shutdown.
- Invariant: Every database subprocess must have a bounded command budget, classified timeout, deterministic cleanup, and cancellation propagation from service shutdown.
- Root cause: The persistence abstraction omits command-budget and abort ownership from its public configuration.
- Trigger: Invoke any repository, migration, status, scheduler, or worker persistence operation.
- Minimal fix boundary: Add a required bounded psql timeout and maximum output size, map timeout/termination distinctly, redact errors, and thread an abort/deadline policy through long-running service calls. Consider a pooled PostgreSQL driver for transactional and cancellation semantics.
- Regression risks:
- Too-short defaults can abort legitimate migrations or backups
- Switching drivers changes error and transaction semantics

### BWS116-R03-011 — Configured service timeouts and shutdown signals do not cancel in-flight scheduler or worker work

- Severity: `P1`
- Current behavior: Timeout only changes later classification. Both helpers await the original promise after the sentinel. Worker shutdown is checked only before new claims; the in-flight handler receives no cancellation and continues lease renewal.
- Expected behavior: The service must stop awaiting at the deadline, propagate cancellation to underlying work, stop renewing leases, fence late mutations, and report a distinct timeout/cancel state.
- Invariant: The service must stop awaiting at the deadline, propagate cancellation to underlying work, stop renewing leases, fence late mutations, and report a distinct timeout/cancel state.
- Root cause: Timeout and signal handling are observational wrappers rather than ownership/cancellation mechanisms threaded through worker handlers and repositories.
- Trigger: The timeout fires or shutdownSignal is set while work is in flight.
- Minimal fix boundary: Introduce AbortSignal and absolute deadlines at service, pass, handler, adapter, and persistence boundaries; stop renewal on abort; return at timeout; fence late result publication by lease epoch/status; add cancelled/timed_out/unknown durable states as required.
- Regression risks:
- Cancellation can expose non-cancellable psql calls until finding 005 is fixed
- New durable states require migration and API/read-model updates


## Allowed edit boundary

- Candidate path set: `packages/bootstrap/src/operations/private-paper-scheduler-service.ts`, `packages/bootstrap/src/operations/private-paper-worker-service.ts`, `packages/bootstrap/src/workers/bounded-job-worker.ts`, `packages/persistence/src/psql.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `packages/bootstrap/src/operations/private-paper-scheduler-service.ts` | participating tranches=T11, T21, T23, T24 | predecessor postimage required
- `packages/bootstrap/src/operations/private-paper-worker-service.ts` | participating tranches=T11, T21, T23, T24 | predecessor postimage required
- `packages/bootstrap/src/workers/bounded-job-worker.ts` | participating tranches=T11, T12 | predecessor postimage required
- `packages/persistence/src/psql.ts` | participating tranches=T01, T11, T30, T32, T37 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- Existing drain behavior before new claims remains valid
- Generic child-process supervision details remain R06-owned
- No credentials were printed during review
- No existing service is started/stopped during review
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds
- execFileSync argument arrays avoid shell interpolation

## Prerequisites

- Dependency terminal receipts: T10, T37.
- Review prerequisites: ["Explicit command and service deadline policy", "T10 lifecycle ownership"].
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

- `BWS116-R03-005-TEST-01` | category=persistence_or_migration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-005 | requirement=Sleeping fake psql is terminated at the configured budget
- `BWS116-R03-005-TEST-02` | category=cancellation_or_timeout | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-005 | requirement=Blocked database query does not prevent service shutdown indefinitely
- `BWS116-R03-005-TEST-03` | category=persistence_or_migration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-005 | requirement=Timeout is distinct from SQL failure and authentication failure
- `BWS116-R03-011-TEST-01` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-011 | requirement=Never-settling worker handler exits service within timeout
- `BWS116-R03-011-TEST-02` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-011 | requirement=SIGTERM during handler stops lease renewal and prevents new durable writes
- `BWS116-R03-011-TEST-03` | category=cancellation_or_timeout | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-011 | requirement=Late handler resolution cannot complete the job
- `BWS116-R03-011-TEST-04` | category=cancellation_or_timeout | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-011 | requirement=Scheduler pass timeout returns without awaiting the pass
- `BWS116-R03-011-TEST-05` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-011 | requirement=Timer/listener cleanup occurs exactly once

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS116-R03-005-TEST-02` | category=cancellation_or_timeout | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-005 | requirement=Blocked database query does not prevent service shutdown indefinitely
- `BWS116-R03-011-TEST-01` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-011 | requirement=Never-settling worker handler exits service within timeout

## Negative and adversarial tests

- No separately classified record; admission must still test failure branches stated by each finding

## Concurrency, cancellation, crash, and restart tests

- `BWS116-R03-005-TEST-02` | category=cancellation_or_timeout | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-005 | requirement=Blocked database query does not prevent service shutdown indefinitely
- `BWS116-R03-011-TEST-01` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-011 | requirement=Never-settling worker handler exits service within timeout
- `BWS116-R03-011-TEST-02` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-011 | requirement=SIGTERM during handler stops lease renewal and prevents new durable writes
- `BWS116-R03-011-TEST-03` | category=cancellation_or_timeout | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-011 | requirement=Late handler resolution cannot complete the job
- `BWS116-R03-011-TEST-04` | category=cancellation_or_timeout | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-011 | requirement=Scheduler pass timeout returns without awaiting the pass

## Environment proof

- DISPOSABLE_POSTGRESQL_AND_NODE20: 8 requirements

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

Acceptance authority: ["psql operations have bounded timeout/output and classified cancellation", "Service shutdown prevents late durable writes"]

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W2-T21` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
