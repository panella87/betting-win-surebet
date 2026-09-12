# BWS121-R10 deep review: configuration, CLI, filesystem, secret, destination, and repository-boundary truth

## Executive verdict

- **Archive:** `betting-win-surebet121(1).zip`
- **SHA-256:** `025936d21db89ac5cf4881863f05ec9ed5ddaaa2b4adfe60e766207fc4c9b9f7`
- **Regular files:** `733`
- **Archive/path/type safety:** PASS
- **Executable compatibility with BWS120:** PASS. The archive contains 38 documentation additions and 2 documentation edits, with zero removals and zero non-documentation byte differences.
- **Inherited authority:** all 137 R01-R09 confirmed finding IDs were loaded, overlap-checked, and preserved; no inherited root cause received a new R10 ID.
- **New confirmed findings:** 13 (5 P0, 7 P1, 1 P2).
- **Release blocking:** 12; **deployment blocking:** 13; **BWS-600 blocking:** 8; **BWS-710 blocking:** 4.
- **Overall verdict:** `BLOCKED_CONFIGURATION_SECRET_AND_REPOSITORY_BOUNDARY_REMEDIATION_REQUIRED`.

The repository has meaningful fail-closed controls, including fixed paper/provider/execution policy, strict typed persistence fields, a strict external-preflight parser, and a robust `zip_codebase.sh` member policy. Those controls are not applied consistently across entrypoints. The principal R10 defects are unrestricted ambient child environments, mixed-source PostgreSQL resolution, blank-value fallback, unbound runtime-status destinations, caller-CWD package execution, ambiguous CLI flags, plaintext password argv, ambient libpq controls, unconfined log readers, divergent source archive policy, incomplete Git secret guards, persistent Git-config mutation, and first-use SSH host trust with password authentication.

## Authority and scope

The Wave 04 handoff assigns R10 exclusive ownership of configuration/environment precedence, CLI parsing, missing/null/blank/zero/false semantics, filesystem roots, symlink/traversal confinement, secrets/redaction policy, loopback/external-destination policy, repository boundary, and update/root wrappers. R10 consumed without duplicating the named R01, R03, R06, R07, R08, and R09 roots.

### Current authority preserved

- `current_task=BWS-600`
- `current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE`
- `active_implementation_queue=none`
- `selected_controller=run-paper-autopilot.sh`
- `bws710_status=BLOCKED_ACCEPTED_BETTING_WIN_B1_MULTI_VENUE_API_REQUIRED`
- `bws900_execution_status=PARKED_NOT_AUTHORIZED`
- Review mode remained read-only. No provider, external API, SSH destination, database, account, credential, service, controller, or live operation was contacted.

## Archive and executable-compatibility verdict

`betting-win-surebet121(1).zip` independently hashes to `025936d21db89ac5cf4881863f05ec9ed5ddaaa2b4adfe60e766207fc4c9b9f7` and contains exactly 733 regular files. No duplicate member, unsafe path, symlink, or special entry was found. Compared byte-for-byte with `betting-win-surebet120(1).zip`, the current archive adds 38 review-documentation files and edits `docs/000_documentation_index.md` and `docs/reviews/README.md`. No executable source, test, script, schema, migration, package, configuration, or other non-documentation byte changed. The BWS120 executable conclusions and all 137 inherited finding identities therefore remain applicable.

## R10 architecture and authority map

| Layer | Production authority | R10 conclusion |
|---|---|---|
| Root runtime environment | `scripts/bws-root-wrapper-runtime.mjs` | Fixed safety literals are strong, but full ambient process inheritance, mixed PostgreSQL sources, and blank fallback make the effective configuration non-deterministic. |
| Managed lifecycle children | `operator-lifecycle.ts`, loopback validator | Child processes inherit unbounded ambient variables; lifecycle and validation do not share one environment contract. |
| Runtime status destination | root wrapper state and HTTP probes | A mutable state field selects three network destinations before validation. |
| Public package CLI | `cli.js`, package `bin` | Caller CWD acts as repository identity and build/entrypoint authority. |
| Safety CLIs | release/database/soak/final-acceptance CLIs | Five parsers ignore unknown flags and overwrite duplicates; external preflight alone is strict. |
| Persistence subprocesses | `psql.ts`, `database-lifecycle.ts` | Explicit target args are present, but ambient libpq behavior remains unbounded and unreceipted. |
| Operator log helpers | `open_log.sh`, root wrapper | Caller-selected/outside paths and symlink-following can display unrelated content as BWS evidence. |
| Source/archive helpers | source handoff and zipper | The tar handoff policy is materially weaker than the robust zip policy and can include nested secrets/runtime state. |
| Git update helper | `update_git.sh` | Nested secret paths bypass the guard; token operations permanently delete unrelated local extraheaders. |
| Artifact transfer | `pull_artifacts_and_zip_codebase.sh` | Destination host is explicit and archive integrity is checked, but first-seen host keys are auto-trusted while sending a password. |

## Configuration precedence and value-semantics conclusions

The root runtime wrapper claims a selective file-based configuration model, but its effective model is: all ambient process variables, selective `.env` fill, repository defaults, then forced safety literals. That model produces three distinct defects: unrelated ambient controls remain active; the PostgreSQL tuple can be assembled from two sources; and explicit blank values are erased before precedence is resolved. The typed service and persistence resolvers are stricter once they receive a value map, but they cannot recover the lost source/blank state.

## CLI, path, secret, and destination conclusions

The public package bin is not bound to its installed repository and can execute another directory’s npm scripts. Safety-critical TypeScript CLIs do not consistently reject unknown or duplicate flags. A release gate takes a database password in argv. The standardized log reader accepts arbitrary directories. The source-handoff tar and Git synchronization helpers use incomplete nested-secret rules. The artifact transfer helper verifies bytes after transfer but not the server identity before password authentication. Together, these defects mean repository identity, command identity, secret handling, and destination identity are not one coherent fail-closed contract.

## Finding summary

| ID | Severity | Title | Release | BWS-600 | BWS-710 | Deployment |
|---|---:|---|---:|---:|---:|---:|
| BWS121-R10-001 | P1 | Managed runtime children inherit the entire ambient process environment instead of a bounded effective configuration | yes | yes | yes | yes |
| BWS121-R10-002 | P1 | The root runtime wrapper assembles one PostgreSQL tuple from mixed process and .env sources | yes | yes | yes | yes |
| BWS121-R10-003 | P1 | Explicit blank runtime values are converted to absence and silently replaced by file values or defaults | yes | yes | yes | yes |
| BWS121-R10-004 | P1 | Runtime status probes trust a mutable state-selected base URL without destination confinement | yes | yes | no | yes |
| BWS121-R10-005 | P0 | The exported package CLI treats the caller current directory as repository authority and executes its build | yes | no | no | yes |
| BWS121-R10-006 | P1 | Safety-critical CLIs silently accept unknown flags and overwrite duplicate flags | yes | yes | no | yes |
| BWS121-R10-007 | P0 | Final local acceptance requires the PostgreSQL password in process arguments | yes | yes | no | yes |
| BWS121-R10-008 | P1 | PostgreSQL subprocesses inherit ambient libpq control variables | yes | yes | yes | yes |
| BWS121-R10-009 | P1 | open_log.sh accepts arbitrary out-of-repository run directories and follows selected files | yes | yes | no | yes |
| BWS121-R10-010 | P0 | The source-handoff archive includes nested environment, secret, key, and runtime-state files | yes | no | no | yes |
| BWS121-R10-011 | P0 | update_git.sh secret-path guard misses nested environment and credential directories before push | yes | no | no | yes |
| BWS121-R10-012 | P2 | update_git.sh permanently removes all repository-local HTTP extraheader configuration | no | no | no | yes |
| BWS121-R10-013 | P0 | Artifact download accepts first-seen SSH host keys while sending a reusable password | yes | no | no | yes |

