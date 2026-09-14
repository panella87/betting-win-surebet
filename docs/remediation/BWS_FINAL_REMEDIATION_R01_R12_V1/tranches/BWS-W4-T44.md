
# BWS-W4-T44 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W4-T44
CAMPAIGN_ORDER: 10
STAGE: S2
PRIMARY_OWNER: R12
SECONDARY_REVIEWERS: R06, R09, R10, R11
ISSUE_IDS: BWS121-R12-001, BWS121-R12-002, BWS121-R12-003, BWS121-R12-004
SEVERITY_COUNTS: {"P1": 4}
DEPENDENCIES: T40
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen application-source baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; documentation-audit preimage betting-win-surebet125.zip sha256=72a8262a5f94d144bb930cc9fb2778eed672d2a97a252f49b07f7b979b47224f with 995 regular files and no accepted remediation source result; this overlay changes documentation only; exact checkout/Git/source state must be reverified before editing
CURRENT_SOURCE_PATH_CANDIDATES: .automation/lib/run_common.sh, run-autonomous-bugfix.sh, run-autonomous-implementation.sh, run-bugfix-autopilot.sh, run-paper-autopilot.sh, run-paper-evaluation.sh
SYMBOLS_TO_REVERIFY: 11 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: .automation/lib/run_common.sh, run-autonomous-bugfix.sh, run-autonomous-implementation.sh, run-bugfix-autopilot.sh, run-paper-autopilot.sh, run-paper-evaluation.sh
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
FOCUSED_TESTS: 20 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 20 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 7 classified records below
CONCURRENCY_OR_CRASH_TESTS: 3 classified records below
ENVIRONMENT_PROOF: {"AS_SPECIFIED_BY_REVIEW": 20}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: Non-bypassable controller ownership, monotonic heartbeat updates, self-fencing, and child-aware stale takeover.
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": true, "bws_710": true, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W4-T45 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `.automation/lib/run_common.sh` | present=yes | sha256=d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619 | mode=0755 | authorization=TO_CONFIRM_DURING_ADMISSION
- `run-autonomous-bugfix.sh` | present=yes | sha256=fd3f9dcc110763c5ed88c1eba6bcb1ed1a94d4034b7757051b2fb6d1ab385a1b | mode=0755 | authorization=TO_CONFIRM_DURING_ADMISSION
- `run-autonomous-implementation.sh` | present=yes | sha256=cf373b5b75fdeeb4b7e83c9bdf2ce984e92a4ffecd85da6207481b479861d14a | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `run-bugfix-autopilot.sh` | present=yes | sha256=e96b91399d507f223d4e8ce7c1d74a19597ef15fa21eb1bbf52a4b81408d97f8 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `run-paper-autopilot.sh` | present=yes | sha256=fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `run-paper-evaluation.sh` | present=yes | sha256=d7d821119d51c3dd5bbcf7a80f0e98488ebd38f7d771310265939a918505e667 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS121-R12-001 | `run-autonomous-implementation.sh` | symbol=usage / parse_args / controller startup | reviewed_line_range=L98-L105, L135-L166, L1179-L1189 | reviewed_sha256=cf373b5b75fdeeb4b7e83c9bdf2ce984e92a4ffecd85da6207481b479861d14a
- BWS121-R12-001 | `run-autonomous-bugfix.sh` | symbol=usage / parse_args / controller startup | reviewed_line_range=L90-L96, L123-L161, L915-L925 | reviewed_sha256=fd3f9dcc110763c5ed88c1eba6bcb1ed1a94d4034b7757051b2fb6d1ab385a1b
- BWS121-R12-001 | `run-paper-evaluation.sh` | symbol=parse_args / controller startup | reviewed_line_range=L235-L253, L947-L957 | reviewed_sha256=d7d821119d51c3dd5bbcf7a80f0e98488ebd38f7d771310265939a918505e667
- BWS121-R12-001 | `.automation/lib/run_common.sh` | symbol=automation_acquire_lock | reviewed_line_range=L474-L529 | reviewed_sha256=d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619
- BWS121-R12-002 | `.automation/lib/run_common.sh` | symbol=automation_write_lock_file / automation_refresh_lock_heartbeat | reviewed_line_range=L348-L387 | reviewed_sha256=d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619
- BWS121-R12-002 | `.automation/lib/run_common.sh` | symbol=automation_set_active_child / automation_clear_active_child | reviewed_line_range=L562-L578 | reviewed_sha256=d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619
- BWS121-R12-003 | `.automation/lib/run_common.sh` | symbol=automation_start_heartbeat | reviewed_line_range=L531-L539 | reviewed_sha256=d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619
- BWS121-R12-003 | `run-paper-autopilot.sh` | symbol=start_parent_lock_heartbeat | reviewed_line_range=L491-L507 | reviewed_sha256=fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661
- BWS121-R12-003 | `run-bugfix-autopilot.sh` | symbol=start_parent_lock_heartbeat | reviewed_line_range=L438-L454 | reviewed_sha256=e96b91399d507f223d4e8ce7c1d74a19597ef15fa21eb1bbf52a4b81408d97f8
- BWS121-R12-004 | `.automation/lib/run_common.sh` | symbol=automation_acquire_lock | reviewed_line_range=L474-L529 | reviewed_sha256=d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619
- BWS121-R12-004 | `.automation/lib/run_common.sh` | symbol=automation_force_unlock | reviewed_line_range=L422-L470 | reviewed_sha256=d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS121-R12-001 — Standalone controllers expose an unrestricted lock-bypass mode for source-affecting runs

