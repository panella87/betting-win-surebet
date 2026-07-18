import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const LOOPBACK_ACCEPTANCE_TEST = 'dist/tests/bws-loopback-acceptance.test.js';
const ENV_FILE_PATH = resolve(ROOT, '.env');
const TEST_ENV_KEYS = Object.freeze([
  'SUREBET_TEST_ADMIN_DATABASE',
  'SUREBET_TEST_USER',
  'SUREBET_TEST_PORT',
  'SUREBET_TEST_HOST',
  'SUREBET_TEST_SOCKET_DIRECTORY',
  'SUREBET_TEST_PASSWORD',
]);
const POSTGRES_ENV_KEYS = Object.freeze([
  'POSTGRES_ADDRESS',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DB',
]);
const RETIRED_DATABASE_URL_KEYS = Object.freeze([
  'DATABASE_URL',
  'DB_URL',
  'DB_URL_TEST',
]);
const REQUIRED_TEST_ENV_KEYS = Object.freeze([
  'SUREBET_TEST_ADMIN_DATABASE',
  'SUREBET_TEST_USER',
  'SUREBET_TEST_PORT',
]);

function main() {
  const configuration = readEnvironment();
  const bettingWinRepoPath = resolve(ROOT, configuration.bettingWinRepoPath);
  if (!existsSync(bettingWinRepoPath)) {
    fail(
      `BETTING_WIN_REPO_PATH must reference an existing betting-win checkout. Received ${JSON.stringify(configuration.bettingWinRepoPath)}.`,
    );
  }

  execFileSync('npm', ['run', 'build'], {
    cwd: ROOT,
    env: configuration.childEnvironment,
    stdio: 'inherit',
  });

  const testPath = resolve(ROOT, LOOPBACK_ACCEPTANCE_TEST);
  if (!existsSync(testPath)) {
    fail(`Expected compiled acceptance test at ${LOOPBACK_ACCEPTANCE_TEST}. Run npm run build first.`);
  }

  const output = runLoopbackAcceptanceTest(configuration.childEnvironment);
  process.stdout.write(output);

  if (/\b# SKIP\b/.test(output)) {
    fail(
      'Loopback acceptance produced a skipped test. Disposable PostgreSQL proof must run or fail closed; skips are not valid BWS-510 evidence.',
    );
  }

  process.stdout.write('validate_bws_loopback_acceptance: ok\n');
}

function readEnvironment() {
  const fileEnvironment = readSelectedEnvFile(ENV_FILE_PATH, [
    'BETTING_WIN_REPO_PATH',
    ...POSTGRES_ENV_KEYS,
    ...RETIRED_DATABASE_URL_KEYS,
    ...TEST_ENV_KEYS,
  ]);
  rejectRetiredDatabaseUrlInputs(fileEnvironment);
  const bettingWinRepoPath = readProcessValue('BETTING_WIN_REPO_PATH')
    ?? fileEnvironment.get('BETTING_WIN_REPO_PATH');
  if (bettingWinRepoPath === undefined) {
    fail('Missing required loopback acceptance environment variable: BETTING_WIN_REPO_PATH');
  }

  const processTestEnvironment = readSelectedProcessEnvironment(TEST_ENV_KEYS);
  const fileTestEnvironment = readSelectedMapEnvironment(fileEnvironment, TEST_ENV_KEYS);
  const selectedTestEnvironment = selectExplicitTestEnvironment(
    processTestEnvironment,
    fileTestEnvironment,
  );

  const testEnvironment = selectedTestEnvironment
    ?? readPostgresEnvironment(readSelectedProcessEnvironment(POSTGRES_ENV_KEYS), readSelectedMapEnvironment(fileEnvironment, POSTGRES_ENV_KEYS));

  return Object.freeze({
    bettingWinRepoPath,
    childEnvironment: Object.freeze({
      ...process.env,
      BETTING_WIN_REPO_PATH: bettingWinRepoPath,
      ...testEnvironment,
    }),
  });
}

function selectExplicitTestEnvironment(processValues, fileValues) {
  if (processValues.size > 0) {
    return validateExplicitTestEnvironment(processValues, 'process environment');
  }
  if (fileValues.size > 0) {
    return validateExplicitTestEnvironment(fileValues, '.env');
  }
  return undefined;
}

function validateExplicitTestEnvironment(values, sourceLabel) {
  const missing = REQUIRED_TEST_ENV_KEYS.filter((name) => values.get(name) === undefined);
  if (missing.length > 0) {
    fail(
      `Incomplete SUREBET_TEST_* configuration in ${sourceLabel}. Missing: ${missing.join(', ')}. Do not mix a partial SUREBET_TEST_* tuple with POSTGRES_* settings.`,
    );
  }

  const host = values.get('SUREBET_TEST_HOST');
  const socketDirectory = values.get('SUREBET_TEST_SOCKET_DIRECTORY');
  if ((host === undefined && socketDirectory === undefined) || (host !== undefined && socketDirectory !== undefined)) {
    fail(`Exactly one of SUREBET_TEST_HOST or SUREBET_TEST_SOCKET_DIRECTORY must be set in ${sourceLabel} for loopback acceptance.`);
  }

  const port = parseRequiredPort(values.get('SUREBET_TEST_PORT'), 'SUREBET_TEST_PORT');
  return Object.freeze({
    SUREBET_TEST_ADMIN_DATABASE: values.get('SUREBET_TEST_ADMIN_DATABASE'),
    SUREBET_TEST_USER: values.get('SUREBET_TEST_USER'),
    SUREBET_TEST_PORT: String(port),
    ...(host === undefined ? {} : { SUREBET_TEST_HOST: host }),
    ...(socketDirectory === undefined ? {} : { SUREBET_TEST_SOCKET_DIRECTORY: socketDirectory }),
    ...(values.get('SUREBET_TEST_PASSWORD') === undefined
      ? {}
      : { SUREBET_TEST_PASSWORD: values.get('SUREBET_TEST_PASSWORD') }),
  });
}

