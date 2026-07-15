import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf-8');

test('historical private-paper ledger is retained while full paper runtime remains queued', () => {
  const historical = read('docs/017_private_paper_mode_implementation_backlog.md');
  assert.match(historical, /status=SUPERSEDED_BOOTSTRAP_LEDGER/);
  assert.match(historical, /legacy_stage=SURE-002B_PRIVATE_PAPER_MODE_INTAKE/);
  assert.match(historical, /do not constitute the final BWS paper platform/);
  for (const id of ['BWS-310', 'BWS-320', 'BWS-410', 'BWS-500', 'BWS-510', 'BWS-600']) {
    assert.match(historical, new RegExp(id));
  }
});

test('paper autopilot becomes the active router only after safe local completion', () => {
  assert.match(read('docs/automation/paper-evaluation.md'), /not the initial implementation controller/);
  assert.match(read('docs/automation/paper-autopilot.md'), /post-implementation runtime\/database convergence/);
  assert.match(read('docs/repo_status_current.md'), /paper_autopilot=selected_after_bws_510_validation/);
  assert.match(read('docs/repo_status_current.md'), /selected_controller=run-paper-autopilot\.sh/);
  const command = read('commands/run-sure-paper-mode-autonomous.sh');
  assert.match(command, /run-paper-autopilot\.sh/);
  assert.equal(command.includes('DATABASE' + '_URL'), false);
  assert.equal(command.includes('DB' + '_URL'), false);
});
