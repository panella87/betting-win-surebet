#!/usr/bin/env bash
# Source-safe git helper. Uses GITHUB_TOKEN through GIT_ASKPASS; no Authorization extraheader injection.

ug_usage() {
  cat <<'USAGE'
Usage: ./update_git.sh [command]

Commands:
  --status
  --pull
  --push
  --pull --push
  --add-commit-push [-m|--message MESSAGE]
  --acp [-m|--message MESSAGE]
  --clone OWNER/REPO TARGET_DIR

Notes:
  --acp is shorthand for git add -A, commit, and push.
  If no commit message is provided, a safe generic message is selected.
  GITHUB_TOKEN is read from the environment first, then from .env without sourcing it.
  Token auth uses GIT_ASKPASS and does not write the token to git config.
USAGE
}

ug_fail() { printf 'ERROR: %s\n' "$*" >&2; return 1; }
ug_have() { command -v "$1" >/dev/null 2>&1; }

ug_read_env_value() {
  local key="$1" env_file="${2:-.env}" line value
  [ -f "$env_file" ] || return 1
  line="$(grep -E "^[[:space:]]*${key}=" "$env_file" | tail -n 1)" || return 1
  [ -n "$line" ] || return 1
  value="${line#*=}"
  value="${value%$'\r'}"
  value="${value#\"}"; value="${value%\"}"
  value="${value#\'}"; value="${value%\'}"
  printf '%s\n' "$value"
}

ug_github_token() {
  if [ -n "${GITHUB_TOKEN:-}" ]; then
    printf '%s\n' "$GITHUB_TOKEN"
    return 0
  fi
  ug_read_env_value GITHUB_TOKEN .env
}

ug_github_user() {
  if [ -n "${GITHUB_USER:-}" ]; then
    printf '%s\n' "$GITHUB_USER"
    return 0
  fi
  ug_read_env_value GITHUB_USER .env 2>/dev/null || printf 'x-access-token\n'
}

ug_is_github_https_url() {
  case "${1:-}" in
    https://github.com/*|https://*@github.com/*) return 0 ;;
    *) return 1 ;;
  esac
}

ug_clear_extraheaders() {
  git config --local --unset-all http.extraheader >/dev/null 2>&1 || true
  git config --local --unset-all http.https://github.com/.extraheader >/dev/null 2>&1 || true
  git config --local --unset-all http.https://panella87@github.com/.extraheader >/dev/null 2>&1 || true
  return 0
}

ug_git_with_token_if_needed() {
  local remote_url token askpass rc username
  remote_url="$(git remote get-url origin 2>/dev/null)" || remote_url=""
  if ug_is_github_https_url "$remote_url"; then
    token="$(ug_github_token)" || { ug_fail "GITHUB_TOKEN missing in environment or .env"; return 2; }
    username="$(ug_github_user)"
    askpass="$(mktemp)" || return 1
    cat > "$askpass" <<'ASKPASS'
#!/usr/bin/env sh
case "$1" in
  *Username*) printf '%s\n' "${GIT_USERNAME_FOR_ASKPASS:-x-access-token}" ;;
  *) printf '%s\n' "$GIT_TOKEN_FOR_ASKPASS" ;;
esac
ASKPASS
    chmod 700 "$askpass" 2>/dev/null || true
    ug_clear_extraheaders
    GIT_ASKPASS="$askpass" \
    GIT_TERMINAL_PROMPT=0 \
    GIT_TOKEN_FOR_ASKPASS="$token" \
    GIT_USERNAME_FOR_ASKPASS="$username" \
    git \
      -c credential.helper= \
      -c http.extraheader= \
      -c http.https://github.com/.extraheader= \
      -c http.https://panella87@github.com/.extraheader= \
      "$@"
    rc=$?
    rm -f "$askpass"
    return "$rc"
  fi
  git "$@"
  return $?
}

ug_require_repo() {
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { ug_fail "not inside a git repository"; return 2; }
  return 0
}

ug_require_branch() {
  local branch
  branch="$(git symbolic-ref --quiet --short HEAD 2>/dev/null)" || branch=""
  [ -n "$branch" ] || { ug_fail "detached HEAD is not supported"; return 2; }
  return 0
}

ug_require_clean_for_pull() {
  if [ -n "$(git status --porcelain)" ]; then
    ug_fail "working tree is dirty; commit/stash before --pull"
    git status --short >&2 || true
    return 2
  fi
  return 0
}

ug_random_message() {
  local idx messages
  messages='chore: sync repo state
chore: save workspace changes
chore: update project files
chore: checkpoint repo state
chore: refresh local changes'
  idx=$(( RANDOM % 5 + 1 ))
  printf '%s\n' "$messages" | sed -n "${idx}p"
}

