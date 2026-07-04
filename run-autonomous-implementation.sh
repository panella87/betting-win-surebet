#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
AUTOMATION_REPO_ROOT="$SCRIPT_DIR"
# shellcheck source=.automation/lib/run_common.sh
. "$AUTOMATION_REPO_ROOT/.automation/lib/run_common.sh"

DURATION_SECONDS="$(automation_parse_duration_seconds 72h)"
PROMPT_FILE=""
STATUS_ONLY=0
FORCE_UNLOCK=0
CHECK_ONLY=0
FINISHED=0
EXIT_STATUS=0
STOP_REASON="not_started"
FINAL_STATUS="not_started"
CYCLES_ATTEMPTED=0

usage() {
  cat <<'EOF'
Usage:
  ./run-autonomous-implementation.sh
  ./run-autonomous-implementation.sh --duration 72h
  ./run-autonomous-implementation.sh --prompt-file prompts/task.md
  ./run-autonomous-implementation.sh --status
  ./run-autonomous-implementation.sh --force-unlock
  ./run-autonomous-implementation.sh --check-only

Default duration: 72h.
No --task flag is supported. Use --prompt-file or docs/automation/current-implementation-task.md.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --duration|--run-duration)
      [[ $# -ge 2 ]] || { echo "ERROR: $1 requires a value" >&2; exit 2; }
      DURATION_SECONDS="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid duration: $2" >&2; exit 2; }
      shift 2 ;;
    --duration=*|--run-duration=*) DURATION_SECONDS="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid duration: ${1#*=}" >&2; exit 2; }; shift ;;
    --prompt-file)
      [[ $# -ge 2 ]] || { echo "ERROR: --prompt-file requires a value" >&2; exit 2; }
      PROMPT_FILE="$2"; shift 2 ;;
    --prompt-file=*) PROMPT_FILE="${1#*=}"; shift ;;
    --status) STATUS_ONLY=1; shift ;;
    --force-unlock) FORCE_UNLOCK=1; shift ;;
    --check-only) CHECK_ONLY=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "ERROR: unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

cd "$AUTOMATION_REPO_ROOT"
automation_load_config
SCRIPT_NAME="run-autonomous-implementation.sh"
LOCK_FILE="$AUTOMATION_REPO_ROOT/.automation/locks/run-autonomous-implementation.lock"

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
      printf '# Autonomous implementation final summary\n\n'
      printf 'final_status=%s\n' "$FINAL_STATUS"
      printf 'stop_reason=%s\n' "$STOP_REASON"
      printf 'exit_status=%s\n' "$EXIT_STATUS"
      printf 'cycles_attempted=%s\n' "$CYCLES_ATTEMPTED"
      printf 'duration_seconds=%s\n' "$DURATION_SECONDS"
      printf 'completed_at=%s\n' "$(automation_now_iso)"
    } > "$AUTOMATION_RUN_DIR/final-summary.md"
    automation_collect_repo_snapshot "$AUTOMATION_RUN_DIR/final-repo-snapshot"
    automation_build_artifacts_zip "$AUTOMATION_RUN_DIR" "$AUTOMATION_REPO_ROOT" || true
  fi
  automation_release_lock || true
}
trap finish EXIT

automation_create_run_dir "autonomous_implementation"
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

TASK_SOURCE=""
if [[ -n "$PROMPT_FILE" ]]; then
  [[ -f "$PROMPT_FILE" ]] || automation_die "prompt file not found: $PROMPT_FILE" 10
  TASK_SOURCE="$PROMPT_FILE"
else
  TASK_SOURCE="docs/automation/current-implementation-task.md"
  [[ -f "$TASK_SOURCE" ]] || automation_die "missing current implementation task: $TASK_SOURCE" 10
fi
if grep -q 'AUTOMATION_TASK_NOT_SET' "$TASK_SOURCE"; then
  automation_die "implementation task is not set in $TASK_SOURCE" 10
fi
if [[ ! -s "$TASK_SOURCE" ]]; then
  automation_die "implementation task file is empty: $TASK_SOURCE" 10
fi

CODEX_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "${AUTOMATION_CODEX_CYCLE_TIMEOUT:-2h}")"
VALIDATION_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "${AUTOMATION_VALIDATION_TIMEOUT:-20m}")"
START_EPOCH="$(automation_now_epoch)"
MAX_CYCLES="${AUTOMATION_MAX_CYCLES:-200}"

if [[ "$CHECK_ONLY" == "1" ]]; then
  automation_log "check_only=1"
  automation_run_validations implementation "$AUTOMATION_RUN_DIR/check-only-validation" "$VALIDATION_TIMEOUT_SECONDS" || true
  FINAL_STATUS="check_only_complete"
  STOP_REASON="check_only"
  exit 0
