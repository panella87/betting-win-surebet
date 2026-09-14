# Operator workflow

## 1. Verify current authority

Verify `activation/immutable-authority.sha256`, run `activation/validate_activation_package.py --static`, and confirm the exact BWS125 documentation snapshot `72a8262a5f94d144bb930cc9fb2778eed672d2a97a252f49b07f7b979b47224f`. The original S0 proposal is historical; it is not current routing.

## 2. Confirm the one active tranche

Read `activation/active-campaign-admission.json`, `activation/unattended-plan.json`, and `activation/tasks/001-BWS-W4-T39.md`. Required state:

```text
activation_state=ACTIVE
current_tranche=BWS-W4-T39
campaign_order=1
stage=S1
tranche_state=ADMITTED
accepted_tranches=none
```

All other tranches remain `NOT_ADMITTED`. Existing autonomous controllers remain prohibited through the complete S2 gate.

## 3. Capture first-launch mutable authority

Before any source edit, capture Git HEAD, branch, upstream, dirty-state digest, exact current file hashes/modes, Node identity, active holds, and rollback material. ZIP archives cannot prove Git state. Missing or ambiguous values block the cycle.

## 4. Reverify T39 against current source

Re-open every T39 finding and the four candidate paths. Confirm current symbols, nested-secret policy, archive member policy, repository-local Git-config preservation, pinned SSH identity, and first-use trust requirements. A moved, resolved, contradicted, or newly shared path stops implementation for explicit reconciliation.

## 5. Run one bounded implementation transaction

Use only the active launcher and immutable T39 task. Orders 1 through 13 use direct bounded Codex sessions; do not start a root controller. Change only the admitted path/test boundary, preserve unrelated dirty work, and keep all holds unchanged.

## 6. Record proof and result receipts

Bind preimage, current-source reverification, postimage, focused tests, production-entrypoint tests, negative/adversarial proof, environment identity, exact Node `v20.20.2`, rollback material, and retained holds. A listed but unexecuted test is not evidence.

## 7. Accept or stop

- `ACCEPTED`: every internal requirement and mapped proof passes.
- `BLOCKED`: any source, scope, test, environment, rollback, authority, or receipt requirement fails or is unavailable.
- `SOURCE_COMPLETE_EXTERNAL_PENDING`: only where the campaign map permits it and all internal proof is complete.

The launcher may admit the next exact campaign-order tranche only after the predecessor receipt and dependencies validate. Unknown or mixed state stops the campaign.

## 8. Post-S2 controller transition

Only after T40 and T44-T47 are accepted may the active launcher invoke the repaired `run-autonomous-implementation.sh`, one exact admitted tranche per invocation. No manual controller bypass, lock deletion, or force unlock is allowed.

## 9. Hold and external-boundary preservation

Do not release BWS-600, BWS-710, BWS-900, release, deployment, or live execution. Do not access or mutate a `betting-win` checkout. Documentation, source completion, static validators, fixtures, mocks, local exports, declarations, or caller assertions cannot substitute for accepted external evidence.
