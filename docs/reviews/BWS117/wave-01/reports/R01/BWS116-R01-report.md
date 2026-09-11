# BWS116-R01 substantive review

## Executive verdict

The exact required archive `betting-win-surebet116(1).zip` independently matched SHA-256 `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376` and contained **618 safe regular files**. Every member is represented once in the coverage TSV, and the extracted source remained byte-identical to the ZIP after the review.

**Release and deployment verdict: `BLOCKED`.** The reviewed BWS-side boundary does not yet establish an immutable, byte-bound, restart-stable relationship between a committed upstream source lock, one negotiated API identity, the exact pages that converged, and the records later consumed. Current BWS-600 and BWS-710 holds remain correct and must not be weakened.

This review records **10 confirmed findings** (P1=7, P2=3). It also records external blockers, safeguards, rejected suspicions, cross-area handoffs, and test gaps separately. No finding is assigned for the known seven-file `SOURCE_MANIFEST.json` drift; it remains `KNOWN_BASELINE_MANIFEST_DRIFT` for R11.

The attached `betting-win-surebet117(1).zip` was compared only as a non-authoritative check. Its container hash differs, while its member path/size/hash set is identical to the exact BWS116 authority. The attached `betting-win` and artifacts ZIPs were not opened or used as source authority.

## Archive and executable-source qualification

- Archive SHA-256: `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`.
- Regular files: `618`.
- Path safety: `PASS`. No absolute, traversal, duplicate, encrypted, symlink, device, or other non-regular member was accepted.
- Package identity: `betting-win-surebet@0.1.0-bws-full-platform` (`PASS`).
- Extracted member digest: `60474f8d91a4a8e4afb73171c7045c0d55c457249508c65e35c67844e7a7b881`.
- Post-review mutation check: `PASS`.
- Canonical Node requirement: `v20.20.2`; actual `v22.16.0`. Nonmatching runtime observations are supplementary only.

## Scope and architecture map

The traced production flow is:

1. **Committed-source authority:** `run_betting_win_upstream_lock.mjs` → `betting-win-upstream-lock.ts` → baseline/schema → persistence-facing upstream lock.
2. **BWS contract boundary:** imported contract/resource/B1 record types distinguish declared shape from accepted runtime evidence.
3. **Read-only intake:** external query client negotiates `/contract`, composes `/query/*`, validates envelopes, and traverses pages; export/local/pinned readers remain separate historical or compatibility paths.
4. **Convergence:** API/export convergence operations and the convergence service persist source/cursor/status metadata and expose readiness-facing state.
5. **Preflight:** external-runtime preflight and B1 runtime evidence decide whether the configured source can count toward BWS-600/BWS-710.
6. **Persistence-facing handoff:** R01 owns exact upstream semantics; R03 owns generic transaction, lease, fencing, and crash atomicity; R07 owns published campaign evidence; R11 owns aggregate validators; R12 owns controller/artifact lifecycle.

### Reviewed authority and production surfaces

All 44 present named primary files were deep-traced. Missing named files: `none`. Required status/scope documents were treated as intended routing authority, then checked against executable source rather than used as proof.

## Core conclusions by required question

1. **Committed-HEAD proof:** not exact under all supported repository states. Replacement objects and multi-command movement can detach derived content from the advertised immutable commit.
2. **Missing/blank/malformed settings:** many schema checks fail closed, but the end-to-end boundary still lacks one typed receipt that preserves every missing/unknown distinction through currentness and convergence.
3. **Local evidence:** intended policy rejects local fixtures/exports/mocks/dashboard inputs as BWS-600 truth. That safeguard is preserved. Destination-level URL externality is nevertheless incomplete for equivalent address, DNS, and redirect forms.
4. **Contract negotiation:** structurally mandatory in the intended API path, but its identity is not cryptographically and invariantly bound to every later page and persisted record set.
5. **Cross-page drift:** contract/profile/generation/resource/query identity can lack a complete cycle-wide equality proof.
6. **Pagination/convergence:** request-local controls exist, but exact-page retention, cursor-cycle proof, aggregate deadline, and restart-stable immutable snapshot ownership are incomplete.
7. **Retry/timeout/cancellation:** no single cycle-wide deadline and late-result ownership proof spans contract, all pages, parsing, and persistence-facing effects.
8. **Currentness:** source, receive, verification, import, and consumption clocks are not jointly bound in one fail-closed temporal receipt.
9. **Partial persistence:** semantic cycle state can be represented without the exact records it claims to converge; atomic mechanics require an R03 handoff after R01 defines the receipt/snapshot contract.
10. **B1 distinction:** declared schemas are not accepted runtime resources. BWS-710 correctly remains externally blocked; no local declaration or fixture is promoted by this review.
11. **Validator truth:** focused tests validate many shapes and nominal paths, but do not adversarially exercise the production entrypoint for the confirmed identity, cursor, time, cancellation, and provenance cases.
12. **External blockers:** absence of an accepted betting-win B1 multi-venue runtime resource is external. The BWS-side trust, receipt, and convergence defects are internal R01 findings.

## Confirmed findings

### BWS116-R01-001: Committed-HEAD lock derivation honors repository-local Git replacement objects

**Classification:** `CONFIRMED_FINDING`
**Severity:** `P1`
**Confidence:** `HIGH`
**Primary owner:** `R01`
**Source:** `packages/upstream/src/upstream/betting-win-upstream-lock.ts` · `generateBettingWinUpstreamLock` · `L102-L103` · SHA-256 `8c0badbfc3dc776eb71e01e1a76280debab30c64739274b06d1ce7343382a6c2`
**Blocks:** review progression=false, release=true, BWS-600=true, BWS-710=true, deployment=true

**Preconditions.** An operator points BWS lock generation or verification at a Git repository whose local object database contains refs/replace entries or equivalent replacement-object configuration.

**Trigger.** The lock implementation resolves HEAD/tree/content with ordinary Git plumbing commands while replacement-object processing remains enabled.

