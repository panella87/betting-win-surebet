
# BWS-W3-T34 implementation packet

> Documentation status: `PROPOSED_NOT_ACTIVE` for T39 and `NOT_ADMITTED` for all tranches. This packet does not authorize source mutation.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W3-T34
CAMPAIGN_ORDER: 42
STAGE: S6
PRIMARY_OWNER: R09
SECONDARY_REVIEWERS: R03, R06, R07, R10, R11
ISSUE_IDS: BWS120-R09-005, BWS120-R09-006, BWS120-R09-007, BWS120-R09-008, BWS120-R09-009, BWS120-R09-010, BWS120-R09-011
SEVERITY_COUNTS: {"P1": 7}
DEPENDENCIES: T21, T23, T31, T33
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; exact 771-member archive inventory; independently computed inventory digest=b81ff807e4c230bff96fe1fa58f73a2d4bac803ebd7fa58b843cdcb83499f7f0
CURRENT_SOURCE_PATH_CANDIDATES: packages/bootstrap/src/operations/release-upgrade.ts
SYMBOLS_TO_REVERIFY: 23 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: packages/bootstrap/src/operations/release-upgrade.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites ``T31; R06 lifecycle fencing; exclusive upgrade epoch``
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 36 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 36 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 6 classified records below
CONCURRENCY_OR_CRASH_TESTS: 7 classified records below
ENVIRONMENT_PROOF: {"NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION": 36}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: plan recomputed; all inputs rebound; one owner; state scoped to plan; checkpoint bytes/current target verified; lifecycle failures not success; partial target fenced before prior restart
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": false, "bws_710": false, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W3-T35 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `packages/bootstrap/src/operations/release-upgrade.ts` | present=yes | sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS120-R09-005 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=createBwsReleaseUpgradePlan | reviewed_line_range=427-443 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R09-005 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=readUpgradePlan / assertPlanFingerprint | reviewed_line_range=1371-1385 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R09-005 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=createBwsReleaseUpgradePlan / readUpgradePlan / assertPlanFingerprint | reviewed_line_range=427-443; 1371-1385 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R09-006 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=createBwsReleaseUpgradePlan | reviewed_line_range=385-475 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R09-006 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=applyBwsReleaseUpgrade | reviewed_line_range=519-535 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R09-006 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=target_staged transition | reviewed_line_range=610-628 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R09-006 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=createBwsReleaseUpgradePlan / applyBwsReleaseUpgrade | reviewed_line_range=385-475; 519-535; 610-628 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R09-007 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=applyBwsReleaseUpgrade | reviewed_line_range=519-770 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R09-007 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=readOrCreateUpgradeState / appendCheckpointIfMissing | reviewed_line_range=1388-1485 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R09-007 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=applyBwsReleaseUpgrade / readOrCreateUpgradeState / appendCheckpointIfMissing | reviewed_line_range=519-770; 1388-1485 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R09-008 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=applyBwsReleaseUpgrade | reviewed_line_range=539-542 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R09-008 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=readOrCreateUpgradeState | reviewed_line_range=1388-1421 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R09-008 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=applyBwsReleaseUpgrade / readOrCreateUpgradeState | reviewed_line_range=539-542; 1388-1421 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R09-009 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=applyBwsReleaseUpgrade | reviewed_line_range=657-770 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R09-009 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=readOrCreateUpgradeState | reviewed_line_range=1404-1421 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R09-009 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=appendCheckpointIfMissing / hasCheckpoint | reviewed_line_range=1428-1493 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R09-009 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=applyBwsReleaseUpgrade / readOrCreateUpgradeState / hasCheckpoint | reviewed_line_range=657-770; 1404-1421; 1428-1493 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R09-010 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=buildLifecyclePlanReasons | reviewed_line_range=1132-1148 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R09-010 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=drained_before_backup transition | reviewed_line_range=564-581 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R09-010 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=target_started transition | reviewed_line_range=657-674 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R09-010 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=buildLifecyclePlanReasons / applyBwsReleaseUpgrade | reviewed_line_range=564-581; 657-674; 1132-1148 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R09-011 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=target start failure and rollback branch | reviewed_line_range=657-714 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R09-011 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=applyBwsReleaseUpgrade rollback branch | reviewed_line_range=657-714 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS120-R09-005 — Upgrade plan fingerprints are trusted from the plan instead of recomputed from plan content

