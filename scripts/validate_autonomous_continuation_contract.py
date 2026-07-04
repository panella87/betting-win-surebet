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
    package = json.loads(read('package.json'))
    validate_repo = read('scripts/validate_repo.py')

    for marker in [
        'docs/014_sure_001_remaining_hardening_backlog.md',
        'docs/015_local_engine_implementation_backlog.md',
        'docs/017_private_paper_mode_implementation_backlog.md',
        'repo-local backlogs are complete',
        'AUTONOMOUS_GOAL_COMPLETE=yes',
        'Federico',
    ]:
        require(implementation, marker, 'docs/automation/autonomous-implementation.md')

    for marker in [
        'Fix only confirmed repo-local validation/tooling defects',
        'provider_connections=prohibited',
        'execution=prohibited',
        'real_upstream_evaluation=blocked_until_federico_pinned_betting_win_interface',
    ]:
        require(task, marker, 'docs/automation/current-implementation-task.md')

    for marker in [
        'The repo-local SURE-001 hardening backlog, the safe SURE-002A local implementation backlog, and the safe SURE-002B private paper-mode backlog are exhausted',
        'AUTONOMOUS_GOAL_COMPLETE=yes',
        'Federico',
    ]:
        require(status, marker, 'docs/repo_status_current.md')

    validate_ops = package.get('scripts', {}).get('validate:ops', '')
    if 'scripts/validate_autonomous_continuation_contract.py' not in validate_ops:
        fail('package.json validate:ops must include validate_autonomous_continuation_contract.py')
    if 'scripts/validate_autonomous_continuation_contract.py' not in validate_repo:
        fail('scripts/validate_repo.py must require validate_autonomous_continuation_contract.py')
    if 'tests/autonomous-continuation-contract.test.ts' not in validate_repo:
        fail('scripts/validate_repo.py must require tests/autonomous-continuation-contract.test.ts')
    print('validate_autonomous_continuation_contract: ok')

if __name__ == '__main__':
    main()
