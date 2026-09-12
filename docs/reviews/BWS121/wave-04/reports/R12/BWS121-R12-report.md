# BWS121-R12 deep review: autonomous controllers, child protocols, locks, artifacts, cleanup, and campaign finalization

## Executive verdict

```text
review_id=BWS121-R12
repository=betting-win-surebet
archive_sha256=025936d21db89ac5cf4881863f05ec9ed5ddaaa2b4adfe60e766207fc4c9b9f7
regular_files=733
archive_path_and_type_safety=PASS
extraction_integrity=PASS
executable_compatibility=EXACT_NON_DOCUMENTATION_BYTE_EQUIVALENCE_WITH_BWS120
inherited_findings_checked=137
duplicated_inherited_root_causes=0
confirmed_findings=13
P0=0
P1=12
P2=1
P3=0
release_blocking=12
deployment_blocking=12
overall_verdict=BLOCKED_SOURCE_CORRECTNESS_REMEDIATION_REQUIRED
```

The BWS121 archive is structurally safe and independently hashes to the value above. Relative to BWS120, it adds the 38-file Wave 03 review package and changes two documentation indexes. No executable source, test, migration, schema, package, script, or configuration byte changed. The R12 conclusions therefore apply to the same executable lineage that carries the 137 inherited R01 through R09 findings.

R12 confirms thirteen new controller-local root causes. Twelve are P1 correctness or ownership defects; one is a P2 final-notification evidence defect. The highest-risk failures are the unrestricted lock bypass, non-monotonic standalone heartbeat, incomplete stale takeover, unenforced child budgets, descendant escape, non-convergent restart, collision-prone run identity, archive-before-quiescence ordering, deletion of live scratch paths, and unversioned or stale shared archive publication.

No repository controller, Codex process, service, provider, account, credential, persistent database, Telegram endpoint, or live operation was contacted. All dynamic checks used inert temporary fixtures outside the extracted repository.

## Archive and executable-compatibility verdict

| Check | Result |
|---|---|
| Actual archive SHA-256 | `025936d21db89ac5cf4881863f05ec9ed5ddaaa2b4adfe60e766207fc4c9b9f7` |
| ZIP entries / regular files | `733 / 733` |
| Duplicate or unsafe paths | `0 / 0` |
| Symlinks or special members | `0 / 0` |
| Extraction path, size, and SHA-256 reconciliation | `PASS` |
| BWS120 baseline SHA-256 | `d4565c05ecfe63f5d5511f224a20ff20fb82bfc75b23203c94d7d3e98a8c21bb` |
| BWS120 → BWS121 | `+38 docs, 2 docs changed, 0 removed, 0 non-doc changes` |
| Package identity | `betting-win-surebet@0.1.0-bws-full-platform` |
| Canonical runtime | `Node 20.20.2` |
| Runtime actually available | `Node 22.16.0`, supplementary only |

The uploaded BWS121 filename did not arrive with a separately declared expected SHA-256. This review therefore records the independently computed current hash rather than pretending it was pre-authorized. Executable compatibility is exact against the handoff-frozen BWS120 baseline.

## Scope and method

Primary ownership included all root autonomous and autopilot controllers; `.automation/lib/run_common.sh`; controller hardening, temp/inode, and Telegram helpers; child-result and handoff routing; lock acquisition, heartbeat, stale recovery, force unlock, interruption, and restart; artifact run directories, cleanup, archive publication, and latest-evidence selection; and focused tests and validators.

The review used four layers: exact archive inventory and lineage comparison; static state-machine and call-path tracing; overlap screening against all 137 inherited findings; and nine bounded inert adversarial harnesses. Focused tests and validators were run only to measure what the existing assurance machinery detects. Passing checks were not treated as behavioral proof.

## Controller architecture and complete lifecycle model

### Controller families

1. **Standalone implementation/audit/paper controllers.** These use the shared `run_common.sh` lock, heartbeat, managed-command, cleanup, archive, and notification helpers. They may directly launch Codex, validation, or paper runtime work.
2. **Paper and bugfix parent autopilots.** These use an identity-rich parent lock, mtime heartbeat, exact child terminal-result side channel, global handoff files, per-round evidence, and one final parent notification.
3. **Shared lifecycle helpers.** These own PID identity, process-group termination, source fingerprints, temp/inode capacity, transient-artifact cleanup, ZIP validation/publication, and Telegram formatting/delivery logging.

### Intended state machine

```text
PARSE_AND_VALIDATE
  -> EXCLUSIVE_OWNER_ACQUIRED
  -> RUN_GENERATION_CREATED
  -> HEARTBEAT_ACTIVE
  -> CHILD_OR_CYCLE_RUNNING
  -> CHILD_TERMINAL_RESULT_VALIDATED
  -> HANDOFF_OR_CAMPAIGN_STATE_COMMITTED
  -> CHILD_GROUP_QUIESCENT
  -> TERMINAL_SUMMARY_AND_SNAPSHOT
  -> IMMUTABLE_ARTIFACT_GENERATION_PUBLISHED
  -> LOCK_RELEASED
  -> OPTIONAL_NOTIFICATION_RECEIPT
```

The current implementation violates this model in several places. Ownership can be skipped; heartbeat can roll back child state or fail silently; parent budget does not drive a timeout transition; leader exit is treated as group exit; restart maps unresolved state to a new campaign; standalone controllers package before child quiescence; cleanup can delete live work; and final publication uses one mutable singleton without generation currentness.

## Lock, lease, child, and interruption analysis

The parent lock design is materially stronger than the standalone lock: complete atomic claim, exact repository/script/PID identity, and mtime-only heartbeat avoid whole-file metadata rollback. The standalone lock retains a whole-file rewrite heartbeat and an explicit total bypass. Both families still lack supervised heartbeat failure and whole-group terminality. Parent child-result files authenticate transport identity and exit/run metadata, but the inherited R07 semantic-evidence gap remains: transport authentication does not prove the underlying campaign evidence.

Child deadlines are composed as configuration, not enforcement. The parent computes a remaining budget and passes it to the child, then waits without a parent timer. A child that hangs outside its own bounded command can exceed the parent campaign indefinitely. Interruption is also asymmetric: parents attempt child cleanup before packaging, while standalone finalization packages first and only later reaches child cleanup through lock release.

## Handoff, restart, and campaign finalization analysis

Global handoffs are schema-checked, hashed, and semantically fingerprinted. Those are useful safeguards. They do not form a crash-recoverable transaction with source mutation, child terminal result, parent ledger update, rounds append, handoff consumption, and archive publication. Every normal restart creates a new run, rotates prior handoffs, resets rounds and repeat guards, and in bugfix mode marks every campaign area pending again. There is no explicit resume/reconcile state.

This means an interruption cannot be classified from durable state as “safe to replay”, “already committed”, or “ambiguous”. It is simply routed into a fresh campaign. The resulting risk is duplicate implementation, lost return handoff, repeated audit, or bypassed repeat limits.

## Artifact, cleanup, inode, disk, and notification analysis

Artifact packaging includes strong containment, symlink rejection, candidate ZIP integrity, and atomic single-file rename. Those controls prevent common path escapes and partial final bytes. They do not prove generation ownership or currentness. Two valid publishers can both succeed, and the root singleton then identifies whichever writer ran last. On publication failure, the prior archive remains and default bugfix evidence intake prefers it over a newer run directory.

The transient cleanup allowlist is also not lifecycle-aware. Full packaging invokes destructive cleanup with zero minimum age and selects candidates by basename and mtime only. A live release/preflight/soak writer can therefore lose its directory while still active. Separately, the complete retained artifact tree is rebuilt on every full package. The resulting cumulative growth is retained as a manifestation of inherited `BWS120-R07-008`, not duplicated as a new R12 finding.

The temp/inode watchdog verifies the exact controller owner and persists bounded diagnostics before TERM, which is a safeguard. Its ability to produce a fully quiescent system still depends on the controller’s child-group shutdown path, where R12-006 and R12-009 apply.

