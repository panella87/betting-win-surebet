
# BWS-W2-T22 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W2-T22
CAMPAIGN_ORDER: 22
STAGE: S3
PRIMARY_OWNER: R06
SECONDARY_REVIEWERS: R03, R05, R07, R09, R10, R11, R12, R23
ISSUE_IDS: BWS118-R06-002, BWS118-R06-007, BWS118-R06-008, BWS118-R06-009
SEVERITY_COUNTS: {"P1": 4}
DEPENDENCIES: T21
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen application-source baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; documentation-audit preimage betting-win-surebet125.zip sha256=72a8262a5f94d144bb930cc9fb2778eed672d2a97a252f49b07f7b979b47224f with 995 regular files and no accepted remediation source result; this overlay changes documentation only; exact checkout/Git/source state must be reverified before editing
CURRENT_SOURCE_PATH_CANDIDATES: deployment/systemd-user/bws-operator.service.template, packages/bootstrap/src/api/bws-read-only-query-http.ts, packages/bootstrap/src/cli/bws-operator-lifecycle.ts, packages/bootstrap/src/operations/observability.ts, packages/bootstrap/src/operations/operator-lifecycle.ts, packages/bootstrap/src/operations/service-runtime.ts, scripts/bws-root-wrapper-runtime.mjs, tests/bws-operator-lifecycle.test.ts, tests/bws-service-runtime.test.ts, tests/root-wrapper-runtime.test.ts
SYMBOLS_TO_REVERIFY: 13 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: deployment/systemd-user/bws-operator.service.template, packages/bootstrap/src/api/bws-read-only-query-http.ts, packages/bootstrap/src/operations/observability.ts, packages/bootstrap/src/operations/operator-lifecycle.ts, scripts/bws-root-wrapper-runtime.mjs, tests/bws-operator-lifecycle.test.ts
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
FOCUSED_TESTS: 22 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 22 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 4 classified records below
CONCURRENCY_OR_CRASH_TESTS: 5 classified records below
ENVIRONMENT_PROOF: {"NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED": 22}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: - created/initializing/started-not-ready/ready/degraded/failed distinct
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": false, "bws_710": false, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W2-T23 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `deployment/systemd-user/bws-operator.service.template` | present=yes | sha256=ea4b7762d1c747f25f2cd9a779ef05e44ea25a2c026363461f85fe6608d64b4c | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/api/bws-read-only-query-http.ts` | present=yes | sha256=fc644a168e07d1afa63d84fa85582cda9c37994b2b4d66ea7366c1f442c7ac17 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/cli/bws-operator-lifecycle.ts` | present=yes | sha256=b17dff2d4e4012091b01943761efa1fe593c3de159e318b7fece264e751bedb5 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/observability.ts` | present=yes | sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/operator-lifecycle.ts` | present=yes | sha256=704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/service-runtime.ts` | present=yes | sha256=5ef569931413868cf0b2e69a653ee65cdcace9bb561f52eea1d9fb82e3ce93f3 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `scripts/bws-root-wrapper-runtime.mjs` | present=yes | sha256=1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `tests/bws-operator-lifecycle.test.ts` | present=yes | sha256=ff44f4a8b802187d11c4b9eb4d84cfc15570107a9080c27cfd0f48123a74a9e6 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `tests/bws-service-runtime.test.ts` | present=yes | sha256=6d6e726a0a688c6d673457287173d07a5359caf9ce4c09dde73b2dcb938d63cc | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `tests/root-wrapper-runtime.test.ts` | present=yes | sha256=f216fabdae694a4848855786d665f2ac05e627648d7332d0b1e37c45dc9d22c3 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS118-R06-002 | `packages/bootstrap/src/operations/operator-lifecycle.ts` | symbol=spawnAndPersistLifecycleState / waitForManagedApiObservable / publishLifecycleEvidence | reviewed_line_range=446-523; 526-599; 948-976 | reviewed_sha256=704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- BWS118-R06-002 | `tests/bws-operator-lifecycle.test.ts` | symbol=start lifecycle blocked-readiness expectation | reviewed_line_range=204-213 | reviewed_sha256=ff44f4a8b802187d11c4b9eb4d84cfc15570107a9080c27cfd0f48123a74a9e6
- BWS118-R06-007 | `packages/bootstrap/src/operations/service-runtime.ts` | symbol=createBwsOperationalStatusSnapshot | reviewed_line_range=330-417 | reviewed_sha256=5ef569931413868cf0b2e69a653ee65cdcace9bb561f52eea1d9fb82e3ce93f3
- BWS118-R06-007 | `packages/bootstrap/src/operations/observability.ts` | symbol=createBwsMetricsSnapshot | reviewed_line_range=442-527 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS118-R06-007 | `packages/bootstrap/src/api/bws-read-only-query-http.ts` | symbol=health and readiness routes | reviewed_line_range=125-153 | reviewed_sha256=fc644a168e07d1afa63d84fa85582cda9c37994b2b4d66ea7366c1f442c7ac17
- BWS118-R06-007 | `tests/bws-service-runtime.test.ts` | symbol=operational status snapshot tests | reviewed_line_range=120-200 | reviewed_sha256=6d6e726a0a688c6d673457287173d07a5359caf9ce4c09dde73b2dcb938d63cc
- BWS118-R06-008 | `scripts/bws-root-wrapper-runtime.mjs` | symbol=runtime summary constants / buildRuntimeSummary / classifyRuntimeCondition | reviewed_line_range=8-13; 320-386; 511-542 | reviewed_sha256=1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8
- BWS118-R06-008 | `packages/bootstrap/src/api/bws-read-only-query-http.ts` | symbol=health and readiness response envelopes | reviewed_line_range=128-153 | reviewed_sha256=fc644a168e07d1afa63d84fa85582cda9c37994b2b4d66ea7366c1f442c7ac17
- BWS118-R06-008 | `packages/bootstrap/src/operations/operator-lifecycle.ts` | symbol=resolveLifecycleEvidenceFilePath | reviewed_line_range=913-927 | reviewed_sha256=704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- BWS118-R06-008 | `tests/root-wrapper-runtime.test.ts` | symbol=createRuntimeFixture | reviewed_line_range=302-423 | reviewed_sha256=f216fabdae694a4848855786d665f2ac05e627648d7332d0b1e37c45dc9d22c3
- BWS118-R06-009 | `packages/bootstrap/src/cli/bws-operator-lifecycle.ts` | symbol=runBwsOperatorLifecycleCli | reviewed_line_range=8-30 | reviewed_sha256=b17dff2d4e4012091b01943761efa1fe593c3de159e318b7fece264e751bedb5
- BWS118-R06-009 | `deployment/systemd-user/bws-operator.service.template` | symbol=systemd user service | reviewed_line_range=6-17 | reviewed_sha256=ea4b7762d1c747f25f2cd9a779ef05e44ea25a2c026363461f85fe6608d64b4c
- BWS118-R06-009 | `packages/bootstrap/src/operations/operator-lifecycle.ts` | symbol=getManagedBwsOperatorStackStatus | reviewed_line_range=266-300 | reviewed_sha256=704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS118-R06-002 — Stack startup reports started before non-API services and full readiness are established

