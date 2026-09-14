
# BWS-W2-T23 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W2-T23
CAMPAIGN_ORDER: 23
STAGE: S3
PRIMARY_OWNER: R06
SECONDARY_REVIEWERS: R01, R03, R05, R07, R10, R11, R23
ISSUE_IDS: BWS118-R06-006, BWS118-R06-010, BWS118-R06-011, BWS118-R06-012, BWS118-R06-013, BWS118-R06-014
SEVERITY_COUNTS: {"P1": 5, "P2": 1}
DEPENDENCIES: T05, T11, T21
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen review/finding baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; active campaign authority is pinned by activation/immutable-authority.sha256; exact current numbered archive or checkout, extracted-tree digest, Git identity, source paths, hashes, and modes must be captured in an external audit or admission receipt and reverified before editing; repository documentation does not self-attest a rolling numbered ZIP
CURRENT_SOURCE_PATH_CANDIDATES: deployment/systemd-user/bws-operator.service.template, docs/035_continuous_service_supervisor_contract.md, packages/bootstrap/src/api/bws-read-only-query-http.ts, packages/bootstrap/src/cli/bws-read-only-api.ts, packages/bootstrap/src/operations/operator-lifecycle.ts, packages/bootstrap/src/operations/private-paper-scheduler-service.ts, packages/bootstrap/src/operations/private-paper-worker-service.ts, packages/bootstrap/src/operations/runtime-applications.ts, packages/bootstrap/src/operations/upstream-convergence-service.ts, scripts/bws-root-wrapper-runtime.mjs, tests/bws-operator-lifecycle.test.ts
SYMBOLS_TO_REVERIFY: 17 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: deployment/systemd-user/bws-operator.service.template, docs/035_continuous_service_supervisor_contract.md, packages/bootstrap/src/api/bws-read-only-query-http.ts, packages/bootstrap/src/operations/operator-lifecycle.ts, packages/bootstrap/src/operations/private-paper-scheduler-service.ts, packages/bootstrap/src/operations/private-paper-worker-service.ts, packages/bootstrap/src/operations/runtime-applications.ts, packages/bootstrap/src/operations/upstream-convergence-service.ts, scripts/bws-root-wrapper-runtime.mjs, tests/bws-operator-lifecycle.test.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites `- BWS-W1-T05`
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 31 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 31 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 2 classified records below
CONCURRENCY_OR_CRASH_TESTS: 14 classified records below
ENVIRONMENT_PROOF: {"NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED": 31}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: - One aggregate deadline
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": false, "bws_710": false, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W2-T24 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `deployment/systemd-user/bws-operator.service.template` | present=yes | sha256=ea4b7762d1c747f25f2cd9a779ef05e44ea25a2c026363461f85fe6608d64b4c | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `docs/035_continuous_service_supervisor_contract.md` | present=yes | sha256=cae4ce541c65848974de8c4568e72b6d2d3d151d9f2c3eaf52cb50e6777c8505 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/api/bws-read-only-query-http.ts` | present=yes | sha256=fc644a168e07d1afa63d84fa85582cda9c37994b2b4d66ea7366c1f442c7ac17 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/cli/bws-read-only-api.ts` | present=yes | sha256=5e08f4cc0b5f76a7c5c04e735c791281607fa007031c55b2dc0bf38c9d4cf811 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/operator-lifecycle.ts` | present=yes | sha256=704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/private-paper-scheduler-service.ts` | present=yes | sha256=876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/private-paper-worker-service.ts` | present=yes | sha256=1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/runtime-applications.ts` | present=yes | sha256=216b980403a59909b07a27fb475d22cf6ee35b41364fd0bb46c510d17d9e0322 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/upstream-convergence-service.ts` | present=yes | sha256=937ad8b789002504b674351c04e2179ba2800e17deea1d5e17aa0dd31786d5a8 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `scripts/bws-root-wrapper-runtime.mjs` | present=yes | sha256=1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `tests/bws-operator-lifecycle.test.ts` | present=yes | sha256=ff44f4a8b802187d11c4b9eb4d84cfc15570107a9080c27cfd0f48123a74a9e6 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS118-R06-006 | `packages/bootstrap/src/operations/operator-lifecycle.ts` | symbol=spawnAndPersistLifecycleState / waitForManagedApiObservable / shutdownManagedProcesses | reviewed_line_range=454-496; 752-771 | reviewed_sha256=704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- BWS118-R06-006 | `deployment/systemd-user/bws-operator.service.template` | symbol=service timeout contract | reviewed_line_range=6-17 | reviewed_sha256=ea4b7762d1c747f25f2cd9a779ef05e44ea25a2c026363461f85fe6608d64b4c
- BWS118-R06-006 | `scripts/bws-root-wrapper-runtime.mjs` | symbol=runCommand | reviewed_line_range=670-680 | reviewed_sha256=1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8
- BWS118-R06-010 | `packages/bootstrap/src/operations/operator-lifecycle.ts` | symbol=LIFECYCLE_ROLE_ORDER / shutdownManagedProcesses | reviewed_line_range=52-58; 752-771 | reviewed_sha256=704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- BWS118-R06-010 | `docs/035_continuous_service_supervisor_contract.md` | symbol=BWS-584 ordered shutdown | reviewed_line_range=91-103 | reviewed_sha256=cae4ce541c65848974de8c4568e72b6d2d3d151d9f2c3eaf52cb50e6777c8505
- BWS118-R06-010 | `tests/bws-operator-lifecycle.test.ts` | symbol=shutdown order assertion | reviewed_line_range=190-198 | reviewed_sha256=ff44f4a8b802187d11c4b9eb4d84cfc15570107a9080c27cfd0f48123a74a9e6
- BWS118-R06-011 | `packages/bootstrap/src/operations/operator-lifecycle.ts` | symbol=shutdownManagedProcesses | reviewed_line_range=752-771 | reviewed_sha256=704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- BWS118-R06-011 | `packages/bootstrap/src/operations/operator-lifecycle.ts` | symbol=stopManagedBwsOperatorStack | reviewed_line_range=303-330 | reviewed_sha256=704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- BWS118-R06-012 | `packages/bootstrap/src/operations/operator-lifecycle.ts` | symbol=inspectManagedProcesses / shutdownManagedProcesses | reviewed_line_range=752-790 | reviewed_sha256=704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- BWS118-R06-012 | `packages/bootstrap/src/operations/operator-lifecycle.ts` | symbol=readProcessSnapshot / waitForManagedProcessExit | reviewed_line_range=1037-1062; 1150-1158 | reviewed_sha256=704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- BWS118-R06-013 | `packages/bootstrap/src/operations/runtime-applications.ts` | symbol=startBwsReadOnlyApiApplication / close / closeHttpServer | reviewed_line_range=190-300; 863-889 | reviewed_sha256=216b980403a59909b07a27fb475d22cf6ee35b41364fd0bb46c510d17d9e0322
- BWS118-R06-013 | `packages/bootstrap/src/api/bws-read-only-query-http.ts` | symbol=createBwsReadOnlyQueryHttpHandler | reviewed_line_range=110-218 | reviewed_sha256=fc644a168e07d1afa63d84fa85582cda9c37994b2b4d66ea7366c1f442c7ac17
- BWS118-R06-013 | `packages/bootstrap/src/operations/runtime-applications.ts` | symbol=createManagedRuntimeRequestHandler metrics and async dispatch | reviewed_line_range=617-674 | reviewed_sha256=216b980403a59909b07a27fb475d22cf6ee35b41364fd0bb46c510d17d9e0322
- BWS118-R06-013 | `packages/bootstrap/src/cli/bws-read-only-api.ts` | symbol=runBwsReadOnlyApiCli | reviewed_line_range=16-39 | reviewed_sha256=5e08f4cc0b5f76a7c5c04e735c791281607fa007031c55b2dc0bf38c9d4cf811
- BWS118-R06-014 | `packages/bootstrap/src/operations/upstream-convergence-service.ts` | symbol=raceWithTimeout | reviewed_line_range=504-526 | reviewed_sha256=937ad8b789002504b674351c04e2179ba2800e17deea1d5e17aa0dd31786d5a8
- BWS118-R06-014 | `packages/bootstrap/src/operations/private-paper-scheduler-service.ts` | symbol=raceWithTimeout | reviewed_line_range=531-553 | reviewed_sha256=876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967
- BWS118-R06-014 | `packages/bootstrap/src/operations/private-paper-worker-service.ts` | symbol=raceWithTimeout | reviewed_line_range=552-574 | reviewed_sha256=1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS118-R06-006 — Lifecycle timeout settings are per-step rather than one aggregate deadline