Telegram remains correctly best effort. The defect is evidentiary: the send/skipped/failed result is written only after the last archive publication, so the retained archive cannot prove delivery outcome or message version for the final run.

## Confirmed findings summary

| ID | Severity | Title | Release blocker |
|---|---:|---|---:|
| `BWS121-R12-001` | P1 | Standalone controllers expose an unrestricted lock-bypass mode for source-affecting runs | yes |
| `BWS121-R12-002` | P1 | Standalone heartbeat refresh can overwrite newer active-child ownership metadata | yes |
| `BWS121-R12-003` | P1 | Heartbeat loss does not fence or stop the controller that owns the stale lock | yes |
| `BWS121-R12-004` | P1 | Standalone stale-lock takeover deletes ownership without verifying the recorded active child is gone | yes |
| `BWS121-R12-005` | P1 | Autopilot child duration is advisory because the parent waits without an enforcing deadline | yes |
| `BWS121-R12-006` | P1 | Child ownership is cleared when the leader exits even if descendants remain in its process group | yes |
| `BWS121-R12-007` | P1 | Autopilot restart creates a fresh campaign instead of reconciling and resuming durable progress | yes |
| `BWS121-R12-008` | P1 | Second-resolution artifact identities are non-exclusive and can merge or overwrite distinct controller runs | yes |
| `BWS121-R12-009` | P1 | Standalone finalization packages evidence before proving active children are quiescent | yes |
| `BWS121-R12-010` | P1 | Artifact cleanup can recursively delete a live operation solely because its basename is allowlisted | yes |
| `BWS121-R12-011` | P1 | Shared artifacts.zip publication is an unversioned last-writer-wins race | yes |
| `BWS121-R12-012` | P1 | Failed or incomplete final publication leaves a prior archive silently reusable as current evidence | yes |
| `BWS121-R12-013` | P2 | Telegram delivery outcome is produced after terminal artifact publication and is absent from retained evidence | no |

## Confirmed findings

### BWS121-R12-001 — Standalone controllers expose an unrestricted lock-bypass mode for source-affecting runs

**Severity:** P1
**Confidence:** HIGH
**Blocks:** release=yes, BWS-600=yes, B1=yes, deployment=yes

**Current source evidence**

- `run-autonomous-implementation.sh` `L98-L105, L135-L166, L1179-L1189` `usage / parse_args / controller startup` SHA-256 `cf373b5b75fdeeb4b7e83c9bdf2ce984e92a4ffecd85da6207481b479861d14a`. The public flag sets ALLOW_PARALLEL and skips automation_acquire_lock before creating a run and entering implementation work.
- `run-autonomous-bugfix.sh` `L90-L96, L123-L161, L915-L925` `usage / parse_args / controller startup` SHA-256 `fd3f9dcc110763c5ed88c1eba6bcb1ed1a94d4034b7757051b2fb6d1ab385a1b`. The audit controller accepts the same total lock bypass and continues into run creation and managed work.
- `run-paper-evaluation.sh` `L235-L253, L947-L957` `parse_args / controller startup` SHA-256 `d7d821119d51c3dd5bbcf7a80f0e98488ebd38f7d771310265939a918505e667`. The paper controller accepts an undocumented --allow-parallel flag and skips its standalone lock.
- `.automation/lib/run_common.sh` `L474-L529` `automation_acquire_lock` SHA-256 `d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619`. The skipped function is also where cross-controller incompatibility checks and atomic lock claiming occur.

**Preconditions**

- The operator or a parent process invokes a standalone controller with --allow-parallel.
- Another standalone or parent controller, or another lock-bypassed copy, is active in the same repository.

**Trigger:** Start two source-affecting controller invocations against the same repository while at least one uses --allow-parallel.

**Expected behavior:** Every source-affecting controller must have one non-bypassable repository owner. Any concurrency option must be limited to demonstrably read-only inspection that cannot write source, handoffs, locks, run directories, or the shared archive.

**Current behavior:** The flag bypasses both the controller-specific lock and the shared incompatible-controller guard, yet the process still creates run artifacts, executes validation or Codex paths, writes global handoffs, performs cleanup, and publishes artifacts.zip.

**Impact:** Two controllers can mutate or inspect a changing source tree concurrently, overwrite global handoffs, interleave validation and source fingerprints, clean each other’s artifacts, and race final archive publication. A completed controller can therefore certify a source generation it did not exclusively own.

**Evidence and reproduction**

- The three startup branches call automation_acquire_lock only when ALLOW_PARALLEL is zero.
- automation_acquire_lock contains automation_assert_no_incompatible_locks; skipping it skips both same-controller and cross-controller exclusion.
- The paper controller parses the bypass although its help text does not disclose it.
- Reproduction status: `STATIC_CONFIRMED`.

**State-machine analysis:** LOCK_ABSENT -> RUN_DIRECTORY_CREATED -> SOURCE_AFFECTING_WORK remains a valid path. There is no reduced capability state associated with ALLOW_PARALLEL, so the state machine loses its single-owner invariant before any source fingerprint, child launch, handoff, cleanup, or publication occurs.

**Root cause:** An operator-convenience switch is implemented as a total ownership bypass rather than a narrowly scoped, read-only concurrency capability.

**Minimal fix boundary:** Remove the bypass from source-affecting modes. If a concurrent inspection mode is required, give it a separate entrypoint with immutable source input, no global handoffs, no cleanup, no artifacts.zip publication, and no source-writing sandbox.

**Required tests**

- Two-process barrier test proving a second standalone controller fails before run-directory creation.
- Cross-controller matrix covering implementation, bugfix, paper evaluation, paper autopilot, and bugfix autopilot.
- Negative test that --allow-parallel is rejected for all source-affecting modes.
- Read-only inspection mode test, if introduced, proving no mutable repository path is opened.

**Regression risks**

- Removing the flag may affect undocumented operator workflows.
- Parent-launched child exceptions must continue through authenticated parent-lock contracts rather than a generic bypass.

**Dependencies/aliases:** `BWS118-R06-001`, `BWS120-R09-007`

**Secondary sectors:** R06, R09, R10, R11

**Explicitly unchanged**

- Authenticated parent-launched child exceptions remain supported.
- Status, print-config, and force-unlock operations remain available without starting a work run.
- No provider or live-execution capability is introduced.

### BWS121-R12-002 — Standalone heartbeat refresh can overwrite newer active-child ownership metadata

**Severity:** P1
**Confidence:** HIGH
**Blocks:** release=yes, BWS-600=yes, B1=yes, deployment=yes

**Current source evidence**

- `.automation/lib/run_common.sh` `L348-L387` `automation_write_lock_file / automation_refresh_lock_heartbeat` SHA-256 `d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619`. Heartbeat refresh reads the whole lock into a temporary file and replaces the pathname with no inode, generation, or compare-and-swap check.
- `.automation/lib/run_common.sh` `L562-L578` `automation_set_active_child / automation_clear_active_child` SHA-256 `d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619`. Child ownership changes independently rewrite the same whole lock file.

**Preconditions**

- A standalone controller owns a lock and its heartbeat worker is active.
- A managed child is started or cleared while the heartbeat worker holds an earlier lock snapshot.

**Trigger:** Interleave automation_refresh_lock_heartbeat between its read and mv with automation_set_active_child or automation_clear_active_child.

**Expected behavior:** Heartbeat must update only heartbeat authority, or perform an owner- and generation-checked compare-and-swap that cannot roll back any concurrently published child fields.

**Current behavior:** The heartbeat rewrites a stale full-file snapshot. Its final mv can erase a newly written ACTIVE_CHILD_* tuple or resurrect a child tuple that was already cleared.

**Impact:** The lock can claim no active child while a detached child is running, or claim an obsolete child after completion. Stop, stale-takeover, force-unlock, and finalization can then leak or signal the wrong work generation.

**Evidence and reproduction**

