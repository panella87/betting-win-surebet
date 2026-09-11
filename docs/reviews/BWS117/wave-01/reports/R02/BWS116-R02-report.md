# BWS116-R02 deep review: surebet identity, quote validity, economics, and solver correctness

## Executive verdict

```text
review_id=BWS116-R02
repository=betting-win-surebet
archive=betting-win-surebet116.zip
archive_sha256=6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376
regular_files=618
package=betting-win-surebet@0.1.0-bws-full-platform
canonical_runtime=Node_20.20.2
canonical_runtime_available=false
supplementary_runtime=Node_22.16.0
verdict=BLOCKED_CORRECTNESS_REMEDIATION_REQUIRED
confirmed_findings=14
confirmed_P1=14
release_blocking=14
BWS_600_evidence_blocking=12
B1_acceptance_blocking=10
execution_authorized=false
```

The archive matches the required frozen BWS116 bytes and reconciles to 618 regular files. The review found **14 confirmed P1 strategy-contract defects**. The highest-risk defects permit semantically incomplete B1 outcome sets, mixed provider generations, asynchronous quote portfolios, detached quote-price mutation, and net-positive classification without authoritative quote/venue capacity. The generalized solver also rejects feasible two-way and three-way integer vectors.

The repository's no-live-operation boundary remains intact. Nothing in this review is profitability evidence, provider acceptance, BWS-600 evidence, B1 runtime acceptance, or execution authority.

## Archive, package, and mutation verdict

- Expected and actual SHA-256: `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`.
- ZIP members and regular files: `618`; duplicate paths `0`; unsafe paths `0`; symlinks `0`; special entries `0`.
- Package identity: `betting-win-surebet`, version `0.1.0-bws-full-platform`, Node engine `>=20 <21`.
- Both uploaded BWS116 copies are byte-identical. The newer BWS117 archive was not substituted.
- Extraction was rehashed after review: 618 expected, 618 actual, no missing, extra, or changed source members.
- Temporary harnesses and outputs were written under `/tmp/bws116-r02-review`, outside the extracted source tree.
- `SOURCE_MANIFEST.json` retains the known seven-path drift. It is recorded only as `KNOWN_BASELINE_MANIFEST_DRIFT`, owned by R11.

Canonical Node 20.20.2 was unavailable. Under Node 22.16.0, 18 focused files and 147 tests passed, with zero test failures. Those passes are supplementary only and demonstrably false-green for the adversarial cases below.

## Current state preserved

```text
current_task=BWS-600
current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
active_implementation_queue=none
broad_bugfix_campaign_status=COMPLETED_AND_ACCEPTED
bws710_status=BLOCKED_ACCEPTED_BETTING_WIN_B1_MULTI_VENUE_API_REQUIRED
bws900_execution_status=PARKED_NOT_AUTHORIZED
```

The historical 22-round bugfix completion proves only its former campaign scope. It does not prove current mathematical correctness.

## Public strategy architecture reconstructed

### Standard-binary same-venue lane

```text
BettingWinResourceRecord[]
  -> canonicalMarketId grouping
  -> exactly one identity + rule/finality context
  -> YES/NO quote assembly
  -> per-leg freshness
  -> scenario cash-flow terms
  -> capacity from availableSizeMinor
  -> rounding step currently derived from minStakeMinor
  -> two-leg integer stake solver
  -> scenario nets
```

The lane correctly distinguishes identity, rules, quote evidence, capacity, and scenario cash flows at a high level. Its quote-set coherence is incomplete: source-manifest identity and pairwise snapshot synchronization are not enforced; increment is not represented; and the exported matrix validator is weaker than its stated complete-matrix contract.

### B1 cross-venue lane

```text
B1MultiVenueMarketRow[]
  -> group by marketEquivalenceKey
  -> group by venueOrBookmakerId
  -> enumerate venue pairs
  -> compare 2/3-row outcome sets by selectionEquivalenceKey
  -> synchronize each selection's two venue quotes
  -> choose best decimal odds per terminal selection
  -> gross reciprocal sum
  -> caller-supplied min/max/step constraints
  -> common-target-payout generalized solver
  -> fee + age penalty + capital lock net evaluation
  -> fill/settlement simulation outside R02
```

The implementation carries rich provider, generation, source-lineage, evidence, time, capacity, and rule fields at row intake, but the pure strategy path drops or fails to bind several of them before acceptance.

## Identity composition conclusions

### Standard lane

The complete-set identity preserves canonical event/market, the identity record's provider generation, rule profile, result source, finality policy, and YES/NO legs. It does **not** prove that the two quote records share one source manifest or synchronized observation window. Candidate order also depends on host collation.

### B1 lane

The market comparator currently uses:

```text
marketEquivalenceKey
canonicalEventId
marketType
period
raw lineValue string
currency
settlementCompatibilityFlag
settlementRuleVersion
voidRuleId
selectionEquivalenceKey
outcomeSide
ordered venueOrBookmakerId pair
```

It does not bind providerId, providerGenerationId, sourceLineageId, normalizedEvidenceId, rawPayloadHash, or a candidate-global time window. Cardinality and unique keys are incorrectly treated as proof of an exhaustive terminal outcome space.

## Fixed-point, unit, and rounding inventory

| Domain | Field | Scale/unit | Representation | Review conclusion |
|---|---|---:|---|---|
| Standard price | `priceMinor` | 1,000,000 | bigint | payout=minStake + floor(minStake*price/1e6) |
| Standard money/capacity | `stake/fee/cost/availableSize` | currency minor units | bigint | increment missing; min stake reused as step |
| Standard freshness | `observedNowMs/age` | milliseconds | number | canonical ISO timestamp parsed through Date |
| B1 decimal odds | `decimalOddsMicro` | 1,000,000 | bigint | up to six decimal places |
| B1 implied probability/spread | `impliedProbabilityPpm/grossSpreadPpm` | 1,000,000 | bigint | ceil reciprocal is conservative |
| B1 money/capacity | `stake/payout/fee/penalty/capacity` | minor units | bigint | integer floor payout; explicit min/max/step in solver policy |
| B1 fees | `feeBps` | 10,000 bps denominator | bigint | ceil on stake plus fixed; basis defect in -014 |
| B1 quote age penalty | `age ms × bps/second` | 1,000 ms and 10,000 bps | bigint | ceil plus fixed |
| B1 capital lock | `durationMs/annualizedCostBps` | 365-day milliseconds and 10,000 bps | bigint | ceil after optional capital buffer |
| Search bound | `maxSearchIterations` | integer count 1..1000 | number | control only, not money |

No Number-versus-BigInt precision loss was found in the B1 monetary core. The critical defects are semantic binding, missing increment authority, incomplete feasibility search, and an under-specified fee basis rather than floating-point arithmetic.

## Optional, default, unknown, and sentinel inventory

- Standard `maxQuoteAgeMs` is optional and defaults to 60,000 ms. Direct-call authority for that default remains a hypothesis/handoff, not a confirmed defect.
- Standard quote currency includes `UNKNOWN`, which complete-set assembly rejects.
- B1 capacity permits an optional conservative proxy only when an explicit boolean policy enables it and a positive proxy value exists. The primitive itself fails closed; its lack of integration is finding -005.
- B1 settlement compatibility must equal `compatible`, and void-rule/version mismatches block.
- B1 fees, quote-age policy, capital-lock policy, and stake assumptions are required. Missing entries do not default to zero.
- B1 `knownCoverageGaps` and fixture markers remain non-runtime; BWS-710 is externally blocked.
- No bankroll, account, secret, signer, provider write, or live-execution value exists in the reviewed pure strategy surface.

## Required-question answers

