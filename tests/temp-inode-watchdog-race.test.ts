import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';

const REPOSITORY_ROOT = process.cwd();
const GUARD_PATH = resolve(REPOSITORY_ROOT, '.automation/lib/temp_inode_guard.sh');

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

function procStartTicks(pid: number): string {
  const raw = readFileSync(`/proc/${pid}/stat`, 'utf-8');
  const close = raw.lastIndexOf(') ');
  assert.ok(close > 0, 'unexpected /proc stat format');
  return raw.slice(close + 2).trim().split(/\s+/u)[19]!;
}

function bootId(): string {
  return readFileSync('/proc/sys/kernel/random/boot_id', 'utf-8').trim();
}

function startOwner(): ChildProcess {
  const child = spawn('bash', ['-lc', "trap 'exit 0' TERM INT HUP; while :; do sleep 1; done"], {
    stdio: 'ignore',
  });
  assert.ok(child.pid);
  return child;
}

async function stopChild(child: ChildProcess): Promise<void> {
  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGTERM');
  }
  await Promise.race([
    new Promise<void>((resolvePromise) => child.once('exit', () => resolvePromise())),
    wait(5_000),
  ]);
}

async function waitForExit(child: ChildProcess, timeoutMs: number): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return;
  await Promise.race([
    new Promise<void>((resolvePromise) => child.once('exit', () => resolvePromise())),
    wait(timeoutMs).then(() => { throw new Error(`process ${child.pid} did not exit`); }),
  ]);
}

function createFixture(t: TestContext): Readonly<{ fakeBin: string; root: string }> {
  const root = mkdtempSync(join(tmpdir(), 'bws-temp-watchdog-race-'));
  const fakeBin = join(root, 'fake-bin');
  mkdirSync(fakeBin, { recursive: true });
  writeFileSync(join(fakeBin, 'df'), `#!/usr/bin/env bash
set -eu
case "$1" in
  -Pk)
    printf 'Filesystem 1024-blocks Used Available Capacity Mounted on\\n'
    printf 'fakefs 20000000 1000 19999000 1%% /\\n'
    ;;
  -Pi)
    printf 'Filesystem Inodes IUsed IFree IUse%% Mounted on\\n'
    printf 'fakefs 10000000 1000 9999000 1%% /\\n'
    ;;
  *) exit 2 ;;
esac
`, 'utf-8');
  chmodSync(join(fakeBin, 'df'), 0o755);
  t.after(() => rmSync(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 }));
  return Object.freeze({ fakeBin, root });
}

const healthyConfiguration = `
export AUTOMATION_TEMP_ROOT_RELATIVE=.automation/tmp-test
export AUTOMATION_TEMP_STALE_SECONDS=60
export AUTOMATION_MIN_FREE_INODES=100
export AUTOMATION_MIN_FREE_INODE_PERCENT=0
export AUTOMATION_MIN_FREE_KIB=1024
export AUTOMATION_MAX_RUN_TEMP_INODES=10000
export AUTOMATION_MAX_RUN_TEMP_KIB=100000
export AUTOMATION_CAPACITY_CHECK_INTERVAL_SECONDS=1
export AUTOMATION_TEMP_WATCHDOG_MAX_CONSECUTIVE_MEASUREMENT_FAILURES=2
export AUTOMATION_TEMP_USAGE_SCAN_TIMEOUT_SECONDS=5
export AUTOMATION_TEMP_CLEANUP_TIMEOUT_SECONDS=10
`;

