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

SCRIPT_VERSION="2026-07-13.surebet-v7-parent-only-telegram"
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
LAST_CHILD_SOURCE_BEFORE=""
LAST_CHILD_SOURCE_AFTER=""
LAST_CHILD_SOURCE_CHANGED="unknown"
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
CURRENT_PAPER_HANDOFF_NOOP_ALLOWED="no"
CURRENT_PAPER_HANDOFF_RUN_DIR=""
CURRENT_PAPER_HANDOFF_FINAL_STATUS=""
CURRENT_PAPER_HANDOFF_STOP_REASON=""
CURRENT_PAPER_HANDOFF_EXIT_CODE=""
CHILD_CLEANUP_STATUS="not_attempted"
CHILD_CLEANUP_EXIT_CODE=0
LOCK_RELEASE_STATUS="not_attempted"
LOCK_RELEASE_EXIT_CODE=0
LOCK_PRESERVED="no"

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
cross_controller_lock_guard=enabled
canonical_paper_handoff_required=enabled
legacy_paper_handoff_normalization=disabled
strict_implementation_return_schema=enabled
paper_child_zip_timeout=enabled
atomic_parent_lock_acquisition=enabled
parent_lock_mtime_heartbeat=enabled
verified_force_unlock_termination=enabled
parent_child_cleanup_failure_classification=enabled
parent_lock_release_failure_classification=enabled
lock_preservation_on_child_identity_failure=enabled
child_telegram_notifications=suppressed_by_parent
parent_telegram_notification=final_only
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

parent_repo_name() {
  printf '%s\n' "${AUTOMATION_REPO_NAME:-betting-win-surebet}"
}

parent_repo_realpath() {
  realpath -e -- "$AUTOMATION_REPO_ROOT"
}

parent_script_realpath() {
  realpath -e -- "$AUTOMATION_REPO_ROOT/$SCRIPT_NAME"
}

write_parent_lock_file() {
  local target="$1"
  automation_v2_write_env_atomic "$target" \
    "LOCK_SCHEMA_VERSION=1" \
    "CONTROLLER=$SCRIPT_NAME" \
    "CONTROLLER_PID=$$" \
    "REPOSITORY=$(parent_repo_name)" \
    "REPO_REALPATH=$(parent_repo_realpath)" \
    "SCRIPT_REALPATH=$(parent_script_realpath)" \
    "RUN_DIR=${AUTOMATION_RUN_DIR:-}" \
    "HEARTBEAT_SOURCE=file_mtime" \
    "HEARTBEAT_EPOCH=$(automation_now_epoch)" \
    "HEARTBEAT_AT=$(automation_now_iso)" \
    "ACTIVE_CHILD_PID=${ACTIVE_CHILD_PID:-}" \
    "ACTIVE_CHILD_KIND=${ACTIVE_CHILD_KIND:-none}" \
    "ACTIVE_CHILD_SCRIPT=${ACTIVE_CHILD_SCRIPT:-}" \
    "ACTIVE_CHILD_COMMAND=${ACTIVE_CHILD_COMMAND:-}"
}

claim_parent_lock() {
  automation_v2_claim_env_file_atomic "$LOCK_FILE" \
    "LOCK_SCHEMA_VERSION=1" \
    "CONTROLLER=$SCRIPT_NAME" \
    "CONTROLLER_PID=$$" \
    "REPOSITORY=$(parent_repo_name)" \
    "REPO_REALPATH=$(parent_repo_realpath)" \
    "SCRIPT_REALPATH=$(parent_script_realpath)" \
    "RUN_DIR=${AUTOMATION_RUN_DIR:-}" \
    "HEARTBEAT_SOURCE=file_mtime" \
    "HEARTBEAT_EPOCH=$(automation_now_epoch)" \
    "HEARTBEAT_AT=$(automation_now_iso)" \
    "ACTIVE_CHILD_PID=${ACTIVE_CHILD_PID:-}" \
    "ACTIVE_CHILD_KIND=${ACTIVE_CHILD_KIND:-none}" \
    "ACTIVE_CHILD_SCRIPT=${ACTIVE_CHILD_SCRIPT:-}" \
    "ACTIVE_CHILD_COMMAND=${ACTIVE_CHILD_COMMAND:-}"
}

load_owned_parent_lock() {
  local expected_pid=${1:-}
  automation_v2_load_parent_lock_owned "$LOCK_FILE" "$SCRIPT_NAME" "$(parent_repo_name)" "$(parent_repo_realpath)" "$(parent_script_realpath)" "$expected_pid"
}

write_parent_lock() {
  [[ "$LOCK_ACQUIRED" == 1 ]] || return 0
  load_owned_parent_lock "$$" || return 2
  write_parent_lock_file "$LOCK_FILE"
}

status_lock() {
  if [[ ! -f "$LOCK_FILE" ]]; then
    echo LOCK_STATUS=absent
    return 0
  fi
  load_owned_parent_lock || return 2
  echo LOCK_STATUS=present
  cat "$LOCK_FILE"
  local pid="${AUTOMATION_V2_ENV[CONTROLLER_PID]-}"
  local child="${AUTOMATION_V2_ENV[ACTIVE_CHILD_PID]-}"
  local heartbeat age
  heartbeat=$(automation_v2_parent_lock_mtime_epoch "$LOCK_FILE") || return 2
  age=$(( $(automation_now_epoch) - heartbeat ))
  printf 'HEARTBEAT_MTIME_EPOCH=%s\n' "$heartbeat"
  printf 'HEARTBEAT_AGE_SECONDS=%s\n' "$age"
  automation_v2_process_alive "$pid" && echo PID_STATUS=alive || echo PID_STATUS=dead
  if [[ "$child" =~ ^[1-9][0-9]*$ ]] && automation_v2_process_alive "$child"; then
    echo ACTIVE_CHILD_STATUS=alive
  else
    echo ACTIVE_CHILD_STATUS=absent_or_dead
  fi
}

