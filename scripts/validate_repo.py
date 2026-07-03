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
  'start.sh','stop.sh','check_progress.sh','watch_progress.sh','open_log.sh','update_git.sh','pull_artifacts_and_zip_codebase.sh','zip_codebase.sh','run-autonomous-implementation.sh',
  'docs/MASTER_PLAN.md','docs/repo_status_current.md','docs/autonomous_loop_contract.md','docs/operations/autonomous_72h_runbook.md','docs/operations/service_run.md',
  'docs/001_scope_and_boundaries.md','docs/002_dependency_contract_with_betting_win.md','docs/003_surebet_family_decision.md','docs/004_market_identity_and_rule_equivalence.md',
  'docs/005_terminal_scenario_cashflow_model.md','docs/006_quote_depth_capacity_requirements.md','docs/007_stake_vector_solver_contract.md','docs/008_leg_completion_and_residual_exposure.md',
  'docs/009_settlement_replay_contract.md','docs/010_paper_evaluation_and_kill_criteria.md','docs/011_validation_matrix.md','docs/012_runbook.md','docs/013_autonomous_controller_status_contract.md','docs/014_sure_001_remaining_hardening_backlog.md','docs/015_local_engine_implementation_backlog.md','docs/016_pinned_betting_win_interface_readiness.md','docs/017_private_paper_mode_implementation_backlog.md','docs/018_private_paper_mode_runbook.md','docs/019_three_repo_surebet_strategy_boundary.md','docs/020_strategy_data_and_state_ownership.md','docs/021_backtest_paper_live_mode_roadmap.md','docs/022_separate_account_policy.md','docs/023_legacy_betting_win_surebet_import_manifest.md',
  'decisions/ADR-0001-repo-boundary-and-no-provider-connections.md','decisions/ADR-0002-first-lane-polymarket-standard-binary-complete-set.md','decisions/ADR-0003-paper-only-no-execution.md','decisions/ADR-0004-three-repo-surebet-strategy-execution-boundary.md',
  'src/contracts/betting-win-contract-imports.ts','src/contracts/local-types.ts',
  'scripts/validate_contract_boundary.py','scripts/validate_no_provider_connections.py','scripts/validate_no_execution_paths.py','scripts/validate_fixture_integrity.py',
  'scripts/validate_master_plan.py','scripts/validate_executable_bits.py','scripts/validate_artifact_hygiene.py','scripts/validate_node_runtime_loader.py','scripts/validate_shell_local_assignments.py','scripts/validate_autonomous_controller_contract.py','scripts/validate_source_manifest.py','scripts/regenerate_source_manifest.py','scripts/validate_autonomous_continuation_contract.py','scripts/validate_local_engine_backlog_contract.py','scripts/validate_private_paper_mode_backlog_contract.py','scripts/validate_three_repo_surebet_boundary.py','scripts/load-node-runtime.sh','scripts/create-source-handoff-archive.sh','scripts/restore-required-executable-bits.js',
  'tests/autonomous-controller-contract.test.ts','tests/autonomous-continuation-contract.test.ts','tests/local-engine-backlog-contract.test.ts','tests/private-paper-mode-backlog-contract.test.ts','tests/three-repo-surebet-boundary.test.ts','tests/validate-artifact-hygiene.test.ts','tests/validate-fixture-integrity.test.ts','tests/validate-shell-local-assignments.test.ts','tests/validate-source-manifest.test.ts','tests/packaging-helpers.test.ts','tests/validate-repo-contract.test.ts','tests/validation-matrix-contract.test.ts',
  'tests/fixtures/pinned-interface-placeholder/.gitkeep','tests/fixtures/pinned-interface-placeholder/local-placeholder.json',
  'tests/fixtures/private-paper-mode-smoke/accepted-local-bundle.json','tests/fixtures/private-paper-mode-smoke/blocked-missing-settlement-bundle.json','tests/fixtures/private-paper-mode-smoke/blocked-stale-quotes-bundle.json','tests/fixtures/private-paper-mode-smoke/blocked-mixed-currency-bundle.json','tests/fixtures/private-paper-mode-smoke/multi-candidate-bundle.json',
  'tools/required_executable_paths.js','commands/run-sure-001-autonomous.sh','commands/run-sure-local-engine-autonomous.sh','commands/run-sure-paper-mode-autonomous.sh','commands/run-pinned-interface-smoke.sh',
]

def main() -> None:
    missing = [p for p in REQUIRED if not (ROOT / p).is_file()]
    if missing:
        fail('missing required files: ' + ', '.join(missing))
    package = json.loads(read(ROOT / 'package.json'))
    if package.get('private') is not True:
        fail('package.json must set private=true')
    for script in ['typecheck','test','validate','validate:starter','validate:ops','validate:three-repo-boundary','restore:executables','regen:source-manifest']:
        if script not in package.get('scripts', {}):
            fail(f'package.json missing script: {script}')
    if package.get('bin', {}).get('betting-win-surebet') != './cli.js':
        fail('package.json bin must expose ./cli.js')
    agents = read(ROOT / 'AGENTS.md')
    for needle in ['does not own provider truth', 'Reciprocal odds alone are not acceptance evidence', 'Source-of-truth order', 'repo_role=surebet_strategy_execution_repo']:
        if needle not in agents:
            fail(f'AGENTS.md missing: {needle}')
    gitignore = read(ROOT / '.gitignore')
    for needle in ['node_modules/', '.env', 'artifacts/*', '*.zip', '.codex_current_artifact_dir']:
        if needle not in gitignore:
            fail(f'.gitignore missing: {needle}')
    print('validate_repo: ok')

if __name__ == '__main__':
    main()
