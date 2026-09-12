# BWS cumulative independent-review issue ledger through Wave 03

- Baseline: `betting-win-surebet120.zip` (`d4565c05ecfe63f5d5511f224a20ff20fb82bfc75b23203c94d7d3e98a8c21bb`)
- Areas: R01 through R09
- Confirmed findings: 137 (P0=5, P1=115, P2=17, P3=0)
- This ledger is review evidence, not implementation or runtime authority.

## BWS116-R01-001 — Committed-HEAD lock derivation honors repository-local Git replacement objects

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R01`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R01`

**Invariant.** A committed-source lock must describe the literal object graph named by the advertised commit ID, independent of repository-local replacement refs.

**Trigger.** The lock implementation resolves HEAD/tree/content with ordinary Git plumbing commands while replacement-object processing remains enabled.

**Current behavior.** The lock path does not force replacement objects off. Git can therefore report the original HEAD object name while dereferencing a replacement commit/tree for later content-oriented commands, producing a lock that is not portable proof of the named commit.

**Expected behavior.** A committed-source lock must describe the literal object graph named by the advertised commit ID, independent of repository-local replacement refs.

**Impact.** A repository-local mutable ref can make a false source view satisfy commit/package/workspace/capability checks. The resulting lock is not an immutable proof and can diverge from a clean clone of the same commit ID.

**Root cause.** The trust model treats Git's default revision resolver as a literal object reader, but default resolution includes mutable repository-local replacement refs.

**Minimal fix boundary.** In the upstream-lock command runner only, disable replacement-object interpretation for every identity/content operation and verify that commit, tree, and blob reads all originate from the literal advertised objects. Preserve the existing lock schema unless a compatibility version is deliberately introduced.

**Current files and symbols.**
- `packages/upstream/src/upstream/betting-win-upstream-lock.ts` `generateBettingWinUpstreamLock` `L102-L103` `8c0badbfc3dc776eb71e01e1a76280debab30c64739274b06d1ce7343382a6c2`

**Required tests.**
- Production-entrypoint test with a disposable repository containing a replacement commit and replacement blob; lock generation must reject or produce the literal original graph.
- Control test proving ordinary committed HEAD, worktree, and bare-repository forms remain accepted as intended.

**Blocks release/deployment.** `true`

## BWS116-R01-002 — Upstream lock is assembled from multiple unconstrained HEAD observations rather than one pinned object graph

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R01`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R01`

**Invariant.** All lock fields must be derived from one explicitly pinned commit/tree snapshot, or generation must fail when the repository moves.

**Trigger.** HEAD, tree, tracked-file fingerprint, package/workspace data, or capabilities are resolved by separate Git/filesystem operations without first pinning and reusing one immutable commit object and without a final same-object check.

**Current behavior.** The lock is composed across multiple observations. A concurrent branch update can mix identity from one revision with tree/content/fingerprint evidence from another, and the final record does not prove atomicity of the source view.

**Expected behavior.** All lock fields must be derived from one explicitly pinned commit/tree snapshot, or generation must fail when the repository moves.

**Impact.** A syntactically valid lock can bind mutually inconsistent source facts, causing false compatibility acceptance or nondeterministic failures across reruns.

**Root cause.** The implementation pins a branch name operationally, not a single object graph used as the sole input to every derived field.

**Minimal fix boundary.** Resolve one literal commit object once, derive tree and every committed file from that object ID, and fail if any required filesystem-derived datum cannot be read from the same commit. Add a final guard only as defense in depth, not as the primary snapshot mechanism.

**Current files and symbols.**
- `packages/upstream/src/upstream/betting-win-upstream-lock.ts` `generateBettingWinUpstreamLock` `L102-L103` `8c0badbfc3dc776eb71e01e1a76280debab30c64739274b06d1ce7343382a6c2`

**Required tests.**
- Instrumented disposable-repository test that advances the branch between each Git subprocess and proves either stable old/new lock output or fail-closed behavior, never a mixed record.
- Test uncommitted and untracked changes remain excluded without reading mutable worktree files.

**Blocks release/deployment.** `true`

## BWS116-R01-003 — API convergence records completion metadata but not the exact records later consumed

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R01`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R01`

**Invariant.** The records evaluated downstream must be the exact byte- or record-set snapshot whose pagination and convergence checks completed, or the later query must create and validate a new cycle.

**Trigger.** Convergence persists counts/cursors/currentness metadata and the downstream runtime subsequently issues a fresh API query instead of consuming an immutable page/record set bound to that cycle.

**Current behavior.** The cycle's durable representation does not retain or content-address the complete page records. Downstream work can therefore evaluate a different live response while attributing readiness/provenance to the earlier completed cycle.

**Expected behavior.** The records evaluated downstream must be the exact byte- or record-set snapshot whose pagination and convergence checks completed, or the later query must create and validate a new cycle.

**Impact.** BWS-600 can report convergence for one dataset and process another. Corrections, deletions, insertions, or reordering between the two reads create unprovable and potentially incomplete surebet inputs.

**Root cause.** Convergence is modeled as a status/checkpoint observation rather than as ownership of an immutable data snapshot.

**Minimal fix boundary.** At the R01 boundary, bind a cycle to exact response/page hashes and an immutable record manifest (or persist the records transactionally), and require downstream consumers to reference that cycle identity. Hand generic transaction/fencing mechanics to R03.

**Current files and symbols.**
- `packages/bootstrap/src/operations/upstream-api-convergence.ts` `resolveBwsUpstreamApiConvergenceConfig` `L151-L244` `4f066cc40d08e6ad4748866073c0a14683bd8b7066cb9f41c87f239e28ae5a63`

**Required tests.**
- Production-path test where the fake external API changes after convergence; downstream must consume the first immutable cycle or explicitly start a second cycle.
- Crash/restart test proving cycle identity and exact page set survive process restart.
- Correction/deletion test proving no record can disappear between convergence proof and consumption.

**Blocks release/deployment.** `true`

## BWS116-R01-004 — Accepted API records are not cryptographically bound to exact response bytes, route, query, contract, generation, and page

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R01`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R01`

**Invariant.** Every accepted page must have immutable receive provenance covering exact bytes, URL origin and path, canonical query, contract/profile, upstream commit/generation, page/cursor, and receive time.

**Trigger.** The client emits normalized records/envelope metadata without an immutable digest over the received body and complete request identity, and persistence accepts those fields as provenance.

**Current behavior.** The boundary retains selected parsed fields and timestamps but lacks a response-byte digest and complete request/page binding. Equivalent parsed objects, altered extra fields, route drift, or page substitution cannot be distinguished later.

**Expected behavior.** Every accepted page must have immutable receive provenance covering exact bytes, URL origin and path, canonical query, contract/profile, upstream commit/generation, page/cursor, and receive time.

**Impact.** Auditors and restart logic cannot prove which bytes produced an import or readiness claim. Conflicting pages can collapse into the same apparent provenance, weakening duplicate/conflict detection and BWS-600 evidence truth.

**Root cause.** Provenance is represented as descriptive metadata instead of a cryptographic receipt over the actual request/response exchange.

**Minimal fix boundary.** Extend the R01 API receipt and convergence cycle to include canonical request identity and exact-body hashes for contract and pages. Persist and validate the ordered receipt chain; delegate transaction atomicity to R03 and artifact publication to R07.

**Current files and symbols.**
- `packages/bootstrap/src/adapters/betting-win-query-client.ts` `describeReadOnlyQueryApiClientBoundary` `L181-L183` `7b50ba9a6c6e0dd5486bdca723a6f6c605bd7609151e062fe72ee36100d307ae`

**Required tests.**
- Two bodies with identical required fields but different extra bytes must produce distinct receipts.
- Route/query/profile/generation/page substitutions must fail convergence even when record arrays match.
- Restart must preserve and revalidate the ordered page receipt chain.

**Blocks release/deployment.** `true`

## BWS116-R01-005 — Pagination does not bind every page to one immutable contract, profile, generation, and query identity

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R01`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R01`

**Invariant.** Page 2 and later must be rejected unless their contract version, profile, upstream commit/generation, resource, canonical query, and lineage exactly match page 1 and the negotiated contract receipt.

**Trigger.** The client validates contract/resource shape per response but the convergence loop carries forward only the cursor and does not enforce one immutable negotiation/identity tuple across all pages.

**Current behavior.** The page loop can accept structurally valid pages whose identity-bearing metadata differs or is absent, allowing one logical convergence cycle to mix generations or route interpretations.

**Expected behavior.** Page 2 and later must be rejected unless their contract version, profile, upstream commit/generation, resource, canonical query, and lineage exactly match page 1 and the negotiated contract receipt.

**Impact.** The completed resource can be neither a coherent snapshot nor replayable. Mixed-generation market/selection records can create omissions, duplicates, or ambiguous joins downstream.

**Root cause.** Contract negotiation and page traversal are modeled as adjacent checks rather than one state machine with an invariant identity tuple.

**Minimal fix boundary.** Create a cycle identity from the negotiated contract and first accepted query, require exact equality for every page, and include that tuple in the immutable page receipt chain.

**Current files and symbols.**
- `packages/bootstrap/src/operations/upstream-api-convergence.ts` `resolveBwsUpstreamApiConvergenceConfig` `L151-L244` `4f066cc40d08e6ad4748866073c0a14683bd8b7066cb9f41c87f239e28ae5a63`

**Required tests.**
- Page-2 contract/profile/generation/commit/resource drift cases must fail without advancing the durable cursor.
- Reordered and replayed pages must converge deterministically only when the ordered receipt chain is identical.

**Blocks release/deployment.** `true`

## BWS116-R01-006 — Cursor traversal lacks a complete fail-closed proof against repetition, cycles, and non-progress

- Severity: `P2`
- Confidence: `CONFIRMED`
- Primary owner: `R01`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R01`

**Invariant.** Pagination must terminate or fail deterministically on cursor repetition/non-progress and remain bounded by explicit pages, records, bytes, and aggregate deadline.

**Trigger.** The pagination loop follows `next`/cursor metadata without retaining a visited-cursor set and without a single cycle-wide page/record/time budget enforced at the production entrypoint.

**Current behavior.** The available guards do not jointly prove progress and boundedness for all cursor-cycle shapes and all retries/pages. Some malformed streams can consume the per-request budget repeatedly or terminate with ambiguous partial state.

**Expected behavior.** Pagination must terminate or fail deterministically on cursor repetition/non-progress and remain bounded by explicit pages, records, bytes, and aggregate deadline.

**Impact.** A provider defect or malicious endpoint can hold the controller, amplify requests, or leave partial convergence state that requires operator intervention.

**Root cause.** Boundedness is distributed across request-local constants rather than represented as convergence-cycle state.

**Minimal fix boundary.** Add visited-cursor/non-progress checks and one explicit cycle budget over pages, records, bytes, retries, and wall-clock time. On violation, fail without promoting checkpoint/readiness.

**Current files and symbols.**
- `packages/bootstrap/src/adapters/betting-win-query-client.ts` `describeReadOnlyQueryApiClientBoundary` `L181-L183` `7b50ba9a6c6e0dd5486bdca723a6f6c605bd7609151e062fe72ee36100d307ae`

**Required tests.**
- Repeated cursor and two-node cursor cycle
- Empty page with nonterminal cursor
- Unique cursor stream beyond page/record/byte/deadline budgets
- Restart after bounded failure

**Blocks release/deployment.** `true`

## BWS116-R01-007 — Per-request timeout and retry controls do not establish one aggregate convergence deadline or late-result ownership

- Severity: `P2`
- Confidence: `CONFIRMED`
- Primary owner: `R01`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R01`

**Invariant.** One bounded cycle deadline and cancellation identity must govern contract negotiation, all pages, retries, parsing, persistence handoff, and late completions.

**Trigger.** The convergence cycle applies request-local timeout/retry constants independently per contract/page attempt without a single propagated absolute deadline and cycle ownership token.

**Current behavior.** The sum of pages × attempts × timeout/backoff can exceed any operator-visible cycle budget, while a late response can complete after the logical caller has timed out unless every continuation checks ownership.

**Expected behavior.** One bounded cycle deadline and cancellation identity must govern contract negotiation, all pages, retries, parsing, persistence handoff, and late completions.

**Impact.** Controllers can appear hung, overlap cycles, duplicate reads/import intents, or emit success after cancellation. This weakens BWS-600 lifecycle truth even when individual requests are bounded.

**Root cause.** Timeout and cancellation are scoped to fetch attempts rather than the owned convergence state machine.

**Minimal fix boundary.** Create an absolute cycle deadline and operation identity at the convergence entrypoint, pass remaining budget and cancellation through every call, and reject all late continuations before persistence/readiness effects.

**Current files and symbols.**
- `packages/bootstrap/src/operations/upstream-transport-constants.ts` `export` `L1-L4` `dd5591b1c0fd7d57aeeacba4c49d25d8bca77f6acfee324cc6441c87f0175c15`

**Required tests.**
- Late fetch resolution after abort
- Multi-page worst-case retry budget
- Cancellation between parse and persistence
- No duplicate cycle effects after caller timeout

**Blocks release/deployment.** `true`

## BWS116-R01-008 — Response-size enforcement occurs after fetch buffering and therefore is not a transport memory bound

- Severity: `P2`
- Confidence: `CONFIRMED`
- Primary owner: `R01`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R01`

**Invariant.** The client must cap compressed and decompressed bytes while streaming, abort before unbounded allocation, and reject bodies beyond the declared limit.

**Trigger.** The implementation obtains the complete response text/JSON before comparing its length or parsed cardinality with configured limits.

**Current behavior.** The limit is a post-buffer validation. It can reject an oversized body semantically, but only after memory and time have already been consumed.

**Expected behavior.** The client must cap compressed and decompressed bytes while streaming, abort before unbounded allocation, and reject bodies beyond the declared limit.

**Impact.** A malformed or compromised endpoint can cause excessive memory use and process termination despite a nominal response-size constant.

**Root cause.** The size control is implemented as schema/input validation rather than transport resource enforcement.

**Minimal fix boundary.** Replace full-body buffering with a bounded reader that accounts for decoded bytes, aborts immediately on overflow, and only then parses JSON. Preserve exact-body hashing from finding 004 while streaming.

**Current files and symbols.**
- `packages/bootstrap/src/adapters/betting-win-query-client.ts` `query` `L16-L29` `7b50ba9a6c6e0dd5486bdca723a6f6c605bd7609151e062fe72ee36100d307ae`

**Required tests.**
- Chunked body that crosses limit
- Incorrect/missing Content-Length
- Compressed expansion beyond limit
- Abort cleanup and no partial persistence

**Blocks release/deployment.** `true`

## BWS116-R01-009 — External-runtime URL validation is lexical and does not prove the destination is non-local across all address forms

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R01`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R01`

**Invariant.** Accepted BWS-600 endpoints must be proven non-loopback/non-local for canonical IPv4, IPv6, mapped forms, DNS answers, redirects, and every connection attempt; credentials/userinfo must be rejected.

**Trigger.** Preflight classifies externality from URL protocol/hostname text without canonical IP parsing plus controlled resolution and redirect-target enforcement.

**Current behavior.** The guard rejects known local forms but does not establish destination-level externality for all equivalent address representations and DNS/redirect changes.

**Expected behavior.** Accepted BWS-600 endpoints must be proven non-loopback/non-local for canonical IPv4, IPv6, mapped forms, DNS answers, redirects, and every connection attempt; credentials/userinfo must be rejected.

**Impact.** A local BWS service, dashboard, metadata endpoint, or other intranet target can potentially be reached while carrying an `external`-looking URL, defeating the external-runtime evidence boundary and creating SSRF exposure.

**Root cause.** Externality is treated as a configuration-string property instead of a property of each resolved connection destination.

**Minimal fix boundary.** At the R01 configuration/preflight boundary, reject userinfo and unsupported schemes, canonicalize literal addresses, resolve hostnames under a bounded policy, reject loopback/link-local/private/unspecified/multicast destinations as required, and revalidate every redirect/connection. Coordinate generic networking mechanics with R10/R06 without weakening API-only holds.

**Current files and symbols.**
- `packages/bootstrap/src/operations/external-runtime-preflight.ts` `createBwsExternalRuntimeCampaignManifest` `L248-L433` `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427`

**Required tests.**
- IPv6 loopback
- IPv4-mapped IPv6 loopback
- integer/legacy IPv4 forms accepted by runtime
- DNS to loopback/private
- redirect to local target
- userinfo and credential-bearing URL

**Blocks release/deployment.** `true`

## BWS116-R01-010 — Source, receive, verification, import, and consumption times are not jointly enforced as distinct currentness evidence

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R01`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R01`

**Invariant.** Currentness must be a fail-closed predicate over explicitly typed clocks with bounded skew, maximum source age, receive age, and consumption age; missing or future source time must remain unknown/rejected where required.

**Trigger.** Acceptance/currentness checks rely on one timestamp or derived age and do not preserve/enforce source event time, upstream snapshot time, local receive time, verification time, import time, and downstream consumption time separately.

**Current behavior.** Recent receipt can make retained/stale data appear current, while future timestamps can reduce calculated age. The resulting provenance cannot distinguish a fresh response containing old state from genuinely current upstream state.

**Expected behavior.** Currentness must be a fail-closed predicate over explicitly typed clocks with bounded skew, maximum source age, receive age, and consumption age; missing or future source time must remain unknown/rejected where required.

**Impact.** BWS-600 or BWS-710 can promote stale or temporally impossible resources, causing surebet decisions from outdated markets/quotes while status still reports current external evidence.

**Root cause.** Currentness is represented as a scalar age/status instead of a typed temporal evidence model.

**Minimal fix boundary.** Preserve all clock domains explicitly, prohibit blank/default collapse, apply bounded skew and age rules at preflight and consumption, and bind the values to immutable page receipts.

**Current files and symbols.**
- `packages/bootstrap/src/operations/external-runtime-preflight.ts` `createBwsExternalRuntimeCampaignManifest` `L248-L433` `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427`

**Required tests.**
- Fresh receive + stale source
- Future source time
- Missing source time
- Boundary skew
- Restart/consumption after evidence expiry

**Blocks release/deployment.** `true`

## BWS116-R02-001 — B1 complete-set acceptance proves only key cardinality, not mutually exclusive and exhaustive outcome semantics

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R02`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R02`

**Invariant.** A supported complete set must prove that its terminal outcomes are mutually exclusive, exhaustive, and mapped to the declared market shape, not merely count two or three distinct keys.

**Trigger.** Supply two distinct selection keys whose outcomeSide values are both "home" on both venues, then derive the B1 candidate.

**Current behavior.** The comparator checks 2/3 cardinality, unique selection keys, and pairwise equality of each key/side across venues. It never checks within-set semantic complementarity or exhaustiveness. Terminal scenarios are then generated one per key.

**Expected behavior.** A supported complete set must prove that its terminal outcomes are mutually exclusive, exhaustive, and mapped to the declared market shape, not merely count two or three distinct keys.

**Impact.** A duplicated or overlapping semantic outcome set can be treated as complete, allowing gross and net calculations over a portfolio that does not cover every terminal result.

**Root cause.** Outcome-set validity is represented as cardinality plus key uniqueness; canonical market-shape semantics are absent from the B1 complete-set gate.

**Minimal fix boundary.** Add an R02-owned market-shape outcome-set validator at the equivalence/terminal-scenario boundary. It must consume authoritative canonical outcome semantics and fail closed before quote selection. Do not change upstream canonical identity production.

**Current files and symbols.**
- `packages/bootstrap/src/identity/b1-market-equivalence.ts` `compareB1MarketOutcomeSetEquivalence / indexBySelectionEquivalence` `141-235` `b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75`
- `packages/bootstrap/src/identity/b1-market-equivalence.ts` `indexBySelectionEquivalence` `305-326` `b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75`
- `packages/bootstrap/src/identity/b1-selection-equivalence.ts` `compareB1SelectionEquivalence` `15-51` `ac7dcc2ddf2d9bf660931b639e10b6659ffe90ec8115ab80b765884784bc0ae2`
- `packages/bootstrap/src/scenarios/b1-terminal-scenario.ts` `buildB1TerminalScenarios` `15-52` `4f3ee12a400f4a034a177043213f785df2c6a60f33f8cdd85a84be652401b47c`

**Required tests.**
- Two-way home/home, away/away, yes/yes, no/no, over/over, under/under rejection tests.
- Three-way duplicate-side and missing-draw tests.
- Permutation/property tests proving exactly one terminal winner per valid market shape.

**Blocks release/deployment.** `true`

## BWS116-R02-002 — B1 market grouping and venue-pair identity omit provider and provider-generation authority

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R02`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R02`

**Invariant.** Every compared quote set must preserve and verify compatible provider ID and provider-generation identity, and the selected quote evidence must retain that authority.

**Trigger.** Combine rows from generation-001 and generation-002 while holding market key, venue IDs, rules, and selection keys constant.

**Current behavior.** ProviderId and providerGenerationId are present on input rows but are not compared by the market/outcome-set equivalence functions, are not part of the venue-pair key or grouping keys, and are dropped from selected quote contributions.

**Expected behavior.** Every compared quote set must preserve and verify compatible provider ID and provider-generation identity, and the selected quote evidence must retain that authority.

**Impact.** Historical/current generations or same-named venues from different providers can be merged into one candidate, while downstream economic records cannot identify the selected generation.

**Root cause.** The B1 local row contract carries provider authority, but the R02 identity composition narrows to market key plus venue string and strips generation evidence at quote selection.

**Minimal fix boundary.** Extend R02 equivalence, grouping, venue identity, and selected-quote contracts to bind provider and generation. Any definition of compatible cross-generation equivalence is an explicit R01 handoff and must not default to compatibility.

**Current files and symbols.**
- `packages/bootstrap/src/contracts/b1-local-types.ts` `B1MultiVenueMarketRow provider identity fields` `30-70` `22a43ced9a713e4144e343529a8940edfa00676659aa01f48f739e3f28ca03e1`
- `packages/bootstrap/src/identity/b1-market-equivalence.ts` `compareB1MarketEquivalence` `43-139` `b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75`
- `packages/bootstrap/src/identity/b1-market-equivalence.ts` `compareB1MarketOutcomeSetEquivalence` `141-235` `b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75`
- `packages/bootstrap/src/identity/b1-venue-pair-key.ts` `createB1VenuePairKey` `14-50` `3c1f4864a055c479d758ec070804a285aa1441ad7b14418061039d45d44517fa`
- `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` `groupRowsByMarketEquivalence / groupRowsByVenue` `318-359` `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543`
- `packages/bootstrap/src/opportunity/b1-gross-spread.ts` `B1GrossQuoteInput / B1GrossQuoteContribution` `10-26` `48ecd0e6402a23610f9582222e86e31c943948f31b6edf0896a66751edfddafb`

**Required tests.**
- Mixed-provider and mixed-generation rejection tests.
- Same venue ID under different providers collision tests.
- Selected quote evidence retention tests.
- Permutation tests across generation partitions.

**Blocks release/deployment.** `true`

## BWS116-R02-003 — B1 synchronization is pair-local and can combine terminal outcomes outside the configured global quote window

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R02`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R02`

**Invariant.** The complete selected terminal-outcome portfolio must be inside one explicit synchronization window, and the reported window must represent the actual selected-quote span.

**Trigger.** Use two outcome pairs with zero intra-pair skew but a 10,000 ms skew between the selected outcomes under maxComparisonWindowMs=100.

**Current behavior.** The code validates each selection pair separately, then reports the maximum intra-pair delta. It never compares selected quote timestamps across terminal outcomes and takes comparisonTimeUtc from the first pair.

**Expected behavior.** The complete selected terminal-outcome portfolio must be inside one explicit synchronization window, and the reported window must represent the actual selected-quote span.

**Impact.** A candidate can combine asynchronous terminal prices and report maxComparisonWindowMs=0 even though the selected portfolio spans seconds, creating stale-combination false positives.

**Root cause.** Synchronization scope is selection-pair local rather than candidate-global.

**Minimal fix boundary.** After best-quote selection, compute and enforce one candidate-global min/max snapshot span and bind comparison time/age evidence to every selected quote.

**Current files and symbols.**
- `packages/bootstrap/src/quotes/b1-quote-synchronization.ts` `synchronizeB1VenueQuotePair` `41-86` `4746d1bd364a7389a95b4aa912e66f66041c44fc51083dcd02a12e9ad1fa9bde`
- `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` `deriveVenuePairGrossCandidate` `166-216` `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543`
- `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` `acceptedCandidate` `238-273` `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543`
- `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` `maxComparisonWindow` `437-445` `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543`

**Required tests.**
- Two- and three-way cross-outcome skew tests.
- Boundary tests at window-1, window, and window+1.
- Permutation tests proving identical global span and decision.

**Blocks release/deployment.** `true`

## BWS116-R02-004 — B1 net economics accepts selected odds that are not value-bound to synchronized quote evidence

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R02`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R02`

**Invariant.** Net payout values must be derived from, or exactly value-bound to, the synchronized source row selected during gross derivation.

**Trigger.** Replace selectedQuotes decimalOddsMicro values 2,200,000 with 3,000,000 while leaving synchronized source rows at 2.18/2.20.

**Current behavior.** Shape validation checks selected quote field types. findSelectedSynchronizedQuote matches only selectionEquivalenceKey and venueOrBookmakerId. Net payout then uses the detached selected quote decimalOddsMicro without comparing it to synchronized row odds or source evidence.

**Expected behavior.** Net payout values must be derived from, or exactly value-bound to, the synchronized source row selected during gross derivation.

**Impact.** A forged, stale, or accidentally recomputed selected quote can inflate payout and pass positive worst-case net while the retained synchronization evidence proves different prices.

**Root cause.** The accepted-gross contract duplicates economic values without an immutable value/evidence binding, and the net gate verifies identity keys only.

**Minimal fix boundary.** Derive net odds directly from the matched synchronized row or bind selected quote values to an immutable row/evidence digest and verify all value, provider-generation, time, side, and outcome fields.

**Current files and symbols.**
- `packages/bootstrap/src/opportunity/b1-gross-spread.ts` `B1GrossQuoteContribution` `18-26` `48ecd0e6402a23610f9582222e86e31c943948f31b6edf0896a66751edfddafb`
- `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` `selected quote projection` `210-216` `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543`
- `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` `acceptedCandidate selectedQuotes/synchronizedQuotePairs` `252-272` `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543`
- `packages/bootstrap/src/economics/b1-net-spread.ts` `evaluateB1NetEconomics` `119-167` `0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b`
- `packages/bootstrap/src/economics/b1-net-spread.ts` `validateAcceptedB1GrossCandidateShape / findSelectedSynchronizedQuote` `275-369` `0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b`

**Required tests.**
- Detached-odds mutation rejection.
- OutcomeName/outcomeSide mutation rejection.
- Provider-generation/evidence/time mutation rejection.
- Exact derivation-to-net round-trip tests.

**Blocks release/deployment.** `true`

## BWS116-R02-005 — B1 integrated solver and net path is not bound to quote capacity or venue-limit decisions

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R02`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R02`

**Invariant.** Every accepted stake and net candidate must be derived from explicit capacity and venue-limit decisions bound to the selected source rows.

**Trigger.** Solve/evaluate stakes of 100 minor units for a selected quote whose availableSizeMinor is 1, without invoking the separate capacity primitive.

**Current behavior.** The backtest plan accepts caller-authored solver constraints and no capacity/venue-limit evidence. The solver and net evaluator never invoke evaluateB1QuoteCapacity. The standalone capacity primitive is used only in focused unit tests.

**Expected behavior.** Every accepted stake and net candidate must be derived from explicit capacity and venue-limit decisions bound to the selected source rows.

**Impact.** A candidate can be labeled net-positive despite being unfillable at the quote depth or violating the venue cap; capacity and limit blocker counts can be false.

**Root cause.** Capacity and venue-limit validation are disconnected primitives rather than authoritative inputs to stake-policy construction and net acceptance.

**Minimal fix boundary.** Introduce one R02 integration boundary that derives each leg max/min/step from selected quote capacity plus normalized venue limits and carries the resulting decisions through solver and net acceptance. Persistence changes belong to R03.

**Current files and symbols.**
- `packages/bootstrap/src/quotes/b1-capacity-model.ts` `B1CapacityPolicy / B1CapacityDecision / evaluateB1QuoteCapacity` `11-31` `6a98bd374fff19cd414d04fc3410ad944b234043733d8f258a383537e0a28617`
- `packages/bootstrap/src/quotes/b1-capacity-model.ts` `capacity enforcement` `70-118` `6a98bd374fff19cd414d04fc3410ad944b234043733d8f258a383537e0a28617`
- `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` `B1GeneralizedStakeVectorPolicy` `28-41` `822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0`
- `packages/bootstrap/src/economics/b1-net-spread.ts` `B1NetEconomicsPolicy / evaluateB1NetEconomics` `31-41` `0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b`
- `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` `B1CrossVenueBacktestPlan` `20-29` `b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4`
- `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` `runCandidateBacktest` `387-400` `b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4`

**Required tests.**
- End-to-end quote-depth-to-solver constraint tests.
- Stake above quote, venue, market, and portfolio cap rejection tests.
- Missing capacity/proxy and missing venue-limit tests.
- Capacity changes after selection must invalidate the candidate.

**Blocks release/deployment.** `true`

## BWS116-R02-006 — B1 generalized solver can reject feasible two-way and three-way integer stake vectors

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R02`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R02`

**Invariant.** The solver must return any deterministic feasible integer vector satisfying min/max/step and target worst-case net, even when terminal payouts are unequal.

**Trigger.** Two-way: odds [1.5,4.0], caps [(1,2,1),(1,1,1)], target worst-case 0. Three-way: odds [2.5,2.5,6.0], caps [(1,2,1),(1,2,1),(1,1,1)], target 0.

**Current behavior.** The algorithm searches a single common target payout and rounds every leg up to reach it. If one leg cannot reach that common target it returns CAPACITY_EXHAUSTED without exploring feasible unequal-payout vectors.

**Expected behavior.** The solver must return any deterministic feasible integer vector satisfying min/max/step and target worst-case net, even when terminal payouts are unequal.

**Impact.** Valid candidates can be falsely classified infeasible, suppressing B1 observations and distorting falsification, capacity, and conversion metrics.

**Root cause.** Common-target-payout construction is used as if it were a complete feasibility search, but it is only one sufficient family of vectors.

**Minimal fix boundary.** Replace or augment the R02 search with a complete bounded integer feasibility/optimization method for the declared two- and three-leg domains. Preserve deterministic objective and explicit search bounds.

**Current files and symbols.**
- `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` `solveB1GeneralizedStakeVector target search` `147-225` `822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0`
- `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` `initialTargetPayout / maxTargetPayout` `349-380` `822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0`
- `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` `buildStakesForTargetPayout` `382-445` `822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0`
- `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` `calculateScenarioNets` `447-469` `822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0`

**Required tests.**
- Brute-force oracle comparison over small domains for 2-way and 3-way cases.
- Unequal payout feasibility cases.
- Positive target-net, one-unit residual, tight cap, and non-unit step cases.
- Metamorphic scaling and permutation tests.
- Proof that returned vectors satisfy all constraints.

**Blocks release/deployment.** `true`

## BWS116-R02-007 — Unescaped delimiter-based composite keys collide for distinct B1 identities and constraints

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R02`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R02`

**Invariant.** Distinct typed tuples must have distinct deterministic encodings for keys, duplicate checks, candidate IDs, and scenario legs.

**Trigger.** Construct venue tuples ("a", "b::c") and ("a::b", "c"), or fee tuples split around a NUL character.

**Current behavior.** Keys are built by raw concatenation with ::, |, or NUL. Input validation requires non-empty strings but permits these delimiter characters.

**Expected behavior.** Distinct typed tuples must have distinct deterministic encodings for keys, duplicate checks, candidate IDs, and scenario legs.

**Impact.** Distinct venues/selections can alias, causing candidate identity collisions, false duplicate rejection, incorrect joins, or scenario-leg overwrites.

**Root cause.** Composite identity uses ambiguous delimiter serialization instead of a canonical injective tuple encoding.

**Minimal fix boundary.** Use one canonical structured/length-prefixed tuple encoder for all R02 keys or reject reserved characters at the authoritative parser. Coordinate persisted-key migrations with R03 rather than changing storage silently.

**Current files and symbols.**
- `packages/bootstrap/src/identity/b1-venue-pair-key.ts` `createB1VenuePairKey` `35-50` `3c1f4864a055c479d758ec070804a285aa1441ad7b14418061039d45d44517fa`
- `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` `buildCandidateId / buildVenuePairKeyForRows` `376-405` `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543`
- `packages/bootstrap/src/economics/b1-fee-matrix.ts` `normalizeB1FeeMatrix duplicate key` `102-117` `081e148be8c1e3ffce089cca44c14cb16fa94ee25ae06a320d422b23e9e37175`
- `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` `constraint-key construction and duplicate detection` `292-326` `822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0`
- `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` `buildConstraintKey` `512-514` `822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0`
- `packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts` `buildB1ScenarioLegKey` `400-402` `f48a4d0f697fcc2d9d48328ef665689807f3f97d6c74fbcba67b01520293a580`

**Required tests.**
- Delimiter injection for every key constructor.
- Round-trip/injectivity property tests over Unicode and control characters.
- Cross-module consistency tests for candidate, constraint, fee, and scenario keys.

**Blocks release/deployment.** `true`

## BWS116-R02-008 — B1 line equivalence compares raw decimal text and rejects numerically identical markets

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R02`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R02`

**Invariant.** Line equality must use one canonical fixed-point numeric representation with explicit scale and sign normalization.

**Trigger.** Compare otherwise identical spread/total rows using lineValue "1" and "1.0".

**Current behavior.** The parser validates syntax but preserves raw text; equivalence uses strict string equality.

**Expected behavior.** Line equality must use one canonical fixed-point numeric representation with explicit scale and sign normalization.

**Impact.** Equivalent markets are falsely blocked, reducing coverage and making results dependent on upstream formatting rather than value.

**Root cause.** No canonical numeric line representation is established before identity comparison.

**Minimal fix boundary.** Normalize line values to a bounded signed fixed-point tuple at intake or R02 comparison. R01 owns any upstream contract change; R02 owns numeric equality and key consumption.

**Current files and symbols.**
- `packages/bootstrap/src/contracts/betting-win-b1-resource-records.ts` `line_value parse` `386-397` `2068f5dea3a115cbbc4e7b7fde16774b9a0fc9c964be1550215cc2c7508604e8`
- `packages/bootstrap/src/contracts/betting-win-b1-resource-records.ts` `requireSignedDecimalString` `611-620` `2068f5dea3a115cbbc4e7b7fde16774b9a0fc9c964be1550215cc2c7508604e8`
- `packages/bootstrap/src/identity/b1-market-equivalence.ts` `compareB1MarketEquivalence line comparison` `82-87` `b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75`
- `packages/bootstrap/src/identity/b1-market-equivalence.ts` `compareOutcomeSetMarketContext line comparison` `274-279` `b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75`

**Required tests.**
- Equivalent textual forms tests.
- Negative-zero normalization.
- Scale/precision overflow and unsupported precision tests.
- Spread sign/viewpoint inversion tests.

**Blocks release/deployment.** `true`

## BWS116-R02-009 — Standard-binary complete-set assembly can mix YES and NO quotes from different source manifests

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R02`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R02`

**Invariant.** All legs in one complete-set snapshot must be bound to one compatible source manifest or an explicit multi-source synchronization/provenance receipt.

**Trigger.** Assemble a complete set with manifest hash a...a for YES and b...b for NO.

**Current behavior.** The quote contract carries quoteSourceManifestHash, but assembly checks only market ID, outcome uniqueness, and currency. The accepted complete set does not expose a quote-manifest identity.

**Expected behavior.** All legs in one complete-set snapshot must be bound to one compatible source manifest or an explicit multi-source synchronization/provenance receipt.

**Impact.** Quotes from different snapshots or source lineages can be combined into a false complete set while the output advertises only the identity-record provider generation.

**Root cause.** Quote provenance is available but omitted from complete-set coherence and output identity.

**Minimal fix boundary.** Require exact compatible quote-manifest binding during standard complete-set assembly and retain the accepted source identity in the complete-set contract.

**Current files and symbols.**
- `packages/bootstrap/src/contracts/betting-win-resource-records.ts` `BettingWinQuoteRecord` `31-40` `8ca3a040b691242eb1025ab74f545157c1072b85332fdc1313924e57396c6903`
- `packages/bootstrap/src/scenarios/complete-set.ts` `quote assembly and acceptance` `112-184` `bdea2ee4db048e553d69f379ab4599c28bae68e372b2821bacb2a64611c98bac`

**Required tests.**
- Mixed-manifest rejection.
- Missing/unknown manifest rejection.
- Single-manifest round trip.
- Explicit synchronization receipt path only if separately authorized.

**Blocks release/deployment.** `true`

## BWS116-R02-010 — Standard-binary quote freshness is per leg and permits an asynchronous YES/NO snapshot

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R02`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R02`

**Invariant.** The two terminal quotes must satisfy an explicit same-snapshot or bounded pairwise synchronization rule in addition to individual freshness.

**Trigger.** Evaluate one quote aged 59,999 ms and one current quote under a 60,000 ms age threshold.

**Current behavior.** The standard solver checks each quote independently against observedNowMs and never compares the two observedAt timestamps.

**Expected behavior.** The two terminal quotes must satisfy an explicit same-snapshot or bounded pairwise synchronization rule in addition to individual freshness.

**Impact.** Non-simultaneous YES/NO prices can be combined, creating false gross/stake feasibility and misleading paper results.

**Root cause.** Freshness and synchronization are conflated; only age-to-now is modeled.

**Minimal fix boundary.** Add an explicit standard-binary pair synchronization bound and report actual snapshot span. Preserve individual freshness as a separate check.

**Current files and symbols.**
- `packages/bootstrap/src/opportunity/standard-binary-stake-solver.ts` `StandardBinaryStakeVectorSolveOptions / freshness default` `13-45` `a68d4ea89b2ec4a7d83d8e2ced929732522e0e4af5a36efaac4712e88255dc92`
- `packages/bootstrap/src/opportunity/standard-binary-stake-solver.ts` `validateCompleteSetQuoteFreshness` `110-124` `a68d4ea89b2ec4a7d83d8e2ced929732522e0e4af5a36efaac4712e88255dc92`
- `packages/bootstrap/src/quotes/quote-freshness.ts` `checkQuoteFreshness` `10-33` `38a0042d488084145e2438fe30d9e5b0ed665733af97b561587ca78d5bb9718f`

**Required tests.**
- Pair-skew boundary tests.
- Individually fresh but mutually stale rejection.
- Same manifest with divergent timestamps.
- Permutation invariance.

**Blocks release/deployment.** `true`

## BWS116-R02-011 — Standard-binary quote contract omits stake increment and silently substitutes minimum stake as the rounding step

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R02`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R02`

**Invariant.** Minimum stake, maximum/depth, and increment must be independent explicit values bound to quote/venue authority.

**Trigger.** Build the standard stake-vector input for quotes with minStakeMinor=10; the derived step is automatically 10 regardless of the actual venue increment.

**Current behavior.** The standard quote type has no increment. deriveRoundingConstraints sets stepMinor equal to minStakeMinor and describes the minimum as a rounding step.

**Expected behavior.** Minimum stake, maximum/depth, and increment must be independent explicit values bound to quote/venue authority.

**Impact.** The solver can reject feasible stakes, accept invalid increments, or compute the wrong vector whenever min and step differ.

**Root cause.** The standard data contract collapses two independent venue constraints into one field.

**Minimal fix boundary.** Extend the standard quote/depth contract with an explicit bounded increment and derive rounding constraints from it. Upstream schema ownership is an R01 handoff; solver consumption is R02.

**Current files and symbols.**
- `packages/bootstrap/src/contracts/betting-win-resource-records.ts` `BettingWinQuoteRecord` `31-40` `8ca3a040b691242eb1025ab74f545157c1072b85332fdc1313924e57396c6903`
- `packages/bootstrap/src/opportunity/standard-binary-stake-solver.ts` `deriveRoundingConstraints` `209-238` `a68d4ea89b2ec4a7d83d8e2ced929732522e0e4af5a36efaac4712e88255dc92`
- `packages/bootstrap/src/solver/stake-vector.ts` `StakeVectorRoundingConstraint` `5-14` `d5022b515bbac8672ed337933887276d590424c89b75c3e5acd290f3a5561029`

**Required tests.**
- min != step cases.
- min not divisible by step cases.
- step greater/less than min.
- Capacity boundary after rounding.
- Missing increment fail-closed test.

**Blocks release/deployment.** `true`

## BWS116-R02-012 — Standard scenario cash-flow validator accepts incomplete and non-rectangular matrices

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R02`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R02`

**Invariant.** A matrix validator must prove the full scenario-by-leg rectangle, stable stake/cost terms, unique cells, and complete terminal winner coverage.

**Trigger.** Pass two rows, one for each scenario, both using the same leg ID.

**Current behavior.** The exported validator checks row shape and distinct scenario IDs only. It does not check leg cardinality, unique scenario-leg cells, or every leg in every scenario. The solver adds one later leg-count check, but the validator itself returns accepted.

**Expected behavior.** A matrix validator must prove the full scenario-by-leg rectangle, stable stake/cost terms, unique cells, and complete terminal winner coverage.

**Impact.** Other callers can trust an invalid matrix, and tests/validators can falsely certify complete terminal cash-flow coverage.

**Root cause.** Scenario coverage is validated independently of leg coverage and matrix rectangularity.

**Minimal fix boundary.** Strengthen the R02 matrix validator to require unique scenario-leg cells, the complete leg set in every scenario, stable leg terms, and one coherent winner. Keep lifecycle simulation semantics in R04.

**Current files and symbols.**
- `packages/bootstrap/src/scenarios/scenario-cashflow.ts` `validateScenarioCashflowMatrix` `15-62` `11c1608a8d1cb5341f6125b9a30af4afd7c22aac64e228545636446b38476228`
- `packages/bootstrap/src/scenarios/scenario-cashflow.ts` `validateScenarioCoverage` `218-240` `11c1608a8d1cb5341f6125b9a30af4afd7c22aac64e228545636446b38476228`
- `packages/bootstrap/src/solver/stake-vector.ts` `solver post-validation shape checks` `73-88` `d5022b515bbac8672ed337933887276d590424c89b75c3e5acd290f3a5561029`

**Required tests.**
- One-leg/two-scenario rejection.
- Duplicate cell and missing cell tests.
- Extra leg/scenario rejection.
- Permutation and rectangularity property tests.

**Blocks release/deployment.** `true`

## BWS116-R02-013 — Locale-sensitive localeCompare calls make candidate, scenario, and solver ordering environment-dependent

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R02`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R02`

**Invariant.** Deterministic strategy output must use one locale-independent byte/code-point ordering contract.

**Trigger.** Sort selection keys ["a", "ä", "z"] under en_US.UTF-8 and sv_SE.UTF-8.

**Current behavior.** Multiple R02 paths use String.localeCompare without an explicit locale/options. The host locale controls order.

**Expected behavior.** Deterministic strategy output must use one locale-independent byte/code-point ordering contract.

**Impact.** Candidate order, stake order, scenario order, serialized hashes, and tie outcomes can differ across environments despite identical inputs.

**Root cause.** Determinism depends on ambient ICU collation rather than a repository-defined comparator.

**Minimal fix boundary.** Replace localeCompare with one canonical locale-independent comparator and apply it consistently to keys, tuples, scenarios, and tie-breaks.

**Current files and symbols.**
- `packages/bootstrap/src/opportunity/standard-binary-derivation.ts` `deriveStandardBinaryOpportunityCandidates ordering` `27-41` `04059b7cd11e946fd8f997d215732e514b5d03cf9faaf9ba86bb42910f25d653`
- `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` `sortRowsBySelection / sortedEntries` `362-374` `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543`
- `packages/bootstrap/src/scenarios/b1-terminal-scenario.ts` `compareSelectedQuotes` `55-60` `4f3ee12a400f4a034a177043213f785df2c6a60f33f8cdd85a84be652401b47c`
- `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` `compareCandidateQuotes` `526-535` `822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0`
- `packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts` `compareCashflowRows / compareLegTerms` `380-397` `f48a4d0f697fcc2d9d48328ef665689807f3f97d6c74fbcba67b01520293a580`

**Required tests.**
- Cross-locale golden tests.
- Unicode normalization and code-unit ordering property tests.
- Input permutation determinism tests.
- Stable serialized artifact hash tests.

**Blocks release/deployment.** `true`

## BWS116-R02-014 — B1 fee matrix cannot represent scenario-conditional or non-stake fee bases accepted by its venue-type domain

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R02`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R02`

**Invariant.** Fee authority must declare basis, side/role, condition, rounding, minimum/maximum, and version so each terminal scenario is charged correctly.

**Trigger.** Model a 2% commission on positive winnings at odds 3.0 and stake 100.

**Current behavior.** The only model is feeBps on stake plus fixedFeeMinor, keyed by venue and selection. The charge is computed before scenarios and subtracted from every scenario. Venue type is not consulted and no alternative basis can be represented.

**Expected behavior.** Fee authority must declare basis, side/role, condition, rounding, minimum/maximum, and version so each terminal scenario is charged correctly.

**Impact.** Net spread can be over- or understated, particularly for exchange commission and conditional fees; an unknown fee shape can still be encoded as if it were stake-based and accepted.

**Root cause.** Fee semantics are collapsed to one unconditional stake-percentage formula despite a heterogeneous venue domain.

**Minimal fix boundary.** Define versioned fee-basis unions and scenario-dependent fee cash flows in R02. Current provider-specific fee authority remains an R01 external-input requirement; do not guess venue schedules.

**Current files and symbols.**
- `packages/bootstrap/src/contracts/b1-local-types.ts` `B1VenueType / B1MultiVenueMarketRow` `10-12` `22a43ced9a713e4144e343529a8940edfa00676659aa01f48f739e3f28ca03e1`
- `packages/bootstrap/src/economics/b1-fee-matrix.ts` `B1FeeMatrixEntry / B1FeeCharge` `7-25` `081e148be8c1e3ffce089cca44c14cb16fa94ee25ae06a320d422b23e9e37175`
- `packages/bootstrap/src/economics/b1-fee-matrix.ts` `calculateB1FeeCharge` `27-83` `081e148be8c1e3ffce089cca44c14cb16fa94ee25ae06a320d422b23e9e37175`
- `packages/bootstrap/src/economics/b1-net-spread.ts` `fee application and scenario totals` `119-188` `0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b`

**Required tests.**
- Stake, payout, profit, liability, maker/taker, fixed, minimum, maximum, and conditional fee cases.
- Scenario-only charge tests.
- Unknown fee basis must block.
- Independent cash-flow oracle tests.

**Blocks release/deployment.** `true`

## BWS116-R03-001 — Migration discovery can escape the repository and the SQL scope scanner admits cross-schema executable DDL

- Severity: `P0`
- Confidence: `CONFIRMED`
- Primary owner: `R03`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R03`