- Severity: `P1`
- Current behavior: Edited paths, evidence references, runtime directories, status, or policy fields can be accepted as long as the embedded fingerprint remains the expected 64-hex value.
- Expected behavior: The apply path must recompute a canonical digest over every authoritative plan field and reject any byte/semantic change.
- Invariant: The apply path must recompute a canonical digest over every authoritative plan field and reject any byte/semantic change.
- Root cause: The plan fingerprint is treated as self-authenticating data rather than a recomputed content commitment.
- Trigger: Apply the edited plan.
- Minimal fix boundary: Define one canonical plan descriptor containing every apply-authoritative field, recompute it on every read, and bind the plan file digest into retained evidence and state.
- Regression risks:
- Canonicalization must be versioned.
- Secret values should be bound by a restricted digest/receipt without being copied into public evidence.

### BWS120-R09-006 — Upgrade apply does not rebind plan-time environment, release, and install-evidence bytes

- Severity: `P1`
- Current behavior: Apply consumes current bytes from mutable paths while retaining plan-time identities and checkpoints.
- Expected behavior: Every plan-time authority must be rehashed/reverified at apply, and any difference must force a new plan.
- Invariant: Every plan-time authority must be rehashed/reverified at apply, and any difference must force a new plan.
- Root cause: The upgrade plan is treated as an advisory snapshot rather than an immutable transaction precondition.
- Trigger: Apply the unchanged plan and token.
- Minimal fix boundary: Before acquiring upgrade ownership or stopping services, recompute the plan digest, environment receipt, release manifests/inventories, install-verification digest, backup/restore evidence, and database identity; abort on any mismatch.
- Regression risks:
- Revalidation must occur before any lifecycle or database side effect.
- Avoid exposing secret contents in public evidence while still binding exact configuration.

### BWS120-R09-007 — Upgrade apply has no exclusive owner or fencing token

- Severity: `P1`
- Current behavior: Both commands can read the same state, independently stop/start, apply migrations, append colliding sequence files, and overwrite state/results.
- Expected behavior: Exactly one generation-bound upgrade owner must execute lifecycle, migration, checkpoint, and rollback effects; stale owners must be fenced.
- Invariant: Exactly one generation-bound upgrade owner must execute lifecycle, migration, checkpoint, and rollback effects; stale owners must be fenced.
- Root cause: Upgrade state persistence is used as progress memory but not as an exclusive lease/fence.
- Trigger: Launch concurrent upgrade operations before either publishes the next state.
- Minimal fix boundary: Acquire one repository/evidence-directory scoped atomic lease before any apply/recover side effect, assign a monotonic upgrade epoch, bind every checkpoint and lifecycle call to it, and reject stale writers.
- Regression risks:
- Coordinate with R03 database fencing and R06 process ownership without duplicating their lower-layer fixes.
- Emergency recovery needs an explicit, audited takeover path.

### BWS120-R09-008 — Resolved upgrade state can be reused by a different plan fingerprint

- Severity: `P1`
- Current behavior: The resolved prior state is accepted and its checkpoints can suppress work in the new plan.
- Expected behavior: State must be immutable and namespaced by exact plan fingerprint; a different plan must start with a new empty state and checkpoint directory.
- Invariant: State must be immutable and namespaced by exact plan fingerprint; a different plan must start with a new empty state and checkpoint directory.
- Root cause: The state path is release-pair scoped rather than plan-identity scoped, and resolved state disables the mismatch invariant.
- Trigger: Apply the new plan.
- Minimal fix boundary: Require exact plan fingerprint for every state read, use per-plan state/checkpoint directories, and archive rather than reuse resolved state.
- Regression risks:
- Historical recovery evidence must remain discoverable without becoming active state.
- Do not silently delete prior terminal evidence.

