
# BWS-W2-T16 implementation packet

> Documentation status: `PROPOSED_NOT_ACTIVE` for T39 and `NOT_ADMITTED` for all tranches. This packet does not authorize source mutation.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W2-T16
CAMPAIGN_ORDER: 33
STAGE: S4
PRIMARY_OWNER: R04
SECONDARY_REVIEWERS: R01, R02, R03, R05, R07, R11
ISSUE_IDS: BWS118-R04-006, BWS118-R04-007, BWS118-R04-008
SEVERITY_COUNTS: {"P1": 3}
DEPENDENCIES: T03, T10, T14, T15
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; exact 771-member archive inventory; independently computed inventory digest=b81ff807e4c230bff96fe1fa58f73a2d4bac803ebd7fa58b843cdcb83499f7f0
CURRENT_SOURCE_PATH_CANDIDATES: packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts, packages/bootstrap/src/backtest/standard-binary-backtest.ts, packages/bootstrap/src/simulation/b1-settlement-replay.ts, packages/bootstrap/src/simulation/b1-void-rule-replay.ts, packages/bootstrap/src/simulation/settlement-replay.ts
SYMBOLS_TO_REVERIFY: 8 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts, packages/bootstrap/src/backtest/standard-binary-backtest.ts, packages/bootstrap/src/simulation/b1-settlement-replay.ts
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
FOCUSED_TESTS: 13 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 13 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 1 classified records below
CONCURRENCY_OR_CRASH_TESTS: 5 classified records below
ENVIRONMENT_PROOF: {"NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED": 13}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: - Void/refund/push/reopen represented explicitly
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": true, "bws_710": true, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W1-T12 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` | present=yes | sha256=b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/backtest/standard-binary-backtest.ts` | present=yes | sha256=b89833bedd366b9d4b714cb0eddd6610e5eabd7217477063d7a1a2006b60e438 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/simulation/b1-settlement-replay.ts` | present=yes | sha256=d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/simulation/b1-void-rule-replay.ts` | present=yes | sha256=107607954dc2d9cf911e51e8e68d39592d4b5d8f06cddfcdb018ed92212ad2fb | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/simulation/settlement-replay.ts` | present=yes | sha256=7967faca4d58a884c8c6762aaccac6fd1f04c630a3d5632f54c273202c89e8d2 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS118-R04-006 | `packages/bootstrap/src/simulation/settlement-replay.ts` | symbol=ConsumedSettlementReplay | reviewed_line_range=L19-L29 | reviewed_sha256=7967faca4d58a884c8c6762aaccac6fd1f04c630a3d5632f54c273202c89e8d2
- BWS118-R04-006 | `packages/bootstrap/src/simulation/b1-settlement-replay.ts` | symbol=B1SettlementReplayRecord | reviewed_line_range=L30-L35 | reviewed_sha256=d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d
- BWS118-R04-006 | `packages/bootstrap/src/simulation/b1-void-rule-replay.ts` | symbol=B1VoidRuleReplayRecord / validateB1VoidRuleReplay | reviewed_line_range=L8-L85 | reviewed_sha256=107607954dc2d9cf911e51e8e68d39592d4b5d8f06cddfcdb018ed92212ad2fb
- BWS118-R04-007 | `packages/bootstrap/src/simulation/settlement-replay.ts` | symbol=consumeStandardBinarySettlementReplaySequence | reviewed_line_range=L333-L392 | reviewed_sha256=7967faca4d58a884c8c6762aaccac6fd1f04c630a3d5632f54c273202c89e8d2
- BWS118-R04-007 | `packages/bootstrap/src/simulation/b1-settlement-replay.ts` | symbol=resolveB1SettlementReplaySequence | reviewed_line_range=L400-L445 | reviewed_sha256=d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d
- BWS118-R04-008 | `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` | symbol=B1CrossVenueBacktestPlan | reviewed_line_range=L20-L29 | reviewed_sha256=b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4
- BWS118-R04-008 | `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` | symbol=runCandidateBacktest | reviewed_line_range=L372-L429 | reviewed_sha256=b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4
- BWS118-R04-008 | `packages/bootstrap/src/backtest/standard-binary-backtest.ts` | symbol=validateExecutionPlanTemporalWindow / validateCompletionEventWindow | reviewed_line_range=L465-L568 | reviewed_sha256=b89833bedd366b9d4b714cb0eddd6610e5eabd7217477063d7a1a2006b60e438

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS118-R04-006 — Settlement domains cannot represent void, refund, push, reopen, or generation lifecycle despite claiming replay coverage

