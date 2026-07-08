import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const HELPER = join(REPO_ROOT, '.automation', 'lib', 'telegram_notify.sh');

function shellQuote(value: string): string {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

test('telegram helper uses HTML parse mode and never prints secrets directly', () => {
  const source = readFileSync(HELPER, 'utf-8');

  assert.equal(source.includes("parse_mode: 'HTML'"), true);
  assert.equal(source.includes('20260706.pretty_v2_html_cards'), true);
  assert.equal(source.includes('telegram_notify_build_final_message'), true);
  assert.equal(source.includes('telegram_notify_log_payload'), true);
  assert.equal(source.includes('console.log(token)'), false);
  assert.equal(source.includes('console.log(chatId)'), false);
});

test('telegram dry run overwrites stale status payloads instead of appending duplicates', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'surebet-telegram-notify-'));
  try {
    const statusFile = join(tmp, 'telegram_notification_status.txt');
    writeFileSync(statusFile, 'telegram_notification=sent\ntelegram_notification=sent\n', 'utf-8');

    const script = `
set -euo pipefail
. ${shellQuote(HELPER)}
TELEGRAM_NOTIFY=1 TELEGRAM_NOTIFY_DRY_RUN=1 TELEGRAM_NOTIFICATION_SENT=0 TELEGRAM_BOT_TOKEN=dummy TELEGRAM_CHAT_ID=dummy \\
telegram_notify_send_final \\
  'telegram-test' \\
  'betting-win-surebet' \\
  'TEST' \\
  'manual_test' \\
  '0' \\
  '0' \\
  '${tmp}/artifacts/telegram_test' \\
  ${shellQuote(statusFile)} \\
  ${shellQuote(tmp)}
cat ${shellQuote(statusFile)}
`;

    const output = execFileSync('bash', ['-lc', script], { cwd: REPO_ROOT, encoding: 'utf-8' });
    const notificationLineCount = output
      .split('\n')
      .filter((line) => line.startsWith('telegram_notification='))
      .length;

    assert.equal(notificationLineCount, 1);
    assert.match(output, /telegram_notification=dry_run parse_mode=HTML message_version=20260706\.pretty_v2_html_cards/);
    assert.match(output, /telegram_notification_text_start/);
    assert.match(output, /<b>🧪 telegram-test finished<\/b>/);
    assert.match(output, /<b>📦 Repo<\/b>\s+<code>betting-win-surebet<\/code>/);
    assert.match(output, /<b>📊 Status<\/b> <b>🧪 TEST<\/b> <code>TEST<\/code>/);
    assert.match(output, /telegram_notification_text_end/);
    assert.equal(output.includes('telegram_notification=sent\ntelegram_notification=sent'), false);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
