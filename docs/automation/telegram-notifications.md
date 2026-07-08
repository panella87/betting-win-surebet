# Telegram final notifications

The shared helper lives at:

```text
.automation/lib/telegram_notify.sh
```

It is used by the root controllers:

```text
run-autonomous-implementation.sh
run-autonomous-bugfix.sh
run-paper-evaluation.sh
```

Configuration is optional and read from environment first, then `.env`:

```text
TELEGRAM_NOTIFY=1
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

Set `TELEGRAM_NOTIFY=0` to disable final notifications.

Current message contract:

```text
message_version=20260706.pretty_v2_html_cards
parse_mode=HTML
one final message per controller run
status-file dry-run payloads are overwritten, not appended
no polling
no webhook
no token printed
Telegram failure does not fail the controller
```

The helper supports local formatting verification without contacting Telegram:

```bash
TELEGRAM_NOTIFY=1 \
TELEGRAM_NOTIFY_DRY_RUN=1 \
TELEGRAM_NOTIFICATION_SENT=0 \
TELEGRAM_BOT_TOKEN=dummy \
TELEGRAM_CHAT_ID=dummy \
REPO_DIR="$PWD" \
bash -lc '. .automation/lib/telegram_notify.sh && telegram_notify_send_final "telegram-test" "betting-win-surebet" "TEST" "manual_test" "0" "0" "$PWD/artifacts/telegram_test" "$PWD/artifacts/telegram_test/telegram_notification_status.txt" "$PWD"'
```

Expected status marker:

```text
telegram_notification=dry_run parse_mode=HTML message_version=20260706.pretty_v2_html_cards
```

Surebet-specific status rule:

```text
PAPER_EVALUATION_READY_PRIVATE_FIXTURE_ONLY_BLOCKED_ON_PINNED_BUNDLE
```

renders as blocked, not success. A passing private fixture smoke is not real upstream readiness and not a profitability or live-execution signal.
