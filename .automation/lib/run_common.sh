#!/usr/bin/env bash
# Common helpers for standardized repo automation run scripts.
# shellcheck shell=bash

if [[ "${BASH_VERSION:-}" == "" ]]; then
  echo "ERROR: bash is required" >&2
  exit 127
fi

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
  awk -F= -v k="$key" '$1 == k { sub(/^[^=]*=/, ""); print; found=1; exit } END { exit found ? 0 : 1 }' "$file"
}

automation_pid_alive() {
  local pid="${1:-}"
  [[ "$pid" =~ ^[0-9]+$ ]] || return 1
  kill -0 "$pid" >/dev/null 2>&1
}

automation_pid_command_matches_script() {
  local pid="$1" script_name="$2" cmdline
  [[ -r "/proc/$pid/cmdline" ]] || return 1
  cmdline="$(tr '\0' ' ' < "/proc/$pid/cmdline")"
  [[ "$cmdline" == *"$script_name"* ]]
}

automation_write_lock_file() {
  local heartbeat_epoch tmp command_text
  heartbeat_epoch="$(automation_now_epoch)"
  tmp="${AUTOMATION_LOCK_FILE}.tmp.$$"
  command_text="${AUTOMATION_SCRIPT_COMMAND:-$AUTOMATION_SCRIPT_NAME}"
  {
    printf 'script=%s\n' "$AUTOMATION_SCRIPT_NAME"
    printf 'repo_path=%s\n' "$AUTOMATION_REPO_ROOT"
    printf 'pid=%s\n' "$AUTOMATION_CONTROLLER_PID"
    printf 'started_at=%s\n' "$AUTOMATION_STARTED_AT"
    printf 'heartbeat_at=%s\n' "$heartbeat_epoch"
    printf 'heartbeat_iso=%s\n' "$(automation_now_iso)"
    printf 'artifacts_dir=%s\n' "${AUTOMATION_RUN_DIR:-}"
    printf 'host=%s\n' "$(hostname 2>/dev/null || printf unknown)"
    printf 'user=%s\n' "$(id -un 2>/dev/null || printf unknown)"
    printf 'command=%s\n' "$command_text"
  } > "$tmp"
  mv "$tmp" "$AUTOMATION_LOCK_FILE"
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
  local pid
  pid="$(automation_lock_value "$file" pid || true)"
  if automation_pid_alive "$pid"; then
    echo "PID_STATUS=alive"
  else
    echo "PID_STATUS=dead"
  fi
}

automation_force_unlock() {
  local file="$1" expected_script="$2" expected_repo="$3" pid repo script
  if [[ ! -f "$file" ]]; then
    echo "FORCE_UNLOCK=no_lock"
    return 0
  fi
  pid="$(automation_lock_value "$file" pid || true)"
  repo="$(automation_lock_value "$file" repo_path || true)"
  script="$(automation_lock_value "$file" script || true)"
  [[ "$repo" == "$expected_repo" ]] || automation_die "refusing force-unlock: lock repo mismatch: $repo" 20
  [[ "$script" == "$expected_script" ]] || automation_die "refusing force-unlock: lock script mismatch: $script" 20
  if automation_pid_alive "$pid"; then
    automation_pid_command_matches_script "$pid" "$expected_script" || automation_die "refusing force-unlock: cannot verify PID command for $pid" 20
    kill -9 "$pid" || true
    local waited=0
    while automation_pid_alive "$pid" && (( waited < 10 )); do
      sleep 1
      waited=$((waited + 1))
    done
    automation_pid_alive "$pid" && automation_die "force-unlock failed: PID still alive: $pid" 21
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
      automation_pid_command_matches_script "$pid" "$script_name" || automation_die "refusing lock auto-unlock: cannot verify PID command for $pid" 24
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

  automation_write_lock_file
}

