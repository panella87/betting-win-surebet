from __future__ import annotations

from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]


def fail(message: str) -> None:
    print(f'ERROR: {message}', file=sys.stderr)
    raise SystemExit(1)


def read(path: Path) -> str:
    return path.read_text(encoding='utf-8')


REQUIRED = [
    'README.md', 'AGENTS.md', 'CHANGELOG.md', 'PROJECT_STATUS.md', 'STARTER_PACK.md',
    'DOCUMENTATION_CHECK_REPORT.md', 'package.json', 'package-lock.json', 'tsconfig.json',
    '.gitignore', '.gitattributes', '.env.example', '.nvmrc', 'cli.js',
    'start.sh', 'stop.sh', 'check_progress.sh', 'watch_progress.sh', 'open_log.sh',
    'update_git.sh', 'pull_artifacts_and_zip_codebase.sh', 'zip_codebase.sh',
    'run-autonomous-implementation.sh', 'run-paper-evaluation.sh', 'run-paper-autopilot.sh',
    'run-autonomous-bugfix.sh', 'run-bugfix-autopilot.sh', 'automation.config.sh',
    '.automation/lib/run_common.sh', '.automation/lib/controller_hardening_v2.sh',
    '.automation/lib/telegram_notify.sh', '.automation/README.md',
    'docs/automation/README.md', 'docs/automation/PROTECTED_AUTOMATION_FILES.md',
    'docs/automation/repo-profile.md', 'docs/automation/autonomous-implementation.md',
    'docs/automation/paper-evaluation.md', 'docs/automation/paper-autopilot.md',
    'docs/automation/autonomous-bugfix.md', 'docs/automation/bugfix-autopilot.md',
    'docs/automation/current-implementation-task.md', 'docs/automation/SSH_KEY_SETUP.md',
    'docs/automation/POST_OVERLAY_CLEANUP.md', 'docs/automation/telegram-notifications.md',
    'docs/MASTER_PLAN.md', 'docs/repo_status_current.md', 'docs/autonomous_loop_contract.md',
    'docs/operations/autonomous_72h_runbook.md', 'docs/operations/service_run.md',
    *[f'docs/{number:03d}_{name}' for number, name in [
        (1, 'scope_and_boundaries.md'), (2, 'dependency_contract_with_betting_win.md'),
        (3, 'surebet_family_decision.md'), (4, 'market_identity_and_rule_equivalence.md'),
        (5, 'terminal_scenario_cashflow_model.md'), (6, 'quote_depth_capacity_requirements.md'),
        (7, 'stake_vector_solver_contract.md'), (8, 'leg_completion_and_residual_exposure.md'),
        (9, 'settlement_replay_contract.md'), (10, 'paper_evaluation_and_kill_criteria.md'),
        (11, 'validation_matrix.md'), (12, 'runbook.md'),
        (13, 'autonomous_controller_status_contract.md'),
        (14, 'sure_001_remaining_hardening_backlog.md'),
        (15, 'local_engine_implementation_backlog.md'),
        (16, 'pinned_betting_win_interface_readiness.md'),
        (17, 'private_paper_mode_implementation_backlog.md'),
        (18, 'private_paper_mode_runbook.md'),
        (19, 'three_repo_surebet_strategy_boundary.md'),
        (20, 'strategy_data_and_state_ownership.md'),
        (21, 'backtest_paper_live_mode_roadmap.md'),
        (22, 'separate_account_policy.md'),
        (23, 'legacy_betting_win_surebet_import_manifest.md'),
        (24, 'three_repo_documentation_completion_status.md'),
        (25, 'research_archive_completion_status.md'),
        (26, 'betting_win_platform_baseline.md'),
        (27, 'bws_target_architecture.md'),
        (28, 'full_implementation_program.md'),
        (29, 'full_implementation_task_ledger.md'),
        (30, 'upstream_compatibility_and_pin_contract.md'),
        (31, 'bws_api_ui_worker_contract.md'),
        (32, 'database_and_data_lifecycle.md'),
    ]],
    'backlog/README.md', 'backlog/bws_full_implementation.csv',
    'config/betting-win.upstream-baseline.json',
    'schemas/betting-win-upstream-lock.v1.schema.json',
    'decisions/ADR-0001-repo-boundary-and-no-provider-connections.md',
    'decisions/ADR-0002-first-lane-polymarket-standard-binary-complete-set.md',
    'decisions/ADR-0003-paper-only-no-execution.md',
    'decisions/ADR-0004-three-repo-surebet-strategy-execution-boundary.md',
    'decisions/ADR-0005-bws-built-on-betting-win-platform.md',
    'docs/legacy/surebet-research/README.md',
    'research/imported-from-betting-win/legacy/surebet/README.md',
    'research/imported-from-betting-win/legacy/surebet/RESEARCH_IMPORT_MANIFEST.json',
    'schemas/imported-from-betting-win/legacy/surebet/README.md',
    'templates/imported-from-betting-win/legacy/surebet/README.md',
    'src/contracts/betting-win-contract-imports.ts', 'src/contracts/local-types.ts',
    'scripts/validate_contract_boundary.py', 'scripts/validate_no_provider_connections.py',
    'scripts/validate_no_execution_paths.py', 'scripts/validate_fixture_integrity.py',
    'scripts/validate_master_plan.py', 'scripts/validate_executable_bits.py',
    'scripts/validate_artifact_hygiene.py', 'scripts/validate_node_runtime_loader.py',
    'scripts/validate_shell_local_assignments.py', 'scripts/validate_autonomous_controller_contract.py',
    'scripts/validate_source_manifest.py', 'scripts/regenerate_source_manifest.py',
    'scripts/validate_autonomous_continuation_contract.py',
    'scripts/validate_local_engine_backlog_contract.py',
    'scripts/validate_private_paper_mode_backlog_contract.py',
    'scripts/validate_three_repo_surebet_boundary.py',
    'scripts/validate_full_implementation_program.py',
    'scripts/validate_betting_win_upstream_contract.py',
    'scripts/run_betting_win_upstream_lock.mjs',
    'scripts/load-node-runtime.sh', 'scripts/create-source-handoff-archive.sh',
    'scripts/restore-required-executable-bits.js',
    'tests/autonomous-controller-contract.test.ts', 'tests/paper-autopilot-contract.test.ts',
    'tests/bugfix-autopilot-contract.test.ts', 'tests/run-script-hardening-wave2.test.ts',
    'tests/run-script-hardening-wave4.test.ts', 'tests/run-script-hardening-wave5.test.ts',
    'tests/run-script-hardening-wave7.test.ts', 'tests/run-script-hardening-wave8.test.ts',
    'tests/run-script-hardening-wave9.test.ts', 'tests/autonomous-continuation-contract.test.ts',
    'tests/local-engine-backlog-contract.test.ts', 'tests/private-paper-mode-backlog-contract.test.ts',
    'tests/three-repo-surebet-boundary.test.ts', 'tests/full-implementation-program-contract.test.ts',
    'tests/betting-win-upstream-contract.test.ts', 'tests/validate-artifact-hygiene.test.ts',
    'tests/validate-fixture-integrity.test.ts', 'tests/validate-shell-local-assignments.test.ts',
    'tests/validate-source-manifest.test.ts', 'tests/packaging-helpers.test.ts',
    'tests/validate-repo-contract.test.ts', 'tests/validation-matrix-contract.test.ts',
    'tests/fixtures/pinned-interface-placeholder/.gitkeep',
    'tests/fixtures/pinned-interface-placeholder/local-placeholder.json',
    'tests/fixtures/private-paper-mode-smoke/accepted-local-bundle.json',
    'tests/fixtures/private-paper-mode-smoke/blocked-missing-settlement-bundle.json',
    'tests/fixtures/private-paper-mode-smoke/blocked-stale-quotes-bundle.json',
    'tests/fixtures/private-paper-mode-smoke/blocked-mixed-currency-bundle.json',
    'tests/fixtures/private-paper-mode-smoke/multi-candidate-bundle.json',
    'tools/required_executable_paths.js', 'commands/run-sure-001-autonomous.sh',
    'commands/run-sure-local-engine-autonomous.sh', 'commands/run-sure-paper-mode-autonomous.sh',
    'commands/run-pinned-interface-smoke.sh',
]
FORBIDDEN = [
    'run-paper-evaluation-12h.sh', 'stop-autonomous-run.sh', 'scripts/stop-autonomous-run.sh',
    'docs/imported-from-betting-win',
]
CONFLICT_MARKER_PREFIXES = ('<<<<<<<', '>>>>>>>')
CONFLICT_SEPARATOR = '======='
CONFLICT_SCAN_SKIP_DIRS = {'.git', 'node_modules', 'dist', 'artifacts', '.tmp', '.cache'}
CONFLICT_SCAN_SKIP_SUFFIXES = {'.zip', '.gz', '.tar', '.tgz', '.png', '.jpg', '.jpeg', '.webp', '.ico', '.db', '.sqlite'}


