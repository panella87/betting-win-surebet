import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf8');

function prepareTempRepo(): string {
  const repo = mkdtempSync(join(tmpdir(), 'surebet-bugfix-autopilot-'));
  mkdirSync(join(repo, '.automation', 'lib'), { recursive: true });
  for (const rel of [
    'run-bugfix-autopilot.sh',
    '.automation/lib/run_common.sh',
    '.automation/lib/controller_hardening_v2.sh',
    '.automation/lib/telegram_notify.sh',
  ]) {
    const target = join(repo, rel);
    mkdirSync(join(target, '..'), { recursive: true });
    copyFileSync(join(ROOT, rel), target);
    chmodSync(target, 0o755);
  }
  writeFileSync(join(repo, 'automation.config.sh'), `#!/usr/bin/env bash
AUTOMATION_CONFIG_READY=1
AUTOMATION_REPO_NAME="betting-win-surebet"
AUTOMATION_CODEX_SANDBOX="danger-full-access"
AUTOMATION_CODEX_STREAM_LOGS=0
AUTOMATION_VALIDATION_TIMEOUT=60s
AUTOMATION_INSTALL_TIMEOUT=60s
AUTOMATION_ZIP_TIMEOUT=60s
AUTOMATION_CODEX_CYCLE_TIMEOUT=60s
AUTOMATION_MAX_CYCLES=2
AUTOMATION_PROTECTED_FILES=()
AUTOMATION_VALIDATION_COMMANDS=()
AUTOMATION_IMPLEMENTATION_VALIDATION_COMMANDS=()
AUTOMATION_BUGFIX_VALIDATION_COMMANDS=()
`, 'utf8');
  return repo;
}

function writeExecutable(path: string, body: string): void {
  writeFileSync(path, body, 'utf8');
  chmodSync(path, 0o755);
}

