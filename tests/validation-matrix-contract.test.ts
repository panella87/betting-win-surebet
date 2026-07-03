import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const VALIDATION_MATRIX = join(REPO_ROOT, 'docs', '011_validation_matrix.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

test('validation matrix maps each SURE-001 gate to a concrete failure mode', () => {
  const doc = read(VALIDATION_MATRIX);

  for (const marker of [
    'TypeScript stubs, contracts, or operator wrappers drift into invalid shapes',
    'Direct PostgreSQL connection strings, direct DB environment variables, or `core.*` migration text appear',
    'Provider dependencies, provider imports, dynamic imports, `require(...)`, or provider URLs creep into the codebase',
    'Executable `src/` code starts describing wallet, signer, order, transaction, cashout, redemption, or split/merge execution paths',
    'Placeholder fixture directories stop being empty or the local pinned-interface placeholder starts looking like a real upstream export',
    'The source tree or generated archives start carrying local secrets, generated archives, logs, temp files, caches, dependencies, or build output',
    'same-line dependent `local` assignments that can trip `set -u` with unbound expansion',
    'The controller accepts malformed cycle artifacts, malformed request flags, malformed continue status, duplicates required reports, or unsafe validation ordering',
    '`SOURCE_MANIFEST.json` loses non-empty audit metadata or stops matching the exact current source tree',
    'Long autonomous runs stop after one bounded slice even though safe SURE-001 backlog still remains',
    'tests/packaging-helpers.test.ts',
    'tests/validate-fixture-integrity.test.ts',
    'tests/validate-source-manifest.test.ts',
    'tests/validate-repo-contract.test.ts',
    'local implementation backlog disappears or stops enforcing local-only SURE-002A/SURE-007 boundaries',
    'three-repo surebet boundary',
    'tests/three-repo-surebet-boundary.test.ts',
  ]) {
    assert.match(doc, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