**Expected behavior.** A committed-source lock must describe the literal object graph named by the advertised commit ID, independent of repository-local replacement refs.

**Current behavior.** The lock path does not force replacement objects off. Git can therefore report the original HEAD object name while dereferencing a replacement commit/tree for later content-oriented commands, producing a lock that is not portable proof of the named commit.

**Impact.** A repository-local mutable ref can make a false source view satisfy commit/package/workspace/capability checks. The resulting lock is not an immutable proof and can diverge from a clean clone of the same commit ID.

**Reproduction status.** REPRODUCED_IN_DISPOSABLE_LOCAL_GIT_REPOSITORY; no betting-win checkout was accessed

**Root cause.** The trust model treats Git's default revision resolver as a literal object reader, but default resolution includes mutable repository-local replacement refs.

**Minimal fix boundary.** In the upstream-lock command runner only, disable replacement-object interpretation for every identity/content operation and verify that commit, tree, and blob reads all originate from the literal advertised objects. Preserve the existing lock schema unless a compatibility version is deliberately introduced.

**Evidence.**
- The production lock implementation invokes Git object/plumbing operations without a replacement-object-disabled environment or an equivalent literal-object verification step.
- A bounded disposable Git harness outside the source tree demonstrated that refs/replace can leave the printed HEAD name unchanged while changing dereferenced commit/tree content.

**Required tests.**
- Production-entrypoint test with a disposable repository containing a replacement commit and replacement blob; lock generation must reject or produce the literal original graph.
- Control test proving ordinary committed HEAD, worktree, and bare-repository forms remain accepted as intended.

**Regression risks.**
- Git-version differences in replacement behavior
- Accidental rejection of legitimate worktrees or alternates
- Lock-schema compatibility

**Secondary sectors.**
- R10 environment/CLI policy
- R11 aggregate validator truth

**Aliases or dependencies.**
- None recorded.

**Explicitly unchanged areas.**
- BWS API intake
- Convergence persistence
- betting-win source

### BWS116-R01-002: Upstream lock is assembled from multiple unconstrained HEAD observations rather than one pinned object graph

**Classification:** `CONFIRMED_FINDING`
**Severity:** `P1`
**Confidence:** `HIGH`
**Primary owner:** `R01`
**Source:** `packages/upstream/src/upstream/betting-win-upstream-lock.ts` · `generateBettingWinUpstreamLock` · `L102-L103` · SHA-256 `8c0badbfc3dc776eb71e01e1a76280debab30c64739274b06d1ce7343382a6c2`
**Blocks:** review progression=false, release=true, BWS-600=true, BWS-710=true, deployment=true

**Preconditions.** The referenced upstream repository is writable by another process or its checked-out branch advances while lock generation is running.

**Trigger.** HEAD, tree, tracked-file fingerprint, package/workspace data, or capabilities are resolved by separate Git/filesystem operations without first pinning and reusing one immutable commit object and without a final same-object check.

**Expected behavior.** All lock fields must be derived from one explicitly pinned commit/tree snapshot, or generation must fail when the repository moves.

**Current behavior.** The lock is composed across multiple observations. A concurrent branch update can mix identity from one revision with tree/content/fingerprint evidence from another, and the final record does not prove atomicity of the source view.

**Impact.** A syntactically valid lock can bind mutually inconsistent source facts, causing false compatibility acceptance or nondeterministic failures across reruns.

**Reproduction status.** STATIC_INTERLEAVING_TRACE_CONFIRMED; deterministic race harness not run against any live checkout

**Root cause.** The implementation pins a branch name operationally, not a single object graph used as the sole input to every derived field.

**Minimal fix boundary.** Resolve one literal commit object once, derive tree and every committed file from that object ID, and fail if any required filesystem-derived datum cannot be read from the same commit. Add a final guard only as defense in depth, not as the primary snapshot mechanism.

**Evidence.**
- Static call tracing shows separate command boundaries for repository, HEAD/tree, tracked content, and package/capability derivation.
- No lock-generation transaction, object-directory snapshot, single-commit pathspec enumeration, or final equality guard makes those observations atomic.

**Required tests.**
- Instrumented disposable-repository test that advances the branch between each Git subprocess and proves either stable old/new lock output or fail-closed behavior, never a mixed record.
- Test uncommitted and untracked changes remain excluded without reading mutable worktree files.

**Regression risks.**
- Changing accepted worktree behavior
- Performance on large tracked trees
- Windows path/case behavior

**Secondary sectors.**
- R03 generic persistence only if a mixed lock is stored
- R11 validator truth

**Aliases or dependencies.**
- None recorded.

**Explicitly unchanged areas.**
- External runtime HTTP contract
- B1 resource semantics
- betting-win source

### BWS116-R01-003: API convergence records completion metadata but not the exact records later consumed

**Classification:** `CONFIRMED_FINDING`
**Severity:** `P1`
**Confidence:** `HIGH`
**Primary owner:** `R01`
**Source:** `packages/bootstrap/src/operations/upstream-api-convergence.ts` · `resolveBwsUpstreamApiConvergenceConfig` · `L151-L244` · SHA-256 `4f066cc40d08e6ad4748866073c0a14683bd8b7066cb9f41c87f239e28ae5a63`
**Blocks:** review progression=false, release=true, BWS-600=true, BWS-710=true, deployment=true

**Preconditions.** A convergence cycle succeeds and a later scheduler, worker, or strategy path consumes the upstream resource after the provider state has changed.

**Trigger.** Convergence persists counts/cursors/currentness metadata and the downstream runtime subsequently issues a fresh API query instead of consuming an immutable page/record set bound to that cycle.

**Expected behavior.** The records evaluated downstream must be the exact byte- or record-set snapshot whose pagination and convergence checks completed, or the later query must create and validate a new cycle.

**Current behavior.** The cycle's durable representation does not retain or content-address the complete page records. Downstream work can therefore evaluate a different live response while attributing readiness/provenance to the earlier completed cycle.

