
# BWS-W4-T38 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W4-T38
CAMPAIGN_ORDER: 3
STAGE: S1
PRIMARY_OWNER: R10
SECONDARY_REVIEWERS: R01, R03, R06, R07, R08, R09, R11, R12
ISSUE_IDS: BWS121-R10-004, BWS121-R10-005, BWS121-R10-006, BWS121-R10-007, BWS121-R10-009
SEVERITY_COUNTS: {"P0": 2, "P1": 3}
DEPENDENCIES: T37, T39
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen application-source baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; documentation-audit preimage betting-win-surebet125.zip sha256=72a8262a5f94d144bb930cc9fb2778eed672d2a97a252f49b07f7b979b47224f with 995 regular files and no accepted remediation source result; this overlay changes documentation only; exact checkout/Git/source state must be reverified before editing
CURRENT_SOURCE_PATH_CANDIDATES: cli.js, open_log.sh, package.json, packages/bootstrap/src/cli/bws-database-lifecycle.ts, packages/bootstrap/src/cli/bws-external-runtime-preflight.ts, packages/bootstrap/src/cli/bws-final-local-acceptance.ts, packages/bootstrap/src/cli/bws-release-packaging.ts, packages/bootstrap/src/cli/bws-release-upgrade.ts, packages/bootstrap/src/cli/bws-soak-campaign.ts, scripts/bws-root-wrapper-runtime.mjs
SYMBOLS_TO_REVERIFY: 12 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: cli.js, open_log.sh, package.json, packages/bootstrap/src/cli/bws-database-lifecycle.ts, packages/bootstrap/src/cli/bws-final-local-acceptance.ts, packages/bootstrap/src/cli/bws-soak-campaign.ts, scripts/bws-root-wrapper-runtime.mjs
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites `all upstream tranches referenced by the affected findings; current-source re-verification before implementation`
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 22 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 22 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 11 classified records below
CONCURRENCY_OR_CRASH_TESTS: 2 classified records below
ENVIRONMENT_PROOF: {"AS_SPECIFIED_BY_REVIEW": 22}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: Repository-bound CLI/status/log destinations, exact flag parsing, and secret-free PostgreSQL invocation.
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": true, "bws_710": false, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W3-T26 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `cli.js` | present=yes | sha256=acd4aa4ba64dbcacbc891ffe1af22699d9a240f16d3411ac3ea6998048d63349 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `open_log.sh` | present=yes | sha256=3a9886b0439c468483142d77e22bcab874c14fb2dd50c5293d014727f0c7a7b1 | mode=0755 | authorization=TO_CONFIRM_DURING_ADMISSION
- `package.json` | present=yes | sha256=b1b69ffa6d0b974c3b3ba55f3ec1acffb21e512c3a862e2a7b2d6b5139e5eac0 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/cli/bws-database-lifecycle.ts` | present=yes | sha256=4e6da6bfca8e7c622ccd04e66d3789b4f4eaf490f93fd8265bfa458d3c22b06a | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/cli/bws-external-runtime-preflight.ts` | present=yes | sha256=b02200f62578bd2b273c0e9df020132b8dd49e613fc5a788555efda2dc0d8c5f | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/cli/bws-final-local-acceptance.ts` | present=yes | sha256=218d99afdbef03328786d155dd23766bf87e19a75eb03c5ba1e835922c251d43 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/cli/bws-release-packaging.ts` | present=yes | sha256=a3f0d96bd9d3e3c45df37538dd99f4c07eb27934fd77eb4d80cc3143edef4ec7 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/cli/bws-release-upgrade.ts` | present=yes | sha256=362783fada2194c4c62c5bd1b545270c4f94ea358a816f45051c0b95a870daa7 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/cli/bws-soak-campaign.ts` | present=yes | sha256=55a3b486f879b367fb30e3d67b465e457f1f258c209d131603ce3916e51e534a | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `scripts/bws-root-wrapper-runtime.mjs` | present=yes | sha256=1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS121-R10-004 | `scripts/bws-root-wrapper-runtime.mjs` | symbol=createRuntimeSummary / fetchJson | reviewed_line_range=L331-L356; L624-L667 | reviewed_sha256=1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8
- BWS121-R10-005 | `cli.js` | symbol=root command dispatch / runBuiltEntry | reviewed_line_range=L1-L16; L29-L36; L92-L108 | reviewed_sha256=acd4aa4ba64dbcacbc891ffe1af22699d9a240f16d3411ac3ea6998048d63349
- BWS121-R10-005 | `package.json` | symbol=bin.betting-win-surebet | reviewed_line_range=L76-L78 | reviewed_sha256=b1b69ffa6d0b974c3b3ba55f3ec1acffb21e512c3a862e2a7b2d6b5139e5eac0
- BWS121-R10-006 | `packages/bootstrap/src/cli/bws-final-local-acceptance.ts` | symbol=parseFlags | reviewed_line_range=L124-L142 | reviewed_sha256=218d99afdbef03328786d155dd23766bf87e19a75eb03c5ba1e835922c251d43
- BWS121-R10-006 | `packages/bootstrap/src/cli/bws-release-packaging.ts` | symbol=parseFlags | reviewed_line_range=L75-L93 | reviewed_sha256=a3f0d96bd9d3e3c45df37538dd99f4c07eb27934fd77eb4d80cc3143edef4ec7
- BWS121-R10-006 | `packages/bootstrap/src/cli/bws-release-upgrade.ts` | symbol=parseFlags | reviewed_line_range=L91-L109 | reviewed_sha256=362783fada2194c4c62c5bd1b545270c4f94ea358a816f45051c0b95a870daa7
- BWS121-R10-006 | `packages/bootstrap/src/cli/bws-database-lifecycle.ts` | symbol=parseFlags | reviewed_line_range=L95-L113 | reviewed_sha256=4e6da6bfca8e7c622ccd04e66d3789b4f4eaf490f93fd8265bfa458d3c22b06a
- BWS121-R10-006 | `packages/bootstrap/src/cli/bws-soak-campaign.ts` | symbol=parseFlags | reviewed_line_range=L156-L174 | reviewed_sha256=55a3b486f879b367fb30e3d67b465e457f1f258c209d131603ce3916e51e534a
- BWS121-R10-006 | `packages/bootstrap/src/cli/bws-external-runtime-preflight.ts` | symbol=parseFlags (strict comparator) | reviewed_line_range=L101-L125 | reviewed_sha256=b02200f62578bd2b273c0e9df020132b8dd49e613fc5a788555efda2dc0d8c5f
- BWS121-R10-007 | `packages/bootstrap/src/cli/bws-final-local-acceptance.ts` | symbol=runBwsFinalLocalAcceptanceCli / help | reviewed_line_range=L23-L38; L109-L120 | reviewed_sha256=218d99afdbef03328786d155dd23766bf87e19a75eb03c5ba1e835922c251d43
- BWS121-R10-009 | `open_log.sh` | symbol=argument parser / run directory selection / tail | reviewed_line_range=L16-L45; L74-L84 | reviewed_sha256=3a9886b0439c468483142d77e22bcab874c14fb2dd50c5293d014727f0c7a7b1
- BWS121-R10-009 | `scripts/bws-root-wrapper-runtime.mjs` | symbol=printRuntimeLogPath | reviewed_line_range=L215-L224 | reviewed_sha256=1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS121-R10-004 — Runtime status probes trust a mutable state-selected base URL without destination confinement

