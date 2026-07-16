import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf-8');

test('historical private-paper ledger remains evidence while full lifecycle tasks are pending', () => {
  const historical = read('docs/017_private_paper_mode_implementation_backlog.md');
  assert.match(historical, /status=SUPERSEDED_BOOTSTRAP_LEDGER/);
  assert.match(historical, /legacy_stage=SURE-002B_PRIVATE_PAPER_MODE_INTAKE/);
  assert.match(historical, /do not constitute the final BWS paper platform/);
  for (const id of ['BWS-310', 'BWS-510', 'BWS-520', 'BWS-580', 'BWS-600']) {
    assert.match(historical, new RegExp(id));
  }
});

test('paper controllers remain no-service until BWS-588 and BWS-589', () => {
  assert.match(read('docs/automation/paper-evaluation.md'), /replacement_task=BWS-588/);
  assert.match(read('docs/automation/paper-autopilot.md'), /integration_task=BWS-589/);
  assert.match(read('docs/repo_status_current.md'), /paper_autopilot=not_selected_until_bws_589_and_bws_599_validation/);
  assert.match(read('docs/repo_status_current.md'), /selected_controller=run-autonomous-implementation\.sh/);
  const command = read('commands/run-sure-paper-mode-autonomous.sh');
  assert.match(command, /run-paper-autopilot\.sh/);
  assert.equal(command.includes('DATABASE' + '_URL'), false);
  assert.equal(command.includes('DB' + '_URL'), false);
});
