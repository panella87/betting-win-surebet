#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
AUTOMATION_REPO_ROOT="$SCRIPT_DIR"
# shellcheck source=.automation/lib/run_common.sh
. "$AUTOMATION_REPO_ROOT/.automation/lib/run_common.sh"
# shellcheck source=.automation/lib/telegram_notify.sh
. "$AUTOMATION_REPO_ROOT/.automation/lib/telegram_notify.sh"

DURATION_SECONDS="$(automation_parse_duration_seconds 72h)"
PROMPT_FILE=""
REPO_DIR_OVERRIDE=""
STATUS_ONLY=0
FORCE_UNLOCK=0
CHECK_ONLY=0
PRINT_CONFIG=0
AUTO_INSTALL=0
ALLOW_PARALLEL=0
HANDOVER_PAPER_MODE=0
FINISHED=0
EXIT_STATUS=0
STOP_REASON="not_started"
FINAL_STATUS="not_started"
CYCLES_ATTEMPTED=0
CODEX_FAILURES=0
CONSECUTIVE_VALIDATION_FAILURES=0
LOCK_ACQUIRED=0
CODEX_TIMEOUT_SECONDS=""
VALIDATION_TIMEOUT_SECONDS=""
INSTALL_TIMEOUT_SECONDS=""
ZIP_TIMEOUT_SECONDS=""
MAX_CYCLES=""
MAX_CODEX_FAILURES=""
MAX_CONSECUTIVE_VALIDATION_FAILURES=""
CODEX_MODEL=""
CODEX_FALLBACK_MODEL=""
CODEX_SANDBOX=""
CODEX_STREAM_LOGS=""
TASK_SOURCE=""

usage() {
  cat <<'EOF_USAGE'
Usage:
  ./run-autonomous-implementation.sh [options]

Primary options:
  --duration VALUE            Campaign scheduling budget. Examples: 72h, 1h30m, 3600.
  --prompt-file PATH          Use an explicit implementation prompt file.
  --model MODEL               Override Codex model. Use cli-default for the CLI/profile default.
  --fallback-model MODEL      Retry once after Codex failure. Use none to disable.
  --repo-dir PATH             Override repository root discovery.

Limits and timeouts:
  --cycle-timeout VALUE       Maximum duration of one Codex cycle. Default: 2h.
  --validation-timeout VALUE  Maximum duration of each validation command. Default: 20m.
  --install-timeout VALUE     Maximum optional dependency install duration. Default: 15m.
  --zip-timeout VALUE         Reserved artifacts packaging timeout. Default: 10m.
  --max-cycles N              Hard cycle-count ceiling. Default: 200.

Operational options:
  --sandbox MODE              read-only, workspace-write, or danger-full-access.
  --auto-install              Permit npm ci --ignore-scripts when node_modules is absent.
  --check-only                Run preflight validation only. No Codex cycles.
  --status                    Print lock status and exit.
  --force-unlock              Terminate only a verified repo-scoped owner, remove the lock, and exit.
  --allow-parallel            Explicitly skip this controller lock for this run.
  --handover-paper-mode       Write .automation/paper-mode-handover.env at finalization.
  --print-config              Print effective non-secret configuration and exit.
  --stream                    Stream Codex output to terminal and log. Default.
  --no-stream                 Save Codex output to log only.
  -h, --help                  Show this help.

No --task flag is supported. Use --prompt-file or docs/automation/current-implementation-task.md.

Exit codes:
  0 = check-only passed or autonomous goal complete
  1 = setup/controller/local validation failure before classified implementation state
  2 = blocked by Codex, validation, tooling, malformed artifacts, or safety gate
  3 = scheduling budget elapsed while CONTINUE_REQUIRED=yes remains
  130 = interrupted

Telegram:
  Reads TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID from environment first, then .env.
  Sends exactly one final result message. Set TELEGRAM_NOTIFY=0 to disable.

The controller inherits Node.js and npm from the parent shell PATH and never sources nvm.sh.
EOF_USAGE
}

