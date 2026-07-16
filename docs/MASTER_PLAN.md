# Master Plan - betting-win-surebet

## Goal

Build the complete private surebet application on top of the read-only betting-win platform while preserving strict repository ownership, deterministic evidence and fail-closed safety.

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
repo_role=surebet_strategy_application
upstream_platform=betting-win
current_task=BWS-590
safe_local_terminal_gate=BWS-599
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
  settlement replay, backtests, continuous private paper, API/workers/cockpit,
  full-stack lifecycle, evidence, backup/recovery and paper automation
```

BWS does not duplicate provider collection or canonical history. It may retain immutable upstream snapshots and references for reproducibility.

## Program

The binding machine-readable queue is `backlog/bws_full_implementation.csv`.

Primary phases:

1. `BWS-100`: exact betting-win checkout lock and compatibility proof.
2. `BWS-110` to `BWS-140`: workspace, `surebet.*` persistence, immutable export intake and read-only API boundary.
3. `BWS-200` to `BWS-240`: equivalence, opportunity, solver, completion/exposure and settlement reconciliation.
4. `BWS-300` to `BWS-320`: backtest, bounded private paper, strategy ledger and reports.
5. `BWS-400` to `BWS-500`: API, workers, cockpit, security, observability and process contracts.
6. `BWS-510`: integrated clean-install and loopback acceptance.
7. `BWS-520` to `BWS-580`: executable bounded runtime components, explicit convergence, bounded scheduling, persisted visibility and component-level continuous-runtime acceptance.
8. `BWS-581` to `BWS-584`: real long-running services, cockpit serving and complete full-stack lifecycle.
9. `BWS-586` to `BWS-589`: evidence operations plus root wrapper and paper-controller integration.
10. `BWS-590` to `BWS-593`: release, upgrade/recovery, soak/failure injection and accepted-runtime preflight.
11. `BWS-599`: integrated final local operator/runtime/automation/recovery acceptance.
12. `BWS-600`: validation against an accepted operator-approved betting-win runtime, externally gated.
13. `BWS-900`: real-money execution, parked pending separate authorization.

## Continuation

The implementation controller writes `CONTINUE_REQUIRED=yes` while any dependency-ready safe row through `BWS-599` remains `PENDING`. It may write `AUTONOMOUS_GOAL_COMPLETE=yes` only after `BWS-599` is `VALIDATED` and no dependency-ready safe work remains.

Completing one bounded task quickly is valid. It does not end the campaign when another dependency-ready row exists.

## Validation model

Every task requires focused success/failure proof, stateful restart/idempotency/cleanup coverage where applicable, `npm run validate`, updated ledger/status evidence and a regenerated `SOURCE_MANIFEST.json`.

No task may pass by weakening validators, inventing upstream evidence, accepting unknown schemas, using floating-point money, silently falling back between upstream modes or treating a one-shot command as a continuous service.

## Automation operating model

- Remaining local implementation: `run-autonomous-implementation.sh`.
- Broad audit and repair after implementation: `run-bugfix-autopilot.sh`.
- Runtime evidence after `BWS-589` and final local acceptance: `run-paper-autopilot.sh`.
- Standalone audit and paper controllers remain available only for their explicit bounded roles.

The active implementation task authorizes an exact protected-file subset for the later wrapper and paper-controller tasks. The controller must enforce the task-file allowlist even when `AUTOMATION_ALLOW_PROTECTED_CHANGES=1` is set.

Hardened parent controllers suppress child Telegram messages and send one final parent notification.
