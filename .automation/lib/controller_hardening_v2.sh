#!/usr/bin/env bash
# Shared fail-closed helpers for the second run-controller hardening wave.
# This file is sourced only by Bash controllers.

if [[ -z "${BASH_VERSION:-}" ]]; then
  printf 'ERROR: controller_hardening_v2.sh requires Bash.\n' >&2
  return 2 2>/dev/null || exit 2
fi

automation_v2_now_utc() {
  date -u +%Y-%m-%dT%H:%M:%SZ
}

automation_v2_sha256_file() {
  local file=${1:?file is required}
  sha256sum -- "$file" | awk '{print $1}'
}

automation_v2_parse_duration_seconds() {
  local raw=${1:?duration is required}
  local number unit
  if [[ "$raw" =~ ^([1-9][0-9]*)([smhd])$ ]]; then
    number=${BASH_REMATCH[1]}
    unit=${BASH_REMATCH[2]}
  elif [[ "$raw" =~ ^([1-9][0-9]*)$ ]]; then
    number=${BASH_REMATCH[1]}
    unit=s
  else
    printf 'ERROR: invalid duration %q; expected a positive integer with optional s, m, h, or d suffix.\n' "$raw" >&2
    return 2
  fi
  case "$unit" in
    s) printf '%s\n' "$number" ;;
    m) printf '%s\n' "$((number * 60))" ;;
    h) printf '%s\n' "$((number * 3600))" ;;
    d) printf '%s\n' "$((number * 86400))" ;;
  esac
}

