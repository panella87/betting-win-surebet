#!/usr/bin/env bash
# Canonical no-service private paper-evaluation controller for betting-win-surebet.
# Default duration: 72h. This repo has no paper service lifecycle; evaluation is one repo-local fixture/pinned-bundle pass only.
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
AUTOMATION_REPO_ROOT="$SCRIPT_DIR"
# shellcheck source=.automation/lib/run_common.sh
. "$SCRIPT_DIR/.automation/lib/run_common.sh"
# shellcheck source=.automation/lib/controller_hardening_v2.sh
. "$SCRIPT_DIR/.automation/lib/controller_hardening_v2.sh"
# shellcheck source=.automation/lib/telegram_notify.sh
. "$SCRIPT_DIR/.automation/lib/telegram_notify.sh"

DURATION_SECONDS="$(automation_parse_duration_seconds 72h)"
INTERVAL_SECONDS=""
ADAPTIVE=0
KEEP_MONITORING_WHEN_READY=0
STATUS_ONLY=0
FORCE_UNLOCK=0
CHECK_ONLY=0
PRINT_CONFIG=0
AUTO_INSTALL=0
ALLOW_PARALLEL=0
FINISHED=0
EXIT_STATUS=0
STOP_REASON="not_started"
FINAL_STATUS="not_started"
CYCLES_ATTEMPTED=0
LOCK_ACQUIRED=0
REPO_DIR_OVERRIDE=""
CODEX_PHASE_TIMEOUT_SECONDS=""
VALIDATION_TIMEOUT_SECONDS=""
INSTALL_TIMEOUT_SECONDS=""
MAX_CYCLES=""
CODEX_MODEL=""
CODEX_FALLBACK_MODEL=""
CODEX_SANDBOX=""
CODEX_STREAM_LOGS=""
PAPER_COMMAND_TIMEOUT_SECONDS=""
PINNED_BUNDLE_PATH="${SUREBET_PINNED_BUNDLE:-}"
REQUIRE_PINNED_BUNDLE="${SUREBET_REQUIRE_PINNED_BUNDLE-0}"
LOCAL_FIXTURE_BUNDLE="tests/fixtures/private-paper-mode-smoke/accepted-local-bundle.json"
PAPER_LOCAL_REPORT_PATH=""
PAPER_PINNED_REPORT_PATH=""
INITIAL_SOURCE_FINGERPRINT=""
FINAL_SOURCE_FINGERPRINT=""
SCRIPT_VERSION="2026-07-15.surebet-v8-atomic-child-result"
SCRIPT_NAME="run-paper-evaluation.sh"
ZIP_TIMEOUT_SECONDS=""
PAPER_HANDOFF_FILE=""
PAPER_HANDOFF_FINGERPRINT=""
ARTIFACT_PACKAGING_EXIT_STATUS=0
LOCK_RELEASE_STATUS="not_attempted"
LOCK_RELEASE_EXIT_CODE=0
LOCK_PRESERVED="no"

usage() {
  cat <<'EOF_USAGE'
Usage:
  ./run-paper-evaluation.sh [options]

Primary options:
  --duration VALUE               Maximum controller budget. Default: 72h. This no-service controller still performs one pass.
  --interval VALUE               Compatibility cadence value; no waiting occurs in single-pass mode.
  --adaptive                     Compatibility flag. This no-service repo does not delegate wait intervals to Codex.
  --keep-monitoring-when-ready   Accepted for compatibility; no service monitoring is performed in this repo.
  --model MODEL                  Override the Codex model for any future paper handoff/audit integration. Use cli-default for profile default.
  --fallback-model MODEL         Fallback model selector. Use none to disable fallback.
  --repo-dir PATH                Override repository path.

Controller behavior:
  --check-only                   Run preflight validation only. No private report write, no Codex phase.
  --status                       Show the current paper-controller lock state and exit.
  --force-unlock                 Terminate only a verified repo-scoped paper controller lock owner, remove the lock, and exit.
  --auto-install                 Permit one npm install --ignore-scripts when node_modules is absent.
  --max-cycles N                 Accepted canonical option. No-service surebet evaluation completes in one cycle.
  --sandbox MODE                 read-only, workspace-write, or danger-full-access.
  --codex-phase-timeout VALUE    Accepted canonical option for handoff parity. Alias: --codex-timeout.
  --codex-timeout VALUE          Alias for --codex-phase-timeout.
  --validation-timeout VALUE     Maximum duration of local validation commands.
  --install-timeout VALUE        Maximum optional dependency-install duration.
  --zip-timeout VALUE            Maximum final artifacts.zip creation duration. Default: 10m.
  --print-config                 Print effective configuration and exit.
  --stream                       Stream Codex output if future paper audit integration uses Codex.
  --no-stream                    Do not stream Codex output.
  -h, --help                     Show this help.

Environment:
  SUREBET_PINNED_BUNDLE=inputs/pinned-bundles/betting-win-export.json
  SUREBET_REQUIRE_PINNED_BUNDLE=1   # accepted values: unset, 0, or 1

Surebet behavior:
  - Validates any supplied pinned-bundle path before creating a run or starting expensive validation.
  - Accepts only an existing, regular, non-symlink, repo-local .json pinned bundle.
  - Validates the repo and hard no-provider/no-execution/no-direct-DB boundaries.
  - Runs one repo-local private fixture paper smoke.
  - Runs pinned-bundle smoke only when SUREBET_PINNED_BUNDLE is explicitly provided.
  - Executes known Node commands as direct argv, never through shell-constructed command text.
  - Verifies that source and protected automation files remain unchanged.
  - Writes .automation/paper-mode-to-autonomous-implementation.env only for source/validation defects.
  - Does not start, stop, refresh, poll, or mutate any service.
  - Does not source nvm.sh; root run scripts inherit the active parent-shell Node runtime.
  - Does not call providers, read betting-win DBs, place orders, mutate .env, or claim live/paper readiness.

Exit codes:
  0 = check-only passed, private fixture smoke accepted, or pinned bundle accepted into private report.
  1 = controller/setup/local preflight failure before classified paper state.
  2 = blocked by invalid pinned bundle, safety, validation, tooling, source mutation, or source-fix requirement.
  3 = duration/max-cycle elapsed while continuation remains required.
  130 = interrupted.
EOF_USAGE
}

