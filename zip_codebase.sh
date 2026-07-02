#!/usr/bin/env bash
set -euo pipefail

SCRIPT_VERSION="2026-06-30.surebet-v1-git-aware-zip-codebase"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
CALLER_PWD="$(pwd -P)"
LOCAL_ROOT="${LOCAL_ROOT:-$SCRIPT_DIR}"
CODEBASE_OUTPUT="${CODEBASE_OUTPUT:-}"
CODEBASE_OVERWRITE="${CODEBASE_OVERWRITE:-0}"


if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'USAGE'
Usage: ./zip_codebase.sh

Creates a clean local codebase ZIP for betting-win-surebet.
Optional environment variables:
  LOCAL_ROOT=/path/to/repo
  CODEBASE_OUTPUT=/path/to/output.zip
  CODEBASE_PREFIX=betting-win-surebet
  CODEBASE_OVERWRITE=0|1

Secrets, .env files, dependencies, build output, logs, artifacts, and generated archives are excluded.
USAGE
  exit 0
fi

for command in git python3 sha256sum; do
  command -v "$command" >/dev/null 2>&1 || {
    printf 'ERROR: required command is missing: %s\n' "$command" >&2
    exit 1
  }
done
[[ "$CODEBASE_OVERWRITE" == "0" || "$CODEBASE_OVERWRITE" == "1" ]] || {
  printf 'ERROR: CODEBASE_OVERWRITE must be 0 or 1.\n' >&2
  exit 1
}
[[ -d "$LOCAL_ROOT" ]] || {
  printf 'ERROR: local root not found: %s\n' "$LOCAL_ROOT" >&2
  exit 1
}
LOCAL_ROOT="$(cd "$LOCAL_ROOT" && pwd -P)"
CODEBASE_PREFIX="${CODEBASE_PREFIX:-$(basename "$LOCAL_ROOT")}"

if command -v 7z >/dev/null 2>&1; then
  ARCHIVER="7z"
else
  ARCHIVER="python3_zipfile"
fi

cd "$LOCAL_ROOT"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || {
  printf 'ERROR: zip_codebase.sh requires a Git worktree.\n' >&2
  exit 1
}

next_number_for_prefix() {
  local prefix="$1"
  local output_dir="$2"
  python3 - "$prefix" "$output_dir" "$SCRIPT_DIR" "$CALLER_PWD" <<'PYNUM'
from pathlib import Path
import re
import sys

prefix = sys.argv[1]
roots: list[Path] = []
for raw in sys.argv[2:]:
    root = Path(raw).resolve()
    if root.is_dir() and root not in roots:
        roots.append(root)
pattern = re.compile(
    rf'^{re.escape(prefix)}(?P<generation>[0-9]*)(?:\([0-9]+\))?\.zip$',
    re.IGNORECASE,
)
maximum = 0
for root in roots:
    for item in root.iterdir():
        if not item.is_file():
            continue
        match = pattern.fullmatch(item.name)
        if match is None:
            continue
        raw_generation = match.group('generation')
        generation = int(raw_generation, 10) if raw_generation else 0
        maximum = max(maximum, generation)
print(maximum + 1)
PYNUM
}

