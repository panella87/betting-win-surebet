#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
AUTOMATION_REPO_ROOT="$SCRIPT_DIR"
# shellcheck source=.automation/lib/run_common.sh
. "$AUTOMATION_REPO_ROOT/.automation/lib/run_common.sh"

DURATION_SECONDS="$(automation_parse_duration_seconds 72h)"
INTERVAL_SECONDS=""
ADAPTIVE=0
STATUS_ONLY=0
FORCE_UNLOCK=0
FINISHED=0
EXIT_STATUS=0
STOP_REASON="not_started"
FINAL_STATUS="not_started"
CYCLES_ATTEMPTED=0
BUGFIX_ATTEMPTS=0

usage() {
  cat <<'EOF'
Usage:
  ./run-paper-evaluation.sh
  ./run-paper-evaluation.sh --duration 72h
  ./run-paper-evaluation.sh --interval 30m
  ./run-paper-evaluation.sh --adaptive
  ./run-paper-evaluation.sh --status
  ./run-paper-evaluation.sh --force-unlock

Default duration: 72h.
Paper evaluation supervises paper mode, collects evidence, invokes
./run-autonomous-bugfix.sh when bugs are detected, waits between cycles, and then resumes.

The --interval value is the wait between completed paper cycles. With --adaptive,
Codex recommends the next wait and the shell clamps it to 5..60 minutes.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --duration|--run-duration)
      [[ $# -ge 2 ]] || { echo "ERROR: $1 requires a value" >&2; exit 2; }
      DURATION_SECONDS="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid duration: $2" >&2; exit 2; }
      shift 2 ;;
    --duration=*|--run-duration=*) DURATION_SECONDS="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid duration: ${1#*=}" >&2; exit 2; }; shift ;;
    --interval)
      [[ $# -ge 2 ]] || { echo "ERROR: --interval requires a value" >&2; exit 2; }
      INTERVAL_SECONDS="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid interval: $2" >&2; exit 2; }
      shift 2 ;;
    --interval=*) INTERVAL_SECONDS="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid interval: ${1#*=}" >&2; exit 2; }; shift ;;
    --adaptive) ADAPTIVE=1; shift ;;
    --status) STATUS_ONLY=1; shift ;;
    --force-unlock) FORCE_UNLOCK=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "ERROR: unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

cd "$AUTOMATION_REPO_ROOT"
automation_load_config
SCRIPT_NAME="run-paper-evaluation.sh"
LOCK_FILE="$AUTOMATION_REPO_ROOT/.automation/locks/run-paper-evaluation.lock"

if [[ "$STATUS_ONLY" == "1" ]]; then
  automation_status_lock "$LOCK_FILE"
  exit 0
fi
if [[ "$FORCE_UNLOCK" == "1" ]]; then
  automation_force_unlock "$LOCK_FILE" "$SCRIPT_NAME" "$AUTOMATION_REPO_ROOT"
  exit 0
fi

finish() {
  local rc=$?
  [[ "$FINISHED" == "1" ]] && return 0
  FINISHED=1
  EXIT_STATUS="$rc"
  if [[ -n "${AUTOMATION_RUN_DIR:-}" ]]; then
    {
      printf '# Paper evaluation final summary\n\n'
      printf 'final_status=%s\n' "$FINAL_STATUS"
      printf 'stop_reason=%s\n' "$STOP_REASON"
      printf 'exit_status=%s\n' "$EXIT_STATUS"
      printf 'cycles_attempted=%s\n' "$CYCLES_ATTEMPTED"
      printf 'bugfix_attempts=%s\n' "$BUGFIX_ATTEMPTS"
      printf 'duration_seconds=%s\n' "$DURATION_SECONDS"
      printf 'completed_at=%s\n' "$(automation_now_iso)"
    } > "$AUTOMATION_RUN_DIR/final-summary.md"
    automation_collect_repo_snapshot "$AUTOMATION_RUN_DIR/final-repo-snapshot"
    automation_build_artifacts_zip "$AUTOMATION_RUN_DIR" "$AUTOMATION_REPO_ROOT" || true
  fi
  automation_release_lock || true
}
trap finish EXIT

