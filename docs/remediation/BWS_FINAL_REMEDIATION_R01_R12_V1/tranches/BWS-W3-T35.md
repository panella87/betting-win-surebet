
# BWS-W3-T35 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W3-T35
CAMPAIGN_ORDER: 43
STAGE: S6
PRIMARY_OWNER: R09
SECONDARY_REVIEWERS: R03, R05, R06, R07, R08, R10, R11
ISSUE_IDS: BWS120-R09-012, BWS120-R09-013, BWS120-R09-014, BWS120-R09-015, BWS120-R09-016, BWS120-R09-017
SEVERITY_COUNTS: {"P1": 6}
DEPENDENCIES: T22, T23, T25, T27, T32, T34, T47
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen review/finding baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; active campaign authority is pinned by activation/immutable-authority.sha256; exact current numbered archive or checkout, extracted-tree digest, Git identity, source paths, hashes, and modes must be captured in an external audit or admission receipt and reverified before editing; repository documentation does not self-attest a rolling numbered ZIP
CURRENT_SOURCE_PATH_CANDIDATES: packages/bootstrap/src/cli/bws-final-local-acceptance.ts, packages/bootstrap/src/cli/bws-soak-campaign.ts, packages/bootstrap/src/operations/bws-soak-runtime-integration.ts, packages/bootstrap/src/operations/final-local-acceptance.ts, packages/bootstrap/src/operations/soak-campaign.ts, tests/bws-soak-campaign.test.ts
SYMBOLS_TO_REVERIFY: 23 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: packages/bootstrap/src/cli/bws-final-local-acceptance.ts, packages/bootstrap/src/cli/bws-soak-campaign.ts, packages/bootstrap/src/operations/final-local-acceptance.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites ``authoritative managed runner; fault-specific adapters; owned resource inventory``
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 33 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 33 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 3 classified records below
CONCURRENCY_OR_CRASH_TESTS: 5 classified records below
ENVIRONMENT_PROOF: {"NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION": 33}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: no synthetic instant pass; each fault distinct; readiness/progress/resource thresholds enforced; checkpoint order restart-safe; resumed result cumulative; cleanup measured
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": false, "bws_710": false, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W3-T36 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `packages/bootstrap/src/cli/bws-final-local-acceptance.ts` | present=yes | sha256=218d99afdbef03328786d155dd23766bf87e19a75eb03c5ba1e835922c251d43 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/cli/bws-soak-campaign.ts` | present=yes | sha256=55a3b486f879b367fb30e3d67b465e457f1f258c209d131603ce3916e51e534a | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/bws-soak-runtime-integration.ts` | present=yes | sha256=3426f30a61e5e1300b640ca7b242949e7b2627274a399db815ddc40de79976a9 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/final-local-acceptance.ts` | present=yes | sha256=1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/soak-campaign.ts` | present=yes | sha256=779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `tests/bws-soak-campaign.test.ts` | present=yes | sha256=d0d027bfe0dd0ef866c175c59dfe71cfbc5c1f8707097ac7790298ea96aefe0e | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS120-R09-012 | `packages/bootstrap/src/cli/bws-soak-campaign.ts` | symbol=execute command | reviewed_line_range=72-80 | reviewed_sha256=55a3b486f879b367fb30e3d67b465e457f1f258c209d131603ce3916e51e534a
- BWS120-R09-012 | `packages/bootstrap/src/operations/soak-campaign.ts` | symbol=executeBwsSoakCampaign | reviewed_line_range=764-788 | reviewed_sha256=779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1
- BWS120-R09-012 | `packages/bootstrap/src/operations/soak-campaign.ts` | symbol=validateBwsSoakCampaignExecution / observationBudgetSatisfied | reviewed_line_range=986-1028; 1659-1667 | reviewed_sha256=779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1
- BWS120-R09-012 | `packages/bootstrap/src/operations/soak-campaign.ts` | symbol=defaultObserveCycle / defaultExecuteFailure / defaultVerifyCleanup | reviewed_line_range=1911-1960 | reviewed_sha256=779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1
- BWS120-R09-012 | `tests/bws-soak-campaign.test.ts` | symbol=default failure-matrix test | reviewed_line_range=660-710 | reviewed_sha256=d0d027bfe0dd0ef866c175c59dfe71cfbc5c1f8707097ac7790298ea96aefe0e
- BWS120-R09-012 | `packages/bootstrap/src/operations/soak-campaign.ts` | symbol=executeBwsSoakCampaign / defaultObserveCycle / defaultExecuteFailure / defaultVerifyCleanup | reviewed_line_range=764-788; 986-1028; 1659-1667; 1911-1960 | reviewed_sha256=779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1
- BWS120-R09-013 | `packages/bootstrap/src/operations/bws-soak-runtime-integration.ts` | symbol=failure target sets and dispatch | reviewed_line_range=17-39; 121-140 | reviewed_sha256=3426f30a61e5e1300b640ca7b242949e7b2627274a399db815ddc40de79976a9
- BWS120-R09-013 | `packages/bootstrap/src/operations/bws-soak-runtime-integration.ts` | symbol=executeRestartFailure / executeArtifactMarkerFailure | reviewed_line_range=161-241 | reviewed_sha256=3426f30a61e5e1300b640ca7b242949e7b2627274a399db815ddc40de79976a9
- BWS120-R09-013 | `packages/bootstrap/src/operations/bws-soak-runtime-integration.ts` | symbol=verifyDatabaseCleanup | reviewed_line_range=141-155 | reviewed_sha256=3426f30a61e5e1300b640ca7b242949e7b2627274a399db815ddc40de79976a9
- BWS120-R09-013 | `packages/bootstrap/src/operations/bws-soak-runtime-integration.ts` | symbol=PROCESS_RESTART_FAILURE_TARGETS / ARTIFACT_MARKER_FAILURE_TARGETS / executeRestartFailure / executeArtifactMarkerFailure | reviewed_line_range=17-39; 121-155; 161-241 | reviewed_sha256=3426f30a61e5e1300b640ca7b242949e7b2627274a399db815ddc40de79976a9
- BWS120-R09-014 | `packages/bootstrap/src/operations/soak-campaign.ts` | symbol=validateBwsSoakCampaignExecution | reviewed_line_range=986-1108 | reviewed_sha256=779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1
- BWS120-R09-014 | `packages/bootstrap/src/operations/soak-campaign.ts` | symbol=buildRuntimeObservation | reviewed_line_range=2020-2049 | reviewed_sha256=779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1
- BWS120-R09-014 | `packages/bootstrap/src/operations/soak-campaign.ts` | symbol=validateBwsSoakCampaignExecution / buildRuntimeObservation | reviewed_line_range=986-1108; 2020-2049 | reviewed_sha256=779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1
- BWS120-R09-015 | `packages/bootstrap/src/operations/soak-campaign.ts` | symbol=executeBwsSoakCampaign | reviewed_line_range=793-905 | reviewed_sha256=779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1
- BWS120-R09-015 | `packages/bootstrap/src/operations/soak-campaign.ts` | symbol=executeFailureStage | reviewed_line_range=1768-1865 | reviewed_sha256=779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1
- BWS120-R09-015 | `packages/bootstrap/src/operations/soak-campaign.ts` | symbol=executeBwsSoakCampaign / executeFailureStage | reviewed_line_range=793-905; 1768-1865 | reviewed_sha256=779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1
- BWS120-R09-016 | `packages/bootstrap/src/operations/soak-campaign.ts` | symbol=executeBwsSoakCampaign | reviewed_line_range=790-791; 947-965 | reviewed_sha256=779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1
- BWS120-R09-016 | `packages/bootstrap/src/operations/soak-campaign.ts` | symbol=validateBwsSoakCampaignExecution | reviewed_line_range=1056-1062 | reviewed_sha256=779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1
- BWS120-R09-016 | `packages/bootstrap/src/operations/soak-campaign.ts` | symbol=executeBwsSoakCampaign / validateBwsSoakCampaignExecution | reviewed_line_range=790-791; 947-965; 1056-1062 | reviewed_sha256=779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1
- BWS120-R09-017 | `packages/bootstrap/src/operations/final-local-acceptance.ts` | symbol=createBwsFinalLocalAcceptanceCleanupResult | reviewed_line_range=660-691 | reviewed_sha256=1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5
- BWS120-R09-017 | `packages/bootstrap/src/cli/bws-final-local-acceptance.ts` | symbol=cleanup command option mapping | reviewed_line_range=75-83 | reviewed_sha256=218d99afdbef03328786d155dd23766bf87e19a75eb03c5ba1e835922c251d43
- BWS120-R09-017 | `packages/bootstrap/src/operations/soak-campaign.ts` | symbol=defaultVerifyCleanup | reviewed_line_range=1949-1960 | reviewed_sha256=779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1
- BWS120-R09-017 | `packages/bootstrap/src/operations/bws-soak-runtime-integration.ts` | symbol=verifyDatabaseCleanup | reviewed_line_range=141-155 | reviewed_sha256=3426f30a61e5e1300b640ca7b242949e7b2627274a399db815ddc40de79976a9

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS120-R09-012 — The public execute command can synthesize an instant passing soak without managed runtime proof

