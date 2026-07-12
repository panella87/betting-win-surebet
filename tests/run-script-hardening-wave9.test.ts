import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = process.cwd();

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

interface HarnessResult {
  status: number | null;
  stdout: string;
  stderr: string;
  summary: string;
  telegram: string;
  zipCount: string;
  releaseCalled: boolean;
}

function copyHelpers(repo: string): void {
  mkdirSync(join(repo, '.automation', 'lib'), { recursive: true });
  for (const helper of ['run_common.sh', 'controller_hardening_v2.sh', 'telegram_notify.sh']) {
    copyFileSync(join(ROOT, '.automation', 'lib', helper), join(repo, '.automation', 'lib', helper));
  }
}

function runBugfixAutopilotFinalizer(childCleanupRc: number, releaseRc: number): HarnessResult {
  const repo = mkdtempSync(join(tmpdir(), 'surebet-wave9-bugfix-parent-finalizer-'));
  const runDir = join(repo, 'artifacts', 'bugfix_autopilot_test');
  const lockFile = join(repo, '.automation', 'locks', 'run-bugfix-autopilot.lock');
  const campaignLedger = join(runDir, 'campaign_coverage.tsv');
  try {
    copyHelpers(repo);
    mkdirSync(runDir, { recursive: true });
    mkdirSync(join(repo, '.automation', 'locks'), { recursive: true });
    writeFileSync(lockFile, 'test-lock\n');
    writeFileSync(campaignLedger, 'area\tdescription\tstatus\tlast_child\tlast_handoff_fingerprint\tnotes\n');
    const source = readFileSync(join(ROOT, 'run-bugfix-autopilot.sh'), 'utf-8');
    const mainStart = source.indexOf('parse_args "$@"');
    assert.ok(mainStart > 0);
    const prefix = source.slice(0, mainStart);
    const harness = `
AUTOMATION_REPO_ROOT=${shellQuote(repo)}
AUTOMATION_RUN_DIR=${shellQuote(runDir)}
AUTOMATION_CONTROLLER_LOG=${shellQuote(join(runDir, 'controller.log'))}
LOCK_FILE=${shellQuote(lockFile)}
LOCK_ACQUIRED=1
HEARTBEAT_PID=
FINISHED=0
FINAL_STATUS=BUGFIX_AUTOPILOT_COMPLETE
STOP_REASON=all_campaign_areas_closed
ROUNDS_COMPLETED=8
LAST_CHILD=bugfix
LAST_CHILD_RC=0
LAST_CHILD_STATUS=BUGFIX_AUDIT_COMPLETE=yes
LAST_CHILD_STOP_REASON=audit_area_complete
LAST_CHILD_RUN_DIR=${shellQuote(join(repo, 'artifacts', 'autonomous_bugfix_child'))}
LAST_CHILD_SOURCE_CHANGED=no
CAMPAIGN_ACTIVE_AREA=none
CAMPAIGN_LEDGER=${shellQuote(campaignLedger)}
LAST_BUG_SIGNATURE=none
LAST_BUG_SIGNATURE_COUNT=0
ZIP_TIMEOUT_SECONDS=1
terminate_active_child() { return ${childCleanupRc}; }
release_parent_lock() { printf called > ${shellQuote(join(runDir, 'release-called'))}; return ${releaseRc}; }
automation_collect_repo_snapshot() { :; }
build_artifacts_zip_bounded() { printf x >> ${shellQuote(join(runDir, 'zip-count'))}; return 0; }
telegram_notify_send_final() { printf '%s|%s|%s\n' "$3" "$4" "$6" > ${shellQuote(join(runDir, 'telegram'))}; }
finish 0
`;
    const scriptPath = join(repo, 'run-bugfix-autopilot.sh');
    writeFileSync(scriptPath, `${prefix}${harness}`, 'utf-8');
    chmodSync(scriptPath, 0o755);
    const result = spawnSync('bash', [scriptPath], { encoding: 'utf-8' });
    return {
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      summary: readFileSync(join(runDir, 'final_summary.txt'), 'utf-8'),
      telegram: readFileSync(join(runDir, 'telegram'), 'utf-8'),
      zipCount: readFileSync(join(runDir, 'zip-count'), 'utf-8'),
      releaseCalled: existsSync(join(runDir, 'release-called')),
    };
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
}

test('bugfix autopilot uses a complete atomic parent-lock claim before campaign artifact creation', () => {
  const script = readFileSync(join(ROOT, 'run-bugfix-autopilot.sh'), 'utf-8');
  assert.match(script, /claim_parent_lock\(\)/);
  assert.match(script, /automation_v2_claim_env_lock_atomic "\$LOCK_FILE"/);
  assert.match(script, /bugfix autopilot lock was acquired concurrently/);
  assert.doesNotMatch(script, /set -o noclobber; : > "\$LOCK_FILE"/);
  const main = script.slice(script.indexOf('parse_args "$@"'));
  const acquire = main.indexOf('acquire_parent_lock');
  const create = main.indexOf('automation_create_run_dir bugfix_autopilot');
  assert.ok(acquire >= 0 && create > acquire);
  assert.match(script, /atomic_parent_lock_acquisition=enabled/);
});

test('bugfix autopilot child identity failure is terminal, preserves the lock, and skips release', () => {
  const result = runBugfixAutopilotFinalizer(2, 0);
  assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
  assert.equal(result.releaseCalled, false);
  assert.match(result.stdout, /^final_status=BUGFIX_AUTOPILOT_BLOCKED_CHILD_IDENTITY$/m);
  assert.match(result.stdout, /^stop_reason=active_child_identity_or_termination_failed$/m);
  assert.match(result.stdout, /^child_cleanup_status=identity_or_termination_failed$/m);
  assert.match(result.stdout, /^lock_release_status=preserved_due_to_child_cleanup_failure$/m);
  assert.match(result.stdout, /^lock_preserved=yes$/m);
  assert.match(result.summary, /^final_status=BUGFIX_AUTOPILOT_BLOCKED_CHILD_IDENTITY$/m);
  assert.equal(result.telegram, 'BUGFIX_AUTOPILOT_BLOCKED_CHILD_IDENTITY|active_child_identity_or_termination_failed|2\n');
  assert.equal(result.zipCount.length, 1);
});

test('bugfix autopilot lock-release failure corrects success before Telegram', () => {
  const result = runBugfixAutopilotFinalizer(0, 2);
  assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
  assert.equal(result.releaseCalled, true);
  assert.match(result.stdout, /^final_status=BUGFIX_AUTOPILOT_BLOCKED_LOCK_RELEASE$/m);
  assert.match(result.stdout, /^stop_reason=lock_release_failed_lock_preserved$/m);
  assert.match(result.stdout, /^lock_release_status=preserved$/m);
  assert.match(result.stdout, /^lock_release_exit_code=2$/m);
  assert.match(result.stdout, /^lock_preserved=yes$/m);
  assert.match(result.summary, /^final_status=BUGFIX_AUTOPILOT_BLOCKED_LOCK_RELEASE$/m);
  assert.equal(result.telegram, 'BUGFIX_AUTOPILOT_BLOCKED_LOCK_RELEASE|lock_release_failed_lock_preserved|2\n');
  assert.equal(result.zipCount.length, 2);
});

test('bugfix autopilot successful child cleanup and lock release remain visible', () => {
  const result = runBugfixAutopilotFinalizer(0, 0);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /^final_status=BUGFIX_AUTOPILOT_COMPLETE$/m);
  assert.match(result.stdout, /^child_cleanup_status=complete$/m);
  assert.match(result.stdout, /^lock_release_status=released$/m);
  assert.match(result.stdout, /^lock_preserved=no$/m);
  assert.match(result.summary, /^lock_release_status=released$/m);
  assert.equal(result.zipCount.length, 1);
});

