
# BWS-W4-T39 implementation packet

> Current campaign state: `ADMITTED` through `activation/active-campaign-admission.json`. This packet defines scope and proof; the immutable activation task and live campaign state control edits.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W4-T39
CAMPAIGN_ORDER: 1
STAGE: S1
PRIMARY_OWNER: R10
SECONDARY_REVIEWERS: R01, R07, R09, R11, R12
ISSUE_IDS: BWS121-R10-010, BWS121-R10-011, BWS121-R10-012, BWS121-R10-013
SEVERITY_COUNTS: {"P0": 3, "P2": 1}
DEPENDENCIES: none
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen review/finding baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; active campaign authority is pinned by activation/immutable-authority.sha256; exact current numbered archive or checkout, extracted-tree digest, Git identity, source paths, hashes, and modes must be captured in an external audit or admission receipt and reverified before editing; repository documentation does not self-attest a rolling numbered ZIP
CURRENT_SOURCE_PATH_CANDIDATES: pull_artifacts_and_zip_codebase.sh, scripts/create-source-handoff-archive.sh, update_git.sh, zip_codebase.sh
SYMBOLS_TO_REVERIFY: 5 detailed records below
ALLOWED_EDIT_BOUNDARY: the immutable activation task admits the four current source-path candidates plus directly necessary proof files under its exact protected-file allowlist; current-source reverification is mandatory and any additional path blocks for reconciliation
READ_ONLY_SHARED_PATHS: none identified by campaign-map shared-path registry
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
FOCUSED_TESTS: 17 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 17 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 7 classified records below
CONCURRENCY_OR_CRASH_TESTS: 0 classified records below
ENVIRONMENT_PROOF: {"AS_SPECIFIED_BY_REVIEW": 17}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: One nested secret policy, non-destructive Git config handling, and pinned SSH destination identity.
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": false, "bws_710": false, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W4-T37 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `pull_artifacts_and_zip_codebase.sh` | present=yes | sha256=9e7199e2e7efa85963f26374510e7cde6a74eb4cd3f00aca7893de2efe0f6cc7 | mode=0755 | authorization=ADMITTED_CANDIDATE_REQUIRES_CURRENT_SOURCE_REVERIFICATION
- `scripts/create-source-handoff-archive.sh` | present=yes | sha256=3636462392c76a66fae28b84eafd04a7a7db689e63d815bc82855b58f86e2f49 | mode=0755 | authorization=ADMITTED_CANDIDATE_REQUIRES_CURRENT_SOURCE_REVERIFICATION
- `update_git.sh` | present=yes | sha256=afdd43955e7513016f5e53770faf9523df7ae9827608931ed81d168519dce3fe | mode=0755 | authorization=ADMITTED_CANDIDATE_REQUIRES_CURRENT_SOURCE_REVERIFICATION
- `zip_codebase.sh` | present=yes | sha256=7c9090876b6c558709f6e03a979144f07f501306109ffcc7e6cf95fafc5100a9 | mode=0755 | authorization=ADMITTED_CANDIDATE_REQUIRES_CURRENT_SOURCE_REVERIFICATION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS121-R10-010 | `scripts/create-source-handoff-archive.sh` | symbol=source handoff exclusions | reviewed_line_range=L6-L10; L83-L125 | reviewed_sha256=3636462392c76a66fae28b84eafd04a7a7db689e63d815bc82855b58f86e2f49
- BWS121-R10-010 | `zip_codebase.sh` | symbol=zc_is_excluded_path (safe comparator) | reviewed_line_range=L27-L55 | reviewed_sha256=7c9090876b6c558709f6e03a979144f07f501306109ffcc7e6cf95fafc5100a9
- BWS121-R10-011 | `update_git.sh` | symbol=secret_like_path / refuse_secret_commit / ACP flow | reviewed_line_range=L209-L232; L398-L414 | reviewed_sha256=afdd43955e7513016f5e53770faf9523df7ae9827608931ed81d168519dce3fe
- BWS121-R10-012 | `update_git.sh` | symbol=clear_local_extraheaders_quietly / git_with_token_if_needed | reviewed_line_range=L122-L178 | reviewed_sha256=afdd43955e7513016f5e53770faf9523df7ae9827608931ed81d168519dce3fe
- BWS121-R10-013 | `pull_artifacts_and_zip_codebase.sh` | symbol=pa_get_config / pa_ssh / pa_scp / pa_stream_remote_file | reviewed_line_range=L33-L53; L104-L119; L121-L143; L182-L185 | reviewed_sha256=9e7199e2e7efa85963f26374510e7cde6a74eb4cd3f00aca7893de2efe0f6cc7

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS121-R10-010 — The source-handoff archive includes nested environment, secret, key, and runtime-state files

