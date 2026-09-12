# BWS120-R07 deep review: observability, diagnostics, evidence, handoffs, and BWS-600 campaign truth

## Executive verdict

- **Archive:** `betting-win-surebet120(1).zip`
- **SHA-256:** `d4565c05ecfe63f5d5511f224a20ff20fb82bfc75b23203c94d7d3e98a8c21bb`
- **Regular files:** `695`
- **Archive/path/type safety:** PASS
- **Executable compatibility with BWS118:** PASS. The new archive contains 38 documentation additions and two documentation edits, with zero non-documentation byte differences.
- **Inherited authority:** all 85 R01-R06 confirmed finding IDs were loaded, overlap-checked, and preserved; no inherited root cause received a new R07 ID.
- **New confirmed findings:** 19 (2 P0, 14 P1, 3 P2).
- **Release blocking:** 17; **deployment blocking:** 19; **BWS-600 blocking:** 17; **BWS-710 blocking:** 1.
- **Overall verdict:** `BLOCKED_EVIDENCE_AUTHORITY_AND_CAMPAIGN_ACCEPTANCE_REMEDIATION_REQUIRED`.

The current implementation has useful safety scaffolding, but R07 evidence is not an immutable, coherent proof of one exact source/data/process/campaign generation. The selected BWS-600 controller does not consume the accepted campaign manifest, the default observation can finish after one ready sample, the parent promotes a child status label without an evidence digest, and final local acceptance explicitly accepts placeholder referenced files. Observability also contains two P0 defects: an unconstrained log path and incomplete secret redaction.

## Authority and scope

The handoff assigns R07 exclusive ownership of evidence identity/publication/retention, diagnostics and metrics packets, runtime and B1 handoffs, BWS-600 parent/child campaign truth, redaction, and evidence-scope truth. This review consumed R01-R06 conclusions without duplicating their root causes, particularly R06-015 and R06-016.

### Current authority preserved

- `current_task=BWS-600`
- `current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE`
- `bws710_status=BLOCKED_ACCEPTED_BETTING_WIN_B1_MULTI_VENUE_API_REQUIRED`
- `bws900_status=PARKED_NOT_AUTHORIZED`
- Review mode remained read-only; no provider, external API, database, credential, service, controller, or live operation was contacted.

## R07 architecture map

| Layer | Production authority | R07 conclusion |
|---|---|---|
| Structured logging | `observability.ts:createBwsStructuredLogger` | Repo escape and incomplete redaction are release blockers. |
| Evidence index | `registerBwsEvidenceArtifact`, `summarizeBwsEvidenceIndex` | Metadata append is non-serialized, mutable-path based, and append-order currentness is unsafe. |
| Diagnostics | `collectBwsDiagnosticsBundle`, `fetchLoopbackJson` | Non-2xx JSON and synthesized ready metrics can be represented as evidence. |
| Runtime observation | `paper-runtime-evidence.ts` | Default first-ready exit and latest-sample verdict do not prove a continuous window; samples are generation-unbound. |
| Runtime handoff | `paper-runtime-handoff.ts` | Lifecycle/source TOCTOU and non-transactional version/latest publication weaken handoff truth. |
| External campaign preflight | `external-runtime-preflight.ts` | Producer is substantial, but the selected BWS-600 route never consumes its manifest. |
| Parent/child campaign | `run-paper-evaluation.sh`, `run-paper-autopilot.sh`, controller hardening | Process identity is checked, but semantic evidence identity is absent from the terminal protocol. |
| Final local acceptance | `final-local-acceptance.ts` | Labels and file existence can fabricate acceptance; referenced bytes/relationships are not verified. |
| B1 acceptance | `b1-runtime-evidence.ts` | Caller-selected inputSource and arbitrary equal hashes can claim accepted upstream input. |
| Operator progress | `check_progress.sh`, `open_log.sh` | Cross-controller lexical sorting can select an older run. |

## Finding summary

| ID | Severity | Title | Release | BWS-600 | BWS-710 | Deployment |
|---|---:|---|---:|---:|---:|---:|
| BWS120-R07-001 | P0 | Configurable structured-log paths escape the repository and can rotate or append to out-of-bound files | yes | yes | no | yes |
| BWS120-R07-002 | P0 | Structured-log redaction misses Authorization, Cookie, API-key, header, and value-shaped secrets | yes | yes | no | yes |
| BWS120-R07-003 | P1 | Evidence-index deduplication and latest-summary publication are not serialized across processes | yes | yes | no | yes |
| BWS120-R07-004 | P1 | Indexed evidence can be mutated or deleted after registration without invalidating acceptance | yes | yes | no | yes |
| BWS120-R07-005 | P1 | Evidence “latest” state is append-order state, not monotonic currentness | yes | yes | no | yes |
| BWS120-R07-006 | P1 | Loopback diagnostics accept non-2xx and schema-invalid JSON as successful health/readiness/metrics evidence | yes | yes | no | yes |
| BWS120-R07-007 | P1 | A failed metrics request is silently replaced by synthesized metrics that declare the API ready | yes | yes | no | yes |
| BWS120-R07-009 | P1 | BWS-600 readiness can be certified from one ready sample and does not require a continuously ready window | yes | yes | no | yes |
| BWS120-R07-010 | P1 | Runtime-evidence readiness is not bound to one exact source, data, process, campaign, and artifact generation | yes | yes | no | yes |
| BWS120-R07-012 | P1 | Diagnostics, runtime-evidence, and handoff outputs bypass the canonical evidence index and publication transaction | yes | yes | no | yes |
| BWS120-R07-013 | P1 | Runtime handoff can combine a lifecycle snapshot with a different source-tree generation | yes | yes | no | yes |
| BWS120-R07-014 | P1 | Versioned handoff and latest pointer publish as two independent writes with no crash recovery or digest link | yes | yes | no | yes |
| BWS120-R07-015 | P1 | The selected BWS-600 controller never consumes or verifies the accepted external campaign manifest | yes | yes | no | yes |
| BWS120-R07-016 | P1 | Paper-autopilot completion trusts a child status label and exit code without an evidence receipt | yes | yes | no | yes |
| BWS120-R07-017 | P1 | Final-local runtime acceptance validates labels and file existence rather than cryptographic evidence relationships | yes | yes | no | yes |
| BWS120-R07-018 | P1 | B1 runtime acceptance trusts a caller-selected “accepted upstream” enum and arbitrary repeated hashes | yes | no | yes | yes |
| BWS120-R07-008 | P2 | Retention classes are recorded but no reference-aware retention or pruning lifecycle is implemented | no | yes | no | yes |
| BWS120-R07-011 | P2 | Observation duration is governed by wall-clock strings and can be unbounded or prematurely complete after clock changes | yes | yes | no | yes |
| BWS120-R07-019 | P2 | Progress and log helpers select the lexically greatest controller prefix instead of the newest run | no | no | no | yes |

## Detailed confirmed findings

### BWS120-R07-001 — Configurable structured-log paths escape the repository and can rotate or append to out-of-bound files

**Severity:** P0
**Confidence:** HIGH
**Primary source:** `packages/bootstrap/src/operations/observability.ts` `L268-L331`
**SHA-256:** `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`

**Preconditions.** A caller or deployment environment can supply BWS_OBSERVABILITY_LOG_DIRECTORY or request.logDirectory. The BWS process has write permission to the resolved path.

**Trigger.** Supply an absolute path or traversal path outside the repository, then emit a structured event for a role such as api.

**Expected behavior.** All managed observability output must be confined to a canonical repo-owned runtime directory, reject absolute/traversal paths, and reject every existing symlink segment before creating, rotating, or appending files.

**Current behavior.** path.resolve(repositoryRoot, configuredValue) accepts an absolute value as-is and normalizes traversal outside the repository. mkdirSync, renameSync, and appendFileSync then operate there without a boundary check.

**Impact.** A configuration mistake or hostile environment can write, append, or rotate files outside the repository. This violates the review taxonomy repository-escape boundary and can damage unrelated files whose names collide with role logs.

**Exact evidence.**
- `packages/bootstrap/src/operations/observability.ts` `L268-L331` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`: The caller or BWS_OBSERVABILITY_LOG_DIRECTORY is passed to path.resolve without repository confinement or symlink rejection, then directories are created and role-named files are rotated/appended.
- `packages/bootstrap/src/operations/observability.ts` `L783-L803` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`: Rotation renames existing role-named files in the selected directory.
- Static source trace shows no requireRepositoryPath, relative-boundary comparison, realpath containment, or symlink-segment check in the logger path.
- The bounded static probe confirmed the absolute-path branch remains reachable.

**Reproduction status.** `STATIC_SOURCE_CONFIRMED; OFFLINE_PATH_RESOLUTION_PROBE_CONFIRMED`

