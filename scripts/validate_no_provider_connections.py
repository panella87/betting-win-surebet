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

FORBIDDEN_DEPS = ['polymarket','clob','gamma','azuro','sx.bet','sxbet','limitless','ethers','viem','web3','wagmi','walletconnect','thirdweb','solana']
PATTERNS = [
    (re.compile(r'from\s+[\'\"]([^\'\"]*(polymarket|azuro|sx|limitless|clob|gamma)[^\'\"]*)[\'\"]', re.I), 'provider import'),
    (re.compile(r'import\s*\([^)]*[\'\"]([^\'\"]*(polymarket|azuro|sx|limitless|clob|gamma)[^\'\"]*)[\'\"]', re.I), 'provider dynamic import'),
    (re.compile(r'require\s*\([^)]*[\'\"]([^\'\"]*(polymarket|azuro|sx|limitless|clob|gamma)[^\'\"]*)[\'\"]', re.I), 'provider require'),
    (re.compile(r'https?://[^\s\'\"]*(polymarket|azuro|sx\.bet|limitless|gamma|clob)[^\s\'\"]*', re.I), 'provider URL'),
]

def main() -> None:
    package = json.loads(read(ROOT / 'package.json'))
    for section in ['dependencies','devDependencies','optionalDependencies']:
        deps = package.get(section, {})
        if not isinstance(deps, dict):
            fail(f'package.json {section} must be an object')
        for dep in deps:
            lowered = dep.lower()
            if any(part in lowered for part in FORBIDDEN_DEPS):
                fail(f'forbidden dependency in package.json: {dep}')
    for path in iter_files('src','tests'):
        text = read(path)
        for pattern, label in PATTERNS:
            if pattern.search(text):
                fail(f'{label} found in {path.relative_to(ROOT)}')
    print('validate_no_provider_connections: ok')

if __name__ == '__main__':
    main()
