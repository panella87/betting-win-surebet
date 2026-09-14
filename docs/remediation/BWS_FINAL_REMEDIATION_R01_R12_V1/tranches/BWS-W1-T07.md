
# BWS-W1-T07 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W1-T07
CAMPAIGN_ORDER: 30
STAGE: S4
PRIMARY_OWNER: R02
SECONDARY_REVIEWERS: R01, R03, R04, R07, R11
ISSUE_IDS: BWS116-R02-003, BWS116-R02-004, BWS116-R02-005, BWS116-R02-010, BWS116-R02-011, BWS116-R02-014
SEVERITY_COUNTS: {"P1": 6}
DEPENDENCIES: T03, T06
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen application-source baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; documentation-audit preimage betting-win-surebet125.zip sha256=72a8262a5f94d144bb930cc9fb2778eed672d2a97a252f49b07f7b979b47224f with 995 regular files and no accepted remediation source result; this overlay changes documentation only; exact checkout/Git/source state must be reverified before editing
CURRENT_SOURCE_PATH_CANDIDATES: packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts, packages/bootstrap/src/contracts/b1-local-types.ts, packages/bootstrap/src/contracts/betting-win-resource-records.ts, packages/bootstrap/src/economics/b1-fee-matrix.ts, packages/bootstrap/src/economics/b1-net-spread.ts, packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts, packages/bootstrap/src/opportunity/b1-gross-spread.ts, packages/bootstrap/src/opportunity/standard-binary-stake-solver.ts, packages/bootstrap/src/quotes/b1-capacity-model.ts, packages/bootstrap/src/quotes/b1-quote-synchronization.ts, packages/bootstrap/src/quotes/quote-freshness.ts, packages/bootstrap/src/solver/b1-generalized-stake-vector.ts, packages/bootstrap/src/solver/stake-vector.ts
SYMBOLS_TO_REVERIFY: 25 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts, packages/bootstrap/src/contracts/b1-local-types.ts, packages/bootstrap/src/contracts/betting-win-resource-records.ts, packages/bootstrap/src/economics/b1-fee-matrix.ts, packages/bootstrap/src/economics/b1-net-spread.ts, packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts, packages/bootstrap/src/opportunity/b1-gross-spread.ts, packages/bootstrap/src/solver/b1-generalized-stake-vector.ts, packages/bootstrap/src/solver/stake-vector.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites `["T03", "T06", "Authoritative fee/capacity/increment contracts"]`
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 24 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 0 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 13 classified records below
CONCURRENCY_OR_CRASH_TESTS: 0 classified records below
ENVIRONMENT_PROOF: {"NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE": 24}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: ["One candidate-global snapshot window", "Selected odds value-bound to exact evidence", "Capacity and venue limits gate solver/net classification", "Fee basis and stake increments are explicit"]
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": false, "bws_710": false, "deployment": false, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W1-T08 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` | present=yes | sha256=b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/contracts/b1-local-types.ts` | present=yes | sha256=22a43ced9a713e4144e343529a8940edfa00676659aa01f48f739e3f28ca03e1 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/contracts/betting-win-resource-records.ts` | present=yes | sha256=8ca3a040b691242eb1025ab74f545157c1072b85332fdc1313924e57396c6903 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/economics/b1-fee-matrix.ts` | present=yes | sha256=081e148be8c1e3ffce089cca44c14cb16fa94ee25ae06a320d422b23e9e37175 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/economics/b1-net-spread.ts` | present=yes | sha256=0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` | present=yes | sha256=29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/opportunity/b1-gross-spread.ts` | present=yes | sha256=48ecd0e6402a23610f9582222e86e31c943948f31b6edf0896a66751edfddafb | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/opportunity/standard-binary-stake-solver.ts` | present=yes | sha256=a68d4ea89b2ec4a7d83d8e2ced929732522e0e4af5a36efaac4712e88255dc92 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/quotes/b1-capacity-model.ts` | present=yes | sha256=6a98bd374fff19cd414d04fc3410ad944b234043733d8f258a383537e0a28617 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/quotes/b1-quote-synchronization.ts` | present=yes | sha256=4746d1bd364a7389a95b4aa912e66f66041c44fc51083dcd02a12e9ad1fa9bde | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/quotes/quote-freshness.ts` | present=yes | sha256=38a0042d488084145e2438fe30d9e5b0ed665733af97b561587ca78d5bb9718f | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` | present=yes | sha256=822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/solver/stake-vector.ts` | present=yes | sha256=d5022b515bbac8672ed337933887276d590424c89b75c3e5acd290f3a5561029 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS116-R02-003 | `packages/bootstrap/src/quotes/b1-quote-synchronization.ts` | symbol=synchronizeB1VenueQuotePair | reviewed_line_range=41-86 | reviewed_sha256=4746d1bd364a7389a95b4aa912e66f66041c44fc51083dcd02a12e9ad1fa9bde
- BWS116-R02-003 | `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` | symbol=deriveVenuePairGrossCandidate | reviewed_line_range=166-216 | reviewed_sha256=29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543
- BWS116-R02-003 | `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` | symbol=acceptedCandidate | reviewed_line_range=238-273 | reviewed_sha256=29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543
- BWS116-R02-003 | `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` | symbol=maxComparisonWindow | reviewed_line_range=437-445 | reviewed_sha256=29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543
- BWS116-R02-004 | `packages/bootstrap/src/opportunity/b1-gross-spread.ts` | symbol=B1GrossQuoteContribution | reviewed_line_range=18-26 | reviewed_sha256=48ecd0e6402a23610f9582222e86e31c943948f31b6edf0896a66751edfddafb
- BWS116-R02-004 | `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` | symbol=selected quote projection | reviewed_line_range=210-216 | reviewed_sha256=29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543
- BWS116-R02-004 | `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` | symbol=acceptedCandidate selectedQuotes/synchronizedQuotePairs | reviewed_line_range=252-272 | reviewed_sha256=29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543
- BWS116-R02-004 | `packages/bootstrap/src/economics/b1-net-spread.ts` | symbol=evaluateB1NetEconomics | reviewed_line_range=119-167 | reviewed_sha256=0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b
- BWS116-R02-004 | `packages/bootstrap/src/economics/b1-net-spread.ts` | symbol=validateAcceptedB1GrossCandidateShape / findSelectedSynchronizedQuote | reviewed_line_range=275-369 | reviewed_sha256=0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b
- BWS116-R02-005 | `packages/bootstrap/src/quotes/b1-capacity-model.ts` | symbol=B1CapacityPolicy / B1CapacityDecision / evaluateB1QuoteCapacity | reviewed_line_range=11-31 | reviewed_sha256=6a98bd374fff19cd414d04fc3410ad944b234043733d8f258a383537e0a28617
- BWS116-R02-005 | `packages/bootstrap/src/quotes/b1-capacity-model.ts` | symbol=capacity enforcement | reviewed_line_range=70-118 | reviewed_sha256=6a98bd374fff19cd414d04fc3410ad944b234043733d8f258a383537e0a28617
- BWS116-R02-005 | `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` | symbol=B1GeneralizedStakeVectorPolicy | reviewed_line_range=28-41 | reviewed_sha256=822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0
- BWS116-R02-005 | `packages/bootstrap/src/economics/b1-net-spread.ts` | symbol=B1NetEconomicsPolicy / evaluateB1NetEconomics | reviewed_line_range=31-41 | reviewed_sha256=0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b
- BWS116-R02-005 | `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` | symbol=B1CrossVenueBacktestPlan | reviewed_line_range=20-29 | reviewed_sha256=b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4
- BWS116-R02-005 | `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` | symbol=runCandidateBacktest | reviewed_line_range=387-400 | reviewed_sha256=b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4
- BWS116-R02-010 | `packages/bootstrap/src/opportunity/standard-binary-stake-solver.ts` | symbol=StandardBinaryStakeVectorSolveOptions / freshness default | reviewed_line_range=13-45 | reviewed_sha256=a68d4ea89b2ec4a7d83d8e2ced929732522e0e4af5a36efaac4712e88255dc92
- BWS116-R02-010 | `packages/bootstrap/src/opportunity/standard-binary-stake-solver.ts` | symbol=validateCompleteSetQuoteFreshness | reviewed_line_range=110-124 | reviewed_sha256=a68d4ea89b2ec4a7d83d8e2ced929732522e0e4af5a36efaac4712e88255dc92
- BWS116-R02-010 | `packages/bootstrap/src/quotes/quote-freshness.ts` | symbol=checkQuoteFreshness | reviewed_line_range=10-33 | reviewed_sha256=38a0042d488084145e2438fe30d9e5b0ed665733af97b561587ca78d5bb9718f
- BWS116-R02-011 | `packages/bootstrap/src/contracts/betting-win-resource-records.ts` | symbol=BettingWinQuoteRecord | reviewed_line_range=31-40 | reviewed_sha256=8ca3a040b691242eb1025ab74f545157c1072b85332fdc1313924e57396c6903
- BWS116-R02-011 | `packages/bootstrap/src/opportunity/standard-binary-stake-solver.ts` | symbol=deriveRoundingConstraints | reviewed_line_range=209-238 | reviewed_sha256=a68d4ea89b2ec4a7d83d8e2ced929732522e0e4af5a36efaac4712e88255dc92
- BWS116-R02-011 | `packages/bootstrap/src/solver/stake-vector.ts` | symbol=StakeVectorRoundingConstraint | reviewed_line_range=5-14 | reviewed_sha256=d5022b515bbac8672ed337933887276d590424c89b75c3e5acd290f3a5561029
- BWS116-R02-014 | `packages/bootstrap/src/contracts/b1-local-types.ts` | symbol=B1VenueType / B1MultiVenueMarketRow | reviewed_line_range=10-12 | reviewed_sha256=22a43ced9a713e4144e343529a8940edfa00676659aa01f48f739e3f28ca03e1
- BWS116-R02-014 | `packages/bootstrap/src/economics/b1-fee-matrix.ts` | symbol=B1FeeMatrixEntry / B1FeeCharge | reviewed_line_range=7-25 | reviewed_sha256=081e148be8c1e3ffce089cca44c14cb16fa94ee25ae06a320d422b23e9e37175
- BWS116-R02-014 | `packages/bootstrap/src/economics/b1-fee-matrix.ts` | symbol=calculateB1FeeCharge | reviewed_line_range=27-83 | reviewed_sha256=081e148be8c1e3ffce089cca44c14cb16fa94ee25ae06a320d422b23e9e37175
- BWS116-R02-014 | `packages/bootstrap/src/economics/b1-net-spread.ts` | symbol=fee application and scenario totals | reviewed_line_range=119-188 | reviewed_sha256=0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS116-R02-003 — B1 synchronization is pair-local and can combine terminal outcomes outside the configured global quote window