- Severity: `P1`
- Current behavior: The execute path completes immediately, synthesizes every positive field, omits runtimeEvidence, and still validates when the arithmetic cycle budget is met.
- Expected behavior: Promotable soak evidence must require the managed wall-clock runner, real diagnostics-backed observations, target-specific failures, measured recovery, and measured cleanup.
- Invariant: Promotable soak evidence must require the managed wall-clock runner, real diagnostics-backed observations, target-specific failures, measured recovery, and measured cleanup.
- Root cause: A test/simulation executor and a production acceptance executor share the same promotable result schema and validator.
- Trigger: Run enough synthetic cycles to satisfy intervalMs * cycle count >= durationMs.
- Minimal fix boundary: Separate simulation from managed acceptance at the type/schema/CLI level. Require managed_runtime evidence, elapsed monotonic time, diagnostics receipts, and target-specific fault/cleanup receipts for any promotable validation.
- Regression risks:
- Keep deterministic simulation for unit tests, but it must be explicitly non-promotable.
- Existing fixtures and historical results need classification.

### BWS120-R09-013 — Managed soak collapses eighteen named failures into two generic actions

- Severity: `P1`
- Current behavior: All process targets perform stop/start/status of the full stack; all artifact targets write and delete a marker. The named failure is not actually produced.
- Expected behavior: Each named target must have an explicit, target-specific injection, observation, recovery criterion, and cleanup proof.
- Invariant: Each named target must have an explicit, target-specific injection, observation, recovery criterion, and cleanup proof.
- Root cause: Failure identity is metadata only; it does not select a target-specific mechanism or proof contract.
- Trigger: The integration dispatches the failure.
- Minimal fix boundary: Create one implementation registry with an explicit injector, expected observation, recovery verifier, and cleanup verifier per target. Reject any target without a real implementation.
- Regression risks:
- Several faults depend on R03, R06, R07, and R08 primitives; retain explicit handoffs rather than inventing unsafe direct mutations.
- No real provider or production database should be required for safe local failure tests.

