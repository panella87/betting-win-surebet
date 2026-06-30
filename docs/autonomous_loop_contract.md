# Autonomous Loop Contract

The autonomous loop is a repo-local implementation controller. It is allowed to edit source/docs/tests only through a bounded Codex cycle. It is not allowed to run providers, services, wallets, signers, orders, or external trading operations.

Each cycle must write `continue_status.txt` with exactly one line:

```text
AUTONOMOUS_GOAL_COMPLETE=yes
CONTINUE_REQUIRED=yes
BLOCKED=yes
```

Use `CONTINUE_REQUIRED=yes` when another safe SURE-001 hardening task remains. Use `BLOCKED=yes` only when the first required task needs unavailable upstream `betting-win` contract/export evidence, external credentials, unsafe actions, or a human decision.

Hard bans: provider SDKs/URLs, wallet/signer/order/transaction paths, `.env` mutation, git branch mutation, long services, live operations, weakened validators, and fabricated upstream evidence.

## Runtime loader invariant

Autonomous entrypoints must use `scripts/load-node-runtime.sh`. They must not source `nvm.sh` directly; startup must fail with an explicit Node version error instead of exiting through NVM shell internals.

