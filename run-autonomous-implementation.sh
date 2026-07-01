#!/usr/bin/env bash
set -u -o pipefail

LOOP_SECONDS=259200
CODEX_CYCLE_TIMEOUT_SECONDS=7200
VALIDATION_TIMEOUT_SECONDS=1200
MAX_CYCLES=200
CODEX_BIN="${CODEX_BIN:-codex}"
CODEX_MODEL="${CODEX_MODEL:-}"
CODEX_SANDBOX="${CODEX_SANDBOX:-danger-full-access}"
CODEX_STREAM_LOGS=1
CHECK_ONLY=0
ALLOW_PARALLEL=0
REPO_DIR=""
STOP_REASON="loop_started"
FINAL_STATUS="BLOCKED=yes"
RUN_DIR=""
LOCK_DIR=""

parse_duration_seconds() {
  local input="$1"
  if [[ "$input" =~ ^[1-9][0-9]*$ ]]; then echo "$input"; return 0; fi
  python3 - "$input" <<'PY_DURATION'
import re, sys
s=sys.argv[1]
units={'d':86400,'h':3600,'m':60,'s':1}
order='dhms'
pos=0; total=0; last=-1
for m in re.finditer(r'([1-9][0-9]*)([dhms])', s):
    if m.start()!=pos: raise SystemExit(2)
    idx=order.index(m.group(2))
    if idx<=last: raise SystemExit(2)
    last=idx; pos=m.end(); total += int(m.group(1))*units[m.group(2)]
if pos != len(s) or total <= 0: raise SystemExit(2)
print(total)
PY_DURATION
}

usage() {
  cat <<'EOF'
Usage: ./run-autonomous-implementation.sh [options]

Options:
  --duration VALUE            Run budget, e.g. 72h, 1h30m, or seconds. Default: 72h.
  --cycle-timeout VALUE       Maximum duration of one Codex cycle. Default: 2h.
  --validation-timeout VALUE  Maximum duration of each validation command. Default: 20m.
  --model VALUE               Optional Codex model. Omit for CLI default.
  --repo-dir PATH             Repository root override.
  --sandbox MODE              Codex sandbox mode. Default: danger-full-access.
  --max-cycles N              Cycle ceiling. Default: 200.
  --check-only                Run preflight only.
  --allow-parallel            Allow another autonomous controller for this repo.
  --no-stream                 Do not stream Codex logs to terminal.
  -h, --help                  Show help.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --duration|--run-duration) LOOP_SECONDS="$(parse_duration_seconds "$2")" || { echo "ERROR: invalid duration: $2" >&2; exit 2; }; shift 2 ;;
    --duration=*|--run-duration=*) LOOP_SECONDS="$(parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid duration: ${1#*=}" >&2; exit 2; }; shift ;;
    --cycle-timeout) CODEX_CYCLE_TIMEOUT_SECONDS="$(parse_duration_seconds "$2")" || { echo "ERROR: invalid cycle timeout: $2" >&2; exit 2; }; shift 2 ;;
    --cycle-timeout=*) CODEX_CYCLE_TIMEOUT_SECONDS="$(parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid cycle timeout: ${1#*=}" >&2; exit 2; }; shift ;;
    --validation-timeout) VALIDATION_TIMEOUT_SECONDS="$(parse_duration_seconds "$2")" || { echo "ERROR: invalid validation timeout: $2" >&2; exit 2; }; shift 2 ;;
    --validation-timeout=*) VALIDATION_TIMEOUT_SECONDS="$(parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid validation timeout: ${1#*=}" >&2; exit 2; }; shift ;;
    --model) CODEX_MODEL="$2"; shift 2 ;;
    --model=*) CODEX_MODEL="${1#*=}"; shift ;;
    --repo-dir) REPO_DIR="$2"; shift 2 ;;
    --repo-dir=*) REPO_DIR="${1#*=}"; shift ;;
    --sandbox) CODEX_SANDBOX="$2"; shift 2 ;;
    --sandbox=*) CODEX_SANDBOX="${1#*=}"; shift ;;
    --max-cycles) MAX_CYCLES="$2"; shift 2 ;;
    --max-cycles=*) MAX_CYCLES="${1#*=}"; shift ;;
    --check-only) CHECK_ONLY=1; shift ;;
    --allow-parallel) ALLOW_PARALLEL=1; shift ;;
    --no-stream) CODEX_STREAM_LOGS=0; shift ;;
    --stream) CODEX_STREAM_LOGS=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "ERROR: unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if [[ -z "$REPO_DIR" ]]; then
  REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi
