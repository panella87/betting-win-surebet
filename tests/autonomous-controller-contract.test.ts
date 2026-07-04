import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
function read(rel: string): string { return readFileSync(join(REPO_ROOT, rel), 'utf-8'); }

test('standard automation root scripts are installed with shared helper contract', () => {
  for (const rel of [
    'zip_codebase.sh',
    'pull_artifacts_and_zip_codebase.sh',
    'update_git.sh',
    'run-autonomous-implementation.sh',
    'run-paper-evaluation.sh',
    'run-autonomous-bugfix.sh',
    'automation.config.sh',
    '.automation/lib/run_common.sh',
  ]) {
    assert.equal(existsSync(join(REPO_ROOT, rel)), true, `${rel} should exist`);
  }
  assert.match(read('.automation/lib/run_common.sh'), /automation_acquire_lock\(\)/);
  assert.match(read('.automation/lib/run_common.sh'), /automation_build_artifacts_zip\(\)/);
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
  assert.match(script, /automation_clamp_minutes "\$INTERVAL_MINUTES" 5 60/);
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
