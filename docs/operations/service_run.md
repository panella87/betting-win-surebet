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
paper_autopilot=carry_forward_for_bws600_after_bws700_queue_and_upstream_api_readiness
safe_local_terminal_gate=BWS-599_VALIDATED
external_runtime_gate=BWS-600_BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
active_source_route=NONE_BWS700_DEPENDENCY_READY_LOCAL_COMPLETE
```

## External betting-win service boundary

BWS consumes an independently operated betting-win service. BWS `start.sh`, `stop.sh`, lifecycle, paper controllers, and recovery tooling must not start, stop, restart, replace, or mutate betting-win.

The current inspected betting-win server is not yet an accepted BWS upstream. It exposes `/dashboard/*`; BWS expects `/contract` and `/query/*` with an exact contract/provenance envelope. BWS-600 remains blocked until the cross-repository handoff and real provider-to-PostgreSQL-to-API parity are accepted.

## Runtime ownership

The managed loopback stack owns:

```text
API-only upstream convergence
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

The stack remains read-only, private and loopback-only. `BWS-600` requires accepted operator-approved runtime input from the real `betting-win` read-only API; the local BWS API on `127.0.0.1:4312` is not upstream evidence. After BWS-700 dependency-ready local completion, this service/runtime runbook is active carry-forward context for the selected `run-paper-autopilot.sh` route. `BWS-900` remains the execution gate.
