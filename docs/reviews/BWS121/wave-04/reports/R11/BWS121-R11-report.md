# BWS121-R11 deep review: tests, validators, fixtures, generated output, build graph, and false-green assurance
## Executive verdict
```text
review_id=BWS121-R11
repository=betting-win-surebet
archive_sha256=025936d21db89ac5cf4881863f05ec9ed5ddaaa2b4adfe60e766207fc4c9b9f7
regular_files=733
archive_path_and_type_safety=PASS
extraction_integrity=PASS
executable_compatibility_with_BWS120=PASS_EXACT_NON_DOCUMENTATION_BYTE_EQUIVALENCE
canonical_runtime=Node_20.20.2
actual_runtime=v22.16.0_SUPPLEMENTARY
static_validators_passed=24
static_validators_failed=1_SOURCE_MANIFEST_STALE
confirmed_findings=10
P1=10
inherited_findings_checked=137
duplicated_inherited_root_causes=0
overall_verdict=BLOCKED_ASSURANCE_AND_DEFECT_CLOSURE_REQUIRED
```
BWS121 is structurally safe and preserves the exact BWS120 executable lineage. The new archive adds 38 Wave 03 review files and edits two documentation indexes; no executable source, test, script, migration, schema, package, configuration, or fixture bytes changed. R11 therefore reviews the same application implementation that produced the 137 inherited R01-R09 findings.
The assurance system is not release-authoritative. The current full gate is already blocked because SOURCE_MANIFEST.json is stale. Separately, eight bounded mutation groups prove that several validators can print success after the invariant they claim to validate is removed, enabled, moved outside scan roots, or hidden through trivial lexical composition. Ten R11-owned P1 root causes are confirmed. None duplicates an inherited application defect.
## Source authority and method
- Reviewed archive: `/mnt/data/betting-win-surebet121(2).zip`
- Actual SHA-256: `025936d21db89ac5cf4881863f05ec9ed5ddaaa2b4adfe60e766207fc4c9b9f7`
- Archive size: `3954499` bytes
- Handoff: `/mnt/data/betting-win-surebet-wave03-next-review-handoff-r01-r09-rebased-d4565c05-20260912(2).md` (`9456766dd3583bdfe33948954c7a9ee287e1d9f47f83cbd073de9f35c2138ea0`)
- Comparison baseline: `betting-win-surebet120(2).zip` (`d4565c05ecfe63f5d5511f224a20ff20fb82bfc75b23203c94d7d3e98a8c21bb`), 695 files
- Package: `betting-win-surebet@0.1.0-bws-full-platform`
- Canonical runtime: Node 20.20.2; available runtime: Node 22.16.0, supplementary only
- Method: ZIP inventory, exact byte/mode extraction reconciliation, BWS120 comparison, build/test/validator graph reconstruction, 137-finding overlap check, 723-test matrix reconciliation, static call/path tracing, 25 bounded static validator executions, and eight disposable mutation-harness groups
No network, provider, account, credential, persistent database, service, controller, signer, or live operation was used.
## Archive and executable compatibility
- Regular files: 733; directory entries: 0; duplicate paths: 0; unsafe paths: 0; symlinks: 0; special entries: 0.
- Extraction: all 733 path, byte, size, and mode tuples match the ZIP.
- BWS120 comparison: 38 additions, 2 edits, 0 removals. Every difference is documentation-only.
- Executable compatibility verdict: exact.
- Source tree pre-review digest: `9449965fd85cb58d788a1e87f7d0c0599599e89893cbe8121bd53632eafd7fa1` using `sha256(path\0size\0sha256\0mode\n)`.
- Source tree post-review digest: `9449965fd85cb58d788a1e87f7d0c0599599e89893cbe8121bd53632eafd7fa1`; exact pre/post reconciliation: pass.
## R11 assurance architecture
The root validation graph is:

```text
validate
  -> validate:starter
     -> typecheck
     -> test
        -> clean -> TypeScript build -> upstream lock generate/verify -> 104 serial Node tests
     -> validate:web
     -> validate:repo
     -> validate:boundary
        -> contract boundary -> no-provider -> no-execution -> fixture integrity
     -> validate:ops
        -> operational/static validators -> source manifest -> program/status validators
        -> upstream boundary build/lock -> API-only -> B1 static validators
     -> validate:loopback-acceptance
```
Inventory conclusions:
- 350 TypeScript/TSX source and test files under apps, packages, src, and tests.
- 104 top-level Node test files.
- 25 Python validators plus one MJS loopback validator.
- 21 bootstrap CLI modules. A conservative textual map found direct test references for 19; `bws-database-lifecycle.ts` and `bws-upstream-api-convergence.ts` have no direct test reference.
- 17 fixture files. The fixture-integrity validator models only five reserved/placeholder files and ignores twelve substantive fixtures.
- No committed `dist`, `node_modules`, coverage, or runtime artifact output. The build cleans `dist` before emit.
- `SOURCE_MANIFEST.json` is the main committed generated source proof and is currently stale.
## Validator execution and false-green analysis
Twenty-four of twenty-five Python validators returned success against the unmodified extraction. `validate_source_manifest.py` correctly failed. These individual passes are not equivalent to a full aggregate acceptance pass, which was unavailable and would be blocked by the manifest.