- Severity: `P1`
- Current behavior: The same timeout is restarted for every child and the API. Stop similarly restarts its timeout per child. The root synchronous command has no deadline.
- Expected behavior: A caller-specified aggregate deadline must bound the whole lifecycle command, with remaining time passed to each stage and a consistent supervisor budget.
- Invariant: A caller-specified aggregate deadline must bound the whole lifecycle command, with remaining time passed to each stage and a consistent supervisor budget.
- Root cause: Timeouts are modeled as local polling limits rather than one composed lifecycle budget.
- Trigger: Consume most of the configured timeout in multiple sequential stages.
- Minimal fix boundary: Create a monotonic command deadline, pass remaining budget to spawn verification, probes, child drain/exit, and wrapper subprocesses, reserve cleanup time, and align systemd and evidence-command margins with that single budget.
- Regression risks:
- Tighter aggregate limits may expose current initialization latency
- Cleanup needs a reserved bounded budget rather than being skipped at deadline

### BWS118-R06-010 — Shutdown uses startup role order instead of scheduler-stop, worker-drain, convergence, cockpit, API order

- Severity: `P1`
- Current behavior: SIGTERM is sent to upstream convergence first, then scheduler, worker, cockpit/API process.
- Expected behavior: First prevent new scheduling, then allow/fence worker drain, then stop convergence, cockpit, and API while preserving status visibility until completion.
- Invariant: First prevent new scheduling, then allow/fence worker drain, then stop convergence, cockpit, and API while preserving status visibility until completion.
- Root cause: Startup/status presentation order was reused as shutdown dependency order.
- Trigger: Invoke stop on the managed stack.
- Minimal fix boundary: Define an explicit shutdown DAG/state machine, issue scheduler quiesce first, wait for a bounded worker drain/lease handoff, then stop convergence, cockpit, and API, with per-stage evidence and fallback escalation.
- Regression risks:
- Current loop signal behavior may not expose a separate quiesce/drain API and may need bounded contract changes
- Preserve the API until status/evidence publication is complete

