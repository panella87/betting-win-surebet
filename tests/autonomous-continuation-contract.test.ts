import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf-8');

test('autonomous authority records the completed BWS-700 queue and active BWS-600 carry-forward gate', () => {
  const doc = read('docs/automation/autonomous-implementation.md');
  const task = read('docs/automation/current-implementation-task.md');
  const status = read('docs/repo_status_current.md');
  const automationReadme = read('docs/automation/README.md');
  for (const marker of [
    'BWS_FULL_PLATFORM_IMPLEMENTATION_V1', 'backlog/bws_full_implementation.csv',
    'backlog/bws_remaining_safe_local_map.csv', 'BWS-100', 'BWS-589', 'BWS-590', 'BWS-599',
  ]) assert.match(doc + task, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(task, /BETTING_WIN_REPO_PATH/);
  assert.match(task, /^current_task=BWS-600$/m);
  assert.match(task, /^current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE$/m);
  assert.match(task, /^active_implementation_queue=none$/m);
  assert.match(task, /^active_implementation_map=none$/m);
  assert.match(task, /^selected_controller=run-paper-autopilot\.sh$/m);
  assert.match(task, /^bws600_current_task=BWS-600$/m);
  assert.match(task, /^bws600_current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE$/m);
  assert.match(task, /^bws600_active_implementation_queue=none$/m);
  assert.match(task, /betting_win_api_preflight_required=before_bws_runtime_evidence_window/);
  assert.match(task, /automation_maintenance_allowed=no/);
  assert.match(task, /allowed_protected_files=none/);
  assert.match(status, /^selected_controller=run-paper-autopilot\.sh$/m);
  assert.match(status, /^current_task=BWS-600$/m);
  assert.match(status, /^run_autonomous_implementation=available_for_future_reviewed_source_handoff_or_unblocked_bws710$/m);
  assert.match(status, /^paper_autopilot=selected_after_bws700_dependency_ready_queue_complete$/m);
  assert.match(status, /^bws600_run_paper_autopilot=selected_for_bws600_runtime_evidence_after_upstream_api_preflight$/m);
  assert.match(status, /safe_local_terminal_gate=BWS-599/);
  assert.match(automationReadme, /Active post-BWS-700 controller route/);
  assert.match(automationReadme, /`run-paper-autopilot\.sh` is selected for `BWS-600` runtime evidence/);
  assert.match(automationReadme, /`run-autonomous-implementation\.sh` is not the selected route now/);
  assert.match(automationReadme, /truthful upstream API blocker/);
  assert.doesNotMatch(automationReadme, /`run-autonomous-implementation\.sh` is selected for the BWS-700 B1 implementation queue/);
  assert.doesNotMatch(automationReadme, /not the selected route for the B1 implementation overlay/);
});