| Mutation group | Claimed invariant removed or bypassed | Validator result |
|---|---|---|
| `HARNESS-RUNTIME-PIN` | PATH exposes only fake node v20.0.0 while .nvmrc is 20.20.2 | rc=0 |
| `HARNESS-UPSTREAM-MARKERS` | deleted production upstream-lock implementation; kept required tokens only in comments in compatibility shim | rc=0 |
| `HARNESS-API-ONLY-CALL` | commented out API-only process-enforcement call while retaining marker in import/comment | rc=0 |
| `HARNESS-B1-CAPABILITY` | changed B1 decision contract and values to runtimeEvidence/executable/publicSignals enabled; retained old required tokens only in comments | rc=0 |
| `HARNESS-PROGRAM-SELF-ATTEST` | deleted packages/bootstrap/src, packages/persistence/src, packages/upstream/src, and src | rc=0, rc=0 |
| `HARNESS-BOUNDARY-SCOPE` | added provider URL and execution identifier to active root controller plus cross-schema DDL to database migration | rc=0, rc=0, rc=0 |
| `HARNESS-BOUNDARY-LEXICAL` | constructed provider URL and execution identifier from fragments inside scanned cli.js | rc=0, rc=0 |
| `HARNESS-FIXTURE-SCOPE` | replaced three substantive accepted/valid fixture files with invalid JSON | rc=0 |

The pass pattern explains why historical validators could coexist with 137 source defects: several gates validate tokens, paths, titles, status rows, or small allowlists rather than production behavior. Hard-coded scan roots leave active paths unseen. No aggregate gate consumes the integrated issue and test matrix. Canonical Node, PostgreSQL, loopback, and accepted-upstream dynamic proof were unavailable.
## Inherited overlap
All 137 stable confirmed findings were loaded from the Wave 03 cumulative ledger and checked by root cause, path, and correction boundary. R11 does not reissue upstream-lock, strategy, persistence, simulation, API, lifecycle, evidence, backup, or release defects. It records dependencies where a weak validator fails to detect one of those roots. `duplicated_inherited_root_causes=0`.
## Confirmed findings
| ID | Severity | Title | Release | BWS-600 | B1 |
|---|---:|---|---:|---:|---:|
| `BWS121-R11-001` | P1 | Source manifest omits 115 current paths and carries eight stale file records | yes | yes | yes |
| `BWS121-R11-002` | P1 | Canonical Node 20.20.2 enforcement accepts any Node 20 minor as NODE_OK | yes | yes | yes |
| `BWS121-R11-003` | P1 | Upstream contract static validator proves comment markers in a shim instead of the production implementation | yes | yes | yes |
| `BWS121-R11-004` | P1 | API-only validator accepts a named import or comment after the enforcement call is removed | yes | yes | yes |
| `BWS121-R11-005` | P1 | B1 acceptance validator treats status rows, test titles, and literal tokens as executable capability proof | yes | yes | yes |
| `BWS121-R11-006` | P1 | Implementation-program validators can declare completion with the principal implementation trees absent | yes | yes | yes |
| `BWS121-R11-007` | P1 | Boundary validators omit active root executables, commands, scripts, and database migrations from their scan authority | yes | yes | yes |
| `BWS121-R11-008` | P1 | Regex boundary checks are bypassed by trivial source-level string or identifier composition inside scanned files | yes | yes | yes |
| `BWS121-R11-009` | P1 | Fixture-integrity gate ignores all twelve substantive strategy and runtime fixture files | yes | yes | yes |
| `BWS121-R11-010` | P1 | Aggregate validation has no machine-enforced closure from 137 inherited findings to 723 required tests and production entrypoints | yes | yes | yes |

### BWS121-R11-001: Source manifest omits 115 current paths and carries eight stale file records
**Severity:** P1
**Confidence:** HIGH
**Primary owner:** R11
**Preconditions:** The current BWS121 tree is evaluated as the source/archive authority.

**Trigger:** Run scripts/validate_source_manifest.py or compare SOURCE_MANIFEST.json with the 732 included non-self files.

**Expected:** The manifest must contain exactly every included current path once, with exact byte size and SHA-256, while intentionally excluding only declared runtime/generated paths.

**Current:** The manifest has 617 entries. It omits 38 Wave 01 files, 38 Wave 02 files, 38 Wave 03 files, and docs/reviews/README.md. Eight existing entries have stale size or hash values: the seven inherited Graphify/update-tooling paths plus docs/000_documentation_index.md.

**Impact:** Source identity and archive provenance are not exact. validate:ops fails at the source-manifest step, and release/BWS-600 proof cannot bind the current tree.

**Exact source evidence:**
- `SOURCE_MANIFEST.json` `schema/generated/overlay/files` lines `1-9`, SHA-256 `d9ea618c19fac733cf070c7e9b811ace8a1a0d637680b0b9f8233be5879aba6a`. The manifest declares an August 26 overlay and begins a 617-entry inventory.
- `scripts/validate_source_manifest.py` `expected_entries / main` lines `50-68; 92-103; 134-145`, SHA-256 `2235e6c4276dc8dad2a0328e956d3622ec6bfbef0978843cdf35e81e58e956b5`. The validator derives an exact current path, size, and SHA-256 inventory and rejects any mismatch.
- `tests/validate-source-manifest.test.ts` `synthetic manifest fixtures` lines `48-108`, SHA-256 `194c8fe6f8f0226b3245af7d5f28e23c2b1c886b5658f30167823b0c74f3ab40`. The tests prove validator behavior on synthetic trees but do not keep the current repository manifest regenerated.

**Reproduction:** REPRODUCED. Expected non-self entries=732; manifest entries=617; missing=115; extra=0; mismatched=8. The repository validator exited 1 with SOURCE_MANIFEST.json is stale.

**Root cause:** The source manifest was not transactionally regenerated and verified after successive documentation overlays and tooling changes.

**Minimal fix boundary:** During an authorized implementation tranche, regenerate the manifest from the final intended tree, verify exact path/size/hash equality, bind its generated/overlay metadata to the archive publication transaction, and prohibit publishing a new archive when the manifest check fails.

