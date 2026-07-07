# betting-win-surebet starter pack — historical note

This file describes the original SURE-001 starter-pack overlay. It is retained only as historical context and is not the active repo status source.

Current active status lives in:

```text
PROJECT_STATUS.md
docs/repo_status_current.md
docs/MASTER_PLAN.md
docs/automation/
```

Current state is no longer SURE-001-only. SURE-001, SURE-002A local engine work, and SURE-002B private paper-mode intake are complete for repo-local work. Real upstream evaluation remains blocked until Federico provides the pinned `betting-win` contract/export bundle, and live execution remains prohibited until a separate explicit gate.

Original starter-pack boundary:

```text
repo_role=surebet_strategy_execution_repo
current_live_execution_gate=closed
provider_truth_owner=betting-win
predictive_strategy_owner=betting-win-betting
account_policy=separate_from_betting-win-betting
```

The starter pack intentionally did not include `.env`, provider credentials, provider SDKs, wallets/signers, generated `betting-win` contracts, direct database access, or real strategy implementation. Those hard boundaries still apply unless a later explicit gate changes them.
