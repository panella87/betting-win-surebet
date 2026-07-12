#!/usr/bin/env bash
# Parent bug-audit -> implementation -> same-area re-audit supervisor.
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
AUTOMATION_REPO_ROOT="$SCRIPT_DIR"
# shellcheck source=.automation/lib/run_common.sh
. "$SCRIPT_DIR/.automation/lib/run_common.sh"
# shellcheck source=.automation/lib/controller_hardening_v2.sh
. "$SCRIPT_DIR/.automation/lib/controller_hardening_v2.sh"
# shellcheck source=.automation/lib/telegram_notify.sh
. "$SCRIPT_DIR/.automation/lib/telegram_notify.sh"

SCRIPT_VERSION="2026-07-12.surebet-bugfix-autopilot-v4-parent-lock-heartbeat-safety"
SCRIPT_NAME="run-bugfix-autopilot.sh"
DURATION_SECONDS="$(automation_parse_duration_seconds 7d)"
BUGFIX_DURATION_SECONDS="$(automation_parse_duration_seconds 72h)"
IMPLEMENTATION_DURATION_SECONDS="$(automation_parse_duration_seconds 72h)"
MAX_ROUNDS=0
MAX_SAME_HANDOFF=2
CODEX_MODEL="cli-default"
CODEX_FALLBACK_MODEL="none"
CODEX_SANDBOX=""
CODEX_STREAM_LOGS=""
AUTO_INSTALL=0
BUGFIX_MAX_CYCLES=""
IMPLEMENTATION_MAX_CYCLES=""
BUGFIX_CODEX_TIMEOUT_SECONDS=""
IMPLEMENTATION_CYCLE_TIMEOUT_SECONDS=""
VALIDATION_TIMEOUT_SECONDS=""
INSTALL_TIMEOUT_SECONDS=""
ZIP_TIMEOUT_SECONDS=""
FROM_ARTIFACTS=""
REPO_DIR_OVERRIDE=""
STATUS_ONLY=0
FORCE_UNLOCK=0
PRINT_CONFIG=0
FINISHED=0
LOCK_ACQUIRED=0
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
LAST_CHILD_SOURCE_CHANGED="no"
ACTIVE_CHILD_PID=""
ACTIVE_CHILD_KIND="none"
ACTIVE_CHILD_SCRIPT=""
ACTIVE_CHILD_COMMAND=""
ACTIVE_CHILD_TAIL_PID=""
HEARTBEAT_PID=""
LOCK_FILE=""
CHILD_CLEANUP_STATUS="not_attempted"
CHILD_CLEANUP_EXIT_CODE=0
LOCK_RELEASE_STATUS="not_attempted"
LOCK_RELEASE_EXIT_CODE=0
LOCK_PRESERVED="no"
PARENT_LOCK_ENV_LINES=()
BUGFIX_CHILD_SCRIPT=""
IMPLEMENTATION_CHILD_SCRIPT=""
AUDIT_HANDOFF_FILE=""
IMPLEMENTATION_HANDOFF_FILE=""
CAMPAIGN_LEDGER=""
CAMPAIGN_ACTIVE_AREA=""
CAMPAIGN_ACTIVE_STATUS=""
CURRENT_AUDIT_HANDOFF_FINGERPRINT=""
CURRENT_BUG_SIGNATURE=""
CURRENT_AUDIT_BUG_IDS=""
LAST_BUG_SIGNATURE=""
LAST_BUG_SIGNATURE_COUNT=0

CAMPAIGN_AREAS=(
  boundary_and_input_contracts
  filesystem_path_and_artifact_safety
  identity_rules_quotes_and_bundle_parsing
  scenario_solver_rounding_and_capacity_math
  leg_completion_residual_exposure_and_settlement
  reports_cli_batch_and_private_artifact_integrity
  automation_handoff_lock_manifest_and_packaging_integrity
  cross_area_regression_and_campaign_closure
)

usage() {
  cat <<'EOF_USAGE'
Usage:
  ./run-bugfix-autopilot.sh [options]

Purpose:
  Parent campaign supervisor that repeatedly performs:
    bounded read-only bug audit
    -> strict autonomous implementation handoff when needed
    -> validated implementation
    -> mandatory re-audit of the exact same area
  An area closes only after a clean re-audit.

Primary options:
  --duration VALUE                 Overall parent budget. Default: 7d.
  --bugfix-duration VALUE          Maximum bugfix child budget. Default: 72h.
  --implementation-duration VALUE  Maximum implementation child budget. Default: 72h.
  --max-rounds N                   Diagnostic child-launch ceiling. 0 means unlimited. Default: 0.
  --max-same-handoff N             Repeated stable bug-signature ceiling. Default: 2.
  --from-artifacts PATH            Explicit retained evidence for every audit child.
  --model MODEL                    Child Codex model. cli-default uses CLI/profile default.
  --fallback-model MODEL           Child fallback model, or none.
  --repo-dir PATH                  Override repository root.

Child options:
  --sandbox MODE
  --auto-install
  --bugfix-max-cycles N
  --implementation-max-cycles N
  --bugfix-codex-timeout VALUE
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
  Activate the repo runtime in the parent shell first. This controller inherits
  the active Node.js and npm binaries and never sources nvm.sh.

Safety:
  This parent may call only run-autonomous-bugfix.sh and
  run-autonomous-implementation.sh --handover-bugfix-audit. It never calls paper
  evaluation, starts services, connects to providers, reads betting-win databases,
  executes orders, or mutates Git history.
EOF_USAGE
}

parse_positive_integer() { [[ "$1" =~ ^[1-9][0-9]*$ ]] || { echo "ERROR: $2 requires a positive integer: $1" >&2; return 2; }; }
parse_nonnegative_integer() { [[ "$1" =~ ^[0-9]+$ ]] || { echo "ERROR: $2 requires a non-negative integer: $1" >&2; return 2; }; }

