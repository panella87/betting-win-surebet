# 033 - Continuous private-paper runtime implementation program

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-580
safe_local_terminal_gate=BWS-580
continuous_runtime_evidence_gate=BWS-600
execution_gate=BWS-900
```

## Why this program exists

`BWS-510` proved the domain engine, persistence, read-only API, bounded workers, cockpit, configuration and loopback acceptance as library and test surfaces. At the start of this runtime program, it did not yet provide an operator-runnable continuous BWS service:

- `start.sh` installs and validates but does not start an API or worker process;
- `stop.sh` explicitly reports that no long-running service exists;
- `cli.js` exposed local report commands only;
- `run-paper-evaluation.sh` remains a single-pass no-service fixture or pinned-bundle evaluator;
- `.env.example` now documents both explicit upstream convergence modes, but continuous scheduling, lifecycle evidence and integrated acceptance are still incomplete.

`BWS-520` closed the executable API/worker gap with product-owned runtime entrypoints. `BWS-550` closed persistent API-mode scheduling and bounded worker orchestration. `BWS-560` closed verified repo-owned loopback lifecycle ownership plus immutable runtime evidence publication. `BWS-570` closed runtime/API/cockpit convergence over persisted accepted and blocked paper-cycle state. `BWS-580` now validates integrated acceptance, immutable artifact packaging, and the strict machine-readable paper-runtime handoff. The safe local implementation queue is complete before the external `BWS-600` acceptance gate.

## Binding work

The machine-readable authority is `backlog/bws_full_implementation.csv`.

### BWS-520: executable BWS applications

Create canonical Node 20 entrypoints for the loopback-only BWS read-only API and bounded worker. They must resolve the validated runtime configuration, run only `surebet.*` migrations, bind only to `127.0.0.1`, publish health/readiness, handle graceful shutdown, and reject provider or execution configuration.

### BWS-530: immutable-export convergence [validated]

Implement explicit `export` mode for continuously discovering only operator-selected immutable betting-win exports. Require exact lock, expected SHA-256, contract, profile, provider generations and lineage. Persist deterministic intake checkpoints and reject directory scanning, mutable replacement and silent fallback.

### BWS-540: typed API convergence [validated]

Implement explicit `api` mode over the validated read-only betting-win client. Require contract negotiation, bounded pagination, timeout, retry/backoff, provenance and deterministic page checkpoint persistence. Reject credentials, provider endpoints and fallback to export or fixture mode.

### BWS-550: continuous scheduling and workers [validated]

Persisted API-mode scheduling now advances explicit upstream convergence into deterministic private-paper jobs with durable scheduler checkpoints, restart-safe duplicate suppression, worker dead-letter handling, and fail-closed import-run provenance checks. Quote freshness, kill criteria, completion/exposure, settlement reconciliation, restart, idempotency, and no-fallback proof remain carried by the focused runtime, worker, and scheduler coverage.

### BWS-560: operator lifecycle and evidence [validated]

Canonical product-owned lifecycle commands now manage only verified repo-owned loopback API processes using recorded PID ownership, Linux `/proc` start-tick verification, explicit lifecycle tokens, and immutable repo-local evidence snapshots. They never kill by name or affect unrelated sessions, publish redacted machine-readable process identity plus source fingerprints, and leave protected root automation wrappers unchanged.

### BWS-570: runtime/API/cockpit convergence [validated]

Expose accepted and blocked continuous paper cycles through the read-only API and cockpit from persisted `surebet.*` state. Prove bounded retention, provenance expansion, restart visibility, blocker visibility and no public-signal or profitability surface.

### BWS-580: integrated continuous-runtime acceptance [validated]

Clean install, migrations, both explicit upstream modes against deterministic loopback inputs, multi-cycle scheduling, crash/restart, API, worker, cockpit, health/readiness, evidence packaging, and a strict machine-readable paper-runtime handoff are now proven. This closed the last safe local implementation gate.

## External evidence gate

`BWS-600` remains blocked after `BWS-580` until the operator supplies an accepted betting-win export or read-only API runtime, exact upstream lock and private configuration. Local fixtures and loopback servers cannot validate that external gate.

## Protected automation sequencing

`BWS-520` through `BWS-580` implement product entrypoints, package scripts, CLI commands and runtime evidence without editing protected root controllers, `start.sh`, `stop.sh`, or shared automation helpers. After `BWS-580` validation, the router must inspect the completed product lifecycle and decide whether a separate reviewed automation-maintenance overlay is required to wire root wrappers or paper controllers.

## Safety and ownership

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
protected_automation_files=read_only
```

The implementation may add source packages, executable application entrypoints, migrations under `surebet.*`, repo-local lifecycle commands, tests and documentation. It must not modify the betting-win checkout, connect directly to providers, enable execution, or weaken existing validators.
