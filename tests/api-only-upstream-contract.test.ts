import { enforceBwsApiOnlyProcessEnvironment } from '../packages/bootstrap/src/cli/api-only-upstream.js';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..', '..');

function run(command: string, args: string[], env: NodeJS.ProcessEnv = {}) {
  return spawnSync(command, args, { cwd: repoRoot, env: { ...process.env, ...env }, encoding: 'utf8' });
}

test('API-only upstream validator accepts active runtime surfaces', () => {
  const result = run('python3', ['scripts/validate_api_only_upstream.py'], { BWS_UPSTREAM_MODE: 'export' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /API_ONLY_UPSTREAM_CONTRACT_OK/);
});

for (const script of ['run-paper-evaluation.sh', 'run-paper-autopilot.sh']) {
  test(`${script} reports fixed API mode even with a stale selector`, () => {
    const result = run('bash', [`./${script}`, '--print-config'], { BWS_UPSTREAM_MODE: 'export' });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /^upstream_mode=api$/m);
    assert.doesNotMatch(result.stdout, /^upstream_mode=export$/m);
  });
}


test('active CLI compatibility environment ignores stale export selection and fixes API mode', () => {
  const environment: NodeJS.ProcessEnv = {
    BWS_UPSTREAM_MODE: 'export',
    BWS_UPSTREAM_EXPORT_SELECTION_PATH: 'config/obsolete-export.json',
  };
  const result = enforceBwsApiOnlyProcessEnvironment(environment);
  assert.equal(result.BWS_UPSTREAM_MODE, 'api');
  assert.equal(result.BWS_UPSTREAM_EXPORT_SELECTION_PATH, undefined);
});

test('root package and CLI expose no export runtime command', () => {
  const packageJson = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8')) as { scripts: Record<string,string> };
  assert.equal(packageJson.scripts['runtime:upstream-export'], undefined);
  const cli = readFileSync(resolve(repoRoot, 'cli.js'), 'utf8');
  const barrel = readFileSync(resolve(repoRoot, 'packages/bootstrap/src/index.ts'), 'utf8');
  const retiredCli = readFileSync(resolve(repoRoot, 'packages/bootstrap/src/cli/bws-upstream-export-convergence.ts'), 'utf8');
  assert.doesNotMatch(cli, /runtime-upstream-export/);
  assert.doesNotMatch(barrel, /cli\/bws-upstream-export-convergence/);
  assert.match(retiredCli, /export runtime has been removed/);
});
