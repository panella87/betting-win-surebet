from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
PROGRAM = 'BWS_FULL_PLATFORM_IMPLEMENTATION_V1'
REMOVED = [
    'DOCUMENTATION_CHECK_REPORT.md',
    'docs/014_sure_001_remaining_hardening_backlog.md',
    'docs/015_local_engine_implementation_backlog.md',
    'docs/017_private_paper_mode_implementation_backlog.md',
    'docs/023_legacy_betting_win_surebet_import_manifest.md',
    'docs/024_three_repo_documentation_completion_status.md',
    'docs/025_research_archive_completion_status.md',
]
RETAINED = [
    'docs/000_documentation_index.md',
    'docs/repo_status_current.md',
    'docs/028_full_implementation_program.md',
    'docs/029_full_implementation_task_ledger.md',
    'docs/034_remaining_operator_runtime_implementation_program.md',
    'docs/041_external_runtime_preflight_and_bws600_campaign.md',
    'docs/042_release_packaging_implementation_blueprint.md',
    'docs/043_upgrade_rollback_recovery_implementation_blueprint.md',
    'docs/044_soak_failure_injection_implementation_blueprint.md',
    'docs/045_external_runtime_preflight_implementation_blueprint.md',
    'docs/046_final_local_acceptance_implementation_blueprint.md',
    'docs/legacy/surebet-research/README.md',
    'research/imported-from-betting-win/legacy/surebet/RESEARCH_IMPORT_MANIFEST.json',
]


def fail(message: str) -> None:
    print(f'ERROR: {message}', file=sys.stderr)
    raise SystemExit(1)


def read(rel: str) -> str:
    path = ROOT / rel
    if not path.is_file():
        fail(f'missing required retained documentation file: {rel}')
    return path.read_text(encoding='utf-8')


def require(text: str, marker: str, rel: str) -> None:
    if marker not in text:
        fail(f'{rel} missing required marker: {marker}')


def main() -> None:
    for rel in REMOVED:
        if (ROOT / rel).exists():
            fail(f'stale documentation snapshot must stay removed: {rel}')

    for rel in RETAINED:
        read(rel)

    index = read('docs/000_documentation_index.md')
    for marker in [
        PROGRAM,
        'documentation_index_status=active',
        'documentation_slimming_phase=complete',
        'DOCUMENTATION_CHECK_REPORT.md',
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
        'bootstrap, not the complete application',
        'do not constitute the final BWS paper platform',
        'BWS-599',
        'BWS-600',
        'docs/041_external_runtime_preflight_and_bws600_campaign.md',
        'docs/legacy/surebet-research/',
        'archive_is_active_product_authority=no',
    ]:
        require(index, marker, 'docs/000_documentation_index.md')

    for rel in ['README.md', 'STARTER_PACK.md', 'AGENTS.md', 'docs/automation/README.md', 'PROJECT_STATUS.md', 'docs/MASTER_PLAN.md']:
        require(read(rel), 'docs/000_documentation_index.md', rel)

    repo_validator = read('scripts/validate_repo.py')
    for rel in REMOVED:
        if rel in repo_validator:
            fail(f'scripts/validate_repo.py still requires removed documentation file: {rel}')
    require(repo_validator, 'docs/000_documentation_index.md', 'scripts/validate_repo.py')
    require(repo_validator, 'scripts/validate_documentation_slimming.py', 'scripts/validate_repo.py')
    require(repo_validator, 'tests/documentation-slimming-contract.test.ts', 'scripts/validate_repo.py')

    print('validate_documentation_slimming: ok')


if __name__ == '__main__':
    main()