parse_args() {
  local parsed
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --duration|--run-duration) [[ $# -ge 2 ]] || return 2; parsed="$(automation_parse_duration_seconds "$2")" || return 2; DURATION_SECONDS="$parsed"; shift 2 ;;
      --duration=*|--run-duration=*) DURATION_SECONDS="$(automation_parse_duration_seconds "${1#*=}")" || return 2; shift ;;
      --bugfix-duration) [[ $# -ge 2 ]] || return 2; BUGFIX_DURATION_SECONDS="$(automation_parse_duration_seconds "$2")" || return 2; shift 2 ;;
      --bugfix-duration=*) BUGFIX_DURATION_SECONDS="$(automation_parse_duration_seconds "${1#*=}")" || return 2; shift ;;
      --implementation-duration) [[ $# -ge 2 ]] || return 2; IMPLEMENTATION_DURATION_SECONDS="$(automation_parse_duration_seconds "$2")" || return 2; shift 2 ;;
      --implementation-duration=*) IMPLEMENTATION_DURATION_SECONDS="$(automation_parse_duration_seconds "${1#*=}")" || return 2; shift ;;
      --max-rounds) [[ $# -ge 2 ]] || return 2; parse_nonnegative_integer "$2" --max-rounds || return 2; MAX_ROUNDS="$2"; shift 2 ;;
      --max-rounds=*) parse_nonnegative_integer "${1#*=}" --max-rounds || return 2; MAX_ROUNDS="${1#*=}"; shift ;;
      --max-same-handoff) [[ $# -ge 2 ]] || return 2; parse_positive_integer "$2" --max-same-handoff || return 2; MAX_SAME_HANDOFF="$2"; shift 2 ;;
      --max-same-handoff=*) parse_positive_integer "${1#*=}" --max-same-handoff || return 2; MAX_SAME_HANDOFF="${1#*=}"; shift ;;
      --from-artifacts) [[ $# -ge 2 ]] || return 2; FROM_ARTIFACTS="$2"; shift 2 ;;
      --from-artifacts=*) FROM_ARTIFACTS="${1#*=}"; shift ;;
      --model) [[ $# -ge 2 ]] || return 2; CODEX_MODEL="$2"; shift 2 ;;
      --model=*) CODEX_MODEL="${1#*=}"; shift ;;
      --fallback-model) [[ $# -ge 2 ]] || return 2; CODEX_FALLBACK_MODEL="$2"; shift 2 ;;
      --fallback-model=*) CODEX_FALLBACK_MODEL="${1#*=}"; shift ;;
      --repo-dir) [[ $# -ge 2 ]] || return 2; REPO_DIR_OVERRIDE="$2"; shift 2 ;;
      --repo-dir=*) REPO_DIR_OVERRIDE="${1#*=}"; shift ;;
      --sandbox) [[ $# -ge 2 ]] || return 2; CODEX_SANDBOX="$2"; shift 2 ;;
      --sandbox=*) CODEX_SANDBOX="${1#*=}"; shift ;;
      --auto-install) AUTO_INSTALL=1; shift ;;
      --bugfix-max-cycles) [[ $# -ge 2 ]] || return 2; parse_positive_integer "$2" --bugfix-max-cycles || return 2; BUGFIX_MAX_CYCLES="$2"; shift 2 ;;
      --bugfix-max-cycles=*) parse_positive_integer "${1#*=}" --bugfix-max-cycles || return 2; BUGFIX_MAX_CYCLES="${1#*=}"; shift ;;
      --implementation-max-cycles) [[ $# -ge 2 ]] || return 2; parse_positive_integer "$2" --implementation-max-cycles || return 2; IMPLEMENTATION_MAX_CYCLES="$2"; shift 2 ;;
      --implementation-max-cycles=*) parse_positive_integer "${1#*=}" --implementation-max-cycles || return 2; IMPLEMENTATION_MAX_CYCLES="${1#*=}"; shift ;;
      --bugfix-codex-timeout) [[ $# -ge 2 ]] || return 2; BUGFIX_CODEX_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "$2")" || return 2; shift 2 ;;
      --bugfix-codex-timeout=*) BUGFIX_CODEX_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "${1#*=}")" || return 2; shift ;;
      --implementation-cycle-timeout) [[ $# -ge 2 ]] || return 2; IMPLEMENTATION_CYCLE_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "$2")" || return 2; shift 2 ;;
      --implementation-cycle-timeout=*) IMPLEMENTATION_CYCLE_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "${1#*=}")" || return 2; shift ;;
      --validation-timeout) [[ $# -ge 2 ]] || return 2; VALIDATION_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "$2")" || return 2; shift 2 ;;
      --validation-timeout=*) VALIDATION_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "${1#*=}")" || return 2; shift ;;
      --install-timeout) [[ $# -ge 2 ]] || return 2; INSTALL_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "$2")" || return 2; shift 2 ;;
      --install-timeout=*) INSTALL_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "${1#*=}")" || return 2; shift ;;
      --zip-timeout) [[ $# -ge 2 ]] || return 2; ZIP_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "$2")" || return 2; shift 2 ;;
      --zip-timeout=*) ZIP_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "${1#*=}")" || return 2; shift ;;
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
  if [[ -n "$REPO_DIR_OVERRIDE" ]]; then AUTOMATION_REPO_ROOT="$(cd "$REPO_DIR_OVERRIDE" && pwd -P)"; fi
  cd "$AUTOMATION_REPO_ROOT"
  automation_load_config
  CODEX_SANDBOX="${CODEX_SANDBOX:-${AUTOMATION_CODEX_SANDBOX:-danger-full-access}}"
  CODEX_STREAM_LOGS="${CODEX_STREAM_LOGS:-${AUTOMATION_CODEX_STREAM_LOGS:-1}}"
  VALIDATION_TIMEOUT_SECONDS="${VALIDATION_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_VALIDATION_TIMEOUT:-20m}")}"
  INSTALL_TIMEOUT_SECONDS="${INSTALL_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_INSTALL_TIMEOUT:-15m}")}"
  ZIP_TIMEOUT_SECONDS="${ZIP_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_ZIP_TIMEOUT:-10m}")}"
  BUGFIX_CODEX_TIMEOUT_SECONDS="${BUGFIX_CODEX_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_CODEX_CYCLE_TIMEOUT:-2h}")}"
  IMPLEMENTATION_CYCLE_TIMEOUT_SECONDS="${IMPLEMENTATION_CYCLE_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_CODEX_CYCLE_TIMEOUT:-2h}")}"
  BUGFIX_MAX_CYCLES="${BUGFIX_MAX_CYCLES:-${AUTOMATION_MAX_CYCLES:-200}}"
  IMPLEMENTATION_MAX_CYCLES="${IMPLEMENTATION_MAX_CYCLES:-${AUTOMATION_MAX_CYCLES:-200}}"
  BUGFIX_CHILD_SCRIPT="$AUTOMATION_REPO_ROOT/run-autonomous-bugfix.sh"
  IMPLEMENTATION_CHILD_SCRIPT="$AUTOMATION_REPO_ROOT/run-autonomous-implementation.sh"
  AUDIT_HANDOFF_FILE="$AUTOMATION_REPO_ROOT/.automation/autonomous-implementation-handover.env"
  IMPLEMENTATION_HANDOFF_FILE="$AUTOMATION_REPO_ROOT/.automation/bugfix-mode-handover.env"
  LOCK_FILE="$AUTOMATION_REPO_ROOT/.automation/locks/run-bugfix-autopilot.lock"
  if [[ -n "$FROM_ARTIFACTS" ]]; then [[ -e "$FROM_ARTIFACTS" ]] || { echo "ERROR: --from-artifacts path not found" >&2; return 2; }; FROM_ARTIFACTS="$(realpath -e -- "$FROM_ARTIFACTS")"; fi
}

validate_inputs() {
  local value
  for value in "$DURATION_SECONDS" "$BUGFIX_DURATION_SECONDS" "$IMPLEMENTATION_DURATION_SECONDS" "$MAX_ROUNDS" "$MAX_SAME_HANDOFF" "$BUGFIX_MAX_CYCLES" "$IMPLEMENTATION_MAX_CYCLES" "$BUGFIX_CODEX_TIMEOUT_SECONDS" "$IMPLEMENTATION_CYCLE_TIMEOUT_SECONDS" "$VALIDATION_TIMEOUT_SECONDS" "$INSTALL_TIMEOUT_SECONDS" "$ZIP_TIMEOUT_SECONDS"; do
    [[ "$value" =~ ^[0-9]+$ ]] || return 2
  done
  (( DURATION_SECONDS > 0 && BUGFIX_DURATION_SECONDS > 0 && IMPLEMENTATION_DURATION_SECONDS > 0 && MAX_SAME_HANDOFF > 0 && BUGFIX_MAX_CYCLES > 0 && IMPLEMENTATION_MAX_CYCLES > 0 && BUGFIX_CODEX_TIMEOUT_SECONDS > 0 && IMPLEMENTATION_CYCLE_TIMEOUT_SECONDS > 0 && VALIDATION_TIMEOUT_SECONDS > 0 && INSTALL_TIMEOUT_SECONDS > 0 && ZIP_TIMEOUT_SECONDS > 0 )) || return 2
  case "$CODEX_SANDBOX" in read-only|workspace-write|danger-full-access) ;; *) return 2 ;; esac
}

