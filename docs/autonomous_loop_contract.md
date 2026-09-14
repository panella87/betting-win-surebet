# Autonomous Loop Contract

## Active remediation loop

```text
active_program=BWS_FINAL_REMEDIATION_R01_R12_V1
activation_state=ACTIVE
current_admitted_tranche=BWS-W4-T39
state_source=artifacts/remediation_campaign/BWS_FINAL_REMEDIATION_R01_R12_V1/campaign-state.json
plan_source=docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/unattended-plan.json
```

The active launcher resolves the next exact tranche, verifies dependencies and immutable authority, runs one bounded implementation attempt, validates the exact result receipt, and advances only after acceptance.

```text
admission -> current-source re-verification -> minimal implementation -> focused proof -> environment proof -> result receipt -> exact advance
```

Allowed tranche states are:

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

Unknown states fail closed. `SOURCE_COMPLETE_EXTERNAL_PENDING` is non-promotable. A missing or invalid result stops the campaign.

## Execution modes

- Campaign orders 1 through 13 use direct bounded Codex sessions. Existing root controllers are prohibited.
- Campaign orders 14 through 47 use repaired `run-autonomous-implementation.sh` only after the activation validator proves S2 accepted.
- Exactly one source-mutating tranche may be active.
- The same admitted post-S2 tranche may receive repeated 72-hour controller attempts only while the global window remains and the controller returns the documented continuation result.

## Generic controller contract

All root controllers use repository-scoped ownership, verified locks, bounded child processes, atomic terminal results, exact artifact publication, and controller-owned cleanup. `--force-unlock` is valid only through the owning parent with fresh lock and PID evidence. Manual lock deletion or broad process killing is prohibited.

## Runtime loader invariant

Controllers never source NVM internally. The parent shell must activate exact Node `v20.20.2` before the active remediation launcher or any standalone controller starts.

## Historical pre-remediation route record

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
current_task=BWS-600
active_implementation_queue=none
selected_controller=run-paper-autopilot.sh
safe_local_terminal_gate=BWS-599
```

This exact block is retained for compatibility with existing validators. It is not current routing authority.
