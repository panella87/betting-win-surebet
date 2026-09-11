# BWS117 Wave 01 area coverage

| Area | Scope | Original baseline | Current compatibility | Confirmed | Severity | Total records |
|---|---|---|---|---:|---|---:|
| R01 | Upstream lock, API intake, convergence, provenance and external-runtime gates | BWS116 | COMPATIBLE_AND_UNAFFECTED_BY_DELTA | 10 | P1=7, P2=3 | 16 |
| R02 | Surebet identity, quote validity, economics, opportunity derivation and solver correctness | BWS116 | COMPATIBLE_AND_UNAFFECTED_BY_DELTA | 14 | P1=14 | 43 |
| R03 | PostgreSQL, migrations, durable jobs, scheduler checkpoints and private-paper state | BWS116 | COMPATIBLE_AND_UNAFFECTED_BY_DELTA | 17 | P0=1, P1=13, P2=3 | 45 |

All three coverage TSVs contain 618 unique rows and exactly match the BWS117 member path, size, and SHA-256 set.

## Planned remaining sectors

| Wave | Areas | Scope |
|---|---|---|
| 02 | R04, R05, R06 | Simulation/backtest/settlement/reporting; BWS API and cockpit; long-running service lifecycle |
| 03 | R07, R08, R09 | Evidence and BWS-600 truth; database lifecycle; release/upgrade/rollback/soak |
| 04 | R10, R11, R12 | Configuration and confinement; tests/validators/manifest; controllers and artifact lifecycle |
