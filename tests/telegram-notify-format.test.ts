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
  assert.match(output, /<code>20260712\.pretty_v4_lock_actions<\/code>/);
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
    assert.match(payload, /telegram_notification=dry_run parse_mode=HTML message_version=20260712\.pretty_v4_lock_actions/);
    assert.match(payload, /telegram_notification_text_start/);
    assert.match(payload, /telegram_notification_text_end/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});


test('telegram helper gives bugfix campaign statuses specific next actions', () => {
  const complete = runBash(`. .automation/lib/telegram_notify.sh && telegram_notify_build_final_message 'run-bugfix-autopilot.sh' 'betting-win-surebet' 'BUGFIX_AUTOPILOT_COMPLETE' 'campaign_complete' '8' '0' '${REPO_ROOT}/artifacts/bugfix_autopilot_complete' '${REPO_ROOT}'`);
  assert.match(complete, /<b>📊 Status<\/b> <b>✅ SUCCESS<\/b>/);
  assert.match(complete, /Archive campaign_coverage\.tsv/);

  const budget = runBash(`. .automation/lib/telegram_notify.sh && telegram_notify_build_final_message 'run-bugfix-autopilot.sh' 'betting-win-surebet' 'BUGFIX_AUTOPILOT_BUDGET_EXHAUSTED' 'parent_budget_exhausted' '5' '3' '${REPO_ROOT}/artifacts/bugfix_autopilot_budget' '${REPO_ROOT}'`);
  assert.match(budget, /<b>📊 Status<\/b> <b>🔁 CONTINUE<\/b>/);
  assert.match(budget, /automatic resume is not enabled/);

  const mismatch = runBash(`. .automation/lib/telegram_notify.sh && telegram_notify_build_final_message 'run-bugfix-autopilot.sh' 'betting-win-surebet' 'BUGFIX_AUTOPILOT_BLOCKED_HANDOFF_MISMATCH' 'invalid_handoff' '2' '2' '${REPO_ROOT}/artifacts/bugfix_autopilot_mismatch' '${REPO_ROOT}'`);
  assert.match(mismatch, /<b>📊 Status<\/b> <b>🛑 BLOCKED<\/b>/);
  assert.match(mismatch, /child_result\.env/);
});

test('telegram helper distinguishes accepted private reports from paper controller blockers', () => {
  const accepted = runBash(`. .automation/lib/telegram_notify.sh && telegram_notify_build_final_message 'run-paper-autopilot.sh' 'betting-win-surebet' 'PAPER_AUTOPILOT_PINNED_BUNDLE_ACCEPTED_PRIVATE_REPORT_WRITTEN' 'private_report_written' '3' '0' '${REPO_ROOT}/artifacts/paper_autopilot_accepted' '${REPO_ROOT}'`);
  assert.match(accepted, /<b>📊 Status<\/b> <b>✅ SUCCESS<\/b>/);
  assert.match(accepted, /do not treat it as profitability, live-readiness, or execution approval/);

  const partial = runBash(`. .automation/lib/telegram_notify.sh && telegram_notify_build_final_message 'run-paper-autopilot.sh' 'betting-win-surebet' 'PAPER_AUTOPILOT_BLOCKED_IMPLEMENTATION_PARTIAL_SOURCE_CHANGE' 'partial_source_change' '4' '2' '${REPO_ROOT}/artifacts/paper_autopilot_partial' '${REPO_ROOT}'`);
  assert.match(partial, /<b>📊 Status<\/b> <b>🛑 BLOCKED<\/b>/);
  assert.match(partial, /Inspect the partial implementation run/);

  const childIdentity = runBash(`. .automation/lib/telegram_notify.sh && telegram_notify_build_final_message 'run-paper-autopilot.sh' 'betting-win-surebet' 'PAPER_AUTOPILOT_BLOCKED_CHILD_IDENTITY' 'active_child_identity_or_termination_failed' '4' '2' '${REPO_ROOT}/artifacts/paper_autopilot_child_identity' '${REPO_ROOT}'`);
  assert.match(childIdentity, /preserved paper-parent lock/);

  const paperLock = runBash(`. .automation/lib/telegram_notify.sh && telegram_notify_build_final_message 'run-paper-evaluation.sh' 'betting-win-surebet' 'PAPER_EVALUATION_BLOCKED_LOCK_RELEASE' 'lock_release_failed_lock_preserved' '1' '2' '${REPO_ROOT}/artifacts/paper_evaluation_lock' '${REPO_ROOT}'`);
  assert.match(paperLock, /preserved standalone paper lock/);
});
