#!/usr/bin/env bash
# Parent no-service paper/autonomous supervisor for betting-win-surebet.
# Inherits the active Node runtime from the parent shell and never sources nvm.sh.
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
AUTOMATION_REPO_ROOT="$SCRIPT_DIR"
# shellcheck source=.automation/lib/run_common.sh
. "$SCRIPT_DIR/.automation/lib/run_common.sh"
# shellcheck source=.automation/lib/controller_hardening_v2.sh
. "$SCRIPT_DIR/.automation/lib/controller_hardening_v2.sh"
# shellcheck source=.automation/lib/telegram_notify.sh
. "$SCRIPT_DIR/.automation/lib/telegram_notify.sh"

SCRIPT_VERSION="2026-07-11.surebet-v2-verified-parent"
SCRIPT_NAME="run-paper-autopilot.sh"
DURATION_SECONDS="$(automation_parse_duration_seconds 7d)"
PAPER_DURATION_SECONDS="$(automation_parse_duration_seconds 72h)"
IMPLEMENTATION_DURATION_SECONDS="$(automation_parse_duration_seconds 72h)"
INTERVAL_SECONDS="$(automation_parse_duration_seconds 5m)"
ADAPTIVE=1
MAX_ROUNDS=0
MAX_SAME_HANDOFF=2
CODEX_MODEL="cli-default"
CODEX_FALLBACK_MODEL="none"
CODEX_SANDBOX=""
CODEX_STREAM_LOGS=""
AUTO_INSTALL=0
KEEP_MONITORING_WHEN_READY=0
PAPER_MAX_CYCLES=""
IMPLEMENTATION_MAX_CYCLES=""
PAPER_CODEX_TIMEOUT_SECONDS=""
IMPLEMENTATION_CYCLE_TIMEOUT_SECONDS=""
VALIDATION_TIMEOUT_SECONDS=""
INSTALL_TIMEOUT_SECONDS=""
ZIP_TIMEOUT_SECONDS=""
REPO_DIR_OVERRIDE=""
STATUS_ONLY=0
FORCE_UNLOCK=0
PRINT_CONFIG=0
FINISHED=0
LOCK_ACQUIRED=0
HEARTBEAT_PID=""
FINAL_STATUS="not_started"
STOP_REASON="not_started"
EXIT_STATUS=0
ROUNDS_COMPLETED=0
START_EPOCH=0
LAST_CHILD="none"
LAST_CHILD_RC="not_run"
LAST_CHILD_STATUS="unknown"
LAST_CHILD_STOP_REASON="unknown"
LAST_CHILD_RUN_DIR=""
LAST_HANDOFF_FINGERPRINT=""
LAST_HANDOFF_COUNT=0
ACTIVE_CHILD_PID=""
ACTIVE_CHILD_KIND="none"
ACTIVE_CHILD_SCRIPT=""
ACTIVE_CHILD_COMMAND=""
ACTIVE_CHILD_TAIL_PID=""
LOCK_FILE=""
PAPER_CHILD_SCRIPT=""
IMPLEMENTATION_CHILD_SCRIPT=""
PAPER_HANDOFF_FILE=""
IMPLEMENTATION_HANDOFF_FILE=""
CURRENT_PAPER_HANDOFF_FINGERPRINT=""

usage() {
  cat <<'EOF_USAGE'
Usage:
  ./run-paper-autopilot.sh [options]

Purpose:
  Parent supervisor that alternates no-service private-paper evaluation and
  bounded autonomous implementation through verified handoff files.

Primary options:
  --duration VALUE                 Overall parent budget. Default: 7d.
  --paper-duration VALUE           Maximum paper child budget. Default: 72h.
  --implementation-duration VALUE  Maximum implementation child budget. Default: 72h.
  --interval VALUE                 Paper-evaluation compatibility interval. Default: 5m.
  --adaptive / --no-adaptive       Paper-evaluation cadence flag. Default: adaptive.
  --max-rounds N                   Diagnostic child-launch ceiling. 0 means unlimited. Default: 0.
  --max-same-handoff N             Repeated semantic handoff ceiling. Default: 2.
  --model MODEL                    Child Codex model. cli-default uses the CLI/profile default.
  --fallback-model MODEL           Child fallback model, or none.
  --repo-dir PATH                  Override repository root.

Child options:
  --sandbox MODE
  --auto-install
  --keep-monitoring-when-ready
  --paper-max-cycles N
  --implementation-max-cycles N
  --paper-codex-timeout VALUE
  --implementation-cycle-timeout VALUE
  --validation-timeout VALUE
  --install-timeout VALUE
  --zip-timeout VALUE
  --stream / --no-stream

Controller options:
  --status
  --force-unlock
  --print-config
  -h, --help

Runtime:
  Activate the repo runtime in the parent shell first:
  . "$HOME/.nvm/nvm.sh" && nvm use 20
  The controller never sources nvm.sh itself.

Safety:
  This parent may call only run-paper-evaluation.sh and
  run-autonomous-implementation.sh --handover-paper-mode. It never owns service
  lifecycle, calls providers, reads betting-win databases, executes orders, or
  mutates Git history.
EOF_USAGE
}

parse_positive_integer() {
  local value="$1" label="$2"
  [[ "$value" =~ ^[1-9][0-9]*$ ]] || {
    echo "ERROR: $label requires a positive integer: $value" >&2
    return 2
  }
}

parse_nonnegative_integer() {
  local value="$1" label="$2"
  [[ "$value" =~ ^[0-9]+$ ]] || {
    echo "ERROR: $label requires a non-negative integer: $value" >&2
    return 2
  }
}