| # | Question | Conclusion |
|---:|---|---|
| 1 | Can non-equivalent identities share one opportunity? | Yes. BWS116-R02-001, -002, -007, and -008 prove semantic, generation, tuple-key, and numeric-format identity failures. |
| 2 | Can viewpoint inversion create a false complete set? | Yes. Distinct keys with duplicated outcomeSide are accepted; canonical outcome-space complementarity is not proved. |
| 3 | Can stale/future/asynchronous/missing timestamps combine? | Future and individually stale rows block, but asynchronous cross-outcome B1 and YES/NO standard sets can combine. See -003 and -010. |
| 4 | Are units explicit and consistent? | Core B1 arithmetic is bigint with explicit micro/ppm/bps/ms scales, but standard increment is missing and B1 fee basis is under-specified. See -011 and -014. |
| 5 | Can unknown fees/capacity/lag/lock/rules default to acceptance? | Missing fee entries and malformed time policies block. Capacity/venue limits are not integrated, and unsupported fee bases can be misrepresented. See -005 and -014. |
| 6 | Are gross and net states distinct? | Yes as types, but net can consume detached quote values and unbound capacity. The labels are distinct while the evidence binding is not. |
| 7 | Does every accepted net candidate remain positive in every terminal scenario? | The encoded net function takes the minimum of its generated scenarios, but the terminal set itself may be semantically incomplete and fees/capacity may be wrong. Therefore the claim is not trustworthy. |
| 8 | Can rounding create false profit or budget excess? | No false-feasible vector was found in bounded oracle testing, but the solver is incomplete and returns false infeasibility. Increment provenance is also defective. |
| 9 | Are outputs feasible under min/max/increment/capacity? | Only under caller-provided constraints. Actual quote/venue capacity is not bound, and standard increment is fabricated from min stake. |
| 10 | Are two-way and three-way portfolios correct? | Both shapes are implemented, but both reproduce false-infeasible generalized-solver cases and can accept semantically invalid outcome sets. |
| 11 | Is output deterministic under permutations/environments? | Input sorting helps permutations, but localeCompare makes order environment-dependent. See -013. |
| 12 | Do tests independently verify mathematics? | No. All 147 focused tests pass under supplementary Node 22 while bounded independent harnesses reproduce 14 confirmed defects; key property/oracle cases are absent. |

## Confirmed findings summary

| ID | Severity | Title | Blocks |
|---|---|---|---|
| BWS116-R02-001 | P1 | B1 complete-set acceptance proves only key cardinality, not mutually exclusive and exhaustive outcome semantics | release, bws_600_evidence, b1_acceptance, later_execution |
| BWS116-R02-002 | P1 | B1 market grouping and venue-pair identity omit provider and provider-generation authority | release, bws_600_evidence, b1_acceptance, later_execution |
| BWS116-R02-003 | P1 | B1 synchronization is pair-local and can combine terminal outcomes outside the configured global quote window | release, bws_600_evidence, b1_acceptance, later_execution |
| BWS116-R02-004 | P1 | B1 net economics accepts selected odds that are not value-bound to synchronized quote evidence | release, bws_600_evidence, b1_acceptance, later_execution |
| BWS116-R02-005 | P1 | B1 integrated solver and net path is not bound to quote capacity or venue-limit decisions | release, bws_600_evidence, b1_acceptance, later_execution |
| BWS116-R02-006 | P1 | B1 generalized solver can reject feasible two-way and three-way integer stake vectors | release, bws_600_evidence, b1_acceptance, later_execution |
| BWS116-R02-007 | P1 | Unescaped delimiter-based composite keys collide for distinct B1 identities and constraints | release, bws_600_evidence, b1_acceptance, later_execution |
| BWS116-R02-008 | P1 | B1 line equivalence compares raw decimal text and rejects numerically identical markets | release, b1_acceptance, later_execution |
| BWS116-R02-009 | P1 | Standard-binary complete-set assembly can mix YES and NO quotes from different source manifests | release, bws_600_evidence, later_execution |
| BWS116-R02-010 | P1 | Standard-binary quote freshness is per leg and permits an asynchronous YES/NO snapshot | release, bws_600_evidence, later_execution |
| BWS116-R02-011 | P1 | Standard-binary quote contract omits stake increment and silently substitutes minimum stake as the rounding step | release, bws_600_evidence, later_execution |
| BWS116-R02-012 | P1 | Standard scenario cash-flow validator accepts incomplete and non-rectangular matrices | release, later_execution |
| BWS116-R02-013 | P1 | Locale-sensitive localeCompare calls make candidate, scenario, and solver ordering environment-dependent | release, bws_600_evidence, b1_acceptance, later_execution |
| BWS116-R02-014 | P1 | B1 fee matrix cannot represent scenario-conditional or non-stake fee bases accepted by its venue-type domain | release, bws_600_evidence, b1_acceptance, later_execution |

### BWS116-R02-001 — B1 complete-set acceptance proves only key cardinality, not mutually exclusive and exhaustive outcome semantics

**Severity:** P1
**Confidence:** 0.99
**Classification:** `CONFIRMED_FINDING`
**Primary owner:** R02

**Current source evidence**

- `packages/bootstrap/src/identity/b1-market-equivalence.ts`, `compareB1MarketOutcomeSetEquivalence / indexBySelectionEquivalence`, lines 141-235, SHA-256 `b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75`.
- `packages/bootstrap/src/identity/b1-market-equivalence.ts`, `indexBySelectionEquivalence`, lines 305-326, SHA-256 `b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75`.
- `packages/bootstrap/src/identity/b1-selection-equivalence.ts`, `compareB1SelectionEquivalence`, lines 15-51, SHA-256 `ac7dcc2ddf2d9bf660931b639e10b6659ffe90ec8115ab80b765884784bc0ae2`.
- `packages/bootstrap/src/scenarios/b1-terminal-scenario.ts`, `buildB1TerminalScenarios`, lines 15-52, SHA-256 `4f3ee12a400f4a034a177043213f785df2c6a60f33f8cdd85a84be652401b47c`.

**Preconditions**

- Two or three distinct selection-equivalence keys exist on each venue.
- The rows share market, rule, currency, and venue-pair fields accepted by the existing comparator.

**Trigger:** Supply two distinct selection keys whose outcomeSide values are both "home" on both venues, then derive the B1 candidate.

**Expected behavior:** A supported complete set must prove that its terminal outcomes are mutually exclusive, exhaustive, and mapped to the declared market shape, not merely count two or three distinct keys.

**Current behavior:** The comparator checks 2/3 cardinality, unique selection keys, and pairwise equality of each key/side across venues. It never checks within-set semantic complementarity or exhaustiveness. Terminal scenarios are then generated one per key.

**Impact:** A duplicated or overlapping semantic outcome set can be treated as complete, allowing gross and net calculations over a portfolio that does not cover every terminal result.

**Independent evidence:** The inert harness passed two unique selections with sides [home, home]; outcome-set equivalence returned ok=true and gross derivation emitted one accepted candidate.

**Reproduction:** `REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY`.

**Root cause:** Outcome-set validity is represented as cardinality plus key uniqueness; canonical market-shape semantics are absent from the B1 complete-set gate.

**Minimal fix boundary:** Add an R02-owned market-shape outcome-set validator at the equivalence/terminal-scenario boundary. It must consume authoritative canonical outcome semantics and fail closed before quote selection. Do not change upstream canonical identity production.

**Required tests**

- Two-way home/home, away/away, yes/yes, no/no, over/over, under/under rejection tests.
- Three-way duplicate-side and missing-draw tests.
- Permutation/property tests proving exactly one terminal winner per valid market shape.

**Regression risks**

- Overly label-based fixes could reject legitimate provider aliases.
- Changes must preserve canonical selection-equivalence authority and not invent local identity.

