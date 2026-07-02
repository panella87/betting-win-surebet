from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import argparse
import json

from validate_source_manifest import MANIFEST, fail, manifest_document, require_non_empty_string


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description='Regenerate SOURCE_MANIFEST.json using the repository validator inclusion rules.',
    )
    parser.add_argument(
        '--overlay',
        help='Non-empty overlay string to store in SOURCE_MANIFEST.json. Defaults to the current manifest overlay.',
    )
    return parser.parse_args()


def resolve_overlay(override: str | None) -> str:
    if override is not None:
        return require_non_empty_string(override, 'overlay')
    if not MANIFEST.is_file():
        fail('SOURCE_MANIFEST.json does not exist; pass --overlay to set a non-empty overlay')
    current = json.loads(MANIFEST.read_text(encoding='utf-8'))
    return require_non_empty_string(current.get('overlay'), 'overlay')


def write_manifest(path: Path, *, overlay: str) -> None:
    generated = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    document = manifest_document(generated=generated, overlay=overlay)
    path.write_text(json.dumps(document, indent=2) + '\n', encoding='utf-8')


def main() -> None:
    args = parse_args()
    overlay = resolve_overlay(args.overlay)
    write_manifest(MANIFEST, overlay=overlay)
    print(f'regenerate_source_manifest: wrote {MANIFEST.name}')


if __name__ == '__main__':
    main()
