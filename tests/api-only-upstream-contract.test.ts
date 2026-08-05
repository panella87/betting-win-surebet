import { enforceBwsApiOnlyProcessEnvironment } from '../packages/bootstrap/src/cli/api-only-upstream.js';
import { resolveBwsServiceRuntimeConfig } from '../packages/bootstrap/src/operations/service-runtime.js';
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
    BWS_PINNED_EXPORT_PATH: 'config/obsolete-pinned.json',
    BWS_UPSTREAM_EXPORT_FILE: 'config/obsolete-file.json',
    BWS_UPSTREAM_EXPORT_PATH: 'config/obsolete-path.json',
    SUREBET_PINNED_BUNDLE: 'config/obsolete-bundle.json',
  };
  const result = enforceBwsApiOnlyProcessEnvironment(environment);
  assert.equal(result.BWS_UPSTREAM_MODE, 'api');
  assert.equal(result.BWS_UPSTREAM_EXPORT_SELECTION_PATH, undefined);
  assert.equal(result.BWS_PINNED_EXPORT_PATH, undefined);
  assert.equal(result.BWS_UPSTREAM_EXPORT_FILE, undefined);
  assert.equal(result.BWS_UPSTREAM_EXPORT_PATH, undefined);
  assert.equal(result.SUREBET_PINNED_BUNDLE, undefined);
});

test('direct service runtime config rejects retired upstream selectors before ambient fallback', () => {
  for (const environment of [
    { BWS_UPSTREAM_MODE: 'export' },
    { BWS_UPSTREAM_EXPORT_SELECTION_PATH: 'config/obsolete-export.json' },
    { BWS_PINNED_EXPORT_PATH: 'config/obsolete-pinned.json' },
    { BWS_UPSTREAM_EXPORT_FILE: 'config/obsolete-file.json' },
    { BWS_UPSTREAM_EXPORT_PATH: 'config/obsolete-path.json' },
    { SUREBET_PINNED_BUNDLE: 'config/obsolete-bundle.json' },
  ]) {
    assert.throws(
      () => resolveBwsServiceRuntimeConfig(environment as never, repoRoot),
      /BWS service runtime requires BWS_UPSTREAM_MODE=api|is retired for BWS service runtime/,
    );
  }
});

test('API-only static validator covers direct runtime CLI entry points', () => {
  const validator = readFileSync(resolve(repoRoot, 'scripts/validate_api_only_upstream.py'), 'utf8');
  for (const rel of [
    'packages/bootstrap/src/cli/bws-read-only-api.ts',
    'packages/bootstrap/src/cli/bws-private-paper-worker.ts',
    'packages/bootstrap/src/cli/bws-private-paper-worker-service.ts',
    'packages/bootstrap/src/cli/bws-paper-runtime-handoff.ts',
    'packages/bootstrap/src/cli/bws-observability.ts',
  ]) {
    assert.match(validator, new RegExp(rel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
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
