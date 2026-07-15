#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
AUTOMATION_REPO_ROOT="$SCRIPT_DIR"
# shellcheck source=.automation/lib/run_common.sh
. "$AUTOMATION_REPO_ROOT/.automation/lib/run_common.sh"
# shellcheck source=.automation/lib/controller_hardening_v2.sh
. "$AUTOMATION_REPO_ROOT/.automation/lib/controller_hardening_v2.sh"
# shellcheck source=.automation/lib/telegram_notify.sh
. "$AUTOMATION_REPO_ROOT/.automation/lib/telegram_notify.sh"

SCRIPT_VERSION="2026-07-15.surebet-v8-atomic-child-result"
SCRIPT_NAME="run-autonomous-implementation.sh"
DURATION_SECONDS="$(automation_parse_duration_seconds 72h)"
PROMPT_FILE=""
REPO_DIR_OVERRIDE=""
STATUS_ONLY=0
FORCE_UNLOCK=0
CHECK_ONLY=0
PRINT_CONFIG=0
AUTO_INSTALL=0
ALLOW_PARALLEL=0
HANDOVER_PAPER_MODE=0
HANDOVER_BUGFIX_AUDIT=0
FINISHED=0
EXIT_STATUS=0
STOP_REASON="not_started"
FINAL_STATUS="not_started"
CYCLES_ATTEMPTED=0
CODEX_FAILURES=0
CONSECUTIVE_VALIDATION_FAILURES=0
LOCK_ACQUIRED=0
LOCK_RELEASE_STATUS="not_attempted"
LOCK_RELEASE_EXIT_CODE=0
LOCK_PRESERVED="no"
CODEX_TIMEOUT_SECONDS=""
VALIDATION_TIMEOUT_SECONDS=""
INSTALL_TIMEOUT_SECONDS=""
ZIP_TIMEOUT_SECONDS=""
MAX_CYCLES=""
MAX_CODEX_FAILURES=""
MAX_CONSECUTIVE_VALIDATION_FAILURES=""
CODEX_MODEL=""
CODEX_FALLBACK_MODEL=""
CODEX_SANDBOX=""
CODEX_STREAM_LOGS=""
TASK_SOURCE=""
INITIAL_SOURCE_FINGERPRINT=""
FINAL_SOURCE_FINGERPRINT=""
LAST_VALIDATED_SOURCE_FINGERPRINT=""
RUN_SOURCE_CHANGED="no"
RUN_SOURCE_VALIDATION_PASSED="no"
BASELINE_VALIDATION_EXIT_CODE="not_run"
BASELINE_VALIDATION_STATUS="not_run"
LAST_CODEX_FAILURE_CLASS="none"
ACTIVE_HANDOFF_MODE="none"
ACTIVE_HANDOFF_FILE=""
ACTIVE_HANDOFF_KIND=""
ACTIVE_HANDOFF_FINGERPRINT=""
ACTIVE_HANDOFF_NOOP_ALLOWED="no"
ACTIVE_HANDOFF_AUTOMATION_MAINTENANCE_ALLOWED="no"
ACTIVE_HANDOFF_ALLOWED_PROTECTED_FILES="none"
ACTIVE_HANDOFF_REQUIRED_SCOPE=""
ACTIVE_HANDOFF_EVIDENCE=""
ACTIVE_HANDOFF_AUDIT_AREA=""
ACTIVE_HANDOFF_BUG_IDS=""
ACTIVE_HANDOFF_CONSUMED_MARKER=""
ACTIVE_HANDOFF_EVIDENCE_SHA256=""
ACTIVE_HANDOFF_SOURCE_FINGERPRINT=""
ACTIVE_HANDOFF_RUN_DIR=""
ACTIVE_HANDOFF_SOURCE_RUN_ID=""

usage() {
  cat <<'EOF_USAGE'
Usage:
  ./run-autonomous-implementation.sh [options]

Primary options:
  --duration VALUE            Campaign scheduling budget. Examples: 72h, 1h30m, 3600.
  --prompt-file PATH          Use an explicit implementation prompt file.
  --model MODEL               Override Codex model. Use cli-default for the CLI/profile default.
  --fallback-model MODEL      Retry only after a classified context/capacity/rate/quota failure. Use none to disable.
  --repo-dir PATH             Override repository root discovery.

Limits and timeouts:
  --cycle-timeout VALUE       Maximum duration of one Codex cycle. Default: 2h.
  --validation-timeout VALUE  Maximum duration of each validation command. Default: 20m.
  --install-timeout VALUE     Maximum optional dependency install duration. Default: 15m.
  --zip-timeout VALUE         Maximum final artifacts.zip creation duration. Default: 10m.
  --max-cycles N              Hard cycle-count ceiling. Default: 200.

Operational options:
  --sandbox MODE              read-only, workspace-write, or danger-full-access.
  --auto-install              Permit npm ci --ignore-scripts when node_modules is absent.
  --check-only                Run preflight and baseline validation only. No Codex cycles.
  --status                    Print lock status and exit.
  --force-unlock              Terminate only a verified repo-scoped owner, remove the lock, and exit.
  --allow-parallel            Explicitly skip this controller lock for this run.
  --handover-paper-mode       Consume the paper implementation handoff and return a verified paper handoff.
  --handover-bugfix-audit     Consume a strict bugfix-audit handoff and return a verified re-audit handoff.
  --print-config              Print effective non-secret configuration and exit.
  --stream                    Stream Codex output to terminal and log. Default.
  --no-stream                 Save Codex output to log only.
  -h, --help                  Show this help.

No --task flag is supported. Use --prompt-file, a validated handoff, or
docs/automation/current-implementation-task.md. The two --handover-* flags are mutually exclusive.

Exit codes:
  0 = check-only passed or autonomous goal complete
  1 = setup/controller/local validation failure before classified implementation state
  2 = blocked by Codex, validation, tooling, malformed handoff/artifacts, or safety gate
  3 = scheduling budget elapsed while CONTINUE_REQUIRED=yes remains
  130 = interrupted

The controller inherits Node.js and npm from the parent shell PATH and never sources nvm.sh.
EOF_USAGE
}


parse_positive_int() {
  local raw="$1"
  local label="$2"
  case "$raw" in ''|*[!0-9]*) echo "ERROR: $label must be a positive integer: $raw" >&2; return 2 ;; esac
  if (( raw < 1 )); then echo "ERROR: $label must be a positive integer: $raw" >&2; return 2; fi
  printf '%s\n' "$raw"
}

parse_args() {
  local parsed
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --duration|--run-duration) [[ $# -ge 2 ]] || { echo "ERROR: $1 requires a value" >&2; return 2; }; parsed="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid $1: $2" >&2; return 2; }; DURATION_SECONDS="$parsed"; shift 2 ;;
      --duration=*|--run-duration=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid duration: ${1#*=}" >&2; return 2; }; DURATION_SECONDS="$parsed"; shift ;;
      --prompt-file) [[ $# -ge 2 ]] || { echo "ERROR: --prompt-file requires a value" >&2; return 2; }; PROMPT_FILE="$2"; shift 2 ;;
      --prompt-file=*) PROMPT_FILE="${1#*=}"; shift ;;
      --model) [[ $# -ge 2 ]] || { echo "ERROR: --model requires a value" >&2; return 2; }; CODEX_MODEL="$2"; shift 2 ;;
      --model=*) CODEX_MODEL="${1#*=}"; shift ;;
      --fallback-model) [[ $# -ge 2 ]] || { echo "ERROR: --fallback-model requires a value" >&2; return 2; }; CODEX_FALLBACK_MODEL="$2"; shift 2 ;;
      --fallback-model=*) CODEX_FALLBACK_MODEL="${1#*=}"; shift ;;
      --repo-dir) [[ $# -ge 2 ]] || { echo "ERROR: --repo-dir requires a value" >&2; return 2; }; REPO_DIR_OVERRIDE="$2"; shift 2 ;;
      --repo-dir=*) REPO_DIR_OVERRIDE="${1#*=}"; shift ;;
      --cycle-timeout) [[ $# -ge 2 ]] || { echo "ERROR: --cycle-timeout requires a value" >&2; return 2; }; parsed="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid --cycle-timeout: $2" >&2; return 2; }; CODEX_TIMEOUT_SECONDS="$parsed"; shift 2 ;;
      --cycle-timeout=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid --cycle-timeout: ${1#*=}" >&2; return 2; }; CODEX_TIMEOUT_SECONDS="$parsed"; shift ;;
      --validation-timeout) [[ $# -ge 2 ]] || { echo "ERROR: --validation-timeout requires a value" >&2; return 2; }; parsed="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid --validation-timeout: $2" >&2; return 2; }; VALIDATION_TIMEOUT_SECONDS="$parsed"; shift 2 ;;
      --validation-timeout=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid --validation-timeout: ${1#*=}" >&2; return 2; }; VALIDATION_TIMEOUT_SECONDS="$parsed"; shift ;;
      --install-timeout) [[ $# -ge 2 ]] || { echo "ERROR: --install-timeout requires a value" >&2; return 2; }; parsed="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid --install-timeout: $2" >&2; return 2; }; INSTALL_TIMEOUT_SECONDS="$parsed"; shift 2 ;;
      --install-timeout=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid --install-timeout: ${1#*=}" >&2; return 2; }; INSTALL_TIMEOUT_SECONDS="$parsed"; shift ;;
      --zip-timeout) [[ $# -ge 2 ]] || { echo "ERROR: --zip-timeout requires a value" >&2; return 2; }; parsed="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid --zip-timeout: $2" >&2; return 2; }; ZIP_TIMEOUT_SECONDS="$parsed"; shift 2 ;;
      --zip-timeout=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid --zip-timeout: ${1#*=}" >&2; return 2; }; ZIP_TIMEOUT_SECONDS="$parsed"; shift ;;
      --max-cycles) [[ $# -ge 2 ]] || { echo "ERROR: --max-cycles requires a value" >&2; return 2; }; MAX_CYCLES="$(parse_positive_int "$2" --max-cycles)" || return 2; shift 2 ;;
      --max-cycles=*) MAX_CYCLES="$(parse_positive_int "${1#*=}" --max-cycles)" || return 2; shift ;;
      --sandbox) [[ $# -ge 2 ]] || { echo "ERROR: --sandbox requires a value" >&2; return 2; }; CODEX_SANDBOX="$2"; shift 2 ;;
      --sandbox=*) CODEX_SANDBOX="${1#*=}"; shift ;;
      --auto-install) AUTO_INSTALL=1; shift ;;
      --check-only) CHECK_ONLY=1; shift ;;
      --status) STATUS_ONLY=1; shift ;;
      --force-unlock) FORCE_UNLOCK=1; shift ;;
      --allow-parallel) ALLOW_PARALLEL=1; shift ;;
      --handover-paper-mode) HANDOVER_PAPER_MODE=1; shift ;;
      --handover-bugfix-audit) HANDOVER_BUGFIX_AUDIT=1; shift ;;
      --print-config) PRINT_CONFIG=1; shift ;;
      --stream) CODEX_STREAM_LOGS=1; shift ;;
      --no-stream) CODEX_STREAM_LOGS=0; shift ;;
      -h|--help) usage; exit 0 ;;
      *) echo "ERROR: unknown option: $1" >&2; usage >&2; return 2 ;;
    esac
  done
}

