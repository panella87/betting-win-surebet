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
    historical = read('docs/015_local_engine_implementation_backlog.md')
    for marker in [
        'status=SUPERSEDED_BOOTSTRAP_LEDGER',
        'legacy_stage=SURE-002A_LOCAL_INTERFACE_AND_ENGINE_BOOTSTRAP',
        'active_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1',
        'bootstrap, not the complete application',
        'BWS-110', 'BWS-200', 'BWS-240', 'BWS-300', 'BWS-310',
    ]:
        require(historical, marker, 'docs/015_local_engine_implementation_backlog.md')

    for rel, markers in {
        'README.md': ['current_task=BWS-590', 'safe_local_terminal_gate=BWS-599', 'packages/bootstrap'],
        'AGENTS.md': ['backlog/bws_full_implementation.csv', 'Preserve validated solver, completion, exposure, settlement, report, API and cockpit behavior'],
        'docs/repo_status_current.md': ['packages/bootstrap', 'BWS-580', 'BWS-581', 'BWS-599'],
        'docs/028_full_implementation_program.md': ['workspace migration', 'operator-runnable continuous private-paper'],
    }.items():
        text = read(rel)
        for marker in markers:
            require(text, marker, rel)

    package = json.loads(read('package.json'))
    if 'scripts/validate_local_engine_backlog_contract.py' not in package.get('scripts', {}).get('validate:ops', ''):
        fail('package.json validate:ops must include validate_local_engine_backlog_contract.py')
    validator = read('scripts/validate_repo.py')
    for marker in ['scripts/validate_local_engine_backlog_contract.py', 'tests/local-engine-backlog-contract.test.ts']:
        require(validator, marker, 'scripts/validate_repo.py')

    print('validate_local_engine_backlog_contract: ok')


if __name__ == '__main__':
    main()
