#!/usr/bin/env bash
# Common helpers for standardized repo automation run scripts.
# shellcheck shell=bash

if [[ "${BASH_VERSION:-}" == "" ]]; then
  echo "ERROR: bash is required" >&2
  exit 127
fi

AUTOMATION_RUN_COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=.automation/lib/temp_inode_guard.sh
. "$AUTOMATION_RUN_COMMON_DIR/temp_inode_guard.sh"

automation_now_iso() { date -u +%Y-%m-%dT%H:%M:%SZ; }
automation_now_epoch() { date -u +%s; }

automation_log() {
  local msg="$*"
  printf '[%s] %s\n' "$(automation_now_iso)" "$msg"
  if [[ -n "${AUTOMATION_CONTROLLER_LOG:-}" ]]; then
    printf '[%s] %s\n' "$(automation_now_iso)" "$msg" >> "$AUTOMATION_CONTROLLER_LOG"
  fi
}

automation_die() {
  local code="${2:-1}"
  echo "ERROR: $1" >&2
  if [[ -n "${AUTOMATION_CONTROLLER_LOG:-}" ]]; then
    printf '[%s] ERROR: %s\n' "$(automation_now_iso)" "$1" >> "$AUTOMATION_CONTROLLER_LOG"
  fi
  exit "$code"
}

automation_parse_duration_seconds() {
  local raw="${1:-}" days=0 hours=0 minutes=0 seconds=0 total=0
  if [[ "$raw" =~ ^[1-9][0-9]*$ ]]; then
    printf '%s\n' "$((10#$raw))"
    return 0
  fi
  if [[ ! "$raw" =~ ^(([1-9][0-9]*)d)?(([1-9][0-9]*)h)?(([1-9][0-9]*)m)?(([1-9][0-9]*)s)?$ ]]; then
    return 1
  fi
  days="${BASH_REMATCH[2]:-0}"
  hours="${BASH_REMATCH[4]:-0}"
  minutes="${BASH_REMATCH[6]:-0}"
  seconds="${BASH_REMATCH[8]:-0}"
  total=$((10#$days * 86400 + 10#$hours * 3600 + 10#$minutes * 60 + 10#$seconds))
  (( total > 0 )) || return 1
  printf '%s\n' "$total"
}

automation_duration_label() {
  local total="$1" days hours minutes seconds remainder label=""
  days=$((total / 86400))
  remainder=$((total % 86400))
  hours=$((remainder / 3600))
  remainder=$((remainder % 3600))
  minutes=$((remainder / 60))
  seconds=$((remainder % 60))
  (( days > 0 )) && label+="${days}d"
  (( hours > 0 )) && label+="${hours}h"
  (( minutes > 0 )) && label+="${minutes}m"
  (( seconds > 0 )) && label+="${seconds}s"
  printf '%s\n' "${label:-0s}"
}

automation_clamp_minutes() {
  local value="${1:-}" min="${2:-5}" max="${3:-60}"
  if [[ ! "$value" =~ ^[0-9]+$ ]]; then
    value="$min"
  fi
  (( value < min )) && value="$min"
  (( value > max )) && value="$max"
  printf '%s\n' "$value"
}

automation_load_config() {
  [[ -f "$AUTOMATION_REPO_ROOT/automation.config.sh" ]] || automation_die "missing automation.config.sh" 3
  # shellcheck source=/dev/null
  . "$AUTOMATION_REPO_ROOT/automation.config.sh"
  if [[ -z "${AUTOMATION_PROJECT_NAME:-}" ]]; then
    AUTOMATION_PROJECT_NAME="$(basename "$AUTOMATION_REPO_ROOT")"
  fi
}

automation_require_command() {
  command -v "$1" >/dev/null 2>&1 || automation_die "missing required command: $1" 127
}

automation_lock_value() {
  local file="$1" key="$2"
  [[ -f "$file" ]] || return 1
  awk -F= -v k="$key" '
    $1 == k {
      count++
      value=$0
      sub(/^[^=]*=/, "", value)
    }
    END {
      if (count == 1) { print value; exit 0 }
      if (count > 1) { exit 2 }
      exit 1
    }
  ' "$file"
}

automation_lock_value_any() {
  local file="$1"
  shift
  local key value rc
  for key in "$@"; do
    if value="$(automation_lock_value "$file" "$key")"; then
      rc=0
    else
      rc=$?
    fi
    case "$rc" in
      0) printf '%s\n' "$value"; return 0 ;;
      1) ;;
      *) return "$rc" ;;
    esac
  done
  return 1
}

automation_pid_alive() {
  local pid="${1:-}" state
  [[ "$pid" =~ ^[0-9]+$ ]] || return 1
  kill -0 "$pid" >/dev/null 2>&1 || return 1
  if [[ -r "/proc/$pid/stat" ]]; then
    state="$(awk '{print $3}' "/proc/$pid/stat" 2>/dev/null || true)"
    [[ "$state" != Z && "$state" != X ]] || return 1
  fi
  return 0
}

