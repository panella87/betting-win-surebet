# BWS118 Wave 02 to Wave 03 review handoff

## Verified baseline

```text
repository=betting-win-surebet
archive=betting-win-surebet118.zip
sha256=50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7
regular_files=657
package=betting-win-surebet@0.1.0-bws-full-platform
canonical_runtime=Node_20.20.2
areas_complete=R01,R02,R03,R04,R05,R06
confirmed_findings=85
P0=1
P1=71
P2=13
P3=0
current_task=BWS-600
current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
bws710_status=BLOCKED_ACCEPTED_BETTING_WIN_B1_MULTI_VENUE_API_REQUIRED
bws900_status=PARKED_NOT_AUTHORIZED
```

The Wave 01 documentation overlay is present in BWS118. The Wave 02 overlay described by this handoff remains `NOT_APPLIED` until its installer succeeds or a later archive contains its exact postimages.

## Wave 03 parallel areas

### R07: observability, diagnostics, evidence, handoffs, and BWS-600 campaign truth

Exclusive ownership:

- evidence identity, filenames, indexes, retention references, and publication transactions;
- diagnostics and metrics evidence packets;
- runtime and B1 handoffs;
- BWS-600 parent/child campaign evidence, progress, completion, and false-readiness resistance;
- redaction and evidence-scope truth.

Must consume without duplicating: R01 immutable cycle receipts; R03 durable terminality; R04 report/lifecycle truth; R05 API/cockpit projection; R06 lifecycle evidence generation, especially `BWS118-R06-015` and `BWS118-R06-016`.

### R08: database lifecycle, backup, restore, retention, and recovery

Exclusive ownership:

- operational migration orchestration after R03 source semantics;
- backup consistency, naming, manifests, checksums, encryption/permissions when present;
- restore verification and disposable-target confinement;
- retention planning/apply parity and reference safety;
- crash/interruption recovery and wrong-target protection.

Must consume without duplicating: `BWS116-R03-001` through `BWS116-R03-017`, especially migration-source confinement, read-only status, psql bounds, retention references, and aggregate recovery.

### R09: release packaging, upgrade, rollback, soak, and failure injection

Exclusive ownership:

- release byte identity, contents, modes, dependencies, install verification, and source/build binding;
- upgrade and rollback transactionality;
- soak/failure-injection truth and resource bounds;
- deployment preflight and environment promotion evidence;
- no-service-restart and no-production-action boundary during review.

Must consume without duplicating: R06 process-generation/readiness/supervision findings; R03 migration/backup dependencies; R11 remains final owner of aggregate validator truth.

## Shared rules

```text
mode=read_only_research
source_mutation=no
documentation_mutation=no
controller_execution=no
service_start_stop_restart=no
database_mutation=no
provider_or_external_API_access=no
betting_win_checkout_access=no
implementation_prompt=no
live_operation=no
```

## Required questions

- R07: Can evidence prove exact source/data/process generations and all terminal states without collision, truncation, stale-pointer, or false-completion behavior?
- R08: Can backup, restore, migration, and retention operate transactionally against the intended database while preserving every accepted reference and proving recovery?
- R09: Can one exact release be installed, upgraded, rolled back, soaked, and verified without rebuilding or silently changing source/runtime authority?

## Prohibited assumptions

- A passing static validator proves runtime acceptance.
- Node 22 substitutes for Node 20.20.2.
- First-page or heuristic samples prove complete evidence.
- Process liveness proves readiness.
- Documentation integration closes source findings.
- An accepted upstream schema exists merely because local types or fixtures exist.
- Any `betting-win` mutation or service control is authorized.