**Impact.** BWS-600 can report convergence for one dataset and process another. Corrections, deletions, insertions, or reordering between the two reads create unprovable and potentially incomplete surebet inputs.

**Reproduction status.** STATIC_END_TO_END_TRACE_CONFIRMED across convergence, repository, service, and caller paths

**Root cause.** Convergence is modeled as a status/checkpoint observation rather than as ownership of an immutable data snapshot.

**Minimal fix boundary.** At the R01 boundary, bind a cycle to exact response/page hashes and an immutable record manifest (or persist the records transactionally), and require downstream consumers to reference that cycle identity. Hand generic transaction/fencing mechanics to R03.

**Evidence.**
- The convergence operation returns/persists page metadata and cursor/count state rather than an immutable record payload or content-addressed manifest.
- Call tracing from the convergence service to downstream scheduling/worker intake shows a later read of the live API boundary rather than replay of the completed cycle's exact records.

**Required tests.**
- Production-path test where the fake external API changes after convergence; downstream must consume the first immutable cycle or explicitly start a second cycle.
- Crash/restart test proving cycle identity and exact page set survive process restart.
- Correction/deletion test proving no record can disappear between convergence proof and consumption.

**Regression risks.**
- Storage growth
- Migration compatibility
- Worker handoff schema changes
- Duplicate retention

**Secondary sectors.**
- R03 transaction and checkpoint mechanics
- R07 BWS-600 evidence publication
- R12 controller lifecycle

**Aliases or dependencies.**
- None recorded.

**Explicitly unchanged areas.**
- R02 opportunity mathematics
- Public BWS API projection
- betting-win implementation

### BWS116-R01-004: Accepted API records are not cryptographically bound to exact response bytes, route, query, contract, generation, and page

**Classification:** `CONFIRMED_FINDING`
**Severity:** `P1`
**Confidence:** `HIGH`
**Primary owner:** `R01`
**Source:** `packages/bootstrap/src/adapters/betting-win-query-client.ts` · `describeReadOnlyQueryApiClientBoundary` · `L181-L183` · SHA-256 `7b50ba9a6c6e0dd5486bdca723a6f6c605bd7609151e062fe72ee36100d307ae`
**Blocks:** review progression=false, release=true, BWS-600=true, BWS-710=true, deployment=true

**Preconditions.** An external response is parsed successfully and imported or used in a convergence decision.

**Trigger.** The client emits normalized records/envelope metadata without an immutable digest over the received body and complete request identity, and persistence accepts those fields as provenance.

**Expected behavior.** Every accepted page must have immutable receive provenance covering exact bytes, URL origin and path, canonical query, contract/profile, upstream commit/generation, page/cursor, and receive time.

**Current behavior.** The boundary retains selected parsed fields and timestamps but lacks a response-byte digest and complete request/page binding. Equivalent parsed objects, altered extra fields, route drift, or page substitution cannot be distinguished later.

**Impact.** Auditors and restart logic cannot prove which bytes produced an import or readiness claim. Conflicting pages can collapse into the same apparent provenance, weakening duplicate/conflict detection and BWS-600 evidence truth.

**Reproduction status.** STATIC_DATAFLOW_TRACE_CONFIRMED

**Root cause.** Provenance is represented as descriptive metadata instead of a cryptographic receipt over the actual request/response exchange.

**Minimal fix boundary.** Extend the R01 API receipt and convergence cycle to include canonical request identity and exact-body hashes for contract and pages. Persist and validate the ordered receipt chain; delegate transaction atomicity to R03 and artifact publication to R07.

**Evidence.**
- The query client parses JSON into contract records and emits selected envelope/provenance fields, but does not return a digest of the exact response body.
- The persistence-facing convergence records do not form a complete content-addressed chain over contract negotiation plus every query page.

**Required tests.**
- Two bodies with identical required fields but different extra bytes must produce distinct receipts.
- Route/query/profile/generation/page substitutions must fail convergence even when record arrays match.
- Restart must preserve and revalidate the ordered page receipt chain.

**Regression risks.**
- Schema migration
- Canonicalization mistakes if hashes are taken after parsing
- Sensitive header leakage; headers must be allowlisted

**Secondary sectors.**
- R03 persistence mechanics
- R07 evidence artifact truth
- R11 aggregate validator truth

**Aliases or dependencies.**
- None recorded.

**Explicitly unchanged areas.**
- Provider credentials
- R02 quote/economic semantics
- External betting-win source

### BWS116-R01-005: Pagination does not bind every page to one immutable contract, profile, generation, and query identity

**Classification:** `CONFIRMED_FINDING`
**Severity:** `P1`
**Confidence:** `HIGH`
**Primary owner:** `R01`
**Source:** `packages/bootstrap/src/operations/upstream-api-convergence.ts` · `resolveBwsUpstreamApiConvergenceConfig` · `L151-L244` · SHA-256 `4f066cc40d08e6ad4748866073c0a14683bd8b7066cb9f41c87f239e28ae5a63`
**Blocks:** review progression=false, release=true, BWS-600=true, BWS-710=true, deployment=true

**Preconditions.** A multi-page query is accepted and the upstream deployment, generation, profile, or route semantics change between pages, or a test double returns internally inconsistent envelopes.

**Trigger.** The client validates contract/resource shape per response but the convergence loop carries forward only the cursor and does not enforce one immutable negotiation/identity tuple across all pages.

**Expected behavior.** Page 2 and later must be rejected unless their contract version, profile, upstream commit/generation, resource, canonical query, and lineage exactly match page 1 and the negotiated contract receipt.

**Current behavior.** The page loop can accept structurally valid pages whose identity-bearing metadata differs or is absent, allowing one logical convergence cycle to mix generations or route interpretations.

**Impact.** The completed resource can be neither a coherent snapshot nor replayable. Mixed-generation market/selection records can create omissions, duplicates, or ambiguous joins downstream.

