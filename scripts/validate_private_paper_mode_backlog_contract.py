from __future__ import annotations

from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]


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
    historical = read('docs/017_private_paper_mode_implementation_backlog.md')
    for marker in [
        'status=SUPERSEDED_BOOTSTRAP_LEDGER',
        'legacy_stage=SURE-002B_PRIVATE_PAPER_MODE_INTAKE',
        'active_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1',
        'do not constitute the final BWS paper platform',
        'BWS-310', 'BWS-320', 'BWS-410', 'BWS-500', 'BWS-510',
        'BWS-520', 'BWS-580', 'BWS-600',
    ]:
        require(historical, marker, 'docs/017_private_paper_mode_implementation_backlog.md')

    for rel, markers in {
        'docs/018_private_paper_mode_runbook.md': ['current_stage=continuous_runtime_implementation', 'export', 'api', 'BWS-520', 'BWS-580', 'BWS-600'],
        'docs/automation/paper-evaluation.md': ['retained fixture/pinned-bundle evaluator', 'not the current implementation controller', 'SUREBET_PINNED_BUNDLE'],
        'docs/automation/paper-autopilot.md': ['not the active router', 'BWS-520', 'BWS-580', 'PAPER_AUTOPILOT_BLOCKED_ON_PINNED_BUNDLE'],
        'docs/repo_status_current.md': ['paper_autopilot=not_selected_until_bws_580_validation_and_runtime_controller_review', 'selected_controller=run-autonomous-implementation.sh'],
    }.items():
        text = read(rel)
        for marker in markers:
            require(text, marker, rel)

    command = read('commands/run-sure-paper-mode-autonomous.sh')
    for marker in ['run-paper-autopilot.sh', '--max-same-handoff']:
        require(command, marker, 'commands/run-sure-paper-mode-autonomous.sh')
    if 'DATABASE' + '_URL' in command or 'DB' + '_URL' in command:
        fail('paper wrapper must not accept direct database connection variables')

    package = json.loads(read('package.json'))
    if 'scripts/validate_private_paper_mode_backlog_contract.py' not in package.get('scripts', {}).get('validate:ops', ''):
        fail('package.json validate:ops must include validate_private_paper_mode_backlog_contract.py')
    validator = read('scripts/validate_repo.py')
    for marker in ['scripts/validate_private_paper_mode_backlog_contract.py', 'tests/private-paper-mode-backlog-contract.test.ts']:
        require(validator, marker, 'scripts/validate_repo.py')

    print('validate_private_paper_mode_backlog_contract: ok')


if __name__ == '__main__':
    main()