test('bugfix controller exposes strict four-state audit and handoff contract', () => {
  const script = read('run-autonomous-bugfix.sh');
  for (const marker of [
    '--bugfix-focus-file PATH', '--campaign-area SLUG', '--handover-autonomous-implementation',
    'BUGFIX_AUDIT_COMPLETE=yes', 'HANDOVER_AUTONOMOUS_IMPLEMENTATION=yes',
    'strict_request_flags=enabled', 'semantic_handoff_fingerprint=enabled',
    'request_flags.txt', 'BUG_SIGNATURE', 'SOURCE_EVIDENCE_SHA256',
    'BUGFIX_MODE_AUTOMATION_MAINTENANCE_ALLOWED', 'ALLOWED_PROTECTED_FILES',
    'codex_failure_class()', 'context_window', 'model_availability',
    'artifact_hint_resolved_before_run_dir=yes', 'source_mutation_detected=yes',
  ]) assert.match(script, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(script, /AUTONOMOUS_GOAL_COMPLETE=yes/);
});

test('bugfix autopilot exposes the bounded audit implementation re-audit campaign', () => {
  const script = read('run-bugfix-autopilot.sh');
  for (const marker of [
    '--bugfix-duration VALUE', '--implementation-duration VALUE', '--max-rounds N', '--max-same-handoff N',
    'boundary_and_input_contracts', 'cross_area_regression_and_campaign_closure',
    'run-autonomous-bugfix.sh', 'run-autonomous-implementation.sh', '--handover-bugfix-audit',
    'mandatory_same_area_reaudit=enabled', 'campaign_coverage.tsv',
    'BUGFIX_AUTOPILOT_COMPLETE', 'BUGFIX_AUTOPILOT_BLOCKED_IMPLEMENTATION_NOOP',
    'next_same_area_bugfix_reaudit', 'validate_bugfix_completion_contract()',
    'semantic_bug_signature_repeat_guard=enabled', 'parent_budget_clamping=enabled',
    'child_aware_lock=enabled', 'cross_controller_lock_guard=enabled',
    'atomic_parent_lock_acquisition=enabled', 'parent_lock_mtime_heartbeat=enabled',
    'parent_child_cleanup_failure_classification=enabled', 'parent_lock_release_failure_classification=enabled',
    'lock_preservation_on_child_identity_failure=enabled', 'verified_force_unlock_termination=enabled',
    'child_telegram_notifications=suppressed_by_parent', 'parent_telegram_notification=final_only',
    '"TELEGRAM_NOTIFY=0"', 'automation_assert_no_incompatible_locks', 'automation_v2_claim_env_file_atomic',
    'automation_v2_touch_owned_parent_lock', 'refresh_parent_lock_heartbeat()', 'bugfix_child_mutated_source',
    'unsupported handoff key for schema v1', 'active_child_identity_or_termination_failed', 'parent_budget_exhausted',
    'BUGFIX_AUTOPILOT_BLOCKED_LOCK_RELEASE', "printf 'lock_release_status=%s\\n'", "printf 'lock_preserved=%s\\n'",
  ]) assert.match(script, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(script, /run-paper-evaluation\.sh|run-paper-autopilot\.sh|bash \.\/start\.sh|bash \.\/stop\.sh|forever|MongoDB/);
});

test('bugfix autopilot rejects an incompatible controller before creating campaign artifacts', () => {
  const repo = prepareTempRepo();
  let paperParent: ReturnType<typeof spawn> | undefined;
  try {
    writeExecutable(join(repo, 'run-autonomous-bugfix.sh'), '#!/usr/bin/env bash\nexit 99\n');
    writeExecutable(join(repo, 'run-autonomous-implementation.sh'), '#!/usr/bin/env bash\nexit 99\n');
    const paperScript = join(repo, 'run-paper-autopilot.sh');
    writeExecutable(paperScript, '#!/usr/bin/env bash\ntrap "exit 0" TERM INT\nwhile true; do sleep 1; done\n');
    paperParent = spawn('bash', [paperScript], { cwd: repo, stdio: 'ignore' });
    assert.ok(paperParent.pid);

    const locks = join(repo, '.automation', 'locks');
    mkdirSync(locks, { recursive: true });
    writeFileSync(join(locks, 'run-paper-autopilot.lock'), [
      'LOCK_SCHEMA_VERSION=1',
      'CONTROLLER=run-paper-autopilot.sh',
      `CONTROLLER_PID=${paperParent.pid}`,
      'REPOSITORY=betting-win-surebet',
      `REPO_REALPATH=${realpathSync(repo)}`,
      `SCRIPT_REALPATH=${realpathSync(paperScript)}`,
      'RUN_DIR=',
      `HEARTBEAT_EPOCH=${Math.floor(Date.now() / 1000)}`,
      'ACTIVE_CHILD_PID=',
      'ACTIVE_CHILD_KIND=none',
      'ACTIVE_CHILD_SCRIPT=',
      'ACTIVE_CHILD_COMMAND=',
      '',
    ].join('\n'), 'utf8');

    const result = spawnSync('bash', ['./run-bugfix-autopilot.sh', '--duration', '60', '--bugfix-duration', '30', '--implementation-duration', '30', '--max-rounds', '1', '--model', 'cli-default', '--fallback-model', 'none', '--no-stream'], {
      cwd: repo,
      env: { ...process.env, TELEGRAM_NOTIFY: '0' },
      encoding: 'utf8',
      timeout: 10000,
    });

    assert.equal(result.status, 27, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /incompatible controller is active: run-paper-autopilot\.sh/);
    assert.match(result.stdout, /final_status=setup_failed/);
    const artifacts = join(repo, 'artifacts');
    const campaigns = existsSync(artifacts)
      ? readdirSync(artifacts).filter((entry) => entry.startsWith('bugfix_autopilot_'))
      : [];
    assert.deepEqual(campaigns, []);
  } finally {
    paperParent?.kill('SIGTERM');
    rmSync(repo, { recursive: true, force: true });
  }
});

test('semantic handoff fingerprint ignores volatile evidence path but retains evidence hash', () => {
  const temp = mkdtempSync(join(tmpdir(), 'surebet-handoff-fingerprint-'));
  const helper = join(ROOT, '.automation', 'lib', 'controller_hardening_v2.sh');
  try {
    const a = join(temp, 'a.env');
    const b = join(temp, 'b.env');
    writeFileSync(a, 'HANDOVER_KIND=x\nSOURCE_EVIDENCE_PATH=artifacts/run-a/evidence.md\nSOURCE_EVIDENCE_SHA256=abc\nWRITTEN_AT=2026-01-01T00:00:00Z\n', 'utf8');
    writeFileSync(b, 'HANDOVER_KIND=x\nSOURCE_EVIDENCE_PATH=artifacts/run-b/evidence.md\nSOURCE_EVIDENCE_SHA256=abc\nWRITTEN_AT=2026-02-01T00:00:00Z\n', 'utf8');
    const fingerprint = (file: string): string => execFileSync('bash', ['-lc', '. "$1"; automation_v2_semantic_env_fingerprint "$2"', 'bash', helper, file], { encoding: 'utf8' }).trim();
    assert.equal(fingerprint(a), fingerprint(b));
    writeFileSync(b, 'HANDOVER_KIND=x\nSOURCE_EVIDENCE_PATH=artifacts/run-b/evidence.md\nSOURCE_EVIDENCE_SHA256=def\nWRITTEN_AT=2026-02-01T00:00:00Z\n', 'utf8');
    assert.notEqual(fingerprint(a), fingerprint(b));
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test('bugfix autopilot requires implementation and then re-audits the same area before closure', () => {
  const repo = prepareTempRepo();
  try {
    writeExecutable(join(repo, 'run-autonomous-bugfix.sh'), `#!/usr/bin/env bash
set -Eeuo pipefail
repo=""; area=""; while [[ $# -gt 0 ]]; do case "$1" in --repo-dir) repo="$2"; shift 2;; --campaign-area) area="$2"; shift 2;; *) shift;; esac; done
printf '%s\n' "\${TELEGRAM_NOTIFY:-unset}" >> "$repo/artifacts/stub-child-telegram-values"
. "$repo/.automation/lib/controller_hardening_v2.sh"
mkdir -p "$repo/.automation/runtime"
count_file="$repo/.automation/runtime/stub-bugfix-count"
count=0; [[ -f "$count_file" ]] && count="$(cat "$count_file")"; count=$((count+1)); echo "$count" > "$count_file"
run="$repo/artifacts/autonomous_bugfix_stub_$count"; cycle="$run/cycles/cycle_1"; mkdir -p "$cycle"
if [[ "$count" == 1 ]]; then
  echo 'confirmed bug' > "$cycle/evidence.md"
  hash="$(sha256sum "$cycle/evidence.md" | awk '{print $1}')"
  source_fp="$(automation_v2_source_tree_fingerprint "$repo")"
  bug_sig="$(printf '%s\n' "AUDIT_AREA=$area" 'BUG_IDS=STUB-1' 'IMPLEMENTATION_SCOPE=fix_stub' | sort | sha256sum | awk '{print $1}')"
  automation_v2_write_env_atomic "$repo/.automation/autonomous-implementation-handover.env" \
    'HANDOVER_SCHEMA_VERSION=1' 'HANDOVER_KIND=autonomous-bugfix-to-autonomous-implementation' 'REPOSITORY=betting-win-surebet' 'CONTROLLER=stub' \
    'RUN_AUTONOMOUS_IMPLEMENTATION_NEXT=yes' 'AUTONOMOUS_IMPLEMENTATION_EXPECTED_FLAG=--handover-bugfix-audit' 'HANDOVER_AUTONOMOUS_IMPLEMENTATION=yes' \
    "AUDIT_AREA=$area" "AUDIT_SOURCE_FINGERPRINT=$source_fp" 'BUG_IDS=STUB-1' "BUG_SIGNATURE=$bug_sig" 'IMPLEMENTATION_SCOPE=fix_stub' \
    "SOURCE_EVIDENCE_PATH=artifacts/autonomous_bugfix_stub_$count/cycles/cycle_1/evidence.md" "SOURCE_EVIDENCE_SHA256=$hash" \
    'VALIDATION_REQUIRED=npm_run_validate' 'BUGFIX_MODE_NOOP_SUCCESS_ALLOWED=no' 'BUGFIX_MODE_AUTOMATION_MAINTENANCE_ALLOWED=no' 'ALLOWED_PROTECTED_FILES=none' \
    "RUN_DIR=$run" 'WRITTEN_AT=2026-01-01T00:00:00Z'
  automation_v2_add_or_verify_fingerprint "$repo/.automation/autonomous-implementation-handover.env" >/dev/null
  printf 'HANDOVER_AUTONOMOUS_IMPLEMENTATION=yes\n' > "$cycle/continue_status.txt"
  printf 'BUGS_FOUND=yes\nHANDOVER_AUTONOMOUS_IMPLEMENTATION_REQUIRED=yes\nNEXT_AUDIT_AREA=none\nCAMPAIGN_AREA=%s\nCAMPAIGN_AREA_COMPLETE=no\nSOURCE_EVIDENCE_COMPLETE=yes\nBUG_IDS=STUB-1\nIMPLEMENTATION_SCOPE=fix_stub\nBUGFIX_MODE_AUTOMATION_MAINTENANCE_ALLOWED=no\nALLOWED_PROTECTED_FILES=none\n' "$area" > "$cycle/request_flags.txt"
  rc=2; status='HANDOVER_AUTONOMOUS_IMPLEMENTATION=yes'; reason=stub_bug
else
  printf 'BUGFIX_AUDIT_COMPLETE=yes\n' > "$cycle/continue_status.txt"
  printf 'BUGS_FOUND=no\nHANDOVER_AUTONOMOUS_IMPLEMENTATION_REQUIRED=no\nNEXT_AUDIT_AREA=none\nCAMPAIGN_AREA=%s\nCAMPAIGN_AREA_COMPLETE=yes\nSOURCE_EVIDENCE_COMPLETE=yes\nBUG_IDS=none\nIMPLEMENTATION_SCOPE=none\nBUGFIX_MODE_AUTOMATION_MAINTENANCE_ALLOWED=no\nALLOWED_PROTECTED_FILES=none\n' "$area" > "$cycle/request_flags.txt"
  rc=0; status='BUGFIX_AUDIT_COMPLETE=yes'; reason=stub_clean
fi
printf 'run_dir=%s\nfinal_status=%s\nstop_reason=%s\nfinal_exit_code=%s\ncycles_completed=1\n' "$run" "$status" "$reason" "$rc"
exit "$rc"
`);
    writeExecutable(join(repo, 'run-autonomous-implementation.sh'), `#!/usr/bin/env bash
set -Eeuo pipefail
repo=""; while [[ $# -gt 0 ]]; do case "$1" in --repo-dir) repo="$2"; shift 2;; *) shift;; esac; done
printf '%s\n' "\${TELEGRAM_NOTIFY:-unset}" >> "$repo/artifacts/stub-child-telegram-values"
. "$repo/.automation/lib/controller_hardening_v2.sh"
automation_v2_load_env_strict "$repo/.automation/autonomous-implementation-handover.env"
source_fp="\${AUTOMATION_V2_ENV[HANDOVER_FINGERPRINT]}"; area="\${AUTOMATION_V2_ENV[AUDIT_AREA]}"; bugs="\${AUTOMATION_V2_ENV[BUG_IDS]}"
echo fixed > "$repo/fixed.txt"
run="$repo/artifacts/autonomous_implementation_stub"; mkdir -p "$run"
automation_v2_write_env_atomic "$repo/.automation/bugfix-mode-handover.env" \
  'HANDOVER_SCHEMA_VERSION=1' 'HANDOVER_KIND=bugfix-mode-after-autonomous-implementation' 'REPOSITORY=betting-win-surebet' 'CONTROLLER=stub' \
  "SOURCE_HANDOFF_FINGERPRINT=$source_fp" 'RUN_BUGFIX_AUDIT_NEXT=yes' 'AUTONOMOUS_FINAL_STATUS=AUTONOMOUS_GOAL_COMPLETE=yes' \
  'AUTONOMOUS_STOP_REASON=stub_fixed' 'AUTONOMOUS_FINAL_EXIT_CODE=0' 'IMPLEMENTATION_SOURCE_CHANGED=yes' 'IMPLEMENTATION_SOURCE_VALIDATION_PASSED=yes' \
  'PRIVATE_PAPER_REEVALUATION_REQUIRED=no' 'BUGFIX_REAUDIT_REQUIRED=yes' "AUDIT_AREA=$area" "BUG_IDS=$bugs" \
  'PAPER_SERVICE_SUPPORTED=0' 'SERVICE_REFRESH_REQUIRED=0' 'RUNTIME_EVIDENCE_REQUIRED=0' 'REAL_UPSTREAM_EVALUATION=blocked_on_required_upstream_input' \
  "RUN_DIR=$run" 'WRITTEN_AT=2026-01-01T00:00:00Z'
automation_v2_add_or_verify_fingerprint "$repo/.automation/bugfix-mode-handover.env" >/dev/null
printf 'run_dir=%s\nfinal_status=AUTONOMOUS_GOAL_COMPLETE=yes\nstop_reason=stub_fixed\nfinal_exit_code=0\ncycles_completed=1\n' "$run"
`);
    const result = spawnSync('bash', ['./run-bugfix-autopilot.sh', '--duration', '120', '--bugfix-duration', '30', '--implementation-duration', '30', '--max-rounds', '3', '--max-same-handoff', '2', '--model', 'cli-default', '--fallback-model', 'none', '--no-stream'], {
      cwd: repo,
      env: {
        ...process.env,
        TELEGRAM_NOTIFY: '1',
        TELEGRAM_NOTIFY_DRY_RUN: '1',
        TELEGRAM_NOTIFICATION_SENT: '0',
        TELEGRAM_BOT_TOKEN: 'dummy-token',
        TELEGRAM_CHAT_ID: 'dummy-chat',
      },
      encoding: 'utf8',
      timeout: 30000,
    });
    assert.equal(result.status, 3, `${result.stdout}\n${result.stderr}`);
    const runLine = result.stdout.split(/\r?\n/).find((line) => line.startsWith('run_dir='));
    assert.ok(runLine);
    const runDir = runLine!.slice('run_dir='.length);
    const ledger = readFileSync(join(runDir, 'campaign_coverage.tsv'), 'utf8');
    assert.match(ledger, /1\tboundary_and_input_contracts\tclosed\tbugfix/);
    const rounds = readFileSync(join(runDir, 'rounds.tsv'), 'utf8');
    assert.match(rounds, /next_autonomous_implementation/);
    assert.match(rounds, /next_same_area_bugfix_reaudit/);
    assert.match(rounds, /campaign_area_closed\tnone\tboundary_and_input_contracts\tclosed/);
    assert.equal(existsSync(join(repo, 'fixed.txt')), true);
    const childTelegramValues = readFileSync(join(repo, 'artifacts', 'stub-child-telegram-values'), 'utf8')
      .trim().split(/\r?\n/);
    assert.deepEqual(childTelegramValues, ['0', '0', '0']);
    assert.match(readFileSync(join(runDir, 'telegram_notification_status.txt'), 'utf8'), /telegram_notification=dry_run/);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('bugfix autopilot blocks an audit child that mutates source', () => {
  const repo = prepareTempRepo();
  try {
    writeExecutable(join(repo, 'run-autonomous-bugfix.sh'), `#!/usr/bin/env bash
set -Eeuo pipefail
repo=""; while [[ $# -gt 0 ]]; do case "$1" in --repo-dir) repo="$2"; shift 2;; *) shift;; esac; done
echo unsafe > "$repo/unexpected-source-change.txt"
run="$repo/artifacts/autonomous_bugfix_mutating_stub"; mkdir -p "$run"
printf 'run_dir=%s\nfinal_status=BUGFIX_AUDIT_COMPLETE=yes\nstop_reason=stub_clean\nfinal_exit_code=0\ncycles_completed=1\n' "$run"
`);
    writeExecutable(join(repo, 'run-autonomous-implementation.sh'), `#!/usr/bin/env bash
exit 99
`);
    const result = spawnSync('bash', ['./run-bugfix-autopilot.sh', '--duration', '60', '--bugfix-duration', '30', '--implementation-duration', '30', '--max-rounds', '1', '--model', 'cli-default', '--fallback-model', 'none', '--no-stream'], {
      cwd: repo,
      env: { ...process.env, TELEGRAM_NOTIFY: '0' },
      encoding: 'utf8',
      timeout: 20000,
    });
    assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /final_status=BUGFIX_AUTOPILOT_BLOCKED_AUDIT_CHILD/);
    assert.match(result.stdout, /stop_reason=bugfix_child_mutated_source/);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
