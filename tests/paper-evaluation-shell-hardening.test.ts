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
  assert.match(script, /scripts\/bws-root-wrapper-runtime\.mjs[\s\S]*paper-runtime-evidence/);
  assert.match(script, /runtime_environment_loader=selective_root_wrapper_env/);
  assert.match(script, /runtime_environment_precedence=explicit_process_then_dotenv_fill/);
  assert.match(script, /runtime_schedule_loader=operator_approved_repo_local_manifest/);
  assert.match(script, /runtime_policy_enforcement=api_paper_provider_disabled_execution_false/);
  assert.match(script, /runtime_retired_input_scrub=export_selectors_and_pinned_bundle/);
  assert.match(script, /RUNTIME_EVIDENCE_COMMAND_TIMEOUT_SECONDS="\$\(\(DURATION_SECONDS \+ 300\)\)"/);
  assert.match(script, /automation_run_argv_command "runtime_evidence" "\$RUNTIME_EVIDENCE_COMMAND_TIMEOUT_SECONDS"/);
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
    "printf 'paper_result=%s\\n'",
    'canonical_paper_handoff_schema=1',
    'atomic_paper_handoff=enabled',
    'automation_v2_write_env_atomic',
    'SOURCE_EVIDENCE_SHA256',
    'automation_v2_zip_with_timeout',
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