test('usable numeric du output remains authoritative when du exits nonzero during file churn', (t) => {
  const fixture = createFixture(t);
  writeFileSync(join(fixture.fakeBin, 'du'), `#!/usr/bin/env bash
printf '64\\t%s\\n' "\${@: -1}"
exit 1
`, 'utf-8');
  chmodSync(join(fixture.fakeBin, 'du'), 0o755);
  const script = `
set -Eeuo pipefail
AUTOMATION_REPO_ROOT=${shellQuote(fixture.root)}
. ${shellQuote(GUARD_PATH)}
${healthyConfiguration}
automation_temp_inode_configure
_automation_temp_prepare_base
session="$AUTOMATION_TEMP_SESSIONS_ROOT/bws-automation-race.test"
mkdir -p "$session/tmp"
export AUTOMATION_TEMP_SESSION_ROOT="$session"
automation_temp_inode_check_capacity race_sample
`;
  const result = spawnSync('bash', ['-c', script], {
    cwd: fixture.root,
    encoding: 'utf-8',
    env: { ...process.env, PATH: `${fixture.fakeBin}:${process.env.PATH ?? ''}` },
    timeout: 20_000,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stderr, /usage_scan_race_tolerated/u);
  assert.match(result.stderr, /capacity_ok context=race_sample/u);
});

test('sustained unusable measurements terminate only the exact owner and retain bounded diagnostics', async (t) => {
  const fixture = createFixture(t);
  writeFileSync(join(fixture.fakeBin, 'du'), '#!/usr/bin/env bash\nexit 1\n', 'utf-8');
  chmodSync(join(fixture.fakeBin, 'du'), 0o755);

  const owner = startOwner();
  const unrelated = startOwner();
  t.after(async () => stopChild(owner));
  t.after(async () => stopChild(unrelated));
  assert.ok(owner.pid);

  const sessionsRoot = join(fixture.root, '.automation', 'tmp-test', 'sessions');
  const session = join(sessionsRoot, `bws-automation-watchdog.${owner.pid}.test`);
  mkdirSync(join(session, 'tmp'), { recursive: true });
  const createdEpoch = Math.floor(Date.now() / 1000);
  const createdIso = new Date(createdEpoch * 1000).toISOString().replace('.000Z', 'Z');
  const startTicks = procStartTicks(owner.pid);
  const currentBootId = bootId();
  const repositoryId = spawnSync('bash', ['-lc', `printf '%s\\0%s' ${shellQuote(basename(fixture.root))} ${shellQuote(fixture.root)} | sha256sum | awk '{print $1}'`], { encoding: 'utf-8' }).stdout.trim();
  writeFileSync(join(session, '.automation-temp-session.env'), [
    'schema_version=1',
    `repository_id=${repositoryId}`,
    `repository_realpath=${fixture.root}`,
    'controller=watchdog-test',
    `owner_pid=${owner.pid}`,
    `owner_start_ticks=${startTicks}`,
    `boot_id=${currentBootId}`,
    `created_epoch=${createdEpoch}`,
    `created_at=${createdIso}`,
    `heartbeat_epoch=${createdEpoch}`,
    `heartbeat_at=${createdIso}`,
    'cleanup_policy=delete_after_owner_exit',
    '',
  ].join('\n'));

  const script = `
set -Eeuo pipefail
AUTOMATION_REPO_ROOT=${shellQuote(fixture.root)}
. ${shellQuote(GUARD_PATH)}
${healthyConfiguration}
automation_temp_inode_configure
_automation_temp_prepare_base
export AUTOMATION_TEMP_SESSION_ROOT=${shellQuote(session)}
_automation_temp_watchdog_loop ${owner.pid} ${startTicks} ${shellQuote(currentBootId)} ${shellQuote(session)} watchdog-test ${createdEpoch} ${shellQuote(createdIso)}
`;
  const watchdog = spawn('bash', ['-c', script], {
    cwd: fixture.root,
    env: { ...process.env, PATH: `${fixture.fakeBin}:${process.env.PATH ?? ''}` },
    stdio: 'ignore',
  });
  t.after(async () => stopChild(watchdog));

  await waitForExit(owner, 10_000);
  assert.equal(unrelated.exitCode, null, 'unrelated process must remain alive');
  assert.equal(unrelated.signalCode, null);
  await waitForExit(watchdog, 5_000);

  rmSync(session, { recursive: true, force: true });
  assert.equal(existsSync(session), false, 'test should be able to remove the ephemeral session after owner exit');
  const runtimeEvents = join(fixture.root, '.automation', 'tmp-test', 'watchdog-events');
  const artifactEvents = join(fixture.root, 'artifacts', 'temp_inode_watchdog_events');
  const runtimeFiles = existsSync(runtimeEvents) ? readdirSync(runtimeEvents) : [];
  const artifactFiles = existsSync(artifactEvents) ? readdirSync(artifactEvents) : [];
  assert.ok(runtimeFiles.some((name) => name.startsWith('watchdog-event-')));
  assert.ok(artifactFiles.some((name) => name.startsWith('watchdog-event-')));
  const eventFile = runtimeFiles.find((name) => name.startsWith('watchdog-event-'))!;
  const event = readFileSync(join(runtimeEvents, eventFile), 'utf-8');
  assert.match(event, /reason=measurement_unavailable/u);
  assert.match(event, /action=term_exact_owner_only/u);
});
