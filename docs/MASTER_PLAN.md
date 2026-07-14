# Master Plan - betting-win-surebet

## Goal

Build the complete surebet application on top of the betting-win provider/data/history platform while preserving strict repository ownership and fail-closed safety.

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
repo_role=surebet_strategy_application
upstream_platform=betting-win
current_task=BWS-100
safe_local_terminal_gate=BWS-510
continuous_runtime_gate=BWS-600
execution_gate=BWS-900
```

## Architecture

```text
betting-win
  provider adapters, raw evidence, lineage, canonical identity, rules,
  quotes/depth/trades/settlement, generated contracts, pinned exports,
  read-only query/API, provider-neutral primitives
        |
        | exact lock + immutable exports + typed read-only API/client
        v
betting-win-surebet
  upstream compatibility, surebet.* persistence, equivalence/scenario checks,
  opportunity derivation, stake solving, completion/exposure simulation,
  settlement replay, backtests, private paper state, BWS API/workers/cockpit
```

BWS does not duplicate provider collection or canonical history. It may retain immutable upstream snapshots and references for reproducibility.

## Program

The binding machine-readable queue is `backlog/bws_full_implementation.csv`.

Primary phases:

1. `BWS-100`: exact betting-win checkout lock and compatibility proof.
2. `BWS-110` to `BWS-140`: workspace, `surebet.*` persistence, immutable export intake, read-only API boundary.
3. `BWS-200` to `BWS-240`: equivalence, opportunity, solver, completion/exposure, settlement reconciliation.
4. `BWS-300` to `BWS-320`: backtest, private paper, strategy ledger and reports.
5. `BWS-400` to `BWS-500`: API, workers, cockpit, security, observability, process contracts.
6. `BWS-510`: integrated clean-install and loopback acceptance.
7. `BWS-600`: continuous private paper against accepted betting-win runtime, externally gated.
8. `BWS-900`: real-money execution, parked pending separate authorization.

## Continuation

The implementation controller writes `CONTINUE_REQUIRED=yes` while any dependency-ready safe row through `BWS-510` remains `PENDING`. It may write `AUTONOMOUS_GOAL_COMPLETE=yes` only after every safe local row is `VALIDATED` and no dependency-ready safe work remains.

## Validation model

Every task requires focused unit/contract proof, failure/mismatch coverage, restart/idempotency coverage where stateful, `npm run validate`, updated ledger/status evidence, and a regenerated `SOURCE_MANIFEST.json`.

No task may pass by weakening validators, inventing upstream evidence, accepting unknown schemas, using floating-point money, or silently falling back between upstream modes.

## Automation operating model

- Initial full build: `run-autonomous-implementation.sh`.
- Broad audit and repair after implementation: `run-bugfix-autopilot.sh`.
- Runtime/database convergence after local implementation: `run-paper-autopilot.sh`.
- Standalone audit and paper controllers remain available when explicitly requested.

Hardened parent controllers suppress child Telegram messages and send one final parent notification.
