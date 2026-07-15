# 010 - Paper evaluation and kill criteria

BWS private paper evaluation consumes only explicit immutable export or typed read-only API input. Direct provider access and execution remain prohibited.

A run is killed or blocked for missing/mismatched upstream lock, stale or insufficient quotes, incomplete scenarios, rule/finality mismatch, infeasible stake vector, excessive residual exposure, inconsistent settlement, worker checkpoint failure, or failed validation.

Reports remain private and evidence-oriented. They do not claim profitability or live readiness.

`run-paper-evaluation.sh` remains a retained no-service fixture/pinned-bundle regression controller while `BWS-520` through `BWS-580` implement the executable runtime. It is not the current implementation router. Later runtime integration must preserve the same lock, handoff, artifact, validation and Telegram finalization contracts.