## Detailed confirmed findings

### BWS121-R10-001 — Managed runtime children inherit the entire ambient process environment instead of a bounded effective configuration

**Severity:** P1
**Confidence:** HIGH
**Primary source:** `scripts/bws-root-wrapper-runtime.mjs` `L227-L259; L670-L675`
**SHA-256:** `1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8`

**Preconditions.** The root wrapper, lifecycle entrypoint, or loopback-acceptance command is launched from a shell containing unrelated secrets or behavior-changing variables such as GITHUB_TOKEN, NODE_OPTIONS, proxy variables, Git variables, or libpq variables.

**Trigger.** Start, stop, build, observe, or validate the managed runtime while those variables are present in the parent process environment.

**Expected behavior.** A safety-critical wrapper must construct an explicit child environment from approved keys plus a minimal documented operating-system runtime set, reject or scrub behavior-changing ambient variables, and bind the resulting effective configuration to evidence.

**Current behavior.** The root wrapper begins with `{ ...process.env }`, the lifecycle context spreads `process.env` again, and loopback acceptance does the same. Selective `.env` loading therefore does not make child configuration selective: every ambient variable remains available to npm builds and managed children.

**Impact.** Managed behavior and secret exposure depend on the invoking shell rather than the reviewed configuration. Ambient Node, proxy, Git, or database controls can alter execution or network behavior without appearing in the configuration receipt, and unrelated credentials are propagated to child processes.

**Exact evidence.**
- `scripts/bws-root-wrapper-runtime.mjs` `L227-L259; L670-L675` `1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8` — `resolveRuntimeEnvironment / runCommand`.
- `packages/bootstrap/src/operations/operator-lifecycle.ts` `L351-L369` `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31` — `createLifecycleContext`.
- `scripts/validate_bws_loopback_acceptance.mjs` `L87-L97` `1624933a115da5e14c687b95913d7de272bfddf528039fb90acdb502087d1c50` — `resolveEnvironment`.
- Static dataflow shows the full process environment is copied and passed to npm/node children.
- A bounded disposable wrapper probe supplied `GITHUB_TOKEN=ambient-secret-sentinel`; the inert child received that value together with the approved runtime tuple.
- The existing focused test proves that an unrelated `.env` value is not loaded, but it does not test or scrub the same value when inherited from the parent shell.

**Reproduction status.** `STATIC_SOURCE_CONFIRMED; BOUNDED_OFFLINE_CHILD_ENVIRONMENT_PROBE_CONFIRMED under Node 22.16.0 supplementary runtime`

**Root cause.** The implementation applies an allowlist only to values read from `.env`, while treating the complete parent process environment as trusted configuration and secret context.

**Minimal fix boundary.** Introduce one repository-owned effective-environment builder per child class. Start from a documented allowlist, add only required platform variables, explicitly reject or remove Node/proxy/Git/libpq control variables unless owned by that child, and emit a secret-safe digest of the exact effective configuration. Keep the fixed paper/provider/execution invariants unchanged.

**Required tests.**
- Ambient unrelated token and credential variables are absent from build and managed child environments.
- NODE_OPTIONS/NODE_PATH and proxy variables are rejected or stripped according to an explicit policy.
- Required PATH, HOME, locale, and approved BWS variables remain available.
- The configuration receipt changes when any approved effective value or source changes and never contains plaintext secrets.

**Regression risks.**
- Over-scrubbing PATH, HOME, locale, temporary-directory, or certificate variables required by Node/npm/PostgreSQL.
- Divergence between start, stop, status, acceptance, and test environment builders.

**Secondary sectors:** R03, R06, R07, R09, R11

**Aliases/dependencies.**
- BWS120-R07-002 owns output redaction, not child-environment propagation.
- BWS120-R09-019 owns campaign identity omission; R10 owns effective environment precedence and filtering.

**Unchanged areas.**
- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, deployed service, account, credential, wallet, signer, or persistent database was contacted.
- No controller, scheduler, worker, API, lifecycle service, release apply, database command, Git pull, Git push, or live operation was started.
- BWS-600 remains BLOCKED_EXTERNAL_RUNTIME_EVIDENCE, BWS-710 remains blocked on an accepted upstream runtime resource, and BWS-900 remains parked.

### BWS121-R10-002 — The root runtime wrapper assembles one PostgreSQL tuple from mixed process and .env sources

**Severity:** P1
**Confidence:** HIGH
**Primary source:** `scripts/bws-root-wrapper-runtime.mjs` `L270-L299`
**SHA-256:** `1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8`

**Preconditions.** At least one canonical POSTGRES_* field is set in the process environment and the remaining fields exist in the repository `.env` file.

**Trigger.** Run the root lifecycle or paper-evidence wrapper with a partial process tuple.

**Expected behavior.** The PostgreSQL connection tuple must be atomic: exactly one complete source must win, partial process tuples must fail closed, and validation and runtime startup must resolve the same values.

**Current behavior.** The root wrapper resolves each POSTGRES_* key independently using `process ?? file`, creating a hybrid tuple. The loopback-acceptance validator instead chooses the process source atomically whenever any process field exists and rejects a partial tuple.

**Impact.** The same operator configuration can pass one entrypoint and fail another, or start against a host supplied by the shell while using user, password, and database values from `.env`. Database target and credential provenance are ambiguous and cannot be represented by one truthful source receipt.

**Exact evidence.**
- `scripts/bws-root-wrapper-runtime.mjs` `L270-L299` `1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8` — `resolveCanonicalPostgresEnvironment`.
- `scripts/validate_bws_loopback_acceptance.mjs` `L145-L169` `1624933a115da5e14c687b95913d7de272bfddf528039fb90acdb502087d1c50` — `readPostgresEnvironment`.
- The production wrapper loops across four keys and selects the process or file value per key.
- The validator uses `processValues.size > 0 ? processValues : fileValues`, proving a contradictory atomic-source policy.
- A bounded inert probe supplied only POSTGRES_ADDRESS in the process and supplied the other three values in `.env`; startup accepted the hybrid and derived the internal SUREBET_PG_* tuple.

**Reproduction status.** `STATIC_SOURCE_CONFIRMED; BOUNDED_OFFLINE_MIXED_SOURCE_PROBE_CONFIRMED under Node 22.16.0 supplementary runtime`

**Root cause.** No single typed effective-configuration resolver owns PostgreSQL source selection across wrappers and validators.

**Minimal fix boundary.** Centralize canonical POSTGRES_* resolution. Reject partial tuples in every source, select one complete source using one documented precedence rule, preserve source metadata in a protected receipt, and reuse the resolver in lifecycle, acceptance, release, and validation entrypoints.

**Required tests.**
- Complete process tuple wins as one unit.
- Complete `.env` tuple is accepted only when no process tuple key is present.
- Every partial process and partial file tuple fails before build, database, or lifecycle work.
- Root wrapper and loopback-acceptance validator produce byte-equivalent effective tuples for the same inputs.

**Regression risks.**
- Breaking operators that currently rely on mixed-source tuples.
- Accidentally exposing the password in the source receipt.

**Secondary sectors:** R03, R06, R08, R09, R11

**Aliases/dependencies.**
- BWS116-R03-HO-004 requested one shared environment/connection resolver.
- BWS120-R08-002 owns wrong-target upgrade apply mechanics, not tuple precedence.

**Unchanged areas.**
- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, deployed service, account, credential, wallet, signer, or persistent database was contacted.
- No controller, scheduler, worker, API, lifecycle service, release apply, database command, Git pull, Git push, or live operation was started.
- BWS-600 remains BLOCKED_EXTERNAL_RUNTIME_EVIDENCE, BWS-710 remains blocked on an accepted upstream runtime resource, and BWS-900 remains parked.

