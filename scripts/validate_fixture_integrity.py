from __future__ import annotations

from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
EMPTY_DIRS = ['tests/fixtures/betting-win-exports', 'tests/fixtures/complete-set', 'tests/fixtures/settlement']
PLACEHOLDER_DIR = ROOT / 'tests' / 'fixtures' / 'pinned-interface-placeholder'
PLACEHOLDER_FILE = PLACEHOLDER_DIR / 'local-placeholder.json'
PLACEHOLDER_ALLOWED_NAMES = {'.gitkeep', 'local-placeholder.json'}
PLACEHOLDER_NOTES = (
    'Historical local fake fixture for validator regression only. '
    'Not a betting-win export, upstream lock, BWS-100 proof, or BWS-130 intake evidence.'
)


def fail(message: str) -> None:
    print(f'ERROR: {message}', file=sys.stderr)
    raise SystemExit(1)


def read_json(path: Path) -> object:
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except json.JSONDecodeError as exc:
        fail(f'invalid JSON in {path.relative_to(ROOT)}: {exc}')


def require_exact_string(data: dict[str, object], key: str, expected: str) -> None:
    value = data.get(key)
    if value != expected:
        fail(f'{PLACEHOLDER_FILE.relative_to(ROOT)} {key} must be {expected!r}, found {value!r}')


def validate_empty_fixture_dirs() -> None:
    for name in EMPTY_DIRS:
        directory = ROOT / name
        if not directory.is_dir():
            fail(f'missing fixture directory: {name}')
        if not (directory / '.gitkeep').is_file():
            fail(f'missing .gitkeep in fixture directory: {name}')
        extra = [path for path in directory.iterdir() if path.name != '.gitkeep']
        if extra:
            fail('reserved upstream fixture directories must remain empty until immutable inputs are explicitly added: ' + ', '.join(str(path.relative_to(ROOT)) for path in extra))


def validate_placeholder_fixture() -> None:
    if not PLACEHOLDER_DIR.is_dir():
        fail(f'missing fixture directory: {PLACEHOLDER_DIR.relative_to(ROOT)}')
    names = {path.name for path in PLACEHOLDER_DIR.iterdir()}
    if names != PLACEHOLDER_ALLOWED_NAMES:
        fail(f'{PLACEHOLDER_DIR.relative_to(ROOT)} must contain exactly {sorted(PLACEHOLDER_ALLOWED_NAMES)!r}, found {sorted(names)!r}')
    data = read_json(PLACEHOLDER_FILE)
    if not isinstance(data, dict):
        fail(f'{PLACEHOLDER_FILE.relative_to(ROOT)} must contain a JSON object')
    expected = {
        'schema': 'betting-win-surebet-bootstrap-placeholder-v1',
        'generatedBy': 'betting-win-surebet',
        'fixtureKind': 'historical_bootstrap_placeholder',
        'mode': 'local_fixture_regression_only',
        'providerConnection': 'prohibited',
        'status': 'superseded_by_bws_full_platform_program',
        'notes': PLACEHOLDER_NOTES,
    }
    for key, value in expected.items():
        require_exact_string(data, key, value)
    if data.get('records') != []:
        fail(f'{PLACEHOLDER_FILE.relative_to(ROOT)} records must remain an empty array')
    for key in ['reference', 'exportedAt', 'contractVersion', 'manifestHash', 'source', 'commitSha', 'sourceManifestSha256']:
        if key in data:
            fail(f'{PLACEHOLDER_FILE.relative_to(ROOT)} must not contain upstream-evidence-shaped key: {key}')


def main() -> None:
    validate_empty_fixture_dirs()
    validate_placeholder_fixture()
    print('validate_fixture_integrity: ok')


if __name__ == '__main__':
    main()