parse_args() {
  local parsed
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --duration|--run-duration) [[ $# -ge 2 ]] || return 2; parsed="$(automation_parse_duration_seconds "$2")" || return 2; DURATION_SECONDS="$parsed"; shift 2 ;;
      --duration=*|--run-duration=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || return 2; DURATION_SECONDS="$parsed"; shift ;;
      --paper-duration) [[ $# -ge 2 ]] || return 2; parsed="$(automation_parse_duration_seconds "$2")" || return 2; PAPER_DURATION_SECONDS="$parsed"; shift 2 ;;
      --paper-duration=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || return 2; PAPER_DURATION_SECONDS="$parsed"; shift ;;
      --implementation-duration) [[ $# -ge 2 ]] || return 2; parsed="$(automation_parse_duration_seconds "$2")" || return 2; IMPLEMENTATION_DURATION_SECONDS="$parsed"; shift 2 ;;
      --implementation-duration=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || return 2; IMPLEMENTATION_DURATION_SECONDS="$parsed"; shift ;;
      --interval|--paper-interval) [[ $# -ge 2 ]] || return 2; parsed="$(automation_parse_duration_seconds "$2")" || return 2; INTERVAL_SECONDS="$parsed"; shift 2 ;;
      --interval=*|--paper-interval=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || return 2; INTERVAL_SECONDS="$parsed"; shift ;;
      --adaptive|--adaptive-interval) ADAPTIVE=1; shift ;;
      --no-adaptive|--no-adaptive-interval) ADAPTIVE=0; shift ;;
      --max-rounds) [[ $# -ge 2 ]] || return 2; parse_nonnegative_integer "$2" --max-rounds || return 2; MAX_ROUNDS="$2"; shift 2 ;;
      --max-rounds=*) parse_nonnegative_integer "${1#*=}" --max-rounds || return 2; MAX_ROUNDS="${1#*=}"; shift ;;
      --max-same-handoff) [[ $# -ge 2 ]] || return 2; parse_positive_integer "$2" --max-same-handoff || return 2; MAX_SAME_HANDOFF="$2"; shift 2 ;;
      --max-same-handoff=*) parse_positive_integer "${1#*=}" --max-same-handoff || return 2; MAX_SAME_HANDOFF="${1#*=}"; shift ;;
      --model) [[ $# -ge 2 ]] || return 2; CODEX_MODEL="$2"; shift 2 ;;
      --model=*) CODEX_MODEL="${1#*=}"; shift ;;
      --fallback-model) [[ $# -ge 2 ]] || return 2; CODEX_FALLBACK_MODEL="$2"; shift 2 ;;
      --fallback-model=*) CODEX_FALLBACK_MODEL="${1#*=}"; shift ;;
      --repo-dir) [[ $# -ge 2 ]] || return 2; REPO_DIR_OVERRIDE="$2"; shift 2 ;;
      --repo-dir=*) REPO_DIR_OVERRIDE="${1#*=}"; shift ;;
      --sandbox) [[ $# -ge 2 ]] || return 2; CODEX_SANDBOX="$2"; shift 2 ;;
      --sandbox=*) CODEX_SANDBOX="${1#*=}"; shift ;;
      --auto-install) AUTO_INSTALL=1; shift ;;
      --keep-monitoring-when-ready) KEEP_MONITORING_WHEN_READY=1; shift ;;
      --paper-max-cycles) [[ $# -ge 2 ]] || return 2; parse_positive_integer "$2" --paper-max-cycles || return 2; PAPER_MAX_CYCLES="$2"; shift 2 ;;
      --paper-max-cycles=*) parse_positive_integer "${1#*=}" --paper-max-cycles || return 2; PAPER_MAX_CYCLES="${1#*=}"; shift ;;
      --implementation-max-cycles) [[ $# -ge 2 ]] || return 2; parse_positive_integer "$2" --implementation-max-cycles || return 2; IMPLEMENTATION_MAX_CYCLES="$2"; shift 2 ;;
      --implementation-max-cycles=*) parse_positive_integer "${1#*=}" --implementation-max-cycles || return 2; IMPLEMENTATION_MAX_CYCLES="${1#*=}"; shift ;;
      --paper-codex-timeout) [[ $# -ge 2 ]] || return 2; parsed="$(automation_parse_duration_seconds "$2")" || return 2; PAPER_CODEX_TIMEOUT_SECONDS="$parsed"; shift 2 ;;
      --paper-codex-timeout=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || return 2; PAPER_CODEX_TIMEOUT_SECONDS="$parsed"; shift ;;
      --implementation-cycle-timeout) [[ $# -ge 2 ]] || return 2; parsed="$(automation_parse_duration_seconds "$2")" || return 2; IMPLEMENTATION_CYCLE_TIMEOUT_SECONDS="$parsed"; shift 2 ;;
      --implementation-cycle-timeout=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || return 2; IMPLEMENTATION_CYCLE_TIMEOUT_SECONDS="$parsed"; shift ;;
      --validation-timeout) [[ $# -ge 2 ]] || return 2; parsed="$(automation_parse_duration_seconds "$2")" || return 2; VALIDATION_TIMEOUT_SECONDS="$parsed"; shift 2 ;;
      --validation-timeout=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || return 2; VALIDATION_TIMEOUT_SECONDS="$parsed"; shift ;;
      --install-timeout) [[ $# -ge 2 ]] || return 2; parsed="$(automation_parse_duration_seconds "$2")" || return 2; INSTALL_TIMEOUT_SECONDS="$parsed"; shift 2 ;;
      --install-timeout=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || return 2; INSTALL_TIMEOUT_SECONDS="$parsed"; shift ;;
      --zip-timeout) [[ $# -ge 2 ]] || return 2; parsed="$(automation_parse_duration_seconds "$2")" || return 2; ZIP_TIMEOUT_SECONDS="$parsed"; shift 2 ;;
      --zip-timeout=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || return 2; ZIP_TIMEOUT_SECONDS="$parsed"; shift ;;
      --stream) CODEX_STREAM_LOGS=1; shift ;;
      --no-stream) CODEX_STREAM_LOGS=0; shift ;;
      --status) STATUS_ONLY=1; shift ;;
      --force-unlock) FORCE_UNLOCK=1; shift ;;
      --print-config) PRINT_CONFIG=1; shift ;;
      -h|--help) usage; exit 0 ;;
      *) echo "ERROR: unknown option: $1" >&2; usage >&2; return 2 ;;
    esac
  done
}

configure_defaults() {
  if [[ -n "$REPO_DIR_OVERRIDE" ]]; then
    AUTOMATION_REPO_ROOT="$(cd "$REPO_DIR_OVERRIDE" && pwd -P)"
  fi
  cd "$AUTOMATION_REPO_ROOT"
  automation_load_config
  CODEX_SANDBOX="${CODEX_SANDBOX:-${AUTOMATION_CODEX_SANDBOX:-danger-full-access}}"
  CODEX_STREAM_LOGS="${CODEX_STREAM_LOGS:-${AUTOMATION_CODEX_STREAM_LOGS:-1}}"
  VALIDATION_TIMEOUT_SECONDS="${VALIDATION_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_VALIDATION_TIMEOUT:-20m}")}"
  INSTALL_TIMEOUT_SECONDS="${INSTALL_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_INSTALL_TIMEOUT:-15m}")}"
  ZIP_TIMEOUT_SECONDS="${ZIP_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_ZIP_TIMEOUT:-10m}")}"
  PAPER_CODEX_TIMEOUT_SECONDS="${PAPER_CODEX_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_PAPER_CODEX_TIMEOUT:-30m}")}"
  IMPLEMENTATION_CYCLE_TIMEOUT_SECONDS="${IMPLEMENTATION_CYCLE_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_CODEX_CYCLE_TIMEOUT:-2h}")}"
  PAPER_MAX_CYCLES="${PAPER_MAX_CYCLES:-${AUTOMATION_PAPER_MAX_CYCLES:-1}}"
  IMPLEMENTATION_MAX_CYCLES="${IMPLEMENTATION_MAX_CYCLES:-${AUTOMATION_MAX_CYCLES:-200}}"
  PAPER_CHILD_SCRIPT="$AUTOMATION_REPO_ROOT/run-paper-evaluation.sh"
  IMPLEMENTATION_CHILD_SCRIPT="$AUTOMATION_REPO_ROOT/run-autonomous-implementation.sh"
  PAPER_HANDOFF_FILE="$AUTOMATION_REPO_ROOT/.automation/paper-mode-to-autonomous-implementation.env"
  IMPLEMENTATION_HANDOFF_FILE="$AUTOMATION_REPO_ROOT/.automation/paper-mode-handover.env"
  LOCK_FILE="$AUTOMATION_REPO_ROOT/.automation/locks/run-paper-autopilot.lock"
}

