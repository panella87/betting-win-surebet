
# BWS-W2-T17 implementation packet

> Documentation status: `PROPOSED_NOT_ACTIVE` for T39 and `NOT_ADMITTED` for all tranches. This packet does not authorize source mutation.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W2-T17
CAMPAIGN_ORDER: 35
STAGE: S4
PRIMARY_OWNER: R04
SECONDARY_REVIEWERS: R01, R02, R03, R05, R07, R11
ISSUE_IDS: BWS118-R04-009, BWS118-R04-010, BWS118-R04-011, BWS118-R04-012, BWS118-R04-013, BWS118-R04-014
SEVERITY_COUNTS: {"P1": 4, "P2": 2}
DEPENDENCIES: T12, T14, T15, T16
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; exact 771-member archive inventory; independently computed inventory digest=b81ff807e4c230bff96fe1fa58f73a2d4bac803ebd7fa58b843cdcb83499f7f0
CURRENT_SOURCE_PATH_CANDIDATES: packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts, packages/bootstrap/src/backtest/standard-binary-backtest.ts, packages/bootstrap/src/operations/b1-runtime-evidence.ts, packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts, packages/bootstrap/src/reporting/b1-backtest-report.ts, packages/bootstrap/src/reporting/b1-false-positive-report.ts, packages/bootstrap/src/runtime/private-paper-runtime.ts, packages/bootstrap/src/simulation/b1-leg-completion.ts, packages/bootstrap/src/simulation/leg-completion.ts, packages/bootstrap/src/simulation/partial-fill.ts, packages/bootstrap/src/strategy/strategy-ledger.ts, tests/leg-completion.test.ts
SYMBOLS_TO_REVERIFY: 21 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts, packages/bootstrap/src/backtest/standard-binary-backtest.ts, packages/bootstrap/src/operations/b1-runtime-evidence.ts, packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts, packages/bootstrap/src/runtime/private-paper-runtime.ts, packages/bootstrap/src/simulation/b1-leg-completion.ts, packages/bootstrap/src/strategy/strategy-ledger.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites `- BWS-W2-T14`
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 22 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 22 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 6 classified records below
CONCURRENCY_OR_CRASH_TESTS: 1 classified records below
ENVIRONMENT_PROOF: {"NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED": 22}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: - Reports preserve leg/residual/terminal state
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": true, "bws_710": true, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W2-T18 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` | present=yes | sha256=b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/backtest/standard-binary-backtest.ts` | present=yes | sha256=b89833bedd366b9d4b714cb0eddd6610e5eabd7217477063d7a1a2006b60e438 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/b1-runtime-evidence.ts` | present=yes | sha256=80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` | present=yes | sha256=29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/reporting/b1-backtest-report.ts` | present=yes | sha256=8c8cbc440a521c4ee32de8bde89c547fe3c97c36d43935008c3f0b39a2657272 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/reporting/b1-false-positive-report.ts` | present=yes | sha256=55d3a251830501a284214bac6e94a16eb3f194fcce33195df5e3ee37cb985f95 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/runtime/private-paper-runtime.ts` | present=yes | sha256=252e38a52693f3fa598c9ea92a83b184de0c4b29c4ab0bd5c952b750d009c6f5 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/simulation/b1-leg-completion.ts` | present=yes | sha256=108996f173a566dfb8b72de38c364d3f1d7b3610bcceadbe6c415d94a5fc5b3b | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/simulation/leg-completion.ts` | present=yes | sha256=934fb7e5b36545bbc393d0c4909cd4fbc5ddaaf2d540819acc222577ba672aa7 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/simulation/partial-fill.ts` | present=yes | sha256=84ea147e7d449e3ffdfcfcd662f29803dc5905f4d207b556ed04ab6b39071a93 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/strategy/strategy-ledger.ts` | present=yes | sha256=d05e339a5692a9218f2146c153570ee7d9c8d79ae88282e162b7ece0c0cb5dbc | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `tests/leg-completion.test.ts` | present=yes | sha256=f3e273e97b4388f9aa45e6cb4197874f90aafdedceebea4892a2293abeadce24 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS118-R04-009 | `packages/bootstrap/src/simulation/b1-leg-completion.ts` | symbol=simulateB1FillRejectionTimeout | reviewed_line_range=L83-L135 | reviewed_sha256=108996f173a566dfb8b72de38c364d3f1d7b3610bcceadbe6c415d94a5fc5b3b
- BWS118-R04-009 | `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` | symbol=toReportCandidateSummary | reviewed_line_range=L452-L493 | reviewed_sha256=b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4
- BWS118-R04-009 | `packages/bootstrap/src/reporting/b1-backtest-report.ts` | symbol=B1BacktestReportCandidateSummary | reviewed_line_range=L6-L25 | reviewed_sha256=8c8cbc440a521c4ee32de8bde89c547fe3c97c36d43935008c3f0b39a2657272
- BWS118-R04-009 | `packages/bootstrap/src/reporting/b1-backtest-report.ts` | symbol=calculateMetrics | reviewed_line_range=L369-L419 | reviewed_sha256=8c8cbc440a521c4ee32de8bde89c547fe3c97c36d43935008c3f0b39a2657272
- BWS118-R04-009 | `packages/bootstrap/src/operations/b1-runtime-evidence.ts` | symbol=runtimeAcceptanceMetrics | reviewed_line_range=L485-L514 | reviewed_sha256=80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8
- BWS118-R04-010 | `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` | symbol=falsePositiveObservations collection | reviewed_line_range=L100-L121 | reviewed_sha256=b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4
- BWS118-R04-010 | `packages/bootstrap/src/reporting/b1-false-positive-report.ts` | symbol=createB1FalsePositiveReport | reviewed_line_range=L31-L100 | reviewed_sha256=55d3a251830501a284214bac6e94a16eb3f194fcce33195df5e3ee37cb985f95
- BWS118-R04-011 | `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` | symbol=deriveB1CrossVenueGrossOpportunityCandidates | reviewed_line_range=L88-L142 | reviewed_sha256=29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543
- BWS118-R04-011 | `packages/bootstrap/src/reporting/b1-backtest-report.ts` | symbol=calculateMetrics | reviewed_line_range=L369-L419 | reviewed_sha256=8c8cbc440a521c4ee32de8bde89c547fe3c97c36d43935008c3f0b39a2657272
- BWS118-R04-011 | `packages/bootstrap/src/operations/b1-runtime-evidence.ts` | symbol=dataCoverageBlockers / runtimeAcceptanceMetrics | reviewed_line_range=L418-L500 | reviewed_sha256=80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8
- BWS118-R04-012 | `packages/bootstrap/src/backtest/standard-binary-backtest.ts` | symbol=StandardBinaryBacktestAcceptedCandidateResult | reviewed_line_range=L43-L62 | reviewed_sha256=b89833bedd366b9d4b714cb0eddd6610e5eabd7217477063d7a1a2006b60e438
- BWS118-R04-012 | `packages/bootstrap/src/backtest/standard-binary-backtest.ts` | symbol=createAcceptedCandidateResult | reviewed_line_range=L571-L607 | reviewed_sha256=b89833bedd366b9d4b714cb0eddd6610e5eabd7217477063d7a1a2006b60e438
- BWS118-R04-012 | `packages/bootstrap/src/runtime/private-paper-runtime.ts` | symbol=PrivatePaperRuntimeAcceptedCandidateResult | reviewed_line_range=L106-L126 | reviewed_sha256=252e38a52693f3fa598c9ea92a83b184de0c4b29c4ab0bd5c952b750d009c6f5
- BWS118-R04-012 | `packages/bootstrap/src/runtime/private-paper-runtime.ts` | symbol=create accepted runtime candidate result | reviewed_line_range=L1161-L1191 | reviewed_sha256=252e38a52693f3fa598c9ea92a83b184de0c4b29c4ab0bd5c952b750d009c6f5
- BWS118-R04-012 | `packages/bootstrap/src/strategy/strategy-ledger.ts` | symbol=SurebetStrategyCandidateReport | reviewed_line_range=L113-L123 | reviewed_sha256=d05e339a5692a9218f2146c153570ee7d9c8d79ae88282e162b7ece0c0cb5dbc
- BWS118-R04-012 | `packages/bootstrap/src/strategy/strategy-ledger.ts` | symbol=toBacktestCandidateReport / toPrivatePaperCandidateReport | reviewed_line_range=L795-L841 | reviewed_sha256=d05e339a5692a9218f2146c153570ee7d9c8d79ae88282e162b7ece0c0cb5dbc
- BWS118-R04-013 | `packages/bootstrap/src/reporting/b1-false-positive-report.ts` | symbol=createB1FalsePositiveReport | reviewed_line_range=L31-L100 | reviewed_sha256=55d3a251830501a284214bac6e94a16eb3f194fcce33195df5e3ee37cb985f95
- BWS118-R04-013 | `packages/bootstrap/src/reporting/b1-false-positive-report.ts` | symbol=validateB1FalsePositiveObservation | reviewed_line_range=L102-L163 | reviewed_sha256=55d3a251830501a284214bac6e94a16eb3f194fcce33195df5e3ee37cb985f95
- BWS118-R04-014 | `packages/bootstrap/src/simulation/partial-fill.ts` | symbol=PartialFillModelStatus / partialFillModelStatus | reviewed_line_range=L3-L18 | reviewed_sha256=84ea147e7d449e3ffdfcfcd662f29803dc5905f4d207b556ed04ab6b39071a93
- BWS118-R04-014 | `packages/bootstrap/src/simulation/leg-completion.ts` | symbol=PAPER_LEG_COMPLETION_STATES | reviewed_line_range=L5-L12 | reviewed_sha256=934fb7e5b36545bbc393d0c4909cd4fbc5ddaaf2d540819acc222577ba672aa7
- BWS118-R04-014 | `tests/leg-completion.test.ts` | symbol=partial-fill status assertions | reviewed_line_range=L1-L246 | reviewed_sha256=f3e273e97b4388f9aa45e6cb4197874f90aafdedceebea4892a2293abeadce24

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS118-R04-009 — B1 report labels in-limit incomplete, rejected, or timed-out simulations as accepted and fillable while discarding leg state

