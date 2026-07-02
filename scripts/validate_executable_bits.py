from __future__ import annotations
from pathlib import Path
import stat
import sys

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    'cli.js',
    'start.sh',
    'stop.sh',
    'check_progress.sh',
    'watch_progress.sh',
    'open_log.sh',
    'update_git.sh',
    'pull_artifacts_and_zip_codebase.sh',
    'zip_codebase.sh',
    'run-autonomous-implementation.sh',
    'scripts/create-source-handoff-archive.sh',
    'scripts/load-node-runtime.sh',
    'commands/run-sure-001-autonomous.sh',
    'commands/run-sure-local-engine-autonomous.sh',
]

def fail(message: str) -> None:
    print(f'ERROR: {message}', file=sys.stderr)
    raise SystemExit(1)

def main() -> None:
    for rel in REQUIRED:
        path = ROOT / rel
        if not path.is_file():
            fail(f'missing required executable file: {rel}')
        if path.stat().st_mode & stat.S_IXUSR == 0:
            fail(f'missing executable bit: {rel}')
    print('validate_executable_bits: ok')

if __name__ == '__main__':
    main()
