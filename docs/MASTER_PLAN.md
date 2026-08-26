# Master Plan - betting-win-surebet

## Completed B1 implementation program and active BWS-600 gate

The current program authority is `BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1`, opened by explicit operator approval after the OpenAlex B1 research review. Dependency-ready local implementation is complete through `BWS-820`, the broad bugfix campaign is accepted across all eight areas, and the active task has returned to the external `BWS-600` runtime-evidence gate.

Primary task source: `docs/automation/current-implementation-task.md`.
Completed B1 queue: `backlog/bws_b1_cross_venue_implementation.csv`.
Completed B1 map: `backlog/bws_b1_cross_venue_map.csv`.


## Betting-win ecosystem integration state

```text
canonical_integration_contract=docs/002_dependency_contract_with_betting_win.md
betting_win_source_audit_sha256=7b2c3a48bbc4cba95bcace384bb20892916a5958e6477d49651c983b16d11dc2
data_plane_runtime=accepted_read_only_api_required
current_cross_repo_wire_status=NOT_ACCEPTED_NOT_COMPATIBLE
b1_schema_status=DECLARED_STUB_AND_SAMPLE_VALIDATED
b1_runtime_resource_status=NOT_ACCEPTED_NOT_AUTHORIZED
execution_sdk_status=PARTIAL_FAIL_CLOSED
execution_sdk_bws_integration=BWS-900_PARKED
```

The current plan does not add a new safe-local implementation queue. BWS-600 remains the selected future runtime-evidence phase, but it cannot start until betting-win accepts the downstream API route/envelope/provenance contract and real provider-to-PostgreSQL-to-API parity. BWS-710 and BWS-900 remain separate gates.

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
broad_bugfix_campaign_status=COMPLETED_AND_ACCEPTED
broad_bugfix_areas_closed=8_of_8
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
        | exact source lock; immutable exports for history/replay;
        | accepted typed read-only API for current runtime truth
        v
betting-win-surebet
  upstream compatibility, surebet.* persistence, equivalence/scenario checks,
  opportunity derivation, stake solving, completion/exposure simulation,
  settlement replay, backtests, continuous private paper, API/workers/cockpit,
  full-stack lifecycle, evidence, backup/recovery and paper automation
```

BWS does not duplicate provider collection or canonical history. It may retain immutable upstream snapshots and references for reproducibility.

## Program

The completed dependency-ready B1 queue is `backlog/bws_b1_cross_venue_implementation.csv`; its retained map is `backlog/bws_b1_cross_venue_map.csv`. BWS-710 remains blocked on an accepted complete B1 runtime resource and downstream API handoff, BWS-830/BWS-840 remain parked, and no B1 implementation row is currently active. The old full-platform queue, `backlog/bws_full_implementation.csv`, is validated carry-forward history through `BWS-599`.

Primary phases:

1. `BWS-100`: exact betting-win checkout lock and compatibility proof.
2. `BWS-110` to `BWS-140`: workspace, `surebet.*` persistence, immutable export intake and read-only API boundary.
3. `BWS-200` to `BWS-240`: equivalence, opportunity, solver, completion/exposure and settlement reconciliation.
4. `BWS-300` to `BWS-320`: backtest, bounded private paper, strategy ledger and reports.
5. `BWS-400` to `BWS-500`: API, workers, cockpit, security, observability and process contracts.
6. `BWS-510`: integrated clean-install and loopback acceptance.
7. `BWS-520` to `BWS-580`: executable bounded runtime components, bounded API convergence with retained export compatibility coverage, bounded scheduling, persisted visibility, and component-level continuous-runtime acceptance.
8. `BWS-581` to `BWS-584`: real long-running services, cockpit serving and complete full-stack lifecycle.
9. `BWS-586` to `BWS-589`: evidence operations plus root wrapper and paper-controller integration.
10. `BWS-590` to `BWS-593`: release, upgrade/recovery, soak/failure injection and accepted-runtime preflight.
11. `BWS-599`: integrated final local operator/runtime/automation/recovery acceptance.
12. `BWS-600`: validation against an accepted operator-approved betting-win runtime, externally gated.
13. `BWS-900`: real-money execution, parked pending separate authorization.

Latest validated carry-forward tranche:

- `BWS-592`: deterministic managed-runtime soak and bounded failure injection.
- `BWS-593`: API-only external runtime preflight and campaign-manifest generation, with historical export fixtures retained only for compatibility regression.
- `BWS-599`: integrated final local operator/runtime/automation/recovery acceptance.

## Implementation continuation contract

No implementation queue is active now. The BWS-700 dependency-ready local queue is complete, `BWS-710` is externally blocked, and the selected controller is `run-paper-autopilot.sh` for `BWS-600`.

For a future task that explicitly reopens and names an implementation queue, the implementation controller writes `CONTINUE_REQUIRED=yes` while another dependency-ready row remains `PENDING`. It may write `AUTONOMOUS_GOAL_COMPLETE=yes` only after that authorized queue is validated or truthfully blocked, while preserving `BWS-600` and parked `BWS-900` boundaries.

Completing one bounded task quickly is valid, but it does not end a future campaign while another dependency-ready authorized row exists.

## Validation model

Every task requires focused success/failure proof, stateful restart/idempotency/cleanup coverage where applicable, `npm run validate`, updated ledger/status evidence and a regenerated `SOURCE_MANIFEST.json`.

No task may pass by weakening validators, inventing upstream evidence, accepting unknown schemas, using floating-point money, falling back from API runtime to retained file inputs, or treating a one-shot command as a continuous service.

## Automation operating model

- `run-autonomous-implementation.sh` is available for future reviewed source handoffs or unblocked BWS-710 intake; it is not the selected controller after BWS-700 dependency-ready local completion.
- Broad audit and repair remains available through `run-bugfix-autopilot.sh` after the BWS-700 implementation route is no longer binding.
- `run-paper-autopilot.sh` is selected for the carry-forward `BWS-600` runtime-evidence parent because no dependency-ready BWS-700 implementation row remains.
- Standalone audit and paper controllers remain available only for their explicit bounded roles.

The protected wrapper and paper-controller integration phase is complete. The completed `BWS-700` dependency-ready local implementation state authorizes no protected automation changes. `docs/000_documentation_index.md` is the compact map for active docs, retained blueprints and archive material. Detailed execution blueprints are `docs/042` through `docs/046`, with machine-readable decomposition in `backlog/bws_remaining_safe_local_map.csv`. Superseded bootstrap ledgers `docs/014`, `docs/015` and `docs/017` are merged into `docs/000_documentation_index.md`.

Hardened parent controllers suppress child Telegram messages and send one final parent notification.
