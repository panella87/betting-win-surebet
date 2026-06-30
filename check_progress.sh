#!/usr/bin/env bash
set -u -o pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$repo_root"

latest_run="$(find artifacts -maxdepth 1 -type d -name 'autonomous_surebet_implementation_*' 2>/dev/null | sort | tail -n 1)"
if [[ -z "$latest_run" ]]; then
  echo "autonomous_run=none"
  echo "hint=run ./run-autonomous-implementation.sh --check-only for preflight"
  exit 0
fi

echo "run_dir=$latest_run"
[[ -f "$latest_run/final_summary.txt" ]] && { echo; echo "== final_summary =="; sed -n '1,220p' "$latest_run/final_summary.txt"; }
[[ -f "$latest_run/controller.log" ]] && { echo; echo "== controller.log tail =="; tail -n "${TAIL_LINES:-80}" "$latest_run/controller.log"; }

echo
echo "== cycles =="
find "$latest_run" -maxdepth 1 -type d -name 'cycle_*' -printf '%f\n' 2>/dev/null | sort | tail -n 20