### BWS118-R06-011 — One hung child aborts shutdown before remaining owned children are signaled

- Severity: `P1`
- Current behavior: The first timeout throws. Later children are never signaled, no aggregate result is emitted, and the state remains as it was before stop.
- Expected behavior: All owned processes should receive their stage-appropriate stop/quiesce signal, failures should be accumulated, escalation should be bounded, and retained state should identify every unresolved owner.
- Invariant: All owned processes should receive their stage-appropriate stop/quiesce signal, failures should be accumulated, escalation should be bounded, and retained state should identify every unresolved owner.
- Root cause: Shutdown is fail-fast at the first child rather than best-effort, fenced, and exhaustively accounted.
- Trigger: Stop a stack whose first selected process does not exit.
- Minimal fix boundary: Use a dependency-aware bounded shutdown coordinator that signals all eligible roles, records per-PID outcomes, escalates TERM to an explicitly approved fallback only after identity revalidation, preserves unresolved ownership, and returns an aggregate degraded-stop result.
- Regression risks:
- Concurrent signaling must preserve dependency order where drain matters
- Escalation policy must not kill unrelated/reused PIDs

### BWS118-R06-012 — Stop signaling and exit waits are vulnerable to PID reuse after the initial /proc verification

- Severity: `P1`
- Current behavior: A stale PID can be signaled after a prior snapshot, and a replacement process can keep the exit loop alive until timeout. The initial strong /proc proof is not carried through the destructive boundary.
- Expected behavior: Identity must be revalidated immediately before every signal and throughout exit verification using start ticks/token/cwd/cmdline or pidfd-style ownership.
- Invariant: Identity must be revalidated immediately before every signal and throughout exit verification using start ticks/token/cwd/cmdline or pidfd-style ownership.
- Root cause: Strong process identity is implemented for observation but discarded for signal and completion operations.
- Trigger: Race process termination/PID reuse between inspectManagedProcesses and process.kill or during waitForManagedProcessExit.
- Minimal fix boundary: Pass the full process record to signal/wait, re-read and compare /proc immediately before TERM and each poll, use pidfd where available, treat identity change as original owner exited, and never signal a mismatched replacement.
- Regression risks:
- Frequent /proc reads must handle transient disappearance without converting it into failure
- Cross-platform behavior must fail closed where exact identity cannot be proved

