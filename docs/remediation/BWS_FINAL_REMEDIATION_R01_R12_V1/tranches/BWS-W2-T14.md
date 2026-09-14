
# BWS-W2-T14 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W2-T14
CAMPAIGN_ORDER: 29
STAGE: S4
PRIMARY_OWNER: R04
SECONDARY_REVIEWERS: R01, R03, R05, R06, R07, R11
ISSUE_IDS: BWS118-R04-001, BWS118-R04-003, BWS118-R04-004
SEVERITY_COUNTS: {"P1": 3}
DEPENDENCIES: T03, T10
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen review/finding baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; active campaign authority is pinned by activation/immutable-authority.sha256; exact current numbered archive or checkout, extracted-tree digest, Git identity, source paths, hashes, and modes must be captured in an external audit or admission receipt and reverified before editing; repository documentation does not self-attest a rolling numbered ZIP
CURRENT_SOURCE_PATH_CANDIDATES: packages/bootstrap/src/runtime/private-paper-runtime.ts, packages/bootstrap/src/simulation/b1-leg-completion.ts, packages/bootstrap/src/simulation/non-atomic-completion.ts
SYMBOLS_TO_REVERIFY: 11 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: packages/bootstrap/src/runtime/private-paper-runtime.ts, packages/bootstrap/src/simulation/b1-leg-completion.ts, packages/bootstrap/src/simulation/non-atomic-completion.ts
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
FOCUSED_TESTS: 12 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 12 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 3 classified records below
CONCURRENCY_OR_CRASH_TESTS: 4 classified records below
ENVIRONMENT_PROOF: {"NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED": 12}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: - Exact duplicate events are no-ops
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": true, "bws_710": true, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W1-T07 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `packages/bootstrap/src/runtime/private-paper-runtime.ts` | present=yes | sha256=252e38a52693f3fa598c9ea92a83b184de0c4b29c4ab0bd5c952b750d009c6f5 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/simulation/b1-leg-completion.ts` | present=yes | sha256=108996f173a566dfb8b72de38c364d3f1d7b3610bcceadbe6c415d94a5fc5b3b | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/simulation/non-atomic-completion.ts` | present=yes | sha256=3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS118-R04-001 | `packages/bootstrap/src/simulation/non-atomic-completion.ts` | symbol=NonAtomicCompletionEvent | reviewed_line_range=L38-L43 | reviewed_sha256=3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df
- BWS118-R04-001 | `packages/bootstrap/src/simulation/non-atomic-completion.ts` | symbol=replayLegEvents / validateNoSameLegTimestampTies | reviewed_line_range=L375-L504 | reviewed_sha256=3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df
- BWS118-R04-001 | `packages/bootstrap/src/simulation/non-atomic-completion.ts` | symbol=applyEvent | reviewed_line_range=L530-L575 | reviewed_sha256=3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df
- BWS118-R04-001 | `packages/bootstrap/src/simulation/b1-leg-completion.ts` | symbol=B1FillabilityEvent | reviewed_line_range=L36-L42 | reviewed_sha256=108996f173a566dfb8b72de38c364d3f1d7b3610bcceadbe6c415d94a5fc5b3b
- BWS118-R04-001 | `packages/bootstrap/src/simulation/b1-leg-completion.ts` | symbol=replayB1FillabilityEvents / validateNoSameLegTimestampTies | reviewed_line_range=L259-L430 | reviewed_sha256=108996f173a566dfb8b72de38c364d3f1d7b3610bcceadbe6c415d94a5fc5b3b
- BWS118-R04-003 | `packages/bootstrap/src/simulation/non-atomic-completion.ts` | symbol=LegAccumulator | reviewed_line_range=L100-L107 | reviewed_sha256=3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df
- BWS118-R04-003 | `packages/bootstrap/src/simulation/non-atomic-completion.ts` | symbol=applyEvent reject/expire | reviewed_line_range=L577-L612 | reviewed_sha256=3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df
- BWS118-R04-003 | `packages/bootstrap/src/simulation/non-atomic-completion.ts` | symbol=freezeLegSnapshot / deriveLegState | reviewed_line_range=L637-L679 | reviewed_sha256=3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df
- BWS118-R04-004 | `packages/bootstrap/src/simulation/non-atomic-completion.ts` | symbol=NonAtomicCompletionInput | reviewed_line_range=L80-L85 | reviewed_sha256=3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df
- BWS118-R04-004 | `packages/bootstrap/src/simulation/non-atomic-completion.ts` | symbol=freezeCompletionSnapshot / deriveGroupState | reviewed_line_range=L649-L698 | reviewed_sha256=3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df
- BWS118-R04-004 | `packages/bootstrap/src/runtime/private-paper-runtime.ts` | symbol=simulateRuntimeCandidate | reviewed_line_range=L878-L924 | reviewed_sha256=252e38a52693f3fa598c9ea92a83b184de0c4b29c4ab0bd5c952b750d009c6f5

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS118-R04-001 — Completion replay has no immutable event or attempt identity, so duplicates are either rejected as ambiguous or applied twice