- Severity: `P1`
- Current behavior: The flag bypasses both the controller-specific lock and the shared incompatible-controller guard, yet the process still creates run artifacts, executes validation or Codex paths, writes global handoffs, performs cleanup, and publishes artifacts.zip.
- Expected behavior: Every source-affecting controller must have one non-bypassable repository owner. Any concurrency option must be limited to demonstrably read-only inspection that cannot write source, handoffs, locks, run directories, or the shared archive.
- Invariant: Every source-affecting controller must have one non-bypassable repository owner. Any concurrency option must be limited to demonstrably read-only inspection that cannot write source, handoffs, locks, run directories, or the shared archive.
- Root cause: An operator-convenience switch is implemented as a total ownership bypass rather than a narrowly scoped, read-only concurrency capability.
- Trigger: Start two source-affecting controller invocations against the same repository while at least one uses --allow-parallel.
- Minimal fix boundary: Remove the bypass from source-affecting modes. If a concurrent inspection mode is required, give it a separate entrypoint with immutable source input, no global handoffs, no cleanup, no artifacts.zip publication, and no source-writing sandbox.
- Regression risks:
- Removing the flag may affect undocumented operator workflows.
- Parent-launched child exceptions must continue through authenticated parent-lock contracts rather than a generic bypass.

### BWS121-R12-002 — Standalone heartbeat refresh can overwrite newer active-child ownership metadata

- Severity: `P1`
- Current behavior: The heartbeat rewrites a stale full-file snapshot. Its final mv can erase a newly written ACTIVE_CHILD_* tuple or resurrect a child tuple that was already cleared.
- Expected behavior: Heartbeat must update only heartbeat authority, or perform an owner- and generation-checked compare-and-swap that cannot roll back any concurrently published child fields.
- Invariant: Heartbeat must update only heartbeat authority, or perform an owner- and generation-checked compare-and-swap that cannot roll back any concurrently published child fields.
- Root cause: Heartbeat and child ownership share one mutable whole-file record without serialization or a monotonic lock generation.
- Trigger: Interleave automation_refresh_lock_heartbeat between its read and mv with automation_set_active_child or automation_clear_active_child.
- Minimal fix boundary: Use the hardened mtime-only heartbeat pattern or split heartbeat from ownership. If content must change, retain an immutable lock ID and compare inode plus digest/generation immediately before atomic replacement.
- Regression risks:
- Changing lock schema requires compatibility handling for existing operator locks.
- A content-CAS loop must remain bounded and must not hide lost ownership.

### BWS121-R12-003 — Heartbeat loss does not fence or stop the controller that owns the stale lock

- Severity: `P1`
- Current behavior: Standalone controllers ignore every refresh failure. Parent heartbeat subprocesses terminate on failure, but the main loops do not check HEARTBEAT_PID or a shared failure state and continue work.
- Expected behavior: Loss of the ownership heartbeat must synchronously transition the controller to a fenced terminal state, stop new work, terminate or drain owned children, and preserve evidence that ownership was lost.
- Invariant: Loss of the ownership heartbeat must synchronously transition the controller to a fenced terminal state, stop new work, terminate or drain owned children, and preserve evidence that ownership was lost.
- Root cause: Heartbeat is treated as a best-effort background side effect instead of a mandatory lease/fencing condition.
- Trigger: Cause a heartbeat refresh to fail while the main controller and a managed child continue running.
- Minimal fix boundary: Add an error channel or supervised heartbeat task. The main loop must check it before and after every child transition and during waits, then execute one bounded fenced shutdown path.
- Regression risks:
- Transient filesystem errors require an explicit bounded retry policy.
- Fencing must not allow an unverified process to delete a successor lock.

### BWS121-R12-004 — Standalone stale-lock takeover deletes ownership without verifying the recorded active child is gone