### BWS118-R06-013 — API listener and request promises lack one bounded, exception-safe ownership boundary

- Severity: `P1`
- Current behavior: An async request rejection can become unhandled and leave the client hanging. Signal callbacks use void close. server.close can wait indefinitely, and a pre-close logging exception occurs before closePromise is assigned.
- Expected behavior: All request promises, listener errors, sockets, and close work must be owned by one boundary that catches failures, aborts in-flight work, closes within a deadline, publishes terminal state, and settles application.closed exactly once.
- Invariant: All request promises, listener errors, sockets, and close work must be owned by one boundary that catches failures, aborts in-flight work, closes within a deadline, publishes terminal state, and settles application.closed exactly once.
- Root cause: Listener, request, logging, and close resources are composed as independent promises rather than one lifecycle-owned abort/error boundary.
- Trigger: Throw from metricsSnapshotFactory, send SIGTERM with an open request/socket, or throw during shutdown event emission.
- Minimal fix boundary: Install error/signal ownership before listen is exposed, wrap every async request path, assign an idempotent close promise before fallible work, track sockets and requests, abort/stop admission on close, apply an aggregate deadline, and settle closed with a recorded success/failure exactly once.
- Regression risks:
- Force-closing sockets can truncate legitimate read responses; define grace then abort
- Changing closed rejection semantics affects CLI error propagation

### BWS118-R06-014 — Successful service passes leave timeout timers alive until their full configured duration

- Severity: `P2`
- Current behavior: Every successful pass leaves its timer pending. Repeated passes accumulate active timers; the final one can keep Node alive after the function returns.
- Expected behavior: The losing timeout branch must be cancelled and released immediately, or use an unrefed/abortable deadline that cannot hold process liveness.
- Invariant: The losing timeout branch must be cancelled and released immediately, or use an unrefed/abortable deadline that cannot hold process liveness.
- Root cause: The timeout helper uses a bare sleep promise whose timer handle is inaccessible to the winner path.
- Trigger: Run a fast pass with a multi-second timeout and allow the service function to return.
- Minimal fix boundary: Replace sleepFor race with an abortable timeout helper that clears its handle in finally, and ensure late pass handling remains owned under the R01/R03 cancellation contracts.
- Regression risks:
- Do not accidentally stop observing the underlying pass when the timeout wins
- Timer unref alone does not solve late work ownership


## Allowed edit boundary