**Required tests:**
- Current-tree manifest exact-match test, not only a synthetic fixture
- Overlay installation test that must update manifest or abort atomically
- Archive-to-extracted-tree-to-manifest three-way equality test
- Negative tests for omitted review documents and stale same-path bytes

**Dependencies and non-duplication:**
- KNOWN_BASELINE_MANIFEST_DRIFT is formally closed into this R11 finding; the seven inherited stale records are not reissued separately.
- BWS120-R09-003 owns release-manifest exact path-set closure; this finding owns the repository source manifest.

**Regression risks:**
- Regeneration must not include runtime locks, secrets, node_modules, dist, artifacts, or transient automation state.
- Documentation-only overlays must remain compatible with immutable executable lineage while updating current source proof.

### BWS121-R11-002: Canonical Node 20.20.2 enforcement accepts any Node 20 minor as NODE_OK
**Severity:** P1
**Confidence:** HIGH
**Primary owner:** R11
**Preconditions:** A Node 20 binary other than 20.20.2 appears first on PATH or in the fallback NVM directories.

**Trigger:** Source scripts/load-node-runtime.sh or use a root controller that inherits its NODE_OK result.

**Expected:** Canonical acceptance paths must select exactly 20.20.2 or explicitly classify another supported Node 20 runtime as noncanonical and non-accepting.

**Current:** The loader compares only the major version and emits NODE_OK for 20.0.0. The validator also passes because it does not exercise negative version cases.

**Impact:** Build, test, controller, and acceptance evidence can be labeled runtime-correct under a noncanonical Node release, weakening reproducibility and invalidating the exact Node acceptance requirement.

**Exact source evidence:**
- `.nvmrc` `canonical runtime pin` lines `1`, SHA-256 `75053fb82fe4512318dd99556daf58b862fb81c96cf1153249b75f8116edf440`. The repository pins 20.20.2.
- `package.json` `engines and validation scripts` lines `11-18; 27-32`, SHA-256 `b1b69ffa6d0b974c3b3ba55f3ec1acffb21e512c3a862e2a7b2d6b5139e5eac0`. The package supports Node major 20 and the validation graph relies on the runtime selected by the caller/loader.
- `scripts/load-node-runtime.sh` `_surebet_node_matches` lines `27-31; 41-53; 74-113`, SHA-256 `ea4bb9bef2995130f632d069dc3c3cbb5c6774047f420ab1a58f6335b3f87abe`. The loader reduces the pin to expected_major and accepts any matching major, including lexical fallback candidates.
- `scripts/validate_node_runtime_loader.py` `main` lines `44-70`, SHA-256 `0673fde5c9877eb064985feeefc0b1043bcf7c5dcefadd675f48bd3371443334`. The validator checks marker presence and prohibition of nvm sourcing, not exact-version rejection behavior.

**Reproduction:** REPRODUCED. The loader returned 0 and printed node_runtime_target=20.20.2, node_runtime_source=path, NODE_OK=v20.0.0.

**Root cause:** Runtime selection and runtime validation encode a major-version compatibility policy while current acceptance authority requires an exact canonical version.

**Minimal fix boundary:** Separate supported-runtime compatibility from canonical-acceptance authority. Require exact 20.20.2 for release/review/controller acceptance, emit a noncanonical status for other 20.x versions, and make downstream gates reject that status.

**Required tests:**
- PATH Node 20.0.0, 20.20.1, 20.20.2, and a future 20.x table test
- NVM fallback exact-versus-major test
- Controller rejects supported-but-noncanonical Node
- Validation receipt records exact node and npm bytes/versions

**Dependencies and non-duplication:**
- BWS120-R09-001 owns release-install compatibility promotion; R11 owns exact runtime-loader and validator enforcement.
- R10 retains environment/CLI precedence ownership.

**Regression risks:**
- Do not break explicitly supported development use on other Node 20 versions; classify it rather than silently treating it as canonical.
- Avoid sourcing or replacing the active shell/session.

### BWS121-R11-003: Upstream contract static validator proves comment markers in a shim instead of the production implementation
**Severity:** P1
**Confidence:** HIGH
**Primary owner:** R11
**Preconditions:** The compatibility shim retains the required marker text while the package implementation is missing or semantically changed.

**Trigger:** Run scripts/validate_betting_win_upstream_contract.py directly or through its static precheck.

**Expected:** The validator must inspect and behaviorally exercise the production implementation that generates and verifies the lock; comments and compatibility shims cannot satisfy executable invariants.

**Current:** The validator scans comment substrings in the six-line shim and never binds those markers to the package implementation.

**Impact:** The static upstream-contract check can report success while the executable lock implementation is absent or no longer performs the claimed Git operations. This can conceal regressions in a release-critical trust boundary.

**Exact source evidence:**
- `scripts/validate_betting_win_upstream_contract.py` `main` lines `170-184`, SHA-256 `931cd26b0530ee620ede9063a60fb75f3a5835f25860c8b2842f98950d283c54`. The validator reads src/upstream/betting-win-upstream-lock.ts and requires four substrings.
- `src/upstream/betting-win-upstream-lock.ts` `compatibility shim` lines `1-6`, SHA-256 `01fb9b916a76ce63729eab7426720573fc497c9f88cd296a467a9683ca58807d`. All four required substrings already exist only in comments; the executable statement is a re-export.
- `packages/upstream/src/upstream/betting-win-upstream-lock.ts` `production implementation` lines `8-34`, SHA-256 `8c0badbfc3dc776eb71e01e1a76280debab30c64739274b06d1ce7343382a6c2`. The production implementation is in a different file that this marker loop does not inspect.
- `tests/betting-win-upstream-contract.test.ts` `static validator wiring test` lines `137-155`, SHA-256 `97ce19a53408d95bc7cc48fb58497fe82b8716067e1cdae1a7aebae32ac1c06d`. The focused test asserts only that the static validator prints ok, creating a circular proof for this portion.