- Inert harness h01_heartbeat_overwrites_child_metadata captured a lock with child PID 1634 before refresh and an empty active_child_pid after the delayed heartbeat replacement.
- The parent autopilots avoid this specific race by using a validated mtime-only heartbeat; the defect is confined to the shared standalone lock implementation.
- Reproduction status: `REPRODUCED_OFFLINE` via `h01_heartbeat_overwrites_child_metadata`.

**State-machine analysis:** LOCK(parent, child=none) -> HEARTBEAT_READ -> CHILD_REGISTERED -> HEARTBEAT_REPLACE(stale child=none). The transition is non-monotonic because heartbeat publication is allowed to replace ownership state.

**Root cause:** Heartbeat and child ownership share one mutable whole-file record without serialization or a monotonic lock generation.

**Minimal fix boundary:** Use the hardened mtime-only heartbeat pattern or split heartbeat from ownership. If content must change, retain an immutable lock ID and compare inode plus digest/generation immediately before atomic replacement.

**Required tests**

- Deterministic two-writer barrier test for heartbeat versus child registration.
- Heartbeat versus child clear test proving no stale child resurrection.
- Repeated stress test under fixed and regressing clocks.
- Stale takeover test that consumes the resulting lock and proves exact child ownership.

**Regression risks**

- Changing lock schema requires compatibility handling for existing operator locks.
- A content-CAS loop must remain bounded and must not hide lost ownership.

**Dependencies/aliases:** `BWS118-R06-005`

**Secondary sectors:** R06, R11

**Explicitly unchanged**

- Parent-autopilot mtime heartbeat remains an intentional safeguard.
- Strict PID boot-ID and start-tick checks remain unchanged.

### BWS121-R12-003 — Heartbeat loss does not fence or stop the controller that owns the stale lock

**Severity:** P1
**Confidence:** HIGH
**Blocks:** release=yes, BWS-600=yes, B1=yes, deployment=yes

**Current source evidence**

- `.automation/lib/run_common.sh` `L531-L539` `automation_start_heartbeat` SHA-256 `d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619`. Standalone heartbeat refresh errors are suppressed indefinitely.
- `run-paper-autopilot.sh` `L491-L507` `start_parent_lock_heartbeat` SHA-256 `fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661`. The parent heartbeat process exits on refresh failure, but the main controller never waits for or monitors that process during the campaign.
- `run-bugfix-autopilot.sh` `L438-L454` `start_parent_lock_heartbeat` SHA-256 `e96b91399d507f223d4e8ce7c1d74a19597ef15fa21eb1bbf52a4b81408d97f8`. The bugfix parent has the same detached heartbeat-liveness model.

**Preconditions**

- A controller has acquired its lock.
- The lock disappears, becomes unwriteable, changes inode/ownership, or heartbeat validation otherwise fails.

**Trigger:** Cause a heartbeat refresh to fail while the main controller and a managed child continue running.

**Expected behavior:** Loss of the ownership heartbeat must synchronously transition the controller to a fenced terminal state, stop new work, terminate or drain owned children, and preserve evidence that ownership was lost.

**Current behavior:** Standalone controllers ignore every refresh failure. Parent heartbeat subprocesses terminate on failure, but the main loops do not check HEARTBEAT_PID or a shared failure state and continue work.

**Impact:** A live controller can become externally indistinguishable from a stale owner. A replacement can begin stale recovery against an active generation, producing overlapping work, forced termination, or ambiguous source and artifact ownership.

**Evidence and reproduction**

- No call site polls heartbeat subprocess liveness between acquisition and final stop.
- The standalone worker uses “|| true”, so even persistent ownership failure is silent.
- Focused repository tests assert the presence of heartbeat helpers but do not force heartbeat failure while work is active.
- Reproduction status: `STATIC_CONFIRMED`.

**State-machine analysis:** OWNED -> HEARTBEAT_FAILED should become FENCED. Instead it remains OWNED_IN_MEMORY while external ownership evidence ages into STALE. The state machine therefore permits two incompatible ownership views.

**Root cause:** Heartbeat is treated as a best-effort background side effect instead of a mandatory lease/fencing condition.

**Minimal fix boundary:** Add an error channel or supervised heartbeat task. The main loop must check it before and after every child transition and during waits, then execute one bounded fenced shutdown path.

**Required tests**

- Delete or replace the lock while a standalone managed command is active.
- Force parent heartbeat ownership validation failure during each autopilot child phase.
- Verify no new child starts after heartbeat loss.
- Verify lock-loss evidence and exact child cleanup on shutdown.

**Regression risks**

- Transient filesystem errors require an explicit bounded retry policy.
- Fencing must not allow an unverified process to delete a successor lock.

**Dependencies/aliases:** `BWS118-R06-005`

**Secondary sectors:** R06, R11

**Explicitly unchanged**

- Normal heartbeat intervals and lock-staleness thresholds remain configurable.
- No automatic takeover is authorized until ownership loss is proven.

### BWS121-R12-004 — Standalone stale-lock takeover deletes ownership without verifying the recorded active child is gone

**Severity:** P1
**Confidence:** HIGH
**Blocks:** release=yes, BWS-600=yes, B1=yes, deployment=yes

**Current source evidence**

- `.automation/lib/run_common.sh` `L474-L529` `automation_acquire_lock` SHA-256 `d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619`. Automatic stale recovery reads and terminates only the parent PID, then removes the lock; it does not load or verify ACTIVE_CHILD_*.
- `.automation/lib/run_common.sh` `L422-L470` `automation_force_unlock` SHA-256 `d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619`. The explicit force-unlock path demonstrates the stricter child-first behavior that automatic stale takeover omits.

**Preconditions**

- A standalone lock heartbeat is stale while the parent PID is still alive.
- The parent does not successfully clean its detached child during TERM handling, or exits before doing so.
- The lock contains a valid live ACTIVE_CHILD_* tuple.

**Trigger:** Start another standalone controller after the heartbeat threshold.

**Expected behavior:** Stale recovery must authenticate and drain the recorded child/process group before releasing or replacing ownership, and must fail closed if child termination cannot be proven.

**Current behavior:** The automatic path sends TERM only to the parent, waits for that PID, removes the lock, and claims a replacement. It never validates the child tuple or confirms the child process group is empty.

**Impact:** Detached work can survive with no owning lock while a replacement controller starts. The orphan can continue source writes, validation, file cleanup, or artifact publication against the new generation.

**Evidence and reproduction**

- Inert harness h02_stale_takeover_leaves_recorded_child produced a successful takeover with the parent dead and the recorded child still alive.
- The stricter explicit force-unlock path already terminates the child first, proving the missing step is localized to automatic stale recovery.
- Reproduction status: `REPRODUCED_OFFLINE` via `h02_stale_takeover_leaves_recorded_child`.

**State-machine analysis:** STALE_PARENT_WITH_LIVE_CHILD -> TERM_PARENT -> PARENT_DEAD -> LOCK_REMOVED -> NEW_OWNER, while OLD_CHILD remains live. This creates simultaneous generations with only one represented in the lock state.

**Root cause:** Automatic stale recovery assumes the stale owner’s signal trap will perform complete child cleanup instead of independently proving the durable lock’s recorded ownership graph.

**Minimal fix boundary:** Reuse one authenticated child-first recovery routine for both automatic and explicit takeover. Preserve the lock and block replacement if any recorded process group cannot be proven empty.

**Required tests**

- Stale parent that ignores TERM while child remains live.
- Parent exits immediately on TERM without child cleanup.
- Dead parent with live verified child.
- Mismatched child identity must preserve the lock and fail closed.

**Regression risks**

- Recovery must avoid signaling a reused PID.
- A child-first sequence must remain compatible with parent traps that also attempt cleanup.

**Dependencies/aliases:** `BWS118-R06-005`, `BWS118-R06-011`

**Secondary sectors:** R06, R11

**Explicitly unchanged**