if [[ -n "$CODEBASE_OUTPUT" ]]; then
  [[ "$CODEBASE_OUTPUT" == *.zip ]] || {
    printf 'ERROR: CODEBASE_OUTPUT must end in .zip.\n' >&2
    exit 1
  }
  if [[ "$CODEBASE_OUTPUT" = /* ]]; then
    LOCAL_CODEBASE_ZIP="$CODEBASE_OUTPUT"
  else
    LOCAL_CODEBASE_ZIP="$CALLER_PWD/$CODEBASE_OUTPUT"
  fi
else
  OUTPUT_DIR="$LOCAL_ROOT"
  CODEBASE_N="$(next_number_for_prefix "$CODEBASE_PREFIX" "$OUTPUT_DIR")"
  LOCAL_CODEBASE_ZIP="$OUTPUT_DIR/${CODEBASE_PREFIX}${CODEBASE_N}.zip"
fi
OUTPUT_DIR="$(dirname "$LOCAL_CODEBASE_ZIP")"
mkdir -p "$OUTPUT_DIR"
OUTPUT_DIR="$(cd "$OUTPUT_DIR" && pwd -P)"
LOCAL_CODEBASE_ZIP="$OUTPUT_DIR/$(basename "$LOCAL_CODEBASE_ZIP")"

if [[ -e "$LOCAL_CODEBASE_ZIP" && "$CODEBASE_OVERWRITE" != "1" ]]; then
  printf 'ERROR: target codebase zip already exists: %s\n' "$LOCAL_CODEBASE_ZIP" >&2
  exit 1
fi

STATE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/betting-win-surebet-codebase-state.XXXXXX")"
PUBLISH_DIR="$(mktemp -d "$OUTPUT_DIR/.betting-win-surebet-codebase-publish.XXXXXX")"
TRACKED_FILE="$STATE_DIR/tracked.bin"
UNTRACKED_FILE="$STATE_DIR/untracked.bin"
LIST_FILE="$STATE_DIR/files.txt"
TMP_CODEBASE="$PUBLISH_DIR/codebase.zip"
cleanup() {
  rm -rf -- "$STATE_DIR" "$PUBLISH_DIR"
}
trap cleanup EXIT INT TERM HUP

git ls-files -c -z > "$TRACKED_FILE"
git ls-files -o --exclude-standard -z > "$UNTRACKED_FILE"

python3 - "$LOCAL_ROOT" "$TRACKED_FILE" "$UNTRACKED_FILE" "$LIST_FILE" "$LOCAL_CODEBASE_ZIP" <<'PYSELECT'
from __future__ import annotations

import sys
from pathlib import Path

root = Path(sys.argv[1])
root_resolved = root.resolve()
tracked_path = Path(sys.argv[2])
untracked_path = Path(sys.argv[3])
output_path = Path(sys.argv[4])
final_zip = Path(sys.argv[5])

FORBIDDEN_PARTS = {
    '.git', '.github', 'node_modules', '.tmp', '.locks', 'artifacts',
    'output', 'tmp', '__pycache__', 'dist', 'coverage', '.nyc_output',
}
FORBIDDEN_NAMES = {
    '.env', '.env.local', '.env.production', 'true',
    'OVERLAY_MANIFEST.json', 'OVERLAY_README.md', 'MANIFEST.json',
    'autonomous-handoff.manifest.json', 'artifacts.manifest.json',
    'credentials.json', 'secrets.json', 'id_rsa', 'id_ed25519',
}
ARCHIVE_SUFFIXES = ('.zip', '.tar', '.tar.gz', '.tgz', '.7z', '.rar')
LOG_SUFFIXES = (
    '.log', '.tap', '.tap.log', '.stdout', '.stderr', '.stdout.txt',
    '.stderr.txt', '.stdout.log', '.stderr.log',
)


def records(path: Path) -> list[str]:
    return [
        item.decode('utf-8', 'surrogateescape')
        for item in path.read_bytes().split(b'\0')
        if item
    ]


def common_safe(relative: str) -> bool:
    if '\n' in relative or '\r' in relative:
        raise SystemExit(f'ERROR: unsupported newline in repository path: {relative!r}')
    path = Path(relative)
    source = root / path
    if source.is_symlink():
        raise SystemExit(f'ERROR: codebase packaging rejects symlink input: {relative}')
    if not source.is_file():
        return False
    try:
        source.resolve(strict=True).relative_to(root_resolved)
    except (OSError, ValueError):
        raise SystemExit(f'ERROR: codebase path escapes repository root: {relative}')
    if any(
        part in FORBIDDEN_PARTS
        or part.startswith('.betting-win-surebet-')
        or part.startswith('.autonomous-handoff.')
        for part in path.parts
    ):
        return False
    lowered = path.name.lower()
    if lowered in FORBIDDEN_NAMES:
        return False
    if lowered.startswith('.env') and lowered != '.env.example':
        return False
    if source.resolve() == final_zip.resolve():
        return False
    if lowered.endswith(LOG_SUFFIXES) or lowered.endswith('.tmp') or lowered.endswith('.pyc'):
        return False
    if lowered.endswith(ARCHIVE_SUFFIXES):
        return False
    return True


selected: set[str] = set()
safe_untracked = 0
for relative in records(tracked_path):
    if common_safe(relative):
        selected.add(relative)
for relative in records(untracked_path):
    if common_safe(relative):
        selected.add(relative)
        safe_untracked += 1

if not selected:
    raise SystemExit('ERROR: codebase file list is empty')
output_path.write_text(
    '\n'.join(sorted(selected)) + '\n',
    encoding='utf-8',
    newline='\n',
)
print(f'safe_untracked_files_included={safe_untracked}')
print(f'total_files_listed={len(selected)}')
PYSELECT

[[ -s "$LIST_FILE" ]] || {
  printf 'ERROR: generated file list is empty.\n' >&2
  exit 1
}

printf '== create local codebase zip ==\n'
printf 'script_version=%s\n' "$SCRIPT_VERSION"
printf 'local=%s\n' "$LOCAL_CODEBASE_ZIP"
printf 'state_dir_contract=outside_repository\n'
printf 'publish_contract=validated_temp_archive_then_atomic_replace\n'
printf 'mode=Git-aware store-only ZIP; tracked files and safe untracked implementation files included\n'

if [[ "$ARCHIVER" == "7z" ]]; then
  printf 'archiver=7z\n'
  7z a \
    -tzip \
    -mx=0 \
    -mmt=on \
    -bb0 \
    -bsp0 \
    -scsUTF-8 \
    "$TMP_CODEBASE" \
    "@$LIST_FILE" \
    >/dev/null
else
  printf 'archiver=python3_zipfile_store_only\n'
  python3 - "$TMP_CODEBASE" "$LIST_FILE" <<'PYZIP'
from __future__ import annotations

import sys
import zipfile
from pathlib import Path

target = Path(sys.argv[1])
list_file = Path(sys.argv[2])
paths = [line for line in list_file.read_text(encoding='utf-8').splitlines() if line]
with zipfile.ZipFile(target, 'w', compression=zipfile.ZIP_STORED, allowZip64=True) as archive:
    for relative in paths:
        source = Path(relative)
        if not source.is_file():
            raise SystemExit(f'ERROR: listed codebase file disappeared: {relative}')
        archive.write(source, arcname=relative, compress_type=zipfile.ZIP_STORED)
PYZIP
fi

[[ -s "$TMP_CODEBASE" ]] || {
  printf 'ERROR: archiver failed or produced an empty archive.\n' >&2
  exit 1
}

python3 - "$TMP_CODEBASE" <<'PYVERIFY'
from __future__ import annotations

import sys
import zipfile
from pathlib import PurePosixPath

archive_path = sys.argv[1]
required = {
    'README.md',
    'PROJECT_STATUS.md',
    'package.json',
    'run-autonomous-implementation.sh',
    'scripts/validate_repo.py',
}
forbidden_names = {
    '.env', '.env.local', 'id_rsa', 'id_ed25519', 'credentials.json',
    'secrets.json', 'autonomous-handoff.manifest.json',
}
with zipfile.ZipFile(archive_path) as archive:
    names: set[str] = set()
    for info in archive.infolist():
        path = PurePosixPath(info.filename)
        if path.is_absolute() or '..' in path.parts:
            raise SystemExit(f'ERROR: unsafe archive path: {info.filename}')
        if any(part in {'.git', '.github', 'node_modules', '__pycache__', 'artifacts', 'dist', '.locks'} for part in path.parts):
            raise SystemExit(f'ERROR: forbidden archive path: {info.filename}')
        if path.suffix == '.pyc':
            raise SystemExit(f'ERROR: generated Python cache entered archive: {info.filename}')
        if path.name.lower() in forbidden_names:
            raise SystemExit(f'ERROR: secret-like or generated handoff file entered archive: {info.filename}')
        if path.suffix.lower() in {'.zip', '.tar', '.tgz', '.7z', '.rar'}:
            raise SystemExit(f'ERROR: generated archive nested itself: {info.filename}')
        names.add(info.filename)
    missing = sorted(required - names)
    if missing:
        raise SystemExit(f'ERROR: codebase archive missing required files: {missing}')
print(f'archive_entries={len(names)}')
PYVERIFY

python3 scripts/validate_artifact_hygiene.py --codebase-zip "$TMP_CODEBASE" >/dev/null

mv -f -- "$TMP_CODEBASE" "$LOCAL_CODEBASE_ZIP"
trap - EXIT INT TERM HUP
cleanup

printf '\n== done ==\n'
ls -lh "$LOCAL_CODEBASE_ZIP"
printf 'sha256=%s\n' "$(sha256sum "$LOCAL_CODEBASE_ZIP" | awk '{print $1}')"
printf '\nCreated:\n%s\n' "$LOCAL_CODEBASE_ZIP"
printf 'Shell intentionally kept open.\n'