- Severity: `P1`
- Current behavior: The event contracts have no event ID, attempt ID, source receipt, sequence, or payload digest. Same-leg same-time duplicates are rejected as ordering ambiguity, while a timestamp-shifted duplicate is treated as a second fill and added to the accumulator.
- Expected behavior: Each provider event or execution attempt must carry an immutable identity. An exact duplicate must be idempotent, while the same identity with a different payload must fail closed.
- Invariant: Each provider event or execution attempt must carry an immutable identity. An exact duplicate must be idempotent, while the same identity with a different payload must fail closed.
- Root cause: Replay ordering is used as a substitute for event identity and idempotency. The state machine cannot distinguish a retry from a second real fill.
- Trigger: Submit the same logical fill twice at the same timestamp, or submit it again with a different timestamp.
- Minimal fix boundary: Add an immutable provider-event/attempt identity and source receipt to the standard and B1 completion event boundaries, make replay create-or-compare idempotent by that identity, and preserve conflict evidence. Durable transaction mechanics remain R03-owned.
- Regression risks:
- Event schema compatibility
- Migration or persistence changes if identities become durable
- Provider adapters that cannot yet supply a stable event identity

### BWS118-R04-003 — Standard partial fill followed by rejection or expiry loses the terminal disposition in the public leg snapshot

- Severity: `P1`
- Current behavior: The accumulator stores terminalDisposition internally, but the public snapshot omits it. deriveLegState checks liveFilledStakeMinor before terminalDisposition and therefore emits leg_partial, making partial+rejected and partial+expired indistinguishable from a still-open partial leg.
- Expected behavior: The snapshot must preserve both the partial filled quantity and the terminal disposition of the unfilled remainder, or expose an exhaustive compound state.
- Invariant: The snapshot must preserve both the partial filled quantity and the terminal disposition of the unfilled remainder, or expose an exhaustive compound state.
- Root cause: The standard state model compresses two independent dimensions, fill quantity and terminal disposition, into one precedence-ordered enum and drops the secondary dimension.
- Trigger: Replay fill(less than plan) followed by reject or expire on the same leg.
- Minimal fix boundary: Expose terminalDisposition in NonAtomicPaperLegSnapshot or replace the enum with an exhaustive compound lifecycle representation; update settlement/report consumers without changing B1 semantics unnecessarily.
- Regression risks:
- Schema and report compatibility
- State-name migrations
- Avoid allowing terminal reopen implicitly

### BWS118-R04-004 — Manual or residual-floor kill is an unordered boolean that can retroactively relabel a fully completed group as killed

- Severity: `P1`
- Current behavior: manualKill is an input boolean outside the ordered event stream. deriveGroupState returns group_killed before checking whether every leg is filled. The private runtime may rerun the identical completion history with only manualKill changed to true.
- Expected behavior: Kill must be an ordered lifecycle event with identity and timestamp, and it must not rewrite economic facts that completed before the kill. The model must distinguish stop-future-work from cancellation, liquidation, and completed exposure.
- Invariant: Kill must be an ordered lifecycle event with identity and timestamp, and it must not rewrite economic facts that completed before the kill. The model must distinguish stop-future-work from cancellation, liquidation, and completed exposure.
- Root cause: Kill authority is modeled as an unordered final label instead of an immutable, causally ordered transition with a defined effect.
- Trigger: Evaluate a completed event history with manualKill=true or trigger the residual-floor kill rerun.
- Minimal fix boundary: Represent kill request/acceptance/effect as explicit ordered evidence, define terminal precedence, and preserve completed fills and post-kill prohibited work separately. Generic cancellation propagation remains R06-owned.
- Regression risks:
- Existing report status compatibility
- Avoid implying unwind or rollback
- Coordination with runtime cancellation semantics


## Allowed edit boundary

