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
            'current_task=BWS-580', 'safe_local_terminal_gate=BWS-580',
            'continuous_runtime_gate=BWS-600', 'execution_gate=BWS-900',
            'BWS-520', 'BWS-580', 'backlog/bws_full_implementation.csv',
            'run-autonomous-implementation.sh', 'run-bugfix-autopilot.sh', 'run-paper-autopilot.sh',
        ],
        'docs/repo_status_current.md': [
            PROGRAM, 'status=IMPLEMENTATION_READY', 'current_task=BWS-580',
            'safe_local_terminal_gate=BWS-580',
            'selected_controller=run-autonomous-implementation.sh',
        ],
        'docs/028_full_implementation_program.md': [
            PROGRAM, 'BWS-100', 'BWS-510', 'BWS-520', 'BWS-580', 'BWS-600', 'BWS-900',
        ],
        'docs/029_full_implementation_task_ledger.md': [
            PROGRAM, 'backlog/bws_full_implementation.csv',
            'current_task=BWS-580', 'current_task_status=VALIDATED',
        ],
        'docs/030_upstream_compatibility_and_pin_contract.md': [
            'BETTING_WIN_REPO_PATH', 'config/betting-win.upstream.lock.json',
            'workspace', 'export', 'api', 'No fallback',
        ],
        'docs/033_continuous_private_paper_runtime_program.md': [
            'current_task=BWS-580', 'safe_local_terminal_gate=BWS-580',
            'BWS-520', 'BWS-580', 'BWS-600',
        ],
        'docs/012_runbook.md': [
            'run-autonomous-implementation.sh', 'BWS-520', 'BWS-580', 'run-paper-autopilot.sh',
        ],
        'docs/018_private_paper_mode_runbook.md': [
            'current_stage=continuous_runtime_implementation', 'BWS-520', 'BWS-580', 'BWS-600',
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
