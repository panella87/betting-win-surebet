
# BWS-W4-T45 implementation packet

> Documentation status: `PROPOSED_NOT_ACTIVE` for T39 and `NOT_ADMITTED` for all tranches. This packet does not authorize source mutation.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W4-T45
CAMPAIGN_ORDER: 11
STAGE: S2
PRIMARY_OWNER: R12
SECONDARY_REVIEWERS: R03, R06, R07, R11
ISSUE_IDS: BWS121-R12-005, BWS121-R12-006, BWS121-R12-007
SEVERITY_COUNTS: {"P1": 3}
DEPENDENCIES: T44
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; exact 771-member archive inventory; independently computed inventory digest=b81ff807e4c230bff96fe1fa58f73a2d4bac803ebd7fa58b843cdcb83499f7f0
CURRENT_SOURCE_PATH_CANDIDATES: .automation/lib/controller_hardening_v2.sh, .automation/lib/run_common.sh, run-bugfix-autopilot.sh, run-paper-autopilot.sh
SYMBOLS_TO_REVERIFY: 9 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: .automation/lib/controller_hardening_v2.sh, .automation/lib/run_common.sh, run-bugfix-autopilot.sh, run-paper-autopilot.sh
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
NEGATIVE_AND_ADVERSARIAL_TESTS: 1 classified records below
CONCURRENCY_OR_CRASH_TESTS: 7 classified records below
ENVIRONMENT_PROOF: {"AS_SPECIFIED_BY_REVIEW": 17}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: Enforced aggregate deadlines, whole-process-group terminality, and durable restart reconciliation.
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": true, "bws_710": true, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W4-T46 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `.automation/lib/controller_hardening_v2.sh` | present=yes | sha256=d67e2780d7968e5f25b0c7735486b140aa186708bbddda1b3d90cbb5f21f19a1 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `.automation/lib/run_common.sh` | present=yes | sha256=d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619 | mode=0755 | authorization=TO_CONFIRM_DURING_ADMISSION
- `run-bugfix-autopilot.sh` | present=yes | sha256=e96b91399d507f223d4e8ce7c1d74a19597ef15fa21eb1bbf52a4b81408d97f8 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `run-paper-autopilot.sh` | present=yes | sha256=fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS121-R12-005 | `run-paper-autopilot.sh` | symbol=run_child_controller | reviewed_line_range=L842-L893 | reviewed_sha256=fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661
- BWS121-R12-005 | `run-bugfix-autopilot.sh` | symbol=run_child_controller | reviewed_line_range=L792-L831 | reviewed_sha256=e96b91399d507f223d4e8ce7c1d74a19597ef15fa21eb1bbf52a4b81408d97f8
- BWS121-R12-006 | `run-paper-autopilot.sh` | symbol=run_child_controller / terminate_active_child | reviewed_line_range=L877-L893, L986-L1015 | reviewed_sha256=fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661
- BWS121-R12-006 | `run-bugfix-autopilot.sh` | symbol=run_child_controller | reviewed_line_range=L823-L831 | reviewed_sha256=e96b91399d507f223d4e8ce7c1d74a19597ef15fa21eb1bbf52a4b81408d97f8
- BWS121-R12-006 | `.automation/lib/run_common.sh` | symbol=automation_terminate_active_child | reviewed_line_range=L601-L610 | reviewed_sha256=d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619
- BWS121-R12-006 | `.automation/lib/controller_hardening_v2.sh` | symbol=automation_v2_terminate_process_group | reviewed_line_range=L1165-L1184 | reviewed_sha256=d67e2780d7968e5f25b0c7735486b140aa186708bbddda1b3d90cbb5f21f19a1
- BWS121-R12-007 | `run-paper-autopilot.sh` | symbol=rotate_stale_handoffs / main_loop / startup | reviewed_line_range=L569-L576, L1158-L1171, L1334-L1345 | reviewed_sha256=fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661
- BWS121-R12-007 | `run-bugfix-autopilot.sh` | symbol=rotate_stale_handoffs / initialize_campaign_ledger / startup | reviewed_line_range=L542-L571, L1176-L1189 | reviewed_sha256=e96b91399d507f223d4e8ce7c1d74a19597ef15fa21eb1bbf52a4b81408d97f8
- BWS121-R12-007 | `run-bugfix-autopilot.sh` | symbol=update_bug_signature_repeat_guard | reviewed_line_range=L873-L875 | reviewed_sha256=e96b91399d507f223d4e8ce7c1d74a19597ef15fa21eb1bbf52a4b81408d97f8

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS121-R12-005 — Autopilot child duration is advisory because the parent waits without an enforcing deadline

