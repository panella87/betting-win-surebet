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
  const runDir = join(repoDir, 'artifacts', 'autonomous_implementation_test');
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
  assert.doesNotMatch(script, /bash \.\/zip_codebase\.sh/);
  assert.doesNotMatch(script, /source .*automation\.config\.sh|\. automation\.config\.sh/);
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
        '  done',
        'if [ -z "$archive" ]; then',
        '  exit 2',
        'fi',
        'printf "late collision sentinel\\n" > repo1.zip',
        'printf "temporary zip candidate\\n" > "$archive"',
      ].join('\n') + '\n',
      { encoding: 'utf-8' },
    );
    chmodSync(fakeZip, 0o755);

    const result = spawnSync('bash', ['zip_codebase.sh'], {
      cwd: repoDir,
      encoding: 'utf-8',
      env: { ...process.env, PATH: `${fakeBin}:${process.env.PATH === undefined ? '' : process.env.PATH}` },
      stdio: 'pipe',
    });
    assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /without clobbering|could not publish zip/u);
    assert.equal(readFileSync(join(repoDir, 'repo1.zip'), 'utf-8'), 'late collision sentinel\n');
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
  const privatePaperDir = join(artifactsDir, 'private-paper-mode');
  const testTmpDir = join(artifactsDir, 'test-tmp', 'negative-symlink-fixture');
  const releaseDir = join(artifactsDir, 'bws-release-package-ABC123');
  const unknownDir = join(artifactsDir, 'operator-evidence-custom');
  const outsideFile = join(dir, 'outside.txt');
  const archivePath = join(repoDir, 'artifacts.zip');

  try {
    mkdirSync(runDir, { recursive: true });
    mkdirSync(privatePaperDir, { recursive: true });
    mkdirSync(testTmpDir, { recursive: true });
    mkdirSync(releaseDir, { recursive: true });
    mkdirSync(unknownDir, { recursive: true });
    writeFileSync(join(runDir, 'final_summary.txt'), 'final_status=TEST\n', 'utf-8');
    writeFileSync(join(privatePaperDir, 'report.json'), '{}\n', 'utf-8');
    writeFileSync(join(releaseDir, 'release.txt'), 'scratch\n', 'utf-8');
    writeFileSync(join(unknownDir, 'evidence.txt'), 'preserve\n', 'utf-8');
    writeFileSync(outsideFile, 'outside\n', 'utf-8');
    symlinkSync(outsideFile, join(testTmpDir, 'outside-link.txt'));

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
    assert.match(planResult.stdout, /artifact_cleanup_selected=2/u);
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
    assert.equal(existsSync(privatePaperDir), true);
    assert.equal(existsSync(unknownDir), true);

    const entries = listZipEntries(archivePath);
    assert.ok(entries.includes('artifacts/bugfix_autopilot_20260809T000000Z/final_summary.txt'));
    assert.ok(entries.includes('artifacts/private-paper-mode/report.json'));
    assert.ok(entries.includes('artifacts/operator-evidence-custom/evidence.txt'));
    assert.ok(!entries.some((entry) => entry.startsWith('artifacts/test-tmp')));
    assert.ok(!entries.some((entry) => entry.startsWith('artifacts/bws-release-package-')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
