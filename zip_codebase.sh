#!/usr/bin/env bash
# Source-safe numbered codebase zipper. No shell-option mutation; no parent-shell termination.

zc_usage() {
  cat <<'USAGE'
Usage: ./zip_codebase.sh [--artifacts-only]

Creates the next numbered codebase zip in the repo root, for example repo12.zip -> repo13.zip.
Includes git-tracked files plus untracked non-ignored files by default.
Uses fast Deflate level 1 for lower packaging latency while preserving ZIP compatibility.
Excludes archives, secrets, logs, databases, generated folders, artifacts, and runtime evidence.

Options:
  --artifacts-only   Create the next numbered artifacts zip from the complete
                     ./artifacts directory tree, excluding embedded VCS metadata,
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
    */.git/*|*/.hg/*|*/.svn/*|*/.github/*|*/.locks/*|*/.automation/locks/*|*/node_modules/*|*/.pnpm-store/*|*/.npm/*|*/.yarn/*|*/.cache/*|*/.next/*|*/.nuxt/*|*/.turbo/*|*/.parcel-cache/*|*/dist/*|*/build/*|*/out/*|*/coverage/*|*/.nyc_output/*|*/artifacts/*|/reports/*|/runtime/*|*/logs/*|*/log/*|*/tmp/*|*/.tmp/*|*/temp/*|*/output/*|*/backup/*|*/backups/*|*/cache/*|*/__pycache__/*|*/.pytest_cache/*|*/.mypy_cache/*|*/.ruff_cache/*|*/.venv/*|*/venv/*|*/secrets/*|*/.secrets/*|*/credentials/*)
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

zc_validate_relative_path() {
  local path="$1"
  path="${path#./}"
  case "$path" in
    ""|.|..|/*|../*|*/../*|*/..|*/./*|./*|*//*)
      zc_fail "unsafe relative path selected for zip: $1"
      return 1
      ;;
  esac
  if [[ "$path" == *$'\n'* || "$path" == *$'\r'* || "$path" == *$'\t'* ]]; then
    zc_fail "unsafe control character in zip path: $1"
    return 1
  fi
  printf '%s\n' "$path"
  return 0
}

zc_reject_symlink_path() {
  local path="$1" current="." part
  IFS=/ read -r -a _zc_path_parts <<< "$path"
  for part in "${_zc_path_parts[@]}"; do
    [ -n "$part" ] || continue
    current="$current/$part"
    if [ -L "$current" ]; then
      zc_fail "zip source must not contain symlinks: $path"
      return 1
    fi
    [ -e "$current" ] || break
  done
  return 0
}

zc_validate_zip_destination() {
  local repo_root="$1" destination="$2" parent
  case "$destination" in
    "$repo_root"/*.zip|"$repo_root"/.*.zip) ;;
    *)
      zc_fail "zip destination must stay in repo root: $destination"
      return 1
      ;;
  esac
  parent="$(dirname "$destination")"
  if [ "$(cd "$parent" 2>/dev/null && pwd -P)" != "$repo_root" ]; then
    zc_fail "zip destination parent must be the repo root: $destination"
    return 1
  fi
  if [ -L "$destination" ]; then
    zc_fail "zip destination must not be a symlink: $destination"
    return 1
  fi
}

zc_prune_zip_vcs_metadata() {
  local archive="$1" rc
  if [ ! -f "$archive" ] || [ -L "$archive" ]; then
    zc_fail "zip archive must be a non-symlink regular file: $archive"
    return 1
  fi
  zip -q -d "$archive" '.git' '.git/*' '*/.git' '*/.git/*' '.hg' '.hg/*' '*/.hg' '*/.hg/*' '.svn' '.svn/*' '*/.svn' '*/.svn/*' >/dev/null 2>&1
  rc=$?
  case "$rc" in
    0|12) return 0 ;;
    *) return "$rc" ;;
  esac
}

zc_publish_zip_no_clobber() {
  local repo_root="$1" source="$2" destination="$3"
  zc_validate_zip_destination "$repo_root" "$destination" || return 1
  if [ ! -f "$source" ] || [ -L "$source" ]; then
    zc_fail "source zip must be a non-symlink regular file: $source"
    return 1
  fi
  if [ -e "$destination" ] || [ -L "$destination" ]; then
    zc_fail "target zip already exists or is a symlink: $destination"
    return 1
  fi
  if ! ln -T -- "$source" "$destination"; then
    zc_fail "target zip already exists or could not be published without clobbering: $destination"
    return 1
  fi
  rm -f "$source"
}

zc_reject_artifacts_symlinks() {
  local symlink_entry
  if [ ! -d artifacts ] || [ -L artifacts ]; then
    zc_fail "artifacts zip source must be a non-symlink directory: artifacts"
    return 1
  fi
  symlink_entry="$(find -P artifacts -mindepth 1 -type l -print -quit 2>/dev/null)" || {
    zc_fail "failed to scan artifacts for symlinks"
    return 1
  }
  if [ -n "$symlink_entry" ]; then
    zc_fail "artifacts zip source must not contain symlinks: $symlink_entry"
    return 1
  fi
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
  local repo_root="$1" list_file="$2" use_git=0 file_path git_root normalized_path
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
      normalized_path="$(zc_validate_relative_path "$file_path")" || return 1
      zc_reject_symlink_path "$normalized_path" || return 1
      [ -f "$file_path" ] || continue
      zc_is_excluded_path "$normalized_path" || printf '%s\n' "$normalized_path" >> "$list_file"
    done < <(git -C "$repo_root" ls-files --cached --others --exclude-standard -z)
  else
    while IFS= read -r -d '' file_path; do
      file_path="${file_path#./}"
      normalized_path="$(zc_validate_relative_path "$file_path")" || return 1
      zc_reject_symlink_path "$normalized_path" || return 1
      [ -f "$normalized_path" ] || continue
      zc_is_excluded_path "$normalized_path" || printf '%s\n' "$normalized_path" >> "$list_file"
    done < <(find . \( -type f -o -type l \) -print0)
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
    zc_reject_artifacts_symlinks || return 1
    file_count="$(find artifacts -type f ! -path '*/.git/*' ! -path '*/.git' ! -path '*/.hg/*' ! -path '*/.hg' ! -path '*/.svn/*' ! -path '*/.svn' -print | wc -l | tr -d '[:space:]')"
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
  zc_validate_zip_destination "$repo_root" "$zip_path" || { [ -z "$list_file" ] || rm -f "$list_file"; return 1; }
  zc_validate_zip_destination "$repo_root" "$tmp_zip" || { [ -z "$list_file" ] || rm -f "$list_file"; return 1; }
  if [ -e "$zip_path" ]; then
    [ -z "$list_file" ] || rm -f "$list_file"
    zc_fail "target zip already exists: $zip_path"
    return 1
  fi

  rm -f "$tmp_zip"
  if [ "$artifacts_only" = "1" ]; then
    if ! zip -q -1 -r "$tmp_zip" artifacts -x 'artifacts/.git/*' 'artifacts/.git' 'artifacts/*/.git/*' 'artifacts/*/.git' 'artifacts/**/.git/*' 'artifacts/**/.git' 'artifacts/.hg/*' 'artifacts/.hg' 'artifacts/*/.hg/*' 'artifacts/*/.hg' 'artifacts/**/.hg/*' 'artifacts/**/.hg' 'artifacts/.svn/*' 'artifacts/.svn' 'artifacts/*/.svn/*' 'artifacts/*/.svn' 'artifacts/**/.svn/*' 'artifacts/**/.svn'; then
      rm -f "$tmp_zip"
      zc_fail "zip command failed"
      return 1
    fi
  else
    if ! zip -q -1 -@ "$tmp_zip" < "$list_file"; then
      rm -f "$list_file" "$tmp_zip"
      zc_fail "zip command failed"
      return 1
    fi
    rm -f "$list_file"
  fi
  if ! zc_prune_zip_vcs_metadata "$tmp_zip"; then
    rm -f "$list_file" "$tmp_zip"
    return 1
  fi

  if ! zc_publish_zip_no_clobber "$repo_root" "$tmp_zip" "$zip_path"; then
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