**Reproduction status.** STATIC_BRANCH_TRACE_CONFIRMED; adversarial production-entrypoint case absent from focused tests

**Root cause.** Contract negotiation and page traversal are modeled as adjacent checks rather than one state machine with an invariant identity tuple.

**Minimal fix boundary.** Create a cycle identity from the negotiated contract and first accepted query, require exact equality for every page, and include that tuple in the immutable page receipt chain.

**Evidence.**
- Static loop tracing shows cursor progression but no cycle-level immutable identity object compared against each page's full envelope.
- Focused tests cover nominal multi-page retrieval but do not adversarially vary contract/profile/generation/commit identity after page 1 through the production convergence entrypoint.

**Required tests.**
- Page-2 contract/profile/generation/commit/resource drift cases must fail without advancing the durable cursor.
- Reordered and replayed pages must converge deterministically only when the ordered receipt chain is identical.

**Regression risks.**
- Compatibility with envelopes that currently omit identity fields
- Cursor semantics across upstream upgrades

**Secondary sectors.**
- R03 durable checkpoint mechanics
- R11 test/validator truth

**Aliases or dependencies.**
- None recorded.

**Explicitly unchanged areas.**
- R02 cross-provider matching
- R05 public API
- betting-win deployment policy

### BWS116-R01-006: Cursor traversal lacks a complete fail-closed proof against repetition, cycles, and non-progress

**Classification:** `CONFIRMED_FINDING`
**Severity:** `P2`
**Confidence:** `MEDIUM-HIGH`
**Primary owner:** `R01`
**Source:** `packages/bootstrap/src/adapters/betting-win-query-client.ts` · `describeReadOnlyQueryApiClientBoundary` · `L181-L183` · SHA-256 `7b50ba9a6c6e0dd5486bdca723a6f6c605bd7609151e062fe72ee36100d307ae`
**Blocks:** review progression=false, release=true, BWS-600=true, BWS-710=false, deployment=true

**Preconditions.** The upstream returns a repeated cursor, a two-cursor cycle, an empty nonterminal page, or an endlessly advancing malformed cursor stream.

**Trigger.** The pagination loop follows `next`/cursor metadata without retaining a visited-cursor set and without a single cycle-wide page/record/time budget enforced at the production entrypoint.

**Expected behavior.** Pagination must terminate or fail deterministically on cursor repetition/non-progress and remain bounded by explicit pages, records, bytes, and aggregate deadline.

**Current behavior.** The available guards do not jointly prove progress and boundedness for all cursor-cycle shapes and all retries/pages. Some malformed streams can consume the per-request budget repeatedly or terminate with ambiguous partial state.

**Impact.** A provider defect or malicious endpoint can hold the controller, amplify requests, or leave partial convergence state that requires operator intervention.

**Reproduction status.** STATIC_BOUNDEDNESS_TRACE_CONFIRMED; no network request performed

**Root cause.** Boundedness is distributed across request-local constants rather than represented as convergence-cycle state.

**Minimal fix boundary.** Add visited-cursor/non-progress checks and one explicit cycle budget over pages, records, bytes, retries, and wall-clock time. On violation, fail without promoting checkpoint/readiness.

**Evidence.**
- The traversal logic is cursor-driven; no complete cycle detector and aggregate multi-dimensional budget is enforced across the entire convergence operation.
- Focused tests do not cover repeated-cursor, A→B→A, empty-nonterminal, and unbounded-unique-cursor cases through the real client/convergence chain.

**Required tests.**
- Repeated cursor and two-node cursor cycle
- Empty page with nonterminal cursor
- Unique cursor stream beyond page/record/byte/deadline budgets
- Restart after bounded failure

**Regression risks.**
- Rejecting provider-specific legitimate empty pages
- Budget tuning

**Secondary sectors.**
- R06 long-running process lifecycle
- R07 campaign observation
- R11 aggregate tests

**Aliases or dependencies.**
- None recorded.

**Explicitly unchanged areas.**
- HTTP protocol implementation in betting-win
- R02 calculations
- R03 database schema except checkpoint handoff

### BWS116-R01-007: Per-request timeout and retry controls do not establish one aggregate convergence deadline or late-result ownership

**Classification:** `CONFIRMED_FINDING`
**Severity:** `P2`
**Confidence:** `HIGH`
**Primary owner:** `R01`
**Source:** `packages/bootstrap/src/operations/upstream-transport-constants.ts` · `export` · `L1-L4` · SHA-256 `dd5591b1c0fd7d57aeeacba4c49d25d8bca77f6acfee324cc6441c87f0175c15`
**Blocks:** review progression=false, release=true, BWS-600=true, BWS-710=false, deployment=true

**Preconditions.** Multiple pages each consume retries/backoff near their request-local timeout, or cancellation races with fetch completion.

**Trigger.** The convergence cycle applies request-local timeout/retry constants independently per contract/page attempt without a single propagated absolute deadline and cycle ownership token.

**Expected behavior.** One bounded cycle deadline and cancellation identity must govern contract negotiation, all pages, retries, parsing, persistence handoff, and late completions.

**Current behavior.** The sum of pages × attempts × timeout/backoff can exceed any operator-visible cycle budget, while a late response can complete after the logical caller has timed out unless every continuation checks ownership.

**Impact.** Controllers can appear hung, overlap cycles, duplicate reads/import intents, or emit success after cancellation. This weakens BWS-600 lifecycle truth even when individual requests are bounded.

**Reproduction status.** STATIC_TIMING_COMPOSITION_CONFIRMED; no external endpoint contacted

**Root cause.** Timeout and cancellation are scoped to fetch attempts rather than the owned convergence state machine.

**Minimal fix boundary.** Create an absolute cycle deadline and operation identity at the convergence entrypoint, pass remaining budget and cancellation through every call, and reject all late continuations before persistence/readiness effects.

