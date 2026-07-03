from __future__ import annotations
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    'docs/019_three_repo_surebet_strategy_boundary.md',
    'docs/020_strategy_data_and_state_ownership.md',
    'docs/021_backtest_paper_live_mode_roadmap.md',
    'docs/022_separate_account_policy.md',
    'docs/023_legacy_betting_win_surebet_import_manifest.md',
    'docs/legacy/surebet-research/README.md',
    'research/imported-from-betting-win/legacy/surebet/README.md',
    'schemas/imported-from-betting-win/legacy/surebet/README.md',
    'templates/imported-from-betting-win/legacy/surebet/README.md',
    'decisions/ADR-0004-three-repo-surebet-strategy-execution-boundary.md',
]

AUTHORITY_FILES = [
    'README.md',
    'AGENTS.md',
    'PROJECT_STATUS.md',
    'STARTER_PACK.md',
    'docs/MASTER_PLAN.md',
    'docs/repo_status_current.md',
    'docs/001_scope_and_boundaries.md',
    'docs/002_dependency_contract_with_betting_win.md',
    'docs/011_validation_matrix.md',
    'docs/016_pinned_betting_win_interface_readiness.md',
    'docs/018_private_paper_mode_runbook.md',
]

REQUIRED_MARKERS = {
    'README.md': [
        'repo_role=surebet_strategy_execution_repo',
        'strategy_family=surebet_complete_set_only',
        'backtesting_owner=betting-win-surebet',
        'paper_mode_owner=betting-win-surebet',
        'future_live_decision_owner=betting-win-surebet_after_explicit_gate',
        'account_policy=separate_from_betting-win-betting',
        'legacy_surebet_import_status=imported_and_rehomed',
    ],
    'AGENTS.md': [
        'repo_role=surebet_strategy_execution_repo',
        'betting-win-betting owns predictive/value-betting strategies',
        'Separate account policy',
        'future gated live surebet execution decisions',
    ],
    'PROJECT_STATUS.md': [
        'repo_role=surebet_strategy_execution_repo',
        'backtesting_owner=betting-win-surebet',
        'paper_mode_owner=betting-win-surebet',
        'account_policy=separate_from_betting-win-betting',
        'has been rehomed under dedicated legacy archive paths',
    ],
    'STARTER_PACK.md': [
        'repo_role=surebet_strategy_execution_repo',
        'current_live_execution_gate=closed',
    ],
    'docs/MASTER_PLAN.md': [
        'repo_role=surebet_strategy_execution_repo',
        'backtesting_owner=betting-win-surebet',
        'future_live_decision_owner=betting-win-surebet_after_explicit_gate',
        'docs/019_three_repo_surebet_strategy_boundary.md',
    ],
    'docs/repo_status_current.md': [
        'repo_role=surebet_strategy_execution_repo',
        'account_policy=separate_from_betting-win-betting',
        'backtesting_owner=betting-win-surebet',
        '`docs/imported-from-betting-win/` must remain absent',
    ],
    'docs/001_scope_and_boundaries.md': [
        'repo_role=surebet_strategy_execution_repo',
        'canonical_history_owner=betting-win',
        'predictive_strategy_owner=betting-win-betting',
    ],
    'docs/002_dependency_contract_with_betting_win.md': [
        'canonical_history_owner=betting-win',
        'provider_truth_owner=betting-win',
        'strategy_state_owner=betting-win-surebet',
    ],
    'docs/011_validation_matrix.md': [
        'scripts/validate_three_repo_surebet_boundary.py',
        'three-repo surebet boundary',
        'completed legacy-import rehome state',
    ],
    'docs/016_pinned_betting_win_interface_readiness.md': [
        'provider_truth_owner=betting-win',
        'surebet_strategy_owner=betting-win-surebet',
        'predictive_strategy_owner=betting-win-betting',
    ],
    'docs/018_private_paper_mode_runbook.md': [
        'paper_mode_owner=betting-win-surebet',
        'account_policy=separate_from_betting-win-betting',
    ],
    'docs/019_three_repo_surebet_strategy_boundary.md': [
        'betting-win           = shared provider/data/history platform',
        'betting-win-betting   = predictive/value-betting strategy and execution repo',
        'betting-win-surebet   = surebet/complete-set strategy and execution repo',
        'future_live_decision_owner=betting-win-surebet_after_explicit_gate',
    ],
    'docs/020_strategy_data_and_state_ownership.md': [
        'This repo owns surebet-specific derived state',
        'This repo must not create a canonical provider-history database',
    ],
    'docs/021_backtest_paper_live_mode_roadmap.md': [
        'Backtesting belongs in this repo for surebet strategies',
        'Until that gate exists, live execution remains prohibited',
    ],
    'docs/022_separate_account_policy.md': [
        'account_policy=separate_from_betting-win-betting',
        'shared_bankroll_with_betting-win-betting=no',
    ],
    'docs/023_legacy_betting_win_surebet_import_manifest.md': [
        'legacy_surebet_import_status=imported_and_rehomed',
        'operator_move_status=complete',
        'source_import_path_present=no',
        'docs_legacy_destination=docs/legacy/surebet-research',
        'research_legacy_destination=research/imported-from-betting-win/legacy/surebet',
        'schemas_legacy_destination=schemas/imported-from-betting-win/legacy/surebet',
        'templates_legacy_destination=templates/imported-from-betting-win/legacy/surebet',
        'active_authority=no',
    ],
    'docs/legacy/surebet-research/README.md': [
        'legacy_surebet_import_status=imported_and_rehomed',
        'active_authority=no',
    ],
    'research/imported-from-betting-win/legacy/surebet/README.md': [
        'legacy_surebet_import_status=imported_and_rehomed',
        'raw_research_archive=yes',
    ],
    'schemas/imported-from-betting-win/legacy/surebet/README.md': [
        'active_schema_authority=no',
        'legacy_surebet_import_status=imported_and_rehomed',
    ],
    'templates/imported-from-betting-win/legacy/surebet/README.md': [
        'active_template_authority=no',
        'legacy_surebet_import_status=imported_and_rehomed',
    ],
    'decisions/ADR-0004-three-repo-surebet-strategy-execution-boundary.md': [
        'Accepted.',
        'The two downstream strategy repos use separate accounts and separate bankrolls',
    ],
}