model_display() { if [[ -z "${CODEX_MODEL:-}" || "${CODEX_MODEL:-}" == "cli-default" ]]; then printf 'cli-default'; else printf '%s' "$CODEX_MODEL"; fi; }
fallback_display() { if [[ -z "${CODEX_FALLBACK_MODEL:-}" ]]; then printf 'none'; else printf '%s' "$CODEX_FALLBACK_MODEL"; fi; }
parse_positive_integer() { local value="$1" label="$2"; [[ "$value" =~ ^[1-9][0-9]*$ ]] || { echo "ERROR: $label requires a positive integer: $value" >&2; return 2; }; }

validate_surebet_require_pinned_bundle() {
  case "${REQUIRE_PINNED_BUNDLE:-0}" in
    0|1) return 0 ;;
    *)
      echo "ERROR: SUREBET_REQUIRE_PINNED_BUNDLE must be unset, 0, or 1; got: ${REQUIRE_PINNED_BUNDLE}" >&2
      return 2
      ;;
  esac
}

validate_pinned_bundle_preflight() {
  local normalized
  if [[ -z "${PINNED_BUNDLE_PATH:-}" ]]; then
    if [[ "$REQUIRE_PINNED_BUNDLE" == "1" ]]; then
      echo "ERROR: SUREBET_REQUIRE_PINNED_BUNDLE=1 requires SUREBET_PINNED_BUNDLE to name an existing repo-local JSON file" >&2
      return 2
    fi
    return 0
  fi

  automation_require_command python3
  normalized="$(python3 - "$AUTOMATION_REPO_ROOT" "$PINNED_BUNDLE_PATH" <<'PY'
from __future__ import annotations

import os
from pathlib import Path
import stat
import sys

repo = Path(sys.argv[1]).resolve(strict=True)
raw = sys.argv[2]

def fail(message: str) -> None:
    print(f"ERROR: SUREBET_PINNED_BUNDLE {message}; got: {raw}", file=sys.stderr)
    raise SystemExit(2)

if not raw:
    fail("must not be empty")
if any(ord(char) < 32 or ord(char) == 127 for char in raw):
    fail("must not contain control characters")
if "://" in raw or raw.startswith(("file:", "http:", "https:")):
    fail("must be a repo-local path, not a URL")

supplied = Path(raw)
candidate = supplied if supplied.is_absolute() else repo / supplied
lexical = Path(os.path.abspath(os.path.normpath(str(candidate))))
try:
    relative = lexical.relative_to(repo)
except ValueError:
    fail("must stay inside the repository")

current = repo
for part in relative.parts:
    current = current / part
    try:
        metadata = os.lstat(current)
    except FileNotFoundError:
        fail("must point to an existing file")
    if stat.S_ISLNK(metadata.st_mode):
        fail("must not contain symlink path components")

metadata = os.lstat(lexical)
if not stat.S_ISREG(metadata.st_mode):
    fail("must point to a regular file")
if lexical.suffix.lower() != ".json":
    fail("must use a .json filename")
resolved = lexical.resolve(strict=True)
try:
    resolved_relative = resolved.relative_to(repo)
except ValueError:
    fail("must resolve inside the repository")
print(resolved_relative.as_posix())
PY
)" || return $?
  PINNED_BUNDLE_PATH="$normalized"
}

