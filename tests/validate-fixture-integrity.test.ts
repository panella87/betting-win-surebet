import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const ROOT = process.cwd();
const VALIDATOR = join(ROOT, 'scripts', 'validate_fixture_integrity.py');
const NOTES = 'Historical local fake fixture for validator regression only. Not a betting-win export, upstream lock, BWS-100 proof, or BWS-130 intake evidence.';

function makeFixture(override: Record<string, unknown> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), 'bws-fixture-integrity-'));
  const validator = join(dir, 'scripts', 'validate_fixture_integrity.py');
  mkdirSync(dirname(validator), { recursive: true });
  copyFileSync(VALIDATOR, validator);
  for (const rel of ['betting-win-exports', 'complete-set', 'settlement', 'pinned-interface-placeholder']) {
    const fixtureDir = join(dir, 'tests', 'fixtures', rel);
    mkdirSync(fixtureDir, { recursive: true });
    writeFileSync(join(fixtureDir, '.gitkeep'), '', 'utf-8');
  }
  writeFileSync(join(dir, 'tests/fixtures/pinned-interface-placeholder/local-placeholder.json'), JSON.stringify({
    schema: 'betting-win-surebet-bootstrap-placeholder-v1',
    generatedBy: 'betting-win-surebet',
    fixtureKind: 'historical_bootstrap_placeholder',
    mode: 'local_fixture_regression_only',
    providerConnection: 'prohibited',
    status: 'superseded_by_bws_full_platform_program',
    notes: NOTES,
    records: [],
    ...override,
  }, null, 2) + '\n', 'utf-8');
  return dir;
}

test('fixture validator accepts only the historical non-evidence placeholder', () => {
  const dir = makeFixture();
  try {
    const output = execFileSync('python3', ['scripts/validate_fixture_integrity.py'], { cwd: dir, encoding: 'utf-8', stdio: 'pipe' });
    assert.match(output, /validate_fixture_integrity: ok/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('fixture validator rejects placeholder metadata shaped as upstream evidence', () => {
  const dir = makeFixture({ commitSha: 'a'.repeat(40) });
  try {
    assert.throws(() => execFileSync('python3', ['scripts/validate_fixture_integrity.py'], { cwd: dir, encoding: 'utf-8', stdio: 'pipe' }), /upstream-evidence-shaped key: commitSha/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
