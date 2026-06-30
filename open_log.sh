#!/usr/bin/env bash
set -u -o pipefail

TAIL_LINES="${TAIL_LINES:-160}"
MODE="controller"

usage() {
  cat <<'USAGE'
Usage: ./open_log.sh [--controller] [--codex] [--cycle N] [--tail N]

Tails autonomous controller or Codex logs. Read-only.
USAGE
}

CYCLE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --controller) MODE="controller"; shift ;;
    --codex) MODE="codex"; shift ;;
    --cycle) [[ $# -ge 2 ]] || { echo "ERROR: --cycle requires a value" >&2; exit 1; }; CYCLE="$2"; shift 2 ;;
    --tail) [[ $# -ge 2 ]] || { echo "ERROR: --tail requires a value" >&2; exit 1; }; TAIL_LINES="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "ERROR: unknown option: $1" >&2; usage >&2; exit 1 ;;
  esac
done

[[ "$TAIL_LINES" =~ ^[1-9][0-9]*$ ]] || { echo "ERROR: --tail must be a positive integer" >&2; exit 1; }

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$repo_root"
latest_run="$(find artifacts -maxdepth 1 -type d -name 'autonomous_surebet_implementation_*' 2>/dev/null | sort | tail -n 1)"
[[ -n "$latest_run" ]] || { echo "ERROR: no autonomous run directory found" >&2; exit 1; }

if [[ "$MODE" == "controller" ]]; then
  log_file="$latest_run/controller.log"
else
  if [[ -z "$CYCLE" ]]; then
    cycle_dir="$(find "$latest_run" -maxdepth 1 -type d -name 'cycle_*' | sort | tail -n 1)"
  else
    cycle_dir="$latest_run/cycle_${CYCLE}"
  fi
  log_file="$cycle_dir/codex.log"
fi

[[ -f "$log_file" ]] || { echo "ERROR: log not found: $log_file" >&2; exit 1; }
echo "log_file=$log_file"
tail -n "$TAIL_LINES" "$log_file"
