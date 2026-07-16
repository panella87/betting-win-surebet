# betting-win-surebet

`betting-win-surebet` is the surebet and complete-set application built on top of the `betting-win` provider, data, history, export and read-only query platform.

It remains a separate downstream repository. It does not fork the provider platform or copy provider adapters. It consumes exact betting-win contracts, immutable exports, canonical identifiers, provenance and read-only query/API surfaces. It owns all surebet-specific state and decisions.

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
current_task=BWS-580
safe_local_terminal_gate=BWS-580
execution_gate=closed
```

## Upstream surfaces

BWS consumes:

1. Exact `@betting-win/*` package and contract boundaries.
2. Immutable `betting-win.strategy-export.v1` bundles using profile `surebet_standard_binary_v0`.
3. Typed read-only betting-win query/API surfaces.
4. Canonical identity, rule, provider-generation, quote, trade, settlement and source-lineage references.

BWS must not connect directly to providers, write betting-win `core.*`, treat snapshots as canonical provider history, or silently fall back between workspace, export, API and fixture modes.

## Inspected upstream baseline

The original rebaseline inspected the supplied betting-win archive:

```text
archive_sha256=9a9eee490918ff69182acdaa302d216859a5009b0943adb41e56171c1ee9ef8f
package_version=0.48.0
contract_schema=betting-win.strategy-export.v1
contract_alias=betting-win-strategy-export.v1
surebet_profile=surebet_standard_binary_v0
```

`config/betting-win.upstream-baseline.json` remains design evidence rather than the runtime pin. `BWS-100` generates `config/betting-win.upstream.lock.json` from the existing betting-win checkout's committed `HEAD`, reads package and capability evidence with `git show HEAD:`, and excludes uncommitted working-tree state without copying, cleaning, resetting or cloning the upstream repository.

## Current implementation state

`BWS-100` through `BWS-580` are validated. The workspace migration keeps tested implementations in `packages/bootstrap`, `packages/persistence` and `packages/upstream`, with `src/` compatibility shims and a validated React cockpit under `apps/web`.

Continuous runtime implementation remains:

```text
BWS-520 executable loopback API and worker applications [validated]
BWS-530 continuous immutable-export convergence [validated]
BWS-540 continuous typed API convergence [validated]
BWS-550 continuous scheduling and bounded workers [validated]
BWS-560 operator lifecycle, status and evidence [validated]
BWS-570 runtime/API/cockpit convergence [validated]
BWS-580 integrated continuous-runtime acceptance and handoff [validated]
BWS-600 accepted external runtime evidence [externally blocked]
BWS-900 separately authorized execution
```

The product-owned runtime surface now includes loopback API and bounded worker entrypoints, explicit immutable-export and typed API convergence, restart-safe API-mode scheduling into deterministic private-paper jobs, verified repo-owned lifecycle evidence publication, persisted runtime/API/cockpit convergence over accepted and blocked continuous paper cycles, and a strict machine-readable paper-runtime handoff with immutable source archive packaging. Safe local implementation is complete through `BWS-580`; `BWS-600` remains blocked on accepted external betting-win runtime evidence and paper-controller review.

## Authority

Read in this order:

1. `AGENTS.md`
2. `docs/repo_status_current.md`
3. `docs/MASTER_PLAN.md`
4. `docs/028_full_implementation_program.md`
5. `docs/029_full_implementation_task_ledger.md`
6. `backlog/bws_full_implementation.csv`
7. `docs/030_upstream_compatibility_and_pin_contract.md`
8. `docs/033_continuous_private_paper_runtime_program.md`
9. `docs/automation/current-implementation-task.md`

Historical SURE ledgers remain regression evidence only. They do not authorize implementation to stop.

## Validation

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
npm ci --ignore-scripts
npm run validate
```

## Autonomous implementation

The selected controller is `run-autonomous-implementation.sh`. It reads the current task and binding ledger; no invented `--task` or prompt file is required.

## Safety

The program may build loopback-only executable services, explicit read-only upstream convergence, persisted continuous private paper, API, workers, UI and evidence. It may not use direct provider endpoints or credentials, create wallets/signers/orders/transactions, mutate provider accounts, publish signals, claim profitability or enable real-money execution.
