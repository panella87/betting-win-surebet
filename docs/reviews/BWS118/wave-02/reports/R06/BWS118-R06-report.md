# BWS118-R06 service lifecycle, ownership, health, shutdown, cancellation, restart, and drain correctness

## Review verdict

```text
REVIEW_ID=BWS118-R06
REPOSITORY=betting-win-surebet
ARCHIVE_SHA256=50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7
ARCHIVE_REGULAR_FILES=657
ARCHIVE_IDENTITY=RECORDED_NO_FROZEN_BWS118_EXPECTED_HASH
ARCHIVE_PATH_AND_TYPE_SAFETY=PASS
EXTRACTION_INTEGRITY=PASS
BWS117_TO_BWS118_EXECUTABLE_COMPATIBILITY=PASS
ACTUAL_NODE_RUNTIME=v22.16.0
CANONICAL_NODE_20_20_2_ACCEPTANCE=NOT_RUN
POSTGRESQL_EXECUTION=UNAVAILABLE_NOT_REQUIRED_FOR_R06
CONFIRMED_FINDINGS=17
P0=0 P1=15 P2=2 P3=0
INHERITED_WAVE01_FINDINGS_CHECKED=41
DUPLICATED_INHERITED_ROOT_CAUSES=0
OVERALL_VERDICT=BLOCKED_SOURCE_CORRECTNESS_REMEDIATION_REQUIRED
SOURCE_OR_REPOSITORY_MUTATION=NO
NETWORK_PROVIDER_ACCOUNT_PERSISTENT_DATABASE_ACCESS=NO
```

The supplied BWS118 archive was independently hashed and reconciled. It contains 657 regular files, no duplicate or unsafe paths, no symlinks, and no special entries. The extracted source still matched every archive path, size, and SHA-256 after inspection. No frozen expected hash for BWS118 was supplied, so the review records the actual hash rather than claiming a match to an unstated value.

BWS118 differs from the BWS117 Wave 01 handoff baseline through 39 added Wave 01 review files and one documentation-index edit. No source, test, migration, schema, package, script, configuration, or other non-documentation member differs. R06 therefore reviewed the same executable lineage consumed by R01 through R03 while using the newly integrated 41-finding ledger for overlap control.

R06 confirmed 17 new root causes: 15 P1 lifecycle/release defects and 2 P2 boundedness/cleanup defects. Fifteen findings block release, BWS-600, B1 progression, and deployment; the pass-timer leak additionally blocks clean deployment/shutdown, while the filesystem boundedness defect is operational but not independently release-blocking.

## Source authority and method

- Reviewed archive: `/mnt/data/betting-win-surebet118(2).zip`
- Actual archive SHA-256: `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`
- Regular files and coverage rows: `657`
- Wave 02 handoff SHA-256: `9a896b8e4100582cb2790c3567cd259068c7c296afd911b93b25cda20464b51e`
- Executable compatibility: BWS117 to BWS118 has `0` non-documentation differences.
- Package identity: `betting-win-surebet@0.1.0-bws-full-platform`; `.nvmrc=20.20.2`; engine `>=20 <21`.
- Actual runtime: `v22.16.0`. All Node harnesses and focused tests are supplementary.
- PostgreSQL: unavailable; no database was contacted or created. R03 durable findings were consumed as inherited authority.
- Temporary harnesses ran only in `/tmp` using injected inert adapters and loopback HTTP.
- No controller, provider, account, credential, deployed service, signer, wallet, persistent database, or `betting-win` checkout was contacted.

## Current routing authority and inherited overlap

```text
current_task=BWS-600
current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
active_implementation_queue=none
safe_local_terminal_gate=BWS-599
bws710_status=BLOCKED_ACCEPTED_BETTING_WIN_B1_MULTI_VENUE_API_REQUIRED
bws900_execution_status=PARKED_NOT_AUTHORIZED
```

All 41 inherited confirmed findings were checked. The R06 records do not duplicate R01 pagination, transport, external-target, or underlying convergence cancellation roots, and do not duplicate R03 migration serialization, psql cancellation, durable transition, lease/fencing, retry, scheduler/worker cancellation, or database-query boundedness roots. Explicit handoffs are listed below.

## Client and service architecture

The lifecycle architecture contains three standalone loop services, one API/cockpit process, and one operator lifecycle command that spawns all four detached OS processes. Each loop owns a JSON state file and immutable evidence directory. The operator stores a full-stack state file containing process descriptors, PIDs, `/proc` start ticks, lifecycle tokens, configuration, and descriptive source fingerprints. The API exposes `/health`, `/readiness`, and `/metrics`; root wrappers and a user systemd unit provide operator control and status.

```text
operator start
  -> read/check lifecycle state
  -> spawn convergence -> verify PID
  -> spawn scheduler -> verify PID
  -> spawn worker -> verify PID
  -> spawn API/cockpit -> verify PID
  -> wait for API health only
  -> write full-stack state
  -> compute health/readiness/role status
  -> publish start evidence and return exit 0

each loop run
  -> read/check state
  -> apply migrations
  -> write running state and started evidence
  -> register SIGINT/SIGTERM flag
  -> write pass-start state
  -> race pass with timeout
  -> write pass-complete state/evidence
  -> sleep/backoff or finalize signal/max-passes stop

operator stop
  -> verify all recorded processes once
  -> collect probes
  -> sequential SIGTERM in startup role order
  -> wait each numeric PID
  -> remove state
  -> publish stopped evidence
```

## Complete lifecycle state-machine model

### Intended full-stack model

```text
ABSENT
  -> CLAIMED(generation)
  -> INITIALIZING(role-by-role)
  -> STARTED_NOT_READY | READY
  -> DEGRADED | BLOCKED
  -> QUIESCING_SCHEDULER
  -> DRAINING_WORKERS
  -> STOPPING_CONVERGENCE
  -> STOPPING_COCKPIT
  -> STOPPING_API
  -> STOPPED

Any uncertain transition -> AMBIGUOUS_OWNERSHIP with retained generation/PID evidence
Any exception -> FAILED or UNKNOWN with terminal evidence
```

### Reachable current deviations

- `ABSENT -> two INITIALIZING owners` through non-atomic check/write.
- `SPAWNED_UNOWNED` between detached spawn and process-record insertion.
- `API_HEALTHY -> started` while readiness/other role state is blocked, stale, or absent.
- `DEGRADED_OLD -> cleanup failure suppressed -> state deleted -> replacement generation`.
- `RUNNING generation A -> accepted status under source generation B`.
- `PASS_STARTED -> exception -> process exits while durable state remains running`.
- `STATE_ADVANCED -> evidence collision -> process failure with missing evidence`.
- `STOPPING first role -> timeout -> later roles never signaled`.
- `VERIFIED_OWNER(pid,startTicks) -> numeric PID only -> signal/wait ABA race`.
- `HTTP request rejection -> unhandled promise and no owned terminal transition`.

## Required-question conclusions

**1. Is every long-running process uniquely owned, bounded, observable, cancellable, and restart-safe?** No. Ownership reservation is non-atomic, partial starts and failed stale cleanup can orphan owners, aggregate deadlines are absent, source generations are not enforced, and restart can overlap an unresolved prior generation.

**2. Can status or health become green while work, children, leases, or checkpoints are partial or stale?** Yes. Operational snapshots use declarations and stale files; metrics hard-codes API ready; root summary trusts incompatible synthetic shapes; systemd remains active after detached children fail.

**3. Do shutdown and timeout reach in-flight API, psql, scheduler, and worker operations?** No. R03-005 and R03-011 retain ownership of underlying psql/pass cancellation. R06 additionally finds no aggregate lifecycle deadline, wrong shutdown order, unowned HTTP requests/sockets, and losing timeout timers.

**4. Can late completion publish after timeout, stop, lease loss, or replacement?** Yes. Inherited R01/R03 findings prove underlying late-work risks. R06 process-level replacement, API request ownership, and service exception paths provide no generation fence that prevents publication after stop/replacement.

**5. Are PID, lock, listener, timer, log, file, and subprocess resources cleaned exactly once?** No. There is no atomic process lock, the just-spawned child can be omitted from rollback, one hung child aborts remaining shutdown, PID identity is dropped at signal/wait, request/listener close can hang or reject unowned, pass timers remain live, and evidence IDs collide.

## Confirmed findings summary

| ID | Sev. | Title | Release | BWS-600 | Deployment |
|---|---:|---|:---:|:---:|:---:|
| `BWS118-R06-001` | P1 | Lifecycle ownership is a non-atomic state-file check-and-overwrite | YES | YES | YES |
| `BWS118-R06-002` | P1 | Stack startup reports started before non-API services and full readiness are established | YES | YES | YES |
| `BWS118-R06-003` | P1 | Active processes are not bound to an immutable executable generation and status or stop commands rebuild dist | YES | YES | YES |
| `BWS118-R06-004` | P1 | Partial startup can orphan the just-spawned detached child before it enters rollback ownership | YES | YES | YES |
| `BWS118-R06-005` | P1 | Stale-state recovery deletes ownership and starts replacements even when cleanup failed | YES | YES | YES |
| `BWS118-R06-006` | P1 | Lifecycle timeout settings are per-step rather than one aggregate deadline | YES | YES | YES |
| `BWS118-R06-007` | P1 | API health, readiness, and metrics can remain green from declarations and stale state files after child failure | YES | YES | YES |
| `BWS118-R06-008` | P1 | The root runtime summary is disconnected from production lifecycle evidence, process verification, and HTTP envelopes | YES | YES | YES |
| `BWS118-R06-009` | P1 | CLI exit codes and the oneshot systemd unit remain successful while the managed stack is degraded or gone | YES | YES | YES |
| `BWS118-R06-010` | P1 | Shutdown uses startup role order instead of scheduler-stop, worker-drain, convergence, cockpit, API order | YES | YES | YES |
| `BWS118-R06-011` | P1 | One hung child aborts shutdown before remaining owned children are signaled | YES | YES | YES |
| `BWS118-R06-012` | P1 | Stop signaling and exit waits are vulnerable to PID reuse after the initial /proc verification | YES | YES | YES |
| `BWS118-R06-013` | P1 | API listener and request promises lack one bounded, exception-safe ownership boundary | YES | YES | YES |
| `BWS118-R06-014` | P2 | Successful service passes leave timeout timers alive until their full configured duration | NO | NO | YES |
| `BWS118-R06-015` | P1 | Unexpected pass failures exit without a terminal service state or failure evidence | YES | YES | YES |
| `BWS118-R06-016` | P1 | Millisecond evidence filenames collide across legitimate lifecycle events and can crash the service | YES | YES | YES |
| `BWS118-R06-017` | P2 | Health and failure diagnostics synchronously hash or read unbounded filesystem data | NO | NO | NO |