validate_inputs() {
  local value
  for value in "$DURATION_SECONDS" "$PAPER_DURATION_SECONDS" "$IMPLEMENTATION_DURATION_SECONDS" "$INTERVAL_SECONDS" "$MAX_ROUNDS" "$MAX_SAME_HANDOFF" "$PAPER_MAX_CYCLES" "$IMPLEMENTATION_MAX_CYCLES" "$PAPER_CODEX_TIMEOUT_SECONDS" "$IMPLEMENTATION_CYCLE_TIMEOUT_SECONDS" "$VALIDATION_TIMEOUT_SECONDS" "$INSTALL_TIMEOUT_SECONDS" "$ZIP_TIMEOUT_SECONDS"; do
    [[ "$value" =~ ^[0-9]+$ ]] || { echo "ERROR: expected integer configuration, got: $value" >&2; return 2; }
  done
  (( DURATION_SECONDS > 0 && PAPER_DURATION_SECONDS > 0 && IMPLEMENTATION_DURATION_SECONDS > 0 && INTERVAL_SECONDS > 0 && MAX_SAME_HANDOFF > 0 && PAPER_MAX_CYCLES > 0 && IMPLEMENTATION_MAX_CYCLES > 0 && PAPER_CODEX_TIMEOUT_SECONDS > 0 && IMPLEMENTATION_CYCLE_TIMEOUT_SECONDS > 0 && VALIDATION_TIMEOUT_SECONDS > 0 && INSTALL_TIMEOUT_SECONDS > 0 && ZIP_TIMEOUT_SECONDS > 0 )) || {
    echo "ERROR: duration, timeout, cycle, and repeat values must be positive; max-rounds alone may be 0" >&2
    return 2
  }
  case "$CODEX_SANDBOX" in read-only|workspace-write|danger-full-access) ;; *) echo "ERROR: unsupported sandbox: $CODEX_SANDBOX" >&2; return 2 ;; esac
}

print_config() {
  cat <<EOF_CONFIG
controller=$SCRIPT_NAME
script_version=$SCRIPT_VERSION
controller_mode=paper_evaluation_implementation_parent
repo_dir=$AUTOMATION_REPO_ROOT
duration_seconds=$DURATION_SECONDS
paper_duration_seconds=$PAPER_DURATION_SECONDS
implementation_duration_seconds=$IMPLEMENTATION_DURATION_SECONDS
interval_seconds=$INTERVAL_SECONDS
adaptive=$ADAPTIVE
max_rounds=$MAX_ROUNDS
max_rounds_semantics=0_means_unlimited_parent_duration_and_repeat_guard_apply
max_same_handoff=$MAX_SAME_HANDOFF
model=$CODEX_MODEL
fallback_model=$CODEX_FALLBACK_MODEL
sandbox=$CODEX_SANDBOX
stream_logs=$CODEX_STREAM_LOGS
validation_timeout_seconds=$VALIDATION_TIMEOUT_SECONDS
install_timeout_seconds=$INSTALL_TIMEOUT_SECONDS
zip_timeout_seconds=$ZIP_TIMEOUT_SECONDS
paper_service_lifecycle=none
strict_handoff_parser=enabled
semantic_handoff_fingerprints=enabled
explicit_child_result_contract=enabled
parent_budget_clamping=enabled
child_aware_lock=enabled
EOF_CONFIG
}

assert_active_node_runtime() {
  automation_require_command node
  automation_require_command npm
  local expected_major="" node_version
  node_version="$(node --version 2>/dev/null || true)"
  if [[ -f "$AUTOMATION_REPO_ROOT/.nvmrc" ]]; then
    expected_major="$(tr -d '[:space:]' < "$AUTOMATION_REPO_ROOT/.nvmrc" | sed -E 's/^v?([0-9]+).*/\1/')"
  fi
  if [[ -n "$expected_major" && ! "$node_version" =~ ^v${expected_major}\. ]]; then
    echo "ERROR: active Node runtime must match .nvmrc; expected major $expected_major, got ${node_version:-missing}" >&2
    return 1
  fi
  automation_log "NODE_OK=$node_version"
  automation_log "NPM_OK=$(npm --version 2>/dev/null || true)"
}

maybe_auto_install() {
  [[ "$AUTO_INSTALL" == "1" ]] || return 0
  [[ -d "$AUTOMATION_REPO_ROOT/node_modules" ]] && return 0
  local command="npm install --ignore-scripts"
  [[ -f "$AUTOMATION_REPO_ROOT/package-lock.json" ]] && command="npm ci --ignore-scripts"
  automation_run_shell_command auto_install "$command" "$INSTALL_TIMEOUT_SECONDS" "$AUTOMATION_RUN_DIR/auto-install.log"
}

remaining_parent_seconds() {
  local now elapsed remaining
  now="$(automation_now_epoch)"
  elapsed=$((now - START_EPOCH))
  remaining=$((DURATION_SECONDS - elapsed))
  (( remaining > 0 )) || remaining=0
  printf '%s\n' "$remaining"
}

clamped_child_budget() {
  local configured="$1" remaining
  remaining="$(remaining_parent_seconds)"
  (( remaining > 0 )) || return 1
  if (( configured < remaining )); then printf '%s\n' "$configured"; else printf '%s\n' "$remaining"; fi
}

lock_value() {
  local key="$1"
  automation_v2_load_env_strict "$LOCK_FILE" >/dev/null 2>&1 || return 1
  printf '%s\n' "${AUTOMATION_V2_ENV[$key]-}"
}

write_parent_lock() {
  [[ "$LOCK_ACQUIRED" == "1" ]] || return 0
  automation_v2_write_env_atomic "$LOCK_FILE" \
    "LOCK_SCHEMA_VERSION=1" \
    "CONTROLLER=$SCRIPT_NAME" \
    "CONTROLLER_PID=$$" \
    "REPOSITORY=${AUTOMATION_REPO_NAME:-betting-win-surebet}" \
    "REPO_REALPATH=$(realpath -e -- "$AUTOMATION_REPO_ROOT")" \
    "SCRIPT_REALPATH=$(realpath -e -- "$AUTOMATION_REPO_ROOT/$SCRIPT_NAME")" \
    "RUN_DIR=${AUTOMATION_RUN_DIR:-}" \
    "HEARTBEAT_EPOCH=$(automation_now_epoch)" \
    "HEARTBEAT_AT=$(automation_now_iso)" \
    "ACTIVE_CHILD_PID=${ACTIVE_CHILD_PID:-}" \
    "ACTIVE_CHILD_KIND=${ACTIVE_CHILD_KIND:-none}" \
    "ACTIVE_CHILD_SCRIPT=${ACTIVE_CHILD_SCRIPT:-}" \
    "ACTIVE_CHILD_COMMAND=${ACTIVE_CHILD_COMMAND:-}"
}

