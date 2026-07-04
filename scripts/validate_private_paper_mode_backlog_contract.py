from __future__ import annotations
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
AUTOMATION_IMPLEMENTATION = ROOT / 'docs' / 'automation' / 'autonomous-implementation.md'
AUTOMATION_PAPER = ROOT / 'docs' / 'automation' / 'paper-evaluation.md'
BACKLOG = ROOT / 'docs' / '017_private_paper_mode_implementation_backlog.md'
RUNBOOK = ROOT / 'docs' / '018_private_paper_mode_runbook.md'
AGENTS = ROOT / 'AGENTS.md'
README = ROOT / 'README.md'
STATUS = ROOT / 'docs' / 'repo_status_current.md'
MASTER_PLAN = ROOT / 'docs' / 'MASTER_PLAN.md'
PACKAGE = ROOT / 'package.json'
VALIDATE_REPO = ROOT / 'scripts' / 'validate_repo.py'
COMMAND = ROOT / 'commands' / 'run-sure-paper-mode-autonomous.sh'
SMOKE_COMMAND = ROOT / 'commands' / 'run-pinned-interface-smoke.sh'
EXECUTABLES = ROOT / 'tools' / 'required_executable_paths.js'

def fail(message: str) -> None:
    print(f'ERROR: {message}', file=sys.stderr)
    raise SystemExit(1)

def read(path: Path) -> str:
    if not path.is_file():
        fail(f'missing required file: {path.relative_to(ROOT)}')
    return path.read_text(encoding='utf-8')

def require(text: str, marker: str, rel: str) -> None:
    if marker not in text:
        fail(f'{rel} missing required marker: {marker}')

def forbid(text: str, marker: str, rel: str) -> None:
    if marker in text:
        fail(f'{rel} contains forbidden marker: {marker}')

def main() -> None:
    automation_impl = read(AUTOMATION_IMPLEMENTATION)
    automation_paper = read(AUTOMATION_PAPER)
    backlog = read(BACKLOG)
    runbook = read(RUNBOOK)
    agents = read(AGENTS)
    readme = read(README)
    status = read(STATUS)
    master_plan = read(MASTER_PLAN)
    command = read(COMMAND)
    smoke_command = read(SMOKE_COMMAND)
    validate_repo = read(VALIDATE_REPO)
    executables = read(EXECUTABLES)
    package = json.loads(read(PACKAGE))

    for marker in [
        'docs/017_private_paper_mode_implementation_backlog.md',
        'repo-local backlogs are complete',
        'Federico',
    ]:
        require(automation_impl, marker, 'docs/automation/autonomous-implementation.md')

    for marker in [
        'run-paper-evaluation.sh',
        'PAPER_SUPPORTED=1',
        'repo-local private paper-mode smoke',
        'blocked_until_federico_pinned_betting_win_interface',
    ]:
        require(automation_paper, marker, 'docs/automation/paper-evaluation.md')

    for marker in [
        'SURE-002B_PRIVATE_PAPER_MODE_INTAKE',
        'provider_connection = prohibited',
        'execution = prohibited',
        'accepted = false',
        'pinned-interface smoke command',
        'paper-mode report artifact contract',
        'pinned-bundle intake validation',
        'paper-mode batch runner',
        'paper-mode runbook and freeze gate',
        'items 1 through 8 are implemented',
        'safe repo-local private paper-mode backlog is exhausted',
        'CONTINUE_REQUIRED=yes',
        'AUTONOMOUS_GOAL_COMPLETE=yes',
    ]:
        require(backlog, marker, 'docs/017_private_paper_mode_implementation_backlog.md')

    for marker in [
        'SURE-002B_PRIVATE_PAPER_MODE_INTAKE',
        'SUREBET_PINNED_BUNDLE',
        'node cli.js local-report',
        'accepted=false',
        'npm run validate',
        'Freeze gate',
        'status=blocked',
        'Stop conditions',
        'run-paper-evaluation.sh',
    ]:
        require(runbook, marker, 'docs/018_private_paper_mode_runbook.md')

    for marker in [
        'commands/run-pinned-interface-smoke.sh',
        'commands/run-sure-paper-mode-autonomous.sh',
        'SURE-002B private paper-mode intake backlog',
        'private paper-mode backlog is complete',
    ]:
        require(agents, marker, 'AGENTS.md')
        require(readme, marker, 'README.md')

    for marker in [
        'current_task=SURE-002B_PRIVATE_PAPER_MODE_INTAKE',
        'current_task_status=complete_repo_local_private_paper_mode_backlog_blocked_on_pinned_interface',
        'docs/017_private_paper_mode_implementation_backlog.md',
        'docs/018_private_paper_mode_runbook.md',
        'No unchecked repo-local item remains in `docs/017_private_paper_mode_implementation_backlog.md`.',
        'run_paper_evaluation=canonical_repo_local_private_fixture_only',
    ]:
        require(status, marker, 'docs/repo_status_current.md')

    require(master_plan, 'docs/017_private_paper_mode_implementation_backlog.md', 'docs/MASTER_PLAN.md')
    require(master_plan, 'SURE-002B_PRIVATE_PAPER_MODE_INTAKE', 'docs/MASTER_PLAN.md')
    require(master_plan, 'private_paper_mode=repo_local_complete', 'docs/MASTER_PLAN.md')

    for marker in ['run-autonomous-implementation.sh --duration 72h', 'npm run validate']:
        require(command, marker, 'commands/run-sure-paper-mode-autonomous.sh')

    for marker in ['SUREBET_PINNED_BUNDLE', 'remote URLs are prohibited', 'artifacts/private-paper-mode', 'node cli.js local-report']:
        require(smoke_command, marker, 'commands/run-pinned-interface-smoke.sh')
    for forbidden in ['curl ', 'wget ', 'psql ', 'DATABASE_URL', 'DB_URL']:
        forbid(smoke_command, forbidden, 'commands/run-pinned-interface-smoke.sh')

    validate_ops = package.get('scripts', {}).get('validate:ops', '')
    if 'scripts/validate_private_paper_mode_backlog_contract.py' not in validate_ops:
        fail('package.json validate:ops must include validate_private_paper_mode_backlog_contract.py')
    for required in [
        'scripts/validate_private_paper_mode_backlog_contract.py',
        'tests/private-paper-mode-backlog-contract.test.ts',
        'commands/run-sure-paper-mode-autonomous.sh',
        'commands/run-pinned-interface-smoke.sh',
    ]:
        require(validate_repo, required, 'scripts/validate_repo.py')
        require(executables, required if required.startswith('commands/') else required, 'tools/required_executable_paths.js') if required.startswith('commands/') else None

    print('validate_private_paper_mode_backlog_contract: ok')

if __name__ == '__main__':
    main()