automation_pid_command_matches_script() {
  local pid="$1" expected="$2" repo_root="${3:-${AUTOMATION_REPO_ROOT:-}}"
  local expected_real cwd arg candidate resolved cmdline_snapshot matched=1
  [[ "$pid" =~ ^[1-9][0-9]*$ && -r "/proc/$pid/cmdline" ]] || return 1

  if [[ "$expected" == /* ]]; then
    expected_real="$(realpath -e -- "$expected" 2>/dev/null || true)"
  elif [[ -n "$repo_root" && -e "$repo_root/$expected" ]]; then
    expected_real="$(realpath -e -- "$repo_root/$expected" 2>/dev/null || true)"
  else
    resolved="$(command -v -- "$expected" 2>/dev/null || true)"
    [[ -n "$resolved" ]] && expected_real="$(realpath -e -- "$resolved" 2>/dev/null || true)"
  fi
  [[ -n "${expected_real:-}" ]] || return 1
  cwd="$(readlink -f -- "/proc/$pid/cwd" 2>/dev/null || true)"
  cmdline_snapshot="$(mktemp "${TMPDIR:-/tmp}/automation-cmdline.XXXXXX")" || return 1
  if ! cat "/proc/$pid/cmdline" > "$cmdline_snapshot" 2>/dev/null; then
    rm -f -- "$cmdline_snapshot"
    return 1
  fi

  while IFS= read -r arg; do
    [[ -n "$arg" ]] || continue
    if [[ "$arg" == /* ]]; then
      candidate="$arg"
    elif [[ "$arg" != */* && -n "$(command -v -- "$arg" 2>/dev/null || true)" ]]; then
      candidate="$(command -v -- "$arg")"
    elif [[ -n "$repo_root" && -e "$repo_root/$arg" ]]; then
      candidate="$repo_root/$arg"
    elif [[ -n "$cwd" ]]; then
      candidate="$cwd/$arg"
    else
      continue
    fi
    [[ -e "$candidate" ]] || continue
    if [[ "$(realpath -e -- "$candidate" 2>/dev/null || true)" == "$expected_real" ]]; then
      matched=0
      break
    fi
  done < <(tr '\0' '\n' < "$cmdline_snapshot")
  rm -f -- "$cmdline_snapshot"
  return "$matched"
}

automation_controller_allows_child() {
  local parent="$1" child="$2"
  case "$parent:$child" in
    run-paper-autopilot.sh:run-paper-evaluation.sh|\
    run-paper-autopilot.sh:run-autonomous-implementation.sh|\
    run-bugfix-autopilot.sh:run-autonomous-bugfix.sh|\
    run-bugfix-autopilot.sh:run-autonomous-implementation.sh)
      return 0
      ;;
  esac
  return 1
}

automation_is_verified_parent_lock() {
  local file="$1" current_script="$2" repo_root="$3"
  local controller pid repo script_path
  controller="$(automation_lock_value_any "$file" CONTROLLER script 2>/dev/null || true)"
  pid="$(automation_lock_value_any "$file" CONTROLLER_PID pid 2>/dev/null || true)"
  repo="$(automation_lock_value_any "$file" REPO_REALPATH repo_realpath repo_path 2>/dev/null || true)"
  script_path="$(automation_lock_value_any "$file" SCRIPT_REALPATH script_path 2>/dev/null || true)"

  automation_controller_allows_child "$controller" "$current_script" || return 1
  [[ "$pid" == "$PPID" ]] || return 1
  [[ "$(realpath -m -- "$repo" 2>/dev/null || true)" == "$(realpath -e -- "$repo_root" 2>/dev/null || true)" ]] || return 1
  [[ -n "$script_path" ]] || script_path="$repo_root/$controller"
  automation_pid_command_matches_script "$pid" "$script_path" "$repo_root"
}

automation_known_controller_lock_files() {
  local root="$1"
  printf '%s\n' \
    "$root/.automation/locks/run-autonomous-implementation.lock" \
    "$root/.automation/locks/run-paper-evaluation.lock" \
    "$root/.automation/locks/run-autonomous-bugfix.lock" \
    "$root/.automation/locks/run-paper-autopilot.lock" \
    "$root/.automation/locks/run-bugfix-autopilot.lock"
}

automation_assert_no_incompatible_locks() {
  local current_script="$1" repo_root="$2" own_lock_file="${3:-}"
  local file controller pid repo script_path
  while IFS= read -r file; do
    [[ -n "$file" && "$file" != "$own_lock_file" && -e "$file" ]] || continue
    [[ -f "$file" && ! -L "$file" ]] || automation_die "incompatible controller lock is not a non-symlink regular file: $file" 27

    controller="$(automation_lock_value_any "$file" CONTROLLER script 2>/dev/null || true)"
    pid="$(automation_lock_value_any "$file" CONTROLLER_PID pid 2>/dev/null || true)"
    repo="$(automation_lock_value_any "$file" REPO_REALPATH repo_realpath repo_path 2>/dev/null || true)"
    script_path="$(automation_lock_value_any "$file" SCRIPT_REALPATH script_path 2>/dev/null || true)"

    if [[ -z "$controller" || -z "$pid" || -z "$repo" ]]; then
      if automation_pid_alive "$pid"; then
        automation_die "refusing to touch malformed incompatible lock with live PID: $file" 27
      fi
      automation_quarantine_lock "$file" malformed-incompatible
      continue
    fi

    [[ "$(realpath -m -- "$repo" 2>/dev/null || true)" == "$(realpath -e -- "$repo_root" 2>/dev/null || true)" ]] || \
      automation_die "incompatible controller lock repo mismatch: $file" 27

    if automation_is_verified_parent_lock "$file" "$current_script" "$repo_root"; then
      continue
    fi

    if automation_pid_alive "$pid"; then
      [[ -n "$script_path" ]] || script_path="$repo_root/$controller"
      automation_pid_command_matches_script "$pid" "$script_path" "$repo_root" || \
        automation_die "incompatible controller lock PID identity mismatch: $file" 27
      automation_die "incompatible controller is active: $controller pid=$pid" 27
    fi

    automation_quarantine_lock "$file" stale-incompatible
  done < <(automation_known_controller_lock_files "$repo_root")
}

