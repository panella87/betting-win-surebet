import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const ZIP_CODEBASE = join(REPO_ROOT, 'zip_codebase.sh');
const PULL_AND_ZIP = join(REPO_ROOT, 'pull_artifacts_and_zip_codebase.sh');
const CREATE_SOURCE_HANDOFF = join(REPO_ROOT, 'scripts', 'create-source-handoff-archive.sh');
const ARTIFACT_HYGIENE_VALIDATOR = join(REPO_ROOT, 'scripts', 'validate_artifact_hygiene.py');
const RESTORE_EXECUTABLE_BITS = join(REPO_ROOT, 'scripts', 'restore-required-executable-bits.js');
const REQUIRED_EXECUTABLE_PATHS = join(REPO_ROOT, 'tools', 'required_executable_paths.js');

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
  copyFileSync(ZIP_CODEBASE, join(repoDir, 'zip_codebase.sh'));
  copyFileSync(ARTIFACT_HYGIENE_VALIDATOR, join(repoDir, 'scripts', 'validate_artifact_hygiene.py'));
  writeFileSync(join(repoDir, 'README.md'), '# packaging fixture\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'PROJECT_STATUS.md'), '# fixture status\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'package.json'), '{\n  "name": "fixture"\n}\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'run-autonomous-implementation.sh'), '#!/usr/bin/env bash\nexit 0\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'scripts', 'validate_repo.py'), 'print("fixture validate_repo")\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'notes.txt'), 'safe untracked note\n', { encoding: 'utf-8' });

  mkdirSync(join(repoDir, 'artifacts', 'cycle_1'), { recursive: true });
  mkdirSync(join(repoDir, 'node_modules', 'left-pad'), { recursive: true });
  mkdirSync(join(repoDir, 'dist'), { recursive: true });
  mkdirSync(join(repoDir, '.locks'), { recursive: true });
  mkdirSync(join(repoDir, 'tmp'), { recursive: true });
  mkdirSync(join(repoDir, '.tmp'), { recursive: true });
  mkdirSync(join(repoDir, 'logs'), { recursive: true });

  writeFileSync(join(repoDir, '.env'), 'SECRET=1\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'existing-codebase.zip'), 'zip bytes\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'run.log'), 'log bytes\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'scratch.tmp'), 'tmp bytes\n', { encoding: 'utf-8' });
  writeFileSync(join(repoDir, 'artifacts', 'cycle_1', 'notes.md'), 'artifact report\n', { encoding: 'utf-8' });
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
  writeFileSync(join(repoDir, '.gitignore'), '.env\n*.zip\n', { encoding: 'utf-8' });

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
    'run-autonomous-implementation.sh',
    'run-paper-evaluation.sh',
    'run-autonomous-bugfix.sh',
    '.automation/lib/run_common.sh',
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

test('zip_codebase help documents the numbered repo-root packaging contract', () => {
  const output = execFileSync('bash', [ZIP_CODEBASE, '--help'], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    stdio: 'pipe',
  });

  assert.match(output, /Creates the next numbered codebase zip in the repository root/);
  assert.match(output, /Untracked non-ignored files are included by default/);
  assert.match(output, /Existing zip\/archive files/);
});

test('zip_codebase uses the shared numbered archive and exclusion contract', () => {
  const script = read(ZIP_CODEBASE);

  assert.match(script, /next_numbered_zip_path\(\)/);
  assert.match(script, /git -C "\$REPO_ROOT" ls-files -z --cached --others --exclude-standard/);
  assert.match(script, /\*\.zip\|\*\.tar\|\*\.tar\.gz\|\*\.tgz\|\*\.7z\|\*\.rar/);
  assert.match(script, /CODEBASE_ZIP_CREATED=%s/);
  assert.match(script, /SHA256=%s/);
  assert.doesNotMatch(script, /CODEBASE_OUTPUT/);
});

test('pull_artifacts_and_zip_codebase delegates codebase creation to the repo-local helper', () => {
  const help = execFileSync('bash', [PULL_AND_ZIP, '--help'], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    stdio: 'pipe',
  });
  const script = read(PULL_AND_ZIP);

  assert.match(help, /Create a local numbered codebase zip by calling \.\/zip_codebase\.sh/);
  assert.match(script, /bash \.\/zip_codebase\.sh/);
  assert.doesNotMatch(script, /automation\.config\.sh/);
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
      'zip_codebase.sh',
    ]);
    assert.ok(!entries.includes('.env'));
    assert.ok(!entries.includes('existing-codebase.zip'));
    assert.ok(!entries.includes('artifacts/cycle_1/notes.md'));
    assert.ok(!entries.includes('node_modules/left-pad/index.js'));
    assert.ok(!entries.includes('dist/bundle.js'));
    assert.ok(!entries.includes('.locks/repo.lock'));
    assert.ok(!entries.includes('run.log'));
    assert.ok(!entries.includes('logs/build.stderr.txt'));
    assert.ok(!entries.includes('scratch.tmp'));
    assert.ok(!entries.includes('tmp/scratch.txt'));
    assert.ok(!entries.includes('.tmp/scratch.txt'));
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
