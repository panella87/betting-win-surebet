# Changelog

## 2026-06-30 — SURE-001 autonomous controller and codebase packaging fix

- Fixed the autonomous controller `set -u` startup crash by splitting dependent `local` assignments in `run-autonomous-implementation.sh`.
- The controller now removes only its exact generated root archives (`artifacts.zip`, `autonomous-codebase.zip`) before preflight so a previous completed run cannot poison the next hygiene check.
- The controller now writes a lock PID and can remove the legacy empty lock directory left by the prior `out_dir` crash, while still refusing active PID/nonempty locks.
- Added `scripts/validate_shell_local_assignments.py` so the same Bash `local var=... dependent="$var/..."` regression is caught by `npm run validate`.
- Added repo-local `zip_codebase.sh`, adapted from the main `betting-win` packaging pattern for `betting-win-surebet`.
- Updated `pull_artifacts_and_zip_codebase.sh` to delegate clean codebase packaging to `zip_codebase.sh` and to scan browser duplicate archive names such as `betting-win-surebet1(2).zip` when choosing the next suffix.
- Preserved SURE-001 boundaries: no provider connections, no execution paths, no direct `betting-win` database access, no vendored generated contracts, and no solver implementation.

## 2026-06-30 — SURE-001 no-source-NVM launcher fix

- Replaced the startup runtime loader with a no-source loader that never sources `nvm.sh` and never calls the NVM shell function.
- The launcher now accepts the current PATH Node when it matches the `.nvmrc` major, otherwise it tries direct already-installed Node binaries under `$NVM_DIR/versions/node/.../bin`.
- Added `validate_node_runtime_loader.py` so future launcher changes cannot reintroduce the WSL/Bash `nvm.sh` startup failure.
- Preserved SURE-001 boundaries: no provider connections, no execution paths, no direct `betting-win` database access, no vendored generated contracts, and no solver implementation.

## SURE-001 launcher NVM shell-context fix

- Replaced launcher-time `nvm.sh` sourcing with direct `.nvmrc` runtime path discovery.
- Keeps startup visible before validation and avoids WSL/bash `pop_var_context` failures from NVM internals.
- Adds `scripts/load-node-runtime.sh` to executable-bit validation.


## 2026-06-30 — SURE-001 local `.env` hygiene correction

- Allowed a repo-root `.env` file to exist locally when it is explicitly ignored by Git.
- Kept `.env` forbidden in source handoff/codebase archives so secrets are not packaged.
- Preserved SURE-001 boundaries: no provider connections, no execution paths, no direct `betting-win` database access, no vendored generated contracts, and no solver implementation.

## 2026-06-30 — SURE-001 master-plan operations overlay

- Added the surebet master plan and current-status docs.
- Added Linux-first repo hygiene files: `.gitattributes`, expanded `.gitignore`, `.env.example`, and `PROJECT_STATUS.md`.
- Added adapted operational shell helpers from the Hyperliquid reference pattern: validation start wrapper, safe no-service stop wrapper, progress/log watchers, Git helper, artifact/codebase pull helper, source handoff archive helper, and autonomous implementation controller.
- Added executable-bit restoration and validation.
- Kept SURE-001 boundaries intact: no provider connections, no execution paths, no direct `betting-win` database access, no vendored generated contracts, and no solver implementation.
