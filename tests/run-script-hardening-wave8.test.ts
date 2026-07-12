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
  readdirSync,
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

function runPaperEvaluationFinalizer(releaseRc: number): HarnessResult {
  const repo = mkdtempSync(join(tmpdir(), 'surebet-wave8-paper-finalizer-'));
  const runDir = join(repo, 'artifacts', 'paper_evaluation_test');
  const lockFile = join(repo, '.automation', 'locks', 'run-paper-evaluation.lock');
  try {
    copyHelpers(repo);
    mkdirSync(runDir, { recursive: true });
    mkdirSync(join(repo, '.automation', 'locks'), { recursive: true });
    writeFileSync(lockFile, 'test-lock\n');
    const source = readFileSync(join(ROOT, 'run-paper-evaluation.sh'), 'utf-8');
    const mainStart = source.indexOf('parse_args "$@"');
    assert.ok(mainStart > 0);
    const prefix = source.slice(0, mainStart);
    const harness = `
AUTOMATION_REPO_ROOT=${shellQuote(repo)}
AUTOMATION_RUN_DIR=${shellQuote(runDir)}
AUTOMATION_CONTROLLER_LOG=${shellQuote(join(runDir, 'controller.log'))}
AUTOMATION_LOCK_FILE=${shellQuote(lockFile)}
LOCK_ACQUIRED=1
FINISHED=0
FINAL_STATUS=PAPER_EVALUATION_PINNED_BUNDLE_ACCEPTED_PRIVATE_REPORT_WRITTEN
STOP_REASON=pinned_bundle_private_report_written
CYCLES_ATTEMPTED=1
INITIAL_SOURCE_FINGERPRINT=before
FINAL_SOURCE_FINGERPRINT=after
ZIP_TIMEOUT_SECONDS=1
automation_collect_repo_snapshot() { :; }
build_artifacts_zip_bounded() { printf x >> ${shellQuote(join(runDir, 'zip-count'))}; return 0; }
telegram_notify_send_final() { printf '%s|%s|%s\\n' "$3" "$4" "$6" > ${shellQuote(join(runDir, 'telegram'))}; }
automation_release_lock() { printf called > ${shellQuote(join(runDir, 'release-called'))}; return ${releaseRc}; }
finish 0
`;
    const scriptPath = join(repo, 'run-paper-evaluation.sh');
    writeFileSync(scriptPath, `${prefix}${harness}`, 'utf-8');
    chmodSync(scriptPath, 0o755);
    const result = spawnSync('bash', [scriptPath], { encoding: 'utf-8' });
    return {
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      summary: readFileSync(join(runDir, 'final-summary.md'), 'utf-8'),
      telegram: readFileSync(join(runDir, 'telegram'), 'utf-8'),
      zipCount: readFileSync(join(runDir, 'zip-count'), 'utf-8'),
      releaseCalled: existsSync(join(runDir, 'release-called')),
    };
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
}

function runPaperAutopilotFinalizer(childCleanupRc: number, releaseRc: number): HarnessResult {
  const repo = mkdtempSync(join(tmpdir(), 'surebet-wave8-parent-finalizer-'));
  const runDir = join(repo, 'artifacts', 'paper_autopilot_test');
  const lockFile = join(repo, '.automation', 'locks', 'run-paper-autopilot.lock');
  try {
    copyHelpers(repo);
    mkdirSync(runDir, { recursive: true });
    mkdirSync(join(repo, '.automation', 'locks'), { recursive: true });
    writeFileSync(lockFile, 'test-lock\n');
    const source = readFileSync(join(ROOT, 'run-paper-autopilot.sh'), 'utf-8');
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
FINAL_STATUS=PAPER_AUTOPILOT_PINNED_BUNDLE_ACCEPTED_PRIVATE_REPORT_WRITTEN
STOP_REASON=pinned_bundle_private_report_written
ROUNDS_COMPLETED=1
LAST_CHILD=paper
LAST_CHILD_RC=0
LAST_CHILD_STATUS=PAPER_EVALUATION_PINNED_BUNDLE_ACCEPTED_PRIVATE_REPORT_WRITTEN
LAST_CHILD_STOP_REASON=pinned_bundle_private_report_written
LAST_CHILD_RUN_DIR=${shellQuote(join(repo, 'artifacts', 'paper_evaluation_child'))}
DURATION_SECONDS=10
MAX_ROUNDS=0
MAX_SAME_HANDOFF=2
terminate_active_child() { return ${childCleanupRc}; }
release_parent_lock() { printf called > ${shellQuote(join(runDir, 'release-called'))}; return ${releaseRc}; }
automation_collect_repo_snapshot() { :; }
build_artifacts_zip_bounded() { printf x >> ${shellQuote(join(runDir, 'zip-count'))}; return 0; }
telegram_notify_send_final() { printf '%s|%s|%s\\n' "$3" "$4" "$6" > ${shellQuote(join(runDir, 'telegram'))}; }
finish 0
`;
    const scriptPath = join(repo, 'run-paper-autopilot.sh');
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

test('standalone paper evaluation locks before run creation and rotates handoffs only after lock ownership', () => {
  const script = readFileSync(join(ROOT, 'run-paper-evaluation.sh'), 'utf-8');
  const main = script.slice(script.indexOf('parse_args "$@"'));
  const acquire = main.indexOf('automation_acquire_lock "$SCRIPT_NAME" "$AUTOMATION_REPO_ROOT"');
  const create = main.indexOf('automation_create_run_dir "paper_evaluation"');
  const rewrite = main.indexOf('automation_write_lock_file', create);
  const heartbeat = main.indexOf('automation_start_heartbeat', create);
  const rotate = main.indexOf('rotate_stale_paper_handoff', create);
  assert.ok(acquire >= 0 && create > acquire && rewrite > create && heartbeat > rewrite && rotate > heartbeat);
  assert.match(script, /lock_acquisition_before_run_dir=enabled/);
  assert.match(script, /atomic_standalone_lock_acquisition=enabled/);
});

test('shared standalone lock claims are full-file atomic and exactly one concurrent claimant wins', () => {
  const repo = mkdtempSync(join(tmpdir(), 'surebet-wave8-lock-claim-'));
  try {
    mkdirSync(join(repo, '.automation', 'lib'), { recursive: true });
    mkdirSync(join(repo, '.automation', 'locks'), { recursive: true });
    copyFileSync(join(ROOT, '.automation', 'lib', 'run_common.sh'), join(repo, '.automation', 'lib', 'run_common.sh'));
    const dummy = join(repo, 'dummy.sh');
    writeFileSync(dummy, '#!/usr/bin/env bash\n', 'utf-8');
    chmodSync(dummy, 0o755);
    const lockFile = join(repo, '.automation', 'locks', 'dummy.lock');
    const harness = `
. ${shellQuote(join(repo, '.automation', 'lib', 'run_common.sh'))}
AUTOMATION_REPO_ROOT=${shellQuote(repo)}
AUTOMATION_SCRIPT_NAME=dummy.sh
AUTOMATION_CONTROLLER_PID=$$
AUTOMATION_STARTED_AT=2026-07-12T00:00:00Z
AUTOMATION_LOCK_FILE=${shellQuote(lockFile)}
( if automation_claim_lock_file; then echo 0; else echo $?; fi ) > ${shellQuote(join(repo, 'a'))} &
( if automation_claim_lock_file; then echo 0; else echo $?; fi ) > ${shellQuote(join(repo, 'b'))} &
wait
cat ${shellQuote(join(repo, 'a'))} ${shellQuote(join(repo, 'b'))} | sort
`;
    const result = spawnSync('bash', ['-c', harness], { encoding: 'utf-8' });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(result.stdout, '0\n1\n');
    const lock = readFileSync(lockFile, 'utf-8');
    assert.match(lock, /^lock_schema_version=2$/m);
    assert.match(lock, /^script=dummy\.sh$/m);
    assert.equal(readdirSync(join(repo, '.automation', 'locks')).filter((name) => name.includes('.claim.')).length, 0);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('paper evaluation lock-release failure corrects success before Telegram and preserves the lock result', () => {
  const result = runPaperEvaluationFinalizer(2);
  assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
  assert.equal(result.releaseCalled, true);
  assert.match(result.stdout, /^final_status=PAPER_EVALUATION_BLOCKED_LOCK_RELEASE$/m);
  assert.match(result.stdout, /^stop_reason=lock_release_failed_lock_preserved$/m);
  assert.match(result.stdout, /^lock_release_status=preserved$/m);
  assert.match(result.stdout, /^lock_release_exit_code=2$/m);
  assert.match(result.stdout, /^lock_preserved=yes$/m);
  assert.match(result.summary, /^final_status=PAPER_EVALUATION_BLOCKED_LOCK_RELEASE$/m);
  assert.match(result.summary, /^lock_preserved=yes$/m);
  assert.equal(result.telegram, 'PAPER_EVALUATION_BLOCKED_LOCK_RELEASE|lock_release_failed_lock_preserved|2\n');
  assert.equal(result.zipCount.length, 2);
});

test('paper evaluation successful lock release remains visible without changing success', () => {
  const result = runPaperEvaluationFinalizer(0);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /^final_status=PAPER_EVALUATION_PINNED_BUNDLE_ACCEPTED_PRIVATE_REPORT_WRITTEN$/m);
  assert.match(result.stdout, /^lock_release_status=released$/m);
  assert.match(result.stdout, /^lock_preserved=no$/m);
  assert.match(result.summary, /^lock_release_status=released$/m);
  assert.equal(result.zipCount.length, 1);
});

test('paper autopilot uses an atomic full parent-lock claim before campaign artifact creation', () => {
  const script = readFileSync(join(ROOT, 'run-paper-autopilot.sh'), 'utf-8');
  assert.match(script, /claim_parent_lock\(\)/);
  assert.match(script, /automation_v2_claim_env_lock_atomic "\$LOCK_FILE"/);
  assert.match(script, /paper autopilot lock was acquired concurrently/);
  const main = script.slice(script.indexOf('parse_args "$@"'));
  const acquire = main.indexOf('acquire_parent_lock');
  const create = main.indexOf('automation_create_run_dir paper_autopilot');
  assert.ok(acquire >= 0 && create > acquire);
  assert.match(script, /atomic_parent_lock_acquisition=enabled/);
});

test('paper autopilot child identity failure is terminal, preserves the lock, and skips release', () => {
  const result = runPaperAutopilotFinalizer(2, 0);
  assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
  assert.equal(result.releaseCalled, false);
  assert.match(result.stdout, /^final_status=PAPER_AUTOPILOT_BLOCKED_CHILD_IDENTITY$/m);
  assert.match(result.stdout, /^stop_reason=active_child_identity_or_termination_failed$/m);
  assert.match(result.stdout, /^child_cleanup_status=identity_or_termination_failed$/m);
  assert.match(result.stdout, /^lock_release_status=preserved_due_to_child_cleanup_failure$/m);
  assert.match(result.stdout, /^lock_preserved=yes$/m);
  assert.match(result.summary, /^final_status=PAPER_AUTOPILOT_BLOCKED_CHILD_IDENTITY$/m);
  assert.equal(result.telegram, 'PAPER_AUTOPILOT_BLOCKED_CHILD_IDENTITY|active_child_identity_or_termination_failed|2\n');
  assert.equal(result.zipCount.length, 1);
});

test('paper autopilot lock-release failure corrects success before Telegram', () => {
  const result = runPaperAutopilotFinalizer(0, 2);
  assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
  assert.equal(result.releaseCalled, true);
  assert.match(result.stdout, /^final_status=PAPER_AUTOPILOT_BLOCKED_LOCK_RELEASE$/m);
  assert.match(result.stdout, /^stop_reason=lock_release_failed_lock_preserved$/m);
  assert.match(result.stdout, /^lock_release_status=preserved$/m);
  assert.match(result.stdout, /^lock_preserved=yes$/m);
  assert.match(result.summary, /^final_status=PAPER_AUTOPILOT_BLOCKED_LOCK_RELEASE$/m);
  assert.equal(result.telegram, 'PAPER_AUTOPILOT_BLOCKED_LOCK_RELEASE|lock_release_failed_lock_preserved|2\n');
  assert.equal(result.zipCount.length, 2);
});

test('paper autopilot successful child cleanup and lock release remain visible', () => {
  const result = runPaperAutopilotFinalizer(0, 0);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /^child_cleanup_status=complete$/m);
  assert.match(result.stdout, /^lock_release_status=released$/m);
  assert.match(result.stdout, /^lock_preserved=no$/m);
  assert.match(result.summary, /^lock_release_status=released$/m);
  assert.equal(result.zipCount.length, 1);
});
