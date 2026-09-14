
# BWS-W4-T46 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W4-T46
CAMPAIGN_ORDER: 12
STAGE: S2
PRIMARY_OWNER: R12
SECONDARY_REVIEWERS: R06, R07, R08, R09, R11
ISSUE_IDS: BWS121-R12-008, BWS121-R12-009, BWS121-R12-010
SEVERITY_COUNTS: {"P1": 3}
DEPENDENCIES: T44, T45
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen application-source baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; documentation-audit preimage betting-win-surebet125.zip sha256=72a8262a5f94d144bb930cc9fb2778eed672d2a97a252f49b07f7b979b47224f with 995 regular files and no accepted remediation source result; this overlay changes documentation only; exact checkout/Git/source state must be reverified before editing
CURRENT_SOURCE_PATH_CANDIDATES: .automation/lib/controller_hardening_v2.sh, .automation/lib/run_common.sh, run-autonomous-bugfix.sh, run-autonomous-implementation.sh, run-bugfix-autopilot.sh, run-paper-autopilot.sh, run-paper-evaluation.sh
SYMBOLS_TO_REVERIFY: 11 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: .automation/lib/controller_hardening_v2.sh, .automation/lib/run_common.sh, run-autonomous-bugfix.sh, run-autonomous-implementation.sh, run-bugfix-autopilot.sh, run-paper-autopilot.sh, run-paper-evaluation.sh
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
FOCUSED_TESTS: 15 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 15 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 5 classified records below
CONCURRENCY_OR_CRASH_TESTS: 3 classified records below
ENVIRONMENT_PROOF: {"AS_SPECIFIED_BY_REVIEW": 15}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: Exclusive run identities, quiescent finalization, and lifecycle-aware cleanup.
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": true, "bws_710": true, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W4-T47 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `.automation/lib/controller_hardening_v2.sh` | present=yes | sha256=d67e2780d7968e5f25b0c7735486b140aa186708bbddda1b3d90cbb5f21f19a1 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `.automation/lib/run_common.sh` | present=yes | sha256=d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619 | mode=0755 | authorization=TO_CONFIRM_DURING_ADMISSION
- `run-autonomous-bugfix.sh` | present=yes | sha256=fd3f9dcc110763c5ed88c1eba6bcb1ed1a94d4034b7757051b2fb6d1ab385a1b | mode=0755 | authorization=TO_CONFIRM_DURING_ADMISSION
- `run-autonomous-implementation.sh` | present=yes | sha256=cf373b5b75fdeeb4b7e83c9bdf2ce984e92a4ffecd85da6207481b479861d14a | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `run-bugfix-autopilot.sh` | present=yes | sha256=e96b91399d507f223d4e8ce7c1d74a19597ef15fa21eb1bbf52a4b81408d97f8 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `run-paper-autopilot.sh` | present=yes | sha256=fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `run-paper-evaluation.sh` | present=yes | sha256=d7d821119d51c3dd5bbcf7a80f0e98488ebd38f7d771310265939a918505e667 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS121-R12-008 | `.automation/lib/run_common.sh` | symbol=automation_create_run_dir | reviewed_line_range=L646-L672 | reviewed_sha256=d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619
- BWS121-R12-008 | `.automation/lib/run_common.sh` | symbol=automation_quarantine_lock | reviewed_line_range=L389-L395 | reviewed_sha256=d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619
- BWS121-R12-008 | `run-paper-autopilot.sh` | symbol=rotate_stale_handoffs | reviewed_line_range=L569-L576 | reviewed_sha256=fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661
- BWS121-R12-008 | `run-bugfix-autopilot.sh` | symbol=rotate_stale_handoffs | reviewed_line_range=L542-L549 | reviewed_sha256=e96b91399d507f223d4e8ce7c1d74a19597ef15fa21eb1bbf52a4b81408d97f8
- BWS121-R12-009 | `run-autonomous-implementation.sh` | symbol=finish / on_signal | reviewed_line_range=L1020-L1054, L1088-L1139, L1152-L1164 | reviewed_sha256=cf373b5b75fdeeb4b7e83c9bdf2ce984e92a4ffecd85da6207481b479861d14a
- BWS121-R12-009 | `run-autonomous-bugfix.sh` | symbol=finish / on_signal | reviewed_line_range=L713-L797 | reviewed_sha256=fd3f9dcc110763c5ed88c1eba6bcb1ed1a94d4034b7757051b2fb6d1ab385a1b
- BWS121-R12-009 | `run-paper-evaluation.sh` | symbol=finish / on_signal | reviewed_line_range=L696-L790 | reviewed_sha256=d7d821119d51c3dd5bbcf7a80f0e98488ebd38f7d771310265939a918505e667
- BWS121-R12-009 | `.automation/lib/run_common.sh` | symbol=automation_release_lock | reviewed_line_range=L542-L559 | reviewed_sha256=d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619
- BWS121-R12-010 | `.automation/lib/run_common.sh` | symbol=automation_artifact_residue_name_is_transient / automation_cleanup_transient_artifact_residue | reviewed_line_range=L987-L1099 | reviewed_sha256=d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619
- BWS121-R12-010 | `.automation/lib/controller_hardening_v2.sh` | symbol=automation_v2_zip_with_timeout | reviewed_line_range=L1187-L1206 | reviewed_sha256=d67e2780d7968e5f25b0c7735486b140aa186708bbddda1b3d90cbb5f21f19a1
- BWS121-R12-010 | `.automation/lib/run_common.sh` | symbol=automation_build_artifacts_zip | reviewed_line_range=L1351-L1375 | reviewed_sha256=d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS121-R12-008 — Second-resolution artifact identities are non-exclusive and can merge or overwrite distinct controller runs

