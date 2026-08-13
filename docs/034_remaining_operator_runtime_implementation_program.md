# 034 - Remaining operator runtime implementation program

> **Completed historical authority.** This document preserves the implementation sequence and acceptance rules that closed BWS-100 through BWS-599. It is not current controller routing. Current authority is `docs/automation/current-implementation-task.md`, with no active implementation queue and `run-paper-autopilot.sh` selected for BWS-600.

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
marker_scope=historical_completed_program
current_task=BWS-599
historical_status=VALIDATED_COMPLETE
current_repository_task=BWS-600
current_selected_controller=run-paper-autopilot.sh
safe_local_terminal_gate=BWS-599
external_runtime_gate=BWS-600
execution_gate=BWS-900
```

## Historical reason the program continued

`BWS-580` validated a substantial closed-stack test surface, bounded convergence passes, a machine-readable runtime handoff, and `BWS-584` completed the full-stack lifecycle owner. At that point, the operator-runnable application was still incomplete.

At the time this program was active, these were the tracked local gaps. Every listed surface is now validated:

```text
start/stop wrappers=validated_product_lifecycle_delegation
check/watch/open_log=validated_automation_plus_product_runtime_state
paper evaluation=runtime_evidence_mode_validated
paper autopilot=runtime_evidence_parent_validated
database retention/backup/restore=validated product commands with disposable proof
logs/metrics/diagnostics/evidence index=validated product surface
release packaging=validated
upgrade/recovery=validated
soak/failure injection=validated
external preflight=validated
final acceptance=validated
```

These were source and automation implementation gaps. They are now closed through `BWS-599`; `BWS-600` is the remaining external runtime-evidence gate.

## Historical binding queue

The machine-readable authority during this completed program was `backlog/bws_full_implementation.csv`. Its selection rule was to choose the first `PENDING` row whose internal dependencies were `VALIDATED`; it is not a current routing instruction.

### Runtime service construction

- `BWS-581`: validated long-running explicit-mode upstream convergence service.
- `BWS-582`: long-running scheduler and worker loops with lease, backpressure and graceful-drain semantics.
- `BWS-583`: validated loopback cockpit serving and full typed API/UI convergence.
- `BWS-584`: validated complete product-owned lifecycle for API, convergence, scheduler, worker and cockpit processes.

### Operations and evidence

- `BWS-585`: validated database migration status, retention, backup and disposable restore verification.
- `BWS-586`: structured logs, metrics, diagnostics, evidence index and bounded retention (validated).
- `BWS-587`: exact protected root wrapper integration for lifecycle, status, progress and logs (validated).

### Paper automation

- `BWS-588`: validated standalone service-owned continuous paper evaluation.
- `BWS-589`: paper autopilot lifecycle and runtime handoff integration (validated).

### Release and resilience

- `BWS-590`: validated reproducible release/deployment packaging and user-service templates.
- `BWS-591`: validated upgrade, rollback and disaster-recovery proof.
- `BWS-592`: bounded long-running soak and failure-injection acceptance (validated).
- `BWS-593`: accepted-runtime preflight and `BWS-600` campaign manifest (validated).
- `BWS-599`: integrated operator/runtime/automation/recovery acceptance.

## Retained implementation authority

The completed parent rows remain decomposed in `backlog/bws_remaining_safe_local_map.csv`. Their retained implementation and acceptance blueprints are:

- `docs/042_release_packaging_implementation_blueprint.md`
- `docs/043_upgrade_rollback_recovery_implementation_blueprint.md`
- `docs/044_soak_failure_injection_implementation_blueprint.md`
- `docs/045_external_runtime_preflight_implementation_blueprint.md`
- `docs/046_final_local_acceptance_implementation_blueprint.md`

During the completed program, the controller was required to complete the largest safe cohesive tranche while preserving separate parent-row validation.

## Continuation contract

```text
CONTINUE_REQUIRED=yes
  while any dependency-ready row through BWS-599 is PENDING

AUTONOMOUS_GOAL_COMPLETE=yes
  only after BWS-590 through BWS-599 are VALIDATED and BWS-100 through BWS-589 remain closed

BLOCKED=yes
  only for a concrete unrecoverable repository state or exact missing external evidence
```

A short cycle is not a campaign completion. Completing one bounded slice must advance to the next dependency-ready row while time and cycle budget remain.

## Safety boundary

```text
betting_win_checkout=read_only
provider_connections=prohibited
provider_credentials=prohibited
direct_betting_win_core_writes=prohibited
execution=prohibited
public_signals=prohibited
profitability_claims=prohibited
automatic_upstream_mode_fallback=prohibited
floating_point_money=prohibited
pre_existing_service_mutation=prohibited
```

Bounded repo-owned test child processes are allowed when required for lifecycle or recovery proof. They must be uniquely identified, loopback-only, cleaned up by the test that created them and must never replace, detach, stop or kill an unrelated session or service.