### BWS121-R10-003 — Explicit blank runtime values are converted to absence and silently replaced by file values or defaults

**Severity:** P1
**Confidence:** HIGH
**Primary source:** `scripts/bws-root-wrapper-runtime.mjs` `L227-L245; L683-L734`
**SHA-256:** `1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8`

**Preconditions.** An approved runtime variable is explicitly present but empty or whitespace-only in the process environment, or quoted empty in `.env`.

**Trigger.** Resolve the root runtime environment.

**Expected behavior.** Missing and explicit blank must remain distinct. A present blank value for a typed runtime field must fail validation rather than silently activate another source or a built-in default.

**Current behavior.** `readProcessValue` trims and returns undefined for blank values. The resolver then fills from `.env` or a repository default. A quoted empty file value is accepted by the parser and then also appears absent to the defaulting pass.

**Impact.** An attempted explicit override, disablement, or secret/configuration clearing can silently reactivate stale file configuration or defaults. Evidence does not reveal that a higher-precedence source was present but invalid.

**Exact evidence.**
- `scripts/bws-root-wrapper-runtime.mjs` `L227-L245; L683-L734` `1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8` — `resolveRuntimeEnvironment / readSelectedEnvFile / readProcessValue`.
- The blank-to-undefined conversion occurs before both `.env` fill and repository defaulting.
- A bounded probe supplied a whitespace-only process BWS_API_PORT and `.env` BWS_API_PORT=5555; the child received 5555 instead of a configuration error.

**Reproduction status.** `STATIC_SOURCE_CONFIRMED; BOUNDED_OFFLINE_BLANK_PRECEDENCE_PROBE_CONFIRMED under Node 22.16.0 supplementary runtime`

**Root cause.** The resolver uses absence as both “not supplied” and “supplied but invalid,” erasing source and validity state before typed validation.

**Minimal fix boundary.** Parse each source into explicit states (`missing`, `present_valid`, `present_blank`, `present_invalid`). Fail on blank/invalid values in the highest-precedence source and apply defaults only to genuinely missing fields.

**Required tests.**
- Whitespace-only process value rejects.
- Quoted empty `.env` value rejects.
- Zero and false-like strings remain valid or invalid according to each field type rather than generic truthiness.
- Source-state metadata is present in the effective configuration receipt.

**Regression risks.**
- Some existing shell profiles may contain blank optional variables and begin failing.
- Optional fields need a deliberate unset mechanism distinct from an empty string.

**Secondary sectors:** R06, R09, R11

**Aliases/dependencies.**
- BWS120-R09-019 requires an exact effective-configuration receipt and should consume the corrected source-state model.

**Unchanged areas.**
- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, deployed service, account, credential, wallet, signer, or persistent database was contacted.
- No controller, scheduler, worker, API, lifecycle service, release apply, database command, Git pull, Git push, or live operation was started.
- BWS-600 remains BLOCKED_EXTERNAL_RUNTIME_EVIDENCE, BWS-710 remains blocked on an accepted upstream runtime resource, and BWS-900 remains parked.

### BWS121-R10-004 — Runtime status probes trust a mutable state-selected base URL without destination confinement

**Severity:** P1
**Confidence:** HIGH
**Primary source:** `scripts/bws-root-wrapper-runtime.mjs` `L331-L356; L624-L667`
**SHA-256:** `1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8`

**Preconditions.** The repository runtime state file exists and its `runtimeBaseUrl` field can be replaced, corrupted, or written by a stale/other process.

**Trigger.** Run `runtime-summary`, `check_progress.sh`, or `watch_progress.sh`.

**Expected behavior.** Status probes must derive or verify a loopback-only URL from current validated configuration and bound lifecycle identity, reject credentials and unsupported schemes, and never follow an untrusted state-selected destination.

**Current behavior.** The helper parses `state.runtimeBaseUrl`, constructs `/metrics`, `/health`, and `/readiness`, then issues HTTP(S) requests without validating host class, port ownership, userinfo, state provenance, or equality with the current effective configuration before the requests.

**Impact.** A mutable local state record can redirect operator status requests to another local, private, or external HTTP service and can make unrelated responses influence runtime condition. This is a status-path SSRF and false-evidence boundary even though no provider credentials are attached.

**Exact evidence.**
- `scripts/bws-root-wrapper-runtime.mjs` `L331-L356; L624-L667` `1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8` — `createRuntimeSummary / fetchJson`.
- All three destinations are derived directly from the state field before configuration comparison.
- A bounded local-only probe wrote a state-selected loopback port and observed exactly `/metrics`, `/health`, and `/readiness` requests at that server.
- No provider or external network was contacted.

**Reproduction status.** `STATIC_SOURCE_CONFIRMED; BOUNDED_LOCAL_HTTP_DESTINATION_PROBE_CONFIRMED under Node 22.16.0 supplementary runtime`

**Root cause.** Runtime state is treated as trusted destination authority rather than evidence that must be authenticated against current lifecycle/configuration authority.

**Minimal fix boundary.** Derive the expected loopback URL from validated effective configuration; require the state URL to match it and the active lifecycle generation before any request; reject userinfo, non-http, non-loopback, mapped-loopback ambiguity, redirects, and unexpected ports.

**Required tests.**
- State URL to external/private/non-loopback destination rejects before socket creation.
- Wrong loopback port and userinfo reject.
- Redirect away from the exact loopback endpoint rejects.
- Stale lifecycle generation cannot select a destination.
- Valid current loopback state still reports status.

**Regression risks.**
- Status of legacy state files without generation/configuration receipts will become unavailable.
- IPv6 loopback support requires one explicit policy.

**Secondary sectors:** R01, R06, R07, R11

**Aliases/dependencies.**
- BWS116-R01-009 owns external upstream API destination proof. This finding is the distinct local operator-status destination path.

**Unchanged areas.**
- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, deployed service, account, credential, wallet, signer, or persistent database was contacted.
- No controller, scheduler, worker, API, lifecycle service, release apply, database command, Git pull, Git push, or live operation was started.
- BWS-600 remains BLOCKED_EXTERNAL_RUNTIME_EVIDENCE, BWS-710 remains blocked on an accepted upstream runtime resource, and BWS-900 remains parked.

### BWS121-R10-005 — The exported package CLI treats the caller current directory as repository authority and executes its build

**Severity:** P0
**Confidence:** HIGH
**Primary source:** `cli.js` `L1-L16; L29-L36; L92-L108`
**SHA-256:** `acd4aa4ba64dbcacbc891ffe1af22699d9a240f16d3411ac3ea6998048d63349`

**Preconditions.** The package bin is invoked from a directory other than the intended betting-win-surebet repository root.

**Trigger.** Run `betting-win-surebet status`, `validate`, or any command routed through `runBuiltEntry`.

**Expected behavior.** The public bin must bind to an authenticated repository/package root derived from its own installation or require an explicit validated repository root. It must never execute package scripts or relative dist files from an arbitrary caller directory.

**Current behavior.** All paths are relative and spawn calls omit `cwd`. `status` reads the caller `PROJECT_STATUS.md`; `validate` and runtime commands run the caller `npm run ...`; built entrypoints are also resolved relative to the caller.

**Impact.** An operator can receive status from the wrong tree or cause the trusted BWS binary to execute caller-directory npm scripts and dist content. This is a repository-boundary and unauthorized-execution defect in the exported CLI.

