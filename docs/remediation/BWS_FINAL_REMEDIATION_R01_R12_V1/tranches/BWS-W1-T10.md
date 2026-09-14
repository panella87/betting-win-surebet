
# BWS-W1-T10 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W1-T10
CAMPAIGN_ORDER: 19
STAGE: S3
PRIMARY_OWNER: R03
SECONDARY_REVIEWERS: R01, R04, R06, R07, R09, R10, R11
ISSUE_IDS: BWS116-R03-006, BWS116-R03-007, BWS116-R03-008, BWS116-R03-009, BWS116-R03-010, BWS116-R03-017
SEVERITY_COUNTS: {"P1": 6}
DEPENDENCIES: T01, T03, T06, T09
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen review/finding baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; active campaign authority is pinned by activation/immutable-authority.sha256; exact current numbered archive or checkout, extracted-tree digest, Git identity, source paths, hashes, and modes must be captured in an external audit or admission receipt and reverified before editing; repository documentation does not self-attest a rolling numbered ZIP
CURRENT_SOURCE_PATH_CANDIDATES: database/migrations/surebet/001_create_upstream_locks_and_import_runs.sql, database/migrations/surebet/004_create_worker_jobs.sql, database/migrations/surebet/012_create_b1_private_observation_cycles.sql, docs/035_continuous_service_supervisor_contract.md, packages/persistence/src/repositories/b1-private-observation-repository.ts, packages/persistence/src/repositories/b1-upstream-convergence-repository.ts, packages/persistence/src/repositories/import-run-repository.ts, packages/persistence/src/repositories/private-paper-runtime-scheduler-checkpoint-repository.ts, packages/persistence/src/repositories/strategy-ledger-repository.ts, packages/persistence/src/repositories/upstream-api-convergence-repository.ts, packages/persistence/src/repositories/upstream-export-convergence-repository.ts, packages/persistence/src/repositories/upstream-lock-repository.ts, packages/persistence/src/repositories/worker-job-repository.ts
SYMBOLS_TO_REVERIFY: 26 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: database/migrations/surebet/004_create_worker_jobs.sql, database/migrations/surebet/012_create_b1_private_observation_cycles.sql, docs/035_continuous_service_supervisor_contract.md, packages/persistence/src/repositories/b1-private-observation-repository.ts, packages/persistence/src/repositories/worker-job-repository.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites `["T01", "T03", "T06"]`
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 27 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 1 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 3 classified records below
CONCURRENCY_OR_CRASH_TESTS: 12 classified records below
ENVIRONMENT_PROOF: {"DISPOSABLE_POSTGRESQL_AND_NODE20": 27}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: ["Atomic create-or-compare", "All transitions carry expected state and lease fence", "Database time and monotonic epochs own leases", "Retry and timestamp invariants enforced"]
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": false, "bws_710": false, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W1-T11 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `database/migrations/surebet/001_create_upstream_locks_and_import_runs.sql` | present=yes | sha256=9e42a36b06adc858c25e72c4fd6ab41500cdfdcbbb3e0a7ae556efd2ec771584 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `database/migrations/surebet/004_create_worker_jobs.sql` | present=yes | sha256=9756445dbfbdac6226413098d1253527578d9420543287842c30d034df162b9c | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `database/migrations/surebet/012_create_b1_private_observation_cycles.sql` | present=yes | sha256=5c4858bb130178460e45226677c6cc74610628badeca3632425c0a0838a474a6 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `docs/035_continuous_service_supervisor_contract.md` | present=yes | sha256=cae4ce541c65848974de8c4568e72b6d2d3d151d9f2c3eaf52cb50e6777c8505 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/persistence/src/repositories/b1-private-observation-repository.ts` | present=yes | sha256=a057be720b8d7794b5d3a29cac35879ea555a65f2238e085b98fb7ea730f9941 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/persistence/src/repositories/b1-upstream-convergence-repository.ts` | present=yes | sha256=468cde29f264349925fe65e33d5b7e05fb34390877bb0f2503345154160d6884 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/persistence/src/repositories/import-run-repository.ts` | present=yes | sha256=9bb1a79b2b27ea6cd3eaaf38cb22bb20148615a2400ff929b834ad2dbd08e00b | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/persistence/src/repositories/private-paper-runtime-scheduler-checkpoint-repository.ts` | present=yes | sha256=fd997e6c563e93a0055066ae7ffc64173402495429983e0574b6e929aa743489 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/persistence/src/repositories/strategy-ledger-repository.ts` | present=yes | sha256=a3874447d9cf6334eafd4eaf1e7a45c3cd95b48fe865fcc68ba1f5583ca32528 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/persistence/src/repositories/upstream-api-convergence-repository.ts` | present=yes | sha256=298c9e2b2d874f5e11e7278893f00acaaaf16b48a47fde0cab41c33e59017ba0 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/persistence/src/repositories/upstream-export-convergence-repository.ts` | present=yes | sha256=dbfac37a5aac9e6139532312a0635f25f655c8739782e186f72bc6717bd79600 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/persistence/src/repositories/upstream-lock-repository.ts` | present=yes | sha256=c77663c55b41255a4c1f455012d5427b55f8a5cf1c733e7b800cc334f407a8bc | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/persistence/src/repositories/worker-job-repository.ts` | present=yes | sha256=263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS116-R03-006 | `packages/persistence/src/repositories/upstream-lock-repository.ts` | symbol=SurebetUpstreamLockRepository.put | reviewed_line_range=32-88 | reviewed_sha256=c77663c55b41255a4c1f455012d5427b55f8a5cf1c733e7b800cc334f407a8bc
- BWS116-R03-006 | `packages/persistence/src/repositories/import-run-repository.ts` | symbol=SurebetImportRunRepository.create | reviewed_line_range=60-115 | reviewed_sha256=9bb1a79b2b27ea6cd3eaaf38cb22bb20148615a2400ff929b834ad2dbd08e00b
- BWS116-R03-006 | `packages/persistence/src/repositories/strategy-ledger-repository.ts` | symbol=SurebetStrategyLedgerRepository.create | reviewed_line_range=56-143 | reviewed_sha256=a3874447d9cf6334eafd4eaf1e7a45c3cd95b48fe865fcc68ba1f5583ca32528
- BWS116-R03-006 | `packages/persistence/src/repositories/worker-job-repository.ts` | symbol=SurebetWorkerJobRepository.create | reviewed_line_range=220-270 | reviewed_sha256=263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e
- BWS116-R03-006 | `packages/persistence/src/repositories/private-paper-runtime-scheduler-checkpoint-repository.ts` | symbol=SurebetPrivatePaperRuntimeSchedulerCheckpointRepository.create | reviewed_line_range=74-121 | reviewed_sha256=fd997e6c563e93a0055066ae7ffc64173402495429983e0574b6e929aa743489
- BWS116-R03-006 | `packages/persistence/src/repositories/b1-upstream-convergence-repository.ts` | symbol=SurebetB1UpstreamConvergenceRepository.create | reviewed_line_range=59-110 | reviewed_sha256=468cde29f264349925fe65e33d5b7e05fb34390877bb0f2503345154160d6884
- BWS116-R03-007 | `packages/persistence/src/repositories/import-run-repository.ts` | symbol=SurebetImportRunRepository.finalize | reviewed_line_range=117-157 | reviewed_sha256=9bb1a79b2b27ea6cd3eaaf38cb22bb20148615a2400ff929b834ad2dbd08e00b
- BWS116-R03-007 | `packages/persistence/src/repositories/upstream-api-convergence-repository.ts` | symbol=SurebetUpstreamApiConvergenceRepository.advance | reviewed_line_range=149-198 | reviewed_sha256=298c9e2b2d874f5e11e7278893f00acaaaf16b48a47fde0cab41c33e59017ba0
- BWS116-R03-007 | `packages/persistence/src/repositories/upstream-export-convergence-repository.ts` | symbol=SurebetUpstreamExportConvergenceRepository.advance | reviewed_line_range=115-164 | reviewed_sha256=dbfac37a5aac9e6139532312a0635f25f655c8739782e186f72bc6717bd79600
- BWS116-R03-007 | `packages/persistence/src/repositories/private-paper-runtime-scheduler-checkpoint-repository.ts` | symbol=SurebetPrivatePaperRuntimeSchedulerCheckpointRepository.advance | reviewed_line_range=201-236 | reviewed_sha256=fd997e6c563e93a0055066ae7ffc64173402495429983e0574b6e929aa743489
- BWS116-R03-007 | `packages/persistence/src/repositories/b1-private-observation-repository.ts` | symbol=complete / block | reviewed_line_range=119-167 | reviewed_sha256=a057be720b8d7794b5d3a29cac35879ea555a65f2238e085b98fb7ea730f9941
- BWS116-R03-008 | `packages/persistence/src/repositories/worker-job-repository.ts` | symbol=heartbeatLease / recordCheckpoint | reviewed_line_range=438-546 | reviewed_sha256=263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e
- BWS116-R03-008 | `packages/persistence/src/repositories/worker-job-repository.ts` | symbol=complete / fail | reviewed_line_range=609-692 | reviewed_sha256=263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e
- BWS116-R03-008 | `packages/persistence/src/repositories/worker-job-repository.ts` | symbol=requireOwnedActiveLease | reviewed_line_range=844-879 | reviewed_sha256=263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e
- BWS116-R03-008 | `packages/persistence/src/repositories/worker-job-repository.ts` | symbol=deadLetterOwnedJob | reviewed_line_range=882-962 | reviewed_sha256=263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e
- BWS116-R03-009 | `packages/persistence/src/repositories/worker-job-repository.ts` | symbol=claimNext | reviewed_line_range=355-435 | reviewed_sha256=263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e
- BWS116-R03-009 | `packages/persistence/src/repositories/worker-job-repository.ts` | symbol=validateClaimRequest / validateHeartbeatRequest | reviewed_line_range=1166-1200 | reviewed_sha256=263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e
- BWS116-R03-009 | `packages/persistence/src/repositories/worker-job-repository.ts` | symbol=requireOwnedActiveLease / reapExpiredLeases | reviewed_line_range=751-879 | reviewed_sha256=263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e
- BWS116-R03-010 | `packages/persistence/src/repositories/worker-job-repository.ts` | symbol=reapExpiredLeases / deadLetterExpiredLease | reviewed_line_range=751-830; 965-1037 | reviewed_sha256=263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e
- BWS116-R03-010 | `docs/035_continuous_service_supervisor_contract.md` | symbol=Required worker behavior | reviewed_line_range=65-72 | reviewed_sha256=cae4ce541c65848974de8c4568e72b6d2d3d151d9f2c3eaf52cb50e6777c8505
- BWS116-R03-010 | `database/migrations/surebet/004_create_worker_jobs.sql` | symbol=surebet.worker_jobs | reviewed_line_range=1-111 | reviewed_sha256=9756445dbfbdac6226413098d1253527578d9420543287842c30d034df162b9c
- BWS116-R03-017 | `database/migrations/surebet/001_create_upstream_locks_and_import_runs.sql` | symbol=surebet.import_runs | reviewed_line_range=16-36 | reviewed_sha256=9e42a36b06adc858c25e72c4fd6ab41500cdfdcbbb3e0a7ae556efd2ec771584
- BWS116-R03-017 | `packages/persistence/src/repositories/import-run-repository.ts` | symbol=validatePendingRecord / validateFinalizeRecord | reviewed_line_range=194-230 | reviewed_sha256=9bb1a79b2b27ea6cd3eaaf38cb22bb20148615a2400ff929b834ad2dbd08e00b
- BWS116-R03-017 | `database/migrations/surebet/004_create_worker_jobs.sql` | symbol=surebet.worker_jobs and checkpoints | reviewed_line_range=1-153 | reviewed_sha256=9756445dbfbdac6226413098d1253527578d9420543287842c30d034df162b9c
- BWS116-R03-017 | `database/migrations/surebet/012_create_b1_private_observation_cycles.sql` | symbol=surebet.b1_private_observation_cycles | reviewed_line_range=1-34 | reviewed_sha256=5c4858bb130178460e45226677c6cc74610628badeca3632425c0a0838a474a6
- BWS116-R03-017 | `packages/persistence/src/repositories/b1-private-observation-repository.ts` | symbol=validateCreateRecord / validateCompleteRecord / validateBlockRecord | reviewed_line_range=220-249; 303-322 | reviewed_sha256=a057be720b8d7794b5d3a29cac35879ea555a65f2238e085b98fb7ea730f9941

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS116-R03-006 — Repository idempotency claims use read-then-insert races instead of atomic create-or-compare operations

