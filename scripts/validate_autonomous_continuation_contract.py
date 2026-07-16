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
    implementation = read('docs/automation/autonomous-implementation.md')
    task = read('docs/automation/current-implementation-task.md')
    status = read('docs/repo_status_current.md')

    for marker in [
        'BWS_FULL_PLATFORM_IMPLEMENTATION_V1', 'backlog/bws_full_implementation.csv',
        'BWS-100', 'BWS-580', 'BWS-581', 'BWS-589', 'BWS-599',
        'CONTINUE_REQUIRED=yes', 'AUTONOMOUS_GOAL_COMPLETE=yes',
        'Historical SURE-001/SURE-002A/SURE-002B files are bootstrap ledgers only',
        'task-file automation maintenance',
    ]:
        require(implementation, marker, 'docs/automation/autonomous-implementation.md')

    for marker in [
        'current_task=BWS-581', 'current_task_status=PENDING',
        'safe_local_terminal_gate=BWS-599', 'BETTING_WIN_REPO_PATH',
        'automation_maintenance_allowed=yes', 'allowed_protected_files=',
        'provider_connections=prohibited', 'execution=prohibited',
    ]:
        require(task, marker, 'docs/automation/current-implementation-task.md')

    for marker in [
        'status=IMPLEMENTATION_READY', 'current_task=BWS-581',
        'current_task_status=PENDING', 'safe_local_terminal_gate=BWS-599',
        'selected_controller=run-autonomous-implementation.sh',
    ]:
        require(status, marker, 'docs/repo_status_current.md')

    package = json.loads(read('package.json'))
    validate_ops = package.get('scripts', {}).get('validate:ops', '')
    for marker in [
        'scripts/validate_autonomous_continuation_contract.py',
        'scripts/validate_remaining_operator_runtime_program.py',
    ]:
        if marker not in validate_ops:
            fail(f'package.json validate:ops missing {marker}')

    validator = read('scripts/validate_repo.py')
    for marker in [
        'tests/autonomous-continuation-contract.test.ts',
        'tests/remaining-operator-runtime-program-contract.test.ts',
    ]:
        require(validator, marker, 'scripts/validate_repo.py')

    print('validate_autonomous_continuation_contract: ok')


if __name__ == '__main__':
    main()
