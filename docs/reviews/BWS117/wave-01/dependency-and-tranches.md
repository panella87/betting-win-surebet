# BWS117 Wave 01 dependency graph and review-only fix tranches

## Dependency graph

```text
T01 migration source confinement and database role
  -> T09 migration status, lineage and serialization

T02 literal committed-object lock
  -> T03 immutable API cycle receipt and exact consumed snapshot
      -> T05 pagination, body bounds and cycle cancellation
      -> T06 identity/complete-set/provider-generation semantics
          -> T07 quote/evidence/capacity/fee composition
              -> T08 solver and scenario completeness

T03 + T06
  -> T10 durable create/finalize/lease/timestamp fencing
      -> T11 psql and service cancellation
      -> T12 private-paper and B1 aggregate crash recovery
      -> T13 retention and bounded reads

All source-fix implementation remains serialized. Wave 02 research may proceed in parallel.
```

## BWS-W1-T01

- Issue IDs: `BWS116-R03-001`
- Primary owner: `R03`
- Secondary areas: `R08, R10, R11`
- Likely files/components: ["packages/persistence/src/psql.ts", "packages/persistence/src/migrations.ts", "database role and migration entrypoints"]
- Prerequisites: ["Repository-confined migration authority decision", "Disposable PostgreSQL role proof"]
- Acceptance conditions: ["Only realpath-confined repository migrations accepted", "Database role cannot mutate outside surebet.*", "All unrecognized executable SQL families fail closed"]
- Focused tests: ["Traversal, symlink and absolute path rejection", "FUNCTION/DO/dynamic SQL rejection", "Cross-schema role proof"]
- Broader validation: ["Node 20 validation", "Disposable PostgreSQL migration suite"]
- Current-source re-verification required: `true`
- Explicitly unchanged areas: ["Current 12 migration bytes unless separately reviewed", "No runtime migration execution during review"]

## BWS-W1-T02

- Issue IDs: `BWS116-R01-001, BWS116-R01-002`
- Primary owner: `R01`
- Secondary areas: `R10, R11`
- Likely files/components: ["packages/upstream/src/upstream/betting-win-upstream-lock.ts", "scripts/run_betting_win_upstream_lock.mjs"]
- Prerequisites: ["Literal Git object-read contract"]
- Acceptance conditions: ["One literal commit/tree snapshot owns every derived field", "Replacement objects and concurrent ref movement cannot alter lock content"]
- Focused tests: ["refs/replace adversarial repository", "Branch movement between subprocesses", "worktree/bare controls"]
- Broader validation: ["Node 20 upstream-lock tests", "contract validators"]
- Current-source re-verification required: `true`
- Explicitly unchanged areas: ["betting-win checkout and source", "BWS API intake"]

## BWS-W1-T03

- Issue IDs: `BWS116-R01-003, BWS116-R01-004, BWS116-R01-005, BWS116-R01-010`
- Primary owner: `R01`
- Secondary areas: `R03, R07, R11, R12`
- Likely files/components: ["betting-win-query-client.ts", "upstream-api-convergence.ts", "convergence repositories and receipt schema"]
- Prerequisites: ["T02", "Canonical request/body receipt and temporal authority decision"]
- Acceptance conditions: ["Exact contract and page bytes form an ordered immutable cycle receipt", "Downstream consumes the exact converged record set", "All source/receive/verify/import/consume clocks remain distinct and bounded"]
- Focused tests: ["Page identity drift", "body mutation", "post-convergence upstream mutation", "restart and correction replay"]
- Broader validation: ["R03 transactional proof", "BWS-600 evidence handoff tests"]
- Current-source re-verification required: `true`
- Explicitly unchanged areas: ["betting-win implementation", "R02 formulas"]

## BWS-W1-T04

