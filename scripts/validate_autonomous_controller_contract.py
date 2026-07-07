from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

SHELL_FILES = [
    'zip_codebase.sh', 'pull_artifacts_and_zip_codebase.sh', 'update_git.sh',
    'check_progress.sh', 'watch_progress.sh', 'open_log.sh', 'start.sh', 'stop.sh',
    'run-autonomous-implementation.sh', 'run-paper-evaluation.sh', 'run-autonomous-bugfix.sh',
    'automation.config.sh', '.automation/lib/run_common.sh', '.automation/lib/telegram_notify.sh',
]

REQUIRED_FRAGMENTS = {
    'update_git.sh': [
        'git pull --ff-only --autostash',
        'GIT_ASKPASS',
        'clear_local_extraheaders_quietly',
        'detached HEAD is not supported',
        'refusing to commit secret-like path',
    ],
    'zip_codebase.sh': [
        '--artifacts-only',
        'created_zip=%s',
        'file_count=%s',
        'sha256=%s',
        'zc_is_artifacts_excluded_path()',
    ],
    'pull_artifacts_and_zip_codebase.sh': [
        'REMOTE_ARTIFACT',
        'sshpass',
        'bash ./zip_codebase.sh',
        '--remote-codebase',
        'No automation.config.sh',
    ],
    'check_progress.sh': [
        'autonomous_implementation_*',
        'autonomous_bugfix_*',
        'paper_evaluation_*',
        'final-summary.md',
        'cycles/cycle_',
    ],
    'watch_progress.sh': [
        '--once',
        '--fast',
        '--base-url',
        'progress_source=local_artifacts_no_service',
    ],
    'open_log.sh': [
        '--controller',
        '--codex',
        '--paper',
        '--cycle',
        'cycles/cycle_',
    ],
    'start.sh': [
        'Node is missing. Activate the repo runtime first',
        'nvm use',
        'node scripts/restore-required-executable-bits.js',
        'npm run validate',
    ],
    'stop.sh': [
        'has no long-running service',
        'No provider, trading, database, worker, scheduler, or production process was stopped.',
    ],
    '.automation/lib/telegram_notify.sh': [
        'telegram_notify_send_final()',
        'telegram_notify_message_version()',
        '20260706.pretty_v2_html_cards',
        'telegram_notify_build_final_message()',
        'telegram_notify_log_payload()',
        'TELEGRAM_NOTIFY_DRY_RUN',
        "parse_mode: 'HTML'",
        'telegram_notification=skipped missing_config message_version=',
        'telegram_notification=sent parse_mode=HTML message_version=',
        'TELEGRAM_NOTIFY',
        'TELEGRAM_BOT_TOKEN',
        'TELEGRAM_CHAT_ID',
    ],
    '.automation/lib/run_common.sh': [
        'automation_acquire_lock()',
        'automation_force_unlock()',
        'automation_build_artifacts_zip()',
        'automation_run_validations()',
        'automation_require_cycle_artifacts()',
        'automation_read_continue_status()',
        'missing continue status file',
        'unknown continue status',
    ],
    'run-autonomous-implementation.sh': [
        '--model MODEL',
        '--fallback-model MODEL',
        '--repo-dir PATH',
        '--cycle-timeout VALUE',
        '--validation-timeout VALUE',
        '--install-timeout VALUE',
        '--zip-timeout VALUE',
        '--max-cycles N',
        '--sandbox MODE',
        '--auto-install',
        '--allow-parallel',
        '--handover-paper-mode',
        '--print-config',
        '--stream',
        '--no-stream',
        'No --task flag is supported',
        'docs/automation/current-implementation-task.md',
        'telegram_notify_send_final "run-autonomous-implementation.sh"',
        'automation_require_cycle_artifacts',
        'automation_read_continue_status',
        'check_only_validation_failed',
        'AUTONOMOUS_GOAL_COMPLETE=yes',
        'BLOCKED=yes',
        'exit 3',
        'Activate the repo runtime in the parent shell first',
        'never sources nvm.sh',
    ],
    'run-autonomous-bugfix.sh': [
        '--from-artifacts PATH',
        '--model MODEL',
        '--fallback-model MODEL',
        '--repo-dir PATH',
        '--cycle-timeout VALUE',
        '--validation-timeout VALUE',
        '--handover-autonomous-implementation',
        '--print-config',
        'audit/handoff controller',
        'It must not patch app source directly',
        'Audit order:',
        'Artifacts first',
        'source_status_snapshot',
        'write_implementation_handoff',
        'autonomous-implementation-handover.env',
        'telegram_notify_send_final "run-autonomous-bugfix.sh"',
        'automation_require_cycle_artifacts',
        'automation_read_continue_status',
        'BLOCKED=yes',
        'exit 3',
        'Activate the repo runtime in the parent shell first',
        'never sources nvm.sh',
    ],
    'run-paper-evaluation.sh': [
        'Default duration: 72h.',
        '--adaptive',
        '--keep-monitoring-when-ready',
        '--model MODEL',
        '--fallback-model MODEL',
        '--repo-dir PATH',
        '--check-only',
        '--codex-phase-timeout VALUE',
        '--validation-timeout VALUE',
        'SUREBET_PINNED_BUNDLE',
        'SUREBET_REQUIRE_PINNED_BUNDLE',
        'paper_service_lifecycle=none',
        'PAPER_EVALUATION_READY_PRIVATE_FIXTURE_ONLY_BLOCKED_ON_PINNED_BUNDLE',
        'PAPER_EVALUATION_PINNED_BUNDLE_ACCEPTED_PRIVATE_REPORT_WRITTEN',
        'PAPER_EVALUATION_BLOCKED_INVALID_PINNED_BUNDLE',
        'paper-mode-to-autonomous-implementation.env',
        'telegram_notify_send_final "run-paper-evaluation.sh"',
        'automation_build_artifacts_zip',
        'Activate the repo runtime in the parent shell first',
        'Does not source nvm.sh',
        'local rc=$?',
    ],
    'automation.config.sh': [
        'AUTOMATION_CONFIG_READY=1',
        'AUTOMATION_REPO_NAME="betting-win-surebet"',
        '.automation/lib/telegram_notify.sh',
        'AUTOMATION_MAX_CODEX_FAILURES',
        'AUTOMATION_MAX_CONSECUTIVE_VALIDATION_FAILURES',
        'AUTOMATION_INSTALL_TIMEOUT',
        'AUTOMATION_ZIP_TIMEOUT',
        'run-paper-evaluation.sh is surebet-specific: no service lifecycle, private fixture/pinned-bundle only.',
        'PAPER_SUPPORTED="${PAPER_SUPPORTED:-1}"',
        'SUREBET_REQUIRE_PINNED_BUNDLE',
    ],
    'docs/automation/README.md': [
        'Repo automation contract: betting-win-surebet',
        './zip_codebase.sh --artifacts-only',
        'git pull --ff-only --autostash',
        '.automation/lib/telegram_notify.sh',
        'root `run-*` controllers',
        'run-autonomous-implementation.sh',
        'run-autonomous-bugfix.sh',
    ],
    'docs/automation/autonomous-implementation.md': [
        '--model cli-default',
        '--fallback-model none',
        '--cycle-timeout',
        '--validation-timeout',
        '--handover-paper-mode',
        'check-only must fail',
        'Telegram',
        'AUTONOMOUS_GOAL_COMPLETE=yes',
        'Federico',
    ],
    'docs/automation/autonomous-bugfix.md': [
        'audit/handoff controller',
        '--handover-autonomous-implementation',
        'autonomous-implementation-handover.env',
        'does not patch app source directly',
        'Telegram',
        'Artifacts first',
    ],
    'docs/automation/PROTECTED_AUTOMATION_FILES.md': [
        '.automation/lib/telegram_notify.sh',
        'check_progress.sh',
        'watch_progress.sh',
        'open_log.sh',
    ],
    '.automation/README.md': [
        '.automation/lib/run_common.sh',
        '.automation/lib/telegram_notify.sh',
        'run-autonomous-implementation.sh',
        'run-autonomous-bugfix.sh',
    ],
    'docs/repo_status_current.md': [
        'run_autonomous_implementation=standardized_with_canonical_flags_and_telegram',
        'run_autonomous_bugfix=standardized_audit_handoff_with_telegram',
        'run_paper_evaluation_standardization=standardized_with_telegram_no_service_private_fixture_pinned_bundle',
        'run_paper_evaluation=canonical_repo_local_private_fixture_and_pinned_bundle_only',
    ],
}

