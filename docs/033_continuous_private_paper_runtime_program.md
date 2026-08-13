# 033 - Continuous private-paper runtime foundation

> **Completed historical implementation authority with current carry-forward boundaries.** This document preserves the BWS-520 through BWS-599 runtime build sequence. It is not current implementation routing. Current authority is `docs/automation/current-implementation-task.md`.

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
document_status=VALIDATED_COMPLETE_HISTORICAL_PROGRAM
historical_foundation_gate=BWS-580
safe_local_terminal_gate=BWS-599_VALIDATED
current_task=BWS-600
active_implementation_queue=none
selected_controller=run-paper-autopilot.sh
runtime_upstream_mode=api_only
continuous_runtime_evidence_gate=BWS-600_BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
execution_gate=BWS-900_PARKED
```

## Validated closure

`BWS-520` through `BWS-599` are validated. In particular, `BWS-581` through `BWS-584` close the continuous-service and lifecycle layer. They provide:

- executable loopback-only API and bounded worker entrypoints;
- API-only read-only upstream convergence with exact lock and provenance checks;
- persisted convergence and scheduler checkpoints;
- deterministic private-paper jobs and bounded worker processing;
- long-running convergence, scheduler, and worker services;
- a full-stack lifecycle owner with exact process identity and ordered shutdown;
- protected root start/stop/progress/log wrappers delegated to product-owned lifecycle and runtime evidence;
- persisted runtime/API/cockpit visibility plus managed loopback cockpit serving;
- service-owned paper evaluation and runtime-evidence paper autopilot;
- database backup, restore verification, and retention operations;
- deterministic release, upgrade/rollback/recovery, soak/failure, external preflight, and final clean-room acceptance evidence;
- integrated machine-readable runtime handoff packaging.

These results remain binding and must not regress.

## Historical BWS-580 gap and its closure

After `BWS-580`, service-owned paper evaluation, paper-autopilot lifecycle integration, and release/recovery/soak acceptance were still missing. The completed historical program in `docs/034_remaining_operator_runtime_implementation_program.md` closed those gaps through `BWS-599`. That document is retained traceability, not an active queue.

## Current carry-forward requirements

The validated runtime must preserve:

- exact committed-HEAD upstream lock;
- fixed API-only runtime transport with no export, fixture, mock, or pinned-bundle fallback;
- fixed-point calculations;
- `surebet.*` ownership only;
- deterministic job, checkpoint, and evidence identities;
- private-only strategy evidence;
- loopback-only BWS listeners;
- provider connections and execution disabled;
- no public signals or profitability claims;
- exact process ownership and no name-based killing;
- parent-only Telegram for autopilots;
- post-lock artifact refresh and atomic child results.

## Protected automation state

The BWS-587 through BWS-589 protected integration phase is complete. The current task authorizes no protected automation change:

```text
automation_maintenance_allowed=no
allowed_protected_files=none
```

Do not set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1` during ordinary implementation, paper, or bugfix runs.

## External gate

`BWS-600` remains blocked until the operator-approved betting-win read-only API, private BWS PostgreSQL configuration, approved repo-local private-paper schedule, and retained runtime evidence are available. Local fixtures, export files, and the BWS API on `127.0.0.1:4312` cannot satisfy this gate.
