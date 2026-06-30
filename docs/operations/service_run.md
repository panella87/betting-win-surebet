# Service Run

`betting-win-surebet` has no long-running service in SURE-001.

`start.sh` is intentionally a safe validation wrapper. `stop.sh` is intentionally a no-service wrapper. It does not kill provider, trading, database, or production processes.

Autonomous implementation runs are controlled by `run-autonomous-implementation.sh`, `check_progress.sh`, `watch_progress.sh`, and `open_log.sh`.

No provider collector, wallet, signer, order executor, or public signal service is allowed in this repo.

## Local runtime loader

Use `bash commands/run-sure-001-autonomous.sh` from the repository root. The command restores executable bits, installs dependencies, validates the starter pack, and then starts `run-autonomous-implementation.sh`. The Node runtime loader uses the installed `.nvmrc` runtime path directly and does not source `nvm.sh`.

