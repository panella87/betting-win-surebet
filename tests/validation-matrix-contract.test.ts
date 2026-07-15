import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const doc = readFileSync(join(process.cwd(), 'docs/011_validation_matrix.md'), 'utf-8');

test('validation matrix covers BWS implementation, upstream, repository and ownership drift', () => {
  for (const marker of [
    'npm run typecheck', 'npm test', 'npm run validate:repo', 'npm run validate:boundary',
    'npm run validate:ops', 'npm run validate:implementation-program',
    'npm run validate:loopback-acceptance',
    'npm run validate:upstream-boundary', 'scripts/validate_three_repo_surebet_boundary.py',
    'scripts/validate_source_manifest.py', 'tests/full-implementation-program-contract.test.ts',
    'tests/betting-win-upstream-contract.test.ts', 'tests/validate-repo-contract.test.ts',
    'Placeholder evidence cannot satisfy a gate',
  ]) {
    assert.match(doc, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
