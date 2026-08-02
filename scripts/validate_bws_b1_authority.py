from __future__ import annotations

from pathlib import Path
import csv
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
PROGRAM = 'BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1'
QUEUE = ROOT / 'backlog' / 'bws_b1_cross_venue_implementation.csv'
MAP = ROOT / 'backlog' / 'bws_b1_cross_venue_map.csv'
EXPECTED_IDS = [
    'BWS-700', 'BWS-705', 'BWS-710', 'BWS-720', 'BWS-730', 'BWS-740',
    'BWS-750', 'BWS-760', 'BWS-770', 'BWS-780', 'BWS-790', 'BWS-800',
    'BWS-810', 'BWS-820', 'BWS-830', 'BWS-840',
]
EXPECTED_STATUS = {
    'BWS-700': 'PENDING',
    'BWS-705': 'PENDING',
    'BWS-710': 'BLOCKED',
    'BWS-720': 'PENDING',
    'BWS-730': 'PENDING',
    'BWS-740': 'PENDING',
    'BWS-750': 'PENDING',
    'BWS-760': 'PENDING',
    'BWS-770': 'PENDING',
    'BWS-780': 'PENDING',
    'BWS-790': 'PENDING',
    'BWS-800': 'PENDING',
    'BWS-810': 'PENDING',
    'BWS-820': 'PENDING',
    'BWS-830': 'PARKED',
    'BWS-840': 'PARKED',
}
REQUIRED_DOCS = [
    'docs/047_b1_cross_venue_offline_falsification_program.md',
    'docs/048_b1_upstream_contract.md',
    'docs/049_b1_market_equivalence.md',
    'docs/050_b1_falsification_acceptance.md',
    'docs/051_b1_implementation_map.md',
    'docs/052_b1_future_strategy_stubs.md',
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


def parse_deps(raw: str) -> list[str]:
    value = raw.strip()
    if value == 'none':
        return []
    return [part.strip() for part in value.split(',') if part.strip()]


def main() -> None:
    for rel in REQUIRED_DOCS:
        text = read(rel)
        require(text, PROGRAM, rel)
        require(text, 'BWS-900', rel)

    task = read('docs/automation/current-implementation-task.md')
    for marker in [
        PROGRAM,
        'current_task=BWS-700',
        'current_task_status=READY_FOR_IMPLEMENTATION',
        'active_implementation_queue=backlog/bws_b1_cross_venue_implementation.csv',
        'selected_controller=run-autonomous-implementation.sh',
        'bws600_current_task=BWS-600',
        'bws600_current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE',
        'BWS-710=blocked_until_accepted_betting_win_b1_multi_venue_api',
        'automation_maintenance_allowed=no',
        'allowed_protected_files=none',
    ]:
        require(task, marker, 'docs/automation/current-implementation-task.md')

    status = read('docs/repo_status_current.md')
    for marker in [
        PROGRAM,
        'status=B1_IMPLEMENTATION_READY',
        'current_task=BWS-700',
        'selected_controller=run-autonomous-implementation.sh',
        'b1_real_upstream_intake=BWS-710_BLOCKED_UNTIL_BETTING_WIN_CONTRACT',
        'bws600_current_task=BWS-600',
        'bws600_current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE',
    ]:
        require(status, marker, 'docs/repo_status_current.md')

    with QUEUE.open(newline='', encoding='utf-8') as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != ['id', 'status', 'depends_on', 'objective', 'required_proof']:
            fail(f'B1 queue columns mismatch: {reader.fieldnames!r}')
        rows = list(reader)
    ids = [row['id'] for row in rows]
    if ids != EXPECTED_IDS:
        fail(f'B1 queue task order mismatch: {ids!r}')
    for row in rows:
        task_id = row['id']
        if row['status'] != EXPECTED_STATUS[task_id]:
            fail(f'{task_id} status must be {EXPECTED_STATUS[task_id]}, found {row["status"]}')
        if not row['objective'].strip() or not row['required_proof'].strip():
            fail(f'{task_id} objective and required_proof must be non-empty')
        for dep in parse_deps(row['depends_on']):
            if dep.startswith('BWS-') and dep not in set(EXPECTED_IDS + ['BWS-599']):
                fail(f'{task_id} references unknown dependency: {dep}')

    with MAP.open(newline='', encoding='utf-8') as handle:
        reader = csv.DictReader(handle)
        expected = ['task_id', 'phase', 'primary_docs', 'source_areas', 'test_or_validator_targets', 'hard_blockers']
        if reader.fieldnames != expected:
            fail(f'B1 map columns mismatch: {reader.fieldnames!r}')
        mapped = [row['task_id'] for row in reader]
    if mapped != EXPECTED_IDS:
        fail(f'B1 map task order mismatch: {mapped!r}')

    package = json.loads(read('package.json'))
    scripts = package.get('scripts', {})
    for script in ['validate:bws-b1-authority', 'validate:bws-b1']:
        if script not in scripts:
            fail(f'package.json missing script: {script}')
    validate_ops = scripts.get('validate:ops', '')
    if 'scripts/validate_bws_b1_authority.py' not in validate_ops:
        fail('package.json validate:ops must include validate_bws_b1_authority.py')
    if 'scripts/validate_bws_b1_boundary.py' not in validate_ops:
        fail('package.json validate:ops must include validate_bws_b1_boundary.py')

    print('validate_bws_b1_authority: ok')


if __name__ == '__main__':
    main()
