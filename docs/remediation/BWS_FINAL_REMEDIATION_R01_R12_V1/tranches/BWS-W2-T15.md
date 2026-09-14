
# BWS-W2-T15 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W2-T15
CAMPAIGN_ORDER: 32
STAGE: S4
PRIMARY_OWNER: R04
SECONDARY_REVIEWERS: R01, R02, R03, R07
ISSUE_IDS: BWS118-R04-002, BWS118-R04-005
SEVERITY_COUNTS: {"P1": 2}
DEPENDENCIES: T07, T14
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen review/finding baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; active campaign authority is pinned by activation/immutable-authority.sha256; exact current numbered archive or checkout, extracted-tree digest, Git identity, source paths, hashes, and modes must be captured in an external audit or admission receipt and reverified before editing; repository documentation does not self-attest a rolling numbered ZIP
CURRENT_SOURCE_PATH_CANDIDATES: packages/bootstrap/src/economics/b1-net-spread.ts, packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts, packages/bootstrap/src/simulation/b1-leg-completion.ts, packages/bootstrap/src/simulation/b1-residual-exposure.ts, packages/bootstrap/src/simulation/b1-settlement-replay.ts, packages/bootstrap/src/simulation/non-atomic-completion.ts
SYMBOLS_TO_REVERIFY: 9 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: packages/bootstrap/src/economics/b1-net-spread.ts, packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts, packages/bootstrap/src/simulation/b1-leg-completion.ts, packages/bootstrap/src/simulation/b1-settlement-replay.ts, packages/bootstrap/src/simulation/non-atomic-completion.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites `- BWS-W1-T07`
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 8 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 8 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 0 classified records below
CONCURRENCY_OR_CRASH_TESTS: 0 classified records below
ENVIRONMENT_PROOF: {"NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED": 8}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: - Actual price/odds/fees/slippage/receipt preserved
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": true, "bws_710": true, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W2-T16 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `packages/bootstrap/src/economics/b1-net-spread.ts` | present=yes | sha256=0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts` | present=yes | sha256=f48a4d0f697fcc2d9d48328ef665689807f3f97d6c74fbcba67b01520293a580 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/simulation/b1-leg-completion.ts` | present=yes | sha256=108996f173a566dfb8b72de38c364d3f1d7b3610bcceadbe6c415d94a5fc5b3b | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/simulation/b1-residual-exposure.ts` | present=yes | sha256=95752368da2da1bae3778ca9eae94892cb06db0876a8655beba9c6127c26a516 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/simulation/b1-settlement-replay.ts` | present=yes | sha256=d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/simulation/non-atomic-completion.ts` | present=yes | sha256=3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS118-R04-002 | `packages/bootstrap/src/simulation/non-atomic-completion.ts` | symbol=NonAtomicCompletionEvent | reviewed_line_range=L38-L43 | reviewed_sha256=3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df
- BWS118-R04-002 | `packages/bootstrap/src/simulation/b1-leg-completion.ts` | symbol=B1FillabilityEvent | reviewed_line_range=L36-L42 | reviewed_sha256=108996f173a566dfb8b72de38c364d3f1d7b3610bcceadbe6c415d94a5fc5b3b
- BWS118-R04-002 | `packages/bootstrap/src/simulation/non-atomic-completion.ts` | symbol=analyzeNonAtomicResidualExposure / sumScenarioNetForLiveFilledUnits | reviewed_line_range=L701-L802 | reviewed_sha256=3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df
- BWS118-R04-002 | `packages/bootstrap/src/simulation/b1-residual-exposure.ts` | symbol=buildScenarioNets | reviewed_line_range=L200-L245 | reviewed_sha256=95752368da2da1bae3778ca9eae94892cb06db0876a8655beba9c6127c26a516
- BWS118-R04-002 | `packages/bootstrap/src/simulation/b1-settlement-replay.ts` | symbol=calculateSettledNetMinor | reviewed_line_range=L705-L745 | reviewed_sha256=d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d
- BWS118-R04-005 | `packages/bootstrap/src/economics/b1-net-spread.ts` | symbol=evaluateB1NetEconomics | reviewed_line_range=L114-L214 | reviewed_sha256=0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b
- BWS118-R04-005 | `packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts` | symbol=B1ScenarioCashflowRow / buildB1ScenarioCashflowMatrix | reviewed_line_range=L11-L87 | reviewed_sha256=f48a4d0f697fcc2d9d48328ef665689807f3f97d6c74fbcba67b01520293a580
- BWS118-R04-005 | `packages/bootstrap/src/simulation/b1-settlement-replay.ts` | symbol=analyzeB1SettlementReplay | reviewed_line_range=L168-L203 | reviewed_sha256=d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d
- BWS118-R04-005 | `packages/bootstrap/src/simulation/b1-settlement-replay.ts` | symbol=calculateSettledNetMinor | reviewed_line_range=L705-L745 | reviewed_sha256=d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS118-R04-002 — Fill simulation records stake only and reuses planned odds and cash-flow terms instead of actual execution terms

