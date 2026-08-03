import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(process.cwd());

test('boundary validators scan active packages and apps workspace source', (t) => {
  const providerFixture = createValidatorFixture(t, 'validate_no_provider_connections.py');
  mkdirSync(join(providerFixture.root, 'packages', 'example'), { recursive: true });
  writeJson(join(providerFixture.root, 'packages', 'example', 'package.json'), {
    dependencies: {
      ethers: '1.0.0',
    },
    name: '@example/provider-probe',
    version: '1.0.0',
  });
  const providerResult = runValidator(providerFixture.root, 'validate_no_provider_connections.py');
  assert.notEqual(providerResult.status, 0);
  assert.match(combinedOutput(providerResult), /forbidden dependency in packages\/example\/package\.json: ethers/);

  const contractFixture = createValidatorFixture(t, 'validate_contract_boundary.py');
  mkdirSync(join(contractFixture.root, 'apps', 'example', 'src'), { recursive: true });
  const forbiddenDatabaseEnvironmentName = ['PG', 'HOST'].join('');
  writeFileSync(
    join(contractFixture.root, 'apps', 'example', 'src', 'index.ts'),
    `export const host = process.env.${forbiddenDatabaseEnvironmentName};\n`,
    'utf-8',
  );
  const contractResult = runValidator(contractFixture.root, 'validate_contract_boundary.py');
  assert.notEqual(contractResult.status, 0);
  assert.match(combinedOutput(contractResult), /direct database environment found in apps\/example\/src\/index\.ts/);

  const executionFixture = createValidatorFixture(t, 'validate_no_execution_paths.py');
  mkdirSync(join(executionFixture.root, 'packages', 'example', 'src'), { recursive: true });
  writeFileSync(
    join(executionFixture.root, 'packages', 'example', 'src', 'index.ts'),
    'export function createOrder(): void {}\n',
    'utf-8',
  );
  const executionResult = runValidator(executionFixture.root, 'validate_no_execution_paths.py');
  assert.notEqual(executionResult.status, 0);
  assert.match(combinedOutput(executionResult), /execution identifier found in executable source packages\/example\/src\/index\.ts/);
});

test('boundary validators accept clean active workspace source fixtures', (t) => {
  for (const validator of [
    'validate_no_provider_connections.py',
    'validate_contract_boundary.py',
    'validate_no_execution_paths.py',
  ]) {
    const fixture = createValidatorFixture(t, validator);
    mkdirSync(join(fixture.root, 'packages', 'example', 'src'), { recursive: true });
    mkdirSync(join(fixture.root, 'apps', 'example', 'src'), { recursive: true });
    writeFileSync(join(fixture.root, 'packages', 'example', 'src', 'index.ts'), 'export const status = "ready";\n', 'utf-8');
    writeFileSync(join(fixture.root, 'apps', 'example', 'src', 'index.ts'), 'export const status = "ready";\n', 'utf-8');

    const result = runValidator(fixture.root, validator);
    assert.equal(result.status, 0, combinedOutput(result));
  }
});

function createValidatorFixture(t: TestContext, validatorName: string): Readonly<{ readonly root: string }> {
  const root = mkdtempSync(join(tmpdir(), 'bws-boundary-validator-'));
  t.after(() => {
    rmSync(root, {
      force: true,
      maxRetries: 3,
      recursive: true,
      retryDelay: 100,
    });
  });
  mkdirSync(join(root, 'scripts'), { recursive: true });
  mkdirSync(join(root, 'src'), { recursive: true });
  mkdirSync(join(root, 'tests'), { recursive: true });
  copyFileSync(join(REPO_ROOT, 'scripts', validatorName), join(root, 'scripts', validatorName));
  writeJson(join(root, 'package.json'), {
    dependencies: {},
    devDependencies: {},
    name: 'boundary-validator-fixture',
    optionalDependencies: {},
    private: true,
    version: '1.0.0',
    workspaces: ['packages/*', 'apps/*'],
  });
  writeJson(join(root, 'tsconfig.json'), {
    include: ['apps/**/*.ts', 'packages/**/*.ts', 'src/**/*.ts', 'tests/**/*.ts'],
  });
  return Object.freeze({ root });
}

function runValidator(root: string, validatorName: string): ReturnType<typeof spawnSync> {
  return spawnSync('python3', [join(root, 'scripts', validatorName)], {
    cwd: root,
    encoding: 'utf-8',
    stdio: 'pipe',
  });
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

function combinedOutput(result: ReturnType<typeof spawnSync>): string {
  return `${String(result.stdout)}\n${String(result.stderr)}`;
}