**Invariant.** Migration bytes must come only from the realpath-confined repository database/migrations/surebet directory, and database-level authority must make writes outside surebet.* impossible.

**Trigger.** Load an absolute or traversal-resolved migration directory containing CREATE FUNCTION public.*, or a DO block that dynamically creates a public object, then pass the returned migrations to the normal application path.

**Current behavior.** Absolute and ../ migration directories are accepted. Cross-schema CREATE FUNCTION and dynamic DO SQL are accepted by the scanner. applySurebetMigrations would submit those bytes to psql.

**Expected behavior.** Migration bytes must come only from the realpath-confined repository database/migrations/surebet directory, and database-level authority must make writes outside surebet.* impossible.

**Impact.** A migration invocation can execute cross-schema DDL or other unreviewed SQL. This is a direct schema-ownership escape and meets the P0 taxonomy even though the 12 supplied migrations are currently confined.

**Root cause.** Migration authority is enforced by incomplete lexical matching and caller-selected filesystem paths rather than a fixed, realpath-confined source plus a database role restricted to surebet.*.

**Minimal fix boundary.** Confine the migration directory by realpath against the repository root, reject symlink and traversal escapes, remove ordinary caller override from production entrypoints, replace the incomplete regex as the security boundary, and require a database role whose privileges cannot create or mutate objects outside surebet.*.

**Current files and symbols.**
- `packages/persistence/src/psql.ts` `loadSurebetMigrationFiles` `94-153` `86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343`
- `packages/persistence/src/psql.ts` `SUREBET_MIGRATION_TARGET_PATTERNS / assertSurebetOnlyMigrationSql` `14-43; 219-265` `86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343`
- `packages/persistence/src/migrations.ts` `applySurebetMigrations` `41-90` `2ae8d8e9d9cdb6c08003371083c2065dd803ad5d82258f5be3166a17da01f57b`

**Required tests.**
- Absolute-path and ../ traversal rejection
- Symlink escape rejection
- CREATE FUNCTION/PROCEDURE/TRIGGER/TYPE/EXTENSION and GRANT/REVOKE rejection
- DO and dynamic SQL rejection
- Disposable PostgreSQL proof that the migration role cannot write outside surebet.*

**Blocks release/deployment.** `true`

## BWS116-R03-002 — The migration-status read path creates schema objects before reporting status

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R03`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R03`

**Invariant.** Status must report schema and ledger absence without creating either object.

**Trigger.** Run the migration-status operation.

**Current behavior.** The status path runs bootstrap DDL first, so an empty database is changed before status is calculated.

**Expected behavior.** Status must report schema and ledger absence without creating either object.

**Impact.** A read-only diagnostic can alter a database, manufacture the ownership state it is supposed to observe, require write privileges, and mask the distinction between never-initialized and initialized-with-no-migrations.

**Root cause.** Bootstrap creation was shared between apply and inspect paths instead of separating read-only catalog inspection from migration initialization.

**Minimal fix boundary.** Make status query pg_catalog/information_schema first and report absent objects. Keep MIGRATION_BOOTSTRAP_SQL exclusively in the explicit apply path.

**Current files and symbols.**
- `packages/persistence/src/migrations.ts` `listAppliedSurebetMigrations` `92-110` `2ae8d8e9d9cdb6c08003371083c2065dd803ad5d82258f5be3166a17da01f57b`
- `packages/bootstrap/src/operations/database-lifecycle.ts` `getBwsDatabaseMigrationStatus` `262-308` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `docs/037_database_backup_retention_and_recovery.md` `Migration status contract` `9-19` `6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10`

**Required tests.**
- Status against an empty disposable database leaves schema/table counts unchanged
- Status under a read-only role reports absence rather than failing or mutating
- Repeated status is observationally idempotent

**Blocks release/deployment.** `true`

## BWS116-R03-003 — Unknown applied migration rows are ignored and can be reported as compatible

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R03`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R03`

**Invariant.** A frozen binary must classify a divergent or newer migration lineage explicitly and fail closed unless a reviewed forward-compatibility rule proves it safe.

**Trigger.** Run migration status or apply from this archive.

**Current behavior.** The unknown row is ignored. If all known checksums match and the schema exists, status is compatible and apply proceeds with the current file set.

**Expected behavior.** A frozen binary must classify a divergent or newer migration lineage explicitly and fail closed unless a reviewed forward-compatibility rule proves it safe.

**Impact.** An older or divergent application can be allowed to operate against a schema it does not understand, producing false migration compatibility and unsafe rollback/upgrade decisions.

**Root cause.** The migration ledger is treated as a cache of known rows rather than authoritative schema lineage requiring explicit forward/backward compatibility.

**Minimal fix boundary.** Add unknownApplied entries to the status contract, make compatibility fail closed by default, and permit forward compatibility only through an explicit reviewed compatibility range or schema capability proof.

**Current files and symbols.**
- `packages/bootstrap/src/operations/database-lifecycle.ts` `buildMigrationChecksumMismatches` `1054-1075` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `packages/bootstrap/src/operations/database-lifecycle.ts` `getBwsDatabaseMigrationStatus` `278-305` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `packages/persistence/src/migrations.ts` `applySurebetMigrations` `45-84` `2ae8d8e9d9cdb6c08003371083c2065dd803ad5d82258f5be3166a17da01f57b`

**Required tests.**
- Ledger with one unknown applied migration is incompatible
- Renamed migration and same-SQL/different-name cases
- Older binary against newer schema
- Exact known set remains compatible

**Blocks release/deployment.** `true`

## BWS116-R03-004 — Concurrent migration applications are not serialized around ledger observation and insertion

- Severity: `P2`
- Confidence: `CONFIRMED`
- Primary owner: `R03`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R03`

**Invariant.** Exactly one migrator should own the schema transition; peers should wait and then observe the committed ledger.

**Trigger.** Both processes read the same pre-application ledger and attempt the same migration transaction.

**Current behavior.** Both callers can classify the migration as absent. One commits; the other can fail on the ledger primary key or on future non-idempotent DDL even though the database reached the desired state.

**Expected behavior.** Exactly one migrator should own the schema transition; peers should wait and then observe the committed ledger.

**Impact.** Concurrent startup can create false deployment failure, partial rollout behavior across processes, and nondeterministic operator results.

**Root cause.** Migration application assumes a single caller but the service/lifecycle architecture does not encode that assumption in PostgreSQL.

**Minimal fix boundary.** Acquire a repository-specific PostgreSQL advisory lock before bootstrap/ledger inspection, re-read under the lock, apply in deterministic order, and release only after the ledger row is durable.

**Current files and symbols.**
- `packages/persistence/src/migrations.ts` `applySurebetMigrations` `41-84` `2ae8d8e9d9cdb6c08003371083c2065dd803ad5d82258f5be3166a17da01f57b`

**Required tests.**
- Two concurrent migrators against a disposable database
- Second migrator waits and returns skipped rather than failing
- Crash while holding the lock and subsequent recovery

**Blocks release/deployment.** `true`

## BWS116-R03-005 — psql subprocesses have no explicit timeout or cancellation boundary

- Severity: `P2`
- Confidence: `CONFIRMED`
- Primary owner: `R03`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R03`

**Invariant.** Every database subprocess must have a bounded command budget, classified timeout, deterministic cleanup, and cancellation propagation from service shutdown.

**Trigger.** Invoke any repository, migration, status, scheduler, or worker persistence operation.

**Current behavior.** The Node process blocks synchronously until psql exits. Service pass timeouts cannot interrupt this child.

**Expected behavior.** Every database subprocess must have a bounded command budget, classified timeout, deterministic cleanup, and cancellation propagation from service shutdown.

**Impact.** A single blocked database command can freeze the event loop, prevent lease handling and graceful drain, and make configured service timeout values non-binding.

**Root cause.** The persistence abstraction omits command-budget and abort ownership from its public configuration.

**Minimal fix boundary.** Add a required bounded psql timeout and maximum output size, map timeout/termination distinctly, redact errors, and thread an abort/deadline policy through long-running service calls. Consider a pooled PostgreSQL driver for transactional and cancellation semantics.

**Current files and symbols.**
- `packages/persistence/src/psql.ts` `runPsql` `191-217` `86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343`

**Required tests.**
- Sleeping fake psql is terminated at the configured budget
- Blocked database query does not prevent service shutdown indefinitely
- Timeout is distinct from SQL failure and authentication failure

**Blocks release/deployment.** `true`

## BWS116-R03-006 — Repository idempotency claims use read-then-insert races instead of atomic create-or-compare operations

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R03`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R03`

**Invariant.** Equal requests should converge to one retained record; conflicting payloads should return the repository-specific deterministic conflict code.

**Trigger.** Both existence checks complete before either INSERT commits.

**Current behavior.** One INSERT wins and another surfaces a raw wrapped psql uniqueness failure. The loser does not re-read and compare the committed row.

**Expected behavior.** Equal requests should converge to one retained record; conflicting payloads should return the repository-specific deterministic conflict code.

**Impact.** Scheduler, convergence, import, and worker retries can be reported as failures even when the desired record is durable. Conflicting payloads lose their typed conflict semantics, weakening recovery decisions.

**Root cause.** Idempotency is implemented as optimistic preflight reads rather than a database atomic claim keyed by identity and immutable payload digest.

**Minimal fix boundary.** Use one database round trip per create: INSERT ... ON CONFLICT DO NOTHING RETURNING, then fetch and compare in the same transaction; or encode identity plus immutable digest in a conflict-aware UPSERT that never overwrites.

**Current files and symbols.**
- `packages/persistence/src/repositories/upstream-lock-repository.ts` `SurebetUpstreamLockRepository.put` `32-88` `c77663c55b41255a4c1f455012d5427b55f8a5cf1c733e7b800cc334f407a8bc`
- `packages/persistence/src/repositories/import-run-repository.ts` `SurebetImportRunRepository.create` `60-115` `9bb1a79b2b27ea6cd3eaaf38cb22bb20148615a2400ff929b834ad2dbd08e00b`
- `packages/persistence/src/repositories/strategy-ledger-repository.ts` `SurebetStrategyLedgerRepository.create` `56-143` `a3874447d9cf6334eafd4eaf1e7a45c3cd95b48fe865fcc68ba1f5583ca32528`
- `packages/persistence/src/repositories/worker-job-repository.ts` `SurebetWorkerJobRepository.create` `220-270` `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e`
- `packages/persistence/src/repositories/private-paper-runtime-scheduler-checkpoint-repository.ts` `SurebetPrivatePaperRuntimeSchedulerCheckpointRepository.create` `74-121` `fd997e6c563e93a0055066ae7ffc64173402495429983e0574b6e929aa743489`
- `packages/persistence/src/repositories/b1-upstream-convergence-repository.ts` `SurebetB1UpstreamConvergenceRepository.create` `59-110` `468cde29f264349925fe65e33d5b7e05fb34390877bb0f2503345154160d6884`

**Required tests.**
- Concurrent equal creates converge to one success result
- Concurrent different creates return the typed conflict
- Unique secondary identities such as fingerprint/report hash are classified deterministically
- Scheduler/job restart uses the production repository, not an in-memory fake

**Blocks release/deployment.** `true`

## BWS116-R03-007 — Finalization and checkpoint advances validate expected state in one session but update by ID in another

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R03`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R03`

**Invariant.** Expected state must be part of the UPDATE predicate and exactly one transition may succeed; retries must compare the retained terminal payload.

**Trigger.** Both precondition reads observe the same current state, after which the updates execute in a different order.

**Current behavior.** The UPDATE predicates contain only the primary ID. Both callers can pass preflight validation and the later writer can replace the earlier terminal outcome or advance from stale state.

**Expected behavior.** Expected state must be part of the UPDATE predicate and exactly one transition may succeed; retries must compare the retained terminal payload.

**Impact.** Import outcomes, convergence cursors, scheduled cycle identities, and B1 terminal evidence can become last-writer-wins rather than monotonic and conflict-detecting. This permits skipped/reordered work and false terminality.

**Root cause.** Optimistic concurrency is enforced only in TypeScript, outside the database transaction that owns the state.

**Minimal fix boundary.** Move each transition into one SQL statement or transaction with current status/cursor/version in WHERE, use RETURNING, distinguish zero-row stale from missing, and compare retained terminal payloads for idempotent replay.

**Current files and symbols.**
- `packages/persistence/src/repositories/import-run-repository.ts` `SurebetImportRunRepository.finalize` `117-157` `9bb1a79b2b27ea6cd3eaaf38cb22bb20148615a2400ff929b834ad2dbd08e00b`
- `packages/persistence/src/repositories/upstream-api-convergence-repository.ts` `SurebetUpstreamApiConvergenceRepository.advance` `149-198` `298c9e2b2d874f5e11e7278893f00acaaaf16b48a47fde0cab41c33e59017ba0`
- `packages/persistence/src/repositories/upstream-export-convergence-repository.ts` `SurebetUpstreamExportConvergenceRepository.advance` `115-164` `dbfac37a5aac9e6139532312a0635f25f655c8739782e186f72bc6717bd79600`
- `packages/persistence/src/repositories/private-paper-runtime-scheduler-checkpoint-repository.ts` `SurebetPrivatePaperRuntimeSchedulerCheckpointRepository.advance` `201-236` `fd997e6c563e93a0055066ae7ffc64173402495429983e0574b6e929aa743489`
- `packages/persistence/src/repositories/b1-private-observation-repository.ts` `complete / block` `119-167` `a057be720b8d7794b5d3a29cac35879ea555a65f2238e085b98fb7ea730f9941`

**Required tests.**
- Two concurrent import finalizers with equal and conflicting outcomes
- Two API/export cursor advances from one expected cursor
- Two scheduler instances advancing one checkpoint
- Concurrent B1 complete versus block

**Blocks release/deployment.** `true`

## BWS116-R03-008 — Worker heartbeat, checkpoint, completion, and retry transitions omit the lease fence from their mutation predicates

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R03`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R03`

**Invariant.** Every lease-authorized mutation must atomically require status=leased, exact owner, exact token or epoch, and active lease in the same SQL statement.

**Trigger.** The worker passes requireOwnedActiveLease, then another transaction changes the row before the worker mutation executes.

**Current behavior.** Heartbeat, checkpoint job update, completion, and retry use WHERE job_id only. A stale operation can alter a later lease or race a conflicting transition; checkpoint insertion can publish after the job became terminal.

**Expected behavior.** Every lease-authorized mutation must atomically require status=leased, exact owner, exact token or epoch, and active lease in the same SQL statement.

**Impact.** A stale worker can extend a replacement lease, complete work after a retry/reclaim sequence, publish late checkpoints, or produce success/error ordering that does not correspond to a single owner. Duplicate economic/evidence effects become possible.

**Root cause.** Lease ownership and state mutation are split across psql sessions instead of encoded in one conditional database transition.

**Minimal fix boundary.** Use conditional UPDATE/CTE statements with job_id, status, lease_owner, lease_token, lease expiry, and optionally monotonic lease_epoch; use RETURNING and zero-row stale-owner classification. Keep checkpoint insert plus job metadata update atomic and fenced.

**Current files and symbols.**
- `packages/persistence/src/repositories/worker-job-repository.ts` `heartbeatLease / recordCheckpoint` `438-546` `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e`
- `packages/persistence/src/repositories/worker-job-repository.ts` `complete / fail` `609-692` `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e`
- `packages/persistence/src/repositories/worker-job-repository.ts` `requireOwnedActiveLease` `844-879` `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e`
- `packages/persistence/src/repositories/worker-job-repository.ts` `deadLetterOwnedJob` `882-962` `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e`

**Required tests.**
- Old worker completion after new claim
- Heartbeat racing retry and replacement claim
- Checkpoint racing success/dead-letter
- Completion versus retry race
- Exactly-once release of lease fields

**Blocks release/deployment.** `true`

## BWS116-R03-009 — Worker availability and lease validity are controlled by caller timestamps with inconsistent expiry boundaries

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R03`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R03`

**Invariant.** PostgreSQL should own lease-now and monotonic lease epochs, with one consistent half-open validity rule; business timestamps should be validated for chronology.

**Trigger.** Claim, heartbeat, completion, failure, or reap uses the supplied timestamp.

**Current behavior.** A future caller clock can claim retry work early and create long leases; a past clock can authorize late completion against real time or regress heartbeat fields. At equality, requireOwnedActiveLease accepts while reaper expires.

**Expected behavior.** PostgreSQL should own lease-now and monotonic lease epochs, with one consistent half-open validity rule; business timestamps should be validated for chronology.

**Impact.** Clock skew can create premature claims, effectively unbounded leases, stale-worker publication, and contradictory active/expired decisions.

**Root cause.** Deterministic test clocks were elevated into production concurrency authority instead of separating observable event time from database lease time.

**Minimal fix boundary.** Use database-generated lease timestamps and a monotonic lease epoch/fencing token; define validity as now < expires_at consistently; reject timestamp regression and preserve injected clocks only for non-authoritative evidence fields.

**Current files and symbols.**
- `packages/persistence/src/repositories/worker-job-repository.ts` `claimNext` `355-435` `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e`
- `packages/persistence/src/repositories/worker-job-repository.ts` `validateClaimRequest / validateHeartbeatRequest` `1166-1200` `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e`
- `packages/persistence/src/repositories/worker-job-repository.ts` `requireOwnedActiveLease / reapExpiredLeases` `751-879` `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e`

**Required tests.**
- Future-skew claim cannot claim not-yet-available work
- Past-skew completion after real expiry is rejected
- Exact expiry instant has one result
- Heartbeat cannot regress last_heartbeat_at or lease_expires_at

**Blocks release/deployment.** `true`

## BWS116-R03-010 — Expired leases are always dead-lettered even when retry budget remains

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R03`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R03`

**Invariant.** The durable policy must distinguish abandoned/unknown work, apply the configured retry budget when replay is safe, and dead-letter only on exhaustion or an explicit non-replayable policy.

**Trigger.** The next worker pass invokes reapExpiredLeases.

**Current behavior.** The reaper unconditionally writes dead_lettered with SUREBET_WORKER_JOB_LEASE_EXPIRED. No remaining retry calculation is performed.

**Expected behavior.** The durable policy must distinguish abandoned/unknown work, apply the configured retry budget when replay is safe, and dead-letter only on exhaustion or an explicit non-replayable policy.

**Impact.** Transient worker failure becomes permanent work loss. Standard and B1 private-paper cycles can be stranded even though their queue record was explicitly configured with retries.

**Root cause.** Lease expiration policy is hard-coded as terminal rather than derived from retry budget and idempotency/replay safety.

**Minimal fix boundary.** Add an explicit atomic expired-lease transition: retry_wait with next availability while budget remains and replay is authorized; dead_lettered only when exhausted or policy says outcome is unknown/non-replayable. Preserve prior lease evidence.

**Current files and symbols.**
- `packages/persistence/src/repositories/worker-job-repository.ts` `reapExpiredLeases / deadLetterExpiredLease` `751-830; 965-1037` `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e`
- `docs/035_continuous_service_supervisor_contract.md` `Required worker behavior` `65-72` `cae4ce541c65848974de8c4568e72b6d2d3d151d9f2c3eaf52cb50e6777c8505`
- `database/migrations/surebet/004_create_worker_jobs.sql` `surebet.worker_jobs` `1-111` `9756445dbfbdac6226413098d1253527578d9420543287842c30d034df162b9c`

**Required tests.**
- Expired first attempt with remaining retries moves to retry_wait
- Expired final attempt dead-letters
- Concurrent reapers transition once
- Unknown-side-effect policy remains fail-closed
- Recovered job cannot be finalized by stale worker

**Blocks release/deployment.** `true`

## BWS116-R03-011 — Configured service timeouts and shutdown signals do not cancel in-flight scheduler or worker work

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R03`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R03`

**Invariant.** The service must stop awaiting at the deadline, propagate cancellation to underlying work, stop renewing leases, fence late mutations, and report a distinct timeout/cancel state.

**Trigger.** The timeout fires or shutdownSignal is set while work is in flight.

**Current behavior.** Timeout only changes later classification. Both helpers await the original promise after the sentinel. Worker shutdown is checked only before new claims; the in-flight handler receives no cancellation and continues lease renewal.

**Expected behavior.** The service must stop awaiting at the deadline, propagate cancellation to underlying work, stop renewing leases, fence late mutations, and report a distinct timeout/cancel state.

**Impact.** Graceful shutdown can hang indefinitely, configured timeout budgets are false, late work can publish checkpoints/ledger/terminal results, and resource ownership is not released at the claimed deadline.

**Root cause.** Timeout and signal handling are observational wrappers rather than ownership/cancellation mechanisms threaded through worker handlers and repositories.

**Minimal fix boundary.** Introduce AbortSignal and absolute deadlines at service, pass, handler, adapter, and persistence boundaries; stop renewal on abort; return at timeout; fence late result publication by lease epoch/status; add cancelled/timed_out/unknown durable states as required.

**Current files and symbols.**
- `packages/bootstrap/src/workers/bounded-job-worker.ts` `RunBoundedWorkerPassRequest / runHandlerWithLeaseRenewal` `59-77; 313-347` `3f319fc5ad09636121698b36817f1762c4431dffb775535a2d62e3289b111dd7`
- `packages/bootstrap/src/operations/private-paper-worker-service.ts` `worker pass execution / raceWithTimeout` `379-395; 552-574` `1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36`
- `packages/bootstrap/src/operations/private-paper-scheduler-service.ts` `executePass / raceWithTimeout` `505-514; 531-553` `876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967`