parse_positive_int() {
  local raw="$1"
  local label="$2"
  case "$raw" in ''|*[!0-9]*) echo "ERROR: $label must be a positive integer: $raw" >&2; return 2 ;; esac
  if (( raw < 1 )); then echo "ERROR: $label must be a positive integer: $raw" >&2; return 2; fi
  printf '%s\n' "$raw"
}

parse_args() {
  local parsed
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --duration|--run-duration) [[ $# -ge 2 ]] || { echo "ERROR: $1 requires a value" >&2; return 2; }; parsed="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid $1: $2" >&2; return 2; }; DURATION_SECONDS="$parsed"; shift 2 ;;
      --duration=*|--run-duration=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid duration: ${1#*=}" >&2; return 2; }; DURATION_SECONDS="$parsed"; shift ;;
      --prompt-file) [[ $# -ge 2 ]] || { echo "ERROR: --prompt-file requires a value" >&2; return 2; }; PROMPT_FILE="$2"; shift 2 ;;
      --prompt-file=*) PROMPT_FILE="${1#*=}"; shift ;;
      --model) [[ $# -ge 2 ]] || { echo "ERROR: --model requires a value" >&2; return 2; }; CODEX_MODEL="$2"; shift 2 ;;
      --model=*) CODEX_MODEL="${1#*=}"; shift ;;
      --fallback-model) [[ $# -ge 2 ]] || { echo "ERROR: --fallback-model requires a value" >&2; return 2; }; CODEX_FALLBACK_MODEL="$2"; shift 2 ;;
      --fallback-model=*) CODEX_FALLBACK_MODEL="${1#*=}"; shift ;;
      --repo-dir) [[ $# -ge 2 ]] || { echo "ERROR: --repo-dir requires a value" >&2; return 2; }; REPO_DIR_OVERRIDE="$2"; shift 2 ;;
      --repo-dir=*) REPO_DIR_OVERRIDE="${1#*=}"; shift ;;
      --cycle-timeout) [[ $# -ge 2 ]] || { echo "ERROR: --cycle-timeout requires a value" >&2; return 2; }; parsed="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid --cycle-timeout: $2" >&2; return 2; }; CODEX_TIMEOUT_SECONDS="$parsed"; shift 2 ;;
      --cycle-timeout=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid --cycle-timeout: ${1#*=}" >&2; return 2; }; CODEX_TIMEOUT_SECONDS="$parsed"; shift ;;
      --validation-timeout) [[ $# -ge 2 ]] || { echo "ERROR: --validation-timeout requires a value" >&2; return 2; }; parsed="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid --validation-timeout: $2" >&2; return 2; }; VALIDATION_TIMEOUT_SECONDS="$parsed"; shift 2 ;;
      --validation-timeout=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid --validation-timeout: ${1#*=}" >&2; return 2; }; VALIDATION_TIMEOUT_SECONDS="$parsed"; shift ;;
      --install-timeout) [[ $# -ge 2 ]] || { echo "ERROR: --install-timeout requires a value" >&2; return 2; }; parsed="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid --install-timeout: $2" >&2; return 2; }; INSTALL_TIMEOUT_SECONDS="$parsed"; shift 2 ;;
      --install-timeout=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid --install-timeout: ${1#*=}" >&2; return 2; }; INSTALL_TIMEOUT_SECONDS="$parsed"; shift ;;
      --zip-timeout) [[ $# -ge 2 ]] || { echo "ERROR: --zip-timeout requires a value" >&2; return 2; }; parsed="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid --zip-timeout: $2" >&2; return 2; }; ZIP_TIMEOUT_SECONDS="$parsed"; shift 2 ;;
      --zip-timeout=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid --zip-timeout: ${1#*=}" >&2; return 2; }; ZIP_TIMEOUT_SECONDS="$parsed"; shift ;;
      --max-cycles) [[ $# -ge 2 ]] || { echo "ERROR: --max-cycles requires a value" >&2; return 2; }; MAX_CYCLES="$(parse_positive_int "$2" --max-cycles)" || return 2; shift 2 ;;
      --max-cycles=*) MAX_CYCLES="$(parse_positive_int "${1#*=}" --max-cycles)" || return 2; shift ;;
      --sandbox) [[ $# -ge 2 ]] || { echo "ERROR: --sandbox requires a value" >&2; return 2; }; CODEX_SANDBOX="$2"; shift 2 ;;
      --sandbox=*) CODEX_SANDBOX="${1#*=}"; shift ;;
      --auto-install) AUTO_INSTALL=1; shift ;;
      --check-only) CHECK_ONLY=1; shift ;;
      --status) STATUS_ONLY=1; shift ;;
      --force-unlock) FORCE_UNLOCK=1; shift ;;
      --allow-parallel) ALLOW_PARALLEL=1; shift ;;
      --handover-paper-mode) HANDOVER_PAPER_MODE=1; shift ;;
      --print-config) PRINT_CONFIG=1; shift ;;
      --stream) CODEX_STREAM_LOGS=1; shift ;;
      --no-stream) CODEX_STREAM_LOGS=0; shift ;;
      -h|--help) usage; exit 0 ;;
      *) echo "ERROR: unknown option: $1" >&2; usage >&2; return 2 ;;
    esac
  done
}

