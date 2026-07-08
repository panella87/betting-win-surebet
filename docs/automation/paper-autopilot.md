# Paper autopilot controller

`run-paper-autopilot.sh` is the standardized no-service parent supervisor for `betting-win-surebet`.

It is intentionally adapted from the approved Hyperliquid automation workflow, but it does not own a service lifecycle. It does not call `start.sh`, `stop.sh`, provider APIs, direct `betting-win` database reads, wallets, signers, orders, or execution paths.

## Canonical command

Activate Node 20 in the parent shell first:

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
bash ./run-paper-autopilot.sh --duration 7d --paper-duration 72h --implementation-duration 72h --interval 5m --adaptive --max-rounds 6 --max-same-handoff 2 --model cli-default --fallback-model none
```

## What it supervises

The autopilot runs child controllers one at a time:

```text
run-paper-autopilot.sh
  -> run-paper-evaluation.sh
  -> run-autonomous-implementation.sh --handover-paper-mode, only when paper wrote a repo-local implementation handoff
  -> run-paper-evaluation.sh again, only when implementation made validated source/docs/test changes that require private paper re-evaluation
```

`run-autonomous-bugfix.sh` stays a standalone audit/handoff controller and is not part of the paper autopilot loop in this repo.

## Surebet-specific terminal states

`PAPER_AUTOPILOT_BLOCKED_ON_PINNED_BUNDLE` means the private fixture proof path completed, but real upstream evaluation is still blocked until Federico provides a repo-local pinned `betting-win` export bundle.

`PAPER_AUTOPILOT_PINNED_BUNDLE_ACCEPTED_PRIVATE_REPORT_WRITTEN` means a provided pinned bundle was accepted into a private report. This is still not live readiness.

`PAPER_AUTOPILOT_BLOCKED_IMPLEMENTATION_NOOP` means implementation was launched from a paper handoff but did not make a source/docs/test change and the handoff did not allow no-op completion.

`PAPER_AUTOPILOT_BLOCKED_IMPLEMENTATION_HANDOVER_NOT_REFRESHABLE` means implementation completed but did not produce a validated source-change handoff that justifies another private paper evaluation.

## Handoff fields

Paper-to-implementation handoffs use `.automation/paper-mode-to-autonomous-implementation.env` with fields such as:

```text
RUN_AUTONOMOUS_IMPLEMENTATION_NEXT=yes
AUTONOMOUS_IMPLEMENTATION_EXPECTED_FLAG=--handover-paper-mode
PAPER_MODE_NOOP_SUCCESS_ALLOWED=no
PAPER_MODE_EXPECTED_PRIVATE_PAPER_REEVALUATION_AFTER_SOURCE_CHANGE=yes
PAPER_MODE_AUTOMATION_MAINTENANCE_ALLOWED=yes/no
PAPER_SERVICE_SUPPORTED=0
SERVICE_REFRESH_REQUIRED=0
RUNTIME_EVIDENCE_REQUIRED=0
```

Implementation-to-paper handoffs use `.automation/paper-mode-handover.env` with fields such as:

```text
RUN_PAPER_EVALUATION_NEXT=yes
IMPLEMENTATION_SOURCE_CHANGED=yes/no
IMPLEMENTATION_SOURCE_VALIDATION_PASSED=yes/no
PRIVATE_PAPER_REEVALUATION_REQUIRED=yes/no
PAPER_SERVICE_SUPPORTED=0
SERVICE_REFRESH_REQUIRED=0
RUNTIME_EVIDENCE_REQUIRED=0
```

## Artifacts

The controller writes `artifacts/paper_autopilot_*` with:

```text
controller.log
rounds.tsv
round_N_child/child_command.txt
round_N_child/child_output.log
round_N_child/child_result.env
round_N_child/handoffs/
final_summary.txt
final-summary.md
telegram_notification_status.txt
```

It refreshes root `artifacts.zip` only at finalization.

## Boundaries

This repo remains private paper-only until the pinned `betting-win` export bundle exists. Provider connections, direct `betting-win` DB access, execution, public reports, profitability claims, and live-readiness claims remain prohibited.
