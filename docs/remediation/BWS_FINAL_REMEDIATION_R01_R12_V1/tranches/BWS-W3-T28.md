
# BWS-W3-T28 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W3-T28
CAMPAIGN_ORDER: 39
STAGE: S5
PRIMARY_OWNER: R07
SECONDARY_REVIEWERS: R01, R03, R04, R05, R06, R10, R11, R12
ISSUE_IDS: BWS120-R07-006, BWS120-R07-007, BWS120-R07-009, BWS120-R07-010, BWS120-R07-011
SEVERITY_COUNTS: {"P1": 4, "P2": 1}
DEPENDENCIES: T18, T22, T23, T26, T27
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen review/finding baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; active campaign authority is pinned by activation/immutable-authority.sha256; exact current numbered archive or checkout, extracted-tree digest, Git identity, source paths, hashes, and modes must be captured in an external audit or admission receipt and reverified before editing; repository documentation does not self-attest a rolling numbered ZIP
CURRENT_SOURCE_PATH_CANDIDATES: packages/bootstrap/src/operations/observability.ts, packages/bootstrap/src/operations/paper-runtime-evidence.ts, run-paper-autopilot.sh, run-paper-evaluation.sh, tests/bws-observability.test.ts, tests/bws-paper-runtime-evidence.test.ts
SYMBOLS_TO_REVERIFY: 20 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: packages/bootstrap/src/operations/observability.ts, packages/bootstrap/src/operations/paper-runtime-evidence.ts, run-paper-autopilot.sh, run-paper-evaluation.sh, tests/bws-observability.test.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites ``R05 typed response truth; R06 generation/readiness truth``
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 31 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 31 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 6 classified records below
CONCURRENCY_OR_CRASH_TESTS: 3 classified records below
ENVIRONMENT_PROOF: {"NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION": 31}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: non-2xx/schema-invalid fail closed; no synthetic-ready substitution; continuous monotonic observation window; exact generation binding
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": true, "bws_710": false, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W3-T29 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `packages/bootstrap/src/operations/observability.ts` | present=yes | sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/paper-runtime-evidence.ts` | present=yes | sha256=d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `run-paper-autopilot.sh` | present=yes | sha256=fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `run-paper-evaluation.sh` | present=yes | sha256=d7d821119d51c3dd5bbcf7a80f0e98488ebd38f7d771310265939a918505e667 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `tests/bws-observability.test.ts` | present=yes | sha256=b1f86186bd8cc389a620c6ef53b60b83e2b8c3ef3dd7e0dc635ca6e9f5fda6c5 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `tests/bws-paper-runtime-evidence.test.ts` | present=yes | sha256=64b1c04c9d626dedf3059393e095c4a4e8c5cf4399ccb3deb88d60d433d51439 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS120-R07-006 | `packages/bootstrap/src/operations/observability.ts` | symbol=collectDiagnosticsStateSnapshot | reviewed_line_range=L631-L677 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-006 | `packages/bootstrap/src/operations/observability.ts` | symbol=fetchLoopbackJson | reviewed_line_range=L691-L713 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-006 | `tests/bws-observability.test.ts` | symbol=diagnostics fetchJson fixture | reviewed_line_range=L138-L180 | reviewed_sha256=b1f86186bd8cc389a620c6ef53b60b83e2b8c3ef3dd7e0dc635ca6e9f5fda6c5
- BWS120-R07-006 | `packages/bootstrap/src/operations/observability.ts` | symbol=None | reviewed_line_range=L691-L713 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-007 | `packages/bootstrap/src/operations/observability.ts` | symbol=createBwsMetricsSnapshot | reviewed_line_range=L479-L484 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-007 | `packages/bootstrap/src/operations/observability.ts` | symbol=collectDiagnosticsStateSnapshot | reviewed_line_range=L631-L677 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-007 | `packages/bootstrap/src/operations/observability.ts` | symbol=collectDiagnosticsStateSnapshot / createBwsMetricsSnapshot | reviewed_line_range=L479-L484; L631-L677 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-007 | `packages/bootstrap/src/operations/observability.ts` | symbol=None | reviewed_line_range=L479-L484; L631-L677 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-009 | `packages/bootstrap/src/operations/paper-runtime-evidence.ts` | symbol=createBwsPaperRuntimeEvidence | reviewed_line_range=L206-L330 | reviewed_sha256=d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d
- BWS120-R07-009 | `run-paper-autopilot.sh` | symbol=defaults / run_child_controller | reviewed_line_range=L15-L30; L842-L872 | reviewed_sha256=fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661
- BWS120-R07-009 | `run-paper-evaluation.sh` | symbol=run_runtime_evidence_mode | reviewed_line_range=L845-L933 | reviewed_sha256=d7d821119d51c3dd5bbcf7a80f0e98488ebd38f7d771310265939a918505e667
- BWS120-R07-009 | `tests/bws-paper-runtime-evidence.test.ts` | symbol=ready observation test | reviewed_line_range=L519-L598 | reviewed_sha256=64b1c04c9d626dedf3059393e095c4a4e8c5cf4399ccb3deb88d60d433d51439
- BWS120-R07-009 | `packages/bootstrap/src/operations/paper-runtime-evidence.ts` | symbol=None | reviewed_line_range=L206-L330 | reviewed_sha256=d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d
- BWS120-R07-010 | `packages/bootstrap/src/operations/paper-runtime-evidence.ts` | symbol=buildObservationSample | reviewed_line_range=L406-L439 | reviewed_sha256=d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d
- BWS120-R07-010 | `packages/bootstrap/src/operations/paper-runtime-evidence.ts` | symbol=sampleIsReady | reviewed_line_range=L455-L468 | reviewed_sha256=d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d
- BWS120-R07-010 | `packages/bootstrap/src/operations/paper-runtime-evidence.ts` | symbol=createResult | reviewed_line_range=L471-L519 | reviewed_sha256=d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d
- BWS120-R07-010 | `packages/bootstrap/src/operations/paper-runtime-evidence.ts` | symbol=buildObservationSample / sampleIsReady / createResult | reviewed_line_range=L406-L519 | reviewed_sha256=d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d
- BWS120-R07-010 | `packages/bootstrap/src/operations/paper-runtime-evidence.ts` | symbol=None | reviewed_line_range=L406-L519 | reviewed_sha256=d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d
- BWS120-R07-011 | `packages/bootstrap/src/operations/paper-runtime-evidence.ts` | symbol=createBwsPaperRuntimeEvidence observation loop | reviewed_line_range=L289-L322 | reviewed_sha256=d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d
- BWS120-R07-011 | `packages/bootstrap/src/operations/paper-runtime-evidence.ts` | symbol=None | reviewed_line_range=L289-L322 | reviewed_sha256=d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS120-R07-006 — Loopback diagnostics accept non-2xx and schema-invalid JSON as successful health/readiness/metrics evidence