## Confirmed findings

### BWS118-R06-001: Lifecycle ownership is a non-atomic state-file check-and-overwrite

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/operator-lifecycle.ts::startManagedBwsOperatorStack / writeLifecycleState`
- **Exact line range:** `240-264; 903-910`
- **Primary full-file SHA-256:** `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`
- **Lifecycle object/process:** Full-stack lifecycle owner and each standalone long-running service state file

**Current source evidence**

- `packages/bootstrap/src/operations/operator-lifecycle.ts::startManagedBwsOperatorStack / writeLifecycleState` lines `240-264; 903-910`, SHA-256 `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`. Reads absence or staleness before spawning and later replaces the shared state path. The temporary rename prevents torn bytes but is not an exclusive interprocess claim.
- `packages/bootstrap/src/operations/upstream-convergence-service.ts::runBwsUpstreamConvergenceService / writeServiceState` lines `301-327; 863-870`, SHA-256 `937ad8b789002504b674351c04e2179ba2800e17deea1d5e17aa0dd31786d5a8`. The standalone convergence loop performs the same check-then-write ownership sequence.
- `packages/bootstrap/src/operations/private-paper-scheduler-service.ts::runBwsPrivatePaperSchedulerService / writeServiceState` lines `305-331; 885-892`, SHA-256 `876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967`. The scheduler loop performs the same non-atomic ownership sequence.
- `packages/bootstrap/src/operations/private-paper-worker-service.ts::runBwsPrivatePaperWorkerService / writeServiceState` lines `317-345; 936-943`, SHA-256 `1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36`. The worker loop performs the same non-atomic ownership sequence.

**Preconditions.** Two start commands for the same repository and configuration overlap before either writes its final state.

**Trigger.** Launch two lifecycle or standalone service starts concurrently.

**Expected behavior.** Exactly one process must acquire an atomic, generation-bound ownership claim before migrations, child creation, service work, or evidence publication; all contenders must return an idempotent already-owned outcome.

**Current behavior.** Both processes can observe no live state, both can migrate or spawn/run, and the last rename wins. The overwritten state no longer identifies every active process.

**Impact.** Duplicate convergence passes, duplicate scheduler activity, duplicate workers, orphaned child processes, conflicting evidence, and stop/status commands controlling only the last writer.

**Evidence.** Static interleaving proof applies to four production entrypoints. No atomic create, advisory lock, file lock, database lease, or compare-and-swap exists between the read and side effects.

**Reproduction status.** {"status": "STATIC_INTERLEAVING_CONFIRMED", "runtime": null, "harness": null, "result": "Two callers can pass the ownership check before either write."}

**Lifecycle/state-machine analysis.** ABSENT -> CHECKED -> SIDE_EFFECTS -> STATE_WRITTEN is not linearizable. There is no unique transition owner, and state replacement can erase an earlier owner while its process remains alive.

**Root cause.** A mutable JSON state file is used as both observation and ownership authority without an atomic reservation primitive.

**Minimal fix boundary.** Add one repository-scoped atomic ownership primitive before any side effect, bind it to a monotonically unique runtime generation and process token, make start idempotent under contention, and release it only after verified shutdown. Apply the same primitive to standalone loops or prohibit independent ownership while the stack owner is active.

**Required tests**

- Two OS processes starting the full stack concurrently
- Concurrent standalone loop starts
- Crash after claim but before state publication
- Stale claim takeover with a fencing generation
- Stop/status after a losing contender has spawned work

**Regression risks**

- Existing stale-state recovery must distinguish abandoned claims from slow initialization
- Standalone operation and full-stack operation must not acquire independent incompatible owners

**Primary owner.** R06

**Secondary sectors.** R03, R10, R11

**Aliases or dependencies.** BWS116-R03-004 can amplify concurrent migration side effects but is not this process-ownership root cause

**Explicitly unchanged areas**

- No process or controller was started during review
- Current temp-file rename behavior remains useful for write atomicity after ownership is fixed

**Blocking.** Release=YES; BWS-600=YES; B1=YES; deployment=YES.

### BWS118-R06-002: Stack startup reports started before non-API services and full readiness are established

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/operator-lifecycle.ts::spawnAndPersistLifecycleState / waitForManagedApiObservable / publishLifecycleEvidence`
- **Exact line range:** `446-523; 526-599; 948-976`
- **Primary full-file SHA-256:** `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`
- **Lifecycle object/process:** Full-stack start transition and BWS-600 operator runtime entry

**Current source evidence**

- `packages/bootstrap/src/operations/operator-lifecycle.ts::spawnAndPersistLifecycleState / waitForManagedApiObservable / publishLifecycleEvidence` lines `446-523; 526-599; 948-976`, SHA-256 `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`. Child presence is checked, then only API health gates startup. Readiness and child-service runtime states are computed later but do not change the started outcome.
- `tests/bws-operator-lifecycle.test.ts::start lifecycle blocked-readiness expectation` lines `204-213`, SHA-256 `ff44f4a8b802187d11c4b9eb4d84cfc15570107a9080c27cfd0f48123a74a9e6`. The focused test explicitly accepts outcome=started while readiness is blocked.

**Preconditions.** The API becomes health-observable while readiness remains blocked, or another child process exists but has not reached a service-owned running/checkpoint state.

**Trigger.** Start the managed stack under blocked database/cockpit/scheduler/worker/upstream readiness or a child stuck after process creation.

**Expected behavior.** The start result and exit status must distinguish process creation from initialization and from full-stack readiness. A successful terminal start must require every required role to own an observable compatible runtime generation, or return a non-ready outcome.

**Current behavior.** The function persists the stack and returns started once API health is successful. The calculated stack may be blocked or degraded without changing outcome or CLI success.

**Impact.** Automation and systemd can treat an incomplete stack as successfully started. BWS-600 evidence can begin against partial services, stale checkpoints, or unavailable durable state.

**Evidence.** The production source checks only PID presence for four children and API health. The repository test codifies blocked readiness as a successful start.

**Reproduction status.** {"status": "CONFIRMED_BY_SOURCE_AND_FOCUSED_TEST", "runtime": "Node v22.16.0 supplementary", "harness": "/tmp/bws118-r06-focused-tests.out", "result": "Lifecycle tests pass while preserving started with blocked readiness."}

**Lifecycle/state-machine analysis.** CREATED -> API_HEALTHY is collapsed into STARTED even though role states can still be BLOCKED/DEGRADED/MISSING. The state model computes but does not enforce the stronger transition.

**Root cause.** Startup outcome authority is tied to one API probe rather than the complete required-role state machine.

**Minimal fix boundary.** Define explicit initializing, started-not-ready, ready, degraded, and failed-start outcomes. Require service-owned generation/status evidence for all roles before ready, and ensure CLI/systemd exit semantics reflect the returned condition.

**Required tests**

- Child alive but loop state absent
- API healthy with readiness blocked
- Scheduler or worker initialization hang
- Database migration blocked after child creation
- Start result/exit code matrix for initializing, blocked, degraded, and ready

**Regression risks**

- BWS-600 intentionally measures some blocked readiness during evidence windows; preserve that use case as a distinct non-ready state rather than calling it a completed start

**Primary owner.** R06

**Secondary sectors.** R03, R05, R07, R11

**Aliases or dependencies.** BWS116-R03-005 and BWS116-R03-011 own psql/pass cancellation below this lifecycle decision

**Explicitly unchanged areas**

- The API health probe remains loopback-only
- No claim is made that blocked external upstream evidence should become ready

**Blocking.** Release=YES; BWS-600=YES; B1=YES; deployment=YES.

### BWS118-R06-003: Active processes are not bound to an immutable executable generation and status or stop commands rebuild dist

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/operator-lifecycle.ts::createLifecycleContext / collectSourceFingerprints / assertion functions`
- **Exact line range:** `351-397; 498-510; 823-850; 1249-1267`
- **Primary full-file SHA-256:** `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`
- **Lifecycle object/process:** Source generation, dist entrypoints, lifecycle state, status and stop authority

**Current source evidence**

- `packages/bootstrap/src/operations/operator-lifecycle.ts::createLifecycleContext / collectSourceFingerprints / assertion functions` lines `351-397; 498-510; 823-850; 1249-1267`, SHA-256 `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`. Source fingerprints are retained as descriptive state but omitted from configFingerprint and never compared on status or stop.
- `package.json::build and runtime scripts` lines `15-18; 33-47`, SHA-256 `b1b69ffa6d0b974c3b3ba55f3ec1acffb21e512c3a862e2a7b2d6b5139e5eac0`. Build removes dist; runtime status and stop scripts run the build before addressing already-running processes.
- `scripts/bws-root-wrapper-runtime.mjs::prepareRuntimeBuild / runLifecycleStart` lines `137-165`, SHA-256 `1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8`. The root start path rebuilds source output immediately before lifecycle use; related package scripts rebuild before status and stop.
- `docs/035_continuous_service_supervisor_contract.md::BWS-584 required behavior` lines `87-103`, SHA-256 `cae4ce541c65848974de8c4568e72b6d2d3d151d9f2c3eaf52cb50e6777c8505`. The intended contract requires exact source-fingerprint binding.

**Preconditions.** Source, generated output, package version, or source manifest changes while processes remain active, or an operator invokes package runtime:status/runtime:stop.

**Trigger.** Change/rebuild dist after start or invoke a status/stop script that runs npm build.

**Expected behavior.** Every managed process must remain bound to the exact immutable bytes it started from. Status and stop must inspect that recorded generation without mutating or replacing executable files.

**Current behavior.** Only repositoryRoot and a config fingerprint are enforced. Recorded source fingerprints are not asserted. Several status/stop wrappers clean and rebuild dist before managing the active generation.

**Impact.** Status can report an old process as current after source changes, and stop/status can replace on-disk executable bytes beneath an active process. Release identity and evidence lineage diverge.

**Evidence.** Static source trace shows sourceFingerprints are stored but excluded from configFingerprint and assertions. Package scripts make status and stop mutating build operations.

**Reproduction status.** {"status": "STATIC_CONFIRMED", "runtime": null, "harness": null, "result": "No source-generation equality check exists; build scripts delete and recreate dist."}

**Lifecycle/state-machine analysis.** RUNNING(generation A) remains accepted under workspace generation B. The lifecycle authority has no transition to GENERATION_MISMATCH and management commands mutate the candidate executable tree before inspection.

**Root cause.** Descriptive source metadata is not part of the enforced lifecycle identity, and wrapper commands conflate build/deploy with read-only management.

**Minimal fix boundary.** Record a canonical executable/package digest or release-directory identity at start, assert it on status/stop/evidence, run active services from immutable release directories, and remove builds from status/stop paths. Treat generation mismatch as explicit degraded/blocked ownership, not a reason to abandon stop authority.

**Required tests**

- Start generation A then change source and query status
- Start generation A then rebuild dist and stop
- Package version unchanged but executable bytes changed
- Source-manifest drift and repaired manifest transitions
- Immutable release-directory start/status/stop

**Regression risks**

- Strict generation binding needs an explicit emergency-stop path that still proves process ownership
- Historical runtime evidence must retain its original generation rather than being rewritten

**Primary owner.** R06

**Secondary sectors.** R09, R10, R11, R12

**Aliases or dependencies.** KNOWN_BASELINE_MANIFEST_DRIFT remains R11-owned; this finding exists even with a correct manifest

**Explicitly unchanged areas**

- No generated output was rebuilt in the reviewed source tree
- Current repositoryRoot and configuration checks remain valid subordinate safeguards

**Blocking.** Release=YES; BWS-600=YES; B1=YES; deployment=YES.

### BWS118-R06-004: Partial startup can orphan the just-spawned detached child before it enters rollback ownership

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/operator-lifecycle.ts::spawnAndPersistLifecycleState`
- **Exact line range:** `446-523`
- **Primary full-file SHA-256:** `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`
- **Lifecycle object/process:** Per-child startup and rollback ownership list

