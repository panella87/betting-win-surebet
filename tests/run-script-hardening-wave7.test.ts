import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
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

interface FinalizerOptions {
  script: 'run-autonomous-implementation.sh' | 'run-autonomous-bugfix.sh';
  finalStatus: string;
  stopReason: string;
  finishRc: number;
  releaseRc: number;
}

interface FinalizerResult {
  status: number | null;
  stdout: string;
  stderr: string;
  summary: string;
  telegram: string;
  zipCount: string;
}

function runFinalizerHarness(options: FinalizerOptions): FinalizerResult {
  const repo = mkdtempSync(join(tmpdir(), 'surebet-wave7-finalizer-'));
  const runDir = join(repo, 'artifacts', 'test_run');
  const lockFile = join(repo, '.automation', 'locks', 'test.lock');
  try {
    mkdirSync(join(repo, '.automation', 'lib'), { recursive: true });
    mkdirSync(runDir, { recursive: true });
    mkdirSync(join(repo, '.automation', 'locks'), { recursive: true });
    for (const helper of ['run_common.sh', 'controller_hardening_v2.sh', 'telegram_notify.sh']) {
      copyFileSync(join(ROOT, '.automation', 'lib', helper), join(repo, '.automation', 'lib', helper));
    }

    const source = readFileSync(join(ROOT, options.script), 'utf-8');
    const mainStart = source.indexOf('parse_args "$@"');
    assert.ok(mainStart > 0, `main marker missing in ${options.script}`);
    const prefix = source.slice(0, mainStart);
    const harness = `
mkdir -p ${shellQuote(runDir)} ${shellQuote(join(repo, '.automation', 'locks'))}
: > ${shellQuote(lockFile)}
AUTOMATION_REPO_ROOT=${shellQuote(repo)}
AUTOMATION_RUN_DIR=${shellQuote(runDir)}
AUTOMATION_CONTROLLER_LOG=${shellQuote(join(runDir, 'controller.log'))}
AUTOMATION_LOCK_FILE=${shellQuote(lockFile)}
LOCK_ACQUIRED=1
FINISHED=0
FINAL_STATUS=${shellQuote(options.finalStatus)}
STOP_REASON=${shellQuote(options.stopReason)}
EXIT_STATUS=0
CYCLES_ATTEMPTED=1
ACTIVE_HANDOFF_MODE=none
refresh_source_change_state() { :; }
automation_collect_repo_snapshot() { :; }
build_artifacts_zip_bounded() { printf x >> ${shellQuote(join(runDir, 'zip-count'))}; return 0; }
telegram_notify_send_final() { printf '%s|%s|%s\\n' "$3" "$4" "$6" > ${shellQuote(join(runDir, 'telegram'))}; }
automation_release_lock() { return ${options.releaseRc}; }
finish ${options.finishRc}
`;
    const scriptPath = join(repo, options.script);
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
    };
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
}

test('standalone implementation acquires its lock before creating a run directory', () => {
  const script = readFileSync(join(ROOT, 'run-autonomous-implementation.sh'), 'utf-8');
  const main = script.slice(script.indexOf('parse_args "$@"'));
  const acquire = main.indexOf('automation_acquire_lock "$SCRIPT_NAME" "$AUTOMATION_REPO_ROOT"');
  const create = main.indexOf('automation_create_run_dir "autonomous_implementation"');
  const rewrite = main.indexOf('automation_write_lock_file', create);
  const heartbeat = main.indexOf('automation_start_heartbeat', create);
  assert.ok(acquire >= 0 && create > acquire && rewrite > create && heartbeat > rewrite);
  assert.match(script, /lock_acquisition_before_run_dir=enabled/);
});

test('standalone bugfix acquires its lock before creating a run directory while retaining early evidence resolution', () => {
  const script = readFileSync(join(ROOT, 'run-autonomous-bugfix.sh'), 'utf-8');
  const main = script.slice(script.indexOf('parse_args "$@"'));
  const evidence = main.indexOf('ARTIFACT_HINT="$(resolve_artifact_hint || true)"');
  const acquire = main.indexOf('automation_acquire_lock "$SCRIPT_NAME" "$AUTOMATION_REPO_ROOT"');
  const create = main.indexOf('automation_create_run_dir autonomous_bugfix');
  const rewrite = main.indexOf('automation_write_lock_file', create);
  const heartbeat = main.indexOf('automation_start_heartbeat', create);
  assert.ok(evidence >= 0 && acquire > evidence && create > acquire && rewrite > create && heartbeat > rewrite);
  assert.match(script, /lock_acquisition_before_run_dir=enabled/);
});

