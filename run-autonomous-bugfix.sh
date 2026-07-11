#!/usr/bin/env bash
# Read-only bug-audit and strict autonomous-implementation handoff controller.
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
AUTOMATION_REPO_ROOT="$SCRIPT_DIR"
# shellcheck source=.automation/lib/run_common.sh
. "$AUTOMATION_REPO_ROOT/.automation/lib/run_common.sh"
# shellcheck source=.automation/lib/controller_hardening_v2.sh
. "$AUTOMATION_REPO_ROOT/.automation/lib/controller_hardening_v2.sh"
# shellcheck source=.automation/lib/telegram_notify.sh
. "$AUTOMATION_REPO_ROOT/.automation/lib/telegram_notify.sh"

SCRIPT_VERSION="2026-07-11.surebet-bugfix-v3-strict-audit-handoff"
SCRIPT_NAME="run-autonomous-bugfix.sh"
DURATION_SECONDS="$(automation_parse_duration_seconds 72h)"
FROM_ARTIFACTS=""
PROMPT_FILE=""
BUGFIX_FOCUS_FILE=""
CAMPAIGN_AREA="standalone_full_audit"
REPO_DIR_OVERRIDE=""
STATUS_ONLY=0
FORCE_UNLOCK=0
CHECK_ONLY=0
PRINT_CONFIG=0
AUTO_INSTALL=0
ALLOW_PARALLEL=0
HANDOVER_AUTONOMOUS_IMPLEMENTATION=0
CONTEXT_COMPRESSION_RETRY=1
FINISHED=0
EXIT_STATUS=0
STOP_REASON="not_started"
FINAL_STATUS="not_started"
CYCLES_ATTEMPTED=0
LOCK_ACQUIRED=0
CODEX_TIMEOUT_SECONDS=""
VALIDATION_TIMEOUT_SECONDS=""
INSTALL_TIMEOUT_SECONDS=""
ZIP_TIMEOUT_SECONDS=""
MAX_CYCLES=""
CODEX_MODEL=""
CODEX_FALLBACK_MODEL=""
CODEX_SANDBOX=""
CODEX_STREAM_LOGS=""
TASK_SOURCE=""
ARTIFACT_HINT=""
INITIAL_SOURCE_FINGERPRINT=""
LAST_CYCLE_SOURCE_FINGERPRINT_BEFORE=""
LAST_CYCLE_SOURCE_FINGERPRINT_AFTER_CODEX=""
LAST_CYCLE_SOURCE_FINGERPRINT_AFTER_VALIDATION=""
BASELINE_VALIDATION_STATUS="not_run"
BASELINE_VALIDATION_EXIT_CODE="not_run"
LAST_VALIDATION_STATUS="not_run"
LAST_VALIDATION_EXIT_CODE="not_run"
LAST_CODEX_FAILURE_CLASS="none"
HANDOFF_FINGERPRINT=""
HANDOFF_EVIDENCE_FILE=""

usage() {
  cat <<'EOF_USAGE'
Usage:
  ./run-autonomous-bugfix.sh [options]

Purpose:
  Read-only source bug-audit and strict implementation-handoff controller.
  It must not patch app source directly.

Primary options:
  --duration VALUE                         Campaign scheduling budget. Default: 72h.
  --from-artifacts PATH                    Explicit artifacts zip or directory to audit first.
  --prompt-file PATH                       Override the standard bug-audit task source.
  --bugfix-focus-file PATH                 Add a bounded repo-local audit focus contract.
  --campaign-area SLUG                     Stable bounded audit-area identifier.
  --model MODEL                            Override Codex model. cli-default uses the CLI/profile default.
  --fallback-model MODEL                   Retry model-availability failures once. none disables fallback.
  --repo-dir PATH                          Override repository root discovery.
  --handover-autonomous-implementation     Emit a fingerprinted implementation handoff for confirmed bugs.

Limits and timeouts:
  --cycle-timeout VALUE                    Maximum duration of one Codex audit cycle. Default: 2h.
  --validation-timeout VALUE               Maximum duration of each validation command. Default: 20m.
  --install-timeout VALUE                  Maximum optional dependency install duration. Default: 15m.
  --zip-timeout VALUE                      Maximum final artifacts.zip duration. Default: 10m.
  --max-cycles N                           Hard cycle-count ceiling. Default: 200.
  --no-context-retry                       Disable the one-shot compact context-window retry.

Operational options:
  --sandbox MODE                           read-only, workspace-write, or danger-full-access.
  --auto-install                           Permit npm ci --ignore-scripts when node_modules is absent.
  --check-only                             Run preflight validation and source-immutability checks only.
  --status                                 Print lock status and exit.
  --force-unlock                           Terminate only a verified repo-scoped owner and remove the lock.
  --allow-parallel                         Explicitly skip this controller lock for this run.
  --print-config                           Print effective non-secret configuration and exit.
  --stream / --no-stream                   Stream Codex output or save it only to logs.
  -h, --help                               Show this help.

Terminal contract:
  BUGFIX_AUDIT_COMPLETE=yes
  CONTINUE_REQUIRED=yes
  HANDOVER_AUTONOMOUS_IMPLEMENTATION=yes
  BLOCKED=yes

The controller inherits Node.js and npm from the parent shell and never sources nvm.sh.
EOF_USAGE
}

parse_positive_int() {
  local raw="$1" label="$2"
  [[ "$raw" =~ ^[1-9][0-9]*$ ]] || { echo "ERROR: $label must be a positive integer: $raw" >&2; return 2; }
  printf '%s\n' "$raw"
}