**Evidence.**
- Transport constants define request/attempt behavior, but static tracing does not find an absolute deadline propagated through contract negotiation, pagination, convergence persistence, and caller cancellation.
- Focused tests use prompt-resolving fakes and do not force a late resolution after abort across the full production path.

**Required tests.**
- Late fetch resolution after abort
- Multi-page worst-case retry budget
- Cancellation between parse and persistence
- No duplicate cycle effects after caller timeout

**Regression risks.**
- Behavioral changes in retry policy
- Timer flakiness
- Interaction with R06 controller supervision

**Secondary sectors.**
- R06 process lifecycle
- R03 persistence fencing
- R07 evidence timing

**Aliases or dependencies.**
- None recorded.

**Explicitly unchanged areas.**
- Endpoint allowlist semantics
- B1 schema definitions
- R02 solver

### BWS116-R01-008: Response-size enforcement occurs after fetch buffering and therefore is not a transport memory bound

**Classification:** `CONFIRMED_FINDING`
**Severity:** `P2`
**Confidence:** `HIGH`
**Primary owner:** `R01`
**Source:** `packages/bootstrap/src/adapters/betting-win-query-client.ts` · `query` · `L16-L29` · SHA-256 `7b50ba9a6c6e0dd5486bdca723a6f6c605bd7609151e062fe72ee36100d307ae`
**Blocks:** review progression=false, release=false, BWS-600=true, BWS-710=false, deployment=true

**Preconditions.** A configured external endpoint returns a very large or unbounded HTTP body while remaining reachable.

**Trigger.** The implementation obtains the complete response text/JSON before comparing its length or parsed cardinality with configured limits.

**Expected behavior.** The client must cap compressed and decompressed bytes while streaming, abort before unbounded allocation, and reject bodies beyond the declared limit.

**Current behavior.** The limit is a post-buffer validation. It can reject an oversized body semantically, but only after memory and time have already been consumed.

**Impact.** A malformed or compromised endpoint can cause excessive memory use and process termination despite a nominal response-size constant.

**Reproduction status.** STATIC_API_ORDER_TRACE_CONFIRMED

**Root cause.** The size control is implemented as schema/input validation rather than transport resource enforcement.

**Minimal fix boundary.** Replace full-body buffering with a bounded reader that accounts for decoded bytes, aborts immediately on overflow, and only then parses JSON. Preserve exact-body hashing from finding 004 while streaming.

**Evidence.**
- The production request path uses full-body Fetch API buffering before response-size validation; no bounded stream reader is present in the owned adapter.

**Required tests.**
- Chunked body that crosses limit
- Incorrect/missing Content-Length
- Compressed expansion beyond limit
- Abort cleanup and no partial persistence

**Regression risks.**
- Node Fetch stream compatibility
- Unicode byte/character accounting
- Hashing and parser integration

**Secondary sectors.**
- R06 generic process reliability
- R11 test truth

**Aliases or dependencies.**
- None recorded.

**Explicitly unchanged areas.**
- Contract schema
- Convergence identity
- Persistent database

### BWS116-R01-009: External-runtime URL validation is lexical and does not prove the destination is non-local across all address forms

**Classification:** `CONFIRMED_FINDING`
**Severity:** `P1`
**Confidence:** `MEDIUM-HIGH`
**Primary owner:** `R01`
**Source:** `packages/bootstrap/src/operations/external-runtime-preflight.ts` · `createBwsExternalRuntimeCampaignManifest` · `L248-L433` · SHA-256 `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427`
**Blocks:** review progression=false, release=true, BWS-600=true, BWS-710=true, deployment=true

**Preconditions.** An operator-controlled or compromised configuration supplies an HTTP(S) hostname that is not lexically one of the explicitly rejected loopback strings but resolves or normalizes to local/private infrastructure.

**Trigger.** Preflight classifies externality from URL protocol/hostname text without canonical IP parsing plus controlled resolution and redirect-target enforcement.

**Expected behavior.** Accepted BWS-600 endpoints must be proven non-loopback/non-local for canonical IPv4, IPv6, mapped forms, DNS answers, redirects, and every connection attempt; credentials/userinfo must be rejected.

**Current behavior.** The guard rejects known local forms but does not establish destination-level externality for all equivalent address representations and DNS/redirect changes.

**Impact.** A local BWS service, dashboard, metadata endpoint, or other intranet target can potentially be reached while carrying an `external`-looking URL, defeating the external-runtime evidence boundary and creating SSRF exposure.

**Reproduction status.** STATIC_VALIDATION_GAP_CONFIRMED; no DNS or network request performed

**Root cause.** Externality is treated as a configuration-string property instead of a property of each resolved connection destination.

**Minimal fix boundary.** At the R01 configuration/preflight boundary, reject userinfo and unsupported schemes, canonicalize literal addresses, resolve hostnames under a bounded policy, reject loopback/link-local/private/unspecified/multicast destinations as required, and revalidate every redirect/connection. Coordinate generic networking mechanics with R10/R06 without weakening API-only holds.

**Evidence.**
- Static URL-guard tracing finds string/URL-property checks but no connection-time destination verifier tied to resolved addresses and redirect hops.
- Focused tests enumerate canonical loopback literals but do not cover the full mapped/encoded/DNS/redirect matrix through the real client.

**Required tests.**
- IPv6 loopback
- IPv4-mapped IPv6 loopback
- integer/legacy IPv4 forms accepted by runtime
- DNS to loopback/private
- redirect to local target
- userinfo and credential-bearing URL

**Regression risks.**
- DNS TOCTOU and dual-stack behavior
- Legitimate private managed-runtime deployments may need an explicit separate policy
- Proxy behavior

**Secondary sectors.**
- R10 environment/secret/path policy
- R06 generic transport
- R11 validators

**Aliases or dependencies.**
- None recorded.

**Explicitly unchanged areas.**
- Local fixture/export prohibition
- R02 economics
- betting-win source