**Current source evidence**

- `packages/bootstrap/src/operations/operator-lifecycle.ts::spawnAndPersistLifecycleState` lines `446-523`, SHA-256 `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`. The process is spawned at line 463 but is appended to startedProcesses only after presence verification at lines 465-487.
- `packages/bootstrap/src/operations/operator-lifecycle.ts::spawnManagedLifecycleProcess` lines `1094-1125`, SHA-256 `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`. Children are detached and unrefed immediately.

**Preconditions.** A child is spawned and remains alive, but presence verification throws or the parent is interrupted before the process record is pushed.

**Trigger.** Cause /proc verification, command validation, repository read, timeout, evidence/logging, or parent interruption between spawn and startedProcesses.push.

**Expected behavior.** The child must enter rollback ownership atomically with creation, and startup failure must either terminate and verify it or retain an explicit ambiguous ownership record.

**Current behavior.** The catch block cleans only startedProcesses. The current detached child is omitted until after verification succeeds, so it can survive with no state-file record.

**Impact.** An untracked scheduler, worker, convergence loop, or API can continue after startup reports failure, and later starts can create duplicates.

**Evidence.** The ordering is direct in production source. Child detachment removes parent-process cleanup as a fallback.

**Reproduction status.** {"status": "STATIC_INTERLEAVING_CONFIRMED", "runtime": null, "harness": null, "result": "Spawn-to-record exception window leaves current child outside rollback list."}

**Lifecycle/state-machine analysis.** SPAWNED_UNOWNED is a reachable state. The intended transition jumps from not-created to verified-owned, but the process side effect occurs before durable or in-memory ownership.

**Root cause.** Rollback ownership is established after a fallible verification phase rather than immediately after successful spawn.

**Minimal fix boundary.** Create an immediate provisional process record, keep the ChildProcess owned until verification completes, persist initializing/ambiguous ownership before detachment, and make rollback record any child whose exit cannot be verified.

**Required tests**

- Verification failure after successful spawn
- Parent SIGTERM during each startup stage
- Child starts slowly but survives timeout
- Logging or evidence failure after spawn
- Restart after provisional/ambiguous ownership

**Regression risks**

- Persisting provisional state must not let status classify unverified children as ready
- Detachment timing changes can affect operator shell behavior

**Primary owner.** R06

**Secondary sectors.** R10, R11, R23

**Aliases or dependencies.** Distinct from BWS118-R06-001: this occurs with a single starter

**Explicitly unchanged areas**

- Child command tokens and /proc verification logic remain unchanged
- No process was spawned in the review

**Blocking.** Release=YES; BWS-600=YES; B1=YES; deployment=YES.

### BWS118-R06-005: Stale-state recovery deletes ownership and starts replacements even when cleanup failed

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/operator-lifecycle.ts::startManagedBwsOperatorStack / cleanupManagedProcesses`
- **Exact line range:** `246-260; 740-749`
- **Primary full-file SHA-256:** `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`
- **Lifecycle object/process:** Stale or degraded lifecycle recovery and retained process authority

**Current source evidence**

- `packages/bootstrap/src/operations/operator-lifecycle.ts::startManagedBwsOperatorStack / cleanupManagedProcesses` lines `246-260; 740-749`, SHA-256 `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`. Recovery suppresses every cleanup failure, then unconditionally removes the only state record and starts replacements.
- `packages/bootstrap/src/operations/operator-lifecycle.ts::shutdownManagedProcesses` lines `752-771`, SHA-256 `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`. Cleanup can fail on the first owned process timeout and leave it and later processes running.

**Preconditions.** A recorded process is degraded/missing in the inspection set and at least one still-running owned process cannot be terminated or verified exited.

**Trigger.** Call start against partial state where shutdownManagedProcesses throws.

**Expected behavior.** Recovery must preserve ambiguous ownership and refuse replacement until every prior owner is verified absent or transferred under a fenced generation.

**Current behavior.** cleanupManagedProcesses swallows the error; start then deletes state and launches a fresh stack.

**Impact.** The system can intentionally lose the only durable record for live children and create overlapping service generations.

**Evidence.** The source has an unconditional rmSync and replacement transition after a catch-all cleanup helper that suppresses failure.

**Reproduction status.** {"status": "STATIC_STATE_MACHINE_CONFIRMED", "runtime": null, "harness": null, "result": "Cleanup failure does not affect the stale_state_cleaned transition."}

**Lifecycle/state-machine analysis.** DEGRADED_OLD -> CLEANUP_FAILED should be terminal/blocked. Current code forces DEGRADED_OLD -> STATE_DELETED -> NEW_START regardless of the old owner outcome.

**Root cause.** Recovery prioritizes replacement progress over preservation of ambiguous ownership.

**Minimal fix boundary.** Return a cleanup result per PID, retain state and evidence for any ambiguous/live owner, prohibit replacement without a fenced takeover, and provide an explicit operator-reviewed recovery action for irreconcilable ownership.

**Required tests**

- First child ignores SIGTERM
- Later child remains live after an earlier timeout
- Mixed missing/running process set
- Cleanup throws from process signal or /proc read
- Recovery retry after partial termination

**Regression risks**

- A stricter block may require an emergency operator workflow
- Do not erase evidence needed to diagnose old generations

**Primary owner.** R06

**Secondary sectors.** R03, R10, R11, R23

**Aliases or dependencies.** BWS118-R06-011 describes the shutdown mechanism; this finding owns the unsafe recovery transition after that failure

**Explicitly unchanged areas**

- Normal already-running detection remains unchanged
- No stale state was mutated during review

**Blocking.** Release=YES; BWS-600=YES; B1=YES; deployment=YES.

### BWS118-R06-006: Lifecycle timeout settings are per-step rather than one aggregate deadline

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/operator-lifecycle.ts::spawnAndPersistLifecycleState / waitForManagedApiObservable / shutdownManagedProcesses`
- **Exact line range:** `454-496; 752-771`
- **Primary full-file SHA-256:** `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`
- **Lifecycle object/process:** Full-stack start, status/stop wrapper, systemd start/stop, and child shutdown budget

**Current source evidence**

- `packages/bootstrap/src/operations/operator-lifecycle.ts::spawnAndPersistLifecycleState / waitForManagedApiObservable / shutdownManagedProcesses` lines `454-496; 752-771`, SHA-256 `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`. Each child-presence wait receives the full start timeout, API observability receives it again, and each shutdown wait receives the full stop timeout.
- `deployment/systemd-user/bws-operator.service.template::service timeout contract` lines `6-17`, SHA-256 `ea4b7762d1c747f25f2cd9a779ef05e44ea25a2c026363461f85fe6608d64b4c`. The supervisor allows 120 seconds while default startup can consume roughly five independent 60-second stages.
- `scripts/bws-root-wrapper-runtime.mjs::runCommand` lines `670-680`, SHA-256 `1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8`. Synchronous lifecycle wrapper subprocesses have no timeout at all.

**Preconditions.** Several children initialize or terminate slowly, or one wrapper subprocess hangs.

**Trigger.** Consume most of the configured timeout in multiple sequential stages.

**Expected behavior.** A caller-specified aggregate deadline must bound the whole lifecycle command, with remaining time passed to each stage and a consistent supervisor budget.

**Current behavior.** The same timeout is restarted for every child and the API. Stop similarly restarts its timeout per child. The root synchronous command has no deadline.

**Impact.** Commands can exceed operator and systemd budgets by multiples, be killed externally in partial states, or hang indefinitely without a terminal lifecycle record.

**Evidence.** With four descriptors plus API observability, the default theoretical start budget is approximately 300 seconds versus TimeoutStartSec=120. Stop can consume one full timeout for each distinct PID.

**Reproduction status.** {"status": "STATIC_BUDGET_PROOF", "runtime": null, "harness": null, "result": "Sequential independent deadlines exceed declared outer budgets."}

**Lifecycle/state-machine analysis.** There is no monotonic aggregate deadline carried through INITIALIZING and STOPPING. External timeout becomes the de facto transition owner and can interrupt between side effects and state publication.

**Root cause.** Timeouts are modeled as local polling limits rather than one composed lifecycle budget.

**Minimal fix boundary.** Create a monotonic command deadline, pass remaining budget to spawn verification, probes, child drain/exit, and wrapper subprocesses, reserve cleanup time, and align systemd and evidence-command margins with that single budget.

**Required tests**

- Four slow child starts plus API probe
- Multiple slow child exits
- Outer systemd timeout before inner command deadline
- Wrapper child process that never exits
- Deadline expiration at each transition boundary

**Regression risks**

- Tighter aggregate limits may expose current initialization latency
- Cleanup needs a reserved bounded budget rather than being skipped at deadline

**Primary owner.** R06

**Secondary sectors.** R01, R03, R10, R11, R23

**Aliases or dependencies.** BWS116-R01-007 owns upstream pass deadline composition; BWS116-R03-005 owns psql timeout/cancellation; BWS116-R03-011 owns scheduler/worker pass cancellation