- Severity: `P1`
- Current behavior: One INSERT wins and another surfaces a raw wrapped psql uniqueness failure. The loser does not re-read and compare the committed row.
- Expected behavior: Equal requests should converge to one retained record; conflicting payloads should return the repository-specific deterministic conflict code.
- Invariant: Equal requests should converge to one retained record; conflicting payloads should return the repository-specific deterministic conflict code.
- Root cause: Idempotency is implemented as optimistic preflight reads rather than a database atomic claim keyed by identity and immutable payload digest.
- Trigger: Both existence checks complete before either INSERT commits.
- Minimal fix boundary: Use one database round trip per create: INSERT ... ON CONFLICT DO NOTHING RETURNING, then fetch and compare in the same transaction; or encode identity plus immutable digest in a conflict-aware UPSERT that never overwrites.
- Regression risks:
- Incorrect ON CONFLICT targets could mask secondary-identity conflicts
- Automatic overwrite must remain prohibited

### BWS116-R03-007 — Finalization and checkpoint advances validate expected state in one session but update by ID in another

- Severity: `P1`
- Current behavior: The UPDATE predicates contain only the primary ID. Both callers can pass preflight validation and the later writer can replace the earlier terminal outcome or advance from stale state.
- Expected behavior: Expected state must be part of the UPDATE predicate and exactly one transition may succeed; retries must compare the retained terminal payload.
- Invariant: Expected state must be part of the UPDATE predicate and exactly one transition may succeed; retries must compare the retained terminal payload.
- Root cause: Optimistic concurrency is enforced only in TypeScript, outside the database transaction that owns the state.
- Trigger: Both precondition reads observe the same current state, after which the updates execute in a different order.
- Minimal fix boundary: Move each transition into one SQL statement or transaction with current status/cursor/version in WHERE, use RETURNING, distinguish zero-row stale from missing, and compare retained terminal payloads for idempotent replay.
- Regression risks:
- Adding strict CAS can expose callers that currently depend on silent last-writer-wins behavior

