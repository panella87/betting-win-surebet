from __future__ import annotations
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
EMPTY_DIRS = ['tests/fixtures/betting-win-exports', 'tests/fixtures/complete-set', 'tests/fixtures/settlement']
PLACEHOLDER_DIR = ROOT / 'tests/fixtures/pinned-interface-placeholder'
PLACEHOLDER_FILE = PLACEHOLDER_DIR / 'local-placeholder.json'
PLACEHOLDER_ALLOWED_NAMES = {'.gitkeep', 'local-placeholder.json'}
PLACEHOLDER_NOTES = (
    'Local fake fixture for validator smoke tests only. '
    'Not a betting-win export bundle and not SURE-002 readiness evidence.'
)

def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)

def read(path: Path) -> str:
    return path.read_text(encoding='utf-8')

def read_json(path: Path) -> object:
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as exc:
        fail(f'invalid JSON in {path.relative_to(ROOT)}: {exc}')

def require_exact_string(data: dict[str, object], key: str, expected: str) -> None:
    value = data.get(key)
    if value != expected:
        fail(
            f'{PLACEHOLDER_FILE.relative_to(ROOT)} {key} must be '
            f'{expected!r}, found {value!r}'
        )

def validate_empty_fixture_dirs() -> None:
    for name in EMPTY_DIRS:
        directory = ROOT / name
        if not directory.is_dir():
            fail(f'missing fixture directory: {name}')
        keep = directory / '.gitkeep'
        if not keep.is_file():
            fail(f'missing .gitkeep in fixture directory: {name}')
        extra = [p for p in directory.iterdir() if p.name != '.gitkeep']
        if extra:
            fail('SURE-001 fixtures must remain empty until pinned upstream exports are provided: ' + ', '.join(str(p.relative_to(ROOT)) for p in extra))

def validate_placeholder_fixture() -> None:
    if not PLACEHOLDER_DIR.is_dir():
        fail(f'missing fixture directory: {PLACEHOLDER_DIR.relative_to(ROOT)}')
    names = {path.name for path in PLACEHOLDER_DIR.iterdir()}
    if names != PLACEHOLDER_ALLOWED_NAMES:
        fail(
            f'{PLACEHOLDER_DIR.relative_to(ROOT)} must contain exactly '
            f'{sorted(PLACEHOLDER_ALLOWED_NAMES)!r}, found {sorted(names)!r}'
        )
    data = read_json(PLACEHOLDER_FILE)
    if not isinstance(data, dict):
        fail(f'{PLACEHOLDER_FILE.relative_to(ROOT)} must contain a JSON object')
    require_exact_string(data, 'schema', 'betting-win-surebet-pinned-interface-placeholder-v1')
    require_exact_string(data, 'generatedBy', 'betting-win-surebet')
    require_exact_string(data, 'fixtureKind', 'pinned_interface_placeholder')
    require_exact_string(data, 'mode', 'paper_only')
    require_exact_string(data, 'providerConnection', 'prohibited')
    require_exact_string(data, 'status', 'blocked_until_federico_provides_pinned_betting_win_interface')
    require_exact_string(data, 'notes', PLACEHOLDER_NOTES)
    if data.get('records') != []:
        fail(f'{PLACEHOLDER_FILE.relative_to(ROOT)} records must remain an empty array')
    for key in ['reference', 'exportedAt', 'contractVersion', 'manifestHash', 'source']:
        if key in data:
            fail(f'{PLACEHOLDER_FILE.relative_to(ROOT)} must not contain export-shaped key: {key}')

def main() -> None:
    validate_empty_fixture_dirs()
    validate_placeholder_fixture()
    print('validate_fixture_integrity: ok')

if __name__ == '__main__':
    main()