### BWS120-R09-009 — Upgrade recovery trusts checkpoint classifications without verifying checkpoint bytes or current target state

- Severity: `P1`
- Current behavior: Classification presence suppresses work and can directly produce recovery_complete/upgrade_applied without current target verification.
- Expected behavior: Resume must validate the full hash-linked checkpoint chain and re-establish current generation-bound lifecycle/database postconditions before advancing.
- Invariant: Resume must validate the full hash-linked checkpoint chain and re-establish current generation-bound lifecycle/database postconditions before advancing.
- Root cause: Checkpoint metadata is trusted as state authority without validating referenced artifacts or live postconditions.
- Trigger: Resume apply/recovery.
- Minimal fix boundary: On every resume, verify each checkpoint file hash/schema/sequence/plan/epoch, reconstruct state from the chain, then revalidate current release, database ledger, process generation, health, and readiness before any terminal transition.
- Regression risks:
- Fresh status checks must use R06 generation-safe lifecycle evidence.
- A failed revalidation should preserve ambiguity and require bounded recovery, not overwrite evidence.

### BWS120-R09-010 — Upgrade checkpoints lifecycle success from permissive or ignored lifecycle outcomes

- Severity: `P1`
- Current behavior: OR logic admits partial readiness; stop/start results are not inspected before success checkpoints are persisted.
- Expected behavior: Upgrade transitions must require explicit exact-owner, stopped/drained, and target-ready outcomes bound to the intended generation.
- Invariant: Upgrade transitions must require explicit exact-owner, stopped/drained, and target-ready outcomes bound to the intended generation.
- Root cause: The orchestrator treats promise resolution as lifecycle success and uses a permissive health/readiness predicate.
- Trigger: Plan, stop, or start during upgrade.
- Minimal fix boundary: Define an exact lifecycle outcome matrix, require both generation-bound health and readiness where applicable, verify stopped/drained state after stop, verify target ready after start, and persist the actual receipts.
- Regression risks:
- R06 fixes may change outcome names; R09 should consume an explicit stable contract rather than duplicate process logic.

### BWS120-R09-011 — Rollback starts the prior release without first fencing or stopping a partially started target

- Severity: `P1`
- Current behavior: The prior release is started directly while partial target processes may still exist.
- Expected behavior: Rollback must first establish exclusive ownership, stop/drain/fence every partial target component, verify no target generation remains, then start and verify the prior release.
- Invariant: Rollback must first establish exclusive ownership, stop/drain/fence every partial target component, verify no target generation remains, then start and verify the prior release.
- Root cause: Rollback assumes a thrown target start produced no owned residual process or side effect.
- Trigger: Execute rollbackOnFailure=true.
- Minimal fix boundary: Retain the target runtime generation receipt before start, invoke generation-specific stop/drain on failure, verify zero residual ownership, then start the previous immutable release and validate readiness.
- Regression risks:
- Cleanup must not lose emergency control of ambiguous processes.
- Coordinate with R06 shutdown ordering and fencing.


## Allowed edit boundary

