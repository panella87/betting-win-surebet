
# BWS-W1-T06 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W1-T06
CAMPAIGN_ORDER: 18
STAGE: S3
PRIMARY_OWNER: R02
SECONDARY_REVIEWERS: R01, R03, R04, R05, R09, R11
ISSUE_IDS: BWS116-R02-001, BWS116-R02-002, BWS116-R02-007, BWS116-R02-008, BWS116-R02-009, BWS116-R02-013
SEVERITY_COUNTS: {"P1": 6}
DEPENDENCIES: T03
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen review/finding baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; active campaign authority is pinned by activation/immutable-authority.sha256; exact current numbered archive or checkout, extracted-tree digest, Git identity, source paths, hashes, and modes must be captured in an external audit or admission receipt and reverified before editing; repository documentation does not self-attest a rolling numbered ZIP
CURRENT_SOURCE_PATH_CANDIDATES: packages/bootstrap/src/contracts/b1-local-types.ts, packages/bootstrap/src/contracts/betting-win-b1-resource-records.ts, packages/bootstrap/src/contracts/betting-win-resource-records.ts, packages/bootstrap/src/economics/b1-fee-matrix.ts, packages/bootstrap/src/identity/b1-market-equivalence.ts, packages/bootstrap/src/identity/b1-selection-equivalence.ts, packages/bootstrap/src/identity/b1-venue-pair-key.ts, packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts, packages/bootstrap/src/opportunity/b1-gross-spread.ts, packages/bootstrap/src/opportunity/standard-binary-derivation.ts, packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts, packages/bootstrap/src/scenarios/b1-terminal-scenario.ts, packages/bootstrap/src/scenarios/complete-set.ts, packages/bootstrap/src/solver/b1-generalized-stake-vector.ts
SYMBOLS_TO_REVERIFY: 27 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: packages/bootstrap/src/contracts/b1-local-types.ts, packages/bootstrap/src/contracts/betting-win-resource-records.ts, packages/bootstrap/src/economics/b1-fee-matrix.ts, packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts, packages/bootstrap/src/opportunity/b1-gross-spread.ts, packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts, packages/bootstrap/src/solver/b1-generalized-stake-vector.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites `["Authoritative provider/generation and market-shape semantics from R01/T03"]`
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 22 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 0 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 13 classified records below
CONCURRENCY_OR_CRASH_TESTS: 0 classified records below
ENVIRONMENT_PROOF: {"NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE": 22}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: ["Outcome sets are mutually exclusive and exhaustive", "Identity encoding is injective and locale-independent", "Provider/generation and source-manifest identity remain bound"]
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": false, "bws_710": false, "deployment": false, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W1-T10 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `packages/bootstrap/src/contracts/b1-local-types.ts` | present=yes | sha256=22a43ced9a713e4144e343529a8940edfa00676659aa01f48f739e3f28ca03e1 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/contracts/betting-win-b1-resource-records.ts` | present=yes | sha256=2068f5dea3a115cbbc4e7b7fde16774b9a0fc9c964be1550215cc2c7508604e8 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/contracts/betting-win-resource-records.ts` | present=yes | sha256=8ca3a040b691242eb1025ab74f545157c1072b85332fdc1313924e57396c6903 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/economics/b1-fee-matrix.ts` | present=yes | sha256=081e148be8c1e3ffce089cca44c14cb16fa94ee25ae06a320d422b23e9e37175 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/identity/b1-market-equivalence.ts` | present=yes | sha256=b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/identity/b1-selection-equivalence.ts` | present=yes | sha256=ac7dcc2ddf2d9bf660931b639e10b6659ffe90ec8115ab80b765884784bc0ae2 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/identity/b1-venue-pair-key.ts` | present=yes | sha256=3c1f4864a055c479d758ec070804a285aa1441ad7b14418061039d45d44517fa | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` | present=yes | sha256=29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/opportunity/b1-gross-spread.ts` | present=yes | sha256=48ecd0e6402a23610f9582222e86e31c943948f31b6edf0896a66751edfddafb | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/opportunity/standard-binary-derivation.ts` | present=yes | sha256=04059b7cd11e946fd8f997d215732e514b5d03cf9faaf9ba86bb42910f25d653 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts` | present=yes | sha256=f48a4d0f697fcc2d9d48328ef665689807f3f97d6c74fbcba67b01520293a580 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/scenarios/b1-terminal-scenario.ts` | present=yes | sha256=4f3ee12a400f4a034a177043213f785df2c6a60f33f8cdd85a84be652401b47c | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/scenarios/complete-set.ts` | present=yes | sha256=bdea2ee4db048e553d69f379ab4599c28bae68e372b2821bacb2a64611c98bac | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` | present=yes | sha256=822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS116-R02-001 | `packages/bootstrap/src/identity/b1-market-equivalence.ts` | symbol=compareB1MarketOutcomeSetEquivalence / indexBySelectionEquivalence | reviewed_line_range=141-235 | reviewed_sha256=b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75
- BWS116-R02-001 | `packages/bootstrap/src/identity/b1-market-equivalence.ts` | symbol=indexBySelectionEquivalence | reviewed_line_range=305-326 | reviewed_sha256=b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75
- BWS116-R02-001 | `packages/bootstrap/src/identity/b1-selection-equivalence.ts` | symbol=compareB1SelectionEquivalence | reviewed_line_range=15-51 | reviewed_sha256=ac7dcc2ddf2d9bf660931b639e10b6659ffe90ec8115ab80b765884784bc0ae2
- BWS116-R02-001 | `packages/bootstrap/src/scenarios/b1-terminal-scenario.ts` | symbol=buildB1TerminalScenarios | reviewed_line_range=15-52 | reviewed_sha256=4f3ee12a400f4a034a177043213f785df2c6a60f33f8cdd85a84be652401b47c
- BWS116-R02-002 | `packages/bootstrap/src/contracts/b1-local-types.ts` | symbol=B1MultiVenueMarketRow provider identity fields | reviewed_line_range=30-70 | reviewed_sha256=22a43ced9a713e4144e343529a8940edfa00676659aa01f48f739e3f28ca03e1
- BWS116-R02-002 | `packages/bootstrap/src/identity/b1-market-equivalence.ts` | symbol=compareB1MarketEquivalence | reviewed_line_range=43-139 | reviewed_sha256=b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75
- BWS116-R02-002 | `packages/bootstrap/src/identity/b1-market-equivalence.ts` | symbol=compareB1MarketOutcomeSetEquivalence | reviewed_line_range=141-235 | reviewed_sha256=b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75
- BWS116-R02-002 | `packages/bootstrap/src/identity/b1-venue-pair-key.ts` | symbol=createB1VenuePairKey | reviewed_line_range=14-50 | reviewed_sha256=3c1f4864a055c479d758ec070804a285aa1441ad7b14418061039d45d44517fa
- BWS116-R02-002 | `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` | symbol=groupRowsByMarketEquivalence / groupRowsByVenue | reviewed_line_range=318-359 | reviewed_sha256=29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543
- BWS116-R02-002 | `packages/bootstrap/src/opportunity/b1-gross-spread.ts` | symbol=B1GrossQuoteInput / B1GrossQuoteContribution | reviewed_line_range=10-26 | reviewed_sha256=48ecd0e6402a23610f9582222e86e31c943948f31b6edf0896a66751edfddafb
- BWS116-R02-007 | `packages/bootstrap/src/identity/b1-venue-pair-key.ts` | symbol=createB1VenuePairKey | reviewed_line_range=35-50 | reviewed_sha256=3c1f4864a055c479d758ec070804a285aa1441ad7b14418061039d45d44517fa
- BWS116-R02-007 | `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` | symbol=buildCandidateId / buildVenuePairKeyForRows | reviewed_line_range=376-405 | reviewed_sha256=29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543
- BWS116-R02-007 | `packages/bootstrap/src/economics/b1-fee-matrix.ts` | symbol=normalizeB1FeeMatrix duplicate key | reviewed_line_range=102-117 | reviewed_sha256=081e148be8c1e3ffce089cca44c14cb16fa94ee25ae06a320d422b23e9e37175
- BWS116-R02-007 | `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` | symbol=constraint-key construction and duplicate detection | reviewed_line_range=292-326 | reviewed_sha256=822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0
- BWS116-R02-007 | `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` | symbol=buildConstraintKey | reviewed_line_range=512-514 | reviewed_sha256=822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0
- BWS116-R02-007 | `packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts` | symbol=buildB1ScenarioLegKey | reviewed_line_range=400-402 | reviewed_sha256=f48a4d0f697fcc2d9d48328ef665689807f3f97d6c74fbcba67b01520293a580
- BWS116-R02-008 | `packages/bootstrap/src/contracts/betting-win-b1-resource-records.ts` | symbol=line_value parse | reviewed_line_range=386-397 | reviewed_sha256=2068f5dea3a115cbbc4e7b7fde16774b9a0fc9c964be1550215cc2c7508604e8
- BWS116-R02-008 | `packages/bootstrap/src/contracts/betting-win-b1-resource-records.ts` | symbol=requireSignedDecimalString | reviewed_line_range=611-620 | reviewed_sha256=2068f5dea3a115cbbc4e7b7fde16774b9a0fc9c964be1550215cc2c7508604e8
- BWS116-R02-008 | `packages/bootstrap/src/identity/b1-market-equivalence.ts` | symbol=compareB1MarketEquivalence line comparison | reviewed_line_range=82-87 | reviewed_sha256=b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75
- BWS116-R02-008 | `packages/bootstrap/src/identity/b1-market-equivalence.ts` | symbol=compareOutcomeSetMarketContext line comparison | reviewed_line_range=274-279 | reviewed_sha256=b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75
- BWS116-R02-009 | `packages/bootstrap/src/contracts/betting-win-resource-records.ts` | symbol=BettingWinQuoteRecord | reviewed_line_range=31-40 | reviewed_sha256=8ca3a040b691242eb1025ab74f545157c1072b85332fdc1313924e57396c6903
- BWS116-R02-009 | `packages/bootstrap/src/scenarios/complete-set.ts` | symbol=quote assembly and acceptance | reviewed_line_range=112-184 | reviewed_sha256=bdea2ee4db048e553d69f379ab4599c28bae68e372b2821bacb2a64611c98bac
- BWS116-R02-013 | `packages/bootstrap/src/opportunity/standard-binary-derivation.ts` | symbol=deriveStandardBinaryOpportunityCandidates ordering | reviewed_line_range=27-41 | reviewed_sha256=04059b7cd11e946fd8f997d215732e514b5d03cf9faaf9ba86bb42910f25d653
- BWS116-R02-013 | `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` | symbol=sortRowsBySelection / sortedEntries | reviewed_line_range=362-374 | reviewed_sha256=29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543
- BWS116-R02-013 | `packages/bootstrap/src/scenarios/b1-terminal-scenario.ts` | symbol=compareSelectedQuotes | reviewed_line_range=55-60 | reviewed_sha256=4f3ee12a400f4a034a177043213f785df2c6a60f33f8cdd85a84be652401b47c
- BWS116-R02-013 | `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` | symbol=compareCandidateQuotes | reviewed_line_range=526-535 | reviewed_sha256=822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0
- BWS116-R02-013 | `packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts` | symbol=compareCashflowRows / compareLegTerms | reviewed_line_range=380-397 | reviewed_sha256=f48a4d0f697fcc2d9d48328ef665689807f3f97d6c74fbcba67b01520293a580

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS116-R02-001 — B1 complete-set acceptance proves only key cardinality, not mutually exclusive and exhaustive outcome semantics