model_display() { if [[ -n "$CODEX_MODEL" ]]; then printf '%s\n' "$CODEX_MODEL"; else printf 'cli-default\n'; fi; }
fallback_display() { if [[ -n "$CODEX_FALLBACK_MODEL" ]]; then printf '%s\n' "$CODEX_FALLBACK_MODEL"; else printf 'none\n'; fi; }

configure_defaults() {
  if [[ -n "$REPO_DIR_OVERRIDE" ]]; then AUTOMATION_REPO_ROOT="$(cd "$REPO_DIR_OVERRIDE" && pwd -P)"; fi
  cd "$AUTOMATION_REPO_ROOT"
  automation_load_config
  REPO_DIR="$AUTOMATION_REPO_ROOT"
  CODEX_TIMEOUT_SECONDS="${CODEX_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_CODEX_CYCLE_TIMEOUT:-2h}")}"
  VALIDATION_TIMEOUT_SECONDS="${VALIDATION_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_VALIDATION_TIMEOUT:-20m}")}"
  INSTALL_TIMEOUT_SECONDS="${INSTALL_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_INSTALL_TIMEOUT:-15m}")}"
  ZIP_TIMEOUT_SECONDS="${ZIP_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_ZIP_TIMEOUT:-10m}")}"
  MAX_CYCLES="${MAX_CYCLES:-${AUTOMATION_MAX_CYCLES:-200}}"
  MAX_CODEX_FAILURES="${AUTOMATION_MAX_CODEX_FAILURES:-2}"
  MAX_CONSECUTIVE_VALIDATION_FAILURES="${AUTOMATION_MAX_CONSECUTIVE_VALIDATION_FAILURES:-3}"
  CODEX_MODEL="${CODEX_MODEL:-${AUTOMATION_CODEX_MODEL:-}}"
  CODEX_FALLBACK_MODEL="${CODEX_FALLBACK_MODEL:-${AUTOMATION_CODEX_FALLBACK_MODEL:-}}"
  CODEX_SANDBOX="${CODEX_SANDBOX:-${AUTOMATION_CODEX_SANDBOX:-danger-full-access}}"
  CODEX_STREAM_LOGS="${CODEX_STREAM_LOGS:-${AUTOMATION_CODEX_STREAM_LOGS:-1}}"
  case "$CODEX_MODEL" in default|cli-default) CODEX_MODEL="" ;; esac
  case "$CODEX_FALLBACK_MODEL" in default|cli-default) CODEX_FALLBACK_MODEL="cli-default" ;; none|off|disabled) CODEX_FALLBACK_MODEL="" ;; esac
  AUTOMATION_CODEX_MODEL="$CODEX_MODEL"
  AUTOMATION_CODEX_FALLBACK_MODEL="$CODEX_FALLBACK_MODEL"
  AUTOMATION_CODEX_SANDBOX="$CODEX_SANDBOX"
  AUTOMATION_CODEX_STREAM_LOGS="$CODEX_STREAM_LOGS"
}

