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

test('paper evaluation and paper autopilot are validated and remain ready for the external BWS-600 campaign', () => {
  assert.match(read('docs/automation/paper-evaluation.md'), /validated_task=BWS-588/);
  assert.match(read('docs/automation/paper-autopilot.md'), /integration_task=BWS-589/);
  assert.match(read('docs/018_private_paper_mode_runbook.md'), /runtime_upstream_mode=api_only/);
  assert.match(read('docs/018_private_paper_mode_runbook.md'), /automatic_file_fallback=prohibited/);
  assert.match(read('docs/repo_status_current.md'), /paper_autopilot=selected_for_bws_600_runtime_evidence/);
  assert.match(read('docs/repo_status_current.md'), /selected_controller=run-paper-autopilot\.sh/);
  const command = read('commands/run-sure-paper-mode-autonomous.sh');
  assert.match(command, /run-paper-autopilot\.sh/);
  assert.equal(command.includes('DATABASE' + '_URL'), false);
  assert.equal(command.includes('DB' + '_URL'), false);
});