**Explicitly unchanged areas**

- Existing per-probe AbortController cleanup remains unchanged
- No service or systemd unit was invoked

**Blocking.** Release=YES; BWS-600=YES; B1=YES; deployment=YES.

### BWS118-R06-007: API health, readiness, and metrics can remain green from declarations and stale state files after child failure

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/service-runtime.ts::createBwsOperationalStatusSnapshot`
- **Exact line range:** `330-417`
- **Primary full-file SHA-256:** `5ef569931413868cf0b2e69a653ee65cdcace9bb561f52eea1d9fb82e3ce93f3`
- **Lifecycle object/process:** Loopback /health, /readiness, /metrics and operator lifecycle probes

**Current source evidence**

- `packages/bootstrap/src/operations/service-runtime.ts::createBwsOperationalStatusSnapshot` lines `330-417`, SHA-256 `5ef569931413868cf0b2e69a653ee65cdcace9bb561f52eea1d9fb82e3ce93f3`. Upstream, persistence, API, worker, and strategy checks are constructed as pass from configuration/capability declarations; only cockpit state can fail health/readiness.
- `packages/bootstrap/src/operations/observability.ts::createBwsMetricsSnapshot` lines `442-527`, SHA-256 `ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923`. API status is hard-coded ready, and loop/lifecycle status is derived from raw state-file fields without PID/generation verification.
- `packages/bootstrap/src/api/bws-read-only-query-http.ts::health and readiness routes` lines `125-153`, SHA-256 `fc644a168e07d1afa63d84fa85582cda9c37994b2b4d66ea7366c1f442c7ac17`. HTTP status exposes the declaration-derived operational snapshot.
- `tests/bws-service-runtime.test.ts::operational status snapshot tests` lines `120-200`, SHA-256 `6d6e726a0a688c6d673457287173d07a5359caf9ce4c09dde73b2dcb938d63cc`. Tests construct ready inputs and do not crash or kill production-managed child processes.

**Preconditions.** A child process exits, a state file remains running, durable state becomes stale, or the configured API object still exists while dependencies are unavailable.

**Trigger.** Query health/readiness/metrics after process loss or stale-file retention.

**Expected behavior.** Health must describe current liveness, readiness must require every necessary service and durable dependency for the exact runtime generation, and metrics must not promote stale files to running.

**Current behavior.** Several components remain pass by construction. Metrics reports API ready and reads lifecycle values directly from files. No PID/token/start-tick/source-generation check is performed in these snapshots.

**Impact.** The API can remain HTTP 200 and systemd/operator evidence can remain green after scheduler, worker, convergence, database, or lifecycle ownership has failed.

**Evidence.** Static tracing shows no current-process authority in snapshot construction. Focused tests validate object shape and declared policy rather than adversarial process loss.

**Reproduction status.** {"status": "STATIC_CONFIRMED_TEST_GAP", "runtime": "Node v22.16.0 supplementary", "harness": "/tmp/bws118-r06-focused-tests.out", "result": "Service-runtime tests pass without managed-process failure scenarios."}

**Lifecycle/state-machine analysis.** RUNNING/READY is reconstructed from declarations and last-written files rather than current generation-bound observations, so process death has no mandatory transition to DEGRADED.

**Root cause.** Health/readiness aggregation does not consume the lifecycle owner as authoritative current state.

**Minimal fix boundary.** Build health/readiness from verified lifecycle ownership, exact runtime IDs/source generation, database compatibility/connectivity, loop service checkpoints and freshness, and API request-serving state. Make stale/unknown explicit and fail closed.

**Required tests**

- Kill each managed child then query all three endpoints
- Stale state file with reused PID
- Database unavailable after startup
- Runtime ID mismatch across state files
- Loop last-success age exceeds policy
- API listener alive but query dependencies failed

**Regression risks**

- Do not make external BWS-600 upstream availability equivalent to local process liveness
- Health and readiness may need different strictness but must share current authority

**Primary owner.** R06

**Secondary sectors.** R03, R05, R07, R11, R23

**Aliases or dependencies.** BWS116-R03-007 through R03-012 remain owners of durable transition defects exposed by this projection

**Explicitly unchanged areas**

- No claim is made that the cockpit-only check is itself incorrect
- The API remains read-only and loopback-bound

**Blocking.** Release=YES; BWS-600=YES; B1=YES; deployment=YES.

### BWS118-R06-008: The root runtime summary is disconnected from production lifecycle evidence, process verification, and HTTP envelopes

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `scripts/bws-root-wrapper-runtime.mjs::runtime summary constants / buildRuntimeSummary / classifyRuntimeCondition`
- **Exact line range:** `8-13; 320-386; 511-542`
- **Primary full-file SHA-256:** `1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8`
- **Lifecycle object/process:** check_progress.sh runtime-summary and root operator visibility

**Current source evidence**

- `scripts/bws-root-wrapper-runtime.mjs::runtime summary constants / buildRuntimeSummary / classifyRuntimeCondition` lines `8-13; 320-386; 511-542`, SHA-256 `1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8`. The wrapper reads a latest.json path not written by the lifecycle owner, trusts raw state, does not verify process records, and expects top-level status fields.
- `packages/bootstrap/src/api/bws-read-only-query-http.ts::health and readiness response envelopes` lines `128-153`, SHA-256 `fc644a168e07d1afa63d84fa85582cda9c37994b2b4d66ea7366c1f442c7ac17`. Production health and readiness statuses are nested under health.status and readiness.status.
- `packages/bootstrap/src/operations/operator-lifecycle.ts::resolveLifecycleEvidenceFilePath` lines `913-927`, SHA-256 `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`. Lifecycle evidence is timestamped; this path does not write evidence/latest.json.
- `tests/root-wrapper-runtime.test.ts::createRuntimeFixture` lines `302-423`, SHA-256 `f216fabdae694a4848855786d665f2ac05e627648d7332d0b1e37c45dc9d22c3`. The test fabricates top-level probe envelopes, a latest.json lifecycle record, and a state object with no managed process array.

**Preconditions.** The production API is running, or stale/fabricated wrapper fixture files exist without verified managed processes.

**Trigger.** Run the root runtime summary against production envelopes or a state file with no current process ownership.

**Expected behavior.** The summary must call or reuse the authoritative lifecycle status path, verify every managed process and generation, consume the actual response schemas, and locate immutable evidence through a canonical index/pointer.

**Current behavior.** Production nested envelopes are classified degraded. Conversely, test-shaped top-level envelopes plus raw state and hand-written latest files can be classified ready without any process records.

**Impact.** Operator tooling can hide a healthy production API, or more dangerously, report ready for a nonexistent/stale stack. This undermines check_progress and acceptance routing.

**Evidence.** The inert wrapper harness produced production-envelope condition=degraded and test-envelope-no-processes condition=ready. Source search found no lifecycle production writer for the expected latest.json path.

**Reproduction status.** {"status": "REPRODUCED_INERT", "runtime": "Node v22.16.0 supplementary", "harness": "/tmp/bws118-r06-wrapper-harness-async.mjs", "output": "/tmp/bws118-r06-wrapper-async.out", "result": "Real envelopes degraded; fake top-level envelopes with no processes ready."}

**Lifecycle/state-machine analysis.** The root wrapper implements a second, incompatible readiness authority. Its READY transition is reachable from synthetic files and schemas that the production owner does not generate.

**Root cause.** Operator summary logic duplicated lifecycle and HTTP contracts instead of consuming their typed, generation-bound authority.

**Minimal fix boundary.** Make runtime-summary invoke a read-only lifecycle status API/module or parse its exact schema, verify process ownership and source generation, use the evidence index for immutable latest selection, and reject missing process arrays or runtime-ID mismatches.

**Required tests**

- Production /health and /readiness envelope fixtures generated by the actual handler
- State file with no processes
- Stale process records and missing latest pointer
- Concurrent evidence index update
- Runtime ID/source generation mismatch
- check_progress exit/status behavior for ready, degraded, blocked, not-running

**Regression risks**

- Changing wrapper output keys can affect automation parsers
- A canonical latest pointer must be written atomically or derived deterministically from the evidence index

**Primary owner.** R06

**Secondary sectors.** R05, R07, R10, R11, R12

**Aliases or dependencies.** No inherited Wave 01 finding owns this root-wrapper schema/authority divergence

**Explicitly unchanged areas**

- Automation artifact reporting before runtime-summary remains unchanged
- The wrapper loopback request timeout remains bounded

**Blocking.** Release=YES; BWS-600=YES; B1=YES; deployment=YES.

### BWS118-R06-009: CLI exit codes and the oneshot systemd unit remain successful while the managed stack is degraded or gone

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/cli/bws-operator-lifecycle.ts::runBwsOperatorLifecycleCli`
- **Exact line range:** `8-30`
- **Primary full-file SHA-256:** `b17dff2d4e4012091b01943761efa1fe593c3de159e318b7fece264e751bedb5`
- **Lifecycle object/process:** Operator lifecycle CLI, systemd active state, reload/status signal

**Current source evidence**

- `packages/bootstrap/src/cli/bws-operator-lifecycle.ts::runBwsOperatorLifecycleCli` lines `8-30`, SHA-256 `b17dff2d4e4012091b01943761efa1fe593c3de159e318b7fece264e751bedb5`. Every resolved lifecycle outcome is printed and returns exit code 0, including degraded, not_running, stale_state_cleaned and blocked stack details.
- `deployment/systemd-user/bws-operator.service.template::systemd user service` lines `6-17`, SHA-256 `ea4b7762d1c747f25f2cd9a779ef05e44ea25a2c026363461f85fe6608d64b4c`. Type=oneshot and RemainAfterExit=yes preserve active state after ExecStart exits; ExecReload uses status but cannot fail on degraded/not-running outcomes.
- `packages/bootstrap/src/operations/operator-lifecycle.ts::getManagedBwsOperatorStackStatus` lines `266-300`, SHA-256 `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`. Status has explicit degraded and not_running outcomes that are not reflected in CLI exit status.

**Preconditions.** ExecStart initially returns 0, then one or all detached children fail, or ExecReload obtains degraded/not_running.

**Trigger.** Query systemd state or reload after child failure.

**Expected behavior.** Supervisor success and active/readiness state must reflect the current generation-bound managed process set. Degraded/not-running status must be machine-visible as non-success.

**Current behavior.** The oneshot unit remains active after its command exits and has no MainPID supervising detached children. CLI status returns 0 for every non-exception result.

**Impact.** systemctl can report active and reload success when no BWS service is running, defeating restart policy, monitoring, and deployment acceptance.

