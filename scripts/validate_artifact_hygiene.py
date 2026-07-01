from __future__ import annotations
from pathlib import Path
import os
import shutil
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
FORBIDDEN_ROOTS = {'.git', '.github', '.locks', 'artifacts', 'node_modules', 'dist', 'coverage', 'output', 'tmp', '.tmp'}
FORBIDDEN_EXACT = {
    'true',
    '.env.local',
    'artifacts.zip',
    'autonomous-codebase.zip',
    'autonomous-handoff.manifest.json',
    'credentials.json',
    'id_ed25519',
    'id_rsa',
    'secrets.json',
}
LOCAL_IGNORED_EXACT = {'.env'}
ARCHIVE_SUFFIXES = ('.tar.gz', '.zip', '.tar', '.tgz')
LOG_SUFFIXES = (
    '.log',
    '.stdout',
    '.stderr',
    '.stdout.txt',
    '.stderr.txt',
    '.stdout.log',
    '.stderr.log',
    '.tap',
    '.tap.log',
)
FORBIDDEN_SUFFIXES = LOG_SUFFIXES + ('.tmp', '.pyc') + ARCHIVE_SUFFIXES


def fail(message: str) -> None:
    print(f'ERROR: {message}', file=sys.stderr)
    raise SystemExit(1)


def cleanup_python_cache() -> None:
    for dirpath, dirnames, filenames in os.walk(ROOT, topdown=True):
        rel_parts = Path(dirpath).relative_to(ROOT).parts if Path(dirpath) != ROOT else ()
        if any(part in FORBIDDEN_ROOTS for part in rel_parts):
            dirnames[:] = []
            continue
        for dirname in list(dirnames):
            if dirname == '__pycache__':
                shutil.rmtree(Path(dirpath) / dirname)
                dirnames.remove(dirname)
            elif dirname in FORBIDDEN_ROOTS:
                dirnames.remove(dirname)
        for filename in filenames:
            if filename.endswith('.pyc'):
                (Path(dirpath) / filename).unlink()


def iter_source_files():
    for dirpath, dirnames, filenames in os.walk(ROOT, topdown=True):
        current = Path(dirpath)
        rel_parts = current.relative_to(ROOT).parts if current != ROOT else ()
        if any(part in FORBIDDEN_ROOTS for part in rel_parts):
            dirnames[:] = []
            continue
        dirnames[:] = [d for d in dirnames if d not in FORBIDDEN_ROOTS and d != '__pycache__']
        for filename in filenames:
            yield current / filename


def gitignore_lines() -> list[str]:
    gitignore = ROOT / '.gitignore'
    if not gitignore.is_file():
        return []
    return [line.strip() for line in gitignore.read_text(encoding='utf-8').splitlines() if line.strip() and not line.strip().startswith('#')]


def gitignore_has_exact_env_rule() -> bool:
    return any(line in {'.env', '/.env'} for line in gitignore_lines())


def archive_suffix_for(rel: str) -> str | None:
    lowered = rel.lower()
    for suffix in ARCHIVE_SUFFIXES:
        if lowered.endswith(suffix):
            return suffix
    return None


def gitignore_has_archive_rule(rel: str) -> bool:
    suffix = archive_suffix_for(rel)
    if suffix is None:
        return False
    basename = Path(rel).name
    accepted = {
        f'*{suffix}',
        f'/*{suffix}',
        basename,
        f'/{basename}',
    }
    return any(line in accepted for line in gitignore_lines())


def git_check_ignore(rel: str) -> bool:
    if not (ROOT / '.git').exists():
        if rel == '.env':
            return gitignore_has_exact_env_rule()
        return gitignore_has_archive_rule(rel)
    try:
        result = subprocess.run(
            ['git', 'check-ignore', '--quiet', rel],
            cwd=ROOT,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    except FileNotFoundError:
        if rel == '.env':
            return gitignore_has_exact_env_rule()
        return gitignore_has_archive_rule(rel)
    return result.returncode == 0


def git_is_tracked(rel: str) -> bool:
    if not (ROOT / '.git').exists():
        return False
    try:
        result = subprocess.run(
            ['git', 'ls-files', '--error-unmatch', '--', rel],
            cwd=ROOT,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    except FileNotFoundError:
        return False
    return result.returncode == 0


def check_local_ignored_file(rel: str) -> None:
    if rel == '.env':
        if not gitignore_has_exact_env_rule():
            fail(f'{rel} may exist locally only when .gitignore contains an explicit .env rule')
    elif archive_suffix_for(rel) is not None:
        if '/' in rel:
            fail(f'local archive is allowed only at repo root when ignored by Git: {rel}')
        if not gitignore_has_archive_rule(rel):
            fail(f'{rel} may exist locally only when .gitignore contains an explicit archive ignore rule')
    else:
        fail(f'unexpected local ignored file policy path: {rel}')

    if not git_check_ignore(rel):
        fail(f'{rel} exists locally but git does not ignore it')
    if git_is_tracked(rel):
        fail(f'{rel} is tracked; local generated/sensitive files must not be committed')


def check_source_tree() -> None:
    cleanup_python_cache()
    for path in iter_source_files():
        rel = path.relative_to(ROOT).as_posix()
        if rel in LOCAL_IGNORED_EXACT:
            check_local_ignored_file(rel)
            continue
        if archive_suffix_for(rel) is not None and '/' not in rel:
            check_local_ignored_file(rel)
            continue
        if rel in FORBIDDEN_EXACT:
            fail(f'forbidden generated/sensitive file in source tree: {rel}')
        if rel.endswith(FORBIDDEN_SUFFIXES) and rel not in {'package-lock.json'}:
            fail(f'forbidden generated archive/log/temp file in source tree: {rel}')


def check_zip(zip_path: Path) -> None:
    if not zip_path.is_file():
        fail(f'archive not found: {zip_path}')
    with zipfile.ZipFile(zip_path) as zf:
        for info in zf.infolist():
            name = info.filename.rstrip('/')
            if not name:
                continue
            parts = Path(name).parts
            if parts and parts[0] in FORBIDDEN_ROOTS:
                fail(f'forbidden root in archive: {name}')
            if name in FORBIDDEN_EXACT or name in LOCAL_IGNORED_EXACT:
                fail(f'forbidden exact path in archive: {name}')
            if name.endswith(FORBIDDEN_SUFFIXES):
                fail(f'forbidden generated file in archive: {name}')


def main() -> None:
    args = sys.argv[1:]
    if args:
        if len(args) != 2 or args[0] != '--codebase-zip':
            fail('usage: validate_artifact_hygiene.py [--codebase-zip path]')
        check_zip(Path(args[1]))
    else:
        check_source_tree()
    print('validate_artifact_hygiene: ok')


if __name__ == '__main__':
    main()
