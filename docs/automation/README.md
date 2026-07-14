# Repo automation contract: betting-win-surebet

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-100
selected_controller=run-autonomous-implementation.sh
```

The implementation controller reads `docs/automation/current-implementation-task.md`. It must not stop on historical fixture-complete claims.

The hardened controller surface remains:

```text
run-autonomous-implementation.sh
run-autonomous-bugfix.sh
run-bugfix-autopilot.sh
run-paper-evaluation.sh
run-paper-autopilot.sh
```

Parent autopilots launch children with `TELEGRAM_NOTIFY=0` and emit one final campaign message. Standalone controllers retain their own final notification through `.automation/lib/telegram_notify.sh`. Root `run-*` controllers are the notification owners.

The product campaign does not authorize changes to protected automation files. Product source, tests, migrations, configuration schemas, task ledger, and active non-protected status docs may change according to the task.

For status, inspect the newest retained artifact directory and required cycle files. Do not infer success from process exit alone.

Standard evidence packaging:

```text
./zip_codebase.sh --artifacts-only
```

Server update semantics remain equivalent to:

```text
git pull --ff-only --autostash
```