- Severity: `P1`
- Current behavior: Any candidate result that reaches settlement is mapped to status=accepted, stage=accepted. The summary drops fillability group state, leg snapshots, terminal dispositions, residual exposure, and exposure-limit status. calculateMetrics sets fillableCandidateCount to the number of accepted summaries.
- Expected behavior: Report status must distinguish fully filled, incomplete-with-residual, rejected, timed-out, settled, and unreconciled states. “Fillable” must not mean merely that the pipeline returned ok.
- Invariant: Report status must distinguish fully filled, incomplete-with-residual, rejected, timed-out, settled, and unreconciled states. “Fillable” must not mean merely that the pipeline returned ok.
- Root cause: The report collapses “pipeline completed with analyzable residual exposure” into “accepted/fillable” and its schema lacks the state needed to preserve that distinction.
- Trigger: Run a candidate with a partially filled rejected leg and another timed-out leg whose residual remains inside the limit.
- Minimal fix boundary: Expand candidate summaries and metrics to preserve fill group state, terminal dispositions, residual exposure, reconciliation state, and distinct fillability classification. Public UI projection remains R05-owned.
- Regression risks:
- Report hash/version change
- Acceptance threshold recalibration
- Cockpit/API consumer compatibility

### BWS118-R04-010 — B1 false-positive analysis excludes failures before settlement and computes the rate only over accepted settlements