parse_slug() {
  local raw="$1" label="$2"
  [[ "$raw" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || { echo "ERROR: $label must be a stable slug: $raw" >&2; return 2; }
  printf '%s\n' "$raw"
}

parse_args() {
  local parsed
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --duration|--run-duration) [[ $# -ge 2 ]] || return 2; parsed="$(automation_parse_duration_seconds "$2")" || return 2; DURATION_SECONDS="$parsed"; shift 2 ;;
      --duration=*|--run-duration=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || return 2; DURATION_SECONDS="$parsed"; shift ;;
      --from-artifacts) [[ $# -ge 2 ]] || return 2; FROM_ARTIFACTS="$2"; shift 2 ;;
      --from-artifacts=*) FROM_ARTIFACTS="${1#*=}"; shift ;;
      --prompt-file) [[ $# -ge 2 ]] || return 2; PROMPT_FILE="$2"; shift 2 ;;
      --prompt-file=*) PROMPT_FILE="${1#*=}"; shift ;;
      --bugfix-focus-file) [[ $# -ge 2 ]] || return 2; BUGFIX_FOCUS_FILE="$2"; shift 2 ;;
      --bugfix-focus-file=*) BUGFIX_FOCUS_FILE="${1#*=}"; shift ;;
      --campaign-area) [[ $# -ge 2 ]] || return 2; CAMPAIGN_AREA="$(parse_slug "$2" --campaign-area)" || return 2; shift 2 ;;
      --campaign-area=*) CAMPAIGN_AREA="$(parse_slug "${1#*=}" --campaign-area)" || return 2; shift ;;
      --model) [[ $# -ge 2 ]] || return 2; CODEX_MODEL="$2"; shift 2 ;;
      --model=*) CODEX_MODEL="${1#*=}"; shift ;;
      --fallback-model) [[ $# -ge 2 ]] || return 2; CODEX_FALLBACK_MODEL="$2"; shift 2 ;;
      --fallback-model=*) CODEX_FALLBACK_MODEL="${1#*=}"; shift ;;
      --repo-dir) [[ $# -ge 2 ]] || return 2; REPO_DIR_OVERRIDE="$2"; shift 2 ;;
      --repo-dir=*) REPO_DIR_OVERRIDE="${1#*=}"; shift ;;
      --cycle-timeout) [[ $# -ge 2 ]] || return 2; CODEX_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "$2")" || return 2; shift 2 ;;
      --cycle-timeout=*) CODEX_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "${1#*=}")" || return 2; shift ;;
      --validation-timeout) [[ $# -ge 2 ]] || return 2; VALIDATION_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "$2")" || return 2; shift 2 ;;
      --validation-timeout=*) VALIDATION_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "${1#*=}")" || return 2; shift ;;
      --install-timeout) [[ $# -ge 2 ]] || return 2; INSTALL_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "$2")" || return 2; shift 2 ;;
      --install-timeout=*) INSTALL_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "${1#*=}")" || return 2; shift ;;
      --zip-timeout) [[ $# -ge 2 ]] || return 2; ZIP_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "$2")" || return 2; shift 2 ;;
      --zip-timeout=*) ZIP_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "${1#*=}")" || return 2; shift ;;
      --max-cycles) [[ $# -ge 2 ]] || return 2; MAX_CYCLES="$(parse_positive_int "$2" --max-cycles)" || return 2; shift 2 ;;
      --max-cycles=*) MAX_CYCLES="$(parse_positive_int "${1#*=}" --max-cycles)" || return 2; shift ;;
      --sandbox) [[ $# -ge 2 ]] || return 2; CODEX_SANDBOX="$2"; shift 2 ;;
      --sandbox=*) CODEX_SANDBOX="${1#*=}"; shift ;;
      --handover-autonomous-implementation) HANDOVER_AUTONOMOUS_IMPLEMENTATION=1; shift ;;
      --no-context-retry) CONTEXT_COMPRESSION_RETRY=0; shift ;;
      --auto-install) AUTO_INSTALL=1; shift ;;
      --check-only) CHECK_ONLY=1; shift ;;
      --status) STATUS_ONLY=1; shift ;;
      --force-unlock) FORCE_UNLOCK=1; shift ;;
      --allow-parallel) ALLOW_PARALLEL=1; shift ;;
      --print-config) PRINT_CONFIG=1; shift ;;
      --stream) CODEX_STREAM_LOGS=1; shift ;;
      --no-stream) CODEX_STREAM_LOGS=0; shift ;;
      -h|--help) usage; exit 0 ;;
      *) echo "ERROR: unknown option: $1" >&2; usage >&2; return 2 ;;
    esac
  done
}

configure_defaults() {
  if [[ -n "$REPO_DIR_OVERRIDE" ]]; then AUTOMATION_REPO_ROOT="$(cd "$REPO_DIR_OVERRIDE" && pwd -P)"; fi
  cd "$AUTOMATION_REPO_ROOT"
  automation_load_config
  CODEX_TIMEOUT_SECONDS="${CODEX_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_CODEX_CYCLE_TIMEOUT:-2h}")}"
  VALIDATION_TIMEOUT_SECONDS="${VALIDATION_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_VALIDATION_TIMEOUT:-20m}")}"
  INSTALL_TIMEOUT_SECONDS="${INSTALL_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_INSTALL_TIMEOUT:-15m}")}"
  ZIP_TIMEOUT_SECONDS="${ZIP_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_ZIP_TIMEOUT:-10m}")}"
  MAX_CYCLES="${MAX_CYCLES:-${AUTOMATION_MAX_CYCLES:-200}}"
  CODEX_MODEL="${CODEX_MODEL:-${AUTOMATION_CODEX_MODEL:-}}"
  CODEX_FALLBACK_MODEL="${CODEX_FALLBACK_MODEL:-${AUTOMATION_CODEX_FALLBACK_MODEL:-}}"
  CODEX_SANDBOX="${CODEX_SANDBOX:-${AUTOMATION_CODEX_SANDBOX:-danger-full-access}}"
  CODEX_STREAM_LOGS="${CODEX_STREAM_LOGS:-${AUTOMATION_CODEX_STREAM_LOGS:-1}}"
  case "$CODEX_MODEL" in default|cli-default) CODEX_MODEL="" ;; esac
  case "$CODEX_FALLBACK_MODEL" in default|cli-default) CODEX_FALLBACK_MODEL="cli-default" ;; none|off|disabled) CODEX_FALLBACK_MODEL="" ;; esac
  AUTOMATION_CODEX_MODEL="$CODEX_MODEL"
  AUTOMATION_CODEX_FALLBACK_MODEL="$CODEX_FALLBACK_MODEL"
  AUTOMATION_CODEX_SANDBOX="$CODEX_SANDBOX"
  AUTOMATION_CODEX_STREAM_LOGS="$CODEX_STREAM_LOGS"
}

validate_inputs() {
  local value
  for value in "$DURATION_SECONDS" "$CODEX_TIMEOUT_SECONDS" "$VALIDATION_TIMEOUT_SECONDS" "$INSTALL_TIMEOUT_SECONDS" "$ZIP_TIMEOUT_SECONDS" "$MAX_CYCLES"; do
    [[ "$value" =~ ^[1-9][0-9]*$ ]] || { echo "ERROR: expected positive integer configuration, got: $value" >&2; return 2; }
  done
  case "$CODEX_SANDBOX" in read-only|workspace-write|danger-full-access) ;; *) echo "ERROR: unsupported sandbox: $CODEX_SANDBOX" >&2; return 2 ;; esac
  [[ "$CONTEXT_COMPRESSION_RETRY" == 0 || "$CONTEXT_COMPRESSION_RETRY" == 1 ]] || return 2
}

model_display() { [[ -n "$CODEX_MODEL" ]] && printf '%s\n' "$CODEX_MODEL" || printf 'cli-default\n'; }
fallback_display() { [[ -n "$CODEX_FALLBACK_MODEL" ]] && printf '%s\n' "$CODEX_FALLBACK_MODEL" || printf 'none\n'; }

