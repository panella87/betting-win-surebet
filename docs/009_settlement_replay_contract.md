# 009 - Settlement replay contract

BWS consumes betting-win settlement/finality evidence and replays strategy-owned outcomes into backtest and paper ledgers.

Replay is idempotent and provenance-bound. It handles final outcomes, voids, refunds, corrections, conflicting evidence, generation changes, and finality progression. Conflicts block acceptance rather than selecting a convenient outcome.

BWS stores reconciliation state under `surebet.*` and never rewrites upstream settlement truth. `BWS-240` owns the integrated proof.
