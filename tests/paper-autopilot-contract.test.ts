import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
function read(rel: string): string { return readFileSync(join(REPO_ROOT, rel), 'utf-8'); }
function esc(marker: string): RegExp { return new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); }
function contains(text: string, marker: string): void { assert.match(text, esc(marker), `missing marker: ${marker}`); }

test('paper autopilot is a surebet runtime-evidence parent supervisor', () => {
  const script = read('run-paper-autopilot.sh');
  for (const marker of [
    'Parent runtime-evidence paper/autonomous supervisor for betting-win-surebet',
    'paper_service_lifecycle=full_stack_owned',
    'paper_autopilot',
    'rounds.tsv',
    'child_command.txt',
    'child_output.log',
    'child_result.env',
    'child_terminal_result.env',
    '--runtime-evidence',
    'PAPER_AUTOPILOT_READY_RUNTIME_EVIDENCE_LOCAL_ONLY',
    'PAPER_AUTOPILOT_BLOCKED_RUNTIME_OWNERSHIP_AMBIGUOUS',
    'PAPER_AUTOPILOT_BLOCKED_RUNTIME_STOP_FAILED',
    'PAPER_AUTOPILOT_BLOCKED_RUNTIME_EVIDENCE_COLLECTION_FAILED',
    'PAPER_AUTOPILOT_BLOCKED_IMPLEMENTATION_NOOP',
    'PAPER_AUTOPILOT_BLOCKED_IMPLEMENTATION_HANDOVER_NOT_REFRESHABLE',
    'PAPER_AUTOPILOT_BLOCKED_CHILD_IDENTITY',
    'PAPER_AUTOPILOT_BLOCKED_CHILD_RESULT',
    'PAPER_AUTOPILOT_BLOCKED_LOCK_RELEASE',
    'atomic_parent_lock_acquisition=enabled',
    'parent_lock_mtime_heartbeat=enabled',
    'verified_force_unlock_termination=enabled',
    'automation_v2_claim_env_file_atomic',
    'automation_v2_touch_owned_parent_lock',
    'parent_child_cleanup_failure_classification=enabled',
    'parent_lock_release_failure_classification=enabled',
    'RUNTIME_EVIDENCE_SELECTED_UPSTREAM_MODE',
    'RUNTIME_EVIDENCE_CAMPAIGN_RUN_ID',
    'child_telegram_notifications=suppressed_by_parent',
    'parent_telegram_notification=final_only',
    '"TELEGRAM_NOTIFY=0"',
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
    'paper_service_supported_value()',
    'service_refresh_required_value()',
    'runtime_evidence_required_value()',
    'RUNTIME_EVIDENCE_SELECTED_UPSTREAM_MODE=',
    'RUNTIME_EVIDENCE_CAMPAIGN_RUN_ID=',
    'PAPER_EVALUATION_READY_RUNTIME_EVIDENCE_LOCAL_ONLY',
  ]) contains(script, marker);
});

test('implementation controller writes fingerprinted paper re-evaluation handoff metadata', () => {
  const script = read('run-autonomous-implementation.sh');
  for (const marker of [
    'kind="paper-mode-after-autonomous-implementation"',
    'next_key="RUN_PAPER_EVALUATION_NEXT"',
    'IMPLEMENTATION_SOURCE_CHANGED=$RUN_SOURCE_CHANGED',
    'IMPLEMENTATION_SOURCE_VALIDATION_PASSED=$RUN_SOURCE_VALIDATION_PASSED',
    'PRIVATE_PAPER_REEVALUATION_REQUIRED=$reevaluate',
    'SOURCE_HANDOFF_FINGERPRINT=$ACTIVE_HANDOFF_FINGERPRINT',
    'automation_v2_add_or_verify_fingerprint',
    'PAPER_SERVICE_SUPPORTED=$ACTIVE_HANDOFF_PAPER_SERVICE_SUPPORTED',
    'SERVICE_REFRESH_REQUIRED=$ACTIVE_HANDOFF_SERVICE_REFRESH_REQUIRED',
    'RUNTIME_EVIDENCE_REQUIRED=$ACTIVE_HANDOFF_RUNTIME_EVIDENCE_REQUIRED',
    'RUNTIME_EVIDENCE_SELECTED_UPSTREAM_MODE=$ACTIVE_HANDOFF_RUNTIME_EVIDENCE_SELECTED_UPSTREAM_MODE',
    'RUNTIME_EVIDENCE_CAMPAIGN_RUN_ID=$ACTIVE_HANDOFF_RUNTIME_EVIDENCE_CAMPAIGN_RUN_ID',
    '${ACTIVE_HANDOFF_MODE}_handover_noop_disallowed',
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
  contains(status, 'run_paper_autopilot=standardized_and_selected_for_bws_600_runtime_evidence');
  contains(read('docs/automation/paper-autopilot.md'), 'selected_now=yes_for_runtime_evidence_source_fix_loops');
});


test('paper autopilot reconciles nonzero child exits through explicit machine-readable results', () => {
  const script = read('run-paper-autopilot.sh');
  for (const marker of [
    'if run_child_controller paper "$round_dir"; then rc=0; else rc=$?; fi',
    'if run_child_controller implementation "$round_dir"; then rc=0; else rc=$?; fi',
    'AUTOMATION_CHILD_RESULT_FILE=$terminal_result',
    'automation_v2_validate_child_result_file',
    'child_terminal_result_transport=atomic_side_channel_v1',
    'child_stdout_machine_parsing=disabled',
    'LAST_CHILD_RESULT_VALID',
    'continue_runtime_evidence_observation',
    'setsid "${launch_cmd[@]}"',
    'ACTIVE_CHILD_PID=$!',
    'parent_budget_clamping=enabled',
  ]) contains(script, marker);
  assert.doesNotMatch(script, /latest artifact|latest_artifact|resolve_child_run_dir/);
  assert.doesNotMatch(script, /automation_v2_extract_unique_machine_value "\$output"/);
});
