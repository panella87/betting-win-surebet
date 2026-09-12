# BWS118 Wave 02 cumulative cross-review issue ledger

## Baseline and scope

- Current archive: `betting-win-surebet118.zip`
- SHA-256: `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- Regular files: `657`
- Areas consolidated: `R01` through `R06`.
- Wave 02 inputs: `BWS118-R04`, `BWS118-R05`, `BWS118-R06`.
- Application implementation: `none`.

## Cumulative counts

- Confirmed findings: `85`.
- Severity: `P0=1`, `P1=71`, `P2=13`, `P3=0`.
- Release blocking: `82`.
- Release or deployment blocking: `84`.
- BWS-600 blocking: `71`.
- B1/BWS-710 blocking: `68`.

Review completion does not close any finding or promote runtime, release, deployment, or execution state.

## BWS116-R01-001 | P1 | Committed-HEAD lock derivation honors repository-local Git replacement objects

- **Aliases:** `none`
- **Source reports:** `BWS116-R01`
- **Source areas:** `R01`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R01`
- **Secondary areas:** `R10 environment/CLI policy, R11 aggregate validator truth`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

A committed-source lock must describe the literal object graph named by the advertised commit ID, independent of repository-local replacement refs.

**Trigger**

The lock implementation resolves HEAD/tree/content with ordinary Git plumbing commands while replacement-object processing remains enabled.

**Current behavior**

The lock path does not force replacement objects off. Git can therefore report the original HEAD object name while dereferencing a replacement commit/tree for later content-oriented commands, producing a lock that is not portable proof of the named commit.

**Expected behavior**

A committed-source lock must describe the literal object graph named by the advertised commit ID, independent of repository-local replacement refs.

**Impact**

A repository-local mutable ref can make a false source view satisfy commit/package/workspace/capability checks. The resulting lock is not an immutable proof and can diverge from a clean clone of the same commit ID.

**Evidence**

- The production lock implementation invokes Git object/plumbing operations without a replacement-object-disabled environment or an equivalent literal-object verification step.
- A bounded disposable Git harness outside the source tree demonstrated that refs/replace can leave the printed HEAD name unchanged while changing dereferenced commit/tree content.

**Current files and symbols**

- packages/upstream/src/upstream/betting-win-upstream-lock.ts :: generateBettingWinUpstreamLock :: L102-L103 :: 8c0badbfc3dc776eb71e01e1a76280debab30c64739274b06d1ce7343382a6c2

**Source-pinned files and symbols**

- None

**Root cause**

The trust model treats Git's default revision resolver as a literal object reader, but default resolution includes mutable repository-local replacement refs.

**Cross-area dependencies**

- None

**Minimal fix boundary**

In the upstream-lock command runner only, disable replacement-object interpretation for every identity/content operation and verify that commit, tree, and blob reads all originate from the literal advertised objects. Preserve the existing lock schema unless a compatibility version is deliberately introduced.

**Required tests**

- Production-entrypoint test with a disposable repository containing a replacement commit and replacement blob; lock generation must reject or produce the literal original graph.
- Control test proving ordinary committed HEAD, worktree, and bare-repository forms remain accepted as intended.

**Regression risk**

- Git-version differences in replacement behavior
- Accidental rejection of legitimate worktrees or alternates
- Lock-schema compatibility

**Unchanged areas**

- BWS API intake
- Convergence persistence
- betting-win source

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R01/BWS116-R01-report.md and cumulative Wave 01 ledger`

## BWS116-R01-002 | P1 | Upstream lock is assembled from multiple unconstrained HEAD observations rather than one pinned object graph

- **Aliases:** `none`
- **Source reports:** `BWS116-R01`
- **Source areas:** `R01`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R01`
- **Secondary areas:** `R03 generic persistence only if a mixed lock is stored, R11 validator truth`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

All lock fields must be derived from one explicitly pinned commit/tree snapshot, or generation must fail when the repository moves.

**Trigger**

HEAD, tree, tracked-file fingerprint, package/workspace data, or capabilities are resolved by separate Git/filesystem operations without first pinning and reusing one immutable commit object and without a final same-object check.

**Current behavior**

The lock is composed across multiple observations. A concurrent branch update can mix identity from one revision with tree/content/fingerprint evidence from another, and the final record does not prove atomicity of the source view.

**Expected behavior**

All lock fields must be derived from one explicitly pinned commit/tree snapshot, or generation must fail when the repository moves.

**Impact**

A syntactically valid lock can bind mutually inconsistent source facts, causing false compatibility acceptance or nondeterministic failures across reruns.

**Evidence**

- Static call tracing shows separate command boundaries for repository, HEAD/tree, tracked content, and package/capability derivation.
- No lock-generation transaction, object-directory snapshot, single-commit pathspec enumeration, or final equality guard makes those observations atomic.

**Current files and symbols**

- packages/upstream/src/upstream/betting-win-upstream-lock.ts :: generateBettingWinUpstreamLock :: L102-L103 :: 8c0badbfc3dc776eb71e01e1a76280debab30c64739274b06d1ce7343382a6c2

**Source-pinned files and symbols**

- None

**Root cause**

The implementation pins a branch name operationally, not a single object graph used as the sole input to every derived field.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Resolve one literal commit object once, derive tree and every committed file from that object ID, and fail if any required filesystem-derived datum cannot be read from the same commit. Add a final guard only as defense in depth, not as the primary snapshot mechanism.

**Required tests**

- Instrumented disposable-repository test that advances the branch between each Git subprocess and proves either stable old/new lock output or fail-closed behavior, never a mixed record.
- Test uncommitted and untracked changes remain excluded without reading mutable worktree files.

**Regression risk**

- Changing accepted worktree behavior
- Performance on large tracked trees
- Windows path/case behavior

**Unchanged areas**

- External runtime HTTP contract
- B1 resource semantics
- betting-win source

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R01/BWS116-R01-report.md and cumulative Wave 01 ledger`

## BWS116-R01-003 | P1 | API convergence records completion metadata but not the exact records later consumed

- **Aliases:** `none`
- **Source reports:** `BWS116-R01`
- **Source areas:** `R01`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R01`
- **Secondary areas:** `R03 transaction and checkpoint mechanics, R07 BWS-600 evidence publication, R12 controller lifecycle`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

The records evaluated downstream must be the exact byte- or record-set snapshot whose pagination and convergence checks completed, or the later query must create and validate a new cycle.

**Trigger**

Convergence persists counts/cursors/currentness metadata and the downstream runtime subsequently issues a fresh API query instead of consuming an immutable page/record set bound to that cycle.

**Current behavior**

The cycle's durable representation does not retain or content-address the complete page records. Downstream work can therefore evaluate a different live response while attributing readiness/provenance to the earlier completed cycle.

**Expected behavior**

The records evaluated downstream must be the exact byte- or record-set snapshot whose pagination and convergence checks completed, or the later query must create and validate a new cycle.

**Impact**

BWS-600 can report convergence for one dataset and process another. Corrections, deletions, insertions, or reordering between the two reads create unprovable and potentially incomplete surebet inputs.

**Evidence**

- The convergence operation returns/persists page metadata and cursor/count state rather than an immutable record payload or content-addressed manifest.
- Call tracing from the convergence service to downstream scheduling/worker intake shows a later read of the live API boundary rather than replay of the completed cycle's exact records.

**Current files and symbols**

- packages/bootstrap/src/operations/upstream-api-convergence.ts :: resolveBwsUpstreamApiConvergenceConfig :: L151-L244 :: 4f066cc40d08e6ad4748866073c0a14683bd8b7066cb9f41c87f239e28ae5a63

**Source-pinned files and symbols**

- None

**Root cause**

Convergence is modeled as a status/checkpoint observation rather than as ownership of an immutable data snapshot.

**Cross-area dependencies**

- None

**Minimal fix boundary**

At the R01 boundary, bind a cycle to exact response/page hashes and an immutable record manifest (or persist the records transactionally), and require downstream consumers to reference that cycle identity. Hand generic transaction/fencing mechanics to R03.

**Required tests**

- Production-path test where the fake external API changes after convergence; downstream must consume the first immutable cycle or explicitly start a second cycle.
- Crash/restart test proving cycle identity and exact page set survive process restart.
- Correction/deletion test proving no record can disappear between convergence proof and consumption.

**Regression risk**

- Storage growth
- Migration compatibility
- Worker handoff schema changes
- Duplicate retention

**Unchanged areas**

- R02 opportunity mathematics
- Public BWS API projection
- betting-win implementation

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R01/BWS116-R01-report.md and cumulative Wave 01 ledger`

## BWS116-R01-004 | P1 | Accepted API records are not cryptographically bound to exact response bytes, route, query, contract, generation, and page

- **Aliases:** `none`
- **Source reports:** `BWS116-R01`
- **Source areas:** `R01`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R01`
- **Secondary areas:** `R03 persistence mechanics, R07 evidence artifact truth, R11 aggregate validator truth`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Every accepted page must have immutable receive provenance covering exact bytes, URL origin and path, canonical query, contract/profile, upstream commit/generation, page/cursor, and receive time.

**Trigger**

The client emits normalized records/envelope metadata without an immutable digest over the received body and complete request identity, and persistence accepts those fields as provenance.

**Current behavior**

The boundary retains selected parsed fields and timestamps but lacks a response-byte digest and complete request/page binding. Equivalent parsed objects, altered extra fields, route drift, or page substitution cannot be distinguished later.

**Expected behavior**

Every accepted page must have immutable receive provenance covering exact bytes, URL origin and path, canonical query, contract/profile, upstream commit/generation, page/cursor, and receive time.

**Impact**

Auditors and restart logic cannot prove which bytes produced an import or readiness claim. Conflicting pages can collapse into the same apparent provenance, weakening duplicate/conflict detection and BWS-600 evidence truth.

**Evidence**

- The query client parses JSON into contract records and emits selected envelope/provenance fields, but does not return a digest of the exact response body.
- The persistence-facing convergence records do not form a complete content-addressed chain over contract negotiation plus every query page.

**Current files and symbols**

- packages/bootstrap/src/adapters/betting-win-query-client.ts :: describeReadOnlyQueryApiClientBoundary :: L181-L183 :: 7b50ba9a6c6e0dd5486bdca723a6f6c605bd7609151e062fe72ee36100d307ae

**Source-pinned files and symbols**

- None

**Root cause**

Provenance is represented as descriptive metadata instead of a cryptographic receipt over the actual request/response exchange.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Extend the R01 API receipt and convergence cycle to include canonical request identity and exact-body hashes for contract and pages. Persist and validate the ordered receipt chain; delegate transaction atomicity to R03 and artifact publication to R07.

**Required tests**

- Two bodies with identical required fields but different extra bytes must produce distinct receipts.
- Route/query/profile/generation/page substitutions must fail convergence even when record arrays match.
- Restart must preserve and revalidate the ordered page receipt chain.

**Regression risk**

- Schema migration
- Canonicalization mistakes if hashes are taken after parsing
- Sensitive header leakage; headers must be allowlisted

**Unchanged areas**

- Provider credentials
- R02 quote/economic semantics
- External betting-win source

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R01/BWS116-R01-report.md and cumulative Wave 01 ledger`

## BWS116-R01-005 | P1 | Pagination does not bind every page to one immutable contract, profile, generation, and query identity

- **Aliases:** `none`
- **Source reports:** `BWS116-R01`
- **Source areas:** `R01`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R01`
- **Secondary areas:** `R03 durable checkpoint mechanics, R11 test/validator truth`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Page 2 and later must be rejected unless their contract version, profile, upstream commit/generation, resource, canonical query, and lineage exactly match page 1 and the negotiated contract receipt.

**Trigger**

The client validates contract/resource shape per response but the convergence loop carries forward only the cursor and does not enforce one immutable negotiation/identity tuple across all pages.

**Current behavior**

The page loop can accept structurally valid pages whose identity-bearing metadata differs or is absent, allowing one logical convergence cycle to mix generations or route interpretations.

**Expected behavior**

Page 2 and later must be rejected unless their contract version, profile, upstream commit/generation, resource, canonical query, and lineage exactly match page 1 and the negotiated contract receipt.

**Impact**

The completed resource can be neither a coherent snapshot nor replayable. Mixed-generation market/selection records can create omissions, duplicates, or ambiguous joins downstream.

**Evidence**

- Static loop tracing shows cursor progression but no cycle-level immutable identity object compared against each page's full envelope.
- Focused tests cover nominal multi-page retrieval but do not adversarially vary contract/profile/generation/commit identity after page 1 through the production convergence entrypoint.

**Current files and symbols**

- packages/bootstrap/src/operations/upstream-api-convergence.ts :: resolveBwsUpstreamApiConvergenceConfig :: L151-L244 :: 4f066cc40d08e6ad4748866073c0a14683bd8b7066cb9f41c87f239e28ae5a63

**Source-pinned files and symbols**

- None

**Root cause**

Contract negotiation and page traversal are modeled as adjacent checks rather than one state machine with an invariant identity tuple.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Create a cycle identity from the negotiated contract and first accepted query, require exact equality for every page, and include that tuple in the immutable page receipt chain.

**Required tests**

- Page-2 contract/profile/generation/commit/resource drift cases must fail without advancing the durable cursor.
- Reordered and replayed pages must converge deterministically only when the ordered receipt chain is identical.

**Regression risk**

- Compatibility with envelopes that currently omit identity fields
- Cursor semantics across upstream upgrades

**Unchanged areas**

- R02 cross-provider matching
- R05 public API
- betting-win deployment policy

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R01/BWS116-R01-report.md and cumulative Wave 01 ledger`

## BWS116-R01-006 | P2 | Cursor traversal lacks a complete fail-closed proof against repetition, cycles, and non-progress

- **Aliases:** `none`
- **Source reports:** `BWS116-R01`
- **Source areas:** `R01`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R01`
- **Secondary areas:** `R06 long-running process lifecycle, R07 campaign observation, R11 aggregate tests`
- **Repository severity:** `P2`
- **Normalized severity:** `P2`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Pagination must terminate or fail deterministically on cursor repetition/non-progress and remain bounded by explicit pages, records, bytes, and aggregate deadline.

**Trigger**

The pagination loop follows `next`/cursor metadata without retaining a visited-cursor set and without a single cycle-wide page/record/time budget enforced at the production entrypoint.

**Current behavior**

The available guards do not jointly prove progress and boundedness for all cursor-cycle shapes and all retries/pages. Some malformed streams can consume the per-request budget repeatedly or terminate with ambiguous partial state.

**Expected behavior**

Pagination must terminate or fail deterministically on cursor repetition/non-progress and remain bounded by explicit pages, records, bytes, and aggregate deadline.

**Impact**

A provider defect or malicious endpoint can hold the controller, amplify requests, or leave partial convergence state that requires operator intervention.

**Evidence**

- The traversal logic is cursor-driven; no complete cycle detector and aggregate multi-dimensional budget is enforced across the entire convergence operation.
- Focused tests do not cover repeated-cursor, A→B→A, empty-nonterminal, and unbounded-unique-cursor cases through the real client/convergence chain.

**Current files and symbols**

- packages/bootstrap/src/adapters/betting-win-query-client.ts :: describeReadOnlyQueryApiClientBoundary :: L181-L183 :: 7b50ba9a6c6e0dd5486bdca723a6f6c605bd7609151e062fe72ee36100d307ae

**Source-pinned files and symbols**

- None

**Root cause**

Boundedness is distributed across request-local constants rather than represented as convergence-cycle state.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Add visited-cursor/non-progress checks and one explicit cycle budget over pages, records, bytes, retries, and wall-clock time. On violation, fail without promoting checkpoint/readiness.

**Required tests**

- Repeated cursor and two-node cursor cycle
- Empty page with nonterminal cursor
- Unique cursor stream beyond page/record/byte/deadline budgets
- Restart after bounded failure

**Regression risk**

- Rejecting provider-specific legitimate empty pages
- Budget tuning

**Unchanged areas**

- HTTP protocol implementation in betting-win
- R02 calculations
- R03 database schema except checkpoint handoff

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R01/BWS116-R01-report.md and cumulative Wave 01 ledger`

## BWS116-R01-007 | P2 | Per-request timeout and retry controls do not establish one aggregate convergence deadline or late-result ownership

- **Aliases:** `none`
- **Source reports:** `BWS116-R01`
- **Source areas:** `R01`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R01`
- **Secondary areas:** `R06 process lifecycle, R03 persistence fencing, R07 evidence timing`
- **Repository severity:** `P2`
- **Normalized severity:** `P2`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

One bounded cycle deadline and cancellation identity must govern contract negotiation, all pages, retries, parsing, persistence handoff, and late completions.

**Trigger**

The convergence cycle applies request-local timeout/retry constants independently per contract/page attempt without a single propagated absolute deadline and cycle ownership token.

**Current behavior**

The sum of pages × attempts × timeout/backoff can exceed any operator-visible cycle budget, while a late response can complete after the logical caller has timed out unless every continuation checks ownership.

**Expected behavior**

One bounded cycle deadline and cancellation identity must govern contract negotiation, all pages, retries, parsing, persistence handoff, and late completions.

**Impact**

Controllers can appear hung, overlap cycles, duplicate reads/import intents, or emit success after cancellation. This weakens BWS-600 lifecycle truth even when individual requests are bounded.

**Evidence**

- Transport constants define request/attempt behavior, but static tracing does not find an absolute deadline propagated through contract negotiation, pagination, convergence persistence, and caller cancellation.
- Focused tests use prompt-resolving fakes and do not force a late resolution after abort across the full production path.

**Current files and symbols**

- packages/bootstrap/src/operations/upstream-transport-constants.ts :: export :: L1-L4 :: dd5591b1c0fd7d57aeeacba4c49d25d8bca77f6acfee324cc6441c87f0175c15

**Source-pinned files and symbols**

- None

**Root cause**

Timeout and cancellation are scoped to fetch attempts rather than the owned convergence state machine.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Create an absolute cycle deadline and operation identity at the convergence entrypoint, pass remaining budget and cancellation through every call, and reject all late continuations before persistence/readiness effects.

**Required tests**

- Late fetch resolution after abort
- Multi-page worst-case retry budget
- Cancellation between parse and persistence
- No duplicate cycle effects after caller timeout

**Regression risk**

- Behavioral changes in retry policy
- Timer flakiness
- Interaction with R06 controller supervision

**Unchanged areas**

- Endpoint allowlist semantics
- B1 schema definitions
- R02 solver

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R01/BWS116-R01-report.md and cumulative Wave 01 ledger`

## BWS116-R01-008 | P2 | Response-size enforcement occurs after fetch buffering and therefore is not a transport memory bound

- **Aliases:** `none`
- **Source reports:** `BWS116-R01`
- **Source areas:** `R01`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R01`
- **Secondary areas:** `R06 generic process reliability, R11 test truth`
- **Repository severity:** `P2`
- **Normalized severity:** `P2`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

The client must cap compressed and decompressed bytes while streaming, abort before unbounded allocation, and reject bodies beyond the declared limit.

**Trigger**

The implementation obtains the complete response text/JSON before comparing its length or parsed cardinality with configured limits.

**Current behavior**

The limit is a post-buffer validation. It can reject an oversized body semantically, but only after memory and time have already been consumed.

**Expected behavior**

The client must cap compressed and decompressed bytes while streaming, abort before unbounded allocation, and reject bodies beyond the declared limit.

**Impact**

A malformed or compromised endpoint can cause excessive memory use and process termination despite a nominal response-size constant.

**Evidence**

- The production request path uses full-body Fetch API buffering before response-size validation; no bounded stream reader is present in the owned adapter.

**Current files and symbols**

- packages/bootstrap/src/adapters/betting-win-query-client.ts :: query :: L16-L29 :: 7b50ba9a6c6e0dd5486bdca723a6f6c605bd7609151e062fe72ee36100d307ae

**Source-pinned files and symbols**

- None

**Root cause**

The size control is implemented as schema/input validation rather than transport resource enforcement.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Replace full-body buffering with a bounded reader that accounts for decoded bytes, aborts immediately on overflow, and only then parses JSON. Preserve exact-body hashing from finding 004 while streaming.

**Required tests**

- Chunked body that crosses limit
- Incorrect/missing Content-Length
- Compressed expansion beyond limit
- Abort cleanup and no partial persistence

**Regression risk**

- Node Fetch stream compatibility
- Unicode byte/character accounting
- Hashing and parser integration

**Unchanged areas**

- Contract schema
- Convergence identity
- Persistent database

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R01/BWS116-R01-report.md and cumulative Wave 01 ledger`

## BWS116-R01-009 | P1 | External-runtime URL validation is lexical and does not prove the destination is non-local across all address forms

- **Aliases:** `none`
- **Source reports:** `BWS116-R01`
- **Source areas:** `R01`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R01`
- **Secondary areas:** `R10 environment/secret/path policy, R06 generic transport, R11 validators`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Accepted BWS-600 endpoints must be proven non-loopback/non-local for canonical IPv4, IPv6, mapped forms, DNS answers, redirects, and every connection attempt; credentials/userinfo must be rejected.

**Trigger**

Preflight classifies externality from URL protocol/hostname text without canonical IP parsing plus controlled resolution and redirect-target enforcement.

**Current behavior**

The guard rejects known local forms but does not establish destination-level externality for all equivalent address representations and DNS/redirect changes.

**Expected behavior**

Accepted BWS-600 endpoints must be proven non-loopback/non-local for canonical IPv4, IPv6, mapped forms, DNS answers, redirects, and every connection attempt; credentials/userinfo must be rejected.

**Impact**

A local BWS service, dashboard, metadata endpoint, or other intranet target can potentially be reached while carrying an `external`-looking URL, defeating the external-runtime evidence boundary and creating SSRF exposure.

**Evidence**

- Static URL-guard tracing finds string/URL-property checks but no connection-time destination verifier tied to resolved addresses and redirect hops.
- Focused tests enumerate canonical loopback literals but do not cover the full mapped/encoded/DNS/redirect matrix through the real client.

**Current files and symbols**

- packages/bootstrap/src/operations/external-runtime-preflight.ts :: createBwsExternalRuntimeCampaignManifest :: L248-L433 :: 724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427

**Source-pinned files and symbols**

- None

**Root cause**

Externality is treated as a configuration-string property instead of a property of each resolved connection destination.

**Cross-area dependencies**

- None

**Minimal fix boundary**

At the R01 configuration/preflight boundary, reject userinfo and unsupported schemes, canonicalize literal addresses, resolve hostnames under a bounded policy, reject loopback/link-local/private/unspecified/multicast destinations as required, and revalidate every redirect/connection. Coordinate generic networking mechanics with R10/R06 without weakening API-only holds.

**Required tests**

- IPv6 loopback
- IPv4-mapped IPv6 loopback
- integer/legacy IPv4 forms accepted by runtime
- DNS to loopback/private
- redirect to local target
- userinfo and credential-bearing URL

**Regression risk**

- DNS TOCTOU and dual-stack behavior
- Legitimate private managed-runtime deployments may need an explicit separate policy
- Proxy behavior

**Unchanged areas**

- Local fixture/export prohibition
- R02 economics
- betting-win source

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R01/BWS116-R01-report.md and cumulative Wave 01 ledger`

## BWS116-R01-010 | P1 | Source, receive, verification, import, and consumption times are not jointly enforced as distinct currentness evidence

- **Aliases:** `none`
- **Source reports:** `BWS116-R01`
- **Source areas:** `R01`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R01`
- **Secondary areas:** `R02 quote freshness semantics, R03 persistence types, R07 evidence publication`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Currentness must be a fail-closed predicate over explicitly typed clocks with bounded skew, maximum source age, receive age, and consumption age; missing or future source time must remain unknown/rejected where required.

**Trigger**

Acceptance/currentness checks rely on one timestamp or derived age and do not preserve/enforce source event time, upstream snapshot time, local receive time, verification time, import time, and downstream consumption time separately.

**Current behavior**

Recent receipt can make retained/stale data appear current, while future timestamps can reduce calculated age. The resulting provenance cannot distinguish a fresh response containing old state from genuinely current upstream state.

**Expected behavior**

Currentness must be a fail-closed predicate over explicitly typed clocks with bounded skew, maximum source age, receive age, and consumption age; missing or future source time must remain unknown/rejected where required.

**Impact**

BWS-600 or BWS-710 can promote stale or temporally impossible resources, causing surebet decisions from outdated markets/quotes while status still reports current external evidence.

**Evidence**

- Static dataflow shows multiple timestamps are either optional, defaulted, or not bound together in the acceptance receipt.
- Focused tests do not exhaust missing/blank/epoch/future/skewed source timestamps combined with fresh receive time through production preflight and convergence.

**Current files and symbols**

- packages/bootstrap/src/operations/external-runtime-preflight.ts :: createBwsExternalRuntimeCampaignManifest :: L248-L433 :: 724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427

**Source-pinned files and symbols**

- None

**Root cause**

Currentness is represented as a scalar age/status instead of a typed temporal evidence model.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Preserve all clock domains explicitly, prohibit blank/default collapse, apply bounded skew and age rules at preflight and consumption, and bind the values to immutable page receipts.

**Required tests**

- Fresh receive + stale source
- Future source time
- Missing source time
- Boundary skew
- Restart/consumption after evidence expiry

**Regression risk**

- Clock-source availability
- Compatibility with historical/replay inputs
- Time-zone/string parsing

**Unchanged areas**

- Replay/export historical acceptance when explicitly typed historical
- R02 solver
- External source code

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R01/BWS116-R01-report.md and cumulative Wave 01 ledger`

## BWS116-R02-001 | P1 | B1 complete-set acceptance proves only key cardinality, not mutually exclusive and exhaustive outcome semantics

- **Aliases:** `none`
- **Source reports:** `BWS116-R02`
- **Source areas:** `R02`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R02`
- **Secondary areas:** `R01 upstream canonical outcome authority, R04 residual/settlement simulation consumers, R11 aggregate false-green tests`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

A supported complete set must prove that its terminal outcomes are mutually exclusive, exhaustive, and mapped to the declared market shape, not merely count two or three distinct keys.

**Trigger**

Supply two distinct selection keys whose outcomeSide values are both "home" on both venues, then derive the B1 candidate.

**Current behavior**

The comparator checks 2/3 cardinality, unique selection keys, and pairwise equality of each key/side across venues. It never checks within-set semantic complementarity or exhaustiveness. Terminal scenarios are then generated one per key.

**Expected behavior**

A supported complete set must prove that its terminal outcomes are mutually exclusive, exhaustive, and mapped to the declared market shape, not merely count two or three distinct keys.

**Impact**

A duplicated or overlapping semantic outcome set can be treated as complete, allowing gross and net calculations over a portfolio that does not cover every terminal result.

**Evidence**

- The inert harness passed two unique selections with sides [home, home]; outcome-set equivalence returned ok=true and gross derivation emitted one accepted candidate.

**Current files and symbols**

- packages/bootstrap/src/identity/b1-market-equivalence.ts :: compareB1MarketOutcomeSetEquivalence / indexBySelectionEquivalence :: 141-235 :: b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75
- packages/bootstrap/src/identity/b1-market-equivalence.ts :: indexBySelectionEquivalence :: 305-326 :: b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75
- packages/bootstrap/src/identity/b1-selection-equivalence.ts :: compareB1SelectionEquivalence :: 15-51 :: ac7dcc2ddf2d9bf660931b639e10b6659ffe90ec8115ab80b765884784bc0ae2
- packages/bootstrap/src/scenarios/b1-terminal-scenario.ts :: buildB1TerminalScenarios :: 15-52 :: 4f3ee12a400f4a034a177043213f785df2c6a60f33f8cdd85a84be652401b47c

**Source-pinned files and symbols**

- None

**Root cause**

Outcome-set validity is represented as cardinality plus key uniqueness; canonical market-shape semantics are absent from the B1 complete-set gate.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Add an R02-owned market-shape outcome-set validator at the equivalence/terminal-scenario boundary. It must consume authoritative canonical outcome semantics and fail closed before quote selection. Do not change upstream canonical identity production.

**Required tests**

- Two-way home/home, away/away, yes/yes, no/no, over/over, under/under rejection tests.
- Three-way duplicate-side and missing-draw tests.
- Permutation/property tests proving exactly one terminal winner per valid market shape.

**Regression risk**

- Overly label-based fixes could reject legitimate provider aliases.
- Changes must preserve canonical selection-equivalence authority and not invent local identity.

**Unchanged areas**

- Upstream event/market identity generation
- Persistence and worker lifecycle
- Fill/rejection/settlement replay implementation

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger`

## BWS116-R02-002 | P1 | B1 market grouping and venue-pair identity omit provider and provider-generation authority

- **Aliases:** `none`
- **Source reports:** `BWS116-R02`
- **Source areas:** `R02`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R02`
- **Secondary areas:** `R01 upstream contract/provenance, R03 persisted candidate identity, R05 API/report projections, R11 validators`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Every compared quote set must preserve and verify compatible provider ID and provider-generation identity, and the selected quote evidence must retain that authority.

**Trigger**

Combine rows from generation-001 and generation-002 while holding market key, venue IDs, rules, and selection keys constant.

**Current behavior**

ProviderId and providerGenerationId are present on input rows but are not compared by the market/outcome-set equivalence functions, are not part of the venue-pair key or grouping keys, and are dropped from selected quote contributions.

**Expected behavior**

Every compared quote set must preserve and verify compatible provider ID and provider-generation identity, and the selected quote evidence must retain that authority.

**Impact**

Historical/current generations or same-named venues from different providers can be merged into one candidate, while downstream economic records cannot identify the selected generation.

**Evidence**

- The inert harness accepted an outcome set containing generation-001 and generation-002. The selected quote objects contained no providerId, providerGenerationId, lineage ID, evidence ID, or raw-payload hash.

**Current files and symbols**

- packages/bootstrap/src/contracts/b1-local-types.ts :: B1MultiVenueMarketRow provider identity fields :: 30-70 :: 22a43ced9a713e4144e343529a8940edfa00676659aa01f48f739e3f28ca03e1
- packages/bootstrap/src/identity/b1-market-equivalence.ts :: compareB1MarketEquivalence :: 43-139 :: b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75
- packages/bootstrap/src/identity/b1-market-equivalence.ts :: compareB1MarketOutcomeSetEquivalence :: 141-235 :: b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75
- packages/bootstrap/src/identity/b1-venue-pair-key.ts :: createB1VenuePairKey :: 14-50 :: 3c1f4864a055c479d758ec070804a285aa1441ad7b14418061039d45d44517fa
- packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts :: groupRowsByMarketEquivalence / groupRowsByVenue :: 318-359 :: 29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543
- packages/bootstrap/src/opportunity/b1-gross-spread.ts :: B1GrossQuoteInput / B1GrossQuoteContribution :: 10-26 :: 48ecd0e6402a23610f9582222e86e31c943948f31b6edf0896a66751edfddafb

**Source-pinned files and symbols**

- None

**Root cause**

The B1 local row contract carries provider authority, but the R02 identity composition narrows to market key plus venue string and strips generation evidence at quote selection.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Extend R02 equivalence, grouping, venue identity, and selected-quote contracts to bind provider and generation. Any definition of compatible cross-generation equivalence is an explicit R01 handoff and must not default to compatibility.

**Required tests**

- Mixed-provider and mixed-generation rejection tests.
- Same venue ID under different providers collision tests.
- Selected quote evidence retention tests.
- Permutation tests across generation partitions.

**Regression risk**

- Changing candidate identity may affect persisted keys and report joins owned by R03/R05.
- Do not rewrite upstream provider-generation semantics locally.

**Unchanged areas**

- Upstream provider-generation production
- External API currentness gate
- Execution remains prohibited

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger`

## BWS116-R02-003 | P1 | B1 synchronization is pair-local and can combine terminal outcomes outside the configured global quote window

- **Aliases:** `none`
- **Source reports:** `BWS116-R02`
- **Source areas:** `R02`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R02`
- **Secondary areas:** `R01 source-time authority, R04 backtest currentness interpretation, R07 evidence reporting, R11 false-green tests`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

The complete selected terminal-outcome portfolio must be inside one explicit synchronization window, and the reported window must represent the actual selected-quote span.

**Trigger**

Use two outcome pairs with zero intra-pair skew but a 10,000 ms skew between the selected outcomes under maxComparisonWindowMs=100.

