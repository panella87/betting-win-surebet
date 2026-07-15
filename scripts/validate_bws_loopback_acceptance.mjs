import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const LOOPBACK_ACCEPTANCE_TEST = 'dist/tests/bws-loopback-acceptance.test.js';
const REQUIRED_ENV_VARS = Object.freeze([
  'BETTING_WIN_REPO_PATH',
  'SUREBET_TEST_ADMIN_DATABASE',
  'SUREBET_TEST_USER',
  'SUREBET_TEST_PORT',
]);

function main() {
  const environment = readEnvironment();
  const bettingWinRepoPath = resolve(ROOT, environment.BETTING_WIN_REPO_PATH);
  if (!existsSync(bettingWinRepoPath)) {
    fail(
      `BETTING_WIN_REPO_PATH must reference an existing betting-win checkout. Received ${JSON.stringify(environment.BETTING_WIN_REPO_PATH)}.`,
    );
  }

  execFileSync('npm', ['run', 'build'], {
    cwd: ROOT,
    env: process.env,
    stdio: 'inherit',
  });

  const testPath = resolve(ROOT, LOOPBACK_ACCEPTANCE_TEST);
  if (!existsSync(testPath)) {
    fail(`Expected compiled acceptance test at ${LOOPBACK_ACCEPTANCE_TEST}. Run npm run build first.`);
  }

  const output = runLoopbackAcceptanceTest();
  process.stdout.write(output);

  if (/\b# SKIP\b/.test(output)) {
    fail(
      'Loopback acceptance produced a skipped test. Disposable PostgreSQL proof must run or fail closed; skips are not valid BWS-510 evidence.',
    );
  }

  process.stdout.write('validate_bws_loopback_acceptance: ok\n');
}

function readEnvironment() {
  const missing = REQUIRED_ENV_VARS.filter((name) => readOptionalEnv(name) === undefined);
  if (missing.length > 0) {
    fail(`Missing required loopback acceptance environment variables: ${missing.join(', ')}`);
  }

  const host = readOptionalEnv('SUREBET_TEST_HOST');
  const socketDirectory = readOptionalEnv('SUREBET_TEST_SOCKET_DIRECTORY');
  if ((host === undefined && socketDirectory === undefined) || (host !== undefined && socketDirectory !== undefined)) {
    fail('Exactly one of SUREBET_TEST_HOST or SUREBET_TEST_SOCKET_DIRECTORY must be set for loopback acceptance.');
  }

  const port = Number.parseInt(process.env.SUREBET_TEST_PORT ?? '', 10);
  if (!Number.isInteger(port) || port <= 0) {
    fail('SUREBET_TEST_PORT must be a positive integer for loopback acceptance.');
  }

  return Object.freeze({
    BETTING_WIN_REPO_PATH: process.env.BETTING_WIN_REPO_PATH,
  });
}

function readOptionalEnv(name) {
  const value = process.env[name];
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function runLoopbackAcceptanceTest() {
  try {
    return execFileSync(
      process.execPath,
      ['--test', '--test-concurrency=1', LOOPBACK_ACCEPTANCE_TEST],
      {
        cwd: ROOT,
        encoding: 'utf-8',
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
  } catch (error) {
    if (isExecFileSyncError(error)) {
      writeFailureOutput(error);
      process.exit(error.status ?? 1);
    }

    throw error;
  }
}

function writeFailureOutput(error) {
  if (typeof error.stdout === 'string' && error.stdout.length > 0) {
    process.stdout.write(error.stdout);
  }
  if (typeof error.stderr === 'string' && error.stderr.length > 0) {
    process.stderr.write(error.stderr);
  }
}

function isExecFileSyncError(error) {
  return typeof error === 'object' && error !== null && 'status' in error;
}

function fail(message) {
  process.stderr.write(`validate_bws_loopback_acceptance: ${message}\n`);
  process.exit(1);
}

main();
