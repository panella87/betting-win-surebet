# Betting-win-surebet Wave 01 cumulative consolidated ledger

## Baseline and counts

```text
CURRENT_BASELINE=betting-win-surebet117.zip
CURRENT_BASELINE_SHA256=0d234e00d015dcab0989b47372ded516bddee9705d9021a0694916dc91a9d494
REVIEW_SOURCE_BASELINE=betting-win-surebet116.zip
REVIEW_SOURCE_BASELINE_SHA256=6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376
SOURCE_MEMBER_EQUIVALENCE=yes
CONFIRMED_FINDINGS=41
OPEN_P0=1
OPEN_P1=34
OPEN_P2=6
OPEN_P3=0
RELEASE_BLOCKING=40
RELEASE_OR_DEPLOYMENT_BLOCKING=41
BWS600_BLOCKING=37
B1_OR_BWS710_BLOCKING=32
PROBABLE_FINDINGS=1
HYPOTHESES=5
```

The ledger preserves every confirmed source ID. No confirmed root cause was merged or renumbered.

## BWS116-R01-001: Committed-HEAD lock derivation honors repository-local Git replacement objects

```text
ID: BWS116-R01-001
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R01"]
SOURCE_AREA_IDS: ["R01"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R01
SECONDARY_AREAS: ["R10 environment/CLI policy", "R11 aggregate validator truth"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Committed-HEAD lock derivation honors repository-local Git replacement objects
```

**Invariant:** A committed-source lock must describe the literal object graph named by the advertised commit ID, independent of repository-local replacement refs.

**Trigger:** The lock implementation resolves HEAD/tree/content with ordinary Git plumbing commands while replacement-object processing remains enabled.

**Current behavior:** The lock path does not force replacement objects off. Git can therefore report the original HEAD object name while dereferencing a replacement commit/tree for later content-oriented commands, producing a lock that is not portable proof of the named commit.

**Expected behavior:** A committed-source lock must describe the literal object graph named by the advertised commit ID, independent of repository-local replacement refs.

**Impact:** A repository-local mutable ref can make a false source view satisfy commit/package/workspace/capability checks. The resulting lock is not an immutable proof and can diverge from a clean clone of the same commit ID.

