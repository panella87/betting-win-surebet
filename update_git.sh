#!/usr/bin/env bash
# Universal update_git.sh
# Default action with no args: --pull (VS Code style autostash)
# Source-safe: returns non-zero without terminating an interactive parent shell.

usage() {
  cat <<'USAGE'
Usage: ./update_git.sh [command]

Default with no args:
  --pull

Pull behavior:
  --pull uses git pull --ff-only --autostash so local tracked edits/deletions are
  temporarily stashed, remote changes are pulled, and local changes are reapplied.

Commands:
  --status
  --pull
  --push
  --pull --push
  --add-commit-push [-m|--message MESSAGE]
  --acp [-m|--message MESSAGE]
      Stages required executable modes from tools/required_executable_paths.js
      before committing, including when core.fileMode=false.
  --clone OWNER/REPO TARGET_DIR
  -h, --help

Auth:
  Reads GITHUB_TOKEN from environment first, then .env.
  Uses GIT_ASKPASS for GitHub HTTPS auth.
  Does not inject Authorization extraheaders.
  Does not persist token in .git/config.
USAGE
}

say_error() {
  printf 'ERROR: %s\n' "$*" >&2
}

script_dir() {
  local src dir
  src="${BASH_SOURCE[0]:-$0}"
  dir="$(cd "$(dirname "$src")" 2>/dev/null && pwd -P)" || return 1
  printf '%s\n' "$dir"
}

read_env_value() {
  local key="$1" env_file line value
  env_file="${ENV_FILE:-.env}"
  [ -f "$env_file" ] || return 1
  line="$(grep -E "^[[:space:]]*${key}=" "$env_file" 2>/dev/null | tail -n 1)" || return 1
  [ -n "$line" ] || return 1
  value="${line#*=}"
  value="${value%$'\r'}"
  value="${value#\"}"; value="${value%\"}"
  value="${value#\'}"; value="${value%\'}"
  printf '%s\n' "$value"
}

read_setting() {
  local key="$1" env_value file_value
  env_value="${!key:-}"
  if [ -n "$env_value" ]; then
    printf '%s\n' "$env_value"
    return 0
  fi
  file_value="$(read_env_value "$key")" || return 1
  [ -n "$file_value" ] || return 1
  printf '%s\n' "$file_value"
}

read_github_token() {
  read_setting GITHUB_TOKEN
}

read_github_user() {
  local value
  value="$(read_setting GITHUB_USER 2>/dev/null)" && [ -n "$value" ] && { printf '%s\n' "$value"; return 0; }
  value="$(read_setting GIT_USER 2>/dev/null)" && [ -n "$value" ] && { printf '%s\n' "$value"; return 0; }
  printf '%s\n' "x-access-token"
}

is_github_https_url() {
  case "${1:-}" in
    https://github.com/*|https://*@github.com/*) return 0 ;;
    *) return 1 ;;
  esac
}

canonical_github_url() {
  local url="$1" rest
  case "$url" in
    https://github.com/*)
      printf '%s\n' "$url"
      return 0
      ;;
    https://*@github.com/*)
      rest="${url#https://*@github.com/}"
      printf 'https://github.com/%s\n' "$rest"
      return 0
      ;;
    *)
      printf '%s\n' "$url"
      return 0
      ;;
  esac
}

make_askpass() {
  local askpass_file="$1"
  cat > "$askpass_file" <<'ASKPASS'
#!/usr/bin/env sh
case "$1" in
  *Username*) printf '%s\n' "${GITHUB_USER_FOR_ASKPASS:-x-access-token}" ;;
  *Password*) printf '%s\n' "${GITHUB_TOKEN_FOR_ASKPASS:-}" ;;
  *) printf '%s\n' "${GITHUB_TOKEN_FOR_ASKPASS:-}" ;;
esac
ASKPASS
  chmod 700 "$askpass_file" 2>/dev/null || return 1
  return 0
}

clear_local_extraheaders_quietly() {
  git config --local --unset-all http.extraheader >/dev/null 2>&1 || true
  git config --local --unset-all http.https://github.com/.extraheader >/dev/null 2>&1 || true
  git config --local --unset-all http.https://panella87@github.com/.extraheader >/dev/null 2>&1 || true
}