- Issue IDs: `BWS116-R01-009`
- Primary owner: `R01`
- Secondary areas: `R10, R11`
- Likely files/components: ["external-runtime-preflight.ts", "query-client URL validation"]
- Prerequisites: ["Explicit external destination policy"]
- Acceptance conditions: ["Equivalent local/private destinations, DNS rebinding and redirects fail closed", "Allowed origin and redirect policy remain explicit"]
- Focused tests: ["IPv4/IPv6/mapped loopback", "private ranges", "redirect and DNS-change cases"]
- Broader validation: ["Node 20 preflight suite"]
- Current-source re-verification required: `true`
- Explicitly unchanged areas: ["No provider contact", "No upstream service control"]

## BWS-W1-T05

- Issue IDs: `BWS116-R01-006, BWS116-R01-007, BWS116-R01-008`
- Primary owner: `R01`
- Secondary areas: `R06, R07, R11`
- Likely files/components: ["betting-win-query-client.ts", "upstream-api-convergence.ts", "upstream-transport-constants.ts"]
- Prerequisites: ["T03 cycle ownership model"]
- Acceptance conditions: ["Visited-cursor and non-progress proof", "Cycle-wide page/record/byte/deadline budget", "Streaming response bound and late-result fence"]
- Focused tests: ["Repeated/A-B-A cursors", "unbounded unique cursors", "oversized streamed body", "cancellation race"]
- Broader validation: ["Service lifecycle tests under R06"]
- Current-source re-verification required: `true`
- Explicitly unchanged areas: ["Persistence transaction design except handoff"]

## BWS-W1-T06

- Issue IDs: `BWS116-R02-001, BWS116-R02-002, BWS116-R02-007, BWS116-R02-008, BWS116-R02-009, BWS116-R02-013`
- Primary owner: `R02`
- Secondary areas: `R01, R03, R04, R05, R11`
- Likely files/components: ["identity/*", "complete-set.ts", "B1 grouping and venue-pair keys"]
- Prerequisites: ["Authoritative provider/generation and market-shape semantics from R01/T03"]
- Acceptance conditions: ["Outcome sets are mutually exclusive and exhaustive", "Identity encoding is injective and locale-independent", "Provider/generation and source-manifest identity remain bound"]
- Focused tests: ["Outcome semantic property tests", "delimiter/Unicode collisions", "numeric line normalization", "mixed manifest/generation", "locale matrix"]
- Broader validation: ["Node 20 strategy suite", "persistence/API migration checks"]
- Current-source re-verification required: `true`
- Explicitly unchanged areas: ["Upstream provider identity production"]

## BWS-W1-T07

- Issue IDs: `BWS116-R02-003, BWS116-R02-004, BWS116-R02-005, BWS116-R02-010, BWS116-R02-011, BWS116-R02-014`
- Primary owner: `R02`
- Secondary areas: `R01, R03, R04, R07, R11`
- Likely files/components: ["quotes/*", "economics/*", "B1 cross-venue derivation", "standard-binary derivation"]
- Prerequisites: ["T03", "T06", "Authoritative fee/capacity/increment contracts"]
- Acceptance conditions: ["One candidate-global snapshot window", "Selected odds value-bound to exact evidence", "Capacity and venue limits gate solver/net classification", "Fee basis and stake increments are explicit"]
- Focused tests: ["Cross-outcome skew", "detached quote mutation", "capacity/limit composition", "increment independence", "fee-basis union vectors"]
- Broader validation: ["Backtest and runtime evidence integration tests"]
- Current-source re-verification required: `true`
- Explicitly unchanged areas: ["No profitability or execution authority"]

## BWS-W1-T08

- Issue IDs: `BWS116-R02-006, BWS116-R02-012`
- Primary owner: `R02`
- Secondary areas: `R04, R11`
- Likely files/components: ["solver/b1-generalized-stake-vector.ts", "scenarios/scenario-cashflow.ts"]
- Prerequisites: ["T06", "T07"]
- Acceptance conditions: ["Solver finds every feasible bounded vector or returns a proven reason", "Scenario matrices are complete and rectangular"]
- Focused tests: ["Independent brute-force two/three-way oracle", "boundary vectors", "malformed matrix rejection"]
- Broader validation: ["Node 20 property and regression suite"]
- Current-source re-verification required: `true`
- Explicitly unchanged areas: ["Persistence and runtime orchestration"]

## BWS-W1-T09

