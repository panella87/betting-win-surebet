import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const SCRIPT = join(REPO_ROOT, 'run-paper-evaluation.sh');

function readScript(): string {
  return readFileSync(SCRIPT, 'utf-8');
}

test('paper evaluation shell-quotes bundle and output paths before bash -lc execution', () => {
  const script = readScript();
  assert.match(script, /paper_shell_quote\(\)/);
  assert.match(script, /--bundle \$\(paper_shell_quote "\$LOCAL_FIXTURE_BUNDLE"\)/);
  assert.match(script, /--bundle \$\(paper_shell_quote "\$PINNED_BUNDLE_PATH"\)/);
  assert.match(script, /--output \$\(paper_shell_quote "\$out_rel"\)/);
  assert.doesNotMatch(script, /--bundle \$\{PINNED_BUNDLE_PATH\}/);
  assert.doesNotMatch(script, /--bundle \$\{LOCAL_FIXTURE_BUNDLE\}/);
});

test('paper evaluation accepts only strict SUREBET_REQUIRE_PINNED_BUNDLE values', () => {
  const valid = execFileSync('bash', ['./run-paper-evaluation.sh', '--print-config'], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    env: { ...process.env, SUREBET_REQUIRE_PINNED_BUNDLE: '1', SUREBET_PINNED_BUNDLE: 'tests/fixtures/private-paper-mode-smoke/accepted-local-bundle.json' },
  });
  assert.match(valid, /surebet_require_pinned_bundle=1/);

  assert.throws(
    () => execFileSync('bash', ['./run-paper-evaluation.sh', '--print-config'], {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      env: { ...process.env, SUREBET_REQUIRE_PINNED_BUNDLE: 'true' },
      stdio: 'pipe',
    }),
    (error: unknown) => {
      const err = error as { stderr?: Buffer | string; stdout?: Buffer | string };
      const output = `${err.stdout?.toString() ?? ''}${err.stderr?.toString() ?? ''}`;
      assert.match(output, /SUREBET_REQUIRE_PINNED_BUNDLE must be unset, 0, or 1/);
      return true;
    },
  );
});


test('paper evaluation fails fast for placeholder pinned bundle paths', () => {
  assert.throws(
    () => execFileSync('bash', ['./run-paper-evaluation.sh', '--print-config'], {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      env: { ...process.env, SUREBET_PINNED_BUNDLE: 'path/to/pinned-betting-win-export.json' },
      stdio: 'pipe',
    }),
    (error: unknown) => {
      const err = error as { stderr?: Buffer | string; stdout?: Buffer | string };
      const output = `${err.stdout?.toString() ?? ''}${err.stderr?.toString() ?? ''}`;
      assert.match(output, /SUREBET_PINNED_BUNDLE must point to an existing repo-local JSON file/);
      return true;
    },
  );
});

test('paper evaluation fails fast when a pinned bundle is required but missing', () => {
  assert.throws(
    () => execFileSync('bash', ['./run-paper-evaluation.sh', '--print-config'], {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      env: { ...process.env, SUREBET_REQUIRE_PINNED_BUNDLE: '1', SUREBET_PINNED_BUNDLE: '' },
      stdio: 'pipe',
    }),
    (error: unknown) => {
      const err = error as { stderr?: Buffer | string; stdout?: Buffer | string };
      const output = `${err.stdout?.toString() ?? ''}${err.stderr?.toString() ?? ''}`;
      assert.match(output, /SUREBET_REQUIRE_PINNED_BUNDLE=1 requires SUREBET_PINNED_BUNDLE/);
      return true;
    },
  );
});
