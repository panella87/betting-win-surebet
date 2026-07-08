#!/usr/bin/env bash
# Parent no-service paper/autonomous supervisor for betting-win-surebet.
# Inherits the active Node runtime from the parent shell and never sources nvm.sh.
# Purpose: run paper evaluation and autonomous implementation one at a time, passing explicit handoff files between them.
# Safety: no service lifecycle, no providers, no direct betting-win DB, no execution, and no git mutation.
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
AUTOMATION_REPO_ROOT="$SCRIPT_DIR"
# shellcheck source=.automation/lib/run_common.sh
. "$SCRIPT_DIR/.automation/lib/run_common.sh"
# shellcheck source=.automation/lib/telegram_notify.sh
. "$SCRIPT_DIR/.automation/lib/telegram_notify.sh"

SCRIPT_VERSION="2026-07-08.surebet-v1-no-service-autopilot"
SCRIPT_NAME="run-paper-autopilot.sh"
DURATION_SECONDS="$(automation_parse_duration_seconds 7d)"
PAPER_DURATION_SECONDS="$(automation_parse_duration_seconds 72h)"
IMPLEMENTATION_DURATION_SECONDS="$(automation_parse_duration_seconds 72h)"
INTERVAL_SECONDS="$(automation_parse_duration_seconds 5m)"
ADAPTIVE=1
MAX_ROUNDS=6
MAX_SAME_HANDOFF=2
CODEX_MODEL="cli-default"
CODEX_FALLBACK_MODEL="none"
CODEX_SANDBOX=""
CODEX_STREAM_LOGS=""
AUTO_INSTALL=0
KEEP_MONITORING_WHEN_READY=0
PAPER_MAX_CYCLES=""
IMPLEMENTATION_MAX_CYCLES=""
PAPER_CODEX_TIMEOUT_SECONDS=""
IMPLEMENTATION_CYCLE_TIMEOUT_SECONDS=""
VALIDATION_TIMEOUT_SECONDS=""
INSTALL_TIMEOUT_SECONDS=""
REPO_DIR_OVERRIDE=""
STATUS_ONLY=0
FORCE_UNLOCK=0
PRINT_CONFIG=0
LOCK_ACQUIRED=0
FINISHED=0
FINAL_STATUS="not_started"
STOP_REASON="not_started"
EXIT_STATUS=0
ROUNDS_COMPLETED=0
LAST_CHILD="none"
LAST_CHILD_RC=0
LAST_CHILD_STATUS="unknown"
LAST_CHILD_STOP_REASON="unknown"
LAST_CHILD_RUN_DIR=""
START_EPOCH=0
LAST_HANDOFF_FINGERPRINT=""
LAST_HANDOFF_COUNT=0
ACTIVE_CHILD_PID=""
ACTIVE_CHILD_KIND=""
ACTIVE_CHILD_COMMAND=""

usage() {
  cat <<'EOF_USAGE'
Usage:
  ./run-paper-autopilot.sh [options]

Purpose:
  Parent supervisor that runs surebet paper evaluation and autonomous implementation one at a time.
  It does not edit app logic itself, does not own a service lifecycle, and never spawns nested controllers from inside child controllers.

Primary options:
  --duration VALUE                 Overall autopilot budget. Default: 7d.
  --paper-duration VALUE           Max budget per paper-evaluation child. Default: 72h.
  --implementation-duration VALUE  Max budget per autonomous-implementation child. Default: 72h.
  --interval VALUE                 Paper-evaluation interval argument. Default: 5m.
  --adaptive                       Pass adaptive cadence flag to paper evaluation. Default: enabled.
  --no-adaptive                    Pass fixed paper cadence.
  --max-rounds N                   Max child launches. Default: 6.
  --max-same-handoff N             Stop if the same paper->implementation handoff repeats more than N times. Default: 2.
  --model MODEL                    Override Codex model for child controllers. Use cli-default for CLI/profile default.
  --fallback-model MODEL           Fallback model for child controllers, or none.
  --repo-dir PATH                  Override repository path.

Child-controller options:
  --sandbox MODE                   read-only, workspace-write, or danger-full-access.
  --auto-install                   Pass --auto-install to child controllers.
  --keep-monitoring-when-ready     Pass to the final paper child for workflow compatibility.
  --paper-max-cycles N             Pass --max-cycles to paper evaluation.
  --implementation-max-cycles N    Pass --max-cycles to autonomous implementation.
  --paper-codex-timeout VALUE      Pass --codex-phase-timeout to paper evaluation.
  --implementation-cycle-timeout VALUE Pass --cycle-timeout to autonomous implementation.
  --validation-timeout VALUE       Pass validation timeout to child controllers.
  --install-timeout VALUE          Pass install timeout to child controllers.
  --stream                         Stream child Codex output when applicable.
  --no-stream                      Do not stream child Codex output.

Controller behavior:
  --status                         Show autopilot lock state and child lock states, then exit.
  --force-unlock                   Terminate only a verified repo-scoped autopilot lock owner and remove that lock.
  --print-config                   Print effective configuration and exit.
  -h, --help                       Show this help.

Surebet safety:
  The autopilot only calls run-paper-evaluation.sh and run-autonomous-implementation.sh.
  It never calls start.sh, stop.sh, service controls, git commit/push/pull/reset/stash/clean, provider APIs, direct betting-win DBs, wallets, signers, orders, transactions, or live-trading commands.
  The controller inherits Node.js and npm from the parent shell PATH and never sources nvm.sh.
EOF_USAGE
}