- Fresh locks continue to block takeover.
- Explicit operator force-unlock remains identity-checked.

### BWS121-R12-005 — Autopilot child duration is advisory because the parent waits without an enforcing deadline

**Severity:** P1
**Confidence:** HIGH
**Blocks:** release=yes, BWS-600=yes, B1=yes, deployment=yes

**Current source evidence**

- `run-paper-autopilot.sh` `L842-L893` `run_child_controller` SHA-256 `fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661`. The parent computes a clamped budget, passes it as --duration, launches with setsid, and performs an unbounded wait on the child PID.
- `run-bugfix-autopilot.sh` `L792-L831` `run_child_controller` SHA-256 `e96b91399d507f223d4e8ce7c1d74a19597ef15fa21eb1bbf52a4b81408d97f8`. The bugfix parent has the same pass-budget-then-unbounded-wait behavior.

**Preconditions**

- A child ignores, misparses, or cannot honor --duration.
- The child hangs before reaching its own timeout wrapper, during finalization, or in a helper without an aggregate deadline.

**Trigger:** Run a child whose declared duration is shorter than its actual lifetime.

**Expected behavior:** The parent must enforce one aggregate monotonic deadline independently of child cooperation, terminate the exact child process group when it expires, and classify the result as timed out or unknown.

**Current behavior:** The parent merely passes the computed budget to the child and then waits indefinitely. The later checks for exit code 124 do not create a watchdog and cannot fire until the child returns.

**Impact:** A bounded parent campaign can exceed its advertised seven-day or 72-hour ceiling indefinitely, retain locks, suppress final evidence and notification, and block later recovery.

**Evidence and reproduction**

- Inert harness h03_child_budget_is_advisory used a declared 1,000 ms budget and observed 2,004 ms elapsed because the parent-side wait had no enforcement.
- No parent timer, timeout wrapper, wait loop, or heartbeat-loss check surrounds wait in either autopilot.
- Reproduction status: `REPRODUCED_OFFLINE` via `h03_child_budget_is_advisory`.

**State-machine analysis:** CHILD_RUNNING has no parent-driven transition to TIMED_OUT. Only CHILD_EXIT can advance the parent, so the parent deadline is not part of the actual state machine.

**Root cause:** Duration is modeled as a child configuration value rather than an independently enforced parent ownership deadline.

**Minimal fix boundary:** Wrap each child generation in a parent monotonic deadline, retain the process-group identity until drain, and reserve enough aggregate budget for termination, terminal-result reconciliation, lock release, and artifact finalization.

**Required tests**

- Child ignores --duration.
- Child hangs before its main loop.
- Child hangs during finalization after its work budget.
- Parent deadline expires during TERM/KILL grace.
- Clock regression test using monotonic time.

**Regression risks**

- An overly short reserve can terminate valid finalization and create ambiguous source state.
- Timeout classification must distinguish terminated, still-running, and unknown outcomes.

**Dependencies/aliases:** `BWS118-R06-006`

**Secondary sectors:** R06, R11

**Explicitly unchanged**

- Child-internal command timeouts remain useful secondary bounds.
- Configured campaign ceilings remain operator-selected maxima.

### BWS121-R12-006 — Child ownership is cleared when the leader exits even if descendants remain in its process group

**Severity:** P1
**Confidence:** HIGH
**Blocks:** release=yes, BWS-600=yes, B1=yes, deployment=yes

**Current source evidence**

- `run-paper-autopilot.sh` `L877-L893, L986-L1015` `run_child_controller / terminate_active_child` SHA-256 `fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661`. The parent clears ACTIVE_CHILD_* immediately after wait on the leader; cleanup returns success immediately when that PID is dead.
- `run-bugfix-autopilot.sh` `L823-L831` `run_child_controller` SHA-256 `e96b91399d507f223d4e8ce7c1d74a19597ef15fa21eb1bbf52a4b81408d97f8`. The bugfix parent also clears ownership immediately after leader wait.
- `.automation/lib/run_common.sh` `L601-L610` `automation_terminate_active_child` SHA-256 `d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619`. Standalone cleanup clears ownership without a group probe when the recorded leader PID is no longer alive.
- `.automation/lib/controller_hardening_v2.sh` `L1165-L1184` `automation_v2_terminate_process_group` SHA-256 `d67e2780d7968e5f25b0c7735486b140aa186708bbddda1b3d90cbb5f21f19a1`. Termination waits only for the leader PID and treats leader exit as group success.

**Preconditions**

- A setsid-launched child spawns a descendant in the same process group.
- The leader exits before the descendant.

**Trigger:** Allow the child leader to exit while a descendant remains alive.

**Expected behavior:** Ownership must retain a stable process-group or stronger containment identity and confirm the entire group is empty before clearing the lock tuple, accepting terminality, or packaging final evidence.

**Current behavior:** Leader death is used as the sole liveness predicate. Parent state is cleared and group termination returns success without checking whether the process group still contains descendants.

**Impact:** Unowned descendants can continue source, filesystem, subprocess, or network-capable work after the parent accepts child completion. Later force-unlock cannot discover them from the cleared lock.

**Evidence and reproduction**

- Inert harness h04_leader_exit_leaves_process_group observed leader_dead=yes, descendant_alive=yes, and process_group_alive=yes.
- Both parent controllers launch children with setsid, making process-group identity material rather than hypothetical.
- Reproduction status: `REPRODUCED_OFFLINE` via `h04_leader_exit_leaves_process_group`.

**State-machine analysis:** CHILD_GROUP_RUNNING -> LEADER_EXIT is incorrectly treated as CHILD_GROUP_TERMINAL. The descendant generation is omitted from both lock state and finalization.

**Root cause:** The controller conflates process-leader lifetime with process-group lifetime and does not retain an independently verifiable group/container identity.

**Minimal fix boundary:** Record PGID or use a dedicated cgroup/subreaper boundary. After leader exit, probe and drain the full owned group before clearing ownership or accepting the child result.

**Required tests**

- Leader exits after spawning one and multiple descendants.
- Descendant changes process state during group drain.
- TERM-resistant descendant requiring KILL.
- PID reuse while the original PGID still has members.

**Regression risks**

- Process-group probing must not signal unrelated processes after PGID reuse.
- A cgroup solution must remain portable to the supported operator environment.

**Dependencies/aliases:** `BWS118-R06-004`, `BWS118-R06-011`

**Secondary sectors:** R06, R11

**Explicitly unchanged**

- Exact leader PID boot-ID/start-tick validation remains required.
- Normal single-process children remain supported.

### BWS121-R12-007 — Autopilot restart creates a fresh campaign instead of reconciling and resuming durable progress

**Severity:** P1
**Confidence:** HIGH
**Blocks:** release=yes, BWS-600=yes, B1=yes, deployment=yes

**Current source evidence**

- `run-paper-autopilot.sh` `L569-L576, L1158-L1171, L1334-L1345` `rotate_stale_handoffs / main_loop / startup` SHA-256 `fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661`. Every invocation creates a new run, rotates global handoffs, truncates rounds.tsv, resets next_child to paper, and starts at round one.
- `run-bugfix-autopilot.sh` `L542-L571, L1176-L1189` `rotate_stale_handoffs / initialize_campaign_ledger / startup` SHA-256 `e96b91399d507f223d4e8ce7c1d74a19597ef15fa21eb1bbf52a4b81408d97f8`. Every invocation rotates handoffs and recreates all campaign areas as pending.
- `run-bugfix-autopilot.sh` `L873-L875` `update_bug_signature_repeat_guard` SHA-256 `e96b91399d507f223d4e8ce7c1d74a19597ef15fa21eb1bbf52a4b81408d97f8`. The repeated-handoff guard exists only in process memory and resets on restart.

**Preconditions**

- The parent is interrupted or crashes after a child changes source, writes a handoff, or advances a campaign area but before the parent commits all related artifacts and consumes the handoff.
- The operator restarts the same autopilot normally.