**Secondary sectors:** R01 upstream canonical outcome authority, R04 residual/settlement simulation consumers, R11 aggregate false-green tests.

**Aliases/dependencies:** none.

**Explicitly unchanged areas**

- Upstream event/market identity generation
- Persistence and worker lifecycle
- Fill/rejection/settlement replay implementation

**Blocking effect:** release=yes, bws_600_evidence=yes, b1_acceptance=yes, later_execution=yes.

### BWS116-R02-002 — B1 market grouping and venue-pair identity omit provider and provider-generation authority

**Severity:** P1
**Confidence:** 0.99
**Classification:** `CONFIRMED_FINDING`
**Primary owner:** R02

**Current source evidence**

- `packages/bootstrap/src/contracts/b1-local-types.ts`, `B1MultiVenueMarketRow provider identity fields`, lines 30-70, SHA-256 `22a43ced9a713e4144e343529a8940edfa00676659aa01f48f739e3f28ca03e1`.
- `packages/bootstrap/src/identity/b1-market-equivalence.ts`, `compareB1MarketEquivalence`, lines 43-139, SHA-256 `b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75`.
- `packages/bootstrap/src/identity/b1-market-equivalence.ts`, `compareB1MarketOutcomeSetEquivalence`, lines 141-235, SHA-256 `b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75`.
- `packages/bootstrap/src/identity/b1-venue-pair-key.ts`, `createB1VenuePairKey`, lines 14-50, SHA-256 `3c1f4864a055c479d758ec070804a285aa1441ad7b14418061039d45d44517fa`.
- `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts`, `groupRowsByMarketEquivalence / groupRowsByVenue`, lines 318-359, SHA-256 `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543`.
- `packages/bootstrap/src/opportunity/b1-gross-spread.ts`, `B1GrossQuoteInput / B1GrossQuoteContribution`, lines 10-26, SHA-256 `48ecd0e6402a23610f9582222e86e31c943948f31b6edf0896a66751edfddafb`.

**Preconditions**

- Rows reuse the same market-equivalence key and venue ID strings.
- Provider or provider-generation IDs differ across the compared rows or terminal outcomes.

**Trigger:** Combine rows from generation-001 and generation-002 while holding market key, venue IDs, rules, and selection keys constant.

**Expected behavior:** Every compared quote set must preserve and verify compatible provider ID and provider-generation identity, and the selected quote evidence must retain that authority.

**Current behavior:** ProviderId and providerGenerationId are present on input rows but are not compared by the market/outcome-set equivalence functions, are not part of the venue-pair key or grouping keys, and are dropped from selected quote contributions.

**Impact:** Historical/current generations or same-named venues from different providers can be merged into one candidate, while downstream economic records cannot identify the selected generation.

**Independent evidence:** The inert harness accepted an outcome set containing generation-001 and generation-002. The selected quote objects contained no providerId, providerGenerationId, lineage ID, evidence ID, or raw-payload hash.

**Reproduction:** `REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY`.

**Root cause:** The B1 local row contract carries provider authority, but the R02 identity composition narrows to market key plus venue string and strips generation evidence at quote selection.

**Minimal fix boundary:** Extend R02 equivalence, grouping, venue identity, and selected-quote contracts to bind provider and generation. Any definition of compatible cross-generation equivalence is an explicit R01 handoff and must not default to compatibility.

**Required tests**

- Mixed-provider and mixed-generation rejection tests.
- Same venue ID under different providers collision tests.
- Selected quote evidence retention tests.
- Permutation tests across generation partitions.

**Regression risks**

- Changing candidate identity may affect persisted keys and report joins owned by R03/R05.
- Do not rewrite upstream provider-generation semantics locally.

**Secondary sectors:** R01 upstream contract/provenance, R03 persisted candidate identity, R05 API/report projections, R11 validators.

**Aliases/dependencies:** none.

**Explicitly unchanged areas**

- Upstream provider-generation production
- External API currentness gate
- Execution remains prohibited

**Blocking effect:** release=yes, bws_600_evidence=yes, b1_acceptance=yes, later_execution=yes.

### BWS116-R02-003 — B1 synchronization is pair-local and can combine terminal outcomes outside the configured global quote window

**Severity:** P1
**Confidence:** 0.99
**Classification:** `CONFIRMED_FINDING`
**Primary owner:** R02

**Current source evidence**

- `packages/bootstrap/src/quotes/b1-quote-synchronization.ts`, `synchronizeB1VenueQuotePair`, lines 41-86, SHA-256 `4746d1bd364a7389a95b4aa912e66f66041c44fc51083dcd02a12e9ad1fa9bde`.
- `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts`, `deriveVenuePairGrossCandidate`, lines 166-216, SHA-256 `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543`.
- `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts`, `acceptedCandidate`, lines 238-273, SHA-256 `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543`.
- `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts`, `maxComparisonWindow`, lines 437-445, SHA-256 `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543`.

**Preconditions**

- Each selection has one quote per venue and each pair is internally synchronized.
- Different terminal selections come from materially different snapshot times.

**Trigger:** Use two outcome pairs with zero intra-pair skew but a 10,000 ms skew between the selected outcomes under maxComparisonWindowMs=100.

**Expected behavior:** The complete selected terminal-outcome portfolio must be inside one explicit synchronization window, and the reported window must represent the actual selected-quote span.

**Current behavior:** The code validates each selection pair separately, then reports the maximum intra-pair delta. It never compares selected quote timestamps across terminal outcomes and takes comparisonTimeUtc from the first pair.

**Impact:** A candidate can combine asynchronous terminal prices and report maxComparisonWindowMs=0 even though the selected portfolio spans seconds, creating stale-combination false positives.

**Independent evidence:** Harness result: configured window 100 ms; pair windows [0,0]; selected-outcome snapshot span 10,000 ms; candidate accepted and reported window 0 ms.

**Reproduction:** `REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY`.

**Root cause:** Synchronization scope is selection-pair local rather than candidate-global.

**Minimal fix boundary:** After best-quote selection, compute and enforce one candidate-global min/max snapshot span and bind comparison time/age evidence to every selected quote.

**Required tests**

- Two- and three-way cross-outcome skew tests.
- Boundary tests at window-1, window, and window+1.
- Permutation tests proving identical global span and decision.

**Regression risks**

- A global gate can reduce candidate counts; metrics and fixtures must be updated truthfully.
- Do not replace source time with retrieval time.

**Secondary sectors:** R01 source-time authority, R04 backtest currentness interpretation, R07 evidence reporting, R11 false-green tests.

**Aliases/dependencies:** none.

**Explicitly unchanged areas**

- Per-row future and age validation
- Provider intake timing semantics
- Runtime scheduler behavior

**Blocking effect:** release=yes, bws_600_evidence=yes, b1_acceptance=yes, later_execution=yes.

### BWS116-R02-004 — B1 net economics accepts selected odds that are not value-bound to synchronized quote evidence

**Severity:** P1
**Confidence:** 0.99
**Classification:** `CONFIRMED_FINDING`
**Primary owner:** R02

**Current source evidence**

- `packages/bootstrap/src/opportunity/b1-gross-spread.ts`, `B1GrossQuoteContribution`, lines 18-26, SHA-256 `48ecd0e6402a23610f9582222e86e31c943948f31b6edf0896a66751edfddafb`.
- `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts`, `selected quote projection`, lines 210-216, SHA-256 `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543`.
- `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts`, `acceptedCandidate selectedQuotes/synchronizedQuotePairs`, lines 252-272, SHA-256 `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543`.
- `packages/bootstrap/src/economics/b1-net-spread.ts`, `evaluateB1NetEconomics`, lines 119-167, SHA-256 `0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b`.
- `packages/bootstrap/src/economics/b1-net-spread.ts`, `validateAcceptedB1GrossCandidateShape / findSelectedSynchronizedQuote`, lines 275-369, SHA-256 `0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b`.