- Severity: `P0`
- Current behavior: The tar helper excludes only the repository-root `.env` and broad top-level build/artifact directories. It has no nested basename or directory rules for `.env`, secrets, credentials, keys, databases, or runtime state, despite claiming those categories are excluded. `zip_codebase.sh` implements materially stronger nested rules, so two official archive paths disagree.
- Expected behavior: Every source archive helper must share one path-aware exclusion policy that rejects nested secret/env/key/database/runtime material and must verify the produced member list before publication.
- Invariant: Every source archive helper must share one path-aware exclusion policy that rejects nested secret/env/key/database/runtime material and must verify the produced member list before publication.
- Root cause: Archive exclusion policy is duplicated and implemented as a narrow tar argument list rather than one canonical member-selection and post-build verification contract.
- Trigger: Create the advertised source handoff archive and transmit or retain it as source-only material.
- Minimal fix boundary: Reuse one canonical archive member policy for both helpers; construct an explicit member list; reject all secret/runtime/database/key/certificate patterns at any depth; fail on symlinks; verify the finished archive against the policy before publication.
- Regression risks:
- Overbroad patterns may exclude legitimate documentation fixtures; exceptions must be explicit and non-secret.
- Existing downstream tooling may expect current tar member layout.

### BWS121-R10-011 — update_git.sh secret-path guard misses nested environment and credential directories before push

- Severity: `P0`
- Current behavior: The case patterns match `.env` only at repository root and secrets/.secrets/credentials only as the first path segment. `git add -A` stages everything before the guard, and a passing guard permits commit and push.
- Expected behavior: The pre-commit/push guard must evaluate basenames and directory segments at every depth, use the same canonical secret policy as archive helpers, and fail before commit when any protected path is staged.
- Invariant: The pre-commit/push guard must evaluate basenames and directory segments at every depth, use the same canonical secret policy as archive helpers, and fail before commit when any protected path is staged.
- Root cause: The secret guard uses root-anchored shell patterns instead of normalized basename and path-segment policy shared with packaging.
- Trigger: Stage paths such as `config/.env`, `nested/secrets/token.txt`, or `nested/credentials/token.txt`.
- Minimal fix boundary: Normalize staged paths, reject unsafe/control-character forms, evaluate protected basenames and directory segments at every depth, optionally add content scanning for high-confidence credentials, and reuse the archive secret policy. Unstage or abort cleanly on failure.
- Regression risks:
- Legitimate credential-named test fixtures may require explicit non-secret allowlisting.
- Path parsing must use `-z` to avoid introducing filename parsing defects.

### BWS121-R10-012 — update_git.sh permanently removes all repository-local HTTP extraheader configuration

- Severity: `P2`
- Current behavior: Before the command, the helper unsets every matching local extraheader and never restores it. The same command already supplies empty command-scoped `-c ...extraheader=` values, so permanent mutation is not required for that invocation.
- Expected behavior: The helper must use command-scoped `git -c` overrides without mutating unrelated persistent repository configuration, or it must snapshot and restore any narrowly justified change transactionally.
- Invariant: The helper must use command-scoped `git -c` overrides without mutating unrelated persistent repository configuration, or it must snapshot and restore any narrowly justified change transactionally.
- Root cause: A transient credential-isolation requirement is implemented as permanent broad repository configuration deletion.
- Trigger: Run a token-backed pull or push through `update_git.sh`.
- Minimal fix boundary: Remove persistent unsets and rely on command-scoped configuration, or snapshot/restore only exact keys around the command with failure-safe cleanup. Preserve unrelated local Git config byte-for-byte.
- Regression risks:
- Previously hidden credential conflicts may reappear if command-scoped suppression is incomplete.
- Restoration logic must handle multiple values and exact ordering.

