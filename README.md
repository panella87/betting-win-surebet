# betting-win-surebet

`betting-win-surebet` is the surebet and complete-set application built on top of the `betting-win` provider, data, history, export and read-only query platform.

It remains a separate downstream repository. It does not fork the provider platform or copy provider adapters. It consumes exact contracts, immutable exports, canonical identifiers, provenance and read-only query/API surfaces. It owns all surebet-specific state and decisions.

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
current_task=BWS-581
safe_local_terminal_gate=BWS-599
external_runtime_gate=BWS-600
execution_gate=closed
```

## Upstream surfaces

```text
upstream_archive_sha256=9a9eee490918ff69182acdaa302d216859a5009b0943adb41e56171c1ee9ef8f
strategy_export_schema=betting-win.strategy-export.v1
surebet_profile=surebet_standard_binary_v0
```

BWS consumes:

1. Exact `@betting-win/*` package and contract boundaries.
2. Immutable `betting-win.strategy-export.v1` bundles using profile `surebet_standard_binary_v0`.
3. Typed read-only betting-win query/API surfaces.
4. Canonical identity, rule, provider-generation, quote, trade, settlement and source-lineage references.

BWS must not connect directly to providers, write betting-win `core.*`, treat snapshots as canonical provider history or silently fall back between workspace, export, API and fixture modes.

## Validated foundation

`BWS-100` through `BWS-580` are validated. The repository has the domain engine, `surebet.*` persistence, immutable intake, explicit export and API convergence passes, scheduler and worker primitives, read-only API, React cockpit, API-only lifecycle ownership, loopback acceptance and strict runtime handoff packaging.

Validated executable and integration composition remains under `packages/bootstrap`; the remaining queue extends that package surface rather than replacing it.

That is not the final operator service. The current source still exposes one-shot convergence/scheduler/worker commands, manages only the API in its lifecycle owner, does not serve the cockpit from the managed stack, leaves root `start.sh` and `stop.sh` disconnected, and keeps paper evaluation in `single_pass_no_service` mode.

## Remaining safe local program

The binding queue now continues through `BWS-599`:

```text
BWS-581  long-running explicit-mode convergence service
BWS-582  long-running scheduler and worker loops
BWS-583  loopback cockpit serving and full-stack convergence
BWS-584  complete product-owned lifecycle
BWS-585  database retention, backup and restore verification
BWS-586  logs, metrics, diagnostics and evidence retention
BWS-587  root lifecycle/progress/log wrapper integration
BWS-588  service-owned paper evaluation
BWS-589  full lifecycle paper autopilot
BWS-590  release and deployment packaging
BWS-591  upgrade, rollback and recovery proof
BWS-592  long-running soak and failure injection
BWS-593  external-runtime preflight and campaign manifest
BWS-599  integrated final local acceptance
BWS-600  accepted operator-approved runtime evidence
BWS-900  separately authorized execution
```

## Authority

Read in this order:

1. `AGENTS.md`
2. `docs/repo_status_current.md`
3. `docs/MASTER_PLAN.md`
4. `docs/028_full_implementation_program.md`
5. `docs/029_full_implementation_task_ledger.md`
6. `backlog/bws_full_implementation.csv`
7. `docs/034_remaining_operator_runtime_implementation_program.md`
8. `docs/automation/current-implementation-task.md`

Historical SURE ledgers remain regression evidence only. They do not authorize implementation to stop.

## Validation

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
npm ci --ignore-scripts
npm run validate
```

## Autonomous implementation

The selected controller is `run-autonomous-implementation.sh`. It reads the current task and binding ledger; no invented `--task` or prompt file is required.

The current campaign has a documented exact protected-file allowlist for later root-wrapper and paper-controller integration. The server invocation must set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`; the controller still rejects any protected change outside the task-file allowlist.

## Safety

The program may build private loopback services, explicit read-only upstream convergence, persisted continuous paper, API, workers, UI, lifecycle, evidence, backup/restore and recovery. It may not use direct provider endpoints or credentials, create wallets/signers/orders/transactions, mutate provider accounts, publish signals, claim profitability or enable real-money execution.