**Current behavior**

The code validates each selection pair separately, then reports the maximum intra-pair delta. It never compares selected quote timestamps across terminal outcomes and takes comparisonTimeUtc from the first pair.

**Expected behavior**

The complete selected terminal-outcome portfolio must be inside one explicit synchronization window, and the reported window must represent the actual selected-quote span.

**Impact**

A candidate can combine asynchronous terminal prices and report maxComparisonWindowMs=0 even though the selected portfolio spans seconds, creating stale-combination false positives.

**Evidence**

- Harness result: configured window 100 ms; pair windows [0,0]; selected-outcome snapshot span 10,000 ms; candidate accepted and reported window 0 ms.

**Current files and symbols**

- packages/bootstrap/src/quotes/b1-quote-synchronization.ts :: synchronizeB1VenueQuotePair :: 41-86 :: 4746d1bd364a7389a95b4aa912e66f66041c44fc51083dcd02a12e9ad1fa9bde
- packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts :: deriveVenuePairGrossCandidate :: 166-216 :: 29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543
- packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts :: acceptedCandidate :: 238-273 :: 29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543
- packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts :: maxComparisonWindow :: 437-445 :: 29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543

**Source-pinned files and symbols**

- None

**Root cause**

Synchronization scope is selection-pair local rather than candidate-global.

**Cross-area dependencies**

- None

**Minimal fix boundary**

After best-quote selection, compute and enforce one candidate-global min/max snapshot span and bind comparison time/age evidence to every selected quote.

**Required tests**

- Two- and three-way cross-outcome skew tests.
- Boundary tests at window-1, window, and window+1.
- Permutation tests proving identical global span and decision.

**Regression risk**

- A global gate can reduce candidate counts; metrics and fixtures must be updated truthfully.
- Do not replace source time with retrieval time.

**Unchanged areas**

- Per-row future and age validation
- Provider intake timing semantics
- Runtime scheduler behavior

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger`

## BWS116-R02-004 | P1 | B1 net economics accepts selected odds that are not value-bound to synchronized quote evidence

- **Aliases:** `none`
- **Source reports:** `BWS116-R02`
- **Source areas:** `R02`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R02`
- **Secondary areas:** `R01 provenance binding, R03 stored gross candidate immutability, R11 contract mutation tests`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Net payout values must be derived from, or exactly value-bound to, the synchronized source row selected during gross derivation.

**Trigger**

Replace selectedQuotes decimalOddsMicro values 2,200,000 with 3,000,000 while leaving synchronized source rows at 2.18/2.20.

**Current behavior**

Shape validation checks selected quote field types. findSelectedSynchronizedQuote matches only selectionEquivalenceKey and venueOrBookmakerId. Net payout then uses the detached selected quote decimalOddsMicro without comparing it to synchronized row odds or source evidence.

**Expected behavior**

Net payout values must be derived from, or exactly value-bound to, the synchronized source row selected during gross derivation.

**Impact**

A forged, stale, or accidentally recomputed selected quote can inflate payout and pass positive worst-case net while the retained synchronization evidence proves different prices.

**Evidence**

- The harness changed only detached selectedQuotes odds to 3.0; synchronized rows stayed 2.18/2.20; evaluateB1NetEconomics returned ok=true with worstCaseNetMinor=100.

**Current files and symbols**

- packages/bootstrap/src/opportunity/b1-gross-spread.ts :: B1GrossQuoteContribution :: 18-26 :: 48ecd0e6402a23610f9582222e86e31c943948f31b6edf0896a66751edfddafb
- packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts :: selected quote projection :: 210-216 :: 29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543
- packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts :: acceptedCandidate selectedQuotes/synchronizedQuotePairs :: 252-272 :: 29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543
- packages/bootstrap/src/economics/b1-net-spread.ts :: evaluateB1NetEconomics :: 119-167 :: 0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b
- packages/bootstrap/src/economics/b1-net-spread.ts :: validateAcceptedB1GrossCandidateShape / findSelectedSynchronizedQuote :: 275-369 :: 0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b

**Source-pinned files and symbols**

- None

**Root cause**

The accepted-gross contract duplicates economic values without an immutable value/evidence binding, and the net gate verifies identity keys only.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Derive net odds directly from the matched synchronized row or bind selected quote values to an immutable row/evidence digest and verify all value, provider-generation, time, side, and outcome fields.

**Required tests**

- Detached-odds mutation rejection.
- OutcomeName/outcomeSide mutation rejection.
- Provider-generation/evidence/time mutation rejection.
- Exact derivation-to-net round-trip tests.

**Regression risk**

- Contract changes affect test builders and downstream report serializers.
- Avoid trusting caller-provided digests without recomputation.

**Unchanged areas**

- Gross reciprocal formula
- Fee and capital-lock arithmetic
- Runtime execution path

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger`

## BWS116-R02-005 | P1 | B1 integrated solver and net path is not bound to quote capacity or venue-limit decisions

- **Aliases:** `none`
- **Source reports:** `BWS116-R02`
- **Source areas:** `R02`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R02`
- **Secondary areas:** `R03 capacity evidence persistence, R04 fillability simulation, R07 acceptance metrics, R11 integration validators`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Every accepted stake and net candidate must be derived from explicit capacity and venue-limit decisions bound to the selected source rows.

**Trigger**

Solve/evaluate stakes of 100 minor units for a selected quote whose availableSizeMinor is 1, without invoking the separate capacity primitive.

**Current behavior**

The backtest plan accepts caller-authored solver constraints and no capacity/venue-limit evidence. The solver and net evaluator never invoke evaluateB1QuoteCapacity. The standalone capacity primitive is used only in focused unit tests.

**Expected behavior**

Every accepted stake and net candidate must be derived from explicit capacity and venue-limit decisions bound to the selected source rows.

**Impact**

A candidate can be labeled net-positive despite being unfillable at the quote depth or violating the venue cap; capacity and limit blocker counts can be false.

**Evidence**

- Harness result: net evaluation accepted stake 100 with worstCaseNetMinor=20 against selected availableSizeMinor=1. Calling evaluateB1QuoteCapacity on the same row correctly returned B1_CAPACITY_OR_LIMIT_INSUFFICIENT.

**Current files and symbols**

- packages/bootstrap/src/quotes/b1-capacity-model.ts :: B1CapacityPolicy / B1CapacityDecision / evaluateB1QuoteCapacity :: 11-31 :: 6a98bd374fff19cd414d04fc3410ad944b234043733d8f258a383537e0a28617
- packages/bootstrap/src/quotes/b1-capacity-model.ts :: capacity enforcement :: 70-118 :: 6a98bd374fff19cd414d04fc3410ad944b234043733d8f258a383537e0a28617
- packages/bootstrap/src/solver/b1-generalized-stake-vector.ts :: B1GeneralizedStakeVectorPolicy :: 28-41 :: 822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0
- packages/bootstrap/src/economics/b1-net-spread.ts :: B1NetEconomicsPolicy / evaluateB1NetEconomics :: 31-41 :: 0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b
- packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts :: B1CrossVenueBacktestPlan :: 20-29 :: b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4
- packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts :: runCandidateBacktest :: 387-400 :: b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4

**Source-pinned files and symbols**

- None

**Root cause**

Capacity and venue-limit validation are disconnected primitives rather than authoritative inputs to stake-policy construction and net acceptance.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Introduce one R02 integration boundary that derives each leg max/min/step from selected quote capacity plus normalized venue limits and carries the resulting decisions through solver and net acceptance. Persistence changes belong to R03.

**Required tests**

- End-to-end quote-depth-to-solver constraint tests.
- Stake above quote, venue, market, and portfolio cap rejection tests.
- Missing capacity/proxy and missing venue-limit tests.
- Capacity changes after selection must invalidate the candidate.

**Regression risk**

- Existing backtest plans and fixtures contain synthetic max values and will need explicit evidence.
- Do not allow an operator cap to exceed observed depth.

**Unchanged areas**

- Standalone capacity arithmetic
- Venue-limit normalization
- Fill/rejection lifecycle after stake acceptance

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger`

## BWS116-R02-006 | P1 | B1 generalized solver can reject feasible two-way and three-way integer stake vectors

- **Aliases:** `none`
- **Source reports:** `BWS116-R02`
- **Source areas:** `R02`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R02`
- **Secondary areas:** `R04 backtest classification, R07 falsification metrics, R11 property-test coverage`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

The solver must return any deterministic feasible integer vector satisfying min/max/step and target worst-case net, even when terminal payouts are unequal.

**Trigger**

Two-way: odds [1.5,4.0], caps [(1,2,1),(1,1,1)], target worst-case 0. Three-way: odds [2.5,2.5,6.0], caps [(1,2,1),(1,2,1),(1,1,1)], target 0.

**Current behavior**

The algorithm searches a single common target payout and rounds every leg up to reach it. If one leg cannot reach that common target it returns CAPACITY_EXHAUSTED without exploring feasible unequal-payout vectors.

**Expected behavior**

The solver must return any deterministic feasible integer vector satisfying min/max/step and target worst-case net, even when terminal payouts are unequal.

**Impact**

Valid candidates can be falsely classified infeasible, suppressing B1 observations and distorting falsification, capacity, and conversion metrics.

**Evidence**

- Independent exhaustive enumeration found [2,1] with payouts [3,4], nets [0,1], and [2,2,1] with payouts [5,5,6], nets [0,0,1]. The production function returned B1_STAKE_VECTOR_CAPACITY_EXHAUSTED for both. The two-way oracle examined 1,317 cases before the retained sample; the three-way oracle examined 12,163 cases and found no false-feasible result in its domain.

**Current files and symbols**

- packages/bootstrap/src/solver/b1-generalized-stake-vector.ts :: solveB1GeneralizedStakeVector target search :: 147-225 :: 822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0
- packages/bootstrap/src/solver/b1-generalized-stake-vector.ts :: initialTargetPayout / maxTargetPayout :: 349-380 :: 822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0
- packages/bootstrap/src/solver/b1-generalized-stake-vector.ts :: buildStakesForTargetPayout :: 382-445 :: 822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0
- packages/bootstrap/src/solver/b1-generalized-stake-vector.ts :: calculateScenarioNets :: 447-469 :: 822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0

**Source-pinned files and symbols**

- None

**Root cause**

Common-target-payout construction is used as if it were a complete feasibility search, but it is only one sufficient family of vectors.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Replace or augment the R02 search with a complete bounded integer feasibility/optimization method for the declared two- and three-leg domains. Preserve deterministic objective and explicit search bounds.

**Required tests**

- Brute-force oracle comparison over small domains for 2-way and 3-way cases.
- Unequal payout feasibility cases.
- Positive target-net, one-unit residual, tight cap, and non-unit step cases.
- Metamorphic scaling and permutation tests.
- Proof that returned vectors satisfy all constraints.

**Regression risk**

- A complete search may cost more; bounds and failure typing must remain explicit.
- Changing objective/tie-breaking can alter historical fixtures and reports.

**Unchanged areas**

- Scenario payout formula
- Capacity evidence integration finding BWS116-R02-005
- Live execution remains parked

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger`

## BWS116-R02-007 | P1 | Unescaped delimiter-based composite keys collide for distinct B1 identities and constraints

- **Aliases:** `none`
- **Source reports:** `BWS116-R02`
- **Source areas:** `R02`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R02`
- **Secondary areas:** `R01 input character contract, R03 persisted key migration, R05 API identifiers, R11 property tests`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Distinct typed tuples must have distinct deterministic encodings for keys, duplicate checks, candidate IDs, and scenario legs.

**Trigger**

Construct venue tuples ("a", "b::c") and ("a::b", "c"), or fee tuples split around a NUL character.

**Current behavior**

Keys are built by raw concatenation with ::, |, or NUL. Input validation requires non-empty strings but permits these delimiter characters.

**Expected behavior**

Distinct typed tuples must have distinct deterministic encodings for keys, duplicate checks, candidate IDs, and scenario legs.

**Impact**

Distinct venues/selections can alias, causing candidate identity collisions, false duplicate rejection, incorrect joins, or scenario-leg overwrites.

**Evidence**

- Harness result: both venue tuples produced a::b::c. Two distinct fee tuples collapsed to one NUL-delimited key and were rejected as B1_FEE_MATRIX_DUPLICATE_ENTRY.

**Current files and symbols**

- packages/bootstrap/src/identity/b1-venue-pair-key.ts :: createB1VenuePairKey :: 35-50 :: 3c1f4864a055c479d758ec070804a285aa1441ad7b14418061039d45d44517fa
- packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts :: buildCandidateId / buildVenuePairKeyForRows :: 376-405 :: 29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543
- packages/bootstrap/src/economics/b1-fee-matrix.ts :: normalizeB1FeeMatrix duplicate key :: 102-117 :: 081e148be8c1e3ffce089cca44c14cb16fa94ee25ae06a320d422b23e9e37175
- packages/bootstrap/src/solver/b1-generalized-stake-vector.ts :: constraint-key construction and duplicate detection :: 292-326 :: 822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0
- packages/bootstrap/src/solver/b1-generalized-stake-vector.ts :: buildConstraintKey :: 512-514 :: 822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0
- packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts :: buildB1ScenarioLegKey :: 400-402 :: f48a4d0f697fcc2d9d48328ef665689807f3f97d6c74fbcba67b01520293a580

**Source-pinned files and symbols**

- None

**Root cause**

Composite identity uses ambiguous delimiter serialization instead of a canonical injective tuple encoding.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Use one canonical structured/length-prefixed tuple encoder for all R02 keys or reject reserved characters at the authoritative parser. Coordinate persisted-key migrations with R03 rather than changing storage silently.

**Required tests**

- Delimiter injection for every key constructor.
- Round-trip/injectivity property tests over Unicode and control characters.
- Cross-module consistency tests for candidate, constraint, fee, and scenario keys.

**Regression risk**

- Changing key encoding affects persisted records, fixtures, and APIs.
- Unicode normalization policy must be explicit rather than incidental.

**Unchanged areas**

- Canonical upstream IDs themselves
- Provider connectivity
- Economic formulas

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger`

## BWS116-R02-008 | P1 | B1 line equivalence compares raw decimal text and rejects numerically identical markets

- **Aliases:** `none`
- **Source reports:** `BWS116-R02`
- **Source areas:** `R02`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R02`
- **Secondary areas:** `R01 upstream line contract, R09-equivalent numeric semantics within BWS scope, R03 key persistence`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Line equality must use one canonical fixed-point numeric representation with explicit scale and sign normalization.

**Trigger**

Compare otherwise identical spread/total rows using lineValue "1" and "1.0".

**Current behavior**

The parser validates syntax but preserves raw text; equivalence uses strict string equality.

**Expected behavior**

Line equality must use one canonical fixed-point numeric representation with explicit scale and sign normalization.

**Impact**

Equivalent markets are falsely blocked, reducing coverage and making results dependent on upstream formatting rather than value.

**Evidence**

- The inert harness returned B1_LINE_VALUE_MISMATCH for "1" versus "1.0".

**Current files and symbols**

- packages/bootstrap/src/contracts/betting-win-b1-resource-records.ts :: line_value parse :: 386-397 :: 2068f5dea3a115cbbc4e7b7fde16774b9a0fc9c964be1550215cc2c7508604e8
- packages/bootstrap/src/contracts/betting-win-b1-resource-records.ts :: requireSignedDecimalString :: 611-620 :: 2068f5dea3a115cbbc4e7b7fde16774b9a0fc9c964be1550215cc2c7508604e8
- packages/bootstrap/src/identity/b1-market-equivalence.ts :: compareB1MarketEquivalence line comparison :: 82-87 :: b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75
- packages/bootstrap/src/identity/b1-market-equivalence.ts :: compareOutcomeSetMarketContext line comparison :: 274-279 :: b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75

**Source-pinned files and symbols**

- None

**Root cause**

No canonical numeric line representation is established before identity comparison.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Normalize line values to a bounded signed fixed-point tuple at intake or R02 comparison. R01 owns any upstream contract change; R02 owns numeric equality and key consumption.

**Required tests**

- Equivalent textual forms tests.
- Negative-zero normalization.
- Scale/precision overflow and unsupported precision tests.
- Spread sign/viewpoint inversion tests.

**Regression risk**

- Incorrect sign normalization can merge opposite spread viewpoints.
- Canonical scale changes can affect persisted keys.

**Unchanged areas**

- Market type/period/rule checks
- Raw upstream archival bytes
- Settlement replay

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger`

## BWS116-R02-009 | P1 | Standard-binary complete-set assembly can mix YES and NO quotes from different source manifests

- **Aliases:** `none`
- **Source reports:** `BWS116-R02`
- **Source areas:** `R02`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R02`
- **Secondary areas:** `R01 upstream provenance, R03 stored standard candidate identity, R11 fixture integrity`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

All legs in one complete-set snapshot must be bound to one compatible source manifest or an explicit multi-source synchronization/provenance receipt.

**Trigger**

Assemble a complete set with manifest hash a...a for YES and b...b for NO.

**Current behavior**

The quote contract carries quoteSourceManifestHash, but assembly checks only market ID, outcome uniqueness, and currency. The accepted complete set does not expose a quote-manifest identity.

**Expected behavior**

All legs in one complete-set snapshot must be bound to one compatible source manifest or an explicit multi-source synchronization/provenance receipt.

**Impact**

Quotes from different snapshots or source lineages can be combined into a false complete set while the output advertises only the identity-record provider generation.

**Evidence**

- Harness result: mixed 64-byte manifest hashes were accepted; output providerGeneration remained generation-s and did not disclose the mixed quote sources.

**Current files and symbols**

- packages/bootstrap/src/contracts/betting-win-resource-records.ts :: BettingWinQuoteRecord :: 31-40 :: 8ca3a040b691242eb1025ab74f545157c1072b85332fdc1313924e57396c6903
- packages/bootstrap/src/scenarios/complete-set.ts :: quote assembly and acceptance :: 112-184 :: bdea2ee4db048e553d69f379ab4599c28bae68e372b2821bacb2a64611c98bac

**Source-pinned files and symbols**

- None

**Root cause**

Quote provenance is available but omitted from complete-set coherence and output identity.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Require exact compatible quote-manifest binding during standard complete-set assembly and retain the accepted source identity in the complete-set contract.

**Required tests**

- Mixed-manifest rejection.
- Missing/unknown manifest rejection.
- Single-manifest round trip.
- Explicit synchronization receipt path only if separately authorized.

**Regression risk**

- Historical fixture bundles may intentionally contain multiple manifests and will need explicit partitioning.
- Do not infer compatibility from provider generation alone.

**Unchanged areas**

- Rule and settlement identity checks
- B1 generation finding BWS116-R02-002
- Runtime API access

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger`

## BWS116-R02-010 | P1 | Standard-binary quote freshness is per leg and permits an asynchronous YES/NO snapshot

- **Aliases:** `none`
- **Source reports:** `BWS116-R02`
- **Source areas:** `R02`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R02`
- **Secondary areas:** `R01 source-time authority, R04 standard backtest timing, R11 test coverage`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

The two terminal quotes must satisfy an explicit same-snapshot or bounded pairwise synchronization rule in addition to individual freshness.

**Trigger**

Evaluate one quote aged 59,999 ms and one current quote under a 60,000 ms age threshold.

**Current behavior**

The standard solver checks each quote independently against observedNowMs and never compares the two observedAt timestamps.

**Expected behavior**

The two terminal quotes must satisfy an explicit same-snapshot or bounded pairwise synchronization rule in addition to individual freshness.

**Impact**

Non-simultaneous YES/NO prices can be combined, creating false gross/stake feasibility and misleading paper results.

**Evidence**

- Harness result: the pair spanning 59,999 ms was accepted; no pairwise synchronization policy exists in the standard input.

**Current files and symbols**

- packages/bootstrap/src/opportunity/standard-binary-stake-solver.ts :: StandardBinaryStakeVectorSolveOptions / freshness default :: 13-45 :: a68d4ea89b2ec4a7d83d8e2ced929732522e0e4af5a36efaac4712e88255dc92
- packages/bootstrap/src/opportunity/standard-binary-stake-solver.ts :: validateCompleteSetQuoteFreshness :: 110-124 :: a68d4ea89b2ec4a7d83d8e2ced929732522e0e4af5a36efaac4712e88255dc92
- packages/bootstrap/src/quotes/quote-freshness.ts :: checkQuoteFreshness :: 10-33 :: 38a0042d488084145e2438fe30d9e5b0ed665733af97b561587ca78d5bb9718f

**Source-pinned files and symbols**

- None

**Root cause**

Freshness and synchronization are conflated; only age-to-now is modeled.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Add an explicit standard-binary pair synchronization bound and report actual snapshot span. Preserve individual freshness as a separate check.

**Required tests**

- Pair-skew boundary tests.
- Individually fresh but mutually stale rejection.
- Same manifest with divergent timestamps.
- Permutation invariance.

**Regression risk**

- Candidate counts will decline when asynchronous snapshots are rejected.
- Do not reuse the B1 pair primitive without reconciling standard source semantics.

**Unchanged areas**

- Canonical timestamp parsing
- Individual future/stale rejection
- B1 global synchronization finding BWS116-R02-003

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger`

## BWS116-R02-011 | P1 | Standard-binary quote contract omits stake increment and silently substitutes minimum stake as the rounding step

- **Aliases:** `none`
- **Source reports:** `BWS116-R02`
- **Source areas:** `R02`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R02`
- **Secondary areas:** `R01 upstream quote contract, R03 persisted quote schema, R11 fixture/test updates`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Minimum stake, maximum/depth, and increment must be independent explicit values bound to quote/venue authority.

**Trigger**

Build the standard stake-vector input for quotes with minStakeMinor=10; the derived step is automatically 10 regardless of the actual venue increment.

**Current behavior**

The standard quote type has no increment. deriveRoundingConstraints sets stepMinor equal to minStakeMinor and describes the minimum as a rounding step.

**Expected behavior**

Minimum stake, maximum/depth, and increment must be independent explicit values bound to quote/venue authority.

**Impact**

The solver can reject feasible stakes, accept invalid increments, or compute the wrong vector whenever min and step differ.

**Evidence**

- Harness result: both derived steps were 10 solely because minStakeMinor was 10; the quote object had no explicit step field.

**Current files and symbols**

- packages/bootstrap/src/contracts/betting-win-resource-records.ts :: BettingWinQuoteRecord :: 31-40 :: 8ca3a040b691242eb1025ab74f545157c1072b85332fdc1313924e57396c6903
- packages/bootstrap/src/opportunity/standard-binary-stake-solver.ts :: deriveRoundingConstraints :: 209-238 :: a68d4ea89b2ec4a7d83d8e2ced929732522e0e4af5a36efaac4712e88255dc92
- packages/bootstrap/src/solver/stake-vector.ts :: StakeVectorRoundingConstraint :: 5-14 :: d5022b515bbac8672ed337933887276d590424c89b75c3e5acd290f3a5561029

**Source-pinned files and symbols**

- None

**Root cause**

The standard data contract collapses two independent venue constraints into one field.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Extend the standard quote/depth contract with an explicit bounded increment and derive rounding constraints from it. Upstream schema ownership is an R01 handoff; solver consumption is R02.

**Required tests**

- min != step cases.
- min not divisible by step cases.
- step greater/less than min.
- Capacity boundary after rounding.
- Missing increment fail-closed test.

**Regression risk**

- Schema and fixture changes cross the upstream contract boundary.
- The increment origin convention must be explicit.

**Unchanged areas**

- Available-size capacity calculation
- B1 explicit stakeStepMinor contract
- No-live-operation boundary

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger`

## BWS116-R02-012 | P1 | Standard scenario cash-flow validator accepts incomplete and non-rectangular matrices

- **Aliases:** `none`
- **Source reports:** `BWS116-R02`
- **Source areas:** `R02`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R02`
- **Secondary areas:** `R04 simulation consumers, R11 validator false-green coverage`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

A matrix validator must prove the full scenario-by-leg rectangle, stable stake/cost terms, unique cells, and complete terminal winner coverage.

**Trigger**

Pass two rows, one for each scenario, both using the same leg ID.

**Current behavior**

The exported validator checks row shape and distinct scenario IDs only. It does not check leg cardinality, unique scenario-leg cells, or every leg in every scenario. The solver adds one later leg-count check, but the validator itself returns accepted.

**Expected behavior**

A matrix validator must prove the full scenario-by-leg rectangle, stable stake/cost terms, unique cells, and complete terminal winner coverage.

**Impact**

Other callers can trust an invalid matrix, and tests/validators can falsely certify complete terminal cash-flow coverage.

**Evidence**

- The adversarial harness supplied two rows covering YES-wins and NO-wins but only one distinct leg; validateScenarioCashflowMatrix returned ok=true.

**Current files and symbols**

- packages/bootstrap/src/scenarios/scenario-cashflow.ts :: validateScenarioCashflowMatrix :: 15-62 :: 11c1608a8d1cb5341f6125b9a30af4afd7c22aac64e228545636446b38476228
- packages/bootstrap/src/scenarios/scenario-cashflow.ts :: validateScenarioCoverage :: 218-240 :: 11c1608a8d1cb5341f6125b9a30af4afd7c22aac64e228545636446b38476228
- packages/bootstrap/src/solver/stake-vector.ts :: solver post-validation shape checks :: 73-88 :: d5022b515bbac8672ed337933887276d590424c89b75c3e5acd290f3a5561029

**Source-pinned files and symbols**

- None

**Root cause**

Scenario coverage is validated independently of leg coverage and matrix rectangularity.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Strengthen the R02 matrix validator to require unique scenario-leg cells, the complete leg set in every scenario, stable leg terms, and one coherent winner. Keep lifecycle simulation semantics in R04.

**Required tests**

- One-leg/two-scenario rejection.
- Duplicate cell and missing cell tests.
- Extra leg/scenario rejection.
- Permutation and rectangularity property tests.

**Regression risk**

- Stricter validation may expose malformed retained fixtures.
- Do not duplicate B1-specific matrix logic inconsistently.

**Unchanged areas**

- Standard complete-set assembly
- B1 matrix validator, which already checks rectangularity more strongly
- Persistence

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger`

## BWS116-R02-013 | P1 | Locale-sensitive localeCompare calls make candidate, scenario, and solver ordering environment-dependent

- **Aliases:** `none`
- **Source reports:** `BWS116-R02`
- **Source areas:** `R02`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R02`
- **Secondary areas:** `R03 persisted ordering assumptions, R05 API ordering, R11 deterministic validation`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Deterministic strategy output must use one locale-independent byte/code-point ordering contract.

**Trigger**

Sort selection keys ["a", "ä", "z"] under en_US.UTF-8 and sv_SE.UTF-8.

**Current behavior**

Multiple R02 paths use String.localeCompare without an explicit locale/options. The host locale controls order.

**Expected behavior**

Deterministic strategy output must use one locale-independent byte/code-point ordering contract.

**Impact**

Candidate order, stake order, scenario order, serialized hashes, and tie outcomes can differ across environments despite identical inputs.

**Evidence**

- The same harness produced [a, ä, z] under en-US and [a, z, ä] under sv-SE.

**Current files and symbols**

- packages/bootstrap/src/opportunity/standard-binary-derivation.ts :: deriveStandardBinaryOpportunityCandidates ordering :: 27-41 :: 04059b7cd11e946fd8f997d215732e514b5d03cf9faaf9ba86bb42910f25d653
- packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts :: sortRowsBySelection / sortedEntries :: 362-374 :: 29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543
- packages/bootstrap/src/scenarios/b1-terminal-scenario.ts :: compareSelectedQuotes :: 55-60 :: 4f3ee12a400f4a034a177043213f785df2c6a60f33f8cdd85a84be652401b47c
- packages/bootstrap/src/solver/b1-generalized-stake-vector.ts :: compareCandidateQuotes :: 526-535 :: 822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0
- packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts :: compareCashflowRows / compareLegTerms :: 380-397 :: f48a4d0f697fcc2d9d48328ef665689807f3f97d6c74fbcba67b01520293a580

**Source-pinned files and symbols**

- None

**Root cause**

Determinism depends on ambient ICU collation rather than a repository-defined comparator.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Replace localeCompare with one canonical locale-independent comparator and apply it consistently to keys, tuples, scenarios, and tie-breaks.

**Required tests**

- Cross-locale golden tests.
- Unicode normalization and code-unit ordering property tests.
- Input permutation determinism tests.
- Stable serialized artifact hash tests.

**Regression risk**

- Ordering changes can alter retained artifacts and snapshots.
- Do not silently normalize Unicode unless the identity contract authorizes it.

**Unchanged areas**

- Economic values
- Canonical key contents
- Runtime execution hold

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger`

## BWS116-R02-014 | P1 | B1 fee matrix cannot represent scenario-conditional or non-stake fee bases accepted by its venue-type domain

- **Aliases:** `none`
- **Source reports:** `BWS116-R02`
- **Source areas:** `R02`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R02`
- **Secondary areas:** `R01 provider fee contract/currentness, R04 terminal simulation, R07 net-metric evidence, R11 independent oracle tests`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Fee authority must declare basis, side/role, condition, rounding, minimum/maximum, and version so each terminal scenario is charged correctly.

**Trigger**

Model a 2% commission on positive winnings at odds 3.0 and stake 100.

**Current behavior**

The only model is feeBps on stake plus fixedFeeMinor, keyed by venue and selection. The charge is computed before scenarios and subtracted from every scenario. Venue type is not consulted and no alternative basis can be represented.

**Expected behavior**

Fee authority must declare basis, side/role, condition, rounding, minimum/maximum, and version so each terminal scenario is charged correctly.

**Impact**

Net spread can be over- or understated, particularly for exchange commission and conditional fees; an unknown fee shape can still be encoded as if it were stake-based and accepted.

**Evidence**

- For 2% commission on positive winnings, correct fee at stake 100 and odds 3.0 is 4 only in the winning scenario. Current code can only charge ceil(100*200/10000)=2 plus fixed, unconditionally. No parameterization can express the correct function.

**Current files and symbols**

- packages/bootstrap/src/contracts/b1-local-types.ts :: B1VenueType / B1MultiVenueMarketRow :: 10-12 :: 22a43ced9a713e4144e343529a8940edfa00676659aa01f48f739e3f28ca03e1
- packages/bootstrap/src/economics/b1-fee-matrix.ts :: B1FeeMatrixEntry / B1FeeCharge :: 7-25 :: 081e148be8c1e3ffce089cca44c14cb16fa94ee25ae06a320d422b23e9e37175
- packages/bootstrap/src/economics/b1-fee-matrix.ts :: calculateB1FeeCharge :: 27-83 :: 081e148be8c1e3ffce089cca44c14cb16fa94ee25ae06a320d422b23e9e37175
- packages/bootstrap/src/economics/b1-net-spread.ts :: fee application and scenario totals :: 119-188 :: 0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b

**Source-pinned files and symbols**

- None

**Root cause**

Fee semantics are collapsed to one unconditional stake-percentage formula despite a heterogeneous venue domain.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Define versioned fee-basis unions and scenario-dependent fee cash flows in R02. Current provider-specific fee authority remains an R01 external-input requirement; do not guess venue schedules.

**Required tests**

- Stake, payout, profit, liability, maker/taker, fixed, minimum, maximum, and conditional fee cases.
- Scenario-only charge tests.
- Unknown fee basis must block.
- Independent cash-flow oracle tests.

**Regression risk**

- Incorrect generalization can double-charge or omit fees.
- Provider fee schedules are external authority and may change.

**Unchanged areas**

- Current simple stake-bps arithmetic for explicitly compatible venues
- Capital-lock formula
- Provider access remains prohibited

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger`

## BWS116-R03-001 | P0 | Migration discovery can escape the repository and the SQL scope scanner admits cross-schema executable DDL

- **Aliases:** `KNOWN_BASELINE_MANIFEST_DRIFT is unrelated`
- **Source reports:** `BWS116-R03`
- **Source areas:** `R03`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R03`
- **Secondary areas:** `R08, R10, R11`
- **Repository severity:** `P0`
- **Normalized severity:** `P0`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Migration bytes must come only from the realpath-confined repository database/migrations/surebet directory, and database-level authority must make writes outside surebet.* impossible.

**Trigger**

