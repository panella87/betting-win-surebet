import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const REPO_ROOT = process.cwd();
const VALIDATOR = join(REPO_ROOT, 'scripts', 'validate_fixture_integrity.py');
const PLACEHOLDER_NOTES =
  'Local fake fixture for validator smoke tests only. Not a betting-win export bundle and not SURE-002 readiness evidence.';

function writeFixture(
  root: string,
  override: Partial<{
    schema: string;
    generatedBy: string;
    fixtureKind: string;
    mode: string;
    providerConnection: string;
    status: string;
    notes: string;
    records: unknown[];
    reference: object;
  }> = {},
): void {
  for (const dir of [
    'tests/fixtures/betting-win-exports',
    'tests/fixtures/complete-set',
    'tests/fixtures/settlement',
    'tests/fixtures/pinned-interface-placeholder',
  ]) {
    mkdirSync(join(root, dir), { recursive: true });
    writeFileSync(join(root, dir, '.gitkeep'), '', { encoding: 'utf-8' });
  }

  writeFileSync(
    join(root, 'tests/fixtures/pinned-interface-placeholder/local-placeholder.json'),
    JSON.stringify(
      {
        schema: 'betting-win-surebet-pinned-interface-placeholder-v1',
        generatedBy: 'betting-win-surebet',
        fixtureKind: 'pinned_interface_placeholder',
        mode: 'paper_only',
        providerConnection: 'prohibited',
        status: 'blocked_until_federico_provides_pinned_betting_win_interface',
        notes: PLACEHOLDER_NOTES,
        records: [],
        ...override,
      },
      null,
      2,
    ) + '\n',
    { encoding: 'utf-8' },
  );
}

function makeFixture(
  override: Partial<{
    schema: string;
    generatedBy: string;
    fixtureKind: string;
    mode: string;
    providerConnection: string;
    status: string;
    notes: string;
    records: unknown[];
    reference: object;
  }> = {},
): string {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-fixture-integrity-'));
  const validatorCopy = join(dir, 'scripts', 'validate_fixture_integrity.py');
  mkdirSync(dirname(validatorCopy), { recursive: true });
  copyFileSync(VALIDATOR, validatorCopy);
  writeFixture(dir, override);
  return dir;
}

test('fixture integrity validator accepts the local pinned-interface placeholder smoke fixture', () => {
  const dir = makeFixture();
  try {
    const output = execFileSync('python3', ['scripts/validate_fixture_integrity.py'], {
      cwd: dir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    assert.match(output, /validate_fixture_integrity: ok/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('fixture integrity validator rejects placeholder metadata that claims a real betting-win export shape', () => {
  const dir = makeFixture({
    generatedBy: 'betting-win',
    reference: {
      source: 'betting-win',
      contractVersion: '0.0.0-test',
    },
  });
  try {
    assert.throws(
      () =>
        execFileSync('python3', ['scripts/validate_fixture_integrity.py'], {
          cwd: dir,
          encoding: 'utf-8',
          stdio: 'pipe',
        }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /generatedBy must be 'betting-win-surebet'/);
        return true;
      },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