- Severity: `P1`
- Current behavior: The helper parses `state.runtimeBaseUrl`, constructs `/metrics`, `/health`, and `/readiness`, then issues HTTP(S) requests without validating host class, port ownership, userinfo, state provenance, or equality with the current effective configuration before the requests.
- Expected behavior: Status probes must derive or verify a loopback-only URL from current validated configuration and bound lifecycle identity, reject credentials and unsupported schemes, and never follow an untrusted state-selected destination.
- Invariant: Status probes must derive or verify a loopback-only URL from current validated configuration and bound lifecycle identity, reject credentials and unsupported schemes, and never follow an untrusted state-selected destination.
- Root cause: Runtime state is treated as trusted destination authority rather than evidence that must be authenticated against current lifecycle/configuration authority.
- Trigger: Run `runtime-summary`, `check_progress.sh`, or `watch_progress.sh`.
- Minimal fix boundary: Derive the expected loopback URL from validated effective configuration; require the state URL to match it and the active lifecycle generation before any request; reject userinfo, non-http, non-loopback, mapped-loopback ambiguity, redirects, and unexpected ports.
- Regression risks:
- Status of legacy state files without generation/configuration receipts will become unavailable.
- IPv6 loopback support requires one explicit policy.

### BWS121-R10-005 — The exported package CLI treats the caller current directory as repository authority and executes its build

