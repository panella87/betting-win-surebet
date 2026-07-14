# Current implementation task

Repository: `betting-win-surebet`.

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-120
```

Objective: implement the complete safe local BWS application on top of the read-only betting-win platform. Use `backlog/bws_full_implementation.csv` as the binding dependency ledger. Start with the first dependency-ready `PENDING` row, currently `BWS-120`, and continue across validated cycles while safe local work remains through `BWS-510`.

Before editing:

1. Read `AGENTS.md`, `docs/repo_status_current.md`, `docs/MASTER_PLAN.md`, `docs/028_full_implementation_program.md`, `docs/029_full_implementation_task_ledger.md`, and `docs/030_upstream_compatibility_and_pin_contract.md`.
2. Inspect current BWS source/tests.
3. Verify the validated `BWS-100` upstream lock contract remains intact, including `BETTING_WIN_REPO_PATH`, the committed-`HEAD` lock file, and the no-fallback boundary.
4. Inspect the validated workspace/package layout and plan the smallest persistence slice that preserves tested bootstrap behavior.

Current first task:

```text
id=BWS-120
objective=create surebet-owned PostgreSQL schema, migrations and repositories
```

Required BWS-120 outcomes:

- create only `surebet.*` PostgreSQL persistence owned by BWS with no writes to betting-win `core.*`;
- add migrations and repositories that fail closed on missing or invalid required persistence configuration;
- prove disposable PostgreSQL migration, restart, and idempotency coverage for the migrated `surebet.*` state;
- preserve the validated `BWS-110` workspace packages and compatibility coverage while introducing persistence;
- keep the `BWS-100` committed-`HEAD` upstream lock contract intact with no workspace fallback or silent dependency shortcuts;
- update the task ledger only after all required proof passes.

Validated `BWS-100` and `BWS-110` carry-forward requirements remain binding during `BWS-120`: prove the betting-win committed HEAD remains unchanged during verification, allow no placeholder fields in the upstream lock output, preserve the workspace/package migration, and use no clone or temporary worktree.

Continuation rules:

```text
CONTINUE_REQUIRED=yes  while any dependency-ready safe local row through BWS-510 remains PENDING
AUTONOMOUS_GOAL_COMPLETE=yes  only after every safe local row through BWS-510 is VALIDATED
BLOCKED=yes  only for a concrete unrecoverable repository state or exact missing external evidence
```

Constraints:

```text
betting_win_checkout=read_only
provider_connections=prohibited
provider_credentials=prohibited
direct_betting_win_core_writes=prohibited
execution=prohibited
public_signals=prohibited
profitability_claims=prohibited
automatic_upstream_mode_fallback=prohibited
floating_point_money=prohibited
protected_automation_files=read_only
```

Do not modify the betting-win checkout. Use no clone or temporary worktree. Do not copy provider adapters. Do not invent a commit, schema, endpoint, package, provider capability, or acceptance result. Build all safe local code, database, API, worker, and UI layers permitted by the ledger before declaring an external blocker.