- Severity: `P1`
- Current behavior: The code validates each selection pair separately, then reports the maximum intra-pair delta. It never compares selected quote timestamps across terminal outcomes and takes comparisonTimeUtc from the first pair.
- Expected behavior: The complete selected terminal-outcome portfolio must be inside one explicit synchronization window, and the reported window must represent the actual selected-quote span.
- Invariant: The complete selected terminal-outcome portfolio must be inside one explicit synchronization window, and the reported window must represent the actual selected-quote span.
- Root cause: Synchronization scope is selection-pair local rather than candidate-global.
- Trigger: Use two outcome pairs with zero intra-pair skew but a 10,000 ms skew between the selected outcomes under maxComparisonWindowMs=100.
- Minimal fix boundary: After best-quote selection, compute and enforce one candidate-global min/max snapshot span and bind comparison time/age evidence to every selected quote.
- Regression risks:
- A global gate can reduce candidate counts; metrics and fixtures must be updated truthfully.
- Do not replace source time with retrieval time.

### BWS116-R02-004 — B1 net economics accepts selected odds that are not value-bound to synchronized quote evidence

- Severity: `P1`
- Current behavior: Shape validation checks selected quote field types. findSelectedSynchronizedQuote matches only selectionEquivalenceKey and venueOrBookmakerId. Net payout then uses the detached selected quote decimalOddsMicro without comparing it to synchronized row odds or source evidence.
- Expected behavior: Net payout values must be derived from, or exactly value-bound to, the synchronized source row selected during gross derivation.
- Invariant: Net payout values must be derived from, or exactly value-bound to, the synchronized source row selected during gross derivation.
- Root cause: The accepted-gross contract duplicates economic values without an immutable value/evidence binding, and the net gate verifies identity keys only.
- Trigger: Replace selectedQuotes decimalOddsMicro values 2,200,000 with 3,000,000 while leaving synchronized source rows at 2.18/2.20.
- Minimal fix boundary: Derive net odds directly from the matched synchronized row or bind selected quote values to an immutable row/evidence digest and verify all value, provider-generation, time, side, and outcome fields.
- Regression risks:
- Contract changes affect test builders and downstream report serializers.
- Avoid trusting caller-provided digests without recomputation.

