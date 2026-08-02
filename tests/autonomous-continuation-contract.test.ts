import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf-8');

test('autonomous authority records the active BWS-700 queue and BWS-600 carry-forward gate', () => {
  const doc = read('docs/automation/autonomous-implementation.md');
  const task = read('docs/automation/current-implementation-task.md');
  const status = read('docs/repo_status_current.md');
  for (const marker of [
    'BWS_FULL_PLATFORM_IMPLEMENTATION_V1', 'backlog/bws_full_implementation.csv',
    'backlog/bws_remaining_safe_local_map.csv', 'BWS-100', 'BWS-589', 'BWS-590', 'BWS-599',
  ]) assert.match(doc + task, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(task, /BETTING_WIN_REPO_PATH/);
  assert.match(task, /^current_task=BWS-700$/m);
  assert.match(task, /^current_task_status=READY_FOR_IMPLEMENTATION$/m);
  assert.match(task, /^active_implementation_queue=backlog\/bws_b1_cross_venue_implementation\.csv$/m);
  assert.match(task, /^active_implementation_map=backlog\/bws_b1_cross_venue_map\.csv$/m);
  assert.match(task, /^selected_controller=run-autonomous-implementation\.sh$/m);
  assert.match(task, /^bws600_current_task=BWS-600$/m);
  assert.match(task, /^bws600_current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE$/m);
  assert.match(task, /^bws600_active_implementation_queue=none$/m);
  assert.match(task, /betting_win_api_preflight_required=before_bws_runtime_evidence_window/);
  assert.match(task, /automation_maintenance_allowed=no/);
  assert.match(task, /allowed_protected_files=none/);
  assert.match(status, /^selected_controller=run-autonomous-implementation\.sh$/m);
  assert.match(status, /^current_task=BWS-700$/m);
  assert.match(status, /^run_autonomous_implementation=standardized_selected_for_bws700_b1_implementation$/m);
  assert.match(status, /^paper_autopilot=not_selected_while_bws700_queue_is_active$/m);
  assert.match(status, /^bws600_run_paper_autopilot=selected_for_bws600_runtime_evidence_after_upstream_api_preflight$/m);
  assert.match(status, /safe_local_terminal_gate=BWS-599/);
});
