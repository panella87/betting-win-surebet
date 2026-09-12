
# BWS-W4-T47 implementation packet

> Documentation status: `PROPOSED_NOT_ACTIVE` for T39 and `NOT_ADMITTED` for all tranches. This packet does not authorize source mutation.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W4-T47
CAMPAIGN_ORDER: 13
STAGE: S2
PRIMARY_OWNER: R12
SECONDARY_REVIEWERS: R07, R09, R11, R24
ISSUE_IDS: BWS121-R12-011, BWS121-R12-012, BWS121-R12-013
SEVERITY_COUNTS: {"P1": 2, "P2": 1}
DEPENDENCIES: T44, T45, T46
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; exact 771-member archive inventory; independently computed inventory digest=b81ff807e4c230bff96fe1fa58f73a2d4bac803ebd7fa58b843cdcb83499f7f0
CURRENT_SOURCE_PATH_CANDIDATES: .automation/lib/run_common.sh, .automation/lib/telegram_notify.sh, run-autonomous-bugfix.sh, run-autonomous-implementation.sh, run-bugfix-autopilot.sh, run-paper-autopilot.sh
SYMBOLS_TO_REVERIFY: 11 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: .automation/lib/run_common.sh, run-autonomous-bugfix.sh, run-autonomous-implementation.sh, run-bugfix-autopilot.sh, run-paper-autopilot.sh
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
FOCUSED_TESTS: 13 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 13 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 3 classified records below
CONCURRENCY_OR_CRASH_TESTS: 4 classified records below
ENVIRONMENT_PROOF: {"AS_SPECIFIED_BY_REVIEW": 13}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: Immutable serialized archive generations, explicit publication failure currentness, and linked redacted delivery receipts.
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": true, "bws_710": true, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W1-T02 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `.automation/lib/run_common.sh` | present=yes | sha256=d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619 | mode=0755 | authorization=TO_CONFIRM_DURING_ADMISSION
- `.automation/lib/telegram_notify.sh` | present=yes | sha256=bae37f227389b264cefea86f1792d3642bc9393f0076408f680c02040a120e23 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `run-autonomous-bugfix.sh` | present=yes | sha256=fd3f9dcc110763c5ed88c1eba6bcb1ed1a94d4034b7757051b2fb6d1ab385a1b | mode=0755 | authorization=TO_CONFIRM_DURING_ADMISSION
- `run-autonomous-implementation.sh` | present=yes | sha256=cf373b5b75fdeeb4b7e83c9bdf2ce984e92a4ffecd85da6207481b479861d14a | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `run-bugfix-autopilot.sh` | present=yes | sha256=e96b91399d507f223d4e8ce7c1d74a19597ef15fa21eb1bbf52a4b81408d97f8 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `run-paper-autopilot.sh` | present=yes | sha256=fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS121-R12-011 | `.automation/lib/run_common.sh` | symbol=automation_publish_final_artifacts_zip | reviewed_line_range=L1268-L1327 | reviewed_sha256=d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619
- BWS121-R12-011 | `run-paper-autopilot.sh` | symbol=finish | reviewed_line_range=L1091-L1117 | reviewed_sha256=fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661
- BWS121-R12-011 | `run-bugfix-autopilot.sh` | symbol=finish | reviewed_line_range=L994-L1020 | reviewed_sha256=e96b91399d507f223d4e8ce7c1d74a19597ef15fa21eb1bbf52a4b81408d97f8
- BWS121-R12-012 | `.automation/lib/run_common.sh` | symbol=automation_build_artifacts_zip / automation_latest_evidence_hint | reviewed_line_range=L1351-L1397 | reviewed_sha256=d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619
- BWS121-R12-012 | `run-autonomous-bugfix.sh` | symbol=resolve_artifact_hint | reviewed_line_range=L280-L286 | reviewed_sha256=fd3f9dcc110763c5ed88c1eba6bcb1ed1a94d4034b7757051b2fb6d1ab385a1b
- BWS121-R12-012 | `run-autonomous-implementation.sh` | symbol=finish | reviewed_line_range=L1112-L1132 | reviewed_sha256=cf373b5b75fdeeb4b7e83c9bdf2ce984e92a4ffecd85da6207481b479861d14a
- BWS121-R12-012 | `run-bugfix-autopilot.sh` | symbol=finish | reviewed_line_range=L1015-L1035 | reviewed_sha256=e96b91399d507f223d4e8ce7c1d74a19597ef15fa21eb1bbf52a4b81408d97f8
- BWS121-R12-013 | `.automation/lib/telegram_notify.sh` | symbol=telegram_notify_send_final | reviewed_line_range=L218-L295 | reviewed_sha256=bae37f227389b264cefea86f1792d3642bc9393f0076408f680c02040a120e23
- BWS121-R12-013 | `run-paper-autopilot.sh` | symbol=finish | reviewed_line_range=L1076-L1138 | reviewed_sha256=fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661
- BWS121-R12-013 | `run-bugfix-autopilot.sh` | symbol=finish | reviewed_line_range=L979-L1041 | reviewed_sha256=e96b91399d507f223d4e8ce7c1d74a19597ef15fa21eb1bbf52a4b81408d97f8
- BWS121-R12-013 | `run-autonomous-bugfix.sh` | symbol=finish | reviewed_line_range=L727-L784 | reviewed_sha256=fd3f9dcc110763c5ed88c1eba6bcb1ed1a94d4034b7757051b2fb6d1ab385a1b

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS121-R12-011 — Shared artifacts.zip publication is an unversioned last-writer-wins race

