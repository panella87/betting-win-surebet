# Autonomous implementation rules: betting-win-surebet

`run-autonomous-implementation.sh` completed the safe local `BWS_FULL_PLATFORM_IMPLEMENTATION_V1` continuous-runtime source queue from `BWS-520` through `BWS-580`.

Authority comes from `docs/automation/current-implementation-task.md`, `docs/033_continuous_private_paper_runtime_program.md` and `backlog/bws_full_implementation.csv`. There is no `--task` flag. A separate `--prompt-file` is unnecessary.

`BWS-100` through `BWS-580` are validated, including the `BWS-570` runtime/API/cockpit convergence slice and the `BWS-580` integrated acceptance slice. No dependency-ready safe local task remains through `BWS-580`; `BWS-600` remains externally blocked.

Historical SURE-001/SURE-002A/SURE-002B files are bootstrap ledgers only. They do not authorize a no-op or goal-complete result.

Allowed work includes executable loopback-only API/worker applications, explicit immutable-export and typed API convergence, `surebet.*` persistence, continuous scheduling, bounded private-paper workers, operator lifecycle commands, health/readiness, evidence publication, API/cockpit convergence and integrated continuous-runtime acceptance.

Forbidden work includes direct provider clients/URLs/credentials, betting-win `core.*` writes, modifying the betting-win checkout, execution paths, public signals and profitability claims.

Use `CONTINUE_REQUIRED=yes` until every safe row through `BWS-580` is validated. Use `AUTONOMOUS_GOAL_COMPLETE=yes` only after every safe local row through `BWS-580` is `VALIDATED`. `BWS-600` may remain blocked and `BWS-900` parked.

Canonical flags include:

```text
--duration 72h
--max-cycles 200
--model cli-default
--fallback-model none
--cycle-timeout 2h
--validation-timeout 20m
```

The check-only must fail contract is binding. `--handover-paper-mode` remains reserved for an explicit direct handoff; paper-controller routing stays gated on the post-`BWS-580` runtime-handoff review.

Standalone implementation sends its final Telegram result. A parent suppresses the child notification and sends the final campaign notification.

Protected automation files remain read-only during this product campaign.
