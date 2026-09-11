# BWS117 Wave 01 authority and invariant map

| Category | Primary owner | Binding invariant |
|---|---|---|
| Current task/controller | docs/automation/current-implementation-task.md | BWS-600 remains externally blocked; no implementation queue |
| Detailed operational state | docs/repo_status_current.md | Review docs cannot promote readiness |
| Cross-repository contract | docs/002_dependency_contract_with_betting_win.md / R01 | Only accepted read-only API handoff; no BW mutation |
| Upstream lock and cycle receipt | R01 | One literal commit and immutable ordered page/body receipt |
| Identity and complete-set semantics | R02 | Mutually exclusive/exhaustive outcomes; provider/generation/source bound |
| Quote, fee, capacity and solver semantics | R02 | One global snapshot; exact evidence; explicit units and constraints |
| Schema and migration authority | R03 | Only repository-confined surebet.* migrations under restricted role |
| Durable operation ownership | R03 | Atomic create/compare, state predicate and monotonic lease fence |
| Checkpoint and restart authority | R03 | Durable expected-state CAS and exact aggregate completion |
| Simulation/settlement/backtest | R04 next | Must consume R01-R03 authoritative records without redefining them |
| BWS API and cockpit projection | R05 next | Projection cannot manufacture currentness, profit, completion or readiness |
| Service/process lifecycle | R06 next | Bounded start/run/status/stop, cancellation, drain and late-result fencing |
| Evidence and BWS-600 publication | R07 future | Artifacts reflect exact runtime and accepted cycle identities |
| Database lifecycle | R08 future | Backup/restore/retention/migration operations preserve R03 authority |
| Release/upgrade/rollback | R09 future | Release proof cannot override unresolved P0/P1 defects |
| Configuration and confinement | R10 future | Missing/null/blank/zero/false remain distinct; no path or secret fallback |
| Tests/validators/manifest | R11 future | Production entrypoints, Node 20, PostgreSQL, and exact source manifest truth |
| Controllers/artifacts | R12 future | Automation cannot turn failed or partial work into completion |

## Global precedence

```text
CURRENT_REPOSITORY_BYTES > CURRENT_TASK_AND_STATUS_AUTHORITY > REVIEW_REPORTS > HISTORICAL_ARTIFACTS > TRANSCRIPT
REVIEW_COMPLETE != IMPLEMENTATION_COMPLETE
STATIC_VALIDATION != RUNTIME_ACCEPTANCE
NO_LIVE_OPERATION_AND_NO_BW_MUTATION_HOLDS_REMAIN_BINDING
```
