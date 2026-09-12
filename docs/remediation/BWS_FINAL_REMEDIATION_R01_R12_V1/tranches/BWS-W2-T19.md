
# BWS-W2-T19 implementation packet

> Documentation status: `PROPOSED_NOT_ACTIVE` for T39 and `NOT_ADMITTED` for all tranches. This packet does not authorize source mutation.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W2-T19
CAMPAIGN_ORDER: 37
STAGE: S5
PRIMARY_OWNER: R05
SECONDARY_REVIEWERS: R01, R03, R06, R07, R08, R10, R11
ISSUE_IDS: BWS118-R05-002, BWS118-R05-003, BWS118-R05-004, BWS118-R05-005, BWS118-R05-007, BWS118-R05-008
SEVERITY_COUNTS: {"P1": 5, "P2": 1}
DEPENDENCIES: T13, T18
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; exact 771-member archive inventory; independently computed inventory digest=b81ff807e4c230bff96fe1fa58f73a2d4bac803ebd7fa58b843cdcb83499f7f0
CURRENT_SOURCE_PATH_CANDIDATES: apps/web/src/api/client.ts, apps/web/src/api/contracts.ts, apps/web/src/api/models.ts, apps/web/src/app/shell.tsx, packages/bootstrap/src/api/bws-read-only-query-service.ts, packages/bootstrap/src/operations/runtime-applications.ts
SYMBOLS_TO_REVERIFY: 19 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: apps/web/src/api/client.ts, apps/web/src/api/models.ts, apps/web/src/app/shell.tsx, packages/bootstrap/src/api/bws-read-only-query-service.ts, packages/bootstrap/src/operations/runtime-applications.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites `- BWS-W1-T03`
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 26 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 26 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 4 classified records below
CONCURRENCY_OR_CRASH_TESTS: 6 classified records below
ENVIRONMENT_PROOF: {"NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED": 26}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: - Authenticated/versioned cursors own one snapshot
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": false, "bws_710": false, "deployment": false, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W2-T20 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `apps/web/src/api/client.ts` | present=yes | sha256=8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `apps/web/src/api/contracts.ts` | present=yes | sha256=11c9bcc7cacad4505c7d24f5e66c819723bc9165b1b65c96271b449df2bc3417 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `apps/web/src/api/models.ts` | present=yes | sha256=3b08b0fe2d3559cc1e51bf3f570ea43b3b3c4379234ceaec33abe7d9c1c034c3 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `apps/web/src/app/shell.tsx` | present=yes | sha256=ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` | present=yes | sha256=896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/runtime-applications.ts` | present=yes | sha256=216b980403a59909b07a27fb475d22cf6ee35b41364fd0bb46c510d17d9e0322 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS118-R05-002 | `packages/bootstrap/src/api/bws-read-only-query-service.ts` | symbol=CursorPayload | reviewed_line_range=306-310 | reviewed_sha256=896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424
- BWS118-R05-002 | `packages/bootstrap/src/api/bws-read-only-query-service.ts` | symbol=queryB1BacktestRuns / queryStrategyLedger cursor production | reviewed_line_range=397-473 | reviewed_sha256=896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424
- BWS118-R05-002 | `packages/bootstrap/src/api/bws-read-only-query-service.ts` | symbol=hashCursorScope / decodeCursor / encodeCursor | reviewed_line_range=1991-2052 | reviewed_sha256=896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424
- BWS118-R05-003 | `packages/bootstrap/src/api/bws-read-only-query-service.ts` | symbol=BwsPrivatePaperRuntimeCycleQueryRequest | reviewed_line_range=152-164 | reviewed_sha256=896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424
- BWS118-R05-003 | `packages/bootstrap/src/api/bws-read-only-query-service.ts` | symbol=queryPrivatePaperRuntimeCycles | reviewed_line_range=581-678 | reviewed_sha256=896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424
- BWS118-R05-004 | `packages/bootstrap/src/api/bws-read-only-query-service.ts` | symbol=queryPrivatePaperRuntimeCycles scheduler/cycle nested scan | reviewed_line_range=592-660 | reviewed_sha256=896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424
- BWS118-R05-004 | `packages/bootstrap/src/api/bws-read-only-query-service.ts` | symbol=buildPrivatePaperRuntimeCycleItem | reviewed_line_range=853-945 | reviewed_sha256=896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424
- BWS118-R05-004 | `packages/bootstrap/src/api/bws-read-only-query-service.ts` | symbol=findPrivatePaperRuntimeStrategyLedger / findCompletedCycleImportRun | reviewed_line_range=1041-1117 | reviewed_sha256=896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424
- BWS118-R05-004 | `packages/bootstrap/src/operations/runtime-applications.ts` | symbol=DEFAULT_API_QUERY_MAX_PAGE_SIZE / createBwsReadOnlyQueryService | reviewed_line_range=58,203-207 | reviewed_sha256=216b980403a59909b07a27fb475d22cf6ee35b41364fd0bb46c510d17d9e0322
- BWS118-R05-005 | `apps/web/src/api/client.ts` | symbol=loadBwsOperatorCockpitSnapshot | reviewed_line_range=1240-1325 | reviewed_sha256=8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97
- BWS118-R05-005 | `apps/web/src/api/models.ts` | symbol=buildBwsOperatorCockpitPageModel count cards and rows | reviewed_line_range=657-801 | reviewed_sha256=3b08b0fe2d3559cc1e51bf3f570ea43b3b3c4379234ceaec33abe7d9c1c034c3
- BWS118-R05-005 | `apps/web/src/app/shell.tsx` | symbol=filterRows / paginateRows / local page model | reviewed_line_range=116-188 | reviewed_sha256=ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189
- BWS118-R05-005 | `apps/web/src/app/shell.tsx` | symbol=empty table and local pager | reviewed_line_range=460-518 | reviewed_sha256=ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189
- BWS118-R05-007 | `apps/web/src/api/contracts.ts` | symbol=BwsOperatorCockpitSnapshot | reviewed_line_range=117-127 | reviewed_sha256=11c9bcc7cacad4505c7d24f5e66c819723bc9165b1b65c96271b449df2bc3417
- BWS118-R05-007 | `apps/web/src/api/client.ts` | symbol=loadBwsOperatorCockpitSnapshot Promise.all aggregation | reviewed_line_range=1267-1324 | reviewed_sha256=8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97
- BWS118-R05-007 | `packages/bootstrap/src/api/bws-read-only-query-service.ts` | symbol=BwsReadOnlyQueryResponse | reviewed_line_range=110-115 | reviewed_sha256=896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424
- BWS118-R05-008 | `packages/bootstrap/src/api/bws-read-only-query-service.ts` | symbol=validateGeneratedAt | reviewed_line_range=1419-1428 | reviewed_sha256=896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424
- BWS118-R05-008 | `apps/web/src/api/client.ts` | symbol=assertReadOnlyQueryResponse generatedAt parsing | reviewed_line_range=692-717 | reviewed_sha256=8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97
- BWS118-R05-008 | `apps/web/src/app/shell.tsx` | symbol=load lifecycle effect | reviewed_line_range=144-180 | reviewed_sha256=ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS118-R05-002 — Pagination cursors are caller-forgeable position tokens with no immutable snapshot, version, or high-watermark binding