Load an absolute or traversal-resolved migration directory containing CREATE FUNCTION public.*, or a DO block that dynamically creates a public object, then pass the returned migrations to the normal application path.

**Current behavior**

Absolute and ../ migration directories are accepted. Cross-schema CREATE FUNCTION and dynamic DO SQL are accepted by the scanner. applySurebetMigrations would submit those bytes to psql.

**Expected behavior**

Migration bytes must come only from the realpath-confined repository database/migrations/surebet directory, and database-level authority must make writes outside surebet.* impossible.

**Impact**

A migration invocation can execute cross-schema DDL or other unreviewed SQL. This is a direct schema-ownership escape and meets the P0 taxonomy even though the 12 supplied migrations are currently confined.

**Evidence**

- A
- n
-
- i
- n
- e
- r
- t
-
- e
- x
- t
- e
- r
- n
- a
- l
-
- N
- o
- d
- e
-
- h
- a
- r
- n
- e
- s
- s
-
- c
- a
- l
- l
- e
- d
-
- o
- n
- l
- y
-
- l
- o
- a
- d
- S
- u
- r
- e
- b
- e
- t
- M
- i
- g
- r
- a
- t
- i
- o
- n
- F
- i
- l
- e
- s
- .
-
- I
- t
-
- a
- c
- c
- e
- p
- t
- e
- d
-
- a
- n
-
- a
- b
- s
- o
- l
- u
- t
- e
-
- d
- i
- r
- e
- c
- t
- o
- r
- y
- ,
-
- a
-
- t
- r
- a
- v
- e
- r
- s
- a
- l
-
- d
- i
- r
- e
- c
- t
- o
- r
- y
- ,
-
- C
- R
- E
- A
- T
- E
-
- F
- U
- N
- C
- T
- I
- O
- N
-
- p
- u
- b
- l
- i
- c
- .
- r
- 0
- 3
- _
- e
- s
- c
- a
- p
- e
- (
- )
- ,
-
- a
- n
- d
-
- a
-
- d
- y
- n
- a
- m
- i
- c
-
- D
- O
-
- b
- l
- o
- c
- k
- .
-
- N
- o
-
- S
- Q
- L
-
- o
- r
-
- d
- a
- t
- a
- b
- a
- s
- e
-
- c
- o
- m
- m
- a
- n
- d
-
- w
- a
- s
-
- e
- x
- e
- c
- u
- t
- e
- d
- .

**Current files and symbols**

- packages/persistence/src/psql.ts :: loadSurebetMigrationFiles :: 94-153 :: 86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343
- packages/persistence/src/psql.ts :: SUREBET_MIGRATION_TARGET_PATTERNS / assertSurebetOnlyMigrationSql :: 14-43; 219-265 :: 86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343
- packages/persistence/src/migrations.ts :: applySurebetMigrations :: 41-90 :: 2ae8d8e9d9cdb6c08003371083c2065dd803ad5d82258f5be3166a17da01f57b

**Source-pinned files and symbols**

- None

**Root cause**

Migration authority is enforced by incomplete lexical matching and caller-selected filesystem paths rather than a fixed, realpath-confined source plus a database role restricted to surebet.*.

**Cross-area dependencies**

- KNOWN_BASELINE_MANIFEST_DRIFT is unrelated

**Minimal fix boundary**

Confine the migration directory by realpath against the repository root, reject symlink and traversal escapes, remove ordinary caller override from production entrypoints, replace the incomplete regex as the security boundary, and require a database role whose privileges cannot create or mutate objects outside surebet.*.

**Required tests**

- Absolute-path and ../ traversal rejection
- Symlink escape rejection
- CREATE FUNCTION/PROCEDURE/TRIGGER/TYPE/EXTENSION and GRANT/REVOKE rejection
- DO and dynamic SQL rejection
- Disposable PostgreSQL proof that the migration role cannot write outside surebet.*

**Regression risk**

- Legitimate future migration syntax may require an explicit reviewed allowlist update
- Tightening the database role can expose undocumented cross-schema assumptions

**Unchanged areas**

- The 12 migration files in the frozen archive remain byte-unchanged and presently reference surebet.* objects only
- No migration was applied

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger`

## BWS116-R03-002 | P1 | The migration-status read path creates schema objects before reporting status

- **Aliases:** `none`
- **Source reports:** `BWS116-R03`
- **Source areas:** `R03`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R03`
- **Secondary areas:** `R08, R11`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Status must report schema and ledger absence without creating either object.

**Trigger**

Run the migration-status operation.

**Current behavior**

The status path runs bootstrap DDL first, so an empty database is changed before status is calculated.

**Expected behavior**

Status must report schema and ledger absence without creating either object.

**Impact**

A read-only diagnostic can alter a database, manufacture the ownership state it is supposed to observe, require write privileges, and mask the distinction between never-initialized and initialized-with-no-migrations.

**Evidence**

- T
- h
- e
-
- c
- a
- l
- l
-
- g
- r
- a
- p
- h
-
- i
- s
-
- d
- i
- r
- e
- c
- t
- :
-
- g
- e
- t
- B
- w
- s
- D
- a
- t
- a
- b
- a
- s
- e
- M
- i
- g
- r
- a
- t
- i
- o
- n
- S
- t
- a
- t
- u
- s
-
- -
- >
-
- l
- i
- s
- t
- A
- p
- p
- l
- i
- e
- d
- S
- u
- r
- e
- b
- e
- t
- M
- i
- g
- r
- a
- t
- i
- o
- n
- s
-
- -
- >
-
- e
- x
- e
- c
- u
- t
- e
- P
- s
- q
- l
- C
- o
- m
- m
- a
- n
- d
- (
- M
- I
- G
- R
- A
- T
- I
- O
- N
- _
- B
- O
- O
- T
- S
- T
- R
- A
- P
- _
- S
- Q
- L
- )
- .
-
- T
- h
- e
-
- d
- o
- c
- u
- m
- e
- n
- t
- e
- d
-
- c
- o
- n
- t
- r
- a
- c
- t
-
- e
- x
- p
- l
- i
- c
- i
- t
- l
- y
-
- f
- o
- r
- b
- i
- d
- s
-
- i
- m
- p
- l
- i
- c
- i
- t
-
- m
- i
- g
- r
- a
- t
- i
- o
- n
-
- d
- u
- r
- i
- n
- g
-
- s
- t
- a
- t
- u
- s
- .

**Current files and symbols**

- packages/persistence/src/migrations.ts :: listAppliedSurebetMigrations :: 92-110 :: 2ae8d8e9d9cdb6c08003371083c2065dd803ad5d82258f5be3166a17da01f57b
- packages/bootstrap/src/operations/database-lifecycle.ts :: getBwsDatabaseMigrationStatus :: 262-308 :: b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- docs/037_database_backup_retention_and_recovery.md :: Migration status contract :: 9-19 :: 6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10

**Source-pinned files and symbols**

- None

**Root cause**

Bootstrap creation was shared between apply and inspect paths instead of separating read-only catalog inspection from migration initialization.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Make status query pg_catalog/information_schema first and report absent objects. Keep MIGRATION_BOOTSTRAP_SQL exclusively in the explicit apply path.

**Required tests**

- Status against an empty disposable database leaves schema/table counts unchanged
- Status under a read-only role reports absence rather than failing or mutating
- Repeated status is observationally idempotent

**Regression risk**

- Existing automation that accidentally relies on status to initialize the ledger will fail and must call the explicit migration command

**Unchanged areas**

- Explicit migration application remains allowed
- Backup and restore command semantics are not changed by this finding

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger`

## BWS116-R03-003 | P1 | Unknown applied migration rows are ignored and can be reported as compatible

- **Aliases:** `none`
- **Source reports:** `BWS116-R03`
- **Source areas:** `R03`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R03`
- **Secondary areas:** `R08, R09, R11`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

A frozen binary must classify a divergent or newer migration lineage explicitly and fail closed unless a reviewed forward-compatibility rule proves it safe.

**Trigger**

Run migration status or apply from this archive.

**Current behavior**

The unknown row is ignored. If all known checksums match and the schema exists, status is compatible and apply proceeds with the current file set.

**Expected behavior**

A frozen binary must classify a divergent or newer migration lineage explicitly and fail closed unless a reviewed forward-compatibility rule proves it safe.

**Impact**

An older or divergent application can be allowed to operate against a schema it does not understand, producing false migration compatibility and unsafe rollback/upgrade decisions.

**Evidence**

- T
- h
- e
-
- m
- i
- s
- m
- a
- t
- c
- h
-
- b
- u
- i
- l
- d
- e
- r
-
- e
- x
- e
- c
- u
- t
- e
- s
-
- c
- o
- n
- t
- i
- n
- u
- e
-
- w
- h
- e
- n
-
- e
- x
- p
- e
- c
- t
- e
- d
- S
- h
- a
- 2
- 5
- 6
-
- i
- s
-
- u
- n
- d
- e
- f
- i
- n
- e
- d
- ;
-
- c
- o
- m
- p
- a
- t
- i
- b
- i
- l
- i
- t
- y
-
- h
- a
- s
-
- n
- o
-
- u
- n
- k
- n
- o
- w
- n
- -
- a
- p
- p
- l
- i
- e
- d
- -
- m
- i
- g
- r
- a
- t
- i
- o
- n
-
- r
- e
- a
- s
- o
- n
- .

**Current files and symbols**

- packages/bootstrap/src/operations/database-lifecycle.ts :: buildMigrationChecksumMismatches :: 1054-1075 :: b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- packages/bootstrap/src/operations/database-lifecycle.ts :: getBwsDatabaseMigrationStatus :: 278-305 :: b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- packages/persistence/src/migrations.ts :: applySurebetMigrations :: 45-84 :: 2ae8d8e9d9cdb6c08003371083c2065dd803ad5d82258f5be3166a17da01f57b

**Source-pinned files and symbols**

- None

**Root cause**

The migration ledger is treated as a cache of known rows rather than authoritative schema lineage requiring explicit forward/backward compatibility.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Add unknownApplied entries to the status contract, make compatibility fail closed by default, and permit forward compatibility only through an explicit reviewed compatibility range or schema capability proof.

**Required tests**

- Ledger with one unknown applied migration is incompatible
- Renamed migration and same-SQL/different-name cases
- Older binary against newer schema
- Exact known set remains compatible

**Regression risk**

- A strict set check can block intentional rolling upgrades unless compatibility policy is made explicit

**Unchanged areas**

- Known migration checksum checking remains valid
- No claim is made that the current target database contains an unknown row

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger`

## BWS116-R03-004 | P2 | Concurrent migration applications are not serialized around ledger observation and insertion

- **Aliases:** `none`
- **Source reports:** `BWS116-R03`
- **Source areas:** `R03`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R03`
- **Secondary areas:** `R08, R06, R11`
- **Repository severity:** `P2`
- **Normalized severity:** `P2`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Exactly one migrator should own the schema transition; peers should wait and then observe the committed ledger.

**Trigger**

Both processes read the same pre-application ledger and attempt the same migration transaction.

**Current behavior**

Both callers can classify the migration as absent. One commits; the other can fail on the ledger primary key or on future non-idempotent DDL even though the database reached the desired state.

**Expected behavior**

Exactly one migrator should own the schema transition; peers should wait and then observe the committed ledger.

**Impact**

Concurrent startup can create false deployment failure, partial rollout behavior across processes, and nondeterministic operator results.

**Evidence**

- N
- o
-
- p
- g
- _
- a
- d
- v
- i
- s
- o
- r
- y
- _
- x
- a
- c
- t
- _
- l
- o
- c
- k
- ,
-
- l
- o
- c
- k
- e
- d
-
- l
- e
- d
- g
- e
- r
-
- r
- o
- w
- ,
-
- s
- e
- r
- i
- a
- l
- i
- z
- a
- b
- l
- e
-
- r
- e
- t
- r
- y
-
- p
- r
- o
- t
- o
- c
- o
- l
- ,
-
- o
- r
-
- r
- e
- -
- r
- e
- a
- d
-
- i
- n
- s
- i
- d
- e
-
- a
-
- m
- i
- g
- r
- a
- t
- i
- o
- n
- -
- o
- w
- n
- e
- r
-
- t
- r
- a
- n
- s
- a
- c
- t
- i
- o
- n
-
- e
- x
- i
- s
- t
- s
- .

**Current files and symbols**

- packages/persistence/src/migrations.ts :: applySurebetMigrations :: 41-84 :: 2ae8d8e9d9cdb6c08003371083c2065dd803ad5d82258f5be3166a17da01f57b

**Source-pinned files and symbols**

- None

**Root cause**

Migration application assumes a single caller but the service/lifecycle architecture does not encode that assumption in PostgreSQL.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Acquire a repository-specific PostgreSQL advisory lock before bootstrap/ledger inspection, re-read under the lock, apply in deterministic order, and release only after the ledger row is durable.

**Required tests**

- Two concurrent migrators against a disposable database
- Second migrator waits and returns skipped rather than failing
- Crash while holding the lock and subsequent recovery

**Regression risk**

- Lock-key collisions must be avoided
- Long migrations need an explicit bounded lock-wait policy

**Unchanged areas**

- Each individual supplied migration remains wrapped in BEGIN/COMMIT
- Current migrations use CREATE TABLE/INDEX IF NOT EXISTS

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger`

## BWS116-R03-005 | P2 | psql subprocesses have no explicit timeout or cancellation boundary

- **Aliases:** `none`
- **Source reports:** `BWS116-R03`
- **Source areas:** `R03`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R03`
- **Secondary areas:** `R06, R08, R10, R11`
- **Repository severity:** `P2`
- **Normalized severity:** `P2`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Every database subprocess must have a bounded command budget, classified timeout, deterministic cleanup, and cancellation propagation from service shutdown.

**Trigger**

Invoke any repository, migration, status, scheduler, or worker persistence operation.

**Current behavior**

The Node process blocks synchronously until psql exits. Service pass timeouts cannot interrupt this child.

**Expected behavior**

Every database subprocess must have a bounded command budget, classified timeout, deterministic cleanup, and cancellation propagation from service shutdown.

**Impact**

A single blocked database command can freeze the event loop, prevent lease handling and graceful drain, and make configured service timeout values non-binding.

**Evidence**

- T
- h
- e
-
- e
- x
- e
- c
- F
- i
- l
- e
- S
- y
- n
- c
-
- o
- p
- t
- i
- o
- n
- s
-
- s
- e
- t
-
- e
- n
- c
- o
- d
- i
- n
- g
- /
- e
- n
- v
- /
- s
- t
- d
- i
- o
-
- o
- n
- l
- y
- .
-
- N
- o
-
- t
- i
- m
- e
- o
- u
- t
-
- i
- s
-
- s
- u
- p
- p
- l
- i
- e
- d
-
- a
- n
- d
-
- n
- o
-
- c
- h
- i
- l
- d
-
- h
- a
- n
- d
- l
- e
-
- e
- x
- i
- s
- t
- s
-
- f
- o
- r
-
- c
- a
- n
- c
- e
- l
- l
- a
- t
- i
- o
- n
- .

**Current files and symbols**

- packages/persistence/src/psql.ts :: runPsql :: 191-217 :: 86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343

**Source-pinned files and symbols**

- None

**Root cause**

The persistence abstraction omits command-budget and abort ownership from its public configuration.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Add a required bounded psql timeout and maximum output size, map timeout/termination distinctly, redact errors, and thread an abort/deadline policy through long-running service calls. Consider a pooled PostgreSQL driver for transactional and cancellation semantics.

**Required tests**

- Sleeping fake psql is terminated at the configured budget
- Blocked database query does not prevent service shutdown indefinitely
- Timeout is distinct from SQL failure and authentication failure

**Regression risk**

- Too-short defaults can abort legitimate migrations or backups
- Switching drivers changes error and transaction semantics

**Unchanged areas**

- execFileSync argument arrays avoid shell interpolation
- No credentials were printed during review

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger`

## BWS116-R03-006 | P1 | Repository idempotency claims use read-then-insert races instead of atomic create-or-compare operations

- **Aliases:** `none`
- **Source reports:** `BWS116-R03`
- **Source areas:** `R03`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R03`
- **Secondary areas:** `R01, R07, R11`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Equal requests should converge to one retained record; conflicting payloads should return the repository-specific deterministic conflict code.

**Trigger**

Both existence checks complete before either INSERT commits.

**Current behavior**

One INSERT wins and another surfaces a raw wrapped psql uniqueness failure. The loser does not re-read and compare the committed row.

**Expected behavior**

Equal requests should converge to one retained record; conflicting payloads should return the repository-specific deterministic conflict code.

**Impact**

Scheduler, convergence, import, and worker retries can be reported as failures even when the desired record is durable. Conflicting payloads lose their typed conflict semantics, weakening recovery decisions.

**Evidence**

- T
- h
- e
-
- p
- a
- t
- t
- e
- r
- n
-
- r
- e
- c
- u
- r
- s
-
- a
- c
- r
- o
- s
- s
-
- a
- l
- l
-
- c
- r
- e
- a
- t
- i
- o
- n
-
- r
- e
- p
- o
- s
- i
- t
- o
- r
- i
- e
- s
- .
-
- D
- a
- t
- a
- b
- a
- s
- e
-
- u
- n
- i
- q
- u
- e
- n
- e
- s
- s
-
- p
- r
- e
- v
- e
- n
- t
- s
-
- m
- a
- n
- y
-
- p
- h
- y
- s
- i
- c
- a
- l
-
- d
- u
- p
- l
- i
- c
- a
- t
- e
- s
- ,
-
- b
- u
- t
-
- i
- t
-
- d
- o
- e
- s
-
- n
- o
- t
-
- p
- r
- o
- v
- i
- d
- e
-
- a
- p
- p
- l
- i
- c
- a
- t
- i
- o
- n
- -
- l
- e
- v
- e
- l
-
- a
- t
- o
- m
- i
- c
-
- i
- d
- e
- m
- p
- o
- t
- e
- n
- c
- y
-
- o
- r
-
- d
- e
- t
- e
- r
- m
- i
- n
- i
- s
- t
- i
- c
-
- c
- o
- n
- f
- l
- i
- c
- t
-
- c
- l
- a
- s
- s
- i
- f
- i
- c
- a
- t
- i
- o
- n
- .

**Current files and symbols**

- packages/persistence/src/repositories/upstream-lock-repository.ts :: SurebetUpstreamLockRepository.put :: 32-88 :: c77663c55b41255a4c1f455012d5427b55f8a5cf1c733e7b800cc334f407a8bc
- packages/persistence/src/repositories/import-run-repository.ts :: SurebetImportRunRepository.create :: 60-115 :: 9bb1a79b2b27ea6cd3eaaf38cb22bb20148615a2400ff929b834ad2dbd08e00b
- packages/persistence/src/repositories/strategy-ledger-repository.ts :: SurebetStrategyLedgerRepository.create :: 56-143 :: a3874447d9cf6334eafd4eaf1e7a45c3cd95b48fe865fcc68ba1f5583ca32528
- packages/persistence/src/repositories/worker-job-repository.ts :: SurebetWorkerJobRepository.create :: 220-270 :: 263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e
- packages/persistence/src/repositories/private-paper-runtime-scheduler-checkpoint-repository.ts :: SurebetPrivatePaperRuntimeSchedulerCheckpointRepository.create :: 74-121 :: fd997e6c563e93a0055066ae7ffc64173402495429983e0574b6e929aa743489
- packages/persistence/src/repositories/b1-upstream-convergence-repository.ts :: SurebetB1UpstreamConvergenceRepository.create :: 59-110 :: 468cde29f264349925fe65e33d5b7e05fb34390877bb0f2503345154160d6884

**Source-pinned files and symbols**

- None

**Root cause**

Idempotency is implemented as optimistic preflight reads rather than a database atomic claim keyed by identity and immutable payload digest.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Use one database round trip per create: INSERT ... ON CONFLICT DO NOTHING RETURNING, then fetch and compare in the same transaction; or encode identity plus immutable digest in a conflict-aware UPSERT that never overwrites.

**Required tests**

- Concurrent equal creates converge to one success result
- Concurrent different creates return the typed conflict
- Unique secondary identities such as fingerprint/report hash are classified deterministically
- Scheduler/job restart uses the production repository, not an in-memory fake

**Regression risk**

- Incorrect ON CONFLICT targets could mask secondary-identity conflicts
- Automatic overwrite must remain prohibited

**Unchanged areas**

- Existing primary and unique constraints remain useful and must not be removed
- Pure strategy identity composition remains R02-owned

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger`

## BWS116-R03-007 | P1 | Finalization and checkpoint advances validate expected state in one session but update by ID in another

- **Aliases:** `none`
- **Source reports:** `BWS116-R03`
- **Source areas:** `R03`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R03`
- **Secondary areas:** `R01, R04, R06, R11`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Expected state must be part of the UPDATE predicate and exactly one transition may succeed; retries must compare the retained terminal payload.

**Trigger**

Both precondition reads observe the same current state, after which the updates execute in a different order.

**Current behavior**

The UPDATE predicates contain only the primary ID. Both callers can pass preflight validation and the later writer can replace the earlier terminal outcome or advance from stale state.

**Expected behavior**

Expected state must be part of the UPDATE predicate and exactly one transition may succeed; retries must compare the retained terminal payload.

**Impact**

Import outcomes, convergence cursors, scheduled cycle identities, and B1 terminal evidence can become last-writer-wins rather than monotonic and conflict-detecting. This permits skipped/reordered work and false terminality.

**Evidence**

- E
- v
- e
- r
- y
-
- l
- i
- s
- t
- e
- d
-
- m
- e
- t
- h
- o
- d
-
- o
- p
- e
- n
- s
-
- s
- e
- p
- a
- r
- a
- t
- e
-
- p
- s
- q
- l
-
- p
- r
- o
- c
- e
- s
- s
- e
- s
-
- f
- o
- r
-
- r
- e
- a
- d
-
- a
- n
- d
-
- w
- r
- i
- t
- e
-
- a
- n
- d
-
- d
- o
- e
- s
-
- n
- o
- t
-
- i
- n
- s
- p
- e
- c
- t
-
- a
- n
-
- a
- f
- f
- e
- c
- t
- e
- d
- -
- r
- o
- w
-
- R
- E
- T
- U
- R
- N
- I
- N
- G
-
- r
- e
- s
- u
- l
- t
-
- t
- i
- e
- d
-
- t
- o
-
- e
- x
- p
- e
- c
- t
- e
- d
-
- s
- t
- a
- t
- e
- .

**Current files and symbols**

- packages/persistence/src/repositories/import-run-repository.ts :: SurebetImportRunRepository.finalize :: 117-157 :: 9bb1a79b2b27ea6cd3eaaf38cb22bb20148615a2400ff929b834ad2dbd08e00b
- packages/persistence/src/repositories/upstream-api-convergence-repository.ts :: SurebetUpstreamApiConvergenceRepository.advance :: 149-198 :: 298c9e2b2d874f5e11e7278893f00acaaaf16b48a47fde0cab41c33e59017ba0
- packages/persistence/src/repositories/upstream-export-convergence-repository.ts :: SurebetUpstreamExportConvergenceRepository.advance :: 115-164 :: dbfac37a5aac9e6139532312a0635f25f655c8739782e186f72bc6717bd79600
- packages/persistence/src/repositories/private-paper-runtime-scheduler-checkpoint-repository.ts :: SurebetPrivatePaperRuntimeSchedulerCheckpointRepository.advance :: 201-236 :: fd997e6c563e93a0055066ae7ffc64173402495429983e0574b6e929aa743489
- packages/persistence/src/repositories/b1-private-observation-repository.ts :: complete / block :: 119-167 :: a057be720b8d7794b5d3a29cac35879ea555a65f2238e085b98fb7ea730f9941

**Source-pinned files and symbols**

- None

**Root cause**

Optimistic concurrency is enforced only in TypeScript, outside the database transaction that owns the state.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Move each transition into one SQL statement or transaction with current status/cursor/version in WHERE, use RETURNING, distinguish zero-row stale from missing, and compare retained terminal payloads for idempotent replay.

**Required tests**

- Two concurrent import finalizers with equal and conflicting outcomes
- Two API/export cursor advances from one expected cursor
- Two scheduler instances advancing one checkpoint
- Concurrent B1 complete versus block

**Regression risk**

- Adding strict CAS can expose callers that currently depend on silent last-writer-wins behavior

**Unchanged areas**

- Read model ordering is unchanged
- Upstream semantic validity remains R01-owned

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger`

## BWS116-R03-008 | P1 | Worker heartbeat, checkpoint, completion, and retry transitions omit the lease fence from their mutation predicates

- **Aliases:** `none`
- **Source reports:** `BWS116-R03`
- **Source areas:** `R03`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R03`
- **Secondary areas:** `R06, R07, R11`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Every lease-authorized mutation must atomically require status=leased, exact owner, exact token or epoch, and active lease in the same SQL statement.

**Trigger**

The worker passes requireOwnedActiveLease, then another transaction changes the row before the worker mutation executes.

**Current behavior**

Heartbeat, checkpoint job update, completion, and retry use WHERE job_id only. A stale operation can alter a later lease or race a conflicting transition; checkpoint insertion can publish after the job became terminal.

**Expected behavior**

Every lease-authorized mutation must atomically require status=leased, exact owner, exact token or epoch, and active lease in the same SQL statement.

**Impact**

A stale worker can extend a replacement lease, complete work after a retry/reclaim sequence, publish late checkpoints, or produce success/error ordering that does not correspond to a single owner. Duplicate economic/evidence effects become possible.

**Evidence**

- T
- h
- e
-
- s
- o
- u
- r
- c
- e
-
- i
- t
- s
- e
- l
- f
-
- d
- e
- m
- o
- n
- s
- t
- r
- a
- t
- e
- s
-
- t
- h
- e
-
- m
- i
- s
- s
- i
- n
- g
-
- p
- r
- e
- d
- i
- c
- a
- t
- e
- s
- .
-
- d
- e
- a
- d
- L
- e
- t
- t
- e
- r
- O
- w
- n
- e
- d
- J
- o
- b
-
- a
- l
- r
- e
- a
- d
- y
-
- u
- s
- e
- s
-
- a
- n
-
- a
- t
- o
- m
- i
- c
-
- f
- e
- n
- c
- e
- d
-
- U
- P
- D
- A
- T
- E
- ,
-
- s
- h
- o
- w
- i
- n
- g
-
- t
- h
- e
-
- i
- n
- t
- e
- n
- d
- e
- d
-
- m
- e
- c
- h
- a
- n
- i
- s
- m
-
- e
- x
- i
- s
- t
- s
-
- b
- u
- t
-
- i
- s
-
- n
- o
- t
-
- a
- p
- p
- l
- i
- e
- d
-
- c
- o
- n
- s
- i
- s
- t
- e
- n
- t
- l
- y
- .

**Current files and symbols**

- packages/persistence/src/repositories/worker-job-repository.ts :: heartbeatLease / recordCheckpoint :: 438-546 :: 263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e
- packages/persistence/src/repositories/worker-job-repository.ts :: complete / fail :: 609-692 :: 263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e
- packages/persistence/src/repositories/worker-job-repository.ts :: requireOwnedActiveLease :: 844-879 :: 263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e
- packages/persistence/src/repositories/worker-job-repository.ts :: deadLetterOwnedJob :: 882-962 :: 263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e

**Source-pinned files and symbols**

- None

**Root cause**

Lease ownership and state mutation are split across psql sessions instead of encoded in one conditional database transition.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Use conditional UPDATE/CTE statements with job_id, status, lease_owner, lease_token, lease expiry, and optionally monotonic lease_epoch; use RETURNING and zero-row stale-owner classification. Keep checkpoint insert plus job metadata update atomic and fenced.

**Required tests**

- Old worker completion after new claim
- Heartbeat racing retry and replacement claim
- Checkpoint racing success/dead-letter
- Completion versus retry race
- Exactly-once release of lease fields

**Regression risk**

- Stricter fencing can surface latent late callbacks as errors; callers must treat them as stale completion, not retryable work

**Unchanged areas**

- Atomic FOR UPDATE SKIP LOCKED claim remains a safeguard
- Dead-letter owner/token CAS remains a safeguard

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger`

## BWS116-R03-009 | P1 | Worker availability and lease validity are controlled by caller timestamps with inconsistent expiry boundaries

- **Aliases:** `none`
- **Source reports:** `BWS116-R03`
- **Source areas:** `R03`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R03`
- **Secondary areas:** `R06, R10, R11`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

PostgreSQL should own lease-now and monotonic lease epochs, with one consistent half-open validity rule; business timestamps should be validated for chronology.

**Trigger**

Claim, heartbeat, completion, failure, or reap uses the supplied timestamp.

**Current behavior**

A future caller clock can claim retry work early and create long leases; a past clock can authorize late completion against real time or regress heartbeat fields. At equality, requireOwnedActiveLease accepts while reaper expires.

**Expected behavior**

PostgreSQL should own lease-now and monotonic lease epochs, with one consistent half-open validity rule; business timestamps should be validated for chronology.

**Impact**

Clock skew can create premature claims, effectively unbounded leases, stale-worker publication, and contradictory active/expired decisions.

**Evidence**

- A
- l
- l
-
- r
- e
- l
- e
- v
- a
- n
- t
-
- S
- Q
- L
-
- l
- i
- t
- e
- r
- a
- l
- s
-
- a
- r
- e
-
- d
- e
- r
- i
- v
- e
- d
-
- f
- r
- o
- m
-
- i
- n
- j
- e
- c
- t
- e
- d
-
- s
- t
- r
- i
- n
- g
- s
- ;
-
- n
- o
-
- C
- U
- R
- R
- E
- N
- T
- _
- T
- I
- M
- E
- S
- T
- A
- M
- P
-
- p
- r
- e
- d
- i
- c
- a
- t
- e
-
- o
- r
-
- m
- o
- n
- o
- t
- o
- n
- i
- c
-
- v
- e
- r
- s
- i
- o
- n
-
- i
- s
-
- u
- s
- e
- d
-
- f
- o
- r
-
- l
- e
- a
- s
- e
-
- a
- u
- t
- h
- o
- r
- i
- t
- y
- .

**Current files and symbols**

- packages/persistence/src/repositories/worker-job-repository.ts :: claimNext :: 355-435 :: 263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e
- packages/persistence/src/repositories/worker-job-repository.ts :: validateClaimRequest / validateHeartbeatRequest :: 1166-1200 :: 263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e
- packages/persistence/src/repositories/worker-job-repository.ts :: requireOwnedActiveLease / reapExpiredLeases :: 751-879 :: 263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e

**Source-pinned files and symbols**

- None

**Root cause**

Deterministic test clocks were elevated into production concurrency authority instead of separating observable event time from database lease time.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Use database-generated lease timestamps and a monotonic lease epoch/fencing token; define validity as now < expires_at consistently; reject timestamp regression and preserve injected clocks only for non-authoritative evidence fields.

**Required tests**

- Future-skew claim cannot claim not-yet-available work
- Past-skew completion after real expiry is rejected
- Exact expiry instant has one result
- Heartbeat cannot regress last_heartbeat_at or lease_expires_at

**Regression risk**

- Changing time authority can affect deterministic test fixtures and requires explicit database clock control in tests

**Unchanged areas**

- ISO-8601 syntax validation remains useful
- Pure quote/source currentness remains R01/R02-owned

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger`

## BWS116-R03-010 | P1 | Expired leases are always dead-lettered even when retry budget remains

- **Aliases:** `none`
- **Source reports:** `BWS116-R03`
- **Source areas:** `R03`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R03`
- **Secondary areas:** `R06, R07, R11`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

The durable policy must distinguish abandoned/unknown work, apply the configured retry budget when replay is safe, and dead-letter only on exhaustion or an explicit non-replayable policy.

**Trigger**

The next worker pass invokes reapExpiredLeases.

**Current behavior**

The reaper unconditionally writes dead_lettered with SUREBET_WORKER_JOB_LEASE_EXPIRED. No remaining retry calculation is performed.

**Expected behavior**

The durable policy must distinguish abandoned/unknown work, apply the configured retry budget when replay is safe, and dead-letter only on exhaustion or an explicit non-replayable policy.

**Impact**

Transient worker failure becomes permanent work loss. Standard and B1 private-paper cycles can be stranded even though their queue record was explicitly configured with retries.