**Required tests.**
- Never-settling worker handler exits service within timeout
- SIGTERM during handler stops lease renewal and prevents new durable writes
- Late handler resolution cannot complete the job
- Scheduler pass timeout returns without awaiting the pass
- Timer/listener cleanup occurs exactly once

**Blocks release/deployment.** `true`

## BWS116-R03-012 — Checkpoint, dead-letter, B1 child-row, and expired-lease reads are unbounded

- Severity: `P2`
- Confidence: `CONFIRMED`
- Primary owner: `R03`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R03`

**Invariant.** Persistence APIs must require bounded page sizes and stable cursors; maintenance transitions must process bounded batches atomically.

**Trigger.** A list/read/reaper call runs with default options or on a large B1 run.

**Current behavior.** Several methods issue no LIMIT. The reaper loads all expired jobs and then creates N additional psql sessions.

**Expected behavior.** Persistence APIs must require bounded page sizes and stable cursors; maintenance transitions must process bounded batches atomically.

**Impact.** Memory, output-buffer, process-count, and database-load spikes can block workers and lifecycle diagnostics. Backpressure is undermined precisely during failure accumulation.

**Root cause.** Boundedness is enforced at selected service loops but omitted from repository contracts and maintenance queries.

**Minimal fix boundary.** Require explicit positive limits and stable keyset cursors; add a bounded bulk expired-lease CTE with SKIP LOCKED/RETURNING; page B1 children and dead letters.

**Current files and symbols.**
- `packages/persistence/src/repositories/worker-job-repository.ts` `listCheckpoints / listDeadLetters / reapExpiredLeases` `573-607; 720-830` `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e`
- `packages/persistence/src/repositories/b1-backtest-run-repository.ts` `listCandidates / listSimulationResults` `285-341` `fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04`

**Required tests.**
- Large-cardinality query plans use indexes and fixed limits
- Reaper handles at most batchSize and is repeatable
- Stable keyset ordering under concurrent inserts
- psql output remains below configured maximum

**Blocks release/deployment.** `true`

## BWS116-R03-013 — Import-run retention ignores convergence references, causing either deletion failure or dangling durable identity

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R03`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R03`

**Invariant.** The plan must exclude every retained reference and revalidate atomically before deletion; equivalent references must have consistent foreign-key semantics.

**Trigger.** Generate and apply an import_runs retention plan containing that run.

**Current behavior.** The candidate query does not inspect convergence tables. API checkpoint references make DELETE fail through the FK; export checkpoint references allow DELETE and leave last_import_run_id dangling.

**Expected behavior.** The plan must exclude every retained reference and revalidate atomically before deletion; equivalent references must have consistent foreign-key semantics.

**Impact.** Retention can produce a plan that cannot be applied or can destroy provenance required to reconstruct convergence state. Partial prune/recovery evidence becomes unreliable.

**Root cause.** Retention ownership and schema reference ownership were designed independently without one authoritative dependency graph.

**Minimal fix boundary.** Add consistent FKs or explicit immutable-reference tables, anti-join all retained references during planning, recheck in the delete transaction, and classify protected/skipped rows instead of failing the whole plan.

**Current files and symbols.**
- `packages/bootstrap/src/operations/database-lifecycle.ts` `buildRetentionPlanQuery / buildRetentionDeleteSql` `568-598; 854-875` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `database/migrations/surebet/005_create_upstream_export_convergence_checkpoints.sql` `surebet.upstream_export_convergence_checkpoints.last_import_run_id` `1-39` `8d3c09c06b61e4fb1774879c51467381b70bbe6f46c86c660345c63667089e3c`
- `database/migrations/surebet/006_create_upstream_api_convergence_checkpoints.sql` `surebet.upstream_api_convergence_checkpoints.last_import_run_id` `1-28` `3d5ac1c0f2d89aac08acb057668b87b2e9116f274ff78020568dc82522f270f7`
- `docs/037_database_backup_retention_and_recovery.md` `Retention contract` `44-54` `6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10`

**Required tests.**
- API-referenced import is excluded
- Export-referenced import is excluded
- Concurrent new reference between plan and apply is preserved
- Plan/apply deletedCount and protectedCount reconcile

**Blocks release/deployment.** `true`

## BWS116-R03-014 — Standard private-paper retries do not reconstruct durable previous cycle state

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R03`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R03`

**Invariant.** The same runtimeId/cycleId must be bound to one immutable input digest and prior state; equal replay returns the retained outcome and changed replay is rejected.

**Trigger.** The retry reconstructs the runtime request from the job payload and fetches current source pages.

**Current behavior.** No prior runtime state is persisted or supplied. validateRestartState immediately accepts absence. A changed source produces a different cycle fingerprint and a second ledger identity with the same logical runReferenceId.

**Expected behavior.** The same runtimeId/cycleId must be bound to one immutable input digest and prior state; equal replay returns the retained outcome and changed replay is rejected.

**Impact.** One logical private-paper cycle can produce divergent accepted/blocked evidence across retries, duplicate ledger effects, and a worker result that does not identify which cycle incarnation is authoritative.

**Root cause.** Restart state exists only as an optional in-memory API parameter, not as durable job/cycle authority.

**Minimal fix boundary.** Persist a private-paper cycle aggregate keyed by runtimeId/cycleId with immutable input/cycle digest, reconstruct previousState from durable rows, enforce unique logical run reference, and atomically link ledger outcome to worker terminal publication or make replay return the retained result.

**Current files and symbols.**
- `packages/bootstrap/src/workers/private-paper-runtime-jobs.ts` `PersistedPrivatePaperRuntimeJobPayload / toRuntimeRequest / handler` `47-56; 90-217; 586-613` `cbf9794410c3c374c7cd22844c5fd1c5fc4e51c7322856b921753479f4b0ca5c`
- `packages/bootstrap/src/runtime/private-paper-runtime.ts` `PrivatePaperRuntimeRequest / validateRestartState / buildNextState` `96-104; 981-1060` `252e38a52693f3fa598c9ea92a83b184de0c4b29c4ab0bd5c952b750d009c6f5`
- `packages/bootstrap/src/strategy/strategy-ledger.ts` `createPrivatePaperStrategyLedgerEntry` `237-267` `d05e339a5692a9218f2146c153570ee7d9c8d79ae88282e162b7ece0c0cb5dbc`
- `database/migrations/surebet/003_create_strategy_ledger_entries.sql` `surebet.strategy_ledger_entries` `1-60` `b3a7695bfba8fedaa0bb3fccefdde9ae11d893e63a67b493647f0818ce507071`

**Required tests.**
- Crash after runtime result, after ledger insert, and after final checkpoint
- Equal retry returns the same ledger/result
- Changed upstream bytes for same cycle are rejected
- Fresh process reconstructs previousState from PostgreSQL

**Blocks release/deployment.** `true`

## BWS116-R03-015 — B1 backtest persistence commits the parent before children and suppresses repair on replay

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R03`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R03`

**Invariant.** Parent and all expected children must commit atomically, or replay must verify and deterministically repair/reject an incomplete graph before presenting the run.

**Trigger.** Retry create with the same runId/runHash.

**Current behavior.** The parent persists first. On replay, matching parent causes an immediate return and no child completeness check or repair.

**Expected behavior.** Parent and all expected children must commit atomically, or replay must verify and deterministically repair/reject an incomplete graph before presenting the run.

**Impact.** A B1 run can appear durable and terminal while candidate or simulation evidence is missing. Reports and private observations can reference an incomplete backtest graph indefinitely.

**Root cause.** Aggregate persistence was decomposed into independent repository writes without an aggregate transaction or durable completion invariant.

**Minimal fix boundary.** Persist the entire run graph in one PostgreSQL transaction, or add expected child counts/digests and a completion state with locked deterministic repair. Readers must reject non-complete aggregates.

**Current files and symbols.**
- `packages/persistence/src/repositories/b1-backtest-run-repository.ts` `SurebetB1BacktestRunRepository.create` `127-186` `fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04`
- `packages/persistence/src/repositories/b1-backtest-run-repository.ts` `createCandidateSnapshot / createSimulationResults / insertSimulationResult` `354-448` `fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04`
- `database/migrations/surebet/009_create_b1_backtest_runs.sql` `surebet.b1_backtest_runs` `1-32` `c5b9b66325ca16346c48176236b73dea7fd79f51b5b18aba8ae73d33d7ad12ea`
- `database/migrations/surebet/010_create_b1_candidate_snapshots.sql` `surebet.b1_candidate_snapshots` `1-21` `83da55cee8bc46ca6f47b8584aaa81c08794a268f5147fc9bef320201a79b78a`
- `database/migrations/surebet/011_create_b1_simulation_results.sql` `surebet.b1_simulation_results` `1-20` `3e748cb212558268e675df42f809ce9e3cd29b8527a83fd9c00c5897341d15fa`

**Required tests.**
- Fault after parent insert
- Fault after each candidate and simulation insert boundary
- Replay repairs or rejects partial graph
- Readers never expose incomplete run as complete
- Concurrent equal creates converge

**Blocks release/deployment.** `true`

## BWS116-R03-016 — B1 observation terminality and worker-job terminality can diverge after a crash

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R03`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R03`

**Invariant.** Replay should detect the retained terminal observation and converge the worker job to the matching retained result without rerunning or contradicting terminal state.

**Trigger.** The same worker job is retried.

**Current behavior.** create returns the existing terminal observation, the backtest parent returns existing, then complete/block throws NOT_STARTED. The bounded worker converts the throw into a dead-letter result, so completed observation and dead-lettered job can coexist.

**Expected behavior.** Replay should detect the retained terminal observation and converge the worker job to the matching retained result without rerunning or contradicting terminal state.

**Impact.** Operational status, queue evidence, and B1 observation evidence disagree. A successful B1 result can be presented as a failed job, or blocked evidence can lose its original reason.

**Root cause.** Observation terminal persistence and worker terminal persistence were implemented as independent state machines without replay convergence.

**Minimal fix boundary.** Make terminal observation methods idempotent-by-payload, persist an authoritative handler outcome, and atomically or recoverably project it to the worker job. Add FK/unique binding between job and observation where appropriate.

**Current files and symbols.**
- `packages/bootstrap/src/workers/b1-private-observation-jobs.ts` `createB1PrivateObservationJobHandler.run` `59-137` `ee293ef0e7a3edeef6ef6729c987f477f049523ccd3d0b150b874796e032a5cc`
- `packages/persistence/src/repositories/b1-private-observation-repository.ts` `create / complete / block` `73-167; 268-293` `a057be720b8d7794b5d3a29cac35879ea555a65f2238e085b98fb7ea730f9941`
- `packages/bootstrap/src/workers/bounded-job-worker.ts` `runBoundedWorkerPass terminal dispatch` `180-218` `3f319fc5ad09636121698b36817f1762c4431dffb775535a2d62e3289b111dd7`
- `database/migrations/surebet/012_create_b1_private_observation_cycles.sql` `surebet.b1_private_observation_cycles` `1-37` `5c4858bb130178460e45226677c6cc74610628badeca3632425c0a0838a474a6`

**Required tests.**
- Crash after observation complete before job complete
- Crash after observation block before job dead-letter
- Retry converges without rerunning backtest
- Conflicting retained terminal payload is rejected

**Blocks release/deployment.** `true`

## BWS116-R03-017 — Durable lifecycle tables accept impossible timestamp orderings

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R03`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R03`

**Invariant.** Application validation and PostgreSQL CHECK constraints must preserve causal ordering, while retaining explicit source/event timestamps separately when out-of-order arrival is legitimate.

**Trigger.** Create/finalize/heartbeat/checkpoint/complete with a terminal timestamp before the start or prior durable event.

**Current behavior.** Rows can satisfy all current constraints while completed_at precedes started_at, B1 completion precedes cycle start, or checkpoints/heartbeats regress.

**Expected behavior.** Application validation and PostgreSQL CHECK constraints must preserve causal ordering, while retaining explicit source/event timestamps separately when out-of-order arrival is legitimate.

**Impact.** Sorting, retention cutoffs, recovery decisions, duration metrics, and evidence truth can be wrong while rows appear terminal and schema-valid.

**Root cause.** Timestamp syntax validation was not paired with semantic chronology constraints at repository or schema boundaries.

**Minimal fix boundary.** Add explicit chronology validation and CHECK constraints for each state machine; use database authoritative transition time where appropriate; preserve source occurrence time separately from receive/persist time.

**Current files and symbols.**
- `database/migrations/surebet/001_create_upstream_locks_and_import_runs.sql` `surebet.import_runs` `16-36` `9e42a36b06adc858c25e72c4fd6ab41500cdfdcbbb3e0a7ae556efd2ec771584`
- `packages/persistence/src/repositories/import-run-repository.ts` `validatePendingRecord / validateFinalizeRecord` `194-230` `9bb1a79b2b27ea6cd3eaaf38cb22bb20148615a2400ff929b834ad2dbd08e00b`
- `database/migrations/surebet/004_create_worker_jobs.sql` `surebet.worker_jobs and checkpoints` `1-153` `9756445dbfbdac6226413098d1253527578d9420543287842c30d034df162b9c`
- `database/migrations/surebet/012_create_b1_private_observation_cycles.sql` `surebet.b1_private_observation_cycles` `1-34` `5c4858bb130178460e45226677c6cc74610628badeca3632425c0a0838a474a6`
- `packages/persistence/src/repositories/b1-private-observation-repository.ts` `validateCreateRecord / validateCompleteRecord / validateBlockRecord` `220-249; 303-322` `a057be720b8d7794b5d3a29cac35879ea555a65f2238e085b98fb7ea730f9941`

**Required tests.**
- Import requested/start/complete permutations
- Worker claim/heartbeat/checkpoint/complete regression
- B1 cycle completion before start
- Boundary equality cases
- Migration of any existing invalid rows is fail-closed and reported

**Blocks release/deployment.** `true`

## BWS118-R04-001 — Completion replay has no immutable event or attempt identity, so duplicates are either rejected as ambiguous or applied twice

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R04`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R04`

**Invariant.** Each provider event or execution attempt must carry an immutable identity. An exact duplicate must be idempotent, while the same identity with a different payload must fail closed.

**Trigger.** Submit the same logical fill twice at the same timestamp, or submit it again with a different timestamp.

**Current behavior.** The event contracts have no event ID, attempt ID, source receipt, sequence, or payload digest. Same-leg same-time duplicates are rejected as ordering ambiguity, while a timestamp-shifted duplicate is treated as a second fill and added to the accumulator.

**Expected behavior.** Each provider event or execution attempt must carry an immutable identity. An exact duplicate must be idempotent, while the same identity with a different payload must fail closed.

**Impact.** Restart, retry, or page replay can change filled stake, residual exposure, settlement, and reported profitability. Exact replays are not convergent.

**Root cause.** Replay ordering is used as a substitute for event identity and idempotency. The state machine cannot distinguish a retry from a second real fill.

**Minimal fix boundary.** Add an immutable provider-event/attempt identity and source receipt to the standard and B1 completion event boundaries, make replay create-or-compare idempotent by that identity, and preserve conflict evidence. Durable transaction mechanics remain R03-owned.

**Current files and symbols.**
- `packages/bootstrap/src/simulation/non-atomic-completion.ts` `NonAtomicCompletionEvent` `L38-L43` `3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df`
- `packages/bootstrap/src/simulation/non-atomic-completion.ts` `replayLegEvents / validateNoSameLegTimestampTies` `L375-L504` `3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df`
- `packages/bootstrap/src/simulation/non-atomic-completion.ts` `applyEvent` `L530-L575` `3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df`
- `packages/bootstrap/src/simulation/b1-leg-completion.ts` `B1FillabilityEvent` `L36-L42` `108996f173a566dfb8b72de38c364d3f1d7b3610bcceadbe6c415d94a5fc5b3b`
- `packages/bootstrap/src/simulation/b1-leg-completion.ts` `replayB1FillabilityEvents / validateNoSameLegTimestampTies` `L259-L430` `108996f173a566dfb8b72de38c364d3f1d7b3610bcceadbe6c415d94a5fc5b3b`

**Required tests.**
- Exact duplicate event in the same and different array positions is a no-op.
- Same immutable event ID with any changed type, stake, leg, timestamp, or receipt is blocked.
- Restart/replay permutation tests produce byte-identical completion and residual snapshots.
- Durable duplicate delivery test handed to R03 verifies one economic effect after crash and retry.

**Blocks release/deployment.** `true`

## BWS118-R04-002 — Fill simulation records stake only and reuses planned odds and cash-flow terms instead of actual execution terms

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R04`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R04`

**Invariant.** A fill must preserve actual stake, price/odds, fees/costs, source time, receive time, provider generation, and immutable receipt before residual or settlement economics are calculated.

**Trigger.** Replay a fill event that should carry actual execution price/odds, fee, slippage, capacity source, or provider receipt.

**Current behavior.** Standard and B1 fill events contain only stake and time. Residual exposure scales the precomputed plan matrix by filled stake, and B1 settlement calculates payout from the planned scenario rows. No actual execution price, fee, slippage, or source receipt can affect the result.

**Expected behavior.** A fill must preserve actual stake, price/odds, fees/costs, source time, receive time, provider generation, and immutable receipt before residual or settlement economics are calculated.

**Impact.** Simulated residual loss, settled net, and false-positive classification can be materially wrong even when fill quantity is correct. The system cannot audit a deviation between quoted, planned, and executed terms.

**Root cause.** The completion boundary models quantity transitions but not execution terms, while downstream economics assume planned matrix terms remain authoritative after fill.

**Minimal fix boundary.** Introduce immutable actual-fill terms and a quote-to-fill receipt at the simulation boundary, then compute residual and settlement from accepted actuals. Pure quote and solver mathematics remain R02-owned.

**Current files and symbols.**
- `packages/bootstrap/src/simulation/non-atomic-completion.ts` `NonAtomicCompletionEvent` `L38-L43` `3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df`
- `packages/bootstrap/src/simulation/b1-leg-completion.ts` `B1FillabilityEvent` `L36-L42` `108996f173a566dfb8b72de38c364d3f1d7b3610bcceadbe6c415d94a5fc5b3b`
- `packages/bootstrap/src/simulation/non-atomic-completion.ts` `analyzeNonAtomicResidualExposure / sumScenarioNetForLiveFilledUnits` `L701-L802` `3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df`
- `packages/bootstrap/src/simulation/b1-residual-exposure.ts` `buildScenarioNets` `L200-L245` `95752368da2da1bae3778ca9eae94892cb06db0876a8655beba9c6127c26a516`
- `packages/bootstrap/src/simulation/b1-settlement-replay.ts` `calculateSettledNetMinor` `L705-L745` `d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d`

**Required tests.**
- Adverse and favorable slippage change residual and settled net deterministically.
- Fill fee and fixed fee are included exactly once.
- Planned quote identity differs from actual fill receipt and is preserved rather than overwritten.
- Missing actual execution terms block any metric that claims settled or residual economics.

**Blocks release/deployment.** `true`

## BWS118-R04-003 — Standard partial fill followed by rejection or expiry loses the terminal disposition in the public leg snapshot

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R04`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R04`

**Invariant.** The snapshot must preserve both the partial filled quantity and the terminal disposition of the unfilled remainder, or expose an exhaustive compound state.

**Trigger.** Replay fill(less than plan) followed by reject or expire on the same leg.

**Current behavior.** The accumulator stores terminalDisposition internally, but the public snapshot omits it. deriveLegState checks liveFilledStakeMinor before terminalDisposition and therefore emits leg_partial, making partial+rejected and partial+expired indistinguishable from a still-open partial leg.

**Expected behavior.** The snapshot must preserve both the partial filled quantity and the terminal disposition of the unfilled remainder, or expose an exhaustive compound state.

**Impact.** Reports, recovery, settlement, and operators cannot tell whether more fill is possible or whether the remainder is terminal. State may appear nonterminal after a terminal provider outcome.

**Root cause.** The standard state model compresses two independent dimensions, fill quantity and terminal disposition, into one precedence-ordered enum and drops the secondary dimension.

**Minimal fix boundary.** Expose terminalDisposition in NonAtomicPaperLegSnapshot or replace the enum with an exhaustive compound lifecycle representation; update settlement/report consumers without changing B1 semantics unnecessarily.

**Current files and symbols.**
- `packages/bootstrap/src/simulation/non-atomic-completion.ts` `LegAccumulator` `L100-L107` `3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df`
- `packages/bootstrap/src/simulation/non-atomic-completion.ts` `applyEvent reject/expire` `L577-L612` `3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df`
- `packages/bootstrap/src/simulation/non-atomic-completion.ts` `freezeLegSnapshot / deriveLegState` `L637-L679` `3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df`

**Required tests.**
- Partial+rejected and partial+expired snapshots retain both quantity and terminal disposition.
- Recovery and report round trips preserve the compound state.
- A subsequent fill after terminal remains blocked.
- An open partial leg remains distinguishable from a terminal partial leg.

**Blocks release/deployment.** `true`

## BWS118-R04-004 — Manual or residual-floor kill is an unordered boolean that can retroactively relabel a fully completed group as killed

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R04`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R04`

**Invariant.** Kill must be an ordered lifecycle event with identity and timestamp, and it must not rewrite economic facts that completed before the kill. The model must distinguish stop-future-work from cancellation, liquidation, and completed exposure.

**Trigger.** Evaluate a completed event history with manualKill=true or trigger the residual-floor kill rerun.

**Current behavior.** manualKill is an input boolean outside the ordered event stream. deriveGroupState returns group_killed before checking whether every leg is filled. The private runtime may rerun the identical completion history with only manualKill changed to true.

**Expected behavior.** Kill must be an ordered lifecycle event with identity and timestamp, and it must not rewrite economic facts that completed before the kill. The model must distinguish stop-future-work from cancellation, liquidation, and completed exposure.

**Impact.** A fully completed portfolio can be represented as killed without saying when or what was stopped. Reports cannot reconstruct whether the kill preceded fills, followed completion, or had any economic effect.

**Root cause.** Kill authority is modeled as an unordered final label instead of an immutable, causally ordered transition with a defined effect.

**Minimal fix boundary.** Represent kill request/acceptance/effect as explicit ordered evidence, define terminal precedence, and preserve completed fills and post-kill prohibited work separately. Generic cancellation propagation remains R06-owned.

**Current files and symbols.**
- `packages/bootstrap/src/simulation/non-atomic-completion.ts` `NonAtomicCompletionInput` `L80-L85` `3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df`
- `packages/bootstrap/src/simulation/non-atomic-completion.ts` `freezeCompletionSnapshot / deriveGroupState` `L649-L698` `3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df`
- `packages/bootstrap/src/runtime/private-paper-runtime.ts` `simulateRuntimeCandidate` `L878-L924` `252e38a52693f3fa598c9ea92a83b184de0c4b29c4ab0bd5c952b750d009c6f5`

**Required tests.**
- Kill before any fill prevents subsequent modeled work and retains kill time/receipt.
- Kill after full completion preserves group_complete plus a separate post-completion stop marker.
- Residual-floor kill has deterministic trigger evidence and no duplicate rerun effect.
- Permutation and restart tests retain causal order.

**Blocks release/deployment.** `true`

## BWS118-R04-005 — B1 settlement and false-positive economics omit fees, quote-age penalties, and capital-lock cost accepted by net evaluation

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R04`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R04`

**Invariant.** Settlement and false-positive classification must carry forward every accepted economic cost exactly once, or explicitly reconcile actual settlement costs against the net model.

**Trigger.** Compare netCandidate.worstCaseNetMinor with settlementReplay.settledNetMinor under nonzero accepted costs.

**Current behavior.** Net evaluation subtracts total fees, quote-age penalties, and capital-lock cost. Settlement replay ignores those values and computes each leg as planned payout minus live filled stake. falsePositive is then based on this gross settlement number.

**Expected behavior.** Settlement and false-positive classification must carry forward every accepted economic cost exactly once, or explicitly reconcile actual settlement costs against the net model.

**Impact.** A net-negative or materially weaker result can be reported as a positive settled result and not counted as a false positive. Backtest profitability is internally inconsistent across stages.

**Root cause.** The backtest passes only the stake/payout scenario matrix and fillability snapshots into settlement, dropping the net-economics cost ledger at the stage boundary.

**Minimal fix boundary.** Bind settlement analysis to the accepted net-economics cost breakdown or a settlement-cost ledger and define cost reconciliation. R02 retains ownership of cost formulas and fee expressiveness.

**Current files and symbols.**
- `packages/bootstrap/src/economics/b1-net-spread.ts` `evaluateB1NetEconomics` `L114-L214` `0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b`
- `packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts` `B1ScenarioCashflowRow / buildB1ScenarioCashflowMatrix` `L11-L87` `f48a4d0f697fcc2d9d48328ef665689807f3f97d6c74fbcba67b01520293a580`
- `packages/bootstrap/src/simulation/b1-settlement-replay.ts` `analyzeB1SettlementReplay` `L168-L203` `d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d`
- `packages/bootstrap/src/simulation/b1-settlement-replay.ts` `calculateSettledNetMinor` `L705-L745` `d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d`

**Required tests.**
- Nonzero percentage fee reduces settled net exactly once.
- Quote-age and capital-lock costs survive fill and settlement stages.
- A candidate whose gross settlement is positive but net settlement is nonpositive is marked false positive.
- Zero-cost control retains existing result.

**Blocks release/deployment.** `true`

## BWS118-R04-006 — Settlement domains cannot represent void, refund, push, reopen, or generation lifecycle despite claiming replay coverage

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R04`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R04`

**Invariant.** The replay contract must encode the native terminal action, monetary consequence, revision/supersession relation, generation, and reopen/finality state without coercing it to a winner.

**Trigger.** Supply lifecycle evidence that is not simply a yes/no or one B1 selection final outcome.

**Current behavior.** The standard consumed record supports only finalOutcome yes/no. The B1 record supports one finalOutcomeSelectionEquivalenceKey plus static settlementRuleVersion/voidRuleId compatibility. The B1 “void-rule replay” only verifies equal IDs and never represents an actual void, refund amount, push, reopen, or supersession event.

**Expected behavior.** The replay contract must encode the native terminal action, monetary consequence, revision/supersession relation, generation, and reopen/finality state without coercing it to a winner.

**Impact.** Unsupported terminal events cannot be faithfully replayed. They may be blocked elsewhere, coerced into a winner, or omitted from reports, and no deterministic recovery contract exists for reopened outcomes.

**Root cause.** Rule compatibility identifiers are treated as if they were lifecycle evidence, while the replay state machines model only winner replacement over time.

**Minimal fix boundary.** Add explicit provider-bound terminal lifecycle records and monetary effects, with unsupported states held fail-closed. Canonical upstream rule semantics remain external/R10-owned; BWS replay projection is R04-owned.

**Current files and symbols.**
- `packages/bootstrap/src/simulation/settlement-replay.ts` `ConsumedSettlementReplay` `L19-L29` `7967faca4d58a884c8c6762aaccac6fd1f04c630a3d5632f54c273202c89e8d2`
- `packages/bootstrap/src/simulation/b1-settlement-replay.ts` `B1SettlementReplayRecord` `L30-L35` `d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d`
- `packages/bootstrap/src/simulation/b1-void-rule-replay.ts` `B1VoidRuleReplayRecord / validateB1VoidRuleReplay` `L8-L85` `107607954dc2d9cf911e51e8e68d39592d4b5d8f06cddfcdb018ed92212ad2fb`

**Required tests.**
- Void with full refund, partial refund, push, cancellation, and reopen cases.
- Generation change or reorg cannot join the prior lifecycle without explicit authority.
- Unsupported terminal action remains held and never produces settled profitability.
- Round-trip replay preserves action, amount, currency, revision, and source receipt.

**Blocks release/deployment.** `true`

## BWS118-R04-007 — Correction and finality progression are inferred from timestamp and outcome changes without explicit revision authority

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R04`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R04`

**Invariant.** Every correction or finality advance must be explicitly bound to a monotonic provider revision, superseded record, transition type, generation, and authoritative receipt.

**Trigger.** Add a later replay with the same outcome or a different outcome, regardless of whether it declares a correction or finality transition.

**Current behavior.** Both standard and B1 replay sequences count a later same-outcome record as finality progression and a later different-outcome record as correction solely by timestamp and value comparison. There is no revision number, supersedes hash, correction reason, prior-state digest, or finality-state field.

**Expected behavior.** Every correction or finality advance must be explicitly bound to a monotonic provider revision, superseded record, transition type, generation, and authoritative receipt.

**Impact.** Unrelated duplicate snapshots, delayed pages, mixed generations, or reordered retained evidence can manufacture corrections/finality and select an arbitrary latest result.

**Root cause.** Temporal succession is conflated with semantic supersession and finality progression.

**Minimal fix boundary.** Require explicit revision/supersession/finality transition evidence and reject gaps, forks, regressions, mixed generations, or unverifiable latest pointers. Upstream provenance fields remain R01-owned.

**Current files and symbols.**
- `packages/bootstrap/src/simulation/settlement-replay.ts` `consumeStandardBinarySettlementReplaySequence` `L333-L392` `7967faca4d58a884c8c6762aaccac6fd1f04c630a3d5632f54c273202c89e8d2`
- `packages/bootstrap/src/simulation/b1-settlement-replay.ts` `resolveB1SettlementReplaySequence` `L400-L445` `d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d`

**Required tests.**
- Same-outcome duplicate snapshot does not advance finality without transition evidence.
- Changed outcome does not count as correction without explicit supersession.
- Revision gaps, forks, regressions, mixed generations, and equal revisions conflict deterministically.
- Permutation/restart tests resolve one identical authoritative chain.

**Blocks release/deployment.** `true`

## BWS118-R04-008 — B1 backtest has no cross-stage decision chronology and accepts settlement before quotes with fills after settlement

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R04`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R04`

**Invariant.** Backtest orchestration must bind one explicit decision time and require source observations at or before decision, completion events at or after decision, and settlement strictly after the final completion event.

**Trigger.** Place settlement replay time before quote comparison and fill events after settlement.

**Current behavior.** B1CrossVenueBacktestPlan contains no decision timestamp. runCandidateBacktest validates stages independently and never compares quote, decision, fill, or settlement times. The impossible temporal sequence is accepted.

**Expected behavior.** Backtest orchestration must bind one explicit decision time and require source observations at or before decision, completion events at or after decision, and settlement strictly after the final completion event.

**Impact.** Lookahead and post-settlement fills can generate accepted B1 profitability evidence. The run cannot prove that only information available at decision time was consumed.

**Root cause.** B1 orchestration composes locally valid artifacts without a shared temporal authority or monotonic cross-stage invariant.

**Minimal fix boundary.** Add a B1 decision timestamp and cross-stage time validation at orchestration input, binding quote source/receive/comparison, fills, and settlement. Durable timestamp constraints remain R03-owned.

**Current files and symbols.**
- `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` `B1CrossVenueBacktestPlan` `L20-L29` `b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4`
- `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` `runCandidateBacktest` `L372-L429` `b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4`
- `packages/bootstrap/src/backtest/standard-binary-backtest.ts` `validateExecutionPlanTemporalWindow / validateCompletionEventWindow` `L465-L568` `b89833bedd366b9d4b714cb0eddd6610e5eabd7217477063d7a1a2006b60e438`

**Required tests.**
- Settlement before decision is blocked.
- Fill before decision and fill at/after settlement are blocked.
- Future quote or changed data after decision is blocked.
- Boundary equality behavior is specified and tested.
- Standard and B1 chronology tests share explicit invariant fixtures without sharing implementation outputs.

**Blocks release/deployment.** `true`

## BWS118-R04-009 — B1 report labels in-limit incomplete, rejected, or timed-out simulations as accepted and fillable while discarding leg state

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R04`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R04`

**Invariant.** Report status must distinguish fully filled, incomplete-with-residual, rejected, timed-out, settled, and unreconciled states. “Fillable” must not mean merely that the pipeline returned ok.

**Trigger.** Run a candidate with a partially filled rejected leg and another timed-out leg whose residual remains inside the limit.

**Current behavior.** Any candidate result that reaches settlement is mapped to status=accepted, stage=accepted. The summary drops fillability group state, leg snapshots, terminal dispositions, residual exposure, and exposure-limit status. calculateMetrics sets fillableCandidateCount to the number of accepted summaries.

**Expected behavior.** Report status must distinguish fully filled, incomplete-with-residual, rejected, timed-out, settled, and unreconciled states. “Fillable” must not mean merely that the pipeline returned ok.

**Impact.** A rejected/timed-out partial portfolio is reported as fillable and can satisfy acceptance gates. Operators cannot see the residual state from the report.

**Root cause.** The report collapses “pipeline completed with analyzable residual exposure” into “accepted/fillable” and its schema lacks the state needed to preserve that distinction.

**Minimal fix boundary.** Expand candidate summaries and metrics to preserve fill group state, terminal dispositions, residual exposure, reconciliation state, and distinct fillability classification. Public UI projection remains R05-owned.

**Current files and symbols.**
- `packages/bootstrap/src/simulation/b1-leg-completion.ts` `simulateB1FillRejectionTimeout` `L83-L135` `108996f173a566dfb8b72de38c364d3f1d7b3610bcceadbe6c415d94a5fc5b3b`
- `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` `toReportCandidateSummary` `L452-L493` `b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4`
- `packages/bootstrap/src/reporting/b1-backtest-report.ts` `B1BacktestReportCandidateSummary` `L6-L25` `8c8cbc440a521c4ee32de8bde89c547fe3c97c36d43935008c3f0b39a2657272`
- `packages/bootstrap/src/reporting/b1-backtest-report.ts` `calculateMetrics` `L369-L419` `8c8cbc440a521c4ee32de8bde89c547fe3c97c36d43935008c3f0b39a2657272`
- `packages/bootstrap/src/operations/b1-runtime-evidence.ts` `runtimeAcceptanceMetrics` `L485-L514` `80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8`

**Required tests.**
- Fully filled and incomplete-in-limit candidates produce different report states and counters.
- Rejected/timed-out leg details survive report serialization and hashing.
- Acceptance gates do not count incomplete candidates as filled.
- Blocked, incomplete, settled, and fully filled states remain mutually exclusive.

**Blocks release/deployment.** `true`

## BWS118-R04-010 — B1 false-positive analysis excludes failures before settlement and computes the rate only over accepted settlements

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R04`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R04`

**Invariant.** The falsification denominator and stage metrics must account for every derived candidate and distinguish pre-settlement false positives, fill failures, blocked/unknown settlement, and accepted settlement outcomes.

**Trigger.** Include candidates that fail before settlement and a mix of accepted and blocked settlement observations.

**Current behavior.** The backtest adds false-positive observations only for fully successful candidates and settlement-stage blockers. Gross, solver, net, and fillability failures disappear. createB1FalsePositiveReport divides falsePositiveCount by acceptedSettlementCount only, excluding blocked settlements from the rate.

**Expected behavior.** The falsification denominator and stage metrics must account for every derived candidate and distinguish pre-settlement false positives, fill failures, blocked/unknown settlement, and accepted settlement outcomes.

**Impact.** The reported false-positive rate can improve when more candidates fail or remain unknown. It cannot measure end-to-end candidate false positives or compare candidate-to-fill-to-settlement attrition truthfully.

**Root cause.** The falsification model is settlement-only, but its name and downstream acceptance usage imply end-to-end candidate false-positive analysis.

**Minimal fix boundary.** Define explicit stage denominators and an end-to-end candidate outcome taxonomy; include every derived candidate exactly once and keep blocked/unknown rates separate from accepted settlement rates.

**Current files and symbols.**
- `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` `falsePositiveObservations collection` `L100-L121` `b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4`
- `packages/bootstrap/src/reporting/b1-false-positive-report.ts` `createB1FalsePositiveReport` `L31-L100` `55d3a251830501a284214bac6e94a16eb3f194fcce33195df5e3ee37cb985f95`

**Required tests.**
- Gross, stake, net, fillability, and settlement failures each appear in stage counts.
- Blocked/unknown settlements cannot reduce the accepted-outcome false-positive rate silently.
- End-to-end denominator equals unique derived candidates.
- Duplicate candidate IDs and reordered observations do not alter counts.

**Blocks release/deployment.** `true`

## BWS118-R04-011 — B1 marketsCompared counts venue-pair candidates rather than unique markets and can inflate the 50,000-market gate

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R04`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R04`

**Invariant.** marketsCompared must count unique market identities, separately from candidate and venue-pair counts.

**Trigger.** Generate three candidate summaries for one marketEquivalenceKey across three venue pairs.

**Current behavior.** calculateMetrics sets marketsCompared=candidates.length and candidateCount=candidates.length. Candidate derivation emits one candidate per market and venue pair, so one market is counted repeatedly. Runtime acceptance trusts this value for minimumMarketsCompared.

**Expected behavior.** marketsCompared must count unique market identities, separately from candidate and venue-pair counts.

**Impact.** A run can satisfy the minimum 50,000 market requirement with materially fewer unique markets, creating false data-coverage readiness.

**Root cause.** The report has no independent unique-market set and aliases a coverage metric to the candidate cardinality.

**Minimal fix boundary.** Derive marketsCompared from unique canonical market/equivalence identity, retain candidateCount separately, and bind acceptance to the corrected metric.

**Current files and symbols.**
- `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` `deriveB1CrossVenueGrossOpportunityCandidates` `L88-L142` `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543`
- `packages/bootstrap/src/reporting/b1-backtest-report.ts` `calculateMetrics` `L369-L419` `8c8cbc440a521c4ee32de8bde89c547fe3c97c36d43935008c3f0b39a2657272`
- `packages/bootstrap/src/operations/b1-runtime-evidence.ts` `dataCoverageBlockers / runtimeAcceptanceMetrics` `L418-L500` `80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8`

**Required tests.**
- Multiple venue pairs for one market count as one market and multiple candidates.
- Same market across duplicate rows remains one market.
- Distinct markets on one event count separately.
- Runtime threshold test proves candidate multiplication cannot satisfy market coverage.

**Blocks release/deployment.** `true`

## BWS118-R04-012 — Standard backtest and private-paper strategy reports discard per-leg lifecycle evidence while labeling candidates accepted_local_evidence

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R04`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R04`

**Invariant.** The accepted evidence report must retain the exact completion snapshots, terminal dispositions, event/receipt identities, residual scenario evidence, and reconciliation state needed to audit the acceptance label.

**Trigger.** Project an accepted backtest/private-paper result into SurebetStrategyCandidateReport.

**Current behavior.** Standard accepted results retain only aggregate group state, counts, filled/excluded IDs, settlement, and optional residual summary. The strategy report reduces this further to completionGroupState, settledNetMinor, finalOutcome, and optional killReason, then labels it accepted_local_evidence.

**Expected behavior.** The accepted evidence report must retain the exact completion snapshots, terminal dispositions, event/receipt identities, residual scenario evidence, and reconciliation state needed to audit the acceptance label.

**Impact.** Partial, rejected, expired, rolled-back, or kill-order facts can disappear from the authoritative report. Consumers cannot independently prove that accepted_local_evidence is consistent with the underlying lifecycle.

**Root cause.** Evidence projection is lossy at two consecutive boundaries and the acceptance label is derived from pipeline success rather than an independently auditable lifecycle packet.

**Minimal fix boundary.** Preserve or content-address the full completion/reconciliation packet in accepted candidate reports and bind the acceptance label to that immutable evidence. API/UI rendering remains R05-owned; publication lineage remains R07-owned.

**Current files and symbols.**
- `packages/bootstrap/src/backtest/standard-binary-backtest.ts` `StandardBinaryBacktestAcceptedCandidateResult` `L43-L62` `b89833bedd366b9d4b714cb0eddd6610e5eabd7217477063d7a1a2006b60e438`
- `packages/bootstrap/src/backtest/standard-binary-backtest.ts` `createAcceptedCandidateResult` `L571-L607` `b89833bedd366b9d4b714cb0eddd6610e5eabd7217477063d7a1a2006b60e438`
- `packages/bootstrap/src/runtime/private-paper-runtime.ts` `PrivatePaperRuntimeAcceptedCandidateResult` `L106-L126` `252e38a52693f3fa598c9ea92a83b184de0c4b29c4ab0bd5c952b750d009c6f5`
- `packages/bootstrap/src/runtime/private-paper-runtime.ts` `create accepted runtime candidate result` `L1161-L1191` `252e38a52693f3fa598c9ea92a83b184de0c4b29c4ab0bd5c952b750d009c6f5`
- `packages/bootstrap/src/strategy/strategy-ledger.ts` `SurebetStrategyCandidateReport` `L113-L123` `d05e339a5692a9218f2146c153570ee7d9c8d79ae88282e162b7ece0c0cb5dbc`
- `packages/bootstrap/src/strategy/strategy-ledger.ts` `toBacktestCandidateReport / toPrivatePaperCandidateReport` `L795-L841` `d05e339a5692a9218f2146c153570ee7d9c8d79ae88282e162b7ece0c0cb5dbc`

**Required tests.**
- Per-leg terminal and quantity state survives backtest/private report generation.
- Report digest changes when any underlying event or snapshot changes.
- A consumer can validate accepted_local_evidence without an in-memory source object.
- Killed and incomplete candidates cannot appear equivalent to fully completed candidates.

**Blocks release/deployment.** `true`

## BWS118-R04-013 — B1 false-positive report throws on malformed top-level or observation objects instead of returning a blocked boundary result

- Severity: `P2`
- Confidence: `CONFIRMED`
- Primary owner: `R04`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R04`