- Severity: `P1`
- Current behavior: The token is plain base64url JSON with only resource, filtersSha256, and afterId. The SHA-256 is unkeyed and recomputable by any caller. There is no snapshot ID, high-watermark, sort version, expiry, or server-side continuation state.
- Expected behavior: A continuation token must be server-authenticated or otherwise non-malleable and must bind resource, exact query/sort contract, API version, and one immutable snapshot/high-watermark so continuation is deterministic and restart-safe.
- Invariant: A continuation token must be server-authenticated or otherwise non-malleable and must bind resource, exact query/sort contract, API version, and one immutable snapshot/high-watermark so continuation is deterministic and restart-safe.
- Root cause: The query layer treats an opaque encoding plus public scope hash as cursor integrity and treats live keyset position as snapshot continuity.
- Trigger: Reuse a cursor after rows are inserted/reordered, or synthesize base64url JSON containing an arbitrary afterId and the public filter hash.
- Minimal fix boundary: At the R05 query boundary, introduce a versioned cursor contract bound to canonical sort and immutable high-watermark/snapshot identity; authenticate or server-register it; reject expired, unknown, or mismatched continuations. Hand database snapshot/fencing implementation to R03 where required.
- Regression risks:
- Stateful cursors add retention and cleanup needs.
- Snapshot semantics may require PostgreSQL support and a migration.
- Cursor format changes require explicit versioning rather than silent compatibility.