- Severity: `P1`
- Current behavior: The parent merely passes the computed budget to the child and then waits indefinitely. The later checks for exit code 124 do not create a watchdog and cannot fire until the child returns.
- Expected behavior: The parent must enforce one aggregate monotonic deadline independently of child cooperation, terminate the exact child process group when it expires, and classify the result as timed out or unknown.
- Invariant: The parent must enforce one aggregate monotonic deadline independently of child cooperation, terminate the exact child process group when it expires, and classify the result as timed out or unknown.
- Root cause: Duration is modeled as a child configuration value rather than an independently enforced parent ownership deadline.
- Trigger: Run a child whose declared duration is shorter than its actual lifetime.
- Minimal fix boundary: Wrap each child generation in a parent monotonic deadline, retain the process-group identity until drain, and reserve enough aggregate budget for termination, terminal-result reconciliation, lock release, and artifact finalization.
- Regression risks:
- An overly short reserve can terminate valid finalization and create ambiguous source state.
- Timeout classification must distinguish terminated, still-running, and unknown outcomes.

### BWS121-R12-006 — Child ownership is cleared when the leader exits even if descendants remain in its process group

- Severity: `P1`
- Current behavior: Leader death is used as the sole liveness predicate. Parent state is cleared and group termination returns success without checking whether the process group still contains descendants.
- Expected behavior: Ownership must retain a stable process-group or stronger containment identity and confirm the entire group is empty before clearing the lock tuple, accepting terminality, or packaging final evidence.
- Invariant: Ownership must retain a stable process-group or stronger containment identity and confirm the entire group is empty before clearing the lock tuple, accepting terminality, or packaging final evidence.
- Root cause: The controller conflates process-leader lifetime with process-group lifetime and does not retain an independently verifiable group/container identity.
- Trigger: Allow the child leader to exit while a descendant remains alive.
- Minimal fix boundary: Record PGID or use a dedicated cgroup/subreaper boundary. After leader exit, probe and drain the full owned group before clearing ownership or accepting the child result.
- Regression risks:
- Process-group probing must not signal unrelated processes after PGID reuse.
- A cgroup solution must remain portable to the supported operator environment.

### BWS121-R12-007 — Autopilot restart creates a fresh campaign instead of reconciling and resuming durable progress

- Severity: `P1`
- Current behavior: A new run is always created. Existing handoffs are moved aside as stale, rounds and campaign coverage restart from initial values, and in-memory repeat counters are lost. There is no --resume contract or recovery reconciliation.
- Expected behavior: Restart must bind to one immutable campaign ID, reconstruct the last committed transition from durable receipts, reconcile source and handoff state, and either resume exactly once or fail closed as ambiguous.
- Invariant: Restart must bind to one immutable campaign ID, reconstruct the last committed transition from durable receipts, reconcile source and handoff state, and either resume exactly once or fail closed as ambiguous.
- Root cause: Campaign progress, repeat guards, and handoff consumption are run-local files rather than one durable, generation-bound restart protocol.
- Trigger: Restart either autopilot after each externally visible child transition and parent bookkeeping boundary.
- Minimal fix boundary: Add immutable campaign identity, append-only transition receipts, exact source/handoff digests, and an explicit resume/reconcile command. New campaigns must not silently consume or rotate unresolved prior-generation state.
- Regression risks:
- Migration of historical run directories requires a conservative non-resumable classification.
- Resume logic must not trust mutable latest pointers or status labels alone.


## Allowed edit boundary

- Candidate path set: `.automation/lib/controller_hardening_v2.sh`, `.automation/lib/run_common.sh`, `run-bugfix-autopilot.sh`, `run-paper-autopilot.sh`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `.automation/lib/controller_hardening_v2.sh` | participating tranches=T29, T45, T46 | predecessor postimage required
- `.automation/lib/run_common.sh` | participating tranches=T44, T45, T46, T47 | predecessor postimage required
- `run-bugfix-autopilot.sh` | participating tranches=T44, T45, T46, T47 | predecessor postimage required
- `run-paper-autopilot.sh` | participating tranches=T28, T29, T44, T45, T46, T47 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- Child-internal command timeouts remain useful secondary bounds.
- Configured campaign ceilings remain operator-selected maxima.
- Exact leader PID boot-ID/start-tick validation remains required.
- Historical artifacts remain read-only evidence and are not retroactively rewritten.
- Normal single-process children remain supported.
- Starting an explicitly new campaign remains possible through a separate, deliberate action.
- all betting-win source, checkout, documentation, service, database, and runtime
- betting-win; live execution; current BWS-600/BWS-710/BWS-900 holds
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T44.
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