- Candidate path set: `deployment/systemd-user/bws-operator.service.template`, `docs/035_continuous_service_supervisor_contract.md`, `packages/bootstrap/src/api/bws-read-only-query-http.ts`, `packages/bootstrap/src/cli/bws-read-only-api.ts`, `packages/bootstrap/src/operations/operator-lifecycle.ts`, `packages/bootstrap/src/operations/private-paper-scheduler-service.ts`, `packages/bootstrap/src/operations/private-paper-worker-service.ts`, `packages/bootstrap/src/operations/runtime-applications.ts`, `packages/bootstrap/src/operations/upstream-convergence-service.ts`, `scripts/bws-root-wrapper-runtime.mjs`, `tests/bws-operator-lifecycle.test.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `deployment/systemd-user/bws-operator.service.template` | participating tranches=T22, T23 | predecessor postimage required
- `docs/035_continuous_service_supervisor_contract.md` | participating tranches=T10, T21, T23 | predecessor postimage required
- `packages/bootstrap/src/api/bws-read-only-query-http.ts` | participating tranches=T18, T22, T23 | predecessor postimage required
- `packages/bootstrap/src/operations/operator-lifecycle.ts` | participating tranches=T21, T22, T23, T24, T25, T37 | predecessor postimage required
- `packages/bootstrap/src/operations/private-paper-scheduler-service.ts` | participating tranches=T11, T21, T23, T24 | predecessor postimage required
- `packages/bootstrap/src/operations/private-paper-worker-service.ts` | participating tranches=T11, T21, T23, T24 | predecessor postimage required
- `packages/bootstrap/src/operations/runtime-applications.ts` | participating tranches=T19, T23, T25 | predecessor postimage required
- `packages/bootstrap/src/operations/upstream-convergence-service.ts` | participating tranches=T21, T23, T24 | predecessor postimage required
- `scripts/bws-root-wrapper-runtime.mjs` | participating tranches=T21, T22, T23, T25, T37, T38 | predecessor postimage required
- `tests/bws-operator-lifecycle.test.ts` | participating tranches=T22, T23 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- - No broad process termination
- Existing /proc command, cwd, token, and start-tick checks are intentional safeguards
- Existing per-probe AbortController cleanup remains unchanged
- Loopback-only bind and GET-only query policy remain unchanged
- No automatic SIGKILL is currently present
- No non-loopback network was contacted
- No provider or database work was executed
- No service or systemd unit was invoked
- No signal was sent during review
- No worker lease or database was touched
- Pass classification semantics remain unchanged
- State is retained on the direct stop exception, which remains a partial safeguard
- The documented shutdown order is unchanged
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T05, T11, T21.
- Review prerequisites: - BWS-W1-T05.
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

- `BWS118-R06-006-TEST-01` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-006 | requirement=Four slow child starts plus API probe
- `BWS118-R06-006-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-006 | requirement=Multiple slow child exits
- `BWS118-R06-006-TEST-03` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-006 | requirement=Outer systemd timeout before inner command deadline
- `BWS118-R06-006-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-006 | requirement=Wrapper child process that never exits
- `BWS118-R06-006-TEST-05` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-006 | requirement=Deadline expiration at each transition boundary
- `BWS118-R06-010-TEST-01` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-010 | requirement=Scheduler attempts a new cycle during shutdown
- `BWS118-R06-010-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-010 | requirement=Worker owns a lease during shutdown
- `BWS118-R06-010-TEST-03` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-010 | requirement=Drain completes and drain times out
- `BWS118-R06-010-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-010 | requirement=Convergence pass in flight while workers finish
- `BWS118-R06-010-TEST-05` | category=evidence_or_artifact | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-010 | requirement=Exact signal/order/evidence assertions
- `BWS118-R06-011-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-011 | requirement=First child ignores TERM
- `BWS118-R06-011-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-011 | requirement=Middle child times out after earlier exits
- `BWS118-R06-011-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-011 | requirement=Multiple children fail
- `BWS118-R06-011-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-011 | requirement=Signal throws ESRCH/EPERM
- `BWS118-R06-011-TEST-05` | category=evidence_or_artifact | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-011 | requirement=Aggregate state/evidence and second-stop convergence
- `BWS118-R06-012-TEST-01` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-012 | requirement=Synthetic process-runtime adapter simulating PID reuse before signal
- `BWS118-R06-012-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-012 | requirement=PID reuse during exit wait
- `BWS118-R06-012-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-012 | requirement=Command/token/cwd/start-tick mismatch
- `BWS118-R06-012-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-012 | requirement=ESRCH after verification
- `BWS118-R06-012-TEST-05` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-012 | requirement=pidfd and /proc fallback behavior
- `BWS118-R06-013-TEST-01` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-013 | requirement=Throwing metrics/status/cockpit/logger callbacks
- `BWS118-R06-013-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-013 | requirement=Open keep-alive and partial-body requests during SIGTERM
- `BWS118-R06-013-TEST-03` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-013 | requirement=Concurrent close calls and two signals
- `BWS118-R06-013-TEST-04` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-013 | requirement=server.close error and timeout
- `BWS118-R06-013-TEST-05` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-013 | requirement=Request completion after replacement generation starts
- `BWS118-R06-013-TEST-06` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-013 | requirement=application.closed resolution/rejection contract
- `BWS118-R06-014-TEST-01` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-014 | requirement=Fast pass with long timeout
- `BWS118-R06-014-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-014 | requirement=Thousands of quick passes with active-handle count
- `BWS118-R06-014-TEST-03` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-014 | requirement=Shutdown immediately after pass completion
- `BWS118-R06-014-TEST-04` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-014 | requirement=Timeout winner and pass rejection races
- `BWS118-R06-014-TEST-05` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-014 | requirement=No double settlement or unhandled rejection

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS118-R06-006-TEST-01` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-006 | requirement=Four slow child starts plus API probe
- `BWS118-R06-006-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-006 | requirement=Multiple slow child exits
- `BWS118-R06-006-TEST-03` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-006 | requirement=Outer systemd timeout before inner command deadline
- `BWS118-R06-006-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-006 | requirement=Wrapper child process that never exits
- `BWS118-R06-006-TEST-05` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-006 | requirement=Deadline expiration at each transition boundary
- `BWS118-R06-010-TEST-01` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-010 | requirement=Scheduler attempts a new cycle during shutdown
- `BWS118-R06-010-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-010 | requirement=Worker owns a lease during shutdown
- `BWS118-R06-010-TEST-03` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-010 | requirement=Drain completes and drain times out
- `BWS118-R06-010-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-010 | requirement=Convergence pass in flight while workers finish
- `BWS118-R06-010-TEST-05` | category=evidence_or_artifact | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-010 | requirement=Exact signal/order/evidence assertions
- `BWS118-R06-011-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-011 | requirement=First child ignores TERM
- `BWS118-R06-011-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-011 | requirement=Middle child times out after earlier exits
- `BWS118-R06-011-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-011 | requirement=Multiple children fail
- `BWS118-R06-011-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-011 | requirement=Signal throws ESRCH/EPERM
- `BWS118-R06-011-TEST-05` | category=evidence_or_artifact | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-011 | requirement=Aggregate state/evidence and second-stop convergence
- `BWS118-R06-012-TEST-01` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-012 | requirement=Synthetic process-runtime adapter simulating PID reuse before signal
- `BWS118-R06-012-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-012 | requirement=PID reuse during exit wait
- `BWS118-R06-012-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-012 | requirement=Command/token/cwd/start-tick mismatch
- `BWS118-R06-012-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-012 | requirement=ESRCH after verification
- `BWS118-R06-012-TEST-05` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-012 | requirement=pidfd and /proc fallback behavior
- `BWS118-R06-013-TEST-01` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-013 | requirement=Throwing metrics/status/cockpit/logger callbacks
- `BWS118-R06-013-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-013 | requirement=Open keep-alive and partial-body requests during SIGTERM
- `BWS118-R06-013-TEST-03` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-013 | requirement=Concurrent close calls and two signals
- `BWS118-R06-013-TEST-04` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-013 | requirement=server.close error and timeout
- `BWS118-R06-013-TEST-05` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-013 | requirement=Request completion after replacement generation starts
- `BWS118-R06-013-TEST-06` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-013 | requirement=application.closed resolution/rejection contract
- `BWS118-R06-014-TEST-01` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-014 | requirement=Fast pass with long timeout
- `BWS118-R06-014-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-014 | requirement=Thousands of quick passes with active-handle count
- `BWS118-R06-014-TEST-03` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-014 | requirement=Shutdown immediately after pass completion
- `BWS118-R06-014-TEST-04` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-014 | requirement=Timeout winner and pass rejection races
- `BWS118-R06-014-TEST-05` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-014 | requirement=No double settlement or unhandled rejection