model_display() { if [[ -n "$CODEX_MODEL" ]]; then printf '%s\n' "$CODEX_MODEL"; else printf 'cli-default\n'; fi; }
fallback_display() { if [[ -n "$CODEX_FALLBACK_MODEL" ]]; then printf '%s\n' "$CODEX_FALLBACK_MODEL"; else printf 'none\n'; fi; }

configure_defaults() {
  if [[ -n "$REPO_DIR_OVERRIDE" ]]; then AUTOMATION_REPO_ROOT="$(cd "$REPO_DIR_OVERRIDE" && pwd -P)"; fi
  cd "$AUTOMATION_REPO_ROOT"
  automation_load_config
  REPO_DIR="$AUTOMATION_REPO_ROOT"
  CODEX_TIMEOUT_SECONDS="${CODEX_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_CODEX_CYCLE_TIMEOUT:-2h}")}"
  VALIDATION_TIMEOUT_SECONDS="${VALIDATION_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_VALIDATION_TIMEOUT:-20m}")}"
  INSTALL_TIMEOUT_SECONDS="${INSTALL_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_INSTALL_TIMEOUT:-15m}")}"
  ZIP_TIMEOUT_SECONDS="${ZIP_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_ZIP_TIMEOUT:-10m}")}"
  MAX_CYCLES="${MAX_CYCLES:-${AUTOMATION_MAX_CYCLES:-200}}"
  MAX_CODEX_FAILURES="${AUTOMATION_MAX_CODEX_FAILURES:-2}"
  MAX_CONSECUTIVE_VALIDATION_FAILURES="${AUTOMATION_MAX_CONSECUTIVE_VALIDATION_FAILURES:-3}"
  CODEX_MODEL="${CODEX_MODEL:-${AUTOMATION_CODEX_MODEL:-}}"
  CODEX_FALLBACK_MODEL="${CODEX_FALLBACK_MODEL:-${AUTOMATION_CODEX_FALLBACK_MODEL:-}}"
  CODEX_SANDBOX="${CODEX_SANDBOX:-${AUTOMATION_CODEX_SANDBOX:-danger-full-access}}"
  CODEX_STREAM_LOGS="${CODEX_STREAM_LOGS:-${AUTOMATION_CODEX_STREAM_LOGS:-1}}"
  case "$CODEX_MODEL" in default|cli-default) CODEX_MODEL="" ;; esac
  case "$CODEX_FALLBACK_MODEL" in default|cli-default) CODEX_FALLBACK_MODEL="cli-default" ;; none|off|disabled) CODEX_FALLBACK_MODEL="" ;; esac
  AUTOMATION_CODEX_MODEL="$CODEX_MODEL"
  AUTOMATION_CODEX_FALLBACK_MODEL=""
  AUTOMATION_CODEX_SANDBOX="$CODEX_SANDBOX"
  AUTOMATION_CODEX_STREAM_LOGS="$CODEX_STREAM_LOGS"
}

validate_inputs() {
  local value
  for value in "$DURATION_SECONDS" "$CODEX_TIMEOUT_SECONDS" "$VALIDATION_TIMEOUT_SECONDS" "$INSTALL_TIMEOUT_SECONDS" "$ZIP_TIMEOUT_SECONDS" "$MAX_CYCLES" "$MAX_CODEX_FAILURES" "$MAX_CONSECUTIVE_VALIDATION_FAILURES"; do
    case "$value" in ''|*[!0-9]*) echo "ERROR: expected positive integer, got: $value" >&2; return 2 ;; esac
    (( value > 0 )) || { echo "ERROR: expected positive integer, got: $value" >&2; return 2; }
  done
  case "$CODEX_SANDBOX" in read-only|workspace-write|danger-full-access) ;; *) echo "ERROR: unsupported sandbox: $CODEX_SANDBOX" >&2; return 2 ;; esac
  if [[ "$HANDOVER_PAPER_MODE" == "1" && "$HANDOVER_BUGFIX_AUDIT" == "1" ]]; then
    echo "ERROR: --handover-paper-mode and --handover-bugfix-audit are mutually exclusive" >&2
    return 2
  fi
}


print_config() {
  cat <<EOF_CONFIG
controller=run-autonomous-implementation.sh
script_version=$SCRIPT_VERSION
repo_dir=$AUTOMATION_REPO_ROOT
duration_seconds=$DURATION_SECONDS
cycle_timeout_seconds=$CODEX_TIMEOUT_SECONDS
validation_timeout_seconds=$VALIDATION_TIMEOUT_SECONDS
install_timeout_seconds=$INSTALL_TIMEOUT_SECONDS
zip_timeout_seconds=$ZIP_TIMEOUT_SECONDS
artifacts_zip_scope=full_artifacts_directory
final_artifacts_zip_refresh=post_lock_release_atomic
max_cycles=$MAX_CYCLES
model=$(model_display)
fallback_model=$(fallback_display)
sandbox=$CODEX_SANDBOX
stream_logs=$CODEX_STREAM_LOGS
auto_install=$AUTO_INSTALL
allow_parallel=$ALLOW_PARALLEL
handover_paper_mode=$HANDOVER_PAPER_MODE
handover_bugfix_audit=$HANDOVER_BUGFIX_AUDIT
baseline_validation=enabled
strict_handoff_parser=enabled
semantic_handoff_fingerprints=enabled
exact_handoff_protected_allowlist=enabled
strict_schema_v1_key_allowlists=enabled
source_evidence_sha256_verification=enabled
source_fingerprint_reconciliation=enabled
input_handoff_immutable=enabled
machine_readable_final_stdout=enabled
lock_acquisition_before_run_dir=enabled
lock_release_failure_classification=enabled
lock_preservation_on_release_failure=enabled
telegram_notify=${TELEGRAM_NOTIFY:-1}
EOF_CONFIG
}


assert_active_node_runtime() {
  automation_require_command node
  automation_require_command npm
  local expected_major=""
  local node_version
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
  automation_log "NODE_OK=$node_version"
  automation_log "NPM_OK=$(npm --version 2>/dev/null || true)"
}

maybe_auto_install() {
  if [[ "$AUTO_INSTALL" != "1" ]]; then return 0; fi
  if [[ -d "$AUTOMATION_REPO_ROOT/node_modules" ]]; then automation_log "auto_install=skipped node_modules_present"; return 0; fi
  if [[ -f "$AUTOMATION_REPO_ROOT/package-lock.json" ]]; then automation_run_shell_command "auto_install_npm_ci" "npm ci --ignore-scripts" "$INSTALL_TIMEOUT_SECONDS" "$AUTOMATION_RUN_DIR/auto-install.log"; return $?; fi
  automation_run_shell_command "auto_install_npm_install" "npm install --ignore-scripts" "$INSTALL_TIMEOUT_SECONDS" "$AUTOMATION_RUN_DIR/auto-install.log"
}

repo_name() {
  printf '%s\n' "${AUTOMATION_REPO_NAME:-betting-win-surebet}"
}

compute_source_fingerprint() {
  automation_v2_source_tree_fingerprint "$AUTOMATION_REPO_ROOT"
}

refresh_source_change_state() {
  FINAL_SOURCE_FINGERPRINT="$(compute_source_fingerprint 2>/dev/null || true)"
  if [[ -n "$INITIAL_SOURCE_FINGERPRINT" && -n "$FINAL_SOURCE_FINGERPRINT" && "$INITIAL_SOURCE_FINGERPRINT" != "$FINAL_SOURCE_FINGERPRINT" ]]; then
    RUN_SOURCE_CHANGED="yes"
  else
    RUN_SOURCE_CHANGED="no"
  fi
  if [[ -n "$LAST_VALIDATED_SOURCE_FINGERPRINT" && "$FINAL_SOURCE_FINGERPRINT" == "$LAST_VALIDATED_SOURCE_FINGERPRINT" ]]; then
    RUN_SOURCE_VALIDATION_PASSED="yes"
  else
    RUN_SOURCE_VALIDATION_PASSED="no"
  fi
}

handoff_value() {
  local key="$1"
  printf '%s\n' "${AUTOMATION_V2_ENV[$key]-}"
}

