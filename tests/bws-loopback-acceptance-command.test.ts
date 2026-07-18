import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = process.cwd();
const SCRIPT = join(ROOT, 'scripts', 'validate_bws_loopback_acceptance.mjs');

const VALID_POSTGRES_ENV: Readonly<Record<string, string>> = Object.freeze({
  POSTGRES_ADDRESS: '127.0.0.1:5432',
  POSTGRES_DB: 'betting_win_surebet',
  POSTGRES_PASSWORD: 'private-password',
  POSTGRES_USER: 'betting_win',
});

const CLEARED_DATABASE_ENV: Partial<NodeJS.ProcessEnv> = Object.freeze({
  DB_URL: undefined,
  DB_URL_TEST: undefined,
  POSTGRES_ADDRESS: undefined,
  POSTGRES_DB: undefined,
  POSTGRES_PASSWORD: undefined,
  POSTGRES_USER: undefined,
  SUREBET_TEST_ADMIN_DATABASE: undefined,
  SUREBET_TEST_HOST: undefined,
  SUREBET_TEST_PASSWORD: undefined,
  SUREBET_TEST_PORT: undefined,
  SUREBET_TEST_SOCKET_DIRECTORY: undefined,
  SUREBET_TEST_USER: undefined,
});

test('loopback acceptance validator fails closed when BETTING_WIN_REPO_PATH is missing', () => {
  withTemporaryWorkingDirectory((cwd) => {
    const error = captureFailure(
      {
        ...CLEARED_DATABASE_ENV,
        ...VALID_POSTGRES_ENV,
        BETTING_WIN_REPO_PATH: undefined,
      },
      cwd,
    );

    assert.match(
      error.output,
      /Missing required loopback acceptance environment variable: BETTING_WIN_REPO_PATH/,
    );
  });
});

test('loopback acceptance validator fails closed when neither supported database config shape is present', () => {
  withTemporaryWorkingDirectory((cwd) => {
    const error = captureFailure(
      {
        ...CLEARED_DATABASE_ENV,
        BETTING_WIN_REPO_PATH: cwd,
      },
      cwd,
    );

    assert.match(
      error.output,
      /requires either a complete SUREBET_TEST_\* tuple or canonical POSTGRES_\* settings/,
    );
  });
});

test('loopback acceptance validator fails closed when host and socket directory are both configured', () => {
  withTemporaryWorkingDirectory((cwd) => {
    const error = captureFailure(
      {
        ...CLEARED_DATABASE_ENV,
        BETTING_WIN_REPO_PATH: cwd,
        SUREBET_TEST_ADMIN_DATABASE: 'postgres',
        SUREBET_TEST_USER: 'postgres',
        SUREBET_TEST_PORT: '5432',
        SUREBET_TEST_HOST: '127.0.0.1',
        SUREBET_TEST_SOCKET_DIRECTORY: '/var/run/postgresql',
      },
      cwd,
    );

    assert.match(
      error.output,
      /Exactly one of SUREBET_TEST_HOST or SUREBET_TEST_SOCKET_DIRECTORY must be set in process environment for loopback acceptance/,
    );
  });
});

test('loopback acceptance validator rejects a partial SUREBET_TEST tuple instead of mixing it with POSTGRES settings', () => {
  withTemporaryWorkingDirectory((cwd) => {
    const error = captureFailure(
      {
        ...CLEARED_DATABASE_ENV,
        ...VALID_POSTGRES_ENV,
        BETTING_WIN_REPO_PATH: cwd,
        SUREBET_TEST_USER: 'betting_win',
      },
      cwd,
    );

    assert.match(error.output, /Incomplete SUREBET_TEST_\* configuration in process environment/);
    assert.match(error.output, /Do not mix a partial SUREBET_TEST_\* tuple with POSTGRES_\* settings/);
  });
});