**Trigger:** Restart either autopilot after each externally visible child transition and parent bookkeeping boundary.

**Expected behavior:** Restart must bind to one immutable campaign ID, reconstruct the last committed transition from durable receipts, reconcile source and handoff state, and either resume exactly once or fail closed as ambiguous.

**Current behavior:** A new run is always created. Existing handoffs are moved aside as stale, rounds and campaign coverage restart from initial values, and in-memory repeat counters are lost. There is no --resume contract or recovery reconciliation.

**Impact:** Completed work can be repeated, an implementation return handoff can be discarded, a same-area re-audit can be skipped or restarted from the wrong phase, and the repeat guard can be bypassed by process restart.

**Evidence and reproduction**

- The paper loop hardcodes next_child=paper on every process start.
- The bugfix ledger writes every area as pending before inspecting prior campaign evidence.
- No persistent campaign generation or committed transition pointer is consumed during startup.
- Reproduction status: `STATIC_STATE_MACHINE_CONFIRMED`.

**State-machine analysis:** Child side effects and parent phase advancement are separate commits. A crash between them yields AMBIGUOUS, but startup maps every prior state to NEW_CAMPAIGN. That mapping is neither idempotent nor convergent.

**Root cause:** Campaign progress, repeat guards, and handoff consumption are run-local files rather than one durable, generation-bound restart protocol.

**Minimal fix boundary:** Add immutable campaign identity, append-only transition receipts, exact source/handoff digests, and an explicit resume/reconcile command. New campaigns must not silently consume or rotate unresolved prior-generation state.

**Required tests**

- Crash after child source mutation before terminal-result publication.
- Crash after terminal result before handoff copy/consume.
- Crash after campaign ledger update before rounds append and vice versa.
- Restart with conflicting source fingerprint or handoff generation.
- Repeat-limit persistence across restart.

**Regression risks**

- Migration of historical run directories requires a conservative non-resumable classification.
- Resume logic must not trust mutable latest pointers or status labels alone.

**Dependencies/aliases:** `BWS120-R07-014`, `BWS120-R07-016`

**Secondary sectors:** R03, R06, R07, R11

**Explicitly unchanged**

- Starting an explicitly new campaign remains possible through a separate, deliberate action.
- Historical artifacts remain read-only evidence and are not retroactively rewritten.

### BWS121-R12-008 — Second-resolution artifact identities are non-exclusive and can merge or overwrite distinct controller runs

**Severity:** P1
**Confidence:** HIGH
**Blocks:** release=yes, BWS-600=yes, B1=yes, deployment=yes

**Current source evidence**

- `.automation/lib/run_common.sh` `L646-L672` `automation_create_run_dir` SHA-256 `d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619`. Run identity is slug plus UTC seconds, mkdir -p accepts an existing path, and controller.log is truncated unconditionally.
- `.automation/lib/run_common.sh` `L389-L395` `automation_quarantine_lock` SHA-256 `d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619`. Quarantined lock evidence also uses a second-resolution destination with no no-replace primitive.
- `run-paper-autopilot.sh` `L569-L576` `rotate_stale_handoffs` SHA-256 `fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661`. Stale handoff destinations use basename plus UTC seconds and ordinary mv.
- `run-bugfix-autopilot.sh` `L542-L549` `rotate_stale_handoffs` SHA-256 `e96b91399d507f223d4e8ce7c1d74a19597ef15fa21eb1bbf52a4b81408d97f8`. The bugfix parent has the same overwrite-prone handoff identity.

**Preconditions**

- Two lock-bypassed runs, two fast restarts, or two evidence rotations use the same slug/basename within one second.

**Trigger:** Create two same-slug run directories or rotate the same evidence name under a fixed second.

**Expected behavior:** Every run and rotated evidence object must have a collision-resistant immutable ID and be created with exclusive no-replace semantics.

**Current behavior:** Distinct generations resolve to the same pathname. Run creation reuses it and truncates controller.log; ordinary mv can replace an earlier same-second destination.

**Impact:** Evidence from separate controller generations can be interleaved, truncated, or overwritten. Final summaries, child results, cleanup decisions, progress tools, and artifacts.zip can then attribute data to the wrong run.

**Evidence and reproduction**

- Inert harness h05_run_directory_collision called the run-directory constructor twice under one fixed second; both returned the same path and the second call truncated the first log.
- This is the same design anti-pattern as inherited BWS118-R06-016, but in separate R12 controller artifact code and with a separate fix boundary.
- Reproduction status: `REPRODUCED_OFFLINE` via `h05_run_directory_collision`.

**State-machine analysis:** RUN_ID is derived from low-cardinality wall-clock text and is not reserved. CREATE(new generation) can therefore transition into REUSE(existing generation) without detection.

**Root cause:** Timestamp is used as uniqueness authority rather than metadata attached to an exclusive generation identifier.

**Minimal fix boundary:** Use a cryptographically random or monotonic generation ID, mkdir without -p for the final run path, no-replace rename/link semantics for rotated evidence, and a manifest that binds timestamp to generation.

**Required tests**

- Fixed-clock concurrent run creation.
- Immediate restart in the same second.
- Same-second quarantine and stale-handoff rotation.
- Collision must fail without modifying either existing object.

**Regression risks**

- Progress and operator tooling must learn the new generation format.
- Do not replace one collision-prone timestamp with a process-local counter that resets after restart.

**Dependencies/aliases:** `BWS118-R06-016`

**Secondary sectors:** R06, R07, R11

**Explicitly unchanged**

- Human-readable timestamps remain available as metadata.
- Existing run directories remain immutable historical evidence.

### BWS121-R12-009 — Standalone finalization packages evidence before proving active children are quiescent

**Severity:** P1
**Confidence:** HIGH
**Blocks:** release=yes, BWS-600=yes, B1=yes, deployment=yes

**Current source evidence**

- `run-autonomous-implementation.sh` `L1020-L1054, L1088-L1139, L1152-L1164` `finish / on_signal` SHA-256 `cf373b5b75fdeeb4b7e83c9bdf2ce984e92a4ffecd85da6207481b479861d14a`. The initial snapshot and archive build precede lock release; lock release is where shared cleanup terminates the active child. The signal helper sends TERM to shell jobs but does not prove group quiescence before packaging.
- `run-autonomous-bugfix.sh` `L713-L797` `finish / on_signal` SHA-256 `fd3f9dcc110763c5ed88c1eba6bcb1ed1a94d4034b7757051b2fb6d1ab385a1b`. The audit controller builds artifacts before attempting final lock release; its signal handler does not pre-clean the managed child.
- `run-paper-evaluation.sh` `L696-L790` `finish / on_signal` SHA-256 `d7d821119d51c3dd5bbcf7a80f0e98488ebd38f7d771310265939a918505e667`. The paper controller has the same archive-before-release ordering and a signal handler that only exits.
- `.automation/lib/run_common.sh` `L542-L559` `automation_release_lock` SHA-256 `d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619`. Active-child termination is deferred until lock release, after the first final snapshot and archive build.

**Preconditions**

- A standalone controller receives INT/TERM or exits unexpectedly while a managed child is active.
- The child continues writing its log, source, handoff, or artifact paths during finalization.

**Trigger:** Interrupt a standalone controller while its managed child is still producing output.

**Expected behavior:** Finalization must first fence new work, terminate/drain the exact child group, reconcile ambiguous side effects, and only then snapshot, summarize, and publish terminal artifacts.

**Current behavior:** The first final summary, repository snapshot, and artifacts.zip are produced before active-child cleanup occurs through lock release. A late child can modify the very tree being archived or write after publication.

**Impact:** The published “final” archive can be incomplete or internally inconsistent, while the child may continue source or evidence effects after the controller has recorded terminal status.

**Evidence and reproduction**

- The three finish functions share the same ordering.
- The parent autopilots explicitly terminate_active_child before packaging, so the defect is confined to standalone finalization and is not an inherited parent-finalization symptom.
- Harness h04 demonstrates why waiting only on a leader is also insufficient once cleanup is moved earlier.
- Reproduction status: `STATIC_STATE_MACHINE_CONFIRMED`.

