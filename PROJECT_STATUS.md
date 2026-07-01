# PROJECT_STATUS

```text
repo=betting-win-surebet
status=SURE-001_SKELETON_AND_BOUNDARY_OVERLAY
runtime=paper_only
provider_connections=prohibited
execution=prohibited
first_lane=polymarket_standard_binary_complete_set_v0
current_task=SURE-001
next_task=SURE-002 only after Federico explicitly asks and betting-win exposes pinned contract/export interface
```

Current state:

- The repo is a downstream strategy skeleton for private paper-only surebet / complete-set research.
- It does not own provider truth.
- It does not connect to SX, Azuro, Polymarket, Limitless, or any future provider.
- It does not implement wallets, signers, token approvals, orders, cancellations, redemptions, cashouts, transactions, live collectors, public signals, or profitability claims.
- It consumes only stable contracts/exports/read-only evidence from `betting-win` after those interfaces exist.

Authoritative active docs:

1. `AGENTS.md`
2. `docs/MASTER_PLAN.md`
3. `docs/repo_status_current.md`
4. `docs/001_scope_and_boundaries.md`
5. `docs/002_dependency_contract_with_betting_win.md`
6. `docs/012_runbook.md`
7. `docs/operations/autonomous_72h_runbook.md`

Validation command:

```bash
npm run validate
```

Local `.env` policy: allowed in the working folder only because `.gitignore` explicitly ignores it; archive validators still reject `.env` inside generated codebase/source handoff archives.


## Launcher hardening

The autonomous launcher uses `scripts/load-node-runtime.sh` and logs Node/NPM runtime checks before validation. `.env` may exist locally when ignored by `.gitignore`; it must not be archived or committed.

## Packaging helpers

`zip_codebase.sh` creates a local clean codebase archive. `pull_artifacts_and_zip_codebase.sh` downloads remote `artifacts.zip` when present and delegates codebase packaging to `zip_codebase.sh`. Both helpers exclude `.env`, dependencies, build output, logs, and generated archives.
