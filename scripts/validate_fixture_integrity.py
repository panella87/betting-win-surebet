from __future__ import annotations
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {'.git', 'node_modules', 'dist', 'coverage', 'artifacts'}

def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)

def read(path: Path) -> str:
    return path.read_text(encoding='utf-8')

def iter_files(*names: str):
    for name in names:
        base = ROOT / name
        if not base.exists():
            continue
        if base.is_file():
            yield base
            continue
        for path in base.rglob('*'):
            if any(part in SKIP_DIRS for part in path.parts):
                continue
            if path.is_file():
                yield path

DIRS = ['tests/fixtures/betting-win-exports','tests/fixtures/complete-set','tests/fixtures/settlement']

def main() -> None:
    for name in DIRS:
        directory = ROOT / name
        if not directory.is_dir():
            fail(f'missing fixture directory: {name}')
        keep = directory / '.gitkeep'
        if not keep.is_file():
            fail(f'missing .gitkeep in fixture directory: {name}')
        extra = [p for p in directory.iterdir() if p.name != '.gitkeep']
        if extra:
            fail('SURE-001 fixtures must remain empty until pinned upstream exports are provided: ' + ', '.join(str(p.relative_to(ROOT)) for p in extra))
    print('validate_fixture_integrity: ok')

if __name__ == '__main__':
    main()
