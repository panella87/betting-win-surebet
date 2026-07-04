# Post-overlay cleanup

After applying this overlay to `betting-win-surebet`, run from the repo root:

```bash
rm -f run-paper-evaluation-12h.sh stop-autonomous-run.sh scripts/stop-autonomous-run.sh
find . -maxdepth 3 -type f -name 'run-paper-evaluation-12h.sh' -delete
find . -maxdepth 3 -type f -name 'stop-autonomous-run.sh' -delete
chmod +x zip_codebase.sh pull_artifacts_and_zip_codebase.sh update_git.sh run-autonomous-implementation.sh run-paper-evaluation.sh run-autonomous-bugfix.sh
chmod +x .automation/lib/run_common.sh commands/run-sure-001-autonomous.sh commands/run-sure-local-engine-autonomous.sh commands/run-sure-paper-mode-autonomous.sh commands/run-pinned-interface-smoke.sh scripts/create-source-handoff-archive.sh scripts/load-node-runtime.sh cli.js start.sh stop.sh check_progress.sh watch_progress.sh open_log.sh
```

No temporary compatibility wrapper is required for `run-paper-evaluation-12h.sh`.
`commands/run-sure-paper-mode-autonomous.sh` remains as a repo-local historical
helper for implementation-side private paper work; the canonical paper supervisor
is root `./run-paper-evaluation.sh`.
