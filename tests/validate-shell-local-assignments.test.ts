import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const REPO_ROOT = process.cwd();
const VALIDATOR = join(REPO_ROOT, 'scripts', 'validate_shell_local_assignments.py');

function writeShellFixture(contents: string): { dir: string; path: string } {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-shell-validator-'));
  const path = join(dir, 'fixture.sh');
  writeFileSync(path, contents, { encoding: 'utf-8' });
  return { dir, path };
}

test('shell local assignment validator rejects same-line dependent local expansion', () => {
  const fixture = writeShellFixture('#!/usr/bin/env bash\nf(){\n  local root=\"/tmp\" child=\"$root/file\"\n}\n');
  try {
    assert.throws(
      () => execFileSync('python3', [VALIDATOR, '--path', fixture.path], { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /declares local root= and references it on the same local line/);
        return true;
      },
    );
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test('shell local assignment validator accepts split local assignments', () => {
  const fixture = writeShellFixture('#!/usr/bin/env bash\nf(){\n  local root=\"/tmp\"\n  local child=\"$root/file\"\n}\n');
  try {
    const output = execFileSync('python3', [VALIDATOR, '--path', fixture.path], { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' });
    assert.match(output, /validate_shell_local_assignments: ok/);
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});
