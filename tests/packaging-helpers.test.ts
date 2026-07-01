import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const ZIP_CODEBASE = join(REPO_ROOT, 'zip_codebase.sh');
const PULL_AND_ZIP = join(REPO_ROOT, 'pull_artifacts_and_zip_codebase.sh');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

test('zip_codebase help documents clean local packaging exclusions', () => {
  const output = execFileSync('bash', [ZIP_CODEBASE, '--help'], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    stdio: 'pipe',
  });

  assert.match(output, /Creates a clean local codebase ZIP for betting-win-surebet\./);
  assert.match(output, /Secrets, \.env files, dependencies, build output, logs, artifacts, and generated archives are excluded\./);
});

test('zip_codebase validates the temporary archive before publish', () => {
  const script = read(ZIP_CODEBASE);

  assert.match(script, /publish_contract=validated_temp_archive_then_atomic_replace/);
  assert.match(script, /python3 scripts\/validate_artifact_hygiene\.py --codebase-zip "\$TMP_CODEBASE" >/);
  assert.match(script, /mv -f -- "\$TMP_CODEBASE" "\$LOCAL_CODEBASE_ZIP"/);
});

test('pull_artifacts_and_zip_codebase delegates codebase creation to the repo-local helper', () => {
  const help = execFileSync('bash', [PULL_AND_ZIP, '--help'], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    stdio: 'pipe',
  });
  const script = read(PULL_AND_ZIP);

  assert.match(help, /The codebase archive is created by repo-local \.\/zip_codebase\.sh\./);
  assert.match(script, /repo zip_codebase\.sh not found: \$LOCAL_ROOT\/zip_codebase\.sh/);
  assert.match(script, /CODEBASE_OUTPUT="\$TMP_CODEBASE" LOCAL_ROOT="\$LOCAL_ROOT" CODEBASE_OVERWRITE=0 bash "\$LOCAL_ROOT\/zip_codebase\.sh"/);
});
