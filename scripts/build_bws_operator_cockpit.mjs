import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, '..');
const DIST_DIRECTORY = resolve(REPOSITORY_ROOT, 'dist');
const COMPILED_WEB_SOURCE_DIRECTORY = resolve(DIST_DIRECTORY, 'apps/web/src');
const COMPILED_WEB_ENTRY = resolve(COMPILED_WEB_SOURCE_DIRECTORY, 'index.js');

const port = process.env.BWS_API_PORT;
if (typeof port !== 'string' || !/^\d+$/.test(port) || Number.parseInt(port, 10) <= 0) {
  throw new Error('BWS_API_PORT must be set to a base-10 positive integer before building the managed cockpit.');
}
if (!existsSync(COMPILED_WEB_ENTRY)) {
  throw new Error(
    'The root TypeScript build must produce dist/apps/web/src/index.js before building the managed cockpit.',
  );
}

const backupDirectory = mkdtempSync(join(DIST_DIRECTORY, '.bws-cockpit-source-backup-'));
const backupSourceDirectory = resolve(backupDirectory, 'src');
cpSync(COMPILED_WEB_SOURCE_DIRECTORY, backupSourceDirectory, { recursive: true });

let buildFailure;
let restoreFailure;
try {
  const apiBaseUrl = `http://127.0.0.1:${port}`;
  execFileSync(
    'npm',
    ['run', '--workspace', '@betting-win-surebet/web', 'build'],
    {
      cwd: REPOSITORY_ROOT,
      env: {
        ...process.env,
        VITE_BWS_COCKPIT_API_BASE_URL: apiBaseUrl,
        VITE_BWS_COCKPIT_DATA_MODE: 'api',
      },
      stdio: 'inherit',
    },
  );
} catch (error) {
  buildFailure = error;
} finally {
  try {
    mkdirSync(dirname(COMPILED_WEB_SOURCE_DIRECTORY), { recursive: true });
    rmSync(COMPILED_WEB_SOURCE_DIRECTORY, {
      force: true,
      maxRetries: 5,
      recursive: true,
      retryDelay: 20,
    });
    cpSync(backupSourceDirectory, COMPILED_WEB_SOURCE_DIRECTORY, { recursive: true });
    if (!existsSync(COMPILED_WEB_ENTRY)) {
      throw new Error('The managed cockpit build did not restore dist/apps/web/src/index.js.');
    }
  } catch (error) {
    restoreFailure = error;
  }
  rmSync(backupDirectory, {
    force: true,
    maxRetries: 5,
    recursive: true,
    retryDelay: 20,
  });
}

if (buildFailure !== undefined) {
  throw buildFailure;
}
if (restoreFailure !== undefined) {
  throw restoreFailure;
}
