
# BWS-W2-T20 implementation packet

> Documentation status: `PROPOSED_NOT_ACTIVE` for T39 and `NOT_ADMITTED` for all tranches. This packet does not authorize source mutation.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W2-T20
CAMPAIGN_ORDER: 38
STAGE: S5
PRIMARY_OWNER: R05
SECONDARY_REVIEWERS: R02, R03, R04, R06, R07, R11
ISSUE_IDS: BWS118-R05-010, BWS118-R05-011, BWS118-R05-012, BWS118-R05-013
SEVERITY_COUNTS: {"P1": 3, "P2": 1}
DEPENDENCIES: T17, T18, T19
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; exact 771-member archive inventory; independently computed inventory digest=b81ff807e4c230bff96fe1fa58f73a2d4bac803ebd7fa58b843cdcb83499f7f0
CURRENT_SOURCE_PATH_CANDIDATES: apps/web/src/api/client.ts, apps/web/src/api/models.ts, apps/web/src/app/shell.tsx, packages/bootstrap/src/strategy/strategy-ledger.ts, packages/persistence/src/repositories/b1-backtest-run-repository.ts
SYMBOLS_TO_REVERIFY: 15 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: apps/web/src/api/client.ts, apps/web/src/api/models.ts, apps/web/src/app/shell.tsx, packages/bootstrap/src/strategy/strategy-ledger.ts, packages/persistence/src/repositories/b1-backtest-run-repository.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites `- BWS-W2-T17`
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 19 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 19 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 3 classified records below
CONCURRENCY_OR_CRASH_TESTS: 1 classified records below
ENVIRONMENT_PROOF: {"NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED": 19}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: - Wire validator is exact with producer contract
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": false, "bws_710": false, "deployment": false, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W3-T28 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `apps/web/src/api/client.ts` | present=yes | sha256=8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `apps/web/src/api/models.ts` | present=yes | sha256=3b08b0fe2d3559cc1e51bf3f570ea43b3b3c4379234ceaec33abe7d9c1c034c3 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `apps/web/src/app/shell.tsx` | present=yes | sha256=ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/strategy/strategy-ledger.ts` | present=yes | sha256=d05e339a5692a9218f2146c153570ee7d9c8d79ae88282e162b7ece0c0cb5dbc | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/persistence/src/repositories/b1-backtest-run-repository.ts` | present=yes | sha256=fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS118-R05-010 | `apps/web/src/api/client.ts` | symbol=assertImportRunRecord / assertCandidateReport | reviewed_line_range=238-316 | reviewed_sha256=8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97
- BWS118-R05-010 | `apps/web/src/api/client.ts` | symbol=assertStrategyLedgerEntry | reviewed_line_range=319-378 | reviewed_sha256=8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97
- BWS118-R05-010 | `apps/web/src/api/client.ts` | symbol=assertPrivatePaperRuntimeCycleItem job validation | reviewed_line_range=426-447 | reviewed_sha256=8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97
- BWS118-R05-010 | `packages/bootstrap/src/strategy/strategy-ledger.ts` | symbol=strategy report kind and closed-policy validation | reviewed_line_range=401-450 | reviewed_sha256=d05e339a5692a9218f2146c153570ee7d9c8d79ae88282e162b7ece0c0cb5dbc
- BWS118-R05-010 | `apps/web/src/api/models.ts` | symbol=toExposureRows | reviewed_line_range=439-465 | reviewed_sha256=3b08b0fe2d3559cc1e51bf3f570ea43b3b3c4379234ceaec33abe7d9c1c034c3
- BWS118-R05-011 | `apps/web/src/api/client.ts` | symbol=assertB1BacktestRunItem child validation | reviewed_line_range=573-663 | reviewed_sha256=8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97
- BWS118-R05-011 | `packages/persistence/src/repositories/b1-backtest-run-repository.ts` | symbol=buildSurebetB1SimulationResultInsertValues | reviewed_line_range=451-510 | reviewed_sha256=fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04
- BWS118-R05-011 | `packages/persistence/src/repositories/b1-backtest-run-repository.ts` | symbol=normalizeSimulationRow | reviewed_line_range=646-653 | reviewed_sha256=fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04
- BWS118-R05-011 | `apps/web/src/api/models.ts` | symbol=createB1BacktestRunRow | reviewed_line_range=550-608 | reviewed_sha256=3b08b0fe2d3559cc1e51bf3f570ea43b3b3c4379234ceaec33abe7d9c1c034c3
- BWS118-R05-012 | `apps/web/src/api/client.ts` | symbol=BwsOperatorCockpitFetchLike | reviewed_line_range=60-72 | reviewed_sha256=8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97
- BWS118-R05-012 | `apps/web/src/api/client.ts` | symbol=loadBwsOperatorCockpitSnapshot | reviewed_line_range=1240-1325 | reviewed_sha256=8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97
- BWS118-R05-012 | `apps/web/src/app/shell.tsx` | symbol=loadSnapshot effect and state updates | reviewed_line_range=144-180 | reviewed_sha256=ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189
- BWS118-R05-013 | `apps/web/src/api/models.ts` | symbol=buildBwsOperatorCockpitPageModel empty labels | reviewed_line_range=657-724 | reviewed_sha256=3b08b0fe2d3559cc1e51bf3f570ea43b3b3c4379234ceaec33abe7d9c1c034c3
- BWS118-R05-013 | `apps/web/src/app/shell.tsx` | symbol=filteredRows / visibleRows | reviewed_line_range=182-188 | reviewed_sha256=ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189
- BWS118-R05-013 | `apps/web/src/app/shell.tsx` | symbol=empty-state rendering | reviewed_line_range=460-485 | reviewed_sha256=ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS118-R05-010 — Selective wire validation weakens closed policy, terminal, fixed-point, status, and timestamp contracts to arbitrary non-empty strings

