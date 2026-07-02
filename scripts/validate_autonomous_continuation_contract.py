from __future__ import annotations

from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
RUNNER = ROOT / 'run-autonomous-implementation.sh'
BACKLOG = ROOT / 'docs' / '014_sure_001_remaining_hardening_backlog.md'
LOCAL_BACKLOG = ROOT / 'docs' / '015_local_engine_implementation_backlog.md'
AGENTS = ROOT / 'AGENTS.md'
MASTER_PLAN = ROOT / 'docs' / 'MASTER_PLAN.md'
PACKAGE = ROOT / 'package.json'
VALIDATE_REPO = ROOT / 'scripts' / 'validate_repo.py'


def fail(message: str) -> None:
    print(f'ERROR: {message}', file=sys.stderr)
    raise SystemExit(1)


def read(path: Path) -> str:
    if not path.is_file():
        fail(f'missing required file: {path.relative_to(ROOT)}')
    return path.read_text(encoding='utf-8')


def require(text: str, marker: str, rel: str) -> None:
    if marker not in text:
        fail(f'{rel} missing required marker: {marker}')


def main() -> None:
    runner = read(RUNNER)
    backlog = read(BACKLOG)
    local_backlog = read(LOCAL_BACKLOG)
    agents = read(AGENTS)
    master_plan = read(MASTER_PLAN)
    package = json.loads(read(PACKAGE))
    validate_repo = read(VALIDATE_REPO)

    forbidden_runner_markers = [
        'Implement exactly one bounded safe SURE-001 hardening slice from the current repository truth. Stop after one slice.',
        'If the next required work is SURE-002 or later, return BLOCKED=yes with the missing pinned betting-win contract/export interface.',
    ]
    for marker in forbidden_runner_markers:
        if marker in runner:
            fail(f'run-autonomous-implementation.sh still contains one-slice stop marker: {marker}')

    for marker in [
        'docs/014_sure_001_remaining_hardening_backlog.md',
        'Continue across cycles while safe documented backlog remains in docs/014_sure_001_remaining_hardening_backlog.md or docs/015_local_engine_implementation_backlog.md',
        'Do not stop with AUTONOMOUS_GOAL_COMPLETE=yes after one completed slice',
        'Use CONTINUE_REQUIRED=yes when docs/014_sure_001_remaining_hardening_backlog.md still has a safe unchecked SURE-001 item',
        'Use CONTINUE_REQUIRED=yes when docs/015_local_engine_implementation_backlog.md still has a safe unchecked local implementation item',
        'Use AUTONOMOUS_GOAL_COMPLETE=yes only when both backlogs are exhausted',
    ]:
        require(runner, marker, 'run-autonomous-implementation.sh')

    for marker in [
        'SURE-001 remaining hardening backlog',
        'CONTINUE_REQUIRED=yes',
        'AUTONOMOUS_GOAL_COMPLETE=yes',
        'SOURCE_MANIFEST.json regeneration helper',
        'SURE-002+ remains blocked',
        'provider connections',
        'solver implementation',
    ]:
        require(backlog, marker, 'docs/014_sure_001_remaining_hardening_backlog.md')

    require(agents, 'Implement one bounded slice per cycle', 'AGENTS.md')
    require(master_plan, 'docs/014_sure_001_remaining_hardening_backlog.md', 'docs/MASTER_PLAN.md')
    require(master_plan, 'docs/015_local_engine_implementation_backlog.md', 'docs/MASTER_PLAN.md')

    for marker in [
        'SURE-002A_LOCAL_INTERFACE_AND_ENGINE_BOOTSTRAP',
        'Local implementation backlog',
        'CONTINUE_REQUIRED=yes',
        'provider SDK/client imports',
        'profitability claims',
    ]:
        require(local_backlog, marker, 'docs/015_local_engine_implementation_backlog.md')

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