### BWS116-R02-005 — B1 integrated solver and net path is not bound to quote capacity or venue-limit decisions

- Severity: `P1`
- Current behavior: The backtest plan accepts caller-authored solver constraints and no capacity/venue-limit evidence. The solver and net evaluator never invoke evaluateB1QuoteCapacity. The standalone capacity primitive is used only in focused unit tests.
- Expected behavior: Every accepted stake and net candidate must be derived from explicit capacity and venue-limit decisions bound to the selected source rows.
- Invariant: Every accepted stake and net candidate must be derived from explicit capacity and venue-limit decisions bound to the selected source rows.
- Root cause: Capacity and venue-limit validation are disconnected primitives rather than authoritative inputs to stake-policy construction and net acceptance.
- Trigger: Solve/evaluate stakes of 100 minor units for a selected quote whose availableSizeMinor is 1, without invoking the separate capacity primitive.
- Minimal fix boundary: Introduce one R02 integration boundary that derives each leg max/min/step from selected quote capacity plus normalized venue limits and carries the resulting decisions through solver and net acceptance. Persistence changes belong to R03.
- Regression risks:
- Existing backtest plans and fixtures contain synthetic max values and will need explicit evidence.
- Do not allow an operator cap to exceed observed depth.

### BWS116-R02-010 — Standard-binary quote freshness is per leg and permits an asynchronous YES/NO snapshot

