#!/usr/bin/env bash
# betting-win-surebet automation configuration.
# This file is protected from normal autonomous implementation, paper evaluation,
# and bugfix runs. Edit only during explicit automation-maintenance work.

AUTOMATION_PROJECT_NAME="${AUTOMATION_PROJECT_NAME:-betting-win-surebet}"

AUTOMATION_CODEX_BIN="${AUTOMATION_CODEX_BIN:-codex}"
AUTOMATION_CODEX_MODEL="${AUTOMATION_CODEX_MODEL:-}"
AUTOMATION_CODEX_FALLBACK_MODEL="${AUTOMATION_CODEX_FALLBACK_MODEL:-}"
AUTOMATION_CODEX_SANDBOX="${AUTOMATION_CODEX_SANDBOX:-danger-full-access}"
AUTOMATION_CODEX_STREAM_LOGS="${AUTOMATION_CODEX_STREAM_LOGS:-1}"

AUTOMATION_LOCK_STALE_SECONDS="${AUTOMATION_LOCK_STALE_SECONDS:-3600}"
AUTOMATION_LOCK_HEARTBEAT_SECONDS="${AUTOMATION_LOCK_HEARTBEAT_SECONDS:-60}"
AUTOMATION_GRACEFUL_UNLOCK_SECONDS="${AUTOMATION_GRACEFUL_UNLOCK_SECONDS:-30}"

AUTOMATION_MAX_CYCLES="${AUTOMATION_MAX_CYCLES:-200}"
AUTOMATION_CODEX_CYCLE_TIMEOUT="${AUTOMATION_CODEX_CYCLE_TIMEOUT:-2h}"
AUTOMATION_VALIDATION_TIMEOUT="${AUTOMATION_VALIDATION_TIMEOUT:-20m}"
AUTOMATION_ALLOW_PROTECTED_CHANGES="${AUTOMATION_ALLOW_PROTECTED_CHANGES:-0}"

AUTOMATION_VALIDATION_COMMANDS=(
  "npm run validate"
)
AUTOMATION_IMPLEMENTATION_VALIDATION_COMMANDS=()
AUTOMATION_BUGFIX_VALIDATION_COMMANDS=()

# betting-win-surebet has a real repo-local private paper-mode smoke path over
# fake/local fixtures. It still has no provider access, no live execution, and no
# real upstream evaluation until Federico supplies the pinned betting-win bundle.
PAPER_SUPPORTED="${PAPER_SUPPORTED:-1}"
PAPER_COMMAND='mkdir -p artifacts/private-paper-mode && stamp="$(date -u +%Y%m%dT%H%M%SZ)" && node cli.js local-report --bundle tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json --output "artifacts/private-paper-mode/standard-paper-evaluation-${stamp}.report.json"'
PAPER_COMMAND_TIMEOUT="${PAPER_COMMAND_TIMEOUT:-20m}"
PAPER_DEFAULT_INTERVAL="${PAPER_DEFAULT_INTERVAL:-30m}"
PAPER_BUGFIX_DURATION="${PAPER_BUGFIX_DURATION:-6h}"
PAPER_MAX_FIX_ATTEMPTS_PER_SIGNATURE="${PAPER_MAX_FIX_ATTEMPTS_PER_SIGNATURE:-3}"

PAPER_HEALTH_COMMANDS=(
  "npm run validate:boundary"
  "npm run validate:ops"
)

PAPER_BUG_PATTERNS=(
  "ERROR"
  "Error:"
  "UnhandledPromiseRejection"
  "uncaughtException"
  "TypeError"
  "ReferenceError"
  "RangeError"
  "SyntaxError"
  "NaN"
  "Infinity"
  "ECONNRESET"
  "ETIMEDOUT"
  "EADDRINUSE"
  "MODULE_NOT_FOUND"
)

AUTOMATION_PROTECTED_FILES=(
  "zip_codebase.sh"
  "pull_artifacts_and_zip_codebase.sh"
  "update_git.sh"
  "run-autonomous-implementation.sh"
  "run-paper-evaluation.sh"
  "run-autonomous-bugfix.sh"
  "automation.config.sh"
  ".automation/lib/run_common.sh"
  "docs/automation/PROTECTED_AUTOMATION_FILES.md"
)
