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

PATTERNS = [
    (re.compile(r'postgres(?:ql)?://', re.I), 'direct PostgreSQL URL'),
    (re.compile(r'\bPGHOST\b|\bPGUSER\b|\bPGPASSWORD\b|\bDATABASE_URL\b'), 'direct database environment'),
    (re.compile(r'CREATE\s+TABLE\s+core\.', re.I), 'core table migration'),
    (re.compile(r'ALTER\s+TABLE\s+core\.', re.I), 'core table migration'),
]

def main() -> None:
    for path in iter_files('src','tests','package.json','tsconfig.json'):
        text = read(path)
        for pattern, label in PATTERNS:
            if pattern.search(text):
                fail(f'{label} found in {path.relative_to(ROOT)}')
    print('validate_contract_boundary: ok')

if __name__ == '__main__':
    main()