- Severity: `P1`
- Current behavior: The function persists the stack and returns started once API health is successful. The calculated stack may be blocked or degraded without changing outcome or CLI success.
- Expected behavior: The start result and exit status must distinguish process creation from initialization and from full-stack readiness. A successful terminal start must require every required role to own an observable compatible runtime generation, or return a non-ready outcome.
- Invariant: The start result and exit status must distinguish process creation from initialization and from full-stack readiness. A successful terminal start must require every required role to own an observable compatible runtime generation, or return a non-ready outcome.
- Root cause: Startup outcome authority is tied to one API probe rather than the complete required-role state machine.
- Trigger: Start the managed stack under blocked database/cockpit/scheduler/worker/upstream readiness or a child stuck after process creation.
- Minimal fix boundary: Define explicit initializing, started-not-ready, ready, degraded, and failed-start outcomes. Require service-owned generation/status evidence for all roles before ready, and ensure CLI/systemd exit semantics reflect the returned condition.
- Regression risks:
- BWS-600 intentionally measures some blocked readiness during evidence windows; preserve that use case as a distinct non-ready state rather than calling it a completed start

### BWS118-R06-007 — API health, readiness, and metrics can remain green from declarations and stale state files after child failure

- Severity: `P1`
- Current behavior: Several components remain pass by construction. Metrics reports API ready and reads lifecycle values directly from files. No PID/token/start-tick/source-generation check is performed in these snapshots.
- Expected behavior: Health must describe current liveness, readiness must require every necessary service and durable dependency for the exact runtime generation, and metrics must not promote stale files to running.
- Invariant: Health must describe current liveness, readiness must require every necessary service and durable dependency for the exact runtime generation, and metrics must not promote stale files to running.
- Root cause: Health/readiness aggregation does not consume the lifecycle owner as authoritative current state.
- Trigger: Query health/readiness/metrics after process loss or stale-file retention.
- Minimal fix boundary: Build health/readiness from verified lifecycle ownership, exact runtime IDs/source generation, database compatibility/connectivity, loop service checkpoints and freshness, and API request-serving state. Make stale/unknown explicit and fail closed.
- Regression risks:
- Do not make external BWS-600 upstream availability equivalent to local process liveness
- Health and readiness may need different strictness but must share current authority

### BWS118-R06-008 — The root runtime summary is disconnected from production lifecycle evidence, process verification, and HTTP envelopes