**Evidence**

- T
- h
- e
-
- n
- o
- r
- m
- a
- l
-
- f
- a
- i
- l
-
- p
- a
- t
- h
-
- r
- e
- a
- d
- s
-
- r
- e
- t
- r
- y
- D
- e
- l
- a
- y
- s
- M
- s
- [
- a
- t
- t
- e
- m
- p
- t
- C
- o
- u
- n
- t
- -
- 1
- ]
- ,
-
- b
- u
- t
-
- t
- h
- e
-
- e
- x
- p
- i
- r
- e
- d
- -
- l
- e
- a
- s
- e
-
- p
- a
- t
- h
-
- b
- y
- p
- a
- s
- s
- e
- s
-
- i
- t
-
- e
- n
- t
- i
- r
- e
- l
- y
- .

**Current files and symbols**

- packages/persistence/src/repositories/worker-job-repository.ts :: reapExpiredLeases / deadLetterExpiredLease :: 751-830; 965-1037 :: 263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e
- docs/035_continuous_service_supervisor_contract.md :: Required worker behavior :: 65-72 :: cae4ce541c65848974de8c4568e72b6d2d3d151d9f2c3eaf52cb50e6777c8505
- database/migrations/surebet/004_create_worker_jobs.sql :: surebet.worker_jobs :: 1-111 :: 9756445dbfbdac6226413098d1253527578d9420543287842c30d034df162b9c

**Source-pinned files and symbols**

- None

**Root cause**

Lease expiration policy is hard-coded as terminal rather than derived from retry budget and idempotency/replay safety.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Add an explicit atomic expired-lease transition: retry_wait with next availability while budget remains and replay is authorized; dead_lettered only when exhausted or policy says outcome is unknown/non-replayable. Preserve prior lease evidence.

**Required tests**

- Expired first attempt with remaining retries moves to retry_wait
- Expired final attempt dead-letters
- Concurrent reapers transition once
- Unknown-side-effect policy remains fail-closed
- Recovered job cannot be finalized by stale worker

**Regression risk**

- Automatic replay is unsafe until the idempotency and fencing findings are fixed; implementation order must place those first

**Unchanged areas**

- Dead-letter evidence table remains required
- No live execution path is authorized

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger`

## BWS116-R03-011 | P1 | Configured service timeouts and shutdown signals do not cancel in-flight scheduler or worker work

- **Aliases:** `none`
- **Source reports:** `BWS116-R03`
- **Source areas:** `R03`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R03`
- **Secondary areas:** `R06, R10, R11`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

The service must stop awaiting at the deadline, propagate cancellation to underlying work, stop renewing leases, fence late mutations, and report a distinct timeout/cancel state.

**Trigger**

The timeout fires or shutdownSignal is set while work is in flight.

**Current behavior**

Timeout only changes later classification. Both helpers await the original promise after the sentinel. Worker shutdown is checked only before new claims; the in-flight handler receives no cancellation and continues lease renewal.

**Expected behavior**

The service must stop awaiting at the deadline, propagate cancellation to underlying work, stop renewing leases, fence late mutations, and report a distinct timeout/cancel state.

**Impact**

Graceful shutdown can hang indefinitely, configured timeout budgets are false, late work can publish checkpoints/ledger/terminal results, and resource ownership is not released at the claimed deadline.

**Evidence**

- T
- h
- e
-
- s
- o
- u
- r
- c
- e
-
- h
- a
- s
-
- t
- w
- o
-
- e
- x
- p
- l
- i
- c
- i
- t
-
- a
- w
- a
- i
- t
-
- r
- a
- w
- P
- a
- s
- s
- P
- r
- o
- m
- i
- s
- e
-
- p
- a
- t
- h
- s
-
- a
- f
- t
- e
- r
-
- t
- i
- m
- e
- o
- u
- t
-
- a
- n
- d
-
- a
- n
-
- i
- n
- f
- i
- n
- i
- t
- e
-
- r
- e
- n
- e
- w
- a
- l
-
- l
- o
- o
- p
-
- w
- i
- t
- h
- o
- u
- t
-
- d
- r
- a
- i
- n
- /
- a
- b
- o
- r
- t
-
- o
- b
- s
- e
- r
- v
- a
- t
- i
- o
- n
- .

**Current files and symbols**

- packages/bootstrap/src/workers/bounded-job-worker.ts :: RunBoundedWorkerPassRequest / runHandlerWithLeaseRenewal :: 59-77; 313-347 :: 3f319fc5ad09636121698b36817f1762c4431dffb775535a2d62e3289b111dd7
- packages/bootstrap/src/operations/private-paper-worker-service.ts :: worker pass execution / raceWithTimeout :: 379-395; 552-574 :: 1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36
- packages/bootstrap/src/operations/private-paper-scheduler-service.ts :: executePass / raceWithTimeout :: 505-514; 531-553 :: 876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967

**Source-pinned files and symbols**

- None

**Root cause**

Timeout and signal handling are observational wrappers rather than ownership/cancellation mechanisms threaded through worker handlers and repositories.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Introduce AbortSignal and absolute deadlines at service, pass, handler, adapter, and persistence boundaries; stop renewal on abort; return at timeout; fence late result publication by lease epoch/status; add cancelled/timed_out/unknown durable states as required.

**Required tests**

- Never-settling worker handler exits service within timeout
- SIGTERM during handler stops lease renewal and prevents new durable writes
- Late handler resolution cannot complete the job
- Scheduler pass timeout returns without awaiting the pass
- Timer/listener cleanup occurs exactly once

**Regression risk**

- Cancellation can expose non-cancellable psql calls until finding 005 is fixed
- New durable states require migration and API/read-model updates

**Unchanged areas**

- Existing drain behavior before new claims remains valid
- Generic child-process supervision details remain R06-owned

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger`

## BWS116-R03-012 | P2 | Checkpoint, dead-letter, B1 child-row, and expired-lease reads are unbounded

- **Aliases:** `none`
- **Source reports:** `BWS116-R03`
- **Source areas:** `R03`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R03`
- **Secondary areas:** `R05, R06, R07, R11`
- **Repository severity:** `P2`
- **Normalized severity:** `P2`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Persistence APIs must require bounded page sizes and stable cursors; maintenance transitions must process bounded batches atomically.

**Trigger**

A list/read/reaper call runs with default options or on a large B1 run.

**Current behavior**

Several methods issue no LIMIT. The reaper loads all expired jobs and then creates N additional psql sessions.

**Expected behavior**

Persistence APIs must require bounded page sizes and stable cursors; maintenance transitions must process bounded batches atomically.

**Impact**

Memory, output-buffer, process-count, and database-load spikes can block workers and lifecycle diagnostics. Backpressure is undermined precisely during failure accumulation.

**Evidence**

- T
- h
- e
-
- S
- Q
- L
-
- s
- h
- o
- w
- n
-
- c
- o
- n
- t
- a
- i
- n
- s
-
- n
- o
-
- L
- I
- M
- I
- T
-
- f
- o
- r
-
- d
- e
- a
- d
-
- l
- e
- t
- t
- e
- r
- s
- ,
-
- r
- e
- a
- p
- i
- n
- g
- ,
-
- o
- r
-
- B
- 1
-
- c
- h
- i
- l
- d
-
- r
- o
- w
- s
- ;
-
- c
- h
- e
- c
- k
- p
- o
- i
- n
- t
-
- l
- i
- m
- i
- t
-
- i
- s
-
- o
- p
- t
- i
- o
- n
- a
- l
-
- a
- n
- d
-
- d
- e
- f
- a
- u
- l
- t
- s
-
- t
- o
-
- e
- m
- p
- t
- y
- .

**Current files and symbols**

- packages/persistence/src/repositories/worker-job-repository.ts :: listCheckpoints / listDeadLetters / reapExpiredLeases :: 573-607; 720-830 :: 263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e
- packages/persistence/src/repositories/b1-backtest-run-repository.ts :: listCandidates / listSimulationResults :: 285-341 :: fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04

**Source-pinned files and symbols**

- None

**Root cause**

Boundedness is enforced at selected service loops but omitted from repository contracts and maintenance queries.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Require explicit positive limits and stable keyset cursors; add a bounded bulk expired-lease CTE with SKIP LOCKED/RETURNING; page B1 children and dead letters.

**Required tests**

- Large-cardinality query plans use indexes and fixed limits
- Reaper handles at most batchSize and is repeatable
- Stable keyset ordering under concurrent inserts
- psql output remains below configured maximum

**Regression risk**

- Pagination changes API consumers and evidence aggregation
- Bulk reaping must preserve per-job dead-letter evidence

**Unchanged areas**

- Individual query ordering is deterministic where ORDER BY is present
- Worker claim maxJobs remains bounded

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger`

## BWS116-R03-013 | P1 | Import-run retention ignores convergence references, causing either deletion failure or dangling durable identity

- **Aliases:** `none`
- **Source reports:** `BWS116-R03`
- **Source areas:** `R03`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R03`
- **Secondary areas:** `R08, R01, R11`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

The plan must exclude every retained reference and revalidate atomically before deletion; equivalent references must have consistent foreign-key semantics.

**Trigger**

Generate and apply an import_runs retention plan containing that run.

**Current behavior**

The candidate query does not inspect convergence tables. API checkpoint references make DELETE fail through the FK; export checkpoint references allow DELETE and leave last_import_run_id dangling.

**Expected behavior**

The plan must exclude every retained reference and revalidate atomically before deletion; equivalent references must have consistent foreign-key semantics.

**Impact**

Retention can produce a plan that cannot be applied or can destroy provenance required to reconstruct convergence state. Partial prune/recovery evidence becomes unreliable.

**Evidence**

- T
- h
- e
-
- t
- w
- o
-
- c
- o
- n
- v
- e
- r
- g
- e
- n
- c
- e
-
- s
- c
- h
- e
- m
- a
- s
-
- e
- n
- c
- o
- d
- e
-
- t
- h
- e
-
- s
- a
- m
- e
-
- l
- o
- g
- i
- c
- a
- l
-
- r
- e
- f
- e
- r
- e
- n
- c
- e
-
- d
- i
- f
- f
- e
- r
- e
- n
- t
- l
- y
- ,
-
- w
- h
- i
- l
- e
-
- t
- h
- e
-
- r
- e
- t
- e
- n
- t
- i
- o
- n
-
- a
- n
- t
- i
- -
- j
- o
- i
- n
-
- c
- o
- v
- e
- r
- s
-
- n
- e
- i
- t
- h
- e
- r
- .

**Current files and symbols**

- packages/bootstrap/src/operations/database-lifecycle.ts :: buildRetentionPlanQuery / buildRetentionDeleteSql :: 568-598; 854-875 :: b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377
- database/migrations/surebet/005_create_upstream_export_convergence_checkpoints.sql :: surebet.upstream_export_convergence_checkpoints.last_import_run_id :: 1-39 :: 8d3c09c06b61e4fb1774879c51467381b70bbe6f46c86c660345c63667089e3c
- database/migrations/surebet/006_create_upstream_api_convergence_checkpoints.sql :: surebet.upstream_api_convergence_checkpoints.last_import_run_id :: 1-28 :: 3d5ac1c0f2d89aac08acb057668b87b2e9116f274ff78020568dc82522f270f7
- docs/037_database_backup_retention_and_recovery.md :: Retention contract :: 44-54 :: 6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10

**Source-pinned files and symbols**

- None

**Root cause**

Retention ownership and schema reference ownership were designed independently without one authoritative dependency graph.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Add consistent FKs or explicit immutable-reference tables, anti-join all retained references during planning, recheck in the delete transaction, and classify protected/skipped rows instead of failing the whole plan.

**Required tests**

- API-referenced import is excluded
- Export-referenced import is excluded
- Concurrent new reference between plan and apply is preserved
- Plan/apply deletedCount and protectedCount reconcile

**Regression risk**

- Adding a foreign key requires cleanup of any existing dangling values
- Retention throughput may fall without supporting indexes

**Unchanged areas**

- Pinned export protection remains valid
- Operational backup/restore command ownership remains R08

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger`

## BWS116-R03-014 | P1 | Standard private-paper retries do not reconstruct durable previous cycle state

- **Aliases:** `none`
- **Source reports:** `BWS116-R03`
- **Source areas:** `R03`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R03`
- **Secondary areas:** `R01, R04, R06, R11`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

The same runtimeId/cycleId must be bound to one immutable input digest and prior state; equal replay returns the retained outcome and changed replay is rejected.

**Trigger**

The retry reconstructs the runtime request from the job payload and fetches current source pages.

**Current behavior**

No prior runtime state is persisted or supplied. validateRestartState immediately accepts absence. A changed source produces a different cycle fingerprint and a second ledger identity with the same logical runReferenceId.

**Expected behavior**

The same runtimeId/cycleId must be bound to one immutable input digest and prior state; equal replay returns the retained outcome and changed replay is rejected.

**Impact**

One logical private-paper cycle can produce divergent accepted/blocked evidence across retries, duplicate ledger effects, and a worker result that does not identify which cycle incarnation is authoritative.

**Evidence**

- T
- h
- e
-
- r
- u
- n
- t
- i
- m
- e
-
- c
- o
- n
- t
- a
- i
- n
- s
-
- c
- o
- r
- r
- e
- c
- t
-
- r
- e
- s
- t
- a
- r
- t
-
- v
- a
- l
- i
- d
- a
- t
- i
- o
- n
- ,
-
- b
- u
- t
-
- t
- h
- e
-
- p
- r
- o
- d
- u
- c
- t
- i
- o
- n
-
- j
- o
- b
-
- a
- d
- a
- p
- t
- e
- r
-
- n
- e
- v
- e
- r
-
- s
- u
- p
- p
- l
- i
- e
- s
-
- t
- h
- e
-
- r
- e
- q
- u
- i
- r
- e
- d
-
- p
- r
- e
- v
- i
- o
- u
- s
- S
- t
- a
- t
- e
-
- a
- n
- d
-
- t
- h
- e
-
- s
- c
- h
- e
- m
- a
-
- d
- o
- e
- s
-
- n
- o
- t
-
- e
- n
- f
- o
- r
- c
- e
-
- u
- n
- i
- q
- u
- e
-
- l
- o
- g
- i
- c
- a
- l
-
- r
- u
- n
-
- i
- d
- e
- n
- t
- i
- t
- y
- .

**Current files and symbols**

- packages/bootstrap/src/workers/private-paper-runtime-jobs.ts :: PersistedPrivatePaperRuntimeJobPayload / toRuntimeRequest / handler :: 47-56; 90-217; 586-613 :: cbf9794410c3c374c7cd22844c5fd1c5fc4e51c7322856b921753479f4b0ca5c
- packages/bootstrap/src/runtime/private-paper-runtime.ts :: PrivatePaperRuntimeRequest / validateRestartState / buildNextState :: 96-104; 981-1060 :: 252e38a52693f3fa598c9ea92a83b184de0c4b29c4ab0bd5c952b750d009c6f5
- packages/bootstrap/src/strategy/strategy-ledger.ts :: createPrivatePaperStrategyLedgerEntry :: 237-267 :: d05e339a5692a9218f2146c153570ee7d9c8d79ae88282e162b7ece0c0cb5dbc
- database/migrations/surebet/003_create_strategy_ledger_entries.sql :: surebet.strategy_ledger_entries :: 1-60 :: b3a7695bfba8fedaa0bb3fccefdde9ae11d893e63a67b493647f0818ce507071

**Source-pinned files and symbols**

- None

**Root cause**

Restart state exists only as an optional in-memory API parameter, not as durable job/cycle authority.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Persist a private-paper cycle aggregate keyed by runtimeId/cycleId with immutable input/cycle digest, reconstruct previousState from durable rows, enforce unique logical run reference, and atomically link ledger outcome to worker terminal publication or make replay return the retained result.

**Required tests**

- Crash after runtime result, after ledger insert, and after final checkpoint
- Equal retry returns the same ledger/result
- Changed upstream bytes for same cycle are rejected
- Fresh process reconstructs previousState from PostgreSQL

**Regression risk**

- Adding run-reference uniqueness requires resolving any pre-existing duplicates
- Source-currentness semantics remain R01-owned and must not be weakened

**Unchanged areas**

- Cycle fingerprint computation remains unchanged
- No claim is made that pinned-record retries diverge

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger`

## BWS116-R03-015 | P1 | B1 backtest persistence commits the parent before children and suppresses repair on replay

- **Aliases:** `none`
- **Source reports:** `BWS116-R03`
- **Source areas:** `R03`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R03`
- **Secondary areas:** `R04, R07, R11`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Parent and all expected children must commit atomically, or replay must verify and deterministically repair/reject an incomplete graph before presenting the run.

**Trigger**

Retry create with the same runId/runHash.

**Current behavior**

The parent persists first. On replay, matching parent causes an immediate return and no child completeness check or repair.

**Expected behavior**

Parent and all expected children must commit atomically, or replay must verify and deterministically repair/reject an incomplete graph before presenting the run.

**Impact**

A B1 run can appear durable and terminal while candidate or simulation evidence is missing. Reports and private observations can reference an incomplete backtest graph indefinitely.

**Evidence**

- T
- h
- e
-
- c
- r
- e
- a
- t
- e
-
- m
- e
- t
- h
- o
- d
-
- h
- a
- s
-
- o
- n
- e
-
- p
- s
- q
- l
-
- c
- a
- l
- l
-
- f
- o
- r
-
- t
- h
- e
-
- p
- a
- r
- e
- n
- t
-
- a
- n
- d
-
- o
- n
- e
-
- o
- r
-
- m
- o
- r
- e
-
- p
- e
- r
-
- c
- a
- n
- d
- i
- d
- a
- t
- e
- /
- r
- e
- s
- u
- l
- t
- .
-
- T
- h
- e
-
- e
- a
- r
- l
- y
- -
- r
- e
- t
- u
- r
- n
-
- b
- r
- a
- n
- c
- h
-
- c
- h
- e
- c
- k
- s
-
- o
- n
- l
- y
-
- r
- u
- n
- H
- a
- s
- h
- .

**Current files and symbols**

- packages/persistence/src/repositories/b1-backtest-run-repository.ts :: SurebetB1BacktestRunRepository.create :: 127-186 :: fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04
- packages/persistence/src/repositories/b1-backtest-run-repository.ts :: createCandidateSnapshot / createSimulationResults / insertSimulationResult :: 354-448 :: fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04
- database/migrations/surebet/009_create_b1_backtest_runs.sql :: surebet.b1_backtest_runs :: 1-32 :: c5b9b66325ca16346c48176236b73dea7fd79f51b5b18aba8ae73d33d7ad12ea
- database/migrations/surebet/010_create_b1_candidate_snapshots.sql :: surebet.b1_candidate_snapshots :: 1-21 :: 83da55cee8bc46ca6f47b8584aaa81c08794a268f5147fc9bef320201a79b78a
- database/migrations/surebet/011_create_b1_simulation_results.sql :: surebet.b1_simulation_results :: 1-20 :: 3e748cb212558268e675df42f809ce9e3cd29b8527a83fd9c00c5897341d15fa

**Source-pinned files and symbols**

- None

**Root cause**

Aggregate persistence was decomposed into independent repository writes without an aggregate transaction or durable completion invariant.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Persist the entire run graph in one PostgreSQL transaction, or add expected child counts/digests and a completion state with locked deterministic repair. Readers must reject non-complete aggregates.

**Required tests**

- Fault after parent insert
- Fault after each candidate and simulation insert boundary
- Replay repairs or rejects partial graph
- Readers never expose incomplete run as complete
- Concurrent equal creates converge

**Regression risk**

- One large transaction can increase lock duration; batching must still preserve an atomic completion marker

**Unchanged areas**

- B1 mathematical contents remain R02/R04-owned
- Current parent and child identifiers remain deterministic

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger`

## BWS116-R03-016 | P1 | B1 observation terminality and worker-job terminality can diverge after a crash

- **Aliases:** `none`
- **Source reports:** `BWS116-R03`
- **Source areas:** `R03`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R03`
- **Secondary areas:** `R04, R06, R07, R11`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Replay should detect the retained terminal observation and converge the worker job to the matching retained result without rerunning or contradicting terminal state.

**Trigger**

The same worker job is retried.

**Current behavior**

create returns the existing terminal observation, the backtest parent returns existing, then complete/block throws NOT_STARTED. The bounded worker converts the throw into a dead-letter result, so completed observation and dead-lettered job can coexist.

**Expected behavior**

Replay should detect the retained terminal observation and converge the worker job to the matching retained result without rerunning or contradicting terminal state.

**Impact**

Operational status, queue evidence, and B1 observation evidence disagree. A successful B1 result can be presented as a failed job, or blocked evidence can lose its original reason.

**Evidence**

- T
- h
- e
-
- h
- a
- n
- d
- l
- e
- r
-
- a
- n
- d
-
- q
- u
- e
- u
- e
-
- t
- e
- r
- m
- i
- n
- a
- l
-
- w
- r
- i
- t
- e
- s
-
- a
- r
- e
-
- s
- e
- p
- a
- r
- a
- t
- e
- .
-
- T
- h
- e
-
- o
- b
- s
- e
- r
- v
- a
- t
- i
- o
- n
-
- r
- e
- p
- o
- s
- i
- t
- o
- r
- y
-
- i
- s
-
- p
- a
- r
- t
- i
- a
- l
- l
- y
-
- i
- d
- e
- m
- p
- o
- t
- e
- n
- t
-
- a
- t
-
- c
- r
- e
- a
- t
- e
-
- b
- u
- t
-
- n
- o
- t
-
- i
- d
- e
- m
- p
- o
- t
- e
- n
- t
-
- a
- t
-
- t
- e
- r
- m
- i
- n
- a
- l
-
- r
- e
- p
- l
- a
- y
- .

**Current files and symbols**

- packages/bootstrap/src/workers/b1-private-observation-jobs.ts :: createB1PrivateObservationJobHandler.run :: 59-137 :: ee293ef0e7a3edeef6ef6729c987f477f049523ccd3d0b150b874796e032a5cc
- packages/persistence/src/repositories/b1-private-observation-repository.ts :: create / complete / block :: 73-167; 268-293 :: a057be720b8d7794b5d3a29cac35879ea555a65f2238e085b98fb7ea730f9941
- packages/bootstrap/src/workers/bounded-job-worker.ts :: runBoundedWorkerPass terminal dispatch :: 180-218 :: 3f319fc5ad09636121698b36817f1762c4431dffb775535a2d62e3289b111dd7
- database/migrations/surebet/012_create_b1_private_observation_cycles.sql :: surebet.b1_private_observation_cycles :: 1-37 :: 5c4858bb130178460e45226677c6cc74610628badeca3632425c0a0838a474a6

**Source-pinned files and symbols**

- None

**Root cause**

Observation terminal persistence and worker terminal persistence were implemented as independent state machines without replay convergence.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Make terminal observation methods idempotent-by-payload, persist an authoritative handler outcome, and atomically or recoverably project it to the worker job. Add FK/unique binding between job and observation where appropriate.

**Required tests**

- Crash after observation complete before job complete
- Crash after observation block before job dead-letter
- Retry converges without rerunning backtest
- Conflicting retained terminal payload is rejected

**Regression risk**

- Changing blocked handling may affect dead-letter reason semantics and read models

**Unchanged areas**

- runtimeEvidence=false and executable=false safeguards remain
- B1 strategy calculations remain unchanged

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger`

## BWS116-R03-017 | P1 | Durable lifecycle tables accept impossible timestamp orderings

- **Aliases:** `none`
- **Source reports:** `BWS116-R03`
- **Source areas:** `R03`
- **Source baseline:** `betting-win-surebet116.zip` / `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R03`
- **Secondary areas:** `R01, R06, R09, R11`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Application validation and PostgreSQL CHECK constraints must preserve causal ordering, while retaining explicit source/event timestamps separately when out-of-order arrival is legitimate.

**Trigger**

Create/finalize/heartbeat/checkpoint/complete with a terminal timestamp before the start or prior durable event.

**Current behavior**

Rows can satisfy all current constraints while completed_at precedes started_at, B1 completion precedes cycle start, or checkpoints/heartbeats regress.

**Expected behavior**

Application validation and PostgreSQL CHECK constraints must preserve causal ordering, while retaining explicit source/event timestamps separately when out-of-order arrival is legitimate.

**Impact**

Sorting, retention cutoffs, recovery decisions, duration metrics, and evidence truth can be wrong while rows appear terminal and schema-valid.

**Evidence**

- A
- l
- l
-
- v
- a
- l
- i
- d
- a
- t
- o
- r
- s
-
- s
- h
- o
- w
- n
-
- u
- s
- e
-
- r
- e
- g
- e
- x
- /
- D
- a
- t
- e
- .
- p
- a
- r
- s
- e
-
- s
- h
- a
- p
- e
-
- c
- h
- e
- c
- k
- s
- .
-
- T
- h
- e
-
- m
- i
- g
- r
- a
- t
- i
- o
- n
- s
-
- c
- o
- n
- s
- t
- r
- a
- i
- n
-
- s
- t
- a
- t
- e
- /
- n
- u
- l
- l
-
- c
- o
- m
- b
- i
- n
- a
- t
- i
- o
- n
- s
-
- b
- u
- t
-
- h
- a
- v
- e
-
- n
- o
-
- c
- h
- r
- o
- n
- o
- l
- o
- g
- y
-
- p
- r
- e
- d
- i
- c
- a
- t
- e
- s
- .

**Current files and symbols**

- database/migrations/surebet/001_create_upstream_locks_and_import_runs.sql :: surebet.import_runs :: 16-36 :: 9e42a36b06adc858c25e72c4fd6ab41500cdfdcbbb3e0a7ae556efd2ec771584
- packages/persistence/src/repositories/import-run-repository.ts :: validatePendingRecord / validateFinalizeRecord :: 194-230 :: 9bb1a79b2b27ea6cd3eaaf38cb22bb20148615a2400ff929b834ad2dbd08e00b
- database/migrations/surebet/004_create_worker_jobs.sql :: surebet.worker_jobs and checkpoints :: 1-153 :: 9756445dbfbdac6226413098d1253527578d9420543287842c30d034df162b9c
- database/migrations/surebet/012_create_b1_private_observation_cycles.sql :: surebet.b1_private_observation_cycles :: 1-34 :: 5c4858bb130178460e45226677c6cc74610628badeca3632425c0a0838a474a6
- packages/persistence/src/repositories/b1-private-observation-repository.ts :: validateCreateRecord / validateCompleteRecord / validateBlockRecord :: 220-249; 303-322 :: a057be720b8d7794b5d3a29cac35879ea555a65f2238e085b98fb7ea730f9941

**Source-pinned files and symbols**

- None

**Root cause**

Timestamp syntax validation was not paired with semantic chronology constraints at repository or schema boundaries.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Add explicit chronology validation and CHECK constraints for each state machine; use database authoritative transition time where appropriate; preserve source occurrence time separately from receive/persist time.

**Required tests**

- Import requested/start/complete permutations
- Worker claim/heartbeat/checkpoint/complete regression
- B1 cycle completion before start
- Boundary equality cases
- Migration of any existing invalid rows is fail-closed and reported

**Regression risk**

- Existing test fixtures with equal or synthetic timestamps may need clarification
- Source event timestamps must not be conflated with database transition timestamps

**Unchanged areas**

- Timestamp storage remains timestamptz
- Fixed-point numeric persistence is unchanged

**Documentation integration:** `docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger`

## BWS118-R04-001 | P1 | Completion replay has no immutable event or attempt identity, so duplicates are either rejected as ambiguous or applied twice

- **Aliases:** `none`
- **Source reports:** `BWS118-R04`
- **Source areas:** `R04`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R04`
- **Secondary areas:** `R01 upstream provenance, R03 durable idempotency, R06 retry/cancellation lifecycle, R11 test truth`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Each provider event or execution attempt must carry an immutable identity. An exact duplicate must be idempotent, while the same identity with a different payload must fail closed.

**Trigger**

Submit the same logical fill twice at the same timestamp, or submit it again with a different timestamp.

**Current behavior**

The event contracts have no event ID, attempt ID, source receipt, sequence, or payload digest. Same-leg same-time duplicates are rejected as ordering ambiguity, while a timestamp-shifted duplicate is treated as a second fill and added to the accumulator.

**Expected behavior**

Each provider event or execution attempt must carry an immutable identity. An exact duplicate must be idempotent, while the same identity with a different payload must fail closed.

**Impact**

Restart, retry, or page replay can change filled stake, residual exposure, settlement, and reported profitability. Exact replays are not convergent.

**Evidence**

- The standard event type contains only legId, type, stakeMinor, and occurredAt; the B1 event type likewise contains selection/venue, type, timestamp, and stake.
- Both replay functions sort by timestamp and input index, reject same-leg timestamp ties, and then mutate stake additively without a processed-event identity set.
- The bounded Node 22 harness returned NON_ATOMIC_COMPLETION_EVENT_ORDER_AMBIGUOUS for the exact duplicate but accepted the shifted duplicate and increased the filled YES stake from 100 to 200 minor units.

**Current files and symbols**

- packages/bootstrap/src/simulation/non-atomic-completion.ts :: NonAtomicCompletionEvent :: L38-L43 :: 3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df
- packages/bootstrap/src/simulation/non-atomic-completion.ts :: replayLegEvents / validateNoSameLegTimestampTies :: L375-L504 :: 3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df
- packages/bootstrap/src/simulation/non-atomic-completion.ts :: applyEvent :: L530-L575 :: 3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df
- packages/bootstrap/src/simulation/b1-leg-completion.ts :: B1FillabilityEvent :: L36-L42 :: 108996f173a566dfb8b72de38c364d3f1d7b3610bcceadbe6c415d94a5fc5b3b
- packages/bootstrap/src/simulation/b1-leg-completion.ts :: replayB1FillabilityEvents / validateNoSameLegTimestampTies :: L259-L430 :: 108996f173a566dfb8b72de38c364d3f1d7b3610bcceadbe6c415d94a5fc5b3b

**Source-pinned files and symbols**

- None

**Root cause**

Replay ordering is used as a substitute for event identity and idempotency. The state machine cannot distinguish a retry from a second real fill.

**Cross-area dependencies**

- BWS116-R01-003
- BWS116-R01-004
- BWS116-R03-014
- BWS116-R03-016

**Minimal fix boundary**

Add an immutable provider-event/attempt identity and source receipt to the standard and B1 completion event boundaries, make replay create-or-compare idempotent by that identity, and preserve conflict evidence. Durable transaction mechanics remain R03-owned.

**Required tests**

- Exact duplicate event in the same and different array positions is a no-op.
- Same immutable event ID with any changed type, stake, leg, timestamp, or receipt is blocked.
- Restart/replay permutation tests produce byte-identical completion and residual snapshots.
- Durable duplicate delivery test handed to R03 verifies one economic effect after crash and retry.

**Regression risk**

- Event schema compatibility
- Migration or persistence changes if identities become durable
- Provider adapters that cannot yet supply a stable event identity

**Unchanged areas**

- Stake-vector mathematics
- Supported event-type transition guards
- BWS-900 no-execution hold

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R04/BWS118-R04-report.md and cumulative Wave 02 ledger`

## BWS118-R04-002 | P1 | Fill simulation records stake only and reuses planned odds and cash-flow terms instead of actual execution terms

- **Aliases:** `none`
- **Source reports:** `BWS118-R04`
- **Source areas:** `R04`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R04`
- **Secondary areas:** `R01 provenance, R02 numeric/economic authority, R03 durable fill storage, R07 evidence publication`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

A fill must preserve actual stake, price/odds, fees/costs, source time, receive time, provider generation, and immutable receipt before residual or settlement economics are calculated.

**Trigger**

Replay a fill event that should carry actual execution price/odds, fee, slippage, capacity source, or provider receipt.

**Current behavior**

Standard and B1 fill events contain only stake and time. Residual exposure scales the precomputed plan matrix by filled stake, and B1 settlement calculates payout from the planned scenario rows. No actual execution price, fee, slippage, or source receipt can affect the result.

**Expected behavior**

A fill must preserve actual stake, price/odds, fees/costs, source time, receive time, provider generation, and immutable receipt before residual or settlement economics are calculated.

**Impact**