function rejectRetiredDatabaseUrlInputs(fileEnvironment) {
  for (const key of RETIRED_DATABASE_URL_KEYS) {
    if (readProcessValue(key) !== undefined || fileEnvironment.has(key)) {
      fail(`${key} is retired for BWS loopback acceptance. Use POSTGRES_ADDRESS, POSTGRES_USER, POSTGRES_PASSWORD, and POSTGRES_DB instead.`);
    }
  }
}

function readPostgresEnvironment(processValues, fileValues) {
  const values = processValues.size > 0 ? processValues : fileValues;
  const sourceLabel = processValues.size > 0 ? 'process environment' : 'repo-local .env';
  const missing = POSTGRES_ENV_KEYS.filter((name) => values.get(name) === undefined);
  if (missing.length > 0) {
    fail(
      `Loopback acceptance requires either a complete SUREBET_TEST_* tuple or canonical POSTGRES_* settings in the process environment or repo-local .env. Missing: ${missing.join(', ')}.`,
    );
  }

  const { host, port } = parsePostgresAddress(values.get('POSTGRES_ADDRESS'), sourceLabel);
  const database = requireNonEmptyPostgresValue(values.get('POSTGRES_DB'), 'POSTGRES_DB', sourceLabel);
  const user = requireNonEmptyPostgresValue(values.get('POSTGRES_USER'), 'POSTGRES_USER', sourceLabel);
  const password = requireNonEmptyPostgresValue(values.get('POSTGRES_PASSWORD'), 'POSTGRES_PASSWORD', sourceLabel);
  if (database.includes('/')) {
    fail(`POSTGRES_DB in ${sourceLabel} must identify exactly one maintenance database.`);
  }

  return Object.freeze({
    SUREBET_TEST_ADMIN_DATABASE: database,
    SUREBET_TEST_HOST: host,
    SUREBET_TEST_PASSWORD: password,
    SUREBET_TEST_PORT: String(port),
    SUREBET_TEST_USER: user,
  });
}

function parsePostgresAddress(value, sourceLabel) {
  const raw = requireNonEmptyPostgresValue(value, 'POSTGRES_ADDRESS', sourceLabel);
  const separator = raw.lastIndexOf(':');
  if (separator <= 0 || separator === raw.length - 1) {
    fail(`POSTGRES_ADDRESS in ${sourceLabel} must use host:port format, for example 127.0.0.1:5432.`);
  }
  let host = raw.slice(0, separator);
  const rawPort = raw.slice(separator + 1);
  if (host.startsWith('[') && host.endsWith(']')) {
    host = host.slice(1, -1);
  }
  if (host.length === 0) {
    fail(`POSTGRES_ADDRESS in ${sourceLabel} must include a non-empty host.`);
  }
  const port = parseRequiredPort(rawPort, 'POSTGRES_ADDRESS port');
  return Object.freeze({ host, port });
}

function requireNonEmptyPostgresValue(value, name, sourceLabel) {
  if (value === undefined || value.trim().length === 0) {
    fail(`${name} in ${sourceLabel} must be a non-empty string.`);
  }
  return value.trim();
}

function readSelectedProcessEnvironment(names) {
  const values = new Map();
  for (const name of names) {
    const value = readProcessValue(name);
    if (value !== undefined) {
      values.set(name, value);
    }
  }
  return values;
}

function readSelectedMapEnvironment(environment, names) {
  const values = new Map();
  for (const name of names) {
    const value = environment.get(name);
    if (value !== undefined) {
      values.set(name, value);
    }
  }
  return values;
}

function readSelectedEnvFile(path, names) {
  const selectedNames = new Set(names);
  const values = new Map();
  if (!existsSync(path)) {
    return values;
  }

  const lines = readFileSync(path, 'utf-8').split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) {
      continue;
    }
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(trimmed);
    if (match === null || !selectedNames.has(match[1])) {
      continue;
    }
    const name = match[1];
    if (values.has(name)) {
      fail(`Duplicate ${name} entries in .env are not allowed.`);
    }
    values.set(name, parseEnvFileValue(match[2], name, index + 1));
  }
  return values;
}

function parseEnvFileValue(rawValue, name, lineNumber) {
  const value = rawValue.trim();
  if (value.length === 0) {
    fail(`${name} in .env line ${lineNumber} must not be empty.`);
  }
  const first = value[0];
  const last = value[value.length - 1];
  if (first === '"' || first === "'") {
    if (last !== first || value.length < 2) {
      fail(`${name} in .env line ${lineNumber} has mismatched quotes.`);
    }
    return value.slice(1, -1);
  }
  if (value.includes(' ')) {
    fail(`${name} in .env line ${lineNumber} must be quoted when it contains spaces.`);
  }
  return value;
}

function readProcessValue(name) {
  const value = process.env[name];
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function parseRequiredPort(rawValue, label) {
  const port = Number.parseInt(rawValue ?? '', 10);
  if (!/^[0-9]+$/.test(rawValue ?? '') || !Number.isInteger(port) || port <= 0 || port > 65535) {
    fail(`${label} must be an explicit integer between 1 and 65535 for loopback acceptance.`);
  }
  return port;
}

function runLoopbackAcceptanceTest(environment) {
  try {
    return execFileSync(
      process.execPath,
      ['--test', '--test-concurrency=1', LOOPBACK_ACCEPTANCE_TEST],
      {
        cwd: ROOT,
        encoding: 'utf-8',
        env: environment,
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