automation_create_run_dir "paper_evaluation"
AUTOMATION_SCRIPT_COMMAND="$0 $*"
automation_acquire_lock "$SCRIPT_NAME" "$AUTOMATION_REPO_ROOT"
automation_start_heartbeat

REPO_DIR="$AUTOMATION_REPO_ROOT"
if [[ -f "scripts/load-node-runtime.sh" ]]; then
  # shellcheck source=scripts/load-node-runtime.sh
  . scripts/load-node-runtime.sh "$REPO_DIR"
fi

automation_collect_repo_snapshot "$AUTOMATION_RUN_DIR/initial-repo-snapshot"
automation_snapshot_protected "$AUTOMATION_RUN_DIR/protected_before.sha256"

if [[ "${PAPER_SUPPORTED:-0}" != "1" ]]; then
  FINAL_STATUS="unsupported"
  STOP_REASON="PAPER_EVALUATION_UNSUPPORTED_FOR_THIS_REPO"
  automation_log "$STOP_REASON"
  exit 12
fi
if [[ -z "${PAPER_COMMAND:-}" ]]; then
  FINAL_STATUS="unsupported"
  STOP_REASON="PAPER_COMMAND_MISSING"
  automation_log "$STOP_REASON"
  exit 12
fi
if [[ "$ADAPTIVE" == "1" ]]; then
  automation_require_command "${AUTOMATION_CODEX_BIN:-codex}"
fi
[[ -x ./run-autonomous-bugfix.sh || -f ./run-autonomous-bugfix.sh ]] || automation_die "missing ./run-autonomous-bugfix.sh" 13

if [[ -z "$INTERVAL_SECONDS" ]]; then
  INTERVAL_SECONDS="$(automation_parse_duration_seconds "${PAPER_DEFAULT_INTERVAL:-30m}")"
fi
# The adaptive wait interval is intentionally clamped to 5..60 minutes.
INTERVAL_MINUTES=$((INTERVAL_SECONDS / 60))
INTERVAL_MINUTES="$(automation_clamp_minutes "$INTERVAL_MINUTES" 5 60)"
INTERVAL_SECONDS=$((INTERVAL_MINUTES * 60))
BUGFIX_DURATION="${PAPER_BUGFIX_DURATION:-6h}"
PAPER_COMMAND_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "${PAPER_COMMAND_TIMEOUT:-20m}")"
VALIDATION_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "${AUTOMATION_VALIDATION_TIMEOUT:-20m}")"
START_EPOCH="$(automation_now_epoch)"
SIGNATURE_COUNTS_FILE="$AUTOMATION_RUN_DIR/bug-signature-counts.tsv"
: > "$SIGNATURE_COUNTS_FILE"

increment_signature_count() {
  local sig="$1"
  local existing
  local count
  local tmp
  tmp="${SIGNATURE_COUNTS_FILE}.tmp.$$"
  existing="$(awk -F'\t' -v s="$sig" '$1 == s { print $2; found=1 } END { if (!found) print 0 }' "$SIGNATURE_COUNTS_FILE")"
  count=$((existing + 1))
  awk -F'\t' -v s="$sig" '$1 != s { print }' "$SIGNATURE_COUNTS_FILE" > "$tmp"
  printf '%s\t%s\n' "$sig" "$count" >> "$tmp"
  mv "$tmp" "$SIGNATURE_COUNTS_FILE"
  printf '%s\n' "$count"
}

