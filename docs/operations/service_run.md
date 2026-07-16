# BWS service run contract

## Current state

The repository has validated executable components through `BWS-580`, but it does not yet have a complete operator-owned service stack.

```text
upstream convergence=one bounded pass
scheduler=one bounded pass
worker=one bounded pass
product lifecycle=read_only_api_only
cockpit=buildable_not_managed
start.sh=install_and_validate_only
stop.sh=no_long_running_service
paper_evaluation=single_pass_no_service
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
