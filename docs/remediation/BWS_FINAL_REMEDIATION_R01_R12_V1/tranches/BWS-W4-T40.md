
# BWS-W4-T40 implementation packet

> Documentation status: `PROPOSED_NOT_ACTIVE` for T39 and `NOT_ADMITTED` for all tranches. This packet does not authorize source mutation.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W4-T40
CAMPAIGN_ORDER: 9
STAGE: S2
PRIMARY_OWNER: R11
SECONDARY_REVIEWERS: R09, R10, R12
ISSUE_IDS: BWS121-R11-001, BWS121-R11-002
SEVERITY_COUNTS: {"P1": 2}
DEPENDENCIES: T39
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; exact 771-member archive inventory; independently computed inventory digest=b81ff807e4c230bff96fe1fa58f73a2d4bac803ebd7fa58b843cdcb83499f7f0
CURRENT_SOURCE_PATH_CANDIDATES: .nvmrc, SOURCE_MANIFEST.json, package.json, scripts/load-node-runtime.sh, scripts/validate_node_runtime_loader.py, scripts/validate_source_manifest.py, tests/validate-source-manifest.test.ts
SYMBOLS_TO_REVERIFY: 7 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: package.json
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
FOCUSED_TESTS: 8 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 8 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 2 classified records below
CONCURRENCY_OR_CRASH_TESTS: 0 classified records below
ENVIRONMENT_PROOF: {"AS_SPECIFIED_BY_REVIEW": 8}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: Exact current source manifest and exact Node 20.20.2 enforcement.
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": true, "bws_710": true, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W4-T44 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `.nvmrc` | present=yes | sha256=75053fb82fe4512318dd99556daf58b862fb81c96cf1153249b75f8116edf440 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `SOURCE_MANIFEST.json` | present=yes | sha256=d9ea618c19fac733cf070c7e9b811ace8a1a0d637680b0b9f8233be5879aba6a | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `package.json` | present=yes | sha256=b1b69ffa6d0b974c3b3ba55f3ec1acffb21e512c3a862e2a7b2d6b5139e5eac0 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `scripts/load-node-runtime.sh` | present=yes | sha256=ea4bb9bef2995130f632d069dc3c3cbb5c6774047f420ab1a58f6335b3f87abe | mode=0755 | authorization=TO_CONFIRM_DURING_ADMISSION
- `scripts/validate_node_runtime_loader.py` | present=yes | sha256=0673fde5c9877eb064985feeefc0b1043bcf7c5dcefadd675f48bd3371443334 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `scripts/validate_source_manifest.py` | present=yes | sha256=2235e6c4276dc8dad2a0328e956d3622ec6bfbef0978843cdf35e81e58e956b5 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `tests/validate-source-manifest.test.ts` | present=yes | sha256=194c8fe6f8f0226b3245af7d5f28e23c2b1c886b5658f30167823b0c74f3ab40 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS121-R11-001 | `SOURCE_MANIFEST.json` | symbol=schema/generated/overlay/files | reviewed_line_range=1-9 | reviewed_sha256=d9ea618c19fac733cf070c7e9b811ace8a1a0d637680b0b9f8233be5879aba6a
- BWS121-R11-001 | `scripts/validate_source_manifest.py` | symbol=expected_entries / main | reviewed_line_range=50-68; 92-103; 134-145 | reviewed_sha256=2235e6c4276dc8dad2a0328e956d3622ec6bfbef0978843cdf35e81e58e956b5
- BWS121-R11-001 | `tests/validate-source-manifest.test.ts` | symbol=synthetic manifest fixtures | reviewed_line_range=48-108 | reviewed_sha256=194c8fe6f8f0226b3245af7d5f28e23c2b1c886b5658f30167823b0c74f3ab40
- BWS121-R11-002 | `.nvmrc` | symbol=canonical runtime pin | reviewed_line_range=1 | reviewed_sha256=75053fb82fe4512318dd99556daf58b862fb81c96cf1153249b75f8116edf440
- BWS121-R11-002 | `package.json` | symbol=engines and validation scripts | reviewed_line_range=11-18; 27-32 | reviewed_sha256=b1b69ffa6d0b974c3b3ba55f3ec1acffb21e512c3a862e2a7b2d6b5139e5eac0
- BWS121-R11-002 | `scripts/load-node-runtime.sh` | symbol=_surebet_node_matches | reviewed_line_range=27-31; 41-53; 74-113 | reviewed_sha256=ea4bb9bef2995130f632d069dc3c3cbb5c6774047f420ab1a58f6335b3f87abe
- BWS121-R11-002 | `scripts/validate_node_runtime_loader.py` | symbol=main | reviewed_line_range=44-70 | reviewed_sha256=0673fde5c9877eb064985feeefc0b1043bcf7c5dcefadd675f48bd3371443334

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS121-R11-001 — Source manifest omits 115 current paths and carries eight stale file records