- Severity: `P1`
- Current behavior: Production nested envelopes are classified degraded. Conversely, test-shaped top-level envelopes plus raw state and hand-written latest files can be classified ready without any process records.
- Expected behavior: The summary must call or reuse the authoritative lifecycle status path, verify every managed process and generation, consume the actual response schemas, and locate immutable evidence through a canonical index/pointer.
- Invariant: The summary must call or reuse the authoritative lifecycle status path, verify every managed process and generation, consume the actual response schemas, and locate immutable evidence through a canonical index/pointer.
- Root cause: Operator summary logic duplicated lifecycle and HTTP contracts instead of consuming their typed, generation-bound authority.
- Trigger: Run the root runtime summary against production envelopes or a state file with no current process ownership.
- Minimal fix boundary: Make runtime-summary invoke a read-only lifecycle status API/module or parse its exact schema, verify process ownership and source generation, use the evidence index for immutable latest selection, and reject missing process arrays or runtime-ID mismatches.
- Regression risks:
- Changing wrapper output keys can affect automation parsers
- A canonical latest pointer must be written atomically or derived deterministically from the evidence index

### BWS118-R06-009 — CLI exit codes and the oneshot systemd unit remain successful while the managed stack is degraded or gone

- Severity: `P1`
- Current behavior: The oneshot unit remains active after its command exits and has no MainPID supervising detached children. CLI status returns 0 for every non-exception result.
- Expected behavior: Supervisor success and active/readiness state must reflect the current generation-bound managed process set. Degraded/not-running status must be machine-visible as non-success.
- Invariant: Supervisor success and active/readiness state must reflect the current generation-bound managed process set. Degraded/not-running status must be machine-visible as non-success.
- Root cause: The deployment unit supervises a control command, not the runtime, and the CLI treats serialization as success rather than mapping state to exit status.
- Trigger: Query systemd state or reload after child failure.
- Minimal fix boundary: Use a long-running foreground supervisor as the systemd MainPID or create explicit target units per process with dependencies. Map status/readiness outcomes to documented nonzero exit codes and add a watchdog/restart policy bound to exact lifecycle state.
- Regression risks:
- Service topology changes affect packaging and deployment scripts
- Do not let systemd restart externally blocked BWS-600 work automatically


## Allowed edit boundary