**Evidence.** This follows directly from systemd semantics combined with detached children and unconditional CLI zero exit.

**Reproduction status.** {"status": "STATIC_SUPERVISOR_SEMANTICS_CONFIRMED", "runtime": null, "harness": null, "result": "No service-manager-owned long-running PID or degraded exit mapping exists."}

**Lifecycle/state-machine analysis.** SYSTEMD_ACTIVE is transitioned by successful oneshot completion and never coupled to CHILD_RUNNING/STACK_READY. The CLI erases semantic outcomes at the process boundary.

**Root cause.** The deployment unit supervises a control command, not the runtime, and the CLI treats serialization as success rather than mapping state to exit status.

**Minimal fix boundary.** Use a long-running foreground supervisor as the systemd MainPID or create explicit target units per process with dependencies. Map status/readiness outcomes to documented nonzero exit codes and add a watchdog/restart policy bound to exact lifecycle state.

**Required tests**

- Child exits after oneshot start
- All children missing while unit remains active
- ExecReload under degraded/not_running
- systemd restart and stop during partial state
- Exit-code matrix for every lifecycle outcome

**Regression risks**

- Service topology changes affect packaging and deployment scripts
- Do not let systemd restart externally blocked BWS-600 work automatically

**Primary owner.** R06

**Secondary sectors.** R07, R09, R10, R11, R23

**Aliases or dependencies.** BWS118-R06-007 and R06-008 describe false state sources; this finding owns supervisor/CLI propagation

**Explicitly unchanged areas**

- No systemd command was run
- Execution and provider connections remain disabled

**Blocking.** Release=YES; BWS-600=YES; B1=YES; deployment=YES.

### BWS118-R06-010: Shutdown uses startup role order instead of scheduler-stop, worker-drain, convergence, cockpit, API order

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/operator-lifecycle.ts::LIFECYCLE_ROLE_ORDER / shutdownManagedProcesses`
- **Exact line range:** `52-58; 752-771`
- **Primary full-file SHA-256:** `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`
- **Lifecycle object/process:** Full-stack graceful stop and in-flight private-paper drain

**Current source evidence**

- `packages/bootstrap/src/operations/operator-lifecycle.ts::LIFECYCLE_ROLE_ORDER / shutdownManagedProcesses` lines `52-58; 752-771`, SHA-256 `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`. One order is reused for startup/status and shutdown, terminating convergence before scheduler and worker.
- `docs/035_continuous_service_supervisor_contract.md::BWS-584 ordered shutdown` lines `91-103`, SHA-256 `cae4ce541c65848974de8c4568e72b6d2d3d151d9f2c3eaf52cb50e6777c8505`. The accepted contract requires stop new scheduling, drain workers, stop convergence, stop cockpit, then API.
- `tests/bws-operator-lifecycle.test.ts::shutdown order assertion` lines `190-198`, SHA-256 `ff44f4a8b802187d11c4b9eb4d84cfc15570107a9080c27cfd0f48123a74a9e6`. The focused test codifies the implementation order rather than the documented drain contract.

**Preconditions.** Scheduler, worker, and convergence services are running and may have in-flight or queued work.

**Trigger.** Invoke stop on the managed stack.

**Expected behavior.** First prevent new scheduling, then allow/fence worker drain, then stop convergence, cockpit, and API while preserving status visibility until completion.

**Current behavior.** SIGTERM is sent to upstream convergence first, then scheduler, worker, cockpit/API process.

**Impact.** New scheduling can race with disappearing convergence, workers are signaled before an explicit drain contract is observed, and shutdown evidence cannot prove no lost or late work.

**Evidence.** The role order and contract are directly contradictory. The test reinforces the wrong order.

**Reproduction status.** {"status": "STATIC_CONTRACT_CONTRADICTION", "runtime": "Node v22.16.0 supplementary", "harness": "/tmp/bws118-r06-focused-tests.out", "result": "Focused lifecycle test passes the implementation order."}

**Lifecycle/state-machine analysis.** The lifecycle has no distinct STOP_SCHEDULING -> DRAINING -> CONVERGENCE_STOPPED sequence; it applies a generic TERM loop in startup order.

**Root cause.** Startup/status presentation order was reused as shutdown dependency order.

**Minimal fix boundary.** Define an explicit shutdown DAG/state machine, issue scheduler quiesce first, wait for a bounded worker drain/lease handoff, then stop convergence, cockpit, and API, with per-stage evidence and fallback escalation.

**Required tests**

- Scheduler attempts a new cycle during shutdown
- Worker owns a lease during shutdown
- Drain completes and drain times out
- Convergence pass in flight while workers finish
- Exact signal/order/evidence assertions

**Regression risks**

- Current loop signal behavior may not expose a separate quiesce/drain API and may need bounded contract changes
- Preserve the API until status/evidence publication is complete

**Primary owner.** R06

**Secondary sectors.** R03, R07, R11, R23

**Aliases or dependencies.** BWS116-R03-008 through R03-011 own durable lease and pass-cancellation mechanics

**Explicitly unchanged areas**

- The documented shutdown order is unchanged
- No worker lease or database was touched

**Blocking.** Release=YES; BWS-600=YES; B1=YES; deployment=YES.

### BWS118-R06-011: One hung child aborts shutdown before remaining owned children are signaled

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/operator-lifecycle.ts::shutdownManagedProcesses`
- **Exact line range:** `752-771`
- **Primary full-file SHA-256:** `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`
- **Lifecycle object/process:** Full-stack TERM, drain, cleanup, and terminal evidence

**Current source evidence**

- `packages/bootstrap/src/operations/operator-lifecycle.ts::shutdownManagedProcesses` lines `752-771`, SHA-256 `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`. The loop awaits each PID exit before signaling the next and throws on the first timeout.
- `packages/bootstrap/src/operations/operator-lifecycle.ts::stopManagedBwsOperatorStack` lines `303-330`, SHA-256 `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`. State removal and terminal stop evidence occur only after the entire shutdown helper succeeds.

**Preconditions.** An early ordered child ignores SIGTERM, is uninterruptible, or is misidentified as alive through the stop timeout.

**Trigger.** Stop a stack whose first selected process does not exit.

**Expected behavior.** All owned processes should receive their stage-appropriate stop/quiesce signal, failures should be accumulated, escalation should be bounded, and retained state should identify every unresolved owner.

**Current behavior.** The first timeout throws. Later children are never signaled, no aggregate result is emitted, and the state remains as it was before stop.

**Impact.** A single hung service prevents API, worker, scheduler, and other processes from stopping, causes systemd timeout, and leaves no complete shutdown diagnosis.

**Evidence.** The sequential await and throwing waitForManagedProcessExit path have no continue/finally or aggregate failure structure.

**Reproduction status.** {"status": "STATIC_CONTROL_FLOW_CONFIRMED", "runtime": null, "harness": null, "result": "First rejection exits the shutdown loop before subsequent PIDs."}

**Lifecycle/state-machine analysis.** STOPPING(role1) -> TIMEOUT exits the state machine instead of recording role1 unresolved and progressing through the bounded stop plan.

**Root cause.** Shutdown is fail-fast at the first child rather than best-effort, fenced, and exhaustively accounted.

**Minimal fix boundary.** Use a dependency-aware bounded shutdown coordinator that signals all eligible roles, records per-PID outcomes, escalates TERM to an explicitly approved fallback only after identity revalidation, preserves unresolved ownership, and returns an aggregate degraded-stop result.

**Required tests**

- First child ignores TERM
- Middle child times out after earlier exits
- Multiple children fail
- Signal throws ESRCH/EPERM
- Aggregate state/evidence and second-stop convergence

**Regression risks**

- Concurrent signaling must preserve dependency order where drain matters
- Escalation policy must not kill unrelated/reused PIDs

**Primary owner.** R06

**Secondary sectors.** R03, R10, R11, R23

**Aliases or dependencies.** BWS118-R06-005 owns unsafe recovery after this failure

**Explicitly unchanged areas**

- No automatic SIGKILL is currently present
- State is retained on the direct stop exception, which remains a partial safeguard

**Blocking.** Release=YES; BWS-600=YES; B1=YES; deployment=YES.

### BWS118-R06-012: Stop signaling and exit waits are vulnerable to PID reuse after the initial /proc verification

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/operator-lifecycle.ts::inspectManagedProcesses / shutdownManagedProcesses`
- **Exact line range:** `752-790`
- **Primary full-file SHA-256:** `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`
- **Lifecycle object/process:** Linux PID identity between status inspection, SIGTERM, and exit verification

**Current source evidence**

- `packages/bootstrap/src/operations/operator-lifecycle.ts::inspectManagedProcesses / shutdownManagedProcesses` lines `752-790`, SHA-256 `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`. Processes are verified in one pass, but later signaling uses only the recorded PID without revalidating token, cwd, command, or start ticks.
- `packages/bootstrap/src/operations/operator-lifecycle.ts::readProcessSnapshot / waitForManagedProcessExit` lines `1037-1062; 1150-1158`, SHA-256 `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`. The exit wait tests only process.kill(pid, 0), so a reused PID can appear continuously alive.

**Preconditions.** A verified managed process exits and the OS reuses its PID before signal or during the exit wait.

**Trigger.** Race process termination/PID reuse between inspectManagedProcesses and process.kill or during waitForManagedProcessExit.

**Expected behavior.** Identity must be revalidated immediately before every signal and throughout exit verification using start ticks/token/cwd/cmdline or pidfd-style ownership.

**Current behavior.** A stale PID can be signaled after a prior snapshot, and a replacement process can keep the exit loop alive until timeout. The initial strong /proc proof is not carried through the destructive boundary.

**Impact.** An unrelated local process can receive SIGTERM, or stop can fail/hang while waiting for a replacement PID. This violates the no-unrelated-process-mutation contract.

**Evidence.** Static TOCTOU proof exists between inspection and signal. The wait helper accepts only a numeric PID.

**Reproduction status.** {"status": "STATIC_RACE_CONFIRMED", "runtime": "Linux required", "harness": null, "result": "Identity proof is not rechecked at signal or wait boundaries."}

**Lifecycle/state-machine analysis.** VERIFIED_OWNER(pid,startTicks) degrades to numeric pid before the destructive transition. PID reuse creates an ABA state that the wait loop cannot distinguish.

**Root cause.** Strong process identity is implemented for observation but discarded for signal and completion operations.

**Minimal fix boundary.** Pass the full process record to signal/wait, re-read and compare /proc immediately before TERM and each poll, use pidfd where available, treat identity change as original owner exited, and never signal a mismatched replacement.

**Required tests**

- Synthetic process-runtime adapter simulating PID reuse before signal
- PID reuse during exit wait
- Command/token/cwd/start-tick mismatch
- ESRCH after verification
- pidfd and /proc fallback behavior

**Regression risks**

- Frequent /proc reads must handle transient disappearance without converting it into failure
- Cross-platform behavior must fail closed where exact identity cannot be proved

**Primary owner.** R06

**Secondary sectors.** R10, R11, R23

**Aliases or dependencies.** No inherited finding owns the lifecycle signal ABA race

**Explicitly unchanged areas**

- Existing /proc command, cwd, token, and start-tick checks are intentional safeguards
- No signal was sent during review

**Blocking.** Release=YES; BWS-600=YES; B1=YES; deployment=YES.

### BWS118-R06-013: API listener and request promises lack one bounded, exception-safe ownership boundary

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/runtime-applications.ts::startBwsReadOnlyApiApplication / close / closeHttpServer`
- **Exact line range:** `190-300; 863-889`
- **Primary full-file SHA-256:** `216b980403a59909b07a27fb475d22cf6ee35b41364fd0bb46c510d17d9e0322`
- **Lifecycle object/process:** HTTP listener, active requests/sockets, signal callbacks, metrics/status factories, close promise and API CLI lifetime

