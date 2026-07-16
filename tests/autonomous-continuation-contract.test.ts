import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf-8');

test('autonomous authority continues the remaining operator-runtime queue', () => {
  const doc = read('docs/automation/autonomous-implementation.md');
  const task = read('docs/automation/current-implementation-task.md');
  const status = read('docs/repo_status_current.md');
  for (const marker of [
    'BWS_FULL_PLATFORM_IMPLEMENTATION_V1', 'backlog/bws_full_implementation.csv',
    'backlog/bws_remaining_safe_local_map.csv', 'BWS-100', 'BWS-589', 'BWS-590', 'BWS-599',
    'CONTINUE_REQUIRED=yes', 'AUTONOMOUS_GOAL_COMPLETE=yes',
  ]) assert.match(doc + task, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(task, /BETTING_WIN_REPO_PATH/);
  assert.match(task, /current_task=BWS-590/);
  assert.match(task, /current_task_status=PENDING/);
  assert.match(task, /automation_maintenance_allowed=no/);
  assert.match(task, /allowed_protected_files=none/);
  assert.match(task, /recommended_cycle_timeout=6h/);
  assert.match(status, /selected_controller=run-autonomous-implementation\.sh/);
  assert.match(status, /current_task=BWS-590/);
  assert.match(status, /safe_local_terminal_gate=BWS-599/);
});