### BWS116-R03-008 — Worker heartbeat, checkpoint, completion, and retry transitions omit the lease fence from their mutation predicates

- Severity: `P1`
- Current behavior: Heartbeat, checkpoint job update, completion, and retry use WHERE job_id only. A stale operation can alter a later lease or race a conflicting transition; checkpoint insertion can publish after the job became terminal.
- Expected behavior: Every lease-authorized mutation must atomically require status=leased, exact owner, exact token or epoch, and active lease in the same SQL statement.
- Invariant: Every lease-authorized mutation must atomically require status=leased, exact owner, exact token or epoch, and active lease in the same SQL statement.
- Root cause: Lease ownership and state mutation are split across psql sessions instead of encoded in one conditional database transition.
- Trigger: The worker passes requireOwnedActiveLease, then another transaction changes the row before the worker mutation executes.
- Minimal fix boundary: Use conditional UPDATE/CTE statements with job_id, status, lease_owner, lease_token, lease expiry, and optionally monotonic lease_epoch; use RETURNING and zero-row stale-owner classification. Keep checkpoint insert plus job metadata update atomic and fenced.
- Regression risks:
- Stricter fencing can surface latent late callbacks as errors; callers must treat them as stale completion, not retryable work

### BWS116-R03-009 — Worker availability and lease validity are controlled by caller timestamps with inconsistent expiry boundaries

