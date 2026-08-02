# 047 - B1 cross-venue offline falsification program

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
parent_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
research_authority=B1_CROSS_VENUE_ARBITRAGE_OFFLINE_FALSIFICATION
operator_approval=explicit_2026_08_02
current_task=BWS-700
current_task_status=READY_FOR_IMPLEMENTATION
active_implementation_queue=backlog/bws_b1_cross_venue_implementation.csv
safe_local_terminal_gate=BWS-599
external_runtime_gate=BWS-600
execution_gate=BWS-900_PARKED
selected_controller=run-autonomous-implementation.sh
```

## Purpose

Open a reviewed post-current-state implementation authority for the research-backed B1 track: deterministic cross-venue arbitrage offline falsification. This program extends the accepted same-venue standard-binary complete-set platform without reopening `BWS-100` through `BWS-599` and without weakening the external `BWS-600` runtime-evidence gate.

The implementation target is not live betting. It is an offline/private-paper falsification engine that consumes only accepted `betting-win` read-only B1 data, derives gross and net deterministic opportunities, simulates practical fill failures and false positives, and reports whether cross-venue edge survives conservative assumptions.

## Scope owned by betting-win-surebet

```text
owns=cross_venue_arbitrage_logic
owns=market_selection_equivalence_consumption
owns=gross_to_net_spread_calculation
owns=stake_vector_solving
owns=fill_rejection_timeout_simulation
owns=residual_exposure_and_settlement_replay
owns=deterministic_offline_falsification
owns=private_paper_observation_after_acceptance_only
owns=surebet_owned_persistence_and_read_only_reporting
```

BWS must reuse the accepted foundation:

```text
reuse=BWS-100_through_BWS-599_validated_platform
reuse=api_only_betting_win_upstream_contract
reuse=immutable_snapshot_and_manifest_discipline
reuse=fee_cost_quote_freshness_capacity_primitives
reuse=stake_vector_and_scenario_cashflow_patterns
reuse=non_atomic_completion_partial_fill_residual_exposure_settlement_replay_patterns
reuse=private_runtime_workers_read_only_api_cockpit_evidence_recovery_patterns
```

## Explicit non-scope

```text
provider_connections=prohibited
provider_credentials=prohibited
raw_provider_ingestion=prohibited
canonical_provider_history=owned_by_betting-win
canonical_event_market_selection_truth=owned_by_betting-win
betting_win_core_writes=prohibited
betting_win_checkout_mutation=prohibited
file_export_runtime_fallback=prohibited
fixture_or_mock_runtime_fallback=prohibited
execution=prohibited
public_signals=prohibited
profitability_claims=prohibited
shared_bankroll_with_betting-win-betting=prohibited
```

## Binding implementation sequence

The queue is `backlog/bws_b1_cross_venue_implementation.csv`. The controller should implement the largest safe cohesive tranche that remains dependency-ready, while keeping real upstream API intake and private observation blocked until the required upstream B1 contract exists.

```text
BWS-700  B1 authority, docs, backlog and validators
BWS-705  B1 local contract/type skeleton and deterministic fixture contract
BWS-710  real betting-win B1 read-only API intake, blocked until upstream contract exists
BWS-720  cross-venue market and selection equivalence
BWS-730  quote synchronization, freshness, capacity and venue limits
BWS-740  cross-venue gross opportunity derivation
BWS-750  net economics, fees, quote-age penalties and capital lock
BWS-760  generalized stake vector and scenario cash-flow solver
BWS-770  fill, rejection, timeout and residual-exposure simulation
BWS-780  settlement replay, void-rule mismatch and false-positive analysis
BWS-790  deterministic B1 offline backtest/falsification runner
BWS-800  B1 persistence, workers and private observation ledger
BWS-810  B1 read-only API, cockpit and reporting
BWS-820  B1 runtime evidence, acceptance gates and kill criteria
BWS-830  F probability-constraint arbitrage design stub only, parked
BWS-840  C/G offline microstructure design stubs only, parked
```

## Implementation rule

`BWS-710` is the real upstream API gate. It must remain blocked until `betting-win` exposes `betting-win.b1_multi_venue_markets.v1` or an accepted equivalent read-only API. The controller may still implement local B1 contracts, equivalence, gross/net math, solver, simulation, deterministic backtest structure, persistence schema and private read-only reporting against deterministic repo-local fixtures. Those fixtures are not runtime evidence and must not be treated as proof of upstream readiness, profitability or live readiness.

## Acceptance for this authority

```text
fresh_ai_can_identify_active_b1_queue=yes
bws600_external_runtime_gate_preserved=yes
bws900_execution_gate_parked=yes
no_provider_or_execution_paths=yes
upstream_b1_dependency_explicit=yes
validate_bws_b1_authority=pass
validate_bws_b1_boundary=pass
```