def validate_no_conflict_markers() -> None:
    hits: list[str] = []
    for path in sorted(ROOT.rglob('*')):
        if not path.is_file():
            continue
        rel_path = path.relative_to(ROOT)
        rel = rel_path.as_posix()
        if any(part in CONFLICT_SCAN_SKIP_DIRS for part in rel_path.parts):
            continue
        if path.suffix.lower() in CONFLICT_SCAN_SKIP_SUFFIXES:
            continue
        try:
            lines = path.read_text(encoding='utf-8').splitlines()
        except UnicodeDecodeError:
            continue
        for line_no, line in enumerate(lines, start=1):
            stripped = line.strip()
            if stripped == CONFLICT_SEPARATOR or any(stripped.startswith(prefix) for prefix in CONFLICT_MARKER_PREFIXES):
                hits.append(f'{rel}:{line_no}:{stripped}')
    if hits:
        fail('unresolved merge conflict markers found: ' + '; '.join(hits[:20]))


def main() -> None:
    validate_no_conflict_markers()
    missing = [rel for rel in REQUIRED if not (ROOT / rel).is_file()]
    if missing:
        fail('missing required files: ' + ', '.join(missing))
    present_forbidden = [rel for rel in FORBIDDEN if (ROOT / rel).exists()]
    if present_forbidden:
        fail('forbidden or premature files present: ' + ', '.join(present_forbidden))

    package = json.loads(read(ROOT / 'package.json'))
    if package.get('private') is not True:
        fail('package.json must set private=true')
    if package.get('version') != '0.1.0-bws-full-platform':
        fail('package.json version must be 0.1.0-bws-full-platform')
    required_scripts = [
        'typecheck', 'test', 'validate', 'validate:starter', 'validate:ops',
        'validate:implementation-program', 'validate:loopback-acceptance', 'validate:upstream-boundary',
        'generate:upstream-lock', 'verify:upstream-lock',
        'validate:three-repo-boundary', 'restore:executables', 'regen:source-manifest',
        'zip:codebase', 'autonomous:check', 'autonomous:start', 'autonomous:bugfix',
        'paper:evaluation', 'paper:autopilot', 'bugfix', 'bugfix:autopilot', 'automation:status',
    ]
    for script in required_scripts:
        if script not in package.get('scripts', {}):
            fail(f'package.json missing script: {script}')
    if package.get('scripts', {}).get('test') != 'npm run build && node --test --test-concurrency=1 dist/tests/*.test.js':
        fail('package.json test script must serialize test files with --test-concurrency=1')
    if 'npm run validate:loopback-acceptance' not in package.get('scripts', {}).get('validate:starter', ''):
        fail('package.json validate:starter must invoke validate:loopback-acceptance')
    if package.get('bin', {}).get('betting-win-surebet') != './cli.js':
        fail('package.json bin must expose ./cli.js')

    required_doc_markers = {
        'README.md': ['program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1', 'repo_role=surebet_strategy_application', 'current_task=BWS-510', 'run-autonomous-implementation.sh'],
        'AGENTS.md': ['Source-of-truth order', 'BETTING_WIN_REPO_PATH', 'backlog/bws_full_implementation.csv', 'BWS-510'],
        'docs/automation/repo-profile.md': ['repo_role=surebet_strategy_application', 'program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1', 'Standard helper scripts'],
        'docs/automation/paper-evaluation.md': ['run-paper-evaluation.sh', 'retained fixture/pinned-bundle evaluator', 'SUREBET_PINNED_BUNDLE'],
        'docs/automation/paper-autopilot.md': ['run-paper-autopilot.sh', 'post-implementation runtime/database convergence', 'PAPER_AUTOPILOT_BLOCKED_ON_PINNED_BUNDLE'],
        'docs/automation/autonomous-bugfix.md': ['strict implementation-handoff controller', 'BUGFIX_AUDIT_COMPLETE=yes', 'request_flags.txt'],
        'docs/automation/bugfix-autopilot.md': ['run-bugfix-autopilot.sh', 'same-area re-audit', 'campaign_coverage.tsv'],
        'PROJECT_STATUS.md': ['program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1', 'status=IMPLEMENTATION_READY', 'current_task=BWS-510'],
        'docs/repo_status_current.md': ['Standard automation status', 'run_autonomous_implementation=standardized_and_selected', 'run_paper_autopilot=standardized_parent_for_post_implementation_runtime_convergence', 'run_bugfix_autopilot=standardized_parent_for_broad_audit_and_repair'],
        'docs/MASTER_PLAN.md': ['program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1', 'backlog/bws_full_implementation.csv', 'Automation operating model'],
    }
    for rel, markers in required_doc_markers.items():
        text = read(ROOT / rel)
        for marker in markers:
            if marker not in text:
                fail(f'{rel} missing required marker: {marker}')

    gitignore = read(ROOT / '.gitignore')
    for marker in [
        'node_modules/', '.env', 'artifacts/*', '*.zip', '.codex_current_artifact_dir',
        'config/betting-win.upstream.lock.json',
        '.automation/locks/', '.automation/corrupt/',
        '.automation/paper-mode-to-autonomous-implementation.env',
        '.automation/autonomous-implementation-handover.env', 'zi??????',
    ]:
        if marker not in gitignore:
            fail(f'.gitignore missing: {marker}')

    print('validate_repo: ok')


if __name__ == '__main__':
    main()