- Severity: `P1`
- Current behavior: Any parseable JSON is represented as an ok response. Downstream diagnostics and runtime-evidence sampling read its fields without a transport receipt.
- Expected behavior: Every probe must require an exact route-specific 2xx status, content type, closed schema, runtime/source generation, and fail-closed error classification.
- Invariant: Every probe must require an exact route-specific 2xx status, content type, closed schema, runtime/source generation, and fail-closed error classification.
- Root cause: JSON parse success is conflated with HTTP and contract success.
- Trigger: Return HTTP 500/404/3xx with JSON containing ready-shaped fields, or 200 with a wrong schema.
- Minimal fix boundary: Return a typed probe receipt containing status, content type, final URL, route, body hash, schema/version, runtime ID, and source fingerprint; reject non-2xx, redirects, and malformed/extra-state bodies.
- Regression risks:
- Closed schema validation must remain compatible with explicitly versioned endpoint upgrades.

### BWS120-R07-007 — A failed metrics request is silently replaced by synthesized metrics that declare the API ready

- Severity: `P1`
- Current behavior: The diagnostics bundle contains a locally synthesized bws.metrics_snapshot.v1 with api.status=ready. Its shape is indistinguishable from fetched metrics to downstream readers.
- Expected behavior: Missing endpoint evidence must remain missing/blocked and be explicitly labeled by origin; synthesized operational context must never claim endpoint readiness.
- Invariant: Missing endpoint evidence must remain missing/blocked and be explicitly labeled by origin; synthesized operational context must never claim endpoint readiness.
- Root cause: The code uses a convenience snapshot as evidence fallback without origin or conservative status semantics.
- Trigger: Time out, refuse, or return invalid JSON from the metrics endpoint.
- Minimal fix boundary: Split fetched endpoint evidence from local diagnostic context. On fetch failure set metrics origin=synthesized and API status=blocked/unknown; prohibit synthesized fields from satisfying acceptance.
- Regression risks:
- Operators may still need local context during an outage; preserve it in a separate non-acceptance field.