- Candidate path set: `deployment/systemd-user/bws-operator.service.template`, `packages/bootstrap/src/api/bws-read-only-query-http.ts`, `packages/bootstrap/src/cli/bws-operator-lifecycle.ts`, `packages/bootstrap/src/operations/observability.ts`, `packages/bootstrap/src/operations/operator-lifecycle.ts`, `packages/bootstrap/src/operations/service-runtime.ts`, `scripts/bws-root-wrapper-runtime.mjs`, `tests/bws-operator-lifecycle.test.ts`, `tests/bws-service-runtime.test.ts`, `tests/root-wrapper-runtime.test.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `deployment/systemd-user/bws-operator.service.template` | participating tranches=T22, T23 | predecessor postimage required
- `packages/bootstrap/src/api/bws-read-only-query-http.ts` | participating tranches=T18, T22, T23 | predecessor postimage required
- `packages/bootstrap/src/operations/observability.ts` | participating tranches=T22, T26, T27, T28 | predecessor postimage required
- `packages/bootstrap/src/operations/operator-lifecycle.ts` | participating tranches=T21, T22, T23, T24, T25, T37 | predecessor postimage required
- `scripts/bws-root-wrapper-runtime.mjs` | participating tranches=T21, T22, T23, T25, T37, T38 | predecessor postimage required
- `tests/bws-operator-lifecycle.test.ts` | participating tranches=T22, T23 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- - External BWS-600 hold remains blocked
- Automation artifact reporting before runtime-summary remains unchanged
- Execution and provider connections remain disabled
- No claim is made that blocked external upstream evidence should become ready
- No claim is made that the cockpit-only check is itself incorrect
- No systemd command was run
- The API health probe remains loopback-only
- The API remains read-only and loopback-bound
- The wrapper loopback request timeout remains bounded
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T21.
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

- `BWS118-R06-002-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-002 | requirement=Child alive but loop state absent
- `BWS118-R06-002-TEST-02` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-002 | requirement=API healthy with readiness blocked
- `BWS118-R06-002-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-002 | requirement=Scheduler or worker initialization hang
- `BWS118-R06-002-TEST-04` | category=persistence_or_migration | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-002 | requirement=Database migration blocked after child creation
- `BWS118-R06-002-TEST-05` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-002 | requirement=Start result/exit code matrix for initializing, blocked, degraded, and ready
- `BWS118-R06-007-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-007 | requirement=Kill each managed child then query all three endpoints
- `BWS118-R06-007-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-007 | requirement=Stale state file with reused PID
- `BWS118-R06-007-TEST-03` | category=persistence_or_migration | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-007 | requirement=Database unavailable after startup
- `BWS118-R06-007-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-007 | requirement=Runtime ID mismatch across state files
- `BWS118-R06-007-TEST-05` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-007 | requirement=Loop last-success age exceeds policy
- `BWS118-R06-007-TEST-06` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-007 | requirement=API listener alive but query dependencies failed
- `BWS118-R06-008-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-008 | requirement=Production /health and /readiness envelope fixtures generated by the actual handler
- `BWS118-R06-008-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-008 | requirement=State file with no processes
- `BWS118-R06-008-TEST-03` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-008 | requirement=Stale process records and missing latest pointer
- `BWS118-R06-008-TEST-04` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-008 | requirement=Concurrent evidence index update
- `BWS118-R06-008-TEST-05` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-008 | requirement=Runtime ID/source generation mismatch
- `BWS118-R06-008-TEST-06` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-008 | requirement=check_progress exit/status behavior for ready, degraded, blocked, not-running
- `BWS118-R06-009-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-009 | requirement=Child exits after oneshot start
- `BWS118-R06-009-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-009 | requirement=All children missing while unit remains active
- `BWS118-R06-009-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-009 | requirement=ExecReload under degraded/not_running
- `BWS118-R06-009-TEST-04` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-009 | requirement=systemd restart and stop during partial state
- `BWS118-R06-009-TEST-05` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-009 | requirement=Exit-code matrix for every lifecycle outcome

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS118-R06-002-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-002 | requirement=Child alive but loop state absent
- `BWS118-R06-002-TEST-02` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-002 | requirement=API healthy with readiness blocked
- `BWS118-R06-002-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-002 | requirement=Scheduler or worker initialization hang
- `BWS118-R06-002-TEST-04` | category=persistence_or_migration | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-002 | requirement=Database migration blocked after child creation
- `BWS118-R06-002-TEST-05` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-002 | requirement=Start result/exit code matrix for initializing, blocked, degraded, and ready
- `BWS118-R06-007-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-007 | requirement=Kill each managed child then query all three endpoints
- `BWS118-R06-007-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-007 | requirement=Stale state file with reused PID
- `BWS118-R06-007-TEST-03` | category=persistence_or_migration | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-007 | requirement=Database unavailable after startup
- `BWS118-R06-007-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-007 | requirement=Runtime ID mismatch across state files
- `BWS118-R06-007-TEST-05` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-007 | requirement=Loop last-success age exceeds policy
- `BWS118-R06-007-TEST-06` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-007 | requirement=API listener alive but query dependencies failed
- `BWS118-R06-008-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-008 | requirement=Production /health and /readiness envelope fixtures generated by the actual handler
- `BWS118-R06-008-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-008 | requirement=State file with no processes
- `BWS118-R06-008-TEST-03` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-008 | requirement=Stale process records and missing latest pointer
- `BWS118-R06-008-TEST-04` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-008 | requirement=Concurrent evidence index update
- `BWS118-R06-008-TEST-05` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-008 | requirement=Runtime ID/source generation mismatch
- `BWS118-R06-008-TEST-06` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-008 | requirement=check_progress exit/status behavior for ready, degraded, blocked, not-running
- `BWS118-R06-009-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-009 | requirement=Child exits after oneshot start
- `BWS118-R06-009-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-009 | requirement=All children missing while unit remains active
- `BWS118-R06-009-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-009 | requirement=ExecReload under degraded/not_running
- `BWS118-R06-009-TEST-04` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-009 | requirement=systemd restart and stop during partial state
- `BWS118-R06-009-TEST-05` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-009 | requirement=Exit-code matrix for every lifecycle outcome

## Negative and adversarial tests

- `BWS118-R06-007-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-007 | requirement=Stale state file with reused PID
- `BWS118-R06-007-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-007 | requirement=Runtime ID mismatch across state files
- `BWS118-R06-008-TEST-03` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-008 | requirement=Stale process records and missing latest pointer
- `BWS118-R06-008-TEST-05` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-008 | requirement=Runtime ID/source generation mismatch

## Concurrency, cancellation, crash, and restart tests

- `BWS118-R06-007-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-007 | requirement=Stale state file with reused PID
- `BWS118-R06-008-TEST-03` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-008 | requirement=Stale process records and missing latest pointer
- `BWS118-R06-008-TEST-04` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-008 | requirement=Concurrent evidence index update
- `BWS118-R06-008-TEST-05` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-008 | requirement=Runtime ID/source generation mismatch
- `BWS118-R06-009-TEST-04` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-009 | requirement=systemd restart and stop during partial state

## Environment proof

- NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED: 22 requirements

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

Acceptance authority: - created/initializing/started-not-ready/ready/degraded/failed distinct

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W2-T23` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