print_config() {
  cat <<EOF_CONFIG
controller=$SCRIPT_NAME
script_version=$SCRIPT_VERSION
controller_mode=bug_audit_implementation_same_area_reaudit_parent
repo_dir=$AUTOMATION_REPO_ROOT
duration_seconds=$DURATION_SECONDS
bugfix_duration_seconds=$BUGFIX_DURATION_SECONDS
implementation_duration_seconds=$IMPLEMENTATION_DURATION_SECONDS
max_rounds=$MAX_ROUNDS
max_rounds_semantics=0_means_unlimited_parent_duration_and_repeat_guard_apply
max_same_handoff=$MAX_SAME_HANDOFF
from_artifacts=${FROM_ARTIFACTS:-auto}
model=$CODEX_MODEL
fallback_model=$CODEX_FALLBACK_MODEL
sandbox=$CODEX_SANDBOX
stream_logs=$CODEX_STREAM_LOGS
validation_timeout_seconds=$VALIDATION_TIMEOUT_SECONDS
install_timeout_seconds=$INSTALL_TIMEOUT_SECONDS
zip_timeout_seconds=$ZIP_TIMEOUT_SECONDS
campaign_total_areas=${#CAMPAIGN_AREAS[@]}
mandatory_same_area_reaudit=enabled
strict_handoff_parser=enabled
semantic_bug_signature_repeat_guard=enabled
explicit_child_result_contract=enabled
parent_budget_clamping=enabled
child_aware_lock=enabled
cross_controller_lock_guard=enabled
atomic_parent_lock_acquisition=enabled
parent_child_cleanup_failure_classification=enabled
parent_lock_release_failure_classification=enabled
lock_preservation_on_child_identity_failure=enabled
verified_kill_escalation=enabled
responsive_parent_heartbeat=enabled
heartbeat_update_mode=file_mtime_no_state_rewrite
paper_controller_calls=prohibited
service_lifecycle=none
EOF_CONFIG
}

assert_active_node_runtime() {
  automation_require_command node
  automation_require_command npm
  local expected_major="" node_version
  node_version="$(node --version 2>/dev/null || true)"
  [[ -f "$AUTOMATION_REPO_ROOT/.nvmrc" ]] && expected_major="$(tr -d '[:space:]' < "$AUTOMATION_REPO_ROOT/.nvmrc" | sed -E 's/^v?([0-9]+).*/\1/')"
  [[ -z "$expected_major" || "$node_version" =~ ^v${expected_major}\. ]] || { echo "ERROR: active Node runtime must match .nvmrc" >&2; return 1; }
  automation_log "NODE_OK=$node_version"
  automation_log "NPM_OK=$(npm --version 2>/dev/null || true)"
}

maybe_auto_install() {
  [[ "$AUTO_INSTALL" == 1 ]] || return 0
  [[ -d "$AUTOMATION_REPO_ROOT/node_modules" ]] && return 0
  local command="npm install --ignore-scripts"
  [[ -f "$AUTOMATION_REPO_ROOT/package-lock.json" ]] && command="npm ci --ignore-scripts"
  automation_run_shell_command auto_install "$command" "$INSTALL_TIMEOUT_SECONDS" "$AUTOMATION_RUN_DIR/auto-install.log"
}

remaining_parent_seconds() {
  local remaining=$((DURATION_SECONDS - ($(automation_now_epoch) - START_EPOCH)))
  (( remaining > 0 )) || remaining=0
  printf '%s\n' "$remaining"
}

clamped_child_budget() {
  local configured="$1" remaining
  remaining="$(remaining_parent_seconds)"
  (( remaining > 0 )) || return 1
  (( configured < remaining )) && printf '%s\n' "$configured" || printf '%s\n' "$remaining"
}

populate_parent_lock_env_lines() {
  PARENT_LOCK_ENV_LINES=(
    "LOCK_SCHEMA_VERSION=1"
    "CONTROLLER=$SCRIPT_NAME"
    "CONTROLLER_PID=$$"
    "REPOSITORY=${AUTOMATION_REPO_NAME:-betting-win-surebet}"
    "REPO_REALPATH=$(realpath -e -- "$AUTOMATION_REPO_ROOT")"
    "SCRIPT_REALPATH=$(realpath -e -- "$AUTOMATION_REPO_ROOT/$SCRIPT_NAME")"
    "RUN_DIR=${AUTOMATION_RUN_DIR:-}"
    "HEARTBEAT_EPOCH=$(automation_now_epoch)"
    "HEARTBEAT_AT=$(automation_now_iso)"
    "HEARTBEAT_SOURCE=file_mtime"
    "ACTIVE_CHILD_PID=${ACTIVE_CHILD_PID:-}"
    "ACTIVE_CHILD_KIND=${ACTIVE_CHILD_KIND:-none}"
    "ACTIVE_CHILD_SCRIPT=${ACTIVE_CHILD_SCRIPT:-}"
    "ACTIVE_CHILD_COMMAND=${ACTIVE_CHILD_COMMAND:-}"
  )
}

write_parent_lock_file() {
  local target="$1"
  populate_parent_lock_env_lines
  automation_v2_write_env_atomic "$target" "${PARENT_LOCK_ENV_LINES[@]}"
}

write_parent_lock() {
  [[ "$LOCK_ACQUIRED" == 1 ]] || return 0
  write_parent_lock_file "$LOCK_FILE"
}

claim_parent_lock() {
  populate_parent_lock_env_lines
  automation_v2_claim_env_lock_atomic "$LOCK_FILE" "${PARENT_LOCK_ENV_LINES[@]}"
}

status_lock() {
  [[ -f "$LOCK_FILE" && ! -L "$LOCK_FILE" ]] || {
    [[ ! -e "$LOCK_FILE" ]] && { echo LOCK_STATUS=absent; return 0; }
    echo "ERROR: bugfix-autopilot lock is not a non-symlink regular file: $LOCK_FILE" >&2
    return 2
  }
  automation_v2_load_env_strict "$LOCK_FILE" || return 2
  echo LOCK_STATUS=present
  cat "$LOCK_FILE"
  local pid="${AUTOMATION_V2_ENV[CONTROLLER_PID]-}" child="${AUTOMATION_V2_ENV[ACTIVE_CHILD_PID]-}" heartbeat_mtime
  heartbeat_mtime="$(automation_v2_lock_mtime_epoch "$LOCK_FILE")" || return 2
  echo "HEARTBEAT_MTIME_EPOCH=$heartbeat_mtime"
  automation_v2_pid_alive "$pid" && echo PID_STATUS=alive || echo PID_STATUS=dead
  automation_v2_pid_alive "$child" && echo ACTIVE_CHILD_STATUS=alive || echo ACTIVE_CHILD_STATUS=absent_or_dead
}

terminate_verified_child_from_loaded_lock() {
  local pid="${AUTOMATION_V2_ENV[ACTIVE_CHILD_PID]-}" script="${AUTOMATION_V2_ENV[ACTIVE_CHILD_SCRIPT]-}"
  [[ "$pid" =~ ^[1-9][0-9]*$ ]] || return 0
  automation_v2_pid_alive "$pid" || return 0
  [[ -n "$script" ]] || { echo "ERROR: live child PID has no script identity" >&2; return 2; }
  automation_v2_process_matches_script "$pid" "$script" || {
    echo "ERROR: refusing to terminate child PID with mismatched command: $pid" >&2
    return 2
  }
  automation_v2_terminate_process_group "$pid" "${AUTOMATION_GRACEFUL_UNLOCK_SECONDS:-30}" 10
}

force_unlock_parent() {
  [[ -f "$LOCK_FILE" && ! -L "$LOCK_FILE" ]] || {
    [[ ! -e "$LOCK_FILE" ]] && { echo FORCE_UNLOCK=no_lock; return 0; }
    echo "ERROR: bugfix-autopilot lock is not a non-symlink regular file: $LOCK_FILE" >&2
    return 2
  }
  automation_v2_load_env_strict "$LOCK_FILE" || return 2
  local repo_real script_real pid
  repo_real="$(realpath -e -- "$AUTOMATION_REPO_ROOT")"
  script_real="$(realpath -e -- "$AUTOMATION_REPO_ROOT/$SCRIPT_NAME")"
  [[ "${AUTOMATION_V2_ENV[LOCK_SCHEMA_VERSION]-}" == 1 ]] || { echo "ERROR: lock schema mismatch" >&2; return 2; }
  [[ "${AUTOMATION_V2_ENV[CONTROLLER]-}" == "$SCRIPT_NAME" ]] || { echo "ERROR: lock controller mismatch" >&2; return 2; }
  [[ "${AUTOMATION_V2_ENV[REPO_REALPATH]-}" == "$repo_real" ]] || { echo "ERROR: lock repo mismatch" >&2; return 2; }
  [[ "${AUTOMATION_V2_ENV[SCRIPT_REALPATH]-}" == "$script_real" ]] || { echo "ERROR: lock script mismatch" >&2; return 2; }
  terminate_verified_child_from_loaded_lock || return 2
  pid="${AUTOMATION_V2_ENV[CONTROLLER_PID]-}"
  [[ "$pid" =~ ^[1-9][0-9]*$ ]] || return 2
  if automation_v2_pid_alive "$pid"; then
    automation_v2_process_matches_script "$pid" "$script_real" || { echo "ERROR: refusing to terminate mismatched controller PID" >&2; return 2; }
    kill -TERM "$pid" 2>/dev/null || true
    if ! automation_v2_wait_for_pid_exit "$pid" "${AUTOMATION_GRACEFUL_UNLOCK_SECONDS:-30}"; then
      kill -KILL "$pid" 2>/dev/null || true
      automation_v2_wait_for_pid_exit "$pid" 10 || { echo "ERROR: force-unlock failed: verified controller PID remains alive: $pid" >&2; return 2; }
    fi
  fi
  if [[ -e "$LOCK_FILE" ]]; then
    automation_v2_release_owned_env_lock "$LOCK_FILE" "$pid" "$repo_real" "$script_real" || return 2
  fi
  echo FORCE_UNLOCK=done
}

refresh_parent_lock_heartbeat() {
  [[ -f "$LOCK_FILE" && ! -L "$LOCK_FILE" ]] || return 0
  automation_v2_load_env_strict "$LOCK_FILE" || return 2
  [[ "${AUTOMATION_V2_ENV[CONTROLLER_PID]-}" == "$$" ]] || return 2
  # Heartbeats update only lock metadata. Rewriting the env body from a heartbeat
  # subshell can race with parent-side active-child updates and restore stale data.
  touch -m -- "$LOCK_FILE" || return 2
}

acquire_parent_lock() {
  local pid heartbeat age waited=0 repo_real script_real
  repo_real="$(realpath -e -- "$AUTOMATION_REPO_ROOT")"
  script_real="$(realpath -e -- "$AUTOMATION_REPO_ROOT/$SCRIPT_NAME")"
  mkdir -p -- "$(dirname -- "$LOCK_FILE")"
  if [[ -e "$LOCK_FILE" ]]; then
    [[ -f "$LOCK_FILE" && ! -L "$LOCK_FILE" ]] || { echo "ERROR: existing bugfix-autopilot lock is not a non-symlink regular file" >&2; return 2; }
    automation_v2_load_env_strict "$LOCK_FILE" || { echo "ERROR: existing bugfix-autopilot lock is malformed; inspect before --force-unlock" >&2; return 2; }
    [[ "${AUTOMATION_V2_ENV[LOCK_SCHEMA_VERSION]-}" == 1 ]] || { echo "ERROR: existing lock schema mismatch" >&2; return 2; }
    [[ "${AUTOMATION_V2_ENV[CONTROLLER]-}" == "$SCRIPT_NAME" ]] || { echo "ERROR: existing lock controller mismatch" >&2; return 2; }
    [[ "${AUTOMATION_V2_ENV[REPO_REALPATH]-}" == "$repo_real" ]] || { echo "ERROR: existing lock repo mismatch" >&2; return 2; }
    [[ "${AUTOMATION_V2_ENV[SCRIPT_REALPATH]-}" == "$script_real" ]] || { echo "ERROR: existing lock script mismatch" >&2; return 2; }
    pid="${AUTOMATION_V2_ENV[CONTROLLER_PID]-}"
    [[ "${AUTOMATION_V2_ENV[HEARTBEAT_SOURCE]-}" == file_mtime ]] || { echo "ERROR: existing lock heartbeat source mismatch" >&2; return 2; }
    heartbeat="$(automation_v2_lock_mtime_epoch "$LOCK_FILE")" || return 2
    [[ "$pid" =~ ^[1-9][0-9]*$ ]] || { echo "ERROR: existing lock controller PID is invalid" >&2; return 2; }
    if automation_v2_pid_alive "$pid"; then
      [[ "$heartbeat" =~ ^[0-9]+$ ]] || { echo "ERROR: existing live lock heartbeat is invalid" >&2; return 2; }
      age=$(( $(automation_now_epoch) - heartbeat ))
      if (( age <= ${AUTOMATION_LOCK_STALE_SECONDS:-3600} )); then
        echo "ERROR: bugfix autopilot lock is active" >&2
        return 2
      fi
      terminate_verified_child_from_loaded_lock || return 2
      automation_v2_process_matches_script "$pid" "$script_real" || { echo "ERROR: stale lock PID identity mismatch" >&2; return 2; }
      kill -TERM "$pid" 2>/dev/null || true
      while automation_v2_pid_alive "$pid" && (( waited < ${AUTOMATION_GRACEFUL_UNLOCK_SECONDS:-30} )); do sleep 1; waited=$((waited + 1)); done
      automation_v2_pid_alive "$pid" && { echo "ERROR: stale parent did not terminate; use --force-unlock after verification" >&2; return 2; }
    fi
    if [[ -e "$LOCK_FILE" ]]; then
      automation_v2_release_owned_env_lock "$LOCK_FILE" "$pid" "$repo_real" "$script_real" || return 2
    fi
  fi
  if ! claim_parent_lock; then
    echo "ERROR: bugfix autopilot lock was acquired concurrently" >&2
    return 2
  fi
  LOCK_ACQUIRED=1
  (
    trap 'exit 0' TERM INT
    local_last_heartbeat=0
    while kill -0 "$$" 2>/dev/null; do
      local_now="$(automation_now_epoch)"
      if (( local_now - local_last_heartbeat >= ${AUTOMATION_LOCK_HEARTBEAT_SECONDS:-60} )); then
        refresh_parent_lock_heartbeat >/dev/null 2>&1 || true
        local_last_heartbeat="$local_now"
      fi
      sleep 1
    done
  ) &
  HEARTBEAT_PID=$!
}

release_parent_lock() {
  local repo_real script_real
  if [[ -n "$HEARTBEAT_PID" ]]; then
    kill "$HEARTBEAT_PID" 2>/dev/null || true
    wait "$HEARTBEAT_PID" 2>/dev/null || true
    HEARTBEAT_PID=""
  fi
  repo_real="$(realpath -e -- "$AUTOMATION_REPO_ROOT")"
  script_real="$(realpath -e -- "$AUTOMATION_REPO_ROOT/$SCRIPT_NAME")"
  automation_v2_release_owned_env_lock "$LOCK_FILE" "$$" "$repo_real" "$script_real" || return 2
  LOCK_ACQUIRED=0
}

terminate_active_child() {
  if [[ ! "$ACTIVE_CHILD_PID" =~ ^[1-9][0-9]*$ ]]; then
    return 0
  fi
  if ! automation_v2_pid_alive "$ACTIVE_CHILD_PID"; then
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
  automation_v2_terminate_process_group "$ACTIVE_CHILD_PID" "${AUTOMATION_GRACEFUL_UNLOCK_SECONDS:-30}" 10 || return 2
  ACTIVE_CHILD_PID=""
  ACTIVE_CHILD_KIND="none"
  ACTIVE_CHILD_SCRIPT=""
  ACTIVE_CHILD_COMMAND=""
  write_parent_lock || return 2
}

rotate_stale_handoffs() {
  local file stale="$AUTOMATION_RUN_DIR/stale-handoffs"
  mkdir -p "$stale"
  for file in "$AUDIT_HANDOFF_FILE" "$IMPLEMENTATION_HANDOFF_FILE"; do
    [[ -e "$file" ]] || continue
    [[ -f "$file" && ! -L "$file" ]] || { echo "ERROR: stale handoff is not a non-symlink regular file: $file" >&2; return 2; }
    mv -- "$file" "$stale/$(basename "$file").$(date -u +%Y%m%dT%H%M%SZ)"
  done
}

campaign_area_description() {
  case "$1" in
    boundary_and_input_contracts) echo 'No-provider/no-execution boundaries, input validation, pinned intake, and fail-fast configuration contracts.' ;;
    filesystem_path_and_artifact_safety) echo 'Realpath, symlink, containment, artifact hygiene, archive, and transient-file safety.' ;;
    identity_rules_quotes_and_bundle_parsing) echo 'Canonical identity, rules/finality, quote/depth/currency, export-bundle parsing, and deterministic assembly.' ;;
    scenario_solver_rounding_and_capacity_math) echo 'Scenario cash-flow matrices, fixed-point arithmetic, rounding, capacity, minimum stake, fees, costs, and deterministic stake vectors.' ;;
    leg_completion_residual_exposure_and_settlement) echo 'Leg state transitions, partial completion, residual exposure, terminal scenarios, settlement replay, and finality consumption.' ;;
    reports_cli_batch_and_private_artifact_integrity) echo 'Private report schemas, CLI behavior, batch summaries, blocker frequencies, stdout contracts, and artifact integrity.' ;;
    automation_handoff_lock_manifest_and_packaging_integrity) echo 'Run-controller handoffs, locks, source manifests, protected files, validation, packaging, Telegram, and progress helpers.' ;;
    cross_area_regression_and_campaign_closure) echo 'Cross-area regressions, duplicate assumptions, full validation, campaign closure, and absence of unresolved evidence gaps.' ;;
    *) return 2 ;;
  esac
}

