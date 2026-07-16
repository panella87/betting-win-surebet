# 035 - Continuous service supervisor contract

## Scope

This contract defines `BWS-581` through `BWS-584`. The goal is a real operator-runnable continuous private-paper stack, not a sequence of manually repeated one-shot commands.

## Process model

The full stack contains explicit, separately observable roles:

```text
upstream convergence service
private-paper scheduler service
private-paper worker service or bounded worker pool
read-only API service
loopback cockpit service
full-stack lifecycle owner
```

The lifecycle owner may run these roles as child processes or as one in-process supervisor, but process identity, role state and shutdown ownership must remain explicit and machine-readable.

## BWS-581: upstream convergence service

Required behavior:

- select exactly one mode: `export` or `api`;
- preserve all validated upstream lock, SHA, contract, profile, generation, lineage, pagination and provenance checks;
- run repeated bounded passes at an explicit positive interval;
- prevent overlapping passes;
- use bounded retry/backoff with no infinite tight loop;
- persist success, no-change, blocker and failure checkpoints;
- resume deterministically after restart;
- stop on `SIGINT` or `SIGTERM` after completing or safely abandoning the current bounded pass;
- never fall back to another mode, fixture or directory scan.

## BWS-582: scheduler and worker services

Required scheduler behavior:

- schedule only completed and provenance-valid upstream cycles;
- maintain deterministic job identifiers and duplicate suppression;
- apply bounded queue depth and backpressure;
- expose scheduled, skipped, blocked and failed counts;
- persist restart-safe scheduler checkpoints.

Required worker behavior:

- repeatedly claim only the configured BWS queue;
- renew leases for work that exceeds one lease interval;
- detect and recover stale leases without double-finalizing work;
- enforce bounded concurrency and bounded retry schedules;
- implement graceful-drain shutdown without claiming new work;
- preserve checkpoint and dead-letter evidence;
- keep execution and provider connections disabled.

## BWS-583: cockpit serving

Required behavior:

- serve the built React cockpit only on loopback;
- use explicit API mode and an exact loopback API base URL;
- reject mock mode in managed runtime;
- preserve typed response validation and visible failure behavior;
- provide deterministic asset/build fingerprints;
- avoid public CORS, public binding and public-signal surfaces;
- report cockpit readiness independently from API readiness.

## BWS-584: complete lifecycle owner

The lifecycle owner must manage the entire stack, not only the API.

Required behavior:

- exact repo-root and source fingerprint binding;
- explicit process roles and lifecycle tokens;
- Linux `/proc` start-tick verification where available;
- no process-name killing;
- idempotent start and status;
- stale-state detection and safe recovery;
- ordered shutdown: stop new scheduling, drain workers, stop convergence, stop cockpit, then stop API;
- bounded TERM-first shutdown and verified exit;
- preserved state/evidence on ambiguous ownership;
- redacted configuration and immutable lifecycle evidence;
- full-stack health and readiness that distinguish degraded, blocked and ready states.

## Validation

Each task requires unit, integration and failure coverage. Final proof must include start, already-running, status, stale state, partial startup failure, crash, restart, ordered stop, config mismatch, PID reuse defense and no unrelated process mutation.
