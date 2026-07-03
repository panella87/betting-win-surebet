import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();

function read(relativePath: string): string {
  return readFileSync(join(REPO_ROOT, relativePath), 'utf-8');
}

test('private paper-mode backlog allows only repo-local pinned-bundle work', () => {
  const backlog = read('docs/017_private_paper_mode_implementation_backlog.md');
  const runbook = read('docs/018_private_paper_mode_runbook.md');

  for (const text of [backlog, runbook]) {
    assert.match(text, /SURE-002B_PRIVATE_PAPER_MODE_INTAKE/);
    assert.match(text, /provider_connection = prohibited|provider_connection=prohibited/);
    assert.match(text, /execution = prohibited|execution=prohibited/);
    assert.match(text, /accepted=false|accepted = false/);
    assert.doesNotMatch(text, /live mode is enabled/i);
  }

  assert.match(backlog, /items 1 through 8 are implemented/);
  assert.match(backlog, /safe repo-local private paper-mode backlog is exhausted/);
  assert.match(runbook, /Freeze gate/);
  assert.match(runbook, /npm run validate/);
  assert.match(runbook, /status=blocked/);
  assert.match(runbook, /Stop conditions/);
});

test('autonomous prompt continues through the private paper-mode backlog', () => {
  const script = read('run-autonomous-implementation.sh');

  assert.match(script, /docs\/017_private_paper_mode_implementation_backlog\.md/);
  assert.match(script, /private paper-mode intake\/reporting item/);
  assert.match(script, /Use CONTINUE_REQUIRED=yes when docs\/017_private_paper_mode_implementation_backlog\.md still has a safe unchecked private paper-mode item/);
});

test('pinned-interface smoke command stays repo-local and delegates to local-report', () => {
  const command = read('commands/run-pinned-interface-smoke.sh');

  assert.match(command, /SUREBET_PINNED_BUNDLE/);
  assert.match(command, /remote URLs are prohibited/);
  assert.match(command, /artifacts\/private-paper-mode/);
  assert.match(command, /node cli\.js local-report/);
  assert.match(command, /--pinned-intake/);
  assert.doesNotMatch(command, /curl |wget |psql /);
  assert.equal(command.includes('DATABASE' + '_URL'), false);
  assert.equal(command.includes('DB' + '_URL'), false);
});

test('status docs record completed private paper-mode backlog and freeze gate', () => {
  const status = read('docs/repo_status_current.md');
  const projectStatus = read('PROJECT_STATUS.md');
  const masterPlan = read('docs/MASTER_PLAN.md');

  assert.match(status, /current_task=SURE-002B_PRIVATE_PAPER_MODE_INTAKE/);
  assert.match(status, /current_task_status=complete_repo_local_private_paper_mode_backlog_blocked_on_pinned_interface/);
  assert.match(status, /No unchecked repo-local item remains in `docs\/017_private_paper_mode_implementation_backlog\.md`\./);
  assert.match(projectStatus, /status=SURE-002B_PRIVATE_PAPER_MODE_INTAKE/);
  assert.match(projectStatus, /current_task=SURE-002B_PRIVATE_PAPER_MODE_INTAKE/);
  assert.match(masterPlan, /stage=SURE-002B_PRIVATE_PAPER_MODE_INTAKE/);
  assert.match(masterPlan, /private_paper_mode=repo_local_complete/);
});
