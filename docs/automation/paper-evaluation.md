# Paper evaluation controller: betting-win-surebet

`run-paper-evaluation.sh` is the standardized no-service private paper controller for
this repo. It follows the canonical root-controller command surface, lock model,
exit-code model, and Telegram final notification behavior, but it is adapted to
`betting-win-surebet`: this repo has no service lifecycle.

Normal command:

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20 && bash ./run-paper-evaluation.sh \
  --duration 72h \
  --interval 5m \
  --adaptive \
  --keep-monitoring-when-ready \
  --model cli-default \
  --fallback-model none
```

Check-only command, after the same Node activation:

```bash
bash ./run-paper-evaluation.sh --check-only --model cli-default --fallback-model none
```

Supported compatibility flags:

```text
--duration
--interval
--adaptive
--keep-monitoring-when-ready
--model
--fallback-model
--repo-dir
--check-only
--status
--force-unlock
--auto-install
--max-cycles
--sandbox
--codex-phase-timeout
--codex-timeout
--validation-timeout
--install-timeout
--print-config
--stream
--no-stream
```

Runtime behavior:

```text
inherits active Node runtime from the parent shell
never sources nvm.sh
never rewrites PATH to select Node silently
fails clearly when active Node does not satisfy .nvmrc/package engines
uses .automation/locks/run-paper-evaluation.lock
writes artifacts/paper_evaluation_<timestamp>/
writes final-summary.md
creates/refreshed root artifacts.zip only at finalization
sends one final Telegram notification through .automation/lib/telegram_notify.sh
```

Surebet-specific paper flow:

```text
validate source with npm run validate
run no-provider/no-execution/no-direct-DB validators through repo validation
run a private local fixture paper smoke
run pinned-bundle smoke only when SUREBET_PINNED_BUNDLE is explicitly provided
write private report artifacts under artifacts/private-paper-mode/
classify the final status deterministically
write .automation/paper-mode-to-autonomous-implementation.env when source work is needed
```

Pinned bundle mode status:

The controller contains a pinned-bundle path. Operator-provided `SUREBET_PINNED_BUNDLE` values are shell-quoted before any `bash -lc` command construction, and `SUREBET_REQUIRE_PINNED_BUNDLE` is validated as strict `0` or `1`. Use a real pinned-bundle command only after Federico supplies a repo-local pinned `betting-win` export.

Pinned-bundle command after Federico supplies a repo-local pinned `betting-win` export:

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
SUREBET_PINNED_BUNDLE=path/to/pinned-betting-win-export.json \
  bash ./run-paper-evaluation.sh --duration 72h --interval 5m --adaptive --model cli-default --fallback-model none
```

Fail-closed pinned requirement:

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
SUREBET_REQUIRE_PINNED_BUNDLE=1 \
  bash ./run-paper-evaluation.sh --duration 72h --interval 5m --model cli-default --fallback-model none
```

Statuses:

```text
PAPER_EVALUATION_READY_PRIVATE_FIXTURE_ONLY_BLOCKED_ON_PINNED_BUNDLE
PAPER_EVALUATION_PINNED_BUNDLE_ACCEPTED_PRIVATE_REPORT_WRITTEN
PAPER_EVALUATION_BLOCKED_INVALID_PINNED_BUNDLE
PAPER_EVALUATION_BLOCKED_REPO_VALIDATION_FAILED
PAPER_EVALUATION_BLOCKED_SOURCE_FIX_REQUIRED
PAPER_EVALUATION_DURATION_ELAPSED_CONTINUE_REQUIRED
```

Exit codes:

```text
0 = check-only passed, private fixture smoke accepted, or pinned bundle accepted into a private report
1 = setup/controller/local validation failure before classified state
2 = blocked by invalid pinned bundle, tooling, safety, validation, or source-fix requirement
3 = duration/max-cycle elapsed while continuation remains required
130 = interrupted
```

What this controller must not do:

```text
no service start
no service stop
no service restart
no forever/pm2/process management
no provider API calls
no direct betting-win DB reads
no wallets/signers/orders/transactions
no live mode
no .env paper-posture mutation
no public report publication
no profitability or live-readiness claims
```

Telegram:

```text
reads TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID from environment first, then .env
sends one final message only
never prints the token
TELEGRAM_NOTIFY=0 disables delivery
Telegram failure never fails the controller
```

Final evidence integrity:

```text
final-summary.md exit_status must equal the actual process exit status
Telegram final message uses the same exit_status
runtime locks and handoffs are operational state, not source authority
```

A private fixture report is still not real upstream evidence. Real upstream private
paper evaluation remains blocked until Federico supplies a pinned `betting-win`
export bundle that passes `--pinned-intake`.


## Paper autopilot integration

`run-paper-evaluation.sh` may write `.automation/paper-mode-to-autonomous-implementation.env` only for repo-local source/controller defects. Missing pinned bundle must not create an implementation handoff. The parent `run-paper-autopilot.sh` consumes that handoff and launches implementation with `--handover-paper-mode`.
