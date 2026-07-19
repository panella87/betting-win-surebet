import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf-8');
const esc = (value: string): RegExp => new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

test('full implementation ledger keeps BWS-580 validated and records BWS-599 as the closed safe-local terminal gate', () => {
  const ledger = read('backlog/bws_full_implementation.csv');
  const task = read('docs/automation/current-implementation-task.md');
  const status = read('docs/repo_status_current.md');
  for (const marker of [
    'BWS-000,VALIDATED', 'BWS-100,VALIDATED', 'BWS-510,VALIDATED',
    'BWS-520,VALIDATED', 'BWS-530,VALIDATED', 'BWS-540,VALIDATED',
    'BWS-550,VALIDATED', 'BWS-560,VALIDATED', 'BWS-570,VALIDATED',
    'BWS-580,VALIDATED', 'BWS-581,VALIDATED', 'BWS-582,VALIDATED',
    'BWS-583,VALIDATED', 'BWS-584,VALIDATED', 'BWS-585,VALIDATED',
    'BWS-586,VALIDATED', 'BWS-587,VALIDATED', 'BWS-588,VALIDATED',
    'BWS-589,VALIDATED', 'BWS-590,VALIDATED', 'BWS-591,VALIDATED',
    'BWS-592,VALIDATED', 'BWS-593,VALIDATED', 'BWS-599,VALIDATED',
    'BWS-600,BLOCKED', 'BWS-900,PARKED',
  ]) {
    assert.match(ledger, esc(marker));
  }
  assert.match(task, /program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1/);
  assert.match(task, /current_task=BWS-600/);
  assert.match(task, /current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE/);
  assert.match(task, /active_implementation_queue=none/);
  assert.match(task, /safe_local_terminal_gate=BWS-599/);
  assert.match(task, /automation_maintenance_allowed=no/);
  assert.match(task, /allowed_protected_files=none/);
  assert.match(task, /backlog\/bws_remaining_safe_local_map\.csv/);
  assert.match(status, /selected_controller=run-paper-autopilot\.sh/);
  assert.match(status, /paper_autopilot=selected_for_bws600_runtime_evidence_after_upstream_api_preflight/);
  assert.match(status, /current_task=BWS-600/);
});

test('full implementation program validator passes the repository contract', () => {
  const output = execFileSync('python3', ['scripts/validate_full_implementation_program.py'], {
    cwd: ROOT,
    encoding: 'utf-8',
    stdio: 'pipe',
  });
  assert.match(output, /validate_full_implementation_program: ok/);
});