validate_inputs() {
  local value
  for value in "$DURATION_SECONDS" "$CODEX_TIMEOUT_SECONDS" "$VALIDATION_TIMEOUT_SECONDS" "$INSTALL_TIMEOUT_SECONDS" "$ZIP_TIMEOUT_SECONDS" "$MAX_CYCLES" "$MAX_CODEX_FAILURES" "$MAX_CONSECUTIVE_VALIDATION_FAILURES"; do
    case "$value" in ''|*[!0-9]*) echo "ERROR: expected positive integer, got: $value" >&2; return 2 ;; esac
    (( value > 0 )) || { echo "ERROR: expected positive integer, got: $value" >&2; return 2; }
  done
  case "$CODEX_SANDBOX" in read-only|workspace-write|danger-full-access) ;; *) echo "ERROR: unsupported sandbox: $CODEX_SANDBOX" >&2; return 2 ;; esac
}

print_config() {
  cat <<EOF_CONFIG
controller=run-autonomous-implementation.sh
repo_dir=$AUTOMATION_REPO_ROOT
duration_seconds=$DURATION_SECONDS
cycle_timeout_seconds=$CODEX_TIMEOUT_SECONDS
validation_timeout_seconds=$VALIDATION_TIMEOUT_SECONDS
install_timeout_seconds=$INSTALL_TIMEOUT_SECONDS
zip_timeout_seconds=$ZIP_TIMEOUT_SECONDS
max_cycles=$MAX_CYCLES
model=$(model_display)
fallback_model=$(fallback_display)
sandbox=$CODEX_SANDBOX
stream_logs=$CODEX_STREAM_LOGS
auto_install=$AUTO_INSTALL
allow_parallel=$ALLOW_PARALLEL
handover_paper_mode=$HANDOVER_PAPER_MODE
telegram_notify=${TELEGRAM_NOTIFY:-1}
EOF_CONFIG
}

assert_active_node_runtime() {
  automation_require_command node
  automation_require_command npm
  local expected_major=""
  local node_version
  node_version="$(node --version 2>/dev/null || true)"
  if [[ -f "$AUTOMATION_REPO_ROOT/.nvmrc" ]]; then expected_major="$(tr -d '[:space:]' < "$AUTOMATION_REPO_ROOT/.nvmrc" | sed -E 's/^v?([0-9]+).*/\1/')"; fi
  if [[ -n "$expected_major" && ! "$node_version" =~ ^v${expected_major}\. ]]; then
    cat >&2 <<EOF_NODE
ERROR: active Node runtime does not match .nvmrc
expected_major=$expected_major
actual_node=${node_version:-missing}
Activate the repo runtime in the parent shell first:
. "\$HOME/.nvm/nvm.sh" && nvm use $expected_major
EOF_NODE
    return 1
  fi
  automation_log "NODE_OK=$node_version"
  automation_log "NPM_OK=$(npm --version 2>/dev/null || true)"
}

maybe_auto_install() {
  if [[ "$AUTO_INSTALL" != "1" ]]; then return 0; fi
  if [[ -d "$AUTOMATION_REPO_ROOT/node_modules" ]]; then automation_log "auto_install=skipped node_modules_present"; return 0; fi
  if [[ -f "$AUTOMATION_REPO_ROOT/package-lock.json" ]]; then automation_run_shell_command "auto_install_npm_ci" "npm ci --ignore-scripts" "$INSTALL_TIMEOUT_SECONDS" "$AUTOMATION_RUN_DIR/auto-install.log"; return $?; fi
  automation_run_shell_command "auto_install_npm_install" "npm install --ignore-scripts" "$INSTALL_TIMEOUT_SECONDS" "$AUTOMATION_RUN_DIR/auto-install.log"
}