**Reproduction:** REPRODUCED. validate_betting_win_upstream_contract.py exited 0 and printed ok. This reproduces the static validator defect; the aggregate build may independently catch a missing module but not a compiling semantic regression.

**Root cause:** The static proof is based on unparsed substring presence at a compatibility path rather than the executable symbol/call graph or bounded production behavior.

**Minimal fix boundary:** Point the validator at the production package path, eliminate comment markers as proof, and add bounded tests through the exported generator/verifier using adversarial Git fixtures. Keep the shim only as a compatibility re-export.

**Required tests:**
- Comments containing all required markers must fail
- Production implementation missing must fail before build
- Compiling implementation that omits one Git operation must fail behaviorally
- Production export and compatibility shim resolve to the same tested functions

**Dependencies and non-duplication:**
- BWS116-R01-001 and BWS116-R01-002 remain the owners of lock algorithm/source-observation defects. This finding owns the false static proof.

**Regression risks:**
- Do not duplicate R01 lock-algorithm findings.
- Preserve offline disposable Git testing and no betting-win checkout mutation.

### BWS121-R11-004: API-only validator accepts a named import or comment after the enforcement call is removed
**Severity:** P1
**Confidence:** HIGH
**Primary owner:** R11
**Preconditions:** A CLI retains the import/name string but stops invoking the API-only environment enforcement before work begins.

**Trigger:** Run scripts/validate_api_only_upstream.py.

**Expected:** Every production CLI must prove that enforcement executes before parsing or performing work, and negative tests must invoke each entrypoint with retired/export selectors.

**Current:** Any occurrence of the function name is accepted. A dead import, comment, or unreachable branch passes.

**Impact:** A production entrypoint can accept retired selectors or ambient export-mode state while the API-only validator prints API_ONLY_UPSTREAM_CONTRACT_OK.

**Exact source evidence:**
- `scripts/validate_api_only_upstream.py` `CLI marker loop` lines `96-113`, SHA-256 `2600a915dd6d55cb67432c7ec2731d44794098d42310f5b6c7195c8d2e69f4f1`. Each production CLI passes when its text merely contains enforceBwsApiOnlyProcessEnvironment.
- `packages/bootstrap/src/cli/bws-upstream-api-convergence.ts` `runBwsUpstreamApiConvergenceCli` lines `1-12`, SHA-256 `271a0e0fbf3c733fc502f8accd0a2a2067c70ce6086147994bb993bba83f8f7f`. The actual safety property depends on the call at line 11, but the import at line 1 independently satisfies the substring check.
- `tests/api-only-upstream-contract.test.ts` `static validator tests` lines `15-19; 65-76`, SHA-256 `10fed128376e386dd0786dd06e4df1b06c712d96673f52a519c5aacdefb03a57`. Tests assert the validator exits 0 and contains selected paths; they do not remove the enforcement call from every CLI.

**Reproduction:** REPRODUCED. The source remained syntactically valid and validate_api_only_upstream.py exited 0.

**Root cause:** The validator proves lexical presence, not invocation, ordering, reachability, or fail-closed behavior.

**Minimal fix boundary:** Add direct production-entrypoint tests for every CLI with stale selectors, or use an AST/call-graph check that proves an unconditional pre-work call. The static script must not treat imports or comments as enforcement.

**Required tests:**
- Remove call but keep import negative case
- Move call after work negative case
- Place call in unreachable branch negative case
- Invoke all production CLIs with each retired selector
- Ensure help/status semantics remain intentionally defined

**Dependencies and non-duplication:**
- R01 owns API/export mode semantics and R06 owns CLI/service lifecycle. R11 owns whether tests and validators prove those semantics.

**Regression risks:**
- Entrypoint tests must remain inert and avoid provider, database, or service access.
- Do not move R01 configuration semantics into R11.

### BWS121-R11-005: B1 acceptance validator treats status rows, test titles, and literal tokens as executable capability proof
**Severity:** P1
**Confidence:** HIGH
**Primary owner:** R11
**Preconditions:** The B1 operation retains required strings in comments while its exported contract/returned decision enables runtime evidence, execution, or public signals.

**Trigger:** Run scripts/validate_bws_b1_acceptance.py or validate:ops without the separate validate:bws-b1 focused test set.

**Expected:** Acceptance proof must evaluate the production decision contract and behavior, not infer safety from literal tokens, test names, or a self-declared backlog status.

**Current:** The script passes when the actual literal types and values are changed to enabled/allowed and the old strings remain in comments.

**Impact:** The static B1 acceptance result can be green despite a capability escalation. The current focused Node tests are a partial independent safeguard, but validate:ops alone is false-positive-capable.

**Exact source evidence:**
- `scripts/validate_bws_b1_acceptance.py` `main` lines `28-80`, SHA-256 `f31f3f38125c3c308859278c77eeebf0db0c6fd13a1adc88f7e7e3ca797394ca`. The validator requires source substrings, test-title substrings, package command text, and a VALIDATED backlog status.
- `packages/bootstrap/src/operations/b1-runtime-evidence.ts` `B1RuntimeAcceptanceDecision / decision` lines `84-96; 517-537`, SHA-256 `80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8`. The no-runtime/no-execution boundary is encoded in literal types and returned values that are only checked as text by the Python validator.
- `tests/b1-runtime-evidence.test.ts` `flag assertions and sample evidence` lines `15-24; 262-272`, SHA-256 `aebe980faa9efd95c354aace00456a9f93b5952b0e2e29936189dd9d9a68b435`. Focused tests do assert current flags, but the static validate:ops component does not execute them and the sample authority is itself inherited as problematic.
- `package.json` `validate:ops / validate:bws-b1` lines `27; 69-70`, SHA-256 `b1b69ffa6d0b974c3b3ba55f3ec1acffb21e512c3a862e2a7b2d6b5139e5eac0`. validate:ops runs only the static acceptance script; validate:bws-b1 separately runs focused tests.