print_config() {
  cat <<EOF_CONFIG
controller=$SCRIPT_NAME
script_version=$SCRIPT_VERSION
controller_mode=read_only_bug_audit_strict_handoff
repo_dir=$AUTOMATION_REPO_ROOT
duration_seconds=$DURATION_SECONDS
from_artifacts=${FROM_ARTIFACTS:-auto}
bugfix_focus_file=${BUGFIX_FOCUS_FILE:-none}
campaign_area=$CAMPAIGN_AREA
cycle_timeout_seconds=$CODEX_TIMEOUT_SECONDS
validation_timeout_seconds=$VALIDATION_TIMEOUT_SECONDS
install_timeout_seconds=$INSTALL_TIMEOUT_SECONDS
zip_timeout_seconds=$ZIP_TIMEOUT_SECONDS
max_cycles=$MAX_CYCLES
model=$(model_display)
fallback_model=$(fallback_display)
sandbox=$CODEX_SANDBOX
stream_logs=$CODEX_STREAM_LOGS
auto_install=$AUTO_INSTALL
allow_parallel=$ALLOW_PARALLEL
handover_autonomous_implementation=$HANDOVER_AUTONOMOUS_IMPLEMENTATION
context_compression_retry=$CONTEXT_COMPRESSION_RETRY
four_state_contract=enabled
strict_request_flags=enabled
semantic_handoff_fingerprint=enabled
machine_readable_final_stdout=enabled
EOF_CONFIG
}

assert_active_node_runtime() {
  automation_require_command node
  automation_require_command npm
  local expected_major="" node_version
  node_version="$(node --version 2>/dev/null || true)"
  if [[ -f "$AUTOMATION_REPO_ROOT/.nvmrc" ]]; then expected_major="$(tr -d '[:space:]' < "$AUTOMATION_REPO_ROOT/.nvmrc" | sed -E 's/^v?([0-9]+).*/\1/')"; fi
  if [[ -n "$expected_major" && ! "$node_version" =~ ^v${expected_major}\. ]]; then
    echo "ERROR: active Node runtime must match .nvmrc; expected major $expected_major, got ${node_version:-missing}" >&2
    echo 'Activate the repo runtime in the parent shell first: . "$HOME/.nvm/nvm.sh" && nvm use 20' >&2
    return 1
  fi
  automation_log "NODE_OK=$node_version"
  automation_log "NPM_OK=$(npm --version 2>/dev/null || true)"
}

maybe_auto_install() {
  [[ "$AUTO_INSTALL" == 1 ]] || return 0
  [[ -d "$AUTOMATION_REPO_ROOT/node_modules" ]] && return 0
  local command="npm install --ignore-scripts"
  [[ -f "$AUTOMATION_REPO_ROOT/package-lock.json" ]] && command="npm ci --ignore-scripts"
  automation_run_shell_command auto_install "$command" "$INSTALL_TIMEOUT_SECONDS" "$AUTOMATION_RUN_DIR/auto-install.log"
}

resolve_task_source() {
  if [[ -n "$PROMPT_FILE" ]]; then
    [[ -f "$PROMPT_FILE" && ! -L "$PROMPT_FILE" ]] || automation_die "prompt file not found or is a symlink: $PROMPT_FILE" 1
    TASK_SOURCE="$(automation_v2_safe_repo_path "$AUTOMATION_REPO_ROOT" "$PROMPT_FILE" yes)" || automation_die "prompt file must be repo-local" 1
  else
    TASK_SOURCE="$AUTOMATION_REPO_ROOT/docs/automation/autonomous-bugfix.md"
  fi
  [[ -s "$TASK_SOURCE" ]] || automation_die "bugfix task source is empty: $TASK_SOURCE" 1
  if [[ -n "$BUGFIX_FOCUS_FILE" ]]; then
    [[ -f "$BUGFIX_FOCUS_FILE" && ! -L "$BUGFIX_FOCUS_FILE" ]] || automation_die "bugfix focus file not found or is a symlink: $BUGFIX_FOCUS_FILE" 1
    BUGFIX_FOCUS_FILE="$(automation_v2_safe_repo_path "$AUTOMATION_REPO_ROOT" "$BUGFIX_FOCUS_FILE" yes)" || automation_die "bugfix focus file must be repo-local" 1
    [[ -s "$BUGFIX_FOCUS_FILE" ]] || automation_die "bugfix focus file is empty" 1
  fi
}

resolve_artifact_hint() {
  if [[ -n "$FROM_ARTIFACTS" ]]; then
    [[ -e "$FROM_ARTIFACTS" ]] || automation_die "--from-artifacts path not found: $FROM_ARTIFACTS" 1
    realpath -e -- "$FROM_ARTIFACTS"
    return
  fi
  [[ -d "$AUTOMATION_REPO_ROOT/artifacts" ]] && automation_latest_evidence_hint "$AUTOMATION_REPO_ROOT" || true
}

source_status_snapshot() {
  local out_file="$1"
  if git -C "$AUTOMATION_REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git -C "$AUTOMATION_REPO_ROOT" status --short --untracked-files=all -- . ':!artifacts' ':!artifacts.zip' ':!.automation/locks' > "$out_file" 2>/dev/null || true
  else
    find "$AUTOMATION_REPO_ROOT" -maxdepth 2 -type f | sort > "$out_file"
  fi
}

compute_source_fingerprint() { automation_v2_source_tree_fingerprint "$AUTOMATION_REPO_ROOT"; }

run_baseline_validation() {
  local before after dir="$AUTOMATION_RUN_DIR/preflight/baseline-validation"
  mkdir -p "$dir"
  before="$(compute_source_fingerprint)" || return 2
  set +e
  automation_run_validations bugfix "$dir" "$VALIDATION_TIMEOUT_SECONDS"
  BASELINE_VALIDATION_EXIT_CODE=$?
  set -e
  after="$(compute_source_fingerprint)" || return 2
  [[ "$before" == "$after" ]] || { FINAL_STATUS="BLOCKED=yes"; STOP_REASON="baseline_validation_mutated_source"; return 2; }
  [[ "$BASELINE_VALIDATION_EXIT_CODE" == 0 ]] && BASELINE_VALIDATION_STATUS=passed || BASELINE_VALIDATION_STATUS=failed
  {
    printf 'baseline_validation_status=%s\n' "$BASELINE_VALIDATION_STATUS"
    printf 'baseline_validation_exit_code=%s\n' "$BASELINE_VALIDATION_EXIT_CODE"
    printf 'baseline_validation_dir=%s\n' "$dir"
  } > "$AUTOMATION_RUN_DIR/preflight/baseline-validation.env"
}

codex_failure_class() {
  local log="$1" rc="$2"
  if [[ "$rc" == 124 || "$rc" == 137 ]]; then printf 'timeout\n'; return; fi
  if grep -qiE 'context_length_exceeded|context window|maximum context|input exceeds.*context|too many tokens|token limit' "$log" 2>/dev/null; then printf 'context_window\n'; return; fi
  if grep -qiE 'usage limit|rate limit|quota|insufficient credits|model .*not found|unknown model|model unavailable|capacity|temporarily unavailable|overloaded' "$log" 2>/dev/null; then printf 'model_availability\n'; return; fi
  printf 'generic\n'
}

