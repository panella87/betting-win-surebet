
# BWS-W1-T12 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W1-T12
CAMPAIGN_ORDER: 34
STAGE: S4
PRIMARY_OWNER: R03
SECONDARY_REVIEWERS: R01, R04, R06, R07, R11
ISSUE_IDS: BWS116-R03-014, BWS116-R03-015, BWS116-R03-016
SEVERITY_COUNTS: {"P1": 3}
DEPENDENCIES: T03, T07, T08, T10, T14, T16
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen review/finding baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; active campaign authority is pinned by activation/immutable-authority.sha256; exact current numbered archive or checkout, extracted-tree digest, Git identity, source paths, hashes, and modes must be captured in an external audit or admission receipt and reverified before editing; repository documentation does not self-attest a rolling numbered ZIP
CURRENT_SOURCE_PATH_CANDIDATES: database/migrations/surebet/003_create_strategy_ledger_entries.sql, database/migrations/surebet/009_create_b1_backtest_runs.sql, database/migrations/surebet/010_create_b1_candidate_snapshots.sql, database/migrations/surebet/011_create_b1_simulation_results.sql, database/migrations/surebet/012_create_b1_private_observation_cycles.sql, packages/bootstrap/src/runtime/private-paper-runtime.ts, packages/bootstrap/src/strategy/strategy-ledger.ts, packages/bootstrap/src/workers/b1-private-observation-jobs.ts, packages/bootstrap/src/workers/bounded-job-worker.ts, packages/bootstrap/src/workers/private-paper-runtime-jobs.ts, packages/persistence/src/repositories/b1-backtest-run-repository.ts, packages/persistence/src/repositories/b1-private-observation-repository.ts
SYMBOLS_TO_REVERIFY: 13 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: database/migrations/surebet/012_create_b1_private_observation_cycles.sql, packages/bootstrap/src/runtime/private-paper-runtime.ts, packages/bootstrap/src/strategy/strategy-ledger.ts, packages/bootstrap/src/workers/bounded-job-worker.ts, packages/persistence/src/repositories/b1-backtest-run-repository.ts, packages/persistence/src/repositories/b1-private-observation-repository.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites `["T03", "T07", "T08", "T10"]`
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 13 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 1 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 0 classified records below
CONCURRENCY_OR_CRASH_TESTS: 4 classified records below
ENVIRONMENT_PROOF: {"DISPOSABLE_POSTGRESQL_AND_NODE20": 13}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: ["Previous state is reconstructed durably", "B1 parent/children repair after crash", "Observation and worker terminality share an aggregate completion protocol"]
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": false, "bws_710": false, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W2-T17 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `database/migrations/surebet/003_create_strategy_ledger_entries.sql` | present=yes | sha256=b3a7695bfba8fedaa0bb3fccefdde9ae11d893e63a67b493647f0818ce507071 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `database/migrations/surebet/009_create_b1_backtest_runs.sql` | present=yes | sha256=c5b9b66325ca16346c48176236b73dea7fd79f51b5b18aba8ae73d33d7ad12ea | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `database/migrations/surebet/010_create_b1_candidate_snapshots.sql` | present=yes | sha256=83da55cee8bc46ca6f47b8584aaa81c08794a268f5147fc9bef320201a79b78a | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `database/migrations/surebet/011_create_b1_simulation_results.sql` | present=yes | sha256=3e748cb212558268e675df42f809ce9e3cd29b8527a83fd9c00c5897341d15fa | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `database/migrations/surebet/012_create_b1_private_observation_cycles.sql` | present=yes | sha256=5c4858bb130178460e45226677c6cc74610628badeca3632425c0a0838a474a6 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/runtime/private-paper-runtime.ts` | present=yes | sha256=252e38a52693f3fa598c9ea92a83b184de0c4b29c4ab0bd5c952b750d009c6f5 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/strategy/strategy-ledger.ts` | present=yes | sha256=d05e339a5692a9218f2146c153570ee7d9c8d79ae88282e162b7ece0c0cb5dbc | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/workers/b1-private-observation-jobs.ts` | present=yes | sha256=ee293ef0e7a3edeef6ef6729c987f477f049523ccd3d0b150b874796e032a5cc | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/workers/bounded-job-worker.ts` | present=yes | sha256=3f319fc5ad09636121698b36817f1762c4431dffb775535a2d62e3289b111dd7 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/workers/private-paper-runtime-jobs.ts` | present=yes | sha256=cbf9794410c3c374c7cd22844c5fd1c5fc4e51c7322856b921753479f4b0ca5c | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/persistence/src/repositories/b1-backtest-run-repository.ts` | present=yes | sha256=fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/persistence/src/repositories/b1-private-observation-repository.ts` | present=yes | sha256=a057be720b8d7794b5d3a29cac35879ea555a65f2238e085b98fb7ea730f9941 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS116-R03-014 | `packages/bootstrap/src/workers/private-paper-runtime-jobs.ts` | symbol=PersistedPrivatePaperRuntimeJobPayload / toRuntimeRequest / handler | reviewed_line_range=47-56; 90-217; 586-613 | reviewed_sha256=cbf9794410c3c374c7cd22844c5fd1c5fc4e51c7322856b921753479f4b0ca5c
- BWS116-R03-014 | `packages/bootstrap/src/runtime/private-paper-runtime.ts` | symbol=PrivatePaperRuntimeRequest / validateRestartState / buildNextState | reviewed_line_range=96-104; 981-1060 | reviewed_sha256=252e38a52693f3fa598c9ea92a83b184de0c4b29c4ab0bd5c952b750d009c6f5
- BWS116-R03-014 | `packages/bootstrap/src/strategy/strategy-ledger.ts` | symbol=createPrivatePaperStrategyLedgerEntry | reviewed_line_range=237-267 | reviewed_sha256=d05e339a5692a9218f2146c153570ee7d9c8d79ae88282e162b7ece0c0cb5dbc
- BWS116-R03-014 | `database/migrations/surebet/003_create_strategy_ledger_entries.sql` | symbol=surebet.strategy_ledger_entries | reviewed_line_range=1-60 | reviewed_sha256=b3a7695bfba8fedaa0bb3fccefdde9ae11d893e63a67b493647f0818ce507071
- BWS116-R03-015 | `packages/persistence/src/repositories/b1-backtest-run-repository.ts` | symbol=SurebetB1BacktestRunRepository.create | reviewed_line_range=127-186 | reviewed_sha256=fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04
- BWS116-R03-015 | `packages/persistence/src/repositories/b1-backtest-run-repository.ts` | symbol=createCandidateSnapshot / createSimulationResults / insertSimulationResult | reviewed_line_range=354-448 | reviewed_sha256=fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04
- BWS116-R03-015 | `database/migrations/surebet/009_create_b1_backtest_runs.sql` | symbol=surebet.b1_backtest_runs | reviewed_line_range=1-32 | reviewed_sha256=c5b9b66325ca16346c48176236b73dea7fd79f51b5b18aba8ae73d33d7ad12ea
- BWS116-R03-015 | `database/migrations/surebet/010_create_b1_candidate_snapshots.sql` | symbol=surebet.b1_candidate_snapshots | reviewed_line_range=1-21 | reviewed_sha256=83da55cee8bc46ca6f47b8584aaa81c08794a268f5147fc9bef320201a79b78a
- BWS116-R03-015 | `database/migrations/surebet/011_create_b1_simulation_results.sql` | symbol=surebet.b1_simulation_results | reviewed_line_range=1-20 | reviewed_sha256=3e748cb212558268e675df42f809ce9e3cd29b8527a83fd9c00c5897341d15fa
- BWS116-R03-016 | `packages/bootstrap/src/workers/b1-private-observation-jobs.ts` | symbol=createB1PrivateObservationJobHandler.run | reviewed_line_range=59-137 | reviewed_sha256=ee293ef0e7a3edeef6ef6729c987f477f049523ccd3d0b150b874796e032a5cc
- BWS116-R03-016 | `packages/persistence/src/repositories/b1-private-observation-repository.ts` | symbol=create / complete / block | reviewed_line_range=73-167; 268-293 | reviewed_sha256=a057be720b8d7794b5d3a29cac35879ea555a65f2238e085b98fb7ea730f9941
- BWS116-R03-016 | `packages/bootstrap/src/workers/bounded-job-worker.ts` | symbol=runBoundedWorkerPass terminal dispatch | reviewed_line_range=180-218 | reviewed_sha256=3f319fc5ad09636121698b36817f1762c4431dffb775535a2d62e3289b111dd7
- BWS116-R03-016 | `database/migrations/surebet/012_create_b1_private_observation_cycles.sql` | symbol=surebet.b1_private_observation_cycles | reviewed_line_range=1-37 | reviewed_sha256=5c4858bb130178460e45226677c6cc74610628badeca3632425c0a0838a474a6

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS116-R03-014 — Standard private-paper retries do not reconstruct durable previous cycle state

