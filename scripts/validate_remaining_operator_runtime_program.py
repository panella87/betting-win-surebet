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
VALIDATED_IDS = {
    'BWS-581', 'BWS-582', 'BWS-583', 'BWS-584', 'BWS-585', 'BWS-586',
    'BWS-587', 'BWS-588', 'BWS-589',
}
PENDING_IDS = {'BWS-590', 'BWS-591', 'BWS-592', 'BWS-593', 'BWS-599'}
BLUEPRINT_DOCS = {
    'docs/034_remaining_operator_runtime_implementation_program.md': [
        'current_task=BWS-590', 'safe_local_terminal_gate=BWS-599',
        'paper evaluation=runtime_evidence_mode_validated',
        'backlog/bws_remaining_safe_local_map.csv', 'BWS-590', 'BWS-599', 'BWS-600',
    ],
    'docs/035_continuous_service_supervisor_contract.md': [
        'BWS-581', 'BWS-582', 'BWS-583', 'BWS-584',
        'prevent overlapping passes', 'graceful-drain', 'no process-name killing',
    ],
    'docs/036_root_wrappers_and_paper_automation_integration.md': [
        'BWS-587', 'BWS-588', 'BWS-589', 'run-autonomous-implementation.sh',
        'run-paper-autopilot.sh', 'automation_maintenance_allowed=no',
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
    'docs/042_release_packaging_implementation_blueprint.md': [
        'parent_task=BWS-590', 'largest safe cohesive', 'Non-mutating install verification', 'Unchanged areas',
    ],
    'docs/043_upgrade_rollback_recovery_implementation_blueprint.md': [
        'parent_task=BWS-591', 'bws.upgrade_plan.v1', 'Rollback decision', 'Disposable proof',
    ],
    'docs/044_soak_failure_injection_implementation_blueprint.md': [
        'parent_task=BWS-592', 'canonical_server_soak_duration=2h', 'Failure injection matrix', 'Multi-hour acceptance',
    ],
    'docs/045_external_runtime_preflight_implementation_blueprint.md': [
        'parent_task=BWS-593', 'bws.external_runtime_campaign.v1', 'Exactly-one-mode input', 'Check-only guarantee',
    ],
    'docs/046_final_local_acceptance_implementation_blueprint.md': [
        'parent_task=BWS-599', 'Clean-room boundary', 'Acceptance stages', 'Final acceptance manifest',
    ],
    'decisions/ADR-0006-full-stack-runtime-and-automation-boundary.md': [
        'safe local terminal gate moves to `BWS-599`', 'BWS-600', 'BWS-900',
    ],
}
MAP_COLUMNS = [
    'subtask_id', 'parent_task', 'dependency_state', 'depends_on', 'cohesive_tranche',
    'objective', 'primary_areas', 'acceptance', 'validation', 'blockers', 'unchanged_areas',
]


def fail(message: str) -> None:
    print(f'ERROR: {message}', file=sys.stderr)
    raise SystemExit(1)


def read(rel: str) -> str:
    path = ROOT / rel
    if not path.is_file():
        fail(f'missing required file: {rel}')
    return path.read_text(encoding='utf-8')


def main() -> None:
    for rel, markers in BLUEPRINT_DOCS.items():
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
        expected = 'VALIDATED' if task_id in VALIDATED_IDS else 'PENDING'
        if rows[task_id]['status'] != expected:
            fail(f'{task_id} must be {expected}, found {rows[task_id]["status"]}')
        if not rows[task_id]['objective'].strip() or not rows[task_id]['required_proof'].strip():
            fail(f'{task_id} must have objective and required proof')

    map_path = ROOT / 'backlog' / 'bws_remaining_safe_local_map.csv'
    if not map_path.is_file():
        fail('missing backlog/bws_remaining_safe_local_map.csv')
    with map_path.open(newline='', encoding='utf-8') as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != MAP_COLUMNS:
            fail(f'remaining map columns must be {MAP_COLUMNS!r}, found {reader.fieldnames!r}')
        map_rows = list(reader)
    if len(map_rows) < 15:
        fail('remaining implementation map must contain a substantive subtask decomposition')
    ids = [row['subtask_id'] for row in map_rows]
    if len(ids) != len(set(ids)):
        fail('remaining implementation map contains duplicate subtask ids')
    parents = {row['parent_task'] for row in map_rows}
    if parents != PENDING_IDS:
        fail(f'remaining implementation map parent tasks must be {sorted(PENDING_IDS)!r}, found {sorted(parents)!r}')
    for row in map_rows:
        if row['dependency_state'] not in {'READY', 'WAITING'}:
            fail(f'{row["subtask_id"]} has invalid dependency_state')
        if row['parent_task'] == 'BWS-590' and row['dependency_state'] != 'READY':
            fail(f'{row["subtask_id"]} under BWS-590 must be READY')
        if row['parent_task'] != 'BWS-590' and row['dependency_state'] != 'WAITING':
            fail(f'{row["subtask_id"]} under {row["parent_task"]} must be WAITING')
        for field in MAP_COLUMNS:
            if not row[field].strip():
                fail(f'{row["subtask_id"]} has empty {field}')

    for rel in [
        'README.md', 'AGENTS.md', 'PROJECT_STATUS.md', 'STARTER_PACK.md',
        'docs/MASTER_PLAN.md', 'docs/repo_status_current.md',
        'docs/automation/current-implementation-task.md',
    ]:
        text = read(rel)
        for marker in [PROGRAM, 'BWS-590', 'BWS-599']:
            if marker not in text:
                fail(f'{rel} missing required marker: {marker}')

    task = read('docs/automation/current-implementation-task.md')
    if task.count('automation_maintenance_allowed=') != 1:
        fail('task file must contain exactly one automation_maintenance_allowed marker')
    if task.count('allowed_protected_files=') != 1:
        fail('task file must contain exactly one allowed_protected_files marker')
    for marker in [
        'automation_maintenance_allowed=no', 'allowed_protected_files=none',
        'recommended_cycle_timeout=6h', 'backlog/bws_remaining_safe_local_map.csv',
        'docs/042_release_packaging_implementation_blueprint.md',
        'docs/046_final_local_acceptance_implementation_blueprint.md',
    ]:
        if marker not in task:
            fail(f'task file missing reconciled marker: {marker}')

    print('validate_remaining_operator_runtime_program: ok')


if __name__ == '__main__':
    main()
