# 021 — Backtest, paper, and live-mode roadmap

This document separates the target repo authority from the current safety gate.

## Current mode

```text
current_task=SURE-002B_PRIVATE_PAPER_MODE_INTAKE
current_task_status=complete_repo_local_private_paper_mode_backlog_blocked_on_pinned_interface
mode=private_paper_only
provider_connections=prohibited
execution=prohibited
accepted=false
```

The current implementation can validate local fixture bundles, run deterministic local surebet math, write private reports, and run batch summaries over repo-local JSON bundles. Real upstream evaluation is still blocked until Federico provides a pinned `betting-win` export/interface.

## Backtesting authority

Backtesting belongs in this repo for surebet strategies. Backtests must consume pinned `betting-win` exports or read-only query snapshots and produce surebet-specific results only.

A future surebet backtest should include:

- pinned export identity and manifest hash;
- export time range and provider-generation identifiers;
- quote freshness policy;
- capacity and rounding policy;
- complete-set grouping policy;
- settlement replay policy;
- partial-fill and residual-exposure assumptions;
- private result artifacts with no public-signal or profitability claims.

Backtesting must not fetch provider data directly or build a separate canonical historical database.

## Paper-mode authority

Paper mode belongs in this repo for surebet strategies. Current private paper mode is repo-local and keeps `accepted=false`. Future paper mode may consume live read-only query outputs from `betting-win` only after an explicit interface gate.

Paper state may include candidate IDs, simulated leg states, stake vectors, residual exposure, settlement replay status, blocker counts, and private run reports.

## Future live gate

Future live surebet execution decisions may belong here only after a separate explicit authorization. That future gate must add at least:

- an ADR replacing the current paper-only gate;
- separate account policy confirmation;
- risk limits and kill criteria;
- idempotent decision logging;
- provider-mechanical execution through the shared provider layer, not direct provider adapters here;
- new tests and validators proving no predictive-betting or shared-capital coupling;
- operator runbooks that distinguish provider failures from strategy blockers.

Until that gate exists, live execution remains prohibited.

## Automation alignment

Backtest and paper authority remains in this repo for surebet strategies, but the
canonical paper supervisor is now `run-paper-evaluation.sh`. Under the current gate
it is limited to repo-local private fixture smoke. Future real upstream paper mode
requires a pinned `betting-win` interface and explicit config update.
