# Autonomous Loop Contract

The autonomous loop is a repo-local implementation controller. It is allowed to edit source/docs/tests only through a bounded Codex cycle. It is not allowed to run providers, services, wallets, signers, orders, or external trading operations.

Each cycle must write `continue_status.txt` with exactly one non-empty line. The only valid lines are:

```text
AUTONOMOUS_GOAL_COMPLETE=yes
```

```text
CONTINUE_REQUIRED=yes
```

```text
BLOCKED=yes
```

Use `CONTINUE_REQUIRED=yes` when another safe SURE-001 hardening task remains. Use `BLOCKED=yes` only when the first required task needs unavailable upstream `betting-win` contract/export evidence, external credentials, unsafe actions, or a human decision. A malformed, missing, combined, or unknown status must fail closed; the controller must not treat it as continue.

Each cycle must also write `request_flags.txt` with exactly two lines and in this exact order:

```text
SERVICE_REFRESH_REQUIRED=no
RUNTIME_EVIDENCE_REQUIRED=no
```

Malformed, missing, reordered, extra-line, or unknown request flags must fail closed before any cycle status can be accepted.

Each required cycle report artifact must be real. The controller may create placeholders for missing files to preserve forensic context, but any placeholder or empty required report must fail closed with `BLOCKED=yes` before `request_flags.txt` or `continue_status.txt` can be accepted. `git_diff.patch` may be empty only when a cycle genuinely made no source diff.

`AUTONOMOUS_GOAL_COMPLETE=yes` is accepted only after the post-cycle `npm run validate` gate passes. A nonzero Codex exit code must fail closed even if validation still passes.

Hard bans: provider SDKs/URLs, wallet/signer/order/transaction paths, `.env` mutation, git branch mutation, long services, live operations, weakened validators, and fabricated upstream evidence.

## Runtime loader invariant

Autonomous entrypoints must use `scripts/load-node-runtime.sh`. They must not source `nvm.sh` directly; startup must fail with an explicit Node version error instead of exiting through NVM shell internals.