- Severity: `P1`
- Current behavior: The standard solver checks each quote independently against observedNowMs and never compares the two observedAt timestamps.
- Expected behavior: The two terminal quotes must satisfy an explicit same-snapshot or bounded pairwise synchronization rule in addition to individual freshness.
- Invariant: The two terminal quotes must satisfy an explicit same-snapshot or bounded pairwise synchronization rule in addition to individual freshness.
- Root cause: Freshness and synchronization are conflated; only age-to-now is modeled.
- Trigger: Evaluate one quote aged 59,999 ms and one current quote under a 60,000 ms age threshold.
- Minimal fix boundary: Add an explicit standard-binary pair synchronization bound and report actual snapshot span. Preserve individual freshness as a separate check.
- Regression risks:
- Candidate counts will decline when asynchronous snapshots are rejected.
- Do not reuse the B1 pair primitive without reconciling standard source semantics.

### BWS116-R02-011 — Standard-binary quote contract omits stake increment and silently substitutes minimum stake as the rounding step

- Severity: `P1`
- Current behavior: The standard quote type has no increment. deriveRoundingConstraints sets stepMinor equal to minStakeMinor and describes the minimum as a rounding step.
- Expected behavior: Minimum stake, maximum/depth, and increment must be independent explicit values bound to quote/venue authority.
- Invariant: Minimum stake, maximum/depth, and increment must be independent explicit values bound to quote/venue authority.
- Root cause: The standard data contract collapses two independent venue constraints into one field.
- Trigger: Build the standard stake-vector input for quotes with minStakeMinor=10; the derived step is automatically 10 regardless of the actual venue increment.
- Minimal fix boundary: Extend the standard quote/depth contract with an explicit bounded increment and derive rounding constraints from it. Upstream schema ownership is an R01 handoff; solver consumption is R02.
- Regression risks:
- Schema and fixture changes cross the upstream contract boundary.
- The increment origin convention must be explicit.

