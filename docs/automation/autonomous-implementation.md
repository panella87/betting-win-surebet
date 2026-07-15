# Autonomous implementation rules: betting-win-surebet

`run-autonomous-implementation.sh` is selected for the remaining `BWS_FULL_PLATFORM_IMPLEMENTATION_V1` continuous-runtime source queue.

Authority comes from `docs/automation/current-implementation-task.md`, `docs/033_continuous_private_paper_runtime_program.md` and `backlog/bws_full_implementation.csv`. There is no `--task` flag. A separate `--prompt-file` is unnecessary.

`BWS-100` through `BWS-510` remain validated. The first dependency-ready task is `BWS-520`; selection advances strictly through `BWS-580`.

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

The check-only must fail contract is binding. `--handover-paper-mode` remains reserved for an explicit direct handoff; normal runtime evidence is not selected while the BWS-520 through BWS-580 source queue remains.

Standalone implementation sends its final Telegram result. A parent suppresses the child notification and sends the final campaign notification.

Protected automation files remain read-only during this product campaign.