detect_bugs() {
  local cycle_dir="$1"
  local paper_rc="$2"
  local bug_file="$3"
  local pattern
  local log_file
  local matches=0
  : > "$bug_file"
  if [[ "$paper_rc" -ne 0 && "$paper_rc" -ne 124 ]]; then
    printf 'PAPER_COMMAND_EXIT=%s\n' "$paper_rc" >> "$bug_file"
    matches=$((matches + 1))
  fi
  while IFS= read -r -d '' log_file; do
    for pattern in "${PAPER_BUG_PATTERNS[@]:-}"; do
      if grep -EIn -- "$pattern" "$log_file" >> "$bug_file" 2>/dev/null; then
        matches=$((matches + 1))
      fi
    done
  done < <(find "$cycle_dir" -type f \( -name '*.log' -o -name '*.txt' -o -name '*.md' \) -print0)
  if [[ "$matches" -gt 0 ]]; then
    sort -u "$bug_file" -o "$bug_file"
  fi
  printf '%s\n' "$matches"
}

compute_adaptive_interval() {
  local cycle_dir="$1"
  local health_packet="$2"
  local current_minutes="$3"
  local prompt
  local out
  local rc
  local proposed
  prompt="$cycle_dir/adaptive_interval_prompt.md"
  out="$cycle_dir/adaptive_interval_codex.log"
  cat > "$prompt" <<EOF_PROMPT
You are controlling only the wait interval between paper evaluation cycles.
Return exactly one line in this format and nothing else:
NEXT_INTERVAL_MINUTES=<integer>

Rules:
- Minimum: 5
- Maximum: 60
- Use shorter intervals when the paper run is unstable, crashing, or producing new bugs.
- Use longer intervals when paper mode is stable and producing useful evidence.
- Do not request code changes.

Paper-health packet:
$(cat "$health_packet")
EOF_PROMPT
  local -a cmd=("${AUTOMATION_CODEX_BIN:-codex}" exec -C "$AUTOMATION_REPO_ROOT" --sandbox read-only "$(cat "$prompt")")
  set +e
  timeout --foreground 600s "${cmd[@]}" < /dev/null > "$out" 2>&1
  rc=$?
  set -e
  if [[ "$rc" -ne 0 ]]; then
    automation_log "adaptive_interval_codex_failed exit=$rc keeping_minutes=$current_minutes"
    printf '%s\n' "$current_minutes"
    return 0
  fi
  proposed="$(grep -Eo 'NEXT_INTERVAL_MINUTES=[0-9]+' "$out" | tail -n 1 | cut -d= -f2 || true)"
  proposed="$(automation_clamp_minutes "${proposed:-$current_minutes}" 5 60)"
  printf '%s\n' "$proposed"
}

sleep_between_cycles() {
  local seconds="$1"
  local now
  local elapsed
  now="$(automation_now_epoch)"
  elapsed=$((now - START_EPOCH))
  if (( elapsed + seconds > DURATION_SECONDS )); then
    seconds=$((DURATION_SECONDS - elapsed))
  fi
  (( seconds > 0 )) || return 0
  automation_log "paper_wait_seconds=$seconds"
  sleep "$seconds"
}