- Severity: `P1`
- Current behavior: No prior runtime state is persisted or supplied. validateRestartState immediately accepts absence. A changed source produces a different cycle fingerprint and a second ledger identity with the same logical runReferenceId.
- Expected behavior: The same runtimeId/cycleId must be bound to one immutable input digest and prior state; equal replay returns the retained outcome and changed replay is rejected.
- Invariant: The same runtimeId/cycleId must be bound to one immutable input digest and prior state; equal replay returns the retained outcome and changed replay is rejected.
- Root cause: Restart state exists only as an optional in-memory API parameter, not as durable job/cycle authority.
- Trigger: The retry reconstructs the runtime request from the job payload and fetches current source pages.
- Minimal fix boundary: Persist a private-paper cycle aggregate keyed by runtimeId/cycleId with immutable input/cycle digest, reconstruct previousState from durable rows, enforce unique logical run reference, and atomically link ledger outcome to worker terminal publication or make replay return the retained result.
- Regression risks:
- Adding run-reference uniqueness requires resolving any pre-existing duplicates
- Source-currentness semantics remain R01-owned and must not be weakened

### BWS116-R03-015 — B1 backtest persistence commits the parent before children and suppresses repair on replay

- Severity: `P1`
- Current behavior: The parent persists first. On replay, matching parent causes an immediate return and no child completeness check or repair.
- Expected behavior: Parent and all expected children must commit atomically, or replay must verify and deterministically repair/reject an incomplete graph before presenting the run.
- Invariant: Parent and all expected children must commit atomically, or replay must verify and deterministically repair/reject an incomplete graph before presenting the run.
- Root cause: Aggregate persistence was decomposed into independent repository writes without an aggregate transaction or durable completion invariant.
- Trigger: Retry create with the same runId/runHash.
- Minimal fix boundary: Persist the entire run graph in one PostgreSQL transaction, or add expected child counts/digests and a completion state with locked deterministic repair. Readers must reject non-complete aggregates.
- Regression risks:
- One large transaction can increase lock duration; batching must still preserve an atomic completion marker

