#!/usr/bin/env bash
# Shared Telegram completion notifier for repo automation controllers.
# Source this file and call telegram_notify_send_final. No polling is performed.

telegram_notify_message_version() {
  printf '%s\n' '20260712.pretty_v5_parent_lock_actions'
}

telegram_notify_env_file() {
  if [ -n "${TELEGRAM_ENV_FILE:-}" ]; then
    printf '%s\n' "$TELEGRAM_ENV_FILE"
    return 0
  fi
  if [ -n "${REPO_DIR:-}" ]; then
    printf '%s\n' "${REPO_DIR%/}/.env"
    return 0
  fi
  printf '%s\n' ".env"
}

telegram_notify_read_env_value() {
  local key="$1" env_file line value
  env_file="$(telegram_notify_env_file)"
  [ -f "$env_file" ] || return 1
  line="$(grep -E "^[[:space:]]*${key}=" "$env_file" 2>/dev/null | tail -n 1)" || return 1
  [ -n "$line" ] || return 1
  value="${line#*=}"
  value="${value%$'\r'}"
  value="${value#\"}"; value="${value%\"}"
  value="${value#\'}"; value="${value%\'}"
  printf '%s\n' "$value"
}

telegram_notify_read_setting() {
  local key="$1" env_value file_value
  env_value="${!key:-}"
  if [ -n "$env_value" ]; then
    printf '%s\n' "$env_value"
    return 0
  fi
  file_value="$(telegram_notify_read_env_value "$key")" || return 1
  [ -n "$file_value" ] || return 1
  printf '%s\n' "$file_value"
}

telegram_notify_configured() {
  local token chat
  [ "${TELEGRAM_NOTIFY:-1}" = "1" ] || return 1
  token="$(telegram_notify_read_setting TELEGRAM_BOT_TOKEN 2>/dev/null || true)"
  chat="$(telegram_notify_read_setting TELEGRAM_CHAT_ID 2>/dev/null || true)"
  [ -n "$token" ] && [ -n "$chat" ]
}

telegram_notify_is_status_file() {
  local log_file="${1:-}"
  [ -n "$log_file" ] || return 1
  [ "$(basename "$log_file")" = "telegram_notification_status.txt" ]
}

telegram_notify_log_payload() {
  local log_file="${1:-}" payload="${2:-}"
  if [ -n "$log_file" ]; then
    mkdir -p "$(dirname "$log_file")" 2>/dev/null || true
    if telegram_notify_is_status_file "$log_file"; then
      printf '%s\n' "$payload" > "$log_file" 2>/dev/null || true
    else
      printf '%s\n' "$payload" >> "$log_file" 2>/dev/null || true
    fi
  else
    printf '%s\n' "$payload" >&2
  fi
}

telegram_notify_log() {
  telegram_notify_log_payload "${1:-}" "${2:-}"
}

telegram_notify_html_escape() {
  local value="${1:-}" out="" ch i
  for ((i = 0; i < ${#value}; i += 1)); do
    ch="${value:i:1}"
    case "$ch" in
      '&') out+="&amp;" ;;
      '<') out+="&lt;" ;;
      '>') out+="&gt;" ;;
      '"') out+="&quot;" ;;
      *) out+="$ch" ;;
    esac
  done
  printf '%s' "$out"
}

