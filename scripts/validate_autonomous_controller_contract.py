from __future__ import annotations
from pathlib import Path
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
SHELL_FILES = [
    'zip_codebase.sh',
    'pull_artifacts_and_zip_codebase.sh',
    'update_git.sh',
    'run-autonomous-implementation.sh',
    'run-paper-evaluation.sh',
    'run-autonomous-bugfix.sh',
    'automation.config.sh',
    '.automation/lib/run_common.sh',
]
REQUIRED_FRAGMENTS = {
    'run-autonomous-implementation.sh': [
        'Default duration: 72h.',
        '--prompt-file',
        'No --task flag is supported',
        'docs/automation/current-implementation-task.md',
        'automation_acquire_lock',
        'automation_build_artifacts_zip',
    ],
    'run-paper-evaluation.sh': [
        'Default duration: 72h.',
        '--adaptive',
        'PAPER_EVALUATION_UNSUPPORTED_FOR_THIS_REPO',
        'run-autonomous-bugfix.sh',
        'wait interval between paper evaluation cycles',
        'automation_build_artifacts_zip',
    ],
    'run-autonomous-bugfix.sh': [
        'Default duration: 72h.',
        '--from-artifacts',
        'Reactive evidence',
        'Proactive audit',
        'automation_build_artifacts_zip',
    ],
    'automation.config.sh': [
        'AUTOMATION_PROJECT_NAME="${AUTOMATION_PROJECT_NAME:-betting-win-surebet}"',
        'PAPER_SUPPORTED="${PAPER_SUPPORTED:-1}"',
        'tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json',
        'PAPER_HEALTH_COMMANDS=(',
        'AUTOMATION_PROTECTED_FILES=(',
    ],
    '.automation/lib/run_common.sh': [
        'automation_acquire_lock()',
        'automation_force_unlock()',
        'automation_build_artifacts_zip()',
        'automation_run_validations()',
    ],
    'docs/automation/README.md': [
        'Repo automation contract: betting-win-surebet',
        'run-paper-evaluation.sh',
        'run-autonomous-bugfix.sh',
        'artifacts.zip',
    ],
}
FORBIDDEN = [
    'run-paper-evaluation-12h.sh',
    'stop-autonomous-run.sh',
    'scripts/stop-autonomous-run.sh',
]

def fail(message: str) -> None:
    print(f'ERROR: {message}', file=sys.stderr)
    raise SystemExit(1)

def read(rel: str) -> str:
    path = ROOT / rel
    if not path.is_file():
        fail(f'missing required file: {rel}')
    return path.read_text(encoding='utf-8')

def require(text: str, marker: str, rel: str) -> None:
    if marker not in text:
        fail(f'{rel} missing required marker: {marker}')

def main() -> None:
    for rel in SHELL_FILES:
        result = subprocess.run(['bash', '-n', str(ROOT / rel)], cwd=ROOT, text=True, capture_output=True)
        if result.returncode != 0:
            fail(f'bash syntax failed for {rel}: {result.stderr.strip()}')
    for rel, fragments in REQUIRED_FRAGMENTS.items():
        text = read(rel)
        for fragment in fragments:
            require(text, fragment, rel)
    for rel in FORBIDDEN:
        if (ROOT / rel).exists():
            fail(f'obsolete automation helper still present: {rel}')
    package = json.loads(read('package.json'))
    for script in ['zip:codebase','autonomous:check','autonomous:start','autonomous:bugfix','paper:evaluation','bugfix','automation:status']:
        if script not in package.get('scripts', {}):
            fail(f'package.json missing script: {script}')
    print('validate_autonomous_controller_contract: ok')

if __name__ == '__main__':
    main()