initialize_campaign_ledger() {
  CAMPAIGN_LEDGER="$AUTOMATION_RUN_DIR/campaign_coverage.tsv"
  printf 'ordinal\tarea\tstatus\tlast_child\thandoff_fingerprint\tnote\n' > "$CAMPAIGN_LEDGER"
  local i=0 area
  for area in "${CAMPAIGN_AREAS[@]}"; do i=$((i + 1)); printf '%s\t%s\tpending\tnone\tnone\tnot_started\n' "$i" "$area" >> "$CAMPAIGN_LEDGER"; done
}

campaign_status_for() { awk -F '\t' -v area="$1" 'NR>1 && $2==area {print $3; exit}' "$CAMPAIGN_LEDGER"; }

campaign_update_area() {
  local area="$1" status="$2" child="$3" fingerprint="$4" note="$5" tmp="$CAMPAIGN_LEDGER.tmp.$$"
  awk -F '\t' -v OFS='\t' -v area="$area" -v status="$status" -v child="$child" -v fp="$fingerprint" -v note="$note" '
    NR==1 {print; next}
    $2==area {$3=status; $4=child; $5=(fp==""?"none":fp); $6=note}
    {print}
  ' "$CAMPAIGN_LEDGER" > "$tmp"
  mv -f -- "$tmp" "$CAMPAIGN_LEDGER"
}

campaign_select_active_area() {
  local row
  row="$(awk -F '\t' 'NR>1 && $3!="closed" {print $2 "\t" $3; exit}' "$CAMPAIGN_LEDGER")"
  [[ -n "$row" ]] || return 1
  CAMPAIGN_ACTIVE_AREA="${row%%$'\t'*}"
  CAMPAIGN_ACTIVE_STATUS="${row#*$'\t'}"
}


validate_loaded_env_keys() {
  local allowed_csv="$1" key
  for key in "${!AUTOMATION_V2_ENV[@]}"; do
    case ",$allowed_csv," in
      *",$key,"*) ;;
      *) printf 'ERROR: unsupported handoff key for schema v1: %s\n' "$key" >&2; return 2 ;;
    esac
  done
}

prepare_focus_file() {
  local round_dir="$1" phase="$2" focus
  focus="$round_dir/bugfix-focus.md"
  {
    printf '# Bugfix campaign focus\n\n'
    printf 'BUGFIX_CAMPAIGN_AREA=%s\n' "$CAMPAIGN_ACTIVE_AREA"
    printf 'BUGFIX_CAMPAIGN_PHASE=%s\n\n' "$phase"
    printf '## Bounded scope\n\n%s\n\n' "$(campaign_area_description "$CAMPAIGN_ACTIVE_AREA")"
    printf '## Closure rule\n\n'
    if [[ "$phase" == re_audit_after_implementation ]]; then
      printf 'Re-audit the exact same area after implementation. Do not close it from implementation output alone. Verify the actual source and validation state.\n'
      [[ -f "$IMPLEMENTATION_HANDOFF_FILE" ]] && printf '\nImplementation return handoff: `%s`\n' "${IMPLEMENTATION_HANDOFF_FILE#$AUTOMATION_REPO_ROOT/}"
    else
      printf 'Perform the initial bounded source audit. Confirm defects only with concrete evidence.\n'
    fi
  } > "$focus"
  printf '%s\n' "$focus"
}