parse_args() {
  local parsed
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --duration|--run-duration) [[ $# -ge 2 ]] || { echo "ERROR: $1 requires a value" >&2; return 2; }; parsed="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid $1: $2" >&2; return 2; }; DURATION_SECONDS="$parsed"; shift 2 ;;
      --duration=*|--run-duration=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid duration: ${1#*=}" >&2; return 2; }; DURATION_SECONDS="$parsed"; shift ;;
      --interval|--check-interval) [[ $# -ge 2 ]] || { echo "ERROR: $1 requires a value" >&2; return 2; }; parsed="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid $1: $2" >&2; return 2; }; INTERVAL_SECONDS="$parsed"; shift 2 ;;
      --interval=*|--check-interval=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid interval: ${1#*=}" >&2; return 2; }; INTERVAL_SECONDS="$parsed"; shift ;;
      --adaptive|--adaptive-interval) ADAPTIVE=1; shift ;;
      --no-adaptive|--no-adaptive-interval) ADAPTIVE=0; shift ;;
      --keep-monitoring-when-ready) KEEP_MONITORING_WHEN_READY=1; shift ;;
      --model) [[ $# -ge 2 ]] || { echo "ERROR: --model requires a value" >&2; return 2; }; CODEX_MODEL="$2"; shift 2 ;;
      --model=*) CODEX_MODEL="${1#*=}"; shift ;;
      --fallback-model) [[ $# -ge 2 ]] || { echo "ERROR: --fallback-model requires a value" >&2; return 2; }; CODEX_FALLBACK_MODEL="$2"; shift 2 ;;
      --fallback-model=*) CODEX_FALLBACK_MODEL="${1#*=}"; shift ;;
      --repo-dir) [[ $# -ge 2 ]] || { echo "ERROR: --repo-dir requires a value" >&2; return 2; }; REPO_DIR_OVERRIDE="$2"; shift 2 ;;
      --repo-dir=*) REPO_DIR_OVERRIDE="${1#*=}"; shift ;;
      --check-only) CHECK_ONLY=1; shift ;;
      --status) STATUS_ONLY=1; shift ;;
      --force-unlock) FORCE_UNLOCK=1; shift ;;
      --auto-install) AUTO_INSTALL=1; shift ;;
      --max-cycles) [[ $# -ge 2 ]] || { echo "ERROR: --max-cycles requires a value" >&2; return 2; }; parse_positive_integer "$2" --max-cycles || return 2; MAX_CYCLES="$2"; shift 2 ;;
      --max-cycles=*) parse_positive_integer "${1#*=}" --max-cycles || return 2; MAX_CYCLES="${1#*=}"; shift ;;
      --sandbox) [[ $# -ge 2 ]] || { echo "ERROR: --sandbox requires a value" >&2; return 2; }; CODEX_SANDBOX="$2"; shift 2 ;;
      --sandbox=*) CODEX_SANDBOX="${1#*=}"; shift ;;
      --codex-phase-timeout|--codex-timeout) [[ $# -ge 2 ]] || { echo "ERROR: $1 requires a value" >&2; return 2; }; parsed="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid $1: $2" >&2; return 2; }; CODEX_PHASE_TIMEOUT_SECONDS="$parsed"; shift 2 ;;
      --codex-phase-timeout=*|--codex-timeout=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid codex timeout: ${1#*=}" >&2; return 2; }; CODEX_PHASE_TIMEOUT_SECONDS="$parsed"; shift ;;
      --validation-timeout) [[ $# -ge 2 ]] || { echo "ERROR: --validation-timeout requires a value" >&2; return 2; }; parsed="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid --validation-timeout: $2" >&2; return 2; }; VALIDATION_TIMEOUT_SECONDS="$parsed"; shift 2 ;;
      --validation-timeout=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid validation timeout: ${1#*=}" >&2; return 2; }; VALIDATION_TIMEOUT_SECONDS="$parsed"; shift ;;
      --install-timeout) [[ $# -ge 2 ]] || { echo "ERROR: --install-timeout requires a value" >&2; return 2; }; parsed="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid --install-timeout: $2" >&2; return 2; }; INSTALL_TIMEOUT_SECONDS="$parsed"; shift 2 ;;
      --install-timeout=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid install timeout: ${1#*=}" >&2; return 2; }; INSTALL_TIMEOUT_SECONDS="$parsed"; shift ;;
      --zip-timeout) [[ $# -ge 2 ]] || { echo "ERROR: --zip-timeout requires a value" >&2; return 2; }; parsed="$(automation_parse_duration_seconds "$2")" || { echo "ERROR: invalid --zip-timeout: $2" >&2; return 2; }; ZIP_TIMEOUT_SECONDS="$parsed"; shift 2 ;;
      --zip-timeout=*) parsed="$(automation_parse_duration_seconds "${1#*=}")" || { echo "ERROR: invalid zip timeout: ${1#*=}" >&2; return 2; }; ZIP_TIMEOUT_SECONDS="$parsed"; shift ;;
      --print-config) PRINT_CONFIG=1; shift ;;
      --stream) CODEX_STREAM_LOGS=1; shift ;;
      --no-stream) CODEX_STREAM_LOGS=0; shift ;;
      --allow-parallel) ALLOW_PARALLEL=1; shift ;;
      -h|--help) usage; exit 0 ;;
      *) echo "ERROR: unknown option: $1" >&2; usage >&2; return 2 ;;
    esac
  done
}

configure_defaults() {
  if [[ -n "$REPO_DIR_OVERRIDE" ]]; then [[ -d "$REPO_DIR_OVERRIDE" ]] || { echo "ERROR: --repo-dir does not exist: $REPO_DIR_OVERRIDE" >&2; return 1; }; AUTOMATION_REPO_ROOT="$(cd "$REPO_DIR_OVERRIDE" && pwd -P)"; fi
  cd "$AUTOMATION_REPO_ROOT"
  automation_load_config
  PINNED_BUNDLE_PATH="${SUREBET_PINNED_BUNDLE:-${PINNED_BUNDLE_PATH:-}}"
  REQUIRE_PINNED_BUNDLE="${SUREBET_REQUIRE_PINNED_BUNDLE:-${REQUIRE_PINNED_BUNDLE:-0}}"
  validate_surebet_require_pinned_bundle || return 2
  INTERVAL_SECONDS="${INTERVAL_SECONDS:-$(automation_parse_duration_seconds "${PAPER_DEFAULT_INTERVAL:-30m}")}"
  VALIDATION_TIMEOUT_SECONDS="${VALIDATION_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_VALIDATION_TIMEOUT:-20m}")}"
  INSTALL_TIMEOUT_SECONDS="${INSTALL_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_INSTALL_TIMEOUT:-15m}")}"
  ZIP_TIMEOUT_SECONDS="${ZIP_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${AUTOMATION_ZIP_TIMEOUT:-10m}")}"
  CODEX_PHASE_TIMEOUT_SECONDS="${CODEX_PHASE_TIMEOUT_SECONDS:-$(automation_parse_duration_seconds "${CODEX_PHASE_TIMEOUT:-30m}")}"
  PAPER_COMMAND_TIMEOUT_SECONDS="$(automation_parse_duration_seconds "${PAPER_COMMAND_TIMEOUT:-20m}")"
  MAX_CYCLES="${MAX_CYCLES:-${AUTOMATION_PAPER_MAX_CYCLES:-1}}"
  CODEX_MODEL="${CODEX_MODEL:-${AUTOMATION_CODEX_MODEL:-}}"
  CODEX_FALLBACK_MODEL="${CODEX_FALLBACK_MODEL:-${AUTOMATION_CODEX_FALLBACK_MODEL:-}}"
  CODEX_SANDBOX="${CODEX_SANDBOX:-${AUTOMATION_CODEX_SANDBOX:-danger-full-access}}"
  CODEX_STREAM_LOGS="${CODEX_STREAM_LOGS:-${AUTOMATION_CODEX_STREAM_LOGS:-1}}"
  case "$CODEX_MODEL" in default|cli-default) CODEX_MODEL="" ;; esac
  case "$CODEX_FALLBACK_MODEL" in default|cli-default) CODEX_FALLBACK_MODEL="cli-default" ;; none|off|disabled) CODEX_FALLBACK_MODEL="" ;; esac
  case "$CODEX_SANDBOX" in read-only|workspace-write|danger-full-access) ;; *) echo "ERROR: unsupported sandbox: $CODEX_SANDBOX" >&2; return 2 ;; esac
  parse_positive_integer "$MAX_CYCLES" --max-cycles || return 2
  export AUTOMATION_CODEX_MODEL="$CODEX_MODEL" AUTOMATION_CODEX_FALLBACK_MODEL="$CODEX_FALLBACK_MODEL" AUTOMATION_CODEX_SANDBOX="$CODEX_SANDBOX" AUTOMATION_CODEX_STREAM_LOGS="$CODEX_STREAM_LOGS"
}