### BWS121-R10-013 — Artifact download accepts first-seen SSH host keys while sending a reusable password

- Severity: `P0`
- Current behavior: Every ssh/scp path uses `StrictHostKeyChecking=accept-new` while `sshpass` supplies the reusable password. A first-seen key is accepted and persisted without an out-of-band identity check.
- Expected behavior: A noninteractive password-bearing transfer must require a pre-provisioned known-hosts entry or explicit pinned host-key fingerprint and use `StrictHostKeyChecking=yes`; it must not trust an unverified first-seen host.
- Invariant: A noninteractive password-bearing transfer must require a pre-provisioned known-hosts entry or explicit pinned host-key fingerprint and use `StrictHostKeyChecking=yes`; it must not trust an unverified first-seen host.
- Root cause: Destination hostname configuration is treated as server identity; first-use host-key trust is delegated to an automatic SSH policy while password authentication is active.
- Trigger: Run the standard artifact pull helper.
- Minimal fix boundary: Require a restrictive known-hosts file or explicit fingerprint supplied through protected configuration; use `StrictHostKeyChecking=yes`, a dedicated `UserKnownHostsFile`, and fail before authentication if identity is absent or mismatched. Preserve remote repo basename and archive-integrity checks.
- Regression risks:
- Operators must provision/rotate host keys deliberately.
- Host clusters with multiple legitimate keys require an explicit pin set rather than accept-new.


## Allowed edit boundary

- Candidate path set: `pull_artifacts_and_zip_codebase.sh`, `scripts/create-source-handoff-archive.sh`, `update_git.sh`, `zip_codebase.sh`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- No campaign-map multi-tranche path is in this candidate set

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

- Dependency terminal receipts: none.
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

