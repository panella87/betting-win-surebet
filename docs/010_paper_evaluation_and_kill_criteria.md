# 010 - Paper evaluation and kill criteria

BWS private paper evaluation consumes the accepted betting-win read-only API for runtime evidence. Immutable exports and explicit pinned bundles remain deterministic fixture, parser, and backtest compatibility inputs only; they are not selectable runtime transports. Direct provider access and execution remain prohibited.

A run is killed or blocked for missing or mismatched upstream lock evidence, unavailable or incompatible upstream API evidence, stale or insufficient quotes, incomplete scenarios, rule/finality mismatch, infeasible stake vectors, excessive residual exposure, inconsistent settlement, worker checkpoint failure, or failed validation.

Reports remain private and evidence-oriented. They do not claim profitability or live readiness.

`run-paper-evaluation.sh` is the retained standalone 72-hour evaluator. It can run bounded fixture or explicit repo-local pinned-bundle checks and can collect bounded runtime evidence under exact lifecycle ownership. It writes root `artifacts.zip`. It is not the selected BWS-600 controller; the selected parent is `run-paper-autopilot.sh`.

The canonical cadence flag is `--adaptive`. Until a reviewed protected-controller repair enforces automatic clamping, operators must pass an explicit interval inside `5m..60m`; the repo command surface uses `--interval 5m --adaptive`.