terminate_verified_child_from_loaded_lock() {
  local child_pid="${AUTOMATION_V2_ENV[ACTIVE_CHILD_PID]-}" child_script="${AUTOMATION_V2_ENV[ACTIVE_CHILD_SCRIPT]-}"
  [[ "$child_pid" =~ ^[1-9][0-9]*$ ]] || return 0
  automation_v2_process_alive "$child_pid" || return 0
  [[ -n "$child_script" ]] || {
    echo "ERROR: live child PID has no script identity" >&2
    return 2
  }
  automation_v2_process_matches_script "$child_pid" "$child_script" || {
    echo "ERROR: refusing to terminate child PID with mismatched command: $child_pid" >&2
    return 2
  }
  automation_v2_terminate_process_group "$child_pid" "${AUTOMATION_GRACEFUL_UNLOCK_SECONDS:-30}"
}

force_unlock_parent() {
  if [[ ! -f "$LOCK_FILE" ]]; then
    echo FORCE_UNLOCK=no_lock
    return 0
  fi
  load_owned_parent_lock || return 2
  local pid="${AUTOMATION_V2_ENV[CONTROLLER_PID]-}"
  terminate_verified_child_from_loaded_lock || return 2
  if automation_v2_process_alive "$pid"; then
    automation_v2_process_matches_script "$pid" "$AUTOMATION_REPO_ROOT/$SCRIPT_NAME" || {
      echo "ERROR: refusing to terminate mismatched controller PID" >&2
      return 2
    }
    automation_v2_terminate_process_group "$pid" "${AUTOMATION_GRACEFUL_UNLOCK_SECONDS:-30}" || return 2
  fi
  if [[ ! -e "$LOCK_FILE" ]]; then
    echo FORCE_UNLOCK=done
    return 0
  fi
  load_owned_parent_lock "$pid" || return 2
  automation_v2_release_owned_parent_lock "$LOCK_FILE" "$SCRIPT_NAME" "$(parent_repo_name)" "$(parent_repo_realpath)" "$(parent_script_realpath)" "$pid" || return 2
  echo FORCE_UNLOCK=done
}

refresh_parent_lock_heartbeat() {
  [[ -f "$LOCK_FILE" ]] || return 2
  automation_v2_touch_owned_parent_lock "$LOCK_FILE" "$SCRIPT_NAME" "$(parent_repo_name)" "$(parent_repo_realpath)" "$(parent_script_realpath)" "$$"
}

start_parent_lock_heartbeat() {
  (
    trap 'exit 0' TERM INT
    local last_heartbeat=0 now interval
    interval="${AUTOMATION_LOCK_HEARTBEAT_SECONDS:-60}"
    [[ "$interval" =~ ^[1-9][0-9]*$ ]] || exit 2
    while automation_v2_process_alive "$$"; do
      now="$(automation_now_epoch)"
      if (( now - last_heartbeat >= interval )); then
        refresh_parent_lock_heartbeat >/dev/null 2>&1 || exit 2
        last_heartbeat="$now"
      fi
      sleep 1
    done
  ) &
  HEARTBEAT_PID=$!
}

stop_parent_lock_heartbeat() {
  if [[ -n "$HEARTBEAT_PID" ]]; then
    kill "$HEARTBEAT_PID" 2>/dev/null || true
    wait "$HEARTBEAT_PID" 2>/dev/null || true
    HEARTBEAT_PID=""
  fi
}

acquire_parent_lock() {
  local pid heartbeat age
  mkdir -p -- "$(dirname -- "$LOCK_FILE")"
  if [[ -e "$LOCK_FILE" ]]; then
    [[ -f "$LOCK_FILE" && ! -L "$LOCK_FILE" ]] || {
      echo "ERROR: existing paper-autopilot lock is not a non-symlink regular file" >&2
      return 2
    }
    load_owned_parent_lock || {
      echo "ERROR: existing paper-autopilot lock is malformed or not owned by this controller; inspect before --force-unlock" >&2
      return 2
    }
    pid="${AUTOMATION_V2_ENV[CONTROLLER_PID]-}"
    heartbeat=$(automation_v2_parent_lock_mtime_epoch "$LOCK_FILE") || return 2
    age=$(( $(automation_now_epoch) - heartbeat ))
    if automation_v2_process_alive "$pid"; then
      if (( age <= ${AUTOMATION_LOCK_STALE_SECONDS:-3600} )); then
        echo "ERROR: paper autopilot lock is active" >&2
        return 2
      fi
      terminate_verified_child_from_loaded_lock || return 2
      automation_v2_process_matches_script "$pid" "$AUTOMATION_REPO_ROOT/$SCRIPT_NAME" || {
        echo "ERROR: stale lock PID identity mismatch" >&2
        return 2
      }
      automation_v2_terminate_process_group "$pid" "${AUTOMATION_GRACEFUL_UNLOCK_SECONDS:-30}" || {
        echo "ERROR: stale parent did not terminate; use --force-unlock after verification" >&2
        return 2
      }
    else
      terminate_verified_child_from_loaded_lock || return 2
    fi
    if [[ -e "$LOCK_FILE" ]]; then
      load_owned_parent_lock "$pid" || return 2
      automation_v2_release_owned_parent_lock "$LOCK_FILE" "$SCRIPT_NAME" "$(parent_repo_name)" "$(parent_repo_realpath)" "$(parent_script_realpath)" "$pid" || return 2
    fi
  fi
  if ! claim_parent_lock; then
    echo "ERROR: paper autopilot lock was acquired concurrently" >&2
    return 2
  fi
  LOCK_ACQUIRED=1
  start_parent_lock_heartbeat || return 2
}

release_parent_lock() {
  stop_parent_lock_heartbeat
  [[ "$LOCK_ACQUIRED" == 1 ]] || return 0
  automation_v2_release_owned_parent_lock "$LOCK_FILE" "$SCRIPT_NAME" "$(parent_repo_name)" "$(parent_repo_realpath)" "$(parent_script_realpath)" "$$" || return 2
  LOCK_ACQUIRED=0
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

validate_loaded_env_keys() {
  local allowed_csv="$1" key
  for key in "${!AUTOMATION_V2_ENV[@]}"; do
    case ",$allowed_csv," in
      *",$key,"*) ;;
      *) echo "ERROR: unsupported handoff key for schema v1: $key" >&2; return 2 ;;
    esac
  done
}

