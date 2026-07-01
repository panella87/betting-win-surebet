from __future__ import annotations

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SHELL_GLOBS = ['*.sh', 'scripts/*.sh', 'commands/*.sh']
LOCAL_ASSIGNMENT = re.compile(r'(?<![A-Za-z0-9_])([A-Za-z_][A-Za-z0-9_]*)=')


def fail(message: str) -> None:
    print(f'ERROR: {message}', file=sys.stderr)
    raise SystemExit(1)


def iter_shell_files() -> list[Path]:
    files: list[Path] = []
    for pattern in SHELL_GLOBS:
        files.extend(ROOT.glob(pattern))
    return sorted({path for path in files if path.is_file()})


def display_path(path: Path) -> str:
    try:
        return path.relative_to(ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def parse_args(argv: list[str]) -> list[Path]:
    if not argv:
        return iter_shell_files()
    if len(argv) % 2 != 0:
        fail('usage: validate_shell_local_assignments.py [--path file]...')
    paths: list[Path] = []
    for index in range(0, len(argv), 2):
        flag = argv[index]
        raw_path = argv[index + 1]
        if flag != '--path':
            fail('usage: validate_shell_local_assignments.py [--path file]...')
        path = Path(raw_path).resolve()
        if not path.is_file():
            fail(f'path is not a file: {raw_path}')
        paths.append(path)
    return paths


def first_assignment_end(line: str, name: str) -> int | None:
    marker = f'{name}='
    idx = line.find(marker)
    if idx < 0:
        return None
    return idx + len(marker)


def check_line(path: Path, line_number: int, line: str) -> None:
    stripped = line.strip()
    if not stripped.startswith('local '):
        return
    assignments = [match.group(1) for match in LOCAL_ASSIGNMENT.finditer(stripped)]
    if len(assignments) < 2:
        return
    for name in assignments:
        end = first_assignment_end(stripped, name)
        if end is None:
            continue
        tail = stripped[end:]
        if f'${name}' in tail or f'${{{name}' in tail:
            fail(
                f'{display_path(path)}:{line_number} declares local {name}= and references it on the same local line; '
                'split dependent local assignments so set -u cannot expand an unbound variable'
            )


def main() -> None:
    for path in parse_args(sys.argv[1:]):
        for line_number, line in enumerate(path.read_text(encoding='utf-8').splitlines(), start=1):
            check_line(path, line_number, line)
    print('validate_shell_local_assignments: ok')


if __name__ == '__main__':
    main()