### BWS116-R02-014 — B1 fee matrix cannot represent scenario-conditional or non-stake fee bases accepted by its venue-type domain

- Severity: `P1`
- Current behavior: The only model is feeBps on stake plus fixedFeeMinor, keyed by venue and selection. The charge is computed before scenarios and subtracted from every scenario. Venue type is not consulted and no alternative basis can be represented.
- Expected behavior: Fee authority must declare basis, side/role, condition, rounding, minimum/maximum, and version so each terminal scenario is charged correctly.
- Invariant: Fee authority must declare basis, side/role, condition, rounding, minimum/maximum, and version so each terminal scenario is charged correctly.
- Root cause: Fee semantics are collapsed to one unconditional stake-percentage formula despite a heterogeneous venue domain.
- Trigger: Model a 2% commission on positive winnings at odds 3.0 and stake 100.
- Minimal fix boundary: Define versioned fee-basis unions and scenario-dependent fee cash flows in R02. Current provider-specific fee authority remains an R01 external-input requirement; do not guess venue schedules.
- Regression risks:
- Incorrect generalization can double-charge or omit fees.
- Provider fee schedules are external authority and may change.


## Allowed edit boundary

- Candidate path set: `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts`, `packages/bootstrap/src/contracts/b1-local-types.ts`, `packages/bootstrap/src/contracts/betting-win-resource-records.ts`, `packages/bootstrap/src/economics/b1-fee-matrix.ts`, `packages/bootstrap/src/economics/b1-net-spread.ts`, `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts`, `packages/bootstrap/src/opportunity/b1-gross-spread.ts`, `packages/bootstrap/src/opportunity/standard-binary-stake-solver.ts`, `packages/bootstrap/src/quotes/b1-capacity-model.ts`, `packages/bootstrap/src/quotes/b1-quote-synchronization.ts`, `packages/bootstrap/src/quotes/quote-freshness.ts`, `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts`, `packages/bootstrap/src/solver/stake-vector.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` | participating tranches=T07, T16, T17 | predecessor postimage required
- `packages/bootstrap/src/contracts/b1-local-types.ts` | participating tranches=T06, T07 | predecessor postimage required
- `packages/bootstrap/src/contracts/betting-win-resource-records.ts` | participating tranches=T06, T07 | predecessor postimage required
- `packages/bootstrap/src/economics/b1-fee-matrix.ts` | participating tranches=T06, T07 | predecessor postimage required
- `packages/bootstrap/src/economics/b1-net-spread.ts` | participating tranches=T07, T15 | predecessor postimage required
- `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` | participating tranches=T06, T07, T17 | predecessor postimage required
- `packages/bootstrap/src/opportunity/b1-gross-spread.ts` | participating tranches=T06, T07 | predecessor postimage required
- `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` | participating tranches=T06, T07, T08 | predecessor postimage required
- `packages/bootstrap/src/solver/stake-vector.ts` | participating tranches=T07, T08 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- Available-size capacity calculation
- B1 explicit stakeStepMinor contract
- B1 global synchronization finding BWS116-R02-003
- Canonical timestamp parsing
- Capital-lock formula
- Current simple stake-bps arithmetic for explicitly compatible venues
- Fee and capital-lock arithmetic
- Fill/rejection lifecycle after stake acceptance
- Gross reciprocal formula
- Individual future/stale rejection
- No profitability or execution authority
- No-live-operation boundary
- Per-row future and age validation
- Provider access remains prohibited
- Provider intake timing semantics
- Runtime execution path
- Runtime scheduler behavior
- Standalone capacity arithmetic
- Venue-limit normalization
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T03, T06.
- Review prerequisites: ["T03", "T06", "Authoritative fee/capacity/increment contracts"].
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

