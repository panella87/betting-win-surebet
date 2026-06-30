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

def main() -> None:
    master = read('docs/MASTER_PLAN.md')
    status = read('docs/repo_status_current.md')
    required_master = [
        'SURE-001', 'SURE-002', 'SURE-003', 'SURE-004', 'SURE-005', 'SURE-006', 'SURE-007',
        'polymarket_standard_binary_complete_set_v0',
        'provider_connection=prohibited',
        'execution=prohibited',
        'pinned_betting_win_interface=missing',
    ]
    for needle in required_master:
        if needle not in master:
            fail(f'docs/MASTER_PLAN.md missing required marker: {needle}')
    required_status = [
        'current_task=SURE-001',
        'provider_connections=prohibited',
        'execution=prohibited',
        'Wait for Federico to provide the pinned `betting-win` contract/export interface',
    ]
    for needle in required_status:
        if needle not in status:
            fail(f'docs/repo_status_current.md missing required marker: {needle}')
    print('validate_master_plan: ok')

if __name__ == '__main__':
    main()
