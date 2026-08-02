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
    'BWS-700': 'VALIDATED',
    'BWS-705': 'VALIDATED',
    'BWS-710': 'BLOCKED',
    'BWS-720': 'VALIDATED',
    'BWS-730': 'VALIDATED',
    'BWS-740': 'VALIDATED',
    'BWS-750': 'VALIDATED',
    'BWS-760': 'VALIDATED',
    'BWS-770': 'VALIDATED',
    'BWS-780': 'VALIDATED',
    'BWS-790': 'VALIDATED',
    'BWS-800': 'VALIDATED',
    'BWS-810': 'VALIDATED',
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


    active_route_expectations = {
        'README.md': [
            'The selected controller is now `run-autonomous-implementation.sh` for the `BWS-700` B1 implementation queue.',
            'BWS-600 paper/runtime evidence remains a carry-forward gate, not the selected controller route while BWS-700 is active.',
        ],
        'AGENTS.md': [
            'The current source implementation gate is `BWS-700` for the reviewed B1 cross-venue offline falsification program.',
            'Use `run-autonomous-implementation.sh` for the current `BWS-700` B1 implementation queue.',
        ],
        'PROJECT_STATUS.md': [
            'selected_controller=run-autonomous-implementation.sh',
            'selected_task=BWS-700',
            'paper_autopilot_selected=not_selected_while_bws700_queue_is_active',
        ],
        'docs/repo_status_current.md': [
            'The active binding queue is `backlog/bws_b1_cross_venue_implementation.csv`',
            'selected_controller=run-autonomous-implementation.sh',
            'post_overlay_controller=run-autonomous-implementation.sh',
        ],
        'docs/automation/README.md': [
            'run-autonomous-implementation.sh  selected for current BWS-700 B1 implementation queue',
            'Paper autopilot remains available for BWS-600 after upstream API readiness',
        ],
        'docs/automation/repo-profile.md': [
            'run-autonomous-implementation.sh  72h default, selected for current BWS-700 docs/current-task queue',
            'The active source implementation route is now BWS-700 B1 offline falsification',
        ],
        'docs/automation/PROTECTED_AUTOMATION_FILES.md': [
            'current `BWS-700` implementation state',
            'carry-forward `BWS-600` runtime-evidence state',
        ],
        '.automation/README.md': [
            'the active route is now the BWS-700 implementation parent',
            'They are the carry-forward path for `BWS-600` after upstream API readiness',
        ],
        'backlog/README.md': [
            '`BWS-100` through `BWS-599` are validated.',
            '`backlog/bws_b1_cross_venue_implementation.csv` is the active operator-approved B1 implementation queue.',
        ],
        'STARTER_PACK.md': [
            '`backlog/bws_b1_cross_venue_implementation.csv`',
            '`docs/047_b1_cross_venue_offline_falsification_program.md`',
        ],
    }
    for rel, markers in active_route_expectations.items():
        text = read(rel)
        for marker in markers:
            require(text, marker, rel)

    forbidden_active_route_phrases = {
        'README.md': [
            'The selected controller is now `run-paper-autopilot.sh` for the `BWS-600` runtime-evidence campaign.',
        ],
        'AGENTS.md': [
            'Use `run-autonomous-implementation.sh` only for a future validated implementation/source-fix handoff.',
            'Use `run-paper-autopilot.sh` for the current `BWS-600` runtime-evidence gate',
            'There is no current safe-local implementation queue.',
        ],
        'PROJECT_STATUS.md': [
            'selected_task=BWS-600',
            'next_controller=run-paper-autopilot.sh',
            'paper_autopilot_selected=selected_for_bws600_runtime_evidence_after_upstream_api_preflight',
        ],
        'docs/repo_status_current.md': [
            'The binding queue is `backlog/bws_full_implementation.csv`',
            'selected_task_source=docs/041_external_runtime_preflight_and_bws600_campaign.md',
            'post_overlay_controller=run-paper-autopilot.sh',
            'The next normal route is the BWS-600 runtime-evidence parent',
        ],
        'docs/automation/README.md': [
            'run-autonomous-implementation.sh  selected only for future validated source-fix handoffs',
            'Paper autopilot is selected because the `BWS-600` runtime-evidence path',
            'The active gate is `BWS-600` external runtime evidence.',
        ],
        'docs/automation/repo-profile.md': [
            'run-autonomous-implementation.sh  72h default, source-fix handoff only',
            'The active gate is external runtime evidence against an operator-approved betting-win read-only API.',
        ],
        'docs/automation/PROTECTED_AUTOMATION_FILES.md': [
            'for the current `BWS-600` runtime-evidence state or any ordinary implementation',
        ],
        '.automation/README.md': [
            'the active route is the external runtime-evidence parent after the operator starts',
            'They are the selected path for `BWS-600`',
        ],
        'backlog/README.md': [
            '`BWS-100` through `BWS-590` are validated.',
        ],
    }
    for rel, phrases in forbidden_active_route_phrases.items():
        text = read(rel)
        for phrase in phrases:
            if phrase in text:
                fail(f'{rel} still contains stale active-route phrase: {phrase}')

    print('validate_bws_b1_authority: ok')


if __name__ == '__main__':
    main()