**Current source evidence**

- `packages/bootstrap/src/operations/runtime-applications.ts::startBwsReadOnlyApiApplication / close / closeHttpServer` lines `190-300; 863-889`, SHA-256 `216b980403a59909b07a27fb475d22cf6ee35b41364fd0bb46c510d17d9e0322`. The listener starts before shutdown ownership is fully registered; close assigns its shared promise only after fallible logging; signal callbacks discard rejections; server.close has no deadline, socket registry, or request cancellation.
- `packages/bootstrap/src/api/bws-read-only-query-http.ts::createBwsReadOnlyQueryHttpHandler` lines `110-218`, SHA-256 `fc644a168e07d1afa63d84fa85582cda9c37994b2b4d66ea7366c1f442c7ac17`. The query handler catches synchronous/awaited route errors, but runtime wrapper failures outside this handler are not covered.
- `packages/bootstrap/src/operations/runtime-applications.ts::createManagedRuntimeRequestHandler metrics and async dispatch` lines `617-674`, SHA-256 `216b980403a59909b07a27fb475d22cf6ee35b41364fd0bb46c510d17d9e0322`. The async managed handler invokes metrics/status factories without an outer owned rejection path.
- `packages/bootstrap/src/cli/bws-read-only-api.ts::runBwsReadOnlyApiCli` lines `16-39`, SHA-256 `5e08f4cc0b5f76a7c5c04e735c791281607fa007031c55b2dc0bf38c9d4cf811`. The CLI waits forever for application.closed, which is never resolved if close hangs or its rejection is dropped.

**Preconditions.** A request/status/metrics/logger callback throws or rejects, a connection remains open, or close exceeds the outer lifecycle budget.

**Trigger.** Throw from metricsSnapshotFactory, send SIGTERM with an open request/socket, or throw during shutdown event emission.

**Expected behavior.** All request promises, listener errors, sockets, and close work must be owned by one boundary that catches failures, aborts in-flight work, closes within a deadline, publishes terminal state, and settles application.closed exactly once.

**Current behavior.** An async request rejection can become unhandled and leave the client hanging. Signal callbacks use void close. server.close can wait indefinitely, and a pre-close logging exception occurs before closePromise is assigned.

**Impact.** API shutdown can hang the stack, errors can bypass HTTP responses and lifecycle evidence, and late requests can complete after stop/replacement.

**Evidence.** An inert harness made metricsSnapshotFactory throw: the client had to abort and Node emitted unhandledRejection=inert-metrics-failure. Static tracing confirms no close deadline or socket/request registry.

**Reproduction status.** {"status": "REPRODUCED_INERT", "runtime": "Node v22.16.0 supplementary", "harness": "/tmp/bws118-r06-http-rejection-harness.mts", "output": "/tmp/bws118-r06-http-rejection.out", "result": "AbortError at client plus unhandled rejection from metrics factory."}

**Lifecycle/state-machine analysis.** LISTENING -> CLOSING has unowned entry paths, and REQUEST_ACTIVE has no cancellation relation to CLOSING. A rejection can escape without moving the API to FAILED/CLOSED.

**Root cause.** Listener, request, logging, and close resources are composed as independent promises rather than one lifecycle-owned abort/error boundary.

**Minimal fix boundary.** Install error/signal ownership before listen is exposed, wrap every async request path, assign an idempotent close promise before fallible work, track sockets and requests, abort/stop admission on close, apply an aggregate deadline, and settle closed with a recorded success/failure exactly once.

**Required tests**

- Throwing metrics/status/cockpit/logger callbacks
- Open keep-alive and partial-body requests during SIGTERM
- Concurrent close calls and two signals
- server.close error and timeout
- Request completion after replacement generation starts
- application.closed resolution/rejection contract

**Regression risks**

- Force-closing sockets can truncate legitimate read responses; define grace then abort
- Changing closed rejection semantics affects CLI error propagation

**Primary owner.** R06

**Secondary sectors.** R05, R10, R11, R23

**Aliases or dependencies.** BWS116-R03-005 owns psql cancellation; BWS116-R03-011 owns scheduler/worker in-flight cancellation

**Explicitly unchanged areas**

- Loopback-only bind and GET-only query policy remain unchanged
- No non-loopback network was contacted

**Blocking.** Release=YES; BWS-600=YES; B1=YES; deployment=YES.

### BWS118-R06-014: Successful service passes leave timeout timers alive until their full configured duration

- **Severity:** P2
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/upstream-convergence-service.ts::raceWithTimeout`
- **Exact line range:** `504-526`
- **Primary full-file SHA-256:** `937ad8b789002504b674351c04e2179ba2800e17deea1d5e17aa0dd31786d5a8`
- **Lifecycle object/process:** Per-pass timeout timer and Node event-loop liveness

**Current source evidence**

- `packages/bootstrap/src/operations/upstream-convergence-service.ts::raceWithTimeout` lines `504-526`, SHA-256 `937ad8b789002504b674351c04e2179ba2800e17deea1d5e17aa0dd31786d5a8`. Promise.race creates a sleep timer and never clears/unrefs it when the pass resolves first.
- `packages/bootstrap/src/operations/private-paper-scheduler-service.ts::raceWithTimeout` lines `531-553`, SHA-256 `876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967`. Scheduler has the same timer ownership pattern.
- `packages/bootstrap/src/operations/private-paper-worker-service.ts::raceWithTimeout` lines `552-574`, SHA-256 `1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36`. Worker has the same timer ownership pattern.

**Preconditions.** A pass resolves before passTimeoutMs, including maxPasses=1 tests or shutdown after a quick pass.

**Trigger.** Run a fast pass with a multi-second timeout and allow the service function to return.

**Expected behavior.** The losing timeout branch must be cancelled and released immediately, or use an unrefed/abortable deadline that cannot hold process liveness.

**Current behavior.** Every successful pass leaves its timer pending. Repeated passes accumulate active timers; the final one can keep Node alive after the function returns.

**Impact.** Shutdown and test processes are delayed, timer count grows with pass rate, and outer lifecycle timeouts can expire after logical completion.

**Evidence.** The inert worker harness returned in 21.64 ms with a 2500 ms pass timeout, but process wall time exceeded the control by about 2.30 seconds, matching the pending timer.

**Reproduction status.** {"status": "REPRODUCED_INERT", "runtime": "Node v22.16.0 supplementary", "harness": "/tmp/bws118-r06-timer-harness.mts", "output": "/tmp/bws118-r06-timer-harness.out", "result": "Function completed quickly; process remained alive until losing timeout timer expired."}

**Lifecycle/state-machine analysis.** PASS_COMPLETED releases business work but not the timeout resource. Resource cleanup is not coupled to the race settlement.

**Root cause.** The timeout helper uses a bare sleep promise whose timer handle is inaccessible to the winner path.

**Minimal fix boundary.** Replace sleepFor race with an abortable timeout helper that clears its handle in finally, and ensure late pass handling remains owned under the R01/R03 cancellation contracts.

**Required tests**

- Fast pass with long timeout
- Thousands of quick passes with active-handle count
- Shutdown immediately after pass completion
- Timeout winner and pass rejection races
- No double settlement or unhandled rejection

**Regression risks**

- Do not accidentally stop observing the underlying pass when the timeout wins
- Timer unref alone does not solve late work ownership

**Primary owner.** R06

**Secondary sectors.** R01, R03, R11

**Aliases or dependencies.** Distinct from BWS116-R01-007 and BWS116-R03-011: those own uncancelled underlying work, while this finding owns the losing timer handle

**Explicitly unchanged areas**

- Pass classification semantics remain unchanged
- No provider or database work was executed

**Blocking.** Release=NO; BWS-600=NO; B1=NO; deployment=YES.

### BWS118-R06-015: Unexpected pass failures exit without a terminal service state or failure evidence

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/upstream-convergence-service.ts::runBwsUpstreamConvergenceService`
- **Exact line range:** `301-414`
- **Primary full-file SHA-256:** `937ad8b789002504b674351c04e2179ba2800e17deea1d5e17aa0dd31786d5a8`
- **Lifecycle object/process:** Standalone service state/evidence on unclassified pass rejection

**Current source evidence**

- `packages/bootstrap/src/operations/upstream-convergence-service.ts::runBwsUpstreamConvergenceService` lines `301-414`, SHA-256 `937ad8b789002504b674351c04e2179ba2800e17deea1d5e17aa0dd31786d5a8`. The loop has try/finally only for listener disposal; an unexpected pass rejection escapes after running state/pass-start state is written.
- `packages/bootstrap/src/operations/private-paper-scheduler-service.ts::runBwsPrivatePaperSchedulerService` lines `305-421`, SHA-256 `876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967`. Scheduler has the same no-catch terminal-state path.
- `packages/bootstrap/src/operations/private-paper-worker-service.ts::runBwsPrivatePaperWorkerService` lines `317-451`, SHA-256 `1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36`. Worker has the same no-catch terminal-state path.

**Preconditions.** An injected or production pass promise rejects instead of returning the expected BoundaryResult, or a state/evidence/log write throws.

**Trigger.** Reject the pass promise after service_started and pass-start state are written.

**Expected behavior.** The service must transition to failed/unknown with timestamp, error class, current pass, process generation, and terminal evidence before returning/rethrowing; status must not report running.

