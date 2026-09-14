# Automation support library and active remediation boundary

`.automation/` contains shared controller libraries, lock, artifact, notification, timeout, process, and filesystem-safety helpers. It does not select work. Current routing comes from the active remediation activation package.

```text
active_program=BWS_FINAL_REMEDIATION_R01_R12_V1
current_admitted_tranche=BWS-W4-T39
pre_s2_existing_controllers=prohibited
post_s2_controller=run-autonomous-implementation.sh
```

## Support surface

```text
.automation/lib/run_common.sh
.automation/lib/controller_hardening_v2.sh
.automation/lib/temp_inode_guard.sh
.automation/lib/telegram_notify.sh
.automation/tmp
```

The libraries enforce repo-scoped ownership, bounded children, immutable or atomic artifacts, final receipt handling, managed temp/inode capacity, and parent-owned notification. `TELEGRAM_NOTIFY=0` disables notification. The retained archive covers the complete retained-evidence tree under `artifacts/` after explicit transient cleanup.

## Protected maintenance

The blanket manual protected-file override is disabled. Exact task authorization is required. T39 permits only the three protected helper scripts listed in its task; T44 through T47 later own controller repairs. No other campaign order may edit protected automation unless its immutable task names the path.

## Historical BWS route mirror retained for validators

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
current_task=BWS-600
safe_local_terminal_gate=BWS-599
bws600_current_task=BWS-600
bws600_upstream_api_preflight_source_fix=present
selected_controller=run-paper-autopilot.sh
bws600_selected_controller=run-paper-autopilot.sh
automation_maintenance_allowed=no
```

The active source implementation route is closed for dependency-ready BWS-700 work. Parent paper autopilot is now the selected BWS-600 runtime-evidence route after BWS-700 local completion. Those statements are retained pre-remediation history, not the active campaign route.

## Temp and inode containment

Repository automation uses `.automation/tmp/sessions` with ownership metadata, byte and inode floors, per-run limits, bounded scans, stale-session cleanup, and watchdog measurement-race tolerance. It must not fall back silently to global temporary storage.
