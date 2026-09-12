
# Operator workflow

## 1. Verify the documentation package

Verify the delivered overlay and apply script SHA-256 values, inspect the exact entry manifest, and invoke the transactional script against the local WSL repository. A clean run must report `PREIMAGE_READY` before writes and the deterministic success marker after validation. An exact second run must report `ALREADY_APPLIED_EXACTLY`.

## 2. Inspect the proposed S0 admission

Read `s0/proposed-campaign-admission.md` and `.json`. Confirm `activation_state=PROPOSED_NOT_ACTIVE`, baseline `e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd`, candidate `BWS-W4-T39`, current task `BWS-600`, active implementation queue `none`, selected controller `run-paper-autopilot.sh`, and unchanged holds. Documentation presence is not activation.

## 3. Later activate exactly one tranche

A later explicit user instruction must name `BWS_FINAL_REMEDIATION_R01_R12_V1` and exactly one tranche. Capture activation-time Git/source fields, reverify protected authority, dependencies, candidate paths, symbols, tests, environments, and rollback. Produce a schema-valid `campaign-admission`/`tranche-admission` pair with one `ADMITTED` source-mutating tranche. S1/S2 remain bounded operator-driven cycles; do not start a current autonomous controller.

## 4. Capture preimages

Use the preimage runbook and schema. Record exact path existence, bytes, modes, sizes, Git state, source generation, predecessor postimages, protected authority, stale source-manifest classification, and rollback material outside the repository. Unavailable or ambiguous preimages block writes.

## 5. Start a bounded implementation session

Work only within the exact admitted path set and minimal coherent finding boundary. Preserve read-only shared paths, unrelated dirty content, current holds, and `betting-win` prohibition. Bind each mapped test requirement to a bounded repository-local command before editing. Do not deploy, migrate persistent state, start services/controllers, or use credentials/provider endpoints unless a separately admitted disposable proof explicitly requires it.

## 6. Record test and environment receipts

Run all mapped focused, production-entrypoint, negative/adversarial, concurrency/crash, and environment requirements against the exact postimage under Node `v20.20.2` where applicable. Record commands, cwd, timeouts, exit status, output digests, runtime, environment generation, cleanup, and lineage. A test listed but not run is not evidence.

## 7. Accept, block, or record external pending

- `ACCEPTED`: all internal implementation, tests, and required environment proof pass under exact authority.
- `BLOCKED`: any internal source, test, environment, rollback, authority, or evidence requirement fails or is unavailable.
- `SOURCE_COMPLETE_EXTERNAL_PENDING`: only for campaign-map-marked T29/T36 after every internal requirement is closed and only external accepted evidence remains unavailable.

Issue the schema-valid tranche-result. Do not promote holds from any of these states without a separate hold decision.

## 8. Update the program ledger

Append immutable receipts to the campaign generation, update finding closure references without changing stable IDs/owners, and preserve prior generations. Do not replace current mutable task/queue/controller authority unless a separate explicit instruction authorizes that change.

## 9. Prepare the next tranche

Select the next campaign-order tranche only after the predecessor reaches an allowed terminal state. Recheck every dependency, bind the predecessor postimage/shared-path handoff, capture a new preimage, and admit exactly one tranche. Campaign order, not tranche number, controls progression.

## 10. Stop safely without ambiguous state

Stop additional transaction-owned writes, retain evidence, classify the current state, and either complete exact rollback or record `ROLLBACK_RESTORE_FAILED` and remain `BLOCKED`. Remove only transaction-owned additions and empty directories. Preserve unrelated dirty work. Never infer success, advance the queue, release a hold, or start another tranche from mixed state.

## Controller prohibition

Do not invoke `run-autonomous-implementation.sh`, `run-autonomous-bugfix.sh`, `run-paper-evaluation.sh`, `run-paper-autopilot.sh`, or `run-bugfix-autopilot.sh` during S1 or S2. The repaired controller becomes eligible only after T44-T47 and all S2 gates are accepted.