**Exact evidence.**
- `cli.js` `L1-L16; L29-L36; L92-L108` `acd4aa4ba64dbcacbc891ffe1af22699d9a240f16d3411ac3ea6998048d63349` — `root command dispatch / runBuiltEntry`.
- `package.json` `L76-L78` `b1b69ffa6d0b974c3b3ba55f3ec1acffb21e512c3a862e2a7b2d6b5139e5eac0` — `bin.betting-win-surebet`.
- The package explicitly exports `./cli.js` as the binary.
- A bounded probe invoked the real CLI by absolute path from a disposable caller directory; `status` printed that directory’s sentinel PROJECT_STATUS.md.
- Static tracing shows the same unbound current directory governs npm build/validate and node entrypoint execution.

**Reproduction status.** `STATIC_SOURCE_CONFIRMED; BOUNDED_OFFLINE_CALLER_CWD_PROBE_CONFIRMED under Node 22.16.0 supplementary runtime`

**Root cause.** The bin conflates invocation working directory with package/repository identity and performs no root marker, realpath, or package identity verification.

**Minimal fix boundary.** Resolve the installed package root from `import.meta.url`, or require and validate an explicit repository root with package name/version and canonical realpath checks. Pass that root as `cwd` to every child and use absolute entrypoint paths. Fail before npm/node execution on mismatch.

**Required tests.**
- Invoke every public command from an unrelated directory and prove it cannot read or execute caller files.
- Symlinked package/root and lookalike package.json rejection.
- Normal invocation from the authentic repository remains functional.
- Status, validate, build, and dist execution all use the same bound root.

**Regression risks.**
- Global installs, workspace links, and packed consumers may have different package-root layouts.
- Repository-development mode may need an explicit and tested root override.

**Secondary sectors:** R06, R09, R11, R12

**Aliases/dependencies.**
- BWS116-R03-001 owns migration-directory escape, not public CLI repository identity.

**Unchanged areas.**
- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, deployed service, account, credential, wallet, signer, or persistent database was contacted.
- No controller, scheduler, worker, API, lifecycle service, release apply, database command, Git pull, Git push, or live operation was started.
- BWS-600 remains BLOCKED_EXTERNAL_RUNTIME_EVIDENCE, BWS-710 remains blocked on an accepted upstream runtime resource, and BWS-900 remains parked.

### BWS121-R10-006 — Safety-critical CLIs silently accept unknown flags and overwrite duplicate flags

**Severity:** P1
**Confidence:** HIGH
**Primary source:** `packages/bootstrap/src/cli/bws-final-local-acceptance.ts` `L124-L142`
**SHA-256:** `218d99afdbef03328786d155dd23766bf87e19a75eb03c5ba1e835922c251d43`

**Preconditions.** An operator, wrapper, or automation passes an unknown option or repeats a path, fingerprint, target, or safety option.

**Trigger.** Invoke release packaging, release upgrade, database lifecycle, soak, or final-local-acceptance commands.

**Expected behavior.** Each command must define an exact option allowlist, reject unknown options, reject duplicate options before file or side-effect work, and preserve the distinction between a missing value and a boolean switch.

**Current behavior.** Five production CLIs accept every `--...` key into a Map and silently overwrite earlier occurrences. Unknown keys remain ignored by command logic. The external-runtime-preflight CLI already implements the required allowlist and duplicate rejection, proving the repository has two incompatible parser policies.

**Impact.** Typos do not fail closed, and a repeated high-impact argument can make the last unseen value control plan files, fingerprints, release directories, database retention parameters, or acceptance evidence. Command provenance cannot unambiguously describe the effective invocation.

**Exact evidence.**
- `packages/bootstrap/src/cli/bws-final-local-acceptance.ts` `L124-L142` `218d99afdbef03328786d155dd23766bf87e19a75eb03c5ba1e835922c251d43` — `parseFlags`.
- `packages/bootstrap/src/cli/bws-release-packaging.ts` `L75-L93` `a3f0d96bd9d3e3c45df37538dd99f4c07eb27934fd77eb4d80cc3143edef4ec7` — `parseFlags`.
- `packages/bootstrap/src/cli/bws-release-upgrade.ts` `L91-L109` `362783fada2194c4c62c5bd1b545270c4f94ea358a816f45051c0b95a870daa7` — `parseFlags`.
- `packages/bootstrap/src/cli/bws-database-lifecycle.ts` `L95-L113` `4e6da6bfca8e7c622ccd04e66d3789b4f4eaf490f93fd8265bfa458d3c22b06a` — `parseFlags`.
- `packages/bootstrap/src/cli/bws-soak-campaign.ts` `L156-L174` `55a3b486f879b367fb30e3d67b465e457f1f258c209d131603ce3916e51e534a` — `parseFlags`.
- `packages/bootstrap/src/cli/bws-external-runtime-preflight.ts` `L101-L125` `b02200f62578bd2b273c0e9df020132b8dd49e613fc5a788555efda2dc0d8c5f` — `parseFlags (strict comparator)`.
- Exact parser copies use `parsed.set` without `parsed.has` or command-specific allowlist checks.
- Focused tests cover strict preflight rejection but no equivalent tests exist for the other safety-critical CLIs.

**Reproduction status.** `STATIC_SOURCE_CONFIRMED; PRODUCTION_ARGUMENT_DATAFLOW_TRACED; canonical Node execution unavailable`

**Root cause.** Flag parsing is duplicated across CLIs without one strict command schema or shared parser contract.

**Minimal fix boundary.** Adopt one shared parser with per-command allowed flags, arity/type metadata, duplicate rejection, and deterministic normalized invocation receipts. Preserve valid documented commands and the existing strict external-preflight behavior.

**Required tests.**
- Unknown flag rejection for every command.
- Duplicate value and duplicate boolean flag rejection before I/O.
- Repeated plan-file/fingerprint/output/database flags cannot select the last value.
- Help text and parser schema stay synchronized.

**Regression risks.**
- Existing wrappers may accidentally pass ignored flags and begin failing.
- Subcommands with shared flags require command-specific allowlists rather than one global set.

**Secondary sectors:** R08, R09, R11, R12

**Aliases/dependencies.**
- BWS120-R09-005 and BWS120-R09-006 own plan and apply byte authority; R10 owns CLI argument authority.

**Unchanged areas.**
- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, deployed service, account, credential, wallet, signer, or persistent database was contacted.
- No controller, scheduler, worker, API, lifecycle service, release apply, database command, Git pull, Git push, or live operation was started.
- BWS-600 remains BLOCKED_EXTERNAL_RUNTIME_EVIDENCE, BWS-710 remains blocked on an accepted upstream runtime resource, and BWS-900 remains parked.

### BWS121-R10-007 — Final local acceptance requires the PostgreSQL password in process arguments

**Severity:** P0
**Confidence:** HIGH
**Primary source:** `packages/bootstrap/src/cli/bws-final-local-acceptance.ts` `L23-L38; L109-L120`
**SHA-256:** `218d99afdbef03328786d155dd23766bf87e19a75eb03c5ba1e835922c251d43`

**Preconditions.** BWS-599 stage1 is invoked with a real PostgreSQL password.

**Trigger.** Supply the documented mandatory `--pg-password <password>` argument.

**Expected behavior.** Secrets must enter through a protected file descriptor, restricted environment/secret file, or injected secret provider and must never appear in argv, help examples containing real values, process listings, shell history, or command evidence.

**Current behavior.** The CLI requires and documents a plaintext `--pg-password` value and directly places it into the persistence configuration.

**Impact.** Database credentials can be exposed through shell history, process inspection, audit telemetry, controller command captures, and error/support transcripts. This is direct secret-exposure risk at a release gate.

**Exact evidence.**
- `packages/bootstrap/src/cli/bws-final-local-acceptance.ts` `L23-L38; L109-L120` `218d99afdbef03328786d155dd23766bf87e19a75eb03c5ba1e835922c251d43` — `runBwsFinalLocalAcceptanceCli / help`.
- The production stage1 branch calls `requireFlagValue(options, "--pg-password")`.
- The help contract declares the plaintext argument mandatory.
- No credential was supplied or used during this review.

