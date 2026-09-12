
# Program authority

## Identity

```text
program_id=BWS_FINAL_REMEDIATION_R01_R12_V1
repository=betting-win-surebet
review_program=COMPLETE_R01_R12
baseline_archive=betting-win-surebet122.zip
baseline_sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd
regular_files=771
confirmed_findings=173
P0=10
P1=144
P2=19
P3=0
tranches=47
canonical_node=20.20.2_exact
activation_state=PROPOSED_NOT_ACTIVE
```

## Binding rules

- Exactly one active source-mutating tranche at a time.
- No existing autonomous controller is permitted before S2 is accepted.
- Every tranche re-verifies exact current source before edit and emits a postimage/test/environment receipt.
- Node 20.20.2 is mandatory; Node 22 evidence is never acceptance.
- No silent defaults, placeholders, fallback authority, or inferred external evidence.
- R11 T43 is last and may accept an explicit non-promotable external hold, never a fabricated pass.
- No betting-win source, checkout, service, database, documentation, or runtime mutation.

## Authority order

1. exact current files in BWS122
2. current canonical status/task/hold/architecture/runbook/review documents
3. campaign-map JSON machine identities and exact membership
4. architecture Markdown explanatory sequencing
5. architecture validation and checksum records
6. cumulative R01-R12 ledger and detailed reports
7. historical status prose and completion claims

## State machine

The only valid tranche states are:

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

Unknown states fail closed. `SOURCE_COMPLETE_EXTERNAL_PENDING` is terminal for a bounded source cycle but cannot promote BWS-600, BWS-710, release, deployment, or live execution.

## Current mutable authority

```text
current_task=BWS-600
current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
active_implementation_queue=none
selected_controller=run-paper-autopilot.sh
automation_maintenance_allowed=no
```

This package does not replace those declarations. It adds a proposed documentation program under `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1` only.

## Immutable constraints

- Exactly one source-mutating tranche may be admitted at a time.
- Every finding is owned by exactly one tranche and one primary review owner.
- Shared files are serialized by campaign order and exact predecessor postimage.
- Every tranche re-verifies current source before editing.
- Static markers, declared tests, documentation, or Node 22 evidence do not constitute acceptance.
- No source, checkout, documentation, service, database, or runtime belonging to `betting-win` may be accessed or mutated by this program.
