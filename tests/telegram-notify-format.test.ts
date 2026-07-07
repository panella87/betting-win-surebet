import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const REPO_ROOT = process.cwd();
const HELPER = join(REPO_ROOT, '.automation', 'lib', 'telegram_notify.sh');

function q(value: string): string {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

test('telegram final message is HTML formatted and not legacy key=value text', () => {
  const script = `
set -euo pipefail
. ${q(HELPER)}
telegram_notify_build_final_message \
  'telegram-test<bad>' \
  'betting-win-surebet&core' \
  'TEST' \
  'manual_test&format' \
  '0' \
  '0' \
  '${REPO_ROOT}/artifacts/telegram_test' \
  '${REPO_ROOT}'
`;
  const output = execFileSync('bash', ['-lc', script], { cwd: REPO_ROOT, encoding: 'utf8' });

  assert.match(output, /^<b>🧪 telegram-test&lt;bad&gt; finished<\/b>/);
  assert.match(output, /━━━━━━━━━━━━━━━━━━━━/);
  assert.match(output, /<b>📦 Repo<\/b>\s+<code>betting-win-surebet&amp;core<\/code>/);
  assert.match(output, /<b>📊 Status<\/b> <b>🧪 TEST<\/b> <code>TEST<\/code>/);
  assert.match(output, /<b>🧭 Stop<\/b>\s+<code>manual_test&amp;format<\/code>/);
  assert.match(output, /<b>🔁 Cycles<\/b> <code>0<\/code>/);
  assert.match(output, /<b>🚪 Exit<\/b>\s+<code>0<\/code>/);
  assert.match(output, /<b>📁 Run<\/b>\s+<code>artifacts\/telegram_test<\/code>/);
  assert.match(output, /<b>➡️ Next<\/b> Telegram delivery and HTML formatting are verified\./);
  assert.match(output, /<i>UTC \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z<\/i>/);
  assert.match(output, /<code>20260706\.pretty_v2_html_cards<\/code>/);
  assert.equal(output.includes('repo='), false);
  assert.equal(output.includes('status='), false);
  assert.equal(output.includes('exit_code='), false);
});

test('telegram status icons are deterministic', () => {
  const script = `
set -euo pipefail
. ${q(HELPER)}
telegram_notify_status_icon TEST 0; printf '\n'
telegram_notify_status_icon TARGET_READY 0; printf '\n'
telegram_notify_status_icon CONTINUE_REQUIRED 0; printf '\n'
telegram_notify_status_icon BLOCKED 2; printf '\n'
telegram_notify_status_icon PAPER_EVALUATION_READY_PRIVATE_FIXTURE_ONLY_BLOCKED_ON_PINNED_BUNDLE 0; printf '\n'
telegram_notify_status_icon UNKNOWN 2; printf '\n'
`;
  const output = execFileSync('bash', ['-lc', script], { cwd: REPO_ROOT, encoding: 'utf8' }).trim().split('\n');
  assert.deepEqual(output, ['🧪', '✅', '🔁', '🛑', '🛑', '❌']);
});



test('surebet private-fixture-only pinned-bundle block is not presented as success', () => {
  const status = 'PAPER_EVALUATION_READY_PRIVATE_FIXTURE_ONLY_BLOCKED_ON_PINNED_BUNDLE';
  const script = `
set -euo pipefail
. ${q(HELPER)}
telegram_notify_status_text '${status}' 0; printf '\n'
telegram_notify_next_action '${status}' 0; printf '\n'
telegram_notify_build_final_message \
  'run-paper-evaluation.sh' \
  'betting-win-surebet' \
  '${status}' \
  'private_fixture_only' \
  '1' \
  '0' \
  '${REPO_ROOT}/artifacts/paper_evaluation_test' \
  '${REPO_ROOT}'
`;
  const output = execFileSync('bash', ['-lc', script], { cwd: REPO_ROOT, encoding: 'utf8' });

  assert.match(output, /^🛑 BLOCKED\n/);
  assert.match(output, /Do not treat private fixture proof as upstream readiness\./);
  assert.match(output, /<b>📊 Status<\/b> <b>🛑 BLOCKED<\/b> <code>PAPER_EVALUATION_READY_PRIVATE_FIXTURE_ONLY_BLOCKED_ON_PINNED_BUNDLE<\/code>/);
  assert.equal(output.includes('<b>✅ SUCCESS</b>'), false);
});
