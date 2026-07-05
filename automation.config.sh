#!/usr/bin/env bash
# betting-win-surebet automation configuration.
# This file documents the repo-specific commands used by the standardized automation layer.
# The three root run-* controllers are intentionally out of scope for this helper-standardization wave.

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
AUTOMATION_CODEX_CYCLE_TIMEOUT="${AUTOMATION_CODEX_CYCLE_TIMEOUT:-2h}"
AUTOMATION_VALIDATION_TIMEOUT="${AUTOMATION_VALIDATION_TIMEOUT:-20m}"
AUTOMATION_ALLOW_PROTECTED_CHANGES="${AUTOMATION_ALLOW_PROTECTED_CHANGES:-0}"
AUTOMATION_PROTECTED_FILES=(
  "zip_codebase.sh" "pull_artifacts_and_zip_codebase.sh" "update_git.sh"
  "check_progress.sh" "watch_progress.sh" "open_log.sh" "start.sh" "stop.sh"
  "run-autonomous-implementation.sh" "run-paper-evaluation.sh" "run-autonomous-bugfix.sh"
  "automation.config.sh" ".automation/lib/run_common.sh" ".automation/lib/telegram_notify.sh"
  "docs/automation/PROTECTED_AUTOMATION_FILES.md"
)
AUTOMATION_VALIDATION_COMMANDS=(
  "bash -n start.sh stop.sh check_progress.sh watch_progress.sh open_log.sh run-autonomous-implementation.sh run-paper-evaluation.sh run-autonomous-bugfix.sh zip_codebase.sh pull_artifacts_and_zip_codebase.sh update_git.sh .automation/lib/run_common.sh .automation/lib/telegram_notify.sh"
  "npm run validate"
)
AUTOMATION_IMPLEMENTATION_VALIDATION_COMMANDS=("npm run validate")
AUTOMATION_BUGFIX_VALIDATION_COMMANDS=("npm run validate")
PAPER_SUPPORTED="${PAPER_SUPPORTED:-1}"
AUTOMATION_PAPER_SUPPORTED=1
PAPER_COMMAND='mkdir -p artifacts/private-paper-mode && stamp="$(date -u +%Y%m%dT%H%M%SZ)" && node cli.js local-report --bundle tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json --output "artifacts/private-paper-mode/standard-paper-evaluation-${stamp}.report.json"'
AUTOMATION_PAPER_COMMAND="$PAPER_COMMAND"
AUTOMATION_PAPER_COMMAND_MODE="oneshot"
PAPER_COMMAND_TIMEOUT="${PAPER_COMMAND_TIMEOUT:-20m}"
PAPER_DEFAULT_INTERVAL="${PAPER_DEFAULT_INTERVAL:-30m}"
AUTOMATION_PAPER_INTERVAL="$PAPER_DEFAULT_INTERVAL"
PAPER_BUGFIX_DURATION="${PAPER_BUGFIX_DURATION:-6h}"
PAPER_MAX_FIX_ATTEMPTS_PER_SIGNATURE="${PAPER_MAX_FIX_ATTEMPTS_PER_SIGNATURE:-3}"
PAPER_HEALTH_COMMANDS=("npm run validate:boundary" "npm run validate:ops")
AUTOMATION_PAPER_HEALTH_COMMANDS=("npm run validate:boundary" "npm run validate:ops")
PAPER_BUG_PATTERNS=("ERROR" "Error:" "UnhandledPromiseRejection" "uncaughtException" "TypeError" "ReferenceError" "RangeError" "SyntaxError" "NaN" "Infinity" "ECONNRESET" "ETIMEDOUT" "EADDRINUSE" "MODULE_NOT_FOUND")