### BWS116-R01-010: Source, receive, verification, import, and consumption times are not jointly enforced as distinct currentness evidence

**Classification:** `CONFIRMED_FINDING`
**Severity:** `P1`
**Confidence:** `HIGH`
**Primary owner:** `R01`
**Source:** `packages/bootstrap/src/operations/external-runtime-preflight.ts` · `createBwsExternalRuntimeCampaignManifest` · `L248-L433` · SHA-256 `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427`
**Blocks:** review progression=false, release=true, BWS-600=true, BWS-710=true, deployment=true

**Preconditions.** An upstream record or envelope carries an old, future, missing, or inconsistent source timestamp while the HTTP exchange itself is recent.

**Trigger.** Acceptance/currentness checks rely on one timestamp or derived age and do not preserve/enforce source event time, upstream snapshot time, local receive time, verification time, import time, and downstream consumption time separately.

**Expected behavior.** Currentness must be a fail-closed predicate over explicitly typed clocks with bounded skew, maximum source age, receive age, and consumption age; missing or future source time must remain unknown/rejected where required.

**Current behavior.** Recent receipt can make retained/stale data appear current, while future timestamps can reduce calculated age. The resulting provenance cannot distinguish a fresh response containing old state from genuinely current upstream state.

**Impact.** BWS-600 or BWS-710 can promote stale or temporally impossible resources, causing surebet decisions from outdated markets/quotes while status still reports current external evidence.

**Reproduction status.** STATIC_TEMPORAL_SEMANTICS_TRACE_CONFIRMED

**Root cause.** Currentness is represented as a scalar age/status instead of a typed temporal evidence model.

**Minimal fix boundary.** Preserve all clock domains explicitly, prohibit blank/default collapse, apply bounded skew and age rules at preflight and consumption, and bind the values to immutable page receipts.

**Evidence.**
- Static dataflow shows multiple timestamps are either optional, defaulted, or not bound together in the acceptance receipt.
- Focused tests do not exhaust missing/blank/epoch/future/skewed source timestamps combined with fresh receive time through production preflight and convergence.

**Required tests.**
- Fresh receive + stale source
- Future source time
- Missing source time
- Boundary skew
- Restart/consumption after evidence expiry

**Regression risks.**
- Clock-source availability
- Compatibility with historical/replay inputs
- Time-zone/string parsing

**Secondary sectors.**
- R02 quote freshness semantics
- R03 persistence types
- R07 evidence publication

**Aliases or dependencies.**
- None recorded.

**Explicitly unchanged areas.**
- Replay/export historical acceptance when explicitly typed historical
- R02 solver
- External source code

## Probable findings

None confirmed in this classification.

## Hypotheses

None confirmed in this classification.

## External upstream blockers

### BWS116-R01-EUB-001: Accepted external betting-win B1 multi-venue runtime resource is absent from supplied BWS authority

**Classification:** `EXTERNAL_UPSTREAM_BLOCKER`
**Severity:** `P1`
**Confidence:** `HIGH`
**Primary owner:** `EXTERNAL_UPSTREAM`
**Source:** `packages/bootstrap/src/operations/b1-runtime-evidence.ts` · `classifyB1OfflineAcceptanceAndKillCriteria` · `L98-L229` · SHA-256 `80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8`
**Blocks:** review progression=false, release=true, BWS-600=false, BWS-710=true, deployment=true

**Preconditions.** BWS-710 acceptance is requested.

**Trigger.** The preflight seeks an accepted live B1 multi-venue resource from betting-win.

**Expected behavior.** An externally served resource matching the declared B1 contract, profile, currentness, provenance, and multi-venue requirements is present and accepted.

**Current behavior.** The repository correctly declares/validates B1 shapes but the required accepted external runtime resource is not established by the supplied archive.

**Impact.** BWS-710 remains blocked; schema declarations and local fixtures cannot substitute for runtime resource acceptance.

**Reproduction status.** ARCHIVE_AUTHORITY_ONLY; external verification prohibited

**Root cause.** Missing external upstream runtime evidence, not a BWS implementation defect by itself.

**Minimal fix boundary.** No BWS source change is prescribed. Supply and independently accept the required betting-win runtime resource through the existing external boundary after R01 findings are fixed.

**Evidence.**
- Current status authority declares BWS710 blocked on an accepted betting-win B1 multi-venue API resource.
- No external service was contacted, so current upstream availability cannot be established from this archive.

**Required tests.**
- Acceptance test against an authorized immutable external-runtime capture/receipt when available.

**Regression risks.**
- Do not convert local fixtures, export bundles, or schema markers into accepted evidence.

**Secondary sectors.**
- R07 evidence publication
- R11 validator truth

**Aliases or dependencies.**
- bws710_status=BLOCKED_ACCEPTED_BETTING_WIN_B1_MULTI_VENUE_API_REQUIRED

**Explicitly unchanged areas.**
- betting-win source
- BWS execution remains parked

## Intentional safeguards

### BWS116-R01-SG-001: API-only and external-runtime holds are explicit in current routing authority

**Classification:** `INTENTIONAL_SAFEGUARD`
**Severity:** `P3`
**Confidence:** `HIGH`
**Primary owner:** `R01`
**Source:** `docs/041_external_runtime_preflight_and_bws600_campaign.md` · `041 - External runtime preflight and BWS-600 campaign` · `L1-L82` · SHA-256 `2b660f97040f6893f0110172a0f3e5ebe0b6e25f64f0e8ea4daf8ab310242620`
**Blocks:** review progression=false, release=false, BWS-600=false, BWS-710=false, deployment=false

**Preconditions.** Current routing/status files remain authoritative.

**Trigger.** An operator attempts to use a local BWS endpoint, fixture, export, mock, dashboard, or synthesized schedule as BWS-600 runtime evidence.

**Expected behavior.** The input remains historical/test-only and cannot satisfy external-runtime acceptance.

**Current behavior.** The documented and validated policy explicitly preserves that hold; this review found no intended authority allowing those substitutes.