status_lock() {
  if [[ ! -f "$LOCK_FILE" ]]; then
    echo "LOCK_STATUS=absent"
    return 0
  fi
  automation_v2_load_env_strict "$LOCK_FILE" || return 2
  echo "LOCK_STATUS=present"
  cat "$LOCK_FILE"
  local pid="${AUTOMATION_V2_ENV[CONTROLLER_PID]-}"
  if [[ "$pid" =~ ^[1-9][0-9]*$ ]] && kill -0 "$pid" 2>/dev/null; then echo "PID_STATUS=alive"; else echo "PID_STATUS=dead"; fi
  local child="${AUTOMATION_V2_ENV[ACTIVE_CHILD_PID]-}"
  if [[ "$child" =~ ^[1-9][0-9]*$ ]] && kill -0 "$child" 2>/dev/null; then echo "ACTIVE_CHILD_STATUS=alive"; else echo "ACTIVE_CHILD_STATUS=absent_or_dead"; fi
}

terminate_verified_child_from_loaded_lock() {
  local child_pid="${AUTOMATION_V2_ENV[ACTIVE_CHILD_PID]-}" child_script="${AUTOMATION_V2_ENV[ACTIVE_CHILD_SCRIPT]-}"
  [[ "$child_pid" =~ ^[1-9][0-9]*$ ]] || return 0
  kill -0 "$child_pid" 2>/dev/null || return 0
  [[ -n "$child_script" ]] || { echo "ERROR: live child PID has no script identity" >&2; return 2; }
  automation_v2_process_matches_script "$child_pid" "$child_script" || {
    echo "ERROR: refusing to terminate child PID with mismatched command: $child_pid" >&2
    return 2
  }
  automation_v2_terminate_process_group "$child_pid" "${AUTOMATION_GRACEFUL_UNLOCK_SECONDS:-30}"
}

force_unlock_parent() {
  if [[ ! -f "$LOCK_FILE" ]]; then echo "FORCE_UNLOCK=no_lock"; return 0; fi
  automation_v2_load_env_strict "$LOCK_FILE" || return 2
  [[ "${AUTOMATION_V2_ENV[REPO_REALPATH]-}" == "$(realpath -e -- "$AUTOMATION_REPO_ROOT")" ]] || { echo "ERROR: lock repo mismatch" >&2; return 2; }
  [[ "${AUTOMATION_V2_ENV[SCRIPT_REALPATH]-}" == "$(realpath -e -- "$AUTOMATION_REPO_ROOT/$SCRIPT_NAME")" ]] || { echo "ERROR: lock script mismatch" >&2; return 2; }
  terminate_verified_child_from_loaded_lock || return 2
  local pid="${AUTOMATION_V2_ENV[CONTROLLER_PID]-}"
  if [[ "$pid" =~ ^[1-9][0-9]*$ ]] && kill -0 "$pid" 2>/dev/null; then
    automation_v2_process_matches_script "$pid" "$AUTOMATION_REPO_ROOT/$SCRIPT_NAME" || { echo "ERROR: refusing to terminate mismatched controller PID" >&2; return 2; }
    kill -TERM "$pid" 2>/dev/null || true
    local waited=0
    while kill -0 "$pid" 2>/dev/null && (( waited < ${AUTOMATION_GRACEFUL_UNLOCK_SECONDS:-30} )); do sleep 1; waited=$((waited + 1)); done
    kill -0 "$pid" 2>/dev/null && kill -KILL "$pid" 2>/dev/null || true
  fi
  rm -f -- "$LOCK_FILE"
  echo "FORCE_UNLOCK=done"
}

refresh_parent_lock_heartbeat() {
  [[ -f "$LOCK_FILE" ]] || return 0
  automation_v2_load_env_strict "$LOCK_FILE" || return 2
  [[ "${AUTOMATION_V2_ENV[CONTROLLER_PID]-}" == "$$" ]] || return 2
  AUTOMATION_V2_ENV[HEARTBEAT_EPOCH]="$(automation_now_epoch)"
  AUTOMATION_V2_ENV[HEARTBEAT_AT]="$(automation_now_iso)"
  automation_v2_write_loaded_env_atomic "$LOCK_FILE"
}

acquire_parent_lock() {
  mkdir -p -- "$(dirname -- "$LOCK_FILE")"
  if [[ -f "$LOCK_FILE" ]]; then
    automation_v2_load_env_strict "$LOCK_FILE" || return 2
    [[ "${AUTOMATION_V2_ENV[REPO_REALPATH]-}" == "$(realpath -e -- "$AUTOMATION_REPO_ROOT")" ]] || { echo "ERROR: existing lock repo mismatch" >&2; return 2; }
    [[ "${AUTOMATION_V2_ENV[SCRIPT_REALPATH]-}" == "$(realpath -e -- "$AUTOMATION_REPO_ROOT/$SCRIPT_NAME")" ]] || { echo "ERROR: existing lock script mismatch" >&2; return 2; }
    local pid="${AUTOMATION_V2_ENV[CONTROLLER_PID]-}" heartbeat="${AUTOMATION_V2_ENV[HEARTBEAT_EPOCH]-0}" age
    if [[ "$pid" =~ ^[1-9][0-9]*$ ]] && kill -0 "$pid" 2>/dev/null; then
      age=$(( $(automation_now_epoch) - heartbeat ))
      if (( age <= ${AUTOMATION_LOCK_STALE_SECONDS:-3600} )); then
        echo "ERROR: paper autopilot lock is active" >&2
        return 2
      fi
      terminate_verified_child_from_loaded_lock || return 2
      automation_v2_process_matches_script "$pid" "$AUTOMATION_REPO_ROOT/$SCRIPT_NAME" || { echo "ERROR: stale lock PID identity mismatch" >&2; return 2; }
      kill -TERM "$pid" 2>/dev/null || true
      local waited=0
      while kill -0 "$pid" 2>/dev/null && (( waited < ${AUTOMATION_GRACEFUL_UNLOCK_SECONDS:-30} )); do sleep 1; waited=$((waited + 1)); done
      kill -0 "$pid" 2>/dev/null && { echo "ERROR: stale parent did not terminate; use --force-unlock after verification" >&2; return 2; }
    fi
    rm -f -- "$LOCK_FILE"
  fi
  LOCK_ACQUIRED=1
  write_parent_lock
  (
    while kill -0 "$$" 2>/dev/null; do
      refresh_parent_lock_heartbeat >/dev/null 2>&1 || true
      sleep "${AUTOMATION_LOCK_HEARTBEAT_SECONDS:-60}"
    done
  ) &
  HEARTBEAT_PID=$!
}

release_parent_lock() {
  [[ -n "$HEARTBEAT_PID" ]] && { kill "$HEARTBEAT_PID" 2>/dev/null || true; wait "$HEARTBEAT_PID" 2>/dev/null || true; }
  if [[ -f "$LOCK_FILE" ]]; then
    automation_v2_load_env_strict "$LOCK_FILE" >/dev/null 2>&1 || return 0
    [[ "${AUTOMATION_V2_ENV[CONTROLLER_PID]-}" == "$$" ]] && rm -f -- "$LOCK_FILE"
  fi
}

