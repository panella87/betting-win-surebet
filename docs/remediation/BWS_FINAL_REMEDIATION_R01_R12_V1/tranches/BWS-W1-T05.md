
# BWS-W1-T05 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W1-T05
CAMPAIGN_ORDER: 17
STAGE: S3
PRIMARY_OWNER: R01
SECONDARY_REVIEWERS: R03, R06, R07, R11
ISSUE_IDS: BWS116-R01-006, BWS116-R01-007, BWS116-R01-008
SEVERITY_COUNTS: {"P2": 3}
DEPENDENCIES: T03
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen application-source baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; documentation-audit preimage betting-win-surebet125.zip sha256=72a8262a5f94d144bb930cc9fb2778eed672d2a97a252f49b07f7b979b47224f with 995 regular files and no accepted remediation source result; this overlay changes documentation only; exact checkout/Git/source state must be reverified before editing
CURRENT_SOURCE_PATH_CANDIDATES: packages/bootstrap/src/adapters/betting-win-query-client.ts, packages/bootstrap/src/operations/upstream-transport-constants.ts
SYMBOLS_TO_REVERIFY: 3 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: packages/bootstrap/src/adapters/betting-win-query-client.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites `["T03 cycle ownership model"]`
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 13 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 1 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 1 classified records below
CONCURRENCY_OR_CRASH_TESTS: 6 classified records below
ENVIRONMENT_PROOF: {"AS_DECLARED_BY_OWNING_REVIEW": 1, "NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE": 12}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: ["Visited-cursor and non-progress proof", "Cycle-wide page/record/byte/deadline budget", "Streaming response bound and late-result fence"]
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": true, "bws_710": false, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W1-T06 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `packages/bootstrap/src/adapters/betting-win-query-client.ts` | present=yes | sha256=7b50ba9a6c6e0dd5486bdca723a6f6c605bd7609151e062fe72ee36100d307ae | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/upstream-transport-constants.ts` | present=yes | sha256=dd5591b1c0fd7d57aeeacba4c49d25d8bca77f6acfee324cc6441c87f0175c15 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS116-R01-006 | `packages/bootstrap/src/adapters/betting-win-query-client.ts` | symbol=describeReadOnlyQueryApiClientBoundary | reviewed_line_range=L181-L183 | reviewed_sha256=7b50ba9a6c6e0dd5486bdca723a6f6c605bd7609151e062fe72ee36100d307ae
- BWS116-R01-007 | `packages/bootstrap/src/operations/upstream-transport-constants.ts` | symbol=export | reviewed_line_range=L1-L4 | reviewed_sha256=dd5591b1c0fd7d57aeeacba4c49d25d8bca77f6acfee324cc6441c87f0175c15
- BWS116-R01-008 | `packages/bootstrap/src/adapters/betting-win-query-client.ts` | symbol=query | reviewed_line_range=L16-L29 | reviewed_sha256=7b50ba9a6c6e0dd5486bdca723a6f6c605bd7609151e062fe72ee36100d307ae

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS116-R01-006 — Cursor traversal lacks a complete fail-closed proof against repetition, cycles, and non-progress

- Severity: `P2`
- Current behavior: The available guards do not jointly prove progress and boundedness for all cursor-cycle shapes and all retries/pages. Some malformed streams can consume the per-request budget repeatedly or terminate with ambiguous partial state.
- Expected behavior: Pagination must terminate or fail deterministically on cursor repetition/non-progress and remain bounded by explicit pages, records, bytes, and aggregate deadline.
- Invariant: Pagination must terminate or fail deterministically on cursor repetition/non-progress and remain bounded by explicit pages, records, bytes, and aggregate deadline.
- Root cause: Boundedness is distributed across request-local constants rather than represented as convergence-cycle state.
- Trigger: The pagination loop follows `next`/cursor metadata without retaining a visited-cursor set and without a single cycle-wide page/record/time budget enforced at the production entrypoint.
- Minimal fix boundary: Add visited-cursor/non-progress checks and one explicit cycle budget over pages, records, bytes, retries, and wall-clock time. On violation, fail without promoting checkpoint/readiness.
- Regression risks:
- Rejecting provider-specific legitimate empty pages
- Budget tuning

### BWS116-R01-007 — Per-request timeout and retry controls do not establish one aggregate convergence deadline or late-result ownership

- Severity: `P2`
- Current behavior: The sum of pages × attempts × timeout/backoff can exceed any operator-visible cycle budget, while a late response can complete after the logical caller has timed out unless every continuation checks ownership.
- Expected behavior: One bounded cycle deadline and cancellation identity must govern contract negotiation, all pages, retries, parsing, persistence handoff, and late completions.
- Invariant: One bounded cycle deadline and cancellation identity must govern contract negotiation, all pages, retries, parsing, persistence handoff, and late completions.
- Root cause: Timeout and cancellation are scoped to fetch attempts rather than the owned convergence state machine.
- Trigger: The convergence cycle applies request-local timeout/retry constants independently per contract/page attempt without a single propagated absolute deadline and cycle ownership token.
- Minimal fix boundary: Create an absolute cycle deadline and operation identity at the convergence entrypoint, pass remaining budget and cancellation through every call, and reject all late continuations before persistence/readiness effects.
- Regression risks:
- Behavioral changes in retry policy
- Timer flakiness
- Interaction with R06 controller supervision

### BWS116-R01-008 — Response-size enforcement occurs after fetch buffering and therefore is not a transport memory bound

