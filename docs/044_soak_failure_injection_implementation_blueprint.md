# 044 - Soak and failure-injection implementation blueprint

```text
parent_task=BWS-592
cohesive_tranche=soak_and_preflight
status=READY
canonical_server_soak_duration=2h
```

## Goal

Implement a resumable, deterministic, multi-hour loopback soak harness that exercises the complete BWS stack and proves recovery from bounded failures while provider connections and execution remain disabled.

Accelerated unit tests are required but cannot alone validate `BWS-592`. The canonical server proof must retain at least two hours of campaign evidence. The autonomous controller therefore needs a cycle timeout greater than two hours for this phase.

## Campaign contract

A campaign requires explicit:

```text
duration
observation interval
maximum cycles
deterministic seed
selected upstream mode
release semantic fingerprint
upstream-lock fingerprint
disposable database identity
failure schedule
runtime and evidence directories
```

The campaign manifest and checkpoints must support exact resume. Resume fails when source, release, lock, mode, seed, database or failure schedule differs.

## Harness behavior

The harness must:

- create only uniquely identified loopback listeners and child processes;
- use deterministic local export and loopback API inputs;
- own a disposable PostgreSQL database or explicitly authorized test database;
- start, observe, restart and stop only the stack it owns;
- retain lifecycle, convergence, scheduler, worker, API, cockpit and database checkpoints;
- sample metrics, queue depth, latency, errors and readiness at bounded intervals;
- publish incremental evidence so interruption does not erase progress;
- bound artifact growth and retain a final evidence index and archive checksum.

## Failure injection matrix

Implement explicit injectors for at least:

```text
upstream timeout
malformed API response
immutable export SHA replacement
upstream contract/profile mismatch
database connection interruption
scheduler crash before and after enqueue
worker crash before and after checkpoint
lease expiry and stale claim recovery
API crash and restart
cockpit asset mismatch
partial stack startup
partial and interrupted shutdown
supervisor crash
log or evidence publication failure
backup interruption
upgrade interruption
```

Each injector must record start, target, ownership, expected effect, recovery condition and terminal result. Broad process killing, port killing and mutation of pre-existing services are prohibited.

## Invariants

The campaign fails if any of these occur:

- provider connection or credential use;
- execution, account, wallet, signer, order or transaction path activation;
- automatic upstream mode fallback;
- duplicate finalization or missing durable checkpoint;
- lost or orphaned worker lease;
- unbounded queue growth or retry loop;
- public listener or cockpit mock mode;
- secret-bearing logs, metrics or evidence;
- leaked test-owned process or disposable database;
- missing final archive or evidence-index reference.

## Multi-hour acceptance

The canonical server campaign must:

1. run at least two hours under Node 20;
2. execute repeated convergence, scheduling and worker cycles;
3. include multiple planned failures from different subsystems;
4. demonstrate recovery and continued bounded progress;
5. retain post-restart API, cockpit, metrics and readiness proof;
6. run backup/restore and upgrade interruption scenarios against disposable state;
7. stop and clean up all campaign-owned resources;
8. publish a semantic campaign fingerprint and final archive SHA-256.

If the campaign is interrupted, the next cycle may resume only from a validated checkpoint and identical campaign manifest.

## Validation

Required layers:

```text
unit tests for campaign schema and deterministic scheduling
focused integration tests with accelerated intervals
failure-injector ownership and cleanup tests
real 2h server soak evidence
post-campaign invariant validator
npm run validate
```

## Unchanged areas

Do not use external provider runtime evidence, persistent project databases, pre-existing services or `BWS-600` as a substitute for local soak proof.
