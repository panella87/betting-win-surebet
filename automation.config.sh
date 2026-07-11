#!/usr/bin/env bash
# betting-win-surebet automation configuration.
# This file documents the repo-specific commands used by the standardized automation layer.
# Root implementation, bugfix, paper, and parent-autopilot controllers are standardized here.
# run-paper-evaluation.sh is surebet-specific: no service lifecycle, private fixture/pinned-bundle only.

AUTOMATION_CONFIG_READY=1
AUTOMATION_REPO_NAME="betting-win-surebet"
AUTOMATION_PROJECT_NAME="${AUTOMATION_PROJECT_NAME:-betting-win-surebet}"
AUTOMATION_DEFAULT_DURATION="72h"
AUTOMATION_CODEX_BIN="${AUTOMATION_CODEX_BIN:-codex}"
AUTOMATION_CODEX_MODEL="${AUTOMATION_CODEX_MODEL:-}"
AUTOMATION_CODEX_FALLBACK_MODEL="${AUTOMATION_CODEX_FALLBACK_MODEL:-}"
AUTOMATION_CODEX_SANDBOX="${AUTOMATION_CODEX_SANDBOX:-danger-full-access}"
AUTOMATION_CODEX_STREAM_LOGS="${AUTOMATION_CODEX_STREAM_LOGS:-1}"
AUTOMATION_STREAM_LOGS="${AUTOMATION_STREAM_LOGS:-${AUTOMATION_CODEX_STREAM_LOGS}}"
AUTOMATION_LOCK_STALE_SECONDS="${AUTOMATION_LOCK_STALE_SECONDS:-3600}"
AUTOMATION_LOCK_HEARTBEAT_SECONDS="${AUTOMATION_LOCK_HEARTBEAT_SECONDS:-60}"
AUTOMATION_GRACEFUL_UNLOCK_SECONDS="${AUTOMATION_GRACEFUL_UNLOCK_SECONDS:-30}"
AUTOMATION_MAX_CYCLES="${AUTOMATION_MAX_CYCLES:-200}"
AUTOMATION_MAX_CODEX_FAILURES="${AUTOMATION_MAX_CODEX_FAILURES:-2}"
AUTOMATION_MAX_CONSECUTIVE_VALIDATION_FAILURES="${AUTOMATION_MAX_CONSECUTIVE_VALIDATION_FAILURES:-3}"
AUTOMATION_CODEX_CYCLE_TIMEOUT="${AUTOMATION_CODEX_CYCLE_TIMEOUT:-2h}"
AUTOMATION_VALIDATION_TIMEOUT="${AUTOMATION_VALIDATION_TIMEOUT:-20m}"
AUTOMATION_INSTALL_TIMEOUT="${AUTOMATION_INSTALL_TIMEOUT:-15m}"
AUTOMATION_ZIP_TIMEOUT="${AUTOMATION_ZIP_TIMEOUT:-10m}"
AUTOMATION_ALLOW_PROTECTED_CHANGES="${AUTOMATION_ALLOW_PROTECTED_CHANGES:-0}"
AUTOMATION_PROTECTED_FILES=(
  "zip_codebase.sh" "pull_artifacts_and_zip_codebase.sh" "update_git.sh"
  "check_progress.sh" "watch_progress.sh" "open_log.sh" "start.sh" "stop.sh"
  "run-autonomous-implementation.sh" "run-paper-evaluation.sh" "run-paper-autopilot.sh" "run-autonomous-bugfix.sh" "run-bugfix-autopilot.sh"
  "automation.config.sh" ".automation/lib/run_common.sh" ".automation/lib/controller_hardening_v2.sh" ".automation/lib/telegram_notify.sh"
  "docs/automation/PROTECTED_AUTOMATION_FILES.md"
)
AUTOMATION_VALIDATION_COMMANDS=(
  "bash -n start.sh stop.sh check_progress.sh watch_progress.sh open_log.sh run-autonomous-implementation.sh run-paper-evaluation.sh run-paper-autopilot.sh run-autonomous-bugfix.sh run-bugfix-autopilot.sh zip_codebase.sh pull_artifacts_and_zip_codebase.sh update_git.sh .automation/lib/run_common.sh .automation/lib/controller_hardening_v2.sh .automation/lib/telegram_notify.sh"
  "npm run validate"
)
AUTOMATION_IMPLEMENTATION_VALIDATION_COMMANDS=("npm run validate")
AUTOMATION_BUGFIX_VALIDATION_COMMANDS=("npm run validate")