parse_positive_integer() { local value="$1" label="$2"; [[ "$value" =~ ^[1-9][0-9]*$ ]] || { echo "ERROR: $label requires a positive integer: $value" >&2; return 2; }; }

parse_args() {
  local parsed
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --duration|--run-duration) [[ $# -ge 2 ]] || { echo "ERROR: $1 requires a value" >&2; return 2; }; parsed="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid $1: $2" >&2; return 2; }; DURATION_SECONDS="$parsed"; shift 2 ;;
      --duration=*|--run-duration=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid duration: ${1#*=}" >&2; return 2; }; DURATION_SECONDS="$parsed"; shift ;;
      --paper-duration) [[ $# -ge 2 ]] || { echo "ERROR: --paper-duration requires a value" >&2; return 2; }; parsed="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid --paper-duration: $2" >&2; return 2; }; PAPER_DURATION_SECONDS="$parsed"; shift 2 ;;
      --paper-duration=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid --paper-duration: ${1#*=}" >&2; return 2; }; PAPER_DURATION_SECONDS="$parsed"; shift ;;
      --implementation-duration) [[ $# -ge 2 ]] || { echo "ERROR: --implementation-duration requires a value" >&2; return 2; }; parsed="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid --implementation-duration: $2" >&2; return 2; }; IMPLEMENTATION_DURATION_SECONDS="$parsed"; shift 2 ;;
      --implementation-duration=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid --implementation-duration: ${1#*=}" >&2; return 2; }; IMPLEMENTATION_DURATION_SECONDS="$parsed"; shift ;;
      --interval|--paper-interval) [[ $# -ge 2 ]] || { echo "ERROR: $1 requires a value" >&2; return 2; }; parsed="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid $1: $2" >&2; return 2; }; INTERVAL_SECONDS="$parsed"; shift 2 ;;
      --interval=*|--paper-interval=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid interval: ${1#*=}" >&2; return 2; }; INTERVAL_SECONDS="$parsed"; shift ;;
      --adaptive|--adaptive-interval) ADAPTIVE=1; shift ;;
      --no-adaptive|--no-adaptive-interval) ADAPTIVE=0; shift ;;
      --max-rounds) [[ $# -ge 2 ]] || { echo "ERROR: --max-rounds requires a value" >&2; return 2; }; parse_positive_integer "$2" --max-rounds || return 2; MAX_ROUNDS="$2"; shift 2 ;;
      --max-rounds=*) parse_positive_integer "${1#*=}" --max-rounds || return 2; MAX_ROUNDS="${1#*=}"; shift ;;
      --max-same-handoff) [[ $# -ge 2 ]] || { echo "ERROR: --max-same-handoff requires a value" >&2; return 2; }; parse_positive_integer "$2" --max-same-handoff || return 2; MAX_SAME_HANDOFF="$2"; shift 2 ;;
      --max-same-handoff=*) parse_positive_integer "${1#*=}" --max-same-handoff || return 2; MAX_SAME_HANDOFF="${1#*=}"; shift ;;
      --model) [[ $# -ge 2 ]] || { echo "ERROR: --model requires a value" >&2; return 2; }; CODEX_MODEL="$2"; shift 2 ;;
      --model=*) CODEX_MODEL="${1#*=}"; shift ;;
      --fallback-model) [[ $# -ge 2 ]] || { echo "ERROR: --fallback-model requires a value" >&2; return 2; }; CODEX_FALLBACK_MODEL="$2"; shift 2 ;;
      --fallback-model=*) CODEX_FALLBACK_MODEL="${1#*=}"; shift ;;
      --repo-dir) [[ $# -ge 2 ]] || { echo "ERROR: --repo-dir requires a value" >&2; return 2; }; REPO_DIR_OVERRIDE="$2"; shift 2 ;;
      --repo-dir=*) REPO_DIR_OVERRIDE="${1#*=}"; shift ;;
      --sandbox) [[ $# -ge 2 ]] || { echo "ERROR: --sandbox requires a value" >&2; return 2; }; CODEX_SANDBOX="$2"; shift 2 ;;
      --sandbox=*) CODEX_SANDBOX="${1#*=}"; shift ;;
      --auto-install) AUTO_INSTALL=1; shift ;;
      --keep-monitoring-when-ready) KEEP_MONITORING_WHEN_READY=1; shift ;;
      --paper-max-cycles) [[ $# -ge 2 ]] || { echo "ERROR: --paper-max-cycles requires a value" >&2; return 2; }; parse_positive_integer "$2" --paper-max-cycles || return 2; PAPER_MAX_CYCLES="$2"; shift 2 ;;
      --paper-max-cycles=*) parse_positive_integer "${1#*=}" --paper-max-cycles || return 2; PAPER_MAX_CYCLES="${1#*=}"; shift ;;
      --implementation-max-cycles) [[ $# -ge 2 ]] || { echo "ERROR: --implementation-max-cycles requires a value" >&2; return 2; }; parse_positive_integer "$2" --implementation-max-cycles || return 2; IMPLEMENTATION_MAX_CYCLES="$2"; shift 2 ;;
      --implementation-max-cycles=*) parse_positive_integer "${1#*=}" --implementation-max-cycles || return 2; IMPLEMENTATION_MAX_CYCLES="${1#*=}"; shift ;;
      --paper-codex-timeout) [[ $# -ge 2 ]] || { echo "ERROR: --paper-codex-timeout requires a value" >&2; return 2; }; parsed="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid --paper-codex-timeout: $2" >&2; return 2; }; PAPER_CODEX_TIMEOUT_SECONDS="$parsed"; shift 2 ;;
      --paper-codex-timeout=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid --paper-codex-timeout: ${1#*=}" >&2; return 2; }; PAPER_CODEX_TIMEOUT_SECONDS="$parsed"; shift ;;
      --implementation-cycle-timeout) [[ $# -ge 2 ]] || { echo "ERROR: --implementation-cycle-timeout requires a value" >&2; return 2; }; parsed="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid --implementation-cycle-timeout: $2" >&2; return 2; }; IMPLEMENTATION_CYCLE_TIMEOUT_SECONDS="$parsed"; shift 2 ;;
      --implementation-cycle-timeout=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid --implementation-cycle-timeout: ${1#*=}" >&2; return 2; }; IMPLEMENTATION_CYCLE_TIMEOUT_SECONDS="$parsed"; shift ;;
      --validation-timeout) [[ $# -ge 2 ]] || { echo "ERROR: --validation-timeout requires a value" >&2; return 2; }; parsed="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid --validation-timeout: $2" >&2; return 2; }; VALIDATION_TIMEOUT_SECONDS="$parsed"; shift 2 ;;
      --validation-timeout=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid --validation-timeout: ${1#*=}" >&2; return 2; }; VALIDATION_TIMEOUT_SECONDS="$parsed"; shift ;;
      --install-timeout) [[ $# -ge 2 ]] || { echo "ERROR: --install-timeout requires a value" >&2; return 2; }; parsed="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid --install-timeout: $2" >&2; return 2; }; INSTALL_TIMEOUT_SECONDS="$parsed"; shift 2 ;;
      --install-timeout=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid --install-timeout: ${1#*=}" >&2; return 2; }; INSTALL_TIMEOUT_SECONDS="$parsed"; shift ;;
      --stream) CODEX_STREAM_LOGS=1; shift ;;
      --no-stream) CODEX_STREAM_LOGS=0; shift ;;
      --status) STATUS_ONLY=1; shift ;;
      --force-unlock) FORCE_UNLOCK=1; shift ;;
      --print-config) PRINT_CONFIG=1; shift ;;
      -h|--help) usage; exit 0 ;;
      *) echo "ERROR: unknown option: $1" >&2; usage >&2; return 2 ;;
    esac
  done
}

configure_defaults() {
  if [[ -n "$REPO_DIR_OVERRIDE" ]]; then [[ -d "$REPO_DIR_OVERRIDE" ]] || { echo "ERROR: --repo-dir does not exist: $REPO_DIR_OVERRIDE" >&2; return 1; }; AUTOMATION_REPO_ROOT="$(cd "$REPO_DIR_OVERRIDE" && pwd -P)"; fi
  cd "$AUTOMATION_REPO_ROOT"
  automation_load_config
  CODEX_SANDBOX="${CODEX_SANDBOX:-${AUTOMATION_CODEX_SANDBOX:-danger-full-access}}"
  CODEX_STREAM_LOGS="${CODEX_STREAM_LOGS:-${AUTOMATION_CODEX_STREAM_LOGS:-1}}"
  VALIDATION_TIMEOUT_SECONDS="${VALIDATION_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_VALIDATION_TIMEOUT:-20m}")}"
  INSTALL_TIMEOUT_SECONDS="${INSTALL_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_INSTALL_TIMEOUT:-15m}")}"
  PAPER_CODEX_TIMEOUT_SECONDS="${PAPER_CODEX_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_CODEX_CYCLE_TIMEOUT:-2h}")}"
  IMPLEMENTATION_CYCLE_TIMEOUT_SECONDS="${IMPLEMENTATION_CYCLE_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_CODEX_CYCLE_TIMEOUT:-2h}")}"
}

