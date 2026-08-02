from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
PROGRAM = 'BWS_FULL_PLATFORM_IMPLEMENTATION_V1'
B1_PROGRAM = 'BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1'


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
    required = {
        'docs/MASTER_PLAN.md': [
            B1_PROGRAM, f'parent_program={PROGRAM}', 'repo_role=surebet_strategy_application', 'upstream_platform=betting-win',
            'current_task=BWS-600', 'current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE',
            'active_implementation_queue=none',
            'safe_local_terminal_gate=BWS-599', 'continuous_runtime_gate=BWS-600',
            'bws600_current_task=BWS-600', 'execution_gate=BWS-900',
            'BWS-581', 'BWS-599', 'backlog/bws_full_implementation.csv',
            'run-autonomous-implementation.sh', 'run-bugfix-autopilot.sh', 'run-paper-autopilot.sh',
        ],
        'docs/repo_status_current.md': [
            PROGRAM, 'status=B1_DEPENDENCY_READY_LOCAL_IMPLEMENTATION_COMPLETE', 'current_task=BWS-600',
            'safe_local_terminal_gate=BWS-599',
            'selected_controller=run-paper-autopilot.sh',
            'bws600_status=RUNTIME_EVIDENCE_READY',
            'bws600_current_task=BWS-600',
            'bws600_current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE',
        ],
        'docs/028_full_implementation_program.md': [
            PROGRAM, 'BWS-100', 'BWS-580', 'BWS-581', 'BWS-599', 'BWS-600', 'BWS-900',
        ],
        'docs/029_full_implementation_task_ledger.md': [
            PROGRAM, 'backlog/bws_full_implementation.csv',
            'current_task=BWS-599', 'current_task_status=VALIDATED',
        ],
        'docs/030_upstream_compatibility_and_pin_contract.md': [
            'BETTING_WIN_REPO_PATH', 'config/betting-win.upstream.lock.json',
            'workspace', 'export', 'api', 'No fallback',
        ],
        'docs/033_continuous_private_paper_runtime_program.md': [
            'BWS-520', 'BWS-580', 'BWS-581', 'BWS-599', 'BWS-600',
        ],
        'docs/034_remaining_operator_runtime_implementation_program.md': [
            'current_task=BWS-599', 'safe_local_terminal_gate=BWS-599',
            'BWS-581', 'BWS-589', 'BWS-599',
        ],
        'docs/012_runbook.md': [
            'current_task=BWS-600', 'selected_controller=run-paper-autopilot.sh',
            'bws600_current_task=BWS-600', 'bws600_selected_controller=run-paper-autopilot.sh',
            'BWS-599', 'run-paper-autopilot.sh',
        ],
        'docs/018_private_paper_mode_runbook.md': [
            'current_stage=external_runtime_evidence', 'current_task=BWS-600', 'BWS-599', 'BWS-600',
            'runtime_upstream_mode=api_only', 'automatic_file_fallback=prohibited',
        ],
    }
    for rel, markers in required.items():
        text = read(rel)
        for marker in markers:
            require(text, marker, rel)

    bootstrap_index = read('docs/000_documentation_index.md')
    for marker in [
        'status=SUPERSEDED_BOOTSTRAP_LEDGER',
        'legacy_stage=SURE-001',
        'legacy_stage=SURE-002A_LOCAL_INTERFACE_AND_ENGINE_BOOTSTRAP',
        'legacy_stage=SURE-002B_PRIVATE_PAPER_MODE_INTAKE',
        f'active_program={PROGRAM}',
    ]:
        require(bootstrap_index, marker, 'docs/000_documentation_index.md')

    print('validate_master_plan: ok')


if __name__ == '__main__':
    main()