## Negative and adversarial tests

- `BWS118-R06-011-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-011 | requirement=Multiple children fail
- `BWS118-R06-012-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-012 | requirement=Command/token/cwd/start-tick mismatch

## Concurrency, cancellation, crash, and restart tests

- `BWS118-R06-006-TEST-03` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-006 | requirement=Outer systemd timeout before inner command deadline
- `BWS118-R06-006-TEST-05` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-006 | requirement=Deadline expiration at each transition boundary
- `BWS118-R06-010-TEST-01` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-010 | requirement=Scheduler attempts a new cycle during shutdown
- `BWS118-R06-010-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-010 | requirement=Worker owns a lease during shutdown
- `BWS118-R06-010-TEST-03` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-010 | requirement=Drain completes and drain times out
- `BWS118-R06-012-TEST-01` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-012 | requirement=Synthetic process-runtime adapter simulating PID reuse before signal
- `BWS118-R06-012-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-012 | requirement=PID reuse during exit wait
- `BWS118-R06-012-TEST-05` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-012 | requirement=pidfd and /proc fallback behavior
- `BWS118-R06-013-TEST-03` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-013 | requirement=Concurrent close calls and two signals
- `BWS118-R06-013-TEST-04` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-013 | requirement=server.close error and timeout
- `BWS118-R06-013-TEST-05` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-013 | requirement=Request completion after replacement generation starts
- `BWS118-R06-014-TEST-01` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-014 | requirement=Fast pass with long timeout
- `BWS118-R06-014-TEST-03` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-014 | requirement=Shutdown immediately after pass completion
- `BWS118-R06-014-TEST-04` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R06-014 | requirement=Timeout winner and pass rejection races

## Environment proof

- NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED: 31 requirements

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

Acceptance authority: - One aggregate deadline

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W2-T24` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