- Severity: `P1`
- Current behavior: The backtest adds false-positive observations only for fully successful candidates and settlement-stage blockers. Gross, solver, net, and fillability failures disappear. createB1FalsePositiveReport divides falsePositiveCount by acceptedSettlementCount only, excluding blocked settlements from the rate.
- Expected behavior: The falsification denominator and stage metrics must account for every derived candidate and distinguish pre-settlement false positives, fill failures, blocked/unknown settlement, and accepted settlement outcomes.
- Invariant: The falsification denominator and stage metrics must account for every derived candidate and distinguish pre-settlement false positives, fill failures, blocked/unknown settlement, and accepted settlement outcomes.
- Root cause: The falsification model is settlement-only, but its name and downstream acceptance usage imply end-to-end candidate false-positive analysis.
- Trigger: Include candidates that fail before settlement and a mix of accepted and blocked settlement observations.
- Minimal fix boundary: Define explicit stage denominators and an end-to-end candidate outcome taxonomy; include every derived candidate exactly once and keep blocked/unknown rates separate from accepted settlement rates.
- Regression risks:
- Historical metric comparability
- Acceptance threshold semantics
- Do not call operational blockage economic false positive

### BWS118-R04-011 — B1 marketsCompared counts venue-pair candidates rather than unique markets and can inflate the 50,000-market gate