**Root cause.** The logger treats an operator-controlled filesystem location as a generic resolved path rather than a confined repository resource.

**Minimal fix boundary.** Confine the effective log directory under one explicit repo-owned root; reject absolute paths, traversal, and existing symlink segments before mkdir, rotation, and append. Keep the public logger API and valid relative paths unchanged.

**Required tests.** Absolute-path rejection; ../ traversal rejection; existing and intermediate symlink rejection; outside-directory api.jsonl collision/rotation rejection; valid repo-relative log rotation.

**Regression risks.** Over-confinement could reject legitimate test temp directories; tests should allow an explicit already-confined repositoryRoot fixture rather than a global fallback.

**Secondary sectors:** R10, R11
**Inherited aliases/dependencies:** none
**Explicitly unchanged:** Log record schema; role names; rotation size/count semantics for valid paths; runtime process lifecycle
**Blocks:** release=true, BWS-600=true, BWS-710=false, deployment=true.

### BWS120-R07-002 — Structured-log redaction misses Authorization, Cookie, API-key, header, and value-shaped secrets

**Severity:** P0
**Confidence:** HIGH
**Primary source:** `packages/bootstrap/src/operations/observability.ts` `L50-L51; L805-L837`
**SHA-256:** `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`

**Preconditions.** A managed role includes request headers, auth metadata, cookies, provider/API credentials, or a bearer/basic value in log details.

**Trigger.** Log details such as {Authorization:"Bearer ..."}, {Cookie:"session=..."}, {apiKey:"..."}, or {headers:{authorization:"..."}}.

**Expected behavior.** Secret-bearing keys and recognizable credential values must be redacted recursively before any file write, rotation, diagnostic collection, or artifact packaging.

**Current behavior.** Those keys do not match the source pattern, and non-URL strings are returned unchanged. The structured log is then retained and included in diagnostics.

**Impact.** Credentials, session cookies, or authorization material can be persisted to logs and diagnostics/artifact archives. This is a direct secret-exposure defect.

**Exact evidence.**
- `packages/bootstrap/src/operations/observability.ts` `L50-L51` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`: The key matcher covers credential/password/private-key/secret/seed/token families but not authorization, cookie, set-cookie, apiKey, headers, or common auth aliases.
- `packages/bootstrap/src/operations/observability.ts` `L805-L837` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`: Strings that are not URLs are emitted verbatim; nested values are redacted only when their immediate key matches the narrow pattern.
- `tests/bws-observability.test.ts` `L16-L66` `b1f86186bd8cc389a620c6ef53b60b83e2b8c3ef3dd7e0dc635ca6e9f5fda6c5`: The focused test checks password and URL query stripping but does not cover authorization headers, cookies, API keys, or bearer/basic values under neutral keys.
- The offline key-pattern probe returned false for Authorization, Cookie, Set-Cookie, apiKey, and headers while returning true for password and access_token.
- No value-shape sanitizer covers Bearer, Basic, signed cookies, PEM blocks, or connection strings under neutral keys.

**Reproduction status.** `STATIC_SOURCE_CONFIRMED; BOUNDED_OFFLINE_PATTERN_PROBE_CONFIRMED`

**Root cause.** Redaction is based on an incomplete immediate-key allow/deny regex and URL-origin coercion, not a closed recursive secret policy.

**Minimal fix boundary.** Centralize redaction in a shared closed policy covering authorization/cookie/header/API-key aliases and credential-shaped values. Apply it before log serialization and diagnostics inclusion; do not expose raw values in error paths.

**Required tests.** Authorization/Bearer redaction; Cookie and Set-Cookie redaction; apiKey/x-api-key redaction; nested headers redaction; Basic auth/PEM/connection-string value redaction; negative tests for benign tokens such as event identifiers.

**Regression risks.** Aggressive value-shape redaction can hide benign evidence identifiers; use explicit categories and preserve nonsecret hashes/IDs.

**Secondary sectors:** R10, R11, R12
**Inherited aliases/dependencies:** none
**Explicitly unchanged:** Nonsecret event codes; source fingerprints; bounded URL-origin behavior; provider/execution disabled policy
**Blocks:** release=true, BWS-600=true, BWS-710=false, deployment=true.

### BWS120-R07-003 — Evidence-index deduplication and latest-summary publication are not serialized across processes

**Severity:** P1
**Confidence:** HIGH
**Primary source:** `packages/bootstrap/src/operations/observability.ts` `L376-L408`
**SHA-256:** `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`

**Preconditions.** Two managed processes register the same or different artifacts concurrently.

**Trigger.** Both processes read the pre-append index before either append/summary write completes.

**Expected behavior.** Index append, exact duplicate suppression, and latest-summary advancement must be one serialized, crash-recoverable publication transaction.

**Current behavior.** Concurrent publishers can both append an exact duplicate, overwrite each other’s latest summary with different snapshots, or fail on shared publication state. There is no sequence, lock, or compare-and-set authority.

**Impact.** Duplicate or stale evidence-index state breaks exactly-once publication, recent-evidence diagnostics, retention references, and campaign completion accounting.

**Exact evidence.**
- `packages/bootstrap/src/operations/observability.ts` `L376-L408` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`: Each process independently reads the full index, checks for a duplicate, appends, rereads, and rewrites latest.json with no lock, CAS, append receipt, or atomic transaction.
- `packages/bootstrap/src/operations/observability.ts` `L1057-L1062` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`: The shared summary temporary name is keyed only by PID; publication is independent from the index append.
- The register function has a classic read-check-append-read-rewrite sequence with no interprocess exclusion.
- The focused test performs two sequential registrations in one process and therefore cannot exercise the race.

**Reproduction status.** `STATIC_CONCURRENCY_DEFECT_CONFIRMED; DYNAMIC_MULTIPROCESS_POSTGRES/FLOCK_PROOF_NOT_RUN`

**Root cause.** Evidence publication is implemented as independent filesystem operations instead of a single-owner append protocol with a monotonic receipt.

**Minimal fix boundary.** Add one repository-scoped publication lock or durable append repository, assign monotonic entry identity, make duplicate detection atomic, and derive latest.json from the committed append receipt.

**Required tests.** Two-process exact-duplicate barrier test; two-process distinct-artifact barrier test; crash between append and summary; stale writer/CAS rejection; restart reconciliation from index.

**Regression risks.** A new lock must not deadlock diagnostics or controllers; recovery must distinguish a live owner from stale ownership.

**Secondary sectors:** R03, R06, R11, R12
**Inherited aliases/dependencies:** none
**Explicitly unchanged:** Artifact hash calculation; entry field schema; read-only summary API for a consistent committed index
**Blocks:** release=true, BWS-600=true, BWS-710=false, deployment=true.

### BWS120-R07-004 — Indexed evidence can be mutated or deleted after registration without invalidating acceptance

**Severity:** P1
**Confidence:** HIGH
**Primary source:** `packages/bootstrap/src/operations/observability.ts` `L376-L417`
**SHA-256:** `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`

**Preconditions.** An evidence artifact remains at a mutable path after registration or is pruned/overwritten out of band.

**Trigger.** Modify, replace, truncate, or delete the artifact after the index entry is written.

**Expected behavior.** Accepted evidence must be immutable by construction, content-addressed/copied to retained storage, or revalidated against its recorded hash and file identity whenever used as current/accepted evidence.

**Current behavior.** The index continues to report the old path/hash as recent evidence even when the path no longer exists or contains different bytes. Re-registering the same path with a new hash simply adds another entry.

**Impact.** Campaigns and diagnostics can claim retained evidence that cannot be reproduced or whose current bytes differ from the acceptance receipt.

**Exact evidence.**
- `packages/bootstrap/src/operations/observability.ts` `L376-L408` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`: The artifact hash is sampled once and only path+hash are appended.
- `packages/bootstrap/src/operations/observability.ts` `L746-L780` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`: Later reads trust recorded JSON entries and never require the referenced file to exist or still match the recorded SHA-256.
- No read path in observability re-hashes referenced files.
- Repository-wide tracing found no immutable evidence-store promotion step attached to registerBwsEvidenceArtifact.

**Reproduction status.** `STATIC_SOURCE_CONFIRMED; MUTATION/DELETION STATE_TRANSITION_CONFIRMED_BY_CODE_PATH`

**Root cause.** The append-only metadata record is treated as immutability proof while the referenced artifact remains mutable path state.

**Minimal fix boundary.** Publish evidence to a non-replaceable content-addressed location or bind path inode/content to an immutable receipt; reject same-path content drift and verify existence/hash before acceptance and retention decisions.

**Required tests.** Post-registration mutation; post-registration deletion; same-path different-content conflict; content-address collision refusal; accepted-evidence revalidation.

**Regression risks.** Copying large artifacts can increase disk use; use bounded streaming and reference-aware retention.

