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
    handoff = read('docs/016_pinned_betting_win_interface_readiness.md')
    paper_backlog = read('docs/017_private_paper_mode_implementation_backlog.md')
    paper_runbook = read('docs/018_private_paper_mode_runbook.md')

    for needle in [
        'SURE-001', 'SURE-002', 'SURE-003', 'SURE-004', 'SURE-005', 'SURE-006', 'SURE-007',
        'retained SURE-002A local implementation ledger',
        'docs/015_local_engine_implementation_backlog.md',
        'polymarket_standard_binary_complete_set_v0',
        'provider_connection=prohibited',
        'execution=prohibited',
        'pinned_betting_win_interface=missing',
        'local_fixture_only_complete',
        'SURE-002B_PRIVATE_PAPER_MODE_INTAKE',
        'docs/017_private_paper_mode_implementation_backlog.md',
        'private_paper_mode=repo_local_complete',
        'docs/018_private_paper_mode_runbook.md',
    ]:
        require(master, needle, 'docs/MASTER_PLAN.md')

    for needle in [
        'current_task=SURE-002B_PRIVATE_PAPER_MODE_INTAKE',
        'current_task_status=complete_repo_local_private_paper_mode_backlog_blocked_on_pinned_interface',
        'provider_connections=prohibited',
        'execution=prohibited',
        'docs/015_local_engine_implementation_backlog.md',
        'docs/016_pinned_betting_win_interface_readiness.md',
        'Real upstream evaluation remains blocked',
        'SURE-002B_PRIVATE_PAPER_MODE_INTAKE',
        'docs/017_private_paper_mode_implementation_backlog.md',
        'docs/018_private_paper_mode_runbook.md',
        'No unchecked repo-local item remains in `docs/017_private_paper_mode_implementation_backlog.md`.',
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

    for needle in [
        'Required pinned interface from betting-win',
        'provider connections = prohibited',
        'node cli.js local-report',
    ]:
        require(handoff, needle, 'docs/016_pinned_betting_win_interface_readiness.md')

    for needle in [
        'SURE-002B_PRIVATE_PAPER_MODE_INTAKE',
        'pinned-interface smoke command',
        'paper-mode batch runner',
        'accepted = false',
    ]:
        require(paper_backlog, needle, 'docs/017_private_paper_mode_implementation_backlog.md')

    for needle in [
        'SURE-002B_PRIVATE_PAPER_MODE_INTAKE',
        'SUREBET_PINNED_BUNDLE',
        'artifacts/private-paper-mode',
        'Freeze gate',
        'npm run validate',
    ]:
        require(paper_runbook, needle, 'docs/018_private_paper_mode_runbook.md')

    print('validate_master_plan: ok')

if __name__ == '__main__':
    main()