### BWS118-R05-003 — Private-paper runtime-cycle queries scan only a recent heuristic window and can return a false empty page with no continuation or truncation signal

- Severity: `P1`
- Current behavior: The request has no cursor. For each scheduler, only the last pageSize*4 cycle numbers are inspected, then the global results are sliced to pageSize. The response never emits nextCursor, scanned range, truncation, or completeness.
- Expected behavior: The API must either query the entire bounded keyspace using deterministic continuation or explicitly return partial/truncated/incomplete state and a continuation mechanism. An empty page may mean no matching row only after the searchable snapshot is exhausted.
- Invariant: The API must either query the entire bounded keyspace using deterministic continuation or explicitly return partial/truncated/incomplete state and a continuation mechanism. An empty page may mean no matching row only after the searchable snapshot is exhausted.
- Root cause: Runtime-cycle projection is implemented as recent-window sampling but uses the same successful page contract as an exhaustive filtered query.
- Trigger: Query pageSize=1 for a filter whose newest match is cycle 6 while the scheduler upper cycle is 10.
- Minimal fix boundary: Replace heuristic sampling with a deterministic repository/read-model query and continuation, or introduce an explicit bounded scan contract carrying searched range, truncation, partial/completeness status, and continuation. Do not change worker/job durable state in R05.
- Regression risks:
- A new read model may require indexes or schema support.
- Changing from sampling to exhaustive query can expose large historical datasets.
- Continuation order must remain deterministic across scheduler IDs and timestamps.

### BWS118-R05-004 — Maximum-size runtime-cycle reads expand into at least 50,000 synchronous dependency calls before optional provenance work

- Severity: `P2`
- Current behavior: The service lists up to pageSize*4 schedulers and scans pageSize*4 cycles per scheduler. Each candidate cycle performs upstream-checkpoint get, upstream-lock get, worker-job get, and two strategy-ledger lists before optional checkpoint/dead-letter/import expansion.
- Expected behavior: One page request must have a declared and enforced operation/query budget with set-based reads, bounded fanout, timeout/cancellation, and explicit partial or unavailable results when the budget cannot be met.
- Invariant: One page request must have a declared and enforced operation/query budget with set-based reads, bounded fanout, timeout/cancellation, and explicit partial or unavailable results when the budget cannot be met.
- Root cause: The response-size bound is incorrectly used as a work bound while nested per-record reconstruction creates quadratic fanout and N+1 repository access.
- Trigger: Request private-paper runtime cycles at pageSize=25.
- Minimal fix boundary: At the R05 read-model boundary, use one bounded set-based query or precomputed read model, enforce an explicit operation/time budget, and surface partial/unavailable state. R03 owns repository/index/transaction changes; R06 owns request cancellation and service-wide concurrency.
- Regression risks:
- Set-based projection may change error ordering.
- New indexes can affect migration and retention work.
- Budget enforcement must not silently truncate without an explicit partial marker.

### BWS118-R05-005 — The cockpit discards every server continuation and presents first-page counts, search, and local pagination as whole-scope data

- Severity: `P1`
- Current behavior: The snapshot loader issues exactly one request per surface and never uses nextCursor. Models label returnedCount as Accepted Backtests, Blocked Backtests, Cycle Rows, B1 Research Runs, and similar totals. Search and pager operate only on loaded first-page rows.
- Expected behavior: The cockpit must either exhaust deterministic continuations within a declared cap, implement server-driven paging/search, or visibly label every metric and row set as partial/first-page with continuation controls and completeness state.
- Invariant: The cockpit must either exhaust deterministic continuations within a declared cap, implement server-driven paging/search, or visibly label every metric and row set as partial/first-page with continuation controls and completeness state.
- Root cause: The web snapshot contract models one server page per logical dataset, while presentation code treats page-local counts and rows as scope totals.
- Trigger: Load the cockpit with all seven core responses containing nextCursor and at least one row.
- Minimal fix boundary: Choose one R05 UI contract: server-driven pagination/filter/search with surfaced continuation, or bounded multi-page aggregation carrying explicit completeness/truncation. Rename all page-local metrics and empty states until completeness is proven.
- Regression risks:
- Exhausting pages can increase load; pair with R05/R06 budgets.
- Server-driven pagination changes URL-state semantics.
- Metric names and operator procedures may require updates.

