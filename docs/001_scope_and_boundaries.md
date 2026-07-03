# 001 — Scope and boundaries

`betting-win-surebet` is the dedicated surebet / complete-set strategy repository. Current implementation is private paper-only; future live surebet execution decisions are gated and disabled until a separate explicit authorization. It consumes stable
contracts and evidence exports from `betting-win`; it does not collect provider data and
it does not become the shared provider platform.

```text
repo_role=surebet_strategy_execution_repo
provider_truth_owner=betting-win
canonical_history_owner=betting-win
predictive_strategy_owner=betting-win-betting
backtesting_owner=betting-win-surebet
paper_mode_owner=betting-win-surebet
future_live_decision_owner=betting-win-surebet_after_explicit_gate
account_policy=separate_from_betting-win-betting
```

## In scope for this repository

- Surebet/complete-set strategy logic.
- Surebet backtesting over pinned `betting-win` exports.
- Private paper mode and paper reports.
- Future gated surebet execution decisions after explicit authorization.

## In scope for SURE-001

- Repository skeleton.
- Agent authority.
- Documentation and ADRs.
- Type-only contracts and deliberately blocked stubs.
- Boundary validators that fail closed.
- Fixture folders for future pinned `betting-win` exports.

## Out of scope for this repository

- Provider adapters and canonical provider history.
- Predictive/value-betting feature/model/CLV strategy work.
- Shared capital coordination with `betting-win-betting`.

## Out of scope for SURE-001

- Provider connections.
- Direct database access to `betting-win`.
- Real implementation of opportunity solving.
- Real implementation of stake-vector solving.
- Real implementation of leg completion or residual exposure simulation.
- Any live or real-money path.

## Current status

```text
SURE-001 = complete
SURE-002A local fixture engine = complete
solver = local_fixture_only_implemented
completion_simulation = local_fixture_only_implemented
residual_exposure = local_fixture_only_implemented
settlement_replay_consumption = local_fixture_only_implemented
private_reporting = local_fixture_only_implemented
provider connection = prohibited
real-money path = prohibited
real upstream evaluation = blocked pending Federico's pinned betting-win interface
```

The SURE-002A local implementation is deterministic and fixture-only. It is not evidence that any real provider market is exploitable, executable, or ready for live use. Backtesting and private paper mode belong here for surebet strategies only after they consume pinned `betting-win` exports or local fixtures; canonical history remains upstream.