rotate_stale_handoffs() {
  local dir="$AUTOMATION_RUN_DIR/stale-handoffs" file
  mkdir -p "$dir"
  for file in "$PAPER_HANDOFF_FILE" "$IMPLEMENTATION_HANDOFF_FILE"; do
    [[ -e "$file" ]] || continue
    [[ -f "$file" && ! -L "$file" ]] || { echo "ERROR: stale handoff is not a non-symlink regular file: $file" >&2; return 2; }
    mv -- "$file" "$dir/$(basename "$file").$(date -u +%Y%m%dT%H%M%SZ)"
  done
}

normalize_paper_handoff() {
  local existing computed repo maintenance allowed
  automation_v2_load_env_strict "$PAPER_HANDOFF_FILE" || return 2
  [[ "$(automation_v2_env_require HANDOVER_KIND)" == "paper-mode-to-autonomous-implementation" ]] || return 2
  repo="${AUTOMATION_V2_ENV[REPOSITORY]-${AUTOMATION_V2_ENV[REPO_NAME]-}}"
  [[ "$repo" == "${AUTOMATION_REPO_NAME:-betting-win-surebet}" ]] || { echo "ERROR: paper handoff repository mismatch" >&2; return 2; }
  [[ "$(automation_v2_env_require RUN_AUTONOMOUS_IMPLEMENTATION_NEXT)" == "yes" ]] || return 2
  [[ "$(automation_v2_env_require AUTONOMOUS_IMPLEMENTATION_EXPECTED_FLAG)" == "--handover-paper-mode" ]] || return 2
  automation_v2_validate_yes_no_value PAPER_MODE_NOOP_SUCCESS_ALLOWED "$(automation_v2_env_require PAPER_MODE_NOOP_SUCCESS_ALLOWED)" || return 2
  automation_v2_validate_yes_no_value PAPER_MODE_AUTOMATION_MAINTENANCE_ALLOWED "$(automation_v2_env_require PAPER_MODE_AUTOMATION_MAINTENANCE_ALLOWED)" || return 2
  automation_v2_env_require PAPER_MODE_REQUIRED_ACTION >/dev/null || return 2
  automation_v2_env_require PAPER_MODE_BLOCKER_FAMILY >/dev/null || return 2
  maintenance="${AUTOMATION_V2_ENV[PAPER_MODE_AUTOMATION_MAINTENANCE_ALLOWED]}"
  allowed="${AUTOMATION_V2_ENV[ALLOWED_PROTECTED_FILES]-none}"
  if [[ "$maintenance" == "yes" && "$allowed" == "none" ]]; then
    echo "ERROR: paper maintenance handoff requires exact ALLOWED_PROTECTED_FILES" >&2
    return 2
  fi
  if [[ "$maintenance" == "no" && "$allowed" != "none" ]]; then
    echo "ERROR: paper handoff allowlist set while maintenance is disabled" >&2
    return 2
  fi
  existing="${AUTOMATION_V2_ENV[HANDOVER_FINGERPRINT]-}"
  if [[ -n "$existing" ]]; then
    computed="$(automation_v2_semantic_env_fingerprint_loaded)" || return 2
    [[ "$existing" == "$computed" ]] || { echo "ERROR: paper handoff fingerprint mismatch" >&2; return 2; }
  fi
  AUTOMATION_V2_ENV[HANDOVER_SCHEMA_VERSION]=1
  AUTOMATION_V2_ENV[REPOSITORY]="${AUTOMATION_REPO_NAME:-betting-win-surebet}"
  AUTOMATION_V2_ENV[ALLOWED_PROTECTED_FILES]="$allowed"
  unset 'AUTOMATION_V2_ENV[HANDOVER_FINGERPRINT]'
  computed="$(automation_v2_semantic_env_fingerprint_loaded)" || return 2
  AUTOMATION_V2_ENV[HANDOVER_FINGERPRINT]="$computed"
  automation_v2_write_loaded_env_atomic "$PAPER_HANDOFF_FILE" || return 2
  CURRENT_PAPER_HANDOFF_FINGERPRINT="$computed"
}

validate_implementation_handoff() {
  local computed existing source_changed source_valid reevaluate
  automation_v2_load_env_strict "$IMPLEMENTATION_HANDOFF_FILE" || return 2
  [[ "$(automation_v2_env_require HANDOVER_SCHEMA_VERSION)" == "1" ]] || return 2
  [[ "$(automation_v2_env_require HANDOVER_KIND)" == "paper-mode-after-autonomous-implementation" ]] || return 2
  [[ "$(automation_v2_env_require REPOSITORY)" == "${AUTOMATION_REPO_NAME:-betting-win-surebet}" ]] || return 2
  [[ "$(automation_v2_env_require SOURCE_HANDOFF_FINGERPRINT)" == "$CURRENT_PAPER_HANDOFF_FINGERPRINT" ]] || { echo "ERROR: implementation return source handoff fingerprint mismatch" >&2; return 2; }
  [[ "$(automation_v2_env_require RUN_PAPER_EVALUATION_NEXT)" == "yes" ]] || { echo "ERROR: implementation return does not request paper re-evaluation" >&2; return 2; }
  [[ "$(automation_v2_env_require AUTONOMOUS_FINAL_STATUS)" == "$LAST_CHILD_STATUS" ]] || { echo "ERROR: implementation return final status mismatch" >&2; return 2; }
  [[ "$(automation_v2_env_require AUTONOMOUS_STOP_REASON)" == "$LAST_CHILD_STOP_REASON" ]] || { echo "ERROR: implementation return stop reason mismatch" >&2; return 2; }
  [[ "$(automation_v2_env_require AUTONOMOUS_FINAL_EXIT_CODE)" == "$LAST_CHILD_RC" ]] || { echo "ERROR: implementation return exit code mismatch" >&2; return 2; }
  source_changed="$(automation_v2_env_require IMPLEMENTATION_SOURCE_CHANGED)" || return 2
  source_valid="$(automation_v2_env_require IMPLEMENTATION_SOURCE_VALIDATION_PASSED)" || return 2
  reevaluate="$(automation_v2_env_require PRIVATE_PAPER_REEVALUATION_REQUIRED)" || return 2
  automation_v2_validate_yes_no_value IMPLEMENTATION_SOURCE_CHANGED "$source_changed" || return 2
  automation_v2_validate_yes_no_value IMPLEMENTATION_SOURCE_VALIDATION_PASSED "$source_valid" || return 2
  automation_v2_validate_yes_no_value PRIVATE_PAPER_REEVALUATION_REQUIRED "$reevaluate" || return 2
  existing="$(automation_v2_env_require HANDOVER_FINGERPRINT)" || return 2
  computed="$(automation_v2_semantic_env_fingerprint_loaded)" || return 2
  [[ "$existing" == "$computed" ]] || { echo "ERROR: implementation return fingerprint mismatch" >&2; return 2; }
}

append_round() {
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$1" "$(automation_now_iso)" "$2" "$3" "$4" "$5" "$6" "$7" "$8" >> "$AUTOMATION_RUN_DIR/rounds.tsv"
}

