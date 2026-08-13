# 040 - Soak, failure injection and operator acceptance

> **Validated carry-forward acceptance contract.** `BWS-592` and `BWS-599` are complete. The current external phase is `BWS-600`, and all managed runtime evidence is API-only.

```text
document_status=VALIDATED_CARRY_FORWARD_CONTRACT
BWS-592=VALIDATED_SOAK_FAILURE_INJECTION
BWS-599=VALIDATED_FINAL_LOCAL_ACCEPTANCE
current_task=BWS-600
selected_controller=run-paper-autopilot.sh
runtime_upstream_mode=api_only
execution_gate=BWS-900_PARKED
```

## Bounded soak campaign

The soak harness supports an explicit duration, interval, maximum cycles, and deterministic seed. It runs only loopback or repo-local deterministic inputs and cannot contact providers or execute orders.

The campaign retains:

- fixed API runtime mode and exact upstream lock;
- source and release fingerprints;
- lifecycle events;
- convergence, scheduler, and worker checkpoints;
- queue and metrics time series;
- API/cockpit probes;
- database state summaries;
- failure injections and recovery decisions;
- final evidence index and archive SHA-256.

## Failure matrix

The validated matrix covers at minimum:

```text
upstream timeout and malformed response
retained fixture/export parser tamper or SHA mismatch (non-runtime compatibility only)
database connection interruption
scheduler crash before and after job creation
worker crash before and after checkpoint
lease expiry and stale claim recovery
API crash and restart
cockpit asset mismatch
full-stack supervisor crash
partial startup and partial shutdown
log/evidence publication failure
backup, restore and upgrade interruption
```

Every failure remains bounded, preserves evidence, and demonstrates no provider or execution access. Historical export compatibility tests do not authorize an export runtime path.

## BWS-599 integrated acceptance

Final local acceptance is validated from a clean extraction and proves:

- dependency install and build under Node 20;
- migration status and disposable database proof;
- API-only managed runtime convergence and retained non-runtime parser compatibility;
- full-stack start, status, progress, logs, and stop;
- continuous scheduler and worker loops;
- API, cockpit, health, readiness, and metrics;
- paper evaluation and paper-autopilot source-fix/re-evaluation flow;
- backup, restore, retention dry-run, and recovery;
- release package, deployment-template validation, and upgrade preflight;
- bounded soak and failure recovery;
- machine-readable `BWS-600` campaign handoff;
- execution closed and provider connections disabled.

`BWS-599` was not validated by unit tests alone; its accepted proof includes integrated child-process and disposable PostgreSQL coverage with complete cleanup.

## Current external gate

`BWS-600` must use the operator-approved running betting-win read-only API and private BWS database configuration. Export, fixture, mock, local BWS API, or synthesized schedule evidence cannot validate it. `BWS-900` remains separately parked execution.