Simulated residual loss, settled net, and false-positive classification can be materially wrong even when fill quantity is correct. The system cannot audit a deviation between quoted, planned, and executed terms.

**Evidence**

- The event interfaces have no price/odds, fee, slippage, contract, generation, or receipt fields.
- Standard residual exposure multiplies planned per-unit matrix contributions by live filled units.
- B1 residual and settlement scale planned scenario payout rows by live fill and subtract only stake.

**Current files and symbols**

- packages/bootstrap/src/simulation/non-atomic-completion.ts :: NonAtomicCompletionEvent :: L38-L43 :: 3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df
- packages/bootstrap/src/simulation/b1-leg-completion.ts :: B1FillabilityEvent :: L36-L42 :: 108996f173a566dfb8b72de38c364d3f1d7b3610bcceadbe6c415d94a5fc5b3b
- packages/bootstrap/src/simulation/non-atomic-completion.ts :: analyzeNonAtomicResidualExposure / sumScenarioNetForLiveFilledUnits :: L701-L802 :: 3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df
- packages/bootstrap/src/simulation/b1-residual-exposure.ts :: buildScenarioNets :: L200-L245 :: 95752368da2da1bae3778ca9eae94892cb06db0876a8655beba9c6127c26a516
- packages/bootstrap/src/simulation/b1-settlement-replay.ts :: calculateSettledNetMinor :: L705-L745 :: d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d

**Source-pinned files and symbols**

- None

**Root cause**

The completion boundary models quantity transitions but not execution terms, while downstream economics assume planned matrix terms remain authoritative after fill.

**Cross-area dependencies**

- BWS116-R01-004
- BWS116-R02-004
- BWS116-R02-005
- BWS116-R02-014

**Minimal fix boundary**

Introduce immutable actual-fill terms and a quote-to-fill receipt at the simulation boundary, then compute residual and settlement from accepted actuals. Pure quote and solver mathematics remain R02-owned.

**Required tests**

- Adverse and favorable slippage change residual and settled net deterministically.
- Fill fee and fixed fee are included exactly once.
- Planned quote identity differs from actual fill receipt and is preserved rather than overwritten.
- Missing actual execution terms block any metric that claims settled or residual economics.

**Regression risk**

- Compatibility with existing fixtures
- Avoid double-counting R02 fee calculations
- Fixed-point scale migration

**Unchanged areas**

- Candidate derivation
- Stake-vector feasibility
- No-live-write boundary

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R04/BWS118-R04-report.md and cumulative Wave 02 ledger`

## BWS118-R04-003 | P1 | Standard partial fill followed by rejection or expiry loses the terminal disposition in the public leg snapshot

- **Aliases:** `none`
- **Source reports:** `BWS118-R04`
- **Source areas:** `R04`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R04`
- **Secondary areas:** `R03 durable state, R05 API/cockpit projection, R07 evidence reports`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

The snapshot must preserve both the partial filled quantity and the terminal disposition of the unfilled remainder, or expose an exhaustive compound state.

**Trigger**

Replay fill(less than plan) followed by reject or expire on the same leg.

**Current behavior**

The accumulator stores terminalDisposition internally, but the public snapshot omits it. deriveLegState checks liveFilledStakeMinor before terminalDisposition and therefore emits leg_partial, making partial+rejected and partial+expired indistinguishable from a still-open partial leg.

**Expected behavior**

The snapshot must preserve both the partial filled quantity and the terminal disposition of the unfilled remainder, or expose an exhaustive compound state.

**Impact**

Reports, recovery, settlement, and operators cannot tell whether more fill is possible or whether the remainder is terminal. State may appear nonterminal after a terminal provider outcome.

**Evidence**

- reject/expire sets terminalDisposition and clears reservation.
- freezeLegSnapshot does not serialize terminalDisposition.
- deriveLegState returns leg_partial whenever any live fill exists before checking rejected/expired.
- The bounded harness accepted partial fill then reject and serialized the leg only as leg_partial.

**Current files and symbols**

- packages/bootstrap/src/simulation/non-atomic-completion.ts :: LegAccumulator :: L100-L107 :: 3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df
- packages/bootstrap/src/simulation/non-atomic-completion.ts :: applyEvent reject/expire :: L577-L612 :: 3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df
- packages/bootstrap/src/simulation/non-atomic-completion.ts :: freezeLegSnapshot / deriveLegState :: L637-L679 :: 3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df

**Source-pinned files and symbols**

- None

**Root cause**

The standard state model compresses two independent dimensions, fill quantity and terminal disposition, into one precedence-ordered enum and drops the secondary dimension.

**Cross-area dependencies**

- BWS116-R03-014

**Minimal fix boundary**

Expose terminalDisposition in NonAtomicPaperLegSnapshot or replace the enum with an exhaustive compound lifecycle representation; update settlement/report consumers without changing B1 semantics unnecessarily.

**Required tests**

- Partial+rejected and partial+expired snapshots retain both quantity and terminal disposition.
- Recovery and report round trips preserve the compound state.
- A subsequent fill after terminal remains blocked.
- An open partial leg remains distinguishable from a terminal partial leg.

**Regression risk**

- Schema and report compatibility
- State-name migrations
- Avoid allowing terminal reopen implicitly

**Unchanged areas**

- B1 snapshot already carries terminalDisposition
- Residual arithmetic
- Manual kill semantics

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R04/BWS118-R04-report.md and cumulative Wave 02 ledger`

## BWS118-R04-004 | P1 | Manual or residual-floor kill is an unordered boolean that can retroactively relabel a fully completed group as killed

- **Aliases:** `none`
- **Source reports:** `BWS118-R04`
- **Source areas:** `R04`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R04`
- **Secondary areas:** `R03 durable transition storage, R06 cancellation/shutdown, R07 kill evidence publication`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Kill must be an ordered lifecycle event with identity and timestamp, and it must not rewrite economic facts that completed before the kill. The model must distinguish stop-future-work from cancellation, liquidation, and completed exposure.

**Trigger**

Evaluate a completed event history with manualKill=true or trigger the residual-floor kill rerun.

**Current behavior**

manualKill is an input boolean outside the ordered event stream. deriveGroupState returns group_killed before checking whether every leg is filled. The private runtime may rerun the identical completion history with only manualKill changed to true.

**Expected behavior**

Kill must be an ordered lifecycle event with identity and timestamp, and it must not rewrite economic facts that completed before the kill. The model must distinguish stop-future-work from cancellation, liquidation, and completed exposure.

**Impact**

A fully completed portfolio can be represented as killed without saying when or what was stopped. Reports cannot reconstruct whether the kill preceded fills, followed completion, or had any economic effect.

**Evidence**

- NonAtomicCompletionInput carries manualKill separately from events.
- deriveGroupState gives manualKill absolute precedence over group_complete.
- The private runtime repeats the same events with manualKill=true when the residual floor is crossed.
- The bounded harness produced group_killed with both legs leg_filled.

**Current files and symbols**

- packages/bootstrap/src/simulation/non-atomic-completion.ts :: NonAtomicCompletionInput :: L80-L85 :: 3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df
- packages/bootstrap/src/simulation/non-atomic-completion.ts :: freezeCompletionSnapshot / deriveGroupState :: L649-L698 :: 3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df
- packages/bootstrap/src/runtime/private-paper-runtime.ts :: simulateRuntimeCandidate :: L878-L924 :: 252e38a52693f3fa598c9ea92a83b184de0c4b29c4ab0bd5c952b750d009c6f5

**Source-pinned files and symbols**

- None

**Root cause**

Kill authority is modeled as an unordered final label instead of an immutable, causally ordered transition with a defined effect.

**Cross-area dependencies**

- BWS116-R03-011

**Minimal fix boundary**

Represent kill request/acceptance/effect as explicit ordered evidence, define terminal precedence, and preserve completed fills and post-kill prohibited work separately. Generic cancellation propagation remains R06-owned.

**Required tests**

- Kill before any fill prevents subsequent modeled work and retains kill time/receipt.
- Kill after full completion preserves group_complete plus a separate post-completion stop marker.
- Residual-floor kill has deterministic trigger evidence and no duplicate rerun effect.
- Permutation and restart tests retain causal order.

**Regression risk**

- Existing report status compatibility
- Avoid implying unwind or rollback
- Coordination with runtime cancellation semantics

**Unchanged areas**

- Fill transition validation
- Settlement outcome calculation
- BWS-900 parked state

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R04/BWS118-R04-report.md and cumulative Wave 02 ledger`

## BWS118-R04-005 | P1 | B1 settlement and false-positive economics omit fees, quote-age penalties, and capital-lock cost accepted by net evaluation

- **Aliases:** `none`
- **Source reports:** `BWS118-R04`
- **Source areas:** `R04`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R04`
- **Secondary areas:** `R02 economics, R03 persistence, R07 evidence metrics`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Settlement and false-positive classification must carry forward every accepted economic cost exactly once, or explicitly reconcile actual settlement costs against the net model.

**Trigger**

Compare netCandidate.worstCaseNetMinor with settlementReplay.settledNetMinor under nonzero accepted costs.

**Current behavior**

Net evaluation subtracts total fees, quote-age penalties, and capital-lock cost. Settlement replay ignores those values and computes each leg as planned payout minus live filled stake. falsePositive is then based on this gross settlement number.

**Expected behavior**

Settlement and false-positive classification must carry forward every accepted economic cost exactly once, or explicitly reconcile actual settlement costs against the net model.

**Impact**

A net-negative or materially weaker result can be reported as a positive settled result and not counted as a false positive. Backtest profitability is internally inconsistent across stages.

**Evidence**

- evaluateB1NetEconomics calculates totalFeeMinor, totalQuoteAgePenaltyMinor, capitalLockCostMinor, and net scenario cash flows.
- B1 scenario rows contain only stake and payout.
- calculateSettledNetMinor subtracts filled stake only.
- The bounded harness produced planned worst-case net 964 minor units but settled net 1000 minor units from the same candidate.

**Current files and symbols**

- packages/bootstrap/src/economics/b1-net-spread.ts :: evaluateB1NetEconomics :: L114-L214 :: 0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b
- packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts :: B1ScenarioCashflowRow / buildB1ScenarioCashflowMatrix :: L11-L87 :: f48a4d0f697fcc2d9d48328ef665689807f3f97d6c74fbcba67b01520293a580
- packages/bootstrap/src/simulation/b1-settlement-replay.ts :: analyzeB1SettlementReplay :: L168-L203 :: d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d
- packages/bootstrap/src/simulation/b1-settlement-replay.ts :: calculateSettledNetMinor :: L705-L745 :: d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d

**Source-pinned files and symbols**

- None

**Root cause**

The backtest passes only the stake/payout scenario matrix and fillability snapshots into settlement, dropping the net-economics cost ledger at the stage boundary.

**Cross-area dependencies**

- BWS116-R02-004
- BWS116-R02-005
- BWS116-R02-014

**Minimal fix boundary**

Bind settlement analysis to the accepted net-economics cost breakdown or a settlement-cost ledger and define cost reconciliation. R02 retains ownership of cost formulas and fee expressiveness.

**Required tests**

- Nonzero percentage fee reduces settled net exactly once.
- Quote-age and capital-lock costs survive fill and settlement stages.
- A candidate whose gross settlement is positive but net settlement is nonpositive is marked false positive.
- Zero-cost control retains existing result.

**Regression risk**

- Avoid double charging costs
- Partial-fill cost allocation
- Scenario-conditional fee limitations inherited from R02

**Unchanged areas**

- Gross candidate derivation
- B1 fill state machine
- No-live-operation markers

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R04/BWS118-R04-report.md and cumulative Wave 02 ledger`

## BWS118-R04-006 | P1 | Settlement domains cannot represent void, refund, push, reopen, or generation lifecycle despite claiming replay coverage

- **Aliases:** `none`
- **Source reports:** `BWS118-R04`
- **Source areas:** `R04`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R04`
- **Secondary areas:** `R01 upstream contract/currentness, R02 scenario semantics, R03 persistence, R05 projection, R07 evidence`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

The replay contract must encode the native terminal action, monetary consequence, revision/supersession relation, generation, and reopen/finality state without coercing it to a winner.

**Trigger**

Supply lifecycle evidence that is not simply a yes/no or one B1 selection final outcome.

**Current behavior**

The standard consumed record supports only finalOutcome yes/no. The B1 record supports one finalOutcomeSelectionEquivalenceKey plus static settlementRuleVersion/voidRuleId compatibility. The B1 “void-rule replay” only verifies equal IDs and never represents an actual void, refund amount, push, reopen, or supersession event.

**Expected behavior**

The replay contract must encode the native terminal action, monetary consequence, revision/supersession relation, generation, and reopen/finality state without coercing it to a winner.

**Impact**

Unsupported terminal events cannot be faithfully replayed. They may be blocked elsewhere, coerced into a winner, or omitted from reports, and no deterministic recovery contract exists for reopened outcomes.

**Evidence**

- ConsumedSettlementReplay finalOutcome is a closed yes/no union.
- B1SettlementReplayRecord has no terminal action or monetary adjustment field.
- validateB1VoidRuleReplay returns compatibility metadata after comparing static rule IDs; it consumes no void/refund occurrence.
- Repository documentation promises void/refund/correction replay, but the executable R04 contracts do not contain those states.

**Current files and symbols**

- packages/bootstrap/src/simulation/settlement-replay.ts :: ConsumedSettlementReplay :: L19-L29 :: 7967faca4d58a884c8c6762aaccac6fd1f04c630a3d5632f54c273202c89e8d2
- packages/bootstrap/src/simulation/b1-settlement-replay.ts :: B1SettlementReplayRecord :: L30-L35 :: d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d
- packages/bootstrap/src/simulation/b1-void-rule-replay.ts :: B1VoidRuleReplayRecord / validateB1VoidRuleReplay :: L8-L85 :: 107607954dc2d9cf911e51e8e68d39592d4b5d8f06cddfcdb018ed92212ad2fb

**Source-pinned files and symbols**

- None

**Root cause**

Rule compatibility identifiers are treated as if they were lifecycle evidence, while the replay state machines model only winner replacement over time.

**Cross-area dependencies**

- BWS116-R01-004
- BWS116-R01-010

**Minimal fix boundary**

Add explicit provider-bound terminal lifecycle records and monetary effects, with unsupported states held fail-closed. Canonical upstream rule semantics remain external/R10-owned; BWS replay projection is R04-owned.

**Required tests**

- Void with full refund, partial refund, push, cancellation, and reopen cases.
- Generation change or reorg cannot join the prior lifecycle without explicit authority.
- Unsupported terminal action remains held and never produces settled profitability.
- Round-trip replay preserves action, amount, currency, revision, and source receipt.

**Regression risk**

- Contract versioning
- Provider-specific rule differences
- Historical fixture compatibility

**Unchanged areas**

- Static settlement-rule compatibility checks
- Candidate identity
- No execution

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R04/BWS118-R04-report.md and cumulative Wave 02 ledger`

## BWS118-R04-007 | P1 | Correction and finality progression are inferred from timestamp and outcome changes without explicit revision authority

- **Aliases:** `none`
- **Source reports:** `BWS118-R04`
- **Source areas:** `R04`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R04`
- **Secondary areas:** `R01 provenance/currentness, R03 durable ordering, R05 API projection, R07 evidence`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Every correction or finality advance must be explicitly bound to a monotonic provider revision, superseded record, transition type, generation, and authoritative receipt.

**Trigger**

Add a later replay with the same outcome or a different outcome, regardless of whether it declares a correction or finality transition.

**Current behavior**

Both standard and B1 replay sequences count a later same-outcome record as finality progression and a later different-outcome record as correction solely by timestamp and value comparison. There is no revision number, supersedes hash, correction reason, prior-state digest, or finality-state field.

**Expected behavior**

Every correction or finality advance must be explicitly bound to a monotonic provider revision, superseded record, transition type, generation, and authoritative receipt.

**Impact**

Unrelated duplicate snapshots, delayed pages, mixed generations, or reordered retained evidence can manufacture corrections/finality and select an arbitrary latest result.

**Evidence**

- The sequence sort uses accepted time plus manifest hash.
- One authority ID and strict timestamp inequality are the only progression constraints.
- The bounded harness submitted three later groups and obtained correctionCount=1 and finalityProgressionCount=1 without any explicit transition evidence.

**Current files and symbols**

- packages/bootstrap/src/simulation/settlement-replay.ts :: consumeStandardBinarySettlementReplaySequence :: L333-L392 :: 7967faca4d58a884c8c6762aaccac6fd1f04c630a3d5632f54c273202c89e8d2
- packages/bootstrap/src/simulation/b1-settlement-replay.ts :: resolveB1SettlementReplaySequence :: L400-L445 :: d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d

**Source-pinned files and symbols**

- None

**Root cause**

Temporal succession is conflated with semantic supersession and finality progression.

**Cross-area dependencies**

- BWS116-R01-004
- BWS116-R01-010
- BWS116-R03-017

**Minimal fix boundary**

Require explicit revision/supersession/finality transition evidence and reject gaps, forks, regressions, mixed generations, or unverifiable latest pointers. Upstream provenance fields remain R01-owned.

**Required tests**

- Same-outcome duplicate snapshot does not advance finality without transition evidence.
- Changed outcome does not count as correction without explicit supersession.
- Revision gaps, forks, regressions, mixed generations, and equal revisions conflict deterministically.
- Permutation/restart tests resolve one identical authoritative chain.

**Regression risk**

- Provider revision availability
- Historical fixtures without revisions
- Interaction with retained-currentness semantics

**Unchanged areas**

- Per-manifest B1 leg completeness
- Finality authority equality check
- Static void-rule ID check

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R04/BWS118-R04-report.md and cumulative Wave 02 ledger`

## BWS118-R04-008 | P1 | B1 backtest has no cross-stage decision chronology and accepts settlement before quotes with fills after settlement

- **Aliases:** `none`
- **Source reports:** `BWS118-R04`
- **Source areas:** `R04`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R04`
- **Secondary areas:** `R01 time/currentness, R03 durable timestamp constraints, R11 adversarial tests`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Backtest orchestration must bind one explicit decision time and require source observations at or before decision, completion events at or after decision, and settlement strictly after the final completion event.

**Trigger**

Place settlement replay time before quote comparison and fill events after settlement.

**Current behavior**

B1CrossVenueBacktestPlan contains no decision timestamp. runCandidateBacktest validates stages independently and never compares quote, decision, fill, or settlement times. The impossible temporal sequence is accepted.

**Expected behavior**

Backtest orchestration must bind one explicit decision time and require source observations at or before decision, completion events at or after decision, and settlement strictly after the final completion event.

**Impact**

Lookahead and post-settlement fills can generate accepted B1 profitability evidence. The run cannot prove that only information available at decision time was consumed.

**Evidence**

- The B1 plan interface contains policy, events, residual limit, and settlement records but no decision time.
- The orchestration calls gross, solver, net, fillability, and settlement sequentially without temporal cross-checks.
- The bounded harness accepted settlement at 2026-06-30T23:00Z, quote comparison at 2026-07-01T00:00:02.250Z, and fills on 2026-07-02.
- The standard backtest contains explicit decision/settlement and completion-window guards, showing the missing B1 boundary is not an unavoidable design limitation.

**Current files and symbols**

- packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts :: B1CrossVenueBacktestPlan :: L20-L29 :: b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4
- packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts :: runCandidateBacktest :: L372-L429 :: b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4
- packages/bootstrap/src/backtest/standard-binary-backtest.ts :: validateExecutionPlanTemporalWindow / validateCompletionEventWindow :: L465-L568 :: b89833bedd366b9d4b714cb0eddd6610e5eabd7217477063d7a1a2006b60e438

**Source-pinned files and symbols**

- None

**Root cause**

B1 orchestration composes locally valid artifacts without a shared temporal authority or monotonic cross-stage invariant.

**Cross-area dependencies**

- BWS116-R01-010
- BWS116-R03-017

**Minimal fix boundary**

Add a B1 decision timestamp and cross-stage time validation at orchestration input, binding quote source/receive/comparison, fills, and settlement. Durable timestamp constraints remain R03-owned.

**Required tests**

- Settlement before decision is blocked.
- Fill before decision and fill at/after settlement are blocked.
- Future quote or changed data after decision is blocked.
- Boundary equality behavior is specified and tested.
- Standard and B1 chronology tests share explicit invariant fixtures without sharing implementation outputs.

**Regression risk**

- Fixture schema change
- Time-zone and precision consistency
- Interaction with R01 source/receive time

**Unchanged areas**

- Standard backtest chronology guards
- B1 pure math
- BWS-900 hold

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R04/BWS118-R04-report.md and cumulative Wave 02 ledger`

## BWS118-R04-009 | P1 | B1 report labels in-limit incomplete, rejected, or timed-out simulations as accepted and fillable while discarding leg state

- **Aliases:** `none`
- **Source reports:** `BWS118-R04`
- **Source areas:** `R04`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R04`
- **Secondary areas:** `R03 persistence, R05 API/cockpit, R07 evidence acceptance, R11 validator truth`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Report status must distinguish fully filled, incomplete-with-residual, rejected, timed-out, settled, and unreconciled states. “Fillable” must not mean merely that the pipeline returned ok.

**Trigger**

Run a candidate with a partially filled rejected leg and another timed-out leg whose residual remains inside the limit.

**Current behavior**

Any candidate result that reaches settlement is mapped to status=accepted, stage=accepted. The summary drops fillability group state, leg snapshots, terminal dispositions, residual exposure, and exposure-limit status. calculateMetrics sets fillableCandidateCount to the number of accepted summaries.

**Expected behavior**

Report status must distinguish fully filled, incomplete-with-residual, rejected, timed-out, settled, and unreconciled states. “Fillable” must not mean merely that the pipeline returned ok.

**Impact**

A rejected/timed-out partial portfolio is reported as fillable and can satisfy acceptance gates. Operators cannot see the residual state from the report.

**Evidence**

- simulateB1FillRejectionTimeout intentionally returns accepted for in-limit group_incomplete states.
- toReportCandidateSummary maps every successful pipeline result to accepted without lifecycle fields.
- calculateMetrics equates acceptedCandidates.length with fillableCandidateCount.
- The bounded harness accepted a 5000/10000 rejected leg plus a zero-fill timed-out leg and reported fillableCandidateCount=1 with status/stage accepted.

**Current files and symbols**

- packages/bootstrap/src/simulation/b1-leg-completion.ts :: simulateB1FillRejectionTimeout :: L83-L135 :: 108996f173a566dfb8b72de38c364d3f1d7b3610bcceadbe6c415d94a5fc5b3b
- packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts :: toReportCandidateSummary :: L452-L493 :: b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4
- packages/bootstrap/src/reporting/b1-backtest-report.ts :: B1BacktestReportCandidateSummary :: L6-L25 :: 8c8cbc440a521c4ee32de8bde89c547fe3c97c36d43935008c3f0b39a2657272
- packages/bootstrap/src/reporting/b1-backtest-report.ts :: calculateMetrics :: L369-L419 :: 8c8cbc440a521c4ee32de8bde89c547fe3c97c36d43935008c3f0b39a2657272
- packages/bootstrap/src/operations/b1-runtime-evidence.ts :: runtimeAcceptanceMetrics :: L485-L514 :: 80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8

**Source-pinned files and symbols**

- None

**Root cause**

The report collapses “pipeline completed with analyzable residual exposure” into “accepted/fillable” and its schema lacks the state needed to preserve that distinction.

**Cross-area dependencies**

- BWS116-R02-005
- BWS116-R03-016

**Minimal fix boundary**

Expand candidate summaries and metrics to preserve fill group state, terminal dispositions, residual exposure, reconciliation state, and distinct fillability classification. Public UI projection remains R05-owned.

**Required tests**

- Fully filled and incomplete-in-limit candidates produce different report states and counters.
- Rejected/timed-out leg details survive report serialization and hashing.
- Acceptance gates do not count incomplete candidates as filled.
- Blocked, incomplete, settled, and fully filled states remain mutually exclusive.

**Regression risk**

- Report hash/version change
- Acceptance threshold recalibration
- Cockpit/API consumer compatibility

**Unchanged areas**

- B1 residual limit calculation
- Candidate identity markers
- No-live-readiness markers

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R04/BWS118-R04-report.md and cumulative Wave 02 ledger`

## BWS118-R04-010 | P1 | B1 false-positive analysis excludes failures before settlement and computes the rate only over accepted settlements

- **Aliases:** `none`
- **Source reports:** `BWS118-R04`
- **Source areas:** `R04`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R04`
- **Secondary areas:** `R02 pure economics, R07 acceptance evidence, R11 test/validator truth`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

The falsification denominator and stage metrics must account for every derived candidate and distinguish pre-settlement false positives, fill failures, blocked/unknown settlement, and accepted settlement outcomes.

**Trigger**

Include candidates that fail before settlement and a mix of accepted and blocked settlement observations.

**Current behavior**

The backtest adds false-positive observations only for fully successful candidates and settlement-stage blockers. Gross, solver, net, and fillability failures disappear. createB1FalsePositiveReport divides falsePositiveCount by acceptedSettlementCount only, excluding blocked settlements from the rate.

**Expected behavior**

The falsification denominator and stage metrics must account for every derived candidate and distinguish pre-settlement false positives, fill failures, blocked/unknown settlement, and accepted settlement outcomes.

**Impact**

The reported false-positive rate can improve when more candidates fail or remain unknown. It cannot measure end-to-end candidate false positives or compare candidate-to-fill-to-settlement attrition truthfully.

**Evidence**

- Observation collection has branches only for candidateResult.ok and candidateResult.stage===settlement.
- The report tracks accepted and blocked settlement counts but uses only acceptedSettlementCount as denominator.
- The bounded harness with one accepted and one blocked observation returned a 0 bps rate based solely on the accepted observation.

**Current files and symbols**

- packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts :: falsePositiveObservations collection :: L100-L121 :: b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4
- packages/bootstrap/src/reporting/b1-false-positive-report.ts :: createB1FalsePositiveReport :: L31-L100 :: 55d3a251830501a284214bac6e94a16eb3f194fcce33195df5e3ee37cb985f95

**Source-pinned files and symbols**

- None

**Root cause**

The falsification model is settlement-only, but its name and downstream acceptance usage imply end-to-end candidate false-positive analysis.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Define explicit stage denominators and an end-to-end candidate outcome taxonomy; include every derived candidate exactly once and keep blocked/unknown rates separate from accepted settlement rates.

**Required tests**

- Gross, stake, net, fillability, and settlement failures each appear in stage counts.
- Blocked/unknown settlements cannot reduce the accepted-outcome false-positive rate silently.
- End-to-end denominator equals unique derived candidates.
- Duplicate candidate IDs and reordered observations do not alter counts.

**Regression risk**

- Historical metric comparability
- Acceptance threshold semantics
- Do not call operational blockage economic false positive

**Unchanged areas**

- Settlement blocker code classification
- Private-only/no-profit markers
- Candidate derivation ordering

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R04/BWS118-R04-report.md and cumulative Wave 02 ledger`

## BWS118-R04-011 | P1 | B1 marketsCompared counts venue-pair candidates rather than unique markets and can inflate the 50,000-market gate

- **Aliases:** `none`
- **Source reports:** `BWS118-R04`
- **Source areas:** `R04`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R04`
- **Secondary areas:** `R02 market identity, R07 runtime acceptance, R11 validator truth`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

marketsCompared must count unique market identities, separately from candidate and venue-pair counts.

**Trigger**

Generate three candidate summaries for one marketEquivalenceKey across three venue pairs.

**Current behavior**

calculateMetrics sets marketsCompared=candidates.length and candidateCount=candidates.length. Candidate derivation emits one candidate per market and venue pair, so one market is counted repeatedly. Runtime acceptance trusts this value for minimumMarketsCompared.

**Expected behavior**

marketsCompared must count unique market identities, separately from candidate and venue-pair counts.

**Impact**

A run can satisfy the minimum 50,000 market requirement with materially fewer unique markets, creating false data-coverage readiness.

**Evidence**

- B1 candidate derivation iterates venue pairs within a market group.
- Report code assigns candidate length to marketsCompared.
- Runtime evidence compares that report field directly with minimumMarketsCompared.
- The bounded report harness supplied three venue-pair candidates for one market and returned marketsCompared=3, candidateCount=3, uniqueEvents=1.

**Current files and symbols**

- packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts :: deriveB1CrossVenueGrossOpportunityCandidates :: L88-L142 :: 29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543
- packages/bootstrap/src/reporting/b1-backtest-report.ts :: calculateMetrics :: L369-L419 :: 8c8cbc440a521c4ee32de8bde89c547fe3c97c36d43935008c3f0b39a2657272
- packages/bootstrap/src/operations/b1-runtime-evidence.ts :: dataCoverageBlockers / runtimeAcceptanceMetrics :: L418-L500 :: 80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8

**Source-pinned files and symbols**

- None

**Root cause**

The report has no independent unique-market set and aliases a coverage metric to the candidate cardinality.

**Cross-area dependencies**

- BWS116-R02-002
- BWS116-R02-007

**Minimal fix boundary**

Derive marketsCompared from unique canonical market/equivalence identity, retain candidateCount separately, and bind acceptance to the corrected metric.

**Required tests**

- Multiple venue pairs for one market count as one market and multiple candidates.
- Same market across duplicate rows remains one market.
- Distinct markets on one event count separately.
- Runtime threshold test proves candidate multiplication cannot satisfy market coverage.

**Regression risk**

- Acceptance baselines may fall after correction
- Market identity dependency on R02
- Historical report hash changes

**Unchanged areas**

- Unique-event deduplication
- Venue-pair counting
- Candidate IDs

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R04/BWS118-R04-report.md and cumulative Wave 02 ledger`

## BWS118-R04-012 | P1 | Standard backtest and private-paper strategy reports discard per-leg lifecycle evidence while labeling candidates accepted_local_evidence

- **Aliases:** `none`
- **Source reports:** `BWS118-R04`
- **Source areas:** `R04`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R04`
- **Secondary areas:** `R03 persistence, R05 API/cockpit, R07 evidence publication, R11 artifact tests`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

The accepted evidence report must retain the exact completion snapshots, terminal dispositions, event/receipt identities, residual scenario evidence, and reconciliation state needed to audit the acceptance label.

**Trigger**

Project an accepted backtest/private-paper result into SurebetStrategyCandidateReport.

**Current behavior**

Standard accepted results retain only aggregate group state, counts, filled/excluded IDs, settlement, and optional residual summary. The strategy report reduces this further to completionGroupState, settledNetMinor, finalOutcome, and optional killReason, then labels it accepted_local_evidence.

**Expected behavior**

The accepted evidence report must retain the exact completion snapshots, terminal dispositions, event/receipt identities, residual scenario evidence, and reconciliation state needed to audit the acceptance label.

**Impact**

Partial, rejected, expired, rolled-back, or kill-order facts can disappear from the authoritative report. Consumers cannot independently prove that accepted_local_evidence is consistent with the underlying lifecycle.

**Evidence**

- StandardBinaryBacktestAcceptedCandidateResult has no leg snapshots or completion event records.
- PrivatePaperRuntimeAcceptedCandidateResult likewise carries aggregate IDs rather than the complete replay evidence.
- SurebetStrategyCandidateReport has nine scalar/array fields and no per-leg/event evidence.
- Both mapping functions assign resultState=accepted_local_evidence for any accepted candidate result.

**Current files and symbols**

- packages/bootstrap/src/backtest/standard-binary-backtest.ts :: StandardBinaryBacktestAcceptedCandidateResult :: L43-L62 :: b89833bedd366b9d4b714cb0eddd6610e5eabd7217477063d7a1a2006b60e438
- packages/bootstrap/src/backtest/standard-binary-backtest.ts :: createAcceptedCandidateResult :: L571-L607 :: b89833bedd366b9d4b714cb0eddd6610e5eabd7217477063d7a1a2006b60e438
- packages/bootstrap/src/runtime/private-paper-runtime.ts :: PrivatePaperRuntimeAcceptedCandidateResult :: L106-L126 :: 252e38a52693f3fa598c9ea92a83b184de0c4b29c4ab0bd5c952b750d009c6f5
- packages/bootstrap/src/runtime/private-paper-runtime.ts :: create accepted runtime candidate result :: L1161-L1191 :: 252e38a52693f3fa598c9ea92a83b184de0c4b29c4ab0bd5c952b750d009c6f5
- packages/bootstrap/src/strategy/strategy-ledger.ts :: SurebetStrategyCandidateReport :: L113-L123 :: d05e339a5692a9218f2146c153570ee7d9c8d79ae88282e162b7ece0c0cb5dbc
- packages/bootstrap/src/strategy/strategy-ledger.ts :: toBacktestCandidateReport / toPrivatePaperCandidateReport :: L795-L841 :: d05e339a5692a9218f2146c153570ee7d9c8d79ae88282e162b7ece0c0cb5dbc

