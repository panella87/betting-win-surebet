import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
function read(rel: string): string { return readFileSync(join(REPO_ROOT, rel), 'utf-8'); }
function escaped(marker: string): RegExp { return new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); }
function assertContains(text: string, marker: string): void { assert.match(text, escaped(marker), `expected marker: ${marker}`); }

test('standard automation root scripts and shared helpers are installed', () => {
  for (const rel of [
    'zip_codebase.sh','pull_artifacts_and_zip_codebase.sh','update_git.sh',
    'check_progress.sh','watch_progress.sh','open_log.sh','start.sh','stop.sh',
    'run-autonomous-implementation.sh','run-paper-evaluation.sh','run-paper-autopilot.sh','run-autonomous-bugfix.sh','run-bugfix-autopilot.sh',
    'automation.config.sh','.automation/lib/run_common.sh','.automation/lib/controller_hardening_v2.sh','.automation/lib/telegram_notify.sh','.automation/README.md',
  ]) {
    assert.equal(existsSync(join(REPO_ROOT, rel)), true, `${rel} should exist`);
  }
  assert.match(read('.automation/lib/run_common.sh'), /automation_acquire_lock\(\)/);
  assert.match(read('.automation/lib/run_common.sh'), /automation_require_cycle_artifacts\(\)/);
  assert.match(read('.automation/lib/run_common.sh'), /automation_run_argv_command\(\)/);
  assert.match(read('.automation/lib/run_common.sh'), /automation_source_tree_fingerprint\(\)/);
  assert.match(read('.automation/lib/run_common.sh'), /automation_assert_no_incompatible_locks\(\)/);
  assert.match(read('.automation/lib/run_common.sh'), /automation_run_managed_argv\(\)/);
  assert.match(read('.automation/lib/run_common.sh'), /automation_terminate_process_group\(\)/);
  assert.match(read('.automation/lib/run_common.sh'), /zip -q -1 -r "\$zip_tmp" artifacts/);
  assert.match(read('.automation/lib/controller_hardening_v2.sh'), /zip -q -1 -r/);
  assert.match(read('.automation/lib/controller_hardening_v2.sh'), /automation_v2_load_env_strict\(\)/);
  assert.match(read('.automation/lib/controller_hardening_v2.sh'), /automation_v2_semantic_env_fingerprint_loaded\(\)/);
  assert.match(read('.automation/lib/controller_hardening_v2.sh'), /automation_v2_extract_unique_machine_value\(\)/);
  assert.match(read('.automation/lib/controller_hardening_v2.sh'), /automation_v2_publish_child_result\(\)/);
  assert.match(read('.automation/lib/controller_hardening_v2.sh'), /automation_v2_validate_child_result_file\(\)/);
  assert.match(read('.automation/lib/telegram_notify.sh'), /telegram_notify_send_final\(\)/);
  assert.match(read('.automation/lib/telegram_notify.sh'), /telegram_notify_build_final_message\(\)/);
  assert.match(read('.automation/lib/telegram_notify.sh'), /telegram_notify_message_version\(\)/);
  assert.match(read('.automation/lib/telegram_notify.sh'), /20260712\.pretty_v5_parent_lock_actions/);
  assert.match(read('.automation/lib/telegram_notify.sh'), /parse_mode: 'HTML'/);
});

test('daily git and packaging helpers match the standardized contract', () => {
  const updateGit = read('update_git.sh');
  const zipCodebase = read('zip_codebase.sh');
  const pullAndZip = read('pull_artifacts_and_zip_codebase.sh');
  assert.match(updateGit, /git pull --ff-only --autostash/);
  assert.match(updateGit, /GIT_ASKPASS/);
  assert.match(updateGit, /stage_required_executable_modes\(\)/);
  assert.match(updateGit, /tools\/required_executable_paths\.js/);
  assert.match(updateGit, /git update-index --chmod=\+x/);
  assert.match(updateGit, /git add -A[\s\S]*stage_required_executable_modes/);
  assert.doesNotMatch(updateGit, /require_clean_tree_for_sync/);
  assert.match(zipCodebase, /--artifacts-only/);
  assert.match(zipCodebase, /created_zip=%s/);
  assert.match(zipCodebase, /sha256=%s/);
  assert.match(zipCodebase, /zip -q -1 -r "\$tmp_zip" artifacts/);
  assert.match(zipCodebase, /zip -q -1 -@ "\$tmp_zip" < "\$list_file"/);
  assert.match(zipCodebase, /\.zip-codebase-list\.tmp\.XXXXXXXXXX/);
  assert.match(pullAndZip, /REMOTE_ARTIFACT/);
  assert.match(pullAndZip, /REMOTE_REPO basename mismatch/);
  assert.match(pullAndZip, /"\$LOCAL_ROOT\/zip_codebase\.sh"/);
  assert.doesNotMatch(pullAndZip, /bash \.\/zip_codebase\.sh/);
  assert.doesNotMatch(pullAndZip, /source .*automation\.config\.sh|\. automation\.config\.sh/);
});