telegram_notify_status_icon() {
  local status="${1:-}" final_rc="${2:-}" normalized
  normalized="$(printf '%s' "$status" | tr '[:lower:]' '[:upper:]')"
  case "$normalized" in
    TEST) printf '🧪' ;;
    PAPER_EVALUATION_READY_PRIVATE_FIXTURE_ONLY_BLOCKED_ON_PINNED_BUNDLE|PAPER_AUTOPILOT_BLOCKED_ON_PINNED_BUNDLE|*BLOCKED_ON_PINNED_BUNDLE*) printf '🛑' ;;
    BUGFIX_AUTOPILOT_COMPLETE|PAPER_AUTOPILOT_PINNED_BUNDLE_ACCEPTED_PRIVATE_REPORT_WRITTEN|PAPER_EVALUATION_PINNED_BUNDLE_ACCEPTED_PRIVATE_REPORT_WRITTEN|*CHECK_ONLY_COMPLETE*) printf '✅' ;;
    BUGFIX_AUTOPILOT_BUDGET_EXHAUSTED|*CONTINUE_REQUIRED*|*CONTINUE*|RUNNING) printf '🔁' ;;
    *TARGET_READY*|PAPER_EVALUATION_READY*|*GOAL_COMPLETE*|SUCCESS|PASS|OK|READY) printf '✅' ;;
    *NOT*READY*|*NO_GO*|*BLOCKED*|*FAILED*|*FAIL*|*ERROR*) printf '🛑' ;;
    *)
      if [ -n "$final_rc" ] && [ "$final_rc" != "0" ]; then
        printf '❌'
      else
        printf 'ℹ️'
      fi
      ;;
  esac
}

telegram_notify_status_text() {
  local status="${1:-}" final_rc="${2:-}" normalized icon
  normalized="$(printf '%s' "$status" | tr '[:lower:]' '[:upper:]')"
  icon="$(telegram_notify_status_icon "$status" "$final_rc")"
  case "$normalized" in
    TEST) printf '%s TEST' "$icon" ;;
    PAPER_EVALUATION_READY_PRIVATE_FIXTURE_ONLY_BLOCKED_ON_PINNED_BUNDLE|PAPER_AUTOPILOT_BLOCKED_ON_PINNED_BUNDLE|*BLOCKED_ON_PINNED_BUNDLE*) printf '%s BLOCKED' "$icon" ;;
    BUGFIX_AUTOPILOT_COMPLETE|PAPER_AUTOPILOT_PINNED_BUNDLE_ACCEPTED_PRIVATE_REPORT_WRITTEN|PAPER_EVALUATION_PINNED_BUNDLE_ACCEPTED_PRIVATE_REPORT_WRITTEN|*CHECK_ONLY_COMPLETE*) printf '%s SUCCESS' "$icon" ;;
    BUGFIX_AUTOPILOT_BUDGET_EXHAUSTED|*CONTINUE_REQUIRED*|*CONTINUE*|RUNNING) printf '%s CONTINUE' "$icon" ;;
    *TARGET_READY*|PAPER_EVALUATION_READY*|*GOAL_COMPLETE*|SUCCESS|PASS|OK|READY) printf '%s SUCCESS' "$icon" ;;
    *NOT*READY*|*NO_GO*|*BLOCKED*) printf '%s BLOCKED' "$icon" ;;
    *FAILED*|*FAIL*|*ERROR*) printf '%s FAILED' "$icon" ;;
    *) printf '%s %s' "$icon" "$status" ;;
  esac
}

