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
  assert.match(read('.automation/lib/controller_hardening_v2.sh'), /automation_v2_load_env_strict\(\)/);
  assert.match(read('.automation/lib/controller_hardening_v2.sh'), /automation_v2_semantic_env_fingerprint_loaded\(\)/);
  assert.match(read('.automation/lib/controller_hardening_v2.sh'), /automation_v2_extract_unique_machine_value\(\)/);
  assert.match(read('.automation/lib/telegram_notify.sh'), /telegram_notify_send_final\(\)/);
  assert.match(read('.automation/lib/telegram_notify.sh'), /telegram_notify_build_final_message\(\)/);
  assert.match(read('.automation/lib/telegram_notify.sh'), /telegram_notify_message_version\(\)/);
  assert.match(read('.automation/lib/telegram_notify.sh'), /20260706\.pretty_v2_html_cards/);
  assert.match(read('.automation/lib/telegram_notify.sh'), /parse_mode: 'HTML'/);
});

test('daily git and packaging helpers match the standardized contract', () => {
  const updateGit = read('update_git.sh');
  const zipCodebase = read('zip_codebase.sh');
  const pullAndZip = read('pull_artifacts_and_zip_codebase.sh');
  assert.match(updateGit, /git pull --ff-only --autostash/);
  assert.match(updateGit, /GIT_ASKPASS/);
  assert.doesNotMatch(updateGit, /require_clean_tree_for_sync/);
  assert.match(zipCodebase, /--artifacts-only/);
  assert.match(zipCodebase, /created_zip=%s/);
  assert.match(zipCodebase, /sha256=%s/);
  assert.match(zipCodebase, /zc_is_artifacts_excluded_path\(\)/);
  assert.match(pullAndZip, /REMOTE_ARTIFACT/);
  assert.match(pullAndZip, /bash \.\/zip_codebase\.sh/);
  assert.doesNotMatch(pullAndZip, /source .*automation\.config\.sh|\. automation\.config\.sh/);
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
  assert.match(watch, /--fast/);
  assert.match(watch, /--base-url/);
  assert.match(watch, /progress_source=local_artifacts_no_service/);
  assert.match(open, /--controller/);
  assert.match(open, /--codex/);
  assert.match(open, /--paper/);
  assert.match(open, /--bugfix/);
  assert.match(open, /--implementation/);
  assert.match(open, /--round/);
  assert.match(start, /node scripts\/restore-required-executable-bits\.js/);
  assert.match(start, /npm run validate/);
  assert.doesNotMatch(start, /scripts\/load-node-runtime\.sh/);
  assert.doesNotMatch(start, /source .*nvm/);
  assert.match(stop, /has no long-running service/);
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
    'BLOCKED=yes','exit 3','Activate the repo runtime in the parent shell first','never sources nvm.sh','baseline_validation=enabled','strict_handoff_parser=enabled','machine_readable_final_stdout=enabled',
  ]) assertContains(script, marker);
  assert.doesNotMatch(script, /scripts\/load-node-runtime\.sh/);
  assert.doesNotMatch(script, /source .*nvm/);
});

test('bugfix controller is strict read-only audit and handoff infrastructure', () => {
  const script = read('run-autonomous-bugfix.sh');
  for (const marker of [
    '--from-artifacts PATH','--bugfix-focus-file PATH','--campaign-area SLUG','--handover-autonomous-implementation',
    'Read-only source bug-audit','It must not patch app source directly','BUGFIX_AUDIT_COMPLETE=yes',
    'HANDOVER_AUTONOMOUS_IMPLEMENTATION=yes','strict_request_flags=enabled','BUG_SIGNATURE',
    'SOURCE_EVIDENCE_SHA256','artifact_hint_resolved_before_run_dir=yes','source_mutation_detected=yes',
    'telegram_notify_send_final "$SCRIPT_NAME"',"printf 'run_dir=%s\\n'","printf 'final_status=%s\\n'",
  ]) assertContains(script, marker);
  assert.doesNotMatch(script, /AUTONOMOUS_GOAL_COMPLETE=yes/);
  assert.doesNotMatch(script, /scripts\/load-node-runtime\.sh|source .*nvm/);
});


