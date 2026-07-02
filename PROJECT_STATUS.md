# PROJECT_STATUS

```text
repo=betting-win-surebet
status=SURE-002A_LOCAL_INTERFACE_AND_ENGINE_BOOTSTRAP
runtime=paper_only
provider_connections=prohibited
execution=prohibited
first_lane=polymarket_standard_binary_complete_set_v0
current_task=SURE-002A_LOCAL_INTERFACE_AND_ENGINE_BOOTSTRAP
next_task=local deterministic interface and engine backlog; real upstream evaluation waits for pinned betting-win interface
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

## Controller status contract

The autonomous controller must fail closed on malformed cycle status, nonzero Codex exit, or failed post-cycle validation. It must not treat unknown `continue_status.txt` content as `CONTINUE_REQUIRED=yes`.

## SURE-001 artifact quality hardening

Required autonomous cycle artifacts are audit evidence. Missing, placeholder, or empty required report files fail closed before cycle status is accepted. `SOURCE_MANIFEST.json` is validated against the current source tree during `npm run validate`.

## Local implementation backlog

The repo-local SURE-001 hardening backlog and the safe SURE-002A local implementation backlog are now exhausted. The repo has local-only deterministic interface contracts, fixture readers, scenario math, stake-vector math, completion/residual simulation, settlement replay consumption, private paper reporting, and an offline fixture-to-artifact report path.

Real upstream evaluation remains blocked pending Federico's pinned `betting-win` contract/export interface. Autonomous cycles should now write `AUTONOMOUS_GOAL_COMPLETE=yes` unless a repo-local validation/tooling defect reopens safe local work.
