import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf-8');

test('full implementation ledger reopens the executable continuous-runtime queue at BWS-520', () => {
  const ledger = read('backlog/bws_full_implementation.csv');
  const task = read('docs/automation/current-implementation-task.md');
  const status = read('docs/repo_status_current.md');
  for (const marker of [
    'BWS-000,VALIDATED', 'BWS-100,VALIDATED', 'BWS-110,VALIDATED',
    'BWS-120,VALIDATED', 'BWS-130,VALIDATED', 'BWS-140,VALIDATED',
    'BWS-200,VALIDATED', 'BWS-210,VALIDATED', 'BWS-220,VALIDATED',
    'BWS-230,VALIDATED', 'BWS-240,VALIDATED', 'BWS-300,VALIDATED',
    'BWS-310,VALIDATED', 'BWS-320,VALIDATED', 'BWS-400,VALIDATED',
    'BWS-410,VALIDATED', 'BWS-420,VALIDATED', 'BWS-500,VALIDATED',
    'BWS-510,VALIDATED', 'BWS-520,PENDING', 'BWS-530,PENDING',
    'BWS-540,PENDING', 'BWS-550,PENDING', 'BWS-560,PENDING',
    'BWS-570,PENDING', 'BWS-580,PENDING', 'BWS-600,BLOCKED',
    'BWS-900,PARKED',
  ]) {
    assert.match(ledger, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(task, /program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1/);
  assert.match(task, /current_task=BWS-520/);
  assert.match(task, /current_task_status=PENDING/);
  assert.match(task, /safe_local_terminal_gate=BWS-580/);
  assert.match(task, /CONTINUE_REQUIRED=yes/);
  assert.match(task, /without editing protected root wrappers or controllers/);
  assert.match(status, /selected_controller=run-autonomous-implementation\.sh/);
  assert.doesNotMatch(task, /repo-local backlogs are complete/);
});

test('full implementation program validator passes the repository contract', () => {
  const output = execFileSync('python3', ['scripts/validate_full_implementation_program.py'], {
    cwd: ROOT,
    encoding: 'utf-8',
    stdio: 'pipe',
  });
  assert.match(output, /validate_full_implementation_program: ok/);
});
