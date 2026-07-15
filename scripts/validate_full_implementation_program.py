from __future__ import annotations

from pathlib import Path
import csv
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
LEDGER = ROOT / 'backlog' / 'bws_full_implementation.csv'
PROGRAM = 'BWS_FULL_PLATFORM_IMPLEMENTATION_V1'
EXPECTED_IDS = [
    'BWS-000', 'BWS-100', 'BWS-110', 'BWS-120', 'BWS-130', 'BWS-140',
    'BWS-200', 'BWS-210', 'BWS-220', 'BWS-230', 'BWS-240',
    'BWS-300', 'BWS-310', 'BWS-320', 'BWS-400', 'BWS-410', 'BWS-420',
    'BWS-500', 'BWS-510', 'BWS-520', 'BWS-530', 'BWS-540', 'BWS-550',
    'BWS-560', 'BWS-570', 'BWS-580', 'BWS-600', 'BWS-900',
]
EXPECTED_STATUS = {
    'BWS-000': 'VALIDATED',
    'BWS-100': 'VALIDATED',
    'BWS-110': 'VALIDATED',
    'BWS-120': 'VALIDATED',
    'BWS-130': 'VALIDATED',
    'BWS-140': 'VALIDATED',
    'BWS-200': 'VALIDATED',
    'BWS-210': 'VALIDATED',
    'BWS-220': 'VALIDATED',
    'BWS-230': 'VALIDATED',
    'BWS-240': 'VALIDATED',
    'BWS-300': 'VALIDATED',
    'BWS-310': 'VALIDATED',
    'BWS-320': 'VALIDATED',
    'BWS-400': 'VALIDATED',
    'BWS-410': 'VALIDATED',
    'BWS-420': 'VALIDATED',
    'BWS-500': 'VALIDATED',
    'BWS-510': 'VALIDATED',
    'BWS-520': 'PENDING',
    'BWS-530': 'PENDING',
    'BWS-540': 'PENDING',
    'BWS-550': 'PENDING',
    'BWS-560': 'PENDING',
    'BWS-570': 'PENDING',
    'BWS-580': 'PENDING',
    'BWS-600': 'BLOCKED',
    'BWS-900': 'PARKED',
}
EXPECTED_DEPS = {
    'BWS-000': [],
    'BWS-100': ['BWS-000'],
    'BWS-110': ['BWS-100'],
    'BWS-120': ['BWS-110'],
    'BWS-130': ['BWS-100', 'BWS-110', 'BWS-120'],
    'BWS-140': ['BWS-100', 'BWS-110'],
    'BWS-200': ['BWS-130'],
    'BWS-210': ['BWS-200'],
    'BWS-220': ['BWS-210'],
    'BWS-230': ['BWS-220'],
    'BWS-240': ['BWS-200', 'BWS-230'],
    'BWS-300': ['BWS-130', 'BWS-210', 'BWS-220', 'BWS-230', 'BWS-240'],
    'BWS-310': ['BWS-120', 'BWS-140', 'BWS-210', 'BWS-220', 'BWS-230'],
    'BWS-320': ['BWS-240', 'BWS-300', 'BWS-310'],
    'BWS-400': ['BWS-120', 'BWS-210', 'BWS-320'],
    'BWS-410': ['BWS-310', 'BWS-400'],
    'BWS-420': ['BWS-400'],
    'BWS-500': ['BWS-410', 'BWS-420'],
    'BWS-510': ['BWS-300', 'BWS-320', 'BWS-400', 'BWS-410', 'BWS-420', 'BWS-500'],
    'BWS-520': ['BWS-510'],
    'BWS-530': ['BWS-520', 'BWS-130'],
    'BWS-540': ['BWS-520', 'BWS-140'],
    'BWS-550': ['BWS-530', 'BWS-540', 'BWS-410'],
    'BWS-560': ['BWS-550', 'BWS-500'],
    'BWS-570': ['BWS-560', 'BWS-420'],
    'BWS-580': ['BWS-570'],
    'BWS-600': ['BWS-580', 'accepted_betting_win_live_read_only_runtime'],
    'BWS-900': ['explicit_execution_authorization'],
}
ALLOWED_STATUS = {'PENDING', 'IN_PROGRESS', 'VALIDATED', 'BLOCKED', 'PARKED'}
ACTIVE_AUTHORITY = [
    'README.md', 'AGENTS.md', 'PROJECT_STATUS.md', 'docs/MASTER_PLAN.md',
    'docs/repo_status_current.md', 'docs/028_full_implementation_program.md',
    'docs/029_full_implementation_task_ledger.md',
    'docs/033_continuous_private_paper_runtime_program.md',
    'docs/automation/current-implementation-task.md',
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


def parse_dependencies(raw: str) -> list[str]:
    value = raw.strip()
    if value == 'none':
        return []
    return [item.strip() for item in value.split(',') if item.strip()]


def main() -> None:
    if not LEDGER.is_file():
        fail('missing backlog/bws_full_implementation.csv')
    with LEDGER.open(newline='', encoding='utf-8') as handle:
        reader = csv.DictReader(handle)
        required_columns = ['id', 'status', 'depends_on', 'objective', 'required_proof']
        if reader.fieldnames != required_columns:
            fail(f'ledger columns must be {required_columns!r}, found {reader.fieldnames!r}')
        rows = list(reader)

    ids = [row['id'] for row in rows]
    if ids != EXPECTED_IDS:
        fail(f'ledger task order mismatch: {ids!r}')
    if len(ids) != len(set(ids)):
        fail('ledger contains duplicate task IDs')

    known = set(ids)
    for row in rows:
        task_id = row['id']
        status = row['status']
        if status not in ALLOWED_STATUS:
            fail(f'{task_id} has unsupported status: {status}')
        if status != EXPECTED_STATUS[task_id]:
            fail(f'{task_id} status must be {EXPECTED_STATUS[task_id]}, found {status}')
        deps = parse_dependencies(row['depends_on'])
        if deps != EXPECTED_DEPS[task_id]:
            fail(f'{task_id} dependencies must be {EXPECTED_DEPS[task_id]!r}, found {deps!r}')
        if not row['objective'].strip() or not row['required_proof'].strip():
            fail(f'{task_id} objective and required_proof must be non-empty')
        for dep in deps:
            if dep.startswith('BWS-') and dep not in known:
                fail(f'{task_id} references unknown internal dependency: {dep}')

    validated = {row['id'] for row in rows if row['status'] == 'VALIDATED'}
    ready = [
        row['id'] for row in rows
        if row['status'] == 'PENDING'
        and all(dep in validated for dep in parse_dependencies(row['depends_on']))
    ]
    if ready != ['BWS-520']:
        fail(f'first dependency-ready continuous-runtime task must be BWS-520, found {ready!r}')

    for rel in ACTIVE_AUTHORITY:
        text = read(rel)
        require(text, PROGRAM, rel)
        if 'repo-local backlogs are complete' in text:
            fail(f'{rel} contains superseded fixture-complete routing language')

    task = read('docs/automation/current-implementation-task.md')
    for marker in [
        'current_task=BWS-520', 'current_task_status=PENDING',
        'safe_local_terminal_gate=BWS-580', 'backlog/bws_full_implementation.csv',
        'docs/033_continuous_private_paper_runtime_program.md',
        'BETTING_WIN_REPO_PATH', 'CONTINUE_REQUIRED=yes',
        'AUTONOMOUS_GOAL_COMPLETE=yes',
        'protected_automation_files=read_only',
    ]:
        require(task, marker, 'docs/automation/current-implementation-task.md')

    status = read('docs/repo_status_current.md')
    for marker in [
        'status=IMPLEMENTATION_READY', 'current_task=BWS-520',
        'current_task_status=PENDING', 'safe_local_terminal_gate=BWS-580',
        'selected_controller=run-autonomous-implementation.sh',
        'paper_autopilot=not_selected_until_bws_580_validation_and_runtime_controller_review',
        'run_autonomous_implementation=standardized_and_selected_for_continuous_runtime_build',
    ]:
        require(status, marker, 'docs/repo_status_current.md')

    runtime_program = read('docs/033_continuous_private_paper_runtime_program.md')
    for marker in [
        'start.sh', 'stop.sh', 'single-pass no-service',
        'BWS-520', 'BWS-530', 'BWS-540', 'BWS-550',
        'BWS-560', 'BWS-570', 'BWS-580', 'BWS-600',
        'automatic_upstream_mode_fallback=prohibited',
        'Protected automation sequencing',
        'without editing protected root controllers',
    ]:
        require(runtime_program, marker, 'docs/033_continuous_private_paper_runtime_program.md')

    for rel in [
        'docs/014_sure_001_remaining_hardening_backlog.md',
        'docs/015_local_engine_implementation_backlog.md',
        'docs/017_private_paper_mode_implementation_backlog.md',
    ]:
        text = read(rel)
        require(text, 'status=SUPERSEDED_BOOTSTRAP_LEDGER', rel)
        require(text, f'active_program={PROGRAM}', rel)

    package = json.loads(read('package.json'))
    scripts = package.get('scripts', {})
    if 'scripts/validate_full_implementation_program.py' not in scripts.get('validate:ops', ''):
        fail('package.json validate:ops must include validate_full_implementation_program.py')
    if scripts.get('validate:implementation-program') != 'PYTHONDONTWRITEBYTECODE=1 python3 scripts/validate_full_implementation_program.py':
        fail('package.json validate:implementation-program is missing or non-canonical')

    loopback_validator = read('scripts/validate_bws_loopback_acceptance.mjs')
    for marker in [
        'DB_URL_TEST', 'repo-local .env', 'Do not mix a partial SUREBET_TEST_* tuple with DB_URL_TEST',
        'SUREBET_TEST_ADMIN_DATABASE', 'SUREBET_TEST_USER', 'SUREBET_TEST_PORT',
    ]:
        require(loopback_validator, marker, 'scripts/validate_bws_loopback_acceptance.mjs')

    repo_validator = read('scripts/validate_repo.py')
    for marker in [
        'backlog/bws_full_implementation.csv',
        'docs/033_continuous_private_paper_runtime_program.md',
        'scripts/validate_full_implementation_program.py',
        'tests/full-implementation-program-contract.test.ts',
    ]:
        require(repo_validator, marker, 'scripts/validate_repo.py')

    print('validate_full_implementation_program: ok')


if __name__ == '__main__':
    main()
