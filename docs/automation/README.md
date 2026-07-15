# Repo automation contract: betting-win-surebet

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-520
current_task_status=PENDING
selected_controller=run-autonomous-implementation.sh
safe_local_terminal_gate=BWS-580
```

`BWS-100` through `BWS-510` remain validated. Fresh paper-autopilot evidence proved that the repository still has a source queue: the paper child is `single_pass_no_service`, `start.sh` starts no service, and `stop.sh` reports no long-running service. The active router therefore selects implementation for `BWS-520` through `BWS-580`; paper autopilot is not selected merely to repeat the missing-input result.

`BWS-100` validates the committed-`HEAD` upstream lock through `BETTING_WIN_REPO_PATH`. Ongoing implementation must preserve that read-only contract and must not clone, clean, reset or modify the upstream checkout.

The hardened controller surface remains:

```text
run-autonomous-implementation.sh
run-autonomous-bugfix.sh
run-bugfix-autopilot.sh
run-paper-evaluation.sh
run-paper-autopilot.sh
```

Parent autopilots launch children with `TELEGRAM_NOTIFY=0` and emit one final parent notification. Standalone controllers retain their own final notification through `.automation/lib/telegram_notify.sh`.

The product campaign does not authorize changes to protected automation files. Product source, executable application entrypoints, tests, migrations, package scripts, configuration schemas, task ledger and active non-protected status docs may change according to `BWS-520` through `BWS-580`.

For `BWS-510`, the loopback validator continues to accept either a complete `SUREBET_TEST_*` tuple or `DB_URL_TEST` from the process environment or repo-local `.env`. Those validated tests remain carry-forward proof, not continuous-runtime completion.

For status, inspect the newest retained artifact directory and machine status. Do not infer success from process exit or elapsed time alone.
Standard evidence packaging remains:

```text
./zip_codebase.sh --artifacts-only
```

Server update semantics remain equivalent to:

```text
git pull --ff-only --autostash
```

## Preserved automation hardening

Root `run-*` controllers remain the notification owners. Parent autopilots pass `TELEGRAM_NOTIFY=0` to children and emit one final campaign message through `.automation/lib/telegram_notify.sh`.

Parent/child terminal state remains bound to the atomic child-result side channel rather than streamed stdout. Every controller still archives the complete `artifacts/` directory, uses repo-local temporary files rather than requiring writable `/tmp`, and the pull helper rejects a `REMOTE_REPO` basename that does not match the local repository.