git_with_token_if_needed() {
  local remote_url canonical_url token user askpass_file rc
  remote_url="$(git remote get-url origin 2>/dev/null)" || return $?
  if ! is_github_https_url "$remote_url"; then
    git "$@"
    return $?
  fi

  token="$(read_github_token)" || {
    say_error "origin is GitHub HTTPS but GITHUB_TOKEN is missing from environment/.env"
    return 2
  }
  [ -n "$token" ] || {
    say_error "origin is GitHub HTTPS but GITHUB_TOKEN is empty"
    return 2
  }

  user="$(read_github_user)"
  canonical_url="$(canonical_github_url "$remote_url")"
  askpass_file="$(mktemp 2>/dev/null)" || {
    say_error "mktemp failed"
    return 1
  }
  make_askpass "$askpass_file" || {
    rm -f "$askpass_file"
    say_error "could not create temporary askpass helper"
    return 1
  }

  clear_local_extraheaders_quietly
  GIT_TERMINAL_PROMPT=0 \
  GIT_ASKPASS="$askpass_file" \
  GITHUB_TOKEN_FOR_ASKPASS="$token" \
  GITHUB_USER_FOR_ASKPASS="$user" \
  git \
    -c credential.helper= \
    -c http.extraheader= \
    -c http.https://github.com/.extraheader= \
    -c http."$canonical_url".extraheader= \
    "$@"
  rc=$?
  rm -f "$askpass_file"
  return "$rc"
}

require_git_repo() {
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || {
    say_error "not inside a git repository"
    return 2
  }
  return 0
}

require_not_detached() {
  local branch
  branch="$(git symbolic-ref --quiet --short HEAD 2>/dev/null)" || branch=""
  [ -n "$branch" ] || {
    say_error "detached HEAD is not supported"
    return 2
  }
  return 0
}

random_commit_message() {
  case $(( RANDOM % 5 )) in
    0) printf '%s\n' 'chore: sync repo state' ;;
    1) printf '%s\n' 'chore: save workspace changes' ;;
    2) printf '%s\n' 'chore: update project files' ;;
    3) printf '%s\n' 'chore: checkpoint repo state' ;;
    *) printf '%s\n' 'chore: refresh local changes' ;;
  esac
}

secret_like_path() {
  local path="$1"
  case "$path" in
    .env.example|.env.sample|.env.template) return 1 ;;
    .env|.env.*|*.pem|*.key|*.p12|*.pfx|id_rsa|id_ed25519|*_rsa|*_ed25519|secrets/*|.secrets/*|credentials/*) return 0 ;;
    *) return 1 ;;
  esac
}

refuse_secret_commit() {
  local staged path blocked=0
  staged="$(git diff --cached --name-only 2>/dev/null)" || return $?
  while IFS= read -r path; do
    [ -n "$path" ] || continue
    if secret_like_path "$path"; then
      printf 'ERROR: refusing to commit secret-like path: %s\n' "$path" >&2
      blocked=1
    fi
  done <<EOF
$staged
EOF
  [ "$blocked" = "0" ] || return 2
  return 0
}

stage_required_executable_modes() {
  local manifest_path="tools/required_executable_paths.js" list_file relative_path
  [ -f "$manifest_path" ] || {
    say_error "missing required executable path manifest: $manifest_path"
    return 2
  }
  command -v node >/dev/null 2>&1 || {
    say_error "node is required to stage executable modes"
    return 127
  }

  list_file="$(mktemp 2>/dev/null)" || {
    say_error "mktemp failed while loading required executable paths"
    return 1
  }
  if ! node --input-type=module - "$manifest_path" >"$list_file" <<'NODE'
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const manifestPath = path.resolve(process.argv[2] ?? '');
const loaded = await import(pathToFileURL(manifestPath).href);
const executablePaths = loaded.REQUIRED_EXECUTABLE_PATHS;
if (!Array.isArray(executablePaths) || executablePaths.length === 0) {
  throw new Error('REQUIRED_EXECUTABLE_PATHS must be a non-empty array');
}

const seen = new Set();
for (const value of executablePaths) {
  if (
    typeof value !== 'string'
    || value.length === 0
    || value.startsWith('/')
    || value.includes('\\')
    || value.includes('\n')
    || value.split('/').includes('..')
  ) {
    throw new Error(`invalid required executable path: ${JSON.stringify(value)}`);
  }
  if (seen.has(value)) {
    throw new Error(`duplicate required executable path: ${value}`);
  }
  seen.add(value);
  process.stdout.write(`${value}\n`);
}
NODE
  then
    rm -f "$list_file"
    say_error "could not load required executable paths from $manifest_path"
    return 2
  fi

  while IFS= read -r relative_path; do
    [ -n "$relative_path" ] || continue
    [ -f "$relative_path" ] || {
      rm -f "$list_file"
      say_error "missing required executable file: $relative_path"
      return 2
    }
    git ls-files --error-unmatch -- "$relative_path" >/dev/null 2>&1 || {
      rm -f "$list_file"
      say_error "required executable file is not tracked: $relative_path"
      return 2
    }
    chmod u+x -- "$relative_path" || {
      rm -f "$list_file"
      say_error "could not restore executable bit: $relative_path"
      return 1
    }
    git update-index --chmod=+x -- "$relative_path" || {
      rm -f "$list_file"
      say_error "could not stage executable mode: $relative_path"
      return 1
    }
  done < "$list_file"
  rm -f "$list_file"
  return 0
}

clone_repo() {
  local spec="$1" target="$2" token user askpass_file rc
  [ -n "$spec" ] && [ -n "$target" ] || { say_error "--clone requires OWNER/REPO and TARGET_DIR"; return 2; }
  case "$spec" in */*) ;; *) say_error "--clone spec must be OWNER/REPO"; return 2 ;; esac
  [ ! -e "$target" ] || { say_error "clone target already exists: $target"; return 2; }
  token="$(read_github_token)" || { say_error "GITHUB_TOKEN is required for GitHub clone"; return 2; }
  user="$(read_github_user)"
  askpass_file="$(mktemp 2>/dev/null)" || { say_error "mktemp failed"; return 1; }
  make_askpass "$askpass_file" || { rm -f "$askpass_file"; say_error "could not create temporary askpass helper"; return 1; }
  GIT_TERMINAL_PROMPT=0 \
  GIT_ASKPASS="$askpass_file" \
  GITHUB_TOKEN_FOR_ASKPASS="$token" \
  GITHUB_USER_FOR_ASKPASS="$user" \
  git -c credential.helper= clone "https://github.com/${spec}.git" "$target"
  rc=$?
  rm -f "$askpass_file"
  return "$rc"
}

