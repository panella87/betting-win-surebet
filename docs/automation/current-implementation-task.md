# Current implementation task

Repository: `betting-win-surebet`.

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-510
current_task_status=VALIDATED
```

Completion record: `BWS-510` is validated. Safe local implementation is complete through `BWS-510`, and `BWS-600` remains blocked on accepted betting-win live read-only runtime evidence. `backlog/bws_full_implementation.csv` remains the binding dependency ledger. This file is no longer an active implementation queue; the post-implementation router selects `run-paper-autopilot.sh`.

Validated BWS-510 proof:

1. `AGENTS.md`, `docs/repo_status_current.md`, `docs/MASTER_PLAN.md`, `docs/028_full_implementation_program.md`, `docs/029_full_implementation_task_ledger.md`, and `docs/030_upstream_compatibility_and_pin_contract.md` were used as the binding authority stack.
2. The validated `BWS-100` upstream lock contract remained intact through `BETTING_WIN_REPO_PATH`, the committed-`HEAD` lock file, and the no-fallback boundary.
3. The integrated loopback acceptance proof covered migration, pinned-export intake, deterministic backtest, bounded private-paper worker execution, read-only API, cockpit snapshot loading, and health/readiness surfacing under the closed local stack.
4. `npm run validate` passed after regenerating `SOURCE_MANIFEST.json`, so the ledger and status surfaces were updated consistently with the proof.

Validated terminal safe-local task:

```text
id=BWS-510
objective=complete integrated local and loopback acceptance
```

Required BWS-510 outcomes:

- prove clean install, migration, pinned-export import, deterministic backtest, bounded private-paper runtime, read-only API, bounded workers, cockpit, and health/readiness surfaces together under the loopback-safe closed stack;
- fail closed on missing required configuration, ambiguous readiness or health state, missing provenance, non-deterministic acceptance evidence, provider/execution/public-signal implications, and any path that would weaken the no-fallback or closed-execution boundary;
- preserve the validated `BWS-500` fail-fast configuration, redaction, loopback-safe defaults, observability, health/readiness surfacing, and process definitions together with the validated `BWS-420` cockpit behavior, the validated `BWS-410` bounded jobs/workers/checkpoints/dead-letter behavior, the validated `BWS-400` read-only query service and API behavior, `BWS-320` strategy ledger/report/acceptance-state behavior, `BWS-310` private paper runtime behavior, `BWS-300` deterministic backtesting behavior, `BWS-240` settlement reconciliation behavior, `BWS-230` completion/exposure behavior, `BWS-220` quote/depth/fee/cost/rounding stake-solving behavior, `BWS-210` opportunity derivation behavior, `BWS-200` canonical equivalence guards, `BWS-140` read-only query/API client boundary, `BWS-130` pinned-export intake, `BWS-120` `surebet.*` persistence behavior, and `BWS-110` workspace compatibility coverage;
- keep the `BWS-100` committed-`HEAD` upstream lock contract intact with no workspace fallback or silent dependency shortcuts;
- update the task ledger only after all required proof passes.

Validated `BWS-100`, `BWS-110`, `BWS-120`, `BWS-130`, `BWS-140`, `BWS-200`, `BWS-210`, `BWS-220`, `BWS-230`, `BWS-240`, `BWS-300`, `BWS-310`, `BWS-320`, `BWS-400`, `BWS-410`, `BWS-420`, and `BWS-500` carry-forward requirements remain binding during `BWS-510`: prove the betting-win committed HEAD remains unchanged during verification, allow no placeholder fields in the upstream lock output, preserve the workspace/package migration, surebet persistence, pinned-export intake, read-only query client behavior, canonical equivalence guards, deterministic complete-set detection, integrated stake solving, non-atomic completion/residual exposure, settlement replay reconciliation, deterministic pinned-export backtesting, bounded private paper runtime behavior, immutable strategy ledger/report evidence, explicit acceptance-state handling, the validated BWS read-only query service/API contract, the validated BWS bounded worker surface, the validated BWS cockpit boundary, the validated BWS-500 runtime/configuration surface, and use no clone or temporary worktree.

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