while true; do
  NOW="$(automation_now_epoch)"
  if (( NOW - START_EPOCH >= DURATION_SECONDS )); then
    FINAL_STATUS="duration_elapsed"
    STOP_REASON="duration_elapsed"
    break
  fi

  CYCLES_ATTEMPTED=$((CYCLES_ATTEMPTED + 1))
  CYCLE_DIR="$AUTOMATION_RUN_DIR/cycles/cycle_${CYCLES_ATTEMPTED}"
  mkdir -p "$CYCLE_DIR"
  PAPER_LOG="$CYCLE_DIR/paper.log"
  PAPER_RC_FILE="$CYCLE_DIR/paper_exit_code.txt"
  HEALTH_PACKET="$CYCLE_DIR/paper_health_packet.md"
  BUG_PACKET="$CYCLE_DIR/bug_packet.md"

  automation_log "paper_cycle_start cycle=$CYCLES_ATTEMPTED wait_interval_minutes=$INTERVAL_MINUTES paper_timeout_seconds=$PAPER_COMMAND_TIMEOUT_SECONDS"
  printf '%s\n' "$PAPER_COMMAND" > "$CYCLE_DIR/paper_command.txt"

  set +e
  timeout --foreground "${PAPER_COMMAND_TIMEOUT_SECONDS}s" bash -lc "$PAPER_COMMAND" > "$PAPER_LOG" 2>&1
  PAPER_RC=$?
  set -e
  printf '%s\n' "$PAPER_RC" > "$PAPER_RC_FILE"

  HEALTH_DIR="$CYCLE_DIR/health"
  mkdir -p "$HEALTH_DIR"
  automation_run_command_array PAPER_HEALTH_COMMANDS "paper_health" "$VALIDATION_TIMEOUT_SECONDS" "$HEALTH_DIR" || true

  BUG_MATCH_COUNT="$(detect_bugs "$CYCLE_DIR" "$PAPER_RC" "$BUG_PACKET")"

  {
    printf '# Paper health packet\n\n'
    printf 'cycle=%s\n' "$CYCLES_ATTEMPTED"
    printf 'paper_exit_code=%s\n' "$PAPER_RC"
    printf 'bug_match_count=%s\n' "$BUG_MATCH_COUNT"
    printf 'bugfix_attempts=%s\n' "$BUGFIX_ATTEMPTS"
    printf 'wait_interval_minutes=%s\n' "$INTERVAL_MINUTES"
    printf 'paper_timeout_seconds=%s\n' "$PAPER_COMMAND_TIMEOUT_SECONDS"
    printf 'paper_log=%s\n' "$PAPER_LOG"
    printf 'bug_packet=%s\n' "$BUG_PACKET"
    printf 'timestamp=%s\n' "$(automation_now_iso)"
  } > "$HEALTH_PACKET"

  if [[ "$BUG_MATCH_COUNT" -gt 0 ]]; then
    SIG="$(sha256sum "$BUG_PACKET" | awk '{print $1}')"
    SIG_COUNT="$(increment_signature_count "$SIG")"
    printf 'bug_signature=%s\n' "$SIG" >> "$HEALTH_PACKET"
    printf 'bug_signature_count=%s\n' "$SIG_COUNT" >> "$HEALTH_PACKET"
    if (( SIG_COUNT > ${PAPER_MAX_FIX_ATTEMPTS_PER_SIGNATURE:-3} )); then
      FINAL_STATUS="blocked"
      STOP_REASON="same_bug_signature_repeated_too_many_times"
      automation_log "$STOP_REASON signature=$SIG count=$SIG_COUNT"
      break
    fi
    BUGFIX_ATTEMPTS=$((BUGFIX_ATTEMPTS + 1))
    automation_log "bug_detected cycle=$CYCLES_ATTEMPTED invoking_bugfix attempt=$BUGFIX_ATTEMPTS"
    bash ./run-autonomous-bugfix.sh --from-artifacts "$CYCLE_DIR" --duration "$BUGFIX_DURATION"
    if ! automation_check_protected_unchanged "$AUTOMATION_RUN_DIR/protected_before.sha256" "$CYCLE_DIR/protected_after_bugfix.sha256" "$CYCLE_DIR/protected_diff_after_bugfix.patch"; then
      FINAL_STATUS="protected_files_changed"
      STOP_REASON="protected_files_changed_after_bugfix"
      exit 11
    fi
  fi

  if [[ "$ADAPTIVE" == "1" ]]; then
    INTERVAL_MINUTES="$(compute_adaptive_interval "$CYCLE_DIR" "$HEALTH_PACKET" "$INTERVAL_MINUTES")"
    INTERVAL_SECONDS=$((INTERVAL_MINUTES * 60))
    automation_log "adaptive_interval_next_minutes=$INTERVAL_MINUTES"
  fi

  FINAL_STATUS="running"
  STOP_REASON="continuing"
  sleep_between_cycles "$INTERVAL_SECONDS"
done

[[ "$FINAL_STATUS" == "duration_elapsed" || "$FINAL_STATUS" == "running" ]] && exit 0
exit 1
