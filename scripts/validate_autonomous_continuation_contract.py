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
    automation_readme = read('docs/automation/README.md')

    for marker in [
        'BWS_FULL_PLATFORM_IMPLEMENTATION_V1', 'backlog/bws_full_implementation.csv',
        'backlog/bws_remaining_safe_local_map.csv', 'BWS-100', 'BWS-589', 'BWS-590', 'BWS-599',
        'BWS-100` through `BWS-589` are validated carry-forward foundations',
        'Protected automation policy',
    ]:
        require(implementation, marker, 'docs/automation/autonomous-implementation.md')

    for marker in [
        'current_task=BWS-600', 'current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE',
        'active_implementation_queue=none',
        'active_implementation_map=none',
        'selected_controller=run-paper-autopilot.sh',
        'bws600_current_task=BWS-600',
        'bws600_current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE',
        'bws600_active_implementation_queue=none',
        'betting_win_api_preflight_required=before_bws_runtime_evidence_window',
        'safe_local_terminal_gate=BWS-599', 'BETTING_WIN_REPO_PATH',
        'automation_maintenance_allowed=no', 'allowed_protected_files=none',
        'provider_connections=prohibited', 'execution=prohibited',
    ]:
        require(task, marker, 'docs/automation/current-implementation-task.md')

    for marker in [
        'status=B1_DEPENDENCY_READY_LOCAL_IMPLEMENTATION_COMPLETE', 'current_task=BWS-600',
        'current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE', 'safe_local_terminal_gate=BWS-599',
        'selected_controller=run-paper-autopilot.sh',
        'active_implementation_queue=none',
        'bws600_status=RUNTIME_EVIDENCE_READY',
        'bws600_current_task=BWS-600',
        'bws600_current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE',
        'run_autonomous_implementation=available_for_future_reviewed_source_handoff_or_unblocked_bws710',
        'run_paper_autopilot=standardized_selected_for_bws600_runtime_evidence_after_bws700_local_completion',
        'bws600_run_paper_autopilot=selected_for_bws600_runtime_evidence_after_upstream_api_preflight',
    ]:
        require(status, marker, 'docs/repo_status_current.md')


    for marker in [
        'Active post-BWS-700 controller route',
        '`run-paper-autopilot.sh` is selected for `BWS-600` runtime evidence',
        '`run-autonomous-implementation.sh` is not the selected route now',
        'truthful upstream API blocker',
    ]:
        require(automation_readme, marker, 'docs/automation/README.md')

    forbidden_readme_markers = [
        '`run-autonomous-implementation.sh` is selected for the BWS-700 B1 implementation queue',
        'not the selected route for the B1 implementation overlay',
    ]
    for marker in forbidden_readme_markers:
        if marker in automation_readme:
            fail(f'docs/automation/README.md contains stale route marker: {marker}')

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