**Invariant.** All public boundary helpers must validate container and field types before dereference and return BoundaryResult blockers for malformed input.

**Trigger.** Call createB1FalsePositiveReport(null) or pass {settlementStatus:"accepted"} as an observation.

**Current behavior.** The function immediately reads observations.length and the validator immediately calls observation.candidateId.trim() without checking object or string shape. Malformed input throws TypeError.

**Expected behavior.** All public boundary helpers must validate container and field types before dereference and return BoundaryResult blockers for malformed input.

**Impact.** A malformed retained report or caller bug can crash a bounded backtest/report process rather than producing explicit blocker evidence. Diagnostics and batch isolation are weakened.

**Root cause.** The report helper relies on TypeScript compile-time shape guarantees at a runtime boundary that is called with deserialized/untrusted structures elsewhere in the repository.

**Minimal fix boundary.** Add top-level array and per-observation structural validation before dereference; return stable blocker codes and preserve current valid-output shape.

**Current files and symbols.**
- `packages/bootstrap/src/reporting/b1-false-positive-report.ts` `createB1FalsePositiveReport` `L31-L100` `55d3a251830501a284214bac6e94a16eb3f194fcce33195df5e3ee37cb985f95`
- `packages/bootstrap/src/reporting/b1-false-positive-report.ts` `validateB1FalsePositiveObservation` `L102-L163` `55d3a251830501a284214bac6e94a16eb3f194fcce33195df5e3ee37cb985f95`

**Required tests.**
- null, object, string, sparse array, null observation, missing candidateId, and non-string candidateId return blockers without throwing.
- Valid accepted and blocked observations remain unchanged.
- Batch runner continues after one malformed report input where policy permits.

**Blocks release/deployment.** `true`

## BWS118-R04-014 — Exported partial-fill status falsely identifies a legacy state machine that has no partial-fill state

- Severity: `P2`
- Confidence: `CONFIRMED`
- Primary owner: `R04`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R04`

**Invariant.** Capability/status evidence must identify the actual production partial-fill implementation and prove the claimed state is representable through its entrypoint.

**Trigger.** Read the accepted status payload and follow implementationModule to src/simulation/leg-completion.ts.

**Current behavior.** partialFillModelStatus returns accepted and names src/simulation/leg-completion.ts, but PAPER_LEG_COMPLETION_STATES in that module contains open, reserved, filled, failed, stale, and settlement_pending only. The actual partial-fill behavior lives in non-atomic-completion.ts and B1 modules.

**Expected behavior.** Capability/status evidence must identify the actual production partial-fill implementation and prove the claimed state is representable through its entrypoint.

**Impact.** Marker-based validators and documentation can report partial-fill implementation present while following a module that cannot represent partial state, creating false assurance and confusing callers.

**Root cause.** A static capability marker was not updated when implementation moved to a different state machine, and tests validate the declaration rather than the declared behavior.

**Minimal fix boundary.** Retire the stale status helper or point it to the actual production entrypoint with a behavioral validator. Aggregate validator ownership remains R11.

**Current files and symbols.**
- `packages/bootstrap/src/simulation/partial-fill.ts` `PartialFillModelStatus / partialFillModelStatus` `L3-L18` `84ea147e7d449e3ffdfcfcd662f29803dc5905f4d207b556ed04ab6b39071a93`
- `packages/bootstrap/src/simulation/leg-completion.ts` `PAPER_LEG_COMPLETION_STATES` `L5-L12` `934fb7e5b36545bbc393d0c4909cd4fbc5ddaaf2d540819acc222577ba672aa7`
- `tests/leg-completion.test.ts` `partial-fill status assertions` `L1-L246` `f3e273e97b4388f9aa45e6cb4197874f90aafdedceebea4892a2293abeadce24`

**Required tests.**
- Status-referenced entrypoint accepts a genuine partial fill and returns a partial state.
- Renaming/removing the implementation causes the validator to fail.
- No marker-only test can pass without invoking the production path.

**Blocks release/deployment.** `true`

## BWS118-R05-001 — The HTTP boundary collapses validation, policy, persistence, and internal failures into HTTP 400 and returns raw exception text

- Severity: `P2`
- Confidence: `CONFIRMED`
- Primary owner: `R05`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R05`

**Invariant.** Request-validation failures, domain-policy holds, not-found results, dependency outages, and unexpected internal faults must retain distinct status classes and sanitized envelopes; all relevant blockers must remain available to operators without exposing internals.

**Trigger.** Trigger a repository exception, service availability failure, malformed persisted row, or a blocked result with more than one diagnostic.

**Current behavior.** Every service blocker is emitted as HTTP 400 using only blockers[0]. A single broad catch also maps unexpected exceptions to HTTP 400/BWS_QUERY_REQUEST_INVALID and returns Error.message verbatim.

**Expected behavior.** Request-validation failures, domain-policy holds, not-found results, dependency outages, and unexpected internal faults must retain distinct status classes and sanitized envelopes; all relevant blockers must remain available to operators without exposing internals.

**Impact.** Clients cannot distinguish an empty/invalid query from a database or service fault, retry policy becomes wrong, and internal SQL/relation/path detail can cross the HTTP boundary. Operational dashboards can classify infrastructure failure as caller error.

**Root cause.** The HTTP adapter has one catch-all request error path and no typed translation layer from query/domain/repository errors to a stable public error taxonomy.

**Minimal fix boundary.** Change only the R05 HTTP/error-envelope boundary: classify malformed input, policy hold, not found, conflict, unavailable dependency, timeout, and internal failure; sanitize internal exceptions; preserve a bounded blocker list or diagnostic identifier. Do not alter repository transaction semantics.

**Current files and symbols.**
- `packages/bootstrap/src/api/bws-read-only-query-http.ts` `createBwsReadOnlyQueryHttpHandler query dispatch and catch` `157-217` `fc644a168e07d1afa63d84fa85582cda9c37994b2b4d66ea7366c1f442c7ac17`
- `packages/bootstrap/src/api/bws-read-only-query-http.ts` `writeBlockedResponse` `380-401` `fc644a168e07d1afa63d84fa85582cda9c37994b2b4d66ea7366c1f442c7ac17`

**Required tests.**
- Production-handler tests for 400/404/409/422/503/504/500 distinctions using inert typed failures.
- Test that raw SQL, filesystem, connection, and stack detail never appears in the response.
- Test that multiple blockers are retained deterministically or referenced by a stable diagnostic ID.
- Client test proving non-2xx classes remain distinguishable from an empty successful page.

**Blocks release/deployment.** `true`

## BWS118-R05-002 — Pagination cursors are caller-forgeable position tokens with no immutable snapshot, version, or high-watermark binding

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R05`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R05`

**Invariant.** A continuation token must be server-authenticated or otherwise non-malleable and must bind resource, exact query/sort contract, API version, and one immutable snapshot/high-watermark so continuation is deterministic and restart-safe.

**Trigger.** Reuse a cursor after rows are inserted/reordered, or synthesize base64url JSON containing an arbitrary afterId and the public filter hash.

**Current behavior.** The token is plain base64url JSON with only resource, filtersSha256, and afterId. The SHA-256 is unkeyed and recomputable by any caller. There is no snapshot ID, high-watermark, sort version, expiry, or server-side continuation state.

**Expected behavior.** A continuation token must be server-authenticated or otherwise non-malleable and must bind resource, exact query/sort contract, API version, and one immutable snapshot/high-watermark so continuation is deterministic and restart-safe.

**Impact.** A caller can skip directly to an arbitrary ID, and normal concurrent insertion can omit records across pages while both responses appear complete and valid. Restarted or delayed consumers cannot prove which dataset the cursor continues.

**Root cause.** The query layer treats an opaque encoding plus public scope hash as cursor integrity and treats live keyset position as snapshot continuity.

**Minimal fix boundary.** At the R05 query boundary, introduce a versioned cursor contract bound to canonical sort and immutable high-watermark/snapshot identity; authenticate or server-register it; reject expired, unknown, or mismatched continuations. Hand database snapshot/fencing implementation to R03 where required.

**Current files and symbols.**
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `CursorPayload` `306-310` `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `queryB1BacktestRuns / queryStrategyLedger cursor production` `397-473` `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `hashCursorScope / decodeCursor / encodeCursor` `1991-2052` `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`

**Required tests.**
- Forged-cursor rejection test using a recomputed filter hash.
- Concurrent insert/delete/update continuation tests with a fixed snapshot.
- Restart test proving a valid continuation resumes the same snapshot or fails explicitly as expired.
- Sort-version and API-version mismatch tests.
- Property test that concatenated pages equal one snapshot query without duplicate or omission.

**Blocks release/deployment.** `true`

## BWS118-R05-003 — Private-paper runtime-cycle queries scan only a recent heuristic window and can return a false empty page with no continuation or truncation signal

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R05`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R05`

**Invariant.** The API must either query the entire bounded keyspace using deterministic continuation or explicitly return partial/truncated/incomplete state and a continuation mechanism. An empty page may mean no matching row only after the searchable snapshot is exhausted.

**Trigger.** Query pageSize=1 for a filter whose newest match is cycle 6 while the scheduler upper cycle is 10.

**Current behavior.** The request has no cursor. For each scheduler, only the last pageSize*4 cycle numbers are inspected, then the global results are sliced to pageSize. The response never emits nextCursor, scanned range, truncation, or completeness.

**Expected behavior.** The API must either query the entire bounded keyspace using deterministic continuation or explicitly return partial/truncated/incomplete state and a continuation mechanism. An empty page may mean no matching row only after the searchable snapshot is exhausted.

**Impact.** Operators can receive returnedCount=0 and infer no runtime evidence even though older matching cycles exist. This can manufacture absence, hide held/failed history, and make restart investigation incomplete.

**Root cause.** Runtime-cycle projection is implemented as recent-window sampling but uses the same successful page contract as an exhaustive filtered query.

**Minimal fix boundary.** Replace heuristic sampling with a deterministic repository/read-model query and continuation, or introduce an explicit bounded scan contract carrying searched range, truncation, partial/completeness status, and continuation. Do not change worker/job durable state in R05.

**Current files and symbols.**
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `BwsPrivatePaperRuntimeCycleQueryRequest` `152-164` `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `queryPrivatePaperRuntimeCycles` `581-678` `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`

**Required tests.**
- Older-match test proving it is returned through continuation or the response is explicitly partial.
- No-match test that distinguishes exhausted snapshot from truncated scan.
- Multiple-scheduler ordering and continuation tests.
- Restart test with the same search snapshot/high-watermark.
- UI test that partial runtime-cycle results cannot be presented as absence.

**Blocks release/deployment.** `true`

## BWS118-R05-004 — Maximum-size runtime-cycle reads expand into at least 50,000 synchronous dependency calls before optional provenance work

- Severity: `P2`
- Confidence: `CONFIRMED`
- Primary owner: `R05`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R05`

**Invariant.** One page request must have a declared and enforced operation/query budget with set-based reads, bounded fanout, timeout/cancellation, and explicit partial or unavailable results when the budget cannot be met.

**Trigger.** Request private-paper runtime cycles at pageSize=25.

**Current behavior.** The service lists up to pageSize*4 schedulers and scans pageSize*4 cycles per scheduler. Each candidate cycle performs upstream-checkpoint get, upstream-lock get, worker-job get, and two strategy-ledger lists before optional checkpoint/dead-letter/import expansion.

**Expected behavior.** One page request must have a declared and enforced operation/query budget with set-based reads, bounded fanout, timeout/cancellation, and explicit partial or unavailable results when the budget cannot be met.

**Impact.** A single loopback GET can monopolize the synchronous service path, amplify database work, and delay health, cockpit, and other query traffic. The nominal page limit does not bound backend work.

**Root cause.** The response-size bound is incorrectly used as a work bound while nested per-record reconstruction creates quadratic fanout and N+1 repository access.

**Minimal fix boundary.** At the R05 read-model boundary, use one bounded set-based query or precomputed read model, enforce an explicit operation/time budget, and surface partial/unavailable state. R03 owns repository/index/transaction changes; R06 owns request cancellation and service-wide concurrency.

**Current files and symbols.**
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `queryPrivatePaperRuntimeCycles scheduler/cycle nested scan` `592-660` `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `buildPrivatePaperRuntimeCycleItem` `853-945` `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `findPrivatePaperRuntimeStrategyLedger / findCompletedCycleImportRun` `1041-1117` `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`
- `packages/bootstrap/src/operations/runtime-applications.ts` `DEFAULT_API_QUERY_MAX_PAGE_SIZE / createBwsReadOnlyQueryService` `58,203-207` `216b980403a59909b07a27fb475d22cf6ee35b41364fd0bb46c510d17d9e0322`

**Required tests.**
- Operation-count test at maxPageSize with a hard upper bound independent of scheduler history.
- Database-backed query-plan and latency test under realistic retained history.
- Cancellation/timeout test proving no late query work continues after client disconnect or request deadline.
- Concurrency test with health/readiness and multiple cockpit readers.

**Blocks release/deployment.** `true`

## BWS118-R05-005 — The cockpit discards every server continuation and presents first-page counts, search, and local pagination as whole-scope data

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R05`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R05`

**Invariant.** The cockpit must either exhaust deterministic continuations within a declared cap, implement server-driven paging/search, or visibly label every metric and row set as partial/first-page with continuation controls and completeness state.

**Trigger.** Load the cockpit with all seven core responses containing nextCursor and at least one row.

**Current behavior.** The snapshot loader issues exactly one request per surface and never uses nextCursor. Models label returnedCount as Accepted Backtests, Blocked Backtests, Cycle Rows, B1 Research Runs, and similar totals. Search and pager operate only on loaded first-page rows.

**Expected behavior.** The cockpit must either exhaust deterministic continuations within a declared cap, implement server-driven paging/search, or visibly label every metric and row set as partial/first-page with continuation controls and completeness state.

**Impact.** The UI can undercount accepted, blocked, failed, or held records; search can falsely report no matching data; and the Next button can be disabled while the server has more pages. This manufactures completeness and can hide release blockers.

**Root cause.** The web snapshot contract models one server page per logical dataset, while presentation code treats page-local counts and rows as scope totals.

**Minimal fix boundary.** Choose one R05 UI contract: server-driven pagination/filter/search with surfaced continuation, or bounded multi-page aggregation carrying explicit completeness/truncation. Rename all page-local metrics and empty states until completeness is proven.

**Current files and symbols.**
- `apps/web/src/api/client.ts` `loadBwsOperatorCockpitSnapshot` `1240-1325` `8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97`
- `apps/web/src/api/models.ts` `buildBwsOperatorCockpitPageModel count cards and rows` `657-801` `3b08b0fe2d3559cc1e51bf3f570ea43b3b3c4379234ceaec33abe7d9c1c034c3`
- `apps/web/src/app/shell.tsx` `filterRows / paginateRows / local page model` `116-188` `ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189`
- `apps/web/src/app/shell.tsx` `empty table and local pager` `460-518` `ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189`

**Required tests.**
- Snapshot-loader test that follows continuations or deliberately returns explicit partial state.
- UI test where nextCursor exists: cards, search, empty state, and pager must not claim completeness.
- Multi-page accepted/blocked/B1/runtime/evidence cases.
- Cursor failure midway must preserve partial/error distinction rather than silently showing page one.

**Blocks release/deployment.** `true`

## BWS118-R05-006 — Successful response envelopes omit the exact query, filter, sort, and snapshot scope, so empty wrong-scope pages pass client validation vacuously

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R05`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R05`

**Invariant.** Every page must carry or cryptographically bind the exact normalized query/filter/sort/expand contract, page size, cursor lineage, snapshot/high-watermark, and response completeness. The client must compare this receipt before interpreting items.

**Trigger.** Request one scope but return an empty successful page generated for another filter/sort/page scope.

**Current behavior.** The envelope contains only boundary strings, generatedAt, resource, items, pageSize, returnedCount, and optional cursor. The client verifies scope by iterating returned items; an empty array makes every scope check pass.

**Expected behavior.** Every page must carry or cryptographically bind the exact normalized query/filter/sort/expand contract, page size, cursor lineage, snapshot/high-watermark, and response completeness. The client must compare this receipt before interpreting items.

**Impact.** A proxy, stale cache, incompatible server, or server defect can return data for the wrong request while the cockpit accepts it. Empty responses can manufacture absence for any requested scope.

**Root cause.** Scope integrity is inferred from row contents instead of being an explicit page-level contract.

**Minimal fix boundary.** Extend the R05 response envelope with a versioned normalized-request receipt/digest, canonical order, snapshot identity, and completeness status; validate it before item parsing. Use R01 page/record receipt concepts as dependencies without duplicating upstream intake defects.

**Current files and symbols.**
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `BwsReadOnlyQueryPage / BwsReadOnlyQueryResponse` `97-115` `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`
- `apps/web/src/api/client.ts` `assertReadOnlyQueryResponse` `692-762` `8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97`
- `apps/web/src/api/client.ts` `response-versus-request item-loop assertions` `980-1144` `8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97`

**Required tests.**
- Wrong-scope empty-page rejection test.
- Wrong expand/pageSize/sort/cursor-lineage rejection tests.
- Property test that every emitted response receipt equals the service-normalized request.
- Compatibility/version test for changed query semantics.

**Blocks release/deployment.** `true`

## BWS118-R05-007 — The cockpit combines seven independently timed pages into one apparent snapshot without a shared coherence receipt

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R05`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R05`

**Invariant.** A cockpit snapshot must carry one server-issued snapshot/coherence identity or prove all component responses share compatible as-of/high-watermark/authority receipts. Mixed snapshots must be rejected or visibly presented as independent partial observations.

**Trigger.** Return the seven pages with mutually different generatedAt values, generations, or database high-watermarks.

**Current behavior.** The client runs separate requests in Promise.all and places them into one object. There is no shared snapshot ID, database high-watermark, source cycle, asOf, or cross-response coherence validation.

**Expected behavior.** A cockpit snapshot must carry one server-issued snapshot/coherence identity or prove all component responses share compatible as-of/high-watermark/authority receipts. Mixed snapshots must be rejected or visibly presented as independent partial observations.

**Impact.** Accepted and blocked totals, exposure, runtime cycles, and evidence can describe different moments. A candidate may appear accepted while its blocker or runtime state comes from another snapshot, manufacturing profitability, terminality, or readiness relationships.

**Root cause.** UI aggregation is equated with data snapshot coherence; the server exposes only independent page responses.

**Minimal fix boundary.** Add an R05 snapshot/batch read contract or common snapshot token/high-watermark accepted by all queries, and require the cockpit to validate it. If independent observations remain intentional, label and render them independently rather than deriving cross-surface totals.

**Current files and symbols.**
- `apps/web/src/api/contracts.ts` `BwsOperatorCockpitSnapshot` `117-127` `11c9bcc7cacad4505c7d24f5e66c819723bc9165b1b65c96271b449df2bc3417`
- `apps/web/src/api/client.ts` `loadBwsOperatorCockpitSnapshot Promise.all aggregation` `1267-1324` `8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97`
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `BwsReadOnlyQueryResponse` `110-115` `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`

**Required tests.**
- Concurrent mutation test during seven-surface load.
- Mixed snapshot/high-watermark rejection test.
- Batch endpoint or shared-token test proving all surfaces resolve one snapshot.
- Partial surface failure test that does not retain a synthetic combined snapshot.

**Blocks release/deployment.** `true`

## BWS118-R05-008 — API and cockpit accept arbitrarily stale or future response timestamps and loaded state never transitions to stale

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R05`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R05`

**Invariant.** The API/client contract must define response age, future-skew, source/as-of time, and stale transition. The cockpit must label stale data and refresh or require operator reload; future or incompatible time must fail closed.

**Trigger.** Return a response dated 2000 or 2099, or leave a valid response displayed indefinitely.

**Current behavior.** Both service and client validate only ISO syntax/Date.parse. The shell loads on route/config/scope changes only; it has no clock, refresh interval, visibility refresh, expiry, stale state, or future-skew check.

**Expected behavior.** The API/client contract must define response age, future-skew, source/as-of time, and stale transition. The cockpit must label stale data and refresh or require operator reload; future or incompatible time must fail closed.

**Impact.** Historical or clock-skewed data can remain visually current, and old held/failed/accepted state can be used for operational decisions without any stale indication.

**Root cause.** Timestamp validity is treated as currentness, and the browser state machine has no stale concept.

**Minimal fix boundary.** Define R05 response currentness fields and policy using a caller-provided/testable clock; reject excessive future skew, mark age explicitly, and add a browser stale/refresh state. R01 remains owner of upstream source/receive-time truth.

**Current files and symbols.**
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `validateGeneratedAt` `1419-1428` `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`
- `apps/web/src/api/client.ts` `assertReadOnlyQueryResponse generatedAt parsing` `692-717` `8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97`
- `apps/web/src/app/shell.tsx` `load lifecycle effect` `144-180` `ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189`

**Required tests.**
- Ancient and future generatedAt rejection/stale tests with injected clock.
- Open-page expiry test transitioning current to stale without route change.
- Visibility/reconnect refresh test.
- Distinguish API response time from upstream source/receive/as-of time.

**Blocks release/deployment.** `true`

## BWS118-R05-009 — The cockpit accepts arbitrary non-empty service and upstream-client boundary identifiers instead of exact compatible versions

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R05`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R05`

**Invariant.** The web client must require an explicit supported boundary/version pair and reject unknown, future, historical, or mixed contracts before reading items.

**Trigger.** Return arbitrary-old-or-incompatible-service and arbitrary-client as the two boundary strings.

**Current behavior.** Only automaticFallback is checked exactly. Both boundary identifiers are accepted as any non-empty string.

**Expected behavior.** The web client must require an explicit supported boundary/version pair and reject unknown, future, historical, or mixed contracts before reading items.

**Impact.** The cockpit can silently consume a contract with changed field, cursor, filter, unit, or hold semantics and then present a structurally plausible but semantically incompatible result.

**Root cause.** Boundary strings are treated as diagnostics rather than negotiated compatibility constraints.

**Minimal fix boundary.** Define the exact supported R05 boundary versions in one shared contract, validate both identifiers before page parsing, and require an explicit version bump/migration for incompatible response changes.

**Current files and symbols.**
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `describeBwsReadOnlyQueryServiceBoundary / boundary construction` `345-366` `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`
- `apps/web/src/api/client.ts` `assertReadOnlyQueryResponse boundary validation` `707-717` `8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97`

**Required tests.**
- Known-current pair acceptance test.
- Unknown older/newer/mixed boundary rejection tests.
- Package/build test proving server and web consume one generated/shared boundary authority rather than duplicated literals.

**Blocks release/deployment.** `true`

## BWS118-R05-010 — Selective wire validation weakens closed policy, terminal, fixed-point, status, and timestamp contracts to arbitrary non-empty strings

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R05`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R05`

**Invariant.** The client must validate every canonical literal, closed-state invariant, fixed-point integer string, timestamp, and status against the same contract used by the producer before a typed cast or rendering.

**Trigger.** Return liveState=live, privacy=public, profitabilityState=guaranteed_profitable, publicDistributionState=published, reportKind=forged_report, completionGroupState=ready_to_execute, finalOutcome=guaranteed_win, settledNetMinor=not-an-integer, job.status=fully_live, or completedAt=not-a-time.

**Current behavior.** Several critical fields are checked only with requireNonEmptyString or requireOptionalNonEmptyString, then the object is cast to the strong TypeScript type. Models render the accepted values directly.

**Expected behavior.** The client must validate every canonical literal, closed-state invariant, fixed-point integer string, timestamp, and status against the same contract used by the producer before a typed cast or rendering.

**Impact.** A defective response can manufacture live/public/profitable/executable-looking state, false terminality, malformed money, or impossible runtime status in the operator cockpit while all client validation passes.

**Root cause.** The web parser validates selected structural relationships but relies on unsafe type assertions for the remaining semantic contract.

**Minimal fix boundary.** Replace ad hoc selective checks with exhaustive shared/generated validators at the R05 wire boundary, including canonical policy literals, union exhaustiveness, integer-string format/range, timestamp format/order, optional-state dependencies, and unknown-field rejection where required. Canonical producer rules remain owned by R02/R03/R04.

**Current files and symbols.**
- `apps/web/src/api/client.ts` `assertImportRunRecord / assertCandidateReport` `238-316` `8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97`
- `apps/web/src/api/client.ts` `assertStrategyLedgerEntry` `319-378` `8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97`
- `apps/web/src/api/client.ts` `assertPrivatePaperRuntimeCycleItem job validation` `426-447` `8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97`
- `packages/bootstrap/src/strategy/strategy-ledger.ts` `strategy report kind and closed-policy validation` `401-450` `d05e339a5692a9218f2146c153570ee7d9c8d79ae88282e162b7ece0c0cb5dbc`
- `apps/web/src/api/models.ts` `toExposureRows` `439-465` `3b08b0fe2d3559cc1e51bf3f570ea43b3b3c4379234ceaec33abe7d9c1c034c3`

**Required tests.**
- Mutation/property tests over every union member and every unknown string.
- Closed-policy escalation tests for live/public/profitability/distribution/report kind.
- Integer-string tests for sign, decimals, exponent, whitespace, unsafe length, and overflow policy.
- Optional timestamp/status/state dependency tests.
- Round-trip test from actual service output through the external web parser.

**Blocks release/deployment.** `true`

## BWS118-R05-011 — The B1 browser contract rejects producer-valid null simulation results while accepting malformed child identity, economics, status, and time fields

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R05`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R05`

**Invariant.** The external client schema must exactly match the producer contract, including valid nullability, parent-child identity, discriminated simulation kinds/statuses, fixed-point values, blockers, booleans, timestamps, and result-shape dependencies.

**Trigger.** Return result=null for the producer-valid residual_exposure row, or return children with mismatched run/candidate IDs, non-integer spread/money strings, invalid status/stage, non-array blockers, non-boolean falsePositive, or invalid timestamps.

**Current behavior.** The parser requires every simulation result to be an object, although persistence intentionally emits result:null for one accepted case. Conversely, candidate and simulation children receive only four shallow non-empty/object checks and are then cast to the full types.

**Expected behavior.** The external client schema must exactly match the producer contract, including valid nullability, parent-child identity, discriminated simulation kinds/statuses, fixed-point values, blockers, booleans, timestamps, and result-shape dependencies.

**Impact.** Valid B1 reporting can fail closed in the browser, while malformed B1 economics and identity can be displayed as research evidence. B1 acceptance and false-positive analysis become unreliable at the presentation boundary.

**Root cause.** The B1 client validator is a hand-written partial projection that diverges from the producer/persistence discriminated contract in both directions.

**Minimal fix boundary.** Create one shared/generated B1 reporting wire schema and validate all child discriminants, identities, units, timestamps, and nullability in R05. Hand any discovered producer-contract defect to R02/R04/R03 rather than changing economics here.

