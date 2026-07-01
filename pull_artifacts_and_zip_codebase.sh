#!/usr/bin/env bash
set -euo pipefail

SCRIPT_VERSION="2026-06-30.surebet-v2-repo-local-zip-codebase"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
INVOCATION_DIR="$(pwd -P)"
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/.env}"
LOCAL_ROOT="${LOCAL_ROOT:-$SCRIPT_DIR}"
LOCAL_OUTPUT_DIR="${LOCAL_OUTPUT_DIR:-$INVOCATION_DIR}"

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'USAGE'
Usage: ./pull_artifacts_and_zip_codebase.sh

Pulls remote artifacts.zip when present and creates a local clean codebase zip.
Requires .env with SSH_HOST, SSH_USER, SSH_PASSWORD, and REMOTE_REPO.
The codebase archive is created by repo-local ./zip_codebase.sh.
The local numbering scans existing artifacts*.zip and betting-win-surebet*.zip files,
including browser duplicate names such as betting-win-surebet1(2).zip.
USAGE
  exit 0
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: env file not found: $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

: "${SSH_HOST:?Missing SSH_HOST in .env}"
: "${SSH_USER:?Missing SSH_USER in .env}"
: "${SSH_PASSWORD:?Missing SSH_PASSWORD in .env}"
: "${REMOTE_REPO:?Missing REMOTE_REPO in .env}"

REMOTE_REPO="${REMOTE_REPO%/}"
REMOTE_ARTIFACT="$REMOTE_REPO/artifacts.zip"
CODEBASE_PREFIX="$(basename "$REMOTE_REPO")"
ARTIFACTS_PREFIX="artifacts"

for command in sshpass ssh scp python3 sha256sum bash; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "ERROR: required command missing: $command" >&2
    case "$command" in
      sshpass) echo "Install on Ubuntu/Debian/WSL: sudo apt update && sudo apt install -y sshpass" >&2 ;;
      ssh|scp) echo "Install on Ubuntu/Debian/WSL: sudo apt update && sudo apt install -y openssh-client" >&2 ;;
    esac
    exit 1
  fi
done

if [[ ! -d "$LOCAL_ROOT" ]]; then
  echo "ERROR: local root not found: $LOCAL_ROOT" >&2
  exit 1
fi
LOCAL_ROOT="$(cd "$LOCAL_ROOT" && pwd -P)"
if [[ ! -f "$LOCAL_ROOT/zip_codebase.sh" ]]; then
  echo "ERROR: repo zip_codebase.sh not found: $LOCAL_ROOT/zip_codebase.sh" >&2
  exit 1
fi
mkdir -p "$LOCAL_OUTPUT_DIR"
LOCAL_OUTPUT_DIR="$(cd "$LOCAL_OUTPUT_DIR" && pwd -P)"