### BWS120-R09-014 — Soak validation ignores observation readiness, progress, and resource bounds

- Severity: `P1`
- Current behavior: Observation detail fields are not consulted, so structurally complete but operationally failed cycles can pass.
- Expected behavior: Acceptance must enforce explicit monotonic progress, readiness, error, queue, latency, dead-letter, memory, disk, and growth thresholds over the full observation window.
- Invariant: Acceptance must enforce explicit monotonic progress, readiness, error, queue, latency, dead-letter, memory, disk, and growth thresholds over the full observation window.
- Root cause: The soak validator validates evidence shape and count, not the operational invariants the observations are intended to prove.
- Trigger: Validate the soak result.
- Minimal fix boundary: Version a threshold contract in the manifest; validate every cycle and aggregate window; measure real latency/resource counters; fail on unknown/missing fields and on sustained regression.
- Regression risks:
- Thresholds must be explicit and workload-aware, not hidden defaults.
- R07 owns evidence identity; R09 owns the acceptance semantics.

### BWS120-R09-015 — Soak checkpoint ordering can skip after-cycle faults or duplicate injected faults after a crash

- Severity: `P1`
- Current behavior: After-cycle work can be skipped because resume starts at completedCycleCount+1; an injected fault can run again because the durable checkpoint is not used for deduplication.
- Expected behavior: Every scheduled fault must be durably exactly-once or explicitly safely replayable, and completedCycleCount must not skip any required stage.
- Invariant: Every scheduled fault must be durably exactly-once or explicitly safely replayable, and completedCycleCount must not skip any required stage.
- Root cause: Checkpoint sequencing records intent/progress at boundaries that do not correspond to completed side effects and does not reconstruct fault state from checkpoints.
- Trigger: Resume the campaign.
- Minimal fix boundary: Model each injection with durable pending/injected/recovery_verified states and an idempotency token; derive resume work from the checkpoint chain; advance cycle completion only after all required stages are terminal.
- Regression risks:
- Some real failures are inherently non-idempotent and need compensation/fencing.
- Do not claim exactly-once merely from filesystem checkpoints.

