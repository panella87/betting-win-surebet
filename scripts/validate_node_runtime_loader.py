from __future__ import annotations
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
LOADER = ROOT / 'scripts' / 'load-node-runtime.sh'
COMMAND = ROOT / 'commands' / 'run-sure-001-autonomous.sh'
RUNNER = ROOT / 'run-autonomous-implementation.sh'


def fail(message: str) -> None:
    print(f'ERROR: {message}', file=sys.stderr)
    raise SystemExit(1)


def read(path: Path) -> str:
    if not path.is_file():
        fail(f'missing required file: {path.relative_to(ROOT)}')
    return path.read_text(encoding='utf-8')


def main() -> None:
    loader = read(LOADER)
    executable_lines = []
    for raw_line in loader.splitlines():
        stripped = raw_line.strip()
        if stripped and not stripped.startswith('#'):
            executable_lines.append(stripped)
    executable_loader = '\n'.join(executable_lines)
    forbidden = [
        '. "$HOME/.nvm/nvm.sh"',
        ". '$HOME/.nvm/nvm.sh'",
        '. "$NVM_DIR/nvm.sh"',
        "nvm use",
    ]
    for marker in forbidden:
        if marker in executable_loader:
            fail(f'load-node-runtime.sh must not source nvm.sh or call nvm directly: {marker}')
    required_loader_markers = [
        'node_runtime_target=',
        'node_runtime_source=path',
        'node_runtime_source=direct_nvm_binary',
        'expected_direct_node=',
        'NODE_OK=v',
        'NPM_OK=',
    ]
    for marker in required_loader_markers:
        if marker not in loader:
            fail(f'load-node-runtime.sh missing required marker: {marker}')
    command = read(COMMAND)
    if '. scripts/load-node-runtime.sh "$repo_root"' not in command:
        fail('commands/run-sure-001-autonomous.sh must source scripts/load-node-runtime.sh')
    runner = read(RUNNER)
    if '. scripts/load-node-runtime.sh "$REPO_DIR"' not in runner:
        fail('run-autonomous-implementation.sh must source scripts/load-node-runtime.sh')
    print('validate_node_runtime_loader: ok')


if __name__ == '__main__':
    main()