- Severity: `P1`
- Current behavior: Standard and B1 fill events contain only stake and time. Residual exposure scales the precomputed plan matrix by filled stake, and B1 settlement calculates payout from the planned scenario rows. No actual execution price, fee, slippage, or source receipt can affect the result.
- Expected behavior: A fill must preserve actual stake, price/odds, fees/costs, source time, receive time, provider generation, and immutable receipt before residual or settlement economics are calculated.
- Invariant: A fill must preserve actual stake, price/odds, fees/costs, source time, receive time, provider generation, and immutable receipt before residual or settlement economics are calculated.
- Root cause: The completion boundary models quantity transitions but not execution terms, while downstream economics assume planned matrix terms remain authoritative after fill.
- Trigger: Replay a fill event that should carry actual execution price/odds, fee, slippage, capacity source, or provider receipt.
- Minimal fix boundary: Introduce immutable actual-fill terms and a quote-to-fill receipt at the simulation boundary, then compute residual and settlement from accepted actuals. Pure quote and solver mathematics remain R02-owned.
- Regression risks:
- Compatibility with existing fixtures
- Avoid double-counting R02 fee calculations
- Fixed-point scale migration

### BWS118-R04-005 — B1 settlement and false-positive economics omit fees, quote-age penalties, and capital-lock cost accepted by net evaluation

- Severity: `P1`
- Current behavior: Net evaluation subtracts total fees, quote-age penalties, and capital-lock cost. Settlement replay ignores those values and computes each leg as planned payout minus live filled stake. falsePositive is then based on this gross settlement number.
- Expected behavior: Settlement and false-positive classification must carry forward every accepted economic cost exactly once, or explicitly reconcile actual settlement costs against the net model.
- Invariant: Settlement and false-positive classification must carry forward every accepted economic cost exactly once, or explicitly reconcile actual settlement costs against the net model.
- Root cause: The backtest passes only the stake/payout scenario matrix and fillability snapshots into settlement, dropping the net-economics cost ledger at the stage boundary.
- Trigger: Compare netCandidate.worstCaseNetMinor with settlementReplay.settledNetMinor under nonzero accepted costs.
- Minimal fix boundary: Bind settlement analysis to the accepted net-economics cost breakdown or a settlement-cost ledger and define cost reconciliation. R02 retains ownership of cost formulas and fee expressiveness.
- Regression risks:
- Avoid double charging costs
- Partial-fill cost allocation
- Scenario-conditional fee limitations inherited from R02


## Allowed edit boundary

- Candidate path set: `packages/bootstrap/src/economics/b1-net-spread.ts`, `packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts`, `packages/bootstrap/src/simulation/b1-leg-completion.ts`, `packages/bootstrap/src/simulation/b1-residual-exposure.ts`, `packages/bootstrap/src/simulation/b1-settlement-replay.ts`, `packages/bootstrap/src/simulation/non-atomic-completion.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `packages/bootstrap/src/economics/b1-net-spread.ts` | participating tranches=T07, T15 | predecessor postimage required
- `packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts` | participating tranches=T06, T15 | predecessor postimage required
- `packages/bootstrap/src/simulation/b1-leg-completion.ts` | participating tranches=T14, T15, T17 | predecessor postimage required
- `packages/bootstrap/src/simulation/b1-settlement-replay.ts` | participating tranches=T15, T16 | predecessor postimage required
- `packages/bootstrap/src/simulation/non-atomic-completion.ts` | participating tranches=T14, T15 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- - Candidate derivation until R02 tranche closes
- B1 fill state machine
- Candidate derivation
- Gross candidate derivation
- No-live-operation markers
- No-live-write boundary
- Stake-vector feasibility
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T07, T14.
- Review prerequisites: - BWS-W1-T07.
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

- `BWS118-R04-002-TEST-01` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-002 | requirement=Adverse and favorable slippage change residual and settled net deterministically.
- `BWS118-R04-002-TEST-02` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-002 | requirement=Fill fee and fixed fee are included exactly once.
- `BWS118-R04-002-TEST-03` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-002 | requirement=Planned quote identity differs from actual fill receipt and is preserved rather than overwritten.
- `BWS118-R04-002-TEST-04` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-002 | requirement=Missing actual execution terms block any metric that claims settled or residual economics.
- `BWS118-R04-005-TEST-01` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-005 | requirement=Nonzero percentage fee reduces settled net exactly once.
- `BWS118-R04-005-TEST-02` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-005 | requirement=Quote-age and capital-lock costs survive fill and settlement stages.
- `BWS118-R04-005-TEST-03` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-005 | requirement=A candidate whose gross settlement is positive but net settlement is nonpositive is marked false positive.
- `BWS118-R04-005-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-005 | requirement=Zero-cost control retains existing result.

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS118-R04-002-TEST-01` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-002 | requirement=Adverse and favorable slippage change residual and settled net deterministically.
- `BWS118-R04-002-TEST-02` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-002 | requirement=Fill fee and fixed fee are included exactly once.
- `BWS118-R04-002-TEST-03` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-002 | requirement=Planned quote identity differs from actual fill receipt and is preserved rather than overwritten.
- `BWS118-R04-002-TEST-04` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-002 | requirement=Missing actual execution terms block any metric that claims settled or residual economics.
- `BWS118-R04-005-TEST-01` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-005 | requirement=Nonzero percentage fee reduces settled net exactly once.
- `BWS118-R04-005-TEST-02` | category=api_or_projection | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-005 | requirement=Quote-age and capital-lock costs survive fill and settlement stages.
- `BWS118-R04-005-TEST-03` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-005 | requirement=A candidate whose gross settlement is positive but net settlement is nonpositive is marked false positive.
- `BWS118-R04-005-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-005 | requirement=Zero-cost control retains existing result.

## Negative and adversarial tests

- No separately classified record; admission must still test failure branches stated by each finding

## Concurrency, cancellation, crash, and restart tests

- No separately classified record

## Environment proof

- NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED: 8 requirements

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

Acceptance authority: - Actual price/odds/fees/slippage/receipt preserved

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W2-T16` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