- Severity: `P1`
- Current behavior: The comparator checks 2/3 cardinality, unique selection keys, and pairwise equality of each key/side across venues. It never checks within-set semantic complementarity or exhaustiveness. Terminal scenarios are then generated one per key.
- Expected behavior: A supported complete set must prove that its terminal outcomes are mutually exclusive, exhaustive, and mapped to the declared market shape, not merely count two or three distinct keys.
- Invariant: A supported complete set must prove that its terminal outcomes are mutually exclusive, exhaustive, and mapped to the declared market shape, not merely count two or three distinct keys.
- Root cause: Outcome-set validity is represented as cardinality plus key uniqueness; canonical market-shape semantics are absent from the B1 complete-set gate.
- Trigger: Supply two distinct selection keys whose outcomeSide values are both "home" on both venues, then derive the B1 candidate.
- Minimal fix boundary: Add an R02-owned market-shape outcome-set validator at the equivalence/terminal-scenario boundary. It must consume authoritative canonical outcome semantics and fail closed before quote selection. Do not change upstream canonical identity production.
- Regression risks:
- Overly label-based fixes could reject legitimate provider aliases.
- Changes must preserve canonical selection-equivalence authority and not invent local identity.

### BWS116-R02-002 — B1 market grouping and venue-pair identity omit provider and provider-generation authority