automation_emit_lock_file() {
  local command_text repo_real script_real
  command_text="${AUTOMATION_SCRIPT_COMMAND:-$AUTOMATION_SCRIPT_NAME}"
  repo_real="$(realpath -e -- "$AUTOMATION_REPO_ROOT")"
  script_real="$(realpath -e -- "$AUTOMATION_REPO_ROOT/$AUTOMATION_SCRIPT_NAME" 2>/dev/null || true)"
  printf 'lock_schema_version=2\n'
  printf 'script=%s\n' "$AUTOMATION_SCRIPT_NAME"
  printf 'script_path=%s\n' "$script_real"
  printf 'repo_path=%s\n' "$AUTOMATION_REPO_ROOT"
  printf 'repo_realpath=%s\n' "$repo_real"
  printf 'pid=%s\n' "$AUTOMATION_CONTROLLER_PID"
  printf 'started_at=%s\n' "$AUTOMATION_STARTED_AT"
  printf 'heartbeat_at=%s\n' "$(automation_now_epoch)"
  printf 'heartbeat_iso=%s\n' "$(automation_now_iso)"
  printf 'artifacts_dir=%s\n' "${AUTOMATION_RUN_DIR:-}"
  printf 'host=%s\n' "$(hostname 2>/dev/null || printf unknown)"
  printf 'user=%s\n' "$(id -un 2>/dev/null || printf unknown)"
  printf 'command=%s\n' "$command_text"
  printf 'parent_controller=%s\n' "${AUTOMATION_PARENT_CONTROLLER:-none}"
  printf 'parent_pid=%s\n' "${AUTOMATION_PARENT_PID:-none}"
  printf 'active_child_pid=%s\n' "${AUTOMATION_ACTIVE_CHILD_PID:-}"
  printf 'active_child_kind=%s\n' "${AUTOMATION_ACTIVE_CHILD_KIND:-none}"
  printf 'active_child_script=%s\n' "${AUTOMATION_ACTIVE_CHILD_SCRIPT:-}"
  printf 'active_child_command=%s\n' "${AUTOMATION_ACTIVE_CHILD_COMMAND:-}"
}

automation_write_lock_file() {
  local tmp
  tmp="${AUTOMATION_LOCK_FILE}.tmp.$$.$RANDOM"
  automation_emit_lock_file > "$tmp"
  chmod 0600 "$tmp"
  mv -f -- "$tmp" "$AUTOMATION_LOCK_FILE"
}

automation_claim_lock_file() {
  local claim
  claim="${AUTOMATION_LOCK_FILE}.claim.$$.$RANDOM"
  automation_emit_lock_file > "$claim"
  chmod 0600 "$claim"
  if ln -- "$claim" "$AUTOMATION_LOCK_FILE" 2>/dev/null; then
    rm -f -- "$claim"
    return 0
  fi
  rm -f -- "$claim"
  return 1
}

automation_refresh_lock_heartbeat() {
  local file="${AUTOMATION_LOCK_FILE:-}" tmp now iso
  [[ -n "$file" && -f "$file" && ! -L "$file" ]] || return 0
  now="$(automation_now_epoch)"
  iso="$(automation_now_iso)"
  tmp="${file}.heartbeat.$$.$RANDOM"
  awk -F= -v now="$now" -v iso="$iso" '
    BEGIN { seen_epoch=0; seen_iso=0 }
    $1 == "heartbeat_at" { print "heartbeat_at=" now; seen_epoch=1; next }
    $1 == "heartbeat_iso" { print "heartbeat_iso=" iso; seen_iso=1; next }
    { print }
    END {
      if (!seen_epoch) print "heartbeat_at=" now
      if (!seen_iso) print "heartbeat_iso=" iso
    }
  ' "$file" > "$tmp" || { rm -f "$tmp"; return 1; }
  chmod 0600 "$tmp"
  mv -f "$tmp" "$file"
}

automation_quarantine_lock() {
  local file="$1" reason="$2" dir base
  dir="$(dirname "$file")/corrupt"
  mkdir -p "$dir"
  base="$(basename "$file")"
  mv "$file" "$dir/${base}.$(date -u +%Y%m%dT%H%M%SZ).${reason}" 2>/dev/null || true
}

automation_status_lock() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    echo "LOCK_STATUS=absent"
    return 0
  fi
  echo "LOCK_STATUS=present"
  cat "$file"
  local pid child_pid
  pid="$(automation_lock_value "$file" pid || true)"
  if automation_pid_alive "$pid"; then
    echo "PID_STATUS=alive"
  else
    echo "PID_STATUS=dead"
  fi
  child_pid="$(automation_lock_value "$file" active_child_pid || true)"
  if automation_pid_alive "$child_pid"; then
    echo "ACTIVE_CHILD_STATUS=alive"
  else
    echo "ACTIVE_CHILD_STATUS=absent_or_dead"
  fi
}

