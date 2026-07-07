# Telegram notifications

The shared helper is `.automation/lib/telegram_notify.sh`.

Controllers call `telegram_notify_send_final` for final notifications. The helper sends Telegram messages with `parse_mode=HTML`, bold section labels, copyable code fields, separators, status icons, a next-action hint, UTC timestamp, and a visible helper version marker.

Required success marker in the controller log/status file:

```text
telegram_notification=sent parse_mode=HTML message_version=20260706.pretty_v2_html_cards
```

If a test message still logs only `telegram_notification=sent`, the old helper is still loaded and the overlay was not applied to the active repo tree.

Local dry-run formatting check:

```bash
mkdir -p artifacts/telegram_test && \
REPO_DIR="$PWD" TELEGRAM_NOTIFY=1 TELEGRAM_NOTIFY_DRY_RUN=1 TELEGRAM_NOTIFICATION_SENT=0 TELEGRAM_BOT_TOKEN=dummy TELEGRAM_CHAT_ID=dummy bash -lc '
set -euo pipefail
. .automation/lib/telegram_notify.sh
telegram_notify_send_final \
  "telegram-test" \
  "betting-win-surebet" \
  "TEST" \
  "manual_test" \
  "0" \
  "0" \
  "$PWD/artifacts/telegram_test" \
  "$PWD/artifacts/telegram_test/telegram_notification_status.txt" \
  "$PWD"
cat "$PWD/artifacts/telegram_test/telegram_notification_status.txt"
'
```

Live Telegram test:

```bash
mkdir -p artifacts/telegram_test && \
REPO_DIR="$PWD" TELEGRAM_NOTIFY=1 TELEGRAM_NOTIFICATION_SENT=0 bash -lc '
set -euo pipefail
. .automation/lib/telegram_notify.sh
telegram_notify_send_final \
  "telegram-test" \
  "betting-win-surebet" \
  "TEST" \
  "manual_test" \
  "0" \
  "0" \
  "$PWD/artifacts/telegram_test" \
  "$PWD/artifacts/telegram_test/telegram_notification_status.txt" \
  "$PWD"
cat "$PWD/artifacts/telegram_test/telegram_notification_status.txt"
'
```

Safety behavior:

```text
TELEGRAM_NOTIFY=0 disables delivery.
TELEGRAM_NOTIFY_DRY_RUN=1 formats and writes the payload without contacting Telegram.
TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are read from environment first, then .env.
The token is not printed.
Telegram failures do not fail the controller.
```


## Surebet pinned-bundle status classification

`PAPER_EVALUATION_READY_PRIVATE_FIXTURE_ONLY_BLOCKED_ON_PINNED_BUNDLE` is a successful private fixture smoke result, but it is not upstream paper readiness. The Telegram helper intentionally renders that status as blocked, not success, so operators do not confuse local fixture proof with a real pinned-bundle evaluation gate.