run_codex_attempt() {
  local prompt="$1" log="$2" model="$3" saved_fallback rc
  saved_fallback="${AUTOMATION_CODEX_FALLBACK_MODEL:-}"
  AUTOMATION_CODEX_FALLBACK_MODEL=""
  set +e
  automation_run_codex_prompt "$prompt" "$log" "$CODEX_TIMEOUT_SECONDS" "$model"
  rc=$?
  set -e
  AUTOMATION_CODEX_FALLBACK_MODEL="$saved_fallback"
  return "$rc"
}

write_compact_retry_prompt() {
  local original="$1" compact="$2"
  cat > "$compact" <<EOF_COMPACT
Role: senior read-only autonomous bug-audit engineer.

Repeat the exact bounded audit defined by:
- original prompt: $original
- task source: $TASK_SOURCE
- campaign area: $CAMPAIGN_AREA

This is a one-shot compact retry after a context-window failure. Read the referenced files directly. Do not edit source. Produce every required cycle artifact and the exact four-state/request-flags contract from the original prompt.
EOF_COMPACT
}

run_codex_cycle() {
  local prompt="$1" cycle_dir="$2" before after rc class compact
  before="$(compute_source_fingerprint 2>/dev/null || true)"
  if run_codex_attempt "$prompt" "$cycle_dir/codex.log" "$CODEX_MODEL"; then rc=0; else rc=$?; fi
  [[ "$rc" == 0 ]] && { LAST_CODEX_FAILURE_CLASS=none; return 0; }
  after="$(compute_source_fingerprint 2>/dev/null || true)"
  class="$(codex_failure_class "$cycle_dir/codex.log" "$rc")"
  LAST_CODEX_FAILURE_CLASS="$class"
  [[ -z "$before" || "$before" == "$after" ]] || return "$rc"

  if [[ "$class" == context_window && "$CONTEXT_COMPRESSION_RETRY" == 1 ]]; then
    compact="$cycle_dir/codex_prompt_compact_retry.md"
    write_compact_retry_prompt "$prompt" "$compact"
    if run_codex_attempt "$compact" "$cycle_dir/codex-context-retry.log" "$CODEX_MODEL"; then rc=0; else rc=$?; fi
    [[ "$rc" == 0 ]] && { LAST_CODEX_FAILURE_CLASS=none; return 0; }
    after="$(compute_source_fingerprint 2>/dev/null || true)"
    [[ -z "$before" || "$before" == "$after" ]] || return "$rc"
    class="$(codex_failure_class "$cycle_dir/codex-context-retry.log" "$rc")"
    LAST_CODEX_FAILURE_CLASS="$class"
  fi

  if [[ "$class" == model_availability && -n "$CODEX_FALLBACK_MODEL" ]]; then
    if run_codex_attempt "$prompt" "$cycle_dir/codex-fallback.log" "$CODEX_FALLBACK_MODEL"; then rc=0; else rc=$?; fi
    [[ "$rc" == 0 ]] && { LAST_CODEX_FAILURE_CLASS=none; return 0; }
    LAST_CODEX_FAILURE_CLASS="$(codex_failure_class "$cycle_dir/codex-fallback.log" "$rc")"
  fi
  return "$rc"
}

read_bugfix_continue_status() {
  local file="$1" value count
  [[ -f "$file" ]] || { echo "ERROR: missing continue status file: $file" >&2; return 2; }
  count="$(grep -cv '^[[:space:]]*$' "$file" || true)"
  [[ "$count" == 1 ]] || { echo "ERROR: bugfix continue status must contain exactly one non-empty line" >&2; return 2; }
  value="$(grep -v '^[[:space:]]*$' "$file" | tr -d '\r')"
  case "$value" in
    BUGFIX_AUDIT_COMPLETE=yes|CONTINUE_REQUIRED=yes|HANDOVER_AUTONOMOUS_IMPLEMENTATION=yes|BLOCKED=yes) printf '%s\n' "$value" ;;
    *) echo "ERROR: unknown bugfix continue status: $value" >&2; return 2 ;;
  esac
}