telegram_notify_next_action() {
  local status="${1:-}" final_rc="${2:-}" normalized
  normalized="$(printf '%s' "$status" | tr '[:lower:]' '[:upper:]')"
  case "$normalized" in
    TEST) printf 'Telegram delivery and HTML formatting are verified.' ;;
    BUGFIX_AUTOPILOT_COMPLETE) printf 'Archive campaign_coverage.tsv and the final audit evidence; open new work only from an approved task.' ;;
    BUGFIX_AUTOPILOT_BUDGET_EXHAUSTED) printf 'Review campaign_coverage.tsv and the first unclosed area before starting a new campaign; automatic resume is not enabled.' ;;
    BUGFIX_AUTOPILOT_BLOCKED_AUDIT_CHILD) printf 'Inspect the latest audit child summary, request_flags.txt, and source-mutation evidence before rerunning the area.' ;;
    BUGFIX_AUTOPILOT_BLOCKED_IMPLEMENTATION_CHILD) printf 'Inspect the implementation child summary and validation output before another audit round.' ;;
    BUGFIX_AUTOPILOT_BLOCKED_IMPLEMENTATION_NOOP) printf 'Do not mark the confirmed bug fixed; inspect the implementation handoff, source-change claim, and validation evidence.' ;;
    BUGFIX_AUTOPILOT_BLOCKED_HANDOFF_MISMATCH) printf 'Compare the round child_result.env with the input and return handoffs; correct the schema, fingerprint, or evidence mismatch first.' ;;
    BUGFIX_AUTOPILOT_BLOCKED_REPEATED_HANDOFF) printf 'Review the repeated bug signature manually and change the implementation approach before restarting the campaign.' ;;
    BUGFIX_AUTOPILOT_BLOCKED_CHILD_IDENTITY) printf 'Inspect the preserved bugfix-parent lock and active-child process identity before using force-unlock.' ;;
    BUGFIX_AUTOPILOT_BLOCKED_LOCK_RELEASE) printf 'Inspect the bugfix-parent lock ownership and release evidence; do not start another controller until the preserved lock is resolved.' ;;
    BUGFIX_AUTOPILOT_BLOCKED_ARTIFACT_PACKAGING) printf 'The run evidence remains in its run directory; inspect the packaging log and repair artifacts.zip creation.' ;;
    PAPER_AUTOPILOT_BLOCKED_CHILD_IDENTITY) printf 'Inspect the preserved paper-parent lock and verify the active child process identity before using force-unlock.' ;;
    PAPER_AUTOPILOT_BLOCKED_LOCK_RELEASE) printf 'Inspect the paper-parent lock ownership and release evidence; do not start another controller until the preserved lock is resolved.' ;;
    PAPER_AUTOPILOT_BLOCKED_PAPER_SOURCE_MUTATION) printf 'Do not trust the paper result; inspect the paper child source diff and restore the read-only paper boundary.' ;;
    PAPER_AUTOPILOT_BLOCKED_IMPLEMENTATION_PARTIAL_SOURCE_CHANGE) printf 'Inspect the partial implementation run and validation state before launching another paper round.' ;;
    PAPER_AUTOPILOT_BLOCKED_HANDOFF_MISMATCH) printf 'Compare the paper or implementation handoff with child_result.env and its evidence hash before continuing.' ;;
    PAPER_AUTOPILOT_BLOCKED_PAPER_CHILD) printf 'Inspect the latest paper child summary and paper logs before retrying the campaign.' ;;
    PAPER_AUTOPILOT_BLOCKED_IMPLEMENTATION_CHILD) printf 'Inspect the implementation child summary, source diff, and validation output before retrying.' ;;
    PAPER_AUTOPILOT_BLOCKED_IMPLEMENTATION_NOOP) printf 'Do not re-run paper as if a fix landed; inspect why the implementation handoff produced no validated source change.' ;;
    PAPER_AUTOPILOT_BLOCKED_IMPLEMENTATION_HANDOVER_NOT_REFRESHABLE) printf 'Inspect the implementation return handoff and set re-evaluation only after a validated source change.' ;;
    PAPER_AUTOPILOT_BLOCKED_SAME_HANDOFF_REPEATED) printf 'Review the repeated semantic handoff manually and correct the unresolved root cause before restarting.' ;;
    PAPER_AUTOPILOT_BLOCKED_ARTIFACT_PACKAGING) printf 'The run evidence remains in its run directory; inspect the packaging log and repair artifacts.zip creation.' ;;
    PAPER_AUTOPILOT_PINNED_BUNDLE_ACCEPTED_PRIVATE_REPORT_WRITTEN|PAPER_EVALUATION_PINNED_BUNDLE_ACCEPTED_PRIVATE_REPORT_WRITTEN) printf 'Archive the private report and evidence; do not treat it as profitability, live-readiness, or execution approval.' ;;
    PAPER_AUTOPILOT_CHECK_ONLY_COMPLETE|*CHECK_ONLY_COMPLETE*) printf 'Validation-only checks passed; no paper-readiness or implementation claim was made.' ;;
    PAPER_EVALUATION_BLOCKED_LOCK_RELEASE) printf 'Inspect the preserved standalone paper lock and active-child identity before using verified force-unlock.' ;;
    PAPER_EVALUATION_BLOCKED_INVALID_PINNED_BUNDLE) printf 'Inspect the pinned-intake log and correct the repo-local upstream export; do not launch source implementation without a confirmed local defect.' ;;
    PAPER_EVALUATION_BLOCKED_REPO_VALIDATION_FAILED|PAPER_EVALUATION_BLOCKED_SOURCE_FIX_REQUIRED) printf 'Inspect the canonical paper-to-implementation handoff and validation evidence before running bounded source implementation.' ;;
    PAPER_EVALUATION_READY_PRIVATE_FIXTURE_ONLY_BLOCKED_ON_PINNED_BUNDLE|PAPER_AUTOPILOT_BLOCKED_ON_PINNED_BUNDLE|*BLOCKED_ON_PINNED_BUNDLE*) printf 'Do not treat private fixture proof as upstream readiness; provide a repo-local pinned betting-win export before real paper evaluation.' ;;
    *TARGET_READY*|PAPER_EVALUATION_READY*|*GOAL_COMPLETE*|SUCCESS|PASS|OK|READY) printf 'Archive the evidence and continue only with the approved next step.' ;;
    *CONTINUE_REQUIRED*|*CONTINUE*|RUNNING) printf 'Continue with the next controller step or scheduled evidence loop.' ;;
    *NOT*READY*|*NO_GO*|*BLOCKED*) printf 'Review the latest artifact, blocker ledger, or handoff before continuing.' ;;
    *FAILED*|*FAIL*|*ERROR*) printf 'Review the failed controller output and artifact summary.' ;;
    *)
      if [ -n "$final_rc" ] && [ "$final_rc" != "0" ]; then
        printf 'Review the failed controller output and artifact summary.'
      else
        printf 'Review the final artifact summary if needed.'
      fi
      ;;
  esac
}