### BWS120-R07-009 — BWS-600 readiness can be certified from one ready sample and does not require a continuously ready window

- Severity: `P1`
- Current behavior: The default exits immediately on the first ready sample. With monitoring enabled, a blocked-to-ready sequence ends ready because the mutable ready variable contains only the last sample; earlier failures are not part of the verdict.
- Expected behavior: A configured 72-hour evidence window must evaluate every scheduled interval, require an explicit continuity policy, account for missed samples, and fail/qualify any degradation according to that policy.
- Invariant: A configured 72-hour evidence window must evaluate every scheduled interval, require an explicit continuity policy, account for missed samples, and fail/qualify any degradation according to that policy.
- Root cause: The implementation models readiness as a latest-sample boolean instead of a window aggregate with continuity requirements.
- Trigger: Run the default BWS-600 route; alternatively run keep-monitoring with earlier blocked samples followed by one final ready sample.
- Minimal fix boundary: Define an explicit window policy: minimum elapsed monotonic duration, expected sample schedule, maximum gap, minimum sample count, and all/threshold readiness semantics. Keep ready handoff provisional until the window closes.
- Regression risks:
- A strict all-samples policy may be too brittle; the policy must be explicit and machine-bound rather than implicit latest state.

### BWS120-R07-010 — Runtime-evidence readiness is not bound to one exact source, data, process, campaign, and artifact generation

- Severity: `P1`
- Current behavior: The sample and result contain no fields capable of proving those relationships, and sampleIsReady does not compare them.
- Expected behavior: One observation must cryptographically bind exact source/release/upstream lock, runtime/process identities, data generation/currentness, response receipts, diagnostics manifest, lifecycle evidence, evidence-index sequence, and parent campaign.
- Invariant: One observation must cryptographically bind exact source/release/upstream lock, runtime/process identities, data generation/currentness, response receipts, diagnostics manifest, lifecycle evidence, evidence-index sequence, and parent campaign.
- Root cause: R07 promotion reduces rich source artifacts to unbound status labels and paths before acceptance.
- Trigger: Present individually valid ready-shaped inputs whose runtime IDs/source fingerprints/campaigns differ, or a stale upstreamLastSuccessAt.
- Minimal fix boundary: Introduce an immutable observation receipt with hashes and generation IDs for every component; validate all joins, freshness, and parent campaign fingerprint before promotion; include the receipt digest in the result and parent terminal protocol.
- Regression risks:
- Adding binding fields changes evidence schemas; retain explicit versioning and migration/rejection for historical evidence.

### BWS120-R07-011 — Observation duration is governed by wall-clock strings and can be unbounded or prematurely complete after clock changes

- Severity: `P2`
- Current behavior: The elapsed calculation may never reach maxDurationMs after a backward/frozen clock, or may terminate early after a forward jump.
- Expected behavior: Max duration must use a monotonic clock/deadline and bounded cancellation, while UTC timestamps are recorded only as evidence.
- Invariant: Max duration must use a monotonic clock/deadline and bounded cancellation, while UTC timestamps are recorded only as evidence.
- Root cause: Wall-clock evidence time is also used as the control-plane deadline.
- Trigger: Run a never-ready observation with constant or decreasing timestamps.
- Minimal fix boundary: Use performance.now/process.hrtime or an injected monotonic clock plus AbortSignal; retain bounded wall-clock skew checks separately.
- Regression risks:
- Monotonic and UTC clocks must be sampled together without falsely rejecting legitimate NTP adjustment.


