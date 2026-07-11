# Post-overlay cleanup

Current state: no canonical automation script cleanup is pending.

If a stale root overlay metadata file exists from a previous drag-and-drop overlay, remove it with:

```bash
rm -f OVERLAY_MANIFEST.json
```

That file is generated overlay metadata, not active repo authority. Active status lives in `PROJECT_STATUS.md`, `docs/repo_status_current.md`, `docs/MASTER_PLAN.md`, and `docs/automation/`. The source-manifest validator intentionally ignores `OVERLAY_MANIFEST.json` so a drag-and-drop overlay metadata file cannot stale validation, but removing it keeps the working tree cleaner.

Obsolete runtime helpers must remain absent:

```text
run-paper-evaluation-12h.sh
stop-autonomous-run.sh
scripts/stop-autonomous-run.sh
```

If one of those files reappears in a future zip, remove only that obsolete file and then run `npm run validate`. Do not remove the canonical root controllers:

```text
run-autonomous-implementation.sh
run-paper-evaluation.sh
run-autonomous-bugfix.sh
run-bugfix-autopilot.sh
run-paper-autopilot.sh
```

Required executable paths include the root helper scripts, compatibility wrappers, `.automation/lib/run_common.sh`, `.automation/lib/controller_hardening_v2.sh`, and `.automation/lib/telegram_notify.sh`.
