#!/usr/bin/env bash
# Repository-scoped temporary-file and inode-capacity guard.
# shellcheck shell=bash

if [[ -n "${AUTOMATION_TEMP_INODE_GUARD_LIBRARY_LOADED:-}" ]]; then
  return 0 2>/dev/null || exit 0
fi
AUTOMATION_TEMP_INODE_GUARD_LIBRARY_LOADED=1

_AUTOMATION_TEMP_GUARD_SCHEMA=1
_AUTOMATION_TEMP_MARKER_NAME=.automation-temp-session.env
_AUTOMATION_TEMP_SESSION_PREFIX=bws-automation-

_automation_temp_log() {
  if declare -F automation_log >/dev/null 2>&1; then
    automation_log "temp_inode_guard $*"
  else
    printf '[%s] temp_inode_guard %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >&2
  fi
}

_automation_temp_error() {
  printf 'ERROR: temp/inode safety: %s\n' "$*" >&2
}

_automation_temp_require_uint() {
  local name="${1:?name required}" value="${2-}" min="${3:?min required}" max="${4:?max required}"
  [[ "$value" =~ ^[0-9]+$ ]] || { _automation_temp_error "$name must be an integer, got: $value"; return 2; }
  (( value >= min && value <= max )) || {
    _automation_temp_error "$name must be between $min and $max, got: $value"
    return 2
  }
}

_automation_temp_proc_start_ticks() {
  local pid="${1:?pid required}" stat_line remainder
  [[ "$pid" =~ ^[1-9][0-9]*$ && -r "/proc/$pid/stat" ]] || return 1
  IFS= read -r stat_line < "/proc/$pid/stat" || return 1
  remainder="${stat_line##*) }"
  # /proc/<pid>/stat field 22 is field 20 after stripping pid and comm.
  awk '{print $20}' <<< "$remainder"
}

_automation_temp_boot_id() {
  [[ -r /proc/sys/kernel/random/boot_id ]] || return 1
  tr -d '[:space:]' < /proc/sys/kernel/random/boot_id
}

_automation_temp_marker_value() {
  local marker="${1:?marker required}" key="${2:?key required}"
  [[ -f "$marker" && ! -L "$marker" ]] || return 1
  awk -F= -v wanted="$key" '
    $1 == wanted {
      count++
      value=$0
      sub(/^[^=]*=/, "", value)
    }
    END {
      if (count == 1) { print value; exit 0 }
      exit 1
    }
  ' "$marker"
}

_automation_temp_repository_id() {
  local repo_real="${1:?repo realpath required}" repo_name
  repo_name="$(basename -- "$repo_real")"
  printf '%s\0%s' "$repo_name" "$repo_real" | sha256sum | awk '{print $1}'
}

