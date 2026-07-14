# Autonomous implementation rules: betting-win-surebet

`run-autonomous-implementation.sh` is selected for `BWS_FULL_PLATFORM_IMPLEMENTATION_V1`.

Authority comes from `docs/automation/current-implementation-task.md` and `backlog/bws_full_implementation.csv`. There is no `--task` flag. A separate `--prompt-file` is unnecessary.

The controller validates the baseline, selects the first dependency-ready `PENDING` row, and inspects the existing betting-win checkout's committed `HEAD` read-only when required. It must not clone, create a temporary worktree, or consume uncommitted upstream files. It then implements a bounded coherent slice, adds tests, validates, updates evidence/ledger, and continues.

`BWS-100` and `BWS-110` are validated. The current first dependency-ready pending task is `BWS-120`; after it is validated, selection advances strictly through the binding dependency ledger.

Historical SURE-001/SURE-002A/SURE-002B files are bootstrap ledgers only. They do not authorize a no-op or goal-complete result.

Allowed work includes exact upstream lock tooling, typed read-only betting-win client, npm workspace migration, `surebet.*` PostgreSQL, backtest/private-paper engines, BWS API, workers, UI, and loopback process contracts.

Forbidden work includes direct provider clients/URLs/credentials, betting-win `core.*` writes, modifying the betting-win checkout, execution paths, public signals, and profitability claims.

Use `CONTINUE_REQUIRED=yes` until every safe row through `BWS-510` is validated. Use `AUTONOMOUS_GOAL_COMPLETE=yes` only after every safe local row is `VALIDATED`. `BWS-600` may remain blocked and `BWS-900` parked.

Canonical flags include:

```text
--model cli-default
--fallback-model none
--cycle-timeout 2h
--validation-timeout 20m
```

The check-only must fail contract is binding. `--handover-paper-mode` remains reserved for an explicit direct handoff; normal paper convergence is owned by the parent.

Standalone implementation sends its final Telegram result. A parent suppresses the child notification and sends the final campaign notification.

Protected automation files remain read-only during this product campaign.
