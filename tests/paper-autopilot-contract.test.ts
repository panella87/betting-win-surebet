import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
function read(rel: string): string { return readFileSync(join(REPO_ROOT, rel), 'utf-8'); }
function esc(marker: string): RegExp { return new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); }
function contains(text: string, marker: string): void { assert.match(text, esc(marker), `missing marker: ${marker}`); }

test('paper autopilot is a surebet no-service parent supervisor', () => {
  const script = read('run-paper-autopilot.sh');
  for (const marker of [
    'Parent no-service paper/autonomous supervisor for betting-win-surebet',
    'paper_service_lifecycle=none',
    'paper_autopilot',
    'rounds.tsv',
    'child_command.txt',
    'child_output.log',
    'child_result.env',
    'PAPER_AUTOPILOT_BLOCKED_ON_PINNED_BUNDLE',
    'PAPER_AUTOPILOT_BLOCKED_IMPLEMENTATION_NOOP',
    'PAPER_AUTOPILOT_BLOCKED_IMPLEMENTATION_HANDOVER_NOT_REFRESHABLE',
    'telegram_notify_send_final "run-paper-autopilot.sh"',
  ]) contains(script, marker);
  assert.doesNotMatch(script, /scripts\/load-node-runtime\.sh/);
  assert.doesNotMatch(script, /bash \.\/start\.sh/);
  assert.doesNotMatch(script, /bash \.\/stop\.sh/);
  assert.doesNotMatch(script, /forever|MongoDB|TRADING_ENABLED|EXECUTION_MODE/);
});

test('paper evaluation writes autopilot-readable implementation handoff metadata', () => {
  const script = read('run-paper-evaluation.sh');
  for (const marker of [
    'HANDOVER_KIND=paper-mode-to-autonomous-implementation',
    'RUN_AUTONOMOUS_IMPLEMENTATION_NEXT=yes',
    'AUTONOMOUS_IMPLEMENTATION_EXPECTED_FLAG=--handover-paper-mode',
    'PAPER_MODE_NOOP_SUCCESS_ALLOWED=no',
    'PAPER_MODE_EXPECTED_PRIVATE_PAPER_REEVALUATION_AFTER_SOURCE_CHANGE=yes',
    'PAPER_MODE_AUTOMATION_MAINTENANCE_ALLOWED=',
    'PAPER_SERVICE_SUPPORTED=0',
    'SERVICE_REFRESH_REQUIRED=0',
    'RUNTIME_EVIDENCE_REQUIRED=0',
  ]) contains(script, marker);
});

test('implementation controller writes autopilot-readable paper re-evaluation handoff metadata', () => {
  const script = read('run-autonomous-implementation.sh');
  for (const marker of [
    'HANDOVER_KIND=paper-mode-after-autonomous-implementation',
    'RUN_PAPER_EVALUATION_NEXT=yes',
    'IMPLEMENTATION_SOURCE_CHANGED=',
    'IMPLEMENTATION_SOURCE_VALIDATION_PASSED=',
    'PRIVATE_PAPER_REEVALUATION_REQUIRED=',
    'PAPER_SERVICE_SUPPORTED=0',
    'SERVICE_REFRESH_REQUIRED=0',
    'RUNTIME_EVIDENCE_REQUIRED=0',
    'paper_handover_noop_disallowed',
    'PAPER_MODE_NOOP_SUCCESS_ALLOWED',
    'PAPER_MODE_AUTOMATION_MAINTENANCE_ALLOWED',
  ]) contains(script, marker);
});

test('automation config and docs register paper autopilot as the unattended paper command', () => {
  const config = read('automation.config.sh');
  const status = read('docs/repo_status_current.md');
  contains(config, 'AUTOMATION_PAPER_AUTOPILOT_COMMAND');
  contains(config, 'AUTOMATION_PAPER_COMMAND="$AUTOMATION_PAPER_AUTOPILOT_COMMAND"');
  contains(config, 'run-paper-autopilot.sh');
  contains(status, 'run_paper_autopilot=standardized_no_service_parent_supervisor');
  contains(read('docs/automation/paper-autopilot.md'), 'PAPER_AUTOPILOT_BLOCKED_ON_PINNED_BUNDLE');
});


test('paper autopilot handles nonzero child exits explicitly instead of failing through set -e', () => {
  const script = read('run-paper-autopilot.sh');
  contains(script, 'set +e\n    run_child_controller "$child" "$round_dir"\n    rc=$?\n    set -e');
  contains(script, 'resolve_child_run_dir "$output_log"');
  contains(script, 'ACTIVE_CHILD_PID="$!"; automation_write_lock_file; wait "$ACTIVE_CHILD_PID"; rc=$?');
  assert.doesNotMatch(script, /wait "\$ACTIVE_CHILD_PID"; rc=\$\?; set -e/);
  contains(script, 'return 0; }');
  contains(script, 'parse_child_summary "$latest" "$output_log"');
});