**Reproduction:** REPRODUCED. validate_bws_b1_acceptance.py exited 0 and printed ok after runtimeEvidence, executable, liveReadiness, and publicSignals were escalated.

**Root cause:** Acceptance authority is distributed across marker text, test-title text, command text, and mutable ledger status rather than one executed production contract.

**Minimal fix boundary:** Make the accepted gate execute the production classifier under canonical Node, inspect exact returned no-live fields, validate the external receipt dependency, and treat backlog status only as routing metadata. Either include the focused gate in validate:ops or remove the static script as acceptance proof.

**Required tests:**
- Capability flag escalation with comment markers
- Backlog VALIDATED with failed/missing focused tests
- Forged accepted input-source enum and repeated hashes per BWS120-R07-018
- Canonical Node 20.20.2 focused B1 gate
- Static validator cannot pass on comments alone

**Dependencies and non-duplication:**
- BWS120-R07-018 owns caller-selected B1 upstream authority. This finding owns the validator that fails to detect capability regression.

**Regression risks:**
- Preserve the existing no-live types and negative focused tests.
- Do not duplicate the underlying B1 authority defect owned by R07.

### BWS121-R11-006: Implementation-program validators can declare completion with the principal implementation trees absent
**Severity:** P1
**Confidence:** HIGH
**Primary owner:** R11
**Preconditions:** Documentation, backlog rows, root scripts, and package markers remain while principal TypeScript implementation directories are absent or behaviorally defective.

**Trigger:** Run either implementation-program validator.

**Expected:** A completion validator must bind every VALIDATED task to exact production paths/symbols, focused tests, and immutable evidence, or be named and scoped only as a documentation/ledger consistency validator.

**Current:** Both validators return success after packages/bootstrap/src, packages/persistence/src, packages/upstream/src, and src are deleted from a disposable copy.

**Impact:** Program completion can be self-attested by metadata. This explains how broad historical VALIDATED status and green marker checks coexist with 137 independently confirmed source defects.

**Exact source evidence:**
- `scripts/validate_full_implementation_program.py` `EXPECTED_STATUS / main` lines `11-36; 133-177; 184-277`, SHA-256 `5d81c01587b0b36713da90bf0226ac6c40cfaafbca8af2e6bdf3edd315a653bb`. The validator hard-codes task statuses and checks CSV, document, script, and package markers; it does not inventory or exercise task-owned implementation symbols.
- `scripts/validate_remaining_operator_runtime_program.py` `VALIDATED_IDS / main` lines `9-18; 85-159`, SHA-256 `7c5c302de6ab4483ce21ab6602a5d31ca87c931b570f45184bdb722780ba1cc1`. The remaining-program validator similarly validates blueprint markers, ledger statuses, and non-empty fields.
- `backlog/bws_full_implementation.csv` `implementation status ledger` lines `1-43`, SHA-256 `bc7380bc47db8aedace602eea5b8556d3afa28582f6e471d5d4353ccd73a4425`. The completion verdict is sourced from declared task rows.
- `package.json` `validate:implementation-program / validate:remaining-runtime-program` lines `27; 64-66`, SHA-256 `b1b69ffa6d0b974c3b3ba55f3ec1acffb21e512c3a862e2a7b2d6b5139e5eac0`. These scripts are exposed as implementation-program validators and are part of validate:ops.

**Reproduction:** REPRODUCED. Both validate_full_implementation_program.py and validate_remaining_operator_runtime_program.py exited 0 and printed ok. The aggregate build would independently fail missing source, but these completion validators do not prove implementation.

**Root cause:** Implementation status is treated as an input assertion and checked for internal textual consistency, not derived from source/test/evidence closure.

**Minimal fix boundary:** Split documentation consistency from implementation acceptance. Build a task-to-source-to-test-to-evidence map with exact hashes and require production-entrypoint execution before a task can be accepted as implemented.

**Required tests:**
- Delete or rename each task-owned production file and require failure
- Keep status VALIDATED while focused test fails and require failure
- Change source bytes without updating task proof and require failure
- No task may validate solely from marker/title/status text

**Dependencies and non-duplication:**
- All 137 inherited findings retain their original IDs; this finding addresses the assurance mechanism, not those application roots.

**Regression risks:**
- Do not turn historical documentation into executable routing authority.
- Task mapping must be maintainable and avoid one giant brittle marker list.

### BWS121-R11-007: Boundary validators omit active root executables, commands, scripts, and database migrations from their scan authority
**Severity:** P1
**Confidence:** HIGH
**Primary owner:** R11
**Preconditions:** A prohibited provider URL, execution identifier, direct database input, or cross-schema SQL is added under an omitted executable/migration path.

**Trigger:** Run npm run validate:boundary or the affected Python scripts.

**Expected:** Boundary proof must enumerate every executable, configuration, deployment, command, shell, and migration surface from the archive/build graph and fail on any unclassified path.

**Current:** The scanners silently ignore major active surfaces. A root controller containing a provider URL and execution identifier plus a surebet migration containing CREATE TABLE core... all passed the respective validators.

**Impact:** No-provider, no-execution, and schema-confinement claims can be bypassed by placing code in already active but unscanned paths. This is an assurance-layer failure distinct from any inherited application defect.