- Severity: `P1`
- Current behavior: A future caller clock can claim retry work early and create long leases; a past clock can authorize late completion against real time or regress heartbeat fields. At equality, requireOwnedActiveLease accepts while reaper expires.
- Expected behavior: PostgreSQL should own lease-now and monotonic lease epochs, with one consistent half-open validity rule; business timestamps should be validated for chronology.
- Invariant: PostgreSQL should own lease-now and monotonic lease epochs, with one consistent half-open validity rule; business timestamps should be validated for chronology.
- Root cause: Deterministic test clocks were elevated into production concurrency authority instead of separating observable event time from database lease time.
- Trigger: Claim, heartbeat, completion, failure, or reap uses the supplied timestamp.
- Minimal fix boundary: Use database-generated lease timestamps and a monotonic lease epoch/fencing token; define validity as now < expires_at consistently; reject timestamp regression and preserve injected clocks only for non-authoritative evidence fields.
- Regression risks:
- Changing time authority can affect deterministic test fixtures and requires explicit database clock control in tests

### BWS116-R03-010 — Expired leases are always dead-lettered even when retry budget remains

- Severity: `P1`
- Current behavior: The reaper unconditionally writes dead_lettered with SUREBET_WORKER_JOB_LEASE_EXPIRED. No remaining retry calculation is performed.
- Expected behavior: The durable policy must distinguish abandoned/unknown work, apply the configured retry budget when replay is safe, and dead-letter only on exhaustion or an explicit non-replayable policy.
- Invariant: The durable policy must distinguish abandoned/unknown work, apply the configured retry budget when replay is safe, and dead-letter only on exhaustion or an explicit non-replayable policy.
- Root cause: Lease expiration policy is hard-coded as terminal rather than derived from retry budget and idempotency/replay safety.
- Trigger: The next worker pass invokes reapExpiredLeases.
- Minimal fix boundary: Add an explicit atomic expired-lease transition: retry_wait with next availability while budget remains and replay is authorized; dead_lettered only when exhausted or policy says outcome is unknown/non-replayable. Preserve prior lease evidence.
- Regression risks:
- Automatic replay is unsafe until the idempotency and fencing findings are fixed; implementation order must place those first

