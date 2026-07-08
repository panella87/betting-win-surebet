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

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

if [[ ! -f "package.json" || ! -f "AGENTS.md" ]]; then
  echo "create-source-handoff-archive: run from repository root." >&2
  exit 1
fi

node scripts/restore-required-executable-bits.js >/dev/null
python3 scripts/validate_artifact_hygiene.py >/dev/null

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
default_output="artifacts/source_handoff_${timestamp}.tar.gz"
output_archive="${1:-$default_output}"
output_dir="$(dirname "$output_archive")"
mkdir -p "$output_dir"

tar -czpf "$output_archive" \
  --exclude='./.git' \
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
