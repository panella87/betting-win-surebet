import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const VALIDATOR = join(REPO_ROOT, 'scripts', 'validate_artifact_hygiene.py');

function makeZip(entries: Record<string, string>): { dir: string; zipPath: string } {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-artifact-hygiene-'));
  const zipPath = join(dir, 'fixture.zip');
  const manifestPath = join(dir, 'entries.json');
  writeFileSync(manifestPath, JSON.stringify(entries), { encoding: 'utf-8' });
  execFileSync(
    'python3',
    [
      '-c',
      [
        'import json',
        'import pathlib',
        'import sys',
        'import zipfile',
        'target = pathlib.Path(sys.argv[1])',
        'entries = json.loads(pathlib.Path(sys.argv[2]).read_text(encoding="utf-8"))',
        'with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_STORED) as archive:',
        '    for name, contents in entries.items():',
        '        archive.writestr(name, contents)',
      ].join('\n'),
      zipPath,
      manifestPath,
    ],
    { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' },
  );
  return { dir, zipPath };
}

test('artifact hygiene validator rejects secret-like exact filenames in codebase zips', () => {
  const fixture = makeZip({
    'README.md': 'ok\n',
    '.env.local': 'LOCAL_ONLY=true\n',
  });
  try {
    assert.throws(
      () => execFileSync('python3', [VALIDATOR, '--codebase-zip', fixture.zipPath], { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /forbidden exact path in archive: \.env\.local/);
        return true;
      },
    );
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test('artifact hygiene validator rejects generated log-style files in codebase zips', () => {
  const fixture = makeZip({
    'README.md': 'ok\n',
    'logs/build.stderr.txt': 'stack trace\n',
  });
  try {
    assert.throws(
      () => execFileSync('python3', [VALIDATOR, '--codebase-zip', fixture.zipPath], { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /forbidden generated file in archive: logs\/build\.stderr\.txt/);
        return true;
      },
    );
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});
