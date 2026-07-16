import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const validator = readFileSync(join(process.cwd(), 'scripts/validate_repo.py'), 'utf-8');

test('validate_repo requires the full implementation and upstream contract surface', () => {
  for (const marker of [
    'backlog/bws_full_implementation.csv',
    'backlog/bws_remaining_safe_local_map.csv',
    'docs/033_continuous_private_paper_runtime_program.md',
    'docs/034_remaining_operator_runtime_implementation_program.md',
    'docs/041_external_runtime_preflight_and_bws600_campaign.md',
    'docs/042_release_packaging_implementation_blueprint.md',
    'docs/046_final_local_acceptance_implementation_blueprint.md',
    'decisions/ADR-0006-full-stack-runtime-and-automation-boundary.md',
    'config/betting-win.upstream-baseline.json',
    'schemas/betting-win-upstream-lock.v1.schema.json',
    'scripts/validate_full_implementation_program.py',
    'scripts/validate_remaining_operator_runtime_program.py',
    'validate:loopback-acceptance',
    'scripts/validate_betting_win_upstream_contract.py',
    'scripts/run_betting_win_upstream_lock.mjs',
    'tests/full-implementation-program-contract.test.ts',
    'tests/remaining-operator-runtime-program-contract.test.ts',
    'tests/betting-win-upstream-contract.test.ts',
    'tests/three-repo-surebet-boundary.test.ts',
    'node --test --test-concurrency=1 dist/tests/*.test.js',
  ]) {
    assert.match(validator, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('validate_repo rejects conflict markers and keeps the runtime upstream lock repo-local', () => {
  for (const marker of [
    'validate_no_conflict_markers', 'CONFLICT_MARKER_PREFIXES', "'<<<<<<<'", "'>>>>>>>'",
    "CONFLICT_SEPARATOR = '======='", 'unresolved merge conflict markers found',
    'config/betting-win.upstream.lock.json', 'docs/imported-from-betting-win',
  ]) {
    assert.match(validator, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