print_config() {
  cat <<EOF_CONFIG
controller=run-paper-evaluation.sh
controller_mode=single_pass_no_service
repo_dir=$AUTOMATION_REPO_ROOT
duration_seconds=$DURATION_SECONDS
duration_semantics=maximum_controller_budget_not_monitoring_runtime
interval_seconds=$INTERVAL_SECONDS
interval_semantics=workflow_compatibility_no_wait_in_single_pass_mode
adaptive=$ADAPTIVE
keep_monitoring_when_ready=$KEEP_MONITORING_WHEN_READY
validation_timeout_seconds=$VALIDATION_TIMEOUT_SECONDS
install_timeout_seconds=$INSTALL_TIMEOUT_SECONDS
zip_timeout_seconds=$ZIP_TIMEOUT_SECONDS
artifacts_zip_scope=full_artifacts_directory
final_artifacts_zip_refresh=post_lock_release_atomic
codex_phase_timeout_seconds=$CODEX_PHASE_TIMEOUT_SECONDS
paper_command_timeout_seconds=$PAPER_COMMAND_TIMEOUT_SECONDS
max_cycles=$MAX_CYCLES
model=$(model_display)
fallback_model=$(fallback_display)
sandbox=$CODEX_SANDBOX
stream_logs=$CODEX_STREAM_LOGS
auto_install=$AUTO_INSTALL
surebet_pinned_bundle=${PINNED_BUNDLE_PATH:-}
surebet_require_pinned_bundle=$REQUIRE_PINNED_BUNDLE
paper_service_lifecycle=none
canonical_paper_handoff_schema=1
atomic_paper_handoff=enabled
source_evidence_hash_verification=enabled
bounded_artifacts_zip=enabled
atomic_standalone_lock_acquisition=enabled
lock_acquisition_before_run_dir=enabled
lock_release_failure_classification=enabled
lock_preservation_on_release_failure=enabled
telegram_notify=${TELEGRAM_NOTIFY:-1}
EOF_CONFIG
}

