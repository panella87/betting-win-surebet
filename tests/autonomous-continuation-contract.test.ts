import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
function read(rel: string): string { return readFileSync(join(REPO_ROOT, rel), 'utf-8'); }

test('automation implementation docs treat retained backlogs as complete ledgers', () => {
  const doc = read('docs/automation/autonomous-implementation.md');
  assert.match(doc, /docs\/014_sure_001_remaining_hardening_backlog\.md/);
  assert.match(doc, /docs\/015_local_engine_implementation_backlog\.md/);
  assert.match(doc, /docs\/017_private_paper_mode_implementation_backlog\.md/);
  assert.match(doc, /repo-local backlogs are complete/);
  assert.match(doc, /AUTONOMOUS_GOAL_COMPLETE=yes/);
});

test('current implementation task allows only confirmed safe defect repair', () => {
  const task = read('docs/automation/current-implementation-task.md');
  assert.match(task, /Fix only confirmed repo-local validation\/tooling defects/);
  assert.match(task, /provider_connections=prohibited/);
  assert.match(task, /execution=prohibited/);
  assert.match(task, /blocked_until_federico_pinned_betting_win_interface/);
});