**State-machine analysis:** INTERRUPT/UNEXPECTED_EXIT -> SNAPSHOT/PACKAGE -> CHILD_TERMINATION is the reverse of a safe terminal protocol. Publication occurs while the generation can still change.

**Root cause:** Standalone finalization treats lock release as ownership bookkeeping rather than the child-quiescence boundary that must precede terminal evidence.

**Minimal fix boundary:** Introduce one shared standalone shutdown routine: mark fenced, supervise/terminate the group, confirm drain, reconcile source and handoff state, then write terminal evidence and publish once.

**Required tests**

- INT during Codex execution while the child writes a run log.
- TERM during validation with a descendant process.
- Child ignores TERM and requires KILL.
- Artifact build must observe a stable source and run-directory digest after cleanup.

**Regression risks**

- Moving cleanup earlier must preserve diagnostic logs and ambiguous-side-effect evidence.
- Signal handling must remain reentrant-safe and execute finalization exactly once.

**Dependencies/aliases:** `BWS118-R06-015`

**Secondary sectors:** R06, R07, R11

**Explicitly unchanged**

- Parent autopilots keep their child-before-package ordering.
- Lock-release failure remains a blocked terminal state.

### BWS121-R12-010 — Artifact cleanup can recursively delete a live operation solely because its basename is allowlisted

**Severity:** P1
**Confidence:** HIGH
**Blocks:** release=yes, BWS-600=yes, B1=yes, deployment=yes

**Current source evidence**

- `.automation/lib/run_common.sh` `L987-L1099` `automation_artifact_residue_name_is_transient / automation_cleanup_transient_artifact_residue` SHA-256 `d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619`. Selection uses basename and age, then rm -rf, with no owner, lock, generation, open-process, or mutation revalidation.
- `.automation/lib/controller_hardening_v2.sh` `L1187-L1206` `automation_v2_zip_with_timeout` SHA-256 `d67e2780d7968e5f25b0c7735486b140aa186708bbddda1b3d90cbb5f21f19a1`. Full artifact packaging invokes cleanup in apply mode with a default minimum age of zero.
- `.automation/lib/run_common.sh` `L1351-L1375` `automation_build_artifacts_zip` SHA-256 `d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619`. Standalone full packaging also invokes cleanup apply 0 before zipping.

**Preconditions**

- A release/test/runtime helper is actively writing a top-level artifacts path whose basename matches the transient allowlist.
- Another controller or cleanup command begins packaging or explicit cleanup.

**Trigger:** Package artifacts while a writer remains active in an allowlisted path such as bws-release-package-live.

**Expected behavior:** Cleanup must prove a candidate belongs to a completed disposable generation and remains unchanged and unowned from selection through deletion.

**Current behavior:** The helper accepts the path based only on canonical containment, name pattern, and mtime threshold. Packaging uses threshold zero and recursively removes the selected directory without checking a lock, owner marker, PID identity, or second stat/digest.

**Impact:** Active release, preflight, service, soak, or test output can be deleted mid-write. The producing operation may then fail, recreate a partial path, or publish evidence that no longer matches what another controller archived.

**Evidence and reproduction**

- Inert harness h06_cleanup_deletes_live_named_directory kept a writer process alive while packaging cleanup removed its allowlisted directory.
- The retention document describes these names as scratch classes but does not provide a durable completed-generation receipt for deletion.
- Reproduction status: `REPRODUCED_OFFLINE` via `h06_cleanup_deletes_live_named_directory`.

**State-machine analysis:** LIVE_SCRATCH -> SELECTED_BY_NAME -> DELETED is permitted. There is no transition through COMPLETED, UNOWNED, and STABLE before deletion.

**Root cause:** Residue class is inferred from pathname rather than authenticated lifecycle ownership and terminality.

**Minimal fix boundary:** Require immutable owner/generation metadata, terminal receipt, no-live-owner proof, minimum quiescence, and pre-delete inode/digest revalidation. Packaging should not perform destructive cleanup implicitly unless those proofs pass.

**Required tests**

- Live writer with an allowlisted basename.
- Candidate becomes live after scan but before deletion.
- PID reuse and stale owner marker.
- Completed scratch generation cleanup and archive rebuild happy path.

**Regression risks**

- Stricter cleanup may leave more residue and needs an explicit operator-visible plan.
- Owner metadata itself must be protected from spoofing and stale reuse.

**Dependencies/aliases:** `BWS120-R07-008`, `BWS120-R09-004`

**Secondary sectors:** R07, R08, R09, R11

**Explicitly unchanged**

- Canonical containment and no-symlink checks remain mandatory.
- Unknown names continue to be preserved rather than deleted.

### BWS121-R12-011 — Shared artifacts.zip publication is an unversioned last-writer-wins race

**Severity:** P1
**Confidence:** HIGH
**Blocks:** release=yes, BWS-600=yes, B1=yes, deployment=yes

**Current source evidence**

- `.automation/lib/run_common.sh` `L1268-L1327` `automation_publish_final_artifacts_zip` SHA-256 `d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619`. A validated candidate is moved over one shared destination with no publication lock, expected generation, or compare-and-swap.
- `run-paper-autopilot.sh` `L1091-L1117` `finish` SHA-256 `fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661`. The parent releases its controller lock before refreshing the shared archive.
- `run-bugfix-autopilot.sh` `L994-L1020` `finish` SHA-256 `e96b91399d507f223d4e8ce7c1d74a19597ef15fa21eb1bbf52a4b81408d97f8`. The bugfix parent also publishes its final refresh after lock release.

**Preconditions**

- Two controller generations or an operator cleanup/package command prepare archives concurrently.
- Both candidates pass local ZIP validation.

**Trigger:** Publish both candidates to repository-root artifacts.zip with overlapping final mv operations.

**Expected behavior:** Each final archive must have an immutable generation path. Any mutable “latest” pointer must advance through a serialized compare-and-set bound to the expected previous and new generation receipts.

**Current behavior:** Both publishers can succeed. The later mv silently replaces the earlier archive, even after the earlier controller already reported finalization. Controller locks do not cover every final publication window.

**Impact:** The root archive can represent an arbitrary controller generation. Operators, bugfix evidence intake, handoffs, and downstream packaging cannot prove which terminal result it belongs to.

**Evidence and reproduction**

- Inert harness h07_shared_artifacts_publication_last_writer_wins ran two concurrent publishers; both succeeded and the final archive contained only one arbitrary generation.
- Atomic rename prevents partial bytes but does not provide generation serialization or correct currentness.
- Reproduction status: `REPRODUCED_OFFLINE` via `h07_shared_artifacts_publication_last_writer_wins`.

**State-machine analysis:** CANDIDATE_A_VALID + CANDIDATE_B_VALID -> PUBLISH_A -> PUBLISH_B. Both transitions report success, but A’s terminal evidence is no longer reachable through the shared path.

**Root cause:** Atomic file replacement is incorrectly treated as an atomic publication protocol across generations.

**Minimal fix boundary:** Publish immutable generation-named archives with manifests, then update a small latest receipt under one repository-scoped publication lock/CAS. Controllers must report their immutable archive ID, not only the shared path.

**Required tests**

- Two-process publication barrier with distinct manifests.
- Publisher crash before and after immutable archive creation.
- Latest-pointer CAS conflict and deterministic loser behavior.
- Controller output remains bound to its archive after later publications.

**Regression risks**

- Consumers that assume a fixed artifacts.zip path require migration.
- Publication locking must not reuse controller ownership in a way that deadlocks finalization.

**Dependencies/aliases:** `BWS120-R07-003`, `BWS120-R09-004`

**Secondary sectors:** R07, R09, R11, R24

**Explicitly unchanged**

- Candidate ZIP integrity and symlink checks remain unchanged.
- Historical archives become more, not less, immutable.