test('implementation finalization converts a lock-release failure into a preserved-lock blocker', () => {
  const result = runFinalizerHarness({
    script: 'run-autonomous-implementation.sh',
    finalStatus: 'AUTONOMOUS_GOAL_COMPLETE=yes',
    stopReason: 'goal_complete',
    finishRc: 0,
    releaseRc: 2,
  });
  assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /^final_status=BLOCKED=yes$/m);
  assert.match(result.stdout, /^stop_reason=lock_release_failed_lock_preserved$/m);
  assert.match(result.stdout, /^lock_release_status=preserved$/m);
  assert.match(result.stdout, /^lock_release_exit_code=2$/m);
  assert.match(result.stdout, /^lock_preserved=yes$/m);
  assert.match(result.summary, /^final_status=BLOCKED=yes$/m);
  assert.match(result.summary, /^lock_preserved=yes$/m);
  assert.equal(result.telegram, 'BLOCKED=yes|lock_release_failed_lock_preserved|2\n');
  assert.equal(result.zipCount.length, 2, 'initial and corrective artifact packaging should both run');
});

test('bugfix finalization converts a lock-release failure into a preserved-lock blocker', () => {
  const result = runFinalizerHarness({
    script: 'run-autonomous-bugfix.sh',
    finalStatus: 'BUGFIX_AUDIT_COMPLETE=yes',
    stopReason: 'bugfix_audit_complete',
    finishRc: 0,
    releaseRc: 2,
  });
  assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /^final_status=BLOCKED=yes$/m);
  assert.match(result.stdout, /^stop_reason=lock_release_failed_lock_preserved$/m);
  assert.match(result.stdout, /^lock_release_status=preserved$/m);
  assert.match(result.stdout, /^lock_release_exit_code=2$/m);
  assert.match(result.stdout, /^lock_preserved=yes$/m);
  assert.match(result.summary, /^final_status=BLOCKED=yes$/m);
  assert.match(result.summary, /^lock_preserved=yes$/m);
  assert.equal(result.telegram, 'BLOCKED=yes|lock_release_failed_lock_preserved|2\n');
  assert.equal(result.zipCount.length, 2, 'initial and corrective artifact packaging should both run');
});

test('successful standalone lock release remains visible without changing a successful result', () => {
  for (const [script, finalStatus, stopReason] of [
    ['run-autonomous-implementation.sh', 'AUTONOMOUS_GOAL_COMPLETE=yes', 'goal_complete'],
    ['run-autonomous-bugfix.sh', 'BUGFIX_AUDIT_COMPLETE=yes', 'bugfix_audit_complete'],
  ] as const) {
    const result = runFinalizerHarness({ script, finalStatus, stopReason, finishRc: 0, releaseRc: 0 });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, new RegExp(`^final_status=${finalStatus.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'));
    assert.match(result.stdout, /^lock_release_status=released$/m);
    assert.match(result.stdout, /^lock_release_exit_code=0$/m);
    assert.match(result.stdout, /^lock_preserved=no$/m);
    assert.match(result.summary, /^lock_release_status=released$/m);
    assert.equal(result.zipCount.length, 1);
  }
});

test('unexpected bugfix shell exits are normalized to the documented blocked exit code', () => {
  const result = runFinalizerHarness({
    script: 'run-autonomous-bugfix.sh',
    finalStatus: 'CONTINUE_REQUIRED=yes',
    stopReason: 'loop_started',
    finishRc: 17,
    releaseRc: 0,
  });
  assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /^final_status=BLOCKED=yes$/m);
  assert.match(result.stdout, /^stop_reason=unexpected_controller_exit$/m);
  assert.match(result.stdout, /^final_exit_code=2$/m);
});

test('implementation consumes an input handoff only before a successful final lock release', () => {
  const script = readFileSync(join(ROOT, 'run-autonomous-implementation.sh'), 'utf-8');
  const returnStart = script.indexOf('write_return_handover()');
  const consumedStart = script.indexOf('write_consumed_handoff_marker()');
  const finishStart = script.indexOf('finish()');
  assert.ok(returnStart >= 0 && consumedStart > returnStart && finishStart > consumedStart);
  const returnBody = script.slice(returnStart, consumedStart);
  assert.doesNotMatch(returnBody, /ACTIVE_HANDOFF_CONSUMED_MARKER/);
  const finishBody = script.slice(finishStart, script.indexOf('terminate_controller_children()', finishStart));
  assert.ok(finishBody.indexOf('write_consumed_handoff_marker') < finishBody.indexOf('attempt_final_lock_release'));
  assert.ok(finishBody.indexOf('remove_consumed_handoff_marker') > finishBody.indexOf('attempt_final_lock_release'));
});
