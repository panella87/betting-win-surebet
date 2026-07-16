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
    'BWS-560', 'BWS-570', 'BWS-580', 'BWS-581', 'BWS-582', 'BWS-583',
    'BWS-584', 'BWS-585', 'BWS-586', 'BWS-587', 'BWS-588', 'BWS-589',
    'BWS-590', 'BWS-591', 'BWS-592', 'BWS-593', 'BWS-599', 'BWS-600',
    'BWS-900',
]
VALIDATED_IDS = {
    'BWS-000', 'BWS-100', 'BWS-110', 'BWS-120', 'BWS-130', 'BWS-140',
    'BWS-200', 'BWS-210', 'BWS-220', 'BWS-230', 'BWS-240',
    'BWS-300', 'BWS-310', 'BWS-320', 'BWS-400', 'BWS-410', 'BWS-420',
    'BWS-500', 'BWS-510', 'BWS-520', 'BWS-530', 'BWS-540', 'BWS-550',
    'BWS-560', 'BWS-570', 'BWS-580', 'BWS-581', 'BWS-582', 'BWS-583',
    'BWS-584', 'BWS-585', 'BWS-586', 'BWS-587', 'BWS-588', 'BWS-589',
}
PENDING_IDS = {
    'BWS-590', 'BWS-591', 'BWS-592',
    'BWS-593', 'BWS-599',
}
EXPECTED_STATUS = {
    **{task_id: 'VALIDATED' for task_id in VALIDATED_IDS},
    **{task_id: 'PENDING' for task_id in PENDING_IDS},
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
    'BWS-581': ['BWS-580'],
    'BWS-582': ['BWS-581', 'BWS-550'],
    'BWS-583': ['BWS-581', 'BWS-582', 'BWS-420'],
    'BWS-584': ['BWS-582', 'BWS-583', 'BWS-560'],
    'BWS-585': ['BWS-584', 'BWS-120'],
    'BWS-586': ['BWS-584', 'BWS-570'],
    'BWS-587': ['BWS-584', 'BWS-585', 'BWS-586'],
    'BWS-588': ['BWS-587', 'BWS-580'],
    'BWS-589': ['BWS-588'],
    'BWS-590': ['BWS-587', 'BWS-589'],
    'BWS-591': ['BWS-585', 'BWS-590'],
    'BWS-592': ['BWS-589', 'BWS-591'],
    'BWS-593': ['BWS-592', 'BWS-100'],
    'BWS-599': ['BWS-593'],
    'BWS-600': ['BWS-599', 'accepted_betting_win_live_read_only_runtime'],
    'BWS-900': ['explicit_execution_authorization'],
}
ALLOWED_STATUS = {'PENDING', 'IN_PROGRESS', 'VALIDATED', 'BLOCKED', 'PARKED'}
ACTIVE_AUTHORITY = [
    'README.md', 'AGENTS.md', 'PROJECT_STATUS.md', 'docs/MASTER_PLAN.md',
    'docs/repo_status_current.md', 'docs/028_full_implementation_program.md',
    'docs/029_full_implementation_task_ledger.md',
    'docs/033_continuous_private_paper_runtime_program.md',
    'docs/034_remaining_operator_runtime_implementation_program.md',
    'docs/automation/current-implementation-task.md',
]
REMAINING_DOCS = [
    'docs/034_remaining_operator_runtime_implementation_program.md',
    'docs/035_continuous_service_supervisor_contract.md',
    'docs/036_root_wrappers_and_paper_automation_integration.md',
    'docs/037_database_backup_retention_and_recovery.md',
    'docs/038_observability_metrics_and_evidence_contract.md',
    'docs/039_release_deployment_and_upgrade_contract.md',
    'docs/040_soak_failure_injection_and_operator_acceptance.md',
    'docs/041_external_runtime_preflight_and_bws600_campaign.md',
    'docs/042_release_packaging_implementation_blueprint.md',
    'docs/043_upgrade_rollback_recovery_implementation_blueprint.md',
    'docs/044_soak_failure_injection_implementation_blueprint.md',
    'docs/045_external_runtime_preflight_implementation_blueprint.md',
    'docs/046_final_local_acceptance_implementation_blueprint.md',
    'decisions/ADR-0006-full-stack-runtime-and-automation-boundary.md',
]
SUPPORTING_MAP = 'backlog/bws_remaining_safe_local_map.csv'


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
        columns = ['id', 'status', 'depends_on', 'objective', 'required_proof']
        if reader.fieldnames != columns:
            fail(f'ledger columns must be {columns!r}, found {reader.fieldnames!r}')
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
    if not ready or ready[0] != 'BWS-590':
        fail(f'first dependency-ready task must be BWS-590, found {ready!r}')

    for rel in ACTIVE_AUTHORITY:
        text = read(rel)
        require(text, PROGRAM, rel)
        require(text, 'BWS-599', rel)

    for rel in REMAINING_DOCS:
        text = read(rel)
        require(text, 'BWS-599', rel) if rel.endswith('034_remaining_operator_runtime_implementation_program.md') else None

    task = read('docs/automation/current-implementation-task.md')
    for marker in [
        'current_task=BWS-590', 'current_task_status=PENDING',
        'safe_local_terminal_gate=BWS-599', 'backlog/bws_full_implementation.csv',
        'docs/034_remaining_operator_runtime_implementation_program.md',
        'CONTINUE_REQUIRED=yes', 'AUTONOMOUS_GOAL_COMPLETE=yes',
        'automation_maintenance_allowed=no',
        'allowed_protected_files=none',
        SUPPORTING_MAP,
        'docs/042_release_packaging_implementation_blueprint.md',
        'docs/046_final_local_acceptance_implementation_blueprint.md',
        'recommended_cycle_timeout=6h',
        'pre_existing_service_mutation=prohibited',
    ]:
        require(task, marker, 'docs/automation/current-implementation-task.md')

    status = read('docs/repo_status_current.md')
    for marker in [
        'status=IMPLEMENTATION_READY', 'current_task=BWS-590',
        'current_task_status=PENDING', 'safe_local_terminal_gate=BWS-599',
        'selected_controller=run-autonomous-implementation.sh',
        'paper_autopilot=runtime_evidence_parent_validated_pending_bws_599',
    ]:
        require(status, marker, 'docs/repo_status_current.md')

    runtime_program = read('docs/034_remaining_operator_runtime_implementation_program.md')
    for marker in [
        'paper evaluation=runtime_evidence_mode_validated',
        'BWS-581', 'BWS-589', 'BWS-599', 'BWS-600',
        'automatic_upstream_mode_fallback=prohibited',
    ]:
        require(runtime_program, marker, 'docs/034_remaining_operator_runtime_implementation_program.md')

    implementation_script = read('run-autonomous-implementation.sh')
    for marker in [
        'task_file_exact_protected_allowlist=enabled',
        'manual_blanket_protected_override=disabled',
        'configure_task_file_protected_policy()',
        'AUTOMATION_ALLOW_PROTECTED_CHANGES=1 is forbidden without task-file or handoff authorization',
        'protected_changes_allowed=exact_allowlist',
        'Bounded repo-owned loopback child processes may be started only inside task-required tests or validation.',
    ]:
        require(implementation_script, marker, 'run-autonomous-implementation.sh')
    if 'protected_changes_allowed=manual_explicit_override' in implementation_script:
        fail('run-autonomous-implementation.sh still contains blanket manual protected override')

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
    if 'scripts/validate_remaining_operator_runtime_program.py' not in scripts.get('validate:ops', ''):
        fail('package.json validate:ops must include validate_remaining_operator_runtime_program.py')
    if scripts.get('validate:implementation-program') != 'PYTHONDONTWRITEBYTECODE=1 python3 scripts/validate_full_implementation_program.py':
        fail('package.json validate:implementation-program is missing or non-canonical')

    loopback_validator = read('scripts/validate_bws_loopback_acceptance.mjs')
    for marker in ['DB_URL_TEST', 'repo-local .env', 'SUREBET_TEST_ADMIN_DATABASE', 'SUREBET_TEST_USER']:
        require(loopback_validator, marker, 'scripts/validate_bws_loopback_acceptance.mjs')

    repo_validator = read('scripts/validate_repo.py')
    for marker in [
        'docs/034_remaining_operator_runtime_implementation_program.md',
        'docs/041_external_runtime_preflight_and_bws600_campaign.md',
        'docs/042_release_packaging_implementation_blueprint.md',
        'docs/046_final_local_acceptance_implementation_blueprint.md',
        SUPPORTING_MAP,
        'decisions/ADR-0006-full-stack-runtime-and-automation-boundary.md',
        'scripts/validate_remaining_operator_runtime_program.py',
        'tests/remaining-operator-runtime-program-contract.test.ts',
    ]:
        require(repo_validator, marker, 'scripts/validate_repo.py')

    print('validate_full_implementation_program: ok')


if __name__ == '__main__':
    main()
