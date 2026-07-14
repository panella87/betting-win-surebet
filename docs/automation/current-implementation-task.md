# Current implementation task

Repository: `betting-win-surebet`.

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-100
```

Objective: implement the complete safe local BWS application on top of the read-only betting-win platform. Use `backlog/bws_full_implementation.csv` as the binding dependency ledger. Start with the first dependency-ready `PENDING` row, currently `BWS-100`, and continue across validated cycles while safe local work remains through `BWS-510`.

Before editing:

1. Read `AGENTS.md`, `docs/repo_status_current.md`, `docs/MASTER_PLAN.md`, `docs/028_full_implementation_program.md`, `docs/029_full_implementation_task_ledger.md`, and `docs/030_upstream_compatibility_and_pin_contract.md`.
2. Inspect current BWS source/tests.
3. Resolve `BETTING_WIN_REPO_PATH` from the inherited environment and inspect that checkout read-only.
4. Verify the actual betting-win commit, Git tree, package version, and required capabilities.

Current first task:

```text
id=BWS-100
objective=implement exact betting-win upstream lock and compatibility verification
```

Required BWS-100 outcomes:

- fail fast when `BETTING_WIN_REPO_PATH` is missing, outside the allowed development boundary, unreadable, not a betting-win checkout, dirty, or lacks Git-tree/package evidence;
- generate `config/betting-win.upstream.lock.json` from the real checkout with no placeholder fields;
- record `commitSha`, `gitTreeSha`, and `trackedTreeListingSha256`, where the tracked-tree hash is SHA-256 over the exact bytes emitted by `git ls-tree -r --full-tree HEAD`;
- validate it against `schemas/betting-win-upstream-lock.v1.schema.json`;
- verify `betting-win.strategy-export.v1`, `betting-win-strategy-export.v1`, `surebet_standard_binary_v0`, and required packages/capabilities;
- prove the betting-win checkout remains unchanged;
- add focused success, mismatch, dirty/invalid checkout, and tamper tests;
- update the task ledger only after all required proof passes.

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

Do not modify the betting-win checkout. Do not copy provider adapters. Do not invent a commit, schema, endpoint, package, provider capability, or acceptance result. Build all safe local code, database, API, worker, and UI layers permitted by the ledger before declaring an external blocker.