### BWS118-R05-007 — The cockpit combines seven independently timed pages into one apparent snapshot without a shared coherence receipt

- Severity: `P1`
- Current behavior: The client runs separate requests in Promise.all and places them into one object. There is no shared snapshot ID, database high-watermark, source cycle, asOf, or cross-response coherence validation.
- Expected behavior: A cockpit snapshot must carry one server-issued snapshot/coherence identity or prove all component responses share compatible as-of/high-watermark/authority receipts. Mixed snapshots must be rejected or visibly presented as independent partial observations.
- Invariant: A cockpit snapshot must carry one server-issued snapshot/coherence identity or prove all component responses share compatible as-of/high-watermark/authority receipts. Mixed snapshots must be rejected or visibly presented as independent partial observations.
- Root cause: UI aggregation is equated with data snapshot coherence; the server exposes only independent page responses.
- Trigger: Return the seven pages with mutually different generatedAt values, generations, or database high-watermarks.
- Minimal fix boundary: Add an R05 snapshot/batch read contract or common snapshot token/high-watermark accepted by all queries, and require the cockpit to validate it. If independent observations remain intentional, label and render them independently rather than deriving cross-surface totals.
- Regression risks:
- A database snapshot spanning requests may require a server-side snapshot lifecycle.
- Batch responses can become large; preserve page and work bounds.
- Cross-surface derivations must define which resources are semantically comparable.

### BWS118-R05-008 — API and cockpit accept arbitrarily stale or future response timestamps and loaded state never transitions to stale

- Severity: `P1`
- Current behavior: Both service and client validate only ISO syntax/Date.parse. The shell loads on route/config/scope changes only; it has no clock, refresh interval, visibility refresh, expiry, stale state, or future-skew check.
- Expected behavior: The API/client contract must define response age, future-skew, source/as-of time, and stale transition. The cockpit must label stale data and refresh or require operator reload; future or incompatible time must fail closed.
- Invariant: The API/client contract must define response age, future-skew, source/as-of time, and stale transition. The cockpit must label stale data and refresh or require operator reload; future or incompatible time must fail closed.
- Root cause: Timestamp validity is treated as currentness, and the browser state machine has no stale concept.
- Trigger: Return a response dated 2000 or 2099, or leave a valid response displayed indefinitely.
- Minimal fix boundary: Define R05 response currentness fields and policy using a caller-provided/testable clock; reject excessive future skew, mark age explicitly, and add a browser stale/refresh state. R01 remains owner of upstream source/receive-time truth.
- Regression risks:
- Clock policy must tolerate bounded skew.
- Automatic refresh must be bounded and cancellable.
- Do not imply current provider acceptance from a fresh local response over historical data.


## Allowed edit boundary

- Candidate path set: `apps/web/src/api/client.ts`, `apps/web/src/api/contracts.ts`, `apps/web/src/api/models.ts`, `apps/web/src/app/shell.tsx`, `packages/bootstrap/src/api/bws-read-only-query-service.ts`, `packages/bootstrap/src/operations/runtime-applications.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `apps/web/src/api/client.ts` | participating tranches=T18, T19, T20 | predecessor postimage required
- `apps/web/src/api/models.ts` | participating tranches=T19, T20 | predecessor postimage required
- `apps/web/src/app/shell.tsx` | participating tranches=T19, T20 | predecessor postimage required
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` | participating tranches=T18, T19, T32 | predecessor postimage required
- `packages/bootstrap/src/operations/runtime-applications.ts` | participating tranches=T19, T23, T25 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- - No upstream pagination root duplication
- API maximum returned row count
- B1 economic calculations
- B1 mathematics
- Individual repository row correctness
- Paper settlement semantics
- Persistence timestamp ordering
- Persistent worker state machine
- Provider currentness acceptance
- Repository key ordering itself
- Scheduler checkpoint write semantics
- Scheduler ownership
- Strategy acceptance computation
- Strategy acceptance semantics
- Underlying persisted counts
- Upstream API pagination
- Upstream convergence ownership
- Upstream source timestamp creation
- Worker state transitions
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T13, T18.
- Review prerequisites: - BWS-W1-T03.
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