- Candidate path set: `packages/bootstrap/src/operations/release-upgrade.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `packages/bootstrap/src/operations/release-upgrade.ts` | participating tranches=T31, T33, T34 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- Execution, public signals, and live financial operations remain disabled and out of scope.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T21, T23, T31, T33.
- Review prerequisites: `T31; R06 lifecycle fencing; exclusive upgrade epoch`.
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

- `BWS120-R09-005-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-005 | requirement=mutate envFile with unchanged fingerprint
- `BWS120-R09-005-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-005 | requirement=mutate target directory
- `BWS120-R09-005-TEST-03` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-005 | requirement=mutate checkpoint/state path
- `BWS120-R09-005-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-005 | requirement=mutate status/reasons/policy
- `BWS120-R09-005-TEST-05` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-005 | requirement=unknown or extra fields under canonical serialization
- `BWS120-R09-006-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-006 | requirement=environment mutation after plan
- `BWS120-R09-006-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-006 | requirement=target file mutation after plan
- `BWS120-R09-006-TEST-03` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-006 | requirement=current release mutation after plan
- `BWS120-R09-006-TEST-04` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-006 | requirement=install verification replacement
- `BWS120-R09-006-TEST-05` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-006 | requirement=backup/restore evidence replacement
- `BWS120-R09-006-TEST-06` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-006 | requirement=mutation after pre-apply revalidation but before side effect using immutable handles or generation locks
- `BWS120-R09-007-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-007 | requirement=two processes apply the same plan
- `BWS120-R09-007-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-007 | requirement=apply and recover overlap
- `BWS120-R09-007-TEST-03` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-007 | requirement=owner crash and fenced takeover
- `BWS120-R09-007-TEST-04` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-007 | requirement=stale owner attempts checkpoint after takeover
- `BWS120-R09-007-TEST-05` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-007 | requirement=concurrent rollback and upgrade completion
- `BWS120-R09-008-TEST-01` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-008 | requirement=new plan same releases different environment
- `BWS120-R09-008-TEST-02` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-008 | requirement=new plan same releases different evidence
- `BWS120-R09-008-TEST-03` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-008 | requirement=new plan after prior rollback
- `BWS120-R09-008-TEST-04` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-008 | requirement=state path collision across plans
- `BWS120-R09-008-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-008 | requirement=explicit archival and fresh-state creation
- `BWS120-R09-009-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-009 | requirement=tampered checkpoint file
- `BWS120-R09-009-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-009 | requirement=missing checkpoint file
- `BWS120-R09-009-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-009 | requirement=state with duplicate/out-of-order classifications
- `BWS120-R09-009-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-009 | requirement=target dies after target_started checkpoint
- `BWS120-R09-009-TEST-05` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-009 | requirement=target generation replaced before resume
- `BWS120-R09-010-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-010 | requirement=stop resolves already_running/degraded/blocked
- `BWS120-R09-010-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-010 | requirement=start resolves started with blocked readiness
- `BWS120-R09-010-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-010 | requirement=health healthy but readiness blocked
- `BWS120-R09-010-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-010 | requirement=readiness ready but health blocked
- `BWS120-R09-010-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-010 | requirement=generation mismatch after start
- `BWS120-R09-011-TEST-01` | category=api_or_projection | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-011 | requirement=target spawns API then throws
- `BWS120-R09-011-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-011 | requirement=target starts all children but readiness fails
- `BWS120-R09-011-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-011 | requirement=target stop partially fails
- `BWS120-R09-011-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-011 | requirement=port conflict during old start
- `BWS120-R09-011-TEST-05` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-011 | requirement=crash between target cleanup and prior start

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS120-R09-005-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-005 | requirement=mutate envFile with unchanged fingerprint
- `BWS120-R09-005-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-005 | requirement=mutate target directory
- `BWS120-R09-005-TEST-03` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-005 | requirement=mutate checkpoint/state path
- `BWS120-R09-005-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-005 | requirement=mutate status/reasons/policy
- `BWS120-R09-005-TEST-05` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-005 | requirement=unknown or extra fields under canonical serialization
- `BWS120-R09-006-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-006 | requirement=environment mutation after plan
- `BWS120-R09-006-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-006 | requirement=target file mutation after plan
- `BWS120-R09-006-TEST-03` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-006 | requirement=current release mutation after plan
- `BWS120-R09-006-TEST-04` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-006 | requirement=install verification replacement
- `BWS120-R09-006-TEST-05` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-006 | requirement=backup/restore evidence replacement
- `BWS120-R09-006-TEST-06` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-006 | requirement=mutation after pre-apply revalidation but before side effect using immutable handles or generation locks
- `BWS120-R09-007-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-007 | requirement=two processes apply the same plan
- `BWS120-R09-007-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-007 | requirement=apply and recover overlap
- `BWS120-R09-007-TEST-03` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-007 | requirement=owner crash and fenced takeover
- `BWS120-R09-007-TEST-04` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-007 | requirement=stale owner attempts checkpoint after takeover
- `BWS120-R09-007-TEST-05` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-007 | requirement=concurrent rollback and upgrade completion
- `BWS120-R09-008-TEST-01` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-008 | requirement=new plan same releases different environment
- `BWS120-R09-008-TEST-02` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-008 | requirement=new plan same releases different evidence
- `BWS120-R09-008-TEST-03` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-008 | requirement=new plan after prior rollback
- `BWS120-R09-008-TEST-04` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-008 | requirement=state path collision across plans
- `BWS120-R09-008-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-008 | requirement=explicit archival and fresh-state creation
- `BWS120-R09-009-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-009 | requirement=tampered checkpoint file
- `BWS120-R09-009-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-009 | requirement=missing checkpoint file
- `BWS120-R09-009-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-009 | requirement=state with duplicate/out-of-order classifications
- `BWS120-R09-009-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-009 | requirement=target dies after target_started checkpoint
- `BWS120-R09-009-TEST-05` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-009 | requirement=target generation replaced before resume
- `BWS120-R09-010-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-010 | requirement=stop resolves already_running/degraded/blocked
- `BWS120-R09-010-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-010 | requirement=start resolves started with blocked readiness
- `BWS120-R09-010-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-010 | requirement=health healthy but readiness blocked
- `BWS120-R09-010-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-010 | requirement=readiness ready but health blocked
- `BWS120-R09-010-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-010 | requirement=generation mismatch after start
- `BWS120-R09-011-TEST-01` | category=api_or_projection | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-011 | requirement=target spawns API then throws
- `BWS120-R09-011-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-011 | requirement=target starts all children but readiness fails
- `BWS120-R09-011-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-011 | requirement=target stop partially fails
- `BWS120-R09-011-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-011 | requirement=port conflict during old start
- `BWS120-R09-011-TEST-05` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-011 | requirement=crash between target cleanup and prior start