resolve_task_source() {
  if [[ -n "$PROMPT_FILE" ]]; then [[ -f "$PROMPT_FILE" ]] || automation_die "prompt file not found: $PROMPT_FILE" 1; TASK_SOURCE="$PROMPT_FILE"; else TASK_SOURCE="docs/automation/current-implementation-task.md"; [[ -f "$TASK_SOURCE" ]] || automation_die "missing current implementation task: $TASK_SOURCE" 1; fi
  grep -q 'AUTOMATION_TASK_NOT_SET' "$TASK_SOURCE" && automation_die "implementation task is not set in $TASK_SOURCE" 1
  [[ -s "$TASK_SOURCE" ]] || automation_die "implementation task file is empty: $TASK_SOURCE" 1
}

write_paper_handover() {
  [[ "$HANDOVER_PAPER_MODE" == "1" ]] || return 0
  local target="$AUTOMATION_REPO_ROOT/.automation/paper-mode-handover.env"
  mkdir -p "$AUTOMATION_REPO_ROOT/.automation"
  {
    printf 'HANDOVER_KIND=paper-mode-after-autonomous-implementation\n'
    printf 'REPO_NAME=%s\n' "${AUTOMATION_REPO_NAME:-betting-win-surebet}"
    printf 'CONTROLLER=run-autonomous-implementation.sh\n'
    printf 'FINAL_STATUS=%s\n' "$FINAL_STATUS"
    printf 'STOP_REASON=%s\n' "$STOP_REASON"
    printf 'CYCLES_ATTEMPTED=%s\n' "$CYCLES_ATTEMPTED"
    printf 'SERVICE_REFRESH_REQUIRED=0\n'
    printf 'RUNTIME_EVIDENCE_REQUIRED=0\n'
    printf 'PAPER_SERVICE_SUPPORTED=0\n'
    printf 'REAL_UPSTREAM_EVALUATION=blocked_until_federico_pinned_betting_win_interface\n'
    printf 'RUN_DIR=%s\n' "${AUTOMATION_RUN_DIR:-}"
    printf 'WRITTEN_AT=%s\n' "$(automation_now_iso)"
  } > "$target"
  [[ -n "${AUTOMATION_RUN_DIR:-}" ]] && cp "$target" "$AUTOMATION_RUN_DIR/paper-mode-handover.env"
}

finish() {
  local rc=$?
  [[ "$FINISHED" == "1" ]] && return 0
  FINISHED=1
  EXIT_STATUS="$rc"
  if [[ -n "${AUTOMATION_RUN_DIR:-}" ]]; then
    {
      printf '# Autonomous implementation final summary\n\n'
      printf 'final_status=%s\n' "$FINAL_STATUS"
      printf 'stop_reason=%s\n' "$STOP_REASON"
      printf 'exit_status=%s\n' "$EXIT_STATUS"
      printf 'cycles_attempted=%s\n' "$CYCLES_ATTEMPTED"
      printf 'duration_seconds=%s\n' "$DURATION_SECONDS"
      printf 'cycle_timeout_seconds=%s\n' "$CODEX_TIMEOUT_SECONDS"
      printf 'validation_timeout_seconds=%s\n' "$VALIDATION_TIMEOUT_SECONDS"
      printf 'completed_at=%s\n' "$(automation_now_iso)"
    } > "$AUTOMATION_RUN_DIR/final-summary.md"
    write_paper_handover || true
    automation_collect_repo_snapshot "$AUTOMATION_RUN_DIR/final-repo-snapshot"
    automation_build_artifacts_zip "$AUTOMATION_RUN_DIR" "$AUTOMATION_REPO_ROOT" || true
    telegram_notify_send_final "run-autonomous-implementation.sh" "${AUTOMATION_REPO_NAME:-betting-win-surebet}" "$FINAL_STATUS" "$STOP_REASON" "$CYCLES_ATTEMPTED" "$EXIT_STATUS" "$AUTOMATION_RUN_DIR" "$AUTOMATION_CONTROLLER_LOG" "$AUTOMATION_REPO_ROOT" || true
  fi
  [[ "$LOCK_ACQUIRED" == "1" ]] && automation_release_lock || true
}
trap finish EXIT
trap 'FINAL_STATUS="interrupted"; STOP_REASON="interrupted"; exit 130' INT TERM

