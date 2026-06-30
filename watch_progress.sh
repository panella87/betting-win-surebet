#!/usr/bin/env bash
set -u -o pipefail

INTERVAL_SECONDS="${WATCH_PROGRESS_INTERVAL_SECONDS:-10}"
MODE="loop"

usage() {
  cat <<'USAGE'
Usage: ./watch_progress.sh [--once] [--loop] [--interval N]

Read-only autonomous progress watcher. Does not start, stop, kill, or mutate anything.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --once) MODE="once"; shift ;;
    --loop) MODE="loop"; shift ;;
    --interval)
      [[ $# -ge 2 ]] || { echo "ERROR: --interval requires a value" >&2; exit 1; }
      INTERVAL_SECONDS="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "ERROR: unknown option: $1" >&2; usage >&2; exit 1 ;;
  esac
done

[[ "$INTERVAL_SECONDS" =~ ^[1-9][0-9]*$ ]] || { echo "ERROR: interval must be a positive integer" >&2; exit 1; }

while true; do
  clear 2>/dev/null || true
  date -u '+now_utc=%Y-%m-%dT%H:%M:%SZ'
  ./check_progress.sh
  [[ "$MODE" == "once" ]] && exit 0
  sleep "$INTERVAL_SECONDS"
done