- Severity: `P1`
- Current behavior: The automatic path sends TERM only to the parent, waits for that PID, removes the lock, and claims a replacement. It never validates the child tuple or confirms the child process group is empty.
- Expected behavior: Stale recovery must authenticate and drain the recorded child/process group before releasing or replacing ownership, and must fail closed if child termination cannot be proven.
- Invariant: Stale recovery must authenticate and drain the recorded child/process group before releasing or replacing ownership, and must fail closed if child termination cannot be proven.
- Root cause: Automatic stale recovery assumes the stale owner’s signal trap will perform complete child cleanup instead of independently proving the durable lock’s recorded ownership graph.
- Trigger: Start another standalone controller after the heartbeat threshold.
- Minimal fix boundary: Reuse one authenticated child-first recovery routine for both automatic and explicit takeover. Preserve the lock and block replacement if any recorded process group cannot be proven empty.
- Regression risks:
- Recovery must avoid signaling a reused PID.
- A child-first sequence must remain compatible with parent traps that also attempt cleanup.


## Allowed edit boundary

- Candidate path set: `.automation/lib/run_common.sh`, `run-autonomous-bugfix.sh`, `run-autonomous-implementation.sh`, `run-bugfix-autopilot.sh`, `run-paper-autopilot.sh`, `run-paper-evaluation.sh`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `.automation/lib/run_common.sh` | participating tranches=T44, T45, T46, T47 | predecessor postimage required
- `run-autonomous-bugfix.sh` | participating tranches=T44, T46, T47 | predecessor postimage required
- `run-autonomous-implementation.sh` | participating tranches=T44, T46, T47 | predecessor postimage required
- `run-bugfix-autopilot.sh` | participating tranches=T44, T45, T46, T47 | predecessor postimage required
- `run-paper-autopilot.sh` | participating tranches=T28, T29, T44, T45, T46, T47 | predecessor postimage required
- `run-paper-evaluation.sh` | participating tranches=T28, T29, T44, T46 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- Authenticated parent-launched child exceptions remain supported.
- Explicit operator force-unlock remains identity-checked.
- Fresh locks continue to block takeover.
- No automatic takeover is authorized until ownership loss is proven.
- No provider or live-execution capability is introduced.
- Normal heartbeat intervals and lock-staleness thresholds remain configurable.
- Parent-autopilot mtime heartbeat remains an intentional safeguard.
- Status, print-config, and force-unlock operations remain available without starting a work run.
- Strict PID boot-ID and start-tick checks remain unchanged.
- all betting-win source, checkout, documentation, service, database, and runtime
- betting-win; live execution; current BWS-600/BWS-710/BWS-900 holds
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T40.
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