### BWS116-R03-017 — Durable lifecycle tables accept impossible timestamp orderings

- Severity: `P1`
- Current behavior: Rows can satisfy all current constraints while completed_at precedes started_at, B1 completion precedes cycle start, or checkpoints/heartbeats regress.
- Expected behavior: Application validation and PostgreSQL CHECK constraints must preserve causal ordering, while retaining explicit source/event timestamps separately when out-of-order arrival is legitimate.
- Invariant: Application validation and PostgreSQL CHECK constraints must preserve causal ordering, while retaining explicit source/event timestamps separately when out-of-order arrival is legitimate.
- Root cause: Timestamp syntax validation was not paired with semantic chronology constraints at repository or schema boundaries.
- Trigger: Create/finalize/heartbeat/checkpoint/complete with a terminal timestamp before the start or prior durable event.
- Minimal fix boundary: Add explicit chronology validation and CHECK constraints for each state machine; use database authoritative transition time where appropriate; preserve source occurrence time separately from receive/persist time.
- Regression risks:
- Existing test fixtures with equal or synthetic timestamps may need clarification
- Source event timestamps must not be conflated with database transition timestamps


## Allowed edit boundary

- Candidate path set: `database/migrations/surebet/001_create_upstream_locks_and_import_runs.sql`, `database/migrations/surebet/004_create_worker_jobs.sql`, `database/migrations/surebet/012_create_b1_private_observation_cycles.sql`, `docs/035_continuous_service_supervisor_contract.md`, `packages/persistence/src/repositories/b1-private-observation-repository.ts`, `packages/persistence/src/repositories/b1-upstream-convergence-repository.ts`, `packages/persistence/src/repositories/import-run-repository.ts`, `packages/persistence/src/repositories/private-paper-runtime-scheduler-checkpoint-repository.ts`, `packages/persistence/src/repositories/strategy-ledger-repository.ts`, `packages/persistence/src/repositories/upstream-api-convergence-repository.ts`, `packages/persistence/src/repositories/upstream-export-convergence-repository.ts`, `packages/persistence/src/repositories/upstream-lock-repository.ts`, `packages/persistence/src/repositories/worker-job-repository.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `database/migrations/surebet/004_create_worker_jobs.sql` | participating tranches=T10, T32 | predecessor postimage required
- `database/migrations/surebet/012_create_b1_private_observation_cycles.sql` | participating tranches=T10, T12 | predecessor postimage required
- `docs/035_continuous_service_supervisor_contract.md` | participating tranches=T10, T21, T23 | predecessor postimage required
- `packages/persistence/src/repositories/b1-private-observation-repository.ts` | participating tranches=T10, T12 | predecessor postimage required
- `packages/persistence/src/repositories/worker-job-repository.ts` | participating tranches=T10, T13 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- Atomic FOR UPDATE SKIP LOCKED claim remains a safeguard
- Dead-letter evidence table remains required
- Dead-letter owner/token CAS remains a safeguard
- Existing primary and unique constraints remain useful and must not be removed
- Fixed-point numeric persistence is unchanged
- ISO-8601 syntax validation remains useful
- No live execution path is authorized
- Pure quote/source currentness remains R01/R02-owned
- Pure strategy identity composition remains R02-owned
- R02 mathematical decisions
- Read model ordering is unchanged
- Timestamp storage remains timestamptz
- Upstream semantic validity remains R01-owned
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T01, T03, T06, T09.
- Review prerequisites: ["T01", "T03", "T06"].
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

- `BWS116-R03-006-TEST-01` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-006 | requirement=Concurrent equal creates converge to one success result
- `BWS116-R03-006-TEST-02` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-006 | requirement=Concurrent different creates return the typed conflict
- `BWS116-R03-006-TEST-03` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-006 | requirement=Unique secondary identities such as fingerprint/report hash are classified deterministically
- `BWS116-R03-006-TEST-04` | category=restart_or_recovery | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-006 | requirement=Scheduler/job restart uses the production repository, not an in-memory fake
- `BWS116-R03-007-TEST-01` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-007 | requirement=Two concurrent import finalizers with equal and conflicting outcomes
- `BWS116-R03-007-TEST-02` | category=upstream_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-007 | requirement=Two API/export cursor advances from one expected cursor
- `BWS116-R03-007-TEST-03` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-007 | requirement=Two scheduler instances advancing one checkpoint
- `BWS116-R03-007-TEST-04` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-007 | requirement=Concurrent B1 complete versus block
- `BWS116-R03-008-TEST-01` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-008 | requirement=Old worker completion after new claim
- `BWS116-R03-008-TEST-02` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-008 | requirement=Heartbeat racing retry and replacement claim
- `BWS116-R03-008-TEST-03` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-008 | requirement=Checkpoint racing success/dead-letter
- `BWS116-R03-008-TEST-04` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-008 | requirement=Completion versus retry race
- `BWS116-R03-008-TEST-05` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-008 | requirement=Exactly-once release of lease fields
- `BWS116-R03-009-TEST-01` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-009 | requirement=Future-skew claim cannot claim not-yet-available work
- `BWS116-R03-009-TEST-02` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-009 | requirement=Past-skew completion after real expiry is rejected
- `BWS116-R03-009-TEST-03` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-009 | requirement=Exact expiry instant has one result
- `BWS116-R03-009-TEST-04` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-009 | requirement=Heartbeat cannot regress last_heartbeat_at or lease_expires_at
- `BWS116-R03-010-TEST-01` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-010 | requirement=Expired first attempt with remaining retries moves to retry_wait
- `BWS116-R03-010-TEST-02` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-010 | requirement=Expired final attempt dead-letters
- `BWS116-R03-010-TEST-03` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-010 | requirement=Concurrent reapers transition once
- `BWS116-R03-010-TEST-04` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-010 | requirement=Unknown-side-effect policy remains fail-closed
- `BWS116-R03-010-TEST-05` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-010 | requirement=Recovered job cannot be finalized by stale worker
- `BWS116-R03-017-TEST-01` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-017 | requirement=Import requested/start/complete permutations
- `BWS116-R03-017-TEST-02` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-017 | requirement=Worker claim/heartbeat/checkpoint/complete regression
- `BWS116-R03-017-TEST-03` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-017 | requirement=B1 cycle completion before start
- `BWS116-R03-017-TEST-04` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-017 | requirement=Boundary equality cases
- `BWS116-R03-017-TEST-05` | category=persistence_or_migration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-017 | requirement=Migration of any existing invalid rows is fail-closed and reported

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS116-R03-006-TEST-04` | category=restart_or_recovery | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-006 | requirement=Scheduler/job restart uses the production repository, not an in-memory fake