print_config() {
  cat <<EOF_CONFIG
script=run-paper-autopilot.sh
script_version=$SCRIPT_VERSION
repo_dir=$AUTOMATION_REPO_ROOT
duration_seconds=$DURATION_SECONDS
paper_duration_seconds=$PAPER_DURATION_SECONDS
implementation_duration_seconds=$IMPLEMENTATION_DURATION_SECONDS
interval_seconds=$INTERVAL_SECONDS
adaptive=$ADAPTIVE
max_rounds=$MAX_ROUNDS
max_same_handoff=$MAX_SAME_HANDOFF
model=$CODEX_MODEL
fallback_model=$CODEX_FALLBACK_MODEL
sandbox=$CODEX_SANDBOX
stream_logs=$CODEX_STREAM_LOGS
auto_install=$AUTO_INSTALL
paper_max_cycles=${PAPER_MAX_CYCLES:-default}
implementation_max_cycles=${IMPLEMENTATION_MAX_CYCLES:-default}
paper_service_lifecycle=none
telegram_notify=${TELEGRAM_NOTIFY:-1}
EOF_CONFIG
}

assert_active_node_runtime() {
  automation_require_command node
  automation_require_command npm
  local expected_major="" node_version
  node_version="$(node --version 2>/dev/null || true)"
  if [[ -f "$AUTOMATION_REPO_ROOT/.nvmrc" ]]; then expected_major="$(tr -d '[:space:]' < "$AUTOMATION_REPO_ROOT/.nvmrc" | sed -E 's/^v?([0-9]+).*/\1/')"; fi
  if [[ -n "$expected_major" && ! "$node_version" =~ ^v${expected_major}\. ]]; then
    cat >&2 <<EOF_NODE
ERROR: active Node runtime does not match .nvmrc
expected_major=$expected_major
actual_node=${node_version:-missing}
Activate the repo runtime in the parent shell first:
. "\$HOME/.nvm/nvm.sh" && nvm use $expected_major
EOF_NODE
    return 1
  fi
  automation_log "NODE_OK=$node_version"; automation_log "NPM_OK=$(npm --version 2>/dev/null || true)"
}