- `BWS116-R02-003-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-003 | requirement=Two- and three-way cross-outcome skew tests.
- `BWS116-R02-003-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-003 | requirement=Boundary tests at window-1, window, and window+1.
- `BWS116-R02-003-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-003 | requirement=Permutation tests proving identical global span and decision.
- `BWS116-R02-004-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-004 | requirement=Detached-odds mutation rejection.
- `BWS116-R02-004-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-004 | requirement=OutcomeName/outcomeSide mutation rejection.
- `BWS116-R02-004-TEST-03` | category=identity_or_determinism | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-004 | requirement=Provider-generation/evidence/time mutation rejection.
- `BWS116-R02-004-TEST-04` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-004 | requirement=Exact derivation-to-net round-trip tests.
- `BWS116-R02-005-TEST-01` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-005 | requirement=End-to-end quote-depth-to-solver constraint tests.
- `BWS116-R02-005-TEST-02` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-005 | requirement=Stake above quote, venue, market, and portfolio cap rejection tests.
- `BWS116-R02-005-TEST-03` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-005 | requirement=Missing capacity/proxy and missing venue-limit tests.
- `BWS116-R02-005-TEST-04` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-005 | requirement=Capacity changes after selection must invalidate the candidate.
- `BWS116-R02-010-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-010 | requirement=Pair-skew boundary tests.
- `BWS116-R02-010-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-010 | requirement=Individually fresh but mutually stale rejection.
- `BWS116-R02-010-TEST-03` | category=identity_or_determinism | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-010 | requirement=Same manifest with divergent timestamps.
- `BWS116-R02-010-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-010 | requirement=Permutation invariance.
- `BWS116-R02-011-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-011 | requirement=min != step cases.
- `BWS116-R02-011-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-011 | requirement=min not divisible by step cases.
- `BWS116-R02-011-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-011 | requirement=step greater/less than min.
- `BWS116-R02-011-TEST-04` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-011 | requirement=Capacity boundary after rounding.
- `BWS116-R02-011-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-011 | requirement=Missing increment fail-closed test.
- `BWS116-R02-014-TEST-01` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-014 | requirement=Stake, payout, profit, liability, maker/taker, fixed, minimum, maximum, and conditional fee cases.
- `BWS116-R02-014-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-014 | requirement=Scenario-only charge tests.
- `BWS116-R02-014-TEST-03` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-014 | requirement=Unknown fee basis must block.
- `BWS116-R02-014-TEST-04` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-014 | requirement=Independent cash-flow oracle tests.

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- none mapped; focused environment proof remains required

## Negative and adversarial tests

- `BWS116-R02-004-TEST-03` | category=identity_or_determinism | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-004 | requirement=Provider-generation/evidence/time mutation rejection.
- `BWS116-R02-004-TEST-04` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-004 | requirement=Exact derivation-to-net round-trip tests.
- `BWS116-R02-005-TEST-01` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-005 | requirement=End-to-end quote-depth-to-solver constraint tests.
- `BWS116-R02-005-TEST-02` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-005 | requirement=Stake above quote, venue, market, and portfolio cap rejection tests.
- `BWS116-R02-005-TEST-03` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-005 | requirement=Missing capacity/proxy and missing venue-limit tests.
- `BWS116-R02-005-TEST-04` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-005 | requirement=Capacity changes after selection must invalidate the candidate.
- `BWS116-R02-010-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-010 | requirement=Individually fresh but mutually stale rejection.
- `BWS116-R02-010-TEST-03` | category=identity_or_determinism | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-010 | requirement=Same manifest with divergent timestamps.
- `BWS116-R02-011-TEST-04` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-011 | requirement=Capacity boundary after rounding.
- `BWS116-R02-011-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-011 | requirement=Missing increment fail-closed test.
- `BWS116-R02-014-TEST-01` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-014 | requirement=Stake, payout, profit, liability, maker/taker, fixed, minimum, maximum, and conditional fee cases.
- `BWS116-R02-014-TEST-03` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-014 | requirement=Unknown fee basis must block.
- `BWS116-R02-014-TEST-04` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-014 | requirement=Independent cash-flow oracle tests.

## Concurrency, cancellation, crash, and restart tests

- No separately classified record

## Environment proof

- NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE: 24 requirements

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

Acceptance authority: ["One candidate-global snapshot window", "Selected odds value-bound to exact evidence", "Capacity and venue limits gate solver/net classification", "Fee basis and stake increments are explicit"]

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W1-T08` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