validate_audit_handoff() {
  local existing computed evidence evidence_abs expected_hash actual_hash audit_run_dir audit_source_fingerprint
  automation_v2_load_env_strict "$AUDIT_HANDOFF_FILE" || return 2
  validate_loaded_env_keys 'HANDOVER_SCHEMA_VERSION,HANDOVER_KIND,REPOSITORY,CONTROLLER,RUN_AUTONOMOUS_IMPLEMENTATION_NEXT,AUTONOMOUS_IMPLEMENTATION_EXPECTED_FLAG,HANDOVER_AUTONOMOUS_IMPLEMENTATION,AUDIT_AREA,AUDIT_SOURCE_FINGERPRINT,BUG_IDS,BUG_SIGNATURE,IMPLEMENTATION_SCOPE,SOURCE_EVIDENCE_PATH,SOURCE_EVIDENCE_SHA256,VALIDATION_REQUIRED,BUGFIX_MODE_NOOP_SUCCESS_ALLOWED,BUGFIX_MODE_AUTOMATION_MAINTENANCE_ALLOWED,ALLOWED_PROTECTED_FILES,RUN_DIR,WRITTEN_AT,HANDOVER_FINGERPRINT' || return 2
  [[ "$(automation_v2_env_require HANDOVER_SCHEMA_VERSION)" == 1 ]] || return 2
  [[ "$(automation_v2_env_require HANDOVER_KIND)" == autonomous-bugfix-to-autonomous-implementation ]] || return 2
  [[ "$(automation_v2_env_require REPOSITORY)" == "${AUTOMATION_REPO_NAME:-betting-win-surebet}" ]] || return 2
  [[ "$(automation_v2_env_require RUN_AUTONOMOUS_IMPLEMENTATION_NEXT)" == yes ]] || return 2
  [[ "$(automation_v2_env_require AUTONOMOUS_IMPLEMENTATION_EXPECTED_FLAG)" == --handover-bugfix-audit ]] || return 2
  [[ "$(automation_v2_env_require HANDOVER_AUTONOMOUS_IMPLEMENTATION)" == yes ]] || return 2
  [[ "$(automation_v2_env_require AUDIT_AREA)" == "$CAMPAIGN_ACTIVE_AREA" ]] || return 2
  audit_source_fingerprint="$(automation_v2_env_require AUDIT_SOURCE_FINGERPRINT)" || return 2
  [[ "$audit_source_fingerprint" =~ ^[a-f0-9]{64}$ ]] || return 2
  audit_run_dir="$(automation_v2_env_require RUN_DIR)" || return 2
  audit_run_dir="$(automation_v2_safe_repo_path "$AUTOMATION_REPO_ROOT" "$audit_run_dir" yes)" || return 2
  if [[ "$LAST_CHILD" == bugfix ]]; then
    [[ "$LAST_CHILD_SOURCE_CHANGED" == no ]] || return 2
    [[ "$audit_source_fingerprint" == "$LAST_CHILD_SOURCE_BEFORE" ]] || return 2
    [[ "$audit_run_dir" == "$LAST_CHILD_RUN_DIR" ]] || return 2
  fi
  CURRENT_AUDIT_BUG_IDS="$(automation_v2_env_require BUG_IDS)" || return 2
  [[ "$CURRENT_AUDIT_BUG_IDS" != none && "$CURRENT_AUDIT_BUG_IDS" =~ ^[A-Za-z0-9._:-]+(,[A-Za-z0-9._:-]+)*$ ]] || return 2
  [[ "$(automation_v2_env_require IMPLEMENTATION_SCOPE)" != none ]] || return 2
  [[ "$(automation_v2_env_require VALIDATION_REQUIRED)" == npm_run_validate ]] || return 2
  [[ "$(automation_v2_env_require BUGFIX_MODE_NOOP_SUCCESS_ALLOWED)" == no ]] || return 2
  automation_v2_validate_yes_no_value BUGFIX_MODE_AUTOMATION_MAINTENANCE_ALLOWED "$(automation_v2_env_require BUGFIX_MODE_AUTOMATION_MAINTENANCE_ALLOWED)" || return 2
  CURRENT_BUG_SIGNATURE="$(automation_v2_env_require BUG_SIGNATURE)" || return 2
  [[ "$CURRENT_BUG_SIGNATURE" =~ ^[a-f0-9]{64}$ ]] || return 2
  evidence="$(automation_v2_env_require SOURCE_EVIDENCE_PATH)" || return 2
  evidence_abs="$AUTOMATION_REPO_ROOT/$evidence"
  evidence_abs="$(automation_v2_safe_repo_path "$AUTOMATION_REPO_ROOT" "$evidence_abs" yes)" || return 2
  [[ -f "$evidence_abs" && ! -L "$evidence_abs" ]] || return 2
  expected_hash="$(automation_v2_env_require SOURCE_EVIDENCE_SHA256)" || return 2
  [[ "$expected_hash" =~ ^[a-f0-9]{64}$ ]] || return 2
  actual_hash="$(automation_v2_sha256_file "$evidence_abs")"
  [[ "$expected_hash" == "$actual_hash" ]] || return 2
  existing="$(automation_v2_env_require HANDOVER_FINGERPRINT)" || return 2
  computed="$(automation_v2_semantic_env_fingerprint_loaded)" || return 2
  [[ "$existing" == "$computed" ]] || return 2
  CURRENT_AUDIT_HANDOFF_FINGERPRINT="$existing"
}

validate_implementation_handoff() {
  local existing computed source_changed source_valid reaud returned_status returned_reason returned_run_dir
  automation_v2_load_env_strict "$IMPLEMENTATION_HANDOFF_FILE" || return 2
  validate_loaded_env_keys 'HANDOVER_SCHEMA_VERSION,HANDOVER_KIND,REPOSITORY,CONTROLLER,SOURCE_HANDOFF_FINGERPRINT,RUN_BUGFIX_AUDIT_NEXT,AUTONOMOUS_FINAL_STATUS,AUTONOMOUS_STOP_REASON,AUTONOMOUS_FINAL_EXIT_CODE,IMPLEMENTATION_SOURCE_CHANGED,IMPLEMENTATION_SOURCE_VALIDATION_PASSED,PRIVATE_PAPER_REEVALUATION_REQUIRED,BUGFIX_REAUDIT_REQUIRED,AUDIT_AREA,BUG_IDS,PAPER_SERVICE_SUPPORTED,SERVICE_REFRESH_REQUIRED,RUNTIME_EVIDENCE_REQUIRED,REAL_UPSTREAM_EVALUATION,RUN_DIR,WRITTEN_AT,HANDOVER_FINGERPRINT' || return 2
  [[ "$(automation_v2_env_require HANDOVER_SCHEMA_VERSION)" == 1 ]] || return 2
  [[ "$(automation_v2_env_require HANDOVER_KIND)" == bugfix-mode-after-autonomous-implementation ]] || return 2
  [[ "$(automation_v2_env_require REPOSITORY)" == "${AUTOMATION_REPO_NAME:-betting-win-surebet}" ]] || return 2
  [[ "$(automation_v2_env_require SOURCE_HANDOFF_FINGERPRINT)" == "$CURRENT_AUDIT_HANDOFF_FINGERPRINT" ]] || return 2
  [[ "$(automation_v2_env_require RUN_BUGFIX_AUDIT_NEXT)" == yes ]] || return 2
  [[ "$(automation_v2_env_require BUGFIX_REAUDIT_REQUIRED)" == yes ]] || return 2
  [[ "$(automation_v2_env_require AUDIT_AREA)" == "$CAMPAIGN_ACTIVE_AREA" ]] || return 2
  [[ "$(automation_v2_env_require BUG_IDS)" == "$CURRENT_AUDIT_BUG_IDS" ]] || return 2
  returned_status="$(automation_v2_env_require AUTONOMOUS_FINAL_STATUS)" || return 2
  returned_reason="$(automation_v2_env_require AUTONOMOUS_STOP_REASON)" || return 2
  returned_run_dir="$(automation_v2_env_require RUN_DIR)" || return 2
  returned_run_dir="$(automation_v2_safe_repo_path "$AUTOMATION_REPO_ROOT" "$returned_run_dir" yes)" || return 2
  [[ "$returned_status" == 'AUTONOMOUS_GOAL_COMPLETE=yes' && "$returned_status" == "$LAST_CHILD_STATUS" ]] || return 2
  [[ "$returned_reason" == "$LAST_CHILD_STOP_REASON" ]] || return 2
  [[ "$returned_run_dir" == "$LAST_CHILD_RUN_DIR" ]] || return 2
  [[ "$(automation_v2_env_require AUTONOMOUS_FINAL_EXIT_CODE)" == "$LAST_CHILD_RC" ]] || return 2
  [[ "$LAST_CHILD_SOURCE_CHANGED" == yes ]] || return 2
  source_changed="$(automation_v2_env_require IMPLEMENTATION_SOURCE_CHANGED)" || return 2
  source_valid="$(automation_v2_env_require IMPLEMENTATION_SOURCE_VALIDATION_PASSED)" || return 2
  reaud="$(automation_v2_env_require BUGFIX_REAUDIT_REQUIRED)" || return 2
  [[ "$source_changed" == yes && "$source_valid" == yes && "$reaud" == yes ]] || return 2
  [[ "$(automation_v2_env_require PAPER_SERVICE_SUPPORTED)" == 0 ]] || return 2
  [[ "$(automation_v2_env_require SERVICE_REFRESH_REQUIRED)" == 0 ]] || return 2
  [[ "$(automation_v2_env_require RUNTIME_EVIDENCE_REQUIRED)" == 0 ]] || return 2
  [[ "$(automation_v2_env_require REAL_UPSTREAM_EVALUATION)" == blocked_on_required_upstream_input ]] || return 2
  existing="$(automation_v2_env_require HANDOVER_FINGERPRINT)" || return 2
  computed="$(automation_v2_semantic_env_fingerprint_loaded)" || return 2
  [[ "$existing" == "$computed" ]] || return 2
}

