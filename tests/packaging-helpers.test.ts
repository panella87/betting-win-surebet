import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
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
  const archivePath = join(dir, 'source-handoff.tar.gz');

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
  mkdirSync(join(repoDir, 'tmp'), { recursive: true });
  mkdirSync(join(repoDir, '.tmp'), { recursive: true });

  writeFileSync(join(repoDir, 'artifacts', 'cycle_1', 'notes.md'), 'artifact report\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'node_modules', 'left-pad', 'index.js'), 'module.exports = "nope";\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'dist', 'bundle.js'), 'console.log("dist");\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, '.locks', 'repo.lock'), 'lock\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'tmp', 'scratch.txt'), 'tmp dir\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, '.tmp', 'scratch.txt'), 'hidden tmp dir\n', { encoding: 'utf-8' });

  execFileSync('bash', ['scripts/create-source-handoff-archive.sh', archivePath], {
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
    writeFileSync(join(runDir, 'final-summary.md'), 'lock_release_status=not_attempted\n', { encoding: 'utf-8' });
    writeFileSync(join(runDir, 'final', 'final-summary.md'), 'lock_release_status=not_attempted\n', { encoding: 'utf-8' });
    writeFileSync(join(runDir, 'evidence.txt'), 'preserved evidence\n', { encoding: 'utf-8' });
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
    assert.ok(!entries.includes('./tmp/scratch.txt'));
    assert.ok(!entries.includes('./.tmp/scratch.txt'));
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});
