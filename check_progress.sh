#!/usr/bin/env bash
set -u -o pipefail
# Artifact layout marker: cycles/cycle_N

TAIL_LINES="${TAIL_LINES:-80}"

usage() {
  cat <<'USAGE'
Usage: ./check_progress.sh [--tail N]

Read-only summary of the latest automation run artifacts and product runtime state.
Looks at autonomous_implementation_*, autonomous_bugfix_*, paper_evaluation_*, paper_autopilot_*, bugfix_autopilot_*,
and legacy autonomous_surebet_implementation_* run directories.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tail)
      [[ $# -ge 2 ]] || { echo "ERROR: --tail requires a value" >&2; exit 1; }
      TAIL_LINES="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "ERROR: unknown option: $1" >&2; usage >&2; exit 1 ;;
  esac
done
[[ "$TAIL_LINES" =~ ^[1-9][0-9]*$ ]] || { echo "ERROR: --tail must be a positive integer" >&2; exit 1; }
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$repo_root" || exit 1
latest_run="$(find artifacts -maxdepth 1 -type d \( -name 'autonomous_implementation_*' -o -name 'autonomous_bugfix_*' -o -name 'paper_evaluation_*' -o -name 'paper_autopilot_*' -o -name 'bugfix_autopilot_*' -o -name 'autonomous_surebet_implementation_*' \) -print 2>/dev/null | sort | tail -n 1)"
if [[ -z "$latest_run" ]]; then
  echo "automation_run=none"
  echo "hint=bash ./run-autonomous-implementation.sh --check-only"
else
  echo "run_dir=$latest_run"
  echo "run_name=$(basename "$latest_run")"
  if [[ -f "$latest_run/final-summary.md" ]]; then
    echo; echo "== final-summary.md =="; sed -n '1,220p' "$latest_run/final-summary.md"
  elif [[ -f "$latest_run/final_summary.txt" ]]; then
    echo; echo "== final_summary.txt =="; sed -n '1,220p' "$latest_run/final_summary.txt"
  else
    echo; echo "final_summary=missing"
  fi
  if [[ -f "$latest_run/controller.log" ]]; then
    echo; echo "== controller.log tail =="; tail -n "$TAIL_LINES" "$latest_run/controller.log"
  fi

  if [[ -f "$latest_run/rounds.tsv" ]]; then
    echo; echo "== rounds.tsv =="; sed -n '1,120p' "$latest_run/rounds.tsv"
  fi
  if [[ -f "$latest_run/campaign_coverage.tsv" ]]; then
    echo; echo "== campaign_coverage.tsv =="; sed -n '1,120p' "$latest_run/campaign_coverage.tsv"
  fi
  latest_round="$(find "$latest_run" -maxdepth 1 -type d -name 'round_*' -print 2>/dev/null | sort -V | tail -n 1)"
  if [[ -n "$latest_round" ]]; then
    echo; echo "latest_round=$latest_round"
    for round_file in child_result.env child_command.txt telegram_notification_status.txt; do
      if [[ -f "$latest_round/$round_file" ]]; then
        echo; echo "== latest_round/$round_file =="; sed -n '1,160p' "$latest_round/$round_file"
      fi
    done
    [[ -f "$latest_round/child_output.log" ]] && echo "latest_child_output_log=$latest_round/child_output.log"
  fi
  if [[ -f "$latest_run/telegram_notification_status.txt" ]]; then
    echo; echo "== telegram_notification_status.txt =="; cat "$latest_run/telegram_notification_status.txt"
  fi
  echo; echo "== cycles =="
  cycle_root="$latest_run/cycles"
  if [[ -d "$cycle_root" ]]; then
    find "$cycle_root" -maxdepth 1 -type d -name 'cycle_*' -printf '%f\n' 2>/dev/null | sort -V | tail -n 20
  else
    find "$latest_run" -maxdepth 1 -type d -name 'cycle_*' -printf '%f\n' 2>/dev/null | sort -V | tail -n 20
  fi
  latest_cycle=""
  if [[ -d "$cycle_root" ]]; then
    latest_cycle="$(find "$cycle_root" -maxdepth 1 -type d -name 'cycle_*' -print 2>/dev/null | sort -V | tail -n 1)"
  else
    latest_cycle="$(find "$latest_run" -maxdepth 1 -type d -name 'cycle_*' -print 2>/dev/null | sort -V | tail -n 1)"
  fi
  if [[ -n "$latest_cycle" ]]; then
    echo; echo "latest_cycle=$latest_cycle"
    for status_file in continue_status.txt request_flags.txt continue_status.env request_flags.env cycle-summary.md summary.md; do
      if [[ -f "$latest_cycle/$status_file" ]]; then
        echo; echo "== latest_cycle/$status_file =="; sed -n '1,160p' "$latest_cycle/$status_file"
      fi
    done
    for log_name in codex.log paper.log validation.log; do
      [[ -f "$latest_cycle/$log_name" ]] && echo "latest_${log_name}=$latest_cycle/$log_name"
    done
  fi
  [[ -f artifacts.zip ]] && { echo; echo "root_artifacts_zip=artifacts.zip"; }
fi
echo
node scripts/bws-root-wrapper-runtime.mjs runtime-summary