FORBIDDEN_AUTHORITY_MARKERS = [
    'This repo must never become the provider/evidence platform and must never become an executor.',
    'downstream strategy skeleton for private paper-only surebet / complete-set research.',
    'SURE-002 should replace the current blocked stubs with a real pinned import contract.',
]


def fail(message: str) -> None:
    print(f'ERROR: {message}', file=sys.stderr)
    raise SystemExit(1)


def read(rel: str) -> str:
    path = ROOT / rel
    if not path.is_file():
        fail(f'missing required file: {rel}')
    return path.read_text(encoding='utf-8')


def require(text: str, marker: str, rel: str) -> None:
    if marker not in text:
        fail(f'{rel} missing required marker: {marker}')


def main() -> None:
    for rel in REQUIRED_FILES:
        if not (ROOT / rel).is_file():
            fail(f'missing three-repo boundary file: {rel}')

    for rel in AUTHORITY_FILES + REQUIRED_FILES:
        text = read(rel)
        for marker in REQUIRED_MARKERS.get(rel, []):
            require(text, marker, rel)

    for rel in AUTHORITY_FILES:
        text = read(rel)
        for marker in FORBIDDEN_AUTHORITY_MARKERS:
            if marker in text:
                fail(f'{rel} still contains stale authority marker: {marker}')

    if (ROOT / 'docs/imported-from-betting-win').exists():
        fail('temporary docs/imported-from-betting-win import path must be removed after re-homing legacy surebet material')

    package = json.loads(read('package.json'))
    validate_ops = package.get('scripts', {}).get('validate:ops', '')
    if 'scripts/validate_three_repo_surebet_boundary.py' not in validate_ops:
        fail('package.json validate:ops must include validate_three_repo_surebet_boundary.py')
    if package.get('version') != '0.0.0-private-sure-002b-three-repo-boundary':
        fail('package.json version must reflect the SURE-002B three-repo boundary rebaseline')

    validate_repo = read('scripts/validate_repo.py')
    for marker in REQUIRED_FILES + ['scripts/validate_three_repo_surebet_boundary.py', 'tests/three-repo-surebet-boundary.test.ts']:
        require(validate_repo, marker, 'scripts/validate_repo.py')

    print('validate_three_repo_surebet_boundary: ok')


if __name__ == '__main__':
    main()
