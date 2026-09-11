# BWS117 Wave 01 test and evidence matrix

Total obligations: `177`.

| ID | Issues | Category | Environment | Production path | Status | Requirement |
|---|---|---|---|---|---|---|
| `BWS116-R01-001-TEST-01` | `BWS116-R01-001` | identity_or_determinism | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | true | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Production-entrypoint test with a disposable repository containing a replacement commit and replacement blob; lock generation must reject or produce the literal original graph. |
| `BWS116-R01-001-TEST-02` | `BWS116-R01-001` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | true | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Control test proving ordinary committed HEAD, worktree, and bare-repository forms remain accepted as intended. |
| `BWS116-R01-002-TEST-01` | `BWS116-R01-002` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | true | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Instrumented disposable-repository test that advances the branch between each Git subprocess and proves either stable old/new lock output or fail-closed behavior, never a mixed record. |
| `BWS116-R01-002-TEST-02` | `BWS116-R01-002` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Test uncommitted and untracked changes remain excluded without reading mutable worktree files. |
| `BWS116-R01-003-TEST-01` | `BWS116-R01-003` | upstream_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | true | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Production-path test where the fake external API changes after convergence; downstream must consume the first immutable cycle or explicitly start a second cycle. |
| `BWS116-R01-003-TEST-02` | `BWS116-R01-003` | restart_or_recovery | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Crash/restart test proving cycle identity and exact page set survive process restart. |
| `BWS116-R01-003-TEST-03` | `BWS116-R01-003` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Correction/deletion test proving no record can disappear between convergence proof and consumption. |
| `BWS116-R01-004-TEST-01` | `BWS116-R01-004` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Two bodies with identical required fields but different extra bytes must produce distinct receipts. |
| `BWS116-R01-004-TEST-02` | `BWS116-R01-004` | upstream_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Route/query/profile/generation/page substitutions must fail convergence even when record arrays match. |
| `BWS116-R01-004-TEST-03` | `BWS116-R01-004` | restart_or_recovery | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Restart must preserve and revalidate the ordered page receipt chain. |
| `BWS116-R01-005-TEST-01` | `BWS116-R01-005` | upstream_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Page-2 contract/profile/generation/commit/resource drift cases must fail without advancing the durable cursor. |
| `BWS116-R01-005-TEST-02` | `BWS116-R01-005` | restart_or_recovery | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Reordered and replayed pages must converge deterministically only when the ordered receipt chain is identical. |
| `BWS116-R01-006-TEST-01` | `BWS116-R01-006` | upstream_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Repeated cursor and two-node cursor cycle |
| `BWS116-R01-006-TEST-02` | `BWS116-R01-006` | upstream_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Empty page with nonterminal cursor |
| `BWS116-R01-006-TEST-03` | `BWS116-R01-006` | cancellation_or_timeout | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Unique cursor stream beyond page/record/byte/deadline budgets |
| `BWS116-R01-006-TEST-04` | `BWS116-R01-006` | restart_or_recovery | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Restart after bounded failure |
| `BWS116-R01-007-TEST-01` | `BWS116-R01-007` | cancellation_or_timeout | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Late fetch resolution after abort |
| `BWS116-R01-007-TEST-02` | `BWS116-R01-007` | upstream_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Multi-page worst-case retry budget |
| `BWS116-R01-007-TEST-03` | `BWS116-R01-007` | cancellation_or_timeout | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Cancellation between parse and persistence |
| `BWS116-R01-007-TEST-04` | `BWS116-R01-007` | cancellation_or_timeout | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | No duplicate cycle effects after caller timeout |
| `BWS116-R01-008-TEST-01` | `BWS116-R01-008` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Chunked body that crosses limit |
| `BWS116-R01-008-TEST-02` | `BWS116-R01-008` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Incorrect/missing Content-Length |
| `BWS116-R01-008-TEST-03` | `BWS116-R01-008` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Compressed expansion beyond limit |
| `BWS116-R01-008-TEST-04` | `BWS116-R01-008` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Abort cleanup and no partial persistence |
| `BWS116-R01-009-TEST-01` | `BWS116-R01-009` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | IPv6 loopback |
| `BWS116-R01-009-TEST-02` | `BWS116-R01-009` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | IPv4-mapped IPv6 loopback |
| `BWS116-R01-009-TEST-03` | `BWS116-R01-009` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | true | REQUIRED_NOT_RUN_BY_CONSOLIDATION | integer/legacy IPv4 forms accepted by runtime |
| `BWS116-R01-009-TEST-04` | `BWS116-R01-009` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | DNS to loopback/private |
| `BWS116-R01-009-TEST-05` | `BWS116-R01-009` | upstream_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | redirect to local target |
| `BWS116-R01-009-TEST-06` | `BWS116-R01-009` | upstream_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | userinfo and credential-bearing URL |
| `BWS116-R01-010-TEST-01` | `BWS116-R01-010` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Fresh receive + stale source |
| `BWS116-R01-010-TEST-02` | `BWS116-R01-010` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Future source time |
| `BWS116-R01-010-TEST-03` | `BWS116-R01-010` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Missing source time |
| `BWS116-R01-010-TEST-04` | `BWS116-R01-010` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Boundary skew |
| `BWS116-R01-010-TEST-05` | `BWS116-R01-010` | restart_or_recovery | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Restart/consumption after evidence expiry |
| `BWS116-R02-001-TEST-01` | `BWS116-R02-001` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Two-way home/home, away/away, yes/yes, no/no, over/over, under/under rejection tests. |
| `BWS116-R02-001-TEST-02` | `BWS116-R02-001` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Three-way duplicate-side and missing-draw tests. |
| `BWS116-R02-001-TEST-03` | `BWS116-R02-001` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Permutation/property tests proving exactly one terminal winner per valid market shape. |
| `BWS116-R02-002-TEST-01` | `BWS116-R02-002` | identity_or_determinism | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Mixed-provider and mixed-generation rejection tests. |
| `BWS116-R02-002-TEST-02` | `BWS116-R02-002` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Same venue ID under different providers collision tests. |
| `BWS116-R02-002-TEST-03` | `BWS116-R02-002` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Selected quote evidence retention tests. |
| `BWS116-R02-002-TEST-04` | `BWS116-R02-002` | identity_or_determinism | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Permutation tests across generation partitions. |
| `BWS116-R02-003-TEST-01` | `BWS116-R02-003` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Two- and three-way cross-outcome skew tests. |
| `BWS116-R02-003-TEST-02` | `BWS116-R02-003` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Boundary tests at window-1, window, and window+1. |
| `BWS116-R02-003-TEST-03` | `BWS116-R02-003` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Permutation tests proving identical global span and decision. |
| `BWS116-R02-004-TEST-01` | `BWS116-R02-004` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Detached-odds mutation rejection. |
| `BWS116-R02-004-TEST-02` | `BWS116-R02-004` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | OutcomeName/outcomeSide mutation rejection. |
| `BWS116-R02-004-TEST-03` | `BWS116-R02-004` | identity_or_determinism | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Provider-generation/evidence/time mutation rejection. |
| `BWS116-R02-004-TEST-04` | `BWS116-R02-004` | mathematics_or_property | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Exact derivation-to-net round-trip tests. |
| `BWS116-R02-005-TEST-01` | `BWS116-R02-005` | mathematics_or_property | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | End-to-end quote-depth-to-solver constraint tests. |
| `BWS116-R02-005-TEST-02` | `BWS116-R02-005` | mathematics_or_property | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Stake above quote, venue, market, and portfolio cap rejection tests. |
| `BWS116-R02-005-TEST-03` | `BWS116-R02-005` | mathematics_or_property | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Missing capacity/proxy and missing venue-limit tests. |
| `BWS116-R02-005-TEST-04` | `BWS116-R02-005` | mathematics_or_property | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Capacity changes after selection must invalidate the candidate. |
| `BWS116-R02-006-TEST-01` | `BWS116-R02-006` | mathematics_or_property | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Brute-force oracle comparison over small domains for 2-way and 3-way cases. |
| `BWS116-R02-006-TEST-02` | `BWS116-R02-006` | mathematics_or_property | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Unequal payout feasibility cases. |
| `BWS116-R02-006-TEST-03` | `BWS116-R02-006` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Positive target-net, one-unit residual, tight cap, and non-unit step cases. |
| `BWS116-R02-006-TEST-04` | `BWS116-R02-006` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Metamorphic scaling and permutation tests. |
| `BWS116-R02-006-TEST-05` | `BWS116-R02-006` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Proof that returned vectors satisfy all constraints. |
| `BWS116-R02-007-TEST-01` | `BWS116-R02-007` | identity_or_determinism | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Delimiter injection for every key constructor. |
| `BWS116-R02-007-TEST-02` | `BWS116-R02-007` | mathematics_or_property | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Round-trip/injectivity property tests over Unicode and control characters. |
| `BWS116-R02-007-TEST-03` | `BWS116-R02-007` | mathematics_or_property | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Cross-module consistency tests for candidate, constraint, fee, and scenario keys. |
| `BWS116-R02-008-TEST-01` | `BWS116-R02-008` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Equivalent textual forms tests. |
| `BWS116-R02-008-TEST-02` | `BWS116-R02-008` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Negative-zero normalization. |
| `BWS116-R02-008-TEST-03` | `BWS116-R02-008` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Scale/precision overflow and unsupported precision tests. |
| `BWS116-R02-008-TEST-04` | `BWS116-R02-008` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Spread sign/viewpoint inversion tests. |
| `BWS116-R02-009-TEST-01` | `BWS116-R02-009` | identity_or_determinism | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Mixed-manifest rejection. |
| `BWS116-R02-009-TEST-02` | `BWS116-R02-009` | identity_or_determinism | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Missing/unknown manifest rejection. |
| `BWS116-R02-009-TEST-03` | `BWS116-R02-009` | mathematics_or_property | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Single-manifest round trip. |
| `BWS116-R02-009-TEST-04` | `BWS116-R02-009` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Explicit synchronization receipt path only if separately authorized. |
| `BWS116-R02-010-TEST-01` | `BWS116-R02-010` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Pair-skew boundary tests. |
| `BWS116-R02-010-TEST-02` | `BWS116-R02-010` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Individually fresh but mutually stale rejection. |
| `BWS116-R02-010-TEST-03` | `BWS116-R02-010` | identity_or_determinism | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Same manifest with divergent timestamps. |
| `BWS116-R02-010-TEST-04` | `BWS116-R02-010` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Permutation invariance. |
| `BWS116-R02-011-TEST-01` | `BWS116-R02-011` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | min != step cases. |
| `BWS116-R02-011-TEST-02` | `BWS116-R02-011` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | min not divisible by step cases. |
| `BWS116-R02-011-TEST-03` | `BWS116-R02-011` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | step greater/less than min. |
| `BWS116-R02-011-TEST-04` | `BWS116-R02-011` | mathematics_or_property | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Capacity boundary after rounding. |
| `BWS116-R02-011-TEST-05` | `BWS116-R02-011` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Missing increment fail-closed test. |
| `BWS116-R02-012-TEST-01` | `BWS116-R02-012` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | One-leg/two-scenario rejection. |
| `BWS116-R02-012-TEST-02` | `BWS116-R02-012` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Duplicate cell and missing cell tests. |
| `BWS116-R02-012-TEST-03` | `BWS116-R02-012` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Extra leg/scenario rejection. |
| `BWS116-R02-012-TEST-04` | `BWS116-R02-012` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Permutation and rectangularity property tests. |
| `BWS116-R02-013-TEST-01` | `BWS116-R02-013` | identity_or_determinism | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Cross-locale golden tests. |
| `BWS116-R02-013-TEST-02` | `BWS116-R02-013` | identity_or_determinism | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Unicode normalization and code-unit ordering property tests. |
| `BWS116-R02-013-TEST-03` | `BWS116-R02-013` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Input permutation determinism tests. |
| `BWS116-R02-013-TEST-04` | `BWS116-R02-013` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Stable serialized artifact hash tests. |
| `BWS116-R02-014-TEST-01` | `BWS116-R02-014` | mathematics_or_property | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Stake, payout, profit, liability, maker/taker, fixed, minimum, maximum, and conditional fee cases. |
| `BWS116-R02-014-TEST-02` | `BWS116-R02-014` | unit_or_integration | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Scenario-only charge tests. |
| `BWS116-R02-014-TEST-03` | `BWS116-R02-014` | mathematics_or_property | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Unknown fee basis must block. |
| `BWS116-R02-014-TEST-04` | `BWS116-R02-014` | mathematics_or_property | NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Independent cash-flow oracle tests. |
| `BWS116-R03-001-TEST-01` | `BWS116-R03-001` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Absolute-path and ../ traversal rejection |
| `BWS116-R03-001-TEST-02` | `BWS116-R03-001` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Symlink escape rejection |
| `BWS116-R03-001-TEST-03` | `BWS116-R03-001` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | CREATE FUNCTION/PROCEDURE/TRIGGER/TYPE/EXTENSION and GRANT/REVOKE rejection |
| `BWS116-R03-001-TEST-04` | `BWS116-R03-001` | persistence_or_migration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | DO and dynamic SQL rejection |
| `BWS116-R03-001-TEST-05` | `BWS116-R03-001` | persistence_or_migration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Disposable PostgreSQL proof that the migration role cannot write outside surebet.* |
| `BWS116-R03-002-TEST-01` | `BWS116-R03-002` | persistence_or_migration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Status against an empty disposable database leaves schema/table counts unchanged |
| `BWS116-R03-002-TEST-02` | `BWS116-R03-002` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Status under a read-only role reports absence rather than failing or mutating |
| `BWS116-R03-002-TEST-03` | `BWS116-R03-002` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Repeated status is observationally idempotent |
| `BWS116-R03-003-TEST-01` | `BWS116-R03-003` | persistence_or_migration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Ledger with one unknown applied migration is incompatible |
| `BWS116-R03-003-TEST-02` | `BWS116-R03-003` | persistence_or_migration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Renamed migration and same-SQL/different-name cases |
| `BWS116-R03-003-TEST-03` | `BWS116-R03-003` | persistence_or_migration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Older binary against newer schema |
| `BWS116-R03-003-TEST-04` | `BWS116-R03-003` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Exact known set remains compatible |
| `BWS116-R03-004-TEST-01` | `BWS116-R03-004` | concurrency_or_fencing | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Two concurrent migrators against a disposable database |
| `BWS116-R03-004-TEST-02` | `BWS116-R03-004` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Second migrator waits and returns skipped rather than failing |
| `BWS116-R03-004-TEST-03` | `BWS116-R03-004` | restart_or_recovery | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Crash while holding the lock and subsequent recovery |
| `BWS116-R03-005-TEST-01` | `BWS116-R03-005` | persistence_or_migration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Sleeping fake psql is terminated at the configured budget |
| `BWS116-R03-005-TEST-02` | `BWS116-R03-005` | cancellation_or_timeout | DISPOSABLE_POSTGRESQL_AND_NODE20 | true | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Blocked database query does not prevent service shutdown indefinitely |
| `BWS116-R03-005-TEST-03` | `BWS116-R03-005` | persistence_or_migration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Timeout is distinct from SQL failure and authentication failure |
| `BWS116-R03-006-TEST-01` | `BWS116-R03-006` | concurrency_or_fencing | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Concurrent equal creates converge to one success result |
| `BWS116-R03-006-TEST-02` | `BWS116-R03-006` | concurrency_or_fencing | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Concurrent different creates return the typed conflict |
| `BWS116-R03-006-TEST-03` | `BWS116-R03-006` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Unique secondary identities such as fingerprint/report hash are classified deterministically |
| `BWS116-R03-006-TEST-04` | `BWS116-R03-006` | restart_or_recovery | DISPOSABLE_POSTGRESQL_AND_NODE20 | true | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Scheduler/job restart uses the production repository, not an in-memory fake |
| `BWS116-R03-007-TEST-01` | `BWS116-R03-007` | concurrency_or_fencing | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Two concurrent import finalizers with equal and conflicting outcomes |
| `BWS116-R03-007-TEST-02` | `BWS116-R03-007` | upstream_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Two API/export cursor advances from one expected cursor |
| `BWS116-R03-007-TEST-03` | `BWS116-R03-007` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Two scheduler instances advancing one checkpoint |
| `BWS116-R03-007-TEST-04` | `BWS116-R03-007` | concurrency_or_fencing | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Concurrent B1 complete versus block |
| `BWS116-R03-008-TEST-01` | `BWS116-R03-008` | concurrency_or_fencing | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Old worker completion after new claim |
| `BWS116-R03-008-TEST-02` | `BWS116-R03-008` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Heartbeat racing retry and replacement claim |
| `BWS116-R03-008-TEST-03` | `BWS116-R03-008` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Checkpoint racing success/dead-letter |
| `BWS116-R03-008-TEST-04` | `BWS116-R03-008` | concurrency_or_fencing | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Completion versus retry race |
| `BWS116-R03-008-TEST-05` | `BWS116-R03-008` | concurrency_or_fencing | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Exactly-once release of lease fields |
| `BWS116-R03-009-TEST-01` | `BWS116-R03-009` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Future-skew claim cannot claim not-yet-available work |
| `BWS116-R03-009-TEST-02` | `BWS116-R03-009` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Past-skew completion after real expiry is rejected |
| `BWS116-R03-009-TEST-03` | `BWS116-R03-009` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Exact expiry instant has one result |
| `BWS116-R03-009-TEST-04` | `BWS116-R03-009` | concurrency_or_fencing | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Heartbeat cannot regress last_heartbeat_at or lease_expires_at |
| `BWS116-R03-010-TEST-01` | `BWS116-R03-010` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Expired first attempt with remaining retries moves to retry_wait |
| `BWS116-R03-010-TEST-02` | `BWS116-R03-010` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Expired final attempt dead-letters |
| `BWS116-R03-010-TEST-03` | `BWS116-R03-010` | concurrency_or_fencing | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Concurrent reapers transition once |
| `BWS116-R03-010-TEST-04` | `BWS116-R03-010` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Unknown-side-effect policy remains fail-closed |
| `BWS116-R03-010-TEST-05` | `BWS116-R03-010` | concurrency_or_fencing | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Recovered job cannot be finalized by stale worker |
| `BWS116-R03-011-TEST-01` | `BWS116-R03-011` | concurrency_or_fencing | DISPOSABLE_POSTGRESQL_AND_NODE20 | true | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Never-settling worker handler exits service within timeout |
| `BWS116-R03-011-TEST-02` | `BWS116-R03-011` | concurrency_or_fencing | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | SIGTERM during handler stops lease renewal and prevents new durable writes |
| `BWS116-R03-011-TEST-03` | `BWS116-R03-011` | cancellation_or_timeout | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Late handler resolution cannot complete the job |
| `BWS116-R03-011-TEST-04` | `BWS116-R03-011` | cancellation_or_timeout | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Scheduler pass timeout returns without awaiting the pass |
| `BWS116-R03-011-TEST-05` | `BWS116-R03-011` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Timer/listener cleanup occurs exactly once |
| `BWS116-R03-012-TEST-01` | `BWS116-R03-012` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Large-cardinality query plans use indexes and fixed limits |
| `BWS116-R03-012-TEST-02` | `BWS116-R03-012` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Reaper handles at most batchSize and is repeatable |
| `BWS116-R03-012-TEST-03` | `BWS116-R03-012` | concurrency_or_fencing | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Stable keyset ordering under concurrent inserts |
| `BWS116-R03-012-TEST-04` | `BWS116-R03-012` | persistence_or_migration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | psql output remains below configured maximum |
| `BWS116-R03-013-TEST-01` | `BWS116-R03-013` | upstream_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | API-referenced import is excluded |
| `BWS116-R03-013-TEST-02` | `BWS116-R03-013` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Export-referenced import is excluded |
| `BWS116-R03-013-TEST-03` | `BWS116-R03-013` | concurrency_or_fencing | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Concurrent new reference between plan and apply is preserved |
| `BWS116-R03-013-TEST-04` | `BWS116-R03-013` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Plan/apply deletedCount and protectedCount reconcile |
| `BWS116-R03-014-TEST-01` | `BWS116-R03-014` | persistence_or_migration | DISPOSABLE_POSTGRESQL_AND_NODE20 | true | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Crash after runtime result, after ledger insert, and after final checkpoint |
| `BWS116-R03-014-TEST-02` | `BWS116-R03-014` | persistence_or_migration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Equal retry returns the same ledger/result |
| `BWS116-R03-014-TEST-03` | `BWS116-R03-014` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Changed upstream bytes for same cycle are rejected |
| `BWS116-R03-014-TEST-04` | `BWS116-R03-014` | persistence_or_migration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Fresh process reconstructs previousState from PostgreSQL |
| `BWS116-R03-015-TEST-01` | `BWS116-R03-015` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Fault after parent insert |
| `BWS116-R03-015-TEST-02` | `BWS116-R03-015` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Fault after each candidate and simulation insert boundary |
| `BWS116-R03-015-TEST-03` | `BWS116-R03-015` | restart_or_recovery | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Replay repairs or rejects partial graph |
| `BWS116-R03-015-TEST-04` | `BWS116-R03-015` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Readers never expose incomplete run as complete |
| `BWS116-R03-015-TEST-05` | `BWS116-R03-015` | concurrency_or_fencing | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Concurrent equal creates converge |
| `BWS116-R03-016-TEST-01` | `BWS116-R03-016` | restart_or_recovery | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Crash after observation complete before job complete |
| `BWS116-R03-016-TEST-02` | `BWS116-R03-016` | restart_or_recovery | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Crash after observation block before job dead-letter |
| `BWS116-R03-016-TEST-03` | `BWS116-R03-016` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Retry converges without rerunning backtest |
| `BWS116-R03-016-TEST-04` | `BWS116-R03-016` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Conflicting retained terminal payload is rejected |
| `BWS116-R03-017-TEST-01` | `BWS116-R03-017` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Import requested/start/complete permutations |
| `BWS116-R03-017-TEST-02` | `BWS116-R03-017` | concurrency_or_fencing | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Worker claim/heartbeat/checkpoint/complete regression |
| `BWS116-R03-017-TEST-03` | `BWS116-R03-017` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | B1 cycle completion before start |
| `BWS116-R03-017-TEST-04` | `BWS116-R03-017` | unit_or_integration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Boundary equality cases |
| `BWS116-R03-017-TEST-05` | `BWS116-R03-017` | persistence_or_migration | DISPOSABLE_POSTGRESQL_AND_NODE20 | false | REQUIRED_NOT_RUN_BY_CONSOLIDATION | Migration of any existing invalid rows is fail-closed and reported |
| `BWS116-R01-TG-001` | `BWS116-R01-001,BWS116-R01-002,BWS116-R01-003,BWS116-R01-004,BWS116-R01-005,BWS116-R01-006,BWS116-R01-007,BWS116-R01-008,BWS116-R01-009,BWS116-R01-010` | concurrency_or_fencing | AS_DECLARED_BY_OWNING_REVIEW | true | CONFIRMED_TEST_GAP | Focused tests do not adversarially exercise the full production entrypoint for identity drift and lifecycle races |
| `BWS116-R02-TG-001` | `` | unit_or_integration | AS_DECLARED_BY_OWNING_REVIEW | true | CONFIRMED_TEST_GAP | No outcome-semantic exclusivity/exhaustiveness property tests |
| `BWS116-R02-TG-002` | `` | identity_or_determinism | AS_DECLARED_BY_OWNING_REVIEW | true | CONFIRMED_TEST_GAP | No provider/generation partition tests for B1 equivalence and quote selection |
| `BWS116-R02-TG-003` | `` | unit_or_integration | AS_DECLARED_BY_OWNING_REVIEW | true | CONFIRMED_TEST_GAP | No candidate-global quote synchronization tests |
| `BWS116-R02-TG-004` | `` | unit_or_integration | AS_DECLARED_BY_OWNING_REVIEW | true | CONFIRMED_TEST_GAP | No adversarial mutation test binds selected quote values to synchronized evidence |
| `BWS116-R02-TG-005` | `` | mathematics_or_property | AS_DECLARED_BY_OWNING_REVIEW | true | CONFIRMED_TEST_GAP | Capacity primitives are unit-tested but not composed into the solver/net/backtest path |
| `BWS116-R02-TG-006` | `` | mathematics_or_property | AS_DECLARED_BY_OWNING_REVIEW | true | CONFIRMED_TEST_GAP | No independent brute-force oracle for generalized solver completeness |
| `BWS116-R02-TG-007` | `` | identity_or_determinism | AS_DECLARED_BY_OWNING_REVIEW | true | CONFIRMED_TEST_GAP | No delimiter injectivity, Unicode, or cross-locale determinism tests |
| `BWS116-R02-TG-008` | `` | identity_or_determinism | AS_DECLARED_BY_OWNING_REVIEW | true | CONFIRMED_TEST_GAP | Standard lane lacks mixed-manifest, pair-skew, independent-increment, and malformed-matrix tests |
| `BWS116-R02-TG-009` | `` | mathematics_or_property | AS_DECLARED_BY_OWNING_REVIEW | true | CONFIRMED_TEST_GAP | Fee tests mirror the only implemented stake-bps formula rather than independently covering fee-basis unions |
| `BWS116-R03-TG-001` | `` | persistence_or_migration | AS_DECLARED_BY_OWNING_REVIEW | true | CONFIRMED_TEST_GAP | Migration tests do not exercise repository escape or unrecognized executable SQL |
| `BWS116-R03-TG-002` | `` | persistence_or_migration | AS_DECLARED_BY_OWNING_REVIEW | true | CONFIRMED_TEST_GAP | PostgreSQL idempotency proof is sequential and skipped without explicit disposable configuration |
| `BWS116-R03-TG-003` | `` | concurrency_or_fencing | AS_DECLARED_BY_OWNING_REVIEW | true | CONFIRMED_TEST_GAP | Worker tests do not model stale completion after lease transition or takeover |
| `BWS116-R03-TG-004` | `` | restart_or_recovery | AS_DECLARED_BY_OWNING_REVIEW | true | CONFIRMED_TEST_GAP | Standard private-paper restart tests reuse in-memory previousState rather than reconstructing production durable state |
| `BWS116-R03-TG-005` | `` | unit_or_integration | AS_DECLARED_BY_OWNING_REVIEW | true | CONFIRMED_TEST_GAP | B1 persistence tests do not inject failure between parent and child commits |
| `BWS116-R03-TG-006` | `` | concurrency_or_fencing | AS_DECLARED_BY_OWNING_REVIEW | true | CONFIRMED_TEST_GAP | Service timeout and shutdown tests use promises that are eventually released |

## Environment gates

- Canonical Node 20.20.2 must be used for implementation acceptance.
- Disposable PostgreSQL is required for migration, isolation, concurrency, role, crash, and retention proof.
- External betting-win runtime and provider evidence remain prohibited until independently authorized and accepted.
- Helper-only or fixture-only passes do not close production-entrypoint obligations.
