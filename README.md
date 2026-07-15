# betting-win-surebet

`betting-win-surebet` is the surebet and complete-set application built on top of the `betting-win` provider, data, history, export, and read-only query platform.

It remains a separate downstream repository. It does not fork the provider platform and does not copy provider adapters. It consumes exact betting-win contracts, immutable exports, canonical identifiers, provenance, and read-only query/API surfaces. It owns all surebet-specific state and decisions.

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
repo_role=surebet_strategy_application
upstream_platform=betting-win
provider_truth_owner=betting-win
canonical_history_owner=betting-win
strategy_state_owner=betting-win-surebet
backtesting_owner=betting-win-surebet
paper_mode_owner=betting-win-surebet
future_live_decision_owner=betting-win-surebet_after_explicit_gate
account_policy=separate_from_betting-win-betting
current_task=BWS-510
execution_gate=closed
```

## Upstream surfaces

BWS is designed to consume:

1. Exact `@betting-win/*` package and contract boundaries.
2. Immutable `betting-win.strategy-export.v1` bundles using profile `surebet_standard_binary_v0`.
3. Typed read-only betting-win query/API surfaces for bounded paper observation.
4. Canonical identity, rule, provider-generation, quote, trade, settlement, and source-lineage references.

BWS must not connect directly to providers, write betting-win `core.*`, treat snapshots as canonical provider history, or silently fall back between workspace, export, API, and fixture modes.

## Inspected upstream baseline

The rebaseline inspected the supplied betting-win archive:

```text
archive_sha256=9a9eee490918ff69182acdaa302d216859a5009b0943adb41e56171c1ee9ef8f
package_version=0.48.0
contract_schema=betting-win.strategy-export.v1
contract_alias=betting-win-strategy-export.v1
surebet_profile=surebet_standard_binary_v0
```

`config/betting-win.upstream-baseline.json` records the inspected design baseline. It is not a runtime pin. `BWS-100` generates `config/betting-win.upstream.lock.json` from the existing server checkout's committed `HEAD`. Package and capability evidence is read with `git show HEAD:` and the fingerprint is derived from the committed Git tree, so uncommitted working-tree changes are excluded rather than copied, cleaned, reset, or cloned. The verifier fails closed when commit, Git tree, tracked-tree fingerprint, package, or capability evidence is missing or mismatched. `BWS-510` is validated and safe local implementation is complete through that terminal gate.

## Target repository shape

```text
apps/api                BWS read-only API
apps/web                operator cockpit
apps/workers            bounded import, backtest, and paper workers
packages/upstream       betting-win lock, export, and query adapters
packages/contracts      BWS domain contracts
packages/opportunity    equivalence and opportunity derivation
packages/solver         capacity, fees, rounding, and stake vectors
packages/simulation     completion and residual exposure
packages/settlement     settlement replay and reconciliation
packages/backtest       deterministic historical evaluation
packages/paper          BWS private paper state
packages/query-service  BWS read models
packages/jobs           checkpoints, leases, retries, dead letters
database/migrations/surebet
```

The validated workspace migration now keeps the tested bootstrap implementations in `packages/bootstrap` and `packages/upstream` while `src/` provides compatibility shims for existing imports.

## Authority

Read in this order:

1. `AGENTS.md`
2. `docs/repo_status_current.md`
3. `docs/MASTER_PLAN.md`
4. `docs/028_full_implementation_program.md`
5. `docs/029_full_implementation_task_ledger.md`
6. `backlog/bws_full_implementation.csv`
7. `docs/030_upstream_compatibility_and_pin_contract.md`
8. `docs/automation/current-implementation-task.md`

Historical SURE-001, SURE-002A, and SURE-002B ledgers remain regression evidence only. They do not authorize implementation to stop.

Safe local implementation is complete through `BWS-510`. Continuous upstream paper observation remains gated by `BWS-600`. Real-money execution remains parked at `BWS-900`.

## Validation

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
npm ci --ignore-scripts
npm run validate
```

## Autonomous implementation

The selected controller is `run-autonomous-implementation.sh`. It reads `docs/automation/current-implementation-task.md`; no invented `--task` or prompt file is required. Paper autopilot is not the initial build router.

## Safety

The current program may build the complete local, loopback, backtest, and private-paper application. It may create a typed read-only betting-win client. It may not use direct provider endpoints or credentials, create wallets/signers/orders/transactions, mutate provider accounts, publish signals, claim profitability, or enable real-money execution.
