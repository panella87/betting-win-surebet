# Current implementation task

Repository: `betting-win-surebet`.

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-520
current_task_status=PENDING
safe_local_terminal_gate=BWS-580
```

Objective: implement the complete operator-runnable continuous private-paper BWS application on top of the validated read-only betting-win boundary. Use `backlog/bws_full_implementation.csv` as the binding dependency ledger. Start with the first dependency-ready `PENDING` row, currently `BWS-520`, and continue across validated cycles while safe local work remains through `BWS-580`.

The previous `BWS-510` loopback acceptance remains valid. It proved the domain engine, persistence, read-only query surfaces, bounded worker behavior, cockpit and configuration in tests. It did not create an executable long-running API/worker service or a continuous upstream ingestion and scheduling lifecycle. The current no-service paper evaluator therefore cannot be used as proof that only external evidence remains.

Before editing:

1. Read `AGENTS.md`, `docs/repo_status_current.md`, `docs/MASTER_PLAN.md`, `docs/028_full_implementation_program.md`, `docs/029_full_implementation_task_ledger.md`, `docs/030_upstream_compatibility_and_pin_contract.md`, and `docs/033_continuous_private_paper_runtime_program.md`.
2. Inspect the current runtime configuration, persistence repositories, read-only API, bounded workers, cockpit, loopback acceptance and no-service helper/controller surfaces.
3. Preserve the validated `BWS-100` committed-`HEAD` upstream lock and no-fallback boundary through the explicit `BETTING_WIN_REPO_PATH` input. Carry-forward proof must prove the betting-win committed HEAD remains unchanged, allow no placeholder fields, and use no clone or temporary worktree.
4. Implement one coherent dependency-ready row or bounded sub-slice per cycle, validate it, update the ledger only after proof, and continue while safe work remains through `BWS-580`. Product runtime entrypoints, CLI commands and package scripts must be implemented without editing protected root wrappers or controllers; their integration is a separate router decision after `BWS-580`.

Current first task:

```text
id=BWS-520
objective=create executable loopback-only BWS API and worker applications
```

Required BWS-520 outcomes:

- add canonical Node 20 executable entrypoints for the BWS read-only API and bounded worker process;
- resolve only explicit fail-fast runtime configuration and the validated upstream lock;
- run only BWS-owned `surebet.*` migrations and repositories;
- bind network listeners only to `127.0.0.1`;
- preserve health, readiness, redaction, blocker visibility and closed-execution policy;
- implement graceful termination and process identity without killing unrelated processes or sessions;
- add focused success, invalid-configuration, startup, shutdown, restart and no-provider/no-execution coverage;
- preserve all validated behavior through `BWS-510`;
- update the task ledger only after focused proof and `npm run validate` pass.

Continuation rules:

```text
CONTINUE_REQUIRED=yes  while any dependency-ready safe local row through BWS-580 remains PENDING
AUTONOMOUS_GOAL_COMPLETE=yes  only after every safe local row through BWS-580 is VALIDATED
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

Do not modify the betting-win checkout. Use no clone or temporary worktree. Do not copy provider adapters. Do not invent a commit, schema, endpoint, package, provider capability, runtime result or acceptance evidence. Build all safe local executable service, upstream convergence, scheduler, lifecycle, API/cockpit convergence and continuous-runtime acceptance work permitted by `BWS-520` through `BWS-580` before declaring the external `BWS-600` gate.