fi

automation_require_command "${AUTOMATION_CODEX_BIN:-codex}"

while true; do
  NOW="$(automation_now_epoch)"
  if (( NOW - START_EPOCH >= DURATION_SECONDS )); then
    FINAL_STATUS="duration_elapsed"
    STOP_REASON="duration_elapsed"
    break
  fi
  if (( CYCLES_ATTEMPTED >= MAX_CYCLES )); then
    FINAL_STATUS="max_cycles_reached"
    STOP_REASON="max_cycles_reached"
    break
  fi

  CYCLES_ATTEMPTED=$((CYCLES_ATTEMPTED + 1))
  CYCLE_DIR="$AUTOMATION_RUN_DIR/cycles/cycle_${CYCLES_ATTEMPTED}"
  mkdir -p "$CYCLE_DIR"
  PROMPT="$CYCLE_DIR/codex_prompt.md"
  cat > "$PROMPT" <<EOF_PROMPT
Role:
Senior autonomous implementation engineer for the repository at $AUTOMATION_REPO_ROOT.

Objective:
Implement the requested bounded task using the smallest safe changes, then validate.

Read these files before editing:
- AGENTS.md, if present
- docs/automation/README.md
- docs/automation/PROTECTED_AUTOMATION_FILES.md
- docs/automation/repo-profile.md
- docs/automation/autonomous-implementation.md
- $TASK_SOURCE

Hard constraints:
- Do not commit, push, pull, reset, clean, stash, or rewrite branches.
- Do not print or modify secrets or .env files.
- Do not modify protected automation files unless the task explicitly says this is automation maintenance.
- Do not silently default missing required configuration. Fail fast with clear validation.
- Preserve existing structure and make surgical changes.
- Run targeted validation and configured repo validation where practical.

Required cycle output files:
- $CYCLE_DIR/implementation_plan.md
- $CYCLE_DIR/changes_made.md
- $CYCLE_DIR/validation_results.md
- $CYCLE_DIR/remaining_gaps.md
- $CYCLE_DIR/git_diff.patch
- $CYCLE_DIR/final_status.md
- $CYCLE_DIR/continue_status.txt

continue_status.txt must contain exactly one of these lines:
- CONTINUE_REQUIRED=yes
- AUTONOMOUS_GOAL_COMPLETE=yes
- BLOCKED=yes

Task source content:
$(cat "$TASK_SOURCE")
EOF_PROMPT

  if ! automation_run_codex_prompt "$PROMPT" "$CYCLE_DIR/codex.log" "$CODEX_TIMEOUT_SECONDS"; then
    FINAL_STATUS="codex_failed"
    STOP_REASON="codex_failed_cycle_${CYCLES_ATTEMPTED}"
    break
  fi

  git -C "$AUTOMATION_REPO_ROOT" diff --no-ext-diff > "$CYCLE_DIR/git_diff.patch" 2>/dev/null || true

  if ! automation_check_protected_unchanged "$AUTOMATION_RUN_DIR/protected_before.sha256" "$CYCLE_DIR/protected_after.sha256" "$CYCLE_DIR/protected_diff.patch"; then
    FINAL_STATUS="protected_files_changed"
    STOP_REASON="protected_files_changed"
    exit 11
  fi

  if ! automation_run_validations implementation "$CYCLE_DIR/validation" "$VALIDATION_TIMEOUT_SECONDS"; then
    FINAL_STATUS="validation_failed"
    STOP_REASON="validation_failed_cycle_${CYCLES_ATTEMPTED}"
    continue
  fi

  CONTINUE_STATUS="$(automation_read_continue_status "$CYCLE_DIR/continue_status.txt")"
  automation_log "cycle=${CYCLES_ATTEMPTED} continue_status=$CONTINUE_STATUS"
  case "$CONTINUE_STATUS" in
    AUTONOMOUS_GOAL_COMPLETE=yes)
      FINAL_STATUS="goal_complete"
      STOP_REASON="goal_complete"
      break ;;
    BLOCKED=yes)
      FINAL_STATUS="blocked"
      STOP_REASON="blocked_by_cycle_${CYCLES_ATTEMPTED}"
      break ;;
    CONTINUE_REQUIRED=yes)
      FINAL_STATUS="continue_required"
      STOP_REASON="continuing" ;;
  esac
done

[[ "$FINAL_STATUS" == "goal_complete" ]] && exit 0
[[ "$FINAL_STATUS" == "continue_required" || "$FINAL_STATUS" == "duration_elapsed" || "$FINAL_STATUS" == "max_cycles_reached" ]] && exit 0
exit 1