**Current files and symbols.**
- `apps/web/src/api/client.ts` `assertB1BacktestRunItem child validation` `573-663` `8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97`
- `packages/persistence/src/repositories/b1-backtest-run-repository.ts` `buildSurebetB1SimulationResultInsertValues` `451-510` `fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04`
- `packages/persistence/src/repositories/b1-backtest-run-repository.ts` `normalizeSimulationRow` `646-653` `fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04`
- `apps/web/src/api/models.ts` `createB1BacktestRunRow` `550-608` `3b08b0fe2d3559cc1e51bf3f570ea43b3b3c4379234ceaec33abe7d9c1c034c3`

**Required tests.**
- Producer-valid null residual-exposure round-trip test.
- Parent-child runId/candidateId mismatch rejection tests.
- All candidate/simulation status and kind union tests.
- Fixed-point, boolean, blockers, timestamp, and result-shape property tests.
- Model test proving malformed child data cannot render.

**Blocks release/deployment.** `true`

## BWS118-R05-012 — Cockpit loads are not request-generation-bound or cancellable, allowing a late older scope or route response to overwrite newer state

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R05`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R05`

**Invariant.** Only the active request generation may publish snapshot/error/loading state. Superseded loads must be aborted where possible and ignored on completion; loading must represent the active generation only.

**Trigger.** Start an old-scope load, start and complete a new-scope load, then complete the old load last.

