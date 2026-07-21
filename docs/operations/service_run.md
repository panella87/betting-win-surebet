# BWS service run contract

## Current state

The repository has validated executable components, complete product-owned lifecycle control, protected root-wrapper integration, standalone paper runtime evidence and runtime-evidence paper autopilot through `BWS-599`. The safe-local release, recovery, soak, external preflight and final clean-room acceptance gates are closed.

```text
upstream convergence=continuous_service_validated
scheduler=continuous_service_validated
worker=continuous_service_validated
product lifecycle=full_stack_owner_validated
cockpit=managed_loopback_service_validated
start.sh=product_lifecycle_start_validated
stop.sh=product_lifecycle_stop_validated
paper_evaluation=runtime_evidence_mode_validated
paper_autopilot=selected_for_bws600_runtime_evidence_after_upstream_api_preflight
safe_local_terminal_gate=BWS-599_VALIDATED
external_runtime_gate=BWS-600_BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
```

## Runtime ownership

The managed loopback stack owns:

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
soak, failure injection, external preflight and final local acceptance evidence
```

Every process requires exact identity, source/config binding, stale-state protection, graceful shutdown and immutable evidence. No process-name or port-based killing is allowed.

The stack remains read-only, private and loopback-only. `BWS-600` requires accepted operator-approved runtime input from the real `betting-win` read-only API; the local BWS API on `127.0.0.1:4312` is not upstream evidence. `BWS-900` remains the execution gate.