- Severity: `P1`
- Current behavior: calculateMetrics sets marketsCompared=candidates.length and candidateCount=candidates.length. Candidate derivation emits one candidate per market and venue pair, so one market is counted repeatedly. Runtime acceptance trusts this value for minimumMarketsCompared.
- Expected behavior: marketsCompared must count unique market identities, separately from candidate and venue-pair counts.
- Invariant: marketsCompared must count unique market identities, separately from candidate and venue-pair counts.
- Root cause: The report has no independent unique-market set and aliases a coverage metric to the candidate cardinality.
- Trigger: Generate three candidate summaries for one marketEquivalenceKey across three venue pairs.
- Minimal fix boundary: Derive marketsCompared from unique canonical market/equivalence identity, retain candidateCount separately, and bind acceptance to the corrected metric.
- Regression risks:
- Acceptance baselines may fall after correction
- Market identity dependency on R02
- Historical report hash changes

### BWS118-R04-012 — Standard backtest and private-paper strategy reports discard per-leg lifecycle evidence while labeling candidates accepted_local_evidence

- Severity: `P1`
- Current behavior: Standard accepted results retain only aggregate group state, counts, filled/excluded IDs, settlement, and optional residual summary. The strategy report reduces this further to completionGroupState, settledNetMinor, finalOutcome, and optional killReason, then labels it accepted_local_evidence.
- Expected behavior: The accepted evidence report must retain the exact completion snapshots, terminal dispositions, event/receipt identities, residual scenario evidence, and reconciliation state needed to audit the acceptance label.
- Invariant: The accepted evidence report must retain the exact completion snapshots, terminal dispositions, event/receipt identities, residual scenario evidence, and reconciliation state needed to audit the acceptance label.
- Root cause: Evidence projection is lossy at two consecutive boundaries and the acceptance label is derived from pipeline success rather than an independently auditable lifecycle packet.
- Trigger: Project an accepted backtest/private-paper result into SurebetStrategyCandidateReport.
- Minimal fix boundary: Preserve or content-address the full completion/reconciliation packet in accepted candidate reports and bind the acceptance label to that immutable evidence. API/UI rendering remains R05-owned; publication lineage remains R07-owned.
- Regression risks:
- Larger report artifacts
- Backward compatibility and report hashes
- Retention/reference requirements

### BWS118-R04-013 — B1 false-positive report throws on malformed top-level or observation objects instead of returning a blocked boundary result

- Severity: `P2`
- Current behavior: The function immediately reads observations.length and the validator immediately calls observation.candidateId.trim() without checking object or string shape. Malformed input throws TypeError.
- Expected behavior: All public boundary helpers must validate container and field types before dereference and return BoundaryResult blockers for malformed input.
- Invariant: All public boundary helpers must validate container and field types before dereference and return BoundaryResult blockers for malformed input.
- Root cause: The report helper relies on TypeScript compile-time shape guarantees at a runtime boundary that is called with deserialized/untrusted structures elsewhere in the repository.
- Trigger: Call createB1FalsePositiveReport(null) or pass {settlementStatus:"accepted"} as an observation.
- Minimal fix boundary: Add top-level array and per-observation structural validation before dereference; return stable blocker codes and preserve current valid-output shape.
- Regression risks:
- Blocker code compatibility
- Avoid masking programmer invariants as user input
- Performance for large arrays

### BWS118-R04-014 — Exported partial-fill status falsely identifies a legacy state machine that has no partial-fill state

- Severity: `P2`
- Current behavior: partialFillModelStatus returns accepted and names src/simulation/leg-completion.ts, but PAPER_LEG_COMPLETION_STATES in that module contains open, reserved, filled, failed, stale, and settlement_pending only. The actual partial-fill behavior lives in non-atomic-completion.ts and B1 modules.
- Expected behavior: Capability/status evidence must identify the actual production partial-fill implementation and prove the claimed state is representable through its entrypoint.
- Invariant: Capability/status evidence must identify the actual production partial-fill implementation and prove the claimed state is representable through its entrypoint.
- Root cause: A static capability marker was not updated when implementation moved to a different state machine, and tests validate the declaration rather than the declared behavior.
- Trigger: Read the accepted status payload and follow implementationModule to src/simulation/leg-completion.ts.
- Minimal fix boundary: Retire the stale status helper or point it to the actual production entrypoint with a behavioral validator. Aggregate validator ownership remains R11.
- Regression risks:
- Legacy consumer expectations
- Documentation links
- Avoid treating local capability as runtime acceptance


## Allowed edit boundary