test('bugfix artifact evidence is resolved before the active run directory exists', () => {
  const script = read('run-autonomous-bugfix.sh');
  const resolveTask = script.indexOf('resolve_task_source');
  const resolveEvidence = script.indexOf('ARTIFACT_HINT="$(resolve_artifact_hint || true)"');
  const createRun = script.indexOf('automation_create_run_dir autonomous_bugfix');
  assert.ok(resolveTask >= 0);
  assert.ok(resolveEvidence > resolveTask);
  assert.ok(createRun > resolveEvidence);
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
    '--check-only','--codex-phase-timeout VALUE','--validation-timeout VALUE','SUREBET_PINNED_BUNDLE',
    'SUREBET_REQUIRE_PINNED_BUNDLE','SUREBET_REQUIRE_PINNED_BUNDLE must be unset, 0, or 1',
    'validate_pinned_bundle_preflight()','automation_run_argv_command','controller_mode=single_pass_no_service',
    'verify_paper_read_only_state()','PAPER_EVALUATION_BLOCKED_SOURCE_MUTATION','paper_service_lifecycle=none',
    'PAPER_EVALUATION_READY_PRIVATE_FIXTURE_ONLY_BLOCKED_ON_PINNED_BUNDLE',
    'PAPER_EVALUATION_PINNED_BUNDLE_ACCEPTED_PRIVATE_REPORT_WRITTEN',
    'PAPER_EVALUATION_BLOCKED_INVALID_PINNED_BUNDLE','paper-mode-to-autonomous-implementation.env',
    'telegram_notify_send_final "run-paper-evaluation.sh"','automation_build_artifacts_zip',
    'Activate the repo runtime in the parent shell first','Does not source nvm.sh','local rc=$?',
  ]) assertContains(script, marker);
  assert.doesNotMatch(script, /finish\(\) \{\n\s*local rc\n\s*rc=\$\?/);
  assert.doesNotMatch(script, /scripts\/load-node-runtime\.sh/);
  assert.doesNotMatch(script, /run-autonomous-bugfix\.sh --from-artifacts/);
  assert.doesNotMatch(script, /--bundle \$\{PINNED_BUNDLE_PATH\}/);
  assert.doesNotMatch(script, /--bundle \$\{LOCAL_FIXTURE_BUNDLE\}/);
  assert.doesNotMatch(script, /paper_shell_quote\(\)/);
  assert.doesNotMatch(script, /PAPER_EVALUATION_UNSUPPORTED_FOR_THIS_REPO/);
});


test('paper autopilot controller exposes no-service parent supervisor contract', () => {
  const script = read('run-paper-autopilot.sh');
  for (const marker of [
    'Parent no-service paper/autonomous supervisor for betting-win-surebet',
    '--paper-duration VALUE',
    '--implementation-duration VALUE',
    '--max-same-handoff N',
    '--paper-codex-timeout VALUE',
    '--implementation-cycle-timeout VALUE',
    'paper_autopilot',
    'run-paper-evaluation.sh',
    'run-autonomous-implementation.sh',
    'PAPER_AUTOPILOT_BLOCKED_ON_PINNED_BUNDLE',
    'PAPER_AUTOPILOT_BLOCKED_IMPLEMENTATION_NOOP',
    'PRIVATE_PAPER_REEVALUATION_REQUIRED',
    'paper_service_lifecycle=none',
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
  assertContains(config, 'run-paper-evaluation.sh is surebet-specific: no service lifecycle, private fixture/pinned-bundle only.');
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
  assertContains(status, 'run_autonomous_implementation=standardized_with_canonical_flags_and_telegram');
  assertContains(status, 'run_autonomous_bugfix=strict_four_state_read_only_audit_handoff');
  assertContains(status, 'run_bugfix_autopilot=bounded_eight_area_audit_implementation_reaudit_parent');
  assertContains(status, 'run_paper_evaluation_standardization=standardized_with_telegram_no_service_private_fixture_pinned_bundle');
  assertContains(status, 'run_paper_evaluation=canonical_repo_local_private_fixture_and_pinned_bundle_only');
  assertContains(status, 'run_paper_autopilot=standardized_no_service_parent_supervisor');
});

test('obsolete stop and paper-12h helpers are not present', () => {
  for (const rel of ['run-paper-evaluation-12h.sh', 'stop-autonomous-run.sh', 'scripts/stop-autonomous-run.sh']) {
    assert.equal(existsSync(join(REPO_ROOT, rel)), false, `${rel} should be removed`);
  }
});
