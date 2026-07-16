import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf-8');
const esc = (value: string): RegExp => new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

test('full implementation ledger keeps BWS-580 validated and opens the remaining safe-local queue through BWS-599', () => {
  const ledger = read('backlog/bws_full_implementation.csv');
  const task = read('docs/automation/current-implementation-task.md');
  const status = read('docs/repo_status_current.md');
  for (const marker of [
    'BWS-000,VALIDATED', 'BWS-100,VALIDATED', 'BWS-510,VALIDATED',
    'BWS-520,VALIDATED', 'BWS-530,VALIDATED', 'BWS-540,VALIDATED',
    'BWS-550,VALIDATED', 'BWS-560,VALIDATED', 'BWS-570,VALIDATED',
    'BWS-580,VALIDATED', 'BWS-581,PENDING', 'BWS-582,PENDING',
    'BWS-583,PENDING', 'BWS-584,PENDING', 'BWS-585,PENDING',
    'BWS-586,PENDING', 'BWS-587,PENDING', 'BWS-588,PENDING',
    'BWS-589,PENDING', 'BWS-590,PENDING', 'BWS-591,PENDING',
    'BWS-592,PENDING', 'BWS-593,PENDING', 'BWS-599,PENDING',
    'BWS-600,BLOCKED', 'BWS-900,PARKED',
  ]) {
    assert.match(ledger, esc(marker));
  }
  assert.match(task, /program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1/);
  assert.match(task, /current_task=BWS-581/);
  assert.match(task, /current_task_status=PENDING/);
  assert.match(task, /safe_local_terminal_gate=BWS-599/);
  assert.match(task, /automation_maintenance_allowed=yes/);
  assert.match(task, /allowed_protected_files=start\.sh/);
  assert.match(task, /AUTONOMOUS_GOAL_COMPLETE=yes/);
  assert.match(status, /selected_controller=run-autonomous-implementation\.sh/);
  assert.match(status, /paper_autopilot=not_selected_until_bws_589_and_bws_599_validation/);
});

test('full implementation program validator passes the repository contract', () => {
  const output = execFileSync('python3', ['scripts/validate_full_implementation_program.py'], {
    cwd: ROOT,
    encoding: 'utf-8',
    stdio: 'pipe',
  });
  assert.match(output, /validate_full_implementation_program: ok/);
});
