import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

const REPO_ROOT = process.cwd();
const VALIDATOR = join(REPO_ROOT, 'scripts', 'validate_source_manifest.py');
const REGENERATOR = join(REPO_ROOT, 'scripts', 'regenerate_source_manifest.py');

type ManifestEntry = {
  path: string;
  sha256: string;
  size: number;
};

function sha256(contents: string): string {
  return createHash('sha256').update(contents).digest('hex');
}

function makeFixture(overrideManifest?: Partial<{ generated: string; overlay: string; files: ManifestEntry[] }>): string {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-source-manifest-'));
  const validatorCopy = join(dir, 'scripts', 'validate_source_manifest.py');
  const regeneratorCopy = join(dir, 'scripts', 'regenerate_source_manifest.py');
  mkdirSync(dirname(validatorCopy), { recursive: true });
  copyFileSync(VALIDATOR, validatorCopy);
  copyFileSync(REGENERATOR, regeneratorCopy);

  const readmePath = join(dir, 'README.md');
  const readmeContents = '# source manifest fixture\n';
  writeFileSync(readmePath, readmeContents, { encoding: 'utf-8' });

  const validatorContents = readFileSync(validatorCopy, 'utf-8');
  const regeneratorContents = readFileSync(regeneratorCopy, 'utf-8');

  const files: ManifestEntry[] = [
    {
      path: 'README.md',
      sha256: sha256(readmeContents),
      size: Buffer.byteLength(readmeContents, 'utf-8'),
    },
    {
      path: 'scripts/regenerate_source_manifest.py',
      sha256: sha256(regeneratorContents),
      size: Buffer.byteLength(regeneratorContents, 'utf-8'),
    },
    {
      path: 'scripts/validate_source_manifest.py',
      sha256: sha256(validatorContents),
      size: Buffer.byteLength(validatorContents, 'utf-8'),
    },
  ];

  writeFileSync(
    join(dir, 'SOURCE_MANIFEST.json'),
    JSON.stringify(
      {
        schema: 'betting-win-surebet-source-manifest-v1',
        generated: '2026-07-02T00:00:00Z',
        overlay: 'SURE-001 source manifest validator contract test fixture',
        files,
        ...overrideManifest,
      },
      null,
      2,
    ) + '\n',
    { encoding: 'utf-8' },
  );

  return dir;
}

test('source manifest validator accepts a matching tree with audit metadata', () => {
  const dir = makeFixture();
  try {
    const output = execFileSync('python3', ['scripts/validate_source_manifest.py'], { cwd: dir, encoding: 'utf-8', stdio: 'pipe' });
    assert.match(output, /validate_source_manifest: ok/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('source manifest validator rejects missing overlay metadata before tree comparison', () => {
  const dir = makeFixture({ overlay: '' });
  try {
    assert.throws(
      () => execFileSync('python3', ['scripts/validate_source_manifest.py'], { cwd: dir, encoding: 'utf-8', stdio: 'pipe' }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /SOURCE_MANIFEST\.json overlay must be a non-empty string/);
        return true;
      },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('source manifest regeneration helper reuses validator inclusion rules and excludes generated junk', () => {
  const dir = makeFixture();
  try {
    mkdirSync(join(dir, 'node_modules', 'left-pad'), { recursive: true });
    mkdirSync(join(dir, 'dist'), { recursive: true });
    mkdirSync(join(dir, 'artifacts', 'cycle_1'), { recursive: true });
    mkdirSync(join(dir, '.locks'), { recursive: true });
    mkdirSync(join(dir, 'tmp'), { recursive: true });
    mkdirSync(join(dir, '.tmp'), { recursive: true });
    writeFileSync(join(dir, '.env'), 'SECRET=1\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'repo.zip'), 'zip bytes\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'run.log'), 'log bytes\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'scratch.tmp'), 'tmp bytes\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'module.pyc'), 'pyc bytes\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'node_modules', 'left-pad', 'index.js'), 'module.exports = "nope";\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'dist', 'bundle.js'), 'console.log("dist");\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'artifacts', 'cycle_1', 'notes.md'), 'artifact\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.locks', 'repo.lock'), 'lock\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'tmp', 'scratch.txt'), 'tmp dir\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.tmp', 'scratch.txt'), 'hidden tmp dir\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'notes.txt'), 'keep me\n', { encoding: 'utf-8' });

    execFileSync('python3', ['scripts/regenerate_source_manifest.py'], { cwd: dir, encoding: 'utf-8', stdio: 'pipe' });

    const manifest = JSON.parse(readFileSync(join(dir, 'SOURCE_MANIFEST.json'), 'utf-8')) as {
      overlay: string;
      files: ManifestEntry[];
    };
    const paths = manifest.files.map((entry) => entry.path);

    assert.equal(manifest.overlay, 'SURE-001 source manifest validator contract test fixture');
    assert.deepEqual(paths, [
      'README.md',
      'notes.txt',
      'scripts/regenerate_source_manifest.py',
      'scripts/validate_source_manifest.py',
    ]);

    const output = execFileSync('python3', ['scripts/validate_source_manifest.py'], { cwd: dir, encoding: 'utf-8', stdio: 'pipe' });
    assert.match(output, /validate_source_manifest: ok/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
