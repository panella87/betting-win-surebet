import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const ZIP_CODEBASE = join(REPO_ROOT, 'zip_codebase.sh');
const PULL_AND_ZIP = join(REPO_ROOT, 'pull_artifacts_and_zip_codebase.sh');
const CREATE_SOURCE_HANDOFF = join(REPO_ROOT, 'scripts', 'create-source-handoff-archive.sh');
const ARTIFACT_HYGIENE_VALIDATOR = join(REPO_ROOT, 'scripts', 'validate_artifact_hygiene.py');
const RESTORE_EXECUTABLE_BITS = join(REPO_ROOT, 'scripts', 'restore-required-executable-bits.js');
const REQUIRED_EXECUTABLE_PATHS = join(REPO_ROOT, 'tools', 'required_executable_paths.js');
const UPDATE_GIT = join(REPO_ROOT, 'update_git.sh');
const RUN_COMMON = join(REPO_ROOT, '.automation', 'lib', 'run_common.sh');
const CONTROLLER_HARDENING = join(REPO_ROOT, '.automation', 'lib', 'controller_hardening_v2.sh');

function execFileSync(
  command: string,
  args: readonly string[],
  options: Readonly<{
    cwd?: string;
    encoding?: BufferEncoding;
    env?: NodeJS.ProcessEnv;
    stdio?: 'pipe' | 'ignore' | 'inherit';
  }>,
): string {
  const result = spawnSync(command, args, {
    ...options,
    encoding: options.encoding ?? 'utf-8',
    stdio: options.stdio ?? 'pipe',
  });
  if (result.status !== 0) {
    throw new Error([
      `${command} ${args.join(' ')} failed with status ${result.status}`,
      result.stderr,
      result.stdout,
    ].filter((part) => part.length > 0).join('\n'));
  }
  return result.stdout;
}

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

function listZipEntries(zipPath: string): string[] {
  return JSON.parse(
    execFileSync(
      'python3',
      [
        '-c',
        [
          'import json',
          'import sys',
          'import zipfile',
          'with zipfile.ZipFile(sys.argv[1]) as archive:',
          '    print(json.dumps(sorted(info.filename.rstrip("/") for info in archive.infolist() if info.filename.rstrip("/"))))',
        ].join('\n'),
        zipPath,
      ],
      { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' },
    ),
  ) as string[];
}

function listTarEntries(archivePath: string): string[] {
  return JSON.parse(
    execFileSync(
      'python3',
      [
        '-c',
        [
          'import json',
          'import sys',
          'import tarfile',
          'with tarfile.open(sys.argv[1], "r:gz") as archive:',
          '    print(json.dumps(sorted(name for name in archive.getnames() if name != ".")))',
        ].join('\n'),
        archivePath,
      ],
      { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' },
    ),
  ) as string[];
}

function makeRootArtifactDestinationFixture(prefix: string): {
  artifactsZipPath: string;
  dir: string;
  outsideDir: string;
  repoDir: string;
  runDir: string;
} {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  const repoDir = join(dir, 'repo');
  const runDir = join(repoDir, 'artifacts', 'autonomous_implementation_test');
  const outsideDir = join(dir, 'outside-artifacts-target');
  const artifactsZipPath = join(repoDir, 'artifacts.zip');
  mkdirSync(runDir, { recursive: true });
  mkdirSync(outsideDir, { recursive: true });
  writeFileSync(join(runDir, 'evidence.txt'), 'safe evidence\n', { encoding: 'utf-8' });
  symlinkSync(outsideDir, artifactsZipPath, 'dir');
  return { artifactsZipPath, dir, outsideDir, repoDir, runDir };
}

function makeArtifactResidueCleanupFixture(prefix: string): {
  artifactsDir: string;
  dir: string;
  repoDir: string;
} {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  const repoDir = join(dir, 'repo');
  const artifactsDir = join(repoDir, 'artifacts');
  mkdirSync(join(repoDir, '.automation', 'lib'), { recursive: true });
  mkdirSync(artifactsDir, { recursive: true });
  copyFileSync(RUN_COMMON, join(repoDir, '.automation', 'lib', 'run_common.sh'));
  copyFileSync(CONTROLLER_HARDENING, join(repoDir, '.automation', 'lib', 'controller_hardening_v2.sh'));
  copyFileSync(join(REPO_ROOT, '.automation', 'lib', 'temp_inode_guard.sh'), join(repoDir, '.automation', 'lib', 'temp_inode_guard.sh'));
  copyFileSync(join(REPO_ROOT, 'cleanup_automation_artifact_residue.sh'), join(repoDir, 'cleanup_automation_artifact_residue.sh'));
  execFileSync('git', ['init'], { cwd: repoDir, encoding: 'utf-8', stdio: 'pipe' });
  return { artifactsDir, dir, repoDir };
}

function assertNoRedirectedArchiveOutput(repoDir: string, outsideDir: string): void {
  assert.deepEqual(readdirSync(outsideDir), []);
  assert.equal(readdirSync(repoDir).some((entry) => entry.startsWith('.artifacts.zip.tmp.')), false);
  assert.equal(readdirSync(repoDir).some((entry) => entry.startsWith('.artifacts.zip.refresh.')), false);
  assert.equal(readdirSync(repoDir).some((entry) => entry.startsWith('.artifacts.cleanup-rebuild.')), false);
}

function makeZipCodebaseFixture(): { dir: string; repoDir: string; zipPath: string } {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-zip-codebase-'));
  const repoDir = join(dir, 'repo');
  const zipPath = join(repoDir, 'repo1.zip');

  mkdirSync(join(repoDir, 'scripts'), { recursive: true });
  mkdirSync(join(repoDir, 'src', 'reports'), { recursive: true });
  mkdirSync(join(repoDir, 'src', 'runtime'), { recursive: true });
  mkdirSync(join(repoDir, 'runtime'), { recursive: true });
  copyFileSync(ZIP_CODEBASE, join(repoDir, 'zip_codebase.sh'));
  copyFileSync(ARTIFACT_HYGIENE_VALIDATOR, join(repoDir, 'scripts', 'validate_artifact_hygiene.py'));
  writeFileSync(join(repoDir, 'README.md'), '# packaging fixture\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'PROJECT_STATUS.md'), '# fixture status\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'package.json'), '{\n  "name": "fixture"\n}\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'run-autonomous-implementation.sh'), '#!/usr/bin/env bash\nexit 0\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'scripts', 'validate_repo.py'), 'print("fixture validate_repo")\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'notes.txt'), 'safe untracked note\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'src', 'reports', 'keep.ts'), 'export const reportSource = true;\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'src', 'runtime', 'keep.ts'), 'export const runtimeSource = true;\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'runtime', 'generated.txt'), 'root runtime evidence\n', { encoding: 'utf-8' });

  mkdirSync(join(repoDir, 'artifacts', 'cycle_1'), { recursive: true });
  mkdirSync(join(repoDir, 'node_modules', 'left-pad'), { recursive: true });
  mkdirSync(join(repoDir, 'dist'), { recursive: true });
  mkdirSync(join(repoDir, '.locks'), { recursive: true });
  mkdirSync(join(repoDir, '.hg'), { recursive: true });
  mkdirSync(join(repoDir, '.svn'), { recursive: true });
  mkdirSync(join(repoDir, 'tmp'), { recursive: true });
  mkdirSync(join(repoDir, '.tmp'), { recursive: true });
  mkdirSync(join(repoDir, 'logs'), { recursive: true });

  writeFileSync(join(repoDir, '.env'), 'SECRET=1\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, '.env.local'), 'LOCAL_SECRET=1\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, '.env.production'), 'PRODUCTION_SECRET=1\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'existing-codebase.zip'), 'zip bytes\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'ziABC123'), 'interrupted zip temp bytes\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'run.log'), 'log bytes\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'scratch.tmp'), 'tmp bytes\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'artifacts', 'cycle_1', 'notes.md'), 'artifact report\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'artifacts', 'cycle_1', 'controller.log'), 'controller log\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'artifacts', 'cycle_1', 'nested.zip'), 'nested archive evidence\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'artifacts', 'cycle_1', 'runtime.lock'), 'runtime lock evidence\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'artifacts', 'cycle_1', 'scratch.tmp'), 'temporary evidence\n', { encoding: 'utf-8' });
  mkdirSync(join(repoDir, 'artifacts', 'empty-directory'), { recursive: true });
  writeFileSync(join(repoDir, 'node_modules', 'left-pad', 'index.js'), 'module.exports = "nope";\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'dist', 'bundle.js'), 'console.log("dist");\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, '.locks', 'repo.lock'), 'lock\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, '.hg', 'store'), 'hg metadata\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, '.svn', 'wc.db'), 'svn metadata\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'tmp', 'scratch.txt'), 'tmp dir\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, '.tmp', 'scratch.txt'), 'hidden tmp dir\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'logs', 'build.stderr.txt'), 'stack trace\n', { encoding: 'utf-8' });

  execFileSync('git', ['init'], { cwd: repoDir, encoding: 'utf-8', stdio: 'pipe' });
  execFileSync(
    'git',
    [
      'add',
      'README.md',
      'PROJECT_STATUS.md',
      'package.json',
      'run-autonomous-implementation.sh',
      'zip_codebase.sh',
      'scripts/validate_artifact_hygiene.py',
      'scripts/validate_repo.py',
    ],
    {
      cwd: repoDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    },
  );

  execFileSync('bash', ['zip_codebase.sh'], {
    cwd: repoDir,
    encoding: 'utf-8',
    stdio: 'pipe',
  });

  return { dir, repoDir, zipPath };
}

function requireProcessEnvValue(key: string): string {
  const value = process.env[key];
  if (value === undefined || value.length === 0) {
    throw new Error(`Missing required process environment value: ${key}`);
  }
  return value;
}

function writeInvalidGeneratedZipCommand(fakeBin: string, invalidBytes: string): void {
  const fakeZip = join(fakeBin, 'zip');
  writeFileSync(
    fakeZip,
    [
      '#!/usr/bin/env bash',
      'set -euo pipefail',
      'if [ "${1:-}" = "-q" ] && [ "${2:-}" = "-d" ]; then',
      '  exit 12',
      'fi',
      'archive=""',
      'for arg in "$@"; do',
      '  case "$arg" in *.zip) archive="$arg"; break ;; esac',
      'done',
      'if [ -z "$archive" ]; then',
      '  exit 2',
      'fi',
      `invalid_bytes=${JSON.stringify(invalidBytes)}`,
      'printf "%s\\n" "$invalid_bytes" > "$archive"',
    ].join('\n') + '\n',
    { encoding: 'utf-8' },
  );
  chmodSync(fakeZip, 0o755);
}

function writeLateSymlinkDirectoryLnCommand(fakeBin: string, destinationName: string, outsideDir: string): string {
  const realLn = execFileSync('bash', ['-lc', 'command -v ln'], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    stdio: 'pipe',
  }).trim();
  writeFileSync(
    join(fakeBin, 'ln'),
    [
      '#!/usr/bin/env bash',
      'set -euo pipefail',
      'destination=""',
      'for arg in "$@"; do',
      '  destination="$arg"',
      'done',
      'case "$destination" in',
      `  */${destinationName}|${destinationName})`,
      '    if [ ! -e "$destination" ] && [ ! -L "$destination" ]; then',
      '      "$REAL_LN" -s "$PA_FAKE_LN_OUTSIDE_DIR" "$destination"',
      '    fi',
      '    ;;',
      'esac',
      'exec "$REAL_LN" "$@"',
    ].join('\n') + '\n',
    { encoding: 'utf-8' },
  );
  chmodSync(join(fakeBin, 'ln'), 0o755);
  return realLn;
}