- Issue IDs: `BWS116-R03-002, BWS116-R03-003, BWS116-R03-004`
- Primary owner: `R03`
- Secondary areas: `R06, R08, R09, R11`
- Likely files/components: ["migrations.ts", "database-lifecycle.ts", "surebet.schema_migrations"]
- Prerequisites: ["T01"]
- Acceptance conditions: ["Status is read-only", "Unknown applied rows fail closed or satisfy explicit compatibility", "One migrator owns transitions"]
- Focused tests: ["Empty DB read-only status", "newer/unknown ledger rows", "concurrent migrators and crash recovery"]
- Broader validation: ["Disposable PostgreSQL lifecycle suite"]
- Current-source re-verification required: `true`
- Explicitly unchanged areas: ["Backup/restore implementation except dependencies"]

## BWS-W1-T10

- Issue IDs: `BWS116-R03-006, BWS116-R03-007, BWS116-R03-008, BWS116-R03-009, BWS116-R03-010, BWS116-R03-017`
- Primary owner: `R03`
- Secondary areas: `R01, R02, R06, R11`
- Likely files/components: ["persistence repositories", "worker_job tables", "checkpoint tables"]
- Prerequisites: ["T01", "T03", "T06"]
- Acceptance conditions: ["Atomic create-or-compare", "All transitions carry expected state and lease fence", "Database time and monotonic epochs own leases", "Retry and timestamp invariants enforced"]
- Focused tests: ["Concurrent create/claim/finalize", "stale owner after takeover", "boundary expiry", "impossible timestamp constraints"]
- Broader validation: ["Multi-session PostgreSQL concurrency and restart suite"]
- Current-source re-verification required: `true`
- Explicitly unchanged areas: ["R02 mathematical decisions"]

## BWS-W1-T11

- Issue IDs: `BWS116-R03-005, BWS116-R03-011`
- Primary owner: `R03`
- Secondary areas: `R06, R08, R10, R11`
- Likely files/components: ["psql.ts", "scheduler/worker services"]
- Prerequisites: ["Explicit command and service deadline policy", "T10 lifecycle ownership"]
- Acceptance conditions: ["psql operations have bounded timeout/output and classified cancellation", "Service shutdown prevents late durable writes"]
- Focused tests: ["Sleeping fake psql", "blocked DB query shutdown", "late worker completion after timeout"]
- Broader validation: ["R06 service lifecycle review and Node 20 tests"]
- Current-source re-verification required: `true`
- Explicitly unchanged areas: ["No existing service is started/stopped during review"]

## BWS-W1-T12

- Issue IDs: `BWS116-R03-014, BWS116-R03-015, BWS116-R03-016`
- Primary owner: `R03`
- Secondary areas: `R02, R04, R06, R11`
- Likely files/components: ["private-paper runtime", "strategy ledger", "B1 backtest/observation repositories and jobs"]
- Prerequisites: ["T03", "T07", "T08", "T10"]
- Acceptance conditions: ["Previous state is reconstructed durably", "B1 parent/children repair after crash", "Observation and worker terminality share an aggregate completion protocol"]
- Focused tests: ["Crash between every commit boundary", "restart replay with changed source", "partial graph repair"]
- Broader validation: ["R04 simulation/settlement review and PostgreSQL restart suite"]
- Current-source re-verification required: `true`
- Explicitly unchanged areas: ["No live execution"]

## BWS-W1-T13

- Issue IDs: `BWS116-R03-012, BWS116-R03-013`
- Primary owner: `R03`
- Secondary areas: `R05, R07, R08, R11`
- Likely files/components: ["repository list methods", "retention planning and import references"]
- Prerequisites: ["T03", "T10"]
- Acceptance conditions: ["All reads are explicitly bounded and stably ordered", "Retention preserves or explicitly blocks every accepted reference"]
- Focused tests: ["Large-set pagination", "retention FK graph", "dry-run/apply parity"]
- Broader validation: ["R08 retention lifecycle and R05 projection tests"]
- Current-source re-verification required: `true`
- Explicitly unchanged areas: ["Current accepted evidence is not deleted"]