automation_start_heartbeat() {
  local parent_pid="$AUTOMATION_CONTROLLER_PID"
  (
    while kill -0 "$parent_pid" >/dev/null 2>&1; do
      automation_write_lock_file >/dev/null 2>&1 || true
      sleep "${AUTOMATION_LOCK_HEARTBEAT_SECONDS:-60}"
    done
  ) &
  AUTOMATION_HEARTBEAT_PID="$!"
}

automation_release_lock() {
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

automation_create_run_dir() {
  local slug="$1" stamp
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
  local label="$1" timeout_seconds="$2" out_file="$3" rc command_text
  shift 3
  (( $# > 0 )) || {
    automation_log "command_refused label=$label reason=empty_argv"
    return 2
  }
  mkdir -p "$(dirname "$out_file")"
  command_text="$(automation_quote_argv "$@")"
  automation_log "command_start label=$label timeout=${timeout_seconds}s command=$command_text"
  set +e
  timeout --foreground "${timeout_seconds}s" "$@" > "$out_file" 2>&1
  rc=$?
  set -e
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
    .git|.git/*|artifacts|artifacts/*|node_modules|node_modules/*|dist|dist/*|coverage|coverage/*|tmp|tmp/*|.tmp|.tmp/*|.cache|.cache/*|\
    .automation/locks|.automation/locks/*|.automation/corrupt|.automation/corrupt/*|\
    .automation/paper-mode-to-autonomous-implementation.env|.automation/paper-mode-handover.env|\
    .automation/autonomous-implementation-handover.env|.automation/autonomous-implementation-handover.md|\
    .automation/bugfix-to-autonomous-implementation.env|.automation/bugfix-to-autonomous-implementation.md|\
    .automation/bugfix-mode-handover.env|.codex_current_artifact_dir|artifacts.zip|\
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
  automation_log "command_start label=$label timeout=${timeout_seconds}s command=$command_text"
  set +e
  timeout --foreground "${timeout_seconds}s" bash -lc "$command_text" > "$out_file" 2>&1
  rc=$?
  set -e
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
  set +e
  if [[ "${AUTOMATION_CODEX_STREAM_LOGS:-1}" == "1" ]]; then
    timeout --foreground "${timeout_seconds}s" "${cmd[@]}" < /dev/null 2>&1 | tee "$log_file"
    rc=${PIPESTATUS[0]}
  else
    timeout --foreground "${timeout_seconds}s" "${cmd[@]}" < /dev/null > "$log_file" 2>&1
    rc=$?
  fi
  set -e
  if [[ "$rc" -ne 0 && -n "$fallback_model" ]]; then
    automation_log "codex_retry_with_fallback initial_exit=$rc fallback_model=$fallback_model"
    local -a fallback_cmd=("${AUTOMATION_CODEX_BIN:-codex}" exec -C "$AUTOMATION_REPO_ROOT" --sandbox "${AUTOMATION_CODEX_SANDBOX:-danger-full-access}")
    if [[ "$fallback_model" != "cli-default" ]]; then
      fallback_cmd+=(-m "$fallback_model")
    fi
    fallback_cmd+=("$(cat "$prompt_file")")
    set +e
    if [[ "${AUTOMATION_CODEX_STREAM_LOGS:-1}" == "1" ]]; then
      timeout --foreground "${timeout_seconds}s" "${fallback_cmd[@]}" < /dev/null 2>&1 | tee -a "$log_file"
      rc=${PIPESTATUS[0]}
    else
      timeout --foreground "${timeout_seconds}s" "${fallback_cmd[@]}" < /dev/null >> "$log_file" 2>&1
      rc=$?
    fi
    set -e
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

automation_build_artifacts_zip() {
  local run_dir="$1" root="$2" zip_tmp rel
  [[ -d "$run_dir" ]] || return 0
  automation_require_command zip
  rel="${run_dir#$root/}"
  zip_tmp="$root/artifacts.zip.tmp.$$"
  rm -f "$zip_tmp"
  (cd "$root" && zip -q -r "$zip_tmp" "$rel")
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