### BWS121-R12-012 — Failed or incomplete final publication leaves a prior archive silently reusable as current evidence

**Severity:** P1
**Confidence:** HIGH
**Blocks:** release=yes, BWS-600=yes, B1=yes, deployment=yes

**Current source evidence**

- `.automation/lib/run_common.sh` `L1351-L1397` `automation_build_artifacts_zip / automation_latest_evidence_hint` SHA-256 `d08ac2827b16df86f0f86fbceb9e5677c72d38ba9853fd67570e87c95bcab619`. A failed build leaves the prior root archive untouched, while latest-evidence selection returns any existing artifacts.zip without generation or content validation.
- `run-autonomous-bugfix.sh` `L280-L286` `resolve_artifact_hint` SHA-256 `fd3f9dcc110763c5ed88c1eba6bcb1ed1a94d4034b7757051b2fb6d1ab385a1b`. The audit controller automatically consumes that singleton archive when --from-artifacts is not supplied.
- `run-autonomous-implementation.sh` `L1112-L1132` `finish` SHA-256 `cf373b5b75fdeeb4b7e83c9bdf2ce984e92a4ffecd85da6207481b479861d14a`. If final refresh and rebuild fail, terminal status is changed and final_summary is rewritten after the last successful archive, with no successful publication of the corrected state.
- `run-bugfix-autopilot.sh` `L1015-L1035` `finish` SHA-256 `e96b91399d507f223d4e8ce7c1d74a19597ef15fa21eb1bbf52a4b81408d97f8`. The parent has the same blocked-summary-after-last-successful-archive outcome on final publication failure.

**Preconditions**

- A previously valid artifacts.zip exists.
- A newer controller run exists but its final refresh/build fails, or has not yet been incorporated.
- A later audit uses the default evidence hint.

**Trigger:** Fail the current final publication and start a bugfix audit without an explicit evidence generation.

**Expected behavior:** Publication failure must leave an explicit tombstone/failed-generation receipt, and no consumer may infer currentness from the existence of an older singleton archive.

**Current behavior:** The old archive remains in place and is returned preferentially over newer run directories. Final blocked status may exist only in the filesystem outside the archive that is still presented as latest.

**Impact:** A later audit can reason from stale evidence while believing it is current. Operators can download an archive whose summary predates the controller’s actual blocked exit and lock-release outcome.

**Evidence and reproduction**

- Inert harness h09_stale_shared_archive_preempts_newer_run created a newer completed run directory and an older archive; automation_latest_evidence_hint selected the old archive, which did not contain the newer run.
- The singleton destination is deliberately preserved on candidate failure, which is safe for bytes but unsafe when consumers treat existence as current authority.
- Reproduction status: `REPRODUCED_OFFLINE` via `h09_stale_shared_archive_preempts_newer_run`.

**State-machine analysis:** NEW_RUN_TERMINAL -> PUBLICATION_FAILED leaves LATEST_POINTER=OLD_SUCCESS. The next consumer maps OLD_SUCCESS to CURRENT_EVIDENCE without a generation comparison.

**Root cause:** Archive durability and archive currentness are conflated; there is no generation-bound publication receipt or failed-publication state.

**Minimal fix boundary:** Separate immutable archives from current-generation receipts. On failure, publish a small failure receipt bound to the run, and require consumers to select an explicit accepted generation whose manifest contains the referenced terminal result.

**Required tests**

- Old success archive plus new failed publication.
- Newer run directory absent from archive.
- Corrected blocked final summary written after last successful ZIP.
- Default evidence intake must reject ambiguous or stale singleton state.

**Regression risks**

- Do not delete the last known-good archive; mark it historical rather than current.
- Legacy consumers need an explicit compatibility error, not a silent fallback.

**Dependencies/aliases:** `BWS120-R07-005`, `BWS120-R07-014`, `BWS120-R09-004`

**Secondary sectors:** R07, R09, R11

**Explicitly unchanged**

- Atomic candidate validation remains required.
- Operators may still explicitly select a historical archive for historical review.

### BWS121-R12-013 — Telegram delivery outcome is produced after terminal artifact publication and is absent from retained evidence

**Severity:** P2
**Confidence:** HIGH
**Blocks:** release=no, BWS-600=no, B1=no, deployment=no

**Current source evidence**

- `.automation/lib/telegram_notify.sh` `L218-L295` `telegram_notify_send_final` SHA-256 `bae37f227389b264cefea86f1792d3642bc9393f0076408f680c02040a120e23`. The helper marks the notification as sent before configuration/network work, records sent/skipped/failed text only in the supplied log, and always returns success.
- `run-paper-autopilot.sh` `L1076-L1138` `finish` SHA-256 `fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661`. The parent builds and refreshes artifacts.zip before invoking the Telegram helper.
- `run-bugfix-autopilot.sh` `L979-L1041` `finish` SHA-256 `e96b91399d507f223d4e8ce7c1d74a19597ef15fa21eb1bbf52a4b81408d97f8`. The bugfix parent has the same post-publication notification ordering.
- `run-autonomous-bugfix.sh` `L727-L784` `finish` SHA-256 `fd3f9dcc110763c5ed88c1eba6bcb1ed1a94d4034b7757051b2fb6d1ab385a1b`. Standalone audit finalization also publishes before notification status is written.

**Preconditions**

- Final artifact publication succeeds.
- Telegram is enabled, disabled, missing configuration, times out, or receives a non-2xx response.

**Trigger:** Complete any controller finalization and inspect the already published archive for its notification result.

**Expected behavior:** Telegram may remain best effort, but the exact sent/skipped/failed outcome must be retained in generation-bound terminal evidence or a separately linked immutable delivery receipt.

**Current behavior:** Notification is attempted only after the final archive build/refresh. Its outcome is appended to a log outside the already published archive; no later refresh occurs. The one-shot flag is set before the attempt and failures still return zero.

**Impact:** The retained campaign package cannot prove whether the promised parent-final notification was delivered, skipped, or failed, and a transient failure cannot be retried within the same process through the helper.

**Evidence and reproduction**

- Inert harness h08_telegram_result_created_after_archive created an archive, then wrote the dry-run notification result; the archive did not contain that result.
- Repository documentation explicitly allows Telegram failure not to fail the controller; this finding does not challenge that policy, only the missing delivery evidence and ordering.
- Reproduction status: `REPRODUCED_OFFLINE` via `h08_telegram_result_created_after_archive`.

**State-machine analysis:** TERMINAL_ARCHIVE_PUBLISHED -> NOTIFICATION_ATTEMPTED -> DELIVERY_RESULT_WRITTEN. The delivery transition is outside the retained terminal generation and has no linked receipt.

**Root cause:** Notification delivery is treated as an unretained log side effect rather than a best-effort sub-state of campaign finalization.

**Minimal fix boundary:** Write a bounded notification-attempt receipt before publication when dry-run/config status is known, or publish a separate immutable delivery receipt linked by run/archive generation after the attempt. Preserve controller success semantics for notification failure.

**Required tests**

- Sent, skipped-disabled, skipped-missing-config, timeout, and HTTP failure receipts.
- Archive or linked receipt proves the exact message version and final run ID.
- Retry policy does not send duplicate successful notifications.

**Regression risks**

- Moving a live network attempt before archive publication must not make campaign finalization depend on Telegram.
- Receipt content must redact token, chat ID, and response secrets.

**Dependencies/aliases:** `BWS120-R07-012`

**Secondary sectors:** R07, R11

**Explicitly unchanged**

- Telegram remains best effort and does not authorize or block business operations.
- Child notifications remain suppressed under parent controllers.

## Hypothesis and environment blockers

