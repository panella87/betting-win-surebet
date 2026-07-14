import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf-8');

test('active docs state BWS is the separate surebet application built on betting-win', () => {
  for (const rel of ['README.md', 'AGENTS.md', 'PROJECT_STATUS.md', 'docs/repo_status_current.md']) {
    const doc = read(rel);
    assert.match(doc, /repo_role=surebet_strategy_application/);
    assert.match(doc, /provider_truth_owner=betting-win/);
    assert.match(doc, /strategy_state_owner=betting-win-surebet/);
  }
  const boundary = read('docs/019_three_repo_surebet_strategy_boundary.md');
  assert.match(boundary, /betting-win\s+= shared provider\/data\/history platform/);
  assert.match(boundary, /betting-win-betting\s+= predictive\/value-betting strategy and execution repo/);
  assert.match(boundary, /betting-win-surebet\s+= surebet\/complete-set strategy application repo/);
});

test('separate strategy state and legacy archive boundaries remain explicit', () => {
  const policy = read('docs/022_separate_account_policy.md');
  assert.match(policy, /account_policy=separate_from_betting-win-betting/);
  assert.match(policy, /shared_bankroll_with_betting-win-betting=no/);
  assert.equal(existsSync(join(ROOT, 'docs/imported-from-betting-win')), false);
  assert.equal(existsSync(join(ROOT, 'docs/legacy/surebet-research/README.md')), true);
  assert.match(read('docs/023_legacy_betting_win_surebet_import_manifest.md'), /active_authority=no/);
});