- Severity: `P1`
- Current behavior: Distinct generations resolve to the same pathname. Run creation reuses it and truncates controller.log; ordinary mv can replace an earlier same-second destination.
- Expected behavior: Every run and rotated evidence object must have a collision-resistant immutable ID and be created with exclusive no-replace semantics.
- Invariant: Every run and rotated evidence object must have a collision-resistant immutable ID and be created with exclusive no-replace semantics.
- Root cause: Timestamp is used as uniqueness authority rather than metadata attached to an exclusive generation identifier.
- Trigger: Create two same-slug run directories or rotate the same evidence name under a fixed second.
- Minimal fix boundary: Use a cryptographically random or monotonic generation ID, mkdir without -p for the final run path, no-replace rename/link semantics for rotated evidence, and a manifest that binds timestamp to generation.
- Regression risks:
- Progress and operator tooling must learn the new generation format.
- Do not replace one collision-prone timestamp with a process-local counter that resets after restart.

### BWS121-R12-009 — Standalone finalization packages evidence before proving active children are quiescent

- Severity: `P1`
- Current behavior: The first final summary, repository snapshot, and artifacts.zip are produced before active-child cleanup occurs through lock release. A late child can modify the very tree being archived or write after publication.
- Expected behavior: Finalization must first fence new work, terminate/drain the exact child group, reconcile ambiguous side effects, and only then snapshot, summarize, and publish terminal artifacts.
- Invariant: Finalization must first fence new work, terminate/drain the exact child group, reconcile ambiguous side effects, and only then snapshot, summarize, and publish terminal artifacts.
- Root cause: Standalone finalization treats lock release as ownership bookkeeping rather than the child-quiescence boundary that must precede terminal evidence.
- Trigger: Interrupt a standalone controller while its managed child is still producing output.
- Minimal fix boundary: Introduce one shared standalone shutdown routine: mark fenced, supervise/terminate the group, confirm drain, reconcile source and handoff state, then write terminal evidence and publish once.
- Regression risks:
- Moving cleanup earlier must preserve diagnostic logs and ambiguous-side-effect evidence.
- Signal handling must remain reentrant-safe and execute finalization exactly once.

### BWS121-R12-010 — Artifact cleanup can recursively delete a live operation solely because its basename is allowlisted

- Severity: `P1`
- Current behavior: The helper accepts the path based only on canonical containment, name pattern, and mtime threshold. Packaging uses threshold zero and recursively removes the selected directory without checking a lock, owner marker, PID identity, or second stat/digest.
- Expected behavior: Cleanup must prove a candidate belongs to a completed disposable generation and remains unchanged and unowned from selection through deletion.
- Invariant: Cleanup must prove a candidate belongs to a completed disposable generation and remains unchanged and unowned from selection through deletion.
- Root cause: Residue class is inferred from pathname rather than authenticated lifecycle ownership and terminality.
- Trigger: Package artifacts while a writer remains active in an allowlisted path such as bws-release-package-live.
- Minimal fix boundary: Require immutable owner/generation metadata, terminal receipt, no-live-owner proof, minimum quiescence, and pre-delete inode/digest revalidation. Packaging should not perform destructive cleanup implicitly unless those proofs pass.
- Regression risks:
- Stricter cleanup may leave more residue and needs an explicit operator-visible plan.
- Owner metadata itself must be protected from spoofing and stale reuse.


## Allowed edit boundary

- Candidate path set: `.automation/lib/controller_hardening_v2.sh`, `.automation/lib/run_common.sh`, `run-autonomous-bugfix.sh`, `run-autonomous-implementation.sh`, `run-bugfix-autopilot.sh`, `run-paper-autopilot.sh`, `run-paper-evaluation.sh`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `.automation/lib/controller_hardening_v2.sh` | participating tranches=T29, T45, T46 | predecessor postimage required
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