- Severity: `P1`
- Current behavior: Both publishers can succeed. The later mv silently replaces the earlier archive, even after the earlier controller already reported finalization. Controller locks do not cover every final publication window.
- Expected behavior: Each final archive must have an immutable generation path. Any mutable “latest” pointer must advance through a serialized compare-and-set bound to the expected previous and new generation receipts.
- Invariant: Each final archive must have an immutable generation path. Any mutable “latest” pointer must advance through a serialized compare-and-set bound to the expected previous and new generation receipts.
- Root cause: Atomic file replacement is incorrectly treated as an atomic publication protocol across generations.
- Trigger: Publish both candidates to repository-root artifacts.zip with overlapping final mv operations.
- Minimal fix boundary: Publish immutable generation-named archives with manifests, then update a small latest receipt under one repository-scoped publication lock/CAS. Controllers must report their immutable archive ID, not only the shared path.
- Regression risks:
- Consumers that assume a fixed artifacts.zip path require migration.
- Publication locking must not reuse controller ownership in a way that deadlocks finalization.

### BWS121-R12-012 — Failed or incomplete final publication leaves a prior archive silently reusable as current evidence

- Severity: `P1`
- Current behavior: The old archive remains in place and is returned preferentially over newer run directories. Final blocked status may exist only in the filesystem outside the archive that is still presented as latest.
- Expected behavior: Publication failure must leave an explicit tombstone/failed-generation receipt, and no consumer may infer currentness from the existence of an older singleton archive.
- Invariant: Publication failure must leave an explicit tombstone/failed-generation receipt, and no consumer may infer currentness from the existence of an older singleton archive.
- Root cause: Archive durability and archive currentness are conflated; there is no generation-bound publication receipt or failed-publication state.
- Trigger: Fail the current final publication and start a bugfix audit without an explicit evidence generation.
- Minimal fix boundary: Separate immutable archives from current-generation receipts. On failure, publish a small failure receipt bound to the run, and require consumers to select an explicit accepted generation whose manifest contains the referenced terminal result.
- Regression risks:
- Do not delete the last known-good archive; mark it historical rather than current.
- Legacy consumers need an explicit compatibility error, not a silent fallback.

### BWS121-R12-013 — Telegram delivery outcome is produced after terminal artifact publication and is absent from retained evidence

- Severity: `P2`
- Current behavior: Notification is attempted only after the final archive build/refresh. Its outcome is appended to a log outside the already published archive; no later refresh occurs. The one-shot flag is set before the attempt and failures still return zero.
- Expected behavior: Telegram may remain best effort, but the exact sent/skipped/failed outcome must be retained in generation-bound terminal evidence or a separately linked immutable delivery receipt.
- Invariant: Telegram may remain best effort, but the exact sent/skipped/failed outcome must be retained in generation-bound terminal evidence or a separately linked immutable delivery receipt.
- Root cause: Notification delivery is treated as an unretained log side effect rather than a best-effort sub-state of campaign finalization.
- Trigger: Complete any controller finalization and inspect the already published archive for its notification result.
- Minimal fix boundary: Write a bounded notification-attempt receipt before publication when dry-run/config status is known, or publish a separate immutable delivery receipt linked by run/archive generation after the attempt. Preserve controller success semantics for notification failure.
- Regression risks:
- Moving a live network attempt before archive publication must not make campaign finalization depend on Telegram.
- Receipt content must redact token, chat ID, and response secrets.


## Allowed edit boundary

- Candidate path set: `.automation/lib/run_common.sh`, `.automation/lib/telegram_notify.sh`, `run-autonomous-bugfix.sh`, `run-autonomous-implementation.sh`, `run-bugfix-autopilot.sh`, `run-paper-autopilot.sh`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `.automation/lib/run_common.sh` | participating tranches=T44, T45, T46, T47 | predecessor postimage required
- `run-autonomous-bugfix.sh` | participating tranches=T44, T46, T47 | predecessor postimage required
- `run-autonomous-implementation.sh` | participating tranches=T44, T46, T47 | predecessor postimage required
- `run-bugfix-autopilot.sh` | participating tranches=T44, T45, T46, T47 | predecessor postimage required
- `run-paper-autopilot.sh` | participating tranches=T28, T29, T44, T45, T46, T47 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- Atomic candidate validation remains required.
- Candidate ZIP integrity and symlink checks remain unchanged.
- Child notifications remain suppressed under parent controllers.
- Historical archives become more, not less, immutable.
- Operators may still explicitly select a historical archive for historical review.
- Telegram remains best effort and does not authorize or block business operations.
- all betting-win source, checkout, documentation, service, database, and runtime
- betting-win; live execution; current BWS-600/BWS-710/BWS-900 holds
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T44, T45, T46.
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

