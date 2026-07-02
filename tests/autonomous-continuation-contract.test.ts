import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(join(REPO_ROOT, rel), 'utf-8');
}

test('autonomous prompt continues while safe SURE-001 backlog remains', () => {
  const script = read('run-autonomous-implementation.sh');

  assert.doesNotMatch(script, /Stop after one slice/);
  assert.match(script, /docs\/014_sure_001_remaining_hardening_backlog\.md/);
  assert.match(script, /Continue across cycles while safe documented backlog remains in docs\/014_sure_001_remaining_hardening_backlog\.md or docs\/015_local_engine_implementation_backlog\.md/);
  assert.match(script, /Use CONTINUE_REQUIRED=yes when docs\/014_sure_001_remaining_hardening_backlog\.md still has a safe unchecked SURE-001 item/);
  assert.match(script, /Use AUTONOMOUS_GOAL_COMPLETE=yes only when both backlogs are exhausted/);
  assert.match(script, /Do not stop with AUTONOMOUS_GOAL_COMPLETE=yes after one completed slice/);
});

test('SURE-001 backlog keeps continuation bounded and paper-only', () => {
  const backlog = read('docs/014_sure_001_remaining_hardening_backlog.md');

  assert.match(backlog, /SURE-001 remaining hardening backlog/);
  assert.match(backlog, /SOURCE_MANIFEST\.json regeneration helper/);
  assert.match(backlog, /CONTINUE_REQUIRED=yes/);
  assert.match(backlog, /AUTONOMOUS_GOAL_COMPLETE=yes/);
  assert.match(backlog, /SURE-002\+ remains blocked/);
  assert.match(backlog, /provider connections/);
  assert.match(backlog, /solver implementation/);
});