**Exact source evidence:**
- `scripts/validate_no_provider_connections.py` `SCAN_ROOTS` lines `8-10; 27-39; 49-65`, SHA-256 `e2afd91309af1ce80d0f0c8cd91f4aff944a1408f3443167c80ddb6476f0a003`. The provider scan covers selected roots plus cli.js and one wrapper, but not root controllers, commands, general scripts, database, deployment, or migrations.
- `scripts/validate_no_execution_paths.py` `SCAN_ROOTS` lines `7-10; 18-30; 58-64`, SHA-256 `da689d340d84cecbf8e5a7b3056fd233820e65187de312f48268806f196dd65b`. The execution scan uses the same narrow allowlist and omits tests as well as active shell/controller surfaces.
- `scripts/validate_contract_boundary.py` `SCAN_INPUTS` lines `7-14; 23-35; 47-55`, SHA-256 `8d8b4d559a000517e766b14f93b76379c2027dbe269f87f56167be4a5d2bb174`. The contract scan contains SQL patterns but does not scan database/migrations or root scripts.
- `tests/boundary-validator-workspace-scope.test.ts` `boundary scope fixtures` lines `10-104`, SHA-256 `3ff1bbd46c2eca6e5bc44cd6d86063d3b16c270e80d1018f7e1a3a811a8c8718`. The tests cover packages/apps, package.json, cli.js, and one named wrapper, mirroring rather than challenging the incomplete root list.
- `package.json` `validate:boundary` lines `25`, SHA-256 `b1b69ffa6d0b974c3b3ba55f3ec1acffb21e512c3a862e2a7b2d6b5139e5eac0`. All three scanners are presented together as the boundary validation gate.

**Reproduction:** REPRODUCED. validate_no_provider_connections.py, validate_no_execution_paths.py, and validate_contract_boundary.py all exited 0.

**Root cause:** Hard-coded positive scan-root lists are incomplete and there is no archive-to-scanner coverage reconciliation.

**Minimal fix boundary:** Generate or maintain one explicit executable-surface inventory covering root scripts, commands, scripts, deployment, database/migrations, packages, apps, src, package scripts, and relevant configuration. Fail when a new executable-class path is not classified. Preserve narrow explicit exclusions.

**Required tests:**
- Forbidden token in every active root controller
- Forbidden provider URL in commands and general scripts
- Cross-schema DDL in every migration file
- New executable path not present in scan inventory must fail
- Coverage test reconciles scanner path set to archive classifications

**Dependencies and non-duplication:**
- BWS116-R03-001 owns migration escape and incomplete SQL enforcement in production. R11 owns the validator scan omission.
- R06/R12 retain controller lifecycle and automation ownership.

**Regression risks:**
- Avoid scanning review prose as executable code.
- Keep false-positive exceptions explicit, path-and-rule-specific, and reviewed.

### BWS121-R11-008: Regex boundary checks are bypassed by trivial source-level string or identifier composition inside scanned files
**Severity:** P1
**Confidence:** HIGH
**Primary owner:** R11
**Preconditions:** A scanned source file constructs a provider endpoint or execution-capability name from fragments, aliases, computed properties, or indirection.

**Trigger:** Run the no-provider and no-execution validators.

**Expected:** Safety boundaries must be enforced architecturally and through dependency/capability allowlists plus executable negative tests; lexical regex may be defense-in-depth only.

**Current:** Fragmented provider URL and createOrderClient strings in scanned cli.js pass both validators.

**Impact:** The validators can issue clean safety results for semantically equivalent prohibited capabilities. A motivated or accidental refactor can evade the check without leaving the scanned path.

**Exact source evidence:**
- `scripts/validate_no_provider_connections.py` `PATTERNS` lines `41-47`, SHA-256 `e2afd91309af1ce80d0f0c8cd91f4aff944a1408f3443167c80ddb6476f0a003`. Provider detection requires contiguous import/package/URL text.
- `scripts/validate_no_execution_paths.py` `WORKSPACE_PATTERNS` lines `43-50`, SHA-256 `da689d340d84cecbf8e5a7b3056fd233820e65187de312f48268806f196dd65b`. Execution detection requires contiguous import text or identifier spelling.
- `tests/boundary-validator-workspace-scope.test.ts` `root executable fixtures` lines `48-103`, SHA-256 `3ff1bbd46c2eca6e5bc44cd6d86063d3b16c270e80d1018f7e1a3a811a8c8718`. The tests construct a forbidden URL in the test process but write the fully assembled value to the fixture; fragmented source is not tested.
- `cli.js` `root executable entrypoint` lines `1-113`, SHA-256 `acd4aa4ba64dbcacbc891ffe1af22699d9a240f16d3411ac3ea6998048d63349`. cli.js is an in-scope executable file where fragmented source remains semantically constructible.

**Reproduction:** REPRODUCED. Both lexical validators exited 0. No network or execution occurred.

**Root cause:** The assurance boundary equates regular-expression token matches with semantic absence of capability.

**Minimal fix boundary:** Use dependency/import graph allowlists, typed capability boundaries, package/dependency audits, and inert runtime tests that prove injected transports only. Retain regexes as supplemental diagnostics, not acceptance authority.

**Required tests:**
- Fragmented URL and identifier cases
- Aliased import and computed-property cases
- Dynamic import built from fragments
- Benign text false-positive tests
- No-network runtime test for public entrypoints

**Dependencies and non-duplication:**
- Underlying no-live/no-provider application boundaries remain owned by R01/R06/R10/R12; this finding owns false validator proof.

**Regression risks:**
- AST analysis must cover JavaScript, TypeScript, shell, JSON package scripts, and generated entrypoints appropriately.
- Avoid claiming formal semantic proof from any single static analyzer.

### BWS121-R11-009: Fixture-integrity gate ignores all twelve substantive strategy and runtime fixture files
**Severity:** P1
**Confidence:** HIGH
**Primary owner:** R11
**Preconditions:** Any of the B1, local-only export, or private-paper smoke fixtures is malformed, enriched with impossible fields, stale, or silently changed.