- `BWS121-R12-REQ-043` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-011 | requirement=Two-process publication barrier with distinct manifests.
- `BWS121-R12-REQ-044` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-011 | requirement=Publisher crash before and after immutable archive creation.
- `BWS121-R12-REQ-045` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-011 | requirement=Latest-pointer CAS conflict and deterministic loser behavior.
- `BWS121-R12-REQ-046` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-011 | requirement=Controller output remains bound to its archive after later publications.
- `BWS121-R12-REQ-047` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-012 | requirement=Old success archive plus new failed publication.
- `BWS121-R12-REQ-048` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-012 | requirement=Newer run directory absent from archive.
- `BWS121-R12-REQ-049` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-012 | requirement=Corrected blocked final summary written after last successful ZIP.
- `BWS121-R12-REQ-050` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-012 | requirement=Default evidence intake must reject ambiguous or stale singleton state.
- `BWS121-R12-REQ-051` | category=cancellation_or_timeout | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-013 | requirement=Sent, skipped-disabled, skipped-missing-config, timeout, and HTTP failure receipts.
- `BWS121-R12-REQ-052` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-013 | requirement=Archive or linked receipt proves the exact message version and final run ID.
- `BWS121-R12-REQ-053` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-013 | requirement=Retry policy does not send duplicate successful notifications.
- `BWS121-R12-TG-011` | category=concurrency_or_ownership | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-011, BWS121-R12-012 | requirement=No concurrent shared-archive publisher or stale-generation consumer test exists
- `BWS121-R12-TG-012` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-013 | requirement=No test proves final notification outcome is present in or linked to retained terminal evidence

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS121-R12-REQ-043` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-011 | requirement=Two-process publication barrier with distinct manifests.
- `BWS121-R12-REQ-044` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-011 | requirement=Publisher crash before and after immutable archive creation.
- `BWS121-R12-REQ-045` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-011 | requirement=Latest-pointer CAS conflict and deterministic loser behavior.
- `BWS121-R12-REQ-046` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-011 | requirement=Controller output remains bound to its archive after later publications.
- `BWS121-R12-REQ-047` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-012 | requirement=Old success archive plus new failed publication.
- `BWS121-R12-REQ-048` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-012 | requirement=Newer run directory absent from archive.
- `BWS121-R12-REQ-049` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-012 | requirement=Corrected blocked final summary written after last successful ZIP.
- `BWS121-R12-REQ-050` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-012 | requirement=Default evidence intake must reject ambiguous or stale singleton state.
- `BWS121-R12-REQ-051` | category=cancellation_or_timeout | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-013 | requirement=Sent, skipped-disabled, skipped-missing-config, timeout, and HTTP failure receipts.
- `BWS121-R12-REQ-052` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-013 | requirement=Archive or linked receipt proves the exact message version and final run ID.
- `BWS121-R12-REQ-053` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-013 | requirement=Retry policy does not send duplicate successful notifications.
- `BWS121-R12-TG-011` | category=concurrency_or_ownership | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-011, BWS121-R12-012 | requirement=No concurrent shared-archive publisher or stale-generation consumer test exists
- `BWS121-R12-TG-012` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-013 | requirement=No test proves final notification outcome is present in or linked to retained terminal evidence

## Negative and adversarial tests

- `BWS121-R12-REQ-050` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-012 | requirement=Default evidence intake must reject ambiguous or stale singleton state.
- `BWS121-R12-REQ-053` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-013 | requirement=Retry policy does not send duplicate successful notifications.
- `BWS121-R12-TG-011` | category=concurrency_or_ownership | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-011, BWS121-R12-012 | requirement=No concurrent shared-archive publisher or stale-generation consumer test exists

## Concurrency, cancellation, crash, and restart tests

- `BWS121-R12-REQ-044` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-011 | requirement=Publisher crash before and after immutable archive creation.
- `BWS121-R12-REQ-050` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-012 | requirement=Default evidence intake must reject ambiguous or stale singleton state.
- `BWS121-R12-REQ-051` | category=cancellation_or_timeout | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-013 | requirement=Sent, skipped-disabled, skipped-missing-config, timeout, and HTTP failure receipts.
- `BWS121-R12-TG-011` | category=concurrency_or_ownership | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-011, BWS121-R12-012 | requirement=No concurrent shared-archive publisher or stale-generation consumer test exists

## Environment proof

- AS_SPECIFIED_BY_REVIEW: 13 requirements

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

Acceptance authority: Immutable serialized archive generations, explicit publication failure currentness, and linked redacted delivery receipts.

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W1-T02` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