cd "$REPO_DIR" || exit 1

log() { printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" | tee -a "$RUN_DIR/controller.log"; }

load_node_runtime() {
  if [[ -f scripts/load-node-runtime.sh ]]; then
    # shellcheck disable=SC1091
    . scripts/load-node-runtime.sh "$REPO_DIR"
    return $?
  fi
  command -v node >/dev/null 2>&1 || { echo "ERROR: node not found" >&2; return 1; }
  command -v npm >/dev/null 2>&1 || { echo "ERROR: npm not found" >&2; return 1; }
}

run_validation() {
  local label="$1"
  local validation_dir="$2"
  local log_file="$validation_dir/${label}_validation.log"
  mkdir -p "$validation_dir"
  echo "===== npm run validate =====" > "$log_file"
  timeout "${VALIDATION_TIMEOUT_SECONDS}s" bash -lc 'PYTHONDONTWRITEBYTECODE=1 npm run validate' >> "$log_file" 2>&1
}

write_cycle_context() {
  local cycle_dir="$1"
  local context_file="$cycle_dir/CYCLE_CONTEXT.md"
  {
    echo "# Cycle Context"
    echo
    echo "Repository: betting-win-surebet"
    echo "Run dir: $RUN_DIR"
    echo "Cycle dir: $cycle_dir"
    echo
    echo "## Current status"
    sed -n '1,220p' PROJECT_STATUS.md
    echo
    sed -n '1,260p' docs/repo_status_current.md
    echo
    echo "## Master plan excerpt"
    sed -n '1,260p' docs/MASTER_PLAN.md
  } > "$context_file"
  printf '%s\n' "$context_file"
}

write_cycle_prompt() {
  local cycle_dir="$1"
  local cycle_num="$2"
  local context_file="$3"
  local prompt_file="$cycle_dir/codex_prompt.txt"
  cat > "$prompt_file" <<EOF_PROMPT
Role:
You are a senior autonomous implementation agent for betting-win-surebet, a private paper-only downstream surebet / complete-set research repository.

Cycle:
$cycle_num

Repository root:
$REPO_DIR

Cycle artifact directory:
$cycle_dir

Read first:
$context_file

Objective:
Implement exactly one bounded safe SURE-001 hardening slice from the current repository truth. Stop after one slice.

Source-of-truth order:
1. current code
2. PROJECT_STATUS.md
3. docs/repo_status_current.md
4. docs/MASTER_PLAN.md
5. AGENTS.md
6. README.md

Hard boundaries:
- Paper-only.
- No provider connections, SDKs, URLs, credentials, collectors, or provider adapters.
- No wallet, signer, token approval, order, cancellation, redemption, cashout, transaction, or execution path.
- No direct betting-win database access.
- No core.* migrations.
- No generated betting-win contract vendoring.
- No solver, stake-vector, leg-completion, residual-exposure, or settlement-replay implementation until Federico explicitly asks and a pinned betting-win interface exists.
- Do not edit .env or print secrets.
- Do not commit, push, pull, reset, clean, stash, or rewrite branches.
- Do not weaken validators.

Task selection:
1. If local validation is broken, repair the smallest confirmed repo-local validation/tooling defect.
2. Otherwise improve exactly one SURE-001 item: docs, validators, operation wrappers, typed stubs, fixture folders, or tests.
3. If the next required work is SURE-002 or later, return BLOCKED=yes with the missing pinned betting-win contract/export interface.

Required commands before finishing when relevant:
- npm run validate

Required files inside $cycle_dir:
- docs_review.md
- code_state_review.md
- task_ledger.md
- selected_task.md
- implementation_plan.md
- commands_run.log
- validation_results.md
- changes_made.md
- remaining_gaps.md
- next_cycle_recommendation.md
- final_status.md
- git_diff.patch
- continue_status.txt
- request_flags.txt

continue_status.txt must contain exactly one line:
AUTONOMOUS_GOAL_COMPLETE=yes
CONTINUE_REQUIRED=yes
BLOCKED=yes

request_flags.txt must contain exactly two lines:
SERVICE_REFRESH_REQUIRED=no
RUNTIME_EVIDENCE_REQUIRED=no
EOF_PROMPT
}

ensure_cycle_artifacts() {
  local cycle_dir="$1" f
  for f in docs_review.md code_state_review.md task_ledger.md selected_task.md implementation_plan.md commands_run.log validation_results.md changes_made.md remaining_gaps.md next_cycle_recommendation.md final_status.md git_diff.patch continue_status.txt request_flags.txt; do
    [[ -f "$cycle_dir/$f" ]] || echo "controller_placeholder=missing after Codex; inspect codex.log" > "$cycle_dir/$f"
  done
}

run_codex_cycle() {
  local cycle_dir="$1"
  local prompt_file="$cycle_dir/codex_prompt.txt"
  local log_file="$cycle_dir/codex.log"
  local rc
  local -a cmd=("$CODEX_BIN" exec)
  if [[ -n "$CODEX_MODEL" && "$CODEX_MODEL" != "default" && "$CODEX_MODEL" != "cli-default" ]]; then
    cmd+=(--model "$CODEX_MODEL")
  fi
  cmd+=(-C "$REPO_DIR" --sandbox "$CODEX_SANDBOX" "$(cat "$prompt_file")")
  if [[ "$CODEX_STREAM_LOGS" == "1" ]]; then
    timeout "${CODEX_CYCLE_TIMEOUT_SECONDS}s" "${cmd[@]}" < /dev/null 2>&1 | tee "$log_file"
    rc=${PIPESTATUS[0]}
  else
    timeout "${CODEX_CYCLE_TIMEOUT_SECONDS}s" "${cmd[@]}" < /dev/null > "$log_file" 2>&1
    rc=$?
  fi
  return "$rc"
}


cleanup_controller_generated_archives() {
  # The controller publishes these root archives at finish. They are generated
  # outputs, so remove only these exact names before preflight hygiene checks.
  rm -f artifacts.zip autonomous-codebase.zip
}

create_final_archives() {
  rm -f artifacts.zip autonomous-codebase.zip
  if command -v zip >/dev/null 2>&1; then
    [[ -d artifacts ]] && zip -r -q artifacts.zip artifacts -x 'artifacts/**/*.log.tmp' || true
    zip -r -q autonomous-codebase.zip . \
      -x './.git/*' './node_modules/*' './dist/*' './coverage/*' './artifacts/*' './.locks/*' './.env' './*.zip' './*.log' './tmp/*' './.tmp/*' || true
  fi
}

acquire_controller_lock() {
  if mkdir "$LOCK_DIR" 2>/dev/null; then
    printf '%s
' "$$" > "$LOCK_DIR/pid"
    return 0
  fi

  if [[ -f "$LOCK_DIR/pid" ]]; then
    local existing_pid=""
    existing_pid="$(tr -d '[:space:]' < "$LOCK_DIR/pid" 2>/dev/null || true)"
    if [[ "$existing_pid" =~ ^[1-9][0-9]*$ ]] && kill -0 "$existing_pid" 2>/dev/null; then
      echo "active_autonomous_controller_pid=$existing_pid" > "$RUN_DIR/parallel_repo_automation_detected.txt"
      return 1
    fi
    echo "stale_autonomous_lock_removed=$LOCK_DIR" | tee -a "$RUN_DIR/controller.log"
    rm -rf "$LOCK_DIR"
    mkdir "$LOCK_DIR"
    printf '%s
' "$$" > "$LOCK_DIR/pid"
    return 0
  fi

  if [[ -d "$LOCK_DIR" ]] && [[ -z "$(find "$LOCK_DIR" -mindepth 1 -maxdepth 1 -print -quit 2>/dev/null)" ]]; then
    echo "stale_legacy_empty_lock_removed=$LOCK_DIR" | tee -a "$RUN_DIR/controller.log"
    rmdir "$LOCK_DIR" 2>/dev/null || return 1
    mkdir "$LOCK_DIR"
    printf '%s
' "$$" > "$LOCK_DIR/pid"
    return 0
  fi

  echo "unowned_or_nonempty_autonomous_lock=$LOCK_DIR" > "$RUN_DIR/parallel_repo_automation_detected.txt"
  return 1
}

finish() {
  local rc="$1"
  if [[ -n "$RUN_DIR" ]]; then
    {
      echo "run_dir=$RUN_DIR"
      echo "stop_reason=$STOP_REASON"
      echo "final_status=$FINAL_STATUS"
      echo "final_exit_code=$rc"
      echo "codex_model=${CODEX_MODEL:-cli-default}"
      echo "inspect_final_summary=cat \"$RUN_DIR/final_summary.txt\""
    } > "$RUN_DIR/final_summary.txt"
    create_final_archives
  fi
  [[ -n "$LOCK_DIR" ]] && rm -rf "$LOCK_DIR"
  exit "$rc"
}
trap 'STOP_REASON="interrupted"; FINAL_STATUS="BLOCKED=yes"; finish 130' INT TERM

main() {
  mkdir -p artifacts .locks
  local stamp
  stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  RUN_DIR="$REPO_DIR/artifacts/autonomous_surebet_implementation_${stamp}"
  mkdir -p "$RUN_DIR"
  LOCK_DIR="$REPO_DIR/.locks/autonomous-controller.lock"

  log "run_dir=$RUN_DIR"
  log "repo_dir=$REPO_DIR"
  log "loading_node_runtime"
  if ! { load_node_runtime; } > >(tee -a "$RUN_DIR/controller.log") 2> >(tee -a "$RUN_DIR/controller.log" >&2); then
    STOP_REASON="node_runtime_failed"
    FINAL_STATUS="BLOCKED=yes"
    finish 1
  fi
  log "preflight=npm run validate"

  if [[ "$ALLOW_PARALLEL" != "1" ]]; then
    if ! acquire_controller_lock; then
      STOP_REASON="parallel_autonomous_refused"
      FINAL_STATUS="BLOCKED=yes"
      echo "Existing repo-scoped autonomous controller detected or nonempty lock could not be proven stale." >> "$RUN_DIR/parallel_repo_automation_detected.txt"
      finish 2
    fi
  fi

  cleanup_controller_generated_archives
  node scripts/restore-required-executable-bits.js >> "$RUN_DIR/controller.log" 2>&1 || { STOP_REASON="restore_executable_bits_failed"; finish 1; }
  run_validation preflight "$RUN_DIR" || { STOP_REASON="preflight_validation_failed"; FINAL_STATUS="BLOCKED=yes"; finish 4; }

  if [[ "$CHECK_ONLY" == "1" ]]; then
    STOP_REASON="check_only_complete"
    FINAL_STATUS="AUTONOMOUS_GOAL_COMPLETE=yes"
    finish 0
  fi

  command -v "$CODEX_BIN" >/dev/null 2>&1 || { echo "missing_required_tool=$CODEX_BIN" | tee -a "$RUN_DIR/controller.log"; STOP_REASON="codex_missing"; FINAL_STATUS="BLOCKED=yes"; finish 1; }

  local started now cycle=1 codex_rc validation_rc cycle_dir context_file status_line
  started="$(date +%s)"
  while (( cycle <= MAX_CYCLES )); do
    now="$(date +%s)"
    if (( now - started >= LOOP_SECONDS )); then
      STOP_REASON="duration_budget_exhausted"
      FINAL_STATUS="CONTINUE_REQUIRED=yes"
      finish 0
    fi

    cycle_dir="$RUN_DIR/cycle_${cycle}"
    mkdir -p "$cycle_dir"
    context_file="$(write_cycle_context "$cycle_dir")"
    write_cycle_prompt "$cycle_dir" "$cycle" "$context_file"
    log "starting_cycle=$cycle"

    run_codex_cycle "$cycle_dir"
    codex_rc=$?
    echo "codex_exit_code=$codex_rc" > "$cycle_dir/controller_cycle_status.txt"
    git diff --binary > "$cycle_dir/git_diff.patch" 2>/dev/null || true
    ensure_cycle_artifacts "$cycle_dir"

    run_validation "cycle_${cycle}" "$cycle_dir"
    validation_rc=$?
    echo "validation_exit_code=$validation_rc" >> "$cycle_dir/controller_cycle_status.txt"

    status_line="$(head -n 1 "$cycle_dir/continue_status.txt" | tr -d '\r' || true)"
    case "$status_line" in
      AUTONOMOUS_GOAL_COMPLETE=yes)
        STOP_REASON="autonomous_goal_complete"
        FINAL_STATUS="AUTONOMOUS_GOAL_COMPLETE=yes"
        finish 0 ;;
      BLOCKED=yes)
        STOP_REASON="codex_reported_blocked"
        FINAL_STATUS="BLOCKED=yes"
        finish 2 ;;
      CONTINUE_REQUIRED=yes|*)
        if [[ "$validation_rc" -ne 0 ]]; then
          STOP_REASON="post_cycle_validation_failed"
          FINAL_STATUS="BLOCKED=yes"
          finish 5
        fi
        FINAL_STATUS="CONTINUE_REQUIRED=yes"
        cycle=$((cycle + 1)) ;;
    esac
  done

  STOP_REASON="max_cycles_reached"
  FINAL_STATUS="CONTINUE_REQUIRED=yes"
  finish 0
}

main