require_handoff_zero_one() {
  local key="$1" value
  value="$(automation_v2_env_require "$key")" || return 2
  case "$value" in
    0|1) printf '%s\n' "$value" ;;
    *) echo "ERROR: $key must be exactly 0 or 1; got: $value" >&2; return 2 ;;
  esac
}

validate_handoff_timestamp() {
  local key="$1" value
  value="$(automation_v2_env_require "$key")" || return 2
  [[ "$value" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]] || {
    echo "ERROR: $key must be an ISO-8601 UTC timestamp" >&2
    return 2
  }
}

validate_exact_protected_file_allowlist() {
  local csv="$1" item known found
  local -a items=()
  [[ -n "$csv" && "$csv" != none ]] || return 2
  IFS=',' read -r -a items <<< "$csv"
  (( ${#items[@]} > 0 )) || return 2
  for item in "${items[@]}"; do
    [[ -n "$item" && "$item" != /* ]] || { echo "ERROR: invalid protected-file allowlist entry: $item" >&2; return 2; }
    case "/$item/" in *'/../'*) echo "ERROR: protected-file allowlist entry escapes the repo: $item" >&2; return 2 ;; esac
    found=0
    for known in "${AUTOMATION_PROTECTED_FILES[@]}"; do
      if [[ "$item" == "$known" ]]; then found=1; break; fi
    done
    [[ "$found" == 1 ]] || { echo "ERROR: handoff allowlist entry is not a protected automation file: $item" >&2; return 2; }
  done
}

validate_handoff_run_and_evidence() {
  local run_dir_value="$1" evidence_value="$2" expected_hash="$3" expected_run_prefix="$4"
  local run_abs evidence_abs actual_hash relative current part
  local -a evidence_parts=()
  [[ "$run_dir_value" == /* ]] || { echo "ERROR: handoff RUN_DIR must be an absolute repo-local path" >&2; return 2; }
  run_abs="$(automation_v2_safe_repo_path "$AUTOMATION_REPO_ROOT" "$run_dir_value" yes)" || return 2
  [[ -d "$run_abs" && ! -L "$run_abs" ]] || { echo "ERROR: handoff RUN_DIR must be a non-symlink directory" >&2; return 2; }
  case "$run_abs" in
    "$AUTOMATION_REPO_ROOT/artifacts/${expected_run_prefix}"*) ;;
    *) echo "ERROR: handoff RUN_DIR does not match expected controller artifact prefix" >&2; return 2 ;;
  esac
  [[ -n "$evidence_value" && "$evidence_value" != /* ]] || { echo "ERROR: SOURCE_EVIDENCE_PATH must be a relative repo-local path" >&2; return 2; }
  case "/$evidence_value/" in *'/../'*) echo "ERROR: SOURCE_EVIDENCE_PATH must not contain parent traversal" >&2; return 2 ;; esac
  evidence_abs="$(automation_v2_safe_repo_path "$AUTOMATION_REPO_ROOT" "$AUTOMATION_REPO_ROOT/$evidence_value" yes)" || return 2
  [[ -f "$evidence_abs" && ! -L "$evidence_abs" ]] || { echo "ERROR: source evidence must be a non-symlink regular file" >&2; return 2; }
  case "$evidence_abs" in "$run_abs"/*) ;; *) echo "ERROR: source evidence must be contained by the handoff RUN_DIR" >&2; return 2 ;; esac
  relative="${evidence_abs#$AUTOMATION_REPO_ROOT/}"
  current="$AUTOMATION_REPO_ROOT"
  IFS='/' read -r -a evidence_parts <<< "$relative"
  for part in "${evidence_parts[@]}"; do
    current="$current/$part"
    [[ ! -L "$current" ]] || { echo "ERROR: source evidence path must not contain symlink components" >&2; return 2; }
  done
  [[ "$expected_hash" =~ ^[a-f0-9]{64}$ ]] || { echo "ERROR: SOURCE_EVIDENCE_SHA256 must be a lowercase SHA-256" >&2; return 2; }
  actual_hash="$(automation_v2_sha256_file "$evidence_abs")" || return 2
  [[ "$actual_hash" == "$expected_hash" ]] || { echo "ERROR: source evidence SHA-256 mismatch" >&2; return 2; }
  printf '%s\n' "$run_abs"
}

validate_optional_pinned_bundle_from_handoff() {
  local raw="$1" resolved relative current part
  local -a parts=()
  [[ -n "$raw" ]] || return 0
  [[ "$raw" != /* && "$raw" == *.json ]] || { echo "ERROR: handoff SUREBET_PINNED_BUNDLE must be a relative repo-local .json path" >&2; return 2; }
  case "/$raw/" in *'/../'*) echo "ERROR: handoff SUREBET_PINNED_BUNDLE must not contain parent traversal" >&2; return 2 ;; esac
  resolved="$(automation_v2_safe_repo_path "$AUTOMATION_REPO_ROOT" "$AUTOMATION_REPO_ROOT/$raw" yes)" || return 2
  [[ -f "$resolved" && ! -L "$resolved" ]] || { echo "ERROR: handoff SUREBET_PINNED_BUNDLE must be a non-symlink regular file" >&2; return 2; }
  relative="${resolved#$AUTOMATION_REPO_ROOT/}"
  current="$AUTOMATION_REPO_ROOT"
  IFS='/' read -r -a parts <<< "$relative"
  for part in "${parts[@]}"; do
    current="$current/$part"
    [[ ! -L "$current" ]] || { echo "ERROR: pinned bundle path must not contain symlink components" >&2; return 2; }
  done
}

validate_paper_handoff() {
  local validation_phase="${1:-retained}"
  local schema repo controller source_run_id paper_status paper_stop paper_exit blocker_family
  local maintenance allowed pinned_required run_dir evidence_hash source_fingerprint current_source existing computed
  automation_v2_load_env_strict "$PAPER_HANDOFF_FILE" || return 2
  validate_loaded_env_keys 'HANDOVER_SCHEMA_VERSION,HANDOVER_KIND,REPOSITORY,CONTROLLER,SOURCE_RUN_ID,RUN_AUTONOMOUS_IMPLEMENTATION_NEXT,AUTONOMOUS_IMPLEMENTATION_EXPECTED_FLAG,PAPER_MODE_FINAL_STATUS,PAPER_MODE_STOP_REASON,PAPER_MODE_FINAL_EXIT_CODE,PAPER_MODE_RESUME_AFTER_IMPLEMENTATION,PAPER_MODE_NOOP_SUCCESS_ALLOWED,PAPER_MODE_REQUIRED_ACTION,PAPER_MODE_BLOCKER_FAMILY,PAPER_MODE_EXPECTED_PRIVATE_PAPER_REEVALUATION_AFTER_SOURCE_CHANGE,PAPER_MODE_AUTOMATION_MAINTENANCE_ALLOWED,ALLOWED_PROTECTED_FILES,PAPER_SERVICE_SUPPORTED,SERVICE_REFRESH_REQUIRED,RUNTIME_EVIDENCE_REQUIRED,PINNED_BUNDLE_REQUIRED,SUREBET_PINNED_BUNDLE,HANDOFF_REASON,PAPER_SOURCE_FINGERPRINT,SOURCE_EVIDENCE_PATH,SOURCE_EVIDENCE_SHA256,VALIDATION_REQUIRED,RUN_DIR,WRITTEN_AT,HANDOVER_FINGERPRINT' || return 2

  schema="$(automation_v2_env_require HANDOVER_SCHEMA_VERSION)" || return 2
  [[ "$schema" == 1 ]] || { echo "ERROR: unsupported paper handoff schema version: $schema" >&2; return 2; }
  [[ "$(automation_v2_env_require HANDOVER_KIND)" == paper-mode-to-autonomous-implementation ]] || return 2
  repo="$(automation_v2_env_require REPOSITORY)" || return 2
  [[ "$repo" == "${AUTOMATION_REPO_NAME:-betting-win-surebet}" ]] || { echo "ERROR: paper handoff repository mismatch" >&2; return 2; }
  controller="$(automation_v2_env_require CONTROLLER)" || return 2
  [[ "$controller" == run-paper-evaluation.sh ]] || { echo "ERROR: paper handoff producer controller mismatch" >&2; return 2; }
  [[ "$(automation_v2_env_require RUN_AUTONOMOUS_IMPLEMENTATION_NEXT)" == yes ]] || return 2
  [[ "$(automation_v2_env_require AUTONOMOUS_IMPLEMENTATION_EXPECTED_FLAG)" == --handover-paper-mode ]] || return 2

  paper_status="$(automation_v2_env_require PAPER_MODE_FINAL_STATUS)" || return 2
  case "$paper_status" in
    PAPER_EVALUATION_BLOCKED_REPO_VALIDATION_FAILED|PAPER_EVALUATION_BLOCKED_SOURCE_FIX_REQUIRED) ;;
    *) echo "ERROR: paper handoff final status is not implementation-actionable: $paper_status" >&2; return 2 ;;
  esac
  paper_stop="$(automation_v2_env_require PAPER_MODE_STOP_REASON)" || return 2
  paper_exit="$(automation_v2_env_require PAPER_MODE_FINAL_EXIT_CODE)" || return 2
  [[ "$paper_exit" == 2 ]] || { echo "ERROR: paper handoff exit code must be 2" >&2; return 2; }
  case "$validation_phase" in
    producer)
      [[ "$LAST_CHILD" == paper ]] || { echo "ERROR: paper handoff producer validation requires the paper child result" >&2; return 2; }
      [[ "$paper_status" == "$LAST_CHILD_STATUS" && "$paper_stop" == "$LAST_CHILD_STOP_REASON" && "$paper_exit" == "$LAST_CHILD_RC" ]] || {
        echo "ERROR: paper handoff does not reconcile with child result" >&2
        return 2
      }
      [[ "$LAST_CHILD_SOURCE_CHANGED" == no ]] || { echo "ERROR: paper child changed source" >&2; return 2; }
      ;;
    retained)
      [[ -n "$CURRENT_PAPER_HANDOFF_FINAL_STATUS" ]] || { echo "ERROR: no previously validated paper handoff state is retained" >&2; return 2; }
      [[ "$paper_status" == "$CURRENT_PAPER_HANDOFF_FINAL_STATUS" && "$paper_stop" == "$CURRENT_PAPER_HANDOFF_STOP_REASON" && "$paper_exit" == "$CURRENT_PAPER_HANDOFF_EXIT_CODE" ]] || {
        echo "ERROR: retained paper handoff terminal fields changed" >&2
        return 2
      }
      ;;
    *) echo "ERROR: unsupported paper handoff validation phase: $validation_phase" >&2; return 2 ;;
  esac

  [[ "$(automation_v2_env_require PAPER_MODE_RESUME_AFTER_IMPLEMENTATION)" == yes ]] || return 2
  CURRENT_PAPER_HANDOFF_NOOP_ALLOWED="$(automation_v2_env_require PAPER_MODE_NOOP_SUCCESS_ALLOWED)" || return 2
  automation_v2_validate_yes_no_value PAPER_MODE_NOOP_SUCCESS_ALLOWED "$CURRENT_PAPER_HANDOFF_NOOP_ALLOWED" || return 2
  [[ "$CURRENT_PAPER_HANDOFF_NOOP_ALLOWED" == no ]] || { echo "ERROR: canonical paper handoff must not allow no-op implementation success" >&2; return 2; }
  [[ "$(automation_v2_env_require PAPER_MODE_REQUIRED_ACTION)" == bounded_source_implementation ]] || return 2
  blocker_family="$(automation_v2_env_require PAPER_MODE_BLOCKER_FAMILY)" || return 2
  case "$blocker_family" in validation|source|controller|artifact) ;; *) return 2 ;; esac
  [[ "$(automation_v2_env_require PAPER_MODE_EXPECTED_PRIVATE_PAPER_REEVALUATION_AFTER_SOURCE_CHANGE)" == yes ]] || return 2
  maintenance="$(automation_v2_env_require PAPER_MODE_AUTOMATION_MAINTENANCE_ALLOWED)" || return 2
  automation_v2_validate_yes_no_value PAPER_MODE_AUTOMATION_MAINTENANCE_ALLOWED "$maintenance" || return 2
  allowed="$(automation_v2_env_require ALLOWED_PROTECTED_FILES)" || return 2
  if [[ "$maintenance" == yes ]]; then
    [[ "$allowed" != none && -n "$allowed" ]] || { echo "ERROR: paper maintenance handoff requires exact ALLOWED_PROTECTED_FILES" >&2; return 2; }
    validate_exact_protected_file_allowlist "$allowed" || return 2
  else
    [[ "$allowed" == none ]] || { echo "ERROR: paper allowlist set while maintenance is disabled" >&2; return 2; }
  fi
  [[ "$(automation_v2_env_require PAPER_SERVICE_SUPPORTED)" == 0 ]] || return 2
  [[ "$(automation_v2_env_require SERVICE_REFRESH_REQUIRED)" == 0 ]] || return 2
  [[ "$(automation_v2_env_require RUNTIME_EVIDENCE_REQUIRED)" == 0 ]] || return 2
  pinned_required="$(require_handoff_zero_one PINNED_BUNDLE_REQUIRED)" || return 2
  validate_optional_pinned_bundle_from_handoff "${AUTOMATION_V2_ENV[SUREBET_PINNED_BUNDLE]-}" || return 2
  if [[ "$pinned_required" == 1 ]]; then [[ -n "${AUTOMATION_V2_ENV[SUREBET_PINNED_BUNDLE]-}" ]] || return 2; fi
  automation_v2_env_require HANDOFF_REASON >/dev/null || return 2
  [[ "$(automation_v2_env_require VALIDATION_REQUIRED)" == npm_run_validate ]] || return 2
  validate_handoff_timestamp WRITTEN_AT || return 2

  run_dir="$(validate_handoff_run_and_evidence "$(automation_v2_env_require RUN_DIR)" "$(automation_v2_env_require SOURCE_EVIDENCE_PATH)" "$(automation_v2_env_require SOURCE_EVIDENCE_SHA256)" paper_evaluation_)" || return 2
  if [[ "$validation_phase" == producer ]]; then
    [[ "$run_dir" == "$LAST_CHILD_RUN_DIR" ]] || { echo "ERROR: paper handoff RUN_DIR does not match child result" >&2; return 2; }
  else
    [[ "$run_dir" == "$CURRENT_PAPER_HANDOFF_RUN_DIR" ]] || { echo "ERROR: retained paper handoff RUN_DIR changed" >&2; return 2; }
  fi
  source_run_id="$(automation_v2_env_require SOURCE_RUN_ID)" || return 2
  [[ "$source_run_id" =~ ^[A-Za-z0-9._:-]+$ && "$(basename "$run_dir")" == "$source_run_id" ]] || { echo "ERROR: paper SOURCE_RUN_ID does not match RUN_DIR" >&2; return 2; }
  evidence_hash="$(automation_v2_env_require SOURCE_EVIDENCE_SHA256)" || return 2
  source_fingerprint="$(automation_v2_env_require PAPER_SOURCE_FINGERPRINT)" || return 2
  [[ "$source_fingerprint" =~ ^[a-f0-9]{64}$ ]] || return 2
  current_source="$(automation_v2_source_tree_fingerprint "$AUTOMATION_REPO_ROOT")" || return 2
  [[ "$source_fingerprint" == "$current_source" ]] || { echo "ERROR: paper handoff source fingerprint is stale" >&2; return 2; }

  existing="$(automation_v2_env_require HANDOVER_FINGERPRINT)" || return 2
  computed="$(automation_v2_semantic_env_fingerprint_loaded)" || return 2
  [[ "$existing" == "$computed" ]] || { echo "ERROR: paper handoff fingerprint mismatch" >&2; return 2; }
  CURRENT_PAPER_HANDOFF_FINGERPRINT="$computed"
  CURRENT_PAPER_HANDOFF_RUN_DIR="$run_dir"
  CURRENT_PAPER_HANDOFF_FINAL_STATUS="$paper_status"
  CURRENT_PAPER_HANDOFF_STOP_REASON="$paper_stop"
  CURRENT_PAPER_HANDOFF_EXIT_CODE="$paper_exit"
  automation_log "paper_handoff_validated schema=1 fingerprint=$computed evidence_sha256=$evidence_hash"
}

validate_implementation_handoff() {
  local computed existing source_changed source_valid reevaluate reaud run_dir
  automation_v2_load_env_strict "$IMPLEMENTATION_HANDOFF_FILE" || return 2
  validate_loaded_env_keys 'HANDOVER_SCHEMA_VERSION,HANDOVER_KIND,REPOSITORY,CONTROLLER,SOURCE_HANDOFF_FINGERPRINT,RUN_PAPER_EVALUATION_NEXT,AUTONOMOUS_FINAL_STATUS,AUTONOMOUS_STOP_REASON,AUTONOMOUS_FINAL_EXIT_CODE,IMPLEMENTATION_SOURCE_CHANGED,IMPLEMENTATION_SOURCE_VALIDATION_PASSED,PRIVATE_PAPER_REEVALUATION_REQUIRED,BUGFIX_REAUDIT_REQUIRED,AUDIT_AREA,BUG_IDS,PAPER_SERVICE_SUPPORTED,SERVICE_REFRESH_REQUIRED,RUNTIME_EVIDENCE_REQUIRED,REAL_UPSTREAM_EVALUATION,RUN_DIR,WRITTEN_AT,HANDOVER_FINGERPRINT' || return 2
  [[ "$(automation_v2_env_require HANDOVER_SCHEMA_VERSION)" == 1 ]] || return 2
  [[ "$(automation_v2_env_require HANDOVER_KIND)" == paper-mode-after-autonomous-implementation ]] || return 2
  [[ "$(automation_v2_env_require REPOSITORY)" == "${AUTOMATION_REPO_NAME:-betting-win-surebet}" ]] || return 2
  [[ "$(automation_v2_env_require CONTROLLER)" == run-autonomous-implementation.sh ]] || { echo "ERROR: implementation return producer controller mismatch" >&2; return 2; }
  [[ "$(automation_v2_env_require SOURCE_HANDOFF_FINGERPRINT)" == "$CURRENT_PAPER_HANDOFF_FINGERPRINT" ]] || { echo "ERROR: implementation return source handoff fingerprint mismatch" >&2; return 2; }
  [[ "$(automation_v2_env_require RUN_PAPER_EVALUATION_NEXT)" == yes ]] || { echo "ERROR: implementation return does not request paper re-evaluation" >&2; return 2; }
  [[ "$(automation_v2_env_require AUTONOMOUS_FINAL_STATUS)" == "$LAST_CHILD_STATUS" ]] || { echo "ERROR: implementation return final status mismatch" >&2; return 2; }
  [[ "$LAST_CHILD_STATUS" == 'AUTONOMOUS_GOAL_COMPLETE=yes' ]] || { echo "ERROR: implementation return is not a terminal goal-complete result" >&2; return 2; }
  [[ "$(automation_v2_env_require AUTONOMOUS_STOP_REASON)" == "$LAST_CHILD_STOP_REASON" ]] || { echo "ERROR: implementation return stop reason mismatch" >&2; return 2; }
  [[ "$(automation_v2_env_require AUTONOMOUS_FINAL_EXIT_CODE)" == "$LAST_CHILD_RC" ]] || { echo "ERROR: implementation return exit code mismatch" >&2; return 2; }
  run_dir="$(automation_v2_safe_repo_path "$AUTOMATION_REPO_ROOT" "$(automation_v2_env_require RUN_DIR)" yes)" || return 2
  [[ -d "$run_dir" && ! -L "$run_dir" && "$run_dir" == "$LAST_CHILD_RUN_DIR" ]] || { echo "ERROR: implementation return RUN_DIR mismatch" >&2; return 2; }
  case "$run_dir" in "$AUTOMATION_REPO_ROOT/artifacts/autonomous_implementation_"*) ;; *) return 2 ;; esac

  source_changed="$(automation_v2_env_require IMPLEMENTATION_SOURCE_CHANGED)" || return 2
  source_valid="$(automation_v2_env_require IMPLEMENTATION_SOURCE_VALIDATION_PASSED)" || return 2
  reevaluate="$(automation_v2_env_require PRIVATE_PAPER_REEVALUATION_REQUIRED)" || return 2
  reaud="$(automation_v2_env_require BUGFIX_REAUDIT_REQUIRED)" || return 2
  automation_v2_validate_yes_no_value IMPLEMENTATION_SOURCE_CHANGED "$source_changed" || return 2
  automation_v2_validate_yes_no_value IMPLEMENTATION_SOURCE_VALIDATION_PASSED "$source_valid" || return 2
  automation_v2_validate_yes_no_value PRIVATE_PAPER_REEVALUATION_REQUIRED "$reevaluate" || return 2
  automation_v2_validate_yes_no_value BUGFIX_REAUDIT_REQUIRED "$reaud" || return 2
  [[ "$reaud" == "$reevaluate" ]] || return 2
  [[ "$(automation_v2_env_require AUDIT_AREA)" == none ]] || return 2
  [[ "$(automation_v2_env_require BUG_IDS)" == none ]] || return 2
  [[ "$(automation_v2_env_require PAPER_SERVICE_SUPPORTED)" == 0 ]] || return 2
  [[ "$(automation_v2_env_require SERVICE_REFRESH_REQUIRED)" == 0 ]] || return 2
  [[ "$(automation_v2_env_require RUNTIME_EVIDENCE_REQUIRED)" == 0 ]] || return 2
  [[ "$(automation_v2_env_require REAL_UPSTREAM_EVALUATION)" == blocked_on_required_upstream_input ]] || return 2
  validate_handoff_timestamp WRITTEN_AT || return 2
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
  local -a cmd=() launch_cmd=()
  budget="$(clamped_child_budget "$([[ "$kind" == paper ]] && echo "$PAPER_DURATION_SECONDS" || echo "$IMPLEMENTATION_DURATION_SECONDS")")" || return 3
  if [[ "$kind" == "paper" ]]; then
    script="$PAPER_CHILD_SCRIPT"
    cmd=(bash "$script" --duration "$budget" --interval "$INTERVAL_SECONDS")
    [[ "$ADAPTIVE" == "1" ]] && cmd+=(--adaptive) || cmd+=(--no-adaptive)
    [[ "$KEEP_MONITORING_WHEN_READY" == "1" ]] && cmd+=(--keep-monitoring-when-ready)
    cmd+=(--model "$CODEX_MODEL" --fallback-model "$CODEX_FALLBACK_MODEL" --repo-dir "$AUTOMATION_REPO_ROOT" --sandbox "$CODEX_SANDBOX" --max-cycles "$PAPER_MAX_CYCLES" --codex-phase-timeout "$PAPER_CODEX_TIMEOUT_SECONDS" --validation-timeout "$VALIDATION_TIMEOUT_SECONDS" --install-timeout "$INSTALL_TIMEOUT_SECONDS" --zip-timeout "$ZIP_TIMEOUT_SECONDS")
  else
    script="$IMPLEMENTATION_CHILD_SCRIPT"
    cmd=(bash "$script" --duration "$budget" --model "$CODEX_MODEL" --fallback-model "$CODEX_FALLBACK_MODEL" --repo-dir "$AUTOMATION_REPO_ROOT" --sandbox "$CODEX_SANDBOX" --max-cycles "$IMPLEMENTATION_MAX_CYCLES" --cycle-timeout "$IMPLEMENTATION_CYCLE_TIMEOUT_SECONDS" --validation-timeout "$VALIDATION_TIMEOUT_SECONDS" --install-timeout "$INSTALL_TIMEOUT_SECONDS" --zip-timeout "$ZIP_TIMEOUT_SECONDS" --handover-paper-mode)
  fi
  [[ "$AUTO_INSTALL" == "1" ]] && cmd+=(--auto-install)
  [[ "$CODEX_STREAM_LOGS" == "1" ]] && cmd+=(--stream) || cmd+=(--no-stream)
  launch_cmd=(env \
    "AUTOMATION_PARENT_CONTROLLER=$SCRIPT_NAME" \
    "AUTOMATION_PARENT_PID=$$" \
    "AUTOMATION_PARENT_LOCK_FILE=$LOCK_FILE" \
    "TELEGRAM_NOTIFY=0" \
    "${cmd[@]}")
  printf '%q ' "${launch_cmd[@]}" > "$round_dir/child_command.txt"; printf '\n' >> "$round_dir/child_command.txt"
  output="$round_dir/child_output.log"
  child_source_before="$(automation_v2_source_tree_fingerprint "$AUTOMATION_REPO_ROOT")" || return 2

  ACTIVE_CHILD_KIND="$kind"
  ACTIVE_CHILD_SCRIPT="$script"
  ACTIVE_CHILD_COMMAND="$(automation_quote_argv "${launch_cmd[@]}")"
  setsid "${launch_cmd[@]}" > "$output" 2>&1 &
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
  child_source_after="$(automation_v2_source_tree_fingerprint "$AUTOMATION_REPO_ROOT")" || return 2
  LAST_CHILD_SOURCE_BEFORE="$child_source_before"
  LAST_CHILD_SOURCE_AFTER="$child_source_after"
  if [[ "$child_source_before" == "$child_source_after" ]]; then LAST_CHILD_SOURCE_CHANGED=no; else LAST_CHILD_SOURCE_CHANGED=yes; fi
  LAST_CHILD_RUN_DIR=""
  LAST_CHILD_STATUS="unknown"
  LAST_CHILD_STOP_REASON="unknown"
  LAST_CHILD_RUN_DIR="$(automation_v2_extract_unique_machine_value "$output" run_dir)" || return 2
  LAST_CHILD_STATUS="$(automation_v2_extract_unique_machine_value "$output" final_status)" || return 2
  LAST_CHILD_STOP_REASON="$(automation_v2_extract_unique_machine_value "$output" stop_reason)" || return 2
  declared_rc="$(automation_v2_extract_unique_machine_value "$output" final_exit_code)" || return 2
  [[ "$declared_rc" =~ ^[0-9]+$ && "$declared_rc" == "$rc" ]] || { echo "ERROR: child declared exit $declared_rc but process exited $rc" >&2; return 2; }
  LAST_CHILD_RUN_DIR="$(automation_v2_safe_repo_path "$AUTOMATION_REPO_ROOT" "$LAST_CHILD_RUN_DIR" yes)" || return 2
  case "$LAST_CHILD_RUN_DIR" in "$AUTOMATION_REPO_ROOT/artifacts/"*) ;; *) echo "ERROR: child run directory is outside artifacts" >&2; return 2 ;; esac
  automation_v2_write_env_atomic "$round_dir/child_result.env" \
    "CHILD_KIND=$kind" "CHILD_EXIT_CODE=$rc" "CHILD_FINAL_STATUS=$LAST_CHILD_STATUS" \
    "CHILD_STOP_REASON=$LAST_CHILD_STOP_REASON" "CHILD_RUN_DIR=$LAST_CHILD_RUN_DIR" \
    "CHILD_SOURCE_BEFORE=$child_source_before" "CHILD_SOURCE_AFTER=$child_source_after" \
    "CHILD_SOURCE_CHANGED=$LAST_CHILD_SOURCE_CHANGED"
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
    printf 'child_cleanup_status=%s\n' "$CHILD_CLEANUP_STATUS"
    printf 'child_cleanup_exit_code=%s\n' "$CHILD_CLEANUP_EXIT_CODE"
    if [[ "$LOCK_RELEASE_STATUS" != "not_attempted" ]]; then
      printf 'lock_release_status=%s\n' "$LOCK_RELEASE_STATUS"
      printf 'lock_release_exit_code=%s\n' "$LOCK_RELEASE_EXIT_CODE"
      printf 'lock_preserved=%s\n' "$LOCK_PRESERVED"
      printf 'lock_file=%s\n' "$LOCK_FILE"
    fi
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
  if [[ ! "$ACTIVE_CHILD_PID" =~ ^[1-9][0-9]*$ ]]; then
    return 0
  fi
  if ! automation_v2_process_alive "$ACTIVE_CHILD_PID"; then
    ACTIVE_CHILD_PID=""
    ACTIVE_CHILD_KIND="none"
    ACTIVE_CHILD_SCRIPT=""
    ACTIVE_CHILD_COMMAND=""
    write_parent_lock || return 2
    return 0
  fi
  automation_v2_process_matches_script "$ACTIVE_CHILD_PID" "$ACTIVE_CHILD_SCRIPT" || {
    automation_log "active_child_identity_mismatch pid=$ACTIVE_CHILD_PID"
    return 2
  }
  automation_v2_terminate_process_group "$ACTIVE_CHILD_PID" "${AUTOMATION_GRACEFUL_UNLOCK_SECONDS:-30}" || return 2
  ACTIVE_CHILD_PID=""
  ACTIVE_CHILD_KIND="none"
  ACTIVE_CHILD_SCRIPT=""
  ACTIVE_CHILD_COMMAND=""
  write_parent_lock || return 2
}

attempt_final_parent_lock_release() {
  local rc=0
  if [[ "$LOCK_ACQUIRED" != "1" ]]; then
    LOCK_RELEASE_STATUS="not_acquired"
    LOCK_RELEASE_EXIT_CODE=0
    LOCK_PRESERVED="no"
    return 0
  fi
  if release_parent_lock; then
    rc=0
  else
    rc=$?
  fi
  LOCK_RELEASE_EXIT_CODE="$rc"
  if [[ "$rc" == "0" ]]; then
    LOCK_RELEASE_STATUS="released"
    LOCK_PRESERVED="no"
    return 0
  fi
  if [[ -e "$LOCK_FILE" ]]; then
    LOCK_RELEASE_STATUS="preserved"
    LOCK_PRESERVED="yes"
  else
    LOCK_RELEASE_STATUS="failed_missing"
    LOCK_PRESERVED="no"
  fi
  automation_log "final_parent_lock_release_failed exit=$rc status=$LOCK_RELEASE_STATUS lock=$LOCK_FILE"
  return "$rc"
}

finish() {
  local rc="${1:-$?}" zip_rc=0 child_cleanup_rc=0 lock_rc=0 corrective_zip_rc=0
  [[ "$FINISHED" == "1" ]] && return 0
  FINISHED=1
  trap - EXIT INT TERM
  EXIT_STATUS="$rc"

  set +e
  terminate_active_child
  child_cleanup_rc=$?
  set -e
  CHILD_CLEANUP_EXIT_CODE="$child_cleanup_rc"
  if [[ "$child_cleanup_rc" == "0" ]]; then
    CHILD_CLEANUP_STATUS="complete"
  else
    CHILD_CLEANUP_STATUS="identity_or_termination_failed"
    FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_CHILD_IDENTITY"
    STOP_REASON="active_child_identity_or_termination_failed"
    EXIT_STATUS=2
    LOCK_RELEASE_STATUS="preserved_due_to_child_cleanup_failure"
    LOCK_RELEASE_EXIT_CODE=0
    LOCK_PRESERVED="yes"
  fi

  if [[ "$FINAL_STATUS" == "not_started" ]]; then
    FINAL_STATUS="setup_failed"
    STOP_REASON="unexpected_exit_before_start"
  fi
  if [[ -n "${AUTOMATION_RUN_DIR:-}" ]]; then
    write_final_summary || true
    automation_collect_repo_snapshot "$AUTOMATION_RUN_DIR/final-repo-snapshot" || true
    set +e
    build_artifacts_zip_bounded
    zip_rc=$?
    set -e
    if [[ "$zip_rc" != "0" && "$EXIT_STATUS" == "0" ]]; then
      FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_ARTIFACT_PACKAGING"
      STOP_REASON="artifacts_zip_failed"
      EXIT_STATUS=2
      write_final_summary || true
    fi
  fi

  if [[ "$child_cleanup_rc" == "0" ]]; then
    set +e
    attempt_final_parent_lock_release
    lock_rc=$?
    set -e
    if [[ "$lock_rc" != "0" ]]; then
      FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_LOCK_RELEASE"
      if [[ "$LOCK_PRESERVED" == "yes" ]]; then
        STOP_REASON="lock_release_failed_lock_preserved"
      else
        STOP_REASON="lock_release_failed"
      fi
      EXIT_STATUS=2
      if [[ -n "${AUTOMATION_RUN_DIR:-}" ]]; then
        write_final_summary || true
        set +e
        build_artifacts_zip_bounded
        corrective_zip_rc=$?
        set -e
        [[ "$corrective_zip_rc" == "0" ]] || automation_log "lock_failure_artifacts_zip_failed exit=$corrective_zip_rc"
      fi
    elif [[ -n "${AUTOMATION_RUN_DIR:-}" ]]; then
      write_final_summary || true
    fi
  fi

  if [[ -n "${AUTOMATION_RUN_DIR:-}" ]]; then
    telegram_notify_send_final "run-paper-autopilot.sh" "${AUTOMATION_REPO_NAME:-betting-win-surebet}" "$FINAL_STATUS" "$STOP_REASON" "$ROUNDS_COMPLETED" "$EXIT_STATUS" "$AUTOMATION_RUN_DIR" "$AUTOMATION_RUN_DIR/telegram_notification_status.txt" "$AUTOMATION_REPO_ROOT" || true
  fi
  printf 'run_dir=%s\n' "${AUTOMATION_RUN_DIR:-}"
  printf 'final_status=%s\n' "$FINAL_STATUS"
  printf 'stop_reason=%s\n' "$STOP_REASON"
  printf 'final_exit_code=%s\n' "$EXIT_STATUS"
  printf 'rounds_completed=%s\n' "$ROUNDS_COMPLETED"
  printf 'child_cleanup_status=%s\n' "$CHILD_CLEANUP_STATUS"
  printf 'child_cleanup_exit_code=%s\n' "$CHILD_CLEANUP_EXIT_CODE"
  printf 'lock_release_status=%s\n' "$LOCK_RELEASE_STATUS"
  printf 'lock_release_exit_code=%s\n' "$LOCK_RELEASE_EXIT_CODE"
  printf 'lock_preserved=%s\n' "$LOCK_PRESERVED"
  exit "$EXIT_STATUS"
}

on_signal() {
  FINAL_STATUS="interrupted"
  STOP_REASON="interrupted"
  exit 130
}

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
      if [[ "$LAST_CHILD_SOURCE_CHANGED" != no ]]; then
        append_round "$ROUNDS_COMPLETED" paper "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" blocked_paper_source_mutation none
        FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_PAPER_SOURCE_MUTATION"
        STOP_REASON="paper_child_changed_source"
        exit 2
      fi
      if [[ -f "$PAPER_HANDOFF_FILE" ]]; then
        validate_paper_handoff producer || {
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
    validate_paper_handoff retained || {
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
      if [[ "$LAST_CHILD_SOURCE_CHANGED" == yes ]]; then
        append_round "$ROUNDS_COMPLETED" implementation "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" blocked_partial_source_change "$fingerprint"
        FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_IMPLEMENTATION_PARTIAL_SOURCE_CHANGE"
        STOP_REASON="implementation_continue_changed_source_without_terminal_handoff"
        exit 2
      fi
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
    no_op_allowed="$CURRENT_PAPER_HANDOFF_NOOP_ALLOWED"
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

automation_assert_no_incompatible_locks "$SCRIPT_NAME" "$AUTOMATION_REPO_ROOT" "$LOCK_FILE"
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
