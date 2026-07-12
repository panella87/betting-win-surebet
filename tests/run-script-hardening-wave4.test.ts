import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';

const ROOT = process.cwd();

function copyExecutable(source: string, destination: string): void {
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(source, destination);
  chmodSync(destination, 0o755);
}

function combinedOutput(result: ReturnType<typeof spawnSync>): string {
  return `${result.stdout ?? ''}${result.stderr ?? ''}`;
}

function machineValue(output: string, key: string): string {
  const values = output
    .split(/\r?\n/)
    .filter((line) => line.startsWith(`${key}=`))
    .map((line) => line.slice(key.length + 1));
  assert.equal(values.length, 1, `expected exactly one ${key}= record, got ${values.length}\n${output}`);
  return values[0]!;
}

function envRecords(path: string): Map<string, string> {
  const records = new Map<string, string>();
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const index = line.indexOf('=');
    assert.ok(index > 0, `invalid env line: ${line}`);
    const key = line.slice(0, index);
    assert.equal(records.has(key), false, `duplicate env key: ${key}`);
    records.set(key, line.slice(index + 1));
  }
  return records;
}

function makeControllerRepo(): string {
  const repo = mkdtempSync(join(tmpdir(), 'surebet-wave4-'));
  for (const rel of [
    'run-paper-evaluation.sh',
    'run-autonomous-implementation.sh',
    '.automation/lib/run_common.sh',
    '.automation/lib/controller_hardening_v2.sh',
    '.automation/lib/telegram_notify.sh',
  ]) {
    copyExecutable(join(ROOT, rel), join(repo, rel));
  }

  const nodeMajor = process.versions.node.split('.')[0];
  writeFileSync(join(repo, '.nvmrc'), `${nodeMajor}\n`, 'utf8');
  writeFileSync(join(repo, 'automation.config.sh'), [
    'AUTOMATION_CONFIG_READY=1',
    'AUTOMATION_REPO_NAME=betting-win-surebet',
    'AUTOMATION_PROJECT_NAME=betting-win-surebet',
    'AUTOMATION_CODEX_SANDBOX=danger-full-access',
    'AUTOMATION_CODEX_STREAM_LOGS=0',
    'AUTOMATION_LOCK_HEARTBEAT_SECONDS=1',
    'AUTOMATION_LOCK_STALE_SECONDS=60',
    'AUTOMATION_GRACEFUL_UNLOCK_SECONDS=2',
    'AUTOMATION_VALIDATION_TIMEOUT=10s',
    'AUTOMATION_INSTALL_TIMEOUT=10s',
    'AUTOMATION_ZIP_TIMEOUT=10s',
    'AUTOMATION_CODEX_CYCLE_TIMEOUT=10s',
    'AUTOMATION_MAX_CYCLES=1',
    'AUTOMATION_MAX_CODEX_FAILURES=1',
    'AUTOMATION_MAX_CONSECUTIVE_VALIDATION_FAILURES=1',
    'AUTOMATION_PROTECTED_FILES=("run-paper-evaluation.sh" "run-autonomous-implementation.sh" "automation.config.sh" ".automation/lib/run_common.sh" ".automation/lib/controller_hardening_v2.sh" ".automation/lib/telegram_notify.sh")',
    'AUTOMATION_VALIDATION_COMMANDS=("npm run validate")',
    'AUTOMATION_IMPLEMENTATION_VALIDATION_COMMANDS=("npm run validate")',
    'AUTOMATION_BUGFIX_VALIDATION_COMMANDS=("npm run validate")',
    '',
  ].join('\n'), 'utf8');
  writeFileSync(join(repo, 'package.json'), JSON.stringify({
    name: 'surebet-wave4-stub',
    version: '1.0.0',
    private: true,
    scripts: {
      validate: "node -e \"process.exit(require('fs').existsSync('artifacts/validation-pass') ? 0 : 1)\"",
    },
  }, null, 2) + '\n', 'utf8');
  writeFileSync(join(repo, 'source.txt'), 'stable source\n', 'utf8');
  return repo;
}