assert_active_node_runtime() {
  automation_require_command node; automation_require_command npm
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

maybe_auto_install() { if [[ "$AUTO_INSTALL" != "1" ]]; then return 0; fi; if [[ -d "$AUTOMATION_REPO_ROOT/node_modules" ]]; then automation_log "auto_install=skipped node_modules_present"; return 0; fi; automation_run_shell_command "auto_install_npm_install" "npm install --ignore-scripts" "$INSTALL_TIMEOUT_SECONDS" "$AUTOMATION_RUN_DIR/auto-install.log"; }

capture_initial_source_state() {
  INITIAL_SOURCE_FINGERPRINT="$(automation_v2_source_tree_fingerprint "$AUTOMATION_REPO_ROOT")" || return 1
  printf 'source_fingerprint=%s\n' "$INITIAL_SOURCE_FINGERPRINT" > "$AUTOMATION_RUN_DIR/source-fingerprint-before.env"
  automation_snapshot_protected "$AUTOMATION_RUN_DIR/protected_before.sha256"
}

verify_paper_read_only_state() {
  local phase="$1"
  FINAL_SOURCE_FINGERPRINT="$(automation_v2_source_tree_fingerprint "$AUTOMATION_REPO_ROOT")" || return 1
  {
    printf 'phase=%s\n' "$phase"
    printf 'source_fingerprint_before=%s\n' "$INITIAL_SOURCE_FINGERPRINT"
    printf 'source_fingerprint_after=%s\n' "$FINAL_SOURCE_FINGERPRINT"
  } > "$AUTOMATION_RUN_DIR/source-state-${phase}.env"
  if [[ -z "$INITIAL_SOURCE_FINGERPRINT" || "$INITIAL_SOURCE_FINGERPRINT" != "$FINAL_SOURCE_FINGERPRINT" ]]; then
    automation_log "paper_source_mutation_detected phase=$phase"
    FINAL_STATUS="PAPER_EVALUATION_BLOCKED_SOURCE_MUTATION"
    STOP_REASON="paper_source_mutation_detected_${phase}"
    return 1
  fi
  if ! AUTOMATION_ALLOW_PROTECTED_CHANGES=0 automation_check_protected_unchanged \
      "$AUTOMATION_RUN_DIR/protected_before.sha256" \
      "$AUTOMATION_RUN_DIR/protected_after.sha256" \
      "$AUTOMATION_RUN_DIR/protected_diff.patch"; then
    FINAL_STATUS="PAPER_EVALUATION_BLOCKED_SOURCE_MUTATION"
    STOP_REASON="paper_protected_file_mutation_detected_${phase}"
    return 1
  fi
  return 0
}

rotate_stale_paper_handoff() {
  local stale_dir destination
  PAPER_HANDOFF_FILE="$AUTOMATION_REPO_ROOT/.automation/paper-mode-to-autonomous-implementation.env"
  [[ -e "$PAPER_HANDOFF_FILE" ]] || return 0
  [[ -f "$PAPER_HANDOFF_FILE" && ! -L "$PAPER_HANDOFF_FILE" ]] || {
    echo "ERROR: existing paper handoff must be a non-symlink regular file: $PAPER_HANDOFF_FILE" >&2
    return 2
  }
  stale_dir="$AUTOMATION_REPO_ROOT/.automation/corrupt"
  mkdir -p "$stale_dir"
  destination="$stale_dir/$(basename "$PAPER_HANDOFF_FILE").$(date -u +%Y%m%dT%H%M%SZ).stale"
  mv -- "$PAPER_HANDOFF_FILE" "$destination"
  automation_log "stale_paper_handoff_rotated path=$destination"
}

write_paper_mode_handoff() {
  local reason="$1" evidence_dir="$2" blocker_family="${3:-source}" automation_maintenance="${4:-no}" expected_exit_code="${5:-2}"
  local allowed_protected_files="${6:-none}" final_dir evidence_abs evidence_rel evidence_file evidence_hash source_run_id

  PAPER_HANDOFF_FILE="$AUTOMATION_REPO_ROOT/.automation/paper-mode-to-autonomous-implementation.env"
  automation_v2_validate_yes_no_value PAPER_MODE_AUTOMATION_MAINTENANCE_ALLOWED "$automation_maintenance" || return 2
  case "$blocker_family" in validation|source|controller|artifact) ;; *) echo "ERROR: unsupported paper blocker family: $blocker_family" >&2; return 2 ;; esac
  [[ "$expected_exit_code" == "2" ]] || { echo "ERROR: paper implementation handoff must use final exit code 2" >&2; return 2; }
  if [[ "$automation_maintenance" == "yes" ]]; then
    [[ -n "$allowed_protected_files" && "$allowed_protected_files" != "none" ]] || { echo "ERROR: paper automation maintenance requires exact ALLOWED_PROTECTED_FILES" >&2; return 2; }
  else
    [[ -z "$allowed_protected_files" || "$allowed_protected_files" == "none" ]] || { echo "ERROR: paper allowlist is set while automation maintenance is disabled" >&2; return 2; }
    allowed_protected_files="none"
  fi

  evidence_abs="$(automation_v2_safe_repo_path "$AUTOMATION_REPO_ROOT" "$evidence_dir" yes)" || return 2
  [[ -d "$evidence_abs" && ! -L "$evidence_abs" ]] || { echo "ERROR: paper handoff evidence directory must be a non-symlink directory" >&2; return 2; }
  evidence_rel="${evidence_abs#$AUTOMATION_REPO_ROOT/}"
  source_run_id="$(basename "$AUTOMATION_RUN_DIR")"
  evidence_file="$evidence_abs/paper-implementation-handoff-evidence.md"
  {
    printf '# Paper implementation handoff evidence\n\n'
    printf 'source_run_id=%s\n' "$source_run_id"
    printf 'paper_final_status=%s\n' "$FINAL_STATUS"
    printf 'paper_stop_reason=%s\n' "$STOP_REASON"
    printf 'paper_final_exit_code=%s\n' "$expected_exit_code"
    printf 'handoff_reason=%s\n' "$reason"
    printf 'blocker_family=%s\n' "$blocker_family"
    printf 'source_fingerprint=%s\n' "$INITIAL_SOURCE_FINGERPRINT"
    printf 'evidence_directory=%s\n' "$evidence_rel"
    printf 'validation_required=npm_run_validate\n'
  } > "$evidence_file"
  evidence_hash="$(automation_v2_sha256_file "$evidence_file")" || return 2
  evidence_rel="${evidence_file#$AUTOMATION_REPO_ROOT/}"

  final_dir="$AUTOMATION_RUN_DIR/final"
  mkdir -p "$AUTOMATION_REPO_ROOT/.automation" "$final_dir"
  automation_v2_write_env_atomic "$PAPER_HANDOFF_FILE" \
    "HANDOVER_SCHEMA_VERSION=1" \
    "HANDOVER_KIND=paper-mode-to-autonomous-implementation" \
    "REPOSITORY=${AUTOMATION_REPO_NAME:-betting-win-surebet}" \
    "CONTROLLER=$SCRIPT_NAME" \
    "SOURCE_RUN_ID=$source_run_id" \
    "RUN_AUTONOMOUS_IMPLEMENTATION_NEXT=yes" \
    "AUTONOMOUS_IMPLEMENTATION_EXPECTED_FLAG=--handover-paper-mode" \
    "PAPER_MODE_FINAL_STATUS=$FINAL_STATUS" \
    "PAPER_MODE_STOP_REASON=$STOP_REASON" \
    "PAPER_MODE_FINAL_EXIT_CODE=$expected_exit_code" \
    "PAPER_MODE_RESUME_AFTER_IMPLEMENTATION=yes" \
    "PAPER_MODE_NOOP_SUCCESS_ALLOWED=no" \
    "PAPER_MODE_REQUIRED_ACTION=bounded_source_implementation" \
    "PAPER_MODE_BLOCKER_FAMILY=$blocker_family" \
    "PAPER_MODE_EXPECTED_PRIVATE_PAPER_REEVALUATION_AFTER_SOURCE_CHANGE=yes" \
    "PAPER_MODE_AUTOMATION_MAINTENANCE_ALLOWED=$automation_maintenance" \
    "ALLOWED_PROTECTED_FILES=$allowed_protected_files" \
    "PAPER_SERVICE_SUPPORTED=0" \
    "SERVICE_REFRESH_REQUIRED=0" \
    "RUNTIME_EVIDENCE_REQUIRED=0" \
    "PINNED_BUNDLE_REQUIRED=$REQUIRE_PINNED_BUNDLE" \
    "SUREBET_PINNED_BUNDLE=${PINNED_BUNDLE_PATH:-}" \
    "HANDOFF_REASON=$reason" \
    "PAPER_SOURCE_FINGERPRINT=$INITIAL_SOURCE_FINGERPRINT" \
    "SOURCE_EVIDENCE_PATH=$evidence_rel" \
    "SOURCE_EVIDENCE_SHA256=$evidence_hash" \
    "VALIDATION_REQUIRED=npm_run_validate" \
    "RUN_DIR=$AUTOMATION_RUN_DIR" \
    "WRITTEN_AT=$(automation_now_iso)"
  PAPER_HANDOFF_FINGERPRINT="$(automation_v2_add_or_verify_fingerprint "$PAPER_HANDOFF_FILE")" || return 2
  automation_v2_atomic_copy "$PAPER_HANDOFF_FILE" "$final_dir/paper-mode-to-autonomous-implementation.env" || return 2
  automation_log "paper_handoff_written schema=1 fingerprint=$PAPER_HANDOFF_FINGERPRINT evidence_sha256=$evidence_hash"
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
  mkdir -p "$AUTOMATION_RUN_DIR/final"
  {
    printf '# Paper evaluation final summary\n\n'
    printf 'script_version=%s\n' "$SCRIPT_VERSION"
    printf 'final_status=%s\n' "$FINAL_STATUS"
    printf 'stop_reason=%s\n' "$STOP_REASON"
    printf 'exit_status=%s\n' "$EXIT_STATUS"
    printf 'cycles_attempted=%s\n' "$CYCLES_ATTEMPTED"
    printf 'controller_mode=single_pass_no_service\n'
    printf 'duration_seconds=%s\n' "$DURATION_SECONDS"
    printf 'duration_semantics=maximum_controller_budget_not_monitoring_runtime\n'
    printf 'interval_seconds=%s\n' "$INTERVAL_SECONDS"
    printf 'interval_semantics=workflow_compatibility_no_wait_in_single_pass_mode\n'
    printf 'adaptive=%s\n' "$ADAPTIVE"
    printf 'keep_monitoring_when_ready=%s\n' "$KEEP_MONITORING_WHEN_READY"
    printf 'local_fixture_report=%s\n' "${PAPER_LOCAL_REPORT_PATH:-}"
    printf 'pinned_bundle_report=%s\n' "${PAPER_PINNED_REPORT_PATH:-}"
    printf 'surebet_pinned_bundle=%s\n' "${PINNED_BUNDLE_PATH:-}"
    printf 'source_fingerprint_before=%s\n' "${INITIAL_SOURCE_FINGERPRINT:-}"
    printf 'source_fingerprint_after=%s\n' "${FINAL_SOURCE_FINGERPRINT:-}"
    printf 'paper_handoff_fingerprint=%s\n' "${PAPER_HANDOFF_FINGERPRINT:-none}"
    printf 'zip_timeout_seconds=%s\n' "$ZIP_TIMEOUT_SECONDS"
    printf 'artifacts_zip_exit_status=%s\n' "$ARTIFACT_PACKAGING_EXIT_STATUS"
    if [[ "$LOCK_RELEASE_STATUS" != "not_attempted" ]]; then
      printf 'lock_release_status=%s\n' "$LOCK_RELEASE_STATUS"
      printf 'lock_release_exit_code=%s\n' "$LOCK_RELEASE_EXIT_CODE"
      printf 'lock_preserved=%s\n' "$LOCK_PRESERVED"
      printf 'lock_file=%s\n' "${AUTOMATION_LOCK_FILE:-none}"
    fi
    printf 'paper_service_lifecycle=none\n'
    printf 'completed_at=%s\n' "$(automation_now_iso)"
  } > "$AUTOMATION_RUN_DIR/final-summary.md"
  cp "$AUTOMATION_RUN_DIR/final-summary.md" "$AUTOMATION_RUN_DIR/final/final-summary.md" 2>/dev/null || true
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
  FINAL_STATUS="PAPER_EVALUATION_BLOCKED_CHILD_RESULT_PUBLICATION"
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
  local rc="${1:-$?}" zip_rc=0 lock_rc=0 corrective_zip_rc=0
  [[ "$FINISHED" == "1" ]] && return 0
  FINISHED=1
  trap - EXIT INT TERM
  if [[ "$FINAL_STATUS" == "not_started" ]]; then
    FINAL_STATUS="setup_failed"
    STOP_REASON="unexpected_exit_before_start"
  elif [[ "$rc" != "0" && "$STOP_REASON" == "not_started" ]]; then
    FINAL_STATUS="PAPER_EVALUATION_BLOCKED_CONTROLLER_FAILURE"
    STOP_REASON="unexpected_controller_exit"
  fi
  EXIT_STATUS="$rc"

  if [[ -n "${AUTOMATION_RUN_DIR:-}" ]]; then
    if [[ -z "$FINAL_SOURCE_FINGERPRINT" ]]; then
      FINAL_SOURCE_FINGERPRINT="$(automation_v2_source_tree_fingerprint "$AUTOMATION_REPO_ROOT" 2>/dev/null || true)"
    fi
    write_final_summary || true
    automation_collect_repo_snapshot "$AUTOMATION_RUN_DIR/final-repo-snapshot" || true
    set +e
    build_artifacts_zip_bounded
    zip_rc=$?
    set -e
    ARTIFACT_PACKAGING_EXIT_STATUS="$zip_rc"
    if [[ "$zip_rc" != "0" && "$EXIT_STATUS" == "0" ]]; then
      FINAL_STATUS="PAPER_EVALUATION_BLOCKED_ARTIFACT_PACKAGING"
      STOP_REASON="artifacts_zip_failed"
      EXIT_STATUS=2
      write_final_summary || true
    fi
  fi

  set +e
  attempt_final_lock_release
  lock_rc=$?
  set -e
  if [[ "$lock_rc" != "0" ]]; then
    FINAL_STATUS="PAPER_EVALUATION_BLOCKED_LOCK_RELEASE"
    STOP_REASON="lock_release_failed_lock_preserved"
    EXIT_STATUS=2
    if [[ -n "${AUTOMATION_RUN_DIR:-}" ]]; then
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
      FINAL_STATUS="PAPER_EVALUATION_BLOCKED_ARTIFACT_PACKAGING"
      STOP_REASON="artifacts_zip_failed"
      EXIT_STATUS=2
      ARTIFACT_PACKAGING_EXIT_STATUS="$corrective_zip_rc"
      write_final_summary || true
    fi
  fi

  publish_parent_child_result

  if [[ -n "${AUTOMATION_RUN_DIR:-}" ]]; then
    telegram_notify_send_final "run-paper-evaluation.sh" "${AUTOMATION_REPO_NAME:-betting-win-surebet}" "$FINAL_STATUS" "$STOP_REASON" "$CYCLES_ATTEMPTED" "$EXIT_STATUS" "$AUTOMATION_RUN_DIR" "$AUTOMATION_CONTROLLER_LOG" "$AUTOMATION_REPO_ROOT" || true
  fi
  printf 'run_dir=%s\n' "${AUTOMATION_RUN_DIR:-}"
  printf 'final_status=%s\n' "$FINAL_STATUS"
  printf 'stop_reason=%s\n' "$STOP_REASON"
  printf 'final_exit_code=%s\n' "$EXIT_STATUS"
  printf 'cycles_completed=%s\n' "$CYCLES_ATTEMPTED"
  printf 'paper_result=%s\n' "$FINAL_STATUS"
  printf 'lock_release_status=%s\n' "$LOCK_RELEASE_STATUS"
  printf 'lock_release_exit_code=%s\n' "$LOCK_RELEASE_EXIT_CODE"
  printf 'lock_preserved=%s\n' "$LOCK_PRESERVED"
  exit "$EXIT_STATUS"
}