**Trigger:** Run scripts/validate_fixture_integrity.py or npm run validate:boundary.

**Expected:** Every substantive fixture must be inventoried, parseable, schema-valid where applicable, purpose-classified, and bound to tests that reject impossible enrichment or acceptance authority.

**Current:** The archive contains 17 fixture files. Five reserved/placeholder files are within the validator model; twelve substantive JSON fixtures are completely ignored. Replacing representative accepted/valid fixtures with invalid JSON still yields validator success.

**Impact:** Tests can consume malformed or overpowered fixtures while the named fixture-integrity gate remains green, enabling false proof of parsing, economics, acceptance, or lifecycle behavior.

**Exact source evidence:**
- `scripts/validate_fixture_integrity.py` `fixture scope` lines `8-15; 36-78`, SHA-256 `fc4eb4e0ccf040ee399659e17ce9983d61d3b16f01de4ea9ebe44da37dbbf5bb`. The validator covers three reserved empty directories and one historical placeholder only.
- `tests/validate-fixture-integrity.test.ts` `makeFixture and two tests` lines `12-53`, SHA-256 `35364ca01695419750c3558aeff96ed24b59931bd542bd7497de572d6f9b46c1`. The validator tests reproduce only that same limited synthetic fixture set.
- `tests/fixtures/b1-local-contract/valid-b1-multi-venue-markets.json` `substantive B1 fixture` lines `1-104`, SHA-256 `df0b5190ca30be3c921c4b37869752feb138faa98565b0a9e333ec7e62da63d7`. A production-shape B1 contract fixture is outside the integrity gate.
- `tests/fixtures/private-paper-mode-smoke/accepted-local-bundle.json` `accepted private-paper fixture` lines `1-71`, SHA-256 `623ccae2fd5ab78124445d1d3eaceddd829c161472bbfd0ab4e8297739941be4`. An accepted local bundle used by smoke tests is outside the integrity gate.
- `tests/fixtures/local-only-export-bundles/valid-resource-export.json` `valid resource fixture` lines `1-16`, SHA-256 `7bf48c2a6461f28e75a80c7cb8d3057715fb7ffea3dc00e50705b814c6bee16d`. A valid-resource fixture is outside the integrity gate.

**Reproduction:** REPRODUCED. validate_fixture_integrity.py exited 0 and printed ok.

**Root cause:** The fixture validator is a narrow historical-placeholder policy check but is named and wired as repository-wide fixture integrity.

**Minimal fix boundary:** Create an exact fixture manifest with path, purpose, schema/profile, allowed enrichment, and consumer tests. Validate all twelve substantive fixtures and keep the reserved-empty/placeholder rules as a separate check.

**Required tests:**
- Invalid JSON for every substantive fixture
- Missing/extra fixture path reconciliation
- Schema-invalid and enriched-impossible fixture negatives
- Consumer test proves exact native/local shape rather than helper-generated expectation
- Fixture digest change requires explicit review

**Dependencies and non-duplication:**
- R02/R04/R07 retain the mathematical, simulation, and acceptance roots exposed by fixtures. R11 owns fixture assurance.

**Regression risks:**
- Do not convert local deterministic fixtures into runtime/provider evidence.
- Preserve intentionally malformed negative fixtures with explicit expected-invalid classification.

### BWS121-R11-010: Aggregate validation has no machine-enforced closure from 137 inherited findings to 723 required tests and production entrypoints
**Severity:** P1
**Confidence:** HIGH
**Primary owner:** R11
**Preconditions:** The current historical tests and validators pass individually except the stale source manifest, but no implementation tranche has closed the inherited issue/test ledger.

**Trigger:** Run existing static validators or, after repairing only the manifest, run the historical aggregate gate without adding finding-specific closure evidence.

**Expected:** Release acceptance must prove that every blocking finding is either fixed and covered by named tests at production entrypoints or explicitly retained as an accepted hold. The gate must reject unresolved or unmapped ledger records.

**Current:** No non-review package, script, test, source, or automation path references the cumulative ledger or test-evidence matrix. Current gates can only test historical expectations, not closure of the 137-review backlog.

**Impact:** A future green historical suite could be misread as release readiness while all inherited roots remain open. The current archive is already blocked by the manifest, but that failure is unrelated and does not provide defect-closure proof.

**Exact source evidence:**
- `package.json` `validation graph` lines `15-32; 64-70`, SHA-256 `b1b69ffa6d0b974c3b3ba55f3ec1acffb21e512c3a862e2a7b2d6b5139e5eac0`. The aggregate graph runs existing build/tests and static validators but references neither the cumulative issue ledger nor test-evidence matrix.
- `docs/reviews/BWS120/wave-03/cumulative-consolidated-ledger.json` `confirmed findings and summary` lines `1-14007`, SHA-256 `dc47a624e242f859daed6b256a27cc93f343fcd7b74a630e2e6cc75015c8a894`. The integrated authority contains 137 stable confirmed findings, 136 release/deployment blockers, and explicit required tests.
- `docs/reviews/BWS120/wave-03/test-evidence-matrix.json` `records` lines `1-8498`, SHA-256 `5cecb3239f7993eaf16864216923e5238bbeedab88ffb9b26ccb83033864b272`. The matrix contains 723 requirements covering all 137 findings; 626 are REQUIRED_NOT_RUN_BY_CONSOLIDATION and 97 are explicit/identified/confirmed test gaps. 571 require production entrypoints.

**Reproduction:** CONFIRMED_BY_STATIC_RECONCILIATION. 137/137 inherited IDs are represented by 723 test requirements, but zero package/scripts/tests outside docs/reviews consume either authority. Status counts: 626 not run, 46 explicit gaps, 35 identified gaps, 16 confirmed gaps.

