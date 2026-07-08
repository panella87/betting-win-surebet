import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const VALIDATE_REPO = join(REPO_ROOT, 'scripts', 'validate_repo.py');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('validate_repo requires critical validator tests as repo assets', () => {
  const validator = read(VALIDATE_REPO);

  for (const marker of [
    'tests/validate-artifact-hygiene.test.ts',
    'tests/validate-shell-local-assignments.test.ts',
    'tests/validate-source-manifest.test.ts',
    'tests/packaging-helpers.test.ts',
    'tests/local-engine-backlog-contract.test.ts',
    'tests/three-repo-surebet-boundary.test.ts',
    'scripts/validate_three_repo_surebet_boundary.py',
  ]) {
    assert.match(validator, new RegExp(escapeRegExp(marker)));
  }
});

test('validate_repo rejects unresolved merge conflict markers', () => {
  const validator = read(VALIDATE_REPO);

  for (const marker of [
    'validate_no_conflict_markers',
    'CONFLICT_MARKER_PREFIXES',
    "'<<<<<<<'",
    "'>>>>>>>'",
    "CONFLICT_SEPARATOR = '======='",
    'unresolved merge conflict markers found',
  ]) {
    assert.match(validator, new RegExp(escapeRegExp(marker)));
  }
});