- Canonical containment and no-symlink checks remain mandatory.
- Existing run directories remain immutable historical evidence.
- Human-readable timestamps remain available as metadata.
- Lock-release failure remains a blocked terminal state.
- Parent autopilots keep their child-before-package ordering.
- Unknown names continue to be preserved rather than deleted.
- all betting-win source, checkout, documentation, service, database, and runtime
- betting-win; live execution; current BWS-600/BWS-710/BWS-900 holds
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T44, T45.
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

- `BWS121-R12-REQ-031` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-008 | requirement=Fixed-clock concurrent run creation.
- `BWS121-R12-REQ-032` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-008 | requirement=Immediate restart in the same second.
- `BWS121-R12-REQ-033` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-008 | requirement=Same-second quarantine and stale-handoff rotation.
- `BWS121-R12-REQ-034` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-008 | requirement=Collision must fail without modifying either existing object.
- `BWS121-R12-REQ-035` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-009 | requirement=INT during Codex execution while the child writes a run log.
- `BWS121-R12-REQ-036` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-009 | requirement=TERM during validation with a descendant process.
- `BWS121-R12-REQ-037` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-009 | requirement=Child ignores TERM and requires KILL.
- `BWS121-R12-REQ-038` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-009 | requirement=Artifact build must observe a stable source and run-directory digest after cleanup.
- `BWS121-R12-REQ-039` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-010 | requirement=Live writer with an allowlisted basename.
- `BWS121-R12-REQ-040` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-010 | requirement=Candidate becomes live after scan but before deletion.
- `BWS121-R12-REQ-041` | category=concurrency_or_ownership | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-010 | requirement=PID reuse and stale owner marker.
- `BWS121-R12-REQ-042` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-010 | requirement=Completed scratch generation cleanup and archive rebuild happy path.
- `BWS121-R12-TG-008` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-008 | requirement=No fixed-clock exclusive-creation test covers run, quarantine, and stale-handoff identities
- `BWS121-R12-TG-009` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-009 | requirement=No signal-during-child-write test checks standalone final archive stability
- `BWS121-R12-TG-010` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-010 | requirement=No live-owner cleanup test prevents deletion of allowlisted active residue

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS121-R12-REQ-031` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-008 | requirement=Fixed-clock concurrent run creation.
- `BWS121-R12-REQ-032` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-008 | requirement=Immediate restart in the same second.
- `BWS121-R12-REQ-033` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-008 | requirement=Same-second quarantine and stale-handoff rotation.
- `BWS121-R12-REQ-034` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-008 | requirement=Collision must fail without modifying either existing object.
- `BWS121-R12-REQ-035` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-009 | requirement=INT during Codex execution while the child writes a run log.
- `BWS121-R12-REQ-036` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-009 | requirement=TERM during validation with a descendant process.
- `BWS121-R12-REQ-037` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-009 | requirement=Child ignores TERM and requires KILL.
- `BWS121-R12-REQ-038` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-009 | requirement=Artifact build must observe a stable source and run-directory digest after cleanup.
- `BWS121-R12-REQ-039` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-010 | requirement=Live writer with an allowlisted basename.
- `BWS121-R12-REQ-040` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-010 | requirement=Candidate becomes live after scan but before deletion.
- `BWS121-R12-REQ-041` | category=concurrency_or_ownership | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-010 | requirement=PID reuse and stale owner marker.
- `BWS121-R12-REQ-042` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-010 | requirement=Completed scratch generation cleanup and archive rebuild happy path.
- `BWS121-R12-TG-008` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-008 | requirement=No fixed-clock exclusive-creation test covers run, quarantine, and stale-handoff identities
- `BWS121-R12-TG-009` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-009 | requirement=No signal-during-child-write test checks standalone final archive stability
- `BWS121-R12-TG-010` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-010 | requirement=No live-owner cleanup test prevents deletion of allowlisted active residue

## Negative and adversarial tests

- `BWS121-R12-REQ-033` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-008 | requirement=Same-second quarantine and stale-handoff rotation.
- `BWS121-R12-REQ-034` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-008 | requirement=Collision must fail without modifying either existing object.
- `BWS121-R12-REQ-041` | category=concurrency_or_ownership | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-010 | requirement=PID reuse and stale owner marker.
- `BWS121-R12-REQ-042` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-010 | requirement=Completed scratch generation cleanup and archive rebuild happy path.
- `BWS121-R12-TG-008` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-008 | requirement=No fixed-clock exclusive-creation test covers run, quarantine, and stale-handoff identities

## Concurrency, cancellation, crash, and restart tests

- `BWS121-R12-REQ-032` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-008 | requirement=Immediate restart in the same second.
- `BWS121-R12-REQ-033` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-008 | requirement=Same-second quarantine and stale-handoff rotation.
- `BWS121-R12-REQ-041` | category=concurrency_or_ownership | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-010 | requirement=PID reuse and stale owner marker.

## Environment proof

- AS_SPECIFIED_BY_REVIEW: 15 requirements

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

Acceptance authority: Exclusive run identities, quiescent finalization, and lifecycle-aware cleanup.

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W4-T47` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
