# Current product routing

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-599
safe_local_terminal_gate=BWS-599
selected_controller=run-autonomous-implementation.sh
```

`BWS-100` through `BWS-593` are validated. The active queue now builds final local acceptance through `BWS-599`.

# `.automation/`

Repo-local controller support for `betting-win-surebet`.

Active shared helpers:

```text
.automation/lib/run_common.sh
.automation/lib/controller_hardening_v2.sh
.automation/lib/temp_inode_guard.sh
.automation/lib/telegram_notify.sh
```

`run_common.sh` provides locking, validation, Codex execution, artifact packaging, cycle artifact checks and source fingerprints. The controller hardening layer provides atomic parent locks, verified child process groups, mtime heartbeats, TERM-first cleanup, atomic child terminal results and strict parent/child identity validation.

All five root controllers archive the complete `artifacts/` tree using fast standard ZIP compression. Final summaries are refreshed after lock classification so downloaded archives contain authoritative release fields.

Parent autopilots pass `TELEGRAM_NOTIFY=0` to children and send one final parent message. Standalone controllers notify by default.

## Current maintenance gate

The root-wrapper and paper-controller integration phase is complete. The active `BWS-590` through `BWS-599` task contains:

```text
automation_maintenance_allowed=no
allowed_protected_files=none
```

Do not set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`. The blanket manual protected-file override is disabled and any protected change blocks the cycle.

## Current paper limitation

`run-paper-evaluation.sh` and `run-paper-autopilot.sh` now expose the validated runtime-evidence local lifecycle from `BWS-588` and `BWS-589`. They do not replace the remaining release, recovery, soak, or final-acceptance queue.

## Repository temp and inode containment

All five root controllers initialize a distinct repository-owned temp session through `run_common.sh`. The managed base is `.automation/tmp`; `TMPDIR`, `TMP`, and `TEMP` are exported before validations, Codex, packaging, or child-controller workload. Capacity checks cover free KiB, free inodes, per-session inode count, and per-session size. See `docs/automation/repository-temp-inode-safety.md`.

Use `cleanup_automation_temp_inode_residue.sh` in dry-run mode first when recovering abandoned BWS-owned sessions. Generic `/tmp` purges are prohibited.

- `docs/automation/api-only-upstream.md`: binding API-only betting-win transport contract.

### Watchdog measurement-race hardening

<!-- WATCHDOG_RACE_TOLERANCE_V2 -->

The repository temp/inode guard accepts usable numeric `du` output from a transient non-zero traversal result, retries unusable measurements, and retains bounded fatal watchdog events outside the ephemeral controller session.
