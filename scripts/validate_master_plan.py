from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
PROGRAM = 'BWS_FULL_PLATFORM_IMPLEMENTATION_V1'


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
            PROGRAM, 'repo_role=surebet_strategy_application', 'upstream_platform=betting-win',
            'current_task=BWS-600', 'safe_local_terminal_gate=BWS-599',
            'continuous_runtime_gate=BWS-600', 'execution_gate=BWS-900',
            'BWS-581', 'BWS-599', 'backlog/bws_full_implementation.csv',
            'run-autonomous-implementation.sh', 'run-bugfix-autopilot.sh', 'run-paper-autopilot.sh',
        ],
        'docs/repo_status_current.md': [
            PROGRAM, 'status=RUNTIME_EVIDENCE_READY', 'current_task=BWS-600',
            'safe_local_terminal_gate=BWS-599',
            'selected_controller=run-paper-autopilot.sh',
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
            'current_task=BWS-600', 'BWS-599', 'run-paper-autopilot.sh',
            'invokes implementation only for a validated source-fix handoff',
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

    for rel in [
        'docs/014_sure_001_remaining_hardening_backlog.md',
        'docs/015_local_engine_implementation_backlog.md',
        'docs/017_private_paper_mode_implementation_backlog.md',
    ]:
        text = read(rel)
        require(text, 'status=SUPERSEDED_BOOTSTRAP_LEDGER', rel)
        require(text, f'active_program={PROGRAM}', rel)

    print('validate_master_plan: ok')


if __name__ == '__main__':
    main()
