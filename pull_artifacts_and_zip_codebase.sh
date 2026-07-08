#!/usr/bin/env bash
# Source-safe artifact puller. Reads .env SSH settings; no remote host default is used.

pa_usage() {
  cat <<'USAGE'
Usage: ./pull_artifacts_and_zip_codebase.sh [--remote-codebase]

Default laptop flow:
  1. Read .env for SSH_HOST, SSH_USER, SSH_PASSWORD, and REMOTE_REPO.
  2. Pull remote repo-root artifacts.zip from the server.
  3. Save it locally as next numbered artifacts zip, e.g. artifacts12.zip.
  4. Calls bash ./zip_codebase.sh to create the local numbered codebase zip.

Required .env keys:
  SSH_HOST=88.99.165.82
  SSH_USER=dev
  SSH_PASSWORD=...
  REMOTE_REPO=/home/dev/app_testing/<repo-name>

Optional:
  REMOTE_ARTIFACT=/custom/path/artifacts.zip
  ENV_FILE=/custom/path/.env

No automation.config.sh is used by this script.
No remote host default is used; SSH_HOST must come from .env or the environment.
pv is used for a transfer progress bar when installed.
USAGE
}

pa_have() { command -v "$1" >/dev/null 2>&1; }
pa_fail() { printf 'ERROR: %s\n' "$*" >&2; return 1; }

pa_read_env_value() {
  local key="$1" env_file="$2" line value
  [ -f "$env_file" ] || return 1
  line="$(grep -E "^[[:space:]]*${key}=" "$env_file" | tail -n 1)" || return 1
  [ -n "$line" ] || return 1
  value="${line#*=}"
  value="${value%$'\r'}"
  value="${value#\"}"; value="${value%\"}"
  value="${value#\'}"; value="${value%\'}"
  printf '%s\n' "$value"
}

pa_get_config() {
  local key="$1" env_file="$2" value
  value="${!key:-}"
  if [ -n "$value" ]; then
    printf '%s\n' "$value"
    return 0
  fi
  pa_read_env_value "$key" "$env_file"
}

pa_shell_quote() { printf '%q' "$1"; }

pa_next_numbered_zip() {
  local prefix="$1" max=0 f b rest generation n
  shopt -s nullglob
  for f in ./${prefix}*.zip; do
    b="${f#./}"
    rest="${b#"$prefix"}"
    [ "$rest" != "$b" ] || continue
    case "$rest" in *.zip) ;; *) continue ;; esac
    generation="${rest%.zip}"
    generation="${generation%%\(*}"
    case "$generation" in '') n=0 ;; *[!0-9]*) continue ;; *) n=$((10#$generation)) ;; esac
    [ "$n" -gt "$max" ] && max="$n"
  done
  shopt -u nullglob
  printf '%s\n' "$((max + 1))"
}

pa_ssh() {
  SSHPASS="$SSH_PASSWORD" sshpass -e ssh \
    -o StrictHostKeyChecking=accept-new \
    -o BatchMode=no \
    -o ConnectTimeout=20 \
    "$SSH_USER@$SSH_HOST" "$@"
}

pa_scp() {
  SSHPASS="$SSH_PASSWORD" sshpass -e scp \
    -p \
    -o StrictHostKeyChecking=accept-new \
    -o BatchMode=no \
    -o ConnectTimeout=20 \
    "$@"
}

# Remote read command contract: cat -- "$REMOTE_PATH"
pa_stream_remote_file() {
  local remote_path="$1" local_path="$2" quoted remote_size download_progress remote_spec
  quoted="$(pa_shell_quote "$remote_path")" || return 1
  remote_size="$(pa_ssh "REMOTE_PATH=$quoted; stat -c %s -- \"\$REMOTE_PATH\"" 2>/dev/null)" || return 1
  case "$remote_size" in ''|*[!0-9]*) return 1 ;; esac

  if pa_have pv; then
    download_progress=pv
    printf 'download_progress=pv size_bytes=%s\n' "$remote_size"
    SSHPASS="$SSH_PASSWORD" sshpass -e ssh \
      -o StrictHostKeyChecking=accept-new \
      -o BatchMode=no \
      -o ConnectTimeout=20 \
      "$SSH_USER@$SSH_HOST" "REMOTE_PATH=$quoted; cat -- \"\$REMOTE_PATH\"" \
      | pv -s "$remote_size" > "$local_path"
    return "${PIPESTATUS[0]}"
  fi

  download_progress=scp
  printf 'download_progress=scp size_bytes=%s\n' "$remote_size"
  remote_spec="${SSH_USER}@${SSH_HOST}:$remote_path"
  pa_scp "$remote_spec" "$local_path"
}