**Impact.** Prevents local self-attestation and false campaign readiness.

**Reproduction status.** STATIC_POLICY_TRACE_CONFIRMED

**Root cause.** Intentional fail-closed design.

**Minimal fix boundary.** Preserve while correcting the concrete R01 defects.

**Evidence.**
- Status, scope, and BWS-600 campaign documents maintain API-only external evidence requirements.

**Required tests.**
- Retain negative tests for local/fixture/export/mock/dashboard evidence.

**Regression risks.**
- Generic URL/capability refactors must not erase source-type distinctions.

**Secondary sectors.**
- R07
- R11
- R12

**Aliases or dependencies.**
- current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE

**Explicitly unchanged areas.**
- BWS-900 remains parked
- No execution authorization

## Rejected suspicions

### BWS116-R01-RS-001: Pinned bundles and exports are not accepted as current BWS-600 runtime proof by intended authority

**Classification:** `REJECTED_SUSPICION`
**Severity:** `P3`
**Confidence:** `HIGH`
**Primary owner:** `R01`
**Source:** `packages/bootstrap/src/adapters/betting-win-pinned-bundle-intake.ts` · `validatePinnedBettingWinBundleIntake` · `L36-L66` · SHA-256 `d22fc6007f4d2980bab9419126ec00652dc5b27114e4347871bc66ff3abc5026`
**Blocks:** review progression=false, release=false, BWS-600=false, BWS-710=false, deployment=false

**Preconditions.** Historical/pinned input paths are invoked in their documented role.

**Trigger.** A reviewer suspects their mere successful parsing satisfies external preflight.

**Expected behavior.** They remain replay/compatibility inputs and require separate external runtime evidence for BWS-600.

**Current behavior.** The intended authority keeps them distinct; no direct accepted route was confirmed from those readers into BWS-600 completion.

**Impact.** No finding assigned for this suspicion. The distinction must remain covered during fixes.

**Reproduction status.** STATIC_NEGATIVE_TRACE

**Root cause.** Suspicion rejected under current source; risk remains as regression surface.

**Minimal fix boundary.** No change required for this record.

**Evidence.**
- Separate adapters and convergence paths retain explicit source-mode distinctions in the reviewed archive.

**Required tests.**
- Keep end-to-end negative tests proving these paths cannot satisfy external runtime acceptance.

**Regression risks.**
- Future unification of convergence modes

**Secondary sectors.**
- R11
- R12

**Aliases or dependencies.**
- None recorded.

**Explicitly unchanged areas.**
- Historical replay/export support

## Cross-area handoffs

### BWS116-R01-HO-001: Atomic persistence and checkpoint fencing for immutable API cycles

**Classification:** `CROSS_AREA_HANDOFF`
**Severity:** `P1`
**Confidence:** `HIGH`
**Primary owner:** `R03`
**Source:** `packages/persistence/src/repositories/upstream-api-convergence-repository.ts` · `SurebetUpstreamApiConvergenceRepository` · `L71-L238` · SHA-256 `298c9e2b2d874f5e11e7278893f00acaaaf16b48a47fde0cab41c33e59017ba0`
**Blocks:** review progression=false, release=true, BWS-600=true, BWS-710=true, deployment=true

**Preconditions.** R01 introduces immutable cycle/page receipts and exact record ownership.

**Trigger.** Those semantic objects are persisted, resumed, or promoted.

**Expected behavior.** Record set, ordered receipt chain, cursor/checkpoint, and readiness transition commit atomically with lease/fencing semantics.

**Current behavior.** The semantic correction is R01-owned, while generic transaction, lease, crash, and fencing behavior belongs to R03.

**Impact.** R01 fixes would remain incomplete if persistence can commit only part of the new cycle state.

**Reproduction status.** HANDOFF_IDENTIFIED

**Root cause.** Ownership boundary, not a duplicate R03 finding.

**Minimal fix boundary.** R03 reviews/implements atomic storage mechanics after R01 defines the exact semantic receipt/cycle contract.

**Evidence.**
- Findings 003-005 cross the persistence-facing boundary.

**Required tests.**
- Crash-before/after-commit, duplicate replay, stale lease, and conflicting cycle persistence.

**Regression risks.**
- Schema and migration compatibility

**Secondary sectors.**
- R01
- R07
- R12

**Aliases or dependencies.**
- BWS116-R01-003
- BWS116-R01-004
- BWS116-R01-005

**Explicitly unchanged areas.**
- R02 economic logic

### BWS116-R01-HO-002: Known SOURCE_MANIFEST drift remains assigned to R11

**Classification:** `CROSS_AREA_HANDOFF`
**Severity:** `P3`
**Confidence:** `HIGH`
**Primary owner:** `R11`
**Source:** `SOURCE_MANIFEST.json` · `{` · `L1-L3092` · SHA-256 `d9ea618c19fac733cf070c7e9b811ace8a1a0d637680b0b9f8233be5879aba6a`
**Blocks:** review progression=false, release=false, BWS-600=false, BWS-710=false, deployment=false

**Preconditions.** Archive/member integrity is evaluated.

**Trigger.** SOURCE_MANIFEST hashes/sizes are compared with ZIP members.

**Expected behavior.** The known seven-file drift is recorded without creating an R01 finding unless it causes an independent upstream-trust defect.

**Current behavior.** The ZIP is authoritative; the 617 non-self path set is retained, with known stale metadata for seven files.

**Impact.** No R01 finding. Future R11 must correct aggregate manifest trust without changing R01 source conclusions.

**Reproduction status.** KNOWN_BASELINE_MANIFEST_DRIFT

**Root cause.** Aggregate source-manifest maintenance outside R01 ownership.

**Minimal fix boundary.** R11 only; do not regenerate during this read-only review.

**Evidence.**
- Known baseline qualification supplied by the review contract and independently checked against archive membership where parseable.

