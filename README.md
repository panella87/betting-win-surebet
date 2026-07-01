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
SURE-001 only
skeleton, documentation, operational wrappers, validation gates, and typed stubs
strategy implementation blocked until betting-win exposes stable read-only exports/query and generic paper infrastructure
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
```

`start.sh` is intentionally a validation wrapper, not a daemon launcher. This repo has no long-running service in SURE-001.

## Hard boundary

The repository must fail closed if it contains provider SDK/client imports, provider URLs, wallet/signer/order/transaction paths, direct `betting-win` database access, `core.*` migrations, or manually vendored generated contracts.

The first accepted output remains a repo skeleton and boundary-validation pack. Do not implement opportunity solving until Federico explicitly asks and a pinned `betting-win` contract/export interface exists.