- Severity: `P1`
- Current behavior: Several critical fields are checked only with requireNonEmptyString or requireOptionalNonEmptyString, then the object is cast to the strong TypeScript type. Models render the accepted values directly.
- Expected behavior: The client must validate every canonical literal, closed-state invariant, fixed-point integer string, timestamp, and status against the same contract used by the producer before a typed cast or rendering.
- Invariant: The client must validate every canonical literal, closed-state invariant, fixed-point integer string, timestamp, and status against the same contract used by the producer before a typed cast or rendering.
- Root cause: The web parser validates selected structural relationships but relies on unsafe type assertions for the remaining semantic contract.
- Trigger: Return liveState=live, privacy=public, profitabilityState=guaranteed_profitable, publicDistributionState=published, reportKind=forged_report, completionGroupState=ready_to_execute, finalOutcome=guaranteed_win, settledNetMinor=not-an-integer, job.status=fully_live, or completedAt=not-a-time.
- Minimal fix boundary: Replace ad hoc selective checks with exhaustive shared/generated validators at the R05 wire boundary, including canonical policy literals, union exhaustiveness, integer-string format/range, timestamp format/order, optional-state dependencies, and unknown-field rejection where required. Canonical producer rules remain owned by R02/R03/R04.
- Regression risks:
- Shared validation must not create circular workspace imports.
- Stricter parsing can expose historical malformed rows; surface them as explicit errors, not empty data.
- Integer ranges and terminal states must follow owner-sector authority.

### BWS118-R05-011 — The B1 browser contract rejects producer-valid null simulation results while accepting malformed child identity, economics, status, and time fields

- Severity: `P1`
- Current behavior: The parser requires every simulation result to be an object, although persistence intentionally emits result:null for one accepted case. Conversely, candidate and simulation children receive only four shallow non-empty/object checks and are then cast to the full types.
- Expected behavior: The external client schema must exactly match the producer contract, including valid nullability, parent-child identity, discriminated simulation kinds/statuses, fixed-point values, blockers, booleans, timestamps, and result-shape dependencies.
- Invariant: The external client schema must exactly match the producer contract, including valid nullability, parent-child identity, discriminated simulation kinds/statuses, fixed-point values, blockers, booleans, timestamps, and result-shape dependencies.
- Root cause: The B1 client validator is a hand-written partial projection that diverges from the producer/persistence discriminated contract in both directions.
- Trigger: Return result=null for the producer-valid residual_exposure row, or return children with mismatched run/candidate IDs, non-integer spread/money strings, invalid status/stage, non-array blockers, non-boolean falsePositive, or invalid timestamps.
- Minimal fix boundary: Create one shared/generated B1 reporting wire schema and validate all child discriminants, identities, units, timestamps, and nullability in R05. Hand any discovered producer-contract defect to R02/R04/R03 rather than changing economics here.
- Regression risks:
- Historical stored B1 rows may expose additional schema drift.
- Generated schema changes must preserve deliberate null semantics.
- Do not “fix” by replacing null with a fabricated object.

### BWS118-R05-012 — Cockpit loads are not request-generation-bound or cancellable, allowing a late older scope or route response to overwrite newer state