_automation_temp_validate_relative_root() {
  local value="${1-}"
  [[ -n "$value" ]] || { _automation_temp_error 'AUTOMATION_TEMP_ROOT_RELATIVE must not be empty'; return 2; }
  [[ "$value" != /* ]] || { _automation_temp_error 'AUTOMATION_TEMP_ROOT_RELATIVE must be repository-relative'; return 2; }
  [[ "$value" != '.' && "$value" != './' ]] || { _automation_temp_error 'AUTOMATION_TEMP_ROOT_RELATIVE must not resolve to the repository root'; return 2; }
  case "/$value/" in
    */../*|*/./*) _automation_temp_error "unsafe AUTOMATION_TEMP_ROOT_RELATIVE: $value"; return 2 ;;
  esac
  [[ "$value" =~ ^[A-Za-z0-9._/-]+$ ]] || { _automation_temp_error "invalid AUTOMATION_TEMP_ROOT_RELATIVE: $value"; return 2; }
}

automation_temp_inode_configure() {
  AUTOMATION_TEMP_INODE_SAFETY_ENABLED="${AUTOMATION_TEMP_INODE_SAFETY_ENABLED:-1}"
  AUTOMATION_TEMP_ROOT_RELATIVE="${AUTOMATION_TEMP_ROOT_RELATIVE:-.automation/tmp}"
  AUTOMATION_TEMP_STALE_SECONDS="${AUTOMATION_TEMP_STALE_SECONDS:-3600}"
  AUTOMATION_MIN_FREE_INODES="${AUTOMATION_MIN_FREE_INODES:-50000}"
  AUTOMATION_MIN_FREE_INODE_PERCENT="${AUTOMATION_MIN_FREE_INODE_PERCENT:-2}"
  AUTOMATION_MIN_FREE_KIB="${AUTOMATION_MIN_FREE_KIB:-1048576}"
  AUTOMATION_MAX_RUN_TEMP_INODES="${AUTOMATION_MAX_RUN_TEMP_INODES:-250000}"
  AUTOMATION_MAX_RUN_TEMP_KIB="${AUTOMATION_MAX_RUN_TEMP_KIB:-4194304}"
  AUTOMATION_CAPACITY_CHECK_INTERVAL_SECONDS="${AUTOMATION_CAPACITY_CHECK_INTERVAL_SECONDS:-15}"
  AUTOMATION_TEMP_WATCHDOG_MAX_CONSECUTIVE_MEASUREMENT_FAILURES="${AUTOMATION_TEMP_WATCHDOG_MAX_CONSECUTIVE_MEASUREMENT_FAILURES:-20}"
  AUTOMATION_TEMP_USAGE_SCAN_TIMEOUT_SECONDS="${AUTOMATION_TEMP_USAGE_SCAN_TIMEOUT_SECONDS:-10}"
  AUTOMATION_TEMP_CLEANUP_TIMEOUT_SECONDS="${AUTOMATION_TEMP_CLEANUP_TIMEOUT_SECONDS:-120}"

  _automation_temp_require_uint AUTOMATION_TEMP_INODE_SAFETY_ENABLED "$AUTOMATION_TEMP_INODE_SAFETY_ENABLED" 0 1 || return
  _automation_temp_validate_relative_root "$AUTOMATION_TEMP_ROOT_RELATIVE" || return
  _automation_temp_require_uint AUTOMATION_TEMP_STALE_SECONDS "$AUTOMATION_TEMP_STALE_SECONDS" 60 2592000 || return
  _automation_temp_require_uint AUTOMATION_MIN_FREE_INODES "$AUTOMATION_MIN_FREE_INODES" 1 2000000000 || return
  _automation_temp_require_uint AUTOMATION_MIN_FREE_INODE_PERCENT "$AUTOMATION_MIN_FREE_INODE_PERCENT" 0 100 || return
  _automation_temp_require_uint AUTOMATION_MIN_FREE_KIB "$AUTOMATION_MIN_FREE_KIB" 1024 1099511627776 || return
  _automation_temp_require_uint AUTOMATION_MAX_RUN_TEMP_INODES "$AUTOMATION_MAX_RUN_TEMP_INODES" 100 2000000000 || return
  _automation_temp_require_uint AUTOMATION_MAX_RUN_TEMP_KIB "$AUTOMATION_MAX_RUN_TEMP_KIB" 1024 1099511627776 || return
  _automation_temp_require_uint AUTOMATION_CAPACITY_CHECK_INTERVAL_SECONDS "$AUTOMATION_CAPACITY_CHECK_INTERVAL_SECONDS" 1 3600 || return
  _automation_temp_require_uint AUTOMATION_TEMP_WATCHDOG_MAX_CONSECUTIVE_MEASUREMENT_FAILURES "$AUTOMATION_TEMP_WATCHDOG_MAX_CONSECUTIVE_MEASUREMENT_FAILURES" 1 1000 || return
  _automation_temp_require_uint AUTOMATION_TEMP_USAGE_SCAN_TIMEOUT_SECONDS "$AUTOMATION_TEMP_USAGE_SCAN_TIMEOUT_SECONDS" 1 600 || return
  _automation_temp_require_uint AUTOMATION_TEMP_CLEANUP_TIMEOUT_SECONDS "$AUTOMATION_TEMP_CLEANUP_TIMEOUT_SECONDS" 1 3600 || return

  export AUTOMATION_TEMP_INODE_SAFETY_ENABLED AUTOMATION_TEMP_ROOT_RELATIVE
  export AUTOMATION_TEMP_STALE_SECONDS AUTOMATION_MIN_FREE_INODES AUTOMATION_MIN_FREE_INODE_PERCENT
  export AUTOMATION_MIN_FREE_KIB AUTOMATION_MAX_RUN_TEMP_INODES AUTOMATION_MAX_RUN_TEMP_KIB
  export AUTOMATION_CAPACITY_CHECK_INTERVAL_SECONDS AUTOMATION_TEMP_WATCHDOG_MAX_CONSECUTIVE_MEASUREMENT_FAILURES
  export AUTOMATION_TEMP_USAGE_SCAN_TIMEOUT_SECONDS AUTOMATION_TEMP_CLEANUP_TIMEOUT_SECONDS
}

_automation_temp_prepare_base() {
  local repo_real base_candidate base_real sessions_real
  [[ -n "${AUTOMATION_REPO_ROOT:-}" ]] || { _automation_temp_error 'AUTOMATION_REPO_ROOT is not set'; return 2; }
  repo_real="$(realpath -e -- "$AUTOMATION_REPO_ROOT" 2>/dev/null)" || {
    _automation_temp_error "repository root is not canonical: $AUTOMATION_REPO_ROOT"
    return 2
  }
  [[ -d "$repo_real" && ! -L "$repo_real" ]] || { _automation_temp_error "repository root is unsafe: $repo_real"; return 2; }
  base_candidate="$repo_real/$AUTOMATION_TEMP_ROOT_RELATIVE"
  umask 077
  mkdir -p -- "$base_candidate/sessions" || { _automation_temp_error "cannot create managed temp base: $base_candidate"; return 2; }
  [[ ! -L "$base_candidate" && ! -L "$base_candidate/sessions" ]] || { _automation_temp_error 'managed temp base must not be a symlink'; return 2; }
  base_real="$(realpath -e -- "$base_candidate")" || return 2
  sessions_real="$(realpath -e -- "$base_candidate/sessions")" || return 2
  case "$base_real/" in "$repo_real/"*) ;; *) _automation_temp_error "managed temp base escapes repository: $base_real"; return 2 ;; esac
  [[ "$base_real" != "$repo_real" && "$sessions_real" == "$base_real/sessions" ]] || {
    _automation_temp_error 'managed temp base or sessions directory failed containment checks'
    return 2
  }
  [[ -w "$base_real" && -x "$base_real" && -w "$sessions_real" && -x "$sessions_real" ]] || {
    _automation_temp_error "managed temp base is not writable: $base_real"
    return 2
  }
  AUTOMATION_TEMP_REPO_REALPATH="$repo_real"
  AUTOMATION_TEMP_BASE="$base_real"
  AUTOMATION_TEMP_SESSIONS_ROOT="$sessions_real"
  AUTOMATION_TEMP_REPOSITORY_ID="$(_automation_temp_repository_id "$repo_real")" || return 2
  export AUTOMATION_TEMP_REPO_REALPATH AUTOMATION_TEMP_BASE AUTOMATION_TEMP_SESSIONS_ROOT AUTOMATION_TEMP_REPOSITORY_ID
}

_automation_temp_exact_owner_alive() {
  local pid="${1:?pid required}" start_ticks="${2:?start ticks required}" boot_id="${3:?boot id required}"
  local current_boot current_start state
  current_boot="$(_automation_temp_boot_id 2>/dev/null)" || return 1
  [[ "$current_boot" == "$boot_id" ]] || return 1
  [[ -d "/proc/$pid" ]] || return 1
  current_start="$(_automation_temp_proc_start_ticks "$pid" 2>/dev/null)" || return 1
  [[ "$current_start" == "$start_ticks" ]] || return 1
  state="$(awk '{print $3}' "/proc/$pid/stat" 2>/dev/null || true)"
  [[ "$state" != Z && "$state" != X ]] || return 1
  return 0
}

_automation_temp_marker_is_valid() {
  local marker="${1:?marker required}" schema repo_id repo_path controller pid start_ticks boot_id created cleanup
  schema="$(_automation_temp_marker_value "$marker" schema_version)" || return 1
  repo_id="$(_automation_temp_marker_value "$marker" repository_id)" || return 1
  repo_path="$(_automation_temp_marker_value "$marker" repository_realpath)" || return 1
  controller="$(_automation_temp_marker_value "$marker" controller)" || return 1
  pid="$(_automation_temp_marker_value "$marker" owner_pid)" || return 1
  start_ticks="$(_automation_temp_marker_value "$marker" owner_start_ticks)" || return 1
  boot_id="$(_automation_temp_marker_value "$marker" boot_id)" || return 1
  created="$(_automation_temp_marker_value "$marker" created_epoch)" || return 1
  cleanup="$(_automation_temp_marker_value "$marker" cleanup_policy)" || return 1
  [[ "$schema" == "$_AUTOMATION_TEMP_GUARD_SCHEMA" ]] || return 1
  [[ "$repo_id" == "$AUTOMATION_TEMP_REPOSITORY_ID" && "$repo_path" == "$AUTOMATION_TEMP_REPO_REALPATH" ]] || return 1
  [[ "$controller" =~ ^[A-Za-z0-9._-]+$ ]] || return 1
  [[ "$pid" =~ ^[1-9][0-9]*$ && "$start_ticks" =~ ^[0-9]+$ && "$created" =~ ^[0-9]+$ ]] || return 1
  [[ "$boot_id" =~ ^[0-9a-fA-F-]+$ && "$cleanup" == delete_after_owner_exit ]] || return 1
}

_automation_temp_path_is_session() {
  local path="${1:?path required}" real parent base
  [[ -d "$path" && ! -L "$path" ]] || return 1
  real="$(realpath -e -- "$path" 2>/dev/null)" || return 1
  parent="$(dirname -- "$real")"
  base="$(basename -- "$real")"
  [[ "$parent" == "$AUTOMATION_TEMP_SESSIONS_ROOT" && "$base" == "${_AUTOMATION_TEMP_SESSION_PREFIX}"* ]] || return 1
  [[ "$real" != / && "$real" != "$AUTOMATION_TEMP_REPO_REALPATH" && "$real" != "$AUTOMATION_TEMP_BASE" && "$real" != "$AUTOMATION_TEMP_SESSIONS_ROOT" ]] || return 1
}

_automation_temp_safe_remove_session() {
  local path="${1:?path required}" mode="${2:-dead_only}" marker pid start_ticks boot_id
  _automation_temp_path_is_session "$path" || { _automation_temp_log "cleanup_rejected path=$path reason=path_boundary"; return 2; }
  marker="$path/$_AUTOMATION_TEMP_MARKER_NAME"
  _automation_temp_marker_is_valid "$marker" || { _automation_temp_log "cleanup_rejected path=$path reason=invalid_marker"; return 2; }
  pid="$(_automation_temp_marker_value "$marker" owner_pid)" || return 2
  start_ticks="$(_automation_temp_marker_value "$marker" owner_start_ticks)" || return 2
  boot_id="$(_automation_temp_marker_value "$marker" boot_id)" || return 2
  if _automation_temp_exact_owner_alive "$pid" "$start_ticks" "$boot_id"; then
    if [[ "$mode" != current_owner || "$pid" != "$$" ]]; then
      _automation_temp_log "cleanup_retained path=$path reason=owner_alive pid=$pid"
      return 3
    fi
  fi
  timeout --signal=TERM --kill-after=5s "${AUTOMATION_TEMP_CLEANUP_TIMEOUT_SECONDS}s" \
    rm -rf --one-file-system -- "$path" || {
      _automation_temp_log "cleanup_failed path=$path"
      return 2
    }
  [[ ! -e "$path" ]] || { _automation_temp_log "cleanup_failed path=$path reason=still_exists"; return 2; }
  _automation_temp_log "cleanup_removed path=$path"
}

_automation_temp_write_marker() {
  local session="${1:?session required}" controller="${2:?controller required}" pid="${3:?pid required}"
  local start_ticks="${4:?start ticks required}" boot_id="${5:?boot id required}" created_epoch="${6:?created epoch required}"
  local created_iso="${7:?created iso required}" heartbeat_epoch="${8:?heartbeat epoch required}" heartbeat_iso="${9:?heartbeat iso required}"
  local marker="$session/$_AUTOMATION_TEMP_MARKER_NAME" temp="$session/.marker.tmp.$RANDOM.$$"
  {
    printf 'schema_version=%s\n' "$_AUTOMATION_TEMP_GUARD_SCHEMA"
    printf 'repository_id=%s\n' "$AUTOMATION_TEMP_REPOSITORY_ID"
    printf 'repository_realpath=%s\n' "$AUTOMATION_TEMP_REPO_REALPATH"
    printf 'controller=%s\n' "$controller"
    printf 'owner_pid=%s\n' "$pid"
    printf 'owner_start_ticks=%s\n' "$start_ticks"
    printf 'boot_id=%s\n' "$boot_id"
    printf 'created_epoch=%s\n' "$created_epoch"
    printf 'created_at=%s\n' "$created_iso"
    printf 'heartbeat_epoch=%s\n' "$heartbeat_epoch"
    printf 'heartbeat_at=%s\n' "$heartbeat_iso"
    printf 'cleanup_policy=delete_after_owner_exit\n'
  } > "$temp" || { rm -f -- "$temp"; return 2; }
  chmod 0600 "$temp" || { rm -f -- "$temp"; return 2; }
  mv -f -- "$temp" "$marker"
}

_automation_temp_update_heartbeat() {
  local session="${1:?session required}" controller="${2:?controller required}" pid="${3:?pid required}"
  local start_ticks="${4:?start ticks required}" boot_id="${5:?boot id required}" created_epoch="${6:?created epoch required}"
  local created_iso="${7:?created iso required}" now_epoch now_iso
  now_epoch="$(date -u +%s)"
  now_iso="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  _automation_temp_write_marker "$session" "$controller" "$pid" "$start_ticks" "$boot_id" "$created_epoch" "$created_iso" "$now_epoch" "$now_iso"
}

_automation_temp_df_values() {
  local mode="${1:?mode required}" target="${2:?target required}" line
  case "$mode" in
    blocks) line="$(LC_ALL=C df -Pk -- "$target" 2>/dev/null | awk 'NR==2 {print $1 "\t" $2 "\t" $3 "\t" $4 "\t" $5 "\t" $6}')" ;;
    inodes) line="$(LC_ALL=C df -Pi -- "$target" 2>/dev/null | awk 'NR==2 {print $1 "\t" $2 "\t" $3 "\t" $4 "\t" $5 "\t" $6}')" ;;
    *) return 2 ;;
  esac
  [[ -n "$line" ]] || return 2
  printf '%s\n' "$line"
}

automation_temp_inode_check_capacity() {
  local context="${1:-unspecified}" block_line inode_line
  local bfs btotal bused bavail bpct bmount ifs itotal iused iavail ipct imount
  local free_inode_percent required_by_percent required_inodes session_inodes=0 session_kib=0 usage rc
  [[ "${AUTOMATION_TEMP_INODE_SAFETY_ENABLED:-0}" == 1 ]] || return 0
  [[ -n "${AUTOMATION_TEMP_BASE:-}" && -d "$AUTOMATION_TEMP_BASE" ]] || { _automation_temp_error 'capacity check has no managed temp base'; return 2; }
  block_line="$(_automation_temp_df_values blocks "$AUTOMATION_TEMP_BASE")" || { _automation_temp_error 'malformed df -Pk output'; return 2; }
  inode_line="$(_automation_temp_df_values inodes "$AUTOMATION_TEMP_BASE")" || { _automation_temp_error 'malformed df -Pi output'; return 2; }
  IFS=$'\t' read -r bfs btotal bused bavail bpct bmount <<< "$block_line"
  IFS=$'\t' read -r ifs itotal iused iavail ipct imount <<< "$inode_line"
  for value in "$btotal" "$bused" "$bavail" "$itotal" "$iused" "$iavail"; do
    [[ "$value" =~ ^[0-9]+$ ]] || { _automation_temp_error 'df capacity output contains non-integer fields'; return 2; }
  done
  (( itotal > 0 )) || { _automation_temp_error 'filesystem reports zero total inodes'; return 2; }
  free_inode_percent=$(( iavail * 100 / itotal ))
  required_by_percent=$(( (itotal * AUTOMATION_MIN_FREE_INODE_PERCENT + 99) / 100 ))
  required_inodes="$AUTOMATION_MIN_FREE_INODES"
  (( required_by_percent > required_inodes )) && required_inodes="$required_by_percent"

  if (( bavail < AUTOMATION_MIN_FREE_KIB )); then
    _automation_temp_error "AUTOMATION_TEMP_SPACE_PREFLIGHT_BLOCKED context=$context available_kib=$bavail required_kib=$AUTOMATION_MIN_FREE_KIB"
    return 42
  fi
  if (( iavail < required_inodes )); then
    _automation_temp_error "AUTOMATION_TEMP_INODE_PREFLIGHT_BLOCKED context=$context available_inodes=$iavail required_inodes=$required_inodes free_percent=$free_inode_percent"
    return 43
  fi

  if [[ -n "${AUTOMATION_TEMP_SESSION_ROOT:-}" && -d "$AUTOMATION_TEMP_SESSION_ROOT" ]]; then
    if usage="$(timeout --signal=TERM --kill-after=2s "${AUTOMATION_TEMP_USAGE_SCAN_TIMEOUT_SECONDS}s" \
      du --inodes --summarize --one-file-system -- "$AUTOMATION_TEMP_SESSION_ROOT" 2>/dev/null)"; then
      rc=0
    else
      rc=$?
    fi
    session_inodes="${usage%%[[:space:]]*}"
    if [[ "$session_inodes" =~ ^[0-9]+$ ]]; then
      if [[ "$rc" != 0 ]]; then
        _automation_temp_log "usage_scan_race_tolerated context=$context mode=inodes exit=$rc value=$session_inodes"
      fi
    else
      _automation_temp_error "AUTOMATION_TEMP_USAGE_SCAN_BLOCKED context=$context mode=inodes exit=$rc reason=no_usable_numeric_output"
      return 44
    fi
    if usage="$(timeout --signal=TERM --kill-after=2s "${AUTOMATION_TEMP_USAGE_SCAN_TIMEOUT_SECONDS}s" \
      du -skx -- "$AUTOMATION_TEMP_SESSION_ROOT" 2>/dev/null)"; then
      rc=0
    else
      rc=$?
    fi
    session_kib="${usage%%[[:space:]]*}"
    if [[ "$session_kib" =~ ^[0-9]+$ ]]; then
      if [[ "$rc" != 0 ]]; then
        _automation_temp_log "usage_scan_race_tolerated context=$context mode=kib exit=$rc value=$session_kib"
      fi
    else
      _automation_temp_error "AUTOMATION_TEMP_USAGE_SCAN_BLOCKED context=$context mode=kib exit=$rc reason=no_usable_numeric_output"
      return 44
    fi
    if (( session_inodes > AUTOMATION_MAX_RUN_TEMP_INODES )); then
      _automation_temp_error "AUTOMATION_TEMP_RUN_INODE_BUDGET_EXCEEDED context=$context session_inodes=$session_inodes limit=$AUTOMATION_MAX_RUN_TEMP_INODES"
      return 45
    fi
    if (( session_kib > AUTOMATION_MAX_RUN_TEMP_KIB )); then
      _automation_temp_error "AUTOMATION_TEMP_RUN_SPACE_BUDGET_EXCEEDED context=$context session_kib=$session_kib limit=$AUTOMATION_MAX_RUN_TEMP_KIB"
      return 46
    fi
  fi

  _automation_temp_log "capacity_ok context=$context filesystem=$bfs available_kib=$bavail total_inodes=$itotal available_inodes=$iavail free_inode_percent=$free_inode_percent session_inodes=$session_inodes session_kib=$session_kib"
  return 0
}

automation_temp_inode_print_filesystem_state() {
  local label="${1:-state}"
  printf '=== %s: df -Pk ===\n' "$label"
  LC_ALL=C df -Pk -- "${AUTOMATION_TEMP_BASE:?}" || return 2
  printf '=== %s: df -Pi ===\n' "$label"
  LC_ALL=C df -Pi -- "$AUTOMATION_TEMP_BASE" || return 2
}

automation_temp_inode_recover_stale() {
  local mode="${1:-apply}" min_age="${2:-${AUTOMATION_TEMP_STALE_SECONDS:-3600}}" scan_file candidate marker
  local created pid start_ticks boot_id age now rc=0
  [[ "$mode" == apply || "$mode" == dry-run ]] || return 2
  _automation_temp_require_uint min_age "$min_age" 0 2592000 || return
  scan_file="$AUTOMATION_TEMP_BASE/.session-scan.$$.$RANDOM"
  if timeout --signal=TERM --kill-after=2s "${AUTOMATION_TEMP_USAGE_SCAN_TIMEOUT_SECONDS}s" \
    find "$AUTOMATION_TEMP_SESSIONS_ROOT" -mindepth 1 -maxdepth 1 -type d -name "${_AUTOMATION_TEMP_SESSION_PREFIX}*" -print0 > "$scan_file"; then
    rc=0
  else
    rc=$?
  fi
  if [[ "$rc" != 0 ]]; then
    rm -f -- "$scan_file"
    _automation_temp_error "stale session scan failed or timed out: exit=$rc"
    return 2
  fi
  now="$(date -u +%s)"
  while IFS= read -r -d '' candidate; do
    marker="$candidate/$_AUTOMATION_TEMP_MARKER_NAME"
    if ! _automation_temp_path_is_session "$candidate" || ! _automation_temp_marker_is_valid "$marker"; then
      _automation_temp_log "stale_recovery_rejected path=$candidate reason=invalid_path_or_marker"
      rc=2
      continue
    fi
    created="$(_automation_temp_marker_value "$marker" created_epoch)" || { rc=2; continue; }
    pid="$(_automation_temp_marker_value "$marker" owner_pid)" || { rc=2; continue; }
    start_ticks="$(_automation_temp_marker_value "$marker" owner_start_ticks)" || { rc=2; continue; }
    boot_id="$(_automation_temp_marker_value "$marker" boot_id)" || { rc=2; continue; }
    if _automation_temp_exact_owner_alive "$pid" "$start_ticks" "$boot_id"; then
      _automation_temp_log "stale_recovery_retained path=$candidate reason=owner_alive pid=$pid"
      continue
    fi
    age=$(( now - created ))
    if (( age < min_age )); then
      _automation_temp_log "stale_recovery_retained path=$candidate reason=grace_period age_seconds=$age"
      continue
    fi
    if [[ "$mode" == dry-run ]]; then
      printf 'would_remove_session=%s age_seconds=%s\n' "$candidate" "$age"
    else
      _automation_temp_safe_remove_session "$candidate" dead_only || rc=2
    fi
  done < "$scan_file"
  rm -f -- "$scan_file"
  return "$rc"
}

_automation_temp_watchdog_event_directory_is_safe() {
  local directory="${1:?directory required}" real parent
  [[ -n "${AUTOMATION_TEMP_REPO_REALPATH:-}" && -d "$AUTOMATION_TEMP_REPO_REALPATH" ]] || return 1
  mkdir -p -- "$directory" 2>/dev/null || return 1
  [[ -d "$directory" && ! -L "$directory" ]] || return 1
  real="$(realpath -e -- "$directory" 2>/dev/null)" || return 1
  case "$real/" in
    "$AUTOMATION_TEMP_REPO_REALPATH"/*/) ;;
    *) return 1 ;;
  esac
  parent="$(dirname -- "$real")"
  [[ "$parent" != / && "$real" != "$AUTOMATION_TEMP_REPO_REALPATH" ]] || return 1
  printf '%s\n' "$real"
}

