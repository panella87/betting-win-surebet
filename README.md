# betting-win-surebet

Private paper-only surebet / complete-set research repository.

This repository consumes stable contracts, exports, read-only query outputs, and generic paper evidence from `betting-win`. It does not connect to providers, does not execute orders, does not use wallets or signers, and does not make profitability claims.

Initial lane:

```text
polymarket_standard_binary_complete_set_v0
same-venue Polymarket standard-binary complete-set paper arbitrage
provider_connection=prohibited
execution=prohibited
```

Current status:

```text
SURE-002A local interface and engine bootstrap
SURE-001 hardening complete
local deterministic contracts, fixture readers, paper math, simulation state machines, and private reports may be implemented
real upstream evaluation remains blocked until betting-win exposes a pinned contract/export interface
```

## Source of truth

Read these first:

1. `AGENTS.md`
2. `docs/MASTER_PLAN.md`
3. `docs/repo_status_current.md`
4. `docs/001_scope_and_boundaries.md`
5. `docs/002_dependency_contract_with_betting_win.md`
6. `docs/012_runbook.md`
7. `docs/operations/autonomous_72h_runbook.md`

Current code and current retained evidence beat stale documentation.

## Install and validate

```bash
npm install
npm run validate
```

Useful wrappers:

```bash
./start.sh
./check_progress.sh
./watch_progress.sh --once
./open_log.sh
./update_git.sh --help
./pull_artifacts_and_zip_codebase.sh --help
./zip_codebase.sh
./run-autonomous-implementation.sh --check-only
# Active SURE-001 continuation backlog: docs/014_sure_001_remaining_hardening_backlog.md
```

`start.sh` is intentionally a validation wrapper, not a daemon launcher. This repo has no long-running service in SURE-001.

## Hard boundary

The repository must fail closed if it contains provider SDK/client imports, provider URLs, wallet/signer/order/transaction paths, direct `betting-win` database access, `core.*` migrations, manually vendored generated contracts, malformed autonomous cycle status, nonzero Codex exit, or failed post-cycle validation.

Federico has asked for the maximum safe local implementation possible. Implement local deterministic paper-engine work from `docs/015_local_engine_implementation_backlog.md`, but do not claim real upstream readiness until a pinned `betting-win` contract/export interface exists.
