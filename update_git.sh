#!/usr/bin/env bash
set -euo pipefail

### User Configuration
# GitHub username used for auth and remote URL.
GITHUB_USER="panella87"
# Repo owner on GitHub.
REPO_OWNER="panella87"
# Repository name on GitHub.
REPO_NAME="betting-win-surebet"
# Remote name used for pull/push operations.
REMOTE_NAME="origin"

### Runtime Defaults
# Optional target directory for clone.
TARGET_DIR=""
# Default action when no flag is provided.
ACTION="pull"

### Environment Loading
# Load optional .env from script directory. Only GITHUB_TOKEN is expected.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi


if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  if [[ -f "$ENV_FILE" ]]; then
    echo "Info: GITHUB_TOKEN is not set in $ENV_FILE. Continuing with other auth methods." >&2
  else
    echo "Info: $ENV_FILE not found. Continuing with other auth methods." >&2
  fi
fi

### Helpers
print_help() {
  cat <<USAGE
Usage:
  $(basename "$0") [--help] [--pull] [--push] [--clone OWNER/REPO [TARGET_DIR]]

Options:
  --help    Show this help message
  --pull    Set remote/auth config and run git pull --ff-only (default)
  --push    Set remote/auth config and run git push for current branch
  --clone   Clone OWNER/REPO using configured user, then set local credential username

Environment (.env supported):
  GITHUB_TOKEN  Optional PAT used for non-interactive HTTPS auth
USAGE
}

require_value() {
  local key="$1"
  local val="$2"
  if [[ -z "$val" ]]; then
    echo "Error: missing required value for $key" >&2
    exit 1
  fi
}

auth_header() {
  if [[ -n "${GITHUB_TOKEN:-}" ]]; then
    printf 'AUTHORIZATION: basic %s' "$(printf '%s' "${GITHUB_USER}:${GITHUB_TOKEN}" | base64 | tr -d '\n')"
  fi
}

run_git_with_auth() {
  if [[ -n "${GITHUB_TOKEN:-}" ]]; then
    local hdr
    hdr="$(auth_header)"
    if git -c http.https://github.com/.extraheader="$hdr" "$@"; then
      return 0
    fi

    if [[ "${1:-}" == "clone" ]]; then
      echo "Info: token-auth clone failed, retrying without GITHUB_TOKEN." >&2
      git "$@"
      return 0
    fi

    return 1
  fi

  git "$@"
}

set_local_credential_username() {
  git config --local credential.https://github.com.username "$GITHUB_USER"
}

set_origin_remote() {
  local remote_url
  remote_url="https://${GITHUB_USER}@github.com/${REPO_OWNER}/${REPO_NAME}.git"
  git remote set-url "$REMOTE_NAME" "$remote_url"
}

do_pull() {
  require_value "GITHUB_USER" "$GITHUB_USER"
  require_value "REPO_NAME" "$REPO_NAME"

  set_local_credential_username
  set_origin_remote
  run_git_with_auth pull --ff-only "$REMOTE_NAME" "$(git rev-parse --abbrev-ref HEAD)"
}

do_push() {
  require_value "GITHUB_USER" "$GITHUB_USER"
  require_value "REPO_NAME" "$REPO_NAME"

  set_local_credential_username
  set_origin_remote
  run_git_with_auth push "$REMOTE_NAME" "$(git rev-parse --abbrev-ref HEAD)"
}

do_clone() {
  local slug="$1"
  local owner repo url

  require_value "GITHUB_USER" "$GITHUB_USER"
  if [[ "$slug" != */* ]]; then
    echo "Error: clone target must be OWNER/REPO" >&2
    exit 1
  fi

  owner="${slug%%/*}"
  repo="${slug##*/}"
  require_value "owner" "$owner"
  require_value "repo" "$repo"

  url="https://${GITHUB_USER}@github.com/${owner}/${repo}.git"

  if [[ -n "$TARGET_DIR" ]]; then
    run_git_with_auth clone "$url" "$TARGET_DIR"
    cd "$TARGET_DIR"
  else
    run_git_with_auth clone "$url"
    cd "$repo"
  fi

  git config --local credential.https://github.com.username "$GITHUB_USER"
}

### Arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h)
      ACTION="help"
      shift
      ;;
    --pull)
      ACTION="pull"
      shift
      ;;
    --push)
      ACTION="push"
      shift
      ;;
    --clone)
      ACTION="clone"
      shift
      if [[ $# -lt 1 ]]; then
        echo "Error: --clone requires OWNER/REPO" >&2
        exit 1
      fi
      CLONE_SLUG="$1"
      shift
      if [[ $# -gt 0 ]]; then
        TARGET_DIR="$1"
        shift
      fi
      ;;
    *)
      echo "Error: unknown argument: $1" >&2
      print_help
      exit 1
      ;;
  esac
done

### Execution
case "$ACTION" in
  help)
    print_help
    ;;
  pull)
    do_pull
    ;;
  push)
    do_push
    ;;
  clone)
    do_clone "$CLONE_SLUG"
    ;;
  *)
    echo "Error: unsupported action: $ACTION" >&2
    exit 1
    ;;
esac
