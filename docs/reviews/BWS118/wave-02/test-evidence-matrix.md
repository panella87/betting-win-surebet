# BWS118 Wave 02 cumulative test and evidence matrix

- Total records: `411`.
- Wave 01 preserved records: `177`.
- Wave 02 additions: `234`.

| Category | Records |
|---|---:|
| api_or_projection | 21 |
| cancellation_or_timeout | 22 |
| concurrency_or_fencing | 20 |
| concurrency_or_ownership | 31 |
| evidence_or_artifact | 11 |
| identity_or_determinism | 13 |
| mathematics_or_property | 17 |
| persistence_or_migration | 19 |
| restart_or_recovery | 24 |
| security_or_confinement | 1 |
| simulation_or_economics | 32 |
| unit_or_contract | 106 |
| unit_or_integration | 84 |
| upstream_integration | 10 |

## Priority production-path evidence

1. Completion event identity, actual-fill economics, lifecycle correction/finality, and cross-stage chronology.
2. API cursor/snapshot/query receipts, exhaustive runtime-cycle pagination, and browser request-generation ownership.
3. Atomic process ownership, executable-generation binding, typed readiness, shutdown/drain, PID fencing, listener cancellation, and terminal evidence.
4. Canonical Node 20.20.2 reruns.
5. Disposable PostgreSQL multi-session tests and isolated systemd/process integration where required.

The full machine-readable record set is in `test-evidence-matrix.json`. Existing false-green tests remain evidence of missing adversarial coverage, not acceptance.