**Reproduction status.** `STATIC_SOURCE_CONFIRMED; NO_SECRET_RUNTIME_PROBE_PERFORMED`

**Root cause.** The acceptance CLI models a secret as an ordinary command-line scalar rather than a protected secret input.

**Minimal fix boundary.** Remove the password option; consume the same approved atomic configuration resolver/secret source used by the runtime, or accept a restrictive secret-file descriptor. Ensure command/evidence serialization records only source identity and a protected digest, never secret bytes.

**Required tests.**
- Process argv contains no database password.
- Help and error output contain no secret.
- Secret file permissions/symlink/path confinement fail closed.
- Final acceptance and runtime resolve the same atomic database tuple.

**Regression risks.**
- Automation that currently supplies the flag must migrate atomically.
- Secret digest artifacts must not enable low-entropy offline guessing.

**Secondary sectors:** R03, R07, R09, R11, R12

**Aliases/dependencies.**
- BWS120-R07-002 owns output redaction but cannot make argv secret transport safe.

**Unchanged areas.**
- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, deployed service, account, credential, wallet, signer, or persistent database was contacted.
- No controller, scheduler, worker, API, lifecycle service, release apply, database command, Git pull, Git push, or live operation was started.
- BWS-600 remains BLOCKED_EXTERNAL_RUNTIME_EVIDENCE, BWS-710 remains blocked on an accepted upstream runtime resource, and BWS-900 remains parked.

### BWS121-R10-008 — PostgreSQL subprocesses inherit ambient libpq control variables

**Severity:** P1
**Confidence:** HIGH
**Primary source:** `packages/persistence/src/psql.ts` `L191-L217`
**SHA-256:** `86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343`

**Preconditions.** The invoking process contains ambient libpq variables not represented by `SurebetPersistenceConfig`, such as PGOPTIONS, PGSERVICE, PGSERVICEFILE, PGPASSFILE, PGSSLMODE, PGSSLROOTCERT, or related controls.

**Trigger.** Run migrations, repository SQL, backup, restore, or database lifecycle utilities.

**Expected behavior.** Database subprocesses must receive a minimal explicit environment consistent with the validated persistence tuple and security policy; unsupported ambient libpq controls must be removed or explicitly validated and receipt-bound.

**Current behavior.** Both helpers pass `process.env` wholesale and only optionally overwrite PGPASSWORD. Explicit `-d/-U/-p/-h` arguments bind the main target tuple, but other authentication, TLS, service, and session controls remain ambient.

**Impact.** Database security/session behavior can differ from the reviewed tuple, and release or migration evidence cannot prove the exact libpq configuration used. Ambient variables can weaken TLS, inject session options, or alter credential resolution where an explicit password is absent.

**Exact evidence.**
- `packages/persistence/src/psql.ts` `L191-L217` `86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343` — `runPsql`.
- `packages/bootstrap/src/operations/database-lifecycle.ts` `L1412-L1435` `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377` — `runUtilityCommand`.
- Static process-spawn dataflow proves the complete ambient environment reaches psql/pg_dump.
- The Wave 01 ledger recorded this exact issue as `BWS116-R03-HYP-001` for R10 policy resolution; R10 source review supplies the missing configuration-policy proof.

**Reproduction status.** `STATIC_SOURCE_CONFIRMED; DYNAMIC_POSTGRESQL_PROBE_UNAVAILABLE because psql/PostgreSQL were absent and persistent database access was prohibited`

**Root cause.** Persistence configuration validates explicit fields but subprocess construction does not make those fields the complete authority for libpq behavior.

**Minimal fix boundary.** Construct a minimal subprocess environment; set only deliberate locale/PATH/temp variables plus the approved password transport; reject or explicitly map each supported PG* variable; bind the resulting policy to database and release evidence.

**Required tests.**
- Ambient PGOPTIONS, PGSERVICE, PGPASSFILE, PGSSLMODE, and PGSSLROOTCERT are rejected or absent in a fake psql child.
- Explicit approved password transport remains available without argv leakage.
- Backup, restore, migration, and repository paths share one environment builder.
- Disposable PostgreSQL test verifies intended TLS/session/target behavior under canonical Node 20.

**Regression risks.**
- Removing certificate or Kerberos variables may break legitimate deployments unless explicitly modeled.
- PATH/locale/temp variables still need a constrained cross-platform policy.

**Secondary sectors:** R03, R08, R09, R11

**Aliases/dependencies.**
- Promotes and supersedes the unresolved classification of BWS116-R03-HYP-001; the original hypothesis ID remains preserved as an alias/dependency.

**Unchanged areas.**
- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, deployed service, account, credential, wallet, signer, or persistent database was contacted.
- No controller, scheduler, worker, API, lifecycle service, release apply, database command, Git pull, Git push, or live operation was started.
- BWS-600 remains BLOCKED_EXTERNAL_RUNTIME_EVIDENCE, BWS-710 remains blocked on an accepted upstream runtime resource, and BWS-900 remains parked.

### BWS121-R10-009 — open_log.sh accepts arbitrary out-of-repository run directories and follows selected files

**Severity:** P1
**Confidence:** HIGH
**Primary source:** `open_log.sh` `L16-L45; L74-L84`
**SHA-256:** `3a9886b0439c468483142d77e22bcab874c14fb2dd50c5293d014727f0c7a7b1`

**Preconditions.** An operator, wrapper, or copied command supplies `--run-dir` or a managed log path is replaced by a symlink.

**Trigger.** Run `open_log.sh` in controller/codex/paper/bugfix/implementation mode, or runtime mode against a replaced log path.

**Expected behavior.** Log readers must resolve one canonical non-symlink file beneath the approved repository artifact/runtime roots and must reject absolute paths, traversal, alternate roots, and symlink components.

**Current behavior.** The explicit run directory is accepted whenever `-d` succeeds, with no canonical containment check. The selected log is only tested with `-f`, which follows symlinks. Runtime log lookup also checks existence but not symlink/realpath confinement.

**Impact.** Operator tooling can display unrelated files as BWS evidence and can copy secrets or misleading content into terminals, support logs, or retained transcripts. It also defeats the repository-boundary guarantee expected from standardized helpers.

**Exact evidence.**
- `open_log.sh` `L16-L45; L74-L84` `3a9886b0439c468483142d77e22bcab874c14fb2dd50c5293d014727f0c7a7b1` — `argument parser / run directory selection / tail`.
- `scripts/bws-root-wrapper-runtime.mjs` `L215-L224` `1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8` — `printRuntimeLogPath`.
- A bounded probe supplied an absolute external run directory containing controller.log; the real helper exited zero and printed the outside sentinel.
- No privilege escalation is required or claimed; the defect is evidence/repository confinement.

**Reproduction status.** `STATIC_SOURCE_CONFIRMED; BOUNDED_OFFLINE_OUTSIDE_RUN_DIRECTORY_PROBE_CONFIRMED`

**Root cause.** The helper treats caller-selected filesystem existence as sufficient authority and never binds the path to an approved artifact generation/root.

**Minimal fix boundary.** Accept only a run identity or repo-relative path under canonical artifacts roots; reject absolute/traversal paths and every symlink segment; open the final file with no-follow semantics where supported; preserve runtime-role allowlisting.

**Required tests.**
- Absolute and traversal run directories reject.
- Outside and intermediate symlink paths reject.
- Symlinked controller.log rejects.
- Valid artifact generations and runtime role logs remain readable.
- Displayed file identity is bound to the selected run/evidence generation.

**Regression risks.**
- Historical artifact layouts need an explicit allowlisted compatibility map.
- Portable no-follow behavior differs across platforms.

**Secondary sectors:** R07, R11, R12

