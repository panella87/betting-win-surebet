#!/usr/bin/env bash
# Shared Telegram completion notifier for repo automation controllers.
# Source this file and call telegram_notify_send_final. No polling is performed.

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

telegram_notify_log() {
  local log_file="${1:-}" msg="${2:-}"
  if [ -n "$log_file" ]; then
    printf '%s\n' "$msg" >> "$log_file" 2>/dev/null || true
  else
    printf '%s\n' "$msg" >&2
  fi
}

telegram_notify_send_final() {
  local controller_name="$1" repo_slug="$2" final_status="$3" stop_reason="$4" cycles="$5" final_rc="$6" run_dir="$7" controller_log="${8:-}" repo_dir="${9:-${REPO_DIR:-}}"
  local token chat run_rel message

  [ "${TELEGRAM_NOTIFY:-1}" = "1" ] || return 0
  [ "${TELEGRAM_NOTIFICATION_SENT:-0}" = "0" ] || return 0
  TELEGRAM_NOTIFICATION_SENT=1

  command -v node >/dev/null 2>&1 || {
    telegram_notify_log "$controller_log" "telegram_notification=skipped node_missing"
    return 0
  }

  token="$(telegram_notify_read_setting TELEGRAM_BOT_TOKEN 2>/dev/null || true)"
  chat="$(telegram_notify_read_setting TELEGRAM_CHAT_ID 2>/dev/null || true)"
  if [ -z "$token" ] || [ -z "$chat" ]; then
    telegram_notify_log "$controller_log" "telegram_notification=skipped missing_config"
    return 0
  fi

  run_rel="$run_dir"
  if [ -n "$repo_dir" ]; then
    case "$run_rel" in "$repo_dir"/*) run_rel="${run_rel#"$repo_dir"/}" ;; esac
  fi

  message="${controller_name} finished
repo=${repo_slug}
status=${final_status}
stop=${stop_reason}
cycles=${cycles}
exit_code=${final_rc}
run=${run_rel}"

  TELEGRAM_BOT_TOKEN="$token" \
  TELEGRAM_CHAT_ID="$chat" \
  TELEGRAM_TEXT="$message" \
  node <<'NODE' >> "${controller_log:-/dev/null}" 2>&1 || true
const token = process.env.TELEGRAM_BOT_TOKEN || '';
const chatId = process.env.TELEGRAM_CHAT_ID || '';
const text = process.env.TELEGRAM_TEXT || '';
const timeoutMs = 10000;
if (!token || !chatId || !text) {
  console.log('telegram_notification=skipped_missing_config');
  process.exit(0);
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
      disable_web_page_preview: true,
    }),
  });
  const raw = await response.text();
  if (!response.ok) {
    console.log(`telegram_notification=failed http_status=${response.status} body=${raw.slice(0, 180).replace(/\s+/g, ' ')}`);
    process.exit(0);
  }
  console.log('telegram_notification=sent');
} catch (error) {
  const reason = error && error.name === 'AbortError' ? 'timeout' : String((error && error.message) || error);
  console.log(`telegram_notification=failed reason=${reason}`);
} finally {
  clearTimeout(timer);
}
NODE
  return 0
}
