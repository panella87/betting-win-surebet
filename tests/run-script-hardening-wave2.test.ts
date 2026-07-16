import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = process.cwd();
const helper = join(ROOT, '.automation', 'lib', 'controller_hardening_v2.sh');

function shell(script: string, env: NodeJS.ProcessEnv = {}): string {
  return execFileSync('bash', ['-lc', script], {
    encoding: 'utf-8',
    env: { ...process.env, ...env },
  }).trim();
}

test('strict handoff parser rejects duplicate keys', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-handoff-duplicate-'));
  const file = join(dir, 'handoff.env');
  try {
    writeFileSync(file, 'HANDOVER_KIND=a\nHANDOVER_KIND=b\n', 'utf-8');
    const result = spawnSync('bash', ['-lc', '. "$HELPER"; automation_v2_load_env_strict "$FILE"'], {
      encoding: 'utf-8',
      env: { ...process.env, HELPER: helper, FILE: file },
    });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}${result.stderr}`, /duplicate key HANDOVER_KIND/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('semantic handoff fingerprint ignores volatile timestamps and run paths', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-handoff-fingerprint-'));
  const first = join(dir, 'first.env');
  const second = join(dir, 'second.env');
  try {
    writeFileSync(first, [
      'HANDOVER_KIND=paper-mode-to-autonomous-implementation',
      'REPOSITORY=betting-win-surebet',
      'PAPER_MODE_REQUIRED_ACTION=bounded_source_implementation',
      'RUN_DIR=/tmp/run-one',
      'WRITTEN_AT=2026-07-10T00:00:00Z',
      '',
    ].join('\n'));
    writeFileSync(second, [
      'HANDOVER_KIND=paper-mode-to-autonomous-implementation',
      'REPOSITORY=betting-win-surebet',
      'PAPER_MODE_REQUIRED_ACTION=bounded_source_implementation',
      'RUN_DIR=/tmp/run-two',
      'WRITTEN_AT=2026-07-11T00:00:00Z',
      '',
    ].join('\n'));
    const a = shell('. "$HELPER"; automation_v2_semantic_env_fingerprint "$FILE"', { HELPER: helper, FILE: first });
    const b = shell('. "$HELPER"; automation_v2_semantic_env_fingerprint "$FILE"', { HELPER: helper, FILE: second });
    assert.equal(a, b);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('controllers expose corrected wave-two defaults and handoff entrypoints', () => {
  const implementation = execFileSync('bash', [join(ROOT, 'run-autonomous-implementation.sh'), '--print-config'], { encoding: 'utf-8' });
  const autopilot = execFileSync('bash', [join(ROOT, 'run-paper-autopilot.sh'), '--print-config'], { encoding: 'utf-8' });
  assert.match(implementation, /handover_bugfix_audit=0/);
  assert.match(implementation, /baseline_validation=enabled/);
  assert.match(implementation, /machine_readable_final_stdout=enabled/);
  assert.match(autopilot, /max_rounds=0/);
  assert.match(autopilot, /semantic_handoff_fingerprints=enabled/);
  assert.match(autopilot, /explicit_child_result_contract=enabled/);
  assert.match(autopilot, /child_aware_lock=enabled/);
  assert.match(autopilot, /canonical_paper_handoff_required=enabled/);
  assert.match(autopilot, /legacy_paper_handoff_normalization=disabled/);
  assert.match(autopilot, /cross_controller_lock_guard=enabled/);
  assert.match(autopilot, /child_telegram_notifications=suppressed_by_parent/);
  assert.match(autopilot, /parent_telegram_notification=final_only/);
});

function writeExecutable(path: string, content: string): void {
  writeFileSync(path, content, 'utf-8');
  chmodSync(path, 0o755);
}

function makeStubRepo(noop: boolean): string {
  const repo = mkdtempSync(join(tmpdir(), 'surebet-paper-autopilot-stub-'));
  mkdirSync(join(repo, '.automation', 'lib'), { recursive: true });
  mkdirSync(join(repo, 'artifacts'), { recursive: true });
  cpSync(join(ROOT, 'run-paper-autopilot.sh'), join(repo, 'run-paper-autopilot.sh'));
  cpSync(join(ROOT, '.automation', 'lib', 'run_common.sh'), join(repo, '.automation', 'lib', 'run_common.sh'));
  cpSync(join(ROOT, '.automation', 'lib', 'controller_hardening_v2.sh'), join(repo, '.automation', 'lib', 'controller_hardening_v2.sh'));
  cpSync(join(ROOT, '.automation', 'lib', 'telegram_notify.sh'), join(repo, '.automation', 'lib', 'telegram_notify.sh'));
  chmodSync(join(repo, 'run-paper-autopilot.sh'), 0o755);
  writeFileSync(join(repo, 'source.txt'), 'baseline\n', 'utf-8');
  writeFileSync(join(repo, 'automation.config.sh'), [
    'AUTOMATION_REPO_NAME=betting-win-surebet',
    'AUTOMATION_PROJECT_NAME=betting-win-surebet',
    'AUTOMATION_CODEX_SANDBOX=danger-full-access',
    'AUTOMATION_CODEX_STREAM_LOGS=0',
    'AUTOMATION_VALIDATION_TIMEOUT=20s',
    'AUTOMATION_INSTALL_TIMEOUT=20s',
    'AUTOMATION_ZIP_TIMEOUT=20s',
    'AUTOMATION_PAPER_CODEX_TIMEOUT=20s',
    'AUTOMATION_CODEX_CYCLE_TIMEOUT=20s',
    'AUTOMATION_PAPER_MAX_CYCLES=1',
    'AUTOMATION_MAX_CYCLES=2',
    'AUTOMATION_LOCK_HEARTBEAT_SECONDS=1',
    'AUTOMATION_LOCK_STALE_SECONDS=60',
    'AUTOMATION_GRACEFUL_UNLOCK_SECONDS=2',
    '',
  ].join('\n'));

  writeExecutable(join(repo, 'run-paper-evaluation.sh'), `#!/usr/bin/env bash
set -Eeuo pipefail
root="$(cd "$(dirname "$0")" && pwd -P)"
printf '%s\n' "\${TELEGRAM_NOTIFY:-unset}" >> "$root/artifacts/stub-child-telegram-values"
. "$root/.automation/lib/run_common.sh"
. "$root/.automation/lib/controller_hardening_v2.sh"
mkdir -p "$root/artifacts"
count_file="$root/artifacts/stub-paper-count"
count=0
[[ -f "$count_file" ]] && count="$(cat "$count_file")"
count=$((count + 1)); printf '%s\n' "$count" > "$count_file"
run_dir="$root/artifacts/paper_evaluation_20260711T00000\${count}Z"; mkdir -p "$run_dir"
if [[ "$count" == "1" ]]; then
  evidence="$run_dir/paper-implementation-handoff-evidence.md"
  printf 'stub source implementation evidence\n' > "$evidence"
  evidence_rel="\${evidence#$root/}"
  evidence_hash="$(automation_v2_sha256_file "$evidence")"
  source_hash="$(automation_v2_source_tree_fingerprint "$root")"
  automation_v2_write_env_atomic "$root/.automation/paper-mode-to-autonomous-implementation.env" \\
    "HANDOVER_SCHEMA_VERSION=1" \\
    "HANDOVER_KIND=paper-mode-to-autonomous-implementation" \\
    "REPOSITORY=betting-win-surebet" \\
    "CONTROLLER=run-paper-evaluation.sh" \\
    "SOURCE_RUN_ID=$(basename "$run_dir")" \\
    "RUN_AUTONOMOUS_IMPLEMENTATION_NEXT=yes" \\
    "AUTONOMOUS_IMPLEMENTATION_EXPECTED_FLAG=--handover-paper-mode" \\
    "PAPER_MODE_FINAL_STATUS=PAPER_EVALUATION_BLOCKED_SOURCE_FIX_REQUIRED" \\
    "PAPER_MODE_STOP_REASON=stub_source_fix_required" \\
    "PAPER_MODE_FINAL_EXIT_CODE=2" \\
    "PAPER_MODE_RESUME_AFTER_IMPLEMENTATION=yes" \\
    "PAPER_MODE_NOOP_SUCCESS_ALLOWED=no" \\
    "PAPER_MODE_REQUIRED_ACTION=bounded_source_implementation" \\
    "PAPER_MODE_BLOCKER_FAMILY=source" \\
    "PAPER_MODE_EXPECTED_PRIVATE_PAPER_REEVALUATION_AFTER_SOURCE_CHANGE=yes" \\
    "PAPER_MODE_AUTOMATION_MAINTENANCE_ALLOWED=no" \\
    "ALLOWED_PROTECTED_FILES=none" \\
    "PAPER_SERVICE_SUPPORTED=1" \\
    "SERVICE_REFRESH_REQUIRED=1" \\
    "RUNTIME_EVIDENCE_REQUIRED=1" \\
    "RUNTIME_EVIDENCE_SELECTED_UPSTREAM_MODE=\${BWS_UPSTREAM_MODE:-api}" \\
    "RUNTIME_EVIDENCE_CAMPAIGN_RUN_ID=\${AUTOMATION_PARENT_RUN_ID:-none}" \\
    "PINNED_BUNDLE_REQUIRED=0" \\
    "SUREBET_PINNED_BUNDLE=" \\
    "HANDOFF_REASON=stub_source_fix_required" \\
    "PAPER_SOURCE_FINGERPRINT=$source_hash" \\
    "SOURCE_EVIDENCE_PATH=$evidence_rel" \\
    "SOURCE_EVIDENCE_SHA256=$evidence_hash" \\
    "VALIDATION_REQUIRED=npm_run_validate" \\
    "RUN_DIR=$run_dir" \\
    "WRITTEN_AT=2026-07-11T00:00:00Z"
  automation_v2_add_or_verify_fingerprint "$root/.automation/paper-mode-to-autonomous-implementation.env" >/dev/null
  status=PAPER_EVALUATION_BLOCKED_SOURCE_FIX_REQUIRED; reason=stub_source_fix_required; rc=2
else
  status=PAPER_EVALUATION_READY_RUNTIME_EVIDENCE_LOCAL_ONLY; reason=runtime_window_ready_local_only; rc=0
fi
printf 'final_status=STALE_NESTED_STATUS\nstop_reason=stale_nested_reason\n'
automation_v2_publish_child_result "$root" 'run-paper-evaluation.sh' 'stub-paper-v1' "$run_dir" "$status" "$reason" "$rc" 1 not_acquired 0 no
printf 'run_dir=%s\nfinal_status=%s\nstop_reason=%s\nfinal_exit_code=%s\ncycles_completed=1\n' "$run_dir" "$status" "$reason" "$rc"
exit "$rc"
`);

  writeExecutable(join(repo, 'run-autonomous-implementation.sh'), `#!/usr/bin/env bash
set -Eeuo pipefail
root="$(cd "$(dirname "$0")" && pwd -P)"
printf '%s\n' "\${TELEGRAM_NOTIFY:-unset}" >> "$root/artifacts/stub-child-telegram-values"
. "$root/.automation/lib/controller_hardening_v2.sh"
run_dir="$root/artifacts/autonomous_implementation_20260711T000003Z"; mkdir -p "$run_dir"
source_fp="$(awk -F= '$1 == "HANDOVER_FINGERPRINT" {print $2}' "$root/.automation/paper-mode-to-autonomous-implementation.env")"
changed=yes
if [[ "${noop ? '1' : '0'}" == "1" ]]; then changed=no; else printf 'implemented\n' >> "$root/source.txt"; fi
automation_v2_write_env_atomic "$root/.automation/paper-mode-handover.env" \\
  "HANDOVER_SCHEMA_VERSION=1" \\
  "HANDOVER_KIND=paper-mode-after-autonomous-implementation" \\
  "REPOSITORY=betting-win-surebet" \\
  "CONTROLLER=run-autonomous-implementation.sh" \\
  "SOURCE_HANDOFF_FINGERPRINT=$source_fp" \\
  "RUN_PAPER_EVALUATION_NEXT=yes" \\
  "AUTONOMOUS_FINAL_STATUS=AUTONOMOUS_GOAL_COMPLETE=yes" \\
  "AUTONOMOUS_STOP_REASON=goal_complete" \\
  "AUTONOMOUS_FINAL_EXIT_CODE=0" \\
  "IMPLEMENTATION_SOURCE_CHANGED=$changed" \\
  "IMPLEMENTATION_SOURCE_VALIDATION_PASSED=yes" \\
  "PRIVATE_PAPER_REEVALUATION_REQUIRED=yes" \\
  "BUGFIX_REAUDIT_REQUIRED=yes" \\
  "AUDIT_AREA=none" \\
  "BUG_IDS=none" \\
  "PAPER_SERVICE_SUPPORTED=1" \\
  "SERVICE_REFRESH_REQUIRED=1" \\
  "RUNTIME_EVIDENCE_REQUIRED=1" \\
  "RUNTIME_EVIDENCE_SELECTED_UPSTREAM_MODE=api" \\
  "RUNTIME_EVIDENCE_CAMPAIGN_RUN_ID=\${AUTOMATION_PARENT_RUN_ID:-none}" \\
  "REAL_UPSTREAM_EVALUATION=blocked_on_required_upstream_input" \\
  "RUN_DIR=$run_dir" \\
  "WRITTEN_AT=2026-07-11T00:00:00Z"
automation_v2_add_or_verify_fingerprint "$root/.automation/paper-mode-handover.env" >/dev/null
printf 'final_status=PAPER_EVALUATION_BLOCKED_SOURCE_FIX_REQUIRED\nstop_reason=stale_prompt_evidence\n'
automation_v2_publish_child_result "$root" 'run-autonomous-implementation.sh' 'stub-implementation-v1' "$run_dir" 'AUTONOMOUS_GOAL_COMPLETE=yes' 'goal_complete' 0 1 not_acquired 0 no
printf 'run_dir=%s\nfinal_status=AUTONOMOUS_GOAL_COMPLETE=yes\nstop_reason=goal_complete\nfinal_exit_code=0\ncycles_completed=1\n' "$run_dir"
`);
  return repo;
}

function runStubAutopilot(repo: string): ReturnType<typeof spawnSync> {
  return spawnSync('bash', [join(repo, 'run-paper-autopilot.sh'),
    '--repo-dir', repo,
    '--duration', '60',
    '--paper-duration', '20',
    '--implementation-duration', '20',
    '--max-rounds', '0',
    '--max-same-handoff', '2',
    '--no-stream',
    '--model', 'cli-default',
    '--fallback-model', 'none',
  ], {
    encoding: 'utf-8',
    env: {
      ...process.env,
      TELEGRAM_NOTIFY: '1',
      TELEGRAM_NOTIFY_DRY_RUN: '1',
      TELEGRAM_NOTIFICATION_SENT: '0',
      TELEGRAM_BOT_TOKEN: 'dummy-token',
      TELEGRAM_CHAT_ID: 'dummy-chat',
      BWS_UPSTREAM_MODE: 'api',
    },
  });
}

test('paper autopilot consumes a verified implementation handoff and re-evaluates paper', () => {
  const repo = makeStubRepo(false);
  try {
    const result = runStubAutopilot(repo);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(String(result.stdout), /final_status=PAPER_AUTOPILOT_READY_RUNTIME_EVIDENCE_LOCAL_ONLY/);
    assert.match(String(result.stdout), /rounds_completed=3/);
    assert.doesNotMatch(String(result.stdout), /PAPER_AUTOPILOT_BLOCKED_CHILD_RESULT/);
    assert.equal(existsSync(join(repo, '.automation', 'paper-mode-to-autonomous-implementation.env')), false);
    assert.equal(existsSync(join(repo, '.automation', 'paper-mode-handover.env')), false);
    assert.match(readFileSync(join(repo, 'source.txt'), 'utf-8'), /implemented/);
    const childTelegramValues = readFileSync(join(repo, 'artifacts', 'stub-child-telegram-values'), 'utf-8')
      .trim().split(/\r?\n/);
    assert.deepEqual(childTelegramValues, ['0', '0', '0']);
    const parentRunDir = String(result.stdout).split(/\r?\n/)
      .find((line) => line.startsWith('run_dir='))!.slice('run_dir='.length);
    assert.match(readFileSync(join(parentRunDir, 'telegram_notification_status.txt'), 'utf-8'), /telegram_notification=dry_run/);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('paper autopilot blocks a no-op implementation for an active handoff', () => {
  const repo = makeStubRepo(true);
  try {
    const result = runStubAutopilot(repo);
    assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
    assert.match(String(result.stdout), /final_status=PAPER_AUTOPILOT_BLOCKED_IMPLEMENTATION_NOOP/);
    assert.match(String(result.stdout), /stop_reason=implementation_noop_for_active_handoff/);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
