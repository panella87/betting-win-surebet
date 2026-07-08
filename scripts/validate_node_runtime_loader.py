from __future__ import annotations
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
LOADER = ROOT / 'scripts' / 'load-node-runtime.sh'
COMPATIBILITY_COMMANDS = [
    ROOT / 'commands' / 'run-sure-001-autonomous.sh',
    ROOT / 'commands' / 'run-sure-local-engine-autonomous.sh',
    ROOT / 'commands' / 'run-sure-paper-mode-autonomous.sh',
    ROOT / 'commands' / 'run-pinned-interface-smoke.sh',
]
ROOT_CONTROLLERS = [
    ROOT / 'run-autonomous-implementation.sh',
    ROOT / 'run-autonomous-bugfix.sh',
    ROOT / 'run-paper-evaluation.sh',
    ROOT / 'run-paper-autopilot.sh',
]

def fail(message: str) -> None:
    print(f'ERROR: {message}', file=sys.stderr)
    raise SystemExit(1)

def read(path: Path) -> str:
    if not path.is_file():
        fail(f'missing required file: {path.relative_to(ROOT)}')
    return path.read_text(encoding='utf-8')

def executable_text(text: str) -> str:
    lines = []
    for raw_line in text.splitlines():
        stripped = raw_line.strip()
        if stripped and not stripped.startswith('#'):
            lines.append(stripped)
    return '\n'.join(lines)

def reject_nvm_source(path: Path, text: str) -> None:
    executable = executable_text(text)
    for forbidden in ['scripts/load-node-runtime.sh', 'source "$HOME/.nvm/nvm.sh"', 'source "$NVM_DIR/nvm.sh"', 'nvm use --silent']:
        if forbidden in executable:
            fail(f'{path.relative_to(ROOT)} must inherit the active Node runtime and must not contain: {forbidden}')

def main() -> None:
    loader = read(LOADER)
    executable_loader = executable_text(loader)
    for marker in ['. "$HOME/.nvm/nvm.sh"', ". '$HOME/.nvm/nvm.sh'", '. "$NVM_DIR/nvm.sh"', 'nvm use']:
        if marker in executable_loader:
            fail(f'load-node-runtime.sh must not source nvm.sh or call nvm directly: {marker}')
    for marker in ['node_runtime_target=', 'node_runtime_source=path', 'node_runtime_source=direct_nvm_binary', 'expected_direct_node=', 'NODE_OK=v', 'NPM_OK=']:
        if marker not in loader:
            fail(f'load-node-runtime.sh missing required marker: {marker}')
    for command_path in COMPATIBILITY_COMMANDS:
        command = read(command_path)
        reject_nvm_source(command_path, command)
        if command_path.name == 'run-sure-paper-mode-autonomous.sh':
            for marker in ['run-paper-autopilot.sh', '--paper-duration 72h', '--max-same-handoff', '--model cli-default', '--fallback-model none']:
                if marker not in command:
                    fail(f'{command_path.relative_to(ROOT)} missing paper compatibility marker: {marker}')
        if command_path.name == 'run-pinned-interface-smoke.sh':
            for marker in ['Activate the repo runtime first', 'NODE_OK=v', 'NPM_OK=', 'node cli.js local-report']:
                if marker not in command:
                    fail(f'{command_path.relative_to(ROOT)} missing active-runtime smoke marker: {marker}')
    for controller_path in ROOT_CONTROLLERS:
        controller = read(controller_path)
        reject_nvm_source(controller_path, controller)
        for marker in ['Activate the repo runtime in the parent shell first', 'NODE_OK=', 'NPM_OK=']:
            if marker not in controller:
                fail(f'{controller_path.relative_to(ROOT)} missing runtime assertion marker: {marker}')
    print('validate_node_runtime_loader: ok')

if __name__ == '__main__':
    main()