on_signal() {
  FINAL_STATUS="interrupted"
  STOP_REASON="interrupted"
  exit 130
}

run_repo_validation() {
  local out_dir
  out_dir="$1"
  mkdir -p "$out_dir"
  automation_run_shell_command "repo_validation" "npm run validate" "$VALIDATION_TIMEOUT_SECONDS" "$out_dir/npm-run-validate.log"
}

run_private_fixture_smoke() {
  local cycle_dir stamp out_rel rc verify_log
  local -a cmd
  cycle_dir="$1"
  stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  out_rel="artifacts/private-paper-mode/standard-paper-evaluation-${stamp}.report.json"
  PAPER_LOCAL_REPORT_PATH="$out_rel"
  cmd=(node cli.js local-report --bundle "$LOCAL_FIXTURE_BUNDLE" --output "$out_rel")
  automation_quote_argv "${cmd[@]}" > "$cycle_dir/local-fixture-command.txt"
  automation_run_argv_command "private_fixture_smoke" "$PAPER_COMMAND_TIMEOUT_SECONDS" "$cycle_dir/local-fixture-smoke.log" "${cmd[@]}" || return 1
  verify_log="$cycle_dir/local-fixture-artifact-validation.log"
  node - "$out_rel" > "$verify_log" 2>&1 <<'NODE'
const { readFileSync } = require('node:fs');
const report = JSON.parse(readFileSync(process.argv[2], 'utf8'));
if (report.accepted !== false) throw new Error('private fixture report must keep accepted=false');
if (report.status !== 'fixture_results_only') throw new Error(`unexpected private fixture status: ${report.status}`);
if (!Array.isArray(report.candidateReports) || report.candidateReports.length < 1) throw new Error('private fixture report must include candidateReports');
console.log('private_fixture_report_validated=yes');
NODE
  rc=$?
  [[ "$rc" -eq 0 ]] || { automation_log "private_fixture_artifact_validation_failed log=$verify_log"; return 1; }
}