## Negative and adversarial tests

- `BWS120-R09-005-TEST-03` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-005 | requirement=mutate checkpoint/state path
- `BWS120-R09-005-TEST-05` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-005 | requirement=unknown or extra fields under canonical serialization
- `BWS120-R09-007-TEST-04` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-007 | requirement=stale owner attempts checkpoint after takeover
- `BWS120-R09-008-TEST-04` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-008 | requirement=state path collision across plans
- `BWS120-R09-009-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-009 | requirement=state with duplicate/out-of-order classifications
- `BWS120-R09-010-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-010 | requirement=generation mismatch after start

## Concurrency, cancellation, crash, and restart tests

- `BWS120-R09-005-TEST-05` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-005 | requirement=unknown or extra fields under canonical serialization
- `BWS120-R09-007-TEST-03` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-007 | requirement=owner crash and fenced takeover
- `BWS120-R09-007-TEST-04` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-007 | requirement=stale owner attempts checkpoint after takeover
- `BWS120-R09-007-TEST-05` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-007 | requirement=concurrent rollback and upgrade completion
- `BWS120-R09-008-TEST-03` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-008 | requirement=new plan after prior rollback
- `BWS120-R09-009-TEST-05` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-009 | requirement=target generation replaced before resume
- `BWS120-R09-011-TEST-05` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-011 | requirement=crash between target cleanup and prior start

## Environment proof

- NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION: 36 requirements

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

Acceptance authority: plan recomputed; all inputs rebound; one owner; state scoped to plan; checkpoint bytes/current target verified; lifecycle failures not success; partial target fenced before prior restart

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W3-T35` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