automation_force_unlock() {
  local file="$1" expected_script="$2" expected_repo="$3" pid repo script script_path child_pid child_script waited grace
  if [[ ! -f "$file" ]]; then
    echo "FORCE_UNLOCK=no_lock"
    return 0
  fi
  pid="$(automation_lock_value "$file" pid || true)"
  repo="$(automation_lock_value "$file" repo_path || true)"
  script="$(automation_lock_value "$file" script || true)"
  script_path="$(automation_lock_value "$file" script_path || true)"
  child_pid="$(automation_lock_value "$file" active_child_pid || true)"
  child_script="$(automation_lock_value "$file" active_child_script || true)"
  [[ "$repo" == "$expected_repo" ]] || automation_die "refusing force-unlock: lock repo mismatch: $repo" 20
  [[ "$script" == "$expected_script" ]] || automation_die "refusing force-unlock: lock script mismatch: $script" 20
  [[ -n "$script_path" ]] || script_path="$expected_repo/$expected_script"

  if automation_pid_alive "$child_pid"; then
    [[ -n "$child_script" ]] || automation_die "refusing force-unlock: live child has no script identity" 20
    if ! automation_pid_command_matches_script "$child_pid" "$child_script" "$expected_repo"; then
      automation_pid_alive "$child_pid" && automation_die "refusing force-unlock: cannot verify active child command for $child_pid" 20
    elif ! automation_terminate_process_group "$child_pid" "$child_script" "${AUTOMATION_GRACEFUL_UNLOCK_SECONDS:-30}"; then
      automation_pid_alive "$child_pid" && automation_die "force-unlock failed to terminate active child: $child_pid" 21
    fi
  fi

  if automation_pid_alive "$pid"; then
    if ! automation_pid_command_matches_script "$pid" "$script_path" "$expected_repo"; then
      automation_pid_alive "$pid" && automation_die "refusing force-unlock: cannot verify PID command for $pid" 20
    else
      grace="${AUTOMATION_GRACEFUL_UNLOCK_SECONDS:-30}"
      kill -TERM "$pid" 2>/dev/null || true
      waited=0
      while automation_pid_alive "$pid" && (( waited < grace )); do
        sleep 1
        waited=$((waited + 1))
      done
      automation_pid_alive "$pid" && kill -KILL "$pid" 2>/dev/null || true
      waited=0
      while automation_pid_alive "$pid" && (( waited < 10 )); do sleep 1; waited=$((waited + 1)); done
      automation_pid_alive "$pid" && automation_die "force-unlock failed: PID still alive: $pid" 21
    fi
  fi
  rm -f "$file"
  echo "FORCE_UNLOCK=done"
}

automation_acquire_lock() {
  local script_name="$1" repo_root="$2" lock_dir pid repo script heartbeat now age waited
  AUTOMATION_SCRIPT_NAME="$script_name"
  AUTOMATION_REPO_ROOT="$repo_root"
  AUTOMATION_CONTROLLER_PID="$$"
  AUTOMATION_STARTED_AT="$(automation_now_iso)"
  lock_dir="$AUTOMATION_REPO_ROOT/.automation/locks"
  mkdir -p "$lock_dir"
  AUTOMATION_LOCK_FILE="$lock_dir/${script_name%.sh}.lock"
  automation_assert_no_incompatible_locks "$script_name" "$repo_root" "$AUTOMATION_LOCK_FILE"

  if [[ -f "$AUTOMATION_LOCK_FILE" ]]; then
    pid="$(automation_lock_value "$AUTOMATION_LOCK_FILE" pid || true)"
    repo="$(automation_lock_value "$AUTOMATION_LOCK_FILE" repo_path || true)"
    script="$(automation_lock_value "$AUTOMATION_LOCK_FILE" script || true)"
    heartbeat="$(automation_lock_value "$AUTOMATION_LOCK_FILE" heartbeat_at || true)"

    if [[ -z "$pid" || -z "$repo" || -z "$script" ]]; then
      if [[ -n "$pid" && "$pid" =~ ^[0-9]+$ ]] && automation_pid_alive "$pid"; then
        automation_die "refusing to touch malformed lock with live PID: $AUTOMATION_LOCK_FILE" 22
      fi
      automation_quarantine_lock "$AUTOMATION_LOCK_FILE" malformed
    elif ! automation_pid_alive "$pid"; then
      rm -f "$AUTOMATION_LOCK_FILE"
    else
      [[ "$repo" == "$repo_root" ]] || automation_die "refusing lock auto-unlock: repo mismatch: $repo" 23
      [[ "$script" == "$script_name" ]] || automation_die "refusing lock auto-unlock: script mismatch: $script" 23
      automation_pid_command_matches_script "$pid" "$repo_root/$script_name" "$repo_root" || automation_die "refusing lock auto-unlock: cannot verify PID command for $pid" 24
      now="$(automation_now_epoch)"
      if [[ "$heartbeat" =~ ^[0-9]+$ ]]; then
        age=$((now - heartbeat))
      else
        age=999999999
      fi
      if (( age <= ${AUTOMATION_LOCK_STALE_SECONDS:-3600} )); then
        automation_die "lock is active and heartbeat is fresh: $AUTOMATION_LOCK_FILE" 25
      fi
      automation_log "stale_lock_detected pid=$pid age_seconds=$age action=term"
      kill -TERM "$pid" || true
      waited=0
      while automation_pid_alive "$pid" && (( waited < ${AUTOMATION_GRACEFUL_UNLOCK_SECONDS:-30} )); do
        sleep 1
        waited=$((waited + 1))
      done
      automation_pid_alive "$pid" && automation_die "automatic graceful unlock failed; use --force-unlock only if safe" 26
      rm -f "$AUTOMATION_LOCK_FILE"
    fi
  fi

  if ! automation_claim_lock_file; then
    automation_die "lock was acquired concurrently: $AUTOMATION_LOCK_FILE" 25
  fi
}

automation_start_heartbeat() {
  local parent_pid="$AUTOMATION_CONTROLLER_PID"
  (
    while kill -0 "$parent_pid" >/dev/null 2>&1; do
      automation_refresh_lock_heartbeat >/dev/null 2>&1 || true
      sleep "${AUTOMATION_LOCK_HEARTBEAT_SECONDS:-60}"
    done
  ) &
  AUTOMATION_HEARTBEAT_PID="$!"
}