- Severity: `P1`
- Current behavior: The standard consumed record supports only finalOutcome yes/no. The B1 record supports one finalOutcomeSelectionEquivalenceKey plus static settlementRuleVersion/voidRuleId compatibility. The B1 “void-rule replay” only verifies equal IDs and never represents an actual void, refund amount, push, reopen, or supersession event.
- Expected behavior: The replay contract must encode the native terminal action, monetary consequence, revision/supersession relation, generation, and reopen/finality state without coercing it to a winner.
- Invariant: The replay contract must encode the native terminal action, monetary consequence, revision/supersession relation, generation, and reopen/finality state without coercing it to a winner.
- Root cause: Rule compatibility identifiers are treated as if they were lifecycle evidence, while the replay state machines model only winner replacement over time.
- Trigger: Supply lifecycle evidence that is not simply a yes/no or one B1 selection final outcome.
- Minimal fix boundary: Add explicit provider-bound terminal lifecycle records and monetary effects, with unsupported states held fail-closed. Canonical upstream rule semantics remain external/R10-owned; BWS replay projection is R04-owned.
- Regression risks:
- Contract versioning
- Provider-specific rule differences
- Historical fixture compatibility

### BWS118-R04-007 — Correction and finality progression are inferred from timestamp and outcome changes without explicit revision authority

- Severity: `P1`
- Current behavior: Both standard and B1 replay sequences count a later same-outcome record as finality progression and a later different-outcome record as correction solely by timestamp and value comparison. There is no revision number, supersedes hash, correction reason, prior-state digest, or finality-state field.
- Expected behavior: Every correction or finality advance must be explicitly bound to a monotonic provider revision, superseded record, transition type, generation, and authoritative receipt.
- Invariant: Every correction or finality advance must be explicitly bound to a monotonic provider revision, superseded record, transition type, generation, and authoritative receipt.
- Root cause: Temporal succession is conflated with semantic supersession and finality progression.
- Trigger: Add a later replay with the same outcome or a different outcome, regardless of whether it declares a correction or finality transition.
- Minimal fix boundary: Require explicit revision/supersession/finality transition evidence and reject gaps, forks, regressions, mixed generations, or unverifiable latest pointers. Upstream provenance fields remain R01-owned.
- Regression risks:
- Provider revision availability
- Historical fixtures without revisions
- Interaction with retained-currentness semantics

### BWS118-R04-008 — B1 backtest has no cross-stage decision chronology and accepts settlement before quotes with fills after settlement

- Severity: `P1`
- Current behavior: B1CrossVenueBacktestPlan contains no decision timestamp. runCandidateBacktest validates stages independently and never compares quote, decision, fill, or settlement times. The impossible temporal sequence is accepted.
- Expected behavior: Backtest orchestration must bind one explicit decision time and require source observations at or before decision, completion events at or after decision, and settlement strictly after the final completion event.
- Invariant: Backtest orchestration must bind one explicit decision time and require source observations at or before decision, completion events at or after decision, and settlement strictly after the final completion event.
- Root cause: B1 orchestration composes locally valid artifacts without a shared temporal authority or monotonic cross-stage invariant.
- Trigger: Place settlement replay time before quote comparison and fill events after settlement.
- Minimal fix boundary: Add a B1 decision timestamp and cross-stage time validation at orchestration input, binding quote source/receive/comparison, fills, and settlement. Durable timestamp constraints remain R03-owned.
- Regression risks:
- Fixture schema change
- Time-zone and precision consistency
- Interaction with R01 source/receive time


## Allowed edit boundary

- Candidate path set: `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts`, `packages/bootstrap/src/backtest/standard-binary-backtest.ts`, `packages/bootstrap/src/simulation/b1-settlement-replay.ts`, `packages/bootstrap/src/simulation/b1-void-rule-replay.ts`, `packages/bootstrap/src/simulation/settlement-replay.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` | participating tranches=T07, T16, T17 | predecessor postimage required
- `packages/bootstrap/src/backtest/standard-binary-backtest.ts` | participating tranches=T16, T17 | predecessor postimage required
- `packages/bootstrap/src/simulation/b1-settlement-replay.ts` | participating tranches=T15, T16 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- - No provider access during implementation tests
- B1 pure math
- BWS-900 hold
- Candidate identity
- Finality authority equality check
- No execution
- Per-manifest B1 leg completeness
- Standard backtest chronology guards
- Static settlement-rule compatibility checks
- Static void-rule ID check
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T03, T10, T14, T15.
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

