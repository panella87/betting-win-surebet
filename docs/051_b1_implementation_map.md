# 051 - B1 implementation map

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
implementation_queue=backlog/bws_b1_cross_venue_implementation.csv
implementation_map=backlog/bws_b1_cross_venue_map.csv
selected_controller=run-autonomous-implementation.sh
largest_safe_cohesive_tranche=BWS-700_through_BWS-820_local_offline_surfaces
real_upstream_intake_gate=BWS-710_BLOCKED_UNTIL_BETTING_WIN_CONTRACT
```

## Files and areas to add during implementation

Contracts:

```text
packages/bootstrap/src/contracts/b1-local-types.ts
packages/bootstrap/src/contracts/betting-win-b1-resource-records.ts
```

Identity:

```text
packages/bootstrap/src/identity/b1-market-equivalence.ts
packages/bootstrap/src/identity/b1-selection-equivalence.ts
packages/bootstrap/src/identity/b1-venue-pair-key.ts
```

Quotes and economics:

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

Opportunity and solver:

```text
packages/bootstrap/src/opportunity/b1-market-cluster.ts
packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts
packages/bootstrap/src/opportunity/b1-gross-spread.ts
packages/bootstrap/src/solver/b1-generalized-stake-vector.ts
packages/bootstrap/src/solver/b1-rounding.ts
packages/bootstrap/src/scenarios/b1-terminal-scenario.ts
packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts
```

Simulation and reporting:

```text
packages/bootstrap/src/simulation/b1-leg-completion.ts
packages/bootstrap/src/simulation/b1-rejection-model.ts
packages/bootstrap/src/simulation/b1-timeout-model.ts
packages/bootstrap/src/simulation/b1-partial-fill.ts
packages/bootstrap/src/simulation/b1-residual-exposure.ts
packages/bootstrap/src/simulation/b1-settlement-replay.ts
packages/bootstrap/src/simulation/b1-void-rule-replay.ts
packages/bootstrap/src/reporting/b1-false-positive-report.ts
packages/bootstrap/src/reporting/b1-backtest-report.ts
packages/bootstrap/src/reporting/b1-opportunity-report.ts
packages/bootstrap/src/reporting/b1-private-run-report.ts
```

Backtest, runtime and operations:

```text
packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts
packages/bootstrap/src/cli/b1-cross-venue-backtest.ts
packages/bootstrap/src/runtime/b1-private-observation-runtime.ts
packages/bootstrap/src/operations/b1-runtime-evidence.ts
packages/bootstrap/src/cli/bws-b1-runtime-evidence.ts
```

Persistence:

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
```

API and cockpit:

```text
packages/bootstrap/src/api/bws-read-only-query-service.ts
packages/bootstrap/src/api/bws-read-only-query-http.ts
apps/web/src/api/contracts.ts
apps/web/src/api/models.ts
apps/web/src/app/router.tsx
apps/web/src/components_or_current_cockpit_pages
```

## Validation target

The implementation controller should introduce or expand:

```text
scripts/validate_bws_b1_upstream_contract.py
scripts/validate_bws_b1_no_execution.py
scripts/validate_bws_b1_acceptance.py
tests/b1-market-equivalence.test.ts
tests/b1-selection-equivalence.test.ts
tests/b1-quote-synchronization.test.ts
tests/b1-gross-spread.test.ts
tests/b1-net-spread.test.ts
tests/b1-generalized-stake-vector.test.ts
tests/b1-rejection-model.test.ts
tests/b1-residual-exposure.test.ts
tests/b1-settlement-replay.test.ts
tests/b1-cross-venue-backtest.test.ts
tests/b1-persistence.test.ts
tests/b1-read-only-api.test.ts
tests/b1-operator-cockpit.test.ts
```

`npm run validate:bws-b1` exists initially as an authority/boundary validator. The implementation controller may expand it as source files land.

## Execution invariant

```text
BWS-900=parked
execution=prohibited
```