run_child_controller() {
  local kind="$1" round_dir="$2" budget script output rc declared_rc child_source_before child_source_after
  local -a cmd=()
  budget="$(clamped_child_budget "$([[ "$kind" == paper ]] && echo "$PAPER_DURATION_SECONDS" || echo "$IMPLEMENTATION_DURATION_SECONDS")")" || return 3
  if [[ "$kind" == "paper" ]]; then
    script="$PAPER_CHILD_SCRIPT"
    cmd=(bash "$script" --duration "$budget" --interval "$INTERVAL_SECONDS")
    [[ "$ADAPTIVE" == "1" ]] && cmd+=(--adaptive) || cmd+=(--no-adaptive)
    [[ "$KEEP_MONITORING_WHEN_READY" == "1" ]] && cmd+=(--keep-monitoring-when-ready)
    cmd+=(--model "$CODEX_MODEL" --fallback-model "$CODEX_FALLBACK_MODEL" --repo-dir "$AUTOMATION_REPO_ROOT" --sandbox "$CODEX_SANDBOX" --max-cycles "$PAPER_MAX_CYCLES" --codex-phase-timeout "$PAPER_CODEX_TIMEOUT_SECONDS" --validation-timeout "$VALIDATION_TIMEOUT_SECONDS" --install-timeout "$INSTALL_TIMEOUT_SECONDS")
  else
    script="$IMPLEMENTATION_CHILD_SCRIPT"
    cmd=(bash "$script" --duration "$budget" --model "$CODEX_MODEL" --fallback-model "$CODEX_FALLBACK_MODEL" --repo-dir "$AUTOMATION_REPO_ROOT" --sandbox "$CODEX_SANDBOX" --max-cycles "$IMPLEMENTATION_MAX_CYCLES" --cycle-timeout "$IMPLEMENTATION_CYCLE_TIMEOUT_SECONDS" --validation-timeout "$VALIDATION_TIMEOUT_SECONDS" --install-timeout "$INSTALL_TIMEOUT_SECONDS" --zip-timeout "$ZIP_TIMEOUT_SECONDS" --handover-paper-mode)
  fi
  [[ "$AUTO_INSTALL" == "1" ]] && cmd+=(--auto-install)
  [[ "$CODEX_STREAM_LOGS" == "1" ]] && cmd+=(--stream) || cmd+=(--no-stream)
  printf '%q ' "${cmd[@]}" > "$round_dir/child_command.txt"; printf '\n' >> "$round_dir/child_command.txt"
  output="$round_dir/child_output.log"
  child_source_before="$(automation_v2_source_tree_fingerprint "$AUTOMATION_REPO_ROOT")" || return 2

  ACTIVE_CHILD_KIND="$kind"
  ACTIVE_CHILD_SCRIPT="$script"
  ACTIVE_CHILD_COMMAND="$(automation_quote_argv "${cmd[@]}")"
  setsid "${cmd[@]}" > "$output" 2>&1 &
  ACTIVE_CHILD_PID=$!
  write_parent_lock
  if [[ "$CODEX_STREAM_LOGS" == "1" ]]; then
    tail -n +1 -f --pid="$ACTIVE_CHILD_PID" "$output" &
    ACTIVE_CHILD_TAIL_PID=$!
  fi
  set +e
  wait "$ACTIVE_CHILD_PID"
  rc=$?
  set -e
  [[ -n "$ACTIVE_CHILD_TAIL_PID" ]] && { wait "$ACTIVE_CHILD_TAIL_PID" 2>/dev/null || true; ACTIVE_CHILD_TAIL_PID=""; }
  ACTIVE_CHILD_PID=""; ACTIVE_CHILD_KIND="none"; ACTIVE_CHILD_SCRIPT=""; ACTIVE_CHILD_COMMAND=""; write_parent_lock

  LAST_CHILD="$kind"
  LAST_CHILD_RC="$rc"
  LAST_CHILD_RUN_DIR="$(automation_v2_extract_unique_machine_value "$output" run_dir)" || return 2
  LAST_CHILD_STATUS="$(automation_v2_extract_unique_machine_value "$output" final_status)" || return 2
  LAST_CHILD_STOP_REASON="$(automation_v2_extract_unique_machine_value "$output" stop_reason)" || return 2
  declared_rc="$(automation_v2_extract_unique_machine_value "$output" final_exit_code)" || return 2
  [[ "$declared_rc" =~ ^[0-9]+$ && "$declared_rc" == "$rc" ]] || { echo "ERROR: child declared exit $declared_rc but process exited $rc" >&2; return 2; }
  LAST_CHILD_RUN_DIR="$(automation_v2_safe_repo_path "$AUTOMATION_REPO_ROOT" "$LAST_CHILD_RUN_DIR" yes)" || return 2
  case "$LAST_CHILD_RUN_DIR" in "$AUTOMATION_REPO_ROOT/artifacts/"*) ;; *) echo "ERROR: child run directory is outside artifacts" >&2; return 2 ;; esac
  child_source_after="$(automation_v2_source_tree_fingerprint "$AUTOMATION_REPO_ROOT")" || return 2
  automation_v2_write_env_atomic "$round_dir/child_result.env" \
    "CHILD_KIND=$kind" "CHILD_EXIT_CODE=$rc" "CHILD_FINAL_STATUS=$LAST_CHILD_STATUS" \
    "CHILD_STOP_REASON=$LAST_CHILD_STOP_REASON" "CHILD_RUN_DIR=$LAST_CHILD_RUN_DIR" \
    "CHILD_SOURCE_BEFORE=$child_source_before" "CHILD_SOURCE_AFTER=$child_source_after" \
    "CHILD_SOURCE_CHANGED=$([[ "$child_source_before" == "$child_source_after" ]] && echo no || echo yes)"
  return "$rc"
}

consume_handoffs_into_round() {
  local round_dir="$1"
  [[ -f "$PAPER_HANDOFF_FILE" ]] && mv -- "$PAPER_HANDOFF_FILE" "$round_dir/consumed-paper-mode-to-autonomous-implementation.env"
  [[ -f "$IMPLEMENTATION_HANDOFF_FILE" ]] && mv -- "$IMPLEMENTATION_HANDOFF_FILE" "$round_dir/consumed-paper-mode-handover.env"
}

write_final_summary() {
  [[ -n "${AUTOMATION_RUN_DIR:-}" ]] || return 0
  {
    printf '# Paper autopilot final summary\n\n'
    printf 'script_version=%s\n' "$SCRIPT_VERSION"
    printf 'final_status=%s\n' "$FINAL_STATUS"
    printf 'stop_reason=%s\n' "$STOP_REASON"
    printf 'exit_status=%s\n' "$EXIT_STATUS"
    printf 'rounds_completed=%s\n' "$ROUNDS_COMPLETED"
    printf 'last_child=%s\n' "$LAST_CHILD"
    printf 'last_child_exit_code=%s\n' "$LAST_CHILD_RC"
    printf 'last_child_status=%s\n' "$LAST_CHILD_STATUS"
    printf 'last_child_stop_reason=%s\n' "$LAST_CHILD_STOP_REASON"
    printf 'last_child_run_dir=%s\n' "$LAST_CHILD_RUN_DIR"
    printf 'duration_seconds=%s\n' "$DURATION_SECONDS"
    printf 'max_rounds=%s\n' "$MAX_ROUNDS"
    printf 'max_same_handoff=%s\n' "$MAX_SAME_HANDOFF"
    printf 'paper_service_lifecycle=none\n'
    printf 'completed_at=%s\n' "$(automation_now_iso)"
  } > "$AUTOMATION_RUN_DIR/final_summary.txt"
  cp "$AUTOMATION_RUN_DIR/final_summary.txt" "$AUTOMATION_RUN_DIR/final-summary.md"
}