validate_protected_allowlist() {
  local csv="$1" item known found
  local -a items=()
  [[ -z "$csv" || "$csv" == none ]] && return 0
  IFS=',' read -r -a items <<< "$csv"
  for item in "${items[@]}"; do
    [[ -n "$item" && "$item" != /* && "$item" != *'..'* ]] || return 2
    found=0
    for known in "${AUTOMATION_PROTECTED_FILES[@]:-}"; do [[ "$known" == "$item" ]] && found=1; done
    [[ "$found" == 1 ]] || { echo "ERROR: unknown protected-file allowlist entry: $item" >&2; return 2; }
  done
}

load_and_validate_request_flags() {
  local file="$1" status="$2" key value
  local -A allowed=(
    [BUGS_FOUND]=1 [HANDOVER_AUTONOMOUS_IMPLEMENTATION_REQUIRED]=1 [NEXT_AUDIT_AREA]=1
    [CAMPAIGN_AREA]=1 [CAMPAIGN_AREA_COMPLETE]=1 [SOURCE_EVIDENCE_COMPLETE]=1
    [BUG_IDS]=1 [IMPLEMENTATION_SCOPE]=1 [BUGFIX_MODE_AUTOMATION_MAINTENANCE_ALLOWED]=1
    [ALLOWED_PROTECTED_FILES]=1
  )
  automation_v2_load_env_strict "$file" || return 2
  for key in "${!AUTOMATION_V2_ENV[@]}"; do [[ -n "${allowed[$key]+x}" ]] || { echo "ERROR: unknown request_flags key: $key" >&2; return 2; }; done
  for key in "${!allowed[@]}"; do automation_v2_env_require "$key" >/dev/null || return 2; done
  for key in BUGS_FOUND HANDOVER_AUTONOMOUS_IMPLEMENTATION_REQUIRED CAMPAIGN_AREA_COMPLETE SOURCE_EVIDENCE_COMPLETE BUGFIX_MODE_AUTOMATION_MAINTENANCE_ALLOWED; do
    automation_v2_validate_yes_no_value "$key" "${AUTOMATION_V2_ENV[$key]}" || return 2
  done
  [[ "${AUTOMATION_V2_ENV[CAMPAIGN_AREA]}" == "$CAMPAIGN_AREA" ]] || { echo "ERROR: request_flags campaign area mismatch" >&2; return 2; }
  [[ "${AUTOMATION_V2_ENV[NEXT_AUDIT_AREA]}" == none || "${AUTOMATION_V2_ENV[NEXT_AUDIT_AREA]}" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || return 2
  [[ "${AUTOMATION_V2_ENV[BUG_IDS]}" == none || "${AUTOMATION_V2_ENV[BUG_IDS]}" =~ ^[A-Za-z0-9._:-]+(,[A-Za-z0-9._:-]+)*$ ]] || { echo "ERROR: invalid BUG_IDS" >&2; return 2; }
  [[ -n "${AUTOMATION_V2_ENV[IMPLEMENTATION_SCOPE]}" ]] || return 2
  [[ "${AUTOMATION_V2_ENV[IMPLEMENTATION_SCOPE]}" != *$'\n'* && "${AUTOMATION_V2_ENV[IMPLEMENTATION_SCOPE]}" != *$'\t'* ]] || return 2
  if [[ "${AUTOMATION_V2_ENV[BUGFIX_MODE_AUTOMATION_MAINTENANCE_ALLOWED]}" == yes ]]; then
    [[ "${AUTOMATION_V2_ENV[ALLOWED_PROTECTED_FILES]}" != none ]] || return 2
    validate_protected_allowlist "${AUTOMATION_V2_ENV[ALLOWED_PROTECTED_FILES]}" || return 2
  else
    [[ "${AUTOMATION_V2_ENV[ALLOWED_PROTECTED_FILES]}" == none ]] || return 2
  fi

  case "$status" in
    BUGFIX_AUDIT_COMPLETE=yes)
      [[ "${AUTOMATION_V2_ENV[BUGS_FOUND]}" == no && "${AUTOMATION_V2_ENV[HANDOVER_AUTONOMOUS_IMPLEMENTATION_REQUIRED]}" == no && "${AUTOMATION_V2_ENV[CAMPAIGN_AREA_COMPLETE]}" == yes && "${AUTOMATION_V2_ENV[SOURCE_EVIDENCE_COMPLETE]}" == yes && "${AUTOMATION_V2_ENV[BUG_IDS]}" == none && "$LAST_VALIDATION_STATUS" == passed ]] || return 2
      ;;
    HANDOVER_AUTONOMOUS_IMPLEMENTATION=yes)
      [[ "${AUTOMATION_V2_ENV[BUGS_FOUND]}" == yes && "${AUTOMATION_V2_ENV[HANDOVER_AUTONOMOUS_IMPLEMENTATION_REQUIRED]}" == yes && "${AUTOMATION_V2_ENV[CAMPAIGN_AREA_COMPLETE]}" == no && "${AUTOMATION_V2_ENV[SOURCE_EVIDENCE_COMPLETE]}" == yes && "${AUTOMATION_V2_ENV[BUG_IDS]}" != none && "${AUTOMATION_V2_ENV[IMPLEMENTATION_SCOPE]}" != none ]] || return 2
      ;;
    CONTINUE_REQUIRED=yes)
      [[ "${AUTOMATION_V2_ENV[HANDOVER_AUTONOMOUS_IMPLEMENTATION_REQUIRED]}" == no && "${AUTOMATION_V2_ENV[CAMPAIGN_AREA_COMPLETE]}" == no ]] || return 2
      ;;
    BLOCKED=yes)
      [[ "${AUTOMATION_V2_ENV[HANDOVER_AUTONOMOUS_IMPLEMENTATION_REQUIRED]}" == no && "${AUTOMATION_V2_ENV[CAMPAIGN_AREA_COMPLETE]}" == no ]] || return 2
      ;;
  esac
}

write_cycle_prompt() {
  local cycle_dir="$1" prompt="$2"
  cat > "$prompt" <<EOF_PROMPT
Role:
Senior read-only autonomous bug-audit and implementation-handoff engineer for $AUTOMATION_REPO_ROOT.

Objective:
Audit the exact bounded area "$CAMPAIGN_AREA". Inspect retained artifacts first, then source. Confirm defects only with code, tests, artifacts, validation output, or deterministic reproduction. Do not edit repository source. When confirmed bugs require changes, produce a strict bounded implementation handoff contract.

Evidence hint:
${ARTIFACT_HINT:-no_retained_artifact_hint}

Baseline validation:
status=$BASELINE_VALIDATION_STATUS
exit_code=$BASELINE_VALIDATION_EXIT_CODE
logs=$AUTOMATION_RUN_DIR/preflight/baseline-validation

Read before auditing:
- AGENTS.md, if present
- docs/repo_status_current.md
- docs/automation/README.md
- docs/automation/PROTECTED_AUTOMATION_FILES.md
- docs/automation/repo-profile.md
- $TASK_SOURCE
${BUGFIX_FOCUS_FILE:+- $BUGFIX_FOCUS_FILE}

Hard constraints:
- It must not patch app source directly.
- Do not edit app source, tests, docs, scripts, package files, manifests, or configuration.
- Do not commit, push, pull, reset, clean, stash, or rewrite branches.
- Do not print or modify secrets or .env files.
- Do not start, stop, restart, kill, detach, or replace services or user sessions.
- Do not connect to providers, external betting APIs, wallets, signers, orders, transactions, or direct betting-win databases.
- Do not add public reports, profitability claims, live-readiness claims, or execution-readiness claims.
- Write only under $cycle_dir.

Required cycle files:
- audit_area_selected.md
- artifact_review.md
- source_area_review.md
- bug_hypotheses.md
- confirmed_bugs.md
- bug_inventory.md
- implementation_handover_candidates.md
- handoff_plan.md
- coverage_update.tsv
- validation_results.md
- remaining_gaps.md
- final_status.md
- continue_status.txt
- request_flags.txt

continue_status.txt must contain exactly one line:
- BUGFIX_AUDIT_COMPLETE=yes
- CONTINUE_REQUIRED=yes
- HANDOVER_AUTONOMOUS_IMPLEMENTATION=yes
- BLOCKED=yes

request_flags.txt must contain exactly these KEY=VALUE records, once each:
BUGS_FOUND=yes|no
HANDOVER_AUTONOMOUS_IMPLEMENTATION_REQUIRED=yes|no
NEXT_AUDIT_AREA=<stable-slug-or-none>
CAMPAIGN_AREA=$CAMPAIGN_AREA
CAMPAIGN_AREA_COMPLETE=yes|no
SOURCE_EVIDENCE_COMPLETE=yes|no
BUG_IDS=<comma-separated-stable-ids-or-none>
IMPLEMENTATION_SCOPE=<single-line-bounded-scope-or-none>
BUGFIX_MODE_AUTOMATION_MAINTENANCE_ALLOWED=yes|no
ALLOWED_PROTECTED_FILES=<exact-comma-separated-protected-paths-or-none>

Consistency rules:
- BUGFIX_AUDIT_COMPLETE=yes means no confirmed bug remains in this bounded area, evidence is complete, campaign-area completion is yes, and validation is green.
- HANDOVER_AUTONOMOUS_IMPLEMENTATION=yes means confirmed bugs exist, BUG_IDS and IMPLEMENTATION_SCOPE are concrete, evidence is complete, and campaign-area completion is no.
- CONTINUE_REQUIRED=yes means the same bounded audit is incomplete and no implementation handoff is yet justified.
- BLOCKED=yes means missing evidence/tooling prevents a safe conclusion; do not disguise it as a confirmed bug.
- Protected-file authorization is allowed only when the confirmed defect explicitly requires bounded automation maintenance. List exact protected files; never grant a broad exception.
EOF_PROMPT
}

write_implementation_handoff() {
  local cycle_dir="$1" env_file="$AUTOMATION_REPO_ROOT/.automation/autonomous-implementation-handover.env" md_file="$AUTOMATION_REPO_ROOT/.automation/autonomous-implementation-handover.md"
  local evidence_rel evidence_hash bug_signature
  HANDOFF_EVIDENCE_FILE="$cycle_dir/handoff-evidence.md"
  {
    printf '# Confirmed bugfix implementation evidence\n\n'
    printf 'campaign_area=%s\n\n' "$CAMPAIGN_AREA"
    cat "$cycle_dir/confirmed_bugs.md"
    printf '\n\n## Implementation scope\n\n'
    cat "$cycle_dir/handoff_plan.md"
    printf '\n\n## Request flags\n\n```text\n'
    cat "$cycle_dir/request_flags.txt"
    printf '```\n\n## Validation state\n\n'
    cat "$cycle_dir/validation_results.md"
  } > "$HANDOFF_EVIDENCE_FILE"
  evidence_rel="${HANDOFF_EVIDENCE_FILE#$AUTOMATION_REPO_ROOT/}"
  evidence_hash="$(automation_v2_sha256_file "$HANDOFF_EVIDENCE_FILE")"
  bug_signature="$(printf '%s\n' "AUDIT_AREA=$CAMPAIGN_AREA" "BUG_IDS=${AUTOMATION_V2_ENV[BUG_IDS]}" "IMPLEMENTATION_SCOPE=${AUTOMATION_V2_ENV[IMPLEMENTATION_SCOPE]}" | LC_ALL=C sort | sha256sum | awk '{print $1}')"
  automation_v2_write_env_atomic "$env_file" \
    "HANDOVER_SCHEMA_VERSION=1" \
    "HANDOVER_KIND=autonomous-bugfix-to-autonomous-implementation" \
    "REPOSITORY=${AUTOMATION_REPO_NAME:-betting-win-surebet}" \
    "CONTROLLER=$SCRIPT_NAME" \
    "RUN_AUTONOMOUS_IMPLEMENTATION_NEXT=yes" \
    "AUTONOMOUS_IMPLEMENTATION_EXPECTED_FLAG=--handover-bugfix-audit" \
    "HANDOVER_AUTONOMOUS_IMPLEMENTATION=yes" \
    "AUDIT_AREA=$CAMPAIGN_AREA" \
    "AUDIT_SOURCE_FINGERPRINT=$LAST_CYCLE_SOURCE_FINGERPRINT_BEFORE" \
    "BUG_IDS=${AUTOMATION_V2_ENV[BUG_IDS]}" \
    "BUG_SIGNATURE=$bug_signature" \
    "IMPLEMENTATION_SCOPE=${AUTOMATION_V2_ENV[IMPLEMENTATION_SCOPE]}" \
    "SOURCE_EVIDENCE_PATH=$evidence_rel" \
    "SOURCE_EVIDENCE_SHA256=$evidence_hash" \
    "VALIDATION_REQUIRED=npm_run_validate" \
    "BUGFIX_MODE_NOOP_SUCCESS_ALLOWED=no" \
    "BUGFIX_MODE_AUTOMATION_MAINTENANCE_ALLOWED=${AUTOMATION_V2_ENV[BUGFIX_MODE_AUTOMATION_MAINTENANCE_ALLOWED]}" \
    "ALLOWED_PROTECTED_FILES=${AUTOMATION_V2_ENV[ALLOWED_PROTECTED_FILES]}" \
    "RUN_DIR=${AUTOMATION_RUN_DIR:-}" \
    "WRITTEN_AT=$(automation_now_iso)"
  HANDOFF_FINGERPRINT="$(automation_v2_add_or_verify_fingerprint "$env_file")"
  {
    printf '# Autonomous implementation handoff\n\n'
    printf 'Audit area: `%s`\n\n' "$CAMPAIGN_AREA"
    printf 'Bug IDs: `%s`\n\n' "${AUTOMATION_V2_ENV[BUG_IDS]}"
    printf 'Scope: `%s`\n\n' "${AUTOMATION_V2_ENV[IMPLEMENTATION_SCOPE]}"
    printf 'Fingerprint: `%s`\n\n' "$HANDOFF_FINGERPRINT"
    printf 'Next command:\n\n```bash\nbash ./run-autonomous-implementation.sh --duration 72h --model cli-default --fallback-model none --handover-bugfix-audit\n```\n'
  } > "$md_file"
  cp "$env_file" "$cycle_dir/autonomous-implementation-handover.env"
  cp "$md_file" "$cycle_dir/autonomous-implementation-handover.md"
}

build_artifacts_zip_bounded() {
  local tmp rel
  [[ -d "${AUTOMATION_RUN_DIR:-}" ]] || return 0
  rel="${AUTOMATION_RUN_DIR#$AUTOMATION_REPO_ROOT/}"
  tmp="$AUTOMATION_REPO_ROOT/.artifacts.zip.tmp.$$.zip"
  rm -f -- "$tmp"
  automation_v2_zip_with_timeout "$ZIP_TIMEOUT_SECONDS" "$tmp" "$AUTOMATION_REPO_ROOT" "$rel" || { local rc=$?; rm -f -- "$tmp"; return "$rc"; }
  mv -f -- "$tmp" "$AUTOMATION_REPO_ROOT/artifacts.zip"
}

write_final_summary() {
  [[ -n "${AUTOMATION_RUN_DIR:-}" ]] || return 0
  {
    printf '# Autonomous bugfix final summary\n\n'
    printf 'script_version=%s\n' "$SCRIPT_VERSION"
    printf 'final_status=%s\n' "$FINAL_STATUS"
    printf 'stop_reason=%s\n' "$STOP_REASON"
    printf 'exit_status=%s\n' "$EXIT_STATUS"
    printf 'cycles_attempted=%s\n' "$CYCLES_ATTEMPTED"
    printf 'campaign_area=%s\n' "$CAMPAIGN_AREA"
    printf 'artifact_hint=%s\n' "${ARTIFACT_HINT:-none}"
    printf 'baseline_validation_status=%s\n' "$BASELINE_VALIDATION_STATUS"
    printf 'last_validation_status=%s\n' "$LAST_VALIDATION_STATUS"
    printf 'last_codex_failure_class=%s\n' "$LAST_CODEX_FAILURE_CLASS"
    printf 'handoff_fingerprint=%s\n' "${HANDOFF_FINGERPRINT:-none}"
    printf 'source_fingerprint_initial=%s\n' "$INITIAL_SOURCE_FINGERPRINT"
    printf 'source_fingerprint_last_before=%s\n' "$LAST_CYCLE_SOURCE_FINGERPRINT_BEFORE"
    printf 'source_fingerprint_last_after_codex=%s\n' "$LAST_CYCLE_SOURCE_FINGERPRINT_AFTER_CODEX"
    printf 'source_fingerprint_last_after_validation=%s\n' "$LAST_CYCLE_SOURCE_FINGERPRINT_AFTER_VALIDATION"
    printf 'completed_at=%s\n' "$(automation_now_iso)"
  } > "$AUTOMATION_RUN_DIR/final-summary.md"
}

finish() {
  local rc="${1:-$?}" zip_rc=0
  [[ "$FINISHED" == 1 ]] && return 0
  FINISHED=1
  trap - EXIT INT TERM
  EXIT_STATUS="$rc"
  [[ "$FINAL_STATUS" != not_started ]] || { FINAL_STATUS=setup_failed; STOP_REASON=unexpected_exit_before_start; }
  if [[ -n "${AUTOMATION_RUN_DIR:-}" ]]; then
    write_final_summary || true
    automation_collect_repo_snapshot "$AUTOMATION_RUN_DIR/final-repo-snapshot" || true
    set +e; build_artifacts_zip_bounded; zip_rc=$?; set -e
    if [[ "$zip_rc" != 0 && "$EXIT_STATUS" == 0 ]]; then FINAL_STATUS="BLOCKED=yes"; STOP_REASON="artifacts_zip_failed"; EXIT_STATUS=2; write_final_summary || true; fi
    telegram_notify_send_final "$SCRIPT_NAME" "${AUTOMATION_REPO_NAME:-betting-win-surebet}" "$FINAL_STATUS" "$STOP_REASON" "$CYCLES_ATTEMPTED" "$EXIT_STATUS" "$AUTOMATION_RUN_DIR" "$AUTOMATION_RUN_DIR/telegram_notification_status.txt" "$AUTOMATION_REPO_ROOT" || true
  fi
  [[ "$LOCK_ACQUIRED" == 1 ]] && automation_release_lock || true
  printf 'run_dir=%s\n' "${AUTOMATION_RUN_DIR:-}"
  printf 'final_status=%s\n' "$FINAL_STATUS"
  printf 'stop_reason=%s\n' "$STOP_REASON"
  printf 'final_exit_code=%s\n' "$EXIT_STATUS"
  printf 'cycles_completed=%s\n' "$CYCLES_ATTEMPTED"
  exit "$EXIT_STATUS"
}

on_signal() { FINAL_STATUS=interrupted; STOP_REASON=interrupted; exit 130; }

main_loop() {
  local start_epoch now cycle_dir prompt status post_validation_rc
  start_epoch="$(automation_now_epoch)"
  FINAL_STATUS="CONTINUE_REQUIRED=yes"
  STOP_REASON="loop_started"
  while true; do
    now="$(automation_now_epoch)"
    if (( now - start_epoch >= DURATION_SECONDS )); then FINAL_STATUS="CONTINUE_REQUIRED=yes"; STOP_REASON="duration_elapsed"; exit 3; fi
    if (( CYCLES_ATTEMPTED >= MAX_CYCLES )); then FINAL_STATUS="CONTINUE_REQUIRED=yes"; STOP_REASON="max_cycles_reached"; exit 3; fi
    CYCLES_ATTEMPTED=$((CYCLES_ATTEMPTED + 1))
    cycle_dir="$AUTOMATION_RUN_DIR/cycles/cycle_${CYCLES_ATTEMPTED}"
    mkdir -p "$cycle_dir"
    prompt="$cycle_dir/codex_prompt.md"
    source_status_snapshot "$cycle_dir/source-status-before.txt"
    LAST_CYCLE_SOURCE_FINGERPRINT_BEFORE="$(compute_source_fingerprint)" || { FINAL_STATUS="BLOCKED=yes"; STOP_REASON="source_fingerprint_failed"; exit 2; }
    printf 'source_fingerprint_before=%s\n' "$LAST_CYCLE_SOURCE_FINGERPRINT_BEFORE" > "$cycle_dir/source-change-summary.env"
    write_cycle_prompt "$cycle_dir" "$prompt"

    if ! run_codex_cycle "$prompt" "$cycle_dir"; then
      FINAL_STATUS="BLOCKED=yes"
      STOP_REASON="codex_${LAST_CODEX_FAILURE_CLASS}_cycle_${CYCLES_ATTEMPTED}"
      exit 2
    fi

    git -C "$AUTOMATION_REPO_ROOT" diff --no-ext-diff > "$cycle_dir/git_diff.patch" 2>/dev/null || :
    source_status_snapshot "$cycle_dir/source-status-after.txt"
    diff -u "$cycle_dir/source-status-before.txt" "$cycle_dir/source-status-after.txt" > "$cycle_dir/source-status-diff.patch" 2>&1 || true
    LAST_CYCLE_SOURCE_FINGERPRINT_AFTER_CODEX="$(compute_source_fingerprint)" || { FINAL_STATUS="BLOCKED=yes"; STOP_REASON="source_fingerprint_failed"; exit 2; }
    printf 'source_fingerprint_after_codex=%s\n' "$LAST_CYCLE_SOURCE_FINGERPRINT_AFTER_CODEX" >> "$cycle_dir/source-change-summary.env"
    if [[ "$LAST_CYCLE_SOURCE_FINGERPRINT_BEFORE" != "$LAST_CYCLE_SOURCE_FINGERPRINT_AFTER_CODEX" ]]; then
      printf 'source_mutation_detected=yes\n' > "$cycle_dir/source-mutation-detected.txt"
      FINAL_STATUS="BLOCKED=yes"
      STOP_REASON="bugfix_attempted_source_change_cycle_${CYCLES_ATTEMPTED}"
      exit 2
    fi
    if ! AUTOMATION_ALLOW_PROTECTED_CHANGES=0 automation_check_protected_unchanged "$AUTOMATION_RUN_DIR/protected_before.sha256" "$cycle_dir/protected_after.sha256" "$cycle_dir/protected_diff.patch"; then
      FINAL_STATUS="BLOCKED=yes"; STOP_REASON="protected_files_changed"; exit 2
    fi
    if ! automation_require_cycle_artifacts "$cycle_dir" allow_empty_git_diff \
      audit_area_selected.md artifact_review.md source_area_review.md bug_hypotheses.md confirmed_bugs.md bug_inventory.md \
      implementation_handover_candidates.md handoff_plan.md coverage_update.tsv validation_results.md remaining_gaps.md \
      final_status.md continue_status.txt request_flags.txt git_diff.patch; then
      FINAL_STATUS="BLOCKED=yes"; STOP_REASON="malformed_cycle_artifacts_cycle_${CYCLES_ATTEMPTED}"; exit 2
    fi

    set +e
    automation_run_validations bugfix "$cycle_dir/controller-validation" "$VALIDATION_TIMEOUT_SECONDS"
    post_validation_rc=$?
    set -e
    LAST_VALIDATION_EXIT_CODE="$post_validation_rc"
    [[ "$post_validation_rc" == 0 ]] && LAST_VALIDATION_STATUS=passed || LAST_VALIDATION_STATUS=failed
    LAST_CYCLE_SOURCE_FINGERPRINT_AFTER_VALIDATION="$(compute_source_fingerprint)" || { FINAL_STATUS="BLOCKED=yes"; STOP_REASON="source_fingerprint_failed"; exit 2; }
    printf 'source_fingerprint_after_validation=%s\n' "$LAST_CYCLE_SOURCE_FINGERPRINT_AFTER_VALIDATION" >> "$cycle_dir/source-change-summary.env"
    if [[ "$LAST_CYCLE_SOURCE_FINGERPRINT_BEFORE" != "$LAST_CYCLE_SOURCE_FINGERPRINT_AFTER_VALIDATION" ]]; then
      FINAL_STATUS="BLOCKED=yes"; STOP_REASON="bugfix_validation_source_mutation_cycle_${CYCLES_ATTEMPTED}"; exit 2
    fi
    {
      printf '\n\n## Controller validation\n\n'
      printf 'status=%s\nexit_code=%s\nlogs=%s\n' "$LAST_VALIDATION_STATUS" "$LAST_VALIDATION_EXIT_CODE" "$cycle_dir/controller-validation"
    } >> "$cycle_dir/validation_results.md"

    status="$(read_bugfix_continue_status "$cycle_dir/continue_status.txt")" || { FINAL_STATUS="BLOCKED=yes"; STOP_REASON="malformed_continue_status_cycle_${CYCLES_ATTEMPTED}"; exit 2; }
    load_and_validate_request_flags "$cycle_dir/request_flags.txt" "$status" || { FINAL_STATUS="BLOCKED=yes"; STOP_REASON="inconsistent_request_flags_cycle_${CYCLES_ATTEMPTED}"; exit 2; }
    automation_log "cycle=$CYCLES_ATTEMPTED continue_status=$status campaign_area=$CAMPAIGN_AREA"
    case "$status" in
      BUGFIX_AUDIT_COMPLETE=yes) FINAL_STATUS="$status"; STOP_REASON="bugfix_audit_complete"; exit 0 ;;
      HANDOVER_AUTONOMOUS_IMPLEMENTATION=yes)
        FINAL_STATUS="$status"
        STOP_REASON="confirmed_bugs_require_implementation"
        if [[ "$HANDOVER_AUTONOMOUS_IMPLEMENTATION" == 1 ]]; then write_implementation_handoff "$cycle_dir" || { FINAL_STATUS="BLOCKED=yes"; STOP_REASON="implementation_handoff_write_failed"; exit 2; }; else STOP_REASON="confirmed_bugs_handoff_not_requested"; fi
        exit 2
        ;;
      BLOCKED=yes) FINAL_STATUS="$status"; STOP_REASON="audit_blocked_cycle_${CYCLES_ATTEMPTED}"; exit 2 ;;
      CONTINUE_REQUIRED=yes) FINAL_STATUS="$status"; STOP_REASON="continuing_same_bounded_audit" ;;
    esac
  done
}

parse_args "$@" || exit 1
configure_defaults
validate_inputs || exit 1
LOCK_FILE="$AUTOMATION_REPO_ROOT/.automation/locks/run-autonomous-bugfix.lock"
if [[ "$STATUS_ONLY" == 1 ]]; then automation_status_lock "$LOCK_FILE"; exit $?; fi
if [[ "$FORCE_UNLOCK" == 1 ]]; then automation_force_unlock "$LOCK_FILE" "$SCRIPT_NAME" "$AUTOMATION_REPO_ROOT"; exit $?; fi
if [[ "$PRINT_CONFIG" == 1 ]]; then print_config; exit 0; fi

resolve_task_source
ARTIFACT_HINT="$(resolve_artifact_hint || true)"
automation_create_run_dir autonomous_bugfix
AUTOMATION_SCRIPT_COMMAND="$0 $*"
mkdir -p "$AUTOMATION_RUN_DIR/preflight"
{
  printf 'artifact_hint_resolved_before_run_dir=yes\n'
  printf 'artifact_hint=%s\n' "${ARTIFACT_HINT:-none}"
  printf 'campaign_area=%s\n' "$CAMPAIGN_AREA"
  printf 'resolved_at=%s\n' "$(automation_now_iso)"
} > "$AUTOMATION_RUN_DIR/preflight/retained-artifact-hint.env"

trap 'finish $?' EXIT
trap on_signal INT TERM
if [[ "$ALLOW_PARALLEL" == 1 ]]; then automation_log 'lock=skipped allow_parallel=1'; else automation_acquire_lock "$SCRIPT_NAME" "$AUTOMATION_REPO_ROOT"; LOCK_ACQUIRED=1; automation_start_heartbeat; fi
assert_active_node_runtime || { FINAL_STATUS=setup_failed; STOP_REASON=node_runtime_invalid; exit 1; }
automation_collect_repo_snapshot "$AUTOMATION_RUN_DIR/initial-repo-snapshot"
source_status_snapshot "$AUTOMATION_RUN_DIR/source-status-before.txt"
INITIAL_SOURCE_FINGERPRINT="$(compute_source_fingerprint)" || { FINAL_STATUS=setup_failed; STOP_REASON=source_fingerprint_failed; exit 1; }
printf 'source_fingerprint=%s\n' "$INITIAL_SOURCE_FINGERPRINT" > "$AUTOMATION_RUN_DIR/source-fingerprint-before.env"
automation_snapshot_protected "$AUTOMATION_RUN_DIR/protected_before.sha256"
maybe_auto_install || { FINAL_STATUS=setup_failed; STOP_REASON=auto_install_failed; exit 1; }
run_baseline_validation || exit $?

if [[ "$CHECK_ONLY" == 1 ]]; then
  if [[ "$BASELINE_VALIDATION_STATUS" != passed ]]; then FINAL_STATUS=check_only_validation_failed; STOP_REASON=check_only_validation_failed; exit 1; fi
  LAST_CYCLE_SOURCE_FINGERPRINT_AFTER_VALIDATION="$(compute_source_fingerprint)"
  [[ "$INITIAL_SOURCE_FINGERPRINT" == "$LAST_CYCLE_SOURCE_FINGERPRINT_AFTER_VALIDATION" ]] || { FINAL_STATUS="BLOCKED=yes"; STOP_REASON=bugfix_check_only_source_mutation_detected; exit 2; }
  FINAL_STATUS=check_only_complete; STOP_REASON=check_only; exit 0
fi

automation_require_command "${AUTOMATION_CODEX_BIN:-codex}"
main_loop
