import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const validator = readFileSync(join(process.cwd(), 'scripts/validate_repo.py'), 'utf-8');

test('validate_repo requires the full implementation and upstream contract surface', () => {
  for (const marker of [
    'backlog/bws_full_implementation.csv',
    'config/betting-win.upstream-baseline.json',
    'schemas/betting-win-upstream-lock.v1.schema.json',
    'scripts/validate_full_implementation_program.py',
    'scripts/validate_betting_win_upstream_contract.py',
    'tests/full-implementation-program-contract.test.ts',
    'tests/betting-win-upstream-contract.test.ts',
    'tests/three-repo-surebet-boundary.test.ts',
  ]) {
    assert.match(validator, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('validate_repo rejects conflict markers and premature runtime lock evidence', () => {
  for (const marker of [
    'validate_no_conflict_markers', 'CONFLICT_MARKER_PREFIXES', "'<<<<<<<'", "'>>>>>>>'",
    "CONFLICT_SEPARATOR = '======='", 'unresolved merge conflict markers found',
    'config/betting-win.upstream.lock.json', 'docs/imported-from-betting-win',
  ]) {
    assert.match(validator, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
