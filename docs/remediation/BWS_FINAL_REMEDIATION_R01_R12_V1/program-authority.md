# Program authority

## Current identity

```text
program_id=BWS_FINAL_REMEDIATION_R01_R12_V1
repository=betting-win-surebet
review_program=COMPLETE_R01_R12
activation_state=ACTIVE
current_admitted_tranche=BWS-W4-T39
current_campaign_order=1
current_stage=S1
canonical_node=20.20.2_exact
confirmed_findings=173
P0=10
P1=144
P2=19
P3=0
tranches=47
```

The BWS122 architecture and campaign map remain the finding and dependency baseline. The BWS123 activation snapshot admitted T39 and established the fixed-order unattended execution contract. Current campaign authority records no accepted remediation source result. Exact current archive, extracted-tree, Git, path-mode, and source-state identity is supplied by an external audit or admission receipt; repository documentation does not self-attest a rolling numbered ZIP.

## Current authority order

1. Current repository source and tests.
2. Fresh retained implementation and environment evidence.
3. `activation/active-campaign-admission.json`.
4. `activation/unattended-plan.json`, immutable task files, and receipt state.
5. The first active-remediation sections of `docs/repo_status_current.md` and `docs/automation/current-implementation-task.md`.
6. Campaign-map identities, architecture, detailed finding records, and review evidence.
7. Proposed S0 records, examples, historical status prose, and validator compatibility blocks.

## Binding rules

- Exactly one active source-mutating tranche at a time.
- No existing autonomous controller before the entire S2 gate is accepted.
- Every tranche re-verifies current source and emits exact postimage, test, environment, and result receipts.
- Node `v20.20.2` is mandatory; Node 22 is supplementary only.
- Missing, blank, null, unknown, stale, or conflicting authority fails closed.
- T43 is last.
- No provider access, live execution, release, deployment, or `betting-win` checkout access or mutation.

## State machine

```text
NOT_ADMITTED
ADMITTED
SOURCE_IMPLEMENTED
FOCUSED_TESTS_PASSED
ENVIRONMENT_PROOF_PASSED
ACCEPTED
BLOCKED
SOURCE_COMPLETE_EXTERNAL_PENDING
```

`SOURCE_COMPLETE_EXTERNAL_PENDING` is terminal for source work but non-promotable.

## Current holds

```text
BWS-600=BLOCKED
BWS-710=BLOCKED
BWS-900=PARKED_NOT_AUTHORIZED
release=BLOCKED
deployment=BLOCKED
live_execution=PROHIBITED
```

## Historical proposal snapshot

The original package recorded:

```text
activation_state=PROPOSED_NOT_ACTIVE
current_task=BWS-600
current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
active_implementation_queue=none
selected_controller=run-paper-autopilot.sh
automation_maintenance_allowed=no
```

Those lines remain historical context only. The active admission supersedes them without releasing any hold.