- Candidate path set: `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts`, `packages/bootstrap/src/backtest/standard-binary-backtest.ts`, `packages/bootstrap/src/operations/b1-runtime-evidence.ts`, `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts`, `packages/bootstrap/src/reporting/b1-backtest-report.ts`, `packages/bootstrap/src/reporting/b1-false-positive-report.ts`, `packages/bootstrap/src/runtime/private-paper-runtime.ts`, `packages/bootstrap/src/simulation/b1-leg-completion.ts`, `packages/bootstrap/src/simulation/leg-completion.ts`, `packages/bootstrap/src/simulation/partial-fill.ts`, `packages/bootstrap/src/strategy/strategy-ledger.ts`, `tests/leg-completion.test.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` | participating tranches=T07, T16, T17 | predecessor postimage required
- `packages/bootstrap/src/backtest/standard-binary-backtest.ts` | participating tranches=T16, T17 | predecessor postimage required
- `packages/bootstrap/src/operations/b1-runtime-evidence.ts` | participating tranches=T17, T29, T41 | predecessor postimage required
- `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` | participating tranches=T06, T07, T17 | predecessor postimage required
- `packages/bootstrap/src/runtime/private-paper-runtime.ts` | participating tranches=T12, T14, T17 | predecessor postimage required
- `packages/bootstrap/src/simulation/b1-leg-completion.ts` | participating tranches=T14, T15, T17 | predecessor postimage required
- `packages/bootstrap/src/strategy/strategy-ledger.ts` | participating tranches=T12, T17, T20 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- - Historical report artifacts remain historical
- Actual non-atomic and B1 partial-fill implementations
- B1 residual limit calculation
- BWS-600 external hold
- Candidate IDs
- Candidate derivation ordering
- Candidate identity markers
- No execution
- No public profitability claim
- No-live-readiness markers
- Privacy=private_only
- Private-only/no-profit markers
- Runtime acceptance semantics
- Settlement blocker classification
- Settlement blocker code classification
- Unique-event deduplication
- Upstream lock reference fields
- Valid report arithmetic
- Venue-pair counting
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T12, T14, T15, T16.
- Review prerequisites: - BWS-W2-T14.
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