### BWS120-R09-016 — Resumed soak results cannot validate cumulative checkpoint history

- Severity: `P1`
- Current behavior: The result lists only cycles from the latest call while validation compares against cumulative checkpoints, so legitimate restart/chunking fails.
- Expected behavior: A resumed result must represent cumulative durable history or validation must compare only a precisely bounded invocation segment.
- Invariant: A resumed result must represent cumulative durable history or validation must compare only a precisely bounded invocation segment.
- Root cause: Execution result scope is per invocation while checkpoint and validator scope is per campaign.
- Trigger: Execute additional cycles and validate the new result.
- Minimal fix boundary: Define result scope explicitly. Prefer reconstructing cumulative cycles/failures from the validated checkpoint chain and emitting a cumulative result bound to the terminal state.
- Regression risks:
- Historical results may remain per-invocation and need a new schema/version.
- Do not silently merge inconsistent checkpoint chains.

### BWS120-R09-017 — Cleanup acceptance is derived from caller/default counters instead of measured owned resources

- Severity: `P1`
- Current behavior: Zero/empty caller values produce verified=true even when unobserved leaks exist.
- Expected behavior: Cleanup proof must be generated by authoritative bounded enumeration of every campaign-owned resource and bind each observed resource to the campaign generation.
- Invariant: Cleanup proof must be generated by authoritative bounded enumeration of every campaign-owned resource and bind each observed resource to the campaign generation.
- Root cause: Cleanup status is an assertion supplied by the same caller being evaluated, not an independently measured receipt.
- Trigger: Create cleanup evidence and then finalize or validate acceptance.
- Minimal fix boundary: Move enumeration into trusted operations: query generation-bound process ownership, durable leases, campaign directories, disposable database registry, and temp artifacts; hash the inventory and require zero residuals before verified=true.
- Regression risks:
- Enumeration must remain confined to campaign-owned resources and must not delete unrelated state.
- R03/R06/R08 own lower-level ownership and cleanup mechanisms.


## Allowed edit boundary

