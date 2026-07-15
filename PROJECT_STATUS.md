# PROJECT_STATUS

```text
repo=betting-win-surebet
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
status=IMPLEMENTATION_READY
repo_role=surebet_strategy_application
upstream_platform=betting-win
provider_truth_owner=betting-win
canonical_history_owner=betting-win
strategy_state_owner=betting-win-surebet
backtesting_owner=betting-win-surebet
paper_mode_owner=betting-win-surebet
account_policy=separate_from_betting-win-betting
current_task=BWS-510
current_task_status=VALIDATED
safe_local_completion_gate=BWS-510
continuous_private_paper=BWS-600_BLOCKED_ON_ACCEPTED_BETTING_WIN_RUNTIME
real_money_execution=BWS-900_PARKED
```

## Rebaseline decision

The previous fixture-complete state is superseded. The supplied betting-win codebase already contains concrete downstream contracts, provider-history exports, read-only query surfaces, and application foundations. BWS must now be implemented as a complete downstream application on those surfaces.

Verified baseline:

```text
betting-win_package_version=0.48.0
betting-win.strategy-export.v1=present
betting-win-strategy-export.v1=present
surebet_standard_binary_v0=present
pinned_provider_history_bundle=present
downstream_consumption_proof=present
read_only_query_api=present
apps_api_web_workers=present
```

The uploaded archive has no Git metadata and no BW source manifest. `BWS-100` is validated by generating the runtime lock from the actual server checkout's committed `HEAD`. The existing checkout is inspected in place and read-only; no clone, temporary worktree, cleanup, reset, or invented commit SHA is allowed.

## Completed

- Deterministic bootstrap logic for identity/equivalence, cash flows, stake vectors, capacity, completion, exposure, settlement replay, deterministic backtesting, and private reporting.
- `BWS-110` workspace migration: bootstrap modules live in stable workspace packages with `src/` compatibility shims and package-surface tests.
- `BWS-320` strategy ledger: immutable private reports, explicit acceptance-state handling, and persistence coverage over validated backtest, private-paper, and settlement flows.
- `BWS-410` bounded worker stack: surebet-owned job persistence, bounded leases, checkpoints, retries, dead letters, and private-paper runtime job handling.
- `BWS-420` operator cockpit: typed React routes, bounded mock/API reads, explicit pinned-export scope filters, committed-HEAD provenance rendering, and fail-closed browser config for the read-only UI.
- Legacy surebet research rehome.
- Hardened implementation, bugfix, paper, and autopilot controllers.
- Parent-only Telegram routing for autopilot campaigns.
- Full BWS architecture, upstream baseline, task ledger, and autonomous task authority.

## Pending

The binding sequence is `backlog/bws_full_implementation.csv`. `BWS-100` through `BWS-510` are validated. Safe local implementation is complete through `BWS-510`, and `BWS-600` remains externally blocked on accepted betting-win continuous read-only runtime evidence.

## Blocked or parked

- `BWS-600` requires accepted operator-approved continuous read-only betting-win runtime evidence.
- `BWS-900` requires a separate execution authorization package and remains parked.

## Controller selection

```text
selected_controller=run-autonomous-implementation.sh
paper_autopilot_selected=no
bugfix_autopilot_selected=no
force_unlock_required=no_evidence
```
