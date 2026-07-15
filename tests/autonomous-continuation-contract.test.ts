import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf-8');

test('autonomous authority continues the BWS continuous-runtime queue', () => {
  const doc = read('docs/automation/autonomous-implementation.md');
  const task = read('docs/automation/current-implementation-task.md');
  const status = read('docs/repo_status_current.md');
  for (const marker of [
    'BWS_FULL_PLATFORM_IMPLEMENTATION_V1', 'backlog/bws_full_implementation.csv',
    'BWS-100', 'BWS-510', 'BWS-520', 'BWS-580',
    'CONTINUE_REQUIRED=yes', 'AUTONOMOUS_GOAL_COMPLETE=yes',
  ]) {
    assert.match(doc + task, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(task, /BETTING_WIN_REPO_PATH/);
  assert.match(status, /selected_controller=run-autonomous-implementation\.sh/);
  assert.doesNotMatch(doc + task + status, /repo-local backlogs are complete/);
});