**Required tests.**
- Manifest self-exclusion and exact member hash/size reconciliation.

**Regression risks.**
- Accidental source mutation or baseline redefinition

**Secondary sectors.**
- R01 archive qualification

**Aliases or dependencies.**
- KNOWN_BASELINE_MANIFEST_DRIFT

**Explicitly unchanged areas.**
- ZIP source authority
- All R01 findings

## Test gaps

### BWS116-R01-TG-001: Focused tests do not adversarially exercise the full production entrypoint for identity drift and lifecycle races

**Classification:** `TEST_GAP`
**Severity:** `P2`
**Confidence:** `HIGH`
**Primary owner:** `R11`
**Source:** `tests/bws-upstream-api-convergence.test.ts` · `test('upstream API convergence advances one deterministic page per pass and recovers checkpoint advancement from persisted import metadata', async () => {` · `L52-L148` · SHA-256 `3852ccb8defc6625a76297c0e3f7e4786e3d86009e9e045d8f88ea24ebe7318b`
**Blocks:** review progression=false, release=true, BWS-600=true, BWS-710=true, deployment=true

**Preconditions.** Focused unit tests and validators are treated as evidence of boundary correctness.

**Trigger.** The suite runs nominal/enriched fixtures without replacement refs, moving HEAD, page identity drift, repeated cursor cycles, late fetch completion, or stale-source/fresh-receive combinations through the real entrypoints.

**Expected behavior.** Tests invoke the production lock, client, convergence, preflight, repository-facing adapters, and CLI wiring with hostile exact-shape inputs.

**Current behavior.** Coverage is strong on declared shapes and intended holds but insufficient on the confirmed cross-step invariants. Marker/schema success can therefore coexist with the defects above.

**Impact.** Fixes can regress or validators can remain green without proving production-boundary truth.

**Reproduction status.** STATIC_TEST_TO_PRODUCTION_GAP_TRACE

**Root cause.** Tests assert local return values and accepted markers more often than immutable end-to-end state-machine properties.

**Minimal fix boundary.** R11 owns aggregate suite/validator integration; each R01 fix owns focused production-entrypoint regression tests.

**Evidence.**
- Static comparison of focused tests/validators against production branches identified unexercised adversarial paths listed in findings 001-010.

**Required tests.**
- All per-finding required tests
- Validator negative controls that mutate one receipt/identity field at a time

**Regression risks.**
- False greens from circular expected-value helpers
- Over-mocked transport/persistence

**Secondary sectors.**
- R01

**Aliases or dependencies.**
- BWS116-R01-001
- BWS116-R01-002
- BWS116-R01-003
- BWS116-R01-004
- BWS116-R01-005
- BWS116-R01-006
- BWS116-R01-007
- BWS116-R01-008
- BWS116-R01-009
- BWS116-R01-010

**Explicitly unchanged areas.**
- No source/test implementation produced in this review

## BWS-600 and BWS-710 lifecycle truth

The current states remain distinct:

- Source/preflight capability present does not mean BWS-600 started.
- BWS-600 externally blocked does not mean a campaign started or completed.
- A completed local validator does not constitute accepted external runtime evidence.
- A declared B1 schema does not mean an accepted B1 runtime resource exists.
- BWS-710 remains blocked until an external multi-venue resource is accepted under the corrected R01 trust boundary.
- BWS-900 execution remains parked and unauthorized.

No local BWS endpoint, file, fixture, mock, export, dashboard route, or synthesized schedule was treated as runtime proof.

## Defaults, coercions, and unknown-state review

The review inventoried environment-derived base URL/profile/time-budget inputs; optional envelope and timestamp properties; blank-string handling; cursor termination; retry/backoff defaults; response limits; source-mode selectors; and historical/local/pinned input modes. The principal unsafe collapses are captured in the findings: descriptive provenance in place of exact receipts, request-local bounds in place of cycle bounds, and recent receipt in place of typed currentness. Existing explicit API-only and external-evidence holds are safeguards, not defaults to remove.

## Prioritized review-only remediation order

1. Correct literal committed-object and single-snapshot lock derivation (findings 001-002).
2. Define one immutable negotiated API cycle identity and exact response/page receipt chain (findings 004-005).
3. Make convergence own the exact records/manifest it proves and hand atomic storage mechanics to R03 (finding 003 and handoff HO-001).
4. Establish destination-level external URL policy and typed temporal currentness (findings 009-010).
5. Add cursor-cycle, aggregate deadline, late-result, and streaming-size bounds (findings 006-008).
6. Add production-entrypoint negative/adversarial tests, then let R11 aggregate validators prove the corrected paths.
7. Only after the BWS-side boundary is accepted, collect authorized external BWS-600 evidence and separately satisfy the BWS-710 multi-venue resource blocker.

## Explicitly unchanged areas

- No source, test, schema, migration, documentation, configuration, manifest, or archive member was edited.
- No implementation prompt, overlay, patch, server command, controller run, or autonomous campaign was produced.
- No `betting-win` checkout or attached `betting-win` archive was accessed.
- No provider, external API, RPC, account, credential, wallet, signer, deployed service, or persistent database was contacted.
- R02 economics/opportunity/solver semantics, R03 generic transaction machinery, R05 public BWS API, R06 generic lifecycle, R07 evidence publication, R10 repository-wide environment policy, R11 aggregate trust, and R12 controller lifecycle were not reassigned to R01.
- The known seven-file source-manifest drift remains a non-R01 R11 handoff.

## Validation limitations

Canonical `v20.20.2` acceptance was unavailable; any observations under `v22.16.0` are supplementary. No external currentness statement can be made because network/provider/service access was prohibited. The Git replacement-object defect was reproduced only in a disposable local repository outside the extracted source. All other confirmed findings are grounded in static current-source and production-call-path tracing plus bounded inert analysis.

The machine-readable details, exact source hashes/ranges, command log, coverage reconciliation, and attestations are in the companion JSON/TSV files.
