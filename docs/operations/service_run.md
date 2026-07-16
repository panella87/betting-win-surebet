# BWS service run contract

## Current state

The repository has validated executable components, product-owned lifecycle control, protected root wrapper integration, and standalone paper runtime evidence through `BWS-588`, but it does not yet have a complete operator-owned service stack.

```text
upstream convergence=continuous_service_validated
scheduler=continuous_service_validated
worker=continuous_service_validated
product lifecycle=full_stack_owner_validated
cockpit=managed_loopback_service_validated
start.sh=product_lifecycle_start_validated
stop.sh=product_lifecycle_stop_validated
paper_evaluation=runtime_evidence_mode_validated
paper_autopilot=paper_service_lifecycle_none
```

## Target state through BWS-599

The managed loopback stack must own:

```text
explicit-mode upstream convergence
private-paper scheduler
bounded worker or worker pool
read-only API
served operator cockpit
full-stack lifecycle and status
health, readiness, metrics and diagnostics
database backup, retention and restore verification
paper evaluation and paper autopilot lifecycle
release, upgrade, rollback and recovery evidence
```

Every process requires exact identity, source/config binding, stale-state protection, graceful shutdown and immutable evidence. No process-name or port-based killing is allowed.

The stack remains read-only, private and loopback-only. `BWS-600` requires separate accepted runtime input after `BWS-599`; `BWS-900` remains the execution gate.
