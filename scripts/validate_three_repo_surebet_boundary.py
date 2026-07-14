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
    'research/imported-from-betting-win/legacy/surebet/RESEARCH_IMPORT_MANIFEST.json',
    'docs/025_research_archive_completion_status.md',
    'schemas/imported-from-betting-win/legacy/surebet/README.md',
    'templates/imported-from-betting-win/legacy/surebet/README.md',
    'decisions/ADR-0004-three-repo-surebet-strategy-execution-boundary.md',
    'decisions/ADR-0005-bws-built-on-betting-win-platform.md',
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
        read(rel)

    required = {
        'README.md': [
            'repo_role=surebet_strategy_application',
            'provider_truth_owner=betting-win',
            'canonical_history_owner=betting-win',
            'strategy_state_owner=betting-win-surebet',
            'backtesting_owner=betting-win-surebet',
            'paper_mode_owner=betting-win-surebet',
            'future_live_decision_owner=betting-win-surebet_after_explicit_gate',
            'account_policy=separate_from_betting-win-betting',
        ],
        'AGENTS.md': [
            'repo_role=surebet_strategy_application',
            'provider_truth_owner=betting-win',
            'strategy_state_owner=betting-win-surebet',
        ],
        'PROJECT_STATUS.md': [
            'repo_role=surebet_strategy_application',
            'backtesting_owner=betting-win-surebet',
            'paper_mode_owner=betting-win-surebet',
            'account_policy=separate_from_betting-win-betting',
        ],
        'STARTER_PACK.md': [
            'repo_role=surebet_strategy_application',
            'current_live_execution_gate=closed',
        ],
        'docs/019_three_repo_surebet_strategy_boundary.md': [
            'betting-win           = shared provider/data/history platform',
            'betting-win-betting   = predictive/value-betting strategy and execution repo',
            'betting-win-surebet   = surebet/complete-set strategy application repo',
            'future_live_decision_owner=betting-win-surebet_after_explicit_gate',
        ],
        'docs/020_strategy_data_and_state_ownership.md': [
            'This repo owns surebet-specific derived state under `surebet.*`',
            'must not create a canonical provider-history database',
            'must not migrate or write betting-win `core.*`',
        ],
        'docs/021_backtest_paper_live_mode_roadmap.md': [
            'Backtesting belongs in this repo for surebet strategies',
            'BWS-600 accepted continuous read-only runtime',
            'BWS-900 separately authorized execution',
        ],
        'docs/022_separate_account_policy.md': [
            'account_policy=separate_from_betting-win-betting',
            'shared_bankroll_with_betting-win-betting=no',
            'betting-win_account_coordination=not_owned_here',
        ],
        'docs/023_legacy_betting_win_surebet_import_manifest.md': [
            'legacy_surebet_import_status=imported_and_rehomed',
            'operator_move_status=complete',
            'source_import_path_present=no',
            'active_authority=no',
            'repo_role=surebet_strategy_application',
        ],
        'decisions/ADR-0005-bws-built-on-betting-win-platform.md': [
            'Accepted', 'betting-win', 'read-only', 'BWS',
        ],
    }
    for rel, markers in required.items():
        text = read(rel)
        for marker in markers:
            require(text, marker, rel)

    if (ROOT / 'docs' / 'imported-from-betting-win').exists():
        fail('temporary docs/imported-from-betting-win import path must remain absent')

    manifest = json.loads(read('research/imported-from-betting-win/legacy/surebet/RESEARCH_IMPORT_MANIFEST.json'))
    if manifest.get('schema') != 'betting-win-surebet.research-import-manifest.v1':
        fail('surebet research import manifest schema mismatch')
    files = manifest.get('files')
    if not isinstance(files, list) or len(files) < 40:
        fail('surebet research import manifest is unexpectedly small')

    package = json.loads(read('package.json'))
    if package.get('version') != '0.1.0-bws-full-platform':
        fail('package.json version must reflect the BWS full-platform rebaseline')
    if 'scripts/validate_three_repo_surebet_boundary.py' not in package.get('scripts', {}).get('validate:ops', ''):
        fail('package.json validate:ops must include validate_three_repo_surebet_boundary.py')

    validator = read('scripts/validate_repo.py')
    for marker in [
        'three_repo_surebet_strategy_boundary.md',
        'docs/legacy/surebet-research/README.md',
        'research/imported-from-betting-win/legacy/surebet/RESEARCH_IMPORT_MANIFEST.json',
        'ADR-0005-bws-built-on-betting-win-platform.md',
        'scripts/validate_three_repo_surebet_boundary.py',
        'tests/three-repo-surebet-boundary.test.ts',
    ]:
        require(validator, marker, 'scripts/validate_repo.py')

    print('validate_three_repo_surebet_boundary: ok')


if __name__ == '__main__':
    main()
