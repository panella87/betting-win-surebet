# Repository temporary-file and inode safety

## Incident and root cause

The automation must treat filesystem byte capacity and inode capacity as separate hard limits. A filesystem can retain substantial free byte capacity while being unable to create Git locks, logs, directories, or database files because no inodes remain.

The confirmed repository leak was in `tests/bws-paper-runtime-evidence.test.ts`. Each test created a `bws-paper-runtime-evidence-*` directory through `mkdtempSync()` and did not register teardown. Repeated autonomous validation retained complete temporary repository trees under the process temp directory. The fixture now registers `t.after()` cleanup with recursive, retry-bounded `rmSync()` so success, assertion failure, and thrown exceptions all remove the directory.

## Managed lifecycle

Every real root-controller run initializes the shared guard through `.automation/lib/run_common.sh` before its durable artifact directory is created. The five covered entrypoints are:

```text
run-autonomous-implementation.sh
run-autonomous-bugfix.sh
run-paper-evaluation.sh
run-paper-autopilot.sh
run-bugfix-autopilot.sh
```

The default managed base is:

```text
<repo>/.automation/tmp
```

Each controller receives one private directory under:

```text
<repo>/.automation/tmp/sessions/bws-automation-<controller>.<UTC>.<pid>.<nonce>/
```

The guard exports:

```text
AUTOMATION_TEMP_BASE
AUTOMATION_TEMP_SESSION_ROOT
AUTOMATION_RUN_TMPDIR
AUTOMATION_TEMP_OWNER_PID
AUTOMATION_TEMP_OWNER_START_TICKS
AUTOMATION_TEMP_WATCHDOG_PID
TMPDIR
TMP
TEMP
```

A child controller inherited from an autopilot compares the inherited owner PID with its own PID. It creates a distinct child-owned session under the same managed base instead of reusing the parent session.

## Ownership metadata

Each session contains one `.automation-temp-session.env` marker with:

```text
schema_version
repository_id
repository_realpath
controller
owner_pid
owner_start_ticks
boot_id
created_epoch
created_at
heartbeat_epoch
heartbeat_at
cleanup_policy
```

PID liveness is accepted only when boot ID and `/proc/<pid>/stat` start-time ticks match. `kill -0` alone is not sufficient because PIDs can be reused.

## Capacity policy

The default fail-closed configuration is:

```text
AUTOMATION_TEMP_INODE_SAFETY_ENABLED=1
AUTOMATION_TEMP_ROOT_RELATIVE=.automation/tmp
AUTOMATION_TEMP_STALE_SECONDS=3600
AUTOMATION_MIN_FREE_INODES=50000
AUTOMATION_MIN_FREE_INODE_PERCENT=2
AUTOMATION_MIN_FREE_KIB=1048576
AUTOMATION_MAX_RUN_TEMP_INODES=250000
AUTOMATION_MAX_RUN_TEMP_KIB=4194304
AUTOMATION_CAPACITY_CHECK_INTERVAL_SECONDS=15
AUTOMATION_TEMP_USAGE_SCAN_TIMEOUT_SECONDS=10
AUTOMATION_TEMP_CLEANUP_TIMEOUT_SECONDS=120
```

All values are validated. Invalid values block startup. There is no fallback to global `/tmp` when the managed root is invalid or unwritable.

Before workload execution the guard records and evaluates both:

```bash
df -Pk <managed-base>
df -Pi <managed-base>
```

The effective inode floor is the greater of the absolute and percentage requirements. A controller blocks with a specific classification when free bytes, free inodes, per-run inode use, per-run byte use, or bounded usage scans fail.

## Watchdog

A controller-owned watchdog checks capacity at the configured interval while the exact owner PID, boot ID, and process start time remain valid. It measures only the current session with bounded commands:

```bash
du --inodes --summarize --one-file-system <session>
du -skx <session>
```

A scan timeout is a safety breach. On breach, the watchdog writes `capacity-breach.env` and sends `TERM` only to the exact owning controller. Existing controller handlers remain responsible for terminating only children they own. The watchdog never sends `KILL` and never targets the operator shell or unrelated processes.

When the owner exits, the watchdog removes only its marker-validated direct child session. Active sessions are retained.

## Stale recovery

At startup, the guard scans only immediate `bws-automation-*` children of the managed `sessions` directory. A candidate is removed only when:

1. its canonical path is a direct child of the managed sessions directory;
2. it is not a symlink;
3. its marker is complete and belongs to this repository;
4. its exact owner is no longer alive according to boot ID and start-time ticks; and
5. it is older than `AUTOMATION_TEMP_STALE_SECONDS`.

Malformed or ambiguous candidates are retained and reported. No normal automation path scans or purges arbitrary `/tmp` contents. Moving stale trees to a same-filesystem quarantine is not considered inode reclamation.

## Operator cleanup

Dry-run:

```bash
bash ./cleanup_automation_temp_inode_residue.sh --dry-run --min-age-seconds 3600
```

Apply:

```bash
bash ./cleanup_automation_temp_inode_residue.sh --apply --min-age-seconds 3600
```

The command operates only on dead marker-owned sessions in `.automation/tmp/sessions` and the confirmed legacy direct-child prefix `bws-paper-runtime-evidence-*` under the active system temp directory. Legacy cleanup is age-gated because those old directories have no ownership marker. It does not kill processes, follow symlinks, cross filesystems, remove the managed base, or perform a generic `/tmp` deletion.

The command prints `df -Pk` and `df -Pi` before and after cleanup and returns nonzero on partial failure.

## Test-fixture rule

Every new `mkdtemp`, `mktemp -d`, temporary database, extraction, build root, or fixture must have deterministic cleanup on success and failure. For `node:test`, register cleanup with the test context:

```typescript
t.after(() => {
  rmSync(directory, {
    recursive: true,
    force: true,
    maxRetries: 3,
    retryDelay: 100,
  });
});
```

Temporary paths must not be retained merely because a test passed.

## Durable-state exclusions

`.automation/tmp/` is ignored by Git. It is also excluded by the existing `tmp` directory rules used by source manifests and codebase ZIP packaging. Artifact ZIPs contain only `artifacts/` and therefore do not include controller temp sessions.

## Verification

Use both commands when diagnosing capacity:

```bash
df -Pk .automation/tmp
df -Pi .automation/tmp
```

Run the repository safety checks with:

```bash
npm run validate:temp-inode-safety
npm run build
node --test --test-concurrency=1 dist/tests/temp-inode-safety.test.js dist/tests/bws-paper-runtime-evidence.test.js
```