validate_bugfix_completion_contract() {
  local cycle_dir flags status key
  cycle_dir="$(find "$LAST_CHILD_RUN_DIR/cycles" -mindepth 1 -maxdepth 1 -type d -name 'cycle_*' -print 2>/dev/null | sort -V | tail -n 1)"
  [[ -n "$cycle_dir" && -f "$cycle_dir/continue_status.txt" && -f "$cycle_dir/request_flags.txt" ]] || return 2
  status="$(grep -v '^[[:space:]]*$' "$cycle_dir/continue_status.txt" | tr -d '\r')"
  [[ "$status" == BUGFIX_AUDIT_COMPLETE=yes ]] || return 2
  automation_v2_load_env_strict "$cycle_dir/request_flags.txt" || return 2
  [[ "${AUTOMATION_V2_ENV[CAMPAIGN_AREA]-}" == "$CAMPAIGN_ACTIVE_AREA" ]] || return 2
  [[ "${AUTOMATION_V2_ENV[CAMPAIGN_AREA_COMPLETE]-}" == yes ]] || return 2
  [[ "${AUTOMATION_V2_ENV[BUGS_FOUND]-}" == no ]] || return 2
  [[ "${AUTOMATION_V2_ENV[HANDOVER_AUTONOMOUS_IMPLEMENTATION_REQUIRED]-}" == no ]] || return 2
  [[ "${AUTOMATION_V2_ENV[SOURCE_EVIDENCE_COMPLETE]-}" == yes ]] || return 2
}

append_round() {
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$1" "$(automation_now_iso)" "$2" "$3" "$4" "$5" "$6" "$7" "$8" "$CAMPAIGN_ACTIVE_AREA" "$CAMPAIGN_ACTIVE_STATUS" >> "$AUTOMATION_RUN_DIR/rounds.tsv"
}

run_child_controller() {
  local kind="$1" round_dir="$2" focus_file="${3:-}" configured budget script output rc declared_rc child_source_before child_source_after
  local -a cmd=()
  [[ "$kind" == bugfix ]] && configured="$BUGFIX_DURATION_SECONDS" || configured="$IMPLEMENTATION_DURATION_SECONDS"
  budget="$(clamped_child_budget "$configured")" || return 124
  if [[ "$kind" == bugfix ]]; then
    script="$BUGFIX_CHILD_SCRIPT"
    cmd=(bash "$script" --duration "$budget" --bugfix-focus-file "$focus_file" --campaign-area "$CAMPAIGN_ACTIVE_AREA" --model "$CODEX_MODEL" --fallback-model "$CODEX_FALLBACK_MODEL" --repo-dir "$AUTOMATION_REPO_ROOT" --handover-autonomous-implementation --sandbox "$CODEX_SANDBOX" --max-cycles "$BUGFIX_MAX_CYCLES" --cycle-timeout "$BUGFIX_CODEX_TIMEOUT_SECONDS" --validation-timeout "$VALIDATION_TIMEOUT_SECONDS" --install-timeout "$INSTALL_TIMEOUT_SECONDS" --zip-timeout "$ZIP_TIMEOUT_SECONDS")
    [[ -n "$FROM_ARTIFACTS" ]] && cmd+=(--from-artifacts "$FROM_ARTIFACTS")
  else
    script="$IMPLEMENTATION_CHILD_SCRIPT"
    cmd=(bash "$script" --duration "$budget" --model "$CODEX_MODEL" --fallback-model "$CODEX_FALLBACK_MODEL" --repo-dir "$AUTOMATION_REPO_ROOT" --handover-bugfix-audit --sandbox "$CODEX_SANDBOX" --max-cycles "$IMPLEMENTATION_MAX_CYCLES" --cycle-timeout "$IMPLEMENTATION_CYCLE_TIMEOUT_SECONDS" --validation-timeout "$VALIDATION_TIMEOUT_SECONDS" --install-timeout "$INSTALL_TIMEOUT_SECONDS" --zip-timeout "$ZIP_TIMEOUT_SECONDS")
  fi
  [[ "$AUTO_INSTALL" == 1 ]] && cmd+=(--auto-install)
  [[ "$CODEX_STREAM_LOGS" == 1 ]] && cmd+=(--stream) || cmd+=(--no-stream)
  printf '%q ' "${cmd[@]}" > "$round_dir/child_command.txt"; printf '\n' >> "$round_dir/child_command.txt"
  output="$round_dir/child_output.log"
  child_source_before="$(automation_v2_source_tree_fingerprint "$AUTOMATION_REPO_ROOT")" || return 2
  ACTIVE_CHILD_KIND="$kind"; ACTIVE_CHILD_SCRIPT="$script"; ACTIVE_CHILD_COMMAND="$(automation_quote_argv "${cmd[@]}")"
  setsid "${cmd[@]}" > "$output" 2>&1 &
  ACTIVE_CHILD_PID=$!
  write_parent_lock
  if [[ "$CODEX_STREAM_LOGS" == 1 ]]; then tail -n +1 -f --pid="$ACTIVE_CHILD_PID" "$output" & ACTIVE_CHILD_TAIL_PID=$!; fi
  set +e; wait "$ACTIVE_CHILD_PID"; rc=$?; set -e
  [[ -n "$ACTIVE_CHILD_TAIL_PID" ]] && { wait "$ACTIVE_CHILD_TAIL_PID" 2>/dev/null || true; ACTIVE_CHILD_TAIL_PID=""; }
  ACTIVE_CHILD_PID=""; ACTIVE_CHILD_KIND=none; ACTIVE_CHILD_SCRIPT=""; ACTIVE_CHILD_COMMAND=""; write_parent_lock
  LAST_CHILD="$kind"; LAST_CHILD_RC="$rc"
  LAST_CHILD_RUN_DIR="$(automation_v2_extract_unique_machine_value "$output" run_dir)" || return 2
  LAST_CHILD_STATUS="$(automation_v2_extract_unique_machine_value "$output" final_status)" || return 2
  LAST_CHILD_STOP_REASON="$(automation_v2_extract_unique_machine_value "$output" stop_reason)" || return 2
  declared_rc="$(automation_v2_extract_unique_machine_value "$output" final_exit_code)" || return 2
  [[ "$declared_rc" =~ ^[0-9]+$ && "$declared_rc" == "$rc" ]] || return 2
  LAST_CHILD_RUN_DIR="$(automation_v2_safe_repo_path "$AUTOMATION_REPO_ROOT" "$LAST_CHILD_RUN_DIR" yes)" || return 2
  case "$LAST_CHILD_RUN_DIR" in "$AUTOMATION_REPO_ROOT/artifacts/"*) ;; *) return 2 ;; esac
  child_source_after="$(automation_v2_source_tree_fingerprint "$AUTOMATION_REPO_ROOT")" || return 2
  LAST_CHILD_SOURCE_BEFORE="$child_source_before"
  LAST_CHILD_SOURCE_AFTER="$child_source_after"
  [[ "$child_source_before" == "$child_source_after" ]] && LAST_CHILD_SOURCE_CHANGED=no || LAST_CHILD_SOURCE_CHANGED=yes
  automation_v2_write_env_atomic "$round_dir/child_result.env" \
    "CHILD_KIND=$kind" "CHILD_EXIT_CODE=$rc" "CHILD_FINAL_STATUS=$LAST_CHILD_STATUS" \
    "CHILD_STOP_REASON=$LAST_CHILD_STOP_REASON" "CHILD_RUN_DIR=$LAST_CHILD_RUN_DIR" \
    "CHILD_SOURCE_BEFORE=$child_source_before" "CHILD_SOURCE_AFTER=$child_source_after" \
    "CHILD_SOURCE_CHANGED=$LAST_CHILD_SOURCE_CHANGED"
  return "$rc"
}