build_artifacts_zip_bounded() {
  local tmp rel
  [[ -d "${AUTOMATION_RUN_DIR:-}" ]] || return 0
  rel="${AUTOMATION_RUN_DIR#$AUTOMATION_REPO_ROOT/}"
  tmp="$AUTOMATION_REPO_ROOT/.artifacts.zip.tmp.$$.zip"
  rm -f -- "$tmp"
  automation_v2_zip_with_timeout "$ZIP_TIMEOUT_SECONDS" "$tmp" "$AUTOMATION_REPO_ROOT" "$rel" || { local rc=$?; rm -f -- "$tmp"; return "$rc"; }
  mv -f -- "$tmp" "$AUTOMATION_REPO_ROOT/artifacts.zip"
}

terminate_active_child() {
  [[ "$ACTIVE_CHILD_PID" =~ ^[1-9][0-9]*$ ]] || return 0
  kill -0 "$ACTIVE_CHILD_PID" 2>/dev/null || return 0
  automation_v2_process_matches_script "$ACTIVE_CHILD_PID" "$ACTIVE_CHILD_SCRIPT" || { automation_log "active_child_identity_mismatch pid=$ACTIVE_CHILD_PID"; return 2; }
  automation_v2_terminate_process_group "$ACTIVE_CHILD_PID" "${AUTOMATION_GRACEFUL_UNLOCK_SECONDS:-30}"
}

finish() {
  local rc="${1:-$?}" zip_rc=0
  [[ "$FINISHED" == "1" ]] && return 0
  FINISHED=1
  trap - EXIT INT TERM
  EXIT_STATUS="$rc"
  terminate_active_child || true
  if [[ "$FINAL_STATUS" == "not_started" ]]; then FINAL_STATUS="setup_failed"; STOP_REASON="unexpected_exit_before_start"; fi
  if [[ -n "${AUTOMATION_RUN_DIR:-}" ]]; then
    write_final_summary || true
    automation_collect_repo_snapshot "$AUTOMATION_RUN_DIR/final-repo-snapshot" || true
    set +e; build_artifacts_zip_bounded; zip_rc=$?; set -e
    if [[ "$zip_rc" != "0" && "$EXIT_STATUS" == "0" ]]; then FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_ARTIFACT_PACKAGING"; STOP_REASON="artifacts_zip_failed"; EXIT_STATUS=2; write_final_summary || true; fi
    telegram_notify_send_final "run-paper-autopilot.sh" "${AUTOMATION_REPO_NAME:-betting-win-surebet}" "$FINAL_STATUS" "$STOP_REASON" "$ROUNDS_COMPLETED" "$EXIT_STATUS" "$AUTOMATION_RUN_DIR" "$AUTOMATION_RUN_DIR/telegram_notification_status.txt" "$AUTOMATION_REPO_ROOT" || true
  fi
  [[ "$LOCK_ACQUIRED" == "1" ]] && release_parent_lock || true
  printf 'run_dir=%s\n' "${AUTOMATION_RUN_DIR:-}"
  printf 'final_status=%s\n' "$FINAL_STATUS"
  printf 'stop_reason=%s\n' "$STOP_REASON"
  printf 'final_exit_code=%s\n' "$EXIT_STATUS"
  printf 'rounds_completed=%s\n' "$ROUNDS_COMPLETED"
  exit "$EXIT_STATUS"
}

on_signal() { FINAL_STATUS="interrupted"; STOP_REASON="interrupted"; terminate_active_child || true; exit 130; }

