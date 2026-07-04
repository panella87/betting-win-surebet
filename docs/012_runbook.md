# 012 — Runbook

## Bootstrap

```bash
npm install
npm run validate
```

## Expected state after SURE-002A local bootstrap

```text
repo skeleton = present
no-provider validator = passing
no-execution validator = passing
contract boundary validator = passing
local export bundle parser = implemented
local bundle reader = implemented
resource record contracts = implemented
standard-binary complete-set assembler = implemented
scenario cash-flow builder = implemented
stake-vector solver = implemented for local fixtures
completion and residual-exposure simulation = implemented for local fixtures
settlement replay consumer = implemented for local fixtures
private paper report assembler = implemented
offline local-report CLI = implemented
real upstream evaluation = blocked
```

## Local smoke command

```bash
node cli.js local-report --bundle tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json --output artifacts/local-paper-reports/smoke.report.json
```

## Next required input

Provide Federico's pinned `betting-win` contract/export interface before real upstream evaluation or any later SURE phase. See `docs/016_pinned_betting_win_interface_readiness.md`. Use the three-repo boundary docs before planning backtest, paper, or future live-gate work: `docs/019_three_repo_surebet_strategy_boundary.md`, `docs/020_strategy_data_and_state_ownership.md`, `docs/021_backtest_paper_live_mode_roadmap.md`, and `docs/022_separate_account_policy.md`.

## Standard automation runbook

```bash
./zip_codebase.sh
./pull_artifacts_and_zip_codebase.sh
./update_git.sh --acp
./run-autonomous-implementation.sh --check-only
./run-paper-evaluation.sh --adaptive
./run-autonomous-bugfix.sh
```

`run-paper-evaluation.sh` runs only the local private fixture paper path in the
current gate. It is not real upstream evidence. All `run-*` scripts write root
`artifacts.zip` before stopping.
