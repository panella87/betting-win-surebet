from __future__ import annotations
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]

def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)

def read(path: Path) -> str:
    return path.read_text(encoding='utf-8')

REQUIRED = [
  'README.md','AGENTS.md','CHANGELOG.md','PROJECT_STATUS.md','package.json','package-lock.json','tsconfig.json','.gitignore','.gitattributes','.env.example','.nvmrc','cli.js',
  'start.sh','stop.sh','check_progress.sh','watch_progress.sh','open_log.sh','update_git.sh','pull_artifacts_and_zip_codebase.sh','zip_codebase.sh','run-autonomous-implementation.sh','run-paper-evaluation.sh','run-autonomous-bugfix.sh','automation.config.sh','.automation/lib/run_common.sh','.automation/lib/telegram_notify.sh','.automation/README.md',
  'docs/automation/README.md','docs/automation/PROTECTED_AUTOMATION_FILES.md','docs/automation/repo-profile.md','docs/automation/autonomous-implementation.md','docs/automation/paper-evaluation.md','docs/automation/autonomous-bugfix.md','docs/automation/current-implementation-task.md','docs/automation/SSH_KEY_SETUP.md','docs/automation/POST_OVERLAY_CLEANUP.md',
  'docs/MASTER_PLAN.md','docs/repo_status_current.md','docs/autonomous_loop_contract.md','docs/operations/autonomous_72h_runbook.md','docs/operations/service_run.md',
  'docs/001_scope_and_boundaries.md','docs/002_dependency_contract_with_betting_win.md','docs/003_surebet_family_decision.md','docs/004_market_identity_and_rule_equivalence.md',
  'docs/005_terminal_scenario_cashflow_model.md','docs/006_quote_depth_capacity_requirements.md','docs/007_stake_vector_solver_contract.md','docs/008_leg_completion_and_residual_exposure.md',
  'docs/009_settlement_replay_contract.md','docs/010_paper_evaluation_and_kill_criteria.md','docs/011_validation_matrix.md','docs/012_runbook.md','docs/013_autonomous_controller_status_contract.md','docs/014_sure_001_remaining_hardening_backlog.md','docs/015_local_engine_implementation_backlog.md','docs/016_pinned_betting_win_interface_readiness.md','docs/017_private_paper_mode_implementation_backlog.md','docs/018_private_paper_mode_runbook.md','docs/019_three_repo_surebet_strategy_boundary.md','docs/020_strategy_data_and_state_ownership.md','docs/021_backtest_paper_live_mode_roadmap.md','docs/022_separate_account_policy.md','docs/023_legacy_betting_win_surebet_import_manifest.md','docs/legacy/surebet-research/README.md','research/imported-from-betting-win/legacy/surebet/README.md','research/imported-from-betting-win/legacy/surebet/RESEARCH_IMPORT_MANIFEST.json','docs/025_research_archive_completion_status.md','schemas/imported-from-betting-win/legacy/surebet/README.md','templates/imported-from-betting-win/legacy/surebet/README.md',
  'decisions/ADR-0001-repo-boundary-and-no-provider-connections.md','decisions/ADR-0002-first-lane-polymarket-standard-binary-complete-set.md','decisions/ADR-0003-paper-only-no-execution.md','decisions/ADR-0004-three-repo-surebet-strategy-execution-boundary.md',
  'src/contracts/betting-win-contract-imports.ts','src/contracts/local-types.ts',
  'scripts/validate_contract_boundary.py','scripts/validate_no_provider_connections.py','scripts/validate_no_execution_paths.py','scripts/validate_fixture_integrity.py',
  'scripts/validate_master_plan.py','scripts/validate_executable_bits.py','scripts/validate_artifact_hygiene.py','scripts/validate_node_runtime_loader.py','scripts/validate_shell_local_assignments.py','scripts/validate_autonomous_controller_contract.py','scripts/validate_source_manifest.py','scripts/regenerate_source_manifest.py','scripts/validate_autonomous_continuation_contract.py','scripts/validate_local_engine_backlog_contract.py','scripts/validate_private_paper_mode_backlog_contract.py','scripts/validate_three_repo_surebet_boundary.py','scripts/load-node-runtime.sh','scripts/create-source-handoff-archive.sh','scripts/restore-required-executable-bits.js',
  'tests/autonomous-controller-contract.test.ts','tests/autonomous-continuation-contract.test.ts','tests/local-engine-backlog-contract.test.ts','tests/private-paper-mode-backlog-contract.test.ts','tests/three-repo-surebet-boundary.test.ts','tests/validate-artifact-hygiene.test.ts','tests/validate-fixture-integrity.test.ts','tests/validate-shell-local-assignments.test.ts','tests/validate-source-manifest.test.ts','tests/packaging-helpers.test.ts','tests/validate-repo-contract.test.ts','tests/validation-matrix-contract.test.ts',
  'tests/fixtures/pinned-interface-placeholder/.gitkeep','tests/fixtures/pinned-interface-placeholder/local-placeholder.json',
  'tests/fixtures/private-paper-mode-smoke/accepted-local-bundle.json','tests/fixtures/private-paper-mode-smoke/blocked-missing-settlement-bundle.json','tests/fixtures/private-paper-mode-smoke/blocked-stale-quotes-bundle.json','tests/fixtures/private-paper-mode-smoke/blocked-mixed-currency-bundle.json','tests/fixtures/private-paper-mode-smoke/multi-candidate-bundle.json',
  'tools/required_executable_paths.js','commands/run-sure-001-autonomous.sh','commands/run-sure-local-engine-autonomous.sh','commands/run-sure-paper-mode-autonomous.sh','commands/run-pinned-interface-smoke.sh',
]
FORBIDDEN = ['run-paper-evaluation-12h.sh','stop-autonomous-run.sh','scripts/stop-autonomous-run.sh']