- Severity: `P1`
- Current behavior: ProviderId and providerGenerationId are present on input rows but are not compared by the market/outcome-set equivalence functions, are not part of the venue-pair key or grouping keys, and are dropped from selected quote contributions.
- Expected behavior: Every compared quote set must preserve and verify compatible provider ID and provider-generation identity, and the selected quote evidence must retain that authority.
- Invariant: Every compared quote set must preserve and verify compatible provider ID and provider-generation identity, and the selected quote evidence must retain that authority.
- Root cause: The B1 local row contract carries provider authority, but the R02 identity composition narrows to market key plus venue string and strips generation evidence at quote selection.
- Trigger: Combine rows from generation-001 and generation-002 while holding market key, venue IDs, rules, and selection keys constant.
- Minimal fix boundary: Extend R02 equivalence, grouping, venue identity, and selected-quote contracts to bind provider and generation. Any definition of compatible cross-generation equivalence is an explicit R01 handoff and must not default to compatibility.
- Regression risks:
- Changing candidate identity may affect persisted keys and report joins owned by R03/R05.
- Do not rewrite upstream provider-generation semantics locally.

### BWS116-R02-007 — Unescaped delimiter-based composite keys collide for distinct B1 identities and constraints

- Severity: `P1`
- Current behavior: Keys are built by raw concatenation with ::, |, or NUL. Input validation requires non-empty strings but permits these delimiter characters.
- Expected behavior: Distinct typed tuples must have distinct deterministic encodings for keys, duplicate checks, candidate IDs, and scenario legs.
- Invariant: Distinct typed tuples must have distinct deterministic encodings for keys, duplicate checks, candidate IDs, and scenario legs.
- Root cause: Composite identity uses ambiguous delimiter serialization instead of a canonical injective tuple encoding.
- Trigger: Construct venue tuples ("a", "b::c") and ("a::b", "c"), or fee tuples split around a NUL character.
- Minimal fix boundary: Use one canonical structured/length-prefixed tuple encoder for all R02 keys or reject reserved characters at the authoritative parser. Coordinate persisted-key migrations with R03 rather than changing storage silently.
- Regression risks:
- Changing key encoding affects persisted records, fixtures, and APIs.
- Unicode normalization policy must be explicit rather than incidental.

