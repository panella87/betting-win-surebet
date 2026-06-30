# betting-win-surebet starter pack

This overlay implements SURE-001 only: repository skeleton, documentation, ADRs, typed
blocked stubs, tests, and fail-closed boundary validators.

It intentionally does not include `.env`, provider credentials, provider SDKs,
wallet/signer packages, generated `betting-win` contracts, direct database access, or real
strategy implementation. A repo-root `.env` may exist locally for helper configuration only
when ignored by Git; it must never be archived or committed.

## Launcher fix

The starter pack includes a no-source-NVM runtime loader. It does not source `nvm.sh` and does not call the NVM shell function; startup should fail with a visible runtime diagnostic instead of aborting inside `nvm.sh`.
