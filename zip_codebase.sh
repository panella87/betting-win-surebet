#!/usr/bin/env bash
# Source-safe numbered codebase zipper. No shell-option mutation; no parent-shell termination.

zc_usage() {
  cat <<'USAGE'
Usage: ./zip_codebase.sh [--artifacts-only]

Creates the next numbered codebase zip in the repo root, for example repo12.zip -> repo13.zip.
Includes git-tracked files plus untracked non-ignored files by default.
Excludes archives, secrets, logs, databases, generated folders, artifacts, and runtime evidence.

Options:
  --artifacts-only   Create the next numbered artifacts zip from the complete
                     ./artifacts directory tree without filtering its contents,
                     for example artifacts12.zip -> artifacts13.zip.
USAGE
}

zc_have() { command -v "$1" >/dev/null 2>&1; }

zc_fail() {
  printf 'ERROR: %s\n' "$*" >&2
  return 1
}

zc_is_excluded_path() {
  local path base lower
  path="${1#./}"
  base="${path##*/}"
  lower="$(printf '%s' "$path" | tr '[:upper:]' '[:lower:]')"

  case "$base" in
    .env.example|.env.sample|.env.template) return 1 ;;
  esac

  case "$base" in
    .env|.env.*|.zip-codebase-list.tmp.*|zi??????|*.zip|*.tar|*.tar.gz|*.tgz|*.7z|*.rar|*.log|*.pid|*.lock|*.tmp|*.sqlite|*.sqlite3|*.db|*.db-shm|*.db-wal|*.pem|*.key|*.p12|*.pfx|id_rsa|id_ed25519|*_rsa|*_ed25519|.DS_Store|Thumbs.db|true)
      return 0
      ;;
  esac

  case "/$path/" in
    */.git/*|*/.github/*|*/.locks/*|*/.automation/locks/*|*/node_modules/*|*/.pnpm-store/*|*/.npm/*|*/.yarn/*|*/.cache/*|*/.next/*|*/.nuxt/*|*/.turbo/*|*/.parcel-cache/*|*/dist/*|*/build/*|*/out/*|*/coverage/*|*/.nyc_output/*|*/artifacts/*|/reports/*|*/runtime/*|*/logs/*|*/log/*|*/tmp/*|*/.tmp/*|*/temp/*|*/output/*|*/backup/*|*/backups/*|*/cache/*|*/__pycache__/*|*/.pytest_cache/*|*/.mypy_cache/*|*/.ruff_cache/*|*/.venv/*|*/venv/*|*/secrets/*|*/.secrets/*|*/credentials/*)
      return 0
      ;;
  esac

  case "$lower" in
    *.tap|*.tap.log|*.stdout|*.stderr|*.stdout.txt|*.stderr.txt|*.stdout.log|*.stderr.log|*.stdout.json|*.stderr.json)
      return 0
      ;;
  esac

  return 1
}

zc_next_numbered_zip() {
  local prefix="$1" max=0 f b rest generation n nullglob_was_set=0
  shopt -q nullglob && nullglob_was_set=1
  shopt -s nullglob
  for f in ./${prefix}*.zip; do
    b="${f#./}"
    rest="${b#"$prefix"}"
    [ "$rest" != "$b" ] || continue
    case "$rest" in *.zip) ;; *) continue ;; esac
    generation="${rest%.zip}"
    generation="${generation%%\(*}"
    case "$generation" in ''|*[!0-9]*) continue ;; esac
    n=$((10#$generation))
    [ "$n" -gt "$max" ] && max="$n"
  done
  if [ "$nullglob_was_set" = "0" ]; then
    shopt -u nullglob
  fi
  printf '%s\n' "$((max + 1))"
}

zc_collect_files() {
  local repo_root="$1" list_file="$2" use_git=0 file_path git_root
  : > "$list_file" || return 1
  if zc_have git && git -C "$repo_root" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git_root="$(git -C "$repo_root" rev-parse --show-toplevel 2>/dev/null)" || return 1
    if [ "$(cd "$git_root" 2>/dev/null && pwd -P)" != "$repo_root" ]; then
      zc_fail "script must run from repo root: $git_root"
      return 1
    fi
    use_git=1
  fi

  if [ "$use_git" = "1" ]; then
    while IFS= read -r -d '' file_path; do
      [ -f "$file_path" ] || continue
      zc_is_excluded_path "$file_path" || printf '%s\n' "$file_path" >> "$list_file"
    done < <(git -C "$repo_root" ls-files --cached --others --exclude-standard -z)
  else
    while IFS= read -r -d '' file_path; do
      file_path="${file_path#./}"
      [ -f "$file_path" ] || continue
      zc_is_excluded_path "$file_path" || printf '%s\n' "$file_path" >> "$list_file"
    done < <(find . -type f -print0)
  fi
  sort -u "$list_file" -o "$list_file" 2>/dev/null || return 1
  return 0
}

zc_main() {
  local artifacts_only=0 zip_prefix
  if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
    zc_usage
    return 0
  fi
  if [ "${1:-}" = "--artifacts-only" ]; then
    artifacts_only=1
    shift
  fi
  if [ "$#" -ne 0 ]; then
    zc_usage >&2
    zc_fail "unknown argument: $1"
    return 2
  fi

  local script_dir repo_root repo_name list_file="" file_count next_number zip_name zip_path tmp_zip size_bytes sha256
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd -P)" || return 1
  cd "$script_dir" || return 1
  repo_root="$(pwd -P)" || return 1
  repo_name="$(basename "$repo_root")"

  zc_have zip || { zc_fail "required command not found: zip"; return 127; }
  zc_have sha256sum || { zc_fail "required command not found: sha256sum"; return 127; }
  zc_have find || { zc_fail "required command not found: find"; return 127; }

  if [ "$artifacts_only" = "1" ]; then
    [ -d "$repo_root/artifacts" ] || { zc_fail "artifacts directory not found: $repo_root/artifacts"; return 1; }
    file_count="$(find artifacts -type f -print | wc -l | tr -d '[:space:]')"
    if [ "$file_count" = "0" ]; then
      zc_fail "no files found in artifacts directory"
      return 1
    fi
    zip_prefix="artifacts"
  else
    zc_have sort || { zc_fail "required command not found: sort"; return 127; }
    zc_have mktemp || { zc_fail "required command not found: mktemp"; return 127; }
    list_file="$(mktemp "$repo_root/.zip-codebase-list.tmp.XXXXXXXXXX")" || {
      zc_fail "could not create repo-local packaging file list"
      return 1
    }
    if ! zc_collect_files "$repo_root" "$list_file"; then
      rm -f "$list_file"
      return 1
    fi
    file_count="$(wc -l < "$list_file" | tr -d '[:space:]')"
    if [ "$file_count" = "0" ]; then
      rm -f "$list_file"
      zc_fail "no files selected for codebase zip"
      return 1
    fi
    zip_prefix="$repo_name"
  fi

  next_number="$(zc_next_numbered_zip "$zip_prefix")" || { [ -z "$list_file" ] || rm -f "$list_file"; return 1; }
  zip_name="${zip_prefix}${next_number}.zip"
  zip_path="$repo_root/$zip_name"
  tmp_zip="$repo_root/.${zip_name}.tmp.$$.zip"
  if [ -e "$zip_path" ]; then
    [ -z "$list_file" ] || rm -f "$list_file"
    zc_fail "target zip already exists: $zip_path"
    return 1
  fi

  rm -f "$tmp_zip"
  if [ "$artifacts_only" = "1" ]; then
    if ! zip -q -r "$tmp_zip" artifacts; then
      rm -f "$tmp_zip"
      zc_fail "zip command failed"
      return 1
    fi
  else
    if ! zip -q -@ "$tmp_zip" < "$list_file"; then
      rm -f "$list_file" "$tmp_zip"
      zc_fail "zip command failed"
      return 1
    fi
    rm -f "$list_file"
  fi

  if ! mv "$tmp_zip" "$zip_path"; then
    rm -f "$tmp_zip"
    zc_fail "could not publish zip: $zip_path"
    return 1
  fi
  size_bytes="$(wc -c < "$zip_path" | tr -d '[:space:]')"
  sha256="$(sha256sum "$zip_path" | awk '{print $1}')"
  printf 'created_zip=%s\n' "$zip_path"
  printf 'file_count=%s\n' "$file_count"
  printf 'size_bytes=%s\n' "$size_bytes"
  printf 'sha256=%s\n' "$sha256"
  return 0
}

zc_main "$@"