**Current behavior.** The rejection escapes. Signal listeners are disposed, but the durable state remains lifecycleState=running and no failure/stop evidence is written.

**Impact.** Status and metrics can falsely report a dead service as running; restart sees stale state without the failure cause; incident evidence is incomplete.

**Evidence.** The inert worker harness rejected one pass. It returned an error while state remained running, totalPassCount=0, hasLastPass=false, and only the service_started evidence existed.

**Reproduction status.** {"status": "REPRODUCED_INERT", "runtime": "Node v22.16.0 supplementary", "harness": "/tmp/bws118-r06-rejection-state-harness.mts", "output": "/tmp/bws118-r06-rejection-state.out", "result": "Rejected pass left durable state running with no terminal failure evidence."}

**Lifecycle/state-machine analysis.** RUNNING -> PASS_STARTED -> exception has no transition. The process exits, but durable state remains at the prior nonterminal node.

**Root cause.** Only expected result variants are modeled; unexpected exceptions are treated as process errors without durable lifecycle finalization.

**Minimal fix boundary.** Add failed/unknown terminal states and a top-level catch/finally that records sanitized failure evidence and state exactly once, while preserving the original error and any ambiguous in-flight operation identity.

**Required tests**

- Rejected pass promise
- State write failure after pass
- Evidence/logger failure after state write
- Exception during classification
- Restart/status from failed and unknown states

**Regression risks**

- Failure finalization itself can fail and needs a bounded fallback record
- Do not misclassify a timed-out but still-running pass as safely failed

**Primary owner.** R06

**Secondary sectors.** R01, R03, R07, R11

**Aliases or dependencies.** BWS116-R03-011 owns cancellation of in-flight scheduler/worker work; this finding owns durable service terminality after an exception

**Explicitly unchanged areas**

- Expected BoundaryResult blocker/retry outcomes remain unchanged
- No persistent state outside the disposable harness was written

**Blocking.** Release=YES; BWS-600=YES; B1=YES; deployment=YES.

### BWS118-R06-016: Millisecond evidence filenames collide across legitimate lifecycle events and can crash the service

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/upstream-convergence-service.ts::writeEvidenceRecord / resolveEvidenceFilePath`
- **Exact line range:** `873-900`
- **Primary full-file SHA-256:** `937ad8b789002504b674351c04e2179ba2800e17deea1d5e17aa0dd31786d5a8`
- **Lifecycle object/process:** Immutable lifecycle evidence artifact key and state/evidence commit boundary

**Current source evidence**

- `packages/bootstrap/src/operations/upstream-convergence-service.ts::writeEvidenceRecord / resolveEvidenceFilePath` lines `873-900`, SHA-256 `937ad8b789002504b674351c04e2179ba2800e17deea1d5e17aa0dd31786d5a8`. Filename identity is generatedAt to milliseconds plus command and outcome; write rejects an existing path.
- `packages/bootstrap/src/operations/private-paper-scheduler-service.ts::writeEvidenceRecord / resolveEvidenceFilePath` lines `895-921`, SHA-256 `876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967`. Scheduler uses the same collision-prone key.
- `packages/bootstrap/src/operations/private-paper-worker-service.ts::writeEvidenceRecord / resolveEvidenceFilePath` lines `954-972`, SHA-256 `1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36`. Worker uses the same collision-prone key.
- `packages/bootstrap/src/operations/operator-lifecycle.ts::writeLifecycleEvidence / resolveLifecycleEvidenceFilePath` lines `913-927`, SHA-256 `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`. Operator lifecycle evidence has the same timestamp-command-outcome identity.

**Preconditions.** Two records for the same command/outcome are generated in one millisecond, the injected clock is fixed/coarse, or concurrent status calls share a timestamp.

**Trigger.** Run startup and a fast pass, or two status commands, with the same generatedAt millisecond.

**Expected behavior.** Evidence identity must include a collision-resistant runtime generation and monotonic event sequence/UUID, with atomic no-overwrite publication and deterministic index linkage.

**Current behavior.** The second legitimate event targets the same path and throws. State may already have advanced before evidence publication fails.

**Impact.** A fast service can crash on its first pass, concurrent status can fail, and state/evidence diverge. Restart and acceptance trails become incomplete.

**Evidence.** The inert convergence harness fixed now() to one timestamp. service_started wrote the first run-running file; pass_completed attempted the same path and threw already exists.

**Reproduction status.** {"status": "REPRODUCED_INERT", "runtime": "Node v22.16.0 supplementary", "harness": "/tmp/bws118-r06-evidence-collision-harness.mts", "output": "/tmp/bws118-r06-evidence-collision.out", "result": "First pass failed because startup and completion resolved to one evidence filename."}

**Lifecycle/state-machine analysis.** STATE_WRITTEN -> EVIDENCE_WRITE can fail for a normal event identity collision. There is no atomic aggregate or recovery index to reconcile the advanced state with missing evidence.

**Root cause.** Wall-clock millisecond plus low-cardinality fields is used as a uniqueness key rather than a timestamp attribute.

**Minimal fix boundary.** Add runtimeId plus a monotonic event counter or UUID to evidence IDs, use atomic create, update an append/index record only after durable artifact publication, and define recovery when state exists without its evidence event.

**Required tests**

- Fixed clock startup plus pass completion
- Concurrent status commands
- Multiple blocked/retry passes in one millisecond
- Clock regression
- State/evidence write failure reconciliation

**Regression risks**

- Changing filenames affects evidence indexes, retention, and downstream handoffs
- Sequence allocation must itself be concurrency-safe

**Primary owner.** R06

**Secondary sectors.** R03, R07, R11, R12

**Aliases or dependencies.** No inherited root cause owns lifecycle evidence filename uniqueness

**Explicitly unchanged areas**

- Existing no-overwrite check is an intentional safeguard against silent artifact replacement
- No repository evidence was written

**Blocking.** Release=YES; BWS-600=YES; B1=YES; deployment=YES.

### BWS118-R06-017: Health and failure diagnostics synchronously hash or read unbounded filesystem data

- **Severity:** P2
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/runtime-applications.ts::readCockpitState / fingerprintDirectory`
- **Exact line range:** `190-198; 675-712`
- **Primary full-file SHA-256:** `216b980403a59909b07a27fb475d22cf6ee35b41364fd0bb46c510d17d9e0322`
- **Lifecycle object/process:** API event loop, startup failure reporting, and root runtime diagnostics

**Current source evidence**

- `packages/bootstrap/src/operations/runtime-applications.ts::readCockpitState / fingerprintDirectory` lines `190-198; 675-712`, SHA-256 `216b980403a59909b07a27fb475d22cf6ee35b41364fd0bb46c510d17d9e0322`. Each operational snapshot recursively lists and reads every cockpit asset synchronously to recompute a digest.
- `packages/bootstrap/src/operations/operator-lifecycle.ts::readManagedProcessStdioTail` lines `1128-1147`, SHA-256 `704457608967fcb4bd736d372f1e65d252bc1d762f5efd63e52de5c9348e0f31`. Failure-tail logic reads the entire log into memory before selecting the final 20 lines.
- `scripts/bws-root-wrapper-runtime.mjs::readStructuredLogFiles` lines `605-615`, SHA-256 `1d1d5fe74a399da77aeaffecf784c6d7f47176c5101e85ae9987cac87cc2bcb8`. Runtime summary synchronously lists and sorts every structured log file without a cap.

**Preconditions.** Cockpit assets, child logs, or structured log directories grow large or contain many files.

**Trigger.** Query health/readiness repeatedly or trigger startup diagnostics under large filesystem state.

**Expected behavior.** Hot health paths and failure reporting must use bounded cached fingerprints, bounded tail reads, capped file enumeration, and explicit stale/error states.

**Current behavior.** Health recomputes the entire build digest synchronously; error-tail reads full logs; root summary enumerates all matching logs.

**Impact.** The loopback API can block, memory can spike during failure handling, status can exceed its own deadlines, and observability work can prevent shutdown.

**Evidence.** Static source shows unbounded synchronous reads/enumeration on production request and failure paths. No configured byte/file/depth limits exist.

**Reproduction status.** {"status": "STATIC_BOUNDEDNESS_CONFIRMED", "runtime": null, "harness": null, "result": "No finite filesystem workload bound is enforced."}

**Lifecycle/state-machine analysis.** Diagnostic and health work is not budgeted as a resource-owned operation. Data growth increases latency and memory without changing configuration.

**Root cause.** Immutable build metadata and bounded tail/index primitives exist conceptually, but production paths recompute or scan raw filesystem content.

**Minimal fix boundary.** Verify cockpit digest once at startup and cache it with immutable build identity, stream bounded log tails from the end, cap and page log listings, and propagate timeout/stale/error conditions without blocking the event loop.

**Required tests**

- Large cockpit asset tree
- Single multi-gigabyte child log
- Hundreds of thousands of structured logs
- Concurrent health requests
- Filesystem mutation/error during scan

**Regression risks**

- Caching must remain bound to immutable asset generation
- Bounded tails must preserve redaction and valid UTF-8 handling

**Primary owner.** R06

**Secondary sectors.** R05, R07, R11, R12

**Aliases or dependencies.** BWS116-R03-012 owns unbounded database reads, not these filesystem operations

**Explicitly unchanged areas**

- Current path-containment check for child logs remains unchanged
- No large-file stress harness was run to avoid resource abuse

**Blocking.** Release=NO; BWS-600=NO; B1=NO; deployment=NO.

## Hypotheses and environment blockers

### BWS118-R06-HYP-001: Configuration mismatch can block emergency management of still-owned processes

Status and stop fail closed when the current configuration fingerprint differs from recorded state. This prevents accidental cross-configuration control, but the supplied source does not provide a separately authorized recovery path that can stop exact token/start-tick owners without reproducing old configuration. Dynamic operator recovery was not exercised.

Owner: `R06`. Dependencies: `BWS118-R06-003, BWS118-R06-005`

### BWS118-R06-ENV-001: Canonical Node 20.20.2 was unavailable

Actual Node was v22.16.0. All TypeScript loader tests and inert harness results are supplementary rather than canonical acceptance.

Owner: `R06`.

### BWS118-R06-ENV-002: PostgreSQL execution was unavailable and prohibited without a safe disposable local server

No psql client or safely configured local PostgreSQL server was present. No database was created, contacted, or mutated. R03 findings remain authoritative for PostgreSQL behavior.

Owner: `R03`.

### BWS118-R06-ENV-003: Clean TypeScript compilation could not run without installing absent dependencies

