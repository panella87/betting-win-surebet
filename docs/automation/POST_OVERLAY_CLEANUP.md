# Post-overlay cleanup

After applying automation-helper overlays to `betting-win-surebet`, run from the
repo root:

```bash
rm -f run-paper-evaluation-12h.sh stop-autonomous-run.sh scripts/stop-autonomous-run.sh
find . -maxdepth 3 -type f -name 'run-paper-evaluation-12h.sh' -delete
find . -maxdepth 3 -type f -name 'stop-autonomous-run.sh' -delete
node scripts/restore-required-executable-bits.js
npm run validate
```

Required executable paths include the root helper scripts, the historical surebet
command wrappers, `.automation/lib/run_common.sh`, and
`.automation/lib/telegram_notify.sh`.
