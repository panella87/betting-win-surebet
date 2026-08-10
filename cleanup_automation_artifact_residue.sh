#!/usr/bin/env bash
# Safely remove repo-local transient test/release residue from artifacts/.
# Canonical controller runs and operator evidence are never selected by this script.
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_DIR_OVERRIDE=""
MODE="plan"
MIN_AGE_SECONDS=3600
REBUILD_ARCHIVE=0
ZIP_TIMEOUT_RAW="30m"

usage() {
  cat <<'EOF_USAGE'
Usage:
  ./cleanup_automation_artifact_residue.sh [options]

Options:
  --apply                       Remove allowlisted transient artifact residue.
  --plan                        Print candidates only (default).
  --min-age-seconds N           Only select entries at least N seconds old (default: 3600).
  --rebuild-artifacts-zip       Atomically rebuild root artifacts.zip after cleanup.
  --zip-timeout VALUE           Rebuild timeout (default: 30m).
  --repo-dir PATH               Override repository root discovery.
  --help                        Show this help.

Safety:
  Only explicit top-level test/release scratch names and symlink nodes below exact
  autonomous child cycles/cycle_N/repro/ trees are eligible. Regular repro files,
  canonical controller runs, private-paper reports, runtime evidence, handoffs,
  watchdog events, and other operator evidence are preserved.
EOF_USAGE
}

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --apply) MODE="apply"; shift ;;
    --plan) MODE="plan"; shift ;;
    --min-age-seconds) MIN_AGE_SECONDS="${2:?missing value for --min-age-seconds}"; shift 2 ;;
    --rebuild-artifacts-zip) REBUILD_ARCHIVE=1; shift ;;
    --zip-timeout) ZIP_TIMEOUT_RAW="${2:?missing value for --zip-timeout}"; shift 2 ;;
    --repo-dir) REPO_DIR_OVERRIDE="${2:?missing value for --repo-dir}"; shift 2 ;;
    --help|-h) usage; exit 0 ;;
    *) printf 'ERROR: unknown option: %s\n' "$1" >&2; usage >&2; exit 2 ;;
  esac
done

[[ "$MIN_AGE_SECONDS" =~ ^[0-9]+$ ]] || {
  printf 'ERROR: --min-age-seconds must be a non-negative integer; got %q.\n' "$MIN_AGE_SECONDS" >&2
  exit 2
}
if [[ "$REBUILD_ARCHIVE" == "1" && "$MODE" != "apply" ]]; then
  printf '%s\n' 'ERROR: --rebuild-artifacts-zip requires --apply.' >&2
  exit 2
fi

if [[ -n "$REPO_DIR_OVERRIDE" ]]; then
  REPO="$REPO_DIR_OVERRIDE"
else
  REPO="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null)" || {
    printf '%s\n' 'ERROR: cleanup must run from a Git repository containing this script.' >&2
    exit 2
  }
fi
REPO="$(realpath -e -- "$REPO")"
[[ "$SCRIPT_DIR" == "$REPO" ]] || {
  printf 'ERROR: cleanup script must be the repository-root script: %s\n' "$REPO/cleanup_automation_artifact_residue.sh" >&2
  exit 2
}
[[ -d "$REPO/.git" && ! -L "$REPO/.git" ]] || {
  printf 'ERROR: repository root is not a normal Git checkout: %s\n' "$REPO" >&2
  exit 2
}

# shellcheck source=.automation/lib/run_common.sh
. "$REPO/.automation/lib/run_common.sh"
# shellcheck source=.automation/lib/controller_hardening_v2.sh
. "$REPO/.automation/lib/controller_hardening_v2.sh"

printf 'artifact_cleanup_repo=%s\n' "$REPO"
printf 'artifact_cleanup_mode=%s\n' "$MODE"
printf 'artifact_cleanup_min_age_seconds=%s\n' "$MIN_AGE_SECONDS"

automation_cleanup_transient_artifact_residue "$REPO" "$MODE" "$MIN_AGE_SECONDS"

if [[ "$REBUILD_ARCHIVE" == "1" ]]; then
  ZIP_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "$ZIP_TIMEOUT_RAW")" || {
    printf 'ERROR: invalid --zip-timeout value: %s\n' "$ZIP_TIMEOUT_RAW" >&2
    exit 2
  }
  TMP_ARCHIVE="$REPO/.artifacts.cleanup-rebuild.$$.zip"
  trap 'rm -f -- "$TMP_ARCHIVE"' EXIT
  rm -f -- "$TMP_ARCHIVE"
  automation_v2_zip_with_timeout "$ZIP_TIMEOUT_SECONDS" "$TMP_ARCHIVE" "$REPO" artifacts
  unzip -tq "$TMP_ARCHIVE" >/dev/null
  mv -f -- "$TMP_ARCHIVE" "$REPO/artifacts.zip"
  trap - EXIT
  printf 'artifact_archive_rebuilt=%s\n' "$REPO/artifacts.zip"
  printf 'artifact_archive_size_bytes=%s\n' "$(stat -c '%s' "$REPO/artifacts.zip")"
  printf 'artifact_archive_entry_count=%s\n' "$(zipinfo -1 "$REPO/artifacts.zip" | wc -l | tr -d '[:space:]')"
fi

printf '%s\n' 'AUTOMATION_ARTIFACT_RESIDUE_CLEANUP_OK'