- `BWS121-R12-REQ-001` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-001 | requirement=Two-process barrier test proving a second standalone controller fails before run-directory creation.
- `BWS121-R12-REQ-002` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-001 | requirement=Cross-controller matrix covering implementation, bugfix, paper evaluation, paper autopilot, and bugfix autopilot.
- `BWS121-R12-REQ-003` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-001 | requirement=Negative test that --allow-parallel is rejected for all source-affecting modes.
- `BWS121-R12-REQ-004` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-001 | requirement=Read-only inspection mode test, if introduced, proving no mutable repository path is opened.
- `BWS121-R12-REQ-005` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-002 | requirement=Deterministic two-writer barrier test for heartbeat versus child registration.
- `BWS121-R12-REQ-006` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-002 | requirement=Heartbeat versus child clear test proving no stale child resurrection.
- `BWS121-R12-REQ-007` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-002 | requirement=Repeated stress test under fixed and regressing clocks.
- `BWS121-R12-REQ-008` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-002 | requirement=Stale takeover test that consumes the resulting lock and proves exact child ownership.
- `BWS121-R12-REQ-009` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-003 | requirement=Delete or replace the lock while a standalone managed command is active.
- `BWS121-R12-REQ-010` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-003 | requirement=Force parent heartbeat ownership validation failure during each autopilot child phase.
- `BWS121-R12-REQ-011` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-003 | requirement=Verify no new child starts after heartbeat loss.
- `BWS121-R12-REQ-012` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-003 | requirement=Verify lock-loss evidence and exact child cleanup on shutdown.
- `BWS121-R12-REQ-013` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-004 | requirement=Stale parent that ignores TERM while child remains live.
- `BWS121-R12-REQ-014` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-004 | requirement=Parent exits immediately on TERM without child cleanup.
- `BWS121-R12-REQ-015` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-004 | requirement=Dead parent with live verified child.
- `BWS121-R12-REQ-016` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-004 | requirement=Mismatched child identity must preserve the lock and fail closed.
- `BWS121-R12-TG-001` | category=concurrency_or_ownership | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-001 | requirement=No two-process test rejects --allow-parallel source-affecting concurrency before run creation
- `BWS121-R12-TG-002` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-002 | requirement=No barrier test interleaves standalone heartbeat replacement with active-child registration
- `BWS121-R12-TG-003` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-003 | requirement=No test forces heartbeat failure and proves the main controller fences itself
- `BWS121-R12-TG-004` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-004 | requirement=No stale-takeover test retains a live recorded child after parent exit

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS121-R12-REQ-001` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-001 | requirement=Two-process barrier test proving a second standalone controller fails before run-directory creation.
- `BWS121-R12-REQ-002` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-001 | requirement=Cross-controller matrix covering implementation, bugfix, paper evaluation, paper autopilot, and bugfix autopilot.
- `BWS121-R12-REQ-003` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-001 | requirement=Negative test that --allow-parallel is rejected for all source-affecting modes.
- `BWS121-R12-REQ-004` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-001 | requirement=Read-only inspection mode test, if introduced, proving no mutable repository path is opened.
- `BWS121-R12-REQ-005` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-002 | requirement=Deterministic two-writer barrier test for heartbeat versus child registration.
- `BWS121-R12-REQ-006` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-002 | requirement=Heartbeat versus child clear test proving no stale child resurrection.
- `BWS121-R12-REQ-007` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-002 | requirement=Repeated stress test under fixed and regressing clocks.
- `BWS121-R12-REQ-008` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-002 | requirement=Stale takeover test that consumes the resulting lock and proves exact child ownership.
- `BWS121-R12-REQ-009` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-003 | requirement=Delete or replace the lock while a standalone managed command is active.
- `BWS121-R12-REQ-010` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-003 | requirement=Force parent heartbeat ownership validation failure during each autopilot child phase.
- `BWS121-R12-REQ-011` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-003 | requirement=Verify no new child starts after heartbeat loss.
- `BWS121-R12-REQ-012` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-003 | requirement=Verify lock-loss evidence and exact child cleanup on shutdown.
- `BWS121-R12-REQ-013` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-004 | requirement=Stale parent that ignores TERM while child remains live.
- `BWS121-R12-REQ-014` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-004 | requirement=Parent exits immediately on TERM without child cleanup.
- `BWS121-R12-REQ-015` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-004 | requirement=Dead parent with live verified child.
- `BWS121-R12-REQ-016` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-004 | requirement=Mismatched child identity must preserve the lock and fail closed.
- `BWS121-R12-TG-001` | category=concurrency_or_ownership | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-001 | requirement=No two-process test rejects --allow-parallel source-affecting concurrency before run creation
- `BWS121-R12-TG-002` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-002 | requirement=No barrier test interleaves standalone heartbeat replacement with active-child registration
- `BWS121-R12-TG-003` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-003 | requirement=No test forces heartbeat failure and proves the main controller fences itself
- `BWS121-R12-TG-004` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-004 | requirement=No stale-takeover test retains a live recorded child after parent exit

## Negative and adversarial tests

- `BWS121-R12-REQ-003` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-001 | requirement=Negative test that --allow-parallel is rejected for all source-affecting modes.
- `BWS121-R12-REQ-004` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-001 | requirement=Read-only inspection mode test, if introduced, proving no mutable repository path is opened.
- `BWS121-R12-REQ-006` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-002 | requirement=Heartbeat versus child clear test proving no stale child resurrection.
- `BWS121-R12-REQ-008` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-002 | requirement=Stale takeover test that consumes the resulting lock and proves exact child ownership.
- `BWS121-R12-REQ-013` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-004 | requirement=Stale parent that ignores TERM while child remains live.
- `BWS121-R12-REQ-016` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-004 | requirement=Mismatched child identity must preserve the lock and fail closed.
- `BWS121-R12-TG-004` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-004 | requirement=No stale-takeover test retains a live recorded child after parent exit

## Concurrency, cancellation, crash, and restart tests

- `BWS121-R12-REQ-013` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-004 | requirement=Stale parent that ignores TERM while child remains live.
- `BWS121-R12-TG-001` | category=concurrency_or_ownership | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-001 | requirement=No two-process test rejects --allow-parallel source-affecting concurrency before run creation
- `BWS121-R12-TG-004` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-004 | requirement=No stale-takeover test retains a live recorded child after parent exit

## Environment proof

- AS_SPECIFIED_BY_REVIEW: 20 requirements

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

Acceptance authority: Non-bypassable controller ownership, monotonic heartbeat updates, self-fencing, and child-aware stale takeover.

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W4-T45` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