_automation_temp_prune_watchdog_events() {
  local directory="${1:?directory required}" record count=0
  [[ -d "$directory" && ! -L "$directory" ]] || return 0
  while IFS= read -r record; do
    [[ -n "$record" ]] || continue
    count=$((count + 1))
    if (( count > 20 )); then
      case "$record" in
        "$directory"/watchdog-event-*.env) rm -f -- "$record" 2>/dev/null || true ;;
      esac
    fi
  done < <(
    find -P "$directory" -mindepth 1 -maxdepth 1 -type f -name 'watchdog-event-*.env' \
      -printf '%T@ %p\n' 2>/dev/null | sort -nr | sed 's/^[^ ]* //'
  )
}

_automation_temp_persist_watchdog_event() {
  local owner_pid="${1:?owner pid required}" owner_start="${2:?owner start required}" boot_id="${3:?boot id required}"
  local session="${4:?session required}" reason="${5:?reason required}" check_rc="${6:?check rc required}" failure_streak="${7:-0}"
  local directory safe_directory now stamp basename tmp final
  now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  basename="watchdog-event-${stamp}-${owner_pid}-$$.env"
  for directory in \
    "$AUTOMATION_TEMP_BASE/watchdog-events" \
    "$AUTOMATION_TEMP_REPO_REALPATH/artifacts/temp_inode_watchdog_events"; do
    safe_directory="$(_automation_temp_watchdog_event_directory_is_safe "$directory" 2>/dev/null)" || continue
    tmp="$safe_directory/.${basename}.tmp.$RANDOM"
    final="$safe_directory/$basename"
    umask 077
    if {
      printf 'schema_version=2\n'
      printf 'detected_at=%s\n' "$now"
      printf 'repository_realpath=%s\n' "$AUTOMATION_TEMP_REPO_REALPATH"
      printf 'session_root=%s\n' "$session"
      printf 'owner_pid=%s\n' "$owner_pid"
      printf 'owner_start_ticks=%s\n' "$owner_start"
      printf 'boot_id=%s\n' "$boot_id"
      printf 'reason=%s\n' "$reason"
      printf 'exit_code=%s\n' "$check_rc"
      printf 'consecutive_measurement_failures=%s\n' "$failure_streak"
      printf 'action=term_exact_owner_only\n'
    } > "$tmp" 2>/dev/null; then
      chmod 0600 "$tmp" 2>/dev/null || true
      mv -f -- "$tmp" "$final" 2>/dev/null || rm -f -- "$tmp" 2>/dev/null || true
    else
      rm -f -- "$tmp" 2>/dev/null || true
    fi
    _automation_temp_prune_watchdog_events "$safe_directory"
  done
}

