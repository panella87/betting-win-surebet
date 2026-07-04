#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
AUTOMATION_REPO_ROOT="$SCRIPT_DIR"
# shellcheck source=.automation/lib/run_common.sh
. "$AUTOMATION_REPO_ROOT/.automation/lib/run_common.sh"

DURATION_SECONDS="$(automation_parse_duration_seconds 72h)"
FROM_ARTIFACTS=""
PROMPT_FILE=""
STATUS_ONLY=0
FORCE_UNLOCK=0
FINISHED=0
EXIT_STATUS=0
STOP_REASON="not_started"
FINAL_STATUS="not_started"
CYCLES_ATTEMPTED=0

usage() {
  cat <<'EOF'
Usage:
  ./run-autonomous-bugfix.sh
  ./run-autonomous-bugfix.sh --duration 72h
  ./run-autonomous-bugfix.sh --from-artifacts artifacts/paper-run-dir
  ./run-autonomous-bugfix.sh --prompt-file prompts/bugfix.md
  ./run-autonomous-bugfix.sh --status
  ./run-autonomous-bugfix.sh --force-unlock

Default duration: 72h.
No proactive/reactive mode flags are used. Every run combines reactive evidence when
available with a proactive audit for likely paper-mode failures.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --duration|--run-duration)
      [[ $# -ge 2 ]] || { echo "ERROR: $1 requires a value" >&2; exit 2; }
      DURATION_SECONDS="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid duration: $2" >&2; exit 2; }
      shift 2 ;;
    --duration=*|--run-duration=*) DURATION_SECONDS="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid duration: ${1#*=}" >&2; exit 2; }; shift ;;
    --from-artifacts)
      [[ $# -ge 2 ]] || { echo "ERROR: --from-artifacts requires a value" >&2; exit 2; }
      FROM_ARTIFACTS="$2"; shift 2 ;;
    --from-artifacts=*) FROM_ARTIFACTS="${1#*=}"; shift ;;
    --prompt-file)
      [[ $# -ge 2 ]] || { echo "ERROR: --prompt-file requires a value" >&2; exit 2; }
      PROMPT_FILE="$2"; shift 2 ;;
    --prompt-file=*) PROMPT_FILE="${1#*=}"; shift ;;
    --status) STATUS_ONLY=1; shift ;;
    --force-unlock) FORCE_UNLOCK=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "ERROR: unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

cd "$AUTOMATION_REPO_ROOT"
automation_load_config
SCRIPT_NAME="run-autonomous-bugfix.sh"
LOCK_FILE="$AUTOMATION_REPO_ROOT/.automation/locks/run-autonomous-bugfix.lock"

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
      printf '# Autonomous bugfix final summary\n\n'
      printf 'final_status=%s\n' "$FINAL_STATUS"
      printf 'stop_reason=%s\n' "$STOP_REASON"
      printf 'exit_status=%s\n' "$EXIT_STATUS"
      printf 'cycles_attempted=%s\n' "$CYCLES_ATTEMPTED"
      printf 'duration_seconds=%s\n' "$DURATION_SECONDS"
      printf 'from_artifacts=%s\n' "${FROM_ARTIFACTS:-}"
      printf 'completed_at=%s\n' "$(automation_now_iso)"
    } > "$AUTOMATION_RUN_DIR/final-summary.md"
    automation_collect_repo_snapshot "$AUTOMATION_RUN_DIR/final-repo-snapshot"
    automation_build_artifacts_zip "$AUTOMATION_RUN_DIR" "$AUTOMATION_REPO_ROOT" || true
  fi
  automation_release_lock || true
}
trap finish EXIT

automation_create_run_dir "autonomous_bugfix"
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

if [[ -n "$FROM_ARTIFACTS" && ! -e "$FROM_ARTIFACTS" ]]; then
  automation_die "--from-artifacts path does not exist: $FROM_ARTIFACTS" 10
fi
if [[ -z "$FROM_ARTIFACTS" ]]; then
  FROM_ARTIFACTS="$(automation_latest_evidence_hint "$AUTOMATION_REPO_ROOT" || true)"
fi
if [[ -n "$PROMPT_FILE" && ! -f "$PROMPT_FILE" ]]; then
  automation_die "prompt file not found: $PROMPT_FILE" 10
fi

CODEX_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "${AUTOMATION_CODEX_CYCLE_TIMEOUT:-2h}")"
VALIDATION_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "${AUTOMATION_VALIDATION_TIMEOUT:-20m}")"
START_EPOCH="$(automation_now_epoch)"
MAX_CYCLES="${AUTOMATION_MAX_CYCLES:-200}"

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
  EXTRA_PROMPT=""
  if [[ -n "$PROMPT_FILE" ]]; then
    EXTRA_PROMPT="$(cat "$PROMPT_FILE")"
  fi
  cat > "$PROMPT" <<EOF_PROMPT
Role:
Senior autonomous bugfix engineer for the repository at $AUTOMATION_REPO_ROOT.

Objective:
Find and fix bug-class issues that could break paper-mode/runtime execution. Always combine:
1. Reactive evidence from supplied/latest artifacts, when available.
2. Proactive audit of likely failure points before future paper runs.

Read these files before editing:
- AGENTS.md, if present
- docs/automation/README.md
- docs/automation/PROTECTED_AUTOMATION_FILES.md
- docs/automation/repo-profile.md
- docs/automation/autonomous-bugfix.md
- docs/automation/paper-evaluation.md

Evidence path, if any:
${FROM_ARTIFACTS:-none}

Bug classes to inspect:
- unsafe variable defaults
- missing env/config validation
- undefined/null runtime paths
- bad numeric parsing
- NaN/Infinity/division-by-zero paths
- stale state handling
- bad retry behavior
- API response shape assumptions
- persistence bugs
- lock bugs
- paper-mode startup crashes
- uncaught async failures
- validation gaps

Hard constraints:
- Fix only bug-class issues. Do not implement unrelated features.
- Do not commit, push, pull, reset, clean, stash, or rewrite branches.
- Do not print or modify secrets or .env files.
- Do not modify protected automation files unless the explicit prompt says this is automation maintenance.
- Do not hide failures with silent defaults. Missing required config must fail fast.
- Make surgical changes and preserve repo style.

Additional prompt file content:
$EXTRA_PROMPT

Required cycle output files:
- $CYCLE_DIR/bug_inventory.md
- $CYCLE_DIR/fix_plan.md
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

  if ! automation_run_validations bugfix "$CYCLE_DIR/validation" "$VALIDATION_TIMEOUT_SECONDS"; then
    FINAL_STATUS="validation_failed"
    STOP_REASON="validation_failed_cycle_${CYCLES_ATTEMPTED}"
    continue
  fi

  CONTINUE_STATUS="$(automation_read_continue_status "$CYCLE_DIR/continue_status.txt")"
  automation_log "cycle=${CYCLES_ATTEMPTED} continue_status=$CONTINUE_STATUS"
  case "$CONTINUE_STATUS" in
    AUTONOMOUS_GOAL_COMPLETE=yes)
      FINAL_STATUS="bugfix_complete"
      STOP_REASON="bugfix_complete"
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

[[ "$FINAL_STATUS" == "bugfix_complete" ]] && exit 0
[[ "$FINAL_STATUS" == "continue_required" || "$FINAL_STATUS" == "duration_elapsed" || "$FINAL_STATUS" == "max_cycles_reached" ]] && exit 0
exit 1
