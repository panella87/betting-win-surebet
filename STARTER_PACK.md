# betting-win-surebet starter pack

Three-repo boundary rebaseline:

```text
repo_role=surebet_strategy_execution_repo
current_live_execution_gate=closed
provider_truth_owner=betting-win
predictive_strategy_owner=betting-win-betting
account_policy=separate_from_betting-win-betting
```

This overlay implements SURE-001 only: repository skeleton, documentation, ADRs, typed
blocked stubs, tests, and fail-closed boundary validators.

It intentionally does not include `.env`, provider credentials, provider SDKs,
wallet/signer packages, generated `betting-win` contracts, direct database access, or real
strategy implementation under SURE-001. Current surebet strategy/backtest/paper authority is documented in `docs/019_three_repo_surebet_strategy_boundary.md` and `docs/021_backtest_paper_live_mode_roadmap.md`. A repo-root `.env` may exist locally for helper configuration only
when ignored by Git; it must never be archived or committed.

## Launcher fix

The starter pack includes a no-source-NVM runtime loader. It does not source `nvm.sh` and does not call the NVM shell function; startup should fail with a visible runtime diagnostic instead of aborting inside `nvm.sh`.