_automation_temp_watchdog_loop() {
  local owner_pid="${1:?owner pid required}" owner_start="${2:?owner start required}" boot_id="${3:?boot id required}"
  local session="${4:?session required}" controller="${5:?controller required}" created_epoch="${6:?created epoch required}" created_iso="${7:?created iso required}"
  local breach_file="$session/capacity-breach.env" check_rc measurement_failure_streak=0 reason
  set +Eeuo pipefail
  trap '' HUP
  while _automation_temp_exact_owner_alive "$owner_pid" "$owner_start" "$boot_id"; do
    _automation_temp_update_heartbeat "$session" "$controller" "$owner_pid" "$owner_start" "$boot_id" "$created_epoch" "$created_iso" || true
    automation_temp_inode_check_capacity watchdog
    check_rc=$?
    if [[ "$check_rc" == 44 ]]; then
      measurement_failure_streak=$((measurement_failure_streak + 1))
      _automation_temp_log "watchdog_measurement_retry consecutive_failures=$measurement_failure_streak max_failures=$AUTOMATION_TEMP_WATCHDOG_MAX_CONSECUTIVE_MEASUREMENT_FAILURES"
      if (( measurement_failure_streak < AUTOMATION_TEMP_WATCHDOG_MAX_CONSECUTIVE_MEASUREMENT_FAILURES )); then
        sleep "$AUTOMATION_CAPACITY_CHECK_INTERVAL_SECONDS"
        continue
      fi
      reason=measurement_unavailable
    elif [[ "$check_rc" != 0 ]]; then
      measurement_failure_streak=0
      reason=capacity_check_failed
    else
      measurement_failure_streak=0
      sleep "$AUTOMATION_CAPACITY_CHECK_INTERVAL_SECONDS"
      continue
    fi

    {
      printf 'schema_version=2\n'
      printf 'reason=%s\n' "$reason"
      printf 'exit_code=%s\n' "$check_rc"
      printf 'consecutive_measurement_failures=%s\n' "$measurement_failure_streak"
      printf 'detected_at=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
      printf 'owner_pid=%s\n' "$owner_pid"
      printf 'action=term_exact_owner_only\n'
    } > "$breach_file"
    chmod 0600 "$breach_file" 2>/dev/null || true
    _automation_temp_persist_watchdog_event \
      "$owner_pid" "$owner_start" "$boot_id" "$session" "$reason" "$check_rc" "$measurement_failure_streak"
    if _automation_temp_exact_owner_alive "$owner_pid" "$owner_start" "$boot_id"; then
      kill -TERM "$owner_pid" 2>/dev/null || true
    fi
    break
  done
  if ! _automation_temp_exact_owner_alive "$owner_pid" "$owner_start" "$boot_id"; then
    _automation_temp_safe_remove_session "$session" dead_only >/dev/null 2>&1 || true
  fi
}

