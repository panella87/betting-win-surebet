#!/usr/bin/env bash
# Shared Telegram completion notifier for repo automation controllers.
# Source this file and call telegram_notify_send_final. No polling is performed.

telegram_notify_message_version() {
  printf '%s\n' '20260706.pretty_v2_html_cards'
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
    *TARGET_READY*|PAPER_EVALUATION_READY*|*GOAL_COMPLETE*|SUCCESS|PASS|OK|READY) printf '✅' ;;
    *CONTINUE_REQUIRED*|*CONTINUE*|RUNNING) printf '🔁' ;;
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
    *TARGET_READY*|PAPER_EVALUATION_READY*|*GOAL_COMPLETE*|SUCCESS|PASS|OK|READY) printf '%s SUCCESS' "$icon" ;;
    *CONTINUE_REQUIRED*|*CONTINUE*|RUNNING) printf '%s CONTINUE' "$icon" ;;
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
