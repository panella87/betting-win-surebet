import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf-8');

function esc(marker: string): RegExp {
  return new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

test('documentation index replaces stale completion snapshots without deleting active contracts', () => {
  for (const rel of [
    'DOCUMENTATION_CHECK_REPORT.md',
    'docs/014_sure_001_remaining_hardening_backlog.md',
    'docs/015_local_engine_implementation_backlog.md',
    'docs/017_private_paper_mode_implementation_backlog.md',
    'docs/023_legacy_betting_win_surebet_import_manifest.md',
    'docs/024_three_repo_documentation_completion_status.md',
    'docs/025_research_archive_completion_status.md',
  ]) {
    assert.equal(existsSync(join(ROOT, rel)), false, `${rel} should stay removed`);
  }

  const index = read('docs/000_documentation_index.md');
  for (const marker of [
    'documentation_index_status=active',
    'documentation_slimming_phase=complete',
    'DOCUMENTATION_CHECK_REPORT.md',
    'docs/014_sure_001_remaining_hardening_backlog.md',
    'docs/015_local_engine_implementation_backlog.md',
    'docs/017_private_paper_mode_implementation_backlog.md',
    'docs/023_legacy_betting_win_surebet_import_manifest.md',
    'docs/024_three_repo_documentation_completion_status.md',
    'docs/025_research_archive_completion_status.md',
    'docs/014_sure_001_remaining_hardening_backlog.md',
    'docs/015_local_engine_implementation_backlog.md',
    'docs/017_private_paper_mode_implementation_backlog.md',
    'status=SUPERSEDED_BOOTSTRAP_LEDGER',
    'legacy_stage=SURE-001',
    'legacy_stage=SURE-002A_LOCAL_INTERFACE_AND_ENGINE_BOOTSTRAP',
    'legacy_stage=SURE-002B_PRIVATE_PAPER_MODE_INTAKE',
    'BWS-599',
    'BWS-600',
    'docs/041_external_runtime_preflight_and_bws600_campaign.md',
    'archive_is_active_product_authority=no',
  ]) {
    assert.match(index, esc(marker));
  }

  for (const rel of [
    'docs/028_full_implementation_program.md',
    'docs/029_full_implementation_task_ledger.md',
    'docs/034_remaining_operator_runtime_implementation_program.md',
    'docs/041_external_runtime_preflight_and_bws600_campaign.md',
    'docs/042_release_packaging_implementation_blueprint.md',
    'docs/046_final_local_acceptance_implementation_blueprint.md',
    'research/imported-from-betting-win/legacy/surebet/RESEARCH_IMPORT_MANIFEST.json',
  ]) {
    assert.equal(existsSync(join(ROOT, rel)), true, `${rel} must remain retained`);
  }
});

test('active entrypoints point operators to the compact documentation index', () => {
  for (const rel of ['README.md', 'STARTER_PACK.md', 'AGENTS.md', 'PROJECT_STATUS.md', 'docs/automation/README.md']) {
    assert.match(read(rel), /docs\/000_documentation_index\.md/);
  }
});
