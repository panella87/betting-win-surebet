# Service Run

`betting-win-surebet` has no long-running service under the current private paper-only gate.

`start.sh` is intentionally a safe validation wrapper. `stop.sh` is intentionally a no-service wrapper. It does not kill provider, trading, database, or production processes.

No provider collector, wallet, signer, order executor, public signal service, or service refresh lifecycle is allowed under the current gate. Future live surebet execution decisions require a separate ADR, new validators, and explicit operator approval.

## Canonical controllers

Use the root scripts as the active command surface:

```bash
./run-autonomous-implementation.sh --status
./run-paper-evaluation.sh --status
./run-autonomous-bugfix.sh --status
```

Before launching long controllers, activate Node in the parent shell:

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
```

The root controllers inherit the active Node runtime, assert Node/NPM versions, and never source `nvm.sh` themselves.

## Compatibility wrappers

Historical wrappers remain under `commands/` for old phase-specific entrypoints, but they are not the canonical daily command surface:

```text
commands/run-sure-001-autonomous.sh
commands/run-sure-local-engine-autonomous.sh
commands/run-sure-paper-mode-autonomous.sh
commands/run-pinned-interface-smoke.sh
```

Use `commands/run-pinned-interface-smoke.sh` only when Federico provides a repo-local pinned `betting-win` export bundle. Use the other wrappers only for compatibility or explicit historical reproduction.

There is no standalone stop helper. Only use `--force-unlock` after confirming the lock belongs to the same repo and script. The current paper controller is `./run-paper-evaluation.sh`, configured for repo-local private fixture paper mode by default and repo-local pinned-bundle intake when `SUREBET_PINNED_BUNDLE` is explicitly provided. Real upstream pinned-bundle evaluation still requires Federico to provide a repo-local pinned `betting-win` export bundle.
