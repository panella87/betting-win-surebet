# Current implementation task

Repository: `betting-win-surebet`.

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-580
current_task_status=VALIDATED
safe_local_terminal_gate=BWS-580
```

Objective: record the validated completion of the safe local `BWS-580` queue for the operator-runnable continuous private-paper BWS application on top of the validated read-only betting-win boundary. `backlog/bws_full_implementation.csv` remains the binding ledger. No dependency-ready safe local row remains through `BWS-580`; `BWS-600` stays externally blocked.

`BWS-580` is now validated. It follows the validated runtime configuration, upstream lock, executable loopback-only BWS API, bounded worker applications, persisted scheduling, repo-owned lifecycle evidence publication, and runtime/API/cockpit convergence by proving clean install, both explicit upstream modes, multi-cycle scheduling, crash/restart, health/readiness, immutable packaging, and the strict machine-readable paper-runtime handoff.

Before editing:

1. Read `AGENTS.md`, `docs/repo_status_current.md`, `docs/MASTER_PLAN.md`, `docs/028_full_implementation_program.md`, `docs/029_full_implementation_task_ledger.md`, `docs/030_upstream_compatibility_and_pin_contract.md`, and `docs/033_continuous_private_paper_runtime_program.md`.
2. Inspect the current runtime configuration, persistence repositories, read-only API, bounded workers, cockpit, loopback acceptance and no-service helper/controller surfaces.
3. Preserve the validated `BWS-100` committed-`HEAD` upstream lock and no-fallback boundary through the explicit `BETTING_WIN_REPO_PATH` input. Carry-forward proof must prove the betting-win committed HEAD remains unchanged, allow no placeholder fields, and use no clone or temporary worktree.
4. Implement one coherent dependency-ready row or bounded sub-slice per cycle, validate it, update the ledger only after proof, and continue while safe work remains through `BWS-580`. Product runtime entrypoints, CLI commands and package scripts must be implemented without editing protected root wrappers or controllers; their integration is a separate router decision after `BWS-580`.

The previous task `BWS-570` is now validated. It added canonical read-only runtime cycle visibility across the API and cockpit from persisted `surebet.*` state, including bounded retention, provenance expansion, restart visibility, checkpoint visibility, and blocker visibility, without weakening the closed boundary.

Validated task:

```text
id=BWS-580
objective=complete closed-stack continuous-runtime acceptance and automation handoff
```

Required BWS-580 outcomes:

- prove clean install, `surebet.*` migrations, and both explicit upstream modes against deterministic loopback inputs;
- prove multi-cycle scheduling, crash/restart, API, worker, cockpit, health/readiness, immutable artifact packaging, and a strict machine-readable paper-runtime handoff;
- preserve the validated `BWS-570` runtime/API/cockpit surfaces together with the closed execution/provider prohibitions;
- preserve fail-closed runtime configuration with no fallback between explicit upstream modes, fixtures or local mocks;
- add focused success, failure, restart, and integrated acceptance coverage for the closed-stack runtime surfaces;
- preserve all validated behavior through `BWS-570`;
- update the task ledger only after focused proof and `npm run validate` pass.

Validated BWS-580 status:

- all safe local rows through `BWS-580` are `VALIDATED`;
- `AUTONOMOUS_GOAL_COMPLETE=yes` is now the correct implementation-cycle terminal result;
- `BWS-600` remains blocked on accepted operator-approved betting-win runtime evidence plus post-runtime controller review.

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

Do not modify the betting-win checkout. Use no clone or temporary worktree. Do not copy provider adapters. Do not invent a commit, schema, endpoint, package, provider capability, runtime result or acceptance evidence. `BWS-520` through `BWS-580` are now complete; the remaining gate is the external `BWS-600` runtime evidence requirement.
