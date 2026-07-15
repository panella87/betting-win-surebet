import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SCRIPT = join(ROOT, 'scripts', 'validate_bws_loopback_acceptance.mjs');

test('loopback acceptance validator fails closed when required environment variables are missing', () => {
  const error = captureFailure({
    BETTING_WIN_REPO_PATH: undefined,
    SUREBET_TEST_ADMIN_DATABASE: undefined,
    SUREBET_TEST_USER: undefined,
    SUREBET_TEST_PORT: undefined,
    SUREBET_TEST_HOST: undefined,
    SUREBET_TEST_SOCKET_DIRECTORY: undefined,
    SUREBET_TEST_PASSWORD: undefined,
  });

  assert.match(
    error.output,
    /Missing required loopback acceptance environment variables: BETTING_WIN_REPO_PATH, SUREBET_TEST_ADMIN_DATABASE, SUREBET_TEST_USER, SUREBET_TEST_PORT/,
  );
});

test('loopback acceptance validator fails closed when host and socket directory are both configured', () => {
  const error = captureFailure({
    BETTING_WIN_REPO_PATH: ROOT,
    SUREBET_TEST_ADMIN_DATABASE: 'postgres',
    SUREBET_TEST_USER: 'postgres',
    SUREBET_TEST_PORT: '5432',
    SUREBET_TEST_HOST: '127.0.0.1',
    SUREBET_TEST_SOCKET_DIRECTORY: '/var/run/postgresql',
    SUREBET_TEST_PASSWORD: undefined,
  });

  assert.match(
    error.output,
    /Exactly one of SUREBET_TEST_HOST or SUREBET_TEST_SOCKET_DIRECTORY must be set for loopback acceptance/,
  );
});

test('loopback acceptance validator fails closed when BETTING_WIN_REPO_PATH does not exist', () => {
  const error = captureFailure({
    BETTING_WIN_REPO_PATH: join(ROOT, 'missing-betting-win-checkout'),
    SUREBET_TEST_ADMIN_DATABASE: 'postgres',
    SUREBET_TEST_USER: 'postgres',
    SUREBET_TEST_PORT: '5432',
    SUREBET_TEST_HOST: '127.0.0.1',
    SUREBET_TEST_SOCKET_DIRECTORY: undefined,
    SUREBET_TEST_PASSWORD: undefined,
  });

  assert.match(
    error.output,
    /BETTING_WIN_REPO_PATH must reference an existing betting-win checkout/,
  );
});

test('loopback acceptance validator is part of the root validation chain', () => {
  const packageJson = JSON.parse(
    readFileSync(join(ROOT, 'package.json'), 'utf-8'),
  ) as {
    scripts?: Record<string, string>;
  };

  assert.match(
    packageJson.scripts?.['validate:starter'] ?? '',
    /npm run validate:loopback-acceptance/,
  );
});

function captureFailure(overrides: Partial<NodeJS.ProcessEnv>): {
  readonly output: string;
  readonly status: number;
} {
  try {
    execFileSync(process.execPath, [SCRIPT], {
      cwd: ROOT,
      encoding: 'utf-8',
      env: mergeEnvironment(overrides),
      stdio: 'pipe',
    });
  } catch (error) {
    if (isExecFileSyncError(error)) {
      return Object.freeze({
        output: `${error.stdout ?? ''}${error.stderr ?? ''}`,
        status: error.status ?? 1,
      });
    }

    throw error;
  }

  throw new Error('Expected loopback acceptance validator to fail closed.');
}

function mergeEnvironment(overrides: Partial<NodeJS.ProcessEnv>): NodeJS.ProcessEnv {
  const next = { ...process.env };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete next[key];
      continue;
    }

    next[key] = value;
  }

  return next;
}

function isExecFileSyncError(error: unknown): error is {
  readonly status?: number;
  readonly stderr?: string | Buffer;
  readonly stdout?: string | Buffer;
} {
  return typeof error === 'object' && error !== null && 'status' in error;
}