**Preconditions**

- A structurally accepted gross candidate is supplied to the public net-economics function.
- selectedQuotes contains the same selection and venue keys as a synchronized row but different odds or outcome values.

**Trigger:** Replace selectedQuotes decimalOddsMicro values 2,200,000 with 3,000,000 while leaving synchronized source rows at 2.18/2.20.

**Expected behavior:** Net payout values must be derived from, or exactly value-bound to, the synchronized source row selected during gross derivation.

**Current behavior:** Shape validation checks selected quote field types. findSelectedSynchronizedQuote matches only selectionEquivalenceKey and venueOrBookmakerId. Net payout then uses the detached selected quote decimalOddsMicro without comparing it to synchronized row odds or source evidence.

**Impact:** A forged, stale, or accidentally recomputed selected quote can inflate payout and pass positive worst-case net while the retained synchronization evidence proves different prices.

**Independent evidence:** The harness changed only detached selectedQuotes odds to 3.0; synchronized rows stayed 2.18/2.20; evaluateB1NetEconomics returned ok=true with worstCaseNetMinor=100.

**Reproduction:** `REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY`.

**Root cause:** The accepted-gross contract duplicates economic values without an immutable value/evidence binding, and the net gate verifies identity keys only.

**Minimal fix boundary:** Derive net odds directly from the matched synchronized row or bind selected quote values to an immutable row/evidence digest and verify all value, provider-generation, time, side, and outcome fields.

**Required tests**

- Detached-odds mutation rejection.
- OutcomeName/outcomeSide mutation rejection.
- Provider-generation/evidence/time mutation rejection.
- Exact derivation-to-net round-trip tests.

**Regression risks**

- Contract changes affect test builders and downstream report serializers.
- Avoid trusting caller-provided digests without recomputation.

**Secondary sectors:** R01 provenance binding, R03 stored gross candidate immutability, R11 contract mutation tests.

**Aliases/dependencies:** none.

**Explicitly unchanged areas**

- Gross reciprocal formula
- Fee and capital-lock arithmetic
- Runtime execution path

**Blocking effect:** release=yes, bws_600_evidence=yes, b1_acceptance=yes, later_execution=yes.

### BWS116-R02-005 — B1 integrated solver and net path is not bound to quote capacity or venue-limit decisions

**Severity:** P1
**Confidence:** 0.99
**Classification:** `CONFIRMED_FINDING`
**Primary owner:** R02

**Current source evidence**

- `packages/bootstrap/src/quotes/b1-capacity-model.ts`, `B1CapacityPolicy / B1CapacityDecision / evaluateB1QuoteCapacity`, lines 11-31, SHA-256 `6a98bd374fff19cd414d04fc3410ad944b234043733d8f258a383537e0a28617`.
- `packages/bootstrap/src/quotes/b1-capacity-model.ts`, `capacity enforcement`, lines 70-118, SHA-256 `6a98bd374fff19cd414d04fc3410ad944b234043733d8f258a383537e0a28617`.
- `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts`, `B1GeneralizedStakeVectorPolicy`, lines 28-41, SHA-256 `822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0`.
- `packages/bootstrap/src/economics/b1-net-spread.ts`, `B1NetEconomicsPolicy / evaluateB1NetEconomics`, lines 31-41, SHA-256 `0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b`.
- `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts`, `B1CrossVenueBacktestPlan`, lines 20-29, SHA-256 `b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4`.
- `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts`, `runCandidateBacktest`, lines 387-400, SHA-256 `b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4`.

**Preconditions**

- Input rows contain availableSizeMinor and venue-limit models exist.
- A caller supplies legConstraints whose maxStakeMinor exceeds the authoritative quote/venue capacity.

**Trigger:** Solve/evaluate stakes of 100 minor units for a selected quote whose availableSizeMinor is 1, without invoking the separate capacity primitive.

**Expected behavior:** Every accepted stake and net candidate must be derived from explicit capacity and venue-limit decisions bound to the selected source rows.

**Current behavior:** The backtest plan accepts caller-authored solver constraints and no capacity/venue-limit evidence. The solver and net evaluator never invoke evaluateB1QuoteCapacity. The standalone capacity primitive is used only in focused unit tests.

**Impact:** A candidate can be labeled net-positive despite being unfillable at the quote depth or violating the venue cap; capacity and limit blocker counts can be false.

**Independent evidence:** Harness result: net evaluation accepted stake 100 with worstCaseNetMinor=20 against selected availableSizeMinor=1. Calling evaluateB1QuoteCapacity on the same row correctly returned B1_CAPACITY_OR_LIMIT_INSUFFICIENT.

**Reproduction:** `REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY`.

**Root cause:** Capacity and venue-limit validation are disconnected primitives rather than authoritative inputs to stake-policy construction and net acceptance.

**Minimal fix boundary:** Introduce one R02 integration boundary that derives each leg max/min/step from selected quote capacity plus normalized venue limits and carries the resulting decisions through solver and net acceptance. Persistence changes belong to R03.

**Required tests**

- End-to-end quote-depth-to-solver constraint tests.
- Stake above quote, venue, market, and portfolio cap rejection tests.
- Missing capacity/proxy and missing venue-limit tests.
- Capacity changes after selection must invalidate the candidate.

**Regression risks**

- Existing backtest plans and fixtures contain synthetic max values and will need explicit evidence.
- Do not allow an operator cap to exceed observed depth.

**Secondary sectors:** R03 capacity evidence persistence, R04 fillability simulation, R07 acceptance metrics, R11 integration validators.

**Aliases/dependencies:** none.

**Explicitly unchanged areas**

- Standalone capacity arithmetic
- Venue-limit normalization
- Fill/rejection lifecycle after stake acceptance

**Blocking effect:** release=yes, bws_600_evidence=yes, b1_acceptance=yes, later_execution=yes.

### BWS116-R02-006 — B1 generalized solver can reject feasible two-way and three-way integer stake vectors

**Severity:** P1
**Confidence:** 0.99
**Classification:** `CONFIRMED_FINDING`
**Primary owner:** R02

**Current source evidence**

- `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts`, `solveB1GeneralizedStakeVector target search`, lines 147-225, SHA-256 `822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0`.
- `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts`, `initialTargetPayout / maxTargetPayout`, lines 349-380, SHA-256 `822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0`.
- `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts`, `buildStakesForTargetPayout`, lines 382-445, SHA-256 `822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0`.
- `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts`, `calculateScenarioNets`, lines 447-469, SHA-256 `822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0`.

**Preconditions**

- A feasible vector exists under per-leg min, max, and step constraints.
- Feasibility requires unequal terminal payouts after integer rounding.

**Trigger:** Two-way: odds [1.5,4.0], caps [(1,2,1),(1,1,1)], target worst-case 0. Three-way: odds [2.5,2.5,6.0], caps [(1,2,1),(1,2,1),(1,1,1)], target 0.

**Expected behavior:** The solver must return any deterministic feasible integer vector satisfying min/max/step and target worst-case net, even when terminal payouts are unequal.

**Current behavior:** The algorithm searches a single common target payout and rounds every leg up to reach it. If one leg cannot reach that common target it returns CAPACITY_EXHAUSTED without exploring feasible unequal-payout vectors.

**Impact:** Valid candidates can be falsely classified infeasible, suppressing B1 observations and distorting falsification, capacity, and conversion metrics.