def main() -> None:
    missing = [p for p in REQUIRED if not (ROOT / p).is_file()]
    if missing:
        fail('missing required files: ' + ', '.join(missing))
    present_forbidden = [p for p in FORBIDDEN if (ROOT / p).exists()]
    if present_forbidden:
        fail('obsolete automation files still present: ' + ', '.join(present_forbidden))
    package = json.loads(read(ROOT / 'package.json'))
    if package.get('private') is not True:
        fail('package.json must set private=true')
    for script in ['typecheck','test','validate','validate:starter','validate:ops','validate:three-repo-boundary','restore:executables','regen:source-manifest','zip:codebase','autonomous:check','autonomous:start','autonomous:bugfix','paper:evaluation','bugfix','automation:status']:
        if script not in package.get('scripts', {}):
            fail(f'package.json missing script: {script}')
    if package.get('bin', {}).get('betting-win-surebet') != './cli.js':
        fail('package.json bin must expose ./cli.js')
    required_doc_markers = {
        'README.md': ['betting-win-surebet', 'Standard automation commands', 'run-paper-evaluation.sh'],
        'AGENTS.md': ['does not own provider truth', 'Source-of-truth order', 'Standard automation contract'],
        'docs/automation/repo-profile.md': ['repo_role=surebet_strategy_execution_repo', 'SURE-002B_PRIVATE_PAPER_MODE_INTAKE', 'Standard helper scripts'],
        'docs/automation/paper-evaluation.md': ['run-paper-evaluation.sh', 'no-service private paper', 'SUREBET_PINNED_BUNDLE'],
        'PROJECT_STATUS.md': ['Standard automation status', 'paper_supported=repo_local_private_fixture_only'],
        'docs/repo_status_current.md': ['Standard automation status', 'run_paper_evaluation=canonical_repo_local_private_fixture_and_pinned_bundle_only'],
        'docs/MASTER_PLAN.md': ['Automation operating model', 'run-autonomous-bugfix.sh'],
    }
    for rel, markers in required_doc_markers.items():
        text = read(ROOT / rel)
        for marker in markers:
            if marker not in text:
                fail(f'{rel} missing required marker: {marker}')
    gitignore = read(ROOT / '.gitignore')
    for needle in ['node_modules/', '.env', 'artifacts/*', '*.zip', '.codex_current_artifact_dir', '.automation/locks/', '.automation/corrupt/', '.automation/paper-mode-to-autonomous-implementation.env', '.automation/autonomous-implementation-handover.env']:
        if needle not in gitignore:
            fail(f'.gitignore missing: {needle}')
    print('validate_repo: ok')

if __name__ == '__main__':
    main()
