#!/usr/bin/env bash
set -u -o pipefail
# Artifact layout marker: cycles/cycle_N
TAIL_LINES="${TAIL_LINES:-160}"
MODE="controller"
CYCLE=""
RUN_DIR=""
usage() { cat <<'USAGE'
Usage: ./open_log.sh [--controller|--codex|--paper] [--cycle N] [--tail N] [--run-dir PATH]

Tails automation logs from the latest local artifact run. Read-only.
USAGE
}
while [[ $# -gt 0 ]]; do
  case "$1" in
    --controller) MODE="controller"; shift ;;
    --codex) MODE="codex"; shift ;;
    --paper) MODE="paper"; shift ;;
    --cycle) [[ $# -ge 2 ]] || { echo "ERROR: --cycle requires a value" >&2; exit 1; }; CYCLE="$2"; shift 2 ;;
    --tail) [[ $# -ge 2 ]] || { echo "ERROR: --tail requires a value" >&2; exit 1; }; TAIL_LINES="$2"; shift 2 ;;
    --run-dir) [[ $# -ge 2 ]] || { echo "ERROR: --run-dir requires a value" >&2; exit 1; }; RUN_DIR="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "ERROR: unknown option: $1" >&2; usage >&2; exit 1 ;;
  esac
done
[[ "$TAIL_LINES" =~ ^[1-9][0-9]*$ ]] || { echo "ERROR: --tail must be a positive integer" >&2; exit 1; }
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$repo_root" || exit 1
if [[ -z "$RUN_DIR" ]]; then
  RUN_DIR="$(find artifacts -maxdepth 1 -type d \( -name 'autonomous_implementation_*' -o -name 'autonomous_bugfix_*' -o -name 'paper_evaluation_*' -o -name 'autonomous_surebet_implementation_*' \) -print 2>/dev/null | sort | tail -n 1)"
fi
[[ -n "$RUN_DIR" && -d "$RUN_DIR" ]] || { echo "ERROR: no automation run directory found" >&2; exit 1; }
resolve_cycle_dir() {
  local run_dir="$1" cycle="$2" latest=""
  if [[ -n "$cycle" ]]; then
    [[ -d "$run_dir/cycles/cycle_${cycle}" ]] && { printf '%s\n' "$run_dir/cycles/cycle_${cycle}"; return 0; }
    [[ -d "$run_dir/cycle_${cycle}" ]] && { printf '%s\n' "$run_dir/cycle_${cycle}"; return 0; }
    return 1
  fi
  [[ -d "$run_dir/cycles" ]] && latest="$(find "$run_dir/cycles" -maxdepth 1 -type d -name 'cycle_*' -print 2>/dev/null | sort -V | tail -n 1)"
  [[ -z "$latest" ]] && latest="$(find "$run_dir" -maxdepth 1 -type d -name 'cycle_*' -print 2>/dev/null | sort -V | tail -n 1)"
  [[ -n "$latest" ]] || return 1
  printf '%s\n' "$latest"
}
case "$MODE" in
  controller) log_file="$RUN_DIR/controller.log" ;;
  codex) cycle_dir="$(resolve_cycle_dir "$RUN_DIR" "$CYCLE")" || { echo "ERROR: cycle directory not found" >&2; exit 1; }; log_file="$cycle_dir/codex.log" ;;
  paper) cycle_dir="$(resolve_cycle_dir "$RUN_DIR" "$CYCLE")" || { echo "ERROR: cycle directory not found" >&2; exit 1; }; [[ -f "$cycle_dir/paper.log" ]] && log_file="$cycle_dir/paper.log" || log_file="$RUN_DIR/paper.log" ;;
  *) echo "ERROR: unsupported mode: $MODE" >&2; exit 1 ;;
esac
[[ -f "$log_file" ]] || { echo "ERROR: log not found: $log_file" >&2; exit 1; }
echo "log_file=$log_file"
tail -n "$TAIL_LINES" "$log_file"