The archive has no node_modules and tsc failed on missing @types/node. Dependency installation was prohibited. Global ts-node was used only for bounded supplementary harnesses.

Owner: `R11`.

## Intentional safeguards

### BWS118-R06-SAFE-001: Strong initial Linux process identity verification

The lifecycle owner verifies repository cwd, exact command vector, lifecycle token and /proc start ticks before classifying a process running. R06-012 concerns loss of that identity at signal/wait, not the initial check.

Owner: `R06`.

### BWS118-R06-SAFE-002: No process-name killing

Signals target recorded PIDs rather than broad process-name matching.

Owner: `R06`.

### BWS118-R06-SAFE-003: Paper-only, provider-disabled and execution-disabled runtime policy

Reviewed lifecycle paths retain the no-live-operation boundary and loopback API policy.

Owner: `R06`.

### BWS118-R06-SAFE-004: Atomic state-file replacement prevents torn JSON

Temporary write plus rename protects byte integrity. It does not create exclusive ownership, which is R06-001.

Owner: `R06`.

### BWS118-R06-SAFE-005: Probe timeout handles are cleared

fetchProbe uses AbortController and clears its timer in finally. This is distinct from the pass-timer leak in R06-014.

Owner: `R06`.

### BWS118-R06-SAFE-006: Direct stop retains state when shutdown throws

The normal stop path removes state only after shutdownManagedProcesses completes. R06-005 concerns the separate stale-recovery path that suppresses failure and deletes it.

Owner: `R06`.

### BWS118-R06-SAFE-007: Evidence files reject silent overwrite

Evidence writers refuse an existing path. This preserves immutability but exposes the inadequate identity key in R06-016.

Owner: `R06`.

## Rejected suspicions

### BWS118-R06-REJ-001: Detached children are not inherently invalid

Detachment can be acceptable when an exact durable owner, generation, bounded cleanup and supervisor exist. Findings target missing/unsafe ownership transitions, not detachment by itself.

Owner: `R06`.

### BWS118-R06-REJ-002: Automatic restart is not independently required

The repository may intentionally leave restart to an external supervisor. The defect is false active/readiness and unsafe replacement, not absence of an internal restart loop.

Owner: `R06`.

### BWS118-R06-REJ-003: Blocked external BWS-600 readiness need not abort process startup

A process may run while external evidence is blocked. It must be represented as started-not-ready rather than terminal successful readiness.

Owner: `R06`.

### BWS118-R06-REJ-004: Configuration mismatch fail-closed behavior is a valid safeguard

Rejecting arbitrary changed configuration protects ownership. Only the absence of a proven emergency recovery path remains a hypothesis.

Owner: `R06`.

### BWS118-R06-REJ-005: Timestamped immutable evidence is acceptable in principle

The defect is collision-prone event identity and missing canonical linkage, not the use of timestamps as metadata.

Owner: `R06`.

## Cross-area handoffs

### BWS118-R06-HO-001: R01 convergence deadline and late completion

Retain BWS116-R01-006 and BWS116-R01-007 for upstream pagination/cycle boundedness and underlying convergence late-result ownership. R06 owns only aggregate process lifecycle deadlines and service terminality.

Owner: `R01`.

### BWS118-R06-HO-002: R01 transport limits and external URL authority

Retain BWS116-R01-008 and BWS116-R01-009 for response buffering, DNS/redirect and upstream target validation. R06 did not reclassify them.

Owner: `R01`.

### BWS118-R06-HO-003: R03 concurrent migration ownership

BWS116-R03-004 remains the owner of migration serialization. R06-001 can make that defect reachable through concurrent service starts.

Owner: `R03`.

### BWS118-R06-HO-004: R03 psql timeout and cancellation

BWS116-R03-005 remains the owner of psql subprocess timeout/cancellation. R06 owns propagation of the outer shutdown/deadline state.

Owner: `R03`.

### BWS118-R06-HO-005: R03 durable transition, lease, fencing and retry mechanics

BWS116-R03-007 through R03-010 remain authoritative for durable state transitions, lease fencing, caller-controlled lease time and expired-lease retry handling.

Owner: `R03`.

### BWS118-R06-HO-006: R03 in-flight scheduler and worker cancellation

BWS116-R03-011 remains the owner of pass and database work that continues after service timeout or shutdown. R06-010 through R06-015 cover process-level shutdown ordering, ownership and terminal state.

Owner: `R03`.

### BWS118-R06-HO-007: R03 database read boundedness

BWS116-R03-012 remains the owner of unbounded persistence reads. R06-017 is limited to filesystem/request-path boundedness.

Owner: `R03`.

### BWS118-R06-HO-008: R05 API and cockpit presentation truth

R05 should consume R06-007 and R06-008 when judging whether the operator cockpit or read models promote declaration/stale state to green. R06 owns the service-status source and wrapper lifecycle authority.

Owner: `R05`.

### BWS118-R06-HO-009: R11 assurance and source-manifest drift

R11 must retain KNOWN_BASELINE_MANIFEST_DRIFT and evaluate why validators/tests accept the R06 lifecycle defects, including synthetic wrapper envelopes and wrong shutdown-order assertions.

Owner: `R11`.

### BWS118-R06-HO-010: R23 deployment and supervision

A future deployment/supervision review must consume R06-003, R06-006, R06-009, R06-011, R06-012 and R06-013. R06 owns source behavior; deployment packaging/system integration remains cross-area.

Owner: `R23`.

## Test gaps

### BWS118-R06-TG-001: No real interprocess concurrent-start test

Focused tests do not launch two OS lifecycle owners or standalone services against one state path.

Owner: `R11`.

### BWS118-R06-TG-002: No full-role initialization/readiness adversary

Tests check child presence and accept blocked readiness; they do not hold scheduler, worker, convergence or database initialization in a partial state.

Owner: `R11`.

### BWS118-R06-TG-003: No active-generation mutation test

Tests do not start one executable generation, change source/dist/manifest, then run status and stop.

Owner: `R11`.

### BWS118-R06-TG-004: No startup interruption and failed-cleanup matrix

There is no adversarial test for each spawn-to-record window, parent signal during initialization, or stale cleanup failure followed by replacement.

Owner: `R11`.

### BWS118-R06-TG-005: No hung-child and PID-reuse shutdown test

The process adapter does not model identity change immediately before signal or one child preventing later stop stages.

Owner: `R11`.

### BWS118-R06-TG-006: Root-wrapper tests use non-production envelopes and fabricated latest files

The wrapper test server returns top-level status values and writes state/evidence shapes production does not generate.

Owner: `R11`.

### BWS118-R06-TG-007: No API async-failure/socket-drain test

Tests do not throw metrics/status/logger callbacks, hold sockets open, race concurrent close calls, or assert application.closed settlement.

Owner: `R11`.

### BWS118-R06-TG-008: No timer-handle, constant-clock or unexpected-rejection lifecycle test

Tests do not check losing timer cleanup, same-millisecond evidence IDs, or terminal state after a rejected pass.

Owner: `R11`.

### BWS118-R06-TG-009: Canonical Node 20/systemd integration remains unexecuted here

Node 20.20.2 and a safe user-systemd integration environment were unavailable in this review.

Owner: `R11`.

## Focused validation and adversarial harnesses

- Focused TypeScript tests: 41 total, 35 passed, 6 failed, 72.838 seconds. Five failures were caused by the absent generated `config/betting-win.upstream.lock.json` test prerequisite. One root-wrapper start/stop test correctly rejected Node 22 because the repository requires Node 20. These are environment/preparation limitations, not evidence that the six tested product assertions are false.
- `validate_repo.py`, `validate_remaining_operator_runtime_program.py`, `validate_node_runtime_loader.py`, `validate_no_provider_connections.py`, and `validate_no_execution_paths.py` passed.
- `validate_source_manifest.py` failed only for the inherited `KNOWN_BASELINE_MANIFEST_DRIFT` assigned to R11.
- Timer harness: quick worker service completion retained a timeout timer until its configured duration.
- Root-wrapper harness: production nested envelopes were degraded; test-shaped top-level envelopes with no process records were ready.
- HTTP harness: a throwing metrics factory produced an unhandled rejection and a hung request until client abort.
- Rejection-state harness: an unexpected pass rejection left the durable service state running and emitted no terminal failure evidence.
- Evidence-collision harness: one fixed timestamp caused startup and pass-completion events to target the same immutable filename and crash.

## Prioritized review-only remediation order

1. Introduce one atomic, fenced lifecycle ownership and source-generation model for full-stack and standalone services.
2. Make start/status/stop non-mutating management operations over immutable release bytes and return state-sensitive CLI exit codes.
3. Replace startup and shutdown with explicit aggregate-deadline state machines, including provisional child ownership, role readiness, scheduler quiesce, worker drain, per-PID results, and preserved ambiguous ownership.
4. Carry strong PID/process identity through signal and exit verification.
5. Derive health/readiness/metrics and root-wrapper summaries from authoritative current lifecycle state and exact production schemas.
6. Own API listener, request, socket, signal, logging, cancellation and close promises under one bounded generation.
7. Add failed/unknown service terminal states, collision-resistant evidence identities, and state/evidence recovery rules.
8. Clear losing timers and bound filesystem diagnostics.
9. Then repair focused tests and validators, and rerun the complete suite under Node 20.20.2 plus safe systemd/PostgreSQL integration environments.

This order is review-only. No implementation prompt, overlay, patch, command, controller, or source modification was produced.

## Explicit unchanged areas

- R01 upstream route, pagination, response-size, SSRF, and convergence semantic findings retain their original IDs.
- R02 identity, quote, economics, opportunity, solver, rounding, and scenario findings retain their original IDs.
- R03 PostgreSQL schema, transactions, idempotency, leases, checkpoints, retry, cancellation, restart, and database boundedness findings retain their original IDs.
- `KNOWN_BASELINE_MANIFEST_DRIFT` remains an R11 handoff and is not an R06 finding.
- BWS-600 remains externally blocked, BWS-710 remains blocked on accepted upstream B1 runtime resource, and BWS-900 remains parked.
- No live execution, public signal, provider connection, account, credential, database, wallet, signer, or external service path was enabled or contacted.
- No archive member or extracted source member was modified.

## Validation limitations

- Node 20.20.2 was unavailable. Node 22 behavior is supplementary.
- Dependencies were not installed; clean typecheck/build could not be completed because `@types/node` was absent.
- PostgreSQL and systemd user integration were not executed.
- No real process was signaled and no real managed stack was started. Interprocess/PID races are source-confirmed but were not forced against user processes.
- No high-volume filesystem stress test was run for R06-017.