**Independent evidence:** Independent exhaustive enumeration found [2,1] with payouts [3,4], nets [0,1], and [2,2,1] with payouts [5,5,6], nets [0,0,1]. The production function returned B1_STAKE_VECTOR_CAPACITY_EXHAUSTED for both. The two-way oracle examined 1,317 cases before the retained sample; the three-way oracle examined 12,163 cases and found no false-feasible result in its domain.

**Reproduction:** `REPRODUCED_BY_INDEPENDENT_PYTHON_ORACLE_AND_PRODUCTION_NODE22_SUPPLEMENTARY`.

**Root cause:** Common-target-payout construction is used as if it were a complete feasibility search, but it is only one sufficient family of vectors.

**Minimal fix boundary:** Replace or augment the R02 search with a complete bounded integer feasibility/optimization method for the declared two- and three-leg domains. Preserve deterministic objective and explicit search bounds.

**Required tests**

- Brute-force oracle comparison over small domains for 2-way and 3-way cases.
- Unequal payout feasibility cases.
- Positive target-net, one-unit residual, tight cap, and non-unit step cases.
- Metamorphic scaling and permutation tests.
- Proof that returned vectors satisfy all constraints.

**Regression risks**

- A complete search may cost more; bounds and failure typing must remain explicit.
- Changing objective/tie-breaking can alter historical fixtures and reports.

**Secondary sectors:** R04 backtest classification, R07 falsification metrics, R11 property-test coverage.

**Aliases/dependencies:** none.

**Explicitly unchanged areas**

- Scenario payout formula
- Capacity evidence integration finding BWS116-R02-005
- Live execution remains parked

**Blocking effect:** release=yes, bws_600_evidence=yes, b1_acceptance=yes, later_execution=yes.

### BWS116-R02-007 — Unescaped delimiter-based composite keys collide for distinct B1 identities and constraints

**Severity:** P1
**Confidence:** 0.99
**Classification:** `CONFIRMED_FINDING`
**Primary owner:** R02

**Current source evidence**

- `packages/bootstrap/src/identity/b1-venue-pair-key.ts`, `createB1VenuePairKey`, lines 35-50, SHA-256 `3c1f4864a055c479d758ec070804a285aa1441ad7b14418061039d45d44517fa`.
- `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts`, `buildCandidateId / buildVenuePairKeyForRows`, lines 376-405, SHA-256 `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543`.
- `packages/bootstrap/src/economics/b1-fee-matrix.ts`, `normalizeB1FeeMatrix duplicate key`, lines 102-117, SHA-256 `081e148be8c1e3ffce089cca44c14cb16fa94ee25ae06a320d422b23e9e37175`.
- `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts`, `constraint-key construction and duplicate detection`, lines 292-326, SHA-256 `822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0`.
- `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts`, `buildConstraintKey`, lines 512-514, SHA-256 `822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0`.
- `packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts`, `buildB1ScenarioLegKey`, lines 400-402, SHA-256 `f48a4d0f697fcc2d9d48328ef665689807f3f97d6c74fbcba67b01520293a580`.

**Preconditions**

- Provider-controlled or canonical string components may contain the chosen delimiter.
- No reserved-character validation or length-prefix encoding is applied.

**Trigger:** Construct venue tuples ("a", "b::c") and ("a::b", "c"), or fee tuples split around a NUL character.

**Expected behavior:** Distinct typed tuples must have distinct deterministic encodings for keys, duplicate checks, candidate IDs, and scenario legs.

**Current behavior:** Keys are built by raw concatenation with ::, |, or NUL. Input validation requires non-empty strings but permits these delimiter characters.

**Impact:** Distinct venues/selections can alias, causing candidate identity collisions, false duplicate rejection, incorrect joins, or scenario-leg overwrites.

**Independent evidence:** Harness result: both venue tuples produced a::b::c. Two distinct fee tuples collapsed to one NUL-delimited key and were rejected as B1_FEE_MATRIX_DUPLICATE_ENTRY.

**Reproduction:** `REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY`.

**Root cause:** Composite identity uses ambiguous delimiter serialization instead of a canonical injective tuple encoding.

**Minimal fix boundary:** Use one canonical structured/length-prefixed tuple encoder for all R02 keys or reject reserved characters at the authoritative parser. Coordinate persisted-key migrations with R03 rather than changing storage silently.

**Required tests**

- Delimiter injection for every key constructor.
- Round-trip/injectivity property tests over Unicode and control characters.
- Cross-module consistency tests for candidate, constraint, fee, and scenario keys.

**Regression risks**

- Changing key encoding affects persisted records, fixtures, and APIs.
- Unicode normalization policy must be explicit rather than incidental.

**Secondary sectors:** R01 input character contract, R03 persisted key migration, R05 API identifiers, R11 property tests.

**Aliases/dependencies:** none.

**Explicitly unchanged areas**

- Canonical upstream IDs themselves
- Provider connectivity
- Economic formulas

**Blocking effect:** release=yes, bws_600_evidence=yes, b1_acceptance=yes, later_execution=yes.

### BWS116-R02-008 — B1 line equivalence compares raw decimal text and rejects numerically identical markets

**Severity:** P1
**Confidence:** 0.99
**Classification:** `CONFIRMED_FINDING`
**Primary owner:** R02

**Current source evidence**

- `packages/bootstrap/src/contracts/betting-win-b1-resource-records.ts`, `line_value parse`, lines 386-397, SHA-256 `2068f5dea3a115cbbc4e7b7fde16774b9a0fc9c964be1550215cc2c7508604e8`.
- `packages/bootstrap/src/contracts/betting-win-b1-resource-records.ts`, `requireSignedDecimalString`, lines 611-620, SHA-256 `2068f5dea3a115cbbc4e7b7fde16774b9a0fc9c964be1550215cc2c7508604e8`.
- `packages/bootstrap/src/identity/b1-market-equivalence.ts`, `compareB1MarketEquivalence line comparison`, lines 82-87, SHA-256 `b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75`.
- `packages/bootstrap/src/identity/b1-market-equivalence.ts`, `compareOutcomeSetMarketContext line comparison`, lines 274-279, SHA-256 `b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75`.

**Preconditions**

- Equivalent upstream rows encode the same numeric line with different valid decimal text, such as "1" and "1.0" or "-0" and "0".

**Trigger:** Compare otherwise identical spread/total rows using lineValue "1" and "1.0".

**Expected behavior:** Line equality must use one canonical fixed-point numeric representation with explicit scale and sign normalization.

**Current behavior:** The parser validates syntax but preserves raw text; equivalence uses strict string equality.

**Impact:** Equivalent markets are falsely blocked, reducing coverage and making results dependent on upstream formatting rather than value.

**Independent evidence:** The inert harness returned B1_LINE_VALUE_MISMATCH for "1" versus "1.0".

**Reproduction:** `REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY`.

**Root cause:** No canonical numeric line representation is established before identity comparison.

**Minimal fix boundary:** Normalize line values to a bounded signed fixed-point tuple at intake or R02 comparison. R01 owns any upstream contract change; R02 owns numeric equality and key consumption.

**Required tests**

- Equivalent textual forms tests.
- Negative-zero normalization.
- Scale/precision overflow and unsupported precision tests.
- Spread sign/viewpoint inversion tests.

**Regression risks**

- Incorrect sign normalization can merge opposite spread viewpoints.
- Canonical scale changes can affect persisted keys.

**Secondary sectors:** R01 upstream line contract, R09-equivalent numeric semantics within BWS scope, R03 key persistence.

**Aliases/dependencies:** none.

**Explicitly unchanged areas**

- Market type/period/rule checks
- Raw upstream archival bytes
- Settlement replay

**Blocking effect:** release=yes, bws_600_evidence=no, b1_acceptance=yes, later_execution=yes.