**Source-pinned files and symbols**

- None

**Root cause**

Evidence projection is lossy at two consecutive boundaries and the acceptance label is derived from pipeline success rather than an independently auditable lifecycle packet.

**Cross-area dependencies**

- BWS116-R01-003
- BWS116-R01-004
- BWS116-R03-014
- BWS116-R03-016

**Minimal fix boundary**

Preserve or content-address the full completion/reconciliation packet in accepted candidate reports and bind the acceptance label to that immutable evidence. API/UI rendering remains R05-owned; publication lineage remains R07-owned.

**Required tests**

- Per-leg terminal and quantity state survives backtest/private report generation.
- Report digest changes when any underlying event or snapshot changes.
- A consumer can validate accepted_local_evidence without an in-memory source object.
- Killed and incomplete candidates cannot appear equivalent to fully completed candidates.

**Regression risk**

- Larger report artifacts
- Backward compatibility and report hashes
- Retention/reference requirements

**Unchanged areas**

- Upstream lock reference fields
- Privacy=private_only
- No public profitability claim

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R04/BWS118-R04-report.md and cumulative Wave 02 ledger`

## BWS118-R04-013 | P2 | B1 false-positive report throws on malformed top-level or observation objects instead of returning a blocked boundary result

- **Aliases:** `none`
- **Source reports:** `BWS118-R04`
- **Source areas:** `R04`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R04`
- **Secondary areas:** `R11 aggregate boundary tests`
- **Repository severity:** `P2`
- **Normalized severity:** `P2`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

All public boundary helpers must validate container and field types before dereference and return BoundaryResult blockers for malformed input.

**Trigger**

Call createB1FalsePositiveReport(null) or pass {settlementStatus:"accepted"} as an observation.

**Current behavior**

The function immediately reads observations.length and the validator immediately calls observation.candidateId.trim() without checking object or string shape. Malformed input throws TypeError.

**Expected behavior**

All public boundary helpers must validate container and field types before dereference and return BoundaryResult blockers for malformed input.

**Impact**

A malformed retained report or caller bug can crash a bounded backtest/report process rather than producing explicit blocker evidence. Diagnostics and batch isolation are weakened.

**Evidence**

- No Array.isArray check precedes observations.length.
- No object/string guard precedes candidateId.trim().
- Both malformed cases were reproduced in bounded Node 22 harnesses.

**Current files and symbols**

- packages/bootstrap/src/reporting/b1-false-positive-report.ts :: createB1FalsePositiveReport :: L31-L100 :: 55d3a251830501a284214bac6e94a16eb3f194fcce33195df5e3ee37cb985f95
- packages/bootstrap/src/reporting/b1-false-positive-report.ts :: validateB1FalsePositiveObservation :: L102-L163 :: 55d3a251830501a284214bac6e94a16eb3f194fcce33195df5e3ee37cb985f95

**Source-pinned files and symbols**

- None

**Root cause**

The report helper relies on TypeScript compile-time shape guarantees at a runtime boundary that is called with deserialized/untrusted structures elsewhere in the repository.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Add top-level array and per-observation structural validation before dereference; return stable blocker codes and preserve current valid-output shape.

**Required tests**

- null, object, string, sparse array, null observation, missing candidateId, and non-string candidateId return blockers without throwing.
- Valid accepted and blocked observations remain unchanged.
- Batch runner continues after one malformed report input where policy permits.

**Regression risk**

- Blocker code compatibility
- Avoid masking programmer invariants as user input
- Performance for large arrays

**Unchanged areas**

- Valid report arithmetic
- Settlement blocker classification
- Runtime acceptance semantics

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R04/BWS118-R04-report.md and cumulative Wave 02 ledger`

## BWS118-R04-014 | P2 | Exported partial-fill status falsely identifies a legacy state machine that has no partial-fill state

- **Aliases:** `none`
- **Source reports:** `BWS118-R04`
- **Source areas:** `R04`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R04`
- **Secondary areas:** `R11 tests/validators/manifest trust`
- **Repository severity:** `P2`
- **Normalized severity:** `P2`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Capability/status evidence must identify the actual production partial-fill implementation and prove the claimed state is representable through its entrypoint.

**Trigger**

Read the accepted status payload and follow implementationModule to src/simulation/leg-completion.ts.

**Current behavior**

partialFillModelStatus returns accepted and names src/simulation/leg-completion.ts, but PAPER_LEG_COMPLETION_STATES in that module contains open, reserved, filled, failed, stale, and settlement_pending only. The actual partial-fill behavior lives in non-atomic-completion.ts and B1 modules.

**Expected behavior**

Capability/status evidence must identify the actual production partial-fill implementation and prove the claimed state is representable through its entrypoint.

**Impact**

Marker-based validators and documentation can report partial-fill implementation present while following a module that cannot represent partial state, creating false assurance and confusing callers.

**Evidence**

- The accepted status payload hard-codes the legacy module path.
- The referenced enum has no leg_partial state.
- The focused tests pass because they assert marker/status strings rather than exercising partial fill through the referenced entrypoint.
- The bounded harness returned the accepted status unchanged.

**Current files and symbols**

- packages/bootstrap/src/simulation/partial-fill.ts :: PartialFillModelStatus / partialFillModelStatus :: L3-L18 :: 84ea147e7d449e3ffdfcfcd662f29803dc5905f4d207b556ed04ab6b39071a93
- packages/bootstrap/src/simulation/leg-completion.ts :: PAPER_LEG_COMPLETION_STATES :: L5-L12 :: 934fb7e5b36545bbc393d0c4909cd4fbc5ddaaf2d540819acc222577ba672aa7
- tests/leg-completion.test.ts :: partial-fill status assertions :: L1-L246 :: f3e273e97b4388f9aa45e6cb4197874f90aafdedceebea4892a2293abeadce24

**Source-pinned files and symbols**

- None

**Root cause**

A static capability marker was not updated when implementation moved to a different state machine, and tests validate the declaration rather than the declared behavior.

**Cross-area dependencies**

- KNOWN_BASELINE_MANIFEST_DRIFT

**Minimal fix boundary**

Retire the stale status helper or point it to the actual production entrypoint with a behavioral validator. Aggregate validator ownership remains R11.

**Required tests**

- Status-referenced entrypoint accepts a genuine partial fill and returns a partial state.
- Renaming/removing the implementation causes the validator to fail.
- No marker-only test can pass without invoking the production path.

**Regression risk**

- Legacy consumer expectations
- Documentation links
- Avoid treating local capability as runtime acceptance

**Unchanged areas**

- Actual non-atomic and B1 partial-fill implementations
- BWS-600 external hold
- No execution

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R04/BWS118-R04-report.md and cumulative Wave 02 ledger`

## BWS118-R05-001 | P2 | The HTTP boundary collapses validation, policy, persistence, and internal failures into HTTP 400 and returns raw exception text

- **Aliases:** `none`
- **Source reports:** `BWS118-R05`
- **Source areas:** `R05`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R05`
- **Secondary areas:** `R03 persistence error production, R06 service availability and health, R07 operational evidence, R11 validator truth`
- **Repository severity:** `P2`
- **Normalized severity:** `P2`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Request-validation failures, domain-policy holds, not-found results, dependency outages, and unexpected internal faults must retain distinct status classes and sanitized envelopes; all relevant blockers must remain available to operators without exposing internals.

**Trigger**

Trigger a repository exception, service availability failure, malformed persisted row, or a blocked result with more than one diagnostic.

**Current behavior**

Every service blocker is emitted as HTTP 400 using only blockers[0]. A single broad catch also maps unexpected exceptions to HTTP 400/BWS_QUERY_REQUEST_INVALID and returns Error.message verbatim.

**Expected behavior**

Request-validation failures, domain-policy holds, not-found results, dependency outages, and unexpected internal faults must retain distinct status classes and sanitized envelopes; all relevant blockers must remain available to operators without exposing internals.

**Impact**

Clients cannot distinguish an empty/invalid query from a database or service fault, retry policy becomes wrong, and internal SQL/relation/path detail can cross the HTTP boundary. Operational dashboards can classify infrastructure failure as caller error.

**Evidence**

- Static trace shows all four query routes select only result.blockers[0], and writeBlockedResponse always uses status 400.
- The bounded inert harness injected an exception with internal relation text; the handler returned status 400 and the exact message in JSON while retaining cache-control=no-store.

**Current files and symbols**

- packages/bootstrap/src/api/bws-read-only-query-http.ts :: createBwsReadOnlyQueryHttpHandler query dispatch and catch :: 157-217 :: fc644a168e07d1afa63d84fa85582cda9c37994b2b4d66ea7366c1f442c7ac17
- packages/bootstrap/src/api/bws-read-only-query-http.ts :: writeBlockedResponse :: 380-401 :: fc644a168e07d1afa63d84fa85582cda9c37994b2b4d66ea7366c1f442c7ac17

**Source-pinned files and symbols**

- None

**Root cause**

The HTTP adapter has one catch-all request error path and no typed translation layer from query/domain/repository errors to a stable public error taxonomy.

**Cross-area dependencies**

- BWS116-R03-003
- BWS116-R03-007

**Minimal fix boundary**

Change only the R05 HTTP/error-envelope boundary: classify malformed input, policy hold, not found, conflict, unavailable dependency, timeout, and internal failure; sanitize internal exceptions; preserve a bounded blocker list or diagnostic identifier. Do not alter repository transaction semantics.

**Required tests**

- Production-handler tests for 400/404/409/422/503/504/500 distinctions using inert typed failures.
- Test that raw SQL, filesystem, connection, and stack detail never appears in the response.
- Test that multiple blockers are retained deterministically or referenced by a stable diagnostic ID.
- Client test proving non-2xx classes remain distinguishable from an empty successful page.

**Regression risk**

- Status-code changes can affect cockpit copy and operator retry behavior.
- Sanitization must retain enough stable diagnostic identity for support.
- Do not convert accepted holds into transient infrastructure failures.

**Unchanged areas**

- Repository SQL and transaction behavior
- BWS query mathematics
- GET-only route set

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R05/BWS118-R05-report.md and cumulative Wave 02 ledger`

## BWS118-R05-002 | P1 | Pagination cursors are caller-forgeable position tokens with no immutable snapshot, version, or high-watermark binding

- **Aliases:** `none`
- **Source reports:** `BWS118-R05`
- **Source areas:** `R05`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R05`
- **Secondary areas:** `R03 transaction/snapshot support, R10 environment/secret policy if cursor authentication uses a key, R11 adversarial pagination tests`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

A continuation token must be server-authenticated or otherwise non-malleable and must bind resource, exact query/sort contract, API version, and one immutable snapshot/high-watermark so continuation is deterministic and restart-safe.

**Trigger**

Reuse a cursor after rows are inserted/reordered, or synthesize base64url JSON containing an arbitrary afterId and the public filter hash.

**Current behavior**

The token is plain base64url JSON with only resource, filtersSha256, and afterId. The SHA-256 is unkeyed and recomputable by any caller. There is no snapshot ID, high-watermark, sort version, expiry, or server-side continuation state.

**Expected behavior**

A continuation token must be server-authenticated or otherwise non-malleable and must bind resource, exact query/sort contract, API version, and one immutable snapshot/high-watermark so continuation is deterministic and restart-safe.

**Impact**

A caller can skip directly to an arbitrary ID, and normal concurrent insertion can omit records across pages while both responses appear complete and valid. Restarted or delayed consumers cannot prove which dataset the cursor continues.

**Evidence**

- The inert harness built a valid cursor without receiving one from the service and confirmed attacker-selected-after-id reached the repository.
- A two-page harness inserted a lexically earlier row after page one; page two continued after the prior ID and omitted the inserted row. The response had no snapshot identity.

**Current files and symbols**

- packages/bootstrap/src/api/bws-read-only-query-service.ts :: CursorPayload :: 306-310 :: 896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424
- packages/bootstrap/src/api/bws-read-only-query-service.ts :: queryB1BacktestRuns / queryStrategyLedger cursor production :: 397-473 :: 896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424
- packages/bootstrap/src/api/bws-read-only-query-service.ts :: hashCursorScope / decodeCursor / encodeCursor :: 1991-2052 :: 896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424

**Source-pinned files and symbols**

- None

**Root cause**

The query layer treats an opaque encoding plus public scope hash as cursor integrity and treats live keyset position as snapshot continuity.

**Cross-area dependencies**

- BWS116-R01-005
- BWS116-R03-007

**Minimal fix boundary**

At the R05 query boundary, introduce a versioned cursor contract bound to canonical sort and immutable high-watermark/snapshot identity; authenticate or server-register it; reject expired, unknown, or mismatched continuations. Hand database snapshot/fencing implementation to R03 where required.

**Required tests**

- Forged-cursor rejection test using a recomputed filter hash.
- Concurrent insert/delete/update continuation tests with a fixed snapshot.
- Restart test proving a valid continuation resumes the same snapshot or fails explicitly as expired.
- Sort-version and API-version mismatch tests.
- Property test that concatenated pages equal one snapshot query without duplicate or omission.

**Regression risk**

- Stateful cursors add retention and cleanup needs.
- Snapshot semantics may require PostgreSQL support and a migration.
- Cursor format changes require explicit versioning rather than silent compatibility.

**Unchanged areas**

- Repository key ordering itself
- Upstream API pagination
- B1 economic calculations

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R05/BWS118-R05-report.md and cumulative Wave 02 ledger`

## BWS118-R05-003 | P1 | Private-paper runtime-cycle queries scan only a recent heuristic window and can return a false empty page with no continuation or truncation signal

- **Aliases:** `none`
- **Source reports:** `BWS118-R05`
- **Source areas:** `R05`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R05`
- **Secondary areas:** `R03 runtime-cycle persistence/read model, R06 service resource limits, R08 retention lifecycle, R11 pagination/property tests`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

The API must either query the entire bounded keyspace using deterministic continuation or explicitly return partial/truncated/incomplete state and a continuation mechanism. An empty page may mean no matching row only after the searchable snapshot is exhausted.

**Trigger**

Query pageSize=1 for a filter whose newest match is cycle 6 while the scheduler upper cycle is 10.

**Current behavior**

The request has no cursor. For each scheduler, only the last pageSize*4 cycle numbers are inspected, then the global results are sliced to pageSize. The response never emits nextCursor, scanned range, truncation, or completeness.

**Expected behavior**

The API must either query the entire bounded keyspace using deterministic continuation or explicitly return partial/truncated/incomplete state and a continuation mechanism. An empty page may mean no matching row only after the searchable snapshot is exhausted.

**Impact**

Operators can receive returnedCount=0 and infer no runtime evidence even though older matching cycles exist. This can manufacture absence, hide held/failed history, and make restart investigation incomplete.

**Evidence**

- The bounded harness used upper cycle 10 and a matching row at cycle 6 with pageSize=1. Only cycles 10, 9, 8, and 7 were scanned; the API returned an accepted empty page with no cursor.
- Static tracing confirms lowerCycleNumber is derived solely from pageSize*4, not from a stored continuation or matching-row boundary.

**Current files and symbols**

- packages/bootstrap/src/api/bws-read-only-query-service.ts :: BwsPrivatePaperRuntimeCycleQueryRequest :: 152-164 :: 896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424
- packages/bootstrap/src/api/bws-read-only-query-service.ts :: queryPrivatePaperRuntimeCycles :: 581-678 :: 896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424

**Source-pinned files and symbols**

- None

**Root cause**

Runtime-cycle projection is implemented as recent-window sampling but uses the same successful page contract as an exhaustive filtered query.

**Cross-area dependencies**

- BWS116-R03-012
- BWS116-R03-013

**Minimal fix boundary**

Replace heuristic sampling with a deterministic repository/read-model query and continuation, or introduce an explicit bounded scan contract carrying searched range, truncation, partial/completeness status, and continuation. Do not change worker/job durable state in R05.

**Required tests**

- Older-match test proving it is returned through continuation or the response is explicitly partial.
- No-match test that distinguishes exhausted snapshot from truncated scan.
- Multiple-scheduler ordering and continuation tests.
- Restart test with the same search snapshot/high-watermark.
- UI test that partial runtime-cycle results cannot be presented as absence.

**Regression risk**

- A new read model may require indexes or schema support.
- Changing from sampling to exhaustive query can expose large historical datasets.
- Continuation order must remain deterministic across scheduler IDs and timestamps.

**Unchanged areas**

- Scheduler checkpoint write semantics
- Worker state transitions
- Strategy acceptance computation

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R05/BWS118-R05-report.md and cumulative Wave 02 ledger`

## BWS118-R05-004 | P2 | Maximum-size runtime-cycle reads expand into at least 50,000 synchronous dependency calls before optional provenance work

- **Aliases:** `none`
- **Source reports:** `BWS118-R05`
- **Source areas:** `R05`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R05`
- **Secondary areas:** `BWS116-R03-012, R03 repository/index work, R06 request lifecycle, R11 performance gates`
- **Repository severity:** `P2`
- **Normalized severity:** `P2`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

One page request must have a declared and enforced operation/query budget with set-based reads, bounded fanout, timeout/cancellation, and explicit partial or unavailable results when the budget cannot be met.

**Trigger**

Request private-paper runtime cycles at pageSize=25.

**Current behavior**

The service lists up to pageSize*4 schedulers and scans pageSize*4 cycles per scheduler. Each candidate cycle performs upstream-checkpoint get, upstream-lock get, worker-job get, and two strategy-ledger lists before optional checkpoint/dead-letter/import expansion.

**Expected behavior**

One page request must have a declared and enforced operation/query budget with set-based reads, bounded fanout, timeout/cancellation, and explicit partial or unavailable results when the budget cannot be met.

**Impact**

A single loopback GET can monopolize the synchronous service path, amplify database work, and delay health, cockpit, and other query traffic. The nominal page limit does not bound backend work.

**Evidence**

- The inert maximum-shape harness scanned 10,000 cycles and counted 10,000 upstream-checkpoint gets, 10,000 lock gets, 10,000 worker-job gets, and 20,000 strategy-ledger lists: 50,000 calls before optional expansion.
- The production maxPageSize is 25, yielding 100 schedulers times 100 cycles under the current multipliers.

**Current files and symbols**

- packages/bootstrap/src/api/bws-read-only-query-service.ts :: queryPrivatePaperRuntimeCycles scheduler/cycle nested scan :: 592-660 :: 896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424
- packages/bootstrap/src/api/bws-read-only-query-service.ts :: buildPrivatePaperRuntimeCycleItem :: 853-945 :: 896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424
- packages/bootstrap/src/api/bws-read-only-query-service.ts :: findPrivatePaperRuntimeStrategyLedger / findCompletedCycleImportRun :: 1041-1117 :: 896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424
- packages/bootstrap/src/operations/runtime-applications.ts :: DEFAULT_API_QUERY_MAX_PAGE_SIZE / createBwsReadOnlyQueryService :: 58,203-207 :: 216b980403a59909b07a27fb475d22cf6ee35b41364fd0bb46c510d17d9e0322

**Source-pinned files and symbols**

- None

**Root cause**

The response-size bound is incorrectly used as a work bound while nested per-record reconstruction creates quadratic fanout and N+1 repository access.

**Cross-area dependencies**

- BWS116-R03-012

**Minimal fix boundary**

At the R05 read-model boundary, use one bounded set-based query or precomputed read model, enforce an explicit operation/time budget, and surface partial/unavailable state. R03 owns repository/index/transaction changes; R06 owns request cancellation and service-wide concurrency.

**Required tests**

- Operation-count test at maxPageSize with a hard upper bound independent of scheduler history.
- Database-backed query-plan and latency test under realistic retained history.
- Cancellation/timeout test proving no late query work continues after client disconnect or request deadline.
- Concurrency test with health/readiness and multiple cockpit readers.

**Regression risk**

- Set-based projection may change error ordering.
- New indexes can affect migration and retention work.
- Budget enforcement must not silently truncate without an explicit partial marker.

**Unchanged areas**

- Persistent worker state machine
- Scheduler ownership
- API maximum returned row count

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R05/BWS118-R05-report.md and cumulative Wave 02 ledger`

## BWS118-R05-005 | P1 | The cockpit discards every server continuation and presents first-page counts, search, and local pagination as whole-scope data

- **Aliases:** `none`
- **Source reports:** `BWS118-R05`
- **Source areas:** `R05`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R05`
- **Secondary areas:** `R03 bounded list behavior, R06 query cancellation/budget, R07 operator evidence, R11 browser integration tests`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

The cockpit must either exhaust deterministic continuations within a declared cap, implement server-driven paging/search, or visibly label every metric and row set as partial/first-page with continuation controls and completeness state.

**Trigger**

Load the cockpit with all seven core responses containing nextCursor and at least one row.

**Current behavior**

The snapshot loader issues exactly one request per surface and never uses nextCursor. Models label returnedCount as Accepted Backtests, Blocked Backtests, Cycle Rows, B1 Research Runs, and similar totals. Search and pager operate only on loaded first-page rows.

**Expected behavior**

The cockpit must either exhaust deterministic continuations within a declared cap, implement server-driven paging/search, or visibly label every metric and row set as partial/first-page with continuation controls and completeness state.

**Impact**

The UI can undercount accepted, blocked, failed, or held records; search can falsely report no matching data; and the Next button can be disabled while the server has more pages. This manufactures completeness and can hide release blockers.

**Evidence**

- The harness returned nextCursor on all seven surfaces. The loader made seven requests, zero cursor follow-ups, displayed Accepted Backtests=1, and exposed only the first-page model rows.
- Static tracing shows the shell pageCount derives solely from model.rows.length and the pager slices that local array.

**Current files and symbols**

- apps/web/src/api/client.ts :: loadBwsOperatorCockpitSnapshot :: 1240-1325 :: 8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97
- apps/web/src/api/models.ts :: buildBwsOperatorCockpitPageModel count cards and rows :: 657-801 :: 3b08b0fe2d3559cc1e51bf3f570ea43b3b3c4379234ceaec33abe7d9c1c034c3
- apps/web/src/app/shell.tsx :: filterRows / paginateRows / local page model :: 116-188 :: ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189
- apps/web/src/app/shell.tsx :: empty table and local pager :: 460-518 :: ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189

**Source-pinned files and symbols**

- None

**Root cause**

The web snapshot contract models one server page per logical dataset, while presentation code treats page-local counts and rows as scope totals.

**Cross-area dependencies**

- BWS116-R03-012

**Minimal fix boundary**

Choose one R05 UI contract: server-driven pagination/filter/search with surfaced continuation, or bounded multi-page aggregation carrying explicit completeness/truncation. Rename all page-local metrics and empty states until completeness is proven.

**Required tests**

- Snapshot-loader test that follows continuations or deliberately returns explicit partial state.
- UI test where nextCursor exists: cards, search, empty state, and pager must not claim completeness.
- Multi-page accepted/blocked/B1/runtime/evidence cases.
- Cursor failure midway must preserve partial/error distinction rather than silently showing page one.

**Regression risk**

- Exhausting pages can increase load; pair with R05/R06 budgets.
- Server-driven pagination changes URL-state semantics.
- Metric names and operator procedures may require updates.

**Unchanged areas**

- Underlying persisted counts
- Strategy acceptance semantics
- B1 mathematics

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R05/BWS118-R05-report.md and cumulative Wave 02 ledger`

## BWS118-R05-006 | P1 | Successful response envelopes omit the exact query, filter, sort, and snapshot scope, so empty wrong-scope pages pass client validation vacuously

- **Aliases:** `none`
- **Source reports:** `BWS118-R05`
- **Source areas:** `R05`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R05`
- **Secondary areas:** `R01 upstream page/query binding, R03 snapshot implementation, R11 contract tests`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Every page must carry or cryptographically bind the exact normalized query/filter/sort/expand contract, page size, cursor lineage, snapshot/high-watermark, and response completeness. The client must compare this receipt before interpreting items.

**Trigger**

Request one scope but return an empty successful page generated for another filter/sort/page scope.

**Current behavior**

The envelope contains only boundary strings, generatedAt, resource, items, pageSize, returnedCount, and optional cursor. The client verifies scope by iterating returned items; an empty array makes every scope check pass.

**Expected behavior**

Every page must carry or cryptographically bind the exact normalized query/filter/sort/expand contract, page size, cursor lineage, snapshot/high-watermark, and response completeness. The client must compare this receipt before interpreting items.

**Impact**

A proxy, stale cache, incompatible server, or server defect can return data for the wrong request while the cockpit accepts it. Empty responses can manufacture absence for any requested scope.

**Evidence**

- The adversarial harness supplied a valid empty response for a different requested scope; the production client accepted it because no item existed to contradict the request.
- The response type has no request/filter/sort digest or echoed normalized request.

**Current files and symbols**

- packages/bootstrap/src/api/bws-read-only-query-service.ts :: BwsReadOnlyQueryPage / BwsReadOnlyQueryResponse :: 97-115 :: 896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424
- apps/web/src/api/client.ts :: assertReadOnlyQueryResponse :: 692-762 :: 8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97
- apps/web/src/api/client.ts :: response-versus-request item-loop assertions :: 980-1144 :: 8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97

**Source-pinned files and symbols**

- None

**Root cause**

Scope integrity is inferred from row contents instead of being an explicit page-level contract.

**Cross-area dependencies**

- BWS116-R01-004
- BWS116-R01-005
- BWS116-R02-013

**Minimal fix boundary**

Extend the R05 response envelope with a versioned normalized-request receipt/digest, canonical order, snapshot identity, and completeness status; validate it before item parsing. Use R01 page/record receipt concepts as dependencies without duplicating upstream intake defects.

**Required tests**

- Wrong-scope empty-page rejection test.
- Wrong expand/pageSize/sort/cursor-lineage rejection tests.
- Property test that every emitted response receipt equals the service-normalized request.
- Compatibility/version test for changed query semantics.

**Regression risk**

- Envelope changes require web/client compatibility versioning.
- Do not trust a caller-supplied echoed request without server binding.
- Canonical filter serialization must not inherit locale-dependent ordering.

**Unchanged areas**

- Upstream intake provenance root causes
- Database transaction isolation
- Domain filter semantics

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R05/BWS118-R05-report.md and cumulative Wave 02 ledger`

## BWS118-R05-007 | P1 | The cockpit combines seven independently timed pages into one apparent snapshot without a shared coherence receipt

- **Aliases:** `none`
- **Source reports:** `BWS118-R05`
- **Source areas:** `R05`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R05`
- **Secondary areas:** `BWS116-R01-003, BWS116-R01-004, BWS116-R01-005, R03 transaction snapshot, R06 request lifecycle`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

A cockpit snapshot must carry one server-issued snapshot/coherence identity or prove all component responses share compatible as-of/high-watermark/authority receipts. Mixed snapshots must be rejected or visibly presented as independent partial observations.

**Trigger**

Return the seven pages with mutually different generatedAt values, generations, or database high-watermarks.

**Current behavior**

The client runs separate requests in Promise.all and places them into one object. There is no shared snapshot ID, database high-watermark, source cycle, asOf, or cross-response coherence validation.

**Expected behavior**

A cockpit snapshot must carry one server-issued snapshot/coherence identity or prove all component responses share compatible as-of/high-watermark/authority receipts. Mixed snapshots must be rejected or visibly presented as independent partial observations.

**Impact**

Accepted and blocked totals, exposure, runtime cycles, and evidence can describe different moments. A candidate may appear accepted while its blocker or runtime state comes from another snapshot, manufacturing profitability, terminality, or readiness relationships.

**Evidence**

- The harness supplied seven responses with generatedAt values from 2000 through 2099. The production loader accepted them as one snapshot and no shared receipt existed.
- The TypeScript snapshot interface contains only independent response objects.

**Current files and symbols**

- apps/web/src/api/contracts.ts :: BwsOperatorCockpitSnapshot :: 117-127 :: 11c9bcc7cacad4505c7d24f5e66c819723bc9165b1b65c96271b449df2bc3417
- apps/web/src/api/client.ts :: loadBwsOperatorCockpitSnapshot Promise.all aggregation :: 1267-1324 :: 8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97
- packages/bootstrap/src/api/bws-read-only-query-service.ts :: BwsReadOnlyQueryResponse :: 110-115 :: 896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424

**Source-pinned files and symbols**

- None

**Root cause**

UI aggregation is equated with data snapshot coherence; the server exposes only independent page responses.

**Cross-area dependencies**

- BWS116-R01-003
- BWS116-R01-004
- BWS116-R01-005

**Minimal fix boundary**

Add an R05 snapshot/batch read contract or common snapshot token/high-watermark accepted by all queries, and require the cockpit to validate it. If independent observations remain intentional, label and render them independently rather than deriving cross-surface totals.

**Required tests**

- Concurrent mutation test during seven-surface load.
- Mixed snapshot/high-watermark rejection test.
- Batch endpoint or shared-token test proving all surfaces resolve one snapshot.
- Partial surface failure test that does not retain a synthetic combined snapshot.

**Regression risk**

- A database snapshot spanning requests may require a server-side snapshot lifecycle.
- Batch responses can become large; preserve page and work bounds.
- Cross-surface derivations must define which resources are semantically comparable.

**Unchanged areas**

- Individual repository row correctness
- Upstream convergence ownership
- Paper settlement semantics

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R05/BWS118-R05-report.md and cumulative Wave 02 ledger`

## BWS118-R05-008 | P1 | API and cockpit accept arbitrarily stale or future response timestamps and loaded state never transitions to stale

- **Aliases:** `none`
- **Source reports:** `BWS118-R05`
- **Source areas:** `R05`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R05`
- **Secondary areas:** `BWS116-R01-010, R06 timers/cancellation, R07 evidence currentness, R11 time tests`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

The API/client contract must define response age, future-skew, source/as-of time, and stale transition. The cockpit must label stale data and refresh or require operator reload; future or incompatible time must fail closed.

**Trigger**

Return a response dated 2000 or 2099, or leave a valid response displayed indefinitely.

**Current behavior**

Both service and client validate only ISO syntax/Date.parse. The shell loads on route/config/scope changes only; it has no clock, refresh interval, visibility refresh, expiry, stale state, or future-skew check.

**Expected behavior**

The API/client contract must define response age, future-skew, source/as-of time, and stale transition. The cockpit must label stale data and refresh or require operator reload; future or incompatible time must fail closed.

**Impact**

Historical or clock-skewed data can remain visually current, and old held/failed/accepted state can be used for operational decisions without any stale indication.

**Evidence**

- The production client accepted generatedAt=2000-01-01T00:00:00.000Z and a mixed snapshot containing a 2099 timestamp.
- Static tracing found no time-based state transition after load.

**Current files and symbols**

- packages/bootstrap/src/api/bws-read-only-query-service.ts :: validateGeneratedAt :: 1419-1428 :: 896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424
- apps/web/src/api/client.ts :: assertReadOnlyQueryResponse generatedAt parsing :: 692-717 :: 8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97
- apps/web/src/app/shell.tsx :: load lifecycle effect :: 144-180 :: ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189

**Source-pinned files and symbols**

- None

**Root cause**

Timestamp validity is treated as currentness, and the browser state machine has no stale concept.

**Cross-area dependencies**

- BWS116-R01-010

**Minimal fix boundary**

Define R05 response currentness fields and policy using a caller-provided/testable clock; reject excessive future skew, mark age explicitly, and add a browser stale/refresh state. R01 remains owner of upstream source/receive-time truth.

**Required tests**

- Ancient and future generatedAt rejection/stale tests with injected clock.
- Open-page expiry test transitioning current to stale without route change.
- Visibility/reconnect refresh test.
- Distinguish API response time from upstream source/receive/as-of time.

**Regression risk**

- Clock policy must tolerate bounded skew.
- Automatic refresh must be bounded and cancellable.
- Do not imply current provider acceptance from a fresh local response over historical data.