# Default unattended bug-audit campaign. It audits one bounded area, implements confirmed defects, and re-audits the same area before closure.
AUTOMATION_BUGFIX_AUTOPILOT_COMMAND="bash ./run-bugfix-autopilot.sh --duration 7d --bugfix-duration 72h --implementation-duration 72h --max-rounds 0 --max-same-handoff 2 --model cli-default --fallback-model none"
AUTOMATION_BUGFIX_COMMAND="$AUTOMATION_BUGFIX_AUTOPILOT_COMMAND"
PAPER_SUPPORTED="${PAPER_SUPPORTED:-1}"
AUTOMATION_PAPER_SUPPORTED=1
# Manual private paper evaluator. It is no-service: fixture/pinned-bundle checks only.
AUTOMATION_PAPER_EVALUATION_COMMAND="bash ./run-paper-evaluation.sh --duration 72h --interval 5m --adaptive --model cli-default --fallback-model none"
# Default unattended paper workflow. This parent supervisor alternates paper evaluation and bounded implementation handoffs.
AUTOMATION_PAPER_AUTOPILOT_COMMAND="bash ./run-paper-autopilot.sh --duration 7d --paper-duration 72h --implementation-duration 72h --interval 5m --adaptive --max-rounds 0 --max-same-handoff 2 --model cli-default --fallback-model none"
PAPER_COMMAND="$AUTOMATION_PAPER_AUTOPILOT_COMMAND"
AUTOMATION_PAPER_COMMAND="$AUTOMATION_PAPER_AUTOPILOT_COMMAND"
AUTOMATION_PAPER_COMMAND_MODE="controller"
PAPER_COMMAND_TIMEOUT="${PAPER_COMMAND_TIMEOUT:-20m}"
PAPER_DEFAULT_INTERVAL="${PAPER_DEFAULT_INTERVAL:-5m}"
AUTOMATION_PAPER_INTERVAL="$PAPER_DEFAULT_INTERVAL"
AUTOMATION_PAPER_MIN_ADAPTIVE_INTERVAL_SECONDS=300
AUTOMATION_PAPER_MAX_ADAPTIVE_INTERVAL_SECONDS=3600
PAPER_BUGFIX_DURATION="${PAPER_BUGFIX_DURATION:-6h}"
PAPER_MAX_FIX_ATTEMPTS_PER_SIGNATURE="${PAPER_MAX_FIX_ATTEMPTS_PER_SIGNATURE:-3}"
AUTOMATION_PAPER_MAX_CYCLES="${AUTOMATION_PAPER_MAX_CYCLES:-1}"
SUREBET_REQUIRE_PINNED_BUNDLE="${SUREBET_REQUIRE_PINNED_BUNDLE:-0}"
PAPER_HEALTH_COMMANDS=("npm run validate:boundary" "npm run validate:ops")
AUTOMATION_PAPER_HEALTH_COMMANDS=("npm run validate:boundary" "npm run validate:ops")
PAPER_BUG_PATTERNS=("ERROR" "Error:" "UnhandledPromiseRejection" "uncaughtException" "TypeError" "ReferenceError" "RangeError" "SyntaxError" "NaN" "Infinity" "ECONNRESET" "ETIMEDOUT" "EADDRINUSE" "MODULE_NOT_FOUND")
