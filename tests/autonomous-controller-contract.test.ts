import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
function read(rel: string): string { return readFileSync(join(REPO_ROOT, rel), 'utf-8'); }

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
  assert.match(read('.automation/lib/telegram_notify.sh'), /telegram_notify_send_final\(\)/);
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

test('implementation controller keeps 72h default and prompt-file task contract', () => {
  const script = read('run-autonomous-implementation.sh');
  assert.match(script, /Default duration: 72h\./);
  assert.match(script, /--prompt-file/);
  assert.match(script, /docs\/automation\/current-implementation-task\.md/);
  assert.match(script, /No --task flag is supported/);
  assert.match(script, /automation_build_artifacts_zip/);
});

test('paper evaluation controller preserves adaptive wait and bugfix handoff', () => {
  const script = read('run-paper-evaluation.sh');
  assert.match(script, /--adaptive/);
  assert.match(script, /wait interval between paper evaluation cycles/);
  assert.match(script, /run-autonomous-bugfix\.sh --from-artifacts/);
  assert.match(script, /automation_build_artifacts_zip/);
});

test('bugfix controller combines reactive and proactive audit without mode flags', () => {
  const script = read('run-autonomous-bugfix.sh');
  assert.match(script, /--from-artifacts/);
  assert.match(script, /Reactive evidence/);
  assert.match(script, /Proactive audit/);
  assert.doesNotMatch(script, /--mode/);
  assert.match(script, /automation_build_artifacts_zip/);
});

test('obsolete stop and paper-12h helpers are not present', () => {
  for (const rel of ['run-paper-evaluation-12h.sh', 'stop-autonomous-run.sh', 'scripts/stop-autonomous-run.sh']) {
    assert.equal(existsSync(join(REPO_ROOT, rel)), false, `${rel} should be removed`);
  }
});
