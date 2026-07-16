#!/usr/bin/env bash
set -u -o pipefail
INTERVAL_SECONDS="${WATCH_PROGRESS_INTERVAL_SECONDS:-10}"
MODE="loop"
FAST=0
BASE_URL=""
usage() { cat <<'USAGE'
Usage: ./watch_progress.sh [--once] [--loop] [--fast] [--interval N] [--base-url URL]

Read-only progress watcher. For betting-win-surebet the default view combines local
automation artifacts with product runtime state; --base-url is accepted only for workflow compatibility.
USAGE
}
while [[ $# -gt 0 ]]; do
  case "$1" in
    --once) MODE="once"; shift ;;
    --loop) MODE="loop"; shift ;;
    --fast) FAST=1; INTERVAL_SECONDS="2"; shift ;;
    --interval) [[ $# -ge 2 ]] || { echo "ERROR: --interval requires a value" >&2; exit 1; }; INTERVAL_SECONDS="$2"; shift 2 ;;
    --base-url) [[ $# -ge 2 ]] || { echo "ERROR: --base-url requires a value" >&2; exit 1; }; BASE_URL="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "ERROR: unknown option: $1" >&2; usage >&2; exit 1 ;;
  esac
done
[[ "$INTERVAL_SECONDS" =~ ^[1-9][0-9]*$ ]] || { echo "ERROR: interval must be a positive integer" >&2; exit 1; }
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$repo_root" || exit 1
while true; do
  [[ "$MODE" != "once" ]] && clear 2>/dev/null || true
  date -u '+now_utc=%Y-%m-%dT%H:%M:%SZ'
  if [[ -n "$BASE_URL" ]]; then
    echo "base_url_accepted_for_compatibility=$BASE_URL"
    echo "progress_source=local_artifacts_no_service"
  fi
  if [[ "$FAST" = "1" ]]; then TAIL_LINES="${TAIL_LINES:-40}" ./check_progress.sh; else ./check_progress.sh; fi
  [[ "$MODE" == "once" ]] && exit 0
  sleep "$INTERVAL_SECONDS"
done
