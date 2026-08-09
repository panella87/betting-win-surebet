#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" ]]; then
  cat <<'EOF'
Usage: scripts/create-source-handoff-archive.sh [output-archive-path]

Creates a mode-preserving source handoff archive (.tar.gz) for betting-win-surebet.
Runtime artifacts, secrets, dependencies, build output, and local archives are excluded.
EOF
  exit 0
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$repo_root"

if [[ ! -f "package.json" || ! -f "AGENTS.md" ]]; then
  echo "create-source-handoff-archive: run from repository root." >&2
  exit 1
fi

if [[ -L "$repo_root" || ! -d "$repo_root" ]]; then
  echo "create-source-handoff-archive: repository root must be a non-symlink directory." >&2
  exit 1
fi

reject_existing_symlink_segments() {
  local relative_path="$1" current part
  current="$repo_root"
  IFS=/ read -r -a _handoff_path_parts <<< "$relative_path"
  for part in "${_handoff_path_parts[@]}"; do
    [[ -n "$part" ]] || continue
    current="$current/$part"
    if [[ -L "$current" ]]; then
      echo "create-source-handoff-archive: path must not contain symlinks: $relative_path" >&2
      exit 1
    fi
    [[ -e "$current" ]] || break
  done
}

node scripts/restore-required-executable-bits.js >/dev/null
python3 scripts/validate_artifact_hygiene.py >/dev/null

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
default_output="artifacts/source_handoff_${timestamp}.tar.gz"
output_archive="${1:-$default_output}"
normalized_output="${output_archive#./}"
case "$normalized_output" in
  ""|.|..|/*|../*|*/../*|*/..|*/./*|./*|*//*|artifacts/../*|artifacts/..|*.git|*.git/*|*.hg|*.hg/*|*.svn|*.svn/*)
    echo "create-source-handoff-archive: output path must be a safe repo-relative artifacts path." >&2
    exit 1
    ;;
  artifacts/*.tar.gz) ;;
  *)
    echo "create-source-handoff-archive: output archive must be under artifacts/ and end with .tar.gz." >&2
    exit 1
    ;;
esac
if [[ "$normalized_output" == *$'\n'* || "$normalized_output" == *$'\r'* || "$normalized_output" == *$'\t'* ]]; then
  echo "create-source-handoff-archive: output path must not contain control characters." >&2
  exit 1
fi
output_archive="$normalized_output"
output_dir="$(dirname "$output_archive")"
reject_existing_symlink_segments "$output_dir"
mkdir -p "$output_dir"
reject_existing_symlink_segments "$output_dir"
output_dir_real="$(cd "$output_dir" && pwd -P)"
repo_root_real="$(pwd -P)"
case "$output_dir_real" in
  "$repo_root_real"/artifacts|"$repo_root_real"/artifacts/*) ;;
  *)
    echo "create-source-handoff-archive: output directory escapes repo artifacts: $output_archive" >&2
    exit 1
    ;;
esac
if [[ -L "$output_archive" ]]; then
  echo "create-source-handoff-archive: output archive must not be a symlink: $output_archive" >&2
  exit 1
fi

unsafe_symlink="$(
  find -P . \
    \( -path './.git' -o -path './.hg' -o -path './.svn' -o -path './.github' -o -path './node_modules' -o -path './dist' -o -path './coverage' -o -path './artifacts' -o -path './.locks' -o -path './output' -o -path './tmp' -o -path './.tmp' \) -prune \
    -o -type l -print -quit
)"
if [[ -n "$unsafe_symlink" ]]; then
  echo "create-source-handoff-archive: source tree must not contain symlinks: $unsafe_symlink" >&2
  exit 1
fi

tar -czpf "$output_archive" \
  --exclude='./.git' \
  --exclude='*/.git' \
  --exclude='*/.git/*' \
  --exclude='./.hg' \
  --exclude='*/.hg' \
  --exclude='*/.hg/*' \
  --exclude='./.svn' \
  --exclude='*/.svn' \
  --exclude='*/.svn/*' \
  --exclude='./.github' \
  --exclude='./node_modules' \
  --exclude='./dist' \
  --exclude='./coverage' \
  --exclude='./artifacts' \
  --exclude='./.locks' \
  --exclude='./output' \
  --exclude='./tmp' \
  --exclude='./.tmp' \
  --exclude='./.env' \
  --exclude='./true' \
  --exclude='*.zip' \
  --exclude='zi??????' \
  --exclude='*.tar' \
  --exclude='*.tar.gz' \
  --exclude='*.tgz' \
  --exclude='*.tap' \
  --exclude='*.tap.log' \
  --exclude='*.stdout.log' \
  --exclude='*.stderr.log' \
  --exclude='*.log' \
  --exclude='*.tmp' \
  .

echo "source_handoff_archive=$output_archive"