### BWS116-R02-009 — Standard-binary complete-set assembly can mix YES and NO quotes from different source manifests

**Severity:** P1
**Confidence:** 0.99
**Classification:** `CONFIRMED_FINDING`
**Primary owner:** R02

**Current source evidence**

- `packages/bootstrap/src/contracts/betting-win-resource-records.ts`, `BettingWinQuoteRecord`, lines 31-40, SHA-256 `8ca3a040b691242eb1025ab74f545157c1072b85332fdc1313924e57396c6903`.
- `packages/bootstrap/src/scenarios/complete-set.ts`, `quote assembly and acceptance`, lines 112-184, SHA-256 `bdea2ee4db048e553d69f379ab4599c28bae68e372b2821bacb2a64611c98bac`.

**Preconditions**

- One identity/rule record exists for a standard-binary market.
- YES and NO quote records share canonicalMarketId and currency but have different quoteSourceManifestHash values.

**Trigger:** Assemble a complete set with manifest hash a...a for YES and b...b for NO.

**Expected behavior:** All legs in one complete-set snapshot must be bound to one compatible source manifest or an explicit multi-source synchronization/provenance receipt.

**Current behavior:** The quote contract carries quoteSourceManifestHash, but assembly checks only market ID, outcome uniqueness, and currency. The accepted complete set does not expose a quote-manifest identity.

**Impact:** Quotes from different snapshots or source lineages can be combined into a false complete set while the output advertises only the identity-record provider generation.

**Independent evidence:** Harness result: mixed 64-byte manifest hashes were accepted; output providerGeneration remained generation-s and did not disclose the mixed quote sources.

**Reproduction:** `REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY`.

**Root cause:** Quote provenance is available but omitted from complete-set coherence and output identity.

**Minimal fix boundary:** Require exact compatible quote-manifest binding during standard complete-set assembly and retain the accepted source identity in the complete-set contract.

**Required tests**

- Mixed-manifest rejection.
- Missing/unknown manifest rejection.
- Single-manifest round trip.
- Explicit synchronization receipt path only if separately authorized.

**Regression risks**

- Historical fixture bundles may intentionally contain multiple manifests and will need explicit partitioning.
- Do not infer compatibility from provider generation alone.

**Secondary sectors:** R01 upstream provenance, R03 stored standard candidate identity, R11 fixture integrity.

**Aliases/dependencies:** none.

**Explicitly unchanged areas**

- Rule and settlement identity checks
- B1 generation finding BWS116-R02-002
- Runtime API access

**Blocking effect:** release=yes, bws_600_evidence=yes, b1_acceptance=no, later_execution=yes.

### BWS116-R02-010 — Standard-binary quote freshness is per leg and permits an asynchronous YES/NO snapshot

**Severity:** P1
**Confidence:** 0.99
**Classification:** `CONFIRMED_FINDING`
**Primary owner:** R02

**Current source evidence**

- `packages/bootstrap/src/opportunity/standard-binary-stake-solver.ts`, `StandardBinaryStakeVectorSolveOptions / freshness default`, lines 13-45, SHA-256 `a68d4ea89b2ec4a7d83d8e2ced929732522e0e4af5a36efaac4712e88255dc92`.
- `packages/bootstrap/src/opportunity/standard-binary-stake-solver.ts`, `validateCompleteSetQuoteFreshness`, lines 110-124, SHA-256 `a68d4ea89b2ec4a7d83d8e2ced929732522e0e4af5a36efaac4712e88255dc92`.
- `packages/bootstrap/src/quotes/quote-freshness.ts`, `checkQuoteFreshness`, lines 10-33, SHA-256 `38a0042d488084145e2438fe30d9e5b0ed665733af97b561587ca78d5bb9718f`.

**Preconditions**

- Both quote timestamps are individually inside maxQuoteAgeMs.
- Their mutual snapshot distance is large enough to invalidate simultaneous arbitrage.

**Trigger:** Evaluate one quote aged 59,999 ms and one current quote under a 60,000 ms age threshold.

**Expected behavior:** The two terminal quotes must satisfy an explicit same-snapshot or bounded pairwise synchronization rule in addition to individual freshness.

**Current behavior:** The standard solver checks each quote independently against observedNowMs and never compares the two observedAt timestamps.

**Impact:** Non-simultaneous YES/NO prices can be combined, creating false gross/stake feasibility and misleading paper results.

**Independent evidence:** Harness result: the pair spanning 59,999 ms was accepted; no pairwise synchronization policy exists in the standard input.

**Reproduction:** `REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY`.

**Root cause:** Freshness and synchronization are conflated; only age-to-now is modeled.

**Minimal fix boundary:** Add an explicit standard-binary pair synchronization bound and report actual snapshot span. Preserve individual freshness as a separate check.

**Required tests**

- Pair-skew boundary tests.
- Individually fresh but mutually stale rejection.
- Same manifest with divergent timestamps.
- Permutation invariance.

**Regression risks**

- Candidate counts will decline when asynchronous snapshots are rejected.
- Do not reuse the B1 pair primitive without reconciling standard source semantics.

**Secondary sectors:** R01 source-time authority, R04 standard backtest timing, R11 test coverage.

**Aliases/dependencies:** none.

**Explicitly unchanged areas**

- Canonical timestamp parsing
- Individual future/stale rejection
- B1 global synchronization finding BWS116-R02-003

**Blocking effect:** release=yes, bws_600_evidence=yes, b1_acceptance=no, later_execution=yes.

### BWS116-R02-011 — Standard-binary quote contract omits stake increment and silently substitutes minimum stake as the rounding step

**Severity:** P1
**Confidence:** 0.99
**Classification:** `CONFIRMED_FINDING`
**Primary owner:** R02

**Current source evidence**

- `packages/bootstrap/src/contracts/betting-win-resource-records.ts`, `BettingWinQuoteRecord`, lines 31-40, SHA-256 `8ca3a040b691242eb1025ab74f545157c1072b85332fdc1313924e57396c6903`.
- `packages/bootstrap/src/opportunity/standard-binary-stake-solver.ts`, `deriveRoundingConstraints`, lines 209-238, SHA-256 `a68d4ea89b2ec4a7d83d8e2ced929732522e0e4af5a36efaac4712e88255dc92`.
- `packages/bootstrap/src/solver/stake-vector.ts`, `StakeVectorRoundingConstraint`, lines 5-14, SHA-256 `d5022b515bbac8672ed337933887276d590424c89b75c3e5acd290f3a5561029`.

**Preconditions**

- Venue minimum stake and increment differ, which is common for executable constraints.
- The quote record supplies minStakeMinor but no increment field.

**Trigger:** Build the standard stake-vector input for quotes with minStakeMinor=10; the derived step is automatically 10 regardless of the actual venue increment.

**Expected behavior:** Minimum stake, maximum/depth, and increment must be independent explicit values bound to quote/venue authority.

**Current behavior:** The standard quote type has no increment. deriveRoundingConstraints sets stepMinor equal to minStakeMinor and describes the minimum as a rounding step.

**Impact:** The solver can reject feasible stakes, accept invalid increments, or compute the wrong vector whenever min and step differ.

**Independent evidence:** Harness result: both derived steps were 10 solely because minStakeMinor was 10; the quote object had no explicit step field.

**Reproduction:** `REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY`.

**Root cause:** The standard data contract collapses two independent venue constraints into one field.

**Minimal fix boundary:** Extend the standard quote/depth contract with an explicit bounded increment and derive rounding constraints from it. Upstream schema ownership is an R01 handoff; solver consumption is R02.

**Required tests**

- min != step cases.
- min not divisible by step cases.
- step greater/less than min.
- Capacity boundary after rounding.
- Missing increment fail-closed test.

**Regression risks**