automation_v2_safe_repo_path() {
  local repo=${1:?repo is required}
  local candidate=${2:?path is required}
  local must_exist=${3:-yes}
  local repo_real candidate_real
  repo_real=$(realpath -e -- "$repo") || return 2
  if [[ "$must_exist" == yes ]]; then
    candidate_real=$(realpath -e -- "$candidate") || return 2
  else
    candidate_real=$(realpath -m -- "$candidate") || return 2
  fi
  case "$candidate_real" in
    "$repo_real"|"$repo_real"/*) printf '%s\n' "$candidate_real" ;;
    *)
      printf 'ERROR: path escapes repository: %s\n' "$candidate" >&2
      return 2
      ;;
  esac
}

declare -gA AUTOMATION_V2_ENV=()

automation_v2_load_env_strict() {
  local file=${1:?env file is required}
  local line line_no=0 key value
  [[ -f "$file" && ! -L "$file" ]] || {
    printf 'ERROR: handoff must be an existing non-symlink regular file: %s\n' "$file" >&2
    return 2
  }
  AUTOMATION_V2_ENV=()
  while IFS= read -r line || [[ -n "$line" ]]; do
    line_no=$((line_no + 1))
    [[ -z "$line" || "$line" == \#* ]] && continue
    if [[ "$line" == *$'\r'* || "$line" == *$'\t'* ]]; then
      printf 'ERROR: control character in %s at line %s.\n' "$file" "$line_no" >&2
      return 2
    fi
    if [[ ! "$line" =~ ^([A-Z][A-Z0-9_]*)=(.*)$ ]]; then
      printf 'ERROR: invalid KEY=VALUE line in %s at line %s.\n' "$file" "$line_no" >&2
      return 2
    fi
    key=${BASH_REMATCH[1]}
    value=${BASH_REMATCH[2]}
    if [[ -n "${AUTOMATION_V2_ENV[$key]+present}" ]]; then
      printf 'ERROR: duplicate key %s in %s.\n' "$key" "$file" >&2
      return 2
    fi
    AUTOMATION_V2_ENV[$key]=$value
  done < "$file"
}

automation_v2_env_require() {
  local key=${1:?key is required}
  if [[ -z "${AUTOMATION_V2_ENV[$key]+present}" || -z "${AUTOMATION_V2_ENV[$key]}" ]]; then
    printf 'ERROR: required handoff key is missing or empty: %s\n' "$key" >&2
    return 2
  fi
  printf '%s\n' "${AUTOMATION_V2_ENV[$key]}"
}

automation_v2_validate_yes_no_value() {
  local key=${1:?key is required}
  local value=${2-}
  case "$value" in
    yes|no) ;;
    *)
      printf 'ERROR: %s must be exactly yes or no; got %q.\n' "$key" "$value" >&2
      return 2
      ;;
  esac
}

automation_v2_semantic_env_fingerprint_loaded() {
  local key
  {
    for key in "${!AUTOMATION_V2_ENV[@]}"; do
      case "$key" in
        HANDOVER_FINGERPRINT|WRITTEN_AT|RUN_DIR|SOURCE_RUN_DIR|CHILD_RUN_DIR|SOURCE_EVIDENCE_PATH|LOG_PATH|ARTIFACT_PATH|STARTED_AT|FINISHED_AT|UPDATED_AT|TIMESTAMP)
          continue
          ;;
        *_LOG_PATH|*_ARTIFACT_PATH|*_RUN_DIR|*_WRITTEN_AT|*_STARTED_AT|*_FINISHED_AT|*_TIMESTAMP)
          continue
          ;;
      esac
      printf '%s=%s\n' "$key" "${AUTOMATION_V2_ENV[$key]}"
    done
  } | LC_ALL=C sort | sha256sum | awk '{print $1}'
}

automation_v2_semantic_env_fingerprint() {
  local file=${1:?env file is required}
  automation_v2_load_env_strict "$file" || return
  automation_v2_semantic_env_fingerprint_loaded
}

automation_v2_write_loaded_env_atomic() {
  local file=${1:?env file is required}
  local temp key
  mkdir -p -- "$(dirname -- "$file")"
  temp=$(mktemp "${file}.tmp.XXXXXX") || return 2
  chmod 0600 "$temp"
  {
    for key in "${!AUTOMATION_V2_ENV[@]}"; do
      printf '%s=%s\n' "$key" "${AUTOMATION_V2_ENV[$key]}"
    done
  } | LC_ALL=C sort > "$temp"
  mv -f -- "$temp" "$file"
}

automation_v2_write_env_atomic() {
  local file=${1:?env file is required}
  shift
  local temp line key
  declare -A seen=()
  mkdir -p -- "$(dirname -- "$file")"
  temp=$(mktemp "${file}.tmp.XXXXXX") || return 2
  chmod 0600 "$temp"
  for line in "$@"; do
    if [[ ! "$line" =~ ^([A-Z][A-Z0-9_]*)=(.*)$ ]]; then
      rm -f -- "$temp"
      printf 'ERROR: invalid atomic env line: %q\n' "$line" >&2
      return 2
    fi
    key=${BASH_REMATCH[1]}
    if [[ -n "${seen[$key]+present}" ]]; then
      rm -f -- "$temp"
      printf 'ERROR: duplicate atomic env key: %s\n' "$key" >&2
      return 2
    fi
    seen[$key]=1
    printf '%s\n' "$line" >> "$temp"
  done
  mv -f -- "$temp" "$file"
}

automation_v2_add_or_verify_fingerprint() {
  local file=${1:?env file is required}
  local computed existing
  automation_v2_load_env_strict "$file" || return
  computed=$(automation_v2_semantic_env_fingerprint_loaded) || return
  existing=${AUTOMATION_V2_ENV[HANDOVER_FINGERPRINT]-}
  if [[ -n "$existing" && "$existing" != "$computed" ]]; then
    printf 'ERROR: handoff fingerprint mismatch for %s.\n' "$file" >&2
    return 2
  fi
  AUTOMATION_V2_ENV[HANDOVER_FINGERPRINT]=$computed
  automation_v2_write_loaded_env_atomic "$file" || return
  printf '%s\n' "$computed"
}

automation_v2_source_path_excluded() {
  local path=${1#./}
  if declare -F automation_source_path_is_excluded >/dev/null 2>&1; then
    automation_source_path_is_excluded "$path" && return 0
  fi
  case "$path" in
    artifacts|artifacts/*|node_modules|node_modules/*|dist|dist/*|coverage|coverage/*|logs|logs/*|*.log|*.zip|*.tar|*.tar.gz|*.tgz|.git|.git/*|.tmp|.tmp/*|tmp|tmp/*)
      return 0
      ;;
    .automation/*.lock|.automation/*.lock/*|.automation/runtime|.automation/runtime/*|.automation/consumed-handoffs|.automation/consumed-handoffs/*)
      return 0
      ;;
    .automation/*handover*.env|.automation/*handoff*.env|.automation/*handover*.md|.automation/*handoff*.md)
      return 0
      ;;
  esac
  return 1
}

automation_v2_source_tree_fingerprint() {
  local repo=${1:?repo is required}
  (
    cd "$repo"
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      while IFS= read -r -d '' path; do
        automation_v2_source_path_excluded "$path" && continue
        [[ -f "$path" && ! -L "$path" ]] || continue
        printf '%s\\0' "$path"
        sha256sum -- "$path"
      done < <(git ls-files -co --exclude-standard -z)
    else
      while IFS= read -r -d '' path; do
        path=${path#./}
        automation_v2_source_path_excluded "$path" && continue
        [[ -f "$path" && ! -L "$path" ]] || continue
        printf '%s\\0' "$path"
        sha256sum -- "$path"
      done < <(find . -type f -print0 | LC_ALL=C sort -z)
    fi
  ) | sha256sum | awk '{print $1}'
}

automation_v2_extract_machine_value() {
  local file=${1:?file is required}
  local key=${2:?key is required}
  local line
  line=$(grep -E "^${key}=" "$file" | tail -n 1 || true)
  [[ -n "$line" ]] || return 1
  printf '%s\n' "${line#*=}"
}

automation_v2_extract_unique_machine_value() {
  local file=${1:?file is required}
  local key=${2:?key is required}
  local count line
  [[ -f "$file" ]] || {
    printf 'ERROR: machine-readable output file does not exist: %s\n' "$file" >&2
    return 2
  }
  count=$(grep -Ec "^${key}=" "$file" || true)
  [[ "$count" == "1" ]] || {
    printf 'ERROR: expected exactly one %s= record in %s; found %s.\n' "$key" "$file" "$count" >&2
    return 2
  }
  line=$(grep -E "^${key}=" "$file")
  [[ "$line" != *$'\r'* && "$line" != *$'\t'* ]] || {
    printf 'ERROR: control character in machine-readable %s record.\n' "$key" >&2
    return 2
  }
  printf '%s\n' "${line#*=}"
}

automation_v2_atomic_copy() {
  local source=${1:?source is required}
  local destination=${2:?destination is required}
  local temp
  [[ -f "$source" && ! -L "$source" ]] || {
    printf 'ERROR: source must be a non-symlink regular file: %s\n' "$source" >&2
    return 2
  }
  mkdir -p -- "$(dirname -- "$destination")"
  temp=$(mktemp "${destination}.tmp.XXXXXX") || return 2
  cp -- "$source" "$temp" || { rm -f -- "$temp"; return 2; }
  chmod 0600 "$temp"
  mv -f -- "$temp" "$destination"
}

automation_v2_archive_run_dirs() {
  local archive=${1:?archive path is required}
  local repo=${2:?repo is required}
  shift 2
  local temp item rel
  command -v zip >/dev/null 2>&1 || return 127
  temp="${archive}.tmp.$$"
  rm -f -- "$temp"
  local -a rels=()
  for item in "$@"; do
    [[ -e "$item" ]] || continue
    item=$(automation_v2_safe_repo_path "$repo" "$item" yes) || return
    rel=${item#"$(realpath -e -- "$repo")"/}
    rels+=("$rel")
  done
  (( ${#rels[@]} > 0 )) || return 0
  (
    cd "$repo"
    zip -q -1 -r "$temp" "${rels[@]}"
  ) || { rm -f -- "$temp"; return 2; }
  mv -f -- "$temp" "$archive"
}

automation_v2_validate_child_script() {
  local repo=${1:?repo is required}
  local script=${2:?script is required}
  local resolved
  resolved=$(automation_v2_safe_repo_path "$repo" "$script" yes) || return
  [[ -f "$resolved" && ! -L "$resolved" && -x "$resolved" ]] || {
    printf 'ERROR: child controller must be a non-symlink executable regular file: %s\n' "$script" >&2
    return 2
  }
  bash -n -- "$resolved" || {
    printf 'ERROR: child controller failed bash -n: %s\n' "$resolved" >&2
    return 2
  }
}

automation_v2_process_state() {
  local pid=${1:-}
  local stat_line remainder state
  [[ "$pid" =~ ^[1-9][0-9]*$ && -r "/proc/$pid/stat" ]] || return 1
  IFS= read -r stat_line < "/proc/$pid/stat" || return 1
  [[ "$stat_line" == *') '* ]] || return 1
  remainder=${stat_line##*) }
  state=${remainder%% *}
  [[ -n "$state" ]] || return 1
  printf '%s\n' "$state"
}

automation_v2_process_alive() {
  local pid=${1:-}
  local state
  [[ "$pid" =~ ^[1-9][0-9]*$ ]] || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  state=$(automation_v2_process_state "$pid" 2>/dev/null || true)
  case "$state" in
    Z|X) return 1 ;;
    *) return 0 ;;
  esac
}

automation_v2_wait_for_pid_exit() {
  local pid=${1:-}
  local timeout_seconds=${2:-10}
  local i iterations
  [[ "$pid" =~ ^[1-9][0-9]*$ ]] || return 0
  [[ "$timeout_seconds" =~ ^[0-9]+$ ]] || {
    printf 'ERROR: wait timeout must be a non-negative integer; got %q.\n' "$timeout_seconds" >&2
    return 2
  }
  iterations=$((timeout_seconds * 10))
  for ((i = 0; i <= iterations; i++)); do
    automation_v2_process_alive "$pid" || return 0
    (( i < iterations )) && sleep 0.1
  done
  return 1
}

automation_v2_claim_env_file_atomic() {
  local file=${1:?env file is required}
  shift
  local claim
  mkdir -p -- "$(dirname -- "$file")"
  claim="${file}.claim.$$.$RANDOM"
  rm -f -- "$claim"
  automation_v2_write_env_atomic "$claim" "$@" || {
    rm -f -- "$claim"
    return 2
  }
  if ln -- "$claim" "$file" 2>/dev/null; then
    rm -f -- "$claim"
    return 0
  fi
  rm -f -- "$claim"
  return 1
}

automation_v2_validate_parent_lock_loaded() {
  local expected_controller=${1:?expected controller is required}
  local expected_repository=${2:?expected repository is required}
  local expected_repo_real=${3:?expected repository realpath is required}
  local expected_script_real=${4:?expected script realpath is required}
  local expected_pid=${5:-}
  local key run_dir child_pid child_kind child_script child_command
  local allowed=',LOCK_SCHEMA_VERSION,CONTROLLER,CONTROLLER_PID,REPOSITORY,REPO_REALPATH,SCRIPT_REALPATH,RUN_DIR,HEARTBEAT_SOURCE,HEARTBEAT_EPOCH,HEARTBEAT_AT,ACTIVE_CHILD_PID,ACTIVE_CHILD_KIND,ACTIVE_CHILD_SCRIPT,ACTIVE_CHILD_COMMAND,'

  for key in "${!AUTOMATION_V2_ENV[@]}"; do
    [[ "$allowed" == *",$key,"* ]] || {
      printf 'ERROR: unsupported parent-lock key: %s\n' "$key" >&2
      return 2
    }
  done
  [[ "${AUTOMATION_V2_ENV[LOCK_SCHEMA_VERSION]-}" == 1 ]] || {
    printf 'ERROR: unsupported parent-lock schema.\n' >&2
    return 2
  }
  [[ "${AUTOMATION_V2_ENV[CONTROLLER]-}" == "$expected_controller" ]] || {
    printf 'ERROR: parent-lock controller mismatch.\n' >&2
    return 2
  }
  [[ "${AUTOMATION_V2_ENV[REPOSITORY]-}" == "$expected_repository" ]] || {
    printf 'ERROR: parent-lock repository name mismatch.\n' >&2
    return 2
  }
  [[ "${AUTOMATION_V2_ENV[REPO_REALPATH]-}" == "$expected_repo_real" ]] || {
    printf 'ERROR: parent-lock repository realpath mismatch.\n' >&2
    return 2
  }
  [[ "${AUTOMATION_V2_ENV[SCRIPT_REALPATH]-}" == "$expected_script_real" ]] || {
    printf 'ERROR: parent-lock script realpath mismatch.\n' >&2
    return 2
  }
  [[ "${AUTOMATION_V2_ENV[CONTROLLER_PID]-}" =~ ^[1-9][0-9]*$ ]] || {
    printf 'ERROR: parent-lock controller PID is invalid.\n' >&2
    return 2
  }
  if [[ -n "$expected_pid" && "${AUTOMATION_V2_ENV[CONTROLLER_PID]}" != "$expected_pid" ]]; then
    printf 'ERROR: parent-lock owner PID mismatch.\n' >&2
    return 2
  fi
  [[ "${AUTOMATION_V2_ENV[HEARTBEAT_SOURCE]-}" == file_mtime ]] || {
    printf 'ERROR: parent-lock heartbeat source must be file_mtime.\n' >&2
    return 2
  }
  [[ "${AUTOMATION_V2_ENV[HEARTBEAT_EPOCH]-}" =~ ^[0-9]+$ ]] || {
    printf 'ERROR: parent-lock heartbeat epoch is invalid.\n' >&2
    return 2
  }
  [[ -n "${AUTOMATION_V2_ENV[HEARTBEAT_AT]-}" ]] || {
    printf 'ERROR: parent-lock heartbeat timestamp is missing.\n' >&2
    return 2
  }

  run_dir=${AUTOMATION_V2_ENV[RUN_DIR]-}
  if [[ -n "$run_dir" ]]; then
    automation_v2_safe_repo_path "$expected_repo_real" "$run_dir" no >/dev/null || return 2
  fi

  child_pid=${AUTOMATION_V2_ENV[ACTIVE_CHILD_PID]-}
  child_kind=${AUTOMATION_V2_ENV[ACTIVE_CHILD_KIND]-}
  child_script=${AUTOMATION_V2_ENV[ACTIVE_CHILD_SCRIPT]-}
  child_command=${AUTOMATION_V2_ENV[ACTIVE_CHILD_COMMAND]-}
  if [[ -z "$child_pid" ]]; then
    [[ "$child_kind" == none && -z "$child_script" && -z "$child_command" ]] || {
      printf 'ERROR: parent-lock empty child PID has inconsistent child metadata.\n' >&2
      return 2
    }
  else
    [[ "$child_pid" =~ ^[1-9][0-9]*$ && -n "$child_kind" && "$child_kind" != none && -n "$child_script" && -n "$child_command" ]] || {
      printf 'ERROR: parent-lock active child metadata is incomplete.\n' >&2
      return 2
    }
    automation_v2_safe_repo_path "$expected_repo_real" "$child_script" yes >/dev/null || return 2
  fi
}

automation_v2_load_parent_lock_owned() {
  local file=${1:?lock file is required}
  shift
  automation_v2_load_env_strict "$file" || return 2
  automation_v2_validate_parent_lock_loaded "$@"
}

automation_v2_parent_lock_mtime_epoch() {
  local file=${1:?lock file is required}
  [[ -f "$file" && ! -L "$file" ]] || return 2
  stat -c '%Y' -- "$file"
}

automation_v2_touch_owned_parent_lock() {
  local file=${1:?lock file is required}
  shift
  local before after
  automation_v2_load_parent_lock_owned "$file" "$@" || return 2
  before=$(stat -c '%d:%i' -- "$file") || return 2
  touch -m -- "$file" || return 2
  after=$(stat -c '%d:%i' -- "$file") || return 2
  [[ "$before" == "$after" ]] || {
    printf 'ERROR: parent lock changed while its heartbeat was refreshed: %s\n' "$file" >&2
    return 2
  }
  automation_v2_load_parent_lock_owned "$file" "$@" || return 2
}

automation_v2_release_owned_parent_lock() {
  local file=${1:?lock file is required}
  shift
  automation_v2_load_parent_lock_owned "$file" "$@" || return 2
  rm -f -- "$file" || return 2
  [[ ! -e "$file" ]] || {
    printf 'ERROR: parent lock remains after owned release: %s\n' "$file" >&2
    return 2
  }
}

automation_v2_process_matches_script() {
  local pid=${1:?pid is required}
  local expected=${2:?expected script is required}
  local expected_real expected_dir cwd arg candidate cmdline_snapshot matched=1
  [[ "$pid" =~ ^[1-9][0-9]*$ && -r "/proc/$pid/cmdline" ]] || return 1
  expected_real=$(realpath -e -- "$expected" 2>/dev/null) || return 1
  expected_dir=$(dirname -- "$expected_real")
  cwd=$(readlink -f -- "/proc/$pid/cwd" 2>/dev/null || true)
  cmdline_snapshot=$(mktemp "${TMPDIR:-/tmp}/automation-v2-cmdline.XXXXXX") || return 1
  if ! cat "/proc/$pid/cmdline" > "$cmdline_snapshot" 2>/dev/null; then
    rm -f -- "$cmdline_snapshot"
    return 1
  fi
  while IFS= read -r arg; do
    [[ -n "$arg" ]] || continue
    if [[ "$arg" == /* ]]; then
      candidate=$arg
    elif [[ -e "$expected_dir/$arg" ]]; then
      candidate=$expected_dir/$arg
    elif [[ -n "$cwd" ]]; then
      candidate=$cwd/$arg
    else
      continue
    fi
    if [[ -e "$candidate" ]] && [[ "$(realpath -e -- "$candidate" 2>/dev/null || true)" == "$expected_real" ]]; then
      matched=0
      break
    fi
  done < <(tr '\0' '\n' < "$cmdline_snapshot")
  rm -f -- "$cmdline_snapshot"
  return "$matched"
}

automation_v2_terminate_process_group() {
  local pid=${1:-}
  local grace=${2:-10}
  [[ "$pid" =~ ^[1-9][0-9]*$ ]] || return 0
  [[ "$grace" =~ ^[0-9]+$ ]] || {
    printf 'ERROR: termination grace must be a non-negative integer; got %q.\n' "$grace" >&2
    return 2
  }
  automation_v2_process_alive "$pid" || return 0
  kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
  automation_v2_wait_for_pid_exit "$pid" "$grace" && return 0
  kill -KILL -- "-$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
  automation_v2_wait_for_pid_exit "$pid" 10 && return 0
  printf 'ERROR: verified process remains alive after TERM and KILL: %s\n' "$pid" >&2
  return 2
}

automation_v2_zip_with_timeout() {
  local timeout_seconds=${1:?timeout seconds are required}
  local destination=${2:?destination is required}
  local working_dir=${3:?working directory is required}
  shift 3
  command -v zip >/dev/null 2>&1 || return 127
  (
    cd "$working_dir"
    timeout --signal=TERM --kill-after=10s "$timeout_seconds" zip -q -1 -r "$destination" "$@"
  )
}
