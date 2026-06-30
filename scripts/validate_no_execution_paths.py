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
    (re.compile(r'\bwallet\b', re.I), 'wallet path'),
    (re.compile(r'\bsigner\b', re.I), 'signer path'),
    (re.compile(r'\border(s|ing)?\b', re.I), 'order path'),
    (re.compile(r'\btransaction(s)?\b', re.I), 'transaction path'),
    (re.compile(r'\bcashout(s)?\b', re.I), 'cashout path'),
    (re.compile(r'\bredemption(s)?\b', re.I), 'redemption path'),
    (re.compile(r'(?<!\.)\bsplit\b|(?<!\.)\bmerge\b', re.I), 'split/merge path'),
    (re.compile(r'\breal-money\b', re.I), 'real-money path'),
]

def main() -> None:
    for path in iter_files('src'):
        text = read(path)
        for pattern, label in PATTERNS:
            if pattern.search(text):
                fail(f'{label} found in executable source {path.relative_to(ROOT)}')
    print('validate_no_execution_paths: ok')

if __name__ == '__main__':
    main()