**Aliases/dependencies.**
- BWS120-R07-001 owns writable observability log-directory escape. R10-009 is the distinct standardized reader/confinement defect.

**Unchanged areas.**
- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, deployed service, account, credential, wallet, signer, or persistent database was contacted.
- No controller, scheduler, worker, API, lifecycle service, release apply, database command, Git pull, Git push, or live operation was started.
- BWS-600 remains BLOCKED_EXTERNAL_RUNTIME_EVIDENCE, BWS-710 remains blocked on an accepted upstream runtime resource, and BWS-900 remains parked.

### BWS121-R10-010 — The source-handoff archive includes nested environment, secret, key, and runtime-state files

**Severity:** P0
**Confidence:** HIGH
**Primary source:** `scripts/create-source-handoff-archive.sh` `L6-L10; L83-L125`
**SHA-256:** `3636462392c76a66fae28b84eafd04a7a7db689e63d815bc82855b58f86e2f49`

**Preconditions.** Sensitive files exist below nested directories using names such as `.env`, `secrets/`, `credentials/`, `*.key`, database files, or runtime-state paths.

**Trigger.** Create the advertised source handoff archive and transmit or retain it as source-only material.

**Expected behavior.** Every source archive helper must share one path-aware exclusion policy that rejects nested secret/env/key/database/runtime material and must verify the produced member list before publication.

**Current behavior.** The tar helper excludes only the repository-root `.env` and broad top-level build/artifact directories. It has no nested basename or directory rules for `.env`, secrets, credentials, keys, databases, or runtime state, despite claiming those categories are excluded. `zip_codebase.sh` implements materially stronger nested rules, so two official archive paths disagree.

**Impact.** A source handoff can disclose credentials, private keys, local databases, and retained runtime evidence. The archive label falsely implies a source-only, secret-free artifact.

**Exact evidence.**
- `scripts/create-source-handoff-archive.sh` `L6-L10; L83-L125` `3636462392c76a66fae28b84eafd04a7a7db689e63d815bc82855b58f86e2f49` — `source handoff exclusions`.
- `zip_codebase.sh` `L27-L55` `7c9090876b6c558709f6e03a979144f07f501306109ffcc7e6cf95fafc5100a9` — `zc_is_excluded_path (safe comparator)`.
- A bounded disposable source tree containing `config/.env`, `nested/secrets/token.txt`, `nested/private.key`, and `runtime/state.json` produced a successful handoff archive containing all four members.
- The production tar exclusion list contains no equivalent of the nested path policy in `zip_codebase.sh`.

**Reproduction status.** `STATIC_SOURCE_CONFIRMED; BOUNDED_OFFLINE_ARCHIVE_MEMBER_PROBE_CONFIRMED`

**Root cause.** Archive exclusion policy is duplicated and implemented as a narrow tar argument list rather than one canonical member-selection and post-build verification contract.

**Minimal fix boundary.** Reuse one canonical archive member policy for both helpers; construct an explicit member list; reject all secret/runtime/database/key/certificate patterns at any depth; fail on symlinks; verify the finished archive against the policy before publication.

**Required tests.**
- Nested `.env` and `.env.*` exclusion while retaining templates.
- Nested secrets/.secrets/credentials exclusion.
- Key/certificate/database/runtime-state exclusion at any depth.
- Archive-member postcondition validation and adversarial basename/case tests.
- Parity test proving tar and zip helpers select the same source members.

**Regression risks.**
- Overbroad patterns may exclude legitimate documentation fixtures; exceptions must be explicit and non-secret.
- Existing downstream tooling may expect current tar member layout.

**Secondary sectors:** R07, R09, R11, R12

**Aliases/dependencies.**
- R09 owns release package authority; R10 owns repository helper path/secret policy.
- KNOWN_BASELINE_MANIFEST_DRIFT remains R11-owned and is unrelated.

**Unchanged areas.**
- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, deployed service, account, credential, wallet, signer, or persistent database was contacted.
- No controller, scheduler, worker, API, lifecycle service, release apply, database command, Git pull, Git push, or live operation was started.
- BWS-600 remains BLOCKED_EXTERNAL_RUNTIME_EVIDENCE, BWS-710 remains blocked on an accepted upstream runtime resource, and BWS-900 remains parked.

### BWS121-R10-011 — update_git.sh secret-path guard misses nested environment and credential directories before push

**Severity:** P0
**Confidence:** HIGH
**Primary source:** `update_git.sh` `L209-L232; L398-L414`
**SHA-256:** `afdd43955e7513016f5e53770faf9523df7ae9827608931ed81d168519dce3fe`

**Preconditions.** A nested secret-like file is tracked or newly staged, and an operator runs `update_git.sh --acp` or another path that commits and pushes.

**Trigger.** Stage paths such as `config/.env`, `nested/secrets/token.txt`, or `nested/credentials/token.txt`.

**Expected behavior.** The pre-commit/push guard must evaluate basenames and directory segments at every depth, use the same canonical secret policy as archive helpers, and fail before commit when any protected path is staged.

**Current behavior.** The case patterns match `.env` only at repository root and secrets/.secrets/credentials only as the first path segment. `git add -A` stages everything before the guard, and a passing guard permits commit and push.

**Impact.** Nested credentials or environment files can be committed and pushed by the repository’s standard synchronization helper, causing durable secret exposure and repository contamination.

**Exact evidence.**
- `update_git.sh` `L209-L232; L398-L414` `afdd43955e7513016f5e53770faf9523df7ae9827608931ed81d168519dce3fe` — `secret_like_path / refuse_secret_commit / ACP flow`.
- A bounded function probe returned “not secret” for `config/.env`, `nested/secrets/token.txt`, and `nested/credentials/token.txt`, while correctly blocking only root forms.
- The ACP flow performs `git add -A`, then the incomplete guard, then commit and push.
- No commit or remote push was performed during review.

**Reproduction status.** `STATIC_SOURCE_CONFIRMED; BOUNDED_OFFLINE_PATH_MATCH_PROBE_CONFIRMED; NO_REMOTE_OPERATION`

**Root cause.** The secret guard uses root-anchored shell patterns instead of normalized basename and path-segment policy shared with packaging.

**Minimal fix boundary.** Normalize staged paths, reject unsafe/control-character forms, evaluate protected basenames and directory segments at every depth, optionally add content scanning for high-confidence credentials, and reuse the archive secret policy. Unstage or abort cleanly on failure.

**Required tests.**
- Nested `.env`/`.env.*`, secrets, .secrets, and credentials reject.
- Template env files remain allowed only under explicit rules.
- Renames/deletions, spaces, Unicode, and newline-hostile Git paths are handled safely using NUL-delimited output.
- No commit or push occurs when any path is blocked.

**Regression risks.**
- Legitimate credential-named test fixtures may require explicit non-secret allowlisting.
- Path parsing must use `-z` to avoid introducing filename parsing defects.

**Secondary sectors:** R11, R12

**Aliases/dependencies.**
- BWS121-R10-010 shares the canonical secret-path policy but has a distinct archive correction boundary.

**Unchanged areas.**
- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, deployed service, account, credential, wallet, signer, or persistent database was contacted.
- No controller, scheduler, worker, API, lifecycle service, release apply, database command, Git pull, Git push, or live operation was started.
- BWS-600 remains BLOCKED_EXTERNAL_RUNTIME_EVIDENCE, BWS-710 remains blocked on an accepted upstream runtime resource, and BWS-900 remains parked.

### BWS121-R10-012 — update_git.sh permanently removes all repository-local HTTP extraheader configuration

**Severity:** P2
**Confidence:** HIGH
**Primary source:** `update_git.sh` `L122-L178`
**SHA-256:** `afdd43955e7513016f5e53770faf9523df7ae9827608931ed81d168519dce3fe`

