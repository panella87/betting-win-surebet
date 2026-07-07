import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
function read(rel: string): string { return readFileSync(join(REPO_ROOT, rel), 'utf-8'); }
function escaped(marker: string): RegExp { return new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); }
function assertContains(text: string, marker: string): void { assert.match(text, escaped(marker), `expected marker: ${marker}`); }

test('standard automation root scripts and shared helpers are installed', () => {
  for (const rel of [
    'zip_codebase.sh','pull_artifacts_and_zip_codebase.sh','update_git.sh',
    'check_progress.sh','watch_progress.sh','open_log.sh','start.sh','stop.sh',
    'run-autonomous-implementation.sh','run-paper-evaluation.sh','run-autonomous-bugfix.sh',
    'automation.config.sh','.automation/lib/run_common.sh','.automation/lib/telegram_notify.sh','.automation/README.md',
  ]) {
    assert.equal(existsSync(join(REPO_ROOT, rel)), true, `${rel} should exist`);
  }
  assert.match(read('.automation/lib/run_common.sh'), /automation_acquire_lock\(\)/);
  assert.match(read('.automation/lib/run_common.sh'), /automation_require_cycle_artifacts\(\)/);
  const telegram = read('.automation/lib/telegram_notify.sh');
  assert.match(telegram, /telegram_notify_send_final\(\)/);
  assert.match(telegram, /telegram_notify_build_final_message\(\)/);
  assert.match(telegram, /20260706\.pretty_v2_html_cards/);
  assert.match(telegram, /parse_mode: 'HTML'/);
  assert.match(telegram, /TELEGRAM_NOTIFY_DRY_RUN/);
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
  assert.match(check, /final-summary\.md/);
  assert.match(check, /cycles\/cycle_/);
  assert.match(watch, /--fast/);
  assert.match(watch, /--base-url/);
  assert.match(watch, /progress_source=local_artifacts_no_service/);
  assert.match(open, /--controller/);
  assert.match(open, /--codex/);
  assert.match(open, /--paper/);
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
    '--sandbox MODE','--auto-install','--allow-parallel','--handover-paper-mode','--print-config',
    '--stream','--no-stream','No --task flag is supported','docs/automation/current-implementation-task.md',
    'telegram_notify_send_final "run-autonomous-implementation.sh"','automation_require_cycle_artifacts',
    'automation_read_continue_status','check_only_validation_failed','AUTONOMOUS_GOAL_COMPLETE=yes',
    'BLOCKED=yes','exit 3','Activate the repo runtime in the parent shell first','never sources nvm.sh',
  ]) assertContains(script, marker);
  assert.doesNotMatch(script, /scripts\/load-node-runtime\.sh/);
  assert.doesNotMatch(script, /source .*nvm/);
});

test('bugfix controller is audit and handoff only with telegram wiring', () => {
  const script = read('run-autonomous-bugfix.sh');
  for (const marker of [
    '--from-artifacts PATH','--model MODEL','--fallback-model MODEL','--repo-dir PATH','--cycle-timeout VALUE',
    '--validation-timeout VALUE','--handover-autonomous-implementation','--print-config',
    'audit/handoff controller','It must not patch app source directly','Audit order:','Artifacts first',
    'source_status_snapshot','write_implementation_handoff','autonomous-implementation-handover.env',
    'telegram_notify_send_final "run-autonomous-bugfix.sh"','automation_require_cycle_artifacts',
    'automation_read_continue_status','BLOCKED=yes','exit 3','Activate the repo runtime in the parent shell first',
    'never sources nvm.sh',
  ]) assertContains(script, marker);
  assert.doesNotMatch(script, /Find and fix bug-class issues/);
  assert.doesNotMatch(script, /scripts\/load-node-runtime\.sh/);
  assert.doesNotMatch(script, /source .*nvm/);
});

test('paper evaluation controller exposes canonical no-service private fixture and pinned-bundle contract', () => {
  const script = read('run-paper-evaluation.sh');
  for (const marker of [
    '--adaptive','--keep-monitoring-when-ready','--model MODEL','--fallback-model MODEL','--repo-dir PATH',
    '--check-only','--codex-phase-timeout VALUE','--validation-timeout VALUE','SUREBET_PINNED_BUNDLE',
    'SUREBET_REQUIRE_PINNED_BUNDLE','paper_service_lifecycle=none',
    'PAPER_EVALUATION_READY_PRIVATE_FIXTURE_ONLY_BLOCKED_ON_PINNED_BUNDLE',
    'PAPER_EVALUATION_PINNED_BUNDLE_ACCEPTED_PRIVATE_REPORT_WRITTEN',
    'PAPER_EVALUATION_BLOCKED_INVALID_PINNED_BUNDLE','paper-mode-to-autonomous-implementation.env',
    'telegram_notify_send_final "run-paper-evaluation.sh"','automation_build_artifacts_zip',
    'Activate the repo runtime in the parent shell first','Does not source nvm.sh','local rc=$?',
  ]) assertContains(script, marker);
  assert.doesNotMatch(script, /finish\(\) \{\n\s*local rc\n\s*rc=\$\?/);
  assert.doesNotMatch(script, /scripts\/load-node-runtime\.sh/);
  assert.doesNotMatch(script, /run-autonomous-bugfix\.sh --from-artifacts/);
  assert.doesNotMatch(script, /PAPER_EVALUATION_UNSUPPORTED_FOR_THIS_REPO/);
});

test('paper smoke and compatibility wrappers do not pre-create artifact outputs', () => {
  const config = read('automation.config.sh');
  const pinnedSmoke = read('commands/run-pinned-interface-smoke.sh');
  const paperWrapper = read('commands/run-sure-paper-mode-autonomous.sh');
  assertContains(config, 'run-paper-evaluation.sh is surebet-specific: no service lifecycle, private fixture/pinned-bundle only.');
  assertContains(config, 'SUREBET_REQUIRE_PINNED_BUNDLE');
  assert.doesNotMatch(config, /mkdir -p artifacts\/private-paper-mode/);
  assert.doesNotMatch(pinnedSmoke, /scripts\/load-node-runtime\.sh/);
  assert.doesNotMatch(pinnedSmoke, /mkdir -p "\$out_dir"/);
  assertContains(pinnedSmoke, 'node cli.js local-report');
  assertContains(paperWrapper, 'run-paper-evaluation.sh');
  assertContains(paperWrapper, '--keep-monitoring-when-ready');
});

test('status docs record all three standardized root controllers', () => {
  const status = read('docs/repo_status_current.md');
  assertContains(status, 'run_autonomous_implementation=standardized_with_canonical_flags_and_telegram');
  assertContains(status, 'run_autonomous_bugfix=standardized_audit_handoff_with_telegram');
  assertContains(status, 'run_paper_evaluation_standardization=standardized_with_telegram_no_service_private_fixture_pinned_bundle');
  assertContains(status, 'run_paper_evaluation=canonical_repo_local_private_fixture_and_pinned_bundle_only');
});

test('obsolete stop and paper-12h helpers are not present', () => {
  for (const rel of ['run-paper-evaluation-12h.sh', 'stop-autonomous-run.sh', 'scripts/stop-autonomous-run.sh']) {
    assert.equal(existsSync(join(REPO_ROOT, rel)), false, `${rel} should be removed`);
  }
});