test('shared parent-lock helper claims a complete file atomically and permits one winner', () => {
  const repo = mkdtempSync(join(tmpdir(), 'surebet-wave9-parent-lock-'));
  try {
    copyHelpers(repo);
    mkdirSync(join(repo, '.automation', 'locks'), { recursive: true });
    const helper = join(repo, '.automation', 'lib', 'controller_hardening_v2.sh');
    const lock = join(repo, '.automation', 'locks', 'parent.lock');
    const harness = `
. ${shellQuote(helper)}
claim() {
  automation_v2_claim_env_lock_atomic ${shellQuote(lock)} \
    'LOCK_SCHEMA_VERSION=1' 'CONTROLLER=test-parent.sh' "CONTROLLER_PID=$$" \
    'REPOSITORY=betting-win-surebet' "REPO_REALPATH=${repo}" "SCRIPT_REALPATH=${repo}/test-parent.sh" \
    'RUN_DIR=' 'HEARTBEAT_EPOCH=1' 'HEARTBEAT_AT=2026-07-12T00:00:00Z' \
    'ACTIVE_CHILD_PID=' 'ACTIVE_CHILD_KIND=none' 'ACTIVE_CHILD_SCRIPT=' 'ACTIVE_CHILD_COMMAND='
}
( if claim; then echo 0; else echo $?; fi ) > ${shellQuote(join(repo, 'a'))} &
( if claim; then echo 0; else echo $?; fi ) > ${shellQuote(join(repo, 'b'))} &
wait
cat ${shellQuote(join(repo, 'a'))} ${shellQuote(join(repo, 'b'))} | sort
`;
    const result = spawnSync('bash', ['-c', harness], { encoding: 'utf-8' });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(result.stdout, '0\n1\n');
    const lockText = readFileSync(lock, 'utf-8');
    assert.match(lockText, /^LOCK_SCHEMA_VERSION=1$/m);
    assert.match(lockText, /^CONTROLLER=test-parent\.sh$/m);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('shared parent process terminator waits after KILL and verifies exit', () => {
  const repo = mkdtempSync(join(tmpdir(), 'surebet-wave9-process-exit-'));
  let child: ReturnType<typeof spawn> | undefined;
  try {
    copyHelpers(repo);
    child = spawn('setsid', ['bash', '-c', 'trap "" TERM; while true; do sleep 1; done'], { stdio: 'ignore' });
    assert.ok(child.pid);
    const helper = join(repo, '.automation', 'lib', 'controller_hardening_v2.sh');
    const result = spawnSync('bash', ['-c', `. ${shellQuote(helper)}; automation_v2_terminate_process_group ${child.pid} 1 2`], { encoding: 'utf-8', timeout: 10000 });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const verify = spawnSync('bash', ['-c', `. ${shellQuote(helper)}; automation_v2_pid_alive ${child.pid}`]);
    assert.notEqual(verify.status, 0);
  } finally {
    child?.kill('SIGKILL');
    rmSync(repo, { recursive: true, force: true });
  }
});


test('both parent heartbeats are responsive and cannot overwrite active-child lock state', () => {
  for (const filename of ['run-bugfix-autopilot.sh', 'run-paper-autopilot.sh']) {
    const script = readFileSync(join(ROOT, filename), 'utf-8');
    const start = script.indexOf('refresh_parent_lock_heartbeat()');
    const end = script.indexOf('\nacquire_parent_lock()', start);
    assert.ok(start >= 0 && end > start, filename);
    const refresh = script.slice(start, end);
    assert.match(refresh, /touch -m -- "\$LOCK_FILE"/, filename);
    assert.doesNotMatch(refresh, /automation_v2_write_loaded_env_atomic/, filename);
    assert.match(script, /HEARTBEAT_SOURCE=file_mtime/, filename);
    assert.match(script, /automation_v2_lock_mtime_epoch "\$LOCK_FILE"/, filename);
    assert.match(script, /responsive_parent_heartbeat=enabled/, filename);
    assert.match(script, /heartbeat_update_mode=file_mtime_no_state_rewrite/, filename);
    assert.doesNotMatch(script, /sleep "\$\{?AUTOMATION_LOCK_HEARTBEAT_SECONDS/, filename);
  }
});

test('shared lock mtime helper rejects symlinks and returns a numeric epoch', () => {
  const repo = mkdtempSync(join(tmpdir(), 'surebet-wave9-lock-mtime-'));
  try {
    copyHelpers(repo);
    const helper = join(repo, '.automation', 'lib', 'controller_hardening_v2.sh');
    const lock = join(repo, 'parent.lock');
    writeFileSync(lock, 'LOCK_SCHEMA_VERSION=1\n');
    const ok = spawnSync('bash', ['-c', `. ${shellQuote(helper)}; automation_v2_lock_mtime_epoch ${shellQuote(lock)}`], { encoding: 'utf-8' });
    assert.equal(ok.status, 0, `${ok.stdout}\n${ok.stderr}`);
    assert.match(ok.stdout.trim(), /^\d+$/);
    const link = join(repo, 'parent-link.lock');
    const linked = spawnSync('ln', ['-s', lock, link]);
    assert.equal(linked.status, 0);
    const bad = spawnSync('bash', ['-c', `. ${shellQuote(helper)}; automation_v2_lock_mtime_epoch ${shellQuote(link)}`], { encoding: 'utf-8' });
    assert.notEqual(bad.status, 0);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('bugfix autopilot force-unlock verifies controller exit before releasing ownership', () => {
  const script = readFileSync(join(ROOT, 'run-bugfix-autopilot.sh'), 'utf-8');
  assert.match(script, /kill -KILL "\$pid"/);
  assert.match(script, /automation_v2_wait_for_pid_exit "\$pid" 10/);
  assert.match(script, /verified controller PID remains alive/);
  assert.match(script, /if \[[^\n]+-e "\$LOCK_FILE"[^\n]+\]; then/);
  assert.match(script, /automation_v2_release_owned_env_lock "\$LOCK_FILE"/);
  assert.match(script, /verified_kill_escalation=enabled/);
});