**Unchanged areas**

- Upstream source timestamp creation
- Persistence timestamp ordering
- Provider currentness acceptance

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R05/BWS118-R05-report.md and cumulative Wave 02 ledger`

## BWS118-R05-009 | P1 | The cockpit accepts arbitrary non-empty service and upstream-client boundary identifiers instead of exact compatible versions

- **Aliases:** `none`
- **Source reports:** `BWS118-R05`
- **Source areas:** `R05`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R05`
- **Secondary areas:** `R10 deployment configuration, R11 build/generated contract, R24 release packaging`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

The web client must require an explicit supported boundary/version pair and reject unknown, future, historical, or mixed contracts before reading items.

**Trigger**

Return arbitrary-old-or-incompatible-service and arbitrary-client as the two boundary strings.

**Current behavior**

Only automaticFallback is checked exactly. Both boundary identifiers are accepted as any non-empty string.

**Expected behavior**

The web client must require an explicit supported boundary/version pair and reject unknown, future, historical, or mixed contracts before reading items.

**Impact**

The cockpit can silently consume a contract with changed field, cursor, filter, unit, or hold semantics and then present a structurally plausible but semantically incompatible result.

**Evidence**

- The adversarial harness returned an arbitrary incompatible service boundary; the production parser accepted the response.
- The server does emit deterministic boundary identifiers, so exact compatibility enforcement is available but unused.

**Current files and symbols**

- packages/bootstrap/src/api/bws-read-only-query-service.ts :: describeBwsReadOnlyQueryServiceBoundary / boundary construction :: 345-366 :: 896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424
- apps/web/src/api/client.ts :: assertReadOnlyQueryResponse boundary validation :: 707-717 :: 8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97

**Source-pinned files and symbols**

- None

**Root cause**

Boundary strings are treated as diagnostics rather than negotiated compatibility constraints.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Define the exact supported R05 boundary versions in one shared contract, validate both identifiers before page parsing, and require an explicit version bump/migration for incompatible response changes.

**Required tests**

- Known-current pair acceptance test.
- Unknown older/newer/mixed boundary rejection tests.
- Package/build test proving server and web consume one generated/shared boundary authority rather than duplicated literals.

**Regression risk**

- Tight validation can break older deployed cockpits; use explicit compatibility policy.
- Do not silently accept a list of versions without semantic tests.
- Shared generation belongs to R11 if generated output is introduced.

**Unchanged areas**

- API route set
- Browser loopback confinement
- Underlying record validation

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R05/BWS118-R05-report.md and cumulative Wave 02 ledger`

## BWS118-R05-010 | P1 | Selective wire validation weakens closed policy, terminal, fixed-point, status, and timestamp contracts to arbitrary non-empty strings

- **Aliases:** `none`
- **Source reports:** `BWS118-R05`
- **Source areas:** `R05`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R05`
- **Secondary areas:** `BWS116-R02-004, BWS116-R02-005, BWS116-R03-017, R04 simulation result contracts, R11 generated validator truth`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

The client must validate every canonical literal, closed-state invariant, fixed-point integer string, timestamp, and status against the same contract used by the producer before a typed cast or rendering.

**Trigger**

Return liveState=live, privacy=public, profitabilityState=guaranteed_profitable, publicDistributionState=published, reportKind=forged_report, completionGroupState=ready_to_execute, finalOutcome=guaranteed_win, settledNetMinor=not-an-integer, job.status=fully_live, or completedAt=not-a-time.

**Current behavior**

Several critical fields are checked only with requireNonEmptyString or requireOptionalNonEmptyString, then the object is cast to the strong TypeScript type. Models render the accepted values directly.

**Expected behavior**

The client must validate every canonical literal, closed-state invariant, fixed-point integer string, timestamp, and status against the same contract used by the producer before a typed cast or rendering.

**Impact**

A defective response can manufacture live/public/profitable/executable-looking state, false terminality, malformed money, or impossible runtime status in the operator cockpit while all client validation passes.

**Evidence**

- The wire harness passed the live/public/profitable/published/forged values and malformed candidate money/terminal fields through the production parser; the exposure model rendered them.
- The same harness passed malformed optional timestamps and an arbitrary runtime job status.
- The canonical strategy-ledger validator explicitly requires private_only, not_reported, withheld, not_claimed, and surebet_strategy_report_v1, proving the web parser is weaker than source authority.

**Current files and symbols**

- apps/web/src/api/client.ts :: assertImportRunRecord / assertCandidateReport :: 238-316 :: 8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97
- apps/web/src/api/client.ts :: assertStrategyLedgerEntry :: 319-378 :: 8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97
- apps/web/src/api/client.ts :: assertPrivatePaperRuntimeCycleItem job validation :: 426-447 :: 8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97
- packages/bootstrap/src/strategy/strategy-ledger.ts :: strategy report kind and closed-policy validation :: 401-450 :: d05e339a5692a9218f2146c153570ee7d9c8d79ae88282e162b7ece0c0cb5dbc
- apps/web/src/api/models.ts :: toExposureRows :: 439-465 :: 3b08b0fe2d3559cc1e51bf3f570ea43b3b3c4379234ceaec33abe7d9c1c034c3

**Source-pinned files and symbols**

- None

**Root cause**

The web parser validates selected structural relationships but relies on unsafe type assertions for the remaining semantic contract.

**Cross-area dependencies**

- BWS116-R02-004
- BWS116-R02-005
- BWS116-R03-017

**Minimal fix boundary**

Replace ad hoc selective checks with exhaustive shared/generated validators at the R05 wire boundary, including canonical policy literals, union exhaustiveness, integer-string format/range, timestamp format/order, optional-state dependencies, and unknown-field rejection where required. Canonical producer rules remain owned by R02/R03/R04.

**Required tests**

- Mutation/property tests over every union member and every unknown string.
- Closed-policy escalation tests for live/public/profitability/distribution/report kind.
- Integer-string tests for sign, decimals, exponent, whitespace, unsafe length, and overflow policy.
- Optional timestamp/status/state dependency tests.
- Round-trip test from actual service output through the external web parser.

**Regression risk**

- Shared validation must not create circular workspace imports.
- Stricter parsing can expose historical malformed rows; surface them as explicit errors, not empty data.
- Integer ranges and terminal states must follow owner-sector authority.

**Unchanged areas**

- Canonical strategy-ledger producer validation
- Persistence timestamp ordering root cause
- B1 economic correctness

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R05/BWS118-R05-report.md and cumulative Wave 02 ledger`

## BWS118-R05-011 | P1 | The B1 browser contract rejects producer-valid null simulation results while accepting malformed child identity, economics, status, and time fields

- **Aliases:** `none`
- **Source reports:** `BWS118-R05`
- **Source areas:** `R05`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R05`
- **Secondary areas:** `BWS116-R02-002, BWS116-R02-004, BWS116-R02-005, R04 simulation semantics, R03 persistence shape, R11 generated contract tests`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

The external client schema must exactly match the producer contract, including valid nullability, parent-child identity, discriminated simulation kinds/statuses, fixed-point values, blockers, booleans, timestamps, and result-shape dependencies.

**Trigger**

Return result=null for the producer-valid residual_exposure row, or return children with mismatched run/candidate IDs, non-integer spread/money strings, invalid status/stage, non-array blockers, non-boolean falsePositive, or invalid timestamps.

**Current behavior**

The parser requires every simulation result to be an object, although persistence intentionally emits result:null for one accepted case. Conversely, candidate and simulation children receive only four shallow non-empty/object checks and are then cast to the full types.

**Expected behavior**

The external client schema must exactly match the producer contract, including valid nullability, parent-child identity, discriminated simulation kinds/statuses, fixed-point values, blockers, booleans, timestamps, and result-shape dependencies.

**Impact**

Valid B1 reporting can fail closed in the browser, while malformed B1 economics and identity can be displayed as research evidence. B1 acceptance and false-positive analysis become unreliable at the presentation boundary.

**Evidence**

- The harness proved a producer-valid result:null row is rejected with “must be an object”.
- The same production parser accepted a malformed child with wrong run ID, non-integer gross spread, non-boolean falsePositive, and NaN settled net; the model rendered the malformed value.
- Persistence source explicitly constructs and normalizes the null residual-exposure result.

**Current files and symbols**

- apps/web/src/api/client.ts :: assertB1BacktestRunItem child validation :: 573-663 :: 8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97
- packages/persistence/src/repositories/b1-backtest-run-repository.ts :: buildSurebetB1SimulationResultInsertValues :: 451-510 :: fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04
- packages/persistence/src/repositories/b1-backtest-run-repository.ts :: normalizeSimulationRow :: 646-653 :: fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04
- apps/web/src/api/models.ts :: createB1BacktestRunRow :: 550-608 :: 3b08b0fe2d3559cc1e51bf3f570ea43b3b3c4379234ceaec33abe7d9c1c034c3

**Source-pinned files and symbols**

- None

**Root cause**

The B1 client validator is a hand-written partial projection that diverges from the producer/persistence discriminated contract in both directions.

**Cross-area dependencies**

- BWS116-R02-002
- BWS116-R02-004
- BWS116-R02-005

**Minimal fix boundary**

Create one shared/generated B1 reporting wire schema and validate all child discriminants, identities, units, timestamps, and nullability in R05. Hand any discovered producer-contract defect to R02/R04/R03 rather than changing economics here.

**Required tests**

- Producer-valid null residual-exposure round-trip test.
- Parent-child runId/candidateId mismatch rejection tests.
- All candidate/simulation status and kind union tests.
- Fixed-point, boolean, blockers, timestamp, and result-shape property tests.
- Model test proving malformed child data cannot render.

**Regression risk**

- Historical stored B1 rows may expose additional schema drift.
- Generated schema changes must preserve deliberate null semantics.
- Do not “fix” by replacing null with a fabricated object.

**Unchanged areas**

- B1 derivation mathematics
- Persistence transaction behavior
- Top-level BWS-900 and runtime-evidence holds

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R05/BWS118-R05-report.md and cumulative Wave 02 ledger`

## BWS118-R05-012 | P1 | Cockpit loads are not request-generation-bound or cancellable, allowing a late older scope or route response to overwrite newer state

- **Aliases:** `none`
- **Source reports:** `BWS118-R05`
- **Source areas:** `R05`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R05`
- **Secondary areas:** `R06 cancellation/resource ownership, R11 browser race tests`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Only the active request generation may publish snapshot/error/loading state. Superseded loads must be aborted where possible and ignored on completion; loading must represent the active generation only.

**Trigger**

Start an old-scope load, start and complete a new-scope load, then complete the old load last.

**Current behavior**

