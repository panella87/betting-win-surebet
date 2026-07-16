from __future__ import annotations

from pathlib import Path
import csv
import sys

ROOT = Path(__file__).resolve().parents[1]
PROGRAM = 'BWS_FULL_PLATFORM_IMPLEMENTATION_V1'
TASK_IDS = [
    'BWS-581', 'BWS-582', 'BWS-583', 'BWS-584', 'BWS-585', 'BWS-586',
    'BWS-587', 'BWS-588', 'BWS-589', 'BWS-590', 'BWS-591', 'BWS-592',
    'BWS-593', 'BWS-599',
]
DOC_MARKERS = {
    'docs/034_remaining_operator_runtime_implementation_program.md': [
        'current_task=BWS-590', 'safe_local_terminal_gate=BWS-599',
        'paper evaluation=runtime_evidence_mode_validated',
        'BWS-581', 'BWS-589', 'BWS-599', 'BWS-600',
    ],
    'docs/035_continuous_service_supervisor_contract.md': [
        'BWS-581', 'BWS-582', 'BWS-583', 'BWS-584',
        'prevent overlapping passes', 'graceful-drain', 'no process-name killing',
    ],
    'docs/036_root_wrappers_and_paper_automation_integration.md': [
        'BWS-587', 'BWS-588', 'BWS-589', 'AUTOMATION_ALLOW_PROTECTED_CHANGES=1',
        'start.sh', 'run-paper-autopilot.sh', 'paper_service_lifecycle=none',
    ],
    'docs/037_database_backup_retention_and_recovery.md': [
        'BWS-585', 'disposable database', 'SHA-256', 'default command is dry-run',
    ],
    'docs/038_observability_metrics_and_evidence_contract.md': [
        'BWS-586', 'Structured logs', 'Metrics', 'Diagnostics', 'Evidence index and retention',
    ],
    'docs/039_release_deployment_and_upgrade_contract.md': [
        'BWS-590', 'BWS-591', 'Release package', 'Upgrade', 'Rollback and recovery',
    ],
    'docs/040_soak_failure_injection_and_operator_acceptance.md': [
        'BWS-592', 'BWS-599', 'Failure matrix', 'integrated acceptance',
    ],
    'docs/041_external_runtime_preflight_and_bws600_campaign.md': [
        'BWS-593', 'BWS-600', 'bws.external_runtime_campaign.v1', 'Execution boundary',
    ],
    'decisions/ADR-0006-full-stack-runtime-and-automation-boundary.md': [
        'safe local terminal gate moves to `BWS-599`', 'BWS-600', 'BWS-900',
    ],
}


def fail(message: str) -> None:
    print(f'ERROR: {message}', file=sys.stderr)
    raise SystemExit(1)


def read(rel: str) -> str:
    path = ROOT / rel
    if not path.is_file():
        fail(f'missing required file: {rel}')
    return path.read_text(encoding='utf-8')


def main() -> None:
    for rel, markers in DOC_MARKERS.items():
        text = read(rel)
        for marker in markers:
            if marker not in text:
                fail(f'{rel} missing required marker: {marker}')

    ledger = ROOT / 'backlog' / 'bws_full_implementation.csv'
    with ledger.open(newline='', encoding='utf-8') as handle:
        rows = {row['id']: row for row in csv.DictReader(handle)}
    for task_id in TASK_IDS:
        if task_id not in rows:
            fail(f'ledger missing remaining task: {task_id}')
        if task_id in {'BWS-581', 'BWS-582', 'BWS-583', 'BWS-584', 'BWS-585'}:
            if rows[task_id]['status'] != 'VALIDATED':
                fail(f'{task_id} must be VALIDATED after its runtime service milestone lands')
        elif task_id in {'BWS-586', 'BWS-588', 'BWS-589'}:
            if rows[task_id]['status'] != 'VALIDATED':
                fail(f'{task_id} must be VALIDATED after its landed milestone closes')
        elif task_id == 'BWS-587':
            if rows[task_id]['status'] != 'VALIDATED':
                fail(f'{task_id} must be VALIDATED after the protected root wrapper milestone lands')
        elif rows[task_id]['status'] != 'PENDING':
            fail(f'{task_id} must initially be PENDING')
        if not rows[task_id]['objective'].strip() or not rows[task_id]['required_proof'].strip():
            fail(f'{task_id} must have objective and required proof')

    for rel in [
        'README.md', 'AGENTS.md', 'PROJECT_STATUS.md', 'docs/MASTER_PLAN.md',
        'docs/repo_status_current.md', 'docs/automation/current-implementation-task.md',
    ]:
        text = read(rel)
        for marker in [PROGRAM, 'BWS-599']:
            if marker not in text:
                fail(f'{rel} missing required marker: {marker}')

    task = read('docs/automation/current-implementation-task.md')
    if task.count('automation_maintenance_allowed=') != 1:
        fail('task file must contain exactly one automation_maintenance_allowed marker')
    if task.count('allowed_protected_files=') != 1:
        fail('task file must contain exactly one allowed_protected_files marker')

    print('validate_remaining_operator_runtime_program: ok')


if __name__ == '__main__':
    main()