test('all root controllers package the complete repo artifacts directory', () => {
  for (const rel of [
    'run-autonomous-implementation.sh',
    'run-autonomous-bugfix.sh',
    'run-paper-evaluation.sh',
    'run-paper-autopilot.sh',
    'run-bugfix-autopilot.sh',
  ]) {
    const script = read(rel);
    assertContains(script, 'artifacts_zip_scope=full_artifacts_directory');
    assertContains(script, 'final_artifacts_zip_refresh=post_lock_release_atomic');
    assertContains(
      script,
      'automation_v2_zip_with_timeout "$ZIP_TIMEOUT_SECONDS" "$tmp" "$AUTOMATION_REPO_ROOT" "artifacts"',
    );
    assertContains(
      script,
      'automation_refresh_final_artifacts_zip "$ZIP_TIMEOUT_SECONDS" "$AUTOMATION_REPO_ROOT" "$AUTOMATION_RUN_DIR"',
    );
    assert.doesNotMatch(script, /rel="\$\{AUTOMATION_RUN_DIR#/);
  }
});

test('progress, start, and stop helpers match the no-service artifact contract', () => {
  const check = read('check_progress.sh');
  const watch = read('watch_progress.sh');
  const open = read('open_log.sh');
  const start = read('start.sh');
  const stop = read('stop.sh');
  assert.match(check, /autonomous_implementation_\*/);
  assert.match(check, /autonomous_bugfix_\*/);
  assert.match(check, /paper_evaluation_\*/);
  assert.match(check, /paper_autopilot_\*/);
  assert.match(check, /bugfix_autopilot_\*/);
  assert.match(check, /campaign_coverage\.tsv/);
  assert.match(check, /rounds\.tsv/);
  assert.match(check, /child_result\.env/);
  assert.match(check, /final-summary\.md/);
  assert.match(check, /cycles\/cycle_/);
  assert.match(check, /bws-root-wrapper-runtime\.mjs runtime-summary/);
  assert.match(watch, /--fast/);
  assert.match(watch, /--base-url/);
  assert.match(watch, /progress_source=local_artifacts_no_service/);
  assert.match(open, /--controller/);
  assert.match(open, /--codex/);
  assert.match(open, /--paper/);
  assert.match(open, /--bugfix/);
  assert.match(open, /--implementation/);
  assert.match(open, /--runtime/);
  assert.match(open, /--role/);
  assert.match(open, /--round/);
  assert.match(start, /node scripts\/restore-required-executable-bits\.js/);
  assert.match(start, /bws-root-wrapper-runtime\.mjs start/);
  assert.doesNotMatch(start, /scripts\/load-node-runtime\.sh/);
  assert.doesNotMatch(start, /source .*nvm/);
  assert.match(stop, /bws-root-wrapper-runtime\.mjs stop/);
});

test('implementation controller exposes canonical flags and telegram wiring', () => {
  const script = read('run-autonomous-implementation.sh');
  for (const marker of [
    '--model MODEL','--fallback-model MODEL','--repo-dir PATH','--cycle-timeout VALUE',
    '--validation-timeout VALUE','--install-timeout VALUE','--zip-timeout VALUE','--max-cycles N',
    '--sandbox MODE','--auto-install','--allow-parallel','--handover-paper-mode','--handover-bugfix-audit','--print-config',
    '--stream','--no-stream','No --task flag is supported','docs/automation/current-implementation-task.md',
    'telegram_notify_send_final "run-autonomous-implementation.sh"','automation_require_cycle_artifacts',
    'automation_read_continue_status','check_only_validation_failed','AUTONOMOUS_GOAL_COMPLETE=yes',
    'BLOCKED=yes','exit 3','Activate the repo runtime in the parent shell first','never sources nvm.sh','baseline_validation=enabled','strict_handoff_parser=enabled','exact_handoff_protected_allowlist=enabled','task_file_exact_protected_allowlist=enabled','manual_blanket_protected_override=disabled','configure_task_file_protected_policy()','read_optional_task_marker()','strict_schema_v1_key_allowlists=enabled','source_evidence_sha256_verification=enabled','source_fingerprint_reconciliation=enabled','input_handoff_immutable=enabled','machine_readable_final_stdout=enabled','lock_acquisition_before_run_dir=enabled','lock_release_failure_classification=enabled','lock_release_failed_lock_preserved',"printf 'lock_release_status=%s\\n'","printf 'lock_preserved=%s\\n'",'write_consumed_handoff_marker','remove_consumed_handoff_marker',
  ]) assertContains(script, marker);
  assert.doesNotMatch(script, /scripts\/load-node-runtime\.sh/);
  assert.doesNotMatch(script, /source .*nvm/);
  assert.doesNotMatch(script, /protected_changes_allowed=manual_explicit_override/);
  assert.match(script, /AUTOMATION_ALLOW_PROTECTED_CHANGES=1 is forbidden without task-file or handoff authorization/);
  assert.match(script, /Bounded repo-owned loopback child processes may be started only inside task-required tests or validation\./);
});

test('bugfix controller is strict read-only audit and handoff infrastructure', () => {
  const script = read('run-autonomous-bugfix.sh');
  for (const marker of [
    '--from-artifacts PATH','--bugfix-focus-file PATH','--campaign-area SLUG','--handover-autonomous-implementation',
    'Read-only source bug-audit','It must not patch app source directly','BUGFIX_AUDIT_COMPLETE=yes',
    'HANDOVER_AUTONOMOUS_IMPLEMENTATION=yes','strict_request_flags=enabled','BUG_SIGNATURE',
    'SOURCE_EVIDENCE_SHA256','artifact_hint_resolved_before_run_dir=yes','source_mutation_detected=yes',
    'telegram_notify_send_final "$SCRIPT_NAME"',"printf 'run_dir=%s\\n'","printf 'final_status=%s\\n'",'lock_acquisition_before_run_dir=enabled','lock_release_failure_classification=enabled','lock_release_failed_lock_preserved','unexpected_controller_exit',"printf 'lock_release_status=%s\\n'","printf 'lock_preserved=%s\\n'",
  ]) assertContains(script, marker);
  assert.doesNotMatch(script, /AUTONOMOUS_GOAL_COMPLETE=yes/);
  assert.doesNotMatch(script, /scripts\/load-node-runtime\.sh|source .*nvm/);
});


test('bugfix artifact evidence is resolved before the active run directory exists', () => {
  const script = read('run-autonomous-bugfix.sh');
  const resolveTask = script.indexOf('resolve_task_source');
  const resolveEvidence = script.indexOf('ARTIFACT_HINT="$(resolve_artifact_hint || true)"');
  const acquireLock = script.indexOf('automation_acquire_lock "$SCRIPT_NAME" "$AUTOMATION_REPO_ROOT"', resolveEvidence);
  const createRun = script.indexOf('automation_create_run_dir autonomous_bugfix');
  assert.ok(resolveTask >= 0);
  assert.ok(resolveEvidence > resolveTask);
  assert.ok(acquireLock > resolveEvidence);
  assert.ok(createRun > acquireLock);
});

test('shared source fingerprint detects edits to an already-dirty tracked file', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'surebet-source-fingerprint-'));
  const tracked = join(tempRoot, 'tracked.txt');
  const helper = join(REPO_ROOT, '.automation', 'lib', 'run_common.sh');
  const fingerprint = (): string => execFileSync(
    'bash',
    ['-lc', '. "$HELPER_PATH"; automation_source_tree_fingerprint "$1"', 'bash', tempRoot],
    { encoding: 'utf-8', env: { ...process.env, HELPER_PATH: helper } },
  ).trim();

  try {
    execFileSync('git', ['init', '-q'], { cwd: tempRoot });
    writeFileSync(tracked, 'base\n', 'utf-8');
    execFileSync('git', ['add', 'tracked.txt'], { cwd: tempRoot });
    writeFileSync(tracked, 'dirty version one\n', 'utf-8');
    const firstDirtyFingerprint = fingerprint();

    writeFileSync(tracked, 'dirty version two\n', 'utf-8');
    const secondDirtyFingerprint = fingerprint();
    assert.notEqual(secondDirtyFingerprint, firstDirtyFingerprint);

    writeFileSync(join(tempRoot, 'artifacts.zip'), 'runtime evidence\n', 'utf-8');
    assert.equal(fingerprint(), secondDirtyFingerprint, 'runtime artifacts must be excluded');
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('paper evaluation controller exposes canonical no-service private fixture and pinned-bundle contract', () => {
  const script = read('run-paper-evaluation.sh');
  for (const marker of [
    '--adaptive','--keep-monitoring-when-ready','--model MODEL','--fallback-model MODEL','--repo-dir PATH',
    '--runtime-evidence','runtime_evidence_mode=',
    '--check-only','--codex-phase-timeout VALUE','--validation-timeout VALUE','--zip-timeout VALUE','SUREBET_PINNED_BUNDLE',
    'SUREBET_REQUIRE_PINNED_BUNDLE','SUREBET_REQUIRE_PINNED_BUNDLE must be unset, 0, or 1',
    'validate_pinned_bundle_preflight()','automation_run_argv_command','controller_mode=single_pass_no_service',
    'verify_paper_read_only_state()','PAPER_EVALUATION_BLOCKED_SOURCE_MUTATION','paper_service_lifecycle=none',
    'PAPER_EVALUATION_READY_PRIVATE_FIXTURE_ONLY_BLOCKED_ON_PINNED_BUNDLE',
    'PAPER_EVALUATION_READY_RUNTIME_EVIDENCE_LOCAL_ONLY',
    'PAPER_EVALUATION_BLOCKED_RUNTIME_OWNERSHIP_AMBIGUOUS',
    'PAPER_EVALUATION_PINNED_BUNDLE_ACCEPTED_PRIVATE_REPORT_WRITTEN',
    'PAPER_EVALUATION_BLOCKED_INVALID_PINNED_BUNDLE','paper-mode-to-autonomous-implementation.env',
    'HANDOVER_SCHEMA_VERSION=1','SOURCE_EVIDENCE_SHA256','automation_v2_add_or_verify_fingerprint','automation_v2_write_env_atomic',
    'canonical_paper_handoff_schema=1','atomic_paper_handoff=enabled','bounded_artifacts_zip=enabled',
    'atomic_standalone_lock_acquisition=enabled','lock_acquisition_before_run_dir=enabled',
    'lock_release_failure_classification=enabled','lock_preservation_on_release_failure=enabled',
    'PAPER_EVALUATION_BLOCKED_LOCK_RELEASE',"printf 'lock_release_status=%s\\n'","printf 'lock_preserved=%s\\n'",
    'telegram_notify_send_final "run-paper-evaluation.sh"','automation_v2_zip_with_timeout',
    'Activate the repo runtime in the parent shell first','Does not source nvm.sh','local rc=$?',
    "printf 'paper_result=%s\\n'",
  ]) assertContains(script, marker);
  assert.doesNotMatch(script, /finish\(\) \{\n\s*local rc\n\s*rc=\$\?/);
  assert.doesNotMatch(script, /scripts\/load-node-runtime\.sh/);
  assert.doesNotMatch(script, /run-autonomous-bugfix\.sh --from-artifacts/);
  assert.doesNotMatch(script, /--bundle \$\{PINNED_BUNDLE_PATH\}/);
  assert.doesNotMatch(script, /--bundle \$\{LOCAL_FIXTURE_BUNDLE\}/);
  assert.doesNotMatch(script, /paper_shell_quote\(\)/);
  assert.doesNotMatch(script, /PAPER_EVALUATION_UNSUPPORTED_FOR_THIS_REPO/);
});


test('paper autopilot controller exposes runtime-evidence parent supervisor contract', () => {
  const script = read('run-paper-autopilot.sh');
  for (const marker of [
    'Parent runtime-evidence paper/autonomous supervisor for betting-win-surebet',
    '--paper-duration VALUE',
    '--implementation-duration VALUE',
    '--max-same-handoff N',
    '--paper-codex-timeout VALUE',
    '--implementation-cycle-timeout VALUE',
    'paper_autopilot',
    'run-paper-evaluation.sh',
    'run-autonomous-implementation.sh',
    '--runtime-evidence',
    'PAPER_AUTOPILOT_READY_RUNTIME_EVIDENCE_LOCAL_ONLY',
    'PAPER_AUTOPILOT_BLOCKED_RUNTIME_OWNERSHIP_AMBIGUOUS',
    'PAPER_AUTOPILOT_BLOCKED_RUNTIME_STOP_FAILED',
    'PAPER_AUTOPILOT_BLOCKED_RUNTIME_EVIDENCE_COLLECTION_FAILED',
    'PAPER_AUTOPILOT_BLOCKED_IMPLEMENTATION_NOOP',
    'PRIVATE_PAPER_REEVALUATION_REQUIRED',
    'canonical_paper_handoff_required=enabled',
    'legacy_paper_handoff_normalization=disabled',
    'validate_paper_handoff()',
    'SOURCE_EVIDENCE_SHA256',
    'cross_controller_lock_guard=enabled',
    'atomic_parent_lock_acquisition=enabled',
    'parent_child_cleanup_failure_classification=enabled',
    'parent_lock_release_failure_classification=enabled',
    'lock_preservation_on_child_identity_failure=enabled',
    'PAPER_AUTOPILOT_BLOCKED_CHILD_IDENTITY',
    'PAPER_AUTOPILOT_BLOCKED_CHILD_RESULT',
    'child_terminal_result_transport=atomic_side_channel_v1',
    'child_stdout_machine_parsing=disabled',
    'AUTOMATION_CHILD_RESULT_FILE=$terminal_result',
    'automation_v2_validate_child_result_file',
    'PAPER_AUTOPILOT_BLOCKED_LOCK_RELEASE',
    'child_telegram_notifications=suppressed_by_parent',
    'parent_telegram_notification=final_only',
    '"TELEGRAM_NOTIFY=0"',
    "printf 'lock_release_status=%s\\n'",
    'paper_service_lifecycle=full_stack_owned',
    'RUNTIME_EVIDENCE_SELECTED_UPSTREAM_MODE',
    'RUNTIME_EVIDENCE_CAMPAIGN_RUN_ID',
    'telegram_notify_send_final "run-paper-autopilot.sh"',
    'never sources nvm.sh',
  ]) assertContains(script, marker);
  assert.doesNotMatch(script, /scripts\/load-node-runtime\.sh/);
  assert.doesNotMatch(script, /bash \.\/start\.sh/);
  assert.doesNotMatch(script, /bash \.\/stop\.sh/);
  assert.doesNotMatch(script, /forever|MongoDB/);
});

test('paper smoke and compatibility wrappers do not pre-create artifact outputs', () => {
  const config = read('automation.config.sh');
  const pinnedSmoke = read('commands/run-pinned-interface-smoke.sh');
  const paperWrapper = read('commands/run-sure-paper-mode-autonomous.sh');
  assertContains(config, 'run-paper-evaluation.sh is surebet-specific: fixture mode plus local-only runtime-evidence mode.');
  assertContains(config, 'SUREBET_REQUIRE_PINNED_BUNDLE');
  assertContains(config, 'AUTOMATION_PAPER_AUTOPILOT_COMMAND');
  assertContains(config, 'AUTOMATION_PAPER_COMMAND="$AUTOMATION_PAPER_AUTOPILOT_COMMAND"');
  assert.doesNotMatch(config, /mkdir -p artifacts\/private-paper-mode/);
  assert.doesNotMatch(pinnedSmoke, /scripts\/load-node-runtime\.sh/);
  assert.doesNotMatch(pinnedSmoke, /mkdir -p "\$out_dir"/);
  assertContains(pinnedSmoke, 'node cli.js local-report');
  assertContains(paperWrapper, 'run-paper-autopilot.sh');
  assertContains(paperWrapper, '--max-same-handoff');
});

test('status docs record the hardened controller surface', () => {
  const status = read('docs/repo_status_current.md');
  assertContains(status, 'run_autonomous_implementation=standardized_and_selected_for_remaining_operator_runtime');
  assertContains(status, 'run_autonomous_bugfix=standardized_standalone_audit');
  assertContains(status, 'run_bugfix_autopilot=standardized_parent_for_broad_audit_and_repair');
  assertContains(status, 'run_paper_evaluation=fixture_and_runtime_evidence_validated_bws_588');
  assertContains(status, 'run_paper_evaluation=fixture_and_runtime_evidence_validated_bws_588');
  assertContains(status, 'run_paper_autopilot=runtime_evidence_parent_validated_bws_589_ready_for_bws_600');
});

test('obsolete stop and paper-12h helpers are not present', () => {
  for (const rel of ['run-paper-evaluation-12h.sh', 'stop-autonomous-run.sh', 'scripts/stop-autonomous-run.sh']) {
    assert.equal(existsSync(join(REPO_ROOT, rel)), false, `${rel} should be removed`);
  }
});

test('task-file protected maintenance requires both the exact task markers and the explicit environment gate', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'surebet-task-protected-policy-'));
  const harnessScript = join(tempRoot, 'controller-functions.sh');
  const taskFile = join(tempRoot, 'task.md');
  const shell = String.raw`
set -Eeuo pipefail
awk '/^parse_args "\$@"/ { exit } { print }' "$REPO_ROOT/run-autonomous-implementation.sh" \
  | sed "s|^SCRIPT_DIR=.*|SCRIPT_DIR=\"$REPO_ROOT\"|" > "$1"
. "$1"
automation_load_config
TASK_SOURCE="$2"
ACTIVE_HANDOFF_MODE=none
configure_task_file_protected_policy
printf 'maintenance=%s\nallowlist=%s\n' \
  "$ACTIVE_HANDOFF_AUTOMATION_MAINTENANCE_ALLOWED" \
  "$ACTIVE_HANDOFF_ALLOWED_PROTECTED_FILES"
`;

  try {
    writeFileSync(
      taskFile,
      'automation_maintenance_allowed=yes\nallowed_protected_files=start.sh,stop.sh\n',
      'utf-8',
    );
    const success = execFileSync(
      'bash',
      ['-lc', shell, 'bash', harnessScript, taskFile],
      {
        encoding: 'utf-8',
        env: {
          ...process.env,
          AUTOMATION_ALLOW_PROTECTED_CHANGES: '1',
          REPO_ROOT,
        },
      },
    );
    assert.match(success, /maintenance=yes/);
    assert.match(success, /allowlist=start\.sh,stop\.sh/);

    assert.throws(() => execFileSync(
      'bash',
      ['-lc', shell, 'bash', harnessScript, taskFile],
      {
        encoding: 'utf-8',
        env: {
          ...process.env,
          AUTOMATION_ALLOW_PROTECTED_CHANGES: '0',
          REPO_ROOT,
        },
        stdio: 'pipe',
      },
    ));

    writeFileSync(
      taskFile,
      'automation_maintenance_allowed=no\nallowed_protected_files=none\n',
      'utf-8',
    );
    assert.throws(() => execFileSync(
      'bash',
      ['-lc', shell, 'bash', harnessScript, taskFile],
      {
        encoding: 'utf-8',
        env: {
          ...process.env,
          AUTOMATION_ALLOW_PROTECTED_CHANGES: '1',
          REPO_ROOT,
        },
        stdio: 'pipe',
      },
    ));

    writeFileSync(
      taskFile,
      'automation_maintenance_allowed=yes\nautomation_maintenance_allowed=yes\nallowed_protected_files=start.sh\n',
      'utf-8',
    );
    assert.throws(() => execFileSync(
      'bash',
      ['-lc', shell, 'bash', harnessScript, taskFile],
      {
        encoding: 'utf-8',
        env: {
          ...process.env,
          AUTOMATION_ALLOW_PROTECTED_CHANGES: '1',
          REPO_ROOT,
        },
        stdio: 'pipe',
      },
    ));


    writeFileSync(
      taskFile,
      'automation_maintenance_allowed=yes\nallowed_protected_files=start.sh,start.sh\n',
      'utf-8',
    );
    assert.throws(() => execFileSync(
      'bash',
      ['-lc', shell, 'bash', harnessScript, taskFile],
      {
        encoding: 'utf-8',
        env: {
          ...process.env,
          AUTOMATION_ALLOW_PROTECTED_CHANGES: '1',
          REPO_ROOT,
        },
        stdio: 'pipe',
      },
    ));
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