function makePullArtifactsFixture(collisionTarget: 'artifact' | 'remote' | 'none'): {
  dir: string;
  env: NodeJS.ProcessEnv;
  repoDir: string;
} {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-pull-artifacts-'));
  const repoDir = join(dir, 'repo');
  const fakeBin = join(dir, 'fake-bin');
  const remoteArtifactZip = join(dir, 'remote-artifacts.zip');
  const remoteCodebaseZip = join(dir, 'remote-codebase.zip');
  mkdirSync(repoDir, { recursive: true });
  mkdirSync(fakeBin, { recursive: true });
  writeFileSync(join(dir, 'remote-artifact.txt'), 'downloaded artifact bytes\n', { encoding: 'utf-8' });
  writeFileSync(join(dir, 'remote-codebase.txt'), 'downloaded remote codebase bytes\n', { encoding: 'utf-8' });
  execFileSync('zip', ['-q', '-1', remoteArtifactZip, 'remote-artifact.txt'], {
    cwd: dir,
    encoding: 'utf-8',
    stdio: 'pipe',
  });
  execFileSync('zip', ['-q', '-1', remoteCodebaseZip, 'remote-codebase.txt'], {
    cwd: dir,
    encoding: 'utf-8',
    stdio: 'pipe',
  });
  copyFileSync(PULL_AND_ZIP, join(repoDir, 'pull_artifacts_and_zip_codebase.sh'));
  writeFileSync(
    join(repoDir, 'zip_codebase.sh'),
    '#!/usr/bin/env bash\nprintf "zip called\\n" > zip-called\n',
    { encoding: 'utf-8' },
  );
  chmodSync(join(repoDir, 'zip_codebase.sh'), 0o755);
  writeFileSync(
    join(repoDir, '.env'),
    [
      'SSH_HOST=example.invalid',
      'SSH_USER=dev',
      'SSH_PASSWORD=fixture-password',
      'REMOTE_REPO=/srv/repo',
      '',
    ].join('\n'),
    { encoding: 'utf-8' },
  );
  writeFileSync(
    join(fakeBin, 'sshpass'),
    [
      '#!/usr/bin/env bash',
      'set -euo pipefail',
      'if [ "${1:-}" = "-e" ]; then',
      '  shift',
      'fi',
      'exec "$@"',
    ].join('\n') + '\n',
    { encoding: 'utf-8' },
  );
  writeFileSync(
    join(fakeBin, 'ssh'),
    [
      '#!/usr/bin/env bash',
      'set -euo pipefail',
      'while [ "$#" -gt 0 ]; do',
      '  case "$1" in',
      '    -o) shift 2 ;;',
      '    *@*) shift; break ;;',
      '    *) shift ;;',
      '  esac',
      'done',
      'remote_command="${1:-}"',
      'case "$remote_command" in',
      '  *"test -s"*) exit 0 ;;',
      '  *"stat -c %s"*)',
      '    if [[ "$remote_command" == *"repo7.zip"* ]]; then',
      '      stat -c %s -- "$PA_FAKE_REMOTE_CODEBASE_ZIP"',
      '      exit 0',
      '    fi',
      '    stat -c %s -- "$PA_FAKE_ARTIFACT_ZIP"',
      '    exit 0',
      '    ;;',
      '  *"ls -1 "*) printf "repo7.zip\\n"; exit 0 ;;',
      '  *"cat --"*)',
      '    if [[ "$remote_command" == *"repo7.zip"* ]]; then',
      '      if [ "${PA_FAKE_COLLISION_TARGET:-}" = "remote" ]; then',
      '        printf "late remote collision sentinel\\n" > remote-repo7.zip',
      '      fi',
      '      cat -- "$PA_FAKE_REMOTE_CODEBASE_ZIP"',
      '      exit 0',
      '    fi',
      '    if [ "${PA_FAKE_COLLISION_TARGET:-}" = "artifact" ]; then',
      '      printf "late artifact collision sentinel\\n" > artifacts1.zip',
      '    fi',
      '    cat -- "$PA_FAKE_ARTIFACT_ZIP"',
      '    exit 0',
      '    ;;',
      'esac',
      'printf "unexpected fake ssh command: %s\\n" "$remote_command" >&2',
      'exit 2',
    ].join('\n') + '\n',
    { encoding: 'utf-8' },
  );
  writeFileSync(
    join(fakeBin, 'pv'),
    [
      '#!/usr/bin/env bash',
      'set -euo pipefail',
      'while [ "$#" -gt 0 ]; do',
      '  case "$1" in',
      '    -s) shift 2 ;;',
      '    *) shift ;;',
      '  esac',
      'done',
      'cat',
    ].join('\n') + '\n',
    { encoding: 'utf-8' },
  );
  writeFileSync(
    join(fakeBin, 'scp'),
    '#!/usr/bin/env bash\nprintf "fake scp should not be used when fake pv is available\\n" >&2\nexit 2\n',
    { encoding: 'utf-8' },
  );
  for (const executable of ['sshpass', 'ssh', 'pv', 'scp']) {
    chmodSync(join(fakeBin, executable), 0o755);
  }
  return {
    dir,
    env: {
      ...process.env,
      PA_FAKE_COLLISION_TARGET: collisionTarget,
      PA_FAKE_ARTIFACT_ZIP: remoteArtifactZip,
      PA_FAKE_REMOTE_CODEBASE_ZIP: remoteCodebaseZip,
      PATH: `${fakeBin}:${process.env.PATH}`,
    },
    repoDir,
  };
}

function makeSourceHandoffFixture(): { dir: string; repoDir: string; archivePath: string } {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-source-handoff-'));
  const repoDir = join(dir, 'repo');
  const archiveArgument = 'artifacts/source-handoff.tar.gz';
  const archivePath = join(repoDir, archiveArgument);

  mkdirSync(join(repoDir, 'commands'), { recursive: true });
  mkdirSync(join(repoDir, 'scripts'), { recursive: true });
  mkdirSync(join(repoDir, 'tools'), { recursive: true });
  mkdirSync(join(repoDir, '.automation', 'lib'), { recursive: true });

  copyFileSync(CREATE_SOURCE_HANDOFF, join(repoDir, 'scripts', 'create-source-handoff-archive.sh'));
  copyFileSync(RESTORE_EXECUTABLE_BITS, join(repoDir, 'scripts', 'restore-required-executable-bits.js'));
  copyFileSync(ARTIFACT_HYGIENE_VALIDATOR, join(repoDir, 'scripts', 'validate_artifact_hygiene.py'));
  copyFileSync(REQUIRED_EXECUTABLE_PATHS, join(repoDir, 'tools', 'required_executable_paths.js'));

  writeFileSync(join(repoDir, 'AGENTS.md'), '# archive fixture\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'package.json'), '{\n  "name": "fixture"\n}\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, '.gitignore'), '.env\n*.zip\nzi??????\n', { encoding: 'utf-8' });

  for (const relativePath of [
    'cli.js',
    'start.sh',
    'stop.sh',
    'check_progress.sh',
    'watch_progress.sh',
    'open_log.sh',
    'update_git.sh',
    'pull_artifacts_and_zip_codebase.sh',
    'zip_codebase.sh',
    'cleanup_automation_temp_inode_residue.sh',
    'cleanup_automation_artifact_residue.sh',
    'run-autonomous-implementation.sh',
    'run-paper-evaluation.sh',
    'run-paper-autopilot.sh',
    'run-autonomous-bugfix.sh',
    'run-bugfix-autopilot.sh',
    '.automation/lib/run_common.sh',
    '.automation/lib/temp_inode_guard.sh',
    '.automation/lib/telegram_notify.sh',
    'scripts/load-node-runtime.sh',
    'commands/run-sure-001-autonomous.sh',
    'commands/run-sure-local-engine-autonomous.sh',
    'commands/run-sure-paper-mode-autonomous.sh',
    'commands/run-pinned-interface-smoke.sh',
  ]) {
    writeFileSync(join(repoDir, relativePath), '# fixture executable\n', { encoding: 'utf-8' });
  }

  writeFileSync(join(repoDir, 'README.md'), '# source handoff fixture\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, '.env'), 'SECRET=1\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'existing-codebase.zip'), 'zip bytes\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'ziABC123'), 'interrupted zip temp bytes\n', { encoding: 'utf-8' });

  mkdirSync(join(repoDir, 'artifacts', 'cycle_1'), { recursive: true });
  mkdirSync(join(repoDir, 'node_modules', 'left-pad'), { recursive: true });
  mkdirSync(join(repoDir, 'dist'), { recursive: true });
  mkdirSync(join(repoDir, '.locks'), { recursive: true });
  mkdirSync(join(repoDir, '.hg'), { recursive: true });
  mkdirSync(join(repoDir, '.svn'), { recursive: true });
  mkdirSync(join(repoDir, 'tmp'), { recursive: true });
  mkdirSync(join(repoDir, '.tmp'), { recursive: true });

  writeFileSync(join(repoDir, 'artifacts', 'cycle_1', 'notes.md'), 'artifact report\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'node_modules', 'left-pad', 'index.js'), 'module.exports = "nope";\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'dist', 'bundle.js'), 'console.log("dist");\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, '.locks', 'repo.lock'), 'lock\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, '.hg', 'store'), 'hg metadata\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, '.svn', 'wc.db'), 'svn metadata\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'tmp', 'scratch.txt'), 'tmp dir\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, '.tmp', 'scratch.txt'), 'hidden tmp dir\n', { encoding: 'utf-8' });

  execFileSync('bash', ['scripts/create-source-handoff-archive.sh', archiveArgument], {
    cwd: repoDir,
    encoding: 'utf-8',
    stdio: 'pipe',
  });

  return { dir, repoDir, archivePath };
}


