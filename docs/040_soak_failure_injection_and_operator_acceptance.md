# 040 - Soak, failure injection and operator acceptance

## Scope

This contract defines `BWS-592` and `BWS-599`.

## Bounded soak campaign

The soak harness must support an explicit duration, interval, maximum cycles and deterministic seed. It must run only loopback or repo-local deterministic inputs.

The campaign must retain:

- selected upstream mode and exact lock;
- source and release fingerprints;
- lifecycle events;
- convergence, scheduler and worker checkpoints;
- queue and metrics time series;
- API/cockpit probes;
- database state summaries;
- failure injections and recovery decisions;
- final evidence index and archive SHA-256.

## Failure matrix

At minimum cover:

```text
upstream timeout and malformed response
immutable export replacement or SHA mismatch
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

Every failure must remain bounded, preserve evidence and demonstrate no provider or execution access.

## BWS-599 integrated acceptance

Final local acceptance must prove from a clean extraction:

- dependency install and build under Node 20;
- migration status and disposable database proof;
- both explicit upstream modes against deterministic inputs;
- full-stack start, status, progress, logs and stop;
- continuous scheduler and worker loops;
- API, cockpit, health, readiness and metrics;
- paper evaluation and paper autopilot source-fix/re-evaluation flow;
- backup, restore, retention dry-run and recovery;
- release package, deployment-template validation and upgrade preflight;
- bounded soak and failure recovery;
- machine-readable `BWS-600` campaign handoff;
- execution closed and provider connections disabled.

`BWS-599` cannot be validated by unit tests alone. It requires integrated child-process and disposable PostgreSQL proof with complete cleanup.