main() {
  local dir do_status=0 do_pull=0 do_push=0 do_acp=0 do_clone=0 clone_spec="" clone_target="" message="" rc=0 status_out
  dir="$(script_dir)" || { say_error "cannot resolve script directory"; return 1; }
  cd "$dir" || { say_error "cannot cd to script directory: $dir"; return 1; }

  if [ "$#" -eq 0 ]; then
    do_pull=1
  fi

  while [ "$#" -gt 0 ]; do
    case "$1" in
      --status) do_status=1; shift ;;
      --pull) do_pull=1; shift ;;
      --push) do_push=1; shift ;;
      --add-commit-push|--acp) do_acp=1; shift ;;
      --clone)
        clone_spec="${2:-}"; clone_target="${3:-}"; do_clone=1; shift 3 ;;
      -m|--message)
        message="${2:-}"; shift 2 ;;
      --message=*) message="${1#*=}"; shift ;;
      -h|--help) usage; return 0 ;;
      *) say_error "unknown option: $1"; usage >&2; return 2 ;;
    esac
  done

  if [ "$do_clone" = "1" ]; then
    clone_repo "$clone_spec" "$clone_target"
    return $?
  fi

  require_git_repo || return $?
  require_not_detached || return $?

  if [ "$do_status" = "1" ]; then
    printf 'repo=%s\n' "$(pwd -P)"
    printf 'branch=%s\n' "$(git symbolic-ref --quiet --short HEAD 2>/dev/null)"
    printf 'commit=%s\n' "$(git rev-parse HEAD 2>/dev/null)"
    git status --short
    rc=$?
    [ "$rc" = "0" ] || return "$rc"
  fi

  if [ "$do_pull" = "1" ]; then
    git_with_token_if_needed pull --ff-only --autostash || return $?
  fi

  if [ "$do_acp" = "1" ]; then
    git add -A || return $?
    stage_required_executable_modes || return $?
    refuse_secret_commit || return $?
    status_out="$(git status --porcelain 2>/dev/null)" || return $?
    if [ -z "$status_out" ]; then
      printf '%s\n' 'NO_CHANGES_TO_COMMIT'
    else
      [ -n "$message" ] || message="$(random_commit_message)"
      git commit -m "$message" || return $?
    fi
    do_push=1
  fi

  if [ "$do_push" = "1" ]; then
    git_with_token_if_needed push || return $?
  fi

  return 0
}

main "$@"