pa_main() {
  local remote_codebase=0 SCRIPT_DIR LOCAL_ROOT ENV_FILE repo_name remote_artifact artifact_number local_artifact tmp_artifact latest remote_codebase_path local_remote tmp_remote quoted
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --remote-codebase) remote_codebase=1; shift ;;
      -h|--help) pa_usage; return 0 ;;
      *) pa_usage >&2; pa_fail "unknown option: $1"; return 2 ;;
    esac
  done

  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd -P)" || return 1
  LOCAL_ROOT="$SCRIPT_DIR"
  ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/.env}"
  cd "$LOCAL_ROOT" || return 1
  repo_name="$(basename "$LOCAL_ROOT")"

  [ -x "$LOCAL_ROOT/zip_codebase.sh" ] || { pa_fail "missing executable ./zip_codebase.sh"; return 1; }
  pa_have sshpass || { pa_fail "required command not found: sshpass"; return 127; }
  pa_have ssh || { pa_fail "required command not found: ssh"; return 127; }
  pa_have scp || { pa_fail "required command not found: scp"; return 127; }
  pa_have grep || { pa_fail "required command not found: grep"; return 127; }

  SSH_HOST="$(pa_get_config SSH_HOST "$ENV_FILE")" || { pa_fail "Missing SSH_HOST in .env"; return 2; }
  SSH_USER="$(pa_get_config SSH_USER "$ENV_FILE")" || { pa_fail "Missing SSH_USER in .env"; return 2; }
  SSH_PASSWORD="$(pa_get_config SSH_PASSWORD "$ENV_FILE")" || { pa_fail "Missing SSH_PASSWORD in .env"; return 2; }
  REMOTE_REPO="$(pa_get_config REMOTE_REPO "$ENV_FILE")" || { pa_fail "Missing REMOTE_REPO in .env"; return 2; }
  REMOTE_REPO="${REMOTE_REPO%/}"
  REMOTE_ARTIFACT="$(pa_get_config REMOTE_ARTIFACT "$ENV_FILE" 2>/dev/null)" || REMOTE_ARTIFACT="${REMOTE_REPO}/artifacts.zip"

  quoted="$(pa_shell_quote "$REMOTE_ARTIFACT")" || return 1
  if ! pa_ssh "REMOTE_PATH=$quoted; test -s \"\$REMOTE_PATH\"" >/dev/null 2>&1; then
    pa_fail "remote artifacts.zip not found or empty: ${SSH_USER}@${SSH_HOST}:${REMOTE_ARTIFACT}"
    return 1
  fi

  artifact_number="$(pa_next_numbered_zip artifacts)" || return 1
  local_artifact="artifacts${artifact_number}.zip"
  tmp_artifact=".${local_artifact}.tmp.$$"
  rm -f "$tmp_artifact"
  printf 'downloading_artifacts=%s@%s:%s\n' "$SSH_USER" "$SSH_HOST" "$REMOTE_ARTIFACT"
  if ! pa_stream_remote_file "$REMOTE_ARTIFACT" "$tmp_artifact"; then
    rm -f "$tmp_artifact"
    pa_fail "artifact download failed"
    return 1
  fi
  if ! mv "$tmp_artifact" "$local_artifact"; then
    rm -f "$tmp_artifact"
    pa_fail "could not publish local artifact: $local_artifact"
    return 1
  fi
  printf 'downloaded_artifacts=%s\n' "$LOCAL_ROOT/$local_artifact"

  if [ "$remote_codebase" = "1" ]; then
    quoted="$(pa_shell_quote "$REMOTE_REPO")" || return 1
    latest="$(pa_ssh "cd $quoted && ls -1 ${repo_name}[0-9]*.zip 2>/dev/null | sort -V | tail -n 1" 2>/dev/null)" || latest=""
    if [ -z "$latest" ]; then
      pa_fail "--remote-codebase requested but no remote ${repo_name}N.zip was found in $REMOTE_REPO"
      return 1
    fi
    remote_codebase_path="${REMOTE_REPO}/${latest}"
    local_remote="remote-${latest}"
    tmp_remote=".${local_remote}.tmp.$$"
    rm -f "$tmp_remote"
    printf 'downloading_remote_codebase=%s@%s:%s\n' "$SSH_USER" "$SSH_HOST" "$remote_codebase_path"
    if ! pa_stream_remote_file "$remote_codebase_path" "$tmp_remote"; then
      rm -f "$tmp_remote"
      pa_fail "remote codebase download failed"
      return 1
    fi
    mv "$tmp_remote" "$local_remote" || { rm -f "$tmp_remote"; pa_fail "could not publish remote codebase"; return 1; }
    printf 'downloaded_remote_codebase=%s\n' "$LOCAL_ROOT/$local_remote"
  fi

  printf 'creating_local_codebase_zip=bash ./zip_codebase.sh\n'
  bash ./zip_codebase.sh
  return $?
}

pa_main "$@"
