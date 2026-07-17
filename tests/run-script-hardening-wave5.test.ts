import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
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

function waitFor(predicate: () => boolean, timeoutMs = 5000): Promise<void> {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = (): void => {
      if (predicate()) {
        resolve();
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        reject(new Error('timed out waiting for condition'));
        return;
      }
      setTimeout(tick, 25);
    };
    tick();
  });
}

function makeLockRepo(): string {
  const repo = mkdtempSync(join(tmpdir(), 'surebet-wave5-lock-'));
  mkdirSync(join(repo, '.automation', 'lib'), { recursive: true });
  mkdirSync(join(repo, '.automation', 'locks'), { recursive: true });
  copyFileSync(join(ROOT, '.automation', 'lib', 'run_common.sh'), join(repo, '.automation', 'lib', 'run_common.sh'));
  copyFileSync(join(ROOT, '.automation', 'lib', 'temp_inode_guard.sh'), join(repo, '.automation', 'lib', 'temp_inode_guard.sh'));
  writeFileSync(join(repo, 'automation.config.sh'), [
    'AUTOMATION_REPO_NAME=test-repo',
    'AUTOMATION_PROJECT_NAME=test-repo',
    'AUTOMATION_LOCK_STALE_SECONDS=60',
    'AUTOMATION_LOCK_HEARTBEAT_SECONDS=1',
    'AUTOMATION_GRACEFUL_UNLOCK_SECONDS=2',
    '',
  ].join('\n'));
  return repo;
}

function writeExecutable(path: string, content: string): void {
  writeFileSync(path, content, 'utf-8');
  chmodSync(path, 0o755);
}

test('paper autopilot requires canonical producer and return handoffs without legacy rewriting', () => {
  const script = readFileSync(join(ROOT, 'run-paper-autopilot.sh'), 'utf-8');
  assert.match(script, /canonical_paper_handoff_required=enabled/);
  assert.match(script, /legacy_paper_handoff_normalization=disabled/);
  assert.match(script, /SOURCE_EVIDENCE_SHA256/);
  assert.match(script, /paper handoff source fingerprint is stale/);
  assert.match(script, /implementation return producer controller mismatch/);
  assert.match(script, /PAPER_AUTOPILOT_BLOCKED_PAPER_SOURCE_MUTATION/);
  assert.match(script, /PAPER_AUTOPILOT_BLOCKED_IMPLEMENTATION_PARTIAL_SOURCE_CHANGE/);
  assert.match(script, /--zip-timeout "\$ZIP_TIMEOUT_SECONDS"/);
  assert.doesNotMatch(script, /normalize_paper_handoff/);
  assert.doesNotMatch(script, /AUTOMATION_V2_ENV\[REPO_NAME\]/);
  assert.doesNotMatch(script, /REPO_NAME=/);
});

test('shared managed-child lock records child identity and force-unlock terminates gracefully', async () => {
  const repo = makeLockRepo();
  const controller = join(repo, 'dummy-controller.sh');
  const lock = join(repo, '.automation', 'locks', 'dummy-controller.lock');
  const marker = join(repo, 'term-marker');
  try {
    writeExecutable(controller, `#!/usr/bin/env bash
set -Eeuo pipefail
root="$(cd "$(dirname "$0")" && pwd -P)"
AUTOMATION_REPO_ROOT="$root"
. "$root/.automation/lib/run_common.sh"
automation_load_config
if [[ "\${1:-}" == force ]]; then
  automation_force_unlock "$root/.automation/locks/dummy-controller.lock" dummy-controller.sh "$root"
  exit
fi
automation_acquire_lock dummy-controller.sh "$root"
automation_start_heartbeat
trap 'automation_release_lock || true' EXIT INT TERM
cmd=(bash -c 'trap "printf term > \\"$0\\"; exit 0" TERM; while :; do sleep 1; done' "$root/term-marker")
automation_run_argv_command child 30 "$root/child.log" "\${cmd[@]}"
`);
    const child = spawn(controller, [], { stdio: ['ignore', 'pipe', 'pipe'] });
    await waitFor(() => existsSync(lock) && /^active_child_pid=[1-9]/m.test(readFileSync(lock, 'utf-8')));
    const lockText = readFileSync(lock, 'utf-8');
    assert.match(lockText, /^lock_schema_version=2$/m);
    assert.match(lockText, /^active_child_kind=child$/m);
    const unlock = spawnSync(controller, ['force'], { encoding: 'utf-8' });
    assert.equal(unlock.status, 0, `${unlock.stdout}\n${unlock.stderr}`);
    await new Promise<void>((resolve) => child.once('exit', () => resolve()));
    assert.equal(readFileSync(marker, 'utf-8'), 'term');
    assert.equal(existsSync(lock), false);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('shared cross-controller guard blocks unrelated live controllers', async () => {
  const repo = makeLockRepo();
  const parent = join(repo, 'run-paper-autopilot.sh');
  const ready = join(repo, 'ready');
  try {
    writeExecutable(parent, `#!/usr/bin/env bash
set -Eeuo pipefail
root="$(cd "$(dirname "$0")" && pwd -P)"
cat > "$root/.automation/locks/run-paper-autopilot.lock" <<LOCK
LOCK_SCHEMA_VERSION=1
CONTROLLER=run-paper-autopilot.sh
CONTROLLER_PID=$$
REPOSITORY=test-repo
REPO_REALPATH=$root
SCRIPT_REALPATH=$root/run-paper-autopilot.sh
HEARTBEAT_EPOCH=$(date -u +%s)
LOCK
printf ready > "$root/ready"
sleep 30
`);
    const parentProcess = spawn(parent, [], { stdio: 'ignore' });
    await waitFor(() => existsSync(ready));
    const result = spawnSync('bash', ['-lc', '. "$HELPER"; AUTOMATION_REPO_ROOT="$REPO"; automation_assert_no_incompatible_locks run-autonomous-bugfix.sh "$REPO"'], {
      encoding: 'utf-8',
      env: { ...globalThis.process.env, HELPER: join(repo, '.automation', 'lib', 'run_common.sh'), REPO: repo },
    });
    assert.equal(result.status, 27, `${result.stdout}\n${result.stderr}`);
    assert.match(`${result.stdout}${result.stderr}`, /incompatible controller is active/);
    parentProcess.kill('SIGTERM');
    await new Promise<void>((resolve) => parentProcess.once('exit', () => resolve()));
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('shared cross-controller guard permits a verified parent-launched child', () => {
  const repo = makeLockRepo();
  const parent = join(repo, 'run-bugfix-autopilot.sh');
  try {
    writeExecutable(parent, `#!/usr/bin/env bash
set -Eeuo pipefail
root="$(cd "$(dirname "$0")" && pwd -P)"
cat > "$root/.automation/locks/run-bugfix-autopilot.lock" <<LOCK
LOCK_SCHEMA_VERSION=1
CONTROLLER=run-bugfix-autopilot.sh
CONTROLLER_PID=$$
REPOSITORY=test-repo
REPO_REALPATH=$root
SCRIPT_REALPATH=$root/run-bugfix-autopilot.sh
HEARTBEAT_EPOCH=$(date -u +%s)
LOCK
REPO="$root" HELPER="$root/.automation/lib/run_common.sh" bash -c '. "$HELPER"; AUTOMATION_REPO_ROOT="$REPO"; automation_assert_no_incompatible_locks run-autonomous-bugfix.sh "$REPO"'
`);
    const output = execFileSync(parent, [], { encoding: 'utf-8' });
    assert.equal(output, '');
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