maybe_auto_install() { [[ "$AUTO_INSTALL" == "1" ]] || return 0; [[ -d "$AUTOMATION_REPO_ROOT/node_modules" ]] && { automation_log "auto_install=skipped node_modules_present"; return 0; }; automation_run_shell_command "autopilot_auto_install" "npm install --ignore-scripts" "$INSTALL_TIMEOUT_SECONDS" "$AUTOMATION_RUN_DIR/auto-install.log"; }

env_value() { local file="$1" key="$2"; [[ -f "$file" ]] || return 1; awk -F= -v k="$key" '$1 == k { sub(/^[^=]*=/, ""); print; found=1; exit } END { exit found ? 0 : 1 }' "$file"; }
paper_to_implementation_handoff_file() { printf '%s\n' "$AUTOMATION_REPO_ROOT/.automation/paper-mode-to-autonomous-implementation.env"; }
implementation_to_paper_handoff_file() { printf '%s\n' "$AUTOMATION_REPO_ROOT/.automation/paper-mode-handover.env"; }
has_paper_to_implementation_handoff() { [[ -s "$(paper_to_implementation_handoff_file)" ]]; }
has_implementation_to_paper_handoff() { [[ -s "$(implementation_to_paper_handoff_file)" ]]; }
handoff_fingerprint() { local file="$1"; [[ -s "$file" ]] || { printf 'none\n'; return 0; }; sha256sum "$file" | awk '{print $1}'; }
archive_handoff_file() { local source="$1" round_dir="$2" name="$3" remove_after="${4:-0}"; mkdir -p "$round_dir/handoffs"; if [[ -s "$source" ]]; then cp "$source" "$round_dir/handoffs/$name"; if [[ "$remove_after" == "1" ]]; then rm -f "$source"; fi; fi; return 0; }
latest_child_run_dir() { local pattern="$1"; find "$AUTOMATION_REPO_ROOT/artifacts" -maxdepth 1 -type d -name "$pattern" -print 2>/dev/null | sort | tail -n 1 || true; }
extract_child_key() { local key="$1" log_file="$2"; grep -E "^${key}=" "$log_file" 2>/dev/null | tail -n 1 | cut -d= -f2- || true; }
resolve_child_run_dir() { local log_file="$1" pattern="$2" candidate; candidate="$(extract_child_key run_dir "$log_file")"; if [[ -n "$candidate" ]]; then [[ "$candidate" == /* ]] || candidate="$AUTOMATION_REPO_ROOT/$candidate"; if [[ -d "$candidate" ]]; then printf '%s\n' "$candidate"; return 0; fi; fi; latest_child_run_dir "$pattern"; }
parse_child_summary() { local run_dir="$1" log_file="${2:-}" summary status reason; status="unknown"; reason="unknown"; if [[ -n "$log_file" ]]; then status="$(extract_child_key final_status "$log_file")"; reason="$(extract_child_key stop_reason "$log_file")"; fi; if [[ ( -z "$status" || "$status" == "unknown" || -z "$reason" || "$reason" == "unknown" ) && -n "$run_dir" ]]; then if [[ -f "$run_dir/final-summary.md" ]]; then summary="$run_dir/final-summary.md"; elif [[ -f "$run_dir/final_summary.txt" ]]; then summary="$run_dir/final_summary.txt"; else summary=""; fi; if [[ -n "$summary" ]]; then [[ -n "$status" && "$status" != "unknown" ]] || status="$(env_value "$summary" final_status || true)"; [[ -n "$reason" && "$reason" != "unknown" ]] || reason="$(env_value "$summary" stop_reason || true)"; fi; fi; printf '%s\t%s\n' "${status:-unknown}" "${reason:-unknown}"; }
quote_command() { local first=1 arg; for arg in "$@"; do [[ "$first" == "1" ]] && first=0 || printf ' '; printf '%q' "$arg"; done; printf '\n'; }

build_paper_command() {
  local -n ref="$1"
  ref=(bash ./run-paper-evaluation.sh --duration "$(automation_duration_label "$PAPER_DURATION_SECONDS")" --interval "$(automation_duration_label "$INTERVAL_SECONDS")" --model "$CODEX_MODEL" --fallback-model "$CODEX_FALLBACK_MODEL")
  [[ "$ADAPTIVE" == "1" ]] && ref+=(--adaptive) || ref+=(--no-adaptive)
  [[ "$KEEP_MONITORING_WHEN_READY" == "1" ]] && ref+=(--keep-monitoring-when-ready)
  [[ "$AUTO_INSTALL" == "1" ]] && ref+=(--auto-install)
  [[ -n "$PAPER_MAX_CYCLES" ]] && ref+=(--max-cycles "$PAPER_MAX_CYCLES")
  [[ -n "$PAPER_CODEX_TIMEOUT_SECONDS" ]] && ref+=(--codex-phase-timeout "$PAPER_CODEX_TIMEOUT_SECONDS")
  [[ -n "$VALIDATION_TIMEOUT_SECONDS" ]] && ref+=(--validation-timeout "$VALIDATION_TIMEOUT_SECONDS")
  [[ -n "$INSTALL_TIMEOUT_SECONDS" ]] && ref+=(--install-timeout "$INSTALL_TIMEOUT_SECONDS")
  [[ -n "$CODEX_SANDBOX" ]] && ref+=(--sandbox "$CODEX_SANDBOX")
  [[ "$CODEX_STREAM_LOGS" == "1" ]] && ref+=(--stream) || ref+=(--no-stream)
}

build_implementation_command() {
  local -n ref="$1"
  ref=(bash ./run-autonomous-implementation.sh --duration "$(automation_duration_label "$IMPLEMENTATION_DURATION_SECONDS")" --model "$CODEX_MODEL" --fallback-model "$CODEX_FALLBACK_MODEL" --handover-paper-mode)
  [[ "$AUTO_INSTALL" == "1" ]] && ref+=(--auto-install)
  [[ -n "$IMPLEMENTATION_MAX_CYCLES" ]] && ref+=(--max-cycles "$IMPLEMENTATION_MAX_CYCLES")
  [[ -n "$IMPLEMENTATION_CYCLE_TIMEOUT_SECONDS" ]] && ref+=(--cycle-timeout "$IMPLEMENTATION_CYCLE_TIMEOUT_SECONDS")
  [[ -n "$VALIDATION_TIMEOUT_SECONDS" ]] && ref+=(--validation-timeout "$VALIDATION_TIMEOUT_SECONDS")
  [[ -n "$INSTALL_TIMEOUT_SECONDS" ]] && ref+=(--install-timeout "$INSTALL_TIMEOUT_SECONDS")
  [[ -n "$CODEX_SANDBOX" ]] && ref+=(--sandbox "$CODEX_SANDBOX")
  [[ "$CODEX_STREAM_LOGS" == "1" ]] && ref+=(--stream) || ref+=(--no-stream)
}

run_child_controller() {
  local child="$1" round_dir="$2" output_log command_log rc=0 latest parsed
  local -a cmd=()
  output_log="$round_dir/child_output.log"; command_log="$round_dir/child_command.txt"
  if [[ "$child" == "paper" ]]; then build_paper_command cmd; elif [[ "$child" == "implementation" ]]; then build_implementation_command cmd; else echo "ERROR: unsupported child controller: $child" >&2; return 2; fi
  quote_command "${cmd[@]}" > "$command_log"
  ACTIVE_CHILD_KIND="$child"; ACTIVE_CHILD_COMMAND="$(cat "$command_log")"; automation_write_lock_file
  automation_log "child_start round=$ROUNDS_COMPLETED child=$child command=$ACTIVE_CHILD_COMMAND"
  set +e
  if [[ "$child" == "implementation" && -s "$(paper_to_implementation_handoff_file)" ]] && [[ "$(env_value "$(paper_to_implementation_handoff_file)" PAPER_MODE_AUTOMATION_MAINTENANCE_ALLOWED || true)" == "yes" ]]; then
    AUTOMATION_ALLOW_PROTECTED_CHANGES=1 "${cmd[@]}" > >(tee "$output_log") 2>&1 &
  else
    "${cmd[@]}" > >(tee "$output_log") 2>&1 &
  fi
  ACTIVE_CHILD_PID="$!"; automation_write_lock_file; wait "$ACTIVE_CHILD_PID"; rc=$?
  ACTIVE_CHILD_PID=""; ACTIVE_CHILD_KIND=""; ACTIVE_CHILD_COMMAND=""; automation_write_lock_file
  LAST_CHILD="$child"; LAST_CHILD_RC="$rc"
  if [[ "$child" == "paper" ]]; then latest="$(resolve_child_run_dir "$output_log" 'paper_evaluation_*')"; else latest="$(resolve_child_run_dir "$output_log" 'autonomous_implementation_*')"; fi
  LAST_CHILD_RUN_DIR="$latest"; parsed="$(parse_child_summary "$latest" "$output_log")"; LAST_CHILD_STATUS="${parsed%%$'\t'*}"; LAST_CHILD_STOP_REASON="${parsed#*$'\t'}"
  { printf 'child=%s\n' "$child"; printf 'exit_code=%s\n' "$rc"; printf 'final_status=%s\n' "$LAST_CHILD_STATUS"; printf 'stop_reason=%s\n' "$LAST_CHILD_STOP_REASON"; printf 'run_dir=%s\n' "$LAST_CHILD_RUN_DIR"; printf 'finished_at=%s\n' "$(automation_now_iso)"; } > "$round_dir/child_result.env"
  return "$rc"
}

choose_next_child() { if has_implementation_to_paper_handoff; then printf 'paper\n'; elif has_paper_to_implementation_handoff; then printf 'implementation\n'; else printf 'paper\n'; fi; }
append_round() { local round="$1" child="$2" rc="$3" status="$4" reason="$5" run_dir="$6" decision="$7" fingerprint="$8"; printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$round" "$(automation_now_iso)" "$child" "$rc" "$status" "$reason" "$run_dir" "$decision" "$fingerprint" >> "$AUTOMATION_RUN_DIR/rounds.tsv"; }
implementation_handover_allows_paper() { local file changed valid reevaluate; file="$(implementation_to_paper_handoff_file)"; changed="$(env_value "$file" IMPLEMENTATION_SOURCE_CHANGED || true)"; valid="$(env_value "$file" IMPLEMENTATION_SOURCE_VALIDATION_PASSED || true)"; reevaluate="$(env_value "$file" PRIVATE_PAPER_REEVALUATION_REQUIRED || true)"; [[ "$changed" == "yes" && "$valid" == "yes" && "$reevaluate" == "yes" ]]; }
implementation_noop_disallowed() { local impl_file paper_file changed noop_allowed; impl_file="$(implementation_to_paper_handoff_file)"; paper_file="$(paper_to_implementation_handoff_file)"; changed="$(env_value "$impl_file" IMPLEMENTATION_SOURCE_CHANGED || true)"; noop_allowed="$(env_value "$paper_file" PAPER_MODE_NOOP_SUCCESS_ALLOWED || true)"; [[ "$changed" != "yes" && "$noop_allowed" != "yes" ]]; }

write_final_summary() {
  [[ -n "${AUTOMATION_RUN_DIR:-}" ]] || return 0
  {
    printf '# Paper autopilot final summary\n\n'
    printf 'script_version=%s\n' "$SCRIPT_VERSION"
    printf 'final_status=%s\n' "$FINAL_STATUS"
    printf 'stop_reason=%s\n' "$STOP_REASON"
    printf 'exit_status=%s\n' "$EXIT_STATUS"
    printf 'rounds_completed=%s\n' "$ROUNDS_COMPLETED"
    printf 'last_child=%s\n' "$LAST_CHILD"
    printf 'last_child_exit_code=%s\n' "$LAST_CHILD_RC"
    printf 'last_child_status=%s\n' "$LAST_CHILD_STATUS"
    printf 'last_child_stop_reason=%s\n' "$LAST_CHILD_STOP_REASON"
    printf 'last_child_run_dir=%s\n' "$LAST_CHILD_RUN_DIR"
    printf 'duration_seconds=%s\n' "$DURATION_SECONDS"
    printf 'paper_duration_seconds=%s\n' "$PAPER_DURATION_SECONDS"
    printf 'implementation_duration_seconds=%s\n' "$IMPLEMENTATION_DURATION_SECONDS"
    printf 'paper_interval_seconds=%s\n' "$INTERVAL_SECONDS"
    printf 'adaptive=%s\n' "$ADAPTIVE"
    printf 'max_rounds=%s\n' "$MAX_ROUNDS"
    printf 'max_same_handoff=%s\n' "$MAX_SAME_HANDOFF"
    printf 'paper_service_lifecycle=none\n'
    printf 'rounds_tsv=%s\n' "$AUTOMATION_RUN_DIR/rounds.tsv"
    printf 'completed_at=%s\n' "$(automation_now_iso)"
  } > "$AUTOMATION_RUN_DIR/final_summary.txt"
  cp "$AUTOMATION_RUN_DIR/final_summary.txt" "$AUTOMATION_RUN_DIR/final-summary.md" 2>/dev/null || true
}

finish() { local rc=$?; [[ "$FINISHED" == "1" ]] && return 0; FINISHED=1; EXIT_STATUS="$rc"; if [[ -n "${AUTOMATION_RUN_DIR:-}" ]]; then write_final_summary || true; automation_collect_repo_snapshot "$AUTOMATION_RUN_DIR/final-repo-snapshot" || true; automation_build_artifacts_zip "$AUTOMATION_RUN_DIR" "$AUTOMATION_REPO_ROOT" || true; telegram_notify_send_final "run-paper-autopilot.sh" "${AUTOMATION_REPO_NAME:-betting-win-surebet}" "$FINAL_STATUS" "$STOP_REASON" "$ROUNDS_COMPLETED" "$EXIT_STATUS" "$AUTOMATION_RUN_DIR" "$AUTOMATION_RUN_DIR/telegram_notification_status.txt" "$AUTOMATION_REPO_ROOT" || true; fi; [[ "$LOCK_ACQUIRED" == "1" ]] && automation_release_lock || true; }
trap finish EXIT
trap 'FINAL_STATUS="interrupted"; STOP_REASON="interrupted"; exit 130' INT TERM

main_loop() {
  local now child round_dir rc decision fingerprint paper_handoff impl_handoff
  printf 'round\tfinished_at\tchild\texit_code\tfinal_status\tstop_reason\tchild_run_dir\tdecision\thandoff_fingerprint\n' > "$AUTOMATION_RUN_DIR/rounds.tsv"
  while true; do
    now="$(automation_now_epoch)"
    if (( now - START_EPOCH >= DURATION_SECONDS )); then FINAL_STATUS="CONTINUE_REQUIRED"; STOP_REASON="autopilot_time_budget_reached"; exit 3; fi
    if (( ROUNDS_COMPLETED >= MAX_ROUNDS )); then FINAL_STATUS="CONTINUE_REQUIRED"; STOP_REASON="max_rounds_reached"; exit 3; fi
    child="$(choose_next_child)"; ROUNDS_COMPLETED=$((ROUNDS_COMPLETED + 1)); round_dir="$AUTOMATION_RUN_DIR/round_$(printf '%02d' "$ROUNDS_COMPLETED")_${child}"; mkdir -p "$round_dir"
    paper_handoff="$(paper_to_implementation_handoff_file)"; impl_handoff="$(implementation_to_paper_handoff_file)"
    archive_handoff_file "$paper_handoff" "$round_dir" "input_paper_mode_to_autonomous_implementation.env" 0
    archive_handoff_file "$impl_handoff" "$round_dir" "input_paper_mode_handover.env" 0
    if [[ "$child" == "paper" && -s "$impl_handoff" ]]; then rm -f "$impl_handoff"; fi
    fingerprint="none"
    if [[ "$child" == "implementation" ]]; then fingerprint="$(handoff_fingerprint "$paper_handoff")"; if [[ "$fingerprint" == "$LAST_HANDOFF_FINGERPRINT" ]]; then LAST_HANDOFF_COUNT=$((LAST_HANDOFF_COUNT + 1)); else LAST_HANDOFF_FINGERPRINT="$fingerprint"; LAST_HANDOFF_COUNT=1; fi; if (( LAST_HANDOFF_COUNT > MAX_SAME_HANDOFF )); then decision="blocked_same_handoff_repeated"; append_round "$ROUNDS_COMPLETED" "$child" "not_run" "not_run" "same_handoff_repeated" "" "$decision" "$fingerprint"; FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_SAME_HANDOFF_REPEATED"; STOP_REASON="same_handoff_repeated"; exit 2; fi; fi
    set +e
    run_child_controller "$child" "$round_dir"
    rc=$?
    set -e
    if [[ "$child" == "paper" ]]; then
      archive_handoff_file "$paper_handoff" "$round_dir" "output_paper_mode_to_autonomous_implementation.env" 0
      if has_paper_to_implementation_handoff; then decision="next_autonomous_implementation"; append_round "$ROUNDS_COMPLETED" "$child" "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" "$decision" "$fingerprint"; continue; fi
      case "$LAST_CHILD_STATUS" in
        PAPER_EVALUATION_READY_PRIVATE_FIXTURE_ONLY_BLOCKED_ON_PINNED_BUNDLE) decision="blocked_on_pinned_bundle"; append_round "$ROUNDS_COMPLETED" "$child" "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" "$decision" "$fingerprint"; FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_ON_PINNED_BUNDLE"; STOP_REASON="private_fixture_only_blocked_on_pinned_bundle"; exit 0 ;;
        PAPER_EVALUATION_PINNED_BUNDLE_ACCEPTED_PRIVATE_REPORT_WRITTEN) decision="pinned_bundle_private_report_written"; append_round "$ROUNDS_COMPLETED" "$child" "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" "$decision" "$fingerprint"; FINAL_STATUS="PAPER_AUTOPILOT_PINNED_BUNDLE_ACCEPTED_PRIVATE_REPORT_WRITTEN"; STOP_REASON="pinned_bundle_private_report_written"; exit 0 ;;
        check_only_complete) decision="paper_check_only_complete"; append_round "$ROUNDS_COMPLETED" "$child" "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" "$decision" "$fingerprint"; FINAL_STATUS="PAPER_AUTOPILOT_CHECK_ONLY_COMPLETE"; STOP_REASON="paper_check_only"; exit 0 ;;
        *) decision="blocked_paper_child"; append_round "$ROUNDS_COMPLETED" "$child" "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" "$decision" "$fingerprint"; FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_PAPER_CHILD"; STOP_REASON="paper_child_blocked"; exit 2 ;;
      esac
    else
      archive_handoff_file "$impl_handoff" "$round_dir" "output_paper_mode_handover.env" 0
      if has_implementation_to_paper_handoff; then
        if implementation_noop_disallowed; then decision="blocked_implementation_noop_for_paper_handoff"; append_round "$ROUNDS_COMPLETED" "$child" "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" "$decision" "$fingerprint"; FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_IMPLEMENTATION_NOOP"; STOP_REASON="implementation_noop_for_paper_handoff"; exit 2; fi
        if ! implementation_handover_allows_paper; then decision="blocked_implementation_handover_not_refreshable"; append_round "$ROUNDS_COMPLETED" "$child" "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" "$decision" "$fingerprint"; FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_IMPLEMENTATION_HANDOVER_NOT_REFRESHABLE"; STOP_REASON="implementation_handover_not_refreshable"; exit 2; fi
        archive_handoff_file "$paper_handoff" "$round_dir" "consumed_paper_mode_to_autonomous_implementation.env" 1; decision="next_paper_evaluation"; append_round "$ROUNDS_COMPLETED" "$child" "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" "$decision" "$fingerprint"; continue
      fi
      if [[ "$rc" == "3" && "$LAST_CHILD_STATUS" == "CONTINUE_REQUIRED=yes" ]]; then decision="continue_implementation"; append_round "$ROUNDS_COMPLETED" "$child" "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" "$decision" "$fingerprint"; continue; fi
      decision="blocked_implementation_child"; append_round "$ROUNDS_COMPLETED" "$child" "$rc" "$LAST_CHILD_STATUS" "$LAST_CHILD_STOP_REASON" "$LAST_CHILD_RUN_DIR" "$decision" "$fingerprint"; FINAL_STATUS="PAPER_AUTOPILOT_BLOCKED_IMPLEMENTATION_CHILD"; STOP_REASON="implementation_child_blocked"; exit 2
    fi
  done
}

parse_args "$@" || exit 1
configure_defaults || exit 1
LOCK_FILE="$AUTOMATION_REPO_ROOT/.automation/locks/run-paper-autopilot.lock"
if [[ "$STATUS_ONLY" == "1" ]]; then automation_status_lock "$LOCK_FILE"; echo "== child_locks =="; automation_status_lock "$AUTOMATION_REPO_ROOT/.automation/locks/run-paper-evaluation.lock" || true; automation_status_lock "$AUTOMATION_REPO_ROOT/.automation/locks/run-autonomous-implementation.lock" || true; exit 0; fi
if [[ "$FORCE_UNLOCK" == "1" ]]; then automation_force_unlock "$LOCK_FILE" "$SCRIPT_NAME" "$AUTOMATION_REPO_ROOT"; exit 0; fi
if [[ "$PRINT_CONFIG" == "1" ]]; then print_config; exit 0; fi
automation_create_run_dir "paper_autopilot"; AUTOMATION_SCRIPT_COMMAND="$0 $*"; automation_acquire_lock "$SCRIPT_NAME" "$AUTOMATION_REPO_ROOT"; LOCK_ACQUIRED=1; automation_start_heartbeat
assert_active_node_runtime || { FINAL_STATUS="setup_failed"; STOP_REASON="node_runtime_invalid"; exit 1; }
automation_collect_repo_snapshot "$AUTOMATION_RUN_DIR/initial-repo-snapshot"; maybe_auto_install || { FINAL_STATUS="setup_failed"; STOP_REASON="auto_install_failed"; exit 1; }
START_EPOCH="$(automation_now_epoch)"; FINAL_STATUS="CONTINUE_REQUIRED"; STOP_REASON="loop_started"; main_loop