automation_release_lock() {
  local child_cleanup_rc=0
  automation_terminate_active_child >/dev/null 2>&1 || child_cleanup_rc=$?
  if [[ "$child_cleanup_rc" -ne 0 ]]; then
    automation_log "lock_release_blocked active_child_identity_or_termination_failed=$child_cleanup_rc"
    return "$child_cleanup_rc"
  fi
  if [[ -n "${AUTOMATION_HEARTBEAT_PID:-}" ]]; then
    kill "$AUTOMATION_HEARTBEAT_PID" >/dev/null 2>&1 || true
    wait "$AUTOMATION_HEARTBEAT_PID" 2>/dev/null || true
  fi
  if [[ -n "${AUTOMATION_LOCK_FILE:-}" && -f "$AUTOMATION_LOCK_FILE" ]]; then
    local pid
    pid="$(automation_lock_value "$AUTOMATION_LOCK_FILE" pid || true)"
    if [[ "$pid" == "$$" ]]; then
      rm -f "$AUTOMATION_LOCK_FILE"
    fi
  fi
}

automation_set_active_child() {
  local pid="$1" kind="$2" script="$3" command_label="$4"
  [[ "$pid" =~ ^[1-9][0-9]*$ ]] || return 2
  AUTOMATION_ACTIVE_CHILD_PID="$pid"
  AUTOMATION_ACTIVE_CHILD_KIND="$kind"
  AUTOMATION_ACTIVE_CHILD_SCRIPT="$script"
  AUTOMATION_ACTIVE_CHILD_COMMAND="$command_label"
  [[ -n "${AUTOMATION_LOCK_FILE:-}" && -f "$AUTOMATION_LOCK_FILE" ]] && automation_write_lock_file
}

automation_clear_active_child() {
  AUTOMATION_ACTIVE_CHILD_PID=""
  AUTOMATION_ACTIVE_CHILD_KIND="none"
  AUTOMATION_ACTIVE_CHILD_SCRIPT=""
  AUTOMATION_ACTIVE_CHILD_COMMAND=""
  [[ -n "${AUTOMATION_LOCK_FILE:-}" && -f "$AUTOMATION_LOCK_FILE" ]] && automation_write_lock_file
}

automation_terminate_process_group() {
  local pid="$1" expected_script="$2" grace="${3:-10}" waited=0
  automation_pid_alive "$pid" || return 0
  automation_pid_command_matches_script "$pid" "$expected_script" "${AUTOMATION_REPO_ROOT:-}" || return 2
  kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
  while automation_pid_alive "$pid" && (( waited < grace * 10 )); do
    sleep 0.1
    waited=$((waited + 1))
  done
  if automation_pid_alive "$pid"; then
    kill -KILL -- "-$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
  fi
  waited=0
  while automation_pid_alive "$pid" && (( waited < 100 )); do sleep 0.1; waited=$((waited + 1)); done
  automation_pid_alive "$pid" && return 2
  return 0
}

automation_terminate_active_child() {
  local pid="${AUTOMATION_ACTIVE_CHILD_PID:-}" script="${AUTOMATION_ACTIVE_CHILD_SCRIPT:-}"
  [[ "$pid" =~ ^[1-9][0-9]*$ ]] || return 0
  automation_pid_alive "$pid" || { automation_clear_active_child; return 0; }
  [[ -n "$script" ]] || return 2
  automation_terminate_process_group "$pid" "$script" "${AUTOMATION_GRACEFUL_UNLOCK_SECONDS:-30}" || return 2
  automation_clear_active_child
}

