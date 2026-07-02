from __future__ import annotations
from pathlib import Path
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

def require(text: str, needle: str, rel: str) -> None:
    if needle not in text:
        fail(f'{rel} missing required marker: {needle}')

def main() -> None:
    master = read('docs/MASTER_PLAN.md')
    status = read('docs/repo_status_current.md')
    backlog = read('docs/015_local_engine_implementation_backlog.md')

    for needle in [
        'SURE-001', 'SURE-002', 'SURE-003', 'SURE-004', 'SURE-005', 'SURE-006', 'SURE-007',
        'SURE-002A_LOCAL_INTERFACE_AND_ENGINE_BOOTSTRAP',
        'docs/015_local_engine_implementation_backlog.md',
        'polymarket_standard_binary_complete_set_v0',
        'provider_connection=prohibited',
        'execution=prohibited',
        'pinned_betting_win_interface=missing',
        'local_fixture_only_allowed',
    ]:
        require(master, needle, 'docs/MASTER_PLAN.md')

    for needle in [
        'current_task=SURE-002A_LOCAL_INTERFACE_AND_ENGINE_BOOTSTRAP',
        'provider_connections=prohibited',
        'execution=prohibited',
        'docs/015_local_engine_implementation_backlog.md',
        'Real upstream evaluation remains blocked',
    ]:
        require(status, needle, 'docs/repo_status_current.md')

    for needle in [
        'SURE-002A_LOCAL_INTERFACE_AND_ENGINE_BOOTSTRAP',
        'Local implementation backlog',
        'CONTINUE_REQUIRED=yes',
        'AUTONOMOUS_GOAL_COMPLETE=yes',
        'provider SDK/client imports',
        'stake-vector math',
        'settlement replay consumption',
        'profitability claims',
    ]:
        require(backlog, needle, 'docs/015_local_engine_implementation_backlog.md')

    print('validate_master_plan: ok')

if __name__ == '__main__':
    main()