### BWS116-R03-016 — B1 observation terminality and worker-job terminality can diverge after a crash

- Severity: `P1`
- Current behavior: create returns the existing terminal observation, the backtest parent returns existing, then complete/block throws NOT_STARTED. The bounded worker converts the throw into a dead-letter result, so completed observation and dead-lettered job can coexist.
- Expected behavior: Replay should detect the retained terminal observation and converge the worker job to the matching retained result without rerunning or contradicting terminal state.
- Invariant: Replay should detect the retained terminal observation and converge the worker job to the matching retained result without rerunning or contradicting terminal state.
- Root cause: Observation terminal persistence and worker terminal persistence were implemented as independent state machines without replay convergence.
- Trigger: The same worker job is retried.
- Minimal fix boundary: Make terminal observation methods idempotent-by-payload, persist an authoritative handler outcome, and atomically or recoverably project it to the worker job. Add FK/unique binding between job and observation where appropriate.
- Regression risks:
- Changing blocked handling may affect dead-letter reason semantics and read models


## Allowed edit boundary

- Candidate path set: `database/migrations/surebet/003_create_strategy_ledger_entries.sql`, `database/migrations/surebet/009_create_b1_backtest_runs.sql`, `database/migrations/surebet/010_create_b1_candidate_snapshots.sql`, `database/migrations/surebet/011_create_b1_simulation_results.sql`, `database/migrations/surebet/012_create_b1_private_observation_cycles.sql`, `packages/bootstrap/src/runtime/private-paper-runtime.ts`, `packages/bootstrap/src/strategy/strategy-ledger.ts`, `packages/bootstrap/src/workers/b1-private-observation-jobs.ts`, `packages/bootstrap/src/workers/bounded-job-worker.ts`, `packages/bootstrap/src/workers/private-paper-runtime-jobs.ts`, `packages/persistence/src/repositories/b1-backtest-run-repository.ts`, `packages/persistence/src/repositories/b1-private-observation-repository.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `database/migrations/surebet/012_create_b1_private_observation_cycles.sql` | participating tranches=T10, T12 | predecessor postimage required
- `packages/bootstrap/src/runtime/private-paper-runtime.ts` | participating tranches=T12, T14, T17 | predecessor postimage required
- `packages/bootstrap/src/strategy/strategy-ledger.ts` | participating tranches=T12, T17, T20 | predecessor postimage required
- `packages/bootstrap/src/workers/bounded-job-worker.ts` | participating tranches=T11, T12 | predecessor postimage required
- `packages/persistence/src/repositories/b1-backtest-run-repository.ts` | participating tranches=T12, T13, T20 | predecessor postimage required
- `packages/persistence/src/repositories/b1-private-observation-repository.ts` | participating tranches=T10, T12 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- B1 mathematical contents remain R02/R04-owned
- B1 strategy calculations remain unchanged
- Current parent and child identifiers remain deterministic
- Cycle fingerprint computation remains unchanged
- No claim is made that pinned-record retries diverge
- No live execution
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds
- runtimeEvidence=false and executable=false safeguards remain

## Prerequisites

- Dependency terminal receipts: T03, T07, T08, T10, T14, T16.
- Review prerequisites: ["T03", "T07", "T08", "T10"].
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

- `BWS116-R03-014-TEST-01` | category=persistence_or_migration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-014 | requirement=Crash after runtime result, after ledger insert, and after final checkpoint
- `BWS116-R03-014-TEST-02` | category=persistence_or_migration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-014 | requirement=Equal retry returns the same ledger/result
- `BWS116-R03-014-TEST-03` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-014 | requirement=Changed upstream bytes for same cycle are rejected
- `BWS116-R03-014-TEST-04` | category=persistence_or_migration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-014 | requirement=Fresh process reconstructs previousState from PostgreSQL
- `BWS116-R03-015-TEST-01` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-015 | requirement=Fault after parent insert
- `BWS116-R03-015-TEST-02` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-015 | requirement=Fault after each candidate and simulation insert boundary
- `BWS116-R03-015-TEST-03` | category=restart_or_recovery | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-015 | requirement=Replay repairs or rejects partial graph
- `BWS116-R03-015-TEST-04` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-015 | requirement=Readers never expose incomplete run as complete
- `BWS116-R03-015-TEST-05` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-015 | requirement=Concurrent equal creates converge
- `BWS116-R03-016-TEST-01` | category=restart_or_recovery | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-016 | requirement=Crash after observation complete before job complete
- `BWS116-R03-016-TEST-02` | category=restart_or_recovery | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-016 | requirement=Crash after observation block before job dead-letter
- `BWS116-R03-016-TEST-03` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-016 | requirement=Retry converges without rerunning backtest
- `BWS116-R03-016-TEST-04` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-016 | requirement=Conflicting retained terminal payload is rejected

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS116-R03-014-TEST-01` | category=persistence_or_migration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-014 | requirement=Crash after runtime result, after ledger insert, and after final checkpoint

## Negative and adversarial tests

- No separately classified record; admission must still test failure branches stated by each finding

## Concurrency, cancellation, crash, and restart tests

- `BWS116-R03-015-TEST-03` | category=restart_or_recovery | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-015 | requirement=Replay repairs or rejects partial graph
- `BWS116-R03-015-TEST-05` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-015 | requirement=Concurrent equal creates converge
- `BWS116-R03-016-TEST-01` | category=restart_or_recovery | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-016 | requirement=Crash after observation complete before job complete
- `BWS116-R03-016-TEST-02` | category=restart_or_recovery | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-016 | requirement=Crash after observation block before job dead-letter

## Environment proof

- DISPOSABLE_POSTGRESQL_AND_NODE20: 13 requirements

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

Acceptance authority: ["Previous state is reconstructed durably", "B1 parent/children repair after crash", "Observation and worker terminality share an aggregate completion protocol"]

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W2-T17` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