- `BWS121-R10-REQ-039` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-010 | requirement=Nested `.env` and `.env.*` exclusion while retaining templates.
- `BWS121-R10-REQ-040` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-010 | requirement=Nested secrets/.secrets/credentials exclusion.
- `BWS121-R10-REQ-041` | category=persistence_or_migration | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-010 | requirement=Key/certificate/database/runtime-state exclusion at any depth.
- `BWS121-R10-REQ-042` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-010 | requirement=Archive-member postcondition validation and adversarial basename/case tests.
- `BWS121-R10-REQ-043` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-010 | requirement=Parity test proving tar and zip helpers select the same source members.
- `BWS121-R10-REQ-044` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-011 | requirement=Nested `.env`/`.env.*`, secrets, .secrets, and credentials reject.
- `BWS121-R10-REQ-045` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-011 | requirement=Template env files remain allowed only under explicit rules.
- `BWS121-R10-REQ-046` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-011 | requirement=Renames/deletions, spaces, Unicode, and newline-hostile Git paths are handled safely using NUL-delimited output.
- `BWS121-R10-REQ-047` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-011 | requirement=No commit or push occurs when any path is blocked.
- `BWS121-R10-REQ-048` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-012 | requirement=Generic and multiple URL-scoped extraheaders are unchanged after success and failure.
- `BWS121-R10-REQ-049` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-012 | requirement=Token-backed command still suppresses inherited headers for that process.
- `BWS121-R10-REQ-050` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-012 | requirement=Interrupted/failed command restores any temporary state.
- `BWS121-R10-REQ-051` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-012 | requirement=Non-GitHub remotes remain untouched.
- `BWS121-R10-REQ-052` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-013 | requirement=Unknown host key fails before password authentication using a fake ssh executable.
- `BWS121-R10-REQ-053` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-013 | requirement=Pinned matching key succeeds; changed key fails.
- `BWS121-R10-REQ-054` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-013 | requirement=All ssh/scp/pv branches use the same strict options and known-hosts file.
- `BWS121-R10-REQ-055` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-013 | requirement=Command/evidence output never exposes password or known-hosts contents.

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS121-R10-REQ-039` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-010 | requirement=Nested `.env` and `.env.*` exclusion while retaining templates.
- `BWS121-R10-REQ-040` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-010 | requirement=Nested secrets/.secrets/credentials exclusion.
- `BWS121-R10-REQ-041` | category=persistence_or_migration | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-010 | requirement=Key/certificate/database/runtime-state exclusion at any depth.
- `BWS121-R10-REQ-042` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-010 | requirement=Archive-member postcondition validation and adversarial basename/case tests.
- `BWS121-R10-REQ-043` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-010 | requirement=Parity test proving tar and zip helpers select the same source members.
- `BWS121-R10-REQ-044` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-011 | requirement=Nested `.env`/`.env.*`, secrets, .secrets, and credentials reject.
- `BWS121-R10-REQ-045` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-011 | requirement=Template env files remain allowed only under explicit rules.
- `BWS121-R10-REQ-046` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-011 | requirement=Renames/deletions, spaces, Unicode, and newline-hostile Git paths are handled safely using NUL-delimited output.
- `BWS121-R10-REQ-047` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-011 | requirement=No commit or push occurs when any path is blocked.
- `BWS121-R10-REQ-048` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-012 | requirement=Generic and multiple URL-scoped extraheaders are unchanged after success and failure.
- `BWS121-R10-REQ-049` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-012 | requirement=Token-backed command still suppresses inherited headers for that process.
- `BWS121-R10-REQ-050` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-012 | requirement=Interrupted/failed command restores any temporary state.
- `BWS121-R10-REQ-051` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-012 | requirement=Non-GitHub remotes remain untouched.
- `BWS121-R10-REQ-052` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-013 | requirement=Unknown host key fails before password authentication using a fake ssh executable.
- `BWS121-R10-REQ-053` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-013 | requirement=Pinned matching key succeeds; changed key fails.
- `BWS121-R10-REQ-054` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-013 | requirement=All ssh/scp/pv branches use the same strict options and known-hosts file.
- `BWS121-R10-REQ-055` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-013 | requirement=Command/evidence output never exposes password or known-hosts contents.

## Negative and adversarial tests

- `BWS121-R10-REQ-040` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-010 | requirement=Nested secrets/.secrets/credentials exclusion.
- `BWS121-R10-REQ-042` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-010 | requirement=Archive-member postcondition validation and adversarial basename/case tests.
- `BWS121-R10-REQ-044` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-011 | requirement=Nested `.env`/`.env.*`, secrets, .secrets, and credentials reject.
- `BWS121-R10-REQ-046` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-011 | requirement=Renames/deletions, spaces, Unicode, and newline-hostile Git paths are handled safely using NUL-delimited output.
- `BWS121-R10-REQ-047` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-011 | requirement=No commit or push occurs when any path is blocked.
- `BWS121-R10-REQ-052` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-013 | requirement=Unknown host key fails before password authentication using a fake ssh executable.
- `BWS121-R10-REQ-054` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-013 | requirement=All ssh/scp/pv branches use the same strict options and known-hosts file.

## Concurrency, cancellation, crash, and restart tests

- No separately classified record

## Environment proof

- AS_SPECIFIED_BY_REVIEW: 17 requirements

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

Acceptance authority: One nested secret policy, non-destructive Git config handling, and pinned SSH destination identity.

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W4-T37` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.

## T39 exact current-source reverification checklist

