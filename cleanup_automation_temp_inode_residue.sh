#!/usr/bin/env bash
# Bounded cleanup for repository-owned automation temp sessions and one confirmed legacy test prefix.
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
AUTOMATION_REPO_ROOT="$SCRIPT_DIR"
# shellcheck source=.automation/lib/temp_inode_guard.sh
. "$SCRIPT_DIR/.automation/lib/temp_inode_guard.sh"

MODE=dry-run
MIN_AGE_SECONDS=3600

usage() {
  cat <<'USAGE'
Usage: ./cleanup_automation_temp_inode_residue.sh [--dry-run|--apply] [--min-age-seconds N]

Dry-run is the default. The command operates only on:
  1. marker-owned dead sessions under .automation/tmp/sessions; and
  2. direct children of the active system temp directory named
     bws-paper-runtime-evidence-* that are older than the requested age.

It never kills processes, follows symlinks, removes the managed base, or performs
a generic /tmp purge.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) MODE=dry-run; shift ;;
    --apply) MODE=apply; shift ;;
    --min-age-seconds)
      [[ $# -ge 2 ]] || { echo 'ERROR: --min-age-seconds requires a value' >&2; exit 2; }
      MIN_AGE_SECONDS="$2"; shift 2 ;;
    --min-age-seconds=*) MIN_AGE_SECONDS="${1#*=}"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "ERROR: unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

_automation_temp_require_uint MIN_AGE_SECONDS "$MIN_AGE_SECONDS" 0 2592000
command -v timeout >/dev/null 2>&1 || { echo 'ERROR: required command not found: timeout' >&2; exit 127; }
command -v find >/dev/null 2>&1 || { echo 'ERROR: required command not found: find' >&2; exit 127; }
command -v realpath >/dev/null 2>&1 || { echo 'ERROR: required command not found: realpath' >&2; exit 127; }
command -v stat >/dev/null 2>&1 || { echo 'ERROR: required command not found: stat' >&2; exit 127; }

automation_temp_inode_configure
_automation_temp_prepare_base
automation_temp_inode_print_filesystem_state BEFORE

failures=0
automation_temp_inode_recover_stale "$MODE" "$MIN_AGE_SECONDS" || failures=1

cleanup_legacy_prefix() {
  local temp_root candidate_file candidate real parent base mtime age now rc=0
  temp_root="${AUTOMATION_LEGACY_SYSTEM_TEMP_ROOT:-${TMPDIR:-/tmp}}"
  [[ -d "$temp_root" && ! -L "$temp_root" ]] || {
    printf 'legacy_temp_scan=skipped reason=unsafe_or_missing root=%s\n' "$temp_root"
    return 0
  }
  temp_root="$(realpath -e -- "$temp_root")" || return 2
  [[ "$temp_root" != / && "$temp_root" != "$AUTOMATION_TEMP_REPO_REALPATH" ]] || {
    printf 'ERROR: refusing unsafe legacy temp root: %s\n' "$temp_root" >&2
    return 2
  }
  candidate_file="$AUTOMATION_TEMP_BASE/.legacy-scan.$$.$RANDOM"
  set +e
  timeout --signal=TERM --kill-after=2s "${AUTOMATION_TEMP_USAGE_SCAN_TIMEOUT_SECONDS}s" \
    find "$temp_root" -xdev -mindepth 1 -maxdepth 1 -type d -name 'bws-paper-runtime-evidence-*' -print0 > "$candidate_file"
  rc=$?
  set -e
  if [[ "$rc" -ne 0 ]]; then
    rm -f -- "$candidate_file"
    printf 'ERROR: legacy temp scan failed or timed out: exit=%s\n' "$rc" >&2
    return 2
  fi
  now="$(date -u +%s)"
  while IFS= read -r -d '' candidate; do
    [[ -d "$candidate" && ! -L "$candidate" ]] || { failures=1; continue; }
    real="$(realpath -e -- "$candidate" 2>/dev/null)" || { failures=1; continue; }
    parent="$(dirname -- "$real")"
    base="$(basename -- "$real")"
    [[ "$parent" == "$temp_root" && "$base" == bws-paper-runtime-evidence-* ]] || {
      printf 'legacy_temp_rejected=%s reason=path_boundary\n' "$candidate" >&2
      failures=1
      continue
    }
    mtime="$(stat -c %Y -- "$real" 2>/dev/null)" || { failures=1; continue; }
    [[ "$mtime" =~ ^[0-9]+$ ]] || { failures=1; continue; }
    age=$(( now - mtime ))
    if (( age < MIN_AGE_SECONDS )); then
      printf 'legacy_temp_retained=%s age_seconds=%s\n' "$real" "$age"
      continue
    fi
    if [[ "$MODE" == dry-run ]]; then
      printf 'would_remove_legacy_temp=%s age_seconds=%s\n' "$real" "$age"
    else
      if timeout --signal=TERM --kill-after=5s "${AUTOMATION_TEMP_CLEANUP_TIMEOUT_SECONDS}s" \
        rm -rf --one-file-system -- "$real" && [[ ! -e "$real" ]]; then
        printf 'removed_legacy_temp=%s age_seconds=%s\n' "$real" "$age"
      else
        printf 'ERROR: failed to remove legacy temp: %s\n' "$real" >&2
        failures=1
      fi
    fi
  done < "$candidate_file"
  rm -f -- "$candidate_file"
}

cleanup_legacy_prefix || failures=1
automation_temp_inode_print_filesystem_state AFTER
printf 'cleanup_mode=%s\n' "$MODE"
printf 'cleanup_failures=%s\n' "$failures"
[[ "$failures" -eq 0 ]]
