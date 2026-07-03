from __future__ import annotations
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
RUNNER = ROOT / 'run-autonomous-implementation.sh'
BACKLOG = ROOT / 'docs' / '015_local_engine_implementation_backlog.md'
AGENTS = ROOT / 'AGENTS.md'
STATUS = ROOT / 'docs' / 'repo_status_current.md'
README = ROOT / 'README.md'
SCOPE = ROOT / 'docs' / '001_scope_and_boundaries.md'
RUNBOOK = ROOT / 'docs' / '012_runbook.md'
INTERFACE_HANDOFF = ROOT / 'docs' / '016_pinned_betting_win_interface_readiness.md'
PACKAGE = ROOT / 'package.json'
VALIDATE_REPO = ROOT / 'scripts' / 'validate_repo.py'
COMMAND = ROOT / 'commands' / 'run-sure-local-engine-autonomous.sh'

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

def main() -> None:
    runner = read(RUNNER)
    backlog = read(BACKLOG)
    agents = read(AGENTS)
    status = read(STATUS)
    readme = read(README)
    scope = read(SCOPE)
    runbook = read(RUNBOOK)
    interface_handoff = read(INTERFACE_HANDOFF)
    command = read(COMMAND)
    package = json.loads(read(PACKAGE))
    validate_repo = read(VALIDATE_REPO)

    for marker in [
        'docs/015_local_engine_implementation_backlog.md',
        'Implement exactly one bounded safe private paper-mode slice per cycle',
        'first safe unchecked local implementation item',
        'Use CONTINUE_REQUIRED=yes when docs/015_local_engine_implementation_backlog.md still has a safe unchecked local implementation item',
        'the only remaining work requires Federico',
    ]:
        require(runner, marker, 'run-autonomous-implementation.sh')

    for marker in [
        'SURE-002A_LOCAL_INTERFACE_AND_ENGINE_BOOTSTRAP',
        'local export-bundle schema and parser',
        'SURE-004 stake-vector solver',
        'SURE-005 residual exposure analyzer',
        'SURE-006 settlement replay consumer',
        'SURE-007 private paper report assembler',
        'provider SDK/client imports',
        'profitability claims',
    ]:
        require(backlog, marker, 'docs/015_local_engine_implementation_backlog.md')

    for marker in [
        'maximum safe local SURE-002A implementation backlog is complete',
        'Do not invent more local engine work',
        'docs/016_pinned_betting_win_interface_readiness.md',
    ]:
        require(agents, marker, 'AGENTS.md')

    for marker in [
        'safe SURE-002A local implementation backlog',
        'docs/016_pinned_betting_win_interface_readiness.md',
    ]:
        require(status, marker, 'docs/repo_status_current.md')

    for marker in [
        'SURE-002A local interface and engine bootstrap = complete for local fixtures',
        'Do not invent more local engine work',
        'AUTONOMOUS_GOAL_COMPLETE=yes',
    ]:
        require(readme, marker, 'README.md')

    for marker in [
        'SURE-002A local fixture engine = complete',
        'real upstream evaluation = blocked pending Federico',
    ]:
        require(scope, marker, 'docs/001_scope_and_boundaries.md')

    for marker in [
        'Expected state after SURE-002A local bootstrap',
        'offline local-report CLI = implemented',
        'docs/016_pinned_betting_win_interface_readiness.md',
    ]:
        require(runbook, marker, 'docs/012_runbook.md')

    for marker in [
        'Required pinned interface from betting-win',
        'reference.source=betting-win',
        'provider connections = prohibited',
        'node cli.js local-report',
    ]:
        require(interface_handoff, marker, 'docs/016_pinned_betting_win_interface_readiness.md')

    require(command, 'run-autonomous-implementation.sh --duration 72h', 'commands/run-sure-local-engine-autonomous.sh')

    validate_ops = package.get('scripts', {}).get('validate:ops', '')
    if 'scripts/validate_local_engine_backlog_contract.py' not in validate_ops:
        fail('package.json validate:ops must include validate_local_engine_backlog_contract.py')
    if 'scripts/validate_local_engine_backlog_contract.py' not in validate_repo:
        fail('scripts/validate_repo.py must require validate_local_engine_backlog_contract.py')
    if 'tests/local-engine-backlog-contract.test.ts' not in validate_repo:
        fail('scripts/validate_repo.py must require tests/local-engine-backlog-contract.test.ts')

    print('validate_local_engine_backlog_contract: ok')

if __name__ == '__main__':
    main()
