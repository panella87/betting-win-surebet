# Automation support library and mirrored product route

```text
document_role=SUPPORTING_AUTOMATION_LIBRARY
routing_authority=docs/automation/current-implementation-task.md
status_authority=docs/repo_status_current.md
mirrored_route_only=yes
```

## Mirrored B1 routing

The active source implementation route is closed for dependency-ready BWS-700 work. Parent paper autopilot is now the selected BWS-600 runtime-evidence route after BWS-700 local completion, but it still requires the operator-approved real upstream betting-win read-only API.

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
parent_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-600
broad_bugfix_campaign_status=COMPLETED_AND_ACCEPTED
broad_bugfix_areas_closed=8_of_8
safe_local_terminal_gate=BWS-599
bws600_current_task=BWS-600
bws600_upstream_api_preflight_source_fix=present
selected_controller=run-paper-autopilot.sh
bws600_selected_controller=run-paper-autopilot.sh
```

These markers are a support-library mirror required by controller validation. They do not compete with the binding task and status documents.

`BWS-100` through `BWS-599` are validated. The broad bugfix campaign is complete across 8/8 areas and does not need another parent unless new evidence opens a new bounded audit scope. The BWS-700 implementation parent is complete for dependency-ready local rows. The external runtime-evidence parent is selected once the operator starts and approves the betting-win read-only API.

## `.automation/` support surface

Repo-local controller support for `betting-win-surebet`:

```text
.automation/lib/run_common.sh
.automation/lib/controller_hardening_v2.sh
.automation/lib/temp_inode_guard.sh
.automation/lib/telegram_notify.sh
```

`run_common.sh` provides locking, validation, Codex execution, artifact packaging, cycle artifact checks, and source fingerprints. The controller hardening layer provides atomic parent locks, verified child process groups, mtime heartbeats, TERM-first cleanup, atomic child terminal results, and strict parent and child identity validation.

All five root controllers archive the complete retained-evidence tree under `artifacts/` using fast standard ZIP compression. Explicit top-level test and release scratch families and only symlink nodes below exact autonomous child `cycles/cycle_<n>/repro/` trees are pruned before symlink validation and packaging; regular repro evidence, controller runs, handoffs, private-paper reports, runtime evidence, watchdog events, and operator evidence are retained. Final summaries are refreshed after lock classification so downloaded archives contain authoritative release fields.

Parent autopilots pass `TELEGRAM_NOTIFY=0` to children and send one final parent message. Standalone controllers notify by default.

## Current maintenance gate

The root-wrapper and paper-controller integration phase is complete. The current task contains:

```text
automation_maintenance_allowed=no
allowed_protected_files=none
```

Do not set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`. The blanket manual protected-file override is disabled and any protected change blocks the cycle.

## Current paper limitation

`run-paper-evaluation.sh` and `run-paper-autopilot.sh` expose the validated runtime-evidence lifecycle from `BWS-588` and `BWS-589`. They are the selected path for `BWS-600`, with upstream API readiness still required. The upstream betting-win API availability gate is source-side fail-fast before the long runtime-evidence window. The runtime child uses explicit process values before selective `.env` fill, passes the operator-approved repo-local private-paper schedule path, and enforces API-only paper-safe policy before lifecycle status is read. It never substitutes a fixture schedule.

## Repository temp and inode containment

All five root controllers initialize a distinct repository-owned temp session through `run_common.sh`. The managed base is `.automation/tmp`; `TMPDIR`, `TMP`, and `TEMP` are exported before validations, Codex, packaging, or child-controller workload. Capacity checks cover free KiB, free inodes, per-session inode count, and per-session size. See `docs/automation/repository-temp-inode-safety.md`.

Use `cleanup_automation_temp_inode_residue.sh` in dry-run mode first when recovering abandoned BWS-owned sessions. Generic `/tmp` purges are prohibited.

- `docs/automation/api-only-upstream.md`: binding API-only betting-win transport contract.

### Watchdog measurement-race hardening

<!-- WATCHDOG_RACE_TOLERANCE_V2 -->

The repository temp and inode guard accepts usable numeric `du` output from a transient non-zero traversal result, retries unusable measurements, and retains bounded fatal watchdog events outside the ephemeral controller session.