**Preconditions.** The repository has one or more local `http.extraheader` or URL-scoped extraheader values and uses a GitHub HTTPS origin.

**Trigger.** Run a token-backed pull or push through `update_git.sh`.

**Expected behavior.** The helper must use command-scoped `git -c` overrides without mutating unrelated persistent repository configuration, or it must snapshot and restore any narrowly justified change transactionally.

**Current behavior.** Before the command, the helper unsets every matching local extraheader and never restores it. The same command already supplies empty command-scoped `-c ...extraheader=` values, so permanent mutation is not required for that invocation.

**Impact.** Unrelated authentication/proxy/tooling configuration is silently destroyed, causing later Git operations or integrations to fail and making wrapper execution non-idempotent.

**Exact evidence.**
- `update_git.sh` `L122-L178` `afdd43955e7513016f5e53770faf9523df7ae9827608931ed81d168519dce3fe` — `clear_local_extraheaders_quietly / git_with_token_if_needed`.
- A bounded disposable Git repository was configured with generic and URL-scoped extraheaders. Calling the production function removed both, and the post-state was empty.
- No network or remote Git operation was performed.

**Reproduction status.** `STATIC_SOURCE_CONFIRMED; BOUNDED_LOCAL_GIT_CONFIG_MUTATION_PROBE_CONFIRMED`

**Root cause.** A transient credential-isolation requirement is implemented as permanent broad repository configuration deletion.

**Minimal fix boundary.** Remove persistent unsets and rely on command-scoped configuration, or snapshot/restore only exact keys around the command with failure-safe cleanup. Preserve unrelated local Git config byte-for-byte.

**Required tests.**
- Generic and multiple URL-scoped extraheaders are unchanged after success and failure.
- Token-backed command still suppresses inherited headers for that process.
- Interrupted/failed command restores any temporary state.
- Non-GitHub remotes remain untouched.

**Regression risks.**
- Previously hidden credential conflicts may reappear if command-scoped suppression is incomplete.
- Restoration logic must handle multiple values and exact ordering.

**Secondary sectors:** R11, R12

**Unchanged areas.**
- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, deployed service, account, credential, wallet, signer, or persistent database was contacted.
- No controller, scheduler, worker, API, lifecycle service, release apply, database command, Git pull, Git push, or live operation was started.
- BWS-600 remains BLOCKED_EXTERNAL_RUNTIME_EVIDENCE, BWS-710 remains blocked on an accepted upstream runtime resource, and BWS-900 remains parked.

### BWS121-R10-013 — Artifact download accepts first-seen SSH host keys while sending a reusable password

**Severity:** P0
**Confidence:** HIGH
**Primary source:** `pull_artifacts_and_zip_codebase.sh` `L33-L53; L104-L119; L121-L143; L182-L185`
**SHA-256:** `9e7199e2e7efa85963f26374510e7cde6a74eb4cd3f00aca7893de2efe0f6cc7`

**Preconditions.** The target host key is not already trusted, the operator supplies SSH_PASSWORD, and the network or destination authority is compromised or misdirected on first contact.

**Trigger.** Run the standard artifact pull helper.

**Expected behavior.** A noninteractive password-bearing transfer must require a pre-provisioned known-hosts entry or explicit pinned host-key fingerprint and use `StrictHostKeyChecking=yes`; it must not trust an unverified first-seen host.

**Current behavior.** Every ssh/scp path uses `StrictHostKeyChecking=accept-new` while `sshpass` supplies the reusable password. A first-seen key is accepted and persisted without an out-of-band identity check.

**Impact.** A wrong or intercepted first destination can receive the SSH password and supply arbitrary artifact bytes that are then numbered and processed locally. This is both secret exposure and artifact-origin failure.

**Exact evidence.**
- `pull_artifacts_and_zip_codebase.sh` `L33-L53; L104-L119; L121-L143; L182-L185` `9e7199e2e7efa85963f26374510e7cde6a74eb4cd3f00aca7893de2efe0f6cc7` — `pa_get_config / pa_ssh / pa_scp / pa_stream_remote_file`.
- Static tracing shows the password is sourced from environment/`.env` and attached to all three accept-new transfer paths.
- The script requires SSH_HOST and does not use a hard-coded host, which is a safeguard, but it does not bind that host to a trusted key.
- No SSH connection, host, password, or remote artifact was accessed during review.

**Reproduction status.** `STATIC_SOURCE_CONFIRMED; LIVE_NETWORK_REPRODUCTION_PROHIBITED`

**Root cause.** Destination hostname configuration is treated as server identity; first-use host-key trust is delegated to an automatic SSH policy while password authentication is active.

**Minimal fix boundary.** Require a restrictive known-hosts file or explicit fingerprint supplied through protected configuration; use `StrictHostKeyChecking=yes`, a dedicated `UserKnownHostsFile`, and fail before authentication if identity is absent or mismatched. Preserve remote repo basename and archive-integrity checks.

**Required tests.**
- Unknown host key fails before password authentication using a fake ssh executable.
- Pinned matching key succeeds; changed key fails.
- All ssh/scp/pv branches use the same strict options and known-hosts file.
- Command/evidence output never exposes password or known-hosts contents.

**Regression risks.**
- Operators must provision/rotate host keys deliberately.
- Host clusters with multiple legitimate keys require an explicit pin set rather than accept-new.

**Secondary sectors:** R07, R09, R11, R12

**Aliases/dependencies.**
- R01 external API destination proof is separate; this finding concerns the repository artifact-transfer helper.

**Unchanged areas.**
- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, deployed service, account, credential, wallet, signer, or persistent database was contacted.
- No controller, scheduler, worker, API, lifecycle service, release apply, database command, Git pull, Git push, or live operation was started.
- BWS-600 remains BLOCKED_EXTERNAL_RUNTIME_EVIDENCE, BWS-710 remains blocked on an accepted upstream runtime resource, and BWS-900 remains parked.

## Probable findings and hypotheses

### BWS121-R10-PROB-001 — Repository-relative path validation is vulnerable to validation-to-use replacement races

- **Classification/status:** `PROBABLE_FINDING` / `PROBABLE_STATIC_TOCTOU`
- **Why not confirmed:** The validator returns a pathname after lstat/realpath checks; callers later reopen or create through that name. A concurrent rename/symlink replacement appears possible, but a production caller race was not executed under the read-only/no-controller constraints.
- **Required proof:** A bounded disposable race harness against an actual production caller, followed by descriptor-relative/no-follow remediation tests.
- **Source:** `packages/bootstrap/src/operations/repository-paths.ts` `L22-L37; L68-L111` `c1c9f29f472abc2b5f6a571973ca3974fcc3c7206737b29465276aad189f7e57`

### BWS121-R10-HYP-001 — Latest runtime JSON and log reads may accept symlink replacement after existence checks

- **Classification/status:** `HYPOTHESIS` / `UNPROVEN_SEPARATE_ROOT`
- **Why not confirmed:** The reads follow normal filesystem semantics, but the practical root may be inherited writable-path authority from R07/R06 rather than a distinct R10 root cause.
- **Required proof:** Caller-specific symlink/replacement harness and overlap reconciliation with BWS120-R07-001 and lifecycle state ownership.
- **Source:** `scripts/bws-root-wrapper-runtime.mjs` `L215-L224; L617-L622` `1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8`

## Environment blockers

- **BWS121-R10-ENV-001: Canonical Node 20.20.2 was unavailable.** Node 22.16.0 syntax/probe results are supplementary; no canonical Node acceptance is claimed.
- **BWS121-R10-ENV-002: Repository dependencies were absent and were not installed.** TypeScript build and focused compiled test suites were unavailable. Static tracing, validators, shell/JS syntax checks, and external inert probes were used instead.
- **BWS121-R10-ENV-003: psql/PostgreSQL were unavailable and database access was prohibited.** Ambient libpq behavior was confirmed at subprocess-construction level but not against a live/disposable PostgreSQL server.