update_bug_signature_repeat_guard() {
  if [[ "$CURRENT_BUG_SIGNATURE" == "$LAST_BUG_SIGNATURE" ]]; then LAST_BUG_SIGNATURE_COUNT=$((LAST_BUG_SIGNATURE_COUNT + 1)); else LAST_BUG_SIGNATURE="$CURRENT_BUG_SIGNATURE"; LAST_BUG_SIGNATURE_COUNT=1; fi
  (( LAST_BUG_SIGNATURE_COUNT <= MAX_SAME_HANDOFF ))
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

write_final_summary() {
  [[ -n "${AUTOMATION_RUN_DIR:-}" ]] || return 0
  {
    printf '# Bugfix autopilot final summary\n\n'
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
    printf 'last_child_source_changed=%s\n' "$LAST_CHILD_SOURCE_CHANGED"
    printf 'campaign_active_area=%s\n' "${CAMPAIGN_ACTIVE_AREA:-none}"
    printf 'campaign_closed_areas=%s\n' "$(awk -F '\t' 'NR>1 && $3=="closed" {n++} END{print n+0}' "$CAMPAIGN_LEDGER" 2>/dev/null || echo 0)"
    printf 'campaign_total_areas=%s\n' "${#CAMPAIGN_AREAS[@]}"
    printf 'last_bug_signature=%s\n' "${LAST_BUG_SIGNATURE:-none}"
    printf 'last_bug_signature_count=%s\n' "$LAST_BUG_SIGNATURE_COUNT"
    printf 'campaign_coverage_tsv=%s\n' "$CAMPAIGN_LEDGER"
    printf 'child_cleanup_status=%s\n' "$CHILD_CLEANUP_STATUS"
    printf 'child_cleanup_exit_code=%s\n' "$CHILD_CLEANUP_EXIT_CODE"
    if [[ "$LOCK_RELEASE_STATUS" != "not_attempted" ]]; then
      printf 'lock_release_status=%s\n' "$LOCK_RELEASE_STATUS"
      printf 'lock_release_exit_code=%s\n' "$LOCK_RELEASE_EXIT_CODE"
      printf 'lock_preserved=%s\n' "$LOCK_PRESERVED"
      printf 'lock_file=%s\n' "$LOCK_FILE"
    fi
    printf 'service_lifecycle=none\n'
    printf 'completed_at=%s\n' "$(automation_now_iso)"
  } > "$AUTOMATION_RUN_DIR/final_summary.txt"
  cp "$AUTOMATION_RUN_DIR/final_summary.txt" "$AUTOMATION_RUN_DIR/final-summary.md"
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
  [[ "$FINISHED" == 1 ]] && return 0
  FINISHED=1
  trap - EXIT INT TERM
  EXIT_STATUS="$rc"

  set +e
  terminate_active_child
  child_cleanup_rc=$?
  set -e
  CHILD_CLEANUP_EXIT_CODE="$child_cleanup_rc"
  if [[ "$child_cleanup_rc" == 0 ]]; then
    CHILD_CLEANUP_STATUS="complete"
  else
    CHILD_CLEANUP_STATUS="identity_or_termination_failed"
    FINAL_STATUS=BUGFIX_AUTOPILOT_BLOCKED_CHILD_IDENTITY
    STOP_REASON=active_child_identity_or_termination_failed
    EXIT_STATUS=2
    LOCK_RELEASE_STATUS="preserved_due_to_child_cleanup_failure"
    LOCK_RELEASE_EXIT_CODE=0
    LOCK_PRESERVED="yes"
  fi

  [[ "$FINAL_STATUS" != not_started ]] || { FINAL_STATUS=setup_failed; STOP_REASON=unexpected_exit_before_start; }
  if [[ -n "${AUTOMATION_RUN_DIR:-}" ]]; then
    write_final_summary || true
    automation_collect_repo_snapshot "$AUTOMATION_RUN_DIR/final-repo-snapshot" || true
    set +e
    build_artifacts_zip_bounded
    zip_rc=$?
    set -e
    if [[ "$zip_rc" != 0 && "$EXIT_STATUS" == 0 ]]; then
      FINAL_STATUS=BUGFIX_AUTOPILOT_BLOCKED_ARTIFACT_PACKAGING
      STOP_REASON=artifacts_zip_failed
      EXIT_STATUS=2
      write_final_summary || true
    fi
  fi

  if [[ "$child_cleanup_rc" == 0 ]]; then
    set +e
    attempt_final_parent_lock_release
    lock_rc=$?
    set -e
    if [[ "$lock_rc" != 0 ]]; then
      FINAL_STATUS=BUGFIX_AUTOPILOT_BLOCKED_LOCK_RELEASE
      if [[ "$LOCK_PRESERVED" == yes ]]; then
        STOP_REASON=lock_release_failed_lock_preserved
      else
        STOP_REASON=lock_release_failed
      fi
      EXIT_STATUS=2
      if [[ -n "${AUTOMATION_RUN_DIR:-}" ]]; then
        write_final_summary || true
        set +e
        build_artifacts_zip_bounded
        corrective_zip_rc=$?
        set -e
        [[ "$corrective_zip_rc" == 0 ]] || automation_log "lock_failure_artifacts_zip_failed exit=$corrective_zip_rc"
      fi
    elif [[ -n "${AUTOMATION_RUN_DIR:-}" ]]; then
      write_final_summary || true
    fi
  fi

  if [[ -n "${AUTOMATION_RUN_DIR:-}" ]]; then
    telegram_notify_send_final "$SCRIPT_NAME" "${AUTOMATION_REPO_NAME:-betting-win-surebet}" "$FINAL_STATUS" "$STOP_REASON" "$ROUNDS_COMPLETED" "$EXIT_STATUS" "$AUTOMATION_RUN_DIR" "$AUTOMATION_RUN_DIR/telegram_notification_status.txt" "$AUTOMATION_REPO_ROOT" || true
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
  FINAL_STATUS=interrupted
  STOP_REASON=interrupted
  exit 130
}

main_loop() {
  local round_dir child rc focus phase source_before source_after
  printf 'round\tfinished_at\tchild\texit_code\tfinal_status\tstop_reason\tchild_run_dir\tdecision\thandoff_fingerprint\tcampaign_area\tcampaign_area_status\n' > "$AUTOMATION_RUN_DIR/rounds.tsv"
  while true; do
    (( $(remaining_parent_seconds) > 0 )) || { FINAL_STATUS=BUGFIX_AUTOPILOT_BUDGET_EXHAUSTED; STOP_REASON=parent_duration_elapsed; exit 3; }
    if (( MAX_ROUNDS > 0 && ROUNDS_COMPLETED >= MAX_ROUNDS )); then FINAL_STATUS=BUGFIX_AUTOPILOT_BUDGET_EXHAUSTED; STOP_REASON=max_rounds_reached; exit 3; fi
    if ! campaign_select_active_area; then FINAL_STATUS=BUGFIX_AUTOPILOT_COMPLETE; STOP_REASON=all_campaign_areas_closed; exit 0; fi
    [[ "$CAMPAIGN_ACTIVE_STATUS" == implementation_required ]] && child=implementation || child=bugfix
    ROUNDS_COMPLETED=$((ROUNDS_COMPLETED + 1))
    round_dir="$AUTOMATION_RUN_DIR/round_$(printf '%03d' "$ROUNDS_COMPLETED")_${child}"
    mkdir -p "$round_dir"

    if [[ "$child" == bugfix ]]; then
      [[ "$CAMPAIGN_ACTIVE_STATUS" == verification_required ]] && phase=re_audit_after_implementation || phase=initial_audit
      focus="$(prepare_focus_file "$round_dir" "$phase")"
      [[ -f "$IMPLEMENTATION_HANDOFF_FILE" ]] && automation_v2_atomic_copy "$IMPLEMENTATION_HANDOFF_FILE" "$round_dir/input-bugfix-mode-handover.env"
      rm -f -- "$AUDIT_HANDOFF_FILE"
      campaign_update_area "$CAMPAIGN_ACTIVE_AREA" audit_in_progress bugfix "${CURRENT_AUDIT_HANDOFF_FINGERPRINT:-none}" "$phase"
      CAMPAIGN_ACTIVE_STATUS=audit_in_progress
      if run_child_controller bugfix "$round_dir" "$focus"; then rc=0; else rc=$?; fi
      if [[ "$rc" == 124 && "$(remaining_parent_seconds)" == 0 ]]; then
        append_round "$ROUNDS_COMPLETED" bugfix "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" parent_budget_exhausted none
        FINAL_STATUS=BUGFIX_AUTOPILOT_BUDGET_EXHAUSTED; STOP_REASON=parent_duration_elapsed; exit 3
      fi
      if [[ "$LAST_CHILD_SOURCE_CHANGED" != no ]]; then
        append_round "$ROUNDS_COMPLETED" bugfix "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" blocked_audit_source_mutation none
        FINAL_STATUS=BUGFIX_AUTOPILOT_BLOCKED_AUDIT_CHILD
        STOP_REASON=bugfix_child_mutated_source
        exit 2
      fi

      if [[ -f "$AUDIT_HANDOFF_FILE" ]]; then
        validate_audit_handoff || { append_round "$ROUNDS_COMPLETED" bugfix "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" blocked_invalid_audit_handoff none; FINAL_STATUS=BUGFIX_AUTOPILOT_BLOCKED_HANDOFF_MISMATCH; STOP_REASON=invalid_audit_handoff; exit 2; }
        [[ "$LAST_CHILD_STATUS" == HANDOVER_AUTONOMOUS_IMPLEMENTATION=yes && "$rc" == 2 ]] || { FINAL_STATUS=BUGFIX_AUTOPILOT_BLOCKED_HANDOFF_MISMATCH; STOP_REASON=audit_handoff_child_status_mismatch; exit 2; }
        update_bug_signature_repeat_guard || { append_round "$ROUNDS_COMPLETED" bugfix "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" blocked_repeated_bug_signature "$CURRENT_AUDIT_HANDOFF_FINGERPRINT"; FINAL_STATUS=BUGFIX_AUTOPILOT_BLOCKED_REPEATED_HANDOFF; STOP_REASON=repeated_bug_signature_limit; exit 2; }
        automation_v2_atomic_copy "$AUDIT_HANDOFF_FILE" "$round_dir/output-autonomous-implementation-handover.env"
        campaign_update_area "$CAMPAIGN_ACTIVE_AREA" implementation_required bugfix "$CURRENT_AUDIT_HANDOFF_FINGERPRINT" "confirmed bugs require implementation"
        CAMPAIGN_ACTIVE_STATUS=implementation_required
        append_round "$ROUNDS_COMPLETED" bugfix "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" next_autonomous_implementation "$CURRENT_AUDIT_HANDOFF_FINGERPRINT"
        continue
      fi

      if [[ "$rc" == 0 && "$LAST_CHILD_STATUS" == BUGFIX_AUDIT_COMPLETE=yes ]]; then
        validate_bugfix_completion_contract || { FINAL_STATUS=BUGFIX_AUTOPILOT_BLOCKED_HANDOFF_MISMATCH; STOP_REASON=invalid_bugfix_completion_contract; exit 2; }
        campaign_update_area "$CAMPAIGN_ACTIVE_AREA" closed bugfix none "bounded area clean after source audit"
        CAMPAIGN_ACTIVE_STATUS=closed
        append_round "$ROUNDS_COMPLETED" bugfix "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" campaign_area_closed none
        rm -f -- "$IMPLEMENTATION_HANDOFF_FILE"
        continue
      fi
      if [[ "$rc" == 3 && "$LAST_CHILD_STATUS" == CONTINUE_REQUIRED=yes ]]; then
        campaign_update_area "$CAMPAIGN_ACTIVE_AREA" audit_in_progress bugfix none "audit continuation required"
        append_round "$ROUNDS_COMPLETED" bugfix "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" continue_same_audit_area none
        continue
      fi
      append_round "$ROUNDS_COMPLETED" bugfix "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" blocked_bugfix_child none
      FINAL_STATUS=BUGFIX_AUTOPILOT_BLOCKED_AUDIT_CHILD; STOP_REASON=bugfix_child_blocked; exit 2
    fi

    validate_audit_handoff || { FINAL_STATUS=BUGFIX_AUTOPILOT_BLOCKED_HANDOFF_MISMATCH; STOP_REASON=missing_or_invalid_input_audit_handoff; exit 2; }
    automation_v2_atomic_copy "$AUDIT_HANDOFF_FILE" "$round_dir/input-autonomous-implementation-handover.env"
    source_before="$(automation_v2_source_tree_fingerprint "$AUTOMATION_REPO_ROOT")" || exit 2
    rm -f -- "$IMPLEMENTATION_HANDOFF_FILE"
    if run_child_controller implementation "$round_dir"; then rc=0; else rc=$?; fi
    if [[ "$rc" == 124 && "$(remaining_parent_seconds)" == 0 ]]; then
      append_round "$ROUNDS_COMPLETED" implementation "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" parent_budget_exhausted "$CURRENT_AUDIT_HANDOFF_FINGERPRINT"
      FINAL_STATUS=BUGFIX_AUTOPILOT_BUDGET_EXHAUSTED; STOP_REASON=parent_duration_elapsed; exit 3
    fi
    if [[ "$rc" == 3 && "$LAST_CHILD_STATUS" == CONTINUE_REQUIRED=yes ]]; then
      campaign_update_area "$CAMPAIGN_ACTIVE_AREA" implementation_required implementation "$CURRENT_AUDIT_HANDOFF_FINGERPRINT" "implementation continuation required"
      append_round "$ROUNDS_COMPLETED" implementation "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" continue_same_implementation "$CURRENT_AUDIT_HANDOFF_FINGERPRINT"
      continue
    fi
    if [[ "$rc" != 0 ]]; then
      append_round "$ROUNDS_COMPLETED" implementation "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" blocked_implementation_child "$CURRENT_AUDIT_HANDOFF_FINGERPRINT"
      FINAL_STATUS=BUGFIX_AUTOPILOT_BLOCKED_IMPLEMENTATION_CHILD; STOP_REASON=implementation_child_blocked; exit 2
    fi
    [[ -f "$IMPLEMENTATION_HANDOFF_FILE" ]] || { FINAL_STATUS=BUGFIX_AUTOPILOT_BLOCKED_HANDOFF_MISMATCH; STOP_REASON=missing_implementation_return_handoff; exit 2; }
    validate_implementation_handoff || { FINAL_STATUS=BUGFIX_AUTOPILOT_BLOCKED_HANDOFF_MISMATCH; STOP_REASON=invalid_implementation_return_handoff; exit 2; }
    source_after="$(automation_v2_source_tree_fingerprint "$AUTOMATION_REPO_ROOT")" || exit 2
    if [[ "$source_before" == "$source_after" ]]; then
      append_round "$ROUNDS_COMPLETED" implementation "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" blocked_implementation_noop "$CURRENT_AUDIT_HANDOFF_FINGERPRINT"
      FINAL_STATUS=BUGFIX_AUTOPILOT_BLOCKED_IMPLEMENTATION_NOOP; STOP_REASON=implementation_noop_for_confirmed_bug; exit 2
    fi
    automation_v2_atomic_copy "$IMPLEMENTATION_HANDOFF_FILE" "$round_dir/output-bugfix-mode-handover.env"
    campaign_update_area "$CAMPAIGN_ACTIVE_AREA" verification_required implementation "$CURRENT_AUDIT_HANDOFF_FINGERPRINT" "validated source change requires same-area re-audit"
    CAMPAIGN_ACTIVE_STATUS=verification_required
    append_round "$ROUNDS_COMPLETED" implementation "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" next_same_area_bugfix_reaudit "$CURRENT_AUDIT_HANDOFF_FINGERPRINT"
    rm -f -- "$AUDIT_HANDOFF_FILE"
  done
}

parse_args "$@" || exit 1
configure_defaults || exit 1
validate_inputs || exit 1
if [[ "$STATUS_ONLY" == 1 ]]; then status_lock; exit $?; fi
if [[ "$FORCE_UNLOCK" == 1 ]]; then force_unlock_parent; exit $?; fi
if [[ "$PRINT_CONFIG" == 1 ]]; then print_config; exit 0; fi

automation_v2_validate_child_script "$AUTOMATION_REPO_ROOT" "$BUGFIX_CHILD_SCRIPT" || exit 1
automation_v2_validate_child_script "$AUTOMATION_REPO_ROOT" "$IMPLEMENTATION_CHILD_SCRIPT" || exit 1
trap 'finish $?' EXIT
trap on_signal INT TERM
automation_assert_no_incompatible_locks "$SCRIPT_NAME" "$AUTOMATION_REPO_ROOT" "$LOCK_FILE"
acquire_parent_lock || { FINAL_STATUS=setup_failed; STOP_REASON=lock_acquisition_failed; exit 1; }
automation_create_run_dir bugfix_autopilot
CAMPAIGN_LEDGER="$AUTOMATION_RUN_DIR/campaign_coverage.tsv"
write_parent_lock
assert_active_node_runtime || { FINAL_STATUS=setup_failed; STOP_REASON=node_runtime_invalid; exit 1; }
automation_collect_repo_snapshot "$AUTOMATION_RUN_DIR/initial-repo-snapshot"
maybe_auto_install || { FINAL_STATUS=setup_failed; STOP_REASON=auto_install_failed; exit 1; }
rotate_stale_handoffs || { FINAL_STATUS=setup_failed; STOP_REASON=stale_handoff_rotation_failed; exit 1; }
initialize_campaign_ledger
START_EPOCH="$(automation_now_epoch)"
FINAL_STATUS=CONTINUE_REQUIRED
STOP_REASON=loop_started
main_loop