require_handoff_yes_no() {
  local key="$1" value
  value="$(automation_v2_env_require "$key")" || return 2
  automation_v2_validate_yes_no_value "$key" "$value" || return 2
  printf '%s\n' "$value"
}

validate_allowed_protected_files() {
  local csv="$1" item known found
  local -a items=()
  [[ -z "$csv" || "$csv" == "none" ]] && return 0
  IFS=',' read -r -a items <<< "$csv"
  for item in "${items[@]}"; do
    [[ -n "$item" && "$item" != /* && "$item" != *'..'* && "$item" != *$'\n'* ]] || {
      echo "ERROR: invalid protected-file allowlist entry: $item" >&2
      return 2
    }
    found=0
    for known in "${AUTOMATION_PROTECTED_FILES[@]:-}"; do
      [[ "$known" == "$item" ]] && found=1
    done
    [[ "$found" == "1" ]] || {
      echo "ERROR: handoff allowlist entry is not a protected automation file: $item" >&2
      return 2
    }
  done
}


validate_loaded_handoff_keys() {
  local allowed_csv="$1" key
  for key in "${!AUTOMATION_V2_ENV[@]}"; do
    case ",$allowed_csv," in
      *",$key,"*) ;;
      *) echo "ERROR: unsupported handoff key for schema v1: $key" >&2; return 2 ;;
    esac
  done
}

require_handoff_zero_one() {
  local key="$1" value
  value="$(automation_v2_env_require "$key")" || return 2
  case "$value" in 0|1) printf '%s\n' "$value" ;; *) echo "ERROR: $key must be exactly 0 or 1; got: $value" >&2; return 2 ;; esac
}

validate_handoff_run_and_evidence() {
  local run_dir_value="$1" evidence_value="$2" expected_hash="$3" run_abs evidence_abs actual_hash relative current part
  local -a evidence_parts=()
  [[ "$run_dir_value" == /* ]] || { echo "ERROR: handoff RUN_DIR must be an absolute repo-local path" >&2; return 2; }
  run_abs="$(automation_v2_safe_repo_path "$AUTOMATION_REPO_ROOT" "$run_dir_value" yes)" || return 2
  [[ -d "$run_abs" && ! -L "$run_abs" ]] || { echo "ERROR: handoff RUN_DIR must be a non-symlink directory" >&2; return 2; }
  [[ -n "$evidence_value" && "$evidence_value" != /* && "$evidence_value" != *'..'* ]] || { echo "ERROR: SOURCE_EVIDENCE_PATH must be a relative repo-local path" >&2; return 2; }
  evidence_abs="$(automation_v2_safe_repo_path "$AUTOMATION_REPO_ROOT" "$AUTOMATION_REPO_ROOT/$evidence_value" yes)" || return 2
  [[ -f "$evidence_abs" && ! -L "$evidence_abs" ]] || { echo "ERROR: source evidence must be a non-symlink regular file" >&2; return 2; }
  case "$evidence_abs" in "$run_abs"/*) ;; *) echo "ERROR: source evidence must be contained by the handoff RUN_DIR" >&2; return 2 ;; esac
  relative="${evidence_abs#$AUTOMATION_REPO_ROOT/}"
  current="$AUTOMATION_REPO_ROOT"
  IFS='/' read -r -a evidence_parts <<< "$relative"
  for part in "${evidence_parts[@]}"; do
    current="$current/$part"
    [[ ! -L "$current" ]] || { echo "ERROR: source evidence path must not contain symlink components" >&2; return 2; }
  done
  [[ "$expected_hash" =~ ^[a-f0-9]{64}$ ]] || { echo "ERROR: SOURCE_EVIDENCE_SHA256 must be a lowercase SHA-256" >&2; return 2; }
  actual_hash="$(automation_v2_sha256_file "$evidence_abs")" || return 2
  [[ "$actual_hash" == "$expected_hash" ]] || { echo "ERROR: source evidence SHA-256 mismatch" >&2; return 2; }
  ACTIVE_HANDOFF_RUN_DIR="$run_abs"
  ACTIVE_HANDOFF_EVIDENCE="$relative"
  ACTIVE_HANDOFF_EVIDENCE_SHA256="$expected_hash"
}

validate_optional_pinned_bundle_from_handoff() {
  local raw="$1" resolved
  [[ -n "$raw" ]] || return 0
  [[ "$raw" != /* && "$raw" != *'..'* && "$raw" == *.json ]] || { echo "ERROR: handoff SUREBET_PINNED_BUNDLE must be a relative repo-local .json path" >&2; return 2; }
  resolved="$(automation_v2_safe_repo_path "$AUTOMATION_REPO_ROOT" "$AUTOMATION_REPO_ROOT/$raw" yes)" || return 2
  [[ -f "$resolved" && ! -L "$resolved" ]] || { echo "ERROR: handoff SUREBET_PINNED_BUNDLE must be a non-symlink regular file" >&2; return 2; }
}

load_active_handoff() {
  local expected_kind expected_flag repo schema fingerprint existing marker evidence_hash source_run_id run_dir_value
  local paper_status paper_exit blocker_family pinned_required current_source

  if [[ "$HANDOVER_PAPER_MODE" == "1" ]]; then
    ACTIVE_HANDOFF_MODE="paper"
    ACTIVE_HANDOFF_FILE="$AUTOMATION_REPO_ROOT/.automation/paper-mode-to-autonomous-implementation.env"
    expected_kind="paper-mode-to-autonomous-implementation"
    expected_flag="--handover-paper-mode"
  elif [[ "$HANDOVER_BUGFIX_AUDIT" == "1" ]]; then
    ACTIVE_HANDOFF_MODE="bugfix"
    ACTIVE_HANDOFF_FILE="$AUTOMATION_REPO_ROOT/.automation/autonomous-implementation-handover.env"
    expected_kind="autonomous-bugfix-to-autonomous-implementation"
    expected_flag="--handover-bugfix-audit"
  else
    return 0
  fi

  automation_v2_load_env_strict "$ACTIVE_HANDOFF_FILE" || return 2
  schema="$(automation_v2_env_require HANDOVER_SCHEMA_VERSION)" || return 2
  [[ "$schema" == "1" ]] || { echo "ERROR: unsupported $ACTIVE_HANDOFF_MODE handoff schema version: $schema" >&2; return 2; }

  if [[ "$ACTIVE_HANDOFF_MODE" == "paper" ]]; then
    validate_loaded_handoff_keys 'HANDOVER_SCHEMA_VERSION,HANDOVER_KIND,REPOSITORY,CONTROLLER,SOURCE_RUN_ID,RUN_AUTONOMOUS_IMPLEMENTATION_NEXT,AUTONOMOUS_IMPLEMENTATION_EXPECTED_FLAG,PAPER_MODE_FINAL_STATUS,PAPER_MODE_STOP_REASON,PAPER_MODE_FINAL_EXIT_CODE,PAPER_MODE_RESUME_AFTER_IMPLEMENTATION,PAPER_MODE_NOOP_SUCCESS_ALLOWED,PAPER_MODE_REQUIRED_ACTION,PAPER_MODE_BLOCKER_FAMILY,PAPER_MODE_EXPECTED_PRIVATE_PAPER_REEVALUATION_AFTER_SOURCE_CHANGE,PAPER_MODE_AUTOMATION_MAINTENANCE_ALLOWED,ALLOWED_PROTECTED_FILES,PAPER_SERVICE_SUPPORTED,SERVICE_REFRESH_REQUIRED,RUNTIME_EVIDENCE_REQUIRED,PINNED_BUNDLE_REQUIRED,SUREBET_PINNED_BUNDLE,HANDOFF_REASON,PAPER_SOURCE_FINGERPRINT,SOURCE_EVIDENCE_PATH,SOURCE_EVIDENCE_SHA256,VALIDATION_REQUIRED,RUN_DIR,WRITTEN_AT,HANDOVER_FINGERPRINT' || return 2
  else
    validate_loaded_handoff_keys 'HANDOVER_SCHEMA_VERSION,HANDOVER_KIND,REPOSITORY,CONTROLLER,RUN_AUTONOMOUS_IMPLEMENTATION_NEXT,AUTONOMOUS_IMPLEMENTATION_EXPECTED_FLAG,HANDOVER_AUTONOMOUS_IMPLEMENTATION,AUDIT_AREA,AUDIT_SOURCE_FINGERPRINT,BUG_IDS,BUG_SIGNATURE,IMPLEMENTATION_SCOPE,SOURCE_EVIDENCE_PATH,SOURCE_EVIDENCE_SHA256,VALIDATION_REQUIRED,BUGFIX_MODE_NOOP_SUCCESS_ALLOWED,BUGFIX_MODE_AUTOMATION_MAINTENANCE_ALLOWED,ALLOWED_PROTECTED_FILES,RUN_DIR,WRITTEN_AT,HANDOVER_FINGERPRINT' || return 2
  fi

  ACTIVE_HANDOFF_KIND="$(automation_v2_env_require HANDOVER_KIND)" || return 2
  [[ "$ACTIVE_HANDOFF_KIND" == "$expected_kind" ]] || { echo "ERROR: handoff kind mismatch: expected $expected_kind, got $ACTIVE_HANDOFF_KIND" >&2; return 2; }
  repo="$(automation_v2_env_require REPOSITORY)" || return 2
  [[ "$repo" == "$(repo_name)" ]] || { echo "ERROR: handoff repository mismatch: ${repo:-missing}" >&2; return 2; }
  [[ "$(automation_v2_env_require RUN_AUTONOMOUS_IMPLEMENTATION_NEXT)" == "yes" ]] || { echo "ERROR: handoff does not request autonomous implementation" >&2; return 2; }
  [[ "$(automation_v2_env_require AUTONOMOUS_IMPLEMENTATION_EXPECTED_FLAG)" == "$expected_flag" ]] || { echo "ERROR: handoff expected flag mismatch" >&2; return 2; }
  run_dir_value="$(automation_v2_env_require RUN_DIR)" || return 2
  evidence_hash="$(automation_v2_env_require SOURCE_EVIDENCE_SHA256)" || return 2
  validate_handoff_run_and_evidence "$run_dir_value" "$(automation_v2_env_require SOURCE_EVIDENCE_PATH)" "$evidence_hash" || return 2

  if [[ "$ACTIVE_HANDOFF_MODE" == "paper" ]]; then
    [[ "$(automation_v2_env_require CONTROLLER)" == "run-paper-evaluation.sh" ]] || { echo "ERROR: paper handoff controller mismatch" >&2; return 2; }
    source_run_id="$(automation_v2_env_require SOURCE_RUN_ID)" || return 2
    [[ "$source_run_id" =~ ^[A-Za-z0-9._:-]+$ && "$(basename "$ACTIVE_HANDOFF_RUN_DIR")" == "$source_run_id" ]] || { echo "ERROR: paper SOURCE_RUN_ID does not match RUN_DIR" >&2; return 2; }
    ACTIVE_HANDOFF_SOURCE_RUN_ID="$source_run_id"
    paper_status="$(automation_v2_env_require PAPER_MODE_FINAL_STATUS)" || return 2
    case "$paper_status" in PAPER_EVALUATION_BLOCKED_REPO_VALIDATION_FAILED|PAPER_EVALUATION_BLOCKED_SOURCE_FIX_REQUIRED) ;; *) echo "ERROR: paper handoff final status is not implementation-actionable: $paper_status" >&2; return 2 ;; esac
    [[ -n "$(automation_v2_env_require PAPER_MODE_STOP_REASON)" ]] || return 2
    paper_exit="$(automation_v2_env_require PAPER_MODE_FINAL_EXIT_CODE)" || return 2
    [[ "$paper_exit" == "2" ]] || { echo "ERROR: paper handoff exit code must be 2; got: $paper_exit" >&2; return 2; }
    [[ "$(automation_v2_env_require PAPER_MODE_RESUME_AFTER_IMPLEMENTATION)" == "yes" ]] || return 2
    ACTIVE_HANDOFF_NOOP_ALLOWED="$(require_handoff_yes_no PAPER_MODE_NOOP_SUCCESS_ALLOWED)" || return 2
    ACTIVE_HANDOFF_AUTOMATION_MAINTENANCE_ALLOWED="$(require_handoff_yes_no PAPER_MODE_AUTOMATION_MAINTENANCE_ALLOWED)" || return 2
    ACTIVE_HANDOFF_ALLOWED_PROTECTED_FILES="$(automation_v2_env_require ALLOWED_PROTECTED_FILES)" || return 2
    ACTIVE_HANDOFF_REQUIRED_SCOPE="$(automation_v2_env_require PAPER_MODE_REQUIRED_ACTION)" || return 2
    [[ "$ACTIVE_HANDOFF_REQUIRED_SCOPE" == "bounded_source_implementation" ]] || { echo "ERROR: unsupported paper implementation action: $ACTIVE_HANDOFF_REQUIRED_SCOPE" >&2; return 2; }
    blocker_family="$(automation_v2_env_require PAPER_MODE_BLOCKER_FAMILY)" || return 2
    case "$blocker_family" in validation|source|controller|artifact) ;; *) echo "ERROR: unsupported paper blocker family: $blocker_family" >&2; return 2 ;; esac
    [[ "$(automation_v2_env_require PAPER_MODE_EXPECTED_PRIVATE_PAPER_REEVALUATION_AFTER_SOURCE_CHANGE)" == "yes" ]] || return 2
    [[ "$(automation_v2_env_require PAPER_SERVICE_SUPPORTED)" == "0" ]] || return 2
    [[ "$(automation_v2_env_require SERVICE_REFRESH_REQUIRED)" == "0" ]] || return 2
    [[ "$(automation_v2_env_require RUNTIME_EVIDENCE_REQUIRED)" == "0" ]] || return 2
    pinned_required="$(require_handoff_zero_one PINNED_BUNDLE_REQUIRED)" || return 2
    validate_optional_pinned_bundle_from_handoff "${AUTOMATION_V2_ENV[SUREBET_PINNED_BUNDLE]-}" || return 2
    [[ -n "$(automation_v2_env_require HANDOFF_REASON)" ]] || return 2
    [[ "$(automation_v2_env_require VALIDATION_REQUIRED)" == "npm_run_validate" ]] || return 2
    ACTIVE_HANDOFF_SOURCE_FINGERPRINT="$(automation_v2_env_require PAPER_SOURCE_FINGERPRINT)" || return 2
  else
    [[ "$(automation_v2_env_require CONTROLLER)" == "run-autonomous-bugfix.sh" ]] || { echo "ERROR: bugfix handoff controller mismatch" >&2; return 2; }
    [[ "$(automation_v2_env_require HANDOVER_AUTONOMOUS_IMPLEMENTATION)" == "yes" ]] || { echo "ERROR: bugfix handoff does not authorize implementation" >&2; return 2; }
    ACTIVE_HANDOFF_AUDIT_AREA="$(automation_v2_env_require AUDIT_AREA)" || return 2
    [[ "$ACTIVE_HANDOFF_AUDIT_AREA" =~ ^[A-Za-z0-9._:-]+$ ]] || { echo "ERROR: invalid bugfix AUDIT_AREA" >&2; return 2; }
    ACTIVE_HANDOFF_BUG_IDS="$(automation_v2_env_require BUG_IDS)" || return 2
    [[ "$ACTIVE_HANDOFF_BUG_IDS" != "none" && "$ACTIVE_HANDOFF_BUG_IDS" =~ ^[A-Za-z0-9._:-]+(,[A-Za-z0-9._:-]+)*$ ]] || { echo "ERROR: invalid bugfix BUG_IDS" >&2; return 2; }
    [[ "$(automation_v2_env_require BUG_SIGNATURE)" =~ ^[a-f0-9]{64}$ ]] || { echo "ERROR: invalid BUG_SIGNATURE" >&2; return 2; }
    ACTIVE_HANDOFF_REQUIRED_SCOPE="$(automation_v2_env_require IMPLEMENTATION_SCOPE)" || return 2
    [[ "$ACTIVE_HANDOFF_REQUIRED_SCOPE" != "none" ]] || { echo "ERROR: bugfix IMPLEMENTATION_SCOPE must be concrete" >&2; return 2; }
    [[ "$(automation_v2_env_require VALIDATION_REQUIRED)" == "npm_run_validate" ]] || return 2
    ACTIVE_HANDOFF_NOOP_ALLOWED="$(require_handoff_yes_no BUGFIX_MODE_NOOP_SUCCESS_ALLOWED)" || return 2
    [[ "$ACTIVE_HANDOFF_NOOP_ALLOWED" == "no" ]] || { echo "ERROR: bugfix implementation handoff must not allow no-op success" >&2; return 2; }
    ACTIVE_HANDOFF_AUTOMATION_MAINTENANCE_ALLOWED="$(require_handoff_yes_no BUGFIX_MODE_AUTOMATION_MAINTENANCE_ALLOWED)" || return 2
    ACTIVE_HANDOFF_ALLOWED_PROTECTED_FILES="$(automation_v2_env_require ALLOWED_PROTECTED_FILES)" || return 2
    ACTIVE_HANDOFF_SOURCE_FINGERPRINT="$(automation_v2_env_require AUDIT_SOURCE_FINGERPRINT)" || return 2
  fi

  [[ "$ACTIVE_HANDOFF_SOURCE_FINGERPRINT" =~ ^[a-f0-9]{64}$ ]] || { echo "ERROR: handoff source fingerprint must be a lowercase SHA-256" >&2; return 2; }
  current_source="${INITIAL_SOURCE_FINGERPRINT:-$(compute_source_fingerprint)}"
  [[ "$ACTIVE_HANDOFF_SOURCE_FINGERPRINT" == "$current_source" ]] || { echo "ERROR: handoff source fingerprint does not match the current repository state" >&2; return 2; }

  if [[ "$ACTIVE_HANDOFF_AUTOMATION_MAINTENANCE_ALLOWED" == "yes" ]]; then
    [[ "$ACTIVE_HANDOFF_ALLOWED_PROTECTED_FILES" != "none" ]] || { echo "ERROR: automated maintenance handoff requires an exact ALLOWED_PROTECTED_FILES list" >&2; return 2; }
    validate_allowed_protected_files "$ACTIVE_HANDOFF_ALLOWED_PROTECTED_FILES" || return 2
  else
    [[ -z "$ACTIVE_HANDOFF_ALLOWED_PROTECTED_FILES" || "$ACTIVE_HANDOFF_ALLOWED_PROTECTED_FILES" == "none" ]] || { echo "ERROR: ALLOWED_PROTECTED_FILES is set while automation maintenance is disabled" >&2; return 2; }
    ACTIVE_HANDOFF_ALLOWED_PROTECTED_FILES="none"
  fi

  fingerprint="$(automation_v2_semantic_env_fingerprint_loaded)" || return 2
  existing="$(automation_v2_env_require HANDOVER_FINGERPRINT)" || return 2
  [[ "$existing" == "$fingerprint" ]] || { echo "ERROR: $ACTIVE_HANDOFF_MODE handoff fingerprint mismatch" >&2; return 2; }
  ACTIVE_HANDOFF_FINGERPRINT="$fingerprint"
  marker="$AUTOMATION_REPO_ROOT/.automation/consumed-handoffs/${ACTIVE_HANDOFF_FINGERPRINT}.env"
  ACTIVE_HANDOFF_CONSUMED_MARKER="$marker"
  [[ ! -e "$marker" ]] || { echo "ERROR: handoff was already consumed: $ACTIVE_HANDOFF_FINGERPRINT" >&2; return 2; }
  automation_v2_atomic_copy "$ACTIVE_HANDOFF_FILE" "$AUTOMATION_RUN_DIR/input-${ACTIVE_HANDOFF_MODE}-implementation-handoff.env" || return 2
  automation_log "handoff_validated mode=$ACTIVE_HANDOFF_MODE schema=1 fingerprint=$ACTIVE_HANDOFF_FINGERPRINT evidence_sha256=$ACTIVE_HANDOFF_EVIDENCE_SHA256"
}

resolve_task_source() {
  load_active_handoff || automation_die "invalid implementation handoff" 2
  if [[ "$ACTIVE_HANDOFF_MODE" != "none" ]]; then
    TASK_SOURCE="$AUTOMATION_RUN_DIR/${ACTIVE_HANDOFF_MODE}-handoff-implementation-task.md"
    {
      printf '# Verified %s implementation handoff\n\n' "$ACTIVE_HANDOFF_MODE"
      printf 'Handoff fingerprint: `%s`.\n\n' "$ACTIVE_HANDOFF_FINGERPRINT"
      [[ -n "$ACTIVE_HANDOFF_AUDIT_AREA" ]] && printf 'Audit area: `%s`.\n\n' "$ACTIVE_HANDOFF_AUDIT_AREA"
      [[ -n "$ACTIVE_HANDOFF_BUG_IDS" ]] && printf 'Bug IDs: `%s`.\n\n' "$ACTIVE_HANDOFF_BUG_IDS"
      printf 'Required bounded scope: `%s`.\n\n' "$ACTIVE_HANDOFF_REQUIRED_SCOPE"
      printf 'Evidence: `%s`.\n\n' "$ACTIVE_HANDOFF_EVIDENCE"
      printf 'Evidence SHA-256: `%s`.\n\n' "$ACTIVE_HANDOFF_EVIDENCE_SHA256"
      printf 'Source fingerprint: `%s`.\n\n' "$ACTIVE_HANDOFF_SOURCE_FINGERPRINT"
      printf 'Source run directory: `%s`.\n\n' "$ACTIVE_HANDOFF_RUN_DIR"
      printf 'No-op success allowed: `%s`.\n\n' "$ACTIVE_HANDOFF_NOOP_ALLOWED"
      printf 'Automation maintenance allowed: `%s`.\n\n' "$ACTIVE_HANDOFF_AUTOMATION_MAINTENANCE_ALLOWED"
      printf 'Exact protected-file allowlist: `%s`.\n\n' "$ACTIVE_HANDOFF_ALLOWED_PROTECTED_FILES"
      printf 'The handoff is the binding task. Do not replace it with a generic repo-status conclusion.\n\n'
      printf 'Constraints remain: no providers, no direct betting-win DB reads, no execution, no public reports, and no profitability or live-readiness claims.\n'
    } > "$TASK_SOURCE"
  elif [[ -n "$PROMPT_FILE" ]]; then
    [[ -f "$PROMPT_FILE" ]] || automation_die "prompt file not found: $PROMPT_FILE" 1
    TASK_SOURCE="$PROMPT_FILE"
  else
    TASK_SOURCE="docs/automation/current-implementation-task.md"
    [[ -f "$TASK_SOURCE" ]] || automation_die "missing current implementation task: $TASK_SOURCE" 1
  fi
  grep -q 'AUTOMATION_TASK_NOT_SET' "$TASK_SOURCE" && automation_die "implementation task is not set in $TASK_SOURCE" 1
  [[ -s "$TASK_SOURCE" ]] || automation_die "implementation task file is empty: $TASK_SOURCE" 1
}

protected_digest_from_snapshot() {
  local snapshot="$1" path="$2"
  awk -v p="$path" '$2 == p { print $1; found=1; exit } END { if (!found) print "ABSENT" }' "$snapshot"
}

protected_path_allowed() {
  local candidate="$1" item
  local -a items=()
  [[ "$ACTIVE_HANDOFF_ALLOWED_PROTECTED_FILES" != "none" ]] || return 1
  IFS=',' read -r -a items <<< "$ACTIVE_HANDOFF_ALLOWED_PROTECTED_FILES"
  for item in "${items[@]}"; do
    [[ "$candidate" == "$item" ]] && return 0
  done
  return 1
}

check_protected_policy() {
  local after="$1" diff_out="$2" changed_out="$3" path before_digest after_digest changed=0
  automation_snapshot_protected "$after"
  diff -u "$AUTOMATION_RUN_DIR/protected_before.sha256" "$after" > "$diff_out" 2>&1 || true
  : > "$changed_out"
  for path in "${AUTOMATION_PROTECTED_FILES[@]:-}"; do
    before_digest="$(protected_digest_from_snapshot "$AUTOMATION_RUN_DIR/protected_before.sha256" "$path")"
    after_digest="$(protected_digest_from_snapshot "$after" "$path")"
    if [[ "$before_digest" != "$after_digest" ]]; then
      printf '%s\n' "$path" >> "$changed_out"
      changed=1
    fi
  done
  [[ "$changed" == "1" ]] || return 0

  if [[ "$ACTIVE_HANDOFF_MODE" == "none" ]]; then
    if [[ "${AUTOMATION_ALLOW_PROTECTED_CHANGES:-0}" == "1" ]]; then
      automation_log "protected_changes_allowed=manual_explicit_override"
      return 0
    fi
    automation_log "protected_files_changed diff=$diff_out"
    return 1
  fi

  [[ "$ACTIVE_HANDOFF_AUTOMATION_MAINTENANCE_ALLOWED" == "yes" ]] || {
    automation_log "protected_files_changed_without_handoff_authorization diff=$diff_out"
    return 1
  }
  while IFS= read -r path; do
    protected_path_allowed "$path" || {
      automation_log "protected_file_outside_handoff_allowlist path=$path"
      return 1
    }
  done < "$changed_out"
  automation_log "protected_changes_allowed=handoff_exact_allowlist files=$(paste -sd, "$changed_out")"
}

run_baseline_validation() {
  local dir="$AUTOMATION_RUN_DIR/preflight/baseline-validation"
  local before after
  mkdir -p "$dir"
  before="$(compute_source_fingerprint)" || {
    FINAL_STATUS="setup_failed"
    STOP_REASON="baseline_source_fingerprint_failed"
    return 2
  }
  if automation_run_validations implementation "$dir" "$VALIDATION_TIMEOUT_SECONDS"; then
    BASELINE_VALIDATION_EXIT_CODE=0
  else
    BASELINE_VALIDATION_EXIT_CODE=$?
  fi
  after="$(compute_source_fingerprint)" || {
    FINAL_STATUS="setup_failed"
    STOP_REASON="baseline_source_fingerprint_failed"
    return 2
  }
  if [[ "$before" != "$after" ]]; then
    FINAL_STATUS="BLOCKED=yes"
    STOP_REASON="baseline_validation_mutated_source"
    return 2
  fi
  if [[ "$BASELINE_VALIDATION_EXIT_CODE" == "0" ]]; then
    BASELINE_VALIDATION_STATUS="passed"
    LAST_VALIDATED_SOURCE_FINGERPRINT="$INITIAL_SOURCE_FINGERPRINT"
    RUN_SOURCE_VALIDATION_PASSED="yes"
  else
    BASELINE_VALIDATION_STATUS="failed"
    RUN_SOURCE_VALIDATION_PASSED="no"
  fi
  {
    printf 'baseline_validation_status=%s\n' "$BASELINE_VALIDATION_STATUS"
    printf 'baseline_validation_exit_code=%s\n' "$BASELINE_VALIDATION_EXIT_CODE"
    printf 'baseline_validation_dir=%s\n' "$dir"
  } > "$AUTOMATION_RUN_DIR/preflight/baseline-validation.env"
  automation_log "baseline_validation_status=$BASELINE_VALIDATION_STATUS exit=$BASELINE_VALIDATION_EXIT_CODE"
}

codex_failure_class() {
  local log="$1" rc="$2"
  if [[ "$rc" == "124" || "$rc" == "137" ]]; then printf 'timeout\n'; return; fi
  if grep -qiE 'context_length_exceeded|context window|maximum context|input exceeds.*context|too many tokens' "$log" 2>/dev/null; then
    printf 'context_window\n'
    return
  fi
  if grep -qiE 'usage limit|rate limit|quota|insufficient credits|model .*not found|unknown model|model unavailable|capacity|temporarily unavailable|overloaded' "$log" 2>/dev/null; then
    printf 'model_availability\n'
    return
  fi
  printf 'generic\n'
}

run_codex_attempt() {
  local prompt="$1" log="$2" model="$3" rc
  if automation_run_codex_prompt "$prompt" "$log" "$CODEX_TIMEOUT_SECONDS" "$model"; then
    rc=0
  else
    rc=$?
  fi
  return "$rc"
}

write_compact_retry_prompt() {
  local original="$1" compact="$2"
  cat > "$compact" <<EOF_COMPACT
Role: senior autonomous implementation engineer.

Execute the exact same bounded task defined in:
- original cycle prompt: $original
- task source: $TASK_SOURCE

This is a one-shot context-compressed retry after a context-window failure. Read the task source and required repo instruction files directly. Preserve every safety constraint and create every required cycle artifact named in the original prompt. Make only the smallest validated changes. Do not summarize unrelated repo history.
EOF_COMPACT
}

run_codex_cycle() {
  local prompt="$1" cycle_dir="$2" before after rc class compact
  before="$(compute_source_fingerprint 2>/dev/null || true)"
  if run_codex_attempt "$prompt" "$cycle_dir/codex.log" "$CODEX_MODEL"; then
    rc=0
  else
    rc=$?
  fi
  [[ "$rc" == "0" ]] && { LAST_CODEX_FAILURE_CLASS="none"; return 0; }

  after="$(compute_source_fingerprint 2>/dev/null || true)"
  class="$(codex_failure_class "$cycle_dir/codex.log" "$rc")"
  LAST_CODEX_FAILURE_CLASS="$class"
  if [[ -n "$before" && "$before" != "$after" ]]; then
    automation_log "codex_retry_refused reason=source_changed failure_class=$class"
    return "$rc"
  fi

  if [[ "$class" == "context_window" ]]; then
    compact="$cycle_dir/codex_prompt_compact_retry.md"
    write_compact_retry_prompt "$prompt" "$compact"
    if run_codex_attempt "$compact" "$cycle_dir/codex-context-retry.log" "$CODEX_MODEL"; then
      rc=0
    else
      rc=$?
    fi
    [[ "$rc" == "0" ]] && { LAST_CODEX_FAILURE_CLASS="none"; return 0; }
    after="$(compute_source_fingerprint 2>/dev/null || true)"
    if [[ -n "$before" && "$before" != "$after" ]]; then
      LAST_CODEX_FAILURE_CLASS="$(codex_failure_class "$cycle_dir/codex-context-retry.log" "$rc")"
      automation_log "codex_retry_refused reason=source_changed_after_context_retry failure_class=$LAST_CODEX_FAILURE_CLASS"
      return "$rc"
    fi
    class="$(codex_failure_class "$cycle_dir/codex-context-retry.log" "$rc")"
    LAST_CODEX_FAILURE_CLASS="$class"
  fi

  if [[ "$class" == "model_availability" && -n "$CODEX_FALLBACK_MODEL" ]]; then
    if run_codex_attempt "$prompt" "$cycle_dir/codex-fallback.log" "$CODEX_FALLBACK_MODEL"; then
      rc=0
    else
      rc=$?
    fi
    [[ "$rc" == "0" ]] && { LAST_CODEX_FAILURE_CLASS="none"; return 0; }
    LAST_CODEX_FAILURE_CLASS="$(codex_failure_class "$cycle_dir/codex-fallback.log" "$rc")"
  fi
  return "$rc"
}

write_return_handover() {
  [[ "$ACTIVE_HANDOFF_MODE" != "none" ]] || return 0
  refresh_source_change_state
  local target reevaluate="no" reaud="no" next_key next_value kind
  if [[ "$FINAL_STATUS" == "AUTONOMOUS_GOAL_COMPLETE=yes" && "$RUN_SOURCE_VALIDATION_PASSED" == "yes" ]]; then
    if [[ "$RUN_SOURCE_CHANGED" == "yes" || "$ACTIVE_HANDOFF_NOOP_ALLOWED" == "yes" ]]; then
      reevaluate="yes"
      reaud="yes"
    fi
  fi
  if [[ "$ACTIVE_HANDOFF_MODE" == "paper" ]]; then
    target="$AUTOMATION_REPO_ROOT/.automation/paper-mode-handover.env"
    kind="paper-mode-after-autonomous-implementation"
    next_key="RUN_PAPER_EVALUATION_NEXT"
    next_value="$reevaluate"
  else
    target="$AUTOMATION_REPO_ROOT/.automation/bugfix-mode-handover.env"
    kind="bugfix-mode-after-autonomous-implementation"
    next_key="RUN_BUGFIX_AUDIT_NEXT"
    next_value="$reaud"
  fi
  automation_v2_write_env_atomic "$target" \
    "HANDOVER_SCHEMA_VERSION=1" \
    "HANDOVER_KIND=$kind" \
    "REPOSITORY=$(repo_name)" \
    "CONTROLLER=$SCRIPT_NAME" \
    "SOURCE_HANDOFF_FINGERPRINT=$ACTIVE_HANDOFF_FINGERPRINT" \
    "$next_key=$next_value" \
    "AUTONOMOUS_FINAL_STATUS=$FINAL_STATUS" \
    "AUTONOMOUS_STOP_REASON=$STOP_REASON" \
    "AUTONOMOUS_FINAL_EXIT_CODE=${EXIT_STATUS:-0}" \
    "IMPLEMENTATION_SOURCE_CHANGED=$RUN_SOURCE_CHANGED" \
    "IMPLEMENTATION_SOURCE_VALIDATION_PASSED=$RUN_SOURCE_VALIDATION_PASSED" \
    "PRIVATE_PAPER_REEVALUATION_REQUIRED=$reevaluate" \
    "BUGFIX_REAUDIT_REQUIRED=$reaud" \
    "AUDIT_AREA=${ACTIVE_HANDOFF_AUDIT_AREA:-none}" \
    "BUG_IDS=${ACTIVE_HANDOFF_BUG_IDS:-none}" \
    "PAPER_SERVICE_SUPPORTED=0" \
    "SERVICE_REFRESH_REQUIRED=0" \
    "RUNTIME_EVIDENCE_REQUIRED=0" \
    "REAL_UPSTREAM_EVALUATION=blocked_on_required_upstream_input" \
    "RUN_DIR=${AUTOMATION_RUN_DIR:-}" \
    "WRITTEN_AT=$(automation_now_iso)"
  automation_v2_add_or_verify_fingerprint "$target" >/dev/null
  cp "$target" "$AUTOMATION_RUN_DIR/$(basename "$target")"

}

write_consumed_handoff_marker() {
  [[ "$ACTIVE_HANDOFF_MODE" != "none" ]] || return 0
  [[ "$FINAL_STATUS" == "AUTONOMOUS_GOAL_COMPLETE=yes" ]] || return 0
  [[ -n "$ACTIVE_HANDOFF_CONSUMED_MARKER" ]] || return 2
  mkdir -p "$(dirname "$ACTIVE_HANDOFF_CONSUMED_MARKER")"
  automation_v2_write_env_atomic "$ACTIVE_HANDOFF_CONSUMED_MARKER" \
    "HANDOVER_FINGERPRINT=$ACTIVE_HANDOFF_FINGERPRINT" \
    "HANDOVER_KIND=$ACTIVE_HANDOFF_KIND" \
    "FINAL_STATUS=$FINAL_STATUS" \
    "RUN_DIR=$AUTOMATION_RUN_DIR" \
    "WRITTEN_AT=$(automation_now_iso)"
}

remove_consumed_handoff_marker() {
  [[ -n "$ACTIVE_HANDOFF_CONSUMED_MARKER" ]] || return 0
  rm -f -- "$ACTIVE_HANDOFF_CONSUMED_MARKER"
}

attempt_final_lock_release() {
  local rc=0
  if [[ "$LOCK_ACQUIRED" != "1" ]]; then
    LOCK_RELEASE_STATUS="not_acquired"
    LOCK_RELEASE_EXIT_CODE=0
    LOCK_PRESERVED="no"
    return 0
  fi
  if automation_release_lock; then
    rc=0
  else
    rc=$?
  fi
  LOCK_RELEASE_EXIT_CODE="$rc"
  if [[ "$rc" == "0" ]]; then
    LOCK_RELEASE_STATUS="released"
    LOCK_PRESERVED="no"
    LOCK_ACQUIRED=0
    return 0
  fi
  LOCK_RELEASE_STATUS="preserved"
  LOCK_PRESERVED="yes"
  automation_log "final_lock_release_failed exit=$rc lock_preserved=yes lock=${AUTOMATION_LOCK_FILE:-unknown}"
  return "$rc"
}

build_artifacts_zip_bounded() {
  local tmp
  [[ -d "$AUTOMATION_REPO_ROOT/artifacts" ]] || return 0
  tmp="$AUTOMATION_REPO_ROOT/.artifacts.zip.tmp.$$.zip"
  rm -f "$tmp"
  if automation_v2_zip_with_timeout "$ZIP_TIMEOUT_SECONDS" "$tmp" "$AUTOMATION_REPO_ROOT" "artifacts"; then
    mv -f "$tmp" "$AUTOMATION_REPO_ROOT/artifacts.zip"
    automation_log "artifacts_zip_created path=$AUTOMATION_REPO_ROOT/artifacts.zip"
  else
    local rc=$?
    rm -f "$tmp"
    automation_log "artifacts_zip_failed exit=$rc timeout=${ZIP_TIMEOUT_SECONDS}s"
    return "$rc"
  fi
}

write_final_summary() {
  [[ -n "${AUTOMATION_RUN_DIR:-}" ]] || return 0
  {
    printf '# Autonomous implementation final summary\n\n'
    printf 'script_version=%s\n' "$SCRIPT_VERSION"
    printf 'final_status=%s\n' "$FINAL_STATUS"
    printf 'stop_reason=%s\n' "$STOP_REASON"
    printf 'exit_status=%s\n' "$EXIT_STATUS"
    printf 'cycles_attempted=%s\n' "$CYCLES_ATTEMPTED"
    printf 'baseline_validation_status=%s\n' "$BASELINE_VALIDATION_STATUS"
    printf 'baseline_validation_exit_code=%s\n' "$BASELINE_VALIDATION_EXIT_CODE"
    printf 'run_source_changed=%s\n' "$RUN_SOURCE_CHANGED"
    printf 'run_source_validation_passed=%s\n' "$RUN_SOURCE_VALIDATION_PASSED"
    printf 'active_handoff_mode=%s\n' "$ACTIVE_HANDOFF_MODE"
    printf 'active_handoff_fingerprint=%s\n' "${ACTIVE_HANDOFF_FINGERPRINT:-none}"
    printf 'last_codex_failure_class=%s\n' "$LAST_CODEX_FAILURE_CLASS"
    if [[ "$LOCK_RELEASE_STATUS" != "not_attempted" ]]; then
      printf 'lock_release_status=%s\n' "$LOCK_RELEASE_STATUS"
      printf 'lock_release_exit_code=%s\n' "$LOCK_RELEASE_EXIT_CODE"
      printf 'lock_preserved=%s\n' "$LOCK_PRESERVED"
      printf 'lock_file=%s\n' "${AUTOMATION_LOCK_FILE:-none}"
    fi
    printf 'duration_seconds=%s\n' "$DURATION_SECONDS"
    printf 'cycle_timeout_seconds=%s\n' "$CODEX_TIMEOUT_SECONDS"
    printf 'validation_timeout_seconds=%s\n' "$VALIDATION_TIMEOUT_SECONDS"
    printf 'zip_timeout_seconds=%s\n' "$ZIP_TIMEOUT_SECONDS"
    printf 'completed_at=%s\n' "$(automation_now_iso)"
  } > "$AUTOMATION_RUN_DIR/final-summary.md"
}


publish_parent_child_result() {
  local publish_rc=0 refresh_rc=0
  [[ -n "${AUTOMATION_CHILD_RESULT_FILE:-}" ]] || return 0

  set +e
  automation_v2_publish_child_result \
    "$AUTOMATION_REPO_ROOT" "$SCRIPT_NAME" "$SCRIPT_VERSION" "${AUTOMATION_RUN_DIR:-}" \
    "$FINAL_STATUS" "$STOP_REASON" "$EXIT_STATUS" "$CYCLES_ATTEMPTED" \
    "$LOCK_RELEASE_STATUS" "$LOCK_RELEASE_EXIT_CODE" "$LOCK_PRESERVED"
  publish_rc=$?
  set -e
  if [[ "$publish_rc" == "0" ]]; then
    return 0
  fi

  automation_log "child_result_publication_failed exit=$publish_rc path=${AUTOMATION_CHILD_RESULT_FILE:-}"
  FINAL_STATUS="BLOCKED=yes"
  STOP_REASON="child_result_publication_failed"
  EXIT_STATUS=2
  if [[ -n "${AUTOMATION_RUN_DIR:-}" ]]; then
    write_final_summary || true
    set +e
    automation_refresh_final_artifacts_zip "$ZIP_TIMEOUT_SECONDS" "$AUTOMATION_REPO_ROOT" "$AUTOMATION_RUN_DIR"
    refresh_rc=$?
    if [[ "$refresh_rc" != "0" ]]; then
      build_artifacts_zip_bounded
      refresh_rc=$?
    fi
    set -e
    [[ "$refresh_rc" == "0" ]] || automation_log "child_result_failure_artifacts_refresh_failed exit=$refresh_rc"
  fi

  set +e
  automation_v2_publish_child_result \
    "$AUTOMATION_REPO_ROOT" "$SCRIPT_NAME" "$SCRIPT_VERSION" "${AUTOMATION_RUN_DIR:-}" \
    "$FINAL_STATUS" "$STOP_REASON" "$EXIT_STATUS" "$CYCLES_ATTEMPTED" \
    "$LOCK_RELEASE_STATUS" "$LOCK_RELEASE_EXIT_CODE" "$LOCK_PRESERVED"
  publish_rc=$?
  set -e
  [[ "$publish_rc" == "0" ]] || automation_log "corrective_child_result_publication_failed exit=$publish_rc"
  return 0
}

finish() {
  local rc="${1:-$?}" handoff_rc=0 marker_rc=0 zip_rc=0 lock_rc=0 corrective_zip_rc=0
  [[ "$FINISHED" == "1" ]] && return 0
  FINISHED=1
  trap - EXIT INT TERM

  if [[ "$FINAL_STATUS" == "not_started" ]]; then
    FINAL_STATUS="setup_failed"
    STOP_REASON="unexpected_exit_before_start"
  elif [[ "$rc" != "0" && "$STOP_REASON" == "loop_started" ]]; then
    FINAL_STATUS="BLOCKED=yes"
    STOP_REASON="unexpected_controller_exit"
    rc=2
  fi
  EXIT_STATUS="$rc"
  refresh_source_change_state || true

  if [[ -n "${AUTOMATION_RUN_DIR:-}" ]]; then
    if [[ "$ACTIVE_HANDOFF_MODE" != "none" ]]; then
      set +e
      write_return_handover
      handoff_rc=$?
      set -e
      if [[ "$handoff_rc" != "0" ]]; then
        automation_log "return_handoff_failed exit=$handoff_rc"
        FINAL_STATUS="BLOCKED=yes"
        STOP_REASON="return_handoff_write_failed"
        EXIT_STATUS=2
      fi
    fi
    write_final_summary || true
    automation_collect_repo_snapshot "$AUTOMATION_RUN_DIR/final-repo-snapshot" || true
    set +e
    build_artifacts_zip_bounded
    zip_rc=$?
    set -e
    if [[ "$zip_rc" != "0" && "$EXIT_STATUS" == "0" ]]; then
      FINAL_STATUS="BLOCKED=yes"
      STOP_REASON="artifacts_zip_failed"
      EXIT_STATUS=2
      write_final_summary || true
    fi

    if [[ "$ACTIVE_HANDOFF_MODE" != "none" && "$FINAL_STATUS" == "AUTONOMOUS_GOAL_COMPLETE=yes" ]]; then
      set +e
      write_consumed_handoff_marker
      marker_rc=$?
      set -e
      if [[ "$marker_rc" != "0" ]]; then
        automation_log "consumed_handoff_marker_failed exit=$marker_rc"
        FINAL_STATUS="BLOCKED=yes"
        STOP_REASON="consumed_handoff_marker_write_failed"
        EXIT_STATUS=2
        set +e
        write_return_handover
        handoff_rc=$?
        set -e
        [[ "$handoff_rc" == "0" ]] || automation_log "corrective_return_handoff_failed exit=$handoff_rc"
        write_final_summary || true
        set +e
        build_artifacts_zip_bounded
        corrective_zip_rc=$?
        set -e
        [[ "$corrective_zip_rc" == "0" ]] || automation_log "corrective_artifacts_zip_failed exit=$corrective_zip_rc"
      fi
    fi
  fi

  set +e
  attempt_final_lock_release
  lock_rc=$?
  set -e
  if [[ "$lock_rc" != "0" ]]; then
    remove_consumed_handoff_marker || true
    FINAL_STATUS="BLOCKED=yes"
    STOP_REASON="lock_release_failed_lock_preserved"
    EXIT_STATUS=2
    if [[ -n "${AUTOMATION_RUN_DIR:-}" ]]; then
      if [[ "$ACTIVE_HANDOFF_MODE" != "none" ]]; then
        set +e
        write_return_handover
        handoff_rc=$?
        set -e
        [[ "$handoff_rc" == "0" ]] || automation_log "lock_failure_return_handoff_failed exit=$handoff_rc"
      fi
      write_final_summary || true
      set +e
      build_artifacts_zip_bounded
      corrective_zip_rc=$?
      set -e
      [[ "$corrective_zip_rc" == "0" ]] || automation_log "lock_failure_artifacts_zip_failed exit=$corrective_zip_rc"
    fi
  elif [[ -n "${AUTOMATION_RUN_DIR:-}" ]]; then
    write_final_summary || true
    set +e
    if [[ "$zip_rc" == "0" ]]; then
      automation_refresh_final_artifacts_zip "$ZIP_TIMEOUT_SECONDS" "$AUTOMATION_REPO_ROOT" "$AUTOMATION_RUN_DIR"
      corrective_zip_rc=$?
    else
      corrective_zip_rc="$zip_rc"
    fi
    if [[ "$corrective_zip_rc" != "0" ]]; then
      automation_log "final_artifacts_zip_refresh_failed exit=$corrective_zip_rc; attempting full rebuild"
      build_artifacts_zip_bounded
      corrective_zip_rc=$?
    fi
    set -e
    if [[ "$corrective_zip_rc" != "0" && "$EXIT_STATUS" == "0" ]]; then
      FINAL_STATUS="BLOCKED=yes"
      STOP_REASON="artifacts_zip_failed"
      EXIT_STATUS=2
      write_final_summary || true
    fi
  fi

  publish_parent_child_result

  if [[ -n "${AUTOMATION_RUN_DIR:-}" ]]; then
    telegram_notify_send_final "run-autonomous-implementation.sh" "${AUTOMATION_REPO_NAME:-betting-win-surebet}" "$FINAL_STATUS" "$STOP_REASON" "$CYCLES_ATTEMPTED" "$EXIT_STATUS" "$AUTOMATION_RUN_DIR" "$AUTOMATION_CONTROLLER_LOG" "$AUTOMATION_REPO_ROOT" || true
  fi

  printf 'run_dir=%s\n' "${AUTOMATION_RUN_DIR:-}"
  printf 'final_status=%s\n' "$FINAL_STATUS"
  printf 'stop_reason=%s\n' "$STOP_REASON"
  printf 'final_exit_code=%s\n' "$EXIT_STATUS"
  printf 'cycles_completed=%s\n' "$CYCLES_ATTEMPTED"
  printf 'lock_release_status=%s\n' "$LOCK_RELEASE_STATUS"
  printf 'lock_release_exit_code=%s\n' "$LOCK_RELEASE_EXIT_CODE"
  printf 'lock_preserved=%s\n' "$LOCK_PRESERVED"
  exit "$EXIT_STATUS"
}

terminate_controller_children() {
  local pid
  while IFS= read -r pid; do
    [[ "$pid" =~ ^[1-9][0-9]*$ ]] || continue
    kill -TERM "$pid" 2>/dev/null || true
  done < <(jobs -pr 2>/dev/null || true)
}

on_signal() {
  terminate_controller_children
  FINAL_STATUS="interrupted"
  STOP_REASON="interrupted"
  exit 130
}

parse_args "$@" || exit 1
configure_defaults
validate_inputs || exit 1
LOCK_FILE="$AUTOMATION_REPO_ROOT/.automation/locks/run-autonomous-implementation.lock"

if [[ "$STATUS_ONLY" == "1" ]]; then automation_status_lock "$LOCK_FILE"; exit 0; fi
if [[ "$FORCE_UNLOCK" == "1" ]]; then automation_force_unlock "$LOCK_FILE" "$SCRIPT_NAME" "$AUTOMATION_REPO_ROOT"; exit 0; fi
if [[ "$PRINT_CONFIG" == "1" ]]; then print_config; exit 0; fi

trap 'finish $?' EXIT
trap on_signal INT TERM

AUTOMATION_SCRIPT_COMMAND="$0 $*"
if [[ "$ALLOW_PARALLEL" == "1" ]]; then
  automation_log "lock=skipped allow_parallel=1"
else
  automation_acquire_lock "$SCRIPT_NAME" "$AUTOMATION_REPO_ROOT"
  LOCK_ACQUIRED=1
fi
automation_create_run_dir "autonomous_implementation"
if [[ "$LOCK_ACQUIRED" == "1" ]]; then
  automation_write_lock_file
  automation_start_heartbeat
fi

assert_active_node_runtime || { FINAL_STATUS="setup_failed"; STOP_REASON="node_runtime_invalid"; exit 1; }
automation_collect_repo_snapshot "$AUTOMATION_RUN_DIR/initial-repo-snapshot"
INITIAL_SOURCE_FINGERPRINT="$(compute_source_fingerprint)" || { FINAL_STATUS="setup_failed"; STOP_REASON="initial_source_fingerprint_failed"; exit 1; }
[[ -n "$INITIAL_SOURCE_FINGERPRINT" ]] || { FINAL_STATUS="setup_failed"; STOP_REASON="initial_source_fingerprint_empty"; exit 1; }
automation_snapshot_protected "$AUTOMATION_RUN_DIR/protected_before.sha256"
maybe_auto_install || { FINAL_STATUS="setup_failed"; STOP_REASON="auto_install_failed"; exit 1; }
resolve_task_source
run_baseline_validation || exit 2

if [[ "$CHECK_ONLY" == "1" ]]; then
  automation_log "check_only=1 baseline_validation_status=$BASELINE_VALIDATION_STATUS"
  if [[ "$BASELINE_VALIDATION_STATUS" != "passed" ]]; then
    FINAL_STATUS="check_only_validation_failed"
    STOP_REASON="check_only_validation_failed"
    exit 1
  fi
  FINAL_STATUS="check_only_complete"
  STOP_REASON="check_only"
  exit 0
fi

automation_require_command "${AUTOMATION_CODEX_BIN:-codex}"
START_EPOCH="$(automation_now_epoch)"
FINAL_STATUS="CONTINUE_REQUIRED=yes"
STOP_REASON="loop_started"

while true; do
  NOW="$(automation_now_epoch)"
  if (( NOW - START_EPOCH >= DURATION_SECONDS )); then
    FINAL_STATUS="CONTINUE_REQUIRED=yes"
    STOP_REASON="duration_elapsed"
    exit 3
  fi
  if (( CYCLES_ATTEMPTED >= MAX_CYCLES )); then
    FINAL_STATUS="CONTINUE_REQUIRED=yes"
    STOP_REASON="max_cycles_reached"
    exit 3
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
- docs/repo_status_current.md
- docs/automation/README.md
- docs/automation/PROTECTED_AUTOMATION_FILES.md
- docs/automation/repo-profile.md
- docs/automation/autonomous-implementation.md
- $TASK_SOURCE

Baseline evidence captured before this cycle:
- baseline_validation_status=$BASELINE_VALIDATION_STATUS
- baseline_validation_exit_code=$BASELINE_VALIDATION_EXIT_CODE
- baseline_validation_artifacts=$AUTOMATION_RUN_DIR/preflight/baseline-validation
Treat baseline failures as concrete implementation evidence. Do not hide, delete, or silently bypass them.

Active handoff contract:
- mode=$ACTIVE_HANDOFF_MODE
- fingerprint=${ACTIVE_HANDOFF_FINGERPRINT:-none}
- required_scope=${ACTIVE_HANDOFF_REQUIRED_SCOPE:-task_file}
- no_op_success_allowed=$ACTIVE_HANDOFF_NOOP_ALLOWED
- automation_maintenance_allowed=$ACTIVE_HANDOFF_AUTOMATION_MAINTENANCE_ALLOWED
- exact_protected_file_allowlist=$ACTIVE_HANDOFF_ALLOWED_PROTECTED_FILES

Hard constraints:
- Do not commit, push, pull, reset, clean, stash, or rewrite branches.
- Do not print or modify secrets or .env files.
- Do not start, stop, restart, kill, detach, or replace services or user sessions.
- Do not connect to providers, external betting APIs, wallets, signers, orders, transactions, or direct betting-win databases.
- Do not add public reports, profitability claims, live readiness claims, or execution readiness claims.
- Protected automation files are read-only unless the active handoff explicitly authorizes exact named files. Do not edit any protected file outside that exact allowlist.
- Do not silently default missing required configuration. Fail fast with clear validation.
- Preserve existing structure and make surgical changes.

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

  if run_codex_cycle "$PROMPT" "$CYCLE_DIR"; then
    CODEX_RC=0
  else
    CODEX_RC=$?
  fi
  if [[ "$CODEX_RC" != "0" ]]; then
    CODEX_FAILURES=$((CODEX_FAILURES + 1))
    refresh_source_change_state || true
    FINAL_STATUS="BLOCKED=yes"
    STOP_REASON="codex_${LAST_CODEX_FAILURE_CLASS}_failed_cycle_${CYCLES_ATTEMPTED}"
    if [[ "$RUN_SOURCE_CHANGED" == "yes" ]]; then
      STOP_REASON="codex_failed_after_source_mutation_cycle_${CYCLES_ATTEMPTED}"
      exit 2
    fi
    if (( CODEX_FAILURES >= MAX_CODEX_FAILURES )); then
      exit 2
    fi
    continue
  fi

  git -C "$AUTOMATION_REPO_ROOT" diff --no-ext-diff > "$CYCLE_DIR/git_diff.patch" 2>/dev/null || true
  if ! check_protected_policy "$CYCLE_DIR/protected_after.sha256" "$CYCLE_DIR/protected_diff.patch" "$CYCLE_DIR/protected_changed_files.txt"; then
    FINAL_STATUS="BLOCKED=yes"
    STOP_REASON="protected_files_changed"
    exit 2
  fi
  if ! automation_require_cycle_artifacts "$CYCLE_DIR" allow_empty_git_diff implementation_plan.md changes_made.md validation_results.md remaining_gaps.md final_status.md continue_status.txt git_diff.patch; then
    FINAL_STATUS="BLOCKED=yes"
    STOP_REASON="malformed_cycle_artifacts_cycle_${CYCLES_ATTEMPTED}"
    exit 2
  fi

  if ! automation_run_validations implementation "$CYCLE_DIR/validation" "$VALIDATION_TIMEOUT_SECONDS"; then
    CONSECUTIVE_VALIDATION_FAILURES=$((CONSECUTIVE_VALIDATION_FAILURES + 1))
    refresh_source_change_state || true
    FINAL_STATUS="BLOCKED=yes"
    STOP_REASON="validation_failed_cycle_${CYCLES_ATTEMPTED}"
    if (( CONSECUTIVE_VALIDATION_FAILURES >= MAX_CONSECUTIVE_VALIDATION_FAILURES )); then
      exit 2
    fi
    continue
  fi

  LAST_VALIDATED_SOURCE_FINGERPRINT="$(compute_source_fingerprint)" || {
    FINAL_STATUS="BLOCKED=yes"
    STOP_REASON="post_validation_source_fingerprint_failed"
    exit 2
  }
  refresh_source_change_state
  printf 'IMPLEMENTATION_SOURCE_CHANGED=%s\nIMPLEMENTATION_SOURCE_VALIDATION_PASSED=%s\n' "$RUN_SOURCE_CHANGED" "$RUN_SOURCE_VALIDATION_PASSED" > "$CYCLE_DIR/implementation_source_state.env"
  CONSECUTIVE_VALIDATION_FAILURES=0

  if ! CONTINUE_STATUS="$(automation_read_continue_status "$CYCLE_DIR/continue_status.txt")"; then
    FINAL_STATUS="BLOCKED=yes"
    STOP_REASON="malformed_continue_status_cycle_${CYCLES_ATTEMPTED}"
    exit 2
  fi
  automation_log "cycle=${CYCLES_ATTEMPTED} continue_status=$CONTINUE_STATUS source_changed=$RUN_SOURCE_CHANGED source_validation_passed=$RUN_SOURCE_VALIDATION_PASSED"

  case "$CONTINUE_STATUS" in
    AUTONOMOUS_GOAL_COMPLETE=yes)
      if [[ "$ACTIVE_HANDOFF_MODE" != "none" && "$RUN_SOURCE_CHANGED" != "yes" && "$ACTIVE_HANDOFF_NOOP_ALLOWED" != "yes" ]]; then
        FINAL_STATUS="BLOCKED=yes"
        STOP_REASON="${ACTIVE_HANDOFF_MODE}_handover_noop_disallowed"
        exit 2
      fi
      FINAL_STATUS="AUTONOMOUS_GOAL_COMPLETE=yes"
      STOP_REASON="goal_complete"
      exit 0
      ;;
    BLOCKED=yes)
      FINAL_STATUS="BLOCKED=yes"
      STOP_REASON="blocked_by_cycle_${CYCLES_ATTEMPTED}"
      exit 2
      ;;
    CONTINUE_REQUIRED=yes)
      FINAL_STATUS="CONTINUE_REQUIRED=yes"
      STOP_REASON="continuing"
      ;;
  esac
done