- `BWS118-R04-009-TEST-01` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-009 | requirement=Fully filled and incomplete-in-limit candidates produce different report states and counters.
- `BWS118-R04-009-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-009 | requirement=Rejected/timed-out leg details survive report serialization and hashing.
- `BWS118-R04-009-TEST-03` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-009 | requirement=Acceptance gates do not count incomplete candidates as filled.
- `BWS118-R04-009-TEST-04` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-009 | requirement=Blocked, incomplete, settled, and fully filled states remain mutually exclusive.
- `BWS118-R04-010-TEST-01` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-010 | requirement=Gross, stake, net, fillability, and settlement failures each appear in stage counts.
- `BWS118-R04-010-TEST-02` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-010 | requirement=Blocked/unknown settlements cannot reduce the accepted-outcome false-positive rate silently.
- `BWS118-R04-010-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-010 | requirement=End-to-end denominator equals unique derived candidates.
- `BWS118-R04-010-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-010 | requirement=Duplicate candidate IDs and reordered observations do not alter counts.
- `BWS118-R04-011-TEST-01` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-011 | requirement=Multiple venue pairs for one market count as one market and multiple candidates.
- `BWS118-R04-011-TEST-02` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-011 | requirement=Same market across duplicate rows remains one market.
- `BWS118-R04-011-TEST-03` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-011 | requirement=Distinct markets on one event count separately.
- `BWS118-R04-011-TEST-04` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-011 | requirement=Runtime threshold test proves candidate multiplication cannot satisfy market coverage.
- `BWS118-R04-012-TEST-01` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-012 | requirement=Per-leg terminal and quantity state survives backtest/private report generation.
- `BWS118-R04-012-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-012 | requirement=Report digest changes when any underlying event or snapshot changes.
- `BWS118-R04-012-TEST-03` | category=evidence_or_artifact | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-012 | requirement=A consumer can validate accepted_local_evidence without an in-memory source object.
- `BWS118-R04-012-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-012 | requirement=Killed and incomplete candidates cannot appear equivalent to fully completed candidates.
- `BWS118-R04-013-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-013 | requirement=null, object, string, sparse array, null observation, missing candidateId, and non-string candidateId return blockers without throwing.
- `BWS118-R04-013-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-013 | requirement=Valid accepted and blocked observations remain unchanged.
- `BWS118-R04-013-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-013 | requirement=Batch runner continues after one malformed report input where policy permits.
- `BWS118-R04-014-TEST-01` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-014 | requirement=Status-referenced entrypoint accepts a genuine partial fill and returns a partial state.
- `BWS118-R04-014-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-014 | requirement=Renaming/removing the implementation causes the validator to fail.
- `BWS118-R04-014-TEST-03` | category=security_or_confinement | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-014 | requirement=No marker-only test can pass without invoking the production path.

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS118-R04-009-TEST-01` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-009 | requirement=Fully filled and incomplete-in-limit candidates produce different report states and counters.
- `BWS118-R04-009-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-009 | requirement=Rejected/timed-out leg details survive report serialization and hashing.
- `BWS118-R04-009-TEST-03` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-009 | requirement=Acceptance gates do not count incomplete candidates as filled.
- `BWS118-R04-009-TEST-04` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-009 | requirement=Blocked, incomplete, settled, and fully filled states remain mutually exclusive.
- `BWS118-R04-010-TEST-01` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-010 | requirement=Gross, stake, net, fillability, and settlement failures each appear in stage counts.
- `BWS118-R04-010-TEST-02` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-010 | requirement=Blocked/unknown settlements cannot reduce the accepted-outcome false-positive rate silently.
- `BWS118-R04-010-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-010 | requirement=End-to-end denominator equals unique derived candidates.
- `BWS118-R04-010-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-010 | requirement=Duplicate candidate IDs and reordered observations do not alter counts.
- `BWS118-R04-011-TEST-01` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-011 | requirement=Multiple venue pairs for one market count as one market and multiple candidates.
- `BWS118-R04-011-TEST-02` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-011 | requirement=Same market across duplicate rows remains one market.
- `BWS118-R04-011-TEST-03` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-011 | requirement=Distinct markets on one event count separately.
- `BWS118-R04-011-TEST-04` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-011 | requirement=Runtime threshold test proves candidate multiplication cannot satisfy market coverage.
- `BWS118-R04-012-TEST-01` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-012 | requirement=Per-leg terminal and quantity state survives backtest/private report generation.
- `BWS118-R04-012-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-012 | requirement=Report digest changes when any underlying event or snapshot changes.
- `BWS118-R04-012-TEST-03` | category=evidence_or_artifact | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-012 | requirement=A consumer can validate accepted_local_evidence without an in-memory source object.
- `BWS118-R04-012-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-012 | requirement=Killed and incomplete candidates cannot appear equivalent to fully completed candidates.
- `BWS118-R04-013-TEST-01` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-013 | requirement=null, object, string, sparse array, null observation, missing candidateId, and non-string candidateId return blockers without throwing.
- `BWS118-R04-013-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-013 | requirement=Valid accepted and blocked observations remain unchanged.
- `BWS118-R04-013-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-013 | requirement=Batch runner continues after one malformed report input where policy permits.
- `BWS118-R04-014-TEST-01` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-014 | requirement=Status-referenced entrypoint accepts a genuine partial fill and returns a partial state.
- `BWS118-R04-014-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-014 | requirement=Renaming/removing the implementation causes the validator to fail.
- `BWS118-R04-014-TEST-03` | category=security_or_confinement | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-014 | requirement=No marker-only test can pass without invoking the production path.

## Negative and adversarial tests

- `BWS118-R04-010-TEST-02` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-010 | requirement=Blocked/unknown settlements cannot reduce the accepted-outcome false-positive rate silently.
- `BWS118-R04-010-TEST-04` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-010 | requirement=Duplicate candidate IDs and reordered observations do not alter counts.
- `BWS118-R04-011-TEST-02` | category=simulation_or_economics | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-011 | requirement=Same market across duplicate rows remains one market.
- `BWS118-R04-013-TEST-03` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-013 | requirement=Batch runner continues after one malformed report input where policy permits.
- `BWS118-R04-014-TEST-02` | category=unit_or_contract | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-014 | requirement=Renaming/removing the implementation causes the validator to fail.
- `BWS118-R04-014-TEST-03` | category=security_or_confinement | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-014 | requirement=No marker-only test can pass without invoking the production path.

## Concurrency, cancellation, crash, and restart tests

- `BWS118-R04-012-TEST-01` | category=concurrency_or_ownership | environment=NODE20_AND_DISPOSABLE_LOCAL_DEPENDENCIES_AS_REQUIRED | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS118-R04-012 | requirement=Per-leg terminal and quantity state survives backtest/private report generation.

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

Acceptance authority: - Reports preserve leg/residual/terminal state

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W2-T18` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