test('loopback acceptance validator derives the disposable database tuple from process POSTGRES settings', () => {
  withTemporaryWorkingDirectory((cwd) => {
    const missingCheckout = join(cwd, 'missing-betting-win-checkout');
    const error = captureFailure(
      {
        ...CLEARED_DATABASE_ENV,
        ...VALID_POSTGRES_ENV,
        BETTING_WIN_REPO_PATH: missingCheckout,
      },
      cwd,
    );

    assert.match(error.output, /BETTING_WIN_REPO_PATH must reference an existing betting-win checkout/);
    assert.doesNotMatch(error.output, /Missing required loopback acceptance environment variables/);
    assert.doesNotMatch(error.output, /private-password/);
  });
});

test('loopback acceptance validator reads POSTGRES settings from the repo-local .env without printing credentials', () => {
  withTemporaryWorkingDirectory((cwd) => {
    writeFileSync(
      join(cwd, '.env'),
      [
        'POSTGRES_ADDRESS=127.0.0.1:5432',
        'POSTGRES_USER=betting_win',
        'POSTGRES_PASSWORD=private-password',
        'POSTGRES_DB=betting_win_surebet',
        '',
      ].join('\n'),
      'utf-8',
    );
    const missingCheckout = join(cwd, 'missing-betting-win-checkout');
    const error = captureFailure(
      {
        ...CLEARED_DATABASE_ENV,
        BETTING_WIN_REPO_PATH: missingCheckout,
      },
      cwd,
    );

    assert.match(error.output, /BETTING_WIN_REPO_PATH must reference an existing betting-win checkout/);
    assert.doesNotMatch(error.output, /private-password/);
  });
});

test('loopback acceptance validator rejects malformed POSTGRES_ADDRESS without exposing the password', () => {
  withTemporaryWorkingDirectory((cwd) => {
    const error = captureFailure(
      {
        ...CLEARED_DATABASE_ENV,
        ...VALID_POSTGRES_ENV,
        BETTING_WIN_REPO_PATH: cwd,
        POSTGRES_ADDRESS: '127.0.0.1',
      },
      cwd,
    );

    assert.match(error.output, /POSTGRES_ADDRESS in process environment must use host:port format/);
    assert.doesNotMatch(error.output, /private-password/);
  });
});

test('loopback acceptance validator rejects retired DB_URL_TEST without exposing its value', () => {
  withTemporaryWorkingDirectory((cwd) => {
    const error = captureFailure(
      {
        ...CLEARED_DATABASE_ENV,
        ...VALID_POSTGRES_ENV,
        BETTING_WIN_REPO_PATH: cwd,
        DB_URL_TEST: ['postgresql', '://betting_win:do-not-print@127.0.0.1:5432/betting_win_surebet_test'].join(''),
      },
      cwd,
    );

    assert.match(error.output, /DB_URL_TEST is retired for BWS loopback acceptance/);
    assert.doesNotMatch(error.output, /do-not-print/);
  });
});

test('loopback acceptance validator fails closed when BETTING_WIN_REPO_PATH does not exist', () => {
  withTemporaryWorkingDirectory((cwd) => {
    const error = captureFailure(
      {
        ...CLEARED_DATABASE_ENV,
        BETTING_WIN_REPO_PATH: join(cwd, 'missing-betting-win-checkout'),
        SUREBET_TEST_ADMIN_DATABASE: 'postgres',
        SUREBET_TEST_USER: 'postgres',
        SUREBET_TEST_PORT: '5432',
        SUREBET_TEST_HOST: '127.0.0.1',
      },
      cwd,
    );

    assert.match(
      error.output,
      /BETTING_WIN_REPO_PATH must reference an existing betting-win checkout/,
    );
  });
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

function captureFailure(
  overrides: Partial<NodeJS.ProcessEnv>,
  cwd: string = ROOT,
): {
  readonly output: string;
  readonly status: number;
} {
  try {
    execFileSync(process.execPath, [SCRIPT], {
      cwd,
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

function withTemporaryWorkingDirectory(callback: (cwd: string) => void): void {
  const cwd = mkdtempSync(join(tmpdir(), 'bws-loopback-command-'));
  try {
    callback(cwd);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
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