ug_is_allowed_env_example() {
  case "$1" in
    .env.example|.env.sample|.env.template|*/.env.example|*/.env.sample|*/.env.template) return 0 ;;
    *) return 1 ;;
  esac
}

ug_staged_sensitive_files() {
  local file found=0
  while IFS= read -r file; do
    [ -n "$file" ] || continue
    if ug_is_allowed_env_example "$file"; then
      continue
    fi
    case "$file" in
      .env|.env.*|*/.env|*/.env.*|*.pem|*.key|*.p12|*.pfx|secrets/*|*/secrets/*|credentials/*|*/credentials/*)
        printf '%s\n' "$file"
        found=1
        ;;
    esac
  done <<EOF
$(git diff --cached --name-only)
EOF
  return "$found"
}

ug_clone() {
  local spec="$1" target="$2" token username askpass rc
  [ -n "$spec" ] && [ -n "$target" ] || { ug_fail "--clone requires OWNER/REPO and TARGET_DIR"; return 2; }
  case "$spec" in */*) ;; *) ug_fail "--clone spec must be OWNER/REPO"; return 2 ;; esac
  [ ! -e "$target" ] || { ug_fail "clone target already exists: $target"; return 2; }
  token="$(ug_github_token)" || { ug_fail "GITHUB_TOKEN required for GitHub clone"; return 2; }
  username="$(ug_github_user)"
  askpass="$(mktemp)" || return 1
  cat > "$askpass" <<'ASKPASS'
#!/usr/bin/env sh
case "$1" in
  *Username*) printf '%s\n' "${GIT_USERNAME_FOR_ASKPASS:-x-access-token}" ;;
  *) printf '%s\n' "$GIT_TOKEN_FOR_ASKPASS" ;;
esac
ASKPASS
  chmod 700 "$askpass" 2>/dev/null || true
  GIT_ASKPASS="$askpass" \
  GIT_TERMINAL_PROMPT=0 \
  GIT_TOKEN_FOR_ASKPASS="$token" \
  GIT_USERNAME_FOR_ASKPASS="$username" \
  git \
    -c credential.helper= \
    -c http.extraheader= \
    -c http.https://github.com/.extraheader= \
    -c http.https://panella87@github.com/.extraheader= \
    clone "https://github.com/${spec}.git" "$target"
  rc=$?
  rm -f "$askpass"
  return "$rc"
}

ug_main() {
  local script_dir do_status=0 do_pull=0 do_push=0 do_acp=0 do_clone=0 clone_spec='' clone_target='' message='' sensitive rc
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd -P)" || return 1
  cd "$script_dir" || return 1
  ug_have git || { ug_fail "required command not found: git"; return 127; }

  while [ "$#" -gt 0 ]; do
    case "$1" in
      --status) do_status=1; shift ;;
      --pull) do_pull=1; shift ;;
      --push) do_push=1; shift ;;
      --add-commit-push|--acp) do_acp=1; shift ;;
      --clone) clone_spec="${2:-}"; clone_target="${3:-}"; do_clone=1; shift 3 ;;
      -m|--message) message="${2:-}"; shift 2 ;;
      --message=*) message="${1#*=}"; shift ;;
      -h|--help) ug_usage; return 0 ;;
      *) ug_usage >&2; ug_fail "unknown option: $1"; return 2 ;;
    esac
  done

  if [ "$do_clone" = "1" ]; then
    ug_clone "$clone_spec" "$clone_target"
    return $?
  fi

  ug_require_repo || return $?
  ug_require_branch || return $?
  ug_clear_extraheaders

  if [ "$do_status$do_pull$do_push$do_acp" = "0000" ]; then
    do_status=1
  fi

  if [ "$do_status" = "1" ]; then
    printf 'repo=%s\n' "$(pwd -P)"
    printf 'branch=%s\n' "$(git symbolic-ref --quiet --short HEAD)"
    printf 'commit=%s\n' "$(git rev-parse HEAD)"
    git status --short
  fi

  if [ "$do_pull" = "1" ]; then
    ug_require_clean_for_pull || return $?
    ug_git_with_token_if_needed pull --ff-only || return $?
  fi

  if [ "$do_acp" = "1" ]; then
    git add -A || return $?
    sensitive="$(ug_staged_sensitive_files)" && rc=0 || rc=$?
    if [ -n "$sensitive" ]; then
      printf 'ERROR: refusing to commit sensitive files:\n%s\n' "$sensitive" >&2
      return 2
    fi
    if [ -z "$(git status --porcelain)" ]; then
      printf 'NO_CHANGES_TO_COMMIT\n'
    else
      [ -n "$message" ] || message="$(ug_random_message)"
      git commit -m "$message" || return $?
    fi
    do_push=1
  fi

  if [ "$do_push" = "1" ]; then
    ug_git_with_token_if_needed push || return $?
  fi
  return 0
}

ug_main "$@"
