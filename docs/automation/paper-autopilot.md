# Paper autopilot controller

`run-paper-autopilot.sh` is the standardized no-service parent supervisor for `betting-win-surebet`. The normal default is `--max-rounds 0`: parent duration and the repeated semantic-handoff guard own termination; a positive round ceiling is diagnostic only.

It is intentionally adapted from the approved Hyperliquid automation workflow, but it does not own a service lifecycle. It does not call `start.sh`, `stop.sh`, provider APIs, direct `betting-win` database reads, wallets, signers, orders, or execution paths.

## Canonical command

Activate Node 20 in the parent shell first:

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
bash ./run-paper-autopilot.sh --duration 7d --paper-duration 72h --implementation-duration 72h --interval 5m --adaptive --max-rounds 0 --max-same-handoff 2 --model cli-default --fallback-model none
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
round_N_paper/child_command.txt
round_N_paper/child_output.log
round_N_paper/child_result.env
round_N_implementation/child_command.txt
round_N_implementation/child_output.log
round_N_implementation/child_result.env
consumed handoffs inside the corresponding implementation round
final_summary.txt
final-summary.md
telegram_notification_status.txt
```

It refreshes root `artifacts.zip` only at finalization.

## Boundaries

This repo remains private paper-only until the pinned `betting-win` export bundle exists. Provider connections, direct `betting-win` DB access, execution, public reports, profitability claims, and live-readiness claims remain prohibited.


## Parent hardening

Before creating a campaign artifact directory, the parent verifies both child scripts are repo-local, executable non-symlink regular files and pass `bash -n`. Existing runtime handoffs are rotated as stale evidence before the first child launch.

Each child budget is clamped to the remaining parent duration. The parent requires exactly one machine-readable child result for `run_dir`, `final_status`, `stop_reason`, and `final_exit_code`, and reconciles the declared exit with the real process exit. It does not guess the newest artifact directory.

Paper handoffs are normalized to schema version 1 and receive a stable semantic SHA-256 that excludes timestamps and run paths. Implementation return handoffs must name that exact source fingerprint. Repeated logical requests therefore trigger `--max-same-handoff` even when generated at different times.

The parent lock records the active child PID, type, script, command, repository realpath, controller realpath, run directory, and heartbeat. Signal handling and verified `--force-unlock` terminate the active child process group before releasing the parent lock. PID or script mismatches fail closed.

Successful implementation never closes the paper objective by itself. It must report a validated source change (or an explicitly permitted validated no-op) and request private-paper re-evaluation; the parent then runs the paper child again.
