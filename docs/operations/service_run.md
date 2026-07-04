# Service Run

`betting-win-surebet` has no long-running service under the current private paper-only gate.

`start.sh` is intentionally a safe validation wrapper. `stop.sh` is intentionally a no-service wrapper. It does not kill provider, trading, database, or production processes.

Autonomous implementation runs are controlled by `run-autonomous-implementation.sh`, `check_progress.sh`, `watch_progress.sh`, and `open_log.sh`.

No provider collector, wallet, signer, order executor, or public signal service is allowed under the current gate. Future live surebet execution decisions require a separate ADR, new validators, and explicit operator approval.

## Local runtime loader

Use `bash commands/run-sure-paper-mode-autonomous.sh` only if a concrete repo-local defect reopens safe private paper-mode work. `commands/run-sure-001-autonomous.sh` is historical for the completed SURE-001 phase. The command restores executable bits, installs dependencies, validates the starter pack, and then starts `run-autonomous-implementation.sh`. The Node runtime loader uses the installed `.nvmrc` runtime path directly and does not source `nvm.sh`.

## Automation controllers

There is no standalone stop helper. Use:

```bash
./run-autonomous-implementation.sh --status
./run-paper-evaluation.sh --status
./run-autonomous-bugfix.sh --status
```

Only use `--force-unlock` after confirming the lock belongs to the same repo and
script. The current paper controller is `./run-paper-evaluation.sh`, configured for
repo-local private fixture paper mode only.
