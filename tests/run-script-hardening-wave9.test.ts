import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
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

function runBash(script: string, cwd = ROOT): ReturnType<typeof spawnSync> {
  return spawnSync('bash', ['-lc', script], { cwd, encoding: 'utf-8' });
}

interface FinalizerResult {
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

function runBugfixAutopilotFinalizer(childCleanupRc: number, releaseRc: number): FinalizerResult {
  const repo = mkdtempSync(join(tmpdir(), 'surebet-wave9-bugfix-finalizer-'));
  const runDir = join(repo, 'artifacts', 'bugfix_autopilot_test');
  const lockFile = join(repo, '.automation', 'locks', 'run-bugfix-autopilot.lock');
  const ledger = join(runDir, 'campaign_coverage.tsv');
  try {
    copyHelpers(repo);
    mkdirSync(runDir, { recursive: true });
    mkdirSync(join(repo, '.automation', 'locks'), { recursive: true });
    writeFileSync(lockFile, 'test-lock\n');
    writeFileSync(ledger, 'ordinal\tarea\tstatus\n1\ttest\tclosed\n');
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
LAST_CHILD_STATUS=BUGFIX_AUDIT_COMPLETE
LAST_CHILD_STOP_REASON=campaign_area_complete
LAST_CHILD_RUN_DIR=${shellQuote(join(repo, 'artifacts', 'autonomous_bugfix_child'))}
LAST_CHILD_SOURCE_CHANGED=no
CAMPAIGN_ACTIVE_AREA=cross_area_regression_and_campaign_closure
CAMPAIGN_LEDGER=${shellQuote(ledger)}
LAST_BUG_SIGNATURE=none
LAST_BUG_SIGNATURE_COUNT=0
terminate_active_child() { return ${childCleanupRc}; }
release_parent_lock() { printf called > ${shellQuote(join(runDir, 'release-called'))}; return ${releaseRc}; }
automation_collect_repo_snapshot() { :; }
build_artifacts_zip_bounded() { printf x >> ${shellQuote(join(runDir, 'zip-count'))}; return 0; }
automation_refresh_final_artifacts_zip() { printf r >> ${shellQuote(join(runDir, 'zip-count'))}; return 0; }
telegram_notify_send_final() { printf '%s|%s|%s\\n' "$3" "$4" "$6" > ${shellQuote(join(runDir, 'telegram'))}; }
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

test('shared parent-lock helper claims a complete file atomically and exactly one claimant wins', () => {
  const repo = mkdtempSync(join(tmpdir(), 'surebet-wave9-parent-claim-'));
  try {
    const helper = join(ROOT, '.automation', 'lib', 'controller_hardening_v2.sh');
    const lockFile = join(repo, 'parent.lock');
    const result = runBash(`
. ${shellQuote(helper)}
claim() {
  automation_v2_claim_env_file_atomic ${shellQuote(lockFile)} \\
    LOCK_SCHEMA_VERSION=1 CONTROLLER=dummy.sh CONTROLLER_PID=$$ REPOSITORY=test \\
    REPO_REALPATH=${shellQuote(repo)} SCRIPT_REALPATH=${shellQuote(join(repo, 'dummy.sh'))} \\
    RUN_DIR= HEARTBEAT_SOURCE=file_mtime HEARTBEAT_EPOCH=1 HEARTBEAT_AT=now \\
    ACTIVE_CHILD_PID= ACTIVE_CHILD_KIND=none ACTIVE_CHILD_SCRIPT= ACTIVE_CHILD_COMMAND=
}
( if claim; then echo 0; else echo $?; fi ) > ${shellQuote(join(repo, 'a'))} &
( if claim; then echo 0; else echo $?; fi ) > ${shellQuote(join(repo, 'b'))} &
wait
`);
    assert.equal(result.status, 0, String(result.stderr));
    const codes = [readFileSync(join(repo, 'a'), 'utf-8').trim(), readFileSync(join(repo, 'b'), 'utf-8').trim()].sort();
    assert.deepEqual(codes, ['0', '1']);
    const lock = readFileSync(lockFile, 'utf-8');
    assert.match(lock, /^LOCK_SCHEMA_VERSION=1$/m);
    assert.match(lock, /^HEARTBEAT_SOURCE=file_mtime$/m);
    assert.ok(lock.length > 100);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('both parent controllers use atomic claims before run creation', () => {
  for (const name of ['run-paper-autopilot.sh', 'run-bugfix-autopilot.sh']) {
    const script = readFileSync(join(ROOT, name), 'utf-8');
    const main = script.slice(script.indexOf('parse_args "$@"'));
    const acquire = main.indexOf('acquire_parent_lock');
    const create = main.indexOf('automation_create_run_dir');
    assert.ok(acquire >= 0 && create > acquire, name);
    assert.match(script, /automation_v2_claim_env_file_atomic/);
    assert.doesNotMatch(script, /noclobber;\s*:\s*>\s*"\$LOCK_FILE"/);
    assert.match(script, /atomic_parent_lock_acquisition=enabled/);
  }
});

test('both parent heartbeats update only file mtime and poll shutdown once per second', () => {
  for (const name of ['run-paper-autopilot.sh', 'run-bugfix-autopilot.sh']) {
    const script = readFileSync(join(ROOT, name), 'utf-8');
    const start = script.indexOf('refresh_parent_lock_heartbeat() {');
    const end = script.indexOf('start_parent_lock_heartbeat() {', start);
    const refresh = script.slice(start, end);
    assert.match(refresh, /automation_v2_touch_owned_parent_lock/);
    assert.doesNotMatch(refresh, /automation_v2_write_loaded_env_atomic|write_parent_lock_file/);
    assert.match(script, /HEARTBEAT_SOURCE=file_mtime/);
    assert.match(script, /sleep 1/);
    assert.match(script, /parent_lock_mtime_heartbeat=enabled/);
  }
});

test('mtime heartbeat cannot erase newer active-child metadata', () => {
  const repo = mkdtempSync(join(tmpdir(), 'surebet-wave9-heartbeat-body-'));
  try {
    const helper = join(ROOT, '.automation', 'lib', 'controller_hardening_v2.sh');
    const controller = join(repo, 'parent.sh');
    const child = join(repo, 'child.sh');
    const lock = join(repo, 'parent.lock');
    writeFileSync(controller, '#!/usr/bin/env bash\n');
    writeFileSync(child, '#!/usr/bin/env bash\n');
    chmodSync(controller, 0o755);
    chmodSync(child, 0o755);
    const result = runBash(`
. ${shellQuote(helper)}
write_lock() {
  automation_v2_write_env_atomic ${shellQuote(lock)} \\
    LOCK_SCHEMA_VERSION=1 CONTROLLER=parent.sh CONTROLLER_PID=$$ REPOSITORY=test \\
    REPO_REALPATH=${shellQuote(repo)} SCRIPT_REALPATH=${shellQuote(controller)} RUN_DIR= \\
    HEARTBEAT_SOURCE=file_mtime HEARTBEAT_EPOCH=1 HEARTBEAT_AT=now \\
    ACTIVE_CHILD_PID="$1" ACTIVE_CHILD_KIND="$2" ACTIVE_CHILD_SCRIPT="$3" ACTIVE_CHILD_COMMAND="$4"
}
write_lock '' none '' ''
(
  for _ in $(seq 1 30); do
    automation_v2_touch_owned_parent_lock ${shellQuote(lock)} parent.sh test ${shellQuote(repo)} ${shellQuote(controller)} $$ || exit 2
    sleep 0.02
  done
) & hb=$!
sleep 0.05
write_lock 98765 implementation ${shellQuote(child)} 'bash child.sh'
wait "$hb"
grep -Fx 'ACTIVE_CHILD_PID=98765' ${shellQuote(lock)}
grep -Fx 'ACTIVE_CHILD_KIND=implementation' ${shellQuote(lock)}
grep -Fx 'ACTIVE_CHILD_SCRIPT=${child}' ${shellQuote(lock)}
`);
    assert.equal(result.status, 0, String(result.stderr));
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('shared process liveness treats an exited unreaped child as not alive', () => {
  const helper = join(ROOT, '.automation', 'lib', 'controller_hardening_v2.sh');
  const result = runBash(`
. ${shellQuote(helper)}
( exit 0 ) & pid=$!
sleep 0.2
if automation_v2_process_alive "$pid"; then
  echo unexpected_alive >&2
  exit 1
fi
wait "$pid" 2>/dev/null || true
`);
  assert.equal(result.status, 0, String(result.stderr));
});

test('shared process-group termination verifies exit after KILL escalation', () => {
  const repo = mkdtempSync(join(tmpdir(), 'surebet-wave9-kill-verify-'));
  try {
    const helper = join(ROOT, '.automation', 'lib', 'controller_hardening_v2.sh');
    const stubborn = join(repo, 'stubborn.sh');
    writeFileSync(stubborn, '#!/usr/bin/env bash\ntrap "" TERM\nwhile :; do sleep 1; done\n');
    chmodSync(stubborn, 0o755);
    const result = runBash(`
. ${shellQuote(helper)}
setsid bash ${shellQuote(stubborn)} & pid=$!
sleep 0.2
automation_v2_terminate_process_group "$pid" 1
if automation_v2_process_alive "$pid"; then
  echo still_alive >&2
  exit 1
fi
wait "$pid" 2>/dev/null || true
`);
    assert.equal(result.status, 0, String(result.stderr));
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('bugfix parent child cleanup failure is terminal and preserves the lock', () => {
  const result = runBugfixAutopilotFinalizer(2, 0);
  assert.equal(result.status, 2, result.stderr);
  assert.equal(result.releaseCalled, false);
  assert.match(result.stdout, /^final_status=BUGFIX_AUTOPILOT_BLOCKED_CHILD_IDENTITY$/m);
  assert.match(result.stdout, /^stop_reason=active_child_identity_or_termination_failed$/m);
  assert.match(result.stdout, /^child_cleanup_status=identity_or_termination_failed$/m);
  assert.match(result.stdout, /^lock_release_status=preserved_due_to_child_cleanup_failure$/m);
  assert.match(result.stdout, /^lock_preserved=yes$/m);
  assert.match(result.summary, /^lock_preserved=yes$/m);
});

test('bugfix parent lock-release failure corrects success before Telegram and rebuilds evidence', () => {
  const result = runBugfixAutopilotFinalizer(0, 2);
  assert.equal(result.status, 2, result.stderr);
  assert.equal(result.releaseCalled, true);
  assert.match(result.stdout, /^final_status=BUGFIX_AUTOPILOT_BLOCKED_LOCK_RELEASE$/m);
  assert.match(result.stdout, /^stop_reason=lock_release_failed_lock_preserved$/m);
  assert.match(result.stdout, /^lock_release_status=preserved$/m);
  assert.match(result.stdout, /^lock_release_exit_code=2$/m);
  assert.match(result.stdout, /^lock_preserved=yes$/m);
  assert.match(result.summary, /^final_status=BUGFIX_AUTOPILOT_BLOCKED_LOCK_RELEASE$/m);
  assert.equal(result.zipCount, 'xx');
  assert.equal(result.telegram, 'BUGFIX_AUTOPILOT_BLOCKED_LOCK_RELEASE|lock_release_failed_lock_preserved|2\n');
});

test('bugfix parent successful child cleanup and lock release remain visible', () => {
  const result = runBugfixAutopilotFinalizer(0, 0);
  assert.equal(result.status, 0, String(result.stderr));
  assert.equal(result.releaseCalled, true);
  assert.match(result.stdout, /^final_status=BUGFIX_AUTOPILOT_COMPLETE$/m);
  assert.match(result.stdout, /^child_cleanup_status=complete$/m);
  assert.match(result.stdout, /^lock_release_status=released$/m);
  assert.match(result.stdout, /^lock_preserved=no$/m);
  assert.match(result.summary, /^lock_release_status=released$/m);
  assert.equal(result.zipCount, 'xr', 'successful release must refresh the archived final summary');
  assert.equal(result.telegram, 'BUGFIX_AUTOPILOT_COMPLETE|all_campaign_areas_closed|0\n');
});
