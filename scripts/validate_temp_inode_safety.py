from __future__ import annotations

from pathlib import Path
import re
import stat
import sys

ROOT = Path(__file__).resolve().parents[1]


def fail(message: str) -> None:
    print(f'ERROR: {message}', file=sys.stderr)
    raise SystemExit(1)


def read(relative: str) -> str:
    path = ROOT / relative
    if not path.is_file():
        fail(f'missing temp/inode safety file: {relative}')
    return path.read_text(encoding='utf-8')


def require_markers(relative: str, markers: list[str]) -> None:
    text = read(relative)
    for marker in markers:
        if marker not in text:
            fail(f'{relative} missing temp/inode safety marker: {marker}')


def require_executable(relative: str) -> None:
    mode = (ROOT / relative).stat().st_mode
    if mode & stat.S_IXUSR == 0:
        fail(f'temp/inode safety executable bit missing: {relative}')


def main() -> None:
    guard_markers = [
        'AUTOMATION_TEMP_ROOT_RELATIVE',
        'AUTOMATION_TEMP_STALE_SECONDS',
        'AUTOMATION_MIN_FREE_INODES',
        'AUTOMATION_MIN_FREE_INODE_PERCENT',
        'AUTOMATION_MIN_FREE_KIB',
        'AUTOMATION_MAX_RUN_TEMP_INODES',
        'AUTOMATION_CAPACITY_CHECK_INTERVAL_SECONDS',
        'AUTOMATION_TEMP_WATCHDOG_MAX_CONSECUTIVE_MEASUREMENT_FAILURES',
        'AUTOMATION_TEMP_USAGE_SCAN_TIMEOUT_SECONDS',
        'AUTOMATION_TEMP_CLEANUP_TIMEOUT_SECONDS',
        'repository_id=',
        'repository_realpath=',
        'owner_start_ticks=',
        'boot_id=',
        'heartbeat_at=',
        'cleanup_policy=delete_after_owner_exit',
        'df -Pk',
        'df -Pi',
        'du --inodes --summarize --one-file-system',
        'AUTOMATION_TEMP_INODE_PREFLIGHT_BLOCKED',
        'AUTOMATION_TEMP_SPACE_PREFLIGHT_BLOCKED',
        'AUTOMATION_TEMP_RUN_INODE_BUDGET_EXCEEDED',
        'kill -TERM "$owner_pid"',
        'rm -rf --one-file-system -- "$path"',
        'automation_temp_inode_recover_stale',
        'usage_scan_race_tolerated',
        'watchdog_measurement_retry',
        'term_exact_owner_only',
        'watchdog-events',
        'automation_temp_inode_bootstrap',
    ]
    require_markers('.automation/lib/temp_inode_guard.sh', guard_markers)
    require_executable('.automation/lib/temp_inode_guard.sh')

    require_markers('.automation/lib/run_common.sh', [
        'temp_inode_guard.sh',
        'automation_temp_inode_bootstrap "$slug"',
        'before_managed_command:$label',
        'after_managed_command:$label',
        'before_artifact_packaging',
        '.automation/tmp',
    ])

    controllers = [
        'run-autonomous-implementation.sh',
        'run-autonomous-bugfix.sh',
        'run-paper-evaluation.sh',
        'run-paper-autopilot.sh',
        'run-bugfix-autopilot.sh',
    ]
    for controller in controllers:
        text = read(controller)
        if 'automation_create_run_dir' not in text:
            fail(f'{controller} must initialize through automation_create_run_dir')

    require_markers('cleanup_automation_temp_inode_residue.sh', [
        'MODE=dry-run',
        '--apply',
        '--min-age-seconds',
        'automation_temp_inode_recover_stale',
        'bws-paper-runtime-evidence-*',
        'rm -rf --one-file-system',
    ])
    require_executable('cleanup_automation_temp_inode_residue.sh')

    require_markers('tests/bws-paper-runtime-evidence.test.ts', [
        'type TestContext',
        't.after(() =>',
        'rmSync(root, {',
        'maxRetries: 3',
        'retryDelay: 100',
    ])
    require_markers('tests/temp-inode-safety.test.ts', [
        'creates a private controller session',
        'distinct run-level temp roots',
        'inode preflight fails closed',
        'stale recovery removes only',
        'paper runtime evidence fixtures register recursive cleanup',
    ])

    require_markers('.gitignore', ['.automation/tmp/'])
    require_markers('zip_codebase.sh', ['*/tmp/*'])
    require_markers('scripts/validate_source_manifest.py', ["'tmp'"])
    require_markers('package.json', ['scripts/validate_temp_inode_safety.py'])
    require_markers('tools/required_executable_paths.js', [
        'cleanup_automation_temp_inode_residue.sh',
        '.automation/lib/temp_inode_guard.sh',
    ])
    require_markers('docs/automation/repository-temp-inode-safety.md', [
        'inode',
        '.automation/tmp',
        'df -Pi',
        'df -Pk',
        'watchdog',
        'cleanup_automation_temp_inode_residue.sh',
    ])

    combined = '\n'.join([
        read('.automation/lib/temp_inode_guard.sh'),
        read('cleanup_automation_temp_inode_residue.sh'),
    ])
    forbidden_patterns = [
        r'rm\s+-rf\s+/?tmp/\*',
        r'find\s+/?tmp\s+[^\n]*-delete',
        r'rm\s+-rf\s+/\s*(?:$|[;&])',
    ]
    for pattern in forbidden_patterns:
        if re.search(pattern, combined, flags=re.MULTILINE):
            fail(f'unsafe generic temp cleanup pattern detected: {pattern}')

    print('validate_temp_inode_safety: ok')


if __name__ == '__main__':
    main()
