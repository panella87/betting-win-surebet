import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(join(REPO_ROOT, rel), 'utf-8');
}

test('local engine backlog authorizes maximum safe implementation without provider or execution work', () => {
  const backlog = read('docs/015_local_engine_implementation_backlog.md');
  const runner = read('run-autonomous-implementation.sh');
  const status = read('docs/repo_status_current.md');

  for (const marker of [
    'SURE-002A_LOCAL_INTERFACE_AND_ENGINE_BOOTSTRAP',
    'local export-bundle schema and parser',
    'SURE-004 stake-vector solver',
    'SURE-005 residual exposure analyzer',
    'SURE-006 settlement replay consumer',
    'SURE-007 private paper report assembler',
    'provider SDK/client imports',
    'profitability claims',
  ]) {
    assert.match(backlog, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(runner, /docs\/015_local_engine_implementation_backlog\.md/);
  assert.match(runner, /first safe unchecked local implementation item/);
  assert.match(runner, /Use CONTINUE_REQUIRED=yes when docs\/015_local_engine_implementation_backlog\.md still has a safe unchecked local implementation item/);
  assert.match(status, /current_task=SURE-002A_LOCAL_INTERFACE_AND_ENGINE_BOOTSTRAP/);
});

test('local engine command keeps the normal validation-before-autonomous contract', () => {
  const command = read('commands/run-sure-local-engine-autonomous.sh');

  assert.match(command, /scripts\/load-node-runtime\.sh/);
  assert.match(command, /restore-required-executable-bits\.js/);
  assert.match(command, /npm install/);
  assert.match(command, /npm run validate/);
  assert.match(command, /run-autonomous-implementation\.sh --duration 72h/);
});
