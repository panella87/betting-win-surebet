#!/usr/bin/env bash
set -u -o pipefail

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Usage: ./pull_artifacts_and_zip_codebase.sh

Pulls remote artifacts.zip when present and creates a local clean codebase zip.
Requires .env with SSH_HOST, SSH_USER, SSH_PASSWORD, and REMOTE_REPO.
The local numbering scans existing artifacts*.zip and betting-win-surebet*.zip first,
then uses the next highest suffix to avoid overwriting or recreating lower numbers.
EOF
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/.env}"

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
LOCAL_ROOT="${LOCAL_ROOT:-$SCRIPT_DIR}"
CODEBASE_PREFIX="$(basename "$REMOTE_REPO")"
ARTIFACTS_PREFIX="artifacts"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: missing required command: $1" >&2
    case "$1" in
      sshpass) echo "Install hint: sudo apt update && sudo apt install -y sshpass" >&2 ;;
      7z) echo "Install hint: sudo apt update && sudo apt install -y p7zip-full" >&2 ;;
    esac
    exit 1
  fi
}

require_command sshpass
require_command ssh
require_command scp
require_command python3
if ! command -v 7z >/dev/null 2>&1 && ! command -v zip >/dev/null 2>&1; then
  echo "ERROR: missing required archiver: install 7z or zip" >&2
  exit 1
fi

cd "$LOCAL_ROOT" || { echo "ERROR: cannot cd into local root: $LOCAL_ROOT" >&2; exit 1; }

next_number_for_prefix() {
  local prefix="$1" max_num=0 file base suffix num
  shopt -s nullglob
  for file in "${prefix}"*.zip; do
    base="$(basename "$file")"
    if [[ "$base" == "${prefix}.zip" ]]; then
      num=0
    else
      suffix="${base#"$prefix"}"
      suffix="${suffix%.zip}"
      if [[ "$suffix" =~ ^[0-9]+$ ]]; then
        num="$suffix"
      else
        continue
      fi
    fi
    if (( num > max_num )); then max_num="$num"; fi
  done
  shopt -u nullglob
  echo $((max_num + 1))
}

remote_artifact_exists() {
  SSHPASS="$SSH_PASSWORD" sshpass -e ssh \
    -o StrictHostKeyChecking=accept-new \
    -o UserKnownHostsFile="$HOME/.ssh/known_hosts" \
    "${SSH_USER}@${SSH_HOST}" \
    test -s "$REMOTE_ARTIFACT"
}

download_remote_artifact() {
  local target="$1" tmp="$2"
  rm -f "$tmp"
  if command -v pv >/dev/null 2>&1; then
    local remote_size
    remote_size="$(SSHPASS="$SSH_PASSWORD" sshpass -e ssh -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile="$HOME/.ssh/known_hosts" "${SSH_USER}@${SSH_HOST}" "wc -c < '$REMOTE_ARTIFACT'")"
    SSHPASS="$SSH_PASSWORD" sshpass -e ssh \
      -o StrictHostKeyChecking=accept-new \
      -o UserKnownHostsFile="$HOME/.ssh/known_hosts" \
      "${SSH_USER}@${SSH_HOST}" \
      "cat '$REMOTE_ARTIFACT'" | pv -s "$remote_size" > "$tmp"
  else
    SSHPASS="$SSH_PASSWORD" sshpass -e scp \
      -o StrictHostKeyChecking=accept-new \
      -o UserKnownHostsFile="$HOME/.ssh/known_hosts" \
      "${SSH_USER}@${SSH_HOST}:${REMOTE_ARTIFACT}" \
      "$tmp"
  fi
  [[ -s "$tmp" ]] || { rm -f "$tmp"; echo "ERROR: downloaded artifact is empty" >&2; return 1; }
  mv "$tmp" "$target"
}

create_codebase_zip() {
  local target="$1"
  rm -f "$target"
  node scripts/restore-required-executable-bits.js >/dev/null
  python3 scripts/validate_artifact_hygiene.py >/dev/null
  if command -v 7z >/dev/null 2>&1; then
    7z a -tzip -mx=0 -mmt=on -bb0 -bsp0 "$target" . \
      -xr'!.git' -xr'!.github' -xr'!.locks' -xr'!artifacts' -xr'!node_modules' \
      -xr'!dist' -xr'!coverage' -xr'!output' -xr'!tmp' -xr'!.tmp' \
      -x'!.env' -x'!true' -xr'!*.zip' -xr'!*.tar' -xr'!*.tar.gz' -xr'!*.tgz' \
      -xr'!*.tap' -xr'!*.tap.log' -xr'!*.stdout.log' -xr'!*.stderr.log' -xr'!*.log' >/dev/null
  else
    zip -r -q "$target" . \
      -x './.git/*' './.github/*' './.locks/*' './artifacts/*' './node_modules/*' \
      './dist/*' './coverage/*' './output/*' './tmp/*' './.tmp/*' './.env' './true' \
      '*.zip' '*.tar' '*.tar.gz' '*.tgz' '*.tap' '*.tap.log' '*.stdout.log' '*.stderr.log' '*.log'
  fi
  [[ -s "$target" ]] || { rm -f "$target"; echo "ERROR: codebase zip is empty" >&2; return 1; }
  python3 scripts/validate_artifact_hygiene.py --codebase-zip "$target" >/dev/null
}

ARTIFACT_N="$(next_number_for_prefix "$ARTIFACTS_PREFIX")"
CODEBASE_N="$(next_number_for_prefix "$CODEBASE_PREFIX")"
LOCAL_ARTIFACT_ZIP="${ARTIFACTS_PREFIX}${ARTIFACT_N}.zip"
LOCAL_CODEBASE_ZIP="${CODEBASE_PREFIX}${CODEBASE_N}.zip"
TMP_DOWNLOAD=".${ARTIFACTS_PREFIX}_${ARTIFACT_N}.download.tmp.zip"
TMP_CODEBASE=".${CODEBASE_PREFIX}_${CODEBASE_N}.tmp.zip"

rm -f "$TMP_DOWNLOAD" "$TMP_CODEBASE"

echo "== check remote artifacts.zip =="
echo "remote=${SSH_USER}@${SSH_HOST}:${REMOTE_ARTIFACT}"
if remote_artifact_exists; then
  echo "remote_artifact=exists"
  download_remote_artifact "$LOCAL_ARTIFACT_ZIP" "$TMP_DOWNLOAD" || exit 1
  ARTIFACT_CREATED=yes
else
  echo "remote_artifact=missing"
  ARTIFACT_CREATED=skipped_missing_remote
fi

echo
echo "== create local codebase zip =="
echo "local=$LOCAL_CODEBASE_ZIP"
create_codebase_zip "$TMP_CODEBASE" || exit 1
mv "$TMP_CODEBASE" "$LOCAL_CODEBASE_ZIP"

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
echo "Shell intentionally kept open."