FORBIDDEN = [
    'run-paper-evaluation-12h.sh',
    'stop-autonomous-run.sh',
    'scripts/stop-autonomous-run.sh',
]

FORBIDDEN_FRAGMENTS = {
    'start.sh': ['. scripts/load-node-runtime.sh', 'source "$HOME/.nvm/nvm.sh"', 'source "$NVM_DIR/nvm.sh"'],
    'run-autonomous-implementation.sh': [
        'scripts/load-node-runtime.sh',
        'source "$HOME/.nvm/nvm.sh"',
        'source "$NVM_DIR/nvm.sh"',
    ],
    'run-autonomous-bugfix.sh': [
        'scripts/load-node-runtime.sh',
        'source "$HOME/.nvm/nvm.sh"',
        'source "$NVM_DIR/nvm.sh"',
        'Find and fix bug-class issues',
    ],
    'run-paper-evaluation.sh': [
        'scripts/load-node-runtime.sh',
        'source "$HOME/.nvm/nvm.sh"',
        'source "$NVM_DIR/nvm.sh"',
        'run-autonomous-bugfix.sh --from-artifacts',
        'PAPER_EVALUATION_UNSUPPORTED_FOR_THIS_REPO',
        'local rc\n  rc=$?',
    ],
    'automation.config.sh': [
        'mkdir -p artifacts/private-paper-mode',
        'run-paper-evaluation.sh remains out of scope',
    ],
    'commands/run-pinned-interface-smoke.sh': [
        'scripts/load-node-runtime.sh',
        'mkdir -p "$out_dir"',
    ],
}


