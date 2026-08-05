import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const VALIDATOR = join(REPO_ROOT, 'scripts', 'validate_artifact_hygiene.py');

interface ZipEntry {
  readonly contents: string;
  readonly externalAttr?: number;
  readonly name: string;
}

function makeZip(entries: Record<string, string>): { dir: string; zipPath: string } {
  return makeZipFromEntries(Object.entries(entries).map(([name, contents]) => ({ contents, name })));
}

function makeZipFromEntries(entries: readonly ZipEntry[]): { dir: string; zipPath: string } {
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
        '    for entry in entries:',
        '        info = zipfile.ZipInfo(entry["name"])',
        '        if "externalAttr" in entry:',
        '            info.external_attr = int(entry["externalAttr"])',
        '        archive.writestr(info, entry["contents"])',
      ].join('\n'),
      zipPath,
      manifestPath,
    ],
    { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' },
  );
  return { dir, zipPath };
}

function assertValidatorRejects(fixture: { dir: string; zipPath: string }, pattern: RegExp): void {
  try {
    assert.throws(
      () => execFileSync('python3', [VALIDATOR, '--codebase-zip', fixture.zipPath], { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, pattern);
        return true;
      },
    );
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
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

test('artifact hygiene validator rejects unsafe ZIP entry metadata', () => {
  const symlinkMode = (0o120777 << 16) >>> 0;
  const characterDeviceMode = (0o020600 << 16) >>> 0;
  for (const [fixture, pattern] of [
    [makeZip({ '../escape.txt': 'escape\n' }), /parent-directory traversal/u],
    [makeZip({ 'safe/../../escape.txt': 'escape\n' }), /parent-directory traversal/u],
    [makeZip({ '/absolute.txt': 'absolute\n' }), /absolute path/u],
    [makeZip({ 'C:/absolute.txt': 'absolute\n' }), /absolute path/u],
    [makeZip({ 'safe\\..\\escape.txt': 'escape\n' }), /backslash path separator/u],
    [makeZip({ 'safe/\u0001bad.txt': 'bad\n' }), /control character/u],
    [makeZip({ './.env.local': 'LOCAL_ONLY=true\n' }), /current-directory path component/u],
    [makeZip({ 'logs/build.log/.': 'log directory marker\n' }), /current-directory path component/u],
    [makeZip({ 'safe//file.txt': 'bad\n' }), /empty\/current-directory path component/u],
    [makeZipFromEntries([
      { contents: 'first\n', name: 'README.md' },
      { contents: 'second\n', name: 'README.md' },
    ]), /duplicate path/u],
    [makeZipFromEntries([
      { contents: 'first\n', name: 'README.md' },
      { contents: 'second\n', name: './README.md' },
    ]), /current-directory path component/u],
    [makeZipFromEntries([
      { contents: 'parent\n', name: 'safe' },
      { contents: 'child\n', name: 'safe/file.txt' },
    ]), /file entry as a parent directory/u],
    [makeZipFromEntries([
      { contents: 'child\n', name: 'safe/file.txt' },
      { contents: 'parent\n', name: 'safe' },
    ]), /collides with child entries/u],
    [makeZipFromEntries([
      { contents: '../outside.txt', externalAttr: symlinkMode, name: 'linked-evidence' },
    ]), /symlink entry/u],
    [makeZipFromEntries([
      { contents: 'device\n', externalAttr: characterDeviceMode, name: 'device-entry' },
    ]), /special file entry/u],
  ] as const) {
    assertValidatorRejects(fixture, pattern);
  }
});