Every effect invocation writes the same snapshot/error/loading state without a generation token or active flag. The fetch abstraction carries no AbortSignal. Older completion can call setSnapshot and finally setIsLoading(false after a newer load.

**Expected behavior**

Only the active request generation may publish snapshot/error/loading state. Superseded loads must be aborted where possible and ignored on completion; loading must represent the active generation only.

**Impact**

The cockpit can display data for the wrong route/filter/API base while URL controls show the new scope. A late failure can also erase a valid newer snapshot or mark loading complete prematurely.

**Evidence**

- The bounded state-machine harness completed a new-scope request first and an old-scope request last; finalSnapshotScope became old while activeScope remained new.
- Static tracing shows no AbortController, request ID, cleanup guard, or completion ownership check.

**Current files and symbols**

- apps/web/src/api/client.ts :: BwsOperatorCockpitFetchLike :: 60-72 :: 8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97
- apps/web/src/api/client.ts :: loadBwsOperatorCockpitSnapshot :: 1240-1325 :: 8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97
- apps/web/src/app/shell.tsx :: loadSnapshot effect and state updates :: 144-180 :: ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189

**Source-pinned files and symbols**

- None

**Root cause**

Asynchronous fetch completion has no monotonic ownership relation to the effect generation that initiated it.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Add one request-generation/AbortController boundary in the shell/client; pass AbortSignal through the fetch abstraction; ignore completion from superseded generations; make loading/error state generation-specific. Generic HTTP cancellation propagation remains R06-owned.

**Required tests**

- Deterministic deferred-promise race tests for route, scope, and configuration changes.
- Old success after new success; old failure after new success; old finally after new pending.
- Unmount and abort test proving no state publication or retained listener.
- Client test proving AbortSignal reaches fetch.

**Regression risk**

- React Strict Mode can expose duplicate-effect behavior and must be covered.
- Abort is advisory; late completion still needs generation checks.
- Do not retain an old snapshot as fallback unless explicitly labeled stale and scope-bound.

**Unchanged areas**

- Server query correctness
- URL-state parsing
- Data-mode confinement

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R05/BWS118-R05-report.md and cumulative Wave 02 ledger`

## BWS118-R05-013 | P2 | The cockpit conflates source-empty, search-no-match, and evidence-scope states under the same empty labels

- **Aliases:** `none`
- **Source reports:** `BWS118-R05`
- **Source areas:** `R05`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R05`
- **Secondary areas:** `R07 operator evidence interpretation, R11 UI state tests`
- **Repository severity:** `P2`
- **Normalized severity:** `P2`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Presentation must distinguish at least: source/query returned no rows, loaded page is partial, active search has no matches, explicit evidence scope has no matches, scope is missing, and request failed.

**Trigger**

Search for a nonmatching term against a nonempty page, or apply a valid evidence filter that produces an empty result.

**Current behavior**

The shell always renders model.emptyLabel when filtered visible rows are empty. The evidence page always says to provide an explicit filter even when one is applied; other pages claim no source rows when only local search is empty.

**Expected behavior**

Presentation must distinguish at least: source/query returned no rows, loaded page is partial, active search has no matches, explicit evidence scope has no matches, scope is missing, and request failed.

**Impact**

Operators can believe evidence is absent, a filter was not applied, or the source contains no blockers when only the local view is empty. Diagnostics and review decisions become misleading.

**Evidence**

- The harness loaded two source rows, applied a nonmatching search, and rendered “No backtest ledger rows are available...”.
- With an explicit evidence scope applied and zero returned rows, the model still rendered “Provide an explicit evidence filter...”.

**Current files and symbols**

- apps/web/src/api/models.ts :: buildBwsOperatorCockpitPageModel empty labels :: 657-724 :: 3b08b0fe2d3559cc1e51bf3f570ea43b3b3c4379234ceaec33abe7d9c1c034c3
- apps/web/src/app/shell.tsx :: filteredRows / visibleRows :: 182-188 :: ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189
- apps/web/src/app/shell.tsx :: empty-state rendering :: 460-485 :: ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189

**Source-pinned files and symbols**

- None

**Root cause**

Empty copy is fixed at route-model construction and is not derived from query, scope, pagination, or local-filter state.

**Cross-area dependencies**

- None

**Minimal fix boundary**

Introduce explicit R05 UI view states for source empty, filtered empty, missing scope, applied-scope no match, partial page, and error; derive copy from those states and keep counts visible.

**Required tests**

- Nonempty source plus zero local-search results.
- Explicit evidence scope with zero results.
- Missing evidence scope.
- Server partial page and server error states.
- Reset-search action restoring source rows without refetch confusion.

**Regression risk**

- Copy changes may affect snapshots/accessibility tests.
- Do not conflate a filtered empty with a successful exhaustive no-match unless completeness is known.
- Local and server filters need separate labels.

**Unchanged areas**

- Query filtering semantics
- Server error taxonomy
- Underlying row contents

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R05/BWS118-R05-report.md and cumulative Wave 02 ledger`

## BWS118-R06-001 | P1 | Lifecycle ownership is a non-atomic state-file check-and-overwrite

- **Aliases:** `none`
- **Source reports:** `BWS118-R06`
- **Source areas:** `R06`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R06`
- **Secondary areas:** `R03, R10, R11`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Exactly one process must acquire an atomic, generation-bound ownership claim before migrations, child creation, service work, or evidence publication; all contenders must return an idempotent already-owned outcome.

**Trigger**

Launch two lifecycle or standalone service starts concurrently.

**Current behavior**

Both processes can observe no live state, both can migrate or spawn/run, and the last rename wins. The overwritten state no longer identifies every active process.

**Expected behavior**

Exactly one process must acquire an atomic, generation-bound ownership claim before migrations, child creation, service work, or evidence publication; all contenders must return an idempotent already-owned outcome.

**Impact**

Duplicate convergence passes, duplicate scheduler activity, duplicate workers, orphaned child processes, conflicting evidence, and stop/status commands controlling only the last writer.

**Evidence**

- Static interleaving proof applies to four production entrypoints. No atomic create, advisory lock, file lock, database lease, or compare-and-swap exists between the read and side effects.
- State-machine analysis: ABSENT -> CHECKED -> SIDE_EFFECTS -> STATE_WRITTEN is not linearizable. There is no unique transition owner, and state replacement can erase an earlier owner while its process remains alive.

**Current files and symbols**

- packages/bootstrap/src/operations/operator-lifecycle.ts :: startManagedBwsOperatorStack / writeLifecycleState :: 240-264; 903-910 :: 704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- packages/bootstrap/src/operations/upstream-convergence-service.ts :: runBwsUpstreamConvergenceService / writeServiceState :: 301-327; 863-870 :: 937ad8b789002504b674351c04e2179ba2800e17deea1d5e17aa0dd31786d5a8
- packages/bootstrap/src/operations/private-paper-scheduler-service.ts :: runBwsPrivatePaperSchedulerService / writeServiceState :: 305-331; 885-892 :: 876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967
- packages/bootstrap/src/operations/private-paper-worker-service.ts :: runBwsPrivatePaperWorkerService / writeServiceState :: 317-345; 936-943 :: 1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36

**Source-pinned files and symbols**

- None

**Root cause**

A mutable JSON state file is used as both observation and ownership authority without an atomic reservation primitive.

**Cross-area dependencies**

- BWS116-R03-004 can amplify concurrent migration side effects but is not this process-ownership root cause

**Minimal fix boundary**

Add one repository-scoped atomic ownership primitive before any side effect, bind it to a monotonically unique runtime generation and process token, make start idempotent under contention, and release it only after verified shutdown. Apply the same primitive to standalone loops or prohibit independent ownership while the stack owner is active.

**Required tests**

- Two OS processes starting the full stack concurrently
- Concurrent standalone loop starts
- Crash after claim but before state publication
- Stale claim takeover with a fencing generation
- Stop/status after a losing contender has spawned work

**Regression risk**

- Existing stale-state recovery must distinguish abandoned claims from slow initialization
- Standalone operation and full-stack operation must not acquire independent incompatible owners

**Unchanged areas**

- No process or controller was started during review
- Current temp-file rename behavior remains useful for write atomicity after ownership is fixed

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R06/BWS118-R06-report.md and cumulative Wave 02 ledger`

## BWS118-R06-002 | P1 | Stack startup reports started before non-API services and full readiness are established

- **Aliases:** `none`
- **Source reports:** `BWS118-R06`
- **Source areas:** `R06`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R06`
- **Secondary areas:** `R03, R05, R07, R11`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

The start result and exit status must distinguish process creation from initialization and from full-stack readiness. A successful terminal start must require every required role to own an observable compatible runtime generation, or return a non-ready outcome.

**Trigger**

Start the managed stack under blocked database/cockpit/scheduler/worker/upstream readiness or a child stuck after process creation.

**Current behavior**

The function persists the stack and returns started once API health is successful. The calculated stack may be blocked or degraded without changing outcome or CLI success.

**Expected behavior**

The start result and exit status must distinguish process creation from initialization and from full-stack readiness. A successful terminal start must require every required role to own an observable compatible runtime generation, or return a non-ready outcome.

**Impact**

Automation and systemd can treat an incomplete stack as successfully started. BWS-600 evidence can begin against partial services, stale checkpoints, or unavailable durable state.

**Evidence**

- The production source checks only PID presence for four children and API health. The repository test codifies blocked readiness as a successful start.
- State-machine analysis: CREATED -> API_HEALTHY is collapsed into STARTED even though role states can still be BLOCKED/DEGRADED/MISSING. The state model computes but does not enforce the stronger transition.

**Current files and symbols**

- packages/bootstrap/src/operations/operator-lifecycle.ts :: spawnAndPersistLifecycleState / waitForManagedApiObservable / publishLifecycleEvidence :: 446-523; 526-599; 948-976 :: 704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- tests/bws-operator-lifecycle.test.ts :: start lifecycle blocked-readiness expectation :: 204-213 :: ff44f4a8b802187d11c4b9eb4d84cfc15570107a9080c27cfd0f48123a74a9e6

**Source-pinned files and symbols**

- None

**Root cause**

Startup outcome authority is tied to one API probe rather than the complete required-role state machine.

**Cross-area dependencies**

- BWS116-R03-005 and BWS116-R03-011 own psql/pass cancellation below this lifecycle decision

**Minimal fix boundary**

Define explicit initializing, started-not-ready, ready, degraded, and failed-start outcomes. Require service-owned generation/status evidence for all roles before ready, and ensure CLI/systemd exit semantics reflect the returned condition.

**Required tests**

- Child alive but loop state absent
- API healthy with readiness blocked
- Scheduler or worker initialization hang
- Database migration blocked after child creation
- Start result/exit code matrix for initializing, blocked, degraded, and ready

**Regression risk**

- BWS-600 intentionally measures some blocked readiness during evidence windows; preserve that use case as a distinct non-ready state rather than calling it a completed start

**Unchanged areas**

- The API health probe remains loopback-only
- No claim is made that blocked external upstream evidence should become ready

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R06/BWS118-R06-report.md and cumulative Wave 02 ledger`

## BWS118-R06-003 | P1 | Active processes are not bound to an immutable executable generation and status or stop commands rebuild dist

- **Aliases:** `none`
- **Source reports:** `BWS118-R06`
- **Source areas:** `R06`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R06`
- **Secondary areas:** `R09, R10, R11, R12`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Every managed process must remain bound to the exact immutable bytes it started from. Status and stop must inspect that recorded generation without mutating or replacing executable files.

**Trigger**

Change/rebuild dist after start or invoke a status/stop script that runs npm build.

**Current behavior**

Only repositoryRoot and a config fingerprint are enforced. Recorded source fingerprints are not asserted. Several status/stop wrappers clean and rebuild dist before managing the active generation.

**Expected behavior**

Every managed process must remain bound to the exact immutable bytes it started from. Status and stop must inspect that recorded generation without mutating or replacing executable files.

**Impact**

Status can report an old process as current after source changes, and stop/status can replace on-disk executable bytes beneath an active process. Release identity and evidence lineage diverge.

**Evidence**

- Static source trace shows sourceFingerprints are stored but excluded from configFingerprint and assertions. Package scripts make status and stop mutating build operations.
- State-machine analysis: RUNNING(generation A) remains accepted under workspace generation B. The lifecycle authority has no transition to GENERATION_MISMATCH and management commands mutate the candidate executable tree before inspection.

**Current files and symbols**

- packages/bootstrap/src/operations/operator-lifecycle.ts :: createLifecycleContext / collectSourceFingerprints / assertion functions :: 351-397; 498-510; 823-850; 1249-1267 :: 704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- package.json :: build and runtime scripts :: 15-18; 33-47 :: b1b69ffa6d0b974c3b3ba55f3ec1acffb21e512c3a862e2a7b2d6b5139e5eac0
- scripts/bws-root-wrapper-runtime.mjs :: prepareRuntimeBuild / runLifecycleStart :: 137-165 :: 1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8
- docs/035_continuous_service_supervisor_contract.md :: BWS-584 required behavior :: 87-103 :: cae4ce541c65848974de8c4568e72b6d2d3d151d9f2c3eaf52cb50e6777c8505

**Source-pinned files and symbols**

- None

**Root cause**

Descriptive source metadata is not part of the enforced lifecycle identity, and wrapper commands conflate build/deploy with read-only management.

**Cross-area dependencies**

- KNOWN_BASELINE_MANIFEST_DRIFT remains R11-owned; this finding exists even with a correct manifest

**Minimal fix boundary**

Record a canonical executable/package digest or release-directory identity at start, assert it on status/stop/evidence, run active services from immutable release directories, and remove builds from status/stop paths. Treat generation mismatch as explicit degraded/blocked ownership, not a reason to abandon stop authority.

**Required tests**

- Start generation A then change source and query status
- Start generation A then rebuild dist and stop
- Package version unchanged but executable bytes changed
- Source-manifest drift and repaired manifest transitions
- Immutable release-directory start/status/stop

**Regression risk**

- Strict generation binding needs an explicit emergency-stop path that still proves process ownership
- Historical runtime evidence must retain its original generation rather than being rewritten

**Unchanged areas**

- No generated output was rebuilt in the reviewed source tree
- Current repositoryRoot and configuration checks remain valid subordinate safeguards

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R06/BWS118-R06-report.md and cumulative Wave 02 ledger`

## BWS118-R06-004 | P1 | Partial startup can orphan the just-spawned detached child before it enters rollback ownership

- **Aliases:** `none`
- **Source reports:** `BWS118-R06`
- **Source areas:** `R06`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R06`
- **Secondary areas:** `R10, R11, R23`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

The child must enter rollback ownership atomically with creation, and startup failure must either terminate and verify it or retain an explicit ambiguous ownership record.

**Trigger**

Cause /proc verification, command validation, repository read, timeout, evidence/logging, or parent interruption between spawn and startedProcesses.push.

**Current behavior**

The catch block cleans only startedProcesses. The current detached child is omitted until after verification succeeds, so it can survive with no state-file record.

**Expected behavior**

The child must enter rollback ownership atomically with creation, and startup failure must either terminate and verify it or retain an explicit ambiguous ownership record.

**Impact**

An untracked scheduler, worker, convergence loop, or API can continue after startup reports failure, and later starts can create duplicates.

**Evidence**

- The ordering is direct in production source. Child detachment removes parent-process cleanup as a fallback.
- State-machine analysis: SPAWNED_UNOWNED is a reachable state. The intended transition jumps from not-created to verified-owned, but the process side effect occurs before durable or in-memory ownership.

**Current files and symbols**

- packages/bootstrap/src/operations/operator-lifecycle.ts :: spawnAndPersistLifecycleState :: 446-523 :: 704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- packages/bootstrap/src/operations/operator-lifecycle.ts :: spawnManagedLifecycleProcess :: 1094-1125 :: 704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31

**Source-pinned files and symbols**

- None

**Root cause**

Rollback ownership is established after a fallible verification phase rather than immediately after successful spawn.

**Cross-area dependencies**

- Distinct from BWS118-R06-001: this occurs with a single starter

**Minimal fix boundary**

Create an immediate provisional process record, keep the ChildProcess owned until verification completes, persist initializing/ambiguous ownership before detachment, and make rollback record any child whose exit cannot be verified.

**Required tests**

- Verification failure after successful spawn
- Parent SIGTERM during each startup stage
- Child starts slowly but survives timeout
- Logging or evidence failure after spawn
- Restart after provisional/ambiguous ownership

**Regression risk**

- Persisting provisional state must not let status classify unverified children as ready
- Detachment timing changes can affect operator shell behavior

**Unchanged areas**

- Child command tokens and /proc verification logic remain unchanged
- No process was spawned in the review

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R06/BWS118-R06-report.md and cumulative Wave 02 ledger`

## BWS118-R06-005 | P1 | Stale-state recovery deletes ownership and starts replacements even when cleanup failed

- **Aliases:** `none`
- **Source reports:** `BWS118-R06`
- **Source areas:** `R06`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R06`
- **Secondary areas:** `R03, R10, R11, R23`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Recovery must preserve ambiguous ownership and refuse replacement until every prior owner is verified absent or transferred under a fenced generation.

**Trigger**

Call start against partial state where shutdownManagedProcesses throws.

**Current behavior**

cleanupManagedProcesses swallows the error; start then deletes state and launches a fresh stack.

**Expected behavior**

Recovery must preserve ambiguous ownership and refuse replacement until every prior owner is verified absent or transferred under a fenced generation.

**Impact**

The system can intentionally lose the only durable record for live children and create overlapping service generations.

**Evidence**

- The source has an unconditional rmSync and replacement transition after a catch-all cleanup helper that suppresses failure.
- State-machine analysis: DEGRADED_OLD -> CLEANUP_FAILED should be terminal/blocked. Current code forces DEGRADED_OLD -> STATE_DELETED -> NEW_START regardless of the old owner outcome.

**Current files and symbols**

- packages/bootstrap/src/operations/operator-lifecycle.ts :: startManagedBwsOperatorStack / cleanupManagedProcesses :: 246-260; 740-749 :: 704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- packages/bootstrap/src/operations/operator-lifecycle.ts :: shutdownManagedProcesses :: 752-771 :: 704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31

**Source-pinned files and symbols**

- None

**Root cause**

Recovery prioritizes replacement progress over preservation of ambiguous ownership.

**Cross-area dependencies**

- BWS118-R06-011 describes the shutdown mechanism; this finding owns the unsafe recovery transition after that failure

**Minimal fix boundary**

Return a cleanup result per PID, retain state and evidence for any ambiguous/live owner, prohibit replacement without a fenced takeover, and provide an explicit operator-reviewed recovery action for irreconcilable ownership.

**Required tests**

- First child ignores SIGTERM
- Later child remains live after an earlier timeout
- Mixed missing/running process set
- Cleanup throws from process signal or /proc read
- Recovery retry after partial termination

**Regression risk**

- A stricter block may require an emergency operator workflow
- Do not erase evidence needed to diagnose old generations

**Unchanged areas**

- Normal already-running detection remains unchanged
- No stale state was mutated during review

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R06/BWS118-R06-report.md and cumulative Wave 02 ledger`

## BWS118-R06-006 | P1 | Lifecycle timeout settings are per-step rather than one aggregate deadline

- **Aliases:** `none`
- **Source reports:** `BWS118-R06`
- **Source areas:** `R06`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R06`
- **Secondary areas:** `R01, R03, R10, R11, R23`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

A caller-specified aggregate deadline must bound the whole lifecycle command, with remaining time passed to each stage and a consistent supervisor budget.

**Trigger**

Consume most of the configured timeout in multiple sequential stages.

**Current behavior**

The same timeout is restarted for every child and the API. Stop similarly restarts its timeout per child. The root synchronous command has no deadline.

**Expected behavior**

A caller-specified aggregate deadline must bound the whole lifecycle command, with remaining time passed to each stage and a consistent supervisor budget.

**Impact**

Commands can exceed operator and systemd budgets by multiples, be killed externally in partial states, or hang indefinitely without a terminal lifecycle record.

**Evidence**

- With four descriptors plus API observability, the default theoretical start budget is approximately 300 seconds versus TimeoutStartSec=120. Stop can consume one full timeout for each distinct PID.
- State-machine analysis: There is no monotonic aggregate deadline carried through INITIALIZING and STOPPING. External timeout becomes the de facto transition owner and can interrupt between side effects and state publication.

**Current files and symbols**

- packages/bootstrap/src/operations/operator-lifecycle.ts :: spawnAndPersistLifecycleState / waitForManagedApiObservable / shutdownManagedProcesses :: 454-496; 752-771 :: 704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- deployment/systemd-user/bws-operator.service.template :: service timeout contract :: 6-17 :: ea4b7762d1c747f25f2cd9a779ef05e44ea25a2c026363461f85fe6608d64b4c
- scripts/bws-root-wrapper-runtime.mjs :: runCommand :: 670-680 :: 1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8

**Source-pinned files and symbols**

- None

**Root cause**

Timeouts are modeled as local polling limits rather than one composed lifecycle budget.

**Cross-area dependencies**

- BWS116-R01-007 owns upstream pass deadline composition
- BWS116-R03-005 owns psql timeout/cancellation
- BWS116-R03-011 owns scheduler/worker pass cancellation

**Minimal fix boundary**

Create a monotonic command deadline, pass remaining budget to spawn verification, probes, child drain/exit, and wrapper subprocesses, reserve cleanup time, and align systemd and evidence-command margins with that single budget.

**Required tests**

- Four slow child starts plus API probe
- Multiple slow child exits
- Outer systemd timeout before inner command deadline
- Wrapper child process that never exits
- Deadline expiration at each transition boundary

**Regression risk**

- Tighter aggregate limits may expose current initialization latency
- Cleanup needs a reserved bounded budget rather than being skipped at deadline

**Unchanged areas**

- Existing per-probe AbortController cleanup remains unchanged
- No service or systemd unit was invoked

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R06/BWS118-R06-report.md and cumulative Wave 02 ledger`

## BWS118-R06-007 | P1 | API health, readiness, and metrics can remain green from declarations and stale state files after child failure

- **Aliases:** `none`
- **Source reports:** `BWS118-R06`
- **Source areas:** `R06`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R06`
- **Secondary areas:** `R03, R05, R07, R11, R23`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Health must describe current liveness, readiness must require every necessary service and durable dependency for the exact runtime generation, and metrics must not promote stale files to running.

**Trigger**

Query health/readiness/metrics after process loss or stale-file retention.

**Current behavior**

Several components remain pass by construction. Metrics reports API ready and reads lifecycle values directly from files. No PID/token/start-tick/source-generation check is performed in these snapshots.

**Expected behavior**

Health must describe current liveness, readiness must require every necessary service and durable dependency for the exact runtime generation, and metrics must not promote stale files to running.

**Impact**

The API can remain HTTP 200 and systemd/operator evidence can remain green after scheduler, worker, convergence, database, or lifecycle ownership has failed.

**Evidence**

- Static tracing shows no current-process authority in snapshot construction. Focused tests validate object shape and declared policy rather than adversarial process loss.
- State-machine analysis: RUNNING/READY is reconstructed from declarations and last-written files rather than current generation-bound observations, so process death has no mandatory transition to DEGRADED.

**Current files and symbols**

- packages/bootstrap/src/operations/service-runtime.ts :: createBwsOperationalStatusSnapshot :: 330-417 :: 5ef569931413868cf0b2e69a653ee65cdcace9bb561f52eea1d9fb82e3ce93f3
- packages/bootstrap/src/operations/observability.ts :: createBwsMetricsSnapshot :: 442-527 :: ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- packages/bootstrap/src/api/bws-read-only-query-http.ts :: health and readiness routes :: 125-153 :: fc644a168e07d1afa63d84fa85582cda9c37994b2b4d66ea7366c1f442c7ac17
- tests/bws-service-runtime.test.ts :: operational status snapshot tests :: 120-200 :: 6d6e726a0a688c6d673457287173d07a5359caf9ce4c09dde73b2dcb938d63cc

**Source-pinned files and symbols**

- None

**Root cause**

Health/readiness aggregation does not consume the lifecycle owner as authoritative current state.

**Cross-area dependencies**

- BWS116-R03-007 through R03-012 remain owners of durable transition defects exposed by this projection

**Minimal fix boundary**

Build health/readiness from verified lifecycle ownership, exact runtime IDs/source generation, database compatibility/connectivity, loop service checkpoints and freshness, and API request-serving state. Make stale/unknown explicit and fail closed.

**Required tests**

- Kill each managed child then query all three endpoints
- Stale state file with reused PID
- Database unavailable after startup
- Runtime ID mismatch across state files
- Loop last-success age exceeds policy
- API listener alive but query dependencies failed

**Regression risk**

- Do not make external BWS-600 upstream availability equivalent to local process liveness
- Health and readiness may need different strictness but must share current authority

**Unchanged areas**

- No claim is made that the cockpit-only check is itself incorrect
- The API remains read-only and loopback-bound

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R06/BWS118-R06-report.md and cumulative Wave 02 ledger`

## BWS118-R06-008 | P1 | The root runtime summary is disconnected from production lifecycle evidence, process verification, and HTTP envelopes

- **Aliases:** `none`
- **Source reports:** `BWS118-R06`
- **Source areas:** `R06`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R06`
- **Secondary areas:** `R05, R07, R10, R11, R12`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

The summary must call or reuse the authoritative lifecycle status path, verify every managed process and generation, consume the actual response schemas, and locate immutable evidence through a canonical index/pointer.

**Trigger**

Run the root runtime summary against production envelopes or a state file with no current process ownership.

**Current behavior**

Production nested envelopes are classified degraded. Conversely, test-shaped top-level envelopes plus raw state and hand-written latest files can be classified ready without any process records.

**Expected behavior**

The summary must call or reuse the authoritative lifecycle status path, verify every managed process and generation, consume the actual response schemas, and locate immutable evidence through a canonical index/pointer.

**Impact**

Operator tooling can hide a healthy production API, or more dangerously, report ready for a nonexistent/stale stack. This undermines check_progress and acceptance routing.

**Evidence**

- The inert wrapper harness produced production-envelope condition=degraded and test-envelope-no-processes condition=ready. Source search found no lifecycle production writer for the expected latest.json path.
- State-machine analysis: The root wrapper implements a second, incompatible readiness authority. Its READY transition is reachable from synthetic files and schemas that the production owner does not generate.

**Current files and symbols**

- scripts/bws-root-wrapper-runtime.mjs :: runtime summary constants / buildRuntimeSummary / classifyRuntimeCondition :: 8-13; 320-386; 511-542 :: 1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8
- packages/bootstrap/src/api/bws-read-only-query-http.ts :: health and readiness response envelopes :: 128-153 :: fc644a168e07d1afa63d84fa85582cda9c37994b2b4d66ea7366c1f442c7ac17
- packages/bootstrap/src/operations/operator-lifecycle.ts :: resolveLifecycleEvidenceFilePath :: 913-927 :: 704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- tests/root-wrapper-runtime.test.ts :: createRuntimeFixture :: 302-423 :: f216fabdae694a4848855786d665f2ac05e627648d7332d0b1e37c45dc9d22c3

**Source-pinned files and symbols**

- None

**Root cause**

Operator summary logic duplicated lifecycle and HTTP contracts instead of consuming their typed, generation-bound authority.

**Cross-area dependencies**

- No inherited Wave 01 finding owns this root-wrapper schema/authority divergence

**Minimal fix boundary**

Make runtime-summary invoke a read-only lifecycle status API/module or parse its exact schema, verify process ownership and source generation, use the evidence index for immutable latest selection, and reject missing process arrays or runtime-ID mismatches.

**Required tests**

- Production /health and /readiness envelope fixtures generated by the actual handler
- State file with no processes
- Stale process records and missing latest pointer
- Concurrent evidence index update
- Runtime ID/source generation mismatch
- check_progress exit/status behavior for ready, degraded, blocked, not-running

**Regression risk**

- Changing wrapper output keys can affect automation parsers
- A canonical latest pointer must be written atomically or derived deterministically from the evidence index

**Unchanged areas**

- Automation artifact reporting before runtime-summary remains unchanged
- The wrapper loopback request timeout remains bounded

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R06/BWS118-R06-report.md and cumulative Wave 02 ledger`

## BWS118-R06-009 | P1 | CLI exit codes and the oneshot systemd unit remain successful while the managed stack is degraded or gone

- **Aliases:** `none`
- **Source reports:** `BWS118-R06`
- **Source areas:** `R06`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R06`
- **Secondary areas:** `R07, R09, R10, R11, R23`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Supervisor success and active/readiness state must reflect the current generation-bound managed process set. Degraded/not-running status must be machine-visible as non-success.

**Trigger**

Query systemd state or reload after child failure.

**Current behavior**

The oneshot unit remains active after its command exits and has no MainPID supervising detached children. CLI status returns 0 for every non-exception result.

**Expected behavior**

Supervisor success and active/readiness state must reflect the current generation-bound managed process set. Degraded/not-running status must be machine-visible as non-success.

**Impact**

systemctl can report active and reload success when no BWS service is running, defeating restart policy, monitoring, and deployment acceptance.

**Evidence**

- This follows directly from systemd semantics combined with detached children and unconditional CLI zero exit.
- State-machine analysis: SYSTEMD_ACTIVE is transitioned by successful oneshot completion and never coupled to CHILD_RUNNING/STACK_READY. The CLI erases semantic outcomes at the process boundary.

**Current files and symbols**

- packages/bootstrap/src/cli/bws-operator-lifecycle.ts :: runBwsOperatorLifecycleCli :: 8-30 :: b17dff2d4e4012091b01943761efa1fe593c3de159e318b7fece264e751bedb5
- deployment/systemd-user/bws-operator.service.template :: systemd user service :: 6-17 :: ea4b7762d1c747f25f2cd9a779ef05e44ea25a2c026363461f85fe6608d64b4c
- packages/bootstrap/src/operations/operator-lifecycle.ts :: getManagedBwsOperatorStackStatus :: 266-300 :: 704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31

**Source-pinned files and symbols**

- None

**Root cause**

The deployment unit supervises a control command, not the runtime, and the CLI treats serialization as success rather than mapping state to exit status.

**Cross-area dependencies**

- BWS118-R06-007 and R06-008 describe false state sources; this finding owns supervisor/CLI propagation

**Minimal fix boundary**

Use a long-running foreground supervisor as the systemd MainPID or create explicit target units per process with dependencies. Map status/readiness outcomes to documented nonzero exit codes and add a watchdog/restart policy bound to exact lifecycle state.

**Required tests**

- Child exits after oneshot start
- All children missing while unit remains active
- ExecReload under degraded/not_running
- systemd restart and stop during partial state
- Exit-code matrix for every lifecycle outcome

**Regression risk**

- Service topology changes affect packaging and deployment scripts
- Do not let systemd restart externally blocked BWS-600 work automatically

**Unchanged areas**

- No systemd command was run
- Execution and provider connections remain disabled

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R06/BWS118-R06-report.md and cumulative Wave 02 ledger`

## BWS118-R06-010 | P1 | Shutdown uses startup role order instead of scheduler-stop, worker-drain, convergence, cockpit, API order

- **Aliases:** `none`
- **Source reports:** `BWS118-R06`
- **Source areas:** `R06`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R06`
- **Secondary areas:** `R03, R07, R11, R23`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

First prevent new scheduling, then allow/fence worker drain, then stop convergence, cockpit, and API while preserving status visibility until completion.

**Trigger**

Invoke stop on the managed stack.

**Current behavior**

SIGTERM is sent to upstream convergence first, then scheduler, worker, cockpit/API process.

**Expected behavior**

First prevent new scheduling, then allow/fence worker drain, then stop convergence, cockpit, and API while preserving status visibility until completion.

**Impact**

New scheduling can race with disappearing convergence, workers are signaled before an explicit drain contract is observed, and shutdown evidence cannot prove no lost or late work.

**Evidence**

- The role order and contract are directly contradictory. The test reinforces the wrong order.
- State-machine analysis: The lifecycle has no distinct STOP_SCHEDULING -> DRAINING -> CONVERGENCE_STOPPED sequence; it applies a generic TERM loop in startup order.

**Current files and symbols**

- packages/bootstrap/src/operations/operator-lifecycle.ts :: LIFECYCLE_ROLE_ORDER / shutdownManagedProcesses :: 52-58; 752-771 :: 704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- docs/035_continuous_service_supervisor_contract.md :: BWS-584 ordered shutdown :: 91-103 :: cae4ce541c65848974de8c4568e72b6d2d3d151d9f2c3eaf52cb50e6777c8505
- tests/bws-operator-lifecycle.test.ts :: shutdown order assertion :: 190-198 :: ff44f4a8b802187d11c4b9eb4d84cfc15570107a9080c27cfd0f48123a74a9e6

**Source-pinned files and symbols**

- None

**Root cause**

Startup/status presentation order was reused as shutdown dependency order.

**Cross-area dependencies**

- BWS116-R03-008 through R03-011 own durable lease and pass-cancellation mechanics

**Minimal fix boundary**

Define an explicit shutdown DAG/state machine, issue scheduler quiesce first, wait for a bounded worker drain/lease handoff, then stop convergence, cockpit, and API, with per-stage evidence and fallback escalation.

**Required tests**

- Scheduler attempts a new cycle during shutdown
- Worker owns a lease during shutdown
- Drain completes and drain times out
- Convergence pass in flight while workers finish
- Exact signal/order/evidence assertions

**Regression risk**

- Current loop signal behavior may not expose a separate quiesce/drain API and may need bounded contract changes
- Preserve the API until status/evidence publication is complete

**Unchanged areas**

- The documented shutdown order is unchanged
- No worker lease or database was touched

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R06/BWS118-R06-report.md and cumulative Wave 02 ledger`

## BWS118-R06-011 | P1 | One hung child aborts shutdown before remaining owned children are signaled

- **Aliases:** `none`
- **Source reports:** `BWS118-R06`
- **Source areas:** `R06`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R06`
- **Secondary areas:** `R03, R10, R11, R23`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

All owned processes should receive their stage-appropriate stop/quiesce signal, failures should be accumulated, escalation should be bounded, and retained state should identify every unresolved owner.

**Trigger**

Stop a stack whose first selected process does not exit.

**Current behavior**

The first timeout throws. Later children are never signaled, no aggregate result is emitted, and the state remains as it was before stop.

**Expected behavior**

All owned processes should receive their stage-appropriate stop/quiesce signal, failures should be accumulated, escalation should be bounded, and retained state should identify every unresolved owner.

**Impact**

A single hung service prevents API, worker, scheduler, and other processes from stopping, causes systemd timeout, and leaves no complete shutdown diagnosis.

**Evidence**

- The sequential await and throwing waitForManagedProcessExit path have no continue/finally or aggregate failure structure.
- State-machine analysis: STOPPING(role1) -> TIMEOUT exits the state machine instead of recording role1 unresolved and progressing through the bounded stop plan.

**Current files and symbols**

- packages/bootstrap/src/operations/operator-lifecycle.ts :: shutdownManagedProcesses :: 752-771 :: 704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- packages/bootstrap/src/operations/operator-lifecycle.ts :: stopManagedBwsOperatorStack :: 303-330 :: 704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31

**Source-pinned files and symbols**

- None

**Root cause**

Shutdown is fail-fast at the first child rather than best-effort, fenced, and exhaustively accounted.

**Cross-area dependencies**

- BWS118-R06-005 owns unsafe recovery after this failure

**Minimal fix boundary**

Use a dependency-aware bounded shutdown coordinator that signals all eligible roles, records per-PID outcomes, escalates TERM to an explicitly approved fallback only after identity revalidation, preserves unresolved ownership, and returns an aggregate degraded-stop result.

**Required tests**

- First child ignores TERM
- Middle child times out after earlier exits
- Multiple children fail
- Signal throws ESRCH/EPERM
- Aggregate state/evidence and second-stop convergence

**Regression risk**

- Concurrent signaling must preserve dependency order where drain matters
- Escalation policy must not kill unrelated/reused PIDs

**Unchanged areas**

- No automatic SIGKILL is currently present
- State is retained on the direct stop exception, which remains a partial safeguard

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R06/BWS118-R06-report.md and cumulative Wave 02 ledger`

## BWS118-R06-012 | P1 | Stop signaling and exit waits are vulnerable to PID reuse after the initial /proc verification

- **Aliases:** `none`
- **Source reports:** `BWS118-R06`
- **Source areas:** `R06`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R06`
- **Secondary areas:** `R10, R11, R23`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Identity must be revalidated immediately before every signal and throughout exit verification using start ticks/token/cwd/cmdline or pidfd-style ownership.

**Trigger**

Race process termination/PID reuse between inspectManagedProcesses and process.kill or during waitForManagedProcessExit.

**Current behavior**

A stale PID can be signaled after a prior snapshot, and a replacement process can keep the exit loop alive until timeout. The initial strong /proc proof is not carried through the destructive boundary.

**Expected behavior**

Identity must be revalidated immediately before every signal and throughout exit verification using start ticks/token/cwd/cmdline or pidfd-style ownership.

**Impact**

An unrelated local process can receive SIGTERM, or stop can fail/hang while waiting for a replacement PID. This violates the no-unrelated-process-mutation contract.

**Evidence**

- Static TOCTOU proof exists between inspection and signal. The wait helper accepts only a numeric PID.
- State-machine analysis: VERIFIED_OWNER(pid,startTicks) degrades to numeric pid before the destructive transition. PID reuse creates an ABA state that the wait loop cannot distinguish.

**Current files and symbols**

- packages/bootstrap/src/operations/operator-lifecycle.ts :: inspectManagedProcesses / shutdownManagedProcesses :: 752-790 :: 704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- packages/bootstrap/src/operations/operator-lifecycle.ts :: readProcessSnapshot / waitForManagedProcessExit :: 1037-1062; 1150-1158 :: 704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31

**Source-pinned files and symbols**

- None

**Root cause**

Strong process identity is implemented for observation but discarded for signal and completion operations.

**Cross-area dependencies**

- No inherited finding owns the lifecycle signal ABA race

**Minimal fix boundary**

Pass the full process record to signal/wait, re-read and compare /proc immediately before TERM and each poll, use pidfd where available, treat identity change as original owner exited, and never signal a mismatched replacement.

**Required tests**

- Synthetic process-runtime adapter simulating PID reuse before signal
- PID reuse during exit wait
- Command/token/cwd/start-tick mismatch
- ESRCH after verification
- pidfd and /proc fallback behavior

**Regression risk**

- Frequent /proc reads must handle transient disappearance without converting it into failure
- Cross-platform behavior must fail closed where exact identity cannot be proved

**Unchanged areas**

- Existing /proc command, cwd, token, and start-tick checks are intentional safeguards
- No signal was sent during review

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R06/BWS118-R06-report.md and cumulative Wave 02 ledger`

## BWS118-R06-013 | P1 | API listener and request promises lack one bounded, exception-safe ownership boundary

- **Aliases:** `none`
- **Source reports:** `BWS118-R06`
- **Source areas:** `R06`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R06`
- **Secondary areas:** `R05, R10, R11, R23`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

All request promises, listener errors, sockets, and close work must be owned by one boundary that catches failures, aborts in-flight work, closes within a deadline, publishes terminal state, and settles application.closed exactly once.

**Trigger**

Throw from metricsSnapshotFactory, send SIGTERM with an open request/socket, or throw during shutdown event emission.

**Current behavior**

An async request rejection can become unhandled and leave the client hanging. Signal callbacks use void close. server.close can wait indefinitely, and a pre-close logging exception occurs before closePromise is assigned.

**Expected behavior**

All request promises, listener errors, sockets, and close work must be owned by one boundary that catches failures, aborts in-flight work, closes within a deadline, publishes terminal state, and settles application.closed exactly once.

**Impact**

API shutdown can hang the stack, errors can bypass HTTP responses and lifecycle evidence, and late requests can complete after stop/replacement.

**Evidence**

- An inert harness made metricsSnapshotFactory throw: the client had to abort and Node emitted unhandledRejection=inert-metrics-failure. Static tracing confirms no close deadline or socket/request registry.
- State-machine analysis: LISTENING -> CLOSING has unowned entry paths, and REQUEST_ACTIVE has no cancellation relation to CLOSING. A rejection can escape without moving the API to FAILED/CLOSED.

**Current files and symbols**

- packages/bootstrap/src/operations/runtime-applications.ts :: startBwsReadOnlyApiApplication / close / closeHttpServer :: 190-300; 863-889 :: 216b980403a59909b07a27fb475d22cf6ee35b41364fd0bb46c510d17d9e0322
- packages/bootstrap/src/api/bws-read-only-query-http.ts :: createBwsReadOnlyQueryHttpHandler :: 110-218 :: fc644a168e07d1afa63d84fa85582cda9c37994b2b4d66ea7366c1f442c7ac17
- packages/bootstrap/src/operations/runtime-applications.ts :: createManagedRuntimeRequestHandler metrics and async dispatch :: 617-674 :: 216b980403a59909b07a27fb475d22cf6ee35b41364fd0bb46c510d17d9e0322
- packages/bootstrap/src/cli/bws-read-only-api.ts :: runBwsReadOnlyApiCli :: 16-39 :: 5e08f4cc0b5f76a7c5c04e735c791281607fa007031c55b2dc0bf38c9d4cf811

**Source-pinned files and symbols**

- None

**Root cause**

Listener, request, logging, and close resources are composed as independent promises rather than one lifecycle-owned abort/error boundary.

**Cross-area dependencies**

- BWS116-R03-005 owns psql cancellation; BWS116-R03-011 owns scheduler/worker in-flight cancellation

**Minimal fix boundary**

Install error/signal ownership before listen is exposed, wrap every async request path, assign an idempotent close promise before fallible work, track sockets and requests, abort/stop admission on close, apply an aggregate deadline, and settle closed with a recorded success/failure exactly once.

**Required tests**

- Throwing metrics/status/cockpit/logger callbacks
- Open keep-alive and partial-body requests during SIGTERM
- Concurrent close calls and two signals
- server.close error and timeout
- Request completion after replacement generation starts
- application.closed resolution/rejection contract

**Regression risk**

- Force-closing sockets can truncate legitimate read responses; define grace then abort
- Changing closed rejection semantics affects CLI error propagation

**Unchanged areas**

- Loopback-only bind and GET-only query policy remain unchanged
- No non-loopback network was contacted

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R06/BWS118-R06-report.md and cumulative Wave 02 ledger`

## BWS118-R06-014 | P2 | Successful service passes leave timeout timers alive until their full configured duration

- **Aliases:** `none`
- **Source reports:** `BWS118-R06`
- **Source areas:** `R06`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R06`
- **Secondary areas:** `R01, R03, R11`
- **Repository severity:** `P2`
- **Normalized severity:** `P2`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

The losing timeout branch must be cancelled and released immediately, or use an unrefed/abortable deadline that cannot hold process liveness.

**Trigger**

Run a fast pass with a multi-second timeout and allow the service function to return.

**Current behavior**

Every successful pass leaves its timer pending. Repeated passes accumulate active timers; the final one can keep Node alive after the function returns.

**Expected behavior**

The losing timeout branch must be cancelled and released immediately, or use an unrefed/abortable deadline that cannot hold process liveness.

**Impact**

Shutdown and test processes are delayed, timer count grows with pass rate, and outer lifecycle timeouts can expire after logical completion.

**Evidence**

- The inert worker harness returned in 21.64 ms with a 2500 ms pass timeout, but process wall time exceeded the control by about 2.30 seconds, matching the pending timer.
- State-machine analysis: PASS_COMPLETED releases business work but not the timeout resource. Resource cleanup is not coupled to the race settlement.

**Current files and symbols**

- packages/bootstrap/src/operations/upstream-convergence-service.ts :: raceWithTimeout :: 504-526 :: 937ad8b789002504b674351c04e2179ba2800e17deea1d5e17aa0dd31786d5a8
- packages/bootstrap/src/operations/private-paper-scheduler-service.ts :: raceWithTimeout :: 531-553 :: 876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967
- packages/bootstrap/src/operations/private-paper-worker-service.ts :: raceWithTimeout :: 552-574 :: 1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36

**Source-pinned files and symbols**

- None

**Root cause**

The timeout helper uses a bare sleep promise whose timer handle is inaccessible to the winner path.

**Cross-area dependencies**

- Distinct from BWS116-R01-007 and BWS116-R03-011: those own uncancelled underlying work, while this finding owns the losing timer handle

**Minimal fix boundary**

Replace sleepFor race with an abortable timeout helper that clears its handle in finally, and ensure late pass handling remains owned under the R01/R03 cancellation contracts.

**Required tests**

- Fast pass with long timeout
- Thousands of quick passes with active-handle count
- Shutdown immediately after pass completion
- Timeout winner and pass rejection races
- No double settlement or unhandled rejection

**Regression risk**

- Do not accidentally stop observing the underlying pass when the timeout wins
- Timer unref alone does not solve late work ownership

**Unchanged areas**

- Pass classification semantics remain unchanged
- No provider or database work was executed

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R06/BWS118-R06-report.md and cumulative Wave 02 ledger`

## BWS118-R06-015 | P1 | Unexpected pass failures exit without a terminal service state or failure evidence

- **Aliases:** `none`
- **Source reports:** `BWS118-R06`
- **Source areas:** `R06`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R06`
- **Secondary areas:** `R01, R03, R07, R11`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

The service must transition to failed/unknown with timestamp, error class, current pass, process generation, and terminal evidence before returning/rethrowing; status must not report running.

**Trigger**

Reject the pass promise after service_started and pass-start state are written.

**Current behavior**

The rejection escapes. Signal listeners are disposed, but the durable state remains lifecycleState=running and no failure/stop evidence is written.

**Expected behavior**

The service must transition to failed/unknown with timestamp, error class, current pass, process generation, and terminal evidence before returning/rethrowing; status must not report running.

**Impact**

Status and metrics can falsely report a dead service as running; restart sees stale state without the failure cause; incident evidence is incomplete.

**Evidence**

- The inert worker harness rejected one pass. It returned an error while state remained running, totalPassCount=0, hasLastPass=false, and only the service_started evidence existed.
- State-machine analysis: RUNNING -> PASS_STARTED -> exception has no transition. The process exits, but durable state remains at the prior nonterminal node.

**Current files and symbols**

- packages/bootstrap/src/operations/upstream-convergence-service.ts :: runBwsUpstreamConvergenceService :: 301-414 :: 937ad8b789002504b674351c04e2179ba2800e17deea1d5e17aa0dd31786d5a8
- packages/bootstrap/src/operations/private-paper-scheduler-service.ts :: runBwsPrivatePaperSchedulerService :: 305-421 :: 876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967
- packages/bootstrap/src/operations/private-paper-worker-service.ts :: runBwsPrivatePaperWorkerService :: 317-451 :: 1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36

**Source-pinned files and symbols**

- None

**Root cause**

Only expected result variants are modeled; unexpected exceptions are treated as process errors without durable lifecycle finalization.

**Cross-area dependencies**

- BWS116-R03-011 owns cancellation of in-flight scheduler/worker work; this finding owns durable service terminality after an exception

**Minimal fix boundary**

Add failed/unknown terminal states and a top-level catch/finally that records sanitized failure evidence and state exactly once, while preserving the original error and any ambiguous in-flight operation identity.

**Required tests**

- Rejected pass promise
- State write failure after pass
- Evidence/logger failure after state write
- Exception during classification
- Restart/status from failed and unknown states

**Regression risk**

- Failure finalization itself can fail and needs a bounded fallback record
- Do not misclassify a timed-out but still-running pass as safely failed

**Unchanged areas**

- Expected BoundaryResult blocker/retry outcomes remain unchanged
- No persistent state outside the disposable harness was written

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R06/BWS118-R06-report.md and cumulative Wave 02 ledger`

## BWS118-R06-016 | P1 | Millisecond evidence filenames collide across legitimate lifecycle events and can crash the service

- **Aliases:** `none`
- **Source reports:** `BWS118-R06`
- **Source areas:** `R06`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R06`
- **Secondary areas:** `R03, R07, R11, R12`
- **Repository severity:** `P1`
- **Normalized severity:** `P1`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `true`

**Invariant**

Evidence identity must include a collision-resistant runtime generation and monotonic event sequence/UUID, with atomic no-overwrite publication and deterministic index linkage.

**Trigger**

Run startup and a fast pass, or two status commands, with the same generatedAt millisecond.

**Current behavior**

The second legitimate event targets the same path and throws. State may already have advanced before evidence publication fails.

**Expected behavior**

Evidence identity must include a collision-resistant runtime generation and monotonic event sequence/UUID, with atomic no-overwrite publication and deterministic index linkage.

**Impact**

A fast service can crash on its first pass, concurrent status can fail, and state/evidence diverge. Restart and acceptance trails become incomplete.

**Evidence**

- The inert convergence harness fixed now() to one timestamp. service_started wrote the first run-running file; pass_completed attempted the same path and threw already exists.
- State-machine analysis: STATE_WRITTEN -> EVIDENCE_WRITE can fail for a normal event identity collision. There is no atomic aggregate or recovery index to reconcile the advanced state with missing evidence.

**Current files and symbols**

- packages/bootstrap/src/operations/upstream-convergence-service.ts :: writeEvidenceRecord / resolveEvidenceFilePath :: 873-900 :: 937ad8b789002504b674351c04e2179ba2800e17deea1d5e17aa0dd31786d5a8
- packages/bootstrap/src/operations/private-paper-scheduler-service.ts :: writeEvidenceRecord / resolveEvidenceFilePath :: 895-921 :: 876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967
- packages/bootstrap/src/operations/private-paper-worker-service.ts :: writeEvidenceRecord / resolveEvidenceFilePath :: 954-972 :: 1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36
- packages/bootstrap/src/operations/operator-lifecycle.ts :: writeLifecycleEvidence / resolveLifecycleEvidenceFilePath :: 913-927 :: 704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31

**Source-pinned files and symbols**

- None

**Root cause**

Wall-clock millisecond plus low-cardinality fields is used as a uniqueness key rather than a timestamp attribute.

**Cross-area dependencies**

- No inherited root cause owns lifecycle evidence filename uniqueness

**Minimal fix boundary**

Add runtimeId plus a monotonic event counter or UUID to evidence IDs, use atomic create, update an append/index record only after durable artifact publication, and define recovery when state exists without its evidence event.

**Required tests**

- Fixed clock startup plus pass completion
- Concurrent status commands
- Multiple blocked/retry passes in one millisecond
- Clock regression
- State/evidence write failure reconciliation

**Regression risk**

- Changing filenames affects evidence indexes, retention, and downstream handoffs
- Sequence allocation must itself be concurrency-safe

**Unchanged areas**

- Existing no-overwrite check is an intentional safeguard against silent artifact replacement
- No repository evidence was written

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R06/BWS118-R06-report.md and cumulative Wave 02 ledger`

## BWS118-R06-017 | P2 | Health and failure diagnostics synchronously hash or read unbounded filesystem data

- **Aliases:** `none`
- **Source reports:** `BWS118-R06`
- **Source areas:** `R06`
- **Source baseline:** `betting-win-surebet118.zip` / `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- **Current source verification:** `EXACT_BWS118_MEMBER_HASH_MATCH`
- **Primary owner:** `R06`
- **Secondary areas:** `R05, R07, R11, R12`
- **Repository severity:** `P2`
- **Normalized severity:** `P2`
- **Confidence:** `CONFIRMED`
- **Consolidation status:** `CONFIRMED_UNIQUE`
- **Blocks next wave:** `false`
- **Blocks release or deployment:** `false`

**Invariant**

Hot health paths and failure reporting must use bounded cached fingerprints, bounded tail reads, capped file enumeration, and explicit stale/error states.

**Trigger**

Query health/readiness repeatedly or trigger startup diagnostics under large filesystem state.

**Current behavior**

Health recomputes the entire build digest synchronously; error-tail reads full logs; root summary enumerates all matching logs.

**Expected behavior**

Hot health paths and failure reporting must use bounded cached fingerprints, bounded tail reads, capped file enumeration, and explicit stale/error states.

**Impact**

The loopback API can block, memory can spike during failure handling, status can exceed its own deadlines, and observability work can prevent shutdown.

**Evidence**

- Static source shows unbounded synchronous reads/enumeration on production request and failure paths. No configured byte/file/depth limits exist.
- State-machine analysis: Diagnostic and health work is not budgeted as a resource-owned operation. Data growth increases latency and memory without changing configuration.

**Current files and symbols**

- packages/bootstrap/src/operations/runtime-applications.ts :: readCockpitState / fingerprintDirectory :: 190-198; 675-712 :: 216b980403a59909b07a27fb475d22cf6ee35b41364fd0bb46c510d17d9e0322
- packages/bootstrap/src/operations/operator-lifecycle.ts :: readManagedProcessStdioTail :: 1128-1147 :: 704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31
- scripts/bws-root-wrapper-runtime.mjs :: readStructuredLogFiles :: 605-615 :: 1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8

**Source-pinned files and symbols**

- None

**Root cause**

Immutable build metadata and bounded tail/index primitives exist conceptually, but production paths recompute or scan raw filesystem content.

**Cross-area dependencies**

- BWS116-R03-012 owns unbounded database reads, not these filesystem operations

**Minimal fix boundary**

Verify cockpit digest once at startup and cache it with immutable build identity, stream bounded log tails from the end, cap and page log listings, and propagate timeout/stale/error conditions without blocking the event loop.

**Required tests**

- Large cockpit asset tree
- Single multi-gigabyte child log
- Hundreds of thousands of structured logs
- Concurrent health requests
- Filesystem mutation/error during scan

**Regression risk**

- Caching must remain bound to immutable asset generation
- Bounded tails must preserve redaction and valid UTF-8 handling

**Unchanged areas**

- Current path-containment check for child logs remains unchanged
- No large-file stress harness was run to avoid resource abuse

**Documentation integration:** `docs/reviews/BWS118/wave-02/reports/R06/BWS118-R06-report.md and cumulative Wave 02 ledger`