## Negative and adversarial tests

- `BWS116-R03-010-TEST-04` | category=unit_or_integration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-010 | requirement=Unknown-side-effect policy remains fail-closed
- `BWS116-R03-010-TEST-05` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-010 | requirement=Recovered job cannot be finalized by stale worker
- `BWS116-R03-017-TEST-05` | category=persistence_or_migration | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-017 | requirement=Migration of any existing invalid rows is fail-closed and reported

## Concurrency, cancellation, crash, and restart tests

- `BWS116-R03-006-TEST-01` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-006 | requirement=Concurrent equal creates converge to one success result
- `BWS116-R03-006-TEST-02` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-006 | requirement=Concurrent different creates return the typed conflict
- `BWS116-R03-006-TEST-04` | category=restart_or_recovery | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-006 | requirement=Scheduler/job restart uses the production repository, not an in-memory fake
- `BWS116-R03-007-TEST-01` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-007 | requirement=Two concurrent import finalizers with equal and conflicting outcomes
- `BWS116-R03-007-TEST-04` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-007 | requirement=Concurrent B1 complete versus block
- `BWS116-R03-008-TEST-01` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-008 | requirement=Old worker completion after new claim
- `BWS116-R03-008-TEST-04` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-008 | requirement=Completion versus retry race
- `BWS116-R03-008-TEST-05` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-008 | requirement=Exactly-once release of lease fields
- `BWS116-R03-009-TEST-04` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-009 | requirement=Heartbeat cannot regress last_heartbeat_at or lease_expires_at
- `BWS116-R03-010-TEST-03` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-010 | requirement=Concurrent reapers transition once
- `BWS116-R03-010-TEST-05` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-010 | requirement=Recovered job cannot be finalized by stale worker
- `BWS116-R03-017-TEST-02` | category=concurrency_or_fencing | environment=DISPOSABLE_POSTGRESQL_AND_NODE20 | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R03-017 | requirement=Worker claim/heartbeat/checkpoint/complete regression

## Environment proof

- DISPOSABLE_POSTGRESQL_AND_NODE20: 27 requirements

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

Acceptance authority: ["Atomic create-or-compare", "All transitions carry expected state and lease fence", "Database time and monotonic epochs own leases", "Retry and timestamp invariants enforced"]

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W1-T11` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