parse_args "$@" || exit 1
configure_defaults
validate_inputs || exit 1
SCRIPT_NAME="run-autonomous-implementation.sh"
LOCK_FILE="$AUTOMATION_REPO_ROOT/.automation/locks/run-autonomous-implementation.lock"

if [[ "$STATUS_ONLY" == "1" ]]; then automation_status_lock "$LOCK_FILE"; exit 0; fi
if [[ "$FORCE_UNLOCK" == "1" ]]; then automation_force_unlock "$LOCK_FILE" "$SCRIPT_NAME" "$AUTOMATION_REPO_ROOT"; exit 0; fi
if [[ "$PRINT_CONFIG" == "1" ]]; then print_config; exit 0; fi

automation_create_run_dir "autonomous_implementation"
AUTOMATION_SCRIPT_COMMAND="$0 $*"
if [[ "$ALLOW_PARALLEL" == "1" ]]; then automation_log "lock=skipped allow_parallel=1"; else automation_acquire_lock "$SCRIPT_NAME" "$AUTOMATION_REPO_ROOT"; LOCK_ACQUIRED=1; automation_start_heartbeat; fi

assert_active_node_runtime || { FINAL_STATUS="setup_failed"; STOP_REASON="node_runtime_invalid"; exit 1; }
automation_collect_repo_snapshot "$AUTOMATION_RUN_DIR/initial-repo-snapshot"
automation_snapshot_protected "$AUTOMATION_RUN_DIR/protected_before.sha256"
maybe_auto_install || { FINAL_STATUS="setup_failed"; STOP_REASON="auto_install_failed"; exit 1; }
resolve_task_source

if [[ "$CHECK_ONLY" == "1" ]]; then
  automation_log "check_only=1"
  if ! automation_run_validations implementation "$AUTOMATION_RUN_DIR/check-only-validation" "$VALIDATION_TIMEOUT_SECONDS"; then FINAL_STATUS="check_only_validation_failed"; STOP_REASON="check_only_validation_failed"; exit 1; fi
  FINAL_STATUS="check_only_complete"
  STOP_REASON="check_only"
  exit 0
fi

automation_require_command "${AUTOMATION_CODEX_BIN:-codex}"
START_EPOCH="$(automation_now_epoch)"
FINAL_STATUS="CONTINUE_REQUIRED=yes"
STOP_REASON="loop_started"

while true; do
  NOW="$(automation_now_epoch)"
  if (( NOW - START_EPOCH >= DURATION_SECONDS )); then FINAL_STATUS="CONTINUE_REQUIRED=yes"; STOP_REASON="duration_elapsed"; exit 3; fi
  if (( CYCLES_ATTEMPTED >= MAX_CYCLES )); then FINAL_STATUS="CONTINUE_REQUIRED=yes"; STOP_REASON="max_cycles_reached"; exit 3; fi
  CYCLES_ATTEMPTED=$((CYCLES_ATTEMPTED + 1))
  CYCLE_DIR="$AUTOMATION_RUN_DIR/cycles/cycle_${CYCLES_ATTEMPTED}"
  mkdir -p "$CYCLE_DIR"
  PROMPT="$CYCLE_DIR/codex_prompt.md"
  cat > "$PROMPT" <<EOF_PROMPT
Role:
Senior autonomous implementation engineer for the repository at $AUTOMATION_REPO_ROOT.

Objective:
Implement the requested bounded task using the smallest safe changes, then validate.

Read these files before editing:
- AGENTS.md, if present
- docs/repo_status_current.md
- docs/automation/README.md
- docs/automation/PROTECTED_AUTOMATION_FILES.md
- docs/automation/repo-profile.md
- docs/automation/autonomous-implementation.md
- $TASK_SOURCE