- Severity: `P1`
- Current behavior: The manifest has 617 entries. It omits 38 Wave 01 files, 38 Wave 02 files, 38 Wave 03 files, and docs/reviews/README.md. Eight existing entries have stale size or hash values: the seven inherited Graphify/update-tooling paths plus docs/000_documentation_index.md.
- Expected behavior: The manifest must contain exactly every included current path once, with exact byte size and SHA-256, while intentionally excluding only declared runtime/generated paths.
- Invariant: The manifest must contain exactly every included current path once, with exact byte size and SHA-256, while intentionally excluding only declared runtime/generated paths.
- Root cause: The source manifest was not transactionally regenerated and verified after successive documentation overlays and tooling changes.
- Trigger: Run scripts/validate_source_manifest.py or compare SOURCE_MANIFEST.json with the 732 included non-self files.
- Minimal fix boundary: During an authorized implementation tranche, regenerate the manifest from the final intended tree, verify exact path/size/hash equality, bind its generated/overlay metadata to the archive publication transaction, and prohibit publishing a new archive when the manifest check fails.
- Regression risks:
- Regeneration must not include runtime locks, secrets, node_modules, dist, artifacts, or transient automation state.
- Documentation-only overlays must remain compatible with immutable executable lineage while updating current source proof.

### BWS121-R11-002 — Canonical Node 20.20.2 enforcement accepts any Node 20 minor as NODE_OK

- Severity: `P1`
- Current behavior: The loader compares only the major version and emits NODE_OK for 20.0.0. The validator also passes because it does not exercise negative version cases.
- Expected behavior: Canonical acceptance paths must select exactly 20.20.2 or explicitly classify another supported Node 20 runtime as noncanonical and non-accepting.
- Invariant: Canonical acceptance paths must select exactly 20.20.2 or explicitly classify another supported Node 20 runtime as noncanonical and non-accepting.
- Root cause: Runtime selection and runtime validation encode a major-version compatibility policy while current acceptance authority requires an exact canonical version.
- Trigger: Source scripts/load-node-runtime.sh or use a root controller that inherits its NODE_OK result.
- Minimal fix boundary: Separate supported-runtime compatibility from canonical-acceptance authority. Require exact 20.20.2 for release/review/controller acceptance, emit a noncanonical status for other 20.x versions, and make downstream gates reject that status.
- Regression risks:
- Do not break explicitly supported development use on other Node 20 versions; classify it rather than silently treating it as canonical.
- Avoid sourcing or replacing the active shell/session.


## Allowed edit boundary

- Candidate path set: `.nvmrc`, `SOURCE_MANIFEST.json`, `package.json`, `scripts/load-node-runtime.sh`, `scripts/validate_node_runtime_loader.py`, `scripts/validate_source_manifest.py`, `tests/validate-source-manifest.test.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `package.json` | participating tranches=T21, T38, T40, T41, T42, T43 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- All adversarial mutations were confined to disposable copies outside the extracted review tree.
- Execution, public signals, profitability claims, live writes, and financial operations remain prohibited and unchanged.
- No persistent database was contacted or mutated; no service, controller, scheduler, worker, or automation process was started.
- No provider, external API, account, credential, signer, wallet, deployed service, or betting-win checkout was contacted.
- No source, test, fixture, migration, schema, configuration, documentation, manifest, or archive member was modified.
- all betting-win source, checkout, documentation, service, database, and runtime
- betting-win; live execution; current BWS-600/BWS-710/BWS-900 holds
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T39.
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

- `BWS121-R11-REQ-001` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-001 | requirement=Current-tree manifest exact-match test, not only a synthetic fixture
- `BWS121-R11-REQ-002` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-001 | requirement=Overlay installation test that must update manifest or abort atomically
- `BWS121-R11-REQ-003` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-001 | requirement=Archive-to-extracted-tree-to-manifest three-way equality test
- `BWS121-R11-REQ-004` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-001 | requirement=Negative tests for omitted review documents and stale same-path bytes
- `BWS121-R11-REQ-005` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-002 | requirement=PATH Node 20.0.0, 20.20.1, 20.20.2, and a future 20.x table test
- `BWS121-R11-REQ-006` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-002 | requirement=NVM fallback exact-versus-major test
- `BWS121-R11-REQ-007` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-002 | requirement=Controller rejects supported-but-noncanonical Node
- `BWS121-R11-REQ-008` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-002 | requirement=Validation receipt records exact node and npm bytes/versions

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS121-R11-REQ-001` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-001 | requirement=Current-tree manifest exact-match test, not only a synthetic fixture
- `BWS121-R11-REQ-002` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-001 | requirement=Overlay installation test that must update manifest or abort atomically
- `BWS121-R11-REQ-003` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-001 | requirement=Archive-to-extracted-tree-to-manifest three-way equality test
- `BWS121-R11-REQ-004` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-001 | requirement=Negative tests for omitted review documents and stale same-path bytes
- `BWS121-R11-REQ-005` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-002 | requirement=PATH Node 20.0.0, 20.20.1, 20.20.2, and a future 20.x table test
- `BWS121-R11-REQ-006` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-002 | requirement=NVM fallback exact-versus-major test
- `BWS121-R11-REQ-007` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-002 | requirement=Controller rejects supported-but-noncanonical Node
- `BWS121-R11-REQ-008` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-002 | requirement=Validation receipt records exact node and npm bytes/versions

## Negative and adversarial tests

- `BWS121-R11-REQ-004` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-001 | requirement=Negative tests for omitted review documents and stale same-path bytes
- `BWS121-R11-REQ-005` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-002 | requirement=PATH Node 20.0.0, 20.20.1, 20.20.2, and a future 20.x table test

## Concurrency, cancellation, crash, and restart tests

- No separately classified record

## Environment proof

- AS_SPECIFIED_BY_REVIEW: 8 requirements

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

Acceptance authority: Exact current source manifest and exact Node 20.20.2 enforcement.

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W4-T44` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
