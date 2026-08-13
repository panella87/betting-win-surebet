# 051 - B1 implementation map

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
completed_implementation_queue=backlog/bws_b1_cross_venue_implementation.csv
completed_implementation_map=backlog/bws_b1_cross_venue_map.csv
implementation_queue_status=COMPLETED_DEPENDENCY_READY
selected_controller=run-paper-autopilot.sh
real_upstream_intake_gate=BWS-710_BLOCKED_UNTIL_BETTING_WIN_CONTRACT
broad_bugfix_campaign_status=COMPLETED_AND_ACCEPTED
```

## Current state

The dependency-ready local B1 implementation is complete through BWS-820. This file is retained as source and validation traceability, not as an open implementation queue. BWS-710 remains blocked on the accepted real `betting-win.b1_multi_venue_markets.v1` API contract; BWS-830 and BWS-840 remain parked.

## Implemented contracts and identity

```text
packages/bootstrap/src/contracts/b1-local-types.ts
packages/bootstrap/src/contracts/betting-win-b1-resource-records.ts
packages/bootstrap/src/identity/b1-market-equivalence.ts
packages/bootstrap/src/identity/b1-selection-equivalence.ts
packages/bootstrap/src/identity/b1-venue-pair-key.ts
```

## Implemented quotes and economics

```text
packages/bootstrap/src/quotes/b1-quote-synchronization.ts
packages/bootstrap/src/quotes/b1-venue-limit-model.ts
packages/bootstrap/src/quotes/b1-capacity-model.ts
packages/bootstrap/src/quotes/b1-quote-age-penalty.ts
packages/bootstrap/src/economics/b1-net-spread.ts
packages/bootstrap/src/economics/b1-fee-matrix.ts
packages/bootstrap/src/economics/b1-capital-lock.ts
packages/bootstrap/src/economics/b1-lateness-penalty.ts
```

## Implemented opportunity, solver and scenarios

```text
packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts
packages/bootstrap/src/opportunity/b1-gross-spread.ts
packages/bootstrap/src/solver/b1-generalized-stake-vector.ts
packages/bootstrap/src/solver/b1-rounding.ts
packages/bootstrap/src/scenarios/b1-terminal-scenario.ts
packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts
```

Market clustering is represented by deterministic keys and grouping inside the implemented identity/derivation surfaces; it is not a separate `b1-market-cluster.ts` file.

## Implemented simulation, reporting and backtest

```text
packages/bootstrap/src/simulation/b1-leg-completion.ts
packages/bootstrap/src/simulation/b1-residual-exposure.ts
packages/bootstrap/src/simulation/b1-settlement-replay.ts
packages/bootstrap/src/simulation/b1-void-rule-replay.ts
packages/bootstrap/src/reporting/b1-false-positive-report.ts
packages/bootstrap/src/reporting/b1-backtest-report.ts
packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts
packages/bootstrap/src/operations/b1-runtime-evidence.ts
```

Rejection, timeout and partial-fill behavior is consolidated into the implemented leg-completion and residual-exposure surfaces. B1 reports are assembled through the backtest/false-positive reporting and bounded read-only API/cockpit surfaces rather than separate opportunity/private-run report files.

## Implemented persistence, workers, API and cockpit

```text
database/migrations/surebet/008_create_b1_upstream_convergence_checkpoints.sql
database/migrations/surebet/009_create_b1_backtest_runs.sql
database/migrations/surebet/010_create_b1_candidate_snapshots.sql
database/migrations/surebet/011_create_b1_simulation_results.sql
database/migrations/surebet/012_create_b1_private_observation_cycles.sql
packages/persistence/src/repositories/b1-upstream-convergence-repository.ts
packages/persistence/src/repositories/b1-backtest-run-repository.ts
packages/persistence/src/repositories/b1-private-observation-repository.ts
packages/bootstrap/src/workers/b1-private-observation-jobs.ts
packages/bootstrap/src/api/bws-read-only-query-service.ts
packages/bootstrap/src/api/bws-read-only-query-http.ts
apps/web/src/api/contracts.ts
apps/web/src/api/models.ts
apps/web/src/app/router.tsx
```

## Current validation surface

```text
scripts/validate_bws_b1_authority.py
scripts/validate_bws_b1_boundary.py
scripts/validate_bws_b1_acceptance.py
npm run validate:bws-b1
```

The compiled B1 test set includes resource records, equivalence, quote synchronization, gross/net economics, derivation, solver/scenarios, rejection/residual/settlement, false positives, backtesting, persistence, private observation jobs, read-only API, cockpit and runtime-evidence classification.

## Runtime and execution invariants

```text
BWS-600=external_runtime_evidence_selected
BWS-710=blocked_until_real_upstream_contract
BWS-830=parked
BWS-840=parked
BWS-900=parked
provider_connections=prohibited
execution=prohibited
```