### BWS116-R02-008 — B1 line equivalence compares raw decimal text and rejects numerically identical markets

- Severity: `P1`
- Current behavior: The parser validates syntax but preserves raw text; equivalence uses strict string equality.
- Expected behavior: Line equality must use one canonical fixed-point numeric representation with explicit scale and sign normalization.
- Invariant: Line equality must use one canonical fixed-point numeric representation with explicit scale and sign normalization.
- Root cause: No canonical numeric line representation is established before identity comparison.
- Trigger: Compare otherwise identical spread/total rows using lineValue "1" and "1.0".
- Minimal fix boundary: Normalize line values to a bounded signed fixed-point tuple at intake or R02 comparison. R01 owns any upstream contract change; R02 owns numeric equality and key consumption.
- Regression risks:
- Incorrect sign normalization can merge opposite spread viewpoints.
- Canonical scale changes can affect persisted keys.

### BWS116-R02-009 — Standard-binary complete-set assembly can mix YES and NO quotes from different source manifests

- Severity: `P1`
- Current behavior: The quote contract carries quoteSourceManifestHash, but assembly checks only market ID, outcome uniqueness, and currency. The accepted complete set does not expose a quote-manifest identity.
- Expected behavior: All legs in one complete-set snapshot must be bound to one compatible source manifest or an explicit multi-source synchronization/provenance receipt.
- Invariant: All legs in one complete-set snapshot must be bound to one compatible source manifest or an explicit multi-source synchronization/provenance receipt.
- Root cause: Quote provenance is available but omitted from complete-set coherence and output identity.
- Trigger: Assemble a complete set with manifest hash a...a for YES and b...b for NO.
- Minimal fix boundary: Require exact compatible quote-manifest binding during standard complete-set assembly and retain the accepted source identity in the complete-set contract.
- Regression risks:
- Historical fixture bundles may intentionally contain multiple manifests and will need explicit partitioning.
- Do not infer compatibility from provider generation alone.