**Evidence:** ["The production lock implementation invokes Git object/plumbing operations without a replacement-object-disabled environment or an equivalent literal-object verification step.", "A bounded disposable Git harness outside the source tree demonstrated that refs/replace can leave the printed HEAD name unchanged while changing dereferenced commit/tree content."]

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/upstream/src/upstream/betting-win-upstream-lock.ts` | `generateBettingWinUpstreamLock` | `L102-L103` | `8c0badbfc3dc776eb71e01e1a76280debab30c64739274b06d1ce7343382a6c2` |

**Source-pinned files and symbols:** []

**Root cause:** The trust model treats Git's default revision resolver as a literal object reader, but default resolution includes mutable repository-local replacement refs.

**Cross-area dependencies:** []

**Minimal fix boundary:** In the upstream-lock command runner only, disable replacement-object interpretation for every identity/content operation and verify that commit, tree, and blob reads all originate from the literal advertised objects. Preserve the existing lock schema unless a compatibility version is deliberately introduced.

**Required tests:** ["Production-entrypoint test with a disposable repository containing a replacement commit and replacement blob; lock generation must reject or produce the literal original graph.", "Control test proving ordinary committed HEAD, worktree, and bare-repository forms remain accepted as intended."]

**Regression risk:** ["Git-version differences in replacement behavior", "Accidental rejection of legitimate worktrees or alternates", "Lock-schema compatibility"]

**Unchanged areas:** ["BWS API intake", "Convergence persistence", "betting-win source"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R01/BWS116-R01-report.md and cumulative Wave 01 ledger

## BWS116-R01-002: Upstream lock is assembled from multiple unconstrained HEAD observations rather than one pinned object graph

```text
ID: BWS116-R01-002
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R01"]
SOURCE_AREA_IDS: ["R01"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R01
SECONDARY_AREAS: ["R03 generic persistence only if a mixed lock is stored", "R11 validator truth"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Upstream lock is assembled from multiple unconstrained HEAD observations rather than one pinned object graph
```

**Invariant:** All lock fields must be derived from one explicitly pinned commit/tree snapshot, or generation must fail when the repository moves.

**Trigger:** HEAD, tree, tracked-file fingerprint, package/workspace data, or capabilities are resolved by separate Git/filesystem operations without first pinning and reusing one immutable commit object and without a final same-object check.

**Current behavior:** The lock is composed across multiple observations. A concurrent branch update can mix identity from one revision with tree/content/fingerprint evidence from another, and the final record does not prove atomicity of the source view.

**Expected behavior:** All lock fields must be derived from one explicitly pinned commit/tree snapshot, or generation must fail when the repository moves.

**Impact:** A syntactically valid lock can bind mutually inconsistent source facts, causing false compatibility acceptance or nondeterministic failures across reruns.

**Evidence:** ["Static call tracing shows separate command boundaries for repository, HEAD/tree, tracked content, and package/capability derivation.", "No lock-generation transaction, object-directory snapshot, single-commit pathspec enumeration, or final equality guard makes those observations atomic."]

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/upstream/src/upstream/betting-win-upstream-lock.ts` | `generateBettingWinUpstreamLock` | `L102-L103` | `8c0badbfc3dc776eb71e01e1a76280debab30c64739274b06d1ce7343382a6c2` |

**Source-pinned files and symbols:** []

**Root cause:** The implementation pins a branch name operationally, not a single object graph used as the sole input to every derived field.

**Cross-area dependencies:** []

**Minimal fix boundary:** Resolve one literal commit object once, derive tree and every committed file from that object ID, and fail if any required filesystem-derived datum cannot be read from the same commit. Add a final guard only as defense in depth, not as the primary snapshot mechanism.

**Required tests:** ["Instrumented disposable-repository test that advances the branch between each Git subprocess and proves either stable old/new lock output or fail-closed behavior, never a mixed record.", "Test uncommitted and untracked changes remain excluded without reading mutable worktree files."]

**Regression risk:** ["Changing accepted worktree behavior", "Performance on large tracked trees", "Windows path/case behavior"]

**Unchanged areas:** ["External runtime HTTP contract", "B1 resource semantics", "betting-win source"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R01/BWS116-R01-report.md and cumulative Wave 01 ledger

## BWS116-R01-003: API convergence records completion metadata but not the exact records later consumed

```text
ID: BWS116-R01-003
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R01"]
SOURCE_AREA_IDS: ["R01"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R01
SECONDARY_AREAS: ["R03 transaction and checkpoint mechanics", "R07 BWS-600 evidence publication", "R12 controller lifecycle"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: API convergence records completion metadata but not the exact records later consumed
```

**Invariant:** The records evaluated downstream must be the exact byte- or record-set snapshot whose pagination and convergence checks completed, or the later query must create and validate a new cycle.

**Trigger:** Convergence persists counts/cursors/currentness metadata and the downstream runtime subsequently issues a fresh API query instead of consuming an immutable page/record set bound to that cycle.

**Current behavior:** The cycle's durable representation does not retain or content-address the complete page records. Downstream work can therefore evaluate a different live response while attributing readiness/provenance to the earlier completed cycle.

**Expected behavior:** The records evaluated downstream must be the exact byte- or record-set snapshot whose pagination and convergence checks completed, or the later query must create and validate a new cycle.

**Impact:** BWS-600 can report convergence for one dataset and process another. Corrections, deletions, insertions, or reordering between the two reads create unprovable and potentially incomplete surebet inputs.

**Evidence:** ["The convergence operation returns/persists page metadata and cursor/count state rather than an immutable record payload or content-addressed manifest.", "Call tracing from the convergence service to downstream scheduling/worker intake shows a later read of the live API boundary rather than replay of the completed cycle's exact records."]

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/operations/upstream-api-convergence.ts` | `resolveBwsUpstreamApiConvergenceConfig` | `L151-L244` | `4f066cc40d08e6ad4748866073c0a14683bd8b7066cb9f41c87f239e28ae5a63` |

**Source-pinned files and symbols:** []

**Root cause:** Convergence is modeled as a status/checkpoint observation rather than as ownership of an immutable data snapshot.

**Cross-area dependencies:** []

**Minimal fix boundary:** At the R01 boundary, bind a cycle to exact response/page hashes and an immutable record manifest (or persist the records transactionally), and require downstream consumers to reference that cycle identity. Hand generic transaction/fencing mechanics to R03.

**Required tests:** ["Production-path test where the fake external API changes after convergence; downstream must consume the first immutable cycle or explicitly start a second cycle.", "Crash/restart test proving cycle identity and exact page set survive process restart.", "Correction/deletion test proving no record can disappear between convergence proof and consumption."]

**Regression risk:** ["Storage growth", "Migration compatibility", "Worker handoff schema changes", "Duplicate retention"]

**Unchanged areas:** ["R02 opportunity mathematics", "Public BWS API projection", "betting-win implementation"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R01/BWS116-R01-report.md and cumulative Wave 01 ledger

## BWS116-R01-004: Accepted API records are not cryptographically bound to exact response bytes, route, query, contract, generation, and page

```text
ID: BWS116-R01-004
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R01"]
SOURCE_AREA_IDS: ["R01"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R01
SECONDARY_AREAS: ["R03 persistence mechanics", "R07 evidence artifact truth", "R11 aggregate validator truth"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Accepted API records are not cryptographically bound to exact response bytes, route, query, contract, generation, and page
```

**Invariant:** Every accepted page must have immutable receive provenance covering exact bytes, URL origin and path, canonical query, contract/profile, upstream commit/generation, page/cursor, and receive time.

**Trigger:** The client emits normalized records/envelope metadata without an immutable digest over the received body and complete request identity, and persistence accepts those fields as provenance.

**Current behavior:** The boundary retains selected parsed fields and timestamps but lacks a response-byte digest and complete request/page binding. Equivalent parsed objects, altered extra fields, route drift, or page substitution cannot be distinguished later.

**Expected behavior:** Every accepted page must have immutable receive provenance covering exact bytes, URL origin and path, canonical query, contract/profile, upstream commit/generation, page/cursor, and receive time.

**Impact:** Auditors and restart logic cannot prove which bytes produced an import or readiness claim. Conflicting pages can collapse into the same apparent provenance, weakening duplicate/conflict detection and BWS-600 evidence truth.

**Evidence:** ["The query client parses JSON into contract records and emits selected envelope/provenance fields, but does not return a digest of the exact response body.", "The persistence-facing convergence records do not form a complete content-addressed chain over contract negotiation plus every query page."]

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/adapters/betting-win-query-client.ts` | `describeReadOnlyQueryApiClientBoundary` | `L181-L183` | `7b50ba9a6c6e0dd5486bdca723a6f6c605bd7609151e062fe72ee36100d307ae` |

**Source-pinned files and symbols:** []

**Root cause:** Provenance is represented as descriptive metadata instead of a cryptographic receipt over the actual request/response exchange.

**Cross-area dependencies:** []

**Minimal fix boundary:** Extend the R01 API receipt and convergence cycle to include canonical request identity and exact-body hashes for contract and pages. Persist and validate the ordered receipt chain; delegate transaction atomicity to R03 and artifact publication to R07.

**Required tests:** ["Two bodies with identical required fields but different extra bytes must produce distinct receipts.", "Route/query/profile/generation/page substitutions must fail convergence even when record arrays match.", "Restart must preserve and revalidate the ordered page receipt chain."]

**Regression risk:** ["Schema migration", "Canonicalization mistakes if hashes are taken after parsing", "Sensitive header leakage; headers must be allowlisted"]

**Unchanged areas:** ["Provider credentials", "R02 quote/economic semantics", "External betting-win source"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R01/BWS116-R01-report.md and cumulative Wave 01 ledger

## BWS116-R01-005: Pagination does not bind every page to one immutable contract, profile, generation, and query identity

```text
ID: BWS116-R01-005
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R01"]
SOURCE_AREA_IDS: ["R01"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R01
SECONDARY_AREAS: ["R03 durable checkpoint mechanics", "R11 test/validator truth"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Pagination does not bind every page to one immutable contract, profile, generation, and query identity
```

**Invariant:** Page 2 and later must be rejected unless their contract version, profile, upstream commit/generation, resource, canonical query, and lineage exactly match page 1 and the negotiated contract receipt.

**Trigger:** The client validates contract/resource shape per response but the convergence loop carries forward only the cursor and does not enforce one immutable negotiation/identity tuple across all pages.

**Current behavior:** The page loop can accept structurally valid pages whose identity-bearing metadata differs or is absent, allowing one logical convergence cycle to mix generations or route interpretations.

**Expected behavior:** Page 2 and later must be rejected unless their contract version, profile, upstream commit/generation, resource, canonical query, and lineage exactly match page 1 and the negotiated contract receipt.

**Impact:** The completed resource can be neither a coherent snapshot nor replayable. Mixed-generation market/selection records can create omissions, duplicates, or ambiguous joins downstream.

**Evidence:** ["Static loop tracing shows cursor progression but no cycle-level immutable identity object compared against each page's full envelope.", "Focused tests cover nominal multi-page retrieval but do not adversarially vary contract/profile/generation/commit identity after page 1 through the production convergence entrypoint."]

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/operations/upstream-api-convergence.ts` | `resolveBwsUpstreamApiConvergenceConfig` | `L151-L244` | `4f066cc40d08e6ad4748866073c0a14683bd8b7066cb9f41c87f239e28ae5a63` |

**Source-pinned files and symbols:** []

**Root cause:** Contract negotiation and page traversal are modeled as adjacent checks rather than one state machine with an invariant identity tuple.

**Cross-area dependencies:** []

**Minimal fix boundary:** Create a cycle identity from the negotiated contract and first accepted query, require exact equality for every page, and include that tuple in the immutable page receipt chain.

**Required tests:** ["Page-2 contract/profile/generation/commit/resource drift cases must fail without advancing the durable cursor.", "Reordered and replayed pages must converge deterministically only when the ordered receipt chain is identical."]

**Regression risk:** ["Compatibility with envelopes that currently omit identity fields", "Cursor semantics across upstream upgrades"]

**Unchanged areas:** ["R02 cross-provider matching", "R05 public API", "betting-win deployment policy"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R01/BWS116-R01-report.md and cumulative Wave 01 ledger

## BWS116-R01-006: Cursor traversal lacks a complete fail-closed proof against repetition, cycles, and non-progress

```text
ID: BWS116-R01-006
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R01"]
SOURCE_AREA_IDS: ["R01"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R01
SECONDARY_AREAS: ["R06 long-running process lifecycle", "R07 campaign observation", "R11 aggregate tests"]
REPOSITORY_SEVERITY: P2
NORMALIZED_SEVERITY: P2
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Cursor traversal lacks a complete fail-closed proof against repetition, cycles, and non-progress
```

**Invariant:** Pagination must terminate or fail deterministically on cursor repetition/non-progress and remain bounded by explicit pages, records, bytes, and aggregate deadline.

**Trigger:** The pagination loop follows `next`/cursor metadata without retaining a visited-cursor set and without a single cycle-wide page/record/time budget enforced at the production entrypoint.

**Current behavior:** The available guards do not jointly prove progress and boundedness for all cursor-cycle shapes and all retries/pages. Some malformed streams can consume the per-request budget repeatedly or terminate with ambiguous partial state.

**Expected behavior:** Pagination must terminate or fail deterministically on cursor repetition/non-progress and remain bounded by explicit pages, records, bytes, and aggregate deadline.

**Impact:** A provider defect or malicious endpoint can hold the controller, amplify requests, or leave partial convergence state that requires operator intervention.

**Evidence:** ["The traversal logic is cursor-driven; no complete cycle detector and aggregate multi-dimensional budget is enforced across the entire convergence operation.", "Focused tests do not cover repeated-cursor, A→B→A, empty-nonterminal, and unbounded-unique-cursor cases through the real client/convergence chain."]

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/adapters/betting-win-query-client.ts` | `describeReadOnlyQueryApiClientBoundary` | `L181-L183` | `7b50ba9a6c6e0dd5486bdca723a6f6c605bd7609151e062fe72ee36100d307ae` |

**Source-pinned files and symbols:** []

**Root cause:** Boundedness is distributed across request-local constants rather than represented as convergence-cycle state.

**Cross-area dependencies:** []

**Minimal fix boundary:** Add visited-cursor/non-progress checks and one explicit cycle budget over pages, records, bytes, retries, and wall-clock time. On violation, fail without promoting checkpoint/readiness.

**Required tests:** ["Repeated cursor and two-node cursor cycle", "Empty page with nonterminal cursor", "Unique cursor stream beyond page/record/byte/deadline budgets", "Restart after bounded failure"]

**Regression risk:** ["Rejecting provider-specific legitimate empty pages", "Budget tuning"]

**Unchanged areas:** ["HTTP protocol implementation in betting-win", "R02 calculations", "R03 database schema except checkpoint handoff"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R01/BWS116-R01-report.md and cumulative Wave 01 ledger

## BWS116-R01-007: Per-request timeout and retry controls do not establish one aggregate convergence deadline or late-result ownership

```text
ID: BWS116-R01-007
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R01"]
SOURCE_AREA_IDS: ["R01"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R01
SECONDARY_AREAS: ["R06 process lifecycle", "R03 persistence fencing", "R07 evidence timing"]
REPOSITORY_SEVERITY: P2
NORMALIZED_SEVERITY: P2
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Per-request timeout and retry controls do not establish one aggregate convergence deadline or late-result ownership
```

**Invariant:** One bounded cycle deadline and cancellation identity must govern contract negotiation, all pages, retries, parsing, persistence handoff, and late completions.

**Trigger:** The convergence cycle applies request-local timeout/retry constants independently per contract/page attempt without a single propagated absolute deadline and cycle ownership token.

**Current behavior:** The sum of pages × attempts × timeout/backoff can exceed any operator-visible cycle budget, while a late response can complete after the logical caller has timed out unless every continuation checks ownership.

**Expected behavior:** One bounded cycle deadline and cancellation identity must govern contract negotiation, all pages, retries, parsing, persistence handoff, and late completions.

**Impact:** Controllers can appear hung, overlap cycles, duplicate reads/import intents, or emit success after cancellation. This weakens BWS-600 lifecycle truth even when individual requests are bounded.

**Evidence:** ["Transport constants define request/attempt behavior, but static tracing does not find an absolute deadline propagated through contract negotiation, pagination, convergence persistence, and caller cancellation.", "Focused tests use prompt-resolving fakes and do not force a late resolution after abort across the full production path."]

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/operations/upstream-transport-constants.ts` | `export` | `L1-L4` | `dd5591b1c0fd7d57aeeacba4c49d25d8bca77f6acfee324cc6441c87f0175c15` |

**Source-pinned files and symbols:** []

**Root cause:** Timeout and cancellation are scoped to fetch attempts rather than the owned convergence state machine.

**Cross-area dependencies:** []

**Minimal fix boundary:** Create an absolute cycle deadline and operation identity at the convergence entrypoint, pass remaining budget and cancellation through every call, and reject all late continuations before persistence/readiness effects.

**Required tests:** ["Late fetch resolution after abort", "Multi-page worst-case retry budget", "Cancellation between parse and persistence", "No duplicate cycle effects after caller timeout"]

**Regression risk:** ["Behavioral changes in retry policy", "Timer flakiness", "Interaction with R06 controller supervision"]

**Unchanged areas:** ["Endpoint allowlist semantics", "B1 schema definitions", "R02 solver"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R01/BWS116-R01-report.md and cumulative Wave 01 ledger

## BWS116-R01-008: Response-size enforcement occurs after fetch buffering and therefore is not a transport memory bound

```text
ID: BWS116-R01-008
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R01"]
SOURCE_AREA_IDS: ["R01"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R01
SECONDARY_AREAS: ["R06 generic process reliability", "R11 test truth"]
REPOSITORY_SEVERITY: P2
NORMALIZED_SEVERITY: P2
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Response-size enforcement occurs after fetch buffering and therefore is not a transport memory bound
```

**Invariant:** The client must cap compressed and decompressed bytes while streaming, abort before unbounded allocation, and reject bodies beyond the declared limit.

**Trigger:** The implementation obtains the complete response text/JSON before comparing its length or parsed cardinality with configured limits.

**Current behavior:** The limit is a post-buffer validation. It can reject an oversized body semantically, but only after memory and time have already been consumed.

**Expected behavior:** The client must cap compressed and decompressed bytes while streaming, abort before unbounded allocation, and reject bodies beyond the declared limit.

**Impact:** A malformed or compromised endpoint can cause excessive memory use and process termination despite a nominal response-size constant.

**Evidence:** ["The production request path uses full-body Fetch API buffering before response-size validation; no bounded stream reader is present in the owned adapter."]

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/adapters/betting-win-query-client.ts` | `query` | `L16-L29` | `7b50ba9a6c6e0dd5486bdca723a6f6c605bd7609151e062fe72ee36100d307ae` |

**Source-pinned files and symbols:** []

**Root cause:** The size control is implemented as schema/input validation rather than transport resource enforcement.

**Cross-area dependencies:** []

**Minimal fix boundary:** Replace full-body buffering with a bounded reader that accounts for decoded bytes, aborts immediately on overflow, and only then parses JSON. Preserve exact-body hashing from finding 004 while streaming.

**Required tests:** ["Chunked body that crosses limit", "Incorrect/missing Content-Length", "Compressed expansion beyond limit", "Abort cleanup and no partial persistence"]

**Regression risk:** ["Node Fetch stream compatibility", "Unicode byte/character accounting", "Hashing and parser integration"]

**Unchanged areas:** ["Contract schema", "Convergence identity", "Persistent database"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R01/BWS116-R01-report.md and cumulative Wave 01 ledger

## BWS116-R01-009: External-runtime URL validation is lexical and does not prove the destination is non-local across all address forms

```text
ID: BWS116-R01-009
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R01"]
SOURCE_AREA_IDS: ["R01"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R01
SECONDARY_AREAS: ["R10 environment/secret/path policy", "R06 generic transport", "R11 validators"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: External-runtime URL validation is lexical and does not prove the destination is non-local across all address forms
```

**Invariant:** Accepted BWS-600 endpoints must be proven non-loopback/non-local for canonical IPv4, IPv6, mapped forms, DNS answers, redirects, and every connection attempt; credentials/userinfo must be rejected.

**Trigger:** Preflight classifies externality from URL protocol/hostname text without canonical IP parsing plus controlled resolution and redirect-target enforcement.

**Current behavior:** The guard rejects known local forms but does not establish destination-level externality for all equivalent address representations and DNS/redirect changes.

**Expected behavior:** Accepted BWS-600 endpoints must be proven non-loopback/non-local for canonical IPv4, IPv6, mapped forms, DNS answers, redirects, and every connection attempt; credentials/userinfo must be rejected.

**Impact:** A local BWS service, dashboard, metadata endpoint, or other intranet target can potentially be reached while carrying an `external`-looking URL, defeating the external-runtime evidence boundary and creating SSRF exposure.

**Evidence:** ["Static URL-guard tracing finds string/URL-property checks but no connection-time destination verifier tied to resolved addresses and redirect hops.", "Focused tests enumerate canonical loopback literals but do not cover the full mapped/encoded/DNS/redirect matrix through the real client."]

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/operations/external-runtime-preflight.ts` | `createBwsExternalRuntimeCampaignManifest` | `L248-L433` | `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427` |

**Source-pinned files and symbols:** []

**Root cause:** Externality is treated as a configuration-string property instead of a property of each resolved connection destination.

**Cross-area dependencies:** []

**Minimal fix boundary:** At the R01 configuration/preflight boundary, reject userinfo and unsupported schemes, canonicalize literal addresses, resolve hostnames under a bounded policy, reject loopback/link-local/private/unspecified/multicast destinations as required, and revalidate every redirect/connection. Coordinate generic networking mechanics with R10/R06 without weakening API-only holds.

**Required tests:** ["IPv6 loopback", "IPv4-mapped IPv6 loopback", "integer/legacy IPv4 forms accepted by runtime", "DNS to loopback/private", "redirect to local target", "userinfo and credential-bearing URL"]

**Regression risk:** ["DNS TOCTOU and dual-stack behavior", "Legitimate private managed-runtime deployments may need an explicit separate policy", "Proxy behavior"]

**Unchanged areas:** ["Local fixture/export prohibition", "R02 economics", "betting-win source"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R01/BWS116-R01-report.md and cumulative Wave 01 ledger

## BWS116-R01-010: Source, receive, verification, import, and consumption times are not jointly enforced as distinct currentness evidence

```text
ID: BWS116-R01-010
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R01"]
SOURCE_AREA_IDS: ["R01"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R01
SECONDARY_AREAS: ["R02 quote freshness semantics", "R03 persistence types", "R07 evidence publication"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Source, receive, verification, import, and consumption times are not jointly enforced as distinct currentness evidence
```

**Invariant:** Currentness must be a fail-closed predicate over explicitly typed clocks with bounded skew, maximum source age, receive age, and consumption age; missing or future source time must remain unknown/rejected where required.

**Trigger:** Acceptance/currentness checks rely on one timestamp or derived age and do not preserve/enforce source event time, upstream snapshot time, local receive time, verification time, import time, and downstream consumption time separately.

**Current behavior:** Recent receipt can make retained/stale data appear current, while future timestamps can reduce calculated age. The resulting provenance cannot distinguish a fresh response containing old state from genuinely current upstream state.

**Expected behavior:** Currentness must be a fail-closed predicate over explicitly typed clocks with bounded skew, maximum source age, receive age, and consumption age; missing or future source time must remain unknown/rejected where required.

**Impact:** BWS-600 or BWS-710 can promote stale or temporally impossible resources, causing surebet decisions from outdated markets/quotes while status still reports current external evidence.

**Evidence:** ["Static dataflow shows multiple timestamps are either optional, defaulted, or not bound together in the acceptance receipt.", "Focused tests do not exhaust missing/blank/epoch/future/skewed source timestamps combined with fresh receive time through production preflight and convergence."]

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/operations/external-runtime-preflight.ts` | `createBwsExternalRuntimeCampaignManifest` | `L248-L433` | `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427` |

**Source-pinned files and symbols:** []

**Root cause:** Currentness is represented as a scalar age/status instead of a typed temporal evidence model.

**Cross-area dependencies:** []

**Minimal fix boundary:** Preserve all clock domains explicitly, prohibit blank/default collapse, apply bounded skew and age rules at preflight and consumption, and bind the values to immutable page receipts.

**Required tests:** ["Fresh receive + stale source", "Future source time", "Missing source time", "Boundary skew", "Restart/consumption after evidence expiry"]

**Regression risk:** ["Clock-source availability", "Compatibility with historical/replay inputs", "Time-zone/string parsing"]

**Unchanged areas:** ["Replay/export historical acceptance when explicitly typed historical", "R02 solver", "External source code"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R01/BWS116-R01-report.md and cumulative Wave 01 ledger

## BWS116-R02-001: B1 complete-set acceptance proves only key cardinality, not mutually exclusive and exhaustive outcome semantics

```text
ID: BWS116-R02-001
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R02"]
SOURCE_AREA_IDS: ["R02"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R02
SECONDARY_AREAS: ["R01 upstream canonical outcome authority", "R04 residual/settlement simulation consumers", "R11 aggregate false-green tests"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: B1 complete-set acceptance proves only key cardinality, not mutually exclusive and exhaustive outcome semantics
```

**Invariant:** A supported complete set must prove that its terminal outcomes are mutually exclusive, exhaustive, and mapped to the declared market shape, not merely count two or three distinct keys.

**Trigger:** Supply two distinct selection keys whose outcomeSide values are both "home" on both venues, then derive the B1 candidate.

**Current behavior:** The comparator checks 2/3 cardinality, unique selection keys, and pairwise equality of each key/side across venues. It never checks within-set semantic complementarity or exhaustiveness. Terminal scenarios are then generated one per key.

**Expected behavior:** A supported complete set must prove that its terminal outcomes are mutually exclusive, exhaustive, and mapped to the declared market shape, not merely count two or three distinct keys.

**Impact:** A duplicated or overlapping semantic outcome set can be treated as complete, allowing gross and net calculations over a portfolio that does not cover every terminal result.

**Evidence:** ["The inert harness passed two unique selections with sides [home, home]; outcome-set equivalence returned ok=true and gross derivation emitted one accepted candidate."]

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/identity/b1-market-equivalence.ts` | `compareB1MarketOutcomeSetEquivalence / indexBySelectionEquivalence` | `141-235` | `b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75` |
| `packages/bootstrap/src/identity/b1-market-equivalence.ts` | `indexBySelectionEquivalence` | `305-326` | `b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75` |
| `packages/bootstrap/src/identity/b1-selection-equivalence.ts` | `compareB1SelectionEquivalence` | `15-51` | `ac7dcc2ddf2d9bf660931b639e10b6659ffe90ec8115ab80b765884784bc0ae2` |
| `packages/bootstrap/src/scenarios/b1-terminal-scenario.ts` | `buildB1TerminalScenarios` | `15-52` | `4f3ee12a400f4a034a177043213f785df2c6a60f33f8cdd85a84be652401b47c` |

**Source-pinned files and symbols:** []

**Root cause:** Outcome-set validity is represented as cardinality plus key uniqueness; canonical market-shape semantics are absent from the B1 complete-set gate.

**Cross-area dependencies:** []

**Minimal fix boundary:** Add an R02-owned market-shape outcome-set validator at the equivalence/terminal-scenario boundary. It must consume authoritative canonical outcome semantics and fail closed before quote selection. Do not change upstream canonical identity production.

**Required tests:** ["Two-way home/home, away/away, yes/yes, no/no, over/over, under/under rejection tests.", "Three-way duplicate-side and missing-draw tests.", "Permutation/property tests proving exactly one terminal winner per valid market shape."]

**Regression risk:** ["Overly label-based fixes could reject legitimate provider aliases.", "Changes must preserve canonical selection-equivalence authority and not invent local identity."]

**Unchanged areas:** ["Upstream event/market identity generation", "Persistence and worker lifecycle", "Fill/rejection/settlement replay implementation"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger

## BWS116-R02-002: B1 market grouping and venue-pair identity omit provider and provider-generation authority

```text
ID: BWS116-R02-002
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R02"]
SOURCE_AREA_IDS: ["R02"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R02
SECONDARY_AREAS: ["R01 upstream contract/provenance", "R03 persisted candidate identity", "R05 API/report projections", "R11 validators"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: B1 market grouping and venue-pair identity omit provider and provider-generation authority
```

**Invariant:** Every compared quote set must preserve and verify compatible provider ID and provider-generation identity, and the selected quote evidence must retain that authority.

**Trigger:** Combine rows from generation-001 and generation-002 while holding market key, venue IDs, rules, and selection keys constant.

**Current behavior:** ProviderId and providerGenerationId are present on input rows but are not compared by the market/outcome-set equivalence functions, are not part of the venue-pair key or grouping keys, and are dropped from selected quote contributions.

**Expected behavior:** Every compared quote set must preserve and verify compatible provider ID and provider-generation identity, and the selected quote evidence must retain that authority.

**Impact:** Historical/current generations or same-named venues from different providers can be merged into one candidate, while downstream economic records cannot identify the selected generation.

**Evidence:** ["The inert harness accepted an outcome set containing generation-001 and generation-002. The selected quote objects contained no providerId, providerGenerationId, lineage ID, evidence ID, or raw-payload hash."]

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/contracts/b1-local-types.ts` | `B1MultiVenueMarketRow provider identity fields` | `30-70` | `22a43ced9a713e4144e343529a8940edfa00676659aa01f48f739e3f28ca03e1` |
| `packages/bootstrap/src/identity/b1-market-equivalence.ts` | `compareB1MarketEquivalence` | `43-139` | `b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75` |
| `packages/bootstrap/src/identity/b1-market-equivalence.ts` | `compareB1MarketOutcomeSetEquivalence` | `141-235` | `b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75` |
| `packages/bootstrap/src/identity/b1-venue-pair-key.ts` | `createB1VenuePairKey` | `14-50` | `3c1f4864a055c479d758ec070804a285aa1441ad7b14418061039d45d44517fa` |
| `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` | `groupRowsByMarketEquivalence / groupRowsByVenue` | `318-359` | `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543` |
| `packages/bootstrap/src/opportunity/b1-gross-spread.ts` | `B1GrossQuoteInput / B1GrossQuoteContribution` | `10-26` | `48ecd0e6402a23610f9582222e86e31c943948f31b6edf0896a66751edfddafb` |

**Source-pinned files and symbols:** []

**Root cause:** The B1 local row contract carries provider authority, but the R02 identity composition narrows to market key plus venue string and strips generation evidence at quote selection.

**Cross-area dependencies:** []

**Minimal fix boundary:** Extend R02 equivalence, grouping, venue identity, and selected-quote contracts to bind provider and generation. Any definition of compatible cross-generation equivalence is an explicit R01 handoff and must not default to compatibility.

**Required tests:** ["Mixed-provider and mixed-generation rejection tests.", "Same venue ID under different providers collision tests.", "Selected quote evidence retention tests.", "Permutation tests across generation partitions."]

**Regression risk:** ["Changing candidate identity may affect persisted keys and report joins owned by R03/R05.", "Do not rewrite upstream provider-generation semantics locally."]

**Unchanged areas:** ["Upstream provider-generation production", "External API currentness gate", "Execution remains prohibited"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger

## BWS116-R02-003: B1 synchronization is pair-local and can combine terminal outcomes outside the configured global quote window

```text
ID: BWS116-R02-003
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R02"]
SOURCE_AREA_IDS: ["R02"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R02
SECONDARY_AREAS: ["R01 source-time authority", "R04 backtest currentness interpretation", "R07 evidence reporting", "R11 false-green tests"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: B1 synchronization is pair-local and can combine terminal outcomes outside the configured global quote window
```

**Invariant:** The complete selected terminal-outcome portfolio must be inside one explicit synchronization window, and the reported window must represent the actual selected-quote span.

**Trigger:** Use two outcome pairs with zero intra-pair skew but a 10,000 ms skew between the selected outcomes under maxComparisonWindowMs=100.

**Current behavior:** The code validates each selection pair separately, then reports the maximum intra-pair delta. It never compares selected quote timestamps across terminal outcomes and takes comparisonTimeUtc from the first pair.

**Expected behavior:** The complete selected terminal-outcome portfolio must be inside one explicit synchronization window, and the reported window must represent the actual selected-quote span.

**Impact:** A candidate can combine asynchronous terminal prices and report maxComparisonWindowMs=0 even though the selected portfolio spans seconds, creating stale-combination false positives.

**Evidence:** ["Harness result: configured window 100 ms; pair windows [0,0]; selected-outcome snapshot span 10,000 ms; candidate accepted and reported window 0 ms."]

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/quotes/b1-quote-synchronization.ts` | `synchronizeB1VenueQuotePair` | `41-86` | `4746d1bd364a7389a95b4aa912e66f66041c44fc51083dcd02a12e9ad1fa9bde` |
| `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` | `deriveVenuePairGrossCandidate` | `166-216` | `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543` |
| `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` | `acceptedCandidate` | `238-273` | `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543` |
| `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` | `maxComparisonWindow` | `437-445` | `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543` |

**Source-pinned files and symbols:** []

**Root cause:** Synchronization scope is selection-pair local rather than candidate-global.

**Cross-area dependencies:** []

**Minimal fix boundary:** After best-quote selection, compute and enforce one candidate-global min/max snapshot span and bind comparison time/age evidence to every selected quote.

**Required tests:** ["Two- and three-way cross-outcome skew tests.", "Boundary tests at window-1, window, and window+1.", "Permutation tests proving identical global span and decision."]

**Regression risk:** ["A global gate can reduce candidate counts; metrics and fixtures must be updated truthfully.", "Do not replace source time with retrieval time."]

**Unchanged areas:** ["Per-row future and age validation", "Provider intake timing semantics", "Runtime scheduler behavior"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger

## BWS116-R02-004: B1 net economics accepts selected odds that are not value-bound to synchronized quote evidence

```text
ID: BWS116-R02-004
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R02"]
SOURCE_AREA_IDS: ["R02"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R02
SECONDARY_AREAS: ["R01 provenance binding", "R03 stored gross candidate immutability", "R11 contract mutation tests"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: B1 net economics accepts selected odds that are not value-bound to synchronized quote evidence
```

**Invariant:** Net payout values must be derived from, or exactly value-bound to, the synchronized source row selected during gross derivation.

**Trigger:** Replace selectedQuotes decimalOddsMicro values 2,200,000 with 3,000,000 while leaving synchronized source rows at 2.18/2.20.

**Current behavior:** Shape validation checks selected quote field types. findSelectedSynchronizedQuote matches only selectionEquivalenceKey and venueOrBookmakerId. Net payout then uses the detached selected quote decimalOddsMicro without comparing it to synchronized row odds or source evidence.

**Expected behavior:** Net payout values must be derived from, or exactly value-bound to, the synchronized source row selected during gross derivation.

**Impact:** A forged, stale, or accidentally recomputed selected quote can inflate payout and pass positive worst-case net while the retained synchronization evidence proves different prices.

**Evidence:** ["The harness changed only detached selectedQuotes odds to 3.0; synchronized rows stayed 2.18/2.20; evaluateB1NetEconomics returned ok=true with worstCaseNetMinor=100."]

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/opportunity/b1-gross-spread.ts` | `B1GrossQuoteContribution` | `18-26` | `48ecd0e6402a23610f9582222e86e31c943948f31b6edf0896a66751edfddafb` |
| `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` | `selected quote projection` | `210-216` | `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543` |
| `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` | `acceptedCandidate selectedQuotes/synchronizedQuotePairs` | `252-272` | `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543` |
| `packages/bootstrap/src/economics/b1-net-spread.ts` | `evaluateB1NetEconomics` | `119-167` | `0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b` |
| `packages/bootstrap/src/economics/b1-net-spread.ts` | `validateAcceptedB1GrossCandidateShape / findSelectedSynchronizedQuote` | `275-369` | `0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b` |

**Source-pinned files and symbols:** []

**Root cause:** The accepted-gross contract duplicates economic values without an immutable value/evidence binding, and the net gate verifies identity keys only.

**Cross-area dependencies:** []

**Minimal fix boundary:** Derive net odds directly from the matched synchronized row or bind selected quote values to an immutable row/evidence digest and verify all value, provider-generation, time, side, and outcome fields.

**Required tests:** ["Detached-odds mutation rejection.", "OutcomeName/outcomeSide mutation rejection.", "Provider-generation/evidence/time mutation rejection.", "Exact derivation-to-net round-trip tests."]

**Regression risk:** ["Contract changes affect test builders and downstream report serializers.", "Avoid trusting caller-provided digests without recomputation."]

**Unchanged areas:** ["Gross reciprocal formula", "Fee and capital-lock arithmetic", "Runtime execution path"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger

## BWS116-R02-005: B1 integrated solver and net path is not bound to quote capacity or venue-limit decisions

```text
ID: BWS116-R02-005
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R02"]
SOURCE_AREA_IDS: ["R02"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R02
SECONDARY_AREAS: ["R03 capacity evidence persistence", "R04 fillability simulation", "R07 acceptance metrics", "R11 integration validators"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: B1 integrated solver and net path is not bound to quote capacity or venue-limit decisions
```

**Invariant:** Every accepted stake and net candidate must be derived from explicit capacity and venue-limit decisions bound to the selected source rows.

**Trigger:** Solve/evaluate stakes of 100 minor units for a selected quote whose availableSizeMinor is 1, without invoking the separate capacity primitive.

**Current behavior:** The backtest plan accepts caller-authored solver constraints and no capacity/venue-limit evidence. The solver and net evaluator never invoke evaluateB1QuoteCapacity. The standalone capacity primitive is used only in focused unit tests.

**Expected behavior:** Every accepted stake and net candidate must be derived from explicit capacity and venue-limit decisions bound to the selected source rows.

**Impact:** A candidate can be labeled net-positive despite being unfillable at the quote depth or violating the venue cap; capacity and limit blocker counts can be false.

**Evidence:** ["Harness result: net evaluation accepted stake 100 with worstCaseNetMinor=20 against selected availableSizeMinor=1. Calling evaluateB1QuoteCapacity on the same row correctly returned B1_CAPACITY_OR_LIMIT_INSUFFICIENT."]

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/quotes/b1-capacity-model.ts` | `B1CapacityPolicy / B1CapacityDecision / evaluateB1QuoteCapacity` | `11-31` | `6a98bd374fff19cd414d04fc3410ad944b234043733d8f258a383537e0a28617` |
| `packages/bootstrap/src/quotes/b1-capacity-model.ts` | `capacity enforcement` | `70-118` | `6a98bd374fff19cd414d04fc3410ad944b234043733d8f258a383537e0a28617` |
| `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` | `B1GeneralizedStakeVectorPolicy` | `28-41` | `822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0` |
| `packages/bootstrap/src/economics/b1-net-spread.ts` | `B1NetEconomicsPolicy / evaluateB1NetEconomics` | `31-41` | `0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b` |
| `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` | `B1CrossVenueBacktestPlan` | `20-29` | `b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4` |
| `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` | `runCandidateBacktest` | `387-400` | `b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4` |

**Source-pinned files and symbols:** []

**Root cause:** Capacity and venue-limit validation are disconnected primitives rather than authoritative inputs to stake-policy construction and net acceptance.

**Cross-area dependencies:** []

**Minimal fix boundary:** Introduce one R02 integration boundary that derives each leg max/min/step from selected quote capacity plus normalized venue limits and carries the resulting decisions through solver and net acceptance. Persistence changes belong to R03.

**Required tests:** ["End-to-end quote-depth-to-solver constraint tests.", "Stake above quote, venue, market, and portfolio cap rejection tests.", "Missing capacity/proxy and missing venue-limit tests.", "Capacity changes after selection must invalidate the candidate."]

**Regression risk:** ["Existing backtest plans and fixtures contain synthetic max values and will need explicit evidence.", "Do not allow an operator cap to exceed observed depth."]

**Unchanged areas:** ["Standalone capacity arithmetic", "Venue-limit normalization", "Fill/rejection lifecycle after stake acceptance"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger

## BWS116-R02-006: B1 generalized solver can reject feasible two-way and three-way integer stake vectors

```text
ID: BWS116-R02-006
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R02"]
SOURCE_AREA_IDS: ["R02"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R02
SECONDARY_AREAS: ["R04 backtest classification", "R07 falsification metrics", "R11 property-test coverage"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: B1 generalized solver can reject feasible two-way and three-way integer stake vectors
```

**Invariant:** The solver must return any deterministic feasible integer vector satisfying min/max/step and target worst-case net, even when terminal payouts are unequal.

**Trigger:** Two-way: odds [1.5,4.0], caps [(1,2,1),(1,1,1)], target worst-case 0. Three-way: odds [2.5,2.5,6.0], caps [(1,2,1),(1,2,1),(1,1,1)], target 0.

**Current behavior:** The algorithm searches a single common target payout and rounds every leg up to reach it. If one leg cannot reach that common target it returns CAPACITY_EXHAUSTED without exploring feasible unequal-payout vectors.

**Expected behavior:** The solver must return any deterministic feasible integer vector satisfying min/max/step and target worst-case net, even when terminal payouts are unequal.

**Impact:** Valid candidates can be falsely classified infeasible, suppressing B1 observations and distorting falsification, capacity, and conversion metrics.

**Evidence:** ["Independent exhaustive enumeration found [2,1] with payouts [3,4], nets [0,1], and [2,2,1] with payouts [5,5,6], nets [0,0,1]. The production function returned B1_STAKE_VECTOR_CAPACITY_EXHAUSTED for both. The two-way oracle examined 1,317 cases before the retained sample; the three-way oracle examined 12,163 cases and found no false-feasible result in its domain."]

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` | `solveB1GeneralizedStakeVector target search` | `147-225` | `822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0` |
| `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` | `initialTargetPayout / maxTargetPayout` | `349-380` | `822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0` |
| `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` | `buildStakesForTargetPayout` | `382-445` | `822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0` |
| `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` | `calculateScenarioNets` | `447-469` | `822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0` |

**Source-pinned files and symbols:** []

**Root cause:** Common-target-payout construction is used as if it were a complete feasibility search, but it is only one sufficient family of vectors.

**Cross-area dependencies:** []

**Minimal fix boundary:** Replace or augment the R02 search with a complete bounded integer feasibility/optimization method for the declared two- and three-leg domains. Preserve deterministic objective and explicit search bounds.

**Required tests:** ["Brute-force oracle comparison over small domains for 2-way and 3-way cases.", "Unequal payout feasibility cases.", "Positive target-net, one-unit residual, tight cap, and non-unit step cases.", "Metamorphic scaling and permutation tests.", "Proof that returned vectors satisfy all constraints."]

**Regression risk:** ["A complete search may cost more; bounds and failure typing must remain explicit.", "Changing objective/tie-breaking can alter historical fixtures and reports."]

**Unchanged areas:** ["Scenario payout formula", "Capacity evidence integration finding BWS116-R02-005", "Live execution remains parked"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger

## BWS116-R02-007: Unescaped delimiter-based composite keys collide for distinct B1 identities and constraints

```text
ID: BWS116-R02-007
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R02"]
SOURCE_AREA_IDS: ["R02"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R02
SECONDARY_AREAS: ["R01 input character contract", "R03 persisted key migration", "R05 API identifiers", "R11 property tests"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Unescaped delimiter-based composite keys collide for distinct B1 identities and constraints
```

**Invariant:** Distinct typed tuples must have distinct deterministic encodings for keys, duplicate checks, candidate IDs, and scenario legs.

**Trigger:** Construct venue tuples ("a", "b::c") and ("a::b", "c"), or fee tuples split around a NUL character.

**Current behavior:** Keys are built by raw concatenation with ::, |, or NUL. Input validation requires non-empty strings but permits these delimiter characters.

**Expected behavior:** Distinct typed tuples must have distinct deterministic encodings for keys, duplicate checks, candidate IDs, and scenario legs.

**Impact:** Distinct venues/selections can alias, causing candidate identity collisions, false duplicate rejection, incorrect joins, or scenario-leg overwrites.

**Evidence:** ["Harness result: both venue tuples produced a::b::c. Two distinct fee tuples collapsed to one NUL-delimited key and were rejected as B1_FEE_MATRIX_DUPLICATE_ENTRY."]

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/identity/b1-venue-pair-key.ts` | `createB1VenuePairKey` | `35-50` | `3c1f4864a055c479d758ec070804a285aa1441ad7b14418061039d45d44517fa` |
| `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` | `buildCandidateId / buildVenuePairKeyForRows` | `376-405` | `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543` |
| `packages/bootstrap/src/economics/b1-fee-matrix.ts` | `normalizeB1FeeMatrix duplicate key` | `102-117` | `081e148be8c1e3ffce089cca44c14cb16fa94ee25ae06a320d422b23e9e37175` |
| `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` | `constraint-key construction and duplicate detection` | `292-326` | `822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0` |
| `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` | `buildConstraintKey` | `512-514` | `822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0` |
| `packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts` | `buildB1ScenarioLegKey` | `400-402` | `f48a4d0f697fcc2d9d48328ef665689807f3f97d6c74fbcba67b01520293a580` |

**Source-pinned files and symbols:** []

**Root cause:** Composite identity uses ambiguous delimiter serialization instead of a canonical injective tuple encoding.

**Cross-area dependencies:** []

**Minimal fix boundary:** Use one canonical structured/length-prefixed tuple encoder for all R02 keys or reject reserved characters at the authoritative parser. Coordinate persisted-key migrations with R03 rather than changing storage silently.

**Required tests:** ["Delimiter injection for every key constructor.", "Round-trip/injectivity property tests over Unicode and control characters.", "Cross-module consistency tests for candidate, constraint, fee, and scenario keys."]

**Regression risk:** ["Changing key encoding affects persisted records, fixtures, and APIs.", "Unicode normalization policy must be explicit rather than incidental."]

**Unchanged areas:** ["Canonical upstream IDs themselves", "Provider connectivity", "Economic formulas"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger

## BWS116-R02-008: B1 line equivalence compares raw decimal text and rejects numerically identical markets

```text
ID: BWS116-R02-008
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R02"]
SOURCE_AREA_IDS: ["R02"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R02
SECONDARY_AREAS: ["R01 upstream line contract", "R09-equivalent numeric semantics within BWS scope", "R03 key persistence"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: B1 line equivalence compares raw decimal text and rejects numerically identical markets
```

**Invariant:** Line equality must use one canonical fixed-point numeric representation with explicit scale and sign normalization.

**Trigger:** Compare otherwise identical spread/total rows using lineValue "1" and "1.0".

**Current behavior:** The parser validates syntax but preserves raw text; equivalence uses strict string equality.

**Expected behavior:** Line equality must use one canonical fixed-point numeric representation with explicit scale and sign normalization.

**Impact:** Equivalent markets are falsely blocked, reducing coverage and making results dependent on upstream formatting rather than value.

**Evidence:** ["The inert harness returned B1_LINE_VALUE_MISMATCH for \"1\" versus \"1.0\"."]

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/contracts/betting-win-b1-resource-records.ts` | `line_value parse` | `386-397` | `2068f5dea3a115cbbc4e7b7fde16774b9a0fc9c964be1550215cc2c7508604e8` |
| `packages/bootstrap/src/contracts/betting-win-b1-resource-records.ts` | `requireSignedDecimalString` | `611-620` | `2068f5dea3a115cbbc4e7b7fde16774b9a0fc9c964be1550215cc2c7508604e8` |
| `packages/bootstrap/src/identity/b1-market-equivalence.ts` | `compareB1MarketEquivalence line comparison` | `82-87` | `b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75` |
| `packages/bootstrap/src/identity/b1-market-equivalence.ts` | `compareOutcomeSetMarketContext line comparison` | `274-279` | `b7bd85ede3224740021fdc676db69c690820e2634c13c32a6719190feedb6f75` |

**Source-pinned files and symbols:** []

**Root cause:** No canonical numeric line representation is established before identity comparison.

**Cross-area dependencies:** []

**Minimal fix boundary:** Normalize line values to a bounded signed fixed-point tuple at intake or R02 comparison. R01 owns any upstream contract change; R02 owns numeric equality and key consumption.

**Required tests:** ["Equivalent textual forms tests.", "Negative-zero normalization.", "Scale/precision overflow and unsupported precision tests.", "Spread sign/viewpoint inversion tests."]

**Regression risk:** ["Incorrect sign normalization can merge opposite spread viewpoints.", "Canonical scale changes can affect persisted keys."]

**Unchanged areas:** ["Market type/period/rule checks", "Raw upstream archival bytes", "Settlement replay"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger

## BWS116-R02-009: Standard-binary complete-set assembly can mix YES and NO quotes from different source manifests

```text
ID: BWS116-R02-009
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R02"]
SOURCE_AREA_IDS: ["R02"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R02
SECONDARY_AREAS: ["R01 upstream provenance", "R03 stored standard candidate identity", "R11 fixture integrity"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Standard-binary complete-set assembly can mix YES and NO quotes from different source manifests
```

**Invariant:** All legs in one complete-set snapshot must be bound to one compatible source manifest or an explicit multi-source synchronization/provenance receipt.

**Trigger:** Assemble a complete set with manifest hash a...a for YES and b...b for NO.

**Current behavior:** The quote contract carries quoteSourceManifestHash, but assembly checks only market ID, outcome uniqueness, and currency. The accepted complete set does not expose a quote-manifest identity.

**Expected behavior:** All legs in one complete-set snapshot must be bound to one compatible source manifest or an explicit multi-source synchronization/provenance receipt.

**Impact:** Quotes from different snapshots or source lineages can be combined into a false complete set while the output advertises only the identity-record provider generation.

**Evidence:** ["Harness result: mixed 64-byte manifest hashes were accepted; output providerGeneration remained generation-s and did not disclose the mixed quote sources."]

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/contracts/betting-win-resource-records.ts` | `BettingWinQuoteRecord` | `31-40` | `8ca3a040b691242eb1025ab74f545157c1072b85332fdc1313924e57396c6903` |
| `packages/bootstrap/src/scenarios/complete-set.ts` | `quote assembly and acceptance` | `112-184` | `bdea2ee4db048e553d69f379ab4599c28bae68e372b2821bacb2a64611c98bac` |

**Source-pinned files and symbols:** []

**Root cause:** Quote provenance is available but omitted from complete-set coherence and output identity.

**Cross-area dependencies:** []

**Minimal fix boundary:** Require exact compatible quote-manifest binding during standard complete-set assembly and retain the accepted source identity in the complete-set contract.

**Required tests:** ["Mixed-manifest rejection.", "Missing/unknown manifest rejection.", "Single-manifest round trip.", "Explicit synchronization receipt path only if separately authorized."]

**Regression risk:** ["Historical fixture bundles may intentionally contain multiple manifests and will need explicit partitioning.", "Do not infer compatibility from provider generation alone."]

**Unchanged areas:** ["Rule and settlement identity checks", "B1 generation finding BWS116-R02-002", "Runtime API access"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger

## BWS116-R02-010: Standard-binary quote freshness is per leg and permits an asynchronous YES/NO snapshot

```text
ID: BWS116-R02-010
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R02"]
SOURCE_AREA_IDS: ["R02"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R02
SECONDARY_AREAS: ["R01 source-time authority", "R04 standard backtest timing", "R11 test coverage"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Standard-binary quote freshness is per leg and permits an asynchronous YES/NO snapshot
```

**Invariant:** The two terminal quotes must satisfy an explicit same-snapshot or bounded pairwise synchronization rule in addition to individual freshness.

**Trigger:** Evaluate one quote aged 59,999 ms and one current quote under a 60,000 ms age threshold.

**Current behavior:** The standard solver checks each quote independently against observedNowMs and never compares the two observedAt timestamps.

**Expected behavior:** The two terminal quotes must satisfy an explicit same-snapshot or bounded pairwise synchronization rule in addition to individual freshness.

**Impact:** Non-simultaneous YES/NO prices can be combined, creating false gross/stake feasibility and misleading paper results.

**Evidence:** ["Harness result: the pair spanning 59,999 ms was accepted; no pairwise synchronization policy exists in the standard input."]

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/opportunity/standard-binary-stake-solver.ts` | `StandardBinaryStakeVectorSolveOptions / freshness default` | `13-45` | `a68d4ea89b2ec4a7d83d8e2ced929732522e0e4af5a36efaac4712e88255dc92` |
| `packages/bootstrap/src/opportunity/standard-binary-stake-solver.ts` | `validateCompleteSetQuoteFreshness` | `110-124` | `a68d4ea89b2ec4a7d83d8e2ced929732522e0e4af5a36efaac4712e88255dc92` |
| `packages/bootstrap/src/quotes/quote-freshness.ts` | `checkQuoteFreshness` | `10-33` | `38a0042d488084145e2438fe30d9e5b0ed665733af97b561587ca78d5bb9718f` |

**Source-pinned files and symbols:** []

**Root cause:** Freshness and synchronization are conflated; only age-to-now is modeled.

**Cross-area dependencies:** []

**Minimal fix boundary:** Add an explicit standard-binary pair synchronization bound and report actual snapshot span. Preserve individual freshness as a separate check.

**Required tests:** ["Pair-skew boundary tests.", "Individually fresh but mutually stale rejection.", "Same manifest with divergent timestamps.", "Permutation invariance."]

**Regression risk:** ["Candidate counts will decline when asynchronous snapshots are rejected.", "Do not reuse the B1 pair primitive without reconciling standard source semantics."]

**Unchanged areas:** ["Canonical timestamp parsing", "Individual future/stale rejection", "B1 global synchronization finding BWS116-R02-003"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger

## BWS116-R02-011: Standard-binary quote contract omits stake increment and silently substitutes minimum stake as the rounding step

```text
ID: BWS116-R02-011
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R02"]
SOURCE_AREA_IDS: ["R02"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R02
SECONDARY_AREAS: ["R01 upstream quote contract", "R03 persisted quote schema", "R11 fixture/test updates"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Standard-binary quote contract omits stake increment and silently substitutes minimum stake as the rounding step
```

**Invariant:** Minimum stake, maximum/depth, and increment must be independent explicit values bound to quote/venue authority.

**Trigger:** Build the standard stake-vector input for quotes with minStakeMinor=10; the derived step is automatically 10 regardless of the actual venue increment.

**Current behavior:** The standard quote type has no increment. deriveRoundingConstraints sets stepMinor equal to minStakeMinor and describes the minimum as a rounding step.

**Expected behavior:** Minimum stake, maximum/depth, and increment must be independent explicit values bound to quote/venue authority.

**Impact:** The solver can reject feasible stakes, accept invalid increments, or compute the wrong vector whenever min and step differ.

**Evidence:** ["Harness result: both derived steps were 10 solely because minStakeMinor was 10; the quote object had no explicit step field."]

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/contracts/betting-win-resource-records.ts` | `BettingWinQuoteRecord` | `31-40` | `8ca3a040b691242eb1025ab74f545157c1072b85332fdc1313924e57396c6903` |
| `packages/bootstrap/src/opportunity/standard-binary-stake-solver.ts` | `deriveRoundingConstraints` | `209-238` | `a68d4ea89b2ec4a7d83d8e2ced929732522e0e4af5a36efaac4712e88255dc92` |
| `packages/bootstrap/src/solver/stake-vector.ts` | `StakeVectorRoundingConstraint` | `5-14` | `d5022b515bbac8672ed337933887276d590424c89b75c3e5acd290f3a5561029` |

**Source-pinned files and symbols:** []

**Root cause:** The standard data contract collapses two independent venue constraints into one field.

**Cross-area dependencies:** []

**Minimal fix boundary:** Extend the standard quote/depth contract with an explicit bounded increment and derive rounding constraints from it. Upstream schema ownership is an R01 handoff; solver consumption is R02.

**Required tests:** ["min != step cases.", "min not divisible by step cases.", "step greater/less than min.", "Capacity boundary after rounding.", "Missing increment fail-closed test."]

**Regression risk:** ["Schema and fixture changes cross the upstream contract boundary.", "The increment origin convention must be explicit."]

**Unchanged areas:** ["Available-size capacity calculation", "B1 explicit stakeStepMinor contract", "No-live-operation boundary"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger

## BWS116-R02-012: Standard scenario cash-flow validator accepts incomplete and non-rectangular matrices

```text
ID: BWS116-R02-012
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R02"]
SOURCE_AREA_IDS: ["R02"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R02
SECONDARY_AREAS: ["R04 simulation consumers", "R11 validator false-green coverage"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Standard scenario cash-flow validator accepts incomplete and non-rectangular matrices
```

**Invariant:** A matrix validator must prove the full scenario-by-leg rectangle, stable stake/cost terms, unique cells, and complete terminal winner coverage.

**Trigger:** Pass two rows, one for each scenario, both using the same leg ID.

**Current behavior:** The exported validator checks row shape and distinct scenario IDs only. It does not check leg cardinality, unique scenario-leg cells, or every leg in every scenario. The solver adds one later leg-count check, but the validator itself returns accepted.

**Expected behavior:** A matrix validator must prove the full scenario-by-leg rectangle, stable stake/cost terms, unique cells, and complete terminal winner coverage.

**Impact:** Other callers can trust an invalid matrix, and tests/validators can falsely certify complete terminal cash-flow coverage.

**Evidence:** ["The adversarial harness supplied two rows covering YES-wins and NO-wins but only one distinct leg; validateScenarioCashflowMatrix returned ok=true."]

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/scenarios/scenario-cashflow.ts` | `validateScenarioCashflowMatrix` | `15-62` | `11c1608a8d1cb5341f6125b9a30af4afd7c22aac64e228545636446b38476228` |
| `packages/bootstrap/src/scenarios/scenario-cashflow.ts` | `validateScenarioCoverage` | `218-240` | `11c1608a8d1cb5341f6125b9a30af4afd7c22aac64e228545636446b38476228` |
| `packages/bootstrap/src/solver/stake-vector.ts` | `solver post-validation shape checks` | `73-88` | `d5022b515bbac8672ed337933887276d590424c89b75c3e5acd290f3a5561029` |

**Source-pinned files and symbols:** []

**Root cause:** Scenario coverage is validated independently of leg coverage and matrix rectangularity.

**Cross-area dependencies:** []

**Minimal fix boundary:** Strengthen the R02 matrix validator to require unique scenario-leg cells, the complete leg set in every scenario, stable leg terms, and one coherent winner. Keep lifecycle simulation semantics in R04.

**Required tests:** ["One-leg/two-scenario rejection.", "Duplicate cell and missing cell tests.", "Extra leg/scenario rejection.", "Permutation and rectangularity property tests."]

**Regression risk:** ["Stricter validation may expose malformed retained fixtures.", "Do not duplicate B1-specific matrix logic inconsistently."]

**Unchanged areas:** ["Standard complete-set assembly", "B1 matrix validator, which already checks rectangularity more strongly", "Persistence"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger

## BWS116-R02-013: Locale-sensitive localeCompare calls make candidate, scenario, and solver ordering environment-dependent

```text
ID: BWS116-R02-013
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R02"]
SOURCE_AREA_IDS: ["R02"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R02
SECONDARY_AREAS: ["R03 persisted ordering assumptions", "R05 API ordering", "R11 deterministic validation"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Locale-sensitive localeCompare calls make candidate, scenario, and solver ordering environment-dependent
```

**Invariant:** Deterministic strategy output must use one locale-independent byte/code-point ordering contract.

**Trigger:** Sort selection keys ["a", "ä", "z"] under en_US.UTF-8 and sv_SE.UTF-8.

**Current behavior:** Multiple R02 paths use String.localeCompare without an explicit locale/options. The host locale controls order.

**Expected behavior:** Deterministic strategy output must use one locale-independent byte/code-point ordering contract.

**Impact:** Candidate order, stake order, scenario order, serialized hashes, and tie outcomes can differ across environments despite identical inputs.

**Evidence:** ["The same harness produced [a, ä, z] under en-US and [a, z, ä] under sv-SE."]

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/opportunity/standard-binary-derivation.ts` | `deriveStandardBinaryOpportunityCandidates ordering` | `27-41` | `04059b7cd11e946fd8f997d215732e514b5d03cf9faaf9ba86bb42910f25d653` |
| `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` | `sortRowsBySelection / sortedEntries` | `362-374` | `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543` |
| `packages/bootstrap/src/scenarios/b1-terminal-scenario.ts` | `compareSelectedQuotes` | `55-60` | `4f3ee12a400f4a034a177043213f785df2c6a60f33f8cdd85a84be652401b47c` |
| `packages/bootstrap/src/solver/b1-generalized-stake-vector.ts` | `compareCandidateQuotes` | `526-535` | `822a6ca6802ffb6fbfd52145679b2575536701d4c936a16ab06ab7d70123d1a0` |
| `packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts` | `compareCashflowRows / compareLegTerms` | `380-397` | `f48a4d0f697fcc2d9d48328ef665689807f3f97d6c74fbcba67b01520293a580` |

**Source-pinned files and symbols:** []

**Root cause:** Determinism depends on ambient ICU collation rather than a repository-defined comparator.

**Cross-area dependencies:** []

**Minimal fix boundary:** Replace localeCompare with one canonical locale-independent comparator and apply it consistently to keys, tuples, scenarios, and tie-breaks.

**Required tests:** ["Cross-locale golden tests.", "Unicode normalization and code-unit ordering property tests.", "Input permutation determinism tests.", "Stable serialized artifact hash tests."]

**Regression risk:** ["Ordering changes can alter retained artifacts and snapshots.", "Do not silently normalize Unicode unless the identity contract authorizes it."]

**Unchanged areas:** ["Economic values", "Canonical key contents", "Runtime execution hold"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger

## BWS116-R02-014: B1 fee matrix cannot represent scenario-conditional or non-stake fee bases accepted by its venue-type domain

```text
ID: BWS116-R02-014
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R02"]
SOURCE_AREA_IDS: ["R02"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R02
SECONDARY_AREAS: ["R01 provider fee contract/currentness", "R04 terminal simulation", "R07 net-metric evidence", "R11 independent oracle tests"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: B1 fee matrix cannot represent scenario-conditional or non-stake fee bases accepted by its venue-type domain
```

**Invariant:** Fee authority must declare basis, side/role, condition, rounding, minimum/maximum, and version so each terminal scenario is charged correctly.

**Trigger:** Model a 2% commission on positive winnings at odds 3.0 and stake 100.

**Current behavior:** The only model is feeBps on stake plus fixedFeeMinor, keyed by venue and selection. The charge is computed before scenarios and subtracted from every scenario. Venue type is not consulted and no alternative basis can be represented.

**Expected behavior:** Fee authority must declare basis, side/role, condition, rounding, minimum/maximum, and version so each terminal scenario is charged correctly.

**Impact:** Net spread can be over- or understated, particularly for exchange commission and conditional fees; an unknown fee shape can still be encoded as if it were stake-based and accepted.

**Evidence:** ["For 2% commission on positive winnings, correct fee at stake 100 and odds 3.0 is 4 only in the winning scenario. Current code can only charge ceil(100*200/10000)=2 plus fixed, unconditionally. No parameterization can express the correct function."]

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/contracts/b1-local-types.ts` | `B1VenueType / B1MultiVenueMarketRow` | `10-12` | `22a43ced9a713e4144e343529a8940edfa00676659aa01f48f739e3f28ca03e1` |
| `packages/bootstrap/src/economics/b1-fee-matrix.ts` | `B1FeeMatrixEntry / B1FeeCharge` | `7-25` | `081e148be8c1e3ffce089cca44c14cb16fa94ee25ae06a320d422b23e9e37175` |
| `packages/bootstrap/src/economics/b1-fee-matrix.ts` | `calculateB1FeeCharge` | `27-83` | `081e148be8c1e3ffce089cca44c14cb16fa94ee25ae06a320d422b23e9e37175` |
| `packages/bootstrap/src/economics/b1-net-spread.ts` | `fee application and scenario totals` | `119-188` | `0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b` |

**Source-pinned files and symbols:** []

**Root cause:** Fee semantics are collapsed to one unconditional stake-percentage formula despite a heterogeneous venue domain.

**Cross-area dependencies:** []

**Minimal fix boundary:** Define versioned fee-basis unions and scenario-dependent fee cash flows in R02. Current provider-specific fee authority remains an R01 external-input requirement; do not guess venue schedules.

**Required tests:** ["Stake, payout, profit, liability, maker/taker, fixed, minimum, maximum, and conditional fee cases.", "Scenario-only charge tests.", "Unknown fee basis must block.", "Independent cash-flow oracle tests."]

**Regression risk:** ["Incorrect generalization can double-charge or omit fees.", "Provider fee schedules are external authority and may change."]

**Unchanged areas:** ["Current simple stake-bps arithmetic for explicitly compatible venues", "Capital-lock formula", "Provider access remains prohibited"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R02/BWS116-R02-report.md and cumulative Wave 01 ledger

## BWS116-R03-001: Migration discovery can escape the repository and the SQL scope scanner admits cross-schema executable DDL

```text
ID: BWS116-R03-001
ALIASES: ["KNOWN_BASELINE_MANIFEST_DRIFT is unrelated"]
SOURCE_REPORT_IDS: ["BWS116-R03"]
SOURCE_AREA_IDS: ["R03"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R03
SECONDARY_AREAS: ["R08", "R10", "R11"]
REPOSITORY_SEVERITY: P0
NORMALIZED_SEVERITY: P0
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Migration discovery can escape the repository and the SQL scope scanner admits cross-schema executable DDL
```

**Invariant:** Migration bytes must come only from the realpath-confined repository database/migrations/surebet directory, and database-level authority must make writes outside surebet.* impossible.

**Trigger:** Load an absolute or traversal-resolved migration directory containing CREATE FUNCTION public.*, or a DO block that dynamically creates a public object, then pass the returned migrations to the normal application path.

**Current behavior:** Absolute and ../ migration directories are accepted. Cross-schema CREATE FUNCTION and dynamic DO SQL are accepted by the scanner. applySurebetMigrations would submit those bytes to psql.

**Expected behavior:** Migration bytes must come only from the realpath-confined repository database/migrations/surebet directory, and database-level authority must make writes outside surebet.* impossible.

**Impact:** A migration invocation can execute cross-schema DDL or other unreviewed SQL. This is a direct schema-ownership escape and meets the P0 taxonomy even though the 12 supplied migrations are currently confined.

**Evidence:** An inert external Node harness called only loadSurebetMigrationFiles. It accepted an absolute directory, a traversal directory, CREATE FUNCTION public.r03_escape(), and a dynamic DO block. No SQL or database command was executed.

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/persistence/src/psql.ts` | `loadSurebetMigrationFiles` | `94-153` | `86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343` |
| `packages/persistence/src/psql.ts` | `SUREBET_MIGRATION_TARGET_PATTERNS / assertSurebetOnlyMigrationSql` | `14-43; 219-265` | `86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343` |
| `packages/persistence/src/migrations.ts` | `applySurebetMigrations` | `41-90` | `2ae8d8e9d9cdb6c08003371083c2065dd803ad5d82258f5be3166a17da01f57b` |

**Source-pinned files and symbols:** []

**Root cause:** Migration authority is enforced by incomplete lexical matching and caller-selected filesystem paths rather than a fixed, realpath-confined source plus a database role restricted to surebet.*.

**Cross-area dependencies:** ["KNOWN_BASELINE_MANIFEST_DRIFT is unrelated"]

**Minimal fix boundary:** Confine the migration directory by realpath against the repository root, reject symlink and traversal escapes, remove ordinary caller override from production entrypoints, replace the incomplete regex as the security boundary, and require a database role whose privileges cannot create or mutate objects outside surebet.*.

**Required tests:** ["Absolute-path and ../ traversal rejection", "Symlink escape rejection", "CREATE FUNCTION/PROCEDURE/TRIGGER/TYPE/EXTENSION and GRANT/REVOKE rejection", "DO and dynamic SQL rejection", "Disposable PostgreSQL proof that the migration role cannot write outside surebet.*"]

**Regression risk:** ["Legitimate future migration syntax may require an explicit reviewed allowlist update", "Tightening the database role can expose undocumented cross-schema assumptions"]

**Unchanged areas:** ["The 12 migration files in the frozen archive remain byte-unchanged and presently reference surebet.* objects only", "No migration was applied"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger

## BWS116-R03-002: The migration-status read path creates schema objects before reporting status

```text
ID: BWS116-R03-002
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R03"]
SOURCE_AREA_IDS: ["R03"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R03
SECONDARY_AREAS: ["R08", "R11"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: The migration-status read path creates schema objects before reporting status
```

**Invariant:** Status must report schema and ledger absence without creating either object.

**Trigger:** Run the migration-status operation.

**Current behavior:** The status path runs bootstrap DDL first, so an empty database is changed before status is calculated.

**Expected behavior:** Status must report schema and ledger absence without creating either object.

**Impact:** A read-only diagnostic can alter a database, manufacture the ownership state it is supposed to observe, require write privileges, and mask the distinction between never-initialized and initialized-with-no-migrations.

**Evidence:** The call graph is direct: getBwsDatabaseMigrationStatus -> listAppliedSurebetMigrations -> executePsqlCommand(MIGRATION_BOOTSTRAP_SQL). The documented contract explicitly forbids implicit migration during status.

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/persistence/src/migrations.ts` | `listAppliedSurebetMigrations` | `92-110` | `2ae8d8e9d9cdb6c08003371083c2065dd803ad5d82258f5be3166a17da01f57b` |
| `packages/bootstrap/src/operations/database-lifecycle.ts` | `getBwsDatabaseMigrationStatus` | `262-308` | `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377` |
| `docs/037_database_backup_retention_and_recovery.md` | `Migration status contract` | `9-19` | `6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10` |

**Source-pinned files and symbols:** []

**Root cause:** Bootstrap creation was shared between apply and inspect paths instead of separating read-only catalog inspection from migration initialization.

**Cross-area dependencies:** []

**Minimal fix boundary:** Make status query pg_catalog/information_schema first and report absent objects. Keep MIGRATION_BOOTSTRAP_SQL exclusively in the explicit apply path.

**Required tests:** ["Status against an empty disposable database leaves schema/table counts unchanged", "Status under a read-only role reports absence rather than failing or mutating", "Repeated status is observationally idempotent"]

**Regression risk:** ["Existing automation that accidentally relies on status to initialize the ledger will fail and must call the explicit migration command"]

**Unchanged areas:** ["Explicit migration application remains allowed", "Backup and restore command semantics are not changed by this finding"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger

## BWS116-R03-003: Unknown applied migration rows are ignored and can be reported as compatible

```text
ID: BWS116-R03-003
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R03"]
SOURCE_AREA_IDS: ["R03"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R03
SECONDARY_AREAS: ["R08", "R09", "R11"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Unknown applied migration rows are ignored and can be reported as compatible
```

**Invariant:** A frozen binary must classify a divergent or newer migration lineage explicitly and fail closed unless a reviewed forward-compatibility rule proves it safe.

**Trigger:** Run migration status or apply from this archive.

**Current behavior:** The unknown row is ignored. If all known checksums match and the schema exists, status is compatible and apply proceeds with the current file set.

**Expected behavior:** A frozen binary must classify a divergent or newer migration lineage explicitly and fail closed unless a reviewed forward-compatibility rule proves it safe.

**Impact:** An older or divergent application can be allowed to operate against a schema it does not understand, producing false migration compatibility and unsafe rollback/upgrade decisions.

**Evidence:** The mismatch builder executes continue when expectedSha256 is undefined; compatibility has no unknown-applied-migration reason.

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/operations/database-lifecycle.ts` | `buildMigrationChecksumMismatches` | `1054-1075` | `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377` |
| `packages/bootstrap/src/operations/database-lifecycle.ts` | `getBwsDatabaseMigrationStatus` | `278-305` | `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377` |
| `packages/persistence/src/migrations.ts` | `applySurebetMigrations` | `45-84` | `2ae8d8e9d9cdb6c08003371083c2065dd803ad5d82258f5be3166a17da01f57b` |

**Source-pinned files and symbols:** []

**Root cause:** The migration ledger is treated as a cache of known rows rather than authoritative schema lineage requiring explicit forward/backward compatibility.

**Cross-area dependencies:** []

**Minimal fix boundary:** Add unknownApplied entries to the status contract, make compatibility fail closed by default, and permit forward compatibility only through an explicit reviewed compatibility range or schema capability proof.

**Required tests:** ["Ledger with one unknown applied migration is incompatible", "Renamed migration and same-SQL/different-name cases", "Older binary against newer schema", "Exact known set remains compatible"]

**Regression risk:** ["A strict set check can block intentional rolling upgrades unless compatibility policy is made explicit"]

**Unchanged areas:** ["Known migration checksum checking remains valid", "No claim is made that the current target database contains an unknown row"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger

## BWS116-R03-004: Concurrent migration applications are not serialized around ledger observation and insertion

```text
ID: BWS116-R03-004
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R03"]
SOURCE_AREA_IDS: ["R03"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R03
SECONDARY_AREAS: ["R08", "R06", "R11"]
REPOSITORY_SEVERITY: P2
NORMALIZED_SEVERITY: P2
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Concurrent migration applications are not serialized around ledger observation and insertion
```

**Invariant:** Exactly one migrator should own the schema transition; peers should wait and then observe the committed ledger.

**Trigger:** Both processes read the same pre-application ledger and attempt the same migration transaction.

**Current behavior:** Both callers can classify the migration as absent. One commits; the other can fail on the ledger primary key or on future non-idempotent DDL even though the database reached the desired state.

**Expected behavior:** Exactly one migrator should own the schema transition; peers should wait and then observe the committed ledger.

**Impact:** Concurrent startup can create false deployment failure, partial rollout behavior across processes, and nondeterministic operator results.

**Evidence:** No pg_advisory_xact_lock, locked ledger row, serializable retry protocol, or re-read inside a migration-owner transaction exists.

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/persistence/src/migrations.ts` | `applySurebetMigrations` | `41-84` | `2ae8d8e9d9cdb6c08003371083c2065dd803ad5d82258f5be3166a17da01f57b` |

**Source-pinned files and symbols:** []

**Root cause:** Migration application assumes a single caller but the service/lifecycle architecture does not encode that assumption in PostgreSQL.

**Cross-area dependencies:** []

**Minimal fix boundary:** Acquire a repository-specific PostgreSQL advisory lock before bootstrap/ledger inspection, re-read under the lock, apply in deterministic order, and release only after the ledger row is durable.

**Required tests:** ["Two concurrent migrators against a disposable database", "Second migrator waits and returns skipped rather than failing", "Crash while holding the lock and subsequent recovery"]

**Regression risk:** ["Lock-key collisions must be avoided", "Long migrations need an explicit bounded lock-wait policy"]

**Unchanged areas:** ["Each individual supplied migration remains wrapped in BEGIN/COMMIT", "Current migrations use CREATE TABLE/INDEX IF NOT EXISTS"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger

## BWS116-R03-005: psql subprocesses have no explicit timeout or cancellation boundary

```text
ID: BWS116-R03-005
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R03"]
SOURCE_AREA_IDS: ["R03"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R03
SECONDARY_AREAS: ["R06", "R08", "R10", "R11"]
REPOSITORY_SEVERITY: P2
NORMALIZED_SEVERITY: P2
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: psql subprocesses have no explicit timeout or cancellation boundary
```

**Invariant:** Every database subprocess must have a bounded command budget, classified timeout, deterministic cleanup, and cancellation propagation from service shutdown.

**Trigger:** Invoke any repository, migration, status, scheduler, or worker persistence operation.

**Current behavior:** The Node process blocks synchronously until psql exits. Service pass timeouts cannot interrupt this child.

**Expected behavior:** Every database subprocess must have a bounded command budget, classified timeout, deterministic cleanup, and cancellation propagation from service shutdown.

**Impact:** A single blocked database command can freeze the event loop, prevent lease handling and graceful drain, and make configured service timeout values non-binding.

**Evidence:** The execFileSync options set encoding/env/stdio only. No timeout is supplied and no child handle exists for cancellation.

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/persistence/src/psql.ts` | `runPsql` | `191-217` | `86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343` |

**Source-pinned files and symbols:** []

**Root cause:** The persistence abstraction omits command-budget and abort ownership from its public configuration.

**Cross-area dependencies:** []

**Minimal fix boundary:** Add a required bounded psql timeout and maximum output size, map timeout/termination distinctly, redact errors, and thread an abort/deadline policy through long-running service calls. Consider a pooled PostgreSQL driver for transactional and cancellation semantics.

**Required tests:** ["Sleeping fake psql is terminated at the configured budget", "Blocked database query does not prevent service shutdown indefinitely", "Timeout is distinct from SQL failure and authentication failure"]

**Regression risk:** ["Too-short defaults can abort legitimate migrations or backups", "Switching drivers changes error and transaction semantics"]

**Unchanged areas:** ["execFileSync argument arrays avoid shell interpolation", "No credentials were printed during review"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger

## BWS116-R03-006: Repository idempotency claims use read-then-insert races instead of atomic create-or-compare operations

```text
ID: BWS116-R03-006
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R03"]
SOURCE_AREA_IDS: ["R03"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R03
SECONDARY_AREAS: ["R01", "R07", "R11"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Repository idempotency claims use read-then-insert races instead of atomic create-or-compare operations
```

**Invariant:** Equal requests should converge to one retained record; conflicting payloads should return the repository-specific deterministic conflict code.

**Trigger:** Both existence checks complete before either INSERT commits.

**Current behavior:** One INSERT wins and another surfaces a raw wrapped psql uniqueness failure. The loser does not re-read and compare the committed row.

**Expected behavior:** Equal requests should converge to one retained record; conflicting payloads should return the repository-specific deterministic conflict code.

**Impact:** Scheduler, convergence, import, and worker retries can be reported as failures even when the desired record is durable. Conflicting payloads lose their typed conflict semantics, weakening recovery decisions.

**Evidence:** The pattern recurs across all creation repositories. Database uniqueness prevents many physical duplicates, but it does not provide application-level atomic idempotency or deterministic conflict classification.

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/persistence/src/repositories/upstream-lock-repository.ts` | `SurebetUpstreamLockRepository.put` | `32-88` | `c77663c55b41255a4c1f455012d5427b55f8a5cf1c733e7b800cc334f407a8bc` |
| `packages/persistence/src/repositories/import-run-repository.ts` | `SurebetImportRunRepository.create` | `60-115` | `9bb1a79b2b27ea6cd3eaaf38cb22bb20148615a2400ff929b834ad2dbd08e00b` |
| `packages/persistence/src/repositories/strategy-ledger-repository.ts` | `SurebetStrategyLedgerRepository.create` | `56-143` | `a3874447d9cf6334eafd4eaf1e7a45c3cd95b48fe865fcc68ba1f5583ca32528` |
| `packages/persistence/src/repositories/worker-job-repository.ts` | `SurebetWorkerJobRepository.create` | `220-270` | `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e` |
| `packages/persistence/src/repositories/private-paper-runtime-scheduler-checkpoint-repository.ts` | `SurebetPrivatePaperRuntimeSchedulerCheckpointRepository.create` | `74-121` | `fd997e6c563e93a0055066ae7ffc64173402495429983e0574b6e929aa743489` |
| `packages/persistence/src/repositories/b1-upstream-convergence-repository.ts` | `SurebetB1UpstreamConvergenceRepository.create` | `59-110` | `468cde29f264349925fe65e33d5b7e05fb34390877bb0f2503345154160d6884` |

**Source-pinned files and symbols:** []

**Root cause:** Idempotency is implemented as optimistic preflight reads rather than a database atomic claim keyed by identity and immutable payload digest.

**Cross-area dependencies:** []

**Minimal fix boundary:** Use one database round trip per create: INSERT ... ON CONFLICT DO NOTHING RETURNING, then fetch and compare in the same transaction; or encode identity plus immutable digest in a conflict-aware UPSERT that never overwrites.

**Required tests:** ["Concurrent equal creates converge to one success result", "Concurrent different creates return the typed conflict", "Unique secondary identities such as fingerprint/report hash are classified deterministically", "Scheduler/job restart uses the production repository, not an in-memory fake"]

**Regression risk:** ["Incorrect ON CONFLICT targets could mask secondary-identity conflicts", "Automatic overwrite must remain prohibited"]

**Unchanged areas:** ["Existing primary and unique constraints remain useful and must not be removed", "Pure strategy identity composition remains R02-owned"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger

## BWS116-R03-007: Finalization and checkpoint advances validate expected state in one session but update by ID in another

```text
ID: BWS116-R03-007
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R03"]
SOURCE_AREA_IDS: ["R03"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R03
SECONDARY_AREAS: ["R01", "R04", "R06", "R11"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Finalization and checkpoint advances validate expected state in one session but update by ID in another
```

**Invariant:** Expected state must be part of the UPDATE predicate and exactly one transition may succeed; retries must compare the retained terminal payload.

**Trigger:** Both precondition reads observe the same current state, after which the updates execute in a different order.

**Current behavior:** The UPDATE predicates contain only the primary ID. Both callers can pass preflight validation and the later writer can replace the earlier terminal outcome or advance from stale state.

**Expected behavior:** Expected state must be part of the UPDATE predicate and exactly one transition may succeed; retries must compare the retained terminal payload.

**Impact:** Import outcomes, convergence cursors, scheduled cycle identities, and B1 terminal evidence can become last-writer-wins rather than monotonic and conflict-detecting. This permits skipped/reordered work and false terminality.

**Evidence:** Every listed method opens separate psql processes for read and write and does not inspect an affected-row RETURNING result tied to expected state.

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/persistence/src/repositories/import-run-repository.ts` | `SurebetImportRunRepository.finalize` | `117-157` | `9bb1a79b2b27ea6cd3eaaf38cb22bb20148615a2400ff929b834ad2dbd08e00b` |
| `packages/persistence/src/repositories/upstream-api-convergence-repository.ts` | `SurebetUpstreamApiConvergenceRepository.advance` | `149-198` | `298c9e2b2d874f5e11e7278893f00acaaaf16b48a47fde0cab41c33e59017ba0` |
| `packages/persistence/src/repositories/upstream-export-convergence-repository.ts` | `SurebetUpstreamExportConvergenceRepository.advance` | `115-164` | `dbfac37a5aac9e6139532312a0635f25f655c8739782e186f72bc6717bd79600` |
| `packages/persistence/src/repositories/private-paper-runtime-scheduler-checkpoint-repository.ts` | `SurebetPrivatePaperRuntimeSchedulerCheckpointRepository.advance` | `201-236` | `fd997e6c563e93a0055066ae7ffc64173402495429983e0574b6e929aa743489` |
| `packages/persistence/src/repositories/b1-private-observation-repository.ts` | `complete / block` | `119-167` | `a057be720b8d7794b5d3a29cac35879ea555a65f2238e085b98fb7ea730f9941` |

**Source-pinned files and symbols:** []

**Root cause:** Optimistic concurrency is enforced only in TypeScript, outside the database transaction that owns the state.

**Cross-area dependencies:** []

**Minimal fix boundary:** Move each transition into one SQL statement or transaction with current status/cursor/version in WHERE, use RETURNING, distinguish zero-row stale from missing, and compare retained terminal payloads for idempotent replay.

**Required tests:** ["Two concurrent import finalizers with equal and conflicting outcomes", "Two API/export cursor advances from one expected cursor", "Two scheduler instances advancing one checkpoint", "Concurrent B1 complete versus block"]

**Regression risk:** ["Adding strict CAS can expose callers that currently depend on silent last-writer-wins behavior"]

**Unchanged areas:** ["Read model ordering is unchanged", "Upstream semantic validity remains R01-owned"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger

## BWS116-R03-008: Worker heartbeat, checkpoint, completion, and retry transitions omit the lease fence from their mutation predicates

```text
ID: BWS116-R03-008
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R03"]
SOURCE_AREA_IDS: ["R03"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R03
SECONDARY_AREAS: ["R06", "R07", "R11"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Worker heartbeat, checkpoint, completion, and retry transitions omit the lease fence from their mutation predicates
```

**Invariant:** Every lease-authorized mutation must atomically require status=leased, exact owner, exact token or epoch, and active lease in the same SQL statement.

**Trigger:** The worker passes requireOwnedActiveLease, then another transaction changes the row before the worker mutation executes.

**Current behavior:** Heartbeat, checkpoint job update, completion, and retry use WHERE job_id only. A stale operation can alter a later lease or race a conflicting transition; checkpoint insertion can publish after the job became terminal.

**Expected behavior:** Every lease-authorized mutation must atomically require status=leased, exact owner, exact token or epoch, and active lease in the same SQL statement.

**Impact:** A stale worker can extend a replacement lease, complete work after a retry/reclaim sequence, publish late checkpoints, or produce success/error ordering that does not correspond to a single owner. Duplicate economic/evidence effects become possible.

**Evidence:** The source itself demonstrates the missing predicates. deadLetterOwnedJob already uses an atomic fenced UPDATE, showing the intended mechanism exists but is not applied consistently.

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/persistence/src/repositories/worker-job-repository.ts` | `heartbeatLease / recordCheckpoint` | `438-546` | `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e` |
| `packages/persistence/src/repositories/worker-job-repository.ts` | `complete / fail` | `609-692` | `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e` |
| `packages/persistence/src/repositories/worker-job-repository.ts` | `requireOwnedActiveLease` | `844-879` | `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e` |
| `packages/persistence/src/repositories/worker-job-repository.ts` | `deadLetterOwnedJob` | `882-962` | `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e` |

**Source-pinned files and symbols:** []

**Root cause:** Lease ownership and state mutation are split across psql sessions instead of encoded in one conditional database transition.

**Cross-area dependencies:** []

**Minimal fix boundary:** Use conditional UPDATE/CTE statements with job_id, status, lease_owner, lease_token, lease expiry, and optionally monotonic lease_epoch; use RETURNING and zero-row stale-owner classification. Keep checkpoint insert plus job metadata update atomic and fenced.

**Required tests:** ["Old worker completion after new claim", "Heartbeat racing retry and replacement claim", "Checkpoint racing success/dead-letter", "Completion versus retry race", "Exactly-once release of lease fields"]

**Regression risk:** ["Stricter fencing can surface latent late callbacks as errors; callers must treat them as stale completion, not retryable work"]

**Unchanged areas:** ["Atomic FOR UPDATE SKIP LOCKED claim remains a safeguard", "Dead-letter owner/token CAS remains a safeguard"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger

## BWS116-R03-009: Worker availability and lease validity are controlled by caller timestamps with inconsistent expiry boundaries

```text
ID: BWS116-R03-009
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R03"]
SOURCE_AREA_IDS: ["R03"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R03
SECONDARY_AREAS: ["R06", "R10", "R11"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Worker availability and lease validity are controlled by caller timestamps with inconsistent expiry boundaries
```

**Invariant:** PostgreSQL should own lease-now and monotonic lease epochs, with one consistent half-open validity rule; business timestamps should be validated for chronology.

**Trigger:** Claim, heartbeat, completion, failure, or reap uses the supplied timestamp.

**Current behavior:** A future caller clock can claim retry work early and create long leases; a past clock can authorize late completion against real time or regress heartbeat fields. At equality, requireOwnedActiveLease accepts while reaper expires.

**Expected behavior:** PostgreSQL should own lease-now and monotonic lease epochs, with one consistent half-open validity rule; business timestamps should be validated for chronology.

**Impact:** Clock skew can create premature claims, effectively unbounded leases, stale-worker publication, and contradictory active/expired decisions.

**Evidence:** All relevant SQL literals are derived from injected strings; no CURRENT_TIMESTAMP predicate or monotonic version is used for lease authority.

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/persistence/src/repositories/worker-job-repository.ts` | `claimNext` | `355-435` | `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e` |
| `packages/persistence/src/repositories/worker-job-repository.ts` | `validateClaimRequest / validateHeartbeatRequest` | `1166-1200` | `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e` |
| `packages/persistence/src/repositories/worker-job-repository.ts` | `requireOwnedActiveLease / reapExpiredLeases` | `751-879` | `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e` |

**Source-pinned files and symbols:** []

**Root cause:** Deterministic test clocks were elevated into production concurrency authority instead of separating observable event time from database lease time.

**Cross-area dependencies:** []

**Minimal fix boundary:** Use database-generated lease timestamps and a monotonic lease epoch/fencing token; define validity as now < expires_at consistently; reject timestamp regression and preserve injected clocks only for non-authoritative evidence fields.

**Required tests:** ["Future-skew claim cannot claim not-yet-available work", "Past-skew completion after real expiry is rejected", "Exact expiry instant has one result", "Heartbeat cannot regress last_heartbeat_at or lease_expires_at"]

**Regression risk:** ["Changing time authority can affect deterministic test fixtures and requires explicit database clock control in tests"]

**Unchanged areas:** ["ISO-8601 syntax validation remains useful", "Pure quote/source currentness remains R01/R02-owned"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger

## BWS116-R03-010: Expired leases are always dead-lettered even when retry budget remains

```text
ID: BWS116-R03-010
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R03"]
SOURCE_AREA_IDS: ["R03"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R03
SECONDARY_AREAS: ["R06", "R07", "R11"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Expired leases are always dead-lettered even when retry budget remains
```

**Invariant:** The durable policy must distinguish abandoned/unknown work, apply the configured retry budget when replay is safe, and dead-letter only on exhaustion or an explicit non-replayable policy.

**Trigger:** The next worker pass invokes reapExpiredLeases.

**Current behavior:** The reaper unconditionally writes dead_lettered with SUREBET_WORKER_JOB_LEASE_EXPIRED. No remaining retry calculation is performed.

**Expected behavior:** The durable policy must distinguish abandoned/unknown work, apply the configured retry budget when replay is safe, and dead-letter only on exhaustion or an explicit non-replayable policy.

**Impact:** Transient worker failure becomes permanent work loss. Standard and B1 private-paper cycles can be stranded even though their queue record was explicitly configured with retries.

**Evidence:** The normal fail path reads retryDelaysMs[attemptCount-1], but the expired-lease path bypasses it entirely.

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/persistence/src/repositories/worker-job-repository.ts` | `reapExpiredLeases / deadLetterExpiredLease` | `751-830; 965-1037` | `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e` |
| `docs/035_continuous_service_supervisor_contract.md` | `Required worker behavior` | `65-72` | `cae4ce541c65848974de8c4568e72b6d2d3d151d9f2c3eaf52cb50e6777c8505` |
| `database/migrations/surebet/004_create_worker_jobs.sql` | `surebet.worker_jobs` | `1-111` | `9756445dbfbdac6226413098d1253527578d9420543287842c30d034df162b9c` |

**Source-pinned files and symbols:** []

**Root cause:** Lease expiration policy is hard-coded as terminal rather than derived from retry budget and idempotency/replay safety.

**Cross-area dependencies:** []

**Minimal fix boundary:** Add an explicit atomic expired-lease transition: retry_wait with next availability while budget remains and replay is authorized; dead_lettered only when exhausted or policy says outcome is unknown/non-replayable. Preserve prior lease evidence.

**Required tests:** ["Expired first attempt with remaining retries moves to retry_wait", "Expired final attempt dead-letters", "Concurrent reapers transition once", "Unknown-side-effect policy remains fail-closed", "Recovered job cannot be finalized by stale worker"]

**Regression risk:** ["Automatic replay is unsafe until the idempotency and fencing findings are fixed; implementation order must place those first"]

**Unchanged areas:** ["Dead-letter evidence table remains required", "No live execution path is authorized"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger

## BWS116-R03-011: Configured service timeouts and shutdown signals do not cancel in-flight scheduler or worker work

```text
ID: BWS116-R03-011
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R03"]
SOURCE_AREA_IDS: ["R03"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R03
SECONDARY_AREAS: ["R06", "R10", "R11"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Configured service timeouts and shutdown signals do not cancel in-flight scheduler or worker work
```

**Invariant:** The service must stop awaiting at the deadline, propagate cancellation to underlying work, stop renewing leases, fence late mutations, and report a distinct timeout/cancel state.

**Trigger:** The timeout fires or shutdownSignal is set while work is in flight.

**Current behavior:** Timeout only changes later classification. Both helpers await the original promise after the sentinel. Worker shutdown is checked only before new claims; the in-flight handler receives no cancellation and continues lease renewal.

**Expected behavior:** The service must stop awaiting at the deadline, propagate cancellation to underlying work, stop renewing leases, fence late mutations, and report a distinct timeout/cancel state.

**Impact:** Graceful shutdown can hang indefinitely, configured timeout budgets are false, late work can publish checkpoints/ledger/terminal results, and resource ownership is not released at the claimed deadline.

**Evidence:** The source has two explicit await rawPassPromise paths after timeout and an infinite renewal loop without drain/abort observation.

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/workers/bounded-job-worker.ts` | `RunBoundedWorkerPassRequest / runHandlerWithLeaseRenewal` | `59-77; 313-347` | `3f319fc5ad09636121698b36817f1762c4431dffb775535a2d62e3289b111dd7` |
| `packages/bootstrap/src/operations/private-paper-worker-service.ts` | `worker pass execution / raceWithTimeout` | `379-395; 552-574` | `1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36` |
| `packages/bootstrap/src/operations/private-paper-scheduler-service.ts` | `executePass / raceWithTimeout` | `505-514; 531-553` | `876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967` |

**Source-pinned files and symbols:** []

**Root cause:** Timeout and signal handling are observational wrappers rather than ownership/cancellation mechanisms threaded through worker handlers and repositories.

**Cross-area dependencies:** []

**Minimal fix boundary:** Introduce AbortSignal and absolute deadlines at service, pass, handler, adapter, and persistence boundaries; stop renewal on abort; return at timeout; fence late result publication by lease epoch/status; add cancelled/timed_out/unknown durable states as required.

**Required tests:** ["Never-settling worker handler exits service within timeout", "SIGTERM during handler stops lease renewal and prevents new durable writes", "Late handler resolution cannot complete the job", "Scheduler pass timeout returns without awaiting the pass", "Timer/listener cleanup occurs exactly once"]

**Regression risk:** ["Cancellation can expose non-cancellable psql calls until finding 005 is fixed", "New durable states require migration and API/read-model updates"]

**Unchanged areas:** ["Existing drain behavior before new claims remains valid", "Generic child-process supervision details remain R06-owned"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger

## BWS116-R03-012: Checkpoint, dead-letter, B1 child-row, and expired-lease reads are unbounded

```text
ID: BWS116-R03-012
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R03"]
SOURCE_AREA_IDS: ["R03"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R03
SECONDARY_AREAS: ["R05", "R06", "R07", "R11"]
REPOSITORY_SEVERITY: P2
NORMALIZED_SEVERITY: P2
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Checkpoint, dead-letter, B1 child-row, and expired-lease reads are unbounded
```

**Invariant:** Persistence APIs must require bounded page sizes and stable cursors; maintenance transitions must process bounded batches atomically.

**Trigger:** A list/read/reaper call runs with default options or on a large B1 run.

**Current behavior:** Several methods issue no LIMIT. The reaper loads all expired jobs and then creates N additional psql sessions.

**Expected behavior:** Persistence APIs must require bounded page sizes and stable cursors; maintenance transitions must process bounded batches atomically.

**Impact:** Memory, output-buffer, process-count, and database-load spikes can block workers and lifecycle diagnostics. Backpressure is undermined precisely during failure accumulation.

**Evidence:** The SQL shown contains no LIMIT for dead letters, reaping, or B1 child rows; checkpoint limit is optional and defaults to empty.

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/persistence/src/repositories/worker-job-repository.ts` | `listCheckpoints / listDeadLetters / reapExpiredLeases` | `573-607; 720-830` | `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e` |
| `packages/persistence/src/repositories/b1-backtest-run-repository.ts` | `listCandidates / listSimulationResults` | `285-341` | `fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04` |

**Source-pinned files and symbols:** []

**Root cause:** Boundedness is enforced at selected service loops but omitted from repository contracts and maintenance queries.

**Cross-area dependencies:** []

**Minimal fix boundary:** Require explicit positive limits and stable keyset cursors; add a bounded bulk expired-lease CTE with SKIP LOCKED/RETURNING; page B1 children and dead letters.

**Required tests:** ["Large-cardinality query plans use indexes and fixed limits", "Reaper handles at most batchSize and is repeatable", "Stable keyset ordering under concurrent inserts", "psql output remains below configured maximum"]

**Regression risk:** ["Pagination changes API consumers and evidence aggregation", "Bulk reaping must preserve per-job dead-letter evidence"]

**Unchanged areas:** ["Individual query ordering is deterministic where ORDER BY is present", "Worker claim maxJobs remains bounded"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger

## BWS116-R03-013: Import-run retention ignores convergence references, causing either deletion failure or dangling durable identity

```text
ID: BWS116-R03-013
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R03"]
SOURCE_AREA_IDS: ["R03"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R03
SECONDARY_AREAS: ["R08", "R01", "R11"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Import-run retention ignores convergence references, causing either deletion failure or dangling durable identity
```

**Invariant:** The plan must exclude every retained reference and revalidate atomically before deletion; equivalent references must have consistent foreign-key semantics.

**Trigger:** Generate and apply an import_runs retention plan containing that run.

**Current behavior:** The candidate query does not inspect convergence tables. API checkpoint references make DELETE fail through the FK; export checkpoint references allow DELETE and leave last_import_run_id dangling.

**Expected behavior:** The plan must exclude every retained reference and revalidate atomically before deletion; equivalent references must have consistent foreign-key semantics.

**Impact:** Retention can produce a plan that cannot be applied or can destroy provenance required to reconstruct convergence state. Partial prune/recovery evidence becomes unreliable.

**Evidence:** The two convergence schemas encode the same logical reference differently, while the retention anti-join covers neither.

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/operations/database-lifecycle.ts` | `buildRetentionPlanQuery / buildRetentionDeleteSql` | `568-598; 854-875` | `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377` |
| `database/migrations/surebet/005_create_upstream_export_convergence_checkpoints.sql` | `surebet.upstream_export_convergence_checkpoints.last_import_run_id` | `1-39` | `8d3c09c06b61e4fb1774879c51467381b70bbe6f46c86c660345c63667089e3c` |
| `database/migrations/surebet/006_create_upstream_api_convergence_checkpoints.sql` | `surebet.upstream_api_convergence_checkpoints.last_import_run_id` | `1-28` | `3d5ac1c0f2d89aac08acb057668b87b2e9116f274ff78020568dc82522f270f7` |
| `docs/037_database_backup_retention_and_recovery.md` | `Retention contract` | `44-54` | `6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10` |

**Source-pinned files and symbols:** []

**Root cause:** Retention ownership and schema reference ownership were designed independently without one authoritative dependency graph.

**Cross-area dependencies:** []

**Minimal fix boundary:** Add consistent FKs or explicit immutable-reference tables, anti-join all retained references during planning, recheck in the delete transaction, and classify protected/skipped rows instead of failing the whole plan.

**Required tests:** ["API-referenced import is excluded", "Export-referenced import is excluded", "Concurrent new reference between plan and apply is preserved", "Plan/apply deletedCount and protectedCount reconcile"]

**Regression risk:** ["Adding a foreign key requires cleanup of any existing dangling values", "Retention throughput may fall without supporting indexes"]

**Unchanged areas:** ["Pinned export protection remains valid", "Operational backup/restore command ownership remains R08"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger

## BWS116-R03-014: Standard private-paper retries do not reconstruct durable previous cycle state

```text
ID: BWS116-R03-014
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R03"]
SOURCE_AREA_IDS: ["R03"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R03
SECONDARY_AREAS: ["R01", "R04", "R06", "R11"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Standard private-paper retries do not reconstruct durable previous cycle state
```

**Invariant:** The same runtimeId/cycleId must be bound to one immutable input digest and prior state; equal replay returns the retained outcome and changed replay is rejected.

**Trigger:** The retry reconstructs the runtime request from the job payload and fetches current source pages.

**Current behavior:** No prior runtime state is persisted or supplied. validateRestartState immediately accepts absence. A changed source produces a different cycle fingerprint and a second ledger identity with the same logical runReferenceId.

**Expected behavior:** The same runtimeId/cycleId must be bound to one immutable input digest and prior state; equal replay returns the retained outcome and changed replay is rejected.

**Impact:** One logical private-paper cycle can produce divergent accepted/blocked evidence across retries, duplicate ledger effects, and a worker result that does not identify which cycle incarnation is authoritative.

**Evidence:** The runtime contains correct restart validation, but the production job adapter never supplies the required previousState and the schema does not enforce unique logical run identity.

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/workers/private-paper-runtime-jobs.ts` | `PersistedPrivatePaperRuntimeJobPayload / toRuntimeRequest / handler` | `47-56; 90-217; 586-613` | `cbf9794410c3c374c7cd22844c5fd1c5fc4e51c7322856b921753479f4b0ca5c` |
| `packages/bootstrap/src/runtime/private-paper-runtime.ts` | `PrivatePaperRuntimeRequest / validateRestartState / buildNextState` | `96-104; 981-1060` | `252e38a52693f3fa598c9ea92a83b184de0c4b29c4ab0bd5c952b750d009c6f5` |
| `packages/bootstrap/src/strategy/strategy-ledger.ts` | `createPrivatePaperStrategyLedgerEntry` | `237-267` | `d05e339a5692a9218f2146c153570ee7d9c8d79ae88282e162b7ece0c0cb5dbc` |
| `database/migrations/surebet/003_create_strategy_ledger_entries.sql` | `surebet.strategy_ledger_entries` | `1-60` | `b3a7695bfba8fedaa0bb3fccefdde9ae11d893e63a67b493647f0818ce507071` |

**Source-pinned files and symbols:** []

**Root cause:** Restart state exists only as an optional in-memory API parameter, not as durable job/cycle authority.

**Cross-area dependencies:** []

**Minimal fix boundary:** Persist a private-paper cycle aggregate keyed by runtimeId/cycleId with immutable input/cycle digest, reconstruct previousState from durable rows, enforce unique logical run reference, and atomically link ledger outcome to worker terminal publication or make replay return the retained result.

**Required tests:** ["Crash after runtime result, after ledger insert, and after final checkpoint", "Equal retry returns the same ledger/result", "Changed upstream bytes for same cycle are rejected", "Fresh process reconstructs previousState from PostgreSQL"]

**Regression risk:** ["Adding run-reference uniqueness requires resolving any pre-existing duplicates", "Source-currentness semantics remain R01-owned and must not be weakened"]

**Unchanged areas:** ["Cycle fingerprint computation remains unchanged", "No claim is made that pinned-record retries diverge"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger

## BWS116-R03-015: B1 backtest persistence commits the parent before children and suppresses repair on replay

```text
ID: BWS116-R03-015
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R03"]
SOURCE_AREA_IDS: ["R03"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R03
SECONDARY_AREAS: ["R04", "R07", "R11"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: B1 backtest persistence commits the parent before children and suppresses repair on replay
```

**Invariant:** Parent and all expected children must commit atomically, or replay must verify and deterministically repair/reject an incomplete graph before presenting the run.

**Trigger:** Retry create with the same runId/runHash.

**Current behavior:** The parent persists first. On replay, matching parent causes an immediate return and no child completeness check or repair.

**Expected behavior:** Parent and all expected children must commit atomically, or replay must verify and deterministically repair/reject an incomplete graph before presenting the run.

**Impact:** A B1 run can appear durable and terminal while candidate or simulation evidence is missing. Reports and private observations can reference an incomplete backtest graph indefinitely.

**Evidence:** The create method has one psql call for the parent and one or more per candidate/result. The early-return branch checks only runHash.

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/persistence/src/repositories/b1-backtest-run-repository.ts` | `SurebetB1BacktestRunRepository.create` | `127-186` | `fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04` |
| `packages/persistence/src/repositories/b1-backtest-run-repository.ts` | `createCandidateSnapshot / createSimulationResults / insertSimulationResult` | `354-448` | `fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04` |
| `database/migrations/surebet/009_create_b1_backtest_runs.sql` | `surebet.b1_backtest_runs` | `1-32` | `c5b9b66325ca16346c48176236b73dea7fd79f51b5b18aba8ae73d33d7ad12ea` |
| `database/migrations/surebet/010_create_b1_candidate_snapshots.sql` | `surebet.b1_candidate_snapshots` | `1-21` | `83da55cee8bc46ca6f47b8584aaa81c08794a268f5147fc9bef320201a79b78a` |
| `database/migrations/surebet/011_create_b1_simulation_results.sql` | `surebet.b1_simulation_results` | `1-20` | `3e748cb212558268e675df42f809ce9e3cd29b8527a83fd9c00c5897341d15fa` |

**Source-pinned files and symbols:** []

**Root cause:** Aggregate persistence was decomposed into independent repository writes without an aggregate transaction or durable completion invariant.

**Cross-area dependencies:** []

**Minimal fix boundary:** Persist the entire run graph in one PostgreSQL transaction, or add expected child counts/digests and a completion state with locked deterministic repair. Readers must reject non-complete aggregates.

**Required tests:** ["Fault after parent insert", "Fault after each candidate and simulation insert boundary", "Replay repairs or rejects partial graph", "Readers never expose incomplete run as complete", "Concurrent equal creates converge"]

**Regression risk:** ["One large transaction can increase lock duration; batching must still preserve an atomic completion marker"]

**Unchanged areas:** ["B1 mathematical contents remain R02/R04-owned", "Current parent and child identifiers remain deterministic"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger

## BWS116-R03-016: B1 observation terminality and worker-job terminality can diverge after a crash

```text
ID: BWS116-R03-016
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R03"]
SOURCE_AREA_IDS: ["R03"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R03
SECONDARY_AREAS: ["R04", "R06", "R07", "R11"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: B1 observation terminality and worker-job terminality can diverge after a crash
```

**Invariant:** Replay should detect the retained terminal observation and converge the worker job to the matching retained result without rerunning or contradicting terminal state.

**Trigger:** The same worker job is retried.

**Current behavior:** create returns the existing terminal observation, the backtest parent returns existing, then complete/block throws NOT_STARTED. The bounded worker converts the throw into a dead-letter result, so completed observation and dead-lettered job can coexist.

**Expected behavior:** Replay should detect the retained terminal observation and converge the worker job to the matching retained result without rerunning or contradicting terminal state.

**Impact:** Operational status, queue evidence, and B1 observation evidence disagree. A successful B1 result can be presented as a failed job, or blocked evidence can lose its original reason.

**Evidence:** The handler and queue terminal writes are separate. The observation repository is partially idempotent at create but not idempotent at terminal replay.

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `packages/bootstrap/src/workers/b1-private-observation-jobs.ts` | `createB1PrivateObservationJobHandler.run` | `59-137` | `ee293ef0e7a3edeef6ef6729c987f477f049523ccd3d0b150b874796e032a5cc` |
| `packages/persistence/src/repositories/b1-private-observation-repository.ts` | `create / complete / block` | `73-167; 268-293` | `a057be720b8d7794b5d3a29cac35879ea555a65f2238e085b98fb7ea730f9941` |
| `packages/bootstrap/src/workers/bounded-job-worker.ts` | `runBoundedWorkerPass terminal dispatch` | `180-218` | `3f319fc5ad09636121698b36817f1762c4431dffb775535a2d62e3289b111dd7` |
| `database/migrations/surebet/012_create_b1_private_observation_cycles.sql` | `surebet.b1_private_observation_cycles` | `1-37` | `5c4858bb130178460e45226677c6cc74610628badeca3632425c0a0838a474a6` |

**Source-pinned files and symbols:** []

**Root cause:** Observation terminal persistence and worker terminal persistence were implemented as independent state machines without replay convergence.

**Cross-area dependencies:** []

**Minimal fix boundary:** Make terminal observation methods idempotent-by-payload, persist an authoritative handler outcome, and atomically or recoverably project it to the worker job. Add FK/unique binding between job and observation where appropriate.

**Required tests:** ["Crash after observation complete before job complete", "Crash after observation block before job dead-letter", "Retry converges without rerunning backtest", "Conflicting retained terminal payload is rejected"]

**Regression risk:** ["Changing blocked handling may affect dead-letter reason semantics and read models"]

**Unchanged areas:** ["runtimeEvidence=false and executable=false safeguards remain", "B1 strategy calculations remain unchanged"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger

## BWS116-R03-017: Durable lifecycle tables accept impossible timestamp orderings

```text
ID: BWS116-R03-017
ALIASES: []
SOURCE_REPORT_IDS: ["BWS116-R03"]
SOURCE_AREA_IDS: ["R03"]
SOURCE_BASELINE: {"archive": "betting-win-surebet116.zip", "sha256": "6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376"}
CURRENT_SOURCE_VERIFICATION: EXACT_BWS117_MEMBER_HASH_MATCH
PRIMARY_OWNER: R03
SECONDARY_AREAS: ["R01", "R06", "R09", "R11"]
REPOSITORY_SEVERITY: P1
NORMALIZED_SEVERITY: P1
CONFIDENCE: CONFIRMED
CONSOLIDATION_STATUS: CONFIRMED_UNIQUE
TITLE: Durable lifecycle tables accept impossible timestamp orderings
```

**Invariant:** Application validation and PostgreSQL CHECK constraints must preserve causal ordering, while retaining explicit source/event timestamps separately when out-of-order arrival is legitimate.

**Trigger:** Create/finalize/heartbeat/checkpoint/complete with a terminal timestamp before the start or prior durable event.

**Current behavior:** Rows can satisfy all current constraints while completed_at precedes started_at, B1 completion precedes cycle start, or checkpoints/heartbeats regress.

**Expected behavior:** Application validation and PostgreSQL CHECK constraints must preserve causal ordering, while retaining explicit source/event timestamps separately when out-of-order arrival is legitimate.

**Impact:** Sorting, retention cutoffs, recovery decisions, duration metrics, and evidence truth can be wrong while rows appear terminal and schema-valid.

**Evidence:** All validators shown use regex/Date.parse shape checks. The migrations constrain state/null combinations but have no chronology predicates.

**Current files and symbols:**

| Path | Symbol | Lines | SHA-256 |
|---|---|---|---|
| `database/migrations/surebet/001_create_upstream_locks_and_import_runs.sql` | `surebet.import_runs` | `16-36` | `9e42a36b06adc858c25e72c4fd6ab41500cdfdcbbb3e0a7ae556efd2ec771584` |
| `packages/persistence/src/repositories/import-run-repository.ts` | `validatePendingRecord / validateFinalizeRecord` | `194-230` | `9bb1a79b2b27ea6cd3eaaf38cb22bb20148615a2400ff929b834ad2dbd08e00b` |
| `database/migrations/surebet/004_create_worker_jobs.sql` | `surebet.worker_jobs and checkpoints` | `1-153` | `9756445dbfbdac6226413098d1253527578d9420543287842c30d034df162b9c` |
| `database/migrations/surebet/012_create_b1_private_observation_cycles.sql` | `surebet.b1_private_observation_cycles` | `1-34` | `5c4858bb130178460e45226677c6cc74610628badeca3632425c0a0838a474a6` |
| `packages/persistence/src/repositories/b1-private-observation-repository.ts` | `validateCreateRecord / validateCompleteRecord / validateBlockRecord` | `220-249; 303-322` | `a057be720b8d7794b5d3a29cac35879ea555a65f2238e085b98fb7ea730f9941` |

**Source-pinned files and symbols:** []

**Root cause:** Timestamp syntax validation was not paired with semantic chronology constraints at repository or schema boundaries.

**Cross-area dependencies:** []

**Minimal fix boundary:** Add explicit chronology validation and CHECK constraints for each state machine; use database authoritative transition time where appropriate; preserve source occurrence time separately from receive/persist time.

**Required tests:** ["Import requested/start/complete permutations", "Worker claim/heartbeat/checkpoint/complete regression", "B1 cycle completion before start", "Boundary equality cases", "Migration of any existing invalid rows is fail-closed and reported"]

**Regression risk:** ["Existing test fixtures with equal or synthetic timestamps may need clarification", "Source event timestamps must not be conflated with database transition timestamps"]

**Unchanged areas:** ["Timestamp storage remains timestamptz", "Fixed-point numeric persistence is unchanged"]

**Blocks next wave:** `false`

**Blocks release or deployment:** `true`

**Documentation integration:** docs/reviews/BWS117/wave-01/reports/R03/BWS116-R03-report.md and cumulative Wave 01 ledger

## Probable and suspected records retained without promotion

- `BWS116-R02-PF-001` [PROBABLE_FINDING] B1 venue-pair candidate may select every leg from one venue. Status: `INSUFFICIENT_EVIDENCE`.
- `BWS116-R02-HYP-001` [HYPOTHESIS] Stake increment origin is unspecified. Status: `INSUFFICIENT_EVIDENCE`.
- `BWS116-R02-HYP-002` [HYPOTHESIS] No explicit total portfolio budget or residual-budget objective exists in the B1 solver policy. Status: `INSUFFICIENT_EVIDENCE`.
- `BWS116-R02-HYP-003` [HYPOTHESIS] Selection-equivalence key is trusted over outcomeName consistency. Status: `INSUFFICIENT_EVIDENCE`.
- `BWS116-R02-HYP-004` [HYPOTHESIS] Standard 60-second quote-age default lacks explicit policy binding at the pure solver API. Status: `INSUFFICIENT_EVIDENCE`.
- `BWS116-R03-HYP-001` [HYPOTHESIS] Ambient libpq environment may alter authentication or session behavior. Status: `INSUFFICIENT_EVIDENCE`.