test('update_git ACP records required executable modes even when core.fileMode is false', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-update-git-modes-'));
  const repoDir = join(dir, 'repo');
  const remoteDir = join(dir, 'remote.git');
  const cloneDir = join(dir, 'fresh-clone');
  try {
    mkdirSync(join(repoDir, 'tools'), { recursive: true });
    copyFileSync(UPDATE_GIT, join(repoDir, 'update_git.sh'));
    writeFileSync(
      join(repoDir, 'tools', 'required_executable_paths.js'),
      [
        'export const REQUIRED_EXECUTABLE_PATHS = Object.freeze([',
        "  'update_git.sh',",
        "  'run-bugfix-autopilot.sh',",
        ']);',
        '',
      ].join('\n'),
      { encoding: 'utf-8' },
    );
    writeFileSync(join(repoDir, 'run-bugfix-autopilot.sh'), '#!/usr/bin/env bash\nexit 0\n', { encoding: 'utf-8' });
    writeFileSync(join(repoDir, 'README.md'), '# fixture\n', { encoding: 'utf-8' });
    chmodSync(join(repoDir, 'update_git.sh'), 0o644);
    chmodSync(join(repoDir, 'run-bugfix-autopilot.sh'), 0o644);

    execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoDir, encoding: 'utf-8', stdio: 'pipe' });
    execFileSync('git', ['config', 'user.name', 'BWS Test'], { cwd: repoDir, encoding: 'utf-8', stdio: 'pipe' });
    execFileSync('git', ['config', 'user.email', 'bws-test@example.com'], { cwd: repoDir, encoding: 'utf-8', stdio: 'pipe' });
    execFileSync('git', ['config', 'core.fileMode', 'false'], { cwd: repoDir, encoding: 'utf-8', stdio: 'pipe' });
    execFileSync('git', ['add', '.'], { cwd: repoDir, encoding: 'utf-8', stdio: 'pipe' });
    execFileSync('git', ['commit', '-q', '-m', 'fixture'], { cwd: repoDir, encoding: 'utf-8', stdio: 'pipe' });

    execFileSync('git', ['init', '--bare', '-q', remoteDir], { cwd: dir, encoding: 'utf-8', stdio: 'pipe' });
    execFileSync('git', ['--git-dir', remoteDir, 'symbolic-ref', 'HEAD', 'refs/heads/main'], { cwd: dir, encoding: 'utf-8', stdio: 'pipe' });
    execFileSync('git', ['remote', 'add', 'origin', remoteDir], { cwd: repoDir, encoding: 'utf-8', stdio: 'pipe' });
    execFileSync('git', ['push', '-q', '-u', 'origin', 'main'], { cwd: repoDir, encoding: 'utf-8', stdio: 'pipe' });

    writeFileSync(join(repoDir, 'README.md'), '# fixture updated\n', { encoding: 'utf-8' });
    execFileSync('bash', ['update_git.sh', '--acp', '--message', 'test: persist executable modes'], {
      cwd: repoDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    const tree = execFileSync(
      'git',
      ['ls-tree', 'HEAD', 'update_git.sh', 'run-bugfix-autopilot.sh'],
      { cwd: repoDir, encoding: 'utf-8', stdio: 'pipe' },
    );
    assert.match(tree, /^100755 blob [0-9a-f]+\tupdate_git\.sh$/m);
    assert.match(tree, /^100755 blob [0-9a-f]+\trun-bugfix-autopilot\.sh$/m);

    execFileSync('git', ['clone', '-q', remoteDir, cloneDir], { cwd: dir, encoding: 'utf-8', stdio: 'pipe' });
    assert.notEqual(statSync(join(cloneDir, 'update_git.sh')).mode & 0o100, 0);
    assert.notEqual(statSync(join(cloneDir, 'run-bugfix-autopilot.sh')).mode & 0o100, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('final artifact refresh atomically updates post-lock summaries without recompressing the full artifacts tree', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-final-artifact-refresh-'));
  const repoDir = join(dir, 'repo');
  const runDir = join(repoDir, 'artifacts', 'autonomous_implementation_test');
  const archivePath = join(repoDir, 'artifacts.zip');
  try {
    mkdirSync(runDir, { recursive: true });
    mkdirSync(join(runDir, 'final'), { recursive: true });
    mkdirSync(join(runDir, 'betting-win', '.git'), { recursive: true });
    mkdirSync(join(runDir, 'betting-win', '.hg'), { recursive: true });
    mkdirSync(join(runDir, 'betting-win', '.svn'), { recursive: true });
    writeFileSync(join(runDir, 'final-summary.md'), 'lock_release_status=not_attempted\n', { encoding: 'utf-8' });
    writeFileSync(join(runDir, 'final', 'final-summary.md'), 'lock_release_status=not_attempted\n', { encoding: 'utf-8' });
    writeFileSync(join(runDir, 'evidence.txt'), 'preserved evidence\n', { encoding: 'utf-8' });
    writeFileSync(join(runDir, 'betting-win', '.git', 'config'), '[core]\n', { encoding: 'utf-8' });
    writeFileSync(join(runDir, 'betting-win', '.hg', 'store'), 'hg metadata\n', { encoding: 'utf-8' });
    writeFileSync(join(runDir, 'betting-win', '.svn', 'wc.db'), 'svn metadata\n', { encoding: 'utf-8' });
    execFileSync('zip', ['-q', '-1', '-r', archivePath, 'artifacts'], {
      cwd: repoDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    const releasedSummary = 'lock_release_status=released\nlock_release_exit_code=0\nlock_preserved=no\n';
    writeFileSync(join(runDir, 'final-summary.md'), releasedSummary, { encoding: 'utf-8' });
    writeFileSync(join(runDir, 'final', 'final-summary.md'), releasedSummary, { encoding: 'utf-8' });
    execFileSync(
      'bash',
      [
        '-lc',
        '. "$RUN_COMMON"; . "$CONTROLLER_HARDENING"; automation_refresh_final_artifacts_zip 30 "$REPO_DIR" "$RUN_DIR"',
      ],
      {
        cwd: repoDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          CONTROLLER_HARDENING,
          REPO_DIR: repoDir,
          RUN_COMMON,
          RUN_DIR: runDir,
        },
        stdio: 'pipe',
      },
    );

    const archivedSummary = execFileSync(
      'unzip',
      ['-p', archivePath, 'artifacts/autonomous_implementation_test/final-summary.md'],
      { cwd: repoDir, encoding: 'utf-8', stdio: 'pipe' },
    );
    const archivedNestedSummary = execFileSync(
      'unzip',
      ['-p', archivePath, 'artifacts/autonomous_implementation_test/final/final-summary.md'],
      { cwd: repoDir, encoding: 'utf-8', stdio: 'pipe' },
    );
    const archivedEvidence = execFileSync(
      'unzip',
      ['-p', archivePath, 'artifacts/autonomous_implementation_test/evidence.txt'],
      { cwd: repoDir, encoding: 'utf-8', stdio: 'pipe' },
    );
    assert.match(archivedSummary, /^lock_release_status=released$/m);
    assert.match(archivedSummary, /^lock_preserved=no$/m);
    assert.equal(archivedNestedSummary, releasedSummary);
    assert.equal(archivedEvidence, 'preserved evidence\n');
    assert.ok(!listZipEntries(archivePath).some((entry) => /\/\.(git|hg|svn)(\/|$)/u.test(entry)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('final artifact refresh preserves the published archive when the bounded update fails', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-final-artifact-refresh-failure-'));
  const repoDir = join(dir, 'repo');
  const runDir = join(repoDir, 'artifacts', 'autonomous_implementation_test');
  const archivePath = join(repoDir, 'artifacts.zip');
  try {
    mkdirSync(runDir, { recursive: true });
    writeFileSync(join(runDir, 'final-summary.md'), 'lock_release_status=not_attempted\n', { encoding: 'utf-8' });
    execFileSync('zip', ['-q', '-1', '-r', archivePath, 'artifacts'], {
      cwd: repoDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    writeFileSync(join(runDir, 'final-summary.md'), 'lock_release_status=released\n', { encoding: 'utf-8' });

    const result = spawnSync(
      'bash',
      [
        '-lc',
        '. "$RUN_COMMON"; . "$CONTROLLER_HARDENING"; automation_v2_zip_with_timeout() { return 17; }; automation_refresh_final_artifacts_zip 30 "$REPO_DIR" "$RUN_DIR"',
      ],
      {
        cwd: repoDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          CONTROLLER_HARDENING,
          REPO_DIR: repoDir,
          RUN_COMMON,
          RUN_DIR: runDir,
        },
      },
    );
    assert.equal(result.status, 17, `${result.stdout}\n${result.stderr}`);
    const archivedSummary = execFileSync(
      'unzip',
      ['-p', archivePath, 'artifacts/autonomous_implementation_test/final-summary.md'],
      { cwd: repoDir, encoding: 'utf-8', stdio: 'pipe' },
    );
    assert.equal(archivedSummary, 'lock_release_status=not_attempted\n');
    assert.equal(readdirSync(repoDir).some((entry) => entry.startsWith('.artifacts.zip.refresh.')), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('final artifact refresh rejects invalid published artifact ZIP bytes before updating summaries', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-final-artifact-refresh-invalid-published-'));
  const repoDir = join(dir, 'repo');
  const runDir = join(repoDir, 'artifacts', 'autonomous_implementation_test');
  const archivePath = join(repoDir, 'artifacts.zip');
  try {
    mkdirSync(runDir, { recursive: true });
    writeFileSync(join(runDir, 'final-summary.md'), 'lock_release_status=released\n', { encoding: 'utf-8' });
    writeFileSync(archivePath, 'invalid published artifact ZIP bytes\n', { encoding: 'utf-8' });

    const result = spawnSync(
      'bash',
      [
        '-lc',
        '. "$RUN_COMMON"; automation_refresh_final_artifacts_zip 30 "$REPO_DIR" "$RUN_DIR"',
      ],
      {
        cwd: repoDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          REPO_DIR: repoDir,
          RUN_COMMON,
          RUN_DIR: runDir,
        },
      },
    );
    assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /integrity validation failed for published archive/u);
    assert.equal(readFileSync(archivePath, 'utf-8'), 'invalid published artifact ZIP bytes\n');
    assert.equal(readdirSync(repoDir).some((entry) => entry.startsWith('.artifacts.zip.refresh.')), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('final artifact refresh rejects artifact symlinks before publishing archive changes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-final-artifact-refresh-symlink-'));
  const repoDir = join(dir, 'repo');
  const outsideDir = join(dir, 'outside');
  const runDir = join(repoDir, 'artifacts', 'autonomous_implementation_test');
  const archivePath = join(repoDir, 'artifacts.zip');
  try {
    mkdirSync(runDir, { recursive: true });
    mkdirSync(outsideDir, { recursive: true });
    writeFileSync(join(runDir, 'final-summary.md'), 'lock_release_status=not_attempted\n', { encoding: 'utf-8' });
    writeFileSync(archivePath, 'published-archive-bytes\n', { encoding: 'utf-8' });
    writeFileSync(join(outsideDir, 'secret.txt'), 'outside-content\n', { encoding: 'utf-8' });
    symlinkSync(join(outsideDir, 'secret.txt'), join(runDir, 'linked-secret.txt'));
    writeFileSync(join(runDir, 'final-summary.md'), 'lock_release_status=released\n', { encoding: 'utf-8' });

    const result = spawnSync(
      'bash',
      [
        '-lc',
        '. "$RUN_COMMON"; . "$CONTROLLER_HARDENING"; automation_refresh_final_artifacts_zip 30 "$REPO_DIR" "$RUN_DIR"',
      ],
      {
        cwd: repoDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          CONTROLLER_HARDENING,
          REPO_DIR: repoDir,
          RUN_COMMON,
          RUN_DIR: runDir,
        },
      },
    );
    assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /must not contain symlinks/u);
    assert.equal(readFileSync(archivePath, 'utf-8'), 'published-archive-bytes\n');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('artifact ZIP helpers reject symlinked artifact files and directories', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-artifact-zip-symlink-'));
  const repoDir = join(dir, 'repo');
  const outsideDir = join(dir, 'outside');
  const runDir = join(repoDir, 'artifacts', 'autonomous_implementation_20260809T020304Z');
  const archivePath = join(repoDir, 'artifacts.zip');
  try {
    mkdirSync(runDir, { recursive: true });
    mkdirSync(outsideDir, { recursive: true });
    writeFileSync(join(runDir, 'evidence.txt'), 'safe evidence\n', { encoding: 'utf-8' });
    writeFileSync(join(outsideDir, 'secret.txt'), 'outside-content\n', { encoding: 'utf-8' });
    symlinkSync(join(outsideDir, 'secret.txt'), join(runDir, 'linked-secret.txt'));

    const sharedFileResult = spawnSync(
      'bash',
      [
        '-lc',
        '. "$CONTROLLER_HARDENING"; automation_v2_zip_with_timeout 30 "$ARCHIVE_PATH" "$REPO_DIR" artifacts',
      ],
      {
        cwd: repoDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          ARCHIVE_PATH: archivePath,
          CONTROLLER_HARDENING,
          REPO_DIR: repoDir,
        },
      },
    );
    assert.equal(sharedFileResult.status, 2, `${sharedFileResult.stdout}\n${sharedFileResult.stderr}`);
    assert.match(sharedFileResult.stderr, /must not contain symlinks/u);
    assert.equal(existsSync(archivePath), false);

    rmSync(join(runDir, 'linked-secret.txt'), { force: true });
    symlinkSync(outsideDir, join(runDir, 'linked-dir'), 'dir');

    const sharedDirResult = spawnSync(
      'bash',
      [
        '-lc',
        '. "$CONTROLLER_HARDENING"; automation_v2_zip_with_timeout 30 "$ARCHIVE_PATH" "$REPO_DIR" artifacts',
      ],
      {
        cwd: repoDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          ARCHIVE_PATH: archivePath,
          CONTROLLER_HARDENING,
          REPO_DIR: repoDir,
        },
      },
    );
    assert.equal(sharedDirResult.status, 2, `${sharedDirResult.stdout}\n${sharedDirResult.stderr}`);
    assert.match(sharedDirResult.stderr, /must not contain symlinks/u);
    assert.equal(existsSync(archivePath), false);

    const runDirsArchivePath = join(repoDir, 'run-dirs.zip');
    const archiveRunDirsResult = spawnSync(
      'bash',
      [
        '-lc',
        '. "$CONTROLLER_HARDENING"; automation_v2_archive_run_dirs "$RUN_DIRS_ARCHIVE_PATH" "$REPO_DIR" "$RUN_DIR"',
      ],
      {
        cwd: repoDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          CONTROLLER_HARDENING,
          REPO_DIR: repoDir,
          RUN_DIR: runDir,
          RUN_DIRS_ARCHIVE_PATH: runDirsArchivePath,
        },
      },
    );
    assert.equal(archiveRunDirsResult.status, 2, `${archiveRunDirsResult.stdout}\n${archiveRunDirsResult.stderr}`);
    assert.match(archiveRunDirsResult.stderr, /must not contain symlinks/u);
    assert.equal(existsSync(runDirsArchivePath), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('final artifacts.zip publish helper rejects a symlinked root destination without redirecting output', () => {
  const fixture = makeRootArtifactDestinationFixture('surebet-final-artifact-destination-helper-');
  const tmpArchive = join(fixture.repoDir, '.artifacts.zip.tmp.helper.zip');
  try {
    writeFileSync(tmpArchive, 'zip bytes\n', { encoding: 'utf-8' });

    const result = spawnSync(
      'bash',
      [
        '-lc',
        '. "$RUN_COMMON"; automation_publish_final_artifacts_zip "$TMP_ARCHIVE" "$REPO_DIR"',
      ],
      {
        cwd: fixture.repoDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          REPO_DIR: fixture.repoDir,
          RUN_COMMON,
          TMP_ARCHIVE: tmpArchive,
        },
      },
    );

    assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /destination must be absent or a non-symlink regular file/u);
    assert.equal(existsSync(tmpArchive), false);
    assertNoRedirectedArchiveOutput(fixture.repoDir, fixture.outsideDir);
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test('v2 atomic publish helper rejects a symlinked archive destination without redirecting output', () => {
  const fixture = makeRootArtifactDestinationFixture('surebet-final-artifact-destination-v2-');
  const tmpArchive = join(fixture.repoDir, '.artifacts.zip.tmp.v2.zip');
  try {
    writeFileSync(tmpArchive, 'zip bytes\n', { encoding: 'utf-8' });

    const result = spawnSync(
      'bash',
      [
        '-lc',
        '. "$CONTROLLER_HARDENING"; automation_v2_publish_regular_file_atomic "$TMP_ARCHIVE" "$ARTIFACTS_ZIP" "$REPO_DIR"',
      ],
      {
        cwd: fixture.repoDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          ARTIFACTS_ZIP: fixture.artifactsZipPath,
          CONTROLLER_HARDENING,
          REPO_DIR: fixture.repoDir,
          TMP_ARCHIVE: tmpArchive,
        },
      },
    );

    assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /destination must be absent or a non-symlink regular file/u);
    assert.equal(existsSync(tmpArchive), false);
    assertNoRedirectedArchiveOutput(fixture.repoDir, fixture.outsideDir);
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test('final artifacts.zip publish helper rejects invalid candidate ZIP bytes before replacing the published archive', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-final-artifact-invalid-candidate-'));
  const repoDir = join(dir, 'repo');
  const archivePath = join(repoDir, 'artifacts.zip');
  const tmpArchive = join(repoDir, '.artifacts.zip.tmp.invalid-candidate.zip');
  try {
    mkdirSync(join(repoDir, 'artifacts', 'autonomous_implementation_test'), { recursive: true });
    writeFileSync(join(repoDir, 'artifacts', 'autonomous_implementation_test', 'evidence.txt'), 'published evidence\n', {
      encoding: 'utf-8',
    });
    execFileSync('zip', ['-q', '-1', '-r', archivePath, 'artifacts'], {
      cwd: repoDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    writeFileSync(tmpArchive, 'invalid candidate artifact ZIP bytes\n', { encoding: 'utf-8' });

    const result = spawnSync(
      'bash',
      [
        '-lc',
        '. "$RUN_COMMON"; automation_publish_final_artifacts_zip "$TMP_ARCHIVE" "$REPO_DIR"',
      ],
      {
        cwd: repoDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          REPO_DIR: repoDir,
          RUN_COMMON,
          TMP_ARCHIVE: tmpArchive,
        },
      },
    );

    assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /integrity validation failed for candidate archive/u);
    assert.equal(existsSync(tmpArchive), false);
    assert.deepEqual(listZipEntries(archivePath), [
      'artifacts',
      'artifacts/autonomous_implementation_test',
      'artifacts/autonomous_implementation_test/evidence.txt',
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('final artifacts.zip publish helper rejects outside temp archives without deleting them', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-final-artifact-outside-temp-'));
  const repoDir = join(dir, 'repo');
  const tmpArchive = join(dir, 'outside-temp.zip');
  try {
    mkdirSync(repoDir, { recursive: true });
    writeFileSync(tmpArchive, 'outside temp archive\n', { encoding: 'utf-8' });

    const result = spawnSync(
      'bash',
      [
        '-lc',
        '. "$RUN_COMMON"; automation_publish_final_artifacts_zip "$TMP_ARCHIVE" "$REPO_DIR"',
      ],
      {
        cwd: repoDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          REPO_DIR: repoDir,
          RUN_COMMON,
          TMP_ARCHIVE: tmpArchive,
        },
      },
    );

    assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /temp archive escapes repository/u);
    assert.equal(readFileSync(tmpArchive, 'utf-8'), 'outside temp archive\n');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('v2 atomic publish helper rejects outside temp files without deleting them', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-v2-publish-outside-temp-'));
  const repoDir = join(dir, 'repo');
  const tmpArchive = join(dir, 'outside-temp.zip');
  try {
    mkdirSync(repoDir, { recursive: true });
    writeFileSync(tmpArchive, 'outside temp archive\n', { encoding: 'utf-8' });

    const result = spawnSync(
      'bash',
      [
        '-lc',
        '. "$CONTROLLER_HARDENING"; automation_v2_publish_regular_file_atomic "$TMP_ARCHIVE" "$ARTIFACTS_ZIP" "$REPO_DIR"',
      ],
      {
        cwd: repoDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          ARTIFACTS_ZIP: join(repoDir, 'artifacts.zip'),
          CONTROLLER_HARDENING,
          REPO_DIR: repoDir,
          TMP_ARCHIVE: tmpArchive,
        },
      },
    );

    assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /path escapes repository/u);
    assert.equal(readFileSync(tmpArchive, 'utf-8'), 'outside temp archive\n');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('archive publish helpers reject invalid roots without deleting caller temp files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-publish-invalid-root-'));
  const validRepoDir = join(dir, 'repo');
  const missingRoot = join(dir, 'missing-root');
  const finalTempArchive = join(dir, 'final-temp.zip');
  const v2TempArchive = join(dir, 'v2-temp.zip');
  try {
    mkdirSync(validRepoDir, { recursive: true });
    writeFileSync(finalTempArchive, 'final temp archive\n', { encoding: 'utf-8' });
    writeFileSync(v2TempArchive, 'v2 temp archive\n', { encoding: 'utf-8' });

    const finalResult = spawnSync(
      'bash',
      [
        '-lc',
        '. "$RUN_COMMON"; automation_publish_final_artifacts_zip "$TMP_ARCHIVE" "$MISSING_ROOT"',
      ],
      {
        cwd: validRepoDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          MISSING_ROOT: missingRoot,
          RUN_COMMON,
          TMP_ARCHIVE: finalTempArchive,
        },
      },
    );
    assert.equal(finalResult.status, 2, `${finalResult.stdout}\n${finalResult.stderr}`);
    assert.match(finalResult.stderr, /repository root must be a non-symlink directory/u);
    assert.equal(readFileSync(finalTempArchive, 'utf-8'), 'final temp archive\n');

    const v2Result = spawnSync(
      'bash',
      [
        '-lc',
        '. "$CONTROLLER_HARDENING"; automation_v2_publish_regular_file_atomic "$TMP_ARCHIVE" "$ARTIFACTS_ZIP" "$MISSING_ROOT"',
      ],
      {
        cwd: validRepoDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          ARTIFACTS_ZIP: join(validRepoDir, 'artifacts.zip'),
          CONTROLLER_HARDENING,
          MISSING_ROOT: missingRoot,
          TMP_ARCHIVE: v2TempArchive,
        },
      },
    );
    assert.equal(v2Result.status, 2, `${v2Result.stdout}\n${v2Result.stderr}`);
    assert.match(v2Result.stderr, /working directory must be a non-symlink directory/u);
    assert.equal(readFileSync(v2TempArchive, 'utf-8'), 'v2 temp archive\n');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('final artifact refresh rejects a destination symlink swapped in immediately before publish', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-final-artifact-refresh-destination-swap-'));
  const repoDir = join(dir, 'repo');
  const outsideDir = join(dir, 'outside-artifacts-target');
  const runDir = join(repoDir, 'artifacts', 'autonomous_implementation_test');
  const archivePath = join(repoDir, 'artifacts.zip');
  try {
    mkdirSync(runDir, { recursive: true });
    mkdirSync(outsideDir, { recursive: true });
    writeFileSync(join(runDir, 'final-summary.md'), 'lock_release_status=not_attempted\n', { encoding: 'utf-8' });
    execFileSync('zip', ['-q', '-1', '-r', archivePath, 'artifacts'], {
      cwd: repoDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    writeFileSync(join(runDir, 'final-summary.md'), 'lock_release_status=released\n', { encoding: 'utf-8' });

    const result = spawnSync(
      'bash',
      [
        '-lc',
        [
          '. "$RUN_COMMON"',
          '. "$CONTROLLER_HARDENING"',
          'automation_v2_zip_with_timeout() { rm -f -- "$REPO_DIR/artifacts.zip"; ln -s -- "$OUTSIDE_DIR" "$REPO_DIR/artifacts.zip"; return 0; }',
          'automation_refresh_final_artifacts_zip 30 "$REPO_DIR" "$RUN_DIR"',
        ].join('; '),
      ],
      {
        cwd: repoDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          CONTROLLER_HARDENING,
          OUTSIDE_DIR: outsideDir,
          REPO_DIR: repoDir,
          RUN_COMMON,
          RUN_DIR: runDir,
        },
      },
    );

    assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /destination must be absent or a non-symlink regular file/u);
    assertNoRedirectedArchiveOutput(repoDir, outsideDir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('direct artifact ZIP builder rejects invalid generated archive bytes before publishing artifacts.zip', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-artifact-zip-invalid-generated-'));
  const repoDir = join(dir, 'repo');
  const fakeBin = join(dir, 'fake-bin');
  const runDir = join(repoDir, 'artifacts', 'autonomous_implementation_test');
  try {
    mkdirSync(runDir, { recursive: true });
    mkdirSync(fakeBin, { recursive: true });
    writeFileSync(join(runDir, 'evidence.txt'), 'safe evidence\n', { encoding: 'utf-8' });
    const realZip = execFileSync('bash', ['-lc', 'command -v zip'], {
      cwd: repoDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim();
    writeFileSync(
      join(fakeBin, 'zip'),
      [
        '#!/usr/bin/env bash',
        'set -euo pipefail',
        'if [[ "${1:-}" == "-T" ]]; then',
        '  exec "$REAL_ZIP" "$@"',
        'fi',
        'destination=""',
        'for arg in "$@"; do',
        '  case "$arg" in',
        '    *.zip) destination="$arg"; break ;;',
        '  esac',
        'done',
        'if [[ -z "$destination" ]]; then',
        '  exit 2',
        'fi',
        'printf "invalid generated artifact ZIP bytes\\n" > "$destination"',
        'exit 0',
      ].join('\n') + '\n',
      { encoding: 'utf-8' },
    );
    chmodSync(join(fakeBin, 'zip'), 0o755);

    const result = spawnSync(
      'bash',
      [
        '-lc',
        [
          '. "$RUN_COMMON"',
          'automation_temp_inode_check_capacity() { return 0; }',
          'automation_require_command() { command -v "$1" >/dev/null 2>&1; }',
          'AUTOMATION_ZIP_TIMEOUT=30s automation_build_artifacts_zip "$RUN_DIR" "$REPO_DIR"',
        ].join('; '),
      ],
      {
        cwd: repoDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          PATH: `${fakeBin}:${process.env.PATH}`,
          REAL_ZIP: realZip,
          REPO_DIR: repoDir,
          RUN_COMMON,
          RUN_DIR: runDir,
        },
      },
    );
    assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /integrity validation failed for candidate archive/u);
    assert.equal(existsSync(join(repoDir, 'artifacts.zip')), false);
    assert.equal(readdirSync(repoDir).some((entry) => entry.startsWith('.artifacts.zip.tmp.')), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('controller path helpers resolve relative paths against the supplied repo root', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-controller-safe-path-'));
  const repoDir = join(dir, 'repo');
  const outsideCwd = join(dir, 'outside-cwd');
  try {
    mkdirSync(join(repoDir, 'artifacts'), { recursive: true });
    mkdirSync(outsideCwd, { recursive: true });

    const insideResult = spawnSync(
      'bash',
      [
        '-lc',
        '. "$CONTROLLER_HARDENING"; cd "$OUTSIDE_CWD"; automation_v2_safe_repo_path "$REPO_DIR" artifacts/out.zip no',
      ],
      {
        cwd: repoDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          CONTROLLER_HARDENING,
          OUTSIDE_CWD: outsideCwd,
          REPO_DIR: repoDir,
        },
      },
    );
    assert.equal(insideResult.status, 0, `${insideResult.stdout}\n${insideResult.stderr}`);
    assert.equal(insideResult.stdout.trim(), join(repoDir, 'artifacts', 'out.zip'));

    const escapeResult = spawnSync(
      'bash',
      [
        '-lc',
        '. "$CONTROLLER_HARDENING"; cd "$OUTSIDE_CWD"; automation_v2_safe_repo_path "$REPO_DIR" ../outside.zip no',
      ],
      {
        cwd: repoDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          CONTROLLER_HARDENING,
          OUTSIDE_CWD: outsideCwd,
          REPO_DIR: repoDir,
        },
      },
    );
    assert.equal(escapeResult.status, 2, `${escapeResult.stdout}\n${escapeResult.stderr}`);
    assert.match(escapeResult.stderr, /escapes repository/u);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('automation run directory creation rejects unsafe slugs before creating artifacts', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-run-dir-slug-'));
  const repoDir = join(dir, 'repo');
  try {
    mkdirSync(repoDir, { recursive: true });
    const result = spawnSync(
      'bash',
      [
        '-lc',
        '. "$RUN_COMMON"; automation_temp_inode_bootstrap() { return 0; }; AUTOMATION_REPO_ROOT="$REPO_DIR"; automation_create_run_dir "../escape"',
      ],
      {
        cwd: repoDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          REPO_DIR: repoDir,
          RUN_COMMON,
        },
      },
    );
    assert.equal(result.status, 42, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /slug must be a safe basename/u);
    assert.equal(readdirSync(repoDir).some((entry) => entry.startsWith('escape_')), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('direct artifact ZIP builder rejects symlinks before publishing artifacts.zip', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-artifact-zip-builder-symlink-'));
  const repoDir = join(dir, 'repo');
  const outsideDir = join(dir, 'outside');
  const runDir = join(repoDir, 'artifacts', 'autonomous_implementation_test');
  try {
    mkdirSync(runDir, { recursive: true });
    mkdirSync(outsideDir, { recursive: true });
    writeFileSync(join(outsideDir, 'secret.txt'), 'outside-content\n', { encoding: 'utf-8' });
    symlinkSync(join(outsideDir, 'secret.txt'), join(runDir, 'linked-secret.txt'));

    const result = spawnSync(
      'bash',
      [
        '-lc',
        [
          '. "$RUN_COMMON"',
          'automation_temp_inode_check_capacity() { return 0; }',
          'automation_require_command() { command -v "$1" >/dev/null 2>&1; }',
          'automation_build_artifacts_zip "$RUN_DIR" "$REPO_DIR"',
        ].join('; '),
      ],
      {
        cwd: repoDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          REPO_DIR: repoDir,
          RUN_COMMON,
          RUN_DIR: runDir,
        },
      },
    );
    assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /must not contain symlinks/u);
    assert.equal(existsSync(join(repoDir, 'artifacts.zip')), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('direct artifact ZIP builder rejects a symlinked root artifacts.zip destination without redirecting output', () => {
  const fixture = makeRootArtifactDestinationFixture('surebet-direct-artifact-destination-');
  try {
    const result = spawnSync(
      'bash',
      [
        '-lc',
        [
          '. "$RUN_COMMON"',
          'automation_temp_inode_check_capacity() { return 0; }',
          'automation_require_command() { command -v "$1" >/dev/null 2>&1; }',
          'AUTOMATION_ZIP_TIMEOUT=30s automation_build_artifacts_zip "$RUN_DIR" "$REPO_DIR"',
        ].join('; '),
      ],
      {
        cwd: fixture.repoDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          REPO_DIR: fixture.repoDir,
          RUN_COMMON,
          RUN_DIR: fixture.runDir,
        },
      },
    );

    assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /destination must be absent or a non-symlink regular file/u);
    assertNoRedirectedArchiveOutput(fixture.repoDir, fixture.outsideDir);
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test('copied controller artifact ZIP builders reject symlinked root destinations without redirecting output', () => {
  const scripts = [
    'run-autonomous-bugfix.sh',
    'run-autonomous-implementation.sh',
    'run-bugfix-autopilot.sh',
    'run-paper-autopilot.sh',
    'run-paper-evaluation.sh',
  ];

  for (const script of scripts) {
    const fixture = makeRootArtifactDestinationFixture(`surebet-controller-artifact-destination-${script.replaceAll('.', '-')}-`);
    try {
      const result = spawnSync(
        'bash',
        [
          '-lc',
          [
            'set -Eeuo pipefail',
            '. "$RUN_COMMON"',
            '. "$CONTROLLER_HARDENING"',
            'function_text="$(awk \'found { print; if ($0 == \"}\") exit } /^build_artifacts_zip_bounded\\(\\) \\{/ { found=1; print }\' \"$SCRIPT_PATH\")"',
            'eval "$function_text"',
            'AUTOMATION_REPO_ROOT="$REPO_DIR"',
            'ZIP_TIMEOUT_SECONDS=30',
            'build_artifacts_zip_bounded',
          ].join('; '),
        ],
        {
          cwd: fixture.repoDir,
          encoding: 'utf-8',
          env: {
            ...process.env,
            CONTROLLER_HARDENING,
            REPO_DIR: fixture.repoDir,
            RUN_COMMON,
            SCRIPT_PATH: join(REPO_ROOT, script),
          },
        },
      );

      assert.equal(result.status, 2, `${script}\n${result.stdout}\n${result.stderr}`);
      assert.match(result.stderr, /destination must be absent or a non-symlink regular file/u);
      assertNoRedirectedArchiveOutput(fixture.repoDir, fixture.outsideDir);
    } finally {
      rmSync(fixture.dir, { recursive: true, force: true });
    }
  }
});

test('root artifact ZIP helpers exclude embedded VCS metadata', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-artifact-zip-vcs-'));
  const repoDir = join(dir, 'repo');
  const runDir = join(repoDir, 'artifacts', 'autonomous_implementation_test');
  const sharedArchivePath = join(repoDir, 'shared-artifacts.zip');
  try {
    mkdirSync(join(runDir, 'betting-win', '.git'), { recursive: true });
    mkdirSync(join(runDir, 'betting-win', '.hg'), { recursive: true });
    mkdirSync(join(runDir, 'betting-win', '.svn'), { recursive: true });
    writeFileSync(join(runDir, 'evidence.txt'), 'safe evidence\n', { encoding: 'utf-8' });
    writeFileSync(join(runDir, 'betting-win', '.git', 'config'), '[core]\n', { encoding: 'utf-8' });
    writeFileSync(join(runDir, 'betting-win', '.hg', 'store'), 'hg metadata\n', { encoding: 'utf-8' });
    writeFileSync(join(runDir, 'betting-win', '.svn', 'wc.db'), 'svn metadata\n', { encoding: 'utf-8' });

    const result = spawnSync(
      'bash',
      [
        '-lc',
        [
          '. "$RUN_COMMON"',
          'automation_temp_inode_check_capacity() { return 0; }',
          'automation_require_command() { command -v "$1" >/dev/null 2>&1; }',
          'automation_build_artifacts_zip "$RUN_DIR" "$REPO_DIR"',
        ].join('; '),
      ],
      {
        cwd: repoDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          REPO_DIR: repoDir,
          RUN_COMMON,
          RUN_DIR: runDir,
        },
      },
    );
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.ok(!listZipEntries(join(repoDir, 'artifacts.zip')).some((entry) => /\/\.(git|hg|svn)(\/|$)/u.test(entry)));

    const sharedResult = spawnSync(
      'bash',
      [
        '-lc',
        '. "$CONTROLLER_HARDENING"; automation_v2_zip_with_timeout 30 "$SHARED_ARCHIVE_PATH" "$REPO_DIR" artifacts',
      ],
      {
        cwd: repoDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          CONTROLLER_HARDENING,
          REPO_DIR: repoDir,
          SHARED_ARCHIVE_PATH: sharedArchivePath,
        },
      },
    );
    assert.equal(sharedResult.status, 0, `${sharedResult.stdout}\n${sharedResult.stderr}`);
    assert.ok(!listZipEntries(sharedArchivePath).some((entry) => /\/\.(git|hg|svn)(\/|$)/u.test(entry)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('run-directory archive helper canonicalizes relative archive temps under the repo', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-run-dirs-relative-'));
  const repoDir = join(dir, 'repo');
  const callerDir = join(dir, 'caller');
  const runDir = join(repoDir, 'artifacts', 'autonomous_implementation_test');
  const archivePath = join(repoDir, 'run-dirs.zip');
  try {
    mkdirSync(runDir, { recursive: true });
    mkdirSync(callerDir, { recursive: true });
    writeFileSync(join(runDir, 'evidence.txt'), 'relative archive evidence\n', { encoding: 'utf-8' });

    const result = spawnSync(
      'bash',
      [
        '-lc',
        [
          'cd "$CALLER_DIR"',
          'printf "caller sentinel\\n" > "run-dirs.zip.tmp.$$"',
          '. "$CONTROLLER_HARDENING"',
          'automation_v2_archive_run_dirs run-dirs.zip "$REPO_DIR" artifacts/autonomous_implementation_test',
        ].join('; '),
      ],
      {
        cwd: dir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          CALLER_DIR: callerDir,
          CONTROLLER_HARDENING,
          REPO_DIR: repoDir,
        },
      },
    );
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(existsSync(archivePath), true);
    assert.deepEqual(
      listZipEntries(archivePath),
      [
        'artifacts/autonomous_implementation_test',
        'artifacts/autonomous_implementation_test/evidence.txt',
      ],
    );
    const callerTempEntries = readdirSync(callerDir).filter((entry) => entry.startsWith('run-dirs.zip.tmp.'));
    assert.equal(callerTempEntries.length, 1);
    const callerTempEntry = callerTempEntries[0];
    assert.ok(callerTempEntry);
    assert.equal(readFileSync(join(callerDir, callerTempEntry), 'utf-8'), 'caller sentinel\n');
    assert.equal(readdirSync(repoDir).some((entry) => entry.startsWith('run-dirs.zip.tmp.')), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('zip_codebase help documents the numbered repo-root and artifact-only packaging contract', () => {
  const output = execFileSync('bash', [ZIP_CODEBASE, '--help'], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    stdio: 'pipe',
  });

  assert.match(output, /Creates the next numbered codebase zip in the repo root/);
  assert.match(output, /Includes git-tracked files plus untracked non-ignored files by default/);
  assert.match(output, /Uses fast Deflate level 1/);
  assert.match(output, /--artifacts-only/);
  assert.match(output, /excluding embedded VCS metadata/);
});

test('zip_codebase uses the Hyperliquid-style numbered archive and exclusion contract', () => {
  const script = read(ZIP_CODEBASE);

  assert.match(script, /zc_next_numbered_zip\(\)/);
  assert.match(script, /zc_validate_zip_integrity\(\)/);
  assert.match(script, /ls-files --cached --others --exclude-standard -z/);
  assert.match(script, /\*\.zip\|\*\.tar\|\*\.tar\.gz\|\*\.tgz\|\*\.7z\|\*\.rar/);
  assert.match(script, /created_zip=%s/);
  assert.match(script, /sha256=%s/);
  assert.match(script, /zip -q -1 -r "\$tmp_zip" artifacts/);
  assert.match(script, /zip -q -1 -@ "\$tmp_zip" < "\$list_file"/);
  assert.match(script, /\.zip-codebase-list\.tmp\.XXXXXXXXXX/);
  assert.match(script, /\|\/runtime\/\*\|/);
  assert.doesNotMatch(script, /\*\/runtime\/\*/);
  assert.doesNotMatch(script, /CODEBASE_OUTPUT/);
});

test('pull_artifacts_and_zip_codebase delegates codebase creation and rejects a cross-repo REMOTE_REPO', () => {
  const help = execFileSync('bash', [PULL_AND_ZIP, '--help'], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    stdio: 'pipe',
  });
  const script = read(PULL_AND_ZIP);

  assert.match(help, /Create a local numbered codebase zip by calling \.\/zip_codebase\.sh/);
  assert.match(help, /REMOTE_ARTIFACT/);
  assert.match(script, /REMOTE_REPO basename mismatch/);
  assert.match(script, /"\$LOCAL_ROOT\/zip_codebase\.sh"/);
  assert.match(script, /REMOTE_ARTIFACT/);
  assert.match(script, /pa_validate_zip_integrity\(\)/);
  assert.match(script, /pa_validate_zip_publish_destination\(\)/);
  assert.match(script, /pa_publish_zip_no_clobber\(\)/);
  assert.match(script, /pa_have unzip/);
  assert.match(script, /ln -T -- "\$source" "\$destination"/);
  assert.match(script, /pa_publish_zip_no_clobber "\$tmp_artifact" "\$local_artifact"/);
  assert.match(script, /pa_publish_zip_no_clobber "\$tmp_remote" "\$local_remote"/);
  assert.doesNotMatch(script, /bash \.\/zip_codebase\.sh/);
  assert.doesNotMatch(script, /source .*automation\.config\.sh|\. automation\.config\.sh/);
  assert.doesNotMatch(script, /mv "\$tmp_artifact" "\$local_artifact"/);
  assert.doesNotMatch(script, /mv "\$tmp_remote" "\$local_remote"/);
});

test('pull_artifacts_and_zip_codebase refuses a late artifact target collision without clobbering it', () => {
  const fixture = makePullArtifactsFixture('artifact');
  try {
    const result = spawnSync('bash', ['pull_artifacts_and_zip_codebase.sh'], {
      cwd: fixture.repoDir,
      encoding: 'utf-8',
      env: fixture.env,
      stdio: 'pipe',
    });
    assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /without clobbering|could not publish local artifact/u);
    assert.equal(readFileSync(join(fixture.repoDir, 'artifacts1.zip'), 'utf-8'), 'late artifact collision sentinel\n');
    assert.equal(existsSync(join(fixture.repoDir, 'zip-called')), false);
    assert.equal(readdirSync(fixture.repoDir).some((entry) => entry.startsWith('.artifacts1.zip.tmp.')), false);
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test('pull_artifacts_and_zip_codebase refuses a late artifact symlink-directory target without redirecting output', () => {
  const fixture = makePullArtifactsFixture('none');
  const fakeBin = join(fixture.dir, 'fake-bin');
  const outsideDir = join(fixture.dir, 'outside-artifact-target');
  try {
    mkdirSync(outsideDir, { recursive: true });
    const realLn = writeLateSymlinkDirectoryLnCommand(fakeBin, 'artifacts1.zip', outsideDir);

    const result = spawnSync('bash', ['pull_artifacts_and_zip_codebase.sh'], {
      cwd: fixture.repoDir,
      encoding: 'utf-8',
      env: {
        ...fixture.env,
        PA_FAKE_LN_OUTSIDE_DIR: outsideDir,
        REAL_LN: realLn,
      },
      stdio: 'pipe',
    });
    assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /without clobbering|could not publish local artifact/u);
    assert.deepEqual(readdirSync(outsideDir), []);
    assert.equal(existsSync(join(fixture.repoDir, 'zip-called')), false);
    assert.equal(readdirSync(fixture.repoDir).some((entry) => entry.startsWith('.artifacts1.zip.tmp.')), false);
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test('pull_artifacts_and_zip_codebase --remote-codebase refuses a late remote target collision without clobbering it', () => {
  const fixture = makePullArtifactsFixture('remote');
  try {
    const result = spawnSync('bash', ['pull_artifacts_and_zip_codebase.sh', '--remote-codebase'], {
      cwd: fixture.repoDir,
      encoding: 'utf-8',
      env: fixture.env,
      stdio: 'pipe',
    });
    assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /without clobbering|could not publish remote codebase/u);
    assert.equal(existsSync(join(fixture.repoDir, 'artifacts1.zip')), false);
    assert.equal(readFileSync(join(fixture.repoDir, 'remote-repo7.zip'), 'utf-8'), 'late remote collision sentinel\n');
    assert.equal(existsSync(join(fixture.repoDir, 'zip-called')), false);
    assert.equal(readdirSync(fixture.repoDir).some((entry) => entry.startsWith('.artifacts1.zip.tmp.')), false);
    assert.equal(readdirSync(fixture.repoDir).some((entry) => entry.startsWith('.remote-repo7.zip.tmp.')), false);
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test('pull_artifacts_and_zip_codebase --remote-codebase refuses a late remote symlink-directory target without redirecting output', () => {
  const fixture = makePullArtifactsFixture('none');
  const fakeBin = join(fixture.dir, 'fake-bin');
  const outsideDir = join(fixture.dir, 'outside-remote-target');
  try {
    mkdirSync(outsideDir, { recursive: true });
    const realLn = writeLateSymlinkDirectoryLnCommand(fakeBin, 'remote-repo7.zip', outsideDir);

    const result = spawnSync('bash', ['pull_artifacts_and_zip_codebase.sh', '--remote-codebase'], {
      cwd: fixture.repoDir,
      encoding: 'utf-8',
      env: {
        ...fixture.env,
        PA_FAKE_LN_OUTSIDE_DIR: outsideDir,
        REAL_LN: realLn,
      },
      stdio: 'pipe',
    });
    assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /without clobbering|could not publish remote codebase/u);
    assert.equal(existsSync(join(fixture.repoDir, 'artifacts1.zip')), true);
    assert.deepEqual(readdirSync(outsideDir), []);
    assert.equal(existsSync(join(fixture.repoDir, 'zip-called')), false);
    assert.equal(readdirSync(fixture.repoDir).some((entry) => entry.startsWith('.remote-repo7.zip.tmp.')), false);
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test('pull_artifacts_and_zip_codebase rejects invalid artifact ZIP bytes before publishing', () => {
  const fixture = makePullArtifactsFixture('none');
  const invalidArtifact = join(fixture.dir, 'invalid-artifacts.zip');
  try {
    writeFileSync(invalidArtifact, 'not a zip archive\n', { encoding: 'utf-8' });
    const result = spawnSync('bash', ['pull_artifacts_and_zip_codebase.sh'], {
      cwd: fixture.repoDir,
      encoding: 'utf-8',
      env: {
        ...fixture.env,
        PA_FAKE_ARTIFACT_ZIP: invalidArtifact,
      },
      stdio: 'pipe',
    });
    assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /failed ZIP integrity validation/u);
    assert.equal(existsSync(join(fixture.repoDir, 'artifacts1.zip')), false);
    assert.equal(existsSync(join(fixture.repoDir, 'zip-called')), false);
    assert.equal(readdirSync(fixture.repoDir).some((entry) => entry.startsWith('.artifacts1.zip.tmp.')), false);
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test('pull_artifacts_and_zip_codebase --remote-codebase rejects invalid remote codebase ZIP bytes before publishing', () => {
  const fixture = makePullArtifactsFixture('none');
  const invalidRemote = join(fixture.dir, 'invalid-remote-codebase.zip');
  try {
    writeFileSync(invalidRemote, 'not a remote codebase zip archive\n', { encoding: 'utf-8' });
    const result = spawnSync('bash', ['pull_artifacts_and_zip_codebase.sh', '--remote-codebase'], {
      cwd: fixture.repoDir,
      encoding: 'utf-8',
      env: {
        ...fixture.env,
        PA_FAKE_REMOTE_CODEBASE_ZIP: invalidRemote,
      },
      stdio: 'pipe',
    });
    assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /failed ZIP integrity validation/u);
    assert.equal(existsSync(join(fixture.repoDir, 'artifacts1.zip')), false);
    assert.equal(existsSync(join(fixture.repoDir, 'remote-repo7.zip')), false);
    assert.equal(existsSync(join(fixture.repoDir, 'zip-called')), false);
    assert.equal(readdirSync(fixture.repoDir).some((entry) => entry.startsWith('.artifacts1.zip.tmp.')), false);
    assert.equal(readdirSync(fixture.repoDir).some((entry) => entry.startsWith('.remote-repo7.zip.tmp.')), false);
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test('zip_codebase excludes local secrets, archives, artifacts, dependencies, logs, and temp files', () => {
  const fixture = makeZipCodebaseFixture();
  try {
    const entries = listZipEntries(fixture.zipPath);

    assert.deepEqual(entries, [
      'PROJECT_STATUS.md',
      'README.md',
      'notes.txt',
      'package.json',
      'run-autonomous-implementation.sh',
      'scripts/validate_artifact_hygiene.py',
      'scripts/validate_repo.py',
      'src/reports/keep.ts',
      'src/runtime/keep.ts',
      'zip_codebase.sh',
    ]);
    assert.ok(!entries.includes('.env'));
    assert.ok(!entries.includes('.env.local'));
    assert.ok(!entries.includes('.env.production'));
    assert.ok(!entries.includes('existing-codebase.zip'));
    assert.ok(!entries.includes('ziABC123'));
    assert.ok(!entries.includes('artifacts/cycle_1/notes.md'));
    assert.ok(!entries.includes('node_modules/left-pad/index.js'));
    assert.ok(!entries.includes('dist/bundle.js'));
    assert.ok(!entries.includes('.locks/repo.lock'));
    assert.ok(!entries.includes('.hg/store'));
    assert.ok(!entries.includes('.svn/wc.db'));
    assert.ok(!entries.includes('run.log'));
    assert.ok(!entries.includes('logs/build.stderr.txt'));
    assert.ok(!entries.includes('scratch.tmp'));
    assert.ok(!entries.includes('tmp/scratch.txt'));
    assert.ok(!entries.includes('.tmp/scratch.txt'));
    assert.ok(!entries.includes('runtime/generated.txt'));
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test('zip_codebase rejects source symlinks instead of following outside contents', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-zip-codebase-symlink-'));
  const repoDir = join(dir, 'repo');
  try {
    mkdirSync(repoDir, { recursive: true });
    copyFileSync(ZIP_CODEBASE, join(repoDir, 'zip_codebase.sh'));
    writeFileSync(join(repoDir, 'README.md'), '# fixture\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'outside.txt'), 'outside-content\n', { encoding: 'utf-8' });
    symlinkSync(join(dir, 'outside.txt'), join(repoDir, 'outside-link.txt'));
    const fakeBin = join(dir, 'fake-bin');
    mkdirSync(fakeBin, { recursive: true });
    const fakeGit = join(fakeBin, 'git');
    writeFileSync(fakeGit, '#!/usr/bin/env bash\nexit 127\n', { encoding: 'utf-8' });
    chmodSync(fakeGit, 0o755);

    const fallbackResult = spawnSync('bash', ['zip_codebase.sh'], {
      cwd: repoDir,
      encoding: 'utf-8',
      env: { ...process.env, PATH: `${fakeBin}:${process.env.PATH === undefined ? '' : process.env.PATH}` },
      stdio: 'pipe',
    });
    assert.equal(fallbackResult.status, 1, `${fallbackResult.stdout}\n${fallbackResult.stderr}`);
    assert.match(fallbackResult.stderr, /must not contain symlinks/u);
    assert.equal(existsSync(join(repoDir, 'repo1.zip')), false);

    execFileSync('git', ['init', '-q'], { cwd: repoDir, encoding: 'utf-8', stdio: 'pipe' });

    const result = spawnSync('bash', ['zip_codebase.sh'], {
      cwd: repoDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /must not contain symlinks/u);
    assert.equal(existsSync(join(repoDir, 'repo1.zip')), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('zip_codebase rejects invalid generated ZIP bytes before publishing a numbered codebase archive', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-zip-codebase-invalid-generated-'));
  const repoDir = join(dir, 'repo');
  const fakeBin = join(dir, 'fake-bin');
  try {
    mkdirSync(repoDir, { recursive: true });
    mkdirSync(fakeBin, { recursive: true });
    copyFileSync(ZIP_CODEBASE, join(repoDir, 'zip_codebase.sh'));
    writeFileSync(join(repoDir, 'README.md'), '# fixture\n', { encoding: 'utf-8' });
    execFileSync('git', ['init', '-q'], { cwd: repoDir, encoding: 'utf-8', stdio: 'pipe' });
    execFileSync('git', ['add', 'README.md', 'zip_codebase.sh'], { cwd: repoDir, encoding: 'utf-8', stdio: 'pipe' });
    writeInvalidGeneratedZipCommand(fakeBin, 'invalid generated codebase ZIP bytes');

    const result = spawnSync('bash', ['zip_codebase.sh'], {
      cwd: repoDir,
      encoding: 'utf-8',
      env: { ...process.env, PATH: `${fakeBin}:${requireProcessEnvValue('PATH')}` },
      stdio: 'pipe',
    });
    assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /failed ZIP integrity validation/u);
    assert.doesNotMatch(result.stdout, /created_zip=/u);
    assert.equal(existsSync(join(repoDir, 'repo1.zip')), false);
    assert.equal(readdirSync(repoDir).some((entry) => entry.startsWith('.repo1.zip.tmp.')), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('zip_codebase artifact-only mode rejects invalid generated ZIP bytes before publishing a numbered archive', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-zip-artifacts-invalid-generated-'));
  const repoDir = join(dir, 'repo');
  const fakeBin = join(dir, 'fake-bin');
  try {
    mkdirSync(join(repoDir, 'artifacts', 'cycle_1'), { recursive: true });
    mkdirSync(fakeBin, { recursive: true });
    copyFileSync(ZIP_CODEBASE, join(repoDir, 'zip_codebase.sh'));
    writeFileSync(join(repoDir, 'artifacts', 'cycle_1', 'evidence.txt'), 'safe evidence\n', { encoding: 'utf-8' });
    writeInvalidGeneratedZipCommand(fakeBin, 'invalid generated artifacts ZIP bytes');

    const result = spawnSync('bash', ['zip_codebase.sh', '--artifacts-only'], {
      cwd: repoDir,
      encoding: 'utf-8',
      env: { ...process.env, PATH: `${fakeBin}:${requireProcessEnvValue('PATH')}` },
      stdio: 'pipe',
    });
    assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /failed ZIP integrity validation/u);
    assert.doesNotMatch(result.stdout, /created_zip=/u);
    assert.equal(existsSync(join(repoDir, 'artifacts1.zip')), false);
    assert.equal(readdirSync(repoDir).some((entry) => entry.startsWith('.artifacts1.zip.tmp.')), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('zip_codebase refuses a late numbered target collision without clobbering it', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-zip-codebase-late-collision-'));
  const repoDir = join(dir, 'repo');
  const fakeBin = join(dir, 'fake-bin');
  try {
    mkdirSync(repoDir, { recursive: true });
    mkdirSync(fakeBin, { recursive: true });
    copyFileSync(ZIP_CODEBASE, join(repoDir, 'zip_codebase.sh'));
    writeFileSync(join(repoDir, 'README.md'), '# fixture\n', { encoding: 'utf-8' });
    execFileSync('git', ['init', '-q'], { cwd: repoDir, encoding: 'utf-8', stdio: 'pipe' });
    execFileSync('git', ['add', 'README.md', 'zip_codebase.sh'], { cwd: repoDir, encoding: 'utf-8', stdio: 'pipe' });
    const realZip = execFileSync('bash', ['-lc', 'command -v zip'], {
      cwd: repoDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim();

    const fakeZip = join(fakeBin, 'zip');
    writeFileSync(
      fakeZip,
      [
        '#!/usr/bin/env bash',
        'set -euo pipefail',
        'if [ "${1:-}" = "-q" ] && [ "${2:-}" = "-d" ]; then',
        '  exec "$REAL_ZIP" "$@"',
        'fi',
        'archive=""',
        'for arg in "$@"; do',
        '  case "$arg" in *.zip) archive="$arg"; break ;; esac',
        '  done',
        'if [ -z "$archive" ]; then',
        '  exit 2',
        'fi',
        'printf "late collision sentinel\\n" > repo1.zip',
        'exec "$REAL_ZIP" "$@"',
      ].join('\n') + '\n',
      { encoding: 'utf-8' },
    );
    chmodSync(fakeZip, 0o755);

    const result = spawnSync('bash', ['zip_codebase.sh'], {
      cwd: repoDir,
      encoding: 'utf-8',
      env: { ...process.env, PATH: `${fakeBin}:${requireProcessEnvValue('PATH')}`, REAL_ZIP: realZip },
      stdio: 'pipe',
    });
    assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /without clobbering|could not publish zip/u);
    assert.equal(readFileSync(join(repoDir, 'repo1.zip'), 'utf-8'), 'late collision sentinel\n');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('zip_codebase refuses a late symlink-directory numbered target without redirecting output', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-zip-codebase-late-symlink-dir-'));
  const repoDir = join(dir, 'repo');
  const fakeBin = join(dir, 'fake-bin');
  const outsideDir = join(dir, 'outside');
  try {
    mkdirSync(repoDir, { recursive: true });
    mkdirSync(fakeBin, { recursive: true });
    mkdirSync(outsideDir, { recursive: true });
    copyFileSync(ZIP_CODEBASE, join(repoDir, 'zip_codebase.sh'));
    writeFileSync(join(repoDir, 'README.md'), '# fixture\n', { encoding: 'utf-8' });
    execFileSync('git', ['init', '-q'], { cwd: repoDir, encoding: 'utf-8', stdio: 'pipe' });
    execFileSync('git', ['add', 'README.md', 'zip_codebase.sh'], { cwd: repoDir, encoding: 'utf-8', stdio: 'pipe' });
    const realZip = execFileSync('bash', ['-lc', 'command -v zip'], {
      cwd: repoDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim();

    const fakeZip = join(fakeBin, 'zip');
    writeFileSync(
      fakeZip,
      [
        '#!/usr/bin/env bash',
        'set -euo pipefail',
        'if [ "${1:-}" = "-q" ] && [ "${2:-}" = "-d" ]; then',
        '  exec "$REAL_ZIP" "$@"',
        'fi',
        'archive=""',
        'for arg in "$@"; do',
        '  case "$arg" in *.zip) archive="$arg"; break ;; esac',
        '  done',
        'if [ -z "$archive" ]; then',
        '  exit 2',
        'fi',
        'ln -s "$OUTSIDE_DIR" repo1.zip',
        'exec "$REAL_ZIP" "$@"',
      ].join('\n') + '\n',
      { encoding: 'utf-8' },
    );
    chmodSync(fakeZip, 0o755);

    const result = spawnSync('bash', ['zip_codebase.sh'], {
      cwd: repoDir,
      encoding: 'utf-8',
      env: {
        ...process.env,
        OUTSIDE_DIR: outsideDir,
        PATH: `${fakeBin}:${requireProcessEnvValue('PATH')}`,
        REAL_ZIP: realZip,
      },
      stdio: 'pipe',
    });
    assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /symlink|already exists/u);
    assert.deepEqual(readdirSync(outsideDir), []);
    assert.equal(existsSync(join(outsideDir, '.repo1.zip.tmp')), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('zip_codebase artifact-only mode recursively preserves the complete artifacts directory', () => {
  const fixture = makeZipCodebaseFixture();
  try {
    execFileSync('bash', ['zip_codebase.sh', '--artifacts-only'], {
      cwd: fixture.repoDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    const entries = listZipEntries(join(fixture.repoDir, 'artifacts1.zip'));

    for (const entry of [
      'artifacts',
      'artifacts/cycle_1',
      'artifacts/cycle_1/notes.md',
      'artifacts/cycle_1/controller.log',
      'artifacts/cycle_1/nested.zip',
      'artifacts/cycle_1/runtime.lock',
      'artifacts/cycle_1/scratch.tmp',
      'artifacts/empty-directory',
    ]) {
      assert.ok(entries.includes(entry), `missing complete artifact entry: ${entry}`);
    }
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test('zip_codebase artifact-only mode rejects symlinks and excludes embedded VCS metadata', () => {
  const fixture = makeZipCodebaseFixture();
  try {
    mkdirSync(join(fixture.repoDir, 'artifacts', 'fixture', 'betting-win', '.git'), { recursive: true });
    mkdirSync(join(fixture.repoDir, 'artifacts', 'fixture', 'betting-win', '.hg'), { recursive: true });
    mkdirSync(join(fixture.repoDir, 'artifacts', 'fixture', 'betting-win', '.svn'), { recursive: true });
    writeFileSync(join(fixture.repoDir, 'artifacts', 'fixture', 'betting-win', '.git', 'config'), '[core]\n', { encoding: 'utf-8' });
    writeFileSync(join(fixture.repoDir, 'artifacts', 'fixture', 'betting-win', '.hg', 'store'), 'hg metadata\n', { encoding: 'utf-8' });
    writeFileSync(join(fixture.repoDir, 'artifacts', 'fixture', 'betting-win', '.svn', 'wc.db'), 'svn metadata\n', { encoding: 'utf-8' });
    execFileSync('bash', ['zip_codebase.sh', '--artifacts-only'], {
      cwd: fixture.repoDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    assert.ok(!listZipEntries(join(fixture.repoDir, 'artifacts1.zip')).some((entry) => /\/\.(git|hg|svn)(\/|$)/u.test(entry)));

    writeFileSync(join(fixture.dir, 'outside.txt'), 'outside-content\n', { encoding: 'utf-8' });
    symlinkSync(join(fixture.dir, 'outside.txt'), join(fixture.repoDir, 'artifacts', 'cycle_1', 'outside-link.txt'));
    const result = spawnSync('bash', ['zip_codebase.sh', '--artifacts-only'], {
      cwd: fixture.repoDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /must not contain symlinks/u);
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test('zip_codebase artifact-only mode rejects a symlinked artifacts root', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-artifacts-root-symlink-'));
  const repoDir = join(dir, 'repo');
  const outsideArtifacts = join(dir, 'outside-artifacts');
  try {
    mkdirSync(repoDir, { recursive: true });
    mkdirSync(outsideArtifacts, { recursive: true });
    copyFileSync(ZIP_CODEBASE, join(repoDir, 'zip_codebase.sh'));
    writeFileSync(join(outsideArtifacts, 'evidence.txt'), 'outside artifact\n', { encoding: 'utf-8' });
    symlinkSync(outsideArtifacts, join(repoDir, 'artifacts'), 'dir');

    const result = spawnSync('bash', ['zip_codebase.sh', '--artifacts-only'], {
      cwd: repoDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /non-symlink directory/u);
    assert.equal(existsSync(join(repoDir, 'artifacts1.zip')), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('zip_codebase creates its codebase file list inside the repo instead of system temporary storage', () => {
  const fixture = makeZipCodebaseFixture();
  const fakeBin = join(fixture.dir, 'fake-bin');
  try {
    mkdirSync(fakeBin, { recursive: true });
    const realMktemp = execFileSync('bash', ['-lc', 'command -v mktemp'], {
      cwd: fixture.repoDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim();
    const expectedPrefix = `${fixture.repoDir}/.zip-codebase-list.tmp.`;
    const fakeMktemp = join(fakeBin, 'mktemp');
    writeFileSync(
      fakeMktemp,
      [
        '#!/usr/bin/env bash',
        `expected_prefix=${JSON.stringify(expectedPrefix)}`,
        'case "${1:-}" in',
        `  "$expected_prefix"*) exec ${JSON.stringify(realMktemp)} "$@" ;;`,
        `  *) printf 'unexpected mktemp invocation: %q\\n' "\${1:-<none>}" >&2; exit 91 ;;`,
        'esac',
        '',
      ].join('\n'),
      { encoding: 'utf-8' },
    );
    chmodSync(fakeMktemp, 0o755);

    execFileSync('bash', ['zip_codebase.sh'], {
      cwd: fixture.repoDir,
      encoding: 'utf-8',
      stdio: 'pipe',
      env: { ...process.env, PATH: `${fakeBin}:${process.env.PATH ?? ''}`, TMPDIR: '/read-only-system-tmp' },
    });

    assert.equal(existsSync(join(fixture.repoDir, 'repo2.zip')), true);
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test('source handoff archive excludes local env, archives, artifacts, dependencies, build output, locks, and temp files', () => {
  const script = read(CREATE_SOURCE_HANDOFF);
  const fixture = makeSourceHandoffFixture();
  try {
    const entries = listTarEntries(fixture.archivePath);

    assert.match(script, /--exclude='\*\.log'/);
    assert.match(script, /--exclude='\*\.tmp'/);

    assert.ok(entries.includes('./AGENTS.md'));
    assert.ok(entries.includes('./README.md'));
    assert.ok(entries.includes('./scripts/create-source-handoff-archive.sh'));
    assert.ok(entries.includes('./tools/required_executable_paths.js'));

    assert.ok(!entries.includes('./.env'));
    assert.ok(!entries.includes('./existing-codebase.zip'));
    assert.ok(!entries.includes('./ziABC123'));
    assert.ok(!entries.includes('./artifacts/cycle_1/notes.md'));
    assert.ok(!entries.includes('./node_modules/left-pad/index.js'));
    assert.ok(!entries.includes('./dist/bundle.js'));
    assert.ok(!entries.includes('./.locks/repo.lock'));
    assert.ok(!entries.includes('./.hg/store'));
    assert.ok(!entries.includes('./.svn/wc.db'));
    assert.ok(!entries.includes('./tmp/scratch.txt'));
    assert.ok(!entries.includes('./.tmp/scratch.txt'));
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test('source handoff archive rejects included source symlinks and non-artifact output paths', () => {
  const fixture = makeSourceHandoffFixture();
  try {
    writeFileSync(join(fixture.dir, 'outside.txt'), 'outside-content\n', { encoding: 'utf-8' });
    symlinkSync(join(fixture.dir, 'outside.txt'), join(fixture.repoDir, 'outside-link.txt'));

    const symlinkResult = spawnSync(
      'bash',
      ['scripts/create-source-handoff-archive.sh', 'artifacts/source-handoff-2.tar.gz'],
      {
        cwd: fixture.repoDir,
        encoding: 'utf-8',
        stdio: 'pipe',
      },
    );
    assert.equal(symlinkResult.status, 1, `${symlinkResult.stdout}\n${symlinkResult.stderr}`);
    assert.match(symlinkResult.stderr, /must not contain symlinks/u);

    rmSync(join(fixture.repoDir, 'outside-link.txt'), { force: true });
    const outputResult = spawnSync(
      'bash',
      ['scripts/create-source-handoff-archive.sh', join(fixture.dir, 'outside.tar.gz')],
      {
        cwd: fixture.repoDir,
        encoding: 'utf-8',
        stdio: 'pipe',
      },
    );
    assert.equal(outputResult.status, 1, `${outputResult.stdout}\n${outputResult.stderr}`);
    assert.match(outputResult.stderr, /output path must be a safe repo-relative artifacts path|output archive must be under artifacts/u);
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test('artifact residue cleanup removes only allowlisted scratch and preserves controller evidence', () => {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-artifact-residue-cleanup-'));
  const repoDir = join(dir, 'repo');
  const artifactsDir = join(repoDir, 'artifacts');
  const runDir = join(artifactsDir, 'bugfix_autopilot_20260809T000000Z');
  const auditRunDir = join(artifactsDir, 'autonomous_bugfix_20260809T010203Z');
  const auditReproDir = join(auditRunDir, 'cycles', 'cycle_1', 'repro', 'partial-output');
  const privatePaperDir = join(artifactsDir, 'private-paper-mode');
  const testTmpDir = join(artifactsDir, 'test-tmp', 'negative-symlink-fixture');
  const releaseDir = join(artifactsDir, 'bws-release-package-ABC123');
  const unknownDir = join(artifactsDir, 'operator-evidence-custom');
  const outsideFile = join(dir, 'outside.txt');
  const archivePath = join(repoDir, 'artifacts.zip');

  try {
    mkdirSync(runDir, { recursive: true });
    mkdirSync(auditReproDir, { recursive: true });
    mkdirSync(privatePaperDir, { recursive: true });
    mkdirSync(testTmpDir, { recursive: true });
    mkdirSync(releaseDir, { recursive: true });
    mkdirSync(unknownDir, { recursive: true });
    writeFileSync(join(runDir, 'final_summary.txt'), 'final_status=TEST\n', 'utf-8');
    writeFileSync(join(auditReproDir, 'reproduction.txt'), 'preserve repro evidence\n', 'utf-8');
    writeFileSync(join(privatePaperDir, 'report.json'), '{}\n', 'utf-8');
    writeFileSync(join(releaseDir, 'release.txt'), 'scratch\n', 'utf-8');
    writeFileSync(join(unknownDir, 'evidence.txt'), 'preserve\n', 'utf-8');
    writeFileSync(outsideFile, 'outside\n', 'utf-8');
    symlinkSync(outsideFile, join(testTmpDir, 'outside-link.txt'));
    const auditReproLink = join(auditReproDir, 'b-blocked.report.json');
    symlinkSync(outsideFile, auditReproLink);

    const planResult = spawnSync(
      'bash',
      ['-lc', '. "$RUN_COMMON"; automation_cleanup_transient_artifact_residue "$REPO_DIR" plan 0'],
      {
        cwd: repoDir,
        encoding: 'utf-8',
        env: { ...process.env, REPO_DIR: repoDir, RUN_COMMON },
      },
    );
    assert.equal(planResult.status, 0, `${planResult.stdout}\n${planResult.stderr}`);
    assert.match(planResult.stdout, /artifact_cleanup_selected=3/u);
    assert.match(planResult.stdout, /artifact_cleanup_repro_symlinks_selected=1/u);
    assert.equal(existsSync(testTmpDir), true);
    assert.equal(existsSync(releaseDir), true);

    const packageResult = spawnSync(
      'bash',
      [
        '-lc',
        'set -euo pipefail; . "$RUN_COMMON"; . "$CONTROLLER_HARDENING"; automation_v2_zip_with_timeout 30 "$ARCHIVE_PATH" "$REPO_DIR" artifacts',
      ],
      {
        cwd: repoDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          ARCHIVE_PATH: archivePath,
          CONTROLLER_HARDENING,
          REPO_DIR: repoDir,
          RUN_COMMON,
        },
      },
    );
    assert.equal(packageResult.status, 0, `${packageResult.stdout}\n${packageResult.stderr}`);
    assert.equal(existsSync(testTmpDir), false);
    assert.equal(existsSync(releaseDir), false);
    assert.equal(existsSync(runDir), true);
    assert.equal(existsSync(auditRunDir), true);
    assert.equal(existsSync(auditReproLink), false);
    assert.equal(existsSync(join(auditReproDir, 'reproduction.txt')), true);
    assert.equal(existsSync(privatePaperDir), true);
    assert.equal(existsSync(unknownDir), true);

    const entries = listZipEntries(archivePath);
    assert.ok(entries.includes('artifacts/bugfix_autopilot_20260809T000000Z/final_summary.txt'));
    assert.ok(entries.includes('artifacts/autonomous_bugfix_20260809T010203Z/cycles/cycle_1/repro/partial-output/reproduction.txt'));
    assert.ok(!entries.includes('artifacts/autonomous_bugfix_20260809T010203Z/cycles/cycle_1/repro/partial-output/b-blocked.report.json'));
    assert.ok(entries.includes('artifacts/private-paper-mode/report.json'));
    assert.ok(entries.includes('artifacts/operator-evidence-custom/evidence.txt'));
    assert.ok(!entries.some((entry) => entry.startsWith('artifacts/test-tmp')));
    assert.ok(!entries.some((entry) => entry.startsWith('artifacts/bws-release-package-')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('artifact residue cleanup rebuild preserves fresh allowlisted residue below minimum age', () => {
  const fixture = makeArtifactResidueCleanupFixture('surebet-cleanup-rebuild-fresh-');
  const freshDir = join(fixture.artifactsDir, 'test-tmp');
  const runDir = join(fixture.artifactsDir, 'autonomous_implementation_20260809T020304Z');
  try {
    mkdirSync(freshDir, { recursive: true });
    mkdirSync(runDir, { recursive: true });
    writeFileSync(join(freshDir, 'fresh.txt'), 'fresh transient artifact\n', { encoding: 'utf-8' });
    writeFileSync(join(runDir, 'evidence.txt'), 'retained evidence\n', { encoding: 'utf-8' });

    const result = spawnSync(
      'bash',
      ['cleanup_automation_artifact_residue.sh', '--apply', '--min-age-seconds', '3600', '--rebuild-artifacts-zip', '--zip-timeout', '30s'],
      {
        cwd: fixture.repoDir,
        encoding: 'utf-8',
        env: process.env,
      },
    );

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /artifact_cleanup_selected=0/u);
    assert.match(result.stdout, /artifact_cleanup_removed=0/u);
    assert.match(result.stdout, /artifact_archive_rebuilt=/u);
    assert.equal(existsSync(freshDir), true);
    const entries = listZipEntries(join(fixture.repoDir, 'artifacts.zip'));
    assert.ok(entries.includes('artifacts/test-tmp/fresh.txt'));
    assert.ok(entries.includes('artifacts/autonomous_implementation_20260809T020304Z/evidence.txt'));
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test('artifact residue cleanup rebuild removes age-eligible residue and publishes valid archive', () => {
  const fixture = makeArtifactResidueCleanupFixture('surebet-cleanup-rebuild-old-');
  const oldDir = join(fixture.artifactsDir, 'test-tmp');
  const runDir = join(fixture.artifactsDir, 'autonomous_implementation_20260809T020304Z');
  try {
    mkdirSync(oldDir, { recursive: true });
    mkdirSync(runDir, { recursive: true });
    writeFileSync(join(oldDir, 'old.txt'), 'old transient artifact\n', { encoding: 'utf-8' });
    writeFileSync(join(runDir, 'evidence.txt'), 'retained evidence\n', { encoding: 'utf-8' });
    execFileSync('touch', ['-d', '1970-01-01 00:00:00 UTC', oldDir], {
      cwd: fixture.repoDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    const result = spawnSync(
      'bash',
      ['cleanup_automation_artifact_residue.sh', '--apply', '--min-age-seconds', '3600', '--rebuild-artifacts-zip', '--zip-timeout', '30s'],
      {
        cwd: fixture.repoDir,
        encoding: 'utf-8',
        env: process.env,
      },
    );

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /artifact_cleanup_selected=1/u);
    assert.match(result.stdout, /artifact_cleanup_removed=1/u);
    assert.match(result.stdout, /artifact_archive_rebuilt=/u);
    assert.equal(existsSync(oldDir), false);
    execFileSync('unzip', ['-tq', join(fixture.repoDir, 'artifacts.zip')], {
      cwd: fixture.repoDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    const entries = listZipEntries(join(fixture.repoDir, 'artifacts.zip'));
    assert.ok(entries.includes('artifacts/autonomous_implementation_20260809T020304Z/evidence.txt'));
    assert.ok(!entries.some((entry) => entry.startsWith('artifacts/test-tmp')));
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test('artifact residue cleanup rebuild rejects a symlinked root artifacts.zip destination without redirecting output', () => {
  const fixture = makeRootArtifactDestinationFixture('surebet-cleanup-artifact-destination-');
  try {
    mkdirSync(join(fixture.repoDir, '.automation', 'lib'), { recursive: true });
    copyFileSync(RUN_COMMON, join(fixture.repoDir, '.automation', 'lib', 'run_common.sh'));
    copyFileSync(CONTROLLER_HARDENING, join(fixture.repoDir, '.automation', 'lib', 'controller_hardening_v2.sh'));
    copyFileSync(join(REPO_ROOT, '.automation', 'lib', 'temp_inode_guard.sh'), join(fixture.repoDir, '.automation', 'lib', 'temp_inode_guard.sh'));
    copyFileSync(join(REPO_ROOT, 'cleanup_automation_artifact_residue.sh'), join(fixture.repoDir, 'cleanup_automation_artifact_residue.sh'));
    execFileSync('git', ['init'], { cwd: fixture.repoDir, encoding: 'utf-8', stdio: 'pipe' });

    const result = spawnSync(
      'bash',
      ['cleanup_automation_artifact_residue.sh', '--apply', '--min-age-seconds', '0', '--rebuild-artifacts-zip', '--zip-timeout', '30s'],
      {
        cwd: fixture.repoDir,
        encoding: 'utf-8',
        env: process.env,
      },
    );

    assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /destination must be absent or a non-symlink regular file/u);
    assertNoRedirectedArchiveOutput(fixture.repoDir, fixture.outsideDir);
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});