- Severity: `P2`
- Current behavior: The limit is a post-buffer validation. It can reject an oversized body semantically, but only after memory and time have already been consumed.
- Expected behavior: The client must cap compressed and decompressed bytes while streaming, abort before unbounded allocation, and reject bodies beyond the declared limit.
- Invariant: The client must cap compressed and decompressed bytes while streaming, abort before unbounded allocation, and reject bodies beyond the declared limit.
- Root cause: The size control is implemented as schema/input validation rather than transport resource enforcement.
- Trigger: The implementation obtains the complete response text/JSON before comparing its length or parsed cardinality with configured limits.
- Minimal fix boundary: Replace full-body buffering with a bounded reader that accounts for decoded bytes, aborts immediately on overflow, and only then parses JSON. Preserve exact-body hashing from finding 004 while streaming.
- Regression risks:
- Node Fetch stream compatibility
- Unicode byte/character accounting
- Hashing and parser integration


## Allowed edit boundary

- Candidate path set: `packages/bootstrap/src/adapters/betting-win-query-client.ts`, `packages/bootstrap/src/operations/upstream-transport-constants.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `packages/bootstrap/src/adapters/betting-win-query-client.ts` | participating tranches=T03, T05 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- B1 schema definitions
- Contract schema
- Convergence identity
- Endpoint allowlist semantics
- HTTP protocol implementation in betting-win
- Persistence transaction design except handoff
- Persistent database
- R02 calculations
- R02 solver
- R03 database schema except checkpoint handoff
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T03.
- Review prerequisites: ["T03 cycle ownership model"].
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

- `BWS116-R01-006-TEST-01` | category=upstream_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-006 | requirement=Repeated cursor and two-node cursor cycle
- `BWS116-R01-006-TEST-02` | category=upstream_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-006 | requirement=Empty page with nonterminal cursor
- `BWS116-R01-006-TEST-03` | category=cancellation_or_timeout | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-006 | requirement=Unique cursor stream beyond page/record/byte/deadline budgets
- `BWS116-R01-006-TEST-04` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-006 | requirement=Restart after bounded failure
- `BWS116-R01-007-TEST-01` | category=cancellation_or_timeout | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-007 | requirement=Late fetch resolution after abort
- `BWS116-R01-007-TEST-02` | category=upstream_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-007 | requirement=Multi-page worst-case retry budget
- `BWS116-R01-007-TEST-03` | category=cancellation_or_timeout | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-007 | requirement=Cancellation between parse and persistence
- `BWS116-R01-007-TEST-04` | category=cancellation_or_timeout | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-007 | requirement=No duplicate cycle effects after caller timeout
- `BWS116-R01-008-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-008 | requirement=Chunked body that crosses limit
- `BWS116-R01-008-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-008 | requirement=Incorrect/missing Content-Length
- `BWS116-R01-008-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-008 | requirement=Compressed expansion beyond limit
- `BWS116-R01-008-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-008 | requirement=Abort cleanup and no partial persistence
- `BWS116-R01-TG-001` | category=concurrency_or_fencing | environment=AS_DECLARED_BY_OWNING_REVIEW | production_entrypoint=yes | status=CONFIRMED_TEST_GAP | issues=BWS116-R01-001, BWS116-R01-002, BWS116-R01-003, BWS116-R01-004, BWS116-R01-005, BWS116-R01-006, BWS116-R01-007, BWS116-R01-008, BWS116-R01-009, BWS116-R01-010 | requirement=Focused tests do not adversarially exercise the full production entrypoint for identity drift and lifecycle races

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS116-R01-TG-001` | category=concurrency_or_fencing | environment=AS_DECLARED_BY_OWNING_REVIEW | production_entrypoint=yes | status=CONFIRMED_TEST_GAP | issues=BWS116-R01-001, BWS116-R01-002, BWS116-R01-003, BWS116-R01-004, BWS116-R01-005, BWS116-R01-006, BWS116-R01-007, BWS116-R01-008, BWS116-R01-009, BWS116-R01-010 | requirement=Focused tests do not adversarially exercise the full production entrypoint for identity drift and lifecycle races

## Negative and adversarial tests

- `BWS116-R01-007-TEST-04` | category=cancellation_or_timeout | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-007 | requirement=No duplicate cycle effects after caller timeout

## Concurrency, cancellation, crash, and restart tests

- `BWS116-R01-006-TEST-03` | category=cancellation_or_timeout | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-006 | requirement=Unique cursor stream beyond page/record/byte/deadline budgets
- `BWS116-R01-006-TEST-04` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-006 | requirement=Restart after bounded failure
- `BWS116-R01-007-TEST-01` | category=cancellation_or_timeout | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-007 | requirement=Late fetch resolution after abort
- `BWS116-R01-007-TEST-03` | category=cancellation_or_timeout | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-007 | requirement=Cancellation between parse and persistence
- `BWS116-R01-007-TEST-04` | category=cancellation_or_timeout | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R01-007 | requirement=No duplicate cycle effects after caller timeout
- `BWS116-R01-TG-001` | category=concurrency_or_fencing | environment=AS_DECLARED_BY_OWNING_REVIEW | production_entrypoint=yes | status=CONFIRMED_TEST_GAP | issues=BWS116-R01-001, BWS116-R01-002, BWS116-R01-003, BWS116-R01-004, BWS116-R01-005, BWS116-R01-006, BWS116-R01-007, BWS116-R01-008, BWS116-R01-009, BWS116-R01-010 | requirement=Focused tests do not adversarially exercise the full production entrypoint for identity drift and lifecycle races

## Environment proof

- AS_DECLARED_BY_OWNING_REVIEW: 1 requirements
- NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE: 12 requirements

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

Acceptance authority: ["Visited-cursor and non-progress proof", "Cycle-wide page/record/byte/deadline budget", "Streaming response bound and late-result fence"]

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W1-T06` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