**Secondary sectors:** R03, R08, R11, R12
**Inherited aliases/dependencies:** none
**Explicitly unchanged:** Original producer semantics; artifact JSON schemas; historical entries that remain byte-valid
**Blocks:** release=true, BWS-600=true, BWS-710=false, deployment=true.

### BWS120-R07-005 — Evidence “latest” state is append-order state, not monotonic currentness

**Severity:** P1
**Confidence:** HIGH
**Primary source:** `packages/bootstrap/src/operations/observability.ts` `L746-L780`
**SHA-256:** `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`

**Preconditions.** A delayed, retried, backdated, future-dated, or reordered publisher appends after a newer artifact.

**Trigger.** Append a valid entry whose createdAt/runtime generation is older, unrelated, or implausibly future relative to the current accepted entry.

**Expected behavior.** Latest/current evidence must be selected by an explicit monotonic generation or campaign sequence with bounded clock validation and conflict rejection.

**Current behavior.** The last appended line becomes current regardless of timestamp, runtime generation, source fingerprint, or campaign relationship.

**Impact.** Diagnostics, progress, retention, and acceptance can point at stale or future evidence and misreport current runtime/campaign state.

**Exact evidence.**
- `packages/bootstrap/src/operations/observability.ts` `L376-L408` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`: createdAt is caller-supplied and only ISO-shaped; there is no monotonicity, future-skew, generation, or predecessor check.
- `packages/bootstrap/src/operations/observability.ts` `L746-L758` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`: The final physical line becomes lastCreatedAt/lastRuntimeId and recentEntries are a raw tail.
- `packages/bootstrap/src/operations/observability.ts` `L761-L780` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`: Entries are accepted by schema marker and file order, not validated chronology/currentness.
- The summary uses entries.slice(-limit) and entries[entries.length-1].
- No code compares createdAt, runtimeId, sourceFingerprint, or campaign predecessor before advancing latest.

**Reproduction status.** `STATIC_SOURCE_CONFIRMED; ORDERING_MODEL_PROBE_CONFIRMED`

**Root cause.** Physical append position is used as currentness authority without a monotonic logical generation contract.

**Minimal fix boundary.** Add explicit campaign/runtime generation, monotonic sequence, bounded timestamp policy, and compare-and-set latest advancement. Preserve conflicting/out-of-order entries as historical without promoting them.

**Required tests.** Backdated append; future-dated append; delayed old runtime append; cross-runtime conflict; same-sequence different-hash rejection; restart latest reconstruction.

**Regression risks.** Strict clocks can reject valid delayed uploads; currentness should use logical sequence and treat wall time as bounded evidence, not sole authority.

**Secondary sectors:** R01, R03, R05, R11, R12
**Inherited aliases/dependencies:** BWS116-R01-010, BWS118-R05-008
**Explicitly unchanged:** Historical evidence retention; append-only audit history; exact artifact bytes
**Blocks:** release=true, BWS-600=true, BWS-710=false, deployment=true.

### BWS120-R07-006 — Loopback diagnostics accept non-2xx and schema-invalid JSON as successful health/readiness/metrics evidence

**Severity:** P1
**Confidence:** HIGH
**Primary source:** `packages/bootstrap/src/operations/observability.ts` `L691-L713`
**SHA-256:** `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`

**Preconditions.** A loopback endpoint returns JSON on an HTTP error, wrong route, stale proxy, or incompatible server version.

**Trigger.** Return HTTP 500/404/3xx with JSON containing ready-shaped fields, or 200 with a wrong schema.

**Expected behavior.** Every probe must require an exact route-specific 2xx status, content type, closed schema, runtime/source generation, and fail-closed error classification.

**Current behavior.** Any parseable JSON is represented as an ok response. Downstream diagnostics and runtime-evidence sampling read its fields without a transport receipt.

**Impact.** Error bodies, route confusion, or an incompatible local process can be promoted into healthy/ready/metrics evidence.

**Exact evidence.**
- `packages/bootstrap/src/operations/observability.ts` `L631-L677` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`: The three probe results are trusted when fetchLoopbackJson returns ok=true.
- `packages/bootstrap/src/operations/observability.ts` `L691-L713` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`: The helper parses JSON and returns ok=true without checking response.ok, status, content type, redirect behavior, route schema, or required envelope fields.
- `tests/bws-observability.test.ts` `L138-L180` `b1f86186bd8cc389a620c6ef53b60b83e2b8c3ef3dd7e0dc635ca6e9f5fda6c5`: The test injects already-enriched success objects and never exercises real non-2xx or malformed responses.
- The helper never references response.ok or response.status.
- The bounded static probe confirmed the response-status branch is absent.

**Reproduction status.** `STATIC_SOURCE_CONFIRMED; BOUNDED_SOURCE_ASSERTION_CONFIRMED`

**Root cause.** JSON parse success is conflated with HTTP and contract success.

**Minimal fix boundary.** Return a typed probe receipt containing status, content type, final URL, route, body hash, schema/version, runtime ID, and source fingerprint; reject non-2xx, redirects, and malformed/extra-state bodies.

**Required tests.** 500 JSON ready body; 404 JSON; redirect; wrong content type; wrong schema/version; different runtime ID; oversized body and timeout.

**Regression risks.** Closed schema validation must remain compatible with explicitly versioned endpoint upgrades.

**Secondary sectors:** R05, R06, R10, R11
**Inherited aliases/dependencies:** BWS118-R06-007, BWS118-R06-008
**Explicitly unchanged:** Loopback-only destination; 2-second timeout; provider/execution disabled policy
**Blocks:** release=true, BWS-600=true, BWS-710=false, deployment=true.

### BWS120-R07-007 — A failed metrics request is silently replaced by synthesized metrics that declare the API ready

**Severity:** P1
**Confidence:** HIGH
**Primary source:** `packages/bootstrap/src/operations/observability.ts` `L479-L484; L631-L677`
**SHA-256:** `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`

**Preconditions.** The /metrics fetch fails while diagnostics can still inspect local state/database helpers.

**Trigger.** Time out, refuse, or return invalid JSON from the metrics endpoint.

**Expected behavior.** Missing endpoint evidence must remain missing/blocked and be explicitly labeled by origin; synthesized operational context must never claim endpoint readiness.

**Current behavior.** The diagnostics bundle contains a locally synthesized bws.metrics_snapshot.v1 with api.status=ready. Its shape is indistinguishable from fetched metrics to downstream readers.

**Impact.** Diagnostics can fabricate partial readiness and obscure an endpoint failure. Combined with stale lifecycle/readiness sources, this weakens false-readiness resistance.

**Exact evidence.**
- `packages/bootstrap/src/operations/observability.ts` `L479-L484` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`: The locally created snapshot always sets api.status to ready.
- `packages/bootstrap/src/operations/observability.ts` `L631-L677` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`: When /metrics fails, diagnostics substitute createBwsMetricsSnapshot without recording fetched-versus-synthesized origin in the metrics object.
- The fallback branch is explicit at L663-L672.
- The bounded source probe confirmed the fallback calls a constructor whose API status is hard-coded ready.

**Reproduction status.** `STATIC_SOURCE_CONFIRMED; BOUNDED_SOURCE_ASSERTION_CONFIRMED`

**Root cause.** The code uses a convenience snapshot as evidence fallback without origin or conservative status semantics.

**Minimal fix boundary.** Split fetched endpoint evidence from local diagnostic context. On fetch failure set metrics origin=synthesized and API status=blocked/unknown; prohibit synthesized fields from satisfying acceptance.

**Required tests.** Metrics timeout/refusal; non-JSON metrics response; fetched-versus-synthesized origin; fallback cannot satisfy sampleIsReady; mixed stale-state regression.

**Regression risks.** Operators may still need local context during an outage; preserve it in a separate non-acceptance field.

**Secondary sectors:** R05, R06, R11
**Inherited aliases/dependencies:** BWS118-R06-007, BWS118-R06-008
**Explicitly unchanged:** Database/queue diagnostic collection; health/readiness failure objects; loopback-only policy
**Blocks:** release=true, BWS-600=true, BWS-710=false, deployment=true.

### BWS120-R07-008 — Retention classes are recorded but no reference-aware retention or pruning lifecycle is implemented

**Severity:** P2
**Confidence:** HIGH
**Primary source:** `packages/bootstrap/src/operations/observability.ts` `L376-L408; L530-L592`
**SHA-256:** `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`

**Preconditions.** BWS-600 or long-lived services continuously produce logs, diagnostics, lifecycle, runtime, backup, or campaign evidence.

**Trigger.** Allow normal repeated evidence production over time.

**Expected behavior.** Every retention class must have an explicit plan/apply policy that protects accepted ledger rows, active runtimes, unresolved blockers, and retained handoffs while bounding disk/inode growth.

**Current behavior.** Retention class values are written and displayed, but repository-wide tracing found no R07 retention planner/apply path for the observability index or diagnostics directories.

**Impact.** Long campaigns can exhaust disk or inodes; ad-hoc cleanup risks deleting still-referenced acceptance evidence.

**Exact evidence.**
- `packages/bootstrap/src/operations/observability.ts` `L376-L408` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`: retentionClass is metadata only.
- `packages/bootstrap/src/operations/observability.ts` `L530-L592` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`: Each collection creates a new diagnostics directory and side files with no expiry or pruning transaction.
- `docs/038_observability_metrics_and_evidence_contract.md` `L53-L57` `b244f607ae9a2f03f808cf746aa820a263fb669dadcbc74c9ed5a6ec33b9e556`: The binding contract requires reference checks before expired evidence is removed.
- No retention consumer was found for BwsEvidenceRetentionClass.
- Diagnostics directory names are append-only by timestamp/hash and are never reconciled to accepted references.

**Reproduction status.** `STATIC_REPOSITORY_TRACE_CONFIRMED; LONG_DURATION_RESOURCE_PROOF_NOT_RUN`

**Root cause.** Retention metadata was implemented without the state machine that interprets it and proves reference safety.

**Minimal fix boundary.** Add dry-run retention planning, immutable reference graph evaluation, bounded apply, interruption recovery, and post-apply index reconciliation. R08 owns generic backup/retention mechanics; R07 owns evidence reference semantics.

**Required tests.** Plan/apply parity; active runtime protection; accepted handoff protection; unresolved blocker protection; interrupted pruning recovery; disk/inode bound soak.

**Regression risks.** Incorrect reference discovery can cause data loss; deletion must remain fail-closed and separately authorized.

**Secondary sectors:** R08, R11, R12
**Inherited aliases/dependencies:** none
**Explicitly unchanged:** Existing evidence bytes; retentionClass vocabulary; backup-specific retention mechanics owned by R08
**Blocks:** release=false, BWS-600=true, BWS-710=false, deployment=true.

### BWS120-R07-009 — BWS-600 readiness can be certified from one ready sample and does not require a continuously ready window

**Severity:** P1
**Confidence:** HIGH
**Primary source:** `packages/bootstrap/src/operations/paper-runtime-evidence.ts` `L206-L330`
**SHA-256:** `d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d`

**Preconditions.** Preflight passes and any single observation sample has ready labels.

**Trigger.** Run the default BWS-600 route; alternatively run keep-monitoring with earlier blocked samples followed by one final ready sample.

**Expected behavior.** A configured 72-hour evidence window must evaluate every scheduled interval, require an explicit continuity policy, account for missed samples, and fail/qualify any degradation according to that policy.

**Current behavior.** The default exits immediately on the first ready sample. With monitoring enabled, a blocked-to-ready sequence ends ready because the mutable ready variable contains only the last sample; earlier failures are not part of the verdict.

**Impact.** A nominal multi-day campaign can complete in one cycle and advertise continuous readiness without continuous evidence.

**Exact evidence.**
- `packages/bootstrap/src/operations/paper-runtime-evidence.ts` `L206-L330` `d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d`: keepMonitoringWhenReady defaults false, the loop breaks on the first ready sample, and when monitoring continues only the final sample controls the verdict.
- `run-paper-autopilot.sh` `L15-L30; L842-L872` `fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661`: The seven-day parent launches a nominal 72-hour child without --keep-monitoring-when-ready by default.
- `run-paper-evaluation.sh` `L845-L933` `d7d821119d51c3dd5bbcf7a80f0e98488ebd38f7d771310265939a918505e667`: The child forwards the flag only when explicitly enabled and exits success for the ready label.
- `tests/bws-paper-runtime-evidence.test.ts` `L519-L598` `64b1c04c9d626dedf3059393e095c4a4e8c5cf4399ccb3deb88d60d433d51439`: The focused success test expects one ready sample rather than a full continuous observation window.
- The exact first-ready break is at L314-L315.
- The final decision at L324-L330 uses only the last iteration value.
- Controller defaults keep monitoring disabled.

**Reproduction status.** `STATIC_STATE_MACHINE_CONFIRMED; FOCUSED_TEST_PROVES_ONE_SAMPLE_SUCCESS_CONTRACT`

**Root cause.** The implementation models readiness as a latest-sample boolean instead of a window aggregate with continuity requirements.

**Minimal fix boundary.** Define an explicit window policy: minimum elapsed monotonic duration, expected sample schedule, maximum gap, minimum sample count, and all/threshold readiness semantics. Keep ready handoff provisional until the window closes.

**Required tests.** One ready sample must not satisfy 72h; ready→blocked; blocked→ready; missed intervals; collection gap; exact duration/minimum sample count; restart/resume continuity.

**Regression risks.** A strict all-samples policy may be too brittle; the policy must be explicit and machine-bound rather than implicit latest state.

**Secondary sectors:** R04, R06, R11, R12
**Inherited aliases/dependencies:** BWS118-R06-007, BWS118-R06-015
**Explicitly unchanged:** API-only preflight; closed execution/provider policy; stack ownership and stop behavior outside the verdict aggregation
**Blocks:** release=true, BWS-600=true, BWS-710=false, deployment=true.

### BWS120-R07-010 — Runtime-evidence readiness is not bound to one exact source, data, process, campaign, and artifact generation

**Severity:** P1
**Confidence:** HIGH
**Primary source:** `packages/bootstrap/src/operations/paper-runtime-evidence.ts` `L406-L519`
**SHA-256:** `d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d`

**Preconditions.** Diagnostics, lifecycle status, evidence index, and handoff can originate from different or stale runtime/source generations.

**Trigger.** Present individually valid ready-shaped inputs whose runtime IDs/source fingerprints/campaigns differ, or a stale upstreamLastSuccessAt.

**Expected behavior.** One observation must cryptographically bind exact source/release/upstream lock, runtime/process identities, data generation/currentness, response receipts, diagnostics manifest, lifecycle evidence, evidence-index sequence, and parent campaign.

**Current behavior.** The sample and result contain no fields capable of proving those relationships, and sampleIsReady does not compare them.

**Impact.** Mixed-generation or stale evidence can satisfy R07 readiness even when no coherent runtime state ever existed.

**Exact evidence.**
- `packages/bootstrap/src/operations/paper-runtime-evidence.ts` `L406-L439` `d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d`: Samples retain status labels, paths, a count, and optional upstream time/blockers but omit diagnostics manifest hash, runtime IDs, source fingerprints, campaign sequence, exact evidence entry identity, and response receipts.
- `packages/bootstrap/src/operations/paper-runtime-evidence.ts` `L455-L468` `d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d`: The promotion predicate checks labels and mere presence of upstreamLastSuccessAt; it does not validate freshness or cross-artifact identity.
- `packages/bootstrap/src/operations/paper-runtime-evidence.ts` `L471-L519` `d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d`: The result has no semantic/content hash, parent campaign manifest fingerprint, or exact artifact digest set.
- The sample interface has no runtimeId/sourceFingerprint/manifestSha256/campaignFingerprint fields.
- upstreamLastSuccessAt is checked only for defined, not bounded relative to sample time.
- The diagnostics result manifestSha256 is discarded by buildObservationSample.

**Reproduction status.** `STATIC_CONTRACT_AND_PROMOTION_TRACE_CONFIRMED`

**Root cause.** R07 promotion reduces rich source artifacts to unbound status labels and paths before acceptance.

**Minimal fix boundary.** Introduce an immutable observation receipt with hashes and generation IDs for every component; validate all joins, freshness, and parent campaign fingerprint before promotion; include the receipt digest in the result and parent terminal protocol.

**Required tests.** Mixed runtime IDs; mixed source fingerprints; stale/future lastSuccessAt; diagnostics path with different hash; lifecycle/handoff generation mismatch; evidence-index sequence mismatch; campaign-manifest mismatch.

**Regression risks.** Adding binding fields changes evidence schemas; retain explicit versioning and migration/rejection for historical evidence.

**Secondary sectors:** R01, R03, R04, R05, R06, R11, R12
**Inherited aliases/dependencies:** BWS116-R01-003, BWS116-R01-004, BWS116-R01-010, BWS118-R05-007, BWS118-R05-008, BWS118-R06-007, BWS118-R06-008
**Explicitly unchanged:** Upstream semantic correctness remains R01-owned; process lifecycle correctness remains R06-owned; report economics remain R04-owned
**Blocks:** release=true, BWS-600=true, BWS-710=false, deployment=true.

### BWS120-R07-011 — Observation duration is governed by wall-clock strings and can be unbounded or prematurely complete after clock changes

**Severity:** P2
**Confidence:** HIGH
**Primary source:** `packages/bootstrap/src/operations/paper-runtime-evidence.ts` `L289-L322`
**SHA-256:** `d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d`

**Preconditions.** The system clock regresses/freezes, jumps forward, or the injectable now function returns non-advancing valid timestamps.

**Trigger.** Run a never-ready observation with constant or decreasing timestamps.

**Expected behavior.** Max duration must use a monotonic clock/deadline and bounded cancellation, while UTC timestamps are recorded only as evidence.

**Current behavior.** The elapsed calculation may never reach maxDurationMs after a backward/frozen clock, or may terminate early after a forward jump.

**Impact.** Runtime evidence collection can hang beyond its budget or produce a truncated window unrelated to the configured duration.

**Exact evidence.**
- `packages/bootstrap/src/operations/paper-runtime-evidence.ts` `L289-L322` `d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d`: The deadline is Date.parse(now()) minus Date.parse(startedAt); no monotonic deadline or independent maximum-iteration guard exists.
- The loop has no attempt/sample cap and evaluates duration solely from Date.parse(cycleGeneratedAt).
- The now function is injectable, making the non-advancing case directly representable.

**Reproduction status.** `STATIC_BOUNDEDNESS_DEFECT_CONFIRMED; DYNAMIC_LONG_WAIT_NOT_RUN`

**Root cause.** Wall-clock evidence time is also used as the control-plane deadline.

**Minimal fix boundary.** Use performance.now/process.hrtime or an injected monotonic clock plus AbortSignal; retain bounded wall-clock skew checks separately.

**Required tests.** Frozen time; backward jump; forward jump; abort during sleep/collection; maximum sample/iteration guard.

**Regression risks.** Monotonic and UTC clocks must be sampled together without falsely rejecting legitimate NTP adjustment.

**Secondary sectors:** R06, R10, R11
**Inherited aliases/dependencies:** none
**Explicitly unchanged:** UTC generatedAt fields; configured interval and duration values; sample content semantics
**Blocks:** release=true, BWS-600=true, BWS-710=false, deployment=true.

### BWS120-R07-012 — Diagnostics, runtime-evidence, and handoff outputs bypass the canonical evidence index and publication transaction

**Severity:** P1
**Confidence:** HIGH
**Primary source:** `packages/bootstrap/src/operations/paper-runtime-evidence.ts` `L375-L404`
**SHA-256:** `d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d`

**Preconditions.** R07 produces the core artifacts used for diagnostics, runtime readiness, or downstream handoff.

**Trigger.** Complete any diagnostics collection, paper runtime evidence run, or handoff creation.

**Expected behavior.** Every acceptance-relevant artifact set must be published once through the canonical index with exact hashes, dependencies, retention class, campaign/runtime generation, and an atomic completion receipt.

**Current behavior.** These artifacts are written independently. The index may know none of them, runtime-evidence output can replace an existing path, and no shared receipt proves the set completed together.

**Impact.** Retention, discovery, latest/current selection, downstream handoff, and post-crash reconciliation cannot prove the exact evidence set used for acceptance.

**Exact evidence.**
- `packages/bootstrap/src/operations/observability.ts` `L530-L592` `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`: Diagnostics writes four files and renames a directory but does not register the bundle in the evidence index.
- `packages/bootstrap/src/operations/paper-runtime-evidence.ts` `L375-L404` `d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d`: Runtime evidence atomically renames to a caller path, replacing any existing file, and never registers it.
- `packages/bootstrap/src/operations/paper-runtime-handoff.ts` `L104-L196` `6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f`: Handoff and source archive are written outside a shared evidence publication receipt and are not registered.
- `packages/bootstrap/src/operations/external-runtime-preflight.ts` `L414-L425` `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427`: The external campaign manifest demonstrates the intended registration path, but only for repo-local preflight output.
- No registerBwsEvidenceArtifact call exists in the three producer paths.
- The runtime evidence writer uses renameSync over the destination without an exists/refuse policy.

**Reproduction status.** `STATIC_PUBLICATION_TRACE_CONFIRMED`

**Root cause.** Core evidence producers implement file creation but not the repository’s declared evidence publication lifecycle.

**Minimal fix boundary.** Create one R07 evidence-set transaction that stages immutable files, computes hashes, records dependency edges, appends one committed index receipt, and advances latest only after full verification. Refuse accidental overwrite.

**Required tests.** Each producer indexed exactly once; same-output collision; crash before/after each staged file; index append failure; restart reconciliation; retention reference graph.

**Regression risks.** Changing paths can break operator tools; preserve stable aliases as verified pointers to immutable versioned artifacts.

**Secondary sectors:** R03, R08, R11, R12
**Inherited aliases/dependencies:** none
**Explicitly unchanged:** Artifact payload schemas where otherwise valid; external preflight semantic validation; source archive bytes
**Blocks:** release=true, BWS-600=true, BWS-710=false, deployment=true.

### BWS120-R07-013 — Runtime handoff can combine a lifecycle snapshot with a different source-tree generation

**Severity:** P1
**Confidence:** HIGH
**Primary source:** `packages/bootstrap/src/operations/paper-runtime-handoff.ts` `L104-L223`
**SHA-256:** `6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f`

**Preconditions.** Repository bytes or generated runtime entrypoints change between lifecycle status capture and source archive completion.

**Trigger.** Mutate a tracked/source file through an authorized competing process during the handoff window, or inject an archive creator that captures different bytes.

**Expected behavior.** A handoff must pin one immutable source/build generation before status inspection, prove the running process uses it, archive exactly it, and compare the resulting digest before publication.

**Current behavior.** The lifecycle snapshot and source archive are sequential observations of mutable state with no lock, tree fingerprint pre/post comparison, or process-executable digest join.

**Impact.** Downstream consumers can receive an internally valid handoff whose process evidence and packaged source describe different generations.

**Exact evidence.**
- `packages/bootstrap/src/operations/paper-runtime-handoff.ts` `L104-L147` `6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f`: Lifecycle status and source fingerprints are captured before source archive creation.
- `packages/bootstrap/src/operations/paper-runtime-handoff.ts` `L198-L223` `6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f`: The archive is created from the current mutable repository tree after the status snapshot; only archive bytes are hashed.
- `packages/bootstrap/src/operations/paper-runtime-handoff.ts` `L148-L184` `6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f`: The earlier lifecycle sourceFingerprints and later archive record are combined without proving they describe the same tree/build/process generation.
- The code provides an injectable createSourceHandoffArchive after status capture, making the TOCTOU boundary explicit.
- archive.sha256 proves only the produced archive, not equality to lifecycleStatus.sourceFingerprints.

**Reproduction status.** `STATIC_TOCTOU_CONFIRMED; MUTATION_HARNESS_NOT_RUN`

**Root cause.** Source packaging is not performed from a frozen source authority bound to the running process receipt.

**Minimal fix boundary.** Acquire/verify an immutable source generation receipt, capture lifecycle status against it, package from that exact generation, compare pre/post source fingerprints, and fail closed on drift.

**Required tests.** Mutation between status/archive; generated dist drift; source-manifest/tree mismatch; process executable digest mismatch; unchanged happy path.

**Regression risks.** Freezing source must not stop or restart active services during review/acceptance; use immutable release bytes or read locks.

**Secondary sectors:** R06, R09, R10, R11, R12
**Inherited aliases/dependencies:** BWS118-R06-003
**Explicitly unchanged:** Archive hash/size validation; closed provider/execution policy; handoff JSON field names
**Blocks:** release=true, BWS-600=true, BWS-710=false, deployment=true.

### BWS120-R07-014 — Versioned handoff and latest pointer publish as two independent writes with no crash recovery or digest link

**Severity:** P1
**Confidence:** HIGH
**Primary source:** `packages/bootstrap/src/operations/paper-runtime-handoff.ts` `L186-L195; L290-L312`
**SHA-256:** `6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f`

**Preconditions.** A crash, disk-full condition, permission error, or concurrent publisher occurs after the versioned handoff is renamed but before latest.json commits.

**Trigger.** Interrupt publication between the two calls.

**Expected behavior.** Publish a versioned immutable handoff and its latest pointer under one recoverable transaction; latest must reference the exact version/hash and advance monotonically.

**Current behavior.** The versioned handoff may exist while latest remains stale. Downstream readers have no authoritative way to distinguish an incomplete publication from a historical version.

**Impact.** Consumers can miss the newest accepted handoff or use an older one; retries can create divergent files and pointers.

**Exact evidence.**
- `packages/bootstrap/src/operations/paper-runtime-handoff.ts` `L186-L195` `6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f`: The versioned file is committed first and latest.json second.
- `packages/bootstrap/src/operations/paper-runtime-handoff.ts` `L290-L312` `6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f`: Each single file is temp+rename atomic, but the pair has no transaction, manifest, predecessor, checksum pointer, or recovery scan.
- The two calls are adjacent but independent.
- No startup/read path reconciles latest.json against versioned handoffs.

**Reproduction status.** `STATIC_CRASH_WINDOW_CONFIRMED; POWER_LOSS_FSYNC_BEHAVIOR_NOT_TESTED`

**Root cause.** Per-file atomic rename is incorrectly treated as multi-file publication atomicity.

**Minimal fix boundary.** Add a handoff manifest/commit marker with version path+SHA, atomic compare-and-set latest pointer, and startup recovery. Preserve BWS118-R06-016 as the separate inherited filename-collision root.

**Required tests.** Crash after version write; crash during latest write; concurrent publishers; latest hash mismatch; recovery selects highest committed sequence.

**Regression risks.** Recovery must not promote an uncommitted version merely because its filename sorts last.

**Secondary sectors:** R03, R06, R11, R12
**Inherited aliases/dependencies:** BWS118-R06-016
**Explicitly unchanged:** Timestamp-collision root remains inherited; source archive content verification; valid single handoff schema
**Blocks:** release=true, BWS-600=true, BWS-710=false, deployment=true.

### BWS120-R07-015 — The selected BWS-600 controller never consumes or verifies the accepted external campaign manifest

**Severity:** P1
**Confidence:** HIGH
**Primary source:** `run-paper-autopilot.sh` `L15-L30; L842-L872`
**SHA-256:** `fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661`

**Preconditions.** An operator invokes run-paper-autopilot.sh with otherwise valid environment/preflight conditions.

**Trigger.** Start the selected controller without supplying an accepted bws.external_runtime_campaign.v1 file, or with environment values that differ from a previously generated manifest.

**Expected behavior.** Controller admission must require one exact accepted campaign manifest, verify schema/hash/semantic fingerprint/currentness, and bind release, source, lock, API input, database, storage, schedule, and evidence paths before any child starts.

**Current behavior.** The controller never reads the manifest. It derives a run identity from its own artifacts directory and launches runtime evidence directly.

**Impact.** BWS-600 can start outside the operator-approved release/input/database/storage/schedule authority even though documentation and preflight claim the manifest is mandatory.

**Exact evidence.**
- `packages/bootstrap/src/operations/external-runtime-preflight.ts` `L248-L432` `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427`: The preflight creates a strongly described campaign manifest and semantic fingerprint.
- `docs/041_external_runtime_preflight_and_bws600_campaign.md` `L53-L68` `2b660f97040f6893f0110172a0f3e5ebe0b6e25f64f0e8ea4daf8ab310242620`: Binding authority says BWS-600 starts only after an accepted campaign manifest and retains continuous evidence for that approved input.
- `run-paper-autopilot.sh` `L15-L30; L842-L872` `fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661`: The selected controller has no manifest argument, schema/fingerprint verification, or selected-input binding before launching the child.
- `run-paper-evaluation.sh` `L845-L919` `d7d821119d51c3dd5bbcf7a80f0e98488ebd38f7d771310265939a918505e667`: The runtime campaign ID is assigned from AUTOMATION_PARENT_RUN_ID, not from a verified external campaign manifest.
- Repository-wide executable search found the campaign schema only in the producer, final-local-acceptance, schema/tests/validators, not in run-paper-autopilot.sh or run-paper-evaluation.sh.
- The bounded source probe confirmed no external-runtime-campaign reference exists in the selected parent controller.

**Reproduction status.** `STATIC_ADMISSION_TRACE_CONFIRMED`

**Root cause.** The BWS-593 handoff is produced but not made an executable prerequisite of BWS-600.

**Minimal fix boundary.** Add an explicit manifest argument/environment selector, verify exact content/hash and all bound authorities before lock/run-dir/child creation, and propagate its semantic fingerprint through every child/result/evidence receipt.

**Required tests.** Missing manifest; tampered manifest; stale manifest; release/lock/input/database/schedule mismatch; manifest fingerprint propagation; no side effects before failure.

**Regression risks.** Admission ordering must remain fail-closed before creating mutable campaign state.

**Secondary sectors:** R01, R03, R06, R09, R10, R11, R12
**Inherited aliases/dependencies:** none
**Explicitly unchanged:** Preflight producer validation; BWS-600 closed execution policy; current external blockers
**Blocks:** release=true, BWS-600=true, BWS-710=false, deployment=true.

### BWS120-R07-016 — Paper-autopilot completion trusts a child status label and exit code without an evidence receipt

**Severity:** P1
**Confidence:** HIGH
**Primary source:** `run-paper-autopilot.sh` `L906-L975; L1196-L1205`
**SHA-256:** `fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661`

**Preconditions.** The child publishes a syntactically valid terminal side channel with the ready label and exits zero.

**Trigger.** Delete, mutate, replace, or disconnect the runtime evidence artifact before the parent consumes the child result; alternatively publish a valid label without an evidence digest.

**Expected behavior.** Parent completion must verify a typed child receipt binding exact campaign manifest, source/data/process generation, evidence result path+hash, observation continuity result, and terminal status before promotion.

**Current behavior.** The parent checks status and exit code only. Its summary records labels and a run directory but no exact evidence artifact identity.

**Impact.** A validly owned child process can produce false parent completion when the underlying evidence is missing, stale, tampered, or unrelated.

**Exact evidence.**
- `.automation/lib/controller_hardening_v2.sh` `L439-L612` `d67e2780d7968e5f25b0c7735486b140aa186708bbddda1b3d90cbb5f21f19a1`: The authenticated child result carries process/lock identity, status, reason, exit, cycles, and run directory but no runtime-evidence path, hash, campaign fingerprint, source/data generation, or acceptance receipt.
- `run-paper-evaluation.sh` `L845-L933` `d7d821119d51c3dd5bbcf7a80f0e98488ebd38f7d771310265939a918505e667`: The child parses evidence labels into shell variables; artifact paths remain only in its human-readable final summary.
- `run-paper-autopilot.sh` `L906-L933` `fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661`: The parent validates the side-channel identity and copies only label fields.
- `run-paper-autopilot.sh` `L942-L975; L1196-L1205` `fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661`: The parent marks ready from status+rc and writes an unhashed key/value summary without the exact evidence receipt.
- The side-channel schema contains no evidence fields.
- The parent case at L1196-L1205 has no artifact read/hash verification.
- The parent summary is plain text and not content-addressed.

**Reproduction status.** `STATIC_PARENT_CHILD_PROTOCOL_TRACE_CONFIRMED`

**Root cause.** Process ownership authentication is mistaken for semantic evidence authentication.

**Minimal fix boundary.** Version the child result protocol to include an immutable evidence receipt and campaign fingerprint; verify it atomically before parent state advancement and include it in a signed/hashed parent completion artifact.

**Required tests.** Evidence deleted after child exit; evidence tampered after child exit; wrong campaign fingerprint; wrong source/runtime generation; status/exit mismatch; parent restart before promotion.

**Regression risks.** Protocol changes affect other autonomous parents; preserve controller-specific validation and reject legacy ready results for BWS-600.

**Secondary sectors:** R06, R11, R12
**Inherited aliases/dependencies:** BWS118-R06-015
**Explicitly unchanged:** Existing PID/boot/start-tick ownership checks; lock release fields; source-before/after mutation check
**Blocks:** release=true, BWS-600=true, BWS-710=false, deployment=true.

### BWS120-R07-017 — Final-local runtime acceptance validates labels and file existence rather than cryptographic evidence relationships

**Severity:** P1
**Confidence:** HIGH
**Primary source:** `packages/bootstrap/src/operations/final-local-acceptance.ts` `L411-L531`
**SHA-256:** `1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5`

**Preconditions.** A caller can construct a ready-shaped runtime-evidence JSON plus existing placeholder files and summary/capture text.

**Trigger.** Use arbitrary regular files for lifecycle/diagnostics/handoff, set expected labels in the runtime evidence and parent summary, and include PAPER_AUTOPILOT_ in the capture.

**Expected behavior.** Final acceptance must verify every referenced artifact schema/hash, source/runtime/campaign identity, chronological relationship, immutable index receipt, parent-child completion receipt, and external campaign fingerprint.

**Current behavior.** The exact placeholder construction is accepted by the focused test. The final semantic fingerprint hashes the parsed runtime document and absolute path strings, not the bytes/relationships of referenced files.

**Impact.** A fabricated or tampered evidence set can become a final local acceptance result despite lacking genuine lifecycle, diagnostics, handoff, or campaign proof.

**Exact evidence.**
- `packages/bootstrap/src/operations/final-local-acceptance.ts` `L411-L531` `1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5`: Acceptance checks final labels, last-sample status strings, path existence, a two-field parent summary, and a Telegram substring; it does not validate referenced artifact schemas/hashes/generation relationships.
- `packages/bootstrap/src/operations/final-local-acceptance.ts` `L942-L980` `1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5`: Runtime evidence is gated by top-level schema/status/mode and referenced evidence paths are only asserted to be regular files.
- `tests/bws-final-local-acceptance.test.ts` `L144-L182` `c2ca8b6bfb9fb49cc387c781844440de074932533cd97acddaa60679281c6b2d`: The production acceptance function is expected to accept lifecycle, diagnostics, and handoff files containing only {ok:true}.
- The source checks only regular-file existence for referenced evidence.
- The test’s three referenced files are each {ok:true} and acceptance succeeds.
- The Telegram check is a substring test.

**Reproduction status.** `STATIC_SOURCE_CONFIRMED; PRODUCTION_TEST_EXPLICITLY_REPRODUCES_FALSE_ACCEPTANCE_BOUNDARY`

**Root cause.** Final acceptance is a shape/label aggregator rather than a verifier of the evidence graph it claims to bind.

**Minimal fix boundary.** Require typed schema validation and SHA-256 for every reference, verify one coherent generation/campaign DAG, consume the canonical index receipt, validate parent/child terminal receipt, and hash all referenced bytes into the final manifest.

**Required tests.** Placeholder artifact rejection; tampered artifact; wrong schema/hash; cross-generation mix; stale parent summary; forged Telegram substring; external campaign mismatch; accepted happy path.

**Regression risks.** Tightening verification will invalidate historical synthetic fixtures; retain them as test-only non-acceptance inputs.

**Secondary sectors:** R03, R04, R06, R09, R11, R12
**Inherited aliases/dependencies:** none
**Explicitly unchanged:** BWS-900 remains parked; closed policy fields; recovery/backup mechanics outside this runtime acceptance function
**Blocks:** release=true, BWS-600=true, BWS-710=false, deployment=true.

### BWS120-R07-018 — B1 runtime acceptance trusts a caller-selected “accepted upstream” enum and arbitrary repeated hashes

**Severity:** P1
**Confidence:** HIGH
**Primary source:** `packages/bootstrap/src/operations/b1-runtime-evidence.ts` `L5-L17; L231-L365; L469-L480`
**SHA-256:** `80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8`

**Preconditions.** A caller supplies a locally constructed report/evidence object meeting numerical thresholds.

**Trigger.** Set inputSource to accepted_betting_win_b1_multi_venue_markets_v1 and supply identical 64-hex values as rerunRunHashes.

**Expected behavior.** BWS-710 acceptance must require an immutable accepted upstream resource receipt bound to exact API route/contract/commit/generation/page/data window, exact report artifacts, and deterministic rerun bytes.

**Current behavior.** The caller assertion is sufficient to bypass the fixture blocker and can return status=accepted with terminalCode=B1_OFFLINE_ACCEPTANCE_THRESHOLDS_MET. The decision still correctly keeps runtimeEvidence/executable false, but the acceptance label itself is unproven.

**Impact.** B1 schema declaration or local fixture data can be misrepresented as accepted runtime resource evidence, obscuring the current BWS-710 external block.

**Exact evidence.**
- `packages/bootstrap/src/operations/b1-runtime-evidence.ts` `L5-L17` `80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8`: The upstream authority is represented only by an inputSource string plus coverage values and rerun hash strings.
- `packages/bootstrap/src/operations/b1-runtime-evidence.ts` `L231-L255` `80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8`: Any non-fixture value equal to accepted_betting_win_b1_multi_venue_markets_v1 is delegated to offline threshold acceptance.
- `packages/bootstrap/src/operations/b1-runtime-evidence.ts` `L309-L365; L469-L480` `80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8`: Validation checks enum/shape/SHA syntax and equality of rerun hash strings, not upstream receipts or report bytes.
- `tests/b1-runtime-evidence.test.ts` `L262-L272` `aebe980faa9efd95c354aace00456a9f93b5952b0e2e29936189dd9d9a68b435`: Focused tests default to the accepted upstream enum and three identical arbitrary hashes without constructing an upstream resource receipt.
- The accepted input source has no receipt fields.
- run hashes are not re-derived from report files.
- The focused fixture encodes the unsupported authority as a normal default.

**Reproduction status.** `STATIC_CONTRACT_AND_TEST_TRACE_CONFIRMED`

**Root cause.** External authority is modeled as a caller-controlled enum instead of a verified resource receipt.

**Minimal fix boundary.** Replace the enum-only branch with a validated B1 upstream acceptance receipt and exact artifact/hash joins; keep deterministic fixtures permanently blocked from runtime acceptance.

**Required tests.** Forged accepted enum; arbitrary equal hashes; hash not matching report bytes; wrong contract/generation/page; stale data window; valid accepted receipt; fixture remains blocked.

**Regression risks.** Preserve offline falsification as a distinct non-runtime research result and keep execution/public signals disabled.

**Secondary sectors:** R01, R02, R04, R11
**Inherited aliases/dependencies:** none
**Explicitly unchanged:** Offline classifier mathematics; runtimeEvidence=false; executable=false; BWS-900 parked policy
**Blocks:** release=true, BWS-600=false, BWS-710=true, deployment=true.

### BWS120-R07-019 — Progress and log helpers select the lexically greatest controller prefix instead of the newest run

**Severity:** P2
**Confidence:** HIGH
**Primary source:** `check_progress.sh` `L27-L35`
**SHA-256:** `26bb85d1ff30c852af5370c158ff00c62b6e87a54a11f870983273b7a0cb6cdb`

**Preconditions.** Artifacts contains runs from more than one controller family.

**Trigger.** Create bugfix_autopilot_20990101T000000Z and paper_autopilot_20200101T000000Z directories, then invoke the helper without --run-dir.

**Expected behavior.** The default must select the greatest parsed UTC run timestamp, with deterministic tie handling and explicit controller filtering when needed.

**Current behavior.** Plain lexical ordering selects paper_autopilot_2020 because the p prefix sorts after b, even though bugfix_autopilot_2099 is newer.

**Impact.** Operators can inspect stale progress/logs, misdiagnose current campaign state, or act on the wrong controller output.

**Exact evidence.**
- `check_progress.sh` `L27-L35` `26bb85d1ff30c852af5370c158ff00c62b6e87a54a11f870983273b7a0cb6cdb`: All controller families are combined, then plain sort|tail selects by full path prefix before timestamp.
- `open_log.sh` `L42-L45` `3a9886b0439c468483142d77e22bcab874c14fb2dd50c5293d014727f0c7a7b1`: The same cross-family lexical selection is used for logs.
- `watch_progress.sh` `L1-L40` `dddaf227440e6b848f7a33d2b92aebc06ad729b35f8f87cb95a51750676144e8`: The watcher inherits check_progress selection behavior.
- The bounded offline filename probe reproduced the wrong selection.
- Both helper scripts contain the same expression.

**Reproduction status.** `REPRODUCED_OFFLINE_FILENAME_PROBE; STATIC_SOURCE_CONFIRMED`

**Root cause.** Run family and timestamp are encoded in one string and sorted as an undifferentiated path.

**Minimal fix boundary.** Parse controller family and timestamp explicitly, compare timestamp values, validate directory schema, and expose the selected family/time in output. Keep explicit --run-dir authoritative.

**Required tests.** Cross-family timestamps; same timestamp tie; malformed directory ignored; explicit --run-dir; no artifacts.

**Regression risks.** Changing default selection can surprise operators relying on prefix priority; document and test timestamp authority.

**Secondary sectors:** R10, R11, R12
**Inherited aliases/dependencies:** none
**Explicitly unchanged:** Per-run summary parsing; explicit runtime-log mode; cycle/round selection inside an already selected run
**Blocks:** release=false, BWS-600=false, BWS-710=false, deployment=true.

## Provider/runtime handoff conclusions

### BWS-600

The executable route is not yet a trustworthy evidence campaign. It lacks campaign-manifest admission, continuous-window semantics, coherent observation receipts, parent/child artifact binding, immutable publication, and final graph verification. The current external block must remain in force even after the local defects are fixed, because no accepted upstream runtime handoff or provider-to-PostgreSQL-to-API parity was supplied or contacted.

### BWS-710 / B1

The local B1 classifier correctly keeps execution and public signals disabled, but its input authority is a caller-controlled enum. It cannot distinguish an accepted upstream resource from a locally asserted object. BWS-710 remains externally blocked and locally false-accepting until an immutable upstream receipt is required.

### Evidence retention and currentness

The evidence index is an append-only JSONL catalog, not an immutable evidence store or currentness ledger. Its path targets can mutate, publication races, latest is append order, and retention classes have no apply lifecycle. R07 must define the semantic receipt; R03/R08/R12 should supply durable transaction, retention, and controller mechanics.

## Hypotheses and external/environment blockers

- **BWS120-R07-H01 — Filesystem rename durability across sudden power loss is not established.** Filesystem-specific fsync/crash testing of staged files and parent directories.
- **BWS120-R07-H02 — Concurrent structured-log rotation can lose or reorder segments.** Multi-process barrier test; keep separate from confirmed evidence-index publication race.
- **BWS120-R07-EXT-001 — Accepted betting-win API handoff and provider-to-PostgreSQL-to-API parity are absent.** BWS-600 remains externally blocked; no provider/service request was authorized or performed.
- **BWS120-R07-EXT-002 — Accepted betting-win.b1_multi_venue_markets.v1 runtime resource is absent.** BWS-710 remains blocked independently of the local enum-trust defect.
- **BWS120-R07-ENV-001 — Canonical Node 20.20.2 is unavailable.** Node 22.16.0 observations and static validators are supplementary only.
- **BWS120-R07-ENV-002 — Repository dependencies are not installed.** TypeScript no-emit check stopped at missing @types/node; no dependency installation was authorized.

## Intentional safeguards

- **BWS120-R07-S01** Runtime evidence enforces API mode and a closed provider/execution policy before observation.
- **BWS120-R07-S02** Runtime-evidence and handoff artifact paths under artifacts reject traversal and existing symlink segments.
- **BWS120-R07-S03** Source handoff archives are checked for exact path, size, and SHA-256.
- **BWS120-R07-S04** Parent/child result transport verifies process boot/start identity, canonical result location, exit code, lock release, and source mutation.
- **BWS120-R07-S05** B1 decisions keep runtimeEvidence=false, executable=false, public signals forbidden, and BWS-900 parked.
- **BWS120-R07-S06** External-runtime preflight validates release, upstream lock, migration, backup/restore, soak, storage, and closed policy before producing its manifest.

## Rejected suspicions and inherited manifestations

- **BWS120-R07-RS01 — Historical BWS-580 constants in the runtime handoff are not treated as current routing authority.** The handoff explicitly identifies nextGate=BWS-600; current task authority remains in mutable status docs. No independent R07 defect was assigned.
- **BWS120-R07-RS02 — Millisecond handoff/evidence filename collision.** Already owned by BWS118-R06-016; R07 records only the multi-file publication defect.
- **BWS120-R07-RS03 — Unexpected pass failure without terminal service evidence.** Already owned by BWS118-R06-015.
- **BWS120-R07-RS04 — Local runtime evidence enables live betting.** Execution, provider connections, public signals, and BWS-900 remain explicitly disabled/parked.
- **BWS120-R07-RS05 — BWS120 changed executable behavior relative to BWS118.** Byte comparison found 38 documentation additions, two documentation edits, and zero non-documentation differences.

## Cross-area handoffs

- **BWS120-R07-X01 → R01:** Exact upstream response bytes, route/query/contract/page receipt and source/receive/currentness semantics remain R01-owned. R07 must consume their receipts.
- **BWS120-R07-X02 → R03:** Durable publication lock/CAS and crash recovery mechanics for the evidence index require R03 transaction expertise; R07 owns evidence semantics.
- **BWS120-R07-X03 → R04:** Economic/report lifecycle truth remains R04-owned; R07 must bind the exact accepted report artifact rather than reinterpret it.
- **BWS120-R07-X04 → R05:** Cockpit/API stale and incoherent read-model state remains R05-owned; R07 must reject stale/unbound projections as acceptance inputs.
- **BWS120-R07-X05 → R06:** Process generation, stale health/readiness, shutdown, filename collision, and unexpected-pass terminal evidence remain R06-owned.
- **BWS120-R07-X06 → R08:** Generic retention planning/apply, backup/restore references, and deletion recovery belong to R08; R07 defines accepted evidence references.
- **BWS120-R07-X07 → R10:** Repository-wide environment/path/secret/wrapper policy must close log path and redaction defects consistently.
- **BWS120-R07-X08 → R11:** Focused tests and static validators pass while the confirmed false-evidence paths remain; R11 owns aggregate false-green assurance.
- **BWS120-R07-X09 → R12:** Controller result schema, campaign locks, artifact lifecycle, cleanup, and parent finalization must consume R07 evidence receipts.

## Test and validator truth

Six relevant static validators and all shell syntax checks passed. Those passes do not refute the findings: they primarily inspect markers, files, or declared contracts and do not exercise adversarial evidence publication/currentness or the production acceptance graph. TypeScript execution was unavailable because canonical Node 20.20.2 and repository dependencies were absent; no dependencies were installed.

- **BWS120-R07-TG-01** No absolute/traversal/symlink observability log-path confinement test.
- **BWS120-R07-TG-02** No Authorization/Cookie/apiKey/nested-header/value-shaped secret redaction test.
- **BWS120-R07-TG-03** No multi-process evidence-index duplicate/latest publication race test.
- **BWS120-R07-TG-04** No post-registration artifact mutation/deletion revalidation test.
- **BWS120-R07-TG-05** No out-of-order/backdated/future evidence-currentness test.
- **BWS120-R07-TG-06** No real HTTP non-2xx/redirect/content-type/schema diagnostics probe test.
- **BWS120-R07-TG-07** No assertion that synthesized metrics are labeled and cannot satisfy readiness.
- **BWS120-R07-TG-08** No reference-aware retention plan/apply/interruption test.
- **BWS120-R07-TG-09** No full-duration continuity test; current success test accepts one sample.
- **BWS120-R07-TG-10** No mixed source/runtime/data/campaign generation runtime-evidence test.
- **BWS120-R07-TG-11** No frozen/backward/forward clock deadline test.
- **BWS120-R07-TG-12** No canonical evidence-index registration/recovery test for diagnostics, runtime evidence, and handoff outputs.
- **BWS120-R07-TG-13** No mutation-between-status-and-source-archive handoff test.
- **BWS120-R07-TG-14** No crash between versioned handoff and latest pointer test.
- **BWS120-R07-TG-15** No controller admission test requiring the exact accepted external campaign manifest.
- **BWS120-R07-TG-16** No child-evidence deletion/tampering test before parent completion.
- **BWS120-R07-TG-17** Final-local acceptance test positively accepts {ok:true} placeholder evidence files.
- **BWS120-R07-TG-18** B1 tests default to a caller asserted accepted input source with arbitrary equal hashes.
- **BWS120-R07-TG-19** No cross-controller timestamp selection test for progress/log helpers.

## Prioritized review-only remediation order

1. Close P0 filesystem confinement and secret-redaction defects before any managed runtime evidence is retained.
2. Define the immutable evidence receipt: content-addressed artifacts, exact source/data/process/campaign generation, monotonic sequence, and cryptographic dependency graph.
3. Make evidence index publication serialized, crash-recoverable, immutable, and reference-aware.
4. Make BWS-600 controller admission consume one exact accepted external campaign manifest before side effects.
5. Replace first/latest-sample readiness with explicit continuous-window policy using monotonic deadlines.
6. Version parent/child terminal results to carry the exact evidence receipt; verify it before parent completion.
7. Rebuild final-local acceptance as a verifier of referenced bytes and relationships, not labels and path existence.
8. Require a real accepted B1 upstream resource receipt; preserve the external BWS-710 hold.
9. Add reference-aware retention and correct operator latest-run selection.
10. Run focused adversarial tests and the complete canonical Node 20.20.2 gate; then re-review R07 and R11/R12 interactions.

## Explicit unchanged areas

- No source, tests, schemas, documentation, configuration, manifests, archive members, or repository state were modified.
- No implementation prompt, overlay, patch, server command, commit, branch operation, or dependency installation was produced.
- No provider, external API, RPC, account, credential, database, deployed service, wallet, signer, or financial operation was contacted.
- Upstream contract/provenance semantics remain R01-owned; persistence mechanics R03-owned; report/economic lifecycle R04-owned; API/cockpit projection R05-owned; generic process lifecycle R06-owned; database retention/recovery R08-owned; environment/path policy R10-owned; aggregate assurance R11-owned; controller/artifact lifecycle R12-owned.
- All 85 inherited confirmed findings retain their original IDs. R06-015 and R06-016 were consumed as dependencies and not duplicated.

## Validation limitations

- Node 20.20.2 was unavailable. Node 22.16.0 and Python/static observations are supplementary only.
- Repository dependencies were absent; TypeScript no-emit stopped at missing Node type declarations.
- No real service, database, long-duration campaign, provider, or upstream API was run. Concurrency/crash/soak effects are marked according to the evidence actually obtained.
- The archive itself, complete coverage table, compatibility comparison, validators, static probes, and final mutation reconciliation are recorded in the validation JSON.

Generated: `2026-09-12T04:19:29Z`