## Allowed edit boundary

- Candidate path set: `packages/bootstrap/src/operations/observability.ts`, `packages/bootstrap/src/operations/paper-runtime-evidence.ts`, `run-paper-autopilot.sh`, `run-paper-evaluation.sh`, `tests/bws-observability.test.ts`, `tests/bws-paper-runtime-evidence.test.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `packages/bootstrap/src/operations/observability.ts` | participating tranches=T22, T26, T27, T28 | predecessor postimage required
- `packages/bootstrap/src/operations/paper-runtime-evidence.ts` | participating tranches=T27, T28 | predecessor postimage required
- `run-paper-autopilot.sh` | participating tranches=T28, T29, T44, T45, T46, T47 | predecessor postimage required
- `run-paper-evaluation.sh` | participating tranches=T28, T29, T44, T46 | predecessor postimage required
- `tests/bws-observability.test.ts` | participating tranches=T26, T28 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- 2-second timeout
- API-only preflight
- Database/queue diagnostic collection
- Loopback-only destination
- UTC generatedAt fields
- Upstream semantic correctness remains R01-owned
- all betting-win source, checkout, documentation, service, database, and runtime
- closed execution/provider policy
- configured interval and duration values
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds
- health/readiness failure objects
- loopback-only policy
- process lifecycle correctness remains R06-owned
- provider/execution disabled policy
- report economics remain R04-owned
- sample content semantics
- stack ownership and stop behavior outside the verdict aggregation

## Prerequisites

- Dependency terminal receipts: T18, T22, T23, T26, T27.
- Review prerequisites: `R05 typed response truth; R06 generation/readiness truth`.
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

- `BWS120-R07-006-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-006 | requirement=500 JSON ready body
- `BWS120-R07-006-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-006 | requirement=404 JSON
- `BWS120-R07-006-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-006 | requirement=redirect
- `BWS120-R07-006-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-006 | requirement=wrong content type
- `BWS120-R07-006-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-006 | requirement=wrong schema/version
- `BWS120-R07-006-TEST-06` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-006 | requirement=different runtime ID
- `BWS120-R07-006-TEST-07` | category=cancellation_or_timeout | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-006 | requirement=oversized body and timeout
- `BWS120-R07-007-TEST-01` | category=cancellation_or_timeout | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-007 | requirement=Metrics timeout/refusal
- `BWS120-R07-007-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-007 | requirement=non-JSON metrics response
- `BWS120-R07-007-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-007 | requirement=fetched-versus-synthesized origin
- `BWS120-R07-007-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-007 | requirement=fallback cannot satisfy sampleIsReady
- `BWS120-R07-007-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-007 | requirement=mixed stale-state regression
- `BWS120-R07-009-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-009 | requirement=One ready sample must not satisfy 72h
- `BWS120-R07-009-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-009 | requirement=ready→blocked
- `BWS120-R07-009-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-009 | requirement=blocked→ready
- `BWS120-R07-009-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-009 | requirement=missed intervals
- `BWS120-R07-009-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-009 | requirement=collection gap
- `BWS120-R07-009-TEST-06` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-009 | requirement=exact duration/minimum sample count
- `BWS120-R07-009-TEST-07` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-009 | requirement=restart/resume continuity
- `BWS120-R07-010-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-010 | requirement=Mixed runtime IDs
- `BWS120-R07-010-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-010 | requirement=mixed source fingerprints
- `BWS120-R07-010-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-010 | requirement=stale/future lastSuccessAt
- `BWS120-R07-010-TEST-04` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-010 | requirement=diagnostics path with different hash
- `BWS120-R07-010-TEST-05` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-010 | requirement=lifecycle/handoff generation mismatch
- `BWS120-R07-010-TEST-06` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-010 | requirement=evidence-index sequence mismatch
- `BWS120-R07-010-TEST-07` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-010 | requirement=campaign-manifest mismatch
- `BWS120-R07-011-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-011 | requirement=Frozen time
- `BWS120-R07-011-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-011 | requirement=backward jump
- `BWS120-R07-011-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-011 | requirement=forward jump
- `BWS120-R07-011-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-011 | requirement=abort during sleep/collection
- `BWS120-R07-011-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-011 | requirement=maximum sample/iteration guard

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS120-R07-006-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-006 | requirement=500 JSON ready body
- `BWS120-R07-006-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-006 | requirement=404 JSON
- `BWS120-R07-006-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-006 | requirement=redirect
- `BWS120-R07-006-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-006 | requirement=wrong content type
- `BWS120-R07-006-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-006 | requirement=wrong schema/version
- `BWS120-R07-006-TEST-06` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-006 | requirement=different runtime ID
- `BWS120-R07-006-TEST-07` | category=cancellation_or_timeout | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-006 | requirement=oversized body and timeout
- `BWS120-R07-007-TEST-01` | category=cancellation_or_timeout | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-007 | requirement=Metrics timeout/refusal
- `BWS120-R07-007-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-007 | requirement=non-JSON metrics response
- `BWS120-R07-007-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-007 | requirement=fetched-versus-synthesized origin
- `BWS120-R07-007-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-007 | requirement=fallback cannot satisfy sampleIsReady
- `BWS120-R07-007-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-007 | requirement=mixed stale-state regression
- `BWS120-R07-009-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-009 | requirement=One ready sample must not satisfy 72h
- `BWS120-R07-009-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-009 | requirement=ready→blocked
- `BWS120-R07-009-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-009 | requirement=blocked→ready
- `BWS120-R07-009-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-009 | requirement=missed intervals
- `BWS120-R07-009-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-009 | requirement=collection gap
- `BWS120-R07-009-TEST-06` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-009 | requirement=exact duration/minimum sample count
- `BWS120-R07-009-TEST-07` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-009 | requirement=restart/resume continuity
- `BWS120-R07-010-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-010 | requirement=Mixed runtime IDs
- `BWS120-R07-010-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-010 | requirement=mixed source fingerprints
- `BWS120-R07-010-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-010 | requirement=stale/future lastSuccessAt
- `BWS120-R07-010-TEST-04` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-010 | requirement=diagnostics path with different hash
- `BWS120-R07-010-TEST-05` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-010 | requirement=lifecycle/handoff generation mismatch
- `BWS120-R07-010-TEST-06` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-010 | requirement=evidence-index sequence mismatch
- `BWS120-R07-010-TEST-07` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-010 | requirement=campaign-manifest mismatch
- `BWS120-R07-011-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-011 | requirement=Frozen time
- `BWS120-R07-011-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-011 | requirement=backward jump
- `BWS120-R07-011-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-011 | requirement=forward jump
- `BWS120-R07-011-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-011 | requirement=abort during sleep/collection
- `BWS120-R07-011-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-011 | requirement=maximum sample/iteration guard

## Negative and adversarial tests

- `BWS120-R07-007-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-007 | requirement=mixed stale-state regression
- `BWS120-R07-010-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-010 | requirement=stale/future lastSuccessAt
- `BWS120-R07-010-TEST-04` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-010 | requirement=diagnostics path with different hash
- `BWS120-R07-010-TEST-05` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-010 | requirement=lifecycle/handoff generation mismatch
- `BWS120-R07-010-TEST-06` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-010 | requirement=evidence-index sequence mismatch
- `BWS120-R07-010-TEST-07` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-010 | requirement=campaign-manifest mismatch

## Concurrency, cancellation, crash, and restart tests

- `BWS120-R07-006-TEST-07` | category=cancellation_or_timeout | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-006 | requirement=oversized body and timeout
- `BWS120-R07-007-TEST-01` | category=cancellation_or_timeout | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-007 | requirement=Metrics timeout/refusal
- `BWS120-R07-009-TEST-07` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-009 | requirement=restart/resume continuity

## Environment proof

- NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION: 31 requirements

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

Acceptance authority: non-2xx/schema-invalid fail closed; no synthetic-ready substitution; continuous monotonic observation window; exact generation binding

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W3-T29` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
