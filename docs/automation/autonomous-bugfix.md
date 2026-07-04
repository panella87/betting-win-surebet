# Autonomous bugfix rules: betting-win-surebet

`run-autonomous-bugfix.sh` is the helper between implementation and paper
evaluation. Default duration is 72h.

It has no proactive/reactive mode flags. Every run combines:

```text
reactive evidence from --from-artifacts or latest artifacts, when available
proactive audit of likely paper-mode/runtime failures
```

For this repo, the audit must focus on private paper-mode and local deterministic
surebet code paths:

```text
repo-local pinned bundle intake
local fixture reader containment and symlink/realpath rejection
standard-binary complete-set grouping
quote freshness and currency checks
stake-vector math over local fixtures
leg completion and residual exposure simulation
settlement replay consumption
private report artifact contracts
batch summary generation
validation/source-manifest drift
shell entrypoint safety
```

Fix only bug-class issues. Do not add provider adapters, live collectors, wallet or
order paths, public reports, profitability claims, or predictive/value-betting work.
Missing required config must fail fast. Do not hide defects with silent defaults.

Protected automation files must not change unless the explicit task is automation
maintenance.