**Root cause:** The historical validation graph has no defect-ledger closure model, no finding-to-test receipt, and no production-entrypoint coverage requirement tied to review authority.

**Minimal fix boundary:** After implementation findings are resolved, add a generated but reviewed closure manifest mapping each stable finding ID to source postimages, tests, runtime/environment class, and acceptance receipt. Make unresolved blockers fail the release gate. Keep review documentation non-executable until an authorized integration tranche lands the closure contract.

**Required tests:**
- All 137 IDs must be mapped exactly once or intentionally shared by root cause
- Unresolved blocking finding fails release
- Test exists but was not executed fails acceptance
- Unit-only test fails when production entrypoint is required
- Stale test/source hash fails closure
- Accepted external blocker remains non-promotable

**Dependencies and non-duplication:**
- All 137 inherited findings remain unchanged and were checked for overlap. This finding owns only aggregate assurance closure.

**Regression risks:**
- Do not let mutable review prose become direct controller routing authority.
- Closure generation must preserve stable inherited IDs and avoid duplicating application roots.

## Hypotheses and environment blockers
- Further marker-based validators may admit additional semantic regressions. This is not claimed as confirmed until each validator is mutation-tested.
- Canonical Node 20.20.2, installed dependencies, PostgreSQL, controlled loopback services, and accepted upstream lock generation were unavailable. Full dynamic acceptance remains unproven.
- Global TypeScript 5.8.3 stopped at missing `@types/node`; no dependency was installed.
## Intentional safeguards and rejected suspicions
Safeguards to preserve:
- ZIP path/type/mode safety and exact extraction reconciliation.
- Exact source-manifest comparison logic, which correctly blocks the current stale manifest.
- Clean-before-build behavior and absence of committed dist.
- Strict TypeScript options and serial test execution.

Rejected suspicions:
- BWS121 does not change executable bytes relative to BWS120.
- ZIP executable modes are intact; an earlier Python extractor mode discrepancy was not repository evidence.
- The manifest mismatch is not explained by self-exclusion; 115 paths are genuinely absent.
- No stale dist output is committed.
## Cross-area handoffs
- R01: preserve inherited upstream lock findings; R11 must test the corrected production implementation.
- R03: fix migration confinement and database privileges; R11 must scan every migration path.
- R07: provide a verified B1/runtime evidence receipt; R11 must stop accepting tokens/status as proof.
- R09: consume exact source/runtime proof for release packaging and install verification.
- R10: define environment/CLI precedence and canonical-versus-supported runtime semantics.
- R12: make controller completion consume R11 closure receipts rather than self-declared status.
## Test gaps
The integrated matrix contains 723 requirements for all 137 findings: 626 not run by consolidation, 46 explicit review test gaps, 35 identified gaps, and 16 confirmed gaps. 571 require production entrypoints. R11 additionally identified:
- `BWS121-R11-TG-001` Exact Node patch-version negative matrix: Reject 20.0.0 and 20.20.1 as canonical; accept exactly 20.20.2; classify other supported 20.x as noncanonical.
- `BWS121-R11-TG-002` Semantic mutation tests for marker validators: Comment/dead-import/unreachable-branch mutations must fail upstream, API-only, B1, and program-completion validators.
- `BWS121-R11-TG-003` Archive-to-boundary-scanner path coverage reconciliation: Every executable, script, command, migration, package, app, and config path must be classified and scanned or explicitly excluded.
- `BWS121-R11-TG-004` Lexical fragmentation and alias bypass suite: Fragmented URLs/identifiers, computed properties, aliases, and dynamic imports must not produce a green boundary verdict.
- `BWS121-R11-TG-005` Exact substantive fixture manifest and schema validation: All twelve substantive fixtures require path/digest/purpose/schema reconciliation and negative enrichment cases.
- `BWS121-R11-TG-006` Direct production CLI tests are absent for two CLI modules: Directly invoke bws-database-lifecycle and bws-upstream-api-convergence entrypoints with bounded inert negative cases.
- `BWS121-R11-TG-007` Finding-to-test-to-entrypoint closure gate: Execute and record all 723 matrix requirements or explicitly retain non-promotable blockers; production-entrypoint-required rows cannot close on unit-only evidence.
## Prioritized review-only remediation order
1. Repair and transactionally republish the exact source manifest, then prove archive/extraction/manifest equality.
2. Define exact canonical Node acceptance and repair the runtime loader/validator before any dynamic gate is trusted.
3. Replace comment/token/status validators with production-symbol and production-entrypoint proof, starting with upstream, API-only, B1, and program completion.
4. Create one exhaustive executable/migration surface inventory and make boundary scanners fail on unclassified paths.
5. Demote regex checks to defense-in-depth and add dependency/capability plus inert runtime proof.
6. Create an exact fixture manifest and validate all substantive fixtures independently from their consumers.
7. Integrate the 137-finding/723-test closure contract only through an authorized implementation tranche.
8. Run the complete clean gate under Node 20.20.2 with dependencies, disposable PostgreSQL, controlled loopback, and accepted upstream inputs; then re-review R11/R12/R09 interactions.
## Explicit unchanged areas
- No source, test, fixture, migration, schema, configuration, documentation, manifest, or archive member was modified.
- All adversarial mutations were confined to disposable copies outside the extracted review tree.
- No provider, external API, account, credential, signer, wallet, deployed service, or betting-win checkout was contacted.
- No persistent database was contacted or mutated; no service, controller, scheduler, worker, or automation process was started.
- Execution, public signals, profitability claims, live writes, and financial operations remain prohibited and unchanged.

The review produced research artifacts only. It did not generate implementation code, an overlay, a server command, or an implementation prompt.