- **BWS121-R12-HYP-001 — Parent-lock release has a path-replacement window after ownership validation**. The race window is narrow and no production controller was executed or instrumented during this read-only review. Required proof: A deterministic barrier showing a successor lock can be installed between validation and rm and then removed by the prior owner.
- **BWS121-R12-EB-001 — Canonical Node 20.20.2 runtime unavailable**. The environment provided Node 22.16.0. Focused tests are supplementary and are not canonical acceptance.
- **BWS121-R12-EB-002 — Controller, Codex, service, provider, database, and Telegram network execution prohibited**. No repository controller, implementation agent, service, provider, credential, persistent database, or Telegram endpoint was invoked. Dynamic evidence uses inert external harnesses only.
- **BWS121-R12-EB-003 — shellcheck and psql unavailable**. Shell syntax was checked with bash -n; PostgreSQL was not needed for R12 and no database was contacted.

## Intentional safeguards and rejected suspicions

### Safeguards

- **BWS121-R12-SG-001 — Parent autopilots use atomic complete lock claims and mtime-only heartbeat refresh**
- **BWS121-R12-SG-002 — Parent child-result side channel validates exact parent, child, exit, repository, and run identity**
- **BWS121-R12-SG-003 — Parent finalization terminates the recorded active child before packaging and preserves the lock on failure**
- **BWS121-R12-SG-004 — ZIP publication validates candidate integrity and rejects artifact-tree symlinks**
- **BWS121-R12-SG-005 — Temp/inode watchdog signals only an exact authenticated owner and persists bounded diagnostics**

### Rejected suspicions

- **BWS121-R12-RS-001 — Parent heartbeat erases ACTIVE_CHILD metadata**. Rejected for paper and bugfix autopilots: their heartbeat touches only mtime under strict ownership validation. The confirmed whole-file rewrite race is limited to standalone run_common locking.
- **BWS121-R12-RS-002 — Parent autopilots package before child cleanup**. Rejected: both parent finish paths call terminate_active_child before the first final snapshot and ZIP build. The ordering defect is confined to standalone controllers.
- **BWS121-R12-RS-003 — Telegram delivery failure should fail an otherwise valid controller run**. Rejected as contrary to the documented best-effort policy. The confirmed defect is missing retained delivery evidence, not controller success classification.
- **BWS121-R12-RS-004 — artifacts.zip can expose a partially written ZIP through the final pathname**. Rejected for ordinary single publication: candidates are built separately, integrity-checked, then atomically renamed. The confirmed defects concern generation races and stale currentness, not partial final bytes.

## Cross-area handoffs

- **BWS121-R12-HO-001 — Campaign manifest and semantic child-evidence authentication remain inherited R07 roots**. Target: `R07`. Existing authority: `BWS120-R07-015`, `BWS120-R07-016`. R12 traced child-result transport and controller consumption but did not reissue the existing lack of campaign-manifest consumption or evidence-receipt proof as controller findings.
- **BWS121-R12-HO-002 — Canonical evidence indexing, retention, currentness, and generic publication remain inherited roots**. Target: `R07/R09`. Existing authority: `BWS120-R07-003`, `BWS120-R07-004`, `BWS120-R07-005`, `BWS120-R07-008`, `BWS120-R07-012`, `BWS120-R07-014`, `BWS120-R09-004`. R12 findings are limited to controller-owned lock, cleanup, singleton archive, and finalization protocols. Generic evidence-index and release-publisher defects retain their existing IDs.
- **BWS121-R12-HO-003 — Soak, failure-injection, promotion, recovery, and final-acceptance semantics remain inherited R09 roots**. Target: `R09`. Existing authority: `BWS120-R09-012`, `BWS120-R09-013`, `BWS120-R09-014`, `BWS120-R09-015`, `BWS120-R09-016`, `BWS120-R09-017`, `BWS120-R09-018`, `BWS120-R09-019`, `BWS120-R09-020`, `BWS120-R09-021`. Controllers can route those operations, but R12 did not duplicate the underlying soak or promotion defects.
- **BWS121-R12-HO-004 — Source-manifest and aggregate false-green assurance remain R11-owned**. Target: `R11`. Existing authority: `KNOWN_BASELINE_MANIFEST_DRIFT`. The current R12-focused validators and tests passed despite the confirmed controller defects; R11 must evaluate aggregate assurance and the known manifest drift.
- **BWS121-R12-HO-005 — Unbounded cumulative retained-artifact growth is an R12 manifestation of inherited retention absence**. Target: `R07`. Existing authority: `BWS120-R07-008`. Every final build zips the complete retained artifacts tree. The resulting cumulative time/disk growth is recorded as an R07 retention manifestation, not a new R12 root cause.

## Test and validator gaps

The focused test set passed 74 of 74 tests under supplementary Node 22.16.0, and all four selected Python validators passed. Much of this assurance is source-marker, schema-shape, or sequential fixture testing. It proves that helpers and contract strings exist, not that adversarial interprocess ordering is safe.

- **BWS121-R12-TG-001**: No two-process test rejects --allow-parallel source-affecting concurrency before run creation Related: `BWS121-R12-001`.
- **BWS121-R12-TG-002**: No barrier test interleaves standalone heartbeat replacement with active-child registration Related: `BWS121-R12-002`.
- **BWS121-R12-TG-003**: No test forces heartbeat failure and proves the main controller fences itself Related: `BWS121-R12-003`.
- **BWS121-R12-TG-004**: No stale-takeover test retains a live recorded child after parent exit Related: `BWS121-R12-004`.
- **BWS121-R12-TG-005**: No child that ignores --duration is used to test parent deadline enforcement Related: `BWS121-R12-005`.
- **BWS121-R12-TG-006**: No leader-exit/descendant-survival process-group test exists Related: `BWS121-R12-006`.
- **BWS121-R12-TG-007**: No crash matrix reconstructs autopilot state from durable artifacts across every commit boundary Related: `BWS121-R12-007`.
- **BWS121-R12-TG-008**: No fixed-clock exclusive-creation test covers run, quarantine, and stale-handoff identities Related: `BWS121-R12-008`.
- **BWS121-R12-TG-009**: No signal-during-child-write test checks standalone final archive stability Related: `BWS121-R12-009`.
- **BWS121-R12-TG-010**: No live-owner cleanup test prevents deletion of allowlisted active residue Related: `BWS121-R12-010`.
- **BWS121-R12-TG-011**: No concurrent shared-archive publisher or stale-generation consumer test exists Related: `BWS121-R12-011`, `BWS121-R12-012`.
- **BWS121-R12-TG-012**: No test proves final notification outcome is present in or linked to retained terminal evidence Related: `BWS121-R12-013`.

## Prioritized review-only remediation order

1. Remove the total lock bypass and establish one non-bypassable ownership model (`R12-001`).
2. Make heartbeat, stale takeover, and process-group ownership monotonic and self-fencing (`R12-002` through `R12-006`).
3. Add durable campaign generation, transition receipts, and restart reconciliation (`R12-007`).
4. Replace timestamp identities with exclusive generation IDs and fix standalone terminal ordering (`R12-008`, `R12-009`).
5. Make cleanup ownership-aware and non-destructive to live generations (`R12-010`).
6. Introduce immutable archive generations, serialized latest receipts, and failed-publication currentness (`R12-011`, `R12-012`).
7. Retain a redacted linked Telegram delivery receipt without changing best-effort controller semantics (`R12-013`).
8. After R12 source remediation, rerun R11 assurance review because current validators passed while all thirteen defects remained reachable.

## Explicit unchanged areas and attestations

- No application source, test source, migration, schema, documentation, configuration, manifest, or archive member was modified.
- The extracted tree reconciled to all 733 original member hashes after review.
- No implementation prompt, overlay, patch, server command, commit, push, pull, branch operation, or dependency installation was produced.
- No controller, Codex agent, service, provider, external API, account, credential, persistent database, signer, wallet, order, payment, or live operation was invoked.
- BWS-600 remains externally blocked; BWS-710/B1 remains blocked on accepted upstream authority; BWS-900 remains parked and unauthorized.
- Existing 137 finding IDs remain stable. No inherited root cause was duplicated under an R12 ID.