run_pinned_bundle_smoke() {
  local cycle_dir stamp out_rel rc verify_log
  local -a cmd
  cycle_dir="$1"
  stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  out_rel="artifacts/private-paper-mode/pinned-interface-smoke-${stamp}.report.json"
  PAPER_PINNED_REPORT_PATH="$out_rel"
  cmd=(node cli.js local-report --bundle "$PINNED_BUNDLE_PATH" --output "$out_rel" --pinned-intake)
  automation_quote_argv "${cmd[@]}" > "$cycle_dir/pinned-bundle-command.txt"
  automation_run_argv_command "pinned_bundle_smoke" "$PAPER_COMMAND_TIMEOUT_SECONDS" "$cycle_dir/pinned-bundle-smoke.log" "${cmd[@]}" || return 1
  verify_log="$cycle_dir/pinned-bundle-artifact-validation.log"
  node - "$out_rel" > "$verify_log" 2>&1 <<'NODE'
const { readFileSync } = require('node:fs');
const report = JSON.parse(readFileSync(process.argv[2], 'utf8'));
if (report.accepted !== false) throw new Error('pinned bundle report must keep accepted=false');
if (report.status !== 'fixture_results_only') throw new Error(`unexpected pinned bundle private report status: ${report.status}`);
if (!Array.isArray(report.candidateReports)) throw new Error('pinned bundle report must include candidateReports');
console.log('pinned_bundle_report_validated=yes');
NODE
  rc=$?
  [[ "$rc" -eq 0 ]] || { automation_log "pinned_bundle_artifact_validation_failed log=$verify_log"; return 1; }
}

parse_args "$@" || exit 1
configure_defaults || exit 1
LOCK_FILE="$AUTOMATION_REPO_ROOT/.automation/locks/run-paper-evaluation.lock"
if [[ "$STATUS_ONLY" == "1" ]]; then automation_status_lock "$LOCK_FILE"; exit 0; fi
if [[ "$FORCE_UNLOCK" == "1" ]]; then automation_force_unlock "$LOCK_FILE" "$SCRIPT_NAME" "$AUTOMATION_REPO_ROOT"; exit 0; fi
if [[ "$PRINT_CONFIG" == "1" ]]; then print_config; exit 0; fi
validate_pinned_bundle_preflight || exit 2
trap 'finish $?' EXIT
trap on_signal INT TERM
AUTOMATION_SCRIPT_COMMAND="$0 $*"
if [[ "$ALLOW_PARALLEL" == "1" ]]; then
  automation_log "lock=skipped allow_parallel=1"