- Severity: `P0`
- Current behavior: All paths are relative and spawn calls omit `cwd`. `status` reads the caller `PROJECT_STATUS.md`; `validate` and runtime commands run the caller `npm run ...`; built entrypoints are also resolved relative to the caller.
- Expected behavior: The public bin must bind to an authenticated repository/package root derived from its own installation or require an explicit validated repository root. It must never execute package scripts or relative dist files from an arbitrary caller directory.
- Invariant: The public bin must bind to an authenticated repository/package root derived from its own installation or require an explicit validated repository root. It must never execute package scripts or relative dist files from an arbitrary caller directory.
- Root cause: The bin conflates invocation working directory with package/repository identity and performs no root marker, realpath, or package identity verification.
- Trigger: Run `betting-win-surebet status`, `validate`, or any command routed through `runBuiltEntry`.
- Minimal fix boundary: Resolve the installed package root from `import.meta.url`, or require and validate an explicit repository root with package name/version and canonical realpath checks. Pass that root as `cwd` to every child and use absolute entrypoint paths. Fail before npm/node execution on mismatch.
- Regression risks:
- Global installs, workspace links, and packed consumers may have different package-root layouts.
- Repository-development mode may need an explicit and tested root override.

### BWS121-R10-006 — Safety-critical CLIs silently accept unknown flags and overwrite duplicate flags

- Severity: `P1`
- Current behavior: Five production CLIs accept every `--...` key into a Map and silently overwrite earlier occurrences. Unknown keys remain ignored by command logic. The external-runtime-preflight CLI already implements the required allowlist and duplicate rejection, proving the repository has two incompatible parser policies.
- Expected behavior: Each command must define an exact option allowlist, reject unknown options, reject duplicate options before file or side-effect work, and preserve the distinction between a missing value and a boolean switch.
- Invariant: Each command must define an exact option allowlist, reject unknown options, reject duplicate options before file or side-effect work, and preserve the distinction between a missing value and a boolean switch.
- Root cause: Flag parsing is duplicated across CLIs without one strict command schema or shared parser contract.
- Trigger: Invoke release packaging, release upgrade, database lifecycle, soak, or final-local-acceptance commands.
- Minimal fix boundary: Adopt one shared parser with per-command allowed flags, arity/type metadata, duplicate rejection, and deterministic normalized invocation receipts. Preserve valid documented commands and the existing strict external-preflight behavior.
- Regression risks:
- Existing wrappers may accidentally pass ignored flags and begin failing.
- Subcommands with shared flags require command-specific allowlists rather than one global set.

### BWS121-R10-007 — Final local acceptance requires the PostgreSQL password in process arguments

- Severity: `P0`
- Current behavior: The CLI requires and documents a plaintext `--pg-password` value and directly places it into the persistence configuration.
- Expected behavior: Secrets must enter through a protected file descriptor, restricted environment/secret file, or injected secret provider and must never appear in argv, help examples containing real values, process listings, shell history, or command evidence.
- Invariant: Secrets must enter through a protected file descriptor, restricted environment/secret file, or injected secret provider and must never appear in argv, help examples containing real values, process listings, shell history, or command evidence.
- Root cause: The acceptance CLI models a secret as an ordinary command-line scalar rather than a protected secret input.
- Trigger: Supply the documented mandatory `--pg-password <password>` argument.
- Minimal fix boundary: Remove the password option; consume the same approved atomic configuration resolver/secret source used by the runtime, or accept a restrictive secret-file descriptor. Ensure command/evidence serialization records only source identity and a protected digest, never secret bytes.
- Regression risks:
- Automation that currently supplies the flag must migrate atomically.
- Secret digest artifacts must not enable low-entropy offline guessing.

### BWS121-R10-009 — open_log.sh accepts arbitrary out-of-repository run directories and follows selected files

- Severity: `P1`
- Current behavior: The explicit run directory is accepted whenever `-d` succeeds, with no canonical containment check. The selected log is only tested with `-f`, which follows symlinks. Runtime log lookup also checks existence but not symlink/realpath confinement.
- Expected behavior: Log readers must resolve one canonical non-symlink file beneath the approved repository artifact/runtime roots and must reject absolute paths, traversal, alternate roots, and symlink components.
- Invariant: Log readers must resolve one canonical non-symlink file beneath the approved repository artifact/runtime roots and must reject absolute paths, traversal, alternate roots, and symlink components.
- Root cause: The helper treats caller-selected filesystem existence as sufficient authority and never binds the path to an approved artifact generation/root.
- Trigger: Run `open_log.sh` in controller/codex/paper/bugfix/implementation mode, or runtime mode against a replaced log path.
- Minimal fix boundary: Accept only a run identity or repo-relative path under canonical artifacts roots; reject absolute/traversal paths and every symlink segment; open the final file with no-follow semantics where supported; preserve runtime-role allowlisting.
- Regression risks:
- Historical artifact layouts need an explicit allowlisted compatibility map.
- Portable no-follow behavior differs across platforms.