def fail(message: str) -> None:
    print(f'ERROR: {message}', file=sys.stderr)
    raise SystemExit(1)


def read(rel: str) -> str:
    path = ROOT / rel
    if not path.is_file():
        fail(f'missing required file: {rel}')
    return path.read_text(encoding='utf-8')


def main() -> None:
    for rel in SHELL_FILES:
        result = subprocess.run(['bash', '-n', str(ROOT / rel)], cwd=ROOT, text=True, capture_output=True)
        if result.returncode != 0:
            fail(f'bash syntax failed for {rel}: {result.stderr.strip()}')

    for rel, fragments in REQUIRED_FRAGMENTS.items():
        text = read(rel)
        for fragment in fragments:
            if fragment not in text:
                fail(f'{rel} missing required marker: {fragment}')

    for rel, fragments in FORBIDDEN_FRAGMENTS.items():
        text = read(rel)
        for fragment in fragments:
            if fragment in text:
                fail(f'{rel} contains forbidden marker: {fragment}')

    for rel in FORBIDDEN:
        if (ROOT / rel).exists():
            fail(f'obsolete automation helper still present: {rel}')

    package = json.loads(read('package.json'))
    for script in ['zip:codebase', 'autonomous:check', 'autonomous:start', 'autonomous:bugfix', 'paper:evaluation', 'bugfix', 'automation:status']:
        if script not in package.get('scripts', {}):
            fail(f'package.json missing script: {script}')

    print('validate_autonomous_controller_contract: ok')


if __name__ == '__main__':
    main()
