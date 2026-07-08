import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();

function runBash(command: string, env: NodeJS.ProcessEnv = {}): string {
  return execFileSync('bash', ['-lc', command], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    env: { ...process.env, REPO_DIR: REPO_ROOT, ...env },
  });
}

test('telegram helper builds pretty HTML final cards and escapes fields', () => {
  const output = runBash(`. .automation/lib/telegram_notify.sh && telegram_notify_build_final_message 'run-paper-evaluation.sh' 'betting-win-surebet' 'TEST' 'manual<test>&stop' '0' '0' '${REPO_ROOT}/artifacts/telegram-test' '${REPO_ROOT}'`);

  assert.match(output, /<b>🧪 run-paper-evaluation\.sh finished<\/b>/);
  assert.match(output, /<b>📦 Repo<\/b>\s+<code>betting-win-surebet<\/code>/);
  assert.match(output, /<b>📊 Status<\/b> <b>🧪 TEST<\/b> <code>TEST<\/code>/);
  assert.match(output, /manual&lt;test&gt;&amp;stop/);
  assert.match(output, /<code>20260706\.pretty_v2_html_cards<\/code>/);
});

test('surebet blocked-on-pinned-bundle status renders as blocked instead of success', () => {
  const status = 'PAPER_EVALUATION_READY_PRIVATE_FIXTURE_ONLY_BLOCKED_ON_PINNED_BUNDLE';
  const output = runBash(`. .automation/lib/telegram_notify.sh && telegram_notify_build_final_message 'run-paper-evaluation.sh' 'betting-win-surebet' '${status}' 'private_fixture_only' '1' '0' '${REPO_ROOT}/artifacts/paper_evaluation_telegram' '${REPO_ROOT}'`);

  assert.match(output, /<b>📊 Status<\/b> <b>🛑 BLOCKED<\/b>/);
  assert.match(output, /Do not treat private fixture proof as upstream readiness/);
  assert.doesNotMatch(output, /✅ SUCCESS/);
});

test('telegram dry-run writes one HTML status payload without contacting Telegram', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-telegram-dry-run-'));
  try {
    const runDir = join(dir, 'artifacts', 'telegram_test');
    const statusFile = join(runDir, 'telegram_notification_status.txt');
    mkdirSync(runDir, { recursive: true });

    runBash(`. .automation/lib/telegram_notify.sh && telegram_notify_send_final 'telegram-test' 'betting-win-surebet' 'TEST' 'manual_test' '0' '0' '${runDir}' '${statusFile}' '${REPO_ROOT}'`, {
      TELEGRAM_NOTIFY: '1',
      TELEGRAM_NOTIFY_DRY_RUN: '1',
      TELEGRAM_NOTIFICATION_SENT: '0',
      TELEGRAM_BOT_TOKEN: 'dummy-token',
      TELEGRAM_CHAT_ID: 'dummy-chat',
    });

    const payload = readFileSync(statusFile, 'utf-8');
    assert.match(payload, /telegram_notification=dry_run parse_mode=HTML message_version=20260706\.pretty_v2_html_cards/);
    assert.match(payload, /telegram_notification_text_start/);
    assert.match(payload, /telegram_notification_text_end/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
