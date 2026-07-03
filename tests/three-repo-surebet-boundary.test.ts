import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();

function read(relativePath: string): string {
  return readFileSync(join(REPO_ROOT, relativePath), 'utf-8');
}

test('active docs state the accepted surebet three-repo boundary', () => {
  const readme = read('README.md');
  const agents = read('AGENTS.md');
  const status = read('docs/repo_status_current.md');
  const boundary = read('docs/019_three_repo_surebet_strategy_boundary.md');

  for (const doc of [readme, agents, status, boundary]) {
    assert.match(doc, /repo_role=surebet_strategy_execution_repo/);
    assert.match(doc, /backtesting_owner=betting-win-surebet/);
    assert.match(doc, /paper_mode_owner=betting-win-surebet/);
    assert.match(doc, /future_live_decision_owner=betting-win-surebet_after_explicit_gate/);
  }

  assert.match(boundary, /betting-win\s+= shared provider\/data\/history platform/);
  assert.match(boundary, /betting-win-betting\s+= predictive\/value-betting strategy and execution repo/);
  assert.match(boundary, /betting-win-surebet\s+= surebet\/complete-set strategy and execution repo/);
});

test('separate account policy is explicit and not delegated to betting-win', () => {
  const policy = read('docs/022_separate_account_policy.md');
  const readme = read('README.md');
  const status = read('PROJECT_STATUS.md');

  for (const doc of [policy, readme, status]) {
    assert.match(doc, /account_policy=separate_from_betting-win-betting/);
  }

  assert.match(policy, /shared_bankroll_with_betting-win-betting=no/);
  assert.match(policy, /betting-win_account_coordination=not_owned_here/);
});

test('legacy import manifest confirms no local delete or move is currently required', () => {
  const manifest = read('docs/023_legacy_betting_win_surebet_import_manifest.md');

  assert.match(manifest, /legacy_surebet_import_status=not_yet_imported/);
  assert.match(manifest, /operator_move_required=no/);
  assert.match(manifest, /source_import_path_present=no/);
});