**Current behavior.** Every effect invocation writes the same snapshot/error/loading state without a generation token or active flag. The fetch abstraction carries no AbortSignal. Older completion can call setSnapshot and finally setIsLoading(false after a newer load.

**Expected behavior.** Only the active request generation may publish snapshot/error/loading state. Superseded loads must be aborted where possible and ignored on completion; loading must represent the active generation only.

**Impact.** The cockpit can display data for the wrong route/filter/API base while URL controls show the new scope. A late failure can also erase a valid newer snapshot or mark loading complete prematurely.

**Root cause.** Asynchronous fetch completion has no monotonic ownership relation to the effect generation that initiated it.

**Minimal fix boundary.** Add one request-generation/AbortController boundary in the shell/client; pass AbortSignal through the fetch abstraction; ignore completion from superseded generations; make loading/error state generation-specific. Generic HTTP cancellation propagation remains R06-owned.

**Current files and symbols.**
- `apps/web/src/api/client.ts` `BwsOperatorCockpitFetchLike` `60-72` `8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97`
- `apps/web/src/api/client.ts` `loadBwsOperatorCockpitSnapshot` `1240-1325` `8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97`
- `apps/web/src/app/shell.tsx` `loadSnapshot effect and state updates` `144-180` `ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189`

**Required tests.**
- Deterministic deferred-promise race tests for route, scope, and configuration changes.
- Old success after new success; old failure after new success; old finally after new pending.
- Unmount and abort test proving no state publication or retained listener.
- Client test proving AbortSignal reaches fetch.

**Blocks release/deployment.** `true`

## BWS118-R05-013 — The cockpit conflates source-empty, search-no-match, and evidence-scope states under the same empty labels

- Severity: `P2`
- Confidence: `CONFIRMED`
- Primary owner: `R05`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R05`

**Invariant.** Presentation must distinguish at least: source/query returned no rows, loaded page is partial, active search has no matches, explicit evidence scope has no matches, scope is missing, and request failed.

**Trigger.** Search for a nonmatching term against a nonempty page, or apply a valid evidence filter that produces an empty result.

**Current behavior.** The shell always renders model.emptyLabel when filtered visible rows are empty. The evidence page always says to provide an explicit filter even when one is applied; other pages claim no source rows when only local search is empty.

**Expected behavior.** Presentation must distinguish at least: source/query returned no rows, loaded page is partial, active search has no matches, explicit evidence scope has no matches, scope is missing, and request failed.

**Impact.** Operators can believe evidence is absent, a filter was not applied, or the source contains no blockers when only the local view is empty. Diagnostics and review decisions become misleading.

**Root cause.** Empty copy is fixed at route-model construction and is not derived from query, scope, pagination, or local-filter state.

**Minimal fix boundary.** Introduce explicit R05 UI view states for source empty, filtered empty, missing scope, applied-scope no match, partial page, and error; derive copy from those states and keep counts visible.

**Current files and symbols.**
- `apps/web/src/api/models.ts` `buildBwsOperatorCockpitPageModel empty labels` `657-724` `3b08b0fe2d3559cc1e51bf3f570ea43b3b3c4379234ceaec33abe7d9c1c034c3`
- `apps/web/src/app/shell.tsx` `filteredRows / visibleRows` `182-188` `ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189`
- `apps/web/src/app/shell.tsx` `empty-state rendering` `460-485` `ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189`

**Required tests.**
- Nonempty source plus zero local-search results.
- Explicit evidence scope with zero results.
- Missing evidence scope.
- Server partial page and server error states.
- Reset-search action restoring source rows without refetch confusion.

**Blocks release/deployment.** `true`

## BWS118-R06-001 — Lifecycle ownership is a non-atomic state-file check-and-overwrite

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R06`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R06`

**Invariant.** Exactly one process must acquire an atomic, generation-bound ownership claim before migrations, child creation, service work, or evidence publication; all contenders must return an idempotent already-owned outcome.

**Trigger.** Launch two lifecycle or standalone service starts concurrently.

**Current behavior.** Both processes can observe no live state, both can migrate or spawn/run, and the last rename wins. The overwritten state no longer identifies every active process.

**Expected behavior.** Exactly one process must acquire an atomic, generation-bound ownership claim before migrations, child creation, service work, or evidence publication; all contenders must return an idempotent already-owned outcome.

**Impact.** Duplicate convergence passes, duplicate scheduler activity, duplicate workers, orphaned child processes, conflicting evidence, and stop/status commands controlling only the last writer.

**Root cause.** A mutable JSON state file is used as both observation and ownership authority without an atomic reservation primitive.

**Minimal fix boundary.** Add one repository-scoped atomic ownership primitive before any side effect, bind it to a monotonically unique runtime generation and process token, make start idempotent under contention, and release it only after verified shutdown. Apply the same primitive to standalone loops or prohibit independent ownership while the stack owner is active.

**Current files and symbols.**
- `packages/bootstrap/src/operations/operator-lifecycle.ts` `startManagedBwsOperatorStack / writeLifecycleState` `240-264; 903-910` `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`
- `packages/bootstrap/src/operations/upstream-convergence-service.ts` `runBwsUpstreamConvergenceService / writeServiceState` `301-327; 863-870` `937ad8b789002504b674351c04e2179ba2800e17deea1d5e17aa0dd31786d5a8`
- `packages/bootstrap/src/operations/private-paper-scheduler-service.ts` `runBwsPrivatePaperSchedulerService / writeServiceState` `305-331; 885-892` `876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967`
- `packages/bootstrap/src/operations/private-paper-worker-service.ts` `runBwsPrivatePaperWorkerService / writeServiceState` `317-345; 936-943` `1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36`

**Required tests.**
- Two OS processes starting the full stack concurrently
- Concurrent standalone loop starts
- Crash after claim but before state publication
- Stale claim takeover with a fencing generation
- Stop/status after a losing contender has spawned work

**Blocks release/deployment.** `true`

## BWS118-R06-002 — Stack startup reports started before non-API services and full readiness are established

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R06`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R06`

**Invariant.** The start result and exit status must distinguish process creation from initialization and from full-stack readiness. A successful terminal start must require every required role to own an observable compatible runtime generation, or return a non-ready outcome.

**Trigger.** Start the managed stack under blocked database/cockpit/scheduler/worker/upstream readiness or a child stuck after process creation.

**Current behavior.** The function persists the stack and returns started once API health is successful. The calculated stack may be blocked or degraded without changing outcome or CLI success.

**Expected behavior.** The start result and exit status must distinguish process creation from initialization and from full-stack readiness. A successful terminal start must require every required role to own an observable compatible runtime generation, or return a non-ready outcome.

**Impact.** Automation and systemd can treat an incomplete stack as successfully started. BWS-600 evidence can begin against partial services, stale checkpoints, or unavailable durable state.

**Root cause.** Startup outcome authority is tied to one API probe rather than the complete required-role state machine.

**Minimal fix boundary.** Define explicit initializing, started-not-ready, ready, degraded, and failed-start outcomes. Require service-owned generation/status evidence for all roles before ready, and ensure CLI/systemd exit semantics reflect the returned condition.

**Current files and symbols.**
- `packages/bootstrap/src/operations/operator-lifecycle.ts` `spawnAndPersistLifecycleState / waitForManagedApiObservable / publishLifecycleEvidence` `446-523; 526-599; 948-976` `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`
- `tests/bws-operator-lifecycle.test.ts` `start lifecycle blocked-readiness expectation` `204-213` `ff44f4a8b802187d11c4b9eb4d84cfc15570107a9080c27cfd0f48123a74a9e6`

**Required tests.**
- Child alive but loop state absent
- API healthy with readiness blocked
- Scheduler or worker initialization hang
- Database migration blocked after child creation
- Start result/exit code matrix for initializing, blocked, degraded, and ready

**Blocks release/deployment.** `true`

## BWS118-R06-003 — Active processes are not bound to an immutable executable generation and status or stop commands rebuild dist

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R06`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R06`

**Invariant.** Every managed process must remain bound to the exact immutable bytes it started from. Status and stop must inspect that recorded generation without mutating or replacing executable files.

**Trigger.** Change/rebuild dist after start or invoke a status/stop script that runs npm build.

**Current behavior.** Only repositoryRoot and a config fingerprint are enforced. Recorded source fingerprints are not asserted. Several status/stop wrappers clean and rebuild dist before managing the active generation.

**Expected behavior.** Every managed process must remain bound to the exact immutable bytes it started from. Status and stop must inspect that recorded generation without mutating or replacing executable files.

**Impact.** Status can report an old process as current after source changes, and stop/status can replace on-disk executable bytes beneath an active process. Release identity and evidence lineage diverge.

**Root cause.** Descriptive source metadata is not part of the enforced lifecycle identity, and wrapper commands conflate build/deploy with read-only management.

**Minimal fix boundary.** Record a canonical executable/package digest or release-directory identity at start, assert it on status/stop/evidence, run active services from immutable release directories, and remove builds from status/stop paths. Treat generation mismatch as explicit degraded/blocked ownership, not a reason to abandon stop authority.

**Current files and symbols.**
- `packages/bootstrap/src/operations/operator-lifecycle.ts` `createLifecycleContext / collectSourceFingerprints / assertion functions` `351-397; 498-510; 823-850; 1249-1267` `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`
- `package.json` `build and runtime scripts` `15-18; 33-47` `b1b69ffa6d0b974c3b3ba55f3ec1acffb21e512c3a862e2a7b2d6b5139e5eac0`
- `scripts/bws-root-wrapper-runtime.mjs` `prepareRuntimeBuild / runLifecycleStart` `137-165` `1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8`
- `docs/035_continuous_service_supervisor_contract.md` `BWS-584 required behavior` `87-103` `cae4ce541c65848974de8c4568e72b6d2d3d151d9f2c3eaf52cb50e6777c8505`

**Required tests.**
- Start generation A then change source and query status
- Start generation A then rebuild dist and stop
- Package version unchanged but executable bytes changed
- Source-manifest drift and repaired manifest transitions
- Immutable release-directory start/status/stop

**Blocks release/deployment.** `true`

## BWS118-R06-004 — Partial startup can orphan the just-spawned detached child before it enters rollback ownership

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R06`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R06`

**Invariant.** The child must enter rollback ownership atomically with creation, and startup failure must either terminate and verify it or retain an explicit ambiguous ownership record.

**Trigger.** Cause /proc verification, command validation, repository read, timeout, evidence/logging, or parent interruption between spawn and startedProcesses.push.

**Current behavior.** The catch block cleans only startedProcesses. The current detached child is omitted until after verification succeeds, so it can survive with no state-file record.

**Expected behavior.** The child must enter rollback ownership atomically with creation, and startup failure must either terminate and verify it or retain an explicit ambiguous ownership record.

**Impact.** An untracked scheduler, worker, convergence loop, or API can continue after startup reports failure, and later starts can create duplicates.

**Root cause.** Rollback ownership is established after a fallible verification phase rather than immediately after successful spawn.

**Minimal fix boundary.** Create an immediate provisional process record, keep the ChildProcess owned until verification completes, persist initializing/ambiguous ownership before detachment, and make rollback record any child whose exit cannot be verified.

**Current files and symbols.**
- `packages/bootstrap/src/operations/operator-lifecycle.ts` `spawnAndPersistLifecycleState` `446-523` `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`
- `packages/bootstrap/src/operations/operator-lifecycle.ts` `spawnManagedLifecycleProcess` `1094-1125` `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`

**Required tests.**
- Verification failure after successful spawn
- Parent SIGTERM during each startup stage
- Child starts slowly but survives timeout
- Logging or evidence failure after spawn
- Restart after provisional/ambiguous ownership

**Blocks release/deployment.** `true`

## BWS118-R06-005 — Stale-state recovery deletes ownership and starts replacements even when cleanup failed

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R06`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R06`

**Invariant.** Recovery must preserve ambiguous ownership and refuse replacement until every prior owner is verified absent or transferred under a fenced generation.

**Trigger.** Call start against partial state where shutdownManagedProcesses throws.

**Current behavior.** cleanupManagedProcesses swallows the error; start then deletes state and launches a fresh stack.

**Expected behavior.** Recovery must preserve ambiguous ownership and refuse replacement until every prior owner is verified absent or transferred under a fenced generation.

**Impact.** The system can intentionally lose the only durable record for live children and create overlapping service generations.

**Root cause.** Recovery prioritizes replacement progress over preservation of ambiguous ownership.

**Minimal fix boundary.** Return a cleanup result per PID, retain state and evidence for any ambiguous/live owner, prohibit replacement without a fenced takeover, and provide an explicit operator-reviewed recovery action for irreconcilable ownership.

**Current files and symbols.**
- `packages/bootstrap/src/operations/operator-lifecycle.ts` `startManagedBwsOperatorStack / cleanupManagedProcesses` `246-260; 740-749` `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`
- `packages/bootstrap/src/operations/operator-lifecycle.ts` `shutdownManagedProcesses` `752-771` `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`

**Required tests.**
- First child ignores SIGTERM
- Later child remains live after an earlier timeout
- Mixed missing/running process set
- Cleanup throws from process signal or /proc read
- Recovery retry after partial termination

**Blocks release/deployment.** `true`

## BWS118-R06-006 — Lifecycle timeout settings are per-step rather than one aggregate deadline

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R06`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R06`

**Invariant.** A caller-specified aggregate deadline must bound the whole lifecycle command, with remaining time passed to each stage and a consistent supervisor budget.

**Trigger.** Consume most of the configured timeout in multiple sequential stages.

**Current behavior.** The same timeout is restarted for every child and the API. Stop similarly restarts its timeout per child. The root synchronous command has no deadline.

**Expected behavior.** A caller-specified aggregate deadline must bound the whole lifecycle command, with remaining time passed to each stage and a consistent supervisor budget.

**Impact.** Commands can exceed operator and systemd budgets by multiples, be killed externally in partial states, or hang indefinitely without a terminal lifecycle record.

**Root cause.** Timeouts are modeled as local polling limits rather than one composed lifecycle budget.

**Minimal fix boundary.** Create a monotonic command deadline, pass remaining budget to spawn verification, probes, child drain/exit, and wrapper subprocesses, reserve cleanup time, and align systemd and evidence-command margins with that single budget.

**Current files and symbols.**
- `packages/bootstrap/src/operations/operator-lifecycle.ts` `spawnAndPersistLifecycleState / waitForManagedApiObservable / shutdownManagedProcesses` `454-496; 752-771` `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`
- `deployment/systemd-user/bws-operator.service.template` `service timeout contract` `6-17` `ea4b7762d1c747f25f2cd9a779ef05e44ea25a2c026363461f85fe6608d64b4c`
- `scripts/bws-root-wrapper-runtime.mjs` `runCommand` `670-680` `1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8`

**Required tests.**
- Four slow child starts plus API probe
- Multiple slow child exits
- Outer systemd timeout before inner command deadline
- Wrapper child process that never exits
- Deadline expiration at each transition boundary

**Blocks release/deployment.** `true`

## BWS118-R06-007 — API health, readiness, and metrics can remain green from declarations and stale state files after child failure

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R06`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R06`

**Invariant.** Health must describe current liveness, readiness must require every necessary service and durable dependency for the exact runtime generation, and metrics must not promote stale files to running.

**Trigger.** Query health/readiness/metrics after process loss or stale-file retention.

**Current behavior.** Several components remain pass by construction. Metrics reports API ready and reads lifecycle values directly from files. No PID/token/start-tick/source-generation check is performed in these snapshots.

**Expected behavior.** Health must describe current liveness, readiness must require every necessary service and durable dependency for the exact runtime generation, and metrics must not promote stale files to running.

**Impact.** The API can remain HTTP 200 and systemd/operator evidence can remain green after scheduler, worker, convergence, database, or lifecycle ownership has failed.

**Root cause.** Health/readiness aggregation does not consume the lifecycle owner as authoritative current state.

**Minimal fix boundary.** Build health/readiness from verified lifecycle ownership, exact runtime IDs/source generation, database compatibility/connectivity, loop service checkpoints and freshness, and API request-serving state. Make stale/unknown explicit and fail closed.

**Current files and symbols.**
- `packages/bootstrap/src/operations/service-runtime.ts` `createBwsOperationalStatusSnapshot` `330-417` `5ef569931413868cf0b2e69a653ee65cdcace9bb561f52eea1d9fb82e3ce93f3`
- `packages/bootstrap/src/operations/observability.ts` `createBwsMetricsSnapshot` `442-527` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`
- `packages/bootstrap/src/api/bws-read-only-query-http.ts` `health and readiness routes` `125-153` `fc644a168e07d1afa63d84fa85582cda9c37994b2b4d66ea7366c1f442c7ac17`
- `tests/bws-service-runtime.test.ts` `operational status snapshot tests` `120-200` `6d6e726a0a688c6d673457287173d07a5359caf9ce4c09dde73b2dcb938d63cc`

**Required tests.**
- Kill each managed child then query all three endpoints
- Stale state file with reused PID
- Database unavailable after startup
- Runtime ID mismatch across state files
- Loop last-success age exceeds policy
- API listener alive but query dependencies failed

**Blocks release/deployment.** `true`

## BWS118-R06-008 — The root runtime summary is disconnected from production lifecycle evidence, process verification, and HTTP envelopes

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R06`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R06`

**Invariant.** The summary must call or reuse the authoritative lifecycle status path, verify every managed process and generation, consume the actual response schemas, and locate immutable evidence through a canonical index/pointer.

**Trigger.** Run the root runtime summary against production envelopes or a state file with no current process ownership.

**Current behavior.** Production nested envelopes are classified degraded. Conversely, test-shaped top-level envelopes plus raw state and hand-written latest files can be classified ready without any process records.

**Expected behavior.** The summary must call or reuse the authoritative lifecycle status path, verify every managed process and generation, consume the actual response schemas, and locate immutable evidence through a canonical index/pointer.

**Impact.** Operator tooling can hide a healthy production API, or more dangerously, report ready for a nonexistent/stale stack. This undermines check_progress and acceptance routing.

**Root cause.** Operator summary logic duplicated lifecycle and HTTP contracts instead of consuming their typed, generation-bound authority.

**Minimal fix boundary.** Make runtime-summary invoke a read-only lifecycle status API/module or parse its exact schema, verify process ownership and source generation, use the evidence index for immutable latest selection, and reject missing process arrays or runtime-ID mismatches.

**Current files and symbols.**
- `scripts/bws-root-wrapper-runtime.mjs` `runtime summary constants / buildRuntimeSummary / classifyRuntimeCondition` `8-13; 320-386; 511-542` `1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8`
- `packages/bootstrap/src/api/bws-read-only-query-http.ts` `health and readiness response envelopes` `128-153` `fc644a168e07d1afa63d84fa85582cda9c37994b2b4d66ea7366c1f442c7ac17`
- `packages/bootstrap/src/operations/operator-lifecycle.ts` `resolveLifecycleEvidenceFilePath` `913-927` `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`
- `tests/root-wrapper-runtime.test.ts` `createRuntimeFixture` `302-423` `f216fabdae694a4848855786d665f2ac05e627648d7332d0b1e37c45dc9d22c3`

**Required tests.**
- Production /health and /readiness envelope fixtures generated by the actual handler
- State file with no processes
- Stale process records and missing latest pointer
- Concurrent evidence index update
- Runtime ID/source generation mismatch
- check_progress exit/status behavior for ready, degraded, blocked, not-running

**Blocks release/deployment.** `true`

## BWS118-R06-009 — CLI exit codes and the oneshot systemd unit remain successful while the managed stack is degraded or gone

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R06`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R06`

**Invariant.** Supervisor success and active/readiness state must reflect the current generation-bound managed process set. Degraded/not-running status must be machine-visible as non-success.

**Trigger.** Query systemd state or reload after child failure.

**Current behavior.** The oneshot unit remains active after its command exits and has no MainPID supervising detached children. CLI status returns 0 for every non-exception result.

**Expected behavior.** Supervisor success and active/readiness state must reflect the current generation-bound managed process set. Degraded/not-running status must be machine-visible as non-success.

**Impact.** systemctl can report active and reload success when no BWS service is running, defeating restart policy, monitoring, and deployment acceptance.

**Root cause.** The deployment unit supervises a control command, not the runtime, and the CLI treats serialization as success rather than mapping state to exit status.

**Minimal fix boundary.** Use a long-running foreground supervisor as the systemd MainPID or create explicit target units per process with dependencies. Map status/readiness outcomes to documented nonzero exit codes and add a watchdog/restart policy bound to exact lifecycle state.

**Current files and symbols.**
- `packages/bootstrap/src/cli/bws-operator-lifecycle.ts` `runBwsOperatorLifecycleCli` `8-30` `b17dff2d4e4012091b01943761efa1fe593c3de159e318b7fece264e751bedb5`
- `deployment/systemd-user/bws-operator.service.template` `systemd user service` `6-17` `ea4b7762d1c747f25f2cd9a779ef05e44ea25a2c026363461f85fe6608d64b4c`
- `packages/bootstrap/src/operations/operator-lifecycle.ts` `getManagedBwsOperatorStackStatus` `266-300` `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`

**Required tests.**
- Child exits after oneshot start
- All children missing while unit remains active
- ExecReload under degraded/not_running
- systemd restart and stop during partial state
- Exit-code matrix for every lifecycle outcome

**Blocks release/deployment.** `true`

## BWS118-R06-010 — Shutdown uses startup role order instead of scheduler-stop, worker-drain, convergence, cockpit, API order

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R06`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R06`

**Invariant.** First prevent new scheduling, then allow/fence worker drain, then stop convergence, cockpit, and API while preserving status visibility until completion.

**Trigger.** Invoke stop on the managed stack.

**Current behavior.** SIGTERM is sent to upstream convergence first, then scheduler, worker, cockpit/API process.

**Expected behavior.** First prevent new scheduling, then allow/fence worker drain, then stop convergence, cockpit, and API while preserving status visibility until completion.

**Impact.** New scheduling can race with disappearing convergence, workers are signaled before an explicit drain contract is observed, and shutdown evidence cannot prove no lost or late work.

**Root cause.** Startup/status presentation order was reused as shutdown dependency order.

**Minimal fix boundary.** Define an explicit shutdown DAG/state machine, issue scheduler quiesce first, wait for a bounded worker drain/lease handoff, then stop convergence, cockpit, and API, with per-stage evidence and fallback escalation.

**Current files and symbols.**
- `packages/bootstrap/src/operations/operator-lifecycle.ts` `LIFECYCLE_ROLE_ORDER / shutdownManagedProcesses` `52-58; 752-771` `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`
- `docs/035_continuous_service_supervisor_contract.md` `BWS-584 ordered shutdown` `91-103` `cae4ce541c65848974de8c4568e72b6d2d3d151d9f2c3eaf52cb50e6777c8505`
- `tests/bws-operator-lifecycle.test.ts` `shutdown order assertion` `190-198` `ff44f4a8b802187d11c4b9eb4d84cfc15570107a9080c27cfd0f48123a74a9e6`

**Required tests.**
- Scheduler attempts a new cycle during shutdown
- Worker owns a lease during shutdown
- Drain completes and drain times out
- Convergence pass in flight while workers finish
- Exact signal/order/evidence assertions

**Blocks release/deployment.** `true`

## BWS118-R06-011 — One hung child aborts shutdown before remaining owned children are signaled

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R06`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R06`

**Invariant.** All owned processes should receive their stage-appropriate stop/quiesce signal, failures should be accumulated, escalation should be bounded, and retained state should identify every unresolved owner.

**Trigger.** Stop a stack whose first selected process does not exit.

**Current behavior.** The first timeout throws. Later children are never signaled, no aggregate result is emitted, and the state remains as it was before stop.

**Expected behavior.** All owned processes should receive their stage-appropriate stop/quiesce signal, failures should be accumulated, escalation should be bounded, and retained state should identify every unresolved owner.

**Impact.** A single hung service prevents API, worker, scheduler, and other processes from stopping, causes systemd timeout, and leaves no complete shutdown diagnosis.

**Root cause.** Shutdown is fail-fast at the first child rather than best-effort, fenced, and exhaustively accounted.

**Minimal fix boundary.** Use a dependency-aware bounded shutdown coordinator that signals all eligible roles, records per-PID outcomes, escalates TERM to an explicitly approved fallback only after identity revalidation, preserves unresolved ownership, and returns an aggregate degraded-stop result.

**Current files and symbols.**
- `packages/bootstrap/src/operations/operator-lifecycle.ts` `shutdownManagedProcesses` `752-771` `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`
- `packages/bootstrap/src/operations/operator-lifecycle.ts` `stopManagedBwsOperatorStack` `303-330` `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`

**Required tests.**
- First child ignores TERM
- Middle child times out after earlier exits
- Multiple children fail
- Signal throws ESRCH/EPERM
- Aggregate state/evidence and second-stop convergence

**Blocks release/deployment.** `true`

## BWS118-R06-012 — Stop signaling and exit waits are vulnerable to PID reuse after the initial /proc verification

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R06`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R06`

**Invariant.** Identity must be revalidated immediately before every signal and throughout exit verification using start ticks/token/cwd/cmdline or pidfd-style ownership.

**Trigger.** Race process termination/PID reuse between inspectManagedProcesses and process.kill or during waitForManagedProcessExit.

**Current behavior.** A stale PID can be signaled after a prior snapshot, and a replacement process can keep the exit loop alive until timeout. The initial strong /proc proof is not carried through the destructive boundary.

**Expected behavior.** Identity must be revalidated immediately before every signal and throughout exit verification using start ticks/token/cwd/cmdline or pidfd-style ownership.

**Impact.** An unrelated local process can receive SIGTERM, or stop can fail/hang while waiting for a replacement PID. This violates the no-unrelated-process-mutation contract.

**Root cause.** Strong process identity is implemented for observation but discarded for signal and completion operations.

**Minimal fix boundary.** Pass the full process record to signal/wait, re-read and compare /proc immediately before TERM and each poll, use pidfd where available, treat identity change as original owner exited, and never signal a mismatched replacement.

**Current files and symbols.**
- `packages/bootstrap/src/operations/operator-lifecycle.ts` `inspectManagedProcesses / shutdownManagedProcesses` `752-790` `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`
- `packages/bootstrap/src/operations/operator-lifecycle.ts` `readProcessSnapshot / waitForManagedProcessExit` `1037-1062; 1150-1158` `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`

**Required tests.**
- Synthetic process-runtime adapter simulating PID reuse before signal
- PID reuse during exit wait
- Command/token/cwd/start-tick mismatch
- ESRCH after verification
- pidfd and /proc fallback behavior

**Blocks release/deployment.** `true`

## BWS118-R06-013 — API listener and request promises lack one bounded, exception-safe ownership boundary

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R06`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R06`

**Invariant.** All request promises, listener errors, sockets, and close work must be owned by one boundary that catches failures, aborts in-flight work, closes within a deadline, publishes terminal state, and settles application.closed exactly once.

**Trigger.** Throw from metricsSnapshotFactory, send SIGTERM with an open request/socket, or throw during shutdown event emission.

**Current behavior.** An async request rejection can become unhandled and leave the client hanging. Signal callbacks use void close. server.close can wait indefinitely, and a pre-close logging exception occurs before closePromise is assigned.

**Expected behavior.** All request promises, listener errors, sockets, and close work must be owned by one boundary that catches failures, aborts in-flight work, closes within a deadline, publishes terminal state, and settles application.closed exactly once.

**Impact.** API shutdown can hang the stack, errors can bypass HTTP responses and lifecycle evidence, and late requests can complete after stop/replacement.

**Root cause.** Listener, request, logging, and close resources are composed as independent promises rather than one lifecycle-owned abort/error boundary.

**Minimal fix boundary.** Install error/signal ownership before listen is exposed, wrap every async request path, assign an idempotent close promise before fallible work, track sockets and requests, abort/stop admission on close, apply an aggregate deadline, and settle closed with a recorded success/failure exactly once.

**Current files and symbols.**
- `packages/bootstrap/src/operations/runtime-applications.ts` `startBwsReadOnlyApiApplication / close / closeHttpServer` `190-300; 863-889` `216b980403a59909b07a27fb475d22cf6ee35b41364fd0bb46c510d17d9e0322`
- `packages/bootstrap/src/api/bws-read-only-query-http.ts` `createBwsReadOnlyQueryHttpHandler` `110-218` `fc644a168e07d1afa63d84fa85582cda9c37994b2b4d66ea7366c1f442c7ac17`
- `packages/bootstrap/src/operations/runtime-applications.ts` `createManagedRuntimeRequestHandler metrics and async dispatch` `617-674` `216b980403a59909b07a27fb475d22cf6ee35b41364fd0bb46c510d17d9e0322`
- `packages/bootstrap/src/cli/bws-read-only-api.ts` `runBwsReadOnlyApiCli` `16-39` `5e08f4cc0b5f76a7c5c04e735c791281607fa007031c55b2dc0bf38c9d4cf811`

**Required tests.**
- Throwing metrics/status/cockpit/logger callbacks
- Open keep-alive and partial-body requests during SIGTERM
- Concurrent close calls and two signals
- server.close error and timeout
- Request completion after replacement generation starts
- application.closed resolution/rejection contract

**Blocks release/deployment.** `true`

## BWS118-R06-014 — Successful service passes leave timeout timers alive until their full configured duration

- Severity: `P2`
- Confidence: `CONFIRMED`
- Primary owner: `R06`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R06`

**Invariant.** The losing timeout branch must be cancelled and released immediately, or use an unrefed/abortable deadline that cannot hold process liveness.

**Trigger.** Run a fast pass with a multi-second timeout and allow the service function to return.

**Current behavior.** Every successful pass leaves its timer pending. Repeated passes accumulate active timers; the final one can keep Node alive after the function returns.

**Expected behavior.** The losing timeout branch must be cancelled and released immediately, or use an unrefed/abortable deadline that cannot hold process liveness.

**Impact.** Shutdown and test processes are delayed, timer count grows with pass rate, and outer lifecycle timeouts can expire after logical completion.

**Root cause.** The timeout helper uses a bare sleep promise whose timer handle is inaccessible to the winner path.

**Minimal fix boundary.** Replace sleepFor race with an abortable timeout helper that clears its handle in finally, and ensure late pass handling remains owned under the R01/R03 cancellation contracts.

**Current files and symbols.**
- `packages/bootstrap/src/operations/upstream-convergence-service.ts` `raceWithTimeout` `504-526` `937ad8b789002504b674351c04e2179ba2800e17deea1d5e17aa0dd31786d5a8`
- `packages/bootstrap/src/operations/private-paper-scheduler-service.ts` `raceWithTimeout` `531-553` `876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967`
- `packages/bootstrap/src/operations/private-paper-worker-service.ts` `raceWithTimeout` `552-574` `1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36`

**Required tests.**
- Fast pass with long timeout
- Thousands of quick passes with active-handle count
- Shutdown immediately after pass completion
- Timeout winner and pass rejection races
- No double settlement or unhandled rejection

**Blocks release/deployment.** `true`

## BWS118-R06-015 — Unexpected pass failures exit without a terminal service state or failure evidence

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R06`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R06`

**Invariant.** The service must transition to failed/unknown with timestamp, error class, current pass, process generation, and terminal evidence before returning/rethrowing; status must not report running.

**Trigger.** Reject the pass promise after service_started and pass-start state are written.

**Current behavior.** The rejection escapes. Signal listeners are disposed, but the durable state remains lifecycleState=running and no failure/stop evidence is written.

**Expected behavior.** The service must transition to failed/unknown with timestamp, error class, current pass, process generation, and terminal evidence before returning/rethrowing; status must not report running.

**Impact.** Status and metrics can falsely report a dead service as running; restart sees stale state without the failure cause; incident evidence is incomplete.

**Root cause.** Only expected result variants are modeled; unexpected exceptions are treated as process errors without durable lifecycle finalization.

**Minimal fix boundary.** Add failed/unknown terminal states and a top-level catch/finally that records sanitized failure evidence and state exactly once, while preserving the original error and any ambiguous in-flight operation identity.

**Current files and symbols.**
- `packages/bootstrap/src/operations/upstream-convergence-service.ts` `runBwsUpstreamConvergenceService` `301-414` `937ad8b789002504b674351c04e2179ba2800e17deea1d5e17aa0dd31786d5a8`
- `packages/bootstrap/src/operations/private-paper-scheduler-service.ts` `runBwsPrivatePaperSchedulerService` `305-421` `876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967`
- `packages/bootstrap/src/operations/private-paper-worker-service.ts` `runBwsPrivatePaperWorkerService` `317-451` `1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36`

**Required tests.**
- Rejected pass promise
- State write failure after pass
- Evidence/logger failure after state write
- Exception during classification
- Restart/status from failed and unknown states

**Blocks release/deployment.** `true`

## BWS118-R06-016 — Millisecond evidence filenames collide across legitimate lifecycle events and can crash the service

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R06`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R06`

**Invariant.** Evidence identity must include a collision-resistant runtime generation and monotonic event sequence/UUID, with atomic no-overwrite publication and deterministic index linkage.

**Trigger.** Run startup and a fast pass, or two status commands, with the same generatedAt millisecond.

**Current behavior.** The second legitimate event targets the same path and throws. State may already have advanced before evidence publication fails.

**Expected behavior.** Evidence identity must include a collision-resistant runtime generation and monotonic event sequence/UUID, with atomic no-overwrite publication and deterministic index linkage.

**Impact.** A fast service can crash on its first pass, concurrent status can fail, and state/evidence diverge. Restart and acceptance trails become incomplete.

**Root cause.** Wall-clock millisecond plus low-cardinality fields is used as a uniqueness key rather than a timestamp attribute.

**Minimal fix boundary.** Add runtimeId plus a monotonic event counter or UUID to evidence IDs, use atomic create, update an append/index record only after durable artifact publication, and define recovery when state exists without its evidence event.

**Current files and symbols.**
- `packages/bootstrap/src/operations/upstream-convergence-service.ts` `writeEvidenceRecord / resolveEvidenceFilePath` `873-900` `937ad8b789002504b674351c04e2179ba2800e17deea1d5e17aa0dd31786d5a8`
- `packages/bootstrap/src/operations/private-paper-scheduler-service.ts` `writeEvidenceRecord / resolveEvidenceFilePath` `895-921` `876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967`
- `packages/bootstrap/src/operations/private-paper-worker-service.ts` `writeEvidenceRecord / resolveEvidenceFilePath` `954-972` `1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36`
- `packages/bootstrap/src/operations/operator-lifecycle.ts` `writeLifecycleEvidence / resolveLifecycleEvidenceFilePath` `913-927` `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`

**Required tests.**
- Fixed clock startup plus pass completion
- Concurrent status commands
- Multiple blocked/retry passes in one millisecond
- Clock regression
- State/evidence write failure reconciliation

**Blocks release/deployment.** `true`

## BWS118-R06-017 — Health and failure diagnostics synchronously hash or read unbounded filesystem data

- Severity: `P2`
- Confidence: `CONFIRMED`
- Primary owner: `R06`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R06`

**Invariant.** Hot health paths and failure reporting must use bounded cached fingerprints, bounded tail reads, capped file enumeration, and explicit stale/error states.

**Trigger.** Query health/readiness repeatedly or trigger startup diagnostics under large filesystem state.

**Current behavior.** Health recomputes the entire build digest synchronously; error-tail reads full logs; root summary enumerates all matching logs.

**Expected behavior.** Hot health paths and failure reporting must use bounded cached fingerprints, bounded tail reads, capped file enumeration, and explicit stale/error states.

**Impact.** The loopback API can block, memory can spike during failure handling, status can exceed its own deadlines, and observability work can prevent shutdown.

**Root cause.** Immutable build metadata and bounded tail/index primitives exist conceptually, but production paths recompute or scan raw filesystem content.

**Minimal fix boundary.** Verify cockpit digest once at startup and cache it with immutable build identity, stream bounded log tails from the end, cap and page log listings, and propagate timeout/stale/error conditions without blocking the event loop.

**Current files and symbols.**
- `packages/bootstrap/src/operations/runtime-applications.ts` `readCockpitState / fingerprintDirectory` `190-198; 675-712` `216b980403a59909b07a27fb475d22cf6ee35b41364fd0bb46c510d17d9e0322`
- `packages/bootstrap/src/operations/operator-lifecycle.ts` `readManagedProcessStdioTail` `1128-1147` `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`
- `scripts/bws-root-wrapper-runtime.mjs` `readStructuredLogFiles` `605-615` `1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8`

**Required tests.**
- Large cockpit asset tree
- Single multi-gigabyte child log
- Hundreds of thousands of structured logs
- Concurrent health requests
- Filesystem mutation/error during scan

**Blocks release/deployment.** `false`

## BWS120-R07-001 — Configurable structured-log paths escape the repository and can rotate or append to out-of-bound files

- Severity: `P0`
- Confidence: `CONFIRMED`
- Primary owner: `R07`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R07`

**Invariant.** All managed observability output must be confined to a canonical repo-owned runtime directory, reject absolute/traversal paths, and reject every existing symlink segment before creating, rotating, or appending files.

**Trigger.** Supply an absolute path or traversal path outside the repository, then emit a structured event for a role such as api.

**Current behavior.** path.resolve(repositoryRoot, configuredValue) accepts an absolute value as-is and normalizes traversal outside the repository. mkdirSync, renameSync, and appendFileSync then operate there without a boundary check.

**Expected behavior.** All managed observability output must be confined to a canonical repo-owned runtime directory, reject absolute/traversal paths, and reject every existing symlink segment before creating, rotating, or appending files.

**Impact.** A configuration mistake or hostile environment can write, append, or rotate files outside the repository. This violates the review taxonomy repository-escape boundary and can damage unrelated files whose names collide with role logs.

**Root cause.** The logger treats an operator-controlled filesystem location as a generic resolved path rather than a confined repository resource.

**Minimal fix boundary.** Confine the effective log directory under one explicit repo-owned root; reject absolute paths, traversal, and existing symlink segments before mkdir, rotation, and append. Keep the public logger API and valid relative paths unchanged.

**Current files and symbols.**
- `packages/bootstrap/src/operations/observability.ts` `createBwsStructuredLogger` `L268-L331` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`
- `packages/bootstrap/src/operations/observability.ts` `rotateLogFileIfNeeded` `L783-L803` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`
- `packages/bootstrap/src/operations/observability.ts` `` `L268-L331` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`

**Required tests.**
- Absolute-path rejection
- ../ traversal rejection
- existing and intermediate symlink rejection
- outside-directory api.jsonl collision/rotation rejection
- valid repo-relative log rotation

**Blocks release/deployment.** `true`

## BWS120-R07-002 — Structured-log redaction misses Authorization, Cookie, API-key, header, and value-shaped secrets

- Severity: `P0`
- Confidence: `CONFIRMED`
- Primary owner: `R07`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R07`

**Invariant.** Secret-bearing keys and recognizable credential values must be redacted recursively before any file write, rotation, diagnostic collection, or artifact packaging.

**Trigger.** Log details such as {Authorization:"Bearer ..."}, {Cookie:"session=..."}, {apiKey:"..."}, or {headers:{authorization:"..."}}.

**Current behavior.** Those keys do not match the source pattern, and non-URL strings are returned unchanged. The structured log is then retained and included in diagnostics.

**Expected behavior.** Secret-bearing keys and recognizable credential values must be redacted recursively before any file write, rotation, diagnostic collection, or artifact packaging.

**Impact.** Credentials, session cookies, or authorization material can be persisted to logs and diagnostics/artifact archives. This is a direct secret-exposure defect.

**Root cause.** Redaction is based on an incomplete immediate-key allow/deny regex and URL-origin coercion, not a closed recursive secret policy.

**Minimal fix boundary.** Centralize redaction in a shared closed policy covering authorization/cookie/header/API-key aliases and credential-shaped values. Apply it before log serialization and diagnostics inclusion; do not expose raw values in error paths.

**Current files and symbols.**
- `packages/bootstrap/src/operations/observability.ts` `SENSITIVE_KEY_PATTERN` `L50-L51` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`
- `packages/bootstrap/src/operations/observability.ts` `sanitizeJsonValue` `L805-L837` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`
- `tests/bws-observability.test.ts` `structured observability logs rotate and redact sensitive fields` `L16-L66` `b1f86186bd8cc389a620c6ef53b60b83e2b8c3ef3dd7e0dc635ca6e9f5fda6c5`
- `packages/bootstrap/src/operations/observability.ts` `SENSITIVE_KEY_PATTERN / sanitizeJsonValue` `L50-L51; L805-L837` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`
- `packages/bootstrap/src/operations/observability.ts` `` `L50-L51; L805-L837` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`

**Required tests.**
- Authorization/Bearer redaction
- Cookie and Set-Cookie redaction
- apiKey/x-api-key redaction
- nested headers redaction
- Basic auth/PEM/connection-string value redaction
- negative tests for benign tokens such as event identifiers

**Blocks release/deployment.** `true`

## BWS120-R07-003 — Evidence-index deduplication and latest-summary publication are not serialized across processes

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R07`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R07`

**Invariant.** Index append, exact duplicate suppression, and latest-summary advancement must be one serialized, crash-recoverable publication transaction.

**Trigger.** Both processes read the pre-append index before either append/summary write completes.

**Current behavior.** Concurrent publishers can both append an exact duplicate, overwrite each other’s latest summary with different snapshots, or fail on shared publication state. There is no sequence, lock, or compare-and-set authority.

**Expected behavior.** Index append, exact duplicate suppression, and latest-summary advancement must be one serialized, crash-recoverable publication transaction.

**Impact.** Duplicate or stale evidence-index state breaks exactly-once publication, recent-evidence diagnostics, retention references, and campaign completion accounting.

**Root cause.** Evidence publication is implemented as independent filesystem operations instead of a single-owner append protocol with a monotonic receipt.

**Minimal fix boundary.** Add one repository-scoped publication lock or durable append repository, assign monotonic entry identity, make duplicate detection atomic, and derive latest.json from the committed append receipt.

**Current files and symbols.**
- `packages/bootstrap/src/operations/observability.ts` `registerBwsEvidenceArtifact` `L376-L408` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`
- `packages/bootstrap/src/operations/observability.ts` `writeJsonFile` `L1057-L1062` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`
- `packages/bootstrap/src/operations/observability.ts` `` `L376-L408` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`

**Required tests.**
- Two-process exact-duplicate barrier test
- two-process distinct-artifact barrier test
- crash between append and summary
- stale writer/CAS rejection
- restart reconciliation from index

**Blocks release/deployment.** `true`

## BWS120-R07-004 — Indexed evidence can be mutated or deleted after registration without invalidating acceptance

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R07`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R07`

**Invariant.** Accepted evidence must be immutable by construction, content-addressed/copied to retained storage, or revalidated against its recorded hash and file identity whenever used as current/accepted evidence.

**Trigger.** Modify, replace, truncate, or delete the artifact after the index entry is written.

**Current behavior.** The index continues to report the old path/hash as recent evidence even when the path no longer exists or contains different bytes. Re-registering the same path with a new hash simply adds another entry.

**Expected behavior.** Accepted evidence must be immutable by construction, content-addressed/copied to retained storage, or revalidated against its recorded hash and file identity whenever used as current/accepted evidence.

**Impact.** Campaigns and diagnostics can claim retained evidence that cannot be reproduced or whose current bytes differ from the acceptance receipt.

**Root cause.** The append-only metadata record is treated as immutability proof while the referenced artifact remains mutable path state.

**Minimal fix boundary.** Publish evidence to a non-replaceable content-addressed location or bind path inode/content to an immutable receipt; reject same-path content drift and verify existence/hash before acceptance and retention decisions.

**Current files and symbols.**
- `packages/bootstrap/src/operations/observability.ts` `registerBwsEvidenceArtifact` `L376-L408` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`
- `packages/bootstrap/src/operations/observability.ts` `readEvidenceIndexEntries / summarizeEntries` `L746-L780` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`
- `packages/bootstrap/src/operations/observability.ts` `registerBwsEvidenceArtifact / summarizeBwsEvidenceIndex` `L376-L417` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`
- `packages/bootstrap/src/operations/observability.ts` `` `L376-L417` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`

**Required tests.**
- Post-registration mutation
- post-registration deletion
- same-path different-content conflict
- content-address collision refusal
- accepted-evidence revalidation

**Blocks release/deployment.** `true`

## BWS120-R07-005 — Evidence “latest” state is append-order state, not monotonic currentness

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R07`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R07`

**Invariant.** Latest/current evidence must be selected by an explicit monotonic generation or campaign sequence with bounded clock validation and conflict rejection.

**Trigger.** Append a valid entry whose createdAt/runtime generation is older, unrelated, or implausibly future relative to the current accepted entry.

**Current behavior.** The last appended line becomes current regardless of timestamp, runtime generation, source fingerprint, or campaign relationship.

**Expected behavior.** Latest/current evidence must be selected by an explicit monotonic generation or campaign sequence with bounded clock validation and conflict rejection.

**Impact.** Diagnostics, progress, retention, and acceptance can point at stale or future evidence and misreport current runtime/campaign state.

**Root cause.** Physical append position is used as currentness authority without a monotonic logical generation contract.

**Minimal fix boundary.** Add explicit campaign/runtime generation, monotonic sequence, bounded timestamp policy, and compare-and-set latest advancement. Preserve conflicting/out-of-order entries as historical without promoting them.

**Current files and symbols.**
- `packages/bootstrap/src/operations/observability.ts` `registerBwsEvidenceArtifact` `L376-L408` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`
- `packages/bootstrap/src/operations/observability.ts` `summarizeEntries` `L746-L758` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`
- `packages/bootstrap/src/operations/observability.ts` `readEvidenceIndexEntries` `L761-L780` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`
- `packages/bootstrap/src/operations/observability.ts` `summarizeEntries / readEvidenceIndexEntries` `L746-L780` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`
- `packages/bootstrap/src/operations/observability.ts` `` `L746-L780` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`

**Required tests.**
- Backdated append
- future-dated append
- delayed old runtime append
- cross-runtime conflict
- same-sequence different-hash rejection
- restart latest reconstruction

**Blocks release/deployment.** `true`

## BWS120-R07-006 — Loopback diagnostics accept non-2xx and schema-invalid JSON as successful health/readiness/metrics evidence

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R07`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R07`

**Invariant.** Every probe must require an exact route-specific 2xx status, content type, closed schema, runtime/source generation, and fail-closed error classification.

**Trigger.** Return HTTP 500/404/3xx with JSON containing ready-shaped fields, or 200 with a wrong schema.

**Current behavior.** Any parseable JSON is represented as an ok response. Downstream diagnostics and runtime-evidence sampling read its fields without a transport receipt.

**Expected behavior.** Every probe must require an exact route-specific 2xx status, content type, closed schema, runtime/source generation, and fail-closed error classification.

**Impact.** Error bodies, route confusion, or an incompatible local process can be promoted into healthy/ready/metrics evidence.

**Root cause.** JSON parse success is conflated with HTTP and contract success.

**Minimal fix boundary.** Return a typed probe receipt containing status, content type, final URL, route, body hash, schema/version, runtime ID, and source fingerprint; reject non-2xx, redirects, and malformed/extra-state bodies.

**Current files and symbols.**
- `packages/bootstrap/src/operations/observability.ts` `collectDiagnosticsStateSnapshot` `L631-L677` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`
- `packages/bootstrap/src/operations/observability.ts` `fetchLoopbackJson` `L691-L713` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`
- `tests/bws-observability.test.ts` `diagnostics fetchJson fixture` `L138-L180` `b1f86186bd8cc389a620c6ef53b60b83e2b8c3ef3dd7e0dc635ca6e9f5fda6c5`
- `packages/bootstrap/src/operations/observability.ts` `` `L691-L713` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`

**Required tests.**
- 500 JSON ready body
- 404 JSON
- redirect
- wrong content type
- wrong schema/version
- different runtime ID
- oversized body and timeout

**Blocks release/deployment.** `true`

## BWS120-R07-007 — A failed metrics request is silently replaced by synthesized metrics that declare the API ready

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R07`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R07`

**Invariant.** Missing endpoint evidence must remain missing/blocked and be explicitly labeled by origin; synthesized operational context must never claim endpoint readiness.

**Trigger.** Time out, refuse, or return invalid JSON from the metrics endpoint.

**Current behavior.** The diagnostics bundle contains a locally synthesized bws.metrics_snapshot.v1 with api.status=ready. Its shape is indistinguishable from fetched metrics to downstream readers.

**Expected behavior.** Missing endpoint evidence must remain missing/blocked and be explicitly labeled by origin; synthesized operational context must never claim endpoint readiness.

**Impact.** Diagnostics can fabricate partial readiness and obscure an endpoint failure. Combined with stale lifecycle/readiness sources, this weakens false-readiness resistance.

**Root cause.** The code uses a convenience snapshot as evidence fallback without origin or conservative status semantics.

**Minimal fix boundary.** Split fetched endpoint evidence from local diagnostic context. On fetch failure set metrics origin=synthesized and API status=blocked/unknown; prohibit synthesized fields from satisfying acceptance.

**Current files and symbols.**
- `packages/bootstrap/src/operations/observability.ts` `createBwsMetricsSnapshot` `L479-L484` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`
- `packages/bootstrap/src/operations/observability.ts` `collectDiagnosticsStateSnapshot` `L631-L677` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`
- `packages/bootstrap/src/operations/observability.ts` `collectDiagnosticsStateSnapshot / createBwsMetricsSnapshot` `L479-L484; L631-L677` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`
- `packages/bootstrap/src/operations/observability.ts` `` `L479-L484; L631-L677` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`

**Required tests.**
- Metrics timeout/refusal
- non-JSON metrics response
- fetched-versus-synthesized origin
- fallback cannot satisfy sampleIsReady
- mixed stale-state regression

**Blocks release/deployment.** `true`

## BWS120-R07-008 — Retention classes are recorded but no reference-aware retention or pruning lifecycle is implemented

- Severity: `P2`
- Confidence: `CONFIRMED`
- Primary owner: `R07`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R07`

**Invariant.** Every retention class must have an explicit plan/apply policy that protects accepted ledger rows, active runtimes, unresolved blockers, and retained handoffs while bounding disk/inode growth.

**Trigger.** Allow normal repeated evidence production over time.

**Current behavior.** Retention class values are written and displayed, but repository-wide tracing found no R07 retention planner/apply path for the observability index or diagnostics directories.

**Expected behavior.** Every retention class must have an explicit plan/apply policy that protects accepted ledger rows, active runtimes, unresolved blockers, and retained handoffs while bounding disk/inode growth.

**Impact.** Long campaigns can exhaust disk or inodes; ad-hoc cleanup risks deleting still-referenced acceptance evidence.

**Root cause.** Retention metadata was implemented without the state machine that interprets it and proves reference safety.

**Minimal fix boundary.** Add dry-run retention planning, immutable reference graph evaluation, bounded apply, interruption recovery, and post-apply index reconciliation. R08 owns generic backup/retention mechanics; R07 owns evidence reference semantics.

**Current files and symbols.**
- `packages/bootstrap/src/operations/observability.ts` `registerBwsEvidenceArtifact` `L376-L408` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`
- `packages/bootstrap/src/operations/observability.ts` `collectBwsDiagnosticsBundle` `L530-L592` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`
- `docs/038_observability_metrics_and_evidence_contract.md` `Evidence index and retention contract` `L53-L57` `b244f607ae9a2f03f808cf746aa820a263fb669dadcbc74c9ed5a6ec33b9e556`
- `packages/bootstrap/src/operations/observability.ts` `registerBwsEvidenceArtifact / collectBwsDiagnosticsBundle` `L376-L408; L530-L592` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`
- `packages/bootstrap/src/operations/observability.ts` `` `L376-L408; L530-L592` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`

**Required tests.**
- Plan/apply parity
- active runtime protection
- accepted handoff protection
- unresolved blocker protection
- interrupted pruning recovery
- disk/inode bound soak

**Blocks release/deployment.** `true`

## BWS120-R07-009 — BWS-600 readiness can be certified from one ready sample and does not require a continuously ready window

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R07`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R07`

**Invariant.** A configured 72-hour evidence window must evaluate every scheduled interval, require an explicit continuity policy, account for missed samples, and fail/qualify any degradation according to that policy.

**Trigger.** Run the default BWS-600 route; alternatively run keep-monitoring with earlier blocked samples followed by one final ready sample.

**Current behavior.** The default exits immediately on the first ready sample. With monitoring enabled, a blocked-to-ready sequence ends ready because the mutable ready variable contains only the last sample; earlier failures are not part of the verdict.

**Expected behavior.** A configured 72-hour evidence window must evaluate every scheduled interval, require an explicit continuity policy, account for missed samples, and fail/qualify any degradation according to that policy.

**Impact.** A nominal multi-day campaign can complete in one cycle and advertise continuous readiness without continuous evidence.

**Root cause.** The implementation models readiness as a latest-sample boolean instead of a window aggregate with continuity requirements.

**Minimal fix boundary.** Define an explicit window policy: minimum elapsed monotonic duration, expected sample schedule, maximum gap, minimum sample count, and all/threshold readiness semantics. Keep ready handoff provisional until the window closes.

**Current files and symbols.**
- `packages/bootstrap/src/operations/paper-runtime-evidence.ts` `createBwsPaperRuntimeEvidence` `L206-L330` `d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d`
- `run-paper-autopilot.sh` `defaults / run_child_controller` `L15-L30; L842-L872` `fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661`
- `run-paper-evaluation.sh` `run_runtime_evidence_mode` `L845-L933` `d7d821119d51c3dd5bbcf7a80f0e98488ebd38f7d771310265939a918505e667`
- `tests/bws-paper-runtime-evidence.test.ts` `ready observation test` `L519-L598` `64b1c04c9d626dedf3059393e095c4a4e8c5cf4399ccb3deb88d60d433d51439`
- `packages/bootstrap/src/operations/paper-runtime-evidence.ts` `` `L206-L330` `d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d`

**Required tests.**
- One ready sample must not satisfy 72h
- ready→blocked
- blocked→ready
- missed intervals
- collection gap
- exact duration/minimum sample count
- restart/resume continuity

**Blocks release/deployment.** `true`

## BWS120-R07-010 — Runtime-evidence readiness is not bound to one exact source, data, process, campaign, and artifact generation

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R07`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R07`

**Invariant.** One observation must cryptographically bind exact source/release/upstream lock, runtime/process identities, data generation/currentness, response receipts, diagnostics manifest, lifecycle evidence, evidence-index sequence, and parent campaign.

**Trigger.** Present individually valid ready-shaped inputs whose runtime IDs/source fingerprints/campaigns differ, or a stale upstreamLastSuccessAt.

**Current behavior.** The sample and result contain no fields capable of proving those relationships, and sampleIsReady does not compare them.

**Expected behavior.** One observation must cryptographically bind exact source/release/upstream lock, runtime/process identities, data generation/currentness, response receipts, diagnostics manifest, lifecycle evidence, evidence-index sequence, and parent campaign.

**Impact.** Mixed-generation or stale evidence can satisfy R07 readiness even when no coherent runtime state ever existed.

**Root cause.** R07 promotion reduces rich source artifacts to unbound status labels and paths before acceptance.

**Minimal fix boundary.** Introduce an immutable observation receipt with hashes and generation IDs for every component; validate all joins, freshness, and parent campaign fingerprint before promotion; include the receipt digest in the result and parent terminal protocol.

**Current files and symbols.**
- `packages/bootstrap/src/operations/paper-runtime-evidence.ts` `buildObservationSample` `L406-L439` `d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d`
- `packages/bootstrap/src/operations/paper-runtime-evidence.ts` `sampleIsReady` `L455-L468` `d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d`
- `packages/bootstrap/src/operations/paper-runtime-evidence.ts` `createResult` `L471-L519` `d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d`
- `packages/bootstrap/src/operations/paper-runtime-evidence.ts` `buildObservationSample / sampleIsReady / createResult` `L406-L519` `d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d`
- `packages/bootstrap/src/operations/paper-runtime-evidence.ts` `` `L406-L519` `d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d`

**Required tests.**
- Mixed runtime IDs
- mixed source fingerprints
- stale/future lastSuccessAt
- diagnostics path with different hash
- lifecycle/handoff generation mismatch
- evidence-index sequence mismatch
- campaign-manifest mismatch

**Blocks release/deployment.** `true`

## BWS120-R07-011 — Observation duration is governed by wall-clock strings and can be unbounded or prematurely complete after clock changes

- Severity: `P2`
- Confidence: `CONFIRMED`
- Primary owner: `R07`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R07`

**Invariant.** Max duration must use a monotonic clock/deadline and bounded cancellation, while UTC timestamps are recorded only as evidence.

**Trigger.** Run a never-ready observation with constant or decreasing timestamps.

**Current behavior.** The elapsed calculation may never reach maxDurationMs after a backward/frozen clock, or may terminate early after a forward jump.

**Expected behavior.** Max duration must use a monotonic clock/deadline and bounded cancellation, while UTC timestamps are recorded only as evidence.

**Impact.** Runtime evidence collection can hang beyond its budget or produce a truncated window unrelated to the configured duration.

**Root cause.** Wall-clock evidence time is also used as the control-plane deadline.

**Minimal fix boundary.** Use performance.now/process.hrtime or an injected monotonic clock plus AbortSignal; retain bounded wall-clock skew checks separately.

**Current files and symbols.**
- `packages/bootstrap/src/operations/paper-runtime-evidence.ts` `createBwsPaperRuntimeEvidence observation loop` `L289-L322` `d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d`
- `packages/bootstrap/src/operations/paper-runtime-evidence.ts` `` `L289-L322` `d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d`

**Required tests.**
- Frozen time
- backward jump
- forward jump
- abort during sleep/collection
- maximum sample/iteration guard

**Blocks release/deployment.** `true`

## BWS120-R07-012 — Diagnostics, runtime-evidence, and handoff outputs bypass the canonical evidence index and publication transaction

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R07`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R07`

**Invariant.** Every acceptance-relevant artifact set must be published once through the canonical index with exact hashes, dependencies, retention class, campaign/runtime generation, and an atomic completion receipt.

**Trigger.** Complete any diagnostics collection, paper runtime evidence run, or handoff creation.

**Current behavior.** These artifacts are written independently. The index may know none of them, runtime-evidence output can replace an existing path, and no shared receipt proves the set completed together.

**Expected behavior.** Every acceptance-relevant artifact set must be published once through the canonical index with exact hashes, dependencies, retention class, campaign/runtime generation, and an atomic completion receipt.

**Impact.** Retention, discovery, latest/current selection, downstream handoff, and post-crash reconciliation cannot prove the exact evidence set used for acceptance.

**Root cause.** Core evidence producers implement file creation but not the repository’s declared evidence publication lifecycle.

**Minimal fix boundary.** Create one R07 evidence-set transaction that stages immutable files, computes hashes, records dependency edges, appends one committed index receipt, and advances latest only after full verification. Refuse accidental overwrite.

**Current files and symbols.**
- `packages/bootstrap/src/operations/observability.ts` `collectBwsDiagnosticsBundle` `L530-L592` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`
- `packages/bootstrap/src/operations/paper-runtime-evidence.ts` `writeBwsPaperRuntimeEvidence` `L375-L404` `d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d`
- `packages/bootstrap/src/operations/paper-runtime-handoff.ts` `createBwsPaperRuntimeHandoff` `L104-L196` `6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f`
- `packages/bootstrap/src/operations/external-runtime-preflight.ts` `createBwsExternalRuntimeCampaignManifest` `L414-L425` `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427`
- `packages/bootstrap/src/operations/paper-runtime-evidence.ts` `` `L375-L404` `d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d`

**Required tests.**
- Each producer indexed exactly once
- same-output collision
- crash before/after each staged file
- index append failure
- restart reconciliation
- retention reference graph

**Blocks release/deployment.** `true`

## BWS120-R07-013 — Runtime handoff can combine a lifecycle snapshot with a different source-tree generation

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R07`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R07`

**Invariant.** A handoff must pin one immutable source/build generation before status inspection, prove the running process uses it, archive exactly it, and compare the resulting digest before publication.

**Trigger.** Mutate a tracked/source file through an authorized competing process during the handoff window, or inject an archive creator that captures different bytes.

**Current behavior.** The lifecycle snapshot and source archive are sequential observations of mutable state with no lock, tree fingerprint pre/post comparison, or process-executable digest join.

**Expected behavior.** A handoff must pin one immutable source/build generation before status inspection, prove the running process uses it, archive exactly it, and compare the resulting digest before publication.

**Impact.** Downstream consumers can receive an internally valid handoff whose process evidence and packaged source describe different generations.

**Root cause.** Source packaging is not performed from a frozen source authority bound to the running process receipt.

**Minimal fix boundary.** Acquire/verify an immutable source generation receipt, capture lifecycle status against it, package from that exact generation, compare pre/post source fingerprints, and fail closed on drift.

**Current files and symbols.**
- `packages/bootstrap/src/operations/paper-runtime-handoff.ts` `createBwsPaperRuntimeHandoff` `L104-L147` `6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f`
- `packages/bootstrap/src/operations/paper-runtime-handoff.ts` `createSourceHandoffArchive` `L198-L223` `6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f`
- `packages/bootstrap/src/operations/paper-runtime-handoff.ts` `handoff assembly` `L148-L184` `6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f`
- `packages/bootstrap/src/operations/paper-runtime-handoff.ts` `createBwsPaperRuntimeHandoff / createSourceHandoffArchive` `L104-L223` `6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f`
- `packages/bootstrap/src/operations/paper-runtime-handoff.ts` `` `L104-L223` `6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f`

**Required tests.**
- Mutation between status/archive
- generated dist drift
- source-manifest/tree mismatch
- process executable digest mismatch
- unchanged happy path

**Blocks release/deployment.** `true`

## BWS120-R07-014 — Versioned handoff and latest pointer publish as two independent writes with no crash recovery or digest link

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R07`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R07`

**Invariant.** Publish a versioned immutable handoff and its latest pointer under one recoverable transaction; latest must reference the exact version/hash and advance monotonically.

**Trigger.** Interrupt publication between the two calls.

**Current behavior.** The versioned handoff may exist while latest remains stale. Downstream readers have no authoritative way to distinguish an incomplete publication from a historical version.

**Expected behavior.** Publish a versioned immutable handoff and its latest pointer under one recoverable transaction; latest must reference the exact version/hash and advance monotonically.

**Impact.** Consumers can miss the newest accepted handoff or use an older one; retries can create divergent files and pointers.

**Root cause.** Per-file atomic rename is incorrectly treated as multi-file publication atomicity.

**Minimal fix boundary.** Add a handoff manifest/commit marker with version path+SHA, atomic compare-and-set latest pointer, and startup recovery. Preserve BWS118-R06-016 as the separate inherited filename-collision root.

**Current files and symbols.**
- `packages/bootstrap/src/operations/paper-runtime-handoff.ts` `createBwsPaperRuntimeHandoff` `L186-L195` `6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f`
- `packages/bootstrap/src/operations/paper-runtime-handoff.ts` `writeJsonAtomically` `L290-L312` `6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f`
- `packages/bootstrap/src/operations/paper-runtime-handoff.ts` `createBwsPaperRuntimeHandoff / writeJsonAtomically` `L186-L195; L290-L312` `6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f`
- `packages/bootstrap/src/operations/paper-runtime-handoff.ts` `` `L186-L195; L290-L312` `6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f`

**Required tests.**
- Crash after version write
- crash during latest write
- concurrent publishers
- latest hash mismatch
- recovery selects highest committed sequence

**Blocks release/deployment.** `true`

## BWS120-R07-015 — The selected BWS-600 controller never consumes or verifies the accepted external campaign manifest

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R07`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R07`

**Invariant.** Controller admission must require one exact accepted campaign manifest, verify schema/hash/semantic fingerprint/currentness, and bind release, source, lock, API input, database, storage, schedule, and evidence paths before any child starts.

**Trigger.** Start the selected controller without supplying an accepted bws.external_runtime_campaign.v1 file, or with environment values that differ from a previously generated manifest.

**Current behavior.** The controller never reads the manifest. It derives a run identity from its own artifacts directory and launches runtime evidence directly.

**Expected behavior.** Controller admission must require one exact accepted campaign manifest, verify schema/hash/semantic fingerprint/currentness, and bind release, source, lock, API input, database, storage, schedule, and evidence paths before any child starts.

**Impact.** BWS-600 can start outside the operator-approved release/input/database/storage/schedule authority even though documentation and preflight claim the manifest is mandatory.

**Root cause.** The BWS-593 handoff is produced but not made an executable prerequisite of BWS-600.

**Minimal fix boundary.** Add an explicit manifest argument/environment selector, verify exact content/hash and all bound authorities before lock/run-dir/child creation, and propagate its semantic fingerprint through every child/result/evidence receipt.

**Current files and symbols.**
- `packages/bootstrap/src/operations/external-runtime-preflight.ts` `createBwsExternalRuntimeCampaignManifest` `L248-L432` `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427`
- `docs/041_external_runtime_preflight_and_bws600_campaign.md` `BWS-600 evidence campaign` `L53-L68` `2b660f97040f6893f0110172a0f3e5ebe0b6e25f64f0e8ea4daf8ab310242620`
- `run-paper-autopilot.sh` `defaults / run_child_controller` `L15-L30; L842-L872` `fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661`
- `run-paper-evaluation.sh` `run_runtime_evidence_mode` `L845-L919` `d7d821119d51c3dd5bbcf7a80f0e98488ebd38f7d771310265939a918505e667`
- `run-paper-autopilot.sh` `controller admission / run_child_controller` `L15-L30; L842-L872` `fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661`
- `run-paper-autopilot.sh` `` `L15-L30; L842-L872` `fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661`

**Required tests.**
- Missing manifest
- tampered manifest
- stale manifest
- release/lock/input/database/schedule mismatch
- manifest fingerprint propagation
- no side effects before failure

**Blocks release/deployment.** `true`

## BWS120-R07-016 — Paper-autopilot completion trusts a child status label and exit code without an evidence receipt

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R07`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R07`

**Invariant.** Parent completion must verify a typed child receipt binding exact campaign manifest, source/data/process generation, evidence result path+hash, observation continuity result, and terminal status before promotion.

**Trigger.** Delete, mutate, replace, or disconnect the runtime evidence artifact before the parent consumes the child result; alternatively publish a valid label without an evidence digest.

**Current behavior.** The parent checks status and exit code only. Its summary records labels and a run directory but no exact evidence artifact identity.

**Expected behavior.** Parent completion must verify a typed child receipt binding exact campaign manifest, source/data/process generation, evidence result path+hash, observation continuity result, and terminal status before promotion.

**Impact.** A validly owned child process can produce false parent completion when the underlying evidence is missing, stale, tampered, or unrelated.

**Root cause.** Process ownership authentication is mistaken for semantic evidence authentication.

**Minimal fix boundary.** Version the child result protocol to include an immutable evidence receipt and campaign fingerprint; verify it atomically before parent state advancement and include it in a signed/hashed parent completion artifact.

**Current files and symbols.**
- `.automation/lib/controller_hardening_v2.sh` `automation_v2_publish_child_result` `L439-L612` `d67e2780d7968e5f25b0c7735486b140aa186708bbddda1b3d90cbb5f21f19a1`
- `run-paper-evaluation.sh` `run_runtime_evidence_mode` `L845-L933` `d7d821119d51c3dd5bbcf7a80f0e98488ebd38f7d771310265939a918505e667`
- `run-paper-autopilot.sh` `run_child_controller` `L906-L933` `fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661`
- `run-paper-autopilot.sh` `completion case / write_final_summary` `L942-L975; L1196-L1205` `fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661`
- `run-paper-autopilot.sh` `run_child_controller / completion case / write_final_summary` `L906-L975; L1196-L1205` `fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661`
- `run-paper-autopilot.sh` `` `L906-L975; L1196-L1205` `fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661`

**Required tests.**
- Evidence deleted after child exit
- evidence tampered after child exit
- wrong campaign fingerprint
- wrong source/runtime generation
- status/exit mismatch
- parent restart before promotion

**Blocks release/deployment.** `true`

## BWS120-R07-017 — Final-local runtime acceptance validates labels and file existence rather than cryptographic evidence relationships

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R07`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R07`

**Invariant.** Final acceptance must verify every referenced artifact schema/hash, source/runtime/campaign identity, chronological relationship, immutable index receipt, parent-child completion receipt, and external campaign fingerprint.

**Trigger.** Use arbitrary regular files for lifecycle/diagnostics/handoff, set expected labels in the runtime evidence and parent summary, and include PAPER_AUTOPILOT_ in the capture.

**Current behavior.** The exact placeholder construction is accepted by the focused test. The final semantic fingerprint hashes the parsed runtime document and absolute path strings, not the bytes/relationships of referenced files.

**Expected behavior.** Final acceptance must verify every referenced artifact schema/hash, source/runtime/campaign identity, chronological relationship, immutable index receipt, parent-child completion receipt, and external campaign fingerprint.

**Impact.** A fabricated or tampered evidence set can become a final local acceptance result despite lacking genuine lifecycle, diagnostics, handoff, or campaign proof.

**Root cause.** Final acceptance is a shape/label aggregator rather than a verifier of the evidence graph it claims to bind.

**Minimal fix boundary.** Require typed schema validation and SHA-256 for every reference, verify one coherent generation/campaign DAG, consume the canonical index receipt, validate parent/child terminal receipt, and hash all referenced bytes into the final manifest.

**Current files and symbols.**
- `packages/bootstrap/src/operations/final-local-acceptance.ts` `createBwsFinalLocalAcceptanceRuntimeResult` `L411-L531` `1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5`
- `packages/bootstrap/src/operations/final-local-acceptance.ts` `readRuntimeEvidenceFile / resolveEvidencePath` `L942-L980` `1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5`
- `tests/bws-final-local-acceptance.test.ts` `runtime evidence acceptance test` `L144-L182` `c2ca8b6bfb9fb49cc387c781844440de074932533cd97acddaa60679281c6b2d`
- `packages/bootstrap/src/operations/final-local-acceptance.ts` `` `L411-L531` `1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5`

**Required tests.**
- Placeholder artifact rejection
- tampered artifact
- wrong schema/hash
- cross-generation mix
- stale parent summary
- forged Telegram substring
- external campaign mismatch
- accepted happy path

**Blocks release/deployment.** `true`

## BWS120-R07-018 — B1 runtime acceptance trusts a caller-selected “accepted upstream” enum and arbitrary repeated hashes

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R07`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R07`

**Invariant.** BWS-710 acceptance must require an immutable accepted upstream resource receipt bound to exact API route/contract/commit/generation/page/data window, exact report artifacts, and deterministic rerun bytes.

**Trigger.** Set inputSource to accepted_betting_win_b1_multi_venue_markets_v1 and supply identical 64-hex values as rerunRunHashes.

**Current behavior.** The caller assertion is sufficient to bypass the fixture blocker and can return status=accepted with terminalCode=B1_OFFLINE_ACCEPTANCE_THRESHOLDS_MET. The decision still correctly keeps runtimeEvidence/executable false, but the acceptance label itself is unproven.

**Expected behavior.** BWS-710 acceptance must require an immutable accepted upstream resource receipt bound to exact API route/contract/commit/generation/page/data window, exact report artifacts, and deterministic rerun bytes.

**Impact.** B1 schema declaration or local fixture data can be misrepresented as accepted runtime resource evidence, obscuring the current BWS-710 external block.

**Root cause.** External authority is modeled as a caller-controlled enum instead of a verified resource receipt.

**Minimal fix boundary.** Replace the enum-only branch with a validated B1 upstream acceptance receipt and exact artifact/hash joins; keep deterministic fixtures permanently blocked from runtime acceptance.

**Current files and symbols.**
- `packages/bootstrap/src/operations/b1-runtime-evidence.ts` `B1RuntimeAcceptanceEvidence` `L5-L17` `80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8`
- `packages/bootstrap/src/operations/b1-runtime-evidence.ts` `evaluateB1RuntimeEvidenceAcceptance` `L231-L255` `80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8`
- `packages/bootstrap/src/operations/b1-runtime-evidence.ts` `validateEvidence / dataCoverageBlockers` `L309-L365; L469-L480` `80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8`
- `tests/b1-runtime-evidence.test.ts` `sampleEvidence` `L262-L272` `aebe980faa9efd95c354aace00456a9f93b5952b0e2e29936189dd9d9a68b435`
- `packages/bootstrap/src/operations/b1-runtime-evidence.ts` `evaluateB1RuntimeEvidenceAcceptance / validateEvidence` `L5-L17; L231-L365; L469-L480` `80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8`
- `packages/bootstrap/src/operations/b1-runtime-evidence.ts` `` `L5-L17; L231-L365; L469-L480` `80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8`

**Required tests.**
- Forged accepted enum
- arbitrary equal hashes
- hash not matching report bytes
- wrong contract/generation/page
- stale data window
- valid accepted receipt
- fixture remains blocked

**Blocks release/deployment.** `true`

## BWS120-R07-019 — Progress and log helpers select the lexically greatest controller prefix instead of the newest run

- Severity: `P2`
- Confidence: `CONFIRMED`
- Primary owner: `R07`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R07`

**Invariant.** The default must select the greatest parsed UTC run timestamp, with deterministic tie handling and explicit controller filtering when needed.

**Trigger.** Create bugfix_autopilot_20990101T000000Z and paper_autopilot_20200101T000000Z directories, then invoke the helper without --run-dir.

**Current behavior.** Plain lexical ordering selects paper_autopilot_2020 because the p prefix sorts after b, even though bugfix_autopilot_2099 is newer.

**Expected behavior.** The default must select the greatest parsed UTC run timestamp, with deterministic tie handling and explicit controller filtering when needed.

**Impact.** Operators can inspect stale progress/logs, misdiagnose current campaign state, or act on the wrong controller output.

**Root cause.** Run family and timestamp are encoded in one string and sorted as an undifferentiated path.

**Minimal fix boundary.** Parse controller family and timestamp explicitly, compare timestamp values, validate directory schema, and expose the selected family/time in output. Keep explicit --run-dir authoritative.

**Current files and symbols.**
- `check_progress.sh` `latest_run selection` `L27-L35` `26bb85d1ff30c852af5370c158ff00c62b6e87a54a11f870983273b7a0cb6cdb`
- `open_log.sh` `default RUN_DIR selection` `L42-L45` `3a9886b0439c468483142d77e22bcab874c14fb2dd50c5293d014727f0c7a7b1`
- `watch_progress.sh` `check_progress delegation` `L1-L40` `dddaf227440e6b848f7a33d2b92aebc06ad729b35f8f87cb95a51750676144e8`
- `check_progress.sh` `` `L27-L35` `26bb85d1ff30c852af5370c158ff00c62b6e87a54a11f870983273b7a0cb6cdb`

**Required tests.**
- Cross-family timestamps
- same timestamp tie
- malformed directory ignored
- explicit --run-dir
- no artifacts

**Blocks release/deployment.** `true`

## BWS120-R08-001 — Backup overwrite can recursively remove an unrelated pre-existing directory

- Severity: `P0`
- Confidence: `CONFIRMED`
- Primary owner: `R08`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R08`

**Invariant.** Overwrite must be confined to a dedicated backup destination and must never recursively remove unrelated operator data.

**Trigger.** Backup publication reaches the overwrite branch for an existing path.

**Current behavior.** The path guard excludes only repository runtime directories. Any other existing path is recursively removed before the staged backup is renamed into place.

**Expected behavior.** Overwrite must be confined to a dedicated backup destination and must never recursively remove unrelated operator data.

**Impact.** A misdirected but explicitly requested backup can cause irreversible deletion outside the backup domain. This is an operational destructive-path defect and is release blocking.

**Root cause.** Output authorization is represented as a negative denylist instead of a positively bound backup root and exact destination identity.

**Minimal fix boundary.** Confine backup output to an operator-selected approved backup root, require a backup-specific destination leaf, reject unrelated existing directories, and preserve the prior verified backup until replacement publication is committed.

**Current files and symbols.**
- `packages/bootstrap/src/operations/database-lifecycle.ts` `createBwsDatabaseBackup` `311-373` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `packages/bootstrap/src/operations/database-lifecycle.ts` `requireOutputPath` `1395-1409` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `packages/bootstrap/src/cli/bws-database-lifecycle.ts` `runBwsDatabaseLifecycleCli backup` `25-32` `4e6da6bfca8e7c622ccd04e66d3789b4f4eaf490f93fd8265bfa458d3c22b06a`
- `docs/037_database_backup_retention_and_recovery.md` `Backup contract` `21-31` `6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10`

**Required tests.**
- Reject an overwrite target outside the approved backup root.
- Reject an existing unrelated directory even when overwrite intent is present.
- Prove a failed replacement leaves the previous verified backup intact.
- Prove normal publication remains atomic inside the approved root.

**Blocks release/deployment.** `true`

## BWS120-R08-002 — Release-upgrade apply can migrate a different database than the reviewed plan

- Severity: `P0`
- Confidence: `CONFIRMED`
- Primary owner: `R08`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R08`

**Invariant.** Apply must re-prove the exact environment bytes, target database identity, migration ledger, and release binding recorded by the plan before any drain or migration effect.

**Trigger.** The apply path re-reads the mutable environment and reaches migration application.

**Current behavior.** Planning fingerprints the environment file and database identity, but apply only checks the caller-supplied plan fingerprint, re-reads the environment, resolves a fresh database configuration, and applies migrations without comparing that target or ledger to the plan.

**Expected behavior.** Apply must re-prove the exact environment bytes, target database identity, migration ledger, and release binding recorded by the plan before any drain or migration effect.

**Impact.** A valid plan can authorize migration effects against a different database or changed ledger. The mismatch can create irreversible schema or data effects on the wrong target.

**Root cause.** The plan fingerprint is treated as sufficient authorization even though effectful configuration is re-resolved from mutable inputs at apply time.

**Minimal fix boundary.** Before draining or applying migrations, re-hash the environment, resolve and query the live database identity and ledger, compare every plan-bound field, and abort on any difference. The apply path must use the revalidated immutable target tuple for all subsequent steps.

**Current files and symbols.**
- `packages/bootstrap/src/operations/release-upgrade.ts` `createBwsReleaseUpgradePlan` `385-443` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- `packages/bootstrap/src/operations/release-upgrade.ts` `applyBwsReleaseUpgrade` `519-535` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- `packages/bootstrap/src/operations/release-upgrade.ts` `applyBwsReleaseUpgrade migration phase` `631-645` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- `docs/039_release_deployment_and_upgrade_contract.md` `Upgrade contract` `33-49` `62bffb897f6ec26c58782fa097e31d0e4c2a7c9e3f9f2bd9a8b4da1c9d3f3ad5`

**Required tests.**
- Change the environment file database between plan and apply and require a pre-effect failure.
- Change host or socket target while keeping the same database name and require failure.
- Change the live applied-migration ledger between plan and apply and require failure.
- Prove no lifecycle drain or migration callback occurs before target parity succeeds.

**Blocks release/deployment.** `true`

## BWS120-R08-003 — Backup manifest metadata and row counts are not captured from the pg_dump snapshot

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R08`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R08`

**Invariant.** The dump, migration ledger, source identity, and table counts must describe one transactionally consistent database snapshot.

**Trigger.** Migration status is queried before pg_dump and table counts are queried after pg_dump using independent sessions.

**Current behavior.** Migration status, pg_dump, and row counts are three independent observations with no shared snapshot or write exclusion.

**Expected behavior.** The dump, migration ledger, source identity, and table counts must describe one transactionally consistent database snapshot.

**Impact.** The manifest can describe rows or a migration ledger that are absent from the dump, or omit rows present in it. Restore verification can then reject a sound dump or accept misleading metadata.

**Root cause.** Backup metadata is assembled around pg_dump rather than from the same exported or locked snapshot.

**Minimal fix boundary.** Capture dump and metadata from one database snapshot or an equivalent write-quiesced boundary, record the snapshot identity, and bind all manifest values to it.

**Current files and symbols.**
- `packages/bootstrap/src/operations/database-lifecycle.ts` `createBwsDatabaseBackup` `331-357` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `packages/persistence/src/psql.ts` `queryPsqlJsonRows and runPsql` `77-91,191-208` `86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343`
- `docs/037_database_backup_retention_and_recovery.md` `Backup and restore contract` `21-40` `6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10`

**Required tests.**
- Mutate rows concurrently during backup and prove dump and manifest counts remain consistent.
- Apply a migration concurrently and prove backup either blocks or records one exact ledger.
- Restore the produced backup and require exact manifest parity.

**Blocks release/deployment.** `true`

## BWS120-R08-004 — Backup replacement deletes the previous verified backup before the new publication commits

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R08`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R08`

**Invariant.** The old verified backup must remain recoverable until the replacement has been durably published.

**Trigger.** The replacement branch removes the old directory and is interrupted or fails before rename completes.

**Current behavior.** The old directory is recursively removed before renameSync publishes the staged directory. The catch block cleans only the staging directory.

**Expected behavior.** The old verified backup must remain recoverable until the replacement has been durably published.

**Impact.** A publication failure or process interruption in the replacement window can leave neither the old verified backup nor the new published backup.

**Root cause.** Replacement is implemented as delete-then-rename rather than versioned publication or an atomic commit that preserves the predecessor.

**Minimal fix boundary.** Publish to a new immutable version, durably validate it, switch an authoritative pointer atomically, and retire the predecessor only after commit. Add bounded reconciliation for abandoned staging directories.

**Current files and symbols.**
- `packages/bootstrap/src/operations/database-lifecycle.ts` `createBwsDatabaseBackup` `322-385` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `docs/037_database_backup_retention_and_recovery.md` `Backup and recovery contract` `21-31,56-58` `6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10`

**Required tests.**
- Inject failure after staging and before publication and prove the predecessor remains valid.
- Inject failure after pointer switch and prove one complete version remains authoritative.
- Reconcile abandoned staging directories without touching unrelated paths.

**Blocks release/deployment.** `true`

## BWS120-R08-005 — Migration status reports compatibility without evaluating PostgreSQL server-version compatibility

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R08`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R08`

**Invariant.** Compatibility must include an explicit supported server-version policy and reject unknown or unsupported versions.

**Trigger.** Migration status is evaluated.

**Current behavior.** The server version and numeric version are recorded, but compatibility reasons are derived only from checksum mismatches and schema existence.

**Expected behavior.** Compatibility must include an explicit supported server-version policy and reject unknown or unsupported versions.

**Impact.** Migration, backup, restore, upgrade, and acceptance gates can classify an unsupported PostgreSQL target as compatible.

**Root cause.** Server version is modeled as evidence but not as an authority input to compatibility.

**Minimal fix boundary.** Define the accepted PostgreSQL version range, validate numeric version fail closed, include the decision in status evidence, and require the same version binding at plan/apply and restore verification.

**Current files and symbols.**
- `packages/bootstrap/src/operations/database-lifecycle.ts` `getBwsDatabaseMigrationStatus` `262-308` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `packages/bootstrap/src/operations/database-lifecycle.ts` `queryDatabaseIdentity` `1158-1187` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `docs/037_database_backup_retention_and_recovery.md` `Migration status contract` `9-19` `6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10`

**Required tests.**
- Supported major/minor version is compatible.
- Unsupported, malformed, and unknown numeric versions are incompatible.
- Upgrade apply rejects server-version drift after planning.

**Blocks release/deployment.** `true`

## BWS120-R08-006 — Restore verification does not bind manifest semantics to the exact restored database state

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R08`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R08`

**Invariant.** The manifest must be fully schema validated and the restored database must match its exact database identity, migration ledger, complete table set, row counts, and invariants.

**Trigger.** Restore verification reads the manifest and validates the restored database.

**Current behavior.** Manifest validation checks only the schema tag and that rowCounts is an array. Restore requires general migration compatibility and no pending migrations but does not compare the manifest ledger or source identity to the restored state. Row-count comparison checks only manifest-listed tables and ignores unexpected restored tables.

**Expected behavior.** The manifest must be fully schema validated and the restored database must match its exact database identity, migration ledger, complete table set, row counts, and invariants.

**Impact.** A self-consistent checksum file can still certify a semantically mismatched manifest/dump pair or incomplete restored-state proof.

**Root cause.** The restore verifier treats a typed interface assertion as full validation and uses partial parity checks instead of one canonical restored-state comparison.

**Minimal fix boundary.** Apply strict runtime schema validation, record the exact dump/checksum identity, compare exact migration ledger and source/restore identity fields, compare complete expected and actual table sets, and execute explicit invariants.

**Current files and symbols.**
- `packages/bootstrap/src/operations/database-lifecycle.ts` `readAndValidateBackupManifest` `1004-1018` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `packages/bootstrap/src/operations/database-lifecycle.ts` `verifyBwsDatabaseRestore` `389-458` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `packages/bootstrap/src/operations/database-lifecycle.ts` `assertRowCountsMatch` `1323-1336` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `docs/037_database_backup_retention_and_recovery.md` `Restore verification contract` `33-42` `6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10`

**Required tests.**
- Reject missing, extra, wrong-type, malformed, and duplicate manifest fields.
- Reject manifest/dump migration-ledger mismatch.
- Reject missing and unexpected surebet tables.
- Reject source identity mismatch and invariant failure despite matching row counts.

**Blocks release/deployment.** `true`

## BWS120-R08-007 — Restore verification hard-codes restart success after two loopback API smoke runs

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R08`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R08`

**Invariant.** Restart proof must represent actual database, scheduler, worker, and service restart/recovery behavior or remain explicitly unproven.

**Trigger.** verifyBwsDatabaseRestore returns its receipt.

**Current behavior.** The verifier starts and closes two in-process loopback API servers, performs three small read queries per run, then returns serverRestartsVerified=true unconditionally. Downstream preflight and final acceptance trust that boolean.

**Expected behavior.** Restart proof must represent actual database, scheduler, worker, and service restart/recovery behavior or remain explicitly unproven.

**Impact.** Restore evidence can become green without scheduler/worker restart, durable checkpoint recovery, process replacement, or database restart proof.

**Root cause.** A broad acceptance claim is represented by an unconditional boolean rather than typed evidence for each required recovery component.

**Minimal fix boundary.** Replace the boolean with explicit, hashed database-restart, scheduler-recovery, worker-recovery, service-restart, and API-read evidence. Require each consumer to validate the detailed receipt and preserve held states when any component is unavailable.

**Current files and symbols.**
- `packages/bootstrap/src/operations/database-lifecycle.ts` `verifyBwsDatabaseRestore` `431-458` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `packages/bootstrap/src/operations/database-lifecycle.ts` `verifyReadOnlyApiQueries` `1228-1300` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `packages/bootstrap/src/operations/external-runtime-preflight.ts` `validateBackupEvidence` `504-527` `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427`
- `packages/bootstrap/src/operations/final-local-acceptance.ts` `createBwsFinalLocalAcceptanceRecoveryResult` `535-613` `1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5`
- `docs/037_database_backup_retention_and_recovery.md` `Restore verification contract` `33-42` `6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10`

**Required tests.**
- Database/API smoke passes but scheduler recovery fails and receipt remains blocked.
- Worker restart loses checkpoint and receipt remains blocked.
- Service restart evidence is absent or stale and preflight rejects it.
- All component receipts are bound to the same restored database and source generation.

**Blocks release/deployment.** `true`

## BWS120-R08-008 — Restore verification receipt is not bound to the exact dump bytes it claims to verify

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R08`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R08`

**Invariant.** A restore receipt must be valid only for the exact dump, manifest, checksum file, and source database snapshot that were restored.

**Trigger.** Release upgrade validates current bundle checksums and compares the old receipt only to the current manifest.

**Current behavior.** The receipt includes the manifest but no dump or checksum-file digest. Release verification checks current file checksums, then compares only the receipt manifest fingerprint to the current manifest.

**Expected behavior.** A restore receipt must be valid only for the exact dump, manifest, checksum file, and source database snapshot that were restored.

**Impact.** A stale restore receipt can be reused for different dump bytes when the manifest remains unchanged, so upgrade and acceptance gates can rely on restore proof for a bundle that was never restored.

**Root cause.** The restore receipt models semantic manifest identity but omits content identity for the dump and checksum manifest.

**Minimal fix boundary.** Add one canonical backup-bundle identity containing dump SHA-256, manifest SHA-256, checksum-file SHA-256, source snapshot identity, and schema. Persist it in the restore receipt and require exact equality in every consumer.

**Current files and symbols.**
- `packages/bootstrap/src/operations/database-lifecycle.ts` `BwsVerifyDatabaseRestoreResult` `183-195` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `packages/bootstrap/src/operations/database-lifecycle.ts` `verifyBwsDatabaseRestore return` `446-458` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `packages/bootstrap/src/operations/release-upgrade.ts` `verifyBackupEvidence` `1293-1338` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- `docs/043_upgrade_rollback_recovery_implementation_blueprint.md` `Required contracts` `18-39` `46513efa6bd4be9b897a26dae42431a8c0b5438f3f9c44f2a42af70a4dc811a3`

**Required tests.**
- Change only dump bytes and checksum file after restore; upgrade verification must reject the stale receipt.
- Change only manifest bytes; reject.
- Change checksum-file bytes without changing referenced digests; reject.
- Accept only an exact bundle identity produced by the restore run.

**Blocks release/deployment.** `true`

## BWS120-R08-009 — Interrupted restore verification can leave untracked disposable databases

- Severity: `P2`
- Confidence: `CONFIRMED`
- Primary owner: `R08`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R08`

**Invariant.** Every disposable database must have durable ownership metadata and bounded recovery that can identify and safely remove only abandoned review-owned targets.

**Trigger.** Process interruption occurs during restore or verification.

**Current behavior.** Cleanup exists only in an in-process finally block. The database name is derived from timestamp and PID, and there is no durable registry, owner token, startup reconciliation, or verified leak enumeration.

**Expected behavior.** Every disposable database must have durable ownership metadata and bounded recovery that can identify and safely remove only abandoned review-owned targets.

**Impact.** Interrupted verification can leave databases that consume storage, collide with later runs, or create ambiguous cleanup decisions.

**Root cause.** Disposable-resource ownership is process-local rather than persisted and reconciled.

**Minimal fix boundary.** Use a strong unique owner token, persist a restore-run registry before creation, tag the database with that run identity, and provide a bounded reconciler that proves ownership before cleanup.

**Current files and symbols.**
- `packages/bootstrap/src/operations/database-lifecycle.ts` `verifyBwsDatabaseRestore` `389-461` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `packages/bootstrap/src/operations/database-lifecycle.ts` `buildDisposableRestoreDatabaseName and create/drop` `1338-1393` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `docs/037_database_backup_retention_and_recovery.md` `Recovery contract` `33-42,56-58` `6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10`

**Required tests.**
- Terminate verification after create and prove the next bounded reconciliation discovers only the abandoned owned database.
- Run two verifications with equal injected time and prove unique database identities.
- Prove reconciliation does not remove non-owned databases.

**Blocks release/deployment.** `true`

## BWS120-R08-010 — Retention plan fingerprints omit target database and schema-generation identity

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R08`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R08`

**Invariant.** A destructive retention authorization must bind one exact database, server/cluster identity, schema generation, migration ledger, and candidate snapshot.

**Trigger.** A fingerprint generated for one target is supplied to retention apply against another target with the same candidate payload.

**Current behavior.** The fingerprint includes only scope, cutoff, maxRows, and candidates. The plan and apply receipts expose no database identity or migration/release generation.

**Expected behavior.** A destructive retention authorization must bind one exact database, server/cluster identity, schema generation, migration ledger, and candidate snapshot.

**Impact.** A valid plan fingerprint is portable across targets with matching candidate payloads and can authorize pruning on the wrong database.

**Root cause.** Retention identity is modeled as a candidate-set digest rather than an operation intent bound to one target generation.

**Minimal fix boundary.** Include exact live database identity, accepted server/cluster identifier, migration-ledger fingerprint, schema/release generation, and candidate snapshot transaction identity in the plan and apply receipt. Re-prove all fields before deletion.

**Current files and symbols.**
- `packages/bootstrap/src/operations/database-lifecycle.ts` `BwsDatabaseRetentionPlan interfaces` `202-237` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `packages/bootstrap/src/operations/database-lifecycle.ts` `plan/applyBwsDatabaseRetention` `464-535` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `packages/bootstrap/src/operations/database-lifecycle.ts` `computeRetentionPlanFingerprint` `980-1001` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `packages/bootstrap/src/cli/bws-database-lifecycle.ts` `retention-plan and retention-apply` `42-73` `4e6da6bfca8e7c622ccd04e66d3789b4f4eaf490f93fd8265bfa458d3c22b06a`

**Required tests.**
- Generate identical candidates on two disposable databases and reject cross-target fingerprint reuse.
- Change migration ledger after planning and reject apply.
- Change database host/socket identity while keeping database name and reject apply.

**Blocks release/deployment.** `true`

## BWS120-R08-011 — Retention planning and deletion are separate transactions and partial prune is detected only after commit

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R08`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R08`

**Invariant.** Candidate selection, reference checks, fingerprint verification, and deletion must execute atomically with eligibility predicates reasserted at mutation time. Any mismatch must roll back all deletions.

**Trigger.** Retention apply re-plans, then executes a key-only DELETE through a later psql session.

**Current behavior.** Candidate and total counts use separate psql sessions. Apply calls plan again, then performs deletion in another session using only primary keys. A count mismatch is raised after the DELETE statement has committed.

**Expected behavior.** Candidate selection, reference checks, fingerprint verification, and deletion must execute atomically with eligibility predicates reasserted at mutation time. Any mismatch must roll back all deletions.

**Impact.** Rows can be deleted after becoming referenced, and a partial deletion can be reported as an error even though irreversible pruning already occurred.

**Root cause.** Retention is composed from independent command invocations rather than one database transaction with mutation-time predicates and rollback.

**Minimal fix boundary.** Execute target validation, candidate selection, reference checks, exact count, and DELETE in one explicit transaction at an accepted isolation level. Reassert every eligibility predicate in the DELETE and roll back on any mismatch.

**Current files and symbols.**
- `packages/bootstrap/src/operations/database-lifecycle.ts` `plan/applyBwsDatabaseRetention` `464-535` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `packages/bootstrap/src/operations/database-lifecycle.ts` `buildRetentionDeleteSql` `854-952` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `packages/persistence/src/psql.ts` `queryPsqlJsonRows and runPsql` `77-91,191-208` `86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343`
- `docs/037_database_backup_retention_and_recovery.md` `Retention and recovery contract` `44-58` `6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10`

**Required tests.**
- Insert a new reference between planning and apply and prove no row is deleted.
- Delete or alter one candidate before apply and prove the whole transaction rolls back.
- Run concurrent applies with the same plan and prove at most one commits with truthful receipts.
- Force an error after the first internal mutation and prove zero committed deletions.

**Blocks release/deployment.** `true`

## BWS120-R08-012 — Retention can prune provenance rows still required by retained blocked or terminal parent state

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R08`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R08`

**Invariant.** All provenance required to reconstruct any retained parent, terminal blocked cycle, active investigation, or API-visible state must remain referenced and undeletable.

**Trigger.** Retention selects old worker checkpoints, dead letters, scheduler checkpoints, or upstream API checkpoints using only accepted-ledger protection and then deletes by key.

**Current behavior.** Candidate queries protect accepted ledger rows but not retained blocked/dead-lettered parent states. Worker jobs retain last-checkpoint fields without a foreign key to checkpoint rows, scheduler checkpoints retain upstream checkpoint IDs as unqualified text, and the API requires those child/provenance rows to reconstruct blocked cycles.

**Expected behavior.** All provenance required to reconstruct any retained parent, terminal blocked cycle, active investigation, or API-visible state must remain referenced and undeletable.

**Impact.** Retention can leave retained jobs or scheduler state whose required checkpoint, dead-letter, or upstream provenance is gone. The read-only API then reports provenance-missing or dead-letter-missing blockers for previously reconstructable cycles.

**Root cause.** The retention authority map is incomplete and is not derived from the full persisted/API reference graph for all terminal states.

**Minimal fix boundary.** Define one canonical retention reference graph covering success, blocked, dead-lettered, investigation, settlement, and active runtime states. Encode protective foreign keys or mutation-time NOT EXISTS checks and require post-plan reference parity before deletion.

**Current files and symbols.**
- `packages/bootstrap/src/operations/database-lifecycle.ts` `buildRetentionPlanQuery` `600-808` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `packages/bootstrap/src/operations/database-lifecycle.ts` `buildRetentionDeleteSql` `854-952` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `buildPrivatePaperRuntimeCycleItem` `853-1007` `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`
- `database/migrations/surebet/004_create_worker_jobs.sql` `worker_jobs/checkpoints/dead_letters` `1-153` `9756445dbfbdac6226413098d1253527578d9420543287842c30d034df162b9c`
- `database/migrations/surebet/006_create_upstream_api_convergence_checkpoints.sql` `upstream_api_convergence_checkpoints` `1-31` `3d5ac1c0f2d89aac08acb057668b87b2e9116f274ff78020568dc82522f270f7`
- `database/migrations/surebet/007_create_private_paper_runtime_scheduler_checkpoints.sql` `private_paper_runtime_scheduler_checkpoints` `1-25` `b0ec918132e247f3265145787e3bf9b30320ae2c415937c0578d373e5ec8be57`
- `docs/037_database_backup_retention_and_recovery.md` `Retention contract` `44-54` `6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10`

**Required tests.**
- Retain a dead-lettered blocked cycle and prove its dead-letter and required checkpoints are not candidates.
- Retain a scheduler checkpoint and prove its upstream API checkpoint cannot be pruned.
- Exercise all six retention scopes against success, blocked, active-investigation, and unreferenced fixtures.
- Prove API reconstruction remains identical before and after allowed pruning.

**Blocks release/deployment.** `true`

## BWS120-R09-001 — Install verification records incompatible runtimes and an unperformed server check as a passed preflight

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R09`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R09`

**Invariant.** Install verification must fail closed and must not emit a passed-preflight marker until every required runtime and server compatibility condition is positively established.

**Trigger.** Run verify-install and then use the generated result as upgrade or external-runtime evidence.

**Current behavior.** The result can contain node.compatible=false, postgresql.clientCompatible=false, and serverCompatibilityCheck=not_performed_in_check_only_mode while verifiedChecks still contains non_mutating_preflight_passed.

**Expected behavior.** Install verification must fail closed and must not emit a passed-preflight marker until every required runtime and server compatibility condition is positively established.

**Impact.** An incompatible installation can be promoted into upgrade, final-local-acceptance, or BWS-600 evidence, causing runtime failures or unsupported database behavior after release acceptance.

**Root cause.** Compatibility fields are descriptive rather than gate-authoritative, and downstream promotion trusts a marker rather than recomputing or checking the fields.

**Minimal fix boundary.** Make preflight return one explicit fail-closed verdict, reject incompatible Node and psql versions, require a bounded server-compatibility receipt before promotion, and make all consumers verify that verdict rather than a marker string.

**Current files and symbols.**
- `packages/bootstrap/src/operations/release-packaging.ts` `verifyBwsReleaseInstallation / runBwsReleasePreflight` `606-760` `d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce`
- `packages/bootstrap/src/operations/external-runtime-preflight.ts` `createBwsExternalRuntimeCampaignManifest` `260-277` `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427`
- `tests/bws-release-packaging.test.ts` `extracted release verifies itself through the bundled CLI` `132-203` `3462fc7e28e82057b26cf805ee7b868e1863ca2cf6b24a1e45593c4ebc8abae2`

**Required tests.**
- Node 19/21/22 negative verification
- psql below minimum negative verification
- missing PostgreSQL server receipt negative verification
- external preflight rejects any false or unknown compatibility field
- canonical Node 20.20.2 install verification

**Blocks release/deployment.** `true`

## BWS120-R09-002 — Install and upgrade verification permit release-directory evidence without the published archive

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R09`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R09`

**Invariant.** Any evidence that authorizes install, upgrade, rollback, soak, or promotion must bind to and verify the exact published archive bytes.

**Trigger.** Call verify-install without --archive, then create or apply an upgrade plan using that result.

**Current behavior.** Directory-only verification succeeds, and upgrade target verification ignores archiveCheck.verified and the archive verification marker.

**Expected behavior.** Any evidence that authorizes install, upgrade, rollback, soak, or promotion must bind to and verify the exact published archive bytes.

**Impact.** Operators can install or promote bytes that were never the published release artifact, defeating source/build/archive identity and reproducible rollback.

**Root cause.** Archive verification is implemented as an optional enhancement instead of the release authority for every install and upgrade transition.

**Minimal fix boundary.** Require archivePath and its adjacent checksum for promotable install verification, bind the archive digest into the install result, and require exact archive verification in upgrade, external-preflight, and final-acceptance consumers.

**Current files and symbols.**
- `packages/bootstrap/src/operations/release-packaging.ts` `verifyBwsReleaseInstallation / verifyArchiveIfPresent` `606-671; 796-807` `d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce`
- `packages/bootstrap/src/operations/release-upgrade.ts` `verifyTargetInstallEvidence` `1341-1368` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- `tests/bws-release-upgrade.test.ts` `target install verification fixture` `413-427` `87838040f891b46b10e329808c71e0f8c120ef3d3dfd29afa7283c6c371a7227`
- `packages/bootstrap/src/operations/release-packaging.ts` `verifyArchiveIfPresent / verifyBwsReleaseInstallation` `606-671; 796-807` `d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce`

**Required tests.**
- verify-install rejects missing archive for promotable mode
- upgrade plan rejects archiveCheck.verified=false
- archive file replaced after directory extraction
- same directory from a different archive
- rollback uses retained exact prior archive

**Blocks release/deployment.** `true`

## BWS120-R09-003 — Unmanifested non-forbidden files can pass checksum and archive verification

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R09`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R09`

**Invariant.** Manifest inventory, checksum inventory, extracted regular-file inventory, and archive inventory must be exact set-equal with no undeclared member.

**Trigger.** Verify the extracted release and archive.

**Current behavior.** All expected files can verify while an extra non-forbidden file remains accepted in the release and archive.

**Expected behavior.** Manifest inventory, checksum inventory, extracted regular-file inventory, and archive inventory must be exact set-equal with no undeclared member.

**Impact.** Undeclared code, configuration, data, or stale output can ship and execute despite a valid release semantic fingerprint.

**Root cause.** The verifier proves inclusion of expected files but not exclusion of every undeclared file.

**Minimal fix boundary.** Construct one normalized expected path map and require exact equality across manifest, SHA256SUMS, extracted directory, and archive before any verification result is emitted.

**Current files and symbols.**
- `packages/bootstrap/src/operations/release-packaging.ts` `verifyArchiveIfPresent` `817-858` `d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce`
- `packages/bootstrap/src/operations/release-packaging.ts` `verifyManifestAgainstReleaseDirectory` `900-949` `d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce`
- `packages/bootstrap/src/operations/release-packaging.ts` `verifyChecksumsFile` `964-996` `d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce`
- `packages/bootstrap/src/operations/release-packaging.ts` `buildReleaseManifestInventory` `1281-1302` `d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce`
- `packages/bootstrap/src/operations/release-packaging.ts` `verifyManifestAgainstReleaseDirectory / verifyChecksumsFile / verifyArchiveIfPresent` `817-858; 900-996; 1263-1302` `d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce`

**Required tests.**
- extra JavaScript file included in checksums and archive
- extra config file
- extra executable mode file
- missing checksum row for an otherwise manifest-declared file
- duplicate/normalization-collision paths

**Blocks release/deployment.** `true`

## BWS120-R09-004 — Release publication is a non-transactional sequence that can expose mixed generations or delete the previous release

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R09`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R09`

**Invariant.** One release generation must become visible atomically, and a failed publication must preserve the complete prior generation or leave only an explicitly incomplete staging area.

**Trigger.** Publish with allowOverwrite or inject failure between any two target commits or evidence rewrites.

**Current behavior.** Directory, archive, checksum, and result can belong to different generations. allowOverwrite deletes each previous target before its replacement is guaranteed, and later evidence/result rewrites are outside the staged commit.

**Expected behavior.** One release generation must become visible atomically, and a failed publication must preserve the complete prior generation or leave only an explicitly incomplete staging area.

**Impact.** Consumers can observe a mixed or partially missing release; a failed overwrite can destroy the previously valid rollback artifact.

**Root cause.** A multi-artifact release is published as independent filesystem targets rather than one immutable generation transaction.

**Minimal fix boundary.** Publish into a new immutable generation directory, fsync and verify all members, then atomically update a single generation pointer/commit marker. Never delete the prior generation until the new generation is fully committed and retained.

**Current files and symbols.**
- `packages/bootstrap/src/operations/release-packaging.ts` `createBwsReleasePackage` `534-588` `d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce`
- `packages/bootstrap/src/operations/release-packaging.ts` `commitOutputTarget` `1305-1331` `d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce`
- `packages/bootstrap/src/operations/release-packaging.ts` `createBwsReleasePackage / commitOutputTarget` `534-588; 1305-1331` `d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce`

**Required tests.**
- failure after each rename
- failure during each evidence registration/rewrite
- allowOverwrite preserves prior complete release on failure
- concurrent publishers for the same releaseId
- reader observes only old or new complete generation

**Blocks release/deployment.** `true`

## BWS120-R09-005 — Upgrade plan fingerprints are trusted from the plan instead of recomputed from plan content

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R09`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R09`

**Invariant.** The apply path must recompute a canonical digest over every authoritative plan field and reject any byte/semantic change.

**Trigger.** Apply the edited plan.

**Current behavior.** Edited paths, evidence references, runtime directories, status, or policy fields can be accepted as long as the embedded fingerprint remains the expected 64-hex value.

**Expected behavior.** The apply path must recompute a canonical digest over every authoritative plan field and reject any byte/semantic change.

**Impact.** A plan can redirect environment, evidence, target, or state authority after approval without changing the operator token.

**Root cause.** The plan fingerprint is treated as self-authenticating data rather than a recomputed content commitment.

**Minimal fix boundary.** Define one canonical plan descriptor containing every apply-authoritative field, recompute it on every read, and bind the plan file digest into retained evidence and state.

**Current files and symbols.**
- `packages/bootstrap/src/operations/release-upgrade.ts` `createBwsReleaseUpgradePlan` `427-443` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- `packages/bootstrap/src/operations/release-upgrade.ts` `readUpgradePlan / assertPlanFingerprint` `1371-1385` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- `packages/bootstrap/src/operations/release-upgrade.ts` `createBwsReleaseUpgradePlan / readUpgradePlan / assertPlanFingerprint` `427-443; 1371-1385` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`

**Required tests.**
- mutate envFile with unchanged fingerprint
- mutate target directory
- mutate checkpoint/state path
- mutate status/reasons/policy
- unknown or extra fields under canonical serialization

**Blocks release/deployment.** `true`

## BWS120-R09-006 — Upgrade apply does not rebind plan-time environment, release, and install-evidence bytes

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R09`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R09`

**Invariant.** Every plan-time authority must be rehashed/reverified at apply, and any difference must force a new plan.

**Trigger.** Apply the unchanged plan and token.

**Current behavior.** Apply consumes current bytes from mutable paths while retaining plan-time identities and checkpoints.

**Expected behavior.** Every plan-time authority must be rehashed/reverified at apply, and any difference must force a new plan.

**Impact.** Database targets, credentials, runtime policy, migration bytes, target code, or evidence can drift between approval and execution.

**Root cause.** The upgrade plan is treated as an advisory snapshot rather than an immutable transaction precondition.

**Minimal fix boundary.** Before acquiring upgrade ownership or stopping services, recompute the plan digest, environment receipt, release manifests/inventories, install-verification digest, backup/restore evidence, and database identity; abort on any mismatch.

**Current files and symbols.**
- `packages/bootstrap/src/operations/release-upgrade.ts` `createBwsReleaseUpgradePlan` `385-475` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- `packages/bootstrap/src/operations/release-upgrade.ts` `applyBwsReleaseUpgrade` `519-535` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- `packages/bootstrap/src/operations/release-upgrade.ts` `target_staged transition` `610-628` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- `packages/bootstrap/src/operations/release-upgrade.ts` `createBwsReleaseUpgradePlan / applyBwsReleaseUpgrade` `385-475; 519-535; 610-628` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`

**Required tests.**
- environment mutation after plan
- target file mutation after plan
- current release mutation after plan
- install verification replacement
- backup/restore evidence replacement
- mutation after pre-apply revalidation but before side effect using immutable handles or generation locks

**Blocks release/deployment.** `true`

## BWS120-R09-007 — Upgrade apply has no exclusive owner or fencing token

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R09`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R09`

**Invariant.** Exactly one generation-bound upgrade owner must execute lifecycle, migration, checkpoint, and rollback effects; stale owners must be fenced.

**Trigger.** Launch concurrent upgrade operations before either publishes the next state.

**Current behavior.** Both commands can read the same state, independently stop/start, apply migrations, append colliding sequence files, and overwrite state/results.

**Expected behavior.** Exactly one generation-bound upgrade owner must execute lifecycle, migration, checkpoint, and rollback effects; stale owners must be fenced.

**Impact.** Duplicate or conflicting lifecycle and database effects, corrupted checkpoint history, overlapping rollback, and false terminal results are possible.

**Root cause.** Upgrade state persistence is used as progress memory but not as an exclusive lease/fence.

**Minimal fix boundary.** Acquire one repository/evidence-directory scoped atomic lease before any apply/recover side effect, assign a monotonic upgrade epoch, bind every checkpoint and lifecycle call to it, and reject stale writers.

**Current files and symbols.**
- `packages/bootstrap/src/operations/release-upgrade.ts` `applyBwsReleaseUpgrade` `519-770` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- `packages/bootstrap/src/operations/release-upgrade.ts` `readOrCreateUpgradeState / appendCheckpointIfMissing` `1388-1485` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- `packages/bootstrap/src/operations/release-upgrade.ts` `applyBwsReleaseUpgrade / readOrCreateUpgradeState / appendCheckpointIfMissing` `519-770; 1388-1485` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`

**Required tests.**
- two processes apply the same plan
- apply and recover overlap
- owner crash and fenced takeover
- stale owner attempts checkpoint after takeover
- concurrent rollback and upgrade completion

**Blocks release/deployment.** `true`

## BWS120-R09-008 — Resolved upgrade state can be reused by a different plan fingerprint

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R09`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R09`

**Invariant.** State must be immutable and namespaced by exact plan fingerprint; a different plan must start with a new empty state and checkpoint directory.

**Trigger.** Apply the new plan.

**Current behavior.** The resolved prior state is accepted and its checkpoints can suppress work in the new plan.

**Expected behavior.** State must be immutable and namespaced by exact plan fingerprint; a different plan must start with a new empty state and checkpoint directory.

**Impact.** A new upgrade can skip verification, drain, backup, migration, start, or recovery transitions based on unrelated historical checkpoints.

**Root cause.** The state path is release-pair scoped rather than plan-identity scoped, and resolved state disables the mismatch invariant.

**Minimal fix boundary.** Require exact plan fingerprint for every state read, use per-plan state/checkpoint directories, and archive rather than reuse resolved state.

**Current files and symbols.**
- `packages/bootstrap/src/operations/release-upgrade.ts` `applyBwsReleaseUpgrade` `539-542` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- `packages/bootstrap/src/operations/release-upgrade.ts` `readOrCreateUpgradeState` `1388-1421` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- `packages/bootstrap/src/operations/release-upgrade.ts` `applyBwsReleaseUpgrade / readOrCreateUpgradeState` `539-542; 1388-1421` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`

**Required tests.**
- new plan same releases different environment
- new plan same releases different evidence
- new plan after prior rollback
- state path collision across plans
- explicit archival and fresh-state creation

**Blocks release/deployment.** `true`

## BWS120-R09-009 — Upgrade recovery trusts checkpoint classifications without verifying checkpoint bytes or current target state

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R09`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R09`

**Invariant.** Resume must validate the full hash-linked checkpoint chain and re-establish current generation-bound lifecycle/database postconditions before advancing.

**Trigger.** Resume apply/recovery.

**Current behavior.** Classification presence suppresses work and can directly produce recovery_complete/upgrade_applied without current target verification.

**Expected behavior.** Resume must validate the full hash-linked checkpoint chain and re-establish current generation-bound lifecycle/database postconditions before advancing.

**Impact.** Tampered or stale state can create false terminality; a dead or replaced target can be reported as successfully upgraded.

**Root cause.** Checkpoint metadata is trusted as state authority without validating referenced artifacts or live postconditions.

**Minimal fix boundary.** On every resume, verify each checkpoint file hash/schema/sequence/plan/epoch, reconstruct state from the chain, then revalidate current release, database ledger, process generation, health, and readiness before any terminal transition.

**Current files and symbols.**
- `packages/bootstrap/src/operations/release-upgrade.ts` `applyBwsReleaseUpgrade` `657-770` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- `packages/bootstrap/src/operations/release-upgrade.ts` `readOrCreateUpgradeState` `1404-1421` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- `packages/bootstrap/src/operations/release-upgrade.ts` `appendCheckpointIfMissing / hasCheckpoint` `1428-1493` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- `packages/bootstrap/src/operations/release-upgrade.ts` `applyBwsReleaseUpgrade / readOrCreateUpgradeState / hasCheckpoint` `657-770; 1404-1421; 1428-1493` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`

**Required tests.**
- tampered checkpoint file
- missing checkpoint file
- state with duplicate/out-of-order classifications
- target dies after target_started checkpoint
- target generation replaced before resume

**Blocks release/deployment.** `true`

## BWS120-R09-010 — Upgrade checkpoints lifecycle success from permissive or ignored lifecycle outcomes

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R09`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R09`

**Invariant.** Upgrade transitions must require explicit exact-owner, stopped/drained, and target-ready outcomes bound to the intended generation.

**Trigger.** Plan, stop, or start during upgrade.

**Current behavior.** OR logic admits partial readiness; stop/start results are not inspected before success checkpoints are persisted.

**Expected behavior.** Upgrade transitions must require explicit exact-owner, stopped/drained, and target-ready outcomes bound to the intended generation.

**Impact.** Upgrade can migrate against an undrained stack or report a target started when the lifecycle operation returned a degraded/non-ready outcome.

**Root cause.** The orchestrator treats promise resolution as lifecycle success and uses a permissive health/readiness predicate.

**Minimal fix boundary.** Define an exact lifecycle outcome matrix, require both generation-bound health and readiness where applicable, verify stopped/drained state after stop, verify target ready after start, and persist the actual receipts.

**Current files and symbols.**
- `packages/bootstrap/src/operations/release-upgrade.ts` `buildLifecyclePlanReasons` `1132-1148` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- `packages/bootstrap/src/operations/release-upgrade.ts` `drained_before_backup transition` `564-581` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- `packages/bootstrap/src/operations/release-upgrade.ts` `target_started transition` `657-674` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- `packages/bootstrap/src/operations/release-upgrade.ts` `buildLifecyclePlanReasons / applyBwsReleaseUpgrade` `564-581; 657-674; 1132-1148` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`

**Required tests.**
- stop resolves already_running/degraded/blocked
- start resolves started with blocked readiness
- health healthy but readiness blocked
- readiness ready but health blocked
- generation mismatch after start

**Blocks release/deployment.** `true`

## BWS120-R09-011 — Rollback starts the prior release without first fencing or stopping a partially started target

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R09`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R09`

**Invariant.** Rollback must first establish exclusive ownership, stop/drain/fence every partial target component, verify no target generation remains, then start and verify the prior release.

**Trigger.** Execute rollbackOnFailure=true.

**Current behavior.** The prior release is started directly while partial target processes may still exist.

**Expected behavior.** Rollback must first establish exclusive ownership, stop/drain/fence every partial target component, verify no target generation remains, then start and verify the prior release.

**Impact.** Old and new releases can overlap, share ports/state/database writers, and publish conflicting evidence during recovery.

**Root cause.** Rollback assumes a thrown target start produced no owned residual process or side effect.

**Minimal fix boundary.** Retain the target runtime generation receipt before start, invoke generation-specific stop/drain on failure, verify zero residual ownership, then start the previous immutable release and validate readiness.

**Current files and symbols.**
- `packages/bootstrap/src/operations/release-upgrade.ts` `target start failure and rollback branch` `657-714` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- `packages/bootstrap/src/operations/release-upgrade.ts` `applyBwsReleaseUpgrade rollback branch` `657-714` `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`

**Required tests.**
- target spawns API then throws
- target starts all children but readiness fails
- target stop partially fails
- port conflict during old start
- crash between target cleanup and prior start

**Blocks release/deployment.** `true`

## BWS120-R09-012 — The public execute command can synthesize an instant passing soak without managed runtime proof

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R09`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R09`

**Invariant.** Promotable soak evidence must require the managed wall-clock runner, real diagnostics-backed observations, target-specific failures, measured recovery, and measured cleanup.

**Trigger.** Run enough synthetic cycles to satisfy intervalMs * cycle count >= durationMs.

**Current behavior.** The execute path completes immediately, synthesizes every positive field, omits runtimeEvidence, and still validates when the arithmetic cycle budget is met.

**Expected behavior.** Promotable soak evidence must require the managed wall-clock runner, real diagnostics-backed observations, target-specific failures, measured recovery, and measured cleanup.

**Impact.** Two-hour or longer acceptance can be fabricated in milliseconds, allowing untested release/runtime generations into BWS-600 or deployment.

**Root cause.** A test/simulation executor and a production acceptance executor share the same promotable result schema and validator.

**Minimal fix boundary.** Separate simulation from managed acceptance at the type/schema/CLI level. Require managed_runtime evidence, elapsed monotonic time, diagnostics receipts, and target-specific fault/cleanup receipts for any promotable validation.

**Current files and symbols.**
- `packages/bootstrap/src/cli/bws-soak-campaign.ts` `execute command` `72-80` `55a3b486f879b367fb30e3d67b465e457f1f258c209d131603ce3916e51e534a`
- `packages/bootstrap/src/operations/soak-campaign.ts` `executeBwsSoakCampaign` `764-788` `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`
- `packages/bootstrap/src/operations/soak-campaign.ts` `validateBwsSoakCampaignExecution / observationBudgetSatisfied` `986-1028; 1659-1667` `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`
- `packages/bootstrap/src/operations/soak-campaign.ts` `defaultObserveCycle / defaultExecuteFailure / defaultVerifyCleanup` `1911-1960` `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`
- `tests/bws-soak-campaign.test.ts` `default failure-matrix test` `660-710` `d0d027bfe0dd0ef866c175c59dfe71cfbc5c1f8707097ac7790298ea96aefe0e`
- `packages/bootstrap/src/operations/soak-campaign.ts` `executeBwsSoakCampaign / defaultObserveCycle / defaultExecuteFailure / defaultVerifyCleanup` `764-788; 986-1028; 1659-1667; 1911-1960` `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`

**Required tests.**
- execute result rejected by promotable validator
- no runtimeEvidence negative
- elapsed wall-clock below duration negative
- default observe/failure/cleanup marked simulation-only
- external preflight rejects simulation schema

**Blocks release/deployment.** `true`

## BWS120-R09-013 — Managed soak collapses eighteen named failures into two generic actions

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R09`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R09`

**Invariant.** Each named target must have an explicit, target-specific injection, observation, recovery criterion, and cleanup proof.

**Trigger.** The integration dispatches the failure.

**Current behavior.** All process targets perform stop/start/status of the full stack; all artifact targets write and delete a marker. The named failure is not actually produced.

**Expected behavior.** Each named target must have an explicit, target-specific injection, observation, recovery criterion, and cleanup proof.

**Impact.** The soak can claim coverage of database interruption, malformed API, lease expiry, partial startup, upgrade interruption, backup interruption, and other faults that were never exercised.

**Root cause.** Failure identity is metadata only; it does not select a target-specific mechanism or proof contract.

**Minimal fix boundary.** Create one implementation registry with an explicit injector, expected observation, recovery verifier, and cleanup verifier per target. Reject any target without a real implementation.

**Current files and symbols.**
- `packages/bootstrap/src/operations/bws-soak-runtime-integration.ts` `failure target sets and dispatch` `17-39; 121-140` `3426f30a61e5e1300b640ca7b242949e7b2627274a399db815ddc40de79976a9`
- `packages/bootstrap/src/operations/bws-soak-runtime-integration.ts` `executeRestartFailure / executeArtifactMarkerFailure` `161-241` `3426f30a61e5e1300b640ca7b242949e7b2627274a399db815ddc40de79976a9`
- `packages/bootstrap/src/operations/bws-soak-runtime-integration.ts` `verifyDatabaseCleanup` `141-155` `3426f30a61e5e1300b640ca7b242949e7b2627274a399db815ddc40de79976a9`
- `packages/bootstrap/src/operations/bws-soak-runtime-integration.ts` `PROCESS_RESTART_FAILURE_TARGETS / ARTIFACT_MARKER_FAILURE_TARGETS / executeRestartFailure / executeArtifactMarkerFailure` `17-39; 121-155; 161-241` `3426f30a61e5e1300b640ca7b242949e7b2627274a399db815ddc40de79976a9`

**Required tests.**
- each target produces its named effect
- wrong component action cannot satisfy target
- recovery evidence is target-specific
- database/resource enumeration after every fault
- unsupported target fails before campaign start

**Blocks release/deployment.** `true`

## BWS120-R09-014 — Soak validation ignores observation readiness, progress, and resource bounds

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R09`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R09`

**Invariant.** Acceptance must enforce explicit monotonic progress, readiness, error, queue, latency, dead-letter, memory, disk, and growth thresholds over the full observation window.

**Trigger.** Validate the soak result.

**Current behavior.** Observation detail fields are not consulted, so structurally complete but operationally failed cycles can pass.

**Expected behavior.** Acceptance must enforce explicit monotonic progress, readiness, error, queue, latency, dead-letter, memory, disk, and growth thresholds over the full observation window.

**Impact.** A stalled, blocked, or leaking release can obtain a valid soak result and promotion evidence.

**Root cause.** The soak validator validates evidence shape and count, not the operational invariants the observations are intended to prove.

**Minimal fix boundary.** Version a threshold contract in the manifest; validate every cycle and aggregate window; measure real latency/resource counters; fail on unknown/missing fields and on sustained regression.

**Current files and symbols.**
- `packages/bootstrap/src/operations/soak-campaign.ts` `validateBwsSoakCampaignExecution` `986-1108` `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`
- `packages/bootstrap/src/operations/soak-campaign.ts` `buildRuntimeObservation` `2020-2049` `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`
- `packages/bootstrap/src/operations/soak-campaign.ts` `validateBwsSoakCampaignExecution / buildRuntimeObservation` `986-1108; 2020-2049` `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`

**Required tests.**
- blocked health cycle
- blocked readiness cycle
- boundedProgress=false
- monotonic queue growth
- nonzero errors/dead letters
- latency/resource threshold breach
- missing observation field

**Blocks release/deployment.** `true`

## BWS120-R09-015 — Soak checkpoint ordering can skip after-cycle faults or duplicate injected faults after a crash

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R09`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R09`

**Invariant.** Every scheduled fault must be durably exactly-once or explicitly safely replayable, and completedCycleCount must not skip any required stage.

**Trigger.** Resume the campaign.

**Current behavior.** After-cycle work can be skipped because resume starts at completedCycleCount+1; an injected fault can run again because the durable checkpoint is not used for deduplication.

**Expected behavior.** Every scheduled fault must be durably exactly-once or explicitly safely replayable, and completedCycleCount must not skip any required stage.

**Impact.** Named failure coverage becomes incomplete or duplicate destructive effects occur, while retained state can still look progressive.

**Root cause.** Checkpoint sequencing records intent/progress at boundaries that do not correspond to completed side effects and does not reconstruct fault state from checkpoints.

**Minimal fix boundary.** Model each injection with durable pending/injected/recovery_verified states and an idempotency token; derive resume work from the checkpoint chain; advance cycle completion only after all required stages are terminal.

**Current files and symbols.**
- `packages/bootstrap/src/operations/soak-campaign.ts` `executeBwsSoakCampaign` `793-905` `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`
- `packages/bootstrap/src/operations/soak-campaign.ts` `executeFailureStage` `1768-1865` `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`
- `packages/bootstrap/src/operations/soak-campaign.ts` `executeBwsSoakCampaign / executeFailureStage` `793-905; 1768-1865` `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`

**Required tests.**
- crash at every line between fault checkpoint, side effect, recovery checkpoint, and cycle completion
- replay-safe versus non-replay-safe target behavior
- after_cycle crash/resume
- duplicate fault token rejection
- state reconstruction from checkpoints

**Blocks release/deployment.** `true`

## BWS120-R09-016 — Resumed soak results cannot validate cumulative checkpoint history

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R09`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R09`

**Invariant.** A resumed result must represent cumulative durable history or validation must compare only a precisely bounded invocation segment.

**Trigger.** Execute additional cycles and validate the new result.

**Current behavior.** The result lists only cycles from the latest call while validation compares against cumulative checkpoints, so legitimate restart/chunking fails.

**Expected behavior.** A resumed result must represent cumulative durable history or validation must compare only a precisely bounded invocation segment.

**Impact.** The advertised restart/resume path is non-convergent; operators may be forced to discard evidence or rerun campaigns, and a failure may be misdiagnosed as corruption.

**Root cause.** Execution result scope is per invocation while checkpoint and validator scope is per campaign.

**Minimal fix boundary.** Define result scope explicitly. Prefer reconstructing cumulative cycles/failures from the validated checkpoint chain and emitting a cumulative result bound to the terminal state.

**Current files and symbols.**
- `packages/bootstrap/src/operations/soak-campaign.ts` `executeBwsSoakCampaign` `790-791; 947-965` `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`
- `packages/bootstrap/src/operations/soak-campaign.ts` `validateBwsSoakCampaignExecution` `1056-1062` `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`
- `packages/bootstrap/src/operations/soak-campaign.ts` `executeBwsSoakCampaign / validateBwsSoakCampaignExecution` `790-791; 947-965; 1056-1062` `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`

**Required tests.**
- two-invocation campaign
- resume after crash before result write
- resume with prior recovered failures
- multiple partial chunks
- validator reconstructs canonical cumulative history

**Blocks release/deployment.** `true`

## BWS120-R09-017 — Cleanup acceptance is derived from caller/default counters instead of measured owned resources

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R09`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R09`

**Invariant.** Cleanup proof must be generated by authoritative bounded enumeration of every campaign-owned resource and bind each observed resource to the campaign generation.

**Trigger.** Create cleanup evidence and then finalize or validate acceptance.

**Current behavior.** Zero/empty caller values produce verified=true even when unobserved leaks exist.

**Expected behavior.** Cleanup proof must be generated by authoritative bounded enumeration of every campaign-owned resource and bind each observed resource to the campaign generation.

**Impact.** Leaked processes, leases, databases, and files can survive an accepted campaign and contaminate later tests or production operation.

**Root cause.** Cleanup status is an assertion supplied by the same caller being evaluated, not an independently measured receipt.

**Minimal fix boundary.** Move enumeration into trusted operations: query generation-bound process ownership, durable leases, campaign directories, disposable database registry, and temp artifacts; hash the inventory and require zero residuals before verified=true.

**Current files and symbols.**
- `packages/bootstrap/src/operations/final-local-acceptance.ts` `createBwsFinalLocalAcceptanceCleanupResult` `660-691` `1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5`
- `packages/bootstrap/src/cli/bws-final-local-acceptance.ts` `cleanup command option mapping` `75-83` `218d99afdbef03328786d155dd23766bf87e19a75eb03c5ba1e835922c251d43`
- `packages/bootstrap/src/operations/soak-campaign.ts` `defaultVerifyCleanup` `1949-1960` `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`
- `packages/bootstrap/src/operations/bws-soak-runtime-integration.ts` `verifyDatabaseCleanup` `141-155` `3426f30a61e5e1300b640ca7b242949e7b2627274a399db815ddc40de79976a9`

**Required tests.**
- hidden process with empty caller list
- hidden lease
- remaining file inside declared temp directory
- extra campaign-owned database
- resource created after scan before final commit
- cleanup scan permissions failure

**Blocks release/deployment.** `true`

## BWS120-R09-018 — External preflight promotes schema-shaped soak state without consuming the soak result or validation verdict

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R09`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R09`

**Invariant.** Promotion must require the exact successful soak result and validator output, bind their hashes and campaign fingerprint, and independently verify critical terminal invariants.

**Trigger.** Create the external runtime campaign manifest.

**Current behavior.** The preflight can pass without any result or validation artifact and without verifying the checkpoint fingerprint/chain.

**Expected behavior.** Promotion must require the exact successful soak result and validator output, bind their hashes and campaign fingerprint, and independently verify critical terminal invariants.

**Impact.** Fabricated or partial soak state can unblock BWS-600 even when failures, observations, cleanup, or artifact integrity did not pass.

**Root cause.** The promotion gate reimplements a weak subset of soak checks instead of consuming the canonical validated terminal receipt.

**Minimal fix boundary.** Require exact soak manifest/result/validation hashes, validation.ok=true, full campaign fingerprint parity, terminal checkpoint chain verification, and all failure/observation/cleanup gates before external campaign creation.

**Current files and symbols.**
- `packages/bootstrap/src/operations/external-runtime-preflight.ts` `createBwsExternalRuntimeCampaignManifest` `260-267` `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427`
- `packages/bootstrap/src/operations/external-runtime-preflight.ts` `validateSoakEvidence` `529-585` `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427`
- `packages/bootstrap/src/operations/external-runtime-preflight.ts` `readSoakStateFile / readSoakCheckpointFile` `803-824` `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427`
- `packages/bootstrap/src/operations/external-runtime-preflight.ts` `createBwsExternalRuntimeCampaignManifest / validateSoakEvidence / readSoakCheckpointFile` `260-267; 529-585; 803-824` `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427`

**Required tests.**
- missing soak result
- validation.ok=false
- tampered checkpoint fingerprint
- missing required failure recovery
- result/manifest mismatch
- artifact archive digest mismatch

**Blocks release/deployment.** `true`

## BWS120-R09-019 — External campaign identity omits the environment file bytes

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R09`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R09`

**Invariant.** Campaign identity must bind the exact effective configuration used by the lifecycle, persistence, and upstream clients, without exposing secrets.

**Trigger.** Reuse the external campaign manifest or compare identities before/after mutation.

**Current behavior.** Changing file bytes at the same path can leave the semantic fingerprint unchanged.

**Expected behavior.** Campaign identity must bind the exact effective configuration used by the lifecycle, persistence, and upstream clients, without exposing secrets.

**Impact.** The same campaign identity can execute against a different database, credentials, timeout/retry tuple, or other runtime configuration than the one reviewed.

**Root cause.** The campaign descriptor records a mutable path and partial projections rather than an immutable effective-configuration receipt.

**Minimal fix boundary.** Generate a restricted, secret-safe canonical configuration receipt that covers every effective value and source/precedence decision, bind its digest into the manifest, and revalidate it at campaign start.

**Current files and symbols.**
- `packages/bootstrap/src/operations/external-runtime-preflight.ts` `environment read and manifest descriptor` `267-280; 332-407` `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427`
- `packages/bootstrap/src/operations/external-runtime-preflight.ts` `createBwsExternalRuntimeCampaignManifest semantic fingerprint descriptor` `267-280; 332-407` `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427`

**Required tests.**
- database name/host/user change
- upstream URL/checkpoint change
- timeout/retry change
- secret-only change with protected digest
- environment path symlink/replacement after preflight

**Blocks release/deployment.** `true`

## BWS120-R09-020 — Final recovery evidence combines unrelated schema-shaped artifacts without common byte or generation binding

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R09`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R09`

**Invariant.** Every artifact must be byte-hashed and relationally bound to one release pair, plan, database identity, backup, runtime generation, and exercise run.

**Trigger.** Create the final recovery result.

**Current behavior.** Unrelated evidence can be combined; later byte replacement at the same path does not change the result semantic fingerprint.

**Expected behavior.** Every artifact must be byte-hashed and relationally bound to one release pair, plan, database identity, backup, runtime generation, and exercise run.

**Impact.** The final gate can claim successful upgrade, failed readiness, rollback allowed/blocked, restore, retention, and interruption coverage even though those records did not belong to one coherent exercise.

**Root cause.** The composition step validates local shape/status but not cross-artifact provenance or immutable bytes.

**Minimal fix boundary.** Bind each component hash and evidence identity into a versioned recovery graph; require exact common plan/release/database/backup/runtime/exercise identifiers and recompute all hashes at composition.

**Current files and symbols.**
- `packages/bootstrap/src/operations/final-local-acceptance.ts` `createBwsFinalLocalAcceptanceRecoveryResult` `534-657` `1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5`
- `tests/bws-final-local-acceptance.test.ts` `final recovery evidence focused test` `211-238` `c2ca8b6bfb9fb49cc387c781844440de074932533cd97acddaa60679281c6b2d`

**Required tests.**
- mix successful result from plan A with failed result from plan B
- different database backup/restore
- artifact replacement after read
- different target release fingerprints
- retention plan from unrelated backup

**Blocks release/deployment.** `true`

## BWS120-R09-021 — Final acceptance trusts a caller-supplied archive digest and mutable component paths

- Severity: `P1`
- Confidence: `CONFIRMED`
- Primary owner: `R09`
- Consolidation: `CONFIRMED_UNIQUE`
- Source areas: `R09`

**Invariant.** Final acceptance must hash the actual immutable archive, hash every component artifact, require each validator verdict including soakValidation.ok=true, and commit one immutable acceptance bundle.

**Trigger.** Create the final local acceptance manifest.

**Current behavior.** No archive is opened; arbitrary digest text is accepted. Component byte hashes are absent from the semantic fingerprint, and a false/missing soak-validation verdict can pass if its artifact digest field matches.

**Expected behavior.** Final acceptance must hash the actual immutable archive, hash every component artifact, require each validator verdict including soakValidation.ok=true, and commit one immutable acceptance bundle.

**Impact.** An acceptance manifest can attest to a nonexistent or different archive and can become detached from its component evidence after creation.

**Root cause.** The final manifest is a caller-composed summary rather than an independently verified immutable acceptance transaction.

**Minimal fix boundary.** Require an actual archive path, recompute its SHA-256, enumerate and hash every component, verify every explicit ok/status field, bind a common generation/exercise graph, publish into an immutable directory, and atomically commit one final receipt.

**Current files and symbols.**
- `packages/bootstrap/src/operations/final-local-acceptance.ts` `createBwsFinalLocalAcceptanceManifest` `694-830` `1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5`
- `tests/bws-final-local-acceptance.test.ts` `final acceptance manifest focused test` `240-287` `c2ca8b6bfb9fb49cc387c781844440de074932533cd97acddaa60679281c6b2d`

**Required tests.**
- wrong archive bytes with claimed digest
- nonexistent archive
- soakValidation.ok=false
- component mutation after finalization
- component from different campaign
- atomic final-bundle publication failure

**Blocks release/deployment.** `true`