- [ ] `pull_artifacts_and_zip_codebase.sh` exists, mode `0755`, SHA-256 `9e7199e2e7efa85963f26374510e7cde6a74eb4cd3f00aca7893de2efe0f6cc7`; re-open the exact current symbol and confirm the finding still applies before any edit.
- [ ] `scripts/create-source-handoff-archive.sh` exists, mode `0755`, SHA-256 `3636462392c76a66fae28b84eafd04a7a7db689e63d815bc82855b58f86e2f49`; re-open the exact current symbol and confirm the finding still applies before any edit.
- [ ] `update_git.sh` exists, mode `0755`, SHA-256 `afdd43955e7513016f5e53770faf9523df7ae9827608931ed81d168519dce3fe`; re-open the exact current symbol and confirm the finding still applies before any edit.
- [ ] `zip_codebase.sh` exists, mode `0755`, SHA-256 `7c9090876b6c558709f6e03a979144f07f501306109ffcc7e6cf95fafc5100a9`; re-open the exact current symbol and confirm the finding still applies before any edit.
- [ ] Confirm `scripts/create-source-handoff-archive.sh` and `zip_codebase.sh` still use materially different member-selection policies.
- [ ] Confirm archive helpers still lack one canonical, path-aware, post-build member-policy verification contract.
- [ ] Confirm `update_git.sh` still evaluates nested protected paths incorrectly and stages before the fail-closed guard.
- [ ] Confirm any persistent local `http.*.extraheader` mutation still occurs and capture exact multi-value ordering before changes.
- [ ] Confirm every `ssh`, `scp`, and streamed-transfer branch still uses first-use trust or equivalent unpinned identity behavior.
- [ ] Stop as `BLOCKED` if a finding is already resolved, moved, contradicted, or needs an unlisted path before authority reconciliation.

## Nested-secret policy design questions

These must be answered in the admission or implementation decision record; no silent policy choice is allowed:

1. Which exact environment-template basenames are permitted, and are permissions based on basename only or path plus content constraints?
2. Are protected path comparisons case-sensitive, Unicode-normalized, and performed on raw Git/archive member bytes without lossy newline parsing?
3. Which directory segments are always prohibited at any depth: `secrets`, `.secrets`, `credentials`, key stores, database state, runtime state, logs, locks, and PID roots?
4. Which key/certificate/database/runtime suffixes are prohibited, including mixed case and compound suffixes?
5. Are symlinks categorically rejected from source handoffs, including links whose targets are outside the repository?
6. How are explicit non-secret fixtures allowlisted without creating a broad fallback?
7. How is the same policy consumed by tar, zip, staged-path, and post-build archive-member verification without policy duplication?
8. What bounded content scan, if any, is required for high-confidence credential forms, and how are false positives explicitly reviewed?

## Archive member-policy convergence

- One canonical normalized-path policy owns both source archive helpers and the Git staged-path guard.
- Selection is based on an explicit NUL-safe member list, not broad recursive archive defaults.
- Member normalization rejects absolute paths, traversal, control-character ambiguity, links, special files, and unsafe case/Unicode variants.
- Nested `.env` forms are rejected while only explicitly approved templates are retained.
- Secret, credential, key, certificate, database, runtime-state, log, lock, and PID categories are rejected at every depth.
- The completed tar/zip member list is independently re-read and checked before publication.
- Tar and ZIP helpers must produce the same policy-selected source set or fail with a documented format-only exception.

## Git secret-guard requirements

- Use NUL-delimited Git path output and preserve raw path boundaries.
- Evaluate protected basenames and every normalized directory segment at any depth.
- Fail before commit and push when any protected path is staged.
- Treat renames, copies, deletions, spaces, Unicode, leading dashes, and newline-bearing names deterministically.
- Abort/unstage only transaction-owned staging changes; never discard unrelated operator work.
- Any fixture exception is exact, reviewed, and non-secret; no broad directory fallback is permitted.

## Repository-local Git-config preservation

- Prefer command-scoped `git -c` suppression of inherited credential headers.
- Do not unset persistent repository-local extraheaders merely to run one command.
- If a narrowly justified temporary mutation is unavoidable, snapshot all keys, values, multiplicity, ordering, and absence state; restore on success, failure, signal, and interruption.
- Verify unrelated Git configuration remains byte-for-byte and value-order equivalent.

## Pinned SSH identity requirements

- Require a pre-provisioned restrictive known-hosts file or an explicit approved host-key fingerprint set.
- Use strict host-key checking and a dedicated known-hosts path for every SSH/SCP/stream branch.
- Fail before password authentication when identity is absent or mismatched.
- Never expose password, token, private-key material, or known-hosts contents in argv, stdout, stderr, logs, or receipts.
- Preserve remote repository basename and archive-integrity checks; host identity does not replace payload verification.
- No plaintext password value and no first-use trust assumption is accepted.

## Safe temporary-fixture plan

