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
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const REPOSITORY_ROOT = process.cwd();
const GUARD_PATH = resolve(REPOSITORY_ROOT, '.automation/lib/temp_inode_guard.sh');
const RUN_COMMON_PATH = resolve(REPOSITORY_ROOT, '.automation/lib/run_common.sh');

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

function createFixture(t: TestContext): Readonly<{ fakeBin: string; root: string }> {
  const root = mkdtempSync(join(tmpdir(), 'surebet-temp-inode-'));
  const fakeBin = join(root, 'fake-bin');
  mkdirSync(fakeBin, { recursive: true });
  const dfPath = join(fakeBin, 'df');
  writeFileSync(
    dfPath,
    `#!/usr/bin/env bash
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
`,
    'utf-8',
  );
  chmodSync(dfPath, 0o755);
  t.after(() => {
    rmSync(root, { force: true, maxRetries: 3, recursive: true, retryDelay: 50 });
  });
  return Object.freeze({ fakeBin, root });
}

function runShell(
  fixture: Readonly<{ fakeBin: string; root: string }>,
  script: string,
  environment: Readonly<Record<string, string>> = {},
) {
  return spawnSync('bash', ['-c', script], {
    cwd: fixture.root,
    encoding: 'utf-8',
    env: {
      ...process.env,
      ...environment,
      PATH: `${fixture.fakeBin}:${process.env.PATH ?? ''}`,
    },
    timeout: 20_000,
  });
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
export AUTOMATION_TEMP_USAGE_SCAN_TIMEOUT_SECONDS=5
export AUTOMATION_TEMP_CLEANUP_TIMEOUT_SECONDS=10
`;

test('temp/inode guard creates a private controller session, propagates TMP variables, and removes it on cleanup', (t) => {
  const fixture = createFixture(t);
  const result = runShell(fixture, `
set -Eeuo pipefail
AUTOMATION_REPO_ROOT=${shellQuote(fixture.root)}
. ${shellQuote(GUARD_PATH)}
${healthyConfiguration}
automation_temp_inode_bootstrap fixture-controller
session="$AUTOMATION_TEMP_SESSION_ROOT"
printf 'session=%s\\n' "$session"
printf 'tmpdir=%s\\n' "$TMPDIR"
printf 'tmp=%s\\n' "$TMP"
printf 'temp=%s\\n' "$TEMP"
printf 'owner=%s\\n' "$AUTOMATION_TEMP_OWNER_PID"
test "$TMPDIR" = "$session/tmp"
test "$TMP" = "$TMPDIR"
test "$TEMP" = "$TMPDIR"
test -f "$session/.automation-temp-session.env"
automation_temp_inode_cleanup
test ! -e "$session"
`);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /session=.*\.automation\/tmp-test\/sessions\/bws-automation-fixture-controller\./);
  assert.match(result.stdout, /owner=\d+/);
});

test('separate controller processes receive distinct run-level temp roots', (t) => {
  const fixture = createFixture(t);
  const script = `
set -Eeuo pipefail
AUTOMATION_REPO_ROOT=${shellQuote(fixture.root)}
. ${shellQuote(GUARD_PATH)}
${healthyConfiguration}
automation_temp_inode_bootstrap child-controller
printf '%s\\n' "$AUTOMATION_TEMP_SESSION_ROOT"
automation_temp_inode_cleanup
`;
  const first = runShell(fixture, script);
  const second = runShell(fixture, script);
  assert.equal(first.status, 0, first.stderr || first.stdout);
  assert.equal(second.status, 0, second.stderr || second.stdout);
  assert.notEqual(first.stdout.trim(), second.stdout.trim());
});

test('inode preflight fails closed before a session is created', (t) => {
  const fixture = createFixture(t);
  const result = runShell(fixture, `
set -uo pipefail
AUTOMATION_REPO_ROOT=${shellQuote(fixture.root)}
. ${shellQuote(GUARD_PATH)}
${healthyConfiguration}
export AUTOMATION_MIN_FREE_INODES=20000000
set +e
automation_temp_inode_bootstrap blocked-controller
rc=$?
set -e
printf 'rc=%s\\n' "$rc"
count="$(find "$AUTOMATION_TEMP_SESSIONS_ROOT" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d '[:space:]')"
printf 'sessions=%s\\n' "$count"
test "$rc" -eq 43
test "$count" -eq 0
`);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /rc=43/);
  assert.match(result.stderr, /AUTOMATION_TEMP_INODE_PREFLIGHT_BLOCKED/);
});

test('stale recovery removes only a marker-owned dead direct child and retains a live exact owner', (t) => {
  const fixture = createFixture(t);
  const result = runShell(fixture, `
set -Eeuo pipefail
AUTOMATION_REPO_ROOT=${shellQuote(fixture.root)}
. ${shellQuote(GUARD_PATH)}
${healthyConfiguration}
automation_temp_inode_configure
_automation_temp_prepare_base
boot="$(_automation_temp_boot_id)"
repo_id="$AUTOMATION_TEMP_REPOSITORY_ID"
now="$(date -u +%s)"
old=$((now - 120))
dead="$AUTOMATION_TEMP_SESSIONS_ROOT/bws-automation-dead.20260717T000000Z.999999.deadtest"
live="$AUTOMATION_TEMP_SESSIONS_ROOT/bws-automation-live.20260717T000000Z.$$.livetest"
mkdir -p "$dead/tmp" "$live/tmp"
cat > "$dead/.automation-temp-session.env" <<META
schema_version=1
repository_id=$repo_id
repository_realpath=$AUTOMATION_TEMP_REPO_REALPATH
controller=dead
owner_pid=999999
owner_start_ticks=1
boot_id=$boot
created_epoch=$old
created_at=2026-07-17T00:00:00Z
heartbeat_epoch=$old
heartbeat_at=2026-07-17T00:00:00Z
cleanup_policy=delete_after_owner_exit
META
start="$(_automation_temp_proc_start_ticks $$)"
cat > "$live/.automation-temp-session.env" <<META
schema_version=1
repository_id=$repo_id
repository_realpath=$AUTOMATION_TEMP_REPO_REALPATH
controller=live
owner_pid=$$
owner_start_ticks=$start
boot_id=$boot
created_epoch=$old
created_at=2026-07-17T00:00:00Z
heartbeat_epoch=$old
heartbeat_at=2026-07-17T00:00:00Z
cleanup_policy=delete_after_owner_exit
META
automation_temp_inode_recover_stale apply 0
test ! -e "$dead"
test -d "$live"
`);
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('run_common centrally loads the guard, bootstraps every run directory, and excludes managed temp state', () => {
  const source = readFileSync(RUN_COMMON_PATH, 'utf-8');
  assert.match(source, /temp_inode_guard\.sh/);
  assert.match(source, /automation_temp_inode_bootstrap "\$slug"/);
  assert.match(source, /before_managed_command:\$label/);
  assert.match(source, /after_managed_command:\$label/);
  assert.match(source, /before_artifact_packaging/);
  assert.match(source, /\.automation\/tmp/);
});

test('paper runtime evidence fixtures register recursive cleanup with node:test', () => {
  const source = readFileSync(resolve(REPOSITORY_ROOT, 'tests/bws-paper-runtime-evidence.test.ts'), 'utf-8');
  assert.match(source, /function createTestRepositoryRoot\(t: TestContext\)/);
  assert.match(source, /t\.after\(\(\) =>/);
  assert.match(source, /rmSync\(root, \{/);
  assert.match(source, /maxRetries: 3/);
});

test('managed session root remains empty after focused guard tests', (t) => {
  const fixture = createFixture(t);
  const result = runShell(fixture, `
set -Eeuo pipefail
AUTOMATION_REPO_ROOT=${shellQuote(fixture.root)}
. ${shellQuote(GUARD_PATH)}
${healthyConfiguration}
automation_temp_inode_configure
_automation_temp_prepare_base
find "$AUTOMATION_TEMP_SESSIONS_ROOT" -mindepth 1 -maxdepth 1 -type d -print
`);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const directories = readdirSync(join(fixture.root, '.automation/tmp-test/sessions'));
  assert.deepEqual(directories, []);
  assert.equal(existsSync(join(fixture.root, '.automation/tmp-test/.session-scan')), false);
});