- `BWS121-R12-REQ-017` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-005 | requirement=Child ignores --duration.
- `BWS121-R12-REQ-018` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-005 | requirement=Child hangs before its main loop.
- `BWS121-R12-REQ-019` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-005 | requirement=Child hangs during finalization after its work budget.
- `BWS121-R12-REQ-020` | category=concurrency_or_ownership | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-005 | requirement=Parent deadline expires during TERM/KILL grace.
- `BWS121-R12-REQ-021` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-005 | requirement=Clock regression test using monotonic time.
- `BWS121-R12-REQ-022` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-006 | requirement=Leader exits after spawning one and multiple descendants.
- `BWS121-R12-REQ-023` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-006 | requirement=Descendant changes process state during group drain.
- `BWS121-R12-REQ-024` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-006 | requirement=TERM-resistant descendant requiring KILL.
- `BWS121-R12-REQ-025` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-006 | requirement=PID reuse while the original PGID still has members.
- `BWS121-R12-REQ-026` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-007 | requirement=Crash after child source mutation before terminal-result publication.
- `BWS121-R12-REQ-027` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-007 | requirement=Crash after terminal result before handoff copy/consume.
- `BWS121-R12-REQ-028` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-007 | requirement=Crash after campaign ledger update before rounds append and vice versa.
- `BWS121-R12-REQ-029` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-007 | requirement=Restart with conflicting source fingerprint or handoff generation.
- `BWS121-R12-REQ-030` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-007 | requirement=Repeat-limit persistence across restart.
- `BWS121-R12-TG-005` | category=cancellation_or_timeout | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-005 | requirement=No child that ignores --duration is used to test parent deadline enforcement
- `BWS121-R12-TG-006` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-006 | requirement=No leader-exit/descendant-survival process-group test exists
- `BWS121-R12-TG-007` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-007 | requirement=No crash matrix reconstructs autopilot state from durable artifacts across every commit boundary

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS121-R12-REQ-017` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-005 | requirement=Child ignores --duration.
- `BWS121-R12-REQ-018` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-005 | requirement=Child hangs before its main loop.
- `BWS121-R12-REQ-019` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-005 | requirement=Child hangs during finalization after its work budget.
- `BWS121-R12-REQ-020` | category=concurrency_or_ownership | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-005 | requirement=Parent deadline expires during TERM/KILL grace.
- `BWS121-R12-REQ-021` | category=controller_or_artifact | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-005 | requirement=Clock regression test using monotonic time.
- `BWS121-R12-REQ-022` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-006 | requirement=Leader exits after spawning one and multiple descendants.
- `BWS121-R12-REQ-023` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-006 | requirement=Descendant changes process state during group drain.
- `BWS121-R12-REQ-024` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-006 | requirement=TERM-resistant descendant requiring KILL.
- `BWS121-R12-REQ-025` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-006 | requirement=PID reuse while the original PGID still has members.
- `BWS121-R12-REQ-026` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-007 | requirement=Crash after child source mutation before terminal-result publication.
- `BWS121-R12-REQ-027` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-007 | requirement=Crash after terminal result before handoff copy/consume.
- `BWS121-R12-REQ-028` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-007 | requirement=Crash after campaign ledger update before rounds append and vice versa.
- `BWS121-R12-REQ-029` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-007 | requirement=Restart with conflicting source fingerprint or handoff generation.
- `BWS121-R12-REQ-030` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-007 | requirement=Repeat-limit persistence across restart.
- `BWS121-R12-TG-005` | category=cancellation_or_timeout | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-005 | requirement=No child that ignores --duration is used to test parent deadline enforcement
- `BWS121-R12-TG-006` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-006 | requirement=No leader-exit/descendant-survival process-group test exists
- `BWS121-R12-TG-007` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-007 | requirement=No crash matrix reconstructs autopilot state from durable artifacts across every commit boundary

## Negative and adversarial tests

- `BWS121-R12-TG-007` | category=security_or_confinement | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-007 | requirement=No crash matrix reconstructs autopilot state from durable artifacts across every commit boundary

## Concurrency, cancellation, crash, and restart tests

- `BWS121-R12-REQ-020` | category=concurrency_or_ownership | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-005 | requirement=Parent deadline expires during TERM/KILL grace.
- `BWS121-R12-REQ-026` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-007 | requirement=Crash after child source mutation before terminal-result publication.
- `BWS121-R12-REQ-027` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-007 | requirement=Crash after terminal result before handoff copy/consume.
- `BWS121-R12-REQ-028` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-007 | requirement=Crash after campaign ledger update before rounds append and vice versa.
- `BWS121-R12-REQ-029` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-007 | requirement=Restart with conflicting source fingerprint or handoff generation.
- `BWS121-R12-REQ-030` | category=restart_or_recovery | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R12-007 | requirement=Repeat-limit persistence across restart.
- `BWS121-R12-TG-005` | category=cancellation_or_timeout | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=EXPLICIT_REVIEW_TEST_GAP | issues=BWS121-R12-005 | requirement=No child that ignores --duration is used to test parent deadline enforcement

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

Acceptance authority: Enforced aggregate deadlines, whole-process-group terminality, and durable restart reconciliation.

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W4-T46` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