- `BWS118-R05-002-TEST-01` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-002 | requirement=Forged-cursor rejection test using a recomputed filter hash.
- `BWS118-R05-002-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-002 | requirement=Concurrent insert/delete/update continuation tests with a fixed snapshot.
- `BWS118-R05-002-TEST-03` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-002 | requirement=Restart test proving a valid continuation resumes the same snapshot or fails explicitly as expired.
- `BWS118-R05-002-TEST-04` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-002 | requirement=Sort-version and API-version mismatch tests.
- `BWS118-R05-002-TEST-05` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-002 | requirement=Property test that concatenated pages equal one snapshot query without duplicate or omission.
- `BWS118-R05-003-TEST-01` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-003 | requirement=Older-match test proving it is returned through continuation or the response is explicitly partial.
- `BWS118-R05-003-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-003 | requirement=No-match test that distinguishes exhausted snapshot from truncated scan.
- `BWS118-R05-003-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-003 | requirement=Multiple-scheduler ordering and continuation tests.
- `BWS118-R05-003-TEST-04` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-003 | requirement=Restart test with the same search snapshot/high-watermark.
- `BWS118-R05-003-TEST-05` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-003 | requirement=UI test that partial runtime-cycle results cannot be presented as absence.
- `BWS118-R05-004-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-004 | requirement=Operation-count test at maxPageSize with a hard upper bound independent of scheduler history.
- `BWS118-R05-004-TEST-02` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-004 | requirement=Database-backed query-plan and latency test under realistic retained history.
- `BWS118-R05-004-TEST-03` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-004 | requirement=Cancellation/timeout test proving no late query work continues after client disconnect or request deadline.
- `BWS118-R05-004-TEST-04` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-004 | requirement=Concurrency test with health/readiness and multiple cockpit readers.
- `BWS118-R05-005-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-005 | requirement=Snapshot-loader test that follows continuations or deliberately returns explicit partial state.
- `BWS118-R05-005-TEST-02` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-005 | requirement=UI test where nextCursor exists: cards, search, empty state, and pager must not claim completeness.
- `BWS118-R05-005-TEST-03` | category=evidence_or_artifact | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-005 | requirement=Multi-page accepted/blocked/B1/runtime/evidence cases.
- `BWS118-R05-005-TEST-04` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-005 | requirement=Cursor failure midway must preserve partial/error distinction rather than silently showing page one.
- `BWS118-R05-007-TEST-01` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-007 | requirement=Concurrent mutation test during seven-surface load.
- `BWS118-R05-007-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-007 | requirement=Mixed snapshot/high-watermark rejection test.
- `BWS118-R05-007-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-007 | requirement=Batch endpoint or shared-token test proving all surfaces resolve one snapshot.
- `BWS118-R05-007-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-007 | requirement=Partial surface failure test that does not retain a synthetic combined snapshot.
- `BWS118-R05-008-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-008 | requirement=Ancient and future generatedAt rejection/stale tests with injected clock.
- `BWS118-R05-008-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-008 | requirement=Open-page expiry test transitioning current to stale without route change.
- `BWS118-R05-008-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-008 | requirement=Visibility/reconnect refresh test.
- `BWS118-R05-008-TEST-04` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-008 | requirement=Distinguish API response time from upstream source/receive/as-of time.

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS118-R05-002-TEST-01` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-002 | requirement=Forged-cursor rejection test using a recomputed filter hash.
- `BWS118-R05-002-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-002 | requirement=Concurrent insert/delete/update continuation tests with a fixed snapshot.
- `BWS118-R05-002-TEST-03` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-002 | requirement=Restart test proving a valid continuation resumes the same snapshot or fails explicitly as expired.
- `BWS118-R05-002-TEST-04` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-002 | requirement=Sort-version and API-version mismatch tests.
- `BWS118-R05-002-TEST-05` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-002 | requirement=Property test that concatenated pages equal one snapshot query without duplicate or omission.
- `BWS118-R05-003-TEST-01` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-003 | requirement=Older-match test proving it is returned through continuation or the response is explicitly partial.
- `BWS118-R05-003-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-003 | requirement=No-match test that distinguishes exhausted snapshot from truncated scan.
- `BWS118-R05-003-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-003 | requirement=Multiple-scheduler ordering and continuation tests.
- `BWS118-R05-003-TEST-04` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-003 | requirement=Restart test with the same search snapshot/high-watermark.
- `BWS118-R05-003-TEST-05` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-003 | requirement=UI test that partial runtime-cycle results cannot be presented as absence.
- `BWS118-R05-004-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-004 | requirement=Operation-count test at maxPageSize with a hard upper bound independent of scheduler history.
- `BWS118-R05-004-TEST-02` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-004 | requirement=Database-backed query-plan and latency test under realistic retained history.
- `BWS118-R05-004-TEST-03` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-004 | requirement=Cancellation/timeout test proving no late query work continues after client disconnect or request deadline.
- `BWS118-R05-004-TEST-04` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-004 | requirement=Concurrency test with health/readiness and multiple cockpit readers.
- `BWS118-R05-005-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-005 | requirement=Snapshot-loader test that follows continuations or deliberately returns explicit partial state.
- `BWS118-R05-005-TEST-02` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-005 | requirement=UI test where nextCursor exists: cards, search, empty state, and pager must not claim completeness.
- `BWS118-R05-005-TEST-03` | category=evidence_or_artifact | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-005 | requirement=Multi-page accepted/blocked/B1/runtime/evidence cases.
- `BWS118-R05-005-TEST-04` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-005 | requirement=Cursor failure midway must preserve partial/error distinction rather than silently showing page one.
- `BWS118-R05-007-TEST-01` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-007 | requirement=Concurrent mutation test during seven-surface load.
- `BWS118-R05-007-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-007 | requirement=Mixed snapshot/high-watermark rejection test.
- `BWS118-R05-007-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-007 | requirement=Batch endpoint or shared-token test proving all surfaces resolve one snapshot.
- `BWS118-R05-007-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-007 | requirement=Partial surface failure test that does not retain a synthetic combined snapshot.
- `BWS118-R05-008-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-008 | requirement=Ancient and future generatedAt rejection/stale tests with injected clock.
- `BWS118-R05-008-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-008 | requirement=Open-page expiry test transitioning current to stale without route change.
- `BWS118-R05-008-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-008 | requirement=Visibility/reconnect refresh test.
- `BWS118-R05-008-TEST-04` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-008 | requirement=Distinguish API response time from upstream source/receive/as-of time.

## Negative and adversarial tests

- `BWS118-R05-002-TEST-04` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-002 | requirement=Sort-version and API-version mismatch tests.
- `BWS118-R05-002-TEST-05` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-002 | requirement=Property test that concatenated pages equal one snapshot query without duplicate or omission.
- `BWS118-R05-008-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-008 | requirement=Ancient and future generatedAt rejection/stale tests with injected clock.
- `BWS118-R05-008-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-008 | requirement=Open-page expiry test transitioning current to stale without route change.

## Concurrency, cancellation, crash, and restart tests

- `BWS118-R05-002-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-002 | requirement=Concurrent insert/delete/update continuation tests with a fixed snapshot.
- `BWS118-R05-002-TEST-03` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-002 | requirement=Restart test proving a valid continuation resumes the same snapshot or fails explicitly as expired.
- `BWS118-R05-003-TEST-04` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-003 | requirement=Restart test with the same search snapshot/high-watermark.
- `BWS118-R05-004-TEST-02` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-004 | requirement=Database-backed query-plan and latency test under realistic retained history.
- `BWS118-R05-004-TEST-03` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-004 | requirement=Cancellation/timeout test proving no late query work continues after client disconnect or request deadline.
- `BWS118-R05-007-TEST-01` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-007 | requirement=Concurrent mutation test during seven-surface load.

## Environment proof

- NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED: 26 requirements

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

Acceptance authority: - Authenticated/versioned cursors own one snapshot

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W2-T20` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