telegram_notify_relative_run_dir() {
  local run_dir="${1:-}" repo_dir="${2:-}"
  if [ -n "$repo_dir" ]; then
    case "$run_dir" in "$repo_dir"/*) run_dir="${run_dir#"$repo_dir"/}" ;; esac
  fi
  printf '%s' "$run_dir"
}

telegram_notify_build_final_message() {
  local controller_name="$1" repo_slug="$2" final_status="$3" stop_reason="$4" cycles="$5" final_rc="$6" run_dir="$7" repo_dir="${8:-${REPO_DIR:-}}"
  local controller_html repo_html status_raw_html status_label_html stop_html cycles_html rc_html run_rel_html next_html finished_html version_html run_rel status_label

  run_rel="$(telegram_notify_relative_run_dir "$run_dir" "$repo_dir")"
  status_label="$(telegram_notify_status_text "$final_status" "$final_rc")"

  controller_html="$(telegram_notify_html_escape "$controller_name")"
  repo_html="$(telegram_notify_html_escape "$repo_slug")"
  status_raw_html="$(telegram_notify_html_escape "$final_status")"
  status_label_html="$(telegram_notify_html_escape "$status_label")"
  stop_html="$(telegram_notify_html_escape "$stop_reason")"
  cycles_html="$(telegram_notify_html_escape "$cycles")"
  rc_html="$(telegram_notify_html_escape "$final_rc")"
  run_rel_html="$(telegram_notify_html_escape "$run_rel")"
  next_html="$(telegram_notify_html_escape "$(telegram_notify_next_action "$final_status" "$final_rc")")"
  finished_html="$(telegram_notify_html_escape "$(date -u '+%Y-%m-%dT%H:%M:%SZ')")"
  version_html="$(telegram_notify_html_escape "$(telegram_notify_message_version)")"

  cat <<EOF_MESSAGE
<b>$(telegram_notify_status_icon "$final_status" "$final_rc") ${controller_html} finished</b>
━━━━━━━━━━━━━━━━━━━━
<b>📦 Repo</b>   <code>${repo_html}</code>
<b>📊 Status</b> <b>${status_label_html}</b> <code>${status_raw_html}</code>
<b>🧭 Stop</b>   <code>${stop_html}</code>
<b>🔁 Cycles</b> <code>${cycles_html}</code>
<b>🚪 Exit</b>   <code>${rc_html}</code>
<b>📁 Run</b>    <code>${run_rel_html}</code>
━━━━━━━━━━━━━━━━━━━━
<b>➡️ Next</b> ${next_html}
<i>UTC ${finished_html}</i>
<code>${version_html}</code>
EOF_MESSAGE
}

telegram_notify_send_final() {
  local controller_name="$1" repo_slug="$2" final_status="$3" stop_reason="$4" cycles="$5" final_rc="$6" run_dir="$7" controller_log="${8:-}" repo_dir="${9:-${REPO_DIR:-}}"
  local token chat message version

  [ "${TELEGRAM_NOTIFY:-1}" = "1" ] || return 0
  [ "${TELEGRAM_NOTIFICATION_SENT:-0}" = "0" ] || return 0
  TELEGRAM_NOTIFICATION_SENT=1
  version="$(telegram_notify_message_version)"

  command -v node >/dev/null 2>&1 || {
    telegram_notify_log "$controller_log" "telegram_notification=skipped node_missing message_version=${version}"
    return 0
  }

  token="$(telegram_notify_read_setting TELEGRAM_BOT_TOKEN 2>/dev/null || true)"
  chat="$(telegram_notify_read_setting TELEGRAM_CHAT_ID 2>/dev/null || true)"
  if [ -z "$token" ] || [ -z "$chat" ]; then
    telegram_notify_log "$controller_log" "telegram_notification=skipped missing_config message_version=${version}"
    return 0
  fi

  message="$(telegram_notify_build_final_message "$controller_name" "$repo_slug" "$final_status" "$stop_reason" "$cycles" "$final_rc" "$run_dir" "$repo_dir")"

  if [ "${TELEGRAM_NOTIFY_DRY_RUN:-0}" = "1" ]; then
    telegram_notify_log_payload "$controller_log" "telegram_notification=dry_run parse_mode=HTML message_version=${version}
telegram_notification_text_start
${message}
telegram_notification_text_end"
    return 0
  fi

  local telegram_node_output
  telegram_node_output="$(TELEGRAM_BOT_TOKEN="$token" \
  TELEGRAM_CHAT_ID="$chat" \
  TELEGRAM_TEXT="$message" \
  TELEGRAM_MESSAGE_VERSION="$version" \
  node <<'NODE' 2>&1 || true
(async () => {
  const token = process.env.TELEGRAM_BOT_TOKEN || '';
  const chatId = process.env.TELEGRAM_CHAT_ID || '';
  const text = process.env.TELEGRAM_TEXT || '';
  const version = process.env.TELEGRAM_MESSAGE_VERSION || 'unknown';
  const timeoutMs = 10000;
  if (!token || !chatId || !text) {
    console.log(`telegram_notification=skipped_missing_config message_version=${version}`);
    return;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    const raw = await response.text();
    if (!response.ok) {
      console.log(`telegram_notification=failed parse_mode=HTML message_version=${version} http_status=${response.status} body=${raw.slice(0, 180).replace(/\s+/g, ' ')}`);
      return;
    }
    console.log(`telegram_notification=sent parse_mode=HTML message_version=${version}`);
  } catch (error) {
    const reason = error && error.name === 'AbortError' ? 'timeout' : String((error && error.message) || error);
    console.log(`telegram_notification=failed parse_mode=HTML message_version=${version} reason=${reason}`);
  } finally {
    clearTimeout(timer);
  }
})();
NODE
)"
  telegram_notify_log_payload "$controller_log" "$telegram_node_output"
  return 0
}