else
  automation_acquire_lock "$SCRIPT_NAME" "$AUTOMATION_REPO_ROOT"
  LOCK_ACQUIRED=1
fi
automation_create_run_dir "paper_evaluation"
if [[ "$LOCK_ACQUIRED" == "1" ]]; then
  automation_write_lock_file
  automation_start_heartbeat
fi
rotate_stale_paper_handoff || { FINAL_STATUS="setup_failed"; STOP_REASON="stale_handoff_rotation_failed"; exit 2; }
assert_active_node_runtime || { FINAL_STATUS="setup_failed"; STOP_REASON="node_runtime_invalid"; exit 1; }
automation_collect_repo_snapshot "$AUTOMATION_RUN_DIR/initial-repo-snapshot"
capture_initial_source_state || { FINAL_STATUS="setup_failed"; STOP_REASON="source_fingerprint_failed"; exit 1; }
maybe_auto_install || { FINAL_STATUS="setup_failed"; STOP_REASON="auto_install_failed"; exit 1; }
if [[ "$CHECK_ONLY" == "1" ]]; then
  automation_log "check_only=1"
  if ! run_repo_validation "$AUTOMATION_RUN_DIR/check-only-validation"; then FINAL_STATUS="PAPER_EVALUATION_BLOCKED_REPO_VALIDATION_FAILED"; STOP_REASON="check_only_validation_failed"; verify_paper_read_only_state check_only_failed || true; exit 1; fi
  verify_paper_read_only_state check_only || exit 2
  FINAL_STATUS="check_only_complete"
  STOP_REASON="check_only"
  exit 0
fi

CYCLES_ATTEMPTED=1
CYCLE_DIR="$AUTOMATION_RUN_DIR/cycles/cycle_1"
mkdir -p "$CYCLE_DIR"
{
  printf 'cycle=1\n'
  printf 'controller_mode=single_pass_no_service\n'
  printf 'paper_service_lifecycle=none\n'
  printf 'adaptive_requested=%s\n' "$ADAPTIVE"
  printf 'keep_monitoring_when_ready=%s\n' "$KEEP_MONITORING_WHEN_READY"
  printf 'pinned_bundle=%s\n' "${PINNED_BUNDLE_PATH:-}"
  printf 'require_pinned_bundle=%s\n' "$REQUIRE_PINNED_BUNDLE"
  printf 'started_at=%s\n' "$(automation_now_iso)"
} > "$CYCLE_DIR/paper_health_packet.md"
automation_log "paper_cycle_start cycle=1 service_lifecycle=none"
if ! run_repo_validation "$CYCLE_DIR/source-validation"; then
  FINAL_STATUS="PAPER_EVALUATION_BLOCKED_REPO_VALIDATION_FAILED"
  STOP_REASON="repo_validation_failed"
  if ! verify_paper_read_only_state repo_validation_failed; then exit 2; fi
  write_paper_mode_handoff "repo_validation_failed" "$CYCLE_DIR/source-validation" "validation" "no" "2" "none" || {
    FINAL_STATUS="PAPER_EVALUATION_BLOCKED_HANDOFF_WRITE_FAILED"
    STOP_REASON="paper_handoff_write_failed_after_repo_validation"
  }
  exit 2
fi
if ! run_private_fixture_smoke "$CYCLE_DIR"; then
  FINAL_STATUS="PAPER_EVALUATION_BLOCKED_SOURCE_FIX_REQUIRED"
  STOP_REASON="private_fixture_smoke_failed"
  if ! verify_paper_read_only_state private_fixture_failed; then exit 2; fi
  write_paper_mode_handoff "private_fixture_smoke_failed" "$CYCLE_DIR" "source" "no" "2" "none" || {
    FINAL_STATUS="PAPER_EVALUATION_BLOCKED_HANDOFF_WRITE_FAILED"
    STOP_REASON="paper_handoff_write_failed_after_fixture_smoke"
  }
  exit 2
fi
if [[ -z "${PINNED_BUNDLE_PATH:-}" ]]; then
  verify_paper_read_only_state private_fixture_only || exit 2
  if [[ "$REQUIRE_PINNED_BUNDLE" == "1" ]]; then
    FINAL_STATUS="PAPER_EVALUATION_BLOCKED_INVALID_PINNED_BUNDLE"
    STOP_REASON="surebet_pinned_bundle_required_but_missing"
    automation_log "$STOP_REASON"
    exit 2
  fi
  FINAL_STATUS="PAPER_EVALUATION_READY_PRIVATE_FIXTURE_ONLY_BLOCKED_ON_PINNED_BUNDLE"
  STOP_REASON="private_fixture_only_blocked_on_pinned_bundle"
  automation_log "paper_result=$FINAL_STATUS"
  exit 0
fi
if ! run_pinned_bundle_smoke "$CYCLE_DIR"; then
  FINAL_STATUS="PAPER_EVALUATION_BLOCKED_INVALID_PINNED_BUNDLE"
  STOP_REASON="pinned_bundle_smoke_failed"
  if ! verify_paper_read_only_state pinned_bundle_failed; then exit 2; fi
  automation_log "$STOP_REASON"
  exit 2
fi
verify_paper_read_only_state pinned_bundle_complete || exit 2
FINAL_STATUS="PAPER_EVALUATION_PINNED_BUNDLE_ACCEPTED_PRIVATE_REPORT_WRITTEN"
STOP_REASON="pinned_bundle_private_report_written"
automation_log "paper_result=$FINAL_STATUS"
exit 0