### BWS116-R02-013 — Locale-sensitive localeCompare calls make candidate, scenario, and solver ordering environment-dependent

- Severity: `P1`
- Current behavior: Multiple R02 paths use String.localeCompare without an explicit locale/options. The host locale controls order.
- Expected behavior: Deterministic strategy output must use one locale-independent byte/code-point ordering contract.
- Invariant: Deterministic strategy output must use one locale-independent byte/code-point ordering contract.
- Root cause: Determinism depends on ambient ICU collation rather than a repository-defined comparator.
- Trigger: Sort selection keys ["a", "ä", "z"] under en_US.UTF-8 and sv_SE.UTF-8.
- Minimal fix boundary: Replace localeCompare with one canonical locale-independent comparator and apply it consistently to keys, tuples, scenarios, and tie-breaks.
- Regression risks:
- Ordering changes can alter retained artifacts and snapshots.
- Do not silently normalize Unicode unless the identity contract authorizes it.


## Allowed edit boundary

- Candidate path set: `packages/bootstrap/src/contracts/b1-local-types.ts`, `packages/bootstrap/src/contracts/betting-win-b1-resource-records.ts`, `packages/bootstrap/src/contracts/betting-win-resource-records.ts`, `packages/bootstrap/src/economics/b1-fee-matrix.ts`, `packages/bootstrap/src/identity/b1-market-equivalence.ts`, `packages/bootstrap/src/identity/b1-selection-equivalence.ts`, `packages/bootstrap/src/identity/b1-venue-pair-key.ts`, `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts`, `packages/bootstrap/src/opportunity/b1-gross-spread.ts`, `packages/bootstrap/src/opportunity/standard-binary-derivation.ts`, `packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts`, `packages/bootstrap/src/scenarios/b1-terminal-scenario.ts`, `packages/bootstrap/src/scenarios/complete-set.ts`, `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `packages/bootstrap/src/contracts/b1-local-types.ts` | participating tranches=T06, T07 | predecessor postimage required
- `packages/bootstrap/src/contracts/betting-win-resource-records.ts` | participating tranches=T06, T07 | predecessor postimage required
- `packages/bootstrap/src/economics/b1-fee-matrix.ts` | participating tranches=T06, T07 | predecessor postimage required
- `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` | participating tranches=T06, T07, T17 | predecessor postimage required
- `packages/bootstrap/src/opportunity/b1-gross-spread.ts` | participating tranches=T06, T07 | predecessor postimage required
- `packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts` | participating tranches=T06, T15 | predecessor postimage required
- `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` | participating tranches=T06, T07, T08 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- B1 generation finding BWS116-R02-002
- Canonical key contents
- Canonical upstream IDs themselves
- Economic formulas
- Economic values
- Execution remains prohibited
- External API currentness gate
- Fill/rejection/settlement replay implementation
- Market type/period/rule checks
- Persistence and worker lifecycle
- Provider connectivity
- Raw upstream archival bytes
- Rule and settlement identity checks
- Runtime API access
- Runtime execution hold
- Settlement replay
- Upstream event/market identity generation
- Upstream provider identity production
- Upstream provider-generation production
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T03.
- Review prerequisites: ["Authoritative provider/generation and market-shape semantics from R01/T03"].
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

- `BWS116-R02-001-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-001 | requirement=Two-way home/home, away/away, yes/yes, no/no, over/over, under/under rejection tests.
- `BWS116-R02-001-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-001 | requirement=Three-way duplicate-side and missing-draw tests.
- `BWS116-R02-001-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-001 | requirement=Permutation/property tests proving exactly one terminal winner per valid market shape.
- `BWS116-R02-002-TEST-01` | category=identity_or_determinism | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-002 | requirement=Mixed-provider and mixed-generation rejection tests.
- `BWS116-R02-002-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-002 | requirement=Same venue ID under different providers collision tests.
- `BWS116-R02-002-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-002 | requirement=Selected quote evidence retention tests.
- `BWS116-R02-002-TEST-04` | category=identity_or_determinism | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-002 | requirement=Permutation tests across generation partitions.
- `BWS116-R02-007-TEST-01` | category=identity_or_determinism | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-007 | requirement=Delimiter injection for every key constructor.
- `BWS116-R02-007-TEST-02` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-007 | requirement=Round-trip/injectivity property tests over Unicode and control characters.
- `BWS116-R02-007-TEST-03` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-007 | requirement=Cross-module consistency tests for candidate, constraint, fee, and scenario keys.
- `BWS116-R02-008-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-008 | requirement=Equivalent textual forms tests.
- `BWS116-R02-008-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-008 | requirement=Negative-zero normalization.
- `BWS116-R02-008-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-008 | requirement=Scale/precision overflow and unsupported precision tests.
- `BWS116-R02-008-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-008 | requirement=Spread sign/viewpoint inversion tests.
- `BWS116-R02-009-TEST-01` | category=identity_or_determinism | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-009 | requirement=Mixed-manifest rejection.
- `BWS116-R02-009-TEST-02` | category=identity_or_determinism | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-009 | requirement=Missing/unknown manifest rejection.
- `BWS116-R02-009-TEST-03` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-009 | requirement=Single-manifest round trip.
- `BWS116-R02-009-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-009 | requirement=Explicit synchronization receipt path only if separately authorized.
- `BWS116-R02-013-TEST-01` | category=identity_or_determinism | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-013 | requirement=Cross-locale golden tests.
- `BWS116-R02-013-TEST-02` | category=identity_or_determinism | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-013 | requirement=Unicode normalization and code-unit ordering property tests.
- `BWS116-R02-013-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-013 | requirement=Input permutation determinism tests.
- `BWS116-R02-013-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-013 | requirement=Stable serialized artifact hash tests.

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- none mapped; focused environment proof remains required

## Negative and adversarial tests

- `BWS116-R02-001-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-001 | requirement=Three-way duplicate-side and missing-draw tests.
- `BWS116-R02-002-TEST-01` | category=identity_or_determinism | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-002 | requirement=Mixed-provider and mixed-generation rejection tests.
- `BWS116-R02-002-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-002 | requirement=Same venue ID under different providers collision tests.
- `BWS116-R02-002-TEST-04` | category=identity_or_determinism | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-002 | requirement=Permutation tests across generation partitions.
- `BWS116-R02-007-TEST-01` | category=identity_or_determinism | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-007 | requirement=Delimiter injection for every key constructor.
- `BWS116-R02-007-TEST-02` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-007 | requirement=Round-trip/injectivity property tests over Unicode and control characters.
- `BWS116-R02-007-TEST-03` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-007 | requirement=Cross-module consistency tests for candidate, constraint, fee, and scenario keys.
- `BWS116-R02-008-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-008 | requirement=Negative-zero normalization.
- `BWS116-R02-009-TEST-01` | category=identity_or_determinism | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-009 | requirement=Mixed-manifest rejection.
- `BWS116-R02-009-TEST-02` | category=identity_or_determinism | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-009 | requirement=Missing/unknown manifest rejection.
- `BWS116-R02-009-TEST-03` | category=mathematics_or_property | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-009 | requirement=Single-manifest round trip.
- `BWS116-R02-013-TEST-01` | category=identity_or_determinism | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-013 | requirement=Cross-locale golden tests.
- `BWS116-R02-013-TEST-02` | category=identity_or_determinism | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | production_entrypoint=no | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS116-R02-013 | requirement=Unicode normalization and code-unit ordering property tests.

## Concurrency, cancellation, crash, and restart tests

- No separately classified record

## Environment proof

- NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE: 22 requirements

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

Acceptance authority: ["Outcome sets are mutually exclusive and exhaustive", "Identity encoding is injective and locale-independent", "Provider/generation and source-manifest identity remain bound"]

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W1-T10` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