- Create fixtures under an admission-owned `mktemp -d` root outside the repository.
- Use synthetic, non-secret marker values and fake `git`, `ssh`, `scp`, `tar`, and `zip` executables where branch observation is required.
- Never invoke a real remote, provider, credential helper, service, database, or `betting-win` path.
- Include nested protected names, permitted templates, Unicode/case variants, control-character-safe Git path cases, symlinks, and special-file rejection cases.
- Snapshot repository-local Git config before each test and prove exact preservation afterward.
- Remove only the fixture root; record cleanup failure as `BLOCKED`.

## T39 production-entrypoint inventory

All `17` mapped requirements require production-entrypoint proof:

- `BWS121-R10-REQ-039` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-010 | requirement=Nested `.env` and `.env.*` exclusion while retaining templates.
- `BWS121-R10-REQ-040` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-010 | requirement=Nested secrets/.secrets/credentials exclusion.
- `BWS121-R10-REQ-041` | category=persistence_or_migration | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-010 | requirement=Key/certificate/database/runtime-state exclusion at any depth.
- `BWS121-R10-REQ-042` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-010 | requirement=Archive-member postcondition validation and adversarial basename/case tests.
- `BWS121-R10-REQ-043` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-010 | requirement=Parity test proving tar and zip helpers select the same source members.
- `BWS121-R10-REQ-044` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-011 | requirement=Nested `.env`/`.env.*`, secrets, .secrets, and credentials reject.
- `BWS121-R10-REQ-045` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-011 | requirement=Template env files remain allowed only under explicit rules.
- `BWS121-R10-REQ-046` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-011 | requirement=Renames/deletions, spaces, Unicode, and newline-hostile Git paths are handled safely using NUL-delimited output.
- `BWS121-R10-REQ-047` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-011 | requirement=No commit or push occurs when any path is blocked.
- `BWS121-R10-REQ-048` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-012 | requirement=Generic and multiple URL-scoped extraheaders are unchanged after success and failure.
- `BWS121-R10-REQ-049` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-012 | requirement=Token-backed command still suppresses inherited headers for that process.
- `BWS121-R10-REQ-050` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-012 | requirement=Interrupted/failed command restores any temporary state.
- `BWS121-R10-REQ-051` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-012 | requirement=Non-GitHub remotes remain untouched.
- `BWS121-R10-REQ-052` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-013 | requirement=Unknown host key fails before password authentication using a fake ssh executable.
- `BWS121-R10-REQ-053` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-013 | requirement=Pinned matching key succeeds; changed key fails.
- `BWS121-R10-REQ-054` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-013 | requirement=All ssh/scp/pv branches use the same strict options and known-hosts file.
- `BWS121-R10-REQ-055` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R10-013 | requirement=Command/evidence output never exposes password or known-hosts contents.

Concrete test commands are `TO_CONFIRM_DURING_ADMISSION` because the reviewed baseline records requirements, not future test filenames. The admission must bind each test ID to one bounded repository-local command before source mutation; listing a requirement without executing its bound command cannot close the finding.

## T39 activation blockers

- any of the four findings cannot be reverified against the exact current source;
- any required path lies outside the admitted set and is not explicitly added by authority reconciliation;
- canonical nested-path policy decisions remain unresolved;
- a test would use real credentials, remote hosts, services, providers, databases, or `betting-win`;
- exact repository-local Git-config restoration cannot be proven;
- pinned SSH identity cannot be provisioned for the production path;
- Node/runtime identity, preimages, rollback root, or all 17 test bindings are unavailable;
- current task/queue/controller/holds differ from protected authority without explicit reconciliation.

## Exact handoff required for the eventual implementation chat

The later implementation session must receive: the exact current repository archive or checkout identity; this packet; a schema-valid activated tranche-admission receipt; current preimage and reverification receipts; the four finding records; exact allowed/read-only/prohibited paths; approved policy decisions; all 17 test-to-command bindings; Node/runtime proof; rollback root; protected-authority preimages; retained holds; and a statement that no controller, service, database, provider, deployment, live execution, or `betting-win` action is authorized. This documentation is not itself an implementation prompt.
