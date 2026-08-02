# Master Plan - betting-win-surebet

## B1 implementation program

The current implementation plan is `BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1`, opened by explicit operator approval after the OpenAlex B1 research review. It adds a new BWS-700 series without reopening the validated `BWS-100` through `BWS-599` platform or claiming `BWS-600` runtime evidence.

Primary task source: `docs/automation/current-implementation-task.md`.
Primary queue: `backlog/bws_b1_cross_venue_implementation.csv`.
Primary map: `backlog/bws_b1_cross_venue_map.csv`.


## Goal

Build the complete private surebet application on top of the read-only betting-win platform while preserving strict repository ownership, deterministic evidence and fail-closed safety.

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
parent_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
repo_role=surebet_strategy_application
upstream_platform=betting-win
current_task=BWS-600
current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
active_implementation_queue=none
completed_b1_queue=backlog/bws_b1_cross_venue_implementation.csv
completed_b1_map=backlog/bws_b1_cross_venue_map.csv
bws700_completion_status=DEPENDENCY_READY_LOCAL_IMPLEMENTATION_COMPLETE
b1_dependency_ready_local_rows=VALIDATED_THROUGH_BWS-820
bws710_status=BLOCKED_ACCEPTED_BETTING_WIN_B1_MULTI_VENUE_API_REQUIRED
safe_local_terminal_gate=BWS-599
continuous_runtime_gate=BWS-600
bws600_current_task=BWS-600
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

The active machine-readable queue is `backlog/bws_b1_cross_venue_implementation.csv`; the active map is `backlog/bws_b1_cross_venue_map.csv`. The old full-platform queue, `backlog/bws_full_implementation.csv`, is validated carry-forward history through `BWS-599`.

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

Latest validated carry-forward tranche:

- `BWS-592`: deterministic managed-runtime soak and bounded failure injection.
- `BWS-593`: exact-mode external runtime preflight and campaign-manifest generation.
- `BWS-599`: integrated final local operator/runtime/automation/recovery acceptance.

## Continuation

The implementation controller writes `CONTINUE_REQUIRED=yes` while any dependency-ready row in `backlog/bws_b1_cross_venue_implementation.csv` remains `PENDING`. It may write `AUTONOMOUS_GOAL_COMPLETE=yes` only after the authorized BWS-700 queue is validated or truthfully blocked, while preserving `BWS-600` as an external runtime-evidence gate and `BWS-900` as parked.

Completing one bounded task quickly is valid. It does not end the campaign when another dependency-ready B1 row exists.

## Validation model

Every task requires focused success/failure proof, stateful restart/idempotency/cleanup coverage where applicable, `npm run validate`, updated ledger/status evidence and a regenerated `SOURCE_MANIFEST.json`.

No task may pass by weakening validators, inventing upstream evidence, accepting unknown schemas, using floating-point money, silently falling back between upstream modes or treating a one-shot command as a continuous service.

## Automation operating model

- `run-autonomous-implementation.sh` is available for future reviewed source handoffs or unblocked BWS-710 intake; it is not the selected controller after BWS-700 dependency-ready local completion.
- Broad audit and repair remains available through `run-bugfix-autopilot.sh` after the BWS-700 implementation route is no longer binding.
- `run-paper-autopilot.sh` is selected for the carry-forward `BWS-600` runtime-evidence parent because no dependency-ready BWS-700 implementation row remains.
- Standalone audit and paper controllers remain available only for their explicit bounded roles.

The protected wrapper and paper-controller integration phase is complete. The completed `BWS-700` dependency-ready local implementation state authorizes no protected automation changes. `docs/000_documentation_index.md` is the compact map for active docs, retained blueprints and archive material. Detailed execution blueprints are `docs/042` through `docs/046`, with machine-readable decomposition in `backlog/bws_remaining_safe_local_map.csv`. Superseded bootstrap ledgers `docs/014`, `docs/015` and `docs/017` are merged into `docs/000_documentation_index.md`.

Hardened parent controllers suppress child Telegram messages and send one final parent notification.