automation_temp_inode_bootstrap() {
  local controller_slug="${1:-controller}" owner_start boot_id created_epoch created_iso timestamp session watchdog_pid
  automation_temp_inode_configure || return 2
  [[ "$AUTOMATION_TEMP_INODE_SAFETY_ENABLED" == 1 ]] || {
    _automation_temp_log 'disabled_by_configuration'
    return 0
  }

  controller_slug="${controller_slug//[^A-Za-z0-9._-]/-}"
  [[ -n "$controller_slug" ]] || controller_slug=controller

  if [[ "${AUTOMATION_TEMP_INODE_SAFETY_BOOTSTRAPPED:-0}" == 1 && "${AUTOMATION_TEMP_OWNER_PID:-}" == "$$" && -d "${AUTOMATION_TEMP_SESSION_ROOT:-}" ]]; then
    automation_temp_inode_check_capacity bootstrap_reuse
    return $?
  fi

  # A child controller intentionally discards inherited session ownership while retaining the managed base configuration.
  unset AUTOMATION_TEMP_INODE_SAFETY_BOOTSTRAPPED AUTOMATION_TEMP_SESSION_ROOT AUTOMATION_RUN_TMPDIR
  unset AUTOMATION_TEMP_WATCHDOG_PID AUTOMATION_TEMP_OWNER_PID AUTOMATION_TEMP_OWNER_START_TICKS

  _automation_temp_prepare_base || return 2
  automation_temp_inode_recover_stale apply "$AUTOMATION_TEMP_STALE_SECONDS" || return 2
  automation_temp_inode_check_capacity startup_preflight || return $?

  owner_start="$(_automation_temp_proc_start_ticks "$$")" || { _automation_temp_error 'cannot read controller process start time'; return 2; }
  boot_id="$(_automation_temp_boot_id)" || { _automation_temp_error 'cannot read boot ID'; return 2; }
  created_epoch="$(date -u +%s)"
  created_iso="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  session="$(mktemp -d "$AUTOMATION_TEMP_SESSIONS_ROOT/${_AUTOMATION_TEMP_SESSION_PREFIX}${controller_slug}.${timestamp}.$$.XXXXXXXX")" || {
    _automation_temp_error 'cannot create controller temp session'
    return 2
  }
  chmod 0700 "$session" || { rm -rf -- "$session"; return 2; }
  mkdir -m 0700 -- "$session/tmp" || { rm -rf -- "$session"; return 2; }
  _automation_temp_write_marker "$session" "$controller_slug" "$$" "$owner_start" "$boot_id" "$created_epoch" "$created_iso" "$created_epoch" "$created_iso" || {
    rm -rf -- "$session"
    return 2
  }

  AUTOMATION_TEMP_SESSION_ROOT="$session"
  AUTOMATION_RUN_TMPDIR="$session/tmp"
  AUTOMATION_TEMP_OWNER_PID="$$"
  AUTOMATION_TEMP_OWNER_START_TICKS="$owner_start"
  TMPDIR="$AUTOMATION_RUN_TMPDIR"
  TMP="$AUTOMATION_RUN_TMPDIR"
  TEMP="$AUTOMATION_RUN_TMPDIR"
  AUTOMATION_TEMP_INODE_SAFETY_BOOTSTRAPPED=1
  export AUTOMATION_TEMP_SESSION_ROOT AUTOMATION_RUN_TMPDIR AUTOMATION_TEMP_OWNER_PID
  export AUTOMATION_TEMP_OWNER_START_TICKS AUTOMATION_TEMP_INODE_SAFETY_BOOTSTRAPPED TMPDIR TMP TEMP

  automation_temp_inode_check_capacity post_session_creation || {
    _automation_temp_safe_remove_session "$session" current_owner >/dev/null 2>&1 || true
    return 2
  }

  (
    _automation_temp_watchdog_loop "$$" "$owner_start" "$boot_id" "$session" "$controller_slug" "$created_epoch" "$created_iso"
  ) >> "$session/watchdog.log" 2>&1 &
  watchdog_pid=$!
  disown "$watchdog_pid" 2>/dev/null || true
  AUTOMATION_TEMP_WATCHDOG_PID="$watchdog_pid"
  export AUTOMATION_TEMP_WATCHDOG_PID

  _automation_temp_log "session_started controller=$controller_slug base=$AUTOMATION_TEMP_BASE session=$session owner_pid=$$ watchdog_pid=$watchdog_pid min_free_kib=$AUTOMATION_MIN_FREE_KIB min_free_inodes=$AUTOMATION_MIN_FREE_INODES min_free_inode_percent=$AUTOMATION_MIN_FREE_INODE_PERCENT max_run_inodes=$AUTOMATION_MAX_RUN_TEMP_INODES max_run_kib=$AUTOMATION_MAX_RUN_TEMP_KIB"
}

automation_temp_inode_cleanup() {
  local session="${AUTOMATION_TEMP_SESSION_ROOT:-}" watchdog="${AUTOMATION_TEMP_WATCHDOG_PID:-}"
  [[ -n "$session" && -d "$session" ]] || return 0
  if [[ "$watchdog" =~ ^[1-9][0-9]*$ ]]; then
    kill -TERM "$watchdog" 2>/dev/null || true
    wait "$watchdog" 2>/dev/null || true
  fi
  _automation_temp_safe_remove_session "$session" current_owner
  unset AUTOMATION_TEMP_INODE_SAFETY_BOOTSTRAPPED AUTOMATION_TEMP_SESSION_ROOT AUTOMATION_RUN_TMPDIR
  unset AUTOMATION_TEMP_WATCHDOG_PID AUTOMATION_TEMP_OWNER_PID AUTOMATION_TEMP_OWNER_START_TICKS
}