- Schema and fixture changes cross the upstream contract boundary.
- The increment origin convention must be explicit.

**Secondary sectors:** R01 upstream quote contract, R03 persisted quote schema, R11 fixture/test updates.

**Aliases/dependencies:** none.

**Explicitly unchanged areas**

- Available-size capacity calculation
- B1 explicit stakeStepMinor contract
- No-live-operation boundary

**Blocking effect:** release=yes, bws_600_evidence=yes, b1_acceptance=no, later_execution=yes.

### BWS116-R02-012 — Standard scenario cash-flow validator accepts incomplete and non-rectangular matrices

**Severity:** P1
**Confidence:** 0.99
**Classification:** `CONFIRMED_FINDING`
**Primary owner:** R02

**Current source evidence**

- `packages/bootstrap/src/scenarios/scenario-cashflow.ts`, `validateScenarioCashflowMatrix`, lines 15-62, SHA-256 `11c1608a8d1cb5341f6125b9a30af4afd7c22aac64e228545636446b38476228`.
- `packages/bootstrap/src/scenarios/scenario-cashflow.ts`, `validateScenarioCoverage`, lines 218-240, SHA-256 `11c1608a8d1cb5341f6125b9a30af4afd7c22aac64e228545636446b38476228`.
- `packages/bootstrap/src/solver/stake-vector.ts`, `solver post-validation shape checks`, lines 73-88, SHA-256 `d5022b515bbac8672ed337933887276d590424c89b75c3e5acd290f3a5561029`.

**Preconditions**

- Rows include the two expected scenario IDs.
- One or more legs are absent, duplicated, or not represented in every scenario.

**Trigger:** Pass two rows, one for each scenario, both using the same leg ID.

**Expected behavior:** A matrix validator must prove the full scenario-by-leg rectangle, stable stake/cost terms, unique cells, and complete terminal winner coverage.

**Current behavior:** The exported validator checks row shape and distinct scenario IDs only. It does not check leg cardinality, unique scenario-leg cells, or every leg in every scenario. The solver adds one later leg-count check, but the validator itself returns accepted.

**Impact:** Other callers can trust an invalid matrix, and tests/validators can falsely certify complete terminal cash-flow coverage.

**Independent evidence:** The adversarial harness supplied two rows covering YES-wins and NO-wins but only one distinct leg; validateScenarioCashflowMatrix returned ok=true.

**Reproduction:** `REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY`.

**Root cause:** Scenario coverage is validated independently of leg coverage and matrix rectangularity.

**Minimal fix boundary:** Strengthen the R02 matrix validator to require unique scenario-leg cells, the complete leg set in every scenario, stable leg terms, and one coherent winner. Keep lifecycle simulation semantics in R04.

**Required tests**

- One-leg/two-scenario rejection.
- Duplicate cell and missing cell tests.
- Extra leg/scenario rejection.
- Permutation and rectangularity property tests.

**Regression risks**

- Stricter validation may expose malformed retained fixtures.
- Do not duplicate B1-specific matrix logic inconsistently.

**Secondary sectors:** R04 simulation consumers, R11 validator false-green coverage.

**Aliases/dependencies:** none.

**Explicitly unchanged areas**

- Standard complete-set assembly
- B1 matrix validator, which already checks rectangularity more strongly
- Persistence

**Blocking effect:** release=yes, bws_600_evidence=no, b1_acceptance=no, later_execution=yes.

### BWS116-R02-013 — Locale-sensitive localeCompare calls make candidate, scenario, and solver ordering environment-dependent

**Severity:** P1
**Confidence:** 0.99
**Classification:** `CONFIRMED_FINDING`
**Primary owner:** R02

**Current source evidence**

- `packages/bootstrap/src/opportunity/standard-binary-derivation.ts`, `deriveStandardBinaryOpportunityCandidates ordering`, lines 27-41, SHA-256 `04059b7cd11e946fd8f997d215732e514b5d03cf9faaf9ba86bb42910f25d653`.
- `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts`, `sortRowsBySelection / sortedEntries`, lines 362-374, SHA-256 `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543`.
- `packages/bootstrap/src/scenarios/b1-terminal-scenario.ts`, `compareSelectedQuotes`, lines 55-60, SHA-256 `4f3ee12a400f4a034a177043213f785df2c6a60f33f8cdd85a84be652401b47c`.
- `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts`, `compareCandidateQuotes`, lines 526-535, SHA-256 `822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0`.
- `packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts`, `compareCashflowRows / compareLegTerms`, lines 380-397, SHA-256 `f48a4d0f697fcc2d9d48328ef665689807f3f97d6c74fbcba67b01520293a580`.

**Preconditions**

- Canonical keys contain non-ASCII characters or collation-sensitive sequences.
- The process locale differs between machines or containers.

**Trigger:** Sort selection keys ["a", "ä", "z"] under en_US.UTF-8 and sv_SE.UTF-8.

**Expected behavior:** Deterministic strategy output must use one locale-independent byte/code-point ordering contract.

**Current behavior:** Multiple R02 paths use String.localeCompare without an explicit locale/options. The host locale controls order.

**Impact:** Candidate order, stake order, scenario order, serialized hashes, and tie outcomes can differ across environments despite identical inputs.

**Independent evidence:** The same harness produced [a, ä, z] under en-US and [a, z, ä] under sv-SE.

**Reproduction:** `REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY_TWO_LOCALES`.

**Root cause:** Determinism depends on ambient ICU collation rather than a repository-defined comparator.

**Minimal fix boundary:** Replace localeCompare with one canonical locale-independent comparator and apply it consistently to keys, tuples, scenarios, and tie-breaks.

**Required tests**

- Cross-locale golden tests.
- Unicode normalization and code-unit ordering property tests.
- Input permutation determinism tests.
- Stable serialized artifact hash tests.

**Regression risks**

- Ordering changes can alter retained artifacts and snapshots.
- Do not silently normalize Unicode unless the identity contract authorizes it.

**Secondary sectors:** R03 persisted ordering assumptions, R05 API ordering, R11 deterministic validation.

**Aliases/dependencies:** none.

**Explicitly unchanged areas**

- Economic values
- Canonical key contents
- Runtime execution hold

**Blocking effect:** release=yes, bws_600_evidence=yes, b1_acceptance=yes, later_execution=yes.

### BWS116-R02-014 — B1 fee matrix cannot represent scenario-conditional or non-stake fee bases accepted by its venue-type domain

**Severity:** P1
**Confidence:** 0.97
**Classification:** `CONFIRMED_FINDING`
**Primary owner:** R02

**Current source evidence**

- `packages/bootstrap/src/contracts/b1-local-types.ts`, `B1VenueType / B1MultiVenueMarketRow`, lines 10-12, SHA-256 `22a43ced9a713e4144e343529a8940edfa00676659aa01f48f739e3f28ca03e1`.
- `packages/bootstrap/src/economics/b1-fee-matrix.ts`, `B1FeeMatrixEntry / B1FeeCharge`, lines 7-25, SHA-256 `081e148be8c1e3ffce089cca44c14cb16fa94ee25ae06a320d422b23e9e37175`.
- `packages/bootstrap/src/economics/b1-fee-matrix.ts`, `calculateB1FeeCharge`, lines 27-83, SHA-256 `081e148be8c1e3ffce089cca44c14cb16fa94ee25ae06a320d422b23e9e37175`.
- `packages/bootstrap/src/economics/b1-net-spread.ts`, `fee application and scenario totals`, lines 119-188, SHA-256 `0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b`.

**Preconditions**

- A supported sportsbook, exchange, or prediction-market venue charges on winnings/profit, liability, maker/taker role, market, or only the winning scenario.
- The caller must encode that venue in the current fee matrix.