- Candidate path set: `packages/bootstrap/src/runtime/private-paper-runtime.ts`, `packages/bootstrap/src/simulation/b1-leg-completion.ts`, `packages/bootstrap/src/simulation/non-atomic-completion.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `packages/bootstrap/src/runtime/private-paper-runtime.ts` | participating tranches=T12, T14, T17 | predecessor postimage required
- `packages/bootstrap/src/simulation/b1-leg-completion.ts` | participating tranches=T14, T15, T17 | predecessor postimage required
- `packages/bootstrap/src/simulation/non-atomic-completion.ts` | participating tranches=T14, T15 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- - Stake solver mathematics
- B1 snapshot already carries terminalDisposition
- BWS-900 no-execution hold
- BWS-900 parked state
- Fill transition validation
- Manual kill semantics
- Residual arithmetic
- Settlement outcome calculation
- Stake-vector mathematics
- Supported event-type transition guards
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T03, T10.
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

- `BWS118-R04-001-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-001 | requirement=Exact duplicate event in the same and different array positions is a no-op.
- `BWS118-R04-001-TEST-02` | category=evidence_or_artifact | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-001 | requirement=Same immutable event ID with any changed type, stake, leg, timestamp, or receipt is blocked.
- `BWS118-R04-001-TEST-03` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-001 | requirement=Restart/replay permutation tests produce byte-identical completion and residual snapshots.
- `BWS118-R04-001-TEST-04` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-001 | requirement=Durable duplicate delivery test handed to R03 verifies one economic effect after crash and retry.
- `BWS118-R04-003-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-003 | requirement=Partial+rejected and partial+expired snapshots retain both quantity and terminal disposition.
- `BWS118-R04-003-TEST-02` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-003 | requirement=Recovery and report round trips preserve the compound state.
- `BWS118-R04-003-TEST-03` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-003 | requirement=A subsequent fill after terminal remains blocked.
- `BWS118-R04-003-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-003 | requirement=An open partial leg remains distinguishable from a terminal partial leg.
- `BWS118-R04-004-TEST-01` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-004 | requirement=Kill before any fill prevents subsequent modeled work and retains kill time/receipt.
- `BWS118-R04-004-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-004 | requirement=Kill after full completion preserves group_complete plus a separate post-completion stop marker.
- `BWS118-R04-004-TEST-03` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-004 | requirement=Residual-floor kill has deterministic trigger evidence and no duplicate rerun effect.
- `BWS118-R04-004-TEST-04` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-004 | requirement=Permutation and restart tests retain causal order.

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS118-R04-001-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-001 | requirement=Exact duplicate event in the same and different array positions is a no-op.
- `BWS118-R04-001-TEST-02` | category=evidence_or_artifact | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-001 | requirement=Same immutable event ID with any changed type, stake, leg, timestamp, or receipt is blocked.
- `BWS118-R04-001-TEST-03` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-001 | requirement=Restart/replay permutation tests produce byte-identical completion and residual snapshots.
- `BWS118-R04-001-TEST-04` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-001 | requirement=Durable duplicate delivery test handed to R03 verifies one economic effect after crash and retry.
- `BWS118-R04-003-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-003 | requirement=Partial+rejected and partial+expired snapshots retain both quantity and terminal disposition.
- `BWS118-R04-003-TEST-02` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-003 | requirement=Recovery and report round trips preserve the compound state.
- `BWS118-R04-003-TEST-03` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-003 | requirement=A subsequent fill after terminal remains blocked.
- `BWS118-R04-003-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-003 | requirement=An open partial leg remains distinguishable from a terminal partial leg.
- `BWS118-R04-004-TEST-01` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-004 | requirement=Kill before any fill prevents subsequent modeled work and retains kill time/receipt.
- `BWS118-R04-004-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-004 | requirement=Kill after full completion preserves group_complete plus a separate post-completion stop marker.
- `BWS118-R04-004-TEST-03` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-004 | requirement=Residual-floor kill has deterministic trigger evidence and no duplicate rerun effect.
- `BWS118-R04-004-TEST-04` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-004 | requirement=Permutation and restart tests retain causal order.

## Negative and adversarial tests

- `BWS118-R04-001-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-001 | requirement=Exact duplicate event in the same and different array positions is a no-op.
- `BWS118-R04-001-TEST-04` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-001 | requirement=Durable duplicate delivery test handed to R03 verifies one economic effect after crash and retry.
- `BWS118-R04-004-TEST-03` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-004 | requirement=Residual-floor kill has deterministic trigger evidence and no duplicate rerun effect.

## Concurrency, cancellation, crash, and restart tests

- `BWS118-R04-001-TEST-03` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-001 | requirement=Restart/replay permutation tests produce byte-identical completion and residual snapshots.
- `BWS118-R04-001-TEST-04` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-001 | requirement=Durable duplicate delivery test handed to R03 verifies one economic effect after crash and retry.
- `BWS118-R04-003-TEST-02` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-003 | requirement=Recovery and report round trips preserve the compound state.
- `BWS118-R04-004-TEST-04` | category=restart_or_recovery | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-004 | requirement=Permutation and restart tests retain causal order.

## Environment proof

- NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED: 12 requirements

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

Acceptance authority: - Exact duplicate events are no-ops

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W1-T07` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