Hard constraints:
- Do not commit, push, pull, reset, clean, stash, or rewrite branches.
- Do not print or modify secrets or .env files.
- Do not start, stop, restart, kill, detach, or replace services or user sessions.
- Do not connect to providers, external betting APIs, wallets, signers, orders, transactions, or direct betting-win databases.
- Do not add public reports, profitability claims, live readiness claims, or execution readiness claims.
- Do not modify protected automation files unless the task explicitly says this is automation maintenance.
- Do not silently default missing required configuration. Fail fast with clear validation.
- Preserve existing structure and make surgical changes.

Required cycle output files:
- $CYCLE_DIR/implementation_plan.md
- $CYCLE_DIR/changes_made.md
- $CYCLE_DIR/validation_results.md
- $CYCLE_DIR/remaining_gaps.md
- $CYCLE_DIR/git_diff.patch
- $CYCLE_DIR/final_status.md
- $CYCLE_DIR/continue_status.txt

continue_status.txt must contain exactly one of these lines:
- CONTINUE_REQUIRED=yes
- AUTONOMOUS_GOAL_COMPLETE=yes
- BLOCKED=yes

Task source content:
$(cat "$TASK_SOURCE")
EOF_PROMPT
  if ! automation_run_codex_prompt "$PROMPT" "$CYCLE_DIR/codex.log" "$CODEX_TIMEOUT_SECONDS"; then CODEX_FAILURES=$((CODEX_FAILURES + 1)); FINAL_STATUS="BLOCKED=yes"; STOP_REASON="codex_failed_cycle_${CYCLES_ATTEMPTED}"; (( CODEX_FAILURES >= MAX_CODEX_FAILURES )) && exit 2; continue; fi
  git -C "$AUTOMATION_REPO_ROOT" diff --no-ext-diff > "$CYCLE_DIR/git_diff.patch" 2>/dev/null || true
  if ! automation_check_protected_unchanged "$AUTOMATION_RUN_DIR/protected_before.sha256" "$CYCLE_DIR/protected_after.sha256" "$CYCLE_DIR/protected_diff.patch"; then FINAL_STATUS="BLOCKED=yes"; STOP_REASON="protected_files_changed"; exit 2; fi
  if ! automation_require_cycle_artifacts "$CYCLE_DIR" allow_empty_git_diff implementation_plan.md changes_made.md validation_results.md remaining_gaps.md final_status.md continue_status.txt git_diff.patch; then FINAL_STATUS="BLOCKED=yes"; STOP_REASON="malformed_cycle_artifacts_cycle_${CYCLES_ATTEMPTED}"; exit 2; fi
  if ! automation_run_validations implementation "$CYCLE_DIR/validation" "$VALIDATION_TIMEOUT_SECONDS"; then CONSECUTIVE_VALIDATION_FAILURES=$((CONSECUTIVE_VALIDATION_FAILURES + 1)); FINAL_STATUS="BLOCKED=yes"; STOP_REASON="validation_failed_cycle_${CYCLES_ATTEMPTED}"; (( CONSECUTIVE_VALIDATION_FAILURES >= MAX_CONSECUTIVE_VALIDATION_FAILURES )) && exit 2; continue; fi
  CONSECUTIVE_VALIDATION_FAILURES=0
  if ! CONTINUE_STATUS="$(automation_read_continue_status "$CYCLE_DIR/continue_status.txt")"; then FINAL_STATUS="BLOCKED=yes"; STOP_REASON="malformed_continue_status_cycle_${CYCLES_ATTEMPTED}"; exit 2; fi
  automation_log "cycle=${CYCLES_ATTEMPTED} continue_status=$CONTINUE_STATUS"
  case "$CONTINUE_STATUS" in
    AUTONOMOUS_GOAL_COMPLETE=yes) FINAL_STATUS="AUTONOMOUS_GOAL_COMPLETE=yes"; STOP_REASON="goal_complete"; exit 0 ;;
    BLOCKED=yes) FINAL_STATUS="BLOCKED=yes"; STOP_REASON="blocked_by_cycle_${CYCLES_ATTEMPTED}"; exit 2 ;;
    CONTINUE_REQUIRED=yes) FINAL_STATUS="CONTINUE_REQUIRED=yes"; STOP_REASON="continuing" ;;
  esac
done