No external upstream authority was required to decide the R10 source defects. The accepted betting-win runtime handoff remains an inherited external blocker for BWS-600, not a new R10 record.

## Intentional safeguards

- **BWS121-R10-S01:** Root runtime wrappers forcibly set API-only, paper-mode, provider-disabled, and execution-disabled invariants.
- **BWS121-R10-S02:** Persistence configuration rejects blank required fields and requires exactly one host or socket target.
- **BWS121-R10-S03:** External-runtime-preflight CLI already rejects unknown and duplicate flags before file checks.
- **BWS121-R10-S04:** zip_codebase.sh applies path-aware nested secret/runtime/database exclusions and rejects symlink source paths.
- **BWS121-R10-S05:** Managed cockpit build forces API mode and an exact loopback API base URL.
- **BWS121-R10-S06:** Artifact pull requires explicit SSH_HOST and verifies the local archive structurally after transfer.
- **BWS121-R10-S07:** Repository path utility rejects absolute/traversal paths and existing symlink components in non-racing cases.

## Rejected suspicions

- **BWS121-R10-RS01: The `.env.example` mock cockpit default makes managed runtime use mock data.** The managed build script explicitly overrides VITE_BWS_COCKPIT_DATA_MODE=api and binds the exact loopback URL. The template value remains an operator/development hint, not managed-runtime authority.
- **BWS121-R10-RS02: Selective `.env` loading imports unrelated file secrets.** The parser loads only the named runtime/POSTGRES/retired-key set. The confirmed R10-001 issue is full ambient process inheritance, not unrelated `.env` import.
- **BWS121-R10-RS03: `watch_progress.sh --base-url` contacts the supplied URL.** The option is explicitly compatibility-only and is merely echoed; progress remains local. Runtime-summary destination authority is separately covered by R10-004.
- **BWS121-R10-RS04: update_git executable-manifest import establishes a separate trusted-code boundary.** The helper and imported working-tree manifest are both mutable repository code executed by the operator. This does not create a distinct boundary beyond the inherent decision to execute an untrusted working tree; no separate finding was assigned.

## Cross-area handoffs

- **BWS121-R10-X01 → R01:** Keep BWS116-R01-009 as owner of external upstream API destination proof. R10-004 covers the separate runtime-status state-selected destination.
- **BWS121-R10-X02 → R03:** Consume R10-002 and R10-008 for atomic database configuration and subprocess environment; R03 retains transaction, schema, and durable-state mechanics.
- **BWS121-R10-X03 → R06:** Managed child lifecycle must consume the bounded environment from R10-001; R06 retains child ownership, cancellation, and shutdown mechanics.
- **BWS121-R10-X04 → R07:** R07-001/R07-002 remain owners of writable log-path and output-redaction roots. R10 owns standardized reader confinement and secret transport/path policy.
- **BWS121-R10-X05 → R08:** Backup/restore/retention must consume the atomic database tuple and bounded libpq environment without duplicating R08 target and deletion findings.
- **BWS121-R10-X06 → R09:** Release/upgrade/soak/final acceptance must consume strict argument parsing and the effective configuration receipt; R09-005/R09-006/R09-019 remain stable.
- **BWS121-R10-X07 → R11:** Add production-entrypoint tests for every R10 finding, explain false-green validators, and retain ownership of KNOWN_BASELINE_MANIFEST_DRIFT/runtime enforcement.
- **BWS121-R10-X08 → R12:** Automation/controller consumers must use confined log/artifact paths, strict secret guards, pinned transfer identity, and normalized command receipts.

## Test and validator gaps

- **BWS121-R10-TG-01:** No test proves unrelated ambient process secrets and control variables are absent from managed children.
- **BWS121-R10-TG-02:** No cross-entrypoint test enforces one atomic PostgreSQL source/precedence policy.
- **BWS121-R10-TG-03:** No blank-versus-missing precedence matrix covers process, `.env`, defaults, zero, and false-like values.
- **BWS121-R10-TG-04:** No runtime-summary test rejects state-selected external/private/wrong-port/redirect destinations.
- **BWS121-R10-TG-05:** Root CLI tests inspect source markers but never execute the exported bin from an unrelated current directory.
- **BWS121-R10-TG-06:** Release, database, soak, and final-acceptance CLIs lack unknown/duplicate flag tests equivalent to external preflight.
- **BWS121-R10-TG-07:** No test asserts that database passwords are absent from argv, process listings, help-derived commands, and controller captures.
- **BWS121-R10-TG-08:** No fake-psql test records and rejects ambient libpq control variables.
- **BWS121-R10-TG-09:** open_log tests cover valid runtime logs only; outside, traversal, and symlink paths are untested.
- **BWS121-R10-TG-10:** Source-handoff tests cover only root `.env` and broad build directories, not nested secrets, keys, databases, or runtime state.
- **BWS121-R10-TG-11:** update_git tests cover executable modes but not nested secret paths or no-push-on-block behavior.
- **BWS121-R10-TG-12:** No test proves update_git preserves local extraheader values across success and failure.
- **BWS121-R10-TG-13:** No fake-SSH test requires a pinned host key before password authentication across every transfer branch.
- **BWS121-R10-TG-14:** No descriptor-relative/no-follow race test exercises repository path validation through a production caller.

The read-only validators executed in this environment all passed, including repository, controller, API-only, runtime-program, artifact-hygiene, no-provider, and no-execution checks. Those passes did not detect any of the 13 R10 findings and are therefore false-green relative to this scope. R11 owns aggregate validator and production-entrypoint coverage truth.

## Prioritized review-only remediation order

1. Remove plaintext secret transport and close direct disclosure paths: R10-007, R10-010, R10-011, R10-013.
2. Establish one typed effective-configuration authority with bounded child environments and atomic source semantics: R10-001, R10-002, R10-003, R10-008.
3. Bind repository, command, path, and destination authority before any build, probe, or file read: R10-004, R10-005, R10-006, R10-009.
4. Remove persistent unrelated Git configuration mutation: R10-012.
5. Resolve the repository-path TOCTOU hypothesis and then add canonical Node 20 production-entrypoint tests for every correction.

This is ordering guidance only. No implementation prompt, overlay, source modification, controller command, or deployment action is produced by R10.

## Explicit unchanged areas

- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, deployed service, account, credential, wallet, signer, or persistent database was contacted.
- No controller, scheduler, worker, API, lifecycle service, release apply, database command, Git pull, Git push, or live operation was started.
- BWS-600 remains BLOCKED_EXTERNAL_RUNTIME_EVIDENCE, BWS-710 remains blocked on an accepted upstream runtime resource, and BWS-900 remains parked.
- All 137 inherited finding IDs and their owners remain stable.
- The 38 added and two edited BWS121 files are documentation only; executable lineage is unchanged from BWS120.
- `KNOWN_BASELINE_MANIFEST_DRIFT` remains R11-owned and was not assigned an R10 finding ID.

## Completion reconciliation

- Archive identity independently verified: **yes** (`025936d21db89ac5cf4881863f05ec9ed5ddaaa2b4adfe60e766207fc4c9b9f7`).
- Coverage rows reconcile: **yes** (733 rows for 733 members).
- Primary production paths, callers, wrappers, focused tests, and validators traced: **yes**.
- Inherited 137 IDs overlap-checked: **yes**, zero duplicate roots created.
- Every confirmed finding has exact current source path, symbol, line range, and full-file hash: **yes**.
- Repository mutation check: **PASS_BYTE_IDENTICAL**.
- Provider/external API/SSH/database/credential/live-operation access: **none**.
- Canonical Node 20 acceptance: **unavailable and not claimed**.