**Trigger:** Model a 2% commission on positive winnings at odds 3.0 and stake 100.

**Expected behavior:** Fee authority must declare basis, side/role, condition, rounding, minimum/maximum, and version so each terminal scenario is charged correctly.

**Current behavior:** The only model is feeBps on stake plus fixedFeeMinor, keyed by venue and selection. The charge is computed before scenarios and subtracted from every scenario. Venue type is not consulted and no alternative basis can be represented.

**Impact:** Net spread can be over- or understated, particularly for exchange commission and conditional fees; an unknown fee shape can still be encoded as if it were stake-based and accepted.

**Independent evidence:** For 2% commission on positive winnings, correct fee at stake 100 and odds 3.0 is 4 only in the winning scenario. Current code can only charge ceil(100*200/10000)=2 plus fixed, unconditionally. No parameterization can express the correct function.

**Reproduction:** `CONFIRMED_BY_STATIC_TYPE_AND_INDEPENDENT_CASHFLOW_ANALYSIS`.

**Root cause:** Fee semantics are collapsed to one unconditional stake-percentage formula despite a heterogeneous venue domain.

**Minimal fix boundary:** Define versioned fee-basis unions and scenario-dependent fee cash flows in R02. Current provider-specific fee authority remains an R01 external-input requirement; do not guess venue schedules.

**Required tests**

- Stake, payout, profit, liability, maker/taker, fixed, minimum, maximum, and conditional fee cases.
- Scenario-only charge tests.
- Unknown fee basis must block.
- Independent cash-flow oracle tests.

**Regression risks**

- Incorrect generalization can double-charge or omit fees.
- Provider fee schedules are external authority and may change.

**Secondary sectors:** R01 provider fee contract/currentness, R04 terminal simulation, R07 net-metric evidence, R11 independent oracle tests.

**Aliases/dependencies:** none.

**Explicitly unchanged areas**

- Current simple stake-bps arithmetic for explicitly compatible venues
- Capital-lock formula
- Provider access remains prohibited

**Blocking effect:** release=yes, bws_600_evidence=yes, b1_acceptance=yes, later_execution=yes.

## Probable finding and hypotheses

- `BWS116-R02-PF-001`: a venue-pair candidate can select all legs from one venue. This is reproduced and can duplicate/misclassify metrics, but the supplied authority does not explicitly require selected legs to span both venue IDs. Product authority must settle the semantics.
- `BWS116-R02-HYP-001`: the origin for stake increments is unspecified. The implementation rounds from zero; some venue contracts use `min + k*step`.
- `BWS116-R02-HYP-002`: the B1 solver has no total portfolio budget/residual allocation input. It may intentionally be feasibility-only.
- `BWS116-R02-HYP-003`: selection-equivalence keys are trusted when outcomeName differs; upstream alias authority is required.
- `BWS116-R02-HYP-004`: the pure standard solver's optional 60-second freshness default lacks a clearly cited lane-wide authority.

## External blockers

`BWS116-R02-EXT-001` remains decisive: the accepted `betting-win.b1_multi_venue_markets.v1` runtime resource and downstream API handoff do not exist in this baseline. Therefore real provider generation, fee, capacity, venue-limit, and settlement inputs cannot be accepted. Local fixtures and positive spreads are not runtime evidence or profitability evidence.

## Intentional safeguards

- Gross implied probabilities use ceiling division, which is conservative against false gross edge.
- Pair-level B1 timestamps, future skew, quote age, retrieval lag, and market status fail closed.
- Missing fee entries do not default to zero.
- B1 economic arithmetic uses bigint fixed-point units.
- Gross and net candidate types remain distinct; accepted net and solver outputs retain `executable=false` and the BWS-900 parked marker.
- Generalized solver iteration count is bounded to 1..1000.

## Rejected suspicions

- Candidate ID reuse across snapshots is not independently an R02 defect because current authority defines the grouping identity as market equivalence plus venue pair and persistence can scope it by run. Generation omission is separately confirmed in -002.
- Capital-lock annualization matched the encoded formula.
- Quote-age penalty arithmetic matched the encoded formula.
- A malformed zero-odds forged candidate did not produce acceptance in the tested downstream path.
- The bounded three-way oracle found no false-feasible vector, although that is not a proof outside the tested domain.

## Cross-area handoffs

- `KNOWN_BASELINE_MANIFEST_DRIFT` → R11. Do not regenerate the manifest during R02 research.
- `BWS116-R02-HO-001` → R01. Define whether and how `decimalOdds` must reconcile with `priceMinorOrProbabilityMinor`; the harness proved conflicting values are currently ignored.
- `BWS116-R02-HO-002` → R03. Capacity-receipt persistence and key-encoding migrations must be atomic and replay-safe.
- R04 owns fill/rejection/timeout, residual exposure, settlement replay, and backtest lifecycle. R02 owns the incorrect pure values and acceptance gates supplied to those systems.
- R07 owns evidence publication. It must not publish current net/capacity metrics until the R02 defects are corrected and real input authority exists.

## Test and validator gaps

Nine formal test gaps are recorded in the findings JSON. The decisive false-green observation is:

```text
focused_test_files=18
focused_tests_passed=147
focused_tests_failed=0
supplementary_runtime=Node_22.16.0
confirmed_R02_defects_reproduced=14
```

The missing test families are outcome-space semantics, provider/generation partitioning, candidate-global time windows, quote-value/evidence mutation, capacity integration, brute-force solver oracles, delimiter injectivity, cross-locale ordering, standard mixed-source/synchronization/increment/matrix cases, and fee-basis unions.

Static validators `validate_repo`, boundary/no-provider/no-execution, fixture integrity, and B1 authority/boundary/acceptance all passed while these defects remained. Those validators prove repository markers and selected invariants, not strategy mathematics.

## Prioritized review-only remediation order

1. Establish canonical terminal outcome-space semantics and bind provider/generation/provenance before quote comparison: -001, -002, -008, -009.
2. Make quote evidence one immutable candidate-global snapshot: -003, -004, -010.
3. Integrate quote capacity, venue limits, and real increment authority: -005, -011.
4. Replace the incomplete common-target solver with a complete bounded two/three-leg integer feasibility method: -006.
5. Replace ambiguous tuple serialization and ambient collation: -007, -013.
6. Strengthen scenario matrix completeness: -012.
7. Define and implement versioned scenario-correct fee bases: -014.
8. Add independent property, permutation, locale, mutation, and brute-force tests, then rerun canonical Node 20 validation.
9. Only after source remediation and accepted upstream runtime authority may BWS-600 evidence be considered.

This is remediation ordering only, not an implementation prompt or authorization.

## Explicit unchanged areas

- No archive member, source file, test, fixture, schema, documentation, configuration, manifest, or repository state was modified.
- No `betting-win` checkout was accessed or changed.
- No provider, external API, service, account, credential, signer, wallet, or persistent database was contacted.
- No controller, API, worker, scheduler, paper campaign, or service was started.
- No order, bet, cancellation, redemption, settlement, deposit, withdrawal, or live write was constructed or submitted.
- R03 persistence mechanics, R04 lifecycle/simulation semantics, R05 projection, R06 service operation, R07 evidence publication, R10 global configuration, R11 aggregate assurance, and R12 automation remain outside primary R02 ownership except for explicit handoffs.

## Validation limitations

Canonical Node 20.20.2 was unavailable, dependencies were not installed, and the full build/test suite was therefore unavailable. Node 22 results are supplementary. The independent solver searches are bounded counterexample analyses rather than formal proof. Real B1 runtime inputs remain externally blocked. These limitations do not weaken the confirmed static and reproduced counterexamples, but they prohibit any release or runtime acceptance conclusion.