- Candidate path set: `packages/bootstrap/src/cli/bws-final-local-acceptance.ts`, `packages/bootstrap/src/cli/bws-soak-campaign.ts`, `packages/bootstrap/src/operations/bws-soak-runtime-integration.ts`, `packages/bootstrap/src/operations/final-local-acceptance.ts`, `packages/bootstrap/src/operations/soak-campaign.ts`, `tests/bws-soak-campaign.test.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `packages/bootstrap/src/cli/bws-final-local-acceptance.ts` | participating tranches=T35, T38 | predecessor postimage required
- `packages/bootstrap/src/cli/bws-soak-campaign.ts` | participating tranches=T35, T38 | predecessor postimage required
- `packages/bootstrap/src/operations/final-local-acceptance.ts` | participating tranches=T29, T31, T35, T36 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- Execution, public signals, and live financial operations remain disabled and out of scope.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T22, T23, T25, T27, T32, T34, T47.
- Review prerequisites: `authoritative managed runner; fault-specific adapters; owned resource inventory`.
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

- `BWS120-R09-012-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-012 | requirement=execute result rejected by promotable validator
- `BWS120-R09-012-TEST-02` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-012 | requirement=no runtimeEvidence negative
- `BWS120-R09-012-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-012 | requirement=elapsed wall-clock below duration negative
- `BWS120-R09-012-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-012 | requirement=default observe/failure/cleanup marked simulation-only
- `BWS120-R09-012-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-012 | requirement=external preflight rejects simulation schema
- `BWS120-R09-013-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-013 | requirement=each target produces its named effect
- `BWS120-R09-013-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-013 | requirement=wrong component action cannot satisfy target
- `BWS120-R09-013-TEST-03` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-013 | requirement=recovery evidence is target-specific
- `BWS120-R09-013-TEST-04` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-013 | requirement=database/resource enumeration after every fault
- `BWS120-R09-013-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-013 | requirement=unsupported target fails before campaign start
- `BWS120-R09-014-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-014 | requirement=blocked health cycle
- `BWS120-R09-014-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-014 | requirement=blocked readiness cycle
- `BWS120-R09-014-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-014 | requirement=boundedProgress=false
- `BWS120-R09-014-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-014 | requirement=monotonic queue growth
- `BWS120-R09-014-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-014 | requirement=nonzero errors/dead letters
- `BWS120-R09-014-TEST-06` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-014 | requirement=latency/resource threshold breach
- `BWS120-R09-014-TEST-07` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-014 | requirement=missing observation field
- `BWS120-R09-015-TEST-01` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-015 | requirement=crash at every line between fault checkpoint, side effect, recovery checkpoint, and cycle completion
- `BWS120-R09-015-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-015 | requirement=replay-safe versus non-replay-safe target behavior
- `BWS120-R09-015-TEST-03` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-015 | requirement=after_cycle crash/resume
- `BWS120-R09-015-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-015 | requirement=duplicate fault token rejection
- `BWS120-R09-015-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-015 | requirement=state reconstruction from checkpoints
- `BWS120-R09-016-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-016 | requirement=two-invocation campaign
- `BWS120-R09-016-TEST-02` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-016 | requirement=resume after crash before result write
- `BWS120-R09-016-TEST-03` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-016 | requirement=resume with prior recovered failures
- `BWS120-R09-016-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-016 | requirement=multiple partial chunks
- `BWS120-R09-016-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-016 | requirement=validator reconstructs canonical cumulative history
- `BWS120-R09-017-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-017 | requirement=hidden process with empty caller list
- `BWS120-R09-017-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-017 | requirement=hidden lease
- `BWS120-R09-017-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-017 | requirement=remaining file inside declared temp directory
- `BWS120-R09-017-TEST-04` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-017 | requirement=extra campaign-owned database
- `BWS120-R09-017-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-017 | requirement=resource created after scan before final commit
- `BWS120-R09-017-TEST-06` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-017 | requirement=cleanup scan permissions failure

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS120-R09-012-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-012 | requirement=execute result rejected by promotable validator
- `BWS120-R09-012-TEST-02` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-012 | requirement=no runtimeEvidence negative
- `BWS120-R09-012-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-012 | requirement=elapsed wall-clock below duration negative
- `BWS120-R09-012-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-012 | requirement=default observe/failure/cleanup marked simulation-only
- `BWS120-R09-012-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-012 | requirement=external preflight rejects simulation schema
- `BWS120-R09-013-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-013 | requirement=each target produces its named effect
- `BWS120-R09-013-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-013 | requirement=wrong component action cannot satisfy target
- `BWS120-R09-013-TEST-03` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-013 | requirement=recovery evidence is target-specific
- `BWS120-R09-013-TEST-04` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-013 | requirement=database/resource enumeration after every fault
- `BWS120-R09-013-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-013 | requirement=unsupported target fails before campaign start
- `BWS120-R09-014-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-014 | requirement=blocked health cycle
- `BWS120-R09-014-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-014 | requirement=blocked readiness cycle
- `BWS120-R09-014-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-014 | requirement=boundedProgress=false
- `BWS120-R09-014-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-014 | requirement=monotonic queue growth
- `BWS120-R09-014-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-014 | requirement=nonzero errors/dead letters
- `BWS120-R09-014-TEST-06` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-014 | requirement=latency/resource threshold breach
- `BWS120-R09-014-TEST-07` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-014 | requirement=missing observation field
- `BWS120-R09-015-TEST-01` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-015 | requirement=crash at every line between fault checkpoint, side effect, recovery checkpoint, and cycle completion
- `BWS120-R09-015-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-015 | requirement=replay-safe versus non-replay-safe target behavior
- `BWS120-R09-015-TEST-03` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-015 | requirement=after_cycle crash/resume
- `BWS120-R09-015-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-015 | requirement=duplicate fault token rejection
- `BWS120-R09-015-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-015 | requirement=state reconstruction from checkpoints
- `BWS120-R09-016-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-016 | requirement=two-invocation campaign
- `BWS120-R09-016-TEST-02` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-016 | requirement=resume after crash before result write
- `BWS120-R09-016-TEST-03` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-016 | requirement=resume with prior recovered failures
- `BWS120-R09-016-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-016 | requirement=multiple partial chunks
- `BWS120-R09-016-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-016 | requirement=validator reconstructs canonical cumulative history
- `BWS120-R09-017-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-017 | requirement=hidden process with empty caller list
- `BWS120-R09-017-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-017 | requirement=hidden lease
- `BWS120-R09-017-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-017 | requirement=remaining file inside declared temp directory
- `BWS120-R09-017-TEST-04` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-017 | requirement=extra campaign-owned database
- `BWS120-R09-017-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-017 | requirement=resource created after scan before final commit
- `BWS120-R09-017-TEST-06` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-017 | requirement=cleanup scan permissions failure

## Negative and adversarial tests

- `BWS120-R09-012-TEST-02` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-012 | requirement=no runtimeEvidence negative
- `BWS120-R09-012-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-012 | requirement=elapsed wall-clock below duration negative
- `BWS120-R09-015-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-015 | requirement=duplicate fault token rejection

## Concurrency, cancellation, crash, and restart tests

- `BWS120-R09-013-TEST-03` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-013 | requirement=recovery evidence is target-specific
- `BWS120-R09-015-TEST-01` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-015 | requirement=crash at every line between fault checkpoint, side effect, recovery checkpoint, and cycle completion
- `BWS120-R09-015-TEST-03` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-015 | requirement=after_cycle crash/resume
- `BWS120-R09-016-TEST-02` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-016 | requirement=resume after crash before result write
- `BWS120-R09-016-TEST-03` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-016 | requirement=resume with prior recovered failures

## Environment proof

- NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION: 33 requirements

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

Acceptance authority: no synthetic instant pass; each fault distinct; readiness/progress/resource thresholds enforced; checkpoint order restart-safe; resumed result cumulative; cleanup measured

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W3-T36` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