- `BWS118-R04-006-TEST-01` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-006 | requirement=Void with full refund, partial refund, push, cancellation, and reopen cases.
- `BWS118-R04-006-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-006 | requirement=Generation change or reorg cannot join the prior lifecycle without explicit authority.
- `BWS118-R04-006-TEST-03` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-006 | requirement=Unsupported terminal action remains held and never produces settled profitability.
- `BWS118-R04-006-TEST-04` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-006 | requirement=Round-trip replay preserves action, amount, currency, revision, and source receipt.
- `BWS118-R04-007-TEST-01` | category=evidence_or_artifact | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-007 | requirement=Same-outcome duplicate snapshot does not advance finality without transition evidence.
- `BWS118-R04-007-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-007 | requirement=Changed outcome does not count as correction without explicit supersession.
- `BWS118-R04-007-TEST-03` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-007 | requirement=Revision gaps, forks, regressions, mixed generations, and equal revisions conflict deterministically.
- `BWS118-R04-007-TEST-04` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-007 | requirement=Permutation/restart tests resolve one identical authoritative chain.
- `BWS118-R04-008-TEST-01` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-008 | requirement=Settlement before decision is blocked.
- `BWS118-R04-008-TEST-02` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-008 | requirement=Fill before decision and fill at/after settlement are blocked.
- `BWS118-R04-008-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-008 | requirement=Future quote or changed data after decision is blocked.
- `BWS118-R04-008-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-008 | requirement=Boundary equality behavior is specified and tested.
- `BWS118-R04-008-TEST-05` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-008 | requirement=Standard and B1 chronology tests share explicit invariant fixtures without sharing implementation outputs.

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS118-R04-006-TEST-01` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-006 | requirement=Void with full refund, partial refund, push, cancellation, and reopen cases.
- `BWS118-R04-006-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-006 | requirement=Generation change or reorg cannot join the prior lifecycle without explicit authority.
- `BWS118-R04-006-TEST-03` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-006 | requirement=Unsupported terminal action remains held and never produces settled profitability.
- `BWS118-R04-006-TEST-04` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-006 | requirement=Round-trip replay preserves action, amount, currency, revision, and source receipt.
- `BWS118-R04-007-TEST-01` | category=evidence_or_artifact | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-007 | requirement=Same-outcome duplicate snapshot does not advance finality without transition evidence.
- `BWS118-R04-007-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-007 | requirement=Changed outcome does not count as correction without explicit supersession.
- `BWS118-R04-007-TEST-03` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-007 | requirement=Revision gaps, forks, regressions, mixed generations, and equal revisions conflict deterministically.
- `BWS118-R04-007-TEST-04` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-007 | requirement=Permutation/restart tests resolve one identical authoritative chain.
- `BWS118-R04-008-TEST-01` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-008 | requirement=Settlement before decision is blocked.
- `BWS118-R04-008-TEST-02` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-008 | requirement=Fill before decision and fill at/after settlement are blocked.
- `BWS118-R04-008-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-008 | requirement=Future quote or changed data after decision is blocked.
- `BWS118-R04-008-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-008 | requirement=Boundary equality behavior is specified and tested.
- `BWS118-R04-008-TEST-05` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-008 | requirement=Standard and B1 chronology tests share explicit invariant fixtures without sharing implementation outputs.

## Negative and adversarial tests

- `BWS118-R04-007-TEST-01` | category=evidence_or_artifact | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-007 | requirement=Same-outcome duplicate snapshot does not advance finality without transition evidence.

## Concurrency, cancellation, crash, and restart tests

- `BWS118-R04-006-TEST-01` | category=cancellation_or_timeout | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-006 | requirement=Void with full refund, partial refund, push, cancellation, and reopen cases.
- `BWS118-R04-006-TEST-02` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-006 | requirement=Generation change or reorg cannot join the prior lifecycle without explicit authority.
- `BWS118-R04-006-TEST-04` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-006 | requirement=Round-trip replay preserves action, amount, currency, revision, and source receipt.
- `BWS118-R04-007-TEST-03` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-007 | requirement=Revision gaps, forks, regressions, mixed generations, and equal revisions conflict deterministically.
- `BWS118-R04-007-TEST-04` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-007 | requirement=Permutation/restart tests resolve one identical authoritative chain.

## Environment proof

- NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED: 13 requirements

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

Acceptance authority: - Void/refund/push/reopen represented explicitly

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W1-T12` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
