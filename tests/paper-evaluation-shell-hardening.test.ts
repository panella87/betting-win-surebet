import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const SCRIPT = join(REPO_ROOT, 'run-paper-evaluation.sh');

function readScript(): string {
  return readFileSync(SCRIPT, 'utf-8');
}

function combinedOutput(error: unknown): string {
  const err = error as { stderr?: Buffer | string; stdout?: Buffer | string };
  return `${err.stdout?.toString() ?? ''}${err.stderr?.toString() ?? ''}`;
}

test('paper evaluation preflights pinned input before run creation and expensive validation', () => {
  const script = readScript();
  const preflightCall = script.indexOf('validate_pinned_bundle_preflight || exit 2');
  const runCreation = script.indexOf('automation_create_run_dir "paper_evaluation"');
  const repoValidation = script.indexOf('run_repo_validation "$CYCLE_DIR/source-validation"');

  assert.ok(preflightCall >= 0, 'expected pinned-bundle preflight call');
  assert.ok(runCreation > preflightCall, 'preflight must happen before run-directory creation');
  assert.ok(repoValidation > runCreation, 'repo validation must happen after run-directory creation');

  assert.throws(
    () => execFileSync('bash', ['./run-paper-evaluation.sh', '--duration', '1s'], {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      env: {
        ...process.env,
        SUREBET_PINNED_BUNDLE: 'path/to/nonexistent-pinned-betting-win-export.json',
        SUREBET_REQUIRE_PINNED_BUNDLE: '0',
      },
      stdio: 'pipe',
    }),
    (error: unknown) => {
      const output = combinedOutput(error);
      assert.match(output, /SUREBET_PINNED_BUNDLE must point to an existing file/);
      assert.doesNotMatch(output, /repo_validation|private_fixture_smoke/);
      return true;
    },
  );
});

test('paper evaluation rejects symlinked pinned-bundle paths during preflight', () => {
  const testDir = join(REPO_ROOT, 'artifacts', 'paper-preflight-symlink-test');
  const linkPath = join(testDir, 'pinned.json');
  const targetPath = join(REPO_ROOT, 'tests', 'fixtures', 'private-paper-mode-smoke', 'accepted-local-bundle.json');
  rmSync(testDir, { recursive: true, force: true });
  mkdirSync(testDir, { recursive: true });
  symlinkSync(targetPath, linkPath);

  try {
    assert.throws(
      () => execFileSync('bash', ['./run-paper-evaluation.sh', '--duration', '1s'], {
        cwd: REPO_ROOT,
        encoding: 'utf-8',
        env: {
          ...process.env,
          SUREBET_PINNED_BUNDLE: 'artifacts/paper-preflight-symlink-test/pinned.json',
          SUREBET_REQUIRE_PINNED_BUNDLE: '0',
        },
        stdio: 'pipe',
      }),
      (error: unknown) => {
        const output = combinedOutput(error);
        assert.match(output, /must not contain symlink path components/);
        assert.doesNotMatch(output, /repo_validation|private_fixture_smoke/);
        return true;
      },
    );
  } finally {
    rmSync(testDir, { recursive: true, force: true });
  }
});

test('paper evaluation runs known report commands as direct argv', () => {
  const script = readScript();
  assert.match(script, /automation_run_argv_command "private_fixture_smoke"/);
  assert.match(script, /automation_run_argv_command "pinned_bundle_smoke"/);
  assert.match(script, /cmd=\(node cli\.js local-report --bundle "\$LOCAL_FIXTURE_BUNDLE" --output "\$out_rel"\)/);
  assert.match(script, /cmd=\(node cli\.js local-report --bundle "\$PINNED_BUNDLE_PATH" --output "\$out_rel" --pinned-intake\)/);
  assert.doesNotMatch(script, /paper_shell_quote\(\)/);
  assert.doesNotMatch(script, /automation_run_shell_command "(?:private_fixture_smoke|pinned_bundle_smoke)"/);
});

test('paper evaluation exposes explicit single-pass and read-only contracts', () => {
  const script = readScript();
  for (const marker of [
    'controller_mode=single_pass_no_service',
    'duration_semantics=maximum_controller_budget_not_monitoring_runtime',
    'interval_semantics=workflow_compatibility_no_wait_in_single_pass_mode',
    'verify_paper_read_only_state()',
    'PAPER_EVALUATION_BLOCKED_SOURCE_MUTATION',
    "printf 'run_dir=%s\\n'",
    "printf 'final_status=%s\\n'",
    "printf 'final_exit_code=%s\\n'",
  ]) {
    assert.ok(script.includes(marker), `expected marker: ${marker}`);
  }
});

test('paper evaluation accepts only strict SUREBET_REQUIRE_PINNED_BUNDLE values', () => {
  const valid = execFileSync('bash', ['./run-paper-evaluation.sh', '--print-config'], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    env: { ...process.env, SUREBET_REQUIRE_PINNED_BUNDLE: '1' },
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
      const output = combinedOutput(error);
      assert.match(output, /SUREBET_REQUIRE_PINNED_BUNDLE must be unset, 0, or 1/);
      return true;
    },
  );
});
