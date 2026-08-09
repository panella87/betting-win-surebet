from __future__ import annotations
from pathlib import Path
import hashlib
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'SOURCE_MANIFEST.json'
SCHEMA = 'betting-win-surebet-source-manifest-v1'
SKIP_DIRECTORY_NAMES = {'.git', '.hg', '.svn', '.locks', 'artifacts', 'node_modules', 'dist', 'coverage', 'tmp', '.tmp', 'graphify-out'}
SKIP_EXACT = {
    '.env',
    'SOURCE_MANIFEST.json',
    'OVERLAY_MANIFEST.json',
    'config/betting-win.upstream.lock.json',
    '.automation/locks',
    '.automation/corrupt',
    '.automation/autonomous-implementation-handover.env',
    '.automation/autonomous-implementation-handover.md',
    '.automation/bugfix-to-autonomous-implementation.env',
    '.automation/bugfix-to-autonomous-implementation.md',
    '.automation/bugfix-mode-handover.env',
    '.automation/paper-mode-handover.env',
    '.automation/paper-mode-to-autonomous-implementation.env',
}
# Runtime automation state is intentionally excluded from the source manifest.
SKIP_PREFIXES = (
    '.automation/locks/',
    '.automation/corrupt/',
    '.automation/consumed-handoffs/',
)
SKIP_SUFFIXES = ('.zip', '.log', '.tmp', '.pyc', '.tar', '.tgz', '.tar.gz')
UTC_TIMESTAMP = re.compile(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$')


def fail(message: str) -> None:
    print(f'ERROR: {message}', file=sys.stderr)
    raise SystemExit(1)


def require_manifest_file() -> None:
    if MANIFEST.is_symlink():
        fail('SOURCE_MANIFEST.json must be a non-symlink regular file')
    if not MANIFEST.is_file():
        fail('missing SOURCE_MANIFEST.json')


def should_include(path: Path) -> bool:
    rel = path.relative_to(ROOT).as_posix()
    parts = path.relative_to(ROOT).parts
    if rel in SKIP_EXACT:
        return False
    if rel.startswith(SKIP_PREFIXES):
        return False
    if parts and parts[0] == 'runtime':
        return False
    if any(part in SKIP_DIRECTORY_NAMES for part in parts[:-1]):
        return False
    if path.is_symlink():
        fail(f'source manifest input must not contain symlinks: {rel}')
    if not path.is_file():
        return False
    lowered = rel.lower()
    return not lowered.endswith(SKIP_SUFFIXES)


def require_safe_manifest_path(value: object, field: str) -> str:
    rel = require_non_empty_string(value, field).replace('\\', '/')
    if (
        rel.startswith('/')
        or rel in {'.', '..'}
        or rel.startswith('../')
        or '/../' in rel
        or rel.endswith('/..')
        or '/./' in rel
        or rel.startswith('./')
        or rel.startswith('//')
        or re.match(r'^[A-Za-z]:', rel)
        or re.search(r'[\x00-\x1f]', rel)
    ):
        fail(f'SOURCE_MANIFEST.json {field} contains an unsafe relative path')
    parts = rel.split('/')
    if any(part in {'', '.', '..', '.git', '.hg', '.svn'} for part in parts):
        fail(f'SOURCE_MANIFEST.json {field} contains an unsafe path component')
    return rel


def file_entry(path: Path) -> dict[str, object]:
    data = path.read_bytes()
    rel = require_safe_manifest_path(path.relative_to(ROOT).as_posix(), 'generated file path')
    return {
        'path': rel,
        'sha256': hashlib.sha256(data).hexdigest(),
        'size': len(data),
    }


def expected_entries() -> list[dict[str, object]]:
    return [file_entry(path) for path in sorted(ROOT.rglob('*')) if should_include(path)]


def require_non_empty_string(value: object, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        fail(f'SOURCE_MANIFEST.json {field} must be a non-empty string')
    return value


def manifest_document(*, generated: str, overlay: str) -> dict[str, object]:
    require_non_empty_string(generated, 'generated')
    require_non_empty_string(overlay, 'overlay')
    return {
        'schema': SCHEMA,
        'generated': generated,
        'overlay': overlay,
        'files': expected_entries(),
    }


def validate_runtime_upstream_lock_entries(files: object) -> None:
    if not isinstance(files, list):
        fail('SOURCE_MANIFEST.json files must be an array')
    for entry in files:
        if not isinstance(entry, dict):
            fail('SOURCE_MANIFEST.json file entries must be JSON objects')
        path = require_safe_manifest_path(entry.get('path'), 'file path')
        if path == 'config/betting-win.upstream.lock.json' and not (ROOT / 'config' / 'betting-win.upstream.lock.json').is_file():
            fail('Source manifest must not include config/betting-win.upstream.lock.json until the runtime lock file exists.')


def main() -> None:
    require_manifest_file()
    actual = json.loads(MANIFEST.read_text(encoding='utf-8'))
    if actual.get('schema') != SCHEMA:
        fail(f'SOURCE_MANIFEST.json schema must be {SCHEMA}')
    generated = require_non_empty_string(actual.get('generated'), 'generated')
    overlay = require_non_empty_string(actual.get('overlay'), 'overlay')
    if not UTC_TIMESTAMP.match(generated):
        fail('SOURCE_MANIFEST.json generated must be an ISO-8601 UTC timestamp like 2026-07-01T21:32:15Z')
    validate_runtime_upstream_lock_entries(actual.get('files'))
    if actual != manifest_document(generated=generated, overlay=overlay):
        fail('SOURCE_MANIFEST.json is stale; regenerate it from the current source tree')
    print('validate_source_manifest: ok')


if __name__ == '__main__':
    main()