## Allowed edit boundary

- Candidate path set: `cli.js`, `open_log.sh`, `package.json`, `packages/bootstrap/src/cli/bws-database-lifecycle.ts`, `packages/bootstrap/src/cli/bws-external-runtime-preflight.ts`, `packages/bootstrap/src/cli/bws-final-local-acceptance.ts`, `packages/bootstrap/src/cli/bws-release-packaging.ts`, `packages/bootstrap/src/cli/bws-release-upgrade.ts`, `packages/bootstrap/src/cli/bws-soak-campaign.ts`, `scripts/bws-root-wrapper-runtime.mjs`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `cli.js` | participating tranches=T38, T42 | predecessor postimage required
- `open_log.sh` | participating tranches=T29, T38 | predecessor postimage required
- `package.json` | participating tranches=T21, T38, T40, T41, T42, T43 | predecessor postimage required
- `packages/bootstrap/src/cli/bws-database-lifecycle.ts` | participating tranches=T30, T32, T38 | predecessor postimage required
- `packages/bootstrap/src/cli/bws-final-local-acceptance.ts` | participating tranches=T35, T38 | predecessor postimage required
- `packages/bootstrap/src/cli/bws-soak-campaign.ts` | participating tranches=T35, T38 | predecessor postimage required
- `scripts/bws-root-wrapper-runtime.mjs` | participating tranches=T21, T22, T23, T25, T37, T38 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- BWS-600 remains BLOCKED_EXTERNAL_RUNTIME_EVIDENCE, BWS-710 remains blocked on an accepted upstream runtime resource, and BWS-900 remains parked.
- No controller, scheduler, worker, API, lifecycle service, release apply, database command, Git pull, Git push, or live operation was started.
- No provider, external API, deployed service, account, credential, wallet, signer, or persistent database was contacted.
- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- all betting-win source, checkout, documentation, service, database, and runtime
- betting-win; live execution; current BWS-600/BWS-710/BWS-900 holds
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T37, T39.
- Review prerequisites: all upstream tranches referenced by the affected findings; current-source re-verification before implementation.
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

