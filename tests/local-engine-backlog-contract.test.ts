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
  const runner = read('docs/automation/autonomous-implementation.md');
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
  assert.match(runner, /repo-local backlogs are complete/);
  assert.match(runner, /Do not invent/);
  assert.match(status, /safe SURE-002A local implementation backlog/);
});

test('completed local backlog docs point to the pinned betting-win interface gate', () => {
  const agents = read('AGENTS.md');
  const readme = read('README.md');
  const scope = read('docs/001_scope_and_boundaries.md');
  const runbook = read('docs/012_runbook.md');
  const handoff = read('docs/016_pinned_betting_win_interface_readiness.md');

  assert.match(agents, /maximum safe local SURE-002A implementation backlog is complete/);
  assert.match(agents, /Do not invent more local engine work/);
  assert.match(readme, /SURE-002A local interface and engine bootstrap = complete for local fixtures/);
  assert.match(readme, /AUTONOMOUS_GOAL_COMPLETE=yes/);
  assert.match(scope, /SURE-002A local fixture engine = complete/);
  assert.match(runbook, /Expected state after SURE-002A local bootstrap/);
  assert.match(handoff, /Required pinned interface from betting-win/);
  assert.match(handoff, /reference\.source=betting-win/);
});

test('local engine command delegates to the standardized root implementation controller', () => {
  const command = read('commands/run-sure-local-engine-autonomous.sh');

  assert.doesNotMatch(command, /scripts\/load-node-runtime\.sh/);
  assert.doesNotMatch(command, /npm install/);
  assert.doesNotMatch(command, /npm run validate/);
  assert.match(command, /run-autonomous-implementation\.sh/);
  assert.match(command, /--duration 72h/);
  assert.match(command, /--model cli-default/);
  assert.match(command, /--fallback-model none/);
  assert.match(command, /--cycle-timeout 2h/);
  assert.match(command, /--validation-timeout 20m/);
});