- Severity: `P1`
- Current behavior: Every effect invocation writes the same snapshot/error/loading state without a generation token or active flag. The fetch abstraction carries no AbortSignal. Older completion can call setSnapshot and finally setIsLoading(false after a newer load.
- Expected behavior: Only the active request generation may publish snapshot/error/loading state. Superseded loads must be aborted where possible and ignored on completion; loading must represent the active generation only.
- Invariant: Only the active request generation may publish snapshot/error/loading state. Superseded loads must be aborted where possible and ignored on completion; loading must represent the active generation only.
- Root cause: Asynchronous fetch completion has no monotonic ownership relation to the effect generation that initiated it.
- Trigger: Start an old-scope load, start and complete a new-scope load, then complete the old load last.
- Minimal fix boundary: Add one request-generation/AbortController boundary in the shell/client; pass AbortSignal through the fetch abstraction; ignore completion from superseded generations; make loading/error state generation-specific. Generic HTTP cancellation propagation remains R06-owned.
- Regression risks:
- React Strict Mode can expose duplicate-effect behavior and must be covered.
- Abort is advisory; late completion still needs generation checks.
- Do not retain an old snapshot as fallback unless explicitly labeled stale and scope-bound.

### BWS118-R05-013 — The cockpit conflates source-empty, search-no-match, and evidence-scope states under the same empty labels

- Severity: `P2`
- Current behavior: The shell always renders model.emptyLabel when filtered visible rows are empty. The evidence page always says to provide an explicit filter even when one is applied; other pages claim no source rows when only local search is empty.
- Expected behavior: Presentation must distinguish at least: source/query returned no rows, loaded page is partial, active search has no matches, explicit evidence scope has no matches, scope is missing, and request failed.
- Invariant: Presentation must distinguish at least: source/query returned no rows, loaded page is partial, active search has no matches, explicit evidence scope has no matches, scope is missing, and request failed.
- Root cause: Empty copy is fixed at route-model construction and is not derived from query, scope, pagination, or local-filter state.
- Trigger: Search for a nonmatching term against a nonempty page, or apply a valid evidence filter that produces an empty result.
- Minimal fix boundary: Introduce explicit R05 UI view states for source empty, filtered empty, missing scope, applied-scope no match, partial page, and error; derive copy from those states and keep counts visible.
- Regression risks:
- Copy changes may affect snapshots/accessibility tests.
- Do not conflate a filtered empty with a successful exhaustive no-match unless completeness is known.
- Local and server filters need separate labels.


## Allowed edit boundary

- Candidate path set: `apps/web/src/api/client.ts`, `apps/web/src/api/models.ts`, `apps/web/src/app/shell.tsx`, `packages/bootstrap/src/strategy/strategy-ledger.ts`, `packages/persistence/src/repositories/b1-backtest-run-repository.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `apps/web/src/api/client.ts` | participating tranches=T18, T19, T20 | predecessor postimage required
- `apps/web/src/api/models.ts` | participating tranches=T19, T20 | predecessor postimage required
- `apps/web/src/app/shell.tsx` | participating tranches=T19, T20 | predecessor postimage required
- `packages/bootstrap/src/strategy/strategy-ledger.ts` | participating tranches=T12, T17, T20 | predecessor postimage required
- `packages/persistence/src/repositories/b1-backtest-run-repository.ts` | participating tranches=T12, T13, T20 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- - No literal green palette requirement
- B1 derivation mathematics
- B1 economic correctness
- Canonical strategy-ledger producer validation
- Data-mode confinement
- Persistence timestamp ordering root cause
- Persistence transaction behavior
- Query filtering semantics
- Server error taxonomy
- Server query correctness
- Top-level BWS-900 and runtime-evidence holds
- URL-state parsing
- Underlying row contents
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T17, T18, T19.
- Review prerequisites: - BWS-W2-T17.
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

- `BWS118-R05-010-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-010 | requirement=Mutation/property tests over every union member and every unknown string.
- `BWS118-R05-010-TEST-02` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-010 | requirement=Closed-policy escalation tests for live/public/profitability/distribution/report kind.
- `BWS118-R05-010-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-010 | requirement=Integer-string tests for sign, decimals, exponent, whitespace, unsafe length, and overflow policy.
- `BWS118-R05-010-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-010 | requirement=Optional timestamp/status/state dependency tests.
- `BWS118-R05-010-TEST-05` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-010 | requirement=Round-trip test from actual service output through the external web parser.
- `BWS118-R05-011-TEST-01` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-011 | requirement=Producer-valid null residual-exposure round-trip test.
- `BWS118-R05-011-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-011 | requirement=Parent-child runId/candidateId mismatch rejection tests.
- `BWS118-R05-011-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-011 | requirement=All candidate/simulation status and kind union tests.
- `BWS118-R05-011-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-011 | requirement=Fixed-point, boolean, blockers, timestamp, and result-shape property tests.
- `BWS118-R05-011-TEST-05` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-011 | requirement=Model test proving malformed child data cannot render.
- `BWS118-R05-012-TEST-01` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-012 | requirement=Deterministic deferred-promise race tests for route, scope, and configuration changes.
- `BWS118-R05-012-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-012 | requirement=Old success after new success; old failure after new success; old finally after new pending.
- `BWS118-R05-012-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-012 | requirement=Unmount and abort test proving no state publication or retained listener.
- `BWS118-R05-012-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-012 | requirement=Client test proving AbortSignal reaches fetch.
- `BWS118-R05-013-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-013 | requirement=Nonempty source plus zero local-search results.
- `BWS118-R05-013-TEST-02` | category=evidence_or_artifact | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-013 | requirement=Explicit evidence scope with zero results.
- `BWS118-R05-013-TEST-03` | category=evidence_or_artifact | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-013 | requirement=Missing evidence scope.
- `BWS118-R05-013-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-013 | requirement=Server partial page and server error states.
- `BWS118-R05-013-TEST-05` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-013 | requirement=Reset-search action restoring source rows without refetch confusion.

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS118-R05-010-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-010 | requirement=Mutation/property tests over every union member and every unknown string.
- `BWS118-R05-010-TEST-02` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-010 | requirement=Closed-policy escalation tests for live/public/profitability/distribution/report kind.
- `BWS118-R05-010-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-010 | requirement=Integer-string tests for sign, decimals, exponent, whitespace, unsafe length, and overflow policy.
- `BWS118-R05-010-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-010 | requirement=Optional timestamp/status/state dependency tests.
- `BWS118-R05-010-TEST-05` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-010 | requirement=Round-trip test from actual service output through the external web parser.
- `BWS118-R05-011-TEST-01` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-011 | requirement=Producer-valid null residual-exposure round-trip test.
- `BWS118-R05-011-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-011 | requirement=Parent-child runId/candidateId mismatch rejection tests.
- `BWS118-R05-011-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-011 | requirement=All candidate/simulation status and kind union tests.
- `BWS118-R05-011-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-011 | requirement=Fixed-point, boolean, blockers, timestamp, and result-shape property tests.
- `BWS118-R05-011-TEST-05` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-011 | requirement=Model test proving malformed child data cannot render.
- `BWS118-R05-012-TEST-01` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-012 | requirement=Deterministic deferred-promise race tests for route, scope, and configuration changes.
- `BWS118-R05-012-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-012 | requirement=Old success after new success; old failure after new success; old finally after new pending.
- `BWS118-R05-012-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-012 | requirement=Unmount and abort test proving no state publication or retained listener.
- `BWS118-R05-012-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-012 | requirement=Client test proving AbortSignal reaches fetch.
- `BWS118-R05-013-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-013 | requirement=Nonempty source plus zero local-search results.
- `BWS118-R05-013-TEST-02` | category=evidence_or_artifact | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-013 | requirement=Explicit evidence scope with zero results.
- `BWS118-R05-013-TEST-03` | category=evidence_or_artifact | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-013 | requirement=Missing evidence scope.
- `BWS118-R05-013-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-013 | requirement=Server partial page and server error states.
- `BWS118-R05-013-TEST-05` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-013 | requirement=Reset-search action restoring source rows without refetch confusion.

## Negative and adversarial tests

- `BWS118-R05-010-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-010 | requirement=Mutation/property tests over every union member and every unknown string.
- `BWS118-R05-011-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-011 | requirement=Parent-child runId/candidateId mismatch rejection tests.
- `BWS118-R05-011-TEST-05` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-011 | requirement=Model test proving malformed child data cannot render.

## Concurrency, cancellation, crash, and restart tests

- `BWS118-R05-012-TEST-01` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R05-012 | requirement=Deterministic deferred-promise race tests for route, scope, and configuration changes.

## Environment proof

- NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED: 19 requirements

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

Acceptance authority: - Wire validator is exact with producer contract

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W3-T28` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
