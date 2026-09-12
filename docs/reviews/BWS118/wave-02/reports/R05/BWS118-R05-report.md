# BWS118-R05 report: read-only API, query/read models, pagination, cockpit state, and presentation truth

Review date: `2026-09-11`
Repository: `betting-win-surebet`
Reviewed archive: `betting-win-surebet118(1).zip`
Archive SHA-256: `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
Archive regular members: `657`
Package: `betting-win-surebet@0.1.0-bws-full-platform`
Canonical runtime: `Node 20.20.2`
Actual runtime used for bounded TypeScript harnesses: `Node 22.16.0` (`SUPPLEMENTARY_NONCANONICAL`)

## Executive verdict

**Verdict: `BLOCKED_API_AND_PRESENTATION_CORRECTNESS_REMEDIATION_REQUIRED`.**

The archive is structurally safe and is an executable-source equivalent, documentation-only rebase of the accepted BWS116/BWS117 review source. The R05 surface remains read-only, loopback-confined in browser API mode, and preserves the BWS-600, BWS-710, and BWS-900 holds at key top-level boundaries. Those safeguards do not make the API or cockpit truthful enough for release or runtime-evidence use.

Thirteen new R05-owned root causes were confirmed: ten P1 and three P2. The dominant failure modes are:

- continuation tokens that do not own a stable snapshot;
- a runtime-cycle endpoint that returns heuristic recent-window samples as complete pages and can perform quadratic work;
- response envelopes with no exact normalized-query or shared-snapshot receipt;
- a browser snapshot loader that discards all continuations and combines independently timed first pages;
- wire validators weaker than the canonical producer contracts;
- missing response-age, stale-state, and request-generation ownership;
- error and empty-state projections that erase material distinctions.

No provider, account, credential, external API, persistent database, or live operation was contacted. No source, test, documentation, configuration, manifest, or archive member was modified.

## 1. Archive identity and executable compatibility

- Actual SHA-256: `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`.
- ZIP entries: 657; regular files: 657; directories: 0; symlinks: 0; special entries: 0.
- Duplicate paths: 0; unsafe paths: 0; CRC/decompression check: clean.
- Compared with `betting-win-surebet117.zip`: 39 documentation files added, one documentation file changed, no removals, and zero non-documentation differences.
- Independently compared with `betting-win-surebet116.zip`: zero non-documentation additions, removals, or byte changes.
- Therefore the executable review lineage remains the BWS116 source used by R01-R03, while BWS118 adds the Wave 01 research documentation.
- `SOURCE_MANIFEST.json` still has the accepted seven-file known drift. This is recorded only as `KNOWN_BASELINE_MANIFEST_DRIFT` for R11.

## 2. Frozen state and ownership

The review preserved these routing states: `BWS-600=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE`, `BWS-710=BLOCKED_ACCEPTED_BETTING_WIN_B1_MULTI_VENUE_API_REQUIRED`, `BWS-900=PARKED_NOT_AUTHORIZED`, and no active implementation queue.

R05 owns the local BWS GET API, response/query read models, local continuation semantics, browser data client, cockpit loading/error/empty/stale state, and presentation truth. It does not re-own upstream intake (R01), strategy mathematics (R02), PostgreSQL transactions and durable state (R03), generic service lifecycle (R06), or aggregate validator trust (R11).

All `41` confirmed Wave 01 identities were indexed. No inherited ID was duplicated. The handoff-relevant aliases are explicitly attached to the new findings and handoff records.

## 3. Public API and cockpit architecture

The production path is:

```text
GET /api/read-only/*
  -> createBwsReadOnlyQueryHttpHandler
  -> createBwsReadOnlyQueryService
  -> persistence repositories / provenance expansion
  -> BwsReadOnlyQueryResponse<T>
  -> createBwsOperatorCockpitApiClient
  -> loadBwsOperatorCockpitSnapshot (parallel first pages)
  -> buildBwsOperatorCockpitPageModel
  -> BwsOperatorCockpitShell (local search/local pager)
```

Exposed GET resources are strategy ledger entries, pinned strategy exports, private-paper runtime cycles, and B1 backtest runs, plus health and readiness. Strategy, pinned-export, and B1 resources use keyset-like `afterId` continuations. Runtime cycles use no continuation and reconstruct rows by scanning recent scheduler cycle numbers. The browser loads accepted and blocked strategy/runtime variants plus B1 as separate calls.

The server page contract contains `items`, optional `nextCursor`, `pageSize`, and `returnedCount`. It does not contain total count, normalized filter/query receipt, canonical sort, snapshot/high-watermark, as-of time, partial/truncated/completeness state, or continuation expiry/version. The browser snapshot contract contains seven independent response objects and no coherence field.

## 4. Required-question conclusions

| Question | Conclusion |
|---|---|
| Can API/UI manufacture currentness, completeness, profitability, terminality, or readiness? | **Yes.** First-page counts are presented as scope counts; stale/future pages remain current; weak wire validation admits live/public/profitable/terminal strings; mixed snapshots are treated as one view. |
| Are identifiers, fixed-point values, units, timestamps, unknowns, and source receipts preserved losslessly? | **No.** B1 children are shallowly cast, several fixed-point/timestamp/status fields are non-empty strings only, null semantics diverge, and response/query/snapshot receipts are absent. |
| Are pagination/filter/sort/cursor semantics stable, bounded, deterministic, and restart-safe? | **No.** Cursors are malleable and snapshot-free; runtime-cycle search is heuristic and non-pageable; the browser discards continuations; locale-dependent ordering remains an inherited R02 handoff. |
| Are database and service errors distinct from empty results? | **No.** The HTTP handler maps unexpected internal failures to HTTP 400 and the cockpit has several empty-state conflations. |
| Does the cockpit convert held, stale, partial, missing, or failed state into green status? | No literal green palette conversion was found. **Semantic promotion is nevertheless possible** through unvalidated policy/status fields, partial counts, stale data, and missing completeness receipts. |

## 5. Query, filter, sort, cursor, and response-envelope analysis

- Input filters and page sizes are syntactically bounded, which is a genuine safeguard.
- Strategy, pinned-export, and B1 order/continuation are based on string IDs and an `afterId`. The token does not prove server issuance or one data snapshot.
- Runtime-cycle sorting uses completion/update time, checkpoint ID, and cycle ID after reconstructing a heuristic window. It has no cursor or searched-range disclosure.
- Successful envelopes do not echo or bind normalized filters, expand mode, canonical order, or query digest. Client row-by-row checks cannot validate empty responses.
- Seven cockpit queries have independently generated timestamps and potentially different durable high-watermarks. Promise aggregation does not create a coherent snapshot.
- Page-local `returnedCount` is repeatedly displayed as an accepted/blocked/run count. The client does not request later pages.

## 6. Capability, hold, and presentation analysis

Top-level B1 reporting correctly insists on deterministic offline records with execution forbidden, public signals forbidden, runtimeEvidence=false, and BWS-900 parked. Browser configuration also forbids implicit API-to-mock fallback and non-loopback API targets.

The weakness is downstream schema enforcement. Strategy ledger fields that canonical source constrains to `private_only`, `not_reported`, `withheld`, `not_claimed`, and `surebet_strategy_report_v1` are accepted by the browser as arbitrary non-empty strings. Candidate completion/finality/money fields, runtime job status and optional timestamps, and import completion timestamps have similar holes. B1 parent holds are strict, but child candidates and simulations are not.

## 7. Confirmed findings summary

| ID | Severity | Title | Primary release effect |
|---|---:|---|---|
| `BWS118-R05-001` | P2 | The HTTP boundary collapses validation, policy, persistence, and internal failures into HTTP 400 and returns raw exception text | Release blocked; BWS-600 evidence blocked; B1 acceptance blocked |
| `BWS118-R05-002` | P1 | Pagination cursors are caller-forgeable position tokens with no immutable snapshot, version, or high-watermark binding | Release blocked; BWS-600 evidence blocked; B1 acceptance blocked |
| `BWS118-R05-003` | P1 | Private-paper runtime-cycle queries scan only a recent heuristic window and can return a false empty page with no continuation or truncation signal | Release blocked; BWS-600 evidence blocked |
| `BWS118-R05-004` | P2 | Maximum-size runtime-cycle reads expand into at least 50,000 synchronous dependency calls before optional provenance work | Release blocked; BWS-600 evidence blocked |
| `BWS118-R05-005` | P1 | The cockpit discards every server continuation and presents first-page counts, search, and local pagination as whole-scope data | Release blocked; BWS-600 evidence blocked; B1 acceptance blocked |
| `BWS118-R05-006` | P1 | Successful response envelopes omit the exact query, filter, sort, and snapshot scope, so empty wrong-scope pages pass client validation vacuously | Release blocked; BWS-600 evidence blocked; B1 acceptance blocked |
| `BWS118-R05-007` | P1 | The cockpit combines seven independently timed pages into one apparent snapshot without a shared coherence receipt | Release blocked; BWS-600 evidence blocked; B1 acceptance blocked |
| `BWS118-R05-008` | P1 | API and cockpit accept arbitrarily stale or future response timestamps and loaded state never transitions to stale | Release blocked; BWS-600 evidence blocked; B1 acceptance blocked |
| `BWS118-R05-009` | P1 | The cockpit accepts arbitrary non-empty service and upstream-client boundary identifiers instead of exact compatible versions | Release blocked; BWS-600 evidence blocked; B1 acceptance blocked |
| `BWS118-R05-010` | P1 | Selective wire validation weakens closed policy, terminal, fixed-point, status, and timestamp contracts to arbitrary non-empty strings | Release blocked; BWS-600 evidence blocked; B1 acceptance blocked |
| `BWS118-R05-011` | P1 | The B1 browser contract rejects producer-valid null simulation results while accepting malformed child identity, economics, status, and time fields | Release blocked; B1 acceptance blocked |
| `BWS118-R05-012` | P1 | Cockpit loads are not request-generation-bound or cancellable, allowing a late older scope or route response to overwrite newer state | Release blocked; BWS-600 evidence blocked; B1 acceptance blocked |
| `BWS118-R05-013` | P2 | The cockpit conflates source-empty, search-no-match, and evidence-scope states under the same empty labels | Release blocked; BWS-600 evidence blocked; B1 acceptance blocked |

## 8. Detailed confirmed findings

### BWS118-R05-001 | P2 | The HTTP boundary collapses validation, policy, persistence, and internal failures into HTTP 400 and returns raw exception text

Confidence: `0.99`
Reproduction: `REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY`
Primary owner: `R05`

**Current source evidence**

- `packages/bootstrap/src/api/bws-read-only-query-http.ts` `createBwsReadOnlyQueryHttpHandler query dispatch and catch` lines `157-217`, SHA-256 `fc644a168e07d1afa63d84fa85582cda9c37994b2b4d66ea7366c1f442c7ac17`.
- `packages/bootstrap/src/api/bws-read-only-query-http.ts` `writeBlockedResponse` lines `380-401`, SHA-256 `fc644a168e07d1afa63d84fa85582cda9c37994b2b4d66ea7366c1f442c7ac17`.

**Preconditions**

- A GET request reaches any read-only query route.
- The service returns a blocker or a repository/service dependency throws an exception.

**Trigger**

Trigger a repository exception, service availability failure, malformed persisted row, or a blocked result with more than one diagnostic.

**Expected behavior**

Request-validation failures, domain-policy holds, not-found results, dependency outages, and unexpected internal faults must retain distinct status classes and sanitized envelopes; all relevant blockers must remain available to operators without exposing internals.

**Current behavior**

Every service blocker is emitted as HTTP 400 using only blockers[0]. A single broad catch also maps unexpected exceptions to HTTP 400/BWS_QUERY_REQUEST_INVALID and returns Error.message verbatim.

**Impact**

Clients cannot distinguish an empty/invalid query from a database or service fault, retry policy becomes wrong, and internal SQL/relation/path detail can cross the HTTP boundary. Operational dashboards can classify infrastructure failure as caller error.

**Independent evidence**

- Static trace shows all four query routes select only result.blockers[0], and writeBlockedResponse always uses status 400.
- The bounded inert harness injected an exception with internal relation text; the handler returned status 400 and the exact message in JSON while retaining cache-control=no-store.

**Root cause**

The HTTP adapter has one catch-all request error path and no typed translation layer from query/domain/repository errors to a stable public error taxonomy.

**Minimal fix boundary**

Change only the R05 HTTP/error-envelope boundary: classify malformed input, policy hold, not found, conflict, unavailable dependency, timeout, and internal failure; sanitize internal exceptions; preserve a bounded blocker list or diagnostic identifier. Do not alter repository transaction semantics.

**Required tests**

- Production-handler tests for 400/404/409/422/503/504/500 distinctions using inert typed failures.
- Test that raw SQL, filesystem, connection, and stack detail never appears in the response.
- Test that multiple blockers are retained deterministically or referenced by a stable diagnostic ID.
- Client test proving non-2xx classes remain distinguishable from an empty successful page.

**Regression risks**

- Status-code changes can affect cockpit copy and operator retry behavior.
- Sanitization must retain enough stable diagnostic identity for support.
- Do not convert accepted holds into transient infrastructure failures.

**Dependencies/aliases:** `BWS116-R03-003`, `BWS116-R03-007`

**Explicitly unchanged areas**

- Repository SQL and transaction behavior
- BWS query mathematics
- GET-only route set

**Blocks:** release=`true`, BWS-600 evidence=`true`, B1 acceptance=`true`, later execution=`false`.

### BWS118-R05-002 | P1 | Pagination cursors are caller-forgeable position tokens with no immutable snapshot, version, or high-watermark binding

Confidence: `0.99`
Reproduction: `REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY`
Primary owner: `R05`

**Current source evidence**

- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `CursorPayload` lines `306-310`, SHA-256 `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`.
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `queryB1BacktestRuns / queryStrategyLedger cursor production` lines `397-473`, SHA-256 `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`.
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `hashCursorScope / decodeCursor / encodeCursor` lines `1991-2052`, SHA-256 `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`.

**Preconditions**

- A resource has more than one page or changes between page requests.
- The caller knows the resource and filters, which are already visible in the request.

**Trigger**

Reuse a cursor after rows are inserted/reordered, or synthesize base64url JSON containing an arbitrary afterId and the public filter hash.

**Expected behavior**

A continuation token must be server-authenticated or otherwise non-malleable and must bind resource, exact query/sort contract, API version, and one immutable snapshot/high-watermark so continuation is deterministic and restart-safe.

**Current behavior**

The token is plain base64url JSON with only resource, filtersSha256, and afterId. The SHA-256 is unkeyed and recomputable by any caller. There is no snapshot ID, high-watermark, sort version, expiry, or server-side continuation state.

**Impact**

A caller can skip directly to an arbitrary ID, and normal concurrent insertion can omit records across pages while both responses appear complete and valid. Restarted or delayed consumers cannot prove which dataset the cursor continues.

**Independent evidence**

- The inert harness built a valid cursor without receiving one from the service and confirmed attacker-selected-after-id reached the repository.
- A two-page harness inserted a lexically earlier row after page one; page two continued after the prior ID and omitted the inserted row. The response had no snapshot identity.

**Root cause**

The query layer treats an opaque encoding plus public scope hash as cursor integrity and treats live keyset position as snapshot continuity.

**Minimal fix boundary**

At the R05 query boundary, introduce a versioned cursor contract bound to canonical sort and immutable high-watermark/snapshot identity; authenticate or server-register it; reject expired, unknown, or mismatched continuations. Hand database snapshot/fencing implementation to R03 where required.

**Required tests**

- Forged-cursor rejection test using a recomputed filter hash.
- Concurrent insert/delete/update continuation tests with a fixed snapshot.
- Restart test proving a valid continuation resumes the same snapshot or fails explicitly as expired.
- Sort-version and API-version mismatch tests.
- Property test that concatenated pages equal one snapshot query without duplicate or omission.

**Regression risks**

- Stateful cursors add retention and cleanup needs.
- Snapshot semantics may require PostgreSQL support and a migration.
- Cursor format changes require explicit versioning rather than silent compatibility.

**Dependencies/aliases:** `BWS116-R01-005`, `BWS116-R03-007`

**Explicitly unchanged areas**

- Repository key ordering itself
- Upstream API pagination
- B1 economic calculations

**Blocks:** release=`true`, BWS-600 evidence=`true`, B1 acceptance=`true`, later execution=`true`.

### BWS118-R05-003 | P1 | Private-paper runtime-cycle queries scan only a recent heuristic window and can return a false empty page with no continuation or truncation signal

Confidence: `0.99`
Reproduction: `REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY`
Primary owner: `R05`

**Current source evidence**

- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `BwsPrivatePaperRuntimeCycleQueryRequest` lines `152-164`, SHA-256 `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`.
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `queryPrivatePaperRuntimeCycles` lines `581-678`, SHA-256 `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`.

**Preconditions**

- A scheduler has more than pageSize*4 historical cycles.
- A requested acceptance/filter match exists outside the most recent scan window.

**Trigger**

Query pageSize=1 for a filter whose newest match is cycle 6 while the scheduler upper cycle is 10.

**Expected behavior**

The API must either query the entire bounded keyspace using deterministic continuation or explicitly return partial/truncated/incomplete state and a continuation mechanism. An empty page may mean no matching row only after the searchable snapshot is exhausted.

**Current behavior**

The request has no cursor. For each scheduler, only the last pageSize*4 cycle numbers are inspected, then the global results are sliced to pageSize. The response never emits nextCursor, scanned range, truncation, or completeness.

**Impact**

Operators can receive returnedCount=0 and infer no runtime evidence even though older matching cycles exist. This can manufacture absence, hide held/failed history, and make restart investigation incomplete.

**Independent evidence**

- The bounded harness used upper cycle 10 and a matching row at cycle 6 with pageSize=1. Only cycles 10, 9, 8, and 7 were scanned; the API returned an accepted empty page with no cursor.
- Static tracing confirms lowerCycleNumber is derived solely from pageSize*4, not from a stored continuation or matching-row boundary.

**Root cause**

Runtime-cycle projection is implemented as recent-window sampling but uses the same successful page contract as an exhaustive filtered query.

**Minimal fix boundary**

Replace heuristic sampling with a deterministic repository/read-model query and continuation, or introduce an explicit bounded scan contract carrying searched range, truncation, partial/completeness status, and continuation. Do not change worker/job durable state in R05.

**Required tests**

- Older-match test proving it is returned through continuation or the response is explicitly partial.
- No-match test that distinguishes exhausted snapshot from truncated scan.
- Multiple-scheduler ordering and continuation tests.
- Restart test with the same search snapshot/high-watermark.
- UI test that partial runtime-cycle results cannot be presented as absence.

**Regression risks**

- A new read model may require indexes or schema support.
- Changing from sampling to exhaustive query can expose large historical datasets.
- Continuation order must remain deterministic across scheduler IDs and timestamps.

**Dependencies/aliases:** `BWS116-R03-012`, `BWS116-R03-013`

**Explicitly unchanged areas**

- Scheduler checkpoint write semantics
- Worker state transitions
- Strategy acceptance computation

**Blocks:** release=`true`, BWS-600 evidence=`true`, B1 acceptance=`false`, later execution=`true`.

### BWS118-R05-004 | P2 | Maximum-size runtime-cycle reads expand into at least 50,000 synchronous dependency calls before optional provenance work

Confidence: `0.98`
Reproduction: `REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY_OPERATION_COUNT`
Primary owner: `R05`

**Current source evidence**

- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `queryPrivatePaperRuntimeCycles scheduler/cycle nested scan` lines `592-660`, SHA-256 `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`.
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `buildPrivatePaperRuntimeCycleItem` lines `853-945`, SHA-256 `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`.
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `findPrivatePaperRuntimeStrategyLedger / findCompletedCycleImportRun` lines `1041-1117`, SHA-256 `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`.
- `packages/bootstrap/src/operations/runtime-applications.ts` `DEFAULT_API_QUERY_MAX_PAGE_SIZE / createBwsReadOnlyQueryService` lines `58,203-207`, SHA-256 `216b980403a59909b07a27fb475d22cf6ee35b41364fd0bb46c510d17d9e0322`.

**Preconditions**

- The API uses the production maximum page size 25.
- At least 100 scheduler checkpoints are returned and each has at least 100 recent cycle numbers.

**Trigger**

Request private-paper runtime cycles at pageSize=25.

**Expected behavior**

One page request must have a declared and enforced operation/query budget with set-based reads, bounded fanout, timeout/cancellation, and explicit partial or unavailable results when the budget cannot be met.

**Current behavior**

The service lists up to pageSize*4 schedulers and scans pageSize*4 cycles per scheduler. Each candidate cycle performs upstream-checkpoint get, upstream-lock get, worker-job get, and two strategy-ledger lists before optional checkpoint/dead-letter/import expansion.

**Impact**

A single loopback GET can monopolize the synchronous service path, amplify database work, and delay health, cockpit, and other query traffic. The nominal page limit does not bound backend work.

**Independent evidence**

- The inert maximum-shape harness scanned 10,000 cycles and counted 10,000 upstream-checkpoint gets, 10,000 lock gets, 10,000 worker-job gets, and 20,000 strategy-ledger lists: 50,000 calls before optional expansion.
- The production maxPageSize is 25, yielding 100 schedulers times 100 cycles under the current multipliers.

**Root cause**

The response-size bound is incorrectly used as a work bound while nested per-record reconstruction creates quadratic fanout and N+1 repository access.

**Minimal fix boundary**

At the R05 read-model boundary, use one bounded set-based query or precomputed read model, enforce an explicit operation/time budget, and surface partial/unavailable state. R03 owns repository/index/transaction changes; R06 owns request cancellation and service-wide concurrency.

**Required tests**

- Operation-count test at maxPageSize with a hard upper bound independent of scheduler history.
- Database-backed query-plan and latency test under realistic retained history.
- Cancellation/timeout test proving no late query work continues after client disconnect or request deadline.
- Concurrency test with health/readiness and multiple cockpit readers.

**Regression risks**

- Set-based projection may change error ordering.
- New indexes can affect migration and retention work.
- Budget enforcement must not silently truncate without an explicit partial marker.

**Dependencies/aliases:** `BWS116-R03-012`

**Explicitly unchanged areas**

- Persistent worker state machine
- Scheduler ownership
- API maximum returned row count

**Blocks:** release=`true`, BWS-600 evidence=`true`, B1 acceptance=`false`, later execution=`false`.

### BWS118-R05-005 | P1 | The cockpit discards every server continuation and presents first-page counts, search, and local pagination as whole-scope data

Confidence: `0.99`
Reproduction: `REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY`
Primary owner: `R05`

**Current source evidence**

- `apps/web/src/api/client.ts` `loadBwsOperatorCockpitSnapshot` lines `1240-1325`, SHA-256 `8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97`.
- `apps/web/src/api/models.ts` `buildBwsOperatorCockpitPageModel count cards and rows` lines `657-801`, SHA-256 `3b08b0fe2d3559cc1e51bf3f570ea43b3b3c4379234ceaec33abe7d9c1c034c3`.
- `apps/web/src/app/shell.tsx` `filterRows / paginateRows / local page model` lines `116-188`, SHA-256 `ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189`.
- `apps/web/src/app/shell.tsx` `empty table and local pager` lines `460-518`, SHA-256 `ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189`.

**Preconditions**

- Any API surface returns nextCursor or contains more rows than its first page.
- The operator uses a metric card, search box, or Next button to assess the scope.

**Trigger**

Load the cockpit with all seven core responses containing nextCursor and at least one row.

**Expected behavior**

The cockpit must either exhaust deterministic continuations within a declared cap, implement server-driven paging/search, or visibly label every metric and row set as partial/first-page with continuation controls and completeness state.

**Current behavior**

The snapshot loader issues exactly one request per surface and never uses nextCursor. Models label returnedCount as Accepted Backtests, Blocked Backtests, Cycle Rows, B1 Research Runs, and similar totals. Search and pager operate only on loaded first-page rows.

**Impact**

The UI can undercount accepted, blocked, failed, or held records; search can falsely report no matching data; and the Next button can be disabled while the server has more pages. This manufactures completeness and can hide release blockers.

**Independent evidence**

- The harness returned nextCursor on all seven surfaces. The loader made seven requests, zero cursor follow-ups, displayed Accepted Backtests=1, and exposed only the first-page model rows.
- Static tracing shows the shell pageCount derives solely from model.rows.length and the pager slices that local array.

**Root cause**

The web snapshot contract models one server page per logical dataset, while presentation code treats page-local counts and rows as scope totals.

**Minimal fix boundary**

Choose one R05 UI contract: server-driven pagination/filter/search with surfaced continuation, or bounded multi-page aggregation carrying explicit completeness/truncation. Rename all page-local metrics and empty states until completeness is proven.

**Required tests**

- Snapshot-loader test that follows continuations or deliberately returns explicit partial state.
- UI test where nextCursor exists: cards, search, empty state, and pager must not claim completeness.
- Multi-page accepted/blocked/B1/runtime/evidence cases.
- Cursor failure midway must preserve partial/error distinction rather than silently showing page one.

**Regression risks**

- Exhausting pages can increase load; pair with R05/R06 budgets.
- Server-driven pagination changes URL-state semantics.
- Metric names and operator procedures may require updates.

**Dependencies/aliases:** `BWS116-R03-012`

**Explicitly unchanged areas**

- Underlying persisted counts
- Strategy acceptance semantics
- B1 mathematics

**Blocks:** release=`true`, BWS-600 evidence=`true`, B1 acceptance=`true`, later execution=`true`.

### BWS118-R05-006 | P1 | Successful response envelopes omit the exact query, filter, sort, and snapshot scope, so empty wrong-scope pages pass client validation vacuously

Confidence: `0.99`
Reproduction: `REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY`
Primary owner: `R05`

**Current source evidence**

- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `BwsReadOnlyQueryPage / BwsReadOnlyQueryResponse` lines `97-115`, SHA-256 `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`.
- `apps/web/src/api/client.ts` `assertReadOnlyQueryResponse` lines `692-762`, SHA-256 `8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97`.
- `apps/web/src/api/client.ts` `response-versus-request item-loop assertions` lines `980-1144`, SHA-256 `8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97`.

**Preconditions**

- A loopback API returns the expected resource name and a structurally valid page.
- The response is empty or its returned items happen to satisfy the requested filter.

**Trigger**

Request one scope but return an empty successful page generated for another filter/sort/page scope.

**Expected behavior**

Every page must carry or cryptographically bind the exact normalized query/filter/sort/expand contract, page size, cursor lineage, snapshot/high-watermark, and response completeness. The client must compare this receipt before interpreting items.

**Current behavior**

The envelope contains only boundary strings, generatedAt, resource, items, pageSize, returnedCount, and optional cursor. The client verifies scope by iterating returned items; an empty array makes every scope check pass.

**Impact**

A proxy, stale cache, incompatible server, or server defect can return data for the wrong request while the cockpit accepts it. Empty responses can manufacture absence for any requested scope.

**Independent evidence**

- The adversarial harness supplied a valid empty response for a different requested scope; the production client accepted it because no item existed to contradict the request.
- The response type has no request/filter/sort digest or echoed normalized request.

**Root cause**

Scope integrity is inferred from row contents instead of being an explicit page-level contract.

**Minimal fix boundary**

Extend the R05 response envelope with a versioned normalized-request receipt/digest, canonical order, snapshot identity, and completeness status; validate it before item parsing. Use R01 page/record receipt concepts as dependencies without duplicating upstream intake defects.

**Required tests**

- Wrong-scope empty-page rejection test.
- Wrong expand/pageSize/sort/cursor-lineage rejection tests.
- Property test that every emitted response receipt equals the service-normalized request.
- Compatibility/version test for changed query semantics.

**Regression risks**

- Envelope changes require web/client compatibility versioning.
- Do not trust a caller-supplied echoed request without server binding.
- Canonical filter serialization must not inherit locale-dependent ordering.

**Dependencies/aliases:** `BWS116-R01-004`, `BWS116-R01-005`, `BWS116-R02-013`

**Explicitly unchanged areas**

- Upstream intake provenance root causes
- Database transaction isolation
- Domain filter semantics

**Blocks:** release=`true`, BWS-600 evidence=`true`, B1 acceptance=`true`, later execution=`true`.

### BWS118-R05-007 | P1 | The cockpit combines seven independently timed pages into one apparent snapshot without a shared coherence receipt

Confidence: `0.99`
Reproduction: `REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY`
Primary owner: `R05`

**Current source evidence**

- `apps/web/src/api/contracts.ts` `BwsOperatorCockpitSnapshot` lines `117-127`, SHA-256 `11c9bcc7cacad4505c7d24f5e66c819723bc9165b1b65c96271b449df2bc3417`.
- `apps/web/src/api/client.ts` `loadBwsOperatorCockpitSnapshot Promise.all aggregation` lines `1267-1324`, SHA-256 `8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97`.
- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `BwsReadOnlyQueryResponse` lines `110-115`, SHA-256 `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`.

**Preconditions**

- The underlying ledger/runtime/B1 resources can change while the cockpit performs its parallel requests.
- Each individual response is structurally valid.

**Trigger**

Return the seven pages with mutually different generatedAt values, generations, or database high-watermarks.

**Expected behavior**

A cockpit snapshot must carry one server-issued snapshot/coherence identity or prove all component responses share compatible as-of/high-watermark/authority receipts. Mixed snapshots must be rejected or visibly presented as independent partial observations.

**Current behavior**

The client runs separate requests in Promise.all and places them into one object. There is no shared snapshot ID, database high-watermark, source cycle, asOf, or cross-response coherence validation.

**Impact**

Accepted and blocked totals, exposure, runtime cycles, and evidence can describe different moments. A candidate may appear accepted while its blocker or runtime state comes from another snapshot, manufacturing profitability, terminality, or readiness relationships.

**Independent evidence**

- The harness supplied seven responses with generatedAt values from 2000 through 2099. The production loader accepted them as one snapshot and no shared receipt existed.
- The TypeScript snapshot interface contains only independent response objects.

**Root cause**

UI aggregation is equated with data snapshot coherence; the server exposes only independent page responses.

**Minimal fix boundary**

Add an R05 snapshot/batch read contract or common snapshot token/high-watermark accepted by all queries, and require the cockpit to validate it. If independent observations remain intentional, label and render them independently rather than deriving cross-surface totals.

**Required tests**

- Concurrent mutation test during seven-surface load.
- Mixed snapshot/high-watermark rejection test.
- Batch endpoint or shared-token test proving all surfaces resolve one snapshot.
- Partial surface failure test that does not retain a synthetic combined snapshot.

**Regression risks**

- A database snapshot spanning requests may require a server-side snapshot lifecycle.
- Batch responses can become large; preserve page and work bounds.
- Cross-surface derivations must define which resources are semantically comparable.

**Dependencies/aliases:** `BWS116-R01-003`, `BWS116-R01-004`, `BWS116-R01-005`

**Explicitly unchanged areas**

- Individual repository row correctness
- Upstream convergence ownership
- Paper settlement semantics

**Blocks:** release=`true`, BWS-600 evidence=`true`, B1 acceptance=`true`, later execution=`true`.

### BWS118-R05-008 | P1 | API and cockpit accept arbitrarily stale or future response timestamps and loaded state never transitions to stale

Confidence: `0.99`
Reproduction: `REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY_AND_STATIC`
Primary owner: `R05`

**Current source evidence**

- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `validateGeneratedAt` lines `1419-1428`, SHA-256 `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`.
- `apps/web/src/api/client.ts` `assertReadOnlyQueryResponse generatedAt parsing` lines `692-717`, SHA-256 `8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97`.
- `apps/web/src/app/shell.tsx` `load lifecycle effect` lines `144-180`, SHA-256 `ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189`.

**Preconditions**

- A response carries any syntactically valid ISO-8601 UTC timestamp.
- The page remains open after loading.

**Trigger**

Return a response dated 2000 or 2099, or leave a valid response displayed indefinitely.

**Expected behavior**

The API/client contract must define response age, future-skew, source/as-of time, and stale transition. The cockpit must label stale data and refresh or require operator reload; future or incompatible time must fail closed.

**Current behavior**

Both service and client validate only ISO syntax/Date.parse. The shell loads on route/config/scope changes only; it has no clock, refresh interval, visibility refresh, expiry, stale state, or future-skew check.

**Impact**

Historical or clock-skewed data can remain visually current, and old held/failed/accepted state can be used for operational decisions without any stale indication.

**Independent evidence**

- The production client accepted generatedAt=2000-01-01T00:00:00.000Z and a mixed snapshot containing a 2099 timestamp.
- Static tracing found no time-based state transition after load.

**Root cause**

Timestamp validity is treated as currentness, and the browser state machine has no stale concept.

**Minimal fix boundary**

Define R05 response currentness fields and policy using a caller-provided/testable clock; reject excessive future skew, mark age explicitly, and add a browser stale/refresh state. R01 remains owner of upstream source/receive-time truth.

**Required tests**

- Ancient and future generatedAt rejection/stale tests with injected clock.
- Open-page expiry test transitioning current to stale without route change.
- Visibility/reconnect refresh test.
- Distinguish API response time from upstream source/receive/as-of time.

**Regression risks**

- Clock policy must tolerate bounded skew.
- Automatic refresh must be bounded and cancellable.
- Do not imply current provider acceptance from a fresh local response over historical data.

**Dependencies/aliases:** `BWS116-R01-010`

**Explicitly unchanged areas**

- Upstream source timestamp creation
- Persistence timestamp ordering
- Provider currentness acceptance

**Blocks:** release=`true`, BWS-600 evidence=`true`, B1 acceptance=`true`, later execution=`true`.

### BWS118-R05-009 | P1 | The cockpit accepts arbitrary non-empty service and upstream-client boundary identifiers instead of exact compatible versions

Confidence: `0.99`
Reproduction: `REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY`
Primary owner: `R05`

**Current source evidence**

- `packages/bootstrap/src/api/bws-read-only-query-service.ts` `describeBwsReadOnlyQueryServiceBoundary / boundary construction` lines `345-366`, SHA-256 `896bb5ff7db46af530b8e80f93b01b293295f98aa983c948eb57ee3f2a13c424`.
- `apps/web/src/api/client.ts` `assertReadOnlyQueryResponse boundary validation` lines `707-717`, SHA-256 `8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97`.

**Preconditions**

- A loopback endpoint emits the expected resource shape and automaticFallback=forbidden.
- Its service/client contract versions differ from those the cockpit was built against.

**Trigger**

Return arbitrary-old-or-incompatible-service and arbitrary-client as the two boundary strings.

**Expected behavior**

The web client must require an explicit supported boundary/version pair and reject unknown, future, historical, or mixed contracts before reading items.

**Current behavior**

Only automaticFallback is checked exactly. Both boundary identifiers are accepted as any non-empty string.

**Impact**

The cockpit can silently consume a contract with changed field, cursor, filter, unit, or hold semantics and then present a structurally plausible but semantically incompatible result.

**Independent evidence**

- The adversarial harness returned an arbitrary incompatible service boundary; the production parser accepted the response.
- The server does emit deterministic boundary identifiers, so exact compatibility enforcement is available but unused.

**Root cause**

Boundary strings are treated as diagnostics rather than negotiated compatibility constraints.

**Minimal fix boundary**

Define the exact supported R05 boundary versions in one shared contract, validate both identifiers before page parsing, and require an explicit version bump/migration for incompatible response changes.

**Required tests**

- Known-current pair acceptance test.
- Unknown older/newer/mixed boundary rejection tests.
- Package/build test proving server and web consume one generated/shared boundary authority rather than duplicated literals.

**Regression risks**

- Tight validation can break older deployed cockpits; use explicit compatibility policy.
- Do not silently accept a list of versions without semantic tests.
- Shared generation belongs to R11 if generated output is introduced.

**Dependencies/aliases:** None.

**Explicitly unchanged areas**

- API route set
- Browser loopback confinement
- Underlying record validation

**Blocks:** release=`true`, BWS-600 evidence=`true`, B1 acceptance=`true`, later execution=`true`.

### BWS118-R05-010 | P1 | Selective wire validation weakens closed policy, terminal, fixed-point, status, and timestamp contracts to arbitrary non-empty strings

Confidence: `0.99`
Reproduction: `REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY`
Primary owner: `R05`

**Current source evidence**

- `apps/web/src/api/client.ts` `assertImportRunRecord / assertCandidateReport` lines `238-316`, SHA-256 `8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97`.
- `apps/web/src/api/client.ts` `assertStrategyLedgerEntry` lines `319-378`, SHA-256 `8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97`.
- `apps/web/src/api/client.ts` `assertPrivatePaperRuntimeCycleItem job validation` lines `426-447`, SHA-256 `8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97`.
- `packages/bootstrap/src/strategy/strategy-ledger.ts` `strategy report kind and closed-policy validation` lines `401-450`, SHA-256 `d05e339a5692a9218f2146c153570ee7d9c8d79ae88282e162b7ece0c0cb5dbc`.
- `apps/web/src/api/models.ts` `toExposureRows` lines `439-465`, SHA-256 `3b08b0fe2d3559cc1e51bf3f570ea43b3b3c4379234ceaec33abe7d9c1c034c3`.

**Preconditions**

- A compromised, stale, incompatible, or defective loopback API returns structurally shaped records.
- Critical values are non-empty strings but violate canonical literals or integer/timestamp formats.

**Trigger**

Return liveState=live, privacy=public, profitabilityState=guaranteed_profitable, publicDistributionState=published, reportKind=forged_report, completionGroupState=ready_to_execute, finalOutcome=guaranteed_win, settledNetMinor=not-an-integer, job.status=fully_live, or completedAt=not-a-time.

**Expected behavior**

The client must validate every canonical literal, closed-state invariant, fixed-point integer string, timestamp, and status against the same contract used by the producer before a typed cast or rendering.

**Current behavior**

Several critical fields are checked only with requireNonEmptyString or requireOptionalNonEmptyString, then the object is cast to the strong TypeScript type. Models render the accepted values directly.

**Impact**

A defective response can manufacture live/public/profitable/executable-looking state, false terminality, malformed money, or impossible runtime status in the operator cockpit while all client validation passes.

**Independent evidence**

- The wire harness passed the live/public/profitable/published/forged values and malformed candidate money/terminal fields through the production parser; the exposure model rendered them.
- The same harness passed malformed optional timestamps and an arbitrary runtime job status.
- The canonical strategy-ledger validator explicitly requires private_only, not_reported, withheld, not_claimed, and surebet_strategy_report_v1, proving the web parser is weaker than source authority.

**Root cause**

The web parser validates selected structural relationships but relies on unsafe type assertions for the remaining semantic contract.

**Minimal fix boundary**

Replace ad hoc selective checks with exhaustive shared/generated validators at the R05 wire boundary, including canonical policy literals, union exhaustiveness, integer-string format/range, timestamp format/order, optional-state dependencies, and unknown-field rejection where required. Canonical producer rules remain owned by R02/R03/R04.

**Required tests**

- Mutation/property tests over every union member and every unknown string.
- Closed-policy escalation tests for live/public/profitability/distribution/report kind.
- Integer-string tests for sign, decimals, exponent, whitespace, unsafe length, and overflow policy.
- Optional timestamp/status/state dependency tests.
- Round-trip test from actual service output through the external web parser.

**Regression risks**

- Shared validation must not create circular workspace imports.
- Stricter parsing can expose historical malformed rows; surface them as explicit errors, not empty data.
- Integer ranges and terminal states must follow owner-sector authority.

**Dependencies/aliases:** `BWS116-R02-004`, `BWS116-R02-005`, `BWS116-R03-017`

**Explicitly unchanged areas**

- Canonical strategy-ledger producer validation
- Persistence timestamp ordering root cause
- B1 economic correctness

**Blocks:** release=`true`, BWS-600 evidence=`true`, B1 acceptance=`true`, later execution=`true`.

### BWS118-R05-011 | P1 | The B1 browser contract rejects producer-valid null simulation results while accepting malformed child identity, economics, status, and time fields

Confidence: `0.99`
Reproduction: `REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY`
Primary owner: `R05`

**Current source evidence**

- `apps/web/src/api/client.ts` `assertB1BacktestRunItem child validation` lines `573-663`, SHA-256 `8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97`.
- `packages/persistence/src/repositories/b1-backtest-run-repository.ts` `buildSurebetB1SimulationResultInsertValues` lines `451-510`, SHA-256 `fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04`.
- `packages/persistence/src/repositories/b1-backtest-run-repository.ts` `normalizeSimulationRow` lines `646-653`, SHA-256 `fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04`.
- `apps/web/src/api/models.ts` `createB1BacktestRunRow` lines `550-608`, SHA-256 `3b08b0fe2d3559cc1e51bf3f570ea43b3b3c4379234ceaec33abe7d9c1c034c3`.

**Preconditions**

- A B1 run contains an accepted residual-exposure result with no residual exposure, or any malformed candidate/simulation child row.
- The parent run and policy literals satisfy the strict top-level checks.

**Trigger**

Return result=null for the producer-valid residual_exposure row, or return children with mismatched run/candidate IDs, non-integer spread/money strings, invalid status/stage, non-array blockers, non-boolean falsePositive, or invalid timestamps.

**Expected behavior**

The external client schema must exactly match the producer contract, including valid nullability, parent-child identity, discriminated simulation kinds/statuses, fixed-point values, blockers, booleans, timestamps, and result-shape dependencies.

**Current behavior**

The parser requires every simulation result to be an object, although persistence intentionally emits result:null for one accepted case. Conversely, candidate and simulation children receive only four shallow non-empty/object checks and are then cast to the full types.

**Impact**

Valid B1 reporting can fail closed in the browser, while malformed B1 economics and identity can be displayed as research evidence. B1 acceptance and false-positive analysis become unreliable at the presentation boundary.

**Independent evidence**

- The harness proved a producer-valid result:null row is rejected with “must be an object”.
- The same production parser accepted a malformed child with wrong run ID, non-integer gross spread, non-boolean falsePositive, and NaN settled net; the model rendered the malformed value.
- Persistence source explicitly constructs and normalizes the null residual-exposure result.

**Root cause**

The B1 client validator is a hand-written partial projection that diverges from the producer/persistence discriminated contract in both directions.

**Minimal fix boundary**

Create one shared/generated B1 reporting wire schema and validate all child discriminants, identities, units, timestamps, and nullability in R05. Hand any discovered producer-contract defect to R02/R04/R03 rather than changing economics here.

**Required tests**

- Producer-valid null residual-exposure round-trip test.
- Parent-child runId/candidateId mismatch rejection tests.
- All candidate/simulation status and kind union tests.
- Fixed-point, boolean, blockers, timestamp, and result-shape property tests.
- Model test proving malformed child data cannot render.

**Regression risks**

- Historical stored B1 rows may expose additional schema drift.
- Generated schema changes must preserve deliberate null semantics.
- Do not “fix” by replacing null with a fabricated object.

**Dependencies/aliases:** `BWS116-R02-002`, `BWS116-R02-004`, `BWS116-R02-005`

**Explicitly unchanged areas**

- B1 derivation mathematics
- Persistence transaction behavior
- Top-level BWS-900 and runtime-evidence holds

**Blocks:** release=`true`, BWS-600 evidence=`false`, B1 acceptance=`true`, later execution=`true`.

### BWS118-R05-012 | P1 | Cockpit loads are not request-generation-bound or cancellable, allowing a late older scope or route response to overwrite newer state

Confidence: `0.98`
Reproduction: `REPRODUCED_OFFLINE_STATE_MACHINE_NODE22_SUPPLEMENTARY_AND_STATIC`
Primary owner: `R05`

**Current source evidence**

- `apps/web/src/api/client.ts` `BwsOperatorCockpitFetchLike` lines `60-72`, SHA-256 `8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97`.
- `apps/web/src/api/client.ts` `loadBwsOperatorCockpitSnapshot` lines `1240-1325`, SHA-256 `8b9ba5b322e4b3333925b8b1ee2aa4d12b2db1693ae32cac2eafb7a94fc1bb97`.
- `apps/web/src/app/shell.tsx` `loadSnapshot effect and state updates` lines `144-180`, SHA-256 `ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189`.

**Preconditions**

- The operator changes route, API configuration, or evidence scope while an earlier load is still in flight.
- The earlier request completes after the newer request.

**Trigger**

Start an old-scope load, start and complete a new-scope load, then complete the old load last.

**Expected behavior**

Only the active request generation may publish snapshot/error/loading state. Superseded loads must be aborted where possible and ignored on completion; loading must represent the active generation only.

**Current behavior**

Every effect invocation writes the same snapshot/error/loading state without a generation token or active flag. The fetch abstraction carries no AbortSignal. Older completion can call setSnapshot and finally setIsLoading(false after a newer load.

**Impact**

The cockpit can display data for the wrong route/filter/API base while URL controls show the new scope. A late failure can also erase a valid newer snapshot or mark loading complete prematurely.

**Independent evidence**

- The bounded state-machine harness completed a new-scope request first and an old-scope request last; finalSnapshotScope became old while activeScope remained new.
- Static tracing shows no AbortController, request ID, cleanup guard, or completion ownership check.

**Root cause**

Asynchronous fetch completion has no monotonic ownership relation to the effect generation that initiated it.

**Minimal fix boundary**

Add one request-generation/AbortController boundary in the shell/client; pass AbortSignal through the fetch abstraction; ignore completion from superseded generations; make loading/error state generation-specific. Generic HTTP cancellation propagation remains R06-owned.

**Required tests**

- Deterministic deferred-promise race tests for route, scope, and configuration changes.
- Old success after new success; old failure after new success; old finally after new pending.
- Unmount and abort test proving no state publication or retained listener.
- Client test proving AbortSignal reaches fetch.

**Regression risks**

- React Strict Mode can expose duplicate-effect behavior and must be covered.
- Abort is advisory; late completion still needs generation checks.
- Do not retain an old snapshot as fallback unless explicitly labeled stale and scope-bound.

**Dependencies/aliases:** None.

**Explicitly unchanged areas**

- Server query correctness
- URL-state parsing
- Data-mode confinement

**Blocks:** release=`true`, BWS-600 evidence=`true`, B1 acceptance=`true`, later execution=`true`.

### BWS118-R05-013 | P2 | The cockpit conflates source-empty, search-no-match, and evidence-scope states under the same empty labels

Confidence: `0.99`
Reproduction: `REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY`
Primary owner: `R05`

**Current source evidence**

- `apps/web/src/api/models.ts` `buildBwsOperatorCockpitPageModel empty labels` lines `657-724`, SHA-256 `3b08b0fe2d3559cc1e51bf3f570ea43b3b3c4379234ceaec33abe7d9c1c034c3`.
- `apps/web/src/app/shell.tsx` `filteredRows / visibleRows` lines `182-188`, SHA-256 `ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189`.
- `apps/web/src/app/shell.tsx` `empty-state rendering` lines `460-485`, SHA-256 `ca853137503ad688e08f287170378fc4ab2aea368d618863037e5f4b5f746189`.

**Preconditions**

- The source page contains rows but local search removes all of them, or an explicit evidence scope returns zero rows.
- The table renders visibleRows.length=0.

**Trigger**

Search for a nonmatching term against a nonempty page, or apply a valid evidence filter that produces an empty result.

**Expected behavior**

Presentation must distinguish at least: source/query returned no rows, loaded page is partial, active search has no matches, explicit evidence scope has no matches, scope is missing, and request failed.

**Current behavior**

The shell always renders model.emptyLabel when filtered visible rows are empty. The evidence page always says to provide an explicit filter even when one is applied; other pages claim no source rows when only local search is empty.

**Impact**

Operators can believe evidence is absent, a filter was not applied, or the source contains no blockers when only the local view is empty. Diagnostics and review decisions become misleading.

**Independent evidence**

- The harness loaded two source rows, applied a nonmatching search, and rendered “No backtest ledger rows are available...”.
- With an explicit evidence scope applied and zero returned rows, the model still rendered “Provide an explicit evidence filter...”.

**Root cause**

Empty copy is fixed at route-model construction and is not derived from query, scope, pagination, or local-filter state.

**Minimal fix boundary**

Introduce explicit R05 UI view states for source empty, filtered empty, missing scope, applied-scope no match, partial page, and error; derive copy from those states and keep counts visible.

**Required tests**

- Nonempty source plus zero local-search results.
- Explicit evidence scope with zero results.
- Missing evidence scope.
- Server partial page and server error states.
- Reset-search action restoring source rows without refetch confusion.

**Regression risks**

- Copy changes may affect snapshots/accessibility tests.
- Do not conflate a filtered empty with a successful exhaustive no-match unless completeness is known.
- Local and server filters need separate labels.

**Dependencies/aliases:** None.

**Explicitly unchanged areas**

- Query filtering semantics
- Server error taxonomy
- Underlying row contents

**Blocks:** release=`true`, BWS-600 evidence=`true`, B1 acceptance=`true`, later execution=`false`.

## 9. Hypotheses and external blockers

One hypothesis remains deliberately unpromoted: generic `renderValue` may erase field-specific distinctions among null, absent, unknown, and complex values. It requires a field-by-field authority map after the external wire schema is made exhaustive.

External/environment limitations:

- Node 20.20.2 was unavailable. Node 22.16.0 results are supplementary only.
- No PostgreSQL server or accepted disposable database was contacted. Two database-backed focused tests remained skipped.
- Full web typecheck was unavailable because repository dependencies/types were not installed, and installation was prohibited.
- Accepted external BWS-600/BWS-710 runtime evidence remains unavailable. Static review does not change those holds.

## 10. Intentional safeguards and rejected suspicions

Safeguards to preserve:

- GET-only handler, no-store, CSP, referrer, permissions, framing, and content-type protections.
- Explicit `mock` or loopback `api` mode, no automatic fallback, no embedded credentials, and no arbitrary remote API target.
- B1 top-level execution/public-signal/runtime-evidence holds and BWS-900 parked status.
- Visible error panel with no silent fallback.
- Syntactically bounded page-size and filter inputs.

Rejected suspicions:

- No write route or live provider operation exists in the reviewed API/cockpit surface.
- API mode does not silently switch to mock data.
- No literal green success palette was found. The confirmed problem is semantic projection, not a green color token.

## 11. Cross-area handoffs

- `KNOWN_BASELINE_MANIFEST_DRIFT` remains R11-owned.
- R01 retains exact upstream cycle/page/record/query/generation and source-time ownership under R01-003/004/005/010.
- R02 retains locale-dependent deterministic ordering under R02-013 and B1 identity/economics roots under R02-002/004/005/007.
- R03 retains repository list boundedness, transaction/snapshot mechanics, retention references, and impossible persisted timestamp ordering under R03-012/013/017.
- R06 must assess server request cancellation, health/readiness under query saturation, shutdown, and late completion.
- R11 must add property, mutation, contract, browser race, database-plan, and false-green tests; static validator passes did not detect the confirmed defects.

## 12. Test gaps and false-green analysis

The four focused files produced 41 tests under Node 22: 39 passed and 2 database-backed tests skipped. Passing tests did not challenge forged cursors, mutable datasets across pages, wrong-scope empty responses, mixed snapshots, ancient/future response times, unknown boundary versions, policy/status/fixed-point mutation, B1 null round-trip, maximum fanout, browser request races, or empty-state distinctions.

The repository validators `validate_repo`, `validate_contract_boundary`, `validate_no_provider_connections`, `validate_no_execution_paths`, and B1 boundary/authority/acceptance all passed. These results prove selected static constraints, not R05 semantic correctness. `validate_source_manifest` failed only for the known baseline drift and was not promoted to an R05 finding.

## 13. Prioritized review-only remediation order

1. Define one exact versioned public read envelope: normalized query receipt, canonical sort, snapshot/high-watermark, as-of/currentness, partial/completeness, and typed errors.
2. Repair cursor issuance/continuation and replace runtime-cycle sampling with a deterministic pageable read model.
3. Make service work proportional to returned rows with explicit operation/time/cancellation budgets.
4. Replace selective browser casts with exhaustive shared/generated wire validators, including B1 child/null contracts and all hold fields.
5. Implement coherent cockpit snapshot or explicitly independent partial observations; integrate server continuation/search/paging.
6. Add stale/refresh/request-generation ownership and distinct loading/error/empty/filter states.
7. Run the new focused, property, browser-race, database-backed, and full clean build gates under Node 20.20.2.

No implementation is authorized by this order. It is a dependency sequence for later consolidation.

## 14. Explicit unchanged areas

- No source, test, fixture, schema, migration, documentation, manifest, package, or configuration file was edited.
- No R01 upstream intake, R02 strategy mathematics, R03 persistence state machine, R04 simulation lifecycle, or R06 service lifecycle root cause was reassigned.
- BWS-600 remains externally blocked; BWS-710 remains blocked; BWS-900 remains parked.
- No execution, public signal, provider connection, credential, account, signer, database mutation, or profitability claim was enabled.

## 15. Validation and mutation attestation

Every one of the 657 archive members appears once in `BWS118-R05-coverage.tsv`. Source hashes were rechecked against the archive after all review harnesses and outputs were created. Temporary harnesses and logs remained under `/tmp/bws118-r05-review`, and the four requested deliverables were written under `/mnt/data`.