test('wave-four controllers expose canonical producer and strict standalone consumer contracts', () => {
  const paper = execFileSync('bash', ['./run-paper-evaluation.sh', '--print-config'], { cwd: ROOT, encoding: 'utf8' });
  const implementation = execFileSync('bash', ['./run-autonomous-implementation.sh', '--print-config'], { cwd: ROOT, encoding: 'utf8' });

  for (const marker of [
    'canonical_paper_handoff_schema=1',
    'atomic_paper_handoff=enabled',
    'source_evidence_hash_verification=enabled',
    'bounded_artifacts_zip=enabled',
  ]) assert.match(paper, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

  for (const marker of [
    'strict_schema_v1_key_allowlists=enabled',
    'source_evidence_sha256_verification=enabled',
    'source_fingerprint_reconciliation=enabled',
    'input_handoff_immutable=enabled',
  ]) assert.match(implementation, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('paper failure emits an atomic canonical handoff that implementation verifies byte-for-byte', () => {
  const repo = makeControllerRepo();
  try {
    const paper = spawnSync('bash', ['./run-paper-evaluation.sh',
      '--duration', '20',
      '--validation-timeout', '10',
      '--zip-timeout', '10',
      '--no-stream',
    ], {
      cwd: repo,
      encoding: 'utf8',
      timeout: 30000,
      env: { ...process.env, TELEGRAM_NOTIFY: '0' },
    });
    assert.equal(paper.status, 2, combinedOutput(paper));
    const paperOutput = combinedOutput(paper);
    assert.equal(machineValue(paperOutput, 'final_status'), 'PAPER_EVALUATION_BLOCKED_REPO_VALIDATION_FAILED');
    assert.equal(machineValue(paperOutput, 'final_exit_code'), '2');
    assert.equal(machineValue(paperOutput, 'paper_result'), 'PAPER_EVALUATION_BLOCKED_REPO_VALIDATION_FAILED');

    const handoff = join(repo, '.automation', 'paper-mode-to-autonomous-implementation.env');
    assert.equal(existsSync(handoff), true);
    const originalHandoff = readFileSync(handoff);
    const records = envRecords(handoff);
    assert.equal(records.get('HANDOVER_SCHEMA_VERSION'), '1');
    assert.equal(records.get('HANDOVER_KIND'), 'paper-mode-to-autonomous-implementation');
    assert.equal(records.get('REPOSITORY'), 'betting-win-surebet');
    assert.equal(records.get('CONTROLLER'), 'run-paper-evaluation.sh');
    assert.equal(records.get('PAPER_MODE_FINAL_EXIT_CODE'), '2');
    assert.match(records.get('HANDOVER_FINGERPRINT') ?? '', /^[a-f0-9]{64}$/);
    assert.match(records.get('SOURCE_EVIDENCE_SHA256') ?? '', /^[a-f0-9]{64}$/);

    const sourceRunDir = records.get('RUN_DIR')!;
    assert.equal(basename(sourceRunDir), records.get('SOURCE_RUN_ID'));
    const evidence = join(repo, records.get('SOURCE_EVIDENCE_PATH')!);
    assert.equal(existsSync(evidence), true);
    const actualEvidenceHash = execFileSync('sha256sum', [evidence], { encoding: 'utf8' }).split(/\s+/)[0];
    assert.equal(actualEvidenceHash, records.get('SOURCE_EVIDENCE_SHA256'));
    assert.equal(readdirSync(join(repo, '.automation')).some((name) => name.includes('.tmp.')), false);

    mkdirSync(join(repo, 'artifacts'), { recursive: true });
    writeFileSync(join(repo, 'artifacts', 'validation-pass'), 'yes\n', 'utf8');
    const implementation = spawnSync('bash', ['./run-autonomous-implementation.sh',
      '--check-only',
      '--handover-paper-mode',
      '--validation-timeout', '10',
      '--zip-timeout', '10',
      '--no-stream',
    ], {
      cwd: repo,
      encoding: 'utf8',
      timeout: 30000,
      env: { ...process.env, TELEGRAM_NOTIFY: '0' },
    });
    assert.equal(implementation.status, 0, combinedOutput(implementation));
    const implementationOutput = combinedOutput(implementation);
    assert.equal(machineValue(implementationOutput, 'final_status'), 'check_only_complete');
    const implementationRun = machineValue(implementationOutput, 'run_dir');
    assert.deepEqual(
      readFileSync(join(implementationRun, 'input-paper-implementation-handoff.env')),
      originalHandoff,
      'the validated input handoff must be copied immutably into run evidence',
    );

    writeFileSync(evidence, `${readFileSync(evidence, 'utf8')}tampered=yes\n`, 'utf8');
    const tampered = spawnSync('bash', ['./run-autonomous-implementation.sh',
      '--check-only',
      '--handover-paper-mode',
      '--validation-timeout', '10',
      '--zip-timeout', '10',
      '--no-stream',
    ], {
      cwd: repo,
      encoding: 'utf8',
      timeout: 30000,
      env: { ...process.env, TELEGRAM_NOTIFY: '0' },
    });
    assert.equal(tampered.status, 2, combinedOutput(tampered));
    assert.match(combinedOutput(tampered), /source evidence SHA-256 mismatch/);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('standalone implementation rejects unknown schema-v1 handoff keys before fingerprint acceptance', () => {
  const repo = makeControllerRepo();
  try {
    const paper = spawnSync('bash', ['./run-paper-evaluation.sh', '--validation-timeout', '10', '--zip-timeout', '10', '--no-stream'], {
      cwd: repo,
      encoding: 'utf8',
      timeout: 30000,
      env: { ...process.env, TELEGRAM_NOTIFY: '0' },
    });
    assert.equal(paper.status, 2, combinedOutput(paper));
    const handoff = join(repo, '.automation', 'paper-mode-to-autonomous-implementation.env');
    const lines = readFileSync(handoff, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith('HANDOVER_FINGERPRINT='));
    lines.push('UNSUPPORTED_SCHEMA_FIELD=yes', '');
    writeFileSync(handoff, lines.join('\n'), 'utf8');
    execFileSync('bash', ['-lc', '. "$1"; automation_v2_add_or_verify_fingerprint "$2" >/dev/null', 'bash', join(repo, '.automation', 'lib', 'controller_hardening_v2.sh'), handoff]);
    mkdirSync(join(repo, 'artifacts'), { recursive: true });
    writeFileSync(join(repo, 'artifacts', 'validation-pass'), 'yes\n', 'utf8');

    const result = spawnSync('bash', ['./run-autonomous-implementation.sh', '--check-only', '--handover-paper-mode', '--validation-timeout', '10', '--zip-timeout', '10', '--no-stream'], {
      cwd: repo,
      encoding: 'utf8',
      timeout: 30000,
      env: { ...process.env, TELEGRAM_NOTIFY: '0' },
    });
    assert.equal(result.status, 2, combinedOutput(result));
    assert.match(combinedOutput(result), /unsupported handoff key for schema v1: UNSUPPORTED_SCHEMA_FIELD/);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
