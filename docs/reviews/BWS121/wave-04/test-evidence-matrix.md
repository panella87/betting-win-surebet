# Cumulative test and evidence matrix through Wave 04

- Records: `911`

## Categories

| Category | Records |
|---|---:|
| `api_or_projection` | 28 |
| `assurance_or_build` | 20 |
| `cancellation_or_timeout` | 29 |
| `concurrency_or_fencing` | 20 |
| `concurrency_or_ownership` | 49 |
| `controller_or_artifact` | 29 |
| `evidence_or_artifact` | 41 |
| `identity_or_determinism` | 13 |
| `mathematics_or_property` | 17 |
| `persistence_or_migration` | 61 |
| `release_or_deployment` | 27 |
| `restart_or_recovery` | 69 |
| `security_or_confinement` | 51 |
| `simulation_or_economics` | 32 |
| `unit_or_contract` | 186 |
| `unit_or_integration` | 229 |
| `upstream_integration` | 10 |

## Status

| Status | Records |
|---|---:|
| `CONFIRMED_TEST_GAP` | 16 |
| `EXPLICIT_REVIEW_TEST_GAP` | 79 |
| `IDENTIFIED_TEST_GAP` | 35 |
| `REQUIRED_NOT_RUN_BY_CONSOLIDATION` | 781 |

## Binding conclusion

The matrix is review evidence. R11-010 confirms that no current executable release gate consumes this ledger as defect-closure authority. An authorized remediation program must bind every blocking ID to exact source postimages, executed production-entrypoint tests, and environment receipts.