- `BWS121-R10-REQ-013` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-004 | requirement=State URL to external/private/non-loopback destination rejects before socket creation.
- `BWS121-R10-REQ-014` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-004 | requirement=Wrong loopback port and userinfo reject.
- `BWS121-R10-REQ-015` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-004 | requirement=Redirect away from the exact loopback endpoint rejects.
- `BWS121-R10-REQ-016` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-004 | requirement=Stale lifecycle generation cannot select a destination.
- `BWS121-R10-REQ-017` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-004 | requirement=Valid current loopback state still reports status.
- `BWS121-R10-REQ-018` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-005 | requirement=Invoke every public command from an unrelated directory and prove it cannot read or execute caller files.
- `BWS121-R10-REQ-019` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-005 | requirement=Symlinked package/root and lookalike package.json rejection.
- `BWS121-R10-REQ-020` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-005 | requirement=Normal invocation from the authentic repository remains functional.
- `BWS121-R10-REQ-021` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-005 | requirement=Status, validate, build, and dist execution all use the same bound root.
- `BWS121-R10-REQ-022` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-006 | requirement=Unknown flag rejection for every command.
- `BWS121-R10-REQ-023` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-006 | requirement=Duplicate value and duplicate boolean flag rejection before I/O.
- `BWS121-R10-REQ-024` | category=persistence_or_migration | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-006 | requirement=Repeated plan-file/fingerprint/output/database flags cannot select the last value.
- `BWS121-R10-REQ-025` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-006 | requirement=Help text and parser schema stay synchronized.
- `BWS121-R10-REQ-026` | category=persistence_or_migration | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-007 | requirement=Process argv contains no database password.
- `BWS121-R10-REQ-027` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-007 | requirement=Help and error output contain no secret.
- `BWS121-R10-REQ-028` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-007 | requirement=Secret file permissions/symlink/path confinement fail closed.
- `BWS121-R10-REQ-029` | category=concurrency_or_ownership | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-007 | requirement=Final acceptance and runtime resolve the same atomic database tuple.
- `BWS121-R10-REQ-034` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-009 | requirement=Absolute and traversal run directories reject.
- `BWS121-R10-REQ-035` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-009 | requirement=Outside and intermediate symlink paths reject.
- `BWS121-R10-REQ-036` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-009 | requirement=Symlinked controller.log rejects.
- `BWS121-R10-REQ-037` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-009 | requirement=Valid artifact generations and runtime role logs remain readable.
- `BWS121-R10-REQ-038` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-009 | requirement=Displayed file identity is bound to the selected run/evidence generation.

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS121-R10-REQ-013` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-004 | requirement=State URL to external/private/non-loopback destination rejects before socket creation.
- `BWS121-R10-REQ-014` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-004 | requirement=Wrong loopback port and userinfo reject.
- `BWS121-R10-REQ-015` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-004 | requirement=Redirect away from the exact loopback endpoint rejects.
- `BWS121-R10-REQ-016` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-004 | requirement=Stale lifecycle generation cannot select a destination.
- `BWS121-R10-REQ-017` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-004 | requirement=Valid current loopback state still reports status.
- `BWS121-R10-REQ-018` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-005 | requirement=Invoke every public command from an unrelated directory and prove it cannot read or execute caller files.
- `BWS121-R10-REQ-019` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-005 | requirement=Symlinked package/root and lookalike package.json rejection.
- `BWS121-R10-REQ-020` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-005 | requirement=Normal invocation from the authentic repository remains functional.
- `BWS121-R10-REQ-021` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-005 | requirement=Status, validate, build, and dist execution all use the same bound root.
- `BWS121-R10-REQ-022` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-006 | requirement=Unknown flag rejection for every command.
- `BWS121-R10-REQ-023` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-006 | requirement=Duplicate value and duplicate boolean flag rejection before I/O.
- `BWS121-R10-REQ-024` | category=persistence_or_migration | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-006 | requirement=Repeated plan-file/fingerprint/output/database flags cannot select the last value.
- `BWS121-R10-REQ-025` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-006 | requirement=Help text and parser schema stay synchronized.
- `BWS121-R10-REQ-026` | category=persistence_or_migration | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-007 | requirement=Process argv contains no database password.
- `BWS121-R10-REQ-027` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-007 | requirement=Help and error output contain no secret.
- `BWS121-R10-REQ-028` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-007 | requirement=Secret file permissions/symlink/path confinement fail closed.
- `BWS121-R10-REQ-029` | category=concurrency_or_ownership | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-007 | requirement=Final acceptance and runtime resolve the same atomic database tuple.
- `BWS121-R10-REQ-034` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-009 | requirement=Absolute and traversal run directories reject.
- `BWS121-R10-REQ-035` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-009 | requirement=Outside and intermediate symlink paths reject.
- `BWS121-R10-REQ-036` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-009 | requirement=Symlinked controller.log rejects.
- `BWS121-R10-REQ-037` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-009 | requirement=Valid artifact generations and runtime role logs remain readable.
- `BWS121-R10-REQ-038` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-009 | requirement=Displayed file identity is bound to the selected run/evidence generation.

## Negative and adversarial tests

- `BWS121-R10-REQ-014` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-004 | requirement=Wrong loopback port and userinfo reject.
- `BWS121-R10-REQ-016` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-004 | requirement=Stale lifecycle generation cannot select a destination.
- `BWS121-R10-REQ-019` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-005 | requirement=Symlinked package/root and lookalike package.json rejection.
- `BWS121-R10-REQ-020` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-005 | requirement=Normal invocation from the authentic repository remains functional.
- `BWS121-R10-REQ-022` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-006 | requirement=Unknown flag rejection for every command.
- `BWS121-R10-REQ-023` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-006 | requirement=Duplicate value and duplicate boolean flag rejection before I/O.
- `BWS121-R10-REQ-027` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-007 | requirement=Help and error output contain no secret.
- `BWS121-R10-REQ-028` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-007 | requirement=Secret file permissions/symlink/path confinement fail closed.
- `BWS121-R10-REQ-034` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-009 | requirement=Absolute and traversal run directories reject.
- `BWS121-R10-REQ-035` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-009 | requirement=Outside and intermediate symlink paths reject.
- `BWS121-R10-REQ-036` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-009 | requirement=Symlinked controller.log rejects.

## Concurrency, cancellation, crash, and restart tests

- `BWS121-R10-REQ-016` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-004 | requirement=Stale lifecycle generation cannot select a destination.
- `BWS121-R10-REQ-029` | category=concurrency_or_ownership | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-007 | requirement=Final acceptance and runtime resolve the same atomic database tuple.

## Environment proof

- AS_SPECIFIED_BY_REVIEW: 22 requirements

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

Acceptance authority: Repository-bound CLI/status/log destinations, exact flag parsing, and secret-free PostgreSQL invocation.

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W3-T26` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