main_loop() {
  local next_child="paper" round_dir rc decision fingerprint source_before source_after no_op_allowed source_changed source_valid reevaluate
  printf 'round\tfinished_at\tchild\texit_code\tfinal_status\tstop_reason\tchild_run_dir\tdecision\thandoff_fingerprint\n' > "$AUTOMATION_RUN_DIR/rounds.tsv"
  while true; do
    (( $(remaining_parent_seconds) > 0 )) || { FINAL_STATUS="CONTINUE_REQUIRED"; STOP_REASON="autopilot_time_budget_reached"; exit 3; }
    if (( MAX_ROUNDS > 0 && ROUNDS_COMPLETED >= MAX_ROUNDS )); then FINAL_STATUS="CONTINUE_REQUIRED"; STOP_REASON="max_rounds_reached"; exit 3; fi

    ROUNDS_COMPLETED=$((ROUNDS_COMPLETED + 1))
    round_dir="$AUTOMATION_RUN_DIR/round_$(printf '%03d' "$ROUNDS_COMPLETED")_${next_child}"
    mkdir -p "$round_dir"

    if [[ "$next_child" == "paper" ]]; then
      rm -f -- "$PAPER_HANDOFF_FILE" "$IMPLEMENTATION_HANDOFF_FILE"
      if run_child_controller paper "$round_dir"; then rc=0; else rc=$?; fi
      if [[ -f "$PAPER_HANDOFF_FILE" ]]; then
        normalize_paper_handoff || {
          append_round "$ROUNDS_COMPLETED" paper "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" invalid_paper_handoff none
          FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_HANDOFF_MISMATCH"; STOP_REASON="invalid_paper_handoff"; exit 2
        }
        fingerprint="$CURRENT_PAPER_HANDOFF_FINGERPRINT"
        automation_v2_atomic_copy "$PAPER_HANDOFF_FILE" "$round_dir/output-paper-mode-to-autonomous-implementation.env"
        append_round "$ROUNDS_COMPLETED" paper "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" next_autonomous_implementation "$fingerprint"
        next_child="implementation"
        continue
      fi

      if [[ "$rc" != "0" ]]; then
        append_round "$ROUNDS_COMPLETED" paper "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" blocked_paper_child none
        FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_PAPER_CHILD"; STOP_REASON="paper_child_blocked"; exit 2
      fi
      case "$LAST_CHILD_STATUS" in
        PAPER_EVALUATION_READY_PRIVATE_FIXTURE_ONLY_BLOCKED_ON_PINNED_BUNDLE)
          decision=blocked_on_required_upstream_input
          FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_ON_PINNED_BUNDLE"
          STOP_REASON="private_fixture_only_blocked_on_required_upstream_input"
          ;;
        PAPER_EVALUATION_PINNED_BUNDLE_ACCEPTED_PRIVATE_REPORT_WRITTEN)
          decision=pinned_bundle_private_report_written
          FINAL_STATUS="PAPER_AUTOPILOT_PINNED_BUNDLE_ACCEPTED_PRIVATE_REPORT_WRITTEN"
          STOP_REASON="pinned_bundle_private_report_written"
          ;;
        check_only_complete)
          decision=paper_check_only_complete
          FINAL_STATUS="PAPER_AUTOPILOT_CHECK_ONLY_COMPLETE"
          STOP_REASON="paper_check_only"
          ;;
        *)
          decision=unclassified_paper_terminal
          FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_PAPER_CHILD"
          STOP_REASON="unclassified_paper_terminal"
          ;;
      esac
      append_round "$ROUNDS_COMPLETED" paper "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" "$decision" none
      [[ "$FINAL_STATUS" == "PAPER_AUTOPILOT_BLOCKED_PAPER_CHILD" ]] && exit 2 || exit 0
    fi

    [[ -f "$PAPER_HANDOFF_FILE" ]] || {
      append_round "$ROUNDS_COMPLETED" implementation not_run not_run missing_input_paper_handoff "" blocked_missing_input_handoff none
      FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_HANDOFF_MISMATCH"; STOP_REASON="missing_input_paper_handoff"; exit 2
    }
    normalize_paper_handoff || {
      append_round "$ROUNDS_COMPLETED" implementation not_run not_run invalid_input_paper_handoff "" blocked_invalid_input_handoff none
      FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_HANDOFF_MISMATCH"; STOP_REASON="invalid_input_paper_handoff"; exit 2
    }
    fingerprint="$CURRENT_PAPER_HANDOFF_FINGERPRINT"
    if [[ "$fingerprint" == "$LAST_HANDOFF_FINGERPRINT" ]]; then LAST_HANDOFF_COUNT=$((LAST_HANDOFF_COUNT + 1)); else LAST_HANDOFF_FINGERPRINT="$fingerprint"; LAST_HANDOFF_COUNT=1; fi
    if (( LAST_HANDOFF_COUNT > MAX_SAME_HANDOFF )); then
      append_round "$ROUNDS_COMPLETED" implementation not_run not_run same_semantic_handoff_repeated "" repeated_semantic_handoff "$fingerprint"
      FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_SAME_HANDOFF_REPEATED"; STOP_REASON="same_semantic_handoff_repeated"; exit 2
    fi

    automation_v2_atomic_copy "$PAPER_HANDOFF_FILE" "$round_dir/input-paper-mode-to-autonomous-implementation.env"
    source_before="$(automation_v2_source_tree_fingerprint "$AUTOMATION_REPO_ROOT")"
    rm -f -- "$IMPLEMENTATION_HANDOFF_FILE"
    if run_child_controller implementation "$round_dir"; then rc=0; else rc=$?; fi
    if [[ "$rc" == "3" && "$LAST_CHILD_STATUS" == "CONTINUE_REQUIRED=yes" ]]; then
      append_round "$ROUNDS_COMPLETED" implementation "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" continue_same_implementation "$fingerprint"
      next_child="implementation"
      continue
    fi
    if [[ "$rc" != "0" ]]; then
      append_round "$ROUNDS_COMPLETED" implementation "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" blocked_implementation_child "$fingerprint"
      FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_IMPLEMENTATION_CHILD"; STOP_REASON="implementation_child_blocked"; exit 2
    fi
    [[ -f "$IMPLEMENTATION_HANDOFF_FILE" ]] || {
      append_round "$ROUNDS_COMPLETED" implementation "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" missing_implementation_handoff "$fingerprint"
      FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_HANDOFF_MISMATCH"; STOP_REASON="missing_implementation_handoff"; exit 2
    }
    validate_implementation_handoff || {
      append_round "$ROUNDS_COMPLETED" implementation "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" invalid_implementation_handoff "$fingerprint"
      FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_HANDOFF_MISMATCH"; STOP_REASON="invalid_implementation_handoff"; exit 2
    }

    source_after="$(automation_v2_source_tree_fingerprint "$AUTOMATION_REPO_ROOT")"
    source_changed="${AUTOMATION_V2_ENV[IMPLEMENTATION_SOURCE_CHANGED]}"
    source_valid="${AUTOMATION_V2_ENV[IMPLEMENTATION_SOURCE_VALIDATION_PASSED]}"
    reevaluate="${AUTOMATION_V2_ENV[PRIVATE_PAPER_REEVALUATION_REQUIRED]}"
    automation_v2_load_env_strict "$PAPER_HANDOFF_FILE"
    no_op_allowed="${AUTOMATION_V2_ENV[PAPER_MODE_NOOP_SUCCESS_ALLOWED]}"
    if [[ "$source_before" == "$source_after" ]]; then
      [[ "$source_changed" == "no" ]] || { FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_HANDOFF_MISMATCH"; STOP_REASON="implementation_source_change_claim_mismatch"; exit 2; }
      [[ "$source_valid" == "yes" ]] || { FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_HANDOFF_MISMATCH"; STOP_REASON="implementation_noop_without_validation"; exit 2; }
      [[ "$no_op_allowed" == "yes" ]] || {
        append_round "$ROUNDS_COMPLETED" implementation "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" blocked_implementation_noop "$fingerprint"
        FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_IMPLEMENTATION_NOOP"; STOP_REASON="implementation_noop_for_active_handoff"; exit 2
      }
    else
      [[ "$source_changed" == "yes" && "$source_valid" == "yes" ]] || { FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_HANDOFF_MISMATCH"; STOP_REASON="implementation_source_validation_contract_mismatch"; exit 2; }
    fi
    [[ "$reevaluate" == "yes" ]] || { FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_IMPLEMENTATION_HANDOVER_NOT_REFRESHABLE"; STOP_REASON="private_paper_reevaluation_not_requested"; exit 2; }

    automation_v2_atomic_copy "$IMPLEMENTATION_HANDOFF_FILE" "$round_dir/output-paper-mode-handover.env"
    consume_handoffs_into_round "$round_dir"
    append_round "$ROUNDS_COMPLETED" implementation "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" next_paper_evaluation "$fingerprint"
    next_child="paper"
  done
}

parse_args "$@" || exit 1
configure_defaults
validate_inputs || exit 1
if [[ "$STATUS_ONLY" == "1" ]]; then status_lock; exit $?; fi
if [[ "$FORCE_UNLOCK" == "1" ]]; then force_unlock_parent; exit $?; fi
if [[ "$PRINT_CONFIG" == "1" ]]; then print_config; exit 0; fi

automation_v2_validate_child_script "$AUTOMATION_REPO_ROOT" "$PAPER_CHILD_SCRIPT" || exit 1
automation_v2_validate_child_script "$AUTOMATION_REPO_ROOT" "$IMPLEMENTATION_CHILD_SCRIPT" || exit 1

trap 'finish $?' EXIT
trap on_signal INT TERM

acquire_parent_lock || { FINAL_STATUS="setup_failed"; STOP_REASON="lock_acquisition_failed"; exit 1; }
automation_create_run_dir paper_autopilot
write_parent_lock
assert_active_node_runtime || { FINAL_STATUS="setup_failed"; STOP_REASON="node_runtime_invalid"; exit 1; }
automation_collect_repo_snapshot "$AUTOMATION_RUN_DIR/initial-repo-snapshot"
maybe_auto_install || { FINAL_STATUS="setup_failed"; STOP_REASON="auto_install_failed"; exit 1; }
rotate_stale_handoffs || { FINAL_STATUS="setup_failed"; STOP_REASON="stale_handoff_rotation_failed"; exit 1; }
START_EPOCH="$(automation_now_epoch)"
FINAL_STATUS="CONTINUE_REQUIRED"
STOP_REASON="loop_started"
main_loop
