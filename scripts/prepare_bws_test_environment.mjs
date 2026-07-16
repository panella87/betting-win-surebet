import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, '..');
const ARTIFACTS_DIRECTORY = resolve(REPOSITORY_ROOT, 'artifacts');
const COMPILED_WEB_ENTRY = resolve(REPOSITORY_ROOT, 'dist/apps/web/src/index.js');
const UPSTREAM_LOCK_FILE = resolve(REPOSITORY_ROOT, 'config/betting-win.upstream.lock.json');

mkdirSync(ARTIFACTS_DIRECTORY, { recursive: true });

if (!existsSync(COMPILED_WEB_ENTRY)) {
  throw new Error(
    'Compiled BWS web modules are missing. Run the root TypeScript build before preparing the test environment.',
  );
}
if (!existsSync(UPSTREAM_LOCK_FILE)) {
  throw new Error(
    'The generated betting-win upstream lock is missing. Run generate:upstream-lock and verify:upstream-lock before the compiled test suite.',
  );
}

const upstreamLock = JSON.parse(readFileSync(UPSTREAM_LOCK_FILE, 'utf-8'));
if (
  upstreamLock === null
  || typeof upstreamLock !== 'object'
  || Array.isArray(upstreamLock)
  || upstreamLock.schema !== 'betting-win-surebet-upstream-lock-v1'
  || upstreamLock.sourceView !== 'committed_git_head'
) {
  throw new Error('The generated betting-win upstream lock is not a verified committed-HEAD lock.');
}

process.stdout.write(`test_artifacts_directory=${ARTIFACTS_DIRECTORY}\n`);
process.stdout.write(`test_compiled_web_entry=${COMPILED_WEB_ENTRY}\n`);
process.stdout.write(`test_upstream_lock=${UPSTREAM_LOCK_FILE}\n`);
