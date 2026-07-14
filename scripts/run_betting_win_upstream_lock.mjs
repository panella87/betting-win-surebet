import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DIST_MODULE = resolve(ROOT, 'dist/src/upstream/betting-win-upstream-lock.js');
const LOCK_PATH = resolve(ROOT, 'config/betting-win.upstream.lock.json');

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

if (!existsSync(DIST_MODULE)) {
  fail('missing built upstream lock module. Run `npm run build` first.');
}

const { UpstreamVerificationError, readBettingWinUpstreamLock, verifyBettingWinUpstreamLock, writeBettingWinUpstreamLock } = await import(
  `file://${DIST_MODULE}`
);

const mode = process.argv[2] ?? 'generate';

try {
  if (mode === 'generate') {
    const lock = writeBettingWinUpstreamLock();
    console.log(JSON.stringify(lock, null, 2));
    process.exit(0);
  }
  if (mode === 'verify') {
    const lock = readBettingWinUpstreamLock(LOCK_PATH, ROOT);
    const verified = verifyBettingWinUpstreamLock(lock);
    console.log(JSON.stringify(verified, null, 2));
    process.exit(0);
  }
  fail(`unsupported mode: ${mode}`);
} catch (error) {
  if (error instanceof UpstreamVerificationError) {
    fail(`${error.code}: ${error.message}`);
  }
  fail(error instanceof Error ? error.message : String(error));
}