automation_run_managed_argv() {
  local array_name="$1" label="$2" timeout_seconds="$3" out_file="$4" stream_logs="$5" expected_script="$6"
  local -n command_ref="$array_name"
  local child_pid tail_pid="" rc capacity_rc=0
  (( ${#command_ref[@]} > 0 )) || return 2
  automation_temp_inode_check_capacity "before_managed_command:$label" || return $?
  mkdir -p "$(dirname "$out_file")"
  : > "$out_file"
  automation_require_command timeout
  automation_require_command setsid
  setsid timeout --signal=TERM --kill-after=10s "${timeout_seconds}s" "${command_ref[@]}" < /dev/null > "$out_file" 2>&1 &
  child_pid=$!
  if ! automation_set_active_child "$child_pid" "$label" "$expected_script" "$label"; then
    kill -TERM -- "-$child_pid" 2>/dev/null || true
    wait "$child_pid" 2>/dev/null || true
    return 2
  fi
  if [[ "$stream_logs" == "1" ]]; then
    tail -n +1 -f --pid="$child_pid" "$out_file" &
    tail_pid=$!
  fi
  set +e
  wait "$child_pid"
  rc=$?
  set -e
  [[ -n "$tail_pid" ]] && { wait "$tail_pid" 2>/dev/null || true; }
  automation_clear_active_child || true
  automation_temp_inode_check_capacity "after_managed_command:$label" || capacity_rc=$?
  if [[ "$capacity_rc" -ne 0 && "$rc" -eq 0 ]]; then
    rc="$capacity_rc"
  fi
  return "$rc"
}

automation_create_run_dir() {
  local slug="$1" stamp
  automation_temp_inode_bootstrap "$slug" || automation_die "temporary-file and inode-safety bootstrap failed" 42
  stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  mkdir -p "$AUTOMATION_REPO_ROOT/artifacts"
  AUTOMATION_RUN_DIR="$AUTOMATION_REPO_ROOT/artifacts/${slug}_${stamp}"
  mkdir -p "$AUTOMATION_RUN_DIR"
  AUTOMATION_CONTROLLER_LOG="$AUTOMATION_RUN_DIR/controller.log"
  : > "$AUTOMATION_CONTROLLER_LOG"
}

automation_collect_repo_snapshot() {
  local dir="$1"
  mkdir -p "$dir"
  {
    printf 'timestamp=%s\n' "$(automation_now_iso)"
    printf 'repo=%s\n' "$AUTOMATION_REPO_ROOT"
    printf 'project=%s\n' "${AUTOMATION_PROJECT_NAME:-}"
    printf 'user=%s\n' "$(id -un 2>/dev/null || true)"
    printf 'host=%s\n' "$(hostname 2>/dev/null || true)"
    printf 'pwd=%s\n' "$(pwd -P)"
    command -v node >/dev/null 2>&1 && printf 'node=%s\n' "$(node --version 2>/dev/null || true)"
    command -v npm >/dev/null 2>&1 && printf 'npm=%s\n' "$(npm --version 2>/dev/null || true)"
    command -v pnpm >/dev/null 2>&1 && printf 'pnpm=%s\n' "$(pnpm --version 2>/dev/null || true)"
    command -v python3 >/dev/null 2>&1 && printf 'python3=%s\n' "$(python3 --version 2>/dev/null || true)"
  } > "$dir/runtime.txt"
  if git -C "$AUTOMATION_REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git -C "$AUTOMATION_REPO_ROOT" status --short --branch > "$dir/git_status.txt" 2>&1 || true
    git -C "$AUTOMATION_REPO_ROOT" rev-parse HEAD > "$dir/git_commit.txt" 2>&1 || true
    git -C "$AUTOMATION_REPO_ROOT" branch --show-current > "$dir/git_branch.txt" 2>&1 || true
  fi
}

automation_snapshot_protected() {
  local out="$1" file
  : > "$out"
  for file in "${AUTOMATION_PROTECTED_FILES[@]:-}"; do
    if [[ -e "$AUTOMATION_REPO_ROOT/$file" ]]; then
      sha256sum "$AUTOMATION_REPO_ROOT/$file" | sed "s#  $AUTOMATION_REPO_ROOT/#  #" >> "$out"
    else
      printf 'MISSING  %s\n' "$file" >> "$out"
    fi
  done
  sort -k2 "$out" -o "$out"
}

automation_check_protected_unchanged() {
  local before="$1" after="$2" diff_out="$3"
  automation_snapshot_protected "$after"
  if [[ "${AUTOMATION_ALLOW_PROTECTED_CHANGES:-0}" == "1" ]]; then
    diff -u "$before" "$after" > "$diff_out" 2>&1 || true
    return 0
  fi
  if ! diff -u "$before" "$after" > "$diff_out" 2>&1; then
    automation_log "protected_files_changed diff=$diff_out"
    return 1
  fi
  return 0
}

automation_quote_argv() {
  local first=1 arg
  for arg in "$@"; do
    if [[ "$first" == "1" ]]; then
      first=0
    else
      printf ' '
    fi
    printf '%q' "$arg"
  done
  printf '\n'
}

automation_run_argv_command() {
  local label="$1" timeout_seconds="$2" out_file="$3" rc command_text expected_script
  shift 3
  (( $# > 0 )) || {
    automation_log "command_refused label=$label reason=empty_argv"
    return 2
  }
  mkdir -p "$(dirname "$out_file")"
  command_text="$(automation_quote_argv "$@")"
  automation_log "command_start label=$label timeout=${timeout_seconds}s command=$command_text"
  expected_script="$1"
  local -a command_argv=("$@")
  if automation_run_managed_argv command_argv "$label" "$timeout_seconds" "$out_file" 0 "$expected_script"; then
    rc=0
  else
    rc=$?
  fi
  if [[ "$rc" -eq 0 ]]; then
    automation_log "command_pass label=$label"
  else
    automation_log "command_fail label=$label exit=$rc log=$out_file"
  fi
  return "$rc"
}

automation_source_path_is_excluded() {
  local rel="${1#./}"
  case "$rel" in
    .git|.git/*|artifacts|artifacts/*|runtime|runtime/*|node_modules|node_modules/*|dist|dist/*|coverage|coverage/*|tmp|tmp/*|.tmp|.tmp/*|.cache|.cache/*|\
    .automation/tmp|.automation/tmp/*|\
    .automation/locks|.automation/locks/*|.automation/corrupt|.automation/corrupt/*|\
    .automation/paper-mode-to-autonomous-implementation.env|.automation/paper-mode-handover.env|\
    .automation/autonomous-implementation-handover.env|.automation/autonomous-implementation-handover.md|\
    .automation/bugfix-to-autonomous-implementation.env|.automation/bugfix-to-autonomous-implementation.md|\
    .automation/bugfix-mode-handover.env|.automation/consumed-handoffs|.automation/consumed-handoffs/*|.codex_current_artifact_dir|artifacts.zip|\
    *.zip|*.tar|*.tgz|*.tar.gz|*.log|*.pid|*.sqlite|*.sqlite3|*.db|*.pyc)
      return 0
      ;;
  esac
  return 1
}

automation_source_tree_fingerprint() {
  local root="${1:-${AUTOMATION_REPO_ROOT:-}}" list_file payload_file rel digest rc=0
  [[ -n "$root" && -d "$root" ]] || {
    echo "ERROR: source fingerprint requires an existing repository root" >&2
    return 1
  }
  root="$(cd "$root" && pwd -P)" || return 1
  list_file="$(mktemp "${TMPDIR:-/tmp}/automation-source-list.XXXXXX")" || return 1
  payload_file="$(mktemp "${TMPDIR:-/tmp}/automation-source-payload.XXXXXX")" || {
    rm -f "$list_file"
    return 1
  }

  if git -C "$root" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    {
      git -C "$root" ls-files -z
      git -C "$root" ls-files -z --others --exclude-standard
    } | sort -zu > "$list_file" || rc=$?
  else
    (cd "$root" && find . -type f -print0 | sort -z) > "$list_file" || rc=$?
  fi
  if [[ "$rc" -ne 0 ]]; then
    rm -f "$list_file" "$payload_file"
    return "$rc"
  fi

  : > "$payload_file"
  while IFS= read -r -d '' rel; do
    rel="${rel#./}"
    automation_source_path_is_excluded "$rel" && continue
    [[ -f "$root/$rel" ]] || continue
    digest="$(sha256sum -- "$root/$rel")" || {
      rm -f "$list_file" "$payload_file"
      return 1
    }
    digest="${digest%% *}"
    printf '%s\0%s\0' "$rel" "$digest" >> "$payload_file"
  done < "$list_file"

  digest="$(sha256sum -- "$payload_file")" || {
    rm -f "$list_file" "$payload_file"
    return 1
  }
  digest="${digest%% *}"
  printf '%s\n' "$digest"
  rm -f "$list_file" "$payload_file"
}

automation_run_shell_command() {
  local label="$1" command_text="$2" timeout_seconds="$3" out_file="$4" rc
  local -a command_argv=(bash -lc "$command_text")
  automation_log "command_start label=$label timeout=${timeout_seconds}s command=$command_text"
  if automation_run_managed_argv command_argv "$label" "$timeout_seconds" "$out_file" 0 bash; then
    rc=0
  else
    rc=$?
  fi
  if [[ "$rc" -eq 0 ]]; then
    automation_log "command_pass label=$label"
  else
    automation_log "command_fail label=$label exit=$rc log=$out_file"
  fi
  return "$rc"
}

automation_run_command_array() {
  local array_name="$1" label_prefix="$2" timeout_seconds="$3" out_dir="$4" rc=0 idx=0 cmd label out
  local -n commands_ref="$array_name"
  if (( ${#commands_ref[@]} == 0 )); then
    automation_log "commands_skipped label=$label_prefix reason=empty"
    return 0
  fi
  mkdir -p "$out_dir"
  for cmd in "${commands_ref[@]}"; do
    idx=$((idx + 1))
    label="${label_prefix}_${idx}"
    out="$out_dir/${label}.log"
    if ! automation_run_shell_command "$label" "$cmd" "$timeout_seconds" "$out"; then
      rc=1
    fi
  done
  return "$rc"
}

automation_run_validations() {
  local mode="$1" out_dir="$2" timeout_seconds="$3" rc=0
  automation_run_command_array AUTOMATION_VALIDATION_COMMANDS "common_validation" "$timeout_seconds" "$out_dir" || rc=1
  case "$mode" in
    implementation)
      automation_run_command_array AUTOMATION_IMPLEMENTATION_VALIDATION_COMMANDS "implementation_validation" "$timeout_seconds" "$out_dir" || rc=1 ;;
    bugfix)
      automation_run_command_array AUTOMATION_BUGFIX_VALIDATION_COMMANDS "bugfix_validation" "$timeout_seconds" "$out_dir" || rc=1 ;;
  esac
  return "$rc"
}

automation_run_codex_prompt() {
  local prompt_file="$1" log_file="$2" timeout_seconds="$3" model_override="${4:-}" rc model fallback_model
  automation_require_command "${AUTOMATION_CODEX_BIN:-codex}"
  model="$model_override"
  [[ -z "$model" ]] && model="${AUTOMATION_CODEX_MODEL:-}"
  fallback_model="${AUTOMATION_CODEX_FALLBACK_MODEL:-}"
  local -a cmd=("${AUTOMATION_CODEX_BIN:-codex}" exec -C "$AUTOMATION_REPO_ROOT" --sandbox "${AUTOMATION_CODEX_SANDBOX:-danger-full-access}")
  if [[ -n "$model" && "$model" != "cli-default" ]]; then
    cmd+=(-m "$model")
  fi
  cmd+=("$(cat "$prompt_file")")
  automation_log "codex_start prompt=$prompt_file timeout=${timeout_seconds}s model=${model:-cli-default}"
  if automation_run_managed_argv cmd "codex:${model:-cli-default}" "$timeout_seconds" "$log_file" "${AUTOMATION_CODEX_STREAM_LOGS:-1}" "${AUTOMATION_CODEX_BIN:-codex}"; then
    rc=0
  else
    rc=$?
  fi
  if [[ "$rc" -ne 0 && -n "$fallback_model" ]]; then
    automation_log "codex_retry_with_fallback initial_exit=$rc fallback_model=$fallback_model"
    local -a fallback_cmd=("${AUTOMATION_CODEX_BIN:-codex}" exec -C "$AUTOMATION_REPO_ROOT" --sandbox "${AUTOMATION_CODEX_SANDBOX:-danger-full-access}")
    if [[ "$fallback_model" != "cli-default" ]]; then
      fallback_cmd+=(-m "$fallback_model")
    fi
    fallback_cmd+=("$(cat "$prompt_file")")
    local fallback_log="${log_file}.fallback"
    if automation_run_managed_argv fallback_cmd "codex-fallback:$fallback_model" "$timeout_seconds" "$fallback_log" "${AUTOMATION_CODEX_STREAM_LOGS:-1}" "${AUTOMATION_CODEX_BIN:-codex}"; then
      rc=0
    else
      rc=$?
    fi
    {
      printf '\n--- fallback model: %s ---\n' "$fallback_model"
      cat "$fallback_log"
    } >> "$log_file"
    rm -f -- "$fallback_log"
  fi
  if [[ "$rc" -eq 0 ]]; then
    automation_log "codex_pass prompt=$prompt_file"
  else
    automation_log "codex_fail prompt=$prompt_file exit=$rc log=$log_file"
  fi
  return "$rc"
}

automation_read_continue_status() {
  local file="$1"
  local line=""
  local count=0
  local status=""
  if [[ ! -f "$file" ]]; then
    echo "ERROR: missing continue status file: $file" >&2
    return 1
  fi
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ -z "$line" ]] && continue
    count=$((count + 1))
    status="$line"
  done < "$file"
  if [[ "$count" -ne 1 ]]; then
    echo "ERROR: continue status must contain exactly one non-empty line: $file" >&2
    return 1
  fi
  case "$status" in
    CONTINUE_REQUIRED=yes|AUTONOMOUS_GOAL_COMPLETE=yes|BLOCKED=yes)
      printf '%s\n' "$status"
      ;;
    *)
      echo "ERROR: unknown continue status '$status' in $file" >&2
      return 1
      ;;
  esac
}

automation_require_cycle_artifacts() {
  local base_dir="$1"
  shift
  local allow_empty_git_diff=0
  if [[ "${1:-}" == "allow_empty_git_diff" ]]; then
    allow_empty_git_diff=1
    shift
  fi
  local rel=""
  local path=""
  local missing=0
  for rel in "$@"; do
    path="$base_dir/$rel"
    if [[ ! -e "$path" ]]; then
      automation_log "required_cycle_artifact_missing path=$path"
      missing=1
      continue
    fi
    if [[ ! -s "$path" ]]; then
      if [[ "$allow_empty_git_diff" == "1" && "$rel" == "git_diff.patch" ]]; then
        continue
      fi
      automation_log "required_cycle_artifact_empty path=$path"
      missing=1
      continue
    fi
    if grep -Eiq 'AUTOMATION_REQUIRED_ARTIFACT_PLACEHOLDER|TODO_PLACEHOLDER|placeholder only|replace this placeholder' "$path" 2>/dev/null; then
      automation_log "required_cycle_artifact_placeholder path=$path"
      missing=1
    fi
  done
  [[ "$missing" == "0" ]]
}

automation_refresh_final_artifacts_zip() {
  local timeout_seconds="${1:?timeout seconds are required}"
  local root="${2:?repository root is required}"
  local run_dir="${3:?run directory is required}"
  local archive="$root/artifacts.zip" relative_run tmp entry rc=0
  local -a entries=()

  [[ "$timeout_seconds" =~ ^[1-9][0-9]*$ ]] || {
    printf 'ERROR: artifact refresh timeout must be a positive integer; got %q.\n' "$timeout_seconds" >&2
    return 2
  }
  [[ -d "$root" && ! -L "$root" ]] || {
    printf 'ERROR: artifact refresh repository root must be a non-symlink directory: %s\n' "$root" >&2
    return 2
  }
  [[ -d "$run_dir" && ! -L "$run_dir" ]] || {
    printf 'ERROR: artifact refresh run directory must be a non-symlink directory: %s\n' "$run_dir" >&2
    return 2
  }
  case "$run_dir" in
    "$root"/artifacts/*) relative_run="${run_dir#"$root"/}" ;;
    *)
      printf 'ERROR: artifact refresh run directory must stay under %s/artifacts: %s\n' "$root" "$run_dir" >&2
      return 2
      ;;
  esac
  [[ -f "$archive" && ! -L "$archive" ]] || {
    printf 'ERROR: artifact refresh requires an existing non-symlink archive: %s\n' "$archive" >&2
    return 2
  }

  for entry in final-summary.md final_summary.txt final/final-summary.md; do
    if [[ -f "$run_dir/$entry" && ! -L "$run_dir/$entry" ]]; then
      entries+=("$relative_run/$entry")
    fi
  done
  (( ${#entries[@]} > 0 )) || {
    printf 'ERROR: artifact refresh found no final summary under: %s\n' "$run_dir" >&2
    return 2
  }

  tmp="$root/.artifacts.zip.refresh.$$.zip"
  rm -f -- "$tmp"
  if ! cp --reflink=auto -- "$archive" "$tmp" 2>/dev/null; then
    cp -- "$archive" "$tmp" || {
      rm -f -- "$tmp"
      return 1
    }
  fi
  if automation_v2_zip_with_timeout "$timeout_seconds" "$tmp" "$root" "${entries[@]}"; then
    rc=0
  else
    rc=$?
    rm -f -- "$tmp"
    return "$rc"
  fi
  if ! mv -f -- "$tmp" "$archive"; then
    rm -f -- "$tmp"
    return 1
  fi
  return 0
}

automation_build_artifacts_zip() {
  local run_dir="$1" root="$2" zip_tmp timeout_seconds
  [[ -d "$run_dir" ]] || return 0
  [[ -d "$root/artifacts" ]] || return 0
  automation_temp_inode_check_capacity before_artifact_packaging || return $?
  automation_require_command zip
  timeout_seconds="$(automation_parse_duration_seconds "${AUTOMATION_ZIP_TIMEOUT:-10m}")" || return 2
  zip_tmp="$root/.artifacts.zip.tmp.$$.zip"
  rm -f "$zip_tmp"
  (cd "$root" && timeout --signal=TERM --kill-after=10s "${timeout_seconds}s" zip -q -1 -r "$zip_tmp" artifacts) || {
    local rc=$?
    rm -f -- "$zip_tmp"
    return "$rc"
  }
  mv "$zip_tmp" "$root/artifacts.zip"
  automation_log "artifacts_zip_created path=$root/artifacts.zip"
}

automation_latest_evidence_hint() {
  local root="$1" latest=""
  if [[ -f "$root/artifacts.zip" ]]; then
    printf '%s\n' "$root/artifacts.zip"
    return 0
  fi
  latest="$(find "$root/artifacts" -maxdepth 1 -mindepth 1 -type d 2>/dev/null | sort | tail -n 1 || true)"
  [[ -n "$latest" ]] && printf '%s\n' "$latest"
}