next_number_for_prefix() {
  local prefix="$1"
  python3 - "$prefix" "$LOCAL_OUTPUT_DIR" "$SCRIPT_DIR" "$INVOCATION_DIR" <<'PYNUM'
from pathlib import Path
import re
import sys

prefix = sys.argv[1]
roots = []
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

remote_artifact_size() {
  SSHPASS="$SSH_PASSWORD" sshpass -e ssh \
    -o StrictHostKeyChecking=accept-new \
    -o UserKnownHostsFile="$HOME/.ssh/known_hosts" \
    "${SSH_USER}@${SSH_HOST}" \
    bash -s -- "$REMOTE_ARTIFACT" <<'REMOTE_SH'
set -euo pipefail
artifact="$1"
if [[ ! -s "$artifact" ]]; then
  exit 2
fi
wc -c < "$artifact"
REMOTE_SH
}

download_remote_artifact() {
  local target="$1"
  local tmp_download="$2"
  local remote_size=""
  local status=""
  local downloaded_size=""

  echo "== check remote artifacts.zip =="
  echo "remote=${SSH_USER}@${SSH_HOST}:${REMOTE_ARTIFACT}"
  echo "local=$target"

  set +e
  remote_size="$(remote_artifact_size 2>/dev/null)"
  status="$?"
  set -e
  if [[ "$status" -eq 2 ]]; then
    echo "remote_artifact=missing"
    echo "action=skip artifact download"
    return 2
  fi
  if [[ "$status" -ne 0 ]]; then
    echo "ERROR: remote artifact check failed." >&2
    return 1
  fi
  if [[ ! "$remote_size" =~ ^[1-9][0-9]*$ ]]; then
    echo "ERROR: invalid remote artifact size: $remote_size" >&2
    return 1
  fi

  rm -f -- "$tmp_download"
  if command -v pv >/dev/null 2>&1; then
    echo "download_progress=pv"
    echo "remote_size_bytes=$remote_size"
    if ! SSHPASS="$SSH_PASSWORD" sshpass -e ssh \
      -o StrictHostKeyChecking=accept-new \
      -o UserKnownHostsFile="$HOME/.ssh/known_hosts" \
      "${SSH_USER}@${SSH_HOST}" \
      bash -s -- "$REMOTE_ARTIFACT" <<'REMOTE_SH' | pv -s "$remote_size" > "$tmp_download"
set -euo pipefail
cat -- "$1"
REMOTE_SH
    then
      rm -f -- "$tmp_download"
      echo "ERROR: pv download failed for remote artifact: $REMOTE_ARTIFACT" >&2
      return 1
    fi
  else
    echo "download_progress=scp_default"
    echo "hint=install pv locally for explicit progress bar: sudo apt update && sudo apt install -y pv"
    if ! SSHPASS="$SSH_PASSWORD" sshpass -e scp \
      -o StrictHostKeyChecking=accept-new \
      -o UserKnownHostsFile="$HOME/.ssh/known_hosts" \
      "${SSH_USER}@${SSH_HOST}:${REMOTE_ARTIFACT}" \
      "$tmp_download"; then
      rm -f -- "$tmp_download"
      echo "ERROR: scp failed for remote artifact: $REMOTE_ARTIFACT" >&2
      return 1
    fi
  fi

  if [[ ! -s "$tmp_download" ]]; then
    rm -f -- "$tmp_download"
    echo "ERROR: downloaded artifact is missing or empty." >&2
    return 1
  fi
  downloaded_size="$(wc -c < "$tmp_download")"
  if [[ "$downloaded_size" != "$remote_size" ]]; then
    rm -f -- "$tmp_download"
    echo "ERROR: downloaded artifact byte size mismatch: remote=$remote_size local=$downloaded_size" >&2
    return 1
  fi

  mv -- "$tmp_download" "$target"
  return 0
}

ARTIFACT_N="$(next_number_for_prefix "$ARTIFACTS_PREFIX")"
CODEBASE_N="$(next_number_for_prefix "$CODEBASE_PREFIX")"
LOCAL_ARTIFACT_ZIP="$LOCAL_OUTPUT_DIR/${ARTIFACTS_PREFIX}${ARTIFACT_N}.zip"
LOCAL_CODEBASE_ZIP="$LOCAL_OUTPUT_DIR/${CODEBASE_PREFIX}${CODEBASE_N}.zip"
TMP_DIR="$(mktemp -d "$LOCAL_OUTPUT_DIR/.betting-win-surebet-pull.XXXXXX")"
TMP_DOWNLOAD="$TMP_DIR/${ARTIFACTS_PREFIX}${ARTIFACT_N}.download.tmp.zip"
TMP_CODEBASE="$TMP_DIR/${CODEBASE_PREFIX}${CODEBASE_N}.tmp.zip"
ARTIFACT_CREATED="no"

cleanup() {
  rm -rf -- "$TMP_DIR"
}
trap cleanup EXIT INT TERM HUP

for target in "$LOCAL_ARTIFACT_ZIP" "$LOCAL_CODEBASE_ZIP"; do
  if [[ -e "$target" ]]; then
    echo "ERROR: target already exists: $target" >&2
    exit 1
  fi
done

if download_remote_artifact "$LOCAL_ARTIFACT_ZIP" "$TMP_DOWNLOAD"; then
  ARTIFACT_CREATED="yes"
else
  DOWNLOAD_STATUS="$?"
  if [[ "$DOWNLOAD_STATUS" -eq 2 ]]; then
    ARTIFACT_CREATED="skipped_missing_remote"
  else
    echo "ERROR: artifact download failed." >&2
    exit 1
  fi
fi

echo
echo "== create local codebase zip =="
echo "local=$LOCAL_CODEBASE_ZIP"
echo "local_contract=repo zip_codebase.sh"

CODEBASE_OUTPUT="$TMP_CODEBASE" LOCAL_ROOT="$LOCAL_ROOT" CODEBASE_OVERWRITE=0 bash "$LOCAL_ROOT/zip_codebase.sh"
if [[ ! -s "$TMP_CODEBASE" ]]; then
  echo "ERROR: codebase zip was not created or is empty." >&2
  exit 1
fi
mv -- "$TMP_CODEBASE" "$LOCAL_CODEBASE_ZIP"

trap - EXIT INT TERM HUP
cleanup

echo
echo "== done =="
if [[ "$ARTIFACT_CREATED" == "yes" ]]; then
  ls -lh "$LOCAL_ARTIFACT_ZIP" "$LOCAL_CODEBASE_ZIP"
else
  ls -lh "$LOCAL_CODEBASE_ZIP"
fi

echo
echo "Created:"
if [[ "$ARTIFACT_CREATED" == "yes" ]]; then
  echo "$LOCAL_ARTIFACT_ZIP"
else
  echo "artifact zip skipped because remote file does not exist: $REMOTE_ARTIFACT"
fi
echo "$LOCAL_CODEBASE_ZIP"

echo
sha256sum "$LOCAL_CODEBASE_ZIP"
if [[ "$ARTIFACT_CREATED" == "yes" ]]; then
  sha256sum "$LOCAL_ARTIFACT_ZIP"
fi

echo "Shell intentionally kept open."
